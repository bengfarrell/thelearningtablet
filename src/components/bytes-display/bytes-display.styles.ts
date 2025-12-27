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

  .bytes-grid {
    display: flex;
    flex-wrap: nowrap;
    gap: 8px;
    overflow-x: auto;
    overflow-y: visible;
    padding: 15px 0 0 0;
  }
`;

