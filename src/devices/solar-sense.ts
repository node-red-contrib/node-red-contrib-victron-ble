import { BitReader, ChargerError, Device, EnumField } from './base';

export class SolarSense extends Device {
  errorCode?: number;
  @EnumField(ChargerError)
  chargerError?: ChargerError;
  installationPower?: number;
  todaysYield?: number;
  irradiance?: number;
  cellTemperature?: number;
  batteryVoltage?: number;
  timeSinceLastSun?: number;

  // SolarSense transmits plaintext — no AES-CTR encryption
  parse(data: Buffer): this {
    this.modelId = this.getModelId(data);
    this.decryptedData = data.slice(8);
    this.parseDecrypted(this.decryptedData);
    return this;
  }

  parseDecrypted(decrypted: Buffer): void {
    const reader = new BitReader(decrypted);
    const error_code = reader.readUnsignedInt(32);
    const charger_error = reader.readUnsignedInt(8);
    const installation_power = reader.readUnsignedInt(20);
    const todays_yield = reader.readUnsignedInt(20);
    const irradiance = reader.readUnsignedInt(14);
    const cell_temperature = reader.readUnsignedInt(11);
    reader.readUnsignedInt(1);
    const battery_voltage = reader.readUnsignedInt(8);
    reader.readUnsignedInt(1); // txPowerLevel
    const time_since_last_sun = reader.readUnsignedInt(7);

    this.errorCode = error_code;
    this.chargerError = charger_error !== 0xFF ? charger_error as ChargerError : undefined;
    this.installationPower = installation_power !== 0xFFFFF ? installation_power : undefined;
    this.todaysYield = todays_yield !== 0xFFFFF ? todays_yield * 10 : undefined;
    this.irradiance = irradiance !== 0x3FFF ? irradiance / 10 : undefined;
    this.cellTemperature = cell_temperature !== 0x7FF ? cell_temperature / 10 - 60 : undefined;
    this.batteryVoltage = battery_voltage !== 0xFF ? battery_voltage / 100 + 1.7 : undefined;
    this.timeSinceLastSun = SolarSense.decodeTimeSinceLastSun(time_since_last_sun);
  }

  private static decodeTimeSinceLastSun(raw: number): number | undefined {
    if (raw === 0x7F) return undefined;
    if (raw < 30) return raw * 2;
    if (raw < 96) return 60 + 10 * (raw - 30);
    return 720 + 30 * (raw - 96);
  }
}
