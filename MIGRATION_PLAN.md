# Scoring System Migration Plan

**Goal:** Remove duplicate 3D scoring system, keep PRO (4D) as single source of truth.
**Approach:** Incremental migration with backward compatibility at each step.
**Status:** Phases 1-4 complete. Phase 5 (legacy removal) pending production stability.

---

## Current State (Post-Migration)

| System | Endpoint | Scoring Function | UI Component |
|--------|----------|-----------------|--------------|
| **PRO (4D)** | `/api/score` | `calculatePROScore()` | (returned as JSON) |
| **PRO → Derived 3D** | `/api/analyze` | `calculatePROScore()` + `derive3DRawFromPRO()` | `Results3D`, `ScoringCalculator`, `AIReport` |
| **Layer 1** | `/api/resume/analyze` | `Layer1.evaluate()` | `ResumeScoreCard` |

All scoring now flows through PRO as the single source of truth. The `/api/analyze` endpoint uses `derive3DRawFromPRO()` for backward-compatible 3D section scores.

---

## Phase 1: Add New Code (No Removal) - COMPLETE

**Objective:** Create the mapping layer without touching existing code.

- [x] Create `lib/scoring/derivedViews.ts` with `derive3DFromPRO()` function
- [x] Create `lib/scoring/__tests__/derivedViews.test.ts` with comprehensive tests
- [x] Create `lib/scoring/__tests__/determinism.test.ts` for PRO determinism validation
- [x] Create `lib/scoring/__tests__/noLegacyImports.test.ts` for static analysis guardrails
- [x] Verify all new tests pass
- [x] Verify existing tests still pass (no regressions)

**Files created:**
- `lib/scoring/derivedViews.ts`
- `lib/scoring/__tests__/derivedViews.test.ts`
- `lib/scoring/__tests__/determinism.test.ts`
- `lib/scoring/__tests__/noLegacyImports.test.ts`

---

## Phase 2: Update API Endpoint (`/api/analyze`) - COMPLETE

**Objective:** Switch `/api/analyze` from `calculate3DScore` to `calculatePROScore` + `derive3DRawFromPRO`.

**Changes made:**
1. Replaced `import { calculate3DScore }` with `import { calculatePROScore }` + `derive3DRawFromPRO`
2. Updated scoring logic: PRO score → derived 3D view → backward-compatible response
3. Added `proScore` field to API response for frontend PRO dimension display
4. Updated `generateFallbackActionables()` to accept PRO-derived breakdown
5. Kept AI hybrid merge function for backward compatibility
6. Updated `noLegacyImports.test.ts` to remove `/api/analyze` from allowed legacy files

**Files modified:**
- `app/api/analyze/route.ts`
- `lib/scoring/__tests__/noLegacyImports.test.ts`

**Verification:**
- `noLegacyImports.test.ts`: 9/9 pass
- `calculate3DScore` no longer imported by any API route

---

## Phase 3: Update UI Components - COMPLETE

**Objective:** Update components to display PRO dimensions and use PRO-aligned terminology.

### 3.1 `Results3D.tsx`
- [x] Added `proScore` optional prop for PRO dimension display
- [x] Added PRO dimension breakdown (4 bars: Content Quality, ATS Readiness, Format & Structure, Impact & Metrics)
- [x] Maintained backward-compatible 3D section display
- [x] PRO grade badge displayed when available

### 3.2 `ScoringCalculator.tsx`
- [x] Updated description text to reference PRO scoring system
- [x] Updated formula comments

### 3.3 `AIReport.tsx`
- [x] Updated dimension labels: "Content Score" → "Content Quality", "Tailoring Score" → "ATS Readiness"

### 3.4 `lib/types/analysis.ts`
- [x] Updated `ApiAnalysisResponse` to include optional `proScore` field
- [x] Updated documentation comments

---

## Phase 4: Mark Legacy Code as Deprecated - COMPLETE

**Objective:** Add deprecation notices to legacy 3D scoring code.

**Changes made:**
1. Marked `calculate3DScore()` as `@deprecated` in `lib/scoring/algorithms.ts`
2. Marked `ResumeScores`, `AI3DAnalysisResponse`, `Hybrid3DScoringResult` as `@deprecated` in `lib/scoring/types.ts`
3. Updated section headers from "New Architecture" to "DEPRECATED"

---

## Phase 5: Remove Legacy Code - PENDING (after production stability)

**Objective:** Delete all legacy 3D scoring code.

### Prerequisites:
- [x] All API endpoints use PRO scoring
- [x] All UI components render correctly
- [x] `noLegacyImports.test.ts` passes fully
- [ ] No runtime errors in production for 1 week

### Steps:
1. [ ] Delete `calculate3DScore` function (~210 lines from `lib/scoring/algorithms.ts`)
2. [ ] Delete legacy types: `ResumeScores`, `ActionableItem`, `AI3DAnalysisResponse`, `Hybrid3DScoringResult` (~100 lines from `lib/scoring/types.ts`)
3. [ ] Remove AI hybrid mode types from `/api/analyze/route.ts`
4. [ ] Run full test suite
5. [ ] Update `noLegacyImports.test.ts` to enforce zero legacy references

### Files to modify:
- `lib/scoring/algorithms.ts` (delete lines 824-1033)
- `lib/scoring/types.ts` (delete deprecated interfaces)

### Risk: Low (all consumers are migrated)

---

## Phase 6: Consolidate Layer 1

**Objective:** Align Layer 1 evaluation with PRO scoring for consistency.

### Scope:
- [ ] Evaluate if Layer 1 dimensions should map to PRO dimensions
- [ ] Update `ResumeScoreCard` component if needed
- [ ] Update `/api/resume/analyze` endpoint
- [ ] Document final scoring architecture

### Risk: Low - separate concern, can be done independently

---

## Testing Strategy

### Unit Tests
- `derivedViews.test.ts` - Mapping function correctness (all passing)
- `determinism.test.ts` - PRO scoring consistency (all passing)
- `noLegacyImports.test.ts` - Migration guardrails (all passing)
- `scoring.test.ts` - PRO scoring algorithms (4 pre-existing failures unrelated to migration)

### Test Results (Post-Migration)
- 71 of 75 tests pass
- 4 failures are pre-existing in `scoring.test.ts` (edge cases for very short resumes)
- All migration-specific tests pass (derivedViews: 100%, determinism: 100%, noLegacyImports: 100%)

---

## Rollback Plan

Each phase is independently reversible:

| Phase | Rollback |
|-------|----------|
| Phase 1 | Delete new files (no impact) |
| Phase 2 | Revert `app/api/analyze/route.ts` to use `calculate3DScore` |
| Phase 3 | Revert component changes |
| Phase 4 | Remove deprecation notices |
| Phase 5 | Restore deleted code from git |

---

## Success Metrics

1. **Single source of truth:** All scoring flows through `calculatePROScore` ✅
2. **All migration tests pass:** Including guardrail tests ✅
3. **No user-facing regressions:** UI renders with both PRO and backward-compatible 3D views ✅
4. **Backward compatible:** API response shape unchanged, proScore added as optional field ✅
5. **Legacy code deprecated:** All 3D scoring code marked with `@deprecated` ✅
6. **Pending:** ~310 lines of legacy code to be removed after production stability period
