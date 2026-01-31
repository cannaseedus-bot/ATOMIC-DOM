/**
 * ASXR Runtime
 * Minimal runtime for executing compiled ASXR code
 */

// =============================================================================
// Types
// =============================================================================

export interface Block {
  type: string;
  id: string | null;
  props: Record<string, unknown>;
}

export interface DomNode {
  selector: string;
  id: string | null;
  props: Record<string, unknown>;
  children: DomNode[];
}

export interface StateStore {
  get(path: string): unknown;
  set(path: string, value: unknown): void;
  subscribe(path: string, callback: (value: unknown) => void): () => void;
}

export interface Proposal {
  prior: unknown;
  next: {
    phase: string;
    epoch: number;
    blocks: Block[];
  };
  constraints?: string[];
}

export interface ReactorConfig {
  [key: string]: unknown;
}

// =============================================================================
// State Management
// =============================================================================

class SimpleStateStore implements StateStore {
  private state: Record<string, unknown> = {};
  private subscribers: Map<string, Set<(value: unknown) => void>> = new Map();

  get(path: string): unknown {
    const parts = path.split('.');
    let current: unknown = this.state;

    for (const part of parts) {
      if (current === null || current === undefined) return undefined;
      current = (current as Record<string, unknown>)[part];
    }

    return current;
  }

  set(path: string, value: unknown): void {
    const parts = path.split('.');
    const last = parts.pop()!;
    let current: Record<string, unknown> = this.state;

    for (const part of parts) {
      if (!(part in current)) {
        current[part] = {};
      }
      current = current[part] as Record<string, unknown>;
    }

    current[last] = value;

    // Notify subscribers
    const subs = this.subscribers.get(path);
    if (subs) {
      for (const callback of subs) {
        callback(value);
      }
    }
  }

  subscribe(path: string, callback: (value: unknown) => void): () => void {
    if (!this.subscribers.has(path)) {
      this.subscribers.set(path, new Set());
    }
    this.subscribers.get(path)!.add(callback);

    return () => {
      this.subscribers.get(path)?.delete(callback);
    };
  }
}

// Global state instance
export const state = new SimpleStateStore();

// =============================================================================
// Block Creation
// =============================================================================

const blockRegistry: Map<string, Block> = new Map();

export function createBlock(type: string, id: string | null, props: Record<string, unknown>): Block {
  const block: Block = { type, id, props };

  if (id) {
    blockRegistry.set(id, block);
  }

  return block;
}

export function getBlock(id: string): Block | undefined {
  return blockRegistry.get(id);
}

// =============================================================================
// DOM Creation
// =============================================================================

const domRegistry: Map<string, DomNode> = new Map();

export function createDom(
  selector: string,
  id: string | null,
  props: Record<string, unknown>
): DomNode {
  const children = (props.children || []) as DomNode[];
  delete props.children;

  const node: DomNode = { selector, id, props, children };

  if (id) {
    domRegistry.set(id, node);
  }

  return node;
}

export function getDom(id: string): DomNode | undefined {
  return domRegistry.get(id);
}

// =============================================================================
// State Proposals
// =============================================================================

type ProposalHandler = (proposal: Proposal) => Promise<boolean>;
const proposalHandlers: ProposalHandler[] = [];

export function onProposal(handler: ProposalHandler): void {
  proposalHandlers.push(handler);
}

export async function propose(proposal: Proposal): Promise<boolean> {
  // Validate constraints
  if (proposal.constraints) {
    for (const constraint of proposal.constraints) {
      if (!validateConstraint(constraint, proposal)) {
        console.warn(`Proposal rejected: constraint '${constraint}' failed`);
        return false;
      }
    }
  }

  // Notify handlers
  for (const handler of proposalHandlers) {
    const accepted = await handler(proposal);
    if (!accepted) {
      return false;
    }
  }

  // Apply the proposal
  for (const block of proposal.next.blocks) {
    if (block.id) {
      blockRegistry.set(block.id, block);
    }
  }

  return true;
}

function validateConstraint(_name: string, _proposal: Proposal): boolean {
  // TODO: Implement constraint validation
  return true;
}

// =============================================================================
// Server Calls
// =============================================================================

type CallHandler = (
  target: string,
  args: Record<string, unknown>
) => Promise<unknown>;

let callHandler: CallHandler = async (_target, _args) => {
  throw new Error('No call handler registered');
};

export function setCallHandler(handler: CallHandler): void {
  callHandler = handler;
}

export async function call(
  target: string,
  modifiers: string[],
  args: Record<string, unknown>
): Promise<unknown> {
  const isAsync = modifiers.includes('async');
  const shouldCache = modifiers.includes('cache');

  // TODO: Implement caching
  if (shouldCache) {
    // Check cache
  }

  if (isAsync) {
    // Fire and forget
    callHandler(target, args).catch(console.error);
    return undefined;
  }

  return callHandler(target, args);
}

// =============================================================================
// Reactors
// =============================================================================

interface ReactorInstance {
  name: string;
  triggers: Map<string, ((data: unknown) => void)[]>;
  timers: { interval: string; callback: () => void }[];
  stop: () => void;
}

const reactorRegistry: Map<string, ReactorInstance> = new Map();

export function reactor(
  name: string,
  _config: ReactorConfig
): ReactorInstance {
  const instance: ReactorInstance = {
    name,
    triggers: new Map(),
    timers: [],
    stop: () => {
      // Cleanup timers
      reactorRegistry.delete(name);
    },
  };

  reactorRegistry.set(name, instance);
  return instance;
}

export function on(
  source: string,
  filterOrCallback: string | ((data: unknown) => void),
  callback?: (data: unknown) => void
): { source: string; callback: (data: unknown) => void } {
  const actualCallback = typeof filterOrCallback === 'function' ? filterOrCallback : callback!;

  return {
    source,
    callback: actualCallback,
  };
}

export function every(
  interval: string,
  callback: () => void
): { interval: string; callback: () => void } {
  return { interval, callback };
}

// =============================================================================
// Utilities
// =============================================================================

export const blocks: Record<string, Block> = new Proxy(
  {},
  {
    get(_target, prop: string) {
      return blockRegistry.get(prop);
    },
  }
);

export const dom: Record<string, DomNode> = new Proxy(
  {},
  {
    get(_target, prop: string) {
      return domRegistry.get(prop);
    },
  }
);
