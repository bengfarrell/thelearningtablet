# The Learning Tablet

A modern web application for interfacing with graphics tablets using the WebHID API, built with LitElement web components and Vite.

## 📚 Documentation

All documentation is organized in the [`projectdocs/`](./projectdocs) folder:

- **[Quick Start Guide](./projectdocs/QUICKSTART.md)** - Get up and running in minutes
- **[Test Coverage](./projectdocs/TEST_COVERAGE.md)** - Comprehensive testing documentation
- **[Component Organization](./projectdocs/COMPONENT_ORGANIZATION.md)** - Architecture and structure guide
- **[Project Structure](./projectdocs/PROJECT_STRUCTURE.md)** - Complete directory organization
- **[Dependencies](./projectdocs/DEPENDENCIES.md)** - Dependency guide and management

→ **[View all documentation](./projectdocs/README.md)**

## 🚀 Features

- **LitElement Web Components** - Modern, lightweight web components with TypeScript
- **WebHID Integration** - Direct hardware access to graphics tablets
- **Real-time Drawing Canvas** - Interactive canvas with pressure sensitivity simulation
- **Device Management** - Easy connection and status monitoring
- **Comprehensive Testing** - Unit tests with Vitest and integration tests with Playwright
- **Hot Module Replacement** - Fast development with Vite

## 📋 Prerequisites

- Node.js 18+ and npm
- A Chromium-based browser (Chrome, Edge, etc.) for WebHID support

## 🛠️ Installation

```bash
npm install
```

## 🏃 Development

Start the development server with hot module replacement:

```bash
npm run dev
```

The app will open at `http://localhost:3000`

## 🧪 Testing

### Unit Tests (Vitest)

Run unit tests for the tablet services:

```bash
npm test                # Run tests in watch mode
npm run test:ui         # Run with Vitest UI
npm run test:coverage   # Generate coverage report
```

### Integration Tests (Playwright)

Run end-to-end tests for the UI components:

```bash
npm run test:integration        # Run integration tests
npm run test:integration:ui     # Run with Playwright UI
```

Install Playwright browsers (first time only):

```bash
npx playwright install
```

## 🏗️ Building

Build the project for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## 📁 Project Structure

```
thelearningtablet/
├── src/
│   ├── components/           # LitElement web components
│   │   ├── tablet-app.ts     # Main application component
│   │   ├── tablet-status.ts  # Connection status component
│   │   └── drawing-canvas.ts # Interactive drawing canvas
│   ├── finddevice.ts         # HID device discovery
│   ├── hid-reader.ts         # HID data reading
│   ├── tablet-controller.ts  # Main tablet controller
│   └── index.ts              # Public API exports
├── test/
│   ├── unit/                 # Vitest unit tests
│   ├── integration/          # Playwright integration tests
│   └── setup.ts              # Test setup configuration
├── event-emitter.ts          # Event system
├── data-helpers.ts           # Data parsing utilities
├── index.html                # App entry point
├── vite.config.ts            # Vite configuration
├── playwright.config.ts      # Playwright configuration
└── tsconfig.json             # TypeScript configuration
```

## 🎨 Components

### `<tablet-app>`
Main application component that orchestrates the tablet interface.

### `<tablet-status>`
Displays device connection status and provides connection controls.

### `<drawing-canvas>`
Interactive canvas for drawing with mouse or tablet input.

## 🧩 Core Services

### TabletController
High-level controller for managing tablet connections and processing tablet events.

### HIDReader
Handles reading data from HID devices and processing raw data.

### DeviceFinder
Manages device discovery, enumeration, and connection.

## 📝 Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm test` - Run unit tests (watch mode)
- `npm run test:coverage` - Run tests with coverage
- `npm run test:integration` - Run Playwright integration tests
- `npm run lint` - Lint TypeScript files
- `npm run format` - Format code with Prettier

## 🌐 Browser Support

This application requires WebHID API support, which is available in:
- Chrome/Edge 89+
- Opera 75+

WebHID is **not** currently supported in Firefox or Safari.

## 📄 License

MIT

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

