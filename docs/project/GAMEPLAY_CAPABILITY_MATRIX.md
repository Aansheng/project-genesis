# Gameplay Capability Matrix — WO-S15-003

Architecture version: v1.150

This matrix records the boundary between gameplay intent and executable
Runtime behavior. `supported` means the production path already executes the
capability; `deferred` means the domain can describe it but Runtime does not
execute it; `unsupported` is reserved for a capability outside the current
catalog. For the rule-primitive rows, `supported` means Genesis has a trusted
typed primitive shape to target; the `GameplayRuleSet.execution.status` remains
`not-active` until S15-004 wires matching, evaluation, and execution. A
Studio-only slice is not promoted to a general Runtime capability.

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
| Gameplay rule description | `GameplayRuleSpecification` + `GameplayRuleSet` | `supported` | Shared immutable Trigger/Condition/Action data is validated and stored beside `GameplaySpecification`; execution remains disabled. |
| Rule event vocabulary | Rule trigger | `supported` | Only `ENTITY_CONTACT_STARTED`, `ENTITY_JUMPED`, `ENTITY_LANDED`, `ENTITY_ADDED`, and `ENTITY_REMOVED` are allowed. |
| Rule entity selectors | Rule condition/target references | `supported` | Event actor/target, exact current ID, category, current semantic name/archetype, and category-backed role selectors are normalized by Genesis. |
| `REMOVE_ENTITY` rule primitive | Gameplay action schema | `supported` | Maps toward the existing immutable World mutation primitive; no Trigger Matcher or Action Executor is active. |
| `SPAWN_ENTITY` rule primitive | Gameplay action schema | `supported` | Maps toward existing typed entity addition; generated rules do not execute it in v1.150. |
| `APPLY_VELOCITY` rule primitive | Gameplay action schema | `supported` | Uses the existing typed Velocity component shape; rule execution remains deferred. |
| `CHANGE_NUMERIC_STATE` | Gameplay action schema | `deferred` | No generic score/XP/game-state store exists. |
| `SET_ENTITY_PROPERTY` | Gameplay action schema | `deferred` | No generic gameplay property executor exists. |
| `DAMAGE_ENTITY` | Gameplay action schema | `deferred` | No health/damage resolver exists. |
| `COMPLETE_GOAL` | Gameplay action schema | `deferred` | No goal state or completion executor exists. |
| Contact direction condition | Gameplay condition schema | `deferred` | `CONTACT_DIRECTION_EQUALS` is representable for future rules, but S15-002 contact facts do not emit direction. |
| Trigger matching / condition evaluation / action execution | Gameplay rule execution | `unsupported` | Explicit S15-003 boundary: rules are planning data only; no Runtime rule engine, eval, scripts, or generated code. |
| Platformer loop | `GameLoopSpecification` + defaults | `partially supported` | Move/jump/physics and raw event observation execute; goal, collection, enemy resolution, and death remain deferred. |
| Farm interaction | Mechanics and interaction intent | `deferred` | Farm entities are semantically modeled; no production interaction executor exists. |
| Collection / collectibles | Mechanics, optional goals/targets | `deferred` | No collect system, inventory mutation, or reward resolver exists. |
| Damage / health | Failure/combat intent only | `deferred` | No gameplay damage or health-resolution system is wired. |
| Enemy spawn | Spawn rule intent | `deferred` | Spawn rules are descriptive; no gameplay spawner executes them. |
| Enemy chase / AI | Combat/movement intent | `deferred` | Enemy entities may exist semantically; no enemy controller is wired. |
| Enemy stomp / defeat | Combat intent | `deferred` | Candidate claims are corrected to deferred by the capability boundary. |
| Goals / checkpoints / win | Goal intent and semantic entities | `deferred` | Goal references can be validated; no goal completion or win state executes. |
| Player death / failure | Failure-condition intent | `deferred` | Failure conditions are recorded; no death/reset rule engine exists. |
| Timer / survive duration | Loop and goal intent | `deferred` | Duration is descriptive; no gameplay timer or expiry system exists. |
| Experience / levels | Progression intent | `deferred` | Progression modes are recorded; no XP, level, or upgrade state executes. |
| Waves / escalating pressure | Progression/spawn intent | `deferred` | Survivor defaults describe waves/pressure without a wave executor. |
| Runtime gameplay rule engine | Not modeled by design | `unsupported` | Explicitly outside S15-002; no triggers, conditions, actions, eval, or generated code. |

## Audit classification

- **RUNTIME IMPLEMENTED:** movement, jump, gravity, vertical motion, basic
  ground collision, targeted entity add/remove mutation, and bounded normalized
  event observation for jump, landing, contact-start, add, and remove facts.
- **RULE DESCRIPTION IMPLEMENTED:** immutable Trigger/Condition/Action rules,
  deterministic RuleSet mapping, candidate validation, selector validation, and
  capability-derived support status. These are not Runtime effects.
- **SEMANTICALLY MODELED:** platformer/farm/survival entities, goals,
  checkpoints, enemies, resources, and the new gameplay specification sections.
- **HARDCODED SLICE:** the production Studio viewport still registers the
  platformer movement/jump/physics systems directly; this is represented as a
  catalog fact, not generalized into unsupported mechanics.
- **NOT EXECUTED:** trigger matching, condition evaluation, collection results,
  damage, enemy AI, timers, spawn execution, progression, failure, completion,
  and win/lose rules.

The catalog is deliberately small. It is a truthful capability boundary, not
a plugin registry or a promise that a provider-generated mechanic is runnable.
