import { AlarmReason, BitReader, Device, kelvinToCelsius } from './base';
import { AuxMode } from './battery-monitor';

export enum MeterType {
  SOLAR_CHARGER = -9,
  WIND_CHARGER = -8,
  SHAFT_GENERATOR = -7,
  ALTERNATOR = -6,
  FUEL_CELL = -5,
  WATER_GENERATOR = -4,
  DC_DC_CHARGER = -3,
  AC_CHARGER = -2,
  GENERIC_SOURCE = -1,
  GENERIC_LOAD = 1,
  ELECTRIC_DRIVE = 2,
  FRIDGE = 3,
  WATER_PUMP = 4,
  BILGE_PUMP = 5,
  DC_SYSTEM = 6,
  INVERTER = 7,
  WATER_HEATER = 8,
}

export class DcEnergyMeter extends Device {
  meterType?: MeterType;
  current?: number;
  voltage?: number;
  alarm?: AlarmReason;
  auxMode?: AuxMode;
  temperature?: number;
  starterVoltage?: number;

  parseDecrypted(decrypted: Buffer): void {
    const reader = new BitReader(decrypted);
    const meter_type = reader.readSignedInt(16);
    const voltage = reader.readSignedInt(16);
    const alarm = reader.readUnsignedInt(16);
    const aux = reader.readUnsignedInt(16);
    const aux_mode = reader.readUnsignedInt(2);
    const current = reader.readSignedInt(22);

    this.meterType = meter_type;
    this.auxMode = aux_mode;
    this.current = current !== 0x3FFFFF ? current / 1000 : undefined;
    this.voltage = voltage !== 0x7FFF ? voltage / 100 : undefined;
    this.alarm = alarm;
    if (aux_mode === AuxMode.STARTER_VOLTAGE) {
      this.starterVoltage = BitReader.toSignedInt(aux, 16) / 100;
    } else if (aux_mode === AuxMode.TEMPERATURE) {
      this.temperature = aux !== 0xFFFF ? aux / 100 : undefined;
    }
  }
} 