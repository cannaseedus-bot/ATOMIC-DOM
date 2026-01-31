/**
 * ASXR Plugin System
 * Extensible syntax and transformation plugins
 */

// Core types
export type {
  Plugin,
  PluginMeta,
  PluginConfig,
  PluginFactory,
  PluginRegistry,
  PluginResolution,
  PluginHooks,
  PluginHandler,
  SyntaxPattern,
  TransformContext,
  ASTVisitor,
} from './types.js';

// Registry
export {
  createRegistry,
  defaultRegistry,
  registerPlugin,
  createPlugin,
  resolvePlugins,
  applyPlugins,
  createTransformContext,
} from './registry.js';

// Built-in plugins
export {
  controlFlowPlugin,
  type ControlFlowConfig,
} from './control-flow.js';

export {
  jsxSyntaxPlugin,
  parseJSXElement,
  type JSXConfig,
  type JSXElement,
  type JSXAttribute,
  type JSXText,
  type JSXExpression,
} from './jsx-syntax.js';

export {
  vueSyntaxPlugin,
  parseVueDirective,
  type VueConfig,
  type VueTemplate,
  type VueElement,
  type VueDirective,
  type VueAttribute,
  type VueText,
  type VueInterpolation,
  type DirectiveHandler,
} from './vue-syntax.js';

// Plugin presets
import { controlFlowPlugin } from './control-flow.js';
import { jsxSyntaxPlugin } from './jsx-syntax.js';
import { vueSyntaxPlugin } from './vue-syntax.js';
import type { Plugin } from './types.js';

/**
 * Standard plugin preset (control-flow + jsx)
 */
export function standardPreset(): Plugin[] {
  return [
    controlFlowPlugin(),
    jsxSyntaxPlugin(),
  ];
}

/**
 * Vue plugin preset (control-flow + vue)
 */
export function vuePreset(): Plugin[] {
  return [
    controlFlowPlugin(),
    vueSyntaxPlugin(),
  ];
}

/**
 * Minimal preset (control-flow only)
 */
export function minimalPreset(): Plugin[] {
  return [
    controlFlowPlugin(),
  ];
}

/**
 * All built-in plugins (for testing - note: jsx and vue conflict)
 */
export const BUILTIN_PLUGINS = {
  'control-flow': controlFlowPlugin,
  'jsx-syntax': jsxSyntaxPlugin,
  'vue-syntax': vueSyntaxPlugin,
} as const;
