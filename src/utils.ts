import {Container, Token} from './ditox';

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
  Result
>(
  factory: (...params: Values) => Result,
  ...tokens: Tokens
): (container: Container) => Result {
  return (container) => {
    const values: Values = tokens.map(container.resolve) as Values;
    return factory(...values);
  };
}

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
  }
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
  }
>(container: Container, ...tokens: Tokens): Values {
  return tokens.map(container.resolve) as Values;
}
