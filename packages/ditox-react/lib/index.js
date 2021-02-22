import { createContainer } from 'ditox';
import React, { createContext, useContext, useMemo, useEffect } from 'react';

const DependencyContainerContext = createContext(undefined);
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
function DependencyContainer(params) {
    const { children, root, binder } = params;
    const parentContainer = useContext(DependencyContainerContext);
    const container = useMemo(() => {
        const container = createContainer(root ? undefined : parentContainer);
        binder === null || binder === void 0 ? void 0 : binder(container);
        return container;
    }, [binder, parentContainer, root]);
    useEffect(() => {
        return () => container.removeAll();
    }, [container]);
    return (React.createElement(DependencyContainerContext.Provider, { value: container }, children));
}

/**
 * @internal
 */
function useDependencyContainer(mode) {
    const container = useContext(DependencyContainerContext);
    if (!container && mode === 'strict') {
        throw new Error('Container is not provided by DependencyContainer component');
    }
    return container;
}
/**
 * @category Hook
 *
 * Returns a dependency by token, or fails with an error.
 */
function useDependency(token) {
    const container = useDependencyContainer('strict');
    const value = useMemo(() => container.resolve(token), [container, token]);
    return value;
}
/**
 * @category Hook
 *
 * Returns a dependency by token, or `undefined` in case the dependency is not provided.
 */
function useOptionalDependency(token) {
    const container = useDependencyContainer();
    const value = useMemo(() => container === null || container === void 0 ? void 0 : container.get(token), [container, token]);
    return value;
}

export { DependencyContainer, useDependency, useDependencyContainer, useOptionalDependency };
//# sourceMappingURL=index.js.map
