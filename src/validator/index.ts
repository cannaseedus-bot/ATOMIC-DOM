/**
 * ASXR Validator
 * Complete validation for ASXR programs
 */

import type {
  Program,
  AtomicBlock,
  DomBlock,
  PropertyAssignment,
} from '../parser/ast.js';
import {
  validateBlock,
  type BlockSchema,
} from './schema.js';
import { checkLaws, type LawChecker, BUILTIN_LAWS } from './laws.js';

// Re-export types
export type { BlockSchema, PropertySchema, ValidationError, ValidationResult } from './schema.js';
export type { LawViolation, LawResult, LawChecker, LawContext } from './laws.js';
export { BUILTIN_SCHEMAS, validateProperty, validateBlock, createSchema } from './schema.js';
export { BUILTIN_LAWS, checkLaws, createLaw, getAvailableLaws } from './laws.js';

export interface ValidatorOptions {
  /** Enable schema validation */
  schemas?: boolean;
  /** Enable law checking */
  laws?: boolean;
  /** Custom schemas */
  customSchemas?: Record<string, BlockSchema>;
  /** Custom laws */
  customLaws?: Record<string, LawChecker>;
  /** Specific laws to check (default: all) */
  enabledLaws?: string[];
  /** Check for undefined references */
  checkReferences?: boolean;
  /** Warn on unused blocks */
  warnUnused?: boolean;
}

export interface Diagnostic {
  severity: 'error' | 'warning' | 'info';
  message: string;
  code: string;
  location?: {
    line: number;
    column: number;
    offset?: number;
  };
}

export interface ValidatorResult {
  valid: boolean;
  diagnostics: Diagnostic[];
  stats: {
    blocks: number;
    references: number;
    proposals: number;
    errors: number;
    warnings: number;
  };
}

const DEFAULT_OPTIONS: ValidatorOptions = {
  schemas: true,
  laws: true,
  checkReferences: true,
  warnUnused: false,
};

/**
 * Validate an ASXR program
 */
export function validate(program: Program, options: ValidatorOptions = {}): ValidatorResult {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const diagnostics: Diagnostic[] = [];
  const stats = {
    blocks: 0,
    references: 0,
    proposals: 0,
    errors: 0,
    warnings: 0,
  };

  // Collect blocks and references
  const blocks = new Map<string, AtomicBlock | DomBlock>();
  const references = new Set<string>();
  const blockReferences = new Set<string>();

  // First pass: collect all declarations
  for (const item of program.body) {
    if (item.type === 'AtomicBlock') {
      const block = item as AtomicBlock;
      stats.blocks++;
      if (block.id) {
        if (blocks.has(block.id)) {
          diagnostics.push({
            severity: 'error',
            message: `Duplicate block ID: '${block.id}'`,
            code: 'DUPLICATE_ID',
            location: block.start,
          });
          stats.errors++;
        } else {
          blocks.set(block.id, block);
        }
      }
      collectReferencesFromBlock(block.body, references, blockReferences);
    } else if (item.type === 'DomBlock') {
      const block = item as DomBlock;
      stats.blocks++;
      if (block.id) {
        blocks.set(block.id, block);
      }
      collectReferencesFromBlock(block.body, references, blockReferences);
    } else if (item.type === 'StateProposal') {
      stats.proposals++;
    }
  }

  stats.references = references.size + blockReferences.size;

  // Schema validation
  if (opts.schemas) {
    for (const item of program.body) {
      if (item.type === 'AtomicBlock') {
        const block = item as AtomicBlock;
        const props = extractProperties(block.body);
        const result = validateBlock(
          block.blockType,
          props,
          opts.customSchemas || {}
        );

        for (const error of result.errors) {
          diagnostics.push({
            severity: 'error',
            message: error.message,
            code: error.code,
            location: block.start,
          });
          stats.errors++;
        }
      }
    }
  }

  // Law checking
  if (opts.laws) {
    const laws = opts.enabledLaws || Object.keys(BUILTIN_LAWS);
    const result = checkLaws(program, laws, opts.customLaws);

    for (const violation of result.violations) {
      diagnostics.push({
        severity: 'error',
        message: `[${violation.law}] ${violation.message}`,
        code: `LAW_${violation.law.toUpperCase()}`,
        location: violation.location,
      });
      stats.errors++;
    }
  }

  // Reference checking
  if (opts.checkReferences) {
    for (const ref of blockReferences) {
      if (!blocks.has(ref)) {
        diagnostics.push({
          severity: 'error',
          message: `Reference to undefined block: #${ref}`,
          code: 'UNDEFINED_REFERENCE',
        });
        stats.errors++;
      }
    }
  }

  // Unused block warnings
  if (opts.warnUnused) {
    for (const [id, block] of blocks) {
      if (!blockReferences.has(id)) {
        diagnostics.push({
          severity: 'warning',
          message: `Block '${id}' is defined but never referenced`,
          code: 'UNUSED_BLOCK',
          location: block.start,
        });
        stats.warnings++;
      }
    }
  }

  return {
    valid: stats.errors === 0,
    diagnostics,
    stats,
  };
}

