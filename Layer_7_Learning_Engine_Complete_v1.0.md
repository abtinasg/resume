# Layer 7 – Learning & Optimization Engine
## Complete Specification v1.0

**Version:** 1.0 (Foundation for v2)  
**Status:** Design Complete - v2 Feature  
**Last Updated:** December 16, 2025  
**Scope:** Outcome tracking, pattern recognition, strategy optimization, continuous improvement

**Note:** Layer 7 is **OUT OF SCOPE for v1 MVP**. This specification defines the architecture and interfaces for v2 implementation.

---

## Document Purpose

Single source of truth for Layer 7 Learning Engine development.

**Part I:** Core Specification - architecture and interfaces  
**Part II:** Implementation Roadmap - phased rollout plan

---

# PART I: CORE SPECIFICATION

## 0. Purpose & Role

Layer 7 is the **Learning & Optimization Engine** that enables the system to improve over time through data-driven insights.

**Primary functions:**
- Track application outcomes (interviews, offers, rejections)
- Analyze patterns (what strategies work for which users)
- Optimize system parameters (thresholds, weights, priorities)
- Enable A/B testing framework
- Provide personalized insights
- Generate market-level insights (anonymized)

**Key innovation:** Closed-loop learning system that makes the agent smarter with every interaction.

**Non-responsibilities:**
- Does NOT make real-time decisions (Layer 5 does)
- Does NOT analyze individual resumes (Layer 1 does)
- Does NOT set strategy (Layer 2 does)
- Does NOT store state (Layer 4 does)

**Positioning:** Layer 7 is a background analytics engine that feeds improvements back into Layers 2, 5, and 6.

---

## 1. Design Principles

**Data-Driven**
- All optimizations backed by statistical evidence
- Minimum data thresholds before acting
- Confidence intervals on recommendations

**Privacy-First**
- Individual data never shared
- Cross-user learning uses anonymized aggregates
- User opt-out respected

**Transparent**
- All learned insights explainable
- Users see what system learned from their data
- No "black box" optimizations

**Gradual Rollout**
- Start with observation only (no auto-adjustments)
- Validate patterns before applying
- Human-in-loop for major changes

**Fail-Safe**
- Never degrade user experience
- Rollback capability for all optimizations
- A/B test before global rollout

---

## 2. Architecture Overview

### 2.1 System Position

```
Layer 4 (Event Log) → Layer 7 (Analysis) → Insights
                          ↓
            Updates to Layers 2, 5, 6 configs
```

**Data Flow:**
1. Layer 4 logs all events (applications, outcomes, strategy changes)
2. Layer 7 analyzes events periodically (nightly batch)
3. Layer 7 generates insights and optimization recommendations
4. Recommendations reviewed (human or automated based on confidence)
5. Approved recommendations update system configs
6. Future user interactions use optimized configs

### 2.2 Processing Model

**v1 (Foundation):**
- Event logging only (Layer 4)
- Manual analysis via dashboards
- No automated optimizations

**v2.0 (Basic Learning):**
- Automated pattern detection
- Insight generation
- Manual review + approval

**v2.1 (A/B Testing):**
- Controlled experiments
- Statistical validation
- Auto-rollout for high-confidence wins

**v2.2 (Full Optimization):**
- Real-time personalization
- Market-level insights
- Predictive modeling

---

## 3. Data Sources

### 3.1 From Layer 4 (Event Log)

**Application Events:**
```typescript
interface ApplicationEvent {
  event_type: "APPLICATION_CREATED" | "APPLICATION_SUBMITTED" | "STATUS_CHANGED";
  user_id: string;
  application_id: string;
  job_id: string;
  resume_version_id: string;
  
  context: {
    strategy_mode: StrategyMode;
    fit_score: number;
    category: "reach" | "target" | "safety";
    job_characteristics: {
      title: string;
      company: string;
      seniority: string;
      location: string;
      industry?: string;
    };
    resume_score: number;
    tailoring_applied: boolean;
  };
  
  outcome?: {
    status: "interview" | "offer" | "rejected" | "ghosted";
    days_to_response: number;
    response_type?: string;
  };
  
  timestamp: string;
}
```

