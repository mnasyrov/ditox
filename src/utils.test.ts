import {createToken, optional, ResolverError} from './common';
import {getValues, inject, resolveValues} from './utils';
import {createContainer} from './container';

const NUMBER = createToken<number>('number');
const STRING = createToken<string>('string');

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
