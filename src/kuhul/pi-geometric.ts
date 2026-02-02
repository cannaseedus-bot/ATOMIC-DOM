/**
 * K'UHUL π-Geometric Calculus Foundation
 *
 * Mathematical foundation where ALL geometry is π-modulated.
 * Implements tensor algebra, matrix inference, and AGL pipeline.
 *
 * Core axiom: "All curvature is π-modulated"
 */

// ============================================================================
// Constants
// ============================================================================

export const PI = Math.PI;
export const TAU = 2 * Math.PI;
export const PHI = (1 + Math.sqrt(5)) / 2; // Golden ratio

// ============================================================================
// Tensor Types
// ============================================================================

/**
 * Base tensor structure with π-modulation
 */
export interface PiTensorData {
  position: [number, number, number];    // [x, y, z] - scaled by π
  orientation: number;                    // θ = nπ/k for n,k ∈ ℤ
  scale: [number, number, number];       // [sx, sy, sz] - π-harmonic
  curvature: number;                     // κ = π/r for radius r
}

/**
 * Glyph as tensor representation
 */
export interface GlyphTensor extends PiTensorData {
  id: string;
  type: 'primitive' | 'compound' | 'quantifier';
  children: GlyphTensor[];
  relations: GlyphRelation[];
}

/**
 * Geometric relations between tensors
 */
export interface GlyphRelation {
  type: 'adjacent' | 'contained' | 'symmetric' | 'tangent' | 'parallel';
  target: string;
  weight: number;
}

// ============================================================================
// PiTensor Class
// ============================================================================

export class PiTensor {
  readonly data: PiTensorData;

  constructor(data: Partial<PiTensorData> = {}) {
    this.data = {
      position: data.position ?? [0, 0, 0],
      orientation: data.orientation ?? 0,
      scale: data.scale ?? [1, 1, 1],
      curvature: data.curvature ?? 0,
    };
  }

  /**
   * Get π-modulated position
   * P = (x·π, y·π, z·π)
   */
  getPosition(): [number, number, number] {
    return [
      this.data.position[0] * PI,
      this.data.position[1] * PI,
      this.data.position[2] * PI,
    ];
  }

  /**
   * Get canonical orientation
   * θ = nπ/k normalized to [0, 2π)
   */
  getOrientation(): number {
    let theta = this.data.orientation;
    while (theta < 0) theta += TAU;
    while (theta >= TAU) theta -= TAU;
    return theta;
  }

  /**
   * Get π-harmonic scale
   * S = (sx·π^α, sy·π^β, sz·π^γ) for rational exponents
   */
  getScale(): [number, number, number] {
    return this.data.scale;
  }

  /**
   * Get curvature (κ = π/r)
   */
  getCurvature(): number {
    return this.data.curvature;
  }

  /**
   * Compute radius from curvature
   * r = π/κ (undefined for κ=0, returns Infinity)
   */
  getRadius(): number {
    if (this.data.curvature === 0) return Infinity;
    return PI / this.data.curvature;
  }

  /**
   * Compose two tensors (affine combination)
   */
  compose(other: PiTensor, weight: number = 0.5): PiTensor {
    const w1 = 1 - weight;
    const w2 = weight;

    return new PiTensor({
      position: [
        this.data.position[0] * w1 + other.data.position[0] * w2,
        this.data.position[1] * w1 + other.data.position[1] * w2,
        this.data.position[2] * w1 + other.data.position[2] * w2,
      ],
      orientation: this.data.orientation * w1 + other.data.orientation * w2,
      scale: [
        this.data.scale[0] * w1 + other.data.scale[0] * w2,
        this.data.scale[1] * w1 + other.data.scale[1] * w2,
        this.data.scale[2] * w1 + other.data.scale[2] * w2,
      ],
      curvature: this.data.curvature * w1 + other.data.curvature * w2,
    });
  }

  /**
   * Rotate tensor by π/n
   */
  rotate(n: number): PiTensor {
    return new PiTensor({
      ...this.data,
      orientation: this.data.orientation + PI / n,
    });
  }

