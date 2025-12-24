import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { HIDReader } from '../../src/utils/hid-reader';
import { MappingType } from '../../src/models';

describe('HIDReader', () => {
  let mockDevice: any;
  let mockCallback: any;

  beforeEach(() => {
    mockDevice = {
      opened: false,
      open: vi.fn().mockResolvedValue(undefined),
      close: vi.fn().mockResolvedValue(undefined),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };

    mockCallback = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should create an instance with valid config', () => {
      const config = {
        mappings: {},
        reportId: 1,
      };
      const reader = new HIDReader(mockDevice, config, mockCallback);
      expect(reader).toBeDefined();
      expect(reader).toBeInstanceOf(HIDReader);
    });

    it('should create an instance without reportId', () => {
      const config = {
        mappings: {},
      };
      const reader = new HIDReader(mockDevice, config, mockCallback);
      expect(reader).toBeDefined();
    });

    it('should accept warning callback', () => {
      const config = { mappings: {} };
      const warningCallback = vi.fn();
      const reader = new HIDReader(mockDevice, config, mockCallback, warningCallback);
      expect(reader).toBeDefined();
    });
  });

  describe('Data Processing - Range Mapping', () => {
    it('should process single range mapping correctly', () => {
      const config = {
        mappings: {
          x: {
            type: 'range',
            byteIndex: 1,
            min: 0,
            max: 255,
          },
        },
        reportId: 1,
      };

      const reader = new HIDReader(mockDevice, config, mockCallback);
      const data = new Uint8Array([1, 128, 0, 0]); // x value 128

      const result = reader.processDeviceData(data);
      expect(result).toHaveProperty('x');
      expect(typeof result.x).toBe('number');
      // 128 / 255 ≈ 0.502
      expect(result.x).toBeCloseTo(0.502, 2);
    });

    it('should process multiple range mappings', () => {
      const config = {
        mappings: {
          x: {
            type: 'range',
            byteIndex: 1,
            min: 0,
            max: 255,
          },
          y: {
            type: 'range',
            byteIndex: 2,
            min: 0,
            max: 255,
          },
          pressure: {
            type: 'range',
            byteIndex: 3,
            min: 0,
            max: 255,
          },
        },
        reportId: 1,
      };

      const reader = new HIDReader(mockDevice, config, mockCallback);
      const data = new Uint8Array([1, 100, 150, 200]);

      const result = reader.processDeviceData(data);
      expect(result).toHaveProperty('x');
      expect(result).toHaveProperty('y');
      expect(result).toHaveProperty('pressure');
      expect(result.x).toBeCloseTo(0.392, 2);
      expect(result.y).toBeCloseTo(0.588, 2);
      expect(result.pressure).toBeCloseTo(0.784, 2);
    });

    it('should handle min/max edge cases', () => {
      const config = {
        mappings: {
          value: {
            type: 'range',
            byteIndex: 1,
            min: 0,
            max: 255,
          },
        },
        reportId: 1,
      };

      const reader = new HIDReader(mockDevice, config, mockCallback);

      // Test minimum value
      let data = new Uint8Array([1, 0]);
      let result = reader.processDeviceData(data);
      expect(result.value).toBe(0);

      // Test maximum value
      data = new Uint8Array([1, 255]);
      result = reader.processDeviceData(data);
      expect(result.value).toBe(1);
    });
  });

  describe('Data Processing - Multi-Byte Range', () => {
    it('should process multi-byte range data', () => {
      const config = {
        mappings: {
          x: {
            type: MappingType.MULTI_BYTE_RANGE,
            byteIndex: [1, 2],
            min: 0,
            max: 65535, // 2^16 - 1
          },
        },
        reportId: 1,
      };

      const reader = new HIDReader(mockDevice, config, mockCallback);
      // Little-endian: 0x00FF = 255
      const data = new Uint8Array([1, 255, 0]);

      const result = reader.processDeviceData(data);
      expect(result).toHaveProperty('x');
      expect(result.x).toBeCloseTo(0.00389, 3); // 255 / 65535
    });

    it('should handle 3-byte range data', () => {
      const config = {
        mappings: {
          value: {
            type: MappingType.MULTI_BYTE_RANGE,
            byteIndex: [1, 2, 3],
            min: 0,
            max: 16777215, // 2^24 - 1
          },
        },
        reportId: 1,
      };

      const reader = new HIDReader(mockDevice, config, mockCallback);
      const data = new Uint8Array([1, 255, 255, 0]);

      const result = reader.processDeviceData(data);
      expect(result).toHaveProperty('value');
      expect(typeof result.value).toBe('number');
    });
  });

  describe('Data Processing - Bipolar Range', () => {
    it('should process positive tilt values', () => {
      const config = {
        mappings: {
          tiltX: {
            type: MappingType.BIPOLAR_RANGE,
            byteIndex: 1,
            positiveMin: 128,
            positiveMax: 255,
            negativeMin: 0,
            negativeMax: 127,
          },
        },
        reportId: 1,
      };

      const reader = new HIDReader(mockDevice, config, mockCallback);
      const data = new Uint8Array([1, 200]);

      const result = reader.processDeviceData(data);
      expect(result).toHaveProperty('tiltX');
      // (200 - 128) / (255 - 128) = 72 / 127 ≈ 0.567
      expect(result.tiltX).toBeGreaterThan(0);
      expect(result.tiltX).toBeLessThanOrEqual(1);
    });

    it('should process negative tilt values', () => {
      const config = {
        mappings: {
          tiltX: {
            type: MappingType.BIPOLAR_RANGE,
            byteIndex: 1,
            positiveMin: 128,
            positiveMax: 255,
            negativeMin: 0,
            negativeMax: 127,
          },
        },
        reportId: 1,
      };

      const reader = new HIDReader(mockDevice, config, mockCallback);
      const data = new Uint8Array([1, 50]);

      const result = reader.processDeviceData(data);
      expect(result).toHaveProperty('tiltX');
      expect(result.tiltX).toBeLessThan(0);
      expect(result.tiltX).toBeGreaterThanOrEqual(-1);
    });
  });

  describe('Data Processing - Bit Flags', () => {
    it('should process button bit flags', () => {
      const config = {
        mappings: {
          status: {
            type: MappingType.CODE,
            byteIndex: 1,
            values: {
              '2': { state: 'buttons' },
            },
          },
          tabletButtons: {
            type: MappingType.BIT_FLAGS,
            byteIndex: 2,
            buttonCount: 8,
          },
        },
        reportId: 2,
      };

      const reader = new HIDReader(mockDevice, config, mockCallback);
      // Report ID 2, status byte 2 (buttons mode), button bits 0b00000101 (buttons 1 and 3 pressed)
      const data = new Uint8Array([2, 2, 5]);

      const result = reader.processDeviceData(data);
      expect(result.button1).toBe(true);
      expect(result.button2).toBe(false);
      expect(result.button3).toBe(true);
      expect(result.button4).toBe(false);
    });

    it('should process all buttons pressed', () => {
      const config = {
        mappings: {
          status: {
            type: MappingType.CODE,
            byteIndex: 1,
            values: {
              '2': { state: 'buttons' },
            },
          },
          tabletButtons: {
            type: MappingType.BIT_FLAGS,
            byteIndex: 2,
            buttonCount: 8,
          },
        },
        reportId: 2,
      };

      const reader = new HIDReader(mockDevice, config, mockCallback);
      const data = new Uint8Array([2, 2, 255]); // All bits set

      const result = reader.processDeviceData(data);
      for (let i = 1; i <= 8; i++) {
        expect(result[`button${i}`]).toBe(true);
      }
    });

    it('should process no buttons pressed', () => {
      const config = {
        mappings: {
          status: {
            type: MappingType.CODE,
            byteIndex: 1,
            values: {
              '2': { state: 'buttons' },
            },
          },
          tabletButtons: {
            type: MappingType.BIT_FLAGS,
            byteIndex: 2,
            buttonCount: 8,
          },
        },
        reportId: 2,
      };

      const reader = new HIDReader(mockDevice, config, mockCallback);
      const data = new Uint8Array([2, 2, 0]); // No bits set

      const result = reader.processDeviceData(data);
      for (let i = 1; i <= 8; i++) {
        expect(result[`button${i}`]).toBe(false);
      }
    });
  });

  describe('Data Processing - Code Mapping', () => {
    it('should parse status codes', () => {
      const config = {
        mappings: {
          status: {
            type: MappingType.CODE,
            byteIndex: 1,
            values: {
              '160': { state: 'stylus' },
              '2': { state: 'buttons' },
            },
          },
        },
        reportId: 1,
      };

      const reader = new HIDReader(mockDevice, config, mockCallback);
      const data = new Uint8Array([1, 160]);

      const result = reader.processDeviceData(data);
      expect(result).toHaveProperty('state');
      expect(result.state).toBe('stylus');
    });

    it('should handle unknown codes', () => {
      const config = {
        mappings: {
          status: {
            type: MappingType.CODE,
            byteIndex: 1,
            values: {
              '10': { state: 'known' },
            },
          },
        },
        reportId: 1,
      };

      const reader = new HIDReader(mockDevice, config, mockCallback);
      const data = new Uint8Array([1, 99]); // Unknown code

      const result = reader.processDeviceData(data);
      // Should return the byte value as string when not in values map
      expect(result).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty data gracefully', () => {
      const config = {
        mappings: {},
        reportId: 1,
      };

      const reader = new HIDReader(mockDevice, config, mockCallback);
      const data = new Uint8Array([]);

      const result = reader.processDeviceData(data);
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
    });

    it('should handle out of bounds byte indices', () => {
      const config = {
        mappings: {
          x: {
            type: 'range',
            byteIndex: 10, // Out of bounds
            min: 0,
            max: 255,
          },
        },
        reportId: 1,
      };

      const reader = new HIDReader(mockDevice, config, mockCallback);
      const data = new Uint8Array([1, 128]);

      const result = reader.processDeviceData(data);
      expect(result).toBeDefined();
      // Should not have 'x' property since index is out of bounds
      expect(result.x).toBeUndefined();
    });

    it('should skip processing for wrong report ID', () => {
      const config = {
        mappings: {
          x: {
            type: 'range',
            byteIndex: 1,
            min: 0,
            max: 255,
          },
        },
        reportId: 2, // Expecting report ID 2
      };

      const reader = new HIDReader(mockDevice, config, mockCallback);
      const data = new Uint8Array([1, 128]); // But got report ID 1

      const result = reader.processDeviceData(data);
      expect(result).toBeDefined();
    });
  });

  describe('Device Control', () => {
    it('should start reading from device', async () => {
      const config = {
        mappings: {},
        reportId: 1,
      };

      const reader = new HIDReader(mockDevice, config, mockCallback);
      await reader.startReading();

      expect(mockDevice.addEventListener).toHaveBeenCalledWith(
        'inputreport',
        expect.any(Function)
      );
      expect(mockDevice.open).toHaveBeenCalled();
    });

    it('should not open device if already opened', async () => {
      mockDevice.opened = true;
      const config = {
        mappings: {},
        reportId: 1,
      };

      const reader = new HIDReader(mockDevice, config, mockCallback);
      await reader.startReading();

      expect(mockDevice.open).not.toHaveBeenCalled();
    });

    it('should stop reading when stop() is called', () => {
      const config = {
        mappings: {},
        reportId: 1,
      };

      const reader = new HIDReader(mockDevice, config, mockCallback);
      reader.stop();
      
      expect(true).toBe(true); // Should not throw
    });

    it('should close device gracefully', async () => {
      mockDevice.opened = true;
      const config = {
        mappings: {},
        reportId: 1,
      };

      const reader = new HIDReader(mockDevice, config, mockCallback);
      await reader.close();

      expect(mockDevice.close).toHaveBeenCalled();
    });

    it('should not close device if not opened', async () => {
      mockDevice.opened = false;
      const config = {
        mappings: {},
        reportId: 1,
      };

      const reader = new HIDReader(mockDevice, config, mockCallback);
      await reader.close();

      expect(mockDevice.close).not.toHaveBeenCalled();
    });

    it('should handle close errors gracefully', async () => {
      mockDevice.opened = true;
      mockDevice.close = vi.fn().mockRejectedValue(new Error('Close failed'));
      
      const config = {
        mappings: {},
        reportId: 1,
      };

      const reader = new HIDReader(mockDevice, config, mockCallback);
      
      // Should not throw
      await expect(reader.close()).resolves.toBeUndefined();
    });
  });

  describe('Complex Scenarios', () => {
    it('should process complete tablet data packet', () => {
      const config = {
        mappings: {
          status: {
            type: MappingType.CODE,
            byteIndex: 1,
            values: {
              '160': { state: 'stylus' },
            },
          },
          x: {
            type: MappingType.MULTI_BYTE_RANGE,
            byteIndex: [2, 3],
            min: 0,
            max: 65535,
          },
          y: {
            type: MappingType.MULTI_BYTE_RANGE,
            byteIndex: [4, 5],
            min: 0,
            max: 65535,
          },
          pressure: {
            type: 'range',
            byteIndex: 6,
            min: 0,
            max: 255,
          },
          tiltX: {
            type: MappingType.BIPOLAR_RANGE,
            byteIndex: 7,
            positiveMin: 128,
            positiveMax: 255,
            negativeMin: 0,
            negativeMax: 127,
          },
        },
        reportId: 2,
      };

      const reader = new HIDReader(mockDevice, config, mockCallback);
      const data = new Uint8Array([2, 160, 100, 50, 200, 150, 200, 180]);

      const result = reader.processDeviceData(data);
      
      expect(result.state).toBe('stylus');
      expect(result.x).toBeDefined();
      expect(result.y).toBeDefined();
      expect(result.pressure).toBeDefined();
      expect(result.tiltX).toBeDefined();
      
      expect(typeof result.x).toBe('number');
      expect(typeof result.y).toBe('number');
      expect(typeof result.pressure).toBe('number');
      expect(typeof result.tiltX).toBe('number');
    });

    it('should distinguish between button and stylus mode', () => {
      const config = {
        mappings: {
          status: {
            type: MappingType.CODE,
            byteIndex: 1,
            values: {
              '160': { state: 'stylus' },
              '2': { state: 'buttons' },
            },
          },
          x: {
            type: 'range',
            byteIndex: 2,
            min: 0,
            max: 255,
          },
        },
        reportId: 2,
      };

      const reader = new HIDReader(mockDevice, config, mockCallback);

      // Stylus mode - should process x
      let data = new Uint8Array([2, 160, 100]);
      let result = reader.processDeviceData(data);
      expect(result.state).toBe('stylus');
      expect(result.x).toBeDefined();

      // Button mode - should still process (no filtering in current implementation)
      data = new Uint8Array([2, 2, 100]);
      result = reader.processDeviceData(data);
      expect(result.state).toBe('buttons');
    });
  });
});

