import { BLEAdapter, BLEDevice, BLERawPacket } from './ble-adapter';
import { EventEmitter } from 'events';
import { spawn } from 'child_process';

interface BLEDeviceWithRssi extends BLEDevice {
  rssi?: number;
}

// No PendingDevice interface needed; use a simple object with explicit type

type PendingValueBlock = { address: string; key?: string; valueLines: string[] };

export class BluetoothctlBleAdapter extends EventEmitter implements BLEAdapter {
  private scanning = false;
  private discovered: Map<string, BLEDeviceWithRssi> = new Map();
  private process: ReturnType<typeof spawn> | null = null;
  private buffer = '';
  private pendingValue: PendingValueBlock | null = null;
  private lastDevicesCommand: number = 0;
  private lineQueue: string[] = [];
  private processing = false;
  private valueParsing: { address: string; valueLines: string[] } | null = null;


  async startScan(): Promise<void> {
    this.scanning = true;
    return new Promise((resolve, reject) => {
      this.process = spawn('bluetoothctl', []);
      let errorHandled = false;
      if (this.process.stdout) {
        this.process.stdout.setEncoding('utf8');
        this.process.stdout.on('data', (data: string) => {
          // Split data into lines and enqueue them as fast as possible
          this.buffer += data;
          let lines = this.buffer.split(/\r?\n/);
          this.buffer = lines.pop() || '';
          for (const line of lines) {
            this.lineQueue.push(line);
          }
          this.startProcessingLoop();
        });
      }
      if (this.process.stderr) {
        this.process.stderr.on('data', (data: string) => {
          // Optionally log errors
        });
      }
      this.process.on('close', () => {
        this.scanning = false;
      });
      this.process.on('error', (err) => {
        if (!errorHandled) {
          errorHandled = true;
          reject(err);
        }
      });
      // Send 'devices' command at the start to populate name cache
      setTimeout(() => {
        if (this.process && this.process.stdin) {
          this.process.stdin.write('devices\n');
        }
      }, 800);
      // Do send 'scan on' (even if it fails, it does not hurt)
      setTimeout(() => {
        if (this.process && this.process.stdin) {
          this.process.stdin.write('scan on\nscan.duplicate-data off\n');
          this.lastDevicesCommand = Date.now();
        }
      }, 300);
      
      // Resolve immediately for compatibility (or after a short delay if you want to ensure process started)
      setTimeout(() => {
        if (!errorHandled) {
          resolve();
        }
      }, 100); // 100ms delay to catch immediate spawn errors
    });
  }

  private async startProcessingLoop() {
    if (this.processing) return;
    this.processing = true;
    while (this.lineQueue.length > 0) {
      const line = this.lineQueue.shift();
      if (line !== undefined) {
        this.handleBluetoothctlLine(line);
      }
      // Optionally yield to event loop for fairness
      await new Promise((r) => setImmediate(r));
    }
    this.processing = false;
  }

