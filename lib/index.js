/**
 * Creates a new binding token.
 * @param description - Token description for better error messages.
 */
function token(description) {
    return { symbol: Symbol(description) };
}
function optional(token, optionalValue) {
    return {
        symbol: token.symbol,
        isOptional: true,
        optionalValue,
    };
}
/**
 * ResolverError is thrown by the resolver when a token is not found in a container.
 */
class ResolverError extends Error {
    constructor(message) {
        super(message);
        Object.setPrototypeOf(this, new.target.prototype);
        this.name = 'ResolverError';
    }
}
/** @internal */
const CONTAINER = token('ditox.Container');
/** @internal */
const PARENT_CONTAINER = token('ditox.ParentContainer');
/** @internal */
const RESOLVER = token('ditox.Resolver');
/** @internal */
const NOT_FOUND = Symbol();
/** @internal */
const DEFAULT_SCOPE = 'singleton';
/** @internal */
function getScope(options) {
    var _a;
    return (_a = options === null || options === void 0 ? void 0 : options.scope) !== null && _a !== void 0 ? _a : DEFAULT_SCOPE;
}
/** @internal */
function getOnRemoved(options) {
    return options.scope === undefined ||
        options.scope === 'scoped' ||
        options.scope === 'singleton'
        ? options.onRemoved
        : undefined;
}
/** @internal */
function isInternalToken(token) {
    return (token.symbol === CONTAINER.symbol ||
        token.symbol === PARENT_CONTAINER.symbol ||
        token.symbol === RESOLVER.symbol);
}
/**
 * Creates a new dependency container.
 *
 * Container can have an optional parent to chain token resolution. The parent is used in case the current container does not have a registered token.
 *
 * @param parentContainer - Optional parent container.
 */
function createContainer(parentContainer) {
    const values = new Map();
    const factories = new Map();
    const container = {
        bindValue(token, value) {
            if (isInternalToken(token)) {
                return;
            }
            values.set(token.symbol, value);
        },
        bindFactory(token, factory, options) {
            if (isInternalToken(token)) {
                return;
            }
            factories.set(token.symbol, { factory, options });
        },
        remove(token) {
            var _a;
            if (isInternalToken(token)) {
                return;
            }
            const options = (_a = factories.get(token.symbol)) === null || _a === void 0 ? void 0 : _a.options;
            if (options) {
                executeOnRemoved(token.symbol, options);
            }
            values.delete(token.symbol);
            factories.delete(token.symbol);
        },
        removeAll() {
            factories.forEach((context, tokenSymbol) => {
                if (context.options) {
                    executeOnRemoved(tokenSymbol, context.options);
                }
            });
            values.clear();
            factories.clear();
            bindInternalTokens();
        },
        get(token) {
            const value = resolver(token, container);
            if (value !== NOT_FOUND) {
                return value;
            }
            if (token.isOptional) {
                return token.optionalValue;
            }
            return undefined;
        },
        resolve(token) {
            var _a;
            const value = resolver(token, container);
            if (value !== NOT_FOUND) {
                return value;
            }
            if (token.isOptional) {
                return token.optionalValue;
            }
            throw new ResolverError(`Token "${(_a = token.symbol.description) !== null && _a !== void 0 ? _a : ''}" is not provided`);
        },
    };
    function resolver(token, origin) {
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
                    }
                    else {
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
        const parentResolver = parentContainer === null || parentContainer === void 0 ? void 0 : parentContainer.get(RESOLVER);
        if (parentResolver) {
            return parentResolver(token, origin);
        }
        return NOT_FOUND;
    }
    function executeOnRemoved(tokenSymbol, options) {
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

/**
 * Decorates a factory by passing resolved tokens as factory arguments.
 * @param factory - A factory.
 * @param tokens - Tokens which correspond to factory arguments.
 * @return Decorated factory which takes a dependency container as a single argument.
 */
function injectable(factory, ...tokens) {
    return (container) => {
        const values = tokens.map(container.resolve);
        return factory(...values);
    };
}
/**
 * Rebinds the array by the token with added new value.
 * @param container - Dependency container.
 * @param token - Token for an array of values.
 * @param value - New value which is added to the end of the array.
 */
function bindMultiValue(container, token, value) {
    var _a;
    const prevValues = (_a = container.get(token)) !== null && _a !== void 0 ? _a : [];
    const nextValues = [...prevValues, value];
    container.bindValue(token, nextValues);
}
/**
 * Returns an array of resolved values by the specified token.
 * If a token is not found, then `undefined` value is used.
 */
function getValues(container, ...tokens) {
    return tokens.map(container.get);
}
/**
 * Returns an array of resolved values by the specified token.
 * If a token is not found, then `ResolverError` is thrown.
 */
function resolveValues(container, ...tokens) {
    return tokens.map(container.resolve);
}

export { ResolverError, bindMultiValue, createContainer, getValues, injectable, optional, resolveValues, token };
//# sourceMappingURL=index.js.map
