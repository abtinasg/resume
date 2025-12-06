---
**⚠️ LEGACY DOCUMENT (UPLOADED ARCHIVE)**

This document describes the pre-Agent v2 architecture (4-engine system) and is preserved for historical reference and implementation details.

**Current Architecture:** [Agent Architecture v2](../../agent/agent_architecture_v2.md)  
**Migration Guide:** [Migration Guide](../../agent/migration_guide.md)  
**Status:** Historical reference only  
**Archive Date:** December 7, 2025

---


**Status:** Design Complete  
**Purpose:** Production-ready design for the full Rewrite Engine used by ResumeIQ.  
**Audience:** Engineering, Product, AI Prompt/Model owners.

---

## 1. Overview

The Rewrite Engine is responsible for transforming resume content (primarily experience bullets and summary sections) into **strong, role-specific, ATS-safe** versions **without fabricating facts**.

It sits on top of:

- **Score Engine** (for weakness detection & impact scoring)  
- **Career Path Analyzer (CPA)** (for gap awareness, role expectations, roadmap)  
- **JD Optimizer** (for keyword & JD relevance)  

and is consumed by:

- **AI Coach** (interactive rewrite & guidance)  
- **Web UI** (one-click improvements)  
- **Premium Tier features** (PRO rewrites, multiple variants, role presets)

---

## 2. Goals

1. **Improve hiring outcomes** by producing clearer, impact-first resumes tailored to target roles.  
2. **Stay truthful** — never invent responsibilities, titles, metrics, or tools.  
3. **Integrate deeply** with Score Engine & CPA to generate gap-aware rewrites.  
4. **Support multiple modes** (single bullet, entire section, summary, full resume).  
5. **Expose clean APIs** for UI and AI Coach to call.

---

## 3. Core Principles (Global Guardrails)

These apply to all Rewrite Engine modes:

- **No Fabrication**
  - Do NOT create achievements, metrics, titles, tools, or responsibilities not present or strongly implied in the input.
  - Preserve factual meaning.

- **Role-Specific**
  - The rewrite must be aligned with `targetRole` and, when available, `jobDescriptionText`.

- **ATS-Safe**
  - No tables, emojis, icons, fancy bullet styles, or non-standard characters.
  - Plain-text bullets, simple formatting.

- **Impact-Oriented**
  - Prefer structures like:  
    `Action verb + what you did + how + measurable result (if present/implied).`

- **Deterministic-ish**
  - Same input → very similar output (low temperature, stable prompts).

- **Explainable**
  - For each rewrite, provide a short explanation of what improved and simple change tags.

---

## 4. Use Cases (v2 / v3)

The full engine supports these use cases:

### v2 (Core Full Version)
1. Rewrite a **single bullet** (with role context).  
2. Rewrite **multiple bullets** of one experience section.  
3. Rewrite the **Summary/Headline**.  
4. Suggest improvements to **Skills section phrasing** (without adding new skills).  
5. Gap-aware rewrites:
   - Use **Score Engine** flags (weak verbs, no metrics, vague bullets).
   - Use **CPA** gaps (missing experience types, seniority expectations).

### v3 (Advanced / PRO)
6. Generate **multiple rewrite variants** (2–3 options per bullet).  
7. Style presets:
   - `focus`: `"metrics" | "leadership" | "technical" | "concise"`.  
8. JD/keyword-aware rewriting:
   - Incorporate missing JD keywords naturally (only if true for the candidate).  
9. Full experience section rewrite with **consistency** (tone, tense, style).  
10. Interactive AI Coach rewrites (iterative refinement).

---

## 5. Inputs

### 5.1 Shared Context

Reusable context passed into most Rewrite Engine calls:

```ts
export interface RewriteContext {
  targetRole: string;              // e.g. "Senior Product Manager"
  jobDescriptionText?: string;     // raw JD text (optional, especially in PRO)
  language?: "en" | "fa";          // default: "en"

  // Optional analysis context
  scoreEngineData?: ScoreEngineContext;  // Output subset from Score Engine
  cpaData?: CPAContext;                  // Output subset from Career Path Analyzer
}
```

