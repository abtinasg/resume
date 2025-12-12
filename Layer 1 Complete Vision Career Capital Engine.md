# Layer 1 Complete Vision: Career Capital Engine (7 Dimensions)
## Complete Specification Document

---

## 1. Executive Summary

### 1.1 Purpose
Layer 1 Complete provides a **comprehensive job-agnostic assessment** of a candidate's professional profile with all 7 dimensions of Career Capital. Unlike the MVP (4 dimensions), the Complete version includes trajectory momentum, coherence & focus, and external validation for deeper insights.

### 1.2 Scope
**What it does:**
- Analyzes resume without requiring a job description
- Produces multi-dimensional scores for all 7 Career Capital dimensions (0-100 each)
- Provides actionable feedback for improvement
- Classifies overall quality level (Early/Growing/Solid/Strong/Exceptional)
- Identifies critical gaps and quick wins
- Detects career patterns (stagnation, progression, volatility)
- Measures focus vs. exploration trade-offs
- Evaluates external recognition and validation

**MVP dimensions (v1.0):**
- Skill Capital
- Execution Impact
- Learning & Adaptivity
- Signal Quality

**Additional Complete dimensions (v2.0):**
- Trajectory Momentum (career progression velocity)
- Coherence & Focus (entropy-based focus measurement)
- External Validation (recognition, community involvement)

**Future Post-MVP enhancements:**
- ❌ Advanced ML-based predictions
- ❌ Comparative benchmarking
- ❌ Industry-specific calibration beyond weights
- ❌ Multi-language support

### 1.3 Key Design Principles
1. **Simplicity**: Use straightforward algorithms that are explainable
2. **Actionability**: Every score must translate to specific improvements
3. **Fairness**: Avoid penalizing career changers, self-taught developers, or non-traditional paths
4. **Backward Compatibility**: All new dimensions are optional/nullable for MVP data
5. **Extensibility**: Architecture allows adding advanced features post-MVP
6. **Speed**: Processing time < 5 seconds per resume

---

## 2. Architecture Overview

### 2.1 High-Level Flow (Complete Version)

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
┌──────────────────────────────────────────────────────────┐
│  Parallel Dimension Scoring (7 Dimensions)              │
│  ┌──────────────────┐  ┌──────────────────────────────┐ │
│  │ Skill Capital    │  │ Execution Impact             │ │
│  └──────────────────┘  └──────────────────────────────┘ │
│  ┌──────────────────┐  ┌──────────────────────────────┐ │
│  │ Learning &       │  │ Signal Quality               │ │
│  │ Adaptivity       │  └──────────────────────────────┘ │
│  └──────────────────┘                                    │
│  ┌──────────────────┐  ┌──────────────────────────────┐ │
│  │ Trajectory       │  │ Coherence & Focus            │ │
│  │ Momentum         │  └──────────────────────────────┘ │
│  └──────────────────┘                                    │
│  ┌──────────────────────────────────────────────────────┐│
│  │ External Validation (OSS, publications, speaking)   ││
│  └──────────────────────────────────────────────────────┘│
└────────┬───────────────────────────────────────────────────┘
         │
         ▼
┌───────────────────────────────────────────────────────────┐
│  Global Score Calculation (v2.0 Enhanced)                 │
│  - Extract scores from dimension objects                  │
│  - Apply weighted sum with all 7 dimensions               │
│  - Apply signal quality modifier                          │
│  - Apply constraints (including new trajectory/coherence) │
│  - Calculate density score                                │
└────────┬───────────────────────────────────────────────────┘
         │
         ▼
┌───────────────────────────────────────────────────────────┐
│  Profile Type Classification (Enhanced)                    │
│  - Specialist vs Generalist                               │
│  - Trajectory: Stagnant, Stable, Growing, Exceptional     │
│  - Career Changer (with inflection detection)             │
│  - Deep Contributor vs Broad Influence                    │
└────────┬───────────────────────────────────────────────────┘
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
│  - All 7 dimension scores   │
│  - Profile type             │
│  - Recommendations          │
└─────────────────────────────┘
```

### 2.2 Dependencies
- **Resume Parser**: Python-based (pyresparser, spaCy) or commercial API
- **NLP**: Advanced keyword extraction, technology timeline analysis
- **Database**: Store parsed resumes for caching and trajectory analysis
- **API**: Claude/GPT for text analysis (optional enhancement)
- **Math**: scipy for entropy calculations

### 2.3 Processing Time Budget
- Resume parsing: 1-2 seconds
- Dimension calculations (7): 1.5-2.5 seconds
- Profile classification: 0.5 seconds
- Feedback generation: 1 second
- **Total: < 5 seconds**

---

## 3. Core Dimensions

### 3.1 Skill Capital (MVP - Unchanged)
[Content from MVP remains - Lines 108-383 in original document]

---

### 3.2 Execution Impact (MVP - Unchanged)
[Content from MVP remains - Lines 409-817 in original document]

---

### 3.3 Learning & Adaptivity (MVP - Unchanged)
[Content from MVP remains - Lines 820-1241 in original document]

---

### 3.4 Signal Quality (MVP - Unchanged)
[Content from MVP remains - Lines 1244-1669 in original document]

---

### 3.5 Trajectory Momentum (NEW)

#### 3.5.1 Definition
Measures **career progression velocity and direction** over time. This dimension captures whether a candidate is stagnating, growing steadily, or accelerating their career. It accounts for:
- Seniority level progression (junior → mid → senior → lead)
- Compensation/responsibility growth signals
- Time to promotion patterns
- Recent momentum vs. historical pace

#### 3.5.2 Input Requirements
From resume:
- Chronological work history with titles and dates
- Responsibility escalation in bullet points
- Salary/compensation indicators (if available)
- Promotion indicators ("promoted from X to Y")
- Project scope growth

#### 3.5.3 Formula

```python
def calculate_trajectory_momentum(experiences: List[Experience], metadata: Dict) -> Dict:
    """
    Trajectory Momentum Score based on career progression

    Args:
        experiences: Chronological list of work experiences
        metadata: Include total_years, current_date

    Returns:
        Dict with score, flags, and breakdown
    """

    import datetime
    current_year = datetime.date.today().year

    if not experiences or len(experiences) < 2:
        return {
            'score': 50,  # Neutral for insufficient history
            'flags': ['INSUFFICIENT_HISTORY'],
            'breakdown': {
                'seniority_progression': 50,
                'time_to_promotion': 50,
                'recent_momentum': 50,
                'responsibility_growth': 50
            }
        }

    # Sort by start date
    sorted_exp = sorted(experiences, key=lambda e: e.start_date)

    # Component 1: Seniority Progression
    seniority_scores = [title_to_level(exp.title) for exp in sorted_exp]
    seniority_progression = calculate_seniority_progression(seniority_scores)

    # Component 2: Time to Promotion
    time_to_promotion = calculate_time_to_promotion(sorted_exp)

    # Component 3: Recent Momentum (last 2 years)
    recent_momentum = calculate_recent_momentum(sorted_exp, current_year)

    # Component 4: Responsibility Growth
    responsibility_growth = calculate_responsibility_growth(sorted_exp)

    # Combine with weights
    trajectory_momentum = (
        0.35 * seniority_progression +
        0.25 * time_to_promotion +
        0.25 * recent_momentum +
        0.15 * responsibility_growth
    )

    flags = []

    # Flag stagnation
    if seniority_progression < 30 and time_to_promotion < 30:
        flags.append('STAGNANT_TRAJECTORY')

    # Flag recent decline
    if recent_momentum < 20:
        flags.append('RECENT_DECLINE')

    final_score = round(trajectory_momentum, 1)

    return {
        'score': final_score,
        'flags': flags,
        'breakdown': {
            'seniority_progression': round(seniority_progression, 1),
            'time_to_promotion': round(time_to_promotion, 1),
            'recent_momentum': round(recent_momentum, 1),
            'responsibility_growth': round(responsibility_growth, 1)
        }
    }


