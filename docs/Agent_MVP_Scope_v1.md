# ResumeIQ AI Career Agent - MVP Scope v1

**Version:** 1.0  
**Target Timeline:** 6-8 weeks  
**Status:** LOCKED for implementation

---

## Goal of v1

**Success = Shipping a working AI career agent that demonstrates agent behavior, not just resume tooling.**

Core success criteria:
1. **Strategic Intelligence:** Agent selects and switches between strategy modes based on user state (resume quality, application volume, outcomes)
2. **Proactive Planning:** Agent generates weekly targets and daily task lists that guide user's job search
3. **Execution Ownership:** Agent does 70-80% of tactical work (rewriting, tailoring, drafting messages) - user reviews and approves
4. **Guided Discovery:** Agent generates smart job search queries and scores/filters user-provided jobs - no passive tool behavior
5. **Continuous Tracking:** Agent maintains application pipeline and suggests follow-ups based on time and status

**User perception test:** If users say "the agent is managing my job search" rather than "this tool helps me write better resumes" = SUCCESS.

---

## In Scope for v1

### Layer 1: Scoring Engine

**What it does:**
- Analyzes uploaded resumes and produces:
  - Overall score (0-100)
  - Section scores (content, clarity, impact, formatting, ATS compatibility)
  - Top 3 specific improvement areas with reasoning
