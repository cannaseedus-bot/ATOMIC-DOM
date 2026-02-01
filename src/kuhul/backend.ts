/**
 * K'UHUL Inference Backend
 * Wires up MicroAtomics with inference providers
 */

import { orchestrator, type ContextType } from './microatomics.js';
import { detectContext, getAllContextScores } from './context.js';
import { extractActionWords, suggestStrongerWords } from './action-words.js';
import { PROMPT_TEMPLATES } from './inference.js';
import {
  getAllExperts,
  getExpertsByParent,
  type ExpertSpec,
  MODEL_SPEC
} from './training-spec.js';

// ============================================================================
// Backend Types
// ============================================================================

export interface InferenceBackend {
  name: string;
  type: 'local' | 'remote' | 'mock';
  initialize(): Promise<void>;
  infer(prompt: string, options?: InferenceOptions): Promise<InferenceResult>;
  dispose(): Promise<void>;
}

export interface InferenceOptions {
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  topK?: number;
  stopSequences?: string[];
  expertHints?: string[];  // Hint which experts to prefer
}

export interface InferenceResult {
  text: string;
  tokensUsed: number;
  expertsActivated: string[];
  routingScores: Record<string, number>;
  latencyMs: number;
}

export interface PipelineResult {
  input: string;
  context: ContextType;
  expertsSelected: ExpertSpec[];
  prompt: string;
  response: InferenceResult;
  actionWords: ReturnType<typeof extractActionWords>;
  suggestions: ReturnType<typeof suggestStrongerWords>;
  totalLatencyMs: number;
}

// ============================================================================
// Expert Router
// ============================================================================

export class ExpertRouter {
  private experts: ExpertSpec[];

  constructor() {
    this.experts = getAllExperts();
  }

  /**
   * Route input to top-K experts based on context
   */
  route(input: string, k: number = MODEL_SPEC.activeExperts): ExpertRoutingResult {
    const contextScores = getAllContextScores(input);
    const primaryContext = contextScores[0];

    // Get MicroAtomics for this context
    const microatomics = orchestrator.selectForContext(primaryContext.type);

    // Get experts mapped to these MicroAtomics
    const candidateExperts: ScoredExpert[] = [];

    for (const ma of microatomics) {
      const maExperts = getExpertsByParent(ma.id.charAt(0).toUpperCase() + ma.id.slice(1) + 'MicroAtomic');

      // Also check by responsibility matching
      const byResponsibility = this.experts.filter(e =>
        e.parent?.toLowerCase().includes(ma.id) ||
        e.domains.some(d => input.toLowerCase().includes(d))
      );

      const allMatched = [...maExperts, ...byResponsibility];

      for (const expert of allMatched) {
        // Calculate expert score based on domain match
        const domainScore = this.calculateDomainScore(input, expert);
        const capacityScore = expert.capacity;
        const combinedScore = (domainScore * 0.7) + (capacityScore * 0.3);

        if (combinedScore >= expert.minActivation) {
          candidateExperts.push({
            expert,
            score: combinedScore,
            domainMatches: this.getDomainMatches(input, expert),
          });
        }
      }
    }

    // Deduplicate and sort by score
    const uniqueExperts = this.deduplicateExperts(candidateExperts);
    const topK = uniqueExperts.slice(0, k);

    // Normalize scores to sum to 1
    const totalScore = topK.reduce((sum, e) => sum + e.score, 0);
    const normalizedExperts = topK.map(e => ({
      ...e,
      normalizedScore: totalScore > 0 ? e.score / totalScore : 1 / k,
    }));

    return {
      context: primaryContext.type,
      contextConfidence: primaryContext.confidence,
      selectedExperts: normalizedExperts,
      routingScores: Object.fromEntries(
        normalizedExperts.map(e => [e.expert.id, e.normalizedScore])
      ),
    };
  }

  private calculateDomainScore(input: string, expert: ExpertSpec): number {
    const lowerInput = input.toLowerCase();
    let score = 0;

    // Check domain matches
    for (const domain of expert.domains) {
      if (lowerInput.includes(domain.toLowerCase())) {
        score += 0.3;
      }
    }

    // Check vocab bias matches
    for (const vocab of expert.vocabBias) {
      if (lowerInput.includes(vocab.toLowerCase())) {
        score += 0.2;
      }
    }

    return Math.min(score, 1.0);
  }

  private getDomainMatches(input: string, expert: ExpertSpec): string[] {
    const lowerInput = input.toLowerCase();
    return expert.domains.filter(d => lowerInput.includes(d.toLowerCase()));
  }

  private deduplicateExperts(experts: ScoredExpert[]): ScoredExpert[] {
    const seen = new Set<string>();
    const unique: ScoredExpert[] = [];

    // Sort by score first
    experts.sort((a, b) => b.score - a.score);

    for (const expert of experts) {
      if (!seen.has(expert.expert.id)) {
        seen.add(expert.expert.id);
        unique.push(expert);
      }
    }

    return unique;
  }
}

