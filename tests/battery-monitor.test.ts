import { BatteryMonitor, AuxMode } from '../src/devices/battery-monitor';
import { AlarmReason } from '../src/devices/base';

describe('BatteryMonitor', () => {
  test('end to end parse', () => {
    const data = "100289a302b040af925d09a4d89aa0128bdef48c6298a9";
    const parser = new BatteryMonitor("aff4d0995b7d1e176c0c33ecb9e70dcd");
    const actual = parser.parse(Buffer.from(data, 'hex'));

    expect(actual.auxMode).toBe(AuxMode.DISABLED);
    expect(actual.consumedAh).toBe(-50.0);
    expect(actual.current).toBe(0);
    expect(actual.remainingMins).toBeUndefined();
    expect(actual.soc).toBe(50.0);
    expect(actual.voltage).toBe(12.53);
    expect(actual.alarm).toBe(AlarmReason.NO_ALARM);
    expect(actual.temperature).toBeUndefined();
    expect(actual.starterVoltage).toBeUndefined();
    expect(actual.midpointVoltage).toBeUndefined();
    expect(actual.getModelName()).toBe("SmartShunt 500A/50mV");
  });

  function parseDecrypted(decrypted: string): BatteryMonitor {
    const parser = new BatteryMonitor("dummy_key");
    parser.parseDecrypted(Buffer.from(decrypted, 'hex'));
    return parser;
  }

  test('parse decrypted data', () => {
    const actual = parseDecrypted("ffffe50400000000030000f40140df03");
    
    expect(actual.auxMode).toBe(AuxMode.DISABLED);
    expect(actual.consumedAh).toBe(-50.0);
    expect(actual.current).toBe(0);
    expect(actual.remainingMins).toBeUndefined();
    expect(actual.soc).toBe(50.0);
    expect(actual.voltage).toBe(12.53);
    expect(actual.alarm).toBe(AlarmReason.NO_ALARM);
    expect(actual.temperature).toBeUndefined();
    expect(actual.starterVoltage).toBeUndefined();
    expect(actual.midpointVoltage).toBeUndefined();
  });

  test('aux midpoint voltage', () => {
    const actual = parseDecrypted("ffffe6040000feff010000000080fe0c");
    expect(actual.auxMode).toBe(AuxMode.MIDPOINT_VOLTAGE);
    expect(actual.midpointVoltage).toBe(655.34);
  });

  test('aux starter voltage', () => {
    const actual = parseDecrypted("ffffe6040000feff000000000080feac");
    expect(actual.auxMode).toBe(AuxMode.STARTER_VOLTAGE);
    expect(actual.starterVoltage).toBe(-0.02);
  });

  test('aux temperature', () => {
    const actual = parseDecrypted("ffffe6040000ffff020000000080fede");
    expect(actual.auxMode).toBe(AuxMode.TEMPERATURE);
    expect(actual.temperature).toBe(655.35);
  });

  test('key mismatch should throw error', () => {
    const data = "100289a302bb01af129087600b9b97bc2c32867c8238da";
    const parser = new BatteryMonitor("ffffffffffffffffffffffffffffffff");
    
    expect(() => {
      parser.parse(Buffer.from(data, 'hex'));
    }).toThrow();
  });
});
