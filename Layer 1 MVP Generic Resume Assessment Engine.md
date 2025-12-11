# Layer 1 MVP: Generic Resume Assessment Engine
## Complete Specification Document

---

## 1. Executive Summary

### 1.1 Purpose
Layer 1 MVP provides a **job-agnostic assessment** of a candidate's professional profile. Unlike traditional resume scoring tools that evaluate fit for a specific job posting, this engine measures the candidate's overall "Career Capital" - their accumulated skills, experience, learning trajectory, and professional presentation quality.

### 1.2 Scope
**What it does:**
- Analyzes resume without requiring a job description
- Produces multi-dimensional scores (0-100 for each dimension)
- Provides actionable feedback for improvement
- Classifies overall quality level (Early/Growing/Solid/Strong)
- Identifies critical gaps and quick wins

**What it does NOT do (MVP limitations):**
- ❌ Trajectory Momentum analysis (Post-MVP)
- ❌ Coherence & Focus entropy calculation (Post-MVP)
- ❌ External Validation scoring (Post-MVP)
- ❌ Density Score calculation (Post-MVP)
- ❌ Advanced Profile Type classification (Post-MVP)
- ❌ Industry-specific calibration (Post-MVP)
- ❌ ML-based predictions (Post-MVP)

### 1.3 Key Design Principles
1. **Simplicity**: Use straightforward algorithms that are explainable
2. **Actionability**: Every score must translate to specific improvements
3. **Fairness**: Avoid penalizing career changers, self-taught developers, or non-traditional paths excessively
4. **Extensibility**: Architecture allows adding advanced features post-MVP
5. **Speed**: Processing time < 5 seconds per resume

---

## 2. Architecture Overview

### 2.1 High-Level Flow

```
┌─────────────────┐
│  Resume Input   │
│  (PDF/DOCX/TXT) │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────┐
│  Resume Parser              │
│  - Extract structure        │
│  - Normalize data           │
│  - Build timeline           │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────┐
│  Parallel Dimension Scoring                 │
│  ┌─────────────┐  ┌──────────────────────┐ │
│  │Skill Capital│  │Execution Impact      │ │
│  └─────────────┘  └──────────────────────┘ │
│  ┌─────────────┐  ┌──────────────────────┐ │
│  │Learning &   │  │Signal Quality        │ │
│  │Adaptivity   │  └──────────────────────┘ │
│  └─────────────┘                            │
└────────┬────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│  Score Aggregation          │
│  - Apply weights            │
│  - Apply modifiers          │
│  - Calculate global score   │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│  Feedback Generation        │
│  - Identify gaps            │
│  - Suggest improvements     │
│  - Prioritize actions       │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│  Structured Output          │
│  - Scores                   │
│  - Level                    │
│  - Recommendations          │
└─────────────────────────────┘
```

### 2.2 Dependencies
- **Resume Parser**: Python-based (pyresparser, spaCy) or commercial API (Affinda, Sovren)
- **NLP**: Basic keyword extraction, no advanced ML required for MVP
- **Database**: Store parsed resumes for caching (optional for MVP)
- **API**: Claude/GPT for text analysis (optional enhancement)

### 2.3 Processing Time Budget
- Resume parsing: 1-2 seconds
- Dimension calculations: 1-2 seconds
- Feedback generation: 1 second
- **Total: < 5 seconds**

---

## 3. Core Dimensions

### 3.1 Skill Capital (Simplified)

#### 3.1.1 Definition
Measures the **breadth and basic depth** of technical and professional skills listed on the resume. For MVP, we use a simplified calculation based on skill count and basic categorization.

#### 3.1.2 Input Requirements
From resume:
- List of skills (extracted from "Skills" section or mentioned in experience descriptions)
- Years of experience per skill (optional, inferred from timeline if available)

#### 3.1.3 Formula

```python
def calculate_skill_capital_mvp(skills: List[str], total_years: int) -> Dict:
    """
    Simplified Skill Capital for MVP

    Args:
        skills: List of skill names (normalized)
        total_years: Total years of professional experience

    Returns:
        Dict with score, flags, and breakdown
    """

    # Step 1: Count unique skills
    unique_skills = deduplicate_skills(skills)
    skill_count = len(unique_skills)

    flags = []

    # Step 2: Breadth Score (0-100)
    # Logarithmic scaling to avoid rewarding spam
    # Sweet spot: 10-20 skills
    if skill_count == 0:
        breadth = 0
    else:
        # log(1 + count) / log(1 + 30) where 30 is reasonable max
        breadth = min(100, (math.log(1 + skill_count) / math.log(1 + 30)) * 100)

    # Step 3: Depth proxy (simplified)
    # Assume depth correlates with years of experience
    # 0-2 years = beginner (0.5x)
    # 3-5 years = intermediate (0.8x)
    # 5+ years = advanced (1.0x)
    if total_years <= 2:
        depth_factor = 0.5
    elif total_years <= 5:
        depth_factor = 0.8
    else:
        depth_factor = 1.0

    # Step 4: Combine with improved clarity
    # Calculate component scores
    breadth_score = breadth  # 0-100
    depth_score = depth_factor * 100  # 50/80/100 based on years

    # Combine: 60% breadth, 40% depth
    skill_capital = (0.6 * breadth_score) + (0.4 * depth_score)

    final_score = round(skill_capital, 1)

    return {
        'score': final_score,
        'flags': flags,
        'breakdown': {
            'breadth': round(breadth, 1),
            'depth_factor': depth_factor,
            'skill_count': skill_count
        }
    }
```

#### 3.1.4 Detailed Algorithm

```python
# Normalization
def normalize_skill(raw_skill: str) -> str:
    """
    Normalize skill names to canonical form
    
    Examples:
        "js" -> "JavaScript"
        "react.js" -> "React"
        "postgre" -> "PostgreSQL"
    """
    skill_map = {
        'js': 'JavaScript',
        'javascript': 'JavaScript',
        'react.js': 'React',
        'reactjs': 'React',
        'node': 'Node.js',
        'nodejs': 'Node.js',
        'postgre': 'PostgreSQL',
        'postgresql': 'PostgreSQL',
        'postgres': 'PostgreSQL',
        # ... comprehensive mapping
    }
    
    clean = raw_skill.lower().strip()
    return skill_map.get(clean, raw_skill.title())

# Deduplication
def deduplicate_skills(skills: List[str]) -> List[str]:
    """
    Remove duplicates after normalization
    """
    normalized = [normalize_skill(s) for s in skills]
    return list(set(normalized))

# Categorization (optional for MVP but useful)
def categorize_skill(skill: str) -> str:
    """
    Categorize into: programming, framework, database, cloud, etc.
    Helps identify if resume is too narrow or scattered
    """
    categories = {
        'programming': ['Python', 'JavaScript', 'Java', 'C++', 'Go', 'Ruby'],
        'framework': ['React', 'Django', 'Flask', 'Spring', 'Rails'],
        'database': ['PostgreSQL', 'MongoDB', 'MySQL', 'Redis'],
        'cloud': ['AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes'],
        'tools': ['Git', 'Jira', 'Jenkins', 'Terraform'],
    }
    
    for category, skill_list in categories.items():
        if skill in skill_list:
            return category
    
    return 'other'
```

#### 3.1.5 Scoring Range Breakdown

| Skill Count | Breadth Score | With Depth Factor (5+ years) | Interpretation |
|-------------|---------------|------------------------------|----------------|
| 0 | 0 | 0 | No skills listed |
| 3 | 35 | 35 | Very limited |
| 5 | 48 | 48 | Beginner |
| 10 | 68 | 68 | Decent breadth |
| 15 | 80 | 80 | Good breadth |
| 20 | 87 | 87 | Strong breadth |
| 30 | 100 | 100 | Excellent breadth |
| 50+ | 100 | 100 | Capped (spam protection) |

**With depth adjustment (0-2 years experience):**
- 10 skills → 68 * 0.72 = 49 (Breadth good but depth lacking)
- 15 skills → 80 * 0.72 = 58

#### 3.1.6 Edge Cases

**Case 1: No skills section**
```python
if skill_count == 0:
    return {
        'score': 0,
        'flag': 'NO_SKILLS_LISTED',
        'message': 'No skills found. Add a dedicated Skills section.'
    }
```

**Case 2: Suspiciously high count (>40) - Cascading Penalty Floor**
```python
if skill_count > 40:
    # Likely keyword stuffing - apply penalties with floor
    penalties = []

    if skill_count > 40:
        penalties.append(0.7)

    recognized_count = count_recognized_skills(skills)
    if recognized_count / skill_count < 0.5:
        penalties.append(0.8)

    generic_count = count_generic(skills)
    if generic_count / skill_count > 0.3:
        penalties.append(0.85)

    # Calculate total penalty with minimum floor
    total_penalty = 1.0
    for p in penalties:
        total_penalty *= p
    total_penalty = max(total_penalty, 0.4)  # Floor at 40%

    final_score = base_score * total_penalty

    return {
        'score': final_score,
        'flag': 'POSSIBLE_SPAM',
        'message': 'Too many skills listed. Focus on 10-20 core competencies.'
    }
```

