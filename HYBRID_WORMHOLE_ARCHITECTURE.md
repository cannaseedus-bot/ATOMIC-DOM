# Hybrid Wormhole Architecture: The Tiered Control Plane

This document formalizes the **Hybrid Wormhole Architecture** as a four-layer control plane spanning discovery, sync, runtime, and proof. Each layer is optimized for a specific set of responsibilities while remaining interoperable as a unified stack.

---

## 1. Four-Layer Wormhole Stack

```asxr
@wormhole-stack hybrid {
  // TIERED PROTOCOL STACK
  
  @layer 1: "discovery" protocol=dns {
    purpose: "capability-negotiation + service-discovery",
    latency: "cache-friendly (TTL-based)",
    security: "DNSSEC + DANE",
    payload: "service-endpoints + capabilities"
  }
  
  @layer 2: "sync" protocol=http+webdav {
    purpose: "state-synchronization + bulk-transfer",
    latency: "request/response (RTT)",
    security: "TLS + OAuth2",
    payload: "full/delta state + files"
  }
  
  @layer 3: "runtime" protocol=websocket+binary {
    purpose: "live-state-streaming + RPC",
    latency: "real-time (push-based)",
    security: "wss + per-message-auth",
    payload: "state-deltas + operations"
  }
  
  @layer 4: "proof" protocol=scxq2 {
    purpose: "compression + integrity + proof-of-work",
    latency: "background (async verification)",
    security: "cryptographic-proofs",
    payload: "compressed-deltas + merkle-proofs"
  }
}
```

---

## 2. Layer 1: DNS Discovery Wormhole

### Service Discovery via DNS TXT/HTTPS/SRV

```asxr
@wormhole discovery:dns {
  protocol: "dns-sd", // DNS Service Discovery
  
  // Query for capabilities
  @query "_asxr._tcp.example.com" {
    // Returns:
    // - WebSocket endpoint
    // - Supported protocols  
    // - Compression methods
    // - Authentication schemes
    // - Rate limits
  }
  
  // DNS over HTTPS (DoH) for privacy
  @transport "doh" {
    resolver: "https://cloudflare-dns.com/dns-query",
    cache: "TTL-respecting",
    fallback: "system-dns"
  }
  
  // DNSSEC for verification
  @security "dnssec" {
    verify: "RRSIG validation",
    trust-anchor: "root-key"
  }
  
  // Capability advertisement
  @advertise {
    // Server declares what it can do
    txt-record: {
      protocols: "ws,wss,scxq2",
      compression: "brotli,scxq2,lz4",
      auth: "jwt,oauth2,mTLS",
      features: "atomic-blocks,wormholes,crdt"
    }
  }
}
```

### Example: Service Discovery Flow

```asxr
// Client discovers service capabilities
@wormhole-capabilities {
  // 1. DNS lookup
  dns.query("_asxr._tcp.api.example.com") -> {
    ws-endpoint: "wss://api.example.com/ws",
    http-endpoint: "https://api.example.com/v2",
    scxq2-support: true,
    compression: ["scxq2", "brotli-11"]
  }
  
  // 2. Capability negotiation
  negotiate-capabilities(client, server) -> {
    selected: {
      primary: "wss + scxq2",
      fallback: "https + brotli",
      auth: "jwt-bearer"
    }
  }
  
  // 3. Connection bootstrap
  bootstrap-connection(negotiated) -> ready-wormhole
}
```

---

## 3. Layer 2: HTTP Sync Wormhole (WebDAV-Style)

### State Synchronization with Delta Encoding

