// Main exports
export { Scanner } from './scanner';
export { Device, DeviceData } from './devices/base';
export { BatteryMonitor, BatteryMonitorData, AuxMode } from './devices/battery-monitor';
export { SolarCharger, SolarChargerData } from './devices/solar-charger';
export { AcCharger, AcChargerData } from './devices/ac-charger';
export { DcDcConverter, DcDcConverterData } from './devices/dcdc-converter';
export { DcEnergyMeter, DcEnergyMeterData } from './devices/dc-energy-meter';
export { Inverter, InverterData } from './devices/inverter';
export { VEBus, VEBusData } from './devices/vebus';
export { SmartLithium, SmartLithiumData } from './devices/smart-lithium';
export { SmartBatteryProtect, SmartBatteryProtectData } from './devices/smart-battery-protect';
export { BatterySense, BatterySenseData } from './devices/battery-sense';
export { LynxSmartBMS, LynxSmartBMSData } from './devices/lynx-smart-bms';
export { OrionXS, OrionXSData } from './devices/orion-xs';

// Enums and types
export { OperationMode, ChargerError, OffReason, AlarmReason, AlarmNotification, ACInState } from './devices/base';

// Utility functions
export { detectDeviceType } from './devices';
export { getProductName, getProductMappings, type ProductMapping } from './devices/product-mapping'; 