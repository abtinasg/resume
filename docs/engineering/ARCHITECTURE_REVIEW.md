# careerQ — Phase 0 Architecture Review

> **Status:** PROPOSAL for joint review (Claude, Technical Lead · GPT-6, Product/Strategy Lead · Founder approval).
> **Author:** Claude (Technical Lead) · **Date:** 2026-10-14 · **Commit reviewed:** `82a1df9` (`main`, last change 2026-02-18)
> **Supersedes (once accepted):** `COMPREHENSIVE_AUDIT_REPORT.md`, `AUDIT_REPORT.md`, `ResumeIQ 8-Layer AI Career Agent Architecture Review.md` as the engineering source of truth.

## 0. How this review was done

Everything below is grounded in the code, not in the existing documents. Concretely:

- `npm ci`, `npx prisma generate`, then **ran** `npx jest`, `npx tsc --noEmit`, `npx next lint` and `npx next build` on a clean checkout (no secrets, SQLite, `HYBRID_MODE=false`).
- Read and traced every API route to its callers in `app/`, `components/` and `hooks/`, and every `lib/layers/*` module to its importers.
- Ran a probe of the Layer 3 fabrication validator against hand-written rewrites (results in §2.4).
- Spot-checked ~20 material claims made in the existing docs and pitch deck (§7).

Labels used: **Verified** = confirmed by reading code at the cited location or by running it. **Inferred** = reasoned, not executed. Line numbers refer to commit `82a1df9`.

No production systems, real user data, credentials, or paid services were touched.

---

## 1. What careerQ really is today

**In one sentence:** a Next.js 14 resume *analyzer* (upload → deterministic score → results page → chat coach) wrapped in roughly 53k lines of an "8-layer career agent" library, most of which is either unreachable from the product or fed hard-coded mock data.

### 1.1 Health of the build (Verified, run on 2026-10-14)

| Check | Result |
|---|---|
| `next build` | **Fails.** `lib/prompts-pro.ts:8` imports `./scoring/types`, which was deleted in commit `851a6a2` ("P0 batch 1"). `main` cannot be deployed as-is. |
| `tsc --noEmit` | **67 errors** (prompts-pro, Layer 6 tests, Layer 1 fixtures, Layer 5/3 integration tests). |
| `jest` | 43 suites / 945 tests: **924 pass, 17 fail, 4 skipped.** Failing: 3 Layer 1 calibration/golden suites (e.g. a "strong mid-level PM" fixture expected ≥72 scores 60; a "technical resume for correct role" expected >60 scores 32), plus 2 root suites that cannot start (`ai-enhanced.test.ts` mock hoisting bug; `ai-verdict.test.ts` constructs a real OpenAI client and needs a key). |
| CI | **None.** No `.github/workflows`, no Vercel/Docker config in the repo. Nothing prevented the broken build from merging. |
| Lint | Passes with warnings (hook dependency arrays). |

### 1.2 The one journey that works end to end (Verified)

`components/UploadSection.tsx:75` → `POST /api/analyze` → PDF (`pdf-parse`) / image (Tesseract OCR) / text extraction → `calculatePROScore` (deterministic regex heuristics, `lib/layers/layer1/pro-scoring/`) → optional GPT-4o "3D strict" score merged 50/50 only when `HYBRID_MODE=true` (`app/api/analyze/route.ts:133,212-221`; off by default) → results tabs → coach chat (`/api/chat-coach`, gpt-4o-mini) → if logged in, a `ResumeVersion` row is saved → dashboard lists/compares/deletes versions.

Also working: register/login (custom JWT), profile, contact form, admin user list.

### 1.3 What looks like product but isn't (Verified)

