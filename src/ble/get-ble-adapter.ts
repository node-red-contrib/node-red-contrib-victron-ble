import { BLEAdapter } from './ble-adapter';
import { NobleBleAdapter } from './noble-adapter';
import { BluetoothctlBleAdapter } from './bluetoothctl-adapter';
import { DbusBleAdapter } from './dbus-adapter';

export async function getBleAdapter(): Promise<BLEAdapter> {
  const adapters: Array<{ name: string; create: () => BLEAdapter }> = [
    { name: 'BlueZ DBus', create: () => new DbusBleAdapter() },
    { name: 'bluetoothctl', create: () => new BluetoothctlBleAdapter() },
    { name: 'noble', create: () => new NobleBleAdapter() },
  ];
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
