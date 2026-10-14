# careerQ Decision Log

> **Status:** Under joint review. Claude (Technical Lead) seeded this log from the Phase 0 review on 2026-10-14. GPT-6 (Product/Strategy Lead) positions were added from its two PR #183 review comments the same day. The founder resolves material disagreements and approves the 🔺 items.
>
> **Approval types.**
> - *Joint operating approval:* Claude and GPT-6 agree, and the decision is reversible and within the scope the founder delegated. Work may proceed.
> - *Founder-controlled:* needs the founder's explicit word because it involves spend, a pivot, production, third parties, personal data, or significant security risk. Nothing that depends on it proceeds until she gives it.
>
> **Open founder facts:**
> 1. Is any deployment live, or does any instance hold real users or resume data?
> 2. What is the hard AI API budget? Stage 0 runs on $0.
>
> Evidence references point to [`docs/engineering/ARCHITECTURE_REVIEW.md`](../engineering/ARCHITECTURE_REVIEW.md) (§ numbers).

## How to use this log

- One entry per **major** decision. Small reversible decisions don't need an entry.
- Status: `Open` → `Proposed` → `Accepted` / `Rejected` / `Superseded by D-xxx`.
- **Escalate to Founder** when a decision involves substantial spending, a material pivot, production deployment, third-party commitments, personal data, or significant security risk. Marked 🔺 below.
- Entries are append-only once Accepted; changes create a new entry that supersedes the old one.

### Template

```
## D-XXX Title
Status · Owner · Escalation
**Problem and context**
**Alternatives considered**
**Evidence and assumptions**
**GPT-6's position**
**Claude's position**
**Final decision and rationale**
**Risks, reversibility, and validation criteria**
```

## Index

| ID | Decision | Status | Lead | Blocks implementation? | Escalate |
|---|---|---|---|---|---|
| D-001 | Target user and v1 wedge | Jointly agreed · founder confirm | GPT-6 | Yes | 🔺 pivot |
| D-002 | Architecture shape (8 layers → modules + workflow runtime) | Jointly agreed | Claude | Yes | |
| D-003 | Evolve existing codebase vs. rewrite | **Accepted** | Claude | Yes | |
| D-004 | Single authentication system | Jointly agreed in principle | Claude | Yes | |
| D-005 | Data store, hosting region, personal-data policy | **Founder** · open | Claude + Founder | Yes | 🔺 personal data |
| D-006 | LLM provider policy and budget cap | **Founder** · open ($0 in Stage 0) | Claude + Founder | Yes | 🔺 spend |
| D-007 | Job data sourcing (Opportunity Radar) | Jointly agreed (v1) | GPT-6 + Claude | No (v1) | 🔺 third-party |
| D-008 | Agent autonomy boundary and fabrication bar | Jointly agreed · provisional bar | Claude + GPT-6 | Yes | 🔺 security |
| D-009 | Billing provider and pricing | **Founder** · open | GPT-6 | Before launch | 🔺 third-party |
| D-010 | Archive legacy documentation | Jointly agreed | Claude | No | |
| D-011 | Remove unsupported marketing claims | Code removal agreed, copy rules set · redeploy founder | GPT-6 + Claude | Before any deploy | 🔺 production |
| D-012 | Framework upgrade (Next 14 → current) | Agreed with amendment | Claude | No | |
| D-013 | Brand rename ResumeIQ → careerQ in code | Agreed · deferred | GPT-6 | No | |
| D-014 | Scoring calibration ground truth | Jointly agreed (D now, C later) | GPT-6 + Claude | No (Stage 0) | |
| D-015 | Why pay careerQ instead of a general assistant (defensibility, buyer) | **Proposed** · under joint critique | GPT-6 + Claude | No | 🔺 pivot if buyer changes |

---

## D-001 Target user and v1 wedge
Jointly agreed · founder confirmation pending (🔺 material pivot) · Lead: GPT-6 · 🔺 Founder (material pivot)

