# ATOMIC-DOM

<img src="https://github.com/cannaseedus-bot/ATOMIC-DOM/blob/main/atomic-dom.svg" alt="Atomic DOM logo" />


---

## Core Concept: Tags as Semantic Coordinates

**K'UHUL tags are NOT syntax sugar.** They are **tensor coordinates** in semantic space—a navigable map for AI inference.

> **Deep Dive:** See [`KUHUL_SEMANTIC_MAPPING.md`](./KUHUL_SEMANTIC_MAPPING.md) for complete visual explanations, code examples, and the full theory behind tensor mapping, encryption mapping, and matrix inference.

```
Traditional markup:  <div class="math">x² + y²</div>     ← Human label
K'UHUL mapping:      @atomic [math-geometry-circle] {}   ← AI coordinate
```

### The Three Mapping Techniques

| Technique | Analogy | Function |
|-----------|---------|----------|
| **Tensor Mapping** | GPS coordinates | Position in multi-dimensional semantic space |
| **Encryption Mapping** | Key-value cipher | Tag = key that unlocks exact meaning |
| **Matrix Inference** | Geometric transforms | Relations between blocks → execution flow |

### How AI Uses the Map

```
┌─────────────────────────────────────────────────────────────┐
│                    SEMANTIC SPACE                           │
│                                                             │
│     @atomic [math-calc-derivative]                          │
│              ↓                                              │
│     Position: (math=0.9, calc=0.8, derivative=0.95)        │
│              ↓                                              │
│     AI NAVIGATES to this coordinate                         │
│              ↓                                              │
│     Activates experts in that region                        │
│              ↓                                              │
│     Generates from EXACT semantic location                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**The AI doesn't "understand" your code—it LOCATES it in semantic space and activates the experts stationed at those coordinates.**

### Geometric Relations → Execution Semantics

| Geometry | Relation | Execution |
|----------|----------|-----------|
| Adjacent blocks | `A ⊣ B` | Sequential: `A; B` |
| Nested blocks | `A ⊃ B` | Scoped: `A { B }` |
| Symmetric blocks | `A ≅ B` | Bidirectional: `A ↔ B` |
| Parallel blocks | `A ∥ B` | Concurrent: `A \|\| B` |

This is why π-Geometric Calculus is the foundation: **all inference is navigation in π-modulated space**.

### DOM Control Hierarchy

The Object Server controls the DOM through Atomic Blocks—**not raw DOM operations**:

```
Object Server (defines behavior via objects)
      ↓ emits
Atomic Blocks (@atomic) — transactional boundary, AI coordinates
      ↓ contains
DOM Blocks (@dom) — individual DOM operations
      ↓ projects to