| Surface | Reality |
|---|---|
| "Before/after rewrites" in results | Not rewrites. `lib/transformAnalysis.ts:73-93` sets `before = "Issue: " + title`, `after = fix` from scoring actionables. |
| Evidence-anchored rewrite engine (Layer 3) | Implemented in the library, **no UI caller** for `/api/rewrite/*`; those routes also accept only NextAuth sessions, which normal (custom-JWT) logins don't have → 401. |
| Job fit / job list (`/jobs`) | `JobPasteForm` sends no resume; the route substitutes `"Software engineer with experience in JavaScript and Python."` (`app/api/jobs/paste/route.ts:59`). `getFitAnalysis` ignores the resume entirely and assumes 60 % skill / 50 % tool match (`lib/layers/layer6/analysis/fit-analyzer.ts:162-186`, summary string "Mock fit analysis - Layer 1 integration pending"). Jobs are never persisted; `/api/jobs/list` ranks an empty array. |
| `/job-match` | A real GPT-4o call, but gated as premium (`lib/featureGating.ts:37`) and premium can never be granted → 403 for everyone. |
| Daily / weekly plans (dashboard) | Generated from `app/api/plan/_shared/mockData.ts` — every user sees the same plan. Never persisted; "complete task" is React state only. |
| Analytics / "learning" (Layer 7) | Real aggregations over tables nothing writes (`Application`, `StrategyHistory`), so metrics are zeros. No feedback consumer exists. |
| AI Coach (Layer 8) | ~7k lines of static templates. Help widget POSTs to a GET-only route and silently falls back to local text. |
| Pricing / subscription | All mutations are stubs returning `free` (`lib/premium.ts:115-264`). No payment provider. Usage limits are never decremented. |
| Badges, blog (`/insights`), search | Empty / HTTP 501. |
| Google sign-in buttons | No Google provider configured (`lib/auth-config.ts:12`). |
| Marketing copy | "10,000+ Happy Users, 4.9/5" (`app/pricing/page.tsx:432`), "cohort of 1,200 job seekers" (`app/page.tsx:215`), named testimonials (`components/TestimonialsSection.tsx`). The pitch deck says the product is pre-beta. **These claims are unsupported and should not be live** (see Decision D-011). |

### 1.4 The "agent" (Verified)

There is no agent. Layers 1–8 are deterministic TypeScript libraries. The evaluate → strategize → plan → execute → track → learn loop is not closed anywhere in running code:

- Layer 2 (strategy) and Layer 5 (planning) run, but only on mock inputs.
- Layer 5 execution is a set of `// TODO: would call Layer 4` stubs with `userId = 'current_user'` (`lib/layers/layer5/execution/resume-actions.ts:58-120`).
- Layer 4 (state) is imported by nothing except a test setup file; a parallel `lib/services/state-service.ts` exists and is used by `/api/state`, which no UI calls.
- The declared `user_confirmed` approval type is never branched on (`lib/layers/layer5/execution/action-executor.ts:136`).
- No LLM tool use, no planning loop, no persisted plan/task entities.

---

## 2. Engineering assets worth preserving

Estimated **25–35 % of the non-test library code** is worth carrying forward. The rest is dead, stubbed, or duplicated.

### 2.1 Classification

