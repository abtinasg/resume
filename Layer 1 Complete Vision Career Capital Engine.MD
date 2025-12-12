

# Layer 1 Complete Vision: Career Capital Engine
## Advanced Specification Document

---

## 1. Executive Summary

### 1.1 Purpose
The **Career Capital Engine Complete Version** represents the full realization of our generic resume assessment system. While the MVP (v1.0) provides foundational scoring across 4 dimensions, the Complete Version introduces advanced analytics including trajectory analysis, coherence scoring, external validation, and predictive capabilities.

### 1.2 Evolution from MVP

```
MVP (4 Dimensions)              Complete (7 Dimensions + Advanced)
├── Skill Capital               ├── Skill Capital (Enhanced)
├── Execution Impact            ├── Execution Impact (Enhanced)
├── Learning Adaptivity         ├── Learning Adaptivity (Enhanced)
└── Signal Quality              ├── Signal Quality (Enhanced)
                                ├── Trajectory Momentum (NEW) 🔥
                                ├── Coherence & Focus (NEW) 🔥
                                ├── External Validation (NEW) 🔥
                                └── Advanced Features:
                                    ├── Density Score
                                    ├── Profile Type Classification
                                    ├── Industry-Specific Calibration
                                    └── ML-Based Predictions
```

### 1.3 Key Innovations

**What makes this world-class:**

1. **Trajectory Momentum** - Linear regression on career progression over time
2. **Coherence & Focus** - Entropy-based analysis of career narrative consistency
3. **Density Score** - Value per year of experience (√ normalization)
4. **Profile Type Classification** - 8+ distinct career archetypes
5. **Predictive Capabilities** - Interview likelihood estimation (with sufficient data)

### 1.4 Target Outcomes

**For Users:**
- Understand not just "where am I?" but "where am I going?"
- See trajectory and momentum, not just current state
- Receive career archetype classification with tailored advice

**For Business:**
- Differentiation through unique metrics competitors don't have
- Defensible moat via proprietary algorithms
- Foundation for ML-based enhancements
- Premium tier justification ($29/mo vs free)

---

## 2. Complete Architecture

### 2.1 System Flow

```
┌─────────────────────────────────────────────┐
│  Enhanced Resume Parser                     │
│  - Temporal extraction (start/end dates)    │
│  - Role level inference                     │
│  - Industry classification                  │
│  - Technology timeline building             │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│  7 Core Dimensions (Parallel Processing)    │
│  ┌──────────────┐  ┌─────────────────────┐ │
│  │Skill Capital │  │Execution Impact     │ │
│  │(Enhanced)    │  │(Enhanced)           │ │
│  └──────────────┘  └─────────────────────┘ │
│  ┌──────────────┐  ┌─────────────────────┐ │
│  │Learning &    │  │Signal Quality       │ │
│  │Adaptivity    │  │(Enhanced)           │ │
│  └──────────────┘  └─────────────────────┘ │
│  ┌──────────────┐  ┌─────────────────────┐ │
│  │Trajectory    │  │Coherence & Focus    │ │
│  │Momentum 🔥   │  │(Entropy) 🔥         │ │
│  └──────────────┘  └─────────────────────┘ │
│  ┌──────────────┐                          │
│  │External      │                          │
│  │Validation 🔥 │                          │
│  └──────────────┘                          │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│  Advanced Analytics                         │
│  - Density Score Calculation                │
│  - Profile Type Classification (8 types)    │
│  - Career Stage Detection                   │
│  - Industry-Specific Calibration            │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│  Predictive Layer (Data-Dependent)          │
│  - Interview Probability Estimation         │
│  - Success Pattern Matching                 │
│  - Optimal Path Recommendations             │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│  Rich Output Generation                     │
│  - Multi-dimensional scores                 │
│  - Profile archetype                        │
│  - Trajectory visualization data            │
│  - Personalized roadmap                     │
└─────────────────────────────────────────────┘
```

### 2.2 Data Requirements

**Minimum for Full Functionality:**

```yaml
Resume Data:
  - Complete work history with dates
  - Detailed bullet points with context
  - Skills section
  - Education
  - Projects/certifications (optional but valuable)

Enhanced Extraction:
  - Role titles → level mapping (Junior/Mid/Senior/Lead)
  - Industries → classification taxonomy
  - Technologies → timeline of adoption
  - Team size, scope, impact indicators

For Predictive Features (Post-Launch):
  - 10,000+ tracked outcomes (interview/offer results)
  - Industry benchmarks
  - Company-specific patterns
```

---

## 3. New Dimensions (Complete Only)

### 3.1 Trajectory Momentum 🔥

#### 3.1.1 Definition

**Trajectory Momentum** measures the **rate of career progression** over time by analyzing how quickly someone advances through role levels (Junior → Mid → Senior → Lead/Manager).

**Why it matters:**
- Differentiates high-growth individuals from stagnant ones
- Captures "potential" that current-state scoring misses
- Predicts future success better than static metrics

#### 3.1.2 Core Algorithm

