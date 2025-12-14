# Layer 2 – Strategy Engine (Career Path Analysis) — Implementation-Ready Spec

**Version:** 2.1 (Agent Architecture)  
**Status:** Implementation-ready for v1 MVP  
**Last Updated:** 2025-12-14  

> This document refines v2.0 by defining missing algorithms, formulas, edge cases, and contracts.

---

## 0. Design Principles (v1)

- **Deterministic & testable:** v1 uses explicit heuristics and exact matching. No embeddings.
- **Separation of concerns:** Layer 2 analyzes and recommends; Orchestrator decides/acts.
- **Config-driven thresholds:** No magic numbers in code.
- **Graceful degradation:** If optional inputs (JD) are missing, outputs remain valid with lower confidence.

---

## 1. Purpose & Role in the Stack

Layer 2 is the analytical layer that:
- Computes **gap analyses** (skills, tools, experience, seniority, industry)
- Computes an **overall_fit_score** (0–100) for the current target
- Recommends a **strategy mode** based on resume quality + pipeline signals + gaps
- Emits structured reasoning for downstream layers (Orchestrator / Job Discovery / Coach)

Non-responsibilities:
- No direct user messaging
- No job search queries
- No resume rewriting
- No pipeline tracking

---

## 2. Inputs

Layer 2 receives **structured summaries**, not raw resume text.

### 2.1 Required Inputs

#### From Layer 1 (Evaluation Engine)
```ts
interface Layer1Evaluation {
  resume_score: number;                 // 0..100
  content_quality_score: number;        // 0..100
  ats_compatibility_score: number;      // 0..100

  weaknesses: string[];
  identified_gaps: {
    weak_bullets: number;
    missing_skills: string[];           // role-based generic gaps (may be empty)
    vague_experience: boolean;
  };

  // REQUIRED ADDITIONS for Layer 2 implementability:
  extracted: {
    skills: string[];                   // normalized capability list
    tools: string[];                    // normalized tool/platform list
    titles: string[];                   // ordered most-recent first
    bullets_sample?: string[];          // optional (first N bullets across roles)
    industries?: string[];              // optional (if extracted)
  };

  // OPTIONAL (if Layer 1 ran JD matching)
  jd_match?: {
    match_score: number;                // 0..100
    missing_critical: string[];         // keywords / skills missing
    underrepresented: string[];
    irrelevant: string[];
  };

  // OPTIONAL (if Layer 1 ran LLM insights)
  ai_summary?: {
    seniority_level?: "entry"|"mid"|"senior"|"lead";
    seniority_confidence?: "low"|"medium"|"high";
  };
}
```

#### From Layer 4 (Memory & State)
```ts
interface Layer4State {
  pipeline_state: {
    total_applications: number;
    applications_last_7_days: number;
    applications_last_30_days: number;

    interview_requests: number;
    interview_rate: number;             // interviews / applications (0..1)

    offers: number;
    rejections: number;
  };

  user_profile: {
    target_roles: string[];
    target_seniority?: "entry"|"mid"|"senior"|"lead";
    years_experience?: number;

    preferences?: {
      work_arrangement?: string[];
      locations?: string[];
      salary_minimum?: number;
      excluded_industries?: string[];
    };
  };

  current_strategy_mode?: StrategyMode | null;
  strategy_history?: Array<{
    from: StrategyMode;
    to: StrategyMode;
    changed_at: string;                 // ISO date
    reason: string;
  }>;
}
```

### 2.2 Optional Inputs (External)

```ts
interface JobContext {
  job_description?: string;

  job_requirements?: {
    required_skills: string[];
    preferred_skills?: string[];
    required_tools: string[];
    preferred_tools?: string[];
    seniority_expected?: "entry"|"mid"|"senior"|"lead";
    domain_keywords?: string[];

    // Optional weighting info (if produced by JD parser)
    keyword_importance?: Record<string, "critical"|"important"|"nice">;
  };
}
```

---

## 3. Normalization & Taxonomies

### 3.1 Canonicalization Rules

All matching in v1 uses canonicalized strings:

```
canonicalize(term):
  t = term.lower().strip()
  t = collapse_whitespace(t)
  t = remove_surrounding_punctuation(t)
  t = normalize_common_symbols(t)   # "c#" stays "c#", "c++" stays "c++"
  t = synonym_map.get(t, t)
  return t
```

