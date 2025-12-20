# Layer 5 – Orchestrator / Planner
## Complete Specification v1.2

**Version:** 1.2 (P0 fixes applied + simplified blueprint handling)
**Status:** Implementation-Ready
**Last Updated:** December 16, 2025
**Scope:** Decision-making brain - coordinates all layers, plans weekly/daily, executes actions

**Changelog v1.0 → v1.1:**
- Fixed contract mismatch: now uses staleness_severity and weeklyAppTarget from Layer 4 (P0-1)
- Fixed stale handling bug: unreachable code removed, proper if/else logic (P0-2)
- Updated to use new EventTypes from Layer 4 v1.2 (P0-3)
- Updated score pipeline: applyRewriteWithScoring() ensures accurate scores (P0-4)

**Changelog v1.1 → v1.2:**
- Removed fallback heuristic parsing for ActionBlueprints (Layer 2 v2.1+ always provides them)
- Simplified weekly plan generation logic to assume action_blueprints always present
- Updated to use shared types from Shared_Types_v1.0 (StrategyMode, EventType, ActionType, FocusArea, ApplicationStatus, SeniorityLevel)

---

## Document Purpose

Single source of truth for Layer 5 Orchestrator development.

**Part I:** Core Specification - ready to implement
**Part II:** Advanced Features - future roadmap

## Shared Types

This layer uses shared type definitions from `Shared_Types_v1.0.md`:
- `StrategyMode`
- `EventType`
- `ActionType`
- `FocusArea`
- `ApplicationStatus`
- `SeniorityLevel`

Import these from the shared types package in implementation.

---

# PART I: CORE SPECIFICATION

## 0. Purpose & Role

Layer 5 is the **Decision-Making Brain** that coordinates all other layers into coherent, actionable plans.

**Primary functions:**
- Convert strategy mode + user state → concrete weekly/daily plans
- Prioritize actions based on impact, urgency, alignment
- Execute actions by calling appropriate layers
- Track plan completion and trigger re-planning
- Maintain reproducibility and auditability

**Key innovation:** Evidence-anchored planning with closed-loop optimization (Plan → Execute → Measure → Replan).

**Non-responsibilities:**
- Does NOT analyze strategy (Layer 2 does)
- Does NOT score resumes (Layer 1 does)
- Does NOT rewrite content (Layer 3 does)
- Does NOT store state (Layer 4 does)
- Does NOT present to user (Layer 8 does)

**Positioning:** Orchestrator is stateless and reactive. All state lives in Layer 4. All decisions are reproducible from state + config.

---

## 1. Design Principles

**Reactive (Event-Driven)**
- Responds to triggers: resume update, application submitted, mode change, outcome reported
- Does not poll or run on fixed schedule (except daily plan generation)

**Stateless**
- Relies entirely on Layer 4 for state
- Each plan generation is a pure function of inputs
- No cached decisions between calls

**Deterministic**
- Same state + same config → same plan
- Enables testing, debugging, and trust

**Reproducible**
- Every plan includes:
  - `plan_id`
  - `generated_at`
  - `input_state_version` (from Layer 4)
  - `strategy_analysis_version` (from Layer 2)
  - Optionally: `input_hash` for verification

**Fail-Safe**
- Never blocks user due to layer failures
- Always generates minimum viable plan
- Graceful degradation with warnings

**Evidence-Anchored**
- Every task includes `why_now` and `evidence_refs`
- Users can trace every recommendation to data/signal
- Aligns with "no black box" principle

---

## 2. Input Contracts

### 2.1 From Layer 4 (Memory & State Engine)

**Primary Input:** `Layer4StateForLayer5`

```ts
interface Layer4StateForLayer5 {
  // Pipeline state
  pipeline_state: {
    total_applications: number;
    applications_last_7_days: number;
    applications_last_30_days: number;
    interview_requests: number;
    interview_rate: number;  // 0..1
    offers: number;
    rejections: number;
  };

  // User profile
  user_profile: {
    target_roles: string[];
    target_seniority?: "entry" | "mid" | "senior" | "lead";
    years_experience?: number;
    weeklyAppTarget?: number;  // 0..50 (user's weekly application target)
    preferences?: {
      work_arrangement?: string[];
      locations?: string[];
      salary_minimum?: number;
      excluded_industries?: string[];
    };
  };

  // Strategy
  current_strategy_mode?: "IMPROVE_RESUME_FIRST" | "APPLY_MODE" | "RETHINK_TARGETS" | null;
  
  strategy_history?: Array<{
    from: StrategyMode;
    to: StrategyMode;
    changed_at: string;
    reason: string;
  }>;

  // Resume
  resume: {
    master_resume_id?: string;
    resume_score?: number;  // 0..100
    last_resume_update?: string;
    improvement_areas?: string[];
  };

  // Freshness
  freshness: {
    last_resume_update?: string;
    last_application?: string;
    last_user_interaction?: string;
    is_stale: boolean;
    staleness_reason?: string;
    staleness_severity: "none" | "warning" | "critical";
  };

  // Action items
  followups: {
    applications_needing_followup: Array<{
      application_id: string;
      job_title: string;
      company: string;
      applied_at: string;
      days_since_application: number;
      follow_up_count: number;
      last_follow_up?: string;
      suggested_action: "FOLLOW_UP" | "DO_NOT_FOLLOW_UP";
      reason: string;
    }>;
  };

  // Versioning
  state_version: number;
  computed_at: string;
}
```

**Usage:**
```typescript
const state = await Layer4.getStateForLayer5(userId);
```

---

### 2.2 From Layer 2 (Strategy Engine)

**Primary Input:** `StrategyAnalysisResult`

