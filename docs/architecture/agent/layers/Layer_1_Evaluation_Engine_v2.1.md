# Layer 1 – Evaluation Engine
## Complete Specification v2.1

**Version:** 2.1 (Expanded with Job-Specific Fit Analysis)
**Status:** Implementation-Ready
**Last Updated:** December 16, 2025
**Scope:** Generic resume assessment + job-specific fit evaluation

**Changelog v2.0 → v2.1:**
- Added job-specific fit evaluation via `evaluate_fit()` method
- Expanded to support both generic and job-specific evaluation modes
- Created modular architecture with shared components (Entity Extraction, Gap Detection)
- Implemented caching strategy for performance optimization
- Added FitScore interface extending GenericScore
- Defined complete GapAnalysis structure
- Added Recommendation logic (APPLY/OPTIMIZE_FIRST/NOT_READY)
- Updated scope to include both generic and job-specific evaluation

---

## Document Purpose

Single source of truth for Layer 1 Evaluation Engine development.

**Part I:** Core Specification - ready to implement  
**Part II:** Advanced Features - future roadmap

---

# PART I: CORE SPECIFICATION

## 0. Purpose & Role

Layer 1 is the **Resume Evaluation Engine** that evaluates resumes in two modes:

**Mode 1: Generic Evaluation (no job context)**
- Score resume quality across 4 core dimensions
- Extract structured entities (skills, tools, titles, companies)
- Identify weaknesses and improvement areas
- Provide actionable feedback

**Mode 2: Job-Specific Fit Evaluation (with job description)**
- Calculate fit score for specific job (0-100)
- Perform detailed gap analysis (skills, tools, experience, seniority)
- Generate tailoring recommendations
- Provide decision recommendation (APPLY/OPTIMIZE_FIRST/NOT_READY)

**Key innovation:** Single unified engine that handles both generic quality assessment and job-specific fit analysis through shared components and incremental computation.

**Positioning:** Layer 1 is the evaluation layer. Job description is a parameter, not a change of responsibility.

**Non-responsibilities:**
- Does NOT analyze career strategy (Layer 2 does)
- Does NOT rewrite content (Layer 3 does)
- Does NOT store state (Layer 4 does)
- Does NOT orchestrate workflows (Layer 5 does)

---

## 1. Design Principles

**Objective & Generic**
- Role-agnostic scoring (works for PM, SWE, Designer, etc.)
- No bias toward specific industries
- Evidence-based metrics only

**Unified Responsibility**
- "Evaluate resumes" - both generic and job-specific
- Job description is a parameter, not a separate concern
- Shared components eliminate duplication

**Deterministic**
- Same resume → same score (within version)
- No randomness, no LLM-based scoring
- Fully reproducible

**Performance Optimized**
- Generic evaluation: <2s
- Fit evaluation: <3s total (reuses generic via caching)
- Cache-friendly architecture

**Modular & Extensible**
- Facade pattern for clean API
- Strategy pattern for evaluation modes
- Easy to add new evaluation types

**Transparent**
- Every score has clear breakdown
- Issues are specific and actionable
- No "black box" scoring

---

## 2. Architecture Overview

### 2.1 Module Structure

```
Layer 1: EvaluationEngine (Facade)
├── Public API
│   ├── evaluate(resume) → GenericScore
│   └── evaluate_fit(resume, job) → FitScore
│
├── Internal Modules
│   ├── GenericScoringModule     → Calculates generic quality
│   ├── FitAnalysisModule        → Calculates job-specific fit
│   ├── EntityExtractionModule   → Extracts skills, tools, titles (SHARED)
│   ├── GapDetectionModule       → Detects missing elements (SHARED)
│   └── RecommendationModule     → Decides APPLY/OPTIMIZE/NOT_READY
│
└── Caching Layer
    └── Smart cache for generic scores
```

### 2.2 Data Flow

**Generic Evaluation:**
```
Resume → EntityExtraction → GenericScoring → GenericScore
                ↓
              Cache (5 min TTL)
```

**Fit Evaluation:**
```
Resume + Job → [Check Cache] → GenericScore (cached or computed)
                    ↓
            GapDetection (resume vs job)
                    ↓
            FitAnalysis (scores + gaps)
                    ↓
            Recommendation (APPLY/OPTIMIZE/NOT_READY)
                    ↓
                FitScore
```

**Key insight:** Fit evaluation reuses generic score (cached), only computes incremental fit analysis.

**Performance:**
- 10 jobs against same resume = 1 generic compute + 10 fit computes
- NOT 10 full evaluations!

---

## 3. Input Contract

### 3.1 From User (via API)

**Primary Input:** Resume file + optional metadata

```ts
interface EvaluationRequest {
  // Resume file
  resume: {
    content: Buffer | string;  // PDF, DOCX, or plain text
    filename: string;
    mimeType: "application/pdf" | "application/vnd.openxmlformats-officedocument.wordprocessingml.document" | "text/plain";
  };
  
  // Optional metadata (for context, not required for scoring)
  metadata?: {
    user_id?: string;           // For tracking
    target_role?: string;       // Future: role-specific insights
    target_seniority?: "entry" | "mid" | "senior" | "lead";
    years_experience?: number;  // Self-reported
  };
}
```

**Usage:**
```typescript
const result = await Layer1.evaluate(request);
```

---

### 3.2 Fit Evaluation Input (NEW!)

```typescript
interface FitEvaluationRequest extends EvaluationRequest {
  // Job description
  job_description: {
    raw_text: string;           // Full JD text

    // Optional: Pre-parsed requirements (if available)
    parsed_requirements?: {
      required_skills: string[];
      preferred_skills?: string[];
      required_tools: string[];
      preferred_tools?: string[];
      seniority_expected?: "entry" | "mid" | "senior" | "lead";
      domain_keywords?: string[];
      years_experience_min?: number;
      years_experience_max?: number;
    };
  };
}
```

**Usage:**
```typescript
const fitScore = await Layer1.evaluate_fit(fitRequest);
```

**Note:** If `parsed_requirements` not provided, Layer 1 will parse JD text internally.

---

### 3.3 Parsed Resume Structure (Internal)

After parsing, resume is transformed to structured format:

