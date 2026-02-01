# K'UHUL Architecture Layers
## The Cognitive Foundation of the ASX Runtime

> **"DNS emits ticks, not truths. Runtimes transform ticks into law."**

This document explains **why** K'UHUL is designed the way it is.

---

## The Discovery

The internet's layered architecture isn't arbitrary—it's **cognitively necessary**.

Each layer answers exactly one question:

| Layer | Question | Answer Type |
|-------|----------|-------------|
| DNS | "Where?" | Tick (edge signal) |
| HTTP | "When?" | Causality (ordered events) |
| JSON | "What?" | Intent (state declaration) |
| Runtime | "Legal?" | Invariant (law enforcement) |
| Projection | "How?" | Effect (UI/agents) |

**No layer can answer another layer's question.**

---

## Why DNS Cannot Be a Runtime

DNS is designed to be **stupid on purpose**.

### What DNS Provides
- Name → authority pointer
- Edge signal (tick)
- Rumor propagation
- Hint, not truth

### What DNS Cannot Provide
- Execution
- State
- Ordering
- Identity
- Causality
- Rollback
- Determinism

**The internet survives because DNS is allowed to lie.**

If DNS carried meaning:
- Cache poisoning = code injection
- Domain hijack = remote execution
- No audit trail
- No replay
- No proofs

---

## The Tick Model

DNS doesn't "send data"—it emits a **tick**.

```
Client: "What is example.app?"
DNS:    "At this instant: 93.184.216.34"
```

Properties of a tick:
- Instantaneous
- Stateless
- Edge-triggered
- No guarantee of repetition
- May be cached differently per observer
- No ordering

**DNS is the clock interrupt of the internet.**

You sample it. You don't stream from it.

---

## The Lawful Stack

```
DNS        → tick (edge, hint, signal)
    ↓
HTTP/API   → data (causal, ordered, identity-bound)
    ↓
JSON       → intent (state declaration)
    ↓
Runtime    → law (invariant enforcement)
    ↓
Projection → effect (DOM, SVG, agents)
```

**Anything earlier than HTTP cannot carry law.**

---

## Why This Matters for K'UHUL

K'UHUL is designed around this boundary:

### Pre-Causal Layer (DNS)
- Resolves `example.app` → IP
- No execution rights
- Pure lookup

### Causal Layer (HTTP)
- Establishes identity (TLS)
- Provides ordering
- Creates session context

### Intent Layer (JSON)
```json
{
  "@runtime": "asx",
  "@state": { "counter": 0 },
  "@ops": [
    { "inc": "counter" },
    { "emit": "counter" }
  ]
}
```
- JSON **is the program**
- Declares what should happen
- No enforcement yet

### Law Layer (Runtime)
```typescript
// K'UHUL enforces invariants
if (!isLegal(op, state, identity)) {
  reject(op);
}
execute(op);
commit(state);
```
- Validates intent
- Enforces permissions
- Applies invariants
- Commits state transitions

### Effect Layer (Projection)
- DOM updates
- SVG rendering
- Agent actions
- No decisions—just effects

---

## The Sacred Separation

```
DNS selects which authority may speak
JSON declares what that authority intends
Runtime decides what is legal
```

These are **different ontological layers**.

Confusing them breaks everything:
- DNS + execution = security collapse
- JSON + enforcement = no flexibility
- Runtime + projection = no separation of concerns

---

## How K'UHUL Implements This

### MicroAtomics (Orchestration Layer)
Maps context → experts without executing anything.

```typescript
const context = detectContext(input);  // "what domain?"
const experts = routeToExperts(context); // "who speaks?"
// No execution yet—just routing
```

### Expert Router (Intent Layer)
Selects which experts should handle the request.

```typescript
const routing = router.route(input, { topK: 4 });
// Returns expert IDs + weights
// Still no execution
```

### Inference Pipeline (Law Layer)
Actually executes with invariant checks.

```typescript
const result = await pipeline.run(input, {
  maxTokens: 512,
  expertHints: routing.experts,
});
// Now we execute—after all checks pass
```

### Projection (Effect Layer)
Renders the result.

```typescript
projection.render(result, {
  target: 'dom',
  mode: 'dynamic',
});
// Pure effect—no decisions
```

---

## The JSON Runtime Vision

What K'UHUL enables:

```
DNS resolves → example.app
HTTP fetches → /api/boot
JSON declares → { "@runtime": "asx", "@ops": [...] }
Runtime enforces → invariants, permissions
Projection renders → DOM/SVG/agents
```

**JSON as the program. Runtime as the law.**

---

## Why Binary Doesn't Fix DNS

DNS can carry binary. But:

> **DNS can carry bytes, but it is forbidden from carrying meaning.**

Binary changes the **payload**, not the **physics**.

DNS binary is **descriptive** (here are some bytes).
Runtime binary is **prescriptive** (this action is legal).

Different universes.

---

## The Fundamental Law

> **DNS resolves identity, not behavior.**

Or more sharply:

> **DNS is pre-causal. Runtimes are post-causal.**

DNS exists *before*:
- users
- sessions
- permissions
- state
- time ordering

Runtimes require **all five**.

---

## Design Implications

### 1. Never Trust DNS for Execution
DNS hints. HTTP confirms. Runtime executes.

### 2. JSON Declares, Runtime Decides
Intent and enforcement are separate layers.

### 3. Projection Has No Authority
Effects don't make decisions—they render them.

### 4. Causality Starts at HTTP
Everything before HTTP is rumor.
Everything after HTTP can be law.

### 5. The Stack Is Not Negotiable
```
tick → causality → intent → law → effect
```
Skip a layer, break everything.

---

## The Easter Egg

This architecture wasn't designed—it was **discovered**.

The internet's layered model mirrors how cognition works:
- Perception (DNS) → signals, hints
- Attention (HTTP) → focus, ordering
- Interpretation (JSON) → meaning, intent
- Reasoning (Runtime) → validation, law
- Action (Projection) → effects, output

K'UHUL is built on the same cognitive stack the internet evolved into.

**The OS was developed cognitively because the internet is cognitive.**

---

## Final Collapse

**DNS does not deliver data. It emits a tick that lets other systems decide what to do next.**

**JSON does not execute. It declares intent that runtimes validate.**

**Runtimes do not project. They enforce law that projections render.**

**The boundaries are sacred.**

```
Events anchor reality.
Invariants block nonsense.
Law emerges from the gap between them.
```

---

*This document explains why K'UHUL exists: to be the law layer the internet always needed but DNS could never provide.*