**Case 3: All skills unrecognized**
```python
recognized_count = count_recognized_skills(skills)
if recognized_count / skill_count < 0.5:
    return {
        'score': base_score * 0.8,  # 20% penalty
        'flag': 'UNRECOGNIZED_SKILLS',
        'message': 'Many skills not recognized. Use industry-standard terms.'
    }
```

**Case 4: Skills too generic**
```python
generic_skills = ['Microsoft Office', 'Email', 'Internet', 'Computer']
generic_count = count_generic(skills)

if generic_count / skill_count > 0.3:
    penalty = 0.85
    message = 'Replace generic skills with specific technical competencies.'
```

#### 3.1.7 Example Calculations

**Example A: Junior Developer**
```python
Input:
  skills = ['Python', 'Django', 'PostgreSQL', 'Git', 'HTML']
  total_years = 1

Calculation:
  unique_skills = 5
  breadth = log(6)/log(31) * 100 = 48.2
  depth_factor = 0.5 (0-2 years)
  
  skill_capital = 0.6 * 48.2 + 0.4 * 48.2 * 0.5
                = 28.9 + 9.6
                = 38.5

Output: 38.5/100
Interpretation: Limited skills, junior level
```

**Example B: Mid-Level Engineer**
```python
Input:
  skills = ['Python', 'Django', 'Flask', 'PostgreSQL', 'MongoDB', 
            'Redis', 'Docker', 'AWS', 'React', 'JavaScript', 
            'Git', 'CI/CD', 'REST API']
  total_years = 4

Calculation:
  unique_skills = 13
  breadth = log(14)/log(31) * 100 = 74.6
  depth_factor = 0.8 (3-5 years)
  
  skill_capital = 0.6 * 74.6 + 0.4 * 74.6 * 0.8
                = 44.8 + 23.9
                = 68.7

Output: 68.7/100
Interpretation: Good skill breadth, developing depth
```

**Example C: Senior Engineer**
```python
Input:
  skills = ['Python', 'Django', 'Flask', 'FastAPI', 'PostgreSQL', 
            'MongoDB', 'Redis', 'Elasticsearch', 'Docker', 'Kubernetes',
            'AWS', 'Terraform', 'React', 'TypeScript', 'GraphQL',
            'Microservices', 'REST API', 'gRPC', 'RabbitMQ', 'Kafka']
  total_years = 8

Calculation:
  unique_skills = 20
  breadth = log(21)/log(31) * 100 = 87.3
  depth_factor = 1.0 (5+ years)
  
  skill_capital = 0.6 * 87.3 + 0.4 * 87.3 * 1.0
                = 52.4 + 34.9
                = 87.3

Output: 87.3/100
Interpretation: Excellent skill breadth and depth
```

**Example D: Scattered Resume (Spam)**
```python
Input:
  skills = [50+ random skills including 'Blockchain', 'AI', 'ML', 
            'Quantum Computing', 'IoT', ... plus 10 generic ones]
  total_years = 3

Calculation:
  unique_skills = 50
  breadth = 100 (capped)
  depth_factor = 0.8
  base = 0.6 * 100 + 0.4 * 100 * 0.8 = 92
  
  # But apply spam penalty
  spam_penalty = 0.7
  
  skill_capital = 92 * 0.7 = 64.4

Output: 64.4/100 with POSSIBLE_SPAM flag
Interpretation: Quantity over quality, lacks focus
```

---

### 3.2 Execution Impact

#### 3.2.1 Definition
Measures **tangible work output and impact** through evidence of real projects, quantified achievements, and ownership demonstrated in work experience descriptions.

**Note on Metrics vs Signal Quality:**
- Execution Impact measures: "Did you achieve concrete results?"
- Signal Quality/Evidence measures: "Did you document those results well?"
- Some overlap is intentional - both dimensions matter independently.

#### 3.2.2 Input Requirements
From resume:
- Work experience bullet points
- Project descriptions
- Achievement statements

#### 3.2.3 Formula

```python
def calculate_execution_impact(experiences: List[Experience]) -> Dict:
    """
    Execution Impact Score based on concrete evidence

    Args:
        experiences: List of work experiences with bullet points

    Returns:
        Dict with score, flags, and breakdown
    """

    # Counters for different signals
    metrics_count = 0
    action_verbs_count = 0
    ownership_signals = 0
    total_bullets = 0
    generic_count = 0

    # Strong action verbs indicating execution
    strong_verbs = [
        'built', 'designed', 'implemented', 'developed', 'created',
        'launched', 'shipped', 'delivered', 'architected', 'engineered',
        'optimized', 'improved', 'reduced', 'increased', 'automated'
    ]

    # Ownership signals
    ownership_keywords = [
        'led', 'owned', 'managed', 'directed', 'coordinated',
        'drove', 'spearheaded', 'initiated', 'founded'
    ]

    # Generic phrases to flag
    generic_phrases = ['responsible for', 'worked on', 'assisted with', 'involved in']

    # Scan all bullets
    for exp in experiences:
        for bullet in exp.bullets:
            total_bullets += 1
            text = bullet.lower()

            # Check for metrics (numbers, %, x, k, m, etc.)
            if has_metrics(text):
                metrics_count += 1

            # Check for strong action verbs
            if any(verb in text for verb in strong_verbs):
                action_verbs_count += 1

            # Check for ownership signals
            if any(keyword in text for keyword in ownership_keywords):
                ownership_signals += 1

            # Check for generic phrases
            if any(phrase in text for phrase in generic_phrases):
                generic_count += 1

    # Handle edge cases
    score_raw = 0
    penalty_factor = 1.0
    flags = []

    # Edge case: No bullets/experience
    if total_bullets == 0:
        return {
            'score': 0,
            'flags': ['NO_EXPERIENCE'],
            'breakdown': {
                'metrics_ratio': 0,
                'action_ratio': 0,
                'ownership_ratio': 0
            }
        }

    # Metrics ratio (0-1)
    metrics_ratio = min(metrics_count / max(total_bullets * 0.5, 1), 1)

    # Action verbs ratio (0-1)
    action_ratio = min(action_verbs_count / total_bullets, 1)

    # Ownership ratio (0-1)
    ownership_ratio = min(ownership_signals / max(total_bullets * 0.3, 1), 1)

    # Combine with weights
    score_raw = (
        0.40 * metrics_ratio * 100 +      # Metrics most important
        0.35 * action_ratio * 100 +       # Action verbs
        0.25 * ownership_ratio * 100      # Ownership
    )

    # Apply edge case penalties
    if generic_count / total_bullets > 0.7:
        penalty_factor *= 0.6
        flags.append('GENERIC_DESCRIPTIONS')

    if metrics_count == 0 and total_bullets > 3:
        score_raw = min(score_raw, 40)
        flags.append('NO_METRICS')

    final_score = round(score_raw * penalty_factor, 1)

    return {
        'score': final_score,
        'flags': flags,
        'breakdown': {
            'metrics_ratio': round(metrics_ratio, 2),
            'action_ratio': round(action_ratio, 2),
            'ownership_ratio': round(ownership_ratio, 2)
        }
    }


def has_metrics(text: str) -> bool:
    """
    Detect if text contains quantified metrics
    
    Patterns:
        - "20%", "50%"
        - "2x", "3x faster"
        - "100K users", "1M requests"
        - "$500K revenue"
        - "reduced from 2hr to 30min"
    """
    import re
    
    patterns = [
        r'\d+\s*%',                    # 20%
        r'\d+x\b',                     # 2x
        r'\d+[KMB]\b',                 # 100K, 1M, 5B
        r'\$\d+[KMB]?',                # $500K
        r'\d+\s*(users|requests|customers|clients)',  # 100 users
        r'(from|to)\s+\d+',            # from 100 to 50
        r'\d+\s*(hours?|minutes?|seconds?|days?)',    # 2 hours
    ]
    
    return any(re.search(pattern, text, re.IGNORECASE) for pattern in patterns)
```

#### 3.2.4 Detailed Algorithm

