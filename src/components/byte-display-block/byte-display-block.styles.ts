import { css } from 'lit';

export const styles = css`
  :host {
    display: block;
    overflow: visible;
  }

  .byte-cell {
    position: relative;
    flex: 0 0 auto;
    min-width: 60px;
    height: 85px;
    padding: 10px 5px 6px 5px;
    background: rgba(255, 255, 255, 0.95);
    border-radius: 6px;
    text-align: center;
    transition: all 0.2s ease;
    box-sizing: border-box;
  }

  .byte-cell.best-guess {
    background: rgba(255, 255, 255, 1);
    border: 2px solid #ffd700;
    box-shadow: 0 4px 12px rgba(255, 215, 0, 0.4);
    transform: scale(1.05);
  }

  .byte-cell.identified {
    background: rgba(255, 255, 255, 1);
    border: 2px solid #667eea;
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  }

  .byte-cell.empty-placeholder {
    background: rgba(255, 255, 255, 0.2);
    border: 2px dashed rgba(255, 255, 255, 0.3);
  }

  .byte-cell.empty-placeholder .byte-label,
  .byte-cell.empty-placeholder .byte-value,
  .byte-cell.empty-placeholder .byte-hex,
  .byte-cell.empty-placeholder .byte-meta {
    color: rgba(255, 255, 255, 0.5);
  }

  .byte-type-label {
    position: absolute;
    top: -10px;
    left: 50%;
    transform: translateX(-50%);
    padding: 2px 6px;
    background: #667eea;
    color: white;
    border-radius: 10px;
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
    white-space: nowrap;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }

  .byte-cell.best-guess .byte-type-label {
    background: #ffd700;
    color: #333;
  }

  .byte-label {
    font-size: 9px;
    font-weight: 600;
    color: #666;
    text-transform: uppercase;
    margin-bottom: 3px;
  }

  .byte-cell.best-guess .byte-label {
    color: #667eea;
    font-weight: 700;
  }

  .byte-value {
    font-size: 18px;
    font-weight: 900;
    color: #333;
    font-family: 'Courier New', monospace;
    margin-bottom: 2px;
    line-height: 1;
  }

  .byte-cell.best-guess .byte-value {
    color: #667eea;
    font-size: 20px;
  }

  .byte-hex {
    font-size: 10px;
    color: #999;
    font-family: 'Courier New', monospace;
    margin-bottom: 4px;
  }

  .byte-cell.best-guess .byte-hex {
    color: #667eea;
    font-weight: 600;
  }

  .byte-meta {
    font-size: 8px;
    color: #999;
    font-family: 'Courier New', monospace;
    line-height: 1.2;
    white-space: nowrap;
  }

  .byte-cell.best-guess .byte-meta {
    color: #666;
    font-weight: 600;
  }
`;

