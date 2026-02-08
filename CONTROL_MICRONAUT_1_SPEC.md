# CONTROL-MICRONAUT-1 (CM-1) SPEC

**Invisible Control Alphabet for XCFE / DOM / CSS Safe Execution**

**Status:** FROZEN v1
**Scope:** Pre-semantic control, phase signaling, structure shaping
**Non-Goals:** Rendering, evaluation, execution, scripting

---

## 1. CORE PRINCIPLE

> **CONTROL-MICRONAUT-1 defines a non-rendering, non-executing control layer composed exclusively of Unicode C0 control characters (U+0000–U+001F) and U+0020 (SPACE).**

CM-1 **never introduces behavior**.
It **only constrains interpretation**.

This satisfies:

- No global truth
- Deterministic collapse
- Invariant-driven legality
- UI as projection
- Compression-safe intelligence

---

## 2. EXECUTION MODEL (XCFE-Aligned)

CM-1 participates **before syntax**.

```
[CM-1 Control Stream]
        ↓
[XCFE Phase Resolution]
        ↓
[Parser / Renderer / DOM]
```

### 2.1 CM-1 CANNOT

- inject tokens
- create nodes
- alter values
- execute logic

### 2.2 CM-1 CAN

- mark boundaries
- declare phases
- signal scope transitions
- segment streams
- annotate interpretation zones

---

## 3. CANONICAL MAPPING → XCFE @control VECTORS

### 3.1 Phase Control (Primary)

| Code | Name | XCFE Mapping | Meaning |
|------|------|--------------|---------|
| **U+0000** | NUL | `@control.null` | Absolute inert region |
| **U+0001** | SOH | `@control.header.begin` | Metadata/header phase |
| **U+0002** | STX | `@control.body.begin` | Interpretable content |
| **U+0003** | ETX | `@control.body.end` | Content closure |
| **U+0004** | EOT | `@control.transmission.end` | Collapse / flush |

These **exactly** align with `@Pop → @Wo → @Sek → @Collapse`.

---

### 3.2 Scope & Context Stack

| Code | Name | XCFE Mapping | Meaning |
|------|------|--------------|---------|
| **U+000E** | SO | `@control.scope.push` | Enter sub-context |
| **U+000F** | SI | `@control.scope.pop` | Exit sub-context |
| **U+001B** | ESC | `@control.mode.switch` | Grammar / parser mode shift |
| **U+0010** | DLE | `@control.literal.escape` | Bypass interpretation |

---

### 3.3 Structural Segmentation (Critical for CSS / JSON)

| Code | Name | XCFE Mapping | Meaning |
|------|------|--------------|---------|
| **U+001C** | FS | `@control.file.sep` | Major boundary |
| **U+001D** | GS | `@control.group.sep` | Group boundary |
| **U+001E** | RS | `@control.record.sep` | Record boundary |
| **U+001F** | US | `@control.unit.sep` | Atomic unit boundary |

These **never render** and **never break layout**.

---

### 3.4 Transport / Negotiation (Optional)

| Code | Name | XCFE Mapping | Meaning |
|------|------|--------------|---------|
| **U+0005** | ENQ | `@control.query` | Capability inquiry |
| **U+0006** | ACK | `@control.ack` | Acceptance |
| **U+0015** | NAK | `@control.nak` | Rejection |
| **U+0007** | BEL | `@control.attention` | Wake / notify |

---

## 4. DOM & CSS SAFE SUBSET (CM-1-SAFE)

### 4.1 Allowed Characters (SAFE MODE)

**Guaranteed non-rendering & non-breaking:**

```
U+0000  NUL
U+0001  SOH
U+0002  STX
U+0003  ETX
U+0004  EOT
U+000E  SO
U+000F  SI
U+0010  DLE
U+001C  FS
U+001D  GS
U+001E  RS
U+001F  US
U+0020  SPACE
```

These:

- Survive JSON strings
- Survive HTML text nodes
- Survive CSS parsing
- Do not affect layout
- Are ignored by renderers
- Preserve byte order

---