```python
def calculate_trajectory_momentum(experiences: List[Experience]) -> Dict:
    """
    Trajectory Momentum using Linear Regression on Role Levels
    
    Algorithm:
    1. Map each job title to numerical level (0-5 scale)
    2. Plot (year, level) points
    3. Calculate regression slope
    4. Normalize to 0-100 score
    
    Returns:
        Dict with score, slope, flags, and interpretation
    """
    
    # Step 1: Map titles to levels
    timeline_points = []
    
    for exp in experiences:
        level = title_to_level(exp.title)
        # Use midpoint of employment for time
        midpoint_year = exp.start_year + (exp.duration_years / 2)
        
        timeline_points.append({
            'year': midpoint_year,
            'level': level,
            'title': exp.title
        })
    
    # Sort by year
    timeline_points.sort(key=lambda p: p['year'])
    
    if len(timeline_points) < 2:
        return {
            'score': 50,  # Neutral for insufficient data
            'slope': 0,
            'flags': ['INSUFFICIENT_DATA'],
            'message': 'Need at least 2 positions to calculate trajectory'
        }
    
    # Step 2: Linear regression
    years = [p['year'] for p in timeline_points]
    levels = [p['level'] for p in timeline_points]
    
    slope, intercept = calculate_linear_regression(years, levels)
    
    # Step 3: Normalize slope to score
    # Typical good slope: +0.3 to +0.5 levels per year
    # Typical bad slope: -0.1 to 0 levels per year
    
    MIN_SLOPE = -0.15
    MAX_SLOPE = 0.5
    
    # Clamp and normalize
    clamped_slope = max(MIN_SLOPE, min(MAX_SLOPE, slope))
    normalized = (clamped_slope - MIN_SLOPE) / (MAX_SLOPE - MIN_SLOPE)
    
    score = normalized * 100
    
    # Step 4: Detect patterns and flags
    flags = []
    
    if slope < 0:
        flags.append('DECLINING_TRAJECTORY')
    elif slope < 0.05:
        flags.append('STAGNANT_TRAJECTORY')
    elif slope > 0.3:
        flags.append('HIGH_MOMENTUM')
    
    # Detect if they've been at same level for 5+ years
    if detect_long_stagnation(timeline_points):
        flags.append('LONG_TERM_STAGNATION')
        score = min(score, 40)  # Cap score
    
    return {
        'score': round(score, 1),
        'slope': round(slope, 3),
        'flags': flags,
        'breakdown': {
            'positions_analyzed': len(timeline_points),
            'career_span_years': max(years) - min(years),
            'starting_level': levels[0],
            'current_level': levels[-1],
            'levels_gained': levels[-1] - levels[0]
        }
    }


def title_to_level(title: str) -> int:
    """
    Map job title to career level (0-5 scale)
    
    Levels:
        0 = Intern / Entry
        1 = Junior / Associate
        2 = Mid-Level / Specialist
        3 = Senior / Expert
        4 = Lead / Staff / Principal
        5 = Manager / Director / VP
    """
    title_lower = title.lower()
    
    # Intern/Entry
    if any(word in title_lower for word in ['intern', 'trainee', 'entry']):
        return 0
    
    # Junior
    if any(word in title_lower for word in ['junior', 'jr', 'associate', 'i ']):
        return 1
    
    # Senior
    if any(word in title_lower for word in ['senior', 'sr', 'expert', 'specialist']):
        return 3
    
    # Lead/Staff
    if any(word in title_lower for word in ['lead', 'staff', 'principal', 'architect']):
        return 4
    
    # Manager/Director
    if any(word in title_lower for word in ['manager', 'director', 'head', 'vp', 'chief']):
        return 5
    
    # Default: Mid-level
    return 2

# Note: This is a simplified mapping for MVP
# TODO for production:
#   - Handle company-specific levels (L3, L4, T4, etc.)
#   - Consider industry variations
#   - Add machine learning classifier for ambiguous titles
#   - Maintain title normalization database


def calculate_linear_regression(x: List[float], y: List[float]) -> Tuple[float, float]:
    """
    Calculate slope and intercept for linear regression
    
    Returns: (slope, intercept)
    """
    import statistics
    
    n = len(x)
    mean_x = statistics.mean(x)
    mean_y = statistics.mean(y)
    
    # Calculate slope
    numerator = sum((x[i] - mean_x) * (y[i] - mean_y) for i in range(n))
    denominator = sum((x[i] - mean_x) ** 2 for i in range(n))
    
    slope = numerator / denominator if denominator != 0 else 0
    intercept = mean_y - slope * mean_x
    
    return slope, intercept


def detect_long_stagnation(timeline_points: List[Dict]) -> bool:
    """
    Check if person has been at same level for 5+ consecutive years
    """
    if len(timeline_points) < 2:
        return False
    
    # Check last 5 years
    recent_points = [p for p in timeline_points if p['year'] >= max(p['year'] for p in timeline_points) - 5]
    
    if len(recent_points) < 2:
        return False
    
    levels = [p['level'] for p in recent_points]
    return max(levels) == min(levels)  # All same level
```

#### 3.1.3 Scoring Examples

**Example A: High Momentum (Rising Star)**
```python
Input:
  2018: Junior Developer (level 1)
  2020: Mid-Level Developer (level 2)
  2022: Senior Developer (level 3)
  2024: Lead Engineer (level 4)

Calculation:
  Years: [2019, 2021, 2023, 2025]
  Levels: [1, 2, 3, 4]
  Slope: 0.5 (excellent progression)
  
  normalized = (0.5 - (-0.15)) / (0.5 - (-0.15)) = 1.0
  score = 1.0 * 100 = 100

Output:
  score: 100/100
  flags: ['HIGH_MOMENTUM']
  interpretation: "Exceptional career progression - gaining level every 2 years"
```

**Example B: Stagnant (Plateau)**
```python
Input:
  2015: Senior Developer (level 3)
  2017: Senior Developer (level 3)
  2020: Senior Developer (level 3)
  2024: Senior Developer (level 3)

Calculation:
  Years: [2016, 2018.5, 2022, 2024.5]
  Levels: [3, 3, 3, 3]
  Slope: 0.0 (no progression)
  
  normalized = (0 - (-0.15)) / 0.65 = 0.23
  score = 0.23 * 100 = 23

Output:
  score: 23/100
  flags: ['STAGNANT_TRAJECTORY', 'LONG_TERM_STAGNATION']
  interpretation: "No career progression in 9+ years - consider seeking growth opportunities"
```

**Example C: Declining (Setback)**
```python
Input:
  2018: Lead Engineer (level 4)
  2020: Senior Developer (level 3)
  2023: Mid-Level Developer (level 2)

Calculation:
  Years: [2019, 2021, 2024]
  Levels: [4, 3, 2]
  Slope: -0.4 (declining)
  
  normalized = (-0.15 - (-0.15)) / 0.65 = 0
  score = 0

Output:
  score: 0/100
  flags: ['DECLINING_TRAJECTORY']
  interpretation: "Career regression detected - may indicate personal circumstances or industry shift"
```

**Example D: Steady Growth**
```python
Input:
  2018: Junior Developer (level 1)
  2021: Mid Developer (level 2)
  2024: Senior Developer (level 3)

Calculation:
  Years: [2019.5, 2022.5, 2025]
  Levels: [1, 2, 3]
  Slope: 0.33 (good progression)
  
  normalized = (0.33 - (-0.15)) / 0.65 = 0.74
  score = 74

Output:
  score: 74/100
  flags: []
  interpretation: "Solid career progression - advancing roughly every 3 years"
```

