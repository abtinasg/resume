# Layer 6 – Job Discovery & Matching Module
## Complete Specification v1.1

**Version:** 1.1 (MVP + P0 Fixes + Competitive Moats)
**Status:** Implementation Ready
**Last Updated:** December 16, 2025
**Scope:** Job search, discovery, and ranking (MVP focuses on manual paste + ranking)

**Changelog v1.0 → v1.1:**
- [P0-1] Added complete implementations for missing functions (should_user_apply, determine_priority, determine_job_flags, generate_job_insights)
- [P0-2] Added "avoid" category for low-fit jobs (fit < 50)
- [P0-3] Added urgency_score calculation based on deadline + posted_date
- [P0-4] Added evidence spans for all extracted requirements (proof-first)
- [P0-5] Added job deduplication with canonical_id
- [MOAT-1] Added score_breakdown for transparency and debugging
- [MOAT-2] Added career_capital analysis (brand, skill growth, network, comp)
- [MOAT-3] Enhanced scam_risk detection with multiple red flags
- Updated all interfaces with new fields
- Added comprehensive error handling

---

## Document Purpose

Single source of truth for Layer 6 Job Discovery & Matching Module development.

**Part I:** MVP Implementation (v1.0) - Manual job paste + ranking  
**Part II:** Future Roadmap - Automated discovery (v2.0+)

---

# PART I: MVP SPECIFICATION (v1.0)

## 0. Purpose & Role

Layer 6 is the **Job Discovery & Matching Module** that helps users find and evaluate job opportunities.

**MVP Scope (v1.0):**
- Parse job descriptions pasted by user
- Rank jobs by fit score (using Layer 1)
- Categorize jobs (reach, target, safety)
- Provide comparison view

**Future Scope (v2.0+):**
- Automated job search via APIs (LinkedIn, Indeed, etc.)
- Continuous monitoring for new postings
- Smart filtering and recommendations

**Key innovation:** Intelligent job ranking and categorization based on multi-dimensional fit analysis.

**Non-responsibilities:**
- Does NOT evaluate resumes (Layer 1 does)
- Does NOT analyze strategy (Layer 2 does)
- Does NOT apply to jobs (Layer 5 does)
- Does NOT store state (Layer 4 does)

**Positioning:** Layer 6 is the job intelligence layer that helps users discover, evaluate, and prioritize opportunities.

---

## 1. Design Principles

**User-Centric**
- Minimize manual effort
- Clear prioritization (what to apply to first)
- Actionable insights

**Data-Driven**
- Fit scores based on Layer 1 analysis
- Multi-dimensional evaluation
- Evidence-based categorization

**Scalable Architecture**
- v1: Manual paste
- v2: Automated discovery
- Same interfaces, different data sources

**Transparent**
- Clear reasoning for rankings
- Visible fit scores
- Honest assessment (reach vs safety)

---

## 2. Architecture Overview (v1.0 MVP)

### 2.1 Module Structure

```
Layer 6: Job Discovery Module
├── Job Parsing
│   ├── parseJobDescription() → ParsedJob
│   └── extractRequirements() → JobRequirements
│
├── Job Ranking
│   ├── rankJobs() → RankedJob[]
│   └── categorizeJob() → "reach" | "target" | "safety"
│
├── Job Comparison
│   ├── compareJobs() → ComparisonResult
│   └── generateInsights() → string[]
│
└── Storage Interface
    └── saveJob() → via Layer 4
```

### 2.2 Data Flow (v1.0)

```
User pastes JD text
    ↓
Layer 6: parseJobDescription()
    ↓
Layer 1: evaluate_fit(resume, job)
    ↓
Layer 6: rankJobs() + categorizeJob()
    ↓
Layer 4: saveJob()
    ↓
User sees: Ranked list with fit scores
```

---

## 3. Input Contracts

### 3.1 Job Paste Input (v1.0 MVP)

```typescript
interface JobPasteRequest {
  // Job description text
  job_description: string;       // Full JD text (copied from posting)
  
  // Optional metadata (user can provide)
  metadata?: {
    job_title?: string;          // If not in JD
    company?: string;            // If not in JD
    location?: string;           // "San Francisco, CA" or "Remote"
    salary_range?: {
      min?: number;
      max?: number;
      currency?: string;         // "USD"
    };
    job_url?: string;            // Link to original posting
    source?: string;             // "LinkedIn", "Company website", etc.
  };
  
  // User context
  user_id: string;
  resume_version_id: string;     // Which resume to evaluate against
}
```

**Usage:**
```typescript
const result = await Layer6.parseAndRankJob(request);
```

---

### 3.2 Parsed Job Structure (Internal)

After parsing, job is transformed to structured format:

```typescript
interface ParsedJob {
  // Basic info
  job_id: string;                // Generated UUID
  job_title: string;
  company: string;
  location: string;              // "San Francisco, CA" or "Remote"
  
  // Job description
  raw_text: string;              // Original JD text
  
  // Parsed requirements (extracted from JD)
  requirements: {
    required_skills: string[];
    preferred_skills: string[];
    required_tools: string[];
    preferred_tools: string[];
    seniority_expected: "entry" | "mid" | "senior" | "lead";
    years_experience_min?: number;
    years_experience_max?: number;
    education_requirements?: string[];
    certifications?: string[];
    domain_keywords: string[];   // Industry-specific terms
  };
  
  // Responsibilities (extracted)
  responsibilities: string[];    // Key bullet points
  
  // Benefits & perks (if mentioned)
  benefits?: string[];
  
  // Work arrangement
  work_arrangement?: "remote" | "hybrid" | "onsite";
  
  // Salary (if mentioned)
  salary_range?: {
    min?: number;
    max?: number;
    currency?: string;
  };
  
  // Metadata
  metadata: {
    job_url?: string;
    source?: string;
    posted_date?: string;        // If extractable
    application_deadline?: string;
    parse_quality: "high" | "medium" | "low";
    parse_confidence: number;    // 0-100
  };
  
  // Timestamps
  created_at: string;            // ISO 8601
  updated_at: string;
}
```

---

## 4. Output Contracts

### 4.1 Core Types (CRITICAL)

```typescript
// Job categories
type JobCategory = "reach" | "target" | "safety" | "avoid";
type JobPriority = "high" | "medium" | "low";

// User preferences
interface UserPreferences {
  work_arrangement?: string[];      // ["remote", "hybrid", "onsite"]
  locations?: string[];             // ["San Francisco", "New York"]
  salary_minimum?: number;          // Minimum acceptable salary
  excluded_industries?: string[];   // Industries to avoid
  strict_location?: boolean;        // Enforce location match
}

// Job paste request
interface JobPasteRequest {
  user_id: string;
  resume_version_id: string;
  job_description: string;
  metadata?: {
    job_title?: string;
    company?: string;
    job_url?: string;
    location?: string;
    posted_date?: string;           // ISO 8601
    application_deadline?: string;  // ISO 8601
    source?: "manual_paste" | "email_forward" | "api";
  };
  language?: string;                // Default: "en"
}

// Job filters (for list_jobs API)
interface JobFilters {
  category?: JobCategory;
  min_fit_score?: number;
  max_fit_score?: number;
  location?: string;
  only_should_apply?: boolean;
  status?: "discovered" | "saved" | "applied" | "archived";
  include_expired?: boolean;
  include_rejected?: boolean;
}
```

