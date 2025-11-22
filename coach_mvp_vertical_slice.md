# ResumeIQ – AI Coach MVP Vertical Slice (V1)

**Status:** Ready for implementation  
**Scope:** Very small vertical slice – After Score → Coach → Single Bullet Rewrite  
**Owners:** Founders (You + OS5.0) + Engineering (Abtin)  
**Last Updated:** 2025-11

---

## 1. Goal

Build the **smallest possible, end-to-end version** of the AI Coach that:

1. Uses real resume input  
2. Produces a simple score + 1–2 issues  
3. Lets the user trigger the Coach  
4. Coach:
   - explains the score in plain language  
   - picks **one** weak bullet  
   - offers an improved version of that bullet  
5. User sees **Before / After** and can accept the rewrite.

This is a **vertical slice**:
- Not full Coach  
- Not full Score Engine  
- Not full CPA  
- Just enough to prove the “Coach experience” works.

---

## 2. In-Scope vs Out-of-Scope

### In-Scope (for this MVP slice)
- Simple scoring logic (can be rule-based or stubbed, not PRO Engine)
- Identifying **one** “weak bullet” from the resume
- Simple Coach message (first interaction only)
- Single-bullet rewrite using the Rewrite Engine (even if MVP prompt-based)
- UI to:
  - show score & issues
  - show Coach’s first message
  - show Before / After for one bullet
  - allow “Accept” or at least visually confirm change

### Out-of-Scope (for this slice)
- Full Score Engine PRO+  
- Full CPA (Career Path Analyzer) UI  
- Multi-step conversations with Coach  
- Multiple rewrites per session  
- Roadmap, multi-day plans, advanced actions  
- Saving history to DB (can be added later)

---

## 3. User Story (Primary Scenario)

> As a mid-level tech professional,  
> I upload my resume,  
> see a score and a short explanation,  
> then ask the AI Coach what to fix first,  
> and get one improved version of a weak bullet,  
> so that I can see clear, concrete improvement without feeling overwhelmed.

---

## 4. UX Flow (Step-by-Step)

### Step 1 – Upload & Analyze
- User visits main page.
- User uploads resume (PDF or text).
- Frontend calls `POST /api/analyze-mvp`.
- Backend returns:
  - a simple score (0–100)
  - 1–2 short “issues”
  - a list of extracted bullets
  - index of **one weak bullet** selected as candidate

UI:
- Show score (e.g. “Score: 72/100”).
- Show 1–2 issues in a small list.
- Show button: **“Ask Coach What to Fix First”**.

---

### Step 2 – Ask Coach
- User clicks **“Ask Coach What to Fix First”**.
- Frontend calls `POST /api/coach/first-message`.

Input:
- `score`
- `issues`
- `weakBullet`
- `role` (if known; for now can be optional string)

Backend:
- Generates a short Coach message:
  - explains why score is at this level
  - mentions the weak bullet
  - proposes: “Let’s improve this bullet together.”

Output:
- `coachMessage`
- `weakBullet` (same text)
- maybe some metadata (e.g. reason for picking this bullet)

UI:
- Show Coach message in a chat-like bubble.
- Below it, show the selected bullet with label:
  - “We’ll improve this one:”
- Show button: **“Rewrite this bullet”**.

---

### Step 3 – Rewrite Bullet
- User clicks **“Rewrite this bullet”**.
- Frontend calls `POST /api/rewrite/bullet-mvp`.

Input:
- `bulletText`
- `role` (optional)
- maybe `language` if needed later

Backend:
- Calls Rewrite Engine (MVP prompt is enough).
- Applies simple “micro-sequence”:
  - stronger verb
  - clearer scope
  - add metric only if safe
- Returns:
  - `original`
  - `improved`
  - `reason` (1–2 sentences)

UI:
- Show **Before / After** side-by-side or stacked:
  - “Before:” original
  - “After:” improved
- Show short explanation:
  - “Reason: strengthened verb + added impact.”
- Optional: button `Accept` (no need to persist in DB for this slice, can just visually mark as accepted).

---

## 5. API Design (MVP Level)

### 5.1 `POST /api/analyze-mvp`

**Purpose:**  
Basic resume analysis for this vertical slice.

