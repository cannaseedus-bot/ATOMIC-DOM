/**
 * ASXR JSX Syntax Plugin
 * Transforms JSX elements into ASXR DOM blocks
 */

import type { Plugin, PluginConfig } from './types.js';
import type { Program } from '../parser/ast.js';

export interface JSXConfig extends PluginConfig {
  /** Pragma for createElement (default: 'h') */
  pragma?: string;
  /** Fragment pragma (default: 'Fragment') */
  pragmaFrag?: string;
  /** Use classic runtime vs automatic */
  runtime?: 'classic' | 'automatic';
  /** Import source for automatic runtime */
  importSource?: string;
  /** Convert class to className */
  classToClassName?: boolean;
}

const DEFAULT_CONFIG: JSXConfig = {
  pragma: 'h',
  pragmaFrag: 'Fragment',
  runtime: 'classic',
  importSource: 'atomic-dom',
  classToClassName: true,
};

/**
 * JSX Element representation (plugin-internal)
 */
export interface JSXElement {
  type: 'JSXElement';
  tagName: string;
  attributes: JSXAttribute[];
  children: (JSXElement | JSXText | JSXExpression)[];
  selfClosing: boolean;
  start: { line: number; column: number; offset: number };
  end: { line: number; column: number; offset: number };
}

export interface JSXAttribute {
  name: string;
  value: unknown;
  spread?: boolean;
}

export interface JSXText {
  type: 'JSXText';
  value: string;
  start: { line: number; column: number; offset: number };
  end: { line: number; column: number; offset: number };
}

export interface JSXExpression {
  type: 'JSXExpression';
  expression: string;
  start: { line: number; column: number; offset: number };
  end: { line: number; column: number; offset: number };
}

/**
 * Transform JSX element to DOM block structure
 */