---

### 4.2 Score Breakdown Interface (MOAT #1)

```typescript
interface ScoreBreakdown {
  // Components (sum to 100)
  fit_component: number;           // From Layer 1 fit analysis
  preference_component: number;    // User preferences match
  freshness_component: number;     // Recently posted
  category_component: number;      // Reach/target/safety bonus
  urgency_component: number;       // Deadline + recency

  // Penalties (negative values)
  penalties: Array<{
    code: string;                  // "location_mismatch", "salary_low", etc.
    amount: number;                // Negative number
    reason: string;                // Human-readable
  }>;

  // Final
  raw_score: number;               // Before penalties
  final_score: number;             // After penalties
}
```

---

### 4.3 Job Ranking Output

```typescript
interface RankedJob {
  // Job info
  job: ParsedJob;

  // Fit analysis (from Layer 1)
  fit_score: number;             // 0-100 (from Layer 1.evaluate_fit)
  fit_analysis: FitScore;        // Complete fit analysis from Layer 1

  // Categorization
  category: "reach" | "target" | "safety" | "avoid";
  category_reasoning: string;

  // Ranking
  rank: number;                  // 1-based ranking
  priority_score: number;        // 0-100 (for sorting)

  // NEW: Detailed breakdown (MOAT #1)
  score_breakdown: ScoreBreakdown;

  // Flags
  flags: {
    dream_job: boolean;          // User marked as favorite
    applied: boolean;            // Already applied
    rejected: boolean;           // User rejected this job
    expired: boolean;            // Past deadline
    new: boolean;                // Added in last 7 days
    scam_risk: boolean;          // Suspicious patterns detected
  };

  // Recommendations
  should_apply: boolean;         // Based on fit_score + category
  application_priority: "high" | "medium" | "low";

  // Quick insights
  quick_insights: string[];      // 3-5 key points
  red_flags?: string[];          // Potential issues
  green_flags?: string[];        // Strong matches

  // NEW: Career capital analysis (MOAT #2)
  career_capital: {
    score: number;
    brand_score: number;
    skill_growth_score: number;
    network_score: number;
    comp_score: number;
    breakdown: {
      brand: string;
      skill_growth: string;
      network: string;
      comp: string;
    };
  };
}
```

---

### 4.4 Job List Output

```typescript
interface JobListResult {
  // Jobs grouped by category
  jobs: {
    reach: RankedJob[];          // Ambitious but possible
    target: RankedJob[];         // Good fit
    safety: RankedJob[];         // High probability
  };
  
  // Summary stats
  summary: {
    total_jobs: number;
    reach_count: number;
    target_count: number;
    safety_count: number;
    average_fit_score: number;
    applied_count: number;
    new_count: number;
  };
  
  // Recommendations
  top_recommendations: RankedJob[];  // Top 5 jobs to apply to
  
  // Insights
  insights: string[];            // Portfolio-level insights
}
```

---

### 4.5 Job Comparison Output

```typescript
interface JobComparisonResult {
  // Jobs being compared (2-5 jobs)
  jobs: RankedJob[];
  
  // Side-by-side comparison
  comparison: {
    fit_scores: number[];
    categories: string[];
    
    // Skills comparison
    skills_overlap: {
      common_requirements: string[];  // Skills all jobs need
      unique_per_job: Record<string, string[]>;
      your_coverage: number;     // 0-100
    };
    
    // Seniority comparison
    seniority_levels: string[];
    your_level: string;
    
    // Location comparison
    locations: string[];
    remote_friendly: boolean[];
    
    // Salary comparison (if available)
    salary_ranges?: Array<{min?: number, max?: number}>;
  };
  
  // Recommendations
  best_fit: string;              // job_id of best match
  easiest_to_get: string;        // job_id of safety option
  best_for_growth: string;       // job_id with best learning opportunity
  
  // Comparative insights
  insights: string[];            // "Job A requires Python, but B and C don't"
}
```

---

## 5. Core Algorithms

### 5.1 Job Description Parsing

```python
def parse_job_description(raw_text: str, metadata: dict) -> ParsedJob:
    """
    Parse job description into structured format
    
    Steps:
    1. Extract basic info (title, company, location)
    2. Extract requirements (skills, tools, seniority)
    3. Extract responsibilities
    4. Extract benefits and metadata
    5. Determine parse quality
    """
    
    # Step 1: Basic info extraction
    job_title = extract_job_title(raw_text, metadata)
    company = extract_company(raw_text, metadata)
    location = extract_location(raw_text, metadata)
    
    # Step 2: Requirements extraction
    requirements = extract_requirements(raw_text)
    
    # Step 3: Responsibilities
    responsibilities = extract_responsibilities(raw_text)
    
    # Step 4: Benefits & perks
    benefits = extract_benefits(raw_text)
    work_arrangement = detect_work_arrangement(raw_text)
    salary_range = extract_salary(raw_text)
    
    # Step 5: Parse quality
    parse_quality = assess_parse_quality(raw_text, requirements)
    
    return ParsedJob(
        job_id=generate_uuid(),
        job_title=job_title,
        company=company,
        location=location,
        raw_text=raw_text,
        requirements=requirements,
        responsibilities=responsibilities,
        benefits=benefits,
        work_arrangement=work_arrangement,
        salary_range=salary_range,
        metadata={
            'parse_quality': parse_quality,
            'parse_confidence': calculate_confidence(parse_quality),
            **metadata
        },
        created_at=datetime.now().isoformat()
    )
```

---

### 5.1.5 Job Deduplication (P0-5)

```python
def get_canonical_job_id(job: ParsedJob) -> str:
    """
    Generate deterministic ID for deduplication

    Uses: canonical_url OR hash(company + title + location + posted_date)
    """

    # Method 1: Use canonical URL if available
    job_url = job.metadata.get('job_url', '')
    if job_url:
        canonical = canonicalize_url(job_url)
        if canonical:
            return f"url:{hashlib.sha256(canonical.encode()).hexdigest()[:16]}"

    # Method 2: Hash key fields
    components = [
        normalize_company(job.metadata.get('company', '')),
        normalize_title(job.metadata.get('job_title', '')),
        normalize_location(job.metadata.get('location', '')),
        job.metadata.get('posted_date', '')[:10]  # Date only
    ]

    key = '|'.join(c for c in components if c)
    job_id = hashlib.sha256(key.encode()).hexdigest()[:16]

    return f"hash:{job_id}"


def canonicalize_url(url: str) -> str:
    """
    Normalize URL for deduplication

    Examples:
    - Remove tracking parameters
    - Normalize domain (www vs non-www)
    - Extract job ID if present
    """

    if not url:
        return ""

    # Parse URL
    parsed = urlparse(url)

    # Remove tracking params
    query_params = parse_qs(parsed.query)
    clean_params = {
        k: v for k, v in query_params.items()
        if k not in ['utm_source', 'utm_medium', 'utm_campaign', 'ref', 'src']
    }

    # Rebuild
    canonical = urlunparse((
        parsed.scheme,
        parsed.netloc.replace('www.', ''),  # Remove www
        parsed.path,
        '',
        urlencode(clean_params, doseq=True),
        ''
    ))

    return canonical


def check_duplicate(
    job: ParsedJob,
    existing_jobs: List[ParsedJob]
) -> Tuple[bool, Optional[str]]:
    """
    Check if job is duplicate of existing

    Returns:
        (is_duplicate, existing_job_id_if_duplicate)
    """

    job_id = get_canonical_job_id(job)

    for existing in existing_jobs:
        existing_id = get_canonical_job_id(existing)

        if job_id == existing_id:
            return (True, existing.id)

    return (False, None)
```

