/**
 * Examples of using MockHIDReader
 * Demonstrates various features of the mock tablet device
 */

import { MockHIDReader } from '../utils/mock-hid-reader.js';
import { Config } from '../models/index.js';

/**
 * Example 1: Basic hover and drawing
 */
export async function basicDrawingExample(config: Config) {
  const mockReader = new MockHIDReader(
    { mappings: config.byteCodeMappings, reportId: config.reportId },
    (data) => {
      console.log('Tablet data:', {
        x: data.x,
        y: data.y,
        pressure: data.pressure,
        state: data.state,
      });
    }
  );

  await mockReader.startReading();

  // Hover to center
  console.log('Hovering to center...');
  await mockReader.hoverTo(0.5, 0.5, 500);

  // Draw a line with pressure
  console.log('Drawing a line...');
  await mockReader.drawLine(0.8, 0.8, 0.7, 1000);

  // Lift stylus
  mockReader.setState({ isContact: false, pressure: 0 });

  await mockReader.close();
}

/**
 * Example 2: Drawing shapes
 */
export async function drawingShapesExample(config: Config) {
  const mockReader = new MockHIDReader(
    { mappings: config.byteCodeMappings, reportId: config.reportId },
    (data) => {
      if (data.state === 'contact') {
        console.log(`Drawing at (${data.x}, ${data.y}) with pressure ${data.pressure}`);
      }
    }
  );

  await mockReader.startReading();

  // Draw a circle
  console.log('Drawing a circle...');
  await mockReader.drawCircle(0.5, 0.5, 0.3, 0.6, 2000);

  // Draw a square
  console.log('Drawing a square...');
  await mockReader.hoverTo(0.2, 0.2);
  await mockReader.drawLine(0.8, 0.2, 0.5, 500);
  await mockReader.drawLine(0.8, 0.8, 0.5, 500);
  await mockReader.drawLine(0.2, 0.8, 0.5, 500);
  await mockReader.drawLine(0.2, 0.2, 0.5, 500);

  await mockReader.close();
}

/**
 * Example 3: Pressure variation
 */
