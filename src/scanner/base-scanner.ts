import { Peripheral, Advertisement } from '@abandonware/noble';

export abstract class BaseScanner {
  protected noble: any;

  constructor() {
    // Initialize noble
    this.noble = require('@abandonware/noble');
  }

  protected detectionCallback(peripheral: Peripheral): void {
    const advertisement: Advertisement = peripheral.advertisement;
    if (!advertisement || !advertisement.manufacturerData) {
      return;
    }
    const manufacturerData = advertisement.manufacturerData;
    const deviceAddress = peripheral.address || peripheral.id || 'Unknown';
    // Check if data starts with Victron's manufacturer ID (0x02E1) and instant readout (0x10)
    if (
      manufacturerData.length < 3 ||
      manufacturerData[0] !== 0xe1 ||
      manufacturerData[1] !== 0x02 ||
      manufacturerData[2] !== 0x10
    ) {
      return;
    }

    const dataPayload = manufacturerData.subarray(2);
    this.callback(peripheral, dataPayload);
  }

  abstract callback(peripheral: Peripheral, data: Buffer): void;

  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      process.on('uncaughtException', (error) => {
        console.error('Uncaught Exception:', error);
      });
      process.on('unhandledRejection', (reason, promise) => {
        console.error('Unhandled Rejection at:', promise, 'reason:', reason);
      });
      this.noble.on('stateChange', (state: string) => {
        try {
          if (state === 'poweredOn') {
            this.noble.startScanning([], true, (error: any) => {
              try {
                if (error) {
                  console.log('Error scanning:', error);
                  reject(error);
                } else {
                  this.noble.on('discover', (peripheral: Peripheral) => {
                    try {
                      this.detectionCallback(peripheral);
                    } catch (callbackError) {
                      console.error('Error in detection callback:', callbackError);
                    }
                  });
                  resolve();
                }
              } catch (scanError) {
                console.error('Error in scan callback:', scanError);
                reject(scanError);
              }
            });
          }
        } catch (stateError) {
          console.error('Error in state change:', stateError);
          reject(stateError);
        }
      });
      this.noble.on('error', (error: any) => {
        try {
          console.error('Noble error:', error);
          reject(error);
        } catch (errorHandlerError) {
          console.error('Error in noble error handler:', errorHandlerError);
          reject(errorHandlerError);
        }
      });
    });
  }

  async stop(): Promise<void> {
    return new Promise((resolve) => {
      this.noble.stopScanning((error: any) => {
        try {
          if (error) {
            console.error('Error stopping scan:', error);
          }
          resolve();
        } catch (stopError) {
          console.error('Error in stop callback:', stopError);
          resolve();
        }
      });
    });
  }
} 