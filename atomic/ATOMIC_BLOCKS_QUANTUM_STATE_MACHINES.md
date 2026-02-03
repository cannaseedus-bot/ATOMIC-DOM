# Atomic Blocks: Quantum State Machines

Atomic Blocks are **discrete units of state transition** that guarantee **all-or-nothing execution**. They're not code blocks—they're **quantum state machines** that preserve causality and consistency across distributed systems.

---

## 1. Core Definition: Atomicity

```asxr
atomic_block = "@atomic", block_id?, "{", operations, "}"
              where operations either ALL succeed or ALL fail
```

**Atomic means:**

- ✅ **All-or-nothing**: Entire block succeeds or completely fails
- ✅ **Isolated**: No intermediate state visible externally
- ✅ **Consistent**: System invariants preserved
- ✅ **Durable**: Once committed, survives crashes

---

## 2. Quantum Analogy

Think of atomic blocks as **quantum wavefunctions**:

```asxr
@atomic {
  // Superposition of all possible outcomes
  |ψ⟩ = α|success⟩ + β|failure⟩

  // Measurement (commit) collapses to ONE reality
  // Either |success⟩ OR |failure⟩
  // Never "partially succeeded"
}
```

**Before commit:** Multiple possible states exist in superposition  
**After commit:** Wavefunction collapses to single reality

---

## 3. The Atomic Guarantee Matrix

### ACID Properties

```asxr
@atomic-guarantees {
  Atomicity:   "All operations succeed or NONE do",
  Consistency: "System invariants always preserved",
  Isolation:   "Concurrent blocks don't interfere",
  Durability:  "Committed changes survive crashes"
}
```

### Real-world analogy

```asxr
// NOT ATOMIC (Dangerous):
1. Withdraw $100 from Account A ✓
2. Network fails ✗
3. Deposit $100 to Account B ✗
// Result: Money disappeared!

// ATOMIC (Safe):
@atomic {
  1. Withdraw $100 from Account A
  2. Deposit $100 to Account B
}
// Either BOTH succeed or BOTH fail
// Money never disappears
```

---

## 4. Atomic Block Structure

### 4.1 Basic Syntax

```asxr
@atomic [identifier]? {
  // Sequence of operations
  operation₁;
  operation₂;
  ...;
  operationₙ;

  // All must succeed
  // If any fails → ALL roll back
}
```

### 4.2 With Rollback Handler

```asxr
@atomic transfer-funds {
  // Try block
  accountA.balance -= 100;
  accountB.balance += 100;

} @on-error {
  // Automatic rollback
  // System returns to pre-atomic state
  log.error("Transfer failed, rolled back");

} @finally {
  // Always executes (even after rollback)
  cleanup.resources();
}
```

### 4.3 Nested Atomic Blocks

```asxr
@atomic outer {
  operation₁;

  @atomic inner {
    // Can fail independently
    operation₂;
  } // inner commits or rolls back

  operation₃;
} // outer commits or rolls back

// inner failure doesn't force outer failure
// Unless explicitly propagated
```

---

## 5. Atomic Operations in Practice

### 5.1 DOM Updates (Critical for UI)

```javascript
// NON-ATOMIC (Causes layout thrashing):
element.style.width = '100px';  // 💥 Reflow
element.style.height = '200px'; // 💥 Reflow
element.style.margin = '10px';  // 💥 Reflow
// 3 separate layout calculations!

// ATOMIC (Single reflow):
@atomic {
  element.style.width = '100px';
  element.style.height = '200px';
  element.style.margin = '10px';
} // 🎯 ONE reflow calculation
```

### 5.2 Database Transaction

```asxr
@atomic create-user {
  // All or nothing:
  users.insert({
    id: generateId(),
    name: "Alice",
    email: "alice@example.com"
  });

  profiles.insert({
    userId: lastInsertId(),
    bio: "New user",
    avatar: defaultAvatar
  });

  audit.log("User created", {timestamp: now()});

  // If ANY fails (email exists, disk full, etc.)
  // ALL insertions roll back
  // Database remains consistent
}
```

### 5.3 File System Operations

```asxr
@atomic save-document {
  // Atomic file operations
  tempFile.write(content);
  tempFile.flush();

  // Atomic rename (POSIX guarantees)
  rename(tempFile, finalFile); // Single system call

  // Either:
  // - File saved completely
  // - Original file unchanged
  // No partial/corrupted files
}
```

---

## 6. Concurrency Control

### 6.1 Optimistic Concurrency

