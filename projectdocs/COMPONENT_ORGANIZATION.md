# Component Organization

The project has been reorganized with each component in its own folder and CSS separated into dedicated style files.

## 📁 New Structure

```
src/
├── components/
│   ├── tablet-app/
│   │   ├── tablet-app.ts           # Main app component
│   │   └── tablet-app.styles.ts    # Separated CSS styles
│   ├── tablet-status/
│   │   ├── tablet-status.ts        # Status display component  
│   │   └── tablet-status.styles.ts # Separated CSS styles
│   └── drawing-canvas/
│       ├── drawing-canvas.ts       # Canvas component
│       └── drawing-canvas.styles.ts # Separated CSS styles
├── data-helpers.ts                 # HID data parsing utilities
├── event-emitter.ts                # Event system
├── finddevice.ts                   # Device discovery
├── hid-reader.ts                   # HID data reader
├── index.ts                        # Public API exports
└── types/
    └── webhid.d.ts                 # WebHID TypeScript definitions
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
<script type="module" src="/src/components/tablet-app/tablet-app.ts"></script>
```

### From TypeScript
```typescript
// Import a component
import './components/tablet-status/tablet-status.js';

// Import styles (for extending or reusing)
import { styles } from './component-name.styles.js';
```

## Component Dependencies

```
tablet-app
├── tablet-status (child component)
└── drawing-canvas (child component)
```

The main `tablet-app` component automatically imports and uses the other components.

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

All 94 unit tests continue to pass after reorganization:
- ✅ 40 tests for data helpers
- ✅ 28 tests for device finder  
- ✅ 26 tests for HID reader

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

