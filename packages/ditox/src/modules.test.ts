import { describe, expect, it, vi } from 'vitest';
import { createContainer } from './container';
import {
  bindModule,
  bindModules,
  declareModule,
  declareModuleBindings,
  Module,
  ModuleBindingEntry,
  ModuleDeclaration,
} from './modules';
import { token } from './tokens';
import { injectable } from './utils';

describe('bindModule()', () => {
  type TestQueries = { getValue: () => number };
  type TestModule = Module<{ queries: TestQueries }>;

  const MODULE_TOKEN = token<TestModule>();
  const QUERIES_TOKEN = token<TestQueries>();

  const MODULE: ModuleDeclaration<TestModule> = {
    token: MODULE_TOKEN,
    factory: () => ({
      queries: {
        getValue: () => 1,
      },
    }),
    exports: {
      queries: QUERIES_TOKEN,
    },
  };

  it('should bind a module and its provided values', () => {
    const container = createContainer();
    bindModule(container, MODULE);

    const queries = container.resolve(QUERIES_TOKEN);
    const value = queries.getValue();
    expect(value).toBe(1);
  });

  it('should destroy the module on removing the module token and remove tokens of its exported props', () => {
    const destroy = vi.fn();
    const container = createContainer();

    bindModule(container, {
      ...MODULE,
      factory: (container) => ({
        ...MODULE.factory(container),
        destroy,
      }),
    });

    container.resolve(MODULE_TOKEN);
    container.resolve(QUERIES_TOKEN);

    container.remove(MODULE_TOKEN);
    expect(destroy).toBeCalledTimes(1);

    expect(container.hasToken(MODULE_TOKEN)).toBe(false);
    expect(container.hasToken(QUERIES_TOKEN)).toBe(false);
  });

  it('should call beforeBinding() and afterBinding() during binding the module', () => {
    const container = createContainer();
    const token1 = token();
    const token2 = token();

    const beforeBinding = vi.fn((container) =>
      container.bindValue(token1, 'foo'),
    );
    const afterBinding = vi.fn((container) => {
      const value = container.resolve(QUERIES_TOKEN).getValue();
      container.bindValue(token2, value * 10);
    });

    bindModule(container, {
      ...MODULE,
      beforeBinding,
      afterBinding,
    });

    expect(beforeBinding).toBeCalledTimes(1);
    expect(afterBinding).toBeCalledTimes(1);

    expect(container.resolve(token1)).toBe('foo');
    expect(container.resolve(token2)).toBe(10);
  });

  it('should support "eager" strategy', () => {
    const container = createContainer();
    const factory = vi.fn(() => ({}));

    const MODULE = declareModule({
      factory,
      strategy: 'eager',
    });

    bindModule(container, MODULE);
    expect(factory).toBeCalledTimes(1);
  });

  it('should support "lazy" strategy by default', () => {
    const container = createContainer();
    const factory = vi.fn(() => ({}));

    const MODULE = declareModule({
      factory,
    });

    bindModule(container, MODULE);
    expect(factory).toBeCalledTimes(0);

    container.resolve(MODULE.token);
    expect(factory).toBeCalledTimes(1);
  });

  it('should support "eager" strategy in imports', () => {
    const container = createContainer();
    const factory1 = vi.fn(() => ({}));
    const factory2 = vi.fn(() => ({}));

    const MODULE1 = declareModule({
      factory: factory1,
      strategy: 'eager',
    });

    const MODULE2 = declareModule({
      factory: factory2,
      imports: [MODULE1],
    });

    bindModule(container, MODULE2);
    expect(factory1).toBeCalledTimes(1);
    expect(factory2).toBeCalledTimes(0);
  });

  it('should throw an error during binding if "eager" factory fails', () => {
    const container = createContainer();
    const error = new Error('Eager factory failed');
    const factory = vi.fn(() => {
      throw error;
    });

    const MODULE = declareModule({
      factory,
      strategy: 'eager',
    });

    expect(() => bindModule(container, MODULE)).toThrow(error);
  });

  it('should throw an error during binding if imported "eager" factory fails', () => {
    const container = createContainer();
    const error = new Error('Eager factory failed');
    const factory1 = vi.fn(() => {
      throw error;
    });

    const MODULE1 = declareModule({
      factory: factory1,
      strategy: 'eager',
    });

    const MODULE2 = declareModule({
      factory: () => ({}),
      imports: [MODULE1],
    });

    expect(() => bindModule(container, MODULE2)).toThrow(error);
  });

  it('should execute "eager" factories in reverse BFS order', () => {
    const route: string[] = [];

    const declareEagerModule = (id: string, imports?: ModuleBindingEntry[]) =>
      declareModule({
        imports,
        strategy: 'eager',
        factory: () => {
          route.push(id);
          return {};
        },
      });

    /**
     * Structure:
     *       m1
     *     / | \
     *   m2 m3 m4
     *
     * BFS order: m1, m2, m3, m4
     * Expected execution order (reverse): m4, m3, m2, m1
     */
    const m4 = declareEagerModule('m4');
    const m3 = declareEagerModule('m3');
    const m2 = declareEagerModule('m2');
    const m1 = declareEagerModule('m1', [m2, m3, m4]);

    const container = createContainer();
    bindModule(container, m1);

    expect(route).toEqual(['m4', 'm3', 'm2', 'm1']);
  });

  it('should throw an error during resolution if "lazy" factory fails', () => {
    const container = createContainer();
    const error = new Error('Lazy factory failed');
    const factory = vi.fn(() => {
      throw error;
    });

    const MODULE = declareModule({
      factory,
    });

    bindModule(container, MODULE);
    expect(factory).toBeCalledTimes(0);

    expect(() => container.resolve(MODULE.token)).toThrow(error);
  });

  it('should bind the module as singleton by default', () => {
    const parent = createContainer();
    const container = createContainer(parent);

    bindModule(parent, MODULE);
    expect(parent.get(MODULE_TOKEN)).toBe(container.get(MODULE_TOKEN));
  });

  it('should bind a "singleton" module to a container', () => {
    const parent = createContainer();
    const container = createContainer(parent);

    bindModule(parent, MODULE, { scope: 'singleton' });
    expect(parent.get(MODULE_TOKEN)).toBe(container.get(MODULE_TOKEN));
  });

  it('should bind a "scoped" module to a container', () => {
    const parent = createContainer();
    const container = createContainer(parent);

    bindModule(parent, MODULE, { scope: 'scoped' });
    expect(parent.get(MODULE_TOKEN)).toBe(container.get(MODULE_TOKEN));
    expect(parent.get(QUERIES_TOKEN)).toBe(container.get(QUERIES_TOKEN));
  });

  it('should remove "singleton" module when a container is cleaning', () => {
    const parent = createContainer();
    const container = createContainer(parent);

    const destroy = vi.fn();
    bindModule(parent, {
      token: MODULE_TOKEN,
      factory: (container) => ({ ...MODULE.factory(container), destroy }),
    });

    parent.resolve(MODULE_TOKEN);
    parent.removeAll();
    expect(destroy).toBeCalledTimes(1);

    destroy.mockClear();
    container.removeAll();
    expect(destroy).toBeCalledTimes(0);
  });

  it('should remove "scoped" module when a container is cleaning', () => {
    const parent = createContainer();
    const container = createContainer(parent);

    const destroy = vi.fn();
    bindModule(
      parent,
      {
        token: MODULE_TOKEN,
        factory: (container) => ({ ...MODULE.factory(container), destroy }),
      },
      {
        scope: 'scoped',
      },
    );

    parent.resolve(MODULE_TOKEN);
    container.resolve(MODULE_TOKEN);

    destroy.mockClear();
    container.removeAll();
    expect(destroy).toBeCalledTimes(0);

    destroy.mockClear();
    parent.removeAll();
    expect(destroy).toBeCalledTimes(1);
  });

  it('should bind modules and binding entries from "imports" to the container', () => {
    type TestModule = Module<{ value: number }>;

    const MODULE1_TOKEN = token<TestModule>();
    const MODULE1: ModuleDeclaration<TestModule> = {
      token: MODULE1_TOKEN,
      factory: () => ({ value: 1 }),
    };

    const MODULE2_TOKEN = token<TestModule>();
    const MODULE2: ModuleDeclaration<TestModule> = {
      token: MODULE2_TOKEN,
      factory: () => ({ value: 2 }),
    };

    const MODULE2_ALTERED: ModuleDeclaration<TestModule> = {
      token: MODULE2_TOKEN,
      factory: () => ({ value: 22 }),
    };

    const parent = createContainer();
    bindModule(parent, MODULE2);

    const container = createContainer(parent);
    bindModule(
      container,
      declareModule({
        factory: () => ({}),
        imports: [
          MODULE1,
          { module: MODULE2_ALTERED, options: { scope: 'scoped' } },
        ],
      }),
    );

    expect(parent.get(MODULE1_TOKEN)).toBeUndefined();
    expect(parent.get(MODULE2_TOKEN)?.value).toBe(2);

    expect(container.get(MODULE1_TOKEN)?.value).toBe(1);
    expect(container.get(MODULE2_TOKEN)?.value).toBe(22);
  });

  it('should call beforeBinding() before importing modules from "imports"', () => {
    const ARG_TOKEN = token<string>('arg');
    const RESULT_TOKEN = token<string>('result');

    type TestModule = Module<{ value: string }>;

    const MODULE1: ModuleDeclaration<TestModule> = declareModule({
      beforeBinding: (container) =>
        container.bindValue(ARG_TOKEN, container.resolve(ARG_TOKEN) + '2'),
      factory: injectable((arg) => ({ value: arg + '3' }), ARG_TOKEN),
      exports: { value: RESULT_TOKEN },
    });

    const container = createContainer();
    bindModule(
      container,
      declareModule({
        factory: () => ({}),
        beforeBinding: (container) => {
          container.bindValue(ARG_TOKEN, '1');
        },
        imports: [MODULE1],
      }),
    );

    expect(container.resolve(ARG_TOKEN)).toBe('12');
    expect(container.resolve(RESULT_TOKEN)).toBe('123');
  });

  it('should call beforeBinding() and afterBinding() in deep-first order', () => {
    const route: string[] = [];

    const declareTestModule = (
      id: string,
      imports?: ModuleDeclaration<Record<string, any>>[],
    ) =>
      declareModule({
        imports,
        beforeBinding: () => route.push(`${id}:before`),
        factory: (container) => {
          imports?.forEach((m) => container.resolve(m.token));
          route.push(`${id}:factory`);
          return {};
        },
        afterBinding: () => route.push(`${id}:after`),
      });

    /**
     *       m1
     *     / | \
     *   m2 m3 m4
     *  / \  \ |
     * m5 m6  m7
     */
    const m7 = declareTestModule('m7');
    const m6 = declareTestModule('m6');
    const m5 = declareTestModule('m5');
    const m4 = declareTestModule('m4', [m7]);
    const m3 = declareTestModule('m3', [m7]);
    const m2 = declareTestModule('m2', [m5, m6]);
    const m1 = declareTestModule('m1', [m2, m3, m4]);

    const container = createContainer();
    bindModule(container, m1);
    container.resolve(m1.token);

    expect(route).toEqual([
      'm1:before',
      'm2:before',
      'm3:before',
      'm4:before',
      'm5:before',
      'm6:before',
      'm7:before',
      'm7:after',
      'm6:after',
      'm5:after',
      'm4:after',
      'm3:after',
      'm2:after',
      'm1:after',
      'm5:factory',
      'm6:factory',
      'm2:factory',
      'm7:factory',
      'm3:factory',
      'm4:factory',
      'm1:factory',
    ]);
  });
});

