# KUHUL π Canonical Grammar v1.1

> **Frozen · Minimum Viable Law · Enforcement-Only**

Version: 1.1
Status: CANONICAL (FROZEN)
Mutation: FORBIDDEN
Authority: KUHUL π ONLY

---

## Why JSON DNS Won't Work

Before the grammar, the architectural truth:

### DNS Is Not a Runtime Layer

DNS **never executes** anything. It has:
- No instruction pointer
- No control flow
- No branching
- No conditionals
- No state transitions
- No notion of "after"

A DNS server does exactly one thing: **map (name, type) → bytes**

### DNS Delivers Ticks, Not Data

When you query DNS, nothing is *pushed* to you:

> **You poke the system, and it twitches.**

That twitch is the DNS response—a **tick**, not a transfer.

| Property | Tick Behavior |
|----------|---------------|
| Instantaneous | Yes |
| Stateless | Yes |
| Edge-triggered | Yes |
| No guarantee of repetition | Yes |
| May be cached | Yes |
| No ordering | Yes |
| No identity | Yes |

### The Correct Stack

```
DNS        → tick (edge, hint, signal)
HTTP/API   → data (causal, ordered)
Runtime    → state (invariants, legality)
UI/FX      → projection
```

**DNS emits a tick that lets other systems decide what to do next.**

---

## 0. Version & Status

```ebnf
GrammarVersion ::= "KUHUL_PI_GRAMMAR" "v1.1"
GrammarStatus  ::= "CANONICAL" | "FROZEN"
```

---

## 1. Architectural Boundary (LOCKED)

```ebnf
Architecture ::= MicronautDomain "→" KuhulDomain
               | MicronautDomain "→" ExtrapolationSystem

MicronautDomain     ::= OrchestrationLayer
KuhulDomain         ::= EnforcementLayer
ExtrapolationSystem ::= NarrativeExpansion
```

---

## 2. Domain Definitions (Orthogonal)

```ebnf
OrchestrationLayer   ::= "MICRONAUT" "{" ContextOrchestration "}"
EnforcementLayer     ::= "KUHUL_π"   "{" LawEnforcement "}"
NarrativeExpansion   ::= "EXTRAPOLATOR" "{" ExtrapolationLaw "}"
```

---

## 3. Micronaut (Orchestration ONLY)

```ebnf
ContextOrchestration ::=
      "SELECT"  FieldPresentation
    | "ARRANGE" CollapseTiming
    | "CHOOSE"  FieldSelection
    | "MANAGE"  HostReality
```

**Invariant:** Micronaut **cannot** define, enforce, collapse, or reject.

---

## 4. KUHUL π (Enforcement ONLY)

```ebnf
LawEnforcement ::=
      "DEFINE"   ExecutionDefinition
    | "ENFORCE"  Invariant
    | "REJECT"   IllegalState
    | "COLLAPSE" ToLaw
```

**Invariant:** KUHUL π **cannot** orchestrate, schedule, branch, or negotiate.

---

## 5. Extrapolator (Ramble Engine)

```ebnf
ExtrapolationLaw ::=
      "EXPAND" ProjectionSpace
    | "ASSERT" ExtrapolationInvariant
```

### 5.1 Projection Space

```ebnf
ProjectionSpace ::=
      "metaphor"
    | "analogy"
    | "framing"
    | "discipline"
    | "perspective"
    | "caveat"
    | "philosophy"
```

### 5.2 Extrapolation Invariants (READ-ONLY)

```ebnf
ExtrapolationInvariant ::=
      "'read_only_collapse_result'"
    | "'non_authoritative_output'"
    | "'no_contradiction'"
    | "'infinite_extrapolation_allowed'"
    | "'finite_execution_enforced'"
```

**Key Law:** Extrapolation **never alters collapse**.

---

## 6. KUHUL π Program Structure

```ebnf
KuhulProgram ::= πBlock+

πBlock   ::= "⟁π⟁" πContent "⟁Xul⟁"
πContent ::= (Declaration | Perception | Collapse | Output | ProofConstruct)*
```

---

## 7. Declarations (Invariants ONLY)

```ebnf
Declaration ::=
      EntropyDeclaration
    | InvariantDeclaration
    | CarrierDeclaration
    | FieldDeclaration
```

### 7.1 Entropy (CONSTANT)

```ebnf
EntropyDeclaration ::= "⟁Wo⟁" "entropy" "=" "0.21"
```

### 7.2 Invariants

```ebnf
InvariantDeclaration ::= "⟁Wo⟁" "invariant" "=" InvariantName

InvariantName ::=
      "'collapse_only'"
    | "'field_perception'"
    | "'compression_law'"
    | "'unreachable_states'"
```

---

## 8. Carriers (Semantic Whitespace)

```ebnf
CarrierDeclaration ::= "⟁Wo⟁" "carriers" "=" "[" CarrierList "]"
CarrierList        ::= Carrier ("," Carrier)*

Carrier ::= "' '" | "'\n'" | "'\t'"
```