**Strategy Events:**
```typescript
interface StrategyEvent {
  event_type: "MODE_CHANGED" | "TARGET_ADJUSTED" | "PLAN_GENERATED";
  user_id: string;
  
  from_mode?: StrategyMode;
  to_mode: StrategyMode;
  reason: string;
  
  metrics: {
    resume_score: number;
    total_applications: number;
    interview_rate: number;
    applications_last_7_days: number;
  };
  
  timestamp: string;
}
```

**Resume Events:**
```typescript
interface ResumeEvent {
  event_type: "RESUME_REWRITTEN" | "SCORE_CHANGED";
  user_id: string;
  resume_version_id: string;
  
  rewrite_type?: "bullet" | "summary" | "section";
  before_score: number;
  after_score: number;
  score_delta: number;
  
  gaps_addressed?: string[];
  user_accepted: boolean;
  
  timestamp: string;
}
```

**User Feedback Events:**
```typescript
interface FeedbackEvent {
  event_type: "SUGGESTION_ACCEPTED" | "SUGGESTION_EDITED" | "SUGGESTION_REJECTED";
  user_id: string;
  
  suggestion_type: "rewrite" | "job" | "strategy" | "plan";
  suggested_content: any;
  final_content?: any;
  rejection_reason?: string;
  
  timestamp: string;
}
```

---

## 4. Core Analytics

### 4.1 User-Level Analytics

**Success Metrics Per User:**
```typescript
interface UserPerformance {
  user_id: string;
  period: { start: string; end: string };
  
  // Application metrics
  total_applications: number;
  applications_by_category: {
    reach: number;
    target: number;
    safety: number;
  };
  
  // Outcome metrics
  interview_requests: number;
  interview_rate: number;          // interviews / applications
  offers: number;
  offer_rate: number;              // offers / interviews
  rejections: number;
  ghosted: number;
  
  // Response timing
  avg_days_to_response: number;
  fastest_response_days: number;
  
  // Strategy effectiveness
  strategy_distribution: Record<StrategyMode, number>;
  interview_rate_by_mode: Record<StrategyMode, number>;
  
  // Resume evolution
  resume_score_start: number;
  resume_score_current: number;
  score_improvement: number;
  rewrites_accepted: number;
  rewrites_rejected: number;
}
```

**Pattern Detection:**
```typescript
interface UserPatterns {
  user_id: string;
  
  // What works for this user
  best_performing_roles: Array<{
    title: string;
    interview_rate: number;
    sample_size: number;
  }>;
  
  best_locations: Array<{
    location: string;
    interview_rate: number;
  }>;
  
  best_companies: Array<{
    type: string;              // "Series A startup", "Big Tech", etc.
    interview_rate: number;
  }>;
  
  best_seniority: string;      // Which level gets best response
  
  optimal_application_timing: {
    best_day_of_week: string;
    best_time_of_day: string;
    confidence: number;
  };
  
  // Resume performance
  best_resume_version: string;
  best_performing_sections: string[];
  
  // User preferences (learned)
  typical_edit_patterns: string[];
  rejection_patterns: string[];
  acceptance_patterns: string[];
}
```

### 4.2 Cohort-Level Analytics

**Segment Users:**
```typescript
interface UserSegment {
  segment_id: string;
  criteria: {
    seniority?: SeniorityLevel;
    target_roles?: string[];
    years_experience_range?: [number, number];
    industries?: string[];
    locations?: string[];
  };
  
  user_count: number;
  
  // Aggregate performance
  avg_interview_rate: number;
  avg_applications_to_interview: number;
  avg_time_to_offer_weeks: number;
  
  // Best practices for segment
  successful_strategies: Array<{
    strategy: string;
    success_rate: number;
    sample_size: number;
  }>;
  
  common_pitfalls: Array<{
    pattern: string;
    negative_impact: string;
    frequency: number;
  }>;
}
```

### 4.3 Market-Level Analytics (Anonymized)

