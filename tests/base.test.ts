import { BitReader, AlarmReason } from '../src/devices/base';

describe('Base Device', () => {
  test('BitReader reads bits correctly', () => {
    const data = Buffer.from([0b10101010, 0b11001100]);
    const reader = new BitReader(data);
    
    expect(reader.readBit()).toBe(0); // LSB first
    expect(reader.readBit()).toBe(1);
    expect(reader.readUnsignedInt(2)).toBe(2); // 10
    expect(reader.readUnsignedInt(4)).toBe(10); // 1010
  });

  test('BitReader handles byte boundaries', () => {
    const data = Buffer.from([0xFF, 0x00]);
    const reader = new BitReader(data);
    
    expect(reader.readUnsignedInt(8)).toBe(255);
    expect(reader.readUnsignedInt(8)).toBe(0);
  });

  test('AlarmReason enum values', () => {
    expect(AlarmReason.NO_ALARM).toBe(0);
    expect(AlarmReason.LOW_VOLTAGE).toBe(1);
    expect(AlarmReason.HIGH_VOLTAGE).toBe(2);
  });
});
