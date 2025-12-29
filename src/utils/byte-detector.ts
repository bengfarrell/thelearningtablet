/**
 * Byte Detection Utilities
 * 
 * This module contains the core logic for analyzing HID packets and identifying
 * which bytes represent coordinates, pressure, tilt, and other tablet data.
 */

export interface ByteAnalysis {
  byteIndex: number;
  min: number;
  max: number;
  variance: number;
}

export interface CoordinateConfig {
  byteIndex: number[];
  max: number;
  type: 'multi-byte-range';
}

export interface TiltConfig {
  byteIndex: number[];
  positiveMax: number;
  negativeMin: number;
  negativeMax: number;
  type: 'bipolar-range';
}

export interface StatusValue {
  state: string;
  primaryButtonPressed?: boolean;
  secondaryButtonPressed?: boolean;
}

export interface StatusConfig {
  byteIndex: number[];
  type: 'code';
  values: Record<string, StatusValue>;
}

export interface DeviceByteCodeMappings {
  status?: StatusConfig;
  x: CoordinateConfig;
  y: CoordinateConfig;
  pressure: CoordinateConfig;
  tiltX?: TiltConfig;
  tiltY?: TiltConfig;
}

/**
 * Analyzes captured HID packets and calculates statistics for each byte position.
 * Returns min, max, and variance for each byte across all packets.
 */
export function analyzeBytes(packets: Uint8Array[]): ByteAnalysis[] {
  if (packets.length === 0) {
    return [];
  }

  const analysis: ByteAnalysis[] = [];
  const packetLength = packets[0].length;

  for (let byteIndex = 0; byteIndex < packetLength; byteIndex++) {
    let min = 255;
    let max = 0;

    for (const packet of packets) {
      const value = packet[byteIndex];
      if (value < min) min = value;
      if (value > max) max = value;
    }

    const variance = max - min;

    analysis.push({
      byteIndex,
      min,
      max,
      variance,
    });
  }

  return analysis;
}

/**
 * Identifies the most significant bytes based on variance.
 * 
 * Strategy:
 * - If maxBytes === 1: Looking for a single byte (like tilt) - returns highest variance byte
 * - Otherwise: Prioritizes consecutive byte pairs (multi-byte values like coordinates)
 * 
 * @param analysis - Byte analysis results from analyzeBytes()
 * @param maxBytes - Maximum number of bytes to return (1 for single-byte, 2+ for multi-byte)
 * @param minVariance - Minimum variance threshold to filter out noise (default: 50)
 */
export function getBestGuessBytesByVariance(
  analysis: ByteAnalysis[],
  maxBytes = 3,
  minVariance = 50
): ByteAnalysis[] {
  const significantBytes = analysis
      .filter(byte => byte.variance > minVariance)
      .sort((a, b) => b.variance - a.variance);

  const result: ByteAnalysis[] = [];
  const used = new Set<number>();

  // For single-byte detection (tilt), skip the pair logic and just return the top byte
  if (maxBytes === 1) {
    if (significantBytes.length > 0) {
      return [significantBytes[0]];
    }
    return [];
  }

  // First pass: Find consecutive byte pairs where at least ONE has high variance
  // This identifies multi-byte values (X, Y, pressure) which use 2 bytes each
  // For 16-bit values, the high byte may have low variance if the value doesn't exceed 255
  for (let i = 0; i < analysis.length - 1; i++) {
    const byte = analysis[i];
    const nextByte = analysis[i + 1];

    if (used.has(byte.byteIndex) || used.has(nextByte.byteIndex)) continue;

    // Check if they're consecutive and at least one has high variance
    // The other byte should have at least SOME variance (> 0) to be part of the value
    if (
        nextByte.byteIndex === byte.byteIndex + 1 &&
        (byte.variance > minVariance || nextByte.variance > minVariance) &&
        byte.variance > 0 &&
        nextByte.variance > 0
    ) {
      // Consecutive bytes with variance - likely a multi-byte value
      result.push(byte);
      result.push(nextByte);
      used.add(byte.byteIndex);
      used.add(nextByte.byteIndex);

      // For coordinate detection, we typically want just 1 pair (2 bytes)
      // This prevents detecting tilt bytes (8, 9) when looking for X (2, 3)
      if (result.length >= 2) break;
    }
  }

  // Second pass: If we didn't find consecutive pairs, add single high-variance bytes
  // This handles single-byte values like tilt
  if (result.length === 0) {
    for (const byte of significantBytes) {
      if (used.has(byte.byteIndex)) continue;

      result.push(byte);
      used.add(byte.byteIndex);

      if (result.length >= maxBytes) break;
    }
  }

  return result.sort((a, b) => a.byteIndex - b.byteIndex);
}

/**
 * Groups consecutive byte indices together.
 * Used for multi-byte values like coordinates (e.g., [2, 3] for X coordinate).
 */
export function groupConsecutiveBytes(bytes: ByteAnalysis[]): number[] {
  if (bytes.length === 0) return [];

  const indices = bytes.map(b => b.byteIndex).sort((a, b) => a - b);
  return indices;
}

