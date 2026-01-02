import { css } from 'lit';

export const styles = css`
  :host {
    display: block;
  }

  .walkthrough-container {
    width: 100%;
  }

  .section {
    background: white;
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 20px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .section.walkthrough.active {
    border-left: 4px solid #2196f3;
  }

  .section.walkthrough.complete {
    border-left: 4px solid #4caf50;
  }

  .step-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
  }

  .step-header h3 {
    margin: 0;
    flex: 1;
    font-size: 18px;
    color: #333;
  }

  .icon-button {
    background: #f5f5f5;
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 8px 12px;
    cursor: pointer;
    font-size: 16px;
    transition: all 0.2s;
  }

  .icon-button:hover:not(:disabled) {
    background: #e0e0e0;
  }

  .icon-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .step-description {
    color: #666;
    line-height: 1.6;
  }

  .step-description p {
    margin: 8px 0;
  }

  .simulate-button {
    background: #2196f3;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 10px 20px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.2s;
    margin-top: 12px;
  }

  .simulate-button:hover:not(:disabled) {
    background: #1976d2;
  }

  .simulate-button:disabled {
    background: #ccc;
    cursor: not-allowed;
  }

  .gesture-controls {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    margin-top: 12px;
  }

  .button-detection-status {
    background: #f5f5f5;
    border-radius: 4px;
    padding: 12px;
    margin: 12px 0;
  }

  .button-detection-status strong {
    color: #2196f3;
  }

  .detected-states {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-top: 8px;
  }

  .state-badge {
    background: #2196f3;
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-family: monospace;
  }

  @media (max-width: 768px) {
    .step-header {
      flex-wrap: wrap;
    }

    .gesture-controls {
      flex-direction: column;
    }

    .simulate-button {
      width: 100%;
    }
  }
`;

