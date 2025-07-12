import { BitReader, Device, DeviceData } from './base';

export enum BalancerStatus {
  UNKNOWN = 0,
  BALANCED = 1,
  BALANCING = 2,
  IMBALANCE = 3,
}

export class SmartLithiumData extends DeviceData {
  getBmsFlags(): number {
    return this._data['bms_flags'];
  }
  getErrorFlags(): number {
    return this._data['error_flags'];
  }
  getBatteryVoltage(): number | null {
    return this._data['battery_voltage'] ?? null;
  }
  getBatteryTemperature(): number | null {
    return this._data['battery_temperature'] ?? null;
  }
  getCellVoltages(): (number | null)[] {
    return this._data['cell_voltages'];
  }
  getBalancerStatus(): BalancerStatus | null {
    return this._data['balancer_status'] ?? null;
  }
}

export class SmartLithium extends Device {
  dataType = SmartLithiumData;

  parseDecrypted(decrypted: Buffer): Record<string, any> {
    const reader = new BitReader(decrypted);
    const bms_flags = reader.readUnsignedInt(32);
    const error_flags = reader.readUnsignedInt(16);
    const cell_voltages = Array.from({ length: 8 }, () => reader.readUnsignedInt(7));
    const battery_voltage = reader.readUnsignedInt(12);
    const balancer_status = reader.readUnsignedInt(4);
    const battery_temperature = reader.readUnsignedInt(7);
    return {
      bms_flags,
      error_flags,
      cell_voltages: cell_voltages.map(parseCellVoltage),
      battery_voltage: battery_voltage !== 0x0FFF ? battery_voltage / 100.0 : null,
      balancer_status: balancer_status !== 0xF ? BalancerStatus[balancer_status] ?? null : null,
      battery_temperature: battery_temperature !== 0x7F ? (battery_temperature - 40) : null,
    };
  }
}

function parseCellVoltage(payload: number): number | null {
  if (payload === 0x00) return Number.NEGATIVE_INFINITY;
  if (payload === 0x7E) return Number.POSITIVE_INFINITY;
  if (payload === 0x7F) return null;
  return (260 + payload) / 100.0;
} 