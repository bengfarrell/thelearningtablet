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
    margin: 0 0 15px 0;
    color: #666;
    font-size: 14px;
  }

  .device-status {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 15px;
    margin-top: 15px;
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

  .button.connect {
    background: #4caf50;
    padding: 10px 20px;
  }

  .button.connect:hover:not(:disabled) {
    background: #45a049;
  }

  .button.disconnect {
    background: #f44336;
    padding: 8px 16px;
  }

  .button.disconnect:hover:not(:disabled) {
    background: #d32f2f;
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
    margin: 0 0 15px 0;
    color: #667eea;
    font-size: 18px;
  }

  .gesture-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-bottom: 15px;
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

  .button.stop {
    background: #f44336;
  }

  .button.stop:hover:not(:disabled) {
    background: #d32f2f;
    box-shadow: 0 2px 8px rgba(244, 67, 54, 0.3);
  }

  .button.clear {
    background: #ff9800;
  }

  .button.clear:hover:not(:disabled) {
    background: #f57c00;
    box-shadow: 0 2px 8px rgba(255, 152, 0, 0.3);
  }

  .button.primary {
    background: #4caf50;
    font-size: 16px;
    padding: 12px 24px;
  }

  .button.primary:hover:not(:disabled) {
    background: #45a049;
    box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);
  }

  .button.hover {
    background: #9c27b0;
  }

  .button.hover:hover:not(:disabled) {
    background: #7b1fa2;
    box-shadow: 0 2px 8px rgba(156, 39, 176, 0.3);
  }

  .status-indicator {
    margin: 0;
    padding: 10px 15px;
    background: #e3f2fd;
    border: 2px solid #2196f3;
    border-radius: 6px;
    font-weight: 500;
    color: #1565c0;
  }

  .byte-info {
    display: flex;
    justify-content: space-between;
    margin-bottom: 15px;
    padding: 10px;
    background: #fff;
    border-radius: 4px;
    font-size: 13px;
    color: #666;
  }

  .byte-display {
    background: #1e1e1e;
    border-radius: 6px;
    padding: 20px;
    min-height: 100px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Courier New', monospace;
    font-size: 14px;
  }

  .empty-message {
    color: #888;
    text-align: center;
    padding: 20px;
    margin: 0;
  }

  .byte-packet {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 15px;
    background: #2d2d2d;
    border-radius: 6px;
    border: 2px solid #667eea;
    width: 100%;
  }

  .packet-label {
    color: #888;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .packet-bytes {
    color: #4ec9b0;
    font-weight: 500;
    font-size: 16px;
    word-break: break-all;
    line-height: 1.6;
  }

  /* Walkthrough styles */
  .walkthrough {
    border-left: 4px solid #667eea;
  }

  .walkthrough.active {
    border-left-color: #4caf50;
    background: #e8f5e9;
  }

  .walkthrough.complete {
    border-left-color: #2196f3;
    background: #e3f2fd;
  }

  .walkthrough h3 {
    margin-top: 0;
  }

  .walkthrough p {
    margin: 10px 0;
    line-height: 1.6;
  }

  .info-message {
    padding: 12px 16px;
    background: #e3f2fd;
    border-left: 4px solid #2196f3;
    border-radius: 4px;
    color: #1565c0;
    font-size: 14px;
    margin: 15px 0;
  }

  /* Device List Minimal */
  .device-list-minimal {
    margin-bottom: 20px;
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

  .chip-count {
    padding: 2px 6px;
    background: #667eea;
    color: white;
    border-radius: 10px;
    font-size: 10px;
    font-weight: 700;
  }

  /* Active Streams Section */
  .active-streams-section {
    margin-top: 15px;
  }

  .active-streams-section h4 {
    margin: 0 0 10px 0;
    color: #667eea;
    font-size: 14px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  /* Device Streams */
  .device-streams-list {
    display: flex;
    flex-direction: column;
    gap: 15px;
  }

  .device-stream-panel {
    border: 2px solid #e0e0e0;
    border-radius: 8px;
    background: white;
    transition: all 0.3s ease;
    overflow: hidden;
  }

  .device-stream-panel.active {
    border-color: #4caf50;
    box-shadow: 0 2px 8px rgba(76, 175, 80, 0.2);
  }

  .device-stream-panel.inactive {
    opacity: 0.6;
  }

  .stream-header {
    padding: 15px;
    background: #fafafa;
    border-bottom: 1px solid #e0e0e0;
  }

  .device-stream-panel.active .stream-header {
    background: #f1f8f4;
  }

  .stream-title-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
  }

  .stream-title {
    font-weight: 600;
    font-size: 16px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .active-badge {
    background: #4caf50;
    color: white;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
  }

  .stream-count {
    font-size: 14px;
    color: #666;
    font-weight: 500;
  }

  .stream-metadata {
    display: flex;
    gap: 20px;
    align-items: center;
    flex-wrap: wrap;
  }

  .metadata-item {
    display: flex;
    gap: 6px;
    font-size: 13px;
  }

  .metadata-label {
    color: #666;
    font-weight: 500;
  }

  .metadata-value {
    color: #333;
    font-weight: 600;
    font-family: 'Courier New', monospace;
  }

  .metadata-badge {
    padding: 3px 10px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
  }

  .metadata-badge.digitizer {
    background: #4caf50;
    color: white;
  }

  .stream-byte-display {
    padding: 15px;
    background: white;
    min-height: 60px;
  }

  /* Accumulated Results */
  .accumulated-results {
    margin-top: 20px;
    padding: 20px;
    background: #f8f9fa;
    border-radius: 8px;
    border: 2px solid #e0e0e0;
  }

  .accumulated-results h3 {
    margin: 0 0 15px 0;
    color: #667eea;
    font-size: 18px;
  }

  .result-item {
    margin-bottom: 20px;
    padding: 15px;
    background: white;
    border-radius: 6px;
    border-left: 4px solid #667eea;
  }

  .result-item:last-child {
    margin-bottom: 0;
  }

  .result-item h4 {
    margin: 0 0 5px 0;
    color: #333;
    font-size: 16px;
  }

  .result-description {
    margin: 0 0 15px 0;
    color: #666;
    font-size: 13px;
  }

  .byte-results {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  .byte-result-card {
    flex: 0 0 auto;
    min-width: 180px;
    padding: 12px;
    background: #f5f5f5;
    border-radius: 6px;
    border: 1px solid #e0e0e0;
  }

  .byte-index {
    font-weight: 700;
    color: #667eea;
    font-size: 14px;
    margin-bottom: 8px;
  }

  .byte-range,
  .byte-variance {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;
    font-size: 13px;
  }

  .range-label,
  .variance-label {
    color: #666;
    font-weight: 500;
  }

  .range-value,
  .variance-value {
    color: #333;
    font-weight: 600;
    font-family: 'Courier New', monospace;
  }

  .status-values {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .status-value-card {
    padding: 10px;
    background: #f5f5f5;
    border-radius: 6px;
    border: 1px solid #e0e0e0;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .status-state {
    font-weight: 600;
    color: #667eea;
    text-transform: capitalize;
  }

  .status-value {
    font-family: 'Courier New', monospace;
    color: #333;
    font-weight: 600;
  }

  /* Live Analysis */
  .live-analysis {
    margin-top: 20px;
    padding: 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 8px;
    color: white;
  }

  .live-analysis h4 {
    margin: 0 0 5px 0;
    color: white;
    font-size: 16px;
    font-weight: 700;
  }

  .analysis-subtitle {
    margin: 0 0 15px 0;
    color: rgba(255, 255, 255, 0.9);
    font-size: 13px;
  }

  .live-bytes-grid {
    display: flex;
    flex-wrap: nowrap;
    gap: 8px;
    overflow-x: auto;
    padding: 15px 0 5px 0; /* Top padding for labels */
  }

  .live-byte-cell {
    position: relative;
    flex: 0 0 auto;
    min-width: 60px;
    padding: 10px 5px 6px 5px;
    background: rgba(255, 255, 255, 0.95);
    border-radius: 6px;
    text-align: center;
    transition: all 0.2s ease;
  }

  .live-byte-cell.best-guess {
    background: rgba(255, 255, 255, 1);
    border: 2px solid #ffd700;
    box-shadow: 0 4px 12px rgba(255, 215, 0, 0.4);
    transform: scale(1.05);
  }

  .live-byte-cell.identified {
    background: rgba(255, 255, 255, 1);
    border: 2px solid #667eea;
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
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

  .live-byte-cell.best-guess .byte-type-label {
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

  .live-byte-cell.best-guess .byte-label {
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

  .live-byte-cell.best-guess .byte-value {
    color: #667eea;
    font-size: 20px;
  }

  .byte-hex {
    font-size: 10px;
    color: #999;
    font-family: 'Courier New', monospace;
    margin-bottom: 4px;
  }

  .live-byte-cell.best-guess .byte-hex {
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

  .live-byte-cell.best-guess .byte-meta {
    color: #666;
    font-weight: 600;
  }

  /* Button Group */
  .step-buttons {
    margin-top: 15px;
  }

  .button-group {
    display: flex;
    gap: 10px;
    margin-top: 10px;
  }

  .button.secondary {
    background: #6c757d;
    color: white;
  }

  .button.secondary:hover {
    background: #5a6268;
  }

  .stream-byte-display .empty-message {
    text-align: center;
    color: #999;
    font-size: 14px;
    font-style: italic;
    margin: 0;
    padding: 10px;
  }

  .stream-byte-display .byte-packet {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .stream-byte-display .packet-label {
    font-size: 11px;
    color: #666;
    text-transform: uppercase;
    font-weight: 600;
    letter-spacing: 0.5px;
  }

  .stream-byte-display .packet-bytes {
    font-family: 'Courier New', monospace;
    font-size: 14px;
    color: #1976d2;
    word-break: break-all;
    line-height: 1.6;
    padding: 10px;
    background: #f5f5f5;
    border-radius: 4px;
    border: 1px solid #e0e0e0;
  }

  .walkthrough .button {
    margin: 15px 0;
    width: 100%;
    max-width: 300px;
    font-size: 16px;
    padding: 12px 24px;
  }

  .walkthrough-progress {
    display: flex;
    gap: 10px;
    margin: 20px 0;
  }

  .progress-step {
    flex: 1;
    padding: 10px;
    background: #e0e0e0;
    border-radius: 6px;
    text-align: center;
    font-size: 13px;
    font-weight: 500;
    color: #666;
  }

  .progress-step.active {
    background: #4caf50;
    color: white;
  }

  .progress-step.complete {
    background: #2196f3;
    color: white;
  }

  /* Byte analysis styles */
  .byte-analysis {
    margin: 20px 0;
    display: grid;
    gap: 20px;
  }

  .analysis-section h4 {
    margin: 0 0 10px 0;
    color: #667eea;
    font-size: 16px;
  }

  .byte-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .byte-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px;
    background: #fff;
    border-radius: 6px;
    border-left: 3px solid #667eea;
    font-family: 'Courier New', monospace;
    font-size: 13px;
  }

  .byte-item.pressure {
    border-left-color: #9c27b0;
  }

  .byte-item.pressure .byte-index {
    color: #9c27b0;
  }

  .byte-index {
    font-weight: 600;
    color: #667eea;
    min-width: 80px;
  }

  .byte-range {
    color: #4caf50;
    flex: 1;
  }

  .byte-variance {
    color: #666;
    font-size: 12px;
  }

  .no-data {
    color: #999;
    font-style: italic;
    margin: 10px 0;
  }

  /* Config display styles */
  .config-section {
    margin: 20px 0;
    padding: 0;
    background: transparent;
    border: none;
  }

  .config-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding: 15px 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 8px;
    color: white;
  }

  .config-header h4 {
    margin: 0;
    color: white;
    font-size: 20px;
  }

  .config-actions {
    display: flex;
    gap: 10px;
  }

  .config-actions-only {
    display: flex;
    gap: 10px;
    justify-content: center;
    margin: 20px 0;
  }

  .button.small {
    padding: 8px 16px;
    font-size: 13px;
    background: rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(10px);
  }

  .button.small:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.3);
    transform: translateY(-1px);
  }

  .config-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 20px;
  }

  .config-card {
    background: white;
    border-radius: 12px;
    padding: 0;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    border: 1px solid #e0e0e0;
    transition: all 0.2s ease;
    overflow: hidden;
  }

  .config-card:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
    transform: translateY(-2px);
  }

  .config-card.status-card {
    grid-column: 1 / -1;
  }

  .card-header {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 15px 20px;
    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
    border-bottom: 2px solid #e0e0e0;
  }

  .card-icon {
    font-size: 24px;
  }

  .card-header h5 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #333;
  }

  .card-body {
    padding: 20px;
  }

  .config-detail {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 0;
    border-bottom: 1px solid #f0f0f0;
  }

  .config-detail:last-child {
    border-bottom: none;
  }

  .detail-label {
    font-size: 13px;
    color: #666;
    font-weight: 500;
  }

  .detail-value {
    font-size: 14px;
    color: #333;
    font-weight: 600;
    font-family: 'Courier New', monospace;
  }

  .detail-value.highlight {
    color: #4caf50;
    font-size: 16px;
  }

  .badge {
    padding: 4px 12px;
    background: #667eea;
    color: white;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .status-values {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 15px;
  }

  .status-value-item {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    padding: 12px;
    background: #f8f9fa;
    border-radius: 8px;
    border-left: 3px solid #667eea;
  }

  .status-byte {
    font-family: 'Courier New', monospace;
    font-weight: 600;
    color: #667eea;
    font-size: 13px;
    min-width: 120px;
  }

  .status-state {
    padding: 4px 10px;
    background: #e3f2fd;
    color: #1565c0;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 600;
    text-transform: capitalize;
  }

  .status-flag {
    padding: 4px 10px;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .status-flag.primary {
    background: #4caf50;
    color: white;
  }

  .status-flag.secondary {
    background: #ff9800;
    color: white;
  }
`;

