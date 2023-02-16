# Ditox.js

<img alt="lemon" src="https://raw.githubusercontent.com/mnasyrov/ditox/master/lemon.svg" width="120" />

Powerful dependency injection container for building modular apps.

[![npm](https://img.shields.io/npm/v/ditox.svg)](https://www.npmjs.com/package/ditox)
[![downloads](https://img.shields.io/npm/dt/ditox.svg)](https://www.npmjs.com/package/ditox)
[![types](https://img.shields.io/npm/types/ditox.svg)](https://www.npmjs.com/package/ditox)
[![licence](https://img.shields.io/github/license/mnasyrov/ditox.svg)](https://github.com/mnasyrov/ditox/blob/master/LICENSE)
[![Coverage Status](https://coveralls.io/repos/github/mnasyrov/ditox/badge.svg)](https://coveralls.io/github/mnasyrov/ditox)

## Table of Contents

<!-- toc -->

- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Container Hierarchy](#container-hierarchy)
- [Factory Lifetimes](#factory-lifetimes)
  - [`singleton`](#singleton)
  - [`scoped`](#scoped)
  - [`transient`](#transient)
- [Dependency modules](#dependency-modules)
- [API References](#api-references)

<!-- tocstop -->

## Features

- Simple and functional API
- Container hierarchy
- Scoped containers
- Dependency modules
- Multi-value tokens
- Typescript typings
- Supports Node.js, Deno and browsers

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
There are no class decorators, field injectors and other magic. Only explicit binding and resolving.

In general, all you need is to do the following:

- Create binding tokens.
- Create a container.
- Register values and factories in the container using tokens.
- Resolve tokens and use the provided values.

```js
import {createContainer, injectable, optional, token} from 'ditox';

// This is app code, some factory functions and classes:
function createStorage(config) {}

function createLogger(config) {}

class UserService {
  constructor(storage, logger) {}
}

// Define tokens for injections.
const STORAGE_TOKEN = token('Token description for debugging');
const LOGGER_TOKEN = token();
const USER_SERVICE_TOKEN = token();

// Token can be optional with a default value.
const STORAGE_CONFIG_TOKEN = optional(token(), {name: 'default storage'});

// Create the container.
const container = createContainer();

// Provide a value to the container.
container.bindValue(STORAGE_CONFIG_TOKEN, {name: 'custom storage'});

// Dynamic values are provided by factories.

// A factory can be decorated with `injectable()` to resolve its arguments.
// By default, a factory has `singleton` lifetime.
container.bindFactory(
  STORAGE_TOKEN,
  injectable(createStorage, STORAGE_CONFIG_TOKEN),
);

// A factory can have `transient` lifetime to create a value on each resolving.
container.bindFactory(LOGGER_TOKEN, createLogger, {scope: 'transient'});

// A class can be injected by `injectableClass()` which calls its constructor
// with injected dependencies as arguments.
container.bindFactory(
  USER_SERVICE_TOKEN,
  injectable(
    (storage, logger) => new UserService(storage, logger),
    STORAGE_TOKEN,
    // A token can be made optional to resolve with a default value
    // when it is not found during resolving.
    optional(LOGGER_TOKEN),
  ),
  {
    // `scoped` and `singleton` scopes can have `onRemoved` callback.
    // It is called when a token is removed from the container.
    scope: 'scoped',
    onRemoved: (userService) => userService.destroy(),
  },
);

// Get a value from the container, it returns `undefined` in case a value is not found.
const logger = container.get(LOGGER_TOKEN);

// Resolve a value, it throws `ResolverError` in case a value is not found.
const userService = container.resolve(userService);

// Remove a value from the container.
container.remove(LOGGER_TOKEN);

// Clean up the container.
container.removeAll();
```

## Container Hierarchy

Ditox.js supports "parent-child" hierarchy. If the child container cannot to resolve a token, it asks the parent container to resolve it:

```js
import {creatContainer, token} from 'ditox';

const V1_TOKEN = token();
const V2_TOKEN = token();

const parent = createContainer();
parent.bindValue(V1_TOKEN, 10);
parent.bindValue(V2_TOKEN, 20);

const container = createContainer(parent);
container.bindValue(V2_TOKEN, 21);

container.resolve(V1_TOKEN); // 10
container.resolve(V2_TOKEN); // 21
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

const TAG_TOKEN = token();
const LOGGER_TOKEN = token();

const createLogger = (tag) => (message) => console.log(`[${tag}] ${message}`);

const parent = createContainer();
parent.bindValue(TAG_TOKEN, 'parent');
parent.bindFactory(LOGGER_TOKEN, injectable(createLogger, TAG_TOKEN), {
  scope: 'singleton',
});

const container1 = createContainer(parent);
container1.bindValue(TAG_TOKEN, 'container1');

const container2 = createContainer(parent);
container2.bindValue(TAG_TOKEN, 'container2');

parent.resolve(LOGGER_TOKEN)('xyz'); // [parent] xyz
container1.resolve(LOGGER_TOKEN)('foo'); // [parent] foo
container2.resolve(LOGGER_TOKEN)('bar'); // [parent] bar
```

### `scoped`

"Scoped" lifetime allows to have sub-containers with own instances of some services which can be disposed. For example, a context during HTTP request handling, or other unit of work:

```js
import {creatContainer, token} from 'ditox';

const TAG_TOKEN = token();
const LOGGER_TOKEN = token();

const createLogger = (tag) => (message) => console.log(`[${tag}] ${message}`);

const parent = createContainer();
// `scoped` is default scope and can be omitted.
parent.bindFactory(LOGGER_TOKEN, injectable(createLogger, TAG_TOKEN), {
  scope: 'scoped',
});

const container1 = createContainer(parent);
container1.bindValue(TAG_TOKEN, 'container1');

const container2 = createContainer(parent);
container2.bindValue(TAG_TOKEN, 'container2');

parent.resolve(LOGGER_TOKEN)('xyz'); // throws ResolverError, the parent does not have TAG value.
container1.resolve(LOGGER_TOKEN)('foo'); // [container1] foo
container2.resolve(LOGGER_TOKEN)('bar'); // [container2] bar

// Dispose a container.
container1.removeAll();
```

### `transient`

"Transient" makes to a produce values by the factory for each resolving:

```js
import {createContainer, token} from 'ditox';

const TAG_TOKEN = token();
const LOGGER_TOKEN = token();

const createLogger = (tag) => (message) => console.log(`[${tag}] ${message}`);

const parent = createContainer();
parent.bindValue(TAG_TOKEN, 'parent');
parent.bindFactory(LOGGER_TOKEN, injectable(createLogger, TAG_TOKEN), {
  scope: 'transient',
});

const container1 = createContainer(parent);
container1.bindValue(TAG_TOKEN, 'container1');

const container2 = createContainer(parent);
container2.bindValue(TAG_TOKEN, 'container2');

parent.resolve(LOGGER_TOKEN)('xyz'); // [parent] xyz
container1.resolve(LOGGER_TOKEN)('foo'); // [container1] foo
container2.resolve(LOGGER_TOKEN)('bar'); // [container2] bar

parent.bindValue(TAG_TOKEN, 'parent-rebind');
parent.resolve(LOGGER_TOKEN)('xyz'); // [parent-rebind] xyz
```

## Dependency modules

Dependencies can be organized as modules in declarative way with `ModuleDeclaration`.
It is useful for providing pieces of functionality from libraries to an app which depends on them.

```ts
import {Module, ModuleDeclaration, token} from 'ditox';
import {TRANSPORT_TOKEN} from './transport';

export type Logger = {log: (message: string) => void};
export const LOGGER_TOKEN = token<Logger>();

type LoggerModule = Module<{logger: Logger}>;

const LOGGER_MODULE_TOKEN = token<LoggerModule>();

const LOGGER_MODULE: ModuleDeclaration<LoggerModule> = {
  // An optional explicit token for a module itself
  token: LOGGER_MODULE_TOKEN,
  factory: (container) => {
    const transport = container.resolve(TRANSPORT_TOKEN).open();
    return {
      logger: {log: (message) => transport.write(message)},
      destroy: () => transport.close(),
    };
  },
  exports: {
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

Utility functions for module declarations:

- `declareModule()` – declare a module as `ModuleDeclaration` however `token` field can be optional for anonymous modules.
- `declareModuleBindings()` – declares an anonymous module with imports. This module binds the provided ones to a container.

Example for these functions:

```ts
const LOGGER_MODULE = declareModule<LoggerModule>({
  factory: createLoggerModule,
  exports: {
    logger: LOGGER_TOKEN,
  },
});

const APP_MODULE = declareModuleBinding([LOGGER_MODULE, DATABASE_MODULE]);
```

## API References

- [`ditox`](./docs)
- [`ditox-react`](https://github.com/mnasyrov/ditox/tree/master/packages/ditox-react#readme)

---

&copy; 2020-2023 [Mikhail Nasyrov](https://github.com/mnasyrov), [MIT license](./LICENSE)
