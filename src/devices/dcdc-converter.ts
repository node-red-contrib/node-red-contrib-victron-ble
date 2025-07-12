import { BitReader, ChargerError, Device, DeviceData, OffReason, OperationMode } from './base';

export class DcDcConverterData extends DeviceData {
  getChargeState(): OperationMode | null {
    return this._data['device_state'] ?? null;
  }
  getChargerError(): ChargerError | null {
    return this._data['charger_error'] ?? null;
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

export class DcDcConverter extends Device {
  dataType = DcDcConverterData;

  parseDecrypted(decrypted: Buffer): Record<string, any> {
    const reader = new BitReader(decrypted);
    const device_state = reader.readUnsignedInt(8);
    const charger_error = reader.readUnsignedInt(8);
    const input_voltage = reader.readUnsignedInt(16);
    const output_voltage = reader.readSignedInt(16);
    const off_reason = reader.readUnsignedInt(32);
    return {
      device_state: device_state !== 0xFF ? OperationMode[device_state] ?? null : null,
      charger_error: charger_error !== 0xFF ? ChargerError[charger_error] ?? null : null,
      input_voltage: input_voltage !== 0xFFFF ? input_voltage / 100 : null,
      output_voltage: output_voltage !== 0x7FFF ? output_voltage / 100 : null,
      off_reason: OffReason[off_reason] ?? off_reason,
    };
  }
} 