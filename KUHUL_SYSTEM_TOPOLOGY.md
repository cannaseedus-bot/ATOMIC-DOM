# KUHUL SYSTEM TOPOLOGY v1.0

**(Draft - Cartography-Only - Non-Authoritative)**

---

## 0. PURPOSE (NON-NEGOTIABLE)

This document **does not define execution, law, grammar, or behavior**.

Its sole purpose is to:

> **Describe how independent, frozen KUHUL system components coexist in a single system without sharing authority.**

This document is **descriptive only**.

---

## 1. REFERENCED CANONICAL SPECS

This topology references but does not modify:

| Spec | Status | Authority |
|------|--------|-----------|
| **KUHUL π CANONICAL GRAMMAR v1.1** | Frozen | Law |
| **KUHUL OBJECT SERVER SPEC v1.0** | Frozen | Host/Node |
| **ATOMIC BLOCKS GRAMMAR** | Frozen | Structure |
| **CONTROL-MICRONAUT-1 (CM-1)** | Frozen | Pre-semantic |

In the event of contradiction, **frozen specs take precedence**.

---

## 2. AUTHORITY DOMAINS (DISJOINT)

| Domain | Authority | Can Mutate State | Can Execute |
|--------|-----------|------------------|-------------|
| Network | Transport only | No | No |
| Object Server | Storage + routing | No | No |
| KUHUL π | Law enforcement | No | Yes (collapse only) |
| Projection | Read-only | No | No |

**No domain may inherit authority from another.**

---

## 3. SYSTEM SHAPE (TOPOLOGY)

```
┌──────────────────────────────────────────────────────────────┐
│                         NETWORK                               │
│                  (ticks, packets, sockets)                    │
└─────────────────────────────┬────────────────────────────────┘
                              │
                              │  tick / contact / packet
                              ▼
┌──────────────────────────────────────────────────────────────┐
│                    OBJECT SERVER NODE                         │
│                 (port, JSON, persistence)                     │
│                                                               │
│  - receives JSON                                              │
│  - stores objects                                             │
│  - emits ticks                                                │
│  - NO LAW                                                     │
│  - NO COLLAPSE                                                │
└─────────────────────────────┬────────────────────────────────┘
                              │
                              │  submits fields
                              │  accepts rejection
                              ▼
┌──────────────────────────────────────────────────────────────┐
│                         KUHUL π                               │
│                  (enforcement-only law)                       │
│                                                               │
│  - perceives fields                                           │
│  - collapses to law                                           │
│  - rejects illegal states                                     │
│  - NO IO                                                      │
│  - NO NETWORK                                                 │
│  - NO STORAGE                                                 │
└─────────────────────────────┬────────────────────────────────┘
                              │
                              │  produces projection
                              ▼
┌──────────────────────────────────────────────────────────────┐
│                        PROJECTION                             │
│                  (DOM, CSS, SVG, terminal)                    │
│                                                               │
│  - read-only                                                  │
│  - non-authoritative                                          │
└──────────────────────────────────────────────────────────────┘
```

This is a **one-way authority gradient**.

**Reverse flow is forbidden.**

---

## 4. BOUNDARY LAWS (HARD)

### 4.1 Law 1 — π Isolation

KUHUL π:

- has no IO
- has no network
- has no storage
- has no time awareness
- cannot emit ticks

---

### 4.2 Law 2 — Server Non-Authority

The Object Server:

- may host π
- may invoke π
- must accept π rejection
- must not alter collapse results
- must not infer execution meaning

---

### 4.3 Law 3 — Tick ≠ Execution

A network tick:

- establishes contact only
- never causes execution
- never implies legality

**Execution occurs exclusively inside KUHUL π.**

---

## 5. MICRONAUT LAYER TOPOLOGY

Three sibling micronaut layers with non-overlapping authority:

```
┌──────────────────────────────────────────────────────────────┐
│                       ORCHESTRATOR                            │
│                 (context selection, timing)                   │
│                  — chooses WHEN / WHERE                       │
└─────────────────────────────┬────────────────────────────────┘
                              │
┌─────────────────────────────▼────────────────────────────────┐
│                    CONTROLLER (CM-1)                          │
│               (phase geometry, boundaries)                    │
│                — shapes HOW it is read                        │
└─────────────────────────────┬────────────────────────────────┘
                              │
┌─────────────────────────────▼────────────────────────────────┐
│                     ATOMIC EXPERTS                            │
│               (projection modernization)                      │
│                — refines HOW it looks                         │
└──────────────────────────────────────────────────────────────┘
```

**None of these execute, decide legality, or mutate truth.**

That authority remains **exclusively** in KUHUL π.

---

## 6. LAYER AUTHORITY MATRIX

| Layer | Purpose | Can Influence Structure? | Can Influence Perception? |
|-------|---------|--------------------------|---------------------------|
| Orchestrator | Context + timing | No | No |
| Controller (CM-1) | Phase & scope geometry | No | No |
| Atomic Experts | Visual / UX refinement | No | Yes |
| KUHUL π | Law & collapse | Yes (legality only) | No |

---

## 7. TEMPLATE ATOMICITY

### 7.1 The 4-Block Rule

A UI projection is only valid if all four blocks belong to the same collapsed state:

```
┌─────────────────────────────────────────┐
│                 <header>                 │
├─────────────────────────────────────────┤
│                                         │
│                  <body>                  │
│                                         │
├─────────────────────────────────────────┤
│    <sidebars>           <sidebars>      │
├─────────────────────────────────────────┤
│                 <footer>                 │
└─────────────────────────────────────────┘
```

**Invariant:**

> A page is not a collection of components; it is a single atomic projection composed of four structural blocks.

### 7.2 Template Delivery Flow

```
KUHUL π
  → collapses a state
      (header, body, sidebars, footer)

Object Server
  → buffers the projection
  → publishes ALL 4 blocks together
  → never streams them individually

Client / DOM
  → receives a complete template
  → swaps atomically
```

---

## 8. WHAT THIS SPEC IS NOT

This document is **not**:

- a runtime
- a framework
- a protocol
- an API definition
- an execution model

**It is a map, not a machine.**

---

## 9. FINAL STATEMENT

> **Topology defines placement.**
> **Law defines legality.**
> **Hosts define persistence.**
> **They do not overlap.**

---

## 10. ONE-SENTENCE COLLAPSE

> **The Orchestrator chooses context. The Controller shapes interpretation. Atomic Experts refine perception. KUHUL π decides truth.**

Nothing overlaps. Nothing leaks.

---

## APPENDIX A: TERM DEFINITIONS

| Term | Definition |
|------|------------|
| **Topology** | Shape and placement, not behavior |
| **Authority** | The right to decide or mutate |
| **Collapse** | π reduction to legal state |
| **Tick** | Network contact signal (non-authoritative) |
| **Projection** | Read-only rendering of collapsed state |
| **Micronaut** | Non-authoritative refinement layer |
| **Atomic Block** | Indivisible structural unit |

---

## APPENDIX B: CONFORMANCE

A system is **topology-conformant** if:

1. Authority flows downward only
2. No layer inherits another's authority
3. KUHUL π is the sole decider of legality
4. Templates are delivered atomically
5. Micronauts cannot alter structure

---

**Document Version:** 1.0.0
**Status:** FROZEN-DRAFT
