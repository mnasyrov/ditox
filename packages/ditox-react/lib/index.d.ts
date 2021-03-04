import { Container, Token } from 'ditox';
import { ReactNode, ReactElement } from 'react';

/**
 * A callback for binding dependencies to a container
 */
declare type DependencyContainerBinder = (container: Container) => unknown;
/**
 * Specifies an existed container or options for a new container:
 * @property root - If `true` then a new container does not depend on any parent containers
 * @property binder - A callback which can bind dependencies to the new container
 */
declare type DependencyContainerParams = {
    children: ReactNode;
    root?: boolean;
    binder?: DependencyContainerBinder;
};
/**
 * @category Component
 *
 * Provides a new dependency container to React app
 *
 * This component creates a new container and provides it down to React children.
 *
 * If `binder` callback is specified, it will be called for a new container
 * to binds it with dependencies.
 *
 * If a parent container is exist, it is connected to the current one by default.
 * For making a new root container specify `root` parameter as `true`,
 * and the container will not depend on any parent container.
 *
 * @param params.binder - A callback which initializes the container.
 * @param params.root - Makes the container to not depend on any parent containers.
 *
 * @example
 *
 * ```tsx
 * const TOKEN = token();
 *
 * function appDependencyBinder(container: Container) {
 *   container.bindValue(TOKEN, 'value');
 * }
 *
 * function App() {
 *   return (
 *     <DependencyContainer root binder={appDependencyBinder}>
 *       <NestedComponent />
 *     </DependencyContainer>
 *   );
 * }
 * ```
 *
 */
declare function DependencyContainer(params: {
    children: ReactNode;
    root?: boolean;
    binder?: DependencyContainerBinder;
}): ReactElement;

/**
 * @category Hook
 *
 * Returns a dependency container. Throws an error in case the container is not provided.
 */
declare function useDependencyContainer(mode: 'strict'): Container;
/**
 * @category Hook
 *
 * Returns a dependency container, or `undefined` in case the container is not provided.
 */
declare function useDependencyContainer(mode?: 'optional'): Container | undefined;
/**
 * @category Hook
 *
 * Returns a dependency by token, or fails with an error.
 */
declare function useDependency<T>(token: Token<T>): T;
/**
 * @category Hook
 *
 * Returns a dependency by token, or `undefined` in case the dependency is not provided.
 */
declare function useOptionalDependency<T>(token: Token<T>): T | undefined;

export { DependencyContainer, DependencyContainerBinder, DependencyContainerParams, useDependency, useDependencyContainer, useOptionalDependency };
