# Layer 1 - Evaluation Engine

## Overview

Layer 1 is the core evaluation engine for resume scoring. It provides two primary evaluation modes:

1. **Generic Evaluation** - Overall resume quality assessment across 4 dimensions
2. **Fit Evaluation** - Job-specific match analysis with gap detection and recommendations

## Installation

No additional installation needed - this layer is part of the main application.

## Quick Start

### Generic Evaluation

```typescript
import { evaluate } from '@/lib/layers/layer1';

const result = await evaluate({
  resume: {
    content: pdfBuffer, // Buffer or base64 string
    filename: 'resume.pdf',
    mimeType: 'application/pdf',
  },
});

console.log(`Score: ${result.resume_score}/100`);
console.log(`Level: ${result.level}`);
console.log(`Weaknesses: ${result.weaknesses.join(', ')}`);
```

### Fit Evaluation

```typescript
import { evaluate_fit } from '@/lib/layers/layer1';

const result = await evaluate_fit({
  resume: {
    content: pdfBuffer,
    filename: 'resume.pdf',
    mimeType: 'application/pdf',
  },
  job_description: {
    raw_text: jobDescriptionText,
  },
});

console.log(`Fit Score: ${result.fit_score}/100`);
console.log(`Recommendation: ${result.recommendation}`);
console.log(`Reasoning: ${result.recommendation_reasoning}`);
```

## API Reference

### Main Functions

#### `evaluate(request: EvaluationRequest): Promise<EvaluationResult>`

Performs generic resume evaluation without job context.

**Parameters:**
- `request.resume.content` - Resume content (Buffer or string)
- `request.resume.filename` - Original filename
- `request.resume.mimeType` - MIME type ('application/pdf', 'text/plain', or DOCX)
- `request.metadata` - Optional evaluation context

**Returns:** `EvaluationResult` with:
- `resume_score` - Overall score (0-100)
- `level` - Score level ('Early' | 'Growing' | 'Solid' | 'Strong' | 'Exceptional')
- `dimensions` - Breakdown by 4 dimensions
- `weaknesses` - List of weakness codes
- `feedback` - Actionable feedback
- `summary` - 1-2 sentence summary

#### `evaluate_fit(request: FitEvaluationRequest): Promise<FitScore>`

Evaluates resume fit for a specific job description.

**Parameters:**
- All parameters from `evaluate()`
- `request.job_description.raw_text` - Job description text
- `request.job_description.parsed_requirements` - Optional pre-parsed requirements

**Returns:** `FitScore` (extends `EvaluationResult`) with:
- `fit_score` - Fit score (0-100)
- `fit_dimensions` - Technical, seniority, experience, signal breakdown
- `gaps` - Detailed gap analysis
- `recommendation` - 'APPLY' | 'OPTIMIZE_FIRST' | 'NOT_READY'
- `recommendation_reasoning` - Explanation
- `tailoring_hints` - Suggestions for improvement
- `priority_improvements` - Top improvements with impact estimates

### Convenience Functions

#### `getScore(content, filename, mimeType): Promise<number>`

Quick score check - returns just the numeric score.

#### `getFitRecommendation(content, filename, mimeType, jobDescription): Promise<{fit_score, recommendation, reasoning}>`

Quick fit check - returns just the recommendation.

## Scoring Dimensions

### 1. Skill Capital (30%)

Evaluates technical skills and expertise:
- **Skill Presence** - Number and quality of listed skills
- **Skill Diversity** - Coverage across different skill categories
- **Skill Depth** - Evidence of deep expertise (certs, projects, years)

### 2. Execution Impact (30%)

Evaluates demonstrated impact:
- **Metrics** - Quantified achievements (%, $, numbers)
- **Action Verbs** - Strength of language used
- **Scope** - Scale and leadership indicators

### 3. Learning & Adaptivity (20%)

Evaluates growth signals:
- **Skill Recency** - Modern/current technologies
- **Progression** - Career advancement signals
- **Learning Signals** - Certifications, courses, training

### 4. Signal Quality (20%)

Evaluates presentation quality:
- **Structure** - Section organization
- **Writing Quality** - Clarity, consistency
- **Formatting** - ATS compatibility
- **Completeness** - Contact info, details

## Score Levels

| Score Range | Level | Description |
|-------------|-------|-------------|
| 90-100 | Exceptional | Outstanding resume, ready for top opportunities |
| 75-89 | Strong | Well-crafted resume with minor improvements possible |
| 55-74 | Solid | Good foundation, some areas need attention |
| 35-54 | Growing | Significant room for improvement |
| 0-34 | Early | Major gaps to address |

