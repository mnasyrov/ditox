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
