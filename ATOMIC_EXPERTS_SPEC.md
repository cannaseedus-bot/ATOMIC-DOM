# ATOMIC EXPERTS SPECIFICATION v1.0

**Status:** FROZEN
**Scope:** Self-contained expert units with pre-loaded n-gram pools
**Non-Scope:** LLM inference, dynamic learning, shared state

---

## 1. CORE PRINCIPLE

> **Atomic Experts do NOT rely on an LLM for how to perform their job.**
> **They already have a title and job description.**
> **They just need a pool of n-grams with tensor-weighted topology flares.**

This is the fundamental distinction from MoE (Mixture of Experts) architectures.

---

## 2. WHAT ATOMIC EXPERTS ARE NOT

| NOT This | Reason |
|----------|--------|
| LLM-dependent | Expert knows its job without asking |
| Probabilistic routing | Deterministic activation by context |
| Learned at runtime | Pre-loaded, frozen knowledge |
| Shared state | Sandboxed, isolated execution |
| Neural submodels | N-gram pools + tensor weights |

---

## 3. WHAT ATOMIC EXPERTS ARE

Each Atomic Expert is a **self-contained unit** with:

| Component | Purpose |
|-----------|---------|
| **Identity** | Title + job description (frozen) |
| **N-gram Pool** | Domain vocabulary + operation patterns |
| **Tensor Weights** | Topology flares for activation/confidence |
| **Sandbox** | Isolated file (shell/bat/bash) |

---

## 4. EXPERT FILE STRUCTURE

Each expert lives in its own sandboxed file:

```
experts/
├── math/
│   ├── algebra-linear.expert
│   ├── algebra-polynomial.expert
│   ├── calculus-derivative.expert
│   └── calculus-integral.expert
├── lang/
│   ├── python-core.expert
│   ├── typescript-core.expert
│   └── rust-core.expert
├── web/
│   ├── html-semantic.expert
│   ├── css-layout.expert
│   └── api-rest.expert
└── infra/
    ├── docker-compose.expert
    ├── kubernetes-deploy.expert
    └── terraform-aws.expert
```

---

## 5. EXPERT FILE FORMAT

### 5.1 File Structure (`.expert`)

```bash
#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# ATOMIC EXPERT: math-algebra-linear
# VERSION: 1.0.0
# STATUS: FROZEN
# ═══════════════════════════════════════════════════════════════

# ─────────────────────────────────────────────────────────────────
# SECTION 1: IDENTITY (FROZEN)
# ─────────────────────────────────────────────────────────────────

EXPERT_ID="math-algebra-linear"
EXPERT_TITLE="Linear Algebra Expert"
EXPERT_JOB="Solve linear algebra operations including matrices, vectors, and linear systems"
EXPERT_PARENT="MathMicroAtomic"
EXPERT_VERSION="1.0.0"

# ─────────────────────────────────────────────────────────────────
# SECTION 2: N-GRAM POOL (MODIFIABLE)
# ─────────────────────────────────────────────────────────────────

# Domain vocabulary (unigrams)
NGRAM_1=(
  "matrix"
  "vector"
  "determinant"
  "eigenvalue"
  "eigenvector"
  "transpose"
  "inverse"
  "rank"
  "trace"
  "dot_product"
  "cross_product"
  "linear_combination"
  "span"
  "basis"
  "dimension"
  "null_space"
  "column_space"
  "row_space"
)

# Operation patterns (bigrams)
NGRAM_2=(
  "matrix multiplication"
  "matrix inverse"
  "matrix transpose"
  "determinant calculation"
  "eigenvalue decomposition"
  "vector addition"
  "scalar multiplication"
  "linear transformation"
  "gaussian elimination"
  "lu decomposition"
  "qr factorization"
  "singular value"
)

# Extended patterns (trigrams)
NGRAM_3=(
  "solve linear system"
  "find eigenvalues eigenvectors"
  "compute matrix determinant"
  "calculate dot product"
  "perform matrix multiplication"
  "apply linear transformation"
  "reduce row echelon"
  "orthogonal basis construction"
)

# ─────────────────────────────────────────────────────────────────
# SECTION 3: TENSOR WEIGHTS (MODIFIABLE)
# ─────────────────────────────────────────────────────────────────

# Activation threshold (0.0 - 1.0)
# Expert activates when context score exceeds this
WEIGHT_ACTIVATION=0.65

# Context affinity scores (higher = stronger match)
declare -A WEIGHT_AFFINITY=(
  ["matrix"]=0.95
  ["vector"]=0.90
  ["linear"]=0.85
  ["algebra"]=0.90
  ["eigenvalue"]=0.98
  ["determinant"]=0.95
  ["transpose"]=0.88
  ["inverse"]=0.90
  ["solve"]=0.70
  ["calculate"]=0.60
)

# Output confidence bounds
WEIGHT_CONFIDENCE_MIN=0.70
WEIGHT_CONFIDENCE_MAX=0.98

# Topology flare (how much this expert "spreads" to related domains)
WEIGHT_FLARE=0.15

# ─────────────────────────────────────────────────────────────────
# SECTION 4: OUTPUT TEMPLATES (MODIFIABLE)
# ─────────────────────────────────────────────────────────────────

# Template patterns for response generation
TEMPLATE_SOLVE="To solve this linear algebra problem:\n1. Identify the operation type\n2. Apply the appropriate method\n3. Verify the result"

TEMPLATE_MATRIX_OP="For matrix {{operation}}:\nGiven: {{input}}\nResult: {{output}}"

TEMPLATE_EIGENVALUE="Eigenvalue decomposition:\nA = PDP^(-1)\nwhere P contains eigenvectors\nand D is diagonal with eigenvalues"

# ─────────────────────────────────────────────────────────────────
# SECTION 5: SANDBOX BOUNDARY (DO NOT MODIFY)
# ─────────────────────────────────────────────────────────────────

# This expert CANNOT:
# - Access other expert files
# - Modify global state
# - Spawn child processes
# - Access network
# - Write outside its sandbox

SANDBOX_READ_ONLY=true
SANDBOX_ISOLATED=true
SANDBOX_NO_NETWORK=true
SANDBOX_NO_SPAWN=true

# ─────────────────────────────────────────────────────────────────
# SECTION 6: ACTIVATION FUNCTION
# ─────────────────────────────────────────────────────────────────

# Calculate activation score from input tokens
calculate_activation() {
  local input="$1"
  local score=0.0
  local count=0

  # Score against n-gram pool
  for gram in "${NGRAM_1[@]}"; do
    if [[ "$input" == *"$gram"* ]]; then
      score=$(echo "$score + ${WEIGHT_AFFINITY[$gram]:-0.5}" | bc)
      ((count++))
    fi
  done

  # Normalize
  if [ $count -gt 0 ]; then
    score=$(echo "scale=2; $score / $count" | bc)
  fi

  echo "$score"
}

# Check if expert should activate
should_activate() {
  local score=$(calculate_activation "$1")
  if (( $(echo "$score >= $WEIGHT_ACTIVATION" | bc -l) )); then
    echo "true"
  else
    echo "false"
  fi
}

# ═══════════════════════════════════════════════════════════════
# END OF EXPERT FILE
# ═══════════════════════════════════════════════════════════════
```

