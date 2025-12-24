# Quick Start Guide

Get up and running with The Learning Tablet in 3 steps!

## Step 1: Install Dependencies

```bash
npm install
```

This will install all required packages including:
- Vite (dev server and bundler)
- LitElement (web components)
- Vitest (unit testing)
- Playwright (integration testing)

## Step 2: Start the Dev Server

```bash
npm run dev
```

This will:
- Start Vite dev server on port 3000
- Open your browser automatically
- Enable hot module replacement (HMR)

## Step 3: Explore the App

The application will open in your browser showing:

1. **Device Status Panel** - Shows connection state
   - Click "Connect Device" to connect a tablet (demo mode available)
   
2. **Drawing Canvas** - Interactive drawing area
   - Draw with your mouse to test
   - Real tablet will provide pressure sensitivity
   - Use controls to change colors or clear canvas

## Running Tests

### Unit Tests (Fast)

```bash
npm test
```

Watch mode will run tests as you edit files.

### Integration Tests (Full Browser)

First time setup:
```bash
npx playwright install
```

Then run tests:
```bash
npm run test:integration
```

## Project Layout

```
src/
├── components/          # UI components
│   ├── tablet-app.ts    # Main app
│   ├── tablet-status.ts # Connection UI
│   └── drawing-canvas.ts # Drawing surface
├── tablet-controller.ts # Core tablet logic
├── hid-reader.ts        # HID data reader
└── finddevice.ts        # Device discovery

test/
├── unit/                # Service unit tests
└── integration/         # UI integration tests
```

## Common Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm test` | Run unit tests |
| `npm run test:ui` | Open Vitest UI |
| `npm run test:coverage` | Generate coverage report |
| `npm run test:integration` | Run Playwright tests |
| `npm run build` | Build for production |
| `npm run lint` | Check TypeScript |
| `npm run format` | Format code |

## Next Steps

- Connect a real graphics tablet via WebHID
- Modify the components in `src/components/`
- Add new tests in `test/unit/` or `test/integration/`
- Build custom features with the tablet controller API

## Need Help?

- Check out the [full README](./README.md)
- Review the [component examples](./src/components/)
- Look at the [test examples](./test/)

Happy coding! 🎨

