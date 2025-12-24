/**
 * Basic Usage Examples for Mock Tablet
 */

import { MockTabletDevice, TabletDataGenerator, DrawingPresets } from '../../mockbytes/index.js';
import { MappingType } from '../../models/index.js';

/**
 * Example 1: Simple circle drawing
 */
export async function simpleCircle() {
  const mockTablet = new MockTabletDevice();
  await mockTablet.open();

  // Listen for data
  mockTablet.addEventListener('inputreport', (data: Uint8Array) => {
    console.log('X:', (data[3] << 8) | data[2]);
    console.log('Y:', (data[5] << 8) | data[4]);
    console.log('Pressure:', data[6]);
  });

  // Draw a circle
  mockTablet.playCircle(0.5, 0.5, 0.3, 2000);
}

/**
 * Example 2: Drawing with presets
 */
export async function drawPresets() {
  const mockTablet = new MockTabletDevice();
  const generator = new TabletDataGenerator();

  await mockTablet.open();

  // Draw a star
  const starPath = DrawingPresets.star();
  mockTablet.playPath(starPath, 3000);

  // After star is done, draw a heart
  setTimeout(() => {
    const heartPath = DrawingPresets.heart();
    mockTablet.playPath(heartPath, 4000);
  }, 3500);
}

/**
 * Example 3: Custom drawing path
 */
export async function customPath() {
  const mockTablet = new MockTabletDevice();
  await mockTablet.open();

  // Draw initials "ABC"
  const points = [
    // Letter A
    { x: 0.1, y: 0.8 },
    { x: 0.15, y: 0.2 },
    { x: 0.2, y: 0.8 },
    { x: 0.1, y: 0.5 },
    { x: 0.2, y: 0.5 },
    // Move to B
    { x: 0.3, y: 0.2 },
    { x: 0.3, y: 0.8 },
    { x: 0.4, y: 0.8 },
    { x: 0.4, y: 0.5 },
    { x: 0.3, y: 0.5 },
    // Move to C
    { x: 0.55, y: 0.2 },
    { x: 0.5, y: 0.2 },
    { x: 0.5, y: 0.8 },
    { x: 0.55, y: 0.8 },
  ];

  mockTablet.playPath(points, 5000);
}

/**
 * Example 4: Interactive control
 */
export async function interactiveDrawing() {
  const mockTablet = new MockTabletDevice();
  await mockTablet.open();

  let packetCount = 0;
  mockTablet.addEventListener('inputreport', () => {
    packetCount++;
  });

  // Start drawing
  mockTablet.playCircle();

  // Check status
  setInterval(() => {
    console.log('Playing:', mockTablet.playing);
    console.log('Packets received:', packetCount);
  }, 500);

  // Stop after 3 seconds
  setTimeout(() => {
    mockTablet.stop();
    console.log('Stopped. Total packets:', packetCount);
  }, 3000);
}

/**
 * Example 5: Testing pressure sensitivity
 */
export async function testPressure() {
  const generator = new TabletDataGenerator();

  // Generate packets with varying pressure
  for (let i = 0; i <= 10; i++) {
    const pressure = i / 10; // 0.0 to 1.0
    const packet = generator.generatePacket(0.5, 0.5, pressure);

    console.log(`Pressure ${pressure.toFixed(1)}: byte value = ${packet[6]}`);
  }
}

/**
 * Example 6: Integration with HIDReader
 */
export async function withHIDReader() {
  // Import HIDReader from your source
  // import { HIDReader } from '../../src/hid-reader.js';

  const mockTablet = new MockTabletDevice();
  await mockTablet.open();

  const mappings = {
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
  };

  // Create HIDReader with mock device
  // const reader = new HIDReader(
  //   mockTablet as any,
  //   { mappings, reportId: 2 },
  //   (data) => {
  //     console.log('Processed:', data);
  //   }
  // );

  // await reader.startReading();
  mockTablet.playCircle();
}

