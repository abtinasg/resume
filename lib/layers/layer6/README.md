# Layer 6 - Job Discovery & Matching Module

The Job Discovery & Matching module provides intelligent job parsing, ranking, categorization, and comparison capabilities for the AI Career Agent.

## Overview

Layer 6 enables users to:
- **Parse** job descriptions from manual paste
- **Rank** jobs by fit score using Layer 1 analysis
- **Categorize** jobs as reach/target/safety/avoid
- **Compare** jobs side-by-side
- **Detect** potential scam postings

## Installation

Layer 6 is part of the ResumeIQ layers architecture. Import from the main layers module:

```typescript
import { Layer6 } from '@/lib/layers';

// Or import specific functions
import {
  parseAndRankJob,
  getRankedJobs,
  compareJobsSideBySide,
} from '@/lib/layers/layer6';
```

## Quick Start

### 1. Parse and Rank a Single Job

```typescript
const result = await Layer6.parseAndRankJob(
  {
    user_id: 'user_123',
    resume_version_id: 'resume_v1',
    job_description: jobDescriptionText,
    metadata: {
      job_title: 'Software Engineer',
      company: 'TechCorp',
      job_url: 'https://example.com/jobs/123',
    },
  },
  resumeText,
  { work_arrangement: ['remote', 'hybrid'] }
);

if (result.success) {
  console.log(`Fit Score: ${result.data.fit_score}/100`);
  console.log(`Category: ${result.data.category}`);
  console.log(`Should Apply: ${result.data.should_apply}`);
  console.log(`Insights:`, result.data.quick_insights);
}
```

### 2. Get Ranked Job List

```typescript
const parsedJobs = [...]; // Array of ParsedJob objects

const result = await Layer6.getRankedJobs(
  parsedJobs,
  resumeText,
  { work_arrangement: ['remote'] },
  { category: 'target', only_should_apply: true }
);

if (result.success) {
  console.log(`Total Jobs: ${result.data.summary.total_jobs}`);
  console.log(`Target Jobs: ${result.data.jobs.target.length}`);
  console.log(`Top Recommendation:`, result.data.top_recommendations[0]);
  console.log(`Insights:`, result.data.insights);
}
```

### 3. Compare Jobs Side-by-Side

```typescript
const comparison = await Layer6.compareJobsSideBySide(
  [rankedJob1, rankedJob2, rankedJob3],
  userSkills
);

if (comparison.success) {
  console.log(`Best Fit: ${comparison.data.best_fit}`);
  console.log(`Easiest to Get: ${comparison.data.easiest_to_get}`);
  console.log(`Best for Growth: ${comparison.data.best_for_growth}`);
  console.log(`Common Requirements:`, comparison.data.comparison.skills_overlap.common_requirements);
}
```

## API Reference

### Main Functions

#### `parseAndRankJob(request, resumeText, userPreferences, existingCanonicalIds?)`

Parse a job description and rank it against the user's resume.

**Parameters:**
- `request: JobPasteRequest` - Job description and metadata
- `resumeText: string` - User's resume text
- `userPreferences: UserPreferences` - User preferences for matching
- `existingCanonicalIds?: string[]` - Existing job IDs for deduplication

**Returns:** `Promise<Layer6ParseRankOutput>`

#### `getRankedJobs(jobs, resumeText, userPreferences, filters?)`

Rank and categorize multiple jobs.

**Parameters:**
- `jobs: ParsedJob[]` - Array of parsed jobs
- `resumeText: string` - User's resume text
- `userPreferences: UserPreferences` - User preferences
- `filters?: JobFilters` - Optional filters

**Returns:** `Promise<Layer6JobListOutput>`

#### `compareJobsSideBySide(rankedJobs, userSkills?)`

Compare 2-5 jobs side-by-side.

**Parameters:**
- `rankedJobs: RankedJob[]` - Jobs to compare (2-5)
- `userSkills?: string[]` - User's skills for coverage calculation

**Returns:** `Promise<Layer6ComparisonOutput>`

### Types

#### JobPasteRequest

```typescript
interface JobPasteRequest {
  user_id: string;
  resume_version_id: string;
  job_description: string;
  metadata?: JobMetadataInput;
  language?: string;
}
```

#### UserPreferences

```typescript
interface UserPreferences {
  work_arrangement?: WorkArrangement[];
  locations?: string[];
  salary_minimum?: number;
  excluded_industries?: string[];
  strict_location?: boolean;
}
```

#### RankedJob

```typescript
interface RankedJob {
  job: ParsedJob;
  fit_score: number;
  fit_analysis: FitScore | null;
  category: JobCategory;
  category_reasoning: string;
  rank: number;
  priority_score: number;
  score_breakdown: ScoreBreakdown;
  flags: JobFlags;
  should_apply: boolean;
  application_priority: JobPriority;
  quick_insights: string[];
  red_flags?: string[];
  green_flags?: string[];
  career_capital: CareerCapital;
  scam_detection: ScamDetectionResult;
}
```

