import { BLEAdapter, BLEDevice, BLERawPacket } from './ble-adapter';
import { EventEmitter } from 'events';

export class NodeBleAdapter extends EventEmitter implements BLEAdapter {
  private scanning = false;
  private discovered: Map<string, BLEDevice> = new Map();
  private connectedDevices: Map<string, any> = new Map();


  private singleton: { bluetooth: any, destroy: any } | null = null;
  async  getNodeBleSingleton(): Promise<{ bluetooth: any, destroy: any }> {
    if (this.singleton) return this.singleton;
    const module = await import('node-ble');
    const { bluetooth, destroy } = module.createBluetooth();
    this.singleton = { bluetooth, destroy };
    return this.singleton;
  } 
  
  destroyNodeBleSingleton() {
    if (this.singleton) this.singleton.destroy()
      this.singleton = null;
  }

  constructor() {
    super();
  }

  async startScan(): Promise<void> {
    const { bluetooth, destroy } = await this.getNodeBleSingleton();
    const adapter = await bluetooth?.defaultAdapter();
    if (!adapter || !(await adapter.isPowered())) {
      console.log('Bluetooth adapter is not powered on or not available.');
      destroy();
      return;
    }
    console.log('check to start');
    if (!await adapter.isDiscovering()) await adapter.startDiscovery();

    this.scanning = true;
    while (this.scanning) {
      console.log("WHILE scanning");
      const devices = await adapter.devices();
      for (const deviceAddress of devices) {
        if (!this.discovered.has(deviceAddress)) {
          console.log('new dev found');
          // Fetch name and connect
          let name: string | undefined = undefined;
          let device: any;
          try {
            device = await adapter.getDevice(deviceAddress);
            await device.connect();
            name = await device.getName();
            this.connectedDevices.set(deviceAddress, device);
          } catch {}
          const deviceInfo: BLEDevice = { address: deviceAddress, name };
          this.discovered.set(deviceAddress, deviceInfo);
          // Start manufacturer data polling loop
          this.pollManufacturerData(deviceAddress, deviceInfo, device);
        }
      }
      await new Promise(res => setTimeout(res, 1000));
    }
  }

  private async pollManufacturerData(address: string, deviceInfo: BLEDevice, device: any) {
    let localScanning = true;
    while (this.scanning && localScanning) {
      try {
        const manufacturerData = await device.getManufacturerData();
        if (manufacturerData) {
          const packet: BLERawPacket = {
            ...deviceInfo,
            rssi: 0,
            rawData: manufacturerData,
          };
          this.emit('raw', packet);
        }
      } catch (e) {
        // Ignore errors, just retry
        localScanning = false;
        this.connectedDevices.delete(address);
        this.discovered.delete(address);
      }
    }
    // On scan stop, disconnect
    try { await device.disconnect(); } catch {}
  }

  async stopScan(): Promise<void> {
    this.scanning = false;
    // Disconnect all connected devices
    for (const device of this.connectedDevices.values()) {
      try { await device.disconnect(); } catch {}
    }
    this.connectedDevices.clear();
    this.destroyNodeBleSingleton()
  }

  getDiscoveredDevices(): BLEDevice[] {
    return Array.from(this.discovered.values());
  }
} 