**Request Body (MVP)**:
```json
{
  "resumeText": "string"
}


Response (MVP, non-PRO):

{
  "score": 72,
  "issues": [
    "Most bullets lack clear impact or metrics.",
    "Leadership signals are low for a mid-level role."
  ],
  "bullets": [
    "Worked on internal dashboards for management.",
    "Helped the team with API integrations.",
    "Participated in planning meetings."
  ],
  "weakBulletIndex": 0
}


Backend logic (MVP allowed):

score can be heuristic or stubbed (e.g. count of verbs, length, etc.)

weakBulletIndex = choose the shortest / most vague bullet for now

5.2 POST /api/coach/first-message

Purpose:
Generate the first Coach message right after analysis.

Request Body:

{
  "score": 72,
  "issues": [
    "Most bullets lack clear impact or metrics.",
    "Leadership signals are low for a mid-level role."
  ],
  "weakBullet": "Worked on internal dashboards for management.",
  "role": "Product Manager"
}


Response:

{
  "coachMessage": "Your score landed at 72 mainly because your bullets don't clearly show impact or leadership yet. Let's start with one easy win: we’ll improve this bullet about dashboards so it shows what you built and why it mattered.",
  "weakBullet": "Worked on internal dashboards for management."
}


Implementation:

Can be a single LLM call with a strict prompt.

No need for full Decision Engine implementation yet; we mimic its behavior for this slice.

5.3 POST /api/rewrite/bullet-mvp

Purpose:
Rewrite a single bullet according to our micro-action sequence.

Request Body:

{
  "bulletText": "Worked on internal dashboards for management.",
  "role": "Product Manager"
}


Response:

{
  "original": "Worked on internal dashboards for management.",
  "improved": "Delivered internal analytics dashboards for the leadership team, improving visibility into product performance and weekly KPIs.",
  "reason": "Strengthened the verb, clarified what you delivered, and added impact for stakeholders."
}


Notes:

Must respect no fabrication rule.

No fake metrics – only impact phrasing if metric is not known.

6. Frontend Requirements (MVP)

Simple page/state that can show:

Score + Issues

e.g. a card: “Score: 72/100”

list issues in 1–2 bullet points

Ask Coach Button

labeled clearly: “Ask Coach What to Fix First”

Coach Message UI

chat-like bubble or panel:

“Coach: [text]”

show selected weak bullet below

Rewrite Button

“Rewrite this bullet”

Before / After View

two boxes:

Before: [original bullet]

After: [improved bullet]

show small reason text under “After”

No need for:

multi-step chat history

saving user profiles

advanced layout

7. Backend Requirements (MVP)

Minimal glue around existing / upcoming libs:

simple bullet extraction from resumeText (e.g. split by newlines, filter lines starting with "-"
or verbs)

simple score calculation (even placeholder logic)

LLM call wrapper for:

coach/first-message

rewrite/bullet-mvp

Error handling:

return safe errors if resume too short / no bullets found.

Important:
All prompts must enforce:

no new experiences

no fake metrics

no invented tools/companies

8. Non-Goals for This Slice

No dashboard history

No user accounts

No full Coach Decision Engine implementation

No multi-turn conversation handling

No integration with full Score Engine PRO or CPA UI

No analytics tracking (can be added later)

9. Dev Tasks (Abtin-Facing Checklist)

Backend:

 Implement POST /api/analyze-mvp

 Basic resumeText parsing

 Simple scoring heuristic

 Bullet extraction + weakBulletIndex

 Implement POST /api/coach/first-message

 LLM prompt for short coach message

 No AI meta-talk, simple human tone

 Implement POST /api/rewrite/bullet-mvp

 MVP prompt for single-bullet rewrite

 Enforce: no new facts, no fake metrics

Frontend:

 Add simple result view after upload:

 score

 issues list

 Ask Coach CTA

 Implement Coach section:

 show coachMessage

 show weak bullet

 Rewrite button

 Implement Before/After bullet view:

 original vs improved

 reason text

10. Success Criteria for This Slice

We consider this vertical slice successful if:

A user can:

Upload resume

See score + 1–2 issues

Click “Ask Coach”

Receive a clear explanation + focus on one bullet

See a convincing improved version of that bullet

Feedback from early testers (internal) is:

“I understand why my score is what it is.”

“I understand what I should fix first.”

“The new bullet looks clearly better, and still feels like me.”

This slice proves that:

Coach concept works in real life

Rewrite Engine + Coach + Score می‌تونن end-to-end کنار هم بشینن

تیم می‌تونه روی همین تجربه MVP بعداً لایه اضافه کنه (CPA, roadmap, multi-turn coach, …)