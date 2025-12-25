# Layer 2 - Strategy Engine

> **Version:** 2.1 (MVP)  
> **Status:** Complete  
> **Dependencies:** Layer 1 (Evaluation Engine), Layer 4 (State & Pipeline)

## Overview

Layer 2 is the analytical core of the career agent architecture. It analyzes resume quality, application metrics, and target role requirements to:

1. **Compute Gap Analyses** - Skills, tools, experience, seniority, and industry gaps
2. **Calculate Fit Score** - Overall fit for target roles (0-100)
3. **Recommend Strategy Mode** - IMPROVE_RESUME_FIRST / APPLY_MODE / RETHINK_TARGETS
4. **Generate Action Blueprints** - Structured actions for Layer 5 (Orchestrator)

## Installation

Layer 2 is part of the main project and uses existing dependencies:

```bash
# Already installed
npm install zod  # For validation
```

## Quick Start

```typescript
import { analyzeStrategy } from '@/lib/layers/layer2';

// Perform complete analysis
const result = await analyzeStrategy({
  layer1_evaluation: {
    resume_score: 75,
    content_quality_score: 75,
    ats_compatibility_score: 78,
    weaknesses: [],
    identified_gaps: {
      weak_bullets: 2,
      missing_skills: [],
      vague_experience: false,
    },
    extracted: {
      skills: ['typescript', 'react', 'node.js'],
      tools: ['docker', 'git'],
      titles: ['Software Engineer'],
    },
  },
  layer4_state: {
    pipeline_state: {
      total_applications: 10,
      applications_last_7_days: 3,
      applications_last_30_days: 10,
      interview_requests: 1,
      interview_rate: 0.1,
      offers: 0,
      rejections: 5,
    },
    user_profile: {
      target_roles: ['Senior Software Engineer'],
      target_seniority: 'senior',
      years_experience: 5,
    },
  },
  job_context: {  // Optional
    job_requirements: {
      required_skills: ['typescript', 'react', 'aws'],
      required_tools: ['docker', 'kubernetes'],
      seniority_expected: 'senior',
    },
  },
});

console.log(result.recommended_mode); // 'APPLY_MODE'
console.log(result.overall_fit_score); // 78
console.log(result.action_blueprints);
```

## Strategy Modes

### IMPROVE_RESUME_FIRST

**Triggered when:** `resume_score < 75`

Focus on improving resume quality before applying to jobs. Common actions:
- Add missing critical skills
- Strengthen weak bullet points with metrics
- Address vague experience descriptions

### APPLY_MODE

**Triggered when:** Resume is good enough AND not in RETHINK conditions

Your resume is ready for applications. Common actions:
- Apply to matching positions
- Follow up on pending applications
- Continue minor optimizations

### RETHINK_TARGETS

**Triggered when:** `applications_30d >= 30 AND interview_rate < 0.02`

Application strategy isn't working. Common actions:
- Adjust target seniority level
- Consider different industries
- Review role requirements alignment

## Gap Analysis

### Skills Gap

Compares resume skills against job requirements:
- **matched**: Skills present on resume that are required
- **critical_missing**: Required skills not on resume
- **nice_to_have_missing**: Preferred skills not on resume
- **match_percentage**: 0-100 match score

### Tools Gap

Same structure as skills gap for tools/technologies.

### Experience Gap

Analyzes experience types demonstrated:
- leadership
- cross_functional
- project_management
- stakeholder_management
- customer_facing
- data_driven
- architecture_system_design
- shipping_ownership
- mentorship
- process_improvement

### Seniority Gap

Compares user seniority vs target:
- **user_level**: entry / mid / senior / lead
- **role_expected**: Target level
- **alignment**: aligned / underqualified / overqualified
- **gap_years**: Estimated years gap if underqualified

### Industry Gap

Analyzes industry keyword alignment:
- **keywords_matched**: Industry terms on resume
- **keywords_missing**: Required industry terms
- **match_percentage**: Industry alignment score

## Fit Score

Overall fit score calculated from weighted gaps:

| Dimension | Weight |
|-----------|--------|
| Skills | 35% |
| Tools | 20% |
| Experience | 20% |
| Industry | 15% |
| Seniority | 10% |

### Penalties

Penalties are applied for:
- Critical missing skills: -5 per skill (max -20)
- Critical missing tools: -3 per tool (max -15)

### Score Levels

| Score | Level |
|-------|-------|
| 90-100 | Excellent Fit |
| 75-89 | Strong Fit |
| 60-74 | Good Fit |
| 45-59 | Moderate Fit |
| 30-44 | Weak Fit |
| 0-29 | Poor Fit |

## Action Blueprints

Machine-actionable instructions for Layer 5:

```typescript
interface ActionBlueprint {
  type: 'improve_resume' | 'apply_to_job' | 'follow_up' | 'update_targets' | 'collect_missing_info';
  objective: string;      // Human-readable goal
  entities?: {
    section?: string;     // For resume improvements
    bullet_index?: number;
  };
  constraints?: {
    max_items?: number;
    min_score_gain?: number;
  };
  why: string;           // Explanation
  confidence: 'low' | 'medium' | 'high';
  priority: number;      // 1-10, higher is more important
}
```

## Hysteresis

Mode changes include hysteresis to prevent flip-flopping:

1. **Score Buffer**: When in IMPROVE mode, stay until score exceeds `threshold + 3`
2. **Minimum Days**: Stay in mode for at least 5 days before switching between APPLY/RETHINK
3. **Ping-Pong Detection**: Block frequent mode switches

## Configuration

