import { describe, expect, it, vi } from 'vitest';
import { createContainer, token } from './index';

function caught(action: () => void): unknown {
  try {
    action();
  } catch (error) {
    return error;
  }
  throw new Error('Expected action to throw');
}

describe('removal accessors', () => {
  it('revisits a value resolved by a later accessor returning no callback', () => {
    const container = createContainer();
    const earlier = token();
    const later = token();
    const onRemoved = vi.fn();
    container.bindFactory(earlier, () => ({}), { onRemoved });
    container.bindFactory(later, () => ({}), {
      get onRemoved() {
        container.resolve(earlier);
        return undefined;
      },
    });
    container.resolve(later);

    container.removeAll();

    expect(onRemoved).toHaveBeenCalledTimes(1);
    expect(container.hasToken(earlier)).toBe(false);
    expect(container.hasToken(later)).toBe(false);
  });

  it('cleans a replacement created by an accessor returning no callback', () => {
    const container = createContainer();
    const resource = token<number>();
    const onRemoved = vi.fn();
    container.bindFactory(resource, () => 1, {
      get onRemoved() {
        container.bindFactory(resource, () => 2, { onRemoved });
        container.bindValue(resource, 2);
        return undefined;
      },
    });
    container.resolve(resource);

    container.removeAll();

    expect(onRemoved).toHaveBeenCalledExactlyOnceWith(2);
    expect(container.hasToken(resource)).toBe(false);
  });

  it('preserves one error from a failed scope lookup across bulk passes', () => {
    const c = createContainer();
    const a = token();
    const b = token();
    const failure = new Error('scope getter');
    const reads = vi.fn();
    const options = {
      get scope(): never {
        reads();
        throw failure;
      },
    };
    c.bindFactory(a, () => 1, options);
    c.bindValue(a, 1);
    const healthy = vi.fn();
    c.bindFactory(b, () => 2, { onRemoved: healthy });
    c.resolve(b);
    expect(caught(() => c.removeAll())).toBe(failure);
    expect(reads).toHaveBeenCalledTimes(1);
    expect(healthy).toHaveBeenCalledTimes(1);
    expect(c.hasToken(a)).toBe(false);
  });

  it('preserves one error from a failed callback lookup across bulk passes', () => {
    const c = createContainer();
    const a = token();
    const b = token();
    const failure = new Error('getter');
    const reads = vi.fn();
    c.bindFactory(a, () => 1, {
      get onRemoved(): never {
        reads();
        throw failure;
      },
    });
    const healthy = vi.fn();
    c.bindFactory(b, () => 2, { onRemoved: healthy });
    c.resolve(a);
    c.resolve(b);
    expect(caught(() => c.removeAll())).toBe(failure);
    expect(reads).toHaveBeenCalledTimes(1);
    expect(healthy).toHaveBeenCalledTimes(1);
    expect(c.hasToken(a)).toBe(false);
  });

  it.each(['context', 'record', 'both'] as const)(
    'permits a new callback lookup after a failed lookup when %s changes',
    (change) => {
      const c = createContainer();
      const a = token<number>();
      const b = token();
      const failure = new Error('getter');
      let reads = 0;
      const removed: number[] = [];
      const options = {
        get onRemoved() {
          if (++reads === 1) throw failure;
          return (value: number) => {
            removed.push(value);
          };
        },
      };
      const factory = () => 1;
      c.bindFactory(a, factory, options);
      c.bindFactory(b, () => 0, {
        onRemoved() {
          if (change !== 'record') c.bindFactory(a, factory, options);
          if (change !== 'context') c.bindValue(a, 2);
        },
      });
      c.resolve(a);
      c.resolve(b);
      expect(caught(() => c.removeAll())).toBe(failure);
      expect(removed).toEqual([change === 'context' ? 1 : 2]);
      expect(reads).toBe(2);
    },
  );

  it('claims the record before a callback getter reenters remove', () => {
    const c = createContainer();
    const a = token<number>();
    const onRemoved = vi.fn();
    let nested = false;
    c.bindFactory(a, () => 42, {
      get onRemoved() {
        if (!nested) {
          nested = true;
          c.remove(a);
        }
        return onRemoved;
      },
    });
    c.resolve(a);
    c.remove(a);
    expect(onRemoved).toHaveBeenCalledExactlyOnceWith(42);
    expect(c.hasToken(a)).toBe(false);
  });
});