**Problem and context.** GPT-6's preliminary direction lists six capabilities (Career DNA, Evidence Wallet + Proof Gap Resolver, Opportunity Radar, Application Studio, agentic workflows, outcome intelligence). The current product is a resume analyzer with no validated paying user.

**Alternatives considered.**
A. Full platform across all six capabilities.
B. Evidence-Anchored Application Studio as the wedge (Evidence Wallet + Proof Gap as inputs; Job Fit as a step).
C. Resume analyzer improvements only (current product, better).
D. Opportunity discovery first.

**Evidence and assumptions.** Layer 3 evidence ledger and Layer 2 gap analysis are the most reusable assets (Review §2). General assistants already offer generic resume help (Review §4.6). Job sourcing has zero existing code and carries legal/cost risk (§6.3). Willingness to pay is unvalidated for every option.

**GPT-6's position** (GPT-6 review comments on PR #183, 2026-10-14). Agrees with B. v1 is an Evidence-Anchored Application Studio, not a Career OS, a job-search platform, or a six-product suite. Evidence Wallet is an internal record, Proof Gap is a workflow step, and job fit is supporting context. Initial test segment (a hypothesis, not established demand): English-speaking international early/mid-career product/technology professionals applying selectively to roles in the Netherlands. Job-to-be-done: turn a real JD and a truthful background into an accurate, tailored, exportable application faster, without inventing achievements. Out of v1: job sourcing, outcome learning, autonomous apply, a standalone AI coach, and a broad Career DNA dashboard. GPT-6 withdraws its earlier six-capability MVP.

**Claude's position.** B. It reuses the strongest code, is defensible on verifiability rather than model quality, and yields a concrete outcome we can test willingness to pay against. A is too wide for the current base; D is the most expensive and riskiest.

**Final decision and rationale.** **Joint operating position:** B, with GPT-6's segment as the test hypothesis. The founder's 2026-10-14 message names this wedge as the immediate focus, "subject to validation". Provisional v1 gates (GPT-6):
- ≥7 of 10 consenting target users complete and export a tailored application.
- 15–20 interviews with people in the segment.
- ≥3 paid pilots from unrelated users at a tested price before any funding goes to Radar, automation or billing.
- A blind comparison against a general assistant and a specialist tool on the same inputs, with claim fidelity as a hard gate.

These gates are small-sample learning signals, not proof of product-market fit. Claude note: the segment makes Unicode-safe parsing (accents, non-English names) a requirement, which reinforces fixing the parser in Stage 0.

**Risks, reversibility, validation.** Reversible at the product level; the career-record data model (D-002) serves all options. Validate with a defined target segment and a pre-agreed signal (e.g. N users completing a tailored application, and a payment or pre-commitment test) — thresholds set by GPT-6.

---

## D-002 Architecture shape
Jointly agreed · Lead: Claude

**Problem and context.** Eight layers with separate types/configs/errors; most not integrated; agent loop not closed (Review §1.4, §3.1).

**Alternatives considered.** A. Keep 8 layers and finish integration. B. Collapse into 5 data-owned modules (`ingest`, `career-record`, `intelligence`, `studio`, `analytics`) + workflow runtime + approvals + LLM gateway. C. Microservices.

**Evidence and assumptions.** No layer boundary currently carries production traffic except Layer 1 (PRO) and fragments of 6/8. Team size is two AI leads + founder; one deployable minimizes ops.

**GPT-6's position** (GPT-6 review comments on PR #183, 2026-10-14). Agrees with B: a modular monolith built from five modules defined by data ownership, plus a small persisted typed-workflow runtime, a single LLM gateway, and evidence and approval controls. Wants one verifiable end-to-end workflow before any further orchestration is abstracted. No preemptive multi-agent or microservice complexity.

**Claude's position.** B (Review §5). A preserves boundaries that were never validated; C adds ops cost with no benefit at this scale.

**Final decision and rationale.** **Joint operating decision:** B, with GPT-6's condition that one verified end-to-end workflow comes before the runtime is generalized.

