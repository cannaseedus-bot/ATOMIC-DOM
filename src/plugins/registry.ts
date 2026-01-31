/**
 * ASXR Plugin Registry
 * Manages plugin loading, registration, and conflict resolution
 */

import type {
  Plugin,
  PluginRegistry,
  PluginResolution,
  PluginConfig,
  PluginFactory,
} from './types.js';
import type { Program } from '../parser/ast.js';

/**
 * Create a new plugin registry
 */
export function createRegistry(): PluginRegistry {
  const plugins = new Map<string, Plugin>();

  return {
    plugins,

    register(plugin: Plugin): void {
      if (plugins.has(plugin.meta.name)) {
        throw new Error(`Plugin '${plugin.meta.name}' is already registered`);
      }
      plugins.set(plugin.meta.name, plugin);
    },

    unregister(name: string): void {
      plugins.delete(name);
    },

    get(name: string): Plugin | undefined {
      return plugins.get(name);
    },

    has(name: string): boolean {
      return plugins.has(name);
    },

    all(): Plugin[] {
      return Array.from(plugins.values());
    },

    checkConflicts(): string[] {
      const conflicts: string[] = [];
      const registered = Array.from(plugins.keys());

      for (const plugin of plugins.values()) {
        if (plugin.meta.conflicts) {
          for (const conflict of plugin.meta.conflicts) {
            if (registered.includes(conflict)) {
              conflicts.push(`${plugin.meta.name} conflicts with ${conflict}`);
            }
          }
        }
      }

      return conflicts;
    },
  };
}

/**
 * Default global registry
 */
export const defaultRegistry = createRegistry();

/**
 * Register a plugin in the default registry
 */
export function registerPlugin(plugin: Plugin): void {
  defaultRegistry.register(plugin);
}

/**
 * Create a plugin from a factory with config
 */
export function createPlugin(factory: PluginFactory, config?: PluginConfig): Plugin {
  return factory(config);
}

/**
 * Resolve plugin dependencies and conflicts
 */
export function resolvePlugins(
  requested: string[],
  registry: PluginRegistry = defaultRegistry
): PluginResolution {
  const resolved: Plugin[] = [];
  const conflicts: PluginResolution['conflicts'] = [];
  const missing: string[] = [];
  const seen = new Set<string>();

  function resolve(name: string): void {
    if (seen.has(name)) return;
    seen.add(name);

    const plugin = registry.get(name);
    if (!plugin) {
      missing.push(name);
      return;
    }

    // Resolve dependencies first
    if (plugin.meta.dependencies) {
      for (const dep of plugin.meta.dependencies) {
        resolve(dep);
      }
    }

    // Check for conflicts with already resolved plugins
    if (plugin.meta.conflicts) {
      for (const conflict of plugin.meta.conflicts) {
        const conflicting = resolved.find((p) => p.meta.name === conflict);
        if (conflicting) {
          conflicts.push({
            plugins: [plugin.meta.name, conflict],
            resolution: 'error',
          });
        }
      }
    }

    resolved.push(plugin);
  }

  for (const name of requested) {
    resolve(name);
  }

  return { resolved, conflicts, missing };
}

/**
 * Apply plugin transformations to a program
 */
export function applyPlugins(
  program: Program,
  plugins: Plugin[],
  phase: 'afterParse' | 'beforeGenerate'
): Program {
  let result = program;

  for (const plugin of plugins) {
    if (plugin.hooks?.[phase]) {
      result = plugin.hooks[phase]!(result);
    }
  }

  return result;
}

/**
 * Create a transform context
 */
export function createTransformContext(
  program: Program,
  plugins: Map<string, Plugin>,
  source = ''
) {
  return {
    source,
    offset: 0,
    line: 1,
    column: 1,
    program,
    plugins,
  };
}
