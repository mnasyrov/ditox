import type {Container, Token} from './ditox';
import {
  injectable,
  resolveValue,
  tryResolveValue,
  tryResolveValues,
} from './utils';

type ValuesProps = {[key: string]: unknown};
type TokenProps<Props extends ValuesProps> = {
  [K in keyof Props]: Token<Props[K]>;
};

/**
 * Returns an array of resolved values by the specified token.
 * If a token is not found, then `undefined` value is used.
 *
 * @deprecated Use `tryResolveValues()` function.
 */
export function getValues<
  Tokens extends Token<unknown>[],
  Values extends {
    [K in keyof Tokens]: Tokens[K] extends Token<infer V> ? V : never;
  },
>(container: Container, ...tokens: Tokens): Values {
  return tryResolveValues(container, ...tokens);
}

/**
 * Returns an object with resolved properties which are specified by token properties.
 * If a token is not found, then `undefined` value is used.
 *
 * @deprecated Use `tryResolveValue()` function.
 *
 * @example
 * ```ts
 * const props = getProps(container, {a: tokenA, b: tokenB});
 * console.log(props); // {a: 1, b: 2}
 * ```
 */
export function getProps<Props extends ValuesProps>(
  container: Container,
  tokens: TokenProps<Props>,
): Partial<Props> {
  return tryResolveValue(container, tokens) as Partial<Props>;
}

/**
 * Returns an object with resolved properties which are specified by token properties.
 * If a token is not found, then `ResolverError` is thrown.
 *
 * @deprecated Use `resolveValue()` function.
 *
 * @example
 * ```ts
 * const props = resolveProps(container, {a: tokenA, b: tokenB});
 * console.log(props); // {a: 1, b: 2}
 * ```
 */
export function resolveProps<Props extends ValuesProps>(
  container: Container,
  tokens: TokenProps<Props>,
): Props {
  return resolveValue(container, tokens) as Props;
}

/**
 * Decorates a factory by passing a resolved object with tokens as the first argument.
 * @param factory - A factory.
 * @param tokens - Object with tokens.
 * @return Decorated factory which takes a dependency container as a single argument.
 *
 * @deprecated Use `injectable()` function.
 *
 * @example
 * ```ts
 * const factory = ({a, b}: {a: number, b: number}) => a + b;
 * const decoratedFactory = injectableProps(factory, {a: tokenA, b: tokenB});
 * const result = decoratedFactory(container);
 * ```
 */
export function injectableProps<Props extends ValuesProps, Result>(
  factory: (props: Props) => Result,
  tokens: TokenProps<Props>,
): (container: Container) => Result {
  return injectable(factory as any, tokens);
}
