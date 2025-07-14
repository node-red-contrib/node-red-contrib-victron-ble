import { BitReader, ChargerError, Device, OperationMode } from './base';

export class SolarCharger extends Device {
  chargeState?: OperationMode;
  chargerError?: ChargerError;
  batteryVoltage?: number;
  batteryChargingCurrent?: number;
  yieldToday?: number;
  solarPower?: number;
  externalDeviceLoad?: number;

  parseDecrypted(decrypted: Buffer): void {
    const reader = new BitReader(decrypted);
    const charge_state = reader.readUnsignedInt(8);
    const charger_error = reader.readUnsignedInt(8);
    const battery_voltage = reader.readSignedInt(16);
    const battery_charging_current = reader.readSignedInt(16);
    const yield_today = reader.readUnsignedInt(16);
    const solar_power = reader.readUnsignedInt(16);
    const external_device_load = reader.readUnsignedInt(9);

    this.chargeState = charge_state !== 0xFF ? charge_state as OperationMode : undefined;
    this.chargerError = charger_error !== 0xFF ? charger_error as ChargerError : undefined;
    this.batteryVoltage = battery_voltage !== 0x7FFF ? battery_voltage / 100 : undefined;
    this.batteryChargingCurrent = battery_charging_current !== 0x7FFF ? battery_charging_current / 10 : undefined;
    this.yieldToday = yield_today !== 0xFFFF ? yield_today * 10 : undefined;
    this.solarPower = solar_power !== 0xFFFF ? solar_power : undefined;
    this.externalDeviceLoad = external_device_load !== 0x1FF ? external_device_load / 10 : undefined;
  }
} 