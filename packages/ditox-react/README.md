# ditox-react package

<img alt="lemon" src="https://raw.githubusercontent.com/mnasyrov/ditox/master/lemon.svg" width="120" />

**Dependency injection helpers for React.js**

Please see the documentation at [ditox.js.org](https://ditox.js.org)

[![npm](https://img.shields.io/npm/v/ditox-react)](https://www.npmjs.com/package/ditox-react)
[![stars](https://img.shields.io/github/stars/mnasyrov/ditox)](https://github.com/mnasyrov/ditox/stargazers)
[![types](https://img.shields.io/npm/types/ditox-react)](https://www.npmjs.com/package/ditox-react)
[![license](https://img.shields.io/github/license/mnasyrov/ditox)](https://github.com/mnasyrov/ditox/blob/master/LICENSE)
[![coverage](https://coveralls.io/repos/github/mnasyrov/ditox/badge)](https://coveralls.io/github/mnasyrov/ditox)

## Installation

You can use the following command to install this package:

```shell
npm install --save ditox-react
```

Packages can be used as [UMD](https://github.com/umdjs/umd) modules. Use
[jsdelivr.com](https://jsdelivr.com) CDN to load
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

## Overview

`ditox-react` is a set of helpers for providing and using a dependency container
in React apps:

- Components:
  - `DependencyContainer` — creates and provides a new container to React
    children. Optionally binds dependencies via a binder callback. Can start a
    new root container with `root` flag.
  - `DependencyModule` — binds a dependency module to a new container (supports
    `scope`: `singleton` (default) or `scoped`).
  - `CustomDependencyContainer` — provides an existing dependency container.
- Hooks:
  - `useDependencyContainer(mode?)` — returns a provided dependency container.
    With `mode = 'strict'` it throws if the container is not provided; by
    default it returns `undefined` when not provided.
  - `useDependency(token)` — resolves and returns a value by a specified token.
    Throws if a container or the value is not found.
  - `useOptionalDependency(token)` — returns a resolved value by a specified
    token, or `undefined` if not found or not provided.

## Usage Examples

```tsx
import {token} from 'ditox';
import {
  DependencyContainer,
  useDependency,
  useDependencyContainer,
  useOptionalDependency,
} from 'ditox-react';

const FOO_TOKEN = token<string>();
const BAR_TOKEN = token<string>();

function appDependencyBinder(container) {
  container.bindValue(FOO_TOKEN, 'foo');
}

function App() {
  return (
    <DependencyContainer root binder={appDependencyBinder}>
      <NestedComponent />
    </DependencyContainer>
  );
}

function NestedComponent() {
  // Get access to the container (optionally)
  const container = useDependencyContainer(); // or useDependencyContainer('strict') to enforce presence

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

### Providing an existing container

```tsx
import {createContainer, token} from 'ditox';
import {CustomDependencyContainer, useDependency} from 'ditox-react';

const GREETING_TOKEN = token<string>();

const container = createContainer();
container.bindValue(GREETING_TOKEN, 'Hello');

function App() {
  return (
    <CustomDependencyContainer container={container}>
      <Greeting />
    </CustomDependencyContainer>
  );
}

function Greeting() {
  const text = useDependency(GREETING_TOKEN);
  return <>{text}</>;
}
```

## Dependency Modules

Dependency modules can be provided to the app with the `<DependencyModule />`
component. You can also specify a binding scope (`singleton` by default or
`scoped`):

```tsx
function App() {
  return (
    <DependencyModule module={LOGGER_MODULE} scope="singleton">
      <NestedComponent />
    </DependencyModule>
  );
}
```

## API Reference

- Components

  - DependencyContainer(props)
    - props.children: ReactNode — React children to wrap
    - props.root?: boolean — if true, create a new root container that does not
      inherit from any parent container
    - props.binder?: (container: Container) => unknown — optional callback to
      set up bindings for the newly created container
    - Behavior: creates a new container linked to the parent container by
      default; removes all bindings on unmount
  - CustomDependencyContainer(props)
    - props.children: ReactNode — React children to wrap
    - props.container: Container — an existing container instance to provide
  - DependencyModule(props)
    - props.children: ReactNode — React children to wrap
    - props.module: ModuleDeclaration — module to bind to a new container
    - props.scope?: 'singleton' | 'scoped' — scope for the module bindings
      (default: 'singleton')

- Hooks
  - useDependencyContainer(mode?: 'optional' | 'strict')
    - Returns the container. In 'strict' mode throws if not provided; in
      optional mode returns undefined if not provided
  - useDependency<T>(token: Token<T>): T
    - Resolves and returns the value; throws if not bound or container is
      missing
  - useOptionalDependency<T>(token: Token<T>): T | undefined
    - Returns the value if bound, otherwise undefined

Notes:

- A parent container (if provided higher in the tree) is used as the parent for
  new containers created by DependencyContainer and DependencyModule, unless
  root is set to true.
- All bindings made inside a DependencyContainer are removed on unmount.

---

This project is licensed under the
[MIT license](https://github.com/mnasyrov/ditox/blob/master/LICENSE).
