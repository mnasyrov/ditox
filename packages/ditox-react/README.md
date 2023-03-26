# ditox-react package

<img alt="lemon" src="https://raw.githubusercontent.com/mnasyrov/ditox/master/lemon.svg" width="120" />

**Dependency injection container for React.js**

Please see the documentation at [ditox.js.org](https://ditox.js.org)

[![npm](https://img.shields.io/npm/v/ditox)](https://www.npmjs.com/package/ditox)
[![stars](https://img.shields.io/github/stars/mnasyrov/ditox)](https://github.com/mnasyrov/ditox/stargazers)
[![types](https://img.shields.io/npm/types/ditox)](https://www.npmjs.com/package/ditox)
[![licence](https://img.shields.io/github/license/mnasyrov/ditox)](https://github.com/mnasyrov/ditox/blob/master/LICENSE)
[![coverage](https://coveralls.io/repos/github/mnasyrov/ditox/badge)](https://coveralls.io/github/mnasyrov/ditox)

## Installation

You can use the following command to install this package:

```shell
npm install --save ditox-react
```

The packages can be used as [UMD](https://github.com/umdjs/umd) modules. Use
[jsdelivr.com](https://jsdelivr.com) CDN site to load
[ditox](https://www.jsdelivr.com/package/npm/ditox) and
[ditox-react](https://www.jsdelivr.com/package/npm/ditox-react):

```html
<script src="//cdn.jsdelivr.net/npm/ditox/dist/umd/index.js" />
<script src="//cdn.jsdelivr.net/npm/ditox-react@2.3.0/dist/umd/index.js" />
<script>
  const container = Ditox.createContainer();
  // DitoxReact.useDependency(SOME_TOKEN);
</script>
```

## Overview

`ditox-react` is a set of helpers for providing and using a dependency container
in React apps:

- Components:
  - `DepencencyContainer` - provides a new or existed container to React
    components.
  - `DepencencyModule` - binds a dependency module to a new container.
  - `CustomDepencencyContainer` - provides an existed dependency container.
- Hooks:
  - `useDependencyContainer()` - returns a provided dependency container.
  - `useDependency()` - returns a resolved value by a specified token. It throws
    an error in case a container or value is not found.
  - `useOptionalDependency()` - returns a resolved value by a specified token,
    or returns `undefined` in case a container or value is not found.

## Usage Examples

```jsx
import {token} from 'ditox';
import {
  DependencyContainer,
  useDependency,
  useDependencyContainer,
  useOptionalDependency,
} from 'ditox-react';

const FOO_TOKEN = token();
const BAR_TOKEN = token();

function appDependencyBinder(container) {
  container.bindValue(FOO_TOKEN, 'foo');
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
  const foo = useDependency(FOO_TOKEN);

  // Use an optional value. It is not provided in this example.
  const bar = useOptionalDependency(BAR_TOKEN);

  useEffect(() => {
    console.log({foo, bar}); // {foo: 'foo', bar: undefined}
  }, [foo, bar]);

  return null;
}
```

## Dependency Modules

Dependency modules can be provided to the app with `<DependencyModule />`
component:

```tsx
function App() {
  return (
    <DependencyModule module={LOGGER_MODULE}>
      <NestedComponent />
    </DependencyModule>
  );
}
```

---

This project is licensed under the
[MIT license](https://github.com/mnasyrov/ditox/blob/master/LICENSE).
