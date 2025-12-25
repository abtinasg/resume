# Layer 3 - Execution Engine (Evidence-Anchored Rewriting)

## 🔴 THE COMPETITIVE MOAT

This layer is the core competitive advantage of the resume improvement system. It rewrites resume content with one critical constraint: **NEVER FABRICATE CLAIMS**.

Every improvement must be traceable to source evidence.

## Key Innovation: Evidence-Anchored Rewriting

Unlike other resume tools that might add impressive-sounding but fabricated content, Layer 3 enforces strict evidence validation:

```
Improved: "Led team of 5 engineers to reduce latency by 40%"
Evidence Map:
  - "Led team of 5 engineers" → E3 (from original: "managed engineering team of 5")
  - "reduce latency" → E1 (from original: "improved system performance")  
  - "by 40%" → E1 (from original: "by 40%")
  
✅ All claims anchored → PASS
❌ Any fabricated claim → FAIL → RETRY
```

## Architecture Overview

```
lib/layers/layer3/
├── index.ts                    # Public exports
├── types.ts                    # TypeScript interfaces + Zod schemas
├── rewrite.ts                  # Main rewrite facade
├── errors.ts                   # Error handling
│
├── evidence/                   # Evidence system
│   ├── ledger-builder.ts       # Build evidence ledger from resume
│   └── evidence-map.ts         # Map claims to evidence IDs
│
├── planning/                   # Micro-action planning
│   ├── verb-mapping.ts         # Weak → strong verb detection
│   ├── metric-detection.ts     # Detect numbers and metrics
│   ├── fluff-removal.ts        # Detect vague phrases
│   └── micro-actions.ts        # Plan transformations
│
├── generation/                 # LLM integration
│   ├── llm-client.ts           # OpenAI API client
│   ├── prompt-builder.ts       # Build prompts with evidence
│   └── temperature-config.ts   # Temperature settings
│
├── validation/                 # Evidence validation
│   ├── evidence-validator.ts   # Core validation logic
│   ├── semantic-overlap.ts     # Check evidence overlap
│   └── retry-logic.ts          # Retry with stricter constraints
│
├── coherence/                  # Section-level coherence
│   ├── tense-unifier.ts        # Unify tense across bullets
│   ├── format-unifier.ts       # Consistent formatting
│   └── section-processor.ts    # Process entire sections
│
└── config/                     # Configuration
    ├── verb_mapping.json       # 50+ weak verb upgrades
    ├── fluff_phrases.json      # 100+ fluff phrases
    ├── metric_patterns.json    # Regex patterns for metrics
    ├── prompts.ts              # LLM prompt templates
    └── loader.ts               # Config loading utilities
```

## Usage

### Rewrite a Bullet

```typescript
import { rewriteBullet } from '@/lib/layers/layer3';

const result = await rewriteBullet({
  type: 'bullet',
  bullet: 'Helped with backend development',
  target_role: 'Backend Engineer',
  issues: ['weak_verb'],
  layer1: {
    extracted: {
      skills: ['Python', 'Node.js'],
      tools: ['PostgreSQL', 'Redis'],
    },
  },
});

console.log('Improved:', result.improved);
console.log('Evidence Map:', result.evidence_map);
console.log('Validation:', result.validation.passed);
```

### Quick Rewrite

```typescript
import { quickRewriteBullet } from '@/lib/layers/layer3';

const improved = await quickRewriteBullet(
  'Helped with API development',
  {
    targetRole: 'Software Engineer',
    skills: ['REST', 'Python'],
  }
);
```

### Rewrite an Entire Section

```typescript
import { rewriteSection } from '@/lib/layers/layer3';

const result = await rewriteSection({
  type: 'section',
  bullets: [
    'Worked on backend systems',
    'Helped with API development',
    'Was responsible for database optimization',
  ],
  section_type: 'experience',
  target_role: 'Backend Engineer',
});

console.log('Improved Bullets:', result.improved_bullets);
console.log('Section Notes:', result.section_notes);
```

