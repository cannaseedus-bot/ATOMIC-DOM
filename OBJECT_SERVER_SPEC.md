# Object Server Specification

> **A server whose behavior is defined by the objects it serves, not by the code that hosts it.**

Version: 1.0.0
Status: Specification

---

## Abstract

An Object Server is a runtime that interprets governed objects and projects their meaning. It does not decide behavior—it only loads, verifies, and projects objects according to their declared specifications.

**If the server contains logic, it's not an Object Server.**

---

## 1. Core Definition

### 1.1 What an Object Server Is

An Object Server is:

- A **governed interpreter** for structured objects
- A **projection system**, not an execution engine
- A **verification layer** that enforces invariants
- **Host-agnostic** (JS, TS, Rust, Go — implementation doesn't matter)

### 1.2 What an Object Server Is Not

An Object Server is **not**:

- A JavaScript server that happens to use JSON
- A routing framework
- A controller/service architecture
- A config-driven application runner
- An API gateway with business logic

### 1.3 The Fundamental Invariant

```
Objects have authority. Code does not.
```

The server is an interpreter. Objects are the law.

---

## 2. Request Lifecycle

Every request follows this exact sequence:

```
request
  │
  ▼
┌─────────────────────┐
│ 1. Resolve Identity │  ← Map request to object ID
└─────────────────────┘
  │
  ▼
┌─────────────────────┐
│ 2. Load Object      │  ← Fetch object descriptor + payload
└─────────────────────┘
  │
  ▼
┌─────────────────────┐
│ 3. Verify Invariants│  ← Check hash, authority, constraints
└─────────────────────┘
  │
  ▼
┌─────────────────────┐
│ 4. Select Projection│  ← Choose output representation
└─────────────────────┘
  │
  ▼
┌─────────────────────┐
│ 5. Emit Response    │  ← Return projected data
└─────────────────────┘
  │
  ▼
┌─────────────────────┐
│ 6. Emit Events      │  ← Lifecycle signals (optional)
└─────────────────────┘
```

**No step may invent behavior not declared in the object.**

---

## 3. Object Model

### 3.1 Object Structure

Every object consists of two parts:

```
object/
├── descriptor    (object.json, object.xjson)
└── payload       (any format: JSON, binary, media, etc.)
```

The descriptor governs. The payload is governed.

### 3.2 Canonical Descriptor Schema

```json
{
  "$schema": "object://schema/object.v1",

  "id": "object://domain/name",
  "hash": "sha256:...",

  "payload": {
    "type": "json | binary | stream",
    "mime": "application/json",
    "location": "./payload.json",
    "encoding": "utf-8 | raw | base64"
  },

  "authority": "none | read | write | execute",
  "executable": false,

  "identity": {
    "name": "human-readable-name",
    "version": "1.0.0",
    "hash": "sha256:..."
  },

  "projections": {
    "default": { ... },
    "http": { ... },
    "raw": { ... }
  },

  "invariants": [
    "immutable_payload",
    "no_execution",
    "projection_only"
  ],

  "events": {
    "on_load": ["log"],
    "on_project": ["tick", "audit"]
  }
}
```

### 3.3 Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Semantic object identifier |
| `hash` | string | SHA-256 hash of payload (truth) |
| `payload` | object | Payload specification |
| `authority` | enum | Permission level |
| `projections` | object | Available output mappings |

### 3.4 Optional Fields

| Field | Type | Description |
|-------|------|-------------|
| `identity` | object | Human-readable metadata |
| `invariants` | array | Declared constraints |
| `events` | object | Lifecycle event bindings |
| `executable` | boolean | Execution flag (default: false) |

---

## 4. Identity Resolution

### 4.1 Identity Tuple

Objects are identified by structure, not location:

```
(id, hash)
```

- `id` is semantic (`object://domain/name`)
- `hash` is truth (SHA-256 of payload)

### 4.2 Resolution Rules

1. **ID is semantic, not a file path**
   ```
   object://media/intro-video  ✓
   /var/www/objects/video.json ✗
   ```

2. **Hash always wins over version**
   ```
   If hash differs → different object
   Version is advisory only
   ```

3. **Same object = same behavior**
   ```
   No environment-dependent meaning
   No runtime interpretation variance
   ```

### 4.3 Resolution Algorithm

```
resolve(request) → object_id

1. Extract path/name from request
2. Normalize to object:// URI
3. Lookup in object registry
4. Return (id, hash) tuple
```

---

## 5. Loading

### 5.1 Load Sequence

```
load(object_id) → (descriptor, payload)

1. Fetch descriptor by ID
2. Parse descriptor JSON
3. Validate descriptor schema
4. Fetch payload from location
5. Verify payload hash
6. Return (descriptor, payload)
```

### 5.2 Load Failures

| Failure | Response |
|---------|----------|
| Object not found | 404 + `object.not_found` event |
| Invalid descriptor | 500 + `object.invalid` event |
| Hash mismatch | 500 + `object.corrupted` event |
| Payload unavailable | 503 + `object.unavailable` event |

### 5.3 Caching

Object Servers MAY cache:

- Descriptors (keyed by ID)
- Payloads (keyed by hash)
- Projections (keyed by ID + projection name)

Object Servers MUST invalidate cache when hash changes.

---

## 6. Verification

### 6.1 Verification Sequence

```
verify(object) → verified | error

1. Verify payload hash matches descriptor
2. Verify authority level is permitted
3. Verify all declared invariants hold
4. Verify no forbidden patterns present
```

### 6.2 Built-in Invariants

| Invariant | Meaning |
|-----------|---------|
| `immutable_payload` | Payload cannot be modified |
| `no_execution` | Object cannot trigger execution |
| `projection_only` | Only projection operations allowed |
| `no_side_effects` | No external state changes |
| `deterministic` | Same input → same output always |
| `auditable` | All operations must be logged |

### 6.3 Custom Invariants

Objects may declare custom invariants:

```json
{
  "invariants": [
    "max_payload_size:1048576",
    "allowed_projections:http,raw",
    "require_auth:read"
  ]
}
```

The server MUST enforce all declared invariants.

---

## 7. Projection

### 7.1 What a Projection Is

A projection is a **view** of an object, not an action.

```
Projection: object → representation
```

Projections transform object state into output format without mutation.

### 7.2 Projection Rules

Projections **MAY**:

- ✅ Map payload data to output
- ✅ Transform data representation
- ✅ Add headers/metadata
- ✅ Select subset of data
- ✅ Emit events

Projections **MAY NOT**:

- ❌ Mutate payload
- ❌ Mutate object state
- ❌ Execute code
- ❌ Access external resources
- ❌ Branch on time/environment
- ❌ Make network requests

### 7.3 Projection Schema

```json
{
  "projections": {
    "default": {
      "type": "json",
      "emit": {
        "counter": "@payload.counter",
        "timestamp": "@meta.projected_at"
      }
    },

    "http": {
      "type": "http-response",
      "status": 200,
      "headers": {
        "Content-Type": "application/json",
        "Cache-Control": "immutable"
      },
      "body": "@payload"
    },

    "raw": {
      "type": "binary",
      "source": "@payload",
      "encoding": "raw"
    }
  }
}
```

### 7.4 Projection Selection

```
select_projection(object, request) → projection

1. Check request for explicit projection name
2. Check Accept header for type matching
3. Fall back to "default" projection
4. Error if no suitable projection found
```

### 7.5 Projection Execution

```
project(object, projection) → response

1. Resolve all @-references in projection
2. Apply type transformations
3. Build response structure
4. Return immutable response
```

---

## 8. Events

### 8.1 Lifecycle Events

| Event | When | Data |
|-------|------|------|
| `object.resolved` | After ID resolution | `{ id, hash }` |
| `object.loaded` | After load complete | `{ id, hash, size }` |
| `object.verified` | After verification | `{ id, invariants }` |
| `object.projected` | After projection | `{ id, projection, latency }` |
| `object.error` | On any error | `{ id, error, phase }` |

### 8.2 Event Binding

```json
{
  "events": {
    "on_load": ["log", "audit"],
    "on_project": ["tick", "metrics"],
    "on_error": ["alert", "log"]
  }
}
```

### 8.3 Event Handlers

Event handlers are **external** to the object:

- `log` → Write to log system
- `audit` → Write to audit trail
- `tick` → Emit clock signal
- `metrics` → Update metrics system
- `alert` → Trigger alert system

Handlers MUST NOT modify object state.

---

## 9. Authority Levels

### 9.1 Authority Enum

| Level | Meaning |
|-------|---------|
| `none` | Object is inert, projection only |
| `read` | Object can be read by authorized parties |
| `write` | Object state can be modified (requires escalation) |
| `execute` | Object can trigger execution (requires ASX) |

### 9.2 Default Authority

```
Default authority = "none"
```

Objects are inert unless explicitly escalated.

### 9.3 Authority Escalation

Authority escalation requires explicit declaration:

```
object.json    → authority: "none" (default)
object.xjson   → authority: "read" (semantic)
object.asx     → authority: "execute" (capability)
```

The server MUST reject operations exceeding declared authority.

---

## 10. Payload Types

### 10.1 JSON Payload

```json
{
  "payload": {
    "type": "json",
    "mime": "application/json",
    "location": "./state.json",
    "encoding": "utf-8"
  }
}
```

### 10.2 Binary Payload

```json
{
  "payload": {
    "type": "binary",
    "mime": "application/octet-stream",
    "location": "./data.bin",
    "encoding": "raw",
    "size": 1048576
  }
}
```

### 10.3 Media Payload

```json
{
  "payload": {
    "type": "binary",
    "mime": "image/svg+xml",
    "location": "./video.svg",
    "encoding": "raw",
    "semantics": "svg-video-container"
  }
}
```

### 10.4 Stream Payload

```json
{
  "payload": {
    "type": "stream",
    "mime": "application/octet-stream",
    "location": "stream://source/id",
    "encoding": "chunked"
  }
}
```

---

## 11. Error Handling

### 11.1 Error Categories

| Category | HTTP Status | Meaning |
|----------|-------------|---------|
| `resolution_error` | 404 | Object not found |
| `load_error` | 500 | Failed to load object |
| `verification_error` | 422 | Invariant violation |
| `projection_error` | 500 | Projection failed |
| `authority_error` | 403 | Insufficient authority |

### 11.2 Error Response Format

```json
{
  "error": {
    "category": "verification_error",
    "code": "invariant_violation",
    "message": "Invariant 'immutable_payload' violated",
    "object_id": "object://example/counter",
    "phase": "verify"
  }
}
```

### 11.3 Error Invariants

- Errors MUST NOT expose internal server state
- Errors MUST include object ID when available
- Errors MUST include phase where failure occurred
- Errors MUST emit `object.error` event

---

## 12. Reference Implementation

### 12.1 Minimal Core (JavaScript)

```javascript
// object-server/core.js

export async function handleRequest(req) {
  // 1. Resolve identity
  const objectId = resolveObjectId(req);
  emit('object.resolved', { id: objectId });

  // 2. Load object
  const object = await loadObject(objectId);
  emit('object.loaded', { id: objectId, hash: object.hash });

  // 3. Verify invariants
  verifyObject(object);
  emit('object.verified', { id: objectId });

  // 4. Select projection
  const projectionName = selectProjection(object, req);
  const projection = object.projections[projectionName];

  // 5. Project response
  const response = projectObject(object, projection);
  emit('object.projected', { id: objectId, projection: projectionName });

  // 6. Return
  return response;
}
```

### 12.2 Identity Resolver

```javascript
// object-server/resolver.js

export function resolveObjectId(req) {
  const path = req.path || req.url;

  // Normalize to object:// URI
  if (path.startsWith('/objects/')) {
    return `object://${path.slice(9)}`;
  }

  if (path.startsWith('object://')) {
    return path;
  }

  throw new ResolutionError(`Cannot resolve: ${path}`);
}
```

### 12.3 Object Loader

```javascript
// object-server/loader.js

