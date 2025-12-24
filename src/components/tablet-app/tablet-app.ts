import { LitElement, html } from 'lit';
import { customElement, state, query } from 'lit/decorators.js';
import { styles } from './tablet-app.styles.js';
import '../tablet-status/tablet-status.js';
import '../drawing-canvas/drawing-canvas.js';
import { MockTabletDevice, DrawingPresets } from '../../mockbytes/index.js';
import { HIDReader } from '../../utils/hid-reader.js';
import { MappingType } from '../../models/index.js';
import type { DrawingCanvas } from '../drawing-canvas/drawing-canvas.js';

/**
 * Main application component for the tablet interface
 */
@customElement('tablet-app')
export class TabletApp extends LitElement {
  static styles = styles;

  @state()
  private connected = false;

  @state()
  private mockMode = false;

  @query('drawing-canvas')
  private drawingCanvas?: DrawingCanvas;

  private mockDevice?: MockTabletDevice;
  private mockReader?: HIDReader;
  private keyPressed = false;

  connectedCallback() {
    super.connectedCallback();
    this._setupMockDevice();
    window.addEventListener('keydown', this._handleKeyDown);
    window.addEventListener('keyup', this._handleKeyUp);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('keydown', this._handleKeyDown);
    window.removeEventListener('keyup', this._handleKeyUp);
    this._stopMockStream();
  }

  render() {
    return html`
      <div class="header">
        <h2>Tablet Controller Demo</h2>
        <p>Connect your graphics tablet and start drawing!</p>
        ${this.mockMode 
          ? html`<p class="mock-indicator">🎨 Mock Tablet Active (hold 't' key)</p>`
          : ''}
      </div>

      <div class="content">
        <div class="section">
          <h3>Device Status</h3>
          <tablet-status 
            @connection-changed="${this._handleConnectionChanged}">
          </tablet-status>
        </div>

        <div class="section">
          <h3>Drawing Canvas</h3>
          <drawing-canvas .enabled="${this.connected || this.mockMode}"></drawing-canvas>
        </div>
      </div>
    `;
  }

  private _setupMockDevice() {
    // Create mock tablet device
    this.mockDevice = new MockTabletDevice();
    
    // Create HIDReader with a basic config to parse the mock data
    const mockConfig = {
      reportId: 1,
      mappings: {
        x: { type: MappingType.MULTI_BYTE_RANGE, byteIndex: [2, 3], min: 0, max: 65535 },
        y: { type: MappingType.MULTI_BYTE_RANGE, byteIndex: [4, 5], min: 0, max: 65535 },
        pressure: { type: MappingType.MULTI_BYTE_RANGE, byteIndex: [6, 7], min: 0, max: 8191 },
        tiltX: { type: 'range', byteIndex: 8, min: 0, max: 127 },
        tiltY: { type: 'range', byteIndex: 9, min: 0, max: 127 },
        button1: { type: MappingType.BIT_FLAGS, byteIndex: 10, buttonCount: 3 }
      }
    };

    this.mockReader = new HIDReader(
      this.mockDevice as unknown as HIDDevice,
      mockConfig,
      (data) => this._handleTabletData(data)
    );
  }

  private _handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 't' && !this.keyPressed && !this.connected) {
      this.keyPressed = true;
      this._startMockStream();
    }
  };

  private _handleKeyUp = (e: KeyboardEvent) => {
    if (e.key === 't' && this.keyPressed) {
      this.keyPressed = false;
      this._stopMockStream();
    }
  };

  private async _startMockStream() {
    if (!this.mockDevice || !this.mockReader) return;
    
    this.mockMode = true;
    
    // Open the mock device and start playing a pattern
    await this.mockDevice.open();
    
    // Set up the event listener to process data through HIDReader
    this.mockDevice.addEventListener('inputreport', (dataArray: Uint8Array) => {
      // Process through HIDReader
      const processedData = this.mockReader!.processDeviceData(dataArray);
      this._handleTabletData(processedData);
    });
    
    // Play a drawing pattern (random scribble)
    this.mockDevice.playScribble();
  }

  private _stopMockStream() {
    if (!this.mockDevice) return;
    
    this.mockDevice.stop();
    this.mockMode = false;
  }

  private _handleTabletData(data: Record<string, string | number | boolean>) {
    if (!this.drawingCanvas) return;
    
    // Extract relevant data
    const x = typeof data.x === 'number' ? data.x : 0;
    const y = typeof data.y === 'number' ? data.y : 0;
    const pressure = typeof data.pressure === 'number' ? data.pressure : 0;
    
    // Pass to drawing canvas
    this.drawingCanvas.updateFromTablet(x, y, pressure);
  }

  private _handleConnectionChanged(e: CustomEvent) {
    this.connected = e.detail.connected;
    // Stop mock mode if real device connects
    if (this.connected) {
      this._stopMockStream();
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'tablet-app': TabletApp;
  }
}

