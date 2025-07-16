import { BLEAdapter } from './ble-adapter';
import { NobleBleAdapter } from './noble-adapter';
import { BluetoothctlBleAdapter } from './bluetoothctl-adapter';

export async function getBleAdapter(): Promise<BLEAdapter> {
  let btctlAdapter: BluetoothctlBleAdapter | undefined = undefined;
  try {
    btctlAdapter = new BluetoothctlBleAdapter();
    await btctlAdapter.startScan();
    return btctlAdapter;
  } catch (err: any) {
    // Fallback to noble-based adapter
    const nobleAdapter = new NobleBleAdapter();
    await nobleAdapter.startScan();
    return nobleAdapter;
  }
} 