# Layer 4 – Memory & State Engine
## Complete Specification v1.2

**Version:** 1.2 (P0 fixes for Layer 5 integration)
**Status:** 100/100 Ready - All P0 integration fixes applied
**Last Updated:** December 15, 2025
**Scope:** System of record for user job search state + event memory for learning

**Changelog v1.0 → v1.1:**
- Fixed EventType inconsistency (P0) - Now uses enum constants throughout, not string literals
- Fixed staleness severity precedence (P0) - Critical severity now takes precedence over warnings
- Aligned min_days_in_mode with Layer 2 (P1) - Fetched from Layer 2 config (default: 5 days)
- Clarified weekly_target range and validation (P1) - Range 0..50 with mode-dependent validation
- Defined interview_requests calculation (P1) - Clear logic for counting interview requests
- Fixed missing ACTION_ON_STALE_STATE event (P1) - Now uses EventType.STATE_WENT_STALE with context
- Added data retention policy (P2) - Complete archival and retention strategy

**Changelog v1.1 → v1.2:**
- Added staleness_severity to Layer 5 contract (P0-1)
- Added weeklyAppTarget to Layer 5 contract (P0-1)
- Added planning EventTypes: WEEKLY_PLAN_GENERATED, DAILY_PLAN_GENERATED, TASK_COMPLETED, TASK_FAILED, TASK_SKIPPED, PLAN_DEVIATION (P0-3)
- Added applyRewriteWithScoring() method for accurate scoring pipeline (P0-4)
- Updated provenance logging to include actual vs estimated score gains

---

## Document Purpose

Single source of truth for Layer 4 Memory & State Engine development.

**Part I:** Core Specification - ready to implement  
**Part II:** Advanced Features - future roadmap

---

# PART I: CORE SPECIFICATION

## 0. Purpose & Role

Layer 4 is the **System of Record** for all user job search state and the **Event Memory** foundation for learning and optimization.

**Primary functions:**
- Maintain complete, consistent user state (profile, applications, strategy history)
- Provide standardized state snapshots to Layer 2 (Strategy) and Layer 5 (Orchestrator)
- Log all significant interactions for audit trail and future learning (Layer 7)
- Detect staleness and enforce data consistency

**Key innovation:** Proof-first state management with full provenance tracking for trust and learning.

**Non-responsibilities:**
- Does NOT make decisions (Layer 5 Orchestrator decides)
- Does NOT analyze strategy (Layer 2 does)
- Does NOT execute actions (Layer 3 does)
- Does NOT present to user (Layer 8 does)

---

## 1. Design Principles

**Single Source of Truth**
- Stored values are authoritative for base data
- Computed values are authoritative for derived metrics
- Clear rules prevent conflicts and duplication

**Transactional Consistency**
- Multi-entity updates MUST be in transactions
- Optimistic locking prevents lost updates
- Event ordering guaranteed per user

**Event-Driven Audit Trail**
- Every significant state change MUST be logged
- Events include provenance (evidence, validation results)
- Foundation for Layer 7 learning

**Performance by Design**
- Read-heavy workload (90% reads, 10% writes)
- State snapshots cached with TTL
- Query optimization via strategic indexes

**Graceful Staleness Handling**
- Stale state detected automatically
- System continues operating with warnings
- User prompted to update when critical

---

## 2. Data Model Reference

**Core Entities:**
```
User (account)
├── UserProfile (1:1) - preferences, targets, current strategy
├── ResumeVersion[] (1:many) - resume history with scores
├── Application[] (1:many) - job applications pipeline
├── InteractionEvent[] (1:many) - audit log
└── StrategyHistory[] (1:many) - strategy mode transitions

Application
├── JobPosting (many:1) - job details
└── ResumeVersion (many:1) - which resume used
```

**Database Schema:** See `prisma/schema.prisma` and `docs/data_model_v1.md`

---

## 3. Output Contracts (CRITICAL - Must Match Other Layers)

### 3.1 Contract for Layer 2 (Strategy Engine)

**MUST match Layer 2 input spec exactly!**

```ts
interface Layer4StateForLayer2 {
  pipeline_state: {
    total_applications: number;
    applications_last_7_days: number;
    applications_last_30_days: number;
    
    interview_requests: number;
    interview_rate: number;              // 0..1 (CRITICAL: must be decimal)
    
    offers: number;
    rejections: number;
  };

  user_profile: {
    target_roles: string[];
    target_seniority?: "entry" | "mid" | "senior" | "lead";
    years_experience?: number;

    // NEW - CRITICAL!
    weeklyAppTarget?: number;  // 0..50 (user's weekly application target)

    preferences?: {
      work_arrangement?: string[];       // e.g., ["remote", "hybrid"]
      locations?: string[];               // e.g., ["Berlin", "Remote EU"]
      salary_minimum?: number;            // e.g., 80000
      excluded_industries?: string[];     // e.g., ["gambling", "tobacco"]
    };
  };

  current_strategy_mode?: "IMPROVE_RESUME_FIRST" | "APPLY_MODE" | "RETHINK_TARGETS" | null;
  
  strategy_history?: Array<{
    from: "IMPROVE_RESUME_FIRST" | "APPLY_MODE" | "RETHINK_TARGETS";
    to: "IMPROVE_RESUME_FIRST" | "APPLY_MODE" | "RETHINK_TARGETS";
    changed_at: string;                  // ISO 8601
    reason: string;
  }>;
}
```