### 3.2 Capability Type Rules (Skills vs Tools)

v1 separation is taxonomy-driven:

- **Skill:** languages, frameworks, methods, concepts, soft skills (e.g., python, sql, system design, leadership)
- **Tool:** platforms/services/products (e.g., aws, docker, kubernetes, jira, figma)

A term may exist in both; the canonical taxonomy decides the primary type.

Implementation: maintain `capability_taxonomy.json` with:
```json
{
  "skills": ["python","sql","react","leadership","product discovery"],
  "tools": ["aws","gcp","docker","kubernetes","jira","figma"],
  "synonyms": {"js":"javascript","py":"python","react.js":"react","postgres":"postgresql"}
}
```

---

## 4. Gap Analyses (Algorithms)

### 4.1 Skills Gap

**Inputs:**
- resume_skills = Layer1Evaluation.extracted.skills
- required_skills / preferred_skills from JobContext OR role defaults

**Algorithm:**
1) Canonicalize both lists
2) Compute matched/missing sets
3) Classify missing as critical/important/nice
4) Compute match_percentage

**Criticality rules (v1):**
- If `job_requirements.keyword_importance` exists, use it.
- Else if `job_description` exists, mark top-N TF-IDF terms as **critical** (N=10), next M as **important** (M=20), rest **nice**.
- Else (no JD), treat `required_skills` as **important** and `preferred_skills` as **nice**.

**Scoring:**
- skills.match_percentage = 100 * (matched_required / max(1, total_required))
- skills.critical_missing = missing terms with importance == critical

### 4.2 Tools Gap

Same algorithm and scoring as skills, using tools lists.

### 4.3 Experience Gap (v1 Basic)

We define a fixed taxonomy of experience types:

```ts
type ExperienceType =
  | "leadership"
  | "cross_functional"
  | "project_management"
  | "stakeholder_management"
  | "customer_facing"
  | "data_driven"
  | "architecture_system_design"
  | "shipping_ownership"
  | "mentorship"
  | "process_improvement";
```

**Detection rule (v1):**
- `resume_present_types` = keyword rules on Layer1Evaluation.extracted.titles + bullets_sample (if available)
- `jd_required_types` = keyword rules on job_description OR derived from job_requirements lists (fallback)

**Coverage:**
- experience.coverage_score = 100 * (|present ∩ required| / max(1, |required|))
- experience.missing_types = required - present

### 4.4 Seniority Alignment

We estimate `user_level` from multiple signals:

Signals:
1) If `ai_summary.seniority_level` exists and confidence != low → use it.
2) Else use title keywords on most-recent title.
3) Else use years_experience mapping.

Years mapping (default, configurable per role family):
- <2: entry
- 2–4: mid
- 5–7: senior
- 8+: lead

Conflict rule:
- If title suggests 2+ levels higher than years mapping → use years mapping + flag mismatch.

Alignment:
- underqualified if user_level < role_expected
- aligned if equal
- overqualified if user_level > role_expected

### 4.5 Industry Alignment (v1 Basic)

Sources:
- `domain_keywords` from job_requirements (preferred)
- else extract from job_description using a curated industry keyword taxonomy
- else fallback to user_profile target roles only (low confidence)

Score:
- industry.match_percentage = 100 * (matched_domain / max(1, total_domain))
- keywords_missing = required - present

---

## 5. Overall Fit Score

We compute a single `overall_fit_score` for the target.

Default weights (configurable):
- skills: 0.35
- tools: 0.20
- experience: 0.20
- industry: 0.15
- seniority: 0.10

Seniority subscore:
- aligned: 100
- underqualified: 70
- overqualified: 80

Penalty:
- If critical_missing_skills_count > 0 → subtract min(20, 5 * count)
- If critical_missing_tools_count > 0 → subtract min(15, 3 * count)

Formula:
```
fit = Σ(weight_i * score_i) - penalties
overall_fit_score = clamp(round(fit), 0, 100)
```

Confidence:
- high: JD present AND extracted.skills/tools present AND years_experience known
- medium: partial JD or partial extracted data
- low: no JD + missing extracted data

---

## 6. Strategy Mode Recommendation

### 6.1 Config

All thresholds are config-driven:

