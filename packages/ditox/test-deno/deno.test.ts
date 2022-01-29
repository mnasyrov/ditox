/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
declare const Deno: any;

import {
  assertEquals,
  assertStrictEquals,
  assertThrows,
} from 'https://deno.land/std@0.79.0/testing/asserts.ts';
import {
  bindMultiValue,
  Container,
  createContainer,
  tryResolveValues,
  injectable,
  optional,
  ResolverError,
  resolveValues,
  token,
} from '../../../mod.ts';

const NUMBER = token<number>('number');
const STRING = token<string>('string');
const NUMBERS = token<Array<number>>('numbers');

Deno.test('should bind a value to the container', () => {
  const container = createContainer();
  container.bindValue(NUMBER, 1);
  assertStrictEquals(container.get(NUMBER), 1);
});

Deno.test('should bind a factory to the container', () => {
  const container = createContainer();

  let containerArg;
  const factory = (arg: Container) => {
    containerArg = arg;
    return 1;
  };
  container.bindFactory(NUMBER, factory);

  assertStrictEquals(container.get(NUMBER), 1);
  assertStrictEquals(containerArg, container);
});

Deno.test('should bind a factory with "singleton" scope', () => {
  const parent = createContainer();
  const container = createContainer(parent);

  const START = token<number>();
  parent.bindValue(START, 10);
  container.bindValue(START, 20);

  let counter = 0;
  const factory = (start: number) => start + ++counter;
  parent.bindFactory(NUMBER, injectable(factory, START), {
    scope: 'singleton',
  });

  assertStrictEquals(container.get(NUMBER), 11);
  assertStrictEquals(container.get(NUMBER), 11);
  assertStrictEquals(parent.get(NUMBER), 11);
  assertStrictEquals(container.get(NUMBER), 11);
});

Deno.test('should bind a factory with "scoped" scope', () => {
  const parent = createContainer();
  const container = createContainer(parent);

  const START = token<number>();
  parent.bindValue(START, 10);
  container.bindValue(START, 20);

  let counter = 0;
  const factory = (start: number) => start + ++counter;
  parent.bindFactory(NUMBER, injectable(factory, START), {
    scope: 'scoped',
  });

  assertStrictEquals(container.get(NUMBER), 21);
  assertStrictEquals(container.get(NUMBER), 21);
  assertStrictEquals(parent.get(NUMBER), 12);
  assertStrictEquals(container.get(NUMBER), 21);
});

Deno.test('should bind a factory with "transient" scope', () => {
  const parent = createContainer();
  const container = createContainer(parent);

  const START = token<number>();
  parent.bindValue(START, 10);
  container.bindValue(START, 20);

  let counter = 0;
  const factory = (start: number) => start + ++counter;
  parent.bindFactory(NUMBER, injectable(factory, START), {
    scope: 'transient',
  });

  assertStrictEquals(container.get(NUMBER), 21);
  assertStrictEquals(container.get(NUMBER), 22);
  assertStrictEquals(parent.get(NUMBER), 13);
  assertStrictEquals(container.get(NUMBER), 24);
});

Deno.test('should bind a factory with "onRemoved" callback', () => {
  const container = createContainer();

  let flag = false;
  const factory = () => 1;
  const callback = () => (flag = true);
  container.bindFactory(NUMBER, factory, {onRemoved: callback});

  assertStrictEquals(container.get(NUMBER), 1);
  container.remove(NUMBER);
  assertStrictEquals(flag, true);
});

Deno.test('should return a provided value', () => {
  const container = createContainer();
  container.bindValue(NUMBER, 1);
  assertStrictEquals(container.get(NUMBER), 1);
});

Deno.test('should resolve a provided value', () => {
  const container = createContainer();
  container.bindValue(NUMBER, 1);
  assertStrictEquals(container.resolve(NUMBER), 1);
});

Deno.test('should throw ResolverError in case a value is not provided', () => {
  const container = createContainer();
  assertThrows(() => container.resolve(NUMBER), ResolverError);
});

Deno.test('should return a value from the parent container', () => {
  const parent = createContainer();
  const container = createContainer(parent);
  parent.bindValue(NUMBER, 1);
  assertStrictEquals(container.get(NUMBER), 1);
});

Deno.test('should remove all values and factories', () => {
  const container = createContainer();

  container.bindValue(NUMBER, 1);
  container.bindFactory(STRING, () => '2');
  assertStrictEquals(container.get(NUMBER), 1);
  assertStrictEquals(container.get(STRING), '2');

  container.removeAll();
  assertStrictEquals(container.get(NUMBER), undefined);
  assertStrictEquals(container.get(STRING), undefined);
});

Deno.test(
  'should resolve an optional value in case the optional token is not provided',
  () => {
    const parent = createContainer();
    const container = createContainer(parent);

    const optionalNumber = optional(NUMBER, 1);

    assertStrictEquals(parent.resolve(optionalNumber), 1);
    assertStrictEquals(container.resolve(optionalNumber), 1);
  },
);

Deno.test('should return values for the tokens', () => {
  const container = createContainer();
  container.bindValue(NUMBER, 1);
  container.bindValue(STRING, 'abc');

  const values: [number, string] = tryResolveValues(container, NUMBER, STRING);
  assertEquals(values, [1, 'abc']);
});

Deno.test('should resolve tokens from the container', () => {
  const container = createContainer();
  container.bindValue(NUMBER, 1);
  container.bindValue(STRING, 'abc');

  const values: [number, string] = resolveValues(container, NUMBER, STRING);
  assertEquals(values, [1, 'abc']);
});

Deno.test(
  'should inject values from Container as arguments of the factory',
  () => {
    const container = createContainer();
    container.bindValue(NUMBER, 1);
    container.bindValue(STRING, '2');

    const decoratedFactory = injectable(
      (a: number, b: string) => a + b,
      NUMBER,
      STRING,
    );

    const result = decoratedFactory(container);
    assertStrictEquals(result, '12');
  },
);

Deno.test('should append a value to an array declared by a token', () => {
  const container = createContainer();

  bindMultiValue(container, NUMBERS, 1);
  bindMultiValue(container, NUMBERS, 2);

  const values: Array<number> = container.resolve(NUMBERS);
  assertEquals(values, [1, 2]);
});
