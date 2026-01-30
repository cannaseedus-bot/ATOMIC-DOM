# ATOMIC-DOM

<img src="https://github.com/cannaseedus-bot/ATOMIC-DOM/blob/main/atomic-dom.svg" alt="Atomic DOM logo" />

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

## Virtual DOM vs API DOM

**Virtual DOM** is an in-memory representation (plain JavaScript objects) that frameworks diff to compute minimal updates. **API DOM** is the browser’s live DOM tree accessed via `document`, where mutations can trigger layout and paint.

| Aspect | Virtual DOM | API DOM (Real DOM) |
| --- | --- | --- |
| Location | JavaScript memory | Browser memory |
| Update model | Diff + batch | Immediate mutations |
| Cost | Cheap objects | Expensive layout/paint work |
| Purpose | Optimization layer | Actual UI representation |

Atomic DOM proposals aim to bring some of the virtual DOM’s batching benefits closer to the browser’s native DOM APIs.

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