def title_to_level(title: str) -> int:
    """
    Map job title to seniority level (0-100)

    Note: This is a simplified mapping for MVP.
    TODO for production:
      - Handle company-specific levels (L3, L4, T4, etc.)
      - Consider industry variations
      - Add machine learning classifier for ambiguous titles
      - Maintain title normalization database
    """
    level_map = {
        # Intern/Entry
        'intern': 10, 'graduate': 15, 'entry': 20,
        'junior': 25, 'associate': 30,

        # Mid-level
        'developer': 40, 'engineer': 40, 'specialist': 45,
        'mid': 45, 'senior': 55,

        # Lead/Senior
        'lead': 65, 'principal': 70, 'staff': 75,
        'architect': 75, 'director': 80,

        # Management
        'manager': 60, 'senior manager': 70, 'head': 85,
        'vp': 90, 'cto': 95, 'ceo': 100
    }

    title_lower = title.lower()

    # Exact match first
    if title_lower in level_map:
        return level_map[title_lower]

    # Keyword matching
    for key, level in level_map.items():
        if key in title_lower:
            return level

    # Default to mid-level
    return 40


def calculate_seniority_progression(levels: List[int]) -> float:
    """
    Score how much seniority increased over career
    Max: 100 (started entry, ended executive)
    """
    if len(levels) < 2:
        return 50

    progression = levels[-1] - levels[0]  # Latest - first

    # Normalize: 0 to 90 progression = 0 to 100 score
    score = min((progression / 90) * 100, 100)

    return score


def calculate_time_to_promotion(experiences: List[Experience]) -> float:
    """
    Score based on how quickly promotions happened

    Fast promotions (every 1-2 years) = high score
    Slow/no promotions = low score
    """
    promotions = []

    for i, exp in enumerate(experiences):
        if i == 0:
            continue

        prev_level = title_to_level(experiences[i-1].title)
        curr_level = title_to_level(exp.title)

        if curr_level > prev_level:
            duration_months = experiences[i-1].duration_months
            promotions.append(duration_months)

    if not promotions:
        return 20  # No promotions

    avg_promotion_time = sum(promotions) / len(promotions)

    # Ideal: promotion every 18-24 months
    # Very fast: < 12 months = 100
    # Fast: 12-18 months = 80
    # Normal: 18-30 months = 60-70
    # Slow: 30-48 months = 30-40
    # Very slow: > 48 months = < 20

    if avg_promotion_time < 12:
        return 100
    elif avg_promotion_time < 18:
        return 85
    elif avg_promotion_time < 24:
        return 75
    elif avg_promotion_time < 36:
        return 50
    else:
        return 25


def calculate_recent_momentum(experiences: List[Experience], current_year: int) -> float:
    """
    Score based on recent (last 2 years) progression
    """
    recent_exp = [e for e in experiences
                  if current_year - e.start_year <= 2]

    if not recent_exp:
        return 50  # Neutral

    # Check if latest role shows growth
    latest = experiences[-1]
    latest_level = title_to_level(latest.title)

    # If currently employed and level is increasing, boost score
    if latest.is_current and latest_level > 50:
        return 80
    elif latest_level > 50:
        return 70
    else:
        return 40


