# ATOMIC-DOM AI Assistant Context

This file provides context for AI assistants working on the ATOMIC-DOM project.

## Project Overview

ATOMIC-DOM is a transactional DOM manipulation framework that provides atomic, batched updates to the browser DOM. It includes:

- **ASXR Language**: A domain-specific language for declarative atomic DOM operations
- **Parser & Compiler**: TypeScript-based recursive descent parser and code generator
- **Runtime**: JavaScript adapter for mounting ASXR components
- **Plugins**: Extensible syntax system (control-flow, JSX, Vue)

## Repository Structure

```
ATOMIC-DOM/
├── src/                    # Core library source
│   ├── lexer/              # Tokenizer
│   ├── parser/             # AST parser
│   ├── compiler/           # Code generator
│   ├── runtime/            # JavaScript runtime
│   ├── validator/          # Schema/law validation
│   ├── projection/         # DOM/ANSI/SVG renderers
│   ├── plugins/            # Built-in plugins
│   ├── testing/            # Test framework
│   ├── lsp/                # Language server
│   ├── typescript/         # TS integration (decorators, transforms)
│   ├── splash/             # Boot screen runtime
│   ├── cli.ts              # CLI entry point
│   └── index.ts            # Main exports
├── docs/                   # Documentation site
├── benchmarks/             # Performance benchmarks
├── editors/                # Editor extensions (VS Code)
├── website/                # atomicdom.com Angular site
├── atomic/                 # Language specifications
└── dist/                   # Compiled output
```

## Key Concepts

### Atomic Blocks
The core abstraction for batched DOM mutations:
```asxr
@atomic [update-ui] {
  @dom .header { prop: text = "Hello"; }
  @dom .content { prop: display = "block"; }
}
```

### State Proposals
Declarative state changes that are validated before committing:
```asxr
@state counter = 0;
@propose { counter: counter + 1 }
```

### Plugins
Syntax extensions loaded at parse time:
```asxr
@use plugin "control-flow" from "asxr-plugins/stdlib";
@if (condition) { ... }
```

## Coding Standards

1. **TypeScript**: All source code uses strict TypeScript with `noImplicitAny` and `strictNullChecks`
2. **ES Modules**: Package uses ESM (`"type": "module"`)
3. **No External Dependencies**: Core library has zero runtime dependencies
4. **Node.js**: Minimum version 20.0.0

## Build & Test

```bash
# Build
npm run build

# Run tests
npm test

# Development watch
npm run dev
```

## Important Files

| File | Purpose |
|------|---------|
| `src/index.ts` | Main entry point, all public exports |
| `src/parser/parser.ts` | Recursive descent parser |
| `src/compiler/codegen.ts` | JavaScript code generator |
| `src/runtime/index.ts` | Runtime API |
| `package.json` | Package configuration |
| `tsconfig.json` | TypeScript configuration |

## Grammar Specifications (Locked)

These files define the language and should not be modified:
- `ASXR_GRAMMAR_EBNF.md` — Core grammar v2.0
- `ASXR_GRAMMAR_EBNF_COMPLETE.md` — Complete grammar v3.0
- `atomic/ATOMIC_BLOCK_LANGUAGE_SPEC.md` — Atomic block specification

## Current Status

**Phase 3: Ecosystem** — The core implementation is complete. Current work focuses on:
- Interactive playground
- Community plugin registry
- Framework adapters

## Version History

| Version | Description |
|---------|-------------|
| v0.1.0 | Initial release with parser, compiler, runtime |
| Legacy v3 | Static HTML runtime (deprecated, see docs) |

## Common Tasks

### Adding a New Export
1. Create the module in `src/`
2. Export from the module's `index.ts`
3. Re-export in `src/index.ts`
4. Add to `package.json` exports if it's a subpath

### Creating a Plugin
1. Define syntax rules in plugin declaration
2. Implement AST transformation handlers
3. Register with conflict resolution if needed

### Running Benchmarks
```bash
# Browser benchmark
open benchmarks/dom-comparison.html

# Node.js benchmark
npx ts-node benchmarks/benchmark.ts
```

## AI Assistant Guidelines

1. **Read before editing**: Always read existing code before making changes
2. **Follow existing patterns**: Match the style of surrounding code
3. **Keep core minimal**: New features should be plugins when possible
4. **Test changes**: Run `npm run build && npm test` after modifications
5. **Update docs**: Keep README.md and docs in sync with code changes
6. **No unused code**: Remove dead code rather than commenting it out

## Contact

Repository: https://github.com/cannaseedus-bot/ATOMIC-DOM
