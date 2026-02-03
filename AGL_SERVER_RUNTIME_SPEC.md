# AGL Server Runtime Specification

> **A JSON-native microserver where manifests are law, not code.**

Version: 1.0.0
Status: Specification (Frozen)

---

## Abstract

The AGL Server Runtime is a deterministic, manifest-driven execution environment where:

- **JSON = substrate** (pure data ops, deterministic state)
- **ASX = executor** (symbolic shell that interprets JSON)
- **π-signature = trust** (cryptographic identity of manifests)

Servers are not programs—they are **manifests** that declare behavior.

---

## Table of Contents

1. [Core Architecture](#1-core-architecture)
2. [server.xjson Manifest](#2-serverxjson-manifest)
3. [Op Registry (Frozen)](#3-op-registry-frozen)
4. [Authority Lanes](#4-authority-lanes)
5. [π-Signature Specification](#5-π-signature-specification)
6. [JSON DNS API](#6-json-dns-api)
7. [Runtime Interpreter](#7-runtime-interpreter)
8. [Service Worker Boot Sequence](#8-service-worker-boot-sequence)
9. [Deterministic Replay](#9-deterministic-replay)
10. [Cloudflare Worker Deployment](#10-cloudflare-worker-deployment)

---

## 1. Core Architecture

### 1.1 Two Runtimes

```json
{
  "@runtime": "json",
  "@state": { "counter": 0 },
  "@ops": [
    { "inc": "counter" },
    { "emit": "counter" }
  ]
}
```

This is a **pure JSON execution letter**:
- Deterministic state
- Deterministic ops
- No external authority
- Replayable

```json
{
  "@runtime": "asx",
  "@ops": ["boot", "exec"]
}
```

This is the **symbolic shell**—the ASX layer that interprets the JSON substrate.

### 1.2 The HTTP Shell

```
@http = {"http"};
@server = http_create_server["DNS", "API", "HTTP"] => {
   @get{"@db.json"};
   @chat{"Hello, World!"};
}

@port = 3000;
@host = 'localhost';
serve_run(@port, @host) => {
   server_running_@ {"http://${host}:${port}/"}
}
```

This is a **manifest-driven server definition**:
- A server with DNS/API/HTTP capabilities
- A GET route that returns `@db.json`
- A CHAT route that returns `"Hello, World!"`

**The server is a manifest, not a program.**

---

## 2. server.xjson Manifest

### 2.1 Formal Schema

```json
{
  "@runtime": "json|asx",
  "@id": "string (server id)",
  "@version": "semver string",
  "@state": {
    "counter": 0
  },
  "@http": {
    "host": "localhost",
    "port": 3000,
    "protocol": "http"
  },
  "@routes": [
    {
      "method": "GET",
      "path": "/db",
      "op": { "emit_file": "@db.json" }
    },
    {
      "method": "GET",
      "path": "/chat",
      "op": { "emit_text": "Hello, World!" }
    }
  ],
  "@ops": [
    { "inc": "counter" },
    { "emit": "counter" }
  ]
}
```

### 2.2 Field Invariants

| Field | Description |
|-------|-------------|
| `@runtime` | Selects interpreter profile (`json` = pure data ops, `asx` = extended) |
| `@state` | JSON object, no functions, no dates, deterministic under replay |
| `@http` | Declarative binding only; no side effects |
| `@routes` | Each route is `{ method, path, op }` |
| `@ops` | Ordered list of ops for deterministic event loop |

---

## 3. Op Registry (Frozen)

Every op is:
- **Single-key object**
- **Pure** (no hidden side effects)
- **Deterministic**
- **Authority-scoped** (json vs asx)
- **Replay-safe**

### 3.1 Op Registry Table

| OP Code | Shape | Description | Authority |
|---------|-------|-------------|-----------|
| **OP_INC** | `{ "inc": "<stateKey>" }` | Increment integer by +1 | json, asx |
| **OP_DEC** | `{ "dec": "<stateKey>" }` | Decrement integer by -1 | json, asx |
| **OP_SET** | `{ "set": { "key": "...", "value": ... } }` | Deterministic assignment | json, asx |
| **OP_EMIT** | `{ "emit": "<stateKey>" }` | Emit event `{key, value}` | json, asx |
| **OP_HTTP_EMIT_TEXT** | `{ "emit_text": "<string>" }` | Emit HTTP text body | asx only |
| **OP_HTTP_EMIT_FILE** | `{ "emit_file": "<@file>" }` | Emit file as HTTP body | asx only |
| **OP_LOG** | `{ "log": "<string>" }` | Append log event | asx only |
| **OP_NOP** | `{ "nop": true }` | No-op (padding) | json, asx |

### 3.2 Registry Invariants

- No op may contain nested ops
- No op may perform I/O except HTTP emit ops (ASX only)
- Unknown ops = illegal (runtime must throw)
- Registry is append-only (never mutate or redefine)

---

## 4. Authority Lanes

### 4.1 Lane Table

| Lane | Allowed Ops | Forbidden Ops |
|------|-------------|---------------|
| **json** | OP_INC, OP_DEC, OP_SET, OP_EMIT, OP_NOP | OP_HTTP_EMIT_TEXT, OP_HTTP_EMIT_FILE, OP_LOG |
| **asx** | All ops | None |

### 4.2 Lane Law

**json lane = pure deterministic substrate**
- No I/O
- No HTTP
- No file access
- No logs
- No side effects outside state + events

**asx lane = extended symbolic executor**
- May emit HTTP bodies
- May log
- May access static files (read-only)

### 4.3 Lane Enforcement

```javascript
if (op not in allowed_ops[lane]) {
    throw "ILLEGAL_OP_AUTHORITY";
}
```

---

## 5. π-Signature Specification

The π-signature is the **cryptographic identity** of a manifest + op registry.

### 5.1 Signature Envelope

```json
{
  "@version": "1.0.0",
  "@serial": 3,
  "@key_id": "pi-key-01",
  "@alg": "PI-SIG-256",
  "@payload": "<base64(canonical server.xjson)>",
  "@ops_table": "<base64(canonical op registry)>",
  "@lanes": "<base64(canonical authority lanes)>",
  "@signature": "<base64(sig)>"
}
```

### 5.2 Verification Algorithm

```
1. Check version & alg
   if @version != "1.0.0" → REJECT
   if @alg != "PI-SIG-256" → REJECT

2. Resolve key
   pub = TRUST_STORE[@key_id] or REJECT

3. Rebuild signed message
   msg = canonical_json({
     @version, @serial, @key_id, @alg,
     @payload, @ops_table, @lanes
   })

4. Verify signature
   ok = verifySig(pub, msg, base64Decode(@signature))
   if (!ok) REJECT

5. Decode payloads
   server = JSON.parse(base64Decode(@payload))
   opsTable = JSON.parse(base64Decode(@ops_table))
   lanes = JSON.parse(base64Decode(@lanes))

6. Check serial monotonicity
   if @serial <= LAST_ACCEPTED_SERIAL[@key_id] → REJECT
```

### 5.3 Canonical JSON Law

1. **Encoding:** UTF-8
2. **Objects:** Keys sorted lexicographically, no duplicates
3. **Arrays:** Preserve order
4. **Scalars:** Shortest decimal form
5. **Whitespace:** None except inside strings

```javascript
function canonical(value) {
  if (value === null) return "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") return String(+value);
  if (typeof value === "string") return JSON.stringify(value);

  if (Array.isArray(value)) {
    return "[" + value.map(canonical).join(",") + "]";
  }

  const keys = Object.keys(value).sort();
  const parts = keys.map(k => JSON.stringify(k) + ":" + canonical(value[k]));
  return "{" + parts.join(",") + "}";
}
```

---

## 6. JSON DNS API

### 6.1 Response Envelope

```json
{
  "v": "json-dns-1",
  "query": {
    "name": "_agl._jsondns.example.com",
    "type": "TXT"
  },
  "answer": [
    {
      "name": "_agl._jsondns.example.com",
      "type": "TXT",
      "ttl": 3600,
      "data": {
        "v": "agl-dns-1",
        "server_id": "nexus-runtime-01",
        "manifest_url": "https://example.com/.well-known/agl/server.pi.json",
        "lane": "asx",
        "key_id": "pi-key-01",
        "hash": "sha256:4f9c...ab2e",
        "meta": {
          "description": "Primary AGL runtime",
          "contact": "ops@example.com",
          "updated": "2026-02-01T12:00:00Z"
        }
      }
    }
  ],
  "authority": [],
  "additional": []
}
```

### 6.2 AGL Record Schema (agl-dns-1)

| Field | Description |
|-------|-------------|
| `v` | MUST be `"agl-dns-1"` |
| `server_id` | Globally unique runtime identifier |
| `manifest_url` | MUST be HTTPS; points to π-signed envelope |
| `lane` | MUST match manifest's authority table |
| `key_id` | MUST match `@key_id` in π-envelope |
| `hash` | Optional SHA-256 of canonical server.xjson |
| `meta` | Optional informational metadata |

### 6.3 Resolution Algorithm

```typescript
async function resolveAglRuntime(hostname: string) {
  // 1. Query JSON DNS API
  const dnsRes = await fetch(
    `/json-dns?name=_agl._jsondns.${hostname}&type=TXT`
  );
  const dnsJson = await dnsRes.json();
  const record = dnsJson.answer[0].data;

  // 2. Validate record
  if (record.v !== "agl-dns-1") throw "INVALID_RECORD";

  // 3. Fetch π-signed manifest
  const envelope = await fetch(record.manifest_url).then(r => r.json());

  // 4. Verify π-signature
  const { server, opsTable, lanes } = await verifyPiEnvelope(envelope);

  // 5. Optional hash check
  if (record.hash) {
    const h = sha256(canonical(server));
    if (h !== record.hash.split(":")[1]) throw "HASH_MISMATCH";
  }

  // 6. Lane consistency
  if (!lanes[record.lane]) throw "LANE_NOT_DEFINED";

  // 7. Return runtime image
  return { server_id: record.server_id, lane: record.lane, manifest: server, opsTable, lanes };
}
```

---

## 7. Runtime Interpreter

### 7.1 Lane-Aware Interpreter

```javascript
const LANE_OPS = {
  json: new Set(["inc", "dec", "set", "emit", "nop"]),
  asx: new Set(["inc", "dec", "set", "emit", "nop", "emit_text", "emit_file", "log"])
};

export function createInterpreter(manifest, lane = "json") {
  const state = structuredClone(manifest["@state"] || {});
  const events = [];
  const allowed = LANE_OPS[lane];

  function emit(type, payload) {
    events.push({ type, payload });
  }

  function applyOp(op) {
    const entries = Object.entries(op);
    if (entries.length !== 1) throw new Error("ILLEGAL_OP_SHAPE");
    const [k, v] = entries[0];

    if (!allowed.has(k)) {
      throw new Error(`ILLEGAL_OP_AUTHORITY lane=${lane} op=${k}`);
    }

    switch (k) {
      case "inc": state[v] = Number(state[v] ?? 0) + 1; break;
      case "dec": state[v] = Number(state[v] ?? 0) - 1; break;
      case "set": state[v.key] = v.value; break;
      case "emit": emit("emit", { key: v, value: state[v] }); break;
      case "emit_text": emit("http:body:text", { text: v }); break;
      case "emit_file": emit("http:body:file", { path: v }); break;
      case "log": emit("log", { message: v }); break;
      case "nop": break;
      default: throw new Error(`UNKNOWN_OP ${k}`);
    }
  }

  function runOps(ops) {
    for (const op of ops) applyOp(op);
  }

  return { state, events, runOps, applyOp };
}
```

---

## 8. Service Worker Boot Sequence

### 8.1 Boot Phases

1. **sw.js install** - Fetch `server.pi.json` (signed envelope)
2. **Verify** - Run π-signature verification; abort on failure
3. **Decrypt** (optional) - If payload is encrypted
4. **Load** - Cache manifest in `caches` or `indexedDB`
5. **Execute** - Route fetch events through lane-aware interpreter

### 8.2 Service Worker Implementation

```javascript
self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const hostname = new URL(self.registration.scope).hostname;
    const runtime = await resolveAglRuntime(hostname);

    const cache = await caches.open("agl-runtime");
    await cache.put(
      "/.agl/runtime.json",
      new Response(JSON.stringify(runtime), {
        headers: { "Content-Type": "application/json" }
      })
    );
  })());
});

self.addEventListener("fetch", event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const cache = await caches.open("agl-runtime");
  const runtimeRes = await cache.match("/.agl/runtime.json");
  const runtime = await runtimeRes.json();

  const url = new URL(request.url);
  const route = runtime.manifest["@routes"].find(
    r => r.method === request.method && r.path === url.pathname
  );

  if (!route) {
    return new Response("Not found", { status: 404 });
  }

  const interpreter = createInterpreter(runtime.manifest, runtime.lane);
  interpreter.runOps([route.op]);

  const textEvt = interpreter.events.reverse().find(e => e.type === "http:body:text");
  const body = textEvt ? textEvt.payload.text : "";

  return new Response(body, {
    status: 200,
    headers: { "Content-Type": "text/plain; charset=utf-8" }
  });
}
```

---

## 9. Deterministic Replay

### 9.1 Transcript Schema

```json
{
  "@type": "agl.replay.v1",
  "@server_id": "string",
  "@manifest_hash": "hex(SHA256(canonical(server.xjson)))",
  "@lane": "json|asx",
  "@started_at": "ISO-8601",
  "@ended_at": "ISO-8601",
  "@ops": [
    {
      "index": 0,
      "op": { "inc": "counter" },
      "state_before_hash": "hex(...)",
      "state_after_hash": "hex(...)",
      "events": [
        { "type": "emit", "payload_hash": "hex(...)" }
      ]
    }
  ],
  "@final_state_hash": "hex(SHA256(canonical(final_state)))"
}
```

### 9.2 Replay Law

Given `server.xjson`, lane, and op list, a compliant runtime must:
1. Re-execute ops in order
2. Recompute all `state_*_hash` and `payload_hash`
3. Match the transcript exactly

If any hash diverges → non-compliant runtime or tampered transcript.

---

## 10. Cloudflare Worker Deployment

### 10.1 Static Worker

```javascript
import manifest from "./server.xjson";

function createInterpreter(manifest) {
  const state = structuredClone(manifest["@state"] || {});
  const events = [];

  function applyOp(op) {
    const [k, v] = Object.entries(op)[0];
    switch (k) {
      case "inc": state[v] = Number(state[v] ?? 0) + 1; break;
      case "emit_text": events.push({ type: "http:body:text", payload: { text: v } }); break;
      default: throw new Error(`Unknown op: ${k}`);
    }
  }

  return { state, events, runOps: ops => ops.forEach(applyOp) };
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const route = manifest["@routes"].find(
      r => r.method === request.method && r.path === url.pathname
    );

    if (!route) return new Response("Not found", { status: 404 });

    const interpreter = createInterpreter(manifest);
    interpreter.runOps([route.op]);

    const textEvt = interpreter.events.reverse().find(e => e.type === "http:body:text");
    return new Response(textEvt?.payload.text || "", {
      headers: { "Content-Type": "text/plain; charset=utf-8" }
    });
  }
};
```

**Deploy:** `server.xjson` + `worker.js` → Cloudflare Workers

---

## 11. Summary

| Component | Purpose |
|-----------|---------|
| **server.xjson** | Manifest declaring state, routes, ops |
| **Op Registry** | Frozen opcode dictionary |
| **Authority Lanes** | Capability boundaries (json vs asx) |
| **π-Signature** | Cryptographic identity + verification |
| **JSON DNS API** | Manifest discovery protocol |
| **Interpreter** | Lane-aware op executor |
| **Service Worker** | Micro-kernel for verified manifests |
| **Replay Transcript** | Deterministic execution proof |

---

## 12. References

- [OBJECT_SERVER_SPEC.md](./OBJECT_SERVER_SPEC.md) — Object Server specification
- [KUHUL_SEMANTIC_MAPPING.md](./KUHUL_SEMANTIC_MAPPING.md) — Semantic mapping guide
- [ATOMIC_FRAMEWORK.md](./ATOMIC_FRAMEWORK.md) — Framework specification

---

*A server is a manifest. Manifests are law. Law is deterministic.*
