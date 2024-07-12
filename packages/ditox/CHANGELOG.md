# Change Log

All notable changes to this project will be documented in this file. See
[Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [3.0.0](https://github.com/mnasyrov/ditox/compare/v2.4.1...v3.0.0) (2024-07-12)

### Bug Fixes

- Changed resolution of "scoped" bindings to keep a created value in the
  container which owns the factory
  ([#40](https://github.com/mnasyrov/ditox/issues/40))
  ([736ef2f](https://github.com/mnasyrov/ditox/commit/736ef2f927d43c91f027c68e230371cce3f50131))
- Fixed binding modules
  ([997ca44](https://github.com/mnasyrov/ditox/commit/997ca44b09446a6e4d524ba9c16ce0c9cd7995d8))

# Change Log

All notable changes to this project will be documented in this file. See
[Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [3.0.0-dev.2](https://github.com/mnasyrov/ditox/compare/v3.0.0-dev.1...v3.0.0-dev.2) (2024-07-11)

### Bug Fixes

- Fixed binding modules
  ([997ca44](https://github.com/mnasyrov/ditox/commit/997ca44b09446a6e4d524ba9c16ce0c9cd7995d8))
- New factory binding doesn't reset a cached value
  ([7a33dc6](https://github.com/mnasyrov/ditox/commit/7a33dc63d5b95588c5ed5e7ad4e1e748230bcc2e))

# Change Log

All notable changes to this project will be documented in this file. See
[Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [3.0.0-dev.1](https://github.com/mnasyrov/ditox/compare/v2.4.1...v3.0.0-dev.1) (2024-05-31)

### Bug Fixes

- Changed resolution of "scoped" bindings to keep a created value in the
  container which owns the factory
  ([#40](https://github.com/mnasyrov/ditox/issues/40))
  ([736ef2f](https://github.com/mnasyrov/ditox/commit/736ef2f927d43c91f027c68e230371cce3f50131))

# Change Log

All notable changes to this project will be documented in this file. See
[Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [2.4.1](https://github.com/mnasyrov/ditox/compare/v2.4.0...v2.4.1) (2023-10-27)

**Note:** Version bump only for package ditox

# Change Log

All notable changes to this project will be documented in this file. See
[Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [2.4.0](https://github.com/mnasyrov/ditox/compare/v2.3.1...v2.4.0) (2023-09-08)

### Features

- Ability to create a shareable token by providing a key for its symbol
  ([4fde1d9](https://github.com/mnasyrov/ditox/commit/4fde1d95dc728018c67f8fc5e154597e9115d8b5))

# Change Log

All notable changes to this project will be documented in this file. See
[Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [2.3.1](https://github.com/mnasyrov/ditox/compare/v2.3.0...v2.3.1) (2023-04-01)

**Note:** Version bump only for package ditox

# [2.3.0](https://github.com/mnasyrov/ditox/compare/v2.2.0...v2.3.0) (2022-12-22)

### Bug Fixes

- Compatible with Typescript 4.9. Updated dependencies.
  ([d8aa9e2](https://github.com/mnasyrov/ditox/commit/d8aa9e2a4a665d6e14f3581c652feb6ad01b71d8))

# [2.2.0](https://github.com/mnasyrov/ditox/compare/v2.1.0...v2.2.0) (2022-01-29)

### Code Refactoring

- Removed the deprecated code
  ([a821171](https://github.com/mnasyrov/ditox/commit/a821171e5de011b82f4f1aedbe91f3f6d2ef6360))

### BREAKING CHANGES

- Removed the deprecated code:

* `exportedProps` property of the module declaration
* utilities:
  - getValues()
  - getProps()
  - resolveProps()
  - injectableProps() Use v2.1 version to migrate to the unified API.

# [2.1.0](https://github.com/mnasyrov/ditox/compare/v2.0.0...v2.1.0) (2022-01-29)

### Features

- Unified API of resolving utilities. Introduced "injectableClass()" utility.
  ([aea7a8f](https://github.com/mnasyrov/ditox/commit/aea7a8fdedae079e8bad86f8556669ab3257197a))

# [2.0.0](https://github.com/mnasyrov/ditox/compare/v1.4.2...v2.0.0) (2022-01-26)

### chore

- Dropped supporting of Flow.js typings.
  ([9a94f55](https://github.com/mnasyrov/ditox/commit/9a94f558daf107ff4744462e078571e4ccc7c444))

### BREAKING CHANGES

- Dropped supporting of Flow.js typings. Use the previous versions of the
  library with Flow.js

## [1.4.2](https://github.com/mnasyrov/ditox/compare/v1.4.1...v1.4.2) (2021-11-18)

### Bug Fixes

- Typings for `bindMultiValue()` utility function.
  ([cb2b2da](https://github.com/mnasyrov/ditox/commit/cb2b2da27ad7bd293d8d5591017422ba4599d09a))

## [1.4.1](https://github.com/mnasyrov/ditox/compare/v1.4.0...v1.4.1) (2021-11-11)

### Bug Fixes

- beforeBinding() must be called before importing external modules.
  ([153c602](https://github.com/mnasyrov/ditox/commit/153c60256a4c2796e5a9f2d9c5115c3ff3f2f10b))

# [1.4.0](https://github.com/mnasyrov/ditox/compare/v1.3.0...v1.4.0) (2021-10-30)

### Features

- `ModuleDeclaration.imports` property takes module entries for binding with the
  module.
  ([6757bdc](https://github.com/mnasyrov/ditox/commit/6757bdc87a02d2336ca07661c50812a5823ca844))

# [1.3.0](https://github.com/mnasyrov/ditox/compare/v1.2.0...v1.3.0) (2021-08-04)

### Features

- `declareModule()` and `declareModuleBindings()` utility functions
  ([990ffe7](https://github.com/mnasyrov/ditox/commit/990ffe79af37c6ee56738b6ac7e9c071818d10f7))

# [1.2.0](https://github.com/mnasyrov/ditox/compare/v1.1.0...v1.2.0) (2021-06-20)

### Bug Fixes

- Fixed resolving a singleton registered in the parent.
  ([224c595](https://github.com/mnasyrov/ditox/commit/224c59585e43c68cc23e6abf521ecad09aeb1c7a))

### Features

- `bindModules()` utility function.
  ([e62d6c3](https://github.com/mnasyrov/ditox/commit/e62d6c3332f991b8e3943ad269bd6e76cb6a266c))
- Dependency modules
  ([d01d333](https://github.com/mnasyrov/ditox/commit/d01d33347788c7eeeaee014fa794684ffbd4b2e7))

# [1.1.0](https://github.com/mnasyrov/ditox/compare/v1.0.2...v1.1.0) (2021-04-17)

### Bug Fixes

- Fixed typings and arity for `getValues()`, `resolveValues()` and
  `injectable()`.
  ([92f57dc](https://github.com/mnasyrov/ditox/commit/92f57dcc1777c4c622d61c68196db3d48f3fa186))

### Features

- `Container.hasToken()` for checking token presence.
  ([56043ae](https://github.com/mnasyrov/ditox/commit/56043aec494481cc624b30d81e33df33a8273e63))
- Utilities for resolving object properties by tokens
  ([d4a41e8](https://github.com/mnasyrov/ditox/commit/d4a41e8d777540905a4bc15fc22bcb06a85cf90a))

## [1.0.1](https://github.com/mnasyrov/ditox/compare/v1.0.0...v1.0.1) (2021-03-04)

### Bug Fixes

- Fixed bundled typings for Typescript
  ([7b1499e](https://github.com/mnasyrov/ditox/commit/7b1499e7cf1506f24f72387d83a055e6a4d3c336))

# [1.0.0](https://github.com/mnasyrov/ditox/compare/v0.5.4...v1.0.0) (2021-02-28)

**Note:** Version bump only for package ditox

## [0.5.4](https://github.com/mnasyrov/ditox/compare/v0.5.3...v0.5.4) (2021-02-28)

**Note:** Version bump only for package ditox

## [0.5.3](https://github.com/mnasyrov/ditox/compare/v0.5.2...v0.5.3) (2021-02-25)

**Note:** Version bump only for package ditox

## [0.5.1](https://github.com/mnasyrov/ditox/compare/v0.5.0...v0.5.1) (2021-02-25)

**Note:** Version bump only for package ditox

# [0.5.0](https://github.com/mnasyrov/ditox/compare/v0.4.1...v0.5.0) (2021-02-24)

### Features

- Introduced @ditox/react - tooling for React apps
  ([cd9c9db](https://github.com/mnasyrov/ditox/commit/cd9c9db9d65fda468f0e740c49e090757f1ac73a))
