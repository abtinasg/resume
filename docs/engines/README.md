# Engine Specifications

This directory contains **implementation-level specifications** for the core algorithms and behaviors used by the ResumeIQ AI Career Agent.

---

## What Goes Here?

**Engine specs describe HOW we implement behavior**, including:
- Detailed algorithms and heuristics
- Scoring formulas and weighting systems
- Prompt templates and LLM integration patterns
- Validation rules and safety checks
- Performance optimization techniques

**This is NOT architecture.** For system architecture and layer contracts, see `docs/architecture/agent/`.

---

## Engines vs Layers

### Agent Layers (Architecture)

**Location:** `docs/architecture/agent/layers/`

**Describes:**
- What each layer does in the agent stack
- Inputs, outputs, responsibilities
- How layers interact with each other
- Non-responsibilities (boundaries)

**Example:** `layer_2_strategy_engine_v2.md` defines:
- Layer 2 analyzes career fit and recommends strategy modes
- Receives state from Layer 4, evaluation from Layer 1
- Provides analysis to Orchestrator (Layer 5)
- Does NOT make decisions (Orchestrator does)

---

### Engine Specs (Implementation)

**Location:** `docs/engines/` (this directory)

**Describes:**
- Specific algorithms that implement layer behavior
- Mathematical formulas, heuristics, rules
- LLM prompts and model integration
- Performance characteristics and constraints

**Example:** `scoring_engine_pro_spec.md` defines:
- TF-IDF algorithm for keyword matching
- Weighted scoring formula for resume components
- Readability scoring heuristics
- ATS compatibility checks
- AI interpretation prompt templates

---

## Relationship to Layers

| Engine Spec | Used By Layer | Purpose |
|-------------|---------------|---------|
| `scoring_engine_pro_spec.md` | Layer 1 (Evaluation) | Implements resume scoring algorithm |
| `rewrite_engine_spec_v2.md` | Layer 3 (Execution) | Implements bullet/summary rewriting |
| `rewrite_engine_mvp.md` | Layer 3 (Execution) | MVP-level rewrite logic |
| *(future)* `strategy_analysis_algorithms.md` | Layer 2 (Strategy) | CPA gap detection algorithms |
| *(future)* `job_matching_spec.md` | Layer 6 (Job Discovery) | Query generation + scoring |

---

## Why Separate Engines from Layers?

### Reason 1: Different Audiences

**Layer specs** → For product, architects, cross-layer integration
- "What does this layer do?"
- "How do layers communicate?"
- "What are the boundaries?"

**Engine specs** → For implementers, algorithm designers, ML engineers
- "What's the exact formula?"
- "What prompts do we use?"
- "How do we handle edge cases?"

---

### Reason 2: Implementation May Change

Example:
- **Layer 2 (Strategy Engine)** contract stays stable: "Analyze gaps, recommend mode"
- **Implementation** may evolve:
  - v1: Rule-based gap detection
  - v2: Add semantic skill matching (embeddings)
  - v3: ML-based mode recommendation

Layer spec doesn't change. Engine spec does.

---

### Reason 3: Reusability

Some engines might be used by multiple layers:

Example:
- `text_analysis_engine.md` could be used by:
  - Layer 1 (scoring resume text)
  - Layer 2 (analyzing JD requirements)
  - Layer 6 (parsing job descriptions)

Engine spec defines behavior once; layer specs reference it.

---

## Current Engine Specs

### 1. Scoring Engine PRO (`scoring_engine_pro_spec.md`)

**Status:** Detailed spec exists (from legacy upload)
**Used by:** Layer 1 (Evaluation Engine)

**Key Components:**
- 4-layer scoring model (Content, ATS, Format, Impact)
- Job Description Optimizer (TF-IDF matching)
- Readability component
- AI interpretation layers
- Adaptive weight tuning

**Reference:** Migrated from `docs/architecture/legacy/uploaded/Upgrade_Resume_Scorer_to_PRO_Version_v2_0.md`

---

### 2. Rewrite Engine Spec v2 (`rewrite_engine_spec_v2.md`)