```python
class Experience:
    """Structured work experience"""
    def __init__(self):
        self.title: str
        self.company: str
        self.start_date: str
        self.end_date: str
        self.bullets: List[str]
        self.duration_months: int

def parse_experiences(resume_text: str) -> List[Experience]:
    """
    Extract work experiences from resume
    Uses resume parser output
    """
    # Implementation depends on parser library
    # Returns structured list of experiences
    pass

def analyze_bullet_quality(bullet: str) -> Dict:
    """
    Deep analysis of a single bullet point
    
    Returns:
        {
            'has_metric': bool,
            'has_action_verb': bool,
            'has_ownership': bool,
            'has_context': bool,  # team size, scope
            'has_outcome': bool,  # result of action
            'quality_score': 0-5
        }
    """
    result = {
        'has_metric': False,
        'has_action_verb': False,
        'has_ownership': False,
        'has_context': False,
        'has_outcome': False,
        'quality_score': 0
    }
    
    text = bullet.lower()
    
    # Check metrics
    if has_metrics(text):
        result['has_metric'] = True
        result['quality_score'] += 2
    
    # Check action verbs
    strong_verbs = ['built', 'designed', 'implemented', ...]
    if any(verb in text for verb in strong_verbs):
        result['has_action_verb'] = True
        result['quality_score'] += 1
    
    # Check ownership
    ownership_keywords = ['led', 'owned', 'managed', ...]
    if any(kw in text for kw in ownership_keywords):
        result['has_ownership'] = True
        result['quality_score'] += 1
    
    # Check for context (team, users, scale)
    context_patterns = [
        r'team of \d+',
        r'\d+\s*(users|customers|clients)',
        r'across \d+ (countries|regions)',
    ]
    if any(re.search(p, text) for p in context_patterns):
        result['has_context'] = True
        result['quality_score'] += 0.5
    
    # Check for outcome
    outcome_keywords = ['resulting in', 'leading to', 'enabling', 'improving']
    if any(kw in text for kw in outcome_keywords):
        result['has_outcome'] = True
        result['quality_score'] += 0.5
    
    return result
```

#### 3.2.5 Scoring Range Breakdown

| Metrics Ratio | Action Ratio | Ownership Ratio | Final Score | Interpretation |
|---------------|--------------|-----------------|-------------|----------------|
| 0% | 20% | 0% | 7 | Weak - mostly responsibilities |
| 20% | 50% | 10% | 35 | Poor - few concrete achievements |
| 40% | 70% | 20% | 58 | Fair - some quantified work |
| 60% | 85% | 40% | 75 | Good - clear impact shown |
| 80% | 95% | 60% | 88 | Strong - excellent evidence |
| 100% | 100% | 80% | 96 | Exceptional - every bullet counts |

#### 3.2.6 Edge Cases

**Case 1: No work experience**
```python
if len(experiences) == 0:
    return {
        'score': 0,
        'flag': 'NO_EXPERIENCE',
        'message': 'No work experience listed. Add internships or projects.'
    }
```

**Case 2: All bullets are generic responsibilities**
```python
# "Responsible for...", "Worked on...", "Assisted with..."
generic_phrases = ['responsible for', 'worked on', 'assisted with', 'involved in']

generic_count = sum(1 for bullet in all_bullets 
                   if any(phrase in bullet.lower() for phrase in generic_phrases))

if generic_count / total_bullets > 0.7:
    return {
        'score': base_score * 0.6,  # 40% penalty
        'flag': 'GENERIC_DESCRIPTIONS',
        'message': 'Replace responsibilities with accomplishments and results.'
    }
```

**Case 3: No metrics anywhere**
```python
if metrics_count == 0 and total_bullets > 3:
    return {
        'score': min(base_score, 40),  # Cap at 40
        'flag': 'NO_METRICS',
        'message': 'Add quantified achievements (%, numbers, time saved, etc.)'
    }
```

**Case 4: Too short bullets**
```python
avg_bullet_length = sum(len(b) for b in all_bullets) / len(all_bullets)

if avg_bullet_length < 30:  # Less than 30 chars average
    penalty = 0.85
    message = 'Expand bullets with more context and impact.'
```

#### 3.2.7 Example Calculations

**Example A: Junior with Weak Descriptions**
```python
Input:
  Experience: Backend Developer (1 year)
  Bullets:
    - "Worked on backend development"
    - "Responsible for API maintenance"
    - "Assisted with database tasks"
    - "Participated in team meetings"

Analysis:
  total_bullets = 4
  metrics_count = 0
  action_verbs = 0
  ownership = 0
  
  metrics_ratio = 0/2 = 0
  action_ratio = 0/4 = 0
  ownership_ratio = 0/1.2 = 0
  
  execution_impact = 0.40*0 + 0.35*0 + 0.25*0 = 0

Output: 0/100 with GENERIC_DESCRIPTIONS flag
Interpretation: No concrete achievements shown
```

**Example B: Mid-Level with Some Metrics**
```python
Input:
  Experience: Software Engineer (3 years)
  Bullets:
    - "Built REST API serving 50K daily requests"
    - "Implemented caching layer reducing latency by 40%"
    - "Developed user dashboard with React"
    - "Fixed bugs and improved code quality"
    - "Worked with team on microservices architecture"

Analysis:
  total_bullets = 5
  metrics_count = 2 (50K requests, 40% reduction)
  action_verbs = 3 (built, implemented, developed)
  ownership = 0
  
  metrics_ratio = 2/2.5 = 0.8
  action_ratio = 3/5 = 0.6
  ownership_ratio = 0/1.5 = 0
  
  execution_impact = 0.40*80 + 0.35*60 + 0.25*0
                   = 32 + 21 + 0 = 53

Output: 53/100
Interpretation: Good technical work, lacks leadership signals
```

**Example C: Senior with Strong Impact**
```python
Input:
  Experience: Senior Backend Engineer (5 years)
  Bullets:
    - "Led development of payment processing system handling $2M daily transactions"
    - "Architected microservices infrastructure reducing deployment time from 2hr to 15min"
    - "Optimized database queries improving response time by 65%"
    - "Mentored 3 junior engineers and conducted code reviews"
    - "Drove adoption of CI/CD pipeline across 5 teams"
    - "Designed and implemented monitoring system reducing downtime by 80%"

Analysis:
  total_bullets = 6
  metrics_count = 5 ($2M, 2hr→15min, 65%, 3 engineers, 80%)
  action_verbs = 6 (led, architected, optimized, mentored, drove, designed)
  ownership = 3 (led, drove, mentored)
  
  metrics_ratio = 5/3 = 1.0 (capped)
  action_ratio = 6/6 = 1.0
  ownership_ratio = 3/1.8 = 1.0 (capped)
  
  execution_impact = 0.40*100 + 0.35*100 + 0.25*100
                   = 40 + 35 + 25 = 100

Output: 100/100
Interpretation: Exceptional - clear impact and leadership
```

**Example D: Career Changer with Projects**
```python
Input:
  Experience: Junior Developer (6 months, career change from marketing)
  Bullets:
    - "Built 3 full-stack web applications using MERN stack"
    - "Implemented authentication system with JWT and OAuth"
    - "Created automated testing suite with 85% code coverage"
    - "Deployed applications to AWS with CI/CD pipeline"

Analysis:
  total_bullets = 4
  metrics_count = 2 (3 applications, 85% coverage)
  action_verbs = 4 (built, implemented, created, deployed)
  ownership = 0
  
  metrics_ratio = 2/2 = 1.0
  action_ratio = 4/4 = 1.0
  ownership_ratio = 0/1.2 = 0
  
  execution_impact = 0.40*100 + 0.35*100 + 0.25*0
                   = 40 + 35 + 0 = 75

Output: 75/100
Interpretation: Strong execution despite short experience
```

---

### 3.3 Learning & Adaptivity

#### 3.3.1 Definition
Measures **continuous learning habits and adaptability** through evidence of courses, certifications, self-learning projects, and technology evolution over time.

#### 3.3.2 Input Requirements
From resume:
- Courses and certifications
- Personal/side projects
- Technology stack timeline (what tech used when)
- Education section
- Online profiles (GitHub, portfolio links)

#### 3.3.3 Formula