**Critical Notes:**
- `interview_rate` MUST be 0..1 decimal, NOT percentage
- `strategy_history` MUST be sorted by `changed_at` (newest first)
- Field names MUST match exactly (Layer 2 expects these names)

**Definition of interview_requests:**

An application counts as an "interview request" if ANY of these are true:
1. `status = "interview_scheduled"`, OR
2. `status = "offer"`, OR
3. `outcome = "interview"`, OR
4. `outcome = "offer"`

**Why this logic:**
- `status` reflects current state (may get interview later)
- `outcome` reflects final result (may have had interview)
- We count both to avoid undercounting

**Implementation:**

```typescript
async function countInterviewRequests(userId: string): Promise<number> {
  const count = await prisma.application.count({
    where: {
      userId,
      OR: [
        { status: { in: ["interview_scheduled", "offer"] } },
        { outcome: { in: ["interview", "offer"] } }
      ]
    }
  });

  return count;
}

async function calculateInterviewRate(userId: string): Promise<number> {
  const total = await prisma.application.count({ where: { userId } });

  if (total === 0) return 0;

  const interviews = await countInterviewRequests(userId);

  // Return as decimal 0..1 (NOT percentage)
  return interviews / total;
}
```

---

### 3.2 Contract for Layer 5 (Orchestrator)

**Extended state with freshness and action items:**

```ts
interface Layer4StateForLayer5 extends Layer4StateForLayer2 {
  // Resume info
  resume: {
    master_resume_id?: string;
    resume_score?: number;               // 0..100
    last_resume_update?: string;         // ISO 8601
    improvement_areas?: string[];
  };

  // Freshness detection
  freshness: {
    last_resume_update?: string;         // ISO 8601
    last_application?: string;           // ISO 8601
    last_user_interaction?: string;      // ISO 8601

    is_stale: boolean;
    staleness_reason?: string;           // Human-readable explanation
    staleness_severity: "none" | "warning" | "critical";  // NEW - CRITICAL!
  };

  // Action items
  followups: {
    applications_needing_followup: Array<{
      application_id: string;
      job_title: string;
      company: string;
      applied_at: string;                // ISO 8601
      days_since_application: number;
      follow_up_count: number;
      last_follow_up?: string;           // ISO 8601
      suggested_action: "FOLLOW_UP" | "DO_NOT_FOLLOW_UP";
      reason: string;
    }>;
  };

  // Versioning for cache/concurrency
  state_version: number;
  computed_at: string;                   // ISO 8601 timestamp
}
```

---

## 4. Source of Truth Rules

**Clear separation prevents conflicts and duplication.**

### 4.1 Stored = Truth

These values are ONLY written by explicit commands. NEVER recompute.

```ts
// Set by Layer 1 (Evaluation Engine)
ResumeVersion.overallScore: number        // 0..100
ResumeVersion.componentScores: JSON       // {content, ats, format, impact}

// Set by user or Layer 5
UserProfile.weeklyAppTarget: number       // 0..50
// 0 = paused (valid in IMPROVE_RESUME_FIRST mode)
// 1-50 = active target
UserProfile.currentStrategyMode: string   // Strategy mode

// Set by Layer 5 or user
Application.status: string                // Status in pipeline
Application.outcome: string               // Final outcome
```

**Rule:** Once stored, these are the truth. Other layers read them, never recompute.

---

### 4.2 Computed = Truth

These values are ALWAYS computed fresh from stored data. NEVER store.

```ts
// Always compute from Applications
interview_rate: number                    // interviews / total_applications
applications_this_week: number            // Count where appliedAt in last 7 days
applications_this_month: number           // Count where appliedAt in last 30 days

// Always compute from timestamps
is_stale: boolean                         // Based on freshness rules
days_since_application: number            // now - appliedAt
```

**Rule:** Compute on every read. Ensures data always reflects current reality.

---

### 4.3 Hybrid (Cached with TTL)

These values are computed but cached for performance.

```ts
// Cache for 5 minutes
UserState: Layer4StateForLayer5           // Full state snapshot

// Cache key format
cache_key = `user_state:{userId}:{state_version}`

// Invalidation triggers
- Any Application update → invalidate
- Any ResumeVersion update → invalidate
- Any UserProfile update → invalidate
- Any StrategyHistory change → invalidate
```

**Rule:** Check cache first. If miss or expired, recompute and cache.

