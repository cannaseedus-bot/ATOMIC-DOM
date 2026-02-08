# MX2LM SERVER RUNTIME SPEC v1

**(MX2LM-SR-1)**

**Status:** FROZEN-DRAFT v1
**Scope:** Local server loops launched and governed by MX2LM CLI
**Non-Scope:** Policy decisions, privilege escalation, remote orchestration

---

## 1. PURPOSE

The **MX2LM Server Runtime** defines a **bounded, inspectable, restartable local server loop** that:

- is **launched by MX2LM CLI**
- is **governed (enabled/disabled) by KUHUL π collapse**
- is **validated by XCFE legality**
- is **auditable via CM-1**
- runs **out-of-process** (separate terminal / PID)
- serves **localhost-scoped resources only**

---

## 2. CORE INVARIANT (NON-NEGOTIABLE)

> **KUHUL never launches servers.**
> **KUHUL never runs loops.**
> **KUHUL only determines whether a server loop is *allowed to exist*.**

All execution authority resides in **MX2LM CLI**.

---

## 3. RUNTIME TOPOLOGY

```
KUHUL π
  ↓ collapse scalar
KUHUL Class: api.local.server
  ↓ constraint
XCFE Legality Gate
  ↓ verify
MX2LM CLI
  ↓ spawn (new terminal)
server.khl
  ↓ loop
Localhost Server
```

---

## 4. KUHUL CLASS BINDING

### 4.1 Canonical Server Class

```kuhul
⟁kuhul.class⟁ api.local.server {

  Wo domain        = "host"
  Wo execution     = "loop"
  Wo scope         = "localhost"
  Wo authority     = "bounded"
  Wo side_effects  = true

}
```

### 4.2 Class Semantics

| Property | Meaning |
|----------|---------|
| `execution=loop` | Long-lived process |
| `scope=localhost` | Cannot bind public interfaces |
| `authority=bounded` | No process spawning |
| `side_effects=true` | Network bind allowed |

---

## 5. KUHUL π GOVERNANCE MODEL

### 5.1 π Action Example

```kuhul
⟁π.action⟁ server_readiness {

  Wo entropy = 0.2

  Wo π.tokens = [
    { glyph: "@",  weight: 1.0 },   // intent
    { glyph: "@@", weight: 0.4 }    // readiness
  ]

  Sek tick -> collapse
}
```

### 5.2 Collapse → CLI Threshold Mapping

| Collapse Value | CLI Action |
|----------------|------------|
| `< 0.3` | No server |
| `0.3 – 0.6` | Advertise availability |
| `> 0.6` | Launch server |
| `> 0.9` | Restart / heal server |

**Thresholds are CLI policy, not KUHUL logic.**

---

## 6. XCFE LEGALITY RULES

### 6.1 Required Conditions

Server launch is **illegal** if:

- KUHUL collapse < launch threshold
- Class ≠ `api.local.server`
- Port not allowlisted
- Server binary/script not allowlisted
- Attempt to bind non-localhost interface
- Attempt to spawn child processes

### 6.2 Allowed Bindings

| Resource | Allowed |
|----------|---------|
| Network | `127.0.0.1`, `localhost` |
| Methods | GET (default), POST (optional, read-only) |
| Filesystem | read-only |
| Processes | none |

---

## 7. SERVER RUNTIME ARTIFACT

### 7.1 `server.khl` Definition

`server.khl` is a **runtime**, not a launcher.

**It MUST NOT:**

- spawn processes
- open terminals
- re-launch itself
- mutate host state
- make policy decisions

**It MAY:**

- bind a local port
- serve static files
- expose read-only APIs
- emit metrics
- report health

---

## 8. CLI RESPONSIBILITIES

### 8.1 Process Control

MX2LM CLI **must track**:

- PID
- port
- uptime
- restart count
- last KUHUL collapse
- last health status

### 8.2 CLI Commands (Canonical)

```bash
mx2lm server start
mx2lm server stop
mx2lm server restart
mx2lm server status
mx2lm server logs
```

All commands:

- pass through XCFE
- respect KUHUL collapse
- are CM-1 auditable

---

## 9. LAUNCH MECHANISMS (ALLOWED)

### 9.1 Direct Launch (Preferred)

```bash
node server.khl
```

Spawned via:

- new terminal window
- detached process

