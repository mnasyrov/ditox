import { Container, Token, ModuleDeclaration, Module } from 'ditox';
import { ReactNode, ReactElement } from 'react';

/**
 * A callback for binding dependencies to a container
 */
declare type DependencyContainerBinder = (container: Container) => unknown;
/**
 * Specifies an existed container or options for a new container:
 * @property binder - A callback which setup bindings to the container.
 * @property root - If `true` then a new container does not depend on any parent containers
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
 * @param params.binder - A callback which setup bindings to the container.
 * @param params.root - If `true` then a new container does not depend on any parent containers
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
declare function DependencyContainer(params: DependencyContainerParams): ReactElement;

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

/**
 * @category Component
 *
 * Binds the module to a new dependency container.
 *
 * If a parent container is exist, it is connected to the current one by default.
 *
 * @param params.module - Module declaration for binding
 * @param params.scope - Optional scope for binding: `singleton` (default) or `scoped`.
 *
 * @example
 *
 * ```tsx
 * const LOGGER_MODULE: ModuleDeclaration<LoggerModule> = {
 *
 * function App() {
 *   return (
 *     <DependencyModule module={LOGGER_MODULE}>
 *       <NestedComponent />
 *     </DependencyModule>
 *   );
 * }
 * ```
 */
declare function DependencyModule(params: {
    children: ReactNode;
    module: ModuleDeclaration<Module<Record<string, unknown>>>;
    scope?: 'scoped' | 'singleton';
}): ReactElement;

export { DependencyContainer, DependencyContainerBinder, DependencyContainerParams, DependencyModule, useDependency, useDependencyContainer, useOptionalDependency };
