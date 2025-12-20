# ResumeIQ Agent - Layer Specifications

This directory contains the detailed specifications for all layers of the ResumeIQ AI Career Agent.

## Layer Overview

| Layer | Spec File | Version | Status |
|-------|-----------|---------|--------|
| Layer 1: Evaluation Engine | `Layer_1_Evaluation_Engine_v2.1.md` | v2.1 | ✅ Complete |
| Layer 2: Strategy Engine | `Layer_2_Strategy_Engine_v2.1.md` | v2.1 | ✅ Complete |
| Layer 3: Execution Engine | `Layer_3_Execution_Engine_v2.2.md` | v2.2 | ✅ Complete |
| Layer 4: Memory & State | `Layer_4_State_v1.1.md` | v1.1 | ✅ Complete |
| Layer 5: Orchestrator | `Layer_5_Orchestrator_v1.0.md` | v1.0 | ✅ Complete |
| Layer 6: Job Discovery | `Layer_6_JobDiscovery_v1.1.md` | v1.1 | ✅ Complete |
| Layer 7: Learning Engine | `Layer_7_Learning_v2.0.md` | v2.0 | ✅ Complete |
| Layer 8: AI Coach Interface | - | - | 🔴 Pending |

## Architecture Documents

Related architecture documents (in parent directory):
- Agent Architecture Overview
- Migration Guide
- Data Model Specification
- MVP Roadmap

## Configuration Files

See `docs/architecture/agent/configs/` for layer-specific configuration schemas:
- `layer2_strategy_config_v2.1.json` - Strategy Engine configuration
- `layer3_execution_config_v2.2.json` - Execution Engine configuration

## Reviews & Verification

See `docs/architecture/agent/reviews/` for layer verification reports and architecture reviews (when available).

## Layer Descriptions

### Layer 1: Evaluation Engine
Analyzes resumes and job descriptions to identify strengths, gaps, and improvement opportunities.

### Layer 2: Strategy Engine
Generates strategic recommendations and action plans based on evaluation results.

### Layer 3: Execution Engine
Implements tactical improvements including content generation, formatting, and optimization.

### Layer 4: Memory & State
Manages user profiles, conversation history, and persistent state across sessions.

### Layer 5: Orchestrator
Coordinates between layers and manages workflow execution.

### Layer 6: Job Discovery
Handles job search, matching, and application tracking functionality.

### Layer 7: Learning Engine
Learns from user interactions and outcomes to improve recommendations over time.

### Layer 8: AI Coach Interface
Provides conversational interface for user interactions and coaching.

---

**Last Updated:** December 20, 2024
**Maintained By:** Dayax (CEO) + Claude (CTO)