**Risks, reversibility, validation.** Highly reversible (module boundaries inside one repo). Validate by: one end-to-end workflow running through the runtime with traces, approvals and passing evals.

---

## D-003 Evolve vs. rewrite
**Accepted** (joint operating approval; founder go-ahead 2026-10-14) · Lead: Claude

**Problem and context.** Mission says reuse before rewrite; code quality is uneven; `main` doesn't build.

**Alternatives considered.** A. Fresh repo, port selected modules. B. Stabilize in place, delete dead code, migrate module by module. C. Keep everything, add features on top.

**Evidence and assumptions.** ~25–35 % of library code is worth keeping (Review §2); the UI shell and upload flow work; tests are real but partially miscalibrated.

**GPT-6's position** (GPT-6 review comments on PR #183, 2026-10-14). Accepts B. Claude may start Stage 0 on a branch/PR with tests and reviews. Excluded: production deployment, purchases, migration of real-user data, and irreversible external actions.

**Claude's position.** B. Fix the build and add CI first, then delete dead code aggressively (git history preserves it), then migrate. A loses working UI and test assets for little gain; C compounds debt.

**Final decision and rationale.** **Accepted:** B. Stage 0 runs as small, reversible PRs on separate branches. PR #183 stays documentation-only.

**Risks, reversibility, validation.** Deletions are reversible via git. Validation: green CI on `main`; dead-code removal leaves the working journey (§1.2) passing an end-to-end test.

---

## D-004 Single authentication system
Jointly agreed in principle · live cutover is founder-gated · Lead: Claude

**Problem and context.** Custom JWT and NextAuth coexist with non-overlapping route coverage; several features return 401 to real users; Google button has no provider (Review §3.3, §3.4).

**Alternatives considered.** A. Keep custom JWT. B. Standardize on Auth.js (NextAuth successor) with database sessions. C. Managed auth provider (third-party).

**Evidence and assumptions.** Custom JWT can't revoke sessions; NextAuth v4 is legacy. Managed auth reduces work but is a third-party commitment and processes personal data.

**GPT-6's position** (GPT-6 review comments on PR #183, 2026-10-14). Agrees on one authoritative, server-verified identity/session system with revocable sessions and route-level regression tests. Claude owns the final technical choice. The auth migration and the major framework upgrade must not be combined into one untestable PR. Any cutover of live sessions depends on the founder's answer about the deployment.

**Claude's position.** B by default (no new vendor, revocable sessions, OAuth ready). C acceptable if the Founder prefers a vendor; that's a 🔺 third-party decision.

**Final decision and rationale.** **Joint operating decision:** one auth system, chosen by Claude, delivered in its own PR with route-level auth tests. A cutover that affects live sessions waits for the founder.

**Risks, reversibility, validation.** Migration touches every route; requires a session-invalidating cutover for any existing users (needs Founder sign-off if real users exist). Validation: route-level auth tests for every API route in CI.

---

## D-005 Data store, hosting region, personal-data policy
**Founder-controlled** · open · Lead: Claude + Founder · 🔺 personal data

**Problem and context.** SQLite datasource; resumes, salary expectations and work authorization stored; no deletion/export, no retention policy; PII in logs (Review §3.4). Pitch mentions a Netherlands launch → GDPR.

**Alternatives considered.** Postgres on an EU-region managed host vs. self-managed; retention windows; whether raw uploaded files are kept or discarded after parsing.

**Evidence and assumptions.** Assumes EU users. Unknown: whether a live deployment with real user data exists today — **Founder to confirm.**

**GPT-6's position** (GPT-6 review comments on PR #183, 2026-10-14). Default proposal:
- EU-region managed Postgres for the EU beta.
- Minimal retention, encryption, and a DPA.
- No raw resume storage by default, unless the user explicitly chooses it.
- Logs free of PII.
- User export and deletion in place before beta.

Not final until the founder confirms whether live users or data exist and authorizes a host/provider.

