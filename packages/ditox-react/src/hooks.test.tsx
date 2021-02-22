import {renderHook} from '@testing-library/react-hooks';
import {createContainer, token} from 'ditox';
import React from 'react';
import {CustomDependencyContainer} from './DependencyContainer';
import {
  useDependency,
  useDependencyContainer,
  useOptionalDependency,
} from './hooks';

describe('useDependencyContainer()', () => {
  it('should return a provided container in "strict" mode', () => {
    const container = createContainer();

    const {result} = renderHook(() => useDependencyContainer('strict'), {
      wrapper: ({children}) => (
        <CustomDependencyContainer container={container}>
          {children}
        </CustomDependencyContainer>
      ),
    });

    expect(result.current).toEqual(container);
  });

  it('should throw an error in "strict" mode in case a container is not provided', () => {
    const {result} = renderHook(() => useDependencyContainer('strict'));

    expect(() => {
      throw result.error;
    }).toThrowError(
      'Container is not provided by DependencyContainer component',
    );
  });

  it('should return a provided container in "optional" mode', () => {
    const container = createContainer();

    const {result} = renderHook(() => useDependencyContainer(), {
      wrapper: ({children}) => (
        <CustomDependencyContainer container={container}>
          {children}
        </CustomDependencyContainer>
      ),
    });

    expect(result.current).toEqual(container);
  });

  it('should return "undefined" in "optional" mode in case a container is not provided', () => {
    const {result} = renderHook(() => useDependencyContainer());
    expect(result.current).toBeUndefined();
  });
});

describe('useDependency()', () => {
  it('should return a resolved dependency from a provided container', () => {
    const TOKEN = token('token');
    const container = createContainer();
    container.bindValue(TOKEN, 'value');

    const {result} = renderHook(() => useDependency(TOKEN), {
      wrapper: ({children}) => (
        <CustomDependencyContainer container={container}>
          {children}
        </CustomDependencyContainer>
      ),
    });

    expect(result.current).toEqual('value');
  });

  it('should throw an error in case a container is not provided', () => {
    const TOKEN = token('token');

    const {result} = renderHook(() => useDependency(TOKEN));

    expect(() => {
      throw result.error;
    }).toThrowError(
      'Container is not provided by DependencyContainer component',
    );
  });

  it('should throw an error in case a value is not resolved', () => {
    const TOKEN = token('token');
    const container = createContainer();

    const {result} = renderHook(() => useDependency(TOKEN), {
      wrapper: ({children}) => (
        <CustomDependencyContainer container={container}>
          {children}
        </CustomDependencyContainer>
      ),
    });

    expect(() => {
      throw result.error;
    }).toThrowError('Token "token" is not provided');
  });
});

describe('useOptionalDependency()', () => {
  it('should return a resolved dependency from a provided container', () => {
    const TOKEN = token('token');
    const container = createContainer();
    container.bindValue(TOKEN, 'value');

    const {result} = renderHook(() => useOptionalDependency(TOKEN), {
      wrapper: ({children}) => (
        <CustomDependencyContainer container={container}>
          {children}
        </CustomDependencyContainer>
      ),
    });

    expect(result.current).toEqual('value');
  });

  it('should return "undefined" in case a container is not provided', () => {
    const TOKEN = token('token');

    const {result} = renderHook(() => useOptionalDependency(TOKEN));

    expect(result.current).toBeUndefined();
  });

  it('should return "undefined" in case a value is not resolved', () => {
    const TOKEN = token('token');
    const container = createContainer();

    const {result} = renderHook(() => useOptionalDependency(TOKEN), {
      wrapper: ({children}) => (
        <CustomDependencyContainer container={container}>
          {children}
        </CustomDependencyContainer>
      ),
    });

    expect(result.current).toBeUndefined();
  });
});
