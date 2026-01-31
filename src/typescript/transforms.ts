/**
 * ASXR TypeScript AST Transforms
 * Utilities for transforming between ASXR AST and TypeScript code
 */

import type { Block, DomNode } from '../runtime/index.js';

/**
 * Program structure for transformations
 */
export interface Program {
  version: string;
  blocks: Block[];
}

/**
 * Atomic block with children
 */
export interface AtomicBlock extends Block {
  children?: DomNode[];
}

/**
 * Expression placeholder for visitor
 */
export interface Expression {
  type: string;
  [key: string]: unknown;
}

/**
 * Transform options
 */
export interface TransformOptions {
  /** Generate class-based output */
  classStyle?: boolean;
  /** Generate functional output */
  functionalStyle?: boolean;
  /** Include runtime imports */
  includeImports?: boolean;
  /** Target module format */
  moduleFormat?: 'esm' | 'commonjs';
  /** Indentation string */
  indent?: string;
}

const DEFAULT_OPTIONS: Required<TransformOptions> = {
  classStyle: true,
  functionalStyle: false,
  includeImports: true,
  moduleFormat: 'esm',
  indent: '  ',
};

/**
 * Transform ASXR AST to TypeScript code
 */
export function transformToTypeScript(program: Program, options?: TransformOptions): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const lines: string[] = [];

  // Add imports
  if (opts.includeImports) {
    if (opts.moduleFormat === 'esm') {
      lines.push("import { Atomic, Component, State, Prop, Reactive, On } from 'atomic-dom/typescript';");
    } else {
      lines.push("const { Atomic, Component, State, Prop, Reactive, On } = require('atomic-dom/typescript');");
    }
    lines.push('');
  }

  // Transform each block
  for (const block of program.blocks) {
    if (opts.classStyle) {
      lines.push(blockToClass(block, opts));
    } else {
      lines.push(blockToFunction(block, opts));
    }
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Transform a block to a TypeScript class
 */
function blockToClass(block: Block, opts: Required<TransformOptions>): string {
  const lines: string[] = [];
  const indent = opts.indent;

  // Decorator
  const decoratorName = getDecoratorName(block.type);
  const id = block.id ? `'${block.id}'` : '';
  lines.push(`@${decoratorName}(${id})`);

  // Class declaration
  const className = pascalCase(block.id ?? 'Block');
  lines.push(`export class ${className} {`);

  // Properties
  if (block.props) {
    for (const [key, value] of Object.entries(block.props)) {
      const propType = inferTypeFromValue(value);
      if (isReactiveProperty(key, block)) {
        lines.push(`${indent}@Reactive(${formatValue(value)})`);
        lines.push(`${indent}${key}: ${propType};`);
      } else {
        lines.push(`${indent}@Prop({ default: ${formatValue(value)} })`);
        lines.push(`${indent}${key}: ${propType};`);
      }
      lines.push('');
    }
  }

  // Children (DOM nodes)
  if (block.type === 'atomic' || block.type === 'component') {
    const atomicBlock = block as AtomicBlock;
    if (atomicBlock.children && atomicBlock.children.length > 0) {
      lines.push(`${indent}render(): DomNode[] {`);
      lines.push(`${indent}${indent}return [`);
      for (const child of atomicBlock.children) {
        lines.push(`${indent}${indent}${indent}${domNodeToLiteral(child, opts)},`);
      }
      lines.push(`${indent}${indent}];`);
      lines.push(`${indent}}`);
    }
  }

  lines.push('}');

  return lines.join('\n');
}

/**
 * Transform a block to a functional component
 */
function blockToFunction(block: Block, opts: Required<TransformOptions>): string {
  const lines: string[] = [];
  const indent = opts.indent;

  const funcName = camelCase(block.id ?? 'block');
  const propsType = generatePropsType(block);

  lines.push(`export function ${funcName}(props: ${propsType}): Block {`);
  lines.push(`${indent}return {`);
  lines.push(`${indent}${indent}type: '${block.type}',`);
  if (block.id) {
    lines.push(`${indent}${indent}id: '${block.id}',`);
  }
  lines.push(`${indent}${indent}props: { ...props },`);

  // Children
  if (block.type === 'atomic' || block.type === 'component') {
    const atomicBlock = block as AtomicBlock;
    if (atomicBlock.children && atomicBlock.children.length > 0) {
      lines.push(`${indent}${indent}children: [`);
      for (const child of atomicBlock.children) {
        lines.push(`${indent}${indent}${indent}${domNodeToLiteral(child, opts)},`);
      }
      lines.push(`${indent}${indent}],`);
    }
  }

  lines.push(`${indent}};`);
  lines.push('}');

  return lines.join('\n');
}

/**
 * Transform TypeScript class back to ASXR AST
 */
export function transformFromClass(code: string): Program {
  // Simple regex-based parsing for demonstration
  // In production, use TypeScript compiler API
  const blocks: Block[] = [];

  const classRegex = /@(Atomic|Component|State)\(['"]?(\w+)?['"]?\)?\s*export\s+class\s+(\w+)/g;
  let match;

  while ((match = classRegex.exec(code)) !== null) {
    const [, decorator, id, className] = match;
    blocks.push({
      type: decorator.toLowerCase() as 'atomic' | 'component' | 'state',
      id: id ?? className,
      props: {},
    });
  }

  return {
    version: '1.0',
    blocks,
  };
}

/**
 * Generate TypeScript interface from ASXR block
 */
export function generateInterface(block: Block): string {
  const lines: string[] = [];
  const name = pascalCase(block.id ?? 'Block') + 'Props';

  lines.push(`export interface ${name} {`);

  if (block.props) {
    for (const [key, value] of Object.entries(block.props)) {
      const propType = inferTypeFromValue(value);
      lines.push(`  ${key}?: ${propType};`);
    }
  }

  lines.push('}');

  return lines.join('\n');
}

/**
 * Generate TypeScript type from ASXR program
 */
export function generateTypes(program: Program): string {
  const lines: string[] = [];

  lines.push('// Auto-generated types from ASXR');
  lines.push("import type { Block, DomNode } from 'atomic-dom';");
  lines.push('');

  for (const block of program.blocks) {
    lines.push(generateInterface(block));
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Convert DomNode to TypeScript object literal
 */
function domNodeToLiteral(node: DomNode, opts: Required<TransformOptions>): string {
  const parts: string[] = [];

  parts.push(`{ selector: '${node.selector}'`);

  if (node.props && Object.keys(node.props).length > 0) {
    const propsStr = Object.entries(node.props)
      .map(([k, v]) => `${k}: ${formatValue(v)}`)
      .join(', ');
    parts.push(`props: { ${propsStr} }`);
  }

  if (node.children && node.children.length > 0) {
    const childrenStr = node.children
      .map((c: DomNode) => domNodeToLiteral(c, opts))
      .join(', ');
    parts.push(`children: [${childrenStr}]`);
  }

  return parts.join(', ') + ' }';
}

/**
 * Get decorator name for block type
 */
function getDecoratorName(type: string): string {
  switch (type) {
    case 'atomic': return 'Atomic';
    case 'component': return 'Component';
    case 'state': return 'State';
    default: return 'Atomic';
  }
}

/**
 * Check if a property should be reactive
 */
function isReactiveProperty(key: string, block: Block): boolean {
  // Heuristic: state blocks have reactive properties
  if (block.type === 'state') return true;
  // Properties starting with underscore are typically internal/reactive
  if (key.startsWith('_')) return true;
  return false;
}

/**
 * Generate props type string
 */
function generatePropsType(block: Block): string {
  if (!block.props || Object.keys(block.props).length === 0) {
    return 'Record<string, unknown>';
  }

  const props = Object.entries(block.props)
    .map(([k, v]) => `${k}?: ${inferTypeFromValue(v)}`)
    .join('; ');

  return `{ ${props} }`;
}

/**
 * Infer TypeScript type from a value
 */
function inferTypeFromValue(value: unknown): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';

  switch (typeof value) {
    case 'string': return 'string';
    case 'number': return 'number';
    case 'boolean': return 'boolean';
    case 'object':
      if (Array.isArray(value)) {
        if (value.length === 0) return 'unknown[]';
        const itemType = inferTypeFromValue(value[0]);
        return `${itemType}[]`;
      }
      return 'Record<string, unknown>';
    default:
      return 'unknown';
  }
}

/**
 * Format a value as TypeScript literal
 */
function formatValue(value: unknown): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';

  switch (typeof value) {
    case 'string': return `'${escapeString(value)}'`;
    case 'number':
    case 'boolean': return String(value);
    case 'object':
      if (Array.isArray(value)) {
        return `[${value.map(formatValue).join(', ')}]`;
      }
      const entries = Object.entries(value as Record<string, unknown>)
        .map(([k, v]) => `${k}: ${formatValue(v)}`)
        .join(', ');
      return `{ ${entries} }`;
    default:
      return 'undefined';
  }
}

/**
 * Escape string for use in TypeScript
 */
function escapeString(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
}

/**
 * Convert string to PascalCase
 */
function pascalCase(str: string): string {
  return str
    .split(/[-_\s]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

/**
 * Convert string to camelCase
 */
function camelCase(str: string): string {
  const pascal = pascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

/**
 * Visitor pattern for AST transformation
 */
export interface ASTVisitor {
  visitProgram?(program: Program): Program | void;
  visitBlock?(block: Block): Block | void;
  visitDomNode?(node: DomNode): DomNode | void;
  visitExpression?(expr: Expression): Expression | void;
}

/**
 * Walk and transform an AST using a visitor
 */
export function walkAST<T extends Program | Block | DomNode>(
  node: T,
  visitor: ASTVisitor
): T {
  if ('blocks' in node) {
    // Program
    const program = node as Program;
    const result = visitor.visitProgram?.(program);
    if (result) return result as T;

    return {
      ...program,
      blocks: program.blocks.map((b: Block) => walkAST(b, visitor)),
    } as T;
  }

  if ('type' in node && typeof (node as Block).type === 'string') {
    // Block
    const block = node as Block;
    const result = visitor.visitBlock?.(block);
    if (result) return result as T;

    if (block.type === 'atomic' || block.type === 'component') {
      const atomicBlock = block as AtomicBlock;
      if (atomicBlock.children) {
        return {
          ...atomicBlock,
          children: atomicBlock.children.map((c: DomNode) => walkAST(c, visitor)),
        } as unknown as T;
      }
    }

    return block as T;
  }

  if ('selector' in node) {
    // DomNode
    const domNode = node as DomNode;
    const result = visitor.visitDomNode?.(domNode);
    if (result) return result as T;

    if (domNode.children) {
      return {
        ...domNode,
        children: domNode.children.map((c: DomNode) => walkAST(c, visitor)),
      } as T;
    }

    return domNode as T;
  }

  return node;
}
