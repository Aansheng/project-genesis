# Gameplay Capability Matrix — WO-S15-004

Architecture version: v1.151

This matrix records the boundary between gameplay intent and executable
Runtime behavior. `supported` means the production path already executes the
capability; `deferred` means the domain can describe it but Runtime does not
execute it; `unsupported` is reserved for a capability outside the current
catalog. The rule execution status is active only for the bounded single
`REMOVE_ENTITY` slice; partial/deferred/unsupported rules remain gated as whole
rules. A Studio-only slice is not promoted to a general Runtime capability.

| Concept | Domain / semantic status | Runtime capability status | Evidence / treatment |
| --- | --- | --- | --- |
| Player movement | `GameplaySpecification.mechanics` | `supported` | `DefaultPlayerControllerSystem` is registered in the production Studio viewport. |
| Player jump | `GameplaySpecification.mechanics` | `supported` | `DefaultJumpSystem` applies the existing grounded jump behavior. |
| Gravity | `GameplaySpecification.mechanics` | `supported` | `DefaultGravitySystem` and vertical motion are wired in the playable slice. |
| Vertical motion | Runtime primitive | `supported` | `DefaultVerticalMotionSystem` updates position from velocity. |
| Basic ground collision | `GameplaySpecification.mechanics` | `supported` | `DefaultGroundCollisionSystem` clamps the playable ground plane. |
| Entity add/remove | Semantic evolution model | `supported` | Existing semantic-to-Runtime synchronization can add/remove non-player entities. |
| Gameplay event observation | Runtime event domain | `supported` | Runtime emits bounded immutable gameplay facts through `ExecutionTickResult.gameplayEvents`; this is not rule execution. |
| Accepted jump event | Runtime event observation | `supported` | `DefaultJumpSystem` emits one `ENTITY_JUMPED` only after a grounded jump is accepted. |
| Landing transition event | Runtime event observation | `supported` | `DefaultGroundCollisionSystem` emits one `ENTITY_LANDED` on airborne → ground transition. |
| Entity mutation events | Runtime event observation | `supported` | `RuntimeWorldStore` emits `ENTITY_ADDED`/`ENTITY_REMOVED` after committed ID-set changes. |
| Entity contact-start event | Runtime event observation | `supported` | Explicit Runtime `collision-bounds` AABBs produce de-duplicated `ENTITY_CONTACT_STARTED`; no collection/damage follows. |
| Gameplay rule description | `GameplayRuleSpecification` + `GameplayRuleSet` | `supported` | Shared immutable Trigger/Condition/Action data is validated and stored beside `GameplaySpecification`; supported rules can enter the bounded Runtime executor. |
| Rule event vocabulary | Rule trigger | `supported` | Only `ENTITY_CONTACT_STARTED`, `ENTITY_JUMPED`, `ENTITY_LANDED`, `ENTITY_ADDED`, and `ENTITY_REMOVED` are allowed. |
| Rule entity selectors | Rule condition/target references | `supported` | Event actor/target, exact current ID, category, current semantic name/archetype, and category-backed role selectors are normalized by Genesis. |
| `REMOVE_ENTITY` rule primitive | Gameplay action schema | `supported` | The bounded executor resolves a current target, protects Player, and calls the immutable `WorldMutator`. |
| `SPAWN_ENTITY` rule primitive | Gameplay action schema | `deferred` | Entity addition exists as a mutation primitive, but rule-driven spawn execution is not active. |
| `APPLY_VELOCITY` rule primitive | Gameplay action schema | `deferred` | Runtime has a typed Velocity component shape, but rule-driven velocity execution is not active. |
| `CHANGE_NUMERIC_STATE` | Gameplay action schema | `deferred` | No generic score/XP/game-state store exists. |
| `SET_ENTITY_PROPERTY` | Gameplay action schema | `deferred` | No generic gameplay property executor exists. |
| `DAMAGE_ENTITY` | Gameplay action schema | `deferred` | No health/damage resolver exists. |
| `COMPLETE_GOAL` | Gameplay action schema | `deferred` | No goal state or completion executor exists. |
| Contact direction condition | Gameplay condition schema | `deferred` | `CONTACT_DIRECTION_EQUALS` is representable for future rules, but S15-002 contact facts do not emit direction. |
| Trigger matching / condition evaluation / action execution | Gameplay rule execution | `partially supported` | `DefaultGameplayRuleMatcher`, `DefaultGameplayConditionEvaluator`, and the single-remove executor run after the event batch; no eval, scripts, generated code, or generic workflow engine exists. |
| Platformer loop | `GameLoopSpecification` + defaults | `partially supported` | Move/jump/physics, contact facts, and minimal collectible removal execute; score, goal, enemy resolution, and death remain deferred. |
| Farm interaction | Mechanics and interaction intent | `deferred` | Farm entities are semantically modeled; no production interaction executor exists. |
| Collection / collectibles | Mechanics, optional goals/targets | `partially supported` | A player contact with semantic category `item` can remove the target; inventory, score, numeric reward, and `ITEM_COLLECTED` remain absent. |
| Damage / health | Failure/combat intent only | `deferred` | No gameplay damage or health-resolution system is wired. |
| Enemy spawn | Spawn rule intent | `deferred` | Spawn rules are descriptive; no gameplay spawner executes them. |
| Enemy chase / AI | Combat/movement intent | `deferred` | Enemy entities may exist semantically; no enemy controller is wired. |
| Enemy stomp / defeat | Combat intent | `deferred` | Candidate claims are corrected to deferred by the capability boundary. |
| Goals / checkpoints / win | Goal intent and semantic entities | `deferred` | Goal references can be validated; no goal completion or win state executes. |
| Player death / failure | Failure-condition intent | `deferred` | Failure conditions are recorded; no death/reset rule engine exists. |
| Timer / survive duration | Loop and goal intent | `deferred` | Duration is descriptive; no gameplay timer or expiry system exists. |
| Experience / levels | Progression intent | `deferred` | Progression modes are recorded; no XP, level, or upgrade state executes. |
| Waves / escalating pressure | Progression/spawn intent | `deferred` | Survivor defaults describe waves/pressure without a wave executor. |
| Runtime gameplay rule engine | Bounded S15-004 execution seam | `partially supported` | Only current supported rules with one `REMOVE_ENTITY` action execute; this is not a generic manager, workflow engine, or arbitrary-code runtime. |

## Audit classification

- **RUNTIME IMPLEMENTED:** movement, jump, gravity, vertical motion, basic
  ground collision, targeted entity add/remove mutation, and bounded normalized
  event observation for jump, landing, contact-start, add, and remove facts.
- **RULE DESCRIPTION IMPLEMENTED:** immutable Trigger/Condition/Action rules,
  deterministic RuleSet mapping, candidate validation, selector validation, and
  capability-derived support status.
- **RULE EXECUTION IMPLEMENTED:** bounded post-system matching, category/
  archetype/ID/component evaluation, and single `REMOVE_ENTITY` mutation with
  current-world/semantic binding, Player protection, and next-boundary removal
  observation.
- **SEMANTICALLY MODELED:** platformer/farm/survival entities, goals,
  checkpoints, enemies, resources, and the new gameplay specification sections.
- **HARDCODED SLICE:** the production Studio viewport still registers the
  platformer movement/jump/physics systems directly; this is represented as a
  catalog fact, not generalized into unsupported mechanics.
- **NOT EXECUTED:** score/numeric state, damage/health, enemy AI, timers, spawn
  execution, progression, failure, completion, property/velocity actions,
  rich multi-action transactions, and win/lose rules.

The catalog is deliberately small. It is a truthful capability boundary, not
a plugin registry or a promise that a provider-generated mechanic is runnable.
