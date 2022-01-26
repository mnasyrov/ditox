[ditox](../README.md) / ResolverError

# Class: ResolverError

ResolverError is thrown by the resolver when a token is not found in a container.

## Hierarchy

- `Error`

  ↳ **`ResolverError`**

## Table of contents

### Constructors

- [constructor](ResolverError.md#constructor)

### Properties

- [message](ResolverError.md#message)
- [name](ResolverError.md#name)
- [stack](ResolverError.md#stack)
- [prepareStackTrace](ResolverError.md#preparestacktrace)
- [stackTraceLimit](ResolverError.md#stacktracelimit)

### Methods

- [captureStackTrace](ResolverError.md#capturestacktrace)

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

[packages/ditox/src/ditox.ts:61](https://github.com/mnasyrov/ditox/blob/8c2302d/packages/ditox/src/ditox.ts#L61)

## Properties

### message

• **message**: `string`

#### Inherited from

Error.message

#### Defined in

node_modules/typescript/lib/lib.es5.d.ts:1023

___

### name

• **name**: `string`

#### Inherited from

Error.name

#### Defined in

node_modules/typescript/lib/lib.es5.d.ts:1022

___

### stack

• `Optional` **stack**: `string`

#### Inherited from

Error.stack

#### Defined in

node_modules/typescript/lib/lib.es5.d.ts:1024

___

### prepareStackTrace

▪ `Static` `Optional` **prepareStackTrace**: (`err`: `Error`, `stackTraces`: `CallSite`[]) => `any`

#### Type declaration

▸ (`err`, `stackTraces`): `any`

Optional override for formatting stack traces

**`see`** https://v8.dev/docs/stack-trace-api#customizing-stack-traces

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
