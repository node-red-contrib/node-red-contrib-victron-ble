import { BitReader, Device, EnumField } from './base';

export enum BalancerStatus {
  UNKNOWN = 0,
  BALANCED = 1,
  BALANCING = 2,
  IMBALANCE = 3,
}

export class SmartLithium extends Device {
  bmsFlags?: number;
  errorFlags?: number;
  batteryVoltage?: number;
  batteryTemperature?: number;
  cellVoltages?: (number | null)[];
  @EnumField(BalancerStatus)
  balancerStatus?: BalancerStatus;

  parseDecrypted(decrypted: Buffer): void {
    const reader = new BitReader(decrypted);
    const bms_flags = reader.readUnsignedInt(32);
    const error_flags = reader.readUnsignedInt(16);
    const cell_voltages = Array.from({ length: 8 }, () => reader.readUnsignedInt(7));
    const battery_voltage = reader.readUnsignedInt(12);
    const balancer_status = reader.readUnsignedInt(4);
    const battery_temperature = reader.readUnsignedInt(7);

    this.bmsFlags = bms_flags;
    this.errorFlags = error_flags;
    this.cellVoltages = cell_voltages.map(v => v !== 0x7F ? v : null);
    this.batteryVoltage = battery_voltage !== 0x0FFF ? battery_voltage / 100.0 : undefined;
    this.balancerStatus = balancer_status !== 0xF ? balancer_status as BalancerStatus : undefined;
    this.batteryTemperature = battery_temperature !== 0x7F ? (battery_temperature - 40) : undefined;
  }
}

function parseCellVoltage(payload: number): number | null {
  if (payload === 0x00) return Number.NEGATIVE_INFINITY;
  if (payload === 0x7E) return Number.POSITIVE_INFINITY;
  if (payload === 0x7F) return null;
  return (260 + payload) / 100.0;
} 