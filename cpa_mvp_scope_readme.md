# Career Path Analyzer (CPA) — MVP Scope
**Version:** v1.0-MVP
**Purpose:** This document defines the exact scope for the MVP implementation of the Career Path Analyzer.

This version is intentionally simplified so engineering can implement it within 7 days, while keeping compatibility with the full CPA architecture.

---

## 1. Overview
The Career Path Analyzer identifies the gap between the user's current resume and the target job role. The MVP focuses on **5 core gap types** and produces a simple actionable output.

This MVP excludes advanced features, roadmap phases, AI Coach integration, and deep scoring logic.

---

## 2. Required Inputs
### A. Resume Parsed Data (from Score Engine)
Must include:
- extractedSkills: string[]
- extractedTools: string[]
- experienceBullets: string[]
- detectedTitles: string[]
- seniorityEstimate: "entry" | "mid" | "senior" | "lead"
- industryKeywords: string[]

### B. Job Description Parsed Data (from JD Optimizer)
Must include:
- requiredSkills: string[]
- requiredTools: string[]
- responsibilities: string[]
- seniorityExpected: "entry" | "mid" | "senior" | "lead"
- domainKeywords: string[]

### C. Mini User Profile
```json
{
  "targetRole": "Product Manager",
  "yearsExperience": 4,
  "currentIndustry": "E-commerce",
  "skillsUserClaims": ["SQL", "A/B Testing"]
}
```

No additional optional fields are included in MVP.

---

## 3. MVP Analysis Layers (Simplified)
### 1. Skills Gap Engine (Required)
Outputs:
- coreMatched: string[]
- coreMissing: string[]

Logic: simple intersection + difference between resume skills and JD required skills.

### 2. Tools/Tech Stack Gap Engine (Required)
Outputs:
- matched: string[]
- missingCritical: string[]

Logic: same as skills gap, but only for tools.

### 3. Experience Gap Engine (Basic)
Outputs:
- missingExperienceTypes: string[]

Logic: match responsibilities keywords with resume bullets.

### 4. Seniority Match Engine (Basic)
Outputs:
- userLevel: seniorityEstimate
- roleExpectedLevel: seniorityExpected
- gap: "underqualified" | "aligned" | "overqualified"

Logic: simple numeric mapping (entry=1, mid=2, senior=3, lead=4).

### 5. Industry Alignment (Basic)
Outputs:
- keywordsMatched: string[]
- keywordsMissing: string[]

Logic: intersection + difference of industry keywords.

---

## 4. MVP Output JSON
```json
{
  "overallFitScore": 0,
  "skillsGap": {
    "coreMatched": [],
    "coreMissing": []
  },
  "toolsGap": {
    "matched": [],
    "missingCritical": []
  },
  "experienceGap": {
    "missingExperienceTypes": []
  },
  "seniority": {
    "userLevel": "mid",
    "roleExpectedLevel": "senior",
    "gap": "underqualified"
  },
  "industry": {
    "keywordsMatched": [],
    "keywordsMissing": []
  },
  "roadmap30days": [
    "Add missing core skills to resume",
    "Improve 3 experience bullets with measurable metrics"
  ]
}
```

Notes:
- `overallFitScore` can be a simple weighted average of 5 gap sections.
- Roadmap is **30 days only** and limited to 1–3 actions.

---

## 5. API Contract (MVP)
### Endpoint
`POST /api/career-path/analyze`

### Request
```json
{
  "resumeData": { ... },
  "jobDescriptionData": { ... },
  "userProfile": { ... }
}
```

### Response
The MVP JSON structure defined above.

---

## 6. Out of Scope (V1 Only)
The following are intentionally excluded from MVP:
- 60/90 Day Roadmap
- Detailed Experience Scope Analysis
- Outdated Tools Detection
- Role-Specific Scoring Weight Adjustments
- Seniority Confidence Levels
- Project Recommendations
- CoachHints
- Multi-JD comparison
- Pivot-intent logic

These will be added in CPA v2.

---

## 7. Implementation Timeline (7 Days)
### Day 1–2
- Skills Gap + Tools Gap

### Day 3
- Seniority Match Engine

### Day 4
- Experience Gap (basic)

### Day 5
- Industry Alignment (basic)

### Day 6
- JSON output + combine layers

### Day 7
- `/api/career-path/analyze` endpoint + testing

---

## 8. File Structure
```
lib/
 └── analyzers/
      └── career-path.ts   // main analyzer
```

---

## 9. Notes for Engineering
- All layers are deterministic
- No external API calls required for MVP
- Reuse parsed resume data from Score Engine
- Keep logic pure functions for easy unit testing

---

**End of MVP Scope Document**