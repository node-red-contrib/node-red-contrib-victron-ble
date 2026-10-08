import { BLEAdapter } from './ble-adapter';
import { createRequire } from 'module';
import { BluetoothctlBleAdapter } from './bluetoothctl-adapter';
import { DbusBleAdapter } from './dbus-adapter';

export type BleAdapterMode = 'auto' | 'bluez' | 'bluetoothctl' | 'noble';

const requireAdapter = createRequire(__filename);

const ADAPTERS: Array<{ mode: Exclude<BleAdapterMode, 'auto'>; name: string; create: () => BLEAdapter }> = [
  { mode: 'bluez', name: 'BlueZ DBus', create: () => new DbusBleAdapter() },
  { mode: 'bluetoothctl', name: 'bluetoothctl', create: () => new BluetoothctlBleAdapter() },
  {
    mode: 'noble', name: 'noble', create: () => {
      // Native bindings can be incompatible after a firmware/Node.js update.
      // Load them only when this backend is actually selected.
      const { NobleBleAdapter } = requireAdapter('./noble-adapter') as typeof import('./noble-adapter');
      return new NobleBleAdapter();
    },
  },
];

export async function getBleAdapter(mode: BleAdapterMode = 'auto'): Promise<BLEAdapter> {
  const adapters = mode === 'auto' ? ADAPTERS : ADAPTERS.filter((adapter) => adapter.mode === mode);
  const errors: string[] = [];

  for (const { name, create } of adapters) {
    let adapter: BLEAdapter | undefined;
    try {
      adapter = create();
      await adapter.startScan();
      console.debug(`Using ${name} BLE adapter.`);
      return adapter;
    } catch (error) {
      errors.push(`${name}: ${error instanceof Error ? error.message : String(error)}`);
      await adapter?.stopScan().catch(() => {});
      console.debug(`${name} BLE adapter unavailable: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  throw new Error(`No BLE adapter available. Tried ${errors.join('; ')}`);
}
