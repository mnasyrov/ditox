import {Container, Token} from 'ditox';
import {useContext, useMemo} from 'react';
import {DependencyContainerContext} from './DependencyContainer';

/**
 * @category Hook
 *
 * Returns a dependency container. Throws an error in case the container is not provided.
 */
export function useDependencyContainer(mode: 'strict'): Container;
/**
 * @category Hook
 *
 * Returns a dependency container, or `undefined` in case the container is not provided.
 */
export function useDependencyContainer(
  mode?: 'optional',
): Container | undefined;
/**
 * @internal
 */
export function useDependencyContainer(
  mode?: 'strict' | 'optional',
): Container | undefined {
  const container = useContext(DependencyContainerContext);

  if (!container && mode === 'strict') {
    throw new Error(
      'Container is not provided by DependencyContainer component',
    );
  }

  return container;
}

/**
 * @category Hook
 *
 * Returns a dependency by token, or fails with an error.
 */
export function useDependency<T>(token: Token<T>): T {
  const container = useDependencyContainer('strict');
  const value = useMemo(() => container.resolve(token), [container, token]);
  return value;
}

/**
 * @category Hook
 *
 * Returns a dependency by token, or `undefined` in case the dependency is not provided.
 */
export function useOptionalDependency<T>(token: Token<T>): T | undefined {
  const container = useDependencyContainer();
  const value = useMemo(() => container?.get(token), [container, token]);
  return value;
}
