# ResumeIQ Agent - Data Model v1

**Version:** 1.0  
**Purpose:** Pragmatic schema for v1 MVP (6-8 weeks)  
**Status:** Ready for Prisma/TypeORM implementation

---

## Design Principles

1. **Good enough for v1:** Include what's needed, defer what's not
2. **Agent-first:** Schema should support agent logic (strategy modes, planning, pipeline tracking)
3. **Event-driven:** Log everything for future learning
4. **Extensible:** Easy to add fields in v1.1+ without major migrations

---

## Core Entities

### 1. User

**Purpose:** Basic user account information

```prisma
model User {
  id            String   @id @default(cuid())
  email         String   @unique
  name          String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  // Relations
  profile       UserProfile?
  resumes       ResumeVersion[]
  applications  Application[]
  events        InteractionEvent[]
  strategyHistory StrategyHistory[]
}
```

**Required for v1:** ✅ All fields  
**Nice to have (v2+):** password hash, OAuth tokens, subscription tier

---

### 2. UserProfile

**Purpose:** Job search profile and preferences

```prisma
model UserProfile {
  id                 String   @id @default(cuid())
  userId             String   @unique
  user               User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Experience & Background
  experienceYears    Int?                    // Total years of experience
  currentRole        String?                 // e.g., "Backend Engineer"
  targetRoles        String[]                // e.g., ["Backend Engineer", "Software Engineer"]
  techStack          String[]                // e.g., ["Go", "Kubernetes", "PostgreSQL"]
  
  // Location & Work Auth
  currentLocation    String?                 // e.g., "Berlin, Germany"
  targetLocations    String[]                // e.g., ["Berlin", "Remote EU"]
  workAuthorization  String?                 // e.g., "EU Citizen", "US H1B", "Needs Sponsorship"
  remoteOnly         Boolean  @default(false)
  
  // Preferences
  companySizePrefs   String[]                // e.g., ["startup", "scale-up"] (seed, series-a, series-b, enterprise)
  industries         String[]                // e.g., ["fintech", "healthtech"]
  salaryExpectation  Json?                   // { min: 80000, max: 120000, currency: "USD" }
  
  // Current Strategy State
  currentStrategyMode String  @default("IMPROVE_RESUME_FIRST") // "IMPROVE_RESUME_FIRST" | "APPLY_MODE" | "RETHINK_TARGETS"
  weeklyAppTarget     Int     @default(5)    // Based on strategy mode
  
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt
}
```

**Required for v1:** ✅ All except salaryExpectation (nice to have)  
**Critical fields:** targetRoles, techStack, targetLocations, currentStrategyMode, weeklyAppTarget

**Notes:**
- `targetRoles` and `techStack` drive query generation
- `currentStrategyMode` controls agent behavior
- `weeklyAppTarget` is recalculated when mode changes

---

### 3. ResumeVersion

**Purpose:** Versioned resume storage with scoring

```prisma
model ResumeVersion {
  id              String   @id @default(cuid())
  userId          String
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  versionNumber   Int                        // 1, 2, 3, ...
  name            String?                    // e.g., "Master Resume", "Backend-focused v2"
  isMaster        Boolean  @default(false)   // Only one master per user
  
  // Resume Content (stored as JSON for flexibility)
  content         Json                       // Full resume structure
  /*
    content structure:
    {
      summary: string,
      experience: [
        {
          title: string,
          company: string,
          location: string,
          startDate: string,
          endDate: string,
          bullets: string[]
        }
      ],
      education: [...],
      skills: string[],
      projects: [...]
    }
  */
  
  // Scoring (from Scoring Engine)
  overallScore     Int?                      // 0-100
  sectionScores    Json?                     // { summary: 65, experience: 78, skills: 82, ... }
  improvementAreas String[]                  // e.g., ["Add metrics to bullets", "Clarify impact in summary"]
  
  // Metadata
  targetRoles      String[]                  // Roles this version is optimized for
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
  
  // Relations
  applications     Application[]
}
```