---

## 5. Freshness Detection (Staleness Algorithm)

**Purpose:** Detect when user state is outdated and system should prompt for updates.

### 5.1 Freshness Metadata

```ts
interface FreshnessMetadata {
  last_resume_update?: Date;
  last_application?: Date;
  last_user_interaction?: Date;
  
  is_stale: boolean;
  staleness_reason?: string;
  staleness_severity: "none" | "warning" | "critical";
}
```

### 5.2 Staleness Rules

```python
def detect_staleness(user_state) -> FreshnessMetadata:
    """
    Detect staleness with proper severity precedence.
    Critical severity takes precedence over warnings.
    """
    now = datetime.now()

    last_resume = user_state.resume.last_resume_update
    last_app = user_state.pipeline_state.last_application
    last_interaction = user_state.last_user_interaction

    # Collect all staleness issues
    issues = []

    # Rule 1: No interaction in 14 days
    if last_interaction and (now - last_interaction).days > 14:
        issues.append({
            "is_stale": True,
            "reason": "No activity in 14 days",
            "severity": "warning"
        })

    # Rule 2: In APPLY_MODE but no application in 30 days (CRITICAL)
    if user_state.current_strategy_mode == "APPLY_MODE":
        if not last_app or (now - last_app).days > 30:
            issues.append({
                "is_stale": True,
                "reason": "No applications in 30 days while in APPLY_MODE",
                "severity": "critical"
            })

    # Rule 3: Resume not updated in 90 days
    if last_resume and (now - last_resume).days > 90:
        issues.append({
            "is_stale": True,
            "reason": "Resume not updated in 90 days",
            "severity": "warning"
        })

    # Return highest severity issue
    if not issues:
        return FreshnessMetadata(
            is_stale=False,
            staleness_severity="none"
        )

    # Sort by severity: critical > warning
    severity_order = {"critical": 0, "warning": 1}
    issues.sort(key=lambda x: severity_order[x["severity"]])

    highest = issues[0]

    return FreshnessMetadata(
        is_stale=True,
        staleness_reason=highest["reason"],
        staleness_severity=highest["severity"]
    )
```

### 5.3 System Behavior When Stale

```python
# Reads: Always allowed (never block UI)
state = await getState(userId)  # Always succeeds

# Writes: Allowed but logged
if state.freshness.is_stale:
    await logEvent({
        type: EventType.STATE_WENT_STALE,
        context: {
            severity: state.freshness.staleness_severity,
            action_attempted: action_name,
            staleness_reason: state.freshness.staleness_reason
        }
    })

# Auto-actions: Require confirmation if stale
if state.freshness.staleness_severity == "critical":
    # Block automatic strategy mode changes
    # Require user confirmation for plan execution
    return {
        action: "blocked",
        reason: state.freshness.staleness_reason,
        requires_user_confirmation: true
    }
```

---

## 6. Concurrency & Consistency

### 6.1 Transaction Boundaries

**Rule:** Any command that modifies multiple entities MUST use transaction.

```typescript
// Example: Change strategy mode (touches UserProfile + StrategyHistory + InteractionEvent)
async function changeStrategyMode(
  userId: string,
  newMode: StrategyMode,
  reason: string
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    // 1. Get current state
    const profile = await tx.userProfile.findUnique({
      where: { userId }
    });
    
    // 2. Deactivate current mode in StrategyHistory
    await tx.strategyHistory.updateMany({
      where: {
        userId,
        deactivatedAt: null
      },
      data: {
        deactivatedAt: new Date(),
        metricsAtEnd: await computeMetrics(userId) // Snapshot
      }
    });
    
    // 3. Create new StrategyHistory record
    await tx.strategyHistory.create({
      data: {
        userId,
        strategyMode: newMode,
        activatedAt: new Date(),
        reason,
        metricsAtStart: await computeMetrics(userId)
      }
    });
    
    // 4. Update UserProfile
    await tx.userProfile.update({
      where: { userId },
      data: { currentStrategyMode: newMode }
    });
    
    // 5. Log event
    await tx.interactionEvent.create({
      data: {
        userId,
        eventType: EventType.STRATEGY_MODE_CHANGED,
        timestamp: new Date(),
        context: {
          from: profile.currentStrategyMode,
          to: newMode,
          reason
        }
      }
    });
  });
}
```

---

### 6.2 Optimistic Locking

**Use `state_version` or `updatedAt` for concurrent update detection:**

```typescript
async function updateApplicationStatus(
  applicationId: string,
  newStatus: ApplicationStatus,
  expectedVersion: number
): Promise<void> {
  const result = await prisma.application.updateMany({
    where: {
      id: applicationId,
      // Optimistic lock: only update if version matches
      version: expectedVersion
    },
    data: {
      status: newStatus,
      version: expectedVersion + 1,
      updatedAt: new Date()
    }
  });
  
  if (result.count === 0) {
    throw new ConcurrentModificationError(
      `Application ${applicationId} was modified by another process`
    );
  }
}
```

