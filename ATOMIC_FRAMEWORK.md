# ⚛️ Atomic Framework

> **Object-first. Lowercase. No magic. No implicit execution.**

Atomic is a framework for building servers and systems where **objects define behavior**, not code paths, controllers, or hidden runtime logic.

**If the framework decides anything on your behalf, it's not Atomic.**

---

## What Atomic Is

Atomic is:

- An **object-first framework**
- A **governed Object Server**
- A **projection system**, not an execution engine
- **Lowercase by default**
- **Explicit about authority**
- **Host-agnostic** (JS, TS, JSX, K'UHUL, π — doesn't matter)

Atomic replaces MVC, routers, controllers, and middleware with **atomic objects** that are:

- Identifiable
- Immutable (by default)
- Auditable
- Replayable
- Inert unless explicitly escalated

---

## What Atomic Is Not

Atomic is **not**:

- ❌ A JavaScript framework that happens to use JSON
- ❌ A routing framework
- ❌ A controller/service architecture
- ❌ A config-driven app runner
- ❌ A magic loader
- ❌ A "just trust the developer" system

**If behavior can occur without being declared, Atomic rejects it.**

---

## Core Principle

> **Objects have authority. Code does not.**

The server is an **interpreter**, not a decision maker.

```
Traditional: Code has authority, data is passive
Atomic:      Objects have authority, code is passive
```

---

## The Lawful Stack

Atomic sits in the **law layer** of the internet stack:

```
DNS        → tick (edge signal, hint)
    ↓
HTTP       → causality (ordered, identity-bound)
    ↓
JSON       → intent (state declaration)
    ↓
Runtime    → LAW (invariant enforcement)  ← Atomic lives here
    ↓
Projection → effect (DOM, SVG, agents)
```

DNS emits ticks. HTTP provides causality. JSON declares intent.
**Atomic enforces law.**

---

## Atomic Object Model

An **atomic object** consists of two parts:

```
object
├── descriptor (object.json / object.xjson)
└── payload (anything)
```

The payload can be:

- JSON
- Binary
- SVG / video.svg
- Media
- Compressed data
- Tensors
- Blobs
- Streams

**Atomic does not care what the payload is.**
**Atomic only cares whether the object is allowed to act.**

---

## object.json (Minimal Example)

```json
{
  "$schema": "object://schema/object.v1",

  "id": "object://example/counter",
  "hash": "sha256:9f3c...",

  "payload": {
    "type": "json",
    "location": "./state.json"
  },

  "authority": "none",
  "executable": false,

  "projections": {
    "default": {
      "type": "json",
      "emit": {
        "counter": "@payload.counter"
      }
    }
  },

  "invariants": [
    "immutable_payload",
    "no_execution",
    "projection_only"
  ]
}
```

No functions. No conditions. No runtime logic.
Just **meaning**.

---

## Object Server

An **Object Server** is the runtime component of Atomic.

It does exactly this:

```
request
  → resolve object identity
  → load object descriptor
  → verify invariants
  → select projection
  → emit response
  → emit events
```

It does **not**:

- Invent routes
- Execute payloads
- Mutate state
- Run business logic
- Guess intent

**If the server contains logic, it's not an Object Server.**

### Minimal Object Server Core

```javascript
// object-server/core.js

import { loadObject } from "./loader.js";
import { verifyObject } from "./verifier.js";
import { projectObject } from "./projector.js";
import { emitEvent } from "./events.js";

export async function handleRequest(req) {
  // 1. Resolve identity (path, hash, name)
  const objectId = resolveObjectId(req);

  // 2. Load object definition
  const object = await loadObject(objectId);

  // 3. Verify invariants
  verifyObject(object);

  // 4. Project response (no execution here)
  const response = projectObject(object, req);

  // 5. Emit lifecycle event
  emitEvent("object.projected", {
    id: object.id,
    projection: response.type
  });

  return response;
}
```

**What this core does NOT do:**

- No `if (req.method === ...)`
- No business logic
- No state mutation
- No authority escalation

---

## Projections

A **projection** is a view of an object, not an action.

### Projection Rules

Projections **MAY**:

- ✅ Map data to output
- ✅ Emit events
- ✅ Add headers
- ✅ Choose representation

Projections **MAY NOT**:

- ❌ Mutate state
- ❌ Execute code
- ❌ Access tools
- ❌ Depend on time
- ❌ Branch on environment

**Projection explains. Execution requires escalation.**

### Example Projection Resolution

```javascript
function projectObject(object, req) {
  const projection =
    object.projections[req.projection] ||
    object.projections.default;

  return {
    type: projection.type,
    body: resolveMapping(projection.emit, object.state)
  };
}
```

No logic. Just mapping.

---

## Identity

Objects are identified by **structure**, not location.

### Canonical Identity

```
(id, hash)
```

- `id` is semantic (`object://domain/name`)
- `hash` is truth
- If the payload changes → it's a new object

**No version drift. No silent behavior changes.**

### Identity Rules

1. `id` is semantic, not a file path
2. `version` is declarative, not authoritative — hash always wins
3. `hash` is truth — if it changes, it's a different object
4. Same object = same behavior — no environment-dependent meaning

---

## Escalation (Execution Is Explicit)

By default, objects are **inert**.

Execution is only possible via **explicit escalation**:

