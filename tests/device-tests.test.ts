import * as fs from 'fs';
import * as path from 'path';

interface TestCase {
  name: string;
  decryptedData?: string;
  rawData?: string;
  decryptionKey?: string;
  payload: Record<string, any>;
}

function loadTestData(filePath: string): TestCase[] {
  if (!fs.existsSync(filePath)) {
    return [];
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function getDeviceClass(deviceType: string): any {
  try {
    // Dynamic import of device class
    const deviceModule = require(`../src/devices/${deviceType}`);
    
    // Find the first exported class (should be the device class)
    const exports = Object.keys(deviceModule);
    const deviceClass = exports.find(exportName => 
      typeof deviceModule[exportName] === 'function' && 
      deviceModule[exportName].prototype &&
      deviceModule[exportName].name !== 'Object'
    );
    
    if (!deviceClass) {
      console.warn(`No device class found in module ../src/devices/${deviceType}. Available exports:`, exports);
      return null;
    }
    
    return deviceModule[deviceClass];
  } catch (error) {
    console.warn(`Could not load device module ../src/devices/${deviceType}:`, error instanceof Error ? error.message : String(error));
    return null;
  }
}

function runDeviceTests(deviceType: string, DeviceClass: any) {
  describe(`${deviceType} device tests`, () => {
    const filePath = path.join(__dirname, 'data', `${deviceType}.json`);
    const testCases = loadTestData(filePath);
    
    if (testCases.length === 0) {
      test('no test cases found', () => {
        console.warn(`No test cases found for ${deviceType}`);
      });
      return;
    }
    
    testCases.forEach((testCase) => {
      test(testCase.name, () => {
        let device: any;
        
        if (testCase.rawData && testCase.decryptionKey) {
          // Test with raw encrypted data and decryption key
          device = new DeviceClass(testCase.decryptionKey);
          device.parse(Buffer.from(testCase.rawData, 'hex'));
        } else if (testCase.decryptedData) {
          // Test with pre-decrypted data
          device = new DeviceClass("dummy_key");
          device.parseDecrypted(Buffer.from(testCase.decryptedData, 'hex'));
        } else {
          throw new Error(`Test case "${testCase.name}" must have either (rawData + decryptionKey) or decryptedData`);
        }
        
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

// Automatically discover and run tests for all JSON files in tests/data
const dataDir = path.join(__dirname, 'data');
if (fs.existsSync(dataDir)) {
  const jsonFiles = fs.readdirSync(dataDir)
    .filter(file => file.endsWith('.json'))
    .map(file => file.replace('.json', ''));
  
  jsonFiles.forEach((deviceType) => {
    const DeviceClass = getDeviceClass(deviceType);
    if (DeviceClass) {
      runDeviceTests(deviceType, DeviceClass);
    } else {
      describe(`${deviceType} device tests`, () => {
        test('device class not found', () => {
          throw new Error(`Could not load device class for ${deviceType}`);
        });
      });
    }
  });
} else {
  describe('Device tests', () => {
    test('data directory not found', () => {
      throw new Error('tests/data directory not found');
    });
  });
}