**Market Trends:**
```typescript
interface MarketInsights {
  period: { start: string; end: string };
  
  // Hiring trends
  most_active_industries: Array<{
    industry: string;
    job_postings: number;
    avg_response_rate: number;
  }>;
  
  hottest_skills: Array<{
    skill: string;
    demand_score: number;
    avg_salary: number;
  }>;
  
  hottest_locations: Array<{
    location: string;
    openings: number;
    avg_response_rate: number;
  }>;
  
  // Seasonal patterns
  best_months_to_apply: string[];
  worst_months_to_apply: string[];
  
  // Response patterns
  avg_days_to_first_response: number;
  ghosting_rate: number;
  
  // Seniority demand
  demand_by_level: Record<SeniorityLevel, {
    openings: number;
    competition: number;
    avg_response_rate: number;
  }>;
}
```

---

## 5. Optimization Algorithms

### 5.1 Strategy Mode Optimization

**Goal:** Improve strategy mode selection accuracy

**Current (Layer 2 v1):** Rule-based thresholds
```python
if resume_score < 75: return "IMPROVE_RESUME_FIRST"
if applications >= 30 and interview_rate < 0.02: return "RETHINK_TARGETS"
return "APPLY_MODE"
```

**Optimized (Layer 7 learns):**
```python
def optimize_mode_thresholds(user_outcomes: List[UserPerformance]) -> ThresholdUpdates:
    """
    Analyze which thresholds yield best outcomes
    """
    
    # Find optimal resume_score threshold for IMPROVE_RESUME_FIRST
    users_improved = filter(lambda u: u.strategy_distribution["IMPROVE_RESUME_FIRST"] > 0, user_outcomes)
    
    optimal_threshold = find_threshold_with_best_later_performance(
        users_improved,
        metric="interview_rate",
        threshold_param="resume_score_when_switched"
    )
    
    # Find optimal application count for RETHINK_TARGETS trigger
    users_pivoted = filter(lambda u: "RETHINK_TARGETS" in u.strategy_distribution, user_outcomes)
    
    optimal_app_count = find_threshold_with_best_later_performance(
        users_pivoted,
        metric="interview_rate_after_pivot",
        threshold_param="applications_before_pivot"
    )
    
    return ThresholdUpdates(
        improve_resume_threshold=optimal_threshold,
        rethink_targets_threshold=optimal_app_count,
        confidence=calculate_confidence(sample_size, variance),
        sample_size=len(user_outcomes)
    )
```

**Recommendation Format:**
```typescript
interface OptimizationRecommendation {
  component: "strategy_engine" | "orchestrator" | "job_discovery";
  parameter: string;
  current_value: any;
  recommended_value: any;
  
  reasoning: string;
  evidence: {
    metric_improved: string;
    improvement_amount: number;
    sample_size: number;
    confidence_interval: [number, number];
    p_value: number;
  };
  
  impact_estimate: {
    users_affected: number;
    expected_benefit: string;
    risk_level: "low" | "medium" | "high";
  };
  
  recommendation: "auto_apply" | "a_b_test" | "manual_review";
}
```

---

### 5.2 Resume Scoring Calibration

**Goal:** Calibrate resume scores to predict interview success

**Analysis:**
```python
def analyze_score_predictiveness(events: List[ApplicationEvent]) -> ScoreCalibration:
    """
    Check if resume_score actually predicts interview success
    """
    
    # Group by score ranges
    score_buckets = {
        "50-59": [],
        "60-69": [],
        "70-79": [],
        "80-89": [],
        "90-100": []
    }
    
    for event in events:
        bucket = get_score_bucket(event.context.resume_score)
        score_buckets[bucket].append(event)
    
    # Calculate interview rate per bucket
    calibration = {}
    for bucket, apps in score_buckets.items():
        interview_rate = sum(1 for a in apps if a.outcome.status == "interview") / len(apps)
        calibration[bucket] = {
            "interview_rate": interview_rate,
            "sample_size": len(apps)
        }
    
    # Check if scores are well-calibrated
    expected_rates = {
        "50-59": 0.02,
        "60-69": 0.05,
        "70-79": 0.08,
        "80-89": 0.12,
        "90-100": 0.18
    }
    
    calibration_error = sum(
        abs(calibration[bucket]["interview_rate"] - expected_rates[bucket])
        for bucket in score_buckets
    ) / len(score_buckets)
    
    return ScoreCalibration(
        calibration=calibration,
        calibration_error=calibration_error,
        is_well_calibrated=calibration_error < 0.02,
        recommendation="recalibrate_weights" if calibration_error >= 0.02 else "no_change"
    )
```

