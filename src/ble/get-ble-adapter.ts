import { BLEAdapter } from './ble-adapter';
import { NobleBleAdapter } from './noble-adapter';
import { NodeBleAdapter } from './node-ble-adapter';

export async function getBleAdapter(): Promise<BLEAdapter> {
  let nobleAdapter: NobleBleAdapter | undefined = undefined;
  try {
    nobleAdapter = new NobleBleAdapter();
    await nobleAdapter.startScan();
    return nobleAdapter;
  } catch (err: any) {
    console.log("Try switch to node-ble library")
    try { nobleAdapter?.stopScan() } catch{ }
    if (err.message && err.message.includes('adapter state unauthorized')) {
      const nodeBleAdapter = new NodeBleAdapter();
      await nodeBleAdapter.startScan();
      return nodeBleAdapter;
    }
    throw err;
  }
} 