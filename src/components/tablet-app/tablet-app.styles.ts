import { css } from 'lit';

export const styles = css`
  :host {
    display: block;
    color: #333;
  }

  .header {
    text-align: center;
    margin-bottom: 30px;
    padding-bottom: 20px;
    border-bottom: 2px solid #e0e0e0;
  }

  .header h2 {
    margin: 0 0 10px 0;
    color: #667eea;
  }

  .header p {
    margin: 0;
    color: #666;
    font-size: 14px;
  }

  .mock-indicator {
    margin: 0.5rem 0 0 0;
    padding: 0.5rem 1rem;
    background: #e0f7fa;
    border: 2px solid #00bcd4;
    border-radius: 4px;
    font-weight: 500;
    display: inline-block;
    animation: pulse 2s ease-in-out infinite;
    color: #00838f;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }

  .content {
    display: grid;
    gap: 20px;
  }

  .section {
    background: #f8f9fa;
    border-radius: 8px;
    padding: 20px;
    border: 1px solid #e0e0e0;
  }

  .section h3 {
    margin-top: 0;
    color: #667eea;
    font-size: 18px;
  }

  @media (min-width: 768px) {
    .content {
      grid-template-columns: 1fr 2fr;
    }
  }
`;