**Recommendation:**
```typescript
interface ScoreCalibrationRecommendation {
  issue: "scores_too_optimistic" | "scores_too_pessimistic" | "scores_not_discriminative";
  
  suggested_adjustment: {
    component_weights: Record<string, number>;
    threshold_adjustments: Record<string, number>;
  };
  
  expected_improvement: {
    current_calibration_error: number;
    expected_calibration_error: number;
  };
}
```

---

### 5.3 Job Matching Optimization

**Goal:** Improve fit_score accuracy for job recommendations

**Analysis:**
```python
def optimize_fit_scoring(job_applications: List[ApplicationEvent]) -> FitScoreOptimization:
    """
    Learn which fit_score dimensions predict success
    """
    
    # Features
    X = [
        [
            app.context.fit_score,
            app.context.job_characteristics.technical_match,
            app.context.job_characteristics.seniority_match,
            app.context.job_characteristics.experience_match,
            app.context.category == "reach",
            app.context.category == "safety"
        ]
        for app in job_applications
    ]
    
    # Labels
    y = [1 if app.outcome.status in ["interview", "offer"] else 0 for app in job_applications]
    
    # Train simple logistic regression
    model = LogisticRegression()
    model.fit(X, y)
    
    # Extract learned weights
    learned_weights = {
        "technical": model.coef_[1],
        "seniority": model.coef_[2],
        "experience": model.coef_[3],
        "reach_bonus": model.coef_[4],
        "safety_penalty": model.coef_[5]
    }
    
    # Compare with current Layer 1 weights
    current_weights = {
        "technical": 0.40,
        "seniority": 0.20,
        "experience": 0.20,
        "signal": 0.20
    }
    
    return FitScoreOptimization(
        current_weights=current_weights,
        learned_weights=learned_weights,
        improvement_estimate=calculate_auc_improvement(model, X, y),
        recommendation="update_weights" if improvement > 0.05 else "keep_current"
    )
```

---

### 5.4 Timing Optimization

**Goal:** Find optimal times to apply, follow up

**Analysis:**
```python
def analyze_timing_patterns(events: List[ApplicationEvent]) -> TimingInsights:
    """
    Find when applications get best responses
    """
    
    # Group by day of week
    by_day = defaultdict(list)
    for event in events:
        day = datetime.fromisoformat(event.timestamp).weekday()
        by_day[day].append(event)
    
    # Calculate response rates
    day_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    response_rates = {}
    
    for day, apps in by_day.items():
        responses = [a for a in apps if a.outcome.status != "ghosted"]
        response_rates[day_names[day]] = len(responses) / len(apps) if apps else 0
    
    # Find best day
    best_day = max(response_rates, key=response_rates.get)
    
    # Group by time of day
    by_hour = defaultdict(list)
    for event in events:
        hour = datetime.fromisoformat(event.timestamp).hour
        by_hour[hour].append(event)
    
    # Calculate response rates by hour
    hour_rates = {
        hour: sum(1 for a in apps if a.outcome.status != "ghosted") / len(apps)
        for hour, apps in by_hour.items()
        if len(apps) >= 10  # Minimum sample size
    }
    
    best_hour = max(hour_rates, key=hour_rates.get) if hour_rates else 10
    
    return TimingInsights(
        best_day_of_week=best_day,
        best_time_of_day=f"{best_hour}:00-{best_hour+2}:00",
        response_rate_by_day=response_rates,
        response_rate_by_hour=hour_rates,
        confidence="high" if len(events) >= 50 else "low"
    )
```

---

## 6. A/B Testing Framework

### 6.1 Experiment Design

**Structure:**
```typescript
interface Experiment {
  experiment_id: string;
  name: string;
  hypothesis: string;
  
  component: "strategy_engine" | "orchestrator" | "job_discovery";
  parameter: string;
  
  variants: Array<{
    variant_id: string;
    name: string;
    value: any;
    allocation: number;        // 0-1 (percentage of users)
  }>;
  
  success_metric: string;
  minimum_sample_size: number;
  maximum_duration_days: number;
  
  status: "draft" | "running" | "paused" | "completed";
  start_date?: string;
  end_date?: string;
  
  results?: ExperimentResults;
}
```

