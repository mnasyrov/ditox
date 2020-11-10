import {
  createContainer,
  injectable,
  optional,
  ResolverError,
  token,
  Token,
} from '../dist/ditox.cjs';

const NUMBER: Token<number> = token('number');
const STRING: Token<string> = token('string');

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

      const START: Token<number> = token();
      parent.bindValue(START, 10);
      container.bindValue(START, 20);

      let counter = 0;
      const factory = jest.fn((start) => start + ++counter);
      parent.bindFactory(NUMBER, injectable(factory, START), {
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

      const START: Token<number> = token();
      parent.bindValue(START, 10);
      container.bindValue(START, 20);

      let counter = 0;
      const factory = jest.fn((start) => start + ++counter);
      parent.bindFactory(NUMBER, injectable(factory, START), {
        scope: 'scoped',
      });

      expect(container.get(NUMBER)).toBe(21);
      expect(container.get(NUMBER)).toBe(21);
      expect(parent.get(NUMBER)).toBe(12);
      expect(container.get(NUMBER)).toBe(21);

      expect(factory).toBeCalledTimes(2);
    });

    it('should bind a factory with "scoped" scope by default', () => {
      const parent = createContainer();
      const container = createContainer(parent);

      const START: Token<number> = token();
      parent.bindValue(START, 10);
      container.bindValue(START, 20);

      let counter = 0;
      const factory = jest.fn((start) => start + ++counter);
      parent.bindFactory(NUMBER, injectable(factory, START));

      expect(container.get(NUMBER)).toBe(21);
      expect(container.get(NUMBER)).toBe(21);
      expect(parent.get(NUMBER)).toBe(12);
      expect(container.get(NUMBER)).toBe(21);

      expect(factory).toBeCalledTimes(2);
    });

    it('should bind a factory with "transient" scope', () => {
      const parent = createContainer();
      const container = createContainer(parent);

      const START: Token<number> = token();
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

    it('should remove "singleton" factory with calling "onRemoved" in case its value has  been resolved', () => {
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
      expect(() => container.resolve(NUMBER)).toThrowError(ResolverError);
    });

    it('should resolve a value from the parent container', () => {
      const parent = createContainer();
      const container = createContainer(parent);
      parent.bindValue(NUMBER, 1);
      expect(container.resolve(NUMBER)).toBe(1);
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

    it('should resolve an optional value in case the optional token is not provided', () => {
      const parent = createContainer();
      const container = createContainer(parent);

      const optionalNumber = optional(NUMBER, 1);

      expect(parent.resolve(optionalNumber)).toBe(1);
      expect(container.resolve(optionalNumber)).toBe(1);
    });
  });
});
