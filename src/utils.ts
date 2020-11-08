import {Container, Token} from './ditox';

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

export function bindMultiValue<T>(
  container: Container,
  token: Token<Array<T>>,
  value: T,
): void {
  const prevValues = container.get(token) ?? [];
  const nextValues = [...prevValues, value];
  container.bindValue(token, nextValues);
}

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