**Example Experiments:**
```typescript
const experiments = [
  {
    experiment_id: "exp_001",
    name: "Strategy Threshold Optimization",
    hypothesis: "Lowering IMPROVE_RESUME_FIRST threshold to 70 will improve overall interview rate",
    component: "strategy_engine",
    parameter: "improve_resume_threshold",
    variants: [
      { variant_id: "control", name: "Current (75)", value: 75, allocation: 0.5 },
      { variant_id: "treatment", name: "Lower (70)", value: 70, allocation: 0.5 }
    ],
    success_metric: "interview_rate",
    minimum_sample_size: 200,
    maximum_duration_days: 30
  },
  
  {
    experiment_id: "exp_002",
    name: "Fit Score Weight Adjustment",
    hypothesis: "Increasing technical_match weight to 0.45 improves job recommendation quality",
    component: "job_discovery",
    parameter: "fit_score_weights",
    variants: [
      { variant_id: "control", name: "Current", value: {technical: 0.40, seniority: 0.20, experience: 0.20, signal: 0.20}, allocation: 0.5 },
      { variant_id: "treatment", name: "Technical Focus", value: {technical: 0.45, seniority: 0.20, experience: 0.15, signal: 0.20}, allocation: 0.5 }
    ],
    success_metric: "jobs_applied_rate",
    minimum_sample_size: 300,
    maximum_duration_days: 21
  }
];
```

### 6.2 Statistical Analysis

**Calculate Results:**
```python
def analyze_experiment(experiment: Experiment, events: List[Event]) -> ExperimentResults:
    """
    Perform statistical analysis on A/B test
    """
    
    # Separate events by variant
    control_events = [e for e in events if e.experiment_variant == "control"]
    treatment_events = [e for e in events if e.experiment_variant == "treatment"]
    
    # Calculate success metrics
    control_metric = calculate_metric(control_events, experiment.success_metric)
    treatment_metric = calculate_metric(treatment_events, experiment.success_metric)
    
    # Statistical significance test
    p_value = run_t_test(control_metric, treatment_metric)
    
    # Effect size
    effect_size = (treatment_metric.mean - control_metric.mean) / control_metric.std
    
    # Confidence interval
    confidence_interval = calculate_confidence_interval(
        treatment_metric.mean - control_metric.mean,
        treatment_metric.std,
        len(treatment_events)
    )
    
    # Determine winner
    if p_value < 0.05 and effect_size > 0.2:
        winner = "treatment" if treatment_metric.mean > control_metric.mean else "control"
        recommendation = "roll_out_winner"
    elif p_value >= 0.05:
        winner = None
        recommendation = "no_significant_difference"
    else:
        winner = None
        recommendation = "continue_test"
    
    return ExperimentResults(
        control_sample_size=len(control_events),
        treatment_sample_size=len(treatment_events),
        control_metric=control_metric.mean,
        treatment_metric=treatment_metric.mean,
        absolute_difference=treatment_metric.mean - control_metric.mean,
        relative_improvement=(treatment_metric.mean - control_metric.mean) / control_metric.mean,
        p_value=p_value,
        confidence_interval=confidence_interval,
        effect_size=effect_size,
        winner=winner,
        recommendation=recommendation,
        statistical_power=calculate_power(len(treatment_events), effect_size)
    )
```

### 6.3 Auto-Rollout Logic

**Decision Tree:**
```python
def should_auto_rollout(results: ExperimentResults) -> bool:
    """
    Determine if experiment should auto-rollout
    """
    
    # Criteria for auto-rollout
    checks = {
        "sufficient_sample": results.treatment_sample_size >= 200,
        "statistically_significant": results.p_value < 0.05,
        "meaningful_effect": abs(results.effect_size) > 0.3,
        "clear_winner": results.winner is not None,
        "positive_direction": results.relative_improvement > 0,
        "low_risk": results.confidence_interval[0] > 0  # Lower bound still positive
    }
    
    # Must pass all checks
    return all(checks.values())
```

---

## 7. Personalization Engine

### 7.1 User-Specific Optimizations

