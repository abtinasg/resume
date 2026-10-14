# careerQ Decision Log

> **Status:** PROPOSAL. Seeded by Claude (Technical Lead) from the Phase 0 review, 2026-10-14. GPT-6 (Product/Strategy Lead) to add positions; Founder resolves material disagreements and approves escalated items.
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
| D-001 | Target user and v1 wedge | Open | GPT-6 | Yes | 🔺 pivot |
| D-002 | Architecture shape (8 layers → modules + workflow runtime) | Proposed | Claude | Yes | |
| D-003 | Evolve existing codebase vs. rewrite | Proposed | Claude | Yes | |
| D-004 | Single authentication system | Proposed | Claude | Yes | |
| D-005 | Data store, hosting region, personal-data policy | Open | Claude + Founder | Yes | 🔺 personal data |
| D-006 | LLM provider policy and budget cap | Open | Claude + Founder | Yes | 🔺 spend |
| D-007 | Job data sourcing (Opportunity Radar) | Open | GPT-6 + Claude | No (v1) | 🔺 third-party |
| D-008 | Agent autonomy boundary and fabrication bar | Proposed | Claude + GPT-6 | Yes | 🔺 security |
| D-009 | Billing provider and pricing | Open | GPT-6 | Before launch | 🔺 third-party |
| D-010 | Archive legacy documentation | Proposed | Claude | No | |
| D-011 | Remove unsupported marketing claims | Proposed | GPT-6 + Claude | Before any deploy | 🔺 production |
| D-012 | Framework upgrade (Next 14 → current) | Proposed | Claude | No | |
| D-013 | Brand rename ResumeIQ → careerQ in code | Open | GPT-6 | No | |

---

## D-001 Target user and v1 wedge
Open · Lead: GPT-6 · 🔺 Founder (material pivot)

**Problem and context.** GPT-6's preliminary direction lists six capabilities (Career DNA, Evidence Wallet + Proof Gap Resolver, Opportunity Radar, Application Studio, agentic workflows, outcome intelligence). The current product is a resume analyzer with no validated paying user.

**Alternatives considered.**
A. Full platform across all six capabilities.
B. Evidence-Anchored Application Studio as the wedge (Evidence Wallet + Proof Gap as inputs; Job Fit as a step).
C. Resume analyzer improvements only (current product, better).
D. Opportunity discovery first.

**Evidence and assumptions.** Layer 3 evidence ledger and Layer 2 gap analysis are the most reusable assets (Review §2). General assistants already offer generic resume help (Review §4.6). Job sourcing has zero existing code and carries legal/cost risk (§6.3). Willingness to pay is unvalidated for every option.

**GPT-6's position.** _Placeholder — to be added by GPT-6._

**Claude's position.** B. It reuses the strongest code, is defensible on verifiability rather than model quality, and yields a concrete outcome we can test willingness to pay against. A is too wide for the current base; D is the most expensive and riskiest.

**Final decision and rationale.** _Pending._

**Risks, reversibility, validation.** Reversible at the product level; the career-record data model (D-002) serves all options. Validate with a defined target segment and a pre-agreed signal (e.g. N users completing a tailored application, and a payment or pre-commitment test) — thresholds set by GPT-6.

---

## D-002 Architecture shape
Proposed · Lead: Claude

**Problem and context.** Eight layers with separate types/configs/errors; most not integrated; agent loop not closed (Review §1.4, §3.1).

**Alternatives considered.** A. Keep 8 layers and finish integration. B. Collapse into 5 data-owned modules (`ingest`, `career-record`, `intelligence`, `studio`, `analytics`) + workflow runtime + approvals + LLM gateway. C. Microservices.

**Evidence and assumptions.** No layer boundary currently carries production traffic except Layer 1 (PRO) and fragments of 6/8. Team size is two AI leads + founder; one deployable minimizes ops.

**GPT-6's position.** _Placeholder._

**Claude's position.** B (Review §5). A preserves boundaries that were never validated; C adds ops cost with no benefit at this scale.

**Final decision and rationale.** _Pending._

**Risks, reversibility, validation.** Highly reversible (module boundaries inside one repo). Validate by: one end-to-end workflow running through the runtime with traces, approvals and passing evals.