**Update parse_job_paste() to check duplicates:**

```python
async def parse_job_paste(request: JobPasteRequest) -> ParsedJob:
    # ... existing parsing ...

    # Check for duplicates
    user_jobs = await get_user_jobs(request.user_id)
    is_dup, existing_id = check_duplicate(parsed_job, user_jobs)

    if is_dup:
        # Return existing job instead
        return await get_job_by_id(existing_id)

    # Save new job
    parsed_job.canonical_id = get_canonical_job_id(parsed_job)
    return await save_job(parsed_job)
```

**Add canonical_id to ParsedJob model:**

```typescript
interface ParsedJob {
  id: string;
  canonical_id: string;  // NEW: For deduplication
  user_id: string;
  // ... rest
}
```

---

### 5.2 Requirements Extraction (with Evidence Tracking - P0-4)

```typescript
interface EvidenceSpan {
  quote: string;           // Exact text from JD
  start?: number;          // Character position
  end?: number;            // Character position
  confidence: number;      // 0..1
}

interface ExtractedItem {
  value: string;           // Normalized skill/tool name
  evidence: EvidenceSpan[];  // Where we found it
  importance: "critical" | "important" | "nice_to_have";
}

interface JobRequirements {
  required_skills: ExtractedItem[];
  preferred_skills: ExtractedItem[];
  required_tools: ExtractedItem[];
  preferred_tools: ExtractedItem[];

  experience_level?: string;
  years_experience_required?: number;
  seniority_expected?: "entry" | "mid" | "senior" | "lead";

  domain_keywords?: string[];

  // Metadata
  extraction_confidence: number;  // 0..1
  extraction_method: "llm" | "regex" | "hybrid";
}
```

```python
def extract_requirements_with_evidence(jd_text: string) -> JobRequirements:
    """
    Extract requirements with evidence tracking

    Returns requirements with provenance for each item
    """

    # Use LLM for extraction
    prompt = f"""
    Extract job requirements from this JD. For EACH item, provide:
    1. The normalized name
    2. The exact quote from JD that mentions it
    3. Whether it's required or preferred
    4. Confidence (0-1)

    Job Description:
    {jd_text}

    Return JSON format:
    {{
      "required_skills": [
        {{
          "value": "Python",
          "evidence": [{{
            "quote": "3+ years of Python development experience",
            "confidence": 0.95
          }}],
          "importance": "critical"
        }}
      ],
      ...
    }}
    """

    result = llm_call(prompt, response_format="json")

    # Parse and validate
    requirements = parse_requirements(result)

    # Add character positions for evidence
    for item_list in [requirements.required_skills, requirements.preferred_skills,
                      requirements.required_tools, requirements.preferred_tools]:
        for item in item_list:
            for evidence in item.evidence:
                # Find position in original text
                pos = jd_text.find(evidence.quote)
                if pos >= 0:
                    evidence.start = pos
                    evidence.end = pos + len(evidence.quote)

    return requirements


def extract_requirements(raw_text: str) -> JobRequirements:
    """
    Extract structured requirements from JD (legacy method)

    Uses pattern matching + NLP
    """

    # Find requirements section
    requirements_section = find_section(raw_text, [
        'requirements', 'qualifications',
        'must have', 'required skills'
    ])

    # Extract skills
    required_skills = extract_skills_from_section(
        requirements_section,
        context='required'
    )

    preferred_skills = extract_skills_from_section(
        raw_text,
        context='preferred'
    )

    # Extract tools/technologies
    required_tools = extract_tools(requirements_section)

    # Extract seniority
    seniority = detect_seniority_level(raw_text)

    # Extract years of experience
    years_exp = extract_years_experience(raw_text)

    # Extract domain keywords
    domain_keywords = extract_domain_keywords(raw_text)

    return JobRequirements(
        required_skills=required_skills,
        preferred_skills=preferred_skills,
        required_tools=required_tools,
        seniority_expected=seniority,
        years_experience_min=years_exp.get('min'),
        years_experience_max=years_exp.get('max'),
        domain_keywords=domain_keywords
    )


def extract_skills_from_section(text: str, context: str) -> List[str]:
    """
    Extract skills using pattern matching
    
    Patterns:
    - "Experience with X, Y, and Z"
    - "Proficiency in X"
    - "Strong X skills"
    - Bulleted lists under requirements
    """
    skills = set()
    
    # Pattern 1: "Experience with X"
    pattern1 = r'experience with ([^.]+)'
    matches = re.findall(pattern1, text, re.IGNORECASE)
    for match in matches:
        extracted = extract_items_from_list(match)
        skills.update(extracted)
    
    # Pattern 2: Bulleted skills
    bullets = extract_bullets(text)
    for bullet in bullets:
        detected_skills = detect_skills_in_text(bullet)
        skills.update(detected_skills)
    
    # Normalize and filter
    skills = normalize_skills(list(skills))
    skills = filter_valid_skills(skills)
    
    return sorted(list(skills))
```

---

### 5.3 Job Ranking Algorithm

```python
def rank_jobs(
    jobs: List[ParsedJob],
    resume: Resume,
    user_preferences: UserPreferences
) -> List[RankedJob]:
    """
    Rank jobs by fit and priority
    
    Steps:
    1. Calculate fit score for each job (via Layer 1)
    2. Categorize job (reach/target/safety)
    3. Calculate priority score
    4. Sort and rank
    """
    
    ranked_jobs = []
    
    for job in jobs:
        # Step 1: Get fit analysis from Layer 1
        fit_analysis = await Layer1.evaluate_fit(resume, job)
        
        # Step 2: Categorize
        category = categorize_job(fit_analysis, user_preferences)
        
        # Step 3: Calculate priority score
        priority_score = calculate_priority_score(
            fit_analysis,
            category,
            user_preferences,
            job
        )
        
        # Step 4: Generate insights
        insights = generate_job_insights(fit_analysis, job)
        flags = determine_job_flags(job, fit_analysis)
        
        ranked_jobs.append(RankedJob(
            job=job,
            fit_score=fit_analysis.fit_score,
            fit_analysis=fit_analysis,
            category=category,
            category_reasoning=get_category_reasoning(category, fit_analysis),
            priority_score=priority_score,
            quick_insights=insights,
            flags=flags,
            should_apply=should_user_apply(fit_analysis, category),
            application_priority=determine_priority(priority_score)
        ))
    
    # Sort by priority score (descending)
    ranked_jobs.sort(key=lambda j: j.priority_score, reverse=True)
    
    # Assign ranks
    for i, job in enumerate(ranked_jobs):
        job.rank = i + 1
    
    return ranked_jobs
```

---

### 5.4 Job Categorization (Updated with "Avoid" Category - P0-2)

