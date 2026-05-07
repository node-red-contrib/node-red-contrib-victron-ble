#!/usr/bin/env node

import { Command, Option } from 'commander';
import { BleAdapterMode } from './ble/get-ble-adapter';
import { DiscoveredDevice, Scanner } from './scanner';

// Singleton scanner instance
let scanner: Scanner | null = null;
async function getScanner(adapterMode: BleAdapterMode): Promise<Scanner> {
  if (!scanner) {
    scanner = new Scanner(adapterMode);
    await scanner.start();
  }
  return scanner;
}

async function discoverDevices(adapterMode: BleAdapterMode): Promise<void> {
  const scanner = await getScanner(adapterMode);
  console.log('Discovering devices. Press Ctrl+C to stop.');
  process.on('SIGINT', () => {
    scanner.stop();
    process.exit(0);
  });
  
  let lastDevices: DiscoveredDevice[] = [];
 
  // Keep alive
  setInterval(() => {
   
    const devices = scanner.getDiscoveredDevices();
    if (JSON.stringify(devices) != JSON.stringify(lastDevices)) {
      console.log('\nDiscovered devices:');
      devices.forEach(dev => {
        console.log(`${dev.address}: ${dev.name} (RSSI: ${dev.rssi})`);
      });
      lastDevices= devices;
    }
  }, 1000);
}

async function readDeviceData(address: string, key: string, adapterMode: BleAdapterMode): Promise<void> {
  const scanner = await getScanner(adapterMode);
  scanner.setSettings(address, key, true);
  console.log(`Reading data for ${address}. Press Ctrl+C to stop.`);
  scanner.on('parsed', (data) => {
    if (data.address.toLowerCase() === address.toLowerCase()) {
      console.log(JSON.stringify(data, null, 2));
    }
  });
  process.on('SIGINT', () => {
    scanner.stop();
    process.exit(0);
  });
  setInterval(() => {}, 1000);
}

const program = new Command();
const adapterModes: BleAdapterMode[] = ['auto', 'bluez', 'bluetoothctl', 'noble'];
const bluetoothOption = () =>
  new Option('--bluetooth <backend>', 'Bluetooth backend').choices(adapterModes).default('auto');

program
  .name('victron-ble')
  .description('Node.js library to parse Instant Readout advertisement data from Victron devices')
  .version('1.0.0');

program
  .option('-v, --verbose', 'Increase logging output')
  .hook('preAction', (thisCommand) => {
    const options = thisCommand.opts();
    if (options.verbose) {
      console.debug = console.log;
    } else {
      console.debug = () => {};
    }
  });

program
  .command('discover')
  .description('Discover Victron devices with Instant Readout')
  .addOption(bluetoothOption())
  .action(async (options: { bluetooth: BleAdapterMode }) => {
    await discoverDevices(options.bluetooth);
  });

program
  .command('read')
  .description('Read data from a specified device')
  .argument('<address>', 'Device address')
  .argument('<key>', 'Decryption key')
  .addOption(bluetoothOption())
  .action(async (address: string, key: string, options: { bluetooth: BleAdapterMode }) => {
    await readDeviceData(address, key, options.bluetooth);
  });

program.parse(); 
