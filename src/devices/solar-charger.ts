import { BitReader, ChargerError, Device, DeviceData, OperationMode } from './base';

export class SolarChargerData extends DeviceData {
  getChargeState(): OperationMode | null {
    return this._data['charge_state'] ?? null;
  }
  getChargerError(): ChargerError | null {
    return this._data['charger_error'] ?? null;
  }
  getBatteryVoltage(): number | null {
    return this._data['battery_voltage'] ?? null;
  }
  getBatteryChargingCurrent(): number | null {
    return this._data['battery_charging_current'] ?? null;
  }
  getYieldToday(): number | null {
    return this._data['yield_today'] ?? null;
  }
  getSolarPower(): number | null {
    return this._data['solar_power'] ?? null;
  }
  getExternalDeviceLoad(): number | null {
    return this._data['external_device_load'] ?? null;
  }
}

export class SolarCharger extends Device {
  dataType = SolarChargerData;

  parseDecrypted(decrypted: Buffer): Record<string, any> {
    const reader = new BitReader(decrypted);
    const charge_state = reader.readUnsignedInt(8);
    const charger_error = reader.readUnsignedInt(8);
    const battery_voltage = reader.readSignedInt(16);
    const battery_charging_current = reader.readSignedInt(16);
    const yield_today = reader.readUnsignedInt(16);
    const solar_power = reader.readUnsignedInt(16);
    const external_device_load = reader.readUnsignedInt(9);
    return {
      charge_state: charge_state !== 0xFF ? OperationMode[charge_state] ?? null : null,
      charger_error: charger_error !== 0xFF ? ChargerError[charger_error] ?? null : null,
      battery_voltage: battery_voltage !== 0x7FFF ? battery_voltage / 100 : null,
      battery_charging_current: battery_charging_current !== 0x7FFF ? battery_charging_current / 10 : null,
      yield_today: yield_today !== 0xFFFF ? yield_today * 10 : null,
      solar_power: solar_power !== 0xFFFF ? solar_power : null,
      external_device_load: external_device_load !== 0x1FF ? external_device_load / 10 : null,
    };
  }
} 