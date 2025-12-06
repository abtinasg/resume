# Migration Guide: 4-Engine Architecture → 8-Layer AI Career Agent

**Version:** 1.0
**Last Updated:** December 7, 2025
**Status:** Initial mapping guide

---

## Overview

ResumeIQ has evolved from a **4-engine resume analysis tool** to an **8-layer AI Career Agent**. This guide helps developers and contributors understand how the old architecture maps to the new system.

---

## Architecture Comparison

### Old Architecture (4 Engines)

```
User → Score Engine → CPA → Rewrite Engine → AI Coach
```

**Engines:**
1. Resume Scoring Engine (Diagnosis)
2. Career Path Analyzer - CPA (Identity & Trajectory)
3. Rewrite Engine (Improvement)
4. AI Coach Integration (Guidance)

### New Architecture (8 Layers - Agent v2)

```
User → Layer 8 (Coach Interface)
         ↓
       Layer 5 (Orchestrator)
         ↓
    Layers 1-4, 6-7 (Specialized engines)
```

**Layers:**
1. Evaluation Engine (Scoring)
2. Strategy Engine (Career Path Analysis)
3. Execution Engine (Rewrite & Actions)
4. Memory & State Engine
5. Orchestrator / Planner
6. Job Discovery Module
7. Learning & Optimization Engine
8. AI Coach Interface

---

## Mapping: Old → New

| Old System | New System | Notes |
|------------|------------|-------|
| **Engine 1: Resume Scoring** | **Layer 1: Evaluation Engine** | Core scoring logic unchanged; now provides input to Orchestrator |
| **Engine 2: CPA** | **Layer 2: Strategy Engine** | Career path analysis + strategy mode selection (IMPROVE_RESUME_FIRST, APPLY_MODE, RETHINK_TARGETS) |
| **Engine 3: Rewrite Engine** | **Layer 3: Execution Engine** | Rewrite logic unchanged; now orchestrator-driven, not linear |
| **Engine 4: AI Coach** | **Layer 8: AI Coach Interface** | Coach is now interface layer, not decision-maker; explains Orchestrator's decisions |
| *(none)* | **Layer 4: Memory & State** | NEW - Tracks user pipeline, application history, strategy changes |
| *(none)* | **Layer 5: Orchestrator** | NEW - Decision-making brain; plans weekly targets, daily actions, mode selection |
| *(none)* | **Layer 6: Job Discovery** | NEW - Query generation, job scoring (v1: manual paste; v2: automated) |
| *(none)* | **Layer 7: Learning Engine** | NEW - Analyzes outcomes, optimizes strategies (v2 feature) |

---

## Key Conceptual Shifts

### 1. **Linear Flow → Orchestrated System**

**Old:**
- User uploads resume → Score → CPA → Rewrite → Coach
- Each engine called sequentially

**New:**
- Orchestrator (Layer 5) decides what to do based on user state
- Layers called on-demand, not sequentially
- Example: User in APPLY_MODE might skip rewrite, go straight to job discovery

---

### 2. **Coach as Product → Coach as Interface**

**Old:**
- AI Coach was "the brain" - made decisions about what to fix
- Coach integrated Score + CPA + Rewrite

**New:**
- AI Coach (Layer 8) is **explanation layer only**
- Orchestrator (Layer 5) makes decisions
- Coach **explains** Orchestrator's decisions in human language

---

### 3. **Stateless → Stateful**

**Old:**
- Each session independent
- No memory of past interactions

**New:**
- Layer 4 (Memory & State) tracks:
  - Application pipeline (submitted, pending, interviews)
  - Strategy history (mode changes, reasons)
  - User preferences (remote only, salary floor, etc.)

---

## Document Locations

### Current Architecture (Agent v2)

**Primary Docs:**
- [Agent Architecture v2](agent/agent_architecture_v2.md) - Complete 8-layer system
- [MVP Scope v1](agent/Agent_MVP_Scope_v1.md) - What's in v1 vs v2
- [Data Model v1](agent/data_model_v1.md) - Database schema
- [MVP Roadmap](agent/mvp_roadmap_v1.md) - 8-week implementation plan

**Layer Specs:**
- [Layer 2: Strategy Engine](agent/layers/layer_2_strategy_engine_v2.md)
- [Layer 8: AI Coach Interface](agent/layers/layer_8_ai_coach_interface_v2.md)
- *(More layer specs to be added as needed)*

---

### Legacy Architecture (4 Engines)

**From GitHub:**
- [System Architecture v1](legacy/github/system_architecture_v1_legacy.md)
- [Product Manifest v1](legacy/github/resumeiq_manifest_v1_legacy.md)
- [AI Coach System Design v1](legacy/github/coach/ai_coach_system_design_v1_legacy.md)
- [AI Coach Roadmap v1](legacy/github/coach/AI_COACH_ROADMAP_v1_legacy.md)

**From Uploaded Archives:**
- [Coach Documents](legacy/uploaded/coach/) - Old coach specs
- [CPA Documents](legacy/uploaded/cpa/) - Standalone CPA module specs
- [Rewrite Engine Specs](legacy/uploaded/) - Implementation details
- [Scoring Engine PRO](legacy/uploaded/) - Scoring upgrade spec

