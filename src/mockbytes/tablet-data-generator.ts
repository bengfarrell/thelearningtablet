/**
 * Tablet Data Generator
 * Generates realistic mock HID data packets that simulate drawing on a graphics tablet
 * 
 * @module mockbytes
 */

export interface Point {
  x: number;
  y: number;
}

export interface TabletDataPacket {
  reportId: number;
  status: number;
  x: number;
  y: number;
  pressure: number;
  tiltX: number;
  tiltY: number;
  buttons: number;
}

export interface DrawingPath {
  points: Point[];
  pressure: number[];
  timestamp: number[];
}

export interface GeneratorConfig {
  maxX: number;
  maxY: number;
  reportId: number;
  statusByte: number;
  sampleRate: number; // Hz (samples per second)
  pressureVariation: number; // 0-1, amount of pressure variation
}

/**
 * Generates realistic tablet data packets for testing
 */
export class TabletDataGenerator {
  private config: GeneratorConfig;
  private defaultConfig: GeneratorConfig = {
    maxX: 16000,      // Match XP-Pen Deco 640 X resolution
    maxY: 9000,       // Match XP-Pen Deco 640 Y resolution
    reportId: 2,
    statusByte: 0xa0, // Stylus mode
    sampleRate: 200,  // 200 Hz
    pressureVariation: 0.2,
  };

  constructor(config?: Partial<GeneratorConfig>) {
    this.config = { ...this.defaultConfig, ...config };
  }

  /**
   * Generate a single data packet
   */
  generatePacket(x: number, y: number, pressure: number, tiltX = 0, tiltY = 0, statusByteOverride?: number): Uint8Array {
    // Normalize coordinates to device range
    const normalizedX = Math.round((x / 1.0) * this.config.maxX);
    const normalizedY = Math.round((y / 1.0) * this.config.maxY);
    // Pressure is 2-byte (0-16383) to match XP-Pen Deco 640
    const normalizedPressure = Math.round((pressure / 1.0) * 16383);

    // Convert tilt to byte range (-1 to 1 becomes 0-255)
    const tiltXByte = Math.round(((tiltX + 1) / 2) * 255);
    const tiltYByte = Math.round(((tiltY + 1) / 2) * 255);

    // Create HID packet matching XP-Pen Deco 640 structure
    const packet = new Uint8Array(10);
    packet[0] = this.config.reportId;           // Report ID
    packet[1] = statusByteOverride ?? this.config.statusByte; // Status byte (stylus mode or override)
    packet[2] = normalizedX & 0xff;             // X low byte
    packet[3] = (normalizedX >> 8) & 0xff;      // X high byte
    packet[4] = normalizedY & 0xff;             // Y low byte
    packet[5] = (normalizedY >> 8) & 0xff;      // Y high byte
    packet[6] = normalizedPressure & 0xff;      // Pressure low byte
    packet[7] = (normalizedPressure >> 8) & 0xff; // Pressure high byte
    packet[8] = tiltXByte;                      // Tilt X
    packet[9] = tiltYByte;                      // Tilt Y

    return packet;
  }

  /**
   * Generate a stream of packets following a path
   */
  *generatePath(path: Point[], duration: number): Generator<Uint8Array> {
    const totalSamples = Math.floor((duration / 1000) * this.config.sampleRate);
    const samplesPerPoint = Math.max(1, Math.floor(totalSamples / (path.length - 1)));

    for (let i = 0; i < path.length - 1; i++) {
      const start = path[i];
      const end = path[i + 1];

      // Interpolate between points
      for (let j = 0; j < samplesPerPoint; j++) {
        const t = j / samplesPerPoint;
        const x = start.x + (end.x - start.x) * t;
        const y = start.y + (end.y - start.y) * t;

        // Simulate realistic pressure variation
        const basePressure = this.calculatePressure(t, i / path.length);
        const pressure = this.addPressureVariation(basePressure);

        // Simulate subtle tilt based on direction
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const tiltX = Math.max(-1, Math.min(1, dx * 0.3));
        const tiltY = Math.max(-1, Math.min(1, dy * 0.3));

        yield this.generatePacket(x, y, pressure, tiltX, tiltY);
      }
    }
  }

