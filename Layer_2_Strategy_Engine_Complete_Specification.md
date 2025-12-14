# Layer 2 – Strategy Engine (Career Path Analysis)
## Complete Specification: MVP + Future Roadmap

**Version:** 2.1 (MVP) + Future Vision  
**Status:** Part I Implementation-Ready | Part II Roadmap  
**Last Updated:** December 15, 2025  

---

## Document Purpose

This is the **single source of truth** for Layer 2 Strategy Engine development. It contains:

- **Part I:** MVP Implementation (v2.1) - ready to code now
- **Part II:** Post-MVP Roadmap - what's coming next
- **Part III:** Migration Guides - how to evolve the system

**For developers:** Start with Part I for immediate implementation. Reference Part II when making architectural decisions to ensure code is extensible.

---

# PART I: MVP IMPLEMENTATION (v2.1)

> **Status:** ✅ Approved for implementation (95% ready)  
> **Timeline:** Weeks 3-4 of 8-week roadmap  
> **Effort:** 6-10 developer-days

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

**Implementation note for future:** This function should be **pluggable** to allow semantic matching later (Part II, Phase 2).

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

**v1 taxonomy size:** ~500 skills, ~200 tools, ~100 synonyms  
**Future expansion (Part II):** 2000+ skills, semantic matching

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

**Implementation note for future:** Use interface/strategy pattern here to allow swapping ExactMatcher → SemanticMatcher in Phase 2.

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

**Keyword rules (v1 - basic):**
```python
EXPERIENCE_KEYWORDS = {
    'leadership': ['led', 'managed team', 'supervised', 'mentored'],
    'cross_functional': ['collaborated', 'partnered with', 'worked with'],
    'project_management': ['roadmap', 'sprint', 'agile', 'stakeholder'],
    # ... etc
}
```

**Future enhancement (Part II, Phase 2):** NLP-based detection using bullet content analysis.

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

**Title keyword examples:**
```python
SENIORITY_KEYWORDS = {
    'lead': ['cto', 'vp', 'director', 'head of', 'lead', 'principal', 'staff', 'architect'],
    'senior': ['senior', 'sr', 'sr.', 'expert'],
    'entry': ['junior', 'jr', 'jr.', 'associate', 'intern', 'trainee']
}
```

### 4.5 Industry Alignment (v1 Basic)

Sources:
- `domain_keywords` from job_requirements (preferred)
- else extract from job_description using a curated industry keyword taxonomy
- else fallback to user_profile target roles only (low confidence)

Score:
- industry.match_percentage = 100 * (matched_domain / max(1, total_domain))
- keywords_missing = required - present

**Industry taxonomy (v1 - basic):**
```json
{
  "ecommerce": ["shopify", "cart", "checkout", "inventory", "product catalog"],
  "fintech": ["payments", "transactions", "kyc", "aml", "compliance"],
  "healthcare": ["hipaa", "ehr", "emr", "clinical", "patients"],
  "saas": ["subscription", "multi-tenant", "api", "integration"]
}
```

**Future (Part II):** Expand to 50+ industries with 100+ keywords each.

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

**Implementation note for future:** This logic should be **extracted into a ModeSelector class** to allow ML-based mode selection in Phase 3.

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

---

# PART II: POST-MVP ROADMAP

> **Purpose:** Guide future development to ensure current code is extensible  
> **Timeline:** Phases 2-4 (Weeks 9+)

---

## Phase 2: Enhanced Features (Weeks 9-12)

**Goal:** Improve accuracy and reduce false positives while maintaining MVP simplicity

### 2.1 Semantic Skill Matching

**Status:** Deferred (v2.2)  
**Priority:** High  
**Effort:** 5-7 days

**What:**
Replace exact string matching with embedding-based semantic similarity.

**Why:**
- Handles synonyms: "Python" ≈ "scripting" ≈ "programming"
- Reduces false negatives when users phrase skills differently
- Industry standard: most job boards use this

**How:**

