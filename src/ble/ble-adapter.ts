import { EventEmitter } from 'events';

export interface BLEDevice {
  address: string;
  name?: string;
}

export interface BLERawPacket extends BLEDevice {
  rssi: number;
  rawData: Buffer;
}

export interface BLEParsedPacket extends BLERawPacket {
  payload: Record<string, any>;
}

export interface BLEAdapter extends EventEmitter {
  startScan(): Promise<void>;
  stopScan(): Promise<void>;
  getDiscoveredDevices(): BLEDevice[];

  on(event: 'parsed', listener: (packet: BLEParsedPacket) => void): this;
  on(event: 'raw', listener: (packet: BLERawPacket) => void): this;
} 