```python
def categorize_job(fit_score: float, gaps: GapAnalysis) -> JobCategory:
    """
    Categorize job as reach/target/safety/avoid

    Categories:
    - reach: ambitious but viable (fit 70-85, some gaps)
    - target: good fit (fit 60-85)
    - safety: high probability (fit 55-75, overqualified or perfectly aligned)
    - avoid: poor fit (fit < 50 or major red flags)
    """

    # CRITICAL: Avoid category for very low fit
    if fit_score < 50:
        return "avoid"

    # Check for major red flags
    critical_missing_count = (
        len(gaps.skills.critical_missing) +
        len(gaps.tools.critical_missing)
    )

    if critical_missing_count > 5:
        return "avoid"  # Too many gaps

    # Reach: ambitious but viable
    if fit_score >= 70 and fit_score < 85:
        if gaps.seniority.alignment == 'underqualified':
            if gaps.seniority.gap_years <= 2:
                return "reach"  # Stretch but possible
            else:
                return "avoid"  # Too big a stretch

        if critical_missing_count <= 2:
            return "reach"

    # Target: good fit
    if fit_score >= 60 and fit_score < 90:
        if gaps.seniority.alignment == 'aligned':
            return "target"

        if gaps.seniority.alignment == 'underqualified':
            if gaps.seniority.gap_years <= 1:
                return "target"  # Minor stretch

        if critical_missing_count <= 3:
            return "target"

    # Safety: high probability
    if fit_score >= 55:
        if gaps.seniority.alignment == 'overqualified':
            return "safety"

        if gaps.seniority.alignment == 'aligned' and critical_missing_count == 0:
            return "safety"

    # Default: avoid if nothing matches
    return "avoid"


def calculate_priority_score(
    fit_analysis: FitScore,
    category: str,
    user_preferences: UserPreferences,
    job: ParsedJob
) -> float:
    """
    Calculate priority score for sorting (0-100)
    
    Factors:
    - Fit score (50% weight)
    - Category bonus (20% weight)
    - User preferences match (20% weight)
    - Freshness (10% weight)
    """
    
    # Base: Fit score
    score = fit_analysis.fit_score * 0.5
    
    # Category bonus
    category_bonus = {
        'target': 20,    # Prioritize targets
        'safety': 15,    # Then safeties
        'reach': 10      # Then reaches
    }
    score += category_bonus.get(category, 0)
    
    # User preferences
    pref_score = calculate_preference_match(job, user_preferences)
    score += pref_score * 0.2
    
    # Freshness (newer jobs ranked higher)
    freshness_score = calculate_freshness(job.created_at)
    score += freshness_score * 0.1

    return min(100, score)
```

---

### 5.4.1 Urgency Score Calculation (P0-3)

```python
def calculate_urgency_score(job: ParsedJob) -> float:
    """
    Calculate urgency (0-100) based on deadline proximity and recency

    High urgency = posted recently + deadline soon
    """

    urgency = 0

    # Component 1: Deadline proximity (60% weight)
    deadline = job.metadata.get('application_deadline')
    if deadline:
        days_until_deadline = (datetime.fromisoformat(deadline) - datetime.now()).days

        if days_until_deadline < 0:
            urgency_deadline = 0  # Expired
        elif days_until_deadline <= 3:
            urgency_deadline = 100  # Very urgent
        elif days_until_deadline <= 7:
            urgency_deadline = 80
        elif days_until_deadline <= 14:
            urgency_deadline = 60
        elif days_until_deadline <= 30:
            urgency_deadline = 40
        else:
            urgency_deadline = 20
    else:
        urgency_deadline = 50  # Default if no deadline

    urgency += urgency_deadline * 0.6

    # Component 2: Posted recency (40% weight)
    posted_date = job.metadata.get('posted_date')
    if posted_date:
        days_since_posted = (datetime.now() - datetime.fromisoformat(posted_date)).days

        if days_since_posted <= 3:
            urgency_recency = 100  # Very fresh
        elif days_since_posted <= 7:
            urgency_recency = 80
        elif days_since_posted <= 14:
            urgency_recency = 60
        elif days_since_posted <= 30:
            urgency_recency = 40
        else:
            urgency_recency = 20  # Old posting
    else:
        # Fallback to created_at (when we saved it)
        created_at = job.created_at
        days_since_saved = (datetime.now() - datetime.fromisoformat(created_at)).days

        if days_since_saved <= 1:
            urgency_recency = 60  # Recently saved
        elif days_since_saved <= 7:
            urgency_recency = 40
        else:
            urgency_recency = 20

    urgency += urgency_recency * 0.4

    return round(urgency, 1)
```

**Update priority_score calculation in rank_jobs():**

Priority score should now include urgency:

```python
priority_score = (
    fit_score * 0.40 +
    category_score * 0.25 +
    preference_score * 0.15 +
    freshness_score * 0.10 +  # Reduced weight
    urgency_score * 0.10       # NEW: Urgency component
)
```

---

### 5.4.2 Should User Apply Decision (P0-1)

```python
def should_user_apply(
    fit_score: float,
    category: JobCategory,
    user_preferences: UserPreferences,
    job: ParsedJob
) -> Tuple[bool, str]:
    """
    Determine if user should apply to this job

    Returns:
        (should_apply, reasoning)
    """

    # Rule 1: Very low fit = NO
    if fit_score < 50:
        return (False, f"Fit too low ({fit_score}/100) - would waste time")

    # Rule 2: Category avoid = NO
    if category == "avoid":
        return (False, "Job categorized as 'avoid' due to major mismatches")

    # Rule 3: Hard constraints violation = NO
    constraints_passed, reason = check_hard_constraints(job, user_preferences)
    if not constraints_passed:
        return (False, f"Hard constraint failed: {reason}")

    # Rule 4: Reach jobs need higher bar
    if category == "reach":
        if fit_score < 65:
            return (False, f"Reach position requires fit >= 65 (current: {fit_score})")
        return (True, f"Strong reach opportunity ({fit_score}/100 fit)")

    # Rule 5: Target jobs - default YES if fit >= 60
    if category == "target":
        if fit_score >= 60:
            return (True, f"Good fit ({fit_score}/100) for target role")
        return (False, f"Fit ({fit_score}/100) below threshold for target")

    # Rule 6: Safety jobs - YES if fit >= 55
    if category == "safety":
        if fit_score >= 55:
            return (True, f"Solid safety option ({fit_score}/100 fit)")
        return (False, f"Even for safety, fit too low ({fit_score}/100)")

    # Default fallback
    return (fit_score >= 60, f"Based on fit score: {fit_score}/100")


def check_hard_constraints(
    job: ParsedJob,
    preferences: UserPreferences
) -> Tuple[bool, str]:
    """
    Check if job violates hard constraints

    Returns:
        (passed, reason_if_failed)
    """

    # Constraint 1: Work arrangement
    if preferences.work_arrangement:
        job_arrangement = job.metadata.get('work_arrangement', 'onsite').lower()
        if job_arrangement not in [a.lower() for a in preferences.work_arrangement]:
            return (False, f"Work arrangement '{job_arrangement}' not in preferences")

    # Constraint 2: Salary minimum
    if preferences.salary_minimum:
        job_salary = job.metadata.get('salary_min')
        if job_salary and job_salary < preferences.salary_minimum:
            return (False, f"Salary ${job_salary} below minimum ${preferences.salary_minimum}")

    # Constraint 3: Excluded industries
    if preferences.excluded_industries:
        job_industry = job.metadata.get('industry', '').lower()
        if any(excl.lower() in job_industry for excl in preferences.excluded_industries):
            return (False, f"Industry '{job_industry}' in exclusion list")

    # Constraint 4: Location (if strict)
    if preferences.locations and preferences.get('strict_location', False):
        job_location = job.metadata.get('location', '').lower()
        if not any(loc.lower() in job_location for loc in preferences.locations):
            return (False, f"Location '{job_location}' not in preferences")

    # All constraints passed
    return (True, "")
```