  /**
   * Scale tensor by π-harmonic factor
   */
  scaleBy(factor: number): PiTensor {
    return new PiTensor({
      ...this.data,
      scale: [
        this.data.scale[0] * factor,
        this.data.scale[1] * factor,
        this.data.scale[2] * factor,
      ],
    });
  }

  /**
   * Translate tensor
   */
  translate(dx: number, dy: number, dz: number = 0): PiTensor {
    return new PiTensor({
      ...this.data,
      position: [
        this.data.position[0] + dx,
        this.data.position[1] + dy,
        this.data.position[2] + dz,
      ],
    });
  }

  /**
   * Check if tensor represents a circle (curvature > 0)
   */
  isCircular(): boolean {
    return this.data.curvature > 0;
  }

  /**
   * Check if tensor represents a line (curvature = 0)
   */
  isLinear(): boolean {
    return this.data.curvature === 0;
  }

  /**
   * Serialize to JSON
   */
  toJSON(): PiTensorData {
    return { ...this.data };
  }

  /**
   * Create from JSON
   */
  static fromJSON(json: PiTensorData): PiTensor {
    return new PiTensor(json);
  }
}

// ============================================================================
// Matrix Inference Engine
// ============================================================================

/**
 * Inference rule types based on geometric relations
 */
export type InferenceRule =
  | 'adjacency_to_sequence'    // Adjacent glyphs → sequential execution
  | 'containment_to_scope'     // Contained glyphs → scoped execution
  | 'symmetry_to_duality'      // Symmetric glyphs → dual operations
  | 'tangent_to_dependency'    // Tangent contact → data dependency
  | 'parallel_to_concurrent';  // Parallel lines → concurrent execution

export interface InferenceResult {
  rule: InferenceRule;
  source: string[];
  target: string;
  confidence: number;
  metadata: Record<string, unknown>;
}

export interface MatrixCell {
  row: string;
  col: string;
  relation: GlyphRelation['type'] | null;
  weight: number;
}

/**
 * Matrix Inference Engine
 *
 * Implements geometric rewrite rules:
 * - Adjacency → Sequence (A ⊣ B ⟹ A; B)
 * - Containment → Scope (A ⊃ B ⟹ A { B })
 * - Symmetry → Duality (A ≅ B ⟹ A ↔ B)
 */
export class MatrixInference {
  private glyphs: Map<string, GlyphTensor> = new Map();
  private adjacencyMatrix: Map<string, MatrixCell[]> = new Map();

  /**
   * Register a glyph tensor
   */
  register(glyph: GlyphTensor): void {
    this.glyphs.set(glyph.id, glyph);
    this.updateAdjacencyMatrix(glyph);
  }

  /**
   * Update adjacency matrix with new glyph
   */
  private updateAdjacencyMatrix(glyph: GlyphTensor): void {
    const cells: MatrixCell[] = [];

    for (const relation of glyph.relations) {
      cells.push({
        row: glyph.id,
        col: relation.target,
        relation: relation.type,
        weight: relation.weight,
      });
    }

    this.adjacencyMatrix.set(glyph.id, cells);
  }

  /**
   * Infer execution semantics from geometric relations
   */
  infer(): InferenceResult[] {
    const results: InferenceResult[] = [];

    for (const [id, cells] of this.adjacencyMatrix) {
      for (const cell of cells) {
        const result = this.applyRule(id, cell);
        if (result) {
          results.push(result);
        }
      }
    }

    return this.sortByConfidence(results);
  }

