# Sprint 15 Review — Gameplay Mechanics Foundation

## Freeze Status

Sprint 15 is frozen. Architecture remains v1.154.

- Code Complete: YES
- Product Verified: YES
- FROZEN: YES
- Freeze decision: Human/CTO accepted on 2026-08-24

The review evaluates the Sprint-level thesis rather than requiring every future
gameplay mechanic:

> Genesis can describe and execute a mechanically coherent platformer gameplay
> slice through generic structured Gameplay Rules and trusted Runtime
> primitives, without genre-specific Runtime implementations.

Death/Game Over, respawn, lives, score, question-block rewards, timers,
spawners, XP, level-up, skill selection, waves, and the full Survivor loop are
deferred. None is required by this freeze review.

## Acceptance Evidence

| # | Sprint acceptance criterion | Result | Evidence and boundary |
| ---: | --- | --- | --- |
| 1 | `GameplaySpecification` exists and is authoritative design intent | PASS | `@genesis/shared` owns the immutable contract and capability catalog; `@genesis/ai` validates/builds it; `apps/web/src/stores/gameStore.ts` stores the generated specification separately from Runtime state. Provider claims do not determine support. |
| 2 | `GameplayRuleSet` expresses Trigger / Condition / Action as structured data | PASS | `packages/shared/src/gameplay/GameplayRule.ts` defines typed triggers, selectors, conditions, actions, binding, and execution metadata; `GameplayRuleBuilder` creates the world-bound set. |
| 3 | Runtime emits truthful `GameplayEvent`s | PASS | `GameplayEvent.ts`, `RuntimeGameplayEventCollector`, `EntityContactSystem`, jump/landing systems, and `ExecutionTickResult.gameplayEvents` emit bounded Runtime facts with tick/sequence identity. |
| 4 | Trigger matching and condition evaluation are generic | PASS — bounded | `DefaultGameplayRuleMatcher` and `DefaultGameplayConditionEvaluator` operate on event type, participants, semantic categories/archetypes/IDs, components, and contact direction. Unsupported numeric/boolean conditions remain gated rather than being falsely executed. |
| 5 | Trusted gameplay actions execute through Runtime-owned primitives | PASS | `DefaultGameplayActionExecutor` uses `WorldMutator` for `REMOVE_ENTITY`, `APPLY_VELOCITY`, and `DAMAGE_ENTITY`; `COMPLETE_GOAL` mutates only the Runtime session store. No Renderer/UI mutation path is used. |
| 6 | Collectible interaction is proven | PASS | WO-S15-004 generic `collect-reward` contact → `REMOVE_ENTITY` path is covered by Runtime/Web tests and recorded Studio evidence. |
| 7 | Enemy stomp is proven | PASS | WO-S15-005 / ADR-0266 prove Runtime AABB direction, generic `enemy-stomp`, staged remove + bounce, rollback, exactly-once behavior, continuity, and browser evidence. |
| 8 | Damage / Health is proven | PASS | WO-S15-006 / ADR-0267 prove generic Health and non-top `DAMAGE_ENTITY`; recorded Studio evidence shows Inspector Health `100/100 → 93/100` with no death flow. |
| 9 | Goal Completion is proven | PASS | WO-S15-007 / ADR-0268 prove player contact → `reach-goal` → `COMPLETE_GOAL` → RuntimeGameplaySessionState `active → completed`; repeated completion is a no-op and world replacement resets the new session. Studio Observatory showed `completed` while Runtime remained Live. |
| 10 | Runtime/player/camera continuity is preserved | PASS | The production `GameViewportPanel` wires the existing generic systems, camera controller, Runtime loop, and Pixi renderer. WO-S15-005/007 browser evidence shows continued control/ticking and no camera/world rebuild. |
| 11 | Stale world/session/rule isolation is preserved | PASS | Runtime binding and stale guards reject World A facts/rules in World B; tests cover world/session rebind, semantic-revision retention, stale isolation, and the current-session completion store. |
| 12 | Renderer remains a projection of committed Runtime truth | PASS | `DefaultRuntimeVisualizationLoop` commits the Runtime World to its sink before publishing gameplay observers; Renderer/Web consume `ExecutionTickResult` and do not own gameplay authority. |
| 13 | Observatory distinguishes intent, planned rules, facts, and execution | PASS | `OBSERVATORY_TRUTH_AUDIT.md`, `ObservatoryOverview`, Event Stream, Runtime view, and separate gameplay-rule projections keep `GameplaySpecification`, `GameplayRuleSet`, raw events, committed actions, Runtime World, and session status distinct. |
| 14 | No arbitrary generated code/eval exists | PASS | Structured candidate validation and prompt rules reject functions/scripts/eval/expression payloads; the source audit found no executable `eval`, `new Function`, or generated-code path in the gameplay pipeline. |
| 15 | No Mario-specific/genre-specific foundational Runtime was introduced | PASS | Sprint 15 adds generic Runtime systems, matcher/evaluator, trusted primitives, and session state. The historical `MarioGameBootstrap` compatibility export remains isolated and is not imported by production Web Studio; `GameViewportPanel` wires generic systems directly. |
| 16 | Platformer gameplay remains playable through the verified mechanics | PASS | Recorded Studio sessions create a normal platformer, preserve movement/jump, execute collectible/stomp/damage/goal paths, keep Runtime Live, and complete with clean browser logs. |

