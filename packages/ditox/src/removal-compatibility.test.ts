import { describe, expect, it, vi } from 'vitest';
import {
  bindModule,
  CleanupError,
  createContainer,
  declareModule,
  token,
} from './index';

describe('3.x regression scenarios under v4 cleanup semantics', () => {
  it('clears a single binding after its callback throws without retrying', () => {
    const container = createContainer();
    const resource = token();
    const value = {};
    const failure = new Error('failure');
    const onRemoved = vi.fn().mockImplementationOnce(() => {
      throw failure;
    });
    container.bindFactory(resource, () => value, { onRemoved });
    container.resolve(resource);

    expect(() => container.remove(resource)).toThrow(failure);
    expect(container.hasToken(resource)).toBe(false);
    container.remove(resource);
    expect(container.hasToken(resource)).toBe(false);
    expect(onRemoved).toHaveBeenCalledTimes(1);
  });

  it('clears a module and its exports after a single removal fails', () => {
    const container = createContainer();
    const exported = token<number>();
    const failure = new Error('destroy failed');
    const destroy = vi.fn().mockImplementationOnce(() => {
      throw failure;
    });
    const module = declareModule({
      factory: () => ({ value: 42, destroy }),
      exports: { value: exported },
    });
    bindModule(container, module);
    expect(container.resolve(exported)).toBe(42);
    expect(() => container.remove(module.token)).toThrow(failure);
    expect(container.hasToken(module.token)).toBe(false);
    expect(container.hasToken(exported)).toBe(false);
    container.remove(module.token);
    expect(container.hasToken(module.token)).toBe(false);
    expect(container.hasToken(exported)).toBe(false);
    expect(destroy).toHaveBeenCalledTimes(1);
  });

  it('preserves replacements made by a single callback', () => {
    const container = createContainer();
    const resource = token();
    const replacementFactory = vi.fn(() => 2);
    container.bindFactory(resource, () => 1, {
      onRemoved() {
        container.bindFactory(resource, replacementFactory);
        container.bindValue(resource, 2);
      },
    });
    container.resolve(resource);
    container.remove(resource);
    expect(container.resolve(resource)).toBe(2);
    expect(replacementFactory).not.toHaveBeenCalled();
  });

  it('keeps live traversal when callbacks remove and append other bindings', () => {
    const container = createContainer();
    const first = token();
    const second = token();
    const appended = token();
    const calls: string[] = [];
    container.bindFactory(first, () => 1, {
      onRemoved() {
        calls.push('first');
        container.remove(second);
        container.bindFactory(appended, () => 3, {
          onRemoved: () => {
            calls.push('appended');
          },
        });
        container.resolve(appended);
      },
    });
    container.bindFactory(second, () => 2, {
      onRemoved: () => {
        calls.push('second');
      },
    });
    container.resolve(first);
    container.resolve(second);
    container.removeAll();
    expect(calls).toEqual(['first', 'second', 'appended']);
    [first, second, appended].forEach((resource) => {
      expect(container.hasToken(resource)).toBe(false);
    });
  });

  it('defers nested bulk cleanup to the active outer traversal', () => {
    const container = createContainer();
    const first = token();
    const second = token();
    const calls: string[] = [];
    let nested = false;
    container.bindFactory(first, () => 1, {
      onRemoved() {
        calls.push('first');
        if (!nested) {
          nested = true;
          container.removeAll();
          expect(container.hasToken(second)).toBe(true);
          calls.push('returned');
        }
      },
    });
    container.bindFactory(second, () => 2, {
      onRemoved: () => {
        calls.push('second');
      },
    });
    container.resolve(first);
    container.resolve(second);
    container.removeAll();
    expect(calls).toEqual(['first', 'returned', 'second']);
  });

  it('visits a factory deleted and reinserted at an already visited key', () => {
    const container = createContainer();
    const first = token<number>();
    const second = token();
    const calls: number[] = [];
    const onRemoved = (value: number) => {
      calls.push(value);
    };
    container.bindFactory(first, () => 1, { onRemoved });
    container.bindFactory(second, () => 2, {
      onRemoved() {
        container.remove(first);
        container.bindFactory(first, () => 3, { onRemoved });
        container.resolve(first);
      },
    });
    container.resolve(first);
    container.resolve(second);
    container.removeAll();
    expect(calls).toEqual([1, 3]);
    expect(container.hasToken(first)).toBe(false);
  });

  it('guards reentrant removal of the active cached record', () => {
    const container = createContainer();
    const resource = token();
    let calls = 0;
    container.bindFactory(resource, () => 1, {
      onRemoved() {
        calls++;
        if (calls === 1) container.remove(resource);
      },
    });
    container.resolve(resource);
    container.removeAll();
    expect(calls).toBe(1);
    expect(container.hasToken(resource)).toBe(false);
  });

  it('revisits replacement cached records at already visited keys', () => {
    const container = createContainer();
    const first = token();
    const second = token();
    const onRemoved = vi.fn();
    container.bindFactory(first, () => 1, { onRemoved });
    container.bindFactory(second, () => 2, {
      onRemoved() {
        container.bindValue(first, 3);
      },
    });
    container.resolve(first);
    container.resolve(second);
    container.removeAll();
    expect(onRemoved.mock.calls).toEqual([[1], [3]]);
    expect(container.hasToken(first)).toBe(false);
  });
});

