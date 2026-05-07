const { describe, test } = require('node:test');
const assert = require('node:assert/strict');
const { BitReader, AlarmReason } = require('../dist/devices/base');

describe('BitReader', () => {
  describe('toSignedInt static method', () => {
    test('converts unsigned to signed integers correctly', () => {
      assert.equal(BitReader.toSignedInt(0x000, 12), 0x000);
      assert.equal(BitReader.toSignedInt(0x001, 12), 0x001);
      assert.equal(BitReader.toSignedInt(0x242, 12), 0x242);
      assert.equal(BitReader.toSignedInt(0x7ff, 12), 0x7ff);
      assert.equal(BitReader.toSignedInt(0x800, 12), -0x800);
      assert.equal(BitReader.toSignedInt(0xcad, 12), -0x353);
      assert.equal(BitReader.toSignedInt(0xfff, 12), -0x001);

      assert.equal(BitReader.toSignedInt(0x00, 5), 0x00);
      assert.equal(BitReader.toSignedInt(0x01, 5), 0x01);
      assert.equal(BitReader.toSignedInt(0x0f, 5), 0x0f);
      assert.equal(BitReader.toSignedInt(0x10, 5), -0x10);
      assert.equal(BitReader.toSignedInt(0x1f, 5), -0x01);
    });
  });

  describe('bit and integer reading', () => {
    test('reads bits and integers from hex data', () => {
      const data = Buffer.from('1a2b3c4d5e6f7890', 'hex');
      const reader = new BitReader(data);

      assert.equal(reader.readBit(), 0);
      assert.equal(reader.readBit(), 1);
      assert.equal(reader.readBit(), 0);
      assert.equal(reader.readBit(), 1);
      assert.equal(reader.readUnsignedInt(6), 49);
      assert.equal(reader.readSignedInt(6), 10);
      assert.equal(reader.readSignedInt(4), -4);
      assert.equal(reader.readUnsignedInt(11), 1235);
      assert.equal(reader.readBit(), 0);
      assert.equal(reader.readUnsignedInt(32), -1871155362);
    });

    test('reads bits correctly with simple data', () => {
      const data = Buffer.from([0b10101010, 0b11001100]);
      const reader = new BitReader(data);

      assert.equal(reader.readBit(), 0);
      assert.equal(reader.readBit(), 1);
      assert.equal(reader.readUnsignedInt(2), 2);
      assert.equal(reader.readUnsignedInt(4), 10);
    });

    test('handles byte boundaries', () => {
      const data = Buffer.from([0xff, 0x00]);
      const reader = new BitReader(data);

      assert.equal(reader.readUnsignedInt(8), 255);
      assert.equal(reader.readUnsignedInt(8), 0);
    });
  });
});

describe('Enums', () => {
  test('AlarmReason enum values', () => {
    assert.equal(AlarmReason.NO_ALARM, 0);
    assert.equal(AlarmReason.LOW_VOLTAGE, 1);
    assert.equal(AlarmReason.HIGH_VOLTAGE, 2);
  });
});
