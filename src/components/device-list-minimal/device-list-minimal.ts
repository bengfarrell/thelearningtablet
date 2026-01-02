import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { styles } from './device-list-minimal.styles.js';

export interface DeviceStream {
  index: number;
  lastPacket: string;
  packetCount: number;
  lastUpdate: number;
}

export interface DeviceDetails {
  usagePage?: number;
  usage?: number;
  opened?: boolean;
}

/**
 * Component that displays a minimal list of connected HID device interfaces
 */
@customElement('device-list-minimal')
export class DeviceListMinimal extends LitElement {
  static styles = styles;

  @property({ type: Array })
  streams: DeviceStream[] = [];

  @property({ type: Object })
  deviceDetails: Map<number, DeviceDetails> = new Map();

  render() {
    return html`
      <div class="device-list-minimal">
        <div class="device-list-header">
          <span class="device-count">${this.streams.length} interface${this.streams.length !== 1 ? 's' : ''} detected</span>
        </div>
        <div class="device-chips">
          ${this.streams.map(stream => {
            const isActive = stream.packetCount > 0;
            const isMock = stream.index === -1;
            const details = this.deviceDetails.get(stream.index);
            const isDigitizer = details?.usagePage === 13 && details?.usage === 2;
            const deviceLabel = isMock ? 'Simulated' : `Device ${stream.index}`;

            return html`
              <div class="device-chip ${isActive ? 'active' : 'inactive'} ${isMock ? 'mock' : ''}">
                <span class="chip-icon">${isActive ? '✅' : '⚪'}</span>
                <span class="chip-label">${deviceLabel}</span>
                ${isDigitizer ? html`<span class="chip-badge">Pen</span>` : ''}
                ${isMock ? html`<span class="chip-badge mock-badge">Mock</span>` : ''}
                ${isActive ? html`<span class="chip-count">${stream.packetCount}</span>` : ''}
              </div>
            `;
          })}
        </div>

        <div class="device-details">
          ${this.streams.map(stream => {
            const isMock = stream.index === -1;
            const details = this.deviceDetails.get(stream.index);
            const isDigitizer = details?.usagePage === 13 && details?.usage === 2;
            const deviceLabel = isMock ? 'Simulated' : `Device ${stream.index}`;

            return html`
              <div class="device-detail-row">
                <span class="detail-label">${deviceLabel}:</span>
                ${isMock ? html`
                  <span class="detail-value">Mock Data Generator</span>
                  <span class="detail-value">Usage Page: 13</span>
                  <span class="detail-value">Usage: 2</span>
                  <span class="detail-value">Packets: ${stream.packetCount}</span>
                  <span class="detail-badge mock-badge">Simulated Pen</span>
                ` : html`
                  <span class="detail-value">Usage Page: ${details?.usagePage ?? 'N/A'}</span>
                  <span class="detail-value">Usage: ${details?.usage ?? 'N/A'}</span>
                  <span class="detail-value">Packets: ${stream.packetCount}</span>
                  ${isDigitizer ? html`<span class="detail-badge">Digitizer - Pen</span>` : ''}
                `}
              </div>
            `;
          })}
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'device-list-minimal': DeviceListMinimal;
  }
}