  /**
   * Generate a circular drawing motion
   */
  *generateCircle(
    centerX: number,
    centerY: number,
    radius: number,
    duration: number
  ): Generator<Uint8Array> {
    const totalSamples = Math.floor((duration / 1000) * this.config.sampleRate);

    for (let i = 0; i < totalSamples; i++) {
      const t = i / totalSamples;
      const angle = t * Math.PI * 2;

      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      const pressure = this.calculatePressure(t, 0);

      // Tilt follows the drawing direction
      const tiltX = Math.cos(angle + Math.PI / 2) * 0.3;
      const tiltY = Math.sin(angle + Math.PI / 2) * 0.3;

      yield this.generatePacket(x, y, pressure, tiltX, tiltY);
    }
  }

  /**
   * Generate a straight line
   */
  *generateLine(
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    duration: number
  ): Generator<Uint8Array> {
    const path = [
      { x: startX, y: startY },
      { x: endX, y: endY },
    ];
    yield* this.generatePath(path, duration);
  }

  /**
   * Generate a signature-like scribble
   */
  *generateScribble(
    startX: number,
    startY: number,
    width: number,
    height: number,
    duration: number
  ): Generator<Uint8Array> {
    const points: Point[] = [];
    const numPoints = 20;

    // Generate random but smooth path
    for (let i = 0; i < numPoints; i++) {
      const t = i / (numPoints - 1);
      const x = startX + Math.sin(t * Math.PI * 4) * width * 0.5 + width * t;
      const y = startY + Math.cos(t * Math.PI * 3) * height * 0.5 + height * 0.5;
      points.push({ x, y });
    }

    yield* this.generatePath(points, duration);
  }

  /**
   * Generate a bezier curve
   */
  *generateBezier(
    start: Point,
    control1: Point,
    control2: Point,
    end: Point,
    duration: number
  ): Generator<Uint8Array> {
    const points: Point[] = [];
    const numPoints = 30;

    for (let i = 0; i <= numPoints; i++) {
      const t = i / numPoints;
      const point = this.bezierPoint(t, start, control1, control2, end);
      points.push(point);
    }

    yield* this.generatePath(points, duration);
  }

  /**
   * Calculate realistic pressure based on position in stroke
   */
  private calculatePressure(t: number, strokeProgress: number): number {
    // Pressure starts low, builds up, then tapers off
    let pressure: number;

    if (t < 0.1) {
      // Ramp up at start
      pressure = t / 0.1 * 0.7;
    } else if (t > 0.9) {
      // Taper off at end
      pressure = (1 - t) / 0.1 * 0.7;
    } else {
      // Full pressure in middle
      pressure = 0.7 + Math.sin(strokeProgress * Math.PI * 2) * 0.2;
    }

    return Math.max(0, Math.min(1, pressure));
  }

  /**
   * Add realistic pressure variation
   */
  private addPressureVariation(basePressure: number): number {
    const variation = (Math.random() - 0.5) * this.config.pressureVariation;
    return Math.max(0, Math.min(1, basePressure + variation));
  }

  /**
   * Calculate point on cubic bezier curve
   */
  private bezierPoint(t: number, p0: Point, p1: Point, p2: Point, p3: Point): Point {
    const u = 1 - t;
    const tt = t * t;
    const uu = u * u;
    const uuu = uu * u;
    const ttt = tt * t;

    const x = uuu * p0.x + 3 * uu * t * p1.x + 3 * u * tt * p2.x + ttt * p3.x;
    const y = uuu * p0.y + 3 * uu * t * p1.y + 3 * u * tt * p2.y + ttt * p3.y;

    return { x, y };
  }

  /**
   * Generate hover data (pen near surface but not touching)
   */
  generateHoverPacket(x: number, y: number): Uint8Array {
    return this.generatePacket(x, y, 0, 0, 0);
  }

  /**
   * Generate a hover line (no pressure)
   */
  *generateHoverLine(
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    duration: number
  ): Generator<Uint8Array> {
    const totalSamples = Math.floor((duration / 1000) * this.config.sampleRate);

    for (let i = 0; i < totalSamples; i++) {
      const t = i / totalSamples;
      const x = startX + (endX - startX) * t;
      const y = startY + (endY - startY) * t;

      yield this.generateHoverPacket(x, y);
    }
  }

