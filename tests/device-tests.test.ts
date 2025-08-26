import * as fs from 'fs';
import * as path from 'path';
import { BatteryMonitor } from '../src/devices/battery-monitor';
import { SolarCharger } from '../src/devices/solar-charger';
import { DcEnergyMeter } from '../src/devices/dc-energy-meter';
import { AcCharger } from '../src/devices/ac-charger';
import { BatterySense } from '../src/devices/battery-sense';
import { DcDcConverter } from '../src/devices/dcdc-converter';
import { LynxSmartBMS } from '../src/devices/lynx-smart-bms';

interface TestCase {
  name: string;
  parseDecrypted: string;
  payload: Record<string, any>;
}

const deviceClasses = {
  'battery-monitor': BatteryMonitor,
  'solar-charger': SolarCharger,
  'dc-energy-meter': DcEnergyMeter,
  'ac-charger': AcCharger,
  'battery-sense': BatterySense,
  'dcdc-converter': DcDcConverter,
  'lynx-smart-bms': LynxSmartBMS,
};

function loadTestData(deviceType: string): TestCase[] {
  const filePath = path.join(__dirname, 'data', `${deviceType}.json`);
  if (!fs.existsSync(filePath)) {
    return [];
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function runDeviceTests(deviceType: string, DeviceClass: any) {
  describe(`${deviceType} device tests`, () => {
    const testCases = loadTestData(deviceType);
    
    testCases.forEach((testCase) => {
      test(testCase.name, () => {
        const device = new DeviceClass("dummy_key");
        device.parseDecrypted(Buffer.from(testCase.parseDecrypted, 'hex'));
        
        // Check each expected property
        Object.entries(testCase.payload).forEach(([key, expectedValue]) => {
          const actualValue = (device as any)[key];
          
          if (expectedValue === null) {
            expect(actualValue == null).toBe(true); // handles both null and undefined
          } else if (typeof expectedValue === 'number') {
            expect(actualValue).toBeCloseTo(expectedValue, 2);
          } else {
            expect(actualValue).toBe(expectedValue);
          }
        });
      });
    });
  });
}

// Run tests for all device types
Object.entries(deviceClasses).forEach(([deviceType, DeviceClass]) => {
  runDeviceTests(deviceType, DeviceClass);
});
