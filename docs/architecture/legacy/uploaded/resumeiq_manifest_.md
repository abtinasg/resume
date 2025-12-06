---
**⚠️ LEGACY DOCUMENT (UPLOADED ARCHIVE)**

This document describes the pre-Agent v2 architecture (4-engine system) and is preserved for historical reference and implementation details.

**Current Architecture:** [Agent Architecture v2](../../agent/agent_architecture_v2.md)  
**Migration Guide:** [Migration Guide](../../agent/migration_guide.md)  
**Status:** Historical reference only  
**Archive Date:** December 7, 2025

---


**Version:** 1.1  
**Status:** Core Engine Order Fixed (Score → CPA → Rewrite → Coach)  
**Owner:** Dayan  
**Collaborator:** Lumen  
**Last Updated:** November 2025

---

## 1. What is ResumeIQ?

ResumeIQ is an intelligent resume analysis and career guidance system that helps users understand **why their resume isn't getting results**, improves it with targeted rewriting, reveals their true career path, and guides them through their professional journey through an AI Career Coach.

**Outcome:**  
+38% interview callback rate after two guided revisions.

**Positioning:**  
ResumeIQ is a **Resume Intelligence System and AI Career Coach**, not a simple Resume Builder.

---

## 2. Four Core Engines (Final Order – Corrected)

This is the official and corrected order of the system's four foundational engines.  
This order is essential for achieving the goal of becoming a full **AI Career Coach**.

### 1) Resume Scoring Engine — (Diagnosis Layer)

- ATS Compatibility  
- Content Quality  
- Human Alignment  
- PRO-Level Scoring v2  
- Readability & Structure Analysis  
- Structured JSON Output

The Scoring Engine produces the foundational diagnosis for all downstream engines.

---

### 2) Career Path Analyzer — CPA (Identity & Trajectory Layer)

- Skill extraction  
- Seniority estimation  
- Role clustering  
- Desired role alignment  
- Path recommendation  
- Skill gap detection  

CPA identifies **who the user is**, **where they stand**, and **where they can go**.  
This is essential before rewriting or coaching can happen.

---

### 3) Rewrite Engine — (Improvement Layer)

- Bullet rewrites  
- Summary rewrites  
- Metrics enrichment  
- ATS-safe output  
- Role-aligned rewriting  
- Deterministic behavior  

Rewrite Engine improves the resume **based on Score + CPA insight**.

---

### 4) AI Coach Integration — (Human Guidance Layer)

- Real-time guided chat  
- Smart Questions  
- Action Planner  
- Rewrite-on-demand  
- Goal-based advice  
- Career growth roadmap  

The Coach integrates insights from all three engines and translates them into **guidance, clarity, and next steps**.

---

## 3. Architecture (Revised Correct Flow)

```
           ┌─────────────────────────┐
           │    User Uploads CV      │
           └─────────────────────────┘
                       │
                       ▼
┌────────────────────────────────────────────────────────┐
│      1) Resume Scoring Engine (Diagnosis)              │
└────────────────────────────────────────────────────────┘
                       │
                       ▼
┌────────────────────────────────────────────────────────┐
│      2) Career Path Analyzer — CPA (Career Identity)   │
└────────────────────────────────────────────────────────┘
                       │
                       ▼
┌────────────────────────────────────────────────────────┐
│      3) Rewrite Engine (Role-Aligned Refinement)       │
└────────────────────────────────────────────────────────┘
                       │
                       ▼
┌────────────────────────────────────────────────────────┐
│      4) AI Coach Integration (Guidance Layer)          │
└────────────────────────────────────────────────────────┘
```

---

## 4. MVP Definition (Fixed and Correct)

### MVP Components:

1. **Upload → Score**  
2. **Score Result Page**  
3. **Basic Rewrite** (Bullet + Summary)  
4. **Basic CPA Lite** (context-only)  
5. **AI Coach MVP**  
6. **Registration + Dashboard History**  

### CPA in MVP = Lite Version

- Only identity inference  
- No full roadmap  
- No skill gap matrix  

---

## 5. MVP Boundaries (Forbidden Features — Not to be added until v1.0)

These features are *only allowed after version 1.0*:

- Job Description Matching
- Full CPA with roadmap generation
- Premium tier
- Achievement badges
- Blog / Content Hub
- Methodology Page
- Pricing Page
- Mobile camera capture
- Full dashboard with analytics
- Resume version comparison
- Scoring 3D visualization
- Full resume Rewrite Engine
- Export PDF
- A/B Testing
- Referral Program

**None of these enter the MVP.**

---

## 6. User Journey (Official Fixed Version)

```
Upload → Score → Insight → Rewrite → Coach → Save → Improve
```

1. User enters landing page
2. Clicks CTA → Upload Resume
3. Uploads file
4. Analysis runs → Score Results
5. Views 3 main recommendations
6. CPA Lite identifies career context
7. User applies targeted rewrites
8. Talks with Coach for guidance
9. Saves improved version to Dashboard

This path is fixed and should not change.

---

## 7. Versioning Roadmap (0 → 1 → 2)

### v0 — MVP (Coming Weeks)

Goal: A launchable version with real value and correct engine order.

### v1 — Core Product

After MVP:

- Complete CPA with full roadmap
- Advanced Dashboard
- Rewrite 2.0
- Advanced AI Coach
- Scoring Pro UI
- Export functionality
- Version comparison
- Methodology Page

### v2 — Premium Layer + Growth

- Pricing tiers
- Premium gating
- Job Description Matching
- Advanced CPA with skill gap matrix
- A/B testing
- Full mobile optimization
- Blog / SEO Hub
- Scoring 3D Visualization
- Achievement system

---

## 8. Principles of the Product

- **Speed is core value** (6 minutes → complete analysis)
- **We don't fabricate**; we strengthen truth
- **Coach is truthful and precise**
- **No data stored without permission**
- **Simple solution = fast sale**
- **MVP is minimal; version 1 is complete**
- **Correct engine order = real career coaching**

---

## 9. What Makes ResumeIQ Different

- Research on 1,200 users — **+38% callback rate**
- **Scoring Engine with real Human Alignment**
- **Completely factual Rewrite Engine**
- **Systematic and goal-oriented Coach**
- **Career path built into engine** → not an add-on feature
- **Correct architectural flow:** Score → CPA → Rewrite → Coach
- **"Analysis Centric" product, not "Builder Centric"**
- **AI Career Coach identity**, not just a resume tool

---

## Key Architectural Innovation

The corrected engine order (Score → CPA → Rewrite → Coach) ensures that:

1. **Diagnosis comes first** (what's wrong?)
2. **Identity is established** (who is this person professionally?)
3. **Improvement is targeted** (fix what matters for their path)
4. **Guidance is personalized** (coach based on complete context)

This flow transforms ResumeIQ from a resume tool into a true **AI Career Intelligence System**.

---

## License

All rights reserved © 2025 ResumeIQ

---

## Contact

For questions or collaboration:  
**Founder:** Dayan  
**AI Co-Founder:** Lumen