def calculate_responsibility_growth(experiences: List[Experience]) -> float:
    """
    Score based on scope growth in experience descriptions

    Indicators:
    - Team size growth
    - Budget/scope growth
    - Customer base growth
    - Geographic expansion
    """
    growth_indicators = []

    for exp in experiences:
        bullets_text = ' '.join(exp.bullets).lower()

        # Growth signals
        if any(word in bullets_text for word in
               ['team', 'lead', 'manage', 'org', 'department']):
            growth_indicators.append(0.2)

        if any(word in bullets_text for word in
               ['budget', 'revenue', 'millions', 'thousands', '$']):
            growth_indicators.append(0.2)

        if any(word in bullets_text for word in
               ['scale', 'global', 'international', 'expansion']):
            growth_indicators.append(0.2)

        if any(word in bullets_text for word in
               ['architecture', 'system', 'framework', 'platform']):
            growth_indicators.append(0.15)

    if not growth_indicators:
        return 30

    score = min(sum(growth_indicators) * 100, 100)
    return score
```

#### 3.5.4 Scoring Range Breakdown

| Seniority Prog | Promotion Pace | Recent Momentum | Final Score | Interpretation |
|---|---|---|---|---|
| 0/100 | 0/100 | 30/100 | 15 | Stagnant - no visible progression |
| 30/100 | 40/100 | 50/100 | 38 | Slow - limited growth |
| 60/100 | 60/100 | 70/100 | 65 | Good - steady progression |
| 80/100 | 75/100 | 85/100 | 81 | Strong - consistent growth |
| 100/100 | 100/100 | 90/100 | 96 | Exceptional - rapid progression |

#### 3.5.5 Example Calculations

**Example A: Stagnant Engineer**
```python
Input:
  5 years at same company
  Title progression: Junior → Senior (stuck)
  No promotions in last 3 years

Calculation:
  seniority_progression = (55-25)/90*100 = 33
  time_to_promotion = 25 (no recent promos)
  recent_momentum = 20 (no advancement)
  responsibility_growth = 35 (some team exposure)

  trajectory = 0.35*33 + 0.25*25 + 0.25*20 + 0.15*35 = 28

Output: 28/100 with STAGNANT_TRAJECTORY flag
```

**Example B: Ascending Executive**
```python
Input:
  8 years career
  Title progression: Junior → Senior → Lead → Principal
  Promoted every 18-24 months
  Recent: Principal at FAANG

Calculation:
  seniority_progression = (75-25)/90*100 = 55
  time_to_promotion = 75 (18-24 month average)
  recent_momentum = 85 (currently principal)
  responsibility_growth = 85 (team/budget/scale growth)

  trajectory = 0.35*55 + 0.25*75 + 0.25*85 + 0.15*85 = 73

Output: 73/100 - Strong progression
```

---

### 3.6 Coherence & Focus (NEW)

#### 3.6.1 Definition
Measures **how focused vs. scattered** a career is using Shannon Entropy. High coherence = deep specialization in related domains. Low coherence = broad exploration across unrelated fields.

**Not a penalty:** Both focused and exploratory careers can be valuable. This dimension shows the tradeoff.

#### 3.6.2 Input Requirements
From resume:
- List of job categories/roles (Backend, Frontend, Product, Design, etc.)
- Time spent in each category
- Category relationships

#### 3.6.3 Formula

```python
def calculate_coherence_focus(experiences: List[Experience]) -> Dict:
    """
    Coherence & Focus using Shannon Entropy

    Measures how concentrated career is across domains
    - High entropy (low coherence) = scattered across many domains
    - Low entropy (high coherence) = focused on few related domains
    """

    import math

    # Step 1: Categorize experiences
    categories = {}
    total_months = 0

    for exp in experiences:
        category = categorize_role(exp.title)
        months = exp.duration_months

        if category not in categories:
            categories[category] = 0

        categories[category] += months
        total_months += months

    if total_months == 0:
        return {
            'score': 50,
            'flags': ['INSUFFICIENT_DATA'],
            'breakdown': {
                'entropy': 0,
                'normalized_entropy': 0,
                'category_count': 0,
                'dominant_category': None
            }
        }

    # Step 2: Calculate distribution
    distribution = {cat: months/total_months
                   for cat, months in categories.items()}

    # Step 3: Calculate Shannon Entropy
    entropy_raw = -sum(p * math.log2(p) for p in distribution.values() if p > 0)

    # Normalize by FIXED taxonomy size (all possible categories)
    MAX_POSSIBLE_CATEGORIES = 12  # Total number of job categories in taxonomy
    max_entropy = math.log2(MAX_POSSIBLE_CATEGORIES)
    normalized_entropy = entropy_raw / max_entropy if max_entropy > 0 else 0

    # Step 4: Calculate score
    # Optimal range: 0.35-0.65 (balanced specialization/exploration)
    # <0.35 = too focused, might lack breadth
    # >0.65 = too scattered, might lack depth

    distance_from_optimal = abs(normalized_entropy - 0.50)
    score = 100 - (distance_from_optimal * 100)

    flags = []

    if normalized_entropy < 0.2:
        flags.append('HYPER_SPECIALIZED')
    elif normalized_entropy < 0.35:
        flags.append('SPECIALIZED')
    elif normalized_entropy > 0.8:
        flags.append('SCATTERED')
    elif normalized_entropy > 0.65:
        flags.append('BROAD_EXPLORATION')

    # Check for logical progression
    if has_logical_progression(list(categories.keys())):
        flags.append('LOGICAL_PROGRESSION')

    final_score = round(max(0, min(score, 100)), 1)

    return {
        'score': final_score,
        'flags': flags,
        'breakdown': {
            'entropy': round(entropy_raw, 3),
            'normalized_entropy': round(normalized_entropy, 3),
            'category_count': len(categories),
            'dominant_category': max(categories, key=categories.get) if categories else None,
            'distribution': {k: round(v, 2) for k, v in distribution.items()}
        }
    }