| Component | Verdict | Reason |
|---|---|---|
| **PRO scoring core** (`layer1/pro-scoring/{algorithms,analyzers,keywords,derivedViews}`) | **Keep → recalibrate** | Deterministic, explainable, cheap, live. But golden tests fail and role keywords are hard-coded for 10 roles. |
| PRO+ / `logic-tuner` / `jd-optimizer` | **Remove** | Dead; `applyAdaptiveWeights` uses `Math.random()` (`algorithms.ts:193`); TODO stubs. |
| Layer 1 generic evaluator + parser (`evaluate.ts`, `scoring/generic.ts`, `parser.ts`) | **Refactor / merge** | A second scorer with different dimensions and no reachable caller. Parser and entity configs are reusable. |
| Layer 1 entity configs (skills/tools/industries) | **Keep** | ~2k lines of taxonomy data; useful for deterministic extraction and as LLM grounding. |
| **Layer 2 gap analysis / fit / mode selection** | **Refactor** | Sound, config-driven, deterministic. Needs real state and a real job description; today a missing JD makes skill match = 100 % (`normalization/canonicalize.ts:207`). Basis for a "Proof Gap" feature. |
| **Layer 3 evidence ledger, micro-action planner, retry loop** | **Keep** | The best-designed code in the repo and the most direct asset for "evidence-anchored" generation. |
| Layer 3 fabrication validator | **Replace / harden** | Lexical only. See §2.4. |
| Layer 3 LLM client | **Replace** | Timeout doesn't abort; SDK retries stack on top of its own; output validated by hand, not schema. Move behind a single LLM gateway. |
| Layer 4 state + `lib/services/state-service.ts` | **Refactor → one module** | Two implementations, three application-status conventions (`'APPLIED'`, `'submitted'`, `"draft"`). |
| Layer 5 planners (weekly/daily/priority) | **Keep (low priority)** | Real weighted rules; useful later as a deterministic "next best action" baseline. |
| Layer 5 execution / tracking / replanning | **Remove** | Stubs; nothing reachable. Replace with the workflow runtime in §5. |
| Layer 6 job parser + metadata extractor + config | **Keep** | Real regex/keyword extraction of requirements from pasted JDs. |
| Layer 6 fit analyzer, list/compare routes | **Replace** | Mock fit; no persistence. |
| Layer 6 scam detector / career-capital heuristics | **Keep (low priority)** | Plausible user value later. |
| Layer 7 metrics + exports | **Keep, rename "analytics"** | Real queries; drop the "learning" claim until there is a consumer and data. |
| Layer 8 coach templates (~7k lines) | **Remove most** | Static strings; keep a small explanation-template set or fold into an LLM coach with real context. |
| `lib/services/rewrite-service.ts`, `lib/openai.ts`, `lib/openai/analyzeWithAI.ts` | **Remove** | Dead and duplicative (one still points at `gpt-4-turbo-preview`). |
| `lib/prompts-pro.ts` | **Refactor** | Breaks the build; only `build3DStrictAIPrompt` is live. |
| `/api/chat-coach` vs `/api/chat/resume-coach` | **Remove one** | Keep `resume-coach` (has zod input); `chat-coach` interpolates raw user input. |
| `lib/pdfParser.ts`, `lib/imageParser.ts` | **Keep → fix & dedupe** | Copy-pasted, share a bug that corrupts text (§3.3). |
| `transformAnalysis.ts` fake rewrites | **Replace** | Presents fabricated "after" text as a rewrite. |
| `event-logger`, `scoring-service` | **Keep** | Thin, real Prisma wrappers. `InteractionEvent` is a usable append-only log. |
| Prisma schema | **Evolve** | `ResumeVersion` versioning and `InteractionEvent` are good. Missing: evidence, claims, plans, tasks, per-user jobs (`JobPosting` has no `userId`), consent/retention. SQLite only. |
| UI shell (Tailwind components, upload, results tabs, dashboard list/compare) | **Keep** | Works; restyle under the new brand. |
| Dead components (`Results3D`, `ResumePreview`, `ExitIntentModal`, `AchievementBadges`, duplicate `ResultsTabs`, `ResumeScoreCard`, `ExplanationButton`, `NotificationSettings`, `hooks/useAnalysis.ts`) | **Remove** | No importers. |
| Docs (≈33k lines across 40+ files) | **Archive** | See §7. |

### 2.2 What's actually reusable, by capability

1. **Deterministic resume rubric** (PRO) → a cheap, explainable baseline and a regression oracle for any LLM-based scoring.
2. **Evidence ledger + micro-action planner** (Layer 3) → the core of an evidence-anchored writer.
3. **Gap/fit/taxonomy logic** (Layers 1–2, 6 parser) → Proof Gap and Job Fit features, as deterministic pre/post-processing around LLM calls.
4. **Upload/parse pipeline and results UI** → onboarding.
5. **Event log + versioned resumes** → the seed of a career record.

### 2.3 Tests

The test suite is real (no `jest.mock` on business logic) and is an asset, but it overstates confidence: Layer 4/7 tests run against mocked Prisma and only check query shapes; Layer 6 assertions are loose (`fit_score > 0`); Layer 8 is mostly string-contains; every Layer 3 test that would touch the LLM is skipped without a key, so the validate/retry loop has never been exercised against a fake model. Nothing tests the API routes as wired to the UI, which is how the auth split and the dead rewrite flow went unnoticed.

### 2.4 Fabrication validator probe (Verified, run against `validateRewrite`)

| Original → rewrite | Validator |
|---|---|
| "Supported 40 customers" → "Improved retention by **40%**" | passes (unit change missed) |
| → "**Doubled** throughput…" | passes |
| → "…Python and **Snowflake**" | passes (not in ~70-word tool dictionary) |
| → "…Python and **Docker**" | **caught** |
| → "Supported 40 **Google** customers" | passes ("at Google" would be caught) |
| → "**Led a cross-functional team**…" | passes (length warning only) |
| → "Supported **millions of users**" | passes |
| Bullet 1 borrows "reduced costs 30 %" from bullet 2 | passes (no per-bullet scope) |
| Client sends `context.tools: ["Kubernetes"]`, rewrite adds Kubernetes | passes (ledger trusts client-supplied evidence, `app/api/rewrite/bullet/route.ts:40-46`) |