  private handleBluetoothctlLine(line: string) {
    // Clean up the line before processing
    line = stripAnsiCodes(line);
    if (!line) return;
 
    // 1. If a line starts with 'Device <MAC>', it's a device line
    const deviceLineMatch = line.match(/^Device ([0-9A-F:]{17})(.*)$/);
    if (deviceLineMatch) {
      // If we were collecting value lines, emit the event now
      if (this.valueParsing && this.valueParsing.valueLines.length > 0) {
        // Inline parsing of value lines: split by spaces, take valid hex tokens, concatenate
        let hexString = '';
        for (const valueLine of this.valueParsing.valueLines) {
          const tokens = valueLine.split(' ');
          for (const token of tokens) {
            if (/^[0-9a-fA-F]{2}$/.test(token)) {
              hexString += token;
            }
          }
        }
        if (hexString.length > 0) {
          const rawData = Buffer.from(hexString, 'hex');
          const address = this.valueParsing.address.toLowerCase();
          const dev = this.discovered.get(address) || { address };
          const packet: BLERawPacket = {
            ...dev,
            rssi: dev.rssi || 0,
            rawData,
          } as any;
          this.emit('raw', packet);
        }
        this.valueParsing = null;
      }
      // Parse device metadata (RSSI, name, etc.)
      const address = deviceLineMatch[1].toLowerCase();
      const rest = deviceLineMatch[2].trim();
      // RSSI (support both old and new formats)
      let rssi: number | undefined = undefined;
      // Old: RSSI: -78, New: RSSI: 0xffffffb2 (-78)
      const rssiMatch = rest.match(/RSSI: (?:0x[0-9a-fA-F]+ )?\(?(-?\d+)\)?|RSSI: (-?\d+)/);
      if (rssiMatch) {
        if (rssiMatch[1] !== undefined) {
          rssi = parseInt(rssiMatch[1], 10);
        } else if (rssiMatch[2] !== undefined) {
          rssi = parseInt(rssiMatch[2], 10);
        }
      }

      // Accept both ManufacturerData Value: and ManufacturerData.Value:
      const manufacturerDataValueRegex = /ManufacturerData[ .]Value:/;
      if (rest && manufacturerDataValueRegex.test(rest)){
        this.valueParsing = { address, valueLines: [] };
      }

      // Name (if present and not ManufacturerData or RSSI or AdvertisingFlags)
      let name: string | undefined = undefined;
      const manufacturerDataKeyRegex = /ManufacturerData[ .]Key:/;
      if (
        rest &&
        !manufacturerDataValueRegex.test(rest) &&
        !manufacturerDataKeyRegex.test(rest) &&
        !rest.startsWith('RSSI:') &&
        !rest.startsWith('AdvertisingFlags:')
      ) {
        name = rest;
      }

      // Update discovered map
      let dev = this.discovered.get(address) || { address };
      if (typeof rssi === 'number') dev.rssi = rssi;
      if (name) dev.name = name;
      this.discovered.set(address, dev);

      return;
    }

    // 2. If we are in valueParsing mode, collect value lines
    if (this.valueParsing) {
      // Only collect lines that are not empty and not a device line
      if (line && !/^Device [0-9A-F:]{17}/.test(line)) {
        this.valueParsing.valueLines.push(line);
      }
      // Do not emit yet; will emit when a new device line is encountered
      return;
    }
  }

  async stopScan(): Promise<void> {
    this.scanning = false;
    if (this.process) {
      if (this.process.stdin) {
        this.process.stdin.write('exit\n');
      }
      this.process.kill();
      this.process = null;
    }
  }

  getDiscoveredDevices(): BLEDevice[] {
    return Array.from(this.discovered.values());
  }
} 

// Extract up to 16 valid hex byte pairs from a line, skipping leading non-hex tokens and trailing ASCII
function extractHexBytes(line: string): string | null {
  // Remove ANSI codes
  const ansiStripped = line.replace(/\x1b\[[0-9;]*m/g, '').replace(/\x1b\[K/g, '');
  // Split by spaces
  const tokens = ansiStripped.trim().split(/\s+/);
  const hexPairs: string[] = [];
  for (const token of tokens) {
    if (/^[0-9a-fA-F]{2}$/.test(token)) {
      hexPairs.push(token);
      if (hexPairs.length === 16) break;
    } else if (hexPairs.length > 0) {
      // Stop at first non-hex token after collecting some
      break;
    }
    // else: skip non-hex tokens at the start
  }
  if (hexPairs.length > 0) {
    return hexPairs.join('');
  }
  return null;
} 

// Utility function to strip ANSI escape codes, control characters, and bluetooth prompt
function stripAnsiCodes(text: string): string {
  return text
    .replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '')  // ANSI codes
    .replace(/[\x00-\x1F\x7F]/g, '')        // All control characters
    .replace(/\[NEW\] /g, '')
    .replace(/\[CHG\] /g, '')
    .replace(/\[DEL\] /g, '')
    .replace(/\[bluetooth\]# \r/g, '')
    .replace(/\[bluetooth\]#/g, '')         // Bluetooth prompt
    .trim();
} 