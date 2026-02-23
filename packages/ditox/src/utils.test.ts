import { describe, expect, it } from 'vitest';
import { createContainer, ResolverError } from './container';
import { optional, token } from './tokens';
import {
  bindMultiValue,
  injectable,
  injectableClass,
  resolveValue,
  resolveValues,
  tryResolveValue,
  tryResolveValues,
} from './utils';

const NUMBER = token<number>('number');
const STRING = token<string>('string');

describe('bindMultiValue()', () => {
  const NUMBERS = token<Array<number>>('numbers');

  it('should append a value to an array declared by a token', () => {
    const container = createContainer();

    bindMultiValue(container, NUMBERS, 1);
    bindMultiValue(container, NUMBERS, 2);

    const values: Array<number> = container.resolve(NUMBERS);
    expect(values).toEqual([1, 2]);
  });

  it('should append new values to an array declared by a token', () => {
    const container = createContainer();

    bindMultiValue(container, NUMBERS, 1);
    bindMultiValue(container, NUMBERS, 2);
    expect(container.resolve(NUMBERS)).toEqual([1, 2]);

    bindMultiValue(container, NUMBERS, 3);
    bindMultiValue(container, NUMBERS, 4);
    expect(container.resolve(NUMBERS)).toEqual([1, 2, 3, 4]);
  });

  it('should add new values to a copy of array from the parent container', () => {
    const parent = createContainer();
    parent.bindValue(NUMBERS, [1, 2]);
    const container = createContainer(parent);

    bindMultiValue(container, NUMBERS, 3);
    bindMultiValue(container, NUMBERS, 4);
    expect(parent.resolve(NUMBERS)).toEqual([1, 2]);
    expect(container.resolve(NUMBERS)).toEqual([1, 2, 3, 4]);

    container.remove(NUMBERS);
    expect(parent.resolve(NUMBERS)).toEqual([1, 2]);
    expect(container.resolve(NUMBERS)).toEqual([1, 2]);
  });
});

describe('tryResolveValue()', () => {
  it('should return an object with values by the tokens', () => {
    const container = createContainer();
    container.bindValue(NUMBER, 1);
    container.bindValue(STRING, 'abc');

    const props: { a: number; b: string } = tryResolveValue(container, {
      a: NUMBER,
      b: STRING,
    });
    expect(props).toEqual({ a: 1, b: 'abc' });
  });

  it('should return "undefined" item in case a value is not provided', () => {
    const container = createContainer();
    container.bindValue(NUMBER, 1);

    const props = tryResolveValue(container, { a: NUMBER, b: STRING });
    expect(props).toEqual({ a: 1, b: undefined });
  });

  it('should return values of optional tokens in case they are not provided', () => {
    const container = createContainer();
    container.bindValue(NUMBER, 1);

    const OPTIONAL_STRING = optional(STRING, 'value');

    const props = tryResolveValue(container, {
      a: NUMBER,
      b: STRING,
      c: OPTIONAL_STRING,
    });
    expect(props).toEqual({ a: 1, b: undefined, c: 'value' });
  });
});

describe('tryResolveValues()', () => {
  it('should return values for the tokens', () => {
    const container = createContainer();
    container.bindValue(NUMBER, 1);
    container.bindValue(STRING, 'abc');

    const values: [number, string] = tryResolveValues(
      container,
      NUMBER,
      STRING,
    );
    expect(values).toEqual([1, 'abc']);
  });

  it('should return "undefined" item in case a value is not provided', () => {
    const container = createContainer();
    container.bindValue(NUMBER, 1);

    const values = tryResolveValues(container, NUMBER, STRING);
    expect(values).toEqual([1, undefined]);
  });

  it('should return values of optional tokens in case they are not provided', () => {
    const container = createContainer();
    container.bindValue(NUMBER, 1);

    const OPTIONAL_STRING = optional(STRING, 'value');

    const values = tryResolveValues(container, NUMBER, STRING, OPTIONAL_STRING);
    expect(values).toEqual([1, undefined, 'value']);
  });

  it('should works with a big arity', () => {
    const container = createContainer();
    container.bindValue(NUMBER, 1);

    const values = tryResolveValues(
      container,
      NUMBER,
      NUMBER,
      NUMBER,
      NUMBER,
      NUMBER,
      NUMBER,
      NUMBER,
      NUMBER,
      NUMBER,
      NUMBER,
    );
    expect(values).toEqual([1, 1, 1, 1, 1, 1, 1, 1, 1, 1]);
  });
});

describe('resolveValue()', () => {
  it('should an object with resolved values from the container for the specified token props', () => {
    const container = createContainer();
    container.bindValue(NUMBER, 1);
    container.bindValue(STRING, 'abc');

    const props: { a: number; b: string } = resolveValue(container, {
      a: NUMBER,
      b: STRING,
    });
    expect(props).toEqual({ a: 1, b: 'abc' });
  });

  it('should throw an error in case a value is not provided', () => {
    const container = createContainer();
    container.bindValue(NUMBER, 1);

    expect(() => {
      resolveValue(container, { a: NUMBER, b: STRING });
    }).toThrowError(
      new ResolverError(`Token "${STRING.symbol.description}" is not provided`),
    );
  });

  it('should resolve values of optional tokens in case they are not provided', () => {
    const container = createContainer();
    container.bindValue(NUMBER, 1);

    const props = resolveValue(container, {
      a: NUMBER,
      b: optional(STRING, 'value'),
    });
    expect(props).toEqual({ a: 1, b: 'value' });
  });
});