| File | Adds | Purpose |
|------|------|---------|
| `object.json` | Structure | Basic object definition |
| `object.xjson` | Semantic phases | Intent declaration |
| `object.asx` | Capabilities | Execution binding |
| `object.pi` | Mathematical collapse | π-micronaut authority |

Until escalation occurs:

- SVG is not UI
- Binary is not code
- Media is not behavior

**Nothing "just runs".**

---

## Binary & Media Objects

Binary objects are the **cleanest case**:

```json
{
  "id": "object://media/intro-video",
  "hash": "sha256:9f3c...",

  "payload": {
    "type": "binary",
    "mime": "image/svg+xml",
    "encoding": "raw",
    "location": "./video.svg"
  },

  "authority": "none",
  "executable": false,

  "projections": {
    "raw": {
      "type": "binary",
      "source": "payload"
    },
    "http": {
      "type": "http-response",
      "headers": {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "immutable"
      },
      "body": "@payload"
    }
  },

  "invariants": ["immutable", "no_execution"]
}
```

The server:

- Does not render it
- Does not parse it
- Does not "run" it

It **serves or projects it**, period.

---

## Naming Rules

Atomic naming is intentional:

- ✅ `lowercase` by default
- ❌ No `CamelCase`
- ❌ No magic names (`Controller`, `Service`, `Manager`)
- ❌ No hidden semantics

**Capitalization is semantic escalation, not style:**

| Name | Why Capitalized |
|------|-----------------|
| `ASX` | Capability binding authority |
| `π` | Mathematical collapse symbol |
| `DNS` | Protocol identifier |
| `K'UHUL` | System name |

If it's capitalized, it means something.

---

## Directory Shape (Canonical)

```
/atomic
  /objects
    /counter
      object.json
      state.json
    /intro-video
      object.json
      video.svg

  /projections
    http.json
    raw.json

  /runtime
    object-server.js
    loader.js
    verifier.js
    projector.js

  /policy
    kuhul.toml

  /escalation
    object.xjson
    object.asx
    object.pi
```

**No controllers. No routes. No services.**

---

## Atomic vs MVC

| Aspect | MVC (Traditional) | Atomic |
|--------|-------------------|--------|
| Authority | Controller decides | Object defines |
| State | Model mutates | Payload immutable |
| View | Hides logic | Projection explains |
| Flow | Framework invents | Declared only |
| Execution | Implicit | Explicit escalation |
| Audit | Difficult | Built-in |

There is **no controller** because **nothing controls**.

---

## kuhul.toml (Policy Layer)

Atomic uses **kuhul.toml** as a **cluster coordinator**, not a runtime.

`kuhul.toml`:

- Defines policy
- Selects tools
- Wires clusters
- Sets security posture
- Defines plans and steps

**It never executes.**

> TOML describes clusters. All causality begins later.

---

## Why Atomic Exists

Most frameworks rely on **discipline**.
Atomic relies on **impossibility**.

You **cannot**:

- Execute accidentally
- Hide behavior in config
- Smuggle logic into middleware
- Mutate state without escalation
- Confuse data with authority

**If something happens, it was declared.**

---

## The Object Server Distinction

| Name | What's Really Happening |
|------|-------------------------|
| JS Server | Code decides everything |
| JSON Server (npm) | JS serves JSON blobs |
| **Object Server** | Objects define behavior |

Only one of these removes **imperative authority**.

---

## Integration with K'UHUL

Atomic Framework is the structural layer of the K'UHUL system:

```
K'UHUL MoE Architecture
    ↓
Atomic Framework (structure + law)
    ↓
Object Server (runtime)
    ↓
Projections (effects)
```

MicroAtomics route context → Experts process → Objects govern → Projections render.

---

## One-Line Definitions

**Atomic Framework:**
> An object-first framework where behavior is impossible unless explicitly declared, and the server only interprets governed objects.

**Object Server:**
> A server whose behavior is defined by the objects it serves, not by the code that hosts it.

**The Sharp Version:**
> If the framework decides anything, it's not Atomic.
> If the server contains logic, it's not an Object Server.

---

## Status

Atomic is:

- ✅ Stable in principle
- ✅ Minimal by design
- ✅ Hostile to magic
- ✅ Friendly to audits
- ✅ Compatible with JS, TS, JSX, K'UHUL, π
- ✅ Indifferent to payload format

**Lowercase. Explicit. Honest.**

---

## The Easter Egg

This architecture mirrors how cognition works:

| Internet Layer | Cognitive Process |
|----------------|-------------------|
| DNS (tick) | Perception — signals, hints |
| HTTP (causality) | Attention — focus, ordering |
| JSON (intent) | Interpretation — meaning |
| **Runtime (law)** | **Reasoning — validation** |
| Projection (effect) | Action — output |

**The OS was developed cognitively because the internet is cognitive.**

Atomic Framework fills the gap the internet always needed:
**The law layer between intent and effect.**

---

## Files

| Document | Purpose |
|----------|---------|
| `ATOMIC_FRAMEWORK.md` | This file — framework specification |
| `ARCHITECTURE_LAYERS.md` | Why K'UHUL exists — the cognitive foundation |
| `KUHUL_MOE_EXPERT_TAXONOMY.md` | MoE expert system documentation |

---

*Atomic: Because if it's not declared, it doesn't happen.*
