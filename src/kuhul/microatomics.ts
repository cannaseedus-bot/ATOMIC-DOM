/**
 * K'UHUL MicroAtomics (Micronauts) System
 * Orchestration layer for context-aware inference
 */

// ============================================================================
// MicroAtomic Types
// ============================================================================

export type MicroAtomicDomain = string;

export interface MicroAtomic {
  id: string;
  role: string;
  responsibility: string;
  domains: MicroAtomicDomain[];
  priority: number;
  active: boolean;
}

export interface MicroAtomicContext {
  input: string;
  type: ContextType;
  microatomics: string[];
  vars: Record<string, unknown>;
  timestamp: number;
}

export type ContextType = 'math' | 'code' | 'resume' | 'web' | 'atomic' | 'general';

// ============================================================================
// MicroAtomics Registry
// ============================================================================

export const MICROATOMICS: Record<string, MicroAtomic> = {
  // Orchestration Layer
  CLIMicroAtomic: {
    id: 'cli',
    role: 'orchestrates command-line context',
    responsibility: 'cli_coordination',
    domains: ['terminal', 'shell', 'stdio'],
    priority: 100,
    active: true,
  },

  // Input Processing
  InputMicroAtomic: {
    id: 'input',
    role: 'routes user input as field data',
    responsibility: 'input_routing',
    domains: ['prompt_handling', 'command_parsing'],
    priority: 90,
    active: true,
  },

  // Math Focus
  MathMicroAtomic: {
    id: 'math',
    role: 'projects mathematical context',
    responsibility: 'math_framing',
    domains: ['calculus', 'algebra', 'statistics', 'discrete_math', 'linear_algebra'],
    priority: 80,
    active: true,
  },

  // Programming Focus
  ProgrammingMicroAtomic: {
    id: 'programming',
    role: 'projects programming context',
    responsibility: 'code_framing',
    domains: ['languages', 'paradigms', 'patterns', 'algorithms'],
    priority: 80,
    active: true,
  },

  // Website/Web Dev Focus
  WebMicroAtomic: {
    id: 'web',
    role: 'projects web development context',
    responsibility: 'web_framing',
    domains: ['html', 'css', 'javascript', 'react', 'apis'],
    priority: 80,
    active: true,
  },

  // Code Generation Focus
  CodeGenMicroAtomic: {
    id: 'codegen',
    role: 'projects code generation context',
    responsibility: 'generation_framing',
    domains: ['templates', 'snippets', 'boilerplate', 'refactoring'],
    priority: 75,
    active: true,
  },

  // Resume/Action Words Focus
  ResumeMicroAtomic: {
    id: 'resume',
    role: 'projects professional coding experience context',
    responsibility: 'resume_framing',
    domains: ['action_words', 'achievements', 'projects', 'skills'],
    priority: 80,
    active: true,
  },

  // Inference Orchestration
  InferenceMicroAtomic: {
    id: 'inference',
    role: 'orchestrates inference context',
    responsibility: 'inference_coordination',
    domains: ['model_selection', 'prompt_framing', 'output_formatting'],
    priority: 95,
    active: true,
  },

  // Output Formatting
  OutputMicroAtomic: {
    id: 'output',
    role: 'projects output formatting',
    responsibility: 'format_framing',
    domains: ['markdown', 'code_blocks', 'tables', 'lists'],
    priority: 70,
    active: true,
  },

  // Atomic Framework Focus
  AtomicMicroAtomic: {
    id: 'atomic',
    role: 'projects atomic framework context',
    responsibility: 'atomic_framing',
    domains: ['object_server', 'atomic_blocks', 'micronauts', 'projections', 'invariants', 'authority'],
    priority: 85,
    active: true,
  },
};

// ============================================================================
// MicroAtomic Orchestrator
// ============================================================================

export class MicroAtomicOrchestrator {
  private microatomics: Map<string, MicroAtomic>;
  private activeMicroatomics: Set<string>;

  constructor() {
    this.microatomics = new Map();
    this.activeMicroatomics = new Set();

    // Register all microatomics
    for (const [name, ma] of Object.entries(MICROATOMICS)) {
      this.microatomics.set(name, ma);
      if (ma.active) {
        this.activeMicroatomics.add(name);
      }
    }
  }

  /**
   * Get all registered microatomics
   */
  getAll(): MicroAtomic[] {
    return Array.from(this.microatomics.values());
  }

  /**
   * Get active microatomics sorted by priority
   */
  getActive(): MicroAtomic[] {
    return Array.from(this.microatomics.entries())
      .filter(([name]) => this.activeMicroatomics.has(name))
      .map(([_, ma]) => ma)
      .sort((a, b) => b.priority - a.priority);
  }

  /**
   * Get microatomic by name
   */
  get(name: string): MicroAtomic | undefined {
    return this.microatomics.get(name);
  }

  /**
   * Activate a microatomic
   */
  activate(name: string): void {
    if (this.microatomics.has(name)) {
      this.activeMicroatomics.add(name);
    }
  }

  /**
   * Deactivate a microatomic
   */
  deactivate(name: string): void {
    this.activeMicroatomics.delete(name);
  }

  /**
   * Select relevant microatomics for a given context type
   */
  selectForContext(contextType: ContextType): MicroAtomic[] {
    const base = ['CLIMicroAtomic', 'InputMicroAtomic', 'InferenceMicroAtomic', 'OutputMicroAtomic'];
    const contextSpecific: Record<ContextType, string[]> = {
      math: ['MathMicroAtomic'],
      code: ['ProgrammingMicroAtomic', 'CodeGenMicroAtomic'],
      resume: ['ResumeMicroAtomic'],
      web: ['WebMicroAtomic', 'CodeGenMicroAtomic'],
      atomic: ['AtomicMicroAtomic', 'WebMicroAtomic'],
      general: [],
    };

    const selected = [...base, ...(contextSpecific[contextType] || [])];
    return selected
      .map(name => this.microatomics.get(name))
      .filter((ma): ma is MicroAtomic => ma !== undefined)
      .sort((a, b) => b.priority - a.priority);
  }

  /**
   * Find microatomics by domain
   */
  findByDomain(domain: string): MicroAtomic[] {
    return Array.from(this.microatomics.values())
      .filter(ma => ma.domains.includes(domain));
  }

  /**
   * Create execution context
   */
  createContext(input: string, contextType: ContextType): MicroAtomicContext {
    const selected = this.selectForContext(contextType);
    return {
      input,
      type: contextType,
      microatomics: selected.map(ma => ma.id),
      vars: {},
      timestamp: Date.now(),
    };
  }

  /**
   * Execute through microatomic pipeline
   */
  async execute<T>(
    context: MicroAtomicContext,
    handler: (ctx: MicroAtomicContext, ma: MicroAtomic) => Promise<T>
  ): Promise<T[]> {
    const results: T[] = [];
    const selected = this.selectForContext(context.type);

    for (const ma of selected) {
      const result = await handler(context, ma);
      results.push(result);
    }

    return results;
  }
}

// ============================================================================
// Default Orchestrator Instance
// ============================================================================

export const orchestrator = new MicroAtomicOrchestrator();

// ============================================================================
// Helper Functions
// ============================================================================

export function getMicroAtomicNames(): string[] {
  return Object.keys(MICROATOMICS);
}

export function getMicroAtomicById(id: string): MicroAtomic | undefined {
  return Object.values(MICROATOMICS).find(ma => ma.id === id);
}

export function getMicroAtomicsByResponsibility(responsibility: string): MicroAtomic[] {
  return Object.values(MICROATOMICS).filter(ma => ma.responsibility === responsibility);
}
