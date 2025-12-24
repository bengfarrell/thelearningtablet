# Project Dependencies

Overview of key dependencies and why they're used.

## 📦 Production Dependencies

### LitElement & Lit (`lit@^3.3.1`)
**Purpose**: Web component framework  
**Why**: Lightweight, standards-based web components with excellent TypeScript support

### Spectrum Web Components (`@spectrum-web-components/bundle@^1.8.0`)
**Purpose**: Adobe's design system components  
**Why**: Optional UI component library for enhanced design patterns

## 🛠️ Development Dependencies

### Build Tools

#### Vite (`vite@^5.3.3`)
**Purpose**: Build tool and dev server  
**Why**: Lightning-fast HMR, modern ESM-based development, optimized builds  
**Config**: `vite.config.ts`

#### TypeScript (`typescript@~5.5.3`)
**Purpose**: Type-safe JavaScript  
**Why**: Catch errors at compile time, better IDE support, self-documenting code  
**Config**: `tsconfig.json`, `tsconfig.build.json`

### Testing

#### Vitest (`vitest@^1.6.0`)
**Purpose**: Unit testing framework  
**Why**: Fast, Vite-native, Jest-compatible API, excellent TypeScript support  
**Usage**: `npm test`

#### Playwright (`@playwright/test@^1.45.0`)
**Purpose**: End-to-end testing  
**Why**: Cross-browser testing, reliable automation, great developer experience  
**Usage**: `npm run test:integration`

#### Vitest UI (`@vitest/ui@^1.6.0`)
**Purpose**: Visual test runner  
**Why**: Interactive test debugging and monitoring  
**Usage**: `npm run test:ui`

#### Coverage (`@vitest/coverage-v8@^1.6.0`)
**Purpose**: Code coverage reporting  
**Why**: Track test coverage metrics  
**Usage**: `npm run test:coverage`

### Testing Libraries

#### Testing Library (`@testing-library/jest-dom@^6.4.6`)
**Purpose**: Custom DOM matchers  
**Why**: Better assertions for DOM testing

#### jsdom (`jsdom@^24.1.0`)
**Purpose**: DOM implementation in Node  
**Why**: Run tests without a real browser (fast)

#### happy-dom (`happy-dom@^14.12.3`)
**Purpose**: Alternative DOM implementation  
**Why**: Even faster DOM for simple tests

### Code Quality

#### ESLint (`eslint@^8.57.0`)
**Purpose**: Code linting  
**Why**: Enforce code style and catch common mistakes  
**Plugins**: 
- `@typescript-eslint/eslint-plugin@^7.16.0`
- `@typescript-eslint/parser@^7.16.0`  
**Config**: `.eslintrc.json`

#### Prettier (`prettier@^3.3.2`)
**Purpose**: Code formatting  
**Why**: Consistent code style across the project  
**Usage**: `npm run format`

### Type Definitions

#### WebHID Types (`@types/w3c-web-hid@latest`) ⭐
**Purpose**: TypeScript definitions for WebHID API  
**Why**: Official types from DefinitelyTyped for the WebHID browser API  
**Note**: Replaces custom `types/webhid.d.ts` file

#### Node Types (`@types/node@^20.14.10`)
**Purpose**: Node.js type definitions  
**Why**: TypeScript support for Node APIs used in config files

## 📚 Special Dependencies

### Official WebHID Types

We use **`@types/w3c-web-hid`** instead of custom type definitions:

```bash
npm install --save-dev @types/w3c-web-hid
```

**Benefits**:
- ✅ Maintained by the TypeScript community
- ✅ Always up-to-date with W3C spec
- ✅ Well-tested and reliable
- ✅ No need to maintain custom types

**Configuration** (`tsconfig.json`):
```json
{
  "compilerOptions": {
    "types": ["w3c-web-hid", ...]
  }
}
```

## 🔄 Dependency Management

### Version Strategy

- **Production**: Use caret ranges (`^`) for flexibility
- **DevDependencies**: Use caret ranges for tools
- **TypeScript**: Use tilde (`~`) for stability

### Updating Dependencies

```bash
# Check for updates
npm outdated

# Update a specific package
npm update package-name

# Update all (carefully!)
npm update

# Check for security issues
npm audit

# Fix security issues (non-breaking)
npm audit fix
```

### Lock File

**`package-lock.json`** ensures consistent installs across environments:
- ✅ Commit to version control
- ✅ Use `npm ci` in CI/CD for faster, reproducible installs
- ✅ Use `npm install` for local development

## 🧪 Testing Dependencies Breakdown

### Why Two DOM Implementations?

- **jsdom**: More complete, better compatibility
- **happy-dom**: Faster, good for simple tests

Vitest uses jsdom by default (configured in `vite.config.ts`).

### Why Both Vitest and Playwright?

- **Vitest**: Fast unit tests for functions/classes
- **Playwright**: Real browser tests for UI/integration

Different tools for different needs!

## 📈 Bundle Size Impact

### Production Bundle

Current size: **~11 KB gzipped**

**Heavy dependencies** (excluded from bundle):
- ✅ Lit (`external` in build config)
- ✅ All dev dependencies (not bundled)

**Included in bundle**:
- Core services (finddevice, hid-reader, etc.)
- Components (if importing the library)

### Optimization Tips

1. **Tree-shaking**: Vite automatically removes unused code
2. **External dependencies**: Lit is marked as external
3. **Code splitting**: Use dynamic imports when needed

## 🔍 Dependency Health

### Checking Security

```bash
# Audit all dependencies
npm audit

# View detailed report
npm audit --json

# Fix automatically (may break things)
npm audit fix --force
```

### Checking for Updates

```bash
# See what's outdated
npm outdated

# Interactive updater (install globally first)
npx npm-check-updates -i
```

## 📝 Adding New Dependencies

### Production Dependency

```bash
npm install package-name
```

### Development Dependency

```bash
npm install --save-dev package-name
```

### Type Definitions

```bash
npm install --save-dev @types/package-name
```

## 🎯 Recommended Extensions

While not npm dependencies, these VS Code extensions work great with this stack:

- **Lit Plugin** - Syntax highlighting for Lit templates
- **ESLint** - Real-time linting
- **Prettier** - Format on save
- **Vitest** - Test runner integration

## 📊 Dependency Tree

```
Production:
├── lit
└── @spectrum-web-components/bundle

Development:
├── Build Tools
│   ├── vite
│   └── typescript
├── Testing
│   ├── vitest
│   ├── @playwright/test
│   └── @vitest/ui
├── Code Quality
│   ├── eslint
│   └── prettier
└── Types
    ├── @types/w3c-web-hid  ⭐
    ├── @types/node
    └── @testing-library/jest-dom
```

---

**Last Updated**: November 2025

