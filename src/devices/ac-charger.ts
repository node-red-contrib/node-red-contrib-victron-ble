import { BitReader, ChargerError, Device, DeviceData, OperationMode } from './base';

export class AcChargerData extends DeviceData {
  getChargeState(): OperationMode | null {
    return this._data['charge_state'] ?? null;
  }
  getChargerError(): ChargerError | null {
    return this._data['charger_error'] ?? null;
  }
  getOutputVoltage1(): number | null {
    return this._data['output_voltage1'] ?? null;
  }
  getOutputVoltage2(): number | null {
    return this._data['output_voltage2'] ?? null;
  }
  getOutputVoltage3(): number | null {
    return this._data['output_voltage3'] ?? null;
  }
  getOutputCurrent1(): number | null {
    return this._data['output_current1'] ?? null;
  }
  getOutputCurrent2(): number | null {
    return this._data['output_current2'] ?? null;
  }
  getOutputCurrent3(): number | null {
    return this._data['output_current3'] ?? null;
  }
  getTemperature(): number | null {
    return this._data['temperature'] ?? null;
  }
  getAcCurrent(): number | null {
    return this._data['ac_current'] ?? null;
  }
}

export class AcCharger extends Device {
  dataType = AcChargerData;

  parseDecrypted(decrypted: Buffer): Record<string, any> {
    const reader = new BitReader(decrypted);
    const charge_state = reader.readUnsignedInt(8);
    const charger_error = reader.readUnsignedInt(8);
    const output_voltage1 = reader.readUnsignedInt(13);
    const output_current1 = reader.readUnsignedInt(11);
    const output_voltage2 = reader.readUnsignedInt(13);
    const output_current2 = reader.readUnsignedInt(11);
    const output_voltage3 = reader.readUnsignedInt(13);
    const output_current3 = reader.readUnsignedInt(11);
    const temperature = reader.readUnsignedInt(7);
    const ac_current = reader.readUnsignedInt(9);
    return {
      charge_state: charge_state !== 0xFF ? OperationMode[charge_state] ?? null : null,
      charger_error: charger_error !== 0xFF ? ChargerError[charger_error] ?? null : null,
      output_voltage1: output_voltage1 !== 0x1FFF ? output_voltage1 / 100 : null,
      output_voltage2: output_voltage2 !== 0x1FFF ? output_voltage2 / 100 : null,
      output_voltage3: output_voltage3 !== 0x1FFF ? output_voltage3 / 100 : null,
      output_current1: output_current1 !== 0x7FF ? output_current1 / 10 : null,
      output_current2: output_current2 !== 0x7FF ? output_current2 / 10 : null,
      output_current3: output_current3 !== 0x7FF ? output_current3 / 10 : null,
      temperature: temperature !== 0x7F ? (temperature - 40) : null,
      ac_current: ac_current !== 0x1FF ? ac_current / 10 : null,
    };
  }
} 