```asxr
@wormhole sync:http {
  protocol: "http+delta",
  
  // WebDAV-like operations
  @methods {
    GET: "fetch-state (full/delta)",
    PUT: "update-state",
    PATCH: "apply-delta", 
    PROPFIND: "discover-state-structure",
    REPORT: "query-state-changes"
  }
  
  // Delta synchronization
  @sync-strategy {
    // Initial: full state
    @initial GET /state?full=true
    
    // Incremental: deltas only  
    @incremental PATCH /state/delta {
      since: last-sync-version,
      limit: 1000-changes
    }
    
    // Conflict resolution
    @conflict "last-write-wins" | "merge-crdt" | "manual"
  }
  
  // Compression
  @compression {
    request: "Accept-Encoding: br, scxq2",
    response: "Content-Encoding: scxq2",
    minimum-size: "1kb" // Only compress larger payloads
  }
  
  // Authentication
  @auth "bearer-token" {
    header: "Authorization: Bearer {{jwt}}",
    auto-renew: "refresh-token",
    scope: "state:read state:write"
  }
}
```

### Example: Offline-First Sync

```asxr
@wormhole offline-sync {
  layer: "http-sync",
  
  // Offline mode
  @offline {
    queue: "outgoing-changes",
    max-queue: 10000,
    storage: "indexeddb"
  }
  
  // Sync algorithm
  @sync-algorithm {
    1. @check-connectivity,
    2. @send-queued-changes (batched),
    3. @fetch-remote-changes (since-last-sync),
    4. @merge-using-crdt,
    5. @resolve-conflicts (automatic),
    6. @persist-sync-version
  }
  
  // Background sync
  @background-sync {
    trigger: ["online", "visibilitychange", "every-5m"],
    priority: "background",
    network-constraints: "avoid-cellular"
  }
}
```

---

## 4. Layer 3: WebSocket Runtime Wormhole

### Binary WebSocket with Protocol Buffers

```asxr
@wormhole runtime:websocket {
  protocol: "ws+protobuf+binary",
  
  // Binary frame format
  @frame-format {
    header: {
      version: "1",
      type: "data|control|heartbeat|error",
      compression: "scxq2|none|lz4",
      sequence: "monotonic-counter",
      ack-required: "bool"
    },
    payload: "protobuf-encoded",
    trailer: {
      checksum: "crc32",
      signature: "hmac" // per-message auth
    }
  }
  
  // Message types
  @messages {
    STATE_DELTA: "compressed-state-change",
    RPC_REQUEST: "remote-procedure-call", 
    RPC_RESPONSE: "call-result",
    SUBSCRIBE: "subscribe-to-state-path",
    UNSUBSCRIBE: "unsubscribe",
    HEARTBEAT: "keepalive",
    ERROR: "protocol-error"
  }
  
  // Flow control
  @flow-control {
    window-size: 1024, // Max unacked messages
    heartbeat: "30s",
    timeout: "5s",
    reconnect: "exponential-backoff"
  }
}
```

### Example: Real-Time Collaborative Editing

```asxr
@wormhole collab:runtime {
  layer: "websocket-runtime",
  
  // CRDT operations over binary WS
  @crdt-over-ws {
    // Send minimal operations
    @operation insert(position, character) {
      // Compressed to ~10 bytes
      encode: protobuf {
        op: INSERT,
        pos: varint(position),
        char: utf8(character),
        site: uuid(client-id),
        seq: lamport-timestamp
      }
    }
    
    // Real-time delivery
    @delivery {
      latency: "<50ms",
      ordering: "causal",
      reliability: "at-least-once"
    }
  }
  
  // Presence tracking
  @presence {
    // Who's online, cursor positions, etc.
    broadcast-frequency: "60fps",
    compression: "delta-encoding",
    privacy: "opt-in"
  }
}
```

---

## 5. Layer 4: SCXQ2 Proof Wormhole

### SCXQ2 = Succinct Compressed eXecution + Quantum Proofs