**Status:** Detailed spec exists (from legacy upload)
**Used by:** Layer 3 (Execution Engine)

**Key Components:**
- Micro-action sequencer (verb upgrade, metric addition, fluff removal)
- No-fabrication guardrails
- Role-specific rewriting
- Multi-variant generation (v3)
- ATS-safe formatting rules

**Reference:** Migrated from `docs/architecture/legacy/uploaded/rewrite_engine_full.md`

---

### 3. Rewrite Engine MVP (`rewrite_engine_mvp.md`)

**Status:** Simple MVP spec exists
**Used by:** Layer 3 (Execution Engine) - v1 implementation

**Key Components:**
- Single bullet rewrite
- Basic verb strengthening
- Simple metric detection
- Deterministic behavior

**Reference:** Migrated from `docs/architecture/legacy/uploaded/rewrite_engine_mvp.md`

---

### 4. Strategy Analysis Algorithms *(Planned)*

**Status:** To be extracted from legacy CPA docs
**Used by:** Layer 2 (Strategy Engine)

**Will include:**
- Skills gap detection algorithm
- Tools gap matching
- Seniority estimation heuristics
- Experience coverage analysis
- Industry alignment scoring

**Source:** Extract from `docs/architecture/legacy/uploaded/cpa/`

---

## How to Use This Directory

### For Developers Implementing a Layer

1. **Start with layer spec** (`docs/architecture/agent/layers/layer_X_...`)
   - Understand what the layer should do
   - Review inputs, outputs, responsibilities

2. **Read relevant engine spec** (from this directory)
   - Get detailed algorithm/formula
   - Understand implementation constraints
   - Review examples and edge cases

3. **Implement conforming to both**
   - Layer spec = contract you must fulfill
   - Engine spec = how you fulfill it

---

### For Architects Designing New Features

1. **Update layer spec first** if behavior changes
   - Does layer's responsibility change?
   - Do inputs/outputs change?
   - Does integration with other layers change?

2. **Update engine spec second** if implementation changes
   - New algorithm needed?
   - Different prompts?
   - Performance improvements?

---

### For Reviewers

**When reviewing layer changes:**
- Does this break contracts with other layers?
- Are responsibilities clear?
- Is integration well-defined?

**When reviewing engine changes:**
- Does implementation still conform to layer contract?
- Are algorithms correct and efficient?
- Are safety rules maintained?

---

## Migration Status

| Engine Spec | Status | Source | Notes |
|-------------|--------|--------|-------|
| Scoring PRO | 🟡 To migrate | Legacy upload | Needs adaptation for Layer 1 |
| Rewrite v2 | 🟡 To migrate | Legacy upload | Needs adaptation for Layer 3 |
| Rewrite MVP | 🟡 To migrate | Legacy upload | Quick migration |
| Strategy Algorithms | 🔴 Not started | Legacy CPA docs | Extract when building Layer 2 |
| Job Matching | 🔴 Not started | New for v1 | Create when building Layer 6 |

---

## Contributing

When adding a new engine spec:

1. **Create file:** `{engine_name}_spec.md` or `{engine_name}_v{version}.md`
2. **Include sections:**
   - Purpose & scope
   - Used by which layer(s)
   - Core algorithm/approach
   - Inputs & outputs (technical detail)
   - Implementation notes
   - Performance characteristics
   - Safety/validation rules
   - Examples
   - Test cases
3. **Reference in layer spec:** Link from layer doc to engine doc
4. **Update this README:** Add to tables above

---

## Related Documentation

- [Agent Architecture v2](../architecture/agent/agent_architecture_v2.md) - System overview
- [Migration Guide](../architecture/agent/migration_guide.md) - Old → New mapping
- [Layer Specs](../architecture/agent/layers/) - Architecture-level contracts
- [Legacy Docs](../architecture/legacy/) - Historical reference

---

**Maintained By:** Engineering Team
**Last Updated:** December 7, 2025
**Status:** Initial structure, specs to be migrated from legacy docs
