import { BLEAdapter } from './ble-adapter';
import { NobleBleAdapter } from './noble-adapter';
import { BluetoothctlBleAdapter } from './bluetoothctl-adapter';
import { DbusBleAdapter } from './dbus-adapter';

export type BleAdapterMode = 'auto' | 'bluez' | 'bluetoothctl' | 'noble';

const ADAPTERS: Array<{ mode: Exclude<BleAdapterMode, 'auto'>; name: string; create: () => BLEAdapter }> = [
  { mode: 'bluez', name: 'BlueZ DBus', create: () => new DbusBleAdapter() },
  { mode: 'bluetoothctl', name: 'bluetoothctl', create: () => new BluetoothctlBleAdapter() },
  { mode: 'noble', name: 'noble', create: () => new NobleBleAdapter() },
];

export async function getBleAdapter(mode: BleAdapterMode = 'auto'): Promise<BLEAdapter> {
  const adapters = mode === 'auto' ? ADAPTERS : ADAPTERS.filter((adapter) => adapter.mode === mode);
  const errors: string[] = [];

  for (const { name, create } of adapters) {
    const adapter = create();
    try {
      await adapter.startScan();
      console.debug(`Using ${name} BLE adapter.`);
      return adapter;
    } catch (error) {
      errors.push(`${name}: ${error instanceof Error ? error.message : String(error)}`);
      await adapter.stopScan().catch(() => {});
      console.debug(`${name} BLE adapter unavailable: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  throw new Error(`No BLE adapter available. Tried ${errors.join('; ')}`);
}
