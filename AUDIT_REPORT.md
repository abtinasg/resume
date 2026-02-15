# Scoring System Audit Report

**Date:** 2026-02-15
**Auditor:** Claude (Automated Audit)
**Scope:** Full codebase scoring system analysis

---

## Executive Summary

The ResumeIQ codebase contains **two distinct scoring systems** that operate independently, producing different scores for the same resume. This creates score mismatches, maintenance overhead, and user confusion.

| System | Dimensions | Location | Status |
|--------|-----------|----------|--------|
| **PRO Scoring (4D)** | Content, ATS, Format, Impact | `lib/scoring/index.ts` | Source of truth |
| **Legacy 3D Scoring** | Structure, Content, Tailoring | `lib/scoring/algorithms.ts` (line 839) | Technical debt |

---

## 1. Legacy 3D Scoring Code Found

### 1.1 Core Implementation

**File:** `lib/scoring/algorithms.ts` (lines 824-1033)

- **Function:** `calculate3DScore(resumeText, jobRole?, jobDescription?)`
- **Purpose:** Calculates Structure (0-40), Content (0-60), Tailoring (0-40) scores
- **Lines of code:** ~210 lines
- **Exports:** Named export from `algorithms.ts`
- **Used by:**
  - `app/api/analyze/route.ts` (line 5: `import { calculate3DScore } from '@/lib/scoring/algorithms'`)

### 1.2 Type Definitions

**File:** `lib/scoring/types.ts` (lines 665-768)

- `ResumeScores` (line 671) - 3D score interface: `{ structure, content, tailoring, overall }`
- `ActionableItem` (line 688) - Actionable improvement with point impact
- `AI3DAnalysisResponse` (line 708) - AI scoring response for 3D model
- `Hybrid3DScoringResult` (line 737) - Combined local + AI 3D result
- **Used by:**
  - `app/api/analyze/route.ts` (line 14-18)
  - `lib/types/analysis.ts` (mirrors structure in `ApiAnalysisResponse`)

### 1.3 API Endpoints

**File:** `app/api/analyze/route.ts` (825 lines)

- **Endpoint:** `POST /api/analyze`
- **Uses:** Legacy 3D scoring exclusively (`calculate3DScore`)
- **Features:**
  - Hybrid mode: 50% local 3D + 50% AI (OpenAI gpt-4o) 3D scoring
  - PDF and image extraction
  - Fallback to local-only scoring
  - Persists results to database
- **Import:** `import { calculate3DScore } from '@/lib/scoring/algorithms'` (line 5)
- **Types imported:** `ResumeScores`, `ActionableItem`, `AI3DAnalysisResponse`, `Hybrid3DScoringResult` (lines 14-19)
- **AI prompt builder:** `import { build3DStrictAIPrompt } from '@/lib/prompts-pro'` (line 6)

### 1.4 UI Components Using 3D Scoring

| Component | File | Scoring System | Description |
|-----------|------|---------------|-------------|
| `Results3D` | `components/Results3D.tsx` | **3D only** | Displays structure/content/tailoring breakdown with tabs |
| `ScoringCalculator` | `components/ScoringCalculator.tsx` | **3D only** | Interactive slider calculator using 3D formula |
| `AIReport` | `components/AIReport.tsx` | **3D (partial)** | Shows content/tailoring/overall from 3D, plus AI verdict |

### 1.5 Type Definitions (UI-side)

**File:** `lib/types/analysis.ts`

- `ApiAnalysisResponse` - Mirrors 3D scoring output: `{ sections: { structure, content, tailoring } }`
- `AnalysisResult` - Has `local_scoring` with 3D fields

---

## 2. PRO Scoring (4D) Code - Source of Truth

### 2.1 Core Implementation

**File:** `lib/scoring/index.ts`

- **Function:** `calculatePROScore(resumeText, jobRole)` (line 295)
- **Function:** `calculatePROPlusScore(resumeText, options)` (line 402)
- **Dimensions:** Content Quality (40%), ATS Compatibility (35%), Format & Structure (15%), Impact & Metrics (10%)
- **Output:** `ScoringResult` with full breakdowns

### 2.2 Algorithm Functions

**File:** `lib/scoring/algorithms.ts` (lines 1-822)

- `calculateContentQualityScore()` - Content dimension
- `calculateATSScore()` - ATS dimension
- `calculateFormatScore()` - Format dimension
- `calculateImpactScore()` - Impact dimension
- `calculateOverallScore()` - Weighted aggregation
- `calculateGrade()` - Letter grade conversion

### 2.3 API Endpoints Using PRO Scoring

| Endpoint | File | Scoring System |
|----------|------|---------------|
| `POST /api/score` | `app/api/score/route.ts` | **PRO only** (via `scoringService`) |
| `POST /api/resume/analyze` | `app/api/resume/analyze/route.ts` | **Layer 1** (separate system) |

### 2.4 Services Using PRO Scoring

**File:** `lib/services/scoring-service.ts`

- `ScoringService.scoreAndPersistResume()` - Uses `calculatePROScore`
- `ScoringService.scoreTransientResume()` - Uses `calculatePROScore`
- `ScoringService.scoreResumeForJob()` - Uses `calculatePROScore`
- All methods import from `@/lib/scoring` (PRO)

