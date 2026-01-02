import { LitElement, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { styles } from './hid-data-reader.styles.js';
import { MockTabletDevice, DrawingPresets } from '../../mockbytes/index.js';
import { DeviceFinder, type DeviceConnectionResult } from '../../utils/finddevice.js';
import {
  analyzeBytes,
  getBestGuessBytesByVariance,
  generateDeviceConfig,
  type ByteAnalysis,
  type DeviceByteCodeMappings,
  type StatusValue,
  type StatusConfig,
  type CoordinateConfig,
  type TiltConfig,
} from '../../utils/byte-detector.js';
import {
  generateCompleteConfig,
  type DeviceMetadata,
  type UserProvidedMetadata,
} from '../../utils/metadata-generator.js';
import '../hid-devices/hid-devices.js';
import type { DeviceStream, DeviceDetails } from '../device-list-minimal/device-list-minimal.js';
import type { ByteData, DeviceInfo } from '../bytes-display/bytes-display.js';
import '../hid-json-config/hid-json-config.js';
import '../hid-walkthrough/hid-walkthrough.js';
import type { WalkthroughStep } from '../hid-walkthrough/hid-walkthrough.js';
import type { MetadataFormData } from '../device-metadata-form/device-metadata-form.js';

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
  private walkthroughStep: WalkthroughStep = 'step1-horizontal';

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
  private tabletButtonBytes: ByteAnalysis[] = [];

  @state()
  private detectedButtonStates: Set<number> = new Set();

  @state()
  private deviceConfig: DeviceByteCodeMappings | null = null;

  @state()
  private isConfigPanelExpanded = true;

  @state()
  private isRealDevice = false;

  @state()
  private realDeviceName = '';

  @state()
  private isConnecting = false;

  @state()
  private completeConfig: any = null;

  @state()
  private deviceDataStreams: Map<number, { lastPacket: string; packetCount: number; lastUpdate: number }> = new Map();

  private mockDevice?: MockTabletDevice;
  private realDevice?: HIDDevice;
  private realDevices: HIDDevice[] = [];
  private deviceFinder?: DeviceFinder;
  private capturedPackets: Uint8Array[] = [];
  private lastCapturedPackets: Uint8Array[] = []; // Persists between steps for live view

  // Track observed status byte values
  private statusByteValues: Map<number, StatusValue> = new Map();

  // Track all packets from all steps for status byte detection
  private allWalkthroughPackets: Uint8Array[] = [];

  // Track which devices sent data during walkthrough
  private activeDeviceIndices: Set<number> = new Set();

  // Track the most recent device that sent data (for bytes display)
  private currentActiveDeviceIndex: number | undefined = undefined;

  // Store device metadata for configuration generation
  private deviceMetadata: {
    vendorId?: number;
    productId?: number;
    productName?: string;
    collections?: Array<{ usagePage: number; usage: number }>;
    allInterfaces?: number[];
    detectedReportId?: number;
  } = {};

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
        ${this._renderDeviceStatus()}
      </div>

      <div class="content">
        ${this._renderWalkthrough()}

        ${this.deviceDataStreams.size > 0
          ? this._renderDeviceStreams()
          : ''
        }
      </div>
    `;
  }

  private _renderDeviceStatus() {
    return html`
      <div class="device-status">
        ${!this.isRealDevice
          ? html`
              <button
                class="button small connect"
                ?disabled="${this.isConnecting}"
                @click="${this._connectRealDevice}">
                ${this.isConnecting ? '⏳ Connecting...' : '🔌 Connect Real Tablet'}
              </button>
            `
          : ''}
      </div>
    `;
  }

  private _renderDeviceStreams() {
    // Transform deviceDataStreams to the format expected by hid-devices
    const streams: DeviceStream[] = Array.from(this.deviceDataStreams.entries()).map(([index, data]) => ({
      index,
      lastPacket: data.lastPacket,
      packetCount: data.packetCount,
      lastUpdate: data.lastUpdate
    }));

    // Build device details map
    const deviceDetails = new Map<number, DeviceDetails>();
    streams.forEach(stream => {
      if (stream.index === -1) {
        // Mock device
        deviceDetails.set(-1, { usagePage: 13, usage: 2 });
      } else {
        const device = this.realDevices[stream.index];
        if (device) {
          const collection = device.collections[0];
          deviceDetails.set(stream.index, {
            usagePage: collection?.usagePage,
            usage: collection?.usage,
            opened: device.opened
          });
        }
      }
    });

    // Get bytes data for display
    const { bytesData, deviceInfo, isEmpty } = this._getBytesDisplayData();

    return html`
      <div class="section">
        <h3>Device Interfaces</h3>
        <hid-devices
          .streams=${streams}
          .deviceDetails=${deviceDetails}
          .bytes=${bytesData}
          .bytesEmpty=${isEmpty}
          .bytesPlaceholderCount=${9}
          .bytesDeviceInfo=${deviceInfo}
          .isConnected=${this.isRealDevice}
          .connectedDeviceName=${this.realDeviceName}
          .isDeviceOpened=${this.realDevice?.opened || false}
          @disconnect=${this._disconnectRealDevice}>
        </hid-devices>
      </div>
    `;
  }

  private _getBytesDisplayData(): { bytesData: ByteData[], deviceInfo: DeviceInfo | undefined, isEmpty: boolean } {
    // Use current packets if available, otherwise use last captured packets
    const packetsToShow = this.capturedPackets.length > 0
      ? this.capturedPackets
      : this.lastCapturedPackets;

    // Get device info for the active device
    const activeDeviceIndex = this.currentActiveDeviceIndex;
    const deviceStream = activeDeviceIndex !== undefined ? this.deviceDataStreams.get(activeDeviceIndex) : undefined;

    // Handle mock device (index -1) vs real devices
    const isMockDevice = activeDeviceIndex === -1;
    const device = isMockDevice ? null : (activeDeviceIndex !== undefined ? this.realDevices[activeDeviceIndex] : undefined);
    const collection = device?.collections[0];

    const deviceInfo: DeviceInfo | undefined = activeDeviceIndex !== undefined ? {
      deviceNumber: activeDeviceIndex,
      packetCount: deviceStream?.packetCount || 0,
      usagePage: isMockDevice ? 13 : collection?.usagePage,
      usage: isMockDevice ? 2 : collection?.usage,
      isMock: isMockDevice
    } : undefined;

    if (packetsToShow.length === 0) {
      return { bytesData: [], deviceInfo, isEmpty: true };
    }

    // Get the latest packet
    const latestPacket = packetsToShow[packetsToShow.length - 1];

    // Analyze captured packets in real-time
    const analysis = analyzeBytes(packetsToShow);

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

    // Filter out likely status/report bytes
    const movementAnalysis = analysis.filter(byte => {
      if (knownByteIndices.has(byte.byteIndex)) return false;
      if (byte.variance === 0) return false;
      if (byte.variance < 10) {
        const uniqueValues = new Set(this.capturedPackets.map(p => p[byte.byteIndex]));
        if (uniqueValues.size <= 5) return false;
      }
      return true;
    });

    // Get best guess bytes (top 3 by variance)
    const bestGuessBytes = getBestGuessBytesByVariance(movementAnalysis, 3);
    const bestGuessIndices = new Set(bestGuessBytes.map(b => b.byteIndex));

    // Create a map of byte index to analysis data
    const analysisMap = new Map(analysis.map(a => [a.byteIndex, a]));

    // Compute real-time best guess labels for current step
    const realtimeLabels = this._getRealtimeBestGuessLabels(bestGuessBytes);

    // Build byte data array
    const bytesData: ByteData[] = Array.from(latestPacket).map((value, byteIndex) => {
      const isBestGuess = bestGuessIndices.has(byteIndex);
      const analysisData = analysisMap.get(byteIndex);
      const byteLabel = this._getByteLabel(byteIndex) || realtimeLabels.get(byteIndex) || undefined;

      return {
        byteIndex,
        value,
        min: analysisData?.min,
        max: analysisData?.max,
        variance: analysisData?.variance,
        isBestGuess,
        isIdentified: !!byteLabel,
        label: byteLabel
      };
    });

    return { bytesData, deviceInfo, isEmpty: false };
  }



  private _renderActiveDeviceInfo() {
    if (this.activeDeviceIndices.size === 0) return '';

    const activeDevices = Array.from(this.activeDeviceIndices).map(index => {
      const isMock = index === -1;
      const device = isMock ? null : this.realDevices[index];

      if (!isMock && !device) return null;

      const collection = device?.collections[0];
      return {
        index,
        isMock,
        usagePage: isMock ? 13 : collection?.usagePage,
        usage: isMock ? 2 : collection?.usage,
        opened: device?.opened
      };
    }).filter(d => d !== null);

    if (activeDevices.length === 0) return '';

    return html`
      <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid rgba(0,0,0,0.1);">
        ${activeDevices.map(device => html`
          <div style="font-size: 13px; margin-top: 5px;">
            <strong>${device.isMock ? 'Simulated' : `Device ${device.index}`}:</strong>
            Usage Page ${device.usagePage}, Usage ${device.usage}
            ${device.usagePage === 13 && device.usage === 2 ? html`
              <span style="color: ${device.isMock ? '#ff9800' : '#2e7d32'};">
                ${device.isMock ? ' (Simulated Pen)' : ' (Digitizer - Pen)'}
              </span>
            ` : ''}
          </div>
        `)}
      </div>
    `;
  }

  private _renderWalkthrough() {
    // For step10-metadata and complete, render custom content
    if (this.walkthroughStep === 'step10-metadata') {
      return html`
        <div class="section walkthrough active">
          <hid-walkthrough
            .currentStep=${this.walkthroughStep}
            .isPlaying=${this.isPlaying}
            .capturedPacketCount=${this.capturedPackets.length}
            @play-gesture=${(e: CustomEvent) => this._playGesture(e.detail.gesture)}
            @step-complete=${() => this._completeManualStep('metadata')}
            @step-reset=${this._resetCapture}
            @metadata-submit=${this._handleMetadataSubmit}
          ></hid-walkthrough>
        </div>
      `;
    }

    if (this.walkthroughStep === 'complete') {
      return html`
        <div class="section walkthrough active">
          <div class="step-header">
            <h3>✅ Configuration Complete!</h3>
            <button class="icon-button" @click="${this._resetCapture}" title="Reset">🔄</button>
            <button class="icon-button" disabled title="Next Step">→</button>
          </div>
          <p>Your complete device configuration is ready!</p>

          ${this._renderConfigPanel()}
        </div>
      `;
    }

    // For all other steps, use the walkthrough component
    return html`
      <hid-walkthrough
        .currentStep=${this.walkthroughStep}
        .isPlaying=${this.isPlaying}
        .capturedPacketCount=${this.capturedPackets.length}
        .horizontalBytes=${this.horizontalBytes}
        .verticalBytes=${this.verticalBytes}
        .pressureBytes=${this.pressureBytes}
        .tiltXBytes=${this.tiltXBytes}
        .tiltYBytes=${this.tiltYBytes}
        .tabletButtonBytes=${this.tabletButtonBytes}
        .detectedButtonStates=${this.detectedButtonStates}
        .deviceConfig=${this.deviceConfig}
        .completeConfig=${this.completeConfig}
        @play-gesture=${(e: CustomEvent) => this._playGesture(e.detail.gesture)}
        @step-complete=${() => this._completeManualStep(this._getGestureForStep(this.walkthroughStep))}
        @step-reset=${this._resetCapture}
      ></hid-walkthrough>
    `;
  }

  private _getGestureForStep(step: WalkthroughStep): string {
    const gestureMap: Record<string, string> = {
      'step1-horizontal': 'horizontal',
      'step2-vertical': 'vertical',
      'step3-pressure': 'pressure',
      'step4-hover-movement': 'hover-movement',
      'step5-tilt-x': 'tilt-x',
      'step6-tilt-y': 'tilt-y',
      'step7-primary-button': 'primary-button',
      'step8-secondary-button': 'secondary-button',
      'step9-tablet-buttons': 'tablet-buttons',
    };
    return gestureMap[step] || '';
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
          <h4>📋 Detected Byte Mappings</h4>
        </div>

        <div class="config-grid">
          ${this.deviceConfig.status ? this._renderStatusConfig(this.deviceConfig.status) : ''}
          ${this._renderCoordinateConfig('X Coordinate', this.deviceConfig.x, '↔️')}
          ${this._renderCoordinateConfig('Y Coordinate', this.deviceConfig.y, '↕️')}
          ${this._renderCoordinateConfig('Pressure', this.deviceConfig.pressure, '💪')}
          ${this.deviceConfig.tiltX ? this._renderTiltConfig('Tilt X', this.deviceConfig.tiltX, '↔️') : ''}
          ${this.deviceConfig.tiltY ? this._renderTiltConfig('Tilt Y', this.deviceConfig.tiltY, '↕️') : ''}
        </div>
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

    // Initialize mock device stream with index -1
    this.deviceDataStreams.set(-1, {
      lastPacket: '',
      packetCount: 0,
      lastUpdate: Date.now()
    });

    this.mockDevice.addEventListener('inputreport', (dataArray: Uint8Array) => {
      // Route mock data through device data handler with index -1
      this._handleDeviceData(-1, dataArray);
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
      await this.deviceFinder.checkForExistingDevices();
    } catch (error) {
      console.error('[HIDDataReader] Error checking for devices:', error);
    }
  }

  private async _connectRealDevice() {
    if (!this.deviceFinder) return;

    this.isConnecting = true;

    try {
      // Request device with optional filters (empty array shows all HID devices)
      await this.deviceFinder.requestDevice([]);
    } catch (error) {
      console.error('[HIDDataReader] Error connecting device:', error);
      alert('Failed to connect to device. Please try again.');
    } finally {
      this.isConnecting = false;
    }
  }

  private async _handleDeviceConnected(result: DeviceConnectionResult) {
    this.realDevice = result.primaryDevice;
    this.realDevices = result.allDevices;
    this.realDeviceName = result.deviceInfo.name;
    this.isRealDevice = true;

    // Capture device metadata for configuration generation
    this.deviceMetadata = {
      vendorId: result.primaryDevice.vendorId,
      productId: result.primaryDevice.productId,
      productName: result.primaryDevice.productName,
      collections: result.primaryDevice.collections
        .filter(c => c.usagePage !== undefined && c.usage !== undefined)
        .map(c => ({
          usagePage: c.usagePage!,
          usage: c.usage!
        })),
      allInterfaces: result.allDevices
        .flatMap(d => d.collections.map(c => c.usagePage))
        .filter((v): v is number => v !== undefined)
        .filter((v, i, a) => a.indexOf(v) === i) // unique values
    };

    // Initialize device data streams
    // Preserve the mock device stream (index -1) if it exists
    const mockStream = this.deviceDataStreams.get(-1);
    this.deviceDataStreams.clear();
    if (mockStream) {
      this.deviceDataStreams.set(-1, mockStream);
    }
    result.allDevices.forEach((_, index) => {
      this.deviceDataStreams.set(index, { lastPacket: '', packetCount: 0, lastUpdate: 0 });
    });

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
    });

    // Wait a microtask to ensure listener is registered
    await new Promise(resolve => setTimeout(resolve, 10));

    // NOW open the device to start receiving data
    if (!this.realDevice.opened) {
      try {
        await this.realDevice.open();
        // Force re-render to update status
        this.requestUpdate();
      } catch (error) {
        console.error('[HIDDataReader] Error opening device:', error);
        alert(`Failed to open device: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  private _handleDeviceDisconnected() {
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
    if (this.walkthroughStep !== 'idle' && this.walkthroughStep !== 'step10-metadata' && this.walkthroughStep !== 'complete') {
      this.activeDeviceIndices.add(deviceIndex);
      // Update the current active device whenever data comes in during walkthrough
      this.currentActiveDeviceIndex = deviceIndex;
    }

    // Capture report ID from first packet (if not already captured)
    if (!this.deviceMetadata.detectedReportId && data.length > 0) {
      this.deviceMetadata.detectedReportId = data[0];
    }

    // Also update the main display (for backwards compatibility)
    this._handleRawBytes(data);

    // Force a re-render to update device info in bytes display
    this.requestUpdate();
  }

  private _handleRawBytes(data: Uint8Array) {
    // Convert bytes to hex string for display
    const hexString = Array.from(data)
      .map(byte => byte.toString(16).padStart(2, '0').toUpperCase())
      .join(' ');

    this.byteCount++;

    // Update current display with latest packet
    this.currentBytes = hexString;

    // Track button states in real-time during tablet buttons step
    if (this.walkthroughStep === 'step9-tablet-buttons' && data.length > 9) {
      // Button data is typically in byte 9 (0-based index) for our mock device
      const buttonByte = data[9];
      if (buttonByte > 0) {
        // Add this button state to our set
        this.detectedButtonStates = new Set([...this.detectedButtonStates, buttonByte]);
      }
    }

    // Capture packets during walkthrough steps
    const isInWalkthroughStep = this.walkthroughStep !== 'idle' && this.walkthroughStep !== 'step10-metadata' && this.walkthroughStep !== 'complete';
    if (isInWalkthroughStep) {
      this.capturedPackets.push(new Uint8Array(data));
    }
  }

  private _identifySignificantBytes(analysis: ByteAnalysis[], threshold = 10): ByteAnalysis[] {
    // Return bytes that have significant variance (likely coordinate data)
    return analysis.filter(byte => byte.variance > threshold);
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
    if (this.walkthroughStep === 'step4-hover-movement' && !['hover-horizontal', 'hover-vertical', 'circle'].includes(gesture)) {
      return; // Allow any hover movement in step 4
    }
    if (this.walkthroughStep === 'step5-tilt-x' && gesture !== 'tilt-x') {
      return; // Only allow tilt X in step 5
    }
    if (this.walkthroughStep === 'step6-tilt-y' && gesture !== 'tilt-y') {
      return; // Only allow tilt Y in step 6
    }
    if (this.walkthroughStep === 'step7-primary-button' && gesture !== 'primary-button') {
      return; // Only allow primary button in step 7
    }
    if (this.walkthroughStep === 'step8-secondary-button' && gesture !== 'secondary-button') {
      return; // Only allow secondary button in step 8
    }
    if (this.walkthroughStep === 'step9-tablet-buttons' && gesture !== 'tablet-buttons') {
      return; // Only allow tablet buttons in step 10
    }

    // Just inject data - don't auto-start or auto-complete
    // The user controls when to start/stop capturing
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
      case 'tablet-buttons':
        this.mockDevice.playTabletButtons();
        break;
      default:
        this.mockDevice.playCircle();
    }

    // Auto-stop when gesture completes (but don't auto-advance the step)
    // Add extra time (200ms) to allow pen away packets to be sent
    const gestureDuration = this._getGestureDuration(gesture);
    const extraTimeForPenAway = 200; // Time for 5 packets at 200Hz = 25ms, but add buffer

    setTimeout(() => {
      if (this.isPlaying && this.currentGesture === gesture) {
        this._stopGesture();
      }
    }, gestureDuration + extraTimeForPenAway);
  }

  private _handleGestureComplete(gesture: string) {
    // Process captured data if in walkthrough mode
    if (this.walkthroughStep === 'step1-horizontal' && gesture === 'horizontal') {
      // Save packets for persistent live view
      this.lastCapturedPackets = [...this.capturedPackets];

      // Track status byte for contact FIRST
      this._trackStatusByte('contact');

      // Now analyze bytes, excluding the status byte (byte 0)
      const analysis = analyzeBytes(this.capturedPackets);
      // Exclude byte 0 (status byte) from coordinate detection
      const filteredAnalysis = analysis.filter(b => b.byteIndex !== 0);
      // Store best guess bytes for horizontal movement (top 2 bytes for X coordinate)
      this.horizontalBytes = getBestGuessBytesByVariance(filteredAnalysis, 2);

      this.walkthroughStep = 'step2-vertical';
      this.capturedPackets = [];
    } else if (this.walkthroughStep === 'step2-vertical' && gesture === 'vertical') {
      this.lastCapturedPackets = [...this.capturedPackets];
      const analysis = analyzeBytes(this.capturedPackets);
      // Filter out bytes we already identified in step 1 (X coordinate and status byte 0)
      const knownByteIndices = new Set([0, ...this.horizontalBytes.map(b => b.byteIndex)]);
      const filteredAnalysis = analysis.filter(b => !knownByteIndices.has(b.byteIndex));
      // Store best guess bytes for vertical movement (top 2 bytes for Y coordinate)
      this.verticalBytes = getBestGuessBytesByVariance(filteredAnalysis, 2);
      this.walkthroughStep = 'step3-pressure';
      this.capturedPackets = [];
    } else if (this.walkthroughStep === 'step3-pressure' && gesture === 'pressure') {
      this.lastCapturedPackets = [...this.capturedPackets];
      const analysis = analyzeBytes(this.capturedPackets);
      // Filter out bytes we already identified (X, Y coordinates, and status byte 0)
      const knownByteIndices = new Set([
        0,
        ...this.horizontalBytes.map(b => b.byteIndex),
        ...this.verticalBytes.map(b => b.byteIndex),
      ]);
      const filteredAnalysis = analysis.filter(b => !knownByteIndices.has(b.byteIndex));
      // Store best guess bytes for pressure (top 2 bytes)
      this.pressureBytes = getBestGuessBytesByVariance(filteredAnalysis, 2);
      this.walkthroughStep = 'step4-hover-movement';
      this.capturedPackets = [];
    } else if (this.walkthroughStep === 'step4-hover-movement' && (gesture === 'hover-horizontal' || gesture === 'hover-vertical' || gesture === 'circle' || gesture === 'hover-movement')) {
      this.lastCapturedPackets = [...this.capturedPackets];

      // Track status byte for hover FIRST
      this._trackStatusByte('hover');

      // Use the X and Y bytes we already detected in steps 1 and 2
      // Step 4 is just to verify they work in hover mode (without pressure)
      // We don't need to re-detect them
      this.hoverHorizontalBytes = this.horizontalBytes;
      this.hoverVerticalBytes = this.verticalBytes;

      // Note: horizontalBytes and verticalBytes are already set from steps 1 and 2
      // No need to call _identifyCoordinateAndPressureBytes() since they're already correct

      this.walkthroughStep = 'step5-tilt-x';
      this.capturedPackets = [];
    } else if (this.walkthroughStep === 'step5-tilt-x' && gesture === 'tilt-x') {
      this.lastCapturedPackets = [...this.capturedPackets];
      const analysis = analyzeBytes(this.capturedPackets);
      // Filter out already-identified bytes (status byte 0, X, Y, pressure)
      const knownByteIndices = new Set([
        0,
        ...this.horizontalBytes.map(b => b.byteIndex),
        ...this.verticalBytes.map(b => b.byteIndex),
        ...this.pressureBytes.map(b => b.byteIndex),
      ]);
      const tiltOnlyBytes = analysis.filter(b => !knownByteIndices.has(b.byteIndex));
      this.tiltXBytes = getBestGuessBytesByVariance(tiltOnlyBytes, 1); // Just the top byte
      this.walkthroughStep = 'step6-tilt-y';
      this.capturedPackets = [];
    } else if (this.walkthroughStep === 'step6-tilt-y' && gesture === 'tilt-y') {
      this.lastCapturedPackets = [...this.capturedPackets];
      const analysis = analyzeBytes(this.capturedPackets);
      // Filter out already-identified bytes (status byte 0, X, Y, pressure, AND tilt-X)
      const knownByteIndices = new Set([
        0,
        ...this.horizontalBytes.map(b => b.byteIndex),
        ...this.verticalBytes.map(b => b.byteIndex),
        ...this.pressureBytes.map(b => b.byteIndex),
        ...this.tiltXBytes.map(b => b.byteIndex), // Exclude tilt-X from step 5
      ]);
      const tiltOnlyBytes = analysis.filter(b => !knownByteIndices.has(b.byteIndex));
      this.tiltYBytes = getBestGuessBytesByVariance(tiltOnlyBytes, 1); // Just the top byte

      // Identify tilt bytes
      this._identifyTiltBytes();

      this.walkthroughStep = 'step7-primary-button';
      this.capturedPackets = [];
    } else if (this.walkthroughStep === 'step7-primary-button' && gesture === 'primary-button') {
      this.lastCapturedPackets = [...this.capturedPackets];
      // Track status byte values for primary button (both hover and contact states)
      if (this.capturedPackets.length > 0) {
        // Add packets to the collection for status byte detection
        this.allWalkthroughPackets.push(...this.capturedPackets);

        const statusByteIndex = this._findStatusByteFromAllPackets();

        if (statusByteIndex !== null) {
          // Track all unique status byte values in the captured packets
          const uniqueStatusBytes = new Set(this.capturedPackets.map(p => p[statusByteIndex]));

          uniqueStatusBytes.forEach(statusByte => {
            // Check if this is a "pen away" packet (all zeros except status byte)
            const samplePacket = this.capturedPackets.find(p => p[statusByteIndex] === statusByte);
            if (samplePacket) {
              const allZeros = samplePacket.slice(1).every(b => b === 0);

              if (allZeros) {
                // This is a "pen away" packet - skip it, already tracked as "none"
                return;
              }

              const pressure = samplePacket[5] | (samplePacket[6] << 8);
              const state = pressure > 0 ? 'contact' : 'hover';

              this.statusByteValues.set(statusByte, {
                state,
                primaryButtonPressed: true,
              });
            }
          });
        }
      }
      this.walkthroughStep = 'step8-secondary-button';
      this.capturedPackets = [];
    } else if (this.walkthroughStep === 'step8-secondary-button' && gesture === 'secondary-button') {
      this.lastCapturedPackets = [...this.capturedPackets];
      // Track status byte values for secondary button (both hover and contact states)
      if (this.capturedPackets.length > 0) {
        // Add packets to the collection for status byte detection
        this.allWalkthroughPackets.push(...this.capturedPackets);

        const statusByteIndex = this._findStatusByteFromAllPackets();

        if (statusByteIndex !== null) {
          // Track all unique status byte values in the captured packets
          const uniqueStatusBytes = new Set(this.capturedPackets.map(p => p[statusByteIndex]));

          uniqueStatusBytes.forEach(statusByte => {
            // Check if this is a "pen away" packet (all zeros except status byte)
            const samplePacket = this.capturedPackets.find(p => p[statusByteIndex] === statusByte);
            if (samplePacket) {
              const allZeros = samplePacket.slice(1).every(b => b === 0);

              if (allZeros) {
                // This is a "pen away" packet - skip it, already tracked as "none"
                return;
              }

              const pressure = samplePacket[5] | (samplePacket[6] << 8);
              const state = pressure > 0 ? 'contact' : 'hover';

              this.statusByteValues.set(statusByte, {
                state,
                secondaryButtonPressed: true,
              });
            }
          });
        }
      }

      // Move to tablet buttons step
      this.walkthroughStep = 'step9-tablet-buttons';
      this.capturedPackets = [];
    } else if (this.walkthroughStep === 'step9-tablet-buttons' && gesture === 'tablet-buttons') {
      this.lastCapturedPackets = [...this.capturedPackets];

      // Detect button byte if we have captured packets
      if (this.capturedPackets.length > 0) {
        // Add packets to the collection
        this.allWalkthroughPackets.push(...this.capturedPackets);

        // Filter to only button packets (status byte = 0xF0)
        // Button packets have a different structure than stylus packets
        const buttonPackets = this.capturedPackets.filter(p => p[0] === 0xF0);

        if (buttonPackets.length > 0) {
          // Analyze bytes in button packets only
          const analysis = analyzeBytes(buttonPackets);

          // Look for bytes with variance and multiple distinct values (bit flags)
          // Button bytes should have:
          // 1. Multiple distinct values (one for each button)
          // 2. Values that are powers of 2 or combinations thereof
          // 3. Variance > 0
          const candidateBytes = analysis.filter(b => {
            if (b.byteIndex === 0) return false; // Skip status byte
            if (b.variance === 0) return false; // Skip constant bytes

            // Check if values look like bit flags (powers of 2)
            const uniqueValues = new Set<number>();
            for (const packet of buttonPackets) {
              uniqueValues.add(packet[b.byteIndex]);
            }

            // Button bytes typically have multiple distinct values
            return uniqueValues.size > 1;
          });

          if (candidateBytes.length > 0) {
            // Take the first byte with variance as the button byte
            this.tabletButtonBytes = [candidateBytes[0]];
          }
        }
      }

      // Generate final config with status byte mappings and button mappings
      this._generateDeviceConfig();

      // Move to metadata form step
      this.walkthroughStep = 'step10-metadata';
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

    const analysis = analyzeBytes(this.capturedPackets);
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

  private _findStatusByteFromAllPackets(): number | null {
    // Find the status byte by analyzing ALL packets collected during the walkthrough
    // This allows us to see variance across different states (hover, contact, buttons)
    if (this.allWalkthroughPackets.length === 0) return null;

    const analysis = analyzeBytes(this.allWalkthroughPackets);
    const knownByteIndices = new Set([
      ...this.horizontalBytes.map(b => b.byteIndex),
      ...this.verticalBytes.map(b => b.byteIndex),
      ...this.pressureBytes.map(b => b.byteIndex),
      ...this.hoverHorizontalBytes.map(b => b.byteIndex),
      ...this.hoverVerticalBytes.map(b => b.byteIndex),
      ...this.tiltXBytes.map(b => b.byteIndex),
      ...this.tiltYBytes.map(b => b.byteIndex),
    ]);

    // Look for a byte with multiple distinct values (status codes) but not continuous variation
    // Status byte characteristics:
    // - Has multiple distinct values (2-10 unique values for different states)
    // - Values are discrete codes, not continuous ranges
    // - Not already identified as coordinate/pressure/tilt
    for (const byte of analysis) {
      if (knownByteIndices.has(byte.byteIndex)) continue;
      if (byte.variance === 0) continue; // Skip constant bytes

      const uniqueValues = new Set(this.allWalkthroughPackets.map(p => p[byte.byteIndex]));

      // Status byte should have 2-10 unique values (different states)
      // Don't filter by variance - status byte can have moderate variance
      if (uniqueValues.size >= 2 && uniqueValues.size <= 10) {
        return byte.byteIndex;
      }
    }

    return null;
  }

  private _trackStatusByte(state: string) {
    if (this.capturedPackets.length > 0) {
      // Add packets to the collection for status byte detection
      this.allWalkthroughPackets.push(...this.capturedPackets);

      // Find the status byte by looking at all packets collected so far
      const statusByteIndex = this._findStatusByteFromAllPackets();

      if (statusByteIndex !== null) {
        // Track all unique status bytes in the captured packets
        const uniqueStatusBytes = new Set(this.capturedPackets.map(p => p[statusByteIndex]));

        uniqueStatusBytes.forEach(statusByte => {
          if (!this.statusByteValues.has(statusByte)) {
            // Check if this is a "pen away" packet (all zeros except status byte)
            const samplePacket = this.capturedPackets.find(p => p[statusByteIndex] === statusByte);
            if (samplePacket) {
              const allZeros = samplePacket.slice(1).every(b => b === 0);
              const actualState = allZeros ? 'none' : state;

              this.statusByteValues.set(statusByte, { state: actualState });
            }
          }
        });
      } else {
        // Fallback: use byte 0 if we can't detect it yet (early in walkthrough)
        const uniqueStatusBytes = new Set(this.capturedPackets.map(p => p[0]));
        uniqueStatusBytes.forEach(statusByte => {
          if (!this.statusByteValues.has(statusByte)) {
            const samplePacket = this.capturedPackets.find(p => p[0] === statusByte);
            if (samplePacket) {
              const allZeros = samplePacket.slice(1).every(b => b === 0);
              const actualState = allZeros ? 'none' : state;

              this.statusByteValues.set(statusByte, { state: actualState });
            }
          }
        });
      }
    }
  }

  private _generateDeviceConfig() {
    // Use the utility function to generate the config
    // Pass allWalkthroughPackets so findStatusByte can analyze variance across all states
    this.deviceConfig = generateDeviceConfig(
      this.horizontalBytes,
      this.verticalBytes,
      this.pressureBytes,
      this.tiltXBytes,
      this.tiltYBytes,
      this.statusByteValues,
      this.allWalkthroughPackets,
      this.tabletButtonBytes
    );
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
      'tablet-buttons': 2000, // Time to press all 8 buttons
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


  private _getByteLabel(byteIndex: number): string | null {
    // Return the best guess label for what this byte represents
    // Based on what we've discovered so far in the walkthrough

    // Check X coordinate (from hover horizontal or contact horizontal)
    if (this.hoverHorizontalBytes.some(b => b.byteIndex === byteIndex)) {
      return 'X';
    }
    if (this.horizontalBytes.some(b => b.byteIndex === byteIndex)) {
      return 'X';
    }

    // Check Y coordinate (from hover vertical or contact vertical)
    if (this.hoverVerticalBytes.some(b => b.byteIndex === byteIndex)) {
      return 'Y';
    }
    if (this.verticalBytes.some(b => b.byteIndex === byteIndex)) {
      return 'Y';
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

  private _getRealtimeBestGuessLabels(bestGuessBytes: ByteAnalysis[]): Map<number, string> {
    const labels = new Map<number, string>();

    // Only show real-time labels if we're actively capturing and don't have confirmed bytes yet
    if (this.capturedPackets.length === 0) return labels;

    // Step 1: Horizontal movement - label as X
    if (this.walkthroughStep === 'step1-horizontal' && this.horizontalBytes.length === 0) {
      bestGuessBytes.slice(0, 2).forEach(byte => labels.set(byte.byteIndex, 'X'));
    }

    // Step 2: Vertical movement - label as Y
    if (this.walkthroughStep === 'step2-vertical' && this.verticalBytes.length === 0) {
      bestGuessBytes.slice(0, 2).forEach(byte => labels.set(byte.byteIndex, 'Y'));
    }

    // Step 3: Pressure - label as Pressure
    if (this.walkthroughStep === 'step3-pressure' && this.pressureBytes.length === 0) {
      bestGuessBytes.slice(0, 2).forEach(byte => labels.set(byte.byteIndex, 'Pressure'));
    }

    // Step 4: Hover movement - label top 4 bytes as X and Y
    if (this.walkthroughStep === 'step4-hover-movement' && this.hoverHorizontalBytes.length === 0 && this.hoverVerticalBytes.length === 0) {
      // Label first 2 bytes as X, next 2 as Y
      if (bestGuessBytes.length >= 2) {
        bestGuessBytes.slice(0, 2).forEach(byte => labels.set(byte.byteIndex, 'X'));
      }
      if (bestGuessBytes.length >= 4) {
        bestGuessBytes.slice(2, 4).forEach(byte => labels.set(byte.byteIndex, 'Y'));
      }
    }

    // Step 5: Tilt X - label as Tilt-X
    if (this.walkthroughStep === 'step5-tilt-x' && this.tiltXBytes.length === 0) {
      if (bestGuessBytes.length > 0) labels.set(bestGuessBytes[0].byteIndex, 'Tilt-X');
    }

    // Step 6: Tilt Y - label as Tilt-Y
    if (this.walkthroughStep === 'step6-tilt-y' && this.tiltYBytes.length === 0) {
      if (bestGuessBytes.length > 0) labels.set(bestGuessBytes[0].byteIndex, 'Tilt-Y');
    }

    return labels;
  }

  private _renderStepButtons(gesture: string, mockLabel: string) {
    return html`
      <div class="step-buttons">
        <div class="button-group">
          <button
            class="button secondary"
            ?disabled="${this.isPlaying}"
            @click="${() => this._playGesture(gesture)}">
            ${this.isPlaying ? '⏳ Simulating...' : `🤖 ${mockLabel}`}
          </button>
          <button class="button secondary" @click="${this._resetCapture}">
            🔄 Reset
          </button>
          <button class="button primary" @click="${() => this._completeManualStep(gesture)}">
            ✓ Done - Next Step
          </button>
        </div>
      </div>
    `;
  }

  private _resetCapture() {
    // Clear captured packets and restart capture
    this.capturedPackets = [];

    // Clear active device indices so the display updates when switching devices
    this.activeDeviceIndices.clear();

    // Clear the current active device so it gets set by the next device that sends data
    this.currentActiveDeviceIndex = undefined;

    // Reset button states if in tablet buttons step
    if (this.walkthroughStep === 'step9-tablet-buttons') {
      this.detectedButtonStates = new Set();
    }

    this.requestUpdate();
  }

  private _completeManualStep(gesture: string) {
    // Process the captured data as if the gesture completed
    this._handleGestureComplete(gesture);
  }

  private _resetWalkthrough() {
    this.walkthroughStep = 'step1-horizontal';
    this.horizontalBytes = [];
    this.verticalBytes = [];
    this.tiltXBytes = [];
    this.tiltYBytes = [];
    this.hoverHorizontalBytes = [];
    this.hoverVerticalBytes = [];
    this.pressureBytes = [];
    this.deviceConfig = null;
    this.capturedPackets = [];
    this.lastCapturedPackets = [];
    this.allWalkthroughPackets = [];
    this.statusByteValues.clear();
    this._clearBytes();
  }

  private _getConfigMetadata(): string {
    // No metadata/comments - JSON doesn't support comments
    return '';
  }

  private _renderConfigPanel() {
    if (!this.deviceConfig) return '';

    const metadata = this._getConfigMetadata();

    return html`
      <div class="config-panel">
        <div class="config-panel-header" @click="${() => this.isConfigPanelExpanded = !this.isConfigPanelExpanded}">
          <h4>📄 Device Configuration</h4>
          <span class="collapse-icon">${this.isConfigPanelExpanded ? '▼' : '▶'}</span>
        </div>
        ${this.isConfigPanelExpanded ? html`
          <hid-json-config .config=${this.completeConfig || this.deviceConfig} .metadata=${metadata}></hid-json-config>
        ` : ''}
      </div>
    `;
  }

  private _handleMetadataSubmit(e: CustomEvent<MetadataFormData>) {
    const userMetadata: UserProvidedMetadata = e.detail;

    // Generate complete configuration
    this.completeConfig = generateCompleteConfig(
      this.deviceMetadata,
      userMetadata,
      this.deviceConfig!
    );

    // Move to complete step
    this.walkthroughStep = 'complete';
    this.isConfigPanelExpanded = true;
  }

  private _handleMetadataCancel() {
    // Can't cancel - this is a required step
    // Just stay on the metadata form
  }

  private _generateSuggestedName(): string {
    // Use product name from WebHID if available
    return this.deviceMetadata.productName || 'Unknown Tablet';
  }

  private _generateSuggestedManufacturer(): string {
    // Try to extract manufacturer from product name
    const productName = this.deviceMetadata.productName || '';

    // Common patterns: "Manufacturer Model" or "Manufacturer-Model"
    const parts = productName.split(/[\s-]/);
    if (parts.length > 0) {
      return parts[0];
    }

    return '';
  }

  private _generateSuggestedModel(): string {
    // Try to extract model from product name
    const productName = this.deviceMetadata.productName || '';

    // If product name has multiple parts, use everything after the first part
    const parts = productName.split(/[\s-]/);
    if (parts.length > 1) {
      return parts.slice(1).join(' ');
    }

    // Otherwise use the whole product name
    return productName;
  }

  private _generateSuggestedDescription(): string {
    const manufacturer = this._generateSuggestedManufacturer();
    const model = this._generateSuggestedModel();
    const hasTilt = this.deviceConfig?.tiltX || this.deviceConfig?.tiltY;

    let desc = '';
    if (manufacturer && model) {
      desc = `${manufacturer} ${model} graphics tablet`;
    } else if (this.deviceMetadata.productName) {
      desc = `${this.deviceMetadata.productName} graphics tablet`;
    } else {
      desc = 'Graphics tablet';
    }

    // Add features
    const features: string[] = [];
    if (hasTilt) {
      features.push('with tilt support');
    }

    if (features.length > 0) {
      desc += ' ' + features.join(', ');
    }

    return desc;
  }

  private _generateSuggestedButtonCount(): number {
    // Default to 0 - user should specify
    // Could potentially detect from button interface, but safer to ask
    return 0;
  }


}

declare global {
  interface HTMLElementTagNameMap {
    'hid-data-reader': HidDataReader;
  }
}