---

### 3.2 Coherence & Focus 🔥

#### 3.2.1 Definition

**Coherence & Focus** measures how **consistent and purposeful** a person's career narrative is using entropy analysis. Too scattered = low coherence. Too narrow = potentially limiting. Sweet spot = focused but adaptable.

**Why it matters:**
- Recruiters value clear career stories
- Scattered experience raises red flags
- Coherent progression suggests intentionality
- Differentiates "explorer" from "wanderer"

#### 3.2.2 Core Algorithm

```python
def calculate_coherence_focus(experiences: List[Experience]) -> Dict:
    """
    Coherence & Focus using Shannon Entropy
    
    Algorithm:
    1. Categorize each role into domain categories
    2. Calculate time spent in each category
    3. Compute entropy of distribution
    4. Score based on optimal entropy range
    
    Optimal: Medium entropy (0.3-0.6 normalized)
    Too low: Over-specialized
    Too high: Scattered/unfocused
    """
    
    # Step 1: Categorize all experiences
    category_time = {}  # {category: months}
    total_months = 0
    
    for exp in experiences:
        categories = categorize_role(exp.title, exp.description)
        months = exp.duration_months
        
        # If role spans multiple categories, split time
        for category in categories:
            if category not in category_time:
                category_time[category] = 0
            category_time[category] += months / len(categories)
        
        total_months += months
    
    if total_months == 0:
        return {
            'score': 50,
            'entropy': 0,
            'flags': ['NO_EXPERIENCE'],
            'message': 'No work experience to analyze'
        }
    
    # Step 2: Calculate probability distribution
    distribution = {
        cat: time / total_months 
        for cat, time in category_time.items()
    }
    
    # Step 3: Calculate Shannon Entropy
    import math
    entropy_raw = -sum(p * math.log2(p) for p in distribution.values() if p > 0)

    # Normalize by FIXED taxonomy size (all possible categories)
    MAX_POSSIBLE_CATEGORIES = 12  # Total number of job categories in taxonomy
    max_entropy = math.log2(MAX_POSSIBLE_CATEGORIES)
    normalized_entropy = entropy_raw / max_entropy if max_entropy > 0 else 0
    
    # Step 4: Score based on optimal range
    # Optimal entropy: 0.35 to 0.65 (focused but diverse)
    OPTIMAL_MIN = 0.35
    OPTIMAL_MAX = 0.65
    OPTIMAL_CENTER = 0.50
    
    if OPTIMAL_MIN <= normalized_entropy <= OPTIMAL_MAX:
        # Within optimal range - score based on closeness to center
        distance_from_center = abs(normalized_entropy - OPTIMAL_CENTER)
        score = 100 - (distance_from_center * 100)
    else:
        # Outside optimal range
        if normalized_entropy < OPTIMAL_MIN:
            # Too focused/narrow
            score = 70 + (normalized_entropy / OPTIMAL_MIN) * 30
        else:
            # Too scattered
            excess = normalized_entropy - OPTIMAL_MAX
            score = max(30, 70 - (excess * 200))
    
    # Step 5: Generate flags
    flags = []
    
    if normalized_entropy < 0.2:
        flags.append('HIGHLY_SPECIALIZED')
    elif normalized_entropy > 0.8:
        flags.append('SCATTERED')
    
    # Check for logical progression
    if has_logical_progression(list(distribution.keys())):
        flags.append('LOGICAL_PROGRESSION')
        score = min(100, score + 5)  # Bonus
    
    return {
        'score': round(score, 1),
        'entropy': round(normalized_entropy, 3),
        'flags': flags,
        'breakdown': {
            'categories': distribution,
            'dominant_category': max(distribution, key=distribution.get),
            'num_categories': num_categories,
            'time_distribution': {
                k: f"{v*100:.1f}%" 
                for k, v in distribution.items()
            }
        }
    }


def categorize_role(title: str, description: str) -> List[str]:
    """
    Categorize a role into one or more domains
    
    Categories:
        - Backend Engineering
        - Frontend Engineering
        - Full Stack Engineering
        - DevOps / Infrastructure
        - Data Engineering
        - Machine Learning / AI
        - Product Management
        - Design (UI/UX)
        - Management / Leadership
        - Marketing
        - Sales
        - Operations
    """
    text = (title + " " + description).lower()
    categories = []
    
    # Backend
    if any(word in text for word in ['backend', 'api', 'server', 'microservice', 'database']):
        categories.append('Backend Engineering')
    
    # Frontend
    if any(word in text for word in ['frontend', 'react', 'vue', 'angular', 'ui', 'css']):
        categories.append('Frontend Engineering')
    
    # Full Stack
    if 'full stack' in text or 'fullstack' in text:
        categories.append('Full Stack Engineering')
    
    # DevOps
    if any(word in text for word in ['devops', 'kubernetes', 'docker', 'ci/cd', 'infrastructure']):
        categories.append('DevOps / Infrastructure')
    
    # Data
    if any(word in text for word in ['data engineer', 'etl', 'pipeline', 'spark', 'hadoop']):
        categories.append('Data Engineering')
    
    # ML/AI
    if any(word in text for word in ['machine learning', 'ml', 'ai', 'deep learning', 'model']):
        categories.append('Machine Learning / AI')
    
    # Product
    if any(word in text for word in ['product manager', 'product owner', 'roadmap']):
        categories.append('Product Management')
    
    # Design
    if any(word in text for word in ['designer', 'ux', 'ui/ux', 'figma', 'sketch']):
        categories.append('Design (UI/UX)')
    
    # Management
    if any(word in text for word in ['manager', 'director', 'head of', 'vp ', 'cto', 'lead']):
        categories.append('Management / Leadership')
    
    # Marketing
    if any(word in text for word in ['marketing', 'growth', 'seo', 'content', 'social media']):
        categories.append('Marketing')
    
    # Sales
    if any(word in text for word in ['sales', 'account executive', 'business development']):
        categories.append('Sales')
    
    # Operations
    if any(word in text for word in ['operations', 'ops', 'logistics', 'supply chain']):
        categories.append('Operations')
    
    # Default: use title as category if nothing matched
    if not categories:
        categories.append('Other')
    
    return categories


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

#### 3.2.3 Scoring Examples

**Example A: Highly Focused (Single Domain)**
```python
Input:
  10 years: 100% Backend Engineering
  
