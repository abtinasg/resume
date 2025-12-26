# Layer 5 - Orchestrator (The Decision-Making Brain) 🧠

Layer 5 is **THE BRAIN** of the career agent system. It coordinates all other layers to generate actionable plans and execute improvements.

## Overview

The Orchestrator is a **Stateless Decision Engine** that:
- **Reads** state from Layer 4 (Memory & State)
- **Uses** analysis from Layer 2 (Strategy Engine)
- **Calls** Layer 3 for resume rewriting
- **Calls** Layer 1 for re-scoring
- **Generates** weekly and daily plans
- **Executes** actions
- **Tracks** progress

## Key Innovations

### 1. Stateless Decision Making

All decisions are pure functions with no cached state:

```typescript
// Same inputs → Same outputs
Weekly Plan = f(Layer4 State, Layer2 Analysis, Config)
Daily Plan = f(Weekly Plan, Today's Context, Config)
Action Execution = f(Action, Current State)
```

This makes the system:
- **Reproducible**: Re-run with same inputs, get same outputs
- **Testable**: Unit test every decision path
- **Auditable**: Every decision can be traced

### 2. Evidence-Anchored Planning

Every task has `why_now` and `evidence_refs` that explain WHY it was recommended:

```typescript
{
  task_id: "task_abc123",
  action_type: "improve_resume",
  title: "Improve bullet: Helped with backend...",
  why_now: "Your resume score (68) is below 75 threshold",
  evidence_refs: ["state.resume.score=68", "config.resume_score_min=75"]
}
```

Benefits:
- **Transparency**: Users understand recommendations
- **Trust**: Decisions are justified, not arbitrary
- **Debugging**: Trace any recommendation to its source

### 3. Mode-Specific Logic

The orchestrator adapts to three strategy modes:

| Mode | Focus | Applications | Key Tasks |
|------|-------|-------------|-----------|
| `IMPROVE_RESUME_FIRST` | 70% resume | 0-3/week | Bullet improvements, skill additions |
| `APPLY_MODE` | 50% applications | 8-12/week | Job applications, follow-ups |
| `RETHINK_TARGETS` | 40% strategy | 3-5/week | Target review, resume repositioning |

## Architecture

```
lib/layers/layer5/
├── index.ts                    # Public exports
├── types.ts                    # TypeScript interfaces + Zod schemas
├── orchestrator.ts             # Main orchestration facade
├── errors.ts                   # Error handling
├── planning/
│   ├── weekly-planner.ts       # Generate weekly plans
│   ├── daily-planner.ts        # Generate daily plans
│   ├── task-generator.ts       # Create tasks from blueprints
│   ├── priority-scorer.ts      # Score task priority
│   └── index.ts
├── execution/
│   ├── action-executor.ts      # Execute individual actions
│   ├── resume-actions.ts       # Resume improvement actions
│   ├── application-actions.ts  # Application submission actions
│   ├── followup-actions.ts     # Follow-up actions
│   └── index.ts
├── tracking/
│   ├── progress-tracker.ts     # Track plan progress
│   ├── completion-checker.ts   # Check task completion
│   ├── replan-trigger.ts       # Decide when to re-plan
│   └── index.ts
├── state/
│   ├── state-validator.ts      # Validate state freshness
│   ├── staleness-handler.ts    # Handle stale state
│   └── index.ts
├── config/
│   ├── orchestrator_config.json
│   ├── task_templates.json
│   ├── loader.ts
│   └── index.ts
└── __tests__/
```

## Usage

### Basic Orchestration

```typescript
import { orchestrate } from '@/lib/layers/layer5';

// Get state and analysis from other layers
const state = await layer4.getUserState(userId);
const analysis = await layer2.analyzeStrategy({ state });

// Orchestrate planning
const { weeklyPlan, dailyPlan, context, replanNeeded } = orchestrate(
  state,
  analysis
);

// Access today's tasks
for (const task of dailyPlan.tasks) {
  console.log(`${task.title} - ${task.why_now}`);
}
```

### Generate Weekly Plan

```typescript
import { orchestrateWeeklyPlan } from '@/lib/layers/layer5';

const weeklyPlan = orchestrateWeeklyPlan(state, analysis);

console.log(`Mode: ${weeklyPlan.strategy_mode}`);
console.log(`Target Apps: ${weeklyPlan.target_applications}`);
console.log(`Tasks: ${weeklyPlan.task_pool.length}`);
```

### Generate Daily Plan

```typescript
import { orchestrateDailyPlan } from '@/lib/layers/layer5';

const dailyPlan = orchestrateDailyPlan(weeklyPlan, state);

console.log(`Today's Focus: ${dailyPlan.focus_area}`);
console.log(`Tasks: ${dailyPlan.tasks.length}`);
console.log(`Time: ${dailyPlan.total_estimated_minutes} minutes`);
```

### Execute Actions

```typescript
import { orchestrateAction } from '@/lib/layers/layer5';

const task = dailyPlan.tasks[0];
const execution = await orchestrateAction(task, state);