## Validation Rules

### What Gets Blocked

1. **New Numbers**: Cannot add `50%` if original doesn't have a percentage
2. **New Tools**: Cannot add `Kubernetes` if not in evidence
3. **New Companies**: Cannot add company names not in resume
4. **Scale Claims**: Cannot add `massive`, `enterprise-grade` without evidence

### What's Allowed

1. **Keep Original Metrics**: If original has `40%`, output can have `40%`
2. **Add Tools from Evidence**: Skills/tools extracted by Layer 1 can be added
3. **Verb Upgrades**: "Helped" → "Developed" is allowed
4. **Add HOW**: Can add method/approach from evidence

## Evidence Scope

- **`bullet_only`**: Only use the original bullet text
- **`section`**: Use all bullets in the section (default)
- **`resume`**: Use entire resume (for summaries)

## Configuration

### Environment Variables

```bash
OPENAI_API_KEY=your-api-key  # Required for LLM features
```

### Verb Mappings

Edit `config/verb_mapping.json` to add verb upgrades:

```json
{
  "helped": {
    "upgrades": ["facilitated", "enabled", "drove"],
    "context_hints": {
      "technical": "implemented",
      "leadership": "led"
    }
  }
}
```

### Fluff Phrases

Edit `config/fluff_phrases.json` to add phrases to detect:

```json
{
  "fillers": ["various", "multiple", "several"],
  "vague_phrases": ["responsible for", "worked on"]
}
```

## Testing

```bash
# Run Layer 3 tests
npm test -- --testPathPatterns="lib/layers/layer3"

# Run with coverage
npm test -- --testPathPatterns="lib/layers/layer3" --coverage
```

### Key Test Categories

1. **Evidence Ledger**: Building and querying evidence
2. **Micro-Actions**: Planning transformations
3. **Validation**: Detecting fabrication (THE CRITICAL TESTS)
4. **Coherence**: Tense and format unification
5. **Integration**: End-to-end rewrite pipeline

## Integration with Other Layers

### Layer 1 (Evaluation)

```typescript
import { evaluate } from '@/lib/layers/layer1';
import { rewriteBullet } from '@/lib/layers/layer3';

const evaluation = await evaluate(resume);

for (const weakBullet of evaluation.weak_bullets || []) {
  const result = await rewriteBullet({
    type: 'bullet',
    bullet: weakBullet.text,
    issues: weakBullet.issues,
    layer1: {
      extracted: evaluation.extracted,
    },
  });
}
```

### Layer 4 (State)

Layer 3 can receive context from Layer 4's state management.

### Layer 5 (Orchestrator)

Layer 5 will call Layer 3 with rewrite requests.

## Why This is the Moat

1. **Trust**: Users trust improvements because nothing is fabricated
2. **Audit Trail**: Every claim is traceable via evidence map
3. **Transparency**: Users can see "where did this come from"
4. **Retention**: Trust builds retention, retention builds the moat

## Error Handling

```typescript
import { 
  isExecutionError, 
  isFabricationError,
  getUserFriendlyError 
} from '@/lib/layers/layer3';

try {
  const result = await rewriteBullet(request);
} catch (error) {
  if (isFabricationError(error)) {
    // Handle fabrication detected
    console.log('Could not improve without fabricating');
  } else if (isExecutionError(error)) {
    console.log(getUserFriendlyError(error));
  }
}
```

## Performance

- Single bullet rewrite: ~2-3s (with LLM)
- Section (5 bullets): ~10-15s
- Retry adds: ~2s per attempt
- Evidence ledger building: <100ms

## Fallback Behavior

When `OPENAI_API_KEY` is not set:
- Uses synchronous fallback (rule-based improvements only)
- Still applies formatting and coherence fixes
- Returns original if no safe improvements possible

---

**Remember**: This layer's quality directly impacts user trust and retention. Every feature should reinforce the "no fabrication" guarantee.
