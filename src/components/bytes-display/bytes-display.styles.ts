import { css } from 'lit';

export const styles = css`
  :host {
    display: block;
  }

  .bytes-container {
    margin-top: 20px;
    padding: 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 8px;
    color: white;
  }

  .device-info-header {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    align-items: center;
    margin-bottom: 12px;
    padding-bottom: 12px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
    font-size: 13px;
  }

  .info-item {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .info-label {
    opacity: 0.8;
    font-weight: 500;
  }

  .info-value {
    font-weight: 600;
    background: rgba(255, 255, 255, 0.15);
    padding: 2px 8px;
    border-radius: 4px;
  }

  .info-badge {
    padding: 3px 10px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .info-badge.digitizer {
    background: rgba(76, 175, 80, 0.3);
    color: #c8e6c9;
    border: 1px solid rgba(76, 175, 80, 0.5);
  }

  .info-badge.digitizer.mock {
    background: rgba(255, 152, 0, 0.3);
    color: #ffcc80;
    border: 1px solid rgba(255, 152, 0, 0.5);
  }

  .bytes-grid {
    display: flex;
    flex-wrap: nowrap;
    gap: 8px;
    overflow-x: auto;
    overflow-y: visible;
    padding: 15px 0 0 0;
  }
`;

