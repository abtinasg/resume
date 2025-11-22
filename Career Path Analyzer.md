✅ Career Path Analyzer — README.md (Ready for GitHub)
# Career Path Analyzer (CPA)
**Version:** v1.0  
**Status:** Ready for Implementation  
**Folder:** `lib/analyzers/career-path.ts`

The Career Path Analyzer identifies gaps between the user's current resume and a target job role using structured extracted data, job description parsing, and a mini user profile.  
It outputs a complete Job Fit Score, Gap Analysis, and a 30–60–90 day improvement roadmap.

---

## 🚀 Features

- Skills Gap Analysis  
- Tools & Tech Stack Gap  
- Experience Depth & Scope Evaluation  
- Seniority Alignment  
- Industry Alignment  
- 30–60–90 Day Personalized Roadmap  
- Coach Hints for AI Career Coach  

All outputs are deterministic and designed to integrate with the Score Engine + JD Optimizer.

---

## 📥 Inputs

### **1. Resume Data (from Score Engine)**
- Extracted skills  
- Tools & technologies  
- Soft skills  
- Experience bullets  
- Job titles detected  
- Seniority estimation  
- Impact metrics  
- Industry keywords  

### **2. Job Description Parsed Data (from JD Optimizer)**
- Required skills  
- Required tools  
- Responsibilities  
- Expected seniority  
- Domain keywords  

### **3. Mini User Profile**
```json
{
  "targetRole": "Product Manager",
  "yearsExperience": 4,
  "currentIndustry": "E-commerce",
  "skillsUserClaims": ["SQL", "Jira", "A/B Testing"]
}

Optional:

seniorityGoal

careerPivotIntent

🧠 Analysis Layers

Skills Gap Engine

Tools / Tech Stack Gap Engine

Experience Gap Engine

Seniority Match Engine

Industry Alignment Engine

30–60–90 Day Roadmap Generator

Each layer produces structured gap outputs + partial scores.

📤 Output (Final JSON)
CareerPathAnalysisResult
export interface CareerPathAnalysisResult {
  meta: {
    version: string;
    generatedAt: string;
    targetRole: string;
    industryCurrent?: string;
    industryTarget?: string;
    yearsExperience: number;
  };

  scores: {
    overallFitScore: number;
    skillsGapScore: number;
    toolsGapScore: number;
    experienceMatchScore: number;
    seniorityMatchScore: number;
    industryMatchScore: number;
    confidenceLevel: "low" | "medium" | "high";
  };

  skills: {
    coreMatched: string[];
    coreMissing: string[];
    niceToHaveMissing: string[];
    overstatedSkills: string[];
    comments: string[];
  };

  tools: {
    matchedTools: string[];
    missingCriticalTools: string[];
    outdatedTools: string[];
    optionalTools: string[];
    notes: string[];
  };

  experience: {
    summaryLevel: "insufficient" | "partial" | "good" | "strong";
    experienceMatchScore: number;
    missingExperienceTypes: string[];
    scopeGap: "task-level" | "feature-level" | "product-level" | "org-level";
    impactGap: "low" | "medium" | "high";
    suggestedProjects: {
      title: string;
      description: string;
      type: "portfolio" | "work-internal" | "freelance" | "learning";
    }[];
  };

  seniority: {
    userEstimatedLevel: "entry" | "mid" | "senior" | "lead" | "manager";
    roleExpectedLevel: "entry" | "mid" | "senior" | "lead" | "manager";
    seniorityMatchScore: number;
    gapType: "underqualified" | "well_aligned" | "overqualified";
    recommendation: string;
  };

  industry: {
    currentIndustry?: string;
    targetIndustry?: string;
    industryMatchScore: number;
    domainKeywordsMatched: string[];
    domainKeywordsMissing: string[];
    domainExperienceLevel: "none" | "adjacent" | "strong";
    notes: string[];
  };

  roadmap: {
    "30_days": RoadmapItem[];
    "60_days": RoadmapItem[];
    "90_days": RoadmapItem[];
  };

  coachHints: {
    suggestedQuestions: string[];
    criticalGaps: string[];
  };
}

export interface RoadmapItem {
  type: "skill" | "tool" | "project" | "experience" | "resume";
  action: string;
  rationale?: string;
  estimatedEffort?: "low" | "medium" | "high";
  estimatedImpact?: "low" | "medium" | "high";
  estimatedScoreGain?: number;
}

🔌 API Contract (Recommended)
POST /api/career-path/analyze
Request:
{
  "resumeData": { ... },  
  "jobDescriptionData": { ... },
  "userProfile": {
    "targetRole": "Product Manager",
    "yearsExperience": 4,
    "currentIndustry": "E-commerce",
    "skillsUserClaims": ["SQL", "Jira"]
  }
}

Response:
{
  "meta": {...},
  "scores": {...},
  "skills": {...},
  "tools": {...},
  "experience": {...},
  "seniority": {...},
  "industry": {...},
  "roadmap": {...},
  "coachHints": {...}
}

🏗 Implementation Notes

Create service file: lib/analyzers/career-path.ts

Processing time target: < 3 seconds

Must reuse Score Engine parsed data

Must be deterministic for identical inputs

Roadmap must stay practical + actionable

Coach hints are used directly in AI Coach session

📍 Next Steps
For Engineering:

Implement analyzer skeleton

Create helper functions for each analysis layer

Add deterministic scoring logic

Connect endpoint: /api/career-path/analyze

Add unit tests for each layer

For Design:

Build UI for:

Overall Fit Score

Top 3 Gaps

Roadmap

Coach entry points

📄 License

MIT — See repository root license.