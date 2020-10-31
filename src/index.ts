export type Token<T> = {
  symbol: symbol;
  type?: T; // Anchor for Typescript type inference.
};

export type OptionalToken<T> = {
  symbol: symbol;
  type?: T; // Anchor for Typescript type inference.
  isOptional: true;
  optionalValue: T;
};

export type TokenLike<T> = Token<T> | OptionalToken<T>;

export function createToken<T>(key: string): Token<T> {
  return {symbol: Symbol(key)};
}

export function optional<T>(
  token: Token<T>,
  optionalValue: T,
): OptionalToken<T>;
export function optional<T>(token: Token<T>): OptionalToken<T | void>;
export function optional<T>(
  token: Token<T>,
  optionalValue?: T,
): OptionalToken<T | void> {
  return {
    symbol: token.symbol,
    isOptional: true,
    optionalValue,
  };
}

export type FactoryOptions<T> =
  | {
      scope?: 'singleton';
      onUnbind?: (value: T) => void;
    }
  | {
      scope: 'transient';
    };

export type Container = {
  bindValue<T>(token: Token<T>, value: T): void;
  bindFactory<T>(
    token: Token<T>,
    factory: () => T,
    options?: FactoryOptions<T>,
  ): void;
  unbind<T>(token: Token<T>): void;
  unbindAll(): void;

  get<T>(token: Token<T> | OptionalToken<T>): T | undefined;
  resolve<T>(token: Token<T> | OptionalToken<T>): T;
};

export const CONTAINER: Token<Container> = createToken('Ditox.Container');
export const PARENT_CONTAINER: Token<Container> = createToken(
  'Ditox.ParentContainer',
);

export class ResolverError extends Error {
  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = 'ResolverError';
  }
}

const NOT_FOUND = Symbol();

type FactoryContext = {
  factory: () => any;
  options?: FactoryOptions<any>;
};

type ValuesMap = Map<symbol, any>;
type FactoriesMap = Map<symbol, FactoryContext>;

export function createContainer(parentContainer?: Container): Container {
  const values: ValuesMap = new Map<symbol, any>();
  const factories: FactoriesMap = new Map<symbol, FactoryContext>();

  const container: Container = {
    bindValue<T>(token: Token<T>, value: T): void {
      if (isInternalToken(token)) {
        return;
      }

      values.set(token.symbol, value);
    },

    bindFactory<T>(
      token: Token<T>,
      factory: () => T,
      options?: FactoryOptions<T>,
    ): void {
      if (isInternalToken(token)) {
        return;
      }

      factories.set(token.symbol, {factory, options});
    },

    unbind<T>(token: Token<T>): void {
      if (isInternalToken(token)) {
        return;
      }

      const options = factories.get(token.symbol)?.options;
      invokeUnbindCallback(values, token.symbol, options);

      values.delete(token.symbol);
      factories.delete(token.symbol);
    },

    unbindAll(): void {
      factories.forEach((context, key) => {
        invokeUnbindCallback(values, key, context?.options);
      });

      values.clear();
      factories.clear();
      bindContainers(values, container, parentContainer);
    },

    get<T>(token: TokenLike<T>): T | undefined {
      const value = lookup(values, factories, token);
      if (value !== NOT_FOUND) {
        return value;
      }

      if (parentContainer) {
        return parentContainer.get(token);
      }

      if ('isOptional' in token && token.isOptional) {
        return token.optionalValue;
      }

      return undefined;
    },

    resolve<T>(token: TokenLike<T>): T {
      const value = lookup(values, factories, token);
      if (value !== NOT_FOUND) {
        return value;
      }

      if (parentContainer) {
        return parentContainer.resolve(token);
      }

      if ('isOptional' in token && token.isOptional) {
        return token.optionalValue;
      }

      throw new ResolverError(
        `Token "${token.symbol.description}" is not provided`,
      );
    },
  };

  bindContainers(values, container, parentContainer);

  return container;
}

function isInternalToken<T>(token: TokenLike<T>): boolean {
  return (
    token.symbol === CONTAINER.symbol ||
    token.symbol === PARENT_CONTAINER.symbol
  );
}

function bindContainers(
  values: ValuesMap,
  container: Container,
  parentContainer: Container | void,
) {
  values.set(CONTAINER.symbol, container);
  if (parentContainer) {
    values.set(PARENT_CONTAINER.symbol, parentContainer);
  }
}

function lookup<T>(
  values: ValuesMap,
  factories: FactoriesMap,
  token: TokenLike<T>,
): T | typeof NOT_FOUND {
  if (values.has(token.symbol)) {
    return values.get(token.symbol);
  }

  if (factories.has(token.symbol)) {
    const context = factories.get(token.symbol);
    if (context) {
      const {factory, options} = context;
      const value = factory();

      if (options?.scope === undefined || options?.scope === 'singleton') {
        // Memoize the result value
        values.set(token.symbol, value);
      }

      return value;
    }
  }

  return NOT_FOUND;
}

function invokeUnbindCallback<T>(
  values: ValuesMap,
  key: symbol,
  options: FactoryOptions<T> | undefined,
) {
  if (options && (options as any).onUnbind && values.has(key)) {
    const value = values.get(key);
    (options as any).onUnbind(value);
  }
}

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