```asxr
@atomic optimistic {
  // Assume no conflicts
  read state;
  compute new state;

  @commit-if version == expectedVersion {
    write new state;
    return success;
  } @else {
    // Conflict detected
    return retry;
  }
}
```

### 6.2 Pessimistic Locking

```asxr
@atomic with-locks {
  // Acquire locks first
  @lock accountA for write;
  @lock accountB for write;

  // Now operate safely
  accountA.balance -= 100;
  accountB.balance += 100;

  // Locks released automatically on commit/rollback
}
```

### 6.3 Software Transactional Memory (STM)

```asxr
// Haskell/Clojure style
@atomic stm-style {
  // All reads/writes to shared memory
  // Automatically retried on conflict

  let balanceA = accountA.balance;
  let balanceB = accountB.balance;

  accountA.balance = balanceA - 100;
  accountB.balance = balanceB + 100;

  // If conflict: entire block retries
  // No manual lock management needed
}
```

---

## 7. Distributed Atomicity

### 7.1 Two-Phase Commit (2PC)

```asxr
@atomic distributed {
  // Phase 1: Prepare
  @prepare {
    database1: "ready to commit?",
    database2: "ready to commit?",
    messageQueue: "ready to commit?"
  }

  // Phase 2: Commit or Abort
  @if all-prepared {
    @commit-all;  // All commit
  } @else {
    @abort-all;   // All abort
  }
}
```

### 7.2 Saga Pattern (Long-running transactions)

```asxr
@saga book-trip {
  // Compensating actions for rollback

  @atomic step-1 {
    bookFlight();
  } @compensate {
    cancelFlight();  // Undo if saga fails
  }

  @atomic step-2 {
    bookHotel();
  } @compensate {
    cancelHotel();
  }

  @atomic step-3 {
    bookCar();
  } @compensate {
    cancelCar();
  }

  // If any step fails:
  // Execute compensations in reverse order
}
```

### 7.3 Event Sourcing Atomicity

```asxr
@atomic event-sourced {
  // Store events, not state

  events = [
    AccountCreated(id: "acc1"),
    FundsDeposited(acc: "acc1", amount: 500),
    FundsWithdrawn(acc: "acc1", amount: 100)
  ];

  // Atomic: ALL events or NONE
  eventStore.append(events);

  // State is derived from events
  // Atomic at event level, not state level
}
```

---

## 8. Atomic DOM Patterns

### 8.1 Batching DOM Operations

```asxr
// Without atomic (janky):
items.forEach(item => {
  element.appendChild(createItem(item)); // 💥 Reflow each time
});

// With atomic (smooth):
@atomic {
  const fragment = document.createDocumentFragment();

  items.forEach(item => {
    fragment.appendChild(createItem(item));
  });

  element.appendChild(fragment); // 🎯 Single reflow
}
```

### 8.2 CSS Transition Group

```asxr
@atomic css-transition {
  // Start transition
  element.classList.add('fade-out');

  // Remove AFTER transition completes
  @on-transition-end {
    element.remove();
  };

  // Atomic: visual removed ↔ DOM removed
  // No flicker or half-states
}
```

### 8.3 Form Validation & Submission

```asxr
@atomic form-submit {
  // Validate all fields
  validate(email);
  validate(password);
  validate(terms);

  // All valid → submit
  @if all-valid {
    api.submit(formData);
    ui.showSuccess();
    form.reset();
  } @else {
    // Show ALL errors at once
    showErrors(allErrors);
    // No partial validation states
  }
}
```

---

## 9. Atomic Block Types

### 9.1 Read-Only Atomic

```asxr
@atomic read-only {
  // Can safely read without locks
  // Guaranteed consistent snapshot

  const total = cart.items.reduce(sum);
  const tax = calculateTax(total);
  const shipping = calculateShipping(cart);

  // All reads from same point-in-time
  // Even if data changes concurrently
}
```

### 9.2 Write-Only Atomic

```asxr
@atomic write-only {
  // Buffered writes, flushed atomically

  log.buffer("User clicked", data);
  analytics.buffer("event", data);
  audit.buffer("action", data);

  // All buffered data flushed together
  // No partial logs
}
```

### 9.3 Mixed Atomic

```asxr
@atomic read-modify-write {
  // Classic RMW pattern

  // 1. Read current state
  const current = counter.value;

  // 2. Modify
  const next = current + 1;

  // 3. Write back atomically
  counter.value = next;

  // Prevents lost updates in concurrent systems
}
```

---

## 10. Atomicity in ASX-R

### 10.1 State Proposal Atomicity