```ts
interface ParsedResume {
  // Personal info
  personal: {
    name?: string;
    email?: string;
    phone?: string;
    location?: string;
    linkedin?: string;
    github?: string;
    portfolio?: string;
  };
  
  // Work experience
  experiences: Array<{
    title: string;
    company: string;
    location?: string;
    start_date: string;         // "2020-01" or "Jan 2020"
    end_date: string | "Present";
    duration_months: number;
    bullets: string[];
    is_current: boolean;
  }>;
  
  // Education
  education: Array<{
    degree: string;
    field?: string;
    institution: string;
    graduation_year?: number;
    gpa?: number;
  }>;
  
  // Skills (if listed)
  skills: string[];
  
  // Projects (if present)
  projects?: Array<{
    name: string;
    description: string;
    technologies?: string[];
    year?: number;
    link?: string;
  }>;
  
  // Certifications & Courses
  certifications?: Array<{
    name: string;
    issuer: string;
    year?: number;
  }>;
  
  courses?: Array<{
    name: string;
    institution: string;
    year?: number;
  }>;
  
  // Document metadata
  metadata: {
    page_count: number;
    word_count: number;
    has_tables: boolean;
    has_images: boolean;
    format: "pdf" | "docx" | "txt";
    parse_quality: "high" | "medium" | "low";
  };
}
```

---

## 4. Output Contract (CRITICAL - Aligned with Layer 2 & Layer 4)

### 4.1 Primary Output Interface (GenericScore)

```ts
interface EvaluationResult {
  // Overall score (CRITICAL: Layer 2 expects "resume_score", Layer 4 stores as "overallScore")
  resume_score: number;  // 0-100
  overall_score: number; // Same value as resume_score (alias for Layer 4)
  
  level: "Early" | "Growing" | "Solid" | "Strong" | "Exceptional";
  
  // Component scores (CRITICAL: Layer 2 expects these exact names)
  content_quality_score: number;     // 0-100 (maps to skill_capital + execution_impact)
  ats_compatibility_score: number;   // 0-100 (maps to signal_quality)
  format_quality_score: number;      // 0-100 (part of signal_quality)
  impact_score: number;              // 0-100 (execution_impact)
  
  // Dimension breakdown (for internal analysis)
  dimensions: {
    skill_capital: DimensionScore;
    execution_impact: DimensionScore;
    learning_adaptivity: DimensionScore;
    signal_quality: DimensionScore;
  };
  
  // Weaknesses (CRITICAL: Layer 2 expects this array)
  weaknesses: string[];  // e.g., ["weak_verbs", "no_metrics", "poor_formatting"]
  
  // Extracted entities (CRITICAL: Layer 2 REQUIRES this!)
  extracted: {
    skills: string[];              // Normalized skill names
    tools: string[];               // Technology/tool names
    titles: string[];              // Job titles from experience
    companies: string[];           // Company names
    industries?: string[];         // Inferred industries
    bullets_sample?: string[];     // Sample bullets for rewrite
    certifications?: string[];     // Certification names
  };
  
  // Identified gaps (CRITICAL: Layer 2 uses this for analysis)
  identified_gaps: {
    missing_skills: boolean;
    missing_metrics: boolean;
    weak_action_verbs: boolean;
    generic_descriptions: boolean;
    poor_formatting: boolean;
    no_education: boolean;
    spelling_errors: boolean;
  };
  
  // Weak bullets for improvement (for Layer 3)
  weak_bullets?: Array<{
    bullet: string;
    issues: string[];  // e.g., ["weak_verb", "no_metric", "vague"]
    location: {
      company: string;
      title: string;
      index: number;
    };
  }>;
  
  // Actionable feedback (for user)
  feedback: {
    strengths: string[];           // 2-4 positive points
    critical_gaps: string[];       // 1-3 most important issues
    quick_wins: Array<{
      action: string;
      estimated_impact: string;    // "+5 points"
      effort: string;              // "15 minutes"
      priority: number;            // 1-5
    }>;
    recommendations: string[];     // 5-8 general improvements
  };
  
  // Flags
  flags: {
    no_skills_listed: boolean;
    possible_spam: boolean;
    no_experience: boolean;
    generic_descriptions: boolean;
    no_metrics: boolean;
    stagnant: boolean;
    parsing_failed: boolean;
    too_short: boolean;
  };
  
  // Summary message
  summary: string;  // 1-2 sentences
  
  // Processing metadata
  meta: {
    processing_time_ms: number;
    timestamp: string;              // ISO 8601
    version: "2.1";
    parse_quality: "high" | "medium" | "low";
  };
}

interface DimensionScore {
  score: number;  // 0-100
  breakdown?: Record<string, number>;
  issues?: string[];
}
```

---

### 4.2 Fit Score Output (NEW!)

```typescript
interface FitScore extends EvaluationResult {
  // Job-specific fit score
  fit_score: number;             // 0-100 (overall fit)

  // Multi-dimensional fit breakdown
  fit_dimensions: {
    technical_match: number;     // 0-100 (skills + tools)
    seniority_match: number;     // 0-100 (level alignment)
    experience_match: number;    // 0-100 (experience types)
    signal_quality: number;      // 0-100 (from generic score)
  };

  // Detailed gap analysis (CRITICAL for Layer 2)
  gaps: {
    skills: {
      matched: string[];
      critical_missing: string[];
      nice_to_have_missing: string[];
      transferable: string[];    // Skills that could apply
      match_percentage: number;  // 0-100
    };
    tools: {
      matched: string[];
      critical_missing: string[];
      nice_to_have_missing: string[];
      match_percentage: number;  // 0-100
    };
    experience: {
      matched_types: string[];   // e.g., ["leadership", "cross-functional"]
      missing_types: string[];
      coverage_score: number;    // 0-100
    };
    seniority: {
      user_level: "entry" | "mid" | "senior" | "lead";
      role_expected: "entry" | "mid" | "senior" | "lead";
      alignment: "underqualified" | "aligned" | "overqualified";
      gap_years?: number;        // If underqualified
    };
    industry: {
      keywords_matched: string[];
      keywords_missing: string[];
      match_percentage: number;  // 0-100
    };
  };

  // Flags for special situations
  fit_flags: {
    underqualified: boolean;
    overqualified: boolean;
    career_switch: boolean;      // Industry/role change
    low_signal: boolean;         // Resume quality too low
    stretch_role: boolean;       // Ambitious but possible
  };

  // Decision recommendation (CRITICAL for Layer 5)
  recommendation: "APPLY" | "OPTIMIZE_FIRST" | "NOT_READY";
  recommendation_reasoning: string;

  // Actionable tailoring suggestions (for Layer 3 & user)
  tailoring_hints: string[];     // 5-8 specific improvements
  priority_improvements: Array<{
    type: "add_skill" | "add_metric" | "strengthen_verb" | "add_experience";
    target: string;              // What to add/improve
    why: string;                 // Why it matters for THIS job
    estimated_impact: number;    // +X points to fit_score
  }>;

  // Processing metadata
  fit_meta: {
    job_parsed_successfully: boolean;
    confidence: "low" | "medium" | "high";
  };
}
```

