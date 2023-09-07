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
 * Binding token
 */
export type Token<T> = RequiredToken<T> | OptionalToken<T>;

/**
 * Token options
 */
export type TokenOptions =
  | {
      /**
       * Key for token's symbol. It allows to create shareable tokens.
       */
      key: string;

      /** @ignore */
      description?: undefined;
    }
  | {
      /** Description for better error messages */
      description?: string;

      /** @ignore */
      key?: undefined;
    };

/**
 * Creates a new binding token.
 * @param description - Token description for better error messages.
 */
export function token<T>(description?: string): Token<T>;
/**
 * Creates a new binding token.
 * @param options - Token description for better error messages.
 */ export function token<T>(options?: TokenOptions): Token<T>;
export function token<T>(options?: TokenOptions | string): Token<T> {
  const normalized: TokenOptions | undefined =
    typeof options === 'string' ? {description: options} : options;

  const symbol: symbol = normalized?.key
    ? Symbol.for(normalized.key)
    : Symbol(normalized?.description);

  return {symbol};
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
