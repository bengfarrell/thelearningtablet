import { css } from 'lit';

export const styles = css`
  :host {
    display: block;
  }

  .canvas-container {
    position: relative;
    background: white;
    border-radius: 8px;
    border: 2px solid #e0e0e0;
    overflow: hidden;
  }

  .canvas-container.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  canvas {
    display: block;
    width: 100%;
    height: 400px;
    cursor: crosshair;
  }

  .canvas-container.disabled canvas {
    cursor: not-allowed;
  }

  .controls {
    margin-top: 15px;
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  .button {
    padding: 8px 16px;
    border: none;
    border-radius: 6px;
    background: #667eea;
    color: white;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .button:hover:not(:disabled) {
    background: #5568d3;
  }

  .button:disabled {
    background: #ccc;
    cursor: not-allowed;
  }

  .button.clear {
    background: #ff5722;
  }

  .button.clear:hover:not(:disabled) {
    background: #e64a19;
  }

  .info {
    margin-top: 15px;
    padding: 12px;
    background: #e3f2fd;
    border: 1px solid #2196f3;
    border-radius: 6px;
    font-size: 13px;
    color: #0d47a1;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 10px;
  }

  .info-item {
    display: flex;
    flex-direction: column;
  }

  .info-label {
    font-weight: 600;
    font-size: 11px;
    text-transform: uppercase;
    opacity: 0.7;
  }

  .info-value {
    font-size: 16px;
    font-weight: 700;
    margin-top: 2px;
  }
`;

