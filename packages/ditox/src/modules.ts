import {Container, token, Token} from './ditox';
import {injectable} from './utils';

type AnyObject = Record<string, any>;
type EmptyObject = Record<string, never>;

type ModuleController = {
  /** Dispose the module and clean its resources */
  destroy?: () => void;
};

/**
 * Dependency module
 *
 * @example
 * ```ts
 * type LoggerModule = Module<{
 *   logger: Logger;
 * }>;
 * ```
 */
export type Module<ModuleProps extends AnyObject = EmptyObject> =
  ModuleController & ModuleProps;

type GetModuleProps<T> = T extends Module<infer Props> ? Props : never;

/**
 * Description how to bind the module in declarative way.
 *
 * @example
 * ```ts
 * const LOGGER_MODULE: ModuleDeclaration<LoggerModule> = {
 *   token: LOGGER_MODULE_TOKEN,
 *   factory: (container) => {
 *     const transport = container.resolve(TRANSPORT_TOKEN).open();
 *     return {
 *       logger: { log: (message) => transport.write(message) },
 *       destroy: () => transport.close(),
 *     }
 *   },
 *   exports: {
 *     logger: LOGGER_TOKEN,
 *   },
 * };
 * ```
 */
export type ModuleDeclaration<T extends Module<AnyObject>> = {
  /** Token for the module */
  token: Token<T>;

  /** Modules for binding  */
  imports?: ReadonlyArray<ModuleBindingEntry>;

  /** Factory of the module */
  factory: (container: Container) => T;

  /** Dictionary of module properties which are bound to tokens. */
  exports?: {
    [K in keyof GetModuleProps<T>]?: Token<GetModuleProps<T>[K]>;
  };

  /** Callback could be used to prepare an environment. It is called before binding the module. */
  beforeBinding?: (container: Container) => void;

  /** Callback could be used to export complex dependencies from the module. It is called after binding the module.  */
  afterBinding?: (container: Container) => void;
};

export type AnyModuleDeclaration = ModuleDeclaration<Module<AnyObject>>;

/**
 * Options for module binding.
 *
 * `scope` types:
 *   - `singleton` - **This is the default**. The module is created and cached by the container which registered the factory.
 *   - `scoped` - The module is created and cached by the container which starts resolving.
 */
export type BindModuleOptions = {
  scope?: 'scoped' | 'singleton';
};

export type ModuleBindingEntry =
  | ModuleDeclaration<AnyObject>
  | {
      module: ModuleDeclaration<AnyObject>;
      options: BindModuleOptions;
    };

/**
 * Binds the dependency module to the container
 * @param container - Dependency container.
 * @param moduleDeclaration - Declaration of the dependency module.
 * @param options - Options for module binding.
 *
 * @example
 * ```ts
 * bindModule(container, LOGGER_MODULE);
 * ```
 */
export function bindModule<T extends Module<AnyObject>>(
  container: Container,
  moduleDeclaration: ModuleDeclaration<T>,
  options?: BindModuleOptions,
): void {
  const {token, imports, factory, beforeBinding, afterBinding} =
    moduleDeclaration;
  const exports = moduleDeclaration.exports;

  const scope = options?.scope;

  if (beforeBinding) {
    beforeBinding(container);
  }

  if (imports) {
    bindModules(container, imports);
  }

  const exportedValueTokens = new Set<Token<unknown>>();

  if (exports) {
    const keys = Object.keys(exports);

    keys.forEach((valueKey) => {
      const valueToken = exports[valueKey];
      if (valueToken) {
        exportedValueTokens.add(valueToken);

        container.bindFactory(
          valueToken,
          injectable((module) => module[valueKey], token),
          {scope},
        );
      }
    });
  }

  container.bindFactory(token, factory, {
    scope,
    onRemoved: (module) => {
      if (module.destroy) {
        module.destroy();
      }

      exportedValueTokens.forEach((valueToken) => container.remove(valueToken));
      exportedValueTokens.clear();
    },
  });

  if (afterBinding) {
    afterBinding(container);
  }
}

/**
 * Binds dependency modules to the container
 *
 * @param container - Dependency container for binding
 * @param modules - Array of module binding entries: module declaration or `{module: ModuleDeclaration, options: BindModuleOptions}` objects.
 */
export function bindModules(
  container: Container,
  modules: ReadonlyArray<ModuleBindingEntry>,
): void {
  modules.forEach((entry) => {
    if ('module' in entry) {
      bindModule(container, entry.module, entry.options);
    } else {
      bindModule(container, entry);
    }
  });
}

/**
 * Declares a module binding
 *
 * @param declaration - a module declaration
 * @param declaration.token - optional field
 *
 *  @example
 * ```ts
 * const LOGGER_MODULE = declareModule<LoggerModule>({
 *   factory: (container) => {
 *     const transport = container.resolve(TRANSPORT_TOKEN).open();
 *     return {
 *       logger: { log: (message) => transport.write(message) },
 *       destroy: () => transport.close(),
 *     }
 *   },
 *   exports: {
 *     logger: LOGGER_TOKEN,
 *   },
 * });
 * ```
 */
export function declareModule<T extends Module<AnyObject>>(
  declaration: Omit<ModuleDeclaration<T>, 'token'> &
    Partial<Pick<ModuleDeclaration<T>, 'token'>>,
): ModuleDeclaration<T> {
  return {...declaration, token: declaration.token ?? token()};
}

/**
 * Declares bindings of several modules
 *
 * @param modules - module declaration entries
 */
export function declareModuleBindings(
  modules: ReadonlyArray<ModuleBindingEntry>,
): ModuleDeclaration<Module> {
  return declareModule({
    factory: () => ({}),
    imports: modules,
  });
}
