# Victron BLE for Node.js & Node-RED

A modern TypeScript/Node.js library to parse Victron Instant Readout BLE advertisements, inspired by the excellent [keshavdv/victron-ble](https://github.com/keshavdv/victron-ble) Python library.

## What does this library do?

- **Parses Victron Energy BLE advertisements** (Instant Readout) from Victron devices (SmartShunt, Smart Battery Sense, Solar Charger, etc.)
- **Decrypts and decodes** the data using your device's unique encryption key
- **Works out-of-the-box** as a Node.js library, a CLI tool, and a Node-RED node
- **No Python or extra dependencies required**—runs natively on Node.js, including on Victron GX, Ekrano, and similar devices

---

## Usage

### 1. CLI Tool

After installing dependencies and building the project, you can use the CLI to scan and read Victron BLE devices:

```sh
# Discover Victron BLE devices
npx victron-ble discover

# Read data from a device (replace ADDRESS and KEY)
npx victron-ble read <DEVICE_ADDRESS> <ENCRYPTION_KEY>
```

### 2. Node-RED Node

- **Install via the Node-RED Palette Manager** (search for `victron-ble`)
- Drag the Victron BLE node into your flow
- Enter your device's BLE address and encryption key (see below)
- The node will emit parsed data as messages

---

## Getting Your Victron Device's Encryption Key

To decrypt BLE advertisements, you need the device's unique encryption key. You can find this in the official VictronConnect app:

1. Pair with your device in the VictronConnect app
2. Go to the device's **Product Info** section
3. Find the **Instant Readout via Bluetooth** area
4. Click **Show** next to Instant Readout Details to reveal the encryption key
5. Copy the MAC address and the key

> **Note:** The key is required for both the CLI and Node-RED node to decode data.

---

## Why this library?

This project is inspired by [keshavdv/victron-ble](https://github.com/keshavdv/victron-ble), but is written in TypeScript/Node.js for:
- **Native Node-RED integration** (no Python or extra installation)
- **Easy deployment** on Victron GX, Ekrano, and similar embedded systems
- **Modern, type-safe codebase**

---

## BLE Backend Selection

This library supports two different BLE backends:

1. **bluetoothctl terminal output parsing** (default):
   - The library will first attempt to use a custom adapter that parses the terminal output of the `bluetoothctl` command.
   - This approach is necessary to support Victron GX, Ekrano, and similar devices, as well as most Linux systems where noble may not function, because it need to run as root.
   - The adapter runs `bluetoothctl` as a subprocess, parses its output in real time, and emits BLE advertisement events.
   - **Note:** This method does not work on macOS or Windows, as `bluetoothctl` is not available there.

2. **noble** (fallback):
   - If `bluetoothctl` is not available or fails to start, the library falls back to the [noble](https://github.com/noble/noble) BLE library.
   - This is the standard for Node.js BLE access and works on macOS, Windows, and some Linux systems.
   - **Important limitation:** noble requires root access to access BLE hardware. On Victron GX, Ekrano, and similar devices, Node-RED runs under a non-root user, so noble cannot be used in these environments. This is a key reason for using the bluetoothctl-based approach on these platforms.

> **Note:** We previously attempted to use the `node-ble` library, but found its performance and CPU usage unacceptable for production use, especially on embedded hardware.

The backend is selected automatically at runtime. If `bluetoothctl` is not available, the library will attempt to use noble instead.

---

## License

MIT

---

## Credits

- Inspired by [keshavdv/victron-ble](https://github.com/keshavdv/victron-ble)
- Not affiliated with or supported by Victron Energy 