**Required for v1:** ✅ All fields  
**Critical fields:** content (JSON), overallScore, sectionScores, isMaster

**Notes:**
- Content as JSON allows flexibility without schema changes
- Only one isMaster=true per user (enforce at app layer)
- sectionScores format: `{ summary: 65, experience: 78, skills: 82, education: 90, formatting: 75 }`
- versionNumber auto-increments for same user

---

### 4. JobPosting

**Purpose:** Jobs discovered or pasted by user

```prisma
model JobPosting {
  id                String   @id @default(cuid())
  
  // Job Details
  title             String                   // e.g., "Senior Backend Engineer"
  company           String                   // e.g., "Stripe"
  location          String?                  // e.g., "Berlin, Germany" or "Remote"
  jobUrl            String                   // Original posting URL
  description       String?  @db.Text        // Full JD (if extracted)
  
  // Parsed/Inferred Data
  seniorityLevel    String?                  // "junior", "mid", "senior", "staff", "principal"
  requiredSkills    String[]                 // Extracted from JD
  remoteOption      Boolean  @default(false) // true if remote work mentioned
  salaryRange       Json?                    // { min: 100000, max: 150000, currency: "USD" }
  
  // Discovery Metadata
  discoveredAt      DateTime @default(now())
  source            String   @default("user_provided") // "user_provided" | "linkedin_api" | "indeed_api"
  discoveredViaQuery String?                 // Which search query found this (if automated)
  
  // Agent Scoring (for this user)
  matchScore        Int?                     // 0-100 (from Scoring Engine)
  matchReasoning    Json?                    // { strengths: [...], gaps: [...], recommendation: "APPLY" | "SKIP" }
  
  // Status
  status            String   @default("discovered") // "discovered" | "reviewed" | "applied" | "rejected_by_user"
  
  updatedAt         DateTime @updatedAt
  
  // Relations
  applications      Application[]
}
```

**Required for v1:** ✅ title, company, jobUrl, discoveredAt, source, matchScore, status  
**Nice to have:** description (full JD text), seniorityLevel, requiredSkills

**Notes:**
- In v1, most jobs are `source: "user_provided"` (pasted links/descriptions)
- `matchScore` and `matchReasoning` calculated when user provides job
- v1.1+ will have `source: "linkedin_api"` or similar

---

### 5. Application

**Purpose:** Pipeline tracking for applications

```prisma
model Application {
  id                String   @id @default(cuid())
  userId            String
  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  jobId             String
  job               JobPosting @relation(fields: [jobId], references: [id], onDelete: Cascade)
  
  resumeVersionId   String
  resumeVersion     ResumeVersion @relation(fields: [resumeVersionId], references: [id])
  
  // Application Details
  appliedAt         DateTime?                // Null if status=draft
  status            String   @default("draft") // "draft" | "submitted" | "no_response" | "interview_scheduled" | "offer" | "rejected" | "ghosted"
  
  // Generated Materials
  coverLetterUsed   String?  @db.Text        // Cover letter sent (if any)
  outreachSent      Boolean  @default(false) // Did we send recruiter message?
  outreachMessage   String?  @db.Text        // Recruiter outreach message
  
  // Follow-up Tracking
  lastFollowUp      DateTime?                // When we last followed up
  followUpCount     Int      @default(0)     // Number of follow-ups sent
  
  // Outcome
  outcome           String?                  // "interview" | "offer" | "rejected" | "ghosted" | null (pending)
  outcomeDate       DateTime?                // When outcome was determined
  outcomeNotes      String?  @db.Text        // User's notes about outcome
  
  // Strategy Context (for learning)
  strategyModeAtApply String?                // Which mode was active when applied
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}
```

**Required for v1:** ✅ All fields  
**Critical fields:** status, appliedAt, lastFollowUp, outcome, strategyModeAtApply