### 9.2 Script Shim (Allowed)

```bat
@echo off
title MX2LM Server
node server.khl
pause
```

**Scripts must be inert** — no branching, no config, no logic.

---

## 10. CM-1 AUDIT ENVELOPE

Every launch is annotated:

```
[SOH] mx2lm-server.v1
[GS] action=start
[GS] class=api.local.server
[GS] port=4141
[STX]
node server.khl
[ETX]
[EOT]
```

**Guarantee:** Removing CM-1 does not alter execution.

---

## 11. π DECAY ENGINE

### 11.1 Decay Model

```javascript
let piSupport = 1.0;
let crashCount = 0;

function onCrash() {
  crashCount++;
  piSupport *= 0.6;   // decay factor
}

function allowRestart() {
  if (piSupport < 0.4) return "SUPPRESS";
  if (piSupport < 0.7) return "ONCE";
  if (piSupport < 0.9) return "BACKOFF";
  return "IMMEDIATE";
}
```

### 11.2 Restart Policy

| π Support | CLI Action |
|-----------|------------|
| `< 0.4` | do not restart |
| `0.4–0.7` | restart once |
| `> 0.7` | restart with backoff |
| `> 0.9` | immediate heal |

**No loops. No retries without π support. Natural stabilization.**

---

## 12. FAILURE & HEALING MODEL

| Condition | CLI Response |
|-----------|--------------|
| Crash | record + decay signal |
| Repeated crash | suppress relaunch |
| π collapse drops | graceful shutdown |
| Port conflict | deny launch |

No infinite restarts. No self-healing loops without π support.

---

## 13. SECURITY POSTURE

This runtime **cannot become**:

- a daemon
- a remote server
- a worm
- a controller
- a policy engine

Because:

- KUHUL cannot loop
- server cannot spawn
- CLI owns authority
- XCFE blocks escalation

---

## 14. WEBSOCKET STATUS STREAMING

### 14.1 WS Extension

```kuhul
⟁ws⟁ "/ws/status" {
  // server pushes snapshots; clients cannot send messages
  onConnect {
    send snapshot()
  }
}

⟁fn⟁ snapshot {
  return {
    ts: now(),
    uptime: state.uptime,
    requests: state.requests,
    healthy: state.healthy
  }
}
```

### 14.2 Invariants

- WS is **send-only** from server
- localhost only
- no mutation endpoints

---

## 15. CSS MICRONAUT UI BINDING

### 15.1 CSS Variables (Micronaut Targets)

```css
:root {
  --mx2lm-health: 1;      /* 0..1 */
  --mx2lm-uptime: 0;      /* seconds */
  --mx2lm-traffic: 0;     /* normalized */
  --mx2lm-glow: 0;        /* 0..1 */
}
```

### 15.2 UI Panel (No JS Logic)

```css
.mx2lm-panel {
  padding: 12px 16px;
  border-radius: 12px;
  background: color-mix(in oklab, #0b1020, #0f172a 60%);
  box-shadow:
    0 0 calc(20px * var(--mx2lm-glow)) rgba(80,200,255,0.35);
  transition: box-shadow .2s ease, opacity .2s ease;
  opacity: calc(.6 + .4 * var(--mx2lm-health));
}

.mx2lm-indicator {
  height: 6px;
  border-radius: 6px;
  background:
    linear-gradient(90deg,
      #22c55e calc(100% * var(--mx2lm-health)),
      #334155 0);
}
```

---

## 16. COMPATIBILITY TARGETS

| Platform | Status |
|----------|--------|
| Windows | Supported (PowerShell / CMD) |
| macOS | Supported (Terminal) |
| Linux | Supported (shell) |
| WSL | Supported |

---

## 17. VERSIONING

- **MAJOR**: changes execution authority or scope
- **MINOR**: new allowed endpoints or diagnostics
- **PATCH**: clarifications only

Current version: **MX2LM-SR-1.0.0**

---

## 18. FINAL STATEMENT

> **MX2LM Server Runtime is a locally-scoped, KUHUL-governed, CLI-launched loop that serves data without authority, heals without autonomy, and exists only while reality supports it.**

---

## 19. ONE-SENTENCE LAW

> **The server exists only while reality supports it. When reality weakens, the server fades — without commands, without panic.**

---

**Document Version:** 1.0.0
**Status:** FROZEN-DRAFT
