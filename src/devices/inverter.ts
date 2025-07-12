import { AlarmReason, BitReader, Device, DeviceData, OperationMode } from './base';

export class InverterData extends DeviceData {
  getDeviceState(): OperationMode | null {
    return this._data['device_state'] ?? null;
  }
  getAlarm(): AlarmReason | null {
    return this._data['alarm'] > 0 ? this._data['alarm'] : null;
  }
  getBatteryVoltage(): number | null {
    return this._data['battery_voltage'] ?? null;
  }
  getAcApparentPower(): number | null {
    return this._data['ac_apparent_power'] ?? null;
  }
  getAcVoltage(): number | null {
    return this._data['ac_voltage'] ?? null;
  }
  getAcCurrent(): number | null {
    return this._data['ac_current'] ?? null;
  }
}

export class Inverter extends Device {
  dataType = InverterData;

  parseDecrypted(decrypted: Buffer): Record<string, any> {
    const reader = new BitReader(decrypted);
    const device_state = reader.readUnsignedInt(8);
    const alarm = reader.readUnsignedInt(16);
    const battery_voltage = reader.readSignedInt(16);
    const ac_apparent_power = reader.readUnsignedInt(16);
    const ac_voltage = reader.readUnsignedInt(15);
    const ac_current = reader.readUnsignedInt(11);
    return {
      device_state: device_state !== 0xFF ? OperationMode[device_state] ?? null : null,
      alarm: alarm,
      battery_voltage: battery_voltage !== 0x7FFF ? battery_voltage / 100 : null,
      ac_apparent_power: ac_apparent_power !== 0xFFFF ? ac_apparent_power : null,
      ac_voltage: ac_voltage !== 0x7FFF ? ac_voltage / 100 : null,
      ac_current: ac_current !== 0x7FF ? ac_current / 10 : null,
    };
  }
} 