```ts
interface StrategyAnalysisResult {
  // Overall fit
  overall_fit_score: number;  // 0-100
  confidence_level: "low" | "medium" | "high";

  // Gaps
  gaps: {
    skills: {
      matched: string[];
      critical_missing: string[];
      match_percentage: number;
    };
    tools: {
      matched: string[];
      critical_missing: string[];
      match_percentage: number;
    };
    experience: {
      missing_types: string[];
      coverage_score: number;
    };
    seniority: {
      user_level: SeniorityLevel;
      role_expected: SeniorityLevel;
      alignment: "underqualified" | "aligned" | "overqualified";
    };
  };

  // Strategy recommendation
  recommended_mode: StrategyMode;
  mode_reasoning: {
    primary_reason: string;
    supporting_factors: string[];
    confidence: "high" | "medium" | "low";
  };

  // High-level actions (for Coach)
  priority_actions: string[];  // Human-readable strings

  // NEW: Machine-actionable blueprints
  action_blueprints?: ActionBlueprint[];

  // Insights
  key_insights: string[];
}

// NEW: Machine-actionable action format
interface ActionBlueprint {
  type: "improve_resume" | "apply_to_job" | "follow_up" | "update_targets" | "collect_missing_info";
  objective: string;  // Human-readable
  
  entities?: {
    bullet_index?: number;
    section?: string;
    application_id?: string;
    job_id?: string;
  };
  
  constraints?: {
    max_items?: number;
    min_score_gain?: number;
  };
  
  why: string;  // From mode_reasoning + gaps
  confidence: "low" | "medium" | "high";
}
```

**Usage:**
```typescript
const analysis = await Layer2.analyze({
  evaluation_data: layer1_output,
  state_data: layer4_output,
  job_requirements: optional_jd_data
});
```

**Note:** Layer 2 v2.1+ always provides `action_blueprints`. Legacy handling not required for new implementations.

---

### 2.3 From Layer 1 (Evaluation Engine)

**Input:** Resume evaluation results (via Layer 4 state)

```ts
// Available in state.resume
{
  master_resume_id: string;
  resume_score: number;
  improvement_areas: string[];  // e.g., ["weak_verbs", "no_metrics"]
}
```

**Usage:** Already included in Layer 4 state, no direct call needed.

---

### 2.4 From Layer 6 (Job Discovery) - Future

**Not in v1 MVP.** In v1, user manually provides jobs.

In v2+, Orchestrator will call Layer 6 to get job recommendations based on strategy mode.

---

## 3. Output Contracts

### 3.1 To Layer 8 (Coach Interface)

**Output:** Planning context for Coach to explain

```ts
interface PlanningContext {
  weekly_plan: WeeklyPlan;
  today_plan: DailyPlan;
  
  strategy_context: {
    current_mode: StrategyMode;
    mode_reasoning: string;
    weekly_target: number;
    target_rationale: string;
  };
  
  recent_activity: {
    completed_tasks_this_week: number;
    progress_percentage: number;
    deviations?: Array<{
      type: "mode_override" | "target_missed" | "task_rejected";
      details: string;
    }>;
  };
}
```

**Usage:** Coach receives this to explain plan to user.

---

### 3.2 To Layer 3 (Execution Engine)

**Output:** Rewrite requests when executing improve_resume actions

```ts
// When action_type === "improve_resume"
interface RewriteRequest {
  type: "bullet" | "summary" | "section";
  bullet?: string;
  summary?: string;
  bullets?: string[];
  
  target_role?: string;
  target_seniority?: SeniorityLevel;
  
  evidence_scope?: "bullet_only" | "section" | "resume";
  
  layer1?: {
    weak_bullets?: Array<{
      bullet: string;
      issues: string[];
    }>;
    extracted?: {
      skills?: string[];
      tools?: string[];
    };
  };
  
  layer2?: {
    target_role?: string;
    missing_experience_types?: string[];
  };
}
```

**Usage:**
```typescript
const result = await Layer3.rewriteBullet(request);
if (result.validation.passed && result.estimated_score_gain >= 3) {
  // Apply rewrite
  await applyRewrite(result);
}
```

---

### 3.3 To Layer 4 (Memory & State Engine)

**Output:** State updates after action execution

```ts
// When action completes
await Layer4.logEvent({
  userId,
  eventType: EventType.TASK_COMPLETED,
  context: {
    task_id: task.task_id,
    action_type: task.action_type,
    result: "success" | "failed" | "skipped",
    evidence: {...}
  }
});

// When plan generated
await Layer4.logEvent({
  userId,
  eventType: EventType.WEEKLY_PLAN_GENERATED,
  context: {
    plan_id: plan.plan_id,
    target_applications: plan.target_applications,
    task_count: plan.task_pool.length
  }
});
```

---

## 4. Core Data Models

### 4.1 Action Types

```ts
type ActionType =
  | "improve_resume"        // Call Layer 3 to rewrite bullets/sections
  | "apply_to_job"          // User applies (tracked in Layer 4)
  | "follow_up"             // User sends follow-up (tracked in Layer 4)
  | "update_targets"        // User updates target roles/preferences
  | "collect_missing_info"  // Prompt user for missing data (skills, etc.)
  | "refresh_state";        // User updates resume/applications (when stale)
```

### 4.2 Focus Areas

```ts
type FocusArea =
  | "applications"          // Sending applications
  | "resume_improvement"    // Improving resume quality
  | "follow_ups"            // Following up on applications
  | "strategy";             // Rethinking targets/approach
```

### 4.3 Task

```ts
interface Task {
  task_id: string;  // Unique ID
  action_type: ActionType;
  title: string;  // Short title
  description: string;  // User-friendly explanation

  // Execution semantics
  execution: "auto" | "user_confirmed" | "user_only";
  payload: Record<string, any>;  // job_id, application_id, bullet_index, etc.

  // Planning metadata
  priority: number;  // 0..100 (bounded!)
  estimated_minutes: number;
  due_at?: string;  // ISO 8601 (optional)
  dependencies?: string[];  // task_ids that must complete first

  // Explainability
  why_now: string;  // Why this task is recommended now
  evidence_refs?: string[];  // Pointers to Layer 4 items / Layer 1 issues

  // State
  status?: "pending" | "in_progress" | "completed" | "failed" | "skipped";
}
```

