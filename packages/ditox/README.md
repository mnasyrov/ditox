# ditox package

<img alt="lemon" src="https://raw.githubusercontent.com/mnasyrov/ditox/master/lemon.svg" width="120" />

**Dependency injection for modular web applications**

Please see the documentation at [ditox.js.org](https://ditox.js.org)

[![npm](https://img.shields.io/npm/v/ditox)](https://www.npmjs.com/package/ditox)
[![stars](https://img.shields.io/github/stars/mnasyrov/ditox)](https://github.com/mnasyrov/ditox/stargazers)
[![types](https://img.shields.io/npm/types/ditox)](https://www.npmjs.com/package/ditox)
[![licence](https://img.shields.io/github/license/mnasyrov/ditox)](https://github.com/mnasyrov/ditox/blob/master/LICENSE)
[![coverage](https://coveralls.io/repos/github/mnasyrov/ditox/badge)](https://coveralls.io/github/mnasyrov/ditox)

## Installation

You can use the following command to install this package:

```shell
npm install --save ditox
```

The package can be used as [UMD](https://github.com/umdjs/umd) module. Use
[jsdelivr.com](https://jsdelivr.com) CDN site to load
[ditox](https://www.jsdelivr.com/package/npm/ditox):

```html
<script src="//cdn.jsdelivr.net/npm/ditox/dist/umd/index.js" />
<script>
  const container = Ditox.createContainer();
</script>
```

Using in Deno environment:

```ts
import {createContainer} from 'https://deno.land/x/ditox/mod.ts';

const container = createContainer();
```

## General description

DI pattern in general allows to declare and construct a code graph of an
application. It can be described by following phases:

1. Code declaration phase:

- Defining public API and types of business layer
- Creation of injection tokens
- Declaring DI modules

2. Binding phase:

- Creation of a container
- Binding values, factories and modules to the container

3. Runtime phase:

- Running the code
- Values are constructed by registered factories

Diagram:

<img alt="diagram" src="../../media/diagram.svg" width="800" />

## Usage Example

```js
import {createContainer, injectable, optional, token} from 'ditox';

// This is app code, some factory functions and classes:
function createStorage(config) {}

function createLogger(config) {}

class UserService {
  constructor(storage, logger) {}
}

// Define tokens for injections.
const STORAGE_TOKEN = token < UserService > 'Token description for debugging';
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
const userService = container.resolve(USER_SERVICE_TOKEN);

// Remove a value from the container.
container.remove(LOGGER_TOKEN);

// Clean up the container.
container.removeAll();
```

## Container Hierarchy

Ditox.js supports "parent-child" hierarchy. If the child container cannot to
resolve a token, it asks the parent container to resolve it:

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

Ditox.js supports managing the lifetime of values which are produced by
factories. There are the following types:

- `singleton` - **This is the default**. The value is created and cached by the
  most distant parent container which owns the factory function.
- `scoped` - The value is created and cached by the nearest container which owns
  the factory function.
- `transient` - The value is created every time it is resolved.

### `singleton`

**This is the default scope**. "Singleton" allows to cache a produced value by a
most distant parent container which registered the factory function:

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

"Scoped" lifetime allows to have sub-containers with own instances of some
services which can be disposed. For example, a context during HTTP request
handling, or other unit of work:

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

## Dependency Modules

Dependencies can be organized as modules in declarative way with
`ModuleDeclaration`. It is useful for providing pieces of functionality from
libraries to an app which depends on them.

```typescript
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

```typescript
const container = createContainer();

// bind a single module
bindModule(container, LOGGER_MODULE);

// or bind multiple depenendency modules
bindModules(container, [DATABASE_MODULE, CONFIG_MODULE, API_MODULE]);
```

Utility functions for module declarations:

- `declareModule()` – declare a module as `ModuleDeclaration` however `token`
  field can be optional for anonymous modules.
- `declareModuleBindings()` – declares an anonymous module with imports. This
  module binds the provided ones to a container.

Example for these functions:

```typescript
const LOGGER_MODULE = declareModule<LoggerModule>({
  factory: createLoggerModule,
  exports: {
    logger: LOGGER_TOKEN,
  },
});

const APP_MODULE = declareModuleBinding([LOGGER_MODULE, DATABASE_MODULE]);
```

---

This project is licensed under the
[MIT license](https://github.com/mnasyrov/ditox/blob/master/LICENSE).