```python
def calculate_learning_adaptivity(profile: Profile) -> Dict:
    """
    Learning & Adaptivity Score

    Args:
        profile: Complete profile with learning indicators

    Returns:
        Dict with score, flags, and breakdown
    """

    flags = []

    # Component 1: Formal Learning (courses, certifications)
    courses_score = score_courses(profile.courses, profile.certifications)

    # Component 2: Self-Learning (projects, GitHub)
    self_learning_score = score_self_learning(
        profile.personal_projects,
        profile.github_activity
    )

    # Component 3: Tech Evolution (learning new tech over time)
    tech_evolution_score = score_tech_evolution(
        profile.tech_timeline,
        profile.total_years
    )

    # Combine with weights
    learning_adaptivity = (
        0.30 * courses_score +
        0.40 * self_learning_score +
        0.30 * tech_evolution_score
    )

    # Penalty for stagnation
    if tech_evolution_score < 20:
        stagnation_penalty = 0.8
        learning_adaptivity *= stagnation_penalty
        flags.append('STAGNANT')

    final_score = round(learning_adaptivity, 1)

    return {
        'score': final_score,
        'flags': flags,
        'breakdown': {
            'courses_score': round(courses_score, 1),
            'self_learning_score': round(self_learning_score, 1),
            'tech_evolution_score': round(tech_evolution_score, 1)
        }
    }


def score_courses(courses: List[Course], certs: List[Certification]) -> float:
    """
    Score formal learning

    Courses/certifications in last 3 years count more
    Quality matters (verified, recognized institutions)
    """
    import datetime
    recent_threshold = 3  # years
    current_year = datetime.date.today().year

    recent_courses = [c for c in courses
                     if current_year - c.year <= recent_threshold]
    recent_certs = [c for c in certs
                   if current_year - c.year <= recent_threshold]
    
    # Count with diminishing returns
    course_value = min(len(recent_courses), 5) / 5  # Cap at 5
    cert_value = min(len(recent_certs), 3) / 3      # Cap at 3
    
    # Quality bonus for recognized certifications
    recognized = ['AWS', 'GCP', 'Azure', 'Kubernetes', 'PMP', 'Scrum']
    quality_bonus = sum(0.1 for cert in recent_certs 
                       if any(r in cert.name for r in recognized))
    
    score = ((course_value * 0.6 + cert_value * 0.4) + quality_bonus) * 100
    return min(score, 100)


def score_self_learning(projects: List[Project], github: GitHubProfile) -> float:
    """
    Score self-directed learning
    
    Personal projects show initiative
    GitHub activity shows ongoing learning
    """
    # Projects
    project_count = len(projects)
    project_value = min(project_count, 5) / 5  # Cap at 5
    
    # GitHub (if available)
    github_value = 0
    if github:
        # Contributions in last year
        recent_commits = github.commits_last_year
        github_value = min(recent_commits / 100, 1)  # Cap at 100 commits
    
    score = (0.7 * project_value + 0.3 * github_value) * 100
    return score


def score_tech_evolution(tech_timeline: List[TechEvent], total_years: int) -> float:
    """
    Score technology learning over time

    TechEvent: { year: int, tech_name: str, action: 'started' }

    Measures:
    - How many new technologies learned over time
    - Recency of learning (last 3 years weighted more)
    - Frequency (learning pace)
    """
    import datetime
    current_year = datetime.date.today().year

    if total_years == 0:
        return 50  # Neutral for fresh grads

    # Count new tech introductions
    recent_tech = [t for t in tech_timeline if current_year - t.year <= 3]
    older_tech = [t for t in tech_timeline if current_year - t.year > 3]
    
    # Recent learning is more valuable
    recent_value = min(len(recent_tech), 5) / 5  # Cap at 5
    historical_value = min(len(older_tech), 10) / 10  # Cap at 10
    
    # Learning pace (techs per year)
    pace = len(tech_timeline) / max(total_years, 1)
    pace_value = min(pace / 2, 1)  # Cap at 2 techs/year
    
    score = (0.5 * recent_value + 0.2 * historical_value + 0.3 * pace_value) * 100
    
    return score
```

#### 3.3.4 Detailed Algorithm

```python
class Course:
    """Structured course data"""
    def __init__(self):
        self.name: str
        self.institution: str
        self.year: int
        self.verified: bool  # Has certificate?

class Certification:
    """Professional certification"""
    def __init__(self):
        self.name: str
        self.issuer: str
        self.year: int
        self.expiry: Optional[int]

class Project:
    """Personal/side project"""
    def __init__(self):
        self.name: str
        self.description: str
        self.technologies: List[str]
        self.year: int
        self.has_link: bool  # GitHub, live demo

class TechEvent:
    """Technology learning event"""
    def __init__(self):
        self.year: int
        self.tech_name: str
        self.action: str  # 'started', 'mastered'
        self.source: str  # 'job', 'course', 'project'

def extract_tech_timeline(experiences: List[Experience]) -> List[TechEvent]:
    """
    Build timeline of when technologies were learned
    
    Logic:
    - First mention of a tech = learning event
    - Look at job start dates
    - Look at project dates
    - Look at course dates
    """
    timeline = []
    seen_techs = set()
    
    # Sort experiences by date
    sorted_exp = sorted(experiences, key=lambda e: e.start_date)
    
    for exp in sorted_exp:
        # Extract techs from this experience
        techs = extract_technologies(exp.description + ' '.join(exp.bullets))
        
        for tech in techs:
            if tech not in seen_techs:
                timeline.append(TechEvent(
                    year=exp.start_year,
                    tech_name=tech,
                    action='started',
                    source='job'
                ))
                seen_techs.add(tech)
    
    return timeline

def extract_technologies(text: str) -> List[str]:
    """
    Extract technology names from text
    
    Uses keyword matching against known tech list
    """
    tech_keywords = [
        'Python', 'JavaScript', 'Java', 'C++', 'Go', 'Rust',
        'React', 'Vue', 'Angular', 'Django', 'Flask', 'Spring',
        'PostgreSQL', 'MongoDB', 'MySQL', 'Redis',
        'Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP',
        # ... comprehensive list
    ]
    
    found = []
    text_lower = text.lower()
    
    for tech in tech_keywords:
        if tech.lower() in text_lower:
            found.append(tech)
    
    return found
```

#### 3.3.5 Scoring Range Breakdown

| Courses (3yr) | Projects | New Tech (3yr) | Final Score | Interpretation |
|---------------|----------|----------------|-------------|----------------|
| 0 | 0 | 0 | 10 | Stagnant - no learning signals |
| 1 | 1 | 1 | 35 | Minimal - some learning |
| 2 | 2 | 2 | 55 | Moderate - steady learning |
| 3 | 3 | 3 | 70 | Good - active learner |
| 4 | 4 | 4 | 82 | Strong - continuous growth |
| 5+ | 5+ | 5+ | 92 | Exceptional - rapid learner |

#### 3.3.6 Edge Cases

**Case 1: Fresh graduate with no work experience**
```python
if total_years == 0:
    # Base score on education + projects
    education_bonus = 0.3 if has_bachelor else 0
    project_bonus = min(len(projects) * 0.15, 0.5)
    
    score = (education_bonus + project_bonus) * 100
    return max(score, 40)  # Minimum 40 for fresh grads
```

**Case 2: No learning in last 3 years**
```python
if len(recent_tech) == 0 and len(recent_courses) == 0:
    return {
        'score': base_score * 0.8,  # 20% penalty
        'flag': 'STAGNANT',
        'message': 'No new skills or learning in recent years. Consider upskilling.'
    }
```

**Case 3: Only lists mandatory workplace training**
```python
# Filter out generic workplace courses
generic_courses = ['Safety Training', 'Ethics', 'Compliance', 'Sexual Harassment']

relevant_courses = [c for c in courses 
                   if not any(g in c.name for g in generic_courses)]

if len(relevant_courses) == 0:
    penalty = 0.5
    message = 'Add technical courses or certifications relevant to your field.'
```

**Case 4: Unrealistic number of certifications**
```python
if len(certifications) > 15:
    # Likely padding or irrelevant certs
    penalty = 0.8
    message = 'Focus on 3-5 most relevant and recognized certifications.'
```

#### 3.3.7 Example Calculations

**Example A: Stagnant Developer**
```python
Input:
  total_years = 7
  courses = []  # None in last 3 years
  certifications = []
  personal_projects = []
  tech_timeline = [
    {year: 2018, tech: 'Python'},
    {year: 2018, tech: 'Django'},
    {year: 2019, tech: 'PostgreSQL'}
  ]  # Nothing new since 2019

Analysis:
  courses_score = 0
  self_learning_score = 0
  
  recent_tech (last 3 years) = 0
  tech_evolution_score = (0.5*0 + 0.2*0.3 + 0.3*0.43)*100 = 19
  
  base = 0.30*0 + 0.40*0 + 0.30*19 = 5.7
  stagnation_penalty = 0.8
  
  learning_adaptivity = 5.7 * 0.8 = 4.6

Output: 5/100 with STAGNANT flag
Interpretation: No growth in recent years
```

**Example B: Active Learner**
```python
Input:
  total_years = 4
  courses = [
    {name: 'AWS Solutions Architect', year: 2024},
    {name: 'Kubernetes Fundamentals', year: 2023},
    {name: 'System Design', year: 2023}
  ]
  certifications = [
    {name: 'AWS Certified', year: 2024}
  ]
  personal_projects = [
    {name: 'E-commerce Platform', year: 2024},
    {name: 'Real-time Chat', year: 2023}
  ]
  tech_timeline includes 4 new techs in last 3 years

Analysis:
  courses_score = (3/5 * 0.6 + 1/3 * 0.4 + 0.1)*100 = 59.3
  self_learning_score = (0.7 * 2/5 + 0.3 * 0)*100 = 28
  tech_evolution_score = (0.5*0.8 + 0.2*0.3 + 0.3*1.0)*100 = 76
  
  learning_adaptivity = 0.30*59.3 + 0.40*28 + 0.30*76
                      = 17.8 + 11.2 + 22.8 = 51.8

Output: 52/100
Interpretation: Good continuous learning
```

