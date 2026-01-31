/**
 * ASXR Vue Syntax Plugin
 * Transforms Vue-style templates into ASXR DOM blocks
 */

import type { Plugin, PluginConfig } from './types.js';
import type { Program } from '../parser/ast.js';

export interface VueConfig extends PluginConfig {
  /** Enable v-model transformation */
  vModel?: boolean;
  /** Enable v-on shorthand @ */
  eventShorthand?: boolean;
  /** Enable v-bind shorthand : */
  bindShorthand?: boolean;
  /** Custom directive handlers */
  customDirectives?: Record<string, DirectiveHandler>;
}

export type DirectiveHandler = (
  value: string,
  arg: string | null,
  modifiers: string[]
) => Record<string, unknown> | null;

const DEFAULT_CONFIG: VueConfig = {
  vModel: true,
  eventShorthand: true,
  bindShorthand: true,
};

/**
 * Vue Template representation (plugin-internal)
 */
export interface VueTemplate {
  type: 'VueTemplate';
  content: VueElement[];
  start: { line: number; column: number; offset: number };
  end: { line: number; column: number; offset: number };
}

export interface VueElement {
  type: 'VueElement';
  tagName: string;
  directives: VueDirective[];
  attributes: VueAttribute[];
  children: (VueElement | VueText | VueInterpolation)[];
  start: { line: number; column: number; offset: number };
  end: { line: number; column: number; offset: number };
}

export interface VueDirective {
  name: string;
  arg: string | null;
  modifiers: string[];
  value: string;
}

export interface VueAttribute {
  name: string;
  value: string | null;
  dynamic?: boolean;
}

export interface VueText {
  type: 'VueText';
  value: string;
  start: { line: number; column: number; offset: number };
  end: { line: number; column: number; offset: number };
}

export interface VueInterpolation {
  type: 'VueInterpolation';
  expression: string;
  start: { line: number; column: number; offset: number };
  end: { line: number; column: number; offset: number };
}

const makePos = (offset: number) => ({ line: 1, column: offset, offset });

/**
 * Transform Vue directive to ASXR property
 */
function directiveToProperty(
  directive: VueDirective,
  config: VueConfig,
  pos: { start: ReturnType<typeof makePos>; end: ReturnType<typeof makePos> }
): Record<string, unknown> | null {
  const { start, end } = pos;

  switch (directive.name) {
    case 'v-bind':
    case 'bind': {
      return {
        type: 'PropertyAssignment',
        name: directive.arg ?? 'value',
        value: {
          type: 'Reference',
          path: directive.value,
          start,
          end,
        },
        isAtProperty: false,
        start,
        end,
      };
    }

    case 'v-on':
    case 'on': {
      const eventName = directive.arg ?? 'click';
      let handler = directive.value;

      // Apply modifiers
      if (directive.modifiers.includes('prevent')) {
        handler = `(e) => { e.preventDefault(); ${handler}(e); }`;
      }
      if (directive.modifiers.includes('stop')) {
        handler = `(e) => { e.stopPropagation(); ${handler}(e); }`;
      }

      return {
        type: 'PropertyAssignment',
        name: `on${eventName.charAt(0).toUpperCase()}${eventName.slice(1)}`,
        value: {
          type: 'Identifier',
          name: handler,
          start,
          end,
        },
        isAtProperty: false,
        start,
        end,
      };
    }

    case 'v-model': {
      if (!config.vModel) return null;
      const prop = directive.arg ?? 'value';
      return {
        type: 'PropertyAssignment',
        name: prop,
        value: {
          type: 'Reference',
          path: directive.value,
          start,
          end,
        },
        isAtProperty: false,
        start,
        end,
      };
    }

    case 'v-show': {
      return {
        type: 'PropertyAssignment',
        name: 'style',
        value: {
          type: 'ObjectExpression',
          properties: [
            {
              name: 'display',
              value: {
                type: 'ConditionalExpression',
                test: { type: 'Reference', path: directive.value, start, end },
                consequent: { type: 'Literal', value: 'block', start, end },
                alternate: { type: 'Literal', value: 'none', start, end },
                start,
                end,
              },
            },
          ],
          start,
          end,
        },
        isAtProperty: false,
        start,
        end,
      };
    }

    case 'v-html': {
      return {
        type: 'PropertyAssignment',
        name: 'innerHTML',
        value: {
          type: 'Reference',
          path: directive.value,
          start,
          end,
        },
        isAtProperty: false,
        start,
        end,
      };
    }

    case 'v-text': {
      return {
        type: 'PropertyAssignment',
        name: 'textContent',
        value: {
          type: 'Reference',
          path: directive.value,
          start,
          end,
        },
        isAtProperty: false,
        start,
        end,
      };
    }

    case 'v-pre':
    case 'v-cloak':
    case 'v-once':
      return null;

    default:
      if (config.customDirectives?.[directive.name]) {
        return config.customDirectives[directive.name](
          directive.value,
          directive.arg,
          directive.modifiers
        );
      }
      return null;
  }
}