Calculation:
  distribution = {'Backend Engineering': 1.0}
  entropy_raw = 0 (only one category)
  normalized_entropy = 0
  
  score = 70 + (0 / 0.35) * 30 = 70

Output:
  score: 70/100
  entropy: 0.0
  flags: ['HIGHLY_SPECIALIZED']
  interpretation: "Deep expertise in one area, but may lack breadth"
```

**Example B: Optimal Coherence (Focused + Diverse)**
```python
Input:
  5 years Backend (50%)
  3 years Full Stack (30%)
  2 years DevOps (20%)

Calculation:
  distribution = {'Backend': 0.5, 'Full Stack': 0.3, 'DevOps': 0.2}
  entropy_raw = -(0.5*log2(0.5) + 0.3*log2(0.3) + 0.2*log2(0.2))
               ≈ 1.485

  max_entropy = log2(12) = 3.585
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

**Example C: Scattered (Too Many Domains)**
```python
Input:
  Backend (20%)
  Frontend (15%)
  Marketing (15%)
  Sales (15%)
  Design (15%)
  Operations (10%)
  Product (10%)
  
Calculation:
  7 categories with fairly even distribution
  entropy_raw ≈ 2.7
  max_entropy = log2(12) = 3.58
  normalized = 2.7/3.58 = 0.75
  
  This is > 0.65 (optimal max)
  excess = 0.75 - 0.65 = 0.10
  score = max(30, 70 - (0.10 * 200)) = max(30, 50) = 50

Output:
  score: 50/100
  entropy: 0.75
  flags: ['SCATTERED']
  interpretation: "Career path lacks focus - consider specializing"
```

**Example D: Logical Progression**
```python
Input:
  Frontend (3 years, 30%)
  Full Stack (4 years, 40%)
  Backend (3 years, 30%)
  
Calculation:
  3 categories, logical progression
  entropy ≈ 0.48 (in optimal range)
  
  base_score = 95 (very close to center)
  + logical_progression_bonus = +5
  final_score = 100

Output:
  score: 100/100
  entropy: 0.48
  flags: ['LOGICAL_PROGRESSION']
  interpretation: "Excellent - clear growth path from Frontend to Backend"
```

---

### 3.3 External Validation 🔥

#### 3.3.1 Definition

**External Validation** measures **third-party recognition** of competence through open source contributions, conference talks, awards, publications, and credible certifications.

**Why it matters:**
- Strong signal of expertise beyond self-reported claims
- Shows community engagement and thought leadership
- Rare (most people score low) → high signal when present
- Directly correlates with senior/staff+ roles

#### 3.3.2 Core Algorithm

```python
def calculate_external_validation(profile: Profile) -> Dict:
    """
    External Validation Score
    
    Components:
        - Open Source Contributions (high value)
        - Conference Talks / Publications (high value)
        - Awards / Competitions (medium value)
        - Strong Certifications (medium value)
        - Recommendations / Endorsements (low value)
    
    Note: Most people will score low here (0-20)
    This is a differentiator for top candidates
    """
    
    points = 0
    flags = []
    breakdown = {}
    
    # Open Source (0-30 points)
    oss_points = calculate_oss_contribution(profile.github, profile.oss_projects)
    points += oss_points
    breakdown['open_source'] = oss_points
    
    if oss_points > 20:
        flags.append('STRONG_OSS_CONTRIBUTOR')
    
    # Talks & Publications (0-30 points)
    talks_points = calculate_talks_publications(profile.talks, profile.publications)
    points += talks_points
    breakdown['talks_publications'] = talks_points
    
    if talks_points > 20:
        flags.append('THOUGHT_LEADER')
    
    # Awards & Competitions (0-20 points)
    awards_points = calculate_awards(profile.awards)
    points += awards_points
    breakdown['awards'] = awards_points
    
    # Certifications (0-15 points)
    cert_points = calculate_strong_certifications(profile.certifications)
    points += cert_points
    breakdown['certifications'] = cert_points
    
    # Professional Network (0-5 points)
    network_points = calculate_network_signals(profile.linkedin_data)
    points += network_points
    breakdown['network'] = network_points
    
    # Total capped at 100
    total_points = min(points, 100)
    
    # Most people will be in 0-30 range
    if total_points < 10:
        flags.append('LIMITED_EXTERNAL_VALIDATION')
    elif total_points > 60:
        flags.append('EXCEPTIONAL_EXTERNAL_VALIDATION')
    
    return {
        'score': round(total_points, 1),
        'flags': flags,
        'breakdown': breakdown,
        'message': interpret_external_validation(total_points)
    }


def calculate_oss_contribution(github: GitHubProfile, oss_projects: List[OSSProject]) -> float:
    """
    Score open source contributions (max 30 points)
    
    Factors:
        - Repos with significant stars (>100)
        - Contributions to major projects
        - Maintainer roles
        - Consistent activity
    """
    points = 0
    
    if not github:
        return 0
    
    # Own projects with stars
    for repo in github.owned_repos:
        if repo.stars >= 1000:
            points += 10  # Major project
        elif repo.stars >= 100:
            points += 5   # Notable project
        elif repo.stars >= 10:
            points += 2   # Active project
    
    # Contributions to major OSS
    major_oss_contribs = [p for p in oss_projects if p.is_major_project]
    points += min(len(major_oss_contribs) * 5, 15)
    
    # Maintainer role
    if github.is_maintainer_of_major_project:
        points += 10
    
    # Consistent activity (commits in last year)
    if github.commits_last_year > 200:
        points += 5
    elif github.commits_last_year > 50:
        points += 2
    
    return min(points, 30)


def calculate_talks_publications(talks: List[Talk], pubs: List[Publication]) -> float:
    """
    Score speaking and writing (max 30 points)
    
    Factors:
        - Conference talks (major/minor)
        - Publications (peer-reviewed/blog)
        - Podcast appearances
        - Course authoring
    """
    points = 0
    
    # Conference talks
    for talk in talks:
        if talk.is_major_conference:  # PyCon, React Conf, AWS re:Invent, etc.
            points += 8
        elif talk.is_meetup or talk.is_minor_conference:
            points += 3
    
    # Publications
    for pub in pubs:
        if pub.is_peer_reviewed:
            points += 6
        elif pub.is_major_publication:  # Medium, Dev.to with high views
            points += 3
        else:
            points += 1
    
    return min(points, 30)


def calculate_awards(awards: List[Award]) -> float:
    """
    Score awards and competitions (max 20 points)
    """
    points = 0
    
    for award in awards:
        if award.is_international:
            points += 10
        elif award.is_national:
            points += 6
        elif award.is_company_or_regional:
            points += 3
    
    return min(points, 20)


def calculate_strong_certifications(certs: List[Certification]) -> float:
    """
    Score credible certifications (max 15 points)

    Only count:
        - Major cloud providers (AWS, GCP, Azure)
        - Professional designations (PMP, CFA)
        - Advanced technical (CCIE, etc)

    Exclude:
        - Udemy certificates
        - Generic courses
        - Outdated certifications
    """
    import datetime

    points = 0

    strong_cert_keywords = [
        'AWS Certified Solutions Architect',
        'GCP Professional',
        'Azure',
        'Kubernetes',
        'PMP',
        'CCIE',
        'CISSP',
    ]

    for cert in certs:
        # Check if it's a strong certification
        if any(keyword in cert.name for keyword in strong_cert_keywords):
            # Check recency
            if cert.year >= datetime.date.today().year - 3:
                points += 5
            else:
                points += 2  # Older but still valid
    
    return min(points, 15)


def calculate_network_signals(linkedin: LinkedInData) -> float:
    """
    Score professional network (max 5 points)
    
    Low weight - easy to game
    """
    if not linkedin:
        return 0
    
    points = 0
    
    # Recommendations
    if linkedin.recommendations > 10:
        points += 3
    elif linkedin.recommendations > 5:
        points += 2
    elif linkedin.recommendations > 0:
        points += 1
    
    # Endorsements (very low value)
    if linkedin.endorsements > 100:
        points += 2
    elif linkedin.endorsements > 50:
        points += 1
    
    return min(points, 5)


def interpret_external_validation(score: float) -> str:
    """Generate interpretation message"""
    if score < 10:
        return "Limited external validation - consider contributing to OSS or speaking at meetups"
    elif score < 30:
        return "Some external validation present - good foundation"
    elif score < 60:
        return "Strong external validation - well-recognized in community"
    else:
        return "Exceptional external validation - thought leader status"
```