**Example C: Rapid Learner**
```python
Input:
  total_years = 2
  courses = [
    {name: 'Full Stack Bootcamp', year: 2024},
    {name: 'React Advanced', year: 2024},
    {name: 'Node.js Mastery', year: 2023},
    {name: 'Docker & Kubernetes', year: 2023}
  ]
  certifications = [
    {name: 'AWS Cloud Practitioner', year: 2024},
    {name: 'MongoDB Developer', year: 2024}
  ]
  personal_projects = 5 projects
  tech_timeline: learned 6 new techs in last 2 years

Analysis:
  courses_score = (4/5 * 0.6 + 2/3 * 0.4 + 0.2)*100 = 95.3 → capped at 100
  self_learning_score = (0.7 * 1.0 + 0.3 * 0)*100 = 70
  tech_evolution_score = (0.5*1.0 + 0.2*0 + 0.3*1.0)*100 = 80
  
  learning_adaptivity = 0.30*100 + 0.40*70 + 0.30*80
                      = 30 + 28 + 24 = 82

Output: 82/100
Interpretation: Exceptional learning velocity
```

**Example D: Career Changer**
```python
Input:
  total_years = 0.5 (6 months post-bootcamp)
  courses = [
    {name: 'Full Stack Bootcamp', year: 2024, duration: 3 months}
  ]
  certifications = []
  personal_projects = [
    {name: 'Portfolio Site', year: 2024},
    {name: 'Weather App', year: 2024},
    {name: 'Task Manager', year: 2024}
  ]
  tech_timeline: learned 8 techs in 6 months

Analysis:
  courses_score = (1/5 * 0.6 + 0/3 * 0.4)*100 = 12
  self_learning_score = (0.7 * 3/5 + 0.3 * 0)*100 = 42
  
  # For very short experience, adjust pace calculation
  pace = 8 / 0.5 = 16 techs/year → capped at 1.0
  tech_evolution_score = (0.5*1.0 + 0.2*0 + 0.3*1.0)*100 = 80
  
  learning_adaptivity = 0.30*12 + 0.40*42 + 0.30*80
                      = 3.6 + 16.8 + 24 = 44.4

Output: 44/100
Interpretation: High learning velocity despite short time
```

---

### 3.4 Signal Quality

#### 3.4.1 Definition
Measures **how well the candidate presents themselves** through resume structure, formatting, clarity, evidence quality (metrics, links), and professional polish. This is NOT about the person's actual capabilities, but about how effectively they communicate them.

#### 3.4.2 Input Requirements
From resume:
- Document structure and formatting
- Presence of key sections
- Grammar and writing quality
- Evidence quality (metrics, links, specificity)
- Professional presentation

#### 3.4.3 Formula

```python
def calculate_signal_quality(resume: Resume) -> float:
    """
    Signal Quality Score
    
    This is about presentation, not substance
    
    Args:
        resume: Parsed resume with metadata
    
    Returns:
        Score from 0-100
    """
    
    # Start with perfect score, deduct for issues
    score = 100
    issues = []
    
    # Component 1: Structure (20 points)
    structure_score, structure_issues = check_structure(resume)
    score -= (20 - structure_score)
    issues.extend(structure_issues)
    
    # Component 2: Formatting (15 points)
    format_score, format_issues = check_formatting(resume)
    score -= (15 - format_score)
    issues.extend(format_issues)
    
    # Component 3: Evidence Quality (30 points)
    evidence_score, evidence_issues = check_evidence(resume)
    score -= (30 - evidence_score)
    issues.extend(evidence_issues)
    
    # Component 4: Writing Quality (20 points)
    writing_score, writing_issues = check_writing(resume)
    score -= (20 - writing_score)
    issues.extend(writing_issues)
    
    # Component 5: Professional Polish (15 points)
    polish_score, polish_issues = check_polish(resume)
    score -= (15 - polish_score)
    issues.extend(polish_issues)
    
    return {
        'score': max(0, min(score, 100)),
        'issues': issues,
        'breakdown': {
            'structure': structure_score,
            'formatting': format_score,
            'evidence': evidence_score,
            'writing': writing_score,
            'polish': polish_score
        }
    }


def check_structure(resume: Resume) -> Tuple[int, List[str]]:
    """
    Check for standard sections and organization
    Max: 20 points
    """
    score = 20
    issues = []

    required_sections = ['experience', 'education', 'skills']
    optional_sections = ['summary', 'projects', 'certifications']

    # Check required sections (5 points each)
    for section in required_sections:
        if not resume.has_section(section):
            score -= 5
            issues.append(f"Missing {section} section")

    # Bonus for optional sections (2 points each, max 5)
    optional_present = sum(1 for s in optional_sections
                          if resume.has_section(s))
    score += min(optional_present * 2, 5)

    # Check section order (logical flow)
    if not resume.has_logical_order():
        score -= 3
        issues.append("Section order is unconventional")

    return (max(0, min(score, 20)), issues)


def check_formatting(resume: Resume) -> Tuple[int, List[str]]:
    """
    Check ATS compatibility and visual formatting
    Max: 15 points
    """
    score = 15
    issues = []

    # ATS compatibility checks
    if resume.has_tables:
        score -= 5
        issues.append("Contains tables - may break ATS parsing")

    if resume.has_images:
        score -= 3
        issues.append("Contains images - not ATS-friendly")

    if resume.has_complex_formatting:
        score -= 4
        issues.append("Complex formatting may cause parsing issues")

    # Length check
    if resume.page_count > 2:
        score -= 3
        issues.append(f"Resume is {resume.page_count} pages - aim for 1-2")

    # Font and margins
    if not resume.has_standard_font():
        score -= 2
        issues.append("Use standard fonts (Arial, Calibri, Times New Roman)")

    return (max(0, min(score, 15)), issues)


def check_evidence(resume: Resume) -> Tuple[int, List[str]]:
    """
    Check for concrete evidence and specificity
    Max: 30 points
    """
    score = 30
    issues = []
    
    # Metrics presence (10 points)
    bullets_with_metrics = count_bullets_with_metrics(resume)
    total_bullets = count_total_bullets(resume)
    
    if total_bullets > 0:
        metrics_ratio = bullets_with_metrics / total_bullets
        if metrics_ratio < 0.3:
            score -= 10
            issues.append("Only {:.0%} of bullets have metrics - aim for 50%+".format(metrics_ratio))
        elif metrics_ratio < 0.5:
            score -= 5
    
    # Links presence (10 points)
    if not resume.has_linkedin:
        score -= 3
        issues.append("Add LinkedIn profile URL")
    
    if not resume.has_github and is_tech_resume(resume):
        score -= 4
        issues.append("Add GitHub profile for technical roles")
    
    if not resume.has_portfolio_link:
        score -= 3
        issues.append("Consider adding portfolio or project links")
    
    # Specificity (10 points)
    vague_phrases = count_vague_phrases(resume)
    if vague_phrases > 5:
        score -= 7
        issues.append("Too many vague phrases ('various', 'multiple', 'many')")
    elif vague_phrases > 2:
        score -= 3

    return (max(0, min(score, 30)), issues)


def check_writing(resume: Resume) -> Tuple[int, List[str]]:
    """
    Check grammar, clarity, and professionalism
    Max: 20 points
    """
    score = 20
    issues = []

    # Grammar check (using basic NLP or grammar API)
    grammar_errors = count_grammar_errors(resume.text)
    if grammar_errors > 5:
        score -= 10
        issues.append(f"{grammar_errors} grammar errors detected")
    elif grammar_errors > 2:
        score -= 5

    # Bullet point consistency
    if not resume.has_consistent_bullets():
        score -= 3
        issues.append("Inconsistent bullet point format")

    # Tense consistency (past jobs = past tense)
    if not resume.has_correct_tenses():
        score -= 4
        issues.append("Incorrect verb tenses (use past tense for past roles)")

    # First-person pronouns (should not have "I", "me", "my")
    if resume.has_first_person():
        score -= 3
        issues.append("Remove first-person pronouns (I, me, my)")

    return (max(0, min(score, 20)), issues)


def check_polish(resume: Resume) -> Tuple[int, List[str]]:
    """
    Check professional presentation
    Max: 15 points
    """
    score = 15
    issues = []

    # Contact information
    if not resume.has_email:
        score -= 5
        issues.append("Missing email address")

    if not resume.has_phone:
        score -= 3
        issues.append("Missing phone number")

    # Professional email check
    if resume.email and not is_professional_email(resume.email):
        score -= 3
        issues.append("Use a professional email address")

    # Consistency
    if not resume.has_consistent_dates():
        score -= 2
        issues.append("Date formats are inconsistent")

    if not resume.has_consistent_styling():
        score -= 2
        issues.append("Inconsistent text styling (bold, italics)")

    return (max(0, min(score, 15)), issues)
```

#### 3.4.4 Helper Functions