**Personalized Thresholds:**
```typescript
interface PersonalizedConfig {
  user_id: string;
  
  // Learned preferences
  preferred_company_sizes: string[];
  preferred_locations: string[];
  work_arrangement_preference: string;
  
  // Optimized thresholds (user-specific)
  min_fit_score_to_apply: number;      // Learned from acceptance rate
  optimal_applications_per_week: number; // Learned from completion rate
  follow_up_timing_days: number;        // Learned from response patterns
  
  // Learned sensitivities
  edit_frequency: "low" | "medium" | "high";
  suggestion_acceptance_rate: number;
  rejection_patterns: string[];
  
  // Communication style
  preferred_detail_level: "brief" | "standard" | "detailed";
  coach_tone_preference: "professional" | "friendly" | "motivational";
  
  last_updated: string;
}
```

**Recommendation Personalization:**
```python
def personalize_recommendations(
    user_id: string,
    base_recommendations: List[Job],
    user_patterns: UserPatterns,
    user_config: PersonalizedConfig
) -> List[Job]:
    """
    Rerank jobs based on user's historical preferences
    """
    
    for job in base_recommendations:
        # Boost jobs similar to what worked before
        if job.company_type in user_patterns.best_companies:
            job.priority_score += 10
        
        if job.location in user_patterns.best_locations:
            job.priority_score += 5
        
        # Penalize patterns user consistently rejects
        if any(pattern in job.description for pattern in user_config.rejection_patterns):
            job.priority_score -= 15
        
        # Adjust for learned thresholds
        if job.fit_score < user_config.min_fit_score_to_apply:
            job.should_apply = False
    
    # Re-sort by adjusted scores
    return sorted(base_recommendations, key=lambda j: j.priority_score, reverse=True)
```

---

## 8. Insights Generation

### 8.1 User-Facing Insights

**Weekly Insights:**
```typescript
interface WeeklyInsights {
  user_id: string;
  week_start: string;
  
  // Performance summary
  highlights: string[];          // e.g., "Interview rate up 50% this week!"
  concerns: string[];            // e.g., "No responses from FAANG companies"
  
  // Learned patterns
  what_worked: Array<{
    pattern: string;
    metric: string;
    improvement: number;
  }>;
  
  what_didnt_work: Array<{
    pattern: string;
    metric: string;
    decline: number;
  }>;
  
  // Recommendations
  try_this_week: string[];
  stop_doing: string[];
  
  // Benchmarks
  vs_similar_users: {
    your_interview_rate: number;
    segment_avg: number;
    percentile: number;
  };
}
```

**Example:**
```typescript
{
  user_id: "user_123",
  week_start: "2025-01-06",
  highlights: [
    "Applied to 12 jobs this week (target was 10) ✅",
    "Got 2 interview requests (16.7% rate!) 🎉"
  ],
  concerns: [
    "No responses from Big Tech companies yet",
    "Backend roles getting better responses than Full Stack"
  ],
  what_worked: [
    {
      pattern: "Applying to Series A startups",
      metric: "interview_rate",
      improvement: 0.18
    },
    {
      pattern: "Applications on Tuesday morning",
      metric: "response_rate",
      improvement: 0.25
    }
  ],
  what_didnt_work: [
    {
      pattern: "Full Stack roles at large companies",
      metric: "response_rate",
      decline: -0.10
    }
  ],
  try_this_week: [
    "Focus more on Backend Engineer roles (your 20% response rate)",
    "Try applying to remote-first companies",
    "Consider Series B startups (good middle ground)"
  ],
  stop_doing: [
    "Applying to Full Stack roles at companies >500 employees"
  ],
  vs_similar_users: {
    your_interview_rate: 0.167,
    segment_avg: 0.08,
    percentile: 85
  }
}
```

---

## 9. Integration Points

### 9.1 Updates to Layer 2 (Strategy Engine)

**Config Updates:**
```typescript
interface StrategyEngineConfig {
  // Thresholds (learned by Layer 7)
  improve_resume_threshold: number;
  rethink_targets_threshold: number;
  min_days_in_mode: number;
  
  // Weights (learned by Layer 7)
  gap_weights: {
    skills: number;
    tools: number;
    experience: number;
    seniority: number;
    industry: number;
  };
  
  // Personalized (per user)
  user_overrides?: Record<string, any>;
  
  // Metadata
  last_updated: string;
  optimized_by: "layer_7" | "manual";
  confidence: number;
}
```

