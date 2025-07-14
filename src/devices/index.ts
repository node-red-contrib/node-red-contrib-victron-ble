import { Device } from './base';
import { AcCharger } from './ac-charger';
import { BatteryMonitor, AuxMode } from './battery-monitor';
import { BatterySense } from './battery-sense';
import { DcEnergyMeter, MeterType } from './dc-energy-meter';
import { DcDcConverter } from './dcdc-converter';
import { Inverter } from './inverter';
import { LynxSmartBMS } from './lynx-smart-bms';
import { OrionXS } from './orion-xs';
import { SmartBatteryProtect, OutputState } from './smart-battery-protect';
import { SmartLithium, BalancerStatus } from './smart-lithium';
import { SolarCharger } from './solar-charger';
import { VEBus } from './vebus';
import { getProductName } from './product-mapping';

// Export all device classes and data types
export {
  // Base classes
  Device,
  // Battery Monitor
  BatteryMonitor,
  AuxMode,
  // Battery Sense
  BatterySense,
  // AC Charger
  AcCharger,
  // DC-DC Converter
  DcDcConverter,
  // DC Energy Meter
  DcEnergyMeter,
  MeterType,
  // Inverter
  Inverter,
  // Orion XS
  OrionXS,
  // Smart Battery Protect
  SmartBatteryProtect,
  OutputState,
  // Smart Lithium
  SmartLithium,
  BalancerStatus,
  // Lynx Smart BMS
  LynxSmartBMS,
  // Solar Charger
  SolarCharger,
  // VE.Bus
  VEBus,
};

// Add to this list if a device should be forced to use a particular implementation
// instead of relying on the identifier in the advertisement
const MODEL_PARSER_OVERRIDE: Record<number, new (advertisementKey: string) => Device> = {
  0xA3A4: BatterySense,  // Smart Battery Sense
  0xA3A5: BatterySense,  // Smart Battery Sense
};

export function detectDeviceType(data: Buffer): (new (advertisementKey: string) => Device) | null {
  try {
    const modelId = data.readUInt16LE(2);
    const mode = data.readUInt8(4);
    const productName = getProductName(modelId);
    
    // Model ID-based preferences
    const match = MODEL_PARSER_OVERRIDE[modelId];
    if (match) {
      // console.log(`Using override for model ID 0x${modelId.toString(16).toUpperCase()}`);
      return match;
    }

    // Defaults based on mode
    switch (mode) {
      case 0x2:  // BatteryMonitor
        return BatteryMonitor;
      case 0xD:  // DcEnergyMeter
        return DcEnergyMeter;
      case 0x8:  // AcCharger
        return AcCharger;
      case 0x4:  // DcDcConverter
        return DcDcConverter;
      case 0x3:  // Inverter
        return Inverter;
      case 0x6:  // InverterRS
        break;
      case 0xA:  // LynxSmartBMS
        return LynxSmartBMS;
      case 0xB:  // MultiRS
        break;
      case 0x5:  // SmartLithium (commercially Lithium Battery Smart / LiFePO4 Battery Smart)
        return SmartLithium;
      case 0x9:  // SmartBatteryProtect
        return SmartBatteryProtect;
      case 0x1:  // SolarCharger
        return SolarCharger;
      case 0xC:  // VE.Bus
        return VEBus;
      case 0xF:  // Orion XS
        return OrionXS;
    }

    console.log(`Unknown device type - Model ID: 0x${modelId.toString(16).toUpperCase()}, Mode: 0x${mode.toString(16).toUpperCase()}`);
    return null;
  } catch (error) {
    console.error('Error detecting device type:', error);
    return null;
  }
} 