### 4.4 Daily Plan

```ts
interface DailyPlan {
  plan_id: string;
  date: string;  // ISO date (YYYY-MM-DD)
  
  focus_area: FocusArea;
  tasks: Task[];  // Max 3-5 tasks
  
  total_estimated_minutes: number;
  
  // Traceability
  generated_from_weekly_plan_id?: string;
  input_state_version: number;
  generated_at: string;  // ISO 8601
}
```

### 4.5 Weekly Plan

```ts
interface WeeklyPlan {
  plan_id: string;
  week_start: string;  // ISO date (Monday)
  week_end: string;    // ISO date (Sunday)
  
  // Strategy
  strategy_mode: StrategyMode;
  target_applications: number;
  
  // Focus distribution
  focus_mix: Record<FocusArea, number>;  // e.g., {resume: 0.5, applications: 0.3, follow_ups: 0.2}
  
  // Task pool (10-25 tasks)
  task_pool: Task[];
  
  // Daily plan hints (optional)
  daily_plan_hints?: Record<string, string[]>;  // date → task_ids
  
  // Traceability
  input_state_version: number;
  strategy_analysis_version: string;  // e.g., "2.1"
  generated_at: string;
  input_hash?: string;  // For verification
}
```

---

## 5. Core Algorithms

### 5.1 Weekly Plan Generation

**Trigger Events:**
- User onboarding (first time)
- Monday morning (weekly cadence)
- Strategy mode change (Layer 2 triggers)
- Major state change (e.g., got interview, 10+ new applications)

**Algorithm:**

```python
async def generate_weekly_plan(user_id: str) -> WeeklyPlan:
    # Step 1: Get inputs
    state = await Layer4.getStateForLayer5(user_id)
    analysis = await Layer2.analyze(user_id)
    
    # Step 2: Handle stale state
    if state.freshness.is_stale:
        if state.freshness.staleness_severity == "critical":
            # Critical staleness: return minimal safe plan immediately
            return generate_minimal_safe_plan(state, reason="stale_state_critical")

        # Warning staleness: continue but add refresh task with high priority
        # (This will be added in Step 4 below)
    
    # Step 3: Calculate weekly target
    target_applications = calculate_weekly_target(state, analysis)
    
    # Step 4: Build task pool
    tasks = []

    # From Layer 2 action blueprints (always present in v2.1+)
    for blueprint in analysis.action_blueprints:
        task = convert_blueprint_to_task(blueprint, state)
        tasks.append(task)

    # Fallback only if empty (edge case)
    if not tasks:
        logger.warning("Layer 2 returned no action_blueprints")
        # Generate minimal tasks from priority_actions as fallback
        tasks = generate_minimal_tasks_from_actions(analysis.priority_actions, state)

    # From Layer 4 follow-ups
    for followup in state.followups.applications_needing_followup:
        if followup.suggested_action == "FOLLOW_UP":
            task = create_followup_task(followup)
            tasks.append(task)
    
    # From stale state (warning level - critical already returned above)
    if state.freshness.is_stale:
        # At this point, we know severity is "warning" (critical returned earlier)
        task = create_refresh_task(
            reason=state.freshness.staleness_reason,
            priority=90  # High priority but not blocking
        )
        tasks.append(task)
    
    # Step 5: Prioritize tasks
    tasks = prioritize_tasks(tasks, state, analysis)
    
    # Step 6: Select top tasks (10-25 for the week)
    task_pool = tasks[:25]
    
    # Step 7: Calculate focus mix
    focus_mix = calculate_focus_mix(task_pool, analysis.recommended_mode)
    
    # Step 8: Generate daily hints (optional)
    daily_hints = distribute_tasks_across_week(task_pool, focus_mix)
    
    # Step 9: Create plan
    plan = WeeklyPlan(
        plan_id=generate_id(),
        week_start=get_next_monday(),
        week_end=get_next_sunday(),
        strategy_mode=analysis.recommended_mode,
        target_applications=target_applications,
        focus_mix=focus_mix,
        task_pool=task_pool,
        daily_plan_hints=daily_hints,
        input_state_version=state.state_version,
        strategy_analysis_version="2.1",
        generated_at=now()
    )
    
    # Step 10: Validate plan
    validation = validate_weekly_plan(plan, state)
    if not validation.passed:
        # Log warnings, adjust if needed
        plan = apply_validation_fixes(plan, validation)
    
    # Step 11: Store plan in Layer 4
    await Layer4.logEvent({
        userId: user_id,
        eventType: EventType.WEEKLY_PLAN_GENERATED,
        context: {plan_id: plan.plan_id, ...}
    })
    
    return plan
```

---

### 5.2 Daily Plan Generation

**Trigger:** Every day at user's preferred time (default: 8am user timezone)

**Algorithm:**