### 2.5 UI Components Using PRO Scoring

| Component | File | Scoring System | Description |
|-----------|------|---------------|-------------|
| `ResumeScoreCard` | `components/dashboard/ResumeScoreCard.tsx` | **Layer 1** (via `/api/resume/analyze`) | Dashboard score card with 4 dimensions |

---

## 3. Layer 1 Scoring (Separate System)

Note: Layer 1 has its own evaluation engine at `lib/layers/layer1/` with dimensions:
- Skill Capital
- Execution Impact
- Learning Adaptivity
- Signal Quality

This is a **third** scoring system used by `POST /api/resume/analyze` and the `ResumeScoreCard` dashboard component. However, the `ResumeScoreCard` displays dimensions as: Content Quality, ATS Compatibility, Impact & Metrics, Presentation - which mirrors the PRO naming but data comes from Layer 1.

---

## 4. Score Flow Summary

```
User uploads resume
        │
        ├──► /api/analyze ──► calculate3DScore() ──► Results3D component
        │                                            (Structure/Content/Tailoring)
        │
        ├──► /api/score ──► calculatePROScore() ──► PRO 4D response
        │                                           (Content/ATS/Format/Impact)
        │
        └──► /api/resume/analyze ──► Layer1.evaluate() ──► ResumeScoreCard
                                                           (ContentQuality/ATS/Impact/Presentation)
```

**Problem:** Same resume → 3 different scores via 3 different paths.

---

## 5. Specific Duplication Points

### 5.1 Content Analysis Duplication

| Feature | PRO (4D) | Legacy 3D |
|---------|----------|-----------|
| Bullet detection | `detectBulletPoints()` | Same function (shared) |
| Quantification | `calculateAchievementQuantification()` | `quantificationRatio` inline |
| Action verbs | `calculateActionVerbStrength()` | `categorizeActionVerbs()` inline |
| Clarity | `calculateClarityReadability()` | `clarityScore` inline |
| Keywords | `calculateKeywordDensity()` | `findMatchingKeywords()` inline |

Both systems use the same underlying analyzers but aggregate differently.

### 5.2 Score Scale Differences

| Dimension | PRO Scale | 3D Scale |
|-----------|-----------|----------|
| Content | 0-100 (40% weight) | 0-60 |
| Structure/Format | 0-100 (15% weight) | 0-40 |
| Tailoring/ATS | 0-100 (35% weight) | 0-40 |
| Impact | 0-100 (10% weight) | N/A (folded into content) |
| Overall | 0-100 | 0-100 (different formula) |

### 5.3 Mapping Between Systems

| PRO Dimension | Maps To 3D |
|---------------|------------|
| Format & Structure | Structure |
| Content Quality | Content (partial) |
| Impact & Metrics | Content (folded in) |
| ATS Compatibility | Tailoring (when no JD) |

---

## 6. Risk Assessment

### High Risk
- **Score confusion:** User sees different scores on different pages for the same resume
- **Database inconsistency:** `/api/analyze` stores 3D scores; `/api/score` stores PRO scores
- **AI prompt mismatch:** `build3DStrictAIPrompt` sends 3D structure to OpenAI; PRO uses different format

### Medium Risk
- **Maintenance burden:** Bug fixes may need to be applied to both systems
- **Type proliferation:** `ResumeScores` vs `ScoringResult` vs `EvaluationResult` all represent "a score"

### Low Risk
- **Shared analyzers:** Both systems use the same underlying analyzers (`detectBulletPoints`, `categorizeActionVerbs`, etc.), so analyzer-level bugs affect both consistently

---

## 7. Files Affected by Migration

### Must Modify
1. `app/api/analyze/route.ts` - Switch from `calculate3DScore` to `calculatePROScore` + `derive3DFromPRO`
2. `lib/scoring/algorithms.ts` - Mark `calculate3DScore` as `@deprecated`
3. `lib/scoring/types.ts` - Mark 3D types as `@deprecated`
4. `components/Results3D.tsx` - Update to accept derived view data
5. `components/ScoringCalculator.tsx` - Update formula to match PRO
6. `components/AIReport.tsx` - Update score display to use PRO dimensions

### Must Create
1. `lib/scoring/derivedViews.ts` - Backward-compatible mapping function
2. `lib/scoring/__tests__/derivedViews.test.ts` - Tests for mapping
3. `lib/scoring/__tests__/determinism.test.ts` - PRO determinism tests
4. `lib/scoring/__tests__/noLegacyImports.test.ts` - Static analysis tests

### May Affect
1. `lib/types/analysis.ts` - Update `ApiAnalysisResponse` type
2. `lib/prompts-pro.ts` - Update `build3DStrictAIPrompt` to use PRO structure
3. `lib/services/scoring-service.ts` - Already uses PRO (no change needed)
4. `app/api/score/route.ts` - Already uses PRO (no change needed)

---

## 8. Conclusion

The primary migration path is clear:
1. Keep PRO (4D) as the single scoring engine
2. Create `derive3DFromPRO()` for backward-compatible UI rendering
3. Move job-specific matching from 3D's tailoring dimension to Layer 6
4. Eventually deprecate and remove all 3D-specific code

The shared analyzer layer (`lib/scoring/analyzers.ts`) requires no changes - it serves both systems and will continue serving the PRO system.
