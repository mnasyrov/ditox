import { Token, token } from './tokens';

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
 * Thrown after container or module cleanup when multiple cleanup operations fail.
 * A single failure is rethrown unchanged instead.
 * Nested CleanupError instances are preserved in errors, not flattened.
 */
export class CleanupError extends Error {
  readonly errors: ReadonlyArray<unknown>;

  constructor(errors: ReadonlyArray<unknown>) {
    super('Multiple onRemoved callbacks failed');
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = 'CleanupError';
    this.errors = [...errors];
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
 *   - `singleton` - **This is the default**. The value is created and cached by the most distant parent container which owns the factory function.
 *   - `scoped` - The value is created and cached by the nearest container which owns the factory function.
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
   * Checks if the token is registered in the container hierarchy.
   */
  hasToken(token: Token<unknown>): boolean;

  /**
   * Returns a resolved value by the token, or returns `undefined` in case the token is not found.
   */
  get<T>(token: Token<T>): T | undefined;

  /**
   * Returns a resolved value by the token or throws `ResolverError` in case the token is not found.
   */
  resolve<T>(token: Token<T>): T;

  /**
   * Removes a binding for the token.
   * The binding is removed even if onRemoved throws; its error is rethrown unchanged.
   * Reentrant removal of the same cached value record has no effect.
   * New bindings created by the callback are preserved, including the factory
   * associated with a replacement cached value.
   */
  remove<T>(token: Token<T>): void;

  /**
   * Removes all bindings in the container.
   * Runs all eligible onRemoved callbacks before clearing bindings, even if callbacks throw.
   * Rethrows a single failure unchanged, or throws CleanupError for multiple failures.
   * A nested removeAll() during this operation has no effect.
   * New cached value records created by callbacks are visited in subsequent passes.
   */
  removeAll(): void;
};

/**
 * A subset of Container interface that provides read-only access to dependency resolution.
 * This type is used for parent containers to allow token resolution without exposing mutation methods.
 */
export type ContainerResolver = Pick<Container, 'hasToken' | 'get' | 'resolve'>;

/** @internal */
export const CONTAINER: Token<Container> = token('ditox.Container');
/** @internal */
export const PARENT_CONTAINERS: Token<ReadonlyArray<Container>> = token(
  'ditox.ParentContainer',
);
/** @internal */
export const RESOLVER: Token<Resolver> = token('ditox.Resolver');

/** @internal */
const NOT_FOUND = Symbol();

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
export type FactoriesMap = Map<symbol, FactoryContext<any>>;

/** @internal */
export const FACTORIES_MAP: Token<FactoriesMap> = token('ditox.FactoriesMap');

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
    token.symbol === PARENT_CONTAINERS.symbol ||
    token.symbol === RESOLVER.symbol
  );
}

/**
 * Creates a new dependency container.
 *
 * Container can have an optional parent to chain token resolution. The parent is used in case the current container does not have a registered token.
 *
 * @param parentArg - Optional parent container or an array of containers.
 */
