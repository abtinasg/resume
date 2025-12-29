/**
 * 8-Layer AI Career Agent Architecture
 * Main Export Module
 *
 * This module provides the foundation for the incremental migration
 * of the ResumeIQ application to the 8-layer architecture.
 *
 * Layers:
 * - Layer 1: Evaluation Engine (Scoring) ✅ IMPLEMENTED
 * - Layer 2: Strategy Engine (Career Path Analyzer) ✅ IMPLEMENTED
 * - Layer 3: Execution Engine (Rewrite Engine) ✅ IMPLEMENTED
 * - Layer 4: State & Pipeline (Memory) ✅ IMPLEMENTED
 * - Layer 5: Orchestrator (Planning) ✅ IMPLEMENTED
 * - Layer 6: Job Discovery & Matching ✅ IMPLEMENTED
 * - Layer 7: Learning & Optimization ✅ IMPLEMENTED
 * - Layer 8: AI Coach Interface ✅ IMPLEMENTED
 *
 * Migration Status:
 * - Shared types: ✅ Implemented
 * - Layer 1 (Evaluation): ✅ Implemented
 * - Layer 2 (Strategy): ✅ Implemented
 * - Layer 3 (Execution): ✅ Implemented
 * - Layer 4 (State): ✅ Implemented (uses existing Prisma models)
 * - Layer 5 (Orchestrator): ✅ Implemented (THE BRAIN!)
 * - Layer 6 (Job Discovery): ✅ Implemented
 * - Layer 7 (Learning): ✅ Implemented (Foundation)
 * - Layer 8 (AI Coach): ✅ Implemented (Template-based)
 */

// Shared types and utilities
export * from './shared';

// Layer 1 - Evaluation Engine (implemented)
export * as Layer1 from './layer1';

// Layer 2 - Strategy Engine (implemented)
export * as Layer2 from './layer2';

// Layer 3 - Execution Engine (implemented)
export * as Layer3 from './layer3';

// Layer 4 - State & Pipeline (implemented)
export * as Layer4 from './layer4';

// Layer 5 - Orchestrator (implemented - THE BRAIN!)
export * as Layer5 from './layer5';

// Layer 6 - Job Discovery & Matching (implemented)
export * as Layer6 from './layer6';

// Layer 7 - Learning & Optimization (implemented)
export * as Layer7 from './layer7';

// Layer 8 - AI Coach Interface (implemented)
export * as Layer8 from './layer8';
