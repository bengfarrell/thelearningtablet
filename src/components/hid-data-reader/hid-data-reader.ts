import { LitElement, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { styles } from './hid-data-reader.styles.js';
import { MockTabletDevice, DrawingPresets } from '../../mockbytes/index.js';
import { DeviceFinder, type DeviceConnectionResult } from '../../utils/finddevice.js';

type WalkthroughStep = 'idle' | 'step1-horizontal' | 'step2-vertical' | 'step3-pressure' | 'step4-hover-horizontal' | 'step5-hover-vertical' | 'step6-tilt-x' | 'step7-tilt-y' | 'step8-primary-button' | 'step9-secondary-button' | 'complete';

interface ByteAnalysis {
  byteIndex: number;
  min: number;
  max: number;
  variance: number;
}

interface CoordinateConfig {
  byteIndex: number[];
  max: number;
  type: 'multi-byte-range';
}

interface TiltConfig {
  byteIndex: number[];
  positiveMax: number;
  negativeMin: number;
  negativeMax: number;
  type: 'bipolar-range';
}

interface StatusValue {
  state: string;
  primaryButtonPressed?: boolean;
  secondaryButtonPressed?: boolean;
}

interface StatusConfig {
  byteIndex: number[];
  type: 'code';
  values: Record<string, StatusValue>;
}

interface DeviceByteCodeMappings {
  status?: StatusConfig;
  x: CoordinateConfig;
  y: CoordinateConfig;
  pressure: CoordinateConfig;
  tiltX?: TiltConfig;
  tiltY?: TiltConfig;
}

/**
 * HID Data Reader component for visualizing raw HID bytes
 * Shows raw byte data from mock tablet gestures
 */
@customElement('hid-data-reader')
export class HidDataReader extends LitElement {
  static styles = styles;

  @state()
  private isPlaying = false;

  @state()
  private currentGesture = '';

  @state()
  private currentBytes = '';

  @state()
  private byteCount = 0;

  @state()
  private walkthroughStep: WalkthroughStep = 'idle';

  @state()
  private horizontalBytes: ByteAnalysis[] = [];

  @state()
  private verticalBytes: ByteAnalysis[] = [];

  @state()
  private hoverHorizontalBytes: ByteAnalysis[] = [];

  @state()
  private hoverVerticalBytes: ByteAnalysis[] = [];

  @state()
  private pressureBytes: ByteAnalysis[] = [];

  @state()
  private tiltXBytes: ByteAnalysis[] = [];

  @state()
  private tiltYBytes: ByteAnalysis[] = [];

  @state()
  private deviceConfig: DeviceByteCodeMappings | null = null;

  @state()
  private isRealDevice = false;

  @state()
  private realDeviceName = '';

  @state()
  private isConnecting = false;

  @state()
  private deviceDataStreams: Map<number, { lastPacket: string; packetCount: number; lastUpdate: number }> = new Map();

  private mockDevice?: MockTabletDevice;
  private realDevice?: HIDDevice;
  private realDevices: HIDDevice[] = [];
  private deviceFinder?: DeviceFinder;
  private capturedPackets: Uint8Array[] = [];
  private lastCapturedPackets: Uint8Array[] = []; // Persists between steps for live view
  private isCapturing = false;

  // Track observed status byte values
  private statusByteValues: Map<number, StatusValue> = new Map();

  // Track which devices sent data during walkthrough
  private activeDeviceIndices: Set<number> = new Set();

  connectedCallback() {
    super.connectedCallback();
    this._setupMockDevice();
    this._setupDeviceFinder();
    this._checkForRealDevice();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._stopGesture();
    this._disconnectRealDevice();
  }

  render() {
    return html`
      <div class="header">
        <h2>HID Data Reader</h2>
        <p>Visualize raw HID bytes from ${this.isRealDevice ? 'real' : 'mock'} tablet</p>
        ${this._renderDeviceStatus()}
      </div>

      <div class="content">
        ${this._renderWalkthrough()}

        ${this.isRealDevice && this.deviceDataStreams.size > 0
          ? this._renderDeviceStreams()
          : this._renderMockDeviceStream()
        }
      </div>
    `;
  }

  private _renderDeviceStatus() {
    return html`
      <div class="device-status">
        ${this.isRealDevice
          ? html`
              <div class="status-badge connected">
                <span class="status-icon">✓</span>
                <span>Connected: ${this.realDeviceName}</span>
                ${this.realDevice?.opened
                  ? html`<span class="status-detail">• Opened</span>`
                  : html`<span class="status-detail warning">• Not Opened</span>`}
              </div>
              <button class="button small disconnect" @click="${this._disconnectRealDevice}">
                Disconnect
              </button>
            `
          : html`
              <button
                class="button small connect"
                ?disabled="${this.isConnecting}"
                @click="${this._connectRealDevice}">
                ${this.isConnecting ? '⏳ Connecting...' : '🔌 Connect Real Tablet'}
              </button>
            `}
      </div>
    `;
  }

  private _renderDeviceStreams() {
    const streams = Array.from(this.deviceDataStreams.entries());
    const activeStreams = streams.filter(([_, stream]) => stream.packetCount > 0);
    const hasActiveStreams = activeStreams.length > 0;

    return html`
      <div class="section">
        <h3>Device Interfaces</h3>

        <!-- Minimal device list -->
        <div class="device-list-minimal">
          <div class="device-list-header">
            <span class="device-count">${streams.length} interface${streams.length !== 1 ? 's' : ''} detected</span>
          </div>
          <div class="device-chips">
            ${streams.map(([index, stream]) => {
              const isActive = stream.packetCount > 0;
              const device = this.realDevices[index];
              const collection = device?.collections[0];
              const isDigitizer = collection?.usagePage === 13 && collection?.usage === 2;

              return html`
                <div class="device-chip ${isActive ? 'active' : 'inactive'}">
                  <span class="chip-icon">${isActive ? '✅' : '⚪'}</span>
                  <span class="chip-label">Device ${index}</span>
                  ${isDigitizer ? html`<span class="chip-badge">Pen</span>` : ''}
                  ${isActive ? html`<span class="chip-count">${stream.packetCount}</span>` : ''}
                </div>
              `;
            })}
          </div>
        </div>

        <!-- Active device streams (full detail) -->
        ${hasActiveStreams ? html`
          <div class="active-streams-section">
            <h4>Active Data Stream${activeStreams.length !== 1 ? 's' : ''}</h4>
            <div class="device-streams-list">
              ${activeStreams.map(([index, stream]) => {
                const device = this.realDevices[index];
                const collection = device?.collections[0];

                return html`
                  <div class="device-stream-panel active">
                    <div class="stream-header">
                      <div class="stream-title-row">
                        <span class="stream-title">
                          ✅ Device ${index}
                          <span class="badge active-badge">ACTIVE</span>
                        </span>
                        <span class="stream-count">${stream.packetCount} packets</span>
                      </div>
                      ${device ? html`
                        <div class="stream-metadata">
                          <span class="metadata-item">
                            <span class="metadata-label">Usage Page:</span>
                            <span class="metadata-value">${collection?.usagePage || 'N/A'}</span>
                          </span>
                          <span class="metadata-item">
                            <span class="metadata-label">Usage:</span>
                            <span class="metadata-value">${collection?.usage || 'N/A'}</span>
                          </span>
                          ${collection?.usagePage === 13 && collection?.usage === 2
                            ? html`<span class="metadata-badge digitizer">Digitizer - Pen</span>`
                            : ''}
                        </div>
                      ` : ''}
                    </div>
                    <div class="stream-byte-display">
                      <div class="byte-packet">
                        <span class="packet-label">Latest Packet:</span>
                        <span class="packet-bytes">${stream.lastPacket}</span>
                      </div>
                    </div>
                  </div>
                `;
              })}
            </div>
          </div>
        ` : html`
          <p class="info-message">
            ℹ️ Move your stylus over the tablet to see which device interface sends data.
          </p>
        `}
      </div>
    `;
  }

  private _renderMockDeviceStream() {
    return html`
      <div class="section">
        <h3>Raw Byte Stream</h3>
        <div class="device-stream-panel active">
          <div class="stream-header">
            <div class="stream-title-row">
              <span class="stream-title">🤖 Mock Device</span>
              <span class="stream-count">${this.byteCount} packets</span>
            </div>
          </div>
          <div class="stream-byte-display">
            ${this.currentBytes === ''
              ? html`<p class="empty-message">No data yet. Click a gesture button to start.</p>`
              : html`
                  <div class="byte-packet">
                    <span class="packet-label">Latest Packet:</span>
                    <span class="packet-bytes">${this.currentBytes}</span>
                  </div>
                `}
          </div>
        </div>
      </div>
    `;
  }

  private _renderActiveDeviceInfo() {
    if (this.activeDeviceIndices.size === 0) return '';

    const activeDevices = Array.from(this.activeDeviceIndices).map(index => {
      const device = this.realDevices[index];
      if (!device) return null;

      const collection = device.collections[0];
      return {
        index,
        usagePage: collection?.usagePage,
        usage: collection?.usage,
        opened: device.opened
      };
    }).filter(d => d !== null);

    if (activeDevices.length === 0) return '';

    return html`
      <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid rgba(0,0,0,0.1);">
        ${activeDevices.map(device => html`
          <div style="font-size: 13px; margin-top: 5px;">
            <strong>Device ${device.index}:</strong>
            Usage Page ${device.usagePage}, Usage ${device.usage}
            ${device.usagePage === 13 && device.usage === 2 ? html`<span style="color: #2e7d32;"> (Digitizer - Pen)</span>` : ''}
          </div>
        `)}
      </div>
    `;
  }

  private _renderWalkthrough() {
    if (this.walkthroughStep === 'idle') {
      return html`
        <div class="section walkthrough">
          <h3>📚 Byte Discovery Walkthrough</h3>
          <p>Learn which bytes in the HID data represent X and Y coordinates.</p>
          ${this.isRealDevice
            ? html`
                <p class="info-message">
                  ℹ️ Real device connected! Follow the walkthrough steps and perform the gestures on your tablet.
                </p>
              `
            : html`
                <p class="info-message">
                  🤖 Using mock device. The walkthrough will simulate gestures automatically.
                </p>
              `}
          <button class="button primary" @click="${this._startWalkthrough}">
            Start Walkthrough
          </button>
        </div>
      `;
    }

    if (this.walkthroughStep === 'step1-horizontal') {
      return html`
        <div class="section walkthrough active">
          <h3>Step 1: Horizontal Movement (Contact)</h3>
          ${this.isRealDevice
            ? html`
                <p>✏️ <strong>Drag your stylus horizontally across the tablet</strong> (left to right).</p>
                <p>This will help us identify which bytes represent the <strong>X coordinate</strong>.</p>
              `
            : html`
                <p>Click the button below to simulate dragging across the tablet horizontally.</p>
                <p>This will help us identify which bytes represent the <strong>X coordinate</strong>.</p>
              `}
          ${this._renderStepButtons('horizontal', 'Simulate Input')}
          ${this._renderLiveAnalysis()}
          <div class="walkthrough-progress">
            <div class="progress-step active">1. H-Contact</div>
            <div class="progress-step">2. V-Contact</div>
            <div class="progress-step">3. H-Hover</div>
            <div class="progress-step">4. V-Hover</div>
            <div class="progress-step">5. Tilt-X</div>
            <div class="progress-step">6. Tilt-Y</div>
            <div class="progress-step">7. Primary Btn</div>
            <div class="progress-step">8. Secondary Btn</div>
            <div class="progress-step">9. Results</div>
          </div>
        </div>
      `;
    }

    if (this.walkthroughStep === 'step2-vertical') {
      return html`
        <div class="section walkthrough active">
          <h3>Step 2: Vertical Movement (Contact)</h3>
          ${this.isRealDevice
            ? html`
                <p>✏️ <strong>Drag your stylus vertically across the tablet</strong> (top to bottom).</p>
                <p>This will help us identify which bytes represent the <strong>Y coordinate</strong>.</p>
              `
            : html`
                <p>Click the button below to simulate dragging across the tablet vertically.</p>
                <p>This will help us identify which bytes represent the <strong>Y coordinate</strong>.</p>
              `}
          ${this._renderStepButtons('vertical', 'Simulate Input')}
          ${this._renderLiveAnalysis()}
          ${this._renderAccumulatedResults()}
          <div class="walkthrough-progress">
            <div class="progress-step complete">1. H-Contact ✓</div>
            <div class="progress-step active">2. V-Contact</div>
            <div class="progress-step">3. Pressure</div>
            <div class="progress-step">4. H-Hover</div>
            <div class="progress-step">5. V-Hover</div>
            <div class="progress-step">6. Tilt-X</div>
            <div class="progress-step">7. Tilt-Y</div>
            <div class="progress-step">8. Primary Btn</div>
            <div class="progress-step">9. Secondary Btn</div>
            <div class="progress-step">10. Results</div>
          </div>
        </div>
      `;
    }

    if (this.walkthroughStep === 'step3-pressure') {
      return html`
        <div class="section walkthrough active">
          <h3>Step 3: Pressure Detection</h3>
          ${this.isRealDevice
            ? html`
                <p>✏️ <strong>Press down with varying pressure</strong> while moving the stylus.</p>
                <p>Start light, press harder, then release. This will help us identify which bytes represent <strong>pressure</strong>.</p>
              `
            : html`
                <p>Click the button below to simulate varying pressure while dragging.</p>
                <p>This will help us identify which bytes represent <strong>pressure</strong>.</p>
              `}
          ${this._renderStepButtons('pressure', 'Simulate Input')}
          ${this._renderLiveAnalysis()}
          ${this._renderAccumulatedResults()}
          <div class="walkthrough-progress">
            <div class="progress-step complete">1. H-Contact ✓</div>
            <div class="progress-step complete">2. V-Contact ✓</div>
            <div class="progress-step active">3. Pressure</div>
            <div class="progress-step">4. H-Hover</div>
            <div class="progress-step">5. V-Hover</div>
            <div class="progress-step">6. Tilt-X</div>
            <div class="progress-step">7. Tilt-Y</div>
            <div class="progress-step">8. Primary Btn</div>
            <div class="progress-step">9. Secondary Btn</div>
            <div class="progress-step">10. Results</div>
          </div>
        </div>
      `;
    }

    if (this.walkthroughStep === 'step4-hover-horizontal') {
      return html`
        <div class="section walkthrough active">
          <h3>Step 4: Hover Horizontal Movement</h3>
          ${this.isRealDevice
            ? html`
                <p>✏️ <strong>Hover your stylus horizontally</strong> (left to right) <strong>without touching</strong> the tablet.</p>
                <p>This helps confirm X coordinate bytes by comparing hover vs contact data.</p>
              `
            : html`
                <p>Click the button below to simulate hovering across the tablet horizontally (no pressure).</p>
                <p>This helps confirm X coordinate bytes by comparing hover vs contact data.</p>
              `}
          ${this._renderStepButtons('hover-horizontal', 'Simulate Input')}
          ${this._renderLiveAnalysis()}
          ${this._renderAccumulatedResults()}
          <div class="walkthrough-progress">
            <div class="progress-step complete">1. H-Contact ✓</div>
            <div class="progress-step complete">2. V-Contact ✓</div>
            <div class="progress-step complete">3. Pressure ✓</div>
            <div class="progress-step active">4. H-Hover</div>
            <div class="progress-step">5. V-Hover</div>
            <div class="progress-step">6. Tilt-X</div>
            <div class="progress-step">7. Tilt-Y</div>
            <div class="progress-step">8. Primary Btn</div>
            <div class="progress-step">9. Secondary Btn</div>
            <div class="progress-step">10. Results</div>
          </div>
        </div>
      `;
    }

    if (this.walkthroughStep === 'step5-hover-vertical') {
      return html`
        <div class="section walkthrough active">
          <h3>Step 5: Hover Vertical Movement</h3>
          ${this.isRealDevice
            ? html`
                <p>✏️ <strong>Hover your stylus vertically</strong> (top to bottom) <strong>without touching</strong> the tablet.</p>
                <p>This confirms Y coordinate bytes by comparing hover vs contact data.</p>
              `
            : html`
                <p>Click the button below to simulate hovering across the tablet vertically (no pressure).</p>
                <p>This confirms Y coordinate bytes by comparing hover vs contact data.</p>
              `}
          ${this._renderStepButtons('hover-vertical', 'Simulate Input')}
          ${this._renderLiveAnalysis()}
          ${this._renderAccumulatedResults()}
          <div class="walkthrough-progress">
            <div class="progress-step complete">1. H-Contact ✓</div>
            <div class="progress-step complete">2. V-Contact ✓</div>
            <div class="progress-step complete">3. Pressure ✓</div>
            <div class="progress-step complete">4. H-Hover ✓</div>
            <div class="progress-step active">5. V-Hover</div>
            <div class="progress-step">6. Tilt-X</div>
            <div class="progress-step">7. Tilt-Y</div>
            <div class="progress-step">8. Primary Btn</div>
            <div class="progress-step">9. Secondary Btn</div>
            <div class="progress-step">10. Results</div>
          </div>
        </div>
      `;
    }

    if (this.walkthroughStep === 'step6-tilt-x') {
      return html`
        <div class="section walkthrough active">
          <h3>Step 6: Tilt X Detection</h3>
          ${this.isRealDevice
            ? html`
                <p>✏️ <strong>Tilt your stylus left and right</strong> while hovering or touching.</p>
                <p>This will help us identify which byte represents <strong>X tilt</strong>.</p>
              `
            : html`
                <p>Click the button below to simulate tilting the pen left and right.</p>
                <p>This will help us identify which byte represents <strong>X tilt</strong>.</p>
              `}
          ${this._renderStepButtons('tilt-x', 'Simulate Input')}
          ${this._renderLiveAnalysis()}
          ${this._renderAccumulatedResults()}
          <div class="walkthrough-progress">
            <div class="progress-step complete">1. H-Contact ✓</div>
            <div class="progress-step complete">2. V-Contact ✓</div>
            <div class="progress-step complete">3. Pressure ✓</div>
            <div class="progress-step complete">4. H-Hover ✓</div>
            <div class="progress-step complete">5. V-Hover ✓</div>
            <div class="progress-step active">6. Tilt-X</div>
            <div class="progress-step">7. Tilt-Y</div>
            <div class="progress-step">8. Primary Btn</div>
            <div class="progress-step">9. Secondary Btn</div>
            <div class="progress-step">10. Results</div>
          </div>
        </div>
      `;
    }

    if (this.walkthroughStep === 'step7-tilt-y') {
      return html`
        <div class="section walkthrough active">
          <h3>Step 7: Tilt Y Detection</h3>
          ${this.isRealDevice
            ? html`
                <p>✏️ <strong>Tilt your stylus forward and backward</strong> while hovering or touching.</p>
                <p>This will help us identify which byte represents <strong>Y tilt</strong>.</p>
              `
            : html`
                <p>Click the button below to simulate tilting the pen forward and backward.</p>
                <p>This will help us identify which byte represents <strong>Y tilt</strong>.</p>
              `}
          ${this._renderStepButtons('tilt-y', 'Simulate Input')}
          ${this._renderLiveAnalysis()}
          ${this._renderAccumulatedResults()}
          <div class="walkthrough-progress">
            <div class="progress-step complete">1. H-Contact ✓</div>
            <div class="progress-step complete">2. V-Contact ✓</div>
            <div class="progress-step complete">3. Pressure ✓</div>
            <div class="progress-step complete">4. H-Hover ✓</div>
            <div class="progress-step complete">5. V-Hover ✓</div>
            <div class="progress-step complete">6. Tilt-X ✓</div>
            <div class="progress-step active">7. Tilt-Y</div>
            <div class="progress-step">8. Primary Btn</div>
            <div class="progress-step">9. Secondary Btn</div>
            <div class="progress-step">10. Results</div>
          </div>
        </div>
      `;
    }

    if (this.walkthroughStep === 'step8-primary-button') {
      return html`
        <div class="section walkthrough active">
          <h3>Step 8: Primary Button Detection</h3>
          ${this.isRealDevice
            ? html`
                <p>✏️ <strong>Press and hold the primary stylus button</strong> while dragging.</p>
                <p>This will help us identify the status byte value for <strong>primary button</strong>.</p>
              `
            : html`
                <p>Click the button below to simulate dragging with the primary stylus button pressed.</p>
                <p>This will help us identify the status byte value for <strong>primary button</strong>.</p>
              `}
          ${this._renderStepButtons('primary-button', 'Simulate Input')}
          ${this._renderLiveAnalysis()}
          ${this._renderAccumulatedResults()}
          <div class="walkthrough-progress">
            <div class="progress-step complete">1. H-Contact ✓</div>
            <div class="progress-step complete">2. V-Contact ✓</div>
            <div class="progress-step complete">3. Pressure ✓</div>
            <div class="progress-step complete">4. H-Hover ✓</div>
            <div class="progress-step complete">5. V-Hover ✓</div>
            <div class="progress-step complete">6. Tilt-X ✓</div>
            <div class="progress-step complete">7. Tilt-Y ✓</div>
            <div class="progress-step active">8. Primary Btn</div>
            <div class="progress-step">9. Secondary Btn</div>
            <div class="progress-step">10. Results</div>
          </div>
        </div>
      `;
    }

    if (this.walkthroughStep === 'step9-secondary-button') {
      return html`
        <div class="section walkthrough active">
          <h3>Step 9: Secondary Button Detection</h3>
          ${this.isRealDevice
            ? html`
                <p>✏️ <strong>Press and hold the secondary stylus button</strong> while dragging.</p>
                <p>This will help us identify the status byte value for <strong>secondary button</strong>.</p>
              `
            : html`
                <p>Click the button below to simulate dragging with the secondary stylus button pressed.</p>
                <p>This will help us identify the status byte value for <strong>secondary button</strong>.</p>
              `}
          ${this._renderStepButtons('secondary-button', 'Simulate Input')}
          ${this._renderLiveAnalysis()}
          ${this._renderAccumulatedResults()}
          <div class="walkthrough-progress">
            <div class="progress-step complete">1. H-Contact ✓</div>
            <div class="progress-step complete">2. V-Contact ✓</div>
            <div class="progress-step complete">3. Pressure ✓</div>
            <div class="progress-step complete">4. H-Hover ✓</div>
            <div class="progress-step complete">5. V-Hover ✓</div>
            <div class="progress-step complete">6. Tilt-X ✓</div>
            <div class="progress-step complete">7. Tilt-Y ✓</div>
            <div class="progress-step complete">8. Primary Btn ✓</div>
            <div class="progress-step active">9. Secondary Btn</div>
            <div class="progress-step">10. Results</div>
          </div>
        </div>
      `;
    }

    if (this.walkthroughStep === 'complete') {
      return html`
        <div class="section walkthrough complete">
          <h3>✅ Analysis Complete!</h3>
          <p>We've identified which bytes represent coordinates, pressure, tilt, and button states in the HID data.</p>
          ${this.isRealDevice && this.activeDeviceIndices.size > 0 ? html`
            <div class="info-message" style="background: #e8f5e9; border-left-color: #4caf50; color: #2e7d32;">
              <strong>📱 Device Detection:</strong>
              ${this.activeDeviceIndices.size === 1
                ? html`Stylus data detected from <strong>Device ${Array.from(this.activeDeviceIndices)[0]}</strong>`
                : html`Stylus data detected from <strong>Devices ${Array.from(this.activeDeviceIndices).join(', ')}</strong>`
              }
              ${this._renderActiveDeviceInfo()}
            </div>
          ` : ''}

          ${this._renderLiveAnalysis()}

          <div class="walkthrough-progress">
            <div class="progress-step complete">1. H-Contact ✓</div>
            <div class="progress-step complete">2. V-Contact ✓</div>
            <div class="progress-step complete">3. H-Hover ✓</div>
            <div class="progress-step complete">4. V-Hover ✓</div>
            <div class="progress-step complete">5. Tilt-X ✓</div>
            <div class="progress-step complete">6. Tilt-Y ✓</div>
            <div class="progress-step complete">7. Primary Btn ✓</div>
            <div class="progress-step complete">8. Secondary Btn ✓</div>
            <div class="progress-step complete">9. Results ✓</div>
          </div>

          ${this.deviceConfig ? html`
            <div class="config-actions-only">
              <button class="button" @click="${this._copyConfig}">
                📋 Copy JSON
              </button>
              <button class="button" @click="${this._downloadConfig}">
                💾 Download Config
              </button>
            </div>
          ` : ''}

          <button class="button" @click="${this._resetWalkthrough}">
            Start Over
          </button>
        </div>
      `;
    }

    return html``;
  }

  private _renderByteAnalysis() {
    return html`
      <div class="byte-analysis">
        ${this.deviceConfig ? this._renderDeviceConfig() : ''}
      </div>
    `;
  }

  private _renderDeviceConfig() {
    if (!this.deviceConfig) return html``;

    const configJson = JSON.stringify(this.deviceConfig, null, 2);

    return html`
      <div class="config-section">
        <div class="config-header">
          <h4>📋 Device Configuration</h4>
          <div class="config-actions">
            <button class="button small" @click="${this._copyConfig}">
              📋 Copy JSON
            </button>
            <button class="button small" @click="${this._downloadConfig}">
              💾 Download
            </button>
          </div>
        </div>

        <div class="config-grid">
          ${this.deviceConfig.status ? this._renderStatusConfig(this.deviceConfig.status) : ''}
          ${this._renderCoordinateConfig('X Coordinate', this.deviceConfig.x, '↔️')}
          ${this._renderCoordinateConfig('Y Coordinate', this.deviceConfig.y, '↕️')}
          ${this._renderCoordinateConfig('Pressure', this.deviceConfig.pressure, '💪')}
          ${this.deviceConfig.tiltX ? this._renderTiltConfig('Tilt X', this.deviceConfig.tiltX, '↔️') : ''}
          ${this.deviceConfig.tiltY ? this._renderTiltConfig('Tilt Y', this.deviceConfig.tiltY, '↕️') : ''}
        </div>

        <!-- Hidden JSON for copy/download -->
        <pre style="display: none;"><code id="config-json">${configJson}</code></pre>
      </div>
    `;
  }

  private _renderStatusConfig(status: StatusConfig) {
    return html`
      <div class="config-card status-card">
        <div class="card-header">
          <span class="card-icon">🎯</span>
          <h5>Status Byte</h5>
        </div>
        <div class="card-body">
          <div class="config-detail">
            <span class="detail-label">Byte Index:</span>
            <span class="detail-value">[${status.byteIndex.join(', ')}]</span>
          </div>
          <div class="config-detail">
            <span class="detail-label">Type:</span>
            <span class="detail-value badge">${status.type}</span>
          </div>
          <div class="status-values">
            <span class="detail-label">Values:</span>
            ${Object.entries(status.values).map(([byteValue, statusValue]) => html`
              <div class="status-value-item">
                <span class="status-byte">${byteValue} (0x${parseInt(byteValue).toString(16).toUpperCase()})</span>
                <span class="status-state">${statusValue.state}</span>
                ${statusValue.primaryButtonPressed ? html`<span class="status-flag primary">Primary Btn</span>` : ''}
                ${statusValue.secondaryButtonPressed ? html`<span class="status-flag secondary">Secondary Btn</span>` : ''}
              </div>
            `)}
          </div>
        </div>
      </div>
    `;
  }

  private _renderCoordinateConfig(label: string, config: CoordinateConfig, icon: string) {
    return html`
      <div class="config-card">
        <div class="card-header">
          <span class="card-icon">${icon}</span>
          <h5>${label}</h5>
        </div>
        <div class="card-body">
          <div class="config-detail">
            <span class="detail-label">Byte Index:</span>
            <span class="detail-value">[${config.byteIndex.join(', ')}]</span>
          </div>
          <div class="config-detail">
            <span class="detail-label">Type:</span>
            <span class="detail-value badge">${config.type}</span>
          </div>
          <div class="config-detail">
            <span class="detail-label">Max Value:</span>
            <span class="detail-value highlight">${config.max}</span>
          </div>
        </div>
      </div>
    `;
  }

  private _renderTiltConfig(label: string, config: TiltConfig, icon: string) {
    return html`
      <div class="config-card">
        <div class="card-header">
          <span class="card-icon">${icon}</span>
          <h5>${label}</h5>
        </div>
        <div class="card-body">
          <div class="config-detail">
            <span class="detail-label">Byte Index:</span>
            <span class="detail-value">[${config.byteIndex.join(', ')}]</span>
          </div>
          <div class="config-detail">
            <span class="detail-label">Type:</span>
            <span class="detail-value badge">${config.type}</span>
          </div>
          <div class="config-detail">
            <span class="detail-label">Positive Max:</span>
            <span class="detail-value">${config.positiveMax}</span>
          </div>
          <div class="config-detail">
            <span class="detail-label">Negative Min:</span>
            <span class="detail-value">${config.negativeMin}</span>
          </div>
          <div class="config-detail">
            <span class="detail-label">Negative Max:</span>
            <span class="detail-value">${config.negativeMax}</span>
          </div>
        </div>
      </div>
    `;
  }

  private _setupMockDevice() {
    this.mockDevice = new MockTabletDevice();

    this.mockDevice.addEventListener('inputreport', (dataArray: Uint8Array) => {
      this._handleRawBytes(dataArray);
    });
  }

  private _setupDeviceFinder() {
    this.deviceFinder = new DeviceFinder(
      (result: DeviceConnectionResult) => {
        this._handleDeviceConnected(result);
      },
      () => {
        this._handleDeviceDisconnected();
      },
      {
        autoConnect: true, // Auto-connect to previously authorized devices
      }
    );
  }

  private async _checkForRealDevice() {
    if (!this.deviceFinder) return;

    try {
      const found = await this.deviceFinder.checkForExistingDevices();
      if (found) {
        console.log('[HIDDataReader] Auto-connected to existing device');
      }
    } catch (error) {
      console.error('[HIDDataReader] Error checking for devices:', error);
    }
  }

  private async _connectRealDevice() {
    if (!this.deviceFinder) return;

    this.isConnecting = true;

    try {
      // Request device with optional filters (empty array shows all HID devices)
      const result = await this.deviceFinder.requestDevice([]);
      if (!result) {
        console.log('[HIDDataReader] No device selected');
      } else {
        console.log('[HIDDataReader] Device selected and connected');
      }
    } catch (error) {
      console.error('[HIDDataReader] Error connecting device:', error);
      alert('Failed to connect to device. Please try again.');
    } finally {
      this.isConnecting = false;
    }
  }

  private async _handleDeviceConnected(result: DeviceConnectionResult) {
    console.log('[HIDDataReader] Device connected:', result.deviceInfo);
    console.log('[HIDDataReader] Primary device:', result.primaryDevice);
    console.log('[HIDDataReader] All devices:', result.allDevices);

    // Log all devices and their collections
    result.allDevices.forEach((device, index) => {
      console.log(`[HIDDataReader] Device ${index}:`, {
        opened: device.opened,
        vendorId: device.vendorId,
        productId: device.productId,
        productName: device.productName,
        collections: device.collections
      });
    });

    this.realDevice = result.primaryDevice;
    this.realDevices = result.allDevices;
    this.realDeviceName = result.deviceInfo.name;
    this.isRealDevice = true;

    // Initialize device data streams
    this.deviceDataStreams.clear();
    result.allDevices.forEach((_, index) => {
      this.deviceDataStreams.set(index, { lastPacket: '', packetCount: 0, lastUpdate: 0 });
    });

    // Log device collections to understand what reports it sends
    console.log('[HIDDataReader] Primary device collections:', this.realDevice.collections);

    // Force a re-render to show connection status
    this.requestUpdate();

    // IMPORTANT: Set up input report listener BEFORE opening
    // This ensures we don't miss any reports
    // Attach to ALL devices to see which one sends data
    result.allDevices.forEach((device, index) => {
      device.addEventListener('inputreport', (event: HIDInputReportEvent) => {
        const dataArray = new Uint8Array(event.data.buffer);
        this._handleDeviceData(index, dataArray);
      });
      console.log(`[HIDDataReader] Event listener attached to device ${index}`);
    });

    console.log('[HIDDataReader] Event listeners attached to all devices');

    // Wait a microtask to ensure listener is registered
    await new Promise(resolve => setTimeout(resolve, 10));

    // NOW open the device to start receiving data
    console.log('[HIDDataReader] Device opened status before open:', this.realDevice.opened);
    if (!this.realDevice.opened) {
      try {
        console.log('[HIDDataReader] Attempting to open device...');
        await this.realDevice.open();
        console.log('[HIDDataReader] Device opened successfully!');
        console.log('[HIDDataReader] Device opened status after open:', this.realDevice.opened);
        console.log('[HIDDataReader] 📝 Now move your stylus over the tablet to see input reports...');
        // Force re-render to update status
        this.requestUpdate();
      } catch (error) {
        console.error('[HIDDataReader] Error opening device:', error);
        alert(`Failed to open device: ${error instanceof Error ? error.message : String(error)}`);
      }
    } else {
      console.log('[HIDDataReader] Device already opened');
      console.log('[HIDDataReader] 📝 Now move your stylus over the tablet to see input reports...');
    }
  }

  private _handleDeviceDisconnected() {
    console.log('[HIDDataReader] Device disconnected');
    this.isRealDevice = false;
    this.realDeviceName = '';
    this.realDevice = undefined;
  }

  private async _disconnectRealDevice() {
    if (!this.deviceFinder) return;

    try {
      await this.deviceFinder.disconnect();
      this._handleDeviceDisconnected();
    } catch (error) {
      console.error('[HIDDataReader] Error disconnecting:', error);
    }
  }

  private _handleDeviceData(deviceIndex: number, data: Uint8Array) {
    // Convert bytes to hex string for display
    const hexString = Array.from(data)
      .map(byte => byte.toString(16).padStart(2, '0').toUpperCase())
      .join(' ');

    // Update device-specific stream
    const stream = this.deviceDataStreams.get(deviceIndex);
    if (stream) {
      stream.lastPacket = hexString;
      stream.packetCount++;
      stream.lastUpdate = Date.now();
      this.deviceDataStreams = new Map(this.deviceDataStreams); // Trigger reactivity
    }

    // Track which devices are active during walkthrough
    if (this.isCapturing && this.walkthroughStep !== 'idle' && this.walkthroughStep !== 'complete') {
      this.activeDeviceIndices.add(deviceIndex);
    }

    // Also update the main display (for backwards compatibility)
    this._handleRawBytes(data);
  }

  private _handleRawBytes(data: Uint8Array) {
    // Convert bytes to hex string for display
    const hexString = Array.from(data)
      .map(byte => byte.toString(16).padStart(2, '0').toUpperCase())
      .join(' ');

    this.byteCount++;

    // Update current display with latest packet
    this.currentBytes = hexString;

    // Capture packets during walkthrough
    if (this.isCapturing) {
      this.capturedPackets.push(new Uint8Array(data));
    }
  }

  private _analyzeBytes(packets: Uint8Array[]): ByteAnalysis[] {
    if (packets.length === 0) return [];

    const packetLength = packets[0].length;
    const analysis: ByteAnalysis[] = [];

    // Analyze each byte position
    for (let byteIndex = 0; byteIndex < packetLength; byteIndex++) {
      const values = packets.map(packet => packet[byteIndex]);
      const min = Math.min(...values);
      const max = Math.max(...values);
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

  private _identifySignificantBytes(analysis: ByteAnalysis[], threshold = 10): ByteAnalysis[] {
    // Return bytes that have significant variance (likely coordinate data)
    return analysis.filter(byte => byte.variance > threshold);
  }

  private _getBestGuessBytesByVariance(analysis: ByteAnalysis[], maxBytes = 3, minVariance = 50): ByteAnalysis[] {
    // Sort by variance (descending) and take top N bytes
    // This gives us the "best guess" for which bytes are actually relevant
    // minVariance filters out noise and small fluctuations
    const significantBytes = analysis
      .filter(byte => byte.variance > minVariance)
      .sort((a, b) => b.variance - a.variance);

    // Strategy:
    // - If maxBytes === 1, we're looking for a single byte (like tilt) - skip pair detection
    // - Otherwise, prioritize consecutive byte pairs (likely multi-byte values like coordinates)

    const result: ByteAnalysis[] = [];
    const used = new Set<number>();

    // For single-byte detection (tilt), skip the pair logic and just return the top byte
    if (maxBytes === 1) {
      if (significantBytes.length > 0) {
        return [significantBytes[0]];
      }
      return [];
    }

    // First pass: Find consecutive byte pairs where BOTH have high variance
    // This identifies multi-byte values (X, Y, pressure) which use 2 bytes each
    for (let i = 0; i < analysis.length - 1; i++) {
      const byte = analysis[i];
      const nextByte = analysis[i + 1];

      if (used.has(byte.byteIndex) || used.has(nextByte.byteIndex)) continue;

      // Check if they're consecutive and both have high variance
      if (nextByte.byteIndex === byte.byteIndex + 1 &&
          byte.variance > minVariance &&
          nextByte.variance > minVariance) {

        // Both bytes have high variance and are consecutive - likely a multi-byte value
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

  private async _playGesture(gesture: string) {
    if (!this.mockDevice || this.isPlaying) return;

    // Check if we're in walkthrough mode and validate gesture
    if (this.walkthroughStep === 'step1-horizontal' && gesture !== 'horizontal') {
      return; // Only allow horizontal drag in step 1
    }
    if (this.walkthroughStep === 'step2-vertical' && gesture !== 'vertical') {
      return; // Only allow vertical drag in step 2
    }
    if (this.walkthroughStep === 'step3-pressure' && gesture !== 'pressure') {
      return; // Only allow pressure in step 3
    }
    if (this.walkthroughStep === 'step4-hover-horizontal' && gesture !== 'hover-horizontal') {
      return; // Only allow hover horizontal in step 4
    }
    if (this.walkthroughStep === 'step5-hover-vertical' && gesture !== 'hover-vertical') {
      return; // Only allow hover vertical in step 5
    }
    if (this.walkthroughStep === 'step6-tilt-x' && gesture !== 'tilt-x') {
      return; // Only allow tilt X in step 6
    }
    if (this.walkthroughStep === 'step7-tilt-y' && gesture !== 'tilt-y') {
      return; // Only allow tilt Y in step 7
    }
    if (this.walkthroughStep === 'step8-primary-button' && gesture !== 'primary-button') {
      return; // Only allow primary button in step 8
    }
    if (this.walkthroughStep === 'step9-secondary-button' && gesture !== 'secondary-button') {
      return; // Only allow secondary button in step 9
    }

    // Start capturing if in walkthrough mode
    const isWalkthroughStep = ['step1-horizontal', 'step2-vertical', 'step3-hover-horizontal', 'step4-hover-vertical', 'step5-tilt-x', 'step6-tilt-y', 'step7-primary-button', 'step8-secondary-button'].includes(this.walkthroughStep);
    if (isWalkthroughStep) {
      this.capturedPackets = [];
      this.isCapturing = true;
    }

    this.isPlaying = true;
    this.currentGesture = gesture;

    await this.mockDevice.open();

    // Play the selected gesture
    switch (gesture) {
      case 'circle':
        this.mockDevice.playCircle();
        break;
      case 'line':
        this.mockDevice.playLine();
        break;
      case 'scribble':
        this.mockDevice.playScribble();
        break;
      case 'star':
        this.mockDevice.playPath(DrawingPresets.star(), 2000);
        break;
      case 'spiral':
        this.mockDevice.playPath(DrawingPresets.spiral(), 3000);
        break;
      case 'heart':
        this.mockDevice.playPath(DrawingPresets.heart(), 2500);
        break;
      case 'horizontal':
        this.mockDevice.playHorizontalDrag();
        break;
      case 'vertical':
        this.mockDevice.playVerticalDrag();
        break;
      case 'hover-horizontal':
        this.mockDevice.playHoverHorizontalDrag();
        break;
      case 'hover-vertical':
        this.mockDevice.playHoverVerticalDrag();
        break;
      case 'tilt-x':
        this.mockDevice.playTiltXDrag();
        break;
      case 'tilt-y':
        this.mockDevice.playTiltYDrag();
        break;
      case 'primary-button':
        this.mockDevice.playPrimaryButtonDrag();
        break;
      case 'secondary-button':
        this.mockDevice.playSecondaryButtonDrag();
        break;
      default:
        this.mockDevice.playCircle();
    }

    // Auto-stop when gesture completes
    setTimeout(() => {
      if (this.isPlaying && this.currentGesture === gesture) {
        this._stopGesture();
        this._handleGestureComplete(gesture);
      }
    }, this._getGestureDuration(gesture));
  }

  private _handleGestureComplete(gesture: string) {
    // Process captured data if in walkthrough mode
    if (this.walkthroughStep === 'step1-horizontal' && gesture === 'horizontal') {
      this.isCapturing = false;
      // Save packets for persistent live view
      this.lastCapturedPackets = [...this.capturedPackets];
      const analysis = this._analyzeBytes(this.capturedPackets);
      // Store best guess bytes for horizontal movement
      this.horizontalBytes = this._getBestGuessBytesByVariance(analysis, 3);
      // Track status byte for contact
      this._trackStatusByte('contact');
      this.walkthroughStep = 'step2-vertical';
    } else if (this.walkthroughStep === 'step2-vertical' && gesture === 'vertical') {
      this.isCapturing = false;
      this.lastCapturedPackets = [...this.capturedPackets];
      const analysis = this._analyzeBytes(this.capturedPackets);
      // Store best guess bytes for vertical movement
      this.verticalBytes = this._getBestGuessBytesByVariance(analysis, 3);
      this.walkthroughStep = 'step3-pressure';
    } else if (this.walkthroughStep === 'step3-pressure' && gesture === 'pressure') {
      this.isCapturing = false;
      this.lastCapturedPackets = [...this.capturedPackets];
      const analysis = this._analyzeBytes(this.capturedPackets);
      // Store best guess bytes for pressure
      this.pressureBytes = this._getBestGuessBytesByVariance(analysis, 3);
      this.walkthroughStep = 'step4-hover-horizontal';
    } else if (this.walkthroughStep === 'step4-hover-horizontal' && gesture === 'hover-horizontal') {
      this.isCapturing = false;
      this.lastCapturedPackets = [...this.capturedPackets];
      const analysis = this._analyzeBytes(this.capturedPackets);
      // Store bytes that changed during horizontal hover (X coordinate only, no pressure)
      this.hoverHorizontalBytes = this._getBestGuessBytesByVariance(analysis, 2);
      // Track status byte for hover
      this._trackStatusByte('hover');
      this.walkthroughStep = 'step5-hover-vertical';
    } else if (this.walkthroughStep === 'step5-hover-vertical' && gesture === 'hover-vertical') {
      this.isCapturing = false;
      this.lastCapturedPackets = [...this.capturedPackets];
      const analysis = this._analyzeBytes(this.capturedPackets);
      // Store bytes that changed during vertical hover (Y coordinate only, no pressure)
      this.hoverVerticalBytes = this._getBestGuessBytesByVariance(analysis, 2);

      // Identify X, Y, and pressure before moving to tilt
      this._identifyCoordinateAndPressureBytes();

      this.walkthroughStep = 'step6-tilt-x';
    } else if (this.walkthroughStep === 'step6-tilt-x' && gesture === 'tilt-x') {
      this.isCapturing = false;
      this.lastCapturedPackets = [...this.capturedPackets];
      const analysis = this._analyzeBytes(this.capturedPackets);
      // Filter out already-identified bytes (X, Y, pressure)
      const knownByteIndices = new Set([
        ...this.horizontalBytes.map(b => b.byteIndex),
        ...this.verticalBytes.map(b => b.byteIndex),
        ...this.pressureBytes.map(b => b.byteIndex),
      ]);
      const tiltOnlyBytes = analysis.filter(b => !knownByteIndices.has(b.byteIndex));
      this.tiltXBytes = this._getBestGuessBytesByVariance(tiltOnlyBytes, 1); // Just the top byte
      this.walkthroughStep = 'step7-tilt-y';
    } else if (this.walkthroughStep === 'step7-tilt-y' && gesture === 'tilt-y') {
      this.isCapturing = false;
      this.lastCapturedPackets = [...this.capturedPackets];
      const analysis = this._analyzeBytes(this.capturedPackets);
      // Filter out already-identified bytes (X, Y, pressure, AND tilt-X)
      const knownByteIndices = new Set([
        ...this.horizontalBytes.map(b => b.byteIndex),
        ...this.verticalBytes.map(b => b.byteIndex),
        ...this.pressureBytes.map(b => b.byteIndex),
        ...this.tiltXBytes.map(b => b.byteIndex), // Exclude tilt-X from step 6
      ]);
      const tiltOnlyBytes = analysis.filter(b => !knownByteIndices.has(b.byteIndex));
      this.tiltYBytes = this._getBestGuessBytesByVariance(tiltOnlyBytes, 1); // Just the top byte

      // Identify tilt bytes
      this._identifyTiltBytes();

      this.walkthroughStep = 'step8-primary-button';
    } else if (this.walkthroughStep === 'step8-primary-button' && gesture === 'primary-button') {
      this.isCapturing = false;
      this.lastCapturedPackets = [...this.capturedPackets];
      // Track status byte value for primary button
      if (this.capturedPackets.length > 0) {
        const statusByte = this.capturedPackets[0][1];
        this.statusByteValues.set(statusByte, {
          state: 'contact',
          primaryButtonPressed: true,
        });
      }
      this.walkthroughStep = 'step9-secondary-button';
    } else if (this.walkthroughStep === 'step9-secondary-button' && gesture === 'secondary-button') {
      this.isCapturing = false;
      this.lastCapturedPackets = [...this.capturedPackets];
      // Track status byte value for secondary button
      if (this.capturedPackets.length > 0) {
        const statusByte = this.capturedPackets[0][1];
        this.statusByteValues.set(statusByte, {
          state: 'contact',
          secondaryButtonPressed: true,
        });
      }

      // Generate final config with status byte mappings
      this._generateDeviceConfig();

      this.walkthroughStep = 'complete';
    }
  }

  private _identifyCoordinateAndPressureBytes() {
    // X coordinate bytes: those that changed during horizontal HOVER (no pressure)
    this.horizontalBytes = this.hoverHorizontalBytes;

    // Y coordinate bytes: those that changed during vertical HOVER (no pressure)
    this.verticalBytes = this.hoverVerticalBytes;

    // Pressure bytes are already identified from step 3 (pressure test)
    // No need to infer them - they were directly measured
    // The pressureBytes array is already populated from step 3
  }

  private _identifyTiltBytes() {
    // Tilt bytes are already identified in tiltXBytes and tiltYBytes
    // Config generation happens after button detection
  }

  private _findStatusByte(): number | null {
    // Find the status byte by looking for a byte with:
    // - Low variance (< 10)
    // - Multiple distinct values (2-10 states)
    // - Not already identified as X, Y, pressure, or tilt
    if (this.capturedPackets.length === 0) return null;

    const analysis = this._analyzeBytes(this.capturedPackets);
    const knownByteIndices = new Set([
      ...this.horizontalBytes.map(b => b.byteIndex),
      ...this.verticalBytes.map(b => b.byteIndex),
      ...this.pressureBytes.map(b => b.byteIndex),
      ...this.hoverHorizontalBytes.map(b => b.byteIndex),
      ...this.hoverVerticalBytes.map(b => b.byteIndex),
      ...this.tiltXBytes.map(b => b.byteIndex),
      ...this.tiltYBytes.map(b => b.byteIndex),
    ]);

    for (const byte of analysis) {
      if (knownByteIndices.has(byte.byteIndex)) continue;
      if (byte.variance === 0) continue; // Skip constant bytes (report ID)
      if (byte.variance >= 10) continue; // Skip high-variance bytes (coordinates, pressure)

      const uniqueValues = new Set(this.capturedPackets.map(p => p[byte.byteIndex]));
      if (uniqueValues.size >= 2 && uniqueValues.size <= 10) {
        return byte.byteIndex;
      }
    }

    return null;
  }

  private _trackStatusByte(state: string) {
    if (this.capturedPackets.length > 0) {
      const statusByteIndex = this._findStatusByte();
      if (statusByteIndex !== null) {
        const statusByte = this.capturedPackets[0][statusByteIndex];
        if (!this.statusByteValues.has(statusByte)) {
          this.statusByteValues.set(statusByte, { state });
        }
      }
    }
  }

  private _generateDeviceConfig() {
    // Group consecutive bytes for multi-byte values (0-based internally)
    const xBytes = this._groupConsecutiveBytes(this.horizontalBytes);
    const yBytes = this._groupConsecutiveBytes(this.verticalBytes);
    const pressureBytes = this._groupConsecutiveBytes(this.pressureBytes);

    // Calculate max values from the observed data
    const xMax = this._calculateMultiByteMax(xBytes, this.horizontalBytes);
    const yMax = this._calculateMultiByteMax(yBytes, this.verticalBytes);
    const pressureMax = this._calculateMultiByteMax(pressureBytes, this.pressureBytes);

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
        byteIndex: pressureBytes.map(i => i + 1),
        max: pressureMax,
        type: 'multi-byte-range',
      },
    };

    // Add status byte mappings if detected
    if (this.statusByteValues.size > 0) {
      const statusByteIndex = this._findStatusByte();
      if (statusByteIndex !== null) {
        const values: Record<string, StatusValue> = {};
        this.statusByteValues.forEach((value, byteValue) => {
          values[byteValue.toString()] = value;
        });

        config.status = {
          byteIndex: [statusByteIndex + 1], // Convert to 1-based indexing
          type: 'code',
          values,
        };
      }
    }

    // Add tilt if detected
    if (this.tiltXBytes.length > 0) {
      const tiltXByteIndices = this._groupConsecutiveBytes(this.tiltXBytes);
      const tiltXConfig = this._calculateBipolarRange(tiltXByteIndices, this.tiltXBytes);
      config.tiltX = tiltXConfig;
    }

    if (this.tiltYBytes.length > 0) {
      const tiltYByteIndices = this._groupConsecutiveBytes(this.tiltYBytes);
      const tiltYConfig = this._calculateBipolarRange(tiltYByteIndices, this.tiltYBytes);
      config.tiltY = tiltYConfig;
    }

    this.deviceConfig = config;
  }

  private _groupConsecutiveBytes(bytes: ByteAnalysis[]): number[] {
    if (bytes.length === 0) return [];

    // Sort by byte index
    const sorted = [...bytes].sort((a, b) => a.byteIndex - b.byteIndex);

    // Return all byte indices (they should be consecutive for multi-byte values)
    return sorted.map(b => b.byteIndex);
  }

  private _calculateBipolarRange(byteIndices: number[], analysis: ByteAnalysis[]): TiltConfig {
    if (byteIndices.length === 0 || analysis.length === 0) {
      return {
        byteIndex: byteIndices.map(i => i + 1), // Convert to 1-based indexing
        positiveMax: 60,
        negativeMin: 256,
        negativeMax: 196,
        type: 'bipolar-range',
      };
    }

    // For tilt, we expect a single byte with values split into positive and negative ranges
    // Our mock data maps tilt from -1 to +1 to byte values 0-255
    // The mock generator uses: tiltByte = ((tilt + 1) / 2) * 255
    // So: -1 → 0, 0 → 127.5, +1 → 255

    const byte = analysis[0];
    const midpoint = 128;

    // Positive range: 0 to observed max (if max < midpoint) or 0 to midpoint-1
    // Negative range: midpoint to 255
    // Note: XP-Pen uses positiveMax: 60, negativeMin: 256, negativeMax: 196
    // This suggests: positive is 0-60, negative is 196-255 (wrapping to 256)

    // For our mock data, we'll use the observed ranges
    const positiveMax = Math.min(byte.max, 127);
    const negativeMin = 256; // Indicates wraparound
    const negativeMax = Math.max(byte.max, 196);

    return {
      byteIndex: byteIndices.map(i => i + 1), // Convert to 1-based indexing
      positiveMax,
      negativeMin,
      negativeMax,
      type: 'bipolar-range',
    };
  }

  private _calculateMultiByteMax(byteIndices: number[], analysis: ByteAnalysis[]): number {
    if (byteIndices.length === 0) return 0;

    // Find the maximum value observed across all bytes
    // For multi-byte values, we need to reconstruct the full value
    let maxValue = 0;

    for (const byte of analysis) {
      if (byte.max > maxValue) {
        maxValue = byte.max;
      }
    }

    // For multi-byte values (little-endian), calculate the combined max
    // This is an approximation based on the highest byte value observed
    if (byteIndices.length === 2) {
      // For 2-byte values, use the max from the analysis
      // Round up to a reasonable value
      const observedMax = analysis.reduce((max, byte) => {
        return Math.max(max, byte.max);
      }, 0);

      // If we have both bytes, estimate the full range
      if (analysis.length === 2) {
        const lowByte = analysis.find(b => b.byteIndex === byteIndices[0]);
        const highByte = analysis.find(b => b.byteIndex === byteIndices[1]);

        if (lowByte && highByte) {
          // Reconstruct approximate max value (little-endian)
          const reconstructedMax = lowByte.max + (highByte.max << 8);
          return reconstructedMax;
        }
      }

      return observedMax * 256; // Rough estimate for 2-byte range
    }

    return maxValue;
  }

  private _getGestureDuration(gesture: string): number {
    const durations: Record<string, number> = {
      circle: 2000,
      line: 1000,
      scribble: 3000,
      star: 2000,
      spiral: 3000,
      heart: 2500,
      horizontal: 1500,
      vertical: 1500,
      'hover-horizontal': 1500,
      'hover-vertical': 1500,
      'tilt-x': 1500,
      'tilt-y': 1500,
      'primary-button': 1500,
      'secondary-button': 1500,
    };
    return durations[gesture] || 2000;
  }

  private _stopGesture() {
    if (!this.mockDevice) return;

    this.mockDevice.stop();
    this.isPlaying = false;
    this.currentGesture = '';
  }

  private _clearBytes() {
    this.currentBytes = '';
    this.byteCount = 0;
  }

  private _startWalkthrough() {
    this.walkthroughStep = 'step1-horizontal';
    this.horizontalBytes = [];
    this.verticalBytes = [];
    this.hoverHorizontalBytes = [];
    this.hoverVerticalBytes = [];
    this.pressureBytes = [];
    this.tiltXBytes = [];
    this.tiltYBytes = [];
    this.capturedPackets = [];
    this.activeDeviceIndices.clear();
    this._clearBytes();

    // For real device, we'll start capturing when user performs the gesture
    // Don't start capturing immediately to avoid picking up residual packets
    if (this.isRealDevice) {
      this.capturedPackets = [];
      this.isCapturing = false; // Will be set to true when user starts gesture
    }
  }

  private _renderAccumulatedResults() {
    const results: any[] = [];

    // Step 1: Horizontal bytes
    if (this.horizontalBytes.length > 0) {
      results.push({
        title: '↔️ Horizontal Movement (Contact)',
        bytes: this.horizontalBytes,
        description: 'Bytes that changed during horizontal drag'
      });
    }

    // Step 2: Vertical bytes
    if (this.verticalBytes.length > 0) {
      results.push({
        title: '↕️ Vertical Movement (Contact)',
        bytes: this.verticalBytes,
        description: 'Bytes that changed during vertical drag'
      });
    }

    // Step 3: Hover horizontal bytes
    if (this.hoverHorizontalBytes.length > 0) {
      results.push({
        title: '↔️ Horizontal Hover (No Pressure)',
        bytes: this.hoverHorizontalBytes,
        description: 'Bytes that changed during horizontal hover'
      });
    }

    // Step 4: Hover vertical bytes
    if (this.hoverVerticalBytes.length > 0) {
      results.push({
        title: '↕️ Vertical Hover (No Pressure)',
        bytes: this.hoverVerticalBytes,
        description: 'Bytes that changed during vertical hover'
      });
    }

    // Step 5: Tilt X bytes
    if (this.tiltXBytes.length > 0) {
      results.push({
        title: '↔️ Tilt X',
        bytes: this.tiltXBytes,
        description: 'Bytes that changed during X tilt'
      });
    }

    // Step 6: Tilt Y bytes
    if (this.tiltYBytes.length > 0) {
      results.push({
        title: '↕️ Tilt Y',
        bytes: this.tiltYBytes,
        description: 'Bytes that changed during Y tilt'
      });
    }

    // Step 7 & 8: Status byte values
    const statusValues = Array.from(this.statusByteValues.entries());
    if (statusValues.length > 0) {
      results.push({
        title: '🔘 Status Byte Values',
        statusValues: statusValues,
        description: 'Status byte values for different pen states'
      });
    }

    if (results.length === 0) {
      return html``;
    }

    return html`
      <div class="section accumulated-results">
        <h3>📊 Discovered So Far</h3>
        ${results.map(result => html`
          <div class="result-item">
            <h4>${result.title}</h4>
            <p class="result-description">${result.description}</p>
            ${result.bytes ? html`
              <div class="byte-results">
                ${result.bytes.map((byte: any) => html`
                  <div class="byte-result-card">
                    <div class="byte-index">Byte ${byte.byteIndex + 1}</div>
                    <div class="byte-range">
                      <span class="range-label">Range:</span>
                      <span class="range-value">${byte.min} - ${byte.max}</span>
                    </div>
                    <div class="byte-variance">
                      <span class="variance-label">Variance:</span>
                      <span class="variance-value">${byte.variance.toFixed(2)}</span>
                    </div>
                  </div>
                `)}
              </div>
            ` : ''}
            ${result.statusValues ? html`
              <div class="status-values">
                ${result.statusValues.map(([byteValue, info]: [number, any]) => html`
                  <div class="status-value-card">
                    <span class="status-state">${info.state}:</span>
                    <span class="status-value">${byteValue} (0x${byteValue.toString(16).toUpperCase().padStart(2, '0')})</span>
                  </div>
                `)}
              </div>
            ` : ''}
          </div>
        `)}
      </div>
    `;
  }

  private _getByteLabel(byteIndex: number): string | null {
    // Return the best guess label for what this byte represents
    // Based on what we've discovered so far in the walkthrough

    // Check X coordinate (confirmed from hover horizontal, or tentative from contact horizontal)
    if (this.hoverHorizontalBytes.some(b => b.byteIndex === byteIndex)) {
      return 'X';
    }
    if (this.horizontalBytes.some(b => b.byteIndex === byteIndex) && this.hoverHorizontalBytes.length === 0) {
      return 'X?'; // Tentative until confirmed by hover test
    }

    // Check Y coordinate (confirmed from hover vertical, or tentative from contact vertical)
    if (this.hoverVerticalBytes.some(b => b.byteIndex === byteIndex)) {
      return 'Y';
    }
    if (this.verticalBytes.some(b => b.byteIndex === byteIndex) && this.hoverVerticalBytes.length === 0) {
      return 'Y?'; // Tentative until confirmed by hover test
    }

    // Check pressure (from step 3)
    if (this.pressureBytes.some(b => b.byteIndex === byteIndex)) {
      return 'Pressure';
    }

    // Check tilt X
    if (this.tiltXBytes.some(b => b.byteIndex === byteIndex)) {
      return 'Tilt-X';
    }

    // Check tilt Y
    if (this.tiltYBytes.some(b => b.byteIndex === byteIndex)) {
      return 'Tilt-Y';
    }

    // Check if it's in the device config (buttons, etc.)
    if (this.deviceConfig) {
      for (const [key, mapping] of Object.entries(this.deviceConfig)) {
        if ('byteIndex' in mapping && mapping.byteIndex === byteIndex) {
          // Format the key nicely
          if (key === 'primaryButton') return 'Btn-1';
          if (key === 'secondaryButton') return 'Btn-2';
          if (key === 'status') return 'Status';
        }
      }
    }

    return null;
  }

  private _renderLiveAnalysis() {
    // Show live analysis whenever we have captured packets
    // Use current packets if capturing, otherwise use last captured packets
    const packetsToShow = this.isCapturing && this.capturedPackets.length > 0
      ? this.capturedPackets
      : this.lastCapturedPackets;

    if (packetsToShow.length === 0) {
      return html``;
    }

    const titleSuffix = this.isCapturing ? ' (Live)' : '';

    // Get the latest packet
    const latestPacket = packetsToShow[packetsToShow.length - 1];

    // Analyze captured packets in real-time
    const analysis = this._analyzeBytes(packetsToShow);

    // Filter out bytes we've already identified in previous steps
    const knownByteIndices = new Set([
      ...this.horizontalBytes.map(b => b.byteIndex),
      ...this.verticalBytes.map(b => b.byteIndex),
      ...this.pressureBytes.map(b => b.byteIndex),
      ...this.hoverHorizontalBytes.map(b => b.byteIndex),
      ...this.hoverVerticalBytes.map(b => b.byteIndex),
      ...this.tiltXBytes.map(b => b.byteIndex),
      ...this.tiltYBytes.map(b => b.byteIndex),
    ]);

    // Also filter out likely status/report bytes:
    // - Bytes with very low variance (< 10) but multiple distinct values = likely status byte
    // - Bytes that are constant (variance = 0) = likely report ID
    const movementAnalysis = analysis.filter(byte => {
      // Skip already identified bytes
      if (knownByteIndices.has(byte.byteIndex)) return false;

      // Skip constant bytes (report ID)
      if (byte.variance === 0) return false;

      // Skip low-variance bytes with few distinct values (likely status byte)
      if (byte.variance < 10) {
        const uniqueValues = new Set(this.capturedPackets.map(p => p[byte.byteIndex]));
        if (uniqueValues.size <= 5) return false; // Status bytes typically have few states
      }

      return true;
    });

    // Get best guess bytes (top 3 by variance) - this is what we think is relevant
    const bestGuessBytes = this._getBestGuessBytesByVariance(movementAnalysis, 3);
    const bestGuessIndices = new Set(bestGuessBytes.map(b => b.byteIndex));

    // Create a map of byte index to analysis data
    const analysisMap = new Map(analysis.map(a => [a.byteIndex, a]));

    return html`
      <div class="live-analysis">
        <h4>📊 Live Analysis${titleSuffix}</h4>
        <p class="analysis-subtitle">${packetsToShow.length} packet${packetsToShow.length !== 1 ? 's' : ''} captured</p>
        <div class="live-bytes-grid">
          ${Array.from(latestPacket).map((value, byteIndex) => {
            const isBestGuess = bestGuessIndices.has(byteIndex);
            const analysisData = analysisMap.get(byteIndex);
            const byteLabel = this._getByteLabel(byteIndex);

            return html`
              <div class="live-byte-cell ${isBestGuess ? 'best-guess' : ''} ${byteLabel ? 'identified' : ''}">
                ${byteLabel ? html`<div class="byte-type-label">${byteLabel}</div>` : ''}
                <div class="byte-label">Byte ${byteIndex + 1}</div>
                <div class="byte-value">${value}</div>
                <div class="byte-hex">0x${value.toString(16).toUpperCase().padStart(2, '0')}</div>
                ${analysisData ? html`
                  <div class="byte-meta">
                    <div class="meta-line">R: ${analysisData.min}-${analysisData.max}</div>
                    <div class="meta-line">V: ${analysisData.variance.toFixed(1)}</div>
                  </div>
                ` : html`
                  <div class="byte-meta">
                    <div class="meta-line">-</div>
                  </div>
                `}
              </div>
            `;
          })}
        </div>
      </div>
    `;
  }

  private _renderStepButtons(gesture: string, mockLabel: string) {
    if (this.isRealDevice) {
      return html`
        <div class="step-buttons">
          ${!this.isCapturing
            ? html`
                <button class="button primary" @click="${this._startCapture}">
                  ▶️ Start - I'm Ready
                </button>
              `
            : html`
                <p class="info-message" style="background: #fff3cd; border-left-color: #ffc107; color: #856404;">
                  📝 Recording... Perform the gesture now, then click Done.
                </p>
                <div class="button-group">
                  <button class="button secondary" @click="${this._resetCapture}">
                    🔄 Reset
                  </button>
                  <button class="button primary" @click="${() => this._completeManualStep(gesture)}">
                    ✓ Done - Next Step
                  </button>
                </div>
              `}
        </div>
      `;
    } else {
      return html`
        <button
          class="button primary"
          ?disabled="${this.isPlaying}"
          @click="${() => this._playGesture(gesture)}">
          ${this.isPlaying ? '⏳ Simulating...' : `▶️ ${mockLabel}`}
        </button>
      `;
    }
  }

  private _startCapture() {
    // Clear any residual packets and start fresh
    this.capturedPackets = [];
    this.isCapturing = true;
    this.requestUpdate();
  }

  private _resetCapture() {
    // Clear captured packets and restart capture
    this.capturedPackets = [];
    this.requestUpdate();
  }

  private _completeManualStep(gesture: string) {
    // Stop capturing
    this.isCapturing = false;

    // Process the captured data as if the gesture completed
    this._handleGestureComplete(gesture);
  }

  private _resetWalkthrough() {
    this.walkthroughStep = 'idle';
    this.horizontalBytes = [];
    this.verticalBytes = [];
    this.tiltXBytes = [];
    this.tiltYBytes = [];
    this.hoverHorizontalBytes = [];
    this.hoverVerticalBytes = [];
    this.pressureBytes = [];
    this.deviceConfig = null;
    this.capturedPackets = [];
    this.isCapturing = false;
    this.statusByteValues.clear();
    this._clearBytes();
  }

  private _getConfigWithMetadata(): string {
    if (!this.deviceConfig) return '';

    let output = '';

    // Add device detection info as comments if real device
    if (this.isRealDevice && this.activeDeviceIndices.size > 0) {
      output += '// Device Detection Results:\n';
      output += `// Stylus data detected from Device Interface(s): ${Array.from(this.activeDeviceIndices).join(', ')}\n`;

      Array.from(this.activeDeviceIndices).forEach(index => {
        const device = this.realDevices[index];
        if (device && device.collections[0]) {
          const collection = device.collections[0];
          output += `// Device ${index}: Usage Page ${collection.usagePage}, Usage ${collection.usage}`;
          if (collection.usagePage === 13 && collection.usage === 2) {
            output += ' (Digitizer - Pen)';
          }
          output += '\n';
        }
      });

      output += '//\n';
      output += '// Note: Use the detected device interface when reading HID data\n';
      output += '//\n';
    }

    output += JSON.stringify(this.deviceConfig, null, 2);
    return output;
  }

  private async _copyConfig() {
    if (!this.deviceConfig) return;

    const configText = this._getConfigWithMetadata();

    try {
      await navigator.clipboard.writeText(configText);
      alert('Configuration copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy:', err);
      alert('Failed to copy to clipboard. Please try again.');
    }
  }

  private _downloadConfig() {
    if (!this.deviceConfig) return;

    const configText = this._getConfigWithMetadata();
    const blob = new Blob([configText], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'device-byte-mappings.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hid-data-reader': HidDataReader;
  }
}