export function createContainer(
  parentArg?: ContainerResolver | ReadonlyArray<ContainerResolver>,
): Container {
  const parents: ReadonlyArray<ContainerResolver> | undefined = parentArg
    ? Array.isArray(parentArg)
      ? [...parentArg]
      : [parentArg]
    : undefined;

  const values: ValuesMap = new Map<symbol, any>();
  const factories: FactoriesMap = new Map<symbol, FactoryContext<any>>();
  // Identity belongs to each cache write, even for undefined or the same value.
  // Replacing a factory alone must not dispose the same cached record twice.
  const valueRecords = new Map<symbol, object>();
  const activeRemovals = new Set<object>();
  let bulkRemovals: Set<object> | undefined;
  let failedLookups: Map<FactoryContext<any>, Set<object>> | undefined;
  let failedLookupCount = 0;
  let bindingRevision = 0;

  const container: Container = {
    bindValue<T>(token: Token<T>, value: T): void {
      if (isInternalToken(token)) {
        return;
      }

      values.set(token.symbol, value);
      valueRecords.set(token.symbol, {});
      bindingRevision++;
    },

    bindFactory<T>(
      token: Token<T>,
      factory: (container: Container) => T,
      options?: FactoryOptions<T>,
    ): void {
      if (isInternalToken(token)) {
        return;
      }

      factories.set(token.symbol, { factory, options });
      bindingRevision++;
    },

    remove<T>(token: Token<T>): void {
      const record = valueRecords.get(token.symbol);
      if (isInternalToken(token) || (record && activeRemovals.has(record))) {
        return;
      }

      const context = factories.get(token.symbol);
      try {
        if (context?.options) {
          executeOnRemoved(token.symbol, context);
        }
      } finally {
        const currentRecord = valueRecords.get(token.symbol);
        if (currentRecord === record) {
          values.delete(token.symbol);
          valueRecords.delete(token.symbol);
        }
        // A replacement value still needs its factory for subsequent teardown.
        if (
          factories.get(token.symbol) === context &&
          (currentRecord === record || currentRecord === undefined)
        ) {
          factories.delete(token.symbol);
        }
      }
    },

    removeAll(): void {
      if (bulkRemovals) return;
      bulkRemovals = new Set();
      failedLookups = new Map();
      failedLookupCount = 0;
      const errors: unknown[] = [];
      try {
        let progress: boolean;
        do {
          // A callback can replace or resolve a value at an already visited key.
          // Failed lookups also count as progress, but each context/record pair
          // is attempted only once so later passes cannot duplicate its error.
          const previousSize = bulkRemovals.size + failedLookupCount;
          const previousRevision = bindingRevision;
          factories.forEach((context, tokenSymbol) => {
            try {
              if (context.options) executeOnRemoved(tokenSymbol, context);
            } catch (error) {
              errors.push(error);
            }
          });
          // An accessor can create a resource without returning a callback.
          progress =
            bulkRemovals.size + failedLookupCount > previousSize ||
            bindingRevision !== previousRevision;
        } while (progress);
      } finally {
        values.clear();
        valueRecords.clear();
        factories.clear();
        bindInternalTokens();
        bulkRemovals = undefined;
        failedLookups = undefined;
      }
      throwCleanupErrors(errors);
    },

    hasToken(token: Token<unknown>): boolean {
      return (
        values.has(token.symbol) ||
        factories.has(token.symbol) ||
        parentContainersHaveToken(parents, token)
      );
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
    if (factoryContext) {
      const scope = getScope(factoryContext.options);

      switch (scope) {
        case 'singleton': {
          if (hasValue) {
            return value;
          } else if (parentContainersHaveToken(parents, token)) {
            break;
          } else {
            // Cache the value in the same container where the factory is registered.
            const value = factoryContext.factory(container);
            container.bindValue(token, value);
            return value;
          }
        }

        case 'scoped': {
          if (hasValue) {
            return value;
          } else {
            // Create a value within the factory's container and cache it.
            const value = factoryContext.factory(container);
            container.bindValue(token, value);
            return value;
          }
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

    if (parents) {
      return parentContainersResolveToken(parents, token, origin);
    }

    return NOT_FOUND;
  }

  function executeOnRemoved<T>(
    tokenSymbol: symbol,
    context: FactoryContext<T>,
  ) {
    const record = valueRecords.get(tokenSymbol);
    if (
      !record ||
      activeRemovals.has(record) ||
      bulkRemovals?.has(record) ||
      failedLookups?.get(context)?.has(record)
    ) {
      return;
    }
    const value = values.get(tokenSymbol);
    // Options may have accessors which reenter removal or change the bindings.
    activeRemovals.add(record);
    try {
      let onRemoved: ((value: T) => void) | undefined;
      try {
        onRemoved = context.options ? getOnRemoved(context.options) : undefined;
      } catch (error) {
        if (failedLookups) {
          let records = failedLookups.get(context);
          if (!records) {
            records = new Set();
            failedLookups.set(context, records);
          }
          records.add(record);
          failedLookupCount++;
        }
        throw error;
      }
      if (!onRemoved) return;
      bulkRemovals?.add(record);
      onRemoved(value);
    } finally {
      activeRemovals.delete(record);
    }
  }

  function bindInternalTokens() {
    values.set(CONTAINER.symbol, container);
    values.set(RESOLVER.symbol, resolver);
    values.set(FACTORIES_MAP.symbol, factories);

    if (parents) {
      values.set(PARENT_CONTAINERS.symbol, parents);
    }
  }

  bindInternalTokens();
  return container;
}

function parentContainersHaveToken<T>(
  parents: ReadonlyArray<ContainerResolver> | undefined,
  token: Token<T>,
): boolean {
  if (!parents) return false;

  for (let i = 0; i < parents.length; i++) {
    if (parents[i].hasToken(token)) {
      return true;
    }
  }

  return false;
}

function parentContainersResolveToken<T>(
  parents: ReadonlyArray<ContainerResolver>,
  token: Token<T>,
  origin: Container,
): T | typeof NOT_FOUND {
  for (const parentContainer of parents) {
    const parentResolver = parentContainer.get(RESOLVER);
    if (parentResolver) {
      const resolved = parentResolver(token, origin);
      if (resolved !== NOT_FOUND) {
        return resolved;
      }
    }
  }

  return NOT_FOUND;
}

/** @internal */
export function throwCleanupErrors(errors: ReadonlyArray<unknown>): void {
  if (errors.length === 1) throw errors[0];
  if (errors.length > 1) throw new CleanupError(errors);
}
