import type {Container} from 'ditox';
import {createContainer} from 'ditox';
import React, {
  createContext,
  ReactElement,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
} from 'react';

export const DependencyContainerContext = createContext<Container | undefined>(
  undefined,
);

/**
 * A callback for binding dependencies to a container
 */
export type DependencyContainerBinder = (container: Container) => unknown;

/**
 * Specifies options for a new container:
 * @property binder - A callback which sets up bindings for the container.
 * @property root - If `true` then a new container does not depend on any parent containers
 */
export type DependencyContainerParams = {
  children: ReactNode;
  root?: boolean;
  binder?: DependencyContainerBinder;
};

/**
 * Provides a new dependency container to React app
 *
 * This component creates a new container and provides it to React children.
 *
 * If a `binder` callback is specified, it will be called for the new container
 * to bind it with dependencies.
 *
 * If a parent container exists, it is connected to the current one by default.
 * To create a root container specify `root` parameter as `true`,
 * and the container will not depend on any parent container.
 *
 * @param params.binder - A callback which sets up bindings for the container.
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
export function DependencyContainer(
  params: DependencyContainerParams,
): ReactElement {
  const {children, root, binder} = params;
  const parentContainer = useContext(DependencyContainerContext);

  const container = useMemo(() => {
    const container = createContainer(root ? undefined : parentContainer);
    binder?.(container);

    return container;
  }, [binder, parentContainer, root]);

  useEffect(() => {
    return () => container.removeAll();
  }, [container]);

  return (
    <DependencyContainerContext.Provider value={container}>
      {children}
    </DependencyContainerContext.Provider>
  );
}

/**
 * Provides a custom dependency container to React app
 *
 * @param params.container - a custom container
 *
 * @example
 * ```tsx
 * const container = useMemo(() => {
 *   return createContainer();
 * }
 *
 * return (
 *   <CustomDependencyContainer container={container}>
 *     {children}
 *   </CustomDependencyContainer>
 * );
 * ```
 */
export function CustomDependencyContainer(params: {
  children: ReactNode;
  container: Container;
}): ReactElement {
  const {children, container} = params;

  return (
    <DependencyContainerContext.Provider value={container}>
      {children}
    </DependencyContainerContext.Provider>
  );
}