if (execution.result?.success) {
  console.log('Task completed!');
  console.log(`Score gain: ${execution.result.actual_score_gain}`);
}
```

### Track Progress

```typescript
import { trackWeeklyProgress } from '@/lib/layers/layer5';

const progress = trackWeeklyProgress(weeklyPlan, state);

console.log(`Completion: ${progress.completion_percentage}%`);
console.log(`Completed: ${progress.completed_tasks}/${progress.total_tasks}`);

if (progress.blockers.length > 0) {
  console.log('Blockers:', progress.blockers.map(b => b.description));
}
```

### Check Re-planning

```typescript
import { checkReplanNeeded } from '@/lib/layers/layer5';

const trigger = checkReplanNeeded(weeklyPlan, dailyPlan, state, analysis);

if (trigger.should_replan) {
  console.log(`Re-plan needed: ${trigger.reason}`);
  console.log(`Type: ${trigger.plan_type}`);
  console.log(`Urgency: ${trigger.urgency}`);
}
```

## Configuration

### Orchestrator Config (`orchestrator_config.json`)

```json
{
  "weekly_planning": {
    "default_app_target": 10,
    "min_app_target": 3,
    "max_app_target": 30,
    "task_pool_max": 50
  },
  "daily_planning": {
    "max_tasks_per_day": 5,
    "time_budget_minutes": 120,
    "require_one_high_priority": true
  },
  "priority_scoring": {
    "impact_weight": 0.40,
    "urgency_weight": 0.35,
    "alignment_weight": 0.25
  }
}
```

### Task Templates (`task_templates.json`)

```json
{
  "improve_bullet": {
    "title": "Improve bullet: {bullet_preview}",
    "description": "Enhance your resume bullet to be more impactful",
    "estimated_minutes": 5,
    "execution": "auto",
    "category": "resume_improvement"
  }
}
```

## Priority Scoring

Tasks are prioritized using a weighted formula:

```
Priority = Impact×0.40 + Urgency×0.35 + Alignment×0.25 - TimeCost - Penalties
```

### Factors

| Factor | Description | Range |
|--------|-------------|-------|
| **Impact** | How much does this move the needle? | 0-100 |
| **Urgency** | How time-sensitive is this? | 0-100 |
| **Alignment** | Does this fit current mode? | 0-100 |
| **Time Cost** | How long will this take? | 0-100 |
| **Penalties** | Conflicting goals, stale state, etc. | 0-50 |

## Integration with Other Layers

### Layer 4 (State)

```typescript
// Layer 5 reads state from Layer 4
const state: Layer4StateForLayer5 = {
  pipeline_state: { ... },
  user_profile: { ... },
  resume: { ... },
  freshness: { ... },
  followups: { ... }
};
```

### Layer 2 (Strategy)

```typescript
// Layer 5 uses analysis from Layer 2
const analysis: Layer2AnalysisForLayer5 = {
  recommended_mode: StrategyMode.APPLY_MODE,
  action_blueprints: [ ... ],
  gaps: { ... },
  mode_reasoning: { ... }
};
```

### Layer 3 (Execution)

```typescript
// Layer 5 calls Layer 3 for rewriting
const result = await layer3.rewriteBullet({
  bullet: task.payload.bullet,
  target_role: state.user_profile.target_roles[0]
});
```

### Layer 1 (Evaluation)

```typescript
// Layer 5 calls Layer 1 for re-scoring
const newScore = await layer1.evaluate(updatedResume);
```

## Error Handling

```typescript
import { OrchestratorError, OrchestratorErrorCode } from '@/lib/layers/layer5';

try {
  const plan = orchestrateWeeklyPlan(state, analysis);
} catch (error) {
  if (error instanceof OrchestratorError) {
    console.log(`Error: ${error.code}`);
    console.log(`Message: ${error.userMessage}`);
    console.log(`Recoverable: ${error.recoverable}`);
  }
}
```

## Testing

```bash
# Run all Layer 5 tests
npm test -- --testPathPattern=layer5

# Run specific test file
npm test -- lib/layers/layer5/__tests__/weekly-planning.test.ts

# Run with coverage
npm test -- --coverage --testPathPattern=layer5
```

## Performance Requirements

| Operation | Target | Actual |
|-----------|--------|--------|
| Weekly Plan Generation | <500ms | ✅ |
| Daily Plan Generation | <200ms | ✅ |
| Action Execution | <5s | ✅ |
| Progress Tracking | <100ms | ✅ |

## Why This Matters

### For Users
- **Clear Guidance**: Know exactly what to do today
- **Evidence-Based**: Understand why each task is recommended
- **Personalized**: Plans adapt to their specific situation

### For the System
- **Coordination**: All layers work together coherently
- **Reliability**: Deterministic outputs, no surprises
- **Maintainability**: Pure functions are easy to test and debug

### For Trust
- **Transparency**: Every decision is traceable
- **Accountability**: Evidence anchoring prevents arbitrary recommendations
- **Consistency**: Same inputs always produce same outputs

---

**Layer 5 is THE BRAIN. Quality matters.** 🧠