---

### 6.3 Event Ordering Guarantee

**Per-user events MUST be sequential:**

```python
# Option 1: Database-level sequence (Postgres)
ALTER TABLE InteractionEvent ADD COLUMN sequence_number SERIAL;
CREATE INDEX idx_events_user_sequence ON InteractionEvent(userId, sequence_number);

# Option 2: Application-level locking
async def logEvent(userId, event):
    async with user_event_lock(userId):
        last_seq = await getLastEventSequence(userId)
        await insertEvent({
            ...event,
            sequence_number: last_seq + 1
        })
```

---

## 7. Strategy Mode Transitions (Atomic Command)

**CRITICAL:** This is the ONLY way to change strategy mode. Enforces consistency.

### 7.1 Command Interface

```typescript
interface ChangeStrategyModeCommand {
  userId: string;
  newMode: "IMPROVE_RESUME_FIRST" | "APPLY_MODE" | "RETHINK_TARGETS";
  reason: string;
  triggeredBy: "user" | "orchestrator" | "layer2";
}

async function changeStrategyMode(cmd: ChangeStrategyModeCommand): Promise<void>
```

### 7.2 Enforcement Rules

```python
async def changeStrategyMode(cmd):
    # Get current state
    state = await getUserState(cmd.userId)

    # Rule 1: Check min_days_in_mode (from Layer 2)
    if state.current_strategy_mode:
        history = await getActiveStrategyHistory(cmd.userId)
        days_in_mode = (now() - history.activatedAt).days

        # Get min_days_in_mode from Layer 2 config (default: 5)
        min_days = await getLayer2Config("min_days_in_mode") or 5

        if days_in_mode < min_days:
            raise ValidationError(
                f"Cannot switch modes. Must stay in {state.current_strategy_mode} "
                f"for at least {min_days} days. "
                f"Currently: {days_in_mode} days."
            )

    # Rule 2: Prevent flip-flop (same mode back-to-back)
    recent_modes = await getRecentModeChanges(cmd.userId, limit=2)
    if len(recent_modes) >= 2:
        if recent_modes[0].mode == cmd.newMode:
            raise ValidationError(
                f"Cannot switch back to {cmd.newMode}. "
                "This creates flip-flop pattern."
            )

    # Rule 3: Transaction (see Section 6.1)
    await executeTransaction(
        deactivateCurrentMode,
        createNewModeHistory,
        updateUserProfile,
        logEvent
    )
```

**Note:** `min_days_in_mode` is owned by Layer 2 (Strategy Engine).
Layer 4 enforces it but does NOT define it.
Default value: 5 days (from Layer 2 StrategyThresholds).

### 7.3 Integration with Layer 2

Layer 2 determines WHEN to change mode. Layer 4 enforces HOW.

```python
# Layer 2 calls this after analysis
recommendation = layer2.determineStrategyMode(userId)

if recommendation.should_switch:
    try:
        await layer4.changeStrategyMode({
            userId,
            newMode: recommendation.new_mode,
            reason: recommendation.reason,
            triggeredBy: "layer2"
        })
    except ValidationError as e:
        # Layer 4 rejected (e.g., min_days_in_mode not met)
        # Layer 2 backs off, tries again later
        logger.info(f"Mode change rejected: {e}")
```

---

## 8. Validation Rules & Constraints

**Prevent invalid data from entering system.**

### 8.1 Field Constraints

```typescript
const CONSTRAINTS = {
  resume_score: { min: 0, max: 100 },
  weekly_target: { min: 0, max: 50 },
  follow_up_count: { min: 0, max: 2 },
  staleness_threshold_days: 30
  // NOTE: min_days_in_mode is NOT defined here
  // It comes from Layer 2 StrategyThresholds (default: 5)
};

function validateResumeScore(score: number): void {
  if (score < 0 || score > 100) {
    throw new ValidationError(
      `Resume score must be 0-100. Got: ${score}`
    );
  }
}

function validateWeeklyTarget(target: number): void {
  if (target < 0 || target > 50) {
    throw new ValidationError(
      `Weekly target must be 0-50. Got: ${target}`
    );
  }
}
```

---

### 8.2 Status Transition Rules

**Application status must follow valid transitions:**

```typescript
const VALID_STATUS_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  "draft": ["submitted"],
  "submitted": ["no_response", "interview_scheduled", "rejected"],
  "no_response": ["interview_scheduled", "ghosted"],
  "interview_scheduled": ["offer", "rejected"],
  "offer": [],  // Terminal state
  "rejected": [],  // Terminal state
  "ghosted": []  // Terminal state
};

function validateStatusTransition(
  from: ApplicationStatus,
  to: ApplicationStatus
): void {
  const validNext = VALID_STATUS_TRANSITIONS[from] || [];
  
  if (!validNext.includes(to)) {
    throw new ValidationError(
      `Invalid status transition: ${from} → ${to}. ` +
      `Valid transitions from ${from}: ${validNext.join(", ")}`
    );
  }
}

// Usage
async function updateApplicationStatus(id, newStatus) {
  const app = await getApplication(id);
  validateStatusTransition(app.status, newStatus);
  
  await prisma.application.update({
    where: { id },
    data: { status: newStatus }
  });
}
```

