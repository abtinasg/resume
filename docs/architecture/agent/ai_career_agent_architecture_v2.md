# AI Career Agent Architecture - Complete System Design

## Overview

This document defines the complete architecture for an **AI Career Agent** that runs a user's job search as a comprehensive system, not just a resume helper.

**Context:**
- Target users: Tech roles (SWE, backend, frontend, data, product), mostly junior–mid level
- Markets: US, Europe, and remote positions
- Goal: Reduce confusion, provide clear weekly/daily plans, automate tactical work, and continuously improve based on what works for each user

**Core Philosophy:** The agent doesn't just advise—it executes 70-80% of the work while keeping the user informed and in control.

---

## High-Level Behavior

The agent's primary responsibilities:

1. **Understand** the user's profile, goals, and current job search state
2. **Choose** a sensible strategy based on data and outcomes
3. **Plan** concrete actions (this week / today)
4. **Execute** tactical work using specialized tools:
   - Tailoring resumes
   - Writing cover letters
   - Drafting recruiter messages
   - Planning follow-ups
   - Discovering relevant jobs
5. **Explain** decisions in human-friendly language
6. **Learn** from outcomes and adapt strategies over time

The system is organized into **seven interconnected layers**, each with specific responsibilities:

---

## Layer 1 – Scoring Engine (Evaluation)

**Purpose:** Quantify quality and fit with detailed reasoning.

**Capabilities:**

For any resume:
- Generate `overall_score` (0-100) with breakdown by section:
  - Content quality (relevance, depth)
  - Clarity and readability
  - Impact and metrics
  - Formatting and structure
  - ATS compatibility
  - Technical keyword coverage

For resume + job pairing:
- Generate `job_match_score` (0-100) with analysis:
  - Strengths: What matches well
  - Gaps: What's missing or misaligned
  - Keywords present/missing
  - Experience level fit
  - Technical skills alignment

**Use Cases:**
- Decide if user is ready to apply or must improve resume first
- Compare before/after versions of rewrites
- Filter jobs that are unrealistic for user's profile
- Validate output quality from Rewrite Engine
- Track improvement over time

**Principles:**
- Always provide **numbers + reasoning**, never numbers alone
- Identify top 3 improvement areas with specific suggestions
- Be honest about weaknesses without being discouraging

---

## Layer 2 – Career Path Analyzer (Strategy)

**Purpose:** Choose realistic, high-leverage directions and operational modes.

**Inputs:**
- UserProfile (experience, tech stack, location, salary expectations, goals)
- Current resume(s) and their scores
- Application history and outcomes
- Market data (if available)

**Analysis:**
- Identify realistic **target roles** and seniority levels
- Map possible **transition paths** (e.g., QA → SWE, Mech Eng → Data)
- Assess market fit based on location and tech stack
- Evaluate if user's expectations are realistic

**Output Modes (Strategies):**

1. **IMPROVE_RESUME_FIRST**
   - When: Resume score < 70, or critical gaps in content
   - Behavior: Focus on fixing resume before high-volume applications
   - Weekly target: 2-3 test applications, heavy iteration on resume

2. **AGGRESSIVE_APPLY**
   - When: Resume score > 75, clear target roles, good market fit
   - Behavior: Maximum application volume with smart targeting
   - Weekly target: 15-25 applications

3. **TARGETED_QUALITY**
   - When: Niche roles, senior positions, or specific companies
   - Behavior: Fewer applications but highly customized
   - Weekly target: 5-8 deeply tailored applications

4. **BRIDGE_ROLE_TRANSITION**
   - When: User wants to change careers but lacks direct experience
   - Behavior: Target intermediate roles, emphasize transferable skills
   - Weekly target: 10-15 applications to bridge roles

5. **SKILL_BUILDING_PHASE**
   - When: Major gaps in required skills or experience
   - Behavior: Minimal applications, focus on projects/learning
   - Weekly target: 2-3 applications, recommend skill development

6. **RETHINK_TARGETS**
   - When: High application volume but very low response rate (<2%)
   - Behavior: Re-evaluate roles, seniority, locations, or story
   - Weekly target: Pause bulk applications, test new directions