### Strategy Thresholds (`config/strategy_config.json`)

```json
{
  "strategy_thresholds": {
    "resume_score_min": 75,
    "application_volume_test": 30,
    "interview_rate_min": 0.02,
    "mode_hysteresis": {
      "resume_score_buffer": 3,
      "min_days_in_mode": 5
    }
  }
}
```

### Capability Taxonomy (`config/capability_taxonomy.json`)

Contains:
- 200+ skills organized by category
- 100+ tools organized by category
- 100+ synonym mappings (e.g., "k8s" → "kubernetes")

## API Reference

### Main Functions

#### `analyzeStrategy(request): Promise<StrategyAnalysisResult>`

Complete strategy analysis. This is the primary entry point.

#### `analyzeStrategySync(request): StrategyAnalysisResult`

Synchronous version of analyzeStrategy.

#### `analyzeQuick(request): { gaps, fit_score, confidence }`

Lightweight analysis without mode selection or blueprints.

#### `analyzeGapsOnly(request): GapAnalysis`

Returns only gap analysis results.

### Types

```typescript
import type {
  StrategyAnalysisRequest,
  StrategyAnalysisResult,
  GapAnalysis,
  ActionBlueprint,
} from '@/lib/layers/layer2';
```

### Errors

```typescript
import {
  StrategyAnalysisError,
  isStrategyAnalysisError,
  getUserFriendlyError,
} from '@/lib/layers/layer2';

try {
  await analyzeStrategy(request);
} catch (error) {
  if (isStrategyAnalysisError(error)) {
    console.log(error.getUserFriendly());
  }
}
```

## Integration

### With Layer 1

```typescript
import { evaluate } from '@/lib/layers/layer1';
import { analyzeStrategy } from '@/lib/layers/layer2';

const evaluation = await evaluate(resumeRequest);

const analysis = await analyzeStrategy({
  layer1_evaluation: {
    resume_score: evaluation.resume_score,
    content_quality_score: evaluation.content_quality_score,
    ats_compatibility_score: evaluation.ats_compatibility_score,
    weaknesses: evaluation.weaknesses,
    identified_gaps: {
      weak_bullets: evaluation.weak_bullets?.length ?? 0,
      missing_skills: evaluation.identified_gaps.missing_skills ? ['some'] : [],
      vague_experience: evaluation.identified_gaps.generic_descriptions,
    },
    extracted: evaluation.extracted,
  },
  layer4_state: userState,
});
```

### With Layer 4

```typescript
import { queries } from '@/lib/layers/layer4';
import { analyzeStrategy } from '@/lib/layers/layer2';

const stateResult = await queries.getUserStateSnapshot(userId);

if (stateResult.success) {
  const analysis = await analyzeStrategy({
    layer1_evaluation: evaluation,
    layer4_state: {
      pipeline_state: {
        total_applications: stateResult.data.metrics.totalApplications,
        applications_last_7_days: stateResult.data.metrics.applicationsThisWeek,
        applications_last_30_days: stateResult.data.metrics.totalApplications,
        interview_requests: Math.round(
          stateResult.data.metrics.interviewRate * 
          stateResult.data.metrics.totalApplications
        ),
        interview_rate: stateResult.data.metrics.interviewRate,
        offers: 0,
        rejections: 0,
      },
      user_profile: {
        target_roles: stateResult.data.profile?.targetRoles ?? [],
        years_experience: stateResult.data.profile?.experienceYears ?? undefined,
      },
      current_strategy_mode: stateResult.data.activeStrategy?.strategyMode,
    },
  });
}
```

## Testing

```bash
# Run all Layer 2 tests
npm test -- lib/layers/layer2/__tests__

# Run specific test file
npm test -- lib/layers/layer2/__tests__/integration.test.ts
```

## Directory Structure

```
lib/layers/layer2/
├── index.ts                    # Public exports
├── types.ts                    # Type definitions + Zod schemas
├── analyze.ts                  # Main analysis facade
├── errors.ts                   # Error handling
├── config/
│   ├── capability_taxonomy.json  # Skills & tools taxonomy
│   ├── strategy_config.json      # Strategy configuration
│   ├── loader.ts                 # Config loading
│   └── index.ts
├── normalization/
│   ├── canonicalize.ts           # String canonicalization
│   ├── taxonomy.ts               # Taxonomy operations
│   └── index.ts
├── gap-analysis/
│   ├── skills.ts
│   ├── tools.ts
│   ├── experience.ts
│   ├── seniority.ts
│   ├── industry.ts
│   └── index.ts
├── strategy/
│   ├── fit-score.ts
│   ├── hysteresis.ts
│   ├── mode-selection.ts
│   └── index.ts
├── actions/
│   ├── blueprint-generator.ts
│   └── index.ts
├── __tests__/
│   ├── fixtures/scenarios.ts
│   ├── gap-analysis.test.ts
│   ├── mode-selection.test.ts
│   ├── fit-score.test.ts
│   ├── blueprints.test.ts
│   └── integration.test.ts
└── README.md
```

## Design Principles

1. **Deterministic** - Same inputs always produce same outputs
2. **Rule-Based** - No ML/embeddings in MVP (config-driven)
3. **Config-Driven** - Thresholds and weights in JSON files
4. **Graceful Degradation** - Works with partial inputs
5. **Separation of Concerns** - Layer 2 analyzes; Layer 5 decides

## Future Enhancements (v2.2+)

- Semantic skill matching with embeddings
- Skill strength scoring (expert/intermediate/beginner)
- ML-based mode selection
- Confidence intervals
- Personalized roadmap generation
