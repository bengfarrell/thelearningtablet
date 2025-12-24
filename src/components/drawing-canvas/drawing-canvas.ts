import { LitElement, html } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import { styles } from './drawing-canvas.styles.js';

/**
 * Interactive drawing canvas component
 */
@customElement('drawing-canvas')
export class DrawingCanvas extends LitElement {
  static styles = styles;

  @property({ type: Boolean })
  enabled = false;

  @state()
  private isDrawing = false;

  @state()
  private x = 0;

  @state()
  private y = 0;

  @state()
  private pressure = 0;

  @query('canvas')
  private canvas!: HTMLCanvasElement;

  private ctx: CanvasRenderingContext2D | null = null;

  firstUpdated() {
    this.ctx = this.canvas.getContext('2d');
    if (this.ctx) {
      this.ctx.lineJoin = 'round';
      this.ctx.lineCap = 'round';
    }
    this._resizeCanvas();
  }

  render() {
    return html`
      <div class="canvas-container ${this.enabled ? '' : 'disabled'}">
        <canvas
          @mousedown="${this._handleMouseDown}"
          @mousemove="${this._handleMouseMove}"
          @mouseup="${this._handleMouseUp}"
          @mouseleave="${this._handleMouseUp}">
        </canvas>
      </div>

      <div class="controls">
        <button 
          class="button clear" 
          ?disabled="${!this.enabled}"
          @click="${this._clearCanvas}">
          Clear Canvas
        </button>
        <button 
          class="button" 
          ?disabled="${!this.enabled}"
          @click="${this._changeColor}">
          Change Color
        </button>
      </div>

      ${this.enabled
        ? html`
            <div class="info">
              <div class="info-item">
                <span class="info-label">X Position</span>
                <span class="info-value">${this.x}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Y Position</span>
                <span class="info-value">${this.y}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Pressure</span>
                <span class="info-value">${this.pressure.toFixed(2)}</span>
              </div>
            </div>
          `
        : ''}
    `;
  }

  private _resizeCanvas() {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
  }

  private _handleMouseDown(e: MouseEvent) {
    if (!this.enabled || !this.ctx) return;
    this.isDrawing = true;
    const rect = this.canvas.getBoundingClientRect();
    this.x = Math.round(e.clientX - rect.left);
    this.y = Math.round(e.clientY - rect.top);
    this.ctx.beginPath();
    this.ctx.moveTo(this.x, this.y);
  }

  private _handleMouseMove(e: MouseEvent) {
    if (!this.enabled || !this.ctx) return;
    const rect = this.canvas.getBoundingClientRect();
    this.x = Math.round(e.clientX - rect.left);
    this.y = Math.round(e.clientY - rect.top);
    
    // Simulate pressure based on movement speed
    this.pressure = Math.min(1, Math.random() * 0.5 + 0.5);

    if (this.isDrawing) {
      this.ctx.lineWidth = 2 + this.pressure * 4;
      this.ctx.lineTo(this.x, this.y);
      this.ctx.stroke();
    }
  }

  private _handleMouseUp() {
    if (!this.enabled) return;
    this.isDrawing = false;
    this.pressure = 0;
  }

  private _clearCanvas() {
    if (!this.ctx) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  private _changeColor() {
    if (!this.ctx) return;
    const colors = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b', '#fa709a'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    this.ctx.strokeStyle = randomColor;
  }

  /**
   * Update canvas from tablet data
   * Public method called by parent component with processed HID data
   */
  public updateFromTablet(x: number, y: number, pressure: number) {
    if (!this.enabled || !this.ctx || !this.canvas) return;

    // Normalize coordinates from tablet space (0-65535) to canvas space
    const normalizedX = (x / 65535) * this.canvas.width;
    const normalizedY = (y / 65535) * this.canvas.height;
    
    // Normalize pressure from tablet space (0-8191) to 0-1
    const normalizedPressure = pressure / 8191;

    // Update state
    this.x = Math.round(normalizedX);
    this.y = Math.round(normalizedY);
    this.pressure = Math.max(0, Math.min(1, normalizedPressure));

    // Draw if pressure is applied
    if (this.pressure > 0.1) {
      if (!this.isDrawing) {
        this.isDrawing = true;
        this.ctx.beginPath();
        this.ctx.moveTo(this.x, this.y);
      } else {
        this.ctx.lineWidth = 2 + this.pressure * 4;
        this.ctx.lineTo(this.x, this.y);
        this.ctx.stroke();
      }
    } else {
      // End drawing when pressure is released
      if (this.isDrawing) {
        this.isDrawing = false;
      }
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'drawing-canvas': DrawingCanvas;
  }
}