You can keep `ScoreEngineContext` / `CPAContext` minimal at first (v2) and extend later.

### 5.2 Single Bullet Input (v2)

```ts
export interface RewriteBulletInput {
  bullet: string;
  context: RewriteContext;
}
```

### 5.3 Multi-Bullet / Section Input (v2 / v3)

```ts
export interface RewriteSectionInput {
  bullets: string[];
  sectionTitle?: string; // e.g. "Experience", "Projects"
  context: RewriteContext;
}
```

### 5.4 Summary Rewrite Input (v2)

```ts
export interface RewriteSummaryInput {
  summaryText: string;   // current summary/ headline
  context: RewriteContext;
}
```

### 5.5 Advanced Options (v3)

```ts
export interface RewriteOptions {
  styleFocus?: "metrics" | "leadership" | "technical" | "concise";
  variants?: number;               // e.g. 2 or 3 variations (max 3)
  maxLength?: number;              // optional character/word limit
}
```

---

## 6. Outputs

### 6.1 Single Bullet Output (v2)

```ts
export interface RewriteBulletOutput {
  original: string;
  improved: string;

  reason: string; // Short explanation: what changed & why
  changeTags: {
    strongerVerb: boolean;
    addedMetric: boolean;
    moreSpecific: boolean;
    removedFluff: boolean;
    tailoredToRole: boolean;
  };

  estimatedImpact?: "low" | "medium" | "high"; // perceived effect on readability/impact
  estimatedScoreGain?: number; // optional integration with Score Engine (0–10)
  warnings?: string[]; // e.g. ["No clear metric available to add"]
}
```

### 6.2 Multi-Bullet / Section Output (v2 / v3)

```ts
export interface RewriteSectionOutput {
  originalBullets: string[];
  improvedBullets: RewriteBulletOutput[]; // one per original bullet
  sectionLevelNotes?: string[];           // e.g. "Unified tense to past; improved overall clarity."
}
```

### 6.3 Summary Rewrite Output (v2)

```ts
export interface RewriteSummaryOutput {
  original: string;
  improved: string;
  reason: string;
  changeTags: {
    clearerPositioning: boolean;
    addedKeySkills: boolean;      // only if skills already present elsewhere
    shortened: boolean;
    moreSpecific: boolean;
  };
}
```

### 6.4 Advanced Variant Support (v3)

```ts
export interface RewriteBulletVariant {
  improved: string;
  styleApplied?: "metrics" | "leadership" | "technical" | "concise";
}

export interface RewriteBulletOutputV3 extends RewriteBulletOutput {
  variants?: RewriteBulletVariant[];
}
```

---

## 7. Internal Architecture (Conceptual)

### Stage 1 — Bullet Classification & Parsing
- Detect sentence type, tense, length, presence of metrics, presence of verbs.
- Tag bullet with flags:
  - `hasMetric`, `hasStrongVerb`, `tooLong`, `tooVague`, etc.

### Stage 2 — Rewrite Planning
- Plan what to change before calling the LLM:
  - If weak verb → plan to upgrade verb.
  - If no metric but implied numbers (e.g. “improved performance”) → **ask user or keep generic**, do NOT invent exact numbers.
  - If CPA indicates missing experience type (e.g. leadership) → highlight in reasoning, but only reflect in text if supported by bullet.

> Planning Stage generates a **rewrite instruction object** fed into prompts.

### Stage 3 — LLM Rewrite Generation
- Use a well-structured prompt:
  - Provide:
    - Original bullet
    - Target role
    - (Optional) JD text
    - Planning instructions (what to improve)
    - Global guardrails (no fabrication)
  - Ask for JSON output matching `RewriteBulletOutput` shape.

### Stage 4 — Validation & Safety
- Post-process LLM output:
  - Ensure it did not add tools/skills/roles not present.
  - Length within bounds.
  - No special characters, emojis, or formatting.
  - If validation fails, either:
    - Retry with stricter prompt, or
    - Return original bullet + warning.

### Stage 5 — Score/Impact Estimation
- Option 1 (simple): heuristic based on changeTags (e.g. addedMetric = +3, strongerVerb = +2, etc.).  
- Option 2 (later): re-run Score Engine on improved bullet and compute delta.

