export type Token<T> = {
  symbol: symbol;
  type?: T; // Anchor for Typescript type inference.
};

export type OptionalToken<T> = {
  symbol: symbol;
  type?: T; // Anchor for Typescript type inference.
  isOptional: true;
  optionalValue: T;
};

export type TokenLike<T> = Token<T> | OptionalToken<T>;

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

  get<T>(token: Token<T> | OptionalToken<T>): T | undefined;
  resolve<T>(token: Token<T> | OptionalToken<T>): T;
};

export function createToken<T>(key: string): Token<T> {
  return {symbol: Symbol(key)};
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

export const CONTAINER: Token<Container> = createToken('Ditox.Container');
export const PARENT_CONTAINER: Token<Container> = createToken(
  'Ditox.ParentContainer',
);

export class ResolverError extends Error {
  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = 'ResolverError';
  }
}
