# Atomic Block Language — Formal Specification

**Document:** `ATOMIC_BLOCK_LANGUAGE_SPEC.md`
**Status:** 🔒 **LOCKED / CANONICAL**
**Authority:** ASX-R Runtime Language
**Scope:** Structural existence and composition
**Audience:** Runtime designers, schema authors, verifiers

---

## 0. Purpose

This document formally defines the **Atomic Block Language (ABL)** as a **first-class runtime language** within ASX-R.

Atomic Blocks define **what exists structurally** in the runtime.

They do **not** define:

* behavior
* execution
* logic
* side effects
* transitions

They define **existence, containment, and composition**.

---

## 1. Definition (Normative)

An **Atomic Block** is the **smallest indivisible unit of structural existence** in ASX-R.

An Atomic Block:

1. Exists as explicit state
2. Has a declared type
3. Has a declared structural role
4. Participates in composition
5. Obeys containment and adjacency rules
6. Has no executable semantics

If a structure cannot be expressed as Atomic Blocks, it **cannot exist** in ASX-R.

---

## 2. Atomicity Principle

Atomic Blocks are **indivisible** at the runtime level.

* Blocks may contain blocks
* Blocks may be composed
* Blocks may be referenced

But a block is never partially valid.

> **A block either exists or it does not.**

---

## 3. Structural Scope

Atomic Blocks define **structure only**.

They may represent (non-exhaustive):

* UI regions
* Worlds
* Scenes
* Entities
* Agents
* Systems
* Containers
* Logical partitions

They do **not** encode behavior.

---

## 4. Block Identity

### 4.1 Explicit Identity

Every Atomic Block MUST have a stable identity.

* Identity is explicit
* Identity is serializable
* Identity participates in hashing and replay

No implicit or derived identity is permitted.

---

### 4.2 Identity Persistence

Block identity persists across:

* projections
* compression
* replay
* epoch transitions

Identity does not imply mutability.

---

## 5. Block Types

Atomic Blocks are typed.

Block types are **closed and declared** by the runtime or schema.

Examples (illustrative, not prescriptive):

* container
* region
* node
* entity
* system
* slot

Undeclared block types are illegal.

---

## 6. Containment Rules

Atomic Blocks may contain other Atomic Blocks.

Containment rules are explicit:

* parent → child
* no implicit containment
* no circular containment

Containment defines **structural hierarchy**, not execution order.

---

## 7. Adjacency and Composition

Blocks may be composed via adjacency.

* Adjacency is explicit
* Ordering is canonical
* Composition is declarative

Adjacency does not imply control flow.

---

## 8. Structural Roles

Each Atomic Block may declare a **role**.

Roles define **structural intent**, such as:

* header
* body
* sidebar
* world
* agent
* system
* memory
* projection root

Roles are semantic labels, not logic.

---

## 9. No Behavioral Semantics

Atomic Blocks:

* do not execute
* do not mutate
* do not transition state
* do not encode logic

Any attempt to attach behavior to a block is illegal at the block language level.

Behavior belongs to **runtime transitions**, not structure.

---

## 10. Relationship to Time

Atomic Blocks are **atemporal**.

* They do not encode time
* They do not encode phase
* They do not encode tick

Time operates **on** blocks, not **within** them.

---

## 11. Relationship to Atomic CSS

Atomic Blocks define **what exists**.

Atomic CSS defines **how existence is projected**.

There is no overlap of authority.

```
Atomic Block  →  Projection Mapping  →  Atomic CSS
```

Atomic CSS may not redefine structure.

---

## 12. Relationship to Projections

Atomic Blocks are **projection-agnostic**.

The same block structure may project to:

* DOM
* CSS
* SVG
* GPU
* Mesh
* Text
* Other surfaces

Projection does not affect block legality.

---

## 13. Validation Rules

A valid Atomic Block structure MUST satisfy:

1. All blocks are typed
2. All identities are explicit
3. Containment is acyclic
4. Adjacency is canonical
5. Roles are declared
6. No behavior is encoded

Failure of any rule invalidates the structure.

---

## 14. Compression Compatibility

Atomic Blocks MUST be compatible with runtime compression.

* Identity survives compression
* Structure survives equivalence mapping
* No semantic loss is permitted

Compression may reduce representation size but not meaning.

---

## 15. Atomic Block Language Is Closed

The Atomic Block Language is **closed**.

* New block types require schema extension
* No ad-hoc structure is permitted
* No implicit nodes are allowed

---

## 16. Authority Boundary

Atomic Blocks define **existence**.

They have authority over:

* structure
* containment
* composition

They have **no authority** over:

* execution
* mutation
* logic
* transitions
* projection behavior

---

## Final Statement (Canonical)

> **Atomic Blocks define what exists.
> Runtime law defines what may change.
> Projection defines how it appears.**

---

### ✅ Atomic Block Language — FORMALLY LOCKED

This specification is **foundational**.
All ASX-R structure builds on it.

---