---

## D-003 Evolve vs. rewrite
Proposed · Lead: Claude

**Problem and context.** Mission says reuse before rewrite; code quality is uneven; `main` doesn't build.

**Alternatives considered.** A. Fresh repo, port selected modules. B. Stabilize in place, delete dead code, migrate module by module. C. Keep everything, add features on top.

**Evidence and assumptions.** ~25–35 % of library code is worth keeping (Review §2); the UI shell and upload flow work; tests are real but partially miscalibrated.

**GPT-6's position.** _Placeholder._

**Claude's position.** B. Fix the build and add CI first, then delete dead code aggressively (git history preserves it), then migrate. A loses working UI and test assets for little gain; C compounds debt.

**Final decision and rationale.** _Pending._

**Risks, reversibility, validation.** Deletions are reversible via git. Validation: green CI on `main`; dead-code removal leaves the working journey (§1.2) passing an end-to-end test.

---

## D-004 Single authentication system
Proposed · Lead: Claude

**Problem and context.** Custom JWT and NextAuth coexist with non-overlapping route coverage; several features return 401 to real users; Google button has no provider (Review §3.3, §3.4).

**Alternatives considered.** A. Keep custom JWT. B. Standardize on Auth.js (NextAuth successor) with database sessions. C. Managed auth provider (third-party).

**Evidence and assumptions.** Custom JWT can't revoke sessions; NextAuth v4 is legacy. Managed auth reduces work but is a third-party commitment and processes personal data.

**GPT-6's position.** _Placeholder._

**Claude's position.** B by default (no new vendor, revocable sessions, OAuth ready). C acceptable if the Founder prefers a vendor; that's a 🔺 third-party decision.

**Final decision and rationale.** _Pending._

**Risks, reversibility, validation.** Migration touches every route; requires a session-invalidating cutover for any existing users (needs Founder sign-off if real users exist). Validation: route-level auth tests for every API route in CI.

---

## D-005 Data store, hosting region, personal-data policy
Open · Lead: Claude + Founder · 🔺 personal data

**Problem and context.** SQLite datasource; resumes, salary expectations and work authorization stored; no deletion/export, no retention policy; PII in logs (Review §3.4). Pitch mentions a Netherlands launch → GDPR.

**Alternatives considered.** Postgres on an EU-region managed host vs. self-managed; retention windows; whether raw uploaded files are kept or discarded after parsing.

**Evidence and assumptions.** Assumes EU users. Unknown: whether a live deployment with real user data exists today — **Founder to confirm.**

**GPT-6's position.** _Placeholder._

**Claude's position.** Managed Postgres in an EU region; store parsed data, keep original files only with explicit consent; self-service export and delete from v1; PII-redacted logging; documented retention. Final choice of host is a spend + personal-data decision for the Founder.

**Final decision and rationale.** _Pending._

**Risks, reversibility, validation.** Data migrations are costly to reverse once real users exist. Validation: privacy checklist (DPA with processors, deletion test, log redaction test) passes before launch.

---

## D-006 LLM provider policy and budget cap
Open · Lead: Claude + Founder · 🔺 spend

**Problem and context.** Model strings scattered across files; no gateway, budgets or tracing; anonymous users can trigger paid calls (Review §3.2, §3.4).

**Alternatives considered.** Single provider vs. provider-agnostic gateway; which model tier per task (extraction, drafting, verification); hard monthly cap.

**Evidence and assumptions.** Models are replaceable infrastructure (operating principle). Current per-request cost unknown; needs a spike with real pricing.

**GPT-6's position.** _Placeholder._

**Claude's position.** One provider-agnostic gateway with schema-validated I/O, per-user and global budgets, tracing; pick models per task by eval results, not brand. Founder sets the monthly cap; no paid usage until set.

**Final decision and rationale.** _Pending._

**Risks, reversibility, validation.** Gateway makes provider changes cheap. Validation: cost per completed workflow measured and under a target set with GPT-6's pricing model.

---

## D-007 Job data sourcing (Opportunity Radar)
Open · Lead: GPT-6 + Claude · 🔺 third-party commitments

**Problem and context.** No job sourcing exists; Layer 6 parses pasted JDs only.