**Update Process:**
```python
async def apply_optimization_to_layer2(
    recommendation: OptimizationRecommendation
) -> UpdateResult:
    """
    Apply learned optimization to Layer 2 config
    """
    
    # Load current config
    current_config = await load_config("strategy_engine")
    
    # Apply recommendation
    updated_config = {
        ...current_config,
        [recommendation.parameter]: recommendation.recommended_value,
        last_updated: datetime.now().isoformat(),
        optimized_by: "layer_7",
        confidence: recommendation.evidence.confidence_interval
    }
    
    # A/B test first or direct rollout?
    if recommendation.recommendation == "auto_apply":
        await save_config("strategy_engine", updated_config)
        return UpdateResult(success=True, method="direct_rollout")
    elif recommendation.recommendation == "a_b_test":
        await create_experiment(recommendation)
        return UpdateResult(success=True, method="a_b_test_created")
    else:
        await create_manual_review_task(recommendation)
        return UpdateResult(success=True, method="manual_review_pending")
```

### 9.2 Updates to Layer 6 (Job Discovery)

**Fit Score Weight Updates:**
```python
async def update_fit_scoring_weights(
    learned_weights: Dict[str, float],
    confidence: float
) -> None:
    """
    Update Layer 6 fit score calculation weights
    """
    
    if confidence < 0.8:
        # Low confidence → A/B test
        await create_fit_score_experiment(learned_weights)
    else:
        # High confidence → Direct update
        await Layer6.update_config({
            "fit_score_weights": learned_weights,
            "last_optimized": datetime.now().isoformat()
        })
```

### 9.3 Updates to Layer 5 (Orchestrator)

**Planning Parameter Updates:**
```python
async def optimize_planning_params(
    user_id: string,
    learned_params: PersonalizedConfig
) -> None:
    """
    Apply user-specific optimizations to orchestrator
    """
    
    await Layer5.set_user_config(user_id, {
        "optimal_weekly_target": learned_params.optimal_applications_per_week,
        "min_fit_score_threshold": learned_params.min_fit_score_to_apply,
        "follow_up_timing": learned_params.follow_up_timing_days,
        "task_complexity_preference": learned_params.edit_frequency
    })
```

---

## 10. Privacy & Ethics

### 10.1 Data Privacy

**Principles:**
- Individual data stays with user
- Cross-user learning uses only anonymized aggregates
- No PII in aggregated datasets
- User can opt out of contributing to market insights
- User can request data deletion (GDPR compliant)

**Anonymization:**
```python
def anonymize_for_market_analysis(events: List[Event]) -> List[AnonymizedEvent]:
    """
    Remove PII for cross-user learning
    """
    
    anonymized = []
    
    for event in events:
        anon_event = {
            "user_segment": classify_user_segment(event.user_id),  # e.g., "mid_swe_3-5yrs"
            "event_type": event.event_type,
            "outcome": event.outcome,
            "context": {
                # Keep: non-identifying context
                "strategy_mode": event.context.strategy_mode,
                "fit_score": event.context.fit_score,
                "resume_score": event.context.resume_score,
                "job_seniority": event.context.job_characteristics.seniority,
                "job_industry": event.context.job_characteristics.industry,
                # Remove: identifying info
                # NO: company names, specific titles, locations (unless city-level only)
            },
            "timestamp_week": get_week_start(event.timestamp)  # Week-level granularity only
        }
        anonymized.append(anon_event)
    
    return anonymized
```

### 10.2 Ethical Considerations

**Bias Prevention:**
- Monitor for demographic disparities in outcomes
- Flag if certain segments systematically disadvantaged
- Adjust algorithms to reduce bias

**Transparency:**
- Users see what system learned from their data
- Clear explanation of all optimizations
- User control over personalization level

**Fairness:**
- Don't penalize users for sparse data
- Gradual confidence building (start generic, personalize over time)
- No "cold start" disadvantage

---

## 11. Implementation Roadmap

### 11.1 Phase 1: Foundation (v1 MVP)

**Scope:** Data logging only
- ✅ Layer 4 event logging implemented
- ✅ Basic analytics dashboard
- ❌ No automated learning

