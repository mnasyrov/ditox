import {Container, Token} from './common';

export function getValues<
  Tokens extends Token<unknown>[],
  Values extends {
    [K in keyof Tokens]: Tokens[K] extends Token<infer V> ? V : never;
  }
>(container: Container, ...tokens: Tokens): Values {
  return tokens.map(container.get) as Values;
}

export function resolveValues<
  Tokens extends Token<unknown>[],
  Values extends {
    [K in keyof Tokens]: Tokens[K] extends Token<infer V> ? V : never;
  }
>(container: Container, ...tokens: Tokens): Values {
  return tokens.map(container.resolve) as Values;
}

export function inject<
  Tokens extends Token<unknown>[],
  Values extends {
    [K in keyof Tokens]: Tokens[K] extends Token<infer V> ? V : never;
  },
  Result
>(
  container: Container,
  factory: (...params: Values) => Result,
  ...tokens: Tokens
): () => Result {
  return () => {
    const values: Values = tokens.map(container.resolve) as Values;
    return factory(...values);
  };
}

export function bindMultiValue<T>(
  container: Container,
  token: Token<Array<T>>,
  value: T,
): void {
  const prevValues = container.get(token) ?? [];
  const nextValues = [...prevValues, value];
  container.bindValue(token, nextValues);
}
