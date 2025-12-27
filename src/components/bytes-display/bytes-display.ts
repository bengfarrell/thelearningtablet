import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { styles } from './bytes-display.styles.js';
import '../byte-display-block/byte-display-block.js';

export interface ByteData {
  byteIndex: number;
  value: number;
  min?: number;
  max?: number;
  variance?: number;
  isBestGuess?: boolean;
  isIdentified?: boolean;
  label?: string;
}

/**
 * Component that displays a grid of byte cells
 */
@customElement('bytes-display')
export class BytesDisplay extends LitElement {
  static styles = styles;

  @property({ type: Array })
  bytes: ByteData[] = [];

  @property({ type: Boolean })
  isEmpty = false;

  @property({ type: Number })
  placeholderCount = 9;

  render() {
    if (this.isEmpty) {
      // Show empty placeholder cells
      return html`
        <div class="bytes-container">
          <div class="bytes-grid">
            ${Array.from({ length: this.placeholderCount }).map((_, index) => html`
              <byte-display-block
                .byteIndex=${index}
                .isEmpty=${true}>
              </byte-display-block>
            `)}
          </div>
        </div>
      `;
    }

    return html`
      <div class="bytes-container">
        <div class="bytes-grid">
          ${this.bytes.map(byte => html`
            <byte-display-block
              .byteIndex=${byte.byteIndex}
              .value=${byte.value}
              .min=${byte.min}
              .max=${byte.max}
              .variance=${byte.variance}
              .isBestGuess=${byte.isBestGuess || false}
              .isIdentified=${byte.isIdentified || false}
              .label=${byte.label}>
            </byte-display-block>
          `)}
        </div>
      </div>
    `;
  }
}

