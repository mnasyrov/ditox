export type RequiredToken<T> = {
  symbol: symbol;
  type?: T; // Anchor for Typescript type inference.
};

export type OptionalToken<T> = {
  symbol: symbol;
  type?: T; // Anchor for Typescript type inference.
  isOptional: true;
  optionalValue: T;
};

export type Token<T> = RequiredToken<T> | OptionalToken<T>;

export function token<T>(description: string): Token<T> {
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

export type FactoryOptions<T> =
  | {
      scope?: 'singleton';
      onUnbind?: (value: T) => void;
    }
  | {
      scope: 'transient';
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
