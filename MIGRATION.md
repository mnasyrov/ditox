# Migration Guide

## From v3 to v4

### `declareModuleBindings()` is removed

Use `declareModule()` with the `imports` field instead. It declares a module
which binds the imported modules to a container:

```ts
// Before
const APP_MODULE = declareModuleBindings([LOGGER_MODULE, DATABASE_MODULE]);

// After
const APP_MODULE = declareModule({
  imports: [LOGGER_MODULE, DATABASE_MODULE],
  factory: () => ({}),
});
```

### UMD bundle is removed

The packages are distributed as ESM and CommonJS modules only. The `unpkg`,
`umd:main`, `browser` and `react-native` fields were removed from
`package.json`. If you loaded the packages from a CDN as UMD scripts, switch to
ESM imports (for example, via a bundler or an import map).

### Node.js 22 or newer is required

The minimal supported Node.js version is 22 (previously 12).

### Build target is ES2020

The published code targets ES2020 (previously ES2015). If you need to support
older browsers, transpile the packages with your bundler.

### `ditox-react` peer dependency

`ditox-react` v4 requires `ditox` `^4.0.0` as a peer dependency. Upgrade both
packages together.

### Cleanup errors and reentrant removal

Version 3.3.1 makes `removeAll()` finish cleanup and rethrow the first error.
Version 4 keeps that cleanup guarantee but reports multiple failures with the
new exported `CleanupError`. Its `errors` array contains the original thrown
values in failure order, including non-`Error` values. A single failure is still
rethrown unchanged. Nested `CleanupError` objects are not flattened.

```ts
import { CleanupError } from 'ditox';

try {
  container.removeAll();
} catch (error) {
  const failures = error instanceof CleanupError ? error.errors : [error];
  for (const failure of failures) {
    console.error(failure);
  }
}
```

- `remove(token)` now removes the original binding even if `onRemoved` throws.
  Do not rely on retrying that callback through another removal of the token.
- Replacements created inside a single-token removal callback are preserved.
  Replacing only the factory keeps the new factory but removes the old cached
  value; replacing the cached value also keeps its associated factory.
- Module cleanup attempts to remove every export even if `destroy()` fails.
  Exports are still removed by token: an export rebound inside `destroy()` is
  also removed. Replacing a module during its own destruction is not atomic.
- A nested `removeAll()` during bulk cleanup is a no-op. Removing a cached record
  whose callback or options accessor is currently running is also a no-op.
  Other nested removals run immediately. Code that expected nested calls to
  repeat the active callback must move that work into the callback itself.
- Bulk cleanup invokes each cached record's callback at most once, and revisits
  current records created or resolved by callbacks at already visited tokens.
  Each cache write is a new record, even for the same object or `undefined`.
  Replacing a factory alone does not create a new cached record.

Cleanup remains synchronous. It does not resolve unused factories or dispose
transient or parent-owned values. It cannot resume execution inside a failing
callback, guarantee termination for endlessly mutating callbacks, or dispose
intermediate overwritten values that are no longer registered when visited.
