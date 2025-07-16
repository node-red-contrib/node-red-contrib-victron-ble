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
  private nameCache: Map<string, string | undefined> = new Map();
  private buffer = '';
  private pendingValue: PendingValueBlock | null = null;

  async startScan(): Promise<void> {
    this.scanning = true;
    this.process = spawn('bluetoothctl', []);
    if (this.process.stdout) {
      this.process.stdout.setEncoding('utf8');
      this.process.stdout.on('data', (data: string) => {
        this.handleBluetoothctlOutput(data);
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
    // Send 'devices' command at the start to populate name cache
    setTimeout(() => {
      if (this.process && this.process.stdin) {
        this.process.stdin.write('devices\n');
      }
    }, 800);
    // Do send 'scan on' (even if it fails, it does not hurt0))
    setTimeout(() => {
      if (this.process && this.process.stdin) {
        this.process.stdin.write('scan on\n');
      }
    }, 300);
  
  }

  private handleBluetoothctlOutput(data: string) {
    this.buffer += data;
    let lines = this.buffer.split(/\r?\n/);
    this.buffer = lines.pop() || '';
    for (const line of lines) {
      // If collecting ManufacturerData Value lines
      if (this.pendingValue) {
        // Try to extract hex bytes from the line
        const hexString = extractHexBytes(line);
        if (hexString) {
          this.pendingValue.valueLines.push(hexString);
          continue;
        } else {
          // Value Line finished
          // End of value block, emit if we have data
          const pending = this.pendingValue;
          if (pending && typeof pending.address === 'string' && pending.valueLines.length > 0) {
            // temporary fix before adding ManufacturerData Key
            let hexString = pending.valueLines.join('').replace(/ /g, '');
            if (hexString.length > 0) {
              const rawData = Buffer.from(hexString, 'hex');
              const address = pending.address;
              const dev = this.discovered.get(address) || { address };
              const packet: BLERawPacket = {
                ...dev,
                rssi: dev.rssi || 0,
                rawData,
              } as any;
              this.emit('raw', packet);
            }
          }
          this.pendingValue = null;
          // Continue to process this line as normal
        }
      }
      // Device name from 'devices' command
      const devMatch = line.match(/^Device ([0-9A-F:]{17}) (.+)$/);
      if (devMatch) {
        const address = devMatch[1];
        const name = devMatch[2];
        this.nameCache.set(address, name);
        if (this.discovered.has(address)) {
          const dev = this.discovered.get(address);
          if (dev && !dev.name) {
            this.discovered.set(address, { ...dev, name });
          }
        }
        continue;
      }
      // RSSI
      const rssiMatch = line.match(/Device ([0-9A-F:]{17}) RSSI: (-?\d+)/);
      if (rssiMatch) {
        const address = rssiMatch[1];
        const rssi = parseInt(rssiMatch[2], 10);
        // Update discovered map with latest RSSI
        let dev = this.discovered.get(address);
        if (!dev) {
          dev = { address, rssi };
        } else {
          dev = { ...dev, rssi };
        }
        this.discovered.set(address, dev);
        continue;
      }
      // Ignore ManufacturerData Key lines
      if (/Device [0-9A-F:]{17} ManufacturerData Key: (0x[0-9a-fA-F]+)/.test(line)) {
        continue;
      }
      // ManufacturerData Value (start collecting lines)
      const valueStart = line.match(/Device ([0-9A-F:]{17}) ManufacturerData Value:/);
      if (valueStart) {
        const address = valueStart[1];
        this.pendingValue = { address, valueLines: [] };
        continue;
      }
      // Fallback: update discovered devices for name
      const genericMatch = line.match(/Device ([0-9A-F:]{17})(?: (.+))?/);
      if (genericMatch) {
        const address = genericMatch[1];
        let name = this.nameCache.get(address);
        if (!name && genericMatch[2] && !genericMatch[2].startsWith('ManufacturerData')) {
          name = genericMatch[2];
          this.nameCache.set(address, name);
        }
        if (!this.discovered.has(address)) {
          const deviceInfo: BLEDevice = { address, name };
          this.discovered.set(address, deviceInfo);
        }
      }
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