  /**
   * Apply geometric rewrite rule
   */
  private applyRule(sourceId: string, cell: MatrixCell): InferenceResult | null {
    if (!cell.relation) return null;

    switch (cell.relation) {
      case 'adjacent':
        return {
          rule: 'adjacency_to_sequence',
          source: [sourceId, cell.col],
          target: `${sourceId}; ${cell.col}`,
          confidence: cell.weight,
          metadata: { type: 'sequential' },
        };

      case 'contained':
        return {
          rule: 'containment_to_scope',
          source: [sourceId, cell.col],
          target: `${sourceId} { ${cell.col} }`,
          confidence: cell.weight,
          metadata: { type: 'scoped' },
        };

      case 'symmetric':
        return {
          rule: 'symmetry_to_duality',
          source: [sourceId, cell.col],
          target: `${sourceId} <-> ${cell.col}`,
          confidence: cell.weight,
          metadata: { type: 'dual' },
        };

      case 'tangent':
        return {
          rule: 'tangent_to_dependency',
          source: [sourceId, cell.col],
          target: `${cell.col} <- ${sourceId}`,
          confidence: cell.weight,
          metadata: { type: 'dependency' },
        };

      case 'parallel':
        return {
          rule: 'parallel_to_concurrent',
          source: [sourceId, cell.col],
          target: `${sourceId} || ${cell.col}`,
          confidence: cell.weight,
          metadata: { type: 'concurrent' },
        };

      default:
        return null;
    }
  }

  /**
   * Sort results by confidence descending
   */
  private sortByConfidence(results: InferenceResult[]): InferenceResult[] {
    return results.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Get all registered glyphs
   */
  getGlyphs(): GlyphTensor[] {
    return Array.from(this.glyphs.values());
  }

  /**
   * Get glyph by ID
   */
  getGlyph(id: string): GlyphTensor | undefined {
    return this.glyphs.get(id);
  }

  /**
   * Clear all registered glyphs
   */
  clear(): void {
    this.glyphs.clear();
    this.adjacencyMatrix.clear();
  }
}

// ============================================================================
// AGL Pipeline
// ============================================================================

export interface AGLProgram {
  glyphs: GlyphTensor[];
  inferences: InferenceResult[];
  executionPlan: ExecutionStep[];
}

export interface ExecutionStep {
  id: string;
  operation: 'sequence' | 'scope' | 'dual' | 'dependency' | 'concurrent';
  operands: string[];
  order: number;
}

/**
 * AGL (A Glyph Language) Pipeline
 *
 * Converts visual glyphs to executable semantics:
 * 1. Parse glyphs to tensors
 * 2. Detect geometric relations
 * 3. Apply inference rules
 * 4. Generate execution plan
 */
export class AGLPipeline {
  private inference: MatrixInference;

  constructor() {
    this.inference = new MatrixInference();
  }

  /**
   * Process raw glyph data into execution plan
   */
  process(input: GlyphInput[]): AGLProgram {
    // 1. Convert input to tensors
    const glyphs = input.map(g => this.parseGlyph(g));

    // 2. Register with inference engine
    for (const glyph of glyphs) {
      this.inference.register(glyph);
    }

    // 3. Run inference
    const inferences = this.inference.infer();

    // 4. Generate execution plan
    const executionPlan = this.generatePlan(inferences);

    return {
      glyphs,
      inferences,
      executionPlan,
    };
  }

  /**
   * Parse raw glyph input to tensor
   */
  private parseGlyph(input: GlyphInput): GlyphTensor {
    return {
      id: input.id,
      type: input.type ?? 'primitive',
      position: input.position ?? [0, 0, 0],
      orientation: input.orientation ?? 0,
      scale: input.scale ?? [1, 1, 1],
      curvature: input.curvature ?? 0,
      children: input.children?.map(c => this.parseGlyph(c)) ?? [],
      relations: input.relations ?? [],
    };
  }