**Strategy Selection Algorithm:**
```
IF resume_score < 70:
    → IMPROVE_RESUME_FIRST
ELSE IF interview_rate < 0.02 AND applications > 30:
    → RETHINK_TARGETS
ELSE IF target_roles_clear AND market_fit_good:
    IF seniority >= "Senior" OR niche_role:
        → TARGETED_QUALITY
    ELSE:
        → AGGRESSIVE_APPLY
ELSE IF career_change_desired AND experience_gap_large:
    → BRIDGE_ROLE_TRANSITION
ELSE IF critical_skills_missing:
    → SKILL_BUILDING_PHASE
```

---

## Layer 3 – Rewrite Engine (Execution / Writing)

**Purpose:** Execute the heavy lifting of content creation.

**Capabilities:**

**Resume Writing:**
- Rewrite individual bullets for impact and metrics
- Transform weak descriptions into strong, achievement-focused ones
- Tailor entire resume sections for specific roles/jobs
- Optimize keyword density for ATS without keyword stuffing
- Rewrite summaries to match target role

**Application Materials:**
- Draft focused cover letters (200-300 words) tailored to job and company
- Create recruiter outreach messages (LinkedIn, email)
- Write follow-up messages for pending applications
- Draft thank-you notes after interviews

**Principles:**
- **Do 70-80% of the work:** Provide complete drafts, not vague suggestions
- **Maintain truthfulness:** Never invent experience, skills, or achievements
- **Prefer concrete over fluffy:** Metrics, numbers, specific technologies
- **Match user's voice:** Analyze existing content for tone consistency
- **Validate with Scoring Engine:** Every rewrite should improve scores

**Workflow:**
```
1. Receive input (bullet, section, or full resume) + target context
2. Analyze for weaknesses (vague, no metrics, wrong focus)
3. Generate rewrite with improvements
4. Run through Scoring Engine
5. If score doesn't improve significantly, iterate or explain trade-offs
6. Present to user with before/after comparison
```

**Quality Gates:**
- Minimum overall_score improvement: +5 points
- Minimum job_match_score (when tailoring): 75
- All claims must be verifiable from original content
- Technical terms must be accurate

---

## Layer 4 – State & Pipeline Layer (Memory)

**Purpose:** Maintain complete understanding of user's job search over time.

**Data Structures:**

**UserProfile:**
```
{
  id, name, email,
  experience_years,
  current_role, target_roles[],
  tech_stack[], 
  locations[], location_preferences,
  salary_expectations,
  work_authorization,
  preferences: {
    remote_only, company_size, industries[]
  }
}
```

**ResumeVersion:**
```
{
  id, user_id, version_number,
  created_at, last_modified,
  overall_score, section_scores{},
  target_roles[], 
  content{}, 
  is_master_version
}
```

**JobPosting:**
```
{
  id, title, company, location,
  job_url, discovered_at,
  seniority_level, required_skills[],
  salary_range, remote_option,
  match_score, match_reasoning,
  status: "discovered" | "reviewed" | "applied" | "rejected"
}
```

**Application:**
```
{
  id, user_id, job_id, resume_version_id,
  applied_at, status,
  cover_letter_used, outreach_sent,
  last_follow_up,
  outcome: null | "interview" | "offer" | "rejected" | "ghosted"
}
```

**InteractionEvent:**
```
{
  id, user_id, timestamp,
  event_type: "suggestion_accepted" | "suggestion_edited" | 
              "suggestion_rejected" | "manual_action",
  context: {}, 
  metadata: {}
}
```

**StrategyHistory:**
```
{
  id, user_id, strategy_mode,
  activated_at, deactivated_at,
  reason, performance_metrics{}
}
```

**Tracking Metrics:**
- Applications sent (total, per week, per strategy mode)
- Response rate (callbacks / total applications)
- Interview conversion rate
- Time-to-response distribution
- Most successful job types/companies
- User engagement patterns

**Usage:**
- Avoid repeating failed strategies
- Recognize when volume is too low or quality targeting is wrong
- Schedule follow-ups automatically
- Identify patterns in successful vs unsuccessful applications
- Provide data for Learning Engine