```python
# Current (v2.1 - exact matching)
def match_skills(resume_skills, jd_skills):
    return set(resume_skills) & set(jd_skills)

# Enhanced (v2.2 - semantic matching)
class SemanticSkillMatcher:
    def __init__(self):
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        self.threshold = 0.85  # cosine similarity
    
    def match(self, resume_skills, jd_skills):
        resume_embeddings = self.model.encode(resume_skills)
        jd_embeddings = self.model.encode(jd_skills)
        
        matches = []
        for r_skill, r_emb in zip(resume_skills, resume_embeddings):
            for j_skill, j_emb in zip(jd_skills, jd_embeddings):
                similarity = cosine_similarity(r_emb, j_emb)
                if similarity >= self.threshold:
                    matches.append((r_skill, j_skill, similarity))
        
        return matches
```

**Dependencies:**
- sentence-transformers library
- Embedding cache (Redis/DB) for performance
- Config flag: `use_semantic_matching: true/false`

**Migration from v2.1:**
- Keep ExactMatcher as fallback
- A/B test semantic vs exact for 2 weeks
- Measure: false positive rate, user feedback

**Success Metrics:**
- Reduce "missing skills" false positives by 30%
- Match quality user rating: >4/5

---

### 2.2 Expanded Skill Taxonomy

**Status:** Deferred (v2.2)  
**Priority:** Medium  
**Effort:** 3 days

**What:**
Expand `capability_taxonomy.json` from 500 skills to 2000+ skills.

**Why:**
- Current taxonomy misses niche skills (e.g., "Terraform", "Snowflake", "dbt")
- Users report "unrecognized skills" frequently

**How:**

```json
{
  "skills": {
    "programming_languages": ["python", "java", "javascript", "rust", "go", ...],
    "frameworks": ["react", "vue", "angular", "django", "flask", ...],
    "data": ["sql", "spark", "airflow", "dbt", "snowflake", ...],
    "ml": ["tensorflow", "pytorch", "scikit-learn", "huggingface", ...],
    "soft_skills": ["leadership", "communication", "stakeholder management", ...]
  },
  "tools": {
    "cloud": ["aws", "azure", "gcp", "cloudflare", ...],
    "devops": ["docker", "kubernetes", "terraform", "ansible", ...],
    "monitoring": ["datadog", "grafana", "prometheus", "newrelic", ...],
    "productivity": ["jira", "asana", "notion", "figma", "miro", ...]
  },
  "synonyms": {
    "js": "javascript",
    "py": "python",
    "k8s": "kubernetes",
    "tf": "terraform",
    ...
  }
}
```

**Data Sources:**
- Indeed/LinkedIn skill frequency analysis
- O*NET database
- GitHub trending technologies
- Manual curation for quality

**Maintenance:**
- Quarterly updates
- Community contributions via PR

---

### 2.3 Synonym Detection (Basic)

**Status:** Deferred (v2.2)  
**Priority:** High  
**Effort:** 2 days

**What:**
Automatic detection of synonyms beyond hard-coded map.

**Why:**
- "Data wrangling" = "Data cleaning" = "Data preprocessing"
- Hard to maintain exhaustive synonym map

**How (v2.2 - rule-based):**

```python
def detect_synonym_candidates(skill1, skill2):
    """Simple heuristics for synonym detection"""
    
    # Levenshtein distance (typos)
    if levenshtein_distance(skill1, skill2) <= 2:
        return True, "typo_variant"
    
    # Acronym expansion
    if skill1.lower() == ''.join([w[0] for w in skill2.split()]):
        return True, "acronym"
    
    # Common prefixes/suffixes
    if skill1.replace('ing', '') == skill2 or skill2.replace('ing', '') == skill1:
        return True, "verb_form"
    
    return False, None

# Example
detect_synonym_candidates("ML", "machine learning")  # True, "acronym"
detect_synonym_candidates("coding", "code")          # True, "verb_form"
```

**Future (v2.3+):**
- Use embeddings for semantic synonyms
- Crowdsource synonym pairs from user corrections

---

### 2.4 Skill Strength Scoring

**Status:** Deferred (v2.2)  
**Priority:** Medium  
**Effort:** 4 days

