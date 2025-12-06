# Layer 2 – Strategy Engine (Career Path Analysis)

**Version:** 2.0 (Agent Architecture)
**Status:** Initial Spec for v1 MVP
**Last Updated:** December 7, 2025

---

## 1. Purpose & Role in the Stack

The **Strategy Engine** is Layer 2 in the ResumeIQ AI Career Agent architecture. It analyzes the user's career position and determines the optimal job search strategy based on resume quality, application history, and interview results.

**Critical positioning:**
- The Strategy Engine is **NOT the decision maker** - that's the Orchestrator (Layer 5)
- The Strategy Engine **IS the analytical layer** that:
  - Analyzes career fit (skills, seniority, industry alignment)
  - Identifies gaps between current state and target roles
  - Recommends strategy modes based on quantified gaps
  - Provides reasoning for strategic recommendations

**Think of it as:** The career analyst that tells the Orchestrator "here's what's working, what's not, and what strategy mode makes sense."

---

## 2. Responsibilities (v1 MVP)

### Core Analysis Dimensions

**v1 includes 5 core gap analyses:**

1. **Skills Gap Analysis**
   - Compare resume skills vs target role requirements
   - Identify: matched skills, critical missing skills, nice-to-have gaps
   - Output: Simple match percentage + list of gaps

2. **Tools/Tech Stack Gap Analysis**
   - Compare technical tools mentioned vs required
   - Flag: matched tools, missing critical tools
   - Output: Tool match percentage + missing items

3. **Experience Gap Analysis (Basic)**
   - Match responsibility types with job requirements
   - Identify: missing experience categories
   - Output: List of missing experience types

4. **Seniority Alignment**
   - Estimate user's current seniority level (entry/mid/senior/lead)
   - Compare with target role's expected seniority
   - Output: Alignment status (underqualified/aligned/overqualified)

5. **Industry Alignment (Basic)**
   - Match industry keywords between resume and target role
   - Output: Keyword overlap percentage + missing domain terms

---

### Strategy Mode Recommendation

**Layer 2's PRIMARY OUTPUT for v1:**

Based on the 5 gap analyses + current state, recommend one of **3 strategy modes:**

1. **IMPROVE_RESUME_FIRST**
   - **Trigger:** `resume_score < 75` OR critical content gaps
   - **Meaning:** "Your resume quality is blocking interviews - fix it before volume"
   - **Focus:** Resume rewriting, adding metrics, fixing weak bullets

2. **APPLY_MODE**
   - **Trigger:** `resume_score >= 75` AND `total_applications < 30`
   - **Meaning:** "Your resume is solid - focus on application volume"
   - **Focus:** 8-12 applications per week, diverse targeting

3. **RETHINK_TARGETS**
   - **Trigger:** `total_applications >= 30` AND `interview_rate < 0.02` (2%)
   - **Meaning:** "You're not getting interviews - targeting mismatch likely"
   - **Focus:** Test alternative roles, seniority levels, or locations

---

## 3. Non-Responsibilities (What Layer 2 Does NOT Do)

Critical boundaries to prevent scope creep:

- **Does NOT decide which mode to activate**
  - Layer 2 **recommends** a mode with reasoning
  - Orchestrator (Layer 5) **activates** the mode (potentially with user confirmation via Coach)

- **Does NOT generate job queries or search**
  - That's Layer 6 (Job Discovery)
  - Layer 2 only provides strategic context for query generation

- **Does NOT rewrite resume content**
  - That's Layer 3 (Execution Engine)
  - Layer 2 identifies what needs improvement, not how to improve it

- **Does NOT communicate directly with user**
  - Layer 8 (Coach) explains Layer 2's analysis
  - Layer 2 provides structured data, not human language

- **Does NOT track application pipeline**
  - That's Layer 4 (Memory & State)
  - Layer 2 receives state summaries as input

---

## 4. Inputs (from Other Layers)

Layer 2 receives **structured summaries**, not raw data.

### From Layer 1 (Evaluation Engine)
```typescript
{
  resume_score: number,              // 0-100
  content_quality_score: number,
  ats_compatibility_score: number,

  weaknesses: string[],              // e.g., "Missing quantified metrics"
  identified_gaps: {
    weak_bullets: number,
    missing_skills: string[],
    vague_experience: boolean
  }
}
```

