@ditox/react

# @ditox/react

## Table of contents

### Type aliases

- [DependencyContainerBinder](README.md#dependencycontainerbinder)
- [DependencyContainerParams](README.md#dependencycontainerparams)

### Component

Binds the module to a new dependency container.

If a parent container is exist, it is connected to the current one by default. Functions

- [DependencyModule](README.md#dependencymodule)

### Component

Provides a new dependency container to React app

This component creates a new container and provides it down to React children.

If &#x60;binder&#x60; callback is specified, it will be called for a new container
to binds it with dependencies.

If a parent container is exist, it is connected to the current one by default.
For making a new root container specify &#x60;root&#x60; parameter as &#x60;true&#x60;,
and the container will not depend on any parent container. Functions

- [DependencyContainer](README.md#dependencycontainer)

### Hook

Returns a dependency by token, or &#x60;undefined&#x60; in case the dependency is not provided. Functions

- [useOptionalDependency](README.md#useoptionaldependency)

### Hook

Returns a dependency by token, or fails with an error. Functions

- [useDependency](README.md#usedependency)

### Hook

Returns a dependency container, or &#x60;undefined&#x60; in case the container is not provided. Functions

- [useDependencyContainer](README.md#usedependencycontainer)

### Hook

Returns a dependency container. Throws an error in case the container is not provided. Functions

- [useDependencyContainer](README.md#usedependencycontainer)

## Type aliases

### DependencyContainerBinder

Ƭ **DependencyContainerBinder**: (`container`: `Container`) => `unknown`

#### Type declaration

▸ (`container`): `unknown`

A callback for binding dependencies to a container

##### Parameters

| Name | Type |
| :------ | :------ |
| `container` | `Container` |

##### Returns

`unknown`

#### Defined in

[DependencyContainer.tsx:19](https://github.com/mnasyrov/ditox/blob/98f445f/packages/ditox-react/src/DependencyContainer.tsx#L19)

___

### DependencyContainerParams

Ƭ **DependencyContainerParams**: `Object`

Specifies an existed container or options for a new container:

**`property`** binder - A callback which setup bindings to the container.

**`property`** root - If `true` then a new container does not depend on any parent containers

#### Type declaration

| Name | Type |
| :------ | :------ |
| `binder?` | [DependencyContainerBinder](README.md#dependencycontainerbinder) |
| `children` | `ReactNode` |
| `root?` | `boolean` |

#### Defined in

[DependencyContainer.tsx:26](https://github.com/mnasyrov/ditox/blob/98f445f/packages/ditox-react/src/DependencyContainer.tsx#L26)

## Component

Binds the module to a new dependency container.

If a parent container is exist, it is connected to the current one by default. Functions

### DependencyModule

▸ **DependencyModule**(`params`): `ReactElement`

**`example`**

```tsx
const LOGGER_MODULE: ModuleDeclaration<LoggerModule> = {

function App() {
  return (
    <DependencyModule module={LOGGER_MODULE}>
      <NestedComponent />
    </DependencyModule>
  );
}
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `params` | `Object` | - |
| `params.children` | `ReactNode` | - |
| `params.module` | `ModuleDeclaration`<Module<Record<string, unknown\>\>\> | Module declaration for binding |
| `params.scope?` | ``"scoped"`` \| ``"singleton"`` | Optional scope for binding: `singleton` (default) or `scoped`. |

#### Returns

`ReactElement`

#### Defined in

[DependencyModule.tsx:33](https://github.com/mnasyrov/ditox/blob/98f445f/packages/ditox-react/src/DependencyModule.tsx#L33)

___

## Component

Provides a new dependency container to React app

This component creates a new container and provides it down to React children.

If &#x60;binder&#x60; callback is specified, it will be called for a new container
to binds it with dependencies.

If a parent container is exist, it is connected to the current one by default.
For making a new root container specify &#x60;root&#x60; parameter as &#x60;true&#x60;,
and the container will not depend on any parent container. Functions

### DependencyContainer

▸ **DependencyContainer**(`params`): `ReactElement`

**`example`**

```tsx
const TOKEN = token();

function appDependencyBinder(container: Container) {
  container.bindValue(TOKEN, 'value');
}

function App() {
  return (
    <DependencyContainer root binder={appDependencyBinder}>
      <NestedComponent />
    </DependencyContainer>
  );
}
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `params` | [DependencyContainerParams](README.md#dependencycontainerparams) |

#### Returns

`ReactElement`

#### Defined in

[DependencyContainer.tsx:68](https://github.com/mnasyrov/ditox/blob/98f445f/packages/ditox-react/src/DependencyContainer.tsx#L68)

___

## Hook

Returns a dependency by token, or &#x60;undefined&#x60; in case the dependency is not provided. Functions

### useOptionalDependency

▸ **useOptionalDependency**<T\>(`token`): `T` \| `undefined`

#### Type parameters

| Name |
| :------ |
| `T` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `token` | `Token`<T\> |

#### Returns

`T` \| `undefined`

#### Defined in

[hooks.ts:52](https://github.com/mnasyrov/ditox/blob/98f445f/packages/ditox-react/src/hooks.ts#L52)

___

## Hook

Returns a dependency by token, or fails with an error. Functions

### useDependency

▸ **useDependency**<T\>(`token`): `T`

#### Type parameters

| Name |
| :------ |
| `T` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `token` | `Token`<T\> |

#### Returns

`T`

#### Defined in

[hooks.ts:41](https://github.com/mnasyrov/ditox/blob/98f445f/packages/ditox-react/src/hooks.ts#L41)

___

## Hook

Returns a dependency container, or &#x60;undefined&#x60; in case the container is not provided. Functions

### useDependencyContainer

▸ **useDependencyContainer**(`mode`): `Container`

#### Parameters

| Name | Type |
| :------ | :------ |
| `mode` | ``"strict"`` |

#### Returns

`Container`

#### Defined in

[hooks.ts:10](https://github.com/mnasyrov/ditox/blob/98f445f/packages/ditox-react/src/hooks.ts#L10)

▸ **useDependencyContainer**(`mode?`): `Container` \| `undefined`

#### Parameters

| Name | Type |
| :------ | :------ |
| `mode?` | ``"optional"`` |

#### Returns

`Container` \| `undefined`

#### Defined in

[hooks.ts:16](https://github.com/mnasyrov/ditox/blob/98f445f/packages/ditox-react/src/hooks.ts#L16)

___

## Hook

Returns a dependency container. Throws an error in case the container is not provided. Functions

### useDependencyContainer

▸ **useDependencyContainer**(`mode`): `Container`

#### Parameters

| Name | Type |
| :------ | :------ |
| `mode` | ``"strict"`` |

#### Returns

`Container`

#### Defined in

[hooks.ts:10](https://github.com/mnasyrov/ditox/blob/98f445f/packages/ditox-react/src/hooks.ts#L10)

▸ **useDependencyContainer**(`mode?`): `Container` \| `undefined`

#### Parameters

| Name | Type |
| :------ | :------ |
| `mode?` | ``"optional"`` |

#### Returns

`Container` \| `undefined`

#### Defined in

[hooks.ts:16](https://github.com/mnasyrov/ditox/blob/98f445f/packages/ditox-react/src/hooks.ts#L16)