```python
async def generate_daily_plan(user_id: str, date: str) -> DailyPlan:
    # Step 1: Get inputs
    state = await Layer4.getStateForLayer5(user_id)
    weekly_plan = await get_active_weekly_plan(user_id)
    
    # Step 2: Handle no weekly plan
    if not weekly_plan:
        # Generate on-the-fly
        weekly_plan = await generate_weekly_plan(user_id)
    
    # Step 3: Get candidate tasks from weekly plan
    candidate_tasks = weekly_plan.task_pool
    
    # Filter already completed
    candidate_tasks = [t for t in candidate_tasks if t.status != "completed"]
    
    # Step 4: Get daily hints
    suggested_task_ids = weekly_plan.daily_plan_hints.get(date, [])
    
    # Step 5: Select tasks for today (3-5 tasks)
    today_tasks = []
    
    # Priority 1: Tasks from hints
    for task_id in suggested_task_ids:
        task = find_task(candidate_tasks, task_id)
        if task and len(today_tasks) < 5:
            today_tasks.append(task)
    
    # Priority 2: High-priority tasks not in hints
    remaining = [t for t in candidate_tasks if t.task_id not in suggested_task_ids]
    remaining.sort(key=lambda t: t.priority, reverse=True)
    
    while len(today_tasks) < 5 and remaining:
        today_tasks.append(remaining.pop(0))
    
    # Step 6: Re-prioritize for today (apply time decay, urgency)
    today_tasks = prioritize_tasks(today_tasks, state, analysis=None, for_today=True)
    
    # Step 7: Respect time budget
    user_time_budget = get_user_time_budget(user_id, date)  # minutes
    if user_time_budget:
        today_tasks = fit_tasks_to_time_budget(today_tasks, user_time_budget)
    
    # Step 8: Determine focus area
    focus_area = determine_focus_area(today_tasks)
    
    # Step 9: Create plan
    plan = DailyPlan(
        plan_id=generate_id(),
        date=date,
        focus_area=focus_area,
        tasks=today_tasks,
        total_estimated_minutes=sum(t.estimated_minutes for t in today_tasks),
        generated_from_weekly_plan_id=weekly_plan.plan_id,
        input_state_version=state.state_version,
        generated_at=now()
    )
    
    # Step 10: Validate
    validation = validate_daily_plan(plan, state)
    if not validation.passed:
        plan = apply_validation_fixes(plan, validation)
    
    return plan
```

---

### 5.3 Weekly Target Calculation

**Decision Tree:**

```python
def calculate_weekly_target(state: Layer4State, analysis: StrategyAnalysis) -> int:
    # Input: recommended mode, user override, time budget, freshness
    
    # Rule 1: If state stale (critical), freeze target
    if state.freshness.is_stale and state.freshness.staleness_severity == "critical":
        # Return last known target or 0
        return state.user_profile.weeklyAppTarget or 0
    
    # Rule 2: User override (if valid)
    user_override = state.user_profile.weeklyAppTarget
    if user_override is not None:
        # Validate constraints (Layer 4 constraints)
        if user_override < 0 or user_override > 50:
            # Invalid, ignore
            pass
        elif analysis.recommended_mode == "APPLY_MODE" and user_override < 1:
            # In APPLY_MODE, target must be >= 1 (Layer 4 rule)
            pass
        else:
            # Valid override, use it
            return user_override
    
    # Rule 3: Calculate from mode + time budget + completion rate
    mode = analysis.recommended_mode
    
    # Base targets per mode
    BASE_TARGETS = {
        "IMPROVE_RESUME_FIRST": (2, 3),  # range
        "APPLY_MODE": (8, 12),
        "RETHINK_TARGETS": (3, 5)
    }
    
    min_target, max_target = BASE_TARGETS.get(mode, (5, 8))
    
    # Adjust based on time budget (if available)
    time_budget = get_user_time_budget_for_week(user_id)
    if time_budget:
        # Rough estimate: 1 application = 30 minutes
        max_affordable = time_budget // 30
        max_target = min(max_target, max_affordable)
    
    # Adjust based on last week's completion rate
    last_week_completion = get_last_week_completion_rate(user_id)
    if last_week_completion:
        if last_week_completion < 0.5:
            # User struggled, reduce target
            target = min_target
        elif last_week_completion > 1.2:
            # User exceeded, can handle more
            target = max_target
        else:
            # Normal, pick middle
            target = (min_target + max_target) // 2
    else:
        # No history, pick conservative
        target = min_target
    
    return target
```

**Mid-Week Adjustment:**

```python
def should_adjust_weekly_target(user_id: str, current_day: str) -> bool:
    # Only adjust if severe deviation
    
    if current_day not in ["Wednesday", "Thursday"]:
        return False  # Too early or too late
    
    weekly_plan = get_active_weekly_plan(user_id)
    progress = calculate_progress(weekly_plan)
    
    # Severe under-performance
    if progress < 0.25:
        return True
    
    # Severe over-performance
    if progress > 1.2:
        return True
    
    return False
```

---

### 5.4 Priority Scoring System

**Goal:** Score tasks 0-100 based on Impact, Urgency, Alignment, Confidence, TimeCost.

**Formula:**

```
Priority = clamp(0, 100,
    w_I * Impact +
    w_U * Urgency +
    w_A * Alignment +
    w_C * Confidence -
    w_T * TimeCost -
    Penalties
)
```

**Weights (configurable):**
```python
WEIGHTS = {
    "impact": 0.35,
    "urgency": 0.25,
    "alignment": 0.20,
    "confidence": 0.10,
    "time_cost": 0.10
}
```

**Sub-Scores (each 0-100):**

**1. Impact:**
```python
def calculate_impact(task: Task, state: Layer4State, mode: StrategyMode) -> float:
    if task.action_type == "improve_resume":
        # From Layer 3 estimated_score_gain
        score_gain = task.payload.get("estimated_score_gain", 5)
        
        # From Layer 1 issue severity
        issues = task.payload.get("issues", [])
        severity_score = sum(ISSUE_SEVERITY.get(issue, 10) for issue in issues)
        
        # Weighted
        impact = (score_gain * 5) + severity_score
        
        # In IMPROVE_RESUME_FIRST mode, impact is higher
        if mode == "IMPROVE_RESUME_FIRST":
            impact *= 1.5
        
        return clamp(0, 100, impact)
    
    elif task.action_type == "apply_to_job":
        # From job match_score
        match_score = task.payload.get("match_score", 50)
        
        # From pipeline scarcity (fewer applications = higher impact)
        applications_this_week = state.pipeline_state.applications_last_7_days
        weekly_target = get_weekly_target(state)
        scarcity = 100 * (1 - applications_this_week / max(weekly_target, 1))
        
        # Weighted
        impact = (match_score * 0.7) + (scarcity * 0.3)
        
        # In APPLY_MODE, impact is higher
        if mode == "APPLY_MODE":
            impact *= 1.3
        
        return clamp(0, 100, impact)
    
    elif task.action_type == "follow_up":
        # From days_since_application (7-10 days = optimal)
        days_since = task.payload.get("days_since_application", 0)
        
        if 7 <= days_since <= 10:
            impact = 80  # Optimal window
        elif 5 <= days_since < 7:
            impact = 50  # Slightly early
        elif 10 < days_since <= 14:
            impact = 60  # Getting late
        else:
            impact = 20  # Too early or too late
        
        return impact
    
    else:
        # Default impact
        return 50
```