def categorize_role(title: str) -> str:
    """
    Categorize job title into standard categories

    Taxonomy (12 categories):
    """
    categories = {
        'Backend Engineering': [
            'backend', 'backend engineer', 'server', 'api',
            'database engineer', 'platform', 'infrastructure'
        ],
        'Frontend Engineering': [
            'frontend', 'ui engineer', 'react', 'angular',
            'web engineer', 'client', 'mobile engineer'
        ],
        'Full Stack Engineering': [
            'full stack', 'fullstack', 'full-stack',
            'full stack engineer', 'web developer'
        ],
        'DevOps / Infrastructure': [
            'devops', 'sre', 'infrastructure', 'cloud engineer',
            'systems engineer', 'operations'
        ],
        'Data Engineering': [
            'data engineer', 'data pipeline', 'etl',
            'data platform', 'analytics engineer'
        ],
        'Machine Learning / AI': [
            'machine learning', 'ml', 'ai', 'nlp', 'computer vision',
            'deep learning', 'data scientist'
        ],
        'Product Management': [
            'product manager', 'pm', 'product lead',
            'product owner'
        ],
        'Management / Leadership': [
            'manager', 'director', 'head of', 'vp', 'cto', 'ceo',
            'lead', 'engineering manager'
        ],
        'Design (UI/UX)': [
            'designer', 'ux', 'ui', 'product designer',
            'design lead'
        ],
        'Quality Assurance': [
            'qa', 'qe', 'test', 'automation', 'quality engineer'
        ],
        'Sales / Business Development': [
            'sales', 'business development', 'account executive',
            'sales engineer'
        ],
        'Other': []
    }

    title_lower = title.lower()

    for category, keywords in categories.items():
        if any(kw in title_lower for kw in keywords):
            return category

    return 'Other'


def has_logical_progression(categories: List[str]) -> bool:
    """
    Check if category sequence represents logical career progression

    Examples of logical progression:
        - Frontend → Full Stack → Backend
        - Backend → DevOps
        - Any Engineering → Product Management
        - Any Engineering → Management
    """
    logical_paths = [
        ['Frontend Engineering', 'Full Stack Engineering'],
        ['Frontend Engineering', 'Backend Engineering'],
        ['Backend Engineering', 'Full Stack Engineering'],
        ['Backend Engineering', 'DevOps / Infrastructure'],
        ['Backend Engineering', 'Machine Learning / AI'],
        ['Data Engineering', 'Machine Learning / AI'],
        ['Full Stack Engineering', 'DevOps / Infrastructure'],

        # To Product/Management (from any engineering)
        ['Backend Engineering', 'Product Management'],
        ['Frontend Engineering', 'Product Management'],
        ['Full Stack Engineering', 'Product Management'],
        ['Backend Engineering', 'Management / Leadership'],
        ['Frontend Engineering', 'Management / Leadership'],
        ['Full Stack Engineering', 'Management / Leadership'],
        ['Data Engineering', 'Product Management'],
        ['Machine Learning / AI', 'Product Management'],

        # Design to Product
        ['Design (UI/UX)', 'Product Management'],
    ]

    # Check if any logical path subset exists in categories
    for path in logical_paths:
        if all(cat in categories for cat in path):
            return True

    return False
```

#### 3.6.4 Example Calculations

**Example A: Scattered Career**
```python
Input:
  2 years Backend
  1.5 years Frontend
  1 year DevOps
  1.5 years Data Engineering
  1 year Product Management

Calculation:
  distribution = {
    'Backend': 0.24,
    'Frontend': 0.18,
    'DevOps': 0.12,
    'Data Engineering': 0.18,
    'Product': 0.12,
    'Other': 0.16
  }

  entropy_raw = -(0.24*log2(0.24) + 0.18*log2(0.18) + ... ) ≈ 2.45
  max_entropy = log2(12) ≈ 3.585
  normalized = 2.45 / 3.585 ≈ 0.68 (scattered)

  distance = |0.68 - 0.50| = 0.18
  score = 100 - (0.18 * 100) = 82

Output:
  score: 82/100
  flags: ['BROAD_EXPLORATION']
  interpretation: "Well-rounded explorer with experience across domains"
```

**Example B: Optimal Coherence (Corrected)**
```python
Input:
  5 years Backend (50%)
  3 years Full Stack (30%)
  2 years DevOps (20%)

Calculation:
  distribution = {'Backend': 0.5, 'Full Stack': 0.3, 'DevOps': 0.2}
  entropy_raw = -(0.5*log2(0.5) + 0.3*log2(0.3) + 0.2*log2(0.2))
               ≈ 1.485

  max_entropy = log2(12) ≈ 3.585
  normalized = 1.485 / 3.585 ≈ 0.41

  0.41 is in optimal range [0.35, 0.65]
  distance_from_center = |0.41 - 0.50| = 0.09
  score = 100 - (0.09 * 100) = 91

Output:
  score: 91/100
  entropy: 0.41
  flags: ['LOGICAL_PROGRESSION']
  interpretation: "Well-balanced career with related domains"
```

**Example C: Hyper-Specialized**
```python
Input:
  8 years Backend
  1 year Backend (different company)
  1 year Backend Platform

Calculation:
  distribution = {'Backend': 1.0}
  entropy_raw = 0 (perfect specialization)
  normalized = 0

  distance = |0 - 0.50| = 0.50
  score = 100 - (0.50 * 100) = 50

Output:
  score: 50/100
  flags: ['HYPER_SPECIALIZED']
  interpretation: "Deep expertise in backend engineering, limited breadth"
