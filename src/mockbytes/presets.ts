/**
 * Preset Drawing Patterns
 * Common tablet input patterns for testing and demonstration
 */

import { Point } from './tablet-data-generator.js';

/**
 * Get preset drawing paths
 */
export const DrawingPresets = {
  /**
   * Draw a star shape
   */
  star(): Point[] {
    const points: Point[] = [];
    const centerX = 0.5;
    const centerY = 0.5;
    const outerRadius = 0.35;
    const innerRadius = 0.15;
    const numPoints = 5;

    for (let i = 0; i <= numPoints * 2; i++) {
      const angle = (i * Math.PI) / numPoints - Math.PI / 2;
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      points.push({ x, y });
    }

    // Close the star
    points.push(points[0]);
    return points;
  },

  /**
   * Draw a square
   */
  square(): Point[] {
    const margin = 0.2;
    return [
      { x: margin, y: margin },
      { x: 1 - margin, y: margin },
      { x: 1 - margin, y: 1 - margin },
      { x: margin, y: 1 - margin },
      { x: margin, y: margin },
    ];
  },

  /**
   * Draw a triangle
   */
  triangle(): Point[] {
    return [
      { x: 0.5, y: 0.2 },
      { x: 0.1, y: 0.8 },
      { x: 0.9, y: 0.8 },
      { x: 0.5, y: 0.2 },
    ];
  },

  /**
   * Draw a heart shape
   */
  heart(): Point[] {
    const points: Point[] = [];
    const numPoints = 50;

    for (let i = 0; i <= numPoints; i++) {
      const t = (i / numPoints) * Math.PI * 2;
      // Parametric heart equation
      const x = 0.5 + (16 * Math.pow(Math.sin(t), 3)) / 50;
      const y =
        0.3 +
        (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 50;
      points.push({ x, y });
    }

    return points;
  },

  /**
   * Draw a spiral
   */
  spiral(rotations = 3): Point[] {
    const points: Point[] = [];
    const numPoints = 60;
    const centerX = 0.5;
    const centerY = 0.5;

    for (let i = 0; i <= numPoints; i++) {
      const t = i / numPoints;
      const angle = t * Math.PI * 2 * rotations;
      const radius = t * 0.4;

      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      points.push({ x, y });
    }

    return points;
  },

  /**
   * Draw a sine wave
   */
  wave(): Point[] {
    const points: Point[] = [];
    const numPoints = 50;

    for (let i = 0; i <= numPoints; i++) {
      const t = i / numPoints;
      const x = t;
      const y = 0.5 + Math.sin(t * Math.PI * 4) * 0.2;
      points.push({ x, y });
    }

    return points;
  },

  /**
   * Draw the word "Hello"
   */
  hello(): Point[] {
    // Simple letter strokes
    const h1 = this.verticalLine(0.05, 0.2, 0.05, 0.8, 5);
    const h2 = this.horizontalLine(0.05, 0.5, 0.15, 0.5, 3);
    const h3 = this.verticalLine(0.15, 0.2, 0.15, 0.8, 5);

    const e = this.circle(0.25, 0.5, 0.1, 8);

    const l1 = this.verticalLine(0.35, 0.2, 0.35, 0.8, 5);
    const l2 = this.verticalLine(0.42, 0.2, 0.42, 0.8, 5);

    const o = this.circle(0.55, 0.5, 0.1, 8);

    return [...h1, ...h2, ...h3, ...e, ...l1, ...l2, ...o];
  },

  /**
   * Draw a zigzag pattern
   */
  zigzag(): Point[] {
    const points: Point[] = [];
    const numZigs = 5;

    for (let i = 0; i <= numZigs; i++) {
      const x = (i / numZigs) * 0.8 + 0.1;
      const y = i % 2 === 0 ? 0.3 : 0.7;
      points.push({ x, y });
    }

    return points;
  },

  // Helper functions for compound shapes
  verticalLine(x: number, y1: number, x2: number, y2: number, points: number): Point[] {
    const result: Point[] = [];
    for (let i = 0; i <= points; i++) {
      const t = i / points;
      result.push({ x: x + (x2 - x) * t, y: y1 + (y2 - y1) * t });
    }
    return result;
  },

  horizontalLine(x1: number, y: number, x2: number, y2: number, points: number): Point[] {
    return this.verticalLine(x1, y, x2, y2, points);
  },

  circle(cx: number, cy: number, r: number, points: number): Point[] {
    const result: Point[] = [];
    for (let i = 0; i <= points; i++) {
      const angle = (i / points) * Math.PI * 2;
      result.push({
        x: cx + Math.cos(angle) * r,
        y: cy + Math.sin(angle) * r,
      });
    }
    return result;
  },
};

/**
 * Signature-like movements for realistic testing
 */
export const SignaturePresets = {
  /**
   * Simple signature
   */
  simple(): Point[] {
    return [
      { x: 0.1, y: 0.5 },
      { x: 0.2, y: 0.4 },
      { x: 0.3, y: 0.6 },
      { x: 0.4, y: 0.4 },
      { x: 0.5, y: 0.5 },
      { x: 0.6, y: 0.6 },
      { x: 0.7, y: 0.4 },
      { x: 0.8, y: 0.5 },
    ];
  },

  /**
   * Cursive-style signature
   */
  cursive(): Point[] {
    const points: Point[] = [];
    const numPoints = 40;

    for (let i = 0; i <= numPoints; i++) {
      const t = i / numPoints;
      const x = t * 0.8 + 0.1;
      const y = 0.5 + Math.sin(t * Math.PI * 6) * 0.1 * (1 - t * 0.5);
      points.push({ x, y });
    }

    return points;
  },
};