describe('resolveValues()', () => {
  it('should resolve tokens from the container', () => {
    const container = createContainer();
    container.bindValue(NUMBER, 1);
    container.bindValue(STRING, 'abc');

    const values: [number, string] = resolveValues(container, NUMBER, STRING);
    expect(values).toEqual([1, 'abc']);
  });

  it('should throw an error in case a value is not provided', () => {
    const container = createContainer();
    container.bindValue(NUMBER, 1);

    expect(() => {
      resolveValues(container, NUMBER, STRING);
    }).toThrowError(
      new ResolverError(`Token "${STRING.symbol.description}" is not provided`),
    );
  });

  it('should resolve values of optional tokens in case they are not provided', () => {
    const container = createContainer();
    container.bindValue(NUMBER, 1);

    const values = resolveValues(container, NUMBER, optional(STRING, 'value'));
    expect(values).toEqual([1, 'value']);
  });

  it('should resolve a dictionary of tokens', () => {
    const container = createContainer();
    container.bindValue(NUMBER, 1);

    const values = resolveValue(container, {
      a: NUMBER,
      b: optional(STRING, 'value'),
    });
    expect(values).toEqual({
      a: 1,
      b: 'value',
    });
  });
});

describe('injectable()', () => {
  function join({ a, b }: { a: number; b: string }): string {
    return `${a}/${b}`;
  }

  it('should inject values from Container as arguments of the factory', () => {
    const container = createContainer();
    container.bindValue(NUMBER, 1);
    container.bindValue(STRING, '2');

    const decoratedFactory = injectable(
      (a: number, b: string) => a + b,
      NUMBER,
      STRING,
    );

    expect(decoratedFactory(container)).toBe('12');
  });

  it('should throw ResolverError error in case a value is not provided', () => {
    const container = createContainer();
    container.bindValue(NUMBER, 1);

    const decoratedFactory = injectable(
      (a: number, b: string) => a + b,
      NUMBER,
      STRING,
    );

    expect(() => decoratedFactory(container)).toThrowError(
      new ResolverError(`Token "${STRING.symbol.description}" is not provided`),
    );
  });

  it('should inject values of optional tokens in case values are not provided', () => {
    const container = createContainer();
    container.bindValue(NUMBER, 1);

    const decoratedFactory = injectable(
      (a, b) => a + b,
      NUMBER,
      optional(STRING, 'value'),
    );

    expect(decoratedFactory(container)).toBe('1value');
  });

  it('should inject values from Container as an object for the first argument of the factory', () => {
    const container = createContainer();
    container.bindValue(NUMBER, 1);
    container.bindValue(STRING, '2');

    const decoratedFactory = injectable(join, { a: NUMBER, b: STRING });

    expect(decoratedFactory(container)).toBe('1/2');
  });

  it('should throw ResolverError error in case a value is not provided', () => {
    const container = createContainer();
    container.bindValue(NUMBER, 1);

    const decoratedFactory = injectable(join, { a: NUMBER, b: STRING });

    expect(() => decoratedFactory(container)).toThrowError(
      new ResolverError(`Token "${STRING.symbol.description}" is not provided`),
    );
  });

  it('should inject values of optional tokens in case values are not provided', () => {
    const container = createContainer();
    container.bindValue(NUMBER, 1);

    const decoratedFactory = injectable(join, {
      a: NUMBER,
      b: optional(STRING, 'value'),
    });

    expect(decoratedFactory(container)).toBe('1/value');
  });
});

describe('injectableClass()', () => {
  class TestClass {
    a: number;
    b: string;

    constructor(a: number, b: string) {
      this.a = a;
      this.b = b;
    }

    concat(): string {
      return this.a + this.b;
    }
  }

  it('should inject values from Container as arguments of the constructor', () => {
    const container = createContainer();
    container.bindValue(NUMBER, 1);
    container.bindValue(STRING, '2');

    const factory = injectableClass(TestClass, NUMBER, STRING);

    expect(factory(container).concat()).toBe('12');
  });

  it('should throw ResolverError error in case a value is not provided', () => {
    const container = createContainer();
    container.bindValue(NUMBER, 1);

    const factory = injectableClass(TestClass, NUMBER, STRING);

    expect(() => factory(container)).toThrowError(
      new ResolverError(`Token "${STRING.symbol.description}" is not provided`),
    );
  });

  it('should inject values of optional tokens in case values are not provided', () => {
    const container = createContainer();
    container.bindValue(NUMBER, 1);

    const factory = injectableClass(
      TestClass,
      NUMBER,
      optional(STRING, 'value'),
    );

    expect(factory(container).concat()).toBe('1value');
  });
});

describe('injectableClass()', () => {
  class TestClass {
    a: number;
    b: string;

    constructor(props: { a: number; b: string }) {
      this.a = props.a;
      this.b = props.b;
    }

    join(): string {
      return `${this.a}/${this.b}`;
    }
  }

  it('should inject values from Container as an object for the first argument of the factory', () => {
    const container = createContainer();
    container.bindValue(NUMBER, 1);
    container.bindValue(STRING, '2');

    const factory = injectableClass(TestClass, { a: NUMBER, b: STRING });

    expect(factory(container).join()).toBe('1/2');
  });

  it('should throw ResolverError error in case a value is not provided', () => {
    const container = createContainer();
    container.bindValue(NUMBER, 1);

    const factory = injectableClass(TestClass, { a: NUMBER, b: STRING });

    expect(() => factory(container)).toThrowError(
      new ResolverError(`Token "${STRING.symbol.description}" is not provided`),
    );
  });

  it('should inject values of optional tokens in case values are not provided', () => {
    const container = createContainer();
    container.bindValue(NUMBER, 1);

    const factory = injectableClass(TestClass, {
      a: NUMBER,
      b: optional(STRING, 'value'),
    });

    expect(factory(container).join()).toBe('1/value');
  });
});
