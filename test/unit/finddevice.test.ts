import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DeviceFinder } from '../../src/utils/finddevice';

describe('DeviceFinder', () => {
  let mockHID: any;

  beforeEach(() => {
    // Create comprehensive mock HID API
    mockHID = {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      getDevices: vi.fn().mockResolvedValue([]),
      requestDevice: vi.fn().mockResolvedValue([]),
    };

    // Mock the navigator.hid API
    global.navigator = {
      hid: mockHID,
    } as any;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should create an instance without callbacks', () => {
      const finder = new DeviceFinder();
      expect(finder).toBeDefined();
      expect(finder).toBeInstanceOf(DeviceFinder);
    });

    it('should create an instance with onConnect callback', () => {
      const onConnect = vi.fn();
      const finder = new DeviceFinder(onConnect);
      expect(finder).toBeDefined();
    });

    it('should create an instance with both callbacks', () => {
      const onConnect = vi.fn();
      const onDisconnect = vi.fn();
      const finder = new DeviceFinder(onConnect, onDisconnect);
      expect(finder).toBeDefined();
    });

    it('should setup event listeners on initialization', () => {
      new DeviceFinder();
      expect(mockHID.addEventListener).toHaveBeenCalledWith('connect', expect.any(Function));
      expect(mockHID.addEventListener).toHaveBeenCalledWith('disconnect', expect.any(Function));
    });

    it('should accept custom configuration', () => {
      const config = {
        digitizerUsagePage: 0x0D,
        excludedUsagePages: [0x01],
        autoConnect: false,
      };
      const finder = new DeviceFinder(undefined, undefined, config);
      expect(finder).toBeDefined();
    });

    it('should use default digitizer usage page', () => {
      const finder = new DeviceFinder();
      expect(finder).toBeDefined();
      // Default should be 0x0D
    });
  });

  describe('Device Status', () => {
    it('should return false for isConnected initially', () => {
      const finder = new DeviceFinder();
      expect(finder.isConnected()).toBe(false);
    });

    it('should return null for getActiveDevice initially', () => {
      const finder = new DeviceFinder();
      expect(finder.getActiveDevice()).toBeNull();
    });

    it('should return empty array for getAllDevices initially', () => {
      const finder = new DeviceFinder();
      const devices = finder.getAllDevices();
      expect(Array.isArray(devices)).toBe(true);
      expect(devices).toHaveLength(0);
    });
  });

  describe('Check for Existing Devices', () => {
    it('should return false when no devices are found', async () => {
      mockHID.getDevices.mockResolvedValue([]);
      const finder = new DeviceFinder();
      const result = await finder.checkForExistingDevices();
      expect(result).toBe(false);
      expect(mockHID.getDevices).toHaveBeenCalled();
    });

    it('should return false when WebHID is not supported', async () => {
      global.navigator = {} as any;
      const finder = new DeviceFinder();
      const result = await finder.checkForExistingDevices();
      expect(result).toBe(false);
    });

    it('should return false when autoConnect is disabled', async () => {
      const mockDevice = createMockDevice({
        vendorId: 0x1234,
        productId: 0x5678,
        productName: 'Test Tablet',
      });
      mockHID.getDevices.mockResolvedValue([mockDevice]);
      
      const config = { autoConnect: false };
      const finder = new DeviceFinder(undefined, undefined, config);
      const result = await finder.checkForExistingDevices();
      
      expect(result).toBe(false);
    });

    it('should find and connect to digitizer device', async () => {
      const mockDevice = createMockDevice({
        vendorId: 0x1234,
        productId: 0x5678,
        productName: 'Test Tablet',
        collections: [{ usagePage: 0x0D, usage: 0x02 }],
      });
      mockHID.getDevices.mockResolvedValue([mockDevice]);

      const onConnect = vi.fn();
      const finder = new DeviceFinder(onConnect);
      const result = await finder.checkForExistingDevices();

      expect(result).toBe(true);
      expect(onConnect).toHaveBeenCalled();
      // Primary device is NOT opened by DeviceFinder - HIDReader opens it
      expect(mockDevice.open).not.toHaveBeenCalled();
    });

    it('should handle devices with multiple interfaces', async () => {
      const mockDevice1 = createMockDevice({
        vendorId: 0x1234,
        productId: 0x5678,
        productName: 'Test Tablet',
        collections: [{ usagePage: 0x0D, usage: 0x02 }],
      });
      const mockDevice2 = createMockDevice({
        vendorId: 0x1234,
        productId: 0x5678,
        productName: 'Test Tablet',
        collections: [{ usagePage: 0x01, usage: 0x06 }],
      });
      mockHID.getDevices.mockResolvedValue([mockDevice1, mockDevice2]);

      const onConnect = vi.fn();
      const finder = new DeviceFinder(onConnect);
      const result = await finder.checkForExistingDevices();

      expect(result).toBe(true);
      expect(mockDevice1.open).not.toHaveBeenCalled(); // Primary device not opened by finder
      expect(mockDevice2.open).toHaveBeenCalled(); // Secondary interface opened
    });

    it('should exclude devices with excluded usage pages', async () => {
      const mockDevice1 = createMockDevice({
        vendorId: 0x1234,
        productId: 0x5678,
        collections: [{ usagePage: 0x0D, usage: 0x02 }],
      });
      const mockDevice2 = createMockDevice({
        vendorId: 0x1234,
        productId: 0x5678,
        collections: [{ usagePage: 0x01, usage: 0x06 }],
      });
      mockHID.getDevices.mockResolvedValue([mockDevice1, mockDevice2]);

      const config = { excludedUsagePages: [0x01] };
      const onConnect = vi.fn();
      const finder = new DeviceFinder(onConnect, undefined, config);
      await finder.checkForExistingDevices();

      // Device 2 should not be opened due to exclusion
      expect(mockDevice2.open).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      mockHID.getDevices.mockRejectedValue(new Error('Access denied'));
      const finder = new DeviceFinder();
      const result = await finder.checkForExistingDevices();
      expect(result).toBe(false);
    });
  });

  describe('Request Device', () => {
    it('should request device with filters', async () => {
      const mockDevice = createMockDevice({
        vendorId: 0x1234,
        productId: 0x5678,
        productName: 'Test Tablet',
      });
      mockHID.requestDevice.mockResolvedValue([mockDevice]);
      mockHID.getDevices.mockResolvedValue([mockDevice]);

      const filters = [{ vendorId: 0x1234 }];
      const finder = new DeviceFinder();
      const result = await finder.requestDevice(filters);

      expect(mockHID.requestDevice).toHaveBeenCalledWith({ filters });
      expect(result).not.toBeNull();
    });

    it('should request device without filters', async () => {
      const mockDevice = createMockDevice({
        vendorId: 0x1234,
        productId: 0x5678,
      });
      mockHID.requestDevice.mockResolvedValue([mockDevice]);
      mockHID.getDevices.mockResolvedValue([mockDevice]);

      const finder = new DeviceFinder();
      const result = await finder.requestDevice();

      expect(mockHID.requestDevice).toHaveBeenCalledWith({ filters: [] });
      expect(result).not.toBeNull();
    });

    it('should return null when user cancels device selection', async () => {
      mockHID.requestDevice.mockResolvedValue([]);

      const finder = new DeviceFinder();
      const result = await finder.requestDevice();

      expect(result).toBeNull();
    });

    it('should call onConnect callback on successful connection', async () => {
      const mockDevice = createMockDevice({
        vendorId: 0x1234,
        productId: 0x5678,
        productName: 'Test Tablet',
      });
      mockHID.requestDevice.mockResolvedValue([mockDevice]);
      mockHID.getDevices.mockResolvedValue([mockDevice]);

      const onConnect = vi.fn();
      const finder = new DeviceFinder(onConnect);
      await finder.requestDevice();

      expect(onConnect).toHaveBeenCalledWith(
        expect.objectContaining({
          primaryDevice: mockDevice,
          allDevices: expect.any(Array),
          deviceInfo: expect.objectContaining({
            name: 'Test Tablet',
            vendor: 0x1234,
            product: 0x5678,
          }),
        })
      );
    });

    it('should handle errors during device request', async () => {
      mockHID.requestDevice.mockRejectedValue(new Error('Permission denied'));

      const finder = new DeviceFinder();
      const result = await finder.requestDevice();

      expect(result).toBeNull();
    });

    it('should handle WebHID not supported', async () => {
      global.navigator = {} as any;

      const finder = new DeviceFinder();
      const result = await finder.requestDevice();

      expect(result).toBeNull();
    });

    it('should prefer digitizer interface', async () => {
      const digitizerDevice = createMockDevice({
        vendorId: 0x1234,
        productId: 0x5678,
        collections: [{ usagePage: 0x0D, usage: 0x02 }],
      });
      const otherDevice = createMockDevice({
        vendorId: 0x1234,
        productId: 0x5678,
        collections: [{ usagePage: 0x01, usage: 0x06 }],
      });
      
      mockHID.requestDevice.mockResolvedValue([otherDevice, digitizerDevice]);
      mockHID.getDevices.mockResolvedValue([otherDevice, digitizerDevice]);

      const onConnect = vi.fn();
      const finder = new DeviceFinder(onConnect);
      await finder.requestDevice();

      expect(onConnect).toHaveBeenCalledWith(
        expect.objectContaining({
          primaryDevice: digitizerDevice,
        })
      );
    });
  });

  describe('Device Disconnection', () => {
    it('should disconnect and call onDisconnect callback', async () => {
      const mockDevice = createMockDevice({ opened: true });
      mockHID.getDevices.mockResolvedValue([mockDevice]);
      mockHID.requestDevice.mockResolvedValue([mockDevice]);

      const onDisconnect = vi.fn();
      const finder = new DeviceFinder(undefined, onDisconnect);
      
      await finder.requestDevice();
      await finder.disconnect();

      expect(mockDevice.close).toHaveBeenCalled();
      expect(onDisconnect).toHaveBeenCalled();
    });

    it('should handle disconnect when no device is connected', async () => {
      const finder = new DeviceFinder();
      await expect(finder.disconnect()).resolves.toBeUndefined();
    });

    it('should handle close errors gracefully', async () => {
      const mockDevice = createMockDevice({ opened: true });
      mockDevice.close.mockRejectedValue(new Error('Close failed'));
      mockHID.getDevices.mockResolvedValue([mockDevice]);
      mockHID.requestDevice.mockResolvedValue([mockDevice]);

      const finder = new DeviceFinder();
      await finder.requestDevice();
      
      await expect(finder.disconnect()).resolves.toBeUndefined();
    });
  });

  describe('Device Info', () => {
    it('should return correct device info after connection', async () => {
      const mockDevice = createMockDevice({
        vendorId: 0x1234,
        productId: 0x5678,
        productName: 'My Test Tablet',
      });
      mockHID.requestDevice.mockResolvedValue([mockDevice]);
      mockHID.getDevices.mockResolvedValue([mockDevice]);

      const onConnect = vi.fn();
      const finder = new DeviceFinder(onConnect);
      const result = await finder.requestDevice();

      expect(result?.deviceInfo).toEqual({
        name: 'My Test Tablet',
        vendor: 0x1234,
        product: 0x5678,
      });
    });

    it('should handle device without product name', async () => {
      const mockDevice = createMockDevice({
        vendorId: 0x1234,
        productId: 0x5678,
        productName: undefined,
      });
      mockHID.requestDevice.mockResolvedValue([mockDevice]);
      mockHID.getDevices.mockResolvedValue([mockDevice]);

      const onConnect = vi.fn();
      const finder = new DeviceFinder(onConnect);
      const result = await finder.requestDevice();

      expect(result?.deviceInfo.name).toBe('Unknown Device');
    });
  });
});

// Helper function to create mock HID devices
function createMockDevice(options: {
  vendorId?: number;
  productId?: number;
  productName?: string;
  opened?: boolean;
  collections?: Array<{ usagePage: number; usage: number }>;
} = {}) {
  return {
    vendorId: options.vendorId || 0x0000,
    productId: options.productId || 0x0000,
    productName: options.productName,
    opened: options.opened || false,
    collections: options.collections || [{ usagePage: 0x0D, usage: 0x02 }],
    open: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };
}

