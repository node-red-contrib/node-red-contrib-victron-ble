import { kelvinToCelsius, Device, BitReader, AlarmReason, EnumField } from './base';
import { AuxMode } from './battery-monitor';

export class BatterySense extends Device {
  temperature?: number;
  voltage?: number;

  parseDecrypted(decrypted: Buffer): void {
    const reader = new BitReader(decrypted);
    const voltage = reader.readSignedInt(16);
    const temperature = reader.readUnsignedInt(16);

    this.voltage = voltage !== 0x7fff ? voltage / 100 : undefined;
    this.temperature = kelvinToCelsius(temperature / 100);
  }
} 