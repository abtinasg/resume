# ResumeIQ Agent - Implementation Roadmap v1

**Timeline:** 6-8 weeks  
**Target:** Shippable MVP with agent behavior  
**Team:** Solo founder (you)

---

## Roadmap Overview

```
Phase 1: Foundation (Week 1-2)          ████████░░░░░░░░  25%
Phase 2: Agent Brain (Week 3-4)         ░░░░░░░░████████  50%
Phase 3: Job Discovery & UX (Week 5-6)  ░░░░░░░░░░░░████  75%
Phase 4: Testing & Launch (Week 7-8)    ░░░░░░░░░░░░░░██  100%
```

**Philosophy:** 
- Build in layers, ship working increments
- Test early and often (don't wait until week 8)
- Cut scope aggressively if falling behind
- Focus on "does it feel like an agent?" over polish

---

## Phase 1: Foundation (Week 1-2)

**Goal:** Get the data layer and core engines working

### Week 1: Data & Infrastructure

**Day 1-2: Project Setup**
- [ ] Initialize Next.js 14 project (already have codebase)
- [ ] Set up Prisma with PostgreSQL
- [ ] Implement schema from `data_model_v1.md`
- [ ] Run initial migrations
- [ ] Set up basic auth (email/password, simple for v1)
- [ ] Configure environment variables

**Deliverable:** Database running, schema applied, auth working

---

**Day 3-4: Scoring Engine Integration**
- [ ] Port existing resume scoring logic to new schema
- [ ] Create `ScoringService` class:
  - `scoreResume(resumeContent): ScoreResult`
  - `scoreJobMatch(resume, job): MatchScore`
- [ ] Test with sample resumes
- [ ] Validate score consistency

**Key Functions:**
```typescript
interface ScoreResult {
  overallScore: number;           // 0-100
  sectionScores: {
    summary: number;
    experience: number;
    skills: number;
    education: number;
    formatting: number;
  };
  improvementAreas: string[];     // Top 3 issues
  reasoning: string;              // Why this score
}

interface MatchScore {
  matchScore: number;             // 0-100
  strengths: string[];            // What matches well
  gaps: string[];                 // What's missing
  recommendation: "APPLY" | "CONSIDER" | "SKIP";
}
```

**Testing Checklist:**
- [ ] Resume scoring returns consistent results
- [ ] Section scores add up logically
- [ ] ImprovementAreas are actionable
- [ ] Job match scoring identifies real gaps

**Deliverable:** Scoring Engine working and tested

---

**Day 5: Logging Infrastructure**
- [ ] Create `EventLogger` service
- [ ] Implement event logging for all event types:
  - Application events
  - Suggestion events
  - Strategy events
  - Job events
- [ ] Test event capture and retrieval

**Key Functions:**
```typescript
class EventLogger {
  async log(
    userId: string,
    eventType: EventType,
    context: any,
    metadata?: any
  ): Promise<void>
  
  async getEvents(
    userId: string,
    filters: EventFilters
  ): Promise<InteractionEvent[]>
}
```

**Testing:**
- [ ] Events persist correctly
- [ ] Query performance is acceptable
- [ ] Context JSON structure is consistent

**Deliverable:** All interactions are being logged

---

### Week 2: Rewrite Engine & State Queries

**Day 1-3: Rewrite Engine**
- [ ] Create `RewriteService` class
- [ ] Implement bullet rewriting:
  - Parse bullet structure
  - Identify weak patterns (no metrics, vague verbs)
  - Generate improved version
  - Validate with Scoring Engine
- [ ] Implement section rewriting (summary, experience)
- [ ] Implement job-specific tailoring
- [ ] Implement cover letter generation
- [ ] Implement recruiter message drafting

**Key Functions:**
```typescript
class RewriteService {
  async rewriteBullet(
    original: string,
    targetRole?: string
  ): Promise<RewriteResult>
  
  async tailorResume(
    resume: ResumeVersion,
    job: JobPosting
  ): Promise<ResumeVersion>
  
  async generateCoverLetter(
    resume: ResumeVersion,
    job: JobPosting,
    maxWords: number = 300
  ): Promise<string>
  
  async draftOutreachMessage(
    resume: ResumeVersion,
    job: JobPosting,
    maxWords: number = 150
  ): Promise<string>
}

interface RewriteResult {
  original: string;
  rewritten: string;
  improvements: string[];         // What changed
  scoreImprovement: number;       // Delta in score
}
```

**Quality Gates:**
- [ ] Rewrites improve score by +5 minimum
- [ ] No invented experience/skills
- [ ] Maintains user's voice
- [ ] Technical terms are accurate

**Testing:**
- [ ] Weak bullets become strong
- [ ] Tailoring includes job-relevant keywords
- [ ] Cover letters are focused (not generic)
- [ ] Outreach messages are professional

**Deliverable:** Rewrite Engine producing quality output

---

**Day 4-5: State Queries & Utilities**
- [ ] Create `StateService` class for common queries
- [ ] Implement key query functions:
  - `getUserState(userId)`: Current strategy state
  - `getApplicationsNeedingFollowUp(userId)`
  - `getApplicationsThisWeek(userId)`
  - `getMasterResume(userId)`
  - `getRecentOutcomes(userId, days)`
- [ ] Create helper utilities:
  - Calculate interview rate
  - Calculate weekly application count
  - Determine if weekly target met

**Key Functions:**
```typescript
class StateService {
  async getUserState(userId: string): Promise<UserState>
  async getApplicationsNeedingFollowUp(userId: string): Promise<Application[]>
  async getApplicationsThisWeek(userId: string): Promise<number>
  async getMasterResume(userId: string): Promise<ResumeVersion | null>
  async getRecentOutcomes(userId: string, days: number): Promise<Application[]>
  async calculateInterviewRate(userId: string): Promise<number>
}

interface UserState {
  userId: string;
  resumeScore: number;
  totalApplications: number;
  applicationsThisWeek: number;
  interviewRate: number;
  currentStrategyMode: StrategyMode;
  weeklyTarget: number;
}
```

**Testing:**
- [ ] State queries return accurate data
- [ ] Performance is acceptable (< 200ms)
- [ ] Edge cases handled (no resume, no applications)

**Deliverable:** State layer fully functional

---

**End of Phase 1 Checkpoint:**

✅ Database schema implemented  
✅ Scoring Engine working  
✅ Rewrite Engine working  
✅ Event logging functional  
✅ State queries operational

**Demo-able:** "I can upload a resume, get it scored, rewrite sections, and see improvements"

---

## Phase 2: Agent Brain (Week 3-4)

**Goal:** Implement the strategy intelligence and planning logic

### Week 3: Career Path Analyzer & Orchestrator

**Day 1-2: Career Path Analyzer**
- [ ] Create `CareerPathAnalyzer` class
- [ ] Implement 3 strategy modes logic:
  - IMPROVE_RESUME_FIRST
  - APPLY_MODE
  - RETHINK_TARGETS
- [ ] Implement mode switching logic
- [ ] Calculate weekly targets per mode
- [ ] Create StrategyHistory records on mode changes

**Key Functions:**
```typescript
class CareerPathAnalyzer {
  async determineStrategyMode(userId: string): Promise<StrategyMode>
  
  async shouldSwitchMode(
    userId: string,
    currentMode: StrategyMode
  ): Promise<{ switch: boolean; newMode?: StrategyMode; reason?: string }>
  
  async calculateWeeklyTarget(
    userId: string,
    mode: StrategyMode
  ): Promise<number>
  
  async activateMode(
    userId: string,
    mode: StrategyMode,
    reason: string
  ): Promise<void>
}
```

**Mode Logic Implementation:**
```typescript
// IMPROVE_RESUME_FIRST triggers
if (resumeScore < 75 || criticalGapsExist) {
  return StrategyMode.IMPROVE_RESUME_FIRST;
}

// RETHINK_TARGETS triggers
if (totalApplications >= 30 && interviewRate < 0.02) {
  return StrategyMode.RETHINK_TARGETS;
}

// Default to APPLY_MODE
return StrategyMode.APPLY_MODE;
```

**Testing:**
- [ ] Mode selection logic is correct for various states
- [ ] Mode transitions are logged
- [ ] Weekly targets match mode expectations
- [ ] StrategyHistory records created properly

**Deliverable:** Strategy mode logic working

---

**Day 3-5: Orchestrator / Planner**
- [ ] Create `Orchestrator` class
- [ ] Implement weekly plan generation
- [ ] Implement daily task list generation
- [ ] Implement priority scoring algorithm
- [ ] Create action coordination logic

**Key Functions:**
```typescript
class Orchestrator {
  async generateWeeklyPlan(userId: string): Promise<WeeklyPlan>
  async generateDailyPlan(userId: string): Promise<DailyPlan>
  async prioritizeActions(actions: Action[]): Promise<Action[]>
  async executeAction(action: Action): Promise<ActionResult>
}

interface WeeklyPlan {
  weekGoal: string;
  strategyMode: StrategyMode;
  targetApplications: number;
  priorityActions: Action[];
  reasoning: string;
}

interface DailyPlan {
  date: Date;
  tasks: Task[];
  estimatedTime: string;
  focusArea: string;
}

interface Task {
  id: string;
  type: "improve_resume" | "apply" | "follow_up" | "review";
  description: string;
  priority: number;
  estimatedMinutes: number;
  context: any;
}
```

**Priority Scoring Implementation:**
```typescript
function calculatePriority(action: Action, state: UserState): number {
  let score = 0;
  
  if (action.type === 'improve_resume' && state.resumeScore < 75) {
    score += 50;
  }
  
  if (action.type === 'apply') {
    if (state.applicationsThisWeek < state.weeklyTarget) score += 40;
    if (action.job.matchScore > 80) score += 20;
  }
  
  if (action.type === 'follow_up') {
    const daysSince = daysSinceApplication(action.application);
    if (daysSince >= 7 && daysSince <= 10) score += 35;
  }
  
  return score;
}
```

**Testing:**
- [ ] Weekly plans are realistic and achievable
- [ ] Daily tasks align with weekly goals
- [ ] Priority ordering makes sense
- [ ] Task descriptions are clear and actionable

**Deliverable:** Planning logic generates sensible plans

---

### Week 4: AI Coach & Integration

**Day 1-3: AI Coach / Explainer**
- [ ] Create `AICoach` class
- [ ] Implement explanation generation for:
  - Strategy mode selection
  - Weekly plan reasoning
  - Job recommendations
  - Strategy shifts
  - Follow-up timing
- [ ] Create natural language formatting
- [ ] Implement conversational responses

**Key Functions:**
```typescript
class AICoach {
  async explainStrategyMode(
    userId: string,
    mode: StrategyMode
  ): Promise<string>
  
  async explainWeeklyPlan(plan: WeeklyPlan): Promise<string>
  
  async explainJobRecommendation(
    job: JobPosting,
    matchScore: MatchScore
  ): Promise<string>
  
  async explainStrategyShift(
    fromMode: StrategyMode,
    toMode: StrategyMode,
    metrics: UserState
  ): Promise<string>
  
  async generateCheckIn(
    userId: string,
    timeOfDay: "morning" | "evening"
  ): Promise<string>
}
```

**Example Outputs:**

**Strategy Explanation:**
```
"I've put you in IMPROVE_RESUME_FIRST mode because your resume 
scores 68/100. Before we start high-volume applications, let's 
strengthen your summary (45/100) and add metrics to your experience 
bullets (62/100). This week we'll test with 2-3 applications while 
improving these sections."
```

**Job Recommendation:**
```
"This Backend Engineer role at Stripe is an 88/100 match for you:

Strengths:
✓ Requires Go + Kubernetes (your core stack)
✓ Mid-level (3-5 years) matches your experience
✓ Berlin-based (your target location)

Minor gap:
- Mentions AWS (you have GCP experience, but both are cloud platforms)

Recommendation: APPLY - This is a strong fit, and the AWS gap is 
easily bridgeable in interviews."
```

**Testing:**
- [ ] Explanations are clear and actionable
- [ ] Tone is professional but friendly
- [ ] Reasoning is logical and honest
- [ ] User can understand why agent made decision

**Deliverable:** Agent can explain all its decisions

---

**Day 4-5: End-to-End Integration Testing**
- [ ] Connect all layers:
  - State → CPA → Orchestrator → Coach
  - User action → Rewrite → Scoring → Coach
- [ ] Test complete workflows:
  - New user onboarding
  - Resume improvement cycle
  - Application preparation
  - Strategy mode switching
- [ ] Fix integration bugs
- [ ] Optimize performance bottlenecks

**Integration Test Scenarios:**

**Scenario 1: New user with weak resume**
```
1. User uploads resume (score: 65)
2. CPA determines: IMPROVE_RESUME_FIRST
3. Orchestrator generates: Weekly plan focusing on resume
4. Coach explains: Why improvement needed before applications
5. User requests rewrite
6. Rewrite Engine generates improved version
7. Scoring Engine validates improvement
8. Coach presents: Before/after comparison
```

**Scenario 2: User ready to apply**
```
1. User's resume score: 82
2. CPA determines: APPLY_MODE
3. Orchestrator generates: Plan for 8 applications this week
4. User receives: Daily task list
5. User requests job searches
6. [Job Discovery module generates queries]
7. User pastes back jobs
8. Scoring Engine scores jobs
9. Orchestrator prioritizes: Apply to top 3 first
10. Rewrite Engine prepares: Tailored resume + cover letter
11. Coach presents: Complete application package
```

**Testing Checklist:**
- [ ] All layers communicate correctly
- [ ] Data flows properly (no orphaned records)
- [ ] Error handling works (graceful failures)
- [ ] Performance is acceptable (< 5s for full flow)

**Deliverable:** All layers working together

---

**End of Phase 2 Checkpoint:**

✅ Strategy mode logic working  
✅ Weekly/daily planning functional  
✅ AI Coach explains decisions  
✅ End-to-end workflows tested

**Demo-able:** "Agent picks a strategy, creates a plan, explains why, and helps me execute"

---

## Phase 3: Job Discovery & Complete UX (Week 5-6)

**Goal:** Add job discovery and polish the user experience

### Week 5: Job Discovery (Query-Based)

**Day 1-3: Query Generation Logic**
- [ ] Create `JobDiscovery` class
- [ ] Implement query generation per strategy mode
- [ ] Generate pre-constructed URLs for job boards:
  - LinkedIn
  - Indeed
  - RemoteOK
- [ ] Create reasoning for each query
- [ ] Handle user profile variations (remote, location, tech stack)

**Key Functions:**
```typescript
class JobDiscovery {
  async generateSearchQueries(
    userId: string,
    mode: StrategyMode
  ): Promise<SearchQuery[]>
  
  async constructSearchURL(
    query: SearchQuery,
    board: JobBoard
  ): Promise<string>
  
  async scoreUserProvidedJob(
    userId: string,
    jobDescription: string,
    jobUrl: string
  ): Promise<JobScoring>
}

interface SearchQuery {
  keywords: string[];
  targetRoles: string[];
  locations: string[];
  seniority?: string;
  reasoning: string;
}

interface JobBoard {
  name: "linkedin" | "indeed" | "remoteok";
  baseURL: string;
  queryParamFormat: string;
}

interface JobScoring {
  job: JobPosting;
  matchScore: number;
  matchReasoning: {
    strengths: string[];
    gaps: string[];
    recommendation: "APPLY" | "CONSIDER" | "SKIP";
  };
}
```

**Query Generation Logic:**

**IMPROVE_RESUME_FIRST:**
```typescript
// Conservative: best-fit only
queries = [
  {
    keywords: [primaryTechStack[0], primaryTechStack[1], primaryLocation],
    targetRoles: [mostLikelyRole],
    reasoning: "Exact match to test resume quality with perfect-fit roles"
  }
];
```

**APPLY_MODE:**
```typescript
// Diverse: multiple variations
queries = [
  { keywords: [role, stack[0], location[0]], ... },
  { keywords: [role, stack[1], "remote", location[1]], ... },
  { keywords: [adjacentRole, stack[0], location[0]], ... }
];
```

**RETHINK_TARGETS:**
```typescript
// Experimental: alternative targeting
queries = [
  { keywords: [role, "mid-level", stack[0]], reasoning: "Explicit seniority" },
  { keywords: [adjacentRole, stack[0]], reasoning: "Adjacent role" },
  { keywords: [role, stack[0], "remote"], reasoning: "Broader geography" }
];
```

**Testing:**
- [ ] Queries are strategy-appropriate
- [ ] URLs work (actually open correct search on job boards)
- [ ] Reasoning is clear
- [ ] Coverage is good (not too narrow, not too broad)

**Deliverable:** Query generation working

---

**Day 4-5: Job Scoring & Recommendations**
- [ ] Implement job parsing from user-provided descriptions
- [ ] Extract key info (title, company, seniority, skills, location)
- [ ] Calculate match scores
- [ ] Generate recommendation (APPLY/CONSIDER/SKIP)
- [ ] Create actionable explanations

**Job Parsing Logic:**
```typescript
async function parseJobDescription(text: string): Promise<ParsedJob> {
  // Use LLM to extract:
  // - Title
  // - Company
  // - Seniority level (inferred from requirements)
  // - Required skills (tech stack)
  // - Location / remote option
  
  return {
    title: string,
    company: string,
    seniorityLevel: string,
    requiredSkills: string[],
    location: string,
    remoteOption: boolean
  };
}
```

**Match Score Calculation:**
```typescript
function calculateMatchScore(
  userProfile: UserProfile,
  job: ParsedJob
): number {
  let score = 0;
  
  // Skills overlap (40%)
  const skillMatch = intersection(userProfile.techStack, job.requiredSkills);
  score += (skillMatch.length / job.requiredSkills.length) * 40;
  
  // Experience level fit (30%)
  const seniorityFit = compareSeniority(userProfile.experienceYears, job.seniorityLevel);
  score += seniorityFit * 30;
  
  // Location compatibility (20%)
  const locationFit = checkLocation(userProfile, job);
  score += locationFit * 20;
  
  // Other factors (10%)
  score += calculateOtherFactors(userProfile, job) * 10;
  
  return Math.round(score);
}
```

**Recommendation Logic:**
```typescript
if (matchScore >= 75) return "APPLY";
if (matchScore >= 60) return "CONSIDER";
return "SKIP";
```

**Testing:**
- [ ] Job parsing extracts correct info
- [ ] Match scores are sensible
- [ ] Recommendations align with score
- [ ] Edge cases handled (missing info, unclear JDs)

**Deliverable:** Job scoring and filtering working

---

### Week 6: Complete User Flows & UI

**Day 1-2: Onboarding Flow**
- [ ] Build onboarding UI:
  - User signup/login
  - Resume upload
  - Profile setup (target roles, locations, tech stack)
- [ ] Implement first-run experience:
  - Resume scoring display
  - Strategy mode explanation
  - First week plan presentation
- [ ] Add visual elements:
  - Score visualizations (progress bars, charts)
  - Improvement areas highlighting
  - Strategy mode badge

**UI Components:**
- Resume upload (drag-and-drop)
- Score dashboard (overall + sections)
- Profile form (target roles, locations, skills)
- Welcome message from AI Coach

**Testing:**
- [ ] Onboarding is smooth (< 5 minutes)
- [ ] Visual feedback is clear
- [ ] User understands next steps

**Deliverable:** Complete onboarding flow

---

**Day 3-4: Daily Agent Loop UI**
- [ ] Build dashboard:
  - Today's Plan section
  - Current strategy mode display
  - Weekly progress tracking
  - Application pipeline view
- [ ] Implement task execution UI:
  - Resume review/approval
  - Job search query display
  - Job paste/scoring interface
  - Application preparation flow
- [ ] Add interaction elements:
  - Task completion checkboxes
  - Approve/Edit/Reject buttons
  - Follow-up sending interface

**UI Components:**
- Daily task list
- Job search query cards (with clickable links)
- Job scoring results
- Application package preview (resume + cover letter + message)
- Pipeline status board (draft/submitted/interview/rejected)

**Testing:**
- [ ] Tasks are clear and actionable
- [ ] Workflow is intuitive
- [ ] User can complete tasks without confusion
- [ ] Loading states are handled

**Deliverable:** Daily loop UX is functional

---

**Day 5: Polish & Final Integration**
- [ ] Fix UI bugs
- [ ] Add loading/error states
- [ ] Implement basic analytics dashboard:
  - Applications this week
  - Interview rate
  - Resume score over time
  - Strategy mode history
- [ ] Polish AI Coach messaging
- [ ] Add helpful tips and guidance
- [ ] Implement basic mobile responsiveness

**Polish Checklist:**
- [ ] All text is clear and typo-free
- [ ] Loading indicators on async operations
- [ ] Error messages are helpful
- [ ] Empty states are handled
- [ ] Success feedback is shown

**Deliverable:** Complete, polished user experience

---

**End of Phase 3 Checkpoint:**

✅ Job discovery (query-based) working  
✅ Job scoring functional  
✅ Complete onboarding flow  
✅ Daily agent loop UX  
✅ Full user flows implemented

**Demo-able:** "End-to-end job search loop: agent plans, finds jobs, helps apply, tracks progress"

---

## Phase 4: Testing, Stabilization & Launch (Week 7-8)

**Goal:** Test with real users, fix bugs, prepare for launch

### Week 7: Internal Testing & Fixes

**Day 1-2: Self-Testing**
- [ ] Run through all workflows as a user
- [ ] Test edge cases:
  - No resume uploaded
  - Very weak resume (score < 40)
  - No applications yet
  - Many applications, no interviews
  - Strategy mode transitions
- [ ] Test error scenarios:
  - API failures
  - Invalid job URLs
  - Corrupted resume files
  - Database connection issues
- [ ] Document bugs and prioritize

**Testing Checklist:**
- [ ] Happy path works perfectly
- [ ] Edge cases are handled
- [ ] Errors don't crash the system
- [ ] Data persists correctly
- [ ] Logging captures everything

---

**Day 3-5: Beta User Testing (5-10 users)**
- [ ] Recruit beta users:
  - Your network
  - Online communities (Reddit, Discord)
  - Job seeker groups
- [ ] Onboard beta users (one-on-one if possible)
- [ ] Collect feedback:
  - Where did they get confused?
  - Which features felt useful/useless?
  - Does it feel like an agent?
  - What's missing?
- [ ] Track metrics:
  - Completion rates (onboarding, daily tasks)
  - Time spent per session
  - Number of applications created
  - User satisfaction (1-10 score)

**Beta Testing Goals:**
- [ ] At least 5 users complete onboarding
- [ ] At least 3 users use it for 1 full week
- [ ] Collect detailed feedback on "agent feel"
- [ ] Identify top 3 pain points

**Feedback Collection:**
- Daily check-ins with beta users
- Weekly feedback form
- Screen recordings (with permission)
- Analytics dashboard monitoring

---

### Week 8: Fixes, Documentation & Launch Prep

**Day 1-3: Priority Bug Fixes**
- [ ] Fix critical bugs (blocking workflows)
- [ ] Fix high-impact bugs (causing confusion)
- [ ] Document known issues that won't be fixed in v1
- [ ] Improve error messages based on feedback
- [ ] Optimize slow operations

**Priority Framework:**
```
P0 (Must fix): Blocks core workflows
P1 (Should fix): Causes significant friction
P2 (Nice to fix): Minor issues
P3 (Won't fix in v1): Polish/edge cases
```

**Focus on:**
- [ ] Strategy mode logic bugs
- [ ] Score calculation errors
- [ ] UI confusion points
- [ ] Data persistence issues

---

**Day 4: Documentation & Onboarding Materials**
- [ ] Write user guide:
  - How to get started
  - Understanding strategy modes
  - How to use daily plans
  - Job search best practices
- [ ] Create FAQ
- [ ] Write troubleshooting guide
- [ ] Record demo video (3-5 minutes)

**Documentation Sections:**
1. Getting Started
2. Understanding Your Strategy Mode
3. Daily Workflow
4. Job Discovery & Application
5. Tracking Your Progress
6. FAQ & Troubleshooting

---

**Day 5: Launch Preparation**
- [ ] Final production checks:
  - Database backups configured
  - Error monitoring set up (Sentry or similar)
  - Analytics tracking (PostHog or similar)
  - API rate limits configured
- [ ] Prepare launch materials:
  - Landing page copy
  - Social media posts
  - Product Hunt submission
  - Reddit/Discord announcements
- [ ] Set up support channel (email or Discord)
- [ ] Plan post-launch monitoring schedule

**Launch Checklist:**
- [ ] All critical bugs fixed
- [ ] Documentation complete
- [ ] Demo video ready
- [ ] Support process defined
- [ ] Monitoring dashboards set up
- [ ] Backup/recovery plan documented

**Deliverable:** Ready to ship v1 publicly

---

**End of Phase 4 Checkpoint:**

✅ Beta tested with 5-10 users  
✅ Critical bugs fixed  
✅ Documentation complete  
✅ Launch materials prepared  
✅ Production ready

**Result:** v1 shipped and available to public

---

## Week-by-Week Summary

| Week | Phase | Focus | Deliverable |
|------|-------|-------|-------------|
| 1 | Foundation | Data, Scoring, Logging | Core engines working |
| 2 | Foundation | Rewrite, State Queries | Full data layer functional |
| 3 | Agent Brain | Strategy, Planning | Agent intelligence working |
| 4 | Agent Brain | Coach, Integration | Complete agent behavior |
| 5 | Job & UX | Query Generation, Scoring | Job discovery functional |
| 6 | Job & UX | Onboarding, Daily Loop | Complete UX flows |
| 7 | Testing | Beta Users, Feedback | Validated with users |
| 8 | Launch | Fixes, Documentation | Public launch |

---

## Risk Mitigation

### If Falling Behind (Week 4-5)

**Option 1: Simplify Daily Planning**
- Cut: Complex priority scoring
- Keep: Simple task list (top 3 actions)
- Impact: Minimal, users still get guidance

**Option 2: Simplify Job Discovery**
- Cut: Multiple job board URLs
- Keep: LinkedIn-only queries
- Impact: Low, still provides value

**Option 3: Simplify AI Coach**
- Cut: Conversational responses
- Keep: Template-based explanations
- Impact: Medium, less personal but functional

### If Falling Behind (Week 6-7)

**Option 1: Manual Beta Testing**
- Cut: Analytics dashboard
- Keep: Manual user feedback
- Impact: Low, can add analytics post-launch

**Option 2: Minimal Documentation**
- Cut: Comprehensive guide
- Keep: Quick start + FAQ only
- Impact: Medium, provide 1-on-1 support instead

---

## Success Criteria

**v1 is successful if:**

1. **Agent Behavior Validated:**
   - 80% of beta users say "it feels like an agent, not a tool"
   - Users trust strategy recommendations
   - Users follow weekly plans at least 50% of the time

2. **Core Workflows Work:**
   - 100% of beta users complete onboarding
   - 80% create at least one application
   - 60% use it for 2+ weeks

3. **Technical Stability:**
   - No critical bugs in core flows
   - < 5% error rate on API calls
   - Average response time < 3s

4. **User Satisfaction:**
   - Average satisfaction score >= 7/10
   - At least 3 users provide positive testimonials
   - < 20% churn rate in first month

---

## Post-Launch Immediate Tasks (Week 9-10)

**These happen AFTER v1 ships:**

1. **Gather feedback from public users**
   - Set up feedback form
   - Monitor support channels
   - Track usage metrics

2. **Plan v1.1 (Job API Integration)**
   - Choose job board API (based on access)
   - Design integration architecture
   - Estimate effort (target: 2-3 weeks)

3. **Analyze logged data**
   - Which strategies are used most?
   - What's the average interview rate?
   - Where do users drop off?

4. **Marketing push**
   - Product Hunt launch
   - Reddit posts
   - LinkedIn announcements
   - Reach out to career coaches

---

## Daily Standup Questions (Solo Founder Edition)

**Ask yourself every morning:**

1. What did I ship yesterday?
2. What will I ship today?
3. Am I blocked on anything?
4. Am I on track for this week's goal?
5. Should I cut scope or push harder?

**Weekly review (every Friday):**

1. Did I hit this week's milestone?
2. What surprised me (good or bad)?
3. What should I do differently next week?
4. Am I still on track for 8-week launch?
5. What scope should I cut if falling behind?

---

## Definition of Done

**v1 is DONE when:**

✅ All 7 layers implemented and tested  
✅ All 3 strategy modes working with transitions  
✅ Query-based job discovery functional  
✅ Job scoring accurate and helpful  
✅ Complete onboarding + daily loop UX  
✅ Event logging capturing all interactions  
✅ 5-10 beta users successfully using the system  
✅ Documentation and support materials ready  
✅ No critical bugs in production  
✅ Launch materials prepared

**At that point: SHIP IT. 🚀**

Don't wait for perfection. Ship a working agent, gather feedback, iterate to v1.1.

---

## What Comes After v1

**v1.1 (Week 9-12):**
- Real job board API integration (LinkedIn or Indeed)
- Automated daily job fetching
- Job board selection based on user preferences

**v2 (Month 4-6):**
- Learning Engine (automated strategy optimization)
- A/B testing framework
- Additional modes (BRIDGE_ROLE, SKILL_BUILDING)
- Interview prep features

**v3 (Month 7-12):**
- Advanced job matching algorithms
- Salary negotiation coaching
- Network building recommendations
- Enterprise features

---

**This roadmap is locked. Time to execute.** ⏰

**Next Steps:**
1. Set up project (Day 1)
2. Implement schema (Day 1-2)
3. Start Scoring Engine (Day 3)
4. Ship on Week 8

**Let's build this. 💪**