## Fit Score Quality Factor

When calculating fit scores, a quality factor is applied based on the resume's overall score:

- **Resume Score ≥ 60**: No penalty (factor = 1.0)
- **Resume Score < 60**: Gradual penalty down to 0.85 at score 0

**Rationale**: Poor presentation likely reduces hiring manager interest even with good skill match. A well-presented resume with mediocre fit may perform better than a poorly-presented resume with excellent fit.

The factor uses linear interpolation: `factor = 0.85 + (resumeScore / 60) * 0.15`

## Recommendation Logic

### APPLY
- Fit score ≥ 75 AND resume quality ≥ 60
- OR fit score ≥ 65 AND resume quality ≥ 75
- AND ≤ 2 critical skill gaps

### OPTIMIZE_FIRST
- Fit score 50-74 OR resume quality 40-60
- OR > 2 critical gaps that can be addressed
- Improvements could significantly boost chances

### NOT_READY
- Fit score < 50
- OR > 5 critical gaps
- OR significant seniority mismatch
- Better to target different roles or gain skills first

## Error Handling

All errors are wrapped in `EvaluationError` with user-friendly messages:

```typescript
import { evaluate, isEvaluationError, getUserFriendlyError } from '@/lib/layers/layer1';

try {
  const result = await evaluate(request);
} catch (error) {
  if (isEvaluationError(error)) {
    console.log(error.code); // 'PARSING_FAILED'
    console.log(error.title); // 'Unable to Read Resume'
    console.log(error.suggestion); // 'Try saving as...'
  }
  
  // Or get generic error info
  const friendly = getUserFriendlyError(error);
}
```

## Caching

Results are cached for 5 minutes based on content hash:

```typescript
import { getCacheStats, clearCache } from '@/lib/layers/layer1';

// Check cache stats
const stats = getCacheStats();
console.log(`Hit rate: ${(stats.hitRate * 100).toFixed(1)}%`);

// Clear cache if needed
clearCache();
```

## Configuration

All configuration is in `lib/layers/layer1/config/`:

- `weights.ts` - Dimension weights and thresholds
- `skills.ts` - 150+ skill normalizations
- `tools.ts` - 50+ tool detection patterns
- `industries.ts` - 20+ industry keyword sets
- `companies.ts` - 100+ company-industry mappings

## Integration with Other Layers

### Layer 2 (Text Generation)
Uses `weak_bullets` for rewrite suggestions.

### Layer 3 (Bullet Enhancement)
Uses `extracted` entities and `weak_bullets` for targeted improvements.

### Layer 4 (Persistence)
`EvaluationResult` maps directly to database schema.

## Performance

Target performance:
- Generic evaluation: < 2 seconds
- Fit evaluation: < 3 seconds
- Parsing: < 500ms

## Testing

```bash
# Run all Layer 1 tests
npm test lib/layers/layer1

# Run specific test suite
npm test lib/layers/layer1/__tests__/scoring.test.ts
```

## File Structure

```
lib/layers/layer1/
├── index.ts                    # Public exports
├── types.ts                    # Type definitions + Zod schemas
├── evaluate.ts                 # Main evaluation facade
├── parser.ts                   # Resume parsing
├── cache.ts                    # Caching layer
├── errors.ts                   # Error handling
├── config/
│   ├── weights.ts              # Scoring weights
│   ├── skills.ts               # Skill normalizations
│   ├── tools.ts                # Tool patterns
│   ├── industries.ts           # Industry keywords
│   └── companies.ts            # Company mappings
├── modules/
│   ├── entity-extraction.ts    # Entity extraction
│   ├── gap-detection.ts        # Gap analysis
│   ├── job-parser.ts           # JD parsing
│   └── recommendation.ts       # APPLY/OPTIMIZE/NOT_READY
├── scoring/
│   ├── index.ts                # Scoring exports
│   ├── generic.ts              # Generic orchestration
│   ├── fit.ts                  # Fit orchestration
│   ├── skill-capital.ts        # Dimension scorer
│   ├── execution-impact.ts     # Dimension scorer
│   ├── learning-adaptivity.ts  # Dimension scorer
│   └── signal-quality.ts       # Dimension scorer
└── __tests__/
    ├── fixtures/
    │   └── resumes.ts
    ├── scoring.test.ts
    ├── entities.test.ts
    ├── fit.test.ts
    └── integration.test.ts
```
