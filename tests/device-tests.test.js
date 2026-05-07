const { describe, test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function loadTestData(filePath) {
  if (!fs.existsSync(filePath)) {
    return [];
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function getDeviceClass(deviceType) {
  try {
    const deviceModule = require(`../dist/devices/${deviceType}`);
    const exports = Object.keys(deviceModule);
    const deviceClass = exports.find((exportName) =>
      typeof deviceModule[exportName] === 'function' &&
      deviceModule[exportName].prototype &&
      deviceModule[exportName].name !== 'Object'
    );

    if (!deviceClass) {
      console.warn(`No device class found in module ../dist/devices/${deviceType}. Available exports:`, exports);
      return null;
    }

    return deviceModule[deviceClass];
  } catch (error) {
    console.warn(`Could not load device module ../dist/devices/${deviceType}:`, error instanceof Error ? error.message : String(error));
    return null;
  }
}

function runDeviceTests(deviceType, DeviceClass) {
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
        let device;

        if (testCase.rawData && testCase.decryptionKey) {
          device = new DeviceClass(testCase.decryptionKey);
          device.parse(Buffer.from(testCase.rawData, 'hex'));
        } else if (testCase.decryptedData) {
          device = new DeviceClass('dummy_key');
          device.parseDecrypted(Buffer.from(testCase.decryptedData, 'hex'));
        } else {
          throw new Error(`Test case "${testCase.name}" must have either (rawData + decryptionKey) or decryptedData`);
        }

        Object.entries(testCase.payload).forEach(([key, expectedValue]) => {
          const actualValue = device[key];

          if (expectedValue === null) {
            assert.equal(actualValue == null, true);
          } else if (typeof expectedValue === 'number') {
            assert.ok(Math.abs(actualValue - expectedValue) < 0.005, `${key}: expected ${actualValue} to be close to ${expectedValue}`);
          } else {
            assert.equal(actualValue, expectedValue);
          }
        });
      });
    });
  });
}

const dataDir = path.join(__dirname, 'data');
if (fs.existsSync(dataDir)) {
  const jsonFiles = fs.readdirSync(dataDir)
    .filter((file) => file.endsWith('.json'))
    .map((file) => file.replace('.json', ''));

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