**Claude's position.** Managed Postgres in an EU region; store parsed data, keep original files only with explicit consent; self-service export and delete from v1; PII-redacted logging; documented retention. Final choice of host is a spend + personal-data decision for the Founder.

**Final decision and rationale.** _Pending founder:_ (1) Does any deployment or instance hold real users or resume data? (2) Which host/provider is authorized? Both leads agree on the default above.

**Risks, reversibility, validation.** Data migrations are costly to reverse once real users exist. Validation: privacy checklist (DPA with processors, deletion test, log redaction test) passes before launch.

---

## D-006 LLM provider policy and budget cap
**Founder-controlled** · open · Stage 0 spend = $0 · Lead: Claude + Founder · 🔺 spend

**Problem and context.** Model strings scattered across files; no gateway, budgets or tracing; anonymous users can trigger paid calls (Review §3.2, §3.4).

**Alternatives considered.** Single provider vs. provider-agnostic gateway; which model tier per task (extraction, drafting, verification); hard monthly cap.

**Evidence and assumptions.** Models are replaceable infrastructure (operating principle). Current per-request cost unknown; needs a spike with real pricing.

**GPT-6's position** (GPT-6 review comments on PR #183, 2026-10-14). Agrees on a centralized model gateway, structured responses, per-task evals and real cost tracing, with models chosen on task quality and cost. In its second comment GPT-6 withdrew the earlier $100/month figure as a default:
- **Stage 0 paid model budget is $0.** Use mocks and deterministic tests.
- Before any real paid calls, Claude presents a small cost experiment: model, price on the test date, expected number of calls, worst-case spend, hard stop, and the reason for it. GPT-6's preliminary request is $10–30 in total for the first controlled evaluation. This is not permission and not a recurring commitment.
- Report cost per completed verified application, not per request, including retries, verification cost and p95 latency.

**Claude's position.** One provider-agnostic gateway with schema-validated I/O, per-user and global budgets, tracing; pick models per task by eval results, not brand. Founder sets the monthly cap; no paid usage until set.

**Final decision and rationale.** **Joint operating position:** no paid model calls in Stage 0. Development and CI use fake models. _Pending founder:_ approval of the first costed experiment, then a hard monthly cap. Claude agrees with GPT-6 that cost per verified application is the right unit.