The "no fabrication" promise — the product's stated differentiator — is not currently enforceable. It is a solvable engineering problem (§5.5), but it must be treated as the core technical risk, with an eval set, not a regex.

---

## 3. Where the architecture is weak or overengineered

### 3.1 Overengineering

- **Spec-first, integration-never.** ~18k lines of layer specs and ~53k lines of layer code, but the layers don't talk to each other in production. Each layer has its own `types.ts`/`errors.ts`/config loader (Layer 5 `types.ts` alone is 1,087 lines around a pure planner).
- **Eight layers for one product loop.** The boundaries follow an imagined agent pipeline, not data ownership or user journeys. Layer numbering even differs between docs (`docs/Agent_MVP_Scope_v1.md` has L7 = Coach, code has L7 = Learning).
- **Config sprawl.** Versioned JSON configs (`layer2_strategy_config_v2.1.json`, `layer3_execution_config_v2.2.json`, …) with loaders and no runtime tuning story.
- **Duplication** (Verified): 4+ resume scorers; 4–5 job-matching implementations; 4 rewrite paths; 4 prompt sources; 2 state services; 2 chat endpoints; 2 auth systems; copy-pasted parsers.

### 3.2 Under-engineering where it matters

- No CI, no deploy config, and a broken `main`.
- No single LLM gateway: model strings are scattered (`gpt-4o`, `gpt-4o-mini`, `gpt-4-turbo-preview`, `gpt-3.5-turbo`); outputs mostly validated by `typeof`; no cost budget, tracing, or abortable timeouts.
- No persistence of the things an agent needs: plans, tasks, evidence, jobs per user, approvals.
- No evals for the one property the product sells (no fabrication).

### 3.3 Correctness bugs worth knowing about (Verified)

- **Text corruption on every PDF/image upload:** `lib/pdfParser.ts:80` / `lib/imageParser.ts:23` regex merges single-letter words — `"I built a tool for a team"` → `"I builta tool fora team"`. The same files strip all non-ASCII (accents, "•", "–") — bad for a Netherlands/EU user base.
- Scoring calibration drift (golden tests failing) after the PRO migration.
- Auth split: login sets the custom JWT cookie; `/api/rewrite/*`, `/api/score`, `/api/state` and pages using `useSession` (`/achievements`, `/job-match`) require NextAuth → broken for real users.
- `/api/analyze` accepts `jobDescription` and only logs it.

### 3.4 Security & privacy (Verified unless marked)

| Pri | Finding |
|---|---|
| **P0** | **Unbounded cost/DoS surface.** `/api/analyze` allows anonymous use, has no rate limit, runs Tesseract OCR on uploads up to 10 MB, and calls GPT-4o when hybrid mode is on. Usage quotas never decrement (`lib/premium.ts:137-213`). Chat endpoints accept unbounded input with no quota. |
| P1 | **CSRF is issued but never enforced.** `lib/csrf.ts` is imported nowhere; middleware skips `/api`. Real protection today is `SameSite=Lax` on the auth cookie. (`COMPREHENSIVE_AUDIT_REPORT.md` marks this FIXED — it is not.) |
| P1 | **Rate limiting is ineffective:** in-memory per instance, keyed on client-supplied `x-forwarded-for`, and all limiters share one key so login and contact budgets collide. NextAuth's credentials callback is a second, unlimited password-check path. |
| P1 | **Two auth systems** with different secrets fallbacks and non-overlapping route coverage; logout can't revoke; account enumeration on login/register. |
| P1 | **Resume PII in logs:** first 150 chars of every resume (`lib/pdfParser.ts:252`), user emails (`app/api/analyze/route.ts:792`). |
| P1 | **`.env` is tracked in git.** Current values are placeholders (checked by pattern, not printed), but `.gitignore` only covers `.env*.local`, so a real secret would be committed next. |
| P2 | No CSP or HSTS; CORS fallback is still `resumeiq.com`. |
| P2 | Prompt injection: resume/JD/user text interpolated into prompts. Impact today is limited to manipulated scores/text (no tools, no `dangerouslySetInnerHTML`). This changes once agents get tools — see §5. |
| P2 | Parsing untrusted files: `pdf-parse` 1.1.4 (unmaintained, bundled 2017 pdf.js), no page/time caps; client `pdfjs-dist` 3.x is affected by CVE-2024-4367 (fixed in 4.2.67). |
| P2 | Privacy: no self-service account deletion, no retention policy, SQLite datasource. Salary expectations and work authorization are stored (`prisma/schema.prisma`). GDPR obligations apply if targeting NL/EU. |
| OK | No IDOR found; ownership checks present on resource routes; bcrypt cost 10; JWT alg pinned; no SSRF (no server fetch of user URLs). |