/**
 * Transform Vue element to DOM block
 */
function vueElementToDomBlock(
  element: VueElement,
  config: VueConfig
): Record<string, unknown> {
  const { start, end } = element;

  // Check for v-if directive - wrap in IfStatement
  const vIf = element.directives.find((d) => d.name === 'v-if');
  if (vIf) {
    const domBlock = createDomBlockFromElement(element, config);
    return {
      type: 'IfStatement',
      condition: {
        type: 'Reference',
        path: vIf.value,
        start,
        end,
      },
      consequent: domBlock,
      start,
      end,
    };
  }

  // Check for v-for directive - wrap in ForStatement
  const vFor = element.directives.find((d) => d.name === 'v-for');
  if (vFor) {
    const domBlock = createDomBlockFromElement(element, config);
    const forMatch = vFor.value.match(/^\s*(?:\(([^)]+)\)|(\w+))\s+in\s+(.+)$/);
    if (forMatch) {
      const [, destructure, single, collection] = forMatch;
      const iterVar = destructure ?? single;

      return {
        type: 'ForStatement',
        init: {
          type: 'Identifier',
          name: iterVar,
          start,
          end,
        },
        test: {
          type: 'Reference',
          path: collection.trim(),
          start,
          end,
        },
        body: domBlock,
        start,
        end,
      };
    }
  }

  return createDomBlockFromElement(element, config);
}

/**
 * Create a DOM block from a Vue element (without control flow)
 */
function createDomBlockFromElement(
  element: VueElement,
  config: VueConfig
): Record<string, unknown> {
  const { start, end } = element;
  const body: Array<Record<string, unknown>> = [];

  // Convert attributes
  for (const attr of element.attributes) {
    if (attr.dynamic) {
      body.push({
        type: 'PropertyAssignment',
        name: attr.name,
        value: {
          type: 'Reference',
          path: attr.value ?? '',
          start,
          end,
        },
        isAtProperty: false,
        start,
        end,
      });
    } else {
      body.push({
        type: 'PropertyAssignment',
        name: attr.name,
        value: {
          type: 'Literal',
          value: attr.value ?? true,
          start,
          end,
        },
        isAtProperty: false,
        start,
        end,
      });
    }
  }

  // Convert directives
  for (const directive of element.directives) {
    if (directive.name === 'v-if' || directive.name === 'v-for') continue;

    const prop = directiveToProperty(directive, config, { start, end });
    if (prop) {
      body.push(prop);
    }
  }

  // Convert children
  const childNodes: Array<Record<string, unknown>> = [];
  for (const child of element.children) {
    if (child.type === 'VueElement') {
      childNodes.push(vueElementToDomBlock(child, config));
    } else if (child.type === 'VueText') {
      const text = child.value.trim();
      if (text) {
        childNodes.push({
          type: 'DomBlock',
          selector: 'text',
          body: [
            {
              type: 'PropertyAssignment',
              name: 'content',
              value: { type: 'Literal', value: text, start: child.start, end: child.end },
              isAtProperty: false,
              start: child.start,
              end: child.end,
            },
          ],
          start: child.start,
          end: child.end,
        });
      }
    } else if (child.type === 'VueInterpolation') {
      childNodes.push({
        type: 'DomBlock',
        selector: 'expr',
        body: [
          {
            type: 'PropertyAssignment',
            name: 'value',
            value: {
              type: 'Reference',
              path: child.expression,
              start: child.start,
              end: child.end,
            },
            isAtProperty: false,
            start: child.start,
            end: child.end,
          },
        ],
        start: child.start,
        end: child.end,
      });
    }
  }

  if (childNodes.length > 0) {
    body.push({
      type: 'PropertyAssignment',
      name: 'children',
      value: {
        type: 'ArrayExpression',
        elements: childNodes,
        start,
        end,
      },
      isAtProperty: false,
      start,
      end,
    });
  }

  return {
    type: 'DomBlock',
    selector: element.tagName,
    body,
    start,
    end,
  };
}

