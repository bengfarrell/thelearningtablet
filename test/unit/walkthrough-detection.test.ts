import { describe, it, expect } from 'vitest';
import { analyzeBytes, getBestGuessBytesByVariance, generateDeviceConfig } from '../../src/utils/byte-detector.js';
import { TabletDataGenerator } from '../../src/mockbytes/tablet-data-generator.js';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('Walkthrough Byte Detection', () => {
  const generator = new TabletDataGenerator({
    width: 16000,
    height: 9000,
    maxPressure: 16383,
    sampleRate: 200,
  });

  /**
   * Helper to collect packets from a generator
   */
  function collectPackets(gen: Generator<Uint8Array>, maxPackets = 300): Uint8Array[] {
    const packets: Uint8Array[] = [];
    for (const packet of gen) {
      packets.push(packet);
      if (packets.length >= maxPackets) break;
    }
    return packets;
  }

  describe('Step 1: Horizontal Movement (X Coordinate)', () => {
    it('should detect X coordinate at bytes 2-3 (indices 1-2)', () => {
      // Generate horizontal drag with constant pressure
      const packets = collectPackets(
        generator.generateLineConstantPressure(0, 0.5, 1, 0.5, 0.5, 1500)
      );

      // Analyze bytes
      const analysis = analyzeBytes(packets);
      const detectedBytes = getBestGuessBytesByVariance(analysis, 2);

      // Verify X coordinate bytes (0-based indices 1, 2)
      expect(detectedBytes.map(b => b.byteIndex)).toEqual([1, 2]);
    });
  });

  describe('Step 2: Vertical Movement (Y Coordinate)', () => {
    it('should detect Y coordinate at bytes 4-5 (indices 3-4)', () => {
      // Generate vertical drag with constant pressure
      const packets = collectPackets(
        generator.generateLineConstantPressure(0.5, 0, 0.5, 1, 0.5, 1500)
      );

      // Analyze bytes
      const analysis = analyzeBytes(packets);

      // Filter out X coordinate bytes (indices 1, 2)
      const knownByteIndices = new Set([1, 2]);
      const filteredAnalysis = analysis.filter(b => !knownByteIndices.has(b.byteIndex));

      const detectedBytes = getBestGuessBytesByVariance(filteredAnalysis, 2);

      // Verify Y coordinate bytes (0-based indices 3, 4)
      expect(detectedBytes.map(b => b.byteIndex)).toEqual([3, 4]);
    });
  });

  describe('Step 3: Pressure Detection', () => {
    it('should detect pressure at bytes 6-7 (indices 5-6)', () => {
      // Generate pressure variation at a fixed point
      const packets = collectPackets(
        generator.generateLine(0.5, 0.5, 0.5, 0.5, 1500)
      );

      // Analyze bytes
      const analysis = analyzeBytes(packets);

      // Filter out X and Y coordinate bytes (indices 1, 2, 3, 4)
      const knownByteIndices = new Set([1, 2, 3, 4]);
      const filteredAnalysis = analysis.filter(b => !knownByteIndices.has(b.byteIndex));

      const detectedBytes = getBestGuessBytesByVariance(filteredAnalysis, 2);

      // Verify pressure bytes (0-based indices 5, 6)
      expect(detectedBytes.map(b => b.byteIndex)).toEqual([5, 6]);
    });
  });

  describe('Step 4: Hover Horizontal (X Coordinate Confirmation)', () => {
    it('should detect X coordinate at bytes 2-3 (indices 1-2) without pressure', () => {
      // Generate horizontal hover (no pressure)
      const packets = collectPackets(
        generator.generateHoverLine(0, 0.5, 1, 0.5, 1500)
      );

      // Analyze bytes
      const analysis = analyzeBytes(packets);
      const detectedBytes = getBestGuessBytesByVariance(analysis, 2);

      // Verify X coordinate bytes (0-based indices 1, 2)
      expect(detectedBytes.map(b => b.byteIndex)).toEqual([1, 2]);
    });
  });

  describe('Step 5: Hover Vertical (Y Coordinate Confirmation)', () => {
    it('should detect Y coordinate at bytes 4-5 (indices 3-4) without pressure', () => {
      // Generate vertical hover (no pressure)
      const packets = collectPackets(
        generator.generateHoverLine(0.5, 0, 0.5, 1, 1500)
      );

      // Analyze bytes
      const analysis = analyzeBytes(packets);

      // Filter out X coordinate bytes (indices 1, 2)
      const knownByteIndices = new Set([1, 2]);
      const filteredAnalysis = analysis.filter(b => !knownByteIndices.has(b.byteIndex));

      const detectedBytes = getBestGuessBytesByVariance(filteredAnalysis, 2);

      // Verify Y coordinate bytes (0-based indices 3, 4)
      expect(detectedBytes.map(b => b.byteIndex)).toEqual([3, 4]);
    });
  });

  describe('Step 6: Tilt X Detection', () => {
    it('should detect tilt X at byte 8 (index 7)', () => {
      // Generate tilt X variation
      const packets = collectPackets(
        generator.generateTiltXLine(0.5, 0.5, 0.5, 0.5, 1500)
      );

      // Analyze bytes
      const analysis = analyzeBytes(packets);

      // Filter out X, Y, and pressure bytes (indices 1, 2, 3, 4, 5, 6)
      const knownByteIndices = new Set([1, 2, 3, 4, 5, 6]);
      const filteredAnalysis = analysis.filter(b => !knownByteIndices.has(b.byteIndex));

      const detectedBytes = getBestGuessBytesByVariance(filteredAnalysis, 1);

      // Verify tilt X byte (0-based index 7)
      expect(detectedBytes.map(b => b.byteIndex)).toEqual([7]);
    });
  });

  describe('Step 7: Tilt Y Detection', () => {
    it('should detect tilt Y at byte 9 (index 8)', () => {
      // Generate tilt Y variation
      const packets = collectPackets(
        generator.generateTiltYLine(0.5, 0.5, 0.5, 0.5, 1500)
      );

      // Analyze bytes
      const analysis = analyzeBytes(packets);

      // Filter out X, Y, pressure, and tilt X bytes (indices 1, 2, 3, 4, 5, 6, 7)
      const knownByteIndices = new Set([1, 2, 3, 4, 5, 6, 7]);
      const filteredAnalysis = analysis.filter(b => !knownByteIndices.has(b.byteIndex));

      const detectedBytes = getBestGuessBytesByVariance(filteredAnalysis, 1);

      // Verify tilt Y byte (0-based index 8)
      expect(detectedBytes.map(b => b.byteIndex)).toEqual([8]);
    });
  });

  describe('Step 8 & 9: Button Detection', () => {
    it('should detect status byte changes for button presses', () => {
      // Generate normal contact packets
      const normalPackets = collectPackets(
        generator.generateLine(0.5, 0.5, 0.5, 0.5, 500)
      );

      // Generate packets with primary button pressed
      const primaryButtonPackets = collectPackets(
        generator.generatePrimaryButtonLine(0.5, 0.5, 0.5, 0.5, 500)
      );

      // Generate packets with secondary button pressed
      const secondaryButtonPackets = collectPackets(
        generator.generateSecondaryButtonLine(0.5, 0.5, 0.5, 0.5, 500)
      );

      // Status byte should be at index 0
      const normalStatus = normalPackets[0][0];
      const primaryStatus = primaryButtonPackets[0][0];
      const secondaryStatus = secondaryButtonPackets[0][0];

      // Verify status byte changes with button presses
      expect(primaryStatus).not.toBe(normalStatus);
      expect(secondaryStatus).not.toBe(normalStatus);
      expect(primaryStatus).not.toBe(secondaryStatus);
    });
  });

  describe('Final: Complete Configuration Generation', () => {
    it('should generate configuration matching XP-Pen Deco 640 structure', () => {
      // Load expected configuration
      const expectedConfigPath = join(process.cwd(), 'public/exampleconfigurations/xp_pen_deco_640_osx_nodriver.json');
      const expectedConfig = JSON.parse(readFileSync(expectedConfigPath, 'utf-8'));

      // Simulate all steps to collect data
      const horizontalPackets = collectPackets(
        generator.generateLineConstantPressure(0, 0.5, 1, 0.5, 0.5, 1500)
      );
      const verticalPackets = collectPackets(
        generator.generateLineConstantPressure(0.5, 0, 0.5, 1, 0.5, 1500)
      );
      const pressurePackets = collectPackets(
        generator.generateLine(0.5, 0.5, 0.5, 0.5, 1500)
      );
      const tiltXPackets = collectPackets(
        generator.generateTiltXLine(0.5, 0.5, 0.5, 0.5, 1500)
      );
      const tiltYPackets = collectPackets(
        generator.generateTiltYLine(0.5, 0.5, 0.5, 0.5, 1500)
      );

      // Detect bytes for each step
      const horizontalAnalysis = analyzeBytes(horizontalPackets);
      const horizontalBytes = getBestGuessBytesByVariance(horizontalAnalysis, 2);

      const verticalAnalysis = analyzeBytes(verticalPackets);
      const filteredVertical = verticalAnalysis.filter(b => ![1, 2].includes(b.byteIndex));
      const verticalBytes = getBestGuessBytesByVariance(filteredVertical, 2);

      const pressureAnalysis = analyzeBytes(pressurePackets);
      const filteredPressure = pressureAnalysis.filter(b => ![1, 2, 3, 4].includes(b.byteIndex));
      const pressureBytes = getBestGuessBytesByVariance(filteredPressure, 2);

      const tiltXAnalysis = analyzeBytes(tiltXPackets);
      const filteredTiltX = tiltXAnalysis.filter(b => ![1, 2, 3, 4, 5, 6].includes(b.byteIndex));
      const tiltXBytes = getBestGuessBytesByVariance(filteredTiltX, 1);

      const tiltYAnalysis = analyzeBytes(tiltYPackets);
      const filteredTiltY = tiltYAnalysis.filter(b => ![1, 2, 3, 4, 5, 6, 7].includes(b.byteIndex));
      const tiltYBytes = getBestGuessBytesByVariance(filteredTiltY, 1);

      // Collect status byte values
      const statusByteValues = new Map();
      const allPackets = [
        ...horizontalPackets,
        ...verticalPackets,
        ...pressurePackets,
        ...tiltXPackets,
        ...tiltYPackets,
      ];

      // Track unique status byte values
      const statusByteIndex = 0;
      const uniqueStatusValues = new Set<number>();
      allPackets.forEach(packet => {
        uniqueStatusValues.add(packet[statusByteIndex]);
      });

      // Map status values to states (based on actual mock device values)
      uniqueStatusValues.forEach(value => {
        if (value === 0xa0) {
          statusByteValues.set(value, { hover: true });
        } else if (value === 0xa1) {
          statusByteValues.set(value, { contact: true });
        } else if (value === 0xa5) {
          statusByteValues.set(value, { contact: true, primaryButton: true });
        } else if (value === 0xa3) {
          statusByteValues.set(value, { contact: true, secondaryButton: true });
        }
      });

      // Generate configuration
      const generatedConfig = generateDeviceConfig(
        horizontalBytes,
        verticalBytes,
        pressureBytes,
        tiltXBytes,
        tiltYBytes,
        statusByteValues,
        allPackets
      );

      // Verify configuration matches expected structure
      expect(generatedConfig.x.byteIndex).toEqual([2, 3]);
      expect(generatedConfig.y.byteIndex).toEqual([4, 5]);
      expect(generatedConfig.pressure.byteIndex).toEqual([6, 7]);
      expect(generatedConfig.tiltX.byteIndex).toEqual([8]);
      expect(generatedConfig.tiltY.byteIndex).toEqual([9]);

      // Verify types
      expect(generatedConfig.x.type).toBe('multi-byte-range');
      expect(generatedConfig.y.type).toBe('multi-byte-range');
      expect(generatedConfig.pressure.type).toBe('multi-byte-range');
      expect(generatedConfig.tiltX.type).toBe('bipolar-range');
      expect(generatedConfig.tiltY.type).toBe('bipolar-range');

      // Verify status byte if it exists (optional since we're not testing button presses in this flow)
      if (generatedConfig.status) {
        expect(generatedConfig.status.byteIndex).toEqual([1]);
        expect(generatedConfig.status.type).toBe('code');
        expect(generatedConfig.status.values).toBeDefined();
        expect(Object.keys(generatedConfig.status.values).length).toBeGreaterThan(0);
      }
    });
  });
});


