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
      let emitRaw = true;
      try {
         if (packet.rawData.length > 0 && packet.rawData[0] == 0x10) {
          const deviceClass = detectDeviceType(packet.rawData);
          if (!deviceClass) throw new Error(`Could not identify device type for ${address}`);
          let device = this.knownDevices[address];
          if (!device) {
            device = new deviceClass(this.deviceKeys[address]);
            this.knownDevices[address] = device;
          }
          device.parse(packet.rawData);
          const payload: any = device.toJson();
          delete payload.advertisementKey;
          const parsedPacket: any = { ...packet, payload};
          dev.lastParsed = payload;
          delete parsedPacket.rawData;
          this.emit('parsed', parsedPacket);
          emitRaw = false;
        }
      } catch (error) {
        // Parsing failed, emit as raw only
        console.log(error);
      }
      if (emitRaw) this.emit('raw', packet);
    }
  }
}