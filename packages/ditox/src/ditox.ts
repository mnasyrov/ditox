/**
 * @ignore
 * Binding token for mandatory value
 */
export type RequiredToken<T> = {
  symbol: symbol;
  type?: T; // Anchor for Typescript type inference.
  isOptional?: false;
};

/**
 * @ignore
 * Binding token for optional value
 */
export type OptionalToken<T> = {
  symbol: symbol;
  type?: T; // Anchor for Typescript type inference.
  isOptional: true;
  optionalValue: T;
};

/**
 * Binding token.
 */
export type Token<T> = RequiredToken<T> | OptionalToken<T>;

/**
 * Creates a new binding token.
 * @param description - Token description for better error messages.
 */
export function token<T>(description?: string): Token<T> {
  return {symbol: Symbol(description)};
}

/**
 * Decorate a token with an optional value.
 * This value is be used as default value in case a container does not have registered token.
 * @param token - Existed token.
 * @param optionalValue - Default value for the resolver.
 */
export function optional<T>(
  token: Token<T>,
  optionalValue: T,
): OptionalToken<T>;
export function optional<T>(token: Token<T>): OptionalToken<T | undefined>;
export function optional<T>(
  token: Token<T>,
  optionalValue?: T,
): OptionalToken<T | undefined> {
  return {
    symbol: token.symbol,
    isOptional: true,
    optionalValue,
  };
}

/**
 * ResolverError is thrown by the resolver when a token is not found in a container.
 */
export class ResolverError extends Error {
  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = 'ResolverError';
  }
}

/**
 * @see https://github.com/mnasyrov/ditox#factory-lifetimes
 */
export type FactoryScope = 'scoped' | 'singleton' | 'transient';

/**
 * Options for factory binding.
 *
 * `scope` types:
 *   - `scoped` - **This is the default**. The value is created and cached by the container which starts resolving.
 *   - `singleton` - The value is created and cached by the container which registered the factory.
 *   - `transient` - The value is created every time it is resolved.
 *
 * `scoped` and `singleton` scopes can have `onRemoved` callback. It is called when a token is removed from the container.
 */
export type FactoryOptions<T> =
  | {
      scope?: 'scoped' | 'singleton';
      onRemoved?: (value: T) => void;
    }
  | {
      scope: 'transient';
    };

/**
 * Dependency container.
 */
export type Container = {
  /**
   * Binds a value for the token
   */
  bindValue<T>(token: Token<T>, value: T): void;

  /**
   * Binds a factory for the token.
   */
  bindFactory<T>(
    token: Token<T>,
    factory: (container: Container) => T,
    options?: FactoryOptions<T>,
  ): void;

  /**
   * Returns a resolved value by the token, or returns `undefined` in case the token is not found.
   */
  get<T>(token: Token<T>): T | undefined;

  /**
   * Returns a resolved value by the token, or throws `ResolverError` in case the token is not found.
   */
  resolve<T>(token: Token<T>): T;

  /**
   * Removes a binding for the token.
   */
  remove<T>(token: Token<T>): void;

  /**
   * Removes all bindings in the container.
   */
  removeAll(): void;
};

/** @internal */
export const CONTAINER: Token<Container> = token('ditox.Container');
/** @internal */
export const PARENT_CONTAINER: Token<Container> = token(
  'ditox.ParentContainer',
);
/** @internal */
export const RESOLVER: Token<Resolver> = token('ditox.Resolver');

/** @internal */
const NOT_FOUND = Symbol();

/** @internal */
const FAKE_FACTORY = () => {
  throw new Error('FAKE_FACTORY');
};

/** @internal */
const DEFAULT_SCOPE: FactoryScope = 'singleton';

/** @internal */
type FactoryContext<T> = {
  factory: (container: Container) => T;
  options?: FactoryOptions<T>;
};

/** @internal */
type ValuesMap = Map<symbol, any>;

/** @internal */
type FactoriesMap = Map<symbol, FactoryContext<any>>;

/** @internal */
type Resolver = <T>(token: Token<T>, origin: Container) => T | typeof NOT_FOUND;

/** @internal */
function getScope<T>(options?: FactoryOptions<T>): FactoryScope {
  return options?.scope ?? DEFAULT_SCOPE;
}

/** @internal */
function getOnRemoved<T>(options: FactoryOptions<T>) {
  return options.scope === undefined ||
    options.scope === 'scoped' ||
    options.scope === 'singleton'
    ? options.onRemoved
    : undefined;
}

/** @internal */
function isInternalToken<T>(token: Token<T>): boolean {
  return (
    token.symbol === CONTAINER.symbol ||
    token.symbol === PARENT_CONTAINER.symbol ||
    token.symbol === RESOLVER.symbol
  );
}

/**
 * Creates a new dependency container.
 *
 * Container can have an optional parent to chain token resolution. The parent is used in case the current container does not have a registered token.
 *
 * @param parentContainer - Optional parent container.
 */
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
      const value = resolver(token, container);
      if (value !== NOT_FOUND) {
        return value;
      }

      if (token.isOptional) {
        return token.optionalValue;
      }

      return undefined;
    },

    resolve<T>(token: Token<T>): T {
      const value = resolver(token, container);
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

  function resolver<T>(
    token: Token<T>,
    origin: Container,
  ): T | typeof NOT_FOUND {
    const value = values.get(token.symbol);
    const hasValue = value !== undefined || values.has(token.symbol);

    if (hasValue && origin === container) {
      return value;
    }

    const factoryContext = factories.get(token.symbol);
    if (factoryContext && factoryContext.factory !== FAKE_FACTORY) {
      const scope = getScope(factoryContext.options);

      switch (scope) {
        case 'singleton': {
          if (hasValue) {
            return value;
          } else {
            // Cache the value in the same container where the factory is registered.
            const value = factoryContext.factory(container);
            container.bindValue(token, value);
            return value;
          }
        }

        case 'scoped': {
          // Create a value within the origin container and cache it.
          const value = factoryContext.factory(origin);
          origin.bindValue(token, value);

          if (origin !== container) {
            // Bind a fake factory with actual options to make onRemoved() works.
            origin.bindFactory(token, FAKE_FACTORY, factoryContext.options);
          }

          return value;
        }

        case 'transient': {
          // Create a value within the origin container and don't cache it.
          return factoryContext.factory(origin);
        }
      }
    }

    if (hasValue) {
      return value;
    }

    const parentResolver = parentContainer?.get(RESOLVER);
    if (parentResolver) {
      return parentResolver(token, origin);
    }

    return NOT_FOUND;
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
