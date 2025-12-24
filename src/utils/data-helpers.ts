/**
 * Data parsing helper functions for HID device data
 */

import { MappingType } from '../models/index.js';

/**
 * Parse a code value from a specific byte index and return the corresponding value
 */
export function parseCode(
  data: number[],
  byteIndex: number,
  values: Record<string, any>
): any {
  if (byteIndex >= data.length) {
    return null;
  }
  
  const byteValue = String(data[byteIndex]);
  return values[byteValue] || byteValue;
}

/**
 * Parse a range value (0-255) to a normalized value (0-1)
 */
export function parseRangeData(
  data: number[],
  byteIndex: number,
  min: number,
  max: number
): number {
  if (byteIndex >= data.length) {
    return 0;
  }
  
  const value = data[byteIndex];
  if (min === max) {
    return 0;
  }
  
  return (value - min) / (max - min);
}

/**
 * Parse a multi-byte range value to a normalized value (0-1)
 */
export function parseMultiByteRangeData(
  data: number[],
  byteIndices: number[],
  min: number,
  max: number,
  _key?: string
): number {
  // Combine bytes into a single value (little-endian)
  let value = 0;
  for (let i = 0; i < byteIndices.length; i++) {
    const byteIndex = byteIndices[i];
    if (byteIndex >= data.length) {
      return 0;
    }
    value += data[byteIndex] << (i * 8);
  }
  
  if (min === max) {
    return 0;
  }
  
  return (value - min) / (max - min);
}

/**
 * Parse a bipolar range value (e.g., tilt that can be positive or negative)
 */
export function parseBipolarRangeData(
  data: number[],
  byteIndex: number,
  positiveMin: number,
  positiveMax: number,
  negativeMin: number,
  negativeMax: number
): number {
  if (byteIndex >= data.length) {
    return 0;
  }
  
  const value = data[byteIndex];
  
  // Check if value is in positive range
  if (value >= positiveMin && value <= positiveMax) {
    if (positiveMax === positiveMin) {
      return 0;
    }
    return (value - positiveMin) / (positiveMax - positiveMin);
  }
  
  // Check if value is in negative range
  if (value >= negativeMin && value <= negativeMax) {
    if (negativeMax === negativeMin) {
      return 0;
    }
    return -((value - negativeMin) / (negativeMax - negativeMin));
  }
  
  return 0;
}

/**
 * Parse bit flags from a byte (e.g., for button states)
 */
export function parseBitFlags(
  data: number[],
  byteIndex: number,
  buttonCount: number
): Record<string, boolean> {
  const result: Record<string, boolean> = {};
  
  if (byteIndex >= data.length) {
    return result;
  }
  
  const bits = data[byteIndex];
  
  for (let i = 0; i < buttonCount; i++) {
    const buttonNum = i + 1;
    result[`button${buttonNum}`] = (bits & (1 << i)) !== 0;
  }
  
  return result;
}

/**
 * Process raw device data according to configuration byte code mappings
 * 
 * @param data - Raw HID device data as Uint8Array
 * @param mappings - Configuration mappings defining how to interpret the data
 * @returns Processed data as key-value pairs
 * 
 * @example
 * const result = processDeviceData(rawData, config.byteCodeMappings);
 * console.log(result.x, result.y, result.pressure);
 */
export function processDeviceData(
  data: Uint8Array,
  mappings: Record<string, any>
): Record<string, string | number | boolean> {
  // Convert Uint8Array to number array
  const dataList = Array.from(data);
  const result: Record<string, string | number | boolean> = {};

  // Check Report ID
  const reportId = dataList.length > 0 ? dataList[0] : 0;
  const isButtonInterface = reportId === 6;  // Report ID 6 is button-only interface

  // Parse the status to determine device state
  let deviceState: string | null = null;
  for (const [key, mapping] of Object.entries(mappings)) {
    if (mapping.type === MappingType.CODE) {
      const byteIndex = mapping.byteIndex ?? 0;
      if (byteIndex < dataList.length) {
        const codeResult = parseCode(dataList, byteIndex, mapping.values ?? []);
        if (typeof codeResult === 'object' && codeResult !== null) {
          Object.assign(result, codeResult);
          deviceState = codeResult.state ?? null;
        } else {
          result[key] = codeResult;
        }
        break;
      }
    }
  }

  // Process remaining mappings based on device state
  for (const [key, mapping] of Object.entries(mappings)) {
    const mappingType = mapping.type;
    const byteIndex = mapping.byteIndex ?? 0;

    // Skip if already processed (status/code), unless it's tabletButtons with code type
    if (mappingType === MappingType.CODE && key !== 'tabletButtons') {
      continue;
    }

    // Handle tabletButtons with code type (custom value mapping)
    if (key === 'tabletButtons' && mappingType === MappingType.CODE) {
      // ONLY process button codes from the button interface (Report ID 6)
      if (isButtonInterface) {
        if (byteIndex < dataList.length) {
          const byteValue = String(dataList[byteIndex]);
          const valuesMap = mapping.values ?? {};
          if (byteValue in valuesMap) {
            const buttonNum = valuesMap[byteValue].button;
            if (buttonNum) {
              // Set only this button as pressed
              const buttonCount = mapping.buttonCount ?? 8;
              for (let i = 1; i <= buttonCount; i++) {
                result[`button${i}`] = i === buttonNum;
              }
            }
          }
        }
      }
      continue;
    }

    // Skip button parsing if not in button mode (unless we're on button-only interface)
    if (mappingType === MappingType.BIT_FLAGS && deviceState !== 'buttons' && !isButtonInterface) {
      continue;
    }

    // Skip coordinate/pressure/tilt parsing if on button-only interface or in button mode
    if ((isButtonInterface || deviceState === 'buttons') && 
        ['x', 'y', 'pressure', 'tiltX', 'tiltY'].includes(key)) {
      continue;
    }

    // Skip validation for multi-byte-range as it uses byteIndices instead
    if (mappingType !== MappingType.MULTI_BYTE_RANGE && byteIndex >= dataList.length) {
      continue;
    }

    if (mappingType === 'range') {
      result[key] = parseRangeData(
        dataList,
        byteIndex,
        mapping.min ?? 0,
        mapping.max ?? 0
      );
    } else if (mappingType === MappingType.MULTI_BYTE_RANGE) {
      // Use byteIndex (standardized to always be an array)
      const byteIndices = Array.isArray(byteIndex) ? byteIndex : [byteIndex];
      // Validate all indices are within bounds
      if (byteIndices.every((idx: number) => idx < dataList.length)) {
        result[key] = parseMultiByteRangeData(
          dataList,
          byteIndices,
          mapping.min ?? 0,
          mapping.max ?? 0,
          key  // Pass the key name for debug logging
        );
      }
    } else if (mappingType === MappingType.BIPOLAR_RANGE) {
      result[key] = parseBipolarRangeData(
        dataList,
        byteIndex,
        mapping.positiveMin ?? 0,
        mapping.positiveMax ?? 0,
        mapping.negativeMin ?? 0,
        mapping.negativeMax ?? 0
      );
    } else if (mappingType === MappingType.BIT_FLAGS) {
      const buttonStates = parseBitFlags(
        dataList,
        byteIndex,
        mapping.buttonCount ?? 8
      );
      Object.assign(result, buttonStates);
    }
  }

  return result;
}

