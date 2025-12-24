import { css } from 'lit';

export const styles = css`
  :host {
    display: block;
  }

  .status-indicator {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 20px;
    padding: 15px;
    border-radius: 8px;
    background: white;
    border: 2px solid #e0e0e0;
  }

  .status-indicator.connected {
    border-color: #4caf50;
    background: #e8f5e9;
  }

  .status-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #999;
  }

  .status-indicator.connected .status-dot {
    background: #4caf50;
    animation: pulse 2s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  .status-text {
    font-weight: 500;
    color: #666;
  }

  .status-indicator.connected .status-text {
    color: #2e7d32;
  }

  .button {
    width: 100%;
    padding: 12px 24px;
    border: none;
    border-radius: 6px;
    background: #667eea;
    color: white;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    margin-bottom: 10px;
  }

  .button:hover:not(:disabled) {
    background: #5568d3;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  }

  .button:active:not(:disabled) {
    transform: translateY(0);
  }

  .button:disabled {
    background: #ccc;
    cursor: not-allowed;
  }

  .button.disconnect {
    background: #f44336;
  }

  .button.disconnect:hover:not(:disabled) {
    background: #d32f2f;
  }

  .device-info {
    margin-top: 15px;
    padding: 15px;
    background: white;
    border-radius: 6px;
    font-size: 13px;
    color: #666;
    border: 1px solid #e0e0e0;
  }

  .device-info dt {
    font-weight: 600;
    color: #333;
    margin-top: 8px;
  }

  .device-info dt:first-child {
    margin-top: 0;
  }

  .device-info dd {
    margin: 4px 0 0 0;
    color: #666;
  }

  .info-message {
    margin-top: 15px;
    padding: 12px;
    background: #fff3cd;
    border: 1px solid #ffc107;
    border-radius: 6px;
    font-size: 13px;
    color: #856404;
  }
`;

