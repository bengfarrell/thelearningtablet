# Test Fixtures

This directory contains test fixture files used by unit and integration tests.

## Available Fixtures

### `test-tablet-config.json`

A sample tablet configuration file used for testing the Config utilities (`toJSON`, `fromJSON`, `load` functions).

**Purpose:**
- Tests config parsing and validation
- Provides a known-good configuration for integration tests
- Can be used as a reference for creating new configurations

**Usage in tests:**
```typescript
import { readFileSync } from 'fs';
import { join } from 'path';
import { fromJSON } from '../../src/models';

const fixturePath = join(__dirname, '..', 'fixtures', 'test-tablet-config.json');
const fixtureContent = readFileSync(fixturePath, 'utf-8');
const config = fromJSON(fixtureContent);
```

## Adding New Fixtures

When adding new fixture files:
1. Place them in this directory
2. Use descriptive names (e.g., `advanced-tablet-config.json`, `minimal-config.json`)
3. Document them in this README
4. Add corresponding tests in `/test/unit/` or `/test/integration/`