---

## 4. What new AI capabilities materially change our options

*These are engineering assumptions as of my knowledge; each should be validated with a small spike and current pricing before we commit (see D-006).*

1. **Reliable structured output and tool calling** across frontier and small models. We no longer need regex-heavy pipelines to get structured data out of resumes and JDs; extraction becomes "LLM + schema + deterministic cross-check". This shrinks Layers 1/6 parsing code substantially.
2. **Long context (hundreds of thousands to ~1M tokens) and prompt caching.** A user's entire career record (all resumes, projects, evidence, past applications) fits in one call, cached. "Career memory" doesn't need a bespoke retrieval stack at our scale; it needs a good data model.
3. **Cheap, fast small models.** Per-bullet verification (an LLM judge checking every claim against cited evidence) is now affordable, which makes a real fabrication guarantee feasible.
4. **Standard agent plumbing** (agent SDKs, MCP-style tool servers, durable workflow engines, tracing/eval tooling). We should buy/borrow orchestration, not write an "orchestrator layer".
5. **Browser/computer-use agents** make auto-apply technically possible — but they're slow, brittle against ATS UIs, and raise ToS, liability and reputation risk. Capability exists; we should not lead with it.
6. **Commoditization.** General assistants now have memory, file analysis, and resume help built in. A generic "AI career coach" is not defensible. What generic assistants don't provide is a **verifiable, user-owned evidence record** and **guaranteed non-fabricated** output tied to specific opportunities. That's where our technical moat should be.

Implication: the expensive parts of the old architecture (custom parsers, template coach, hand-rolled orchestrator) are now cheap to replace; the scarce parts are trustworthy data, validation, and workflow UX.

---

## 5. Recommended architecture for careerQ 2.0

### 5.1 Principles

Modular monolith; one deployable; reuse the Next.js app and UI. Boundaries by **data ownership**, not by pipeline stage. Models are swappable infrastructure behind one gateway. Every AI action is bounded, typed, logged, and either read-only, draft-only, or approval-gated.

### 5.2 Shape (8 layers → 5 modules + 1 runtime)

```
┌──────────────────────────────── Next.js app (UI + route handlers) ───────────────────────────────┐
│                                                                                                    │
│  ingest/            career-record/          intelligence/          studio/           analytics/   │
│  parse PDF/DOCX/    profile, experiences,   rubric score (PRO),    evidence-anchored  event log,   │
│  OCR, JD import →   evidence items w/       gap & fit (L2/L6),     drafting (L3       funnel,      │
│  structured data    provenance, claims ↔    LLM extraction +       ledger + planner)  outcomes     │
│  (LLM + schema +    evidence links,         deterministic checks   + claim verifier   (L7)         │
│  deterministic)     versions, opportunities,                                                       │
│                     applications                                                                   │
│                                                                                                    │
│  ── workflow runtime ── typed workflows (durable steps) · tool registry w/ permission tiers ──     │
│  ── approvals ── inbox of pending actions; nothing external happens without a human click ──      │
│  ── llm-gateway ── provider-agnostic, schema-validated I/O, budgets, retries, tracing, evals ──   │
└────────────────────────────────────────── Postgres (+ object storage for files) ──────────────────┘
```

### 5.3 Agent design: explicit state, tools, permissions

