/**
 * Examples of using Config class
 * Demonstrates loading, parsing, and serializing tablet configurations
 * using the class-based API
 */

import { Config, ConfigData, MappingType } from '../models';

/**
 * Example 1: Load a configuration from a URL (static method)
 */
export async function loadConfigExample() {
  try {
    const config = await Config.load('/exampleconfigurations/xp_pen_deco_640_osx_nodriver.json');
    console.log('Loaded config:', config.name);
    console.log('Manufacturer:', config.manufacturer);
    console.log('Model:', config.model);
    return config;
  } catch (error) {
    console.error('Failed to load config:', error);
    throw error;
  }
}

/**
 * Example 2: Parse configuration from JSON string (static method)
 */
export function parseConfigExample(jsonString: string) {
  try {
    const config = Config.fromJSON(jsonString);
    console.log('Parsed config:', config.name);
    return config;
  } catch (error) {
    console.error('Failed to parse config:', error);
    throw error;
  }
}

/**
 * Example 3: Serialize configuration to JSON (instance method)
 */
export function serializeConfigExample(config: Config) {
  // Compact format (for storage/transmission)
  const compact = config.toJSON();
  console.log('Compact JSON length:', compact.length);

  // Pretty format (for display/debugging)
  const pretty = config.toJSON(true);
  console.log('Pretty JSON:\n', pretty);

  return { compact, pretty };
}

/**
 * Example 4: Create and save a custom configuration
 */
export function createCustomConfig(): Config {
  const customConfigData: ConfigData = {
    name: 'Custom Tablet',
    manufacturer: 'Custom Manufacturer',
    model: 'Custom Model 1',
    description: 'A custom tablet configuration',
    vendorId: '0xABCD',
    productId: '0x1234',
    deviceInfo: {
      vendor_id: 0xABCD,
      product_id: 0x1234,
      product_string: 'Custom Tablet',
      usage_page: 13,
      usage: 2,
      interfaces: [0, 1],
    },
    reportId: 2,
    digitizerUsagePage: 13,
    buttonInterfaceReportId: 6,
    capabilities: {
      hasButtons: true,
      buttonCount: 6,
      hasPressure: true,
      pressureLevels: 8191,
      hasTilt: true,
      resolution: {
        x: 50800,
        y: 31750,
      },
    },
    byteCodeMappings: {
      status: {
        byteIndex: [1],
        type: MappingType.CODE,
        values: {
          '192': { state: 'stylus', primaryButtonPressed: true },
          '160': { state: 'stylus', primaryButtonPressed: false },
        },
      },
      x: {
        byteIndex: [2, 3],
        max: 50800,
        type: MappingType.MULTI_BYTE_RANGE,
      },
      y: {
        byteIndex: [4, 5],
        max: 31750,
        type: MappingType.MULTI_BYTE_RANGE,
      },
      pressure: {
        byteIndex: [6, 7],
        max: 8191,
        type: MappingType.MULTI_BYTE_RANGE,
      },
      tiltX: {
        byteIndex: [8],
        positiveMax: 60,
        negativeMin: 192,
        negativeMax: 196,
        type: MappingType.BIPOLAR_RANGE,
      },
      tiltY: {
        byteIndex: [9],
        positiveMax: 60,
        negativeMin: 192,
        negativeMax: 196,
        type: MappingType.BIPOLAR_RANGE,
      },
      tabletButtons: {
        type: MappingType.BIT_FLAGS,
        buttonCount: 6,
        byteIndex: [10],
      },
    },
  };

  // Create Config instance
  const customConfig = new Config(customConfigData);
  
  // Serialize to JSON using instance method
  const json = customConfig.toJSON(true);
  console.log('Custom config created:\n', json);

  return customConfig;
}

/**
 * Example 5: Validate and modify a configuration
 */
export async function validateAndModifyConfig(url: string) {
  // Load the config using static method
  const config = await Config.load(url);
  
  // Validate it has the features we need
  if (!config.capabilities.hasPressure) {
    throw new Error('Config must support pressure sensitivity');
  }
  
  // Modify the config (e.g., update description)
  const modifiedData: ConfigData = {
    ...config,
    description: `${config.description} (Modified)`,
  };
  const modifiedConfig = new Config(modifiedData);
  
  // Serialize back to JSON using instance method
  const updatedJson = modifiedConfig.toJSON(true);
  console.log('Modified config:', updatedJson);
  
  return modifiedConfig;
}

/**
 * Example 6: Compare two configurations
 */
export async function compareConfigs(url1: string, url2: string) {
  const [config1, config2] = await Promise.all([
    Config.load(url1),
    Config.load(url2),
  ]);
  
  console.log('Comparing configs:');
  console.log(`  ${config1.name} vs ${config2.name}`);
  console.log(`  Pressure levels: ${config1.capabilities.pressureLevels} vs ${config2.capabilities.pressureLevels}`);
  console.log(`  Button count: ${config1.capabilities.buttonCount} vs ${config2.capabilities.buttonCount}`);
  console.log(`  Resolution: ${config1.capabilities.resolution.x}x${config1.capabilities.resolution.y} vs ${config2.capabilities.resolution.x}x${config2.capabilities.resolution.y}`);
  
  return { config1, config2 };
}

/**
 * Example 7: Error handling
 */
export async function errorHandlingExample() {
  // Handle network errors
  try {
    await Config.load('/nonexistent/config.json');
  } catch (error) {
    console.error('Expected error:', error);
  }
  
  // Handle invalid JSON
  try {
    Config.fromJSON('{ invalid json }');
  } catch (error) {
    console.error('Expected error:', error);
  }
  
  // Handle missing required fields
  try {
    Config.fromJSON('{"name": "Incomplete"}');
  } catch (error) {
    console.error('Expected error:', error);
  }
}

