# Scoring System Migration Plan

**Goal:** Remove duplicate 3D scoring system, keep PRO (4D) as single source of truth.
**Approach:** Incremental migration with backward compatibility at each step.

---

## Current State

| System | Endpoint | Scoring Function | UI Component |
|--------|----------|-----------------|--------------|
| **PRO (4D)** | `/api/score` | `calculatePROScore()` | (returned as JSON) |
| **Legacy 3D** | `/api/analyze` | `calculate3DScore()` | `Results3D`, `ScoringCalculator`, `AIReport` |
| **Layer 1** | `/api/resume/analyze` | `Layer1.evaluate()` | `ResumeScoreCard` |

---

## Phase 1: Add New Code (No Removal)

**Objective:** Create the mapping layer without touching existing code.

- [x] Create `lib/scoring/derivedViews.ts` with `derive3DFromPRO()` function
- [x] Create `lib/scoring/__tests__/derivedViews.test.ts` with comprehensive tests
- [x] Create `lib/scoring/__tests__/determinism.test.ts` for PRO determinism validation
- [x] Create `lib/scoring/__tests__/noLegacyImports.test.ts` for static analysis guardrails
- [ ] Verify all new tests pass
- [ ] Verify existing tests still pass (no regressions)

**Files created:**
- `lib/scoring/derivedViews.ts`
- `lib/scoring/__tests__/derivedViews.test.ts`
- `lib/scoring/__tests__/determinism.test.ts`
- `lib/scoring/__tests__/noLegacyImports.test.ts`

**Risk:** None - additive only, no existing code modified.

---

## Phase 2: Update API Endpoint (`/api/analyze`)

**Objective:** Switch `/api/analyze` from `calculate3DScore` to `calculatePROScore` + `derive3DRawFromPRO`.

### Steps:

1. **Update imports in `app/api/analyze/route.ts`:**
   ```typescript
   // BEFORE:
   import { calculate3DScore } from '@/lib/scoring/algorithms';

   // AFTER:
   import { calculatePROScore } from '@/lib/scoring';
   import { derive3DRawFromPRO, scoringResultToPROInput } from '@/lib/scoring/derivedViews';
   ```

2. **Update scoring logic:**
   ```typescript
   // BEFORE:
   const localScores = calculate3DScore(resumeText, jobRole, jobDescription);

   // AFTER:
   const proResult = await calculatePROScore(resumeText, jobRole);
   const proInput = scoringResultToPROInput(proResult);
   const localScores = derive3DRawFromPRO(proInput);
   ```

3. **Update AI hybrid merge to use PRO as base:**
   - Keep `mergeHybrid3DScores()` function but feed it derived values
   - AI validation continues to check 3D format (temporary)

4. **Update response format:**
   - Response shape stays the same (backward compatible)
   - Internal calculation uses PRO as source

5. **Test endpoint:**
   - Manual test with sample resumes
   - Compare scores before/after (document any differences)
   - Verify UI components render correctly

### Files modified:
- `app/api/analyze/route.ts`

### Risk: Medium
- Score values may shift slightly (different formulas)
- Need to verify UI still renders correctly
- AI hybrid mode prompt may need adjustment

---

## Phase 3: Update UI Components

**Objective:** Update components to accept PRO data, using derived views for display.

### 3.1 Update `Results3D.tsx`
- [ ] Update props to optionally accept PRO data
- [ ] Use `derive3DRawFromPRO()` internally if PRO data is provided
- [ ] Maintain backward compatibility with existing 3D data format
- [ ] Test with both data formats

### 3.2 Update `ScoringCalculator.tsx`
- [ ] Update formula comments to reference PRO system
- [ ] Consider adding PRO dimension display alongside 3D
- [ ] Keep interactive sliders working

### 3.3 Update `AIReport.tsx`
- [ ] Update to display PRO dimension names where appropriate
- [ ] Keep content/tailoring/overall display for consistency
- [ ] Add PRO-specific breakdown if space allows

### Files modified:
- `components/Results3D.tsx`
- `components/ScoringCalculator.tsx`
- `components/AIReport.tsx`

### Risk: Medium
- Visual changes may confuse users
- Need design review for dimension name changes
- Consider feature flag for gradual rollout

---

## Phase 4: Update AI Prompts

**Objective:** Align AI scoring prompts with PRO dimensions.

### Steps:
1. [ ] Update `build3DStrictAIPrompt` in `lib/prompts-pro.ts` to use PRO terminology
2. [ ] Update AI response parsing to handle PRO dimension names
3. [ ] Update hybrid merge logic for PRO dimensions
4. [ ] Test with OpenAI to verify response quality

### Risk: Medium-High
- AI prompt changes may affect scoring consistency
- Need A/B testing period
- May need prompt engineering iteration

---

## Phase 5: Remove Legacy Code

**Objective:** Delete all legacy 3D scoring code.

### Prerequisites:
- [ ] All API endpoints use PRO scoring
- [ ] All UI components render correctly
- [ ] `noLegacyImports.test.ts` passes fully
- [ ] No runtime errors in production for 1 week

### Steps:
1. [ ] Mark `calculate3DScore` as `@deprecated` in `lib/scoring/algorithms.ts`
2. [ ] Mark 3D types as `@deprecated` in `lib/scoring/types.ts`
3. [ ] Wait 1 sprint for any issues
4. [ ] Delete `calculate3DScore` function (~210 lines)
5. [ ] Delete legacy types: `ResumeScores`, `ActionableItem`, `AI3DAnalysisResponse`, `Hybrid3DScoringResult`
6. [ ] Run full test suite
7. [ ] Update `noLegacyImports.test.ts` to enforce zero legacy references
8. [ ] Update documentation

### Files modified:
- `lib/scoring/algorithms.ts` (delete lines 824-1033)
- `lib/scoring/types.ts` (delete lines 665-768)

### Risk: Low (by this phase, all consumers are migrated)

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
- `derivedViews.test.ts` - Mapping function correctness
- `determinism.test.ts` - PRO scoring consistency
- `noLegacyImports.test.ts` - Migration guardrails

### Integration Tests
- API endpoint tests (manual or automated)
- UI component rendering tests
- Score comparison: old 3D vs derived 3D

### Acceptance Criteria
- [ ] All new tests pass
- [ ] No existing tests broken
- [ ] TypeScript strict mode passes
- [ ] API response format unchanged
- [ ] UI renders correctly
- [ ] Score differences documented and accepted

---

## Rollback Plan

Each phase is independently reversible:

| Phase | Rollback |
|-------|----------|
| Phase 1 | Delete new files (no impact) |
| Phase 2 | Revert `app/api/analyze/route.ts` to use `calculate3DScore` |
| Phase 3 | Revert component changes |
| Phase 4 | Revert prompt changes |
| Phase 5 | Restore deleted code from git |

---

## Success Metrics

1. **Zero score mismatches:** Same resume → same score regardless of which endpoint is called
2. **Single source of truth:** All scoring flows through `calculatePROScore`
3. **All tests pass:** Including new guardrail tests
4. **No user-facing regressions:** UI renders identically or better
5. **Reduced code:** ~210 lines of duplicate scoring logic removed
6. **Cleaner types:** ~100 lines of duplicate type definitions removed
