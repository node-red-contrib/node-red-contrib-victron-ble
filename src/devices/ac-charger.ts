import { BitReader, ChargerError, Device, OperationMode } from './base';

export class AcCharger extends Device {
  chargeState?: OperationMode;
  chargerError?: ChargerError;
  outputVoltage1?: number;
  outputVoltage2?: number;
  outputVoltage3?: number;
  outputCurrent1?: number;
  outputCurrent2?: number;
  outputCurrent3?: number;
  temperature?: number;
  acCurrent?: number;

  parseDecrypted(decrypted: Buffer): void {
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

    this.chargeState = charge_state !== 0xFF ? charge_state as OperationMode : undefined;
    this.chargerError = charger_error !== 0xFF ? charger_error as ChargerError : undefined;
    this.outputVoltage1 = output_voltage1 !== 0x1FFF ? output_voltage1 / 100 : undefined;
    this.outputVoltage2 = output_voltage2 !== 0x1FFF ? output_voltage2 / 100 : undefined;
    this.outputVoltage3 = output_voltage3 !== 0x1FFF ? output_voltage3 / 100 : undefined;
    this.outputCurrent1 = output_current1 !== 0x7FF ? output_current1 / 10 : undefined;
    this.outputCurrent2 = output_current2 !== 0x7FF ? output_current2 / 10 : undefined;
    this.outputCurrent3 = output_current3 !== 0x7FF ? output_current3 / 10 : undefined;
    this.temperature = temperature !== 0x7F ? (temperature - 40) : undefined;
    this.acCurrent = ac_current !== 0x1FF ? ac_current / 10 : undefined;
  }
} 