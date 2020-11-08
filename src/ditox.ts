export type RequiredToken<T> = {
  symbol: symbol;
  type?: T; // Anchor for Typescript type inference.
  isOptional?: false;
};

export type OptionalToken<T> = {
  symbol: symbol;
  type?: T; // Anchor for Typescript type inference.
  isOptional: true;
  optionalValue: T;
};

export type Token<T> = RequiredToken<T> | OptionalToken<T>;

export function token<T>(description?: string): Token<T> {
  return {symbol: Symbol(description)};
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

export class ResolverError extends Error {
  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = 'ResolverError';
  }
}

export type FactoryScope = 'scoped' | 'singleton' | 'transient';

export type FactoryOptions<T> =
  | {
      scope?: 'scoped' | 'singleton';
      onRemoved?: (value: T) => void;
    }
  | {
      scope: 'transient';
    };

export type Container = {
  bindValue<T>(token: Token<T>, value: T): void;
  bindFactory<T>(
    token: Token<T>,
    factory: (container: Container) => T,
    options?: FactoryOptions<T>,
  ): void;

  get<T>(token: Token<T>): T | undefined;
  resolve<T>(token: Token<T>): T;

  remove<T>(token: Token<T>): void;
  removeAll(): void;
};

export const CONTAINER: Token<Container> = token('ditox.Container');
export const PARENT_CONTAINER: Token<Container> = token(
  'ditox.ParentContainer',
);
export const RESOLVER: Token<Resolver> = token('ditox.Resolver');

const NOT_FOUND = Symbol();
const DEFAULT_SCOPE: FactoryScope = 'scoped';

type FactoryContext<T> = {
  factory: (container: Container) => T;
  options?: FactoryOptions<T>;
};

type ValuesMap = Map<symbol, any>;
type FactoriesMap = Map<symbol, FactoryContext<any>>;

type ResolverResult<T> =
  | {type: 'value'; value: T}
  | {type: 'factory'; factoryContext: FactoryContext<T>};
type Resolver = <T>(token: Token<T>) => ResolverResult<T> | void;

function getScope<T>(options?: FactoryOptions<T>): FactoryScope {
  return options?.scope ?? DEFAULT_SCOPE;
}

function getOnRemoved<T>(options: FactoryOptions<T>) {
  return options.scope === undefined ||
    options.scope === 'scoped' ||
    options.scope === 'singleton'
    ? options.onRemoved
    : undefined;
}

function isInternalToken<T>(token: Token<T>): boolean {
  return (
    token.symbol === CONTAINER.symbol ||
    token.symbol === PARENT_CONTAINER.symbol ||
    token.symbol === RESOLVER.symbol
  );
}

export function createContainer(parentContainer?: Container): Container {
  const values: ValuesMap = new Map<symbol, any>();
  const factories: FactoriesMap = new Map<symbol, FactoryContext<any>>();

  const container: Container = {
    bindValue<T>(token: Token<T>, value: T): void {
      if (isInternalToken(token)) {
        return;
      }

      values.set(token.symbol, value);
    },

    bindFactory<T>(
      token: Token<T>,
      factory: (container: Container) => T,
      options?: FactoryOptions<T>,
    ): void {
      if (isInternalToken(token)) {
        return;
      }

      factories.set(token.symbol, {factory, options});
    },

    remove<T>(token: Token<T>): void {
      if (isInternalToken(token)) {
        return;
      }

      const options = factories.get(token.symbol)?.options;
      if (options) {
        executeOnRemoved(token.symbol, options);
      }

      values.delete(token.symbol);
      factories.delete(token.symbol);
    },

    removeAll(): void {
      factories.forEach((context, tokenSymbol) => {
        if (context.options) {
          executeOnRemoved(tokenSymbol, context.options);
        }
      });

      values.clear();
      factories.clear();
      bindInternalTokens();
    },

    get<T>(token: Token<T>): T | undefined {
      const value = localResolver(token);
      if (value !== NOT_FOUND) {
        return value;
      }

      if (token.isOptional) {
        return token.optionalValue;
      }

      return undefined;
    },

    resolve<T>(token: Token<T>): T {
      const value = localResolver(token);
      if (value !== NOT_FOUND) {
        return value;
      }

      if (token.isOptional) {
        return token.optionalValue;
      }

      throw new ResolverError(
        `Token "${token.symbol.description ?? ''}" is not provided`,
      );
    },
  };

  function localResolver<T>(token: Token<T>): T | typeof NOT_FOUND {
    const result = resolver(token);

    if (result) {
      if (result.type === 'value') {
        return result.value;
      }

      if (result.type === 'factory') {
        const context = result.factoryContext;
        const value = context.factory(container);

        const scope = getScope(context.options);
        if (scope === 'singleton' || scope === 'scoped') {
          // Cache the value in the local container.
          values.set(token.symbol, value);
        }

        return value;
      }
    }

    return NOT_FOUND;
  }

  function resolver<T>(token: Token<T>): ResolverResult<T> | void {
    const value = values.get(token.symbol);
    if (value !== undefined || values.has(token.symbol)) {
      return {type: 'value', value};
    }

    const factoryContext = factories.get(token.symbol);
    if (factoryContext) {
      const scope = getScope(factoryContext.options);

      if (scope === 'singleton') {
        // Cache the value in the same container where the factory is registered.
        const value = factoryContext.factory(container);
        values.set(token.symbol, value);
        return {type: 'value', value};
      }

      return {type: 'factory', factoryContext};
    }

    const parentResolver = parentContainer?.get(RESOLVER);
    if (parentResolver) {
      return parentResolver(token);
    }

    return undefined;
  }

  function executeOnRemoved<T>(
    tokenSymbol: symbol,
    options: FactoryOptions<T>,
  ) {
    const onRemoved = getOnRemoved(options);
    if (onRemoved) {
      const value = values.get(tokenSymbol);
      if (value !== undefined || values.has(tokenSymbol)) {
        onRemoved(value);
      }
    }
  }

  function bindInternalTokens() {
    values.set(CONTAINER.symbol, container);
    values.set(RESOLVER.symbol, resolver);

    if (parentContainer) {
      values.set(PARENT_CONTAINER.symbol, parentContainer);
    }
  }

  bindInternalTokens();
  return container;
}