```ts
interface StrategyThresholds {
  resume_score_min: number;                 // default 75
  application_volume_test: number;          // default 30
  interview_rate_min: number;               // default 0.02
  mode_hysteresis: {
    resume_score_buffer: number;            // default 3 (avoid flip-flop)
    min_days_in_mode: number;               // default 5
  };
}
```

### 6.2 Decision Rules (v1)

Priority order:
1) **IMPROVE_RESUME_FIRST** if resume_score < resume_score_min
2) **RETHINK_TARGETS** if applications >= application_volume_test AND interview_rate < interview_rate_min
3) Else **APPLY_MODE**

Hysteresis:
- If current mode is IMPROVE and score is between [resume_score_min, resume_score_min + buffer], keep IMPROVE until buffer exceeded.
- If switching modes within min_days_in_mode, require a stronger trigger (e.g., interview_rate < 0.5 * interview_rate_min).

### 6.3 Reasoning Fields

mode_reasoning.primary_reason must be one of:
- "resume_below_threshold"
- "low_interview_rate_after_volume"
- "healthy_state_default"

supporting_factors may include:
- "critical_missing_skills"
- "critical_missing_tools"
- "seniority_mismatch"
- "industry_mismatch"
- "weak_bullets_high"
- "vague_experience_flag"

---

## 7. Output Schema (Final)

```ts
type StrategyMode = "IMPROVE_RESUME_FIRST" | "APPLY_MODE" | "RETHINK_TARGETS";

interface StrategyAnalysisResult {
  analysis_version: "2.1";
  generated_at: string;                      // ISO datetime
  inputs_used: {
    used_jd: boolean;
    used_job_requirements: boolean;
  };

  overall_fit_score: number;                 // 0..100
  confidence_level: "low"|"medium"|"high";

  gaps: {
    skills: {
      matched: string[];
      critical_missing: string[];
      match_percentage: number;
      confidence: "low"|"medium"|"high";
    };
    tools: {
      matched: string[];
      critical_missing: string[];
      match_percentage: number;
      confidence: "low"|"medium"|"high";
    };
    experience: {
      missing_types: ExperienceType[];
      coverage_score: number;
      confidence: "low"|"medium"|"high";
    };
    seniority: {
      user_level: "entry"|"mid"|"senior"|"lead";
      role_expected: "entry"|"mid"|"senior"|"lead";
      alignment: "underqualified"|"aligned"|"overqualified";
      confidence: "low"|"medium"|"high";
      flags?: string[];
    };
    industry: {
      keywords_matched: string[];
      keywords_missing: string[];
      match_percentage: number;
      confidence: "low"|"medium"|"high";
    };
  };

  recommended_mode: StrategyMode;

  mode_reasoning: {
    primary_reason: string;
    supporting_factors: string[];
    confidence: "low"|"medium"|"high";
  };

  priority_actions: string[];                // 3-5 items
  key_insights: string[];                    // 3-7 items

  // Debug/troubleshooting (optional, strip in prod)
  debug?: {
    penalties_applied: string[];
    thresholds_snapshot: StrategyThresholds;
  };
}
```

---

## 8. Edge Cases & Fallbacks

- Missing JD: set confidence low; fill gaps via role defaults; never crash.
- Empty extracted skills/tools: return 0% match, include flags and recommend IMPROVE.
- Fresh grad (<1 year): force user_level=entry; experience gap expected; relax fit penalties.
- Career changer: if industry mismatch high but transferable skills high, recommend APPLY with targeted experiments, not hard RETHINK by default.
- Skill spam (>60 items): cap match_percentage and add flag "POSSIBLE_SKILL_SPAM".

---

## 9. Validation & Monitoring

Log for each analysis:
- inputs completeness
- recommended_mode
- downstream outcomes: interview_rate delta, time to first interview, mode override rate

Target metrics (v1):
- Mode override rate < 20%
- Improvement after IMPROVE mode: +5 resume_score median
- After RETHINK: interview_rate improvement within 14–21 days (median)

---

## 10. Testing Requirements

- Unit tests for canonicalize() and synonym mapping.
- Golden tests with fixed fixtures (resume+JD) asserting exact outputs.
- Edge case tests for empty inputs, missing JD, spam skills, conflicting seniority signals.