```python
def count_bullets_with_metrics(resume: Resume) -> int:
    """Count how many bullets contain quantified metrics"""
    count = 0
    for exp in resume.experiences:
        for bullet in exp.bullets:
            if has_metrics(bullet):
                count += 1
    return count

def count_vague_phrases(resume: Resume) -> int:
    """Count vague/generic phrases"""
    vague = [
        'various', 'multiple', 'several', 'many', 'numerous',
        'etc', 'and more', 'among others',
        'responsible for', 'involved in', 'worked on'
    ]
    
    count = 0
    text = resume.text.lower()
    for phrase in vague:
        count += text.count(phrase)
    
    return count

def count_grammar_errors(text: str) -> int:
    """
    Grammar checking - MVP consideration:
    For initial version, return 0 or use simple heuristics
    due to performance concerns. Can enable post-MVP.
    """
    # MVP: Skip grammar check
    return 0

    # Post-MVP implementation:
    # import language_tool_python
    # tool = language_tool_python.LanguageTool('en-US')
    # matches = tool.check(text)
    #
    # # Filter out minor issues
    # serious_errors = [m for m in matches
    #                  if m.category in ['GRAMMAR', 'TYPOS']]
    #
    # return len(serious_errors)

def is_professional_email(email: str) -> bool:
    """Check if email looks professional"""
    unprofessional = [
        'hotmail', 'yahoo', 'aol', 'live.com',
        'sexy', 'cool', 'baby', 'love', '69', '420'
    ]
    
    email_lower = email.lower()
    
    # Red flags
    if any(word in email_lower for word in unprofessional[4:]):
        return False
    
    # Prefer Gmail or custom domain
    return True
```

#### 3.4.5 Scoring Range Breakdown

| Structure | Format | Evidence | Writing | Polish | Final | Interpretation |
|-----------|--------|----------|---------|--------|-------|----------------|
| 10/20 | 5/15 | 10/30 | 10/20 | 5/15 | 40 | Poor presentation |
| 15/20 | 12/15 | 18/30 | 15/20 | 12/15 | 72 | Decent |
| 20/20 | 15/15 | 25/30 | 18/20 | 15/15 | 93 | Excellent |

#### 3.4.6 Edge Cases

**Case 1: PDF not parseable**
```python
if not resume.is_parseable:
    return {
        'score': 20,
        'flag': 'PARSING_FAILED',
        'message': 'Resume format prevents analysis. Use simple text-based format.'
    }
```

**Case 2: Extremely short resume (<200 words)**
```python
if resume.word_count < 200:
    return {
        'score': 30,
        'flag': 'TOO_SHORT',
        'message': 'Resume is too brief. Add more detail about experience.'
    }
```

**Case 3: Keyword stuffing detected**
```python
unique_words = len(set(resume.text.split()))
total_words = len(resume.text.split())
diversity_ratio = unique_words / total_words

if diversity_ratio < 0.3:  # Too much repetition
    penalty = 0.7
    message = 'Excessive keyword repetition detected.'
```

#### 3.4.7 Example Calculations

**Example A: Poor Signal Quality**
```python
Input:
  - Missing education section
  - 4 pages long
  - Contains tables and images
  - No metrics in bullets
  - No links
  - 8 grammar errors
  - Inconsistent formatting

Analysis:
  structure = 15/20 (-5 for missing education)
  formatting = 3/15 (-5 tables, -3 images, -4 complex)
  evidence = 10/30 (-10 no metrics, -3 no linkedin, -4 no github, -3 no portfolio)
  writing = 10/20 (-10 for 8 grammar errors)
  polish = 10/15 (-3 unprofessional email, -2 inconsistent dates)
  
  total = 15 + 3 + 10 + 10 + 10 = 48

Output: 48/100
Interpretation: Significant presentation issues
```

**Example B: Good Signal Quality**
```python
Input:
  - All required sections present
  - 1.5 pages
  - Clean, simple formatting
  - 60% of bullets have metrics
  - LinkedIn and GitHub links present
  - 2 minor grammar issues
  - Consistent styling

Analysis:
  structure = 20/20 (all sections, good order)
  formatting = 15/15 (clean, ATS-friendly)
  evidence = 25/30 (-5 for metrics ratio <100%)
  writing = 15/20 (-5 for 2 grammar errors)
  polish = 15/15 (all good)
  
  total = 20 + 15 + 25 + 15 + 15 = 90

Output: 90/100
Interpretation: Excellent presentation
```

**Example C: Career Changer - Good Content, Weak Signal**
```python
Input:
  - All sections present
  - 2 pages
  - Simple formatting
  - Only 20% of bullets have metrics (new to field)
  - LinkedIn present, no GitHub
  - Perfect grammar
  - Professional

Analysis:
  structure = 20/20
  formatting = 15/15
  evidence = 13/30 (-10 low metrics, -4 no github, -3 no portfolio)
  writing = 20/20
  polish = 15/15
  
  total = 20 + 15 + 13 + 20 + 15 = 83

Output: 83/100
Interpretation: Good presentation, needs more evidence
```

---

## 4. Scoring Logic

### 4.1 Dimension Weights

```python
# MVP weights (simple, equal-ish distribution)
WEIGHTS = {
    'skill_capital': 0.30,
    'execution_impact': 0.30,
    'learning_adaptivity': 0.20,
    'signal_quality': 0.20
}

# Note: Signal quality acts as both a dimension AND a modifier
```

### 4.2 Global Score Calculation

```python
def calculate_global_score(dimensions: Dict[str, float]) -> Dict:
    """
    Calculate final global score from dimension scores
    
    Args:
        dimensions: {
            'skill_capital': 0-100,
            'execution_impact': 0-100,
            'learning_adaptivity': 0-100,
            'signal_quality': 0-100
        }
    
    Returns:
        {
            'global_score': 0-100,
            'level': 'Early'|'Growing'|'Solid'|'Strong',
            'breakdown': {...}
        }
    """
    
    # Step 1: Weighted sum of first 3 dimensions
    base_score = (
        dimensions['skill_capital'] * 0.30 +
        dimensions['execution_impact'] * 0.30 +
        dimensions['learning_adaptivity'] * 0.20 +
        dimensions['signal_quality'] * 0.20
    )
    
    # Step 2: Apply signal quality as modifier
    # Signal quality affects how much of your actual capability is visible
    signal_factor = calculate_signal_factor(dimensions['signal_quality'])
    
    adjusted_score = base_score * signal_factor
    
    # Step 3: Apply floor/ceiling based on flags
    final_score = apply_constraints(adjusted_score, dimensions)
    
    # Step 4: Determine level
    level = determine_level(final_score)
    
    return {
        'global_score': round(final_score, 1),
        'level': level,
        'breakdown': {
            'skill_capital': dimensions['skill_capital'],
            'execution_impact': dimensions['execution_impact'],
            'learning_adaptivity': dimensions['learning_adaptivity'],
            'signal_quality': dimensions['signal_quality']
        },
        'base_score': round(base_score, 1),
        'signal_factor': round(signal_factor, 2)
    }


def calculate_signal_factor(signal_quality: float) -> float:
    """
    Convert signal quality to modifier
    
    Poor presentation (< 40) → 0.90 (10% penalty)
    Average (40-80) → 1.00 (neutral)
    Excellent (> 80) → 1.05 (5% bonus)
    """
    if signal_quality < 40:
        return 0.90
    elif signal_quality > 80:
        return 1.05
    else:
        return 1.00


def apply_constraints(score: float, dimensions: Dict) -> float:
    """
    Apply hard caps based on dimension flags

    Configuration (can be moved to config file)
    """
    CONSTRAINTS = {
        'skill_capital_min': 25,
        'skill_capital_cap': 50,
        'execution_min': 20,
        'execution_cap': 55,
        'learning_min': 15,
        'learning_cap': 70
    }

    # If skill capital is very low, cap total score
    if dimensions['skill_capital'] < CONSTRAINTS['skill_capital_min']:
        score = min(score, CONSTRAINTS['skill_capital_cap'])

    # If execution impact is very low, cap total score
    if dimensions['execution_impact'] < CONSTRAINTS['execution_min']:
        score = min(score, CONSTRAINTS['execution_cap'])

    # If learning is stagnant but other scores high
    if dimensions['learning_adaptivity'] < CONSTRAINTS['learning_min'] and score > CONSTRAINTS['learning_cap']:
        score = min(score, CONSTRAINTS['learning_cap'])

    # Ensure 0-100 range
    return max(0, min(100, score))


def determine_level(score: float) -> str:
    """
    Map global score to level
    """
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

### 4.3 Complete Example Calculation

```python
# Example: Mid-level developer
dimensions = {
    'skill_capital': 68.7,        # Good breadth, developing depth
    'execution_impact': 53.0,     # Some metrics, no ownership
    'learning_adaptivity': 52.0,  # Moderate learning
    'signal_quality': 72.0        # Decent presentation
}

# Step 1: Base score
base = 68.7*0.30 + 53.0*0.30 + 52.0*0.20 + 72.0*0.20
     = 20.6 + 15.9 + 10.4 + 14.4
     = 61.3

# Step 2: Signal factor
signal_factor = 1.00  # (72 is in average range)

# Step 3: Adjusted
adjusted = 61.3 * 1.00 = 61.3

# Step 4: Constraints
# No constraints triggered

