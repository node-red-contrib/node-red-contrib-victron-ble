import { EventEmitter } from 'events';
import { createRequire } from 'module';
import { BLEAdapter, BLEDevice, BLERawPacket } from './ble-adapter';

interface BLEDeviceWithRssi extends BLEDevice {
  rssi?: number;
}

type BluezObjects = Record<string, Record<string, Record<string, unknown>>>;
type BluezVariantConstructor = new (signature: string, value: unknown) => unknown;

interface BluezBus {
  getProxyObject(service: string, path: string): Promise<{ getInterface(name: string): unknown }>;
  disconnect(): void;
}

interface BluezObjectManager {
  GetManagedObjects(): Promise<BluezObjects>;
  on(event: 'InterfacesAdded', listener: (path: string, interfaces: Record<string, Record<string, unknown>>) => void): void;
  removeListener(event: 'InterfacesAdded', listener: (path: string, interfaces: Record<string, Record<string, unknown>>) => void): void;
}

interface BluezAdapter {
  StartDiscovery(): Promise<void>;
  StopDiscovery(): Promise<void>;
  SetDiscoveryFilter(filter: Record<string, unknown>): Promise<void>;
}

interface BluezProperties {
  on(event: 'PropertiesChanged', listener: (interfaceName: string, changed: Record<string, unknown>, invalidated: string[]) => void): void;
  removeListener(event: 'PropertiesChanged', listener: (interfaceName: string, changed: Record<string, unknown>, invalidated: string[]) => void): void;
}

interface DbusNext {
  systemBus: () => BluezBus;
  Variant: BluezVariantConstructor;
}

interface DeviceWatcher {
  properties: BluezProperties;
  listener: (interfaceName: string, changed: Record<string, unknown>, invalidated: string[]) => void;
}

interface ManufacturerPayload {
  companyId: string;
  data: Buffer;
}

const requireOptional = createRequire(__filename);
const BLUEZ_SERVICE = 'org.bluez';
const DBUS_OBJECT_MANAGER = 'org.freedesktop.DBus.ObjectManager';
const DBUS_PROPERTIES = 'org.freedesktop.DBus.Properties';
const BLUEZ_ADAPTER = 'org.bluez.Adapter1';
const BLUEZ_DEVICE = 'org.bluez.Device1';
const DISCOVERY_POLL_MS = 500;

export class DbusBleAdapter extends EventEmitter implements BLEAdapter {
  private scanning = false;
  private bus: BluezBus | null = null;
  private adapter: BluezAdapter | null = null;
  private objectManager: BluezObjectManager | null = null;
  private pollTimer: NodeJS.Timeout | null = null;
  private polling = false;
  private discovered: Map<string, BLEDeviceWithRssi> = new Map();
  private pathAddresses: Map<string, string> = new Map();
  private deviceWatchers: Map<string, DeviceWatcher> = new Map();
  private lastManufacturerData: Map<string, string> = new Map();

  private readonly onInterfacesAdded = (path: string, interfaces: Record<string, Record<string, unknown>>) => {
    this.processInterfaces(path, interfaces);
  };

  async startScan(): Promise<void> {
    if (this.scanning) return;
    if (process.platform !== 'linux') throw new Error('BlueZ DBus adapter is only available on Linux.');

    const { systemBus, Variant } = loadDbusNext();
    this.bus = systemBus();

    try {
      const { objectManager, adapter } = await openBluezAdapter(this.bus);
      this.objectManager = objectManager;
      this.adapter = adapter;
      this.objectManager.on('InterfacesAdded', this.onInterfacesAdded);

      await setBluezDiscoveryFilter(adapter, Variant);
      await adapter.StartDiscovery();
      this.scanning = true;

      await this.pollManagedObjects();
      this.pollTimer = setInterval(() => {
        void this.pollManagedObjects();
      }, DISCOVERY_POLL_MS);
    } catch (error) {
      await this.stopScan();
      throw error;
    }
  }

  async stopScan(): Promise<void> {
    this.scanning = false;

    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }

    if (this.objectManager) {
      this.objectManager.removeListener('InterfacesAdded', this.onInterfacesAdded);
      this.objectManager = null;
    }

    for (const { properties, listener } of this.deviceWatchers.values()) {
      properties.removeListener('PropertiesChanged', listener);
    }
    this.deviceWatchers.clear();

    if (this.adapter) {
      await this.adapter.StopDiscovery().catch((error: unknown) => {
        console.debug(`Warning: could not stop BlueZ discovery: ${errorMessage(error)}`);
      });
      this.adapter = null;
    }