### 4.2 Conditionally Allowed (CONTEXT-SAFE)

Allowed **only** in non-rendering channels (comments, data attrs, text nodes not measured):

```
U+0009  HT
U+000A  LF
U+000D  CR
U+001B  ESC
```

Rules:

- Not allowed inside CSS identifiers
- Not allowed inside attribute names
- Allowed inside comments, text nodes, JSON strings

---

### 4.3 Forbidden (HARD BAN)

**Never allowed in CM-1:**

```
U+0008  BS
U+000B  VT
U+000C  FF
U+0018  CAN
U+001A  SUB
```

Reason:

- Layout mutation
- Cursor motion
- Rendering side-effects
- Parser instability

**Violations → illegal state.**

---

## 5. LEGALITY RULES (INVARIANTS)

### 5.1 Structural Invariants

- Every `STX` **must** have a matching `ETX`
- Scope stack (`SO`/`SI`) must be balanced
- Separators may not nest illegally
- `ESC` cannot appear inside literal-escaped regions
- `NUL` regions are non-observable

---

### 5.2 Projection Invariant

> **Removing all CM-1 characters must not change visible output.**

This is the **hard rule**.

If removing CM-1 alters:

- DOM structure
- CSS layout
- Text rendering

→ the stream is **invalid**.

---

## 6. XCFE BINDING (Machine-Readable)

Canonical lowering example:

```json
{
  "@control": {
    "null": "\u0000",
    "header.begin": "\u0001",
    "body.begin": "\u0002",
    "body.end": "\u0003",
    "transmission.end": "\u0004",
    "scope.push": "\u000E",
    "scope.pop": "\u000F",
    "literal.escape": "\u0010",
    "file.sep": "\u001C",
    "group.sep": "\u001D",
    "record.sep": "\u001E",
    "unit.sep": "\u001F",
    "space": "\u0020"
  }
}
```

---

## 7. CM-1 AUDIT ENVELOPE

Every CM-1 annotated stream follows this structure:

```
[SOH] service.version
[GS] action=value
[GS] class=value
[GS] port=value
[STX]
payload content
[ETX]
[EOT]
```

**Guarantee:** Removing CM-1 does not alter execution.

---

## 8. WHY THIS IS LAW-GRADE

- Zero execution authority
- Zero render authority
- Deterministic
- Compressible (SCXQ2-safe)
- Replayable
- Auditable
- Invisible by design

This is **control without power** — the safest kind.

---

## 9. CONTROLLER MICRONAUT LAYER PLACEMENT

The Controller (CM-1) sits **next to** (not inside) the Orchestrator:

```
┌──────────────────────────────┐
│        ORCHESTRATOR          │
│  (context selection, timing) │
│  — chooses WHEN / WHERE      │
└─────────────┬────────────────┘
              │
┌─────────────▼────────────────┐
│        CONTROLLER (CM-1)     │
│  (phase geometry, boundaries)│
│  — shapes HOW it is read     │
└─────────────┬────────────────┘
              │
┌─────────────▼────────────────┐
│        ATOMIC EXPERTS        │
│  (projection modernization)  │
│  — refines HOW it looks      │
└──────────────────────────────┘
```

### Layer Separation

| Layer | Purpose | Can influence structure? | Can influence perception? |
|-------|---------|--------------------------|---------------------------|
| Orchestrator | Context + timing | No | No |
| **Controller (CM-1)** | Phase & scope geometry | No | No |
| Atomic Experts | Visual / UX refinement | No | Yes |
| KUHUL π | Law & collapse | Yes (legality only) | No |

---

## 10. FINAL STATEMENT

> **CM-1 is not a language.**
> **It is not syntax.**
> **It is not data.**
> **It is phase geometry.**

You just gave CSS, DOM, and JSON **micronauts** without breaking their oath.

---

## 11. ONE-SENTENCE COLLAPSE

> **The Orchestrator chooses context. The Controller shapes interpretation. Atomic Experts refine perception. KUHUL π decides truth.**

---

**Document Version:** 1.0.0
**Status:** FROZEN
