# Layer 8 - AI Coach Interface

The AI Coach Interface provides template-based explanations and context-aware messaging for the career agent system. It acts as the communication layer between the system and the user, translating data and decisions into clear, empathetic, and actionable messages.

## MVP Scope

This is a **template-based implementation** - no LLM calls, NLP, or complex AI. It uses smart variable substitution and tone adaptation to generate contextual responses.

## Features

### 1. Explanation Generation
- **Strategy Explanations**: Why a particular strategy mode is recommended
- **Action Explanations**: Why a specific task or action is suggested
- **Job Explanations**: Why jobs are ranked and categorized
- **Score Explanations**: How resume scores are calculated and what they mean

### 2. Response Templates
- Greetings and acknowledgments
- Progress updates
- Milestone celebrations
- Encouragement messages
- Help and FAQ responses

### 3. Tone Adaptation
- **Professional**: Default formal tone
- **Empathetic**: For users facing challenges or rejections
- **Encouraging**: For users making progress
- **Direct**: When urgent action is needed

### 4. Output Formats
- Markdown (default)
- Plain text
- HTML

## Installation

The module is part of the layers architecture and should be imported from the index:

```typescript
import { generateResponse, explainDecision } from '@/lib/layers/layer8';
```

## Usage

### Basic Response Generation

```typescript
import { generateResponse } from '@/lib/layers/layer8';

// Generate a greeting
const greeting = generateResponse({
  type: 'greeting',
  context: {
    userName: 'Sarah',
    strategyMode: StrategyMode.APPLY_MODE,
    resumeScore: 78,
  },
});
console.log(greeting.message);
// "⭐ Welcome back, Sarah! You're currently in Application mode. Your resume score is 78/100."
```

### Explaining Decisions

```typescript
import { explainDecision } from '@/lib/layers/layer8';

// Explain strategy decision
const strategyExplanation = explainDecision('strategy', {
  strategyAnalysis: layer2Analysis,
  resumeScore: 68,
});
// Returns: "Based on your resume score of 68 (below our threshold of 75), 
// we recommend focusing on improving your resume first..."
```

### Tone Adaptation

```typescript
import { generateResponse, detectTone } from '@/lib/layers/layer8';

// Auto-detect tone based on context
const tone = detectTone({
  recentEvents: { rejection: true }
});
// Returns: 'empathetic'

// Generate with specific tone
const response = generateResponse({
  type: 'encouragement',
  tone: 'empathetic',
  context: { company: 'TechCorp' },
});
```

### Direct Template Functions

```typescript
import {
  explainImproveResumeFirst,
  explainJobRanking,
  celebrateFirstInterview,
} from '@/lib/layers/layer8';

// Strategy explanation
const strategyExplanation = explainImproveResumeFirst({
  resumeScore: 65,
  scoreThreshold: 75,
  mode: StrategyMode.IMPROVE_RESUME_FIRST,
});

// Job explanation
const jobExplanation = explainJobRanking({
  rankedJob: job,
  category: 'target',
  fitScore: 78,
});

// Milestone message
const milestone = celebrateFirstInterview({
  jobTitle: 'Senior Software Engineer',
  company: 'Google',
});
```

## API Reference

### Main Functions

| Function | Description |
|----------|-------------|
| `generateResponse(request)` | Main entry point for generating Coach responses |
| `explainDecision(type, context, tone?)` | Generate explanation for a specific decision type |
| `formatMessage(content, tone?, format?)` | Format and adapt a message |
| `greet(context)` | Quick greeting generation |
| `help()` | Quick help generation |

### Explanation Functions

| Function | Description |
|----------|-------------|
| `explainFromAnalysis(analysis, state?, tone?)` | Explain Layer 2 strategy analysis |
| `explainTask(task, tone?)` | Explain a recommended task |
| `explainRankedJob(rankedJob, tone?)` | Explain a job ranking |
| `explainEvaluation(evaluation, tone?)` | Explain a resume evaluation |

### Tone Functions

| Function | Description |
|----------|-------------|
| `detectTone(context?)` | Auto-detect appropriate tone |
| `adaptTone(text, tone, context?)` | Adapt message style to tone |
| `getToneRecommendation(context?)` | Get tone with reasoning |

### Formatter Functions

| Function | Description |
|----------|-------------|
| `formatBulletList(items, options?)` | Format as bullet list |
| `formatNumberedList(items, options?)` | Format as numbered list |
| `bold(text)` | Make text bold |
| `joinParagraphs(...paragraphs)` | Join paragraphs with spacing |

