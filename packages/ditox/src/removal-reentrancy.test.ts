import { describe, expect, it, vi } from 'vitest';
import {
  bindModule,
  CleanupError,
  createContainer,
  declareModule,
  token,
} from './index';

function caught(action: () => void): unknown {
  try {
    action();
  } catch (error) {
    return error;
  }
  throw new Error('Expected action to throw');
}

describe('removal reentrancy', () => {
  it.each([true, false])(
    'cleans replacement after visiting the key; delete=%s',
    (removeFirst) => {
      const c = createContainer();
      const a = token<number>();
      const b = token<number>();
      const calls: number[] = [];
      const factory = () => 1;
      const options = {
        onRemoved: (value: number) => {
          calls.push(value);
        },
      };
      c.bindFactory(a, factory, options);
      c.bindFactory(b, () => 0, {
        onRemoved() {
          if (removeFirst) c.remove(a);
          c.bindFactory(a, factory, options);
          c.bindValue(a, 2);
        },
      });
      c.resolve(a);
      c.resolve(b);
      c.removeAll();
      expect(calls).toEqual([1, 2]);
      expect(c.hasToken(a)).toBe(false);
      c.removeAll();
      expect(calls).toEqual([1, 2]);
    },
  );

  for (const throws of [false, true]) {
    it.each(['neither', 'factory', 'value', 'both'] as const)(
      `conditional remove preserves replacement: %s; throws=${throws}`,
      (change) => {
        const c = createContainer();
        const t = token<number>();
        const failure = new Error('original');
        const removed: number[] = [];
        const newFactory = vi.fn(() => 3);
        c.bindFactory(t, () => 1, {
          onRemoved(value) {
            removed.push(value);
            if (value !== 1) return;
            if (change === 'factory' || change === 'both') {
              c.bindFactory(t, newFactory, {
                onRemoved: (v) => {
                  removed.push(v);
                },
              });
            }
            if (change === 'value' || change === 'both') c.bindValue(t, 2);
            if (throws) throw failure;
          },
        });
        c.resolve(t);
        if (throws) expect(caught(() => c.remove(t))).toBe(failure);
        else c.remove(t);
        expect(removed).toEqual([1]);
        if (change === 'neither') {
          expect(c.hasToken(t)).toBe(false);
        } else {
          expect(c.hasToken(t)).toBe(true);
          expect(newFactory).not.toHaveBeenCalled();
          expect(c.resolve(t)).toBe(change === 'factory' ? 3 : 2);
          c.remove(t);
          expect(removed).toEqual([1, change === 'factory' ? 3 : 2]);
          expect(c.hasToken(t)).toBe(false);
        }
      },
    );
  }

  it.each([undefined, 0, { same: 'object' }])(
    'cache identity is independent of value %j',
    (value) => {
      const c = createContainer();
      const a = token();
      const b = token();
      const onRemoved = vi.fn();
      c.bindFactory(a, () => value, { onRemoved });
      c.bindFactory(b, () => 1, {
        onRemoved() {
          c.bindValue(a, value);
        },
      });
      c.resolve(a);
      c.resolve(b);
      c.removeAll();
      expect(onRemoved).toHaveBeenCalledTimes(2);
      expect(onRemoved.mock.calls).toEqual([[value], [value]]);
    },
  );

  it('factory-only rebinding must not dispose the same cached record twice', () => {
    const c = createContainer();
    const a = token();
    const b = token();
    const original = vi.fn();
    const replacement = vi.fn();
    c.bindFactory(a, () => ({}), { onRemoved: original });
    c.bindFactory(b, () => 1, {
      onRemoved() {
        c.bindFactory(a, () => ({}), { onRemoved: replacement });
      },
    });
    c.resolve(a);
    c.resolve(b);
    c.removeAll();
    expect(original).toHaveBeenCalledTimes(1);
    expect(replacement).not.toHaveBeenCalled();
  });

  it('revisits a previously unresolved factory resolved by a later callback', () => {
    const c = createContainer();
    const a = token();
    const b = token();
    const onRemoved = vi.fn();
    const factory = vi.fn(() => ({}));
    c.bindFactory(a, factory, { onRemoved });
    c.bindFactory(b, () => 1, {
      onRemoved() {
        c.resolve(a);
      },
    });
    c.resolve(b);
    c.removeAll();
    expect(factory).toHaveBeenCalledTimes(1);
    expect(onRemoved).toHaveBeenCalledTimes(1);
  });

  it.each(['remove', 'removeAll'] as const)(
    'new record can be removed inside the old callback in %s',
    (method) => {
      const c = createContainer();
      const a = token<number>();
      const calls: number[] = [];
      c.bindFactory(a, () => 1, {
        onRemoved(value) {
          calls.push(value);
          c.remove(a);
          if (value === 1) {
            c.bindValue(a, 2);
            c.remove(a);
          }
        },
      });
      c.resolve(a);
      c[method](a);
      expect(calls).toEqual([1, 2]);
      expect(c.hasToken(a)).toBe(false);
    },
  );

  it('stale outer remove preserves registration created after nested removeAll', () => {
    const c = createContainer();
    const a = token<number>();
    const b = token();
    const calls: number[] = [];
    c.bindFactory(a, () => 1, {
      onRemoved() {
        calls.push(1);
        c.removeAll();
        c.bindFactory(a, () => 2, {
          onRemoved: () => {
            calls.push(2);
          },
        });
        c.resolve(a);
      },
    });
    const other = vi.fn();
    c.bindFactory(b, () => 0, { onRemoved: other });
    c.resolve(a);
    c.resolve(b);
    c.remove(a);
    expect(c.resolve(a)).toBe(2);
    c.removeAll();
    expect(calls).toEqual([1, 2]);
    expect(other).toHaveBeenCalledTimes(1);
  });

  it.each([false, true])(
    'throwing module destroy clears exports; cached=%s',
    (cached) => {
      const c = createContainer();
      const exported = token<number>();
      const failure = new Error('destroy');
      const destroy = vi.fn(() => {
        throw failure;
      });
      const m = declareModule({
        factory: () => ({ value: 42, destroy }),
        exports: { value: exported },
      });
      bindModule(c, m);
      c.resolve(m.token);
      if (cached) c.resolve(exported);
      expect(caught(() => c.remove(m.token))).toBe(failure);
      expect(c.hasToken(m.token)).toBe(false);
      expect(c.hasToken(exported)).toBe(false);
      c.remove(m.token);
      c.removeAll();
      expect(destroy).toHaveBeenCalledTimes(1);
    },
  );

  it('preserves destroy and export failures and continues through every export', () => {
    const c = createContainer();
    const a = token<number>();
    const b = token<number>();
    const d = token<number>();
    const failures = [new Error('destroy'), undefined, 'export'];
    const m = declareModule({
      factory: () => ({
        a: 1,
        b: 2,
        d: 3,
        destroy() {
          throw failures[0];
        },
      }),
      exports: { a, b, d },
    });
    bindModule(c, m);
    c.resolve(m.token);
    const calls: string[] = [];
    for (const [t, name, fail] of [
      [a, 'a', 1],
      [b, 'b', 2],
      [d, 'd', -1],
    ] as const) {
      c.bindFactory(t, () => 42, {
        onRemoved() {
          calls.push(name);
          if (fail >= 0) throw failures[fail];
        },
      });
      c.resolve(t);
    }
    const error = caught(() => c.remove(m.token)) as CleanupError;
    expect(error).toBeInstanceOf(CleanupError);
    expect(error.errors).toEqual(failures);
    failures.forEach((failure, i) => {
      expect(error.errors[i]).toBe(failure);
    });
    expect(calls).toEqual(['a', 'b', 'd']);
    for (const t of [a, b, d, m.token]) expect(c.hasToken(t)).toBe(false);
  });

  it('retains token-based export cleanup after destroy replaces an export', () => {
    const c = createContainer();
    const exported = token<number>();
    const calls: string[] = [];
    const m = declareModule({
      factory: () => ({
        value: 1,
        destroy() {
          calls.push('destroy');
          c.bindFactory(exported, () => 2, {
            onRemoved: () => {
              calls.push('export');
            },
          });
          c.bindValue(exported, 2);
        },
      }),
      exports: { value: exported },
    });
    bindModule(c, m);
    c.resolve(m.token);
    c.remove(m.token);
    expect(calls).toEqual(['destroy', 'export']);
    expect(c.hasToken(exported)).toBe(false);
  });

  it.each(['remove', 'removeAll'] as const)(
    'module destroy supports nested %s without double destroy',
    (method) => {
      const c = createContainer();
      const exported = token<number>();
      const calls: string[] = [];
      const m = declareModule({
        factory: () => ({
          value: 1,
          destroy() {
            calls.push('destroy');
            c[method](m.token);
          },
        }),
        exports: { value: exported },
      });
      bindModule(c, m);
      c.resolve(exported);
      c.remove(m.token);
      expect(calls).toEqual(['destroy']);
      expect(c.hasToken(exported)).toBe(false);
      expect(c.hasToken(m.token)).toBe(false);
    },
  );

  it('does not flatten a nested CleanupError thrown by a callback', () => {
    const c = createContainer();
    const a = token();
    const b = token();
    const nested = new CleanupError([new Error('one'), new Error('two')]);
    const other = new Error('other');
    c.bindFactory(a, () => 1, {
      onRemoved() {
        throw nested;
      },
    });
    c.bindFactory(b, () => 2, {
      onRemoved() {
        throw other;
      },
    });
    c.resolve(a);
    c.resolve(b);
    const error = caught(() => c.removeAll()) as CleanupError;
    expect(error.errors[0]).toBe(nested);
    expect(error.errors[1]).toBe(other);
  });
});