**Key Design Decision:**
- FitScore **extends** EvaluationResult (inherits all generic fields)
- Adds job-specific fields (fit_score, gaps, recommendation, etc.)
- Type-safe: Callers know exactly what they get

---

### 4.3 Integration Points

**To Layer 4 (Storage):**
```typescript
// Layer 4 stores:
ResumeVersion.overallScore = result.overall_score;  // 0-100
ResumeVersion.componentScores = {
  content_quality: result.content_quality_score,
  ats_compatibility: result.ats_compatibility_score,
  format_quality: result.format_quality_score,
  impact: result.impact_score
};
```

**To Layer 2 (Strategy Analysis):**
```typescript
// Layer 2 receives via Layer 4:
interface Layer1EvaluationData {
  resume_score: number;                 // From result.resume_score
  content_quality_score: number;        // From result.content_quality_score
  ats_compatibility_score: number;      // From result.ats_compatibility_score
  weaknesses: string[];                 // From result.weaknesses
  identified_gaps: {...};               // From result.identified_gaps
  extracted: {                          // From result.extracted
    skills: string[];
    tools: string[];
    titles: string[];
    companies: string[];
    industries?: string[];
  };
}
```

**To Layer 3 (Rewriting):**
```typescript
// Layer 3 receives:
- weak_bullets[] for targeted improvement
- identified_gaps for context
- extracted.skills/tools for evidence validation
```

### 4.4 Integration with evaluate_fit() (NEW!)

**Layer 2 (Strategy) with Job Context:**
```typescript
// When user has job(s)
const fitScores = await Promise.all(
  jobs.map(job => Layer1.evaluate_fit(resume, job))
);

// Layer 2 uses fit data for strategy
const strategy = await Layer2.analyze({
  generic_evaluation: genericScore,
  fit_evaluations: fitScores,  // NEW: Array of FitScore
  state: layer4State
});
```

**Layer 5 (Orchestrator) Job Application Decision:**
```typescript
// Check fit before applying
const fitScore = await Layer1.evaluate_fit(resume, job);

if (fitScore.recommendation === 'APPLY') {
  // Proceed with application
  await Layer5.executeAction({
    type: 'apply_to_job',
    job_id: job.id
  });
} else if (fitScore.recommendation === 'OPTIMIZE_FIRST') {
  // Tailor resume first
  const tailoringPlan = fitScore.tailoring_hints;
  await Layer3.rewrite(tailoringPlan);
}
```

**Layer 3 (Execution) Job-Specific Tailoring:**
```typescript
// Use tailoring hints and gap analysis for rewrite
const fitScore = await Layer1.evaluate_fit(resume, job);

const rewriteRequest = {
  type: 'bullet',
  improvements: fitScore.tailoring_hints,
  target_gaps: fitScore.gaps.skills.critical_missing,
  context: {
    job_title: job.title,
    required_skills: fitScore.gaps.skills.critical_missing
  }
};

await Layer3.rewrite(rewriteRequest);
```

**Layer 4 (Storage) Fit Score Persistence:**
```typescript
// Store fit scores alongside resumes
JobApplication.fitScore = fitScore.fit_score;
JobApplication.recommendation = fitScore.recommendation;
JobApplication.gaps = fitScore.gaps;
JobApplication.tailoringHints = fitScore.tailoring_hints;
```

---

## 5. Public API

### 5.1 evaluate() - Generic Evaluation

```typescript
/**
 * Generic resume evaluation (no job context)
 *
 * Use when:
 * - User uploads resume
 * - Periodic re-scoring
 * - Dashboard overview
 *
 * Returns:
 * - GenericScore (EvaluationResult) with quality assessment
 * - Cached for 5 minutes for performance
 */
async evaluate(request: EvaluationRequest): Promise<EvaluationResult>;
```

**Example:**
```typescript
const score = await Layer1.evaluate({
  resume: {
    content: resumeBuffer,
    filename: 'resume.pdf',
    mimeType: 'application/pdf'
  },
  metadata: {
    user_id: 'user_123',
    years_experience: 5
  }
});

// Use score
console.log(`Resume score: ${score.resume_score}/100`);
console.log(`Level: ${score.level}`);
console.log(`Skills found: ${score.extracted.skills.length}`);
```

### 5.2 evaluate_fit() - Job-Specific Fit Evaluation

```typescript
/**
 * Job-specific fit evaluation
 *
 * Use when:
 * - User pastes JD
 * - Comparing multiple jobs
 * - Deciding whether to apply
 *
 * Returns:
 * - FitScore (extends EvaluationResult)
 * - Includes fit_score, gaps, recommendation
 *
 * Performance:
 * - Internally calls evaluate() (may hit cache)
 * - Only computes incremental fit analysis
 */
async evaluate_fit(request: FitEvaluationRequest): Promise<FitScore>;
```

**Example:**
```typescript
const fitScore = await Layer1.evaluate_fit({
  resume: {
    content: resumeBuffer,
    filename: 'resume.pdf',
    mimeType: 'application/pdf'
  },
  job_description: {
    raw_text: jdText,
    parsed_requirements: {
      required_skills: ['Python', 'SQL', 'Machine Learning'],
      required_tools: ['AWS', 'Docker'],
      seniority_expected: 'mid'
    }
  }
});

// Use fit score
console.log(`Fit score: ${fitScore.fit_score}/100`);
console.log(`Recommendation: ${fitScore.recommendation}`);
console.log(`Missing skills: ${fitScore.gaps.skills.critical_missing}`);
console.log(`Tailoring hints: ${fitScore.tailoring_hints}`);
```

### 5.3 Method Comparison

| Aspect | evaluate() | evaluate_fit() |
|--------|------------|----------------|
| **Input** | Resume only | Resume + Job |
| **Output** | EvaluationResult | FitScore (extends EvaluationResult) |
| **Use Case** | General quality | Job-specific fit |
| **Performance** | ~2s | ~2.5s (reuses generic) |
| **Cached** | Yes (5 min) | Generic part cached |
| **Layer 2 Usage** | Strategy without job | Gap analysis with job |
| **Layer 5 Usage** | Planning | Application decisions |

