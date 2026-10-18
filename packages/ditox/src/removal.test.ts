import { describe, expect, it, vi } from 'vitest';
import { bindModule, createContainer, declareModule, token } from './index';

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

  it.each([
    new Error('first'),
    undefined,
    null,
    false,
    0,
    'failure',
  ])('rethrows the first value unchanged after all callbacks, including %s', (failure) => {
    const container = createContainer();
    const callbacks = [failure, new Error('second')].map((error) => {
      const resource = token();
      const onRemoved = vi.fn(() => {
        throw error;
      });
      container.bindFactory(resource, () => undefined, { onRemoved });
      container.resolve(resource);
      return onRemoved;
    });
    let threw = false;
    try {
      container.removeAll();
    } catch (error) {
      threw = true;
      expect(error).toBe(failure);
    }
    expect(threw).toBe(true);
    callbacks.forEach((callback) => expect(callback).toHaveBeenCalledTimes(1));
    container.removeAll();
    callbacks.forEach((callback) => expect(callback).toHaveBeenCalledTimes(1));
  });

  it.each([
    'singleton',
    'scoped',
  ] as const)('only disposes locally cached %s values and leaves parent values intact', (scope) => {
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
  });

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
