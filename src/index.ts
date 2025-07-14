// Main exports
export { Scanner } from './scanner';
export { Device } from './devices/base';
export { BatteryMonitor, AuxMode } from './devices/battery-monitor';
export { SolarCharger } from './devices/solar-charger';
export { AcCharger } from './devices/ac-charger';
export { DcDcConverter } from './devices/dcdc-converter';
export { DcEnergyMeter, MeterType } from './devices/dc-energy-meter';
export { Inverter } from './devices/inverter';
export { VEBus } from './devices/vebus';
export { SmartLithium } from './devices/smart-lithium';
export { SmartBatteryProtect, OutputState } from './devices/smart-battery-protect';
export { BatterySense } from './devices/battery-sense';
export { LynxSmartBMS } from './devices/lynx-smart-bms';
export { OrionXS } from './devices/orion-xs';

// Enums and types
export { OperationMode, ChargerError, OffReason, AlarmReason, AlarmNotification, ACInState } from './devices/base';

// Utility functions
export { detectDeviceType } from './devices';
export { getProductName, getProductMappings, type ProductMapping } from './devices/product-mapping'; 