Browser DOM — actual document.* rendering
```

| Level | Block | Contains | Purpose |
|-------|-------|----------|---------|
| 1 | Object Server | Atomic Blocks | Behavior definition |
| 2 | `@atomic [id]` | DOM Blocks | Transaction + AI coordinate |
| 3 | `@dom type[id]` | Properties | DOM operation |
| 4 | Browser DOM | — | Rendered UI |

> See [`OBJECT_SERVER_SPEC.md`](./OBJECT_SERVER_SPEC.md) Section 16 for complete DOM control documentation.

---

## Micronaut Object Server (SCO/1)

Micronaut is now a **sealed SCO/1 object** orchestrated by a **PowerShell file router**. There is **no JavaScript runtime** and no host-side inference logic. Micronaut only speaks through append-only files and sealed data.

```
micronaut/
├─ micronaut.s7
├─ object.toml
├─ semantics.xjson
├─ brains/
├─ io/
│  ├─ chat.txt
│  ├─ stream.txt
│  └─ snapshot/
├─ trace/
└─ proof/
```

**File protocol**
- `io/chat.txt` is the canonical append-only input log.
- `io/stream.txt` is the canonical append-only semantic emission log.

**Orchestrator**
- `micronaut/micronaut.ps1` exposes a loopback file router and never executes inference logic directly.

See the `micronaut/` directory for the authoritative object layout and orchestrator reference.

---

## Project Status

| Component | Status | Document |
|-----------|--------|----------|
| **Core Language Grammar** | :lock: LOCKED | `ASXR_GRAMMAR_EBNF.md` (v2.0) |
| **Complete Grammar Spec** | :lock: LOCKED | `ASXR_GRAMMAR_EBNF_COMPLETE.md` (v3.0) |
| **Atomic Block Language** | :lock: LOCKED | `atomic/ATOMIC_BLOCK_LANGUAGE_SPEC.md` |
| **Plugin Architecture** | :white_check_mark: Designed | Embedded in grammar specs |
| **Parser (Lexer + AST)** | :white_check_mark: Complete | `src/lexer/`, `src/parser/` |
| **Bridge Compiler** | :white_check_mark: Complete | `src/compiler/`, `src/cli.ts` |
| **Interop Runtime** | :white_check_mark: Complete | `src/runtime/` |
| **Validation Engine** | :white_check_mark: Complete | `src/validator/` |
| **Projection Renderer** | :white_check_mark: Complete | `src/projection/` |
| **Core Plugins** | :white_check_mark: Complete | `src/plugins/` |
| **Testing Framework** | :white_check_mark: Complete | `src/testing/` |
| **Language Server (LSP)** | :white_check_mark: Complete | `src/lsp/` |
| **VS Code Extension** | :white_check_mark: Complete | `editors/vscode/` |
| **TypeScript Integration** | :white_check_mark: Complete | `src/typescript/` |
| **Splash Runtime** | :white_check_mark: Complete | `src/splash/` |
| **Documentation Site** | :white_check_mark: Complete | `docs/index.html` |
| **Performance Benchmarks** | :white_check_mark: Complete | `benchmarks/` |
| **CLI Setup Wizard** | :white_check_mark: Complete | `src/cli/` |
| **Interactive Playground** | :white_check_mark: Complete | `playground/` |
| **K'UHUL MicroAtomics** | :white_check_mark: Complete | `src/kuhul/` |
| **Cluster Runtime** | :white_check_mark: Complete | `cluster/` |
| **Atomic Expert Training** | :white_check_mark: Complete | `training/` |
| **Atomic Framework Spec** | :white_check_mark: Complete | `ATOMIC_FRAMEWORK.md` |
| **Object Server Spec** | :white_check_mark: Complete | `OBJECT_SERVER_SPEC.md` |
| **Object Database Spec** | :white_check_mark: Complete | `OBJECT_DATABASE_SPEC.md` |
| **Architecture Layers** | :white_check_mark: Complete | `ARCHITECTURE_LAYERS.md` |
| **Atomic Blocks Grammar** | :white_check_mark: Complete | `ATOMIC_BLOCKS_GRAMMAR.ebnf` |
| **π-Geometric Calculus** | :white_check_mark: Complete | `src/kuhul/pi-geometric.ts` |
| **Unified Inference API** | :white_check_mark: Complete | `src/kuhul/api-server.ts` |
| **Semantic Mapping Guide** | :white_check_mark: Complete | `KUHUL_SEMANTIC_MAPPING.md` |
| **Bootstrap Runtime** | :white_check_mark: Complete | `src/bootstrap/atomic-bootstrap.js` |
| **AGL Server Runtime** | :white_check_mark: Complete | `AGL_SERVER_RUNTIME_SPEC.md` |
| **MX2LM Agent Foreman** | :white_check_mark: Complete | `tools/mx2lm.py` |
| **MATRIX Binary Packer** | :white_check_mark: Complete | `tools/binary_pack.py` |
| **KUHUL π Grammar** | :lock: FROZEN | `KUHUL_PI_GRAMMAR.md` |

---

## Roadmap

### Phase 1: Specification & Design :white_check_mark: COMPLETE

- [x] Core runtime language EBNF grammar
- [x] Atomic Block Language formal specification
- [x] State transition and proposal system
- [x] Plugin-based syntax extension architecture
- [x] Dual JSON/CBOR serialization with STX/ETX framing
- [x] ANSI/Unicode projection controls
- [x] Microcontroller "Tiny" dialect (<2KB RAM)
- [x] CSS atomic grammar with class generation
- [x] Server call functions and binary triggers
- [x] Control plane grammar (pre-semantic layer)
- [x] Shell inference grammar (bash, dom, sql, python)

### Phase 2: Implementation :white_check_mark: COMPLETE

- [x] **Parser Implementation** — TypeScript recursive descent parser (`src/parser/`)
- [x] **Bridge Compiler** — Compile `.asxr` to optimized JS + `.d.ts` (`src/compiler/`)
- [x] **Interop Runtime** — JS adapter API for mounting ASX-R components (`src/runtime/`)
- [x] **Validation Engine** — Schema and law constraint verification (`src/validator/`)
- [x] **Projection Renderer** — DOM, ANSI, SVG output targets (`src/projection/`)
- [x] **Core Plugins** — `control-flow`, `jsx-syntax`, `vue-syntax` (`src/plugins/`)

### Phase 3: Ecosystem :construction: IN PROGRESS

- [x] **Testing Framework** — Test runner, assertions, snapshots (`src/testing/`)
- [x] **Language Server (LSP)** — Editor integration with diagnostics, completion, hover (`src/lsp/`)
- [x] **VS Code Extension** — Syntax highlighting, snippets, LSP client (`editors/vscode/`)
- [x] **TypeScript Integration** — Decorators, AST transforms, type generators (`src/typescript/`)
- [x] **Splash Runtime** — Boot screen, progress tracking, lifecycle hooks (`src/splash/`)
- [x] **Documentation Site** — Interactive docs with Legacy/Modern version toggle (`docs/`)
- [x] **Performance Benchmarks** — DOM comparison benchmarks (`benchmarks/`)
- [x] **CLI Setup Wizard** — Interactive project setup with projection modes (`src/cli/`)
- [x] **Interactive Playground** — Browser-based ASXR editor with live preview (`playground/`)
- [x] **K'UHUL MicroAtomics** — Orchestration layer with context detection and action words (`src/kuhul/`)
- [x] **GPU Cluster Runtime** — JSON cluster config and Python model builder with 2-4 byte quantization (`cluster/`)
- [x] **Atomic Expert Training Pipeline** — Dataset loading, expert mapping, and LoRA fine-tuning (`training/`)
- [x] **RLHF Data Import** — Personal conversation import from OpenAI, Claude, Mistral, DeepSeek (`training/rlhf_importer.py`)
- [x] **Atomic Framework Spec** — Object-first framework where behavior requires explicit declaration (`ATOMIC_FRAMEWORK.md`)
- [x] **Object Server Spec** — Server behavior defined by objects, not code (`OBJECT_SERVER_SPEC.md`)
- [x] **Architecture Layers** — Cognitive foundation: DNS→HTTP→JSON→Runtime→Projection (`ARCHITECTURE_LAYERS.md`)
- [x] **Atomic Blocks Grammar** — 4 indivisible structural units + Micronauts (`ATOMIC_BLOCKS_GRAMMAR.ebnf`)
- [x] **π-Geometric Calculus** — Tensor algebra with π-modulation, matrix inference engine (`src/kuhul/pi-geometric.ts`)
- [x] **Unified Inference API** — Single entry point for text/glyph/hybrid inference (`src/kuhul/api-server.ts`)
- [x] **KUHUL π Grammar** — Canonical enforcement grammar v1.1, frozen (`KUHUL_PI_GRAMMAR.md`)
- [ ] Community plugin registry

---

## Why Atomic DOM

The DOM is *not* transactional. Multiple changes can trigger multiple style/layout recalculations unless you batch them deliberately. ATOMIC-DOM documents a declarative, transactional approach to DOM updates that:

- **Batches mutations** into atomic blocks (single reflow when possible).
- **Separates intent from execution** so a compiler/runtime can optimize.
- **Supports multiple shells** (JSX, Vue, Svelte, vanilla) that compile to the same atomic operations.

## The Pain: Non-Atomic DOM Updates

```javascript
// Each line can trigger separate layout/reflow work.
div.style.width = '100px';
div.style.height = '200px';
div.classList.add('active');
div.textContent = 'Hello';
```

### Atomic-ish Tools We Already Have

```javascript
// Bundle style changes with cssText.
div.style.cssText = 'width: 100px; height: 200px; color: red;';
```

```javascript
// Batch inserts with a DocumentFragment.
const fragment = document.createDocumentFragment();
for (let i = 0; i < 1000; i += 1) {
  const li = document.createElement('li');
  li.textContent = `Item ${i}`;
  fragment.appendChild(li);
}
list.appendChild(fragment);
```

```javascript
// Batch writes into a single animation frame.
requestAnimationFrame(() => {
  element1.style.transform = 'translateX(100px)';
  element2.style.opacity = '0.5';
  element3.classList.add('active');
});
```

### Why It Isn’t Truly Atomic

- **DOM is a tree**: changes ripple to parents and siblings.
- **CSS is global**: cascading styles can affect unrelated nodes.
- **JavaScript can observe mid-update** via MutationObserver.

## What We Have vs What We Want

Today’s batching tools help, but they are not true transactions:

- **`cssText`** bundles style writes.
- **`DocumentFragment`** batches DOM inserts.
- **`requestAnimationFrame`** groups writes per frame.

What’s missing is a native transactional API that applies all updates atomically:

```javascript
// Hypothetical: not a real browser API today.
const transaction = document.createTransaction();