---

## 6. EXPERT ISOLATION GUARANTEES

### 6.1 Sandbox Rules

Each expert file is **completely isolated**:

| Rule | Enforcement |
|------|-------------|
| No cross-expert access | Filesystem sandbox |
| No shared memory | Process isolation |
| No network access | Network namespace |
| No process spawning | seccomp/AppArmor |
| Read-only execution | Mount flags |

### 6.2 Modification Scope

| Section | Modifiable? | By Whom |
|---------|-------------|---------|
| Identity | No | Frozen at creation |
| N-gram Pool | Yes | Expert maintainer |
| Tensor Weights | Yes | Expert maintainer |
| Output Templates | Yes | Expert maintainer |
| Sandbox Boundary | No | System enforced |

---

## 7. N-GRAM POOL STRUCTURE

### 7.1 N-gram Levels

| Level | Name | Purpose |
|-------|------|---------|
| 1-gram | Unigrams | Domain vocabulary |
| 2-gram | Bigrams | Operation patterns |
| 3-gram | Trigrams | Extended patterns |
| 4-gram | Quadgrams | Complex operations |

### 7.2 N-gram Weighting

Each n-gram has an implicit or explicit weight:

```bash
# Implicit (equal weight)
NGRAM_1=("matrix" "vector" "scalar")

# Explicit (weighted)
declare -A NGRAM_1_WEIGHTS=(
  ["matrix"]=1.0
  ["vector"]=0.9
  ["scalar"]=0.7
)
```

---

## 8. TENSOR TOPOLOGY FLARES

### 8.1 What Are Topology Flares?

Flares define how an expert's activation "spreads" to related domains:

```
┌─────────────────────────────────────────────────────────────┐
│                    EXPERT: math-algebra-linear               │
│                                                              │
│                         ★ (core)                             │
│                        /|\                                   │
│                       / | \  ← flare spread                  │
│                      /  |  \                                 │
│              math-calc  │  math-stats                        │
│                         │                                    │
│                   lang-python (for numpy)                    │
└─────────────────────────────────────────────────────────────┘
```

### 8.2 Flare Configuration

```bash
# Primary domain (100% activation)
FLARE_PRIMARY="math-algebra"

# Secondary domains (flare percentage)
declare -A FLARE_SECONDARY=(
  ["math-calculus"]=0.30
  ["math-statistics"]=0.20
  ["lang-python"]=0.25      # numpy/scipy
  ["lang-matlab"]=0.20
)

# Flare decay (how fast activation drops with distance)
FLARE_DECAY=0.15
```

---

## 9. EXPERT ACTIVATION FLOW