**2. Urgency:**
```python
def calculate_urgency(task: Task) -> float:
    if not task.due_at:
        return 30  # No deadline = low urgency
    
    due_at = parse_datetime(task.due_at)
    now = datetime.now()
    hours_until_due = (due_at - now).total_seconds() / 3600
    
    if hours_until_due < 24:
        return 100  # Due today!
    elif hours_until_due < 48:
        return 80   # Due tomorrow
    elif hours_until_due < 168:
        return 50   # Due this week
    else:
        return 20   # Due later
```

**3. Alignment:**
```python
def calculate_alignment(task: Task, mode: StrategyMode) -> float:
    # How well does task align with recommended mode?
    
    ALIGNMENT_MATRIX = {
        "IMPROVE_RESUME_FIRST": {
            "improve_resume": 100,
            "apply_to_job": 30,   # Discouraged but allowed
            "follow_up": 70,
            "update_targets": 40,
            "refresh_state": 80
        },
        "APPLY_MODE": {
            "improve_resume": 50,
            "apply_to_job": 100,
            "follow_up": 80,
            "update_targets": 30,
            "refresh_state": 60
        },
        "RETHINK_TARGETS": {
            "improve_resume": 40,
            "apply_to_job": 60,   # Test applications
            "follow_up": 50,
            "update_targets": 100,
            "refresh_state": 70
        }
    }
    
    return ALIGNMENT_MATRIX.get(mode, {}).get(task.action_type, 50)
```

**4. Confidence:**
```python
def calculate_confidence(task: Task, state: Layer4State) -> float:
    base_confidence = 70
    
    # Reduce if state is stale
    if state.freshness.is_stale:
        if state.freshness.staleness_severity == "critical":
            base_confidence -= 40
        elif state.freshness.staleness_severity == "warning":
            base_confidence -= 20
    
    # Reduce if task has missing data
    if task.payload.get("incomplete_data"):
        base_confidence -= 30
    
    # Increase if task from high-confidence analysis
    if task.evidence_refs and len(task.evidence_refs) > 2:
        base_confidence += 20
    
    return clamp(0, 100, base_confidence)
```

**5. TimeCost:**
```python
def calculate_time_cost(task: Task) -> float:
    # Normalize estimated_minutes to 0-100
    # Assume max reasonable task time = 120 minutes
    
    minutes = task.estimated_minutes
    cost = (minutes / 120) * 100
    
    return clamp(0, 100, cost)
```

**Penalties:**
```python
def calculate_penalties(task: Task, state: Layer4State, mode: StrategyMode) -> float:
    penalty = 0
    
    # Conflict penalty: Task doesn't align with mode
    alignment = calculate_alignment(task, mode)
    if alignment < 40:
        penalty += 20
    
    # Staleness penalty
    if state.freshness.is_stale and state.freshness.staleness_severity == "critical":
        penalty += 30
    
    # Dependency penalty: Dependencies not met
    if task.dependencies:
        for dep_id in task.dependencies:
            dep_task = find_task_by_id(dep_id)
            if dep_task and dep_task.status != "completed":
                penalty += 15
    
    return penalty
```

**Tiebreaker (Deterministic):**
```python
def tiebreaker(task_a: Task, task_b: Task) -> int:
    # If priorities equal, use deterministic tiebreaker
    
    # 1. Due date (closer first)
    if task_a.due_at and task_b.due_at:
        if task_a.due_at < task_b.due_at:
            return -1
        elif task_a.due_at > task_b.due_at:
            return 1
    
    # 2. Impact (higher first)
    impact_a = calculate_impact(task_a, ...)
    impact_b = calculate_impact(task_b, ...)
    if impact_a > impact_b:
        return -1
    elif impact_a < impact_b:
        return 1
    
    # 3. Time cost (lower first)
    if task_a.estimated_minutes < task_b.estimated_minutes:
        return -1
    elif task_a.estimated_minutes > task_b.estimated_minutes:
        return 1
    
    # 4. Task ID (stable sort)
    if task_a.task_id < task_b.task_id:
        return -1
    else:
        return 1
```

---

### 5.5 Action Execution

**Flow for each action type:**

#### improve_resume