describe('bulk cleanup failures with reentry and accessors', () => {
  it.each([new Error('first'), undefined, null, false, 0, 'failure'])(
    'retains the first thrown value within multiple failures, including %s',
    (failure) => {
      const container = createContainer();
      const later = new Error('later');
      const callbacks = [failure, later].map((error) => {
        const resource = token();
        const onRemoved = vi.fn(() => {
          throw error;
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
      expect(caught).toBeInstanceOf(CleanupError);
      expect((caught as CleanupError).errors[0]).toBe(failure);
      expect((caught as CleanupError).errors[1]).toBe(later);
      container.removeAll();
      for (const callback of callbacks)
        expect(callback).toHaveBeenCalledTimes(1);
    },
  );

  it('continues after a nested single removal throws without retrying it', () => {
    const container = createContainer();
    const first = token();
    const second = token();
    const last = token();
    const failure = new Error('nested failure');
    const onRemoved = vi.fn(() => {
      throw failure;
    });
    const lastCallback = vi.fn();
    container.bindFactory(first, () => 1, {
      onRemoved: () => container.remove(second),
    });
    container.bindFactory(second, () => 2, { onRemoved });
    container.bindFactory(last, () => 3, { onRemoved: lastCallback });
    [first, second, last].forEach((resource) => {
      container.resolve(resource);
    });
    expect(() => container.removeAll()).toThrow(failure);
    expect(onRemoved).toHaveBeenCalledTimes(1);
    expect(lastCallback).toHaveBeenCalledTimes(1);
    [first, second, last].forEach((resource) => {
      expect(container.hasToken(resource)).toBe(false);
    });
  });

  it('finishes nested bulk cleanup before propagating its first error', () => {
    const container = createContainer();
    const first = token();
    const second = token();
    const third = token();
    let nested = false;
    const failure = new Error('nested failure');
    const onRemoved = vi.fn();
    container.bindFactory(first, () => 1, {
      onRemoved() {
        if (!nested) {
          nested = true;
          container.removeAll();
        }
      },
    });
    container.bindFactory(second, () => 2, {
      onRemoved() {
        throw failure;
      },
    });
    container.bindFactory(third, () => 3, { onRemoved });
    [first, second, third].forEach((resource) => {
      container.resolve(resource);
    });
    expect(() => container.removeAll()).toThrow(failure);
    expect(onRemoved).toHaveBeenCalledTimes(1);
    [first, second, third].forEach((resource) => {
      expect(container.hasToken(resource)).toBe(false);
    });
    container.removeAll();
  });

  it('skips cleanup option accessors for unresolved factories', () => {
    const container = createContainer();
    const first = token();
    const second = token();
    const factory = vi.fn();
    const getter = vi.fn(() => {
      throw new Error('accessor should not be read');
    });
    const onRemoved = vi.fn();
    container.bindFactory(first, factory, {
      get onRemoved() {
        return getter();
      },
    });
    container.bindFactory(second, () => undefined, { onRemoved });
    container.resolve(second);
    expect(() => container.removeAll()).not.toThrow();
    expect(getter).not.toHaveBeenCalled();
    expect(factory).not.toHaveBeenCalled();
    expect(onRemoved).toHaveBeenCalledExactlyOnceWith(undefined);
    expect(container.hasToken(first)).toBe(false);
    expect(container.hasToken(second)).toBe(false);
  });
});
