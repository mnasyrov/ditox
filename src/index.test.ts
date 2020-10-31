import {
  CONTAINER,
  createContainer,
  createToken,
  getValues,
  inject,
  optional,
  PARENT_CONTAINER,
  ResolverError,
  resolveValues,
} from './index';

const NUMBER = createToken<number>('number');
const STRING = createToken<string>('string');

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

      const factory = jest.fn(() => 1);
      container.bindFactory(NUMBER, factory);

      expect(container.get(NUMBER)).toBe(1);
      expect(factory).toBeCalledTimes(1);
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

    it('should bind a factory with "singleton" scope by default', () => {
      const container = createContainer();

      let counter = 0;
      const factory = jest.fn(() => ++counter);
      container.bindFactory(NUMBER, factory);

      expect(container.get(NUMBER)).toBe(1);
      expect(container.get(NUMBER)).toBe(1);
      expect(factory).toBeCalledTimes(1);
    });

    it('should bind a factory with "singleton" scope', () => {
      const container = createContainer();

      let counter = 0;
      const factory = jest.fn(() => ++counter);
      container.bindFactory(NUMBER, factory, {scope: 'singleton'});

      expect(container.get(NUMBER)).toBe(1);
      expect(container.get(NUMBER)).toBe(1);
      expect(factory).toBeCalledTimes(1);
    });

    it('should bind a factory with "transient" scope', () => {
      const container = createContainer();

      let counter = 0;
      const factory = jest.fn(() => ++counter);
      container.bindFactory(NUMBER, factory, {scope: 'transient'});

      expect(container.get(NUMBER)).toBe(1);
      expect(container.get(NUMBER)).toBe(2);
      expect(factory).toBeCalledTimes(2);
    });

    it('should bind a factory with "onUnbind" callback', () => {
      const container = createContainer();

      const factory = jest.fn(() => 1);
      const callback = jest.fn();
      container.bindFactory(NUMBER, factory, {onUnbind: callback});

      expect(container.get(NUMBER)).toBe(1);
      container.unbind(NUMBER);
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

  describe('unbind()', () => {
    it('should unbind a value', () => {
      const container = createContainer();
      container.bindValue(NUMBER, 1);
      container.unbind(NUMBER);
      expect(container.get(NUMBER)).toBeUndefined();
    });

    it('should unbind "singleton" factory silently in case its value has never been resolved', () => {
      const container = createContainer();

      const factory = jest.fn(() => 1);
      const onUnbind = jest.fn();
      container.bindFactory(NUMBER, factory, {scope: 'singleton', onUnbind});
      container.unbind(NUMBER);

      expect(container.get(NUMBER)).toBeUndefined();
      expect(factory).toHaveBeenCalledTimes(0);
      expect(onUnbind).toHaveBeenCalledTimes(0);
    });

    it('should unbind "singleton" factory with calling "onUnbind" in case its value has  been resolved', () => {
      const container = createContainer();

      const factory = jest.fn(() => 100);
      const onUnbind = jest.fn();
      container.bindFactory(NUMBER, factory, {scope: 'singleton', onUnbind});

      expect(container.get(NUMBER)).toBe(100);
      container.unbind(NUMBER);

      expect(container.get(NUMBER)).toBeUndefined();
      expect(factory).toHaveBeenCalledTimes(1);
      expect(onUnbind).toHaveBeenCalledTimes(1);
      expect(onUnbind).toHaveBeenCalledWith(100);
    });

    it('should unbind "transient" factory in case its value has never been resolved', () => {
      const container = createContainer();

      const factory = jest.fn(() => 1);
      container.bindFactory(NUMBER, factory, {scope: 'transient'});
      container.unbind(NUMBER);

      expect(container.get(NUMBER)).toBeUndefined();
      expect(factory).toHaveBeenCalledTimes(0);
    });

    it('should unbind "transient" factory in case its value has been resolved', () => {
      const container = createContainer();

      const factory = jest.fn(() => 1);
      container.bindFactory(NUMBER, factory, {scope: 'transient'});
      expect(container.get(NUMBER)).toBe(1);

      container.unbind(NUMBER);
      expect(container.get(NUMBER)).toBeUndefined();
      expect(factory).toHaveBeenCalledTimes(1);
    });

    it('should not unbind CONTAINER and PARENT_CONTAINER tokens', () => {
      const parent = createContainer();
      const container = createContainer(parent);

      container.unbind(CONTAINER);
      container.unbind(PARENT_CONTAINER);

      expect(container.get(CONTAINER)).toBe(container);
      expect(container.get(PARENT_CONTAINER)).toBe(parent);
    });
  });

  describe('unbindAll()', () => {
    it('should unbind all values and factories', () => {
      const container = createContainer();

      container.bindValue(NUMBER, 1);
      container.bindFactory(STRING, () => '2');
      expect(container.get(NUMBER)).toBe(1);
      expect(container.get(STRING)).toBe('2');

      container.unbindAll();
      expect(container.get(NUMBER)).toBeUndefined();
      expect(container.get(STRING)).toBeUndefined();
    });

    it('should call "onUnbind" callbacks for factories with resolved singleton values', () => {
      const F1 = createToken('f1');
      const F2 = createToken('f2');

      const unbind1 = jest.fn();
      const unbind2 = jest.fn();

      const container = createContainer();
      container.bindFactory(F1, () => 10, {
        scope: 'singleton',
        onUnbind: unbind1,
      });
      container.bindFactory(F2, () => 20, {
        scope: 'singleton',
        onUnbind: unbind2,
      });

      expect(container.get(F2)).toBe(20);

      container.unbindAll();
      expect(container.get(F1)).toBeUndefined();
      expect(container.get(F2)).toBeUndefined();

      expect(unbind1).toHaveBeenCalledTimes(0);
      expect(unbind2).toHaveBeenCalledTimes(1);
      expect(unbind2).toHaveBeenCalledWith(20);
    });

    it('should remain CONTAINER and PARENT_CONTAINER tokens', () => {
      const parent = createContainer();
      const container = createContainer(parent);

      container.unbindAll();

      expect(container.get(CONTAINER)).toBe(container);
      expect(container.get(PARENT_CONTAINER)).toBe(parent);
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
      container.unbind(NUMBER);

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
      container.unbind(NUMBER);

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
  });
});

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
