import { createCipheriv, createDecipheriv } from 'crypto';
import { getProductName } from './product-mapping';
import 'reflect-metadata';

// Decorator to mark a property as an enum field
export function EnumField(enumType: object) {
  return function (target: any, propertyKey: string) {
    Reflect.defineMetadata('enumType', enumType, target, propertyKey);
  };
}

// Sourced from VE.Direct docs
export enum OperationMode {
  OFF = 0,
  LOW_POWER = 1,
  FAULT = 2,
  BULK = 3,
  ABSORPTION = 4,
  FLOAT = 5,
  STORAGE = 6,
  EQUALIZE_MANUAL = 7,
  INVERTING = 9,
  POWER_SUPPLY = 11,
  STARTING_UP = 245,
  REPEATED_ABSORPTION = 246,
  RECONDITION = 247,
  BATTERY_SAFE = 248,
  ACTIVE = 249,
  EXTERNAL_CONTROL = 252,
  NOT_AVAILABLE = 255,
}

// Source: VE.Direct-Protocol-3.32.pdf & https://www.victronenergy.com/live/mppt-error-codes
export enum ChargerError {
  // No error
  NO_ERROR = 0,
  // Err 1 - Battery temperature too high
  TEMPERATURE_BATTERY_HIGH = 1,
  // Err 2 - Battery voltage too high
  VOLTAGE_HIGH = 2,
  // Err 3 - Remote temperature sensor failure (auto-reset)
  REMOTE_TEMPERATURE_A = 3,
  // Err 4 - Remote temperature sensor failure (auto-reset)
  REMOTE_TEMPERATURE_B = 4,
  // Err 5 - Remote temperature sensor failure (not auto-reset)
  REMOTE_TEMPERATURE_C = 5,
  // Err 6 - Remote battery voltage sense failure
  REMOTE_BATTERY_A = 6,
  // Err 7 - Remote battery voltage sense failure
  REMOTE_BATTERY_B = 7,
  // Err 8 - Remote battery voltage sense failure
  REMOTE_BATTERY_C = 8,
  // Err 11 - Battery high ripple voltage
  HIGH_RIPPLE = 11,
  // Err 14 - Battery temperature too low
  TEMPERATURE_BATTERY_LOW = 14,
  // Err 17 - Charger temperature too high
  TEMPERATURE_CHARGER = 17,
  // Err 18 - Charger over current
  OVER_CURRENT = 18,
  // Err 20 - Bulk time limit exceeded
  BULK_TIME = 20,
  // Err 21 - Current sensor issue (sensor bias/sensor broken)
  CURRENT_SENSOR = 21,
  // Err 22 - Internal temperature sensor failure
  INTERNAL_TEMPERATURE_A = 22,
  // Err 23 - Internal temperature sensor failure
  INTERNAL_TEMPERATURE_B = 23,
  // Err 24 - Fan failure
  FAN = 24,
  // Err 26 - Terminals overheated
  OVERHEATED = 26,
  // Err 27 - Charger short circuit
  SHORT_CIRCUIT = 27,
  // Err 28 - Power stage issue Converter issue (dual converter models only)
  CONVERTER_ISSUE = 28,
  // Err 29 - Over-Charge protection
  OVER_CHARGE = 29,
  // Err 33 - Input voltage too high (solar panel) PV over-voltage
  INPUT_VOLTAGE = 33,
  // Err 34 - Input current too high (solar panel) PV over-current
  INPUT_CURRENT = 34,
  // Err 35 - PV over-power
  INPUT_POWER = 35,
  // Err 38 - Input shutdown (due to excessive battery voltage)
  INPUT_SHUTDOWN_VOLTAGE = 38,
  // Err 39 - Input shutdown (due to current flow during off mode)
  INPUT_SHUTDOWN_CURRENT = 39,
  // Err 40 - PV Input failed to shutdown
  INPUT_SHUTDOWN_FAILURE = 40,
  // Err 41 - Inverter shutdown (PV isolation)
  INVERTER_SHUTDOWN_41 = 41,
  // Err 42 - Inverter shutdown (PV isolation)
  INVERTER_SHUTDOWN_42 = 42,
  // Err 43 - Inverter shutdown (Ground Fault)
  INVERTER_SHUTDOWN_43 = 43,
  // Err 50 - Inverter overload
  INVERTER_OVERLOAD = 50,
  // Err 51 - Inverter temperature too high
  INVERTER_TEMPERATURE = 51,
  // Err 52 - Inverter peak current
  INVERTER_PEAK_CURRENT = 52,
  // Err 53 - Inverter output voltage
  INVERTER_OUPUT_VOLTAGE_A = 53,
  // Err 54 - Inverter output voltage
  INVERTER_OUPUT_VOLTAGE_B = 54,
  // Err 55 - Inverter self test failed
  INVERTER_SELF_TEST_A = 55,
  // Err 56 - Inverter self test failed
  INVERTER_SELF_TEST_B = 56,
  // Err 57 - Inverter ac voltage on output
  INVERTER_AC = 57,
  // Err 58 - Inverter self test failed
  INVERTER_SELF_TEST_C = 58,
  // Information 65 - Communication warning Lost communication with one of devices
  COMMUNICATION = 65,
  // Information 66 - Incompatible device Synchronised charging device configuration issue
  SYNCHRONISATION = 66,
  // Err 67 - BMS Connection lost
  BMS = 67,
  // Err 68 - Network misconfigured
  NETWORK_A = 68,
  // Err 69 - Network misconfigured
  NETWORK_B = 69,
  // Err 70 - Network misconfigured
  NETWORK_C = 70,
  // Err 71 - Network misconfigured
  NETWORK_D = 71,
  // Err 80 - PV Input shutdown
  PV_INPUT_SHUTDOWN_80 = 80,
  // Err 81 - PV Input shutdown
  PV_INPUT_SHUTDOWN_81 = 81,
  // Err 82 - PV Input shutdown
  PV_INPUT_SHUTDOWN_82 = 82,
  // Err 83 - PV Input shutdown
  PV_INPUT_SHUTDOWN_83 = 83,
  // Err 84 - PV Input shutdown
  PV_INPUT_SHUTDOWN_84 = 84,
  // Err 85 - PV Input shutdown
  PV_INPUT_SHUTDOWN_85 = 85,
  // Err 86 - PV Input shutdown
  PV_INPUT_SHUTDOWN_86 = 86,
  // Err 87 - PV Input shutdown
  PV_INPUT_SHUTDOWN_87 = 87,
  // Err 114 - CPU temperature too high
  CPU_TEMPERATURE = 114,
  // Err 116 - Factory calibration data lost
  CALIBRATION_LOST = 116,
  // Err 117 - Invalid/incompatible firmware
  FIRMWARE = 117,
  // Err 119 - Settings data lost
  SETTINGS = 119,
  // Err 121 - Tester fail
  TESTER_FAIL = 121,
  // Err 200 - Internal DC voltage error
  INTERNAL_DC_VOLTAGE_A = 200,
  // Err 201 - Internal DC voltage error
  INTERNAL_DC_VOLTAGE_B = 201,
  // Err 202 - PV residual current sensor self-test failure Internal GFCI sensor error
  SELF_TEST = 202,
  // Err 203 - Internal supply voltage error
  INTERNAL_SUPPLY_A = 203,
  // Err 205 - Internal supply voltage error
  INTERNAL_SUPPLY_B = 205,
  // Err 212 - Internal supply voltage error
  INTERNAL_SUPPLY_C = 212,
  // Err 215 - Internal supply voltage error
  INTERNAL_SUPPLY_D = 215,
}

