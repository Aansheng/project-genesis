# Sprint 17 Backlog — Mechanically Complete Platformer Generation

Sprint 17 was approved by Human/CTO on 2026-08-24. Sprint 16 remains FROZEN at
v1.157. The sprint is continuous and sequential: one measured WO is generated,
executed, and re-evaluated at a time; Sprint 18 is never entered automatically.

## Product goal

A user can request a simple 2D platformer through natural language and Genesis
can generate a mechanically coherent game that reaches a truthful success or
failure lifecycle using generic structured gameplay capabilities, not a
genre-specific Runtime.

Primary scenario:

`natural-language request → generation → move → jump → collectible → enemy →
damage/health → truthful failure when applicable → recovery as required →
continue → goal → Runtime session completed`

Death/failure, restart/respawn, autonomous enemy behavior, hazards,
reward/score feedback, pacing, and complete generation quality are measurement
inputs, not pre-approved implementation scope.

## WO-S17-001 — Platformer Baseline Collectible Composition

Status: **BLOCKED at Product Verification**. Code Complete: YES. Product
Verified: NO.

Architecture before: v1.157.

Architecture actual after: v1.158. ADR-0272 records the accepted deterministic
composition boundary.

### Measured bottleneck and implementation

The default deterministic platformer had no eligible collectible because goal
and checkpoint items are excluded by the existing rule builder. The smallest
change added the stable `collectible`/`Coin` item and its fixed `(220, 320)`
layout anchor in `@genesis/ai`. Existing GameplayRuleSet and Runtime seams were
reused unchanged.

### Evidence

- AI template/layout/create-world tests: 178 passed.
- Runtime gameplay regressions: 79 passed.
- Web gameplay regressions: 9 passed.
- AI/Runtime/Web TypeScript checks passed; package ESLint exited with no errors
  and only pre-existing warnings; Web build passed.
- In a real Studio instance with the gateway unavailable, deterministic
  fallback generated 7 entities. Traversal produced 6 remaining entities and
  Observatory showed `Experience: 1`, `Level: 2`; browser warning/error logs
  were empty.

### Product gate result

The normal configured Studio path was also tested with `Create a simple 2D
platformer`. Observatory reported `ai · success`, `Validation: passed`,
`Design: platformer`, and `Entities: 2`; World Explorer contained only
`player` and `platform`, Runtime stayed active at `Experience: 0`, `Level: 1`,
and browser warning/error logs were empty. The structural validator accepts
this candidate, so the new deterministic template is not reached on that
path. This is a real product blocker, not a test-only discrepancy.

### Explicit boundary

No Runtime changes, new gameplay primitives, managers, genre-specific Runtime,
provider authority, arbitrary code/eval, death/respawn, hazards, enemy AI,
score, spawning, pacing overhaul, or Observatory redesign were added.

## Post-attempt Gap Analysis — 2026-08-24

Already verified: the deterministic/fallback path now composes collectible →
remove → XP/level, and existing generic movement/jump, enemy, Health/damage,
goal completion, Runtime session state, World Evolution continuity, stale
isolation, and projections remain covered.

Selected next blocker: **provider candidate completeness at the generation
trust boundary**. A structurally valid AI candidate can still omit the enemy,
collectible, goal, and terrain baseline needed by the approved loop. Failure,
respawn, hazards, autonomous enemy behavior, score, and pacing remain
unselected because the configured provider path does not yet reach the baseline
loop.

Exactly one next work item is generated:

## WO-S17-002 — Provider Candidate Completeness Gate for Platformer Baseline

Status: **BLOCKED — Human/CTO product acceptance gate**.

Architecture before: v1.158.

### Bounded objective

Decide and implement the smallest existing-boundary trust behavior that makes a
structurally valid but mechanically incomplete platformer candidate unable to
bypass the deterministic baseline—preferably rejecting/falling back through
the existing provider adapter, or an equivalently deterministic normalization
at that boundary.

### Allowed scope after the gate

`@genesis/ai` candidate validation/normalization and focused provider/fallback
tests only. The result must preserve candidate-as-untrusted-input semantics,
reuse the existing deterministic template/provider, and make the configured
natural-language request reach the same generic RuleSet/Runtime path verified
by WO-S17-001.

### Forbidden scope

New Runtime authority, genre-specific Runtime, managers, arbitrary code/eval,
provider capability claims, death/respawn, hazards, enemy AI, score, spawning,
pacing overhaul, broad quality infrastructure, visual polish, or Sprint 18.

### Gate

Human/CTO must resolve whether the deterministic platformer baseline is the
minimum acceptance floor for a valid provider candidate and whether an
under-complete candidate must fail closed into the existing deterministic
fallback. Until resolved, no second implementation WO is executed.
