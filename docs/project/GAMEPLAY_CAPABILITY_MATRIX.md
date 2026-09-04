# Gameplay Capability Matrix — Sprint 41 WO Complete / Freeze Review Pending

Architecture version: v1.191 (Sprint 30 through Sprint 40 FROZEN;
`WO-S33-001` and `WO-S34-001` Code Complete = YES; Product Verified = YES;
Sprint 34 post-WO Gap Analysis PASS; `WO-S35-001` Code Complete = YES;
Product Verified = YES; fresh Sprint 35 Gap Analysis PASS;
`WO-S36-001` Code Complete = YES; Product Verified = YES; fresh Sprint 36 Gap
Analysis PASS; Sprint 36 FROZEN; `WO-S37-001` Code Complete = YES;
Product Verified = YES; fresh Sprint 37 Gap Analysis PASS; Sprint 37 FROZEN;
`WO-S38-001` Code Complete = YES; Product Verified = YES; fresh Sprint 38
Gap Analysis PASS; Sprint 38 FROZEN; `WO-S39-001` Code Complete = YES;
Product Verified = YES; fresh Sprint 39 Gap Analysis PASS; v1.189; Sprint 39
FROZEN; `WO-S40-001` Code Complete = YES; Product Verified = YES; fresh
  Sprint 40 Gap Analysis PASS; Sprint 40 FROZEN at v1.190; `WO-S41-001` Code
  Complete = YES; Product Verified = YES; fresh Sprint 41 Gap Analysis PASS;
  `SPRINT41_FREEZE_REVIEW` pending)

Sprint 32 implemented the smallest measured generic Player-directed offense
capability. Survival now exposes a top-down `Space` edge that selects one
nearby current Runtime Enemy and emits an attack fact consumed by the existing
trusted damage rule path. No weapon, projectile, timer, cooldown, or
genre-specific combat system is implied. Sprint 33 adds only a supported
presentation projection from committed Runtime results to a transient generic
Game feedback layer; it does not add a gameplay capability or second authority.

This matrix records the boundary between gameplay intent and executable
Runtime behavior. `supported` means the production path already executes the
capability; `deferred` means the domain can describe it but Runtime does not
execute it; `unsupported` is reserved for a capability outside the current
catalog. The rule execution status is active only for the bounded supported
rules, including the two-action `ENEMY STOMP`, generic Health damage, the
current-session `COMPLETE_GOAL` slice, finite additive numeric progression,
and one removal-triggered `SPAWN_ENTITY` slice; partial/deferred/unsupported
rules remain gated as whole rules. A Studio-only slice is not promoted to a
general Runtime capability.

Sprint 34 promotes one bounded capability into this matrix:
`WO-S34-001 — Generic Runtime Replacement Fair-Start Policy` is a supported
spatial policy on the existing generic `SPAWN_ENTITY` path. It preserves
Runtime authority and is not a WaveManager, timer, wave, or Survival-specific
system.

Sprint 35 promotes one bounded progression-conditioned capability selection at
the existing Gameplay Rule builder seam. Committed Level 1 selects a 25-damage
Survival offense action and committed Level 2 or above selects a 50-damage
action through mutually exclusive generic `NUMBER_COMPARE(gameState.level)`
conditions. This is not a progression modifier, stat system, scaling curve, or
new Runtime authority.

Sprint 36 promotes one bounded front-door classification capability without
adding a Runtime capability: `WO-S36-001` routes generic active-world
whole-world/game construction and named-world requests to the existing
CreateWorld replacement contract, after current-world mutation precedence.
Explicit-new behavior, AI candidate validation, ambiguous non-replacement,
and Runtime authority remain unchanged. The capability catalog still records
Runtime semantics separately from this Intent/Web boundary.

Sprint 37 adds no gameplay capability. It closes one semantic reachability gap
at the existing typed-intent boundary: the immutable supported-archetype alias
table now preserves `农场 → farm` for `做一个农场游戏`. The existing semantic
catalog still contains `farm`, `platformer`, `rpg`, `survival`, and `sandbox`;
deterministic/provider-failure fallback now reaches the existing eight-entity
Farm composition instead of Sandbox. No Farm mechanics are added.