# Step 5: Level
level = 'Solid'  # (61.3 falls in 55-75 range)

Output:
{
    'global_score': 61.3,
    'level': 'Solid',
    'breakdown': {...},
    'base_score': 61.3,
    'signal_factor': 1.00
}
```

---

## 5. Input/Output Schema

### 5.1 Input Schema

```typescript
interface ResumeInput {
  // Raw resume file
  file: {
    content: Buffer | string;  // PDF, DOCX, or TXT
    filename: string;
    mimeType: string;
  };
  
  // Optional metadata (if available)
  metadata?: {
    totalYears: number;      // Total years of experience
    currentRole: string;     // Current job title
    targetIndustry?: string; // For context (optional for MVP)
  };
}

// After parsing, we get:
interface ParsedResume {
  // Personal info
  personal: {
    name: string;
    email: string;
    phone: string;
    location: string;
    linkedin?: string;
    github?: string;
    portfolio?: string;
  };
  
  // Work experience
  experiences: Array<{
    title: string;
    company: string;
    location: string;
    startDate: string;      // "2020-01" or "Jan 2020"
    endDate: string | "Present";
    durationMonths: number;
    bullets: string[];
    technologies: string[]; // Extracted from description
  }>;
  
  // Education
  education: Array<{
    degree: string;
    field: string;
    institution: string;
    graduationYear: number;
    gpa?: number;
  }>;
  
  // Skills
  skills: string[];
  
  // Projects (if present)
  projects?: Array<{
    name: string;
    description: string;
    technologies: string[];
    year: number;
    link?: string;
  }>;
  
  // Certifications & Courses
  certifications?: Array<{
    name: string;
    issuer: string;
    year: number;
    expiryYear?: number;
  }>;
  
  courses?: Array<{
    name: string;
    institution: string;
    year: number;
  }>;
  
  // Document metadata
  metadata: {
    pageCount: number;
    wordCount: number;
    hasTables: boolean;
    hasImages: boolean;
    format: string;
    parseQuality: 'high' | 'medium' | 'low';
  };
}
```

### 5.2 Output Schema

```typescript
interface AssessmentOutput {
  // Overall result
  globalScore: number;  // 0-100
  level: 'Early' | 'Growing' | 'Solid' | 'Strong' | 'Exceptional';
  
  // Dimension scores
  dimensions: {
    skillCapital: {
      score: number;
      breakdown?: {
        breadth: number;
        depthFactor: number;
      };
    };
    executionImpact: {
      score: number;
      breakdown?: {
        metricsRatio: number;
        actionRatio: number;
        ownershipRatio: number;
      };
    };
    learningAdaptivity: {
      score: number;
      breakdown?: {
        coursesScore: number;
        selfLearningScore: number;
        techEvolutionScore: number;
      };
    };
    signalQuality: {
      score: number;
      breakdown?: {
        structure: number;
        formatting: number;
        evidence: number;
        writing: number;
        polish: number;
      };
      issues: string[];
    };
  };
  
  // Flags
  flags: {
    noSkillsListed: boolean;
    possibleSpam: boolean;
    noExperience: boolean;
    genericDescriptions: boolean;
    noMetrics: boolean;
    stagnant: boolean;
    parsingFailed: boolean;
    tooShort: boolean;
  };
  
  // Actionable feedback
  feedback: {
    strengths: string[];      // 2-4 items
    criticalGaps: string[];   // 1-3 most important issues
    quickWins: Array<{
      action: string;
      estimatedImpact: string;  // "+5 points"
      effort: string;           // "15 minutes"
      priority: number;         // 1-5
    }>;
    recommendations: string[];  // 5-8 general improvements
  };
  
  // Summary message
  summary: string;  // 1-2 sentences capturing overall assessment
  
  // Processing metadata
  meta: {
    processingTime: number;  // milliseconds
    timestamp: string;
    version: string;         // "1.0-mvp"
  };
}
```

### 5.3 Example Output

```json
{
  "globalScore": 61.3,
  "level": "Solid",
  
  "dimensions": {
    "skillCapital": {
      "score": 68.7,
      "breakdown": {
        "breadth": 74.6,
        "depthFactor": 0.8
      }
    },
    "executionImpact": {
      "score": 53.0,
      "breakdown": {
        "metricsRatio": 0.4,
        "actionRatio": 0.6,
        "ownershipRatio": 0.0
      }
    },
    "learningAdaptivity": {
      "score": 52.0,
      "breakdown": {
        "coursesScore": 60,
        "selfLearningScore": 28,
        "techEvolutionScore": 76
      }
    },
    "signalQuality": {
      "score": 72.0,
      "breakdown": {
        "structure": 20,
        "formatting": 15,
        "evidence": 18,
        "writing": 15,
        "polish": 15
      },
      "issues": [
        "Only 40% of bullets have metrics - aim for 50%+",
        "Add GitHub profile for technical roles"
      ]
    }
  },
  
  "flags": {
    "noSkillsListed": false,
    "possibleSpam": false,
    "noExperience": false,
    "genericDescriptions": false,
    "noMetrics": false,
    "stagnant": false,
    "parsingFailed": false,
    "tooShort": false
  },
  
  "feedback": {
    "strengths": [
      "Good technical skill breadth (13 technologies)",
      "Active learner with recent courses",
      "Clean resume format and structure"
    ],
    
    "criticalGaps": [
      "Limited quantified achievements - only 40% of bullets have metrics",
      "No leadership or ownership signals in experience",
      "Missing GitHub profile link"
    ],
    
    "quickWins": [
      {
        "action": "Add GitHub profile URL",
        "estimatedImpact": "+3 points",
        "effort": "2 minutes",
        "priority": 1
      },
      {
        "action": "Add metrics to 3-5 more bullet points",
        "estimatedImpact": "+5-7 points",
        "effort": "30 minutes",
        "priority": 2
      },
      {
        "action": "Rewrite 2-3 bullets to show leadership",
        "estimatedImpact": "+4 points",
        "effort": "20 minutes",
        "priority": 3
      }
    ],
    
    "recommendations": [
      "Quantify your achievements with specific numbers, percentages, or time saved",
      "Add GitHub profile to showcase your code",
      "Include 1-2 personal projects with live links",
      "Reframe some bullets to show initiative and ownership",
      "Consider adding a brief professional summary at the top",
      "Expand project descriptions with technologies and impact",
      "Add 1-2 more relevant certifications in your tech stack"
    ]
  },
  
  "summary": "You're a solid mid-level developer with good technical breadth and active learning habits. Focus on adding more quantified achievements and showing ownership to reach the next level.",
  
  "meta": {
    "processingTime": 3247,
    "timestamp": "2025-01-15T10:30:45Z",
    "version": "1.0-mvp"
  }
}
```

---

## 6. Implementation Guide

### 6.1 Tech Stack

```yaml
Backend:
  Language: Python 3.11+
  Framework: FastAPI
  
Resume Parsing:
  Primary: pyresparser + spaCy
  Backup: Commercial API (Affinda, Sovren)
  
NLP:
  spaCy: en_core_web_sm
  NLTK: For text processing
  language_tool_python: Grammar checking
  
Database (optional for MVP):
  PostgreSQL: Store parsed resumes
  Redis: Caching
  
Deployment:
  Docker
  AWS Lambda (for serverless) or EC2
```

### 6.2 Required Libraries

```python
# requirements.txt
fastapi==0.109.0
uvicorn==0.27.0
pydantic==2.5.0
python-multipart==0.0.6

# Resume parsing
pyresparser==1.0.6
spacy==3.7.2
pdfplumber==0.10.3
python-docx==1.1.0

# NLP
nltk==3.8.1
language-tool-python==2.8

# Utilities
python-dateutil==2.8.2
regex==2023.12.25
```

### 6.3 Estimated Lines of Code

```
Core Scoring Engine:
  - dimension_calculators.py: ~800 LOC
  - scoring_logic.py: ~300 LOC
  - helpers.py: ~400 LOC

Resume Processing:
  - parser.py: ~600 LOC
  - normalizers.py: ~400 LOC
  - extractors.py: ~500 LOC

API Layer:
  - routes.py: ~200 LOC
  - schemas.py: ~300 LOC
  - services.py: ~400 LOC

Utils:
  - validators.py: ~200 LOC
  - constants.py: ~100 LOC

Tests:
  - test_*.py: ~1500 LOC

Total: ~5,700 LOC
```

### 6.4 Time Estimate

```
Resume Parser Integration: 3 days
  - Setup pyresparser/spaCy
  - Build normalization layer
  - Handle edge cases

Dimension Calculators: 4 days
  - Skill Capital: 1 day
  - Execution Impact: 1 day
  - Learning & Adaptivity: 1 day
  - Signal Quality: 1 day

Scoring Logic & Aggregation: 2 days
  - Weight calculation
  - Modifiers
  - Constraints

Feedback Generation: 2 days
  - Identify gaps
  - Priority scoring
  - Message templates