export async function loadObject(objectId) {
  // Fetch descriptor
  const descriptorPath = resolveDescriptorPath(objectId);
  const descriptor = await readJSON(descriptorPath);

  // Validate schema
  validateDescriptor(descriptor);

  // Fetch payload
  const payloadPath = resolvePayloadPath(descriptor.payload.location);
  const payload = await readPayload(payloadPath, descriptor.payload);

  // Verify hash
  const actualHash = computeHash(payload);
  if (actualHash !== descriptor.hash) {
    throw new VerificationError('Hash mismatch');
  }

  return { ...descriptor, payload };
}
```

### 12.4 Verifier

```javascript
// object-server/verifier.js

export function verifyObject(object) {
  for (const invariant of object.invariants || []) {
    if (!checkInvariant(object, invariant)) {
      throw new VerificationError(`Invariant failed: ${invariant}`);
    }
  }
}

function checkInvariant(object, invariant) {
  switch (invariant) {
    case 'immutable_payload':
      return true; // Enforced by design
    case 'no_execution':
      return object.executable !== true;
    case 'projection_only':
      return object.authority === 'none';
    default:
      return checkCustomInvariant(object, invariant);
  }
}
```

### 12.5 Projector

```javascript
// object-server/projector.js

export function projectObject(object, projection) {
  const result = {};

  for (const [key, value] of Object.entries(projection.emit || {})) {
    result[key] = resolveReference(value, object);
  }

  return {
    type: projection.type,
    headers: projection.headers || {},
    body: projection.body ? resolveReference(projection.body, object) : result
  };
}