**What:**
Instead of binary (has skill / doesn't have), score each skill 0-100.

**Why:**
- "Proficient in Python" ≠ "Familiar with Python"
- Better gap prioritization: focus on skills with low strength

**How:**

```python
def score_skill_strength(skill, resume_data):
    """
    Score skill strength based on:
    - Frequency: How many times mentioned
    - Recency: When last used
    - Context: Mentioned in titles, bullets, projects
    - Years: How long they've used it
    """
    
    score = 0
    
    # Frequency (0-30 points)
    mentions = count_skill_mentions(skill, resume_data)
    score += min(mentions * 5, 30)
    
    # Recency (0-25 points)
    last_used_years_ago = get_skill_recency(skill, resume_data)
    if last_used_years_ago == 0:
        score += 25
    elif last_used_years_ago <= 2:
        score += 20
    elif last_used_years_ago <= 5:
        score += 10
    
    # Context (0-25 points)
    if skill in resume_data.titles:
        score += 15  # In job title = strong signal
    if skill in resume_data.projects:
        score += 10  # Personal projects = practice
    
    # Years of experience (0-20 points)
    years = estimate_skill_years(skill, resume_data)
    score += min(years * 4, 20)
    
    return min(score, 100)
```

**Output changes:**
```ts
skills: {
  matched: Array<{skill: string, strength: number}>,  // Changed
  critical_missing: Array<{skill: string, importance: number}>,
  ...
}
```

**Migration:**
- Add `skill_strength_enabled: false` config flag for v2.2
- Enable after testing

---

## Phase 3: Advanced Features (Months 4-6)

**Goal:** Add strategic planning and proactive guidance

### 3.1 30/60/90-Day Roadmap Generation

**Status:** Deferred (v2.3)  
**Priority:** High  
**Effort:** 8-10 days

**What:**
Generate personalized, time-bound improvement plan based on gaps.

**Why:**
- Users don't know where to start with 10+ gaps
- Need structured, achievable plan
- Differentiates from competitors (Jobscan, Resume Worded don't have this)

**How:**

```python
def generate_roadmap(gaps, user_profile):
    """
    Generate 30/60/90 day improvement roadmap
    
    Strategy:
    - Days 1-30: Critical fixes (resume quality, top 3 skills)
    - Days 31-60: Build evidence (projects, metrics)
    - Days 61-90: Expand (adjacent skills, portfolio)
    """
    
    roadmap = {
        "30_days": [],
        "60_days": [],
        "90_days": []
    }
    
    # Phase 1 (30 days): Critical gaps
    for skill in gaps.skills.critical_missing[:3]:  # Top 3 only
        roadmap["30_days"].append({
            "type": "skill_acquisition",
            "action": f"Complete online course for {skill}",
            "resources": get_course_recommendations(skill),
            "time_required": "10-15 hours",
            "priority": "critical"
        })
    
    if gaps.experience.missing_types:
        for exp_type in gaps.experience.missing_types[:2]:
            roadmap["30_days"].append({
                "type": "resume_rewrite",
                "action": f"Rewrite bullets to highlight {exp_type} experience",
                "guidance": get_bullet_templates(exp_type),
                "time_required": "2-3 hours",
                "priority": "high"
            })
    
    # Phase 2 (60 days): Evidence building
    for skill in gaps.skills.critical_missing[:3]:
        roadmap["60_days"].append({
            "type": "project",
            "action": f"Build portfolio project demonstrating {skill}",
            "project_ideas": get_project_suggestions(skill, user_profile.target_roles),
            "time_required": "20-30 hours",
            "priority": "medium"
        })
    
    # Phase 3 (90 days): Breadth expansion
    for skill in gaps.skills.important_missing[:3]:
        roadmap["90_days"].append({
            "type": "skill_acquisition",
            "action": f"Gain familiarity with {skill}",
            "resources": get_quick_start_resources(skill),
            "time_required": "5-10 hours",
            "priority": "low"
        })
    
    return roadmap
```

**Output schema:**
```ts
interface RoadmapItem {
  type: "skill_acquisition" | "project" | "resume_rewrite" | "networking";
  action: string;                    // User-facing description
  rationale: string;                 // Why this helps
  resources?: string[];              // Links to courses, tutorials
  time_required: string;             // "5-10 hours"
  priority: "critical" | "high" | "medium" | "low";
  estimated_impact: string;          // "+10 points fit score"
}

interface Roadmap {
  "30_days": RoadmapItem[];
  "60_days": RoadmapItem[];
  "90_days": RoadmapItem[];
}
```

**Resources needed:**
- Course database (Coursera, Udemy, FreeCodeCamp)
- Project idea templates
- Bullet rewrite templates

**Success metrics:**
- 70%+ users find roadmap "helpful"
- 40%+ complete at least 1 item from 30-day plan

---

### 3.2 Project Suggestions

**Status:** Deferred (v2.3)  
**Priority:** Medium  
**Effort:** 5 days

**What:**
Suggest specific portfolio projects to close skill gaps.

**Why:**
- Learning by doing > courses alone
- Tangible proof for resume
- Especially valuable for career changers

**How:**

```python
def suggest_projects(missing_skills, target_role, current_level):
    """
    Suggest portfolio projects based on:
    - Missing skills to learn
    - Target role requirements
    - User's current level (don't suggest too advanced)
    """
    
    projects = []
    
    # Map skills to project types
    SKILL_TO_PROJECT = {
        ("python", "api", "database"): {
            "title": "REST API with Database",
            "description": "Build a CRUD API with FastAPI and PostgreSQL",
            "skills_practiced": ["python", "sql", "api design", "postgresql"],
            "difficulty": "medium",
            "time": "20-30 hours",
            "deliverables": ["GitHub repo", "API documentation", "Deployed demo"]
        },
        ("react", "frontend"): {
            "title": "Interactive Dashboard",
            "description": "Create a data visualization dashboard with React",
            "skills_practiced": ["react", "javascript", "data visualization"],
            "difficulty": "medium",
            "time": "15-25 hours",
            "deliverables": ["Live demo", "GitHub repo", "Screenshots"]
        },
        # ... 50+ project templates
    }
    
    # Find matching projects
    for skill_set, project in SKILL_TO_PROJECT.items():
        if any(skill in missing_skills for skill in skill_set):
            # Adjust difficulty based on user level
            if current_level == "entry" and project["difficulty"] == "advanced":
                continue  # Skip too-advanced projects
            
            projects.append(project)
    
    # Rank by:
    # 1. How many missing skills it covers
    # 2. Relevance to target role
    # 3. Difficulty match
    
    return sorted(projects, key=rank_project, reverse=True)[:5]
```

**Output:**
```ts
interface ProjectSuggestion {
  title: string;
  description: string;
  skills_practiced: string[];
  difficulty: "easy" | "medium" | "advanced";
  estimated_time: string;
  deliverables: string[];
  tutorial_links?: string[];
  why_this_helps: string;
}
```

**Future:**
- AI-generated project ideas (GPT-4)
- Community project templates
- Progress tracking

---

### 3.3 Industry-Specific Weights

**Status:** Deferred (v2.3)  
**Priority:** Medium  
**Effort:** 3 days

**What:**
Different weight configurations for different industries/roles.

**Why:**
- PM cares more about experience types than tools
- SWE cares more about technical skills
- Sales cares about customer_facing + communication

**How:**

```json
// config/industry_weights.json
{
  "software_engineer": {
    "skills": 0.40,      // Higher for technical roles
    "tools": 0.25,
    "experience": 0.15,
    "industry": 0.10,
    "seniority": 0.10
  },
  
  "product_manager": {
    "skills": 0.20,
    "tools": 0.15,
    "experience": 0.35,  // Higher for experience-heavy roles
    "industry": 0.20,
    "seniority": 0.10
  },
  
  "data_scientist": {
    "skills": 0.35,
    "tools": 0.30,       // Tools matter (Python, SQL, Spark)
    "experience": 0.20,
    "industry": 0.10,
    "seniority": 0.05
  },
  
  "sales": {
    "skills": 0.15,
    "tools": 0.10,
    "experience": 0.40,  // Customer-facing experience critical
    "industry": 0.25,    // Industry knowledge important
    "seniority": 0.10
  }
}
```

**Usage:**
```python
def select_weights(target_role):
    role_family = classify_role(target_role)  # "software_engineer"
    return INDUSTRY_WEIGHTS.get(role_family, DEFAULT_WEIGHTS)
```

**Data collection:**
- Analyze successful applications by role
- Survey hiring managers
- A/B test different weights

---

### 3.4 ML-Based Mode Selection

**Status:** Deferred (v2.3)  
**Priority:** Low (data-dependent)  
**Effort:** 15 days + ongoing

**What:**
Replace rule-based mode selection with ML model trained on outcomes.

**Why:**
- Rules are static, ML adapts
- Can discover patterns we didn't anticipate
- Personalized recommendations

**Requirements:**
- Minimum 10,000 users with outcome data
- Track: mode followed → interview rate change
- Features: resume_score, gaps, user demographics, job market

**How (simplified):**

```python
from sklearn.ensemble import RandomForestClassifier

class MLModeSelector:
    def __init__(self):
        self.model = self.load_model()
    
    def recommend_mode(self, features):
        """
        Features:
        - resume_score
        - total_applications
        - interview_rate
        - critical_missing_count
        - days_in_current_mode
        - user_seniority
        - target_role_competitiveness (scraped data)
        """
        
        prediction = self.model.predict_proba(features)
        # Returns: [prob_IMPROVE, prob_APPLY, prob_RETHINK]
        
        mode = np.argmax(prediction)
        confidence = max(prediction)
        
        return {
            "mode": ["IMPROVE_RESUME_FIRST", "APPLY_MODE", "RETHINK_TARGETS"][mode],
            "confidence": confidence,
            "reasoning": self.explain_prediction(features)  # SHAP values
        }
    
    def train(self, training_data):
        """
        Training data:
        X: features (resume_score, gaps, etc.)
        y: best mode (inferred from outcomes)
        
        Label strategy:
        - If user improved resume and then got interviews → label = IMPROVE
        - If user applied broadly and got interviews → label = APPLY
        - If user changed targets and got interviews → label = RETHINK
        """
        ...
```

**Fallback:**
- Keep rule-based as default
- ML mode requires `ml_mode_selection_enabled: true` flag
- If ML confidence < 0.6, use rules

**Timeline:**
- Month 6: Collect data
- Month 9: Train initial model
- Month 12: A/B test ML vs rules

---

## Phase 4: Intelligent Features (Months 6-12)

**Goal:** Predictive and deeply personalized

### 4.1 Confidence Intervals (Statistical)

**Status:** Deferred (v2.4)  
**Priority:** Low  
**Effort:** 4 days

**What:**
Replace low/medium/high with statistical confidence intervals.

**Why:**
- "Medium confidence" is vague
- Better decision-making with ranges

**How:**

```python
def calculate_confidence_interval(score, sample_size, variance):
    """
    Use bootstrap or Bayesian methods
    """
    
    # Example: Bootstrap
    scores = bootstrap_sample(score, sample_size, n=1000)
    ci_lower = np.percentile(scores, 2.5)
    ci_upper = np.percentile(scores, 97.5)
    
    return {
        "point_estimate": score,
        "ci_95_lower": ci_lower,
        "ci_95_upper": ci_upper,
        "confidence_level": 0.95
    }

# Example output
skills: {
  match_percentage: 72,
  match_percentage_ci: {
    point_estimate: 72,
    ci_95_lower: 65,
    ci_95_upper: 79,
    confidence_level: 0.95
  }
}
```

---

### 4.2 Predictive Analytics

**Status:** Deferred (v2.4)  
**Priority:** Low (requires extensive data)  
**Effort:** 20+ days

**What:**
Predict interview probability, expected time to offer, etc.

**Examples:**

```python
def predict_interview_probability(user_profile, job, historical_data):
    """
    Predict: What's the probability this user gets an interview for this job?
    
    Based on:
    - Their resume score
    - Fit score
    - Job competitiveness
    - Historical outcomes for similar profiles
    """
    
    similar_candidates = find_similar_profiles(user_profile, historical_data)
    success_rate = similar_candidates.interview_rate.mean()
    
    # Adjust for job-specific factors
    job_difficulty = estimate_job_difficulty(job)
    adjusted_probability = success_rate * (1 - job_difficulty * 0.3)
    
    return {
        "interview_probability": adjusted_probability,
        "confidence": "medium",
        "based_on": f"{len(similar_candidates)} similar profiles"
    }
```

**Requirements:**
- 50,000+ application outcomes
- Job competitiveness data
- Ethical considerations (bias detection)

---

### 4.3 Automated Seniority Detection (NLP)

**Status:** Deferred (v2.4)  
**Priority:** Low  
**Effort:** 6 days

**What:**
Use NLP on bullet content to estimate seniority, not just titles.

**Why:**
- Titles can be inflated or outdated
- Bullet content reveals true scope/impact

**How:**

```python
from transformers import pipeline

class NLPSeniorityDetector:
    def __init__(self):
        self.classifier = pipeline("text-classification", 
                                   model="custom-seniority-model")
    
    def detect_seniority(self, bullets):
        """
        Analyze bullets for seniority signals:
        - Scope: "team of 5" vs "organization of 200"
        - Impact: "reduced cost" vs "reduced cost by $2M"
        - Leadership: "implemented" vs "led implementation"
        """
        
        seniority_scores = {
            'entry': 0,
            'mid': 0,
            'senior': 0,
            'lead': 0
        }
        
        for bullet in bullets:
            classification = self.classifier(bullet)
            # Returns: {"entry": 0.1, "mid": 0.3, "senior": 0.5, "lead": 0.1}
            
            for level, score in classification.items():
                seniority_scores[level] += score
        
        # Normalize
        total = sum(seniority_scores.values())
        for level in seniority_scores:
            seniority_scores[level] /= total
        
        return max(seniority_scores, key=seniority_scores.get)
```

**Training data:**
- Manually label 5000+ resumes by seniority
- Use OpenAI/Anthropic for synthetic data generation

---

### 4.4 Outdated Tools Detection

**Status:** Deferred (v2.4)  
**Priority:** Low  
**Effort:** 3 days

**What:**
Flag tools that are obsolete or declining in industry use.

**Why:**
- "jQuery" was popular but now declining
- Helps users prioritize what to learn

**How:**

```json
{
  "outdated_tools": {
    "jquery": {
      "status": "declining",
      "peak_year": 2015,
      "current_trend": -15,  // % decline per year
      "replacement": "react",
      "message": "jQuery usage declining. Consider learning React."
    },
    "angular.js": {
      "status": "legacy",
      "replacement": "angular",
      "message": "AngularJS (1.x) is legacy. Modern Angular (2+) recommended."
    }
  }
}
```

**Data sources:**
- Stack Overflow trends
- GitHub star trends
- Job posting frequency (Indeed, LinkedIn)

**Output:**
```ts
tools: {
  matched: string[],
  critical_missing: string[],
  outdated: Array<{
    tool: string,
    status: "declining" | "legacy" | "obsolete",
    replacement: string,
    message: string
  }>
}
```

---

# PART III: MIGRATION GUIDES

> **Purpose:** Ensure smooth transitions between versions

---

## v2.1 → v2.2 (Enhanced) Migration

**Breaking Changes:**
- None (backward compatible)

**New Features:**
- Semantic skill matching (opt-in via config)
- Expanded taxonomy
- Skill strength scoring (opt-in)

**Config changes:**
```json
{
  "features": {
    "semantic_matching": false,        // NEW (default off for safety)
    "skill_strength_scoring": false    // NEW
  },
  "taxonomy_version": "2.0"            // NEW (was 1.0)
}
```

**Code changes:**
```python
# Before (v2.1)
from analyzers import ExactSkillMatcher
matcher = ExactSkillMatcher()

# After (v2.2) - with feature flag
from analyzers import ExactSkillMatcher, SemanticSkillMatcher
from config import load_config

config = load_config()
if config.features.semantic_matching:
    matcher = SemanticSkillMatcher()
else:
    matcher = ExactSkillMatcher()  # Fallback
```

**Testing:**
1. Run v2.1 test suite on v2.2 → all pass
2. Enable semantic_matching → A/B test for 2 weeks
3. Monitor false positive rate
4. If success → make default in v2.3

---

## v2.2 → v2.3 (Advanced) Migration

**Breaking Changes:**
- Output schema changes (roadmap added)

**Before:**
```ts
interface StrategyAnalysisResult {
  ...
  priority_actions: string[];  // Simple list
}
```

**After:**
```ts
interface StrategyAnalysisResult {
  ...
  priority_actions: string[];    // Kept for backward compat
  roadmap?: Roadmap;             // NEW (optional)
}
```

**Code changes:**
```python
# v2.3 adds roadmap generation
result = analyze_strategy(...)

if config.features.roadmap_generation:
    result.roadmap = generate_roadmap(result.gaps, user_profile)
```

**Migration steps:**
1. Deploy v2.3 with `roadmap_generation: false`
2. Test roadmap generation on staging
3. Enable for 10% of users
4. Collect feedback
5. Rollout to 100%

---

## v2.3 → v2.4 (Intelligent) Migration

**Breaking Changes:**
- Confidence format change

**Before:**
```ts
confidence_level: "low"|"medium"|"high"
```

**After:**
```ts
confidence: {
  level: "low"|"medium"|"high",    // Kept
  interval?: {                      // NEW
    point_estimate: number,
    ci_95_lower: number,
    ci_95_upper: number
  }
}
```

**Backward compatibility:**
- Old clients can ignore `interval` field
- New clients get richer data

---

# APPENDICES

## Appendix A: Config File Reference

**Complete config structure:**

```json
{
  "analysis_version": "2.1",
  
  "strategy_thresholds": {
    "resume_score_min": 75,
    "application_volume_test": 30,
    "interview_rate_min": 0.02,
    "mode_hysteresis": {
      "resume_score_buffer": 3,
      "min_days_in_mode": 5
    }
  },
  
  "fit_weights": {
    "skills": 0.35,
    "tools": 0.20,
    "experience": 0.20,
    "industry": 0.15,
    "seniority": 0.10
  },
  
  "seniority_years_mapping": [
    {"max_years_exclusive": 2, "level": "entry"},
    {"max_years_exclusive": 5, "level": "mid"},
    {"max_years_exclusive": 8, "level": "senior"},
    {"max_years_exclusive": 999, "level": "lead"}
  ],
  
  "features": {
    "semantic_matching": false,           // v2.2+
    "skill_strength_scoring": false,      // v2.2+
    "roadmap_generation": false,          // v2.3+
    "ml_mode_selection": false,           // v2.3+
    "confidence_intervals": false         // v2.4+
  },
  
  "taxonomy_version": "1.0"
}
```

---

## Appendix B: Implementation Checklist

**For v2.1 MVP implementation:**

- [ ] Set up capability_taxonomy.json (skills, tools, synonyms)
- [ ] Implement canonicalize() function
- [ ] Implement gap analysis functions (5 types)
- [ ] Implement overall_fit_score calculation
- [ ] Implement strategy mode selection (rule-based)
- [ ] Implement hysteresis logic
- [ ] Write unit tests (canonicalize, gap analysis)
- [ ] Write golden tests (full fixtures)
- [ ] Write edge case tests
- [ ] Set up config loading/validation
- [ ] Set up monitoring/logging
- [ ] Integration tests with Layer 1/4
- [ ] Documentation

**Estimated timeline:** 2-3 weeks (6-10 dev-days)

---

## Appendix C: Success Metrics

**v2.1 (MVP):**
- Mode override rate < 20%
- Resume score improvement after IMPROVE: +5 median
- Interview rate improvement after RETHINK: within 14-21 days

**v2.2 (Enhanced):**
- Semantic matching reduces false negatives by 30%
- Skill strength scoring user rating: >4/5

**v2.3 (Advanced):**
- Roadmap completion rate: 40%+ (30-day items)
- Project suggestions acceptance: 30%+

**v2.4 (Intelligent):**
- ML mode selection outperforms rules by 15%+
- Interview probability prediction accuracy: >70%

---

**END OF COMPLETE SPECIFICATION**

**Version:** 2.1 + Roadmap  
**Last Updated:** December 15, 2025  
**Status:** Part I Ready for Implementation | Part II Planning  
**Next Review:** After MVP launch (Week 5)