```
Input Context
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│  FOR EACH EXPERT:                                            │
│                                                              │
│  1. Tokenize input                                           │
│  2. Match against n-gram pool                                │
│  3. Calculate affinity score                                 │
│  4. Apply topology flares                                    │
│  5. Compare to activation threshold                          │
│                                                              │
│  IF score >= threshold:                                      │
│    → Expert ACTIVATES                                        │
│    → Returns confidence score                                │
│  ELSE:                                                       │
│    → Expert DORMANT                                          │
└─────────────────────────────────────────────────────────────┘
     │
     ▼
Top-K Activated Experts
     │
     ▼
Weighted Response Merge
```

---

## 10. EXPERT CATEGORIES

### 10.1 Full Taxonomy

| Category | Count | Parent MicroAtomic |
|----------|-------|-------------------|
| Mathematics | 10 | MathMicroAtomic |
| Languages | 15 | ProgrammingMicroAtomic |
| Web | 12 | WebMicroAtomic |
| Data/ML | 10 | CodeGenMicroAtomic |
| Infrastructure | 12 | CodeGenMicroAtomic |
| Resume | 8 | ResumeMicroAtomic |
| Algorithms | 8 | ProgrammingMicroAtomic |
| Architecture | 8 | ProgrammingMicroAtomic |
| Documentation | 6 | OutputMicroAtomic |
| **Atomic Framework** | **10** | AtomicMicroAtomic |
| **Reserved** | **19** | Fine-tuning slots |

**Total: 118 experts (99 defined + 19 reserved)**

---

## 11. CREATING A NEW EXPERT

### 11.1 Template Generator

```bash
#!/bin/bash
# generate-expert.sh

EXPERT_ID="$1"
EXPERT_TITLE="$2"
EXPERT_JOB="$3"

cat > "experts/${EXPERT_ID}.expert" << 'EXPERT_TEMPLATE'
#!/bin/bash
# ATOMIC EXPERT: ${EXPERT_ID}

EXPERT_ID="${EXPERT_ID}"
EXPERT_TITLE="${EXPERT_TITLE}"
EXPERT_JOB="${EXPERT_JOB}"
EXPERT_VERSION="1.0.0"

# N-GRAM POOL (customize these)
NGRAM_1=()
NGRAM_2=()
NGRAM_3=()

# TENSOR WEIGHTS (customize these)
WEIGHT_ACTIVATION=0.65
declare -A WEIGHT_AFFINITY=()
WEIGHT_CONFIDENCE_MIN=0.70
WEIGHT_CONFIDENCE_MAX=0.98
WEIGHT_FLARE=0.15

# SANDBOX (do not modify)
SANDBOX_READ_ONLY=true
SANDBOX_ISOLATED=true
EXPERT_TEMPLATE

echo "Created: experts/${EXPERT_ID}.expert"
```

---

## 12. EXPERT MODIFICATION RULES

### 12.1 What You CAN Modify

- N-gram pools (add/remove vocabulary)
- Tensor weights (tune activation thresholds)
- Output templates (adjust response patterns)
- Flare configuration (adjust domain spread)

### 12.2 What You CANNOT Modify

- Expert identity (title/job are frozen)
- Sandbox boundaries (system enforced)
- Cross-expert access (isolation enforced)
- Activation function signature (API contract)

---

## 13. CROSS-PLATFORM SUPPORT

### 13.1 File Extensions

| Platform | Extension | Shell |
|----------|-----------|-------|
| Linux | `.expert` | bash |
| macOS | `.expert` | bash/zsh |
| Windows | `.expert.bat` | cmd/PowerShell |

### 13.2 Windows Adaptation

```batch
@echo off
REM ATOMIC EXPERT: math-algebra-linear (Windows)

SET EXPERT_ID=math-algebra-linear
SET EXPERT_TITLE=Linear Algebra Expert
SET EXPERT_JOB=Solve linear algebra operations

REM N-GRAM POOL
SET NGRAM_1=matrix vector determinant eigenvalue

REM TENSOR WEIGHTS
SET WEIGHT_ACTIVATION=0.65

REM SANDBOX
SET SANDBOX_READ_ONLY=true
SET SANDBOX_ISOLATED=true
```

---

## 14. INVARIANTS (NON-NEGOTIABLE)

1. **Experts do NOT call LLMs** for their core function
2. **Experts are sandboxed** - cannot access each other
3. **N-gram pools are pre-loaded** - not generated at runtime
4. **Tensor weights are static** - not learned during execution
5. **Identity is frozen** - title and job cannot change
6. **Activation is deterministic** - same input → same activation

---

## 15. FINAL STATEMENT

> **Atomic Experts are pre-configured capability units.**
> **They don't ask "what should I do?" — they know their job.**
> **They just need the right vocabulary and weights to recognize when to act.**

---

## 16. ONE-SENTENCE COLLAPSE

> **An Atomic Expert is a sandboxed file containing frozen identity, modifiable n-gram pools, tunable tensor weights, and deterministic activation — no LLM required.**

---

**Document Version:** 1.0.0
**Status:** FROZEN
