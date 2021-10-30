import {renderHook} from '@testing-library/react-hooks';
import {
  bindModule,
  createContainer,
  Module,
  ModuleDeclaration,
  token,
} from 'ditox';
import React from 'react';
import {CustomDependencyContainer} from './DependencyContainer';
import {DependencyModule} from './DependencyModule';
import {useDependency} from './hooks';

describe('DependencyModule', () => {
  type TestModule = Module<{value: number}>;

  const MODULE_TOKEN = token<TestModule>();
  const VALUE_TOKEN = token<number>();

  const MODULE: ModuleDeclaration<TestModule> = {
    token: MODULE_TOKEN,
    factory: () => ({
      value: 1,
    }),
    exports: {
      value: VALUE_TOKEN,
    },
  };

  it('should bind a module and its provided values', () => {
    const {result} = renderHook(() => useDependency(VALUE_TOKEN), {
      wrapper: ({children}) => (
        <DependencyModule module={MODULE}>{children}</DependencyModule>
      ),
    });

    expect(result.current).toBe(1);
  });

  it('should bind a "scoped" module and its provided values', () => {
    const parent = createContainer();
    bindModule(parent, MODULE);
    const parentModule = parent.resolve(MODULE_TOKEN);

    const {result} = renderHook(() => useDependency(MODULE_TOKEN), {
      wrapper: ({children}) => (
        <CustomDependencyContainer container={parent}>
          <DependencyModule module={MODULE} scope="scoped">
            {children}
          </DependencyModule>
        </CustomDependencyContainer>
      ),
    });

    const childModule = result.current;
    expect(parentModule).not.toBe(childModule);
    expect(childModule.value).toBe(1);
  });
});
