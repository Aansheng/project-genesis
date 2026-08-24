# Sprint 16 Review — Gameplay Evolution & Progression Foundation

## Freeze Status

Sprint 16 is ready for Human/CTO Freeze Review and remains **not frozen** at
architecture v1.156. The corrected Sprint goal has both bounded parts complete:

1. Gameplay-Preserving World Evolution — `WO-S16-001`.
2. First Generic Progression Loop — `WO-S16-002`.

- Code Complete: YES
- Product Verified: YES
- FROZEN: NO — READY FOR HUMAN/CTO FREEZE REVIEW
- Current control-plane item: post-WO-S16-002 `SPRINT_FREEZE_REVIEW`
- Human decision required: YES
- Sprint 17: not entered or auto-generated

## Sprint Goal

1. Preserve unaffected executable gameplay rules across relevant World
   Evolution and reconcile only affected rules against current semantic truth.
2. Establish the first generic progression loop: a supported Gameplay Rule
   commits an authoritative Runtime-owned numeric progression state, with
   `experience` as the first use case.

Part 1 and Part 2 are both complete within their bounded acceptance
boundaries. This review does not pre-plan thresholds, level-up, skills,
modifiers, spawning, waves, or Survivor-specific behavior.

## Acceptance Evidence

| # | Sprint acceptance criterion | Result | Evidence and boundary |
| ---: | --- | --- | --- |
| 1 | Unrelated semantic evolution preserves executable rules and advances the binding revision | PASS | `DefaultGameplayRuleReconciler` preserves unaffected rule objects, updates semantic binding, and Web integration asserts a current RuleSet after evolution. |
| 2 | Targeted changes affect only impacted rules | PASS | Reconciliation fingerprints current selectors, references, categories, archetypes, components, and actions; focused AI tests cover unrelated preservation and targeted changes. |
| 3 | Removed exact targets cannot remain executable | PASS | Updated-world validation and deterministic baseline resolution remove invalid/dangling rules. |
| 4 | Affected known rules are revalidated/rebuilt or visibly removed/deferred | PASS | Reconciliation facts classify `preserved`, `revalidated`, `rebuilt`, `removed`, and `deferred`; current RuleSet warnings retain removed/deferred evidence. |
| 5 | Revision-only changes do not globally stale-disable the RuleSet | PASS | `gameStore.planEvolution` reconciles before semantic commit and does not globally stale-disable an applied RuleSet. |
| 6 | Deterministically reconcilable changes do not call Provider/AI | PASS | The reconciler uses Shared contracts, the capability catalog, the existing builder, and the validator; no provider is in the call chain. |
| 7 | Gameplay continues in the same Runtime/session without full rebuild | PASS | The existing `DefaultRuntimeExecutionLoop` remains active while the current RuleSet revision evolves. |
| 8 | World A rules/results cannot affect World B | PASS | Existing world/session/revision guards and new progression binding tests reject stale cross-world state. |
| 9 | Observatory separates reconciliation from Runtime execution | PASS | World Evolution stages/events remain separate from Runtime facts and rule results. |
| 10 | A supported rule can acquire generic numeric progression state | PASS | `CHANGE_NUMERIC_STATE` commits finite additive deltas to the immutable Runtime-owned keyed state; deterministic collect-reward uses `experience +1`. |
| 11 | Numeric progression is deterministic, finite, atomic, and isolated | PASS | Empty keys, non-finite amounts, overflow, missing state, stale bindings, and failed later actions do not commit; accumulation and rollback tests pass. |
| 12 | Progression retains across semantic evolution and resets on world/session replacement | PASS | Same Runtime/session retains the committed value across a non-replacing semantic revision; a new world/session binds a fresh state. |
| 13 | Progression projection is truthful and separate | PASS | `ExecutionTickResult` → Renderer observer → Observatory Runtime projection shows the numeric state separately from raw events, Rule results, and World mutations. |

## Production Chain

`Studio command → gameStore semantic mutation → GameplayRuleReconciler →
current semantic world + current RuleSet commit → existing Runtime World
synchronizer → same Runtime execution loop → GameplayEvent → GameplayRule →
trusted REMOVE_ENTITY / DAMAGE_ENTITY / COMPLETE_GOAL / CHANGE_NUMERIC_STATE
actions → immutable Runtime World/session/progression commit → Renderer and
Observatory projections`

Runtime owns the committed numeric state. GameplaySpecification remains design
intent, GameplayRuleSet remains executable plan authority, and Web/Pinia/
Observatory remain projections. No genre-specific Runtime or manager layer was
added.

## Verification

- Shared: 9 files, 207 tests passed.
- AI: 156 files, 9,402 tests passed, including deterministic collect-reward
  generation and reconciliation.
- Runtime: 23 files, 689 tests passed.
- Renderer: 25 files, 485 tests passed.
- Web: 47 files, 3,528 tests passed.
- Direct TypeScript checks for Shared, AI, Runtime, Renderer, and Web passed.
- Package ESLint passed with 0 errors; existing warnings remain in legacy/test
  surfaces. Web production build passed with the existing chunk-size advisory.
- Root `pnpm typecheck` remains a managed-environment limitation: Turbo cannot
  initialize its API client because TLS/keychain access is unavailable.
- `git diff --check` passed.

## Manual Studio Evidence

Using the real local Studio at `http://localhost:5173/` with a temporary
localhost-only structured candidate gateway for the evolution request:

- Created gateway-backed `world-3` with a supported
  `gain-experience-on-collect` rule whose action is `CHANGE_NUMERIC_STATE`.
- Stayed on the Game route, moved the player into the item, and observed
  Runtime Observatory `经验值: 1`.
- Applied `change the theme to night` without replacing the semantic world or
  remounting the Game Runtime. Studio reported `Semantic change applied`, and
  Observatory still showed `world-3`, `经验值: 1`.
- Created a new `world-4`; Observatory showed `经验值: Unavailable`, proving
  reset on new world/session binding.
- Final browser diagnostics contained no warning or error entries.

The deterministic no-gateway creation path also emits the bounded
collect-reward action sequence (`REMOVE_ENTITY`, `CHANGE_NUMERIC_STATE`) and
was covered by AI and Web tests. The temporary gateway and unavailable image
endpoint were verification aids only; no provider or gateway product code was
changed.

## Deferred Work

Level thresholds, level-up transitions, upgrade/skill selection,
progression-driven modifiers, score policy, death/respawn/game-over,
timers, spawn/wave pressure, persistence, richer rule actions, broader
gameplay-rule evolution, and the full Survivor loop remain deferred. The
missing offline World Evolution fallback is a real resilience gap but is
explicitly non-blocking for Sprint 16. The next action is the Human/CTO Freeze
Review; do not auto-cross into Sprint 17.