/**
 * Collect references from block body items
 */
function collectReferencesFromBlock(
  body: PropertyAssignment[] | unknown[],
  references: Set<string>,
  blockReferences: Set<string>
): void {
  for (const item of body) {
    if (typeof item !== 'object' || item === null) continue;

    const node = item as { type?: string; value?: unknown; path?: string; name?: string };

    if (node.type === 'PropertyAssignment' && node.value) {
      collectReferencesFromExpression(node.value, references, blockReferences);
    } else if (node.type === 'Reference' && node.path) {
      references.add(node.path);
    } else if (node.type === 'BlockReference' && node.name) {
      blockReferences.add(node.name);
    }
  }
}

/**
 * Collect references from an expression
 */
function collectReferencesFromExpression(
  expr: unknown,
  references: Set<string>,
  blockReferences: Set<string>
): void {
  if (typeof expr !== 'object' || expr === null) return;

  const node = expr as {
    type?: string;
    path?: string;
    name?: string;
    elements?: unknown[];
    properties?: unknown[];
    left?: unknown;
    right?: unknown;
    argument?: unknown;
    value?: unknown;
  };

  switch (node.type) {
    case 'Reference':
      if (node.path) references.add(node.path);
      break;
    case 'BlockReference':
      if (node.name) blockReferences.add(node.name);
      break;
    case 'ArrayExpression':
      if (node.elements) {
        for (const elem of node.elements) {
          collectReferencesFromExpression(elem, references, blockReferences);
        }
      }
      break;
    case 'ObjectExpression':
      if (node.properties) {
        for (const prop of node.properties) {
          const p = prop as { value?: unknown };
          if (p.value) {
            collectReferencesFromExpression(p.value, references, blockReferences);
          }
        }
      }
      break;
    case 'BinaryExpression':
      collectReferencesFromExpression(node.left, references, blockReferences);
      collectReferencesFromExpression(node.right, references, blockReferences);
      break;
    case 'UnaryExpression':
      collectReferencesFromExpression(node.argument, references, blockReferences);
      break;
  }
}

/**
 * Extract properties from block body as plain object
 */
function extractProperties(body: PropertyAssignment[] | unknown[]): Record<string, unknown> {
  const props: Record<string, unknown> = {};

  for (const item of body) {
    if (typeof item !== 'object' || item === null) continue;

    const node = item as PropertyAssignment;
    if (node.type === 'PropertyAssignment') {
      props[node.name] = extractValue(node.value);
    }
  }

  return props;
}

/**
 * Extract a plain value from an AST expression
 */
function extractValue(expr: unknown): unknown {
  if (typeof expr !== 'object' || expr === null) return expr;

  const node = expr as {
    type?: string;
    value?: unknown;
    elements?: unknown[];
    properties?: { name?: string; value?: unknown }[];
    path?: string;
    name?: string;
  };

  switch (node.type) {
    case 'Literal':
      return node.value;
    case 'ArrayExpression':
      return (node.elements || []).map(extractValue);
    case 'ObjectExpression':
      const obj: Record<string, unknown> = {};
      for (const prop of node.properties || []) {
        if (prop.name) {
          obj[prop.name] = extractValue(prop.value);
        }
      }
      return obj;
    case 'Reference':
      return `{{${node.path}}}`;
    case 'BlockReference':
      return `#${node.name}`;
    default:
      return undefined;
  }
}

/**
 * Quick validation helper - returns true if valid
 */
export function isValid(program: Program, options?: ValidatorOptions): boolean {
  return validate(program, options).valid;
}

/**
 * Format diagnostics as human-readable strings
 */
export function formatDiagnostics(diagnostics: Diagnostic[]): string[] {
  return diagnostics.map((d) => {
    const loc = d.location ? ` at ${d.location.line}:${d.location.column}` : '';
    const prefix = d.severity === 'error' ? '✗' : d.severity === 'warning' ? '⚠' : 'ℹ';
    return `${prefix} [${d.code}]${loc}: ${d.message}`;
  });
}
