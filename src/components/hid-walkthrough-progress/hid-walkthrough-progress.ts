import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { styles } from './hid-walkthrough-progress.styles.js';

@customElement('hid-walkthrough-progress')
export class HidWalkthroughProgress extends LitElement {
  static styles = styles;

  @property({ type: Number })
  currentStep = 0;

  @property({ type: Number })
  totalSteps = 9;

  render() {
    return html`
      <div class="progress-container">
        ${Array.from({ length: this.totalSteps }, (_, i) => {
          const isComplete = i < this.currentStep;
          const isCurrent = i === this.currentStep;
          return html`
            <div class="progress-dot ${isComplete ? 'complete' : ''} ${isCurrent ? 'current' : ''}"></div>
          `;
        })}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hid-walkthrough-progress': HidWalkthroughProgress;
  }
}