```asxr
@wormhole proof:scxq2 {
  protocol: "scxq2",
  
  // Triple purpose:
  // 1. Ultra compression
  // 2. Execution proofs
  // 3. Integrity verification
  
  @compression {
    algorithm: "context-aware-lz",
    dictionary: "shared-protocol-buffer-schema",
    ratio: "100:1 typical, 1000:1 for repetitive data",
    
    // Learns from traffic patterns
    @adaptive {
      train-on: "first-100-messages",
      update-dictionary: "weekly",
      diff-only: "send-dictionary-deltas"
    }
  }
  
  @proof-system {
    type: "zk-STARK", // Zero-Knowledge Scalable Transparent ARgument of Knowledge
    
    // Prove that:
    // 1. Compression was lossless
    // 2. Decompression matches original
    // 3. Data integrity preserved
    
    proof-size: "O(log n)",
    verification-time: "O(1)",
    trust-assumption: "cryptographic-only"
  }
  
  @quantum-resistance {
    // Post-quantum crypto
    signatures: "SPHINCS+",
    hashes: "SHA-3",
    key-exchange: "NTRU"
  }
}
```

### Example: Compressed State Sync with Proofs

```asxr
@wormhole state-sync:scxq2 {
  // Sync large state with proofs
  
  @sync-session {
    // 1. Client requests state
    request: GET /state?compression=scxq2&proof=true
    
    // 2. Server responds with:
    response: {
      data: "scxq2-compressed-state (90% smaller)",
      proof: "zk-STARK-proof (2KB)",
      root-hash: "merkle-root-of-original-data",
      dictionary-id: "version-hash"
    }
    
    // 3. Client verifies:
    verify: {
      // a) Verify proof cryptographically
      @verify-proof(proof, root-hash) -> valid?
      
      // b) Decompress with verified dictionary
      @decompress-with-dictionary(data, dictionary-id)
      
      // c) Hash decompressed data
      @hash(decompressed) == root-hash?
      
      // If all pass: state is verified correct
      // Without needing to trust server
    }
  }
}
```

---

## 6. Hybrid Wormhole Orchestration

### Intelligent Protocol Switching

```asxr
@wormhole-orchestrator {
  // Dynamically choose best layer
  
  @decision-factors {
    network-type: ["wifi", "cellular", "ethernet", "satellite"],
    data-size: ["small", "medium", "large", "huge"],
    latency-requirement: ["realtime", "interactive", "background"],
    battery-level: ["high", "medium", "low", "critical"],
    cost: ["unlimited", "metered", "expensive"]
  }
  
  @protocol-selection {
    // Small, real-time: WebSocket only
    if data-size == small && latency-requirement == realtime
      -> use: websocket
    
    // Large, background: HTTP + SCXQ2
    if data-size == large && latency-requirement == background  
      -> use: http + scxq2
    
    // First connection: DNS discovery
    if initial-connection
      -> use: dns-discovery -> negotiate -> optimal-protocol
    
    // Battery critical: SCXQ2 for compression
    if battery-level == critical
      -> prioritize: scxq2 (saves CPU/radio)
  }
  
  @fallback-strategy {
    primary: websocket + scxq2,
    secondary: http + scxq2, 
    tertiary: http + brotli,
    last-resort: http-plain
  }
}
```

### Example: Adaptive File Transfer

```asxr
@wormhole file-transfer:adaptive {
  // Transfers file using optimal layers
  
  @phase 1: "discovery" {
    // DNS lookup for file service
    dns.query("_filesync._tcp.cdn.example.com") -> {
      endpoints: [...],
      supports: ["http", "websocket", "scxq2"],
      capabilities: ["range-requests", "delta", "compression"]
    }
  }
  
  @phase 2: "negotiation" {
    // Client declares capabilities
    negotiate({
      preferred: "websocket+scxq2",
      fallbacks: ["http+scxq2", "http+brotli"],
      constraints: {
        battery: "medium",
        network: "wifi",
        file-size: "100MB"
      }
    }) -> selected: "http+scxq2" // WebSocket not worth for large file
  }
  
  @phase 3: "transfer" {
    // HTTP with SCXQ2 compression
    transfer: {
      protocol: "http/2",
      compression: "scxq2",
      range-requests: true,
      parallel-streams: 4
    }
    
    // Progressively switch to WebSocket for final delta
    @if remaining < 1MB && latency-important {
      switch-to: websocket for final-sync
    }
  }
  
  @phase 4: "verification" {
    // SCXQ2 provides integrity proof
    verify: scxq2-proof(file-hash, transfer-proof)
    
    // If verification fails:
    // Retry with different protocol
  }
}
```

