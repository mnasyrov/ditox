import type { Module, ModuleDeclaration } from 'ditox';
import { bindModule } from 'ditox';
import React, { ReactElement, ReactNode, useCallback } from 'react';
import {
  DependencyContainer,
  DependencyContainerBinder,
} from './DependencyContainer';

/**
 * Binds the module to a new dependency container.
 *
 * If a parent container exists, it is connected to the current one by default.
 *
 * @param params.module - Module declaration for binding
 * @param params.scope - Optional scope for binding: `singleton` (default) or `scoped`.
 *
 * @example
 *
 * ```tsx
 * const LOGGER_MODULE: ModuleDeclaration<LoggerModule> = {};
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
export function DependencyModule(params: {
  children: ReactNode;
  module: ModuleDeclaration<Module<Record<string, unknown>>>;
  scope?: 'scoped' | 'singleton';
}): ReactElement {
  const { children, module, scope } = params;

  const binder: DependencyContainerBinder = useCallback(
    (container) => bindModule(container, module, { scope }),
    [module, scope],
  );

  return <DependencyContainer binder={binder}>{children}</DependencyContainer>;
}
