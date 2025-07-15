import { BLEAdapter, BLEDevice, BLERawPacket, BLEParsedPacket } from './ble/ble-adapter';
import { getBleAdapter } from './ble/get-ble-adapter';
import { Device } from './devices/base';
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

export class Scanner extends EventEmitter {
  private ble: BLEAdapter | null = null;
  private deviceKeys: Record<string, string> = {};
  private knownDevices: Record<string, Device> = {};
  private discovered: Map<string, DiscoveredDevice> = new Map();

  constructor() {
    super();
  }

  async start(): Promise<void> {
    this.ble = await getBleAdapter();
    if (!this.ble) return; 
    this.ble.on('raw', (packet: BLERawPacket) => this.handleRawPacket(packet));
    await this.ble.startScan();
  }

  async stop(): Promise<void> {
    if (this.ble) await this.ble.stopScan();
  }

  setKey(address: string, key: string): void {
    this.deviceKeys[address.toLowerCase()] = key;
    delete this.knownDevices[address.toLowerCase()];
  }

  getDiscoveredDevices(): DiscoveredDevice[] {
    return Array.from(this.discovered.values());
  }

  private handleRawPacket(packet: BLERawPacket): void {
    const now = Date.now();
    const address = packet.address.toLowerCase();
    let dev = this.discovered.get(address);
    if (!dev) {
      dev = { address, name: packet.name || '', rssi: packet.rssi, lastSeen: now, lastRaw: packet.rawData };
      this.discovered.set(address, dev);
    } else {
      dev.name = packet.name || '';
      dev.rssi = packet.rssi;
      dev.lastSeen = now;
      dev.lastRaw = packet.rawData;
    }
    // Try to parse if we have a key
    if (this.deviceKeys[address]) {
      try {
        const deviceClass = detectDeviceType(packet.rawData);
        if (!deviceClass) throw new Error(`Could not identify device type for ${address}`);
        let device = this.knownDevices[address];
        if (!device) {
          device = new deviceClass(this.deviceKeys[address]);
          this.knownDevices[address] = device;
        }
        device.parse(packet.rawData);
        const payload: Record<string, any> = {};
        for (const key of Object.keys(device)) {
          const value = (device as any)[key];
          if (typeof value !== 'function' && value !== undefined) {
            payload[key] = value;
          }
        }
        const parsedPacket: BLEParsedPacket = { ...packet, payload };
        dev.lastParsed = payload;
        this.emit('parsed', parsedPacket);
      } catch (error) {
        // Parsing failed, emit as raw only
        this.emit('raw', packet);
      }
    }
  }
} 