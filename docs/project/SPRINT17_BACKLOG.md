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

Autonomous enemy behavior, hazards,
reward/score feedback, pacing, and complete generation quality are measurement
inputs, not pre-approved implementation scope. Failure/recovery was selected
only after the success-path measurement exposed it as the smallest blocker.

## WO-S17-001 — Platformer Baseline Collectible Composition

Status: **DONE**. Code Complete: YES. Product Verified: YES after
WO-S17-002 closed the provider-path gate.

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
platformer`. Before WO-S17-002, Observatory reported `ai · success`,
`Validation: passed`, and applied an under-complete candidate. After the gate,
the real Codex CLI candidate is structurally parsed, rejected as
`product_incomplete`, and selects `deterministic_fallback`. Full Observatory
shows the selection and the missing baseline requirements; browser
warning/error logs are empty. Runtime receives the seven-entity baseline.

### Explicit boundary

No Runtime changes, new gameplay primitives, managers, genre-specific Runtime,
provider authority, arbitrary code/eval, death/respawn, hazards, enemy AI,
score, spawning, pacing overhaul, or Observatory redesign were added.

## Post-attempt Gap Analysis — 2026-08-24

Already verified: the deterministic/fallback path now composes collectible →
remove → XP/level, and existing generic movement/jump, enemy, Health/damage,
goal completion, Runtime session state, World Evolution continuity, stale
isolation, and projections remain covered.

The selected provider candidate completeness blocker is resolved by
WO-S17-002. A real Codex CLI candidate that omitted terrain/collectible was
rejected rather than applied, and the deterministic baseline reached the
already verified generic loop. Failure, respawn, hazards, autonomous enemy
behavior, score, and pacing remain unselected because they are not measured
blockers in the current baseline traversal.

Exactly one next work item is generated:

## WO-S17-002 — Provider Candidate Completeness Gate for Platformer Baseline

Status: **DONE**. Code Complete: YES. Product Verified: YES.

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

### Human/CTO decision and implementation

Human/CTO approved the fail-closed product semantics: a complete provider
candidate is accepted; a structurally valid but product-incomplete platformer
candidate is rejected and selects the existing deterministic baseline; provider
failure remains a distinct safe fallback. The existing validator now checks
the bounded platformer floor after structural validation. No candidate merge,
augmentation, regeneration loop, manager, or Runtime change was added.

### Evidence

- AI full suite: 156 files, 9406 tests passed; Web full suite: 47 files, 3529
  tests passed.
- AI/Web TypeScript and ESLint passed (pre-existing warnings only); Web build
  passed; `git diff --check` passed.
- Real Studio/Codex CLI request produced a provider candidate that failed the
  bounded gate, reported `deterministic_fallback` + `product_incomplete`, and
  generated seven entities. After a real jump/contact, Runtime showed six
  entities, `Experience: 1`, and `Level: 2`; browser warning/error logs were
  empty.
- Provider contract tests cover complete acceptance, incomplete rejection,
  provider failure, and deterministic baseline behavior.

## Post-WO-S17-002 Gap Analysis — 2026-08-24

The real fallback traversal exposed one smaller product blocker before Freeze
Review: after collectible removal and XP/Level transition, contact with the
goal item matched the broad category-only `collect-reward` rule. The goal was
removed and the Runtime session remained `active`, so `reach-goal` could not
commit. This is an existing deterministic RuleBuilder target-isolation defect,
not a new Runtime or provider architecture gap.

Exactly one next product work item was generated:
`WO-S17-003 — Platformer Goal/Collectible Target Isolation`. Death/respawn,
hazards, autonomous enemy behavior, score beyond XP/level, pacing, persistence,
and broad gameplay state remain deferred candidates, not automatic work.

## WO-S17-003 — Platformer Goal/Collectible Target Isolation

Status: **DONE**. Code Complete: YES. Product Verified: YES.

### Measured bottleneck

The same real natural-language fallback session showed `goal` removed during
goal contact, with `collect-reward` committed and Runtime still `active`. The
existing rule selected the right collectible by excluding goal/checkpoint in
its builder, but its emitted condition only required an `item` target, so the
condition did not preserve that selection at Runtime execution time.

### Bounded implementation

The deterministic `collect-reward` and `level-up-at-experience-threshold`
rules include an exact `ENTITY_ID_EQUALS` condition for the selected
collectible. The existing Runtime evaluator reads `eventActor`/`eventTarget`
identity directly from the immutable GameplayEvent, so level-up remains
truthful after collection removes the target earlier in the same event. Existing
`COMPLETE_GOAL` and Runtime session authority are reused; no new primitive,
manager, merge, or regeneration is added.

### Acceptance

- Builder regression asserts the exact collectible target condition.
- Real Studio verification must show collection rules only match
  `collectible`, level-up remains committed after collectible removal,
  `reach-goal` commits for `goal`, and Runtime session becomes `completed`.
- Existing provider-gate, collectible/progression, enemy/damage, stale
  isolation, TypeScript, ESLint, Web build, and `git diff --check` gates remain
  required.

### Evidence

- AI/Runtime/Web focused tests passed; full AI and Web suites, Runtime affected
  regressions, TypeScript, ESLint, Web build, and `git diff --check` passed.
- Real Studio natural-language request reported `product_incomplete` and
  selected `deterministic_fallback`. One session observed 7→6 entities after
  collectible removal, `Experience: 1`, `Level: 2`, Health 100→99, enemy
  stomp removal, goal preservation, and Runtime `completed`.
- Full Observatory Event Stream showed committed collectible removal and
  level-up, committed `DAMAGE_ENTITY`, committed enemy stomp, and committed
  `reach-goal / COMPLETE_GOAL`; browser error/warning logs were empty.

## Post-WO-S17-003 Gap Analysis — 2026-08-25

The primary natural-language fallback lifecycle now passes through truthful
success: generation selection, movement, jump, collectible/progression,
enemy/damage, enemy stomp, goal contact, and Runtime session completion. No
new measured blocker was found. Death/respawn, hazards, autonomous enemy
behavior, score beyond XP/level, pacing, persistence, and broader game-quality
evaluation remain candidates and are not pre-approved.

Human/CTO chose CONTINUE at the Sprint Freeze Review. The fresh bounded
product question was: what is the smallest generic implementation necessary so
that a generated platformer has a truthful failure lifecycle and can become
playable again? The real measured gap is that lethal `DAMAGE_ENTITY` can reduce
Health to `0`, but RuntimeGameplaySessionState remains `active` and the Studio
path has no same-world recovery operation. Exactly one next item was generated:
`WO-S17-004`, READY and auto-executing under `SPRINT_CONTINUOUS`. It is limited
to Runtime failure truth, same-world player respawn, existing projection seams,
and product verification; no enemy AI, hazards, score, pacing, checkpoints,
lives, manager, or generic framework is selected.

## WO-S17-004 — Runtime-Authoritative Lethal Failure and Same-Session Respawn

Status: **DONE**. Code Complete: YES. Product Verified: YES. Architecture:
v1.159 → v1.160.

Acceptance boundary:

- trusted lethal player `DAMAGE_ENTITY` commits Health `0` and Runtime session
  status `failed`;
- failed gameplay cannot falsely complete or commit further gameplay rules;
- explicit same-world respawn restores player Health to max and safe velocity,
  returns the Runtime session to `active`, and preserves current world,
  progression, and World Evolution continuity;
- the player can continue through the already verified collectible/progression,
  enemy, damage, stomp, goal, and `COMPLETE_GOAL` path;
- stale World A facts remain isolated from World B and Web/Renderer remain
  projections.

No checkpoint, lives, death animation, autonomous enemy, hazard, score,
platformer-specific Runtime, manager, candidate merge, regeneration loop, or
arbitrary executable generation is in scope.

### Evidence

- Runtime tests prove lethal `DAMAGE_ENTITY` commits `failed`, failed ticks
  stop systems/rules, same-world respawn restores Health/velocity and retains
  progression/entities, and a post-respawn tick executes again.
- Full AI (156 files / 9406 tests), Runtime (23 files / 693 tests), and Web
  (47 files / 3530 tests) suites passed; TypeScript, ESLint, Web build, and
  `git diff --check` passed.
- Real Studio verification confirmed `Health: 0` → visible `Respawn` control
  → unchanged same-world position → active play. The observed `99/100` after
  clicking is the existing next-tick contact damage caused by preserving the
  dangerous position; no new invincibility or checkpoint behavior was added.

## Post-WO-S17-004 Gap Analysis — 2026-08-25

The complete natural-language fallback path now proves both truthful success
and bounded failure/recovery: creation and provider completeness selection,
movement/jump, collectible/progression, enemy interaction, Health damage,
lethal Runtime failure, same-world Respawn, resumed gameplay, goal interaction,
and Runtime completion. No adjacent measured blocker remains for the Sprint 17
product goal.

Exactly one next control-plane item is retained:
`SPRINT17_FREEZE_REVIEW`, BLOCKED pending Human/CTO FREEZE or CONTINUE. Do not
generate adjacent gameplay work and do not enter Sprint 18 automatically.
