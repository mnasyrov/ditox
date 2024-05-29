import {
  CONTAINER,
  createContainer,
  FACTORIES_MAP,
  PARENT_CONTAINER,
  ResolverError,
} from './container';
import {injectable} from './utils';
import {optional, token} from './tokens';

const NUMBER = token<number>('number');
const STRING = token<string>('string');

describe('Container', () => {
  describe('bindValue()', () => {
    it('should bind a value to the container', () => {
      const container = createContainer();
      container.bindValue(NUMBER, 1);
      expect(container.get(NUMBER)).toBe(1);
    });

    it('should rebind a value in case it was bound', () => {
      const container = createContainer();
      container.bindValue(NUMBER, 1);
      container.bindValue(NUMBER, 2);
      expect(container.get(NUMBER)).toBe(2);
    });

    it('should bind a result of a factory and prevent invoking it', () => {
      const container = createContainer();

      const factory = jest.fn(() => 1);
      container.bindFactory(NUMBER, factory);
      container.bindValue(NUMBER, 2);

      expect(container.get(NUMBER)).toBe(2);
      expect(factory).toBeCalledTimes(0);
    });

    it('should not rebind CONTAINER and PARENT_CONTAINER tokens', () => {
      const parent = createContainer();
      const container = createContainer(parent);

      const custom = createContainer();
      container.bindValue(CONTAINER, custom);
      container.bindValue(PARENT_CONTAINER, custom);

      expect(container.get(CONTAINER)).toBe(container);
      expect(container.get(PARENT_CONTAINER)).toBe(parent);
    });
  });

  describe('bindFactory()', () => {
    it('should bind a factory to the container', () => {
      const container = createContainer();

      let containerArg;
      const factory = jest.fn((arg) => {
        containerArg = arg;
        return 1;
      });
      container.bindFactory(NUMBER, factory);

      expect(container.get(NUMBER)).toBe(1);
      expect(factory).toBeCalledTimes(1);
      expect(containerArg).toBe(container);
    });

    it('should rebind a factory in case it was bound', () => {
      const container = createContainer();

      const factory1 = jest.fn(() => 1);
      const factory2 = jest.fn(() => 2);
      container.bindFactory(NUMBER, factory1);
      container.bindFactory(NUMBER, factory2);

      expect(container.get(NUMBER)).toBe(2);
      expect(factory1).toBeCalledTimes(0);
      expect(factory2).toBeCalledTimes(1);
    });

    it('should bind a factory with "singleton" scope', () => {
      const parent = createContainer();
      const container = createContainer(parent);

      const START = token<number>();
      parent.bindValue(START, 10);
      container.bindValue(START, 20);

      let counter = 0;
      const factory = jest.fn((start) => start + ++counter);
      parent.bindFactory(NUMBER, injectable(factory, START), {
        scope: 'singleton',
      });

      container.bindFactory(NUMBER, injectable(factory, START), {
        scope: 'singleton',
      });

      expect(container.get(NUMBER)).toBe(11);
      expect(container.get(NUMBER)).toBe(11);
      expect(parent.get(NUMBER)).toBe(11);
      expect(container.get(NUMBER)).toBe(11);

      expect(factory).toBeCalledTimes(1);
    });

    it('should bind a factory with "scoped" scope', () => {
      const parent = createContainer();
      const container = createContainer(parent);

      const START = token<number>();
      parent.bindValue(START, 10);
      container.bindValue(START, 20);

      let counter = 0;
      const factory = jest.fn((start) => start + ++counter);
      parent.bindFactory(NUMBER, injectable(factory, START), {
        scope: 'scoped',
      });

      expect(container.get(NUMBER)).toBe(11);
      expect(container.get(NUMBER)).toBe(11);
      expect(parent.get(NUMBER)).toBe(11);
      expect(container.get(NUMBER)).toBe(11);

      expect(factory).toBeCalledTimes(1);
    });

    it('should inherit a factory with "scoped" scope', async () => {
      const parentParent = createContainer();
      let counter = 0;
      const factory = jest.fn(() => ++counter);

      parentParent.bindFactory(NUMBER, factory);

      expect(parentParent.get(NUMBER)).toBe(1);

      const parent = createContainer(parentParent);

      parent.bindFactory(NUMBER, injectable(factory), {
        scope: 'scoped',
      });

      expect(parent.get(NUMBER)).toBe(2);

      const container = createContainer(parent);

      expect(container.get(NUMBER)).toBe(2);
      expect(parent.get(NUMBER)).toBe(2);

      expect(factory).toBeCalledTimes(2);

      container.removeAll();
      expect(parent.get(NUMBER)).toBe(2);
    });

    it('should bind a factory with "singleton" scope by default', () => {
      const parent = createContainer();
      const container = createContainer(parent);

      const START = token<number>();
      parent.bindValue(START, 10);
      container.bindValue(START, 20);

      let counter = 0;
      const factory = jest.fn((start) => start + ++counter);
      parent.bindFactory(NUMBER, injectable(factory, START));

      expect(container.get(NUMBER)).toBe(11);
      expect(container.get(NUMBER)).toBe(11);
      expect(parent.get(NUMBER)).toBe(11);
      expect(container.get(NUMBER)).toBe(11);

      expect(factory).toBeCalledTimes(1);
    });

    test('order of scoped containers', () => {
      const parent = createContainer();
      const container1 = createContainer(parent);
      const container2 = createContainer(parent);
      const container3 = createContainer(parent);
      const childContainer1 = createContainer(container1);
      const childContainer2 = createContainer(container2);
      const childContainer3 = createContainer(container3);

      const START = token<number>();
      parent.bindValue(START, 0);
      container1.bindValue(START, 10);
      container2.bindValue(START, 20);
      container3.bindValue(START, 30);

      let counter = 0;
      const factory = jest.fn((start) => start + ++counter);
      parent.bindFactory(NUMBER, injectable(factory, START), {
        scope: 'scoped',
      });

      container1.bindFactory(NUMBER, injectable(factory, START), {
        scope: 'scoped',
      });

      container2.bindFactory(NUMBER, injectable(factory, START), {
        scope: 'scoped',
      });

      container3.bindFactory(NUMBER, injectable(factory, START), {
        scope: 'scoped',
      });

      childContainer1.bindValue(START, 1);
      childContainer2.bindValue(START, 2);
      childContainer3.bindValue(START, 3);

      expect(container1.get(NUMBER)).toBe(11);
      expect(container2.get(NUMBER)).toBe(22);
      expect(container3.get(NUMBER)).toBe(33);
      expect(parent.get(NUMBER)).toBe(4);
      expect(container1.get(NUMBER)).toBe(11);
      expect(container2.get(NUMBER)).toBe(22);
      expect(container3.get(NUMBER)).toBe(33);

      expect(childContainer1.get(NUMBER)).toBe(11);
      expect(childContainer2.get(NUMBER)).toBe(22);
      expect(childContainer3.get(NUMBER)).toBe(33);

      expect(factory).toBeCalledTimes(4);
    });

    it('should bind a factory with "transient" scope', () => {
      const parent = createContainer();
      const container = createContainer(parent);

      const START = token<number>();
      parent.bindValue(START, 10);
      container.bindValue(START, 20);

      let counter = 0;
      const factory = jest.fn((start) => start + ++counter);
      parent.bindFactory(NUMBER, injectable(factory, START), {
        scope: 'transient',
      });

      expect(container.get(NUMBER)).toBe(21);
      expect(container.get(NUMBER)).toBe(22);
      expect(parent.get(NUMBER)).toBe(13);
      expect(container.get(NUMBER)).toBe(24);

      expect(factory).toBeCalledTimes(4);
    });

    it('should bind a factory with "onRemoved" callback', () => {
      const container = createContainer();

      const factory = jest.fn(() => 1);
      const callback = jest.fn();
      container.bindFactory(NUMBER, factory, {onRemoved: callback});

      expect(container.get(NUMBER)).toBe(1);
      container.remove(NUMBER);
      expect(factory).toBeCalledTimes(1);
      expect(callback).toBeCalledTimes(1);
    });

    it('should not rebind CONTAINER and PARENT_CONTAINER tokens', () => {
      const parent = createContainer();
      const container = createContainer(parent);

      const factory = () => createContainer();
      container.bindFactory(CONTAINER, factory);
      container.bindFactory(PARENT_CONTAINER, factory);

      expect(container.get(CONTAINER)).toBe(container);
      expect(container.get(PARENT_CONTAINER)).toBe(parent);
    });
  });

  describe('remove()', () => {
    it('should remove a value', () => {
      const container = createContainer();
      container.bindValue(NUMBER, 1);
      container.remove(NUMBER);
      expect(container.get(NUMBER)).toBeUndefined();
    });

    it('should remove "singleton" factory silently in case its value has never been resolved', () => {
      const container = createContainer();

      const factory = jest.fn(() => 1);
      const onRemoved = jest.fn();
      container.bindFactory(NUMBER, factory, {scope: 'singleton', onRemoved});
      container.remove(NUMBER);

      expect(container.get(NUMBER)).toBeUndefined();
      expect(factory).toHaveBeenCalledTimes(0);
      expect(onRemoved).toHaveBeenCalledTimes(0);
    });

    it('should remove "singleton" factory with calling "onRemoved" in case its value has been resolved', () => {
      const container = createContainer();

      const factory = jest.fn(() => 100);
      const onRemoved = jest.fn();
      container.bindFactory(NUMBER, factory, {scope: 'singleton', onRemoved});

      expect(container.get(NUMBER)).toBe(100);
      container.remove(NUMBER);

      expect(container.get(NUMBER)).toBeUndefined();
      expect(factory).toHaveBeenCalledTimes(1);
      expect(onRemoved).toHaveBeenCalledTimes(1);
      expect(onRemoved).toHaveBeenCalledWith(100);
    });

    it('should remove "scoped" factory with different values in case of parent-child hierarchy', () => {
      const parent = createContainer();
      const container = createContainer(parent);

      let count = 1;
      const factory = jest.fn(() => count++);
      const onRemoved = jest.fn();
      parent.bindFactory(NUMBER, factory, {scope: 'scoped', onRemoved});

      expect(parent.get(NUMBER)).toBe(1);
      expect(container.get(NUMBER)).toBe(1);

      // Check for using the internal FAKE_FACTORY
      const internalFactories = container.resolve(FACTORIES_MAP);
      const fakeContext = internalFactories.get(NUMBER.symbol);
      const internalOnRemoved =
        fakeContext?.options?.scope === 'scoped' &&
        fakeContext?.options?.onRemoved;
      expect(internalOnRemoved).toBeFalsy();

      // Continue the main test
      parent.remove(NUMBER);
      container.remove(NUMBER);
      expect(onRemoved).toHaveBeenNthCalledWith(1, 1);
      expect(onRemoved).toHaveBeenCalledTimes(1);
    });

    it('should remove "transient" factory in case its value has never been resolved', () => {
      const container = createContainer();

      const factory = jest.fn(() => 1);
      container.bindFactory(NUMBER, factory, {scope: 'transient'});
      container.remove(NUMBER);

      expect(container.get(NUMBER)).toBeUndefined();
      expect(factory).toHaveBeenCalledTimes(0);
    });

    it('should remove "transient" factory in case its value has been resolved', () => {
      const container = createContainer();

      const factory = jest.fn(() => 1);
      container.bindFactory(NUMBER, factory, {scope: 'transient'});
      expect(container.get(NUMBER)).toBe(1);

      container.remove(NUMBER);
      expect(container.get(NUMBER)).toBeUndefined();
      expect(factory).toHaveBeenCalledTimes(1);
    });

    it('should not remove CONTAINER and PARENT_CONTAINER tokens', () => {
      const parent = createContainer();
      const container = createContainer(parent);

      container.remove(CONTAINER);
      container.remove(PARENT_CONTAINER);

      expect(container.get(CONTAINER)).toBe(container);
      expect(container.get(PARENT_CONTAINER)).toBe(parent);
    });
  });

  describe('removeAll()', () => {
    it('should remove all values and factories', () => {
      const container = createContainer();

      container.bindValue(NUMBER, 1);
      container.bindFactory(STRING, () => '2');
      expect(container.get(NUMBER)).toBe(1);
      expect(container.get(STRING)).toBe('2');

      container.removeAll();
      expect(container.get(NUMBER)).toBeUndefined();
      expect(container.get(STRING)).toBeUndefined();
    });

    it('should call "onRemoved" callbacks for factories with resolved singleton values', () => {
      const F1 = token('f1');
      const F2 = token('f2');

      const unbind1 = jest.fn();
      const unbind2 = jest.fn();

      const container = createContainer();
      container.bindFactory(F1, () => 10, {
        scope: 'singleton',
        onRemoved: unbind1,
      });
      container.bindFactory(F2, () => 20, {
        scope: 'singleton',
        onRemoved: unbind2,
      });

      expect(container.get(F2)).toBe(20);

      container.removeAll();
      expect(container.get(F1)).toBeUndefined();
      expect(container.get(F2)).toBeUndefined();

      expect(unbind1).toHaveBeenCalledTimes(0);
      expect(unbind2).toHaveBeenCalledTimes(1);
      expect(unbind2).toHaveBeenCalledWith(20);
    });

    it('should remain CONTAINER and PARENT_CONTAINER tokens', () => {
      const parent = createContainer();
      const container = createContainer(parent);

      container.removeAll();

      expect(container.get(CONTAINER)).toBe(container);
      expect(container.get(PARENT_CONTAINER)).toBe(parent);
    });
  });

  describe('hasToken()', () => {
    it('should check if a container hierarchy has the token', () => {
      const factory = jest.fn();

      const token1 = token();
      const token2 = token();
      const token3 = token();

      const parent = createContainer();
      parent.bindValue(token1, 1);
      parent.bindFactory(token2, factory);

      expect(parent.hasToken(token1)).toBe(true);
      expect(parent.hasToken(token2)).toBe(true);
      expect(parent.hasToken(token3)).toBe(false);

      const child = createContainer(parent);
      expect(child.hasToken(token1)).toBe(true);
      expect(child.hasToken(token2)).toBe(true);
      expect(child.hasToken(token3)).toBe(false);

      child.bindValue(token3, 2);
      expect(parent.hasToken(token3)).toBe(false);
      expect(child.hasToken(token3)).toBe(true);

      expect(factory).toHaveBeenCalledTimes(0);
    });
  });

  describe('get()', () => {
    it('should return a provided value', () => {
      const container = createContainer();
      container.bindValue(NUMBER, 1);
      expect(container.get(NUMBER)).toBe(1);
    });

    it('should return "undefined" in case a value is not provided', () => {
      const container = createContainer();
      expect(container.get(NUMBER)).toBeUndefined();
    });

    it('should return a value from the parent container', () => {
      const parent = createContainer();
      const container = createContainer(parent);
      parent.bindValue(NUMBER, 1);
      expect(container.get(NUMBER)).toBe(1);
    });

    it('should return "undefined" in case the parent container does not provide a value', () => {
      const parent = createContainer();
      const container = createContainer(parent);
      expect(container.get(NUMBER)).toBeUndefined();
    });

    it('should return a value from the container in case it overrides the parent container', () => {
      const parent = createContainer();
      parent.bindValue(NUMBER, 1);

      const container = createContainer(parent);
      container.bindValue(NUMBER, 2);

      expect(container.get(NUMBER)).toBe(2);
    });

    it('should return a value from the parent container in case the value was unbound from the current one', () => {
      const parent = createContainer();
      parent.bindValue(NUMBER, 1);

      const container = createContainer(parent);
      container.bindValue(NUMBER, 2);
      container.remove(NUMBER);

      expect(container.get(NUMBER)).toBe(1);
    });

    it('should return the container for CONTAINER token', () => {
      const container = createContainer();
      const result = container.get(CONTAINER);
      expect(result).toBe(container);
    });

    it('should return the parent container for PARENT_CONTAINER token', () => {
      const parent = createContainer();
      const container = createContainer(parent);
      const result = container.get(PARENT_CONTAINER);
      expect(result).toBe(parent);
    });

    it('should return "undefined" for PARENT_CONTAINER token in case there is no parent container', () => {
      const container = createContainer();
      const result = container.get(PARENT_CONTAINER);
      expect(result).toBeUndefined();
    });

    it('should return optional value in case optional token is not provided', () => {
      const parent = createContainer();
      const container = createContainer(parent);

      const optionalNumber = optional(NUMBER, 1);

      expect(parent.get(optionalNumber)).toBe(1);
      expect(container.get(optionalNumber)).toBe(1);
    });
  });

  describe('resolve()', () => {
    it('should resolve a provided value', () => {
      const container = createContainer();
      container.bindValue(NUMBER, 1);
      expect(container.resolve(NUMBER)).toBe(1);
    });

    it('should throw ResolverError in case a value is not provided', () => {
      const container = createContainer();
      expect(() => container.resolve(token('test'))).toThrowError(
        new ResolverError(`Token "test" is not provided`),
      );
    });

    it('should throw ResolverError with an empty name in case a token is not resolved', () => {
      const container = createContainer();
      expect(() => container.resolve(token())).toThrowError(
        new ResolverError(`Token "" is not provided`),
      );
    });

    it('should resolve a value from the parent container', () => {
      const parent = createContainer();
      const container = createContainer(parent);
      parent.bindValue(NUMBER, 1);
      expect(container.resolve(NUMBER)).toBe(1);
    });

    it('should resolve a value from the parent container by OptionalToken', () => {
      const OPTIONAL_TOKEN = optional(token(), 0);

      const parent = createContainer();
      parent.bindValue(OPTIONAL_TOKEN, 1);

      const container = createContainer(parent);
      expect(container.resolve(OPTIONAL_TOKEN)).toBe(1);
    });

    it('should throw ResolverError in case the parent container does not provide a value', () => {
      const parent = createContainer();
      const container = createContainer(parent);
      expect(() => container.resolve(NUMBER)).toThrowError(ResolverError);
    });

    it('should resolve a value from the container in case it overrides the parent container', () => {
      const parent = createContainer();
      parent.bindValue(NUMBER, 1);

      const container = createContainer(parent);
      container.bindValue(NUMBER, 2);

      expect(container.resolve(NUMBER)).toBe(2);
    });

    it('should resolve a value from the parent container in case the value was unbound from the current one', () => {
      const parent = createContainer();
      parent.bindValue(NUMBER, 1);

      const container = createContainer(parent);
      container.bindValue(NUMBER, 2);
      container.remove(NUMBER);

      expect(container.resolve(NUMBER)).toBe(1);
    });

    it('should resolve CONTAINER token as the container', () => {
      const container = createContainer();
      const result = container.resolve(CONTAINER);
      expect(result).toBe(container);
    });

    it('should resolve PARENT_CONTAINER as the parent container', () => {
      const parent = createContainer();
      const container = createContainer(parent);
      const result = container.get(PARENT_CONTAINER);
      expect(result).toBe(parent);
    });

    it('should throw ResolverError for PARENT_CONTAINER token in case there is no parent container', () => {
      const container = createContainer();
      expect(() => container.resolve(PARENT_CONTAINER)).toThrowError(
        new ResolverError(
          `Token "${PARENT_CONTAINER.symbol.description}" is not provided`,
        ),
      );
    });

    it('should resolve an optional value in case the optional token is not provided', () => {
      const parent = createContainer();
      const container = createContainer(parent);

      const optionalNumber = optional(NUMBER, 1);

      expect(parent.resolve(optionalNumber)).toBe(1);
      expect(container.resolve(optionalNumber)).toBe(1);
    });

    it('should resolve a value by shared tokens', () => {
      const key = 'token-' + Date.now();
      const t1 = token({key});
      const t2 = token({key});
      expect(t1).not.toBe(t2);

      const container = createContainer();
      container.bindValue(t1, 1);

      expect(container.resolve(t1)).toBe(1);
      expect(container.resolve(t2)).toBe(1);
    });
  });
});
