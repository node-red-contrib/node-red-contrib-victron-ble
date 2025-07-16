import { kelvinToCelsius, Device, BitReader, AlarmReason, EnumField } from './base';
import { AuxMode } from './battery-monitor';

export class BatterySense extends Device {
  temperature?: number;
  voltage?: number;
  remainingMins?: number;
  @EnumField(AlarmReason)
  alarm?: AlarmReason;
  @EnumField(AuxMode)
  auxMode?: AuxMode;
  current?: number;
  consumedAh?: number;
  soc?: number;
  starterVoltage?: number;
  midpointVoltage?: number;

  parseDecrypted(decrypted: Buffer): void {
    const reader = new BitReader(decrypted);
    const remaining_mins = reader.readUnsignedInt(16);
    const voltage = reader.readSignedInt(16);
    const alarm = reader.readUnsignedInt(16);
    const aux = reader.readUnsignedInt(16);
    const aux_mode = reader.readUnsignedInt(2);
    const current = reader.readSignedInt(22);
    const consumed_ah = reader.readUnsignedInt(20);
    const soc = reader.readUnsignedInt(10);

    this.remainingMins = remaining_mins !== 0xffff ? remaining_mins : undefined;
    this.voltage = voltage !== 0x7fff ? voltage / 100 : undefined;
    this.alarm = alarm in AlarmReason ? alarm : AlarmReason.NO_ALARM;
    this.auxMode = aux_mode in AuxMode ? aux_mode : AuxMode.DISABLED;
    this.current = current !== 0x3fffff ? current / 1000 : undefined;
    this.consumedAh = consumed_ah !== 0xfffff ? -consumed_ah / 10 : undefined;
    this.soc = soc !== 0x3ff ? soc / 10 : undefined;

    if (this.auxMode === AuxMode.STARTER_VOLTAGE) {
      this.starterVoltage = BitReader.toSignedInt(aux, 16) / 100;
    } else if (this.auxMode === AuxMode.MIDPOINT_VOLTAGE) {
      this.midpointVoltage = aux / 100;
    } else if (this.auxMode === AuxMode.TEMPERATURE) {
      this.temperature = aux / 100;
    }
  }
} 