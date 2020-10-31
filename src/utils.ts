import {Container, TokenLike} from './common';

export function getValues<
  Tokens extends TokenLike<unknown>[],
  Values extends {
    [K in keyof Tokens]: Tokens[K] extends TokenLike<infer V> ? V : never;
  }
>(container: Container, ...tokens: Tokens): Values {
  return tokens.map(container.get) as Values;
}

export function resolveValues<
  Tokens extends TokenLike<unknown>[],
  Values extends {
    [K in keyof Tokens]: Tokens[K] extends TokenLike<infer V> ? V : never;
  }
>(container: Container, ...tokens: Tokens): Values {
  return tokens.map(container.resolve) as Values;
}

export function inject<
  Tokens extends TokenLike<unknown>[],
  Values extends {
    [K in keyof Tokens]: Tokens[K] extends TokenLike<infer V> ? V : never;
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
