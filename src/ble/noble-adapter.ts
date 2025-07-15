import { BLEAdapter, BLEDevice, BLERawPacket, BLEParsedPacket } from './ble-adapter';
import { EventEmitter } from 'events';
import noble, { Peripheral } from '@abandonware/noble';

export class NobleBleAdapter extends EventEmitter implements BLEAdapter {
  private scanning = false;
  private discovered: Map<string, BLEDevice> = new Map();

  async startScan(): Promise<void> {
    return new Promise((resolve, reject) => {
      noble.on('stateChange', (state) => {
        if (state === 'poweredOn') {
          noble.startScanning([], true, (err) => {
            if (err) return reject(err);
            this.scanning = true;
            noble.on('discover', (peripheral: Peripheral) => {
              const adv = peripheral.advertisement;
              const device: BLEDevice = {
                address: peripheral.address,
                name: adv.localName,
              };
              this.discovered.set(device.address, device);
              if (adv.manufacturerData) {
                const packet: BLERawPacket = {
                  ...device,
                  rssi: peripheral.rssi,
                  rawData: adv.manufacturerData,
                };
                this.emit('raw', packet);
              }
            });
            resolve();
          });
        } else if (state === 'unauthorized') {
          reject(new Error('noble warning: adapter state unauthorized, please run as root or with sudo'));
        }
      });
    });
  }

  async stopScan(): Promise<void> {
    if (this.scanning) {
      await noble.stopScanning();
      this.scanning = false;
    }
  }

  getDiscoveredDevices(): BLEDevice[] {
    return Array.from(this.discovered.values());
  }
} 