# ditox-react

<img alt="lemon" src="https://raw.githubusercontent.com/mnasyrov/ditox/master/lemon.svg" width="120" />

React.js tooling for [Ditox.js](https://github.com/mnasyrov/ditox) DI container.

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
- [Dependency modules](#dependency-modules)
- [API References](#api-references)

<!-- tocstop -->

## Features

- Simple and functional API
- Container hierarchy
- Scoped containers
- Multi-value tokens
- Typescript and Flow typings
- Supports Node.js, Deno and browsers

## Installation

Install with `npm`

```
npm install ditox ditox-react --save
```

Or `yarn`

```
yarn add ditox ditox-react
```

## Usage

`ditox-react` is a set of helpers for providing and using a dependency container in React apps:

- Components:
  - `DepencencyContainer` - provides a new or existed container to React components.
  - `DepencencyModule` - binds a dependency module to a new container.
  - `CustomDepencencyContainer` - provides an existed dependency container.
- Hooks:
  - `useDependencyContainer()` - returns a provided dependency container.
  - `useDependency()` - returns a resolved value by a specified token. It throws an error in case a container or value is not found.
  - `useOptionalDependency()` - returns a resolved value by a specified token, or returns `undefined` in case a container or value is not found.

Examples:

```jsx
import {token} from 'ditox';
import {
  DependencyContainer,
  DependencyModule,
  useDependency,
  useDependencyContainer,
  useOptionalDependency,
} from 'ditox-react';
import {LOGGER_MODULE} from './logger';

const FOO = token();
const BAR = token();

function appDependencyBinder(container) {
  container.bindValue(FOO, 'foo');
}

function App() {
  return (
    <DependencyContainer binder={appDependencyBinder}>
      <NestedComponent />
    </DependencyContainer>
  );
}

function NestedComponent() {
  // Get access to the container
  const container = useDependencyContainer();

  // Use a resolved value
  const foo = useDependency(FOO);

  // Use an optional value. It is not provided in this example.
  const bar = useOptionalDependency(BAR);

  useEffect(() => {
    console.log({foo, bar}); // {foo: 'foo', bar: undefined}
  }, [foo, bar]);

  return null;
}
```

## Dependency modules

Dependency modules can be provided to the app with `<DependencyModule />` component:

```tsx
function App() {
  return (
    <DependencyModule module={LOGGER_MODULE}>
      <NestedComponent />
    </DependencyModule>
  );
}
```

## API References

- [`ditox`](https://github.com/mnasyrov/ditox/tree/master/packages/ditox#readme)
- [`ditox-react`](./docs)

---

&copy; 2020-2021 [Mikhail Nasyrov](https://github.com/mnasyrov), [MIT license](./LICENSE)
