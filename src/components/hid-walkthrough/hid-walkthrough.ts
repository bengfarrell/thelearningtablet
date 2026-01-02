import { LitElement, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { styles } from './hid-walkthrough.styles.js';
import type { ByteAnalysis, DeviceByteCodeMappings } from '../../utils/byte-detector.js';
import type { MetadataFormData } from '../device-metadata-form/device-metadata-form.js';
import '../hid-walkthrough-progress/hid-walkthrough-progress.js';
import '../device-metadata-form/device-metadata-form.js';

export type WalkthroughStep = 
  | 'idle' 
  | 'step1-horizontal' 
  | 'step2-vertical' 
  | 'step3-pressure' 
  | 'step4-hover-movement' 
  | 'step5-tilt-x' 
  | 'step6-tilt-y' 
  | 'step7-primary-button' 
  | 'step8-secondary-button' 
  | 'step9-tablet-buttons' 
  | 'step10-metadata' 
  | 'complete';

export interface WalkthroughStepCompleteEvent {
  step: WalkthroughStep;
  gesture: string;
}

export interface WalkthroughResetEvent {
  step: WalkthroughStep;
}

export interface WalkthroughMetadataSubmitEvent {
  metadata: MetadataFormData;
}

/**
 * HID Walkthrough component for guiding users through device configuration
 * Handles all 10 steps of the walkthrough process
 */
@customElement('hid-walkthrough')
export class HidWalkthrough extends LitElement {
  static styles = styles;

  // Current walkthrough step
  @property({ type: String })
  currentStep: WalkthroughStep = 'step1-horizontal';

  // Whether a gesture is currently playing
  @property({ type: Boolean })
  isPlaying = false;

  // Number of captured packets in current step
  @property({ type: Number })
  capturedPacketCount = 0;

  // Detected bytes for each step
  @property({ type: Array })
  horizontalBytes: ByteAnalysis[] = [];

  @property({ type: Array })
  verticalBytes: ByteAnalysis[] = [];

  @property({ type: Array })
  pressureBytes: ByteAnalysis[] = [];

  @property({ type: Array })
  tiltXBytes: ByteAnalysis[] = [];

  @property({ type: Array })
  tiltYBytes: ByteAnalysis[] = [];

  @property({ type: Array })
  tabletButtonBytes: ByteAnalysis[] = [];

  // Detected button states (for step 9)
  @property({ type: Object })
  detectedButtonStates: Set<number> = new Set();

  // Generated device configuration
  @property({ type: Object })
  deviceConfig: DeviceByteCodeMappings | null = null;

  // Complete configuration with metadata
  @property({ type: Object })
  completeConfig: any = null;

  render() {
    return html`
      <div class="walkthrough-container">
        ${this._renderCurrentStep()}
      </div>
    `;
  }

  private _renderCurrentStep() {
    switch (this.currentStep) {
      case 'step1-horizontal':
        return this._renderStep1Horizontal();
      case 'step2-vertical':
        return this._renderStep2Vertical();
      case 'step3-pressure':
        return this._renderStep3Pressure();
      case 'step4-hover-movement':
        return this._renderStep4HoverMovement();
      case 'step5-tilt-x':
        return this._renderStep5TiltX();
      case 'step6-tilt-y':
        return this._renderStep6TiltY();
      case 'step7-primary-button':
        return this._renderStep7PrimaryButton();
      case 'step8-secondary-button':
        return this._renderStep8SecondaryButton();
      case 'step9-tablet-buttons':
        return this._renderStep9TabletButtons();
      case 'step10-metadata':
        return this._renderStep10Metadata();
      case 'complete':
        return this._renderComplete();
      default:
        return html``;
    }
  }

  private _renderStepHeader(stepNumber: number, title: string, hasNextButton = true) {
    const hasData = this.capturedPacketCount > 0;
    return html`
      <div class="step-header">
        <h3>${title}</h3>
        <button class="icon-button" @click="${this._handleReset}" title="Reset">🔄</button>
        <hid-walkthrough-progress currentStep="${stepNumber}" totalSteps="10"></hid-walkthrough-progress>
        ${hasNextButton ? html`
          <button 
            class="icon-button" 
            ?disabled="${!hasData}" 
            @click="${this._handleNext}" 
            title="Next Step">→</button>
        ` : ''}
      </div>
    `;
  }

  private _renderStep1Horizontal() {
    return html`
      <div class="section walkthrough active">
        ${this._renderStepHeader(0, 'Step 1: Horizontal Movement (Contact)')}
        <div class="step-description">
          <p>This will help us identify which bytes represent the <strong>X coordinate</strong>.</p>
          <button 
            class="simulate-button" 
            ?disabled="${this.isPlaying}" 
            @click="${() => this._handlePlayGesture('horizontal')}">
            ${this.isPlaying ? '⏳ Simulating...' : '🤖 Simulate this data'}
          </button>
        </div>
      </div>
    `;
  }

  private _renderStep2Vertical() {
    return html`
      <div class="section walkthrough active">
        ${this._renderStepHeader(1, 'Step 2: Vertical Movement (Contact)')}
        <div class="step-description">
          <p>This will help us identify which bytes represent the <strong>Y coordinate</strong>.</p>
          <button
            class="simulate-button"
            ?disabled="${this.isPlaying}"
            @click="${() => this._handlePlayGesture('vertical')}">
            ${this.isPlaying ? '⏳ Simulating...' : '🤖 Simulate this data'}
          </button>
        </div>
      </div>
    `;
  }

  private _renderStep3Pressure() {
    return html`
      <div class="section walkthrough active">
        ${this._renderStepHeader(2, 'Step 3: Pressure Detection')}
        <div class="step-description">
          <p>This will help us identify which bytes represent <strong>pressure</strong>.</p>
          <button
            class="simulate-button"
            ?disabled="${this.isPlaying}"
            @click="${() => this._handlePlayGesture('pressure')}">
            ${this.isPlaying ? '⏳ Simulating...' : '🤖 Simulate this data'}
          </button>
        </div>
      </div>
    `;
  }

  private _renderStep4HoverMovement() {
    return html`
      <div class="section walkthrough active">
        ${this._renderStepHeader(3, 'Step 4: Hover Movement')}
        <div class="step-description">
          <p>Hover your pen above the tablet and move it around freely (both horizontally and vertically).</p>
          <p>This helps identify X and Y coordinate bytes without pressure interference.</p>
          <button
            class="simulate-button"
            ?disabled="${this.isPlaying}"
            @click="${() => this._handlePlayGesture('circle')}">
            ${this.isPlaying ? '⏳ Simulating...' : '🤖 Simulate this data'}
          </button>
        </div>
      </div>
    `;
  }

  private _renderStep5TiltX() {
    return html`
      <div class="section walkthrough active">
        ${this._renderStepHeader(4, 'Step 5: Tilt X Detection')}
        <div class="step-description">
          <p>This will help us identify which byte represents <strong>X tilt</strong>.</p>
          <button
            class="simulate-button"
            ?disabled="${this.isPlaying}"
            @click="${() => this._handlePlayGesture('tilt-x')}">
            ${this.isPlaying ? '⏳ Simulating...' : '🤖 Simulate this data'}
          </button>
        </div>
      </div>
    `;
  }

  private _renderStep6TiltY() {
    return html`
      <div class="section walkthrough active">
        ${this._renderStepHeader(5, 'Step 6: Tilt Y Detection')}
        <div class="step-description">
          <p>This will help us identify which byte represents <strong>Y tilt</strong>.</p>
          <button
            class="simulate-button"
            ?disabled="${this.isPlaying}"
            @click="${() => this._handlePlayGesture('tilt-y')}">
            ${this.isPlaying ? '⏳ Simulating...' : '🤖 Simulate this data'}
          </button>
        </div>
      </div>
    `;
  }

  private _renderStep7PrimaryButton() {
    return html`
      <div class="section walkthrough active">
        ${this._renderStepHeader(6, 'Step 7: Primary Button Detection')}
        <div class="step-description">
          <p>This will help us identify the status byte value for <strong>primary button</strong>.</p>
          <button
            class="simulate-button"
            ?disabled="${this.isPlaying}"
            @click="${() => this._handlePlayGesture('primary-button')}">
            ${this.isPlaying ? '⏳ Simulating...' : '🤖 Simulate this data'}
          </button>
        </div>
      </div>
    `;
  }

  private _renderStep8SecondaryButton() {
    return html`
      <div class="section walkthrough active">
        ${this._renderStepHeader(7, 'Step 8: Secondary Button Detection')}
        <div class="step-description">
          <p>This will help us identify the status byte value for <strong>secondary button</strong>.</p>
          <button
            class="simulate-button"
            ?disabled="${this.isPlaying}"
            @click="${() => this._handlePlayGesture('secondary-button')}">
            ${this.isPlaying ? '⏳ Simulating...' : '🤖 Simulate this data'}
          </button>
        </div>
      </div>
    `;
  }

  private _renderStep9TabletButtons() {
    const buttonCount = this.detectedButtonStates.size;
    return html`
      <div class="section walkthrough active">
        ${this._renderStepHeader(8, 'Step 9: Tablet Buttons Detection')}
        <div class="step-description">
          <p>Press different buttons on your tablet (not the pen buttons).</p>
          <p>We'll detect how many buttons your tablet has and their byte values.</p>
          ${buttonCount > 0 ? html`
            <div class="button-detection-status">
              <strong>Detected ${buttonCount} button state${buttonCount !== 1 ? 's' : ''}</strong>
              <div class="detected-states">
                ${Array.from(this.detectedButtonStates).map(state => html`
                  <span class="state-badge">0x${state.toString(16).toUpperCase().padStart(2, '0')}</span>
                `)}
              </div>
            </div>
          ` : ''}
          <div class="gesture-controls">
            <button
              class="simulate-button"
              ?disabled="${this.isPlaying}"
              @click="${() => this._handlePlayGesture('tablet-buttons')}">
              ${this.isPlaying ? '⏳ Simulating...' : '🤖 Simulate this data'}
            </button>
          </div>
        </div>
      </div>
    `;
  }

  private _renderStep10Metadata() {
    return html`
      <div class="section walkthrough active">
        ${this._renderStepHeader(9, 'Step 10: Device Information', false)}
        <p>Please provide some additional information about your device to complete the configuration.</p>
        <device-metadata-form
          @metadata-submit="${this._handleMetadataSubmit}">
        </device-metadata-form>
      </div>
    `;
  }

  private _renderComplete() {
    return html`
      <div class="section walkthrough complete">
        <h3>✅ Walkthrough Complete!</h3>
        <p>Your device configuration has been generated.</p>
      </div>
    `;
  }

  private _handlePlayGesture(gesture: string) {
    this.dispatchEvent(new CustomEvent('play-gesture', {
      detail: { gesture },
      bubbles: true,
      composed: true
    }));
  }

  private _handleNext() {
    this.dispatchEvent(new CustomEvent('step-complete', {
      detail: { step: this.currentStep },
      bubbles: true,
      composed: true
    }));
  }

  private _handleReset() {
    this.dispatchEvent(new CustomEvent('step-reset', {
      detail: { step: this.currentStep },
      bubbles: true,
      composed: true
    }));
  }

  private _handleMetadataSubmit(e: CustomEvent<MetadataFormData>) {
    this.dispatchEvent(new CustomEvent('metadata-submit', {
      detail: e.detail,
      bubbles: true,
      composed: true
    }));
  }
}