---

## 8. API Design

### 8.1 MVP Endpoint (already defined)
`POST /api/rewrite/bullet` → uses `RewriteBulletInput` → returns `RewriteBulletOutput`.

### 8.2 v2 Endpoints

#### 1) Rewrite Experience Section
`POST /api/rewrite/section`

**Request:**
```json
{
  "bullets": ["...", "..."],
  "sectionTitle": "Experience",
  "context": {
    "targetRole": "Senior Product Manager",
    "jobDescriptionText": "..."
  }
}
```

**Response:** `RewriteSectionOutput`

---

#### 2) Rewrite Summary
`POST /api/rewrite/summary`

**Request:**
```json
{
  "summaryText": "Experienced engineer with...",
  "context": {
    "targetRole": "Backend Engineer"
  }
}
```

**Response:** `RewriteSummaryOutput`

---

### 8.3 v3 Advanced Endpoint (Optional / PRO)

`POST /api/rewrite/bullet/advanced`

**Request:**
```json
{
  "bullet": "Worked on API integrations for the product team.",
  "context": {
    "targetRole": "Backend Engineer",
    "jobDescriptionText": "..."
  },
  "options": {
    "styleFocus": "metrics",
    "variants": 3
  }
}
```

**Response:** `RewriteBulletOutputV3`

---

## 9. Integration with Score Engine & CPA

### From Score Engine:
- Flags for:
  - weak verbs
  - missing metrics
  - overly long bullets
  - vague phrases
- Estimated effect on score.

### From CPA:
- Missing experience types (e.g. “ownership”, “cross-functional collaboration”).
- Seniority expectations (e.g. needs more leadership emphasis).
- Industry/domain context.

**Important:**  
Rewrite Engine may **reference** CPA/Score Engine feedback in `reason` and planning, but must not fabricate content to “fake” filling gaps.

---

## 10. Implementation Plan (High-Level)

### v2 (2–3 weeks)
- Implement:
  - Single bullet rewrite (already MVP)  
  - Multi-bullet section rewrite  
  - Summary rewrite  
  - Simple impact estimation  
- Integrate:
  - Score Engine flags (as optional context)  
- Ship as: **PRO feature + limited free use**

### v3 (3–4 weeks)
- Add:
  - Variants generation  
  - Style presets  
  - Deeper CPA integration  
  - Full section consistency rewriting  
- Integrate with:
  - AI Coach for interactive rewriting  
- Add:
  - A/B tests on rewrite adoption & score improvement.

---

## 11. Prompting Guidelines (for `prompts-rewrite.ts`)

High-level rules:

1. Always include an explicit instruction:
   > *"Do NOT add new tools, skills, job titles, companies, or achievements that are not present in the original bullet."*

2. Always constrain output to a **single bullet sentence**, no lists.

3. Ask the model to return the result as JSON conforming to the TypeScript interfaces.

4. For styleFocus options, include conditional instructions:
   - `"metrics"` → prioritize highlighting or clarifying measurable outcomes if present.  
   - `"leadership"` → highlight leading, coordinating, decision-making if present.  
   - `"technical"` → emphasize technologies, architecture, performance aspects.

---

## 12. File Structure Recommendation

```txt
lib/
  rewrite/
    bullet-rewriter.ts        // core bullet rewrite
    section-rewriter.ts       // multi-bullet & section-level
    summary-rewriter.ts       // summary/headline rewrite
    prompts-rewrite.ts        // all prompts
    validators.ts             // safety checks / fabrication guardrails
    types.ts                  // all TS interfaces (input/output)
```

---

## 13. Testing Strategy

- Unit tests:
  - For planning logic
  - For validators
  - For heuristic scoring

- Snapshot tests:
  - Fixed input bullets → stable output (with test LLM or stubbed output).

- Integration tests:
  - End-to-end `/api/rewrite/bullet` & `/api/rewrite/section`.

---

**End of Full Rewrite Engine Specification (v2/v3)**  
This file can be added to the repo as:  
`docs/rewrite_engine_full.md` or `lib/rewrite/README-full.md`.