#### 3.3.3 Scoring Examples

**Example A: No External Validation (Typical)**
```python
Input:
  GitHub: Empty or private repos only
  No talks
  No publications
  Generic certifications (Udemy)
  
Output:
  score: 5/100
  breakdown: {
    open_source: 0,
    talks_publications: 0,
    awards: 0,
    certifications: 5,
    network: 0
  }
  flags: ['LIMITED_EXTERNAL_VALIDATION']
  interpretation: "Limited external validation - consider contributing to OSS"
```

**Example B: Moderate Validation (Active)**
```python
Input:
  GitHub: 2 repos with 50+ stars each
  1 meetup talk
  2 blog posts on Medium
  AWS Solutions Architect cert
  
Calculation:
  oss: 2*2 = 4
  talks: 1*3 = 3
  publications: 2*3 = 6
  certs: 5
  network: 0
  
  total: 4 + 3 + 6 + 5 = 18

Output:
  score: 18/100
  interpretation: "Some external validation present - good foundation"
```

**Example C: Strong Validation (Recognized Expert)**
```python
Input:
  GitHub: 1 repo with 2000 stars, maintainer of React library
  3 conference talks (2 major, 1 minor)
  4 technical blog posts with high engagement
  AWS Pro + Kubernetes cert
  15 LinkedIn recommendations
  
Calculation:
  oss: 10 (major project) + 10 (maintainer) + 5 (activity) = 25
  talks: 2*8 + 1*3 = 19
  publications: 4*3 = 12
  certs: 5 + 5 = 10
  network: 3
  
  total: 25 + 19 + 12 + 10 + 3 = 69

Output:
  score: 69/100
  flags: ['STRONG_OSS_CONTRIBUTOR', 'THOUGHT_LEADER', 'EXCEPTIONAL_EXTERNAL_VALIDATION']
  interpretation: "Exceptional external validation - thought leader status"
```

---

## 4. Advanced Features

### 4.1 Density Score

#### 4.1.1 Definition

**Density Score** measures **value per year of experience** using square root normalization to account for diminishing returns.

**Formula:**
```
DensityScore = GlobalScore / √(years_of_experience)
```

**Why √ normalization?**
- Linear growth assumption is unrealistic
- First 2 years you learn a lot, next 10 years growth slows
- √ captures this: √1=1, √4=2, √9=3, √16=4
- Someone with score 80 in 4 years is MORE impressive than score 80 in 16 years

#### 4.1.2 Implementation

```python
def calculate_density_score(global_score: float, total_years: float) -> Dict:
    """
    Density Score: Value per Year
    
    Measures learning efficiency and growth rate
    """
    import math
    
    if total_years < 0.5:
        # Too early to judge
        return {
            'density_score': 0,
            'message': 'Need at least 6 months experience to calculate density'
        }
    
    # Prevent division by very small numbers
    years = max(total_years, 0.5)
    
    # Calculate density
    density_raw = global_score / math.sqrt(years)
    
    # Normalize to 0-100 scale
    # Theoretical max: 100 / √0.5 = 141
    # Practical max: 100 / √1 = 100
    # Good density: 60+ at 4 years (60/2 = 30), 80+ at 1 year
    
    density_score = min(density_raw, 100)
    
    # Interpret
    if density_score > 70:
        interpretation = "Exceptional growth rate"
    elif density_score > 50:
        interpretation = "Strong growth rate"
    elif density_score > 30:
        interpretation = "Moderate growth rate"
    else:
        interpretation = "Slower growth - may need acceleration"
    
    return {
        'density_score': round(density_score, 1),
        'years': years,
        'global_score': global_score,
        'interpretation': interpretation
    }
```

#### 4.1.3 Examples

```python
# Example A: Rapid learner
global_score = 75
years = 2
density = 75 / √2 = 75 / 1.41 = 53.2
→ "Strong growth rate"

# Example B: Senior but steady
global_score = 85
years = 12
density = 85 / √12 = 85 / 3.46 = 24.6
→ "Moderate growth rate"

# Example C: Rising star
global_score = 80
years = 3
density = 80 / √3 = 80 / 1.73 = 46.2
→ "Strong growth rate"

# Comparison:
Person A: Score 80, 3 years → Density 46.2
Person B: Score 80, 12 years → Density 23.1
→ Person A is growing 2x faster!
```

