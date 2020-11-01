import {token, optional, ResolverError} from './common';
import {bindMultiValue, getValues, inject, resolveValues} from './utils';
import {createContainer} from './container';

const NUMBER = token<number>('number');
const STRING = token<string>('string');

describe('getValues', () => {
  it('should return values for the tokens', () => {
    const container = createContainer();
    container.bindValue(NUMBER, 1);
    container.bindValue(STRING, 'abc');

    const values: [number, string] = getValues(container, NUMBER, STRING);
    expect(values).toEqual([1, 'abc']);
  });

  it('should return "undefined" item in case a value is not provided', () => {
    const container = createContainer();
    container.bindValue(NUMBER, 1);

    const values = getValues(container, NUMBER, STRING);
    expect(values).toEqual([1, undefined]);
  });

  it('should return values of optional tokens in case they are not provided', () => {
    const container = createContainer();
    container.bindValue(NUMBER, 1);

    const OPTIONAL_STRING = optional(STRING, 'value');

    const values = getValues(container, NUMBER, STRING, OPTIONAL_STRING);
    expect(values).toEqual([1, undefined, 'value']);
  });
});

describe('resolveValues', () => {
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

    const values = getValues(container, NUMBER, optional(STRING, 'value'));
    expect(values).toEqual([1, 'value']);
  });
});

describe('inject()', () => {
  it('should inject values from Container as arguments of the factory', () => {
    const container = createContainer();
    container.bindValue(NUMBER, 1);
    container.bindValue(STRING, '2');

    const decoratedFactory = inject(
      container,
      (a: number, b: string) => a + b,
      NUMBER,
      STRING,
    );

    expect(decoratedFactory()).toBe('12');
  });

  it('should throw ResolverError error in case a value is not provided', () => {
    const container = createContainer();
    container.bindValue(NUMBER, 1);

    const decoratedFactory = inject(
      container,
      (a: number, b: string) => a + b,
      NUMBER,
      STRING,
    );

    expect(() => decoratedFactory()).toThrowError(
      new ResolverError(`Token "${STRING.symbol.description}" is not provided`),
    );
  });

  it('should inject values of optional tokens in case values are not provided', () => {
    const container = createContainer();
    container.bindValue(NUMBER, 1);

    const decoratedFactory = inject(
      container,
      (a, b) => a + b,
      NUMBER,
      optional(STRING, 'value'),
    );

    expect(decoratedFactory()).toBe('1value');
  });
});

describe('bindMultiValue', () => {
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

    container.unbind(NUMBERS);
    expect(parent.resolve(NUMBERS)).toEqual([1, 2]);
    expect(container.resolve(NUMBERS)).toEqual([1, 2]);
  });
});