API Layer: 2 days
  - FastAPI routes
  - Input validation
  - Error handling

Testing: 3 days
  - Unit tests
  - Integration tests
  - Real resume testing

Total: 16 days (~3 weeks with buffer)
```

### 6.5 Risk Factors

**High Risk:**
1. Resume parsing accuracy
   - Mitigation: Use commercial API as backup, extensive testing
   
2. Grammar checking performance
   - Mitigation: Cache results, use async processing

**Medium Risk:**
3. Skill normalization completeness
   - Mitigation: Start with top 500 skills, expand iteratively

4. Performance with large resumes
   - Mitigation: Set size limits, optimize algorithms

**Low Risk:**
5. Score calibration
   - Mitigation: Test with diverse resume samples, adjust weights

---

## 7. Test Cases

### 7.1 Resume Test Suite

**Test Case 1: Fresh Graduate**
```yaml
Input:
  Name: Alice Chen
  Education: BS Computer Science, 2024
  Skills: Python, JavaScript, React, HTML, CSS
  Projects: 3 personal projects
  Experience: 1 internship (3 months)
  
Expected Output:
  Global Score: 35-45
  Level: Early/Growing
  Skill Capital: 35-45
  Execution Impact: 25-35
  Learning Adaptivity: 50-60
  Signal Quality: 65-75
  
Key Flags:
  - None (appropriate for level)
```

**Test Case 2: Mid-Level Engineer**
```yaml
Input:
  Name: Bob Rodriguez
  Experience: 4 years, 2 companies
  Skills: 13 technologies
  Education: BS Engineering
  Metrics: 40% of bullets have numbers
  Courses: 2 in last 3 years
  Projects: 2 personal
  
Expected Output:
  Global Score: 55-65
  Level: Solid
  Skill Capital: 65-75
  Execution Impact: 50-60
  Learning Adaptivity: 50-60
  Signal Quality: 70-80
  
Key Feedback:
  - "Add more metrics to achievements"
  - "Show leadership/ownership"
```

**Test Case 3: Senior with Weak Presentation**
```yaml
Input:
  Name: Carol Kim
  Experience: 8 years, strong technical depth
  Skills: 20+ technologies
  NO metrics in bullets
  NO links
  3 pages long
  Grammar errors: 6
  
Expected Output:
  Global Score: 55-65 (capped by signal)
  Level: Solid (should be Strong but signal hurts)
  Skill Capital: 85-90
  Execution Impact: 30-40 (no metrics!)
  Learning Adaptivity: 40-50
  Signal Quality: 35-45
  
Key Flags:
  - NO_METRICS
  
Critical Feedback:
  - "Add quantified achievements"
  - "Condense to 2 pages"
  - "Add LinkedIn/GitHub"
```

**Test Case 4: Career Changer (Strong Learner)**
```yaml
Input:
  Name: David Park
  Previous: 5 years marketing
  Recent: 6 months software dev (post-bootcamp)
  Skills: 8 new tech skills
  Projects: 5 personal projects
  Courses: Bootcamp + 4 courses
  Metrics: Good in new work
  
Expected Output:
  Global Score: 45-55
  Level: Growing
  Skill Capital: 40-50
  Execution Impact: 55-65 (good for short time)
  Learning Adaptivity: 75-85 (high!)
  Signal Quality: 70-80
  
Strengths:
  - "Exceptional learning velocity"
  - "Strong project portfolio"
```

**Test Case 5: Stagnant Expert**
```yaml
Input:
  Name: Eve Thompson
  Experience: 12 years, same company
  Skills: 15 technologies (but all from 2015)
  NO courses in 5 years
  NO personal projects
  Good metrics in bullets
  
Expected Output:
  Global Score: 60-70
  Level: Solid
  Skill Capital: 70-75
  Execution Impact: 75-85
  Learning Adaptivity: 15-25 (very low!)
  Signal Quality: 75-85
  
Key Flags:
  - STAGNANT
  
Critical Feedback:
  - "No new skills or learning in recent years"
  - "Technology stack is dated"
```

### 7.2 Edge Case Tests

```yaml
Test: Empty Resume
Input: Blank PDF
Expected: All scores = 0, multiple flags

Test: Unparseable PDF
Input: Scanned image PDF
Expected: PARSING_FAILED flag, score = 20

Test: Keyword Stuffing
Input: 60+ skills listed, many irrelevant
Expected: POSSIBLE_SPAM flag, penalty applied

Test: All Generic Bullets
Input: "Responsible for...", "Worked on..."
Expected: GENERIC_DESCRIPTIONS flag, low execution score

Test: No Contact Info
Input: Resume missing email/phone
Expected: Signal quality penalty

Test: First-Person Pronouns
Input: "I built...", "My project..."
Expected: Writing quality penalty
```

---

## 8. Success Criteria

### 8.1 Technical Success Metrics

```yaml
Performance:
  - Processing time < 5 seconds: ✅
  - Parsing success rate > 90%: ✅
  - API uptime > 99%: ✅

Accuracy:
  - Score variance < 5 points on same resume: ✅
  - Flag precision > 85%: ✅
  - Test suite pass rate 100%: ✅
```

### 8.2 User Success Metrics

```yaml
Usefulness:
  - User finds score "fair" (survey): > 70%
  - User finds feedback "actionable": > 80%
  - User improves score after applying suggestions: > 60%

Engagement:
  - User views full breakdown: > 75%
  - User downloads detailed report: > 50%
  - User returns to re-test after changes: > 40%
```

### 8.3 Business Success Metrics

```yaml
Adoption:
  - Daily active users: 100+ in first month
  - Resume assessments per day: 200+ in first month
  - User retention (7-day): > 30%

Quality:
  - False positive rate (spam detection): < 5%
  - User complaints about scoring: < 3%
  - Average user rating: > 4/5
```

---

## 9. Limitations & Future Enhancements

### 9.1 MVP Limitations

**What's Missing:**
1. Trajectory Momentum (career progression analysis)
2. Density Score (value per year calculation)
3. Coherence & Focus (entropy-based)
4. External Validation (OSS, talks, awards)
5. Profile Type Classification (detailed)
6. Industry-specific calibration
7. ML-based predictions
8. Comparative benchmarking

**Why Deferred:**
- Complexity: These require advanced algorithms
- Data: Need historical data for calibration
- Time: 8-week MVP timeline constraint

### 9.2 Known Edge Cases

```yaml
Limitations:
  - Parser struggles with creative resume formats
  - Skill extraction misses some non-standard terms
  - Grammar checker has false positives
  - Cannot detect inflated/fake experience
  - No verification of claims
  - English-only support
```

### 9.3 Post-MVP Roadmap

**Phase 2 (Week 9-12): Enhanced**
- Add Trajectory Momentum
- Add basic Coherence analysis
- Improve skill taxonomy (expand to 2000+ skills)
- Industry-specific weight adjustments

**Phase 3 (Month 4-6): Advanced**
- Full Coherence & Focus (entropy)
- External Validation scoring
- Density Score calculation
- Profile Type classification
- Multi-language support

**Phase 4 (Month 6+): Intelligent**
- ML-based calibration
- Predictive outcomes (interview probability)
- Comparative benchmarking
- Real-time improvement suggestions

---

## 10. Appendix

### 10.1 Skill Taxonomy (Sample)

```yaml
Programming Languages:
  - Python, JavaScript, Java, C++, Go, Rust, Ruby, PHP, Swift, Kotlin

Web Frameworks:
  - React, Angular, Vue, Django, Flask, FastAPI, Spring, Rails, Express, Next.js

Databases:
  - PostgreSQL, MySQL, MongoDB, Redis, Elasticsearch, Cassandra, DynamoDB

Cloud:
  - AWS, Azure, GCP, Docker, Kubernetes, Terraform, CloudFormation

Tools:
  - Git, Jira, Jenkins, GitHub Actions, CircleCI, Datadog, Grafana

[Full list: 500+ skills in MVP, 2000+ in Complete]
```

### 10.2 Action Verb Lists

```yaml
Strong Action Verbs (Execution):
  - built, designed, developed, implemented, created, engineered
  - architected, launched, shipped, delivered, optimized, automated
  - reduced, increased, improved, enhanced, streamlined

Ownership Verbs:
  - led, owned, managed, directed, coordinated, drove
  - spearheaded, initiated, founded, established

Weak Verbs (to flag):
  - responsible for, worked on, assisted with, involved in
  - helped, participated, contributed, supported
```

### 10.3 Vague Phrase Dictionary

```yaml
Vague Phrases (to penalize):
  - various, multiple, several, many, numerous
  - etc, and more, among others, and so on
  - stuff, things, tasks, duties
  - worked on, involved in, responsible for
  - helped, assisted, supported, contributed
```

---

**End of Layer 1 MVP Specification**

**Document Version:** 1.0-mvp  
**Last Updated:** 2025-01-15  
**Total Pages:** ~12  
**Status:** Ready for Implementation