```asxr
@atomic state-proposal {
  // Propose new state
  @propose {
    prior: currentStateHash,
    next: newState,

    // Validation happens atomically
    @validate with laws {
      law₁: "no-contradictions",
      law₂: "causality-preserved",
      law₃: "invariants-held"
    }
  }

  // Either:
  // - All validations pass, state updates
  // - Any validation fails, state unchanged
}
```

### 10.2 Wormhole Atomicity

```asxr
@atomic with-wormholes {
  // Multiple wormholes update atomically

  @wormhole sync-to-db {
    source: {{uiState}},
    target: database.table
  }

  @wormhole sync-to-cache {
    source: {{uiState}},
    target: redis.cache
  }

  @wormhole notify-clients {
    source: {{uiState}},
    target: websocket.broadcast
  }

  // All wormholes succeed or all fail
  // No partial synchronization
}
```

### 10.3 Shell Inference Atomicity

```asxr
@atomic shell-execution {
  // Shell commands execute atomically

  bash: {
    cd /app &&
    npm install &&
    npm run build
  } // All succeed or none

  // If npm install fails:
  // - No partial node_modules
  // - Build doesn't run with broken deps
  // - System returns to pre-command state
}
```

---

## 11. Failure Modes & Recovery

### 11.1 Automatic Rollback

```asxr
@atomic auto-recover {
  try {
    operation₁();
    operation₂();
    operation₃();

  } catch (error) {
    // Automatic rollback happens here
    // All completed operations undone

    throw new AtomicFailure(error);

  } finally {
    // Always executes
    cleanup();
  }
}
```

### 11.2 Compensating Transactions

```asxr
@atomic with-compensation {
  // Manual compensation control

  const steps = [];

  try {
    const result₁ = operation₁();
    steps.push(() => undo₁(result₁));

    const result₂ = operation₂();
    steps.push(() => undo₂(result₂));

    // Commit
    return success;

  } catch (error) {
    // Execute compensations in reverse
    steps.reverse().forEach(comp => comp());
    throw error;
  }
}
```

### 11.3 Timeout & Deadlock Handling

```asxr
@atomic with-timeout "5s" {
  // Block times out after 5 seconds

  operation₁();
  operation₂();

} @on-timeout {
  // Automatic rollback
  log.warn("Atomic block timed out");

} @on-deadlock {
  // Detected deadlock
  // Choose victim, rollback, retry
  @retry-with-backoff;
}
```

---

## 12. Performance Optimizations

### 12.1 Lazy Evaluation

```asxr
@atomic lazy {
  // Operations evaluated only when needed

  @lazy expensiveComputation();
  @lazy databaseQuery();
  @lazy networkRequest();

  // If block rolls back early:
  // Never evaluated → better performance
}
```

### 12.2 Parallel Execution

```asxr
@atomic parallel {
  // Independent operations run in parallel

  @parallel {
    task₁: fetchUserData(),
    task₂: fetchProductData(),
    task₃: fetchRecommendations()
  }

  // All complete or none succeed
  // Block completes when slowest finishes
}
```

### 12.3 Incremental Commit

```asxr
@atomic incremental {
  // Large operations commit in chunks

  @chunk-size 1000;

  for (item of largeList) {
    process(item);

    @every 1000 items {
      // Intermediate commit
      @checkpoint;

      // Can restart from checkpoint on failure
    }
  }
}
```

---

## The Atomic Guarantee

```asxr
@atomic-philosophy {
  // Atomic blocks provide:

  1. **Mental Model Simplicity**:
     - Think in transactions, not partial updates
     - System always in valid state

  2. **Error Safety**:
     - Failures don't corrupt state
     - Automatic cleanup

  3. **Concurrency Safety**:
     - No race conditions within block
     - Serializable isolation

  4. **Debugging Simplicity**:
     - Either executed completely
     - Or not at all
     - No "half-executed" states to debug

  5. **System Integrity**:
     - Invariants always preserved
     - Consistency guaranteed
}
```

---

## The Realization

**Atomic blocks are the fundamental unit of reliable computation.**

They transform:

- **Unreliable operations** → **Reliable transactions**
- **Race conditions** → **Serializable isolation**
- **Partial failures** → **All-or-nothing guarantees**
- **Complex error handling** → **Automatic rollback**

Every system that needs reliability eventually rediscovers atomicity. Databases, file systems, distributed systems—all converge on atomic transactions as the foundation.

ASX-R makes atomic blocks **first-class citizens**, not just database features. They're the building blocks of reliable state transitions across UI, network, storage, and computation.

**Atomicity isn't an optimization—it's a requirement for correctness.** 🔒⚛️
