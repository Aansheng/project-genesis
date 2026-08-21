# Gameplay Capability Matrix — WO-S15-002

Architecture version: v1.149

This matrix records the boundary between gameplay intent and executable
Runtime behavior. `supported` means the production path already executes the
capability; `deferred` means the domain can describe it but Runtime does not
execute it; `unsupported` is reserved for a capability outside the current
catalog. A Studio-only slice is not promoted to a general Runtime capability.

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
- **SEMANTICALLY MODELED:** platformer/farm/survival entities, goals,
  checkpoints, enemies, resources, and the new gameplay specification sections.
- **HARDCODED SLICE:** the production Studio viewport still registers the
  platformer movement/jump/physics systems directly; this is represented as a
  catalog fact, not generalized into unsupported mechanics.
- **NOT MODELED / NOT EXECUTED:** collection results, damage, enemy AI, timers,
  spawn execution, progression, failure, completion, and win/lose rules.

The catalog is deliberately small. It is a truthful capability boundary, not
a plugin registry or a promise that a provider-generated mechanic is runnable.
