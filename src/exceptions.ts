export class UnknownDeviceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnknownDeviceError';
  }
}

export class AdvertisementKeyMissingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AdvertisementKeyMissingError';
  }
}

export class AdvertisementKeyMismatchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AdvertisementKeyMismatchError';
  }
} 