---

## Layer 5 – Orchestrator / Planner (Decision & Planning)

**Purpose:** Convert strategy + state into concrete, prioritized action plans.

**Inputs:**
- Current strategy mode (from Career Path Analyzer)
- Resume quality scores (from Scoring Engine)
- Current state and pipeline (from State Layer)
- Available jobs (from Job Discovery Module)
- Recent outcomes and patterns

**Decision Framework:**

**Priority Scoring Algorithm:**
```python
def calculate_priority(action_type, user_state):
    score = 0
    
    # Resume quality factors
    if action_type == "improve_resume":
        if resume_score < 70:
            score += 50
        elif resume_score < 80 and applications > 20:
            score += 30
    
    # Application volume factors
    if action_type == "apply":
        if applications_this_week < 5:
            score += 40
        if strategy_mode == "AGGRESSIVE_APPLY":
            score += 30
    
    # Follow-up factors
    if action_type == "follow_up":
        days_since_application = calculate_days()
        if 7 <= days_since_application <= 10:
            score += 35
        elif days_since_application > 10:
            score += 20
    
    # Strategy reassessment factors
    if action_type == "rethink_strategy":
        if applications > 30 and interview_rate < 0.02:
            score += 60
    
    return score
```

**Output Format - Weekly Plan:**
```
Week Goal: [e.g., "Send 12 high-quality applications, improve resume summary"]

Priority Actions:
1. [HIGH] Fix resume summary section (score: 65 → target: 80+)
2. [HIGH] Apply to 3 senior backend roles (Go/Kubernetes focus)
3. [MEDIUM] Send follow-ups for 2 applications from last week
4. [MEDIUM] Apply to 5 mid-level positions (broader criteria)
5. [LOW] Research 3 companies for next week's targets

Daily Breakdown:
Monday: Action 1 (resume fix)
Tuesday: Actions 2a, 2b (2 applications)
Wednesday: Action 3 (follow-ups)
Thursday: Actions 2c, 4a, 4b (3 applications)
Friday: Actions 4c, 4d, 5 (2 applications + research)
```

**Tool Orchestration:**

For "Prepare tailored application":
```
1. Fetch job posting details
2. Select best matching resume version
3. Call Scoring Engine for job_match_score
4. If score < 70: Call Rewrite Engine to tailor resume
5. Call Rewrite Engine for cover letter
6. Call Rewrite Engine for outreach message (if needed)
7. Validate all outputs with Scoring Engine
8. Present complete package to user
```

For "Improve resume section":
```
1. Call Scoring Engine to identify weakest sections
2. For top 3 weak sections:
   - Call Rewrite Engine with improvement goals
   - Validate with Scoring Engine
   - Compare before/after scores
3. Present improvements with score deltas
```

For "Rethink strategy":
```
1. Analyze recent application outcomes
2. Call Career Path Analyzer with updated data
3. Generate alternative target roles/locations
4. Present comparison and recommendation
5. If accepted, update strategy mode
```

**Constraints & Trade-offs:**
- **User capacity:** Don't plan more than user can realistically execute
- **Quality vs quantity:** Balance based on strategy mode
- **Timing:** Respect application cadence (not too fast, creates desperation signal)
- **Resource limits:** API costs, user time, mental energy

**Conflict Resolution:**
- If multiple high-priority actions → Choose based on strategy mode
- If user's request conflicts with optimal plan → Explain trade-off, let user decide
- If insufficient data → Be conservative, gather more info first

---

## Layer 6 – Job Discovery & Matching Module

**Purpose:** Continuously find relevant opportunities and filter for fit.

**Job Sources:**

**Automated Discovery:**
- Job board APIs: LinkedIn, Indeed, Monster, Glassdoor
- Tech-specific: AngelList, Hired, Dice, Stack Overflow Jobs
- Remote-focused: We Work Remotely, Remote.co, FlexJobs
- Company career pages (for target companies list)
- GitHub Jobs, Y Combinator jobs

