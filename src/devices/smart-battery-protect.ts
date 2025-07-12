import { AlarmReason, BitReader, ChargerError, Device, DeviceData, OffReason, OperationMode } from './base';

export enum OutputState {
  ON = 1,
  OFF = 4,
}

export class SmartBatteryProtectData extends DeviceData {
  getDeviceState(): OperationMode | null {
    return this._data['device_state'] ?? null;
  }
  getOutputState(): OutputState | null {
    return this._data['output_state'] ?? null;
  }
  getErrorCode(): ChargerError | null {
    return this._data['error_code'] ?? null;
  }
  getAlarmReason(): AlarmReason {
    return this._data['alarm_reason'];
  }
  getWarningReason(): AlarmReason {
    return this._data['warning_reason'];
  }
  getInputVoltage(): number | null {
    return this._data['input_voltage'] ?? null;
  }
  getOutputVoltage(): number | null {
    return this._data['output_voltage'] ?? null;
  }
  getOffReason(): OffReason {
    return this._data['off_reason'];
  }
}

export class SmartBatteryProtect extends Device {
  dataType = SmartBatteryProtectData;

  parseDecrypted(decrypted: Buffer): Record<string, any> {
    const reader = new BitReader(decrypted);
    const device_state = reader.readUnsignedInt(8);
    const output_state = reader.readUnsignedInt(8);
    const error_code = reader.readUnsignedInt(8);
    const alarm_reason = reader.readUnsignedInt(16);
    const warning_reason = reader.readUnsignedInt(16);
    const input_voltage = reader.readSignedInt(16);
    const output_voltage = reader.readUnsignedInt(16);
    const off_reason = reader.readUnsignedInt(32);
    return {
      device_state: device_state !== 0xFF ? OperationMode[device_state] ?? null : null,
      output_state: output_state !== 0xFF ? OutputState[output_state] ?? null : null,
      error_code: error_code !== 0xFF ? ChargerError[error_code] ?? null : null,
      alarm_reason: AlarmReason[alarm_reason] ?? alarm_reason,
      warning_reason: AlarmReason[warning_reason] ?? warning_reason,
      input_voltage: input_voltage !== 0x7FFF ? input_voltage / 100 : null,
      output_voltage: output_voltage !== 0xFFFF ? output_voltage / 100 : null,
      off_reason: OffReason[off_reason] ?? off_reason,
    };
  }
} 