```

---

### 3.7 External Validation (NEW)

#### 3.7.1 Definition
Measures **external recognition and community contribution** through open source contributions, publications, speaking engagements, awards, and other indicators of professional recognition.

#### 3.7.2 Input Requirements
From resume:
- GitHub profile (stars, contributions, major projects)
- Publications (papers, blog posts)
- Speaking engagements (conferences, meetups)
- Awards and recognitions
- Volunteer work
- Community involvement

#### 3.7.3 Formula

```python
def calculate_external_validation(profile: Profile) -> Dict:
    """
    External Validation Score based on community presence

    Args:
        profile: Profile with external links and achievements

    Returns:
        Dict with score, flags, and breakdown
    """

    flags = []

    # Component 1: Open Source Contribution
    oss_score = score_open_source(
        profile.github_url,
        profile.github_stars,
        profile.github_contributions
    )

    # Component 2: Speaking and Visibility
    speaking_score = score_speaking_visibility(
        profile.conference_talks,
        profile.podcasts,
        profile.social_followers
    )

    # Component 3: Publications
    publications_score = score_publications(
        profile.blogs,
        profile.technical_papers,
        profile.articles
    )

    # Component 4: Awards and Recognition
    awards_score = score_awards(profile.awards)

    # Combine with weights
    external_validation = (
        0.40 * oss_score +
        0.25 * speaking_score +
        0.20 * publications_score +
        0.15 * awards_score
    )

    # Scale for low presence
    if oss_score == 0 and speaking_score == 0 and publications_score == 0:
        flags.append('NO_EXTERNAL_PRESENCE')
        external_validation = 20  # Baseline
    elif external_validation > 0:
        if oss_score > 70:
            flags.append('STRONG_OSS_CONTRIBUTOR')
        if speaking_score > 60:
            flags.append('VISIBLE_SPEAKER')
        if publications_score > 50:
            flags.append('PUBLISHED_AUTHOR')

    final_score = round(min(external_validation, 100), 1)

    return {
        'score': final_score,
        'flags': flags,
        'breakdown': {
            'oss_score': round(oss_score, 1),
            'speaking_score': round(speaking_score, 1),
            'publications_score': round(publications_score, 1),
            'awards_score': round(awards_score, 1)
        }
    }


def score_open_source(github_url: str, stars: int, contributions: int) -> float:
    """Score open source contributions"""
    if not github_url:
        return 0

    # Personal projects with stars
    if stars >= 1000:
        return 100  # Notable projects
    elif stars >= 500:
        return 85
    elif stars >= 100:
        return 70
    elif stars >= 10:
        return 40
    elif stars > 0:
        return 20

    # Contributions to major projects
    if contributions >= 100:
        return 60
    elif contributions >= 20:
        return 40
    elif contributions > 0:
        return 20

    return 0


def score_speaking_visibility(talks: List[str], podcasts: List[str], followers: int) -> float:
    """Score speaking and visibility"""
    score = 0

    # Conference talks
    if len(talks) >= 5:
        score = 80
    elif len(talks) >= 3:
        score = 60
    elif len(talks) >= 1:
        score = 40

    # Podcast appearances
    if podcasts:
        score += 10

    # Social media following
    if followers >= 10000:
        score += 10
    elif followers >= 1000:
        score += 5

    return min(score, 100)


def score_publications(blogs: int, papers: int, articles: int) -> float:
    """Score technical writing"""
    score = 0

    # Technical papers (very valuable)
    if papers >= 3:
        score = 100
    elif papers == 2:
        score = 80
    elif papers == 1:
        score = 60

    # Regular blog posts
    if blogs >= 20:
        score = max(score, 70)
    elif blogs >= 10:
        score = max(score, 50)
    elif blogs >= 5:
        score = max(score, 30)
    elif blogs > 0:
        score = max(score, 20)

    # Articles/publications
    if articles >= 5:
        score = max(score, 60)

    return min(score, 100)


def score_awards(awards: List[str]) -> float:
    """Score awards and recognition"""
    if not awards:
        return 0

    # Prestigious awards (e.g., Forbes 30U30, Google Developer Expert)
    prestigious_keywords = ['expert', 'fellow', '30 under', 'award', 'distinction']

    if any(kw in ' '.join(awards).lower() for kw in prestigious_keywords):
        return 80

    # Regular awards
    return min(30 + len(awards) * 10, 100)
```

#### 3.7.4 Scoring Range

| OSS Score | Speaking | Publications | Awards | Final | Interpretation |
|---|---|---|---|---|---|
| 0 | 0 | 0 | 0 | 20 | No external presence |
| 20 | 0 | 0 | 0 | 28 | Some OSS activity |
| 60 | 40 | 0 | 0 | 48 | Active contributor |
| 80 | 60 | 40 | 20 | 70 | Well-recognized professional |
| 100 | 80 | 100 | 80 | 95 | High-visibility expert |

---

## 4. Scoring Logic

### 4.1 Dimension Weights (Complete Version)

```python
# Complete weights (all 7 dimensions)
WEIGHTS_COMPLETE = {
    'skill_capital': 0.20,
    'execution_impact': 0.20,
    'learning_adaptivity': 0.15,
    'signal_quality': 0.15,
    'trajectory_momentum': 0.15,
    'coherence_focus': 0.10,
    'external_validation': 0.05
}