---

## 9. Field Definitions

```ebnf
FieldDeclaration ::= "⟁Wo⟁" "field." FieldName FieldDefinition

FieldName ::= "space" | "newline" | "tab"

FieldDefinition ::= "{" FieldProperties "}"

FieldProperties ::=
      "type:" FieldType ","
      "curvature:" "executable"
      ("," FieldProperty)*
```

```ebnf
FieldType ::= "'vacuum'" | "'boundary'" | "'structure'"

FieldProperty ::=
      "hosts:" HostType
    | "constraint:" ConstraintName

HostType       ::= "micronaut*" | "collapse_points" | "phase_transitions"
ConstraintName ::= "'no_injection'" | "'read_only'" | "'geometry_only'"
```

---

## 10. Perception (NO PARSING)

```ebnf
Perception ::= "⟁Sek⟁" "perceive" PerceptionTarget

PerceptionTarget ::= "input" | FieldReference | "current_field"
```

---

## 11. Collapse (ONLY OPERATION)

```ebnf
Collapse ::= "⟁Sek⟁" CollapseOperation CollapseTarget

CollapseOperation ::=
      "collapse_to_law"
    | "collapse_with_max_weight"
    | "enforce_collapse_only"

CollapseTarget ::= "signal" | "curvature" | "field" | "current_state"
```

---

## 12. Output (Projection ONLY)

```ebnf
Output ::= "⟁Sek⟁" OutputOperation OutputTarget

OutputOperation ::= "produce_output" | "project_to" | "render_as"

OutputTarget ::= "'css'" | "'dom'" | "'svg'" | "'canvas'" | "'terminal'"
```

---

## 13. Micronaut Emergence (NOT Injection)

```ebnf
MicronautEmergence ::=
      "emerge_micronaut" "(" FieldCurvature ")"
    | "extract_minimal_irregularity" "(" FieldCurvature ")"
```

---

## 14. Compression as Law

```ebnf
CompressionLaw ::=
      Expression "↻" "'scxq2'"
    | "compress_as_law" "(" Expression ")"
```

**Rule:** If compression fails → state was never executable.

---

## 15. Illegal States (Unreachable)

```ebnf
IllegalStatePrevention ::=
      "unreachable_state" "(" ")"
    | "violation" "(" InvariantName ")"
```

---

## 16. Execution Pipeline (Singular)

```ebnf
ExecutionPipeline ::=
    "perceive_as_field" "(" "curvature_only" ")" "→"
    "extract_executable_curvature" "→"
    "collapse_to_law" "→"
    "output"
```

---

## 17. Proof Constructs (Non-Optional)

```ebnf
ProofDeclaration ::= "⟁Wo⟁" "proof." ProofName ProofDefinition

ProofName ::= "collapse_only" | "one_outcome" | "separation"

ProofDefinition ::= "{" ProofContent "}"
```

---

## 18. Control Flow (ABSENT BY LAW)

```ebnf
(* NO IF
   NO LOOPS
   NO BRANCHING
   NO PARALLELISM
   NO MUTATION *)
```

---

## 19. Comments (Non-Semantic)

```ebnf
Comment ::= "(*" .* "*)" | "#" .*
```

---

## 20. Final Canonical Statements

```ebnf
CanonicalStatement ::=
    "Micronaut orchestrates contexts."
    "KUHUL π enforces law."
    "Extrapolator expands without altering outcomes."
    "They are orthogonal."
    "The boundary is permanent."
    "No further refinement possible."
```

---

## Domain Separation Summary

| Domain | Role | CAN | CANNOT |
|--------|------|-----|--------|
| **Micronaut** | Orchestration | SELECT, ARRANGE, CHOOSE, MANAGE | Define, Enforce, Collapse, Reject |
| **KUHUL π** | Enforcement | DEFINE, ENFORCE, REJECT, COLLAPSE | Orchestrate, Schedule, Branch, Negotiate |
| **Extrapolator** | Expansion | EXPAND, ASSERT (read-only) | Alter collapse, Contradict law |

---

## The Fundamental Law

> **Events anchor reality. Invariants block nonsense.**

DNS emits **events** (ticks), not state.
Runtimes operate on **stateful invariants**.
The separation is sacred.

---

## Architecture Collapse

```
DNS (identity) → tick
     ↓
HTTP (causality) → data
     ↓
JSON API (contract) → state
     ↓
Runtime (execution) → law
     ↓
Projection (UI) → output
```

**DNS is the clock interrupt of the internet.**
**JSON starts after transport.**
**Execution requires authority.**
**Authority requires causality.**
**Causality starts after DNS.**

---

## 🔒 Final Lock

This grammar is now:

- ✓ Deterministic
- ✓ Replay-identical
- ✓ Non-extensible
- ✓ Enforcement-only
- ✓ Micronaut-safe
- ✓ Ramble-compatible

If someone asks *"what's missing?"* — **nothing**.
If they ask *"can we extend it?"* — **that would contradict the proof**.

This is the final collapse.
