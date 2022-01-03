/**
 * @ignore
 * Binding token for mandatory value
 */
declare type RequiredToken<T> = {
    symbol: symbol;
    type?: T;
    isOptional?: false;
};
/**
 * @ignore
 * Binding token for optional value
 */
declare type OptionalToken<T> = {
    symbol: symbol;
    type?: T;
    isOptional: true;
    optionalValue: T;
};
/**
 * Binding token.
 */
declare type Token<T> = RequiredToken<T> | OptionalToken<T>;
/**
 * Creates a new binding token.
 * @param description - Token description for better error messages.
 */
declare function token<T>(description?: string): Token<T>;
/**
 * Decorate a token with an optional value.
 * This value is be used as default value in case a container does not have registered token.
 * @param token - Existed token.
 * @param optionalValue - Default value for the resolver.
 */
declare function optional<T>(token: Token<T>, optionalValue: T): OptionalToken<T>;
declare function optional<T>(token: Token<T>): OptionalToken<T | undefined>;
/**
 * ResolverError is thrown by the resolver when a token is not found in a container.
 */
declare class ResolverError extends Error {
    constructor(message: string);
}
/**
 * @see https://github.com/mnasyrov/ditox#factory-lifetimes
 */
declare type FactoryScope = 'scoped' | 'singleton' | 'transient';
/**
 * Options for factory binding.
 *
 * `scope` types:
 *   - `singleton` - **This is the default**. The value is created and cached by the container which registered the factory.
 *   - `scoped` - The value is created and cached by the container which starts resolving.
 *   - `transient` - The value is created every time it is resolved.
 *
 * `scoped` and `singleton` scopes can have `onRemoved` callback. It is called when a token is removed from the container.
 */
declare type FactoryOptions<T> = {
    scope?: 'scoped' | 'singleton';
    onRemoved?: (value: T) => void;
} | {
    scope: 'transient';
};
/**
 * Dependency container.
 */