```python
async def execute_improve_resume(task: Task, user_id: str) -> ActionResult:
    # Step 1: Build RewriteRequest
    state = await Layer4.getStateForLayer5(user_id)
    
    request = RewriteRequest(
        type=task.payload.get("rewrite_type", "bullet"),
        bullet=task.payload.get("bullet"),
        target_role=state.user_profile.target_roles[0],
        evidence_scope="section",
        layer1={
            "weak_bullets": task.payload.get("weak_bullets"),
            "extracted": state.resume.extracted
        },
        layer2={
            "target_role": state.user_profile.target_roles[0]
        }
    )
    
    # Step 2: Call Layer 3
    try:
        result = await Layer3.rewriteBullet(request)
    except Exception as e:
        return ActionResult(
            success=False,
            error=str(e),
            fallback="manual_edit"
        )
    
    # Step 3: Validate result
    if not result.validation.passed:
        return ActionResult(
            success=False,
            error="Validation failed",
            details=result.validation.items
        )
    
    # Step 4: Check score gain threshold
    if result.estimated_score_gain < 3:
        return ActionResult(
            success=False,
            error="Insufficient score gain",
            details={"gain": result.estimated_score_gain}
        )

    # Step 5: Apply rewrite WITH SCORING (Layer 4 handles Layer 1 call internally)
    try:
        apply_result = await Layer4.applyRewriteWithScoring(user_id, result)
    except Exception as e:
        return ActionResult(
            success=False,
            error=f"Failed to apply rewrite: {str(e)}"
        )

    # Step 6: Return result with actual score gain
    return ActionResult(
        success=True,
        evidence_map=result.evidence_map,
        estimated_score_gain=result.estimated_score_gain,
        actual_score_gain=apply_result.actual_gain,  # NEW: Real gain from Layer 1
        old_score=apply_result.old_score,
        new_score=apply_result.new_score
    )
```

#### apply_to_job

```python
async def execute_apply_to_job(task: Task, user_id: str) -> ActionResult:
    # This is user-confirmed action (user applies manually)
    # Orchestrator just tracks it
    
    job_id = task.payload.get("job_id")
    
    # Step 1: Verify job exists
    job = await Layer4.getJobPosting(job_id)
    if not job:
        return ActionResult(success=False, error="Job not found")
    
    # Step 2: Create application record (status=draft)
    application = await Layer4.createApplication({
        userId: user_id,
        jobId: job_id,
        resumeVersionId: get_master_resume_id(user_id),
        status: "draft",
        strategyModeAtApply: get_current_mode(user_id)
    })
    
    # Step 3: Wait for user to actually apply
    # (This happens outside Orchestrator - user clicks "Applied" in UI)
    
    # Step 4: Log event
    await Layer4.logEvent({
        userId: user_id,
        eventType: EventType.APPLICATION_CREATED,
        context: {
            task_id: task.task_id,
            application_id: application.id,
            job_id: job_id
        }
    })
    
    return ActionResult(success=True, application_id=application.id)
```

#### follow_up

```python
async def execute_follow_up(task: Task, user_id: str) -> ActionResult:
    application_id = task.payload.get("application_id")
    
    # Step 1: Verify application exists and can be followed up
    app = await Layer4.getApplication(application_id)
    if not app:
        return ActionResult(success=False, error="Application not found")
    
    if app.followUpCount >= 2:
        return ActionResult(success=False, error="Max follow-ups reached (2)")
    
    # Step 2: User sends follow-up (outside Orchestrator)
    # Orchestrator just records it when user confirms
    
    # Step 3: Update application
    await Layer4.recordFollowUp(application_id, message="...")
    
    # Step 4: Log event
    await Layer4.logEvent({
        userId: user_id,
        eventType: EventType.FOLLOW_UP_SENT,
        context: {
            task_id: task.task_id,
            application_id: application_id,
            follow_up_count: app.followUpCount + 1
        }
    })
    
    return ActionResult(success=True)
```

---

### 5.6 Re-planning Triggers

**When to regenerate weekly plan:**

```python
WEEKLY_PLAN_TRIGGERS = [
    "strategy_mode_changed",     # Layer 2 changed mode
    "major_milestone",           # First interview, first offer
    "severe_deviation",          # Mid-week adjustment needed
    "user_requested"             # User clicks "Regenerate Plan"
]

async def should_regenerate_weekly_plan(user_id: str, event: Event) -> bool:
    if event.type in WEEKLY_PLAN_TRIGGERS:
        return True
    
    # Check for severe deviation
    if is_midweek() and should_adjust_weekly_target(user_id):
        return True
    
    return False
```

**When to regenerate daily plan:**

```python
DAILY_PLAN_TRIGGERS = [
    "new_day",                   # Daily cadence
    "major_task_completed",      # Key task done early
    "task_failed",               # Key task failed
    "user_requested"             # User clicks "Refresh Tasks"
]

async def should_regenerate_daily_plan(user_id: str, event: Event) -> bool:
    if event.type in DAILY_PLAN_TRIGGERS:
        return True
    
    return False
```

---

## 6. Validation Rules

### 6.1 Weekly Plan Validation

```python
def validate_weekly_plan(plan: WeeklyPlan, state: Layer4State) -> ValidationResult:
    issues = []
    
    # Rule 1: Must have at least 1 task
    if len(plan.task_pool) == 0:
        issues.append(ValidationIssue(
            code="EMPTY_PLAN",
            severity="critical",
            message="Weekly plan has no tasks"
        ))
    
    # Rule 2: Target applications must be reasonable
    if plan.target_applications < 0 or plan.target_applications > 50:
        issues.append(ValidationIssue(
            code="INVALID_TARGET",
            severity="critical",
            message=f"Target {plan.target_applications} out of range (0-50)"
        ))
    
    # Rule 3: Tasks must have valid action types
    for task in plan.task_pool:
        if task.action_type not in VALID_ACTION_TYPES:
            issues.append(ValidationIssue(
                code="INVALID_ACTION_TYPE",
                severity="critical",
                message=f"Task {task.task_id} has invalid type"
            ))
    
    # Rule 4: Focus mix must sum to ~1.0
    focus_sum = sum(plan.focus_mix.values())
    if focus_sum < 0.9 or focus_sum > 1.1:
        issues.append(ValidationIssue(
            code="INVALID_FOCUS_MIX",
            severity="warning",
            message=f"Focus mix sums to {focus_sum}, expected ~1.0"
        ))
    
    # Rule 5: Priority scores must be bounded
    for task in plan.task_pool:
        if task.priority < 0 or task.priority > 100:
            issues.append(ValidationIssue(
                code="PRIORITY_OUT_OF_BOUNDS",
                severity="warning",
                message=f"Task {task.task_id} priority {task.priority} not in [0,100]"
            ))
    
    passed = not any(i.severity == "critical" for i in issues)
    return ValidationResult(passed=passed, issues=issues)
```

