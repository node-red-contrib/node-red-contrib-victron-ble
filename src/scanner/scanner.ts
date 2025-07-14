import { Peripheral } from '@abandonware/noble';
import { Device, DeviceData } from '../devices/base';
import { detectDeviceType } from '../devices';
import { AdvertisementKeyMissingError, UnknownDeviceError } from '../exceptions';
import { BaseScanner } from './base-scanner';
import { EventEmitter } from 'events';

function deviceDataToJson(obj: DeviceData): Record<string, any> {
  const data: Record<string, any> = {};
  const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(obj)).filter(
    (name) => name.startsWith('get') && typeof (obj as any)[name] === 'function'
  );
  for (const methodName of methods) {
    const value = (obj as any)[methodName]();
    if (value !== null && value !== undefined) {
      const prop = methodName.slice(3);
      const propName = prop.charAt(0).toLowerCase() + prop.slice(1);
      if (
        typeof value === 'object' &&
        value.constructor &&
        value.constructor.name !== 'Object'
      ) {
        data[propName] = value.toString().toLowerCase();
      } else {
        data[propName] = value;
      }
    }
  }
  
  // Add modeName to the payload
  const modelName = obj.getModelName();
  if (modelName) {
    data.modelName = modelName;
  }
  
  return data;
}

export interface DiscoveredDevice {
  address: string;
  name: string;
  rssi: number;
  lastSeen: number;
  lastRaw: Buffer;
  lastParsed?: Record<string, any>;
}

export class Scanner extends BaseScanner {
  private deviceKeys: Record<string, string>;
  private knownDevices: Record<string, Device>;
  private discovered: Map<string, DiscoveredDevice>;
  private emitter: EventEmitter;

  constructor() {
    super();
    this.deviceKeys = {};
    this.knownDevices = {};
    this.discovered = new Map();
    this.emitter = new EventEmitter();
  }

  async start(): Promise<void> {
    await super.start();
  }

  stop(): Promise<void> {
    return super.stop();
  }

  setKey(address: string, key: string): void {
    this.deviceKeys[address.toLowerCase()] = key;
    // Remove cached device so it will be recreated with the new key
    delete this.knownDevices[address.toLowerCase()];
  }

  getDiscoveredDevices(): DiscoveredDevice[] {
    return Array.from(this.discovered.values()).map(dev => ({
      address: dev.address,
      name: dev.name,
      rssi: dev.rssi,
      lastSeen: dev.lastSeen,
      lastRaw: dev.lastRaw
    }));
  }

  on(event: 'packet', listener: (data: any) => void): void {
    this.emitter.on(event, listener);
  }

  private getDevice(peripheral: Peripheral, rawData: Buffer): Device {
    const deviceAddress = peripheral.address || peripheral.id || 'Unknown';
    const address = deviceAddress.toLowerCase();
    if (!(address in this.knownDevices)) {
      const key = this.deviceKeys[address];
      if (!key) throw new AdvertisementKeyMissingError(`No key for ${address}`);
      const deviceClass = detectDeviceType(rawData);
      if (!deviceClass) throw new UnknownDeviceError(`Could not identify device type for ${deviceAddress}`);
      this.knownDevices[address] = new deviceClass(key);
    }
    return this.knownDevices[address];
  }

  callback(peripheral: Peripheral, rawData: Buffer): void {
    const deviceAddress = peripheral.address || peripheral.id || 'Unknown';
    const address = deviceAddress.toLowerCase();
    const now = Date.now();
    const name = peripheral.advertisement.localName || 'Unknown';
    const rssi = peripheral.rssi;
    // Update discovered device info
    let dev = this.discovered.get(address);
    if (!dev) {
      dev = { address, name, rssi, lastSeen: now, lastRaw: rawData };
      this.discovered.set(address, dev);
    } else {
      dev.name = name;
      dev.rssi = rssi;
      dev.lastSeen = now;
      dev.lastRaw = rawData;
    }
    // Try to parse if we have a key
    if (this.deviceKeys[address]) {
      try {
        const device = this.getDevice(peripheral, rawData);
        const parsed = device.parse(rawData);
        const payload = deviceDataToJson(parsed);
        dev.lastParsed = payload;
        this.emitter.emit('packet', {
          type: 'parsed',
          address,
          name,
          rssi,
          lastSeen: now,
          payload
        });
      
      } catch (error) {
        if (error instanceof AdvertisementKeyMissingError) {
          // fall through to raw
        } else if (error instanceof UnknownDeviceError) {
          // fall through to raw
        } else {
          throw error;
        }
      }
    }
    // If no key or parse failed, emit raw
    this.emitter.emit('packet', {
      type: 'raw',
      address,
      name,
      rssi,
      lastSeen: now,
      raw: rawData
    });
  }
} 