---

### 4.2 Profile Type Classification

#### 4.2.1 Definition

Classifies candidates into **8 distinct career archetypes** based on dimension patterns.

#### 4.2.2 Archetypes

```python
PROFILE_TYPES = {
    'RISING_STAR': {
        'criteria': {
            'trajectory_momentum': '>= 70',
            'learning_adaptivity': '>= 70',
            'density_score': '>= 50'
        },
        'description': 'High momentum learner with rapid career progression',
        'strengths': ['Fast learner', 'High potential', 'Growth mindset'],
        'advice': 'Continue accelerating - consider larger scope roles'
    },
    
    'STABLE_EXPERT': {
        'criteria': {
            'skill_capital': '>= 80',
            'trajectory_momentum': '< 50',
            'coherence_focus': '>= 70'
        },
        'description': 'Deep expertise in focused domain, stable trajectory',
        'strengths': ['Deep knowledge', 'Reliable', 'Focused'],
        'advice': 'Consider branching out or taking leadership roles'
    },
    
    'TECHNICAL_LEADER': {
        'criteria': {
            'skill_capital': '>= 75',
            'execution_impact': '>= 80',
            'external_validation': '>= 40'
        },
        'description': 'Strong technical skills with proven impact and recognition',
        'strengths': ['Technical depth', 'Proven results', 'Community presence'],
        'advice': 'Natural fit for Staff/Principal roles'
    },
    
    'CAREER_CHANGER': {
        'criteria': {
            'coherence_focus': '< 50',
            'learning_adaptivity': '>= 60',
            # 'trajectory_momentum': 'recent_inflection'  # TODO: Implement in v2.1
        },
        'description': 'Transitioning between domains with strong learning signals',
        'strengths': ['Adaptable', 'Motivated learner', 'Fresh perspective'],
        'advice': 'Build portfolio in new domain, leverage transferable skills'
    },
    
    'HIGH_POTENTIAL_JUNIOR': {
        'criteria': {
            'total_years': '< 3',
            'learning_adaptivity': '>= 70',
            'execution_impact': '>= 60'
        },
        'description': 'Early career with strong learning and execution',
        'strengths': ['Hungry to learn', 'Quick results', 'High ceiling'],
        'advice': 'Seek mentorship and challenging projects'
    },
    
    'STAGNANT_MID': {
        'criteria': {
            'trajectory_momentum': '< 30',
            'learning_adaptivity': '< 40',
            'total_years': '>= 5'
        },
        'description': 'Mid-level with limited recent growth',
        'strengths': ['Experience', 'Reliable execution'],
        'advice': 'URGENT: Upskill, seek new challenges, or pivot'
    },
    
    'SCATTERED_EXPLORER': {
        'criteria': {
            'coherence_focus': '< 40',
            'trajectory_momentum': '< 50',
            'learning_adaptivity': '>= 50'
        },
        'description': 'Diverse experience but lacks clear direction',
        'strengths': ['Versatile', 'Adaptable', 'Broad exposure'],
        'advice': 'Choose a focus area and build depth'
    },
    
    'BALANCED_PROFESSIONAL': {
        'criteria': {
            'default': True
        },
        'description': 'Well-rounded profile without extremes',
        'strengths': ['Reliable', 'Balanced', 'Steady'],
        'advice': 'Identify one area to amplify for differentiation'
    }
}


def classify_profile_type(scores: Dict, years: float) -> Dict:
    """
    Classify candidate into profile type
    
    Returns archetype with personalized insights
    """
    
    for profile_type, config in PROFILE_TYPES.items():
        if profile_type == 'BALANCED_PROFESSIONAL':
            continue  # This is default fallback
        
        if matches_criteria(scores, years, config['criteria']):
            return {
                'type': profile_type,
                'description': config['description'],
                'strengths': config['strengths'],
                'advice': config['advice']
            }
    
    # Default
    return {
        'type': 'BALANCED_PROFESSIONAL',
        'description': PROFILE_TYPES['BALANCED_PROFESSIONAL']['description'],
        'strengths': PROFILE_TYPES['BALANCED_PROFESSIONAL']['strengths'],
        'advice': PROFILE_TYPES['BALANCED_PROFESSIONAL']['advice']
    }


def matches_criteria(scores: Dict, years: float, criteria: Dict) -> bool:
    """Check if scores match archetype criteria"""
    
    for dimension, condition in criteria.items():
        if dimension == 'total_years':
            value = years
        elif dimension == 'recent_inflection':
            # Special check for career changes
            continue  # Simplified for spec
        else:
            value = scores.get(dimension, 0)
        
        # Parse condition (e.g., ">= 70")
        if not eval_condition(value, condition):
            return False
    
    return True
```

---

### 4.3 Industry-Specific Calibration

#### 4.3.1 Purpose

Different industries value different dimensions. Calibrate weights accordingly.

#### 4.3.2 Industry Weights

```python
INDUSTRY_WEIGHTS = {
    'tech_startup': {
        'skill_capital': 0.35,
        'execution_impact': 0.30,
        'learning_adaptivity': 0.20,
        'trajectory_momentum': 0.10,
        'signal_quality': 0.05,
        'coherence_focus': 0.00,
        'external_validation': 0.00
    },
    
    'big_tech': {
        'skill_capital': 0.30,
        'execution_impact': 0.25,
        'learning_adaptivity': 0.10,
        'trajectory_momentum': 0.10,
        'signal_quality': 0.10,
        'coherence_focus': 0.05,
        'external_validation': 0.10
    },
    
    'finance': {
        'skill_capital': 0.25,
        'execution_impact': 0.30,
        'learning_adaptivity': 0.05,
        'trajectory_momentum': 0.15,
        'signal_quality': 0.15,
        'coherence_focus': 0.05,
        'external_validation': 0.05
    },
    
    'generic': {
        # Default weights (balanced)
        'skill_capital': 0.25,
        'execution_impact': 0.25,
        'learning_adaptivity': 0.15,
        'trajectory_momentum': 0.15,
        'signal_quality': 0.10,
        'coherence_focus': 0.05,
        'external_validation': 0.05
    }
}
```