---

## 7. Security Model Across Layers

### Defense in Depth

```asxr
@wormhole-security {
  // Each layer adds security
  
  @layer dns {
    // DNSSEC for authentic discovery
    security: "origin-authentication",
    threat: "DNS-spoofing, cache-poisoning",
    defense: "DNSSEC + DANE + DoH"
  }
  
  @layer http {
    // Transport security + authentication
    security: "confidentiality + authentication",
    threat: "MITM, replay, injection",
    defense: "TLS-1.3 + OAuth2 + request-signing"
  }
  
  @layer websocket {
    // Per-message security
    security: "message-integrity + freshness",
    threat: "message-forgery, replay",
    defense: "per-message-HMAC + sequence-numbers"
  }
  
  @layer scxq2 {
    // Cryptographic proofs
    security: "verifiable-computation",
    threat: "server-malice, compression-corruption",
    defense: "zk-proofs + post-quantum-crypto"
  }
  
  // Cross-layer security
  @cross-layer {
    // Chain of trust
    dnssec -> tls-cert -> oauth-token -> message-auth -> zk-proof
    
    // Breach at any layer doesn't compromise whole system
    isolation: "compartmentalized-credentials"
  }
}
```

---

## 8. Performance Characteristics

### Benchmark Matrix

```asxr
@wormhole-performance {
  // Measured metrics
  
  @metric "latency" {
    dns: "10-100ms (cached), 200-500ms (uncached)",
    http: "1-3 RTTs (depends on connection)",
    websocket: "0.5-2 RTTs (already connected)",
    scxq2: "adds 1-10ms for proof generation/verification"
  }
  
  @metric "throughput" {
    dns: "tiny (discovery only)",
    http: "high (HTTP/2 multiplexing)",
    websocket: "very-high (binary, no overhead)",
    scxq2: "reduces payload 90-99% → effective throughput 10-100x"
  }
  
  @metric "battery-impact" {
    dns: "minimal (infrequent)",
    http: "moderate (radio active during transfer)",
    websocket: "low (keepalive, but efficient)",
    scxq2: "varies: +CPU for proofs, -radio time for compression"
  }
  
  @metric "reliability" {
    dns: "high (cached, multiple resolvers)",
    http: "high (retries, fallbacks)",
    websocket: "medium (connection drops)",
    scxq2: "very-high (integrity proofs detect corruption)"
  }
}
```

### Optimal Use Cases

```asxr
@wormhole-use-cases {
  // WHEN to use which layer(s)
  
  @case "initial-app-load" {
    // DNS → HTTP + SCXQ2
    reason: "Large payload, not yet real-time"
    stack: [dns, http+scxq2]
  }
  
  @case "real-time-collaboration" {
    // DNS → WebSocket (+ SCXQ2 for compression)
    reason: "Low latency, bidirectional"
    stack: [dns, websocket, scxq2]
  }
  
  @case "offline-sync" {
    // HTTP + SCXQ2 (with offline queue)
    reason: "Batch transfers, integrity critical"
    stack: [http+scxq2]
  }
  
  @case "service-discovery" {
    // DNS only
    reason: "Just finding endpoints"
    stack: [dns]
  }
  
  @case "large-file-transfer" {
    // HTTP + SCXQ2 + WebSocket for final delta
    reason: "Efficiency + real-time finish"
    stack: [http+scxq2, websocket]
  }
}
```

---

## 9. Implementation: Hybrid Wormhole Client