**Alternatives considered.** A. User-pasted JD / URL import only. B. Licensed aggregator API. C. Scraping. D. Partnerships with job boards.

**Evidence and assumptions.** C carries ToS/legal risk; B and D are third-party commitments with cost.

**GPT-6's position.** _Placeholder._

**Claude's position.** A for v1. Revisit B/D after D-001 is validated. Do not do C.

**Final decision and rationale.** _Pending._

**Risks, reversibility, validation.** A is fully reversible. Validation for revisiting: users report discovery (not tailoring) as their main blocker.

---

## D-008 Agent autonomy boundary and fabrication bar
Proposed · Lead: Claude + GPT-6 · 🔺 security

**Problem and context.** The product promises "no fabrication"; the current validator misses inflation, unit changes and unknown entities (Review §2.4). Agent tools could act externally on the user's behalf.

**Alternatives considered.** A. Read/draft only in v1; any external action approval-gated and out of v1 scope. B. Approval-gated external actions (email, submit) in v1. C. Autonomous submission.

**Evidence and assumptions.** Browser-based auto-apply is brittle and risks ToS violations and user reputation (Review §4.5, §6.4). Prompt injection via JDs/resumes becomes material once tools can act.

**GPT-6's position.** _Placeholder._

**Claude's position.** A. Fabrication bar: every claim in generated output cites evidence; verifier evaluated on a labeled set in CI; target thresholds (e.g. unsupported-claim recall) to be agreed with GPT-6 before the Studio ships.

**Final decision and rationale.** _Pending._

**Risks, reversibility, validation.** A is the safe default and easy to widen later. Validation: eval suite thresholds met; red-team set of prompt-injected JDs produces no unintended tool calls.

---

## D-009 Billing provider and pricing
Open · Lead: GPT-6 · 🔺 third-party commitment

**Problem and context.** Subscription code is a stub; pitch (€29/€49.99) and code ($9.99/$19.99) disagree; premium can't be granted (Review §1.3).

**GPT-6's position.** _Placeholder._ **Claude's position.** Pricing is GPT-6's call. Technically: one payment provider via hosted checkout + webhooks, entitlements stored server-side; remove dead tier code until then. No integration until the Founder approves the vendor.

**Final decision and rationale.** _Pending._ **Risks/validation.** Validate willingness to pay before building billing (e.g. manual invoicing or a waitlist pre-commit).

---

## D-010 Archive legacy documentation
Proposed · Lead: Claude

**Problem and context.** ~33k lines of stale or contradictory docs (Review §7).

**Claude's position.** After this doc set is accepted, move root-level reports and `docs/{architecture,website,resume-analysis}` to `docs/archive/` with a README pointing to the new set. **GPT-6's position.** _Placeholder._ **Decision.** _Pending._ **Reversibility.** Fully reversible.

---

## D-011 Remove unsupported marketing claims
Proposed · Lead: GPT-6 + Claude · 🔺 production

**Problem and context.** UI claims "10,000+ Happy Users, 4.9/5", a "cohort of 1,200 job seekers", named testimonials, and "GPT-4o validates scoring" (off by default); the pitch says pre-beta (Review §1.3). Unsupported claims are a consumer-protection and trust risk, and contradict an evidence-anchored brand.

**Claude's position.** Remove or replace with verifiable copy in the next code change. If a live deployment exists, the Founder decides whether to redeploy. **GPT-6's position.** _Placeholder._ **Decision.** _Pending._

---

## D-012 Framework upgrade
Proposed · Lead: Claude

**Problem and context.** Next 14 / React 18 / NextAuth v4 / pdfjs 3.x (CVE-2024-4367) / unmaintained pdf-parse.

**Claude's position.** Upgrade to current supported majors as an isolated step after CI is green and dead code is removed (smaller surface). **GPT-6's position.** _Placeholder._ **Decision.** _Pending._ **Reversibility.** Revert-able as a single PR.

---

## D-013 Brand rename in code
Open · Lead: GPT-6

**Problem and context.** UI, package name and domains say ResumeIQ; the product is now careerQ. Depends on D-001 positioning.

**Claude's position.** Do it once positioning is set; technically cheap. **GPT-6's position.** _Placeholder._ **Decision.** _Pending._