---

## 6. Core Scoring Algorithm

### 6.1 Dimension Weights

```python
# MVP weights (simple distribution)
WEIGHTS = {
    'skill_capital': 0.30,
    'execution_impact': 0.30,
    'learning_adaptivity': 0.20,
    'signal_quality': 0.20
}
```

### 6.2 Global Score Calculation

```python
def calculate_global_score(dimensions: Dict[str, float], flags: Dict) -> Dict:
    """
    Calculate final resume score from dimension scores
    
    Returns:
        {
            'resume_score': 0-100,
            'overall_score': 0-100 (alias),
            'level': str,
            'component_scores': {...}
        }
    """
    
    # Step 1: Weighted sum of dimensions
    base_score = (
        dimensions['skill_capital'] * 0.30 +
        dimensions['execution_impact'] * 0.30 +
        dimensions['learning_adaptivity'] * 0.20 +
        dimensions['signal_quality'] * 0.20
    )
    
    # Step 2: Apply signal quality modifier
    signal_factor = calculate_signal_factor(dimensions['signal_quality'])
    adjusted_score = base_score * signal_factor
    
    # Step 3: Apply constraints based on flags
    final_score = apply_constraints(adjusted_score, dimensions, flags)
    
    # Step 4: Calculate component scores for Layer 2
    component_scores = {
        'content_quality_score': (dimensions['skill_capital'] + dimensions['execution_impact']) / 2,
        'ats_compatibility_score': dimensions['signal_quality'],
        'format_quality_score': dimensions['signal_quality'],
        'impact_score': dimensions['execution_impact']
    }
    
    # Step 5: Determine level
    level = determine_level(final_score)
    
    return {
        'resume_score': round(final_score, 1),
        'overall_score': round(final_score, 1),  # Alias
        'level': level,
        **component_scores
    }


def calculate_signal_factor(signal_quality: float) -> float:
    """Signal quality modifier"""
    if signal_quality < 40:
        return 0.90  # 10% penalty for poor presentation
    elif signal_quality > 80:
        return 1.05  # 5% bonus for excellent presentation
    else:
        return 1.00  # Neutral


def apply_constraints(score: float, dimensions: Dict, flags: Dict) -> float:
    """Apply hard caps based on critical gaps"""
    
    # If skill capital very low, cap score
    if dimensions['skill_capital'] < 25:
        score = min(score, 50)
    
    # If execution impact very low, cap score
    if dimensions['execution_impact'] < 20:
        score = min(score, 55)
    
    # If learning stagnant, cap score
    if dimensions['learning_adaptivity'] < 15 and score > 70:
        score = min(score, 70)
    
    # If parsing failed, cap score
    if flags.get('parsing_failed'):
        score = min(score, 40)
    
    # If possible spam, cap score
    if flags.get('possible_spam'):
        score = min(score, 30)
    
    return max(0, min(100, score))


def determine_level(score: float) -> str:
    """Map score to level"""
    if score < 35:
        return 'Early'
    elif score < 55:
        return 'Growing'
    elif score < 75:
        return 'Solid'
    elif score < 90:
        return 'Strong'
    else:
        return 'Exceptional'
```

---

## 7. Entity Extraction (CRITICAL for Layer 2)

### 7.1 Skill Extraction

```python
def extract_skills(parsed_resume: ParsedResume) -> List[str]:
    """
    Extract and normalize skills from resume
    
    Sources:
    1. Explicit skills section
    2. Technologies mentioned in bullets
    3. Tools mentioned in projects
    4. Inferred from job titles/descriptions
    """
    skills = set()
    
    # 1. From skills section (if present)
    if parsed_resume.skills:
        skills.update(normalize_skills(parsed_resume.skills))
    
    # 2. From experience bullets
    for exp in parsed_resume.experiences:
        for bullet in exp.bullets:
            detected = detect_skills_in_text(bullet)
            skills.update(detected)
    
    # 3. From projects
    if parsed_resume.projects:
        for project in parsed_resume.projects:
            if project.technologies:
                skills.update(normalize_skills(project.technologies))
            detected = detect_skills_in_text(project.description)
            skills.update(detected)
    
    return sorted(list(skills))


def normalize_skills(raw_skills: List[str]) -> Set[str]:
    """
    Normalize skill names to canonical form
    
    Examples:
    - "javascript", "JS", "JavaScript" → "JavaScript"
    - "react.js", "ReactJS" → "React"
    - "python 3", "Python3" → "Python"
    """
    # Use skill normalization dictionary
    normalized = set()
    
    for skill in raw_skills:
        canonical = SKILL_NORMALIZATION.get(skill.lower(), skill)
        normalized.add(canonical)
    
    return normalized


# Skill normalization dictionary (sample)
SKILL_NORMALIZATION = {
    'js': 'JavaScript',
    'javascript': 'JavaScript',
    'react.js': 'React',
    'reactjs': 'React',
    'python3': 'Python',
    'python 3': 'Python',
    'c++': 'C++',
    'cpp': 'C++',
    'aws': 'AWS',
    'amazon web services': 'AWS',
    # ... extensive dictionary
}
```

### 5.2 Tool Extraction

```python
def extract_tools(parsed_resume: ParsedResume) -> List[str]:
    """
    Extract technology tools and platforms
    
    Categories:
    - Cloud: AWS, GCP, Azure
    - Databases: PostgreSQL, MongoDB, Redis
    - Frameworks: React, Django, Express
    - DevOps: Docker, Kubernetes, Jenkins
    - Design: Figma, Sketch, Adobe XD
    """
    tools = set()
    
    # Scan all text for tool mentions
    text_sources = [
        *[bullet for exp in parsed_resume.experiences for bullet in exp.bullets],
        *[proj.description for proj in (parsed_resume.projects or [])],
        *parsed_resume.skills
    ]
    
    for text in text_sources:
        detected = detect_tools_in_text(text)
        tools.update(detected)
    
    return sorted(list(tools))


def detect_tools_in_text(text: str) -> Set[str]:
    """Pattern matching for common tools"""
    text_lower = text.lower()
    detected = set()
    
    # Check against tool database
    for tool_name, patterns in TOOL_PATTERNS.items():
        for pattern in patterns:
            if pattern in text_lower:
                detected.add(tool_name)
                break
    
    return detected


# Tool patterns (sample)
TOOL_PATTERNS = {
    'Docker': ['docker', 'containerization', 'containers'],
    'Kubernetes': ['kubernetes', 'k8s'],
    'PostgreSQL': ['postgresql', 'postgres', 'psql'],
    'MongoDB': ['mongodb', 'mongo'],
    'React': ['react', 'react.js', 'reactjs'],
    'AWS': ['aws', 'amazon web services'],
    'Figma': ['figma'],
    # ... extensive database
}
```