# Industry-specific weights (example)
INDUSTRY_WEIGHTS = {
    'tech_startup': {
        'skill_capital': 0.25,
        'execution_impact': 0.25,
        'learning_adaptivity': 0.20,
        'signal_quality': 0.10,
        'trajectory_momentum': 0.10,
        'coherence_focus': 0.05,
        'external_validation': 0.05
    },
    'enterprise': {
        'skill_capital': 0.20,
        'execution_impact': 0.25,
        'learning_adaptivity': 0.10,
        'signal_quality': 0.20,
        'trajectory_momentum': 0.15,
        'coherence_focus': 0.05,
        'external_validation': 0.05
    },
    'open_source': {
        'skill_capital': 0.15,
        'execution_impact': 0.15,
        'learning_adaptivity': 0.15,
        'signal_quality': 0.10,
        'trajectory_momentum': 0.10,
        'coherence_focus': 0.10,
        'external_validation': 0.25  # High weight for OSS
    }
}
```

### 4.2 Global Score Calculation (Complete Version)

```python
def calculate_global_score_complete(dimensions: Dict, metadata: Dict) -> Dict:
    """
    Complete version with all 7 dimensions

    FIX 1: Extract numeric scores from dimension objects
    """

    # Extract numeric scores from dimension objects
    dim_scores = {
        'skill_capital': dimensions['skill_capital']['score'],
        'execution_impact': dimensions['execution_impact']['score'],
        'learning_adaptivity': dimensions['learning_adaptivity']['score'],
        'signal_quality': dimensions['signal_quality']['score'],
        'trajectory_momentum': dimensions['trajectory_momentum']['score'],
        'coherence_focus': dimensions['coherence_focus']['score'],
        'external_validation': dimensions['external_validation']['score']
    }

    # Get industry-specific weights if available
    industry = metadata.get('industry', 'generic')
    weights = INDUSTRY_WEIGHTS.get(industry, WEIGHTS_COMPLETE)

    # Base score with all dimensions
    base_score = sum(
        dim_scores[dim] * weights[dim]
        for dim in weights.keys()  # Iterate over weights, not dimensions
    )

    # Apply signal quality modifier
    signal_factor = calculate_signal_factor(dim_scores['signal_quality'])
    adjusted_score = base_score * signal_factor

    # Apply constraints
    final_score = apply_constraints_complete(adjusted_score, dim_scores, metadata)

    # Determine level
    level = determine_level(final_score)

    # Calculate density score
    density_score = calculate_density_score(dim_scores, metadata)

    return {
        'global_score': round(final_score, 1),
        'level': level,
        'density_score': round(density_score, 1),
        'breakdown': {
            'skill_capital': dim_scores['skill_capital'],
            'execution_impact': dim_scores['execution_impact'],
            'learning_adaptivity': dim_scores['learning_adaptivity'],
            'signal_quality': dim_scores['signal_quality'],
            'trajectory_momentum': dim_scores['trajectory_momentum'],
            'coherence_focus': dim_scores['coherence_focus'],
            'external_validation': dim_scores['external_validation']
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


def apply_constraints_complete(score: float, dim_scores: Dict, metadata: Dict) -> float:
    """
    Apply hard caps based on dimension flags and metadata

    Complete version includes trajectory and coherence constraints
    FIX 5: Define apply_constraints_complete function
    """

    # MVP constraints (from v1.0)
    if dim_scores['skill_capital'] < 25:
        score = min(score, 50)

    if dim_scores['execution_impact'] < 20:
        score = min(score, 55)

    if dim_scores['learning_adaptivity'] < 15 and score > 70:
        score = min(score, 70)

    # NEW: Complete version constraints

    # Trajectory momentum constraint
    # If stagnant trajectory (< 20) with 5+ years experience
    total_years = metadata.get('total_years', 0)
    if dim_scores['trajectory_momentum'] < 20 and total_years >= 5:
        score = min(score, 65)  # Cap at Solid level

    # Coherence constraint
    # If highly scattered (< 30) and not compensated by high external validation
    if dim_scores['coherence_focus'] < 30 and dim_scores['external_validation'] < 40:
        score = min(score, 70)

    # Combined low performers
    # If multiple dimensions are very weak
    low_dimensions = sum(1 for s in dim_scores.values() if s < 30)
    if low_dimensions >= 3:
        score = min(score, 60)

    return max(0, min(100, score))


def calculate_density_score(dim_scores: Dict, metadata: Dict) -> float:
    """
    Density Score: Achievement per year

    Measures how much value/impact is packed into each year of career
    """
    total_years = metadata.get('total_years', 1)

    if total_years < 0.5:
        return 50  # Not enough data

    # Average execution and trajectory momentum (output-oriented)
    output_avg = (dim_scores['execution_impact'] + dim_scores['trajectory_momentum']) / 2

    # Normalize by years
    density = output_avg / (total_years / 5)  # Normalize to 5-year baseline

    return min(density, 100)


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

### 4.3 Profile Type Classification (Enhanced)

```python
def classify_profile_type(scores: Dict, experiences: List[Experience], metadata: Dict) -> Dict:
    """
    Classify career profile based on dimension scores

    FIX 6: Handle recent_inflection in profile types
    """

    # Trajectory patterns
    trajectory_data = extract_trajectory_data(experiences)

    profile_types = {
        'SPECIALIST': {
            'criteria': {
                'coherence_focus': '>= 70',
                'skill_capital': '>= 60'
            },
            'description': 'Deep expertise in specific domain',
            'strengths': ['Specialized knowledge', 'Domain expert', 'High depth'],
            'advice': 'Consider adjacent skills to increase leverage'
        },

        'GENERALIST': {
            'criteria': {
                'coherence_focus': '< 40',
                'skill_capital': '>= 60'
            },
            'description': 'Broad experience across multiple domains',
            'strengths': ['Adaptable', 'Big-picture thinking', 'Flexible'],
            'advice': 'Identify a focus area for leadership roles'
        },

        'ASCENDING_EXECUTIVE': {
            'criteria': {
                'trajectory_momentum': '>= 70',
                'execution_impact': '>= 70'
            },
            'description': 'Strong upward career trajectory',
            'strengths': ['Growing leadership', 'Increasing impact', 'Momentum'],
            'advice': 'Build strategic thinking and vision'
        },

        'STEADY_CONTRIBUTOR': {
            'criteria': {
                'execution_impact': '>= 70',
                'trajectory_momentum': '35-65'
            },
            'description': 'Consistent, reliable performer',
            'strengths': ['Reliable', 'Strong execution', 'Dependable'],
            'advice': 'Seek growth opportunities or move to high-growth company'
        },

        'STAGNANT': {
            'criteria': {
                'trajectory_momentum': '< 30',
                'total_years': '>= 5'
            },
            'description': 'Career plateau or limited progression',
            'strengths': [],
            'advice': 'Consider skill refresh, new role, or company move'
        },

        'CAREER_CHANGER': {
            'criteria': {
                'coherence_focus': '< 50',
                'learning_adaptivity': '>= 60',
                'recent_inflection': True
            },
            'description': 'Transitioning between domains with strong learning signals',
            'strengths': ['Adaptable', 'Motivated learner', 'Fresh perspective'],
            'advice': 'Build portfolio in new domain, leverage transferable skills'
        },

        'LEARNING_FOCUSED': {
            'criteria': {
                'learning_adaptivity': '>= 75'
            },
            'description': 'Continuous learner with growth mindset',
            'strengths': ['Rapid learner', 'Always growing', 'Future-ready'],
            'advice': 'Channel learning into impact; consider next big challenge'
        },

        'EXTERNAL_VALIDATOR': {
            'criteria': {
                'external_validation': '>= 70',
                'skill_capital': '>= 60'
            },
            'description': 'Recognized expert with community presence',
            'strengths': ['Visible expert', 'Industry influence', 'Recognized'],
            'advice': 'Leverage visibility for strategic opportunities'
        }
    }

    matched_types = []

    for ptype, config in profile_types.items():
        if matches_criteria(scores, metadata.get('total_years', 0), config['criteria'], trajectory_data):
            matched_types.append(ptype)

    # Return primary type (most specific match)
    primary_type = matched_types[0] if matched_types else 'GENERALIST'

    return {
        'primary_type': primary_type,
        'matched_types': matched_types,
        'description': profile_types[primary_type]['description']
    }


def detect_recent_inflection(trajectory_data: Dict, metadata: Dict) -> bool:
    """
    Detect if career trajectory changed direction recently

    FIX 6: Implement recent_inflection detection

    Returns True if:
    - Last 2 years show positive slope
    - Previous period showed flat/negative slope
    """
    if not trajectory_data or metadata.get('total_years', 0) < 3:
        return False

    # Split timeline into recent (last 2 years) vs previous
    import datetime
    current_year = datetime.date.today().year
    timeline_points = trajectory_data.get('timeline_points', [])

    recent_points = [p for p in timeline_points if p['year'] >= current_year - 2]
    previous_points = [p for p in timeline_points if p['year'] < current_year - 2]

    if len(recent_points) < 2 or len(previous_points) < 2:
        return False

    # Calculate slopes
    recent_slope = calculate_trajectory_slope(recent_points)
    previous_slope = calculate_trajectory_slope(previous_points)

    # Inflection: recent positive, previous flat/negative
    return recent_slope > 0.2 and previous_slope < 0.1


def calculate_trajectory_slope(points: List[Dict]) -> float:
    """Calculate slope of trajectory points"""
    if len(points) < 2:
        return 0

    sorted_points = sorted(points, key=lambda p: p['year'])
    years = [p['year'] for p in sorted_points]
    scores = [p['score'] for p in sorted_points]

    # Simple linear regression
    n = len(years)
    x_mean = sum(years) / n
    y_mean = sum(scores) / n

    numerator = sum((years[i] - x_mean) * (scores[i] - y_mean) for i in range(n))
    denominator = sum((years[i] - x_mean) ** 2 for i in range(n))

    if denominator == 0:
        return 0

    return numerator / denominator


def matches_criteria(scores: Dict, years: float, criteria: Dict, trajectory_data: Dict = None) -> bool:
    """
    Check if scores match profile criteria

    FIX 6: Updated to handle recent_inflection special case
    """

    for dimension, condition in criteria.items():
        if dimension == 'total_years':
            value = years
        elif dimension == 'recent_inflection':
            # Special check for career inflection
            if not detect_recent_inflection(trajectory_data, {'total_years': years}):
                return False
            continue
        else:
            value = scores.get(dimension, 0)

        # Parse and evaluate condition
        if not eval_condition(value, condition):
            return False

    return True


def eval_condition(value: float, condition: str) -> bool:
    """
    Evaluate condition string like ">= 70", "< 50", etc.
    """
    if '>=' in condition:
        threshold = float(condition.split('>=')[1].strip())
        return value >= threshold
    elif '<=' in condition:
        threshold = float(condition.split('<=')[1].strip())
        return value <= threshold
    elif '>' in condition:
        threshold = float(condition.split('>')[1].strip())
        return value > threshold
    elif '<' in condition:
        threshold = float(condition.split('<')[1].strip())
        return value < threshold
    elif '-' in condition and '>' not in condition:
        # Range: "35-65"
        parts = condition.split('-')
        lower = float(parts[0].strip())
        upper = float(parts[1].strip())
        return lower <= value <= upper

    return True
```

---

## 5. Input/Output Schema

### 5.1 Output Schema (Enhanced)

```typescript
interface AssessmentOutput {
  // Overall result
  globalScore: number;        // 0-100
  densityScore: number;       // 0-100 (new)
  level: 'Early' | 'Growing' | 'Solid' | 'Strong' | 'Exceptional';

  // All 7 dimension scores
  dimensions: {
    skillCapital: { score: number; breakdown?: {...} };
    executionImpact: { score: number; breakdown?: {...} };
    learningAdaptivity: { score: number; breakdown?: {...} };
    signalQuality: { score: number; breakdown?: {...} };
    trajectoryMomentum: { score: number; breakdown?: {...} };  // NEW
    coherenceFocus: { score: number; breakdown?: {...} };      // NEW
    externalValidation: { score: number; breakdown?: {...} };  // NEW
  };

  // Profile classification (new)
  profile: {
    primaryType: string;
    description: string;
    matchedTypes: string[];
  };

  // Flags
  flags: {
    // MVP flags
    noSkillsListed: boolean;
    possibleSpam: boolean;
    noExperience: boolean;
    genericDescriptions: boolean;
    noMetrics: boolean;
    parsingFailed: boolean;
    tooShort: boolean;

    // Complete version flags
    stagnantTrajectory: boolean;    // NEW
    recentDecline: boolean;         // NEW
    hyperSpecialized: boolean;      // NEW
    broadExploration: boolean;      // NEW
    noExternalPresence: boolean;    // NEW
    strongOSSContributor: boolean;  // NEW
    visibleSpeaker: boolean;        // NEW
  };

  // Actionable feedback
  feedback: {
    strengths: string[];
    criticalGaps: string[];
    quickWins: Array<{...}>;
    recommendations: string[];
  };

  summary: string;

  // Processing metadata
  meta: {
    processingTime: number;
    timestamp: string;
    version: string;  // "2.0-complete"
  };
}
```

---

## 6. Data Schema and Versioning

### 6.1 Database Schema

```sql
-- All new dimensions should be NULLABLE for backward compatibility
-- FIX 9: Versioning and backward compatibility
CREATE TABLE resume_assessments (
    id UUID PRIMARY KEY,
    user_id UUID,
    version VARCHAR(20),  -- "1.0-mvp" or "2.0-complete"

    -- MVP dimensions (always present)
    skill_capital FLOAT NOT NULL,
    execution_impact FLOAT NOT NULL,
    learning_adaptivity FLOAT NOT NULL,
    signal_quality FLOAT NOT NULL,
    global_score FLOAT NOT NULL,

    -- Complete dimensions (nullable for backward compatibility)
    trajectory_momentum FLOAT NULL,
    coherence_focus FLOAT NULL,
    external_validation FLOAT NULL,
    density_score FLOAT NULL,
    profile_type VARCHAR(50) NULL,

    -- Assessment data
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    resume_hash VARCHAR(64),

    -- Indexing
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_user_version (user_id, version),
    INDEX idx_created_at (created_at)
);
```

### 6.2 UI Handling

```typescript
// If trajectory_momentum is NULL, hide that section
if (assessment.dimensions.trajectoryMomentum === null) {
  showUpgradePrompt("Upgrade to Complete Analysis");
}

// Show version badge
<Badge>{assessment.meta.version}</Badge>

// Allow re-analysis with new engine
<Button>Re-analyze with Complete Engine</Button>

// Migration: Old assessments can be upgraded
async function upgradeAssessment(assessmentId: string) {
  const resume = await getResumeForAssessment(assessmentId);
  const newAssessment = await calculateCompleteAssessment(resume);
  await updateAssessment(assessmentId, newAssessment);
}
```

---

## 7. Key Fixes Applied

### Fix 7: Add Missing Imports

```python
# FIX 7: Add at top of file
import datetime
import math
import re
from typing import List, Dict, Tuple, Optional
```

### Fix 8: Title to Level Limitations Note

```python
# Note: This is a simplified mapping for MVP
# TODO for production:
#   - Handle company-specific levels (L3, L4, T4, etc.)
#   - Consider industry variations
#   - Add machine learning classifier for ambiguous titles
#   - Maintain title normalization database
def title_to_level(title: str) -> int:
    # ... implementation ...
```

### Fix 9: Versioning Strategy

**Rollout Plan:**
1. **Phase 1**: Deploy Complete version alongside MVP
2. **Phase 2**: Default new users to Complete, MVP users can opt-in to re-analysis
3. **Phase 3**: Migrate historical data (add NULL for new dimensions)
4. **Phase 4**: Sunset MVP assessment (keep for reference)

**Backward Compatibility:**
- MVP assessments remain queryable
- Complete assessments marked with version=2.0
- UI shows version badge
- Migration utilities provided

---

## 8. Implementation Checklist

```yaml
Core Dimensions:
  ✅ Skill Capital (from MVP)
  ✅ Execution Impact (from MVP)
  ✅ Learning & Adaptivity (from MVP)
  ✅ Signal Quality (from MVP)
  ✅ Trajectory Momentum (NEW)
  ✅ Coherence & Focus (NEW)
  ✅ External Validation (NEW)

Functions:
  ✅ calculate_global_score_complete (with Fix 1 extraction)
  ✅ apply_constraints_complete (Fix 5)
  ✅ calculate_coherence_focus (with Fix 2 normalization)
  ✅ has_logical_progression (Fix 3)
  ✅ detect_recent_inflection (Fix 6)
  ✅ title_to_level (with Fix 8 note)
  ✅ classify_profile_type (with Fix 6 updates)

Imports:
  ✅ datetime (Fix 7)
  ✅ math (for entropy)
  ✅ re (for patterns)
  ✅ typing (for hints)

Documentation:
  ✅ Fix 8: title_to_level limitations
  ✅ Fix 9: Versioning and backward compatibility

Quality:
  ✅ All dimension scores extracted from objects before use
  ✅ Fixed entropy normalization uses constant 12
  ✅ Logical progression paths match actual categories
  ✅ Safe key access (iterate over weights, not dimensions)
  ✅ Constraints applied for new dimensions
  ✅ Recent inflection detection implemented
```

---

## 9. Success Criteria

**Technical:**
- All 7 dimensions calculate independently
- Global score integrates 7 dimensions correctly
- Backward compatibility maintained for MVP data
- Processing < 5 seconds per resume

**Accuracy:**
- Score variance < 5 points on re-runs
- Profile type classification > 85% accuracy
- Constraint logic correctly caps scores

**User Experience:**
- Clear explanation of all 7 dimensions
- Profile type resonates with users
- Actionable recommendations for all dimensions

---

**Document Version:** 2.0-complete
**Last Updated:** 2025-12-12
**Status:** Implementation-Ready
**All Fixes Applied:** Yes
**Backward Compatible:** Yes