describe('bindModules()', () => {
  type TestModule = Module<{ value: number }>;

  const MODULE1_TOKEN = token<TestModule>();
  const MODULE1: ModuleDeclaration<TestModule> = {
    token: MODULE1_TOKEN,
    factory: () => ({ value: 1 }),
  };

  const MODULE2_TOKEN = token<TestModule>();
  const MODULE2: ModuleDeclaration<TestModule> = {
    token: MODULE2_TOKEN,
    factory: () => ({ value: 2 }),
  };

  const MODULE2_ALTERED: ModuleDeclaration<TestModule> = {
    token: MODULE2_TOKEN,
    factory: () => ({ value: 22 }),
  };

  it('should bind modules and binding entries to the container', () => {
    const parent = createContainer();
    const container = createContainer(parent);

    bindModules(parent, [MODULE2]);

    bindModules(container, [
      MODULE1,
      { module: MODULE2_ALTERED, options: { scope: 'scoped' } },
    ]);

    expect(parent.get(MODULE1_TOKEN)).toBeUndefined();
    expect(parent.get(MODULE2_TOKEN)?.value).toBe(2);

    expect(container.get(MODULE1_TOKEN)?.value).toBe(1);
    expect(container.get(MODULE2_TOKEN)?.value).toBe(22);
  });
});