**Discovery Strategy:**
```
Daily automated searches based on:
- User's target roles + variations
- User's tech stack (keywords)
- User's preferred locations
- Saved company lists
- Similar successful applications
```

**Smart Filtering Pipeline:**

**Stage 1: Basic Filters**
- Location compatibility (including remote)
- Seniority level match (±1 level flexibility)
- Required vs nice-to-have skills differentiation
- Visa/work authorization requirements

**Stage 2: Scoring & Ranking**
- Calculate match_score using Scoring Engine
- Consider: skills overlap, experience fit, location, company stage
- Flag: reaches (ambitious), targets (good fit), safeties (high probability)

**Stage 3: Diversity & Strategy**
- Ensure variety in company sizes
- Balance between reaches and safeties
- Avoid over-concentration in one company/location
- Align with current strategy mode

**Output:**
- Daily digest of top 10-15 new jobs
- Weekly summary of 50+ jobs organized by fit level
- Auto-flagging of "must-apply" opportunities

**Quality Control:**
- Remove obvious scams/low-quality postings
- De-duplicate across job boards
- Check company reputation (Glassdoor scores)
- Verify job posting recency

---

## Layer 7 – Learning & Optimization Engine

**Purpose:** Learn from outcomes and continuously improve strategies.

**Data Collection:**

**Per Application:**
- Time to response (if any)
- Type of response (rejection, interview request, ghosted)
- Job characteristics (role, seniority, location, company)
- Resume version and tailoring applied
- Strategy mode at time of application

**Per User:**
- Which strategies yielded best response rates
- Which resume versions performed best
- Which job types/companies responded most
- Which rewrite patterns were most accepted
- User satisfaction with recommendations

**Analysis Outputs:**

**Individual User Level:**
```
PersonalizedInsights {
  best_performing_roles: ["Backend Engineer", "DevOps Engineer"],
  best_locations: ["Remote EU", "Berlin"],
  best_companies: ["Series A startups", "50-200 employees"],
  optimal_application_time: "Tuesday-Thursday mornings",
  response_rate_by_strategy: {
    "AGGRESSIVE_APPLY": 0.03,
    "TARGETED_QUALITY": 0.08
  },
  resume_version_performance: {...}
}
```

**Pattern Recognition:**
- If interview_rate drops after strategy change → Flag for review
- If certain keywords consistently correlate with responses → Boost in rewrites
- If user edits agent suggestions in consistent way → Learn preferences
- If response rate varies by day/time of application → Optimize timing

**Optimization Actions:**

**Automatic Adjustments:**
- Boost/lower priority for certain job types based on user's success
- Adjust match_score thresholds based on actual outcomes
- Fine-tune rewrite engine keyword selection
- Optimize follow-up timing based on response patterns

**Strategy Recommendations:**
```
if applications > 50 AND interview_rate < 0.02:
    recommend: "Your current targets may be too senior or specialized"
    suggest: "Try mid-level roles or adjacent positions"
    
if interview_rate > 0.08 AND offer_rate < 0.3:
    recommend: "You're getting interviews but not converting"
    suggest: "Focus on interview prep, not more applications"
```

**A/B Testing Framework:**
- Test different resume versions in parallel
- Test different outreach message templates
- Test different job types within same user profile
- Measure performance over 2-4 week windows

**Market-Level Learning (Anonymized):**
- Which strategies work best for junior vs mid-level
- Which tech stacks have highest demand
- Which locations have best response rates
- Seasonal patterns in hiring

**Feedback Loop:**
```
Outcomes → Analysis → Update Weights → Adjust Strategy → New Actions → Outcomes
```

**Privacy & Ethics:**
- All cross-user learning uses anonymized data
- Individual outcomes never shared
- User can opt out of contributing to market learning
- Transparent about what's being learned and why

---

## Layer 8 – AI Coach / Explainer (Human Interface)

**Purpose:** Make the system transparent, collaborative, and trustworthy.

**Communication Principles:**

**Explain Decisions:**
- Why certain jobs are recommended or skipped
- Why suggesting resume improvements vs more applications
- Why proposing strategy changes
- What outcomes influenced current recommendations

