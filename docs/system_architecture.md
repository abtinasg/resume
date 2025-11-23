# 🧠 ResumeIQ — System Architecture Overview (Engines + APIs + Routes)

**Version:** 1.0  
**Scope:** Technical Architecture (Frontend ↔ API ↔ Engines ↔ Data Flow)  
**Related Docs:**  
- `resumeiq_manifest.md` — Product Vision, Core Engines, MVP Definition  
- `ai_coach_system_design.md` — AI Coach internals  
- `CODEBASE_STRUCTURE_ANALYSIS.md` — Code structure & routing

This document is the unified system blueprint:  
What pages we have, what APIs we have/will have, and how the four core engines (Score, CPA, Rewrite, Coach) connect to each other.

---

## 1. Core Engine Stack (Logical Order)

Based on Manifest v1.1, the logical order of core engines is:

1. **Resume Scoring Engine** (Diagnosis Layer)  
2. **Career Path Analyzer – CPA** (Identity & Trajectory Layer)  
3. **Rewrite Engine** (Improvement Layer)  
4. **AI Coach Integration** (Guidance Layer)

This is the **functional** order of the system.  
The implementation order (Engineering Build Order) is defined in separate engineering documentation.

---

## 2. High-Level System Diagram

Simplified system view at macro level:

```
User (Browser)
    │
    ▼
Next.js App (Frontend: React Components, Pages, Layouts)
    │
    ▼
API Routes (app/api/*)
    │
    ▼
Core Engines (Score, CPA, Rewrite, Coach Logic)
    │
    ▼
Database / Storage (Resume Versions, History, User Profile)
```

---

## 3. Key Frontend Routes & Screens

### 3.1 Public / Marketing

**`/` — Landing + Upload**
- Hero, value proposition, "Upload Your Resume" CTA
- Embedded UploadSection → starts analysis flow

**`/how-it-works`** — Methodology explanation

**`/pricing`** — Plans / Beta messaging

**`/methodology`** — Scientific/analytical explanation of the system

**Other marketing pages** (`/insights`, `/contact`, etc.)

---

### 3.2 Core Product Flow

**`/analyze`** (or Landing with analysis state)
- Upload complete → displays analysis results (Score)
- Tabs / result sections

**`/dashboard`**
- List of resumes and versions
- Date, Score, ability to continue in Coach

**`/coach`** (typically as docked panel alongside results or in Dashboard)
- Chat with AI Coach with full context

---

### 3.3 Auth

**`/auth/login`**

**`/auth/register`**

---

## 4. API Layer & Engine Connections

This section shows which API connects to which Engine and what it gives/receives.

### 4.1 `/api/analyze` → Score Engine

**Status:** Implemented ✅

**Input:**
- Resume (extracted text from PDF / file)

**Process:**
- Call Scoring Engine (PRO/PRO+)
- Generate structured JSON:
  - Overall score
  - ATS / readability
  - Strengths / weaknesses
  - Simple before/after suggestions

**Output:**
- ResumeAnalysis JSON

**Consumers:**
- Results UI page
- AI Coach (for initial context)
- (Future) Database storage for Dashboard

---

### 4.2 `/api/cpa` → CPA / CPA-Lite

**Status:** Designed, not yet implemented ❌

**Purpose:**
- Extract user's professional identity from resume + Score output

**Input (Planned):**
- Resume text
- Summary of Score output (skills/keywords)

**Output (CPA-Lite for MVP):**
- Closest role (e.g., Junior Backend Developer)
- Level (Junior / Mid / Senior)
- Key skills
- Brief explanation: "You look closest to X roles…"