transaction.start();
div.style.width = '100px';
div.style.height = '200px';
div.appendChild(newChild);
div.classList.add('active');
transaction.commit();
```

Why this is hard:

- DOM updates can affect layout outside the mutated subtree.
- CSS cascade means changes are not isolated.
- Observers can see intermediate states without a transaction boundary.

## Virtual DOM vs API DOM

**Virtual DOM** is an in-memory representation (plain JavaScript objects) that frameworks diff to compute minimal updates. **API DOM** is the browser’s live DOM tree accessed via `document`, where mutations can trigger layout and paint.

| Aspect | Virtual DOM | API DOM (Real DOM) |
| --- | --- | --- |
| Location | JavaScript memory | Browser memory |
| Update model | Diff + batch | Immediate mutations |
| Cost | Cheap objects | Expensive layout/paint work |
| Purpose | Optimization layer | Actual UI representation |

Atomic DOM proposals aim to bring some of the virtual DOM’s batching benefits closer to the browser’s native DOM APIs.

## Why Not Just Use the DOM API Directly?

Direct DOM manipulation works well for small or isolated changes, but it scales poorly for dynamic, data-driven interfaces.

### The Cost of Naive DOM Updates

```javascript
function updateFeed(newPosts) {
  const feed = document.getElementById('feed');
  feed.innerHTML = '';

  newPosts.forEach(post => {
    const div = document.createElement('div');
    div.innerHTML = `
      <h3>${post.title}</h3>
      <p>${post.content}</p>
      <span>Likes: ${post.likes}</span>
    `;
    feed.appendChild(div);
  });
}
```

Why this hurts:

- **Rebuilds everything** even if one item changes.
- **Loses state** (focus, scroll position, media playback).
- **Triggers repeated layout** for every inserted node.

### What Virtual DOM Buys You

- **Diffing**: update only what changed.
- **Batching**: apply changes together instead of per mutation.
- **Declarative flow**: update state, let the renderer compute DOM changes.

### When Direct DOM Still Wins

- Simple static pages.
- Canvas/WebGL rendering.
- Tight animation loops with `requestAnimationFrame`.
- Small, encapsulated widgets or Web Components.

## ASX-R Core Grammar (Minimal)

The core language stays intentionally small: atomic blocks, DOM blocks, and plugin directives.

```ebnf
program          = { block | statement | plugin_directive } ;

block            = atomic_block | dom_block | component_def ;
atomic_block     = "@atomic", [ block_id ], "{", block_body, "}" ;
block_id         = "[", identifier, "]" ;
block_body       = { statement | expression | nested_block } ;
```

### Plugin Directives

Plugins extend syntax and behavior without bloating the core.

```ebnf
plugin_directive = "@use", "plugin", plugin_name,
                   [ "from", string_literal ],
                   [ "with", plugin_config ], ";" ;

