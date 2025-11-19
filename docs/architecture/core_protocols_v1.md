# Core Protocols v1.0 – ResumeIQ

This document defines the foundational shared contracts required before implementing major ResumeIQ modules (Analyzer, Rewrite Engine, CPA, AI Coach).  
These protocols ensure consistency, prevent schema drift, and enable reliable AI-assisted development.

Contents:
1. Central Resume Data Model (`ResumeData_v1`)
2. Schema versioning conventions
3. Data policy (v0/v1)
4. AI Coach MVP protocol (state machine + message schema)
5. Language scope for v1

---

# 1. Central Resume Data Model (`ResumeData_v1`)

All modules should work from this shared structure or a close derivative.

```ts
export type ResumeBullet_v1 = {
  id: string;
  text: string;
};

export type ResumeExperienceItem_v1 = {
  id: string;
  title?: string;
  company?: string;
  location?: string;
  startDate?: string; // ISO or raw
  endDate?: string | "present";
  bullets: ResumeBullet_v1[];
};

export type ResumeData_v1 = {
  rawText: string;
  language: "en" | "fa" | "other";
  summary?: string;
  experience: ResumeExperienceItem_v1[];
  skills: string[];
  educationEntries?: string[];
  detectedRoles: string[];
  seniority: "junior" | "mid" | "senior" | "lead" | "unknown";
};
Rules:
Analyzer is the primary producer of ResumeData_v1.

Rewrite, CPA, and Coach must consume this model or stable subsets.

All bullets must have persistent ids so Coach, Rewrite, and CPA reference the same items.

2. Schema Versioning
Each module’s output must be versioned.
We never break a version once released.
If incompatible changes are needed → create _v2.

Naming conventions
Types / interfaces:

ResumeAnalysisPro_v1

RewriteBulletOutput_v1

CpaMvpResult_v1

CoachTurn_v1

CoachMessageType_v1

Files:

types/analysis_v1.ts

types/rewrite_v1.ts

types/cpa_mvp_v1.ts

types/coach_v1.ts

Examples
ts
Copy code
// types/analysis_v1.ts
export interface ResumeAnalysisPro_v1 {
  resumeData: ResumeData_v1;
  overallScore: number;
  sectionScores: {
    experience: number;
    skills: number;
    education: number;
    formatting: number;
  };
  ats: {
    keywordFitScore: number;
    passProbability: number;
    topKeywords: string[];
  };
  strengths: string[];
  issues: string[];
  improvementIdeas: string[];
}
ts
Copy code
// types/rewrite_v1.ts
export interface RewriteBulletOutput_v1 {
  bulletId: string;
  original: string;
  improved: string;
  reason: string;
  changeTags: {
    strongerVerb: boolean;
    addedMetric: boolean;
    moreSpecific: boolean;
    removedFluff: boolean;
  };
  estimatedImpact?: "low" | "medium" | "high";
}
ts
Copy code
// types/cpa_mvp_v1.ts
export interface CpaMvpResult_v1 {
  overallFitScore: number;
  skillsGap: {
    coreMatched: string[];
    coreMissing: string[];
  };
  toolsGap: {
    matched: string[];
    missingCritical: string[];
  };
  experienceGap: {
    missingExperienceTypes: string[];
  };
  seniority: {
    userLevel: "junior" | "mid" | "senior" | "lead" | "unknown";
    roleExpectedLevel: "junior" | "mid" | "senior" | "lead" | "unknown";
    gap: "underqualified" | "aligned" | "overqualified";
  };
  industry: {
    keywordsMatched: string[];
    keywordsMissing: string[];
  };
  roadmap30days: string[];
}
3. Data Policy (v0/v1)
A lightweight temporary policy for launch and early versions.

For v0 / early v1:
Do not permanently store raw resume text.

You may store:

aggregated analytics (scores, counts)

minimal debugging logs (no PII)

Coach conversation memory:

in-memory per session

OR short-lived (e.g., 72 hours)

Principles:
Minimize retained sensitive data.

Default to ephemeral processing.

Easy future support for "Delete my data".

4. AI Coach MVP Protocol
The Coach is a typed, structured state machine — not a free chat.

4.1 Coach Message Schema
ts
Copy code
export type CoachMessageType_v1 =
  | "greeting"
  | "analysis_feedback"
  | "bullet_focus"
  | "rewrite_explanation"
  | "roadmap_hint"
  | "closing";

export type CoachTurn_v1 = {
  id: string;
  role: "user" | "coach";
  type: CoachMessageType_v1;
  text: string;
  relatedBulletId?: string;
  relatedSection?:
    | "summary"
    | "experience"
    | "skills"
    | "education"
    | "general";
  createdAt: string; // ISO
};
4.2 Coach State Machine (MVP)
greeting
Coach greets and reflects key resume stats.

analysis_feedback
1–2 strengths + 1–2 issues overview.

bullet_focus
Coach selects a weak bullet by bulletId and asks to improve it.

rewrite_explanation
Coach shows improved bullet (via Rewrite Engine) + explanation.

closing
Offer next steps or close session.

This structure gives deterministic behavior with high perceived intelligence in MVP.

5. Language Scope for v1
To maximize quality and minimize model variance:

v1 primary language:
English only

Other languages (Farsi, etc.) may work by accident but are not officially supported.

Later releases may add:

language detection

localized prompts

multilingual pipelines

But v1 focuses on English-first reliability.