**Consumers:**
- Career Snapshot UI on results page
- AI Coach (for understanding user's goal)

---

### 4.3 `/api/rewrite/bullet` & `/api/rewrite/summary` → Rewrite Engine

**Status:** Design only, API and lib not yet built ❌

**Purpose:**
- Targeted rewriting of bullets and summary
- No fabrication, aligned with target role and best practices

**Input (Planned):**
- Bullet or summary text
- Score results (weak points, category)
- CPA-Lite results (role, level, skills)

**Output:**
- Rewritten version
- Brief explanation "why this is better"
- Multiple variants if needed

**Consumers:**
- "Improve this bullet / summary" buttons in Results UI
- Inline actions in Coach (when user says "improve this bullet")

---

### 4.4 `/api/chat/resume-coach` (and/or `/api/chat-coach`) → AI Coach Integration

**Status:** MVP implemented (chat + initial context) ✅  
Advanced version (with Action Engine / Memory) is in design phase.

**Input:**
- User message
- Context: resume analysis, Score results portion
- (Future) context from CPA + history + rewrites

**Output:**
- AI Coach text response (guidance, suggestions, next steps)
- Future: action suggestions (rewrite, apply, roadmap, etc.)

**Consumers:**
- Chat UI components on Results and Dashboard

---

## 5. Main User Data Flow (End-to-End)

This section describes the core MVP flow:

```
1) User → Upload resume (Landing / Analyze)
   - Frontend: UploadSection
   - API: /api/analyze

2) /api/analyze → Score Engine
   - Output: ResumeAnalysis JSON

3) Frontend Results Page
   - Display Score, weaknesses/strengths, Suggestions
   - This data is also passed to Coach

4) (Future) Frontend → /api/cpa
   - CPA-Lite Output: Role, Level, Key Skills
   - Display in Career Snapshot box
   - Added to Coach context

5) (Future) User clicks "Improve this bullet/summary"
   - Frontend → /api/rewrite/bullet or /summary
   - Rewrite Engine → improved version + explanation
   - UI: Before/After, Apply/Discard

6) User opens AI Coach (Docked Panel / Separate Screen)
   - Coach context:
       - Score results
       - CPA-Lite snapshot
       - (Optionally) Rewrite results
   - User asks questions, Coach provides guidance
   - Coach can trigger Rewrite

7) User saves improved resume version
   - Backend: Save Resume + Score + Metadata
   - Frontend: Dashboard shows history

8) User later returns to Dashboard → opens a version in Coach
   - Continue improving resume and career path
```

---

## 6. Implementation Status (High-Level)

For team coordination and avoiding duplication:

| Component | Status |
|-----------|--------|
| Score Engine + `/api/analyze` + Results UI | Built ✅ |
| AI Coach MVP (+ `/api/chat/resume-coach`) | Built (without CPA/Rewrite connection) ✅ |
| Dashboard UI | Built (full data connection needs completion) 🟡 |
| CPA-Lite + `/api/cpa` + Career Snapshot UI | Designed, not implemented ❌ |
| Rewrite Engine + `/api/rewrite/*` + Rewrite buttons in UI | Designed, not implemented ❌ |
| Coach Integration (using CPA + Rewrite in conversation) | Design level, no code ❌ |

---

## 7. How to Use This Document

### For Each New Feature, Check:

- Which Engine does it connect to?
- Which API does it use?
- On which page does it appear?
- What Data Flow does it follow?

### For Engineering:

Use this doc + engineering checklist to know:
- Where to build APIs
- Where to build only UI
- Where to configure Coach settings only

### For Product / Investors / Team:

This doc is the system's volume blueprint.  
It shows that ResumeIQ is not just an "analysis page,"  
but a combination of four AI engines working together in a unified flow.

---

## 8. System Integration Points

### Current Integrations:
- **Frontend ↔ Score Engine:** Fully connected via `/api/analyze`
- **Frontend ↔ AI Coach:** Basic chat functionality operational
- **Dashboard ↔ History:** Partial implementation

### Planned Integrations:
- **Score Engine → CPA → Rewrite Engine:** Sequential data flow
- **All Engines → AI Coach:** Unified context awareness
- **Dashboard → Full History + Versioning:** Complete tracking system

---

## 9. Technical Stack Summary

**Frontend:**
- Next.js (React)
- TypeScript
- Tailwind CSS

**API Layer:**
- Next.js API Routes
- RESTful endpoints

**Core Engines:**
- Score Engine (AI-powered analysis)
- CPA (Career path intelligence)
- Rewrite Engine (Content improvement)
- AI Coach (Conversational guidance)

**Data Storage:**
- Database (TBD: PostgreSQL / MongoDB)
- User profiles
- Resume versions
- Analysis history

---

## License

All rights reserved © 2025 ResumeIQ

---

## Contact

**Technical Lead:** Dayan  
**Architecture Design:** Lumen (AI Co-Founder System)

---

**Last Updated:** November 2025  
**Document Status:** Living Document — Updated as system evolves