---

### 8.3 Business Rules

```typescript
// Rule: Only one master resume per user
async function setMasterResume(userId: string, resumeId: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    // Unset all other master resumes
    await tx.resumeVersion.updateMany({
      where: { userId },
      data: { isMaster: false }
    });

    // Set new master
    await tx.resumeVersion.update({
      where: { id: resumeId },
      data: { isMaster: true }
    });
  });
}

// Rule: Only one active strategy mode per user
// (Enforced by changeStrategyMode transaction)

// Rule: Weekly target validation depends on mode
async function validateWeeklyTarget(
  userId: string,
  target: number,
  mode: StrategyMode
): Promise<void> {
  if (target < 0 || target > 50) {
    throw new ValidationError(
      `Weekly target must be 0-50. Got: ${target}`
    );
  }

  // In APPLY_MODE, target must be at least 1
  if (mode === "APPLY_MODE" && target < 1) {
    throw new ValidationError(
      "Weekly target must be at least 1 in APPLY_MODE"
    );
  }

  // In IMPROVE_RESUME_FIRST, target can be 0 (paused applications)
}

// Rule: Follow-up count ≤ 2
async function recordFollowUp(applicationId: string): Promise<void> {
  const app = await getApplication(applicationId);

  if (app.followUpCount >= 2) {
    throw new ValidationError(
      `Maximum follow-ups (2) reached for application ${applicationId}`
    );
  }

  await prisma.application.update({
    where: { id: applicationId },
    data: {
      followUpCount: app.followUpCount + 1,
      lastFollowUp: new Date()
    }
  });
}
```

---

## 9. Event Taxonomy & Provenance Tracking

**Foundation for trust, audit, and learning.**

### 9.1 Event Types

```typescript
enum EventType {
  // Resume events
  RESUME_UPLOADED = "resume_uploaded",
  RESUME_EDITED = "resume_edited",
  RESUME_SCORED = "resume_scored",
  RESUME_REWRITE_APPLIED = "resume_rewrite_applied",  // CRITICAL: includes provenance

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

  // Planning events (NEW - for Layer 5)
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

**CRITICAL:** Always use enum constants, never string literals:
✅ Correct: `eventType: EventType.STRATEGY_MODE_CHANGED`
❌ Wrong: `eventType: "STRATEGY_MODE_CHANGED"`

This ensures consistency across the system and prevents query bugs.

---

### 9.2 Event Context Schemas

```typescript
// RESUME_REWRITE_APPLIED - includes full provenance
interface RewriteAppliedContext {
  resume_version_id: string;
  rewrite_type: "bullet" | "summary" | "section";
  
  // Provenance from Layer 3
  original_text: string;  // or hash for privacy
  improved_text: string;
  
  evidence_map: Array<{
    improved_span: string;
    evidence_ids: string[];
  }>;
  
  validation: {
    passed: boolean;
    items: Array<{
      code: string;
      severity: string;
      message: string;
    }>;
  };
  
  estimated_score_gain: number;
  changes: {
    stronger_verb: boolean;
    added_metric: boolean;
    more_specific: boolean;
    removed_fluff: boolean;
    tailored_to_role: boolean;
  };
}

// STRATEGY_MODE_CHANGED
interface StrategyModeChangedContext {
  from: StrategyMode;
  to: StrategyMode;
  reason: string;
  triggered_by: "user" | "orchestrator" | "layer2";
  metrics_at_change: {
    resume_score: number;
    total_applications: number;
    interview_rate: number;
  };
}

// APPLICATION_OUTCOME_REPORTED
interface OutcomeReportedContext {
  application_id: string;
  outcome: "interview" | "offer" | "rejected" | "ghosted";
  days_to_outcome: number;
  strategy_mode_at_apply: StrategyMode;
  resume_score_at_apply: number;
}

// WEEKLY_PLAN_GENERATED
interface WeeklyPlanGeneratedContext {
  plan_id: string;
  week_start: string;  // ISO date
  strategy_mode: StrategyMode;
  target_applications: number;
  task_count: number;
  input_state_version: number;
}

// DAILY_PLAN_GENERATED
interface DailyPlanGeneratedContext {
  plan_id: string;
  date: string;  // ISO date
  focus_area: FocusArea;
  task_count: number;
  total_estimated_minutes: number;
  generated_from_weekly_plan_id?: string;
}

// TASK_COMPLETED
interface TaskCompletedContext {
  task_id: string;
  action_type: ActionType;
  result: "success" | "partial" | "failed";
  actual_time_minutes?: number;
  evidence?: any;  // Action-specific results
}

