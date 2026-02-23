import type { Container } from './container';
import { Token } from './tokens';

type ValuesProps = { [key: string]: unknown };
type TokenProps<Props extends ValuesProps> = {
  [K in keyof Props]: Token<Props[K]>;
};

/**
 * Checks if a value is the token
 */
export function isToken<T>(value: unknown): value is Token<T> {
  return (
    value !== undefined &&
    value !== null &&
    typeof value === 'object' &&
    'symbol' in value &&
    typeof (value as any).symbol === 'symbol'
  );
}

/**
 * Rebinds the array by the token with added new value.
 * @param container - Dependency container.
 * @param token - Token for an array of values.
 * @param value - New value which is added to the end of the array.
 */
export function bindMultiValue<T>(
  container: Container,
  token: Token<ReadonlyArray<T>>,
  value: T,
): void {
  const prevValues = container.get(token) ?? [];
  const nextValues = [...prevValues, value];
  container.bindValue(token, nextValues);
}

/**
 * Tries to resolve a value by the provided token.
 *
 * If an argument is an object which has tokens as its properties,
 * then returns an object containing resolved values as properties.

 * If a token is not found, then `undefined` value is used.
 *
 * @example
 * ```ts
 * const value = tryResolveValue(container, tokenA);
 * console.log(value); // 1
 *
 * const props = tryResolveValue(container, {a: tokenA, b: tokenB});
 * console.log(props); // {a: 1, b: 2}
 * ```
 */
export function tryResolveValue<
  Tokens extends Token<unknown> | { [key: string]: Token<unknown> },
  Values extends Tokens extends Token<infer V>
    ? V | undefined
    : Tokens extends TokenProps<infer Props>
      ? Partial<Props>
      : never,
>(container: Container, token: Tokens): Values {
  if (isToken(token)) {
    return container.get(token) as Values;
  }

  const obj: any = {};
  Object.keys(token).forEach((key) => (obj[key] = container.get(token[key])));
  return obj;
}

/**
 * Returns an array of resolved values or objects with resolved values.
 *
 * If an item of the array is an object which has tokens as its properties,
 * then returns an object containing resolved values as properties.

 * If a token is not found, then `undefined` value is used.
 *
 * @example
 * ```ts
 * const items1 = tryResolveValues(container, tokenA);
 * console.log(items1); // [1]
 *
 * const items2 = tryResolveValues(container, tokenA, {a: tokenA, b: tokenB});
 * console.log(items2); // [1, {a: 1, b: 2}]
 * ```
 */
export function tryResolveValues<
  Tokens extends (Token<unknown> | { [key: string]: Token<unknown> })[],
  Values extends {
    [K in keyof Tokens]: Tokens[K] extends Token<infer V>
      ? V | undefined
      : Tokens[K] extends TokenProps<infer Props>
        ? Partial<Props>
        : never;
  },
>(container: Container, ...tokens: Tokens): Values {
  return tokens.map((item) => tryResolveValue(container, item)) as Values;
}

/**
 * Resolves a value by the provided token.
 *
 * If an argument is an object which has tokens as its properties,
 * then returns an object containing resolved values as properties.

 * If a value is not found by the token, then `ResolverError` is thrown.
 *
 * @example
 * ```ts
 * const value = resolveValue(container, tokenA);
 * console.log(value); // 1
 *
 * const props = resolveValue(container, {a: tokenA, b: tokenB});
 * console.log(props); // {a: 1, b: 2}
 * ```
 */
export function resolveValue<
  Tokens extends Token<unknown> | { [key: string]: Token<unknown> },
  Values extends Tokens extends Token<infer V>
    ? V
    : Tokens extends TokenProps<infer Props>
      ? Props
      : never,
>(container: Container, token: Tokens): Values {
  if (isToken(token)) {
    return container.resolve(token) as Values;
  }

  const obj: any = {};
  Object.keys(token).forEach(
    (key) => (obj[key] = container.resolve(token[key])),
  );
  return obj;
}

/**
 * Returns an array of resolved values or objects with resolved values.
 *
 * If an item of the array is an object which has tokens as its properties,
 * then returns an object containing resolved values as properties.

 * If a token is not found, then `ResolverError` is thrown.
 *
 * @example
 * ```ts
 * const items1 = resolveValues(container, tokenA);
 * console.log(items1); // [1]
 *
 * const items2 = resolveValues(container, tokenA, {a: tokenA, b: tokenB});
 * console.log(items2); // [1, {a: 1, b: 2}]
 * ```
 */
export function resolveValues<
  Tokens extends (Token<unknown> | { [key: string]: Token<unknown> })[],
  Values extends {
    [K in keyof Tokens]: Tokens[K] extends Token<infer V>
      ? V
      : Tokens[K] extends TokenProps<infer Props>
        ? Props
        : never;
  },
>(container: Container, ...tokens: Tokens): Values {
  return tokens.map((item) => resolveValue(container, item)) as Values;
}

/**
 * Decorates a factory by passing resolved values as factory arguments.
 *
 * If an argument is an object which has tokens as its properties,
 * then returns an object containing resolved values as properties.
 *
 * @param factory - A factory.
 * @param tokens - Tokens which correspond to factory arguments.
 *
 * @return Decorated factory which takes a dependency container as a single argument.
 */
export function injectable<
  Tokens extends (Token<unknown> | { [key: string]: Token<unknown> })[],
  Values extends {
    [K in keyof Tokens]: Tokens[K] extends Token<infer V>
      ? V
      : Tokens[K] extends TokenProps<infer Props>
        ? Props
        : never;
  },
  Result,
>(
  this: unknown,
  factory: (...params: Values) => Result,
  ...tokens: Tokens
): (container: Container) => Result {
  return (container) => {
    const values: Values = resolveValues(container, ...tokens);
    return factory.apply(this, values);
  };
}

/**
 * Decorates a class by passing resolved values as arguments to its constructor.
 *
 * If an argument is an object which has tokens as its properties,
 * then returns an object containing resolved values as properties.
 *
 * @param constructor - Constructor of a class
 * @param tokens - Tokens which correspond to constructor arguments
 *
 * @return A factory function which takes a dependency container as a single argument
 * and returns a new created class.
 */
export function injectableClass<
  Tokens extends (Token<unknown> | { [key: string]: Token<unknown> })[],
  Values extends {
    [K in keyof Tokens]: Tokens[K] extends Token<infer V>
      ? V
      : Tokens[K] extends TokenProps<infer Props>
        ? Props
        : never;
  },
  Result,
>(
  this: unknown,
  constructor: new (...params: Values) => Result,
  ...tokens: Tokens
): (container: Container) => Result {
  return injectable<Tokens, Values, Result>(
    (...values) => new constructor(...values),
    ...tokens,
  );
}