### 6.2 Daily Plan Validation

```python
def validate_daily_plan(plan: DailyPlan, state: Layer4State) -> ValidationResult:
    issues = []
    
    # Rule 1: Must have at least 1 task (unless explicitly empty day)
    if len(plan.tasks) == 0:
        issues.append(ValidationIssue(
            code="EMPTY_DAY",
            severity="warning",
            message="Daily plan has no tasks"
        ))
    
    # Rule 2: Must not exceed 3-5 tasks
    if len(plan.tasks) > 5:
        issues.append(ValidationIssue(
            code="TOO_MANY_TASKS",
            severity="warning",
            message=f"Daily plan has {len(plan.tasks)} tasks, max is 5"
        ))
    
    # Rule 3: Estimated time must be reasonable (< 480 minutes = 8 hours)
    if plan.total_estimated_minutes > 480:
        issues.append(ValidationIssue(
            code="EXCESSIVE_TIME",
            severity="warning",
            message=f"Plan requires {plan.total_estimated_minutes} min, unrealistic for one day"
        ))
    
    # Rule 4: Tasks with dependencies must have deps in plan
    task_ids = {t.task_id for t in plan.tasks}
    for task in plan.tasks:
        if task.dependencies:
            for dep_id in task.dependencies:
                if dep_id not in task_ids:
                    issues.append(ValidationIssue(
                        code="MISSING_DEPENDENCY",
                        severity="warning",
                        message=f"Task {task.task_id} depends on {dep_id} not in plan"
                    ))
    
    passed = not any(i.severity == "critical" for i in issues)
    return ValidationResult(passed=passed, issues=issues)
```

---

## 7. Error Handling & Recovery

### 7.1 Layer Failures

**Layer 2 (Strategy) Failure:**
```python
async def handle_layer2_failure(user_id: str, error: Exception) -> StrategyAnalysis:
    # Fallback to last known mode
    state = await Layer4.getStateForLayer5(user_id)
    current_mode = state.current_strategy_mode or "APPLY_MODE"
    
    # Log error
    logger.error(f"Layer 2 failed for user {user_id}: {error}")
    
    # Return minimal analysis
    return StrategyAnalysisResult(
        recommended_mode=current_mode,
        mode_reasoning={
            "primary_reason": "Using last known mode due to analysis failure",
            "confidence": "low"
        },
        priority_actions=["Review resume", "Apply to jobs"],
        action_blueprints=[]
    )
```

**Layer 3 (Execution) Failure:**
```python
async def handle_layer3_failure(task: Task, error: Exception) -> ActionResult:
    # Log error
    logger.error(f"Layer 3 failed for task {task.task_id}: {error}")
    
    # Return failed result with fallback
    return ActionResult(
        success=False,
        error=str(error),
        fallback="user_only",  # User must do manually
        suggestion="Try editing the resume manually in the editor"
    )
```

**Layer 4 (State) Failure:**
```python
async def handle_layer4_failure(user_id: str, error: Exception):
    # CRITICAL: Cannot proceed without state
    logger.critical(f"Layer 4 failed for user {user_id}: {error}")
    
    # Return error to user (via Layer 8)
    raise OrchestratorError(
        code="STATE_UNAVAILABLE",
        message="Unable to load your current state. Please try again.",
        retry_after=60  # seconds
    )
```

---

### 7.2 Stale State Handling

```python
async def generate_plan_with_stale_state(state: Layer4State, analysis: StrategyAnalysis) -> WeeklyPlan:
    # Don't block, but generate minimal safe plan
    
    tasks = []
    
    # Priority 1: Refresh state task
    tasks.append(Task(
        task_id=generate_id(),
        action_type="refresh_state",
        title="Update Your Information",
        description=f"Your data is outdated: {state.freshness.staleness_reason}",
        execution="user_only",
        priority=100,  # Highest
        estimated_minutes=15,
        why_now="Your information needs updating before we can make good recommendations"
    ))
    
    # Priority 2: Safe tasks (follow-ups, low-risk applies)
    for followup in state.followups.applications_needing_followup[:3]:
        tasks.append(create_followup_task(followup))
    
    # Create minimal plan
    return WeeklyPlan(
        plan_id=generate_id(),
        strategy_mode=analysis.recommended_mode,
        target_applications=0,  # No applications until refresh
        task_pool=tasks,
        focus_mix={"strategy": 1.0},
        ...
    )
```

---

### 7.3 Concurrency Handling

**Based on Layer 4 state_version:**

```python
async def generate_weekly_plan_safe(user_id: str, expected_state_version: int) -> WeeklyPlan:
    # Step 1: Get state
    state = await Layer4.getStateForLayer5(user_id)
    
    # Step 2: Check version
    if state.state_version != expected_state_version:
        # State changed since request initiated
        # Re-fetch and retry
        return await generate_weekly_plan_safe(user_id, state.state_version)
    
    # Step 3: Generate plan
    plan = await generate_weekly_plan(user_id)
    
    # Step 4: Store with version check
    try:
        await Layer4.storePlanWithVersionCheck(plan, expected_state_version)
    except ConcurrentModificationError:
        # Another process stored a plan, retry
        return await generate_weekly_plan_safe(user_id, state.state_version)
    
    return plan
```

---

## 8. Time Estimation

### 8.1 Estimation Model

```python
# Base estimates per action type (minutes)
BASE_TIME_ESTIMATES = {
    "improve_resume": 20,      # Per bullet
    "apply_to_job": 30,        # Per application
    "follow_up": 10,           # Per follow-up
    "update_targets": 15,
    "collect_missing_info": 10,
    "refresh_state": 15
}

def estimate_task_time(task: Task) -> int:
    base = BASE_TIME_ESTIMATES.get(task.action_type, 20)
    
    # Adjust based on payload
    if task.action_type == "improve_resume":
        item_count = task.payload.get("item_count", 1)
        base *= item_count
    
    # Clamp to reasonable bounds
    return clamp(5, 120, base)
```