**Production gate for paid AI or public deployment** (GPT-6 on PR #185, 2026-10-14; Claude agrees). The Stage 0 rate limits are acceptable as interim branch stabilization but are **not production-safe**: the in-memory store is not shared across instances, and untrusted forwarded-IP headers can undermine per-IP checks. Before any paid AI call from a deployed app or any public deployment, all of the following must be in place:
1. A shared, durable rate limiter (not per-process memory).
2. A centralized hard monthly AI budget that stops paid calls when reached.
3. Request and input size limits on every route that reaches a model or a parser.
4. Verified, trusted client-IP provenance on the actual host (which proxy headers can be trusted there).

These depend on the host and budget choices in D-005 and D-006. No spending or deployment is authorized by this entry.

**Risks, reversibility, validation.** Gateway makes provider changes cheap. Validation: cost per completed workflow measured and under a target set with GPT-6's pricing model.

---

## D-007 Job data sourcing (Opportunity Radar)
Jointly agreed for v1 · Lead: GPT-6 + Claude · 🔺 third-party commitments

**Problem and context.** No job sourcing exists; Layer 6 parses pasted JDs only.

**Alternatives considered.** A. User-pasted JD / URL import only. B. Licensed aggregator API. C. Scraping. D. Partnerships with job boards.

**Evidence and assumptions.** C carries ToS/legal risk; B and D are third-party commitments with cost.

**GPT-6's position** (GPT-6 review comments on PR #183, 2026-10-14). Agrees: the first product uses user-pasted JDs only. Import from a URL the user provides can come later, after SSRF, ToS, attribution and reliability checks. No scraping and no contracted aggregators in v1. Radar stays a future hypothesis.

**Claude's position.** A for v1. Revisit B/D after D-001 is validated. Do not do C.

**Final decision and rationale.** **Joint operating decision:** pasted JDs only in v1. Revisiting sourcing needs a new entry, and any third party needs founder approval.

**Risks, reversibility, validation.** A is fully reversible. Validation for revisiting: users report discovery (not tailoring) as their main blocker.

---

## D-008 Agent autonomy boundary and fabrication bar
Jointly agreed · thresholds provisional · Lead: Claude + GPT-6 · 🔺 security

**Problem and context.** The product promises "no fabrication"; the current validator misses inflation, unit changes and unknown entities (Review §2.4). Agent tools could act externally on the user's behalf.

**Alternatives considered.** A. Read/draft only in v1; any external action approval-gated and out of v1 scope. B. Approval-gated external actions (email, submit) in v1. C. Autonomous submission.

**Evidence and assumptions.** Browser-based auto-apply is brittle and risks ToS violations and user reputation (Review §4.5, §6.4). Prompt injection via JDs/resumes becomes material once tools can act.

**GPT-6's position** (GPT-6 review comments on PR #183, 2026-10-14). Agrees on read plus reversible draft only in v1: no email sending, no external submission, no auto-apply. Proposed controls:
- Store each claim→evidence link with its human confirmation state.
- Check numbers for unit and scale.
- Use an independent verifier.
- Run an adversarial labeled eval in CI.

Avoid public 'zero hallucinations guaranteed' wording; verifiability is a design requirement, not an established guarantee. Proposed bar for shipping:
- Zero missed high-severity fabrications on a prespecified critical suite.
- ≥98% recall of unsupported claims on a varied labeled suite.
- Precision and manual-review burden tracked as well.
- Hold the release if testing is underpowered.

**Claude's position.** A. Fabrication bar: every claim in generated output cites evidence; verifier evaluated on a labeled set in CI; target thresholds (e.g. unsupported-claim recall) to be agreed with GPT-6 before the Studio ships.

**Final decision and rationale.** **Joint operating decision:** A, with GPT-6's provisional bar. Claude note: ≥98% recall only means something with a large enough labeled set, on the order of several hundred unsupported-claim cases. Every reported recall figure will state the size of the eval set.

**Risks, reversibility, validation.** A is the safe default and easy to widen later. Validation: eval suite thresholds met; red-team set of prompt-injected JDs produces no unintended tool calls.

---

## D-009 Billing provider and pricing
**Founder-controlled** · open · Lead: GPT-6 · 🔺 third-party commitment

**Problem and context.** Subscription code is a stub; pitch (€29/€49.99) and code ($9.99/$19.99) disagree; premium can't be granted (Review §1.3).

**GPT-6's position** (GPT-6 review comments on PR #183, 2026-10-14). No subscription build now. Test a €19–29 per-application package, or small bundles, for willingness to pay among strangers. These prices are hypotheses, not approved pricing. Tracking, invoicing or payment mechanisms, and the choice of provider all need founder approval. **Claude's position.** Pricing is GPT-6's call. Technically: one payment provider via hosted checkout + webhooks, entitlements stored server-side; remove dead tier code until then. No integration until the Founder approves the vendor.

**Final decision and rationale.** **Joint position:** no billing code in Stages 0–2, and the dead subscription stubs get removed. _Pending founder_ for any payment provider or pricing test. **Risks/validation.** Validate willingness to pay before building billing (e.g. manual invoicing or a waitlist pre-commit).

---

## D-010 Archive legacy documentation
Jointly agreed · Lead: Claude

**Problem and context.** ~33k lines of stale or contradictory docs (Review §7).

**Claude's position.** After this doc set is accepted, move root-level reports and `docs/{architecture,website,resume-analysis}` to `docs/archive/` with a README pointing to the new set. **GPT-6's position** (GPT-6 review comments on PR #183, 2026-10-14). Agrees: archive stale docs once a small current index exists, keeping git history and migration notes. Archived marketing or architecture claims must not be treated as verified. **Decision.** **Joint operating decision:** archive after this doc set merges, with a `docs/README.md` index as the source of truth. **Reversibility.** Fully reversible.

---

## D-011 Remove unsupported marketing claims
Code change jointly agreed · redeploy is founder-gated · Lead: GPT-6 + Claude · 🔺 production

**Problem and context.** UI claims "10,000+ Happy Users, 4.9/5", a "cohort of 1,200 job seekers", named testimonials, and "GPT-4o validates scoring" (off by default); the pitch says pre-beta (Review §1.3). Unsupported claims are a consumer-protection and trust risk, and contradict an evidence-anchored brand.

**Claude's position.** Remove or replace with verifiable copy in the next code change. If a live deployment exists, the Founder decides whether to redeploy. **GPT-6's position** (GPT-6 review comments on PR #183, 2026-10-14). Agrees to remove immediately from the code: unverifiable user counts, ratings, testimonials, trial/cohort claims, and misleading 'AI validated' wording. This is allowed on a Stage 0 branch. No redeploy until the founder confirms whether a live deployment exists and approves deployment. The investor narrative must not present the 8-layer agent as a working system or overstate 'no hallucinations'. **Decision.** **Joint operating decision:** remove the claims in Stage 0 code. Any redeploy is a founder decision.

**Copy rules** (GPT-6 on PR #189, 2026-10-14; applied on that PR):
1. No model brands and no "AI-validated" or ratio claims. Describe the product as "Review your resume with structured checks and actionable suggestions."
2. No speed claims ("6 minutes", "6-min", "6m 21s"). Use "Upload your resume and see prioritized suggestions."
3. No refund or absolute safety assurances ("14-Day Money Back", "100% Secure & Private").
4. No competitor prices.
5. Plan limits, premium features and CTAs must match working flows; anything unsupported is removed or labeled as coming soon.
6. No new claim without evidence. `__tests__/marketing-claims.test.ts` fails CI if a banned claim reappears in public pages.

---

## D-012 Framework upgrade
Jointly agreed with amendment · Lead: Claude

**Problem and context.** Next 14 / React 18 / NextAuth v4 / pdfjs 3.x (CVE-2024-4367) / unmaintained pdf-parse.

**Claude's position.** Upgrade to current supported majors as an isolated step after CI is green and dead code is removed (smaller surface). **GPT-6's position** (GPT-6 review comments on PR #183, 2026-10-14). Agrees to the upgrade as a separately verified PR after CI exists. The known-vulnerable PDF/file-processing dependencies, plus file and time limits, should be patched early as security work, not held back behind a broad Next.js upgrade. **Decision.** **Joint operating decision:** PDF/file-processing hardening (replace pdf-parse, patch pdfjs, add size/page/time caps) moves into Stage 0. The Next/React/auth major upgrade stays a separate, later PR. **Reversibility.** Revert-able as a single PR.

---

## D-013 Brand rename in code
Jointly agreed · deferred · Lead: GPT-6

**Problem and context.** UI, package name and domains say ResumeIQ; the product is now careerQ. Depends on D-001 positioning.

**Claude's position.** Do it once positioning is set; technically cheap. **GPT-6's position** (GPT-6 review comments on PR #183, 2026-10-14). Use careerQ in new strategy docs. Defer mass renaming in code until v1 positioning is accepted, and avoid brand-only churn during stabilization. **Decision.** **Joint operating decision:** defer the code rename until the founder confirms D-001.

---

## D-014 Scoring calibration ground truth
Jointly agreed · Lead: GPT-6 + Claude

**Problem and context.** Stage 0 found 15 scoring-calibration tests that have never passed on any commit. Examples: a "strong mid-level PM" is expected to score 72–85 but gets 60, and a strong software-engineer resume matches only 3 of 16 must-have keywords. The expected ranges were written without labeled data, and some of them contradict each other (a LEAD-level candidate for a SENIOR role is expected to be "aligned"). Stage 0 PR 1 moved these tests into `*.calibration.test.ts` files. A non-blocking CI job reports them on every PR, so they stay visible but do not block merges.

**Alternatives considered.**
- A. Change the expected ranges to match current output. This is meaningless, because it rubber-stamps whatever the scorer happens to produce.
- B. Tune the scorer until it meets the guessed ranges. Also meaningless.
- C. Build a small set of human-rated reference resumes and job descriptions, and calibrate against those.
- D. Treat the numeric score as secondary in v1, since the Studio wedge is about evidence-backed tailoring, not a headline score.

**Evidence and assumptions.**
- Stage 0 PR 1 verification report.
- Two scorer defects were found while investigating:
  - must-have keyword lists are made of generic phrases, and matching misses plurals and compounds;
  - the "•" bullet character counts as non-ASCII and lowers signal quality.

**GPT-6's position** (GPT-6 on PR #184, 2026-10-14). Agrees with "D now, C later":
- The numeric score is not the v1 promise. It must not be presented as calibrated, ATS-predictive, or a hiring probability.
- Keep the 15 expectations in the non-blocking calibration job, clearly labeled as known failing, so green CI is not mistaken for scoring validation.
- Do not rewrite expected numbers or tune weights toward guessed labels.
- Build a human-rated reference set before the score is shown as a validated claim.
- The Application Studio ship gate is claim fidelity plus usability tests.
- The 4 skipped real-model tests and the calibration failures remain explicit release risks.
- No investor or website claims of ATS pass rate, score accuracy, "AI-validated score" or interview uplift.

**Claude's position.** D now, C later and only if the score is user-facing. In the meantime, fix clear matcher bugs as they are found, but do not tune weights toward guessed ranges.

**Final decision and rationale.** **Joint operating decision: D now, C later.** The score is a secondary, uncalibrated heuristic in v1. The calibration job is named "non-blocking, known failing expectations" and its summary states that green CI is not scoring validation (PR #184). Clear matcher bugs may be fixed; weights are not tuned toward guessed ranges. A human-rated reference set (C) is required before the score is presented as validated anywhere.

**Risks, reversibility, validation.** Fully reversible. The risk is that users see scores that are miscalibrated, so v1 copy should not present the score as precise.

---

## D-015 Why users would pay careerQ instead of a general assistant
**Proposed** · under joint critique · Lead: GPT-6 + Claude · 🔺 pivot if the buyer changes

**Problem and context.** The founder asks how careerQ stays valuable as general-purpose agents improve. Tailoring, citations, ATS scores and job tracking are already offered by Simplify, Teal and general assistants (GPT-6's sources are on PR #183).

**GPT-6's position** (PR #183, 2026-10-14; a proposal, not a conclusion). A proof-grounded, consent-controlled career record that powers job-specific applications. v1 stays a narrow "Proof-backed Application Sprint". Three hypothesized advantages: a reusable evidence and trust workflow; measured workflow performance with opt-in outcomes; and institutional distribution after B2C value is proven. Pivot or stop gates: interviews, a 10-user side-by-side test, and at least 3 unrelated payers.

**Claude's position** (full reply on PR #183).
- The core loop is buildable at beta quality in the modular monolith. The smallest falsifiable prototype is offline: fixtures → claims with source spans → draft → deterministic verifier → blind comparison with a well-prompted general assistant.
- Not defensible as models improve: rewriting, keyword matching, scores, citation UI, tracking.
- Partly defensible: an accumulated, user-confirmed evidence record (but portability rights limit lock-in), and a labeled failure dataset (but it compounds only with volume).
- Most durable but slowest: institutional distribution and its workflow and audit needs.
- No hosted employer-shareable proof pack in v1. At most, a user-downloaded appendix labeled "user-provided, not verified".
- Run budget-holder interviews in parallel with candidate interviews, not after them.

**Final decision and rationale.** _Pending joint review._ No scope change to Stage 0 or Stage 1.

**Risks, reversibility, validation.** The thesis is falsified if a blind benchmark shows no fabrication or effort advantage over a skilled general-assistant workflow, and no buyer pays for the workflow itself. Then the question becomes buyer and distribution, not more agent features.
