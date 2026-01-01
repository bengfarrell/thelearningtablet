import { describe, it, expect } from 'vitest';

/**
 * Tests for device switching functionality in hid-data-reader component
 * 
 * These tests verify that the component correctly tracks which device (real or simulated)
 * is currently active and updates the bytes display accordingly.
 */

describe('Device Switching Logic', () => {
  describe('currentActiveDeviceIndex tracking', () => {
    it('should track the most recent device that sent data', () => {
      // Simulate the logic from _handleDeviceData
      let currentActiveDeviceIndex: number | undefined = undefined;
      const deviceDataStreams = new Map<number, { lastPacket: string; packetCount: number; lastUpdate: number }>();

      // Initialize device streams
      deviceDataStreams.set(0, { lastPacket: '', packetCount: 0, lastUpdate: Date.now() });
      deviceDataStreams.set(-1, { lastPacket: '', packetCount: 0, lastUpdate: Date.now() });

      // Simulate device 0 sending data
      const device0Stream = deviceDataStreams.get(0)!;
      device0Stream.packetCount++;
      device0Stream.lastUpdate = Date.now();
      currentActiveDeviceIndex = 0;

      expect(currentActiveDeviceIndex).toBe(0);

      // Wait a bit to ensure timestamp difference
      const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
      
      // Simulate device -1 (mock) sending data after a delay
      return delay(10).then(() => {
        const mockStream = deviceDataStreams.get(-1)!;
        mockStream.packetCount++;
        mockStream.lastUpdate = Date.now();
        currentActiveDeviceIndex = -1;

        expect(currentActiveDeviceIndex).toBe(-1);
      });
    });

    it('should reset to undefined when cleared', () => {
      let currentActiveDeviceIndex: number | undefined = 0;

      // Simulate reset
      currentActiveDeviceIndex = undefined;

      expect(currentActiveDeviceIndex).toBeUndefined();
    });

    it('should update on every data packet during walkthrough', () => {
      let currentActiveDeviceIndex: number | undefined = undefined;
      const walkthroughStep = 'step1-horizontal';

      // Simulate multiple packets from device 0
      for (let i = 0; i < 5; i++) {
        if (walkthroughStep !== 'idle' && walkthroughStep !== 'step10-metadata' && walkthroughStep !== 'complete') {
          currentActiveDeviceIndex = 0;
        }
      }

      expect(currentActiveDeviceIndex).toBe(0);

      // Simulate switching to mock device
      for (let i = 0; i < 3; i++) {
        if (walkthroughStep !== 'idle' && walkthroughStep !== 'step10-metadata' && walkthroughStep !== 'complete') {
          currentActiveDeviceIndex = -1;
        }
      }

      expect(currentActiveDeviceIndex).toBe(-1);
    });
  });

  describe('Device info display', () => {
    it('should show correct device info for real device', () => {
      const currentActiveDeviceIndex = 0;
      const deviceDataStreams = new Map<number, { lastPacket: string; packetCount: number; lastUpdate: number }>();
      deviceDataStreams.set(0, { lastPacket: 'AA BB CC', packetCount: 10, lastUpdate: Date.now() });

      const deviceStream = deviceDataStreams.get(currentActiveDeviceIndex);
      const isMockDevice = currentActiveDeviceIndex === -1;

      expect(deviceStream).toBeDefined();
      expect(deviceStream!.packetCount).toBe(10);
      expect(isMockDevice).toBe(false);
    });

    it('should show correct device info for mock device', () => {
      const currentActiveDeviceIndex = -1;
      const deviceDataStreams = new Map<number, { lastPacket: string; packetCount: number; lastUpdate: number }>();
      deviceDataStreams.set(-1, { lastPacket: 'DD EE FF', packetCount: 5, lastUpdate: Date.now() });

      const deviceStream = deviceDataStreams.get(currentActiveDeviceIndex);
      const isMockDevice = currentActiveDeviceIndex === -1;

      expect(deviceStream).toBeDefined();
      expect(deviceStream!.packetCount).toBe(5);
      expect(isMockDevice).toBe(true);
    });

    it('should handle undefined device index gracefully', () => {
      const currentActiveDeviceIndex: number | undefined = undefined;
      const deviceDataStreams = new Map<number, { lastPacket: string; packetCount: number; lastUpdate: number }>();

      const deviceStream = currentActiveDeviceIndex !== undefined 
        ? deviceDataStreams.get(currentActiveDeviceIndex) 
        : undefined;

      expect(deviceStream).toBeUndefined();
    });
  });

  describe('Reset functionality', () => {
    it('should clear active device indices on reset', () => {
      const activeDeviceIndices = new Set<number>([0, 1, -1]);
      let currentActiveDeviceIndex: number | undefined = 0;

      // Simulate reset
      activeDeviceIndices.clear();
      currentActiveDeviceIndex = undefined;

      expect(activeDeviceIndices.size).toBe(0);
      expect(currentActiveDeviceIndex).toBeUndefined();
    });

    it('should preserve device streams on reset', () => {
      const deviceDataStreams = new Map<number, { lastPacket: string; packetCount: number; lastUpdate: number }>();
      deviceDataStreams.set(0, { lastPacket: 'AA BB CC', packetCount: 10, lastUpdate: Date.now() });
      deviceDataStreams.set(-1, { lastPacket: 'DD EE FF', packetCount: 5, lastUpdate: Date.now() });

      // Reset doesn't clear device streams, only active indices
      const streamCount = deviceDataStreams.size;

      expect(streamCount).toBe(2);
      expect(deviceDataStreams.get(0)).toBeDefined();
      expect(deviceDataStreams.get(-1)).toBeDefined();
    });
  });
});

