ditox

# ditox

## Table of contents

### Classes

- [ResolverError](classes/ResolverError.md)

### Type aliases

- [BindModuleOptions](README.md#bindmoduleoptions)
- [Container](README.md#container)
- [FactoryOptions](README.md#factoryoptions)
- [FactoryScope](README.md#factoryscope)
- [Module](README.md#module)
- [ModuleBindingEntry](README.md#modulebindingentry)
- [ModuleDeclaration](README.md#moduledeclaration)
- [Token](README.md#token)

### Functions

- [bindModule](README.md#bindmodule)
- [bindModules](README.md#bindmodules)
- [bindMultiValue](README.md#bindmultivalue)
- [createContainer](README.md#createcontainer)
- [declareModule](README.md#declaremodule)
- [declareModuleBindings](README.md#declaremodulebindings)
- [getProps](README.md#getprops)
- [getValues](README.md#getvalues)
- [injectable](README.md#injectable)
- [injectableClass](README.md#injectableclass)
- [injectableProps](README.md#injectableprops)
- [isToken](README.md#istoken)
- [optional](README.md#optional)
- [resolveProps](README.md#resolveprops)
- [resolveValue](README.md#resolvevalue)
- [resolveValues](README.md#resolvevalues)
- [token](README.md#token)
- [tryResolveValue](README.md#tryresolvevalue)
- [tryResolveValues](README.md#tryresolvevalues)

## Type aliases

### BindModuleOptions

Ƭ **BindModuleOptions**: `Object`

Options for module binding.

`scope` types:
  - `singleton` - **This is the default**. The module is created and cached by the container which registered the factory.
  - `scoped` - The module is created and cached by the container which starts resolving.

#### Type declaration

| Name | Type |
| :------ | :------ |
| `scope?` | ``"scoped"`` \| ``"singleton"`` |

#### Defined in

[packages/ditox/src/modules.ts:83](https://github.com/mnasyrov/ditox/blob/aea7a8f/packages/ditox/src/modules.ts#L83)

___

### Container

Ƭ **Container**: `Object`

Dependency container.

#### Type declaration

| Name | Type |
| :------ | :------ |
| `bindFactory` | <T\>(`token`: [`Token`](README.md#token)<`T`\>, `factory`: (`container`: [`Container`](README.md#container)) => `T`, `options?`: [`FactoryOptions`](README.md#factoryoptions)<`T`\>) => `void` |
| `bindValue` | <T\>(`token`: [`Token`](README.md#token)<`T`\>, `value`: `T`) => `void` |
| `get` | <T\>(`token`: [`Token`](README.md#token)<`T`\>) => `undefined` \| `T` |
| `hasToken` | (`token`: [`Token`](README.md#token)<`unknown`\>) => `boolean` |
| `remove` | <T\>(`token`: [`Token`](README.md#token)<`T`\>) => `void` |
| `removeAll` | () => `void` |
| `resolve` | <T\>(`token`: [`Token`](README.md#token)<`T`\>) => `T` |

#### Defined in

[packages/ditox/src/ditox.ts:95](https://github.com/mnasyrov/ditox/blob/aea7a8f/packages/ditox/src/ditox.ts#L95)

___

### FactoryOptions

Ƭ **FactoryOptions**<`T`\>: { `scope?`: ``"scoped"`` \| ``"singleton"`` ; `onRemoved?`: (`value`: `T`) => `void`  } \| { `scope`: ``"transient"``  }

Options for factory binding.

`scope` types:
  - `singleton` - **This is the default**. The value is created and cached by the container which registered the factory.
  - `scoped` - The value is created and cached by the container which starts resolving.
  - `transient` - The value is created every time it is resolved.

`scoped` and `singleton` scopes can have `onRemoved` callback. It is called when a token is removed from the container.

#### Type parameters

| Name |
| :------ |
| `T` |

#### Defined in

[packages/ditox/src/ditox.ts:83](https://github.com/mnasyrov/ditox/blob/aea7a8f/packages/ditox/src/ditox.ts#L83)

___

### FactoryScope

Ƭ **FactoryScope**: ``"scoped"`` \| ``"singleton"`` \| ``"transient"``

**`see`** https://github.com/mnasyrov/ditox#factory-lifetimes

#### Defined in

[packages/ditox/src/ditox.ts:71](https://github.com/mnasyrov/ditox/blob/aea7a8f/packages/ditox/src/ditox.ts#L71)

___

### Module

Ƭ **Module**<`ModuleProps`\>: `ModuleController` & `ModuleProps`

Dependency module

**`example`**
```ts
type LoggerModule = Module<{
  logger: Logger;
}>;
```

#### Type parameters

| Name | Type |
| :------ | :------ |
| `ModuleProps` | extends `AnyObject` = `EmptyObject` |

#### Defined in

[packages/ditox/src/modules.ts:22](https://github.com/mnasyrov/ditox/blob/aea7a8f/packages/ditox/src/modules.ts#L22)

___

### ModuleBindingEntry

Ƭ **ModuleBindingEntry**: [`ModuleDeclaration`](README.md#moduledeclaration)<`AnyObject`\> \| { `module`: [`ModuleDeclaration`](README.md#moduledeclaration)<`AnyObject`\> ; `options`: [`BindModuleOptions`](README.md#bindmoduleoptions)  }

#### Defined in

[packages/ditox/src/modules.ts:87](https://github.com/mnasyrov/ditox/blob/aea7a8f/packages/ditox/src/modules.ts#L87)

___

### ModuleDeclaration

Ƭ **ModuleDeclaration**<`T`\>: `Object`

Description how to bind the module in declarative way.

**`example`**
```ts
const LOGGER_MODULE: ModuleDeclaration<LoggerModule> = {
  token: LOGGER_MODULE_TOKEN,
  factory: (container) => {
    const transport = container.resolve(TRANSPORT_TOKEN).open();
    return {
      logger: { log: (message) => transport.write(message) },
      destroy: () => transport.close(),
    }
  },
  exports: {
    logger: LOGGER_TOKEN,
  },
};
```

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends [`Module`](README.md#module)<`AnyObject`\> |

#### Type declaration

| Name | Type | Description |
| :------ | :------ | :------ |
| `exportedProps?` | [`ModuleDeclaration`](README.md#moduledeclaration)<`T`\>[``"exports"``] | Dictionary of module properties which are bound to tokens.  **`deprecated`** Use `exports` property. |
| `exports?` | { [K in keyof GetModuleProps<T\>]?: Token<GetModuleProps<T\>[K]\> } | Dictionary of module properties which are bound to tokens. |
| `imports?` | `ReadonlyArray`<[`ModuleBindingEntry`](README.md#modulebindingentry)\> | Modules for binding |
| `token` | [`Token`](README.md#token)<`T`\> | Token for the module |
| `afterBinding?` | (`container`: [`Container`](README.md#container)) => `void` | Callback could be used to export complex dependencies from the module. It is called after binding the module. |
| `beforeBinding?` | (`container`: [`Container`](README.md#container)) => `void` | Callback could be used to prepare an environment. It is called before binding the module. |
| `factory` | (`container`: [`Container`](README.md#container)) => `T` | Factory of the module |

#### Defined in

[packages/ditox/src/modules.ts:47](https://github.com/mnasyrov/ditox/blob/aea7a8f/packages/ditox/src/modules.ts#L47)

___

### Token

Ƭ **Token**<`T`\>: `RequiredToken`<`T`\> \| `OptionalToken`<`T`\>

Binding token.

#### Type parameters

| Name |
| :------ |
| `T` |

#### Defined in

[packages/ditox/src/ditox.ts:25](https://github.com/mnasyrov/ditox/blob/aea7a8f/packages/ditox/src/ditox.ts#L25)

## Functions

### bindModule

▸ **bindModule**<`T`\>(`container`, `moduleDeclaration`, `options?`): `void`

Binds the dependency module to the container

**`example`**
```ts
bindModule(container, LOGGER_MODULE);
```

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends [`Module`](README.md#module)<`AnyObject`\> |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `container` | [`Container`](README.md#container) | Dependency container. |
| `moduleDeclaration` | [`ModuleDeclaration`](README.md#moduledeclaration)<`T`\> | Declaration of the dependency module. |
| `options?` | [`BindModuleOptions`](README.md#bindmoduleoptions) | Options for module binding. |

#### Returns

`void`

#### Defined in

[packages/ditox/src/modules.ts:105](https://github.com/mnasyrov/ditox/blob/aea7a8f/packages/ditox/src/modules.ts#L105)

___

### bindModules

▸ **bindModules**(`container`, `modules`): `void`

Binds dependency modules to the container

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `container` | [`Container`](README.md#container) | Dependency container for binding |
| `modules` | readonly [`ModuleBindingEntry`](README.md#modulebindingentry)[] | Array of module binding entries: module declaration or `{module: ModuleDeclaration, options: BindModuleOptions}` objects. |

#### Returns

`void`

#### Defined in

[packages/ditox/src/modules.ts:166](https://github.com/mnasyrov/ditox/blob/aea7a8f/packages/ditox/src/modules.ts#L166)

___

### bindMultiValue

▸ **bindMultiValue**<`T`\>(`container`, `token`, `value`): `void`

Rebinds the array by the token with added new value.

#### Type parameters

| Name |
| :------ |
| `T` |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `container` | [`Container`](README.md#container) | Dependency container. |
| `token` | [`Token`](README.md#token)<readonly `T`[]\> | Token for an array of values. |
| `value` | `T` | New value which is added to the end of the array. |

#### Returns

`void`

#### Defined in

[packages/ditox/src/utils.ts:27](https://github.com/mnasyrov/ditox/blob/aea7a8f/packages/ditox/src/utils.ts#L27)

___

### createContainer

▸ **createContainer**(`parentContainer?`): [`Container`](README.md#container)

Creates a new dependency container.

Container can have an optional parent to chain token resolution. The parent is used in case the current container does not have a registered token.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `parentContainer?` | [`Container`](README.md#container) | Optional parent container. |

#### Returns

[`Container`](README.md#container)

#### Defined in

[packages/ditox/src/ditox.ts:204](https://github.com/mnasyrov/ditox/blob/aea7a8f/packages/ditox/src/ditox.ts#L204)

___

### declareModule

▸ **declareModule**<`T`\>(`declaration`): [`ModuleDeclaration`](README.md#moduledeclaration)<`T`\>

Declares a module binding

**`example`**
```ts
const LOGGER_MODULE = declareModule<LoggerModule>({
  factory: (container) => {
    const transport = container.resolve(TRANSPORT_TOKEN).open();
    return {
      logger: { log: (message) => transport.write(message) },
      destroy: () => transport.close(),
    }
  },
  exports: {
    logger: LOGGER_TOKEN,
  },
});
```

#### Type parameters

| Name |
| :------ |
| `T` |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `declaration` | `Omit`<[`ModuleDeclaration`](README.md#moduledeclaration)<`T`\>, ``"token"``\> & `Partial`<`Pick`<[`ModuleDeclaration`](README.md#moduledeclaration)<`T`\>, ``"token"``\>\> | a module declaration |

#### Returns

[`ModuleDeclaration`](README.md#moduledeclaration)<`T`\>

#### Defined in

[packages/ditox/src/modules.ts:201](https://github.com/mnasyrov/ditox/blob/aea7a8f/packages/ditox/src/modules.ts#L201)

___

### declareModuleBindings

▸ **declareModuleBindings**(`modules`): [`ModuleDeclaration`](README.md#moduledeclaration)<[`Module`](README.md#module)\>

Declares bindings of several modules

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `modules` | readonly [`ModuleBindingEntry`](README.md#modulebindingentry)[] | module declaration entries |

#### Returns

[`ModuleDeclaration`](README.md#moduledeclaration)<[`Module`](README.md#module)\>

#### Defined in

[packages/ditox/src/modules.ts:213](https://github.com/mnasyrov/ditox/blob/aea7a8f/packages/ditox/src/modules.ts#L213)

___

### getProps

▸ **getProps**<`Props`\>(`container`, `tokens`): `Partial`<`Props`\>

Returns an object with resolved properties which are specified by token properties.
If a token is not found, then `undefined` value is used.

**`deprecated`** Use `tryResolveValue()` function.

**`example`**
```ts
const props = getProps(container, {a: tokenA, b: tokenB});
console.log(props); // {a: 1, b: 2}
```

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Props` | extends `ValuesProps` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `container` | [`Container`](README.md#container) |
| `tokens` | `TokenProps`<`Props`\> |

#### Returns

`Partial`<`Props`\>

#### Defined in

[packages/ditox/src/utils-deprecated.ts:41](https://github.com/mnasyrov/ditox/blob/aea7a8f/packages/ditox/src/utils-deprecated.ts#L41)

___

### getValues

▸ **getValues**<`Tokens`, `Values`\>(`container`, ...`tokens`): `Values`

Returns an array of resolved values by the specified token.
If a token is not found, then `undefined` value is used.

**`deprecated`** Use `tryResolveValues()` function.

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Tokens` | extends [`Token`](README.md#token)<`unknown`\>[] |
| `Values` | extends { [K in string \| number \| symbol]: Tokens[K] extends Token<V\> ? V : never } |

#### Parameters

| Name | Type |
| :------ | :------ |
| `container` | [`Container`](README.md#container) |
| `...tokens` | `Tokens` |

#### Returns

`Values`

#### Defined in

[packages/ditox/src/utils-deprecated.ts:20](https://github.com/mnasyrov/ditox/blob/aea7a8f/packages/ditox/src/utils-deprecated.ts#L20)

___

### injectable

▸ **injectable**<`Tokens`, `Values`, `Result`\>(`factory`, ...`tokens`): (`container`: [`Container`](README.md#container)) => `Result`

Decorates a factory by passing resolved values as factory arguments.

If an argument is an object which has tokens as its properties,
then returns an object containing resolved values as properties.

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Tokens` | extends ([`Token`](README.md#token)<`unknown`\> \| { [key: string]: [`Token`](README.md#token)<`unknown`\>;  })[] |
| `Values` | extends { [K in string \| number \| symbol]: Tokens[K] extends Token<V\> ? V : Tokens[K] extends TokenProps<Props\> ? Props : never } |
| `Result` | `Result` |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `factory` | (...`params`: `Values`) => `Result` | A factory. |
| `...tokens` | `Tokens` | Tokens which correspond to factory arguments. |

#### Returns

`fn`

Decorated factory which takes a dependency container as a single argument.

▸ (`container`): `Result`

Decorates a factory by passing resolved values as factory arguments.

If an argument is an object which has tokens as its properties,
then returns an object containing resolved values as properties.

##### Parameters

| Name | Type |
| :------ | :------ |
| `container` | [`Container`](README.md#container) |

##### Returns

`Result`

Decorated factory which takes a dependency container as a single argument.

#### Defined in

[packages/ditox/src/utils.ts:178](https://github.com/mnasyrov/ditox/blob/aea7a8f/packages/ditox/src/utils.ts#L178)

___

### injectableClass

▸ **injectableClass**<`Tokens`, `Values`, `Result`\>(`constructor`, ...`tokens`): (`container`: [`Container`](README.md#container)) => `Result`

Decorates a class by passing resolved values as arguments to its constructor.

If an argument is an object which has tokens as its properties,
then returns an object containing resolved values as properties.

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Tokens` | extends ([`Token`](README.md#token)<`unknown`\> \| { [key: string]: [`Token`](README.md#token)<`unknown`\>;  })[] |
| `Values` | extends { [K in string \| number \| symbol]: Tokens[K] extends Token<V\> ? V : Tokens[K] extends TokenProps<Props\> ? Props : never } |
| `Result` | `Result` |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `constructor` | (...`params`: `Values`) => `Result` | Constructor of a class |
| `...tokens` | `Tokens` | Tokens which correspond to constructor arguments |

#### Returns

`fn`

A factory function which takes a dependency container as a single argument
and returns a new created class.

▸ (`container`): `Result`

Decorates a class by passing resolved values as arguments to its constructor.

If an argument is an object which has tokens as its properties,
then returns an object containing resolved values as properties.

##### Parameters

| Name | Type |
| :------ | :------ |
| `container` | [`Container`](README.md#container) |

##### Returns

`Result`

A factory function which takes a dependency container as a single argument
and returns a new created class.

#### Defined in

[packages/ditox/src/utils.ts:211](https://github.com/mnasyrov/ditox/blob/aea7a8f/packages/ditox/src/utils.ts#L211)

___

### injectableProps

▸ **injectableProps**<`Props`, `Result`\>(`factory`, `tokens`): (`container`: [`Container`](README.md#container)) => `Result`

Decorates a factory by passing a resolved object with tokens as the first argument.

**`deprecated`** Use `injectable()` function.

**`example`**
```ts
const factory = ({a, b}: {a: number, b: number}) => a + b;
const decoratedFactory = injectableProps(factory, {a: tokenA, b: tokenB});
const result = decoratedFactory(container);
```

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Props` | extends `ValuesProps` |
| `Result` | `Result` |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `factory` | (`props`: `Props`) => `Result` | A factory. |
| `tokens` | `TokenProps`<`Props`\> | Object with tokens. |

#### Returns

`fn`

Decorated factory which takes a dependency container as a single argument.

▸ (`container`): `Result`

Decorates a factory by passing a resolved object with tokens as the first argument.

**`deprecated`** Use `injectable()` function.

**`example`**
```ts
const factory = ({a, b}: {a: number, b: number}) => a + b;
const decoratedFactory = injectableProps(factory, {a: tokenA, b: tokenB});
const result = decoratedFactory(container);
```

##### Parameters

| Name | Type |
| :------ | :------ |
| `container` | [`Container`](README.md#container) |

##### Returns

`Result`

Decorated factory which takes a dependency container as a single argument.

#### Defined in

[packages/ditox/src/utils-deprecated.ts:82](https://github.com/mnasyrov/ditox/blob/aea7a8f/packages/ditox/src/utils-deprecated.ts#L82)

___

### isToken

▸ **isToken**<`T`\>(`value`): value is Token<T\>

Checks if a value is the token

#### Type parameters

| Name |
| :------ |
| `T` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `value` | `unknown` |

#### Returns

value is Token<T\>

#### Defined in

[packages/ditox/src/utils.ts:11](https://github.com/mnasyrov/ditox/blob/aea7a8f/packages/ditox/src/utils.ts#L11)

___

### optional

▸ **optional**<`T`\>(`token`, `optionalValue`): `OptionalToken`<`T`\>

Decorate a token with an optional value.
This value is be used as default value in case a container does not have registered token.

#### Type parameters

| Name |
| :------ |
| `T` |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `token` | [`Token`](README.md#token)<`T`\> | Existed token. |
| `optionalValue` | `T` | Default value for the resolver. |

#### Returns

`OptionalToken`<`T`\>

#### Defined in

[packages/ditox/src/ditox.ts:41](https://github.com/mnasyrov/ditox/blob/aea7a8f/packages/ditox/src/ditox.ts#L41)

▸ **optional**<`T`\>(`token`): `OptionalToken`<`T` \| `undefined`\>

#### Type parameters

| Name |
| :------ |
| `T` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `token` | [`Token`](README.md#token)<`T`\> |

#### Returns

`OptionalToken`<`T` \| `undefined`\>

#### Defined in

[packages/ditox/src/ditox.ts:45](https://github.com/mnasyrov/ditox/blob/aea7a8f/packages/ditox/src/ditox.ts#L45)

___

### resolveProps

▸ **resolveProps**<`Props`\>(`container`, `tokens`): `Props`

Returns an object with resolved properties which are specified by token properties.
If a token is not found, then `ResolverError` is thrown.

**`deprecated`** Use `resolveValue()` function.

**`example`**
```ts
const props = resolveProps(container, {a: tokenA, b: tokenB});
console.log(props); // {a: 1, b: 2}
```

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Props` | extends `ValuesProps` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `container` | [`Container`](README.md#container) |
| `tokens` | `TokenProps`<`Props`\> |

#### Returns

`Props`

#### Defined in

[packages/ditox/src/utils-deprecated.ts:60](https://github.com/mnasyrov/ditox/blob/aea7a8f/packages/ditox/src/utils-deprecated.ts#L60)

___

### resolveValue

▸ **resolveValue**<`Tokens`, `Values`\>(`container`, `token`): `Values`

Resolves a value by the provided token.

If an argument is an object which has tokens as its properties,
then returns an object containing resolved values as properties.

If a value is not found by the token, then `ResolverError` is thrown.

**`example`**
```ts
const value = resolveValue(container, tokenA);
console.log(value); // 1

const props = resolveValue(container, {a: tokenA, b: tokenB});
console.log(props); // {a: 1, b: 2}
```

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Tokens` | extends [`Token`](README.md#token)<`unknown`\> \| { [key: string]: [`Token`](README.md#token)<`unknown`\>;  } |
| `Values` | extends `unknown` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `container` | [`Container`](README.md#container) |
| `token` | `Tokens` |

#### Returns

`Values`

#### Defined in

[packages/ditox/src/utils.ts:118](https://github.com/mnasyrov/ditox/blob/aea7a8f/packages/ditox/src/utils.ts#L118)

___

### resolveValues

▸ **resolveValues**<`Tokens`, `Values`\>(`container`, ...`tokens`): `Values`

Returns an array of resolved values or objects with resolved values.

If an item of the array is an object which has tokens as its properties,
then returns an object containing resolved values as properties.

If a token is not found, then `ResolverError` is thrown.

**`example`**
```ts
const items1 = resolveValues(container, tokenA);
console.log(items1); // [1]

const items2 = resolveValues(container, tokenA, {a: tokenA, b: tokenB});
console.log(items2); // [1, {a: 1, b: 2}]
```

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Tokens` | extends ([`Token`](README.md#token)<`unknown`\> \| { [key: string]: [`Token`](README.md#token)<`unknown`\>;  })[] |
| `Values` | extends { [K in string \| number \| symbol]: Tokens[K] extends Token<V\> ? V : Tokens[K] extends TokenProps<Props\> ? Props : never } |

#### Parameters

| Name | Type |
| :------ | :------ |
| `container` | [`Container`](README.md#container) |
| `...tokens` | `Tokens` |

#### Returns

`Values`

#### Defined in

[packages/ditox/src/utils.ts:154](https://github.com/mnasyrov/ditox/blob/aea7a8f/packages/ditox/src/utils.ts#L154)

___

### token

▸ **token**<`T`\>(`description?`): [`Token`](README.md#token)<`T`\>

Creates a new binding token.

#### Type parameters

| Name |
| :------ |
| `T` |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `description?` | `string` | Token description for better error messages. |

#### Returns

[`Token`](README.md#token)<`T`\>

#### Defined in

[packages/ditox/src/ditox.ts:31](https://github.com/mnasyrov/ditox/blob/aea7a8f/packages/ditox/src/ditox.ts#L31)

___

### tryResolveValue

▸ **tryResolveValue**<`Tokens`, `Values`\>(`container`, `token`): `Values`

Tries to resolve a value by the provided token.

If an argument is an object which has tokens as its properties,
then returns an object containing resolved values as properties.

If a token is not found, then `undefined` value is used.

**`example`**
```ts
const value = tryResolveValue(container, tokenA);
console.log(value); // 1

const props = tryResolveValue(container, {a: tokenA, b: tokenB});
console.log(props); // {a: 1, b: 2}
```

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Tokens` | extends [`Token`](README.md#token)<`unknown`\> \| { [key: string]: [`Token`](README.md#token)<`unknown`\>;  } |
| `Values` | extends `unknown` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `container` | [`Container`](README.md#container) |
| `token` | `Tokens` |

#### Returns

`Values`

#### Defined in

[packages/ditox/src/utils.ts:54](https://github.com/mnasyrov/ditox/blob/aea7a8f/packages/ditox/src/utils.ts#L54)

___

### tryResolveValues

▸ **tryResolveValues**<`Tokens`, `Values`\>(`container`, ...`tokens`): `Values`

Returns an array of resolved values or objects with resolved values.

If an item of the array is an object which has tokens as its properties,
then returns an object containing resolved values as properties.

If a token is not found, then `undefined` value is used.

**`example`**
```ts
const items1 = tryResolveValues(container, tokenA);
console.log(items1); // [1]

const items2 = tryResolveValues(container, tokenA, {a: tokenA, b: tokenB});
console.log(items2); // [1, {a: 1, b: 2}]
```

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Tokens` | extends ([`Token`](README.md#token)<`unknown`\> \| { [key: string]: [`Token`](README.md#token)<`unknown`\>;  })[] |
| `Values` | extends { [K in string \| number \| symbol]: Tokens[K] extends Token<V\> ? undefined \| V : Tokens[K] extends TokenProps<Props\> ? Partial<Props\> : never } |

#### Parameters

| Name | Type |
| :------ | :------ |
| `container` | [`Container`](README.md#container) |
| `...tokens` | `Tokens` |

#### Returns

`Values`

#### Defined in

[packages/ditox/src/utils.ts:88](https://github.com/mnasyrov/ditox/blob/aea7a8f/packages/ditox/src/utils.ts#L88)
