/**
 * ASXR Plugin System Types
 * Core interfaces for plugin architecture
 */

import type { Program } from '../parser/ast.js';

/**
 * Plugin metadata
 */
export interface PluginMeta {
  name: string;
  version: string;
  description?: string;
  author?: string;
  conflicts?: string[];
  dependencies?: string[];
}

/**
 * Syntax pattern for plugin-provided syntax
 */
export interface SyntaxPattern {
  /** Regex pattern to match */
  pattern: RegExp;
  /** AST node type to create */
  astNode: string;
  /** Priority (higher = matched first) */
  priority: number;
}

/**
 * Context passed to transformers
 */
export interface TransformContext {
  source: string;
  offset: number;
  line: number;
  column: number;
  program: Program;
  plugins: Map<string, Plugin>;
}

/**
 * AST visitor for transformations
 */
export interface ASTVisitor {
  enter?: (node: unknown, parent: unknown) => unknown;
  leave?: (node: unknown, parent: unknown) => unknown;
}

/**
 * Plugin handler function
 */
export type PluginHandler = (node: unknown, context?: TransformContext) => unknown;

/**
 * Plugin hooks
 */
export interface PluginHooks {
  /** Called before parsing */
  beforeParse?: (source: string) => string;
  /** Called after parsing */
  afterParse?: (program: Program) => Program;
  /** Called before code generation */
  beforeGenerate?: (program: Program) => Program;
  /** Called after code generation */
  afterGenerate?: (code: string) => string;
  /** Custom AST visitors */
  visitors?: Record<string, ASTVisitor>;
}

/**
 * Plugin interface
 */
export interface Plugin {
  meta: PluginMeta;
  syntax?: SyntaxPattern[];
  handlers?: Record<string, PluginHandler>;
  hooks?: PluginHooks;
}

/**
 * Plugin configuration options
 */
export interface PluginConfig {
  [key: string]: unknown;
}

/**
 * Plugin factory function
 */
export type PluginFactory = (config?: PluginConfig) => Plugin;

/**
 * Plugin registry for loaded plugins
 */
export interface PluginRegistry {
  plugins: Map<string, Plugin>;
  register(plugin: Plugin): void;
  unregister(name: string): void;
  get(name: string): Plugin | undefined;
  has(name: string): boolean;
  all(): Plugin[];
  checkConflicts(): string[];
}

/**
 * Plugin resolution result
 */
export interface PluginResolution {
  resolved: Plugin[];
  conflicts: Array<{ plugins: [string, string]; resolution: 'prefer' | 'merge' | 'error' }>;
  missing: string[];
}
