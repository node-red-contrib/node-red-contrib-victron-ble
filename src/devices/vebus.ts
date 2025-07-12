import { ACInState, AlarmNotification, BitReader, Device, DeviceData, OperationMode } from './base';

export class VEBusData extends DeviceData {
  getDeviceState(): OperationMode | null {
    return this._data['device_state'] ?? null;
  }
  getError(): number | null {
    return this._data['error'] ?? null;
  }
  getAlarm(): AlarmNotification | null {
    return this._data['alarm'] ?? null;
  }
  getAcInState(): ACInState | null {
    return this._data['ac_in_state'] ?? null;
  }
  getAcInPower(): number | null {
    return this._data['ac_in_power'] ?? null;
  }
  getAcOutPower(): number | null {
    return this._data['ac_out_power'] ?? null;
  }
  getBatteryCurrent(): number | null {
    return this._data['battery_current'] ?? null;
  }
  getBatteryVoltage(): number | null {
    return this._data['battery_voltage'] ?? null;
  }
  getBatteryTemperature(): number | null {
    return this._data['battery_temperature'] ?? null;
  }
  getSoc(): number | null {
    return this._data['soc'] ?? null;
  }
}

export class VEBus extends Device {
  dataType = VEBusData;

  parseDecrypted(decrypted: Buffer): Record<string, any> {
    const reader = new BitReader(decrypted);
    const device_state = reader.readUnsignedInt(8);
    const error = reader.readUnsignedInt(8);
    const battery_current = reader.readSignedInt(16);
    const battery_voltage = reader.readUnsignedInt(14);
    const ac_in_state = reader.readUnsignedInt(2);
    const ac_in_power = reader.readSignedInt(19);
    const ac_out_power = reader.readSignedInt(19);
    const alarm = reader.readUnsignedInt(2);
    const battery_temperature = reader.readUnsignedInt(7);
    const soc = reader.readUnsignedInt(7);
    return {
      device_state: device_state !== 0xFF ? OperationMode[device_state] ?? null : null,
      error: error !== 0xFF ? error : null,
      battery_voltage: battery_voltage !== 0x3FFF ? battery_voltage / 100 : null,
      battery_current: battery_current !== 0x7FFF ? battery_current / 10 : null,
      ac_in_state: ac_in_state !== 3 ? ACInState[ac_in_state] ?? null : null,
      ac_in_power: ac_in_power !== 0x3FFFF ? ac_in_power : null,
      ac_out_power: ac_out_power !== 0x3FFFF ? ac_out_power : null,
      alarm: alarm !== 3 ? AlarmNotification[alarm] ?? null : null,
      battery_temperature: battery_temperature !== 0x7F ? (battery_temperature - 40) : null,
      soc: soc !== 0x7F ? soc : null,
    };
  }
} 