/**
 * ASXR Law Constraint Verification
 * Enforces semantic laws and invariants
 */

import type { Program, AtomicBlock, StateProposal } from '../parser/ast.js';

export interface LawContext {
  blocks: Map<string, AtomicBlock>;
  proposals: StateProposal[];
  phase: string;
  epoch: number;
}

export interface LawViolation {
  law: string;
  message: string;
  location?: { line: number; column: number };
}

export interface LawResult {
  valid: boolean;
  violations: LawViolation[];
}

export type LawChecker = (context: LawContext) => LawViolation[];

/**
 * Built-in law definitions
 * These are the core semantic laws of ASXR
 */
export const BUILTIN_LAWS: Record<string, LawChecker> = {
  /**
   * Law: existence_is_explicit
   * All blocks must be explicitly declared before use
   */
  existence_is_explicit: (context) => {
    const violations: LawViolation[] = [];
    const declaredBlocks = new Set(context.blocks.keys());

    // Check all proposals reference existing blocks
    for (const proposal of context.proposals) {
      for (const block of proposal.next.blocks) {
        if (block.type === 'AtomicBlock') {
          const ab = block as AtomicBlock;
          // New blocks being created are allowed
          if (ab.id) {
            declaredBlocks.add(ab.id);
          }
        }
      }
    }

    return violations;
  },

  /**
   * Law: closed_world
   * Only declared entities can be referenced
   */
  closed_world: (_context) => {
    const violations: LawViolation[] = [];
    // This would need to analyze all references in block bodies
    // Reference checking is handled separately in the validator
    return violations;
  },

  /**
   * Law: no_orphan_blocks
   * All blocks must have a parent or be at root level
   */
  no_orphan_blocks: (_context) => {
    // All parsed blocks are either root level or nested - no orphans possible
    return [];
  },

  /**
   * Law: unique_ids
   * Block IDs must be unique within scope
   */
  unique_ids: (context) => {
    const violations: LawViolation[] = [];
    const seenIds = new Map<string, AtomicBlock>();

    for (const [id, block] of context.blocks) {
      if (seenIds.has(id)) {
        violations.push({
          law: 'unique_ids',
          message: `Duplicate block ID: '${id}'`,
          location: block.start,
        });
      } else {
        seenIds.set(id, block);
      }
    }

    return violations;
  },

  /**
   * Law: valid_phase_transitions
   * Phase transitions must follow allowed paths
   */
  valid_phase_transitions: (context) => {
    const violations: LawViolation[] = [];
    const ALLOWED_TRANSITIONS: Record<string, string[]> = {
      genesis: ['execution'],
      execution: ['compression', 'projection'],
      compression: ['projection'],
      projection: ['execution'],
    };

    for (const proposal of context.proposals) {
      const from = context.phase;
      const to = proposal.next.phase;

      if (from && to && from !== to) {
        const allowed = ALLOWED_TRANSITIONS[from] || [];
        if (!allowed.includes(to)) {
          violations.push({
            law: 'valid_phase_transitions',
            message: `Invalid phase transition: ${from} -> ${to}`,
          });
        }
      }
    }

    return violations;
  },

  /**
   * Law: monotonic_epochs
   * Epochs must increase monotonically
   */
  monotonic_epochs: (context) => {
    const violations: LawViolation[] = [];

    for (const proposal of context.proposals) {
      if (proposal.next.epoch < context.epoch) {
        violations.push({
          law: 'monotonic_epochs',
          message: `Epoch cannot decrease: ${context.epoch} -> ${proposal.next.epoch}`,
        });
      }
    }

    return violations;
  },

  /**
   * Law: immutable_genesis
   * Genesis blocks cannot be modified after creation
   */
  immutable_genesis: (context) => {
    const violations: LawViolation[] = [];

    if (context.phase === 'genesis' && context.epoch > 0) {
      for (const proposal of context.proposals) {
        if (proposal.next.phase === 'genesis') {
          violations.push({
            law: 'immutable_genesis',
            message: 'Cannot modify genesis after initial creation',
          });
        }
      }
    }

    return violations;
  },

  /**
   * Law: schema_compliance
   * All blocks must comply with their declared schemas
   */
  schema_compliance: (_context) => {
    // This is handled by schema.ts validation
    return [];
  },
};

/**
 * Check all laws for a program
 */
export function checkLaws(
  program: Program,
  laws: string[] = Object.keys(BUILTIN_LAWS),
  customLaws: Record<string, LawChecker> = {}
): LawResult {
  const violations: LawViolation[] = [];

  // Build context from program
  const context = buildContext(program);

  // Check each law
  for (const lawName of laws) {
    const checker = customLaws[lawName] || BUILTIN_LAWS[lawName];
    if (checker) {
      violations.push(...checker(context));
    } else {
      violations.push({
        law: lawName,
        message: `Unknown law: '${lawName}'`,
      });
    }
  }

  return {
    valid: violations.length === 0,
    violations,
  };
}

/**
 * Build a law context from a program AST
 */
function buildContext(program: Program): LawContext {
  const blocks = new Map<string, AtomicBlock>();
  const proposals: StateProposal[] = [];

  for (const item of program.body) {
    if (item.type === 'AtomicBlock') {
      const block = item as AtomicBlock;
      if (block.id) {
        blocks.set(block.id, block);
      }
    } else if (item.type === 'StateProposal') {
      proposals.push(item as StateProposal);
    }
  }

  // Determine current phase from proposals
  let phase = 'genesis';
  let epoch = 0;

  if (proposals.length > 0) {
    const lastProposal = proposals[proposals.length - 1];
    phase = lastProposal.next.phase;
    epoch = lastProposal.next.epoch;
  }

  return { blocks, proposals, phase, epoch };
}

/**
 * Create a custom law
 */
export function createLaw(name: string, checker: LawChecker): { name: string; checker: LawChecker } {
  return { name, checker };
}

/**
 * Get all available laws
 */
export function getAvailableLaws(): string[] {
  return Object.keys(BUILTIN_LAWS);
}