---

### 5.4.3 Priority Determination (P0-1)

```python
def determine_priority(
    fit_score: float,
    category: JobCategory,
    should_apply: bool,
    score_breakdown: dict,
    flags: dict
) -> str:
    """
    Determine priority level: high/medium/low

    Priority = combination of fit, category, freshness, urgency
    """

    if not should_apply:
        return "low"

    # Calculate priority score (0-100)
    priority_score = 0

    # Component 1: Fit (40%)
    priority_score += fit_score * 0.4

    # Component 2: Category bonus (30%)
    category_bonus = {
        "reach": 25,
        "target": 30,
        "safety": 20,
        "avoid": 0
    }
    priority_score += category_bonus.get(category, 0)

    # Component 3: Freshness (15%)
    priority_score += score_breakdown.get('freshness_component', 0) * 0.15

    # Component 4: Urgency (15%)
    priority_score += score_breakdown.get('urgency_component', 0) * 0.15

    # Bonuses
    if flags.get('dream_job'):
        priority_score += 15

    if flags.get('new'):
        priority_score += 5

    # Penalties
    if flags.get('scam_risk'):
        priority_score -= 30

    # Map to priority level
    if priority_score >= 75:
        return "high"
    elif priority_score >= 50:
        return "medium"
    else:
        return "low"
```

---

### 5.4.4 Job Flags Generation (P0-1)

```python
def determine_job_flags(
    job: ParsedJob,
    fit_score: float,
    gaps: GapAnalysis,
    user_applications: List[Application]
) -> dict:
    """
    Generate boolean flags for job
    """

    flags = {}

    # Dream job: high fit + brand company + career capital
    flags['dream_job'] = (
        fit_score >= 85 and
        job.metadata.get('company_tier') in ['top_tier', 'unicorn']
    )

    # New: posted in last 7 days
    posted_date = job.metadata.get('posted_date')
    if posted_date:
        days_old = (datetime.now() - datetime.fromisoformat(posted_date)).days
        flags['new'] = days_old <= 7
    else:
        flags['new'] = False

    # Applied: check if user already applied
    job_canonical = get_canonical_job_id(job)
    flags['applied'] = any(
        app.job_canonical_id == job_canonical
        for app in user_applications
    )

    # Rejected: check if previously rejected
    flags['rejected'] = any(
        app.job_canonical_id == job_canonical and app.status == 'rejected'
        for app in user_applications
    )

    # Expired: past deadline
    deadline = job.metadata.get('application_deadline')
    if deadline:
        flags['expired'] = datetime.now() > datetime.fromisoformat(deadline)
    else:
        flags['expired'] = False

    # Scam risk: detect suspicious patterns
    flags['scam_risk'] = detect_scam_risk(job)

    return flags


def detect_scam_risk(job: ParsedJob) -> bool:
    """
    Detect if job might be scam/low-quality (MOAT #3)
    """

    red_flags = 0

    # Red flag 1: Company unknown and no website
    if (not job.metadata.get('company') or
        job.metadata.get('company') == 'Unknown'):
        red_flags += 1

    # Red flag 2: JD too short (< 200 chars)
    if len(job.raw_jd) < 200:
        red_flags += 2

    # Red flag 3: Unrealistic salary
    salary_max = job.metadata.get('salary_max')
    if salary_max and salary_max > 500000:  # > $500k suspicious
        red_flags += 1

    # Red flag 4: Suspicious keywords
    scam_keywords = ['work from home', 'easy money', 'no experience',
                     'guaranteed income', 'investment opportunity']
    jd_lower = job.raw_jd.lower()
    if any(kw in jd_lower for kw in scam_keywords):
        red_flags += 2

    # Red flag 5: No specific requirements
    if not job.requirements.required_skills and not job.requirements.required_tools:
        red_flags += 1

    # Scam if >= 3 red flags
    return red_flags >= 3
```

---

### 5.4.5 Job Insights Generation (P0-1)

```python
def generate_job_insights(
    job: ParsedJob,
    fit_analysis: FitAnalysis,
    category: JobCategory,
    career_capital: dict
) -> List[str]:
    """
    Generate human-readable insights about the job
    """

    insights = []

    # Insight 1: Fit summary
    if fit_analysis.fit_score >= 80:
        insights.append(f"Excellent match ({fit_analysis.fit_score}/100) - strong alignment with your background")
    elif fit_analysis.fit_score >= 65:
        insights.append(f"Good fit ({fit_analysis.fit_score}/100) - meets most requirements")
    elif fit_analysis.fit_score >= 50:
        insights.append(f"Moderate fit ({fit_analysis.fit_score}/100) - some gaps but viable")
    else:
        insights.append(f"Weak fit ({fit_analysis.fit_score}/100) - significant gaps present")

    # Insight 2: Key strengths
    if fit_analysis.gaps.skills.matched:
        top_matched = fit_analysis.gaps.skills.matched[:3]
        insights.append(f"Strong on: {', '.join(top_matched)}")

    # Insight 3: Key gaps
    if fit_analysis.gaps.skills.critical_missing:
        top_missing = fit_analysis.gaps.skills.critical_missing[:3]
        insights.append(f"Missing: {', '.join(top_missing)}")

    # Insight 4: Transferable skills
    if fit_analysis.gaps.skills.transferable:
        insights.append(f"Transferable: {fit_analysis.gaps.skills.transferable[0]} experience applies")

    # Insight 5: Seniority alignment
    seniority_gap = fit_analysis.gaps.seniority
    if seniority_gap.alignment == 'underqualified':
        insights.append(f"Stretch role: {seniority_gap.gap_years}+ years gap")
    elif seniority_gap.alignment == 'overqualified':
        insights.append("May be overqualified for this level")
    else:
        insights.append("Seniority well-aligned")

    # Insight 6: Career capital
    if career_capital.get('brand_score', 0) >= 80:
        insights.append("High-value brand for career growth")

    if career_capital.get('skill_growth_score', 0) >= 75:
        insights.append("Strong opportunity for skill development")

    # Insight 7: Category context
    if category == "reach":
        insights.append("Ambitious target - worth the effort if excited")
    elif category == "safety":
        insights.append("Solid backup option with high acceptance probability")

    return insights[:7]  # Max 7 insights
```

---

### 5.4.6 Score Breakdown Calculation (MOAT #1)

