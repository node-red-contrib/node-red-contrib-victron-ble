import { BitReader, AlarmReason } from '../src/devices/base';

describe('BitReader', () => {
  describe('toSignedInt static method', () => {
    test('converts unsigned to signed integers correctly', () => {
      // 12-bit tests
      expect(BitReader.toSignedInt(0x000, 12)).toBe(0x000);
      expect(BitReader.toSignedInt(0x001, 12)).toBe(0x001);
      expect(BitReader.toSignedInt(0x242, 12)).toBe(0x242);
      expect(BitReader.toSignedInt(0x7FF, 12)).toBe(0x7FF);
      expect(BitReader.toSignedInt(0x800, 12)).toBe(-0x800);
      expect(BitReader.toSignedInt(0xCAD, 12)).toBe(-0x353);
      expect(BitReader.toSignedInt(0xFFF, 12)).toBe(-0x001);
      
      // 5-bit tests
      expect(BitReader.toSignedInt(0x00, 5)).toBe(0x00);
      expect(BitReader.toSignedInt(0x01, 5)).toBe(0x01);
      expect(BitReader.toSignedInt(0x0F, 5)).toBe(0x0F);
      expect(BitReader.toSignedInt(0x10, 5)).toBe(-0x10);
      expect(BitReader.toSignedInt(0x1F, 5)).toBe(-0x01);
    });
  });

  describe('bit and integer reading', () => {
    test('reads bits and integers from hex data', () => {
      const data = Buffer.from("1a2b3c4d5e6f7890", 'hex');
      const reader = new BitReader(data);
      
      expect(reader.readBit()).toBe(0);
      expect(reader.readBit()).toBe(1);
      expect(reader.readBit()).toBe(0);
      expect(reader.readBit()).toBe(1);
      expect(reader.readUnsignedInt(6)).toBe(49);
      expect(reader.readSignedInt(6)).toBe(10);
      expect(reader.readSignedInt(4)).toBe(-4);
      expect(reader.readUnsignedInt(11)).toBe(1235);
      expect(reader.readBit()).toBe(0);
      expect(reader.readUnsignedInt(32)).toBe(-1871155362);
    });

    test('reads bits correctly with simple data', () => {
      const data = Buffer.from([0b10101010, 0b11001100]);
      const reader = new BitReader(data);
      
      expect(reader.readBit()).toBe(0); // LSB first
      expect(reader.readBit()).toBe(1);
      expect(reader.readUnsignedInt(2)).toBe(2); // 10
      expect(reader.readUnsignedInt(4)).toBe(10); // 1010
    });

    test('handles byte boundaries', () => {
      const data = Buffer.from([0xFF, 0x00]);
      const reader = new BitReader(data);
      
      expect(reader.readUnsignedInt(8)).toBe(255);
      expect(reader.readUnsignedInt(8)).toBe(0);
    });
  });
});

describe('Enums', () => {
  test('AlarmReason enum values', () => {
    expect(AlarmReason.NO_ALARM).toBe(0);
    expect(AlarmReason.LOW_VOLTAGE).toBe(1);
    expect(AlarmReason.HIGH_VOLTAGE).toBe(2);
  });
});
