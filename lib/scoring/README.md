# PRO Resume Scoring System

A comprehensive, multi-layered resume scoring system that evaluates resumes across 4 main components with detailed breakdowns and actionable feedback.

## 🎯 Overview

The PRO Scoring System provides:
- **Overall Score (0-100)** with letter grade
- **4 Component Scores** with weighted contributions
- **Detailed Sub-component Analysis** for transparency
- **ATS Pass Prediction** with confidence level
- **Keyword Gap Analysis** by job role
- **Improvement Roadmap** with prioritized actions

## 📊 Scoring Components

### 1. Content Quality (40% weight)
- **Achievement Quantification (50%)**: Percentage of bullets with metrics
- **Action Verb Strength (25%)**: Quality of action verbs (strong/medium/weak)
- **Skill Relevance (15%)**: Match with expected keywords for role
- **Clarity & Readability (10%)**: Bullet length and readability

### 2. ATS Compatibility (35% weight)
- **Keyword Density (40%)**: Must-have, important, and nice-to-have keywords
- **Format Compatibility (30%)**: ATS-friendly formatting (no tables, clean structure)
- **Section Headers (20%)**: Standard vs non-standard headers
- **File Format (10%)**: PDF quality and text extractability

### 3. Format & Structure (15% weight)
- **Length Optimization (40%)**: Appropriate length for experience level
- **Section Order (30%)**: Logical section ordering
- **Visual Hierarchy (20%)**: Consistent formatting and structure
- **Contact Info (10%)**: Complete contact information

### 4. Impact & Metrics (10% weight)
- **Quantified Results (60%)**: Percentage of quantified achievements
- **Scale Indicators (30%)**: Large-scale impact words
- **Recognition & Growth (10%)**: Promotions and awards

## 🚀 Quick Start

### Installation

```bash
# The scoring system is already integrated in your project
# No additional installation needed
```

### Basic Usage

```typescript
import { calculatePROScore } from '@/lib/scoring';

const resumeText = `...`; // Your resume text
const jobRole = 'Product Manager'; // Target role

const result = await calculatePROScore(resumeText, jobRole);

console.log(result.overallScore); // 73
console.log(result.grade); // "B"
console.log(result.atsPassProbability); // 68
```

### Detailed Analysis

```typescript
// Access component scores
const contentQuality = result.componentScores.contentQuality;
console.log(`Content Quality: ${contentQuality.score}/100`);

// Achievement quantification details
const achievement = contentQuality.breakdown.achievementQuantification;
console.log(`Quantified Bullets: ${achievement.quantifiedBullets}/${achievement.totalBullets}`);

// ATS keyword analysis
const keywords = result.atsDetailedReport.keywordGapAnalysis;
console.log(`Missing Keywords: ${keywords.mustHave.missing.join(', ')}`);

// Improvement roadmap
result.improvementRoadmap.toReach80.forEach(action => {
  console.log(`${action.action} (+${action.pointsGain} points, ${action.time})`);
});
```

## 📁 File Structure

```
lib/scoring/
├── index.ts              # Main entry point (calculatePROScore)
├── types.ts              # TypeScript type definitions
├── keywords.ts           # Keyword database by job role
├── analyzers.ts          # Text analysis helpers
├── algorithms.ts         # Scoring algorithms
├── example.ts            # Usage examples
├── README.md             # This file
└── __tests__/
    └── scoring.test.ts   # Test suite
```

## 🎓 Supported Job Roles

The system includes keyword databases for:

- Product Manager
- Software Engineer
- Frontend Engineer
- Backend Engineer
- Data Analyst
- Data Scientist
- DevOps Engineer
- UX Designer
- Marketing Manager
- Sales Manager
- General (default)

## 📈 Scoring Benchmarks

| Score Range | Grade | ATS Pass Rate | Quality Level |
|-------------|-------|---------------|---------------|
| 90-100      | A     | 95%           | Excellent     |
| 80-89       | B     | 80%           | Good          |
| 70-79       | C     | 65%           | Fair          |
| 60-69       | D     | 40%           | Needs Work    |
| 0-59        | F     | 15%           | Poor          |

## 🔍 Key Features

### 1. Achievement Quantification
```typescript
// Detects metrics in bullet points
"Increased revenue by 45%" → ✓ Quantified
"Led team meetings" → ✗ Not quantified

// Benchmark: 60%+ quantified bullets = excellent
```

### 2. Action Verb Analysis
```typescript
// Categorizes action verbs
"Led" → Strong (100 points)
"Managed" → Medium (70 points)
"Helped with" → Weak (30 points)
```

### 3. Keyword Matching
```typescript
// Role-specific keyword matching
const keywords = getKeywordsForRole('Product Manager');
// Returns: { mustHave, important, niceToHave }

// Score = (mustHave * 60%) + (important * 30%) + (niceToHave * 10%)
```

### 4. Format Detection
```typescript
// Detects ATS-unfriendly formatting
- Tables → -20 points (error)
- Special bullets → -10 points (warning)
- Multiple columns → -15 points (warning)
```

## 🎯 Example Output