Sprint 38 promotes one bounded generic Player-directed interaction capability
at the existing input → Runtime event → GameplayRule → authoritative World
boundary. `WO-S38-001 — Generic Player-Directed Entity Interaction
Reachability` uses `Enter` only in the Farm/RPG Studio compositions, selects
one nearest finite-range target with stable Runtime-ID tie-breaking, and emits
`ENTITY_INTERACTION_REQUESTED`. Farm targets one `npc`; RPG targets one
`quest`. The existing trusted `SET_ENTITY_PROPERTY` action commits a bounded
`gameplay-state.activated` mutation and the Renderer presents only that
committed result. No Farm/RPG system or genre parity is implied. Farm and RPG
normal-play Product Verification is PASS; the Provider-accepted Farm
  5-entity candidate versus the deterministic 8-entity baseline is recorded as
  a separate composition-completeness observation.

Sprint 39 promotes one bounded archetype-specific consequence at the same
generic property-action seam. `WO-S39-001` keeps Enter, finite range `48`,
nearest/stable-ID targeting, `ENTITY_INTERACTION_REQUESTED`, Runtime
authority, and no-op truth unchanged. Farm targets eligible field-like
`terrain` and commits `activated=true` plus `harvested=true`; RPG targets
`quest` and commits `activated=true` plus `questAccepted=true`. Renderer
feedback derives `Harvested` / `Quest accepted` only from committed
mutations. This does not add a Farm/RPG engine, resource/inventory/economy
loop, dialogue/quest framework, or generic interaction-outcome framework.

Sprint 40 promotes one bounded generic state-conditioned continuation at the
existing event → GameplayRule → Runtime property boundary. `BOOLEAN_EQUALS`
now evaluates typed boolean entity properties from the current Runtime World.
Farm composes `wheat-field.harvested=true` → later `harvest-quest` interaction
→ `questCompleted=true`; RPG composes `quest-giver.questAccepted=true` → later
`main-quest` interaction → `questCompleted=true`. Each is a separate Player
interaction moment, and repeated completion is a truthful no-op. No workflow
engine, domain Runtime, inventory/resources system, or open-ended progression
framework is implied. The fresh Gap Analysis is PASS and Sprint 40 is FROZEN
at v1.190.

Sprint 41 promotes one bounded provider-unavailable semantic-delta capability
at the existing World Evolution candidate boundary. In a current Farm world,
clear field aliases produce the normal validated `add-entity` delta for
`Wheat Field`; in a current RPG world, clear quest aliases produce the normal
validated delta for `Quest`. Farm's evolved field is gameplay-capable and
commits `harvested=true`. The evolved RPG quest is semantic/Runtime-present
and Enter-reachable, but its exact `Quest Giver` consequence Rule does not
match, so that downstream capability remains deferred. No direct Runtime
insertion, Provider runtime call, or new gameplay framework is implied.

