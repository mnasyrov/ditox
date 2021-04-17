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
 *   - `scoped` - **This is the default**. The value is created and cached by the container which starts resolving.
 *   - `singleton` - The value is created and cached by the container which registered the factory.
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

declare type ValuesProps = {
    [key: string]: unknown;
};
declare type TokenProps<Props extends ValuesProps> = {
    [K in keyof Props]: Token<Props[K]>;
};
/**
 * Rebinds the array by the token with added new value.
 * @param container - Dependency container.
 * @param token - Token for an array of values.
 * @param value - New value which is added to the end of the array.
 */
declare function bindMultiValue<T>(container: Container, token: Token<Array<T>>, value: T): void;
/**
 * Returns an array of resolved values by the specified token.
 * If a token is not found, then `undefined` value is used.
 */
declare function getValues<Tokens extends Token<unknown>[], Values extends {
    [K in keyof Tokens]: Tokens[K] extends Token<infer V> ? V : never;
}>(container: Container, ...tokens: Tokens): Values;
/**
 * Returns an array of resolved values by the specified token.
 * If a token is not found, then `ResolverError` is thrown.
 */
declare function resolveValues<Tokens extends Token<unknown>[], Values extends {
    [K in keyof Tokens]: Tokens[K] extends Token<infer V> ? V : never;
}>(container: Container, ...tokens: Tokens): Values;
/**
 * Decorates a factory by passing resolved tokens as factory arguments.
 * @param factory - A factory.
 * @param tokens - Tokens which correspond to factory arguments.
 * @return Decorated factory which takes a dependency container as a single argument.
 */
declare function injectable<Tokens extends Token<unknown>[], Values extends {
    [K in keyof Tokens]: Tokens[K] extends Token<infer V> ? V : never;
}, Result>(this: unknown, factory: (...params: Values) => Result, ...tokens: Tokens): (container: Container) => Result;
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
declare function getProps<Props extends ValuesProps>(container: Container, tokens: TokenProps<Props>): Partial<Props>;
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
declare function resolveProps<Props extends ValuesProps>(container: Container, tokens: TokenProps<Props>): Props;
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
declare function injectableProps<Props extends ValuesProps, Result>(factory: (props: Props) => Result, tokens: TokenProps<Props>): (container: Container) => Result;

export { Container, FactoryOptions, FactoryScope, OptionalToken, RequiredToken, ResolverError, Token, bindMultiValue, createContainer, getProps, getValues, injectable, injectableProps, optional, resolveProps, resolveValues, token };