```json
{
  "overallScore": 73,
  "grade": "B",
  "atsPassProbability": 68,
  "componentScores": {
    "contentQuality": {
      "score": 78,
      "weight": 40,
      "weightedContribution": 31.2,
      "breakdown": {
        "achievementQuantification": {
          "score": 72,
          "totalBullets": 15,
          "quantifiedBullets": 11,
          "percentage": 73
        }
      }
    }
  },
  "atsDetailedReport": {
    "passPrediction": {
      "probability": 68,
      "confidence": "medium",
      "reasoning": "Good format but missing critical keywords"
    },
    "keywordGapAnalysis": {
      "role": "Product Manager",
      "mustHave": {
        "found": 8,
        "missing": ["roadmap", "backlog", "OKRs"]
      }
    }
  },
  "improvementRoadmap": {
    "toReach80": [
      {
        "action": "Add critical keywords: roadmap, backlog, OKRs",
        "pointsGain": 8,
        "time": "30min",
        "priority": "high"
      }
    ]
  }
}
```

## 🧪 Testing

### Run Tests

```bash
# Run test suite (if using Jest)
npm test lib/scoring/__tests__/scoring.test.ts

# Or import test data
import { testData } from './lib/scoring/__tests__/scoring.test';
```

### Example Test

```typescript
const result = await calculatePROScore(testData.goodResume, 'Product Manager');
expect(result.overallScore).toBeGreaterThan(70);
```

## 🔧 Advanced Usage

### Custom Role Keywords

```typescript
import { KEYWORDS_BY_ROLE } from '@/lib/scoring/keywords';

// Add custom role
KEYWORDS_BY_ROLE['Custom Role'] = {
  mustHave: ['keyword1', 'keyword2'],
  important: ['keyword3', 'keyword4'],
  niceToHave: ['keyword5', 'keyword6'],
};
```

### Multi-Role Comparison

```typescript
const roles = ['Product Manager', 'Software Engineer', 'Data Analyst'];

const comparisons = await Promise.all(
  roles.map(async (role) => {
    const result = await calculatePROScore(resumeText, role);
    return { role, score: result.overallScore };
  })
);

// Find best fit
comparisons.sort((a, b) => b.score - a.score);
console.log(`Best fit: ${comparisons[0].role}`);
```

### Extract Specific Insights

```typescript
import {
  detectBulletPoints,
  countQuantifiedBullets,
  categorizeActionVerbs,
  findMatchingKeywords
} from '@/lib/scoring/analyzers';

// Analyze bullets
const bullets = detectBulletPoints(resumeText);
const quantified = countQuantifiedBullets(bullets);
const ratio = quantified / bullets.length;

// Analyze verbs
const verbs = categorizeActionVerbs(bullets);
console.log(`Strong verbs: ${verbs.strong.join(', ')}`);

// Check keywords
const { found, missing } = findMatchingKeywords(resumeText, keywords);
```

## ⚡ Performance

- **Target**: < 2 seconds per resume
- **Optimization**: All analysis is synchronous and in-memory
- **Caching**: Consider caching results for identical resumes

```typescript
// Performance test
const startTime = Date.now();
const result = await calculatePROScore(resumeText, jobRole);
const duration = Date.now() - startTime;
console.log(`Processing time: ${duration}ms`);
```

## 🐛 Error Handling

```typescript
try {
  const result = await calculatePROScore(resumeText, jobRole);
} catch (error) {
  if (error.message.includes('too short')) {
    // Handle short resume
  } else if (error.message.includes('Invalid')) {
    // Handle validation error
  }
}
```

## 🎨 Integration with UI

```typescript
// In your API route
import { calculatePROScore } from '@/lib/scoring';

export async function POST(req: Request) {
  const { resumeText, jobRole } = await req.json();

  const result = await calculatePROScore(resumeText, jobRole);

  return Response.json({
    success: true,
    data: result,
  });
}
```

## 📚 API Reference

### Main Function

```typescript
calculatePROScore(
  resumeText: string,
  jobRole?: string
): Promise<ScoringResult>
```

### Helper Functions

```typescript
// Keyword utilities
getKeywordsForRole(role: string): RoleKeywords
getAvailableRoles(): string[]
isRoleSupported(role: string): boolean

// Text analysis
detectBulletPoints(text: string): string[]
isQuantified(text: string): boolean
categorizeActionVerb(word: string): 'strong' | 'medium' | 'weak'

// Scoring components
calculateContentQualityScore(text: string, role: string): ComponentScore
calculateATSScore(text: string, role: string): ComponentScore
calculateFormatScore(text: string): ComponentScore
calculateImpactScore(text: string): ComponentScore
```

## 🤝 Contributing

To add new features:

1. **New job role**: Update `keywords.ts`
2. **New metric**: Add to `analyzers.ts` and `algorithms.ts`
3. **New test**: Add to `__tests__/scoring.test.ts`

## 📝 License

Part of the AI Resume Reviewer project.

## 🚀 Next Steps

1. **Integration**: Integrate with your existing API (`/api/analyze`)
2. **UI Components**: Build visualization components for scores
3. **Caching**: Implement Redis/memory cache for results
4. **Analytics**: Track scoring trends and improvements
5. **Fine-tuning**: Adjust weights and benchmarks based on data

---

**Version**: 1.0.0
**Author**: AI Resume Reviewer Team
**Last Updated**: 2025-11-10
