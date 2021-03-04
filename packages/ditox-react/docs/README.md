@ditox/react

# @ditox/react

## Table of contents

### Type aliases

- [DependencyContainerBinder](README.md#dependencycontainerbinder)
- [DependencyContainerParams](README.md#dependencycontainerparams)

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

Ƭ **DependencyContainerBinder**: (`container`: Container) => *unknown*

A callback for binding dependencies to a container

#### Type declaration:

▸ (`container`: Container): *unknown*

#### Parameters:

Name | Type |
:------ | :------ |
`container` | Container |

**Returns:** *unknown*

Defined in: [DependencyContainer.tsx:19](https://github.com/mnasyrov/ditox/blob/60bc7e7/packages/ditox-react/src/DependencyContainer.tsx#L19)

___

### DependencyContainerParams

Ƭ **DependencyContainerParams**: *object*

Specifies an existed container or options for a new container:

**`property`** root - If `true` then a new container does not depend on any parent containers

**`property`** binder - A callback which can bind dependencies to the new container

#### Type declaration:

Name | Type |
:------ | :------ |
`binder`? | [*DependencyContainerBinder*](README.md#dependencycontainerbinder) |
`children` | ReactNode |
`root`? | *boolean* |

Defined in: [DependencyContainer.tsx:26](https://github.com/mnasyrov/ditox/blob/60bc7e7/packages/ditox-react/src/DependencyContainer.tsx#L26)

## Component

Provides a new dependency container to React app

This component creates a new container and provides it down to React children.

If &#x60;binder&#x60; callback is specified, it will be called for a new container
to binds it with dependencies.

If a parent container is exist, it is connected to the current one by default.
For making a new root container specify &#x60;root&#x60; parameter as &#x60;true&#x60;,
and the container will not depend on any parent container. Functions

### DependencyContainer

▸ **DependencyContainer**(`params`: { `binder?`: [*DependencyContainerBinder*](README.md#dependencycontainerbinder) ; `children`: ReactNode ; `root?`: *boolean*  }): ReactElement

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

#### Parameters:

Name | Type | Description |
:------ | :------ | :------ |
`params` | *object* | - |
`params.binder?` | [*DependencyContainerBinder*](README.md#dependencycontainerbinder) | A callback which initializes the container.   |
`params.children` | ReactNode | - |
`params.root?` | *boolean* | Makes the container to not depend on any parent containers.    |

**Returns:** ReactElement

Defined in: [DependencyContainer.tsx:68](https://github.com/mnasyrov/ditox/blob/60bc7e7/packages/ditox-react/src/DependencyContainer.tsx#L68)

___

## Hook

Returns a dependency by token, or &#x60;undefined&#x60; in case the dependency is not provided. Functions

### useOptionalDependency

▸ **useOptionalDependency**<T\>(`token`: *Token*<T\>): T \| *undefined*

#### Type parameters:

Name |
:------ |
`T` |

#### Parameters:

Name | Type |
:------ | :------ |
`token` | *Token*<T\> |

**Returns:** T \| *undefined*

Defined in: [hooks.ts:52](https://github.com/mnasyrov/ditox/blob/60bc7e7/packages/ditox-react/src/hooks.ts#L52)

___

## Hook

Returns a dependency by token, or fails with an error. Functions

### useDependency

▸ **useDependency**<T\>(`token`: *Token*<T\>): T

#### Type parameters:

Name |
:------ |
`T` |

#### Parameters:

Name | Type |
:------ | :------ |
`token` | *Token*<T\> |

**Returns:** T

Defined in: [hooks.ts:41](https://github.com/mnasyrov/ditox/blob/60bc7e7/packages/ditox-react/src/hooks.ts#L41)

___

## Hook

Returns a dependency container, or &#x60;undefined&#x60; in case the container is not provided. Functions

### useDependencyContainer

▸ **useDependencyContainer**(`mode`: *strict*): Container

#### Parameters:

Name | Type |
:------ | :------ |
`mode` | *strict* |

**Returns:** Container

Defined in: [hooks.ts:10](https://github.com/mnasyrov/ditox/blob/60bc7e7/packages/ditox-react/src/hooks.ts#L10)

▸ **useDependencyContainer**(`mode?`: *optional*): Container \| *undefined*

#### Parameters:

Name | Type |
:------ | :------ |
`mode?` | *optional* |

**Returns:** Container \| *undefined*

Defined in: [hooks.ts:16](https://github.com/mnasyrov/ditox/blob/60bc7e7/packages/ditox-react/src/hooks.ts#L16)

___

## Hook

Returns a dependency container. Throws an error in case the container is not provided. Functions

### useDependencyContainer

▸ **useDependencyContainer**(`mode`: *strict*): Container

#### Parameters:

Name | Type |
:------ | :------ |
`mode` | *strict* |

**Returns:** Container

Defined in: [hooks.ts:10](https://github.com/mnasyrov/ditox/blob/60bc7e7/packages/ditox-react/src/hooks.ts#L10)

▸ **useDependencyContainer**(`mode?`: *optional*): Container \| *undefined*

#### Parameters:

Name | Type |
:------ | :------ |
`mode?` | *optional* |

**Returns:** Container \| *undefined*

Defined in: [hooks.ts:16](https://github.com/mnasyrov/ditox/blob/60bc7e7/packages/ditox-react/src/hooks.ts#L16)