  /**
   * Generate execution plan from inferences
   */
  private generatePlan(inferences: InferenceResult[]): ExecutionStep[] {
    const steps: ExecutionStep[] = [];
    let order = 0;

    // Group by rule type and create steps
    const sequenceInferences = inferences.filter(i => i.rule === 'adjacency_to_sequence');
    const scopeInferences = inferences.filter(i => i.rule === 'containment_to_scope');
    const concurrentInferences = inferences.filter(i => i.rule === 'parallel_to_concurrent');
    const dependencyInferences = inferences.filter(i => i.rule === 'tangent_to_dependency');
    const dualInferences = inferences.filter(i => i.rule === 'symmetry_to_duality');

    // Dependencies first (resolve data flow)
    for (const inf of dependencyInferences) {
      steps.push({
        id: `step-${order}`,
        operation: 'dependency',
        operands: inf.source,
        order: order++,
      });
    }

    // Concurrent operations can run in parallel
    for (const inf of concurrentInferences) {
      steps.push({
        id: `step-${order}`,
        operation: 'concurrent',
        operands: inf.source,
        order: order++,
      });
    }

    // Scoped operations (nested contexts)
    for (const inf of scopeInferences) {
      steps.push({
        id: `step-${order}`,
        operation: 'scope',
        operands: inf.source,
        order: order++,
      });
    }

    // Sequential operations
    for (const inf of sequenceInferences) {
      steps.push({
        id: `step-${order}`,
        operation: 'sequence',
        operands: inf.source,
        order: order++,
      });
    }

    // Dual operations (reversible)
    for (const inf of dualInferences) {
      steps.push({
        id: `step-${order}`,
        operation: 'dual',
        operands: inf.source,
        order: order++,
      });
    }

    return steps;
  }

  /**
   * Clear pipeline state
   */
  clear(): void {
    this.inference.clear();
  }
}

/**
 * Raw glyph input format
 */
export interface GlyphInput {
  id: string;
  type?: 'primitive' | 'compound' | 'quantifier';
  position?: [number, number, number];
  orientation?: number;
  scale?: [number, number, number];
  curvature?: number;
  children?: GlyphInput[];
  relations?: GlyphRelation[];
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Convert angle to π-fraction representation
 * e.g., 90° → π/2, 45° → π/4
 */
export function toPiFraction(degrees: number): { n: number; d: number } {
  const radians = (degrees * PI) / 180;
  const fraction = radians / PI;

  // Find closest simple fraction
  const denominators = [1, 2, 3, 4, 6, 8, 12];
  let bestN = Math.round(fraction);
  let bestD = 1;
  let bestError = Math.abs(fraction - bestN);

  for (const d of denominators) {
    const n = Math.round(fraction * d);
    const error = Math.abs(fraction - n / d);
    if (error < bestError) {
      bestN = n;
      bestD = d;
      bestError = error;
    }
  }

  return { n: bestN, d: bestD };
}

/**
 * Check if a number is π-harmonic (expressible as π^(n/m))
 */
export function isPiHarmonic(value: number, tolerance: number = 0.001): boolean {
  if (value <= 0) return false;

  const logPi = Math.log(value) / Math.log(PI);
  const rounded = Math.round(logPi * 12) / 12; // Check 12ths

  return Math.abs(logPi - rounded) < tolerance;
}

/**
 * Compute distance between two tensors
 */
export function tensorDistance(a: PiTensor, b: PiTensor): number {
  const [ax, ay, az] = a.getPosition();
  const [bx, by, bz] = b.getPosition();

  return Math.sqrt(
    (bx - ax) ** 2 +
    (by - ay) ** 2 +
    (bz - az) ** 2
  );
}

/**
 * Check if two tensors are adjacent (within threshold)
 */
export function areAdjacent(a: PiTensor, b: PiTensor, threshold: number = PI): boolean {
  return tensorDistance(a, b) < threshold;
}

/**
 * Check if tensor a contains tensor b
 */
export function contains(outer: GlyphTensor, inner: GlyphTensor): boolean {
  // Simple containment check based on position and scale
  const [ox, oy] = outer.position;
  const [ix, iy] = inner.position;
  const [osx, osy] = outer.scale;

  return (
    ix >= ox - osx && ix <= ox + osx &&
    iy >= oy - osy && iy <= oy + osy
  );
}

/**
 * Check if two tensors have reflective symmetry
 */
export function areSymmetric(a: GlyphTensor, b: GlyphTensor): boolean {
  // Check if orientations are π-related
  const diff = Math.abs(a.orientation - b.orientation);
  return Math.abs(diff - PI) < 0.01 || Math.abs(diff) < 0.01;
}

// ============================================================================
// Default Instances
// ============================================================================

export const matrixInference = new MatrixInference();
export const aglPipeline = new AGLPipeline();