declare type Container = {
    /**
     * Binds a value for the token
     */
    bindValue<T>(token: Token<T>, value: T): void;
    /**
     * Binds a factory for the token.
     */
    bindFactory<T>(token: Token<T>, factory: (container: Container) => T, options?: FactoryOptions<T>): void;
    /**
     * Checks if the token is registered in the container hierarchy.
     */
    hasToken(token: Token<unknown>): boolean;
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
/**
 * Creates a new dependency container.
 *
 * Container can have an optional parent to chain token resolution. The parent is used in case the current container does not have a registered token.
 *
 * @param parentContainer - Optional parent container.
 */
declare function createContainer(parentContainer?: Container): Container;

declare type ValuesProps$1 = {
    [key: string]: unknown;
};
declare type TokenProps$1<Props extends ValuesProps$1> = {
    [K in keyof Props]: Token<Props[K]>;
};
/**
 * Checks if a value is the token
 */
declare function isToken<T>(value: unknown): value is Token<T>;
/**
 * Rebinds the array by the token with added new value.
 * @param container - Dependency container.
 * @param token - Token for an array of values.
 * @param value - New value which is added to the end of the array.
 */
declare function bindMultiValue<T>(container: Container, token: Token<ReadonlyArray<T>>, value: T): void;
/**
 * Tries to resolve a value by the provided token.
 *
 * If an argument is an object which has tokens as its properties,
 * then returns an object containing resolved values as properties.

 * If a token is not found, then `undefined` value is used.
 *
 * @example
 * ```ts
 * const value = tryResolveValue(container, tokenA);
 * console.log(value); // 1
 *
 * const props = tryResolveValue(container, {a: tokenA, b: tokenB});
 * console.log(props); // {a: 1, b: 2}
 * ```
 */
declare function tryResolveValue<Tokens extends Token<unknown> | {
    [key: string]: Token<unknown>;
}, Values extends Tokens extends Token<infer V> ? V | undefined : Tokens extends TokenProps$1<infer Props> ? Partial<Props> : never>(container: Container, token: Tokens): Values;
/**
 * Returns an array of resolved values or objects with resolved values.
 *
 * If an item of the array is an object which has tokens as its properties,
 * then returns an object containing resolved values as properties.

 * If a token is not found, then `undefined` value is used.
 *
 * @example
 * ```ts
 * const items1 = tryResolveValues(container, tokenA);
 * console.log(items1); // [1]
 *
 * const items2 = tryResolveValues(container, tokenA, {a: tokenA, b: tokenB});
 * console.log(items2); // [1, {a: 1, b: 2}]
 * ```
 */
declare function tryResolveValues<Tokens extends (Token<unknown> | {
    [key: string]: Token<unknown>;
})[], Values extends {
    [K in keyof Tokens]: Tokens[K] extends Token<infer V> ? V | undefined : Tokens[K] extends TokenProps$1<infer Props> ? Partial<Props> : never;
}>(container: Container, ...tokens: Tokens): Values;
/**
 * Resolves a value by the provided token.
 *
 * If an argument is an object which has tokens as its properties,
 * then returns an object containing resolved values as properties.

 * If a value is not found by the token, then `ResolverError` is thrown.
 *
 * @example
 * ```ts
 * const value = resolveValue(container, tokenA);
 * console.log(value); // 1
 *
 * const props = resolveValue(container, {a: tokenA, b: tokenB});
 * console.log(props); // {a: 1, b: 2}
 * ```
 */
declare function resolveValue<Tokens extends Token<unknown> | {
    [key: string]: Token<unknown>;
}, Values extends Tokens extends Token<infer V> ? V : Tokens extends TokenProps$1<infer Props> ? Props : never>(container: Container, token: Tokens): Values;
/**
 * Returns an array of resolved values or objects with resolved values.
 *
 * If an item of the array is an object which has tokens as its properties,
 * then returns an object containing resolved values as properties.

 * If a token is not found, then `ResolverError` is thrown.
 *
 * @example
 * ```ts
 * const items1 = resolveValues(container, tokenA);
 * console.log(items1); // [1]
 *
 * const items2 = resolveValues(container, tokenA, {a: tokenA, b: tokenB});
 * console.log(items2); // [1, {a: 1, b: 2}]
 * ```
 */
declare function resolveValues<Tokens extends (Token<unknown> | {
    [key: string]: Token<unknown>;
})[], Values extends {
    [K in keyof Tokens]: Tokens[K] extends Token<infer V> ? V : Tokens[K] extends TokenProps$1<infer Props> ? Props : never;
}>(container: Container, ...tokens: Tokens): Values;
/**
 * Decorates a factory by passing resolved values as factory arguments.
 *
 * If an argument is an object which has tokens as its properties,
 * then returns an object containing resolved values as properties.
 *
 * @param factory - A factory.
 * @param tokens - Tokens which correspond to factory arguments.
 *
 * @return Decorated factory which takes a dependency container as a single argument.
 */
declare function injectable<Tokens extends (Token<unknown> | {
    [key: string]: Token<unknown>;
})[], Values extends {
    [K in keyof Tokens]: Tokens[K] extends Token<infer V> ? V : Tokens[K] extends TokenProps$1<infer Props> ? Props : never;
}, Result>(this: unknown, factory: (...params: Values) => Result, ...tokens: Tokens): (container: Container) => Result;
/**
 * Decorates a class by passing resolved values as arguments to its constructor.
 *
 * If an argument is an object which has tokens as its properties,
 * then returns an object containing resolved values as properties.
 *
 * @param constructor - Constructor of a class
 * @param tokens - Tokens which correspond to constructor arguments
 *
 * @return A factory function which takes a dependency container as a single argument
 * and returns a new created class.
 */
declare function injectableClass<Tokens extends (Token<unknown> | {
    [key: string]: Token<unknown>;
})[], Values extends {
    [K in keyof Tokens]: Tokens[K] extends Token<infer V> ? V : Tokens[K] extends TokenProps$1<infer Props> ? Props : never;
}, Result>(this: unknown, constructor: new (...params: Values) => Result, ...tokens: Tokens): (container: Container) => Result;

declare type ValuesProps = {
    [key: string]: unknown;
};
declare type TokenProps<Props extends ValuesProps> = {
    [K in keyof Props]: Token<Props[K]>;
};
/**
 * Returns an array of resolved values by the specified token.
 * If a token is not found, then `undefined` value is used.
 *
 * @deprecated Use `tryResolveValues()` function.
 */
declare function getValues<Tokens extends Token<unknown>[], Values extends {
    [K in keyof Tokens]: Tokens[K] extends Token<infer V> ? V : never;
}>(container: Container, ...tokens: Tokens): Values;
/**
 * Returns an object with resolved properties which are specified by token properties.
 * If a token is not found, then `undefined` value is used.
 *
 * @deprecated Use `tryResolveValue()` function.
 *
 * @example
 * ```ts
 * const props = getProps(container, {a: tokenA, b: tokenB});
 * console.log(props); // {a: 1, b: 2}
 * ```
 */
declare function getProps<Props extends ValuesProps>(container: Container, tokens: TokenProps<Props>): Partial<Props>;
/**
 * Returns an object with resolved properties which are specified by token properties.
 * If a token is not found, then `ResolverError` is thrown.
 *
 * @deprecated Use `resolveValue()` function.
 *
 * @example
 * ```ts
 * const props = resolveProps(container, {a: tokenA, b: tokenB});
 * console.log(props); // {a: 1, b: 2}
 * ```
 */
declare function resolveProps<Props extends ValuesProps>(container: Container, tokens: TokenProps<Props>): Props;
/**
 * Decorates a factory by passing a resolved object with tokens as the first argument.
 * @param factory - A factory.
 * @param tokens - Object with tokens.
 * @return Decorated factory which takes a dependency container as a single argument.
 *
 * @deprecated Use `injectable()` function.
 *
 * @example
 * ```ts
 * const factory = ({a, b}: {a: number, b: number}) => a + b;
 * const decoratedFactory = injectableProps(factory, {a: tokenA, b: tokenB});
 * const result = decoratedFactory(container);
 * ```
 */
declare function injectableProps<Props extends ValuesProps, Result>(factory: (props: Props) => Result, tokens: TokenProps<Props>): (container: Container) => Result;

declare type AnyObject = Record<string, any>;
declare type EmptyObject = Record<string, never>;
declare type ModuleController = {
    /** Dispose the module and clean its resources */
    destroy?: () => void;
};
/**
 * Dependency module
 *
 * @example
 * ```ts
 * type LoggerModule = Module<{
 *   logger: Logger;
 * }>;
 * ```
 */
declare type Module<ModuleProps extends AnyObject = EmptyObject> = ModuleController & ModuleProps;
declare type GetModuleProps<T> = T extends Module<infer Props> ? Props : never;
/**
 * Description how to bind the module in declarative way.
 *
 * @example
 * ```ts
 * const LOGGER_MODULE: ModuleDeclaration<LoggerModule> = {
 *   token: LOGGER_MODULE_TOKEN,
 *   factory: (container) => {
 *     const transport = container.resolve(TRANSPORT_TOKEN).open();
 *     return {
 *       logger: { log: (message) => transport.write(message) },
 *       destroy: () => transport.close(),
 *     }
 *   },
 *   exports: {
 *     logger: LOGGER_TOKEN,
 *   },
 * };
 * ```
 */
declare type ModuleDeclaration<T extends Module<AnyObject>> = {
    /** Token for the module */
    token: Token<T>;
    /** Modules for binding  */
    imports?: ReadonlyArray<ModuleBindingEntry>;
    /** Factory of the module */
    factory: (container: Container) => T;
    /** Dictionary of module properties which are bound to tokens. */
    exports?: {
        [K in keyof GetModuleProps<T>]?: Token<GetModuleProps<T>[K]>;
    };
    /**
     * Dictionary of module properties which are bound to tokens.
     *
     * @deprecated Use `exports` property.
     */
    exportedProps?: ModuleDeclaration<T>['exports'];
    /** Callback could be used to prepare an environment. It is called before binding the module. */
    beforeBinding?: (container: Container) => void;
    /** Callback could be used to export complex dependencies from the module. It is called after binding the module.  */
    afterBinding?: (container: Container) => void;
};
/**
 * Options for module binding.
 *
 * `scope` types:
 *   - `singleton` - **This is the default**. The module is created and cached by the container which registered the factory.
 *   - `scoped` - The module is created and cached by the container which starts resolving.
 */
declare type BindModuleOptions = {
    scope?: 'scoped' | 'singleton';
};
declare type ModuleBindingEntry = ModuleDeclaration<AnyObject> | {
    module: ModuleDeclaration<AnyObject>;
    options: BindModuleOptions;
};
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
declare function bindModule<T extends Module<AnyObject>>(container: Container, moduleDeclaration: ModuleDeclaration<T>, options?: BindModuleOptions): void;
/**
 * Binds dependency modules to the container
 *
 * @param container - Dependency container for binding
 * @param modules - Array of module binding entries: module declaration or `{module: ModuleDeclaration, options: BindModuleOptions}` objects.
 */
declare function bindModules(container: Container, modules: ReadonlyArray<ModuleBindingEntry>): void;
/**
 * Declares a module binding
 *
 * @param declaration - a module declaration
 * @param declaration.token - optional field
 *
 *  @example
 * ```ts
 * const LOGGER_MODULE = declareModule<LoggerModule>({
 *   factory: (container) => {
 *     const transport = container.resolve(TRANSPORT_TOKEN).open();
 *     return {
 *       logger: { log: (message) => transport.write(message) },
 *       destroy: () => transport.close(),
 *     }
 *   },
 *   exports: {
 *     logger: LOGGER_TOKEN,
 *   },
 * });
 * ```
 */
declare function declareModule<T>(declaration: Omit<ModuleDeclaration<T>, 'token'> & Partial<Pick<ModuleDeclaration<T>, 'token'>>): ModuleDeclaration<T>;
/**
 * Declares bindings of several modules
 *
 * @param modules - module declaration entries
 */
declare function declareModuleBindings(modules: ReadonlyArray<ModuleBindingEntry>): ModuleDeclaration<Module>;

export { BindModuleOptions, Container, FactoryOptions, FactoryScope, Module, ModuleBindingEntry, ModuleDeclaration, OptionalToken, RequiredToken, ResolverError, Token, bindModule, bindModules, bindMultiValue, createContainer, declareModule, declareModuleBindings, getProps, getValues, injectable, injectableClass, injectableProps, isToken, optional, resolveProps, resolveValue, resolveValues, token, tryResolveValue, tryResolveValues };