/**
 * Parse Vue directive from attribute string
 */
export function parseVueDirective(attr: string, value: string): VueDirective | null {
  const match = attr.match(/^(v-\w+|[@:])?(?::(\w+))?(.*)$/);
  if (!match) return null;

  let [, name, arg, modifierStr] = match;

  // Handle shorthand
  if (attr.startsWith('@')) {
    name = 'v-on';
    arg = attr.slice(1).split('.')[0];
    modifierStr = attr.slice(1 + arg.length);
  } else if (attr.startsWith(':')) {
    name = 'v-bind';
    arg = attr.slice(1).split('.')[0];
    modifierStr = attr.slice(1 + arg.length);
  }

  if (!name) return null;

  const modifiers = modifierStr.split('.').filter((m) => m.length > 0);

  return {
    name,
    arg: arg ?? null,
    modifiers,
    value,
  };
}

/**
 * Create the vue-syntax plugin
 */
export function vueSyntaxPlugin(config?: VueConfig): Plugin {
  const cfg = { ...DEFAULT_CONFIG, ...config };

  return {
    meta: {
      name: 'vue-syntax',
      version: '1.0.0',
      description: 'Vue template syntax support for ASXR',
      conflicts: ['jsx-syntax'],
    },

    syntax: [
      {
        pattern: /<template>([\s\S]*?)<\/template>/,
        astNode: 'VueTemplate',
        priority: 90,
      },
      {
        pattern: /v-if="([^"]+)"/,
        astNode: 'VueIfDirective',
        priority: 100,
      },
      {
        pattern: /v-for="([^"]+)"/,
        astNode: 'VueForDirective',
        priority: 100,
      },
      {
        pattern: /v-on:(\w+)(?:\.(\w+))*="([^"]+)"/,
        astNode: 'VueOnDirective',
        priority: 95,
      },
      {
        pattern: /@(\w+)(?:\.(\w+))*="([^"]+)"/,
        astNode: 'VueOnShorthand',
        priority: 95,
      },
      {
        pattern: /v-bind:(\w+)="([^"]+)"/,
        astNode: 'VueBindDirective',
        priority: 95,
      },
      {
        pattern: /:(\w+)="([^"]+)"/,
        astNode: 'VueBindShorthand',
        priority: 95,
      },
      {
        pattern: /v-model(?::(\w+))?="([^"]+)"/,
        astNode: 'VueModelDirective',
        priority: 95,
      },
      {
        pattern: /\{\{\s*([^}]+)\s*\}\}/,
        astNode: 'VueInterpolation',
        priority: 80,
      },
    ],

    handlers: {
      vue_to_dom(node: unknown) {
        const n = node as Record<string, unknown>;
        if (n.type !== 'VueTemplate' && n.type !== 'VueElement') {
          return null;
        }
        return node;
      },

      vue_directive_handler(node: unknown) {
        return node;
      },
    },

    hooks: {
      beforeParse(source: string): string {
        let result = source;

        // Convert @event to v-on:event
        if (cfg.eventShorthand) {
          result = result.replace(/@(\w+)=/g, 'v-on:$1=');
        }

        // Convert :prop to v-bind:prop
        if (cfg.bindShorthand) {
          result = result.replace(/:(\w+)=/g, 'v-bind:$1=');
        }

        return result;
      },

      afterParse(program: Program) {
        // Walk and transform Vue nodes
        function walk(node: Record<string, unknown>): void {
          if (!node || typeof node !== 'object') return;

          // Transform VueElement nodes
          if (node.type === 'VueElement') {
            const transformed = vueElementToDomBlock(node as unknown as VueElement, cfg);
            Object.assign(node, transformed);
          }

          // Transform VueTemplate nodes
          if (node.type === 'VueTemplate') {
            const template = node as unknown as VueTemplate;
            const transformed = template.content.map((el) => vueElementToDomBlock(el, cfg));
            Object.assign(node, {
              type: 'AtomicBlock',
              blockType: 'atomic',
              body: transformed,
              start: template.start,
              end: template.end,
            });
          }

          // Recurse
          for (const key of Object.keys(node)) {
            const value = node[key];
            if (Array.isArray(value)) {
              value.forEach((item) => walk(item as Record<string, unknown>));
            } else if (value && typeof value === 'object') {
              walk(value as Record<string, unknown>);
            }
          }
        }

        walk(program as unknown as Record<string, unknown>);
        return program;
      },
    },
  };
}

/**
 * Default export
 */
export default vueSyntaxPlugin;
