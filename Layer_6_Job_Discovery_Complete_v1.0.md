# Layer 6 – Job Discovery & Matching Module
## Complete Specification v1.0

**Version:** 1.0 (Initial Specification)  
**Status:** Ready for Review  
**Last Updated:** December 16, 2025  
**Scope:** Job search, discovery, and ranking (MVP focuses on manual paste + ranking)

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

### 4.1 Job Ranking Output

```typescript
interface RankedJob {
  // Job info
  job: ParsedJob;
  
  // Fit analysis (from Layer 1)
  fit_score: number;             // 0-100 (from Layer 1.evaluate_fit)
  fit_analysis: FitScore;        // Complete fit analysis from Layer 1
  
  // Categorization
  category: "reach" | "target" | "safety";
  category_reasoning: string;
  
  // Ranking
  rank: number;                  // 1-based ranking
  priority_score: number;        // 0-100 (for sorting)
  
  // Flags
  flags: {
    dream_job: boolean;          // User marked as favorite
    applied: boolean;            // Already applied
    rejected: boolean;           // User rejected this job
    expired: boolean;            // Past deadline
    new: boolean;                // Added in last 24h
  };
  
  // Recommendations
  should_apply: boolean;         // Based on fit_score + category
  application_priority: "high" | "medium" | "low";
  
  // Quick insights
  quick_insights: string[];      // 3-5 key points
  red_flags?: string[];          // Potential issues
  green_flags?: string[];        // Strong matches
}
```

---

### 4.2 Job List Output

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

### 4.3 Job Comparison Output

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

### 5.2 Requirements Extraction

```python
def extract_requirements(raw_text: str) -> JobRequirements:
    """
    Extract structured requirements from JD
    
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

### 5.4 Job Categorization

```python
def categorize_job(
    fit_analysis: FitScore,
    user_preferences: UserPreferences
) -> str:
    """
    Categorize job as reach, target, or safety
    
    Rules:
    - Safety: fit_score >= 80, aligned or overqualified
    - Target: fit_score 60-79, aligned seniority
    - Reach: fit_score 50-59, underqualified but close
    """
    
    fit_score = fit_analysis.fit_score
    seniority_alignment = fit_analysis.gaps.seniority.alignment
    
    # Safety: High fit + aligned or overqualified
    if fit_score >= 80:
        if seniority_alignment in ['aligned', 'overqualified']:
            return 'safety'
    
    # Target: Good fit + aligned seniority
    if 60 <= fit_score < 80:
        if seniority_alignment == 'aligned':
            return 'target'
        elif seniority_alignment == 'overqualified':
            return 'safety'
    
    # Reach: Moderate fit + underqualified by 1 level
    if 50 <= fit_score < 70:
        if seniority_alignment == 'underqualified':
            gap_years = fit_analysis.gaps.seniority.gap_years or 0
            if gap_years <= 2:
                return 'reach'
    
    # Default: Target
    return 'target'


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

## 6. Integration Points

### 6.1 With Layer 1 (Evaluation)

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

### 6.2 With Layer 2 (Strategy)

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

### 6.3 With Layer 4 (Storage)

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

### 6.4 With Layer 5 (Orchestrator)

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

## 7. API Methods

### 7.1 parseAndRankJob()

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

### 7.2 getRankedJobs()

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

### 7.3 compareJobs()

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

## 8. Performance & Scalability

### 8.1 Performance Targets (v1.0)

- Job parsing: <1s per job
- Ranking: <2s for 10 jobs (includes Layer 1 calls)
- Comparison: <500ms for 5 jobs

### 8.2 Caching Strategy

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

### 8.3 Batch Processing

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

## 9. Error Handling

### 9.1 Parsing Failures

```python
def parse_job_description(raw_text: str) -> ParsedJob:
    try:
        # Normal parsing
        return parse_with_high_quality(raw_text)
    except ParsingError:
        # Fallback: Basic extraction
        return parse_with_low_quality(raw_text)
```

### 9.2 Missing Requirements

```python
if not parsed_job.requirements.required_skills:
    # Use job title to infer requirements
    inferred = infer_requirements_from_title(parsed_job.job_title)
    parsed_job.requirements = inferred
    parsed_job.metadata.parse_quality = 'low'
```

### 9.3 Invalid Input

```python
def validate_job_paste(request: JobPasteRequest):
    if len(request.job_description) < 50:
        raise ValidationError('Job description too short')
    
    if len(request.job_description) > 50000:
        raise ValidationError('Job description too long')
```

---

## 10. Testing Requirements

### 10.1 Unit Tests

```python
test('parse_job_description: extracts title correctly')
test('extract_requirements: identifies required skills')
test('extract_requirements: separates required vs preferred')
test('categorize_job: safety for high fit + aligned')
test('categorize_job: reach for moderate fit + underqualified')
test('calculate_priority_score: correct weighting')
```

### 10.2 Integration Tests

```python
test('parseAndRankJob: calls Layer 1 correctly')
test('parseAndRankJob: returns complete RankedJob')
test('getRankedJobs: groups by category')
test('compareJobs: generates insights')
```

### 10.3 Golden Tests

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

## 11. Edge Cases

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

**Version:** 1.0 (MVP)
**Status:** Ready for Review
**Next:** Expert review → Implementation (Week 5-6)