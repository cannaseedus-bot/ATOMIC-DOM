# ATOMIC-DOM

<img src="https://github.com/cannaseedus-bot/ATOMIC-DOM/blob/main/atomic-dom.svg" alt="Atomic DOM logo" />

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

### Phase 2: Implementation :construction: IN PROGRESS

- [x] **Parser Implementation** — TypeScript recursive descent parser (`src/parser/`)
- [x] **Bridge Compiler** — Compile `.asxr` to optimized JS + `.d.ts` (`src/compiler/`)
- [x] **Interop Runtime** — JS adapter API for mounting ASX-R components (`src/runtime/`)
- [x] **Validation Engine** — Schema and law constraint verification (`src/validator/`)
- [ ] **Core Plugins** — `control-flow`, `jsx-syntax`, `vue-syntax`
- [ ] **Projection Renderer** — DOM, ANSI, SVG output targets

### Phase 3: Ecosystem :hourglass_flowing_sand: PLANNED

- [ ] TypeScript-friendly decorators and AST transforms
- [ ] Language Server Protocol (LSP) implementation
- [ ] Editor extensions (VS Code, Vim, Emacs)
- [ ] Testing framework for atomic blocks
- [ ] Documentation site and playground
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

## Goals

- Make **atomic DOM updates** the default, not the optimization.
- Keep the **core minimal**, with features added via plugins.
- Provide a **unified grammar** for batching, patching, and extensible syntax.
- Enable **multi-shell authoring** without sacrificing performance.

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