---

### 4.4 Predictive Capabilities (Data-Dependent)

#### 4.4.1 Interview Probability Prediction

**Requirements:**
- 10,000+ tracked outcomes
- Industry-specific data
- Job type patterns

**Algorithm (Simplified):**

```python
def predict_interview_probability(
    scores: Dict,
    job_context: JobContext,
    historical_data: DataFrame
) -> Dict:
    """
    Predict interview likelihood based on historical patterns
    
    Note: Requires substantial outcome data
    Only available post-launch after data collection
    """
    
    if len(historical_data) < 1000:
        return {
            'probability': None,
            'confidence': 0,
            'message': 'Insufficient data for prediction'
        }
    
    # Find similar profiles that applied to similar jobs
    similar_profiles = historical_data[
        (historical_data['global_score'] >= scores['global_score'] - 10) &
        (historical_data['global_score'] <= scores['global_score'] + 10) &
        (historical_data['industry'] == job_context.industry) &
        (historical_data['role_level'] == job_context.level)
    ]
    
    if len(similar_profiles) < 50:
        confidence = 'low'
    elif len(similar_profiles) < 200:
        confidence = 'medium'
    else:
        confidence = 'high'
    
    # Calculate success rate
    interview_rate = similar_profiles['got_interview'].mean()
    
    return {
        'probability': round(interview_rate, 2),
        'confidence': confidence,
        'based_on': f'{len(similar_profiles)} similar candidates',
        'message': f'{interview_rate*100:.0f}% of similar profiles got interviews'
    }
```

---

## 5. Complete Scoring Logic

### 5.1 Dimension Weights (Complete)

```python
WEIGHTS_COMPLETE = {
    'skill_capital': 0.25,
    'execution_impact': 0.20,
    'learning_adaptivity': 0.15,
    'signal_quality': 0.10,
    'trajectory_momentum': 0.15,    # NEW
    'coherence_focus': 0.05,        # NEW
    'external_validation': 0.10     # NEW
}
```

### 5.2 Global Score Calculation (Complete)

```python
def calculate_global_score_complete(dimensions: Dict, metadata: Dict) -> Dict:
    """
    Complete version with all 7 dimensions
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
    
    # Calculate density score
    density = calculate_density_score(final_score, metadata['total_years'])

    # Classify profile type
    profile_type = classify_profile_type(dim_scores, metadata['total_years'])

    # Determine level
    level = determine_level_complete(final_score, density['density_score'])

    return {
        'global_score': round(final_score, 1),
        'level': level,
        'density_score': density['density_score'],
        'profile_type': profile_type,
        'dimensions': dim_scores,
        'weights_used': weights,
        'signal_factor': signal_factor
    }


def apply_constraints_complete(score: float, dim_scores: Dict, metadata: Dict) -> float:
    """
    Apply hard caps based on dimension flags and metadata

    Complete version includes trajectory and coherence constraints
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

    return score


def determine_level_complete(score: float, density: float) -> str:
    """
    Enhanced level determination using both score and density
    """
    
    # Exceptional: High score AND high density
    if score >= 85 and density >= 50:
        return 'Exceptional'
    
    # Strong: High score OR high density
    elif score >= 75 or (score >= 70 and density >= 45):
        return 'Strong'
    
    # Solid: Above average
    elif score >= 55:
        return 'Solid'
    
    # Growing: Below average but improving
    elif score >= 35:
        return 'Growing'
    
    # Early: Just starting
    else:
        return 'Early'
```

---

## 6. Complete Output Schema

```typescript
interface CompleteAssessmentOutput {
  // Core results
  globalScore: number;
  level: 'Early' | 'Growing' | 'Solid' | 'Strong' | 'Exceptional';
  densityScore: number;
  profileType: {
    type: string;
    description: string;
    strengths: string[];
    advice: string;
  };
  
  // All 7 dimensions
  dimensions: {
    skillCapital: DimensionScore;
    executionImpact: DimensionScore;
    learningAdaptivity: DimensionScore;
    signalQuality: DimensionScore;
    trajectoryMomentum: DimensionScore;      // NEW
    coherenceFocus: DimensionScore;          // NEW
    externalValidation: DimensionScore;      // NEW
  };
  
  // Advanced analytics
  analytics: {
    careerSpanYears: number;
    levelsProgressed: number;
    trajectorySlope: number;
    entropyScore: number;
    dominantCategory: string;
    growthRate: 'rapid' | 'steady' | 'slow' | 'stagnant';
  };
  
  // Predictions (if data available)
  predictions?: {
    interviewProbability: number;
    confidence: 'low' | 'medium' | 'high';
    basedOnSamples: number;
  };
  
  // Comprehensive feedback
  feedback: {
    strengths: string[];
    criticalGaps: string[];
    quickWins: Action[];
    longTermPath: Action[];
    recommendations: string[];
  };
  
  // Visualizations data
  visualizations: {
    trajectoryChart: Array<{year: number, level: number}>;
    categoryDistribution: Record<string, number>;
    dimensionRadar: Record<string, number>;
  };
  
  // Metadata
  meta: {
    processingTime: number;
    timestamp: string;
    version: string;  // "2.0-complete"
    industry: string;
    weightsUsed: Record<string, number>;
  };
}
```

---

## 7. Implementation Roadmap

### 7.1 Phase 2: Enhanced (Post-MVP, Weeks 9-12)

```yaml
Additions:
  - Trajectory Momentum (basic version)
  - Enhanced skill taxonomy (2000+ skills)
  - Basic industry calibration
  
Estimated Effort: 3 weeks
LOC: +2000
```

### 7.2 Phase 3: Advanced (Months 4-6)

```yaml
Additions:
  - Coherence & Focus (full entropy)
  - External Validation
  - Density Score
  - Profile Type Classification
  - Enhanced feedback generation
  
Estimated Effort: 6 weeks
LOC: +3000
```

### 7.3 Phase 4: Intelligent (Months 6-12)

```yaml
Additions:
  - ML-based calibration
  - Predictive capabilities
  - Real-time benchmarking
  - Industry-specific models
  - Multi-language support

Estimated Effort: 12 weeks
LOC: +5000
Data Requirements: 10K+ outcomes
```