export async function pressureVariationExample(config: Config) {
  const mockReader = new MockHIDReader(
    { mappings: config.byteCodeMappings, reportId: config.reportId },
    (data) => {
      console.log(`Pressure: ${data.pressure}`);
    }
  );

  await mockReader.startReading();

  // Draw with varying pressure
  console.log('Drawing with pressure variation...');
  
  await mockReader.hoverTo(0.1, 0.5);
  mockReader.setState({ isContact: true });

  for (let i = 0; i <= 10; i++) {
    const pressure = i / 10; // 0.0 to 1.0
    const x = 0.1 + (i * 0.08); // Move right
    mockReader.setState({ x, pressure });
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  mockReader.setState({ isContact: false, pressure: 0 });
  await mockReader.close();
}

/**
 * Example 4: Stylus tilt simulation
 */
export async function tiltExample(config: Config) {
  const mockReader = new MockHIDReader(
    { mappings: config.byteCodeMappings, reportId: config.reportId },
    (data) => {
      console.log(`Tilt: X=${data.tiltX}, Y=${data.tiltY}`);
    }
  );

  await mockReader.startReading();

  console.log('Vertical (no tilt)...');
  await mockReader.tiltTo(0, 0, 300);

  console.log('Tilting right...');
  await mockReader.tiltTo(45, 0, 500);

  console.log('Tilting forward...');
  await mockReader.tiltTo(0, 45, 500);

  console.log('Tilting diagonally...');
  await mockReader.tiltTo(-30, 30, 500);

  console.log('Back to vertical...');
  await mockReader.tiltTo(0, 0, 300);

  await mockReader.close();
}

/**
 * Example 5: Stylus button usage
 */
export async function stylusButtonExample(config: Config) {
  const mockReader = new MockHIDReader(
    { mappings: config.byteCodeMappings, reportId: config.reportId },
    (data) => {
      if (data.primaryButtonPressed) {
        console.log('Primary stylus button pressed!');
      }
      if (data.secondaryButtonPressed) {
        console.log('Secondary stylus button pressed!');
      }
    }
  );

  await mockReader.startReading();

  // Hover and click primary button (like right-click)
  console.log('Hovering and pressing primary button...');
  await mockReader.hoverTo(0.5, 0.5);
  await mockReader.pressStylusButton(true, 200);

  await new Promise(resolve => setTimeout(resolve, 300));

  // Hover and click secondary button
  console.log('Pressing secondary button...');
  await mockReader.pressStylusButton(false, 200);

  await mockReader.close();
}

/**
 * Example 6: Tablet button presses
 */
export async function tabletButtonExample(config: Config) {
  const mockReader = new MockHIDReader(
    { mappings: config.byteCodeMappings, reportId: config.reportId },
    (data) => {
      // Check for button states
      for (let i = 1; i <= 8; i++) {
        if (data[`button${i}`]) {
          console.log(`Tablet button ${i} pressed!`);
        }
      }
    }
  );

  await mockReader.startReading();

  console.log('Pressing all 8 tablet buttons in sequence...');
  for (let i = 1; i <= 8; i++) {
    console.log(`Pressing button ${i}...`);
    await mockReader.pressTabletButton(i, 150);
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  await mockReader.close();
}

/**
 * Example 7: Complex drawing with all features
 */
export async function complexDrawingExample(config: Config) {
  const mockReader = new MockHIDReader(
    { mappings: config.byteCodeMappings, reportId: config.reportId },
    (data) => {
      console.log('Full state:', data);
    }
  );

  await mockReader.startReading();

  // Start with stylus tilted
  mockReader.setState({ tiltX: 15, tiltY: -10 });

  // Draw a spiral with varying pressure
  console.log('Drawing a spiral with varying pressure and tilt...');
  const steps = 100;
  const maxRadius = 0.3;

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const angle = t * Math.PI * 6; // 3 full rotations
    const radius = maxRadius * t;
    const x = 0.5 + Math.cos(angle) * radius;
    const y = 0.5 + Math.sin(angle) * radius;
    const pressure = 0.3 + 0.5 * Math.sin(t * Math.PI); // Vary pressure
    const tiltX = 20 * Math.cos(angle * 2);
    const tiltY = 20 * Math.sin(angle * 2);

    mockReader.setState({ 
      x, 
      y, 
      pressure, 
      isContact: true,
      tiltX,
      tiltY,
    });

    await new Promise(resolve => setTimeout(resolve, 20));
  }

  mockReader.setState({ isContact: false, pressure: 0 });
  await mockReader.close();
}

/**
 * Example 8: Interactive state control
 */
export function interactiveExample(config: Config) {
  const mockReader = new MockHIDReader(
    { mappings: config.byteCodeMappings, reportId: config.reportId },
    (data) => {
      // Data callback - you can update UI here
      console.log('Current state:', data);
    }
  );

  mockReader.startReading();

  // Return an object with control functions
  return {
    mockReader,
    
    // Move to position
    moveTo: (x: number, y: number) => {
      mockReader.setState({ x, y });
    },

    // Start/stop drawing
    startDrawing: (pressure: number = 0.5) => {
      mockReader.setState({ isContact: true, pressure });
    },
    
    stopDrawing: () => {
      mockReader.setState({ isContact: false, pressure: 0 });
    },

    // Set tilt
    setTilt: (tiltX: number, tiltY: number) => {
      mockReader.setState({ tiltX, tiltY });
    },

    // Press buttons
    pressPrimaryButton: () => mockReader.pressStylusButton(true, 100),
    pressSecondaryButton: () => mockReader.pressStylusButton(false, 100),
    pressTabletButton: (num: number) => mockReader.pressTabletButton(num, 100),

    // Cleanup
    close: () => mockReader.close(),
  };
}

/**
 * Example 9: Performance testing
 */
export async function performanceTestExample(config: Config) {
  let dataCount = 0;
  const startTime = Date.now();

  const mockReader = new MockHIDReader(
    { mappings: config.byteCodeMappings, reportId: config.reportId },
    () => {
      dataCount++;
    }
  );

  // Set high update rate
  mockReader.setState({ updateInterval: 8 }); // ~120Hz

  await mockReader.startReading();

  // Let it run for 5 seconds
  await new Promise(resolve => setTimeout(resolve, 5000));

  const elapsed = (Date.now() - startTime) / 1000;
  const rate = dataCount / elapsed;

  console.log(`Processed ${dataCount} reports in ${elapsed.toFixed(2)}s`);
  console.log(`Average rate: ${rate.toFixed(1)} reports/second`);

  await mockReader.close();
}


