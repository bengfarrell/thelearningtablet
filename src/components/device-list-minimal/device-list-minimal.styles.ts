import { css } from 'lit';

export const styles = css`
  :host {
    display: block;
  }

  .device-list-minimal {
    padding: 15px;
    background: #f8f9fa;
    border-radius: 8px;
    border: 1px solid #e0e0e0;
  }

  .device-list-header {
    margin-bottom: 10px;
  }

  .device-count {
    font-size: 13px;
    color: #666;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .device-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .device-chip {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    background: white;
    border: 2px solid #e0e0e0;
    border-radius: 20px;
    font-size: 13px;
    transition: all 0.2s ease;
  }

  .device-chip.active {
    border-color: #4caf50;
    background: #f1f8f4;
  }

  .device-chip.inactive {
    opacity: 0.6;
  }

  .chip-icon {
    font-size: 12px;
    line-height: 1;
  }

  .chip-label {
    font-weight: 600;
    color: #333;
  }

  .chip-badge {
    padding: 2px 6px;
    background: #4caf50;
    color: white;
    border-radius: 10px;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
  }

  .chip-badge.mock-badge {
    background: #ff9800;
    color: white;
  }

  .chip-count {
    padding: 2px 6px;
    background: #667eea;
    color: white;
    border-radius: 10px;
    font-size: 10px;
    font-weight: 700;
  }

  .device-details {
    margin-top: 15px;
    padding-top: 15px;
    border-top: 1px solid #e0e0e0;
  }

  .device-detail-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 0;
    font-size: 13px;
  }

  .detail-label {
    font-weight: 600;
    color: #333;
    min-width: 80px;
  }

  .detail-value {
    color: #666;
    padding: 2px 8px;
    background: rgba(102, 126, 234, 0.1);
    border-radius: 4px;
    font-size: 12px;
  }

  .detail-badge {
    padding: 3px 8px;
    background: #4caf50;
    color: white;
    border-radius: 10px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
  }

  .detail-badge.mock-badge {
    background: #ff9800;
    color: white;
  }
`;

