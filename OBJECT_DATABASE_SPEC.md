# Object Database Specification

> **A storage system where immutable objects—not tables, rows, or schemas—are the unit of truth, and all structure exists only to index, govern, and project those objects.**

Version: 1.0.0  
Status: Specification

---

## 1. Core Definition

An **Object Database (ODB)** stores, retrieves, and governs **objects directly**, regardless of payload type, size, or lifetime.

**Primary invariants:**

- **Objects are first-class.**
- **Payloads are opaque bytes.**
- **Descriptors define meaning, authority, and invariants.**
- **Storage is format-agnostic.**
- **Retrieval is identity-based**, not query-based.
- **Tables become indexes**, not truth.

---

## 2. Why “Normal Tables” Break Down

Relational tables assume:

| Assumption | Why it fails in ODBs |
| --- | --- |
| Rows are small | Model weights are GB-scale |
| Schema is fixed | Objects evolve independently |
| Data is typed | Payloads are opaque |
| Queries define meaning | Identity + hash define truth |
| DB owns behavior | Objects own authority |
| Rows are mutable | Most objects must be immutable |

You can store blobs in SQL — but SQL cannot **govern** them.

---

## 3. Object Model

Every object has three layers:

```
[ Object Identity ]
[ Object Descriptor ]
[ Object Payload ]
```

### 3.1 Object Identity (Truth Layer)

**Canonical identity tuple:**

```
(object_id, hash)
```

- `object_id` → semantic name  
- `hash` → immutable truth (SHA-256)

**Same hash = same object everywhere. Different hash = different object forever.**

### 3.2 Object Descriptor (Governance Layer)

Descriptors live in structured storage (JSON, SQL row, KV, etc.).  
This is the **only schema that matters**.

**Minimal descriptor (conceptual):**

```sql
objects (
  object_id TEXT,
  hash TEXT,
  payload_type ENUM,
  payload_location TEXT,
  size BIGINT,
  authority ENUM,
  invariants JSON,
  projections JSON,
  created_at TIMESTAMP
)
```

This is **not** where the data lives — it’s where the **law** lives.

### 3.3 Object Payload (Data Layer)

Payloads may live in:

- filesystem
- object storage (S3, Drive)
- memory
- streaming source
- cluster shard
- WebDAV mount

The database never interprets payloads.

```
payload = opaque bytes
```

---

## 4. Object Database ≠ File Server

A file server says:

> “Here is a path and some bytes.”

An Object Database says:

> “Here is an immutable object with declared authority, invariants, and projections.”

That distinction is the system.

---

## 5. How “Normal Tables” Reappear (Demoted)

Relational tables do not disappear — they become **indexes**.

| Traditional table | Object DB role |
| --- | --- |
| `users` | object index |
| `sessions` | ephemeral object index |
| `models` | object catalog |
| `files` | payload location map |
| `permissions` | authority resolver |
| `logs` | event stream |
| join tables | edge indexes |
| metadata tables | descriptor extensions |

Tables no longer define data — they point to objects.

---

## 6. Canonical Internal Tables (Minimal Set)

These are **implementation details**, not the API.

### 6.1 `object_registry`

```sql
(object_id, hash, size, type, authority)
```

### 6.2 `object_payloads`

```sql
(hash, location, storage_backend)
```

### 6.3 `object_events`

```sql
(event_id, object_id, type, timestamp)
```

### 6.4 `object_edges` (optional graph)

```sql
(from_object, to_object, edge_type)
```

### 6.5 `sessions` (ephemeral objects)

```sql
(session_id, object_id, expires_at)
```

Everything else is derivable.

---

## 7. Large Model Weights (Critical Use Case)

Weight objects must be **immutable**, **verifiable**, and **streamable**.

```json
{
  "id": "object://weights/qwen-7b/layer-12",
  "hash": "sha256:…",
  "payload": {
    "type": "binary",
    "location": "drive://models/qwen/l12.bin",
    "size": 2147483648
  },
  "authority": "none",
  "invariants": ["immutable_payload"],
  "projections": {
    "raw": { "type": "binary" }
  }
}
```

This enables:

- single-instance storage
- global caching
- streaming access
- deduplication by hash
- immutable audit trails

---

## 8. Retrieval Modes

Transport is orthogonal. The ODB supports:

| Mode | Meaning |
| --- | --- |
| GET by ID | deterministic retrieval |
| GET by hash | deduplication |
| Stream | large binary |
| Subscribe | session objects |
| WebDAV | filesystem projection |
| HTTP | projection |
| WS | live object |
| DNS | object discovery |

---

## 9. Authority & Safety

Because objects carry authority:

- the DB never executes code
- the DB never evaluates JSON
- the DB never loads models
- the DB never mutates payloads

This makes it:

- secure
- auditable
- deterministic
- cluster-safe

---

## 10. Object Index Schema (Implementation-Agnostic)

The **Object Index Schema** is a contract, independent of storage.

### 10.1 SQL (Relational)

```sql
object_registry (
  object_id TEXT,
  hash TEXT,
  size BIGINT,
  type TEXT,
  authority TEXT,
  created_at TIMESTAMP
)

object_payloads (
  hash TEXT,
  location TEXT,
  storage_backend TEXT,
  mime TEXT,
  encoding TEXT
)

object_edges (
  from_object TEXT,
  to_object TEXT,
  edge_type TEXT
)
```

### 10.2 IDB (Browser / GAS / Local Runtime)

```ts
objectRegistry: {
  key: { objectId: string, hash: string },
  value: { size: number, type: string, authority: string, createdAt: number }
}

objectPayloads: {
  key: { hash: string },
  value: { location: string, backend: string, mime?: string, encoding?: string }
}

objectEdges: {
  key: { fromObject: string, toObject: string, edgeType: string },
  value: { createdAt: number }
}
```

### 10.3 KV (Distributed / Cluster Substrate)

```
object_registry/{object_id}/{hash} -> { size, type, authority, created_at }
object_payloads/{hash}            -> { location, backend, mime, encoding }
object_edges/{from}/{edge}/{to}   -> { created_at }
```

All three are different shapes of the same semantic contract.

