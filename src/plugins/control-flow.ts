/**
 * ASXR Control Flow Plugin
 * Provides @if, @for, @while, @switch statements
 */

import type { Plugin, PluginConfig } from './types.js';
import type { Program } from '../parser/ast.js';

export interface ControlFlowConfig extends PluginConfig {
  /** Enable loop optimization */
  optimizeLoops?: boolean;
  /** Maximum loop iterations (for static analysis) */
  maxIterations?: number;
  /** Enable dead code elimination */
  deadCodeElimination?: boolean;
}

const DEFAULT_CONFIG: ControlFlowConfig = {
  optimizeLoops: true,
  maxIterations: 10000,
  deadCodeElimination: true,
};

/**
 * Create the control-flow plugin
 */
export function controlFlowPlugin(config?: ControlFlowConfig): Plugin {
  const cfg = { ...DEFAULT_CONFIG, ...config };

  return {
    meta: {
      name: 'control-flow',
      version: '1.0.0',
      description: 'Control flow statements (@if, @for, @while, @switch) for ASXR',
    },

    syntax: [
      {
        pattern: /@if\s*\((.+?)\)\s*\{/,
        astNode: 'IfStatement',
        priority: 100,
      },
      {
        pattern: /@else\s+if\s*\((.+?)\)\s*\{/,
        astNode: 'ElseIfClause',
        priority: 100,
      },
      {
        pattern: /@else\s*\{/,
        astNode: 'ElseClause',
        priority: 100,
      },
      {
        pattern: /@for\s*\((.+?)\)\s*\{/,
        astNode: 'ForStatement',
        priority: 100,
      },
      {
        pattern: /@while\s*\((.+?)\)\s*\{/,
        astNode: 'WhileStatement',
        priority: 100,
      },
      {
        pattern: /@do\s*\{/,
        astNode: 'DoWhileStatement',
        priority: 100,
      },
      {
        pattern: /@switch\s*\((.+?)\)\s*\{/,
        astNode: 'SwitchStatement',
        priority: 100,
      },
      {
        pattern: /@case\s+(.+?):/,
        astNode: 'SwitchCase',
        priority: 90,
      },
      {
        pattern: /@default:/,
        astNode: 'DefaultCase',
        priority: 90,
      },
      {
        pattern: /@break;/,
        astNode: 'BreakStatement',
        priority: 80,
      },
      {
        pattern: /@continue;/,
        astNode: 'ContinueStatement',
        priority: 80,
      },
    ],

    handlers: {
      /**
       * Transform if statements for optimal DOM batching
       */
      if_transformer(node: unknown) {
        const n = node as Record<string, unknown>;
        if (n.type !== 'IfStatement') return null;
        return node;
      },

      /**
       * Optimize loop iterations
       */
      loop_optimizer(node: unknown) {
        const n = node as Record<string, unknown>;
        if (n.type !== 'ForStatement' && n.type !== 'WhileStatement') {
          return null;
        }

        // Add iteration limit metadata for runtime safety
        n._maxIterations = cfg.maxIterations;
        return node;
      },
    },

    hooks: {
      afterParse(program: Program) {
        // Walk the AST and optimize control flow
        function walkAndOptimize(node: Record<string, unknown>): void {
          if (!node || typeof node !== 'object') return;

          // Dead code elimination for static conditions
          if (cfg.deadCodeElimination && node.type === 'IfStatement') {
            const condition = node.condition as Record<string, unknown>;
            if (condition?.type === 'Literal') {
              if (condition.value === true) {
                node._staticTrue = true;
              } else if (condition.value === false) {
                node._staticFalse = true;
              }
            }
          }

          // Mark potentially infinite loops
          if (cfg.optimizeLoops) {
            if (node.type === 'WhileStatement') {
              const condition = node.condition as Record<string, unknown>;
              if (condition?.type === 'Literal' && condition.value === true) {
                node._potentiallyInfinite = true;
              }
            }
            if (node.type === 'ForStatement' && !node.update) {
              node._potentiallyInfinite = true;
            }
          }

          // Recurse into children
          for (const key of Object.keys(node)) {
            const value = node[key];
            if (Array.isArray(value)) {
              value.forEach((item) => walkAndOptimize(item as Record<string, unknown>));
            } else if (value && typeof value === 'object') {
              walkAndOptimize(value as Record<string, unknown>);
            }
          }
        }

        walkAndOptimize(program as unknown as Record<string, unknown>);
        return program;
      },
    },
  };
}

/**
 * Default export
 */
export default controlFlowPlugin;
