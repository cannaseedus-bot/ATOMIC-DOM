/**
 * ASXR TypeScript Type Generators
 * Generate TypeScript types from ASXR definitions
 */

import type { Block, DomNode } from '../runtime/index.js';

/**
 * Program structure for type generation
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
 * Type generation options
 */
export interface TypeGenOptions {
  /** Output format */
  format?: 'interface' | 'type';
  /** Generate strict types */
  strict?: boolean;
  /** Include JSDoc comments */
  jsdoc?: boolean;
  /** Prefix for generated types */
  prefix?: string;
  /** Suffix for generated types */
  suffix?: string;
  /** Export types */
  exportTypes?: boolean;
}

const DEFAULT_OPTIONS: Required<TypeGenOptions> = {
  format: 'interface',
  strict: true,
  jsdoc: true,
  prefix: '',
  suffix: 'Props',
  exportTypes: true,
};

/**
 * Generate TypeScript types from ASXR program
 */
export function generateTypesFromProgram(program: Program, options?: TypeGenOptions): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const lines: string[] = [];

  // Header
  lines.push('/**');
  lines.push(' * Auto-generated TypeScript types from ASXR');
  lines.push(' * Do not edit manually');
  lines.push(' */');
  lines.push('');

  // Import runtime types
  lines.push("import type { Block, DomNode, AtomicBlock, ComponentBlock, StateBlock } from 'atomic-dom';");
  lines.push('');

  // Generate types for each block
  for (const block of program.blocks) {
    const typeCode = generateBlockType(block, opts);
    lines.push(typeCode);
    lines.push('');
  }

  // Generate union type of all blocks
  if (program.blocks.length > 0) {
    const blockNames = program.blocks
      .map((b: Block) => opts.prefix + pascalCase(b.id ?? 'Block') + opts.suffix)
      .join(' | ');
    lines.push(`export type AllBlockProps = ${blockNames};`);
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Generate TypeScript type for a single block
 */
export function generateBlockType(block: Block, options?: TypeGenOptions): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const lines: string[] = [];
  const typeName = opts.prefix + pascalCase(block.id ?? 'Block') + opts.suffix;

  // JSDoc
  if (opts.jsdoc) {
    lines.push('/**');
    lines.push(` * Props for ${block.id ?? 'unnamed'} ${block.type}`);
    if (block.id) {
      lines.push(` * @block ${block.id}`);
    }
    lines.push(` * @type ${block.type}`);
    lines.push(' */');
  }

  // Type definition
  const exportKeyword = opts.exportTypes ? 'export ' : '';

  if (opts.format === 'interface') {
    lines.push(`${exportKeyword}interface ${typeName} {`);
  } else {
    lines.push(`${exportKeyword}type ${typeName} = {`);
  }

  // Properties
  if (block.props) {
    for (const [key, value] of Object.entries(block.props)) {
      const propType = inferType(value, opts);
      const optional = opts.strict ? '' : '?';

      if (opts.jsdoc && typeof value !== 'undefined') {
        lines.push(`  /** Default: ${formatDefaultValue(value)} */`);
      }
      lines.push(`  ${key}${optional}: ${propType};`);
    }
  }

  // Add children type for atomic/component blocks
  if (block.type === 'atomic' || block.type === 'component') {
    const atomicBlock = block as AtomicBlock;
    if (atomicBlock.children && atomicBlock.children.length > 0) {
      lines.push(`  children?: DomNode[];`);
    }
  }

  if (opts.format === 'interface') {
    lines.push('}');
  } else {
    lines.push('};');
  }

  return lines.join('\n');
}

/**
 * Generate TypeScript declaration file (.d.ts) from ASXR program
 */
export function generateDeclarationFile(program: Program, moduleName: string): string {
  const lines: string[] = [];

  lines.push(`// Type declarations for ${moduleName}`);
  lines.push(`declare module '${moduleName}' {`);
  lines.push("  import type { Block, DomNode } from 'atomic-dom';");
  lines.push('');

  for (const block of program.blocks) {
    const typeName = pascalCase(block.id ?? 'Block');

    lines.push(`  export interface ${typeName}Props {`);
    if (block.props) {
      for (const [key, value] of Object.entries(block.props)) {
        const propType = inferType(value, DEFAULT_OPTIONS);
        lines.push(`    ${key}?: ${propType};`);
      }
    }
    lines.push('  }');
    lines.push('');

    lines.push(`  export function ${camelCase(block.id ?? 'block')}(props: ${typeName}Props): Block;`);
    lines.push('');
  }

  lines.push('}');

  return lines.join('\n');
}

/**
 * Generate TypeScript enum from ASXR state values
 */
export function generateEnum(name: string, values: string[]): string {
  const lines: string[] = [];
  const enumName = pascalCase(name);

  lines.push(`export enum ${enumName} {`);
  for (const value of values) {
    const key = pascalCase(value).replace(/[^a-zA-Z0-9]/g, '');
    lines.push(`  ${key} = '${value}',`);
  }
  lines.push('}');

  return lines.join('\n');
}