```python
def calculate_score_breakdown(
    fit_score: float,
    category: JobCategory,
    preference_match: float,
    freshness: float,
    urgency: float,
    job: ParsedJob,
    user_prefs: UserPreferences
) -> ScoreBreakdown:
    """
    Calculate detailed score breakdown for transparency
    """

    # Base components
    fit_component = fit_score * 0.40
    preference_component = preference_match * 0.15
    freshness_component = freshness * 0.10
    urgency_component = urgency * 0.10

    # Category bonus
    category_scores = {
        "reach": 20,
        "target": 25,
        "safety": 15,
        "avoid": 0
    }
    category_component = category_scores.get(category, 0)

    raw_score = (
        fit_component +
        preference_component +
        freshness_component +
        category_component +
        urgency_component
    )

    # Calculate penalties
    penalties = []

    # Penalty 1: Location mismatch
    if user_prefs.locations:
        job_location = job.metadata.get('location', '').lower()
        if not any(loc.lower() in job_location for loc in user_prefs.locations):
            penalties.append({
                "code": "location_mismatch",
                "amount": -10,
                "reason": f"Location '{job_location}' not in preferences"
            })

    # Penalty 2: Salary below minimum
    if user_prefs.salary_minimum:
        job_salary = job.metadata.get('salary_max')
        if job_salary and job_salary < user_prefs.salary_minimum:
            penalties.append({
                "code": "salary_low",
                "amount": -15,
                "reason": f"Salary ${job_salary} below minimum ${user_prefs.salary_minimum}"
            })

    # Penalty 3: Scam risk
    if detect_scam_risk(job):
        penalties.append({
            "code": "scam_risk",
            "amount": -30,
            "reason": "Job shows red flags (suspicious patterns)"
        })

    # Penalty 4: Expired
    if is_expired(job):
        penalties.append({
            "code": "expired",
            "amount": -50,
            "reason": "Application deadline passed"
        })

    # Calculate final
    total_penalties = sum(p['amount'] for p in penalties)
    final_score = max(0, raw_score + total_penalties)

    return ScoreBreakdown(
        fit_component=round(fit_component, 1),
        preference_component=round(preference_component, 1),
        freshness_component=round(freshness_component, 1),
        category_component=round(category_component, 1),
        urgency_component=round(urgency_component, 1),
        penalties=penalties,
        raw_score=round(raw_score, 1),
        final_score=round(final_score, 1)
    )
```

---

### 5.5 Job Comparison

```python
def compare_jobs(
    jobs: List[RankedJob],
    resume: Resume
) -> JobComparisonResult:
    """
    Generate side-by-side comparison
    
    Highlights:
    - Common vs unique requirements
    - Fit score differences
    - Best fit for different criteria
    """
    
    # Extract fit scores
    fit_scores = [j.fit_score for j in jobs]
    categories = [j.category for j in jobs]
    
    # Skills analysis
    all_required_skills = []
    unique_skills = {}
    
    for job in jobs:
        required = job.fit_analysis.gaps.skills.critical_missing
        all_required_skills.extend(required)
        unique_skills[job.job.job_id] = required
    
    # Find common requirements
    common_requirements = find_common_items(unique_skills.values())
    
    # Calculate coverage
    resume_skills = set(resume.extracted.skills)
    all_requirements = set(all_required_skills)
    coverage = (len(resume_skills & all_requirements) / len(all_requirements)) * 100 if all_requirements else 100
    
    # Determine best options
    best_fit_id = max(jobs, key=lambda j: j.fit_score).job.job_id
    easiest_id = next((j.job.job_id for j in jobs if j.category == 'safety'), jobs[0].job.job_id)
    best_growth_id = determine_best_for_growth(jobs)
    
    # Generate insights
    insights = generate_comparison_insights(jobs, common_requirements)
    
    return JobComparisonResult(
        jobs=jobs,
        comparison={
            'fit_scores': fit_scores,
            'categories': categories,
            'skills_overlap': {
                'common_requirements': common_requirements,
                'unique_per_job': unique_skills,
                'your_coverage': coverage
            },
            'seniority_levels': [j.job.requirements.seniority_expected for j in jobs],
            'locations': [j.job.location for j in jobs],
        },
        best_fit=best_fit_id,
        easiest_to_get=easiest_id,
        best_for_growth=best_growth_id,
        insights=insights
    )
```

---

## 6. Career Capital Analysis (MOAT #2)

### 6.1 Purpose

Calculate "career capital score" - how valuable this job is for long-term career growth beyond immediate fit.

**Components:**
- Brand value (company reputation)
- Skill growth potential
- Network opportunities
- Compensation competitiveness

---

### 6.2 Career Capital Score Calculation

```python
def calculate_career_capital(
    job: ParsedJob,
    fit_analysis: FitAnalysis,
    user_profile: UserProfile
) -> dict:
    """
    Calculate career capital score (0-100) with breakdown
    """

    # Component 1: Brand value (30%)
    brand_score = calculate_brand_value(job.metadata.get('company', ''))

    # Component 2: Skill growth (30%)
    skill_growth = calculate_skill_growth_potential(
        job.requirements,
        user_profile.skills
    )

    # Component 3: Network (20%)
    network_score = calculate_network_potential(job)

    # Component 4: Compensation (20%)
    comp_score = calculate_comp_competitiveness(
        job.metadata.get('salary_max'),
        user_profile.years_experience,
        job.metadata.get('location')
    )

    # Weighted sum
    career_capital_score = (
        brand_score * 0.30 +
        skill_growth * 0.30 +
        network_score * 0.20 +
        comp_score * 0.20
    )

    return {
        'career_capital_score': round(career_capital_score, 1),
        'brand_score': round(brand_score, 1),
        'skill_growth_score': round(skill_growth, 1),
        'network_score': round(network_score, 1),
        'comp_score': round(comp_score, 1),
        'breakdown': {
            'brand': interpret_brand_score(brand_score),
            'skill_growth': interpret_skill_growth(skill_growth),
            'network': interpret_network(network_score),
            'comp': interpret_comp(comp_score)
        }
    }


def calculate_brand_value(company: str) -> float:
    """
    Brand value based on company tier
    """

    # Tier 1: FAANG + top unicorns
    tier1 = ['google', 'apple', 'amazon', 'meta', 'microsoft', 'netflix',
             'openai', 'anthropic', 'stripe', 'databricks']

    # Tier 2: Well-known tech companies
    tier2 = ['uber', 'airbnb', 'spotify', 'shopify', 'atlassian',
             'salesforce', 'oracle', 'adobe', 'nvidia']

    # Tier 3: Funded startups + established companies
    tier3 = ['series_b', 'series_c', 'public_company']

    company_lower = company.lower()

    if any(t in company_lower for t in tier1):
        return 95
    elif any(t in company_lower for t in tier2):
        return 80
    elif any(t in company_lower for t in tier3):
        return 60
    else:
        return 40  # Unknown company


def calculate_skill_growth_potential(
    job_requirements: JobRequirements,
    current_skills: List[str]
) -> float:
    """
    How much can you learn from this role?
    """

    current_skills_set = set(s.lower() for s in current_skills)

    # Count new skills you'd learn
    new_skills = [
        skill for skill in job_requirements.required_skills
        if skill.value.lower() not in current_skills_set
    ]

    # Count cutting-edge technologies
    cutting_edge = ['kubernetes', 'terraform', 'ml', 'ai', 'blockchain',
                    'rust', 'go', 'kafka', 'spark']
    cutting_edge_count = sum(
        1 for skill in job_requirements.required_skills
        if any(ce in skill.value.lower() for ce in cutting_edge)
    )

    # Score
    if len(new_skills) >= 5 and cutting_edge_count >= 2:
        return 90  # High growth
    elif len(new_skills) >= 3:
        return 70  # Moderate growth
    elif len(new_skills) >= 1:
        return 50  # Some growth
    else:
        return 30  # Limited growth


def calculate_network_potential(job: ParsedJob) -> float:
    """
    Networking opportunities
    """

    score = 50  # Base

    # Company size matters
    company_size = job.metadata.get('company_size', '')
    if '1000+' in company_size:
        score += 20  # Large network
    elif '100-1000' in company_size:
        score += 10

    # Tech hub location
    location = job.metadata.get('location', '').lower()
    tech_hubs = ['san francisco', 'new york', 'seattle', 'austin',
                 'boston', 'london', 'berlin', 'singapore']
    if any(hub in location for hub in tech_hubs):
        score += 15

    # Remote = lower network
    if 'remote' in location:
        score -= 10

    return min(100, max(0, score))


def calculate_comp_competitiveness(
    salary_max: Optional[int],
    years_exp: int,
    location: str
) -> float:
    """
    How competitive is compensation?
    """

    if not salary_max:
        return 50  # Unknown

    # Benchmark by experience
    benchmarks = {
        0: 80000,   # Entry
        3: 120000,  # Mid
        5: 150000,  # Senior
        8: 200000   # Lead
    }

    expected = benchmarks.get(years_exp, 100000)

    # Adjust for location
    if 'san francisco' in location.lower() or 'new york' in location.lower():
        expected *= 1.3

    # Score
    ratio = salary_max / expected

    if ratio >= 1.3:
        return 95  # Excellent
    elif ratio >= 1.1:
        return 80  # Good
    elif ratio >= 0.9:
        return 60  # Fair
    else:
        return 40  # Below market
```

