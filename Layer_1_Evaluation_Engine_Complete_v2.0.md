# Layer 1 – Evaluation Engine
## Complete Specification v2.0

**Version:** 2.0 (Aligned with Layer 2 & Layer 4 contracts)  
**Status:** Implementation-Ready  
**Last Updated:** December 16, 2025  
**Scope:** Generic resume assessment with career capital scoring + entity extraction

---

## Document Purpose

Single source of truth for Layer 1 Evaluation Engine development.

**Part I:** Core Specification - ready to implement  
**Part II:** Advanced Features - future roadmap

---

# PART I: CORE SPECIFICATION

## 0. Purpose & Role

Layer 1 is the **Resume Evaluation Engine** that provides objective, generic assessment of resume quality.

**Primary functions:**
- Score resume across 4 core dimensions (MVP)
- Extract structured entities (skills, tools, titles, companies)
- Identify weaknesses and improvement areas
- Provide actionable feedback for resume improvement

**Key innovation:** Evidence-based scoring with entity extraction for downstream analysis.

**Non-responsibilities:**
- Does NOT analyze career strategy (Layer 2 does)
- Does NOT rewrite content (Layer 3 does)
- Does NOT store state (Layer 4 does)
- Does NOT make recommendations (Layer 5 does)

**Positioning:** Layer 1 is domain-agnostic and role-agnostic. It evaluates "resume quality" not "job fit".

---

## 1. Design Principles

**Objective & Generic**
- Role-agnostic scoring (works for PM, SWE, Designer, etc.)
- No bias toward specific industries
- Evidence-based metrics only

**Deterministic**
- Same resume → same score (within version)
- No randomness, no LLM-based scoring
- Fully reproducible

**Fast & Lightweight**
- Target latency: <2s for typical resume
- No external API calls for scoring
- Cacheable results

**Transparent**
- Every score has clear breakdown
- Issues are specific and actionable
- No "black box" scoring

---

## 2. Input Contract

### 2.1 From User (via API)

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

### 2.2 Parsed Resume Structure (Internal)

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

## 3. Output Contract (CRITICAL - Aligned with Layer 2 & Layer 4)

### 3.1 Primary Output Interface

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
    version: "2.0";
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

### 3.2 Integration Points

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

---

## 4. Core Scoring Algorithm

### 4.1 Dimension Weights

```python
# MVP weights (simple distribution)
WEIGHTS = {
    'skill_capital': 0.30,
    'execution_impact': 0.30,
    'learning_adaptivity': 0.20,
    'signal_quality': 0.20
}
```

### 4.2 Global Score Calculation

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

## 5. Entity Extraction (CRITICAL for Layer 2)

### 5.1 Skill Extraction

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

## 6. Weakness Detection

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

## 7. Validation Rules

### 7.1 Input Validation

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

### 7.2 Output Validation

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

## 8. Performance Requirements

### 8.1 Latency Targets

```
- Parsing: <500ms (p95)
- Scoring: <1s (p95)
- Entity Extraction: <500ms (p95)
- Total: <2s (p95)
```

### 8.2 Throughput

```
- Support 100 evaluations/second
- Handle 10,000 concurrent users
```

### 8.3 Caching

```python
# Cache evaluation results by content hash
cache_key = f"eval:{hash(resume_content)}:{version}"
ttl = 24 * 3600  # 24 hours

# Invalidation: Manual only (content changes)
```

---

## 9. Error Handling

### 9.1 Parsing Failures

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

## 10. Testing Requirements

### 10.1 Unit Tests

```python
test('calculate_global_score: correct weighting')
test('extract_skills: normalizes variants')
test('extract_tools: detects patterns')
test('identify_weaknesses: correct codes')
test('validate_output: catches range violations')
```

### 10.2 Integration Tests

```python
test('evaluate: returns complete contract')
test('evaluate: extracted fields match Layer 2 needs')
test('evaluate: scores stored correctly in Layer 4')
```

### 10.3 Golden Tests

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

---

## 11. Edge Cases

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

**Version:** 2.0  
**Status:** Ready for Implementation  
**Next:** Implement + integrate with Layer 2 & Layer 4