### 5.3 Title Extraction

```python
def extract_titles(parsed_resume: ParsedResume) -> List[str]:
    """Extract job titles from experience section"""
    titles = []
    
    for exp in parsed_resume.experiences:
        # Normalize title
        title = normalize_title(exp.title)
        titles.append(title)
    
    return titles


def normalize_title(raw_title: str) -> str:
    """
    Normalize job titles to canonical form
    
    Examples:
    - "Sr. Software Engineer" → "Senior Software Engineer"
    - "PM" → "Product Manager"
    - "Full-stack Developer" → "Full Stack Developer"
    """
    # Remove common prefixes/suffixes
    title = raw_title.strip()
    
    # Expand abbreviations
    abbreviations = {
        'Sr.': 'Senior',
        'Jr.': 'Junior',
        'PM': 'Product Manager',
        'SWE': 'Software Engineer',
        'SDE': 'Software Development Engineer',
    }
    
    for abbr, full in abbreviations.items():
        if abbr in title:
            title = title.replace(abbr, full)
    
    return title
```

### 5.4 Company & Industry Extraction

```python
def extract_companies(parsed_resume: ParsedResume) -> List[str]:
    """Extract company names"""
    return [exp.company for exp in parsed_resume.experiences]


def extract_industries(parsed_resume: ParsedResume) -> List[str]:
    """
    Infer industries from companies and job descriptions
    
    Uses company database + keyword analysis
    """
    industries = set()
    
    # Check company database
    for company in extract_companies(parsed_resume):
        industry = COMPANY_INDUSTRY_MAP.get(company)
        if industry:
            industries.add(industry)
    
    # Keyword-based inference
    all_text = " ".join([
        bullet 
        for exp in parsed_resume.experiences 
        for bullet in exp.bullets
    ]).lower()
    
    for industry, keywords in INDUSTRY_KEYWORDS.items():
        if any(kw in all_text for kw in keywords):
            industries.add(industry)
    
    return sorted(list(industries))


# Industry keywords (sample)
INDUSTRY_KEYWORDS = {
    'fintech': ['payment', 'banking', 'financial', 'trading'],
    'healthcare': ['patient', 'clinical', 'medical', 'health'],
    'ecommerce': ['marketplace', 'retail', 'shopping', 'commerce'],
    'saas': ['subscription', 'b2b', 'enterprise software'],
    # ...
}
```

---

## 8. Gap Detection (Shared Module)

### 8.1 Purpose

The GapDetectionModule is **shared** between generic evaluation and fit analysis. It detects missing or weak elements in a resume.

**Used by:**
- Generic evaluation: Identifies generic gaps (no job context)
- Fit evaluation: Identifies job-specific gaps (with job requirements)

### 8.2 Skills Gap Detection

```python
def detect_skills_gap(
    extracted_skills: List[str],
    required_skills: List[str],
    preferred_skills: List[str] = []
) -> SkillsGap:
    """
    Detect gap between resume skills and job requirements

    Returns:
        SkillsGap with matched, missing, transferable skills
    """

    # Normalize all skills
    resume_skills = set(normalize_skills(extracted_skills))
    required = set(normalize_skills(required_skills))
    preferred = set(normalize_skills(preferred_skills))

    # Find matches
    matched = resume_skills & required

    # Find missing (critical)
    critical_missing = required - resume_skills

    # Find missing (nice-to-have)
    nice_to_have_missing = preferred - resume_skills

    # Find transferable (similar skills)
    transferable = find_transferable_skills(
        resume_skills,
        critical_missing
    )

    # Calculate match percentage
    match_percentage = (len(matched) / len(required)) * 100 if required else 100

    return SkillsGap(
        matched=list(matched),
        critical_missing=list(critical_missing),
        nice_to_have_missing=list(nice_to_have_missing),
        transferable=list(transferable),
        match_percentage=round(match_percentage, 1)
    )


def find_transferable_skills(
    resume_skills: Set[str],
    missing_skills: Set[str]
) -> Set[str]:
    """
    Find skills in resume that could transfer to missing skills

    Examples:
    - "Python" can transfer to "scripting"
    - "Team leadership" can transfer to "people management"
    """
    transferable = set()

    # Use skill taxonomy for transfers
    for resume_skill in resume_skills:
        for missing_skill in missing_skills:
            if are_skills_transferable(resume_skill, missing_skill):
                transferable.add(resume_skill)

    return transferable


# Skill taxonomy (sample)
SKILL_TRANSFERS = {
    'python': ['scripting', 'programming', 'coding'],
    'javascript': ['frontend', 'web development', 'scripting'],
    'leadership': ['people management', 'team lead', 'mentoring'],
    # ... extensive mapping
}
```

### 8.3 Tools Gap Detection

```python
def detect_tools_gap(
    extracted_tools: List[str],
    required_tools: List[str],
    preferred_tools: List[str] = []
) -> ToolsGap:
    """Similar logic to skills gap"""

    # Normalize
    resume_tools = set(normalize_tools(extracted_tools))
    required = set(normalize_tools(required_tools))
    preferred = set(normalize_tools(preferred_tools))

    # Match
    matched = resume_tools & required
    critical_missing = required - resume_tools
    nice_to_have_missing = preferred - resume_tools

    # Calculate
    match_percentage = (len(matched) / len(required)) * 100 if required else 100

    return ToolsGap(
        matched=list(matched),
        critical_missing=list(critical_missing),
        nice_to_have_missing=list(nice_to_have_missing),
        match_percentage=round(match_percentage, 1)
    )
```

### 8.4 Experience Gap Detection

