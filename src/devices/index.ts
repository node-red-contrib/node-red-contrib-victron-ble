import { Device } from './base';
import { AcCharger, AcChargerData } from './ac-charger';
import { BatteryMonitor, BatteryMonitorData, AuxMode } from './battery-monitor';
import { BatterySense, BatterySenseData } from './battery-sense';
import { DcEnergyMeter, DcEnergyMeterData, MeterType } from './dc-energy-meter';
import { DcDcConverter, DcDcConverterData } from './dcdc-converter';
import { Inverter, InverterData } from './inverter';
import { LynxSmartBMS, LynxSmartBMSData } from './lynx-smart-bms';
import { OrionXS, OrionXSData } from './orion-xs';
import { SmartBatteryProtect, SmartBatteryProtectData, OutputState } from './smart-battery-protect';
import { SmartLithium, SmartLithiumData, BalancerStatus } from './smart-lithium';
import { SolarCharger, SolarChargerData } from './solar-charger';
import { VEBus, VEBusData } from './vebus';
import { getProductName } from './product-mapping';

// Export all device classes and data types
export {
  // Base classes
  Device,
  // Battery Monitor
  BatteryMonitor,
  BatteryMonitorData,
  AuxMode,
  // Battery Sense
  BatterySense,
  BatterySenseData,
  // AC Charger
  AcCharger,
  AcChargerData,
  // DC-DC Converter
  DcDcConverter,
  DcDcConverterData,
  // DC Energy Meter
  DcEnergyMeter,
  DcEnergyMeterData,
  MeterType,
  // Inverter
  Inverter,
  InverterData,
  // Orion XS
  OrionXS,
  OrionXSData,
  // Smart Battery Protect
  SmartBatteryProtect,
  SmartBatteryProtectData,
  OutputState,
  // Smart Lithium
  SmartLithium,
  SmartLithiumData,
  BalancerStatus,
  // Lynx Smart BMS
  LynxSmartBMS,
  LynxSmartBMSData,
  // Solar Charger
  SolarCharger,
  SolarChargerData,
  // VE.Bus
  VEBus,
  VEBusData,
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
    
    console.log(`Model ID: 0x${modelId.toString(16).toUpperCase()}, Mode: 0x${mode.toString(16).toUpperCase()}, Product: ${productName || 'Unknown'}`);
    
    // Model ID-based preferences
    const match = MODEL_PARSER_OVERRIDE[modelId];
    if (match) {
      console.log(`Using override for model ID 0x${modelId.toString(16).toUpperCase()}`);
      return match;
    }

    // Defaults based on mode
    switch (mode) {
      case 0x2:  // BatteryMonitor
        console.log('Detected as BatteryMonitor');
        return BatteryMonitor;
      case 0xD:  // DcEnergyMeter
        console.log('Detected as DcEnergyMeter');
        return DcEnergyMeter;
      case 0x8:  // AcCharger
        console.log('Detected as AcCharger');
        return AcCharger;
      case 0x4:  // DcDcConverter
        console.log('Detected as DcDcConverter');
        return DcDcConverter;
      case 0x3:  // Inverter
        console.log('Detected as Inverter');
        return Inverter;
      case 0x6:  // InverterRS
        console.log('InverterRS not implemented yet');
        break;
      case 0xA:  // LynxSmartBMS
        console.log('Detected as LynxSmartBMS');
        return LynxSmartBMS;
      case 0xB:  // MultiRS
        console.log('MultiRS not implemented yet');
        break;
      case 0x5:  // SmartLithium (commercially Lithium Battery Smart / LiFePO4 Battery Smart)
        console.log('Detected as SmartLithium');
        return SmartLithium;
      case 0x9:  // SmartBatteryProtect
        console.log('Detected as SmartBatteryProtect');
        return SmartBatteryProtect;
      case 0x1:  // SolarCharger
        console.log('Detected as SolarCharger');
        return SolarCharger;
      case 0xC:  // VE.Bus
        console.log('Detected as VE.Bus');
        return VEBus;
      case 0xF:  // Orion XS
        console.log('Detected as Orion XS');
        return OrionXS;
    }

    console.log(`Unknown device type - Model ID: 0x${modelId.toString(16).toUpperCase()}, Mode: 0x${mode.toString(16).toUpperCase()}`);
    return null;
  } catch (error) {
    console.error('Error detecting device type:', error);
    return null;
  }
} 