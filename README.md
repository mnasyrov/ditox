# Ditox.js

<img alt="lemon" src="media/lemon.svg" width="120" />

**Dependency injection for web applications**

[![npm](https://img.shields.io/npm/v/ditox)](https://www.npmjs.com/package/ditox)
[![stars](https://img.shields.io/github/stars/mnasyrov/ditox)](https://github.com/mnasyrov/ditox/stargazers)
[![types](https://img.shields.io/npm/types/ditox)](https://www.npmjs.com/package/ditox)
[![license](https://img.shields.io/github/license/mnasyrov/ditox)](https://github.com/mnasyrov/ditox/blob/master/LICENSE)
[![coverage](https://coveralls.io/repos/github/mnasyrov/ditox/badge)](https://coveralls.io/github/mnasyrov/ditox)

## Overview

Ditox.js is a lightweight dependency injection container for TypeScript. It
provides a simple functional API to bind values and factories to container by
tokens and resolve values later. The library supports different scopes for
factory bindings, including "singleton", "scoped", and "transient". Bindings can
be organized as a dependency module declaratively.

Ditox.js works with containers, tokens, values, and value factories. There are no
class decorators, field injectors, and other magic. Explicit binding and
resolving are used.

## Features

- Functional API
- Container hierarchy
- Scopes for factory bindings
- Dependency modules
- Multi-value tokens
- TypeScript types

## API References

The library is available as two packages:

- **ditox** - DI container and core tools
- **ditox-react** - Tools for React.js applications

Please see the documentation at [ditox.js.org](https://ditox.js.org)

## Getting Started

### Installation

You can use the following command to install packages:

```shell
npm install --save ditox
npm install --save ditox-react
```

Packages can be used as [UMD](https://github.com/umdjs/umd) modules. Use
[jsdelivr.com](https://jsdelivr.com) CDN site to load
[ditox](https://www.jsdelivr.com/package/npm/ditox) and
[ditox-react](https://www.jsdelivr.com/package/npm/ditox-react):

```html

<script src="//cdn.jsdelivr.net/npm/ditox/dist/umd/index.js"></script>
<script src="//cdn.jsdelivr.net/npm/ditox-react/dist/umd/index.js"></script>
<script>
  const container = Ditox.createContainer();
  // DitoxReact.useDependency(SOME_TOKEN);
</script>
```

### Basic concepts

- **Token** specifies a future injection of an "internal" implementation with a
  concrete "public" type.

  ```ts
  type Logger = (message: string) => void;

  const LOGGER_TOKEN = token<Logger>();
  ```

- **Container** keeps bindings of **tokens** to concrete values and
  implementations

  ```ts
  const container = createContainer();
  container.bindValue(LOGGER_TOKEN, (message) => console.log(message));
  ```

- **Code graph** is constructed at **runtime** by resolving values of tokens.

  ```ts
  const logger = container.resolve(LOGGER_TOKEN);
  logger('Hello World!');
  ```

## Usage Examples

### Binding a value

Create an injection token for a logger and DI container. Bind a logger
implementation and resolve its value later in the application:

```typescript
import { createContainer, token } from 'ditox';

type LoggerService = {
  log: (...messages: string[]) => void;
};

// Injection token
const LOGGER_TOKEN = token<LoggerService>();

// Default implementation
const CONSOLE_LOGGER: LoggerService = {
  log: (...messages) => console.log(...messages),
};

// Create a DI container
const container = createContainer();

container.bindValue(LOGGER_TOKEN, CONSOLE_LOGGER);

// Later, somewhere in the app
const logger = container.resolve(LOGGER_TOKEN);
logger.log('Hello World!');
```

### Binding a factory

Bind a factory of a remote logger which depends on an HTTP client:

```typescript
import { injectable } from 'ditox';

export type ServerClient = {
  log: (...messages: string[]) => void;
  sendMetric: (key: string, value: string) => void;
};

export const SERVER_CLIENT_TOKEN = token<ServerClient>();

function createLoggerClient(client: ServerClient): Logger {
  return {
    log: (...messages) => client.log(...messages),
  };
}

container.bindFactory(
  LOGGER_TOKEN,
  injectable(createLoggerClient, SERVER_CLIENT_TOKEN),
);

// Later, somewhere in the app
const logger = container.resolve(LOGGER_TOKEN);
logger.log('Hello World!');
```

### DI module

Organize related bindings and functionality as a DI module:

```typescript
import { bindModule, declareModule } from 'ditox';

type SendMetricFn = (key: string, value: string) => void;

const SEND_METRIC_TOKEN = token<SendMetricFn>();

// Declare a DI module
const TELEMETRY_MODULE = declareModule<LoggerModule>({
  factory: injectable((client) => {
    const logger = createLoggerClient(client);

    const sendMetric = (key: string, value: string) => {
      logger.log('metric', key, value);
      client.sendMetric(key, value);
    };

    return { logger, sendMetric };
  }, SERVER_CLIENT_TOKEN),
  exports: {
    logger: LOGGER_TOKEN,
    sendMetric: SEND_METRIC_TOKEN,
  },
});

// Bind the module
bindModule(container, TELEMETRY_MODULE);

// Later, somewhere in the app
const logger = container.resolve(LOGGER_TOKEN);
logger.log('Hello World!');

const sendMetric = container.resolve(SEND_METRIC_TOKEN);
sendMetric('foo', 'bar');
```

### Using in React app

Wrap a component tree by a DI container and bind modules:

```tsx
// index.tsx

import ReactDOM from 'react-dom';

import { Greeting } from './Greeting';
import { TELEMETRY_MODULE } from './telemetry';

const APP_MODULE = declareModule({
  imports: [TELEMETRY_MODULE],
});

const App: FC = () => {
  return (
    <DependencyContainer root>
      <DependencyModule module={APP_MODULE}>
        <Greeting />
      </DependencyModule>
    </DependencyContainer>
  );
};

ReactDOM.render(<App />, document.getElementById('root'));
```

Injecting a dependency by a React component:

```tsx
// Greeting.tsx

import { useDependency } from 'ditox-react';

export const Greeting: FC = () => {
  const logger = useDependency(LOGGER_TOKEN);

  useEffect(() => {
    logger.log('Hello World!');
  }, [logger]);

  return <>Hello</>;
};
```

## Contact & Support

- Follow 👨🏻‍💻 **@mnasyrov** on [GitHub](https://github.com/mnasyrov) for
  announcements
- Create a 💬 [GitHub issue](https://github.com/mnasyrov/ditox/issues) for bug
  reports, feature requests, or questions
- Add a ⭐️ star on [GitHub](https://github.com/mnasyrov/ditox) and 🐦
  [tweet](https://twitter.com/intent/tweet?url=https%3A%2F%2Fgithub.com%2Fmnasyrov%2Fditox&hashtags=developers,frontend,javascript)
  to promote the project

## License

This project is licensed under the
[MIT license](https://github.com/mnasyrov/ditox/blob/master/LICENSE).

<!---
III. Ditox Package
- Explanation of the core library
- List of available methods and functions
- Examples of advanced usage

IV. Ditox-React Package
- Explanation of the React library
- List of available components and functions
- Examples of usage in a React project

V. Best Practices
- Recommendations for using Ditox.js effectively
- Tips for optimizing performance

VI. Troubleshooting
- Common issues and solutions
- How to report bugs or request new features

VII. Contributing
- Guidelines for contributing to the project
- Code of conduct for contributors

IX. Credits
- Acknowledgements for contributors and external resources used in the project.
--->
