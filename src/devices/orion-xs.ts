import { BitReader, ChargerError, Device, OffReason, OperationMode } from './base';
import { EnumField } from './base';

export class OrionXS extends Device {
  @EnumField(OperationMode)
  chargeState?: OperationMode;
  @EnumField(ChargerError)
  chargerError?: ChargerError;
  inputVoltage?: number;
  inputCurrent?: number;
  outputVoltage?: number;
  outputCurrent?: number;
  @EnumField(OffReason)
  offReason?: OffReason;

  parseDecrypted(decrypted: Buffer): void {
    const reader = new BitReader(decrypted);
    const device_state = reader.readUnsignedInt(8);
    const charger_error = reader.readUnsignedInt(8);
    const output_voltage = reader.readUnsignedInt(16);
    const output_current = reader.readUnsignedInt(16);
    const input_voltage = reader.readUnsignedInt(16);
    const input_current = reader.readUnsignedInt(16);
    const off_reason = reader.readUnsignedInt(32);

    this.chargeState = device_state !== 0xFF ? device_state as OperationMode : undefined;
    this.chargerError = charger_error !== 0xFF ? charger_error as ChargerError : undefined;
    this.outputVoltage = output_voltage !== 0xFFFF ? output_voltage / 100 : undefined;
    this.outputCurrent = output_current !== 0xFFFF ? output_current / 10 : undefined;
    this.inputVoltage = input_voltage !== 0xFFFF ? input_voltage / 100 : undefined;
    this.inputCurrent = input_current !== 0xFFFF ? input_current / 10 : undefined;
    this.offReason = off_reason as OffReason;
  }
} 