export enum OffReason {
  NO_REASON = 0x00000000,
  NO_INPUT_POWER = 0x00000001,
  SWITCHED_OFF_SWITCH = 0x00000002,
  SWITCHED_OFF_REGISTER = 0x00000004,
  REMOTE_INPUT = 0x00000008,
  PROTECTION_ACTIVE = 0x00000010,
  PAY_AS_YOU_GO_OUT_OF_CREDIT = 0x00000020,
  BMS = 0x00000040,
  ENGINE_SHUTDOWN = 0x00000080,
  ANALYSING_INPUT_VOLTAGE = 0x00000100,
}

export enum AlarmReason {
  NO_ALARM = 0,
  LOW_VOLTAGE = 1,
  HIGH_VOLTAGE = 2,
  LOW_SOC = 4,
  LOW_STARTER_VOLTAGE = 8,
  HIGH_STARTER_VOLTAGE = 16,
  LOW_TEMPERATURE = 32,
  HIGH_TEMPERATURE = 64,
  MID_VOLTAGE = 128,
  OVERLOAD = 256,
  DC_RIPPLE = 512,
  LOW_V_AC_OUT = 1024,
  HIGH_V_AC_OUT = 2048,
  SHORT_CIRCUIT = 4096,
}

export enum AlarmNotification {
  NO_ALARM = 0,
  WARNING = 1,
  ALARM = 2,
}

export enum ACInState {
  AC_IN_1 = 0,
  AC_IN_2 = 1,
  NOT_CONNECTED = 2,
  UNKNOWN = 3,
}