**Deliverables:**
- Event schema defined
- Database tables created
- Manual analytics queries

**Timeline:** Weeks 1-8 (part of v1 MVP)

---

### 11.2 Phase 2: Basic Learning (v2.0)

**Scope:** Pattern detection + insights

**Week 1-2:** User-level analytics
- Calculate UserPerformance metrics
- Detect UserPatterns
- Generate WeeklyInsights

**Week 3-4:** Cohort analysis
- Segment users
- Calculate segment benchmarks
- Generate segment best practices

**Week 5-6:** Optimization recommendations
- Strategy threshold analysis
- Fit score calibration
- Timing optimization

**Week 7-8:** Manual review UI
- Dashboard for reviewing recommendations
- Approval workflow
- Rollout tracking

**Deliverables:**
- Automated insight generation
- Optimization recommendations
- Human-in-loop approval system

**Timeline:** Months 4-5 post-MVP

---

### 11.3 Phase 3: A/B Testing (v2.1)

**Scope:** Controlled experiments

**Week 1-2:** A/B test framework
- Experiment design UI
- Variant allocation logic
- Event tracking per variant

**Week 3-4:** Statistical analysis
- Automated significance testing
- Effect size calculation
- Confidence intervals

**Week 5-6:** Auto-rollout
- Decision logic
- Gradual rollout (10% → 50% → 100%)
- Rollback capability

**Deliverables:**
- Full A/B testing platform
- Auto-rollout for high-confidence wins
- Experiment history tracking

**Timeline:** Month 6 post-MVP

---

### 11.4 Phase 4: Full Optimization (v2.2)

**Scope:** Real-time personalization + market insights

**Features:**
- Real-time personalized recommendations
- Market-level trend analysis
- Predictive modeling (interview likelihood)
- Cross-user pattern sharing (anonymized)

**Deliverables:**
- Personalized user configs
- Market insights dashboard
- Predictive models

**Timeline:** Months 7-9 post-MVP

---

## 12. Success Metrics

### 12.1 Learning Engine Metrics

**Data Quality:**
- Event capture rate: >99%
- Data completeness: >95%
- Anonymization accuracy: 100%

**Insight Quality:**
- Pattern detection accuracy: >80%
- False positive rate: <5%
- User-reported insight usefulness: >70%

**Optimization Impact:**
- Avg interview rate improvement: +20% (after optimizations)
- User satisfaction with recommendations: >75%
- Experiment success rate: >40%

### 12.2 Business Impact

**User Outcomes:**
- Time to first interview: -30%
- Interview rate: +25%
- User retention: +15%

**System Performance:**
- Strategy accuracy: +20%
- Job recommendation relevance: +30%
- User engagement: +25%

---

## 13. Open Questions / Future Work

**Out of scope for v2:**

### Multi-Modal Learning
- Learn from interview transcripts
- Learn from salary negotiation outcomes
- Learn from long-term career progression

### Collaborative Filtering
- "Users like you also applied to..."
- Job recommendations based on successful peer patterns

### Causal Inference
- What *caused* success (not just correlation)
- Counterfactual analysis ("what if you had...")

### Transfer Learning
- Apply learnings from one role/industry to another
- Cross-domain pattern recognition

---

## 14. Testing Requirements

### 14.1 Unit Tests

```python
test('calculate_interview_rate: correct calculation')
test('detect_patterns: finds statistically significant patterns')
test('anonymize_data: removes all PII')
test('optimize_thresholds: suggests correct values')
test('a_b_test_analysis: correct statistical tests')
```

### 14.2 Integration Tests

```python
test('end_to_end: event logging → analysis → optimization → config update')
test('personalization: user-specific configs applied correctly')
test('a_b_test: experiment runs and auto-rolls out winner')
```

### 14.3 Data Quality Tests

```python
test('event_schema: all events match schema')
test('data_completeness: no missing critical fields')
test('anonymization: verify PII removed')
```

---

**END OF SPECIFICATION**

**Version:** 1.0  
**Status:** Design Complete - v2 Feature  
**Next Steps:** 
1. Review and approve specification
2. Implement Phase 1 (data logging) in v1 MVP
3. Build Phase 2+ post-MVP