interface ScoredExpert {
  expert: ExpertSpec;
  score: number;
  domainMatches: string[];
  normalizedScore?: number;
}

interface ExpertRoutingResult {
  context: ContextType;
  contextConfidence: number;
  selectedExperts: ScoredExpert[];
  routingScores: Record<string, number>;
}

// ============================================================================
// Mock Backend (for testing without real model)
// ============================================================================

export class MockInferenceBackend implements InferenceBackend {
  name = 'mock';
  type: 'mock' = 'mock';
  private initialized = false;

  async initialize(): Promise<void> {
    this.initialized = true;
  }

  async infer(prompt: string, options?: InferenceOptions): Promise<InferenceResult> {
    if (!this.initialized) {
      throw new Error('Backend not initialized');
    }

    const startTime = Date.now();

    // Simulate inference delay
    await new Promise(resolve => setTimeout(resolve, 50));

    // Generate mock response based on detected context
    const context = detectContext(prompt);
    const response = this.generateMockResponse(prompt, context, options);

    return {
      text: response,
      tokensUsed: response.split(/\s+/).length,
      expertsActivated: options?.expertHints || [],
      routingScores: {},
      latencyMs: Date.now() - startTime,
    };
  }

  private generateMockResponse(prompt: string, context: ContextType, _options?: InferenceOptions): string {
    const responses: Record<ContextType, string> = {
      math: `To solve this mathematical problem:\n\n1. Identify the type of problem\n2. Apply relevant formulas\n3. Show step-by-step work\n4. Verify the solution\n\n[Mock math response for: ${prompt.slice(0, 50)}...]`,
      code: `Here's the code solution:\n\n\`\`\`python\n# Implementation\ndef solution():\n    # Your code here\n    pass\n\`\`\`\n\n[Mock code response for: ${prompt.slice(0, 50)}...]`,
      resume: `For your resume:\n\n• Use strong action words like "engineered", "optimized"\n• Quantify achievements (e.g., "improved by 40%")\n• Focus on impact and results\n\n[Mock resume response for: ${prompt.slice(0, 50)}...]`,
      web: `Web development solution:\n\n\`\`\`html\n<div class="container">\n  <!-- Your component here -->\n</div>\n\`\`\`\n\n[Mock web response for: ${prompt.slice(0, 50)}...]`,
      general: `Here's a helpful response:\n\n[Mock general response for: ${prompt.slice(0, 50)}...]`,
    };

    return responses[context];
  }

  async dispose(): Promise<void> {
    this.initialized = false;
  }
}

// ============================================================================
// WebGPU Backend (browser, uses Transformers.js)
// ============================================================================

export class WebGPUInferenceBackend implements InferenceBackend {
  name = 'webgpu';
  type: 'local' = 'local';
  private initialized = false;
  private modelId: string;

  constructor(modelId: string = 'Xenova/gpt2') {
    this.modelId = modelId;
  }

  async initialize(): Promise<void> {
    // This would load Transformers.js pipeline
    // For now, just mark as initialized
    console.log(`[WebGPU] Initializing model: ${this.modelId}`);
    // In real implementation:
    // const { pipeline } = await import('@xenova/transformers');
    // this.pipeline = await pipeline('text-generation', this.modelId);
    this.initialized = true;
  }

  async infer(prompt: string, options?: InferenceOptions): Promise<InferenceResult> {
    if (!this.initialized) {
      throw new Error('WebGPU backend not initialized');
    }

    const startTime = Date.now();

    // Mock for now - real implementation would use loaded pipeline
    const text = `[WebGPU inference for: ${prompt.slice(0, 100)}...]`;

    return {
      text,
      tokensUsed: options?.maxTokens || 256,
      expertsActivated: options?.expertHints || [],
      routingScores: {},
      latencyMs: Date.now() - startTime,
    };
  }

  async dispose(): Promise<void> {
    this.initialized = false;
  }
}

// ============================================================================
// Remote Backend (API calls)
// ============================================================================

export interface RemoteBackendConfig {
  endpoint: string;
  apiKey?: string;
  headers?: Record<string, string>;
}

export class RemoteInferenceBackend implements InferenceBackend {
  name = 'remote';
  type: 'remote' = 'remote';
  private config: RemoteBackendConfig;

  constructor(config: RemoteBackendConfig) {
    this.config = config;
  }

  async initialize(): Promise<void> {
    // Validate endpoint is reachable
    console.log(`[Remote] Configured endpoint: ${this.config.endpoint}`);
  }

  async infer(prompt: string, options?: InferenceOptions): Promise<InferenceResult> {
    const startTime = Date.now();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...this.config.headers,
    };

    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }

    // This would make actual API call
    // For now, return mock
    const text = `[Remote inference for: ${prompt.slice(0, 100)}...]`;

    return {
      text,
      tokensUsed: options?.maxTokens || 256,
      expertsActivated: options?.expertHints || [],
      routingScores: {},
      latencyMs: Date.now() - startTime,
    };
  }

  async dispose(): Promise<void> {
    // Cleanup if needed
  }
}

// ============================================================================
// Inference Pipeline
// ============================================================================

export class InferencePipeline {
  private backend: InferenceBackend;
  private router: ExpertRouter;
  private initialized = false;

  constructor(backend: InferenceBackend) {
    this.backend = backend;
    this.router = new ExpertRouter();
  }

  async initialize(): Promise<void> {
    await this.backend.initialize();
    this.initialized = true;
  }

  /**
   * Run full inference pipeline
   */
  async run(input: string, options?: InferenceOptions): Promise<PipelineResult> {
    if (!this.initialized) {
      throw new Error('Pipeline not initialized. Call initialize() first.');
    }

    const startTime = Date.now();

    // 1. Route to experts
    const routing = this.router.route(input, MODEL_SPEC.activeExperts);

    // 2. Get context-specific template
    const template = PROMPT_TEMPLATES[`${routing.context}_problem`] ||
                     PROMPT_TEMPLATES.general_query;

    // 3. Build prompt with expert context
    const expertContext = routing.selectedExperts
      .map(e => `[${e.expert.name}]`)
      .join(' ');

    const framedPrompt = `${expertContext}\n\n${template.template.replace('{input}', input)}`;

    // 4. Run inference
    const response = await this.backend.infer(framedPrompt, {
      ...options,
      expertHints: routing.selectedExperts.map(e => e.expert.id),
    });

    // Update response with routing info
    response.expertsActivated = routing.selectedExperts.map(e => e.expert.id);
    response.routingScores = routing.routingScores;

    // 5. Extract action words if resume context
    const actionWords = extractActionWords(input);
    const suggestions = routing.context === 'resume'
      ? suggestStrongerWords(input)
      : [];

    return {
      input,
      context: routing.context,
      expertsSelected: routing.selectedExperts.map(e => e.expert),
      prompt: framedPrompt,
      response,
      actionWords,
      suggestions,
      totalLatencyMs: Date.now() - startTime,
    };
  }

  /**
   * Quick inference without full pipeline
   */
  async quickInfer(input: string): Promise<string> {
    const result = await this.run(input);
    return result.response.text;
  }

  /**
   * Get routing info without inference
   */
  routeOnly(input: string): ExpertRoutingResult {
    return this.router.route(input);
  }

  async dispose(): Promise<void> {
    await this.backend.dispose();
    this.initialized = false;
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

export function createMockPipeline(): InferencePipeline {
  return new InferencePipeline(new MockInferenceBackend());
}

export function createWebGPUPipeline(modelId?: string): InferencePipeline {
  return new InferencePipeline(new WebGPUInferenceBackend(modelId));
}

export function createRemotePipeline(config: RemoteBackendConfig): InferencePipeline {
  return new InferencePipeline(new RemoteInferenceBackend(config));
}

// ============================================================================
// CLI Integration
// ============================================================================

export async function runCLIInference(
  command: string,
  args: string[],
  backend?: InferenceBackend
): Promise<string> {
  const input = args.join(' ');
  // command can be used as context hint for routing (reserved for future use)
  void command;

  const pipeline = new InferencePipeline(backend || new MockInferenceBackend());
  await pipeline.initialize();

  try {
    const result = await pipeline.run(input, {
      maxTokens: 512,
      temperature: 0.7,
    });

    // Format output
    let output = '';
    output += `\n  Context: ${result.context.toUpperCase()}\n`;
    output += `  Experts: ${result.expertsSelected.map(e => e.name).join(', ')}\n`;
    output += `  Latency: ${result.totalLatencyMs}ms\n`;
    output += '\n' + '─'.repeat(50) + '\n\n';
    output += result.response.text;

    if (result.actionWords.length > 0) {
      output += '\n\n' + '─'.repeat(50) + '\n';
      output += '  Action Words Found:\n';
      for (const aw of result.actionWords) {
        output += `    • ${aw.word} - ${aw.meaning}\n`;
      }
    }

    if (result.suggestions.length > 0) {
      output += '\n  Suggested Stronger Words:\n';
      for (const aw of result.suggestions.slice(0, 3)) {
        output += `    → ${aw.word}\n`;
      }
    }

    return output;

  } finally {
    await pipeline.dispose();
  }
}

// ============================================================================
// Default Exports
// ============================================================================

export const router = new ExpertRouter();