**Notes:**
- Status flow: draft → submitted → [no_response | interview_scheduled | rejected]
- `lastFollowUp` drives follow-up suggestions (7-10 days after appliedAt)
- `strategyModeAtApply` captured for v2 learning (which mode produces best outcomes?)
- `followUpCount` max 2 (don't spam)

---

### 6. InteractionEvent

**Purpose:** Event log for all user/agent interactions (foundation for Learning Engine)

```prisma
model InteractionEvent {
  id            String   @id @default(cuid())
  userId        String
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Event Classification
  eventType     String                      // See event types below
  timestamp     DateTime @default(now())
  
  // Context (flexible JSON for different event types)
  context       Json                        // Event-specific data
  
  // Metadata
  sessionId     String?                     // Group events by session (optional for v1)
  metadata      Json?                       // Additional flags/tags
}

// Index for querying by user and time range
@@index([userId, timestamp])
```

**Event Types for v1:**

**Application Events:**
- `application_created` - When application drafted
- `application_submitted` - When user submits
- `application_status_changed` - Status updates
- `application_outcome_reported` - Interview/offer/rejection

**Suggestion Events:**
- `suggestion_accepted` - User accepts agent's suggestion as-is
- `suggestion_edited` - User modifies suggestion before accepting
- `suggestion_rejected` - User rejects suggestion

**Strategy Events:**
- `strategy_mode_changed` - Mode transitions
- `weekly_plan_generated` - New plan created
- `daily_plan_viewed` - User checks today's plan

**Job Events:**
- `job_pasted` - User provides new job
- `job_scored` - Agent scores a job
- `job_recommended` - Agent recommends apply/skip

**Context Examples:**

```json
// application_submitted
{
  "jobId": "job_123",
  "resumeVersionId": "resume_v5",
  "matchScore": 82,
  "strategyMode": "APPLY_MODE"
}

// suggestion_edited
{
  "suggestionType": "cover_letter",
  "original": "...",
  "suggested": "...",
  "final": "...",
  "editType": "tone_adjustment"
}

// strategy_mode_changed
{
  "fromMode": "APPLY_MODE",
  "toMode": "RETHINK_TARGETS",
  "reason": "Low interview rate",
  "metrics": {
    "totalApplications": 32,
    "interviewRate": 0.0
  }
}
```

**Required for v1:** ✅ All fields  
**Critical:** Capture ALL events, even if not analyzed in v1 (needed for v2)

---

### 7. StrategyHistory

**Purpose:** Track strategy mode changes over time

```prisma
model StrategyHistory {
  id            String   @id @default(cuid())
  userId        String
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  strategyMode  String                      // "IMPROVE_RESUME_FIRST" | "APPLY_MODE" | "RETHINK_TARGETS"
  activatedAt   DateTime @default(now())
  deactivatedAt DateTime?                   // Null if currently active
  
  // Why this mode was chosen
  reason        String   @db.Text
  
  // State at activation
  metricsAtStart Json                       // { resumeScore: 68, totalApplications: 0, interviewRate: null }
  
  // Performance during this mode (populated when deactivated)
  metricsAtEnd   Json?                      // { resumeScore: 82, totalApplications: 12, interviewRate: 0.08 }
  applicationsInMode Int @default(0)        // Count of applications while in this mode
  interviewsInMode   Int @default(0)        // Count of interviews while in this mode
}
```

**Required for v1:** ✅ All fields  
**Purpose:** Historical analysis of which strategies worked

**Notes:**
- Only one active mode per user (deactivatedAt = null)
- When mode changes, previous record gets deactivatedAt + metricsAtEnd
- v2 Learning Engine will analyze: which modes → best outcomes per user segment

---

## Supporting Types (Enums)

**Note:** These would be TypeScript enums or Prisma enums depending on implementation

```typescript
// Strategy Modes
enum StrategyMode {
  IMPROVE_RESUME_FIRST = "IMPROVE_RESUME_FIRST",
  APPLY_MODE = "APPLY_MODE",
  RETHINK_TARGETS = "RETHINK_TARGETS"
}

// Application Status
enum ApplicationStatus {
  DRAFT = "draft",
  SUBMITTED = "submitted",
  NO_RESPONSE = "no_response",
  INTERVIEW_SCHEDULED = "interview_scheduled",
  OFFER = "offer",
  REJECTED = "rejected",
  GHOSTED = "ghosted"
}

// Job Status
enum JobStatus {
  DISCOVERED = "discovered",
  REVIEWED = "reviewed",
  APPLIED = "applied",
  REJECTED_BY_USER = "rejected_by_user"
}

// Seniority Levels
enum SeniorityLevel {
  INTERN = "intern",
  JUNIOR = "junior",
  MID = "mid",
  SENIOR = "senior",
  STAFF = "staff",
  PRINCIPAL = "principal",
  DIRECTOR = "director"
}

// Event Types
enum EventType {
  // Applications
  APPLICATION_CREATED = "application_created",
  APPLICATION_SUBMITTED = "application_submitted",
  APPLICATION_STATUS_CHANGED = "application_status_changed",
  APPLICATION_OUTCOME_REPORTED = "application_outcome_reported",
  
  // Suggestions
  SUGGESTION_ACCEPTED = "suggestion_accepted",
  SUGGESTION_EDITED = "suggestion_edited",
  SUGGESTION_REJECTED = "suggestion_rejected",
  
  // Strategy
  STRATEGY_MODE_CHANGED = "strategy_mode_changed",
  WEEKLY_PLAN_GENERATED = "weekly_plan_generated",
  DAILY_PLAN_VIEWED = "daily_plan_viewed",
  
  // Jobs
  JOB_PASTED = "job_pasted",
  JOB_SCORED = "job_scored",
  JOB_RECOMMENDED = "job_recommended"
}
```

---

## Key Relationships

```
User (1) ←→ (1) UserProfile
User (1) ←→ (many) ResumeVersion
User (1) ←→ (many) Application
User (1) ←→ (many) InteractionEvent
User (1) ←→ (many) StrategyHistory

ResumeVersion (1) ←→ (many) Application
JobPosting (1) ←→ (many) Application

Application.resumeVersionId → ResumeVersion.id
Application.jobId → JobPosting.id
```

---

## Queries the Schema Must Support

### For Agent Logic:

1. **Get user's current state:**
```typescript
// Used by Career Path Analyzer to determine strategy mode
const state = await getUserState(userId);
// Returns: {
//   resumeScore: number,
//   totalApplications: number,
//   applicationsThisWeek: number,
//   interviewRate: number,
//   currentMode: string
// }
```

2. **Get applications needing follow-up:**
```typescript
// Used by Orchestrator to generate follow-up tasks
const needFollowUp = await getApplicationsNeedingFollowUp(userId);
// Where: status="submitted", lastFollowUp is null or > 7 days ago, followUpCount < 2
```

3. **Get user's weekly application count:**
```typescript
// Used to check if weekly target met
const count = await getApplicationsThisWeek(userId);
// Where: appliedAt >= startOfWeek AND appliedAt <= now
```

4. **Get master resume with latest score:**
```typescript
// Used by Rewrite Engine as base for tailoring
const masterResume = await getMasterResume(userId);
// Where: isMaster=true, latest version
```

5. **Get recent outcomes for strategy adjustment:**
```typescript
// Used by Career Path Analyzer to detect patterns
const outcomes = await getRecentOutcomes(userId, last30Days);
// Applications with outcome != null, grouped by role/seniority
```

### For Analytics Dashboard:

6. **Get user's application history:**
```typescript
const history = await getApplicationHistory(userId, timeRange);
// All applications ordered by appliedAt, with job and outcome info
```

7. **Get strategy mode performance:**
```typescript
const performance = await getStrategyPerformance(userId);
// StrategyHistory with aggregated metrics per mode
```

---

## Indexes for Performance

**Critical indexes for v1:**

```prisma
// User lookups
@@index([email]) on User

// Application queries
@@index([userId, status]) on Application
@@index([userId, appliedAt]) on Application
@@index([userId, lastFollowUp]) on Application

// Resume queries
@@index([userId, isMaster]) on ResumeVersion

// Event queries
@@index([userId, timestamp]) on InteractionEvent
@@index([userId, eventType, timestamp]) on InteractionEvent

// Strategy queries
@@index([userId, deactivatedAt]) on StrategyHistory
```

---

## Data Migrations & Evolution

**v1 → v1.1 (Job API integration):**
- Add fields to JobPosting:
  - `apiSource` (linkedin, indeed, etc.)
  - `apiId` (external ID)
  - `lastFetched` (cache timestamp)
- No breaking changes to existing schema

**v1 → v2 (Learning Engine):**
- Possibly add:
  - `ExperimentAssignment` table (for A/B tests)
  - `ModelPrediction` table (for outcome predictions)
  - `UserSegment` table (for cohort analysis)
- Existing events provide all needed data

---

## Example Prisma Schema (Complete v1)

```prisma
// This is a complete, implementation-ready schema

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id              String             @id @default(cuid())
  email           String             @unique
  name            String?
  createdAt       DateTime           @default(now())
  updatedAt       DateTime           @updatedAt
  
  profile         UserProfile?
  resumes         ResumeVersion[]
  applications    Application[]
  events          InteractionEvent[]
  strategyHistory StrategyHistory[]
  
  @@index([email])
}

model UserProfile {
  id                  String   @id @default(cuid())
  userId              String   @unique
  user                User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  experienceYears     Int?
  currentRole         String?
  targetRoles         String[]
  techStack           String[]
  currentLocation     String?
  targetLocations     String[]
  workAuthorization   String?
  remoteOnly          Boolean  @default(false)
  companySizePrefs    String[]
  industries          String[]
  salaryExpectation   Json?
  currentStrategyMode String   @default("IMPROVE_RESUME_FIRST")
  weeklyAppTarget     Int      @default(5)
  
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
}

model ResumeVersion {
  id               String        @id @default(cuid())
  userId           String
  user             User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  versionNumber    Int
  name             String?
  isMaster         Boolean       @default(false)
  content          Json
  overallScore     Int?
  sectionScores    Json?
  improvementAreas String[]
  targetRoles      String[]
  createdAt        DateTime      @default(now())
  updatedAt        DateTime      @updatedAt
  applications     Application[]
  
  @@index([userId, isMaster])
}

model JobPosting {
  id                  String        @id @default(cuid())
  title               String
  company             String
  location            String?
  jobUrl              String
  description         String?       @db.Text
  seniorityLevel      String?
  requiredSkills      String[]
  remoteOption        Boolean       @default(false)
  salaryRange         Json?
  discoveredAt        DateTime      @default(now())
  source              String        @default("user_provided")
  discoveredViaQuery  String?
  matchScore          Int?
  matchReasoning      Json?
  status              String        @default("discovered")
  updatedAt           DateTime      @updatedAt
  applications        Application[]
}

model Application {
  id                  String        @id @default(cuid())
  userId              String
  user                User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  jobId               String
  job                 JobPosting    @relation(fields: [jobId], references: [id], onDelete: Cascade)
  resumeVersionId     String
  resumeVersion       ResumeVersion @relation(fields: [resumeVersionId], references: [id])
  
  appliedAt           DateTime?
  status              String        @default("draft")
  coverLetterUsed     String?       @db.Text
  outreachSent        Boolean       @default(false)
  outreachMessage     String?       @db.Text
  lastFollowUp        DateTime?
  followUpCount       Int           @default(0)
  outcome             String?
  outcomeDate         DateTime?
  outcomeNotes        String?       @db.Text
  strategyModeAtApply String?
  
  createdAt           DateTime      @default(now())
  updatedAt           DateTime      @updatedAt
  
  @@index([userId, status])
  @@index([userId, appliedAt])
  @@index([userId, lastFollowUp])
}

model InteractionEvent {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  eventType String
  timestamp DateTime @default(now())
  context   Json
  sessionId String?
  metadata  Json?
  
  @@index([userId, timestamp])
  @@index([userId, eventType, timestamp])
}

model StrategyHistory {
  id                 String    @id @default(cuid())
  userId             String
  user               User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  strategyMode       String
  activatedAt        DateTime  @default(now())
  deactivatedAt      DateTime?
  reason             String    @db.Text
  metricsAtStart     Json
  metricsAtEnd       Json?
  applicationsInMode Int       @default(0)
  interviewsInMode   Int       @default(0)
  
  @@index([userId, deactivatedAt])
}
```

---

## Usage Examples

### Creating a new user with profile:

```typescript
const user = await prisma.user.create({
  data: {
    email: "user@example.com",
    name: "John Doe",
    profile: {
      create: {
        experienceYears: 3,
        currentRole: "Backend Engineer",
        targetRoles: ["Backend Engineer", "Software Engineer"],
        techStack: ["Go", "Kubernetes", "PostgreSQL"],
        targetLocations: ["Berlin", "Remote EU"],
        workAuthorization: "EU Citizen",
        currentStrategyMode: "IMPROVE_RESUME_FIRST",
        weeklyAppTarget: 5
      }
    }
  },
  include: { profile: true }
});
```

### Creating a resume version:

```typescript
const resume = await prisma.resumeVersion.create({
  data: {
    userId: user.id,
    versionNumber: 1,
    name: "Master Resume",
    isMaster: true,
    content: {
      summary: "Backend engineer with 3 years...",
      experience: [/* ... */],
      education: [/* ... */],
      skills: ["Go", "Kubernetes"]
    },
    overallScore: 68,
    sectionScores: {
      summary: 45,
      experience: 72,
      skills: 80,
      education: 85
    },
    improvementAreas: [
      "Add metrics to experience bullets",
      "Strengthen summary section"
    ]
  }
});
```

### Tracking an application:

```typescript
const application = await prisma.application.create({
  data: {
    userId: user.id,
    jobId: job.id,
    resumeVersionId: resume.id,
    status: "submitted",
    appliedAt: new Date(),
    coverLetterUsed: "Dear hiring manager...",
    strategyModeAtApply: "APPLY_MODE"
  }
});

// Log the event
await prisma.interactionEvent.create({
  data: {
    userId: user.id,
    eventType: "application_submitted",
    context: {
      jobId: job.id,
      matchScore: job.matchScore,
      strategyMode: "APPLY_MODE"
    }
  }
});
```

### Querying for follow-ups:

```typescript
const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

const needFollowUp = await prisma.application.findMany({
  where: {
    userId: user.id,
    status: "submitted",
    followUpCount: { lt: 2 },
    OR: [
      { lastFollowUp: null },
      { lastFollowUp: { lt: sevenDaysAgo } }
    ]
  },
  include: {
    job: true
  }
});
```

---

## Schema Validation Rules (Application Layer)

**Enforce at application layer (not DB constraints):**

1. **Only one master resume per user**
   - Before setting `isMaster=true`, set all other user's resumes to `isMaster=false`

2. **Only one active strategy per user**
   - Before creating new StrategyHistory, set current active one's `deactivatedAt`

3. **Application status transitions**
   - Valid transitions: draft → submitted → (no_response | interview_scheduled | rejected)
   - Cannot go from "rejected" back to "submitted"

4. **Follow-up limits**
   - `followUpCount` max 2 (don't spam)

5. **Strategy mode sync**
   - When UserProfile.currentStrategyMode changes, create new StrategyHistory record

---

## Summary

**This schema provides:**

✅ All data needed for v1 agent logic  
✅ Complete application pipeline tracking  
✅ Event logging foundation for v2 learning  
✅ Strategy mode history and performance tracking  
✅ Flexible JSON fields for evolution  
✅ Proper indexes for performance  
✅ Clear extension path to v1.1 and v2

**Ready for implementation:** Yes. This can be dropped into Prisma and generate a working database.

**Next step:** Implement this schema, then build the seven layers on top of it.

---

**Document Status:** READY  
**Next:** Implementation Roadmap