// TASK_FAILED
interface TaskFailedContext {
  task_id: string;
  action_type: ActionType;
  error: string;
  fallback_suggested?: string;
}

// TASK_SKIPPED
interface TaskSkippedContext {
  task_id: string;
  action_type: ActionType;
  reason: string;  // Why user skipped
}

// PLAN_DEVIATION
interface PlanDeviationContext {
  expected_mode: StrategyMode;
  user_action: ActionType;
  reason: string;
  severity: "minor" | "significant";
}
```

---

### 9.3 Logging Best Practices

```typescript
// DO log:
- User actions (submit, follow-up, edit)
- Strategy changes (automatic or manual)
- Major milestones (first interview, offer)
- LLM outputs with provenance (rewrites, suggestions)
- Validation failures (for debugging)

// DO NOT log:
- Internal queries (getUserState calls)
- Cache hits/misses
- Page views (use analytics service instead)
- Sensitive PII (password hashes, full resume text if avoidable)
```

### 9.4 Provenance = Competitive Moat

**Key Innovation:** Every AI-generated change includes full evidence trail.

```typescript
// When Layer 3 applies a rewrite, Layer 4 MUST log full context
async function applyRewrite(userId, rewriteResult) {
  // Call Layer 1 to get accurate score
  const score = await Layer1.evaluate({
    content: rewriteResult.improved,
    metadata: {
      rewrite_applied: true,
      original_score: getCurrentScore(userId)
    }
  });

  // Create new version with actual score
  const newVersion = await createResumeVersion({
    userId,
    content: rewriteResult.improved,
    overallScore: score.overall_score,  // From Layer 1
    componentScores: score.component_scores
  });

  // CRITICAL: Log with full provenance
  await logEvent({
    userId,
    eventType: EventType.RESUME_REWRITE_APPLIED,
    context: {
      resume_version_id: newVersion.id,
      rewrite_type: rewriteResult.type,
      original_text: hash(rewriteResult.original),
      improved_text: hash(rewriteResult.improved),
      evidence_map: rewriteResult.evidence_map,
      validation: rewriteResult.validation,
      estimated_score_gain: rewriteResult.estimated_score_gain,
      actual_score_gain: score.overall_score - getCurrentScore(userId)  // Actual!
    }
  });
}
```

**Why this matters:**
- Users can see WHY each change was made (trust)
- System can learn WHICH changes work (Layer 7)
- Auditors can verify NO fabrication occurred (compliance)
- This is the foundation for "Proof-first Career Agent" positioning

---

## 10. Performance & Caching Strategy

### 10.1 Performance Targets

**Latency (p95):**
- `getUserState()`: <200ms
- `getApplicationsNeedingFollowUp()`: <500ms
- `calculateInterviewRate()`: <100ms
- `changeStrategyMode()`: <1s (includes transaction)

**Throughput:**
- Support 10,000 concurrent users
- Support 100 applications per user
- Support 1,000 events per user per month

---

### 10.2 Caching Architecture

```typescript
// UserState snapshot with materialized view pattern
interface UserStateSnapshot {
  userId: string;
  state_version: number;
  computed_at: Date;
  ttl_seconds: number;
  data: Layer4StateForLayer5;
}

// Cache invalidation triggers
function invalidateUserStateCache(userId: string): void {
  cache.delete(`user_state:${userId}:*`);
}

// Automatic invalidation on writes
await prisma.application.update({...});
invalidateUserStateCache(userId);  // Trigger invalidation
```

**Cache strategy:**
- **UserState:** 5-minute TTL, invalidate on any write
- **Master Resume:** 1-hour TTL, invalidate on resume update
- **Application counts:** 1-minute TTL, invalidate on application update

---

### 10.3 Query Optimization

**Required indexes:**

```sql
-- User lookups
CREATE INDEX idx_users_email ON User(email);

-- Application queries
CREATE INDEX idx_applications_user_status ON Application(userId, status);
CREATE INDEX idx_applications_user_applied ON Application(userId, appliedAt DESC);
CREATE INDEX idx_applications_user_followup ON Application(userId, lastFollowUp);
CREATE INDEX idx_applications_user_outcome ON Application(userId, outcome, outcomeDate);

-- Resume queries
CREATE INDEX idx_resumes_user_master ON ResumeVersion(userId, isMaster);
CREATE INDEX idx_resumes_user_version ON ResumeVersion(userId, versionNumber DESC);

-- Event queries
CREATE INDEX idx_events_user_time ON InteractionEvent(userId, timestamp DESC);
CREATE INDEX idx_events_user_type ON InteractionEvent(userId, eventType);

