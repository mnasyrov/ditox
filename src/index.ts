export type Token<T> = {
  symbol: symbol;
  type?: T; // Anchor for Typescript type inference.
};

export function createToken<T>(key: string): Token<T> {
  return {symbol: Symbol(key)};
}

export type FactoryOptions<T> = {
  scope?: 'singleton' | 'transient';
  onUnbind?: (value: T) => void;
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

  get<T>(token: Token<T>): T | undefined;
  resolve<T>(token: Token<T>): T;
};

export const CONTAINER: Token<Container> = createToken('SenseDi.Container');
export const PARENT_CONTAINER: Token<Container> = createToken(
  'SenseDi.ParentContainer',
);

export class ContainerError extends Error {}

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

      const context = factories.get(token.symbol);

      if (context && context.options?.onUnbind && values.has(token.symbol)) {
        const value = values.get(token.symbol);
        context.options.onUnbind(value);
      }

      values.delete(token.symbol);
      factories.delete(token.symbol);
    },

    unbindAll(): void {
      factories.forEach((context, key) => {
        if (context.options?.onUnbind && values.has(key)) {
          const value = values.get(key);
          context.options.onUnbind(value);
        }
      });

      values.clear();
      factories.clear();
      bindContainers(values, container, parentContainer);
    },

    get<T>(token: Token<T>): T | undefined {
      const value = lookup(values, factories, token);
      if (value !== NOT_FOUND) {
        return value;
      }

      if (parentContainer) {
        return parentContainer.get(token);
      }

      return undefined;
    },

    resolve<T>(token: Token<T>): T {
      const value = lookup(values, factories, token);
      if (value !== NOT_FOUND) {
        return value;
      }

      if (parentContainer) {
        return parentContainer.resolve(token);
      }

      throw new ContainerError(
        `Token "${token.symbol.description}" is not provided`,
      );
    },
  };

  bindContainers(values, container, parentContainer);

  return container;
}

function isInternalToken<T>(token: Token<T>): boolean {
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
  token: Token<T>,
): T | typeof NOT_FOUND {
  if (values.has(token.symbol)) {
    return values.get(token.symbol);
  }

  if (factories.has(token.symbol)) {
    const context = factories.get(token.symbol);
    if (context) {
      const {factory, options} = context;
      const value = factory();

      if (options?.scope !== 'transient') {
        // Store as a singleton value
        values.set(token.symbol, value);
      }

      return value;
    }
  }

  return NOT_FOUND;
}

export function getValues<
  Values extends (unknown | void)[],
  Tokens extends {[K in keyof Values]: Token<Values[K]>}
>(container: Container, tokens: Tokens): Values {
  return tokens.map(container.get) as Values;
}

export function resolveValues<
  Values extends unknown[],
  Tokens extends {[K in keyof Values]: Token<Values[K]>}
>(container: Container, tokens: Tokens): Values {
  return tokens.map(container.resolve) as Values;
}

export function inject<
  Values extends unknown[],
  Tokens extends {[K in keyof Values]: Token<Values[K]>},
  Result
>(
  container: Container,
  tokens: Tokens,
  factory: (...params: Values) => Result,
): () => Result {
  return () => {
    const values: Values = resolveValues(container, tokens);
    return factory(...values);
  };
}