function resolveReference(ref, object) {
  if (typeof ref !== 'string' || !ref.startsWith('@')) {
    return ref;
  }

  const path = ref.slice(1).split('.');
  let value = object;

  for (const key of path) {
    value = value?.[key];
  }

  return value;
}
```

---

## 13. Compliance

### 13.1 Compliance Levels

| Level | Requirements |
|-------|--------------|
| **Level 1** | Load + Verify + Project (basic) |
| **Level 2** | + Events + Caching |
| **Level 3** | + Custom invariants + Streaming |
| **Full** | + Authority escalation + ASX integration |

### 13.2 Compliance Testing

An Object Server implementation MUST pass:

1. **Identity tests** — Correct resolution behavior
2. **Load tests** — Correct loading and hash verification
3. **Verify tests** — All built-in invariants enforced
4. **Project tests** — Correct projection mapping
5. **Error tests** — Correct error responses
6. **Event tests** — Correct event emission

### 13.3 Non-Compliance

A server is **not compliant** if it:

- Contains business logic
- Makes decisions not declared in objects
- Mutates objects during projection
- Ignores declared invariants
- Invents routes or endpoints

---

## 14. Security Considerations

### 14.1 Hash Verification

All payloads MUST be hash-verified before projection.

### 14.2 Authority Enforcement

Authority levels MUST be enforced at every phase.

### 14.3 Invariant Trust

Invariants declared in objects MUST be trusted and enforced.

### 14.4 Projection Isolation

Projections MUST NOT access:

- File system (except declared payload)
- Network
- Environment variables
- System time (except for metadata)

### 14.5 Event Handler Isolation

Event handlers MUST NOT:

- Modify object state
- Block request processing
- Access object payload directly

---

## 15. Glossary

| Term | Definition |
|------|------------|
| **Object** | Governed unit of meaning (descriptor + payload) |
| **Descriptor** | JSON document governing an object |
| **Payload** | Data content of an object (any format) |
| **Projection** | View of an object, not an action |
| **Invariant** | Constraint that must hold true |
| **Authority** | Permission level of an object |
| **Escalation** | Explicit increase in authority |

---

## 16. References

- [ATOMIC_FRAMEWORK.md](./ATOMIC_FRAMEWORK.md) — Framework specification
- [ARCHITECTURE_LAYERS.md](./ARCHITECTURE_LAYERS.md) — Cognitive foundation
- [KUHUL_ATOMIC_EXPERTS.md](./KUHUL_ATOMIC_EXPERTS.md) — Atomic Expert system

---

## 17. Changelog

### v1.0.0 (2024)

- Initial specification
- Core lifecycle defined
- Projection rules established
- Reference implementation provided

---

*An Object Server interprets. It does not decide.*
