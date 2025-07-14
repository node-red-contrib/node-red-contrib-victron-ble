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

## License

MIT

---

## Credits

- Inspired by [keshavdv/victron-ble](https://github.com/keshavdv/victron-ble)
- Not affiliated with or supported by Victron Energy 