**Example Explanations:**
```
✓ "I'm recommending these 3 Backend Engineer roles because they match 
   your Go and Kubernetes experience, are mid-level (matching your 3 years), 
   and are in your target locations (Berlin/Remote EU). Your resume scores 
   78/100 for these, which is strong."

✓ "You've sent 25 applications in 3 weeks with no interviews. This suggests 
   possible mismatch in role targeting. I see two paths: (1) Try slightly 
   more junior titles, or (2) Add more projects showing system design skills. 
   Which direction interests you?"

✓ "I'm prioritizing fixing your resume summary this week because it's currently 
   scoring 62/100 (your lowest section), and it's the first thing recruiters 
   read. This could be limiting your response rate."
```

**Maintain Control:**
- Present options with trade-offs, not mandates
- Ask for confirmation on major strategy shifts
- Respect user's priorities and constraints
- Allow overriding of recommendations
- Remember user's preferences for future

**Manage Expectations:**
- Be honest about probabilities, not guarantees
- Acknowledge uncertainty where it exists
- Explain typical timelines (e.g., "Most responses come within 2 weeks")
- Frame rejections as normal part of process

**Progressive Disclosure:**
- Start with high-level summary
- Offer details on request ("Want to see the full analysis?")
- Don't overwhelm with metrics unless user wants them
- Adapt verbosity to user's engagement level

**Tone Guidelines:**
- **Professional but friendly:** Warm without being casual
- **Actionable:** Always include next concrete steps
- **Honest:** About challenges and limitations
- **Encouraging:** Frame setbacks as learning opportunities
- **Respectful:** User is the decision maker

**Response Templates:**

**Weekly Check-in:**
```
"Hey [Name], here's your plan for this week:

🎯 Main Goal: Send 10 targeted applications + improve summary section

This Week's Focus:
- [Monday-Tuesday] Fix your resume summary (currently 65/100)
- [Wednesday-Friday] Apply to 10 backend roles I've lined up
- [Friday] Send follow-ups for 3 pending applications

Why this plan? Your resume is almost ready (78/100 overall), but the summary 
needs work before we go high-volume. I've found 15 great matches for you.

Ready to start? Let's tackle the summary first."
```

**Strategy Change:**
```
"I notice you've sent 30 applications over 4 weeks with 1 interview (3% rate). 
This is below typical (5-8% for your profile).

Possible reasons:
1. Roles might be too senior (you're applying to 5+ year positions)
2. Resume story unclear (you switched from QA → Backend)
3. Locations may have higher competition

My recommendation: Let's test 10 "Software Engineer" (not "Senior") roles 
next week and see if response rate improves.

Alternatively, we could add a stronger transition project to your resume first.

What feels right to you?"
```

**Encouragement After Rejection:**
```
"Just logged the rejection from [Company]. That's your 4th this week—I know 
it's discouraging.

Context: At your stage, 5-8% interview rate is normal. You're at 4% after 25 
applications, which is just slightly below average. This is not unusual.

Your next 3 applications are to companies where your background is an even 
stronger match. Let's keep momentum going."
```

---

## System Integration & Workflows

**Core Workflow Examples:**

### Workflow 1: New User Onboarding
```
1. User uploads resume → Scoring Engine evaluates
2. Coach explains score + top improvement areas
3. User provides goals → Career Path Analyzer determines strategy
4. Orchestrator creates first week plan (likely: IMPROVE_RESUME_FIRST)
5. Rewrite Engine fixes top issues
6. Job Discovery starts populating pipeline
7. Coach presents complete onboarding summary
```

### Workflow 2: Daily Agent Execution
```
Morning (automated):
1. Job Discovery finds new matches
2. State Layer checks for follow-up triggers
3. Orchestrator updates today's priority list
4. Coach sends daily briefing to user

User interaction:
5. User reviews and approves/modifies plan
6. Agent executes: rewrites, applications, follow-ups
7. User reviews drafts, provides feedback
8. Agent learns from accepted/rejected suggestions

Evening:
9. State Layer logs all outcomes
10. Learning Engine analyzes patterns
11. Coach sends end-of-day summary
```