```asxr
@component HybridWormholeClient {
  // Client that uses all layers intelligently
  
  @state {
    discoveredEndpoints: [],
    currentProtocol: null,
    connectionState: "disconnected",
    performanceMetrics: {}
  }
  
  @method connect(serviceDomain) {
    // 1. DNS Discovery
    const capabilities = await @layer-dns.discover(serviceDomain);
    
    // 2. Protocol Negotiation  
    const protocol = this.negotiateProtocol(capabilities);
    this.currentProtocol = protocol;
    
    // 3. Layer-specific connection
    switch (protocol) {
      case "websocket+scxq2":
        await @layer-websocket.connect(capabilities.wsEndpoint);
        await @layer-scxq2.initialize(capabilities.dictionary);
        break;
        
      case "http+scxq2":
        await @layer-http.initialize(capabilities.httpEndpoint);
        await @layer-scxq2.initialize(capabilities.dictionary);
        break;
    }
    
    // 4. Upgrade/downgrade monitoring
    this.monitorAndAdapt();
  }
  
  @method monitorAndAdapt() {
    // Continuously measure and optimize
    
    @every "30s" {
      const metrics = this.measurePerformance();
      
      if (this.shouldSwitchProtocol(metrics)) {
        this.switchProtocol(this.betterProtocolFor(metrics));
      }
      
      if (this.shouldUpdateDictionary(metrics)) {
        @layer-scxq2.updateDictionary();
      }
    }
  }
  
  @method sendData(data, options) {
    // Route through optimal layers
    
    // Compress with SCXQ2 if beneficial
    if (data.size > 1024 && this.currentProtocol.includes("scxq2")) {
      data = @layer-scxq2.compress(data);
    }
    
    // Send via current protocol
    switch (this.currentProtocol) {
      case "websocket+scxq2":
        return @layer-websocket.sendBinary(data);
        
      case "http+scxq2":
        return @layer-http.post("/data", data);
    }
  }
}
```

---

## 10. The Hybrid Advantage

### Why Four Layers Beat Single Protocol

```asxr
@hybrid-advantages {
  1. **Resilience**: Failure in one layer doesn't break system
  2. **Optimization**: Right protocol for each job
  3. **Progressive Enhancement**: Works on all networks
  4. **Security Defense-in-Depth**: Multiple protection layers
  5. **Efficiency**: Minimal overhead for each operation
  6. **Future-proof**: Can add new layers without breaking old
  7. **Verifiable**: SCXQ2 proofs ensure correctness
  8. **Discoverable**: DNS makes services self-describing
}
```

### The Complete Picture

```
┌─────────────────────────────────────────────────────┐
│                    APPLICATION                      │
├─────────────────────────────────────────────────────┤
│         HYBRID WORMHOLE ORCHESTRATOR                │
│  (chooses optimal protocol stack for each task)     │
├─────────┬──────────┬───────────┬─────────────┤
│  DNS    │   HTTP   │ WebSocket │    SCXQ2    │  ← LAYERS
│DISCOVERY│   SYNC   │  RUNTIME  │ PROOF+COMPR │
├─────────┼──────────┼───────────┼─────────────┤
│DNSSEC   │ TLS 1.3  │ WSS+Auth  │ ZK-Proofs   │  ← SECURITY
│DoH      │ OAuth2   │ Per-msg   │ PQ-Crypto   │
├─────────┼──────────┼───────────┼─────────────┤
│Cache    │Multiplex │ Binary    │ 100:1       │  ← PERFORMANCE
│TTL      │Compress  │ Low-lat   │ Compression │
└─────────┴──────────┴───────────┴─────────────┘
```

---

## The Evolution

From single-protocol to hybrid wormholes:

1. **Discovery Layer (DNS)**: Find what's possible
2. **Sync Layer (HTTP/WebDAV)**: Get in sync efficiently  
3. **Runtime Layer (WebSocket)**: Stay in sync in real-time
4. **Proof Layer (SCXQ2)**: Verify everything with minimal overhead

This isn't just better networking—it's a complete rethinking of how systems communicate, with built-in discovery, optimization, verification, and security at every layer.