## Job Categories

| Category | Fit Score | Description |
|----------|-----------|-------------|
| **Safety** | 80-100 | High acceptance probability, overqualified |
| **Target** | 60-79 | Good fit with manageable gaps |
| **Reach** | 50-59 | Stretch opportunity, underqualified but viable |
| **Avoid** | <50 | Too many gaps, not recommended |

## Features

### Parsing
- Extract job title, company, location
- Detect work arrangement (remote/hybrid/onsite)
- Parse salary ranges
- Extract required/preferred skills and tools
- Detect seniority level
- Assess parse quality (high/medium/low)

### Ranking
- Fit score integration with Layer 1
- Category assignment with reasoning
- Priority scoring with breakdown
- "Should apply" recommendation

### Analysis
- Career capital scoring (brand, skill growth, network, comp)
- Scam detection with red flags
- Gap analysis from Layer 1

### Comparison
- Side-by-side job comparison
- Skills overlap analysis
- Best fit / easiest to get / best for growth
- Comparative insights

## Configuration

Configuration is stored in `config/job_parser_config.json`:

```json
{
  "parsing": {
    "min_length": 50,
    "max_length": 50000
  },
  "ranking": {
    "weights": {
      "fit_score": 0.40,
      "preference_match": 0.15,
      "freshness": 0.10,
      "category_bonus": 0.25,
      "urgency": 0.10
    }
  },
  "categorization": {
    "thresholds": {
      "safety": { "min_fit": 80 },
      "target": { "min_fit": 60 },
      "reach": { "min_fit": 50 },
      "avoid": { "max_fit": 50 }
    }
  }
}
```

## Error Handling

All errors use `JobDiscoveryError` with codes:

```typescript
try {
  const result = await parseAndRankJob(request, resumeText, prefs);
} catch (error) {
  if (isJobDiscoveryError(error)) {
    console.log(error.code); // e.g., 'DUPLICATE_JOB'
    console.log(error.title); // User-friendly title
    console.log(error.suggestion); // How to fix
  }
}
```

Error codes include:
- `PARSING_FAILED` - Unable to parse JD
- `JD_TOO_SHORT` - JD below minimum length
- `DUPLICATE_JOB` - Job already exists
- `SCAM_DETECTED` - High scam risk detected
- `VALIDATION_ERROR` - Invalid input

## Performance Targets

| Operation | Target Time |
|-----------|-------------|
| Parse single job | <1 second |
| Rank 10 jobs | <2 seconds |
| Compare 5 jobs | <500ms |

## Integration with Other Layers

### Layer 1 (Evaluation Engine)
```typescript
// Layer 6 calls Layer 1 for fit analysis
const fitResult = await Layer1.evaluate_fit({
  resume: resumeInput,
  job_description: { raw_text: job.raw_text },
});
```

### Layer 4 (State & Memory)
```typescript
// Save ranked job to user's job list
await Layer4.saveJob(userId, rankedJob);

// Get user's saved jobs
const jobs = await Layer4.getJobs(userId, filters);
```

### Layer 5 (Orchestrator)
```typescript
// Layer 5 uses Layer 6 for job-related tasks
const topJobs = await Layer6.getRankedJobs(savedJobs, resumeText, prefs, {
  category: 'target',
  only_should_apply: true,
});
```

## Testing

Run tests:
```bash
npm test -- --testPathPattern=layer6
```

Run with coverage:
```bash
npm test -- --testPathPattern=layer6 --coverage
```

## Directory Structure

```
lib/layers/layer6/
├── index.ts                    # Public exports
├── types.ts                    # Type definitions
├── errors.ts                   # Error handling
├── job-discovery.ts            # Main facade
├── parsing/
│   ├── parser.ts              # Main parser
│   ├── metadata-extractor.ts  # Extract title, company, etc.
│   ├── requirements-extractor.ts # Extract skills, tools
│   └── index.ts
├── ranking/
│   ├── ranker.ts              # Main ranking logic
│   ├── categorizer.ts         # Job categorization
│   ├── priority-scorer.ts     # Priority calculation
│   ├── insights-generator.ts  # Generate insights
│   └── index.ts
├── analysis/
│   ├── fit-analyzer.ts        # Layer 1 integration
│   ├── career-capital.ts      # Career capital scoring
│   ├── scam-detector.ts       # Scam detection
│   └── index.ts
├── comparison/
│   ├── comparator.ts          # Job comparison
│   └── index.ts
├── config/
│   ├── job_parser_config.json # Configuration
│   ├── loader.ts              # Config loader
│   └── index.ts
└── __tests__/
    ├── fixtures/
    │   └── job-descriptions.ts # Test data
    ├── parsing.test.ts
    ├── ranking.test.ts
    ├── comparison.test.ts
    └── integration.test.ts
```

## Version History

- **v1.0** - MVP implementation
  - Manual job paste parsing
  - Basic ranking and categorization
  - Scam detection
  - Job comparison

## License

Internal use only. Part of the ResumeIQ AI Career Agent.
