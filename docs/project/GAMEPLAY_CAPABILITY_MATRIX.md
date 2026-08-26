# Gameplay Capability Matrix — Sprint 18 Frozen / Sprint 19 Active

Architecture version: v1.167 (Sprint 18 FROZEN; WO-S19-001 Player state
presentation Product Verified; WO-S19-002 temporal run-frame Product
Verification pending)

This matrix records the boundary between gameplay intent and executable
Runtime behavior. `supported` means the production path already executes the
capability; `deferred` means the domain can describe it but Runtime does not
execute it; `unsupported` is reserved for a capability outside the current
catalog. The rule execution status is active only for the bounded supported
rules, including the two-action `ENEMY STOMP`, generic Health damage, the
current-session `COMPLETE_GOAL` slice, and finite additive numeric progression;
partial/deferred/unsupported rules remain gated as whole rules. A Studio-only
slice is not promoted to a general Runtime capability.

| Concept | Domain / semantic status | Runtime capability status | Evidence / treatment |
| --- | --- | --- | --- |
| Player movement | `GameplaySpecification.mechanics` | `supported` | `DefaultPlayerControllerSystem` is registered in the production Studio viewport. |
| Player jump | `GameplaySpecification.mechanics` | `supported` | `DefaultJumpSystem` applies the existing grounded jump behavior. |
| Gravity | `GameplaySpecification.mechanics` | `supported` | `DefaultGravitySystem` and vertical motion are wired in the playable slice. |
| Vertical motion | Runtime primitive | `supported` | `DefaultVerticalMotionSystem` updates position from velocity. |
| Basic ground collision | `GameplaySpecification.mechanics` | `supported` | `DefaultGroundCollisionSystem` clamps the playable ground plane. |
| Entity add/remove | Semantic evolution model | `supported` | Existing semantic-to-Runtime synchronization can add/remove non-player entities. |
| Targeted Gameplay Rule reconciliation | Semantic World Evolution + current `GameplayRuleSet` | `supported` | `DefaultGameplayRuleReconciler` preserves unaffected rules, revalidates/rebuilds affected known rules, removes dangling rules, binds the updated semantic revision, and records immutable reconciliation facts without Provider regeneration. |
| Gameplay event observation | Runtime event domain | `supported` | Runtime emits bounded immutable gameplay facts through `ExecutionTickResult.gameplayEvents`; this is not rule execution. |
| Accepted jump event | Runtime event observation | `supported` | `DefaultJumpSystem` emits one `ENTITY_JUMPED` only after a grounded jump is accepted. |
| Landing transition event | Runtime event observation | `supported` | `DefaultGroundCollisionSystem` emits one `ENTITY_LANDED` on airborne → ground transition. |
| Entity mutation events | Runtime event observation | `supported` | `RuntimeWorldStore` emits `ENTITY_ADDED`/`ENTITY_REMOVED` after committed ID-set changes. |
| Entity contact-start event | Runtime event observation | `supported` | Explicit Runtime `collision-bounds` AABBs produce de-duplicated `ENTITY_CONTACT_STARTED` facts with typed direction derived from Runtime geometry; the supported non-top damage rule may consume the fact after the event boundary. |
| Gameplay rule description | `GameplayRuleSpecification` + `GameplayRuleSet` | `supported` | Shared immutable Trigger/Condition/Action data is validated and stored beside `GameplaySpecification`; supported rules can enter the bounded Runtime executor. |
| Rule event vocabulary | Rule trigger | `supported` | Only `ENTITY_CONTACT_STARTED`, `ENTITY_JUMPED`, `ENTITY_LANDED`, `ENTITY_ADDED`, and `ENTITY_REMOVED` are allowed. |
| Rule entity selectors | Rule condition/target references | `supported` | Event actor/target, exact current ID, category, current semantic name/archetype, and category-backed role selectors are normalized by Genesis. |
| `REMOVE_ENTITY` rule primitive | Gameplay action schema | `supported` | The bounded executor resolves a current target, protects Player, and calls the immutable `WorldMutator`. |
| `SPAWN_ENTITY` rule primitive | Gameplay action schema | `deferred` | Entity addition exists as a mutation primitive, but rule-driven spawn execution is not active. |
| `APPLY_VELOCITY` rule primitive | Gameplay action schema | `supported` | Generic trusted action reuses `VelocityComponent` and immutable `WorldMutator.replaceEntity`; set/add modes are bounded and deterministic. |
| `CHANGE_NUMERIC_STATE` | Gameplay action schema | `supported` | Runtime owns an immutable keyed finite-number map and commits deterministic additive deltas through the existing GameplayRuleExecutor; the lifecycle baseline is `experience=0, level=1`, with `experience` and `level` as the bounded Sprint 16 use case. |
| `SET_ENTITY_PROPERTY` | Gameplay action schema | `deferred` | No generic gameplay property executor exists. |
| `DAMAGE_ENTITY` | Gameplay action schema | `supported` | Trusted generic action validates positive finite damage, resolves current Health, uses immutable `WorldMutator.replaceEntity`, and commits Runtime session `failed` when a player reaches zero. Failed execution pauses later gameplay rules until explicit same-world respawn. |
| `COMPLETE_GOAL` | Gameplay action schema | `supported` | Trusted goal-contact rules commit `RuntimeGameplaySessionState` from `active` to `completed`; repeated completion is an idempotent no-op and failed sessions cannot complete before respawn. |
| Contact direction condition | Gameplay condition schema | `supported` | `ENTITY_CONTACT_STARTED.direction` is required and derived from Runtime-owned AABB crossing/overlap geometry; evaluator supports top/non-top and narrow negation. |
| `NUMBER_COMPARE` condition | Gameplay condition schema | `supported` | Runtime evaluates finite typed event-payload, entity-property, and Runtime `gameState` references with `eq/neq/gt/gte/lt/lte`; no expression language or arbitrary evaluation is introduced. |
| Trigger matching / condition evaluation / action execution | Gameplay rule execution | `partially supported` | `DefaultGameplayRuleMatcher`, `DefaultGameplayConditionEvaluator`, and trusted generic actions run after the event batch; the two-action stomp uses staged all-or-nothing commit; no eval, scripts, generated code, or generic workflow engine exists. |
| Platformer loop | `GameLoopSpecification` + defaults | `partially supported` | Move/jump/physics, contact facts, collectible removal, collect-reward `experience +1`, enemy stomp, non-top Health damage, Runtime failure/respawn, and current-session goal completion execute; score and game-over remain deferred. |
| Farm interaction | Mechanics and interaction intent | `deferred` | Farm entities are semantically modeled; no production interaction executor exists. |
| Collection / collectibles | Mechanics, optional goals/targets | `partially supported` | A player contact with semantic category `item` can remove the target and the bounded collect-reward rule can add `experience`; inventory, score, and `ITEM_COLLECTED` remain absent. |
| Damage / health | Combat and failure intent | `partially supported` | Player/enemy/npc Health is a generic Runtime component and non-top contact can decrease current Health; lethal player damage commits Runtime `failed`, and same-world respawn restores Health/active play. |
| Enemy spawn | Spawn rule intent | `deferred` | Spawn rules are descriptive; no gameplay spawner executes them. |
| Enemy chase / AI | Combat/movement intent | `deferred` | Enemy entities may exist semantically; no enemy controller is wired. |
| Enemy stomp / defeat | Combat intent | `supported` | Generic `enemy-stomp` rule validates player/enemy/top, removes the target, and applies upward player velocity with rule-level all-or-nothing commit. |
| Goals / checkpoints / win | Goal intent and semantic entities | `partially supported` | Player contact with the validated goal can commit the Runtime session to `completed`; no victory UI, next level, restart, deletion, or progression flow exists. |
| Player death / failure | Failure-condition intent | `partially supported` | Trusted lethal player damage commits Runtime `failed`; the bounded same-world respawn restores active play without lives/checkpoints or a generic reset framework. |
| Timer / survive duration | Loop and goal intent | `deferred` | Duration is descriptive; no gameplay timer or expiry system exists. |
| Experience / levels | Progression intent | `partially supported` | Supported collect-reward adds `experience +1`; a typed `experience >= 1 AND level < 2` rule commits exactly one Level 1 → Level 2 transition. Skill/upgrade state and later thresholds remain deferred. |
| Waves / escalating pressure | Progression/spawn intent | `deferred` | Survivor defaults describe waves/pressure without a wave executor. |
| Runtime gameplay rule engine | Bounded S15-007 execution seam | `partially supported` | Current supported rules execute after finalized Runtime events; ENEMY STOMP, generic DAMAGE_ENTITY, current-session COMPLETE_GOAL, and finite CHANGE_NUMERIC_STATE are bounded slices, with staged all-or-nothing semantics for multi-action rules. This is not a generic manager, workflow engine, transaction framework, or arbitrary-code runtime. |

