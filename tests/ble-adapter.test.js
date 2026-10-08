const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');

// Isolate module caches and loader stubs; no Bluetooth hardware is accessed.
function runScenario(body, { workingNoble = false, brokenBluezConstructor = false } = {}) {
  const result = spawnSync(process.execPath, ['-e', `
    const assert = require('node:assert/strict');
    const Module = require('node:module');
    const { EventEmitter } = require('node:events');
    const calls = [];
    const load = Module._load;
    Module._load = function(request, parent, isMain) {
      if (request === '@abandonware/noble') {
        calls.push('load noble');
        if (!${workingNoble}) {
          throw new Error('NODE_MODULE_VERSION 115; this Node.js requires 137');
        }
        const noble = new EventEmitter();
        noble.on('newListener', (event) => {
          if (event === 'stateChange') process.nextTick(() => noble.emit('stateChange', 'poweredOn'));
        });
        noble.startScanning = (_services, _duplicates, callback) => {
          calls.push('start noble');
          callback();
        };
        noble.stopScanning = async () => { calls.push('stop noble'); };
        return noble;
      }
      if (${brokenBluezConstructor} && request === './dbus-adapter') {
        return { DbusBleAdapter: class { constructor() { throw new Error('BlueZ constructor failed'); } } };
      }
      return load.call(this, request, parent, isMain);
    };
    const { DbusBleAdapter } = require('./dist/ble/dbus-adapter');
    const { BluetoothctlBleAdapter } = require('./dist/ble/bluetoothctl-adapter');
    DbusBleAdapter.prototype.startScan = async () => { calls.push('start bluez'); };
    DbusBleAdapter.prototype.stopScan = async () => { calls.push('stop bluez'); };
    BluetoothctlBleAdapter.prototype.startScan = async () => { calls.push('start bluetoothctl'); };
    BluetoothctlBleAdapter.prototype.stopScan = async () => { calls.push('stop bluetoothctl'); };
    (async () => { ${body} })().catch(error => { console.error(error); process.exitCode = 1; });
  `], { cwd: path.resolve(__dirname, '..'), encoding: 'utf8', timeout: 10000 });
  assert.equal(result.error, undefined, String(result.error));
  assert.equal(result.status, 0, result.stdout + result.stderr);
}

test('Node-RED registers the node without loading incompatible Noble bindings', () => {
  runScenario(`
    let registered;
    require('./dist/nodered/victron-ble')({
      httpAdmin: { get() {} },
      nodes: { registerType(name) { registered = name; } }
    });
    assert.equal(registered, 'victron-ble');
    assert.deepEqual(calls, []);
  `);
});

test('auto and explicit BlueZ selection do not load Noble', () => {
  runScenario(`
    const { getBleAdapter } = require('./dist/ble/get-ble-adapter');
    assert.ok(await getBleAdapter() instanceof DbusBleAdapter);
    assert.ok(await getBleAdapter('bluez') instanceof DbusBleAdapter);
    assert.deepEqual(calls, ['start bluez', 'start bluez']);
  `);
});

test('failed BlueZ startup is cleaned up before bluetoothctl fallback', () => {
  runScenario(`
    DbusBleAdapter.prototype.startScan = async () => { calls.push('start bluez'); throw new Error('BlueZ unavailable'); };
    const { getBleAdapter } = require('./dist/ble/get-ble-adapter');
    assert.ok(await getBleAdapter() instanceof BluetoothctlBleAdapter);
    assert.deepEqual(calls, ['start bluez', 'stop bluez', 'start bluetoothctl']);
  `);
});

test('adapter construction errors allow the next backend to run', () => {
  runScenario(`
    const { getBleAdapter } = require('./dist/ble/get-ble-adapter');
    assert.ok(await getBleAdapter() instanceof BluetoothctlBleAdapter);
    assert.deepEqual(calls, ['start bluetoothctl']);
  `, { brokenBluezConstructor: true });
});

test('all-backend failure includes the native binding error and cleans up failed scans', () => {
  runScenario(`
    DbusBleAdapter.prototype.startScan = async () => { throw new Error('BlueZ unavailable'); };
    BluetoothctlBleAdapter.prototype.startScan = async () => { throw new Error('bluetoothctl unavailable'); };
    const { getBleAdapter } = require('./dist/ble/get-ble-adapter');
    await assert.rejects(getBleAdapter(), /No BLE adapter available.*BlueZ DBus: BlueZ unavailable.*bluetoothctl: bluetoothctl unavailable.*noble: NODE_MODULE_VERSION 115/);
    assert.deepEqual(calls, ['stop bluez', 'stop bluetoothctl', 'load noble']);
  `);
});

test('explicit Noble failure is reported without attempting other backends', () => {
  runScenario(`
    const { getBleAdapter } = require('./dist/ble/get-ble-adapter');
    await assert.rejects(getBleAdapter('noble'), /No BLE adapter available. Tried noble: NODE_MODULE_VERSION 115/);
    assert.deepEqual(calls, ['load noble']);
  `);
});

test('working Noble remains available as the final fallback', () => {
  runScenario(`
    DbusBleAdapter.prototype.startScan = async () => { throw new Error('BlueZ unavailable'); };
    BluetoothctlBleAdapter.prototype.startScan = async () => { throw new Error('bluetoothctl unavailable'); };
    const { getBleAdapter } = require('./dist/ble/get-ble-adapter');
    const adapter = await getBleAdapter();
    await adapter.stopScan();
    assert.deepEqual(calls, ['stop bluez', 'stop bluetoothctl', 'load noble', 'start noble', 'stop noble']);
  `, { workingNoble: true });
});