  /**
   * Generate a line with X tilt variation (tilt goes from -1 to +1)
   */
  *generateTiltXLine(
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    duration: number
  ): Generator<Uint8Array> {
    const totalSamples = Math.floor((duration / 1000) * this.config.sampleRate);

    for (let i = 0; i < totalSamples; i++) {
      const t = i / totalSamples;
      const x = startX + (endX - startX) * t;
      const y = startY + (endY - startY) * t;

      // Tilt X varies from -1 to +1 as we move across
      const tiltX = (t * 2) - 1; // Maps 0->1 to -1->+1
      const pressure = 0.7; // Moderate constant pressure

      yield this.generatePacket(x, y, pressure, tiltX, 0);
    }
  }

  /**
   * Generate a line with Y tilt variation (tilt goes from -1 to +1)
   */
  *generateTiltYLine(
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    duration: number
  ): Generator<Uint8Array> {
    const totalSamples = Math.floor((duration / 1000) * this.config.sampleRate);

    for (let i = 0; i < totalSamples; i++) {
      const t = i / totalSamples;
      const x = startX + (endX - startX) * t;
      const y = startY + (endY - startY) * t;

      // Tilt Y varies from -1 to +1 as we move across
      const tiltY = (t * 2) - 1; // Maps 0->1 to -1->+1
      const pressure = 0.7; // Moderate constant pressure

      yield this.generatePacket(x, y, pressure, 0, tiltY);
    }
  }

  /**
   * Generate a line with primary button pressed (contact)
   * Status byte: 0xa5 (165) = contact + primary button
   */
  *generatePrimaryButtonLine(
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    duration: number
  ): Generator<Uint8Array> {
    const totalSamples = Math.floor((duration / 1000) * this.config.sampleRate);

    for (let i = 0; i < totalSamples; i++) {
      const t = i / totalSamples;
      const x = startX + (endX - startX) * t;
      const y = startY + (endY - startY) * t;

      const pressure = 0.7; // Moderate constant pressure

      // Status byte 0xa5 (165) = contact + primary button pressed
      yield this.generatePacket(x, y, pressure, 0, 0, 0xa5);
    }
  }

  /**
   * Generate a line with secondary button pressed (contact)
   * Status byte: 0xa3 (163) = contact + secondary button
   */
  *generateSecondaryButtonLine(
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    duration: number
  ): Generator<Uint8Array> {
    const totalSamples = Math.floor((duration / 1000) * this.config.sampleRate);

    for (let i = 0; i < totalSamples; i++) {
      const t = i / totalSamples;
      const x = startX + (endX - startX) * t;
      const y = startY + (endY - startY) * t;

      const pressure = 0.7; // Moderate constant pressure

      // Status byte 0xa3 (163) = contact + secondary button pressed
      yield this.generatePacket(x, y, pressure, 0, 0, 0xa3);
    }
  }

  /**
   * Generate button press packet
   */
  generateButtonPacket(buttonNumber: number): Uint8Array {
    const packet = new Uint8Array(8);
    packet[0] = this.config.reportId;
    packet[1] = 0x02; // Button mode status
    packet[2] = 0;
    packet[3] = 0;
    packet[4] = 0;
    packet[5] = 0;
    packet[6] = 0;
    packet[7] = 1 << (buttonNumber - 1); // Set button bit

    return packet;
  }
}

/**
 * Convenience function to create common drawing patterns
 */
export function createDrawingPattern(
  pattern: 'circle' | 'line' | 'scribble' | 'spiral',
  config?: Partial<GeneratorConfig>
): Generator<Uint8Array> {
  const generator = new TabletDataGenerator(config);

  switch (pattern) {
    case 'circle':
      return generator.generateCircle(0.5, 0.5, 0.3, 2000);
    case 'line':
      return generator.generateLine(0.1, 0.1, 0.9, 0.9, 1000);
    case 'scribble':
      return generator.generateScribble(0.1, 0.4, 0.8, 0.2, 3000);
    case 'spiral':
      return createSpiral(generator);
    default:
      return generator.generateCircle(0.5, 0.5, 0.3, 2000);
  }
}

/**
 * Generate a spiral pattern
 */
function* createSpiral(generator: TabletDataGenerator): Generator<Uint8Array> {
  const points: Point[] = [];
  const numPoints = 50;
  const centerX = 0.5;
  const centerY = 0.5;

  for (let i = 0; i < numPoints; i++) {
    const t = i / numPoints;
    const angle = t * Math.PI * 6;
    const radius = t * 0.4;

    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;
    points.push({ x, y });
  }

  yield* generator.generatePath(points, 4000);
}