/**
 * Generate TypeScript const assertion from ASXR block
 */
export function generateConstAssertion(block: Block): string {
  const lines: string[] = [];
  const name = pascalCase(block.id ?? 'Block').toUpperCase();

  lines.push(`export const ${name} = {`);
  lines.push(`  type: '${block.type}',`);
  if (block.id) {
    lines.push(`  id: '${block.id}',`);
  }
  if (block.props && Object.keys(block.props).length > 0) {
    lines.push('  props: {');
    for (const [key, value] of Object.entries(block.props)) {
      lines.push(`    ${key}: ${JSON.stringify(value)},`);
    }
    lines.push('  },');
  }
  lines.push('} as const;');
  lines.push('');
  lines.push(`export type ${pascalCase(block.id ?? 'Block')}Config = typeof ${name};`);

  return lines.join('\n');
}

/**
 * Generate prop validation types
 */
export function generatePropValidators(block: Block): string {
  const lines: string[] = [];
  const typeName = pascalCase(block.id ?? 'Block');

  lines.push(`export const ${typeName}PropValidators = {`);

  if (block.props) {
    for (const [key, value] of Object.entries(block.props)) {
      const type = typeof value;
      lines.push(`  ${key}: {`);
      lines.push(`    type: '${type}',`);
      lines.push(`    required: false,`);
      if (value !== undefined && value !== null) {
        lines.push(`    default: ${JSON.stringify(value)},`);
      }
      lines.push(`    validate: (v: unknown) => typeof v === '${type}',`);
      lines.push('  },');
    }
  }

  lines.push('} as const;');

  return lines.join('\n');
}

/**
 * Generate DOM node type from ASXR DomNode
 */
export function generateDomNodeType(node: DomNode): string {
  const lines: string[] = [];
  const typeName = pascalCase(node.selector) + 'Node';

  lines.push(`export interface ${typeName} extends DomNode {`);
  lines.push(`  selector: '${node.selector}';`);

  if (node.props && Object.keys(node.props).length > 0) {
    lines.push('  props: {');
    for (const [key, value] of Object.entries(node.props)) {
      const propType = inferType(value, DEFAULT_OPTIONS);
      lines.push(`    ${key}?: ${propType};`);
    }
    lines.push('  };');
  }

  lines.push('}');

  return lines.join('\n');
}

/**
 * Infer TypeScript type from a value
 */
function inferType(value: unknown, opts: Required<TypeGenOptions>): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';

  switch (typeof value) {
    case 'string':
      // Check if it's a union of string literals
      if (opts.strict && value.includes('|')) {
        return value.split('|').map(v => `'${v.trim()}'`).join(' | ');
      }
      return 'string';

    case 'number':
      return 'number';

    case 'boolean':
      return 'boolean';

    case 'object':
      if (Array.isArray(value)) {
        if (value.length === 0) return 'unknown[]';

        // Check if all elements are same type
        const types = new Set(value.map(v => inferType(v, opts)));
        if (types.size === 1) {
          return `${Array.from(types)[0]}[]`;
        }

        // Mixed array - use union
        return `(${Array.from(types).join(' | ')})[]`;
      }

      // Object type
      if (opts.strict) {
        const entries = Object.entries(value as Record<string, unknown>)
          .map(([k, v]) => `${k}: ${inferType(v, opts)}`)
          .join('; ');
        return `{ ${entries} }`;
      }
      return 'Record<string, unknown>';

    case 'function':
      return '(...args: unknown[]) => unknown';

    default:
      return 'unknown';
  }
}

/**
 * Format a value as a default value string
 */
function formatDefaultValue(value: unknown): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'string') return `"${value}"`;
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
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
 * Type registry for tracking generated types
 */
export class TypeRegistry {
  private types: Map<string, string> = new Map();
  private imports: Set<string> = new Set();

  /**
   * Register a type
   */
  register(name: string, definition: string): void {
    this.types.set(name, definition);
  }

  /**
   * Add an import
   */
  addImport(importStatement: string): void {
    this.imports.add(importStatement);
  }

  /**
   * Check if type exists
   */
  has(name: string): boolean {
    return this.types.has(name);
  }

  /**
   * Get a type definition
   */
  get(name: string): string | undefined {
    return this.types.get(name);
  }

  /**
   * Generate complete output
   */
  generate(): string {
    const lines: string[] = [];

    // Imports
    for (const imp of this.imports) {
      lines.push(imp);
    }
    if (this.imports.size > 0) {
      lines.push('');
    }

    // Types
    for (const definition of this.types.values()) {
      lines.push(definition);
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Clear the registry
   */
  clear(): void {
    this.types.clear();
    this.imports.clear();
  }
}
