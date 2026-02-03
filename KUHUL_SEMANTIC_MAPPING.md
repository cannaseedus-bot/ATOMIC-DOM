# K'UHUL Semantic Mapping

> **K'UHUL tags are NOT syntax sugar. They are tensor coordinates in semantic space—a navigable map for AI inference.**

This document explains the foundational concept that makes K'UHUL different from traditional markup languages: tags create a **geometric coordinate system** that AI navigates, rather than text that AI "understands."

---

## Table of Contents

1. [The Core Insight](#the-core-insight)
2. [Three Mapping Techniques](#three-mapping-techniques)
   - [Tensor Mapping](#1-tensor-mapping-position-in-semantic-space)
   - [Encryption Mapping](#2-encryption-mapping-key-value-semantic-cipher)
   - [Matrix Inference](#3-matrix-inference-relationship-mapping)
3. [How AI Uses the Map](#how-ai-uses-the-map)
4. [The Expert Router as Navigator](#the-expert-router-as-navigator)
5. [Visual: The Complete Semantic Space](#visual-the-complete-semantic-space)
6. [Code Examples](#code-examples)
7. [Why This Matters](#why-this-matters)

---

## The Core Insight

Traditional AI processes text **linguistically**—it tokenizes, embeds, attends, and generates. This creates ambiguity, context loss, and hallucination.

K'UHUL AI processes **geometrically**—it locates coordinates, navigates to positions, activates regional experts, and generates from exact semantic locations.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│   TRADITIONAL AI                        K'UHUL AI                       │
│   ─────────────                         ─────────                       │
│                                                                         │
│   Input: "derivative of x²"             Input: @atomic [math-calc-deriv]│
│      ↓                                     ↓                            │
│   Tokenize → Embed → Attend             Parse tag → Extract coordinates │
│      ↓                                     ↓                            │
│   "What might this mean?"               Position: (0.9, 0.8, 0.95)      │
│      ↓                                     ↓                            │
│   Generate (with uncertainty)           Navigate to exact location      │
│                                            ↓                            │
│   Problem: Ambiguity                    Activate regional experts       │
│   - Could be calculus                      ↓                            │
│   - Could be finance                    Generate from coordinates       │
│   - Could be linguistics                                                │
│                                         Result: ZERO ambiguity          │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Three Mapping Techniques

### 1. Tensor Mapping (Position in Semantic Space)

Every K'UHUL block exists at specific coordinates in a multi-dimensional semantic space. The tag **IS** the coordinate.

```
Tag Structure:     @atomic [domain-topic-subtopic]
                           ↓      ↓       ↓
Tensor Position:         dim1   dim2    dim3


Example:           @atomic [math-calc-derivative]
                           ↓      ↓        ↓
Position Vector:        (0.9,  0.8,     0.95)
                         │      │         │
                         │      │         └── derivative specificity
                         │      └──────────── calculus domain
                         └─────────────────── mathematics field
```

#### The π-Modulation

All positions are π-modulated, meaning coordinates exist on circular/spherical manifolds:

```
                        π
                        │
                    ────┼────
                   /    │    \
                  /     │     \
            3π/4 ●      │      ● π/4      ← Orientation angles
                 │      │      │
            ─────┼──────┼──────┼─────
                 │      │      │
            5π/4 ●      │      ● 7π/4
                  \     │     /
                   \    │    /
                    ────┼────
                        │
                       2π

Position P = (x·π, y·π, z·π)
Orientation θ = nπ/k for integers n, k
Curvature κ = π/r for radius r
```

#### Why Tensors?

Tensors enable:
- **Composition**: Combine multiple concepts geometrically
- **Transformation**: Rotate, scale, translate through semantic space
- **Distance**: Measure semantic similarity as geometric distance
- **Interpolation**: Find concepts "between" other concepts

```typescript
// Two concepts as tensors
const algebra = new PiTensor({ position: [0.9, 0.5, 0.3] });
const geometry = new PiTensor({ position: [0.9, 0.7, 0.8] });

// Find concept between them (linear algebra!)
const linearAlgebra = algebra.compose(geometry, 0.5);
// Position: (0.9, 0.6, 0.55) — exactly between algebra and geometry
```

---

### 2. Encryption Mapping (Key-Value Semantic Cipher)

Tags function like **encryption keys** that unlock precise meaning from ambiguous content.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         ENCRYPTION ANALOGY                              │
│                                                                         │
│   Traditional Encryption:                                               │
│   ┌──────────┐    ┌──────────┐    ┌──────────────────┐                 │
│   │   KEY    │ +  │ PAYLOAD  │ =  │ DECRYPTED DATA   │                 │
│   └──────────┘    └──────────┘    └──────────────────┘                 │
│                                                                         │
│   K'UHUL Semantic Cipher:                                               │
│   ┌──────────────────┐    ┌──────────┐    ┌──────────────────┐         │
│   │ @atomic [tag]    │ +  │ content  │ =  │ EXACT SEMANTICS  │         │
│   │ (semantic key)   │    │ (payload)│    │ (no ambiguity)   │         │
│   └──────────────────┘    └──────────┘    └──────────────────┘         │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Example: The Same Content, Different Keys

```
Content: "derivative"

Without key (ambiguous):
├── Mathematics? (rate of change)
├── Finance? (financial instrument)
├── Linguistics? (derived word form)
├── Chemistry? (derived compound)
└── Law? (derived right)

With K'UHUL key (unambiguous):

@atomic [math-calc] { derivative }     → Calculus: rate of change
@atomic [finance-instruments] { derivative }  → Finance: futures/options
@atomic [linguistics-morphology] { derivative } → Word formation
@atomic [chemistry-organic] { derivative }   → Chemical compound
@atomic [law-ip] { derivative }        → Derivative work (copyright)
```

#### The Cipher Structure

```
Tag:        @domain [category-topic-subtopic]
             ↓            ↓
           ALGORITHM    INITIALIZATION VECTOR

Content:   { ... payload ... }
             ↓
           CIPHERTEXT (ambiguous without key)

Result:    PLAINTEXT (exact semantic meaning)


The tag doesn't just LABEL the content—it DECRYPTS it.
```

---

### 3. Matrix Inference (Relationship Mapping)

Blocks relate to each other through **geometric relationships** that directly map to execution semantics. This is not metaphor—it's the actual inference algorithm.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    GEOMETRIC RELATIONS → EXECUTION                      │
│                                                                         │
│   ADJACENT (⊣)                         SEQUENTIAL EXECUTION             │
│   ┌───────┐ ┌───────┐                                                   │
│   │   A   │ │   B   │         →        A ; B                            │
│   └───────┘ └───────┘                  (A then B)                       │
│                                                                         │
│   ─────────────────────────────────────────────────────────────────     │
│                                                                         │
│   CONTAINED (⊃)                        SCOPED EXECUTION                 │
│   ┌─────────────────┐                                                   │
│   │   A             │                                                   │
│   │  ┌───────┐      │         →        A { B }                          │
│   │  │   B   │      │                  (B in A's scope)                 │
│   │  └───────┘      │                                                   │
│   └─────────────────┘                                                   │
│                                                                         │
│   ─────────────────────────────────────────────────────────────────     │
│                                                                         │
│   SYMMETRIC (≅)                        BIDIRECTIONAL OPS                │
│   ┌───────┐   ┌───────┐                                                 │
│   │   A   │ ≅ │   B   │       →        A ↔ B                            │
│   └───────┘   └───────┘                (A implies B, B implies A)       │
│                                                                         │
│   ─────────────────────────────────────────────────────────────────     │
│                                                                         │
│   TANGENT (◯)                          DATA DEPENDENCY                  │
│       ┌───────┐                                                         │
│      /    A   │                                                         │
│     │ ┌───────┤               →        B ← A                            │
│     │ │   B   │                        (B depends on A's output)        │
│      \└───────┘                                                         │
│                                                                         │
│   ─────────────────────────────────────────────────────────────────     │
│                                                                         │
│   PARALLEL (∥)                         CONCURRENT EXECUTION             │
│   ┌───────┐                                                             │
│   │   A   │                                                             │
│   └───────┘                   →        A || B                           │
│   ┌───────┐                            (A and B run simultaneously)     │
│   │   B   │                                                             │
│   └───────┘                                                             │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

#### The Adjacency Matrix

Relationships are stored in an adjacency matrix that the inference engine reads:

```
              │ block-A │ block-B │ block-C │ block-D │
──────────────┼─────────┼─────────┼─────────┼─────────┤
   block-A    │    -    │ adjacent│contained│  null   │
   block-B    │ adjacent│    -    │  null   │parallel │
   block-C    │contained│  null   │    -    │ tangent │
   block-D    │  null   │parallel │ tangent │    -    │


Reading the matrix:
- A is adjacent to B      → A ; B (sequential)
- A contains C            → A { C } (scoped)
- B is parallel to D      → B || D (concurrent)
- C is tangent to D       → D ← C (dependency)
```

#### Matrix Inference Rules

```typescript
// The inference engine applies these rules:

switch (relation) {
  case 'adjacent':
    // A ⊣ B  →  A; B
    return { type: 'sequence', order: [A, B] };

  case 'contained':
    // A ⊃ B  →  A { B }
    return { type: 'scope', outer: A, inner: B };

  case 'symmetric':
    // A ≅ B  →  A ↔ B
    return { type: 'bidirectional', pair: [A, B] };

  case 'tangent':
    // A ◯ B  →  B ← A
    return { type: 'dependency', source: A, target: B };

  case 'parallel':
    // A ∥ B  →  A || B
    return { type: 'concurrent', group: [A, B] };
}
```

---

## How AI Uses the Map

The AI doesn't "read" or "understand" your code. It **navigates** to coordinates and **activates** regional experts.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         AI NAVIGATION PROCESS                           │
│                                                                         │
│  Step 1: PARSE TAG                                                      │
│  ─────────────────                                                      │
│  @atomic [math-calc-derivative] { f(x) = x² }                          │
│           │    │       │                                                │
│           ▼    ▼       ▼                                                │
│        dim1  dim2    dim3                                               │
│                                                                         │
│  Step 2: COMPUTE COORDINATES                                            │
│  ───────────────────────────                                            │
│  Position = (                                                           │
│    math: 0.9,        // High mathematics activation                     │
│    calc: 0.8,        // High calculus activation                        │
│    derivative: 0.95  // Very high derivative specificity                │
│  )                                                                      │
│                                                                         │
│  Step 3: NAVIGATE SEMANTIC SPACE                                        │
│  ───────────────────────────────                                        │
│                                                                         │
│     KNOWLEDGE SPACE                                                     │
│     ══════════════                                                      │
│            math-pure                                                    │
│               ╲                                                         │
│                ╲   math-calc                                            │
│                 ╲     ╲                                                 │
│                  ╲     ╲                                                │
│                   ╲     ●━━━ YOU ARE HERE                               │
│                    ╲    │    (math-calc-derivative)                     │
│                     ╲   │                                               │
│       lang-python ───●──┤                                               │
│                      │  │                                               │
│                      │  │                                               │
│            web-api ──●──┘                                               │
│                                                                         │
│  Step 4: ACTIVATE REGIONAL EXPERTS                                      │
│  ─────────────────────────────────                                      │
│  Experts within radius of (0.9, 0.8, 0.95):                            │
│  ┌────────────────────┬────────────┬────────────┐                      │
│  │ Expert             │ Distance   │ Activation │                      │
│  ├────────────────────┼────────────┼────────────┤                      │
│  │ math-calculus      │ 0.05       │ 0.95       │                      │
│  │ math-analysis      │ 0.12       │ 0.88       │                      │
│  │ math-algebra       │ 0.25       │ 0.75       │                      │
│  │ lang-python-scipy  │ 0.40       │ 0.60       │                      │
│  └────────────────────┴────────────┴────────────┘                      │
│                                                                         │
│  Step 5: WEIGHTED GENERATION                                            │
│  ───────────────────────────                                            │
│  Output = Σ (expert_i × activation_i)                                   │
│                                                                         │
│  Result: Response generated from EXACT semantic coordinates             │
│          with weighted expert contributions                             │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## The Expert Router as Navigator

The K'UHUL expert router is a **navigator**, not a classifier. It doesn't categorize—it computes positions and finds nearby experts.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         EXPERT ROUTER                                   │
│                                                                         │
│  Input: @atomic [web-api-rest] { endpoint design }                     │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    ROUTING COMPUTATION                          │   │
│  │                                                                 │   │
│  │  1. Parse tag → coordinates                                     │   │
│  │     web: 0.85, api: 0.90, rest: 0.95                           │   │
│  │                                                                 │   │
│  │  2. Build search region (hypersphere)                          │   │
│  │     center: (0.85, 0.90, 0.95)                                 │   │
│  │     radius: 0.3 (configurable)                                 │   │
│  │                                                                 │   │
│  │  3. Find experts in region                                      │   │
│  │     ┌──────────────────────────────────────────────────────┐   │   │
│  │     │  Expert Index (spatial data structure)               │   │   │
│  │     │                                                      │   │   │
│  │     │  web-api-expert      @ (0.85, 0.92, 0.88) ✓ IN      │   │   │
│  │     │  web-frontend-expert @ (0.82, 0.40, 0.30) ✗ OUT     │   │   │
│  │     │  infra-http-expert   @ (0.70, 0.85, 0.75) ✓ IN      │   │   │
│  │     │  lang-js-expert      @ (0.60, 0.70, 0.50) ~ EDGE    │   │   │
│  │     │  math-stats-expert   @ (0.90, 0.20, 0.15) ✗ OUT     │   │   │
│  │     └──────────────────────────────────────────────────────┘   │   │
│  │                                                                 │   │
│  │  4. Compute activation weights (inverse distance)               │   │
│  │     web-api:    1/0.08 = 12.5 → normalized: 0.45               │   │
│  │     infra-http: 1/0.22 = 4.5  → normalized: 0.32               │   │
│  │     lang-js:    1/0.35 = 2.8  → normalized: 0.23               │   │
│  │                                                                 │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  Output: [                                                              │
│    { expert: 'web-api', activation: 0.45 },                            │
│    { expert: 'infra-http', activation: 0.32 },                         │
│    { expert: 'lang-js', activation: 0.23 }                             │
│  ]                                                                      │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Router vs Classifier

```
┌────────────────────────────┬────────────────────────────────────────────┐
│     TRADITIONAL CLASSIFIER │     K'UHUL NAVIGATOR                       │
├────────────────────────────┼────────────────────────────────────────────┤
│ Input → Features → Class   │ Tag → Coordinates → Region → Experts      │
│                            │                                            │
│ "What category is this?"   │ "Where is this located?"                  │
│                            │                                            │
│ Discrete output (1 class)  │ Continuous output (weighted experts)      │
│                            │                                            │
│ Hard boundaries            │ Soft, overlapping regions                  │
│                            │                                            │
│ Learns from examples       │ Defined by coordinate system               │
│                            │                                            │
│ Can misclassify            │ Cannot—coordinates are exact              │
└────────────────────────────┴────────────────────────────────────────────┘
```

---

## Visual: The Complete Semantic Space

```
                              SEMANTIC SPACE (3D projection of n-dimensional)
    ┌─────────────────────────────────────────────────────────────────────────────┐
    │                                                                             │
    │                                    ● math-pure-topology                     │
    │                                   /                                         │
    │                                  /   ● math-pure-algebra                    │
    │                                 /   /                                       │
    │                   ● math-calc-integral                                      │
    │                    \           /   /                                        │
    │                     \         /   /                                         │
    │                      \       /   /                                          │
    │     ● math-stats ─────● math-calc-derivative                               │
    │          \             \                                                    │
    │           \             \                                                   │
    │            \             \    ● lang-python-numpy                          │
    │             \             \  /                                              │
    │              \             \/                                               │
    │               \            /\                                               │
    │                \          /  \                                              │
    │                 \        /    ● lang-python-scipy                          │
    │                  \      /                                                   │
    │                   \    /        ● lang-js-node                             │
    │                    \  /        /                                            │
    │                     \/        /                                             │
    │      ● data-ml ─────●────────/                                             │
    │           \        / \      /                                               │
    │            \      /   \    /                                                │
    │             \    /     \  /                                                 │
    │              \  /       \/                                                  │
    │               ●─────────●───────● web-api-rest                             │
    │              / \       / \       \                                          │
    │             /   \     /   \       \                                         │
    │            /     \   /     \       ● web-api-graphql                       │
    │           /       \ /       \                                               │
    │          /         ●         \                                              │
    │         /    web-frontend     \                                             │
    │        /                       \                                            │
    │       ● infra-docker            ● infra-k8s                                │
    │        \                       /                                            │
    │         \                     /                                             │
    │          \                   /                                              │
    │           ● infra-cloud-aws ●                                              │
    │                                                                             │
    │                                                                             │
    │   LEGEND:                                                                   │
    │   ───────                                                                   │
    │   ● = Expert location (tensor position)                                    │
    │   ─ = Proximity relationship (< threshold distance)                        │
    │   Clusters = Domains of related expertise                                  │
    │                                                                             │
    │   When you write @atomic [math-calc-derivative]:                           │
    │   1. AI locates the ● for math-calc-derivative                            │
    │   2. Finds all ● within radius                                            │
    │   3. Activates those experts with distance-weighted scores                 │
    │                                                                             │
    └─────────────────────────────────────────────────────────────────────────────┘
```

---

## Code Examples

### Basic Navigation

```typescript
import {
  PiTensor,
  MatrixInference,
  AGLPipeline,
  UnifiedInferenceServer,
  createMockServer
} from './src/kuhul';

// 1. Create tensor from tag coordinates
const mathCalcDerivative = new PiTensor({
  position: [0.9, 0.8, 0.95],  // math, calc, derivative
  orientation: Math.PI / 4,    // relationship angle
  curvature: Math.PI / 8,      // scope boundary
});

// 2. Find related concepts by distance
const mathCalcIntegral = new PiTensor({
  position: [0.9, 0.8, 0.90],  // nearby in semantic space
});

const distance = tensorDistance(mathCalcDerivative, mathCalcIntegral);
// distance ≈ 0.05 — very close! These concepts are related.

// 3. Compose concepts
const fundamentalTheorem = mathCalcDerivative.compose(mathCalcIntegral, 0.5);
// Creates a concept "between" derivative and integral
// This IS the fundamental theorem of calculus!
```

### Matrix Inference

```typescript
const inference = new MatrixInference();

// Register blocks with relationships
inference.register({
  id: 'fetch-data',
  type: 'primitive',
  position: [0, 0, 0],
  orientation: 0,
  scale: [1, 1, 1],
  curvature: 0,
  children: [],
  relations: [
    { type: 'adjacent', target: 'process-data', weight: 0.9 }
  ]
});

inference.register({
  id: 'process-data',
  type: 'primitive',
  position: [1, 0, 0],
  orientation: 0,
  scale: [1, 1, 1],
  curvature: 0,
  children: [],
  relations: [
    { type: 'adjacent', target: 'render-ui', weight: 0.85 },
    { type: 'parallel', target: 'log-analytics', weight: 0.7 }
  ]
});

// Run inference
const results = inference.infer();
// Results:
// [
//   { rule: 'adjacency_to_sequence', target: 'fetch-data; process-data' },
//   { rule: 'adjacency_to_sequence', target: 'process-data; render-ui' },
//   { rule: 'parallel_to_concurrent', target: 'process-data || log-analytics' }
// ]
```

### Full Pipeline

```typescript
const server = createMockServer();
await server.initialize();

// Text request with geometric analysis
const response = await server.infer({
  input: 'Explain integration by parts',
  type: 'text',
  geometric: true
});

console.log(response.data.experts);
// [
//   { id: 'math-calc-integral', score: 0.92 },
//   { id: 'math-calc-derivative', score: 0.78 },
//   { id: 'math-analysis', score: 0.65 }
// ]

console.log(response.data.geometric.tensors);
// Geometric concepts extracted from the query
```

---

## Why This Matters

### 1. Zero Ambiguity

Traditional NLP must guess what you mean. K'UHUL provides exact coordinates.

```
"Python"

NLP: Is this about snakes? Programming? Monty Python?
     Let me check context clues...

K'UHUL: @atomic [lang-python-core]
        Coordinates: (lang=0.95, python=0.98, core=0.90)
        Navigate to position. Done.
```

### 2. Compositional Semantics

Concepts combine geometrically, enabling precise semantic operations.

```
Linear Algebra = compose(Algebra, Geometry, 0.5)

The system doesn't need to "learn" what linear algebra is—
it computes the position from component concepts.
```

### 3. Explainable Routing

You can see exactly why certain experts were activated.

```
Query: @atomic [web-api-rest] { design patterns }

Activated experts (by distance from coordinates):
├── web-api-expert (distance: 0.08, activation: 0.45)
├── infra-http-expert (distance: 0.22, activation: 0.32)
└── lang-js-expert (distance: 0.35, activation: 0.23)

This is not a black box—it's geometry.
```

### 4. No Hallucination

The AI generates from coordinates that exist in defined semantic space. It cannot hallucinate about undefined regions because undefined regions have no experts.

```
@atomic [undefined-nonsense-gibberish]

Router: No experts found within radius.
Result: "I don't have expertise in this area."

(Not: "Let me make something up that sounds plausible...")
```

---

## Summary

| Concept | Traditional View | K'UHUL Reality |
|---------|-----------------|----------------|
| Tags | Syntax sugar / labels | Tensor coordinates |
| Nesting | Visual hierarchy | Geometric containment |
| IDs | Human-readable names | Semantic addresses |
| Content | Primary data | Payload at coordinates |
| Parsing | Text processing | Map navigation |
| Inference | Language understanding | Geometric computation |
| Experts | Classifiers | Regional specialists |
| Routing | Category matching | Distance calculation |

**K'UHUL tags create the map. AI navigates the map. Experts are stationed at locations on the map. Generation happens at coordinates, not from "understanding."**

This is why π-Geometric Calculus is the foundation: **all inference is navigation in π-modulated space.**

---

## See Also

- [`src/kuhul/pi-geometric.ts`](./src/kuhul/pi-geometric.ts) — π-Geometric Calculus implementation
- [`src/kuhul/api-server.ts`](./src/kuhul/api-server.ts) — Unified Inference API Server
- [`KUHUL_ATOMIC_EXPERTS.md`](./KUHUL_ATOMIC_EXPERTS.md) — Expert taxonomy documentation
