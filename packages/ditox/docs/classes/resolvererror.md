[ditox](../README.md) / ResolverError

# Class: ResolverError

ResolverError is thrown by the resolver when a token is not found in a container.

## Hierarchy

- `Error`

  ↳ **ResolverError**

## Table of contents

### Constructors

- [constructor](resolvererror.md#constructor)

### Properties

- [message](resolvererror.md#message)
- [name](resolvererror.md#name)
- [stack](resolvererror.md#stack)
- [prepareStackTrace](resolvererror.md#preparestacktrace)
- [stackTraceLimit](resolvererror.md#stacktracelimit)

### Methods

- [captureStackTrace](resolvererror.md#capturestacktrace)

## Constructors

### constructor

• **new ResolverError**(`message`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `message` | `string` |

#### Overrides

Error.constructor

#### Defined in

[packages/ditox/src/ditox.ts:60](https://github.com/mnasyrov/ditox/blob/98f445f/packages/ditox/src/ditox.ts#L60)

## Properties

### message

• **message**: `string`

#### Inherited from

Error.message

#### Defined in

node_modules/typescript/lib/lib.es5.d.ts:974

___

### name

• **name**: `string`

#### Inherited from

Error.name

#### Defined in

node_modules/typescript/lib/lib.es5.d.ts:973

___

### stack

• `Optional` **stack**: `string`

#### Inherited from

Error.stack

#### Defined in

node_modules/typescript/lib/lib.es5.d.ts:975

___

### prepareStackTrace

▪ `Static` `Optional` **prepareStackTrace**: (`err`: `Error`, `stackTraces`: `CallSite`[]) => `any`

#### Type declaration

▸ (`err`, `stackTraces`): `any`

Optional override for formatting stack traces

##### Parameters

| Name | Type |
| :------ | :------ |
| `err` | `Error` |
| `stackTraces` | `CallSite`[] |

##### Returns

`any`

#### Inherited from

Error.prepareStackTrace

#### Defined in

node_modules/@types/node/globals.d.ts:11

___

### stackTraceLimit

▪ `Static` **stackTraceLimit**: `number`

#### Inherited from

Error.stackTraceLimit

#### Defined in

node_modules/@types/node/globals.d.ts:13

## Methods

### captureStackTrace

▸ `Static` **captureStackTrace**(`targetObject`, `constructorOpt?`): `void`

Create .stack property on a target object

#### Parameters

| Name | Type |
| :------ | :------ |
| `targetObject` | `object` |
| `constructorOpt?` | `Function` |

#### Returns

`void`

#### Inherited from

Error.captureStackTrace

#### Defined in

node_modules/@types/node/globals.d.ts:4