-- Strategy queries
CREATE INDEX idx_strategy_user_active ON StrategyHistory(userId, deactivatedAt);
```

**Pagination for large datasets:**

```typescript
// Don't load all 500 applications at once
async function getApplicationsPaginated(
  userId: string,
  page: number = 1,
  limit: number = 50
): Promise<{items: Application[], hasMore: boolean}> {
  const items = await prisma.application.findMany({
    where: { userId },
    orderBy: { appliedAt: 'desc' },
    skip: (page - 1) * limit,
    take: limit + 1  // Fetch one extra to check if more exist
  });
  
  const hasMore = items.length > limit;
  return {
    items: items.slice(0, limit),
    hasMore
  };
}
```

---

## 11. APIs & Service Methods

### 11.1 Read APIs

```typescript
class StateService {
  // Primary API for Layer 2
  async getStateForLayer2(userId: string): Promise<Layer4StateForLayer2>
  
  // Primary API for Layer 5
  async getStateForLayer5(userId: string): Promise<Layer4StateForLayer5>
  
  // Specific queries
  async getMasterResume(userId: string): Promise<ResumeVersion | null>
  async getApplicationsNeedingFollowUp(userId: string): Promise<Application[]>
  async getRecentOutcomes(userId: string, days: number): Promise<Application[]>
  async getActiveStrategyMode(userId: string): Promise<StrategyMode | null>
  async getStrategyHistory(userId: string, limit?: number): Promise<StrategyHistory[]>
}
```

---

### 11.2 Write Commands

```typescript
class StateService {
  // Strategy management
  async changeStrategyMode(cmd: ChangeStrategyModeCommand): Promise<void>
  
  // Application lifecycle
  async createApplication(data: CreateApplicationData): Promise<Application>
  async updateApplicationStatus(id: string, status: ApplicationStatus): Promise<void>
  async recordApplicationOutcome(id: string, outcome: ApplicationOutcome): Promise<void>
  async recordFollowUp(id: string, message: string): Promise<void>
  
  // Resume management
  async createResumeVersion(data: CreateResumeData): Promise<ResumeVersion>
  async updateResumeScore(id: string, score: number): Promise<void>
  async setMasterResume(userId: string, resumeId: string): Promise<void>

  /**
   * Apply rewrite result with automatic scoring
   * This method:
   * 1. Creates new resume version with improved content
   * 2. Calls Layer 1 to calculate accurate score
   * 3. Updates score in database
   * 4. Logs RESUME_REWRITE_APPLIED event
   */
  async applyRewriteWithScoring(
    userId: string,
    rewriteResult: RewriteResult
  ): Promise<{
    new_version_id: string;
    old_score: number;
    new_score: number;
    actual_gain: number;
  }>

  // Event logging
  async logEvent(event: InteractionEvent): Promise<void>
  
  // User preferences
  async updateUserProfile(userId: string, data: Partial<UserProfile>): Promise<void>
  async updateWeeklyTarget(userId: string, target: number): Promise<void>
}
```

---

### 11.3 Computed Utilities

```typescript
class StateService {
  // Metrics
  async calculateInterviewRate(userId: string): Promise<number>
  async getApplicationCount(userId: string, period: 'week' | 'month' | 'all'): Promise<number>
  async getOutcomeStats(userId: string): Promise<OutcomeStats>
  
  // Freshness
  async detectStaleness(userId: string): Promise<FreshnessMetadata>
  
  // Validation
  validateStatusTransition(from: ApplicationStatus, to: ApplicationStatus): void
  validateResumeScore(score: number): void
  validateWeeklyTarget(target: number): void
}
```

---

## 12. Testing Requirements

### 12.1 Unit Tests

```typescript
// Validation
test("validateStatusTransition: valid transitions succeed")
test("validateStatusTransition: invalid transitions throw")
test("validateResumeScore: rejects out-of-range scores")
test("validateWeeklyTarget: enforces 0-50 range")

// Staleness detection
test("detectStaleness: fresh state returns is_stale=false")
test("detectStaleness: 14 days inactive returns warning")
test("detectStaleness: 30 days no applications in APPLY_MODE returns critical")
test("detectStaleness: 90 days no resume update returns warning")

// Computed values
test("calculateInterviewRate: correct calculation")
test("calculateInterviewRate: handles zero applications")
test("getApplicationCount: counts correctly per period")
```

---

### 12.2 Integration Tests

```typescript
// Strategy mode transitions
test("changeStrategyMode: creates history record")
test("changeStrategyMode: deactivates previous mode")
test("changeStrategyMode: updates UserProfile")
test("changeStrategyMode: logs event")
test("changeStrategyMode: enforces min_days_in_mode")
test("changeStrategyMode: prevents flip-flop")
test("changeStrategyMode: is atomic (transaction)")

// Application lifecycle
test("createApplication: initializes with draft status")
test("updateApplicationStatus: validates transitions")
test("updateApplicationStatus: invalidates cache")
test("recordFollowUp: increments count")
test("recordFollowUp: rejects if count >= 2")