export interface AdvertisementContainer {
  prefix: number;
  modelId: number;
  readoutType: number;
  iv: number;
  encryptedData: Buffer;
}
/*
export abstract class DeviceData {
  protected _data: Record<string, any>;
  protected _modelId: number;

  constructor(modelId: number, data: Record<string, any>) {
    this._modelId = modelId;
    this._data = data;
  }

  getModelName(): string {
    const productName = getProductName(this._modelId);
    return productName || `Model ${this._modelId.toString(16).toUpperCase()}`;
  }



}
*/
export abstract class Device {
  protected advertisementKey: string;

  constructor(advertisementKey: string) {
    this.advertisementKey = advertisementKey;
  }

  protected parseContainer(data: Buffer): AdvertisementContainer {
    const prefix = data.readUInt16LE(0);      // 2 bytes, little endian
    const modelId = data.readUInt16LE(2);     // 2 bytes, little endian
    const readoutType = data.readUInt8(4);    // 1 byte
    const iv = data.readUInt16LE(5);          // 2 bytes, little endian
    const encryptedData = data.slice(7);      // rest of data starting at offset 7

    return {
      prefix,
      modelId,
      readoutType,
      iv,
      encryptedData,
    };
  }

  protected getModelId(data: Buffer): number {
    return data.readUInt16LE(2);
  }

  protected decrypt(data: Buffer): Buffer {
    const container = this.parseContainer(data);
    
    // Convert hex key to buffer
    const key = Buffer.from(this.advertisementKey, 'hex');
    
    // Key check: first byte of encrypted data should match first byte of key
    if (container.encryptedData[0] !== key[0]) {
      throw new Error("Incorrect advertisement key");
    }
    
    // Skip the first byte (key check byte) and get the actual encrypted data
    const encryptedData = container.encryptedData.slice(1);
    
    // Create IV from the 32-bit value (little endian)
    const iv = Buffer.alloc(16);
    iv.writeUInt32LE(container.iv, 0);
    
    // Create decipher with CTR mode
    const decipher = createDecipheriv('aes-128-ctr', key, iv);
    decipher.setAutoPadding(false);
    
    // Decrypt the data (without the key check byte)
    const decrypted = Buffer.concat([
      decipher.update(encryptedData),
      decipher.final()
    ]);
    
    return decrypted;
  }

  parse(data: Buffer): this {
    this.modelId = this.getModelId(data);
    const decrypted = this.decrypt(data);
    this.parseDecrypted(decrypted);
    return this;
  }

  abstract parseDecrypted(decrypted: Buffer): void;

  protected modelId?: number;

  getModelName(): string {
    if (!this.modelId) return 'Unknown Model';
    const productName = getProductName(this.modelId);
    return productName || `Model ${this.modelId.toString(16).toUpperCase()}`;
  }

  toJson(): Record<string, any> {
    const data: Record<string, any> = {};
    for (const key of Object.keys(this)) {
      if (key === 'advertisementKey') continue;
      let value = (this as any)[key];
      if (value === undefined) continue;
      // Check for enum metadata
      const enumType = Reflect.getMetadata('enumType', this, key);
      if (enumType && typeof value === 'number') {
        for (const enumKey in enumType) {
          if ((enumType as any)[enumKey] === value) {
            data[key] = enumKey;
            break;
          }
        }
      } else if (Array.isArray(value)) {
        data[key] = value.map(v => typeof v === 'number' ? v : v);
      } else {
        data[key] = value;
      }
    }
    return data;
  }
}

export function kelvinToCelsius(tempInKelvin: number): number {
  return tempInKelvin - 273.15;
}

export class BitReader {
  private data: Buffer;
  private bitPosition: number = 0;

  constructor(data: Buffer) {
    this.data = data;
  }

  readBit(): number {
    const byteIndex = Math.floor(this.bitPosition / 8);
    const bitIndex = this.bitPosition % 8;
    const byte = this.data[byteIndex];
    if (byteIndex > this.data.length) {
      throw new Error(`length error ${byte}    ${byteIndex} / ${this.data.length}`)
    }
    const bit = (byte >> bitIndex) & 1;
    this.bitPosition++;
    return bit;
  }

  readUnsignedInt(numBits: number): number {
    let result = 0;
    for (let i = 0; i < numBits; i++) {
      result |= this.readBit() << i;
    }
    return result;
  }

  readSignedInt(numBits: number): number {
    const value = this.readUnsignedInt(numBits);
    return BitReader.toSignedInt(value, numBits);
  }

  static toSignedInt(value: number, numBits: number): number {
    const maxValue = (1 << numBits) - 1;
    const halfMax = 1 << (numBits - 1);
    
    if (value > halfMax) {
      return value - (maxValue + 1);
    }
    return value;
  }
} 