describe('declareModule()', () => {
  it('should declare a binding for the module', () => {
    const container = createContainer();

    const VALUE_TOKEN = token<number>();
    const MODULE_TOKEN = token<Module<{ value: number }>>();
    const MODULE = declareModule({
      token: MODULE_TOKEN,
      factory: () => ({ value: 1 }),
      exports: { value: VALUE_TOKEN },
    });

    bindModule(container, MODULE);
    expect(container.get(VALUE_TOKEN)).toBe(1);
    expect(container.get(MODULE_TOKEN)).toEqual({ value: 1 });
  });

  it('should declare a binding for the anonymous module', () => {
    const container = createContainer();

    const VALUE_TOKEN = token<number>();
    const MODULE = declareModule({
      factory: () => ({ value: 1 }),
      exports: { value: VALUE_TOKEN },
    });

    bindModule(container, MODULE);
    expect(container.get(VALUE_TOKEN)).toBe(1);
  });
});

describe('declareModuleBindings()', () => {
  it('should declare bindings for the modules', () => {
    const container = createContainer();

    const VALUE1_TOKEN = token<number>();
    const MODULE1 = declareModule({
      factory: () => ({ value: 1 }),
      exports: { value: VALUE1_TOKEN },
    });

    const VALUE2_TOKEN = token<number>();
    const MODULE2 = declareModule({
      factory: () => ({ value: 2 }),
      exports: { value: VALUE2_TOKEN },
    });

    const MODULE_BINDINGS = declareModuleBindings([MODULE1, MODULE2]);

    bindModule(container, MODULE_BINDINGS);
    expect(container.get(VALUE1_TOKEN)).toBe(1);
    expect(container.get(VALUE2_TOKEN)).toBe(2);

    expect(container.get(MODULE_BINDINGS.token)).toEqual({});
  });
});