/**
 * Calculates the maximum value from multi-byte data.
 * For multi-byte values, uses the highest observed max value.
 */
export function calculateMultiByteMax(byteIndices: number[], bytes: ByteAnalysis[]): number {
  if (byteIndices.length === 0) return 0;

  // For multi-byte values, find the highest max value observed
  let maxValue = 0;
  for (const index of byteIndices) {
    const byte = bytes.find(b => b.byteIndex === index);
    if (byte && byte.max > maxValue) {
      maxValue = byte.max;
    }
  }

  // If we have 2 bytes, it's likely a 16-bit value
  // Use the observed max or default to 16-bit max
  if (byteIndices.length === 2) {
    return maxValue > 0 ? Math.max(maxValue, 255) : 65535;
  }

  return maxValue > 0 ? maxValue : 255;
}

/**
 * Finds the status byte in the HID packet.
 * Status bytes typically have low variance but multiple distinct values.
 */
export function findStatusByte(
  packets: Uint8Array[],
  excludeIndices: Set<number>
): number | null {
  if (packets.length === 0) return null;

  const analysis = analyzeBytes(packets);

  for (const byte of analysis) {
    // Skip already-identified bytes
    if (excludeIndices.has(byte.byteIndex)) continue;

    // Status byte characteristics:
    // - Has variance (not constant)
    // - Multiple distinct values (discrete codes, not continuous ranges)
    // - Typically 2-10 different states
    // Don't filter by variance amount - status byte can have moderate variance
    if (byte.variance > 0) {
      // Count distinct values
      const distinctValues = new Set<number>();
      for (const packet of packets) {
        distinctValues.add(packet[byte.byteIndex]);
      }

      // Status byte should have 2-10 distinct values
      if (distinctValues.size >= 2 && distinctValues.size <= 10) {
        return byte.byteIndex;
      }
    }
  }

  return null;
}

/**
 * Generates the final device configuration from detected bytes.
 * Converts from 0-based internal indexing to 1-based JSON spec indexing.
 */
export function generateDeviceConfig(
  horizontalBytes: ByteAnalysis[],
  verticalBytes: ByteAnalysis[],
  pressureBytes: ByteAnalysis[],
  tiltXBytes: ByteAnalysis[],
  tiltYBytes: ByteAnalysis[],
  statusByteValues: Map<number, StatusValue>,
  allPackets: Uint8Array[]
): DeviceByteCodeMappings {
  // Group consecutive bytes for multi-byte values (0-based internally)
  const xBytes = groupConsecutiveBytes(horizontalBytes);
  const yBytes = groupConsecutiveBytes(verticalBytes);
  const pressureByteIndices = groupConsecutiveBytes(pressureBytes);

  // Calculate max values from the observed data
  const xMax = calculateMultiByteMax(xBytes, horizontalBytes);
  const yMax = calculateMultiByteMax(yBytes, verticalBytes);
  const pressureMax = calculateMultiByteMax(pressureByteIndices, pressureBytes);

  // Convert to 1-based indexing for JSON spec
  const config: DeviceByteCodeMappings = {
    x: {
      byteIndex: xBytes.map(i => i + 1),
      max: xMax,
      type: 'multi-byte-range',
    },
    y: {
      byteIndex: yBytes.map(i => i + 1),
      max: yMax,
      type: 'multi-byte-range',
    },
    pressure: {
      byteIndex: pressureByteIndices.map(i => i + 1),
      max: pressureMax,
      type: 'multi-byte-range',
    },
  };

  // Add status byte mappings if detected
  if (statusByteValues.size > 0) {
    const excludeIndices = new Set([
      ...xBytes,
      ...yBytes,
      ...pressureByteIndices,
      ...tiltXBytes.map(b => b.byteIndex),
      ...tiltYBytes.map(b => b.byteIndex),
    ]);

    const statusByteIndex = findStatusByte(allPackets, excludeIndices);

    if (statusByteIndex !== null) {
      const values: Record<string, StatusValue> = {};
      statusByteValues.forEach((value, byteValue) => {
        values[byteValue.toString()] = value;
      });

      config.status = {
        byteIndex: [statusByteIndex + 1], // Convert to 1-based indexing
        type: 'code',
        values,
      };
    }
  }

  // Add tilt X if detected
  if (tiltXBytes.length > 0) {
    const tiltXIndices = tiltXBytes.map(b => b.byteIndex);
    config.tiltX = {
      byteIndex: tiltXIndices.map(i => i + 1), // Convert to 1-based indexing
      positiveMax: 127,
      negativeMin: 128,
      negativeMax: 255,
      type: 'bipolar-range',
    };
  }

  // Add tilt Y if detected
  if (tiltYBytes.length > 0) {
    const tiltYIndices = tiltYBytes.map(b => b.byteIndex);
    config.tiltY = {
      byteIndex: tiltYIndices.map(i => i + 1), // Convert to 1-based indexing
      positiveMax: 127,
      negativeMin: 128,
      negativeMax: 255,
      type: 'bipolar-range',
    };
  }

  return config;
}