### Workflow 3: Strategy Pivot
```
Trigger: Low interview rate after 30+ applications

1. Learning Engine flags concerning pattern
2. Orchestrator pauses bulk applications
3. Career Path Analyzer runs deep analysis:
   - Compare user's targets vs outcomes
   - Analyze successful vs failed applications
   - Generate alternative strategy options
4. Coach explains situation with data:
   - "Here's what I'm seeing..."
   - "Here are 3 possible directions..."
5. User selects new direction
6. Orchestrator creates transition plan
7. System executes with new strategy mode
8. Learning Engine tracks if pivot improves outcomes
```

---

## Quality Assurance & Safety

**Guard Rails:**

**Truthfulness:**
- Never invent experience, projects, or skills
- All resume content must be verifiable from user's original input
- Flag if user tries to add false information

**Tone Safety:**
- Avoid desperate-sounding language
- No excessive flattery of companies
- Maintain professional dignity

**Output Validation:**
- All rewrites must pass minimum score thresholds
- Cover letters max 300 words (respects recruiter time)
- Outreach messages max 150 words

**Human-in-the-Loop:**
- All applications require explicit user approval
- Strategy changes need confirmation
- Major resume changes shown as diffs for review

**Failure Handling:**
- If Scoring Engine gives low score after rewrite → Retry or explain limitation
- If Job Discovery finds no matches → Explain why, suggest broadening criteria
- If Learning Engine detects negative pattern → Pause and surface to user

---

## Technical Implementation Considerations

**API Design:**
- Each layer should have clear, well-defined interfaces
- Layers communicate through structured data (JSON schemas)
- Orchestrator is the only layer that calls multiple other layers
- Coach layer translates all technical outputs to human language

**State Management:**
- Persistent storage for all user data and history
- Event sourcing for application pipeline
- Versioning for resumes and strategies
- Audit log for all agent decisions

**Performance:**
- Cache scoring results for unchanged resumes
- Batch job discovery (daily, not per-request)
- Rate limit external API calls
- Pre-compute match scores for new jobs

**Scalability:**
- Each layer should be independently scalable
- Job Discovery can run as background service
- Learning Engine can process in batches
- Real-time components: Orchestrator, Coach

**Error Handling:**
- Graceful degradation (if one layer fails, others continue)
- Clear error messages to user
- Retry logic for transient failures
- Fallback strategies (e.g., if API down, use cached data)

---

## Success Metrics

**User-Level KPIs:**
- Interview rate per 100 applications
- Time to first interview
- Time to first offer
- User satisfaction score
- Weekly application completion rate

**Agent-Level KPIs:**
- Resume score improvement over time
- Match score accuracy (predicted vs actual outcome)
- Strategy effectiveness (response rate per mode)
- User engagement (% of suggestions accepted)
- Learning velocity (how quickly patterns are detected)

**Business-Level KPIs:**
- User retention (% still active after 4 weeks)
- Success rate (% who get offers within 12 weeks)
- Premium conversion rate
- Word-of-mouth / referrals
- Competitive win rate vs other tools

---

## Future Enhancements

**Phase 1 (Months 1-3):** Core 8 layers working end-to-end
**Phase 2 (Months 4-6):** Advanced learning, A/B testing, market insights
**Phase 3 (Months 7-12):** 
- Interview prep coaching
- Salary negotiation assistance
- Career path planning (multi-year)
- Network building recommendations
- Company culture fit analysis

---

## Conclusion

This 8-layer architecture transforms a resume tool into a true AI career agent that:

1. **Thinks strategically** (Career Path Analyzer)
2. **Evaluates objectively** (Scoring Engine)
3. **Executes tactically** (Rewrite Engine)
4. **Remembers context** (State Layer)
5. **Discovers opportunities** (Job Discovery Module)
6. **Plans intelligently** (Orchestrator)
7. **Learns continuously** (Learning Engine)
8. **Communicates clearly** (AI Coach)

The user gets a system that does 70-80% of the work, explains its decisions, adapts to their specific situation, and continuously improves over time.

**When asked to "act as the agent," reason through all 8 layers and present outputs that are both technically sound and human-readable.**
