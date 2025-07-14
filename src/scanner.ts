import { Peripheral } from '@abandonware/noble';
import { Device, DeviceData } from './devices/base';
import { detectDeviceType } from './devices';
import { EventEmitter } from 'events';

export interface DiscoveredDevice {
  address: string;
  name: string;
  rssi: number;
  lastSeen: number;
  lastRaw: Buffer;
  lastParsed?: Record<string, any>;
}

export class Scanner {
  private noble: any;
  private deviceKeys: Record<string, string>;
  private knownDevices: Record<string, Device>;
  private discovered: Map<string, DiscoveredDevice>;
  private emitter: EventEmitter;

  constructor() {
    // Initialize noble
    this.noble = require('@abandonware/noble');
    this.deviceKeys = {};
    this.knownDevices = {};
    this.discovered = new Map();
    this.emitter = new EventEmitter();
  }

  protected detectionCallback(peripheral: Peripheral): void {
    const advertisement = peripheral.advertisement;
    if (!advertisement || !advertisement.manufacturerData) {
      return;
    }
    const manufacturerData = advertisement.manufacturerData;
    const deviceAddress = peripheral.address || peripheral.id || 'Unknown';
    // Check if data starts with Victron's manufacturer ID (0x02E1) and instant readout (0x10)
    if (
      manufacturerData.length < 3 ||
      manufacturerData[0] !== 0xe1 ||
      manufacturerData[1] !== 0x02 ||
      manufacturerData[2] !== 0x10
    ) {
      return;
    }

    const dataPayload = manufacturerData.subarray(2);
    this.callback(peripheral, dataPayload);
  }

  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      process.on('uncaughtException', (error) => {
        console.error('Uncaught Exception:', error);
      });
      process.on('unhandledRejection', (reason, promise) => {
        console.error('Unhandled Rejection at:', promise, 'reason:', reason);
      });
      this.noble.on('stateChange', (state: string) => {
        try {
          if (state === 'poweredOn') {
            this.noble.startScanning([], true, (error: any) => {
              try {
                if (error) {
                  console.log('Error scanning:', error);
                  reject(error);
                } else {
                  this.noble.on('discover', (peripheral: Peripheral) => {
                    try {
                      this.detectionCallback(peripheral);
                    } catch (callbackError) {
                      console.error('Error in detection callback:', callbackError);
                    }
                  });
                  resolve();
                }
              } catch (scanError) {
                console.error('Error in scan callback:', scanError);
                reject(scanError);
              }
            });
          }
        } catch (stateError) {
          console.error('Error in state change:', stateError);
          reject(stateError);
        }
      });
      this.noble.on('error', (error: any) => {
        try {
          console.error('Noble error:', error);
          reject(error);
        } catch (errorHandlerError) {
          console.error('Error in noble error handler:', errorHandlerError);
          reject(errorHandlerError);
        }
      });
    });
  }

  async stop(): Promise<void> {
    return new Promise((resolve) => {
      this.noble.stopScanning((error: any) => {
        try {
          if (error) {
            console.error('Error stopping scan:', error);
          }
          resolve();
        } catch (stopError) {
          console.error('Error in stop callback:', stopError);
          resolve();
        }
      });
    });
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
      if (!key) throw new Error(`No key for ${address}`);
      const deviceClass = detectDeviceType(rawData);
      if (!deviceClass) throw new Error(`Could not identify device type for ${deviceAddress}`);
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
        device.parse(rawData);
        // Copy all own properties except functions and undefined
        const payload: Record<string, any> = {};
        for (const key of Object.keys(device)) {
          const value = (device as any)[key];
          if (typeof value !== 'function' && value !== undefined) {
            payload[key] = value;
          }
        }
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
        // If no key or parse failed, emit raw
        this.emitter.emit('packet', {
          type: 'raw',
          address,
          name,
          rssi,
          lastSeen: now,
          raw: rawData,
          error: error?.toString()
        });
      }
    }
   
  }
} 