- **Workflows, not free-roaming agents.** Each product capability is a typed workflow (e.g. `TailorApplication`: import JD → extract requirements → map to evidence → identify proof gaps → draft → verify claims → await approval → export). LLMs make decisions *inside* steps; the step graph is code. Open-ended agent loops only where they earn it (e.g. a coach that can *read* the career record and *propose* tasks).
- **Explicit state.** Workflow runs, steps, inputs/outputs, and approvals are persisted rows (`WorkflowRun`, `WorkflowStep`, `ApprovalRequest`), resumable and inspectable. No hidden in-memory plans.
- **Tool registry with permission tiers:**
  - `read` — read the user's own career record, a JD the user supplied. Auto.
  - `draft` — create/modify drafts inside careerQ (resume variants, cover letters, tasks). Auto, fully reversible, versioned.
  - `external` — anything leaving careerQ (send email, submit application, fetch third-party URLs, post). **Always requires explicit per-action approval**; not built in v1.
- **Approval boundaries:** approvals show the exact diff/payload and the evidence behind each claim; approvals are logged with who/when; nothing auto-submits.
- **Prompt-injection posture:** user documents and JDs are treated as data; tools available while processing untrusted text are limited to `read`/`draft`; no `external` tool is ever in scope in the same step that reads untrusted content.

### 5.4 Data model (career record)

Core entities: `User`, `Profile`, `Experience`, `EvidenceItem` (source: uploaded doc / link / user statement / verified artifact; provenance + confidence), `Claim` (a sentence in any output) ↔ `ClaimEvidence` links, `Document` (resume/cover-letter versions), `Opportunity` (per-user JD), `Application` (one status enum), `WorkflowRun`/`Step`, `ApprovalRequest`, `Event`. Postgres, with JSONB only for genuinely schemaless payloads. Consent, export and deletion built in from day one.

### 5.5 Validation: making "no fabrication" real

1. Every generated claim must cite `EvidenceItem` IDs (structured output).
2. **Deterministic checks** (keep and extend Layer 3): numbers *with units*, entities, tools, dates, scope per source bullet.
3. **LLM verifier** (small model) checks each claim against its cited evidence: supported / unsupported / inflated, with reason.
4. Unsupported claims are removed or turned into a **Proof Gap** question to the user ("Do you have evidence for X?") — this is where the Evidence Wallet and Proof Gap Resolver ideas become one mechanism.
5. **Eval set** in CI: a few hundred labeled (evidence, rewrite, verdict) cases including every probe in §2.4. Track precision/recall of the verifier; the bar is a product decision (D-008).

### 5.6 Observability & cost

One trace per workflow run (LLM calls, tokens, cost, latency, validator verdicts) stored and viewable in an admin page; per-user and global cost budgets enforced in the gateway; structured logs with PII redaction; error tracking. Rate limits backed by a shared store, keyed per user and per IP.

### 5.7 Stack decisions (proposed defaults)

Keep Next.js + TypeScript + Prisma + Tailwind (upgrade Next/React to current supported majors in a dedicated step). Move SQLite → Postgres. One auth system (D-004). One LLM gateway, provider-agnostic. Add CI (typecheck, lint, unit, eval subset, build) before any feature work.

---

## 6. Disagreements and challenges to GPT-6's proposed direction

I agree with the strategic frame (AI as replaceable infra; evidence and workflow as the moat). My challenges are about scope, sequencing, and risk:

1. **Six capabilities is a platform, not a product.** We have no validated user, no payment, and a broken build. I propose one wedge: **Evidence-Anchored Application Studio**, with Evidence Wallet and Proof Gap Resolver as its inputs, not as separate products. It is the closest to existing code (Layer 3 + Layer 2 gap analysis), the most defensible against general assistants, and produces a testable, payable outcome (a tailored, verifiable application in minutes).
2. **"Career DNA" is a data model, not a feature.** Build it as the career record (§5.4); don't market or design it separately until users ask for it.
3. **Opportunity Radar is the most expensive and riskiest capability.** Real job discovery means scraping (ToS/legal exposure) or licensing aggregator APIs (third-party commitments, cost). The current code has zero sourcing. I propose deferring it; v1 accepts pasted JDs or a user-supplied URL import, and we revisit after validation.
4. **"Agentic workflows" must not mean auto-apply.** Browser agents submitting applications on a user's behalf are brittle, can breach job-board terms, and put the user's reputation at risk with recruiters. v1 agents should read and draft only; any external action is approval-gated and probably out of v1 entirely.
5. **Outcome intelligence needs data we don't have.** Learning from interview/offer outcomes needs a meaningful volume of tracked applications. Ship simple tracking (useful in itself) and defer "intelligence" claims until we have data — the current Layer 7 already shows the cost of promising learning without a data source.
6. **Job Fit Intelligence is commoditized**; keep it as a step inside the Studio workflow rather than a headline.
7. **Positioning risk:** "Career Intelligence & Execution Platform" is broad and invites comparison with LinkedIn and general assistants. I'd want GPT-6's competitive work to name the specific user and moment (e.g. "experienced professionals applying to 5–20 targeted roles who can't afford a fabricated claim") before we lock the architecture to it.
8. **Process challenge:** prior work produced specs and audit reports that claimed fixes the code doesn't have (CSRF, analysis cache, "all routes functional"). Going forward, nothing is "done" without a passing check in CI or a reproducible demo.

