import {createContainer, token} from './ditox';
import {
  bindModule,
  bindModules,
  declareModule,
  declareModuleBindings,
  Module,
  ModuleDeclaration,
} from './modules';
import {injectable} from './utils';

describe('bindModule()', () => {
  type TestQueries = {getValue: () => number};
  type TestModule = Module<{queries: TestQueries}>;

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
    const destroy = jest.fn();
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

    const beforeBinding = jest.fn((container) =>
      container.bindValue(token1, 'foo'),
    );
    const afterBinding = jest.fn((container) => {
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

  it('should bind the module as singleton by default', () => {
    const parent = createContainer();
    const container = createContainer(parent);

    bindModule(parent, MODULE);
    expect(parent.get(MODULE_TOKEN)).toBe(container.get(MODULE_TOKEN));
  });

  it('should bind a "singleton" module to a container', () => {
    const parent = createContainer();
    const container = createContainer(parent);

    bindModule(parent, MODULE, {scope: 'singleton'});
    expect(parent.get(MODULE_TOKEN)).toBe(container.get(MODULE_TOKEN));
  });

  it('should bind a "scoped" module to a container', () => {
    const parent = createContainer();
    const container = createContainer(parent);

    bindModule(parent, MODULE, {scope: 'scoped'});
    expect(parent.get(MODULE_TOKEN)).not.toBe(container.get(MODULE_TOKEN));
    expect(parent.get(QUERIES_TOKEN)).not.toBe(container.get(QUERIES_TOKEN));
  });

  it('should remove "singleton" module when a container is cleaning', () => {
    const parent = createContainer();
    const container = createContainer(parent);

    const destroy = jest.fn();
    bindModule(parent, {
      token: MODULE_TOKEN,
      factory: (container) => ({...MODULE.factory(container), destroy}),
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

    const destroy = jest.fn();
    bindModule(
      parent,
      {
        token: MODULE_TOKEN,
        factory: (container) => ({...MODULE.factory(container), destroy}),
      },
      {
        scope: 'scoped',
      },
    );

    parent.resolve(MODULE_TOKEN);
    container.resolve(MODULE_TOKEN);

    parent.removeAll();
    expect(destroy).toBeCalledTimes(1);

    destroy.mockClear();
    container.removeAll();
    expect(destroy).toBeCalledTimes(1);
  });

  it('should bind modules and binding entries from "imports" to the container', () => {
    type TestModule = Module<{value: number}>;

    const MODULE1_TOKEN = token<TestModule>();
    const MODULE1: ModuleDeclaration<TestModule> = {
      token: MODULE1_TOKEN,
      factory: () => ({value: 1}),
    };

    const MODULE2_TOKEN = token<TestModule>();
    const MODULE2: ModuleDeclaration<TestModule> = {
      token: MODULE2_TOKEN,
      factory: () => ({value: 2}),
    };

    const MODULE2_ALTERED: ModuleDeclaration<TestModule> = {
      token: MODULE2_TOKEN,
      factory: () => ({value: 22}),
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
          {module: MODULE2_ALTERED, options: {scope: 'scoped'}},
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

    type TestModule = Module<{value: string}>;

    const MODULE1: ModuleDeclaration<TestModule> = declareModule({
      beforeBinding: (container) =>
        container.bindValue(ARG_TOKEN, container.resolve(ARG_TOKEN) + '2'),
      factory: injectable((arg) => ({value: arg + '3'}), ARG_TOKEN),
      exports: {value: RESULT_TOKEN},
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
});

describe('bindModules()', () => {
  type TestModule = Module<{value: number}>;

  const MODULE1_TOKEN = token<TestModule>();
  const MODULE1: ModuleDeclaration<TestModule> = {
    token: MODULE1_TOKEN,
    factory: () => ({value: 1}),
  };

  const MODULE2_TOKEN = token<TestModule>();
  const MODULE2: ModuleDeclaration<TestModule> = {
    token: MODULE2_TOKEN,
    factory: () => ({value: 2}),
  };

  const MODULE2_ALTERED: ModuleDeclaration<TestModule> = {
    token: MODULE2_TOKEN,
    factory: () => ({value: 22}),
  };

  it('should bind modules and binding entries to the container', () => {
    const parent = createContainer();
    const container = createContainer(parent);

    bindModules(parent, [MODULE2]);

    bindModules(container, [
      MODULE1,
      {module: MODULE2_ALTERED, options: {scope: 'scoped'}},
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
    const MODULE_TOKEN = token<Module<{value: number}>>();
    const MODULE = declareModule({
      token: MODULE_TOKEN,
      factory: () => ({value: 1}),
      exports: {value: VALUE_TOKEN},
    });

    bindModule(container, MODULE);
    expect(container.get(VALUE_TOKEN)).toBe(1);
    expect(container.get(MODULE_TOKEN)).toEqual({value: 1});
  });

  it('should declare a binding for the anonymous module', () => {
    const container = createContainer();

    const VALUE_TOKEN = token<number>();
    const MODULE = declareModule({
      factory: () => ({value: 1}),
      exports: {value: VALUE_TOKEN},
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
      factory: () => ({value: 1}),
      exports: {value: VALUE1_TOKEN},
    });

    const VALUE2_TOKEN = token<number>();
    const MODULE2 = declareModule({
      factory: () => ({value: 2}),
      exports: {value: VALUE2_TOKEN},
    });

    const MODULE_BINDINGS = declareModuleBindings([MODULE1, MODULE2]);

    bindModule(container, MODULE_BINDINGS);
    expect(container.get(VALUE1_TOKEN)).toBe(1);
    expect(container.get(VALUE2_TOKEN)).toBe(2);

    expect(container.get(MODULE_BINDINGS.token)).toEqual({});
  });
});