- For resume + job pairing:
  - Job match score (0-100)
  - Strengths (what matches well)
  - Gaps (what's missing or misaligned)

**v1 Implementation:**
- Use existing scoring logic (already built in current MVP)
- Scoring happens on-demand (not background processing)
- Results stored in database for comparison and history

**Not in v1:**
- Competitive scoring (comparing to other resumes)
- Industry-specific scoring models
- Real-time ATS parsing simulation

---

### Layer 2: Career Path Analyzer (Strategy Brain)

**What it does:**
- Determines user's current strategy mode based on state
- Switches modes automatically when conditions change
- Calculates appropriate weekly application targets per mode

**v1 Strategy Modes (3 total):**

**1. IMPROVE_RESUME_FIRST**
- **Trigger:** resume_score < 75 OR critical gaps flagged by Scoring Engine
- **Behavior:** Prioritize resume improvements over volume
- **Weekly target:** 2-3 test applications max, focus on rewriting weak sections
- **Query generation:** Conservative searches (best-fit roles only)

**2. APPLY_MODE**
- **Trigger:** resume_score >= 75 AND total_applications < 30
- **Behavior:** Balanced volume with quality
- **Weekly target:** 8-12 applications
- **Query generation:** Diverse searches across target roles and locations

**3. RETHINK_TARGETS**
- **Trigger:** total_applications >= 30 AND interview_rate < 0.02 (2%)
- **Behavior:** Pause bulk applications, test alternative targeting
- **Weekly target:** 3-5 applications to different role types/seniority/locations
- **Query generation:** Adjacent roles, broader geography, explicit seniority variations

**Mode Switching Logic:**
```
Check conditions in priority order:
1. If resume_score < 75 → IMPROVE_RESUME_FIRST (always)
2. Else if applications >= 30 AND interview_rate < 0.02 → RETHINK_TARGETS
3. Else → APPLY_MODE (default for healthy state)

Re-evaluate mode:
- After every resume rewrite (score may change)
- After every 10 applications
- When user reports interview or rejection
```

**Not in v1:**
- BRIDGE_ROLE_TRANSITION mode (v2)
- SKILL_BUILDING_PHASE mode (v2)
- ML-based mode selection (v2+)
- User can override mode manually (v2)

---

### Layer 3: Rewrite Engine

**What it does:**
- Rewrites resume bullets for impact and metrics
- Tailors resume sections to specific job descriptions
- Generates cover letters (200-300 words)
- Drafts recruiter outreach messages (LinkedIn/email)

**v1 Implementation:**
- Uses Claude/GPT API for generation
- Each rewrite includes before/after comparison
- Validates output with Scoring Engine (must improve score by +5 minimum)
- Maintains user's voice/tone from original content

**Rewrite Quality Gates:**
- No invented experience or skills
- All claims must be verifiable from original resume
- Metrics preferred over vague claims
- Technical terms must be accurate

**Not in v1:**
- Multiple rewrite variations for A/B testing
- Style/tone customization controls
- Industry-specific templates

---

### Layer 4: State & Pipeline

**What it does:**
- Tracks user's complete job search state
- Maintains application pipeline with statuses
- Logs all user interactions for future learning

**Core Entities:**
- **UserProfile:** Basic info (name, email, experience_years, target_roles[], tech_stack[], locations[], work_authorization)
- **ResumeVersion:** Versioned resumes with scores (overall_score, section_scores{}, created_at, is_master)
- **JobPosting:** User-provided jobs (title, company, location, url, seniority_level, required_skills[], match_score)
- **Application:** Pipeline tracking (job_id, resume_version_id, status, applied_at, cover_letter_used, last_follow_up, outcome)
- **InteractionEvent:** All agent interactions (event_type, timestamp, context{}, metadata{})

**Application Status Flow:**
```
draft → submitted → (no_response | interview_scheduled | rejected)
interview_scheduled → (offer | rejected)
```

**Not in v1:**
- Company research data
- Salary negotiation tracking
- Interview prep notes
- Network contacts

---

### Layer 5: Orchestrator / Planner

**What it does:**
- Converts strategy mode + current state into concrete action plans
- Generates weekly targets and daily task lists
- Prioritizes actions based on strategy and urgency

**v1 Planning:**

**Weekly Plan Structure:**
```
{
  week_goal: string (e.g., "Send 8 applications + improve summary section"),
  strategy_mode: "IMPROVE_RESUME_FIRST" | "APPLY_MODE" | "RETHINK_TARGETS",
  target_applications: number (based on mode),
  priority_actions: Action[] (max 5-7 for the week),
  reasoning: string (why this plan makes sense)
}
```

**Daily Plan Structure:**
```
{
  date: Date,
  tasks: Task[] (max 3-5 tasks),
  estimated_time: string (e.g., "45 minutes"),
  focus_area: string (e.g., "applications" | "resume_improvement" | "follow_ups")
}
```

**Priority Scoring (Simple Algorithm for v1):**
```typescript
function calculatePriority(action: Action, state: UserState): number {
  let score = 0;
  
  // Resume improvement priorities
  if (action.type === 'improve_resume' && state.resume_score < 75) {
    score += 50;
  }
  
  // Application priorities
  if (action.type === 'apply') {
    if (state.applications_this_week < state.weekly_target) {
      score += 40;
    }
    if (action.job.match_score > 80) {
      score += 20; // High-match jobs get priority
    }
  }
  
  // Follow-up priorities
  if (action.type === 'follow_up') {
    const daysSince = daysSinceApplication(action.application);
    if (daysSince >= 7 && daysSince <= 10) {
      score += 35; // Optimal follow-up window
    }
  }
  
  return score;
}
```

**Not in v1:**
- ML-based prioritization
- Multi-day lookahead planning
- Resource allocation optimization
- Conflict resolution for competing actions

---

### Layer 6: Job Discovery (Query-Based, No API)

**What it does:**
- Generates smart, strategy-aware job search queries
- Provides pre-constructed search URLs for major job boards
- Explains reasoning behind each suggested search
- Scores and filters user-provided job postings

**v1 Query Generation Behavior:**

**IMPROVE_RESUME_FIRST Mode:**
```
Queries: Conservative, best-fit only
Example:
- "Backend Engineer Go Kubernetes Berlin" (exact match)
Reasoning: "Your resume needs improvement (score: 68/100). 
           Let's test with 2-3 perfect-fit roles while we fix the summary."
Boards: LinkedIn, Indeed
Count: 1-2 queries
```

**APPLY_MODE:**
```
Queries: Diverse across roles and locations
Example:
- "Backend Engineer Go Berlin"
- "Software Engineer Go Kubernetes remote EU"
- "Platform Engineer Go Berlin"
Reasoning: "Your resume is strong (score: 82/100). Casting a wider net 
           across Backend/Platform roles in Berlin and remote EU."
Boards: LinkedIn, Indeed, RemoteOK
Count: 3-4 queries
```

**RETHINK_TARGETS Mode:**
```
Queries: Alternative roles, seniority, geography
Example:
- "Software Engineer II Go" (explicit mid-level)
- "DevOps Engineer Go Kubernetes" (adjacent role)
- "Backend Engineer Go remote" (broader geography)
Reasoning: "30 applications with 0 interviews suggests targeting mismatch. 
           Trying adjacent roles (DevOps), explicit mid-level, and broader geography."
Boards: LinkedIn, Indeed, RemoteOK, AngelList
Count: 4-5 queries (testing variations)
```

**Job Scoring (for pasted jobs):**
```
When user pastes job link/description:
1. Extract key info (title, company, seniority, required skills, location)
2. Calculate match_score (0-100):
   - Skills overlap: 40%
   - Experience level fit: 30%
   - Location compatibility: 20%
   - Other factors: 10%
3. Generate reasoning:
   - Strengths: "Strong match on Go, Kubernetes, mid-level"
   - Gaps: "Requires AWS experience (you have GCP)"
   - Recommendation: "APPLY" | "CONSIDER" | "SKIP"
```

**Not in v1:**
- Real job board API integration
- Automated job scraping/fetching
- Daily automated job digests
- Multi-board aggregation and deduping
- Company research/reputation scoring

---

### Layer 7: AI Coach / Explainer

**What it does:**
- Translates agent logic into natural language explanations
- Presents plans and recommendations clearly
- Handles user questions about decisions
- Provides encouragement and context

**v1 Communication Style:**
- **Professional but friendly:** Warm without being casual
- **Actionable:** Always include concrete next steps
- **Honest:** About probabilities and limitations
- **Contextual:** Reference user's specific situation

**Key Explanations to Provide:**
1. **Strategy mode selection:** "I've put you in IMPROVE_RESUME_FIRST mode because..."
2. **Weekly plan reasoning:** "This week we're targeting X applications because..."
3. **Job recommendations:** "I recommend applying to Job X (82/100 match) because... Skip Job Y (45/100) because..."
4. **Strategy shifts:** "After 30 applications with no interviews, I recommend we pivot to..."
5. **Follow-up timing:** "Time to follow up on the Stripe application (10 days since applied, optimal window)"

**Not in v1:**
- Multi-turn conversation with history
- Personalized motivational coaching
- Career path counseling beyond job search
- Salary negotiation advice

---

### Layer 8: Logging Infrastructure (Not Full Learning Engine)

**What it does:**
- Captures all events for future learning
- Enables basic analytics dashboard
- Provides data foundation for v2 Learning Engine

**Events to Log:**

**Application Events:**
```typescript
{
  event_type: "application_created" | "application_submitted" | "status_changed",
  user_id: string,
  job_id: string,
  resume_version_id: string,
  strategy_mode: string,
  match_score: number,
  outcome?: "interview" | "offer" | "rejected" | "ghosted",
  timestamp: Date
}
```

**Interaction Events:**
```typescript
{
  event_type: "suggestion_accepted" | "suggestion_edited" | "suggestion_rejected",
  user_id: string,
  suggestion_type: "resume_rewrite" | "cover_letter" | "job_recommendation",
  context: {
    original: string,
    suggested: string,
    final?: string
  },
  timestamp: Date
}
```

**Strategy Events:**
```typescript
{
  event_type: "strategy_mode_changed",
  user_id: string,
  from_mode: string,
  to_mode: string,
  reason: string,
  metrics: {
    resume_score: number,
    total_applications: number,
    interview_rate: number
  },
  timestamp: Date
}
```

**v1 Analytics (Manual Analysis):**
- Basic dashboard showing:
  - Applications per week
  - Interview rate over time
  - Strategy mode distribution
  - Resume score progression
- Weekly manual review of patterns
- Rule adjustments based on observed data

**Not in v1:**
- Automated learning/optimization
- A/B testing framework
- Predictive modeling
- Cross-user pattern analysis
- Real-time recommendation adjustments

---

## Explicitly Out of Scope for v1

**Job Discovery:**
- ❌ Real job board API integration (LinkedIn, Indeed, etc.)
- ❌ Automated job scraping
- ❌ Multi-board aggregation and deduping
- ❌ Daily automated job digests
- ❌ Company research and reputation scoring

**Learning & Optimization:**
- ❌ Automated A/B testing
- ❌ ML-based strategy optimization
- ❌ Auto-adjusting score thresholds
- ❌ Cross-user pattern learning
- ❌ Predictive outcome modeling

**Advanced Features:**
- ❌ Interview preparation coaching
- ❌ Salary negotiation assistance
- ❌ Network building recommendations
- ❌ Company culture fit analysis
- ❌ Multi-year career path planning

**Additional Modes:**
- ❌ BRIDGE_ROLE_TRANSITION
- ❌ SKILL_BUILDING_PHASE
- ❌ NETWORK_FOCUSED
- ❌ Custom user-defined modes

**These are v1.1, v2, or v3 features.**

---

## User Flows (Concrete Scenarios)

### Flow 1: Onboarding (First Run)

```
1. User signs up and uploads resume

2. Agent analyzes resume
   → Displays: Overall score (e.g., 68/100) + section scores
   → Highlights: "Your summary section (45/100) and bullets (62/100) need work"

3. Agent selects strategy mode
   → Determines: IMPROVE_RESUME_FIRST (score < 75)
   → Explains: "Your resume needs improvement before high-volume applications. 
                Let's fix the weak sections first."

4. Agent presents first week plan
   → Goal: "Improve summary and strengthen 3 bullets. Test with 2 applications."
   → Tasks:
      - Rewrite summary section
      - Improve 3 weakest bullets
      - Apply to 2 best-fit jobs (I'll find searches for you)

5. User confirms or adjusts
   → If confirmed: Agent proceeds to generate rewrite suggestions
   → If adjusted: Agent updates plan based on user preferences

6. Agent generates job search queries
   → Shows: 1-2 conservative searches with reasoning
   → User clicks links, browses jobs on actual job boards
```

### Flow 2: Daily Loop (Typical Day)

```
Morning (User logs in):

1. Agent shows "Today's Plan"
   → 3 tasks: 
      a) Review improved resume summary (ready for approval)
      b) Apply to 2 Backend Engineer jobs (searches generated)
      c) Follow up on Stripe application (10 days ago)
   → Estimated time: "45 minutes"
   → Focus: "Applications + follow-up"

2. Task A: Resume Review
   → Agent shows: Before/after comparison for summary
   → Displays: Score improvement (45 → 78)
   → User: Approves or requests edits
   → Agent: Updates master resume version

3. Task B: Job Applications
   → Agent presents: 2 search query links with reasoning
   → User: Clicks links, browses LinkedIn/Indeed
   → User: Pastes back 3 interesting job URLs

   → Agent analyzes each:
      - Job 1: 88/100 match - "STRONG: Go+K8s, mid-level, Berlin - Apply first"
      - Job 2: 75/100 match - "GOOD: Backend, but Java-heavy - Solid backup"
      - Job 3: 52/100 match - "SKIP: Requires 7+ years (you have 3)"
   
   → Agent recommends: "Apply to Jobs 1 and 2, skip Job 3"
   
   → User selects: Jobs 1 and 2
   
   → Agent prepares:
      - Tailored resume for each (with score validation)
      - Focused cover letter (200 words)
      - LinkedIn recruiter message
   
   → User reviews and approves
   → Agent: Updates pipeline (status: submitted)

4. Task C: Follow-up
   → Agent drafts: Brief follow-up email for Stripe
   → Shows: "10 days since application (optimal follow-up window)"
   → User: Reviews, approves, sends
   → Agent: Logs follow-up in pipeline

Evening:
5. Agent logs outcomes
   → All tasks completed
   → Applications count updated
   → Next day's plan queued
```

### Flow 3: Strategy Shift (After Many Apps, No Interviews)

```
Trigger: User has 30+ applications, interview_rate < 2%

1. Agent detects pattern
   → Analyzes: 32 applications, 0 interviews (0% rate)
   → Evaluates: Roles applied to (80% "Senior Backend"), locations, companies

2. Agent recommends mode change
   → Current: APPLY_MODE
   → Suggested: RETHINK_TARGETS
   → Reasoning: "30+ applications with no interviews suggests targeting mismatch."

3. Agent presents analysis
   → "Most applications were to Senior Backend roles (5+ years required)"
   → "Your profile shows 3 years experience"
   → "Market signal: You're applying too senior"

4. Agent proposes alternatives
   → Option A: Target explicit mid-level roles ("Software Engineer II", "Backend Engineer (3-5 years)")
   → Option B: Try adjacent roles (DevOps, Platform Engineer) that value your Go+K8s stack
   → Option C: Broaden geography (add remote-first roles)
   → Recommendation: "Test all three for 2 weeks (3-5 applications each)"

5. User selects direction
   → User: "Let's try Option A and C together"
   → Agent: Updates strategy mode to RETHINK_TARGETS
   → Agent: Adjusts weekly target to 5-8 applications

6. Agent generates new search queries
   → Mid-level explicit:
      - "Software Engineer II Go"
      - "Backend Engineer 3-5 years Go"
   → Remote-first:
      - "Backend Engineer Go remote"
      - "Software Engineer Go remote-first"
   → Explains: "Testing explicit mid-level + remote to improve match"

7. Next week execution
   → Agent tracks: Response rates to new targeting
   → After 2 weeks: Evaluates if pivot improved outcomes
   → If yes: Continue RETHINK_TARGETS or return to APPLY_MODE
   → If no: Suggest further pivots (resume story, different tech stack focus)
```

---

## Success Metrics for v1

**Must demonstrate by end of v1:**

1. **Strategy Intelligence:**
   - Agent correctly switches between 3 modes based on state
   - Mode explanations are clear and justified

2. **Planning Capability:**
   - Weekly plans are realistic and aligned with strategy
   - Daily tasks are specific and actionable (not vague suggestions)

3. **Execution Quality:**
   - Rewritten content scores higher than originals (+5 minimum)
   - Cover letters are focused and job-specific
   - Outreach messages are professional

4. **Query Generation:**
   - Search queries are strategy-aware (different per mode)
   - Reasoning for queries is clear
   - Job scoring for pasted jobs is accurate (±10% subjective validation)

5. **Pipeline Tracking:**
   - All applications tracked with status
   - Follow-ups suggested at correct intervals (7-10 days)
   - State persists correctly across sessions

6. **User Perception:**
   - Beta users describe it as "agent managing my search" not "resume tool"
   - Users follow agent's plan at least 60% of the time
   - Users trust job recommendations (accept vs skip rate > 70%)

**Testing Plan:**
- Week 7-8: 5-10 beta users
- Track: Completion rates, trust indicators, feedback on "agent feel"
- Validate: Does v1 deliver on the "agent managing your job search" promise?

---

## Technical Constraints

**Performance:**
- Resume scoring: < 3 seconds
- Rewrite generation: < 10 seconds
- Query generation: < 2 seconds
- UI should feel responsive, not "waiting for AI"

**API Costs:**
- Target: < $0.50 per user per week in LLM API costs
- Monitor token usage for rewrite operations
- Optimize prompts for efficiency

**Data Storage:**
- Postgres for relational data
- Resume content stored as JSON
- Event log should support high-volume writes

**Scalability (for v1):**
- Design for 50-100 concurrent users
- Don't over-optimize prematurely
- Focus on correctness over scale

---

## What Comes After v1

**v1.1 (Week 9-12):**
- Real job board API integration (1 board to start)
- Automated job fetching based on queries
- Daily job digests

**v2 (Month 4-6):**
- Full Learning Engine (automated optimization)
- A/B testing framework
- Additional strategy modes (BRIDGE_ROLE, SKILL_BUILDING)
- Interview prep features

**v3+ (Month 7-12):**
- Salary negotiation
- Network building
- Multi-year career planning
- Enterprise features

---

## Definition of Done for v1

v1 is complete when:

✅ All 7 layers are implemented and working
✅ All 3 strategy modes function correctly with mode switching
✅ Query generation produces strategy-aware searches
✅ Job scoring works for user-pasted jobs
✅ All 3 user flows work end-to-end
✅ Logging captures all required events
✅ 5-10 beta users have completed full job search cycles
✅ Success metrics above are met
✅ Code is documented and maintainable for v1.1 work

**Ship date: Week 8 maximum**

---

**Document Status:** LOCKED - Ready for implementation  
**Next Step:** Generate data model schema and implementation roadmap