## Audit classification

- **RUNTIME IMPLEMENTED:** movement, jump, gravity, vertical motion, basic
  ground collision, generic Health state, targeted entity add/remove and
  Health mutation, lethal player failure/same-world respawn, current-session
  completion state, immutable keyed finite
  numeric progression state with additive deltas, and bounded normalized event
  observation for jump, landing, contact-start, add, and remove facts.
- **RULE DESCRIPTION IMPLEMENTED:** immutable Trigger/Condition/Action rules,
  deterministic RuleSet mapping, candidate validation, selector validation, and
  capability-derived support status.
- **RULE EXECUTION IMPLEMENTED:** bounded post-system matching, category/
  archetype/ID/component/direction evaluation, generic `REMOVE_ENTITY`,
  `APPLY_VELOCITY`, `DAMAGE_ENTITY`, `COMPLETE_GOAL`, and finite additive
  `CHANGE_NUMERIC_STATE` actions, current-world/semantic binding, Player
  protection, exactly-once consumption, and next-boundary mutation observation.
  Multi-action rules stage immutable worlds and commit only when all actions
  succeed; numeric state is committed separately from World mutation.
- **SEMANTICALLY MODELED:** platformer/farm/survival entities, goals,
  checkpoints, enemies, resources, and the new gameplay specification sections.
- **HARDCODED SLICE:** the production Studio viewport still registers the
  platformer movement/jump/physics systems directly; this is represented as a
  catalog fact, not generalized into unsupported mechanics.
- **NOT EXECUTED:** skill/modifier state, score policy, game-over, lives,
  checkpoints, enemy AI,
  timers, spawn execution, progression beyond the bounded numeric primitive,
  failure flow beyond the bounded player failure/respawn slice, property actions,
  unrelated rich multi-action transactions, victory UI, next-level/restart
  behavior, and win/lose orchestration beyond current session-completed truth.

The catalog is deliberately small. It is a truthful capability boundary, not
a plugin registry or a promise that a provider-generated mechanic is runnable.

Sprint 17 is frozen at v1.160 with the complete mechanically coherent
platformer lifecycle Product Verified. Sprint 18 is frozen at v1.164: asset
render usage travels through request/context/manifest; semantic Platform
selection is provider-verified; and Ground repeats across Runtime-authoritative
coverage. Sprint 19 may project Runtime behavior into presentation, but this
matrix does not yet claim Player animation as supported.
