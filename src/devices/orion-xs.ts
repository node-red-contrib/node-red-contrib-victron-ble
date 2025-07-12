import { BitReader, ChargerError, Device, DeviceData, OffReason, OperationMode } from './base';

export class OrionXSData extends DeviceData {
  getChargeState(): OperationMode | null {
    return this._data['device_state'] ?? null;
  }
  getChargerError(): ChargerError | null {
    return this._data['charger_error'] ?? null;
  }
  getInputVoltage(): number | null {
    return this._data['input_voltage'] ?? null;
  }
  getInputCurrent(): number | null {
    return this._data['input_current'] ?? null;
  }
  getOutputVoltage(): number | null {
    return this._data['output_voltage'] ?? null;
  }
  getOutputCurrent(): number | null {
    return this._data['output_current'] ?? null;
  }
  getOffReason(): OffReason {
    return this._data['off_reason'];
  }
}

export class OrionXS extends Device {
  dataType = OrionXSData;

  parseDecrypted(decrypted: Buffer): Record<string, any> {
    const reader = new BitReader(decrypted);
    const device_state = reader.readUnsignedInt(8);
    const charger_error = reader.readUnsignedInt(8);
    const output_voltage = reader.readUnsignedInt(16);
    const output_current = reader.readUnsignedInt(16);
    const input_voltage = reader.readUnsignedInt(16);
    const input_current = reader.readUnsignedInt(16);
    const off_reason = reader.readUnsignedInt(32);
    return {
      device_state: device_state !== 0xFF ? OperationMode[device_state] ?? null : null,
      charger_error: charger_error !== 0xFF ? ChargerError[charger_error] ?? null : null,
      output_voltage: output_voltage !== 0xFFFF ? output_voltage / 100 : null,
      output_current: output_current !== 0xFFFF ? output_current / 10 : null,
      input_voltage: input_voltage !== 0xFFFF ? input_voltage / 100 : null,
      input_current: input_current !== 0xFFFF ? input_current / 10 : null,
      off_reason: OffReason[off_reason] ?? off_reason,
    };
  }
} 