# Component Organization

The project has been reorganized with each component in its own folder and CSS separated into dedicated style files.

## 📁 Structure

```
src/
├── components/
│   ├── hid-data-reader/
│   │   ├── hid-data-reader.ts           # Main HID data reader component
│   │   └── hid-data-reader.styles.ts    # Separated CSS styles
│   ├── bytes-display/
│   │   ├── bytes-display.ts             # Byte visualization component
│   │   └── bytes-display.styles.ts      # Separated CSS styles
│   ├── drawing-canvas/
│   │   ├── drawing-canvas.ts            # Canvas component
│   │   └── drawing-canvas.styles.ts     # Separated CSS styles
│   ├── hid-json-config/
│   │   ├── hid-json-config.ts           # JSON config display
│   │   └── hid-json-config.styles.ts    # Separated CSS styles
│   ├── hid-walkthrough-progress/
│   │   ├── hid-walkthrough-progress.ts  # Progress indicator
│   │   └── hid-walkthrough-progress.styles.ts
│   └── device-metadata-form/
│       └── device-metadata-form.ts      # Device metadata form
├── utils/
│   ├── data-helpers.ts                  # HID data parsing utilities
│   ├── event-emitter.ts                 # Event system
│   ├── finddevice.ts                    # Device discovery
│   ├── hid-reader.ts                    # HID data reader
│   └── byte-detector.ts                 # Byte analysis utilities
├── models/
│   └── config.ts                        # Configuration model
├── mockbytes/                           # Mock tablet simulation
└── index.ts                             # Public API exports
```

## 🎨 Component Structure

Each component now follows this pattern:

### Component File (`*.ts`)
```typescript
import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { styles } from './component-name.styles.js';

@customElement('component-name')
export class ComponentName extends LitElement {
  static styles = styles;
  
  // Component logic here
}
```

### Styles File (`*.styles.ts`)
```typescript
import { css } from 'lit';

export const styles = css`
  /* All CSS for the component */
`;
```

## Benefits

### ✅ Separation of Concerns
- **Logic** in `.ts` files
- **Styles** in `.styles.ts` files
- Clear responsibility for each file

### ✅ Improved Maintainability
- Easy to find component-related files
- No more monolithic component files
- Better code organization

### ✅ Easier Collaboration
- Multiple developers can work on different parts
- Reduced merge conflicts
- Clear file structure

### ✅ Better Reusability
- Styles can be shared or extended
- Components are self-contained
- Clear import paths

## Import Examples

### From HTML
```html
<!-- Load only the main component, it loads its dependencies -->
<script type="module" src="/src/components/hid-data-reader/hid-data-reader.ts"></script>
```

### From TypeScript
```typescript
// Import a component
import './components/bytes-display/bytes-display.js';

// Import styles (for extending or reusing)
import { styles } from './component-name.styles.js';
```

## Component Dependencies

```
hid-data-reader
├── bytes-display (child component)
├── hid-json-config (child component)
├── hid-walkthrough-progress (child component)
└── device-metadata-form (child component)
```

The main `hid-data-reader` component automatically imports and uses the other components.

## Style Architecture

Each component's styles are:
- ✅ **Scoped** using Shadow DOM (`:host` selector)
- ✅ **Isolated** - no global style pollution
- ✅ **Type-safe** - using Lit's `css` tagged template
- ✅ **Maintainable** - in dedicated files

### Example Style File

```typescript
import { css } from 'lit';

export const styles = css`
  :host {
    display: block;
    color: #333;
  }

  .button {
    padding: 12px 24px;
    background: #667eea;
    color: white;
  }

  /* Responsive design */
  @media (min-width: 768px) {
    .content {
      grid-template-columns: 1fr 2fr;
    }
  }
`;
```

## Build Configuration

The project uses two TypeScript configurations:

### `tsconfig.json` (Development)
- Includes test files
- Has Vitest types
- Used for IDE support and testing

### `tsconfig.build.json` (Production)
- Only includes `src/**/*`
- No test dependencies
- Optimized for production build

## Testing

Run tests: `npm test`

## Development

Start the dev server with:
```bash
npm run dev
```

The reorganized components will hot-reload when changes are made to either:
- Component logic files (`.ts`)
- Style files (`.styles.ts`)

## Building

Build for production:
```bash
npm run build
```

Output includes:
- Compiled TypeScript
- Bundled components
- Type definitions