### 8.2 Time Budget Respect

```python
def fit_tasks_to_time_budget(tasks: List[Task], budget_minutes: int) -> List[Task]:
    # Greedy knapsack: highest priority first
    
    tasks_sorted = sorted(tasks, key=lambda t: t.priority, reverse=True)
    
    selected = []
    total_time = 0
    
    for task in tasks_sorted:
        if total_time + task.estimated_minutes <= budget_minutes:
            selected.append(task)
            total_time += task.estimated_minutes
        else:
            break
    
    return selected
```

---

## 9. Testing Requirements

### 9.1 Unit Tests

```python
# Priority Scoring
test("calculate_priority: bounded 0-100")
test("calculate_priority: impact dominates in IMPROVE mode")
test("calculate_priority: urgency kicks in with due_at")
test("tiebreaker: deterministic order")

# Weekly Target
test("calculate_weekly_target: respects user override")
test("calculate_weekly_target: mode-based defaults")
test("calculate_weekly_target: validates constraints")

# Validation
test("validate_weekly_plan: catches empty plan")
test("validate_daily_plan: catches excessive time")
```

### 9.2 Integration Tests

```python
# End-to-end plan generation
test("generate_weekly_plan: creates valid plan")
test("generate_daily_plan: selects appropriate tasks")

# Action execution
test("execute_improve_resume: calls Layer 3 correctly")
test("execute_apply_to_job: creates application")

# Error handling
test("Layer 2 failure: falls back gracefully")
test("Stale state: generates minimal plan")
```

### 9.3 Golden Tests

```python
GOLDEN_STATES = [
    {
        "name": "new_user_low_score",
        "state": {...},
        "expected_mode": "IMPROVE_RESUME_FIRST",
        "expected_target": 2,
        "expected_focus": {"resume_improvement": 0.7, ...}
    },
    {
        "name": "active_user_healthy_pipeline",
        "state": {...},
        "expected_mode": "APPLY_MODE",
        "expected_target": 10,
        "expected_focus": {"applications": 0.6, ...}
    },
    # 20+ golden cases
]

for golden in GOLDEN_STATES:
    test(f"golden_{golden.name}", async () => {
        plan = await generateWeeklyPlan(golden.state)
        assert plan.strategy_mode == golden.expected_mode
        assert plan.target_applications == golden.expected_target
        // ...
    })
```

---

## 10. Performance Requirements

### 10.1 Latency Targets (p95)

```
- generate_weekly_plan(): <2s
- generate_daily_plan(): <1s
- calculate_priority(): <50ms (per task)
- execute_improve_resume(): <5s (depends on Layer 3)
```

### 10.2 Throughput

```
- Support 10,000 concurrent users
- Handle 100 plan generations/second
```

### 10.3 Caching Strategy

```python
# Weekly plans: Cache for plan validity period (until re-plan trigger)
cache_key = f"weekly_plan:{user_id}:{state_version}"
ttl = 7 * 24 * 3600  # 7 days

# Daily plans: Cache for 1 day
cache_key = f"daily_plan:{user_id}:{date}"
ttl = 24 * 3600  # 1 day

# Invalidation: On state_version change
```

---

## 11. Edge Cases & Fallbacks

**Case 1: User with no resume**
```python
if not state.resume.master_resume_id:
    # Cannot plan, prompt user to upload
    return MinimalPlan(
        tasks=[create_upload_resume_task()],
        message="Please upload your resume to get started"
    )
```

**Case 2: User ignores plan for 2 weeks**
```python
if plan_age_days > 14:
    # Plan too old, regenerate
    return await generate_weekly_plan(user_id)
```

**Case 3: All tasks completed mid-week**
```python
if all_tasks_completed(weekly_plan) and day < "Friday":
    # Generate bonus tasks or adjust target upward
    return await generate_bonus_tasks(user_id)
```

**Case 4: Conflicting user action (user applies despite IMPROVE mode)**
```python
# Allow but log deviation
await Layer4.logEvent({
    eventType: EventType.PLAN_DEVIATION,
    context: {
        expected_mode: "IMPROVE_RESUME_FIRST",
        user_action: "apply_to_job",
        reason: "User override"
    }
})
```

---

# PART II: FUTURE ROADMAP

## Phase 2: Enhanced Features (Weeks 9-12)

### 2.1 Multi-Day Lookahead

Generate plans for next 3-7 days with task dependencies and resource allocation.

### 2.2 Adaptive Time Estimation

Learn from user's actual completion times to improve estimates.

### 2.3 Conflict Resolution

Automatically resolve competing actions (e.g., improve resume vs apply to hot job).

---

## Phase 3: Machine Learning Integration (Months 4-6)

### 3.1 ML-Based Prioritization

Train model on outcome data to predict task effectiveness.

### 3.2 Personalized Planning

Adapt plan structure to user preferences (morning person vs night owl, batch vs spread).

### 3.3 Outcome-Linked Optimization

Adjust targets and priorities based on what works for similar users.

---

## Phase 4: Advanced Features (Months 6+)

### 4.1 Multi-Goal Optimization

Balance competing goals (speed vs quality, breadth vs depth).

### 4.2 Resource Allocation

Optimize across time, energy, and mental load.

### 4.3 Proactive Intervention

Detect user struggles and adapt plan in real-time.

---

**END OF SPECIFICATION**

**Version:** 1.2 (P0 fixes applied + simplified blueprint handling)
**Status:** Ready for Implementation
**Last Updated:** December 16, 2025
**Next:** External review → Start coding