plugin_name      = identifier | namespace_path ;
namespace_path   = identifier, { "/", identifier } ;
plugin_config    = "{", [ config_pair, { ",", config_pair } ], "}" ;
config_pair      = identifier, ":", value ;
```

```asxr
@use plugin "control-flow" from "asxr-plugins/stdlib";
@use plugin "jsx-syntax" from "asxr-plugins/web";
```

## Plugin Declarations

Plugins declare the syntax patterns and handlers they add.

```ebnf
plugin_decl      = "@plugin", plugin_name, "{",
                   "version:", string_literal, ",",
                   "syntax:", "[", syntax_rule, { ",", syntax_rule }, "]",
                   "handlers:", "[", handler_ref, { ",", handler_ref }, "]",
                   [ "conflicts:", "[", plugin_name, { ",", plugin_name }, "]" ],
                   "}" ;

syntax_rule      = "{",
                   "pattern:", regex_literal, ",",
                   "ast_node:", identifier, ",",
                   "priority:", integer,
                   "}" ;
```

```asxr
@plugin control-flow {
  version: "1.0.0",
  syntax: [
    { pattern: "@if\\s*\\((.+?)\\)\\s*\\{", ast_node: "IfStatement", priority: 100 },
    { pattern: "@for\\s*\\((.+?)\\)\\s*\\{", ast_node: "ForStatement", priority: 100 }
  ],
  handlers: [#if_transformer, #loop_optimizer]
}
```

## CSS Atomic Grammar & Class Generation

The CSS atomic grammar lives in `ASXR_GRAMMAR_EBNF.md` and now includes advanced directives for SQL inference, datasets, and class generation. The `@classes` directive provides a structured way to declare class categories and generation rules for utility-first workflows.

```ebnf
css_document = { directive } ;
directive    = css_atomic | css_advanced | css_in_js | css_module
             | css_inference | css_dataset | css_query | css_classes ;

css_classes  = "@classes", class_config, "{", class_categories, "}" ;
```

```css
@classes [
  prefix: "ac-",
  separator: "-",
  responsive: true,
  dark_mode: true,
  important: false,
  minify: true,
  sourcemaps: true
] {
  layout {
    display: [block, flex, grid, none];
    position: [static, relative, absolute, fixed, sticky];
  }
  spacing {
    margin: ["": [auto, 0..64, step: 4]];
    padding: ["": [0..64, step: 4]];
  }
}
```

## Runtime-Selectable Projection Modes

ASX-R projection is intentionally non-authoritative: Atomic Blocks define structure, while projection defines appearance. That separation allows a single build to select a projection strategy at runtime without changing structural law.

**Recommended runtime selection**

```text
mode = userSelection || appProfile

if mode === "dynamic"  -> stateful VDOM + diffing
if mode === "static"   -> stateless projection
if mode === "prebuilt" -> compile-time output
```

**Mode mapping**

| Runtime choice | Best for | Notes |
| --- | --- | --- |
| dynamic | Gaming / realtime apps | Highest update frequency |
| static | CMS / docs / dashboards | Recompute projection on change |
| prebuilt | Static sites | No runtime projection cost |

## ECMAScript Integration Strategy

ASX-R can integrate with JavaScript in several ways. The primary concern is balancing
adoption (minimal friction for JS developers) with language innovation and runtime
optimization.

### Option 1: ECMAScript Syntax (JS Superset)

Treat ASX-R as a JS dialect so teams keep their existing toolchains (TypeScript, Babel,
ESLint) while layering atomic DOM semantics into familiar syntax. This maximizes adoption,
but constrains ASX-R to JS grammar and semantics.

### Option 2: Bridge Language (Dedicated ASX-R + JS Interop)

Keep ASX-R as a separate language with a compiler that emits optimized JS and a runtime
adapter for interoperability. This allows maximum language design freedom and runtime
optimizations, but requires new tooling for parsing, linting, and editor support.

### Option 3: Hybrid (TypeScript-Style Superset)

Model ASX-R as a typed superset that compiles to JS, preserving JS ergonomics while
enabling new syntax for atomic control flow and DOM operations. This enables strong
interoperability at the cost of compiler and source-map complexity.

### Option 4: Embedded DSL (Template/JSX)

Embed ASX-R constructs in JS via tagged templates or JSX-like syntax. This keeps
adoption easy and tooling familiar, but limits static analysis and compiler optimization.

### Recommended Path

Start with the bridge strategy to keep ASX-R clean and optimizable, while providing a
first-class JS/TS interop layer. As usage grows, evolve toward a hybrid model by exposing
TypeScript-compatible APIs and exploring JS syntax proposals for atomic batching and
declarative DOM operations.

### Implementation Phases

1. **Bridge compiler**: Compile `.asxr` to optimized JS plus optional `.d.ts` output.
2. **Interop runtime**: Provide a JS adapter API for mounting ASX-R components in
   existing JS/TS apps.
3. **Hybrid evolution**: Add TypeScript-friendly decorators and AST transforms that
   preserve atomic semantics while staying inside mainstream tooling.

## Control Flow as Plugins

Control flow is not baked into the core; it arrives via plugins.

```ebnf
plugin_statement = if_statement | while_statement | for_statement
                 | switch_statement | do_while_statement ;

if_statement     = "@if", "(", condition, ")", then_block,
                   [ else_block ] ;
then_block       = "{", block_body, "}" | atomic_block ;
else_block       = "@else", ( "{", block_body, "}"
                            | atomic_block
                            | if_statement ) ;
```

```asxr
@use plugin "control-flow" from "asxr-plugins/stdlib";

@atomic {
  @if ({{viewMode}} === "grid") {
    @dom frame[content] { prop: display = "grid"; }
  } @else {
    @dom frame[content] { prop: display = "flex"; }
  }
}
```

## Syntax Plugins (JSX/Vue as Examples)

```asxr
@plugin jsx-syntax {
  version: "1.0.0",
  syntax: [
    {
      pattern: "<([A-Z][A-Za-z0-9]*)([^>]*)>([^<]*)</\\1>",
      ast_node: "JSXElement",
      priority: 90
    },
    {
      pattern: "<([A-Z][A-Za-z0-9]*)([^>]*)/>",
      ast_node: "JSXSelfClosingElement",
      priority: 90
    }
  ],
  conflicts: ["vue-syntax"],
  handlers: [#jsx_to_dom, #jsx_props_transform]
}
```

```asxr
@plugin vue-syntax {
  version: "1.0.0",
  syntax: [
    { pattern: "<template>([\\s\\S]*?)</template>", ast_node: "VueTemplate", priority: 90 },
    { pattern: "v-if=\"([^\"]+)\"", ast_node: "VueIfDirective", priority: 100 }
  ],
  conflicts: ["jsx-syntax"],
  handlers: [#vue_to_dom, #vue_directive_handler]
}
```

## Plugin Loading, Resolution, and Conflicts

```ebnf
plugin_section   = "@plugins", "{", plugin_load, { ",", plugin_load }, "}" ;
plugin_load      = plugin_name, [ "as", identifier ], [ "version", version_spec ] ;
version_spec     = string_literal | version_range ;
version_range    = "[", version, ",", version, "]" ;

conflict_resolution = "@resolve", "conflicts", "{",
                      conflict_rule, { ",", conflict_rule },
                      "}" ;
conflict_rule       = conflict_pair, ":", resolution ;
conflict_pair       = "(", plugin_name, ",", plugin_name, ")" ;
resolution          = "prefer", plugin_name
                    | "merge", "{", merge_strategy, "}"
                    | "error" ;
```

```asxr
@plugins {
  "control-flow" as cf version "^1.0.0",
  "jsx-syntax" as jsx version "latest"
}

@resolve conflicts {
  ("jsx-syntax", "vue-syntax"): prefer "jsx-syntax"
}
```

## Transformation Pipeline

Plugins can participate in compilation pipelines and transformations.

```ebnf
transformation   = "@transform", "using", plugin_name, "{",
                   "input:", block_reference, ",",
                   "output:", "[", output_spec, { ",", output_spec }, "]",
                   "}" ;

output_spec      = "{",
                   "language:", ("js" | "wasm" | "dom" | "ir"),
                   "format:", ("esm" | "cjs" | "iife"),
                   [ "optimize:", boolean ],
                   "}" ;
```

```asxr
@compile pipeline {
  @pipe [
    "syntax/control-flow"
    -> "syntax/jsx"
    -> "optimize/atomic-batch"
    -> "target/js-es2022"
    -> "bundle/esm"
  ]
}
```

---

## Legacy v3: Atomic HTML (Static Runtime)

ATOMIC-DOM v3 was a static HTML runtime that enabled reactive behavior without a build step. It's now marked as legacy and superseded by the modern ASXR compiler, but remains useful for simple static sites and quick prototypes.

### Key Features

| Feature | Description |
|---------|-------------|
| **No Build Step** | Works directly in the browser with vanilla HTML |
| **Data Binding** | `data-bind` attribute for reactive DOM updates |
| **SCX/Cipher** | String transformation and encryption utilities |
| **Effects System** | Built-in visual effects (fade, slide, pulse) |
| **File Inference** | Automatic file type detection and routing |

### Basic Usage

```html
<!-- Include the legacy runtime -->
<script src="atomic-v3.js"></script>

<!-- Reactive binding -->
<div data-bind="message">Hello World</div>

<!-- Update via API -->
<script>
  atomicHTML.set('message', 'Updated!');
</script>
```

### Reactive Bindings

```html
<!-- Text binding -->
<span data-bind="user.name"></span>

<!-- Class binding -->
<div data-class="isActive ? 'active' : ''"></div>

<!-- Style binding -->
<div data-style="color: {{theme.primary}}"></div>

<!-- Event binding -->
<button data-on="click: handleClick">Click Me</button>
```

### SCX/Cipher System

```javascript
// String cipher for obfuscation
const encoded = atomicHTML.scx.encode('sensitive-data');
const decoded = atomicHTML.scx.decode(encoded);

// Template interpolation
const result = atomicHTML.scx.template('Hello {{name}}!', { name: 'World' });
```

### Effects API

```javascript
// Built-in effects
atomicHTML.effects.fade('#element', { duration: 300 });
atomicHTML.effects.slide('#element', { direction: 'left' });
atomicHTML.effects.pulse('#element', { count: 3 });
```

### Migration to Modern ATOMIC-DOM

Legacy v3 code can be gradually migrated to modern ASXR:

| Legacy v3 | Modern ASXR |
|-----------|-------------|
| `data-bind="key"` | `@state key = value` |
| `data-on="click: fn"` | `@on click { ... }` |
| `atomicHTML.set(k, v)` | State proposals in atomic blocks |
| Effects API | CSS transitions + `@dom` blocks |

See the [documentation site](docs/index.html) for a side-by-side comparison with version toggle.

---

## Goals

- Make **atomic DOM updates** the default, not the optimization.
- Keep the **core minimal**, with features added via plugins.
- Provide a **unified grammar** for batching, patching, and extensible syntax.
- Enable **multi-shell authoring** without sacrificing performance.

---

## K'UHUL Atomic Expert Architecture

ATOMIC-DOM includes an **Atomic Expert** inference architecture with 118 specialized expert modules.

> **Note**: Atomic Experts are NOT code modules. They are declarative taxonomy entries defined by objects (JSON/TypeScript), not executable JS/TS agents. This distinguishes them from traditional MoE architectures.

```
Input → Context Router → Top-K Expert Selection → Weighted Merge → Output
            │                    │
       detectContext()    ┌──────┴──────┐
                          │ 99 Defined  │
                          │ 19 Reserved │
                          └─────────────┘
```

### Expert Categories

| Category | Experts | Parent MicroAtomic |
|----------|---------|-------------------|
| Mathematics | 10 | MathMicroAtomic |
| Languages | 15 | ProgrammingMicroAtomic |
| Web | 12 | WebMicroAtomic |
| Data/ML | 10 | CodeGenMicroAtomic |
| Infrastructure | 12 | CodeGenMicroAtomic |
| Resume | 8 | ResumeMicroAtomic |
| Algorithms | 8 | ProgrammingMicroAtomic |
| Architecture | 8 | ProgrammingMicroAtomic |
| Documentation | 6 | OutputMicroAtomic |
| **Atomic Framework** | **10** | AtomicMicroAtomic |
| **Reserved** | **19** | Fine-tuning slots |

### Model Specs

- **Architecture**: Atomic Experts with top-4 routing
- **Experts**: 118 total (99 defined + 19 reserved for fine-tuning)
- **Dimensions**: 512 expert / 1024 shared
- **Router**: Context-gated (uses `detectContext()`)

### Reserved Experts (Fine-tuning)

19 expert slots are reserved for personalized fine-tuning:

```typescript
const customExpert = {
  id: 'custom-01',
  name: 'My Company API Expert',
  parent: 'CodeGenMicroAtomic',
  trainingDataPath: './data/my-api-docs/',
  inheritFrom: 'web-api',  // Extend existing expert
};
```

See [`KUHUL_ATOMIC_EXPERTS.md`](./KUHUL_ATOMIC_EXPERTS.md) for complete documentation.

---

## GPU Cluster Runtime

The `cluster/` directory provides infrastructure for deploying Atomic Expert models with low-byte quantization (2-4 bytes per parameter).

### Configuration

```json
{
  "model": {
    "totalExperts": 118,
    "activeExperts": 4,
    "quantization": {
      "precision": "int4",
      "expertPrecision": "int8",
      "routerPrecision": "fp16"
    }
  },
  "cluster": {
    "nodes": [
      { "id": "node-0", "role": "router", "gpu": { "device": "cuda:0" } },
      { "id": "node-1", "role": "expert-host", "experts": ["math-*", "lang-*"] }
    ]
  }
}
```

### Model Builder CLI

```bash
# Generate deployment plan
python cluster/model_builder.py build --config cluster/runtime.json

# Generate quantization kernels
python cluster/model_builder.py quantize --precision int4

# Generate all CUDA kernels
python cluster/model_builder.py kernels --config cluster/runtime.json

# Export to ONNX/safetensors
python cluster/model_builder.py export --format onnx

# Show model info
python cluster/model_builder.py info --config cluster/runtime.json
```

### Quantization Precision

| Format | Bits | Bytes/Element | Use Case |
|--------|------|---------------|----------|
| INT2 | 2 | 0.25 | Ultra-compressed experts |
| INT4 | 4 | 0.5 | Default expert weights |
| INT8 | 8 | 1.0 | High-precision experts |
| FP16 | 16 | 2.0 | Router weights |
| FP32 | 32 | 4.0 | Accumulation buffers |

### GPU Kernel Generation

The model builder generates optimized CUDA kernels:

- **Dequantization**: INT2/INT4/INT8 → FP32 unpacking
- **Expert Forward**: Gated Linear Unit with SiLU activation
- **Top-K Router**: Softmax + sparse expert selection

```cuda
// Generated INT4 dequantization kernel
__global__ void dequant_int4_kernel(
    const uint8_t* input,
    float* output,
    float scale,
    int zero_point,
    int num_elements
);
```

### Memory Footprint

With INT4 quantization:
- **Per Expert**: ~1.5 MB (512×2048×2 projections)
- **108 Experts**: ~162 MB
- **Router**: ~256 KB
- **Total Model**: ~165 MB (vs ~660 MB at FP32)

---

## Atomic Expert Training Pipeline

The `training/` directory provides a complete pipeline for training the K'UHUL Atomic Expert model on coding datasets.

### Training Datasets

| Dataset | Source | Experts | Features |
|---------|--------|---------|----------|
| DeepPlanning | Qwen | algo-*, arch-* | Planning, reasoning |
| SFT Data Code | eth-dl-rewards | lang-* | Supervised fine-tuning |
| A1 Code Apps | mlfoundations | algo-*, lang-python | Competitive programming |
| Agent Tool Use | Mgmgrand420 | infra-*, web-api | Tool use, function calling |
| GPT-5 Codex | Mgmgrand420 | lang-* (5 languages) | Multi-language code |
| DeepThink Code | Mgmgrand420 | algo-*, math-* | Chain-of-thought reasoning |
| Dolphin Coder | Mgmgrand420 | lang-*, web-* | Instruction following |
| Code Feedback | Mgmgrand420 | docs-*, resume-tech | Code review |

### Quick Start

```bash
# Install dependencies
pip install -r training/requirements.txt

# Download datasets
./training/download_datasets.sh

# View expert coverage
python training/expert_mapping.py coverage

# Train model
python training/train.py --config training/datasets.json
```

### Training Configuration

```json
{
  "training": {
    "baseModel": "Qwen/Qwen2.5-0.5B",
    "epochs": 3,
    "batchSize": 4,
    "gradientAccumulationSteps": 8,
    "atomicExperts": {
      "numExperts": 118,
      "numActiveExperts": 4,
      "routerAuxLossCoef": 0.01
    },
    "lora": {
      "enabled": true,
      "rank": 64,
      "alpha": 128
    }
  }
}
```

### Expert Coverage

```
 CATEGORY COVERAGE
   math         ████░░░░░░░░░░░░░░░░  20.0% (2/10)
   languages    ████████████░░░░░░░░  53.3% (8/15)
   web          ████████░░░░░░░░░░░░  33.3% (4/12)
   algorithms   ████████████░░░░░░░░  50.0% (4/8)
   infra        ████░░░░░░░░░░░░░░░░  25.0% (3/12)
   docs         ██████░░░░░░░░░░░░░░  33.3% (2/6)
   reserved     ░░░░░░░░░░░░░░░░░░░░   0.0% (0/19)
```

Reserved experts (19 slots) are available for domain-specific fine-tuning.

### RLHF Data Import

Import your personal AI conversations for training:

```bash
# Import conversations from multiple providers
python training/rlhf_importer.py --provider openai --input ~/exports/openai/
python training/rlhf_importer.py --provider claude --input ~/exports/claude/
python training/rlhf_importer.py --provider mistral --input ~/exports/mistral/

# Train with RLHF data (2x weight)
python training/train.py --config training/datasets.json --rlhf ./rlhf_data
```

| Provider | Export Location | Format |
|----------|-----------------|--------|
| OpenAI/ChatGPT | Settings → Data controls → Export | `conversations.json` |
| Claude | Settings → Export data | `conversations.json` |
| Mistral | Settings → Export | `*.jsonl` |
| DeepSeek | Settings → Export | `*.json` |

See [`training/RLHF_IMPORT_GUIDE.md`](./training/RLHF_IMPORT_GUIDE.md) for detailed instructions.

---

## π-Geometric Calculus Foundation

The `src/kuhul/pi-geometric.ts` module implements the mathematical foundation where **all geometry is π-modulated**.

### Core Axiom

> "All curvature is π-modulated"

Every geometric operation in the system uses π as the fundamental unit:
- **Position**: `P = (x·π, y·π, z·π)`
- **Orientation**: `θ = nπ/k` for integers n, k
- **Curvature**: `κ = π/r` for radius r

### Tensor Algebra

```typescript
import { PiTensor, PI } from './src/kuhul';

const tensor = new PiTensor({
  position: [1, 2, 0],      // Will be π-scaled
  orientation: PI / 4,       // 45° = π/4
  curvature: PI / 10,       // Circle with radius 10
});

// Compose tensors
const combined = tensor1.compose(tensor2, 0.5);

// Transform operations
const rotated = tensor.rotate(4);  // Rotate by π/4
const scaled = tensor.scaleBy(2);  // Scale by factor of 2
```

### Matrix Inference Engine

Geometric relations map to execution semantics:

| Geometry | Relation | Execution |
|----------|----------|-----------|
| Adjacent | `A ⊣ B` | Sequential: `A; B` |
| Contained | `A ⊃ B` | Scoped: `A { B }` |
| Symmetric | `A ≅ B` | Dual: `A ↔ B` |
| Tangent | `A ◯ B` | Dependency: `B ← A` |
| Parallel | `A ∥ B` | Concurrent: `A \|\| B` |

```typescript
import { MatrixInference, AGLPipeline } from './src/kuhul';

const inference = new MatrixInference();

// Register glyphs with geometric relations
inference.register({
  id: 'glyph-A',
  type: 'primitive',
  position: [0, 0, 0],
  orientation: 0,
  relations: [
    { type: 'adjacent', target: 'glyph-B', weight: 0.9 }
  ]
});

// Run inference to get execution semantics
const results = inference.infer();
// → [{ rule: 'adjacency_to_sequence', target: 'glyph-A; glyph-B', ... }]
```

### AGL Pipeline

The AGL (A Glyph Language) pipeline converts visual glyphs to executable programs:

```typescript
import { AGLPipeline } from './src/kuhul';

const pipeline = new AGLPipeline();
const program = pipeline.process([
  { id: 'init', position: [0, 0, 0], relations: [{ type: 'adjacent', target: 'compute' }] },
  { id: 'compute', position: [1, 0, 0], relations: [{ type: 'contained', target: 'output' }] },
  { id: 'output', position: [1, 0.5, 0] }
]);

// program.executionPlan contains ordered steps:
// 1. dependency resolution
// 2. concurrent operations
// 3. scoped execution
// 4. sequential flow
```

---

## Unified Inference API Server

The `src/kuhul/api-server.ts` provides a **single entry point** for all inference operations.

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  UnifiedInferenceServer                      │
├─────────────────────────────────────────────────────────────┤
│  Request Types:                                              │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐                      │
│  │  text   │  │  glyph  │  │ hybrid  │                      │
│  └────┬────┘  └────┬────┘  └────┬────┘                      │
│       │            │            │                            │
│       ▼            ▼            ▼                            │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Expert Router (Top-K)                   │    │
│  │         detectContext() → routingScores              │    │
│  └─────────────────────────────────────────────────────┘    │
│                          │                                   │
│       ┌──────────────────┼──────────────────┐               │
│       ▼                  ▼                  ▼               │
│  ┌─────────┐      ┌─────────────┐     ┌──────────┐         │
│  │ Backend │      │ π-Geometric │     │ Action   │         │
│  │Inference│      │  Analysis   │     │  Words   │         │
│  └─────────┘      └─────────────┘     └──────────┘         │
│                          │                                   │
│                          ▼                                   │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              UnifiedResponse                         │    │
│  │  { text, context, experts, geometric, tokens }       │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### Quick Start

```typescript
import { createMockServer, UnifiedInferenceServer } from './src/kuhul';

// Create server (mock backend for testing)
const server = createMockServer();
await server.initialize();

// Text inference
const response = await server.infer({
  input: 'Explain the quadratic formula',
  type: 'text',
  geometric: true  // Include π-geometric analysis
});

console.log(response.data.text);
console.log(response.data.experts);    // Activated experts
console.log(response.data.geometric);  // Tensor analysis
console.log(response.timing);          // Performance metrics
```

### Request Types

| Type | Input | Use Case |
|------|-------|----------|
| `text` | String prompt | Standard inference |
| `glyph` | `GlyphInput[]` | AGL program execution |
| `hybrid` | String + geometric | Text with tensor analysis |

### HTTP Integration

```typescript
import { handleHTTPRequest, inferenceServer } from './src/kuhul';

// Initialize once
await inferenceServer.initialize();

// Handle requests (Express-compatible)
app.post('/api/v1/infer', async (req, res) => {
  const response = await handleHTTPRequest(inferenceServer, {
    method: req.method,
    path: req.path,
    body: req.body,
  });
  res.status(response.status).json(response.body);
});
```

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/infer` | POST | Run inference (text/glyph/hybrid) |
| `/api/v1/route` | POST | Route-only (no inference) |
| `/api/v1/health` | GET | Server health check |
| `/api/v1/stats` | GET | Server statistics |

### Response Format

```typescript
interface UnifiedResponse {
  id: string;
  success: boolean;
  data: {
    text: string;                    // Generated response
    context: ContextType;            // Detected context
    experts: ExpertInfo[];           // Activated experts
    routing: Record<string, number>; // Expert scores
    actionWords: ActionWordInfo[];   // Extracted action words
    suggestions: ActionWordInfo[];   // Stronger alternatives
    geometric?: GeometricData;       // π-Geometric analysis
    tokens: TokenUsage;              // Token counts
  };
  timing: {
    total: number;
    routing: number;
    inference: number;
    geometric?: number;
  };
}
```

---

## What's Next

The language specification phase is **complete**. All grammars are locked and canonical. The project is now ready for implementation.

### Immediate Priorities

1. **Parser Implementation**
   - Choose parser strategy: recursive descent (interpreter), ANTLR/Yacc (generated), or parser combinators
   - Target LL(1) deterministic parsing as specified in the grammar
   - Support both full and tiny dialect variants

2. **Bridge Compiler MVP**
   - Input: `.asxr` files
   - Output: Optimized JavaScript (ESM/CJS) + TypeScript declarations
   - Initial targets: atomic blocks, state proposals, DOM operations

3. **Core Plugin Bootstrap**
   - `control-flow` plugin: `@if`, `@for`, `@while`, `@switch`
   - `jsx-syntax` plugin: JSX element transformation
   - Plugin conflict resolution system

### Architecture Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **ECMAScript Strategy** | Bridge Language | Maximum optimization freedom while providing JS interop |
| **Control Flow** | Plugin-based | Keeps core minimal; syntax extensions via `@use plugin` |
| **Serialization** | JSON + CBOR | JSON for debugging, CBOR for performance |
| **Projection Mode** | Runtime-selectable | Single build, multiple deployment strategies |

### Contributing

The specification documents are **locked** — contributions should focus on:
- Parser and compiler implementation
- Plugin development
- Tooling (editor support, LSP)
- Documentation and examples
- Test suites and validation

---

## Future Updates & Roadmap

### Planned for v0.2.0

| Feature | Priority | Description |
|---------|----------|-------------|
| **Interactive Playground** | High | Browser-based ASXR editor with live preview |
| **Plugin Registry** | High | Community plugin discovery and installation |
| **WASM Compilation** | Medium | Compile ASXR to WebAssembly for performance-critical apps |
| **Server-Side Rendering** | Medium | Full SSR support with hydration |
| **Dev Tools Extension** | Medium | Browser devtools panel for debugging atomic blocks |

### Proposed for v0.3.0

| Feature | Priority | Description |
|---------|----------|-------------|
| **Hot Module Replacement** | High | HMR support for ASXR files in development |
| **Native Mobile Runtime** | Medium | React Native / Capacitor integration |
| **Visual Block Editor** | Medium | Drag-and-drop editor for atomic blocks |
| **AI-Assisted Generation** | Low | LLM integration for generating ASXR from descriptions |
| **Binary AST Format** | Low | Optimized binary AST for faster parsing |

### Long-Term Vision

- **TC39 Proposal**: Explore standardizing atomic DOM operations in ECMAScript
- **Browser Integration**: Work with browser vendors on native transaction support
- **Cross-Platform**: Extend ASXR beyond web to native desktop and embedded systems
- **Universal Runtime**: Single runtime targeting DOM, Canvas, WebGL, and terminal

### Suggested Community Contributions

1. **Framework Adapters** — Create plugins for popular frameworks (Svelte, Solid, Qwik)
2. **Build Tool Plugins** — Vite, Webpack, Rollup, esbuild integrations
3. **Linting Rules** — ESLint/Biome rules for ASXR best practices
4. **Benchmarks** — Real-world performance comparisons with existing solutions
5. **Tutorials** — Step-by-step guides for common use cases
6. **Translations** — Documentation in other languages
