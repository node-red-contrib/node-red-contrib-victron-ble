import { DeviceData, kelvinToCelsius, Device, BitReader, AlarmReason } from './base';
import { AuxMode } from './battery-monitor';

export class BatterySenseData extends DeviceData {
  getTemperature(): number | null {
    return this._data['temperature_kelvin'] ? kelvinToCelsius(this._data['temperature_kelvin']) : null;
  }
  getVoltage(): number | null {
    return this._data['voltage'] ?? null;
  }
}

export class BatterySense extends Device {
  dataType = BatterySenseData;

  parseDecrypted(decrypted: Buffer): Record<string, any> {
    // Use the same parsing logic as BatteryMonitor
    const reader = new BitReader(decrypted);
    const remaining_mins = reader.readUnsignedInt(16);
    const voltage = reader.readSignedInt(16);
    const alarm = reader.readUnsignedInt(16);
    const aux = reader.readUnsignedInt(16);
    const aux_mode = reader.readUnsignedInt(2);
    const current = reader.readSignedInt(22);
    const consumed_ah = reader.readUnsignedInt(20);
    const soc = reader.readUnsignedInt(10);

    const parsed: Record<string, any> = {
      remaining_mins: remaining_mins !== 0xffff ? remaining_mins : null,
      voltage: voltage !== 0x7fff ? voltage / 100 : null,
      alarm: alarm in AlarmReason ? alarm : AlarmReason.NO_ALARM,
      aux_mode: aux_mode in AuxMode ? aux_mode : AuxMode.DISABLED,
      current: current !== 0x3fffff ? current / 1000 : null,
      consumed_ah: consumed_ah !== 0xfffff ? -consumed_ah / 10 : null,
      soc: soc !== 0x3ff ? soc / 10 : null,
    };

    if (aux_mode === AuxMode.STARTER_VOLTAGE) {
      parsed['starter_voltage'] = BitReader.toSignedInt(aux, 16) / 100;
    } else if (aux_mode === AuxMode.MIDPOINT_VOLTAGE) {
      parsed['midpoint_voltage'] = aux / 100;
    } else if (aux_mode === AuxMode.TEMPERATURE) {
      parsed['temperature_kelvin'] = aux / 100;
    }

    return parsed;
  }
} 