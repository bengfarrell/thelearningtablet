import { css } from 'lit';

export const styles = css`
  :host {
    display: block;
  }

  .hid-devices {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .status-badge {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 20px;
    border-radius: 20px;
    font-size: 14px;
    font-weight: 600;
  }

  .status-badge.connected {
    background: #e8f5e9;
    color: #2e7d32;
    border: 2px solid #4caf50;
  }

  .status-icon {
    font-size: 16px;
  }

  .status-detail {
    font-size: 12px;
    opacity: 0.8;
  }

  .status-detail.warning {
    color: #f57c00;
  }

  .button {
    padding: 10px 20px;
    border: none;
    border-radius: 6px;
    background: #667eea;
    color: white;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .button:hover:not(:disabled) {
    background: #5568d3;
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
  }

  .button:active:not(:disabled) {
    transform: translateY(0);
  }

  .button:disabled {
    background: #ccc;
    cursor: not-allowed;
    opacity: 0.6;
  }

  .button.small {
    padding: 8px 16px;
    font-size: 13px;
  }

  .button.disconnect {
    background: #f44336 !important;
    color: white;
    padding: 8px 16px;
    border: none;
  }

  .button.disconnect:hover:not(:disabled) {
    background: #d32f2f !important;
  }
`;