### From Layer 4 (Memory & State)
```typescript
{
  pipeline_state: {
    total_applications: number,
    applications_last_7_days: number,
    applications_last_30_days: number,

    interview_requests: number,
    interview_rate: number,            // calculated: interviews / applications

    offers: number,
    rejections: number
  },

  user_profile: {
    target_roles: string[],            // e.g., ["Product Manager", "Senior PM"]
    target_seniority: string,          // "mid" | "senior"
    years_experience: number,

    preferences: {
      work_arrangement: string[],      // ["remote", "hybrid"]
      locations: string[],
      salary_minimum: number,
      excluded_industries: string[]
    }
  },

  current_strategy_mode: string | null,  // What mode are we in now?
  strategy_history: StrategyChange[]     // Past mode changes
}
```

### From External (when available)
```typescript
{
  job_description?: string,          // Target JD text (optional in v1)
  job_requirements?: {               // Parsed from JD (optional in v1)
    required_skills: string[],
    required_tools: string[],
    seniority_expected: string,
    domain_keywords: string[]
  }
}
```

---

## 5. Outputs (to Orchestrator)

Layer 2 produces **structured analysis**, not narratives.

### Primary Output (v1)

```typescript
interface StrategyAnalysisResult {
  // Overall fit assessment
  overall_fit_score: number,         // 0-100 (for target role)
  confidence_level: "low" | "medium" | "high",

  // Gap analysis details
  gaps: {
    skills: {
      matched: string[],
      critical_missing: string[],
      match_percentage: number
    },
    tools: {
      matched: string[],
      critical_missing: string[],
      match_percentage: number
    },
    experience: {
      missing_types: string[],       // e.g., ["leadership", "cross-functional"]
      coverage_score: number          // 0-100
    },
    seniority: {
      user_level: "entry" | "mid" | "senior" | "lead",
      role_expected: "entry" | "mid" | "senior" | "lead",
      alignment: "underqualified" | "aligned" | "overqualified"
    },
    industry: {
      keywords_matched: string[],
      keywords_missing: string[],
      match_percentage: number
    }
  },

  // Strategy recommendation (v1 core)
  recommended_mode: "IMPROVE_RESUME_FIRST" | "APPLY_MODE" | "RETHINK_TARGETS",

  mode_reasoning: {
    primary_reason: string,          // e.g., "Resume score below threshold"
    supporting_factors: string[],    // e.g., ["No quantified achievements"]
    confidence: "high" | "medium" | "low"
  },

  // Actionable next steps (high-level)
  priority_actions: string[],        // Top 3-5 actions for user
                                     // e.g., "Add metrics to 5 bullets"

  // For Coach context
  key_insights: string[]             // Short observations for Coach to explain
}
```

---

## 6. Strategy Mode Logic (v1 Rules)

### Decision Flow

```
1. Check resume_score
   IF score < 75 → IMPROVE_RESUME_FIRST (always)

2. ELSE check application volume + interview rate
   IF applications >= 30 AND interview_rate < 0.02 → RETHINK_TARGETS

3. ELSE → APPLY_MODE (default for healthy state)
```

**Re-evaluation triggers:**
- After every resume rewrite (score may change)
- After every 10 applications
- When user reports interview or rejection
- When user updates target role preferences

---

### Mode Details

**IMPROVE_RESUME_FIRST:**
```
Context: Resume quality blocking progress
Weekly Target: 2-3 test applications max
Focus: Rewrite weak bullets, add metrics, fix structure
Query Strategy: Conservative (best-fit roles only)
Expected Duration: 1-2 weeks until score >= 75
```

**APPLY_MODE:**
```
Context: Resume solid, need volume
Weekly Target: 8-12 applications
Focus: Balanced quantity + quality
Query Strategy: Diverse searches (roles, locations, seniority)
Expected Duration: Until 30 applications OR mode change trigger
```

**RETHINK_TARGETS:**
```
Context: Low interview rate despite volume
Weekly Target: 3-5 test applications to different targets
Focus: Alternative roles, adjacent skills, broader geography
Query Strategy: Experimental variations
Expected Duration: 1-2 weeks of testing, then reassess
Exit: When interview_rate improves OR user confirms pivot
```

---

## 7. Integration with Other Layers

### Called By: Layer 5 (Orchestrator)

**When:**
- On user onboarding (initial analysis)
- After every resume version update
- Every 10 applications
- When user reports outcome (interview/rejection)
- When user changes target role preferences

