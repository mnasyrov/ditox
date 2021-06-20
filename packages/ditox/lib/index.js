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
const FAKE_FACTORY = () => {
    throw new Error('FAKE_FACTORY');
};
/** @internal */
const DEFAULT_SCOPE = 'singleton';
/** @internal */
const FACTORIES_MAP = token('ditox.FactoriesMap');
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
        hasToken(token) {
            var _a;
            return (values.has(token.symbol) ||
                factories.has(token.symbol) ||
                ((_a = parentContainer === null || parentContainer === void 0 ? void 0 : parentContainer.hasToken(token)) !== null && _a !== void 0 ? _a : false));
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
        if (factoryContext && factoryContext.factory !== FAKE_FACTORY) {
            const scope = getScope(factoryContext.options);
            switch (scope) {
                case 'singleton': {
                    if (hasValue) {
                        return value;
                    }
                    else if (parentContainer === null || parentContainer === void 0 ? void 0 : parentContainer.hasToken(token)) {
                        break;
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
        values.set(FACTORIES_MAP.symbol, factories);
        if (parentContainer) {
            values.set(PARENT_CONTAINER.symbol, parentContainer);
        }
    }
    bindInternalTokens();
    return container;
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
/**
 * Decorates a factory by passing resolved tokens as factory arguments.
 * @param factory - A factory.
 * @param tokens - Tokens which correspond to factory arguments.
 * @return Decorated factory which takes a dependency container as a single argument.
 */
function injectable(factory, ...tokens) {
    return (container) => {
        const values = resolveValues(container, ...tokens);
        return factory.apply(this, values);
    };
}
/**
 * Returns an object with resolved properties which are specified by token properties.
 * If a token is not found, then `undefined` value is used.
 *
 * @example
 * ```ts
 * const props = getProps(container, {a: tokenA, b: tokenB});
 * console.log(props); // {a: 1, b: 2}
 * ```
 */
function getProps(container, tokens) {
    const obj = { ...tokens };
    Object.keys(obj).forEach((key) => (obj[key] = container.get(obj[key])));
    return obj;
}
/**
 * Returns an object with resolved properties which are specified by token properties.
 * If a token is not found, then `ResolverError` is thrown.
 *
 * @example
 * ```ts
 * const props = resolveProps(container, {a: tokenA, b: tokenB});
 * console.log(props); // {a: 1, b: 2}
 * ```
 */
function resolveProps(container, tokens) {
    const obj = { ...tokens };
    Object.keys(obj).forEach((key) => (obj[key] = container.resolve(obj[key])));
    return obj;
}
/**
 * Decorates a factory by passing a resolved object with tokens as the first argument.
 * @param factory - A factory.
 * @param tokens - Object with tokens.
 * @return Decorated factory which takes a dependency container as a single argument.
 *
 * @example
 * ```ts
 * const factory = ({a, b}: {a: number, b: number}) => a + b;
 * const decoratedFactory = injectableProps(factory, {a: tokenA, b: tokenB});
 * const result = decoratedFactory(container);
 * ```
 */
function injectableProps(factory, tokens) {
    return (container) => {
        const values = resolveProps(container, tokens);
        return factory(values);
    };
}

/**
 * Binds the dependency module to the container
 * @param container - Dependency container.
 * @param moduleDeclaration - Declaration of the dependency module.
 * @param options - Options for module binding.
 *
 * @example
 * ```ts
 * bindModule(container, LOGGER_MODULE);
 * ```
 */
function bindModule(container, moduleDeclaration, options) {
    const { token, factory, exportedProps, beforeBinding, afterBinding, } = moduleDeclaration;
    const scope = options === null || options === void 0 ? void 0 : options.scope;
    if (beforeBinding) {
        beforeBinding(container);
    }
    const exportedValueTokens = new Set();
    if (exportedProps) {
        const keys = Object.keys(exportedProps);
        keys.forEach((valueKey) => {
            const valueToken = exportedProps[valueKey];
            if (valueToken) {
                exportedValueTokens.add(valueToken);
                container.bindFactory(valueToken, injectable((module) => module[valueKey], token), { scope });
            }
        });
    }
    container.bindFactory(token, factory, {
        scope,
        onRemoved: (module) => {
            if (module.destroy) {
                module.destroy();
            }
            exportedValueTokens.forEach((valueToken) => container.remove(valueToken));
            exportedValueTokens.clear();
        },
    });
    if (afterBinding) {
        afterBinding(container);
    }
}

export { ResolverError, bindModule, bindMultiValue, createContainer, getProps, getValues, injectable, injectableProps, optional, resolveProps, resolveValues, token };
//# sourceMappingURL=index.js.map