function jsxToDomBlock(jsx: JSXElement, config: JSXConfig): Record<string, unknown> {
  const body: Array<Record<string, unknown>> = [];

  // Convert attributes to properties
  for (const attr of jsx.attributes) {
    let name = attr.name;

    // Apply className conversion
    if (config.classToClassName && name === 'class') {
      name = 'className';
    }

    if (attr.spread) {
      body.push({
        type: 'PropertyAssignment',
        name: '...',
        value: attr.value,
        isAtProperty: false,
        start: jsx.start,
        end: jsx.end,
      });
    } else {
      body.push({
        type: 'PropertyAssignment',
        name,
        value: attr.value ?? { type: 'Literal', value: true, start: jsx.start, end: jsx.end },
        isAtProperty: false,
        start: jsx.start,
        end: jsx.end,
      });
    }
  }

  // Convert children
  const childNodes: Array<Record<string, unknown>> = [];
  for (const child of jsx.children) {
    if (child.type === 'JSXElement') {
      childNodes.push(jsxToDomBlock(child, config));
    } else if (child.type === 'JSXText') {
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
    } else if (child.type === 'JSXExpression') {
      childNodes.push({
        type: 'DomBlock',
        selector: 'expr',
        body: [
          {
            type: 'PropertyAssignment',
            name: 'value',
            value: {
              type: 'Identifier',
              name: child.expression,
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
        start: jsx.start,
        end: jsx.end,
      },
      isAtProperty: false,
      start: jsx.start,
      end: jsx.end,
    });
  }

  return {
    type: 'DomBlock',
    selector: jsx.tagName,
    body,
    start: jsx.start,
    end: jsx.end,
  };
}

/**
 * Parse JSX from source (simplified parser)
 */
export function parseJSXElement(source: string, offset: number): JSXElement | null {
  const match = source.slice(offset).match(/^<([A-Za-z][A-Za-z0-9]*)/);
  if (!match) return null;

  const tagName = match[1];
  let pos = offset + match[0].length;
  const attributes: JSXAttribute[] = [];
  const children: (JSXElement | JSXText | JSXExpression)[] = [];

  const makePos = (col: number) => ({ line: 1, column: col, offset: col });

  // Parse attributes
  while (pos < source.length) {
    // Skip whitespace
    while (/\s/.test(source[pos])) pos++;

    // Check for self-closing
    if (source.slice(pos, pos + 2) === '/>') {
      return {
        type: 'JSXElement',
        tagName,
        attributes,
        children: [],
        selfClosing: true,
        start: makePos(offset),
        end: makePos(pos + 2),
      };
    }

    // Check for opening tag end
    if (source[pos] === '>') {
      pos++;
      break;
    }

    // Parse attribute
    const attrMatch = source.slice(pos).match(/^([A-Za-z][A-Za-z0-9-]*)(?:=(?:"([^"]*)"|'([^']*)'|\{([^}]*)\}))?/);
    if (attrMatch) {
      const [full, name, dq, sq, expr] = attrMatch;
      let value: unknown = null;

      if (dq !== undefined || sq !== undefined) {
        value = {
          type: 'Literal',
          value: dq ?? sq,
          start: makePos(pos),
          end: makePos(pos + full.length),
        };
      } else if (expr !== undefined) {
        value = {
          type: 'Identifier',
          name: expr.trim(),
          start: makePos(pos),
          end: makePos(pos + full.length),
        };
      }

      attributes.push({ name, value });
      pos += full.length;
    } else {
      break;
    }
  }

  // Parse children until closing tag
  const closeTag = `</${tagName}>`;
  while (pos < source.length) {
    // Check for closing tag
    if (source.slice(pos, pos + closeTag.length) === closeTag) {
      pos += closeTag.length;
      break;
    }

    // Check for child element
    if (source[pos] === '<' && /[A-Za-z]/.test(source[pos + 1])) {
      const child = parseJSXElement(source, pos);
      if (child) {
        children.push(child);
        pos = child.end.column;
        continue;
      }
    }

    // Check for expression
    if (source[pos] === '{') {
      const closeIdx = source.indexOf('}', pos);
      if (closeIdx !== -1) {
        const expr = source.slice(pos + 1, closeIdx).trim();
        children.push({
          type: 'JSXExpression',
          expression: expr,
          start: makePos(pos),
          end: makePos(closeIdx + 1),
        });
        pos = closeIdx + 1;
        continue;
      }
    }

    // Text content
    let textEnd = pos;
    while (textEnd < source.length && source[textEnd] !== '<' && source[textEnd] !== '{') {
      textEnd++;
    }
    if (textEnd > pos) {
      const text = source.slice(pos, textEnd);
      if (text.trim()) {
        children.push({
          type: 'JSXText',
          value: text,
          start: makePos(pos),
          end: makePos(textEnd),
        });
      }
      pos = textEnd;
    }
  }

  return {
    type: 'JSXElement',
    tagName,
    attributes,
    children,
    selfClosing: false,
    start: makePos(offset),
    end: makePos(pos),
  };
}

/**
 * Create the jsx-syntax plugin
 */
export function jsxSyntaxPlugin(config?: JSXConfig): Plugin {
  const cfg = { ...DEFAULT_CONFIG, ...config };

  return {
    meta: {
      name: 'jsx-syntax',
      version: '1.0.0',
      description: 'JSX syntax support for ASXR',
      conflicts: ['vue-syntax'],
    },

    syntax: [
      {
        pattern: /<([A-Z][A-Za-z0-9]*)([^>]*)>([\s\S]*?)<\/\1>/,
        astNode: 'JSXElement',
        priority: 90,
      },
      {
        pattern: /<([A-Z][A-Za-z0-9]*)([^>]*)\s*\/>/,
        astNode: 'JSXSelfClosingElement',
        priority: 90,
      },
      {
        pattern: /<>[\s\S]*?<\/>/,
        astNode: 'JSXFragment',
        priority: 85,
      },
    ],

    handlers: {
      /**
       * Transform JSX element to DOM operations
       */
      jsx_to_dom(node: unknown) {
        const n = node as Record<string, unknown>;
        if (n.type !== 'JSXElement') return null;
        return jsxToDomBlock(node as unknown as JSXElement, cfg) as never;
      },

      /**
       * Transform JSX props to ASXR properties
       */
      jsx_props_transform(node: unknown) {
        const n = node as Record<string, unknown>;
        if (n.type !== 'JSXElement') return null;

        const jsx = node as unknown as JSXElement;
        for (const attr of jsx.attributes) {
          // Convert React-style props
          if (attr.name === 'className' && !cfg.classToClassName) {
            attr.name = 'class';
          }
          if (attr.name === 'htmlFor') {
            attr.name = 'for';
          }
        }

        return node;
      },
    },

    hooks: {
      beforeParse(source: string): string {
        // Preprocess JSX fragments
        return source.replace(/<>/g, '<Fragment>').replace(/<\/>/g, '</Fragment>');
      },

      afterParse(program: Program) {
        // Walk and transform JSX nodes
        function walk(node: Record<string, unknown>): void {
          if (!node || typeof node !== 'object') return;

          // Transform JSXElement nodes
          if (node.type === 'JSXElement') {
            const transformed = jsxToDomBlock(node as unknown as JSXElement, cfg);
            Object.assign(node, transformed);
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
export default jsxSyntaxPlugin;
