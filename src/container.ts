import {
  CONTAINER,
  Container,
  FactoryOptions,
  PARENT_CONTAINER,
  ResolverError,
  Token,
} from './common';

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

    get<T>(token: Token<T>): T | undefined {
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

    resolve<T>(token: Token<T>): T {
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
