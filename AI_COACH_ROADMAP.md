📄 AI_COACH_ROADMAP.md

Version: 1.0
Owner: Product & AI Systems
Scope: AI Coach MVP → Multi-Turn → Full Integration
Status: Ready for Development

🧠 AI Coach Roadmap

This roadmap defines the complete development plan for the AI Coach — moving from a functional MVP slice to a fully integrated, multi-turn resume & career coaching system.

The roadmap is structured in 3 phases:

Phase 1 — Vertical MVP

Phase 2 — Multi-Turn + Memory

Phase 3 — Full Integration (Score PRO + CPA + Rewrite v3)

🟦 Phase 1 — Vertical MVP (Functional Slice)
🎯 Goal

Deliver the smallest fully functional, end-to-end slice:

Resume Upload → Analysis → AI Coach Message → Rewrite 1 Bullet → Before/After

This creates the first real user-facing value.

🎁 User Experience

Upload → Analyze

Simple score

1–2 key issues

Extracted resume bullets

Automatic detection of weakest bullet

Ask Coach

Coach explains why the bullet is weak

Suggests the first improvement task

Rewrite Bullet

Before / After

Short reasoning

No fabricated metrics or fake achievements

🔧 Engineering Tasks — Backend

Endpoints:

POST /api/analyze-mvp
POST /api/coach/first-message
POST /api/rewrite/bullet-mvp


Implementation Details:

Light resume parsing

Bullet extraction logic

Heuristic scoring (length, verb, metrics, clarity)

Weak bullet detection

Simple prompt templates

Strict no-fabrication guardrails

Folder structure:

/lib/coach/mvp
/lib/rewrite/mvp
/api/coach/first-message.ts
/api/analyze-mvp.ts
/api/rewrite/bullet-mvp.ts

🎨 Engineering Tasks — Frontend

Components:

UploadSection

AnalyzeResults

CoachIntroMessage

BulletRewriteResult

States:

Loading

Error

No bullets found

Success

🧪 Success Criteria — Phase 1

Full end-to-end flow works without errors

User sees score + issues

Coach provides a clear first-step explanation

A bullet is rewritten (Before/After)

Latency and UX acceptable

⏱ Estimated Time: 4–5 days
📌 Output: A real, testable AI Coach MVP

🟩 Phase 2 — Multi-Turn Coach + Memory
🎯 Goal

Transform the MVP Coach into a real mentor-like interactive experience.

🎁 User Experience

Users can respond to the Coach

Coach continues the conversation

Rewrite 2–3 bullets in sequence

Style preferences are remembered

Coach adapts based on accepted/rejected rewrites

🔧 Engineering Tasks — Backend

New Endpoint:

POST /api/coach/chat


Additions:

Simple State Machine:
initial → after-fix → continuing → final

Session Memory structure:

acceptedRewrites[]
rejectedRewrites[]
preferredStyle
lastWeakBullet
currentSection


Multi-turn prompt assembly

Integration of Rewrite-MVP inside the multi-turn flow

🎨 Engineering Tasks — Frontend

Full chat UI

Message bubbles

Auto-scroll

Multi-turn state management

Side-by-side version comparison

🧪 Success Criteria — Phase 2

Multi-turn conversation works

Memory preserved across messages

2+ rewrites in a session

Stable tone & instructions

Fast response times

⏱ Estimated Time: 8–9 days
📌 Output: A true interactive AI Coach experience

🟧 Phase 3 — Full Integration (Score PRO + CPA + Rewrite v3)
🎯 Goal

Integrate the Coach with the full system:

Score Engine PRO

Career Path Analyzer (CPA)

Rewrite Engine v3

Action Router (19 actions)

Personalized Roadmaps

This makes the Coach a world-class, differentiated product.

🎁 User Experience

Full ATS & section-level scoring

“Why did I get this score?” explanations

Top 3 weaknesses for the target role

Personalized improvement roadmap

Senior-level rewrite variants

History of changes

Long-term session continuity

🔧 Engineering Tasks — Backend

Integrations Required:

Score PRO → Coach explanation engine

CPA Analyzer → Coach reasoning (gaps, missing signals)

Rewrite Engine v3 → multi-version high-quality rewrites

Action Router → mapping Coach state → 19 possible actions

Policy Layer → tone, safety, guardrails

Serialization of long-lived memory (session/user-level)

Data Flow:

Resume
 → Score PRO
 → Coach Interpretation Layer
 → CPA Analyzer
 → Rewrite Engine v3
 → Roadmap Builder

🎨 Engineering Tasks — Frontend

Roadmap View

Skill Gap Panel

Section-based rewrites

Version comparison panel

Save history

Account integration (optional)

🧪 Success Criteria — Phase 3

Correct PRO-score reasoning

Accurate gap detection

Multi-variant rewrites

Personalized next-step roadmap

Fully integrated UI/UX flows

High user satisfaction

⏱ Estimated Time: 8–12 days
📌 Output: AI Coach — Full Version

🟣 System Architecture Overview
AI Coach
 ├── MVP Layer
 │     ├── Analyze MVP
 │     ├── First Message
 │     └── Bullet Rewrite MVP
 ├── Multi-Turn Layer
 │     ├── State Machine
 │     ├── Memory (Session)
 │     └── Multi-Turn Chat Endpoint
 └── Full Integration Layer
       ├── Score PRO Integration
       ├── CPA Integration
       ├── Rewrite Engine v3
       ├── Action Router (19 actions)
       └── Policy & Safety Layer

📌 Engineering Notes

Phase 1 must stay small, vertical, and strict

No PRO features in Phase 1

No multi-turn in Phase 1

No roadmap/CPA in Phase 1

All prompts must be deterministic

“No Fabrication” rule is mandatory across all phases

Each phase expands depth, not scope clutter

✅ Ready for Development

This file represents the official development roadmap for the AI Coach.
Once Phase 1 is completed, real user testing begins immediately.