**How:**
```typescript
// Orchestrator calls Strategy Engine
const strategyAnalysis = await StrategyEngine.analyze({
  evaluation_data: layer1_output,
  state_data: layer4_output,
  job_requirements: optional_jd_data
});

// Orchestrator uses output to:
// 1. Decide if mode should change
// 2. Set weekly targets
// 3. Configure Job Discovery queries (Layer 6)
// 4. Prepare Coach context (Layer 8)
```

---

### Provides Context To:

**Layer 6 (Job Discovery):**
- Current mode → influences query diversity
- Missing skills/tools → guides keyword targeting
- Seniority alignment → filters job level

**Layer 3 (Execution Engine):**
- Identified gaps → guides rewrite focus
- Priority actions → determines what to fix first

**Layer 8 (Coach):**
- Mode reasoning → Coach explains "why this strategy"
- Key insights → Coach shares observations
- Gap details → Coach provides specifics when asked

---

## 8. Implementation Notes (v1)

### Deterministic Analysis (No LLM Required for v1)

Layer 2 logic for v1 can be **rule-based** and **deterministic**:

**Skills/Tools Gap:**
```typescript
function calculateSkillsGap(resumeSkills: string[], requiredSkills: string[]): GapResult {
  const matched = resumeSkills.filter(s => requiredSkills.includes(s));
  const missing = requiredSkills.filter(s => !resumeSkills.includes(s));

  return {
    matched,
    critical_missing: missing,
    match_percentage: (matched.length / requiredSkills.length) * 100
  };
}
```

**Seniority Alignment:**
```typescript
const seniorityMap = { entry: 1, mid: 2, senior: 3, lead: 4 };

function assessSeniority(userLevel: string, roleLevel: string): Alignment {
  const userScore = seniorityMap[userLevel];
  const roleScore = seniorityMap[roleLevel];

  if (userScore < roleScore) return "underqualified";
  if (userScore === roleScore) return "aligned";
  return "overqualified";
}
```

**Mode Selection:**
```typescript
function recommendMode(score: number, apps: number, interviewRate: number): Mode {
  if (score < 75) return "IMPROVE_RESUME_FIRST";
  if (apps >= 30 && interviewRate < 0.02) return "RETHINK_TARGETS";
  return "APPLY_MODE";
}
```

**No LLM needed for v1 core logic.** (v2 may add semantic skill matching with embeddings.)

---

### Performance Targets

- Analysis time: < 500ms
- Deterministic: Same inputs → same outputs
- Stateless: No side effects, pure function

---

### Error Handling

**Missing data:**
- If `job_requirements` missing: Use target_role string only, generic analysis
- If `pipeline_state` empty: Default to IMPROVE_RESUME_FIRST mode

**Invalid state:**
- If contradictory data (e.g., score=90 but no applications): Log warning, proceed with mode logic

---

## 9. Future Enhancements (v2+)

**Not in v1 MVP, planned for later:**

- Semantic skill matching (use embeddings for "Python" ≈ "scripting")
- Synonym detection ("data wrangling" = "data cleaning")
- Skill strength scoring (0-100 per skill)
- Outdated tools detection (flag old technologies)
- 30/60/90-day roadmap generation
- Industry-specific weighting (PM vs SWE vs DS)
- Confidence intervals on fit scores
- Project recommendations (portfolio ideas)
- Automated seniority detection (NLP on bullets)

---

## 10. Relationship to Legacy CPA Docs

**Reusable from legacy:**
- 5 analysis dimensions (skills, tools, experience, seniority, industry)
- Gap detection concepts
- Input/output data structures

**What changed:**
- **Integration:** Now called by Orchestrator, not standalone
- **Scope:** v1 simplified (no roadmap, no project suggestions)
- **Output:** Strategy mode recommendation added (wasn't in old CPA)
- **Role:** Analytical layer, not decision layer

**Where to find legacy details:**
- `docs/architecture/legacy/uploaded/cpa/cpa_mvp_scope_readme.md`
- `docs/architecture/legacy/uploaded/cpa/Career_Path_Analyzer.md`
- Use for implementation reference, but reframe for agent context

---

**End of Layer 2 Specification**

**Related Docs:**
- [Agent Architecture v2](../agent_architecture_v2.md) - Full 8-layer system
- [Migration Guide](../migration_guide.md) - Mapping from old CPA to Layer 2
- [Layer 5: Orchestrator](layer_5_orchestrator_v2.md) *(to be created)* - How Orchestrator uses Layer 2
- [Layer 8: Coach](layer_8_ai_coach_interface_v2.md) - How Coach explains Layer 2 analysis

**Implementation Status:** Spec complete for v1, implementation pending
