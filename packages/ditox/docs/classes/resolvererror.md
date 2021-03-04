[ditox](../README.md) / ResolverError

# Class: ResolverError

ResolverError is thrown by the resolver when a token is not found in a container.

## Hierarchy

* *Error*

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

\+ **new ResolverError**(`message`: *string*): [*ResolverError*](resolvererror.md)

#### Parameters:

Name | Type |
:------ | :------ |
`message` | *string* |

**Returns:** [*ResolverError*](resolvererror.md)

Defined in: [packages/ditox/src/ditox.ts:60](https://github.com/mnasyrov/ditox/blob/60bc7e7/packages/ditox/src/ditox.ts#L60)

## Properties

### message

• **message**: *string*

Defined in: node_modules/typescript/lib/lib.es5.d.ts:974

___

### name

• **name**: *string*

Defined in: node_modules/typescript/lib/lib.es5.d.ts:973

___

### stack

• `Optional` **stack**: *undefined* \| *string*

Defined in: node_modules/typescript/lib/lib.es5.d.ts:975

___

### prepareStackTrace

▪ `Optional` `Static` **prepareStackTrace**: *undefined* \| (`err`: Error, `stackTraces`: CallSite[]) => *any*

Optional override for formatting stack traces

**`see`** https://github.com/v8/v8/wiki/Stack%20Trace%20API#customizing-stack-traces

Defined in: node_modules/@types/node/globals.d.ts:11

___

### stackTraceLimit

▪ `Static` **stackTraceLimit**: *number*

Defined in: node_modules/@types/node/globals.d.ts:13

## Methods

### captureStackTrace

▸ `Static`**captureStackTrace**(`targetObject`: *object*, `constructorOpt?`: Function): *void*

Create .stack property on a target object

#### Parameters:

Name | Type |
:------ | :------ |
`targetObject` | *object* |
`constructorOpt?` | Function |

**Returns:** *void*

Defined in: node_modules/@types/node/globals.d.ts:4
