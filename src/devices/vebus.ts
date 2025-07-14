import { ACInState, AlarmNotification, BitReader, Device, OperationMode } from './base';

export class VEBus extends Device {
  deviceState?: OperationMode;
  error?: number;
  alarm?: AlarmNotification;
  acInState?: ACInState;
  acInPower?: number;
  acOutPower?: number;
  batteryCurrent?: number;
  batteryVoltage?: number;
  batteryTemperature?: number;
  soc?: number;

  parseDecrypted(decrypted: Buffer): void {
    const reader = new BitReader(decrypted);
    const device_state = reader.readUnsignedInt(8);
    const error = reader.readUnsignedInt(8);
    const battery_current = reader.readSignedInt(16);
    const battery_voltage = reader.readUnsignedInt(14);
    const ac_in_state = reader.readUnsignedInt(2);
    const ac_in_power = reader.readSignedInt(19);
    const ac_out_power = reader.readSignedInt(19);
    const alarm = reader.readUnsignedInt(2);
    const battery_temperature = reader.readUnsignedInt(7);
    const soc = reader.readUnsignedInt(7);

    this.deviceState = device_state !== 0xFF ? device_state as OperationMode : undefined;
    this.error = error !== 0xFF ? error : undefined;
    this.batteryVoltage = battery_voltage !== 0x3FFF ? battery_voltage / 100 : undefined;
    this.batteryCurrent = battery_current !== 0x7FFF ? battery_current / 10 : undefined;
    this.acInState = ac_in_state !== 3 ? ac_in_state as ACInState : undefined;
    this.acInPower = ac_in_power !== 0x3FFFF ? ac_in_power : undefined;
    this.acOutPower = ac_out_power !== 0x3FFFF ? ac_out_power : undefined;
    this.alarm = alarm !== 3 ? alarm as AlarmNotification : undefined;
    this.batteryTemperature = battery_temperature !== 0x7F ? (battery_temperature - 40) : undefined;
    this.soc = soc !== 0x7F ? soc : undefined;
  }
} 