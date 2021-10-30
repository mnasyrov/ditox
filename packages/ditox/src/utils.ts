import type {Container, Token} from './ditox';

type ValuesProps = {[key: string]: unknown};
type TokenProps<Props extends ValuesProps> = {
  [K in keyof Props]: Token<Props[K]>;
};

/**
 * Rebinds the array by the token with added new value.
 * @param container - Dependency container.
 * @param token - Token for an array of values.
 * @param value - New value which is added to the end of the array.
 */
export function bindMultiValue<T>(
  container: Container,
  token: Token<Array<T>>,
  value: T,
): void {
  const prevValues = container.get(token) ?? [];
  const nextValues = [...prevValues, value];
  container.bindValue(token, nextValues);
}

/**
 * Returns an array of resolved values by the specified token.
 * If a token is not found, then `undefined` value is used.
 */
export function getValues<
  Tokens extends Token<unknown>[],
  Values extends {
    [K in keyof Tokens]: Tokens[K] extends Token<infer V> ? V : never;
  },
>(container: Container, ...tokens: Tokens): Values {
  return tokens.map(container.get) as Values;
}

/**
 * Returns an array of resolved values by the specified token.
 * If a token is not found, then `ResolverError` is thrown.
 */
export function resolveValues<
  Tokens extends Token<unknown>[],
  Values extends {
    [K in keyof Tokens]: Tokens[K] extends Token<infer V> ? V : never;
  },
>(container: Container, ...tokens: Tokens): Values {
  return tokens.map(container.resolve) as Values;
}

/**
 * Decorates a factory by passing resolved tokens as factory arguments.
 * @param factory - A factory.
 * @param tokens - Tokens which correspond to factory arguments.
 * @return Decorated factory which takes a dependency container as a single argument.
 */
export function injectable<
  Tokens extends Token<unknown>[],
  Values extends {
    [K in keyof Tokens]: Tokens[K] extends Token<infer V> ? V : never;
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
 * Returns an object with resolved properties which are specified by token properties.
 * If a token is not found, then `undefined` value is used.
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
  const obj: any = {...tokens};
  Object.keys(obj).forEach((key) => (obj[key] = container.get(obj[key])));
  return obj;
}

/**
 * Returns an object with resolved properties which are specified by token properties.
 * If a token is not found, then `ResolverError` is thrown.
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
  const obj: any = {...tokens};
  Object.keys(obj).forEach((key) => (obj[key] = container.resolve(obj[key])));
  return obj;
}

/**
 * Decorates a factory by passing a resolved object with tokens as the first argument.
 * @param factory - A factory.
 * @param tokens - Object with tokens.
 * @return Decorated factory which takes a dependency container as a single argument.
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
  return (container) => {
    const values: Props = resolveProps(container, tokens);
    return factory(values);
  };
}
