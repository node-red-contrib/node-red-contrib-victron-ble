import { AlarmReason, BitReader, Device, OperationMode, EnumField } from './base';

export class Inverter extends Device {
  @EnumField(OperationMode)
  deviceState?: OperationMode;
  @EnumField(AlarmReason)
  alarm?: AlarmReason;
  batteryVoltage?: number;
  acApparentPower?: number;
  acVoltage?: number;
  acCurrent?: number;

  parseDecrypted(decrypted: Buffer): void {
    const reader = new BitReader(decrypted);
    const device_state = reader.readUnsignedInt(8);
    const alarm = reader.readUnsignedInt(16);
    const battery_voltage = reader.readSignedInt(16);
    const ac_apparent_power = reader.readUnsignedInt(16);
    const ac_voltage = reader.readUnsignedInt(15);
    const ac_current = reader.readUnsignedInt(11);

    this.deviceState = device_state !== 0xFF ? device_state as OperationMode : undefined;
    this.alarm = alarm;
    this.batteryVoltage = battery_voltage !== 0x7FFF ? battery_voltage / 100 : undefined;
    this.acApparentPower = ac_apparent_power !== 0xFFFF ? ac_apparent_power : undefined;
    this.acVoltage = ac_voltage !== 0x7FFF ? ac_voltage / 100 : undefined;
    this.acCurrent = ac_current !== 0x7FF ? ac_current / 10 : undefined;
  }
} 