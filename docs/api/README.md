**[ditox](README.md)**

> Globals

# ditox

## Index

### Classes

- [ResolverError](classes/resolvererror.md)

### Type aliases

- [Container](README.md#container)
- [FactoryOptions](README.md#factoryoptions)
- [FactoryScope](README.md#factoryscope)
- [Token](README.md#token)

### Functions

- [bindMultiValue](README.md#bindmultivalue)
- [createContainer](README.md#createcontainer)
- [getValues](README.md#getvalues)
- [injectable](README.md#injectable)
- [optional](README.md#optional)
- [resolveValues](README.md#resolvevalues)
- [token](README.md#token)

## Type aliases

### Container

Ƭ **Container**: { bindFactory: \<T>(token: [Token](README.md#token)\<T>, factory: (container: [Container](README.md#container)) => T, options?: [FactoryOptions](README.md#factoryoptions)\<T>) => void ; bindValue: \<T>(token: [Token](README.md#token)\<T>, value: T) => void ; get: \<T>(token: [Token](README.md#token)\<T>) => T \| undefined ; remove: \<T>(token: [Token](README.md#token)\<T>) => void ; removeAll: () => void ; resolve: \<T>(token: [Token](README.md#token)\<T>) => T }

_Defined in [src/ditox.ts:95](https://github.com/mnasyrov/ditox/blob/366486d/src/ditox.ts#L95)_

Dependency container.

#### Type declaration:

| Name          | Type                                                                                                                                                                     |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `bindFactory` | \<T>(token: [Token](README.md#token)\<T>, factory: (container: [Container](README.md#container)) => T, options?: [FactoryOptions](README.md#factoryoptions)\<T>) => void |
| `bindValue`   | \<T>(token: [Token](README.md#token)\<T>, value: T) => void                                                                                                              |
| `get`         | \<T>(token: [Token](README.md#token)\<T>) => T \| undefined                                                                                                              |
| `remove`      | \<T>(token: [Token](README.md#token)\<T>) => void                                                                                                                        |
| `removeAll`   | () => void                                                                                                                                                               |
| `resolve`     | \<T>(token: [Token](README.md#token)\<T>) => T                                                                                                                           |

---

### FactoryOptions

Ƭ **FactoryOptions**\<T>: { onRemoved?: undefined \| (value: T) => void ; scope?: \"scoped\" \| \"singleton\" } \| { scope: \"transient\" }

_Defined in [src/ditox.ts:83](https://github.com/mnasyrov/ditox/blob/366486d/src/ditox.ts#L83)_

Options for factory binding.

`scope` types:

- `scoped` - **This is the default**. The value is created and cached by the container which starts resolving.
- `singleton` - The value is created and cached by the container which registered the factory.
- `transient` - The value is created every time it is resolved.

`scoped` and `singleton` scopes can have `onRemoved` callback. It is called when a token is removed from the container.

#### Type parameters:

| Name |
| ---- |
| `T`  |

---

### FactoryScope

Ƭ **FactoryScope**: \"scoped\" \| \"singleton\" \| \"transient\"

_Defined in [src/ditox.ts:71](https://github.com/mnasyrov/ditox/blob/366486d/src/ditox.ts#L71)_

**`see`** https://github.com/mnasyrov/ditox#factory-lifetimes

---

### Token

Ƭ **Token**\<T>: RequiredToken\<T> \| OptionalToken\<T>

_Defined in [src/ditox.ts:25](https://github.com/mnasyrov/ditox/blob/366486d/src/ditox.ts#L25)_

Binding token.

#### Type parameters:

| Name |
| ---- |
| `T`  |

## Functions

### bindMultiValue

▸ **bindMultiValue**\<T>(`container`: [Container](README.md#container), `token`: [Token](README.md#token)\<Array\<T>>, `value`: T): void

_Defined in [src/utils.ts:31](https://github.com/mnasyrov/ditox/blob/366486d/src/utils.ts#L31)_

Rebinds the array by the token with added new value.

#### Type parameters:

| Name |
| ---- |
| `T`  |

#### Parameters:

| Name        | Type                                 | Description                                       |
| ----------- | ------------------------------------ | ------------------------------------------------- |
| `container` | [Container](README.md#container)     | Dependency container.                             |
| `token`     | [Token](README.md#token)\<Array\<T>> | Token for an array of values.                     |
| `value`     | T                                    | New value which is added to the end of the array. |

**Returns:** void

---

### createContainer

▸ **createContainer**(`parentContainer?`: [Container](README.md#container)): [Container](README.md#container)

_Defined in [src/ditox.ts:196](https://github.com/mnasyrov/ditox/blob/366486d/src/ditox.ts#L196)_

Creates a new dependency container.

Container can have an optional parent to chain token resolution. The parent is used in case the current container does not have a registered token.

#### Parameters:

| Name               | Type                             | Description                |
| ------------------ | -------------------------------- | -------------------------- |
| `parentContainer?` | [Container](README.md#container) | Optional parent container. |

**Returns:** [Container](README.md#container)

---

### getValues

▸ **getValues**\<Tokens, Values>(`container`: [Container](README.md#container), ...`tokens`: Tokens): Values

_Defined in [src/utils.ts:45](https://github.com/mnasyrov/ditox/blob/366486d/src/utils.ts#L45)_

Returns an array of resolved values by the specified token.
If a token is not found, then `undefined` value is used.

#### Type parameters:

| Name     | Type                                 |
| -------- | ------------------------------------ |
| `Tokens` | [Token](README.md#token)\<unknown>[] |
| `Values` | {}                                   |

#### Parameters:

| Name        | Type                             |
| ----------- | -------------------------------- |
| `container` | [Container](README.md#container) |
| `...tokens` | Tokens                           |

**Returns:** Values

---

### injectable

▸ **injectable**\<Tokens, Values, Result>(`factory`: (...params: Values) => Result, ...`tokens`: Tokens): function

_Defined in [src/utils.ts:9](https://github.com/mnasyrov/ditox/blob/366486d/src/utils.ts#L9)_

Decorates a factory by passing resolved tokens as factory arguments.

#### Type parameters:

| Name     | Type                                 |
| -------- | ------------------------------------ |
| `Tokens` | [Token](README.md#token)\<unknown>[] |
| `Values` | {}                                   |
| `Result` | -                                    |

#### Parameters:

| Name        | Type                          | Description                                   |
| ----------- | ----------------------------- | --------------------------------------------- |
| `factory`   | (...params: Values) => Result | A factory.                                    |
| `...tokens` | Tokens                        | Tokens which correspond to factory arguments. |

**Returns:** function

Decorated factory which takes a dependency container as a single argument.

---

### optional

▸ **optional**\<T>(`token`: [Token](README.md#token)\<T>, `optionalValue`: T): OptionalToken\<T>

_Defined in [src/ditox.ts:41](https://github.com/mnasyrov/ditox/blob/366486d/src/ditox.ts#L41)_

Decorate a token with an optional value.
This value is be used as default value in case a container does not have registered token.

#### Type parameters:

| Name |
| ---- |
| `T`  |

#### Parameters:

| Name            | Type                         | Description                     |
| --------------- | ---------------------------- | ------------------------------- |
| `token`         | [Token](README.md#token)\<T> | Existed token.                  |
| `optionalValue` | T                            | Default value for the resolver. |

**Returns:** OptionalToken\<T>

▸ **optional**\<T>(`token`: [Token](README.md#token)\<T>): OptionalToken\<T \| void>

_Defined in [src/ditox.ts:45](https://github.com/mnasyrov/ditox/blob/366486d/src/ditox.ts#L45)_

#### Type parameters:

| Name |
| ---- |
| `T`  |

#### Parameters:

| Name    | Type                         |
| ------- | ---------------------------- |
| `token` | [Token](README.md#token)\<T> |

**Returns:** OptionalToken\<T \| void>

---

### resolveValues

▸ **resolveValues**\<Tokens, Values>(`container`: [Container](README.md#container), ...`tokens`: Tokens): Values

_Defined in [src/utils.ts:58](https://github.com/mnasyrov/ditox/blob/366486d/src/utils.ts#L58)_

Returns an array of resolved values by the specified token.
If a token is not found, then `ResolverError` is thrown.

#### Type parameters:

| Name     | Type                                 |
| -------- | ------------------------------------ |
| `Tokens` | [Token](README.md#token)\<unknown>[] |
| `Values` | {}                                   |

#### Parameters:

| Name        | Type                             |
| ----------- | -------------------------------- |
| `container` | [Container](README.md#container) |
| `...tokens` | Tokens                           |

**Returns:** Values

---

### token

▸ **token**\<T>(`description?`: undefined \| string): [Token](README.md#token)\<T>

_Defined in [src/ditox.ts:31](https://github.com/mnasyrov/ditox/blob/366486d/src/ditox.ts#L31)_

Creates a new binding token.

#### Type parameters:

| Name |
| ---- |
| `T`  |

#### Parameters:

| Name           | Type                | Description                                  |
| -------------- | ------------------- | -------------------------------------------- |
| `description?` | undefined \| string | Token description for better error messages. |

**Returns:** [Token](README.md#token)\<T>