## Frozen Production Chain

`Genesis Studio → IntentRouter → Semantic World → GameplaySpecification →
validated/world-bound GameplayRuleSet → Runtime systems and Runtime-owned
geometry → GameplayEvent batch → generic matcher/condition evaluator → trusted
Runtime action/session commit → RuntimeWorldStore → Renderer/Pixi → separate
Observatory projections`

The chain is generic at the gameplay-rule and trusted-action boundaries. The
catalog is deliberately partial: unsupported or deferred rule primitives stay
visible as deferred and do not become fake Runtime behavior.

## Product Evidence

The accumulated Studio evidence is sufficient for this Sprint freeze:

- WO-S15-004: player → collectible contact, remove-only execution, next-boundary
  `ENTITY_REMOVED`, continued control, clean console.
- WO-S15-005: real top/non-top contact direction, generic stomp rule, enemy
  removal, bounce/re-land, continued control, no camera/world rebuild.
- WO-S15-006: real non-top enemy contact, committed `DAMAGE_ENTITY`, Health
  Inspector change `100/100 → 93/100`, no death/game-over inference.
- WO-S15-007: real goal contact, Observatory `Gameplay: completed`, Runtime
  remained Live, replacement world returned to `active`, and browser logs were
  empty.

## Verification

- Runtime: 23 files, 685 tests passed.
- Renderer: 25 files, 484 tests passed.
- AI: 155 files, 9,398 tests passed.
- Shared: 9 files, 207 tests passed.
- Web: 47 files, 3,525 tests passed.
- TypeScript: all five affected package checks passed.
- ESLint: all five affected package checks passed with 0 errors; existing
  repository warnings remain.
- Web production build: passed; existing chunk-size advisory remains.
- `git diff --check`: passed.

## Known Limitations and Deferred Work

Sprint 15 does not claim death/failure, respawn, lives, score/numeric state,
question-block rewards, timers, spawners, XP, level-up, skill selection, waves,
the full Survivor loop, victory UI, next level, restart, persistence, or
gameplay-rule evolution. The historical Canvas2D `renderWorld()` and
`MarioGameBootstrap` compatibility paths remain documented legacy paths; the
production Studio path used for this freeze is the generic Pixi Runtime loop.

## Next Sprint-Level Measured Bottleneck

The current measurable gap is gameplay-aware Natural Language World Evolution:
when semantic evolution changes the current world, `gameStore` marks the
world-bound `GameplayRuleSet` stale because automatic mechanics synchronization
does not exist. Sprint 15 proves a coherent initial gameplay slice, but it does
not yet prove that the same generic gameplay intent can remain truthful across
natural-language world evolution.

This is recorded as one blocked high-level Sprint 16 discovery item. No Sprint
16 implementation is authorized or executed by this review.

Post-freeze control-plane update: on 2026-08-24 Human/CTO accepted targeted
Gameplay Rule Reconciliation, completed `SPRINT16_DISCOVERY`, and generated
`WO-S16-001` as the single READY Sprint 16 product WO. That later decision does
not alter the Sprint 15 freeze result or claim Sprint 16 product completion.