| Concept | Domain / semantic status | Runtime capability status | Evidence / treatment |
| --- | --- | --- | --- |
| Player movement | `GameplaySpecification.mechanics` | `supported` | `DefaultPlayerControllerSystem` is registered in the production Studio viewport. |
| Player jump | `GameplaySpecification.mechanics` | `supported` | `DefaultJumpSystem` applies the existing grounded jump behavior. |
| Gravity | `GameplaySpecification.mechanics` | `supported` | `DefaultGravitySystem` and vertical motion are wired in the playable slice. |
| Vertical motion | Runtime primitive | `supported` | `DefaultVerticalMotionSystem` updates position from velocity. |
| Basic ground collision | `GameplaySpecification.mechanics` | `supported` | `DefaultGroundCollisionSystem` clamps the playable ground plane. |
| Bounded Platform surface | Semantic `Platform` → Runtime collision bounds | `supported` | Semantic Platform geometry resolves downward Player feet onto the top, retains support in bounds, and releases support at an edge. Generated images remain visual skin. |
| Entity add/remove | Semantic evolution model | `supported` | Existing semantic-to-Runtime synchronization can add/remove non-player entities. |
| Provider-unavailable archetype-native World Evolution add | Current semantic archetype + bounded supported-role alias | `supported` (bounded) | `WO-S41-001` keeps clear Farm field and RPG quest additions on the validated semantic-delta path after structured Provider failure; same-world identity and retained Runtime state are preserved. |
| Evolved RPG quest characteristic consequence | Evolved semantic quest → current RPG GameplayRule | `deferred` | `quest-1` emits `ENTITY_INTERACTION_REQUESTED`, but the existing rule is bound to exact `Quest Giver`; no `questAccepted=true` is committed for the new `Quest`. |
| Targeted Gameplay Rule reconciliation | Semantic World Evolution + current `GameplayRuleSet` | `supported` | `DefaultGameplayRuleReconciler` preserves unaffected rules, revalidates/rebuilds affected known rules, removes dangling rules, binds the updated semantic revision, and records immutable reconciliation facts without Provider regeneration. |
| Gameplay event observation | Runtime event domain | `supported` | Runtime emits bounded immutable gameplay facts through `ExecutionTickResult.gameplayEvents`; this is not rule execution. |
| Accepted jump event | Runtime event observation | `supported` | `DefaultJumpSystem` emits one `ENTITY_JUMPED` only after a grounded jump is accepted. |
| Landing transition event | Runtime event observation | `supported` | `DefaultGroundCollisionSystem` emits one `ENTITY_LANDED` on airborne → ground transition. |
| Entity mutation events | Runtime event observation | `supported` | `RuntimeWorldStore` emits `ENTITY_ADDED`/`ENTITY_REMOVED` after committed ID-set changes. |
| Entity contact-start event | Runtime event observation | `supported` | Explicit Runtime `collision-bounds` AABBs produce de-duplicated `ENTITY_CONTACT_STARTED` facts with typed direction derived from Runtime geometry; the supported contact-danger rule may consume the fact after the event boundary. |
| Entity attack-request event | Runtime event observation | `supported` | The top-down generic `PlayerAttackRequestSystem` emits one `ENTITY_ATTACK_REQUESTED` fact per accepted `Space` key edge after deterministic current Runtime target selection. |
| Entity interaction-request event | Runtime event observation | `supported` | The generic `PlayerInteractionRequestSystem` emits one `ENTITY_INTERACTION_REQUESTED` fact per accepted `Enter` edge after explicit category allowlisting, finite-range Position targeting, nearest selection, and stable Runtime-ID tie-breaking. |
| Runtime gameplay outcome feedback | Committed Runtime result → Renderer presentation | `supported` | `HEALTH_UPDATED` projects to an ID-bound hit cue, lethal `ENTITY_REMOVED` with Health zero to a defeat cue, `ENTITY_ADDED` to a replacement cue, and committed `ENTITY_PROPERTY_UPDATED(activated/harvested/questAccepted)` to a generic or labeled interaction cue (`Harvested` / `Quest accepted`); uncommitted/no-op/contact-only facts produce no positive interaction cue. |
| Active-world whole-world Intent classification | Studio command → IntentRouter/Web front door | `supported` | `WO-S36-001` is complete at v1.186: current-world entity/property/continuation mutations retain World Evolution, while clear whole-world/game construction, named-world, and explicit new/reset requests use the existing CreateWorld replacement contract even with an active world. Bare creation remains ambiguous and non-replacing; no genre registry or second router exists. |
| Supported CreateWorld archetype intent preservation | `GameIntent` extraction → provider/fallback semantic world | `supported` | `WO-S37-001` is complete at v1.187: the existing ordered alias boundary preserves `farm` for both English `farm` and Chinese `农场`, while Platformer, Survival, RPG, and Sandbox fallback remain bounded. |
| Gameplay rule description | `GameplayRuleSpecification` + `GameplayRuleSet` | `supported` | Shared immutable Trigger/Condition/Action data is validated and stored beside `GameplaySpecification`; supported rules can enter the bounded Runtime executor. |
| Rule event vocabulary | Rule trigger | `supported` | `ENTITY_CONTACT_STARTED`, `ENTITY_ATTACK_REQUESTED`, `ENTITY_INTERACTION_REQUESTED`, `ENTITY_JUMPED`, `ENTITY_LANDED`, `ENTITY_ADDED`, and `ENTITY_REMOVED` are allowed. |
| Rule entity selectors | Rule condition/target references | `supported` | Event actor/target, exact current ID, category, current semantic name/archetype, and category-backed role selectors are normalized by Genesis. |
| `REMOVE_ENTITY` rule primitive | Gameplay action schema | `supported` | The bounded executor resolves a current target, protects Player, and calls the immutable `WorldMutator`. |
| `SPAWN_ENTITY` rule primitive | Gameplay action schema | `supported` | Trusted executor resolves an existing semantic template, composes one Runtime entity, and commits immutable `WorldMutator.addEntity()`; no Semantic World rebuild or provider call occurs. |
| `APPLY_VELOCITY` rule primitive | Gameplay action schema | `supported` | Generic trusted action reuses `VelocityComponent` and immutable `WorldMutator.replaceEntity`; set/add modes are bounded and deterministic. |
| `CHANGE_NUMERIC_STATE` | Gameplay action schema | `supported` | Runtime owns an immutable keyed finite-number map and commits deterministic additive deltas through the existing GameplayRuleExecutor; the lifecycle baseline is `experience=0, level=1`, with `experience` and `level` as the bounded Sprint 16 use case. |
| `BOOLEAN_EQUALS` condition | Gameplay condition schema | `supported` | `WO-S40-001` evaluates typed boolean event/entity-property references against `true` or `false`; current Runtime entity state is read for a later Rule gate, while unsupported reference shapes fail closed. |
| `SET_ENTITY_PROPERTY` | Gameplay action schema | `supported` | Trusted Runtime execution sets the bounded `activated`, `enabled`, `visible`, `harvested`, `questAccepted`, or `questCompleted` property in an immutable `gameplay-state` component and emits `ENTITY_PROPERTY_UPDATED`; equal values are truthful no-ops. |
| `DAMAGE_ENTITY` | Gameplay action schema | `supported` | Trusted generic action validates positive finite damage, resolves current Health, uses immutable `WorldMutator.replaceEntity`, and commits Runtime session `failed` when a player reaches zero. Failed execution pauses later gameplay rules until explicit same-world respawn. |
| Player-directed short-range offense | Generic top-down Runtime input + Gameplay Rule composition | `supported` | One `Space` edge selects one positive-Health Enemy within finite range `48` by nearest distance and stable ID tie-break, emits `ENTITY_ATTACK_REQUESTED`, and applies trusted `DAMAGE_ENTITY`; Level 1 commits 25 damage, while Level 2+ commits 50 through mutually exclusive `NUMBER_COMPARE(gameState.level)` Rule variants. The existing defeat/XP/fair-start/replacement path remains active. |
| Enemy contact danger | Survival composition over generic rule primitives | `supported` | `ENTITY_CONTACT_STARTED` remains a separate Enemy→Player contact rule that applies 1 damage to Player Health; it is no longer the Player's automatic Enemy-offense path. |
| `COMPLETE_GOAL` | Gameplay action schema | `supported` | Trusted goal-contact rules commit `RuntimeGameplaySessionState` from `active` to `completed`; repeated completion is an idempotent no-op and failed sessions cannot complete before respawn. |
| Contact direction condition | Gameplay condition schema | `supported` | `ENTITY_CONTACT_STARTED.direction` is required and derived from Runtime-owned AABB crossing/overlap geometry; evaluator supports top/non-top and narrow negation. |
| `NUMBER_COMPARE` condition | Gameplay condition schema | `supported` | Runtime evaluates finite typed event-payload, entity-property, and Runtime `gameState` references with `eq/neq/gt/gte/lt/lte`; no expression language or arbitrary evaluation is introduced. The Sprint 40 boolean gate is a separate typed comparator. |
| Trigger matching / condition evaluation / action execution | Gameplay rule execution | `partially supported` | `DefaultGameplayRuleMatcher`, `DefaultGameplayConditionEvaluator`, and trusted generic actions run after the event batch; the two-action stomp uses staged all-or-nothing commit; no eval, scripts, generated code, or generic workflow engine exists. |
| Platformer loop | `GameLoopSpecification` + defaults | `partially supported` | Move/jump/physics, contact facts, collectible removal, collect-reward `experience +1`, enemy stomp, non-top Health damage, Runtime failure/respawn, and current-session goal completion execute; score and game-over remain deferred. |
| Farm interaction | Mechanics and interaction intent | `supported` | `WO-S39-001` exposes `Enter — Interact`, selects one nearby eligible field-like `terrain`, and commits `activated=true, harvested=true`; `WO-S40-001` adds a later `harvest-quest` target gated by `wheat-field.harvested=true` and commits `questCompleted=true`. Crop lifecycle, resources, inventory, and economy remain deferred. |
| RPG interaction | Mechanics and interaction intent | `supported` | `WO-S39-001` exposes the same `Enter — Interact` path, selects one nearby `quest`, and commits `activated=true, questAccepted=true`; `WO-S40-001` adds a later `main-quest` target gated by `quest-giver.questAccepted=true` and commits `questCompleted=true`. Dialogue, quest progression beyond this bounded state, combat, and stats remain deferred. |
| Collection / collectibles | Mechanics, optional goals/targets | `partially supported` | A player contact with semantic category `item` can remove the target and the bounded collect-reward rule can add `experience`; inventory, score, and `ITEM_COLLECTED` remain absent. |
| Damage / health | Combat and failure intent | `partially supported` | Player/enemy/npc Health is a generic Runtime component and non-top contact can decrease current Health; lethal player damage commits Runtime `failed`, and same-world respawn restores Health/active play. |
| Enemy spawn | Spawn rule intent | `supported` | Bounded `ENTITY_REMOVED` with authoritative `health <= 0` triggers one generic Runtime replacement Enemy in the active Survival session; periodic waves/count/timer semantics remain deferred. |
| Runtime replacement fair-start placement | Spawn-start spatial policy over Runtime Position/collision/identity | `supported` | Survival Enemy replacements resolve the current Runtime Player at spawn time, search deterministic bounded candidates with default minimum distance `96`, reject occupied/non-finite/AABB-overlapping positions, and fail closed when no fair position exists; initial/evolution/non-Survival creation remains unchanged. |
| Enemy target-directed movement | Survival semantic composition → generic Runtime target component | `supported` | `DefaultTargetDirectedMovementSystem` resolves the explicit target entity's current Position and writes finite normalized Velocity; `DefaultVelocityMotionSystem` integrates Position. Composition is enabled only for Survival enemies, while the Runtime systems remain generic. |
| Enemy chase / AI | Combat/movement intent | `partially supported` | Direct target-directed pursuit is production-reachable through the generic component/system; behavior trees, pathfinding, steering, and model-driven frame decisions remain deferred. |
| Enemy stomp / defeat | Combat intent | `supported` | Generic `enemy-stomp` rule validates player/enemy/top, removes the target, and applies upward player velocity with rule-level all-or-nothing commit. |
| Goals / checkpoints / win | Goal intent and semantic entities | `partially supported` | Player contact with the validated goal commits Runtime session `completed`; Studio projects that committed state as a Victory overlay. No next level, restart, deletion, or progression flow exists. |
| Player death / failure | Failure-condition intent | `partially supported` | Trusted lethal player damage commits Runtime `failed`; Studio projects it as a Game Over overlay and exposes only the existing Runtime respawn. No lives/checkpoints or generic reset framework exists. |
| Timer / survive duration | Loop and goal intent | `deferred` | Duration is descriptive; no gameplay timer or expiry system exists. |
| Experience / levels | Progression intent | `partially supported` | Supported collect-reward or explicit Survival Enemy defeat adds `experience +1`; a typed `experience >= 1 AND level < 2` rule commits exactly one Level 1 → Level 2 transition. The committed Level 2 now selects the bounded 50-damage Survival offense variant; skill/upgrade state and later thresholds remain deferred. |
| Progression-conditioned gameplay capability selection | Runtime progression state → existing Gameplay Rule action variants | `supported` | `WO-S35-001` is complete at v1.185: current Runtime progression is read at attack evaluation time; mutually exclusive `level < 2` / `level >= 2` conditions select fixed `DAMAGE_ENTITY` values 25 / 50. No modifier/stat framework or additional threshold is implied. |
| Waves / escalating pressure | Progression/spawn intent | `deferred` | Survivor defaults describe waves/pressure without a wave executor. |
| Runtime gameplay rule engine | Bounded S15-007 execution seam | `partially supported` | Current supported rules execute after finalized Runtime events; ENEMY STOMP, generic DAMAGE_ENTITY, current-session COMPLETE_GOAL, finite CHANGE_NUMERIC_STATE, typed BOOLEAN_EQUALS, bounded SET_ENTITY_PROPERTY, and one removal-triggered SPAWN_ENTITY slice are bounded, with staged all-or-nothing semantics for multi-action rules. This is not a generic manager, workflow engine, transaction framework, or arbitrary-code runtime. |