```python
def detect_experience_gap(
    resume_bullets: List[str],
    required_experience_types: List[str]
) -> ExperienceGap:
    """
    Detect missing experience types

    Experience types:
    - leadership, cross-functional, customer-facing,
    - technical architecture, project management,
    - data analysis, etc.
    """

    # Extract experience types from bullets
    detected_types = set()

    for bullet in resume_bullets:
        types = extract_experience_types(bullet)
        detected_types.update(types)

    # Find gaps
    required = set(required_experience_types)
    matched = detected_types & required
    missing = required - detected_types

    # Calculate coverage
    coverage = (len(matched) / len(required)) * 100 if required else 100

    return ExperienceGap(
        matched_types=list(matched),
        missing_types=list(missing),
        coverage_score=round(coverage, 1)
    )


def extract_experience_types(bullet: str) -> Set[str]:
    """Extract experience types from bullet using keywords"""

    types = set()
    bullet_lower = bullet.lower()

    # Leadership signals
    if any(kw in bullet_lower for kw in ['led', 'managed', 'directed', 'mentored']):
        types.add('leadership')

    # Cross-functional signals
    if any(kw in bullet_lower for kw in ['cross-functional', 'collaborated', 'stakeholders']):
        types.add('cross-functional')

    # Customer-facing signals
    if any(kw in bullet_lower for kw in ['customer', 'client', 'user']):
        types.add('customer-facing')

    # Technical signals
    if any(kw in bullet_lower for kw in ['architected', 'designed system', 'scalable']):
        types.add('technical_architecture')

    # Add more patterns...

    return types
```

### 8.5 Seniority Gap Detection

```python
def detect_seniority_gap(
    user_level: SeniorityLevel,
    role_expected: SeniorityLevel,
    years_experience: Optional[int]
) -> SeniorityGap:
    """
    Determine seniority alignment

    Returns:
        SeniorityGap with alignment and gap details
    """

    # Seniority hierarchy
    HIERARCHY = {'entry': 1, 'mid': 2, 'senior': 3, 'lead': 4}

    user_rank = HIERARCHY[user_level]
    role_rank = HIERARCHY[role_expected]

    # Determine alignment
    if user_rank < role_rank:
        alignment = 'underqualified'
        gap_years = estimate_years_gap(user_level, role_expected)
    elif user_rank > role_rank:
        alignment = 'overqualified'
        gap_years = None
    else:
        alignment = 'aligned'
        gap_years = None

    return SeniorityGap(
        user_level=user_level,
        role_expected=role_expected,
        alignment=alignment,
        gap_years=gap_years
    )
```

---

## 9. Weakness Detection

```python
def identify_weaknesses(parsed_resume: ParsedResume, dimensions: Dict) -> List[str]:
    """
    Generate list of weakness identifiers for Layer 2
    
    Returns codes, not messages:
    ["weak_verbs", "no_metrics", "poor_formatting"]
    """
    weaknesses = []
    
    # Check execution impact
    if dimensions['execution_impact']['metrics_ratio'] < 0.3:
        weaknesses.append('no_metrics')
    
    if dimensions['execution_impact']['action_ratio'] < 0.5:
        weaknesses.append('weak_verbs')
    
    if dimensions['execution_impact']['generic_ratio'] > 0.4:
        weaknesses.append('generic_descriptions')
    
    # Check signal quality
    if dimensions['signal_quality']['formatting'] < 50:
        weaknesses.append('poor_formatting')
    
    if dimensions['signal_quality']['writing'] < 50:
        weaknesses.append('spelling_errors')
    
    # Check skill capital
    if len(parsed_resume.skills) < 5:
        weaknesses.append('few_skills_listed')
    
    # Check learning
    if not parsed_resume.certifications and not parsed_resume.courses:
        weaknesses.append('no_learning_signals')
    
    return weaknesses


def identify_weak_bullets(parsed_resume: ParsedResume) -> List[Dict]:
    """
    Identify specific bullets that need improvement
    
    For Layer 3 rewriting
    """
    weak_bullets = []
    
    for exp in parsed_resume.experiences:
        for i, bullet in enumerate(exp.bullets):
            issues = analyze_bullet_quality(bullet)
            
            if issues:  # Has issues
                weak_bullets.append({
                    'bullet': bullet,
                    'issues': issues,
                    'location': {
                        'company': exp.company,
                        'title': exp.title,
                        'index': i
                    }
                })
    
    return weak_bullets


def analyze_bullet_quality(bullet: str) -> List[str]:
    """Check single bullet for issues"""
    issues = []
    
    # Weak verb check
    if starts_with_weak_verb(bullet):
        issues.append('weak_verb')
    
    # No metric check
    if not contains_metric(bullet):
        issues.append('no_metric')
    
    # Vagueness check
    if is_vague(bullet):
        issues.append('vague')
    
    # Length check
    if len(bullet.split()) < 8:
        issues.append('too_short')
    
    return issues
```

---

## 10. Fit Analysis Module

### 10.1 Purpose

FitAnalysisModule calculates job-specific fit score using:
1. Generic score (from GenericScoringModule)
2. Gap analysis (from GapDetectionModule)
3. Job requirements

### 10.2 Fit Score Calculation

```python
def calculate_fit_score(
    generic_score: GenericScore,
    gaps: GapAnalysis,
    job_requirements: JobRequirements
) -> float:
    """
    Calculate overall fit score (0-100)

    Uses weighted combination of:
    - Technical match (skills + tools): 40%
    - Seniority match: 20%
    - Experience match: 20%
    - Signal quality (resume quality): 20%
    """

    # Component scores
    technical = calculate_technical_match(gaps.skills, gaps.tools)
    seniority = calculate_seniority_match(gaps.seniority)
    experience = gaps.experience.coverage_score
    signal = generic_score.resume_score

    # Weights
    WEIGHTS = {
        'technical': 0.40,
        'seniority': 0.20,
        'experience': 0.20,
        'signal': 0.20
    }

    # Weighted sum
    fit_score = (
        technical * WEIGHTS['technical'] +
        seniority * WEIGHTS['seniority'] +
        experience * WEIGHTS['experience'] +
        signal * WEIGHTS['signal']
    )

    # Apply penalties
    fit_score = apply_fit_penalties(fit_score, gaps, generic_score)

    return clamp(0, 100, fit_score)


def calculate_technical_match(
    skills_gap: SkillsGap,
    tools_gap: ToolsGap
) -> float:
    """
    Technical match = 60% skills + 40% tools
    """
    skills_score = skills_gap.match_percentage
    tools_score = tools_gap.match_percentage

    return (skills_score * 0.6) + (tools_score * 0.4)


def calculate_seniority_match(seniority_gap: SeniorityGap) -> float:
    """
    Seniority match based on alignment
    """
    if seniority_gap.alignment == 'aligned':
        return 100
    elif seniority_gap.alignment == 'underqualified':
        # Penalty based on gap
        if seniority_gap.gap_years <= 1:
            return 75  # Stretch but possible
        elif seniority_gap.gap_years <= 2:
            return 50  # Significant gap
        else:
            return 25  # Too large gap
    else:  # overqualified
        return 80  # Slight penalty for overqualified
```

