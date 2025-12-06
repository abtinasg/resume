---
**⚠️ LEGACY DOCUMENT (UPLOADED ARCHIVE)**

This document describes the pre-Agent v2 architecture (4-engine system) and is preserved for historical reference and implementation details.

**Current Architecture:** [Agent Architecture v2](../../agent/agent_architecture_v2.md)  
**Migration Guide:** [Migration Guide](../../agent/migration_guide.md)  
**Status:** Historical reference only  
**Archive Date:** December 7, 2025

---

**Version:** 1.0  
This document extends the MVP scope with full (v2 / v3) functionality and includes pre‑written GitHub Issues for engineering.

---

# 📌 Part 1 — Full CPA Scope (v2 / v3)
This section describes the complete feature set for the fully realized Career Path Analyzer.

## 🎯 Goals of Full Version
- Deep, human-level analysis of user's fit for the target role
- Generate role-specific, industry-aware recommendations
- Enable AI Coach to provide expert career guidance
- Support Premium tier features (PRO)

---

# 🔥 Section A — Full Analysis Layers (Final Version)
This expands MVP to complete capabilities.

## 1. Skills Gap Engine — Advanced v2
- Detect synonyms and related skills (e.g., “data wrangling” → “data cleaning”)  
- Skill category grouping (technical, soft, leadership)  
- Skill strength scoring (0–100)
- Missing skill criticality levels (critical, recommended, optional)

**New Output Fields:**
- `skillStrengths`  
- `skillCategories`  
- `criticalityMap`

---

## 2. Tools/Tech Stack Gap — Advanced v2
- Detect outdated technologies
- Map adjacent tools (e.g., React ↔ Vue)  
- Provide learning path suggestions for missing critical tools

**New Output:**
- `outdatedTools`  
- `adjacentToolsRecommendations[]`

---

## 3. Experience Gap Engine — Advanced v3
- Detect scope level (task → feature → product → org)
- Detect leadership signals
- Detect cross-functional collaboration
- Impact quality score (0–100)
- Identify missing responsibility categories
- Suggest project ideas (portfolio, internal, open-source)

**New Output:**
- `scopeLevel`  
- `impactScore`  
- `responsibilityCoverageMap`  
- `projectRecommendations[]`

---

## 4. Seniority Match Engine — Advanced v2
- Estimate seniority using NLP on verbs and responsibility types  
- Gap severity scoring  
- Suggest steps to reach next seniority level

**New Output:**
- `seniorityGapSeverity`  
- `nextLevelRequirements[]`

---

## 5. Industry Alignment Engine — Advanced v2
- Domain expertise level (none, adjacent, strong)  
- Missing domain terminology detection  
- Recommended domain-learning resources

**New Output:**
- `domainExperienceLevel`  
- `domainResources[]`

---

## 6. 30–60–90 Day Roadmap — Full v3
- 30-day: quick wins  
- 60-day: intermediate skills/tools  
- 90-day: portfolio/projects + leadership
- Estimated effort + estimated career impact

**New Output:**
- `30_days[]`, `60_days[]`, `90_days[]`
- `effort`, `impact`, `scoreGain`

---

## 7. AI Coach Integration Module — v2
- Generate personalized follow-up questions
- Provide explanations for each gap
- Provide interactive goals

**New Output:**
- `coachHints`  
- `criticalGaps[]`

---

## 8. Premium Tier Expansion — v3
- Unlimited roadmap generation
- Template-based project ideas
- Interview readiness alignment
- Salary benchmark alignment (if JD provides range)

**New Output:**
- `premiumFeaturesEnabled`

---

# ✨ Part 2 — Recommended Delivery Phases

## **CPA v2 (2–3 weeks)**
Includes:
- Advanced Skills Engine
- Tools/Tech adjacency
- Expanded Experience Gap
- Seniority v2
- Industry v2
- AI Coach hints

## **CPA v3 (1 month+)**
Includes:
- Full 30/60/90 Roadmap  
- Project recommendations  
- Leadership & impact scoring  
- Full Premium Tier support

---

# 🟦 Part 3 — Ready-to-Use GitHub Issues
Below are issues you can directly paste into GitHub.

---

## **ISSUE 1 — Implement Skills Gap Engine (Advanced v2)**
**Type:** Feature  
**Description:** Expand skills gap engine with synonyms, criticality, categories, and strength scoring.

**Acceptance Criteria:**
- Map required skills ↔ resume skills with NLP synonym detection
- Categorize skills into technical / soft / leadership
- Compute skill strength (0–100)
- Detect missing skills with criticality labels

**Output Fields:**
- `skillStrengths`  
- `skillCategories`  
- `criticalityMap`

---

## **ISSUE 2 — Implement Tools Stack Engine (Advanced v2)**
**Acceptance Criteria:**
- Identify outdated tools
- Identify adjacent modern tools
- Recommend alternatives or learning paths

**Output Fields:**
- `outdatedTools[]`
- `adjacentToolsRecommendations[]`

---

## **ISSUE 3 — Experience Gap Engine (Advanced v3)**
**Acceptance Criteria:**
- Detect responsibility category coverage
- Compute scopeLevel: task → feature → product → org
- Compute impactScore based on metrics
- Suggest 3–5 project ideas

---

## **ISSUE 4 — Seniority Match Engine v2**
**Acceptance Criteria:**
- Detect seniority with NLP
- Classify gap severity (mild / moderate / severe)
- List requirements for next seniority level

---

## **ISSUE 5 — Industry Alignment Engine v2**
**Acceptance Criteria:**
- Compute domain experience level
- Detect missing domain keywords
- Provide recommended learning materials

---

## **ISSUE 6 — Roadmap Generator v3**
**Acceptance Criteria:**
- Generate full 30/60/90 day roadmap
- Provide effort & impact fields
- Add scoreGain estimates

---

## **ISSUE 7 — AI Coach Integration**
**Acceptance Criteria:**
- Generate coachHints
- Provide 5 suggested follow-up questions
- List 3–7 critical gaps

---

# ✔ Part 4 — Summary
This file contains:
- Full Scope (v2 / v3)  
- All planned advanced features  
- GitHub issues ready to paste for development

Engineering can now build MVP → v2 → v3 using this roadmap.

**End of Document**

