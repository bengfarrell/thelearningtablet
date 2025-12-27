import { css } from 'lit';

export const styles = css`
  :host {
    display: block;
  }

  .config-container {
    display: flex;
    flex-direction: column;
    gap: 15px;
  }

  .config-actions {
    display: flex;
    gap: 10px;
    justify-content: flex-end;
  }

  .button {
    padding: 10px 20px;
    border: none;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .button.secondary {
    background: #667eea;
    color: white;
  }

  .button.secondary:hover {
    background: #5568d3;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  }

  .button.secondary:active {
    transform: translateY(0);
  }

  .config-display {
    background: #f5f5f5;
    border: 1px solid #ddd;
    border-radius: 6px;
    padding: 20px;
    margin: 0;
    overflow-x: auto;
    font-family: 'Courier New', monospace;
    font-size: 13px;
    line-height: 1.6;
    color: #333;
  }

  .config-display code {
    font-family: inherit;
  }

  .no-config {
    padding: 20px;
    text-align: center;
    color: #999;
    font-style: italic;
  }
`;

