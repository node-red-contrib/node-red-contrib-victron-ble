import { BitReader, ChargerError, Device, OffReason, OperationMode } from './base';

export class DcDcConverter extends Device {
  chargeState?: OperationMode;
  chargerError?: ChargerError;
  inputVoltage?: number;
  outputVoltage?: number;
  offReason?: OffReason;

  parseDecrypted(decrypted: Buffer): void {
    const reader = new BitReader(decrypted);
    const device_state = reader.readUnsignedInt(8);
    const charger_error = reader.readUnsignedInt(8);
    const input_voltage = reader.readUnsignedInt(16);
    const output_voltage = reader.readSignedInt(16);
    const off_reason = reader.readUnsignedInt(32);

    this.chargeState = device_state !== 0xFF ? device_state as OperationMode : undefined;
    this.chargerError = charger_error !== 0xFF ? charger_error as ChargerError : undefined;
    this.inputVoltage = input_voltage !== 0xFFFF ? input_voltage / 100 : undefined;
    this.outputVoltage = output_voltage !== 0x7FFF ? output_voltage / 100 : undefined;
    this.offReason = off_reason as OffReason;
  }
} 