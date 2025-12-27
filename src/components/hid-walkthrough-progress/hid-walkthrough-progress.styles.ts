import { css } from 'lit';

export const styles = css`
  :host {
    display: block;
  }

  .progress-container {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .progress-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: #e0e0e0;
    transition: all 0.3s ease;
  }

  .progress-dot.complete {
    background: #4caf50;
  }

  .progress-dot.current {
    background: #667eea;
    transform: scale(1.3);
  }
`;