---

### 6.3 Integration with Job Comparison

**Update compare_jobs() to include career capital:**

```python
def compare_jobs_with_career_capital(jobs: List[RankedJob]) -> ComparisonResult:
    # ... existing comparison ...

    # Add career capital comparison
    best_for_growth = max(jobs, key=lambda j: j.career_capital['career_capital_score'])
    best_for_brand = max(jobs, key=lambda j: j.career_capital['brand_score'])
    best_for_comp = max(jobs, key=lambda j: j.career_capital['comp_score'])

    return ComparisonResult(
        # ... existing fields ...
        best_for_growth=best_for_growth.job.id,
        best_for_brand=best_for_brand.job.id,
        best_for_compensation=best_for_comp.job.id
    )
```

**Update JobComparisonResult interface (Section 4.5):**

Add these fields to the comparison result:
- `best_for_growth: string` - Job ID with highest career capital score
- `best_for_brand: string` - Job ID with highest brand score
- `best_for_compensation: string` - Job ID with most competitive comp

---

## 7. Integration Points

### 7.1 With Layer 1 (Evaluation)

```typescript
// Layer 6 calls Layer 1 for fit analysis
const fitAnalysis = await Layer1.evaluate_fit({
  resume: userResume,
  job_description: {
    raw_text: parsedJob.raw_text,
    parsed_requirements: parsedJob.requirements
  }
});

// Use fit_score and gaps for ranking
const rankedJob = {
  ...parsedJob,
  fit_score: fitAnalysis.fit_score,
  fit_analysis: fitAnalysis,
  category: categorize_job(fitAnalysis)
};
```

---

### 7.2 With Layer 2 (Strategy)

```typescript
// Layer 2 uses job data from Layer 6 for strategy
const jobContext = {
  total_jobs_discovered: jobList.summary.total_jobs,
  average_fit_score: jobList.summary.average_fit_score,
  top_job_fit: jobList.top_recommendations[0]?.fit_score
};

// Layer 2 adjusts strategy based on job market
if (jobContext.average_fit_score < 50) {
  strategy = 'RETHINK_TARGETS';  // Jobs don't match profile
}
```

---

### 7.3 With Layer 4 (Storage)

```typescript
// Layer 6 saves jobs via Layer 4
await Layer4.saveJob({
  user_id: userId,
  job: parsedJob,
  fit_score: rankedJob.fit_score,
  category: rankedJob.category,
  status: 'discovered'
});

// Layer 4 stores in JobPosting table
JobPosting.create({
  id: job.job_id,
  userId: user_id,
  jobTitle: job.job_title,
  company: job.company,
  fitScore: fit_score,
  category: category,
  status: 'discovered',
  parsedRequirements: job.requirements,
  createdAt: new Date()
});
```

---

### 7.4 With Layer 5 (Orchestrator)

```typescript
// Layer 5 uses Layer 6 for job discovery in plans
async function generateDailyPlan(userId: string) {
  // Get ranked jobs
  const jobList = await Layer6.getRankedJobs(userId);
  
  // If in APPLY_MODE, prioritize top jobs
  if (currentMode === 'APPLY_MODE') {
    const topJobs = jobList.top_recommendations.slice(0, 3);
    
    tasks.push({
      type: 'apply_to_job',
      job_ids: topJobs.map(j => j.job.job_id),
      priority: 'high'
    });
  }
}
```

---

## 8. API Methods

### 8.1 parseAndRankJob()

```typescript
/**
 * Parse job description and rank against resume
 * 
 * Use when:
 * - User pastes new job
 * 
 * Returns:
 * - RankedJob with fit analysis
 */
async parseAndRankJob(request: JobPasteRequest): Promise<RankedJob>;
```

**Example:**
```typescript
const rankedJob = await Layer6.parseAndRankJob({
  job_description: jdText,
  metadata: {
    job_title: 'Senior Product Manager',
    company: 'Google',
    job_url: 'https://...'
  },
  user_id: 'user_123',
  resume_version_id: 'resume_v5'
});

// Display to user
console.log(`Fit score: ${rankedJob.fit_score}/100`);
console.log(`Category: ${rankedJob.category}`);
console.log(`Should apply: ${rankedJob.should_apply}`);
```

---

### 8.2 getRankedJobs()

```typescript
/**
 * Get all jobs ranked by fit
 * 
 * Use when:
 * - User views job board
 * - Dashboard overview
 * 
 * Returns:
 * - JobListResult with categorized jobs
 */
async getRankedJobs(
  userId: string,
  filters?: JobFilters
): Promise<JobListResult>;
```

**Example:**
```typescript
const jobList = await Layer6.getRankedJobs('user_123', {
  category: 'target',  // Only targets
  min_fit_score: 60,
  location: 'Remote'
});

// Display categorized jobs
console.log(`Target jobs: ${jobList.jobs.target.length}`);
console.log(`Top recommendation: ${jobList.top_recommendations[0].job.job_title}`);
```

---

### 8.3 compareJobs()

```typescript
/**
 * Compare multiple jobs side-by-side
 * 
 * Use when:
 * - User selecting between options
 * - Decision support
 * 
 * Returns:
 * - JobComparisonResult with insights
 */
async compareJobs(
  userId: string,
  jobIds: string[]
): Promise<JobComparisonResult>;
```

**Example:**
```typescript
const comparison = await Layer6.compareJobs('user_123', [
  'job_abc',
  'job_def',
  'job_ghi'
]);

// Display comparison
console.log(`Best fit: ${comparison.best_fit}`);
console.log(`Easiest to get: ${comparison.easiest_to_get}`);
console.log(`Common requirements: ${comparison.comparison.skills_overlap.common_requirements}`);
```

---

## 9. Performance & Scalability

### 9.1 Performance Targets (v1.0)