---

### Shared / Architecture-Agnostic

- [Core Protocols v1](shared/core_protocols_v1.md) - Data models, schemas
- [Data Model v1](shared/data_model_v1.md) - Database schema (used by both)

---

## Implementation Specs (Engine-Level Details)

**Location:** `docs/engines/`

These are **implementation-level** specs that conform to layer contracts:

- `scoring_engine_pro_spec.md` - Detailed scoring algorithm (used by Layer 1)
- `rewrite_engine_spec_v2.md` - Rewrite heuristics (used by Layer 3)
- `rewrite_engine_mvp.md` - MVP rewrite logic

**Note:** Engine specs describe **how** we implement behavior. Layer specs describe **what** each layer does in the agent stack.

---

## For Developers: Quick Reference

### "I'm working on scoring/evaluation"
- **Current spec:** `docs/architecture/agent/layers/layer_1_evaluation_engine_v2.md` *(to be created)*
- **Implementation details:** `docs/engines/scoring_engine_pro_spec.md`
- **Legacy reference:** `docs/architecture/legacy/uploaded/Upgrade_Resume_Scorer_to_PRO_Version_v2_0.md`

### "I'm working on career path / strategy"
- **Current spec:** `docs/architecture/agent/layers/layer_2_strategy_engine_v2.md`
- **Legacy reference:** `docs/architecture/legacy/uploaded/cpa/`
- **Old standalone module:** `docs/architecture/legacy/github/cpa/cpa_mvp_scope_v1_legacy.md`

### "I'm working on rewrite / execution"
- **Current spec:** `docs/architecture/agent/layers/layer_3_execution_engine_v2.md` *(to be created)*
- **Implementation details:** `docs/engines/rewrite_engine_spec_v2.md`
- **Legacy reference:** `docs/architecture/legacy/uploaded/rewrite_engine_full.md`

### "I'm working on AI Coach"
- **Current spec:** `docs/architecture/agent/layers/layer_8_ai_coach_interface_v2.md`
- **Legacy reference:** `docs/architecture/legacy/uploaded/coach/ai_coach_system_design.md`

### "I'm working on orchestrator / planning"
- **Current spec:** `docs/architecture/agent/agent_architecture_v2.md` (Layer 5 section)
- **Detailed spec:** `docs/architecture/agent/layers/layer_5_orchestrator_v2.md` *(to be created)*

---

## Timeline: What Changed When

**November 2025:** 4-engine architecture designed and documented
- Focus: Resume analysis tool with AI coach integration
- Architecture: Linear flow (Score → CPA → Rewrite → Coach)

**December 2025:** Pivot to 8-layer AI Career Agent
- Focus: Job search agent that manages entire pipeline
- Architecture: Orchestrated system with state management
- Documents migrated to `legacy/`

---

## FAQ

**Q: Can I use old CPA docs for Layer 2 implementation?**
A: Yes! The CPA analysis layers (skills gap, tools gap, experience gap, seniority, industry) are still conceptually valid. Extract what you need, but reframe it as "Strategy Engine" called by Orchestrator.

**Q: Are old Rewrite Engine specs still valid?**
A: Mostly yes. The rewrite logic (micro-action sequencer, no fabrication rules, verb strengthening) is still correct. Integration points changed - now called by Orchestrator via Layer 3.

**Q: Why is Coach now "just an interface"?**
A: Decision-making moved to Orchestrator (Layer 5). Coach (Layer 8) explains those decisions in human language. This separates concerns: logic vs communication.

**Q: Do I need to read ALL legacy docs?**
A: No. Start with current architecture docs. Reference legacy only when you need implementation details for your specific layer.

**Q: What if I find conflicts between old and new docs?**
A: Always prioritize Agent v2 docs. Legacy docs are for reference and reusable implementation details only.

---

## Contributing to Migration

As we build each layer, we'll create detailed layer specs by:

1. Reading relevant legacy docs
2. Extracting reusable concepts and implementation details
3. Reframing for agent architecture
4. Creating new layer spec document
5. Moving fully-replaced legacy docs to archive

**Process is incremental** - we migrate content when we actually implement that layer, not all upfront.

---

## Status Tracker

| Layer | Spec Status | Implementation | Notes |
|-------|-------------|----------------|-------|
| Layer 1 (Evaluation) | 🟡 Pending | Not started | Use legacy scoring specs as reference |
| Layer 2 (Strategy) | ✅ Initial | Not started | Skeleton created, needs expansion |
| Layer 3 (Execution) | 🟡 Pending | Not started | Use legacy rewrite specs as reference |
| Layer 4 (State) | 🟡 Pending | Not started | Defined in data model |
| Layer 5 (Orchestrator) | 🟡 Pending | Not started | Core logic in architecture doc |
| Layer 6 (Job Discovery) | 🟡 Pending | Not started | Query generation + scoring |
| Layer 7 (Learning) | 🔴 v2 Feature | Not started | Post-MVP |
| Layer 8 (Coach) | ✅ Complete | Not started | Full spec written |

---

**Last Updated:** December 7, 2025
**Maintained By:** Dayax (Founder) + Claude (CTO) + ChatGPT (Technical Advisor)
**Next Review:** Week 3 (Dec 21, 2025)