## Audit classification

- **RUNTIME IMPLEMENTED:** movement, jump, gravity, vertical motion, basic
  ground collision, generic Health state, targeted entity add/remove and
  Health mutation, lethal player failure/same-world respawn, current-session
  completion state, immutable keyed finite
  numeric progression state with additive deltas, bounded normalized event
  observation for jump, landing, contact-start, attack-request, add, and remove
  facts, deterministic generic Player-directed short-range target selection,
  deterministic generic Player-directed interaction target selection, bounded
  Runtime entity property state, and one trusted generic Runtime
  entity-creation action with reusable composition.
- **RULE DESCRIPTION IMPLEMENTED:** immutable Trigger/Condition/Action rules,
  deterministic RuleSet mapping, candidate validation, selector validation, and
  capability-derived support status.
- **RULE EXECUTION IMPLEMENTED:** bounded post-system matching, category/
  archetype/ID/component/direction evaluation, generic `REMOVE_ENTITY`,
  `APPLY_VELOCITY`, `DAMAGE_ENTITY`, `SET_ENTITY_PROPERTY`, `COMPLETE_GOAL`,
  finite additive `CHANGE_NUMERIC_STATE`, and bounded removal-triggered
  `SPAWN_ENTITY` actions,
  current-world/semantic binding, Player
  protection, exactly-once consumption, and next-boundary mutation observation.
  Multi-action rules stage immutable worlds and commit only when all actions
  succeed; numeric state is committed separately from World mutation.