- Job parsing: <1s per job
- Ranking: <2s for 10 jobs (includes Layer 1 calls)
- Comparison: <500ms for 5 jobs

### 9.2 Caching Strategy

```typescript
// Cache parsed jobs (avoid re-parsing)
const cacheKey = hashJobText(raw_text);
const cached = cache.get(cacheKey);

if (cached) {
  return cached.parsedJob;
}

// Cache fit analyses (expensive)
const fitCacheKey = `${resume_id}_${job_id}`;
const cachedFit = cache.get(fitCacheKey);

if (cachedFit) {
  return cachedFit;
}
```

### 9.3 Batch Processing

```typescript
// Rank multiple jobs in parallel
const fitAnalyses = await Promise.all(
  jobs.map(job => Layer1.evaluate_fit(resume, job))
);

// Process results
const rankedJobs = jobs.map((job, i) => ({
  job,
  fit_analysis: fitAnalyses[i],
  // ... ranking logic
}));
```

---

## 10. Error Handling

### 10.1 Parsing Failures

```python
def parse_job_description(raw_text: str) -> ParsedJob:
    try:
        # Normal parsing
        return parse_with_high_quality(raw_text)
    except ParsingError:
        # Fallback: Basic extraction
        return parse_with_low_quality(raw_text)
```

### 10.2 Missing Requirements

```python
if not parsed_job.requirements.required_skills:
    # Use job title to infer requirements
    inferred = infer_requirements_from_title(parsed_job.job_title)
    parsed_job.requirements = inferred
    parsed_job.metadata.parse_quality = 'low'
```

### 10.3 Invalid Input

```python
def validate_job_paste(request: JobPasteRequest):
    if len(request.job_description) < 50:
        raise ValidationError('Job description too short')
    
    if len(request.job_description) > 50000:
        raise ValidationError('Job description too long')
```

---

## 11. Testing Requirements

### 11.1 Unit Tests

```python
test('parse_job_description: extracts title correctly')
test('extract_requirements: identifies required skills')
test('extract_requirements: separates required vs preferred')
test('categorize_job: safety for high fit + aligned')
test('categorize_job: reach for moderate fit + underqualified')
test('calculate_priority_score: correct weighting')
```

### 11.2 Integration Tests

```python
test('parseAndRankJob: calls Layer 1 correctly')
test('parseAndRankJob: returns complete RankedJob')
test('getRankedJobs: groups by category')
test('compareJobs: generates insights')
```

### 11.3 Golden Tests

```python
GOLDEN_JOBS = [
  {
    'name': 'senior_pm_google',
    'jd_text': '...',
    'expected_title': 'Senior Product Manager',
    'expected_skills': ['product strategy', 'roadmap', 'agile'],
    'expected_seniority': 'senior',
    'expected_category': 'target'
  },
  # 10+ golden test cases
]
```

---

### 11.4 v1.1 New Functionality Tests

```python
# P0-1: Missing functions
test('should_user_apply: returns false for fit < 50')
test('should_user_apply: returns false for avoid category')
test('should_user_apply: checks hard constraints')
test('determine_priority: returns low for should_apply=false')
test('determine_priority: applies bonuses for dream_job and new flags')
test('determine_job_flags: detects scam_risk correctly')
test('determine_job_flags: marks jobs as new within 7 days')
test('generate_job_insights: returns max 7 insights')

# P0-2: Avoid category
test('categorize_job: returns avoid for fit < 50')
test('categorize_job: returns avoid for critical_missing_count > 5')
test('categorize_job: returns avoid for gap_years > 2 in reach category')

# P0-3: Urgency score
test('calculate_urgency_score: returns 100 for deadline in 3 days')
test('calculate_urgency_score: uses posted_date when available')
test('calculate_urgency_score: falls back to created_at')

# P0-4: Evidence spans
test('extract_requirements_with_evidence: includes quote for each skill')
test('extract_requirements_with_evidence: sets start and end positions')
test('extract_requirements_with_evidence: confidence scores present')

# P0-5: Deduplication
test('get_canonical_job_id: uses URL when available')
test('get_canonical_job_id: hashes key fields when no URL')
test('check_duplicate: returns true for matching canonical_id')
test('canonicalize_url: removes tracking parameters')

# MOAT #1: Score breakdown
test('calculate_score_breakdown: includes all components')
test('calculate_score_breakdown: applies penalties correctly')
test('calculate_score_breakdown: final_score never negative')

# MOAT #2: Career capital
test('calculate_career_capital: returns all score components')
test('calculate_brand_value: returns 95 for tier1 companies')
test('calculate_skill_growth_potential: counts new skills')
test('calculate_network_potential: adjusts for location and remote')
test('calculate_comp_competitiveness: adjusts for location')

# MOAT #3: Scam detection
test('detect_scam_risk: returns true for >= 3 red flags')
test('detect_scam_risk: checks for unknown company')
test('detect_scam_risk: checks for short JD')
test('detect_scam_risk: checks for suspicious keywords')
```

---

## 12. Edge Cases

### Case 1: Very short JD (< 200 words)
```python
if word_count < 200:
    return ParsedJob(
        parse_quality='low',
        requirements=infer_minimal_requirements(text)
    )
```

### Case 2: No requirements section
```python
if not find_section(text, ['requirements']):
    # Infer from job title + responsibilities
    requirements = infer_from_title_and_responsibilities(text)
```

### Case 3: Generic JD
```python
if is_generic_template(text):
    # Flag as low quality
    metadata.parse_quality = 'low'
    metadata.warnings = ['Generic job description']
```

---

# PART II: FUTURE ROADMAP (v2.0+)

## Phase 2: Automated Job Discovery (v2.0)

### 2.1 Job Board APIs

**Integration targets:**
- LinkedIn Jobs API
- Indeed API
- Monster API
- Glassdoor API
- AngelList / Wellfound
- Remote.co / We Work Remotely

### 2.2 Continuous Monitoring

```python
async def monitor_new_jobs(user_id: str):
    """
    Run daily job search based on user preferences
    
    Steps:
    1. Get user search criteria
    2. Query job board APIs
    3. Parse and rank new jobs
    4. Notify user of top matches
    """
    
    criteria = get_user_search_criteria(user_id)
    
    # Search across platforms
    jobs = []
    jobs.extend(await search_linkedin(criteria))
    jobs.extend(await search_indeed(criteria))
    jobs.extend(await search_remote_boards(criteria))
    
    # Deduplicate
    unique_jobs = deduplicate_jobs(jobs)
    
    # Rank and filter
    ranked = await rank_jobs(unique_jobs, user_id)
    top_matches = [j for j in ranked if j.fit_score >= 65]
    
    # Notify user
    if top_matches:
        await notify_user(user_id, top_matches)
```

---

## Phase 3: Advanced Features (v3.0)

### 3.1 Job Alerts

Smart notifications based on:
- New jobs matching criteria
- Jobs expiring soon
- Price drops (if salary info available)

### 3.2 Company Insights

Integration with:
- Glassdoor ratings
- Blind company reviews
- LinkedIn company pages
- Crunchbase funding data

### 3.3 Application Tracking

Track where user applied:
- Application status
- Follow-up recommendations
- Interview preparation

---

**END OF SPECIFICATION**

**Version:** 1.1 (MVP + P0 Fixes + Competitive Moats)
**Status:** Implementation Ready
**Next:** Implementation (Week 5-6)