## Types

### CoachRequest

```typescript
interface CoachRequest {
  type: ResponseType;
  tone?: Tone;
  format?: OutputFormat;
  context: CoachContext;
}
```

### CoachResponse

```typescript
interface CoachResponse {
  message: string;
  tone: Tone;
  format: OutputFormat;
  type: ResponseType;
  metadata: ResponseMetadata;
}
```

### ResponseType

```typescript
type ResponseType =
  | 'greeting'
  | 'strategy_explanation'
  | 'action_explanation'
  | 'job_recommendation'
  | 'progress_update'
  | 'encouragement'
  | 'help'
  | 'milestone';
```

### Tone

```typescript
type Tone = 'professional' | 'empathetic' | 'encouraging' | 'direct';
```

## Configuration

The Coach configuration is stored in `config/coach_config.json`:

```json
{
  "version": "1.0",
  "tones": {
    "professional": {
      "formality": "high",
      "emoji_usage": "minimal"
    },
    "empathetic": {
      "formality": "medium",
      "emoji_usage": "minimal",
      "acknowledgment_phrases": ["I understand", "That makes sense"]
    }
  },
  "default_tone": "professional",
  "thresholds": {
    "apply_mode_score": 75,
    "low_interview_rate": 0.05
  }
}
```

## Integration with Other Layers

### Layer 2 (Strategy)

```typescript
import { analyzeStrategy } from '@/lib/layers/layer2';
import { explainFromAnalysis } from '@/lib/layers/layer8';

const analysis = await analyzeStrategy({ ... });
const explanation = explainFromAnalysis(analysis, { pipelineState });
```

### Layer 5 (Orchestrator)

```typescript
import { orchestrateWeeklyPlan } from '@/lib/layers/layer5';
import { explainDailyPlan } from '@/lib/layers/layer8';

const plan = orchestrateWeeklyPlan(state, analysis);
const explanation = explainDailyPlan(plan.task_pool);
```

### Layer 6 (Job Discovery)

```typescript
import { getRankedJobs } from '@/lib/layers/layer6';
import { explainRankedJob, explainJobList } from '@/lib/layers/layer8';

const jobs = await getRankedJobs(userId);
const summary = explainJobList(jobs);
const jobDetail = explainRankedJob(jobs[0]);
```

## Error Handling

All functions handle errors gracefully and return user-friendly messages:

```typescript
import { CoachError, CoachErrorCode, isCoachError } from '@/lib/layers/layer8';

try {
  const response = generateResponse(request);
} catch (error) {
  if (isCoachError(error)) {
    console.log(error.toUserFriendly());
    // { code: 'MISSING_CONTEXT', title: 'Missing Context', ... }
  }
}
```

## Testing

Run tests with:

```bash
npm test -- --testPathPattern=layer8
```

## Future Enhancements (Post-MVP)

- LLM-powered response generation
- Multi-turn conversation tracking
- Learning from user feedback
- Advanced personalization
- Voice interface support
- Proactive suggestions

## Architecture

```
lib/layers/layer8/
├── index.ts                    # Public exports
├── types.ts                    # Type definitions
├── coach.ts                    # Main facade
├── errors.ts                   # Error handling
├── config/
│   ├── coach_config.json       # Configuration
│   ├── loader.ts               # Config loader
│   └── index.ts
├── formatters/
│   ├── markdown-formatter.ts   # Markdown utilities
│   ├── list-formatter.ts       # List utilities
│   └── index.ts
├── tone/
│   ├── tone-detector.ts        # Tone detection
│   ├── tone-adapter.ts         # Tone adaptation
│   └── index.ts
├── templates/
│   ├── greetings.ts            # Greeting templates
│   ├── strategy-explanations.ts
│   ├── action-explanations.ts
│   ├── job-recommendations.ts
│   ├── progress-updates.ts
│   ├── encouragement.ts
│   ├── help-responses.ts
│   └── index.ts
├── explanations/
│   ├── strategy-explainer.ts
│   ├── action-explainer.ts
│   ├── job-explainer.ts
│   ├── score-explainer.ts
│   └── index.ts
└── __tests__/
    ├── templates.test.ts
    ├── explanations.test.ts
    ├── tone.test.ts
    └── integration.test.ts
```

## Version

Layer 8 v1.0 (MVP - Template-based)
