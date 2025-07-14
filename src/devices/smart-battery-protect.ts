import { AlarmReason, BitReader, ChargerError, Device, OffReason, OperationMode } from './base';

export enum OutputState {
  SHUTDOWN = 0,
  ON = 1,
  OFF = 4,
}

export class SmartBatteryProtect extends Device {
  deviceState?: OperationMode;
  outputState?: OutputState;
  errorCode?: ChargerError;
  alarmReason?: AlarmReason;
  warningReason?: AlarmReason;
  inputVoltage?: number;
  outputVoltage?: number;
  offReason?: OffReason;

  parseDecrypted(decrypted: Buffer): void {
    const reader = new BitReader(decrypted);
    const device_state = reader.readUnsignedInt(8);
    const output_state = reader.readUnsignedInt(8);
    const error_code = reader.readUnsignedInt(8);
    const alarm_reason = reader.readUnsignedInt(16);
    const warning_reason = reader.readUnsignedInt(16);
    const input_voltage = reader.readSignedInt(16);
    const output_voltage = reader.readUnsignedInt(16);
    const off_reason = reader.readUnsignedInt(32);

    this.deviceState = device_state !== 0xFF ? device_state as OperationMode : undefined;
    this.outputState = output_state !== 0xFF ? output_state as OutputState : undefined;
    this.errorCode = error_code !== 0xFF ? error_code as ChargerError : undefined;
    this.alarmReason = alarm_reason as AlarmReason;
    this.warningReason = warning_reason as AlarmReason;
    this.inputVoltage = input_voltage !== 0x7FFF ? input_voltage / 100 : undefined;
    this.outputVoltage = output_voltage !== 0xFFFF ? output_voltage / 100 : undefined;
    this.offReason = off_reason as OffReason;
  }
} 