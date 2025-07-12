import { BitReader, Device, DeviceData } from './base';

export class LynxSmartBMSData extends DeviceData {
  getErrorFlags(): number {
    return this._data['error_flags'];
  }
  getRemainingMins(): number | null {
    return this._data['remaining_mins'] ?? null;
  }
  getVoltage(): number | null {
    return this._data['voltage'] ?? null;
  }
  getCurrent(): number | null {
    return this._data['current'] ?? null;
  }
  getIoStatus(): number {
    return this._data['io_status'];
  }
  getAlarmFlags(): number {
    return this._data['alarm_flags'];
  }
  getSoc(): number | null {
    return this._data['soc'] ?? null;
  }
  getConsumedAh(): number | null {
    return this._data['consumed_ah'] ?? null;
  }
  getBatteryTemperature(): number | null {
    return this._data['battery_temperature'] ?? null;
  }
}

export class LynxSmartBMS extends Device {
  dataType = LynxSmartBMSData;

  parseDecrypted(decrypted: Buffer): Record<string, any> {
    const reader = new BitReader(decrypted);
    const error_flags = reader.readUnsignedInt(8);
    const remaining_mins = reader.readUnsignedInt(16);
    const voltage = reader.readSignedInt(16);
    const current = reader.readSignedInt(16);
    const io_status = reader.readUnsignedInt(16);
    const alarm_flags = reader.readUnsignedInt(18);
    const soc = reader.readUnsignedInt(10);
    const consumed_ah = reader.readUnsignedInt(20);
    const temperature = reader.readUnsignedInt(7);
    return {
      error_flags,
      remaining_mins: remaining_mins !== 0xFFFF ? remaining_mins : null,
      voltage: voltage !== 0x7FFF ? voltage / 100 : null,
      current: current !== 0x7FFF ? current / 10 : null,
      io_status,
      alarm_flags,
      soc: soc !== 0x3FFF ? soc / 10.0 : null,
      consumed_ah: consumed_ah !== 0xFFFFF ? consumed_ah / 10 : null,
      battery_temperature: temperature !== 0x7F ? (temperature - 40) : null,
    };
  }
} 