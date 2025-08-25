import { detectDeviceType } from '../src/devices';
import { BatteryMonitor } from '../src/devices/battery-monitor';

describe('Device Discovery', () => {
  test('detect battery monitor', () => {
    const data = Buffer.from("100289a302b040af925d09a4d89aa0128bdef48c6298a9", 'hex');
    const DeviceClass = detectDeviceType(data);
    expect(DeviceClass).toBe(BatteryMonitor);
  });

  test('unknown device returns null', () => {
    const data = Buffer.from("100289a30e0040af925d09a4d89aa0128bdef48c6298a9", 'hex');
    const DeviceClass = detectDeviceType(data);
    expect(DeviceClass).toBeNull();
  });
});