### 7.4 Data Schema and Versioning

**Database Schema:**
```sql
-- All new dimensions should be NULLABLE for backward compatibility
CREATE TABLE resume_assessments (
    id UUID PRIMARY KEY,
    user_id UUID,
    version VARCHAR(20),  -- "1.0-mvp" or "2.0-complete"

    -- MVP dimensions (always present)
    skill_capital FLOAT NOT NULL,
    execution_impact FLOAT NOT NULL,
    learning_adaptivity FLOAT NOT NULL,
    signal_quality FLOAT NOT NULL,

    -- Complete dimensions (nullable)
    trajectory_momentum FLOAT NULL,
    coherence_focus FLOAT NULL,
    external_validation FLOAT NULL,
    density_score FLOAT NULL,
    profile_type VARCHAR(50) NULL,

    -- ...
);
```

**UI Handling:**
- If `trajectory_momentum` is NULL, hide that section
- Show "Upgrade to Complete Analysis" CTA for MVP results
- Allow re-analysis of old resumes with new engine

---

## 8. Competitive Analysis

### 8.1 What Competitors Have

```yaml
Jobscan:
  - Basic ATS scoring
  - Keyword matching
  - Job-specific only

Resume Worded:
  - Template scoring
  - Grammar checks
  - Generic feedback

Teal:
  - Resume builder
  - Basic analysis
  - Job tracking
```

### 8.2 Our Unique Advantages

```yaml
ResumeIQ Complete:
  ✅ Trajectory Momentum (no one has this)
  ✅ Coherence & Focus (unique approach)
  ✅ Density Score (novel metric)
  ✅ Profile archetypes (personalized)
  ✅ Job-agnostic + Job-specific modes
  ✅ Predictive capabilities (with data)
  ✅ 7 dimensions vs competitors' 2-3
```

**Competitive Moat:**
- Proprietary algorithms (can't be easily copied)
- Network effects (more data → better predictions)
- Novel metrics (Trajectory, Density, Coherence)

---

## 9. Success Metrics (Complete)

### 9.1 Technical Metrics

```yaml
Accuracy:
  - Trajectory slope accuracy: ± 0.05
  - Entropy calculation precision: 100%
  - Profile type classification accuracy: > 75%
  - Prediction accuracy (when available): > 70%

Performance:
  - Processing time: < 8 seconds
  - All dimension calculations: < 5 seconds
  - Prediction query: < 2 seconds
```

### 9.2 User Metrics

```yaml
Engagement:
  - Premium conversion rate: > 15%
  - Time on results page: > 3 minutes
  - Share rate: > 20%
  - Return rate after improvements: > 50%

Satisfaction:
  - NPS score: > 40
  - "Insights were valuable": > 85%
  - "Helped career planning": > 70%
```

### 9.3 Business Metrics

```yaml
Revenue:
  - Premium subscriptions: 1000+ in 6 months
  - Retention rate: > 60% (monthly)
  - Upgrade rate (free→premium): > 10%

Market Position:
  - User reviews mention "unique insights": > 50%
  - Competitor comparison: "More detailed than X": > 70%
```

---

## 10. Data Privacy & Ethics

### 10.1 Privacy Considerations

```yaml
Data Collection:
  - All outcome tracking is OPT-IN
  - Users can delete data anytime
  - Anonymized for analysis
  - GDPR/CCPA compliant

Transparency:
  - Clear explanation of all scores
  - Show what data influences what
  - No black boxes
```

### 10.2 Bias Mitigation

```yaml
Concerns:
  - Trajectory penalizes career breaks (parenting, health)
  - External validation biases toward privileged
  - Coherence penalizes career changers
  
Mitigations:
  - Allow users to explain gaps
  - Profile type classification helps changers
  - Never use as sole factor
  - Human-in-loop for final decisions
  - Regular bias audits
```

---

## 11. Testing Strategy

### 11.1 Unit Tests

```python
# Test trajectory calculation
test_trajectory_rising_star()
test_trajectory_stagnant()
test_trajectory_declining()
test_trajectory_insufficient_data()

# Test coherence
test_coherence_single_domain()
test_coherence_optimal_diversity()
test_coherence_scattered()

# Test external validation
test_external_validation_none()
test_external_validation_strong()

# Test density
test_density_rapid_learner()
test_density_steady_growth()
```

### 11.2 Integration Tests

```python
test_complete_assessment_flow()
test_all_dimensions_integrate_correctly()
test_profile_type_classification()
test_industry_specific_weights()
```

### 11.3 Regression Tests

```yaml
Freeze Scores:
  - 20 real resumes
  - Expected scores locked
  - Alert on any change > 5 points
  - Manual review for changes
```

---

## 12. Monitoring & Observability

### 12.1 Key Metrics to Track

```yaml
System Health:
  - Processing time p50, p95, p99
  - Error rate by dimension
  - Cache hit rate

Score Distribution:
  - Global score histogram
  - Dimension score distributions
  - Profile type frequencies
  
User Behavior:
  - Which dimensions users focus on
  - Most common improvements made
  - Correlation: score change → user action
```

### 12.2 Alerts

```yaml
Critical:
  - Error rate > 1%
  - Processing time > 15 seconds
  - Prediction confidence < 30%

Warning:
  - Score drift > 10 points on same resume
  - Unusual score distribution
  - Low diversity in profile types
```

---

## 13. Future Research Directions

### 13.1 Advanced ML Models

```yaml
Opportunities:
  - Deep learning for resume parsing
  - NLP for impact extraction
  - Embedding models for skill matching
  - Time series for trajectory prediction
  - Graph neural nets for career path modeling
```

### 13.2 Multimodal Analysis

```yaml
Beyond Resume:
  - GitHub activity patterns
  - Stack Overflow reputation
  - LinkedIn engagement
  - Portfolio website quality
  - Video interview analysis
```

### 13.3 Real-Time Guidance

```yaml
Vision:
  - Live feedback as user writes resume
  - A/B test suggestions before applying
  - Real-time market positioning
  - Dynamic career path optimization
```

---

**End of Layer 1 Complete Vision**

**Document Version:** 2.0-complete  
**Last Updated:** 2025-01-15  
**Status:** Specification for Post-MVP Development  
**Dependencies:** MVP (v1.0) must be completed first

---

