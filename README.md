# Ditox.js

<img alt="lemon" src="lemon.svg" width="120" />

Detoxed dependency injection container.

[![npm](https://img.shields.io/npm/v/ditox.svg)](https://www.npmjs.com/package/ditox)
[![downloads](https://img.shields.io/npm/dt/ditox.svg)](https://www.npmjs.com/package/ditox)
[![types](https://img.shields.io/npm/types/ditox.svg)](https://www.npmjs.com/package/ditox)
[![licence](https://img.shields.io/github/license/mnasyrov/ditox.svg)](https://github.com/mnasyrov/ditox/blob/master/LICENSE)
[![Coverage Status](https://coveralls.io/repos/github/mnasyrov/ditox/badge.svg)](https://coveralls.io/github/mnasyrov/ditox)

## Table of Contents

<!-- toc -->

- [Features](#features)
- [Packages](#packages)
- [Installation](#installation)
- [Usage](#usage)
- [Container Hierarchy](#container-hierarchy)
- [Factory Lifetimes](#factory-lifetimes)
  * [`singleton`](#singleton)
  * [`scoped`](#scoped)
  * [`transient`](#transient)
- [Dependency modules](#dependency-modules)
- [API References](#api-references)

<!-- tocstop -->

## Features

- Simple and functional API
- Container hierarchy
- Scoped containers
- Dependency modules
- Multi-value tokens
- Typescript and Flow typings
- Supports Node.js, Deno and browsers

## Packages

- [`ditox`](packages/ditox/README.md) - core DI container and tools
- [`@ditox/react`](packages/ditox-react/README.md) - tooling for React.js

## Installation

Install with `npm`

```
npm install ditox --save
```

Or `yarn`

```
yarn add ditox
```

You can also use the [UMD](https://github.com/umdjs/umd) build from `unpkg`

```html
<script src="https://unpkg.com/ditox/dist/index.browser.js" />
<script>
  const container = Ditox.createContainer();
</script>
```

Usage with Deno:

```ts
import {createContainer} from 'https://deno.land/x/ditox/mod.ts';

const container = createContainer();
```

## Usage

Ditox.js works with containers, tokens, values and value factories.
There are no class decorators, field injectors and other magic stuff. Only explicit binding and resolving.

In general, all you need is to do the following:

- Create binding tokens.
- Create a container.
- Register values and factories in the container using the tokens.
- Resolve the tokens and use the provided values.

```js
import {createContainer, injectable, optional, token} from 'ditox';

// This is app code, some factory functions and classes:
function createStorage(config) {}

function createLogger(config) {}

class UserService {
  constructor(storage, logger) {}
}

// Define tokens for injections.
// Token can be optional to provide default values.
const TOKENS = {
  StorageConfig: optional(token(), {name: 'default storage'}),
  Storage: token('Token description for debugging'),
  Logger: token(),
  UserService: token(),
};

// Create the container.
const container = createContainer();

// Provide a value to the container.
container.bindValue(TOKENS.StorageConfig, {name: 'custom storage'});

// Dynamic values are provided by factories.

// A factory can be decorated with `injectable()` to resolve its arguments.
// By default, a factory has `singleton` lifetime.
container.bindFactory(
  TOKENS.Storage,
  injectable(createStorage, TOKENS.StorageConfig),
);

// A factory can have `transient` lifetime to create a value on each resolving.
container.bindFactory(TOKENS.Logger, createLogger, {scope: 'transient'});

// Classes are provided by factories.
container.bindFactory(
  TOKENS.UserService,
  injectable(
    (storage, logger) => new UserService(storage, logger),
    TOKENS.Storage,
    // A token can be made optional to resolve with a default value
    // when it is not found during resolving.
    optional(TOKENS.Logger),
  ),
  {
    // `scoped` and `singleton` scopes can have `onRemoved` callback.
    // It is called when a token is removed from the container.
    scope: 'scoped',
    onRemoved: (userService) => userService.destroy(),
  },
);

// Get a value from the container, it returns `undefined` in case a value is not found.
const logger = container.get(TOKENS.Logger);

// Resolve a value, it throws `ResolverError` in case a value is not found.
const userService = container.resolve(TOKENS.userService);

// Remove a value from the container.
container.remove(TOKENS.Logger);

// Clean up the container.
container.removeAll();
```

## Container Hierarchy

Ditox.js supports "parent-child" hierarchy. If the child container cannot to resolve a token, it asks the parent container to resolve it:

```js
import {creatContainer, token} from 'ditox';

const V1 = token();
const V2 = token();

const parent = createContainer();
parent.bindValue(V1, 10);
parent.bindValue(V2, 20);

const container = createContainer(parent);
container.bindValue(V2, 21);

container.resolve(V1); // 10
container.resolve(V2); // 21
```

## Factory Lifetimes

Ditox.js supports managing the lifetime of values which are produced by factories.
There are the following types:

- `singleton` - **This is the default**. The value is created and cached by the container which registered the factory.
- `scoped` - The value is created and cached by the container which starts resolving.
- `transient` - The value is created every time it is resolved.

### `singleton`

**This is the default scope**. "Singleton" allows to cache a produced value by a parent container which registered the factory:

```js
import {creatContainer, token} from 'ditox';

const TAG = token();
const LOGGER = token();

const createLogger = (tag) => (message) => console.log(`[${tag}] ${message}`);

const parent = createContainer();
parent.bindValue(TAG, 'parent');
parent.bindFactory(LOGGER, injectable(createLogger, TAG, {scope: 'singleton'}));

const container1 = createContainer(parent);
container1.bindValue(TAG, 'container1');

const container2 = createContainer(parent);
container2.bindValue(TAG, 'container2');

parent.resolve(LOGGER)('xyz'); // [parent] xyz
container1.resolve(LOGGER)('foo'); // [parent] foo
container2.resolve(LOGGER)('bar'); // [parent] bar
```

### `scoped`

"Scoped" lifetime allows to have sub-containers with own instances of some services which can be disposed. For example, a context during HTTP request handling, or other unit of work:

```js
import {creatContainer, token} from 'ditox';

const TAG = token();
const LOGGER = token();

const createLogger = (tag) => (message) => console.log(`[${tag}] ${message}`);

const parent = createContainer();
// `scoped` is default scope and can be omitted.
parent.bindFactory(LOGGER, injectable(createLogger, TAG, {scope: 'scoped'}));

const container1 = createContainer(parent);
container1.bindValue(TAG, 'container1');

const container2 = createContainer(parent);
container2.bindValue(TAG, 'container2');

parent.resolve(LOGGER)('xyz'); // throws ResolverError, the parent does not have TAG value.
container1.resolve(LOGGER)('foo'); // [container1] foo
container2.resolve(LOGGER)('bar'); // [container2] bar

// Dispose a container.
container1.removeAll();
```

### `transient`

"Transient" makes to a produce values by the factory for each resolving:

```js
import {creatContainer, token} from 'ditox';

const TAG = token();
const LOGGER = token();

const createLogger = (tag) => (message) => console.log(`[${tag}] ${message}`);

const parent = createContainer();
parent.bindValue(TAG, 'parent');
parent.bindFactory(LOGGER, injectable(createLogger, TAG, {scope: 'singleton'}));

const container1 = createContainer(parent);
container1.bindValue(TAG, 'container1');

const container2 = createContainer(parent);
container2.bindValue(TAG, 'container2');

parent.resolve(LOGGER)('xyz'); // [parent] xyz
container1.resolve(LOGGER)('foo'); // [container1] foo
container2.resolve(LOGGER)('bar'); // [container2] bar

parent.bindValue(TAG, 'parent-rebind');
parent.resolve(LOGGER)('xyz'); // [parent-rebind] xyz
```

## Dependency modules

Dependencies can be organized as modules in declarative way with `ModuleDeclaration`.
It is useful for providing pieces of functionality from libraries to an app which depends on them.

```ts
type LoggerModule = Module<{logger: Logger}>;

const LOGGER_MODULE_TOKEN = token<LoggerModule>;

const LOGGER_MODULE: ModuleDeclaration<LoggerModule> = {
  token: LOGGER_MODULE_TOKEN,
  factory: (container) => {
    const transport = container.resolve(TRANSPORT_TOKEN).open();
    return {
      logger: {log: (message) => transport.write(message)},
      destroy: () => transport.close(),
    };
  },
  exportedProps: {
    logger: LOGGER_TOKEN,
  },
};
```

Later such module declarations can be bound to a container:
```ts
const container = createContainer();

// bind a single module
bindModule(container, LOGGER_MODULE);

// or bind multiple depenendency modules
bindModules(container, [DATABASE_MODULE, CONFIG_MODULE, API_MODULE]);
```

There are utility functions for module declarations:
- `declareModule()` – declare a module as `ModuleDeclaration` however `token` field can be optional for anonymous modules.
- `declareModuleBindings()` – declares an anonymous module with imports. This module binds the provided ones to a container.

Example for these functions:

```ts
const LOGGER_MODULE = declareModule<LoggerModule>({
  factory: createLoggerModule,
  exportedProps: {
    logger: LOGGER_TOKEN,
  },
});

const APP_MODULE = declareModuleBinding([LOGGER_MODULE, DATABASE_MODULE]);
```

## API References

- [`ditox`](packages/ditox/docs)
- [`@ditox/react`](packages/ditox-react/docs)

---

&copy; 2020-2021 [Mikhail Nasyrov](https://github.com/mnasyrov), [MIT license](./LICENSE)