---

## 7. Documentation vs verified behavior

| Claim (source) | Verdict |
|---|---|
| "8-layer AI career agent" (arch docs) | **Partially true** — code exists; layers are not integrated; no agent loop. |
| "Evidence-anchored, no fabrication" (pitch) | **Partially true** — library exists, not reachable from UI, validator misses common inflation (§2.4). |
| "Core flows working: analyze → fit → tailor" (pitch) | **Contradicted** — fit uses a fake resume; no tailoring UI. |
| Job discovery (Layer 6 spec) | **Partially true** — parse pasted JD only; no sources; fit is mocked. |
| Learning loop (Layer 7 spec, pitch) | **Not supported** — descriptive metrics on empty tables. |
| Daily/weekly plans | **Partially true** — mock state, identical for all users. |
| CSRF "FIXED" (comprehensive audit) | **Not true** — never validated. |
| "24-hour cache on analysis" (audit) | **Not true** — `/api/analyze` has no cache. |
| "Auth on all endpoints" (audit) | **Partially true** — `/api/analyze` and `/api/feedback` optional; NextAuth-only routes broken for real users. |
| "Legacy scoring removed; PRO single source" (audit) | **True** — but the deletion broke the build. |
| "47 API endpoints" | 44 route files. |
| "814 tests, 797 passing" (`TEST_REPORT.md`) | Stale — 945 now, 17 failing. |
| "All routes functional, no stubs" (`ROUTING_COMPLETE.md`) | **Contradicted** — 501s, stubs, mocks. |
| README: "AI resume builder, real-time preview" | **Contradicted** — no builder; preview component unused. |
| Pricing €29 / €49.99 (pitch) vs code $9.99 / $19.99 | **Contradictory** — and neither is purchasable. |
| "10,000+ users, 4.9/5" (UI) vs "pre-beta" (pitch) | **Contradicted.** |
| Brand "careerQ" | **Not in code** — UI is all ResumeIQ. |

**Doc sprawl:** ~33k lines across 40+ markdown files; most are stale specs or LLM-generated reports. Proposal: once this set is accepted, move root-level reports and `docs/{architecture,website,resume-analysis}` to `docs/archive/` with a pointer to this review; keep `lib/layers/*/README.md` (which are honest about scope) until the corresponding code is removed. No existing document fills the role of a decision log, competitive positioning, or a current roadmap; `docs/Agent_MVP_Scope_v1.md` is the nearest thing to product requirements and is stale.

---

## 8. What must be decided before implementation begins

Tracked in [`docs/decisions/DECISION_LOG.md`](../decisions/DECISION_LOG.md). Blocking items:

1. **D-001 Target user and wedge** (GPT-6 lead) — which single workflow v1 sells.
2. **D-002 Architecture shape** — collapse 8 layers into modules + workflow runtime (this review).
3. **D-003 Stabilize-and-evolve vs. rewrite** — I recommend evolve.
4. **D-004 One auth system.**
5. **D-005 Data store, hosting region, personal-data policy** (founder approval: personal data).
6. **D-006 LLM provider policy and monthly budget cap** (founder approval: spend).
7. **D-008 Agent autonomy boundary** — read/draft only in v1; fabrication acceptance bar.
8. **D-011 Remove unsupported marketing claims** from any live deployment (founder approval).

Non-blocking but needed before launch: D-007 job data sourcing, D-009 billing provider, D-010 docs archive, D-012 framework upgrade, D-013 brand rename in code.

See [`IMPLEMENTATION_ROADMAP.md`](IMPLEMENTATION_ROADMAP.md) for the proposed sequence.
