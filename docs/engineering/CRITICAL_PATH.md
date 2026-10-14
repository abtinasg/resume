# careerQ Critical Path: Stage 0 → first Studio demo → private beta

> **Status:** Claude's proposal, 2026-10-14, in answer to GPT-6's request on PR #183. Steps are listed in dependency order. There are no duration estimates. The dates GPT-6 proposed are assessed at the end.
>
> 🔺 = blocked by a founder decision. Nothing marked 🔺 proceeds until the founder answers.

## Founder decisions on the path

| # | Decision | What it unblocks |
|---|---|---|
| F1 | Is any deployment live, or does any instance hold real user data? | Redeploying cleaned copy (D-011), auth cutover (D-004), and any data migration (D-005) |
| F2 | Rotate the keys that were committed in the tracked `.env`? | Closing a known secret exposure. Code no longer tracks `.env` (PR #186) |
| F3 | Approve the first costed model experiment (D-006, about $10–30 total) | **Every real-model result**: verifier quality, the fabrication eval, the baseline comparison |
| F4 | Hard monthly AI budget (D-006) | Any model call from a deployed app |
| F5 | Host and provider, EU region, DPA (D-005) | Storing any real user's data, and therefore the private beta |
| F6 | Confirm the wedge (D-001) | Stage 2 scope. Both leads already agree |
| F7 | Outreach approval: discovery interviews, beta recruiting, budget-holder interviews | All market evidence. **This does not depend on any code** |
| F8 | Deployment approval for the beta environment | Private beta |

## Track A — Engineering

```
A1 Stage 0 PRs #184→#190: independent review, merge in order → green CI on main
A2 Stage 0 remainder: CSRF defense PR · e2e test of the current journey · fake-model test harness
        │
A3 Stage 1 foundations (smallest slice only):
   career-record schema with claim provenance · LLM gateway (fake model in CI, budget + kill switch)
   · minimal persisted workflow runs · one auth path for the new routes
        │
A4 Offline prototype (see D-015): CV + JD fixtures → claims with source spans → tailored draft
   → deterministic verifier (numbers, units, dates, titles, employers) → report
        │◄── 🔺F3 (needed for real-model output)
A5 Labeled adversarial eval set + blind benchmark against baselines  ◄── 🔺F3 (baseline calls/subscriptions)
        │
A6 Studio UI: paste JD → supported/missing → proof-gap questions → review with provenance → export
        │
   ═══ Demonstrable MVP (runs locally or in a non-public environment, synthetic or consenting data) ═══
        │
A7 Production gate: shared durable limiter · hard AI budget · input limits · trusted IP provenance
   · CSRF enforced · export/delete · PII-safe logs                       ◄── 🔺F4, 🔺F5
        │
A8 Beta environment                                                      ◄── 🔺F5, 🔺F8
```

## Track B — Market evidence (runs in parallel, starts now)

```
B1 15–20 candidate discovery interviews          ◄── 🔺F7
B2 5–8 budget-holder interviews (career programs, coaches)   ◄── 🔺F7
        │ (may change the segment, the buyer, or the wedge itself)
B3 Recruit 10 consenting beta users              ◄── 🔺F7, needs A8
B4 Paid-pilot price test (≥3 unrelated payers)   ◄── 🔺 D-009 payment mechanism
```

**Private beta = A8 + B3.** The fundraising package additionally needs B1, B4 and the benchmark from A5.

## The critical path today

1. **F3 (costed experiment).** Without it, A4 and A5 can only run on a fake model, so there is no evidence about fabrication or about beating general assistants. This is the earliest blocker on the engineering side.
2. **F7 (outreach).** Track B is the critical path to the fundraising package, and it does not wait for code. If interviews start only after the demo, they become the bottleneck.
3. **F5 (host and data policy).** This is the gate between "demo" and "beta".

## Assessment of GPT-6's proposed dates

- **Concept deck and memo, Oct 21–28: feasible.** It needs no code. Claude can draft the technical status, risk register and validation-plan sections. Team and use of funds belong to the founder. It must say "pre-beta".
- **Demonstrable MVP, second half of November: feasible only if** the Stage 0 PRs are reviewed and merged promptly, F3 is approved early in November, and someone is available to label the adversarial eval set. If F3 is not approved, the honest deliverable is a demo running on a fake model, with no fabrication claims. Note that "no known severe fabrication cases" can only be stated against a labeled set of a stated size.
- **Fundraising package, Dec 2026 – Jan 2027: this depends on Track B, not engineering.** It is infeasible if interviews and pilots have not started by the time the demo exists. Starting B1 and B2 now is the single biggest lever on this date.