    if (this.bus) {
      this.bus.disconnect();
      this.bus = null;
    }
  }

  getDiscoveredDevices(): BLEDevice[] {
    return Array.from(this.discovered.values());
  }

  private async pollManagedObjects(): Promise<void> {
    if (!this.objectManager || this.polling) return;
    this.polling = true;
    try {
      const objects = await this.objectManager.GetManagedObjects();
      for (const [path, interfaces] of Object.entries(objects)) {
        this.processInterfaces(path, interfaces);
      }
    } catch (error) {
      console.debug(`Warning: could not poll BlueZ managed objects: ${errorMessage(error)}`);
    } finally {
      this.polling = false;
    }
  }

  private processInterfaces(path: string, interfaces: Record<string, Record<string, unknown>>): void {
    const device = interfaces[BLUEZ_DEVICE];
    if (!device) return;

    void this.watchDeviceProperties(path);
    this.processDeviceProperties(path, device);
  }

  private async watchDeviceProperties(path: string): Promise<void> {
    if (!this.bus || this.deviceWatchers.has(path)) return;

    try {
      const object = await this.bus.getProxyObject(BLUEZ_SERVICE, path);
      const properties = object.getInterface(DBUS_PROPERTIES) as BluezProperties;
      const listener = (interfaceName: string, changed: Record<string, unknown>) => {
        if (interfaceName === BLUEZ_DEVICE) this.processDeviceProperties(path, changed);
      };
      properties.on('PropertiesChanged', listener);
      this.deviceWatchers.set(path, { properties, listener });
    } catch (error) {
      console.debug(`Warning: could not watch BlueZ properties for ${path}: ${errorMessage(error)}`);
    }
  }

  private processDeviceProperties(path: string, properties: Record<string, unknown>): void {
    const propertyAddress = nullableString(unboxBluezValue(properties.Address));
    const address = (propertyAddress || this.pathAddresses.get(path))?.toLowerCase();
    if (!address) return;

    this.pathAddresses.set(path, address);

    const existing = this.discovered.get(address) || { address };
    const name = nullableString(unboxBluezValue(properties.Name)) || nullableString(unboxBluezValue(properties.Alias));
    const rssi = nullableNumber(unboxBluezValue(properties.RSSI));
    const device: BLEDeviceWithRssi = { ...existing, address };

    if (name) device.name = name;
    if (typeof rssi === 'number') device.rssi = rssi;
    this.discovered.set(address, device);

    const manufacturerData = readManufacturerData(properties.ManufacturerData);
    for (const payload of manufacturerData) {
      this.emitManufacturerData(path, device, payload);
    }
  }

  private emitManufacturerData(path: string, device: BLEDeviceWithRssi, payload: ManufacturerPayload): void {
    if (this.listenerCount('raw') === 0) return;

    const hex = payload.data.toString('hex');
    const key = `${path}:${payload.companyId}`;
    if (this.lastManufacturerData.get(key) === hex) return;
    this.lastManufacturerData.set(key, hex);

    const packet: BLERawPacket = {
      ...device,
      rssi: device.rssi ?? 0,
      rawData: payload.data,
    };
    this.emit('raw', packet);
  }
}

async function openBluezAdapter(bus: BluezBus): Promise<{ objectManager: BluezObjectManager; adapter: BluezAdapter }> {
  const objectManagerObject = await bus.getProxyObject(BLUEZ_SERVICE, '/');
  const objectManager = objectManagerObject.getInterface(DBUS_OBJECT_MANAGER) as BluezObjectManager;
  const objects = await objectManager.GetManagedObjects();
  const adapterPath = findBluezAdapterPath(objects);
  if (!adapterPath) throw new Error('Could not find a BlueZ adapter via org.bluez ObjectManager.');

  const adapterObject = await bus.getProxyObject(BLUEZ_SERVICE, adapterPath);
  const adapter = adapterObject.getInterface(BLUEZ_ADAPTER) as BluezAdapter;
  return { objectManager, adapter };
}

async function setBluezDiscoveryFilter(adapter: BluezAdapter, Variant: BluezVariantConstructor): Promise<void> {
  const filter = {
    Transport: new Variant('s', 'le'),
    DuplicateData: new Variant('b', true),
  };

  await adapter.SetDiscoveryFilter(filter).catch((error: unknown) => {
    console.debug(`Warning: could not set BlueZ discovery filter: ${errorMessage(error)}`);
  });
}

function findBluezAdapterPath(objects: BluezObjects): string | null {
  for (const [path, interfaces] of Object.entries(objects)) {
    if (interfaces[BLUEZ_ADAPTER]) return path;
  }
  return null;
}

function readManufacturerData(value: unknown): ManufacturerPayload[] {
  const data = unboxBluezValue(value);
  if (!data || typeof data !== 'object') return [];

  const entries = data instanceof Map ? Array.from(data.entries()) : Object.entries(data as Record<string, unknown>);
  const payloads: ManufacturerPayload[] = [];

  for (const [companyId, bytes] of entries) {
    const buffer = bytesToBuffer(bytes);
    if (buffer && buffer.length > 0) {
      payloads.push({ companyId: String(companyId), data: buffer });
    }
  }

  return payloads;
}

function bytesToBuffer(value: unknown): Buffer | null {
  const unboxed = unboxBluezValue(value);
  if (Buffer.isBuffer(unboxed)) return unboxed;
  if (unboxed instanceof Uint8Array) return Buffer.from(unboxed);
  if (Array.isArray(unboxed) && unboxed.every((byte) => typeof byte === 'number')) return Buffer.from(unboxed);
  return null;
}

function nullableString(value: unknown): string | undefined {
  return typeof value === 'string' && value ? value : undefined;
}

function nullableNumber(value: unknown): number | undefined {
  return typeof value === 'number' ? value : undefined;
}

function unboxBluezValue(value: unknown): unknown {
  if (value && typeof value === 'object' && 'value' in value) return (value as { value: unknown }).value;
  return value;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function loadDbusNext(): DbusNext {
  try {
    return requireOptional('dbus-next') as DbusNext;
  } catch (error) {
    throw new Error(`BlueZ DBus adapter requires the "dbus-next" dependency. ${errorMessage(error)}`);
  }
}
