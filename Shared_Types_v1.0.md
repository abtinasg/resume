# Shared Types Specification
## Cross-Layer Type Definitions v1.0

**Version:** 1.0
**Last Updated:** December 16, 2025
**Purpose:** Shared enums and types used across multiple layers

---

## 1. Strategy Modes

```typescript
/**
 * Strategy modes for career agent
 * Used by: Layer 2, Layer 4, Layer 5
 */
export enum StrategyMode {
  IMPROVE_RESUME_FIRST = "IMPROVE_RESUME_FIRST",
  APPLY_MODE = "APPLY_MODE",
  RETHINK_TARGETS = "RETHINK_TARGETS"
}

export type StrategyModeString = keyof typeof StrategyMode;
```

---

## 2. Event Types

```typescript
/**
 * Event types for state logging
 * Defined by: Layer 4
 * Used by: Layer 4, Layer 5
 */
export enum EventType {
  // Resume events
  RESUME_UPLOADED = "resume_uploaded",
  RESUME_EDITED = "resume_edited",
  RESUME_SCORED = "resume_scored",
  RESUME_REWRITE_APPLIED = "resume_rewrite_applied",

  // Application events
  APPLICATION_CREATED = "application_created",
  APPLICATION_SUBMITTED = "application_submitted",
  APPLICATION_STATUS_CHANGED = "application_status_changed",
  APPLICATION_OUTCOME_REPORTED = "application_outcome_reported",
  FOLLOW_UP_SENT = "follow_up_sent",

  // Strategy events
  STRATEGY_MODE_CHANGED = "strategy_mode_changed",
  WEEKLY_TARGET_MET = "weekly_target_met",
  WEEKLY_TARGET_MISSED = "weekly_target_missed",

  // System events
  STATE_WENT_STALE = "state_went_stale",
  STATE_REFRESHED = "state_refreshed",

  // Planning events
  WEEKLY_PLAN_GENERATED = "weekly_plan_generated",
  DAILY_PLAN_GENERATED = "daily_plan_generated",
  TASK_COMPLETED = "task_completed",
  TASK_FAILED = "task_failed",
  TASK_SKIPPED = "task_skipped",
  PLAN_DEVIATION = "plan_deviation",

  // Milestones
  FIRST_APPLICATION = "first_application",
  FIRST_INTERVIEW = "first_interview",
  FIRST_OFFER = "first_offer"
}
```

---

## 3. Action Types

```typescript
/**
 * Action types for orchestrator
 * Defined by: Layer 5
 * Used by: Layer 2 (ActionBlueprint), Layer 5
 */
export enum ActionType {
  IMPROVE_RESUME = "improve_resume",
  APPLY_TO_JOB = "apply_to_job",
  FOLLOW_UP = "follow_up",
  UPDATE_TARGETS = "update_targets",
  COLLECT_MISSING_INFO = "collect_missing_info",
  REFRESH_STATE = "refresh_state"
}
```

---

## 4. Seniority Levels

```typescript
/**
 * Seniority levels
 * Used by: Layer 1, Layer 2, Layer 4, Layer 5
 */
export enum SeniorityLevel {
  ENTRY = "entry",
  MID = "mid",
  SENIOR = "senior",
  LEAD = "lead"
}
```

---

## 5. Focus Areas

```typescript
/**
 * Focus areas for daily planning
 * Used by: Layer 5
 */
export enum FocusArea {
  APPLICATIONS = "applications",
  RESUME_IMPROVEMENT = "resume_improvement",
  FOLLOW_UPS = "follow_ups",
  STRATEGY = "strategy"
}
```

---

## 6. Application Status

```typescript
/**
 * Application pipeline status
 * Used by: Layer 4, Layer 5
 */
export enum ApplicationStatus {
  DRAFT = "draft",
  SUBMITTED = "submitted",
  NO_RESPONSE = "no_response",
  INTERVIEW_SCHEDULED = "interview_scheduled",
  REJECTED = "rejected",
  OFFER = "offer"
}
```

---

## 7. Rewrite Types

```typescript
/**
 * Types of resume rewrites
 * Used by: Layer 3, Layer 4, Layer 5
 */
export enum RewriteType {
  BULLET = "bullet",
  SUMMARY = "summary",
  SECTION = "section"
}
```

---

## Usage Guidelines

1. **Import from shared types:**
   ```typescript
   import { StrategyMode, EventType, ActionType } from '@/shared/types';
   ```

2. **Always use enum constants:**
   ```typescript
   // ✅ Correct
   const mode = StrategyMode.APPLY_MODE;

   // ❌ Wrong
   const mode = "APPLY_MODE";
   ```

3. **Type checking:**
   ```typescript
   function isValidMode(mode: string): mode is StrategyMode {
     return Object.values(StrategyMode).includes(mode as StrategyMode);
   }
   ```

---

**END OF SHARED TYPES**