- **SEMANTICALLY MODELED:** platformer/farm/survival entities, goals,
  checkpoints, enemies, resources, and the new gameplay specification sections.
- **HARDCODED SLICE:** the production Studio viewport still registers the
  platformer movement/jump/physics systems directly; this is represented as a
  catalog fact, not generalized into unsupported mechanics.
- **NOT EXECUTED:** skill/modifier state, score policy, lives,
  checkpoints, enemy AI,
  timers, periodic/wave spawn execution, progression beyond the bounded numeric primitive,
  failure flow beyond the bounded player failure/respawn slice,
  unrelated rich multi-action transactions, next-level/restart
  behavior, and win/lose orchestration beyond current session-completed truth.

The catalog is deliberately small. It is a truthful capability boundary, not
a plugin registry or a promise that a provider-generated mechanic is runnable.

Sprint 17 is frozen at v1.160 with the complete mechanically coherent
platformer lifecycle Product Verified. Sprint 18 is frozen at v1.164: asset
render usage travels through request/context/manifest; semantic Platform
selection is provider-verified; and Ground repeats across Runtime-authoritative
coverage. Sprint 19 is frozen at v1.167 with Runtime-reachable Player
idle/run/jump/facing and two-frame temporal run presentation Product Verified.
This remains a bounded presentation capability, not a generic gameplay
animation system.

