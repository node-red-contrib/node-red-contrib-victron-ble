import { BitReader, Device } from './base';

export class LynxSmartBMS extends Device {
  errorFlags?: number;
  remainingMins?: number;
  voltage?: number;
  current?: number;
  ioStatus?: number;
  alarmFlags?: number;
  soc?: number;
  consumedAh?: number;
  batteryTemperature?: number;

  parseDecrypted(decrypted: Buffer): void {
    const reader = new BitReader(decrypted);
    const error_flags = reader.readUnsignedInt(8);
    const remaining_mins = reader.readUnsignedInt(16);
    const voltage = reader.readSignedInt(16);
    const current = reader.readSignedInt(16);
    const io_status = reader.readUnsignedInt(16);
    const alarm_flags = reader.readUnsignedInt(18);
    const soc = reader.readUnsignedInt(10);
    const consumed_ah = reader.readUnsignedInt(20);
    const temperature = reader.readUnsignedInt(7);

    this.errorFlags = error_flags;
    this.remainingMins = remaining_mins !== 0xFFFF ? remaining_mins : undefined;
    this.voltage = voltage !== 0x7FFF ? voltage / 100 : undefined;
    this.current = current !== 0x7FFF ? current / 10 : undefined;
    this.ioStatus = io_status;
    this.alarmFlags = alarm_flags;
    this.soc = soc !== 0x3FFF ? soc / 10.0 : undefined;
    this.consumedAh = consumed_ah !== 0xFFFFF ? consumed_ah / 10 : undefined;
    this.batteryTemperature = temperature !== 0x7F ? (temperature - 40) : undefined;
  }
} 