### 10.3 Recommendation Logic

```python
def determine_recommendation(
    fit_score: float,
    generic_score: GenericScore,
    gaps: GapAnalysis
) -> Tuple[str, str]:
    """
    Determine APPLY/OPTIMIZE_FIRST/NOT_READY

    Returns:
        (recommendation, reasoning)
    """

    # Rule 1: Resume quality too low
    if generic_score.resume_score < 60:
        return (
            'OPTIMIZE_FIRST',
            f'Resume quality ({generic_score.resume_score}/100) needs improvement before applying'
        )

    # Rule 2: Fit score excellent
    if fit_score >= 75:
        return (
            'APPLY',
            f'Strong fit ({fit_score}/100) - apply with confidence'
        )

    # Rule 3: Fit score good with minor gaps
    if fit_score >= 60:
        critical_gaps_count = len(gaps.skills.critical_missing) + len(gaps.tools.critical_missing)

        if critical_gaps_count <= 2:
            return (
                'APPLY',
                f'Good fit ({fit_score}/100) with {critical_gaps_count} minor gaps - apply and tailor resume'
            )
        else:
            return (
                'OPTIMIZE_FIRST',
                f'Good potential ({fit_score}/100) but {critical_gaps_count} critical gaps - optimize first'
            )

    # Rule 4: Fit score below threshold
    if fit_score < 60:
        if gaps.seniority.alignment == 'underqualified' and gaps.seniority.gap_years > 2:
            return (
                'NOT_READY',
                f'Role requires {gaps.seniority.gap_years} more years of experience'
            )

        if len(gaps.skills.critical_missing) > 5:
            return (
                'NOT_READY',
                f'Missing too many critical skills ({len(gaps.skills.critical_missing)})'
            )

        return (
            'OPTIMIZE_FIRST',
            f'Moderate fit ({fit_score}/100) - significant optimization needed'
        )

    # Default
    return (
        'OPTIMIZE_FIRST',
        f'Fit score {fit_score}/100 - optimization recommended'
    )
```

### 10.4 Tailoring Hints Generation

```python
def generate_tailoring_hints(
    gaps: GapAnalysis,
    generic_score: GenericScore
) -> List[str]:
    """
    Generate specific tailoring suggestions
    """
    hints = []

    # Skills gaps
    if gaps.skills.critical_missing:
        top_missing = gaps.skills.critical_missing[:3]
        hints.append(
            f"Add these critical skills to your resume: {', '.join(top_missing)}"
        )

    # Tools gaps
    if gaps.tools.critical_missing:
        top_tools = gaps.tools.critical_missing[:3]
        hints.append(
            f"Highlight experience with: {', '.join(top_tools)}"
        )

    # Experience gaps
    if gaps.experience.missing_types:
        for exp_type in gaps.experience.missing_types[:2]:
            hints.append(
                f"Emphasize any {exp_type} experience in your bullets"
            )

    # Generic quality issues
    if 'no_metrics' in generic_score.weaknesses:
        hints.append(
            "Add quantified metrics to your achievements"
        )

    if 'weak_verbs' in generic_score.weaknesses:
        hints.append(
            "Use stronger action verbs (led, architected, optimized)"
        )

    # Transferable skills
    if gaps.skills.transferable:
        hints.append(
            f"Highlight how your {gaps.skills.transferable[0]} experience applies to this role"
        )

    return hints[:8]  # Max 8 hints
```

---

## 11. Caching Strategy

### 11.1 Purpose

Cache generic scores to optimize fit evaluation performance.

**Problem:** Evaluating 10 jobs against same resume should NOT compute generic score 10 times.

**Solution:** Cache generic score, reuse for all fit evaluations.

### 11.2 Implementation

```typescript
class EvaluationEngine {
  private cache: Map<string, CachedResult>;
  private readonly CACHE_TTL = 300000;  // 5 minutes

  async evaluate(resume: Resume): Promise<GenericScore> {
    // Generate cache key
    const cacheKey = this.generateCacheKey(resume);

    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && !this.isExpired(cached)) {
      return cached.score;
    }

    // Compute
    const score = await this.computeGenericScore(resume);

    // Cache
    this.cache.set(cacheKey, {
      score,
      timestamp: Date.now()
    });

    return score;
  }

  async evaluate_fit(resume: Resume, job: Job): Promise<FitScore> {
    // REUSE cached generic score
    const generic = await this.evaluate(resume);  // May hit cache!

    // Compute incremental fit
    const fit = await this.computeFitScore(generic, job);

    return fit;
  }

  private generateCacheKey(resume: Resume): string {
    // Hash resume content
    return crypto
      .createHash('sha256')
      .update(resume.content)
      .digest('hex');
  }

  private isExpired(cached: CachedResult): boolean {
    return (Date.now() - cached.timestamp) > this.CACHE_TTL;
  }
}
```

### 11.3 Cache Invalidation

**Automatic invalidation:**
- TTL expires (5 minutes)
- Resume content changes (different hash)

**Manual invalidation:**
- User explicitly updates resume → Clear cache for that user
- System restart → Clear all cache

### 11.4 Performance Impact

**Without cache:**
```
10 jobs evaluated:
- 10 generic evaluations (2s each) = 20s
- 10 fit analyses (0.5s each) = 5s
Total: 25s
```

**With cache:**
```
10 jobs evaluated:
- 1 generic evaluation (2s) = 2s
- 10 fit analyses (0.5s each) = 5s
Total: 7s (3.5x faster!)
```

---

## 12. Validation Rules

### 12.1 Input Validation

```python
def validate_input(request: EvaluationRequest) -> ValidationResult:
    """Validate evaluation request"""
    
    issues = []
    
    # File size check (max 5MB)
    if len(request.resume.content) > 5 * 1024 * 1024:
        issues.append(ValidationIssue(
            code='FILE_TOO_LARGE',
            severity='error',
            message='Resume file exceeds 5MB limit'
        ))
    
    # Format check
    if request.resume.mimeType not in SUPPORTED_MIME_TYPES:
        issues.append(ValidationIssue(
            code='UNSUPPORTED_FORMAT',
            severity='error',
            message=f'Format {request.resume.mimeType} not supported'
        ))
    
    # Content check (not empty)
    if not request.resume.content:
        issues.append(ValidationIssue(
            code='EMPTY_FILE',
            severity='error',
            message='Resume file is empty'
        ))
    
    return ValidationResult(
        passed=not any(i.severity == 'error' for i in issues),
        issues=issues
    )
```

### 12.2 Output Validation

```python
def validate_output(result: EvaluationResult) -> ValidationResult:
    """Ensure output meets contract requirements"""
    
    issues = []
    
    # Score ranges
    if not (0 <= result.resume_score <= 100):
        issues.append('resume_score out of range')
    
    if not (0 <= result.content_quality_score <= 100):
        issues.append('content_quality_score out of range')
    
    # Required fields for Layer 2
    if not result.extracted.skills:
        issues.append('WARNING: No skills extracted')
    
    if not result.extracted.tools:
        issues.append('WARNING: No tools extracted')
    
    if not result.extracted.titles:
        issues.append('WARNING: No titles extracted')
    
    return ValidationResult(
        passed=len(issues) == 0,
        issues=issues
    )
```

---

## 13. Performance Requirements

### 13.1 Latency Targets

```
- Parsing: <500ms (p95)
- Scoring: <1s (p95)
- Entity Extraction: <500ms (p95)
- Total: <2s (p95)
```

### 13.2 Throughput

```
- Support 100 evaluations/second
- Handle 10,000 concurrent users
```

### 13.3 Legacy Caching Notes

```python
# Cache evaluation results by content hash
cache_key = f"eval:{hash(resume_content)}:{version}"
ttl = 24 * 3600  # 24 hours

# Invalidation: Manual only (content changes)
```

---

## 14. Error Handling

### 14.1 Parsing Failures

```python
async def evaluate_with_fallback(request: EvaluationRequest) -> EvaluationResult:
    """Graceful degradation on parsing failure"""
    
    try:
        parsed = await parse_resume(request.resume)
    except ParsingError as e:
        # Return low-confidence result
        return EvaluationResult(
            resume_score=40,
            overall_score=40,
            level='Growing',
            weaknesses=['parsing_failed'],
            extracted={'skills': [], 'tools': [], 'titles': [], 'companies': []},
            identified_gaps={'missing_skills': True},
            flags={'parsing_failed': True},
            summary='Unable to parse resume completely. Please ensure file is readable.',
            meta={'parse_quality': 'low'}
        )
    
    # Normal evaluation
    return evaluate(parsed)
```

---

## 15. Testing Requirements

### 15.1 Unit Tests

```python
test('calculate_global_score: correct weighting')
test('extract_skills: normalizes variants')
test('extract_tools: detects patterns')
test('identify_weaknesses: correct codes')
test('validate_output: catches range violations')
```

### 15.2 Integration Tests

```python
test('evaluate: returns complete contract')
test('evaluate: extracted fields match Layer 2 needs')
test('evaluate: scores stored correctly in Layer 4')
```

### 15.3 Golden Tests

```python
GOLDEN_RESUMES = [
    {
        'name': 'senior_swe_strong',
        'expected_score': 82,
        'expected_level': 'Strong',
        'expected_weaknesses': []
    },
    {
        'name': 'junior_pm_growing',
        'expected_score': 58,
        'expected_level': 'Solid',
        'expected_weaknesses': ['few_skills_listed', 'no_metrics']
    },
    # 20+ golden resumes
]
```

### 15.4 Fit Evaluation Tests (NEW!)

```python
# Unit tests for fit evaluation
test('calculate_fit_score: correct weighted combination')
test('determine_recommendation: APPLY for high fit')
test('determine_recommendation: OPTIMIZE_FIRST for medium fit')
test('determine_recommendation: NOT_READY for low fit with large gaps')
test('detect_skills_gap: identifies missing skills')
test('detect_skills_gap: finds transferable skills')
test('detect_seniority_gap: correct alignment')
test('generate_tailoring_hints: provides actionable suggestions')

# Integration tests
test('evaluate_fit: extends GenericScore correctly')
test('evaluate_fit: reuses cached generic score')
test('evaluate + evaluate_fit: same generic score')
test('evaluate_fit: gaps analysis complete')

# Golden tests for fit evaluation
GOLDEN_FIT_TESTS = [
    {
        'name': 'senior_swe_strong_fit',
        'resume': {...},
        'job': {...},
        'expected_generic': 82,
        'expected_fit': 88,
        'expected_recommendation': 'APPLY',
        'expected_critical_gaps': 0
    },
    {
        'name': 'junior_pm_underqualified',
        'resume': {...},
        'job': {...},
        'expected_generic': 65,
        'expected_fit': 52,
        'expected_recommendation': 'OPTIMIZE_FIRST',
        'expected_critical_gaps': 3
    },
    {
        'name': 'career_switcher_low_fit',
        'resume': {...},
        'job': {...},
        'expected_generic': 70,
        'expected_fit': 35,
        'expected_recommendation': 'NOT_READY',
        'expected_critical_gaps': 8
    },
    # 20+ golden fit test cases
]
```

---

## 16. Edge Cases

### Case 1: No experience section
```python
if not parsed_resume.experiences:
    return EvaluationResult(
        resume_score=25,
        level='Early',
        weaknesses=['no_experience'],
        flags={'no_experience': True}
    )
```

### Case 2: PDF with only images (no text)
```python
if word_count < 50:
    return EvaluationResult(
        resume_score=35,
        weaknesses=['parsing_failed'],
        flags={'too_short': True}
    )
```

### Case 3: Spam detection
```python
# Detect repeated text, random characters, etc.
if is_spam(parsed_resume):
    return EvaluationResult(
        resume_score=15,
        flags={'possible_spam': True}
    )
```

---

# PART II: FUTURE ROADMAP

## Phase 2: Enhanced Scoring (Months 4-6)

### 2.1 Trajectory Momentum

Analyze career progression over time using linear regression.

### 2.2 Coherence & Focus

Entropy-based analysis of career narrative consistency.

### 2.3 External Validation

Score based on company prestige, education pedigree, certifications.

---

## Phase 3: ML Integration (Months 6-9)

### 3.1 Interview Prediction

Train model to predict interview likelihood based on resume features.

### 3.2 Skill Matching

Semantic similarity for skill matching (not just keyword).

---

**END OF SPECIFICATION**

**Version:** 2.1
**Status:** Ready for Implementation
**Next:** Implement generic + fit evaluation; integrate with all layers
