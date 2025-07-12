import { AlarmReason, BitReader, Device, DeviceData, kelvinToCelsius } from './base';
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

export class DcEnergyMeterData extends DeviceData {
  getMeterType(): MeterType {
    return this._data['meter_type'];
  }
  getCurrent(): number | null {
    return this._data['current'] ?? null;
  }
  getVoltage(): number | null {
    return this._data['voltage'] ?? null;
  }
  getAlarm(): AlarmReason | null {
    return this._data['alarm'] > 0 ? this._data['alarm'] : null;
  }
  getAuxMode(): AuxMode {
    return this._data['aux_mode'];
  }
  getTemperature(): number | null {
    const temp = this._data['temperature_kelvin'];
    return temp ? kelvinToCelsius(temp) : null;
  }
  getStarterVoltage(): number | null {
    return this._data['starter_voltage'] ?? null;
  }
}

export class DcEnergyMeter extends Device {
  dataType = DcEnergyMeterData;

  parseDecrypted(decrypted: Buffer): Record<string, any> {
    const reader = new BitReader(decrypted);
    const meter_type = reader.readSignedInt(16);
    const voltage = reader.readSignedInt(16);
    const alarm = reader.readUnsignedInt(16);
    const aux = reader.readUnsignedInt(16);
    const aux_mode = reader.readUnsignedInt(2);
    const current = reader.readSignedInt(22);
    const parsed: Record<string, any> = {
      meter_type: meter_type,
      aux_mode: aux_mode,
      current: current !== 0x3FFFFF ? current / 1000 : null,
      voltage: voltage !== 0x7FFF ? voltage / 100 : null,
      alarm: alarm,
    };
    if (aux_mode === AuxMode.STARTER_VOLTAGE) {
      parsed['starter_voltage'] = BitReader.toSignedInt(aux, 16) / 100;
    } else if (aux_mode === AuxMode.TEMPERATURE) {
      parsed['temperature_kelvin'] = aux !== 0xFFFF ? aux / 100 : null;
    }
    return parsed;
  }
} 