/**
 * K'UHUL Unified Inference API Server
 *
 * Single entry point for ALL inference operations.
 * Routes requests through the appropriate pipeline with π-Geometric integration.
 */

import type { ContextType } from './microatomics.js';
import type { InferenceOptions } from './backend.js';
import type { GlyphInput, AGLProgram, InferenceResult as GeometricInference } from './pi-geometric.js';

import { orchestrator } from './microatomics.js';
import {
  InferencePipeline,
  ExpertRouter,
  MockInferenceBackend,
  type InferenceBackend,
} from './backend.js';
import { MODEL_SPEC, getAllExperts, EXPERT_TAXONOMY, type ExpertSpec } from './training-spec.js';
import { MatrixInference, AGLPipeline } from './pi-geometric.js';

/**
 * Get category for an expert from taxonomy
 */
function getExpertCategory(expert: ExpertSpec): string {
  for (const [category, experts] of Object.entries(EXPERT_TAXONOMY)) {
    if (experts.some(e => e.id === expert.id)) {
      return category;
    }
  }
  return 'unknown';
}

// ============================================================================
// API Types
// ============================================================================

/**
 * Unified request format for all inference types
 */
export interface UnifiedRequest {
  /** Unique request ID */
  id?: string;
  /** Input text or glyph data */
  input: string | GlyphInput[];
  /** Request type */
  type: 'text' | 'glyph' | 'hybrid';
  /** Optional context hint */
  context?: ContextType;
  /** Inference options */
  options?: InferenceOptions;
  /** Include geometric analysis */
  geometric?: boolean;
  /** Stream response */
  stream?: boolean;
}

/**
 * Unified response format
 */
export interface UnifiedResponse {
  /** Request ID */
  id: string;
  /** Success flag */
  success: boolean;
  /** Response data */
  data: UnifiedResponseData;
  /** Timing information */
  timing: TimingInfo;
  /** Error if any */
  error?: string;
}

export interface UnifiedResponseData {
  /** Generated text response */
  text: string;
  /** Detected/used context */
  context: ContextType;
  /** Experts activated */
  experts: ExpertInfo[];
  /** Routing scores */
  routing: Record<string, number>;
  /** Action words found */
  actionWords: ActionWordInfo[];
  /** Suggested stronger words */
  suggestions: ActionWordInfo[];
  /** Geometric inference (if requested) */
  geometric?: GeometricData;
  /** Token usage */
  tokens: TokenUsage;
}

export interface ExpertInfo {
  id: string;
  name: string;
  category: string;
  score: number;
}

export interface ActionWordInfo {
  word: string;
  meaning: string;
  strength: 'strong' | 'moderate' | 'standard';
  category: string;
}

export interface GeometricData {
  tensors: TensorInfo[];
  inferences: GeometricInference[];
  program?: AGLProgram;
}

export interface TensorInfo {
  id: string;
  position: [number, number, number];
  orientation: number;
  curvature: number;
}

export interface TokenUsage {
  input: number;
  output: number;
  total: number;
}

export interface TimingInfo {
  total: number;
  routing: number;
  inference: number;
  geometric?: number;
}

// ============================================================================
// API Server
// ============================================================================

export interface ServerConfig {
  /** Backend to use for inference */
  backend?: InferenceBackend;
  /** Default inference options */
  defaultOptions?: InferenceOptions;
  /** Enable geometric processing */
  enableGeometric?: boolean;
  /** Maximum concurrent requests */
  maxConcurrent?: number;
}

/**
 * Unified Inference API Server
 *
 * Routes all inference through a single entry point:
 * - Text inference (standard prompts)
 * - Glyph inference (AGL programs)
 * - Hybrid inference (text + geometric analysis)
 */
export class UnifiedInferenceServer {
  private pipeline: InferencePipeline;
  private router: ExpertRouter;
  private geometricPipeline: AGLPipeline;
  private matrixInference: MatrixInference;
  private config: Required<ServerConfig>;
  private initialized = false;
  private requestCounter = 0;

  constructor(config: ServerConfig = {}) {
    this.config = {
      backend: config.backend ?? new MockInferenceBackend(),
      defaultOptions: config.defaultOptions ?? {
        maxTokens: 512,
        temperature: 0.7,
        topP: 0.9,
        topK: MODEL_SPEC.activeExperts,
      },
      enableGeometric: config.enableGeometric ?? true,
      maxConcurrent: config.maxConcurrent ?? 10,
    };

    this.pipeline = new InferencePipeline(this.config.backend);
    this.router = new ExpertRouter();
    this.geometricPipeline = new AGLPipeline();
    this.matrixInference = new MatrixInference();
  }

  /**
   * Initialize the server
   */
  async initialize(): Promise<void> {
    await this.pipeline.initialize();
    this.initialized = true;
  }

  /**
   * Main inference endpoint - handles all request types
   */
  async infer(request: UnifiedRequest): Promise<UnifiedResponse> {
    const startTime = Date.now();
    const requestId = request.id ?? `req-${++this.requestCounter}`;

    if (!this.initialized) {
      return this.errorResponse(requestId, 'Server not initialized. Call initialize() first.');
    }

    try {
      switch (request.type) {
        case 'text':
          return await this.handleTextRequest(requestId, request, startTime);

        case 'glyph':
          return await this.handleGlyphRequest(requestId, request, startTime);

        case 'hybrid':
          return await this.handleHybridRequest(requestId, request, startTime);

        default:
          return this.errorResponse(requestId, `Unknown request type: ${request.type}`);
      }
    } catch (error) {
      return this.errorResponse(
        requestId,
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  /**
   * Handle text-based inference request
   */
  private async handleTextRequest(
    id: string,
    request: UnifiedRequest,
    startTime: number
  ): Promise<UnifiedResponse> {
    const input = request.input as string;
    const routingStart = Date.now();

    // Route to experts
    const routing = this.router.route(input, this.config.defaultOptions.topK);
    const routingTime = Date.now() - routingStart;

    // Run inference
    const inferenceStart = Date.now();
    const result = await this.pipeline.run(input, {
      ...this.config.defaultOptions,
      ...request.options,
    });
    const inferenceTime = Date.now() - inferenceStart;

    // Get geometric analysis if requested
    let geometric: GeometricData | undefined;
    let geometricTime: number | undefined;

    if (request.geometric && this.config.enableGeometric) {
      const geoStart = Date.now();
      geometric = this.analyzeTextGeometry(input);
      geometricTime = Date.now() - geoStart;
    }

    return {
      id,
      success: true,
      data: {
        text: result.response.text,
        context: result.context,
        experts: result.expertsSelected.map(e => ({
          id: e.id,
          name: e.name,
          category: getExpertCategory(e),
          score: routing.routingScores[e.id] ?? 0,
        })),
        routing: routing.routingScores,
        actionWords: result.actionWords.map(aw => ({
          word: aw.word,
          meaning: aw.meaning,
          strength: aw.strength,
          category: aw.category,
        })),
        suggestions: result.suggestions.map(s => ({
          word: s.word,
          meaning: s.meaning,
          strength: s.strength,
          category: s.category,
        })),
        geometric,
        tokens: {
          input: input.split(/\s+/).length,
          output: result.response.tokensUsed,
          total: input.split(/\s+/).length + result.response.tokensUsed,
        },
      },
      timing: {
        total: Date.now() - startTime,
        routing: routingTime,
        inference: inferenceTime,
        geometric: geometricTime,
      },
    };
  }

  /**
   * Handle glyph-based (AGL) inference request
   */
  private async handleGlyphRequest(
    id: string,
    request: UnifiedRequest,
    startTime: number
  ): Promise<UnifiedResponse> {
    const glyphs = request.input as GlyphInput[];
    const geometricStart = Date.now();

    // Process through AGL pipeline
    const program = this.geometricPipeline.process(glyphs);
    const geometricTime = Date.now() - geometricStart;

    // Convert program to text representation
    const textRepresentation = this.programToText(program);

    // Route based on generated text
    const routingStart = Date.now();
    const routing = this.router.route(textRepresentation, this.config.defaultOptions.topK);
    const routingTime = Date.now() - routingStart;

    // Run text inference on the program representation
    const inferenceStart = Date.now();
    const result = await this.pipeline.run(textRepresentation, {
      ...this.config.defaultOptions,
      ...request.options,
    });
    const inferenceTime = Date.now() - inferenceStart;

    return {
      id,
      success: true,
      data: {
        text: result.response.text,
        context: result.context,
        experts: result.expertsSelected.map(e => ({
          id: e.id,
          name: e.name,
          category: getExpertCategory(e),
          score: routing.routingScores[e.id] ?? 0,
        })),
        routing: routing.routingScores,
        actionWords: [],
        suggestions: [],
        geometric: {
          tensors: program.glyphs.map(g => ({
            id: g.id,
            position: g.position,
            orientation: g.orientation,
            curvature: g.curvature,
          })),
          inferences: program.inferences,
          program,
        },
        tokens: {
          input: textRepresentation.split(/\s+/).length,
          output: result.response.tokensUsed,
          total: textRepresentation.split(/\s+/).length + result.response.tokensUsed,
        },
      },
      timing: {
        total: Date.now() - startTime,
        routing: routingTime,
        inference: inferenceTime,
        geometric: geometricTime,
      },
    };
  }

  /**
   * Handle hybrid request (text + geometric analysis)
   */
  private async handleHybridRequest(
    id: string,
    request: UnifiedRequest,
    startTime: number
  ): Promise<UnifiedResponse> {
    // For hybrid, we process text but with full geometric analysis
    const modifiedRequest: UnifiedRequest = {
      ...request,
      type: 'text',
      geometric: true,
    };

    return this.handleTextRequest(id, modifiedRequest, startTime);
  }

  /**
   * Analyze text input for geometric patterns
   */
  private analyzeTextGeometry(input: string): GeometricData {
    // Extract geometric concepts from text
    const tensors: TensorInfo[] = [];
    const inferences: GeometricInference[] = [];

    // Look for geometric keywords
    const patterns = [
      { regex: /circle|circular|round/gi, curvature: Math.PI },
      { regex: /line|linear|straight/gi, curvature: 0 },
      { regex: /angle|corner|vertex/gi, curvature: Math.PI / 4 },
      { regex: /curve|arc|bend/gi, curvature: Math.PI / 2 },
    ];

    let tensorId = 0;
    for (const pattern of patterns) {
      const matches = input.match(pattern.regex);
      if (matches) {
        for (const _match of matches) {
          tensors.push({
            id: `tensor-${tensorId++}`,
            position: [tensorId, 0, 0],
            orientation: 0,
            curvature: pattern.curvature,
          });
        }
      }
    }

    // Generate inferences based on text structure
    const sentences = input.split(/[.!?]+/);
    for (let i = 0; i < sentences.length - 1; i++) {
      inferences.push({
        rule: 'adjacency_to_sequence',
        source: [`sentence-${i}`, `sentence-${i + 1}`],
        target: `${sentences[i].trim()}; ${sentences[i + 1].trim()}`,
        confidence: 0.8,
        metadata: { type: 'sequential' },
      });
    }

    return { tensors, inferences };
  }

  /**
   * Convert AGL program to text representation
   */
  private programToText(program: AGLProgram): string {
    const lines: string[] = [];

    lines.push('AGL Program Execution:');
    lines.push('');

    for (const step of program.executionPlan) {
      switch (step.operation) {
        case 'sequence':
          lines.push(`Sequential: ${step.operands.join(' -> ')}`);
          break;
        case 'scope':
          lines.push(`Scoped: ${step.operands[0]} contains ${step.operands.slice(1).join(', ')}`);
          break;
        case 'concurrent':
          lines.push(`Parallel: ${step.operands.join(' || ')}`);
          break;
        case 'dependency':
          lines.push(`Dependency: ${step.operands[1]} depends on ${step.operands[0]}`);
          break;
        case 'dual':
          lines.push(`Dual: ${step.operands.join(' <-> ')}`);
          break;
      }
    }

    return lines.join('\n');
  }

  /**
   * Create error response
   */
  private errorResponse(id: string, message: string): UnifiedResponse {
    return {
      id,
      success: false,
      data: {
        text: '',
        context: 'general',
        experts: [],
        routing: {},
        actionWords: [],
        suggestions: [],
        tokens: { input: 0, output: 0, total: 0 },
      },
      timing: { total: 0, routing: 0, inference: 0 },
      error: message,
    };
  }

  /**
   * Quick inference helper
   */
  async quick(input: string): Promise<string> {
    const response = await this.infer({
      input,
      type: 'text',
    });

    if (!response.success) {
      throw new Error(response.error);
    }

    return response.data.text;
  }

  /**
   * Route-only (no inference)
   */
  route(input: string): { context: ContextType; experts: ExpertInfo[]; scores: Record<string, number> } {
    const routing = this.router.route(input);

    return {
      context: routing.context,
      experts: routing.selectedExperts.map(e => ({
        id: e.expert.id,
        name: e.expert.name,
        category: getExpertCategory(e.expert),
        score: e.normalizedScore ?? e.score,
      })),
      scores: routing.routingScores,
    };
  }

  /**
   * Health check
   */
  health(): { status: string; initialized: boolean; backend: string } {
    return {
      status: this.initialized ? 'healthy' : 'not initialized',
      initialized: this.initialized,
      backend: this.config.backend.name,
    };
  }

  /**
   * Get server stats
   */
  stats(): { requests: number; experts: number; microatomics: number } {
    return {
      requests: this.requestCounter,
      experts: getAllExperts().length,
      microatomics: orchestrator.getActive().length,
    };
  }

  /**
   * Dispose server resources
   */
  async dispose(): Promise<void> {
    await this.pipeline.dispose();
    this.geometricPipeline.clear();
    this.matrixInference.clear();
    this.initialized = false;
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create server with mock backend (for testing)
 */
export function createMockServer(config?: Partial<ServerConfig>): UnifiedInferenceServer {
  return new UnifiedInferenceServer({
    backend: new MockInferenceBackend(),
    ...config,
  });
}

/**
 * Create server with remote backend
 */
export function createRemoteServer(
  endpoint: string,
  apiKey?: string,
  config?: Partial<ServerConfig>
): UnifiedInferenceServer {
  const { RemoteInferenceBackend } = require('./backend.js');
  return new UnifiedInferenceServer({
    backend: new RemoteInferenceBackend({ endpoint, apiKey }),
    ...config,
  });
}

// ============================================================================
// Express/HTTP Integration Helpers
// ============================================================================

export interface HTTPRequest {
  method: string;
  path: string;
  body?: unknown;
  headers?: Record<string, string>;
}

export interface HTTPResponse {
  status: number;
  body: unknown;
  headers?: Record<string, string>;
}

/**
 * HTTP handler for the unified inference endpoint
 */
export async function handleHTTPRequest(
  server: UnifiedInferenceServer,
  req: HTTPRequest
): Promise<HTTPResponse> {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return { status: 204, body: '', headers: corsHeaders };
  }

  // Parse path
  const path = req.path.replace(/^\/api\/v1/, '');

  switch (path) {
    case '/infer':
    case '/inference':
      if (req.method !== 'POST') {
        return { status: 405, body: { error: 'Method not allowed' }, headers: corsHeaders };
      }

      const request = req.body as UnifiedRequest;
      const response = await server.infer(request);

      return {
        status: response.success ? 200 : 400,
        body: response,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      };

    case '/route':
      if (req.method !== 'POST') {
        return { status: 405, body: { error: 'Method not allowed' }, headers: corsHeaders };
      }

      const routeReq = req.body as { input: string };
      const routeResult = server.route(routeReq.input);

      return {
        status: 200,
        body: routeResult,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      };

    case '/health':
      return {
        status: 200,
        body: server.health(),
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      };

    case '/stats':
      return {
        status: 200,
        body: server.stats(),
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      };

    default:
      return { status: 404, body: { error: 'Not found' }, headers: corsHeaders };
  }
}

// ============================================================================
// Default Instance
// ============================================================================

export const inferenceServer = new UnifiedInferenceServer();
