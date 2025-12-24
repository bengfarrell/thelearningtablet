import { LitElement, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { styles } from './tablet-status.styles.js';

/**
 * Component that displays tablet connection status and control buttons
 */
@customElement('tablet-status')
export class TabletStatus extends LitElement {
  static styles = styles;

  @state()
  private connected = false;

  @state()
  private deviceName = '';

  @state()
  private supportsWebHID = true;

  connectedCallback() {
    super.connectedCallback();
    this.supportsWebHID = 'hid' in navigator;
  }

  render() {
    if (!this.supportsWebHID) {
      return html`
        <div class="info-message">
          ⚠️ WebHID is not supported in this browser. 
          Please use Chrome, Edge, or another Chromium-based browser.
        </div>
      `;
    }

    return html`
      <div class="status-indicator ${this.connected ? 'connected' : ''}">
        <div class="status-dot"></div>
        <div class="status-text">
          ${this.connected ? 'Connected' : 'Disconnected'}
        </div>
      </div>

      ${this.connected
        ? html`
            <button 
              class="button disconnect" 
              @click="${this._handleDisconnect}">
              Disconnect Device
            </button>
            ${this.deviceName
              ? html`
                  <dl class="device-info">
                    <dt>Device Name</dt>
                    <dd>${this.deviceName}</dd>
                  </dl>
                `
              : ''}
          `
        : html`
            <button 
              class="button" 
              @click="${this._handleConnect}">
              Connect Device
            </button>
            <div class="info-message">
              💡 Click the button above to connect your graphics tablet.
              You'll need to grant permission in your browser.
            </div>
          `}
    `;
  }

  private _handleConnect() {
    // Mock connection for demo purposes
    // In a real app, this would call the tablet controller
    this.connected = true;
    this.deviceName = 'Demo Tablet';
    this._dispatchConnectionEvent();
  }

  private _handleDisconnect() {
    this.connected = false;
    this.deviceName = '';
    this._dispatchConnectionEvent();
  }

  private _dispatchConnectionEvent() {
    this.dispatchEvent(
      new CustomEvent('connection-changed', {
        detail: { connected: this.connected, deviceName: this.deviceName },
        bubbles: true,
        composed: true,
      })
    );
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'tablet-status': TabletStatus;
  }
}

