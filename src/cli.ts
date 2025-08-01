#!/usr/bin/env node

import { Command } from 'commander';
import { DiscoveredDevice, Scanner } from './scanner';

// Singleton scanner instance
let scanner: Scanner | null = null;
function getScanner(): Scanner {
  if (!scanner) {
    scanner = new Scanner();
    scanner.start();
  }
  return scanner;
}

async function discoverDevices(): Promise<void> {
  const scanner = getScanner();
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

async function readDeviceData(address: string, key: string): Promise<void> {
  const scanner = getScanner();
  scanner.setKey(address, key);
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
  .action(async () => {
    await discoverDevices();
  });

program
  .command('read')
  .description('Read data from a specified device')
  .argument('<address>', 'Device address')
  .argument('<key>', 'Decryption key')
  .action(async (address: string, key: string) => {
    await readDeviceData(address, key);
  });

program.parse(); 