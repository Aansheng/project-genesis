# Gameplay Capability Matrix — WO-S16-001

Architecture version: v1.155

This matrix records the boundary between gameplay intent and executable
Runtime behavior. `supported` means the production path already executes the
capability; `deferred` means the domain can describe it but Runtime does not
execute it; `unsupported` is reserved for a capability outside the current
catalog. The rule execution status is active only for the bounded supported
rules, including the two-action `ENEMY STOMP`, generic Health damage, and the
current-session `COMPLETE_GOAL` slice; partial/deferred/unsupported rules
remain gated as whole rules. A Studio-only slice is not promoted to a general
Runtime capability.

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
| `CHANGE_NUMERIC_STATE` | Gameplay action schema | `deferred` | No generic score/XP/game-state store exists. |
| `SET_ENTITY_PROPERTY` | Gameplay action schema | `deferred` | No generic gameplay property executor exists. |
| `DAMAGE_ENTITY` | Gameplay action schema | `supported` | Trusted generic action validates positive finite damage, resolves current Health, and uses immutable `WorldMutator.replaceEntity`; zero is state only. |
| `COMPLETE_GOAL` | Gameplay action schema | `supported` | Trusted goal-contact rules commit `RuntimeGameplaySessionState` from `active` to `completed`; repeated completion is an idempotent no-op. |
| Contact direction condition | Gameplay condition schema | `supported` | `ENTITY_CONTACT_STARTED.direction` is required and derived from Runtime-owned AABB crossing/overlap geometry; evaluator supports top/non-top and narrow negation. |
| Trigger matching / condition evaluation / action execution | Gameplay rule execution | `partially supported` | `DefaultGameplayRuleMatcher`, `DefaultGameplayConditionEvaluator`, and trusted generic actions run after the event batch; the two-action stomp uses staged all-or-nothing commit; no eval, scripts, generated code, or generic workflow engine exists. |
| Platformer loop | `GameLoopSpecification` + defaults | `partially supported` | Move/jump/physics, contact facts, collectible removal, enemy stomp, non-top Health damage, and current-session goal completion execute; score and death remain deferred. |
| Farm interaction | Mechanics and interaction intent | `deferred` | Farm entities are semantically modeled; no production interaction executor exists. |
| Collection / collectibles | Mechanics, optional goals/targets | `partially supported` | A player contact with semantic category `item` can remove the target; inventory, score, numeric reward, and `ITEM_COLLECTED` remain absent. |
| Damage / health | Combat and failure intent | `partially supported` | Player/enemy/npc Health is a generic Runtime component and non-top contact can decrease current Health; zero is not yet a death or failure flow. |
| Enemy spawn | Spawn rule intent | `deferred` | Spawn rules are descriptive; no gameplay spawner executes them. |
| Enemy chase / AI | Combat/movement intent | `deferred` | Enemy entities may exist semantically; no enemy controller is wired. |
| Enemy stomp / defeat | Combat intent | `supported` | Generic `enemy-stomp` rule validates player/enemy/top, removes the target, and applies upward player velocity with rule-level all-or-nothing commit. |
| Goals / checkpoints / win | Goal intent and semantic entities | `partially supported` | Player contact with the validated goal can commit the Runtime session to `completed`; no victory UI, next level, restart, deletion, or progression flow exists. |
| Player death / failure | Failure-condition intent | `deferred` | Failure conditions are recorded; no death/reset rule engine exists. |
| Timer / survive duration | Loop and goal intent | `deferred` | Duration is descriptive; no gameplay timer or expiry system exists. |
| Experience / levels | Progression intent | `deferred` | Progression modes are recorded; no XP, level, or upgrade state executes. |
| Waves / escalating pressure | Progression/spawn intent | `deferred` | Survivor defaults describe waves/pressure without a wave executor. |
| Runtime gameplay rule engine | Bounded S15-007 execution seam | `partially supported` | Current supported rules execute after finalized Runtime events; ENEMY STOMP, generic DAMAGE_ENTITY, and current-session COMPLETE_GOAL are bounded slices, with staged all-or-nothing semantics for the two-action stomp. This is not a generic manager, workflow engine, transaction framework, or arbitrary-code runtime. |

## Audit classification

- **RUNTIME IMPLEMENTED:** movement, jump, gravity, vertical motion, basic
  ground collision, generic Health state, targeted entity add/remove and
  Health mutation, current-session completion state, and bounded normalized
  event observation for jump, landing, contact-start, add, and remove facts.
- **RULE DESCRIPTION IMPLEMENTED:** immutable Trigger/Condition/Action rules,
  deterministic RuleSet mapping, candidate validation, selector validation, and
  capability-derived support status.
- **RULE EXECUTION IMPLEMENTED:** bounded post-system matching, category/
  archetype/ID/component/direction evaluation, generic `REMOVE_ENTITY`,
  `APPLY_VELOCITY`, `DAMAGE_ENTITY`, and `COMPLETE_GOAL` actions, current-world/semantic
  binding, Player protection, exactly-once consumption, and next-boundary
  mutation observation. The two-action stomp rule stages immutable worlds and
  commits only when all actions succeed.
- **SEMANTICALLY MODELED:** platformer/farm/survival entities, goals,
  checkpoints, enemies, resources, and the new gameplay specification sections.
- **HARDCODED SLICE:** the production Studio viewport still registers the
  platformer movement/jump/physics systems directly; this is represented as a
  catalog fact, not generalized into unsupported mechanics.
- **NOT EXECUTED:** score/numeric state, death/respawn/game-over, enemy AI,
  timers, spawn execution, progression, failure flow, property actions,
  unrelated rich multi-action transactions, victory UI, next-level/restart
  behavior, and win/lose orchestration beyond current session-completed truth.

The catalog is deliberately small. It is a truthful capability boundary, not
a plugin registry or a promise that a provider-generated mechanic is runnable.
