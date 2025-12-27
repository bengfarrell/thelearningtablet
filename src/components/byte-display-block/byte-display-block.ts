import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { styles } from './byte-display-block.styles.js';

/**
 * Component that displays a single byte cell with its value and metadata
 */
@customElement('byte-display-block')
export class ByteDisplayBlock extends LitElement {
  static styles = styles;

  @property({ type: Number })
  byteIndex = 0;

  @property({ type: Number })
  value?: number;

  @property({ type: Number })
  min?: number;

  @property({ type: Number })
  max?: number;

  @property({ type: Number })
  variance?: number;

  @property({ type: Boolean })
  isBestGuess = false;

  @property({ type: Boolean })
  isIdentified = false;

  @property({ type: String })
  label?: string;

  @property({ type: Boolean })
  isEmpty = false;

  render() {
    const classes = [
      'byte-cell',
      this.isBestGuess ? 'best-guess' : '',
      this.isIdentified ? 'identified' : '',
      this.isEmpty ? 'empty-placeholder' : ''
    ].filter(Boolean).join(' ');

    return html`
      <div class="${classes}">
        ${this.label && !this.isEmpty ? html`<div class="byte-type-label">${this.label}</div>` : ''}
        <div class="byte-label">Byte ${this.byteIndex + 1}</div>
        <div class="byte-value">${this.value !== undefined ? this.value : '-'}</div>
        <div class="byte-hex">
          ${this.value !== undefined 
            ? `0x${this.value.toString(16).toUpperCase().padStart(2, '0')}` 
            : '0x--'}
        </div>
        ${this.variance !== undefined ? html`
          <div class="byte-meta">
            <div class="meta-line">R: ${this.min}-${this.max}</div>
            <div class="meta-line">V: ${this.variance.toFixed(1)}</div>
          </div>
        ` : html`
          <div class="byte-meta">
            <div class="meta-line">-</div>
          </div>
        `}
      </div>
    `;
  }
}