// Concurrency
test("concurrent status updates: optimistic locking works")
test("concurrent mode changes: only one succeeds")
test("event logging: maintains order per user")
```

---

### 12.3 Performance Tests

```typescript
test("getUserState: completes in <200ms with 100 applications")
test("getStateForLayer2: completes in <200ms")
test("getApplicationsNeedingFollowUp: completes in <500ms with 500 applications")
test("cache invalidation: triggers correctly on writes")
test("state_version: increments correctly on updates")
```

---

## 13. GDPR & Privacy Compliance

### 13.1 Data Export

```typescript
async function exportUserData(userId: string): Promise<UserDataExport> {
  return {
    user: await getUser(userId),
    profile: await getUserProfile(userId),
    resumes: await getResumeVersions(userId),
    applications: await getApplications(userId),
    events: await getInteractionEvents(userId),
    strategyHistory: await getStrategyHistory(userId)
  };
}
```

---

### 13.2 Data Deletion

```typescript
async function deleteUserData(userId: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    // Cascade delete all user data
    await tx.interactionEvent.deleteMany({ where: { userId } });
    await tx.strategyHistory.deleteMany({ where: { userId } });
    await tx.application.deleteMany({ where: { userId } });
    await tx.resumeVersion.deleteMany({ where: { userId } });
    await tx.userProfile.delete({ where: { userId } });
    await tx.user.delete({ where: { id: userId } });
  });

  // Invalidate all caches
  cache.deletePattern(`*:${userId}:*`);
}
```

---

### 13.3 Data Retention & Archival Policy

**Retention periods for MVP (v1):**

| Data Type | Retention Period | Archival Policy |
|-----------|------------------|-----------------|
| **InteractionEvent** | 24 months | Archive to cold storage, aggregate to stats |
| **StrategyHistory** | Permanent | Keep (low volume, high value for learning) |
| **ResumeVersion** | While account active | Delete on GDPR request |
| **Application** | While account active | Delete on GDPR request |
| **UserProfile** | While account active | Delete on GDPR request |

**Implementation notes:**

- **After 24 months:** Archive InteractionEvents to S3/cold storage
- **Aggregation:** Before archiving, extract key stats (conversion rates, mode performance, etc.)
- **GDPR:** Hard delete all user data on request (no archives)
- **Inactive accounts:** After 12 months inactive, prompt user to confirm. After 18 months, soft delete.

**For v1.1+:** Add automated archival job that runs monthly.

---

## 14. Edge Cases & Fallbacks

**Case 1: User with no applications**
```
getUserState() → interview_rate = 0 (not null)
getApplicationsNeedingFollowUp() → []
```

**Case 2: User with no master resume**
```
getMasterResume() → null
state.resume.master_resume_id → null
```

**Case 3: Concurrent strategy mode changes**
```
Two processes call changeStrategyMode()
→ One succeeds (transaction commits)
→ One fails (optimistic lock conflict)
→ Failed process retries or backs off
```

**Case 4: Event logging fails**
```
Primary operation succeeds
Event logging fails (network issue)
→ Log error, don't rollback primary operation
→ Retry event logging async
→ Event eventually consistent
```

**Case 5: Cache inconsistency**
```
Cache has old data
Database updated
→ state_version incremented
→ Cache key no longer matches
→ Cache miss, recompute from DB
```

---

# PART II: FUTURE ROADMAP

## Phase 2: Enhanced Features (Weeks 9-12)

### 2.1 Real-Time State Sync

WebSocket connection for live updates:
- Application status changes push to UI instantly
- Strategy mode changes notify user
- Follow-up reminders delivered in real-time

---

### 2.2 Advanced Analytics

Materialized views for performance:
- Weekly/monthly aggregates pre-computed
- Trend analysis (applications over time)
- Cohort analysis (user segments)

---

### 2.3 Multi-User Collaboration

Support for:
- Career coaches viewing student state
- Team applications (recruiting coordinators)
- Shared job lists

---

## Phase 3: Machine Learning Integration (Months 4-6)

### 3.1 Outcome Prediction

Train models on `InteractionEvent` + `Application.outcome`:
- Predict interview likelihood before applying
- Suggest best resume version per job
- Optimize follow-up timing

---

### 3.2 Personalized Strategies

Segment users by:
- Experience level
- Target roles
- Application behavior
- Outcome patterns

Recommend strategies based on similar users' success.

---

## Phase 4: Advanced Features (Months 6+)

### 4.1 Event Sourcing Migration

Transition from mutable state to event sourcing:
- All state derived from event log
- Perfect audit trail
- Time-travel debugging
- Replay for learning

---

### 4.2 Distributed State

For scale beyond 100K users:
- Shard by userId
- Regional data centers
- Eventually consistent cross-region
- CRDT for conflict resolution

---

**END OF SPECIFICATION**

**Version:** 1.2 (P0 fixes for Layer 5 integration)
**Status:** 100/100 Ready - All P0 integration fixes applied
**Next:** Start implementation
