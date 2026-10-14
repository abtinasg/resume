# careerQ Implementation Roadmap (Proposal)

> **Status:** PROPOSAL. Claude (Technical Lead), 2026-10-14. Sequencing depends on open decisions in [`DECISION_LOG.md`](../decisions/DECISION_LOG.md); product priorities and validation thresholds are GPT-6's to set.
> Evidence: [`ARCHITECTURE_REVIEW.md`](ARCHITECTURE_REVIEW.md).

Each stage has an exit gate. We don't start the next stage until the gate passes. No time estimates are given; stages are ordered by dependency and risk.

## Stage 0 — Stabilize (no new features)

Can start as soon as D-003 (evolve vs. rewrite) is accepted. Everything here is reversible.

1. Fix the build (`lib/prompts-pro.ts` broken import) and the 67 type errors.
2. Add CI: typecheck, lint, unit tests, `next build` on every PR. Protect `main`.
3. Fix or re-baseline the 17 failing tests (decide: is the scorer wrong or the fixture?). Make AI-dependent tests run against a fake model instead of skipping.
4. Fix the parser text-corruption bug and non-ASCII stripping; dedupe the PDF/OCR cleaners.
5. Close the cost/DoS hole: auth or strict per-IP limits on `/api/analyze` and chat routes, input size caps, shared-store rate limiting keyed by user and IP.
6. Stop logging resume content and emails; untrack `.env`, ignore `.env*`.
7. Remove unsupported marketing claims (D-011, pending Founder sign-off for any live deployment).
8. Delete dead code identified in Review §2.1 (PRO+, dead LLM clients, rewrite-service, unused components, Layer 5 execution stubs, most Layer 8 templates).

**Exit gate:** green CI on `main`; the working journey (upload → score → results → save version) covered by an end-to-end test; no anonymous path to a paid model call.

## Stage 1 — Foundations for 2.0

Requires D-002, D-004, D-005, D-006.

1. One auth system (D-004); route-level auth tests for every API route.
2. Postgres + career-record schema (Review §5.4), with export/delete.
3. LLM gateway: provider-agnostic, schema-validated outputs, budgets, abortable timeouts, tracing.
4. Workflow runtime with persisted runs/steps, tool registry with `read`/`draft`/`external` tiers, approvals inbox.
5. Merge the two state modules; one application-status enum.

**Exit gate:** a trivial workflow (e.g. "extract experiences from an uploaded resume into the career record") runs end to end with a trace, cost record and passing tests.

## Stage 2 — The wedge (assumes D-001 = Application Studio)

Requires D-001, D-008.

1. Evidence Wallet: evidence items with provenance, created from uploads and user answers.
2. JD import (paste / URL the user provides) → requirement extraction (LLM + Layer 6 parser cross-check).
3. Proof Gap: map requirements to evidence (Layer 2 gap logic), ask the user targeted questions for gaps.
4. Studio: evidence-anchored drafting (Layer 3 ledger + planner) with claim-level citations.
5. Claim verifier (deterministic + LLM judge) and a labeled eval set in CI, including every probe in Review §2.4.
6. Approval + export (PDF/DOCX). No external submission.

**Exit gate:** eval thresholds from D-008 met; GPT-6's validation criteria for D-001 measured with real (consenting) users.

## Stage 3 — Expand only on evidence

Candidates, each needing its own decision entry: application tracking with outcomes; next-best-action planning (Layer 5 planners on real state); billing (D-009); job sourcing (D-007); approval-gated external actions (D-008 revision); framework upgrade (D-012) if not done earlier.

## Not planned

Auto-apply / autonomous submission; scraping job boards; "learning" claims without outcome data; rebuilding the 8-layer pipeline.