Sprint 34 is FROZEN at v1.184. `WO-S34-001` is a supported generic Runtime
spatial fair-start placement policy only: Runtime committed outcomes and
composition stay authoritative, and no new combat/feedback manager, gameplay
timer, world-bounds authority, or wave system exists. Sprint 35
`WO-S35-001` is FROZEN at v1.185 with a PASS fresh Gap Analysis. Sprint 36
`WO-S36-001` is FROZEN at v1.186 with a PASS fresh Gap Analysis. `WO-S37-001`
is FROZEN at v1.187 with Code Complete/Product Verified = YES and a PASS fresh
Gap Analysis; it adds semantic reachability only, no gameplay capability.
  `WO-S38-001` adds the bounded generic Player-directed interaction capability at
  v1.188. Code Complete and Product Verified are YES; the fresh Sprint 38 Gap
  Analysis is PASS and Sprint 38 is FROZEN. Real Studio Farm and RPG input edges
  committed the expected target-specific Runtime outcomes, and repeated
  interactions were truthful no-ops. The Provider-accepted Farm verification
  candidate had 5 entities while the deterministic 8-entity baseline remains
  covered; this is a separate Provider composition completeness observation, not
  a blocker for the WO.

Sprint 39 `WO-S39-001` advances the same capability to v1.189: Farm commits
`harvested=true` on eligible terrain and RPG commits `questAccepted=true` on
quest targets, with committed labeled feedback. Code Complete and Product
Verified are YES and the fresh Sprint 39 Gap Analysis is PASS. The Provider
5-vs-8 composition variance and inherited Farm/RPG side-view/Space-jump
behavior remain separate observations. Sprint 39 is FROZEN at v1.189 by
Human/CTO decision. Sprint 40 `WO-S40-001` advances the matrix to v1.190 with
one bounded typed boolean state gate and the Farm/RPG two-step proof. Fresh
Gap Analysis is PASS; Sprint 40 is FROZEN at v1.190. Sprint 41 `WO-S41-001`
advances the matrix to v1.191 with bounded provider-error recovery for current
archetype Farm field and RPG quest additions. Fresh Sprint 41 Gap Analysis is
PASS for that first divergence; the newly measurable RPG evolved-quest
Rule-binding gap is deferred for Human/CTO review and no second WO is
generated automatically.
