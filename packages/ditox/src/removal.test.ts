import { describe, expect, it, vi } from 'vitest';
import {
  bindModule,
  CleanupError,
  createContainer,
  declareModule,
  token,
} from './index';

describe('container teardown', () => {
  it('finishes cleanup after an onRemoved failure and does not retry callbacks', () => {
    const container = createContainer();
    const failure = new Error('cleanup failed');
    const calls: string[] = [];
    const tokens = ['before', 'failure', 'after'].map((name) => {
      const resource = token(name);
      container.bindFactory(resource, () => ({}), {
        onRemoved() {
          calls.push(name);
          if (name === 'failure') throw failure;
        },
      });
      container.resolve(resource);
      return resource;
    });
    const value = token();
    const unresolved = token();
    const factory = vi.fn();
    const onRemoved = vi.fn();
    container.bindValue(value, 42);
    container.bindFactory(unresolved, factory, { onRemoved });

    expect(() => container.removeAll()).toThrow(failure);
    expect(calls).toEqual(['before', 'failure', 'after']);
    for (const resource of [...tokens, value, unresolved]) {
      expect(container.hasToken(resource)).toBe(false);
    }
    expect(factory).not.toHaveBeenCalled();
    expect(onRemoved).not.toHaveBeenCalled();
    expect(() => container.removeAll()).not.toThrow();
    expect(calls).toEqual(['before', 'failure', 'after']);
  });

  it('reports every thrown value in callback order after clearing bindings', () => {
    const container = createContainer();
    const failures = [new Error('first'), undefined, 'third'];
    const callbacks = failures.map((failure) => {
      const resource = token();
      const onRemoved = vi.fn(() => {
        throw failure;
      });
      container.bindFactory(resource, () => undefined, { onRemoved });
      container.resolve(resource);
      return onRemoved;
    });

    let caught: unknown;
    try {
      container.removeAll();
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(Error);
    expect(caught).toBeInstanceOf(CleanupError);
    expect((caught as CleanupError).name).toBe('CleanupError');
    expect((caught as CleanupError).errors).toEqual(failures);
    failures.forEach((failure, index) => {
      expect((caught as CleanupError).errors[index]).toBe(failure);
    });
    container.removeAll();
    callbacks.forEach((callback) => {
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  it.each(['remove', 'removeAll'] as const)(
    '%s preserves a single thrown value, including undefined',
    (method) => {
      const container = createContainer();
      const resource = token();
      container.bindFactory(resource, () => undefined, {
        onRemoved() {
          throw undefined;
        },
      });
      container.resolve(resource);
      let threw = false;
      try {
        container[method](resource);
      } catch (error) {
        threw = true;
        expect(error).toBeUndefined();
      }
      expect(threw).toBe(true);
      expect(container.hasToken(resource)).toBe(false);
    },
  );

  it('removes a single binding even if its callback throws', () => {
    const container = createContainer();
    const resource = token();
    const failure = new Error('cleanup failed');
    const onRemoved = vi.fn(() => {
      container.remove(resource);
      throw failure;
    });
    container.bindFactory(resource, () => ({}), { onRemoved });
    container.resolve(resource);

    let caught: unknown;
    try {
      container.remove(resource);
    } catch (error) {
      caught = error;
    }
    expect(caught).toBe(failure);
    expect(container.hasToken(resource)).toBe(false);
    container.remove(resource);
    container.removeAll();
    expect(onRemoved).toHaveBeenCalledTimes(1);
  });

  it.each(['remove', 'removeAll'] as const)(
    'handles nested remove and removeAll during %s without duplicate callbacks',
    (method) => {
      const container = createContainer();
      const first = token();
      const second = token();
      const last = token();
      const calls: string[] = [];
      container.bindFactory(first, () => 1, {
        onRemoved() {
          calls.push('first');
          container.remove(first);
          container.removeAll();
          // The outer callback must remain guarded after nested cleanup returns.
          container.remove(first);
          container.remove(second);
        },
      });
      container.bindFactory(second, () => 2, {
        onRemoved() {
          calls.push('second');
          container.remove(first);
          container.remove(second);
          container.removeAll();
        },
      });
      container.bindFactory(last, () => 3, {
        onRemoved() {
          calls.push('last');
          container.remove(second);
          container.remove(first);
        },
      });
      [first, second, last].forEach((resource) => {
        container.resolve(resource);
      });

      container[method](first);
      expect(calls).toEqual(['first', 'second', 'last']);
      [first, second, last].forEach((resource) => {
        expect(container.hasToken(resource)).toBe(false);
      });
      container.removeAll();
      expect(calls).toEqual(['first', 'second', 'last']);
    },
  );

  it('continues after a nested remove fails without calling it again', () => {
    const container = createContainer();
    const first = token();
    const second = token();
    const last = token();
    const failure = new Error('nested cleanup failed');
    const failingCallback = vi.fn(() => {
      throw failure;
    });
    const lastCallback = vi.fn();
    container.bindFactory(first, () => 1, {
      onRemoved: () => container.remove(second),
    });
    container.bindFactory(second, () => 2, { onRemoved: failingCallback });
    container.bindFactory(last, () => 3, { onRemoved: lastCallback });
    [first, second, last].forEach((resource) => {
      container.resolve(resource);
    });

    expect(() => container.removeAll()).toThrow(failure);
    container.removeAll();
    expect(failingCallback).toHaveBeenCalledTimes(1);
    expect(lastCallback).toHaveBeenCalledTimes(1);
  });

  it.each(['singleton', 'scoped'] as const)(
    'only disposes locally cached %s values and leaves parent values intact',
    (scope) => {
      const parent = createContainer();
      const child = createContainer(parent);
      const inherited = token();
      const shared = token();
      const owned = token();
      const parentCallback = vi.fn();
      const childCallback = vi.fn(() => {
        throw new Error('child cleanup failed');
      });
      const inheritedFactory = vi.fn(() => ({}));
      const sharedFactory = vi.fn(() => ({}));
      parent.bindFactory(inherited, inheritedFactory, {
        scope,
        onRemoved: parentCallback,
      });
      parent.bindFactory(shared, sharedFactory, {
        scope,
        onRemoved: parentCallback,
      });
      child.bindFactory(shared, sharedFactory, {
        scope,
        onRemoved: childCallback,
      });
      child.bindFactory(owned, () => ({}), { scope, onRemoved: childCallback });
      const inheritedValue = child.resolve(inherited);
      const parentValue = parent.resolve(shared);
      const childValue = child.resolve(shared);
      child.resolve(owned);

      expect(() => child.removeAll()).toThrow();
      expect(childCallback).toHaveBeenCalledTimes(scope === 'scoped' ? 2 : 1);
      if (scope === 'scoped') {
        expect(childCallback).toHaveBeenCalledWith(childValue);
        expect(childValue).not.toBe(parentValue);
      } else {
        expect(childValue).toBe(parentValue);
      }
      expect(parentCallback).not.toHaveBeenCalled();
      expect(child.resolve(inherited)).toBe(inheritedValue);
      expect(child.resolve(shared)).toBe(parentValue);
      child.removeAll();
      parent.removeAll();
      expect(parentCallback).toHaveBeenCalledTimes(2);
      expect(inheritedFactory).toHaveBeenCalledTimes(1);
      expect(sharedFactory).toHaveBeenCalledTimes(scope === 'scoped' ? 2 : 1);
    },
  );

  it('keeps resolved dependencies available during normal bulk callbacks', () => {
    const container = createContainer();
    const dependency = token();
    const consumer = token();
    const value = {};
    const onRemoved = vi.fn();
    container.bindFactory(dependency, () => value, { onRemoved });
    container.bindFactory(consumer, () => ({}), {
      onRemoved() {
        expect(container.resolve(dependency)).toBe(value);
      },
    });
    container.resolve(dependency);
    container.resolve(consumer);
    container.removeAll();
    expect(onRemoved).toHaveBeenCalledTimes(1);
  });

  it('does not resolve unused factories or dispose transient values', () => {
    const container = createContainer();
    const unused = token();
    const transient = token();
    const unusedFactory = vi.fn();
    const unusedCallback = vi.fn();
    const transientFactory = vi.fn(() => ({}));
    const transientCallback = vi.fn();
    container.bindFactory(unused, unusedFactory, { onRemoved: unusedCallback });
    // JavaScript callers can pass extra options; transient still has no teardown.
    const options = {
      scope: 'transient' as const,
      onRemoved: transientCallback,
    };
    container.bindFactory(transient, transientFactory, options);
    expect(container.resolve(transient)).not.toBe(container.resolve(transient));

    container.removeAll();
    expect(unusedFactory).not.toHaveBeenCalled();
    expect(unusedCallback).not.toHaveBeenCalled();
    expect(transientFactory).toHaveBeenCalledTimes(2);
    expect(transientCallback).not.toHaveBeenCalled();
    expect(container.hasToken(transient)).toBe(false);
  });

  it('cleans module exports and subsequent modules after destroy throws', () => {
    const container = createContainer();
    const exported = token<number>();
    const failure = new Error('module cleanup failed');
    const failingModule = declareModule({
      factory: () => ({
        value: 42,
        destroy: () => {
          throw failure;
        },
      }),
      exports: { value: exported },
    });
    const destroy = vi.fn();
    const healthyModule = declareModule({ factory: () => ({ destroy }) });
    bindModule(container, failingModule);
    bindModule(container, healthyModule);
    expect(container.resolve(exported)).toBe(42);
    container.resolve(healthyModule.token);

    expect(() => container.removeAll()).toThrow(failure);
    expect(container.hasToken(exported)).toBe(false);
    expect(container.hasToken(failingModule.token)).toBe(false);
    expect(container.hasToken(healthyModule.token)).toBe(false);
    container.removeAll();
    expect(destroy).toHaveBeenCalledTimes(1);
  });
});
