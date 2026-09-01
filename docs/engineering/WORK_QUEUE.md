# Project Genesis — Engineering Work Queue

Git-tracked queue for the Supervisor. It is intentionally a Markdown document,
not a database or task service.

queue_version: 1
updated: 2026-09-01
current_sprint: Sprint 35
current_work_order: WO-S35-001 — Generic Progression-Conditioned Gameplay Capability
current_work_order_status: READY — discovery complete; execution not authorized
current_control_plane_work_order: SPRINT35_PRODUCT_GAP_DISCOVERY
current_control_plane_work_order_status: DONE — exactly one READY product WO generated
last_completed_work_order: WO-S34-001 — Generic Runtime Replacement Fair-Start Policy
next_work_order: WO-S35-001 — READY; execution requires separate authorization
continuation_mode: SPRINT_CONTINUOUS
primary_architecture_changing_work_items_in_progress: 0

## SPRINT33_FREEZE_REVIEW

status: DONE — Human/CTO froze Sprint 33 at v1.183 on 2026-09-01
architecture_before: v1.182
architecture_after: v1.183
decision: Sprint 33 is FROZEN at v1.183 with Code Complete = YES and Product
  Verified = YES. The selected Game-surface outcome-feedback blocker is
  resolved; Sprint 34 Product Gap Discovery is authorized.
evidence: Final Runtime 708/708, Renderer 510/510, and Web 3573/3573 tests;
  affected TypeScript checks; package ESLint with zero errors; Web build;
  `git diff --check`; real Studio hit/defeat/replacement/post-replacement hit
  cues; Full Observatory world/session/event/metadata truth; Platformer
  regression; empty browser diagnostics.
constraints: Review only the bounded Runtime-result → Renderer projection.
  Do not add Sprint 34 work, weapons, projectiles, timers, waves, scaling,
  progression redesign, or a new gameplay authority.
next_gate: `SPRINT34_PRODUCT_GAP_DISCOVERY` — authorized; discovery complete
  and exactly one READY WO is now recorded below.

## WO-S33-001 — Generic Runtime Gameplay Outcome Feedback

status: DONE — Code Complete = YES; Product Verified = YES
priority: P0 / Sprint 33 authorized
architecture_before: v1.182
architecture_after: v1.183
allowed_scope: Pure committed Runtime result → Game presentation mapping,
  dedicated Pixi feedback layer, Web lifecycle clearing, focused tests, and
  current-state/control-plane documentation.
forbidden_scope: New Runtime damage/target/Health/defeat/replacement/XP/Level
  authority; timers/cooldowns/weapons/projectiles/waves; provider/image calls;
  broad HUD or animation framework; Platformer behavior changes; Sprint 34.
real_flow: `HEALTH_UPDATED` committed result → hit cue; lethal
  `ENTITY_REMOVED` with authoritative Health zero → defeat cue at pre-removal
  Position; committed `ENTITY_ADDED` → replacement cue. The visualization loop
  publishes after the new WorldStore state and before existing observers.
result: Runtime, Renderer, and Web production paths consume existing
  committed results only. No-target distance 49 produces no cue; ordinary
  removal and contact-only damage are not Player-attack feedback. Feedback is
  transient Renderer presentation time and is ID-bound, not asset-bound.
next_gate: Sprint 33 freeze review DONE; Sprint 34 Product Gap Discovery is
  complete and `WO-S34-001` is the only READY item.

## SPRINT34_AUTHORIZATION — Survival Playability Gap Discovery

status: DONE — Human/CTO decision 2026-09-01; WO-S34-001 complete at v1.184
architecture_at_authorization: v1.183
current_architecture: v1.184
goal: Play the generated Survival product normally, rank exactly one largest
  remaining user-visible blocker, generate exactly one READY WO, and stop.
discovery_policy: Use the exact request `生成一个幸存者游戏` and multiple
  cycles covering movement/evasion, pursuit, Space attacks, hits, defeats,
  XP/Level, replacements, and replacement combat. Do not preselect a feature;
  execution of only `WO-S34-001` was authorized; do not enter Sprint 35.
constraints: Preserve the accepted Sprint 33 outcome-feedback behavior and
  all Runtime/Renderer authority boundaries. No product code, architecture,
  new capability, second WO, provider/image call, or Sprint 35 work was
  authorized in discovery.

## SPRINT34_PRODUCT_GAP_DISCOVERY

status: DONE — one measured blocker selected; exactly one READY WO generated
evidence: Fresh real Studio play of `生成一个幸存者游戏` completed two
  defeat/replacement cycles in active `world-1`. XP advanced `0 → 1 → 2`,
  Level advanced `1 → 2` once and remained 2; replacement pressure resumed
  quickly and was observed co-located after brief movement. Existing Sprint
  33 hit/defeat/replacement/no-target feedback remains PASS.
selected_bottleneck: RUNTIME REPLACEMENT PRESSURE LACKS FAIR PACING
ranking: Replacement pressure is most visible on the normal Game surface,
  recurs after every defeat, impacts short-session agency/rhythm, and has a
  smaller generic boundary than progression consequence. Secondary wording:
  LEVEL PROGRESSION HAS NO GAMEPLAY CONSEQUENCE. Combat remains deterministic
  at range 48 with 25 damage per hit; no projectile is selected.
root_cause: The existing `ENTITY_REMOVED (health <= 0) → SPAWN_ENTITY` path
  composes the replacement and calls `findSafeRuntimeEntityPosition`, which is
  deterministic/category-based but does not guarantee player-relative
  minimum-distance or non-overlap placement. Target-directed movement then
  resumes immediately.
selected_work_order: WO-S34-001 — Generic Runtime Replacement Fair-Start Policy
next_gate: WO execution complete; fresh post-WO Gap Analysis PASS; proceed to
  `SPRINT34_FREEZE_REVIEW` and do not enter Sprint 35.

## WO-S34-001 — Generic Runtime Replacement Fair-Start Policy

status: DONE — Code Complete = YES; Product Verified = YES
priority: P0 / selected Sprint 34 blocker
architecture_before: v1.183
architecture_after: v1.184
allowed_scope: One deterministic, generic spawn-start policy on the existing
  Runtime `SPAWN_ENTITY` replacement path that guarantees a non-overlapping,
  player-relative minimum separation (or equivalent bounded fair-start
  placement) before normal target-directed pursuit; preserve existing Enemy
  composition, target binding, contact semantics, replacement continuity, and
  Runtime authority.
acceptance: In a real generated Survival session, every lethal replacement
  begins outside the configured Player overlap/fair-start boundary, preserves
  the existing six-entity/session/replacement path, allows a readable approach
  window under current movement and pursuit, and does not alter attack range,
  damage, XP/Level, outcome feedback, or Platformer `Space` jump behavior.
forbidden_scope: WaveManager, wave scheduler, timer/cooldown, periodic spawn
  framework, Survival-specific combat system, projectile, damage rebalance,
  progression redesign/skill tree, provider/image call, broad pacing system,
  unrelated cleanup, or a second work order.
execution_gate: Spatial fair-start implementation only. No temporal pacing,
  new authority, second WO, or Sprint 35 entry. All automated and real Studio
  gates passed.
result: `findRuntimeEntityPositionWithMinimumSeparation` uses current protected
  Runtime entity IDs, default distance 96, deterministic bounded candidates,
  occupied-position rejection, and Runtime collision-AABB non-overlap. Survival
  Enemy replacement `SPAWN_ENTITY` fails closed when the current Player or a
  fair candidate is unavailable. Runtime 711/711, Renderer 510/510, and Web
  3574/3574 passed; TypeScript, ESLint, Web build, real two-cycle Survival
  Studio verification, Platformer smoke, and empty browser error logs passed.
  Fresh post-WO Gap Analysis is PASS.
next_gate: `SPRINT34_FREEZE_REVIEW` — Human/CTO review; no Sprint 35 entry.

## SPRINT34_FREEZE_REVIEW

status: DONE — Human/CTO froze Sprint 34 at v1.184 on 2026-09-01
architecture_before: v1.183
architecture_after: v1.184
decision: The selected Sprint 34 blocker is resolved within the bounded
  spatial fair-start slice. Code Complete = YES, Product Verified = YES, and
  the fresh post-WO Gap Analysis = PASS. Human/CTO accepted the freeze at
  v1.184; Sprint 35 discovery is authorized separately.
evidence: Runtime 711/711, Renderer 510/510, Web 3574/3574; Runtime/Web
  TypeScript; Runtime/Web ESLint with zero errors and existing Web warnings
  only; Web build; real two-cycle Survival Studio verification; Platformer
  smoke; current `v1.184 / Sprint 34` Full Observatory projection; empty
  browser error logs; and ADR-0294.
constraints: Preserve the fair-start policy, Runtime authority, accepted
  Sprint 33 feedback, Platformer behavior, and the one-WO/Sprint-boundary
  controls. Do not extend Sprint 34 into timers, waves, scaling, world-bounds
  architecture, or progression effects.
next_gate: `SPRINT35_PRODUCT_GAP_DISCOVERY` — authorized and complete below.

## SPRINT35_AUTHORIZATION — Progression Meaning Discovery

status: DONE — Human/CTO decision 2026-09-01; discovery complete
architecture_at_authorization: v1.184
current_architecture: v1.184
goal: Audit the current progression authority and real Survival behavior, rank
  candidate gameplay consequences, generate exactly one READY WO, and stop.
discovery_policy: Do not implement a progression feature before auditing XP,
  Level, rule conditions/actions, movement speed, attack damage/range, and
  Health ownership. Use real `生成一个幸存者游戏` play and preserve generic
  Runtime authority; do not preselect a reward or enter Sprint 36.
constraints: No StatsEngine, ModifierManager, AttributeSystem, BuffSystem,
  EffectStack, RPG stat framework, SkillTree, UpgradeManager, new progression
  UI, provider/image call, Platformer change, second WO, or feature execution.

## SPRINT35_PRODUCT_GAP_DISCOVERY

status: DONE — one measured blocker selected; exactly one READY WO generated
architecture_before: v1.184
architecture_after: v1.184 — discovery introduced no architecture change
evidence: Runtime audit and current/accepted real Studio Survival evidence show
  committed `XP 0 → 1` and `Level 1 → 2`, with no changed attack damage, range,
  movement speed, or Health behavior afterward. Existing Runtime progression
  and Observatory projections remain truthful.
selected_bottleneck: LEVEL PROGRESSION HAS NO GAMEPLAY CONSEQUENCE
root_cause: `CHANGE_NUMERIC_STATE` commits Level, but no Gameplay RuleSet
  composition binds the committed numeric state to a gameplay capability. The
  existing generic `NUMBER_COMPARE(gameState.level)` and `DAMAGE_ENTITY`
  primitives can compose the smallest proof, but the selected capability
  variants are not currently declared.
candidate_ranking: Attack damage is selected for high immediate perceptibility,
  direct fit with the intentional Survival loop, reuse of existing generic
  condition/action primitives, and a small RuleSet delta. Attack range,
  movement speed, and Health require larger Runtime/configuration or semantic
  changes and are not selected.
selected_work_order: WO-S35-001 — Generic Progression-Conditioned Gameplay Capability
next_gate: WO-S35-001 is READY only; do not execute it in this continuation and
  do not enter Sprint 36.

## WO-S35-001 — Generic Progression-Conditioned Gameplay Capability

status: READY — not executed
priority: P0 / selected Sprint 35 blocker
architecture_before: v1.184
architecture_after: v1.185 proposed only; not applied
allowed_scope: Add one pure, declarative, reusable progression-conditioned
  Gameplay Rule builder composition that reuses `NUMBER_COMPARE(gameState)`
  and `DAMAGE_ENTITY`; Level 1 selects damage 25 and committed Level 2 selects
  damage 50 for the existing Survival offense trigger. Preserve target
  selection, Runtime action authority, outcome feedback, XP/Level, fair-start
  replacement, and Platformer behavior.
acceptance: Level 1 attacks commit 25 damage; the first lethal defeat commits
  XP +1 and Level 1 → 2 without duplicate same-event damage; the next Level 2
  attack commits 50 damage and the following attack defeats the Enemy through
  the existing removal/XP/fair-start/feedback path. Tests and real Studio play
  prove the changed hit count and all non-regressions.
forbidden_scope: StatsEngine, modifier framework, weapon/projectile, range,
  movement speed, Health, timer, cooldown, wave, scaling, world-bounds,
  progression UI, randomized reward, provider/image call, deep Survival/Level
  branch in Runtime mechanics, Platformer/global Level behavior, second WO, or
  Sprint 36.
execution_gate: Separate authorization required. This queue entry is a READY
  contract only; no product code or architecture change was executed during
  Sprint 35 discovery.

## SPRINT32_FREEZE_REVIEW

status: DONE — Human/CTO froze Sprint 32 at v1.182 on 2026-09-01
architecture_before: v1.181
architecture_after: v1.182
decision: Sprint 32 is FROZEN; WO-S32-001 is DONE with Code Complete = YES,
  Product Verified = YES, and fresh Gap Analysis = PASS.
evidence: Real Studio confirmed the visible `Space — 攻击` affordance, explicit
  non-contact damage, contact-only Player danger, defeat/XP/Level/replacement
  continuity, current v1.182/Sprint 32 Observatory truth, no attack-time
  provider/image activity, and empty browser diagnostics.
constraints: No cooldown, weapon, projectile, wave, timer, attack VFX,
  progression redesign, or second Sprint 32 WO is authorized by the freeze.
next_gate: Sprint 33 Product Gap Discovery, not Sprint 32 implementation.

## Historical SPRINT33_AUTHORIZATION — Survival Playability Gap Discovery

status: DONE — Human/CTO decision 2026-09-01; discovery completed and the
  separately authorized WO is now DONE; Sprint 32 remains FROZEN at v1.182
architecture_at_authorization: v1.182
current_architecture: v1.183
goal: Measure the single largest remaining user-visible issue preventing the
  generated Survival loop from feeling like a coherent playable mini-game.
discovery_policy: Play the exact generated Survival request normally through
  movement, pursuit, attacks, defeat, replacement, leveling, and continued
  play. Rank measured experience gaps only; generate exactly one primary WO;
  do not execute it at that historical discovery boundary; Sprint 34 was
  entered only after a later Human/CTO decision.
verified_baseline: Explicit Space offense, Runtime-authoritative damage,
  defeat/removal, XP/Level, Runtime-only replacement, active-session
  continuity, and truthful Observatory projection are already verified.

## Historical SPRINT33_PRODUCT_GAP_DISCOVERY

status: DONE — one measured blocker selected; `WO-S33-001` executed and
  verified; Sprint 33 was then frozen at v1.183
evidence: Fresh local Studio play produced active deterministic-fallback
  world-1 with six entities. Space attacks committed real damage and defeat,
  but the Game canvas gave no hit, damage, defeat, or replacement cue; the
  Inspector/Event Stream were needed to understand outcomes. Observatory
  showed experience 1 and level 2, while Game showed no progression consequence.
selected_bottleneck: PRODUCT_GAP — generic gameplay outcome feedback and
  combat readability. The issue occurs on every attack and blocks understanding
  of the primary loop more frequently than progression meaning or replacement
  pacing.
selected_work_order: WO-S33-001 — Generic Runtime Gameplay Outcome Feedback
next_gate: Historical `SPRINT33_FREEZE_REVIEW` was subsequently accepted;
  current Sprint 34 discovery and `WO-S34-001` are recorded above.

## SPRINT31_AUTHORIZATION — Observatory Truth Consistency

status: AUTHORIZED — Human/CTO decision 2026-08-31; Sprint 30 FROZEN at v1.180
architecture_at_authorization: v1.180
current_architecture: v1.181
goal: Current Runtime/gameplay state → current Web projection → Full
  Observatory across navigation and ongoing gameplay; no stale metadata or
  fabricated/default progression.
initial_gap_analysis: Two independent defects were measured. Game remounts
  created a fresh Runtime progression store and published 0/1; the current
  centralized apps/web/src/projectMetadata.ts still publishes v1.177/Sprint 27.
selected_priority: Progression first because active gameplay truth was reset by
  the route boundary. Metadata is the next separate item.
constraints: Runtime remains authority; Observatory remains projection-only;
  no persistence, telemetry, route-state framework, duplicate XP state,
  Manager/MetadataManager/PersistenceManager, or Sprint 25 legacy reconnection.
next_gate: SPRINT31_FREEZE_REVIEW is DONE; Human/CTO froze Sprint 31 at v1.181
  and authorized Sprint 32 Product Gap Discovery. Discovery is complete and
  generated exactly one READY primary WO; do not execute it in this discovery
  step.

## WO-S31-001 — Runtime Progression Projection Across SPA Navigation

status: DONE — Code Complete = YES; Product Verified = YES
priority: P0 / Sprint 31 authorized
architecture_before: v1.180
architecture_after: v1.181
dependencies: Sprint 30 FROZEN at v1.180; Sprint 31 authorized; initial Gap
  Analysis complete
allowed_scope: Reuse the existing Runtime progression store at the existing
  Web app-session gameStore boundary; mark the stateful object raw for Pinia;
  inject it into every GameViewportPanel execution loop; add production route
  regression coverage and truthful ADR/control-plane updates.
forbidden_scope: Observatory-owned XP, persistence, refresh restore,
  localStorage/IndexedDB/server session, telemetry, event sourcing, route-state
  framework, new global state, gameplay rule changes, waves/managers, visual
  redesign, or legacy metadata reconnection.
real_flow: GameViewportPanel mount → gameStore Runtime progression store →
  DefaultRuntimeExecutionLoop → GameplayRuleExecutor → Runtime progression
  commit → RuntimeGameplayProgressionStateObserver → observatoryDataStore →
  Full Observatory Runtime viewer
acceptance: Same world/session retains progression across Game → Full
  Observatory → Game; real Survival reaches 1/2 then 2/2; no fake 0/1 after
  remount; existing spawning, visuals, Platformer, and clean diagnostics remain.
verification: Runtime 25/705 and Web 50/3565 tests pass; Runtime/Web
  TypeScript pass; package Lint exits 0 with existing warnings only; Web build
  and git diff --check pass; real Studio route PV passes with browser
  error/warning query [].
result: PASS — current Runtime progression is retained across remounted loops;
  Sprint31 metadata remains a separate measured blocker.

## WO-S31-002 — Current Observatory Metadata Source

status: DONE — Code Complete = YES; Product Verified = YES
priority: P1 / Sprint 31 authorized
architecture_before: v1.181
architecture_after: v1.181 (metadata truth correction only)
dependencies: WO-S31-001 DONE; post-WO Gap Analysis complete
measured_bottleneck: The current Observatory consumers already share
  PROJECT_METADATA, but apps/web/src/projectMetadata.ts is stale at v1.177 /
  Sprint 27. Trace the repository source and correct the one current source;
  do not patch scattered UI strings or reconnect FROZEN_LEGACY metadata.
allowed_scope: Source trace, centralized current metadata correction, focused
  header/overview/store tests, production route reachability assertions, and
  the complete real progression PV.
forbidden_scope: MetadataManager, new metadata service, persistence,
  telemetry, route-state framework, legacy PromptBuilder/metadata bridge,
  unrelated cleanup, or Sprint 32.
acceptance: Full Observatory header/overview show current architecture/Sprint
  values from one current source; real Survival route PV preserves world,
  session, and progression; no fabricated defaults or stale v1.177/Sprint 27.
result: PASS — `PROJECT_METADATA` is the single current Web application source;
  it now reports v1.181 / Sprint 31. Observatory header and Overview continue
  to consume that source, while the FROZEN_LEGACY metadata bridge remains
  disconnected. Production route tests prove source → `/observatory` display
  and repeated Game ↔ Observatory navigation.
verification: Web 50/3565 tests, Web TypeScript, Web package ESLint (0 errors;
  existing warnings only), Web build, and `git diff --check` pass. Real Chrome
  Studio used `生成一个幸存者游戏`, retained `world-1`, reached active
  `经验值: 2` / `等级: 2`, displayed v1.181 / Sprint 31 in Full Observatory
  before and after route traversal, and returned an empty error/warning query.
fresh_gap_analysis: PASS — Runtime progression and engineering/build metadata
  both project current truth through Full Observatory. The partially settling
  image queue and the unproduced system/event/FPS metrics remain deferred
  non-blockers from Sprint 30.
next_gate: SPRINT31_FREEZE_REVIEW — DONE; Human/CTO froze Sprint 31 at v1.181
  and authorized Sprint 32 Product Gap Discovery.

## SPRINT31_FREEZE_REVIEW

status: DONE — Human/CTO froze Sprint 31 at v1.181 on 2026-08-31 and
  authorized Sprint 32 Product Gap Discovery.
recommended_architecture: Keep Sprint 31 at v1.181
scope: Review WO-S31-001 and WO-S31-002 completion, current Runtime
  progression, current Observatory architecture/Sprint metadata, full route
  reachability, and the fresh Sprint 31 Gap Analysis. No product
  implementation is proposed by this gate.
evidence: Runtime progression remains active and continuous at `world-1` with
  `经验值: 2` / `等级: 2`; the Full Observatory header and Overview show the
  current centralized source v1.181 / Sprint 31; repeated Game → Observatory
  → Game → Observatory navigation preserves the same session; browser
  error/warning diagnostics are empty.
constraints: Runtime remains the authority; Observatory remains projection-only;
  no persistence, metadata manager/service, legacy PromptBuilder/metadata
  reconnection, or visual redesign was added. Sprint 32 begins only with its
  separately authorized Product Gap Discovery.
decision_required: RESOLVED — Human/CTO accepted the Sprint 31 freeze at v1.181.
  The resulting Sprint 32 discovery is recorded in
  docs/project/SPRINT32_PRODUCT_GAP_DISCOVERY.md.

## SPRINT32_AUTHORIZATION — Survival Playability Gap

status: FROZEN — Human/CTO decision 2026-09-01; Sprint 31 FROZEN at v1.181;
WO-S32-001 complete at v1.182; freeze review accepted
architecture_at_authorization: v1.181
current_architecture: v1.182
goal: Identify and address the single largest remaining user-visible Survival
  playability blocker; do not preselect weapons, projectiles, waves, timers,
  attack animation, or difficulty scaling.
verified_baseline: Natural-language Survival generation, top-down movement,
  target-directed pursuit, contact pressure/offense, Health/defeat, XP/Level,
  Runtime-only replacement, visual reuse, active session, and Observatory
  inspection are already verified and must not be rebuilt.
discovery_policy: The real Studio play session, single-WO execution, Product
Verification, and fresh Gap Analysis completed. The freeze-review gate then
closed Sprint 32 and authorized Sprint 33 Product Gap Discovery.

## SPRINT32_PRODUCT_GAP_DISCOVERY

status: DONE — one measured blocker selected; exactly one primary WO generated
  and executed; Code Complete = YES; Product Verified = YES; fresh gap PASS.
evidence: Real local Studio produced deterministic-fallback `world-1` with six
  entities. The visible Game control was only `Arrow Keys — Move`. Before an
  explicit attack, contact changed Enemy Health `100 → 75` and Player Health
  `100 → 99`; Player and Enemy then remained co-located under pursuit. A
  replacement preserved the active session/composition but resumed pressure at
  the Player position. Observatory later showed XP/Level `1/2` and `2/2`, while
  the Game surface showed no attack or progression affordance.
selected_bottleneck: PRODUCT_GAP — intentional Player offense. Verified
  movement, pursuit, Health, DAMAGE_ENTITY, defeat, XP/Level, replacement, and
  active-session continuity exist; the current contact-only offense is the
  smallest blocker because damage happens without an explicit attack action,
  the same overlap damages the Player, and no repeatable combat rhythm is
  understandable from the visible product surface.
source_audit: Existing Space input, Runtime Position/Health/collision,
  target-directed movement, Runtime ticks, trusted DAMAGE_ENTITY, and generic
  Gameplay Rule execution are reusable. No nearest/range selector or attack
  input fact exists. A projectile or timer is larger than the measured need.
selected_work_order: WO-S32-001 — Generic Player-Directed Short-Range Offense
next_gate: WO-S32-001 DONE — proceed to `SPRINT32_FREEZE_REVIEW` after the
recorded real Studio Product Verification and Observatory truth regression.

## WO-S32-001 — Generic Player-Directed Short-Range Offense

status: DONE — Code Complete = YES; Product Verified = YES; v1.182
priority: P0
architecture_before: v1.181
architecture_expected_after: v1.182 (bounded generic input → Runtime offense
  capability only)
dependencies: Sprint 31 FROZEN at v1.181; SPRINT32_PRODUCT_GAP_DISCOVERY DONE;
  existing DAMAGE_ENTITY, Runtime Position/Health/collision, input, and
  Gameplay Rule paths available
measured_bottleneck: The current Survival contact offense applies DAMAGE_ENTITY
  only after ENTITY_CONTACT_STARTED, while the same overlap enables Enemy
  contact damage to the Player. The Game surface has no attack affordance, so
  the first and repeated offensive outcomes feel accidental and require an
  unclear contact rhythm.
allowed_scope: Reuse Space for top-down Player attack while preserving
  Platformer Space jump; add one provider-neutral Runtime attack request/fact;
  select the nearest current Runtime Enemy within one finite bounded short
  range with deterministic ID tie-breaking; reuse the trusted DAMAGE_ENTITY
  action; gate/replace Survival contact offense as needed; add only the minimal
  control hint/outcome cue, focused tests, required ADR if the accepted
  contract changes, and real Studio/Observatory verification.
forbidden_scope: SurvivorWeaponSystem, SurvivorCombatEngine, genre-specific
  Runtime, live AI combat decisions, projectiles, projectile physics/lifetime,
  timers, cooldown schedulers, auto-fire, waves, spawn directors, difficulty
  scaling, broad selector frameworks, attack animation systems, visual redesign,
  new combat HUD, XP/Level redesign, upgrades, health rebalance, persistence,
  telemetry, route-state infrastructure, replacement-spawn changes,
  Platformer regression, Sprint 33, or unrelated cleanup.
real_flow: top-down Space key edge → generic Runtime attack request/fact →
  deterministic current-position target selection → GameplayRuleMatcher /
  ConditionEvaluator → trusted DAMAGE_ENTITY → Runtime WorldStore → Renderer /
  Studio projection → Observatory projection
acceptance: Exact Survival generation remains active on world-1; Space Attack
  is discoverable; one input damages one nearby Enemy without requiring overlap;
  no in-range target is a no-op; four bounded attacks defeat the Enemy through
  the existing Health/removal/XP/Level/replacement path; Enemy contact remains
  a separate danger interaction; the same world/session and current
  Observatory truth survive; Platformer movement/jump, asset binding,
  replacement composition, and diagnostics remain intact.
automated_tests: Shared/AI/Runtime/Web tests for input/event vocabulary,
  key-edge behavior, nearest/range target selection, deterministic tie-break,
  no-target no-op, trusted damage, top-down control hint, Platformer Space
  jump non-regression, Observatory continuity, TypeScript, ESLint, Web build,
  and diff hygiene.
product_verification: Fresh real Studio session with the exact request; record
  visible attack affordance, intentional non-contact damage, one-result-per-
  input, separate contact danger, defeat/XP/Level/replacement continuity,
  Game ↔ Full Observatory route continuity, current metadata, provider/image
  operation counts, and browser error/warning diagnostics. Do not claim Product
  Verified from automated tests alone.
observability: Keep Runtime facts, rule results, World mutation, renderer
  outcome, and Observatory projection distinct; no fabricated attack, target,
  cooldown, or progression state.
completion_requirements: eventual report must include architecture before →
  after, files, real call chain, tests, TypeScript/ESLint/build, constraints,
  remaining gaps, manual PV steps/results, Code Complete, and Product Verified.
implementation_result: The top-down composition registers the generic
  `PlayerAttackRequestSystem` on the existing `Space` input. One input edge
  selects one positive-Health Runtime Enemy within finite range `48`, using
  nearest distance and stable ID tie-breaking, then emits
  `ENTITY_ATTACK_REQUESTED`. Existing Gameplay Rule matching commits trusted
  `DAMAGE_ENTITY`; contact remains Enemy→Player danger. Platformer `Space`
  jump is unchanged. The exact generated Survival session remains `world-1`.
verification_result: Automated production reachability and relevant package
  checks pass. The production path confirmed non-contact damage, no-target
  no-op, deterministic replacement targeting, and repeated independent
  outcomes. Real Studio verification confirmed the attack affordance, contact
  danger separation, defeat/XP/Level/replacement continuity, current
  Observatory metadata/session truth, no new attack-time provider/image calls,
  and clean browser diagnostics. The browser runner required explicit key-edge
  timing for repeated input, so the repeated attack count is also covered by
  the real production-path Runtime verification.
fresh_gap_analysis: PASS — explicit offensive agency is now reachable and
  distinguishable from contact danger. Replacement pacing, progression meaning,
  richer presentation, timers, waves, projectiles, and scaling remain deferred
  and do not generate another Sprint 32 WO.
next_gate: SPRINT32_FREEZE_REVIEW — DONE; Human/CTO froze Sprint 32 at v1.182
  and authorized Sprint 33 Product Gap Discovery. `WO-S33-001` is the sole
  READY item and has not been executed.

## SPRINT29_FREEZE_REVIEW

status: DONE — Human/CTO froze Sprint 29 at v1.179 on 2026-08-28.
WO-S29-001 Code Complete = YES; Product Verified = YES; Fresh Gap Analysis =
PASS. Continuous-overlap attacks, cooldowns, weapons, projectiles, spawning,
and waves remain outside the frozen boundary. Artifact:
`docs/project/SPRINT29_REVIEW.md`.

## SPRINT30_AUTHORIZATION — Sustained Survival Loop

status: AUTHORIZED — 2026-08-28; ten-question repository Gap Analysis complete
architecture_before: v1.179
goal: Enemy defeat/removal → replacement Enemy pressure → continued active
Survival, through generic Runtime-authoritative mechanics.
selected_bottleneck_at_authorization: EXECUTION_GAP / PROJECTION_GAP — typed `SPAWN_ENTITY`,
supported `ENTITY_REMOVED`, WorldMutator addition, and current Enemy component
composition exist, but Gameplay action execution and runtime-only visual
binding were absent; WO-S30-001 closes this bounded gap.
deferred_non_blockers: entity-count conditions, timing, periodic waves,
difficulty, schedulers, encounter systems, and persistent Semantic mutation.
source_of_truth: `docs/project/SPRINT30_BACKLOG.md`, actual Runtime/Renderer
wiring, and the Human/CTO decision.

## WO-S30-001 — Generic Rule-Driven Runtime Entity Creation

status: DONE — Code Complete = YES; Product Verified = YES
priority: P0 / Human-CTO authorized
architecture_before: v1.179
architecture_after: v1.180
allowed_scope: trusted generic `SPAWN_ENTITY`; reusable Runtime entity
composition and safe placement; one Enemy-removal replenishment rule;
mutation-fact category matching; binding-only canonical Enemy visual reuse;
production tests/docs.
forbidden_scope: Wave/Spawn/Encounter/Difficulty managers, timer/scheduler,
entity-count expression, prefab framework, AI per spawn, Semantic mutation for
runtime-only replacements, new image generation, or Platformer spawning.
acceptance: one defeated Enemy is removed; one replacement appears in the same
active session with Position, Health, collision, pursuit, pressure/offense
compatibility, and the existing Enemy visual; no provider call or duplicate
generation occurs; Platformer remains unchanged; full checks pass and real
Studio PV remains the final required gate.
result: PASS — automated production reachability and all package
tests/typechecks/lints plus Web build pass. Fresh Chrome-backed Studio PV
submitted `生成一个幸存者游戏`, kept `world-1` active at five entities,
proved independent contact defeat, two Runtime-only replacements, full
replacement composition, XP/Level `1/2` then `2/2`, stable visual operation
count `9`, no new provider/image-generation activity, and empty browser
warning/error diagnostics.
fresh_gap_analysis: PASS — no blocker to the bounded Sustained Survival Loop.
Page-remount progression projection, stale full Observatory metadata, and a
partially settling image queue remain explicit out-of-scope/non-blocking gaps.
next_gate: SPRINT30_FREEZE_REVIEW — DONE; Sprint 30 was frozen at v1.180 and
Sprint 31 was explicitly authorized by Human/CTO on 2026-08-31.

## SPRINT30_FREEZE_REVIEW

status: DONE — Human/CTO froze Sprint 30 at v1.180 on 2026-08-31.
recommended_architecture: Freeze Sprint 30 at v1.180
scope: Review WO-S30-001 completion, real Studio evidence, fresh Gap Analysis,
and documentation drift; no product implementation. Review accepted.
evidence: The exact provider-backed request `生成一个幸存者游戏` produced
`world-1` with five entities. Independent contact-starts removed the initial
Enemy and committed two same-world Runtime replacements. The Event Stream
showed `ENTITY_REMOVED → SPAWN_ENTITY → ENTITY_ADDED`; replacement entities
had Position, Health, collision, target-directed pursuit, and contact
pressure/offense compatibility. XP/Level reached `1/2` and then `2/2`.
Visual operations stayed at `9`; no new provider/image-generation activity
appeared; browser warning/error diagnostics were empty.
fresh_gap_analysis: PASS — no blocker to the bounded Sprint 30 thesis. The
page-remount progression and stale metadata findings became Sprint 31 inputs;
the partial image queue remains non-blocking.
constraints: No waves/timers/count expressions/encounter manager, no Semantic
mutation for ephemeral replacements, and no new visual generation. Sprint 31
is separately authorized only for Observatory Truth Consistency.
artifact: docs/project/SPRINT30_REVIEW.md

## SPRINT28_FREEZE_REVIEW

status: DONE — Human/CTO froze Sprint 28 at v1.178 on 2026-08-28.
WO-S28-001 Code Complete = YES; Product Verified = YES; Fresh Gap Analysis =
PASS. Combat, weapons, projectiles, spawning, waves, and attack animations are
outside the frozen boundary. Artifact: `docs/project/SPRINT28_REVIEW.md`.

## SPRINT29_AUTHORIZATION — Generic Offensive Interaction

status: AUTHORIZED — 2026-08-28; ten-question production-path Gap Analysis complete
architecture_before: v1.178
goal: Player offensive interaction → Enemy Health loss → explicit defeat →
continued Survival gameplay, without a genre-specific combat engine.
selected_bottleneck: PRODUCT_GAP / COMPOSITION_GAP — supported generic Health,
damage, removal, contact identity, atomic rules, and XP/Level exist, but the
generated Survival RuleSet does not compose them for Player-originated offense.
deferred_non_blockers: timing/cooldown, range/proximity, nearest target,
projectile execution, gameplay spawning, waves, attack animation, inventory.
source_of_truth: `docs/project/SPRINT29_BACKLOG.md`, ADR-0289, and actual source.

## WO-S29-001 — Generic Contact Offense Rule Composition

status: DONE — Code Complete = YES; Product Verified = YES
priority: P0 / Human-CTO authorized
architecture_before: v1.178
architecture_after: v1.179 target
allowed_scope: supported `contact-offense` capability truth; deterministic
Survival contact damage to Enemy; explicit zero-Health remove + XP; existing
first Level threshold; tests/docs.
forbidden_scope: weapons, projectiles, cooldown/timer, radius/nearest targeting,
spawn/waves, inventory/equipment/ability systems, visual combat framework,
Survivor-specific Runtime/manager/renderer, Platformer behavior changes.
acceptance: generated Survival uses real Studio Runtime composition; distinct
contacts reduce Enemy Health 100→75→50→25→0, remove the Enemy, grant XP and the
existing first Level transition, keep the session active, and remain compatible
with same-world added enemies. Full checks and real Studio PV required.
result: PASS — production-chain regression proves Health 100→75→50→25→0,
Enemy removal, XP 1, Level 2, and active session. Real provider-backed Studio
proves initial and all five evolved Enemy contacts at Health 75/100, same
`world-1`, pursuit composition, and clean diagnostics.
fresh_gap_analysis: PASS — meaningful bounded contact offense exists; no
immediate timed/ranged/projectile/spawn blocker is required.
next_gate: SPRINT29_FREEZE_REVIEW — READY; do not enter Sprint 30.

## SPRINT27_AUTHORIZATION — Human/CTO Priority Correction

status: CLOSED — Sprint 27 FROZEN at v1.177 after the 2026-08-28 Human/CTO
decision; originally AUTHORIZED because Sprint 27 was opened despite the stale
Sprint 26 freeze-review projection. The Human/CTO instruction is the higher
authority and explicitly forbids beginning the previously proposed Survival
gameplay-pressure work.
architecture_before: v1.176
architecture_target: v1.177
goal: Make Survival visually and spatially read as top-down through the
existing Natural Language → Semantic World → Game DSL → Runtime → Renderer
pipeline while preserving Platformer.
historical_forbidden_next: Enemy pursuit, offense, weapons/projectiles,
spawning, waves, timer/duration, Survivor-specific Runtime/Renderer,
CameraManager, GenreRenderer, SurvivorRuntime, animation-state framework, or
Sprint 28. This boundary applied before the separate Human/CTO freeze and
Sprint 28 authorization recorded below.
source_of_truth: docs/project/SPRINT27_BACKLOG.md, ADR-0287, and actual source
runtime wiring; the previous Sprint 26 freeze review is not a blocker.

## WO-S27-001 — Survival Top-Down Spatial Composition

status: DONE — Code Complete = YES; Product Verified = YES
priority: P0 / Human-CTO corrected priority
dependencies: WO-S26-003 implementation complete; explicit Sprint 27
authorization; fresh repository-grounded Gap Analysis complete
architecture_before: v1.176
architecture_after: v1.177
measured_bottleneck: Survival already has generic top-down motion selection,
but visual design/assets remain side-view, vertical movement is not exposed
as Runtime velocity direction, and resolved terrain composes as a horizontal
ground strip.
allowed_scope: Shared bounded WorldSpatialMode, AI visual/asset requirements,
Prompt Truth context/prompt metadata, generic controller option, Web
composition/adapter wiring, existing Pixi entity/environment composition,
focused tests, ADR and truthful project projections.
forbidden_scope: Any Survivor-specific Runtime/engine/manager/renderer,
CameraManager, GenreRenderer, animation-state framework, enemy pressure,
weapons/projectiles, spawn/wave/timer/duration, inventory/ability/XP,
image-pixel geometry, legacy reconnection/deletion, or Platformer changes.
acceptance: Survival produces top-down visual/asset semantics with top-view
assets, idle/run Player states, four-way Runtime-derived direction, a
repeatable X/Y arena surface, no Mario sky/horizon and no horizontal
Ground/Platform strip; Platformer preserves its system/control behavior and
the real Studio Prompt Truth/console evidence is clean.
automated_tests: Shared/AI/Runtime/Renderer/Web targeted tests, affected
package suites, TypeScript, ESLint, Web build, and git diff --check.
product_verification: PASS — real provider-backed Studio Survival verification
passed the submitted top-down background/arena-fill/top-view Prompt checks and
published → resolved → Renderer applied asset lineage. Human/CTO real-product
verification confirms the existing 7-entity side-view Mario/Platformer world,
Ground/Platform composition, Arrow Keys / Space controls, horizontal movement,
and gameplay experience remain correct. The earlier automated Space
observation is reclassified as AUTOMATED INPUT / OBSERVATION LIMITATION, not a
confirmed product regression. No Jump, collision, controller, or Platformer
repair WO is opened.
observability: Preserve actual Runtime geometry, submitted prompt text,
asset render usage, renderer application events, and console diagnostics;
do not infer enemy gameplay from this spatial slice.
next_gate: Sprint 27 freeze review accepted by Human/CTO at v1.177; Sprint 28
is separately authorized below. Sprint 29 is not entered automatically.

## SPRINT27_GAP_ANALYSIS_POST_PV

status: DONE — Human/CTO accepted Sprint 27 freeze at v1.177; no additional
measured Spatial & Visual Composition blocker
thesis: A user can immediately recognize generated Survival as a top-down game
through spatial composition, environment, terrain usage, and directional Player
presentation while existing Platformer behavior remains correct.
measured_result: PASS — Survival has a real provider-backed X/Y top-down arena,
top-view/arena-fill Prompt Truth, no sky/horizon/side-view composition, no
horizontal Ground strip, Runtime-authoritative movement, and four-direction
controls. Human/CTO confirms the existing Mario/Platformer product remains
correct; the previous automated Space observation is an input/observation
limitation rather than a product failure.
conclusion: No additional measured Spatial & Visual Composition blocker exists.
The freeze was accepted and Sprint 28 was separately authorized. Do not create
a polish-only visual WO.

## SPRINT27_FREEZE_REVIEW

status: DONE — Human/CTO froze Sprint 27 at v1.177 on 2026-08-28.
WO-S27-001 Code Complete = YES; Product Verified = YES; Status = DONE.
The existing Mario/Platformer product is confirmed correct. The earlier
automated Space observation is `AUTOMATED INPUT / OBSERVATION LIMITATION`, not
a product regression. No Platformer repair WO is opened.
artifact: docs/project/SPRINT27_REVIEW.md
result: Survival top-down spatial composition thesis PASS; no additional visual
composition blocker; Sprint 27 frozen. The closure documentation passed
`git diff --check`; inability to create `.git/index.lock` is an environment
limitation, not a product blocker.

## SPRINT28_AUTHORIZATION — Human/CTO Survival Gameplay Pressure

status: AUTHORIZED — 2026-08-28; initial production-path Gap Analysis complete
architecture_before: v1.177
architecture_target: v1.178 expected only if implementation changes the
accepted architecture
goal: Make the generated Survival pressure loop immediately observable as
Enemy → approaches current Player → contact threatens Player → Player avoids,
using deterministic generic Runtime behavior and the existing damage,
Health, failed, and Respawn foundations.
selected_bottleneck: PRODUCT_GAP / EXECUTION_GAP — no registered generic
Runtime capability reads current Player Position, computes target-directed
Enemy movement, and integrates it for initial and conversationally added
enemies.
required_reuse: Existing Survival generation and top-down composition,
Runtime Position/Velocity/collision/Health, EntityContactSystem,
`survival-enemy-contact` / `DAMAGE_ENTITY`, failed state, Respawn, and targeted
world evolution.
forbidden_scope: player kill, weapons/attacks/projectiles, spawn/waves,
timer/duration, XP/skills/progression, Survivor-specific Runtime/Renderer,
EnemyAI/Chase managers, BehaviorTree, pathfinding/navmesh/steering, and
Platformer changes.
source_of_truth: docs/project/SPRINT28_BACKLOG.md, actual Runtime/Web wiring,
and the Human/CTO decision log. Exactly one bounded Sprint 28 WO is selected.

## WO-S28-001 — Generic Runtime Target-Directed Enemy Pursuit

status: DONE — Code Complete = YES; Product Verified = YES
priority: P0 / Human-CTO authorized
dependencies: Sprint 27 FROZEN at v1.177; explicit Sprint 28 authorization;
fresh nine-question production-chain Gap Analysis
architecture_before: v1.177
architecture_after: v1.178
measured_bottleneck: Survival enemies have Position/collision/Health but are
stationary; no registered generic Runtime system moves eligible enemies toward
the current Player or updates direction after Player movement.
allowed_scope: One generic target-directed Runtime movement capability with an
explicit target selector; minimal generic Velocity/Position integration for
eligible non-Player entities; Survival composition wiring; existing evolution
composition inheritance; focused tests and required truthful documentation.
forbidden_scope: Any Survivor-specific engine/manager/AI, BehaviorTree,
pathfinding/navmesh/steering, weapons/attacks/projectiles, player kill,
spawn/wave/timer/duration/XP/skills, Renderer/camera architecture, manual-only
entities, or Platformer changes.
acceptance: Real `生成一个幸存者游戏` shows Enemy movement toward stationary
Player and direction updates after Player movement; contact damage decreases
authoritative Player Health; existing failed/Game Over and same-session
Respawn remain coherent; same-world `再加五只怪` is exactly +5 without rebuild
and additions inherit pursuit/contact behavior; Platformer remains correct and
the console is clean.
next_gate: SPRINT28_FREEZE_REVIEW — READY after this single WO passed; do not
enter Sprint 29 automatically.

## WO-S28-001 Execution Record — 2026-08-28

implementation_result: PASS — added generic immutable
TargetDirectedMovementComponent, Runtime target lookup and normalized
Velocity output, generic Velocity→Position integration, Survival composition
wiring, and same-world evolution inheritance. The Runtime system has no
world-type branch; Survival selection remains at the existing Web composition
boundary. Platformer systems and gameplay foundations were not modified.
visual_binding_repair: PASS — Survival Enemy additions inherit the existing
Enemy visual identity, and binding-only manifest updates copy the first
resolved shared resource to each new entity asset binding without duplicate
generation.
human_observation: PASS for automatic pursuit and existing contact damage.
The single Health decrease observed during persistent overlap is the existing
contact-start de-duplication contract, not a missing attack loop in this WO.
product_verification: PASS — clean provider-backed Studio session preserved
`world-1`, changed 4 entities to 9 with exactly five added Enemy entities, and
recorded five binding-only visual additions with no generation required. All
five additions exposed `target-directed-movement` targeting `survivor`; real
ArrowRight input moved Player x=80→83→86 and the additions followed. Visual
operations remained 8 with 6 ready, 0 active, 0 fallback; the manifest had 13
generated-origin entries; the Diff reported Runtime and visual synchronization
completed; and the browser console had no error/warning entries. The full
Observatory does not expose per-entity canonical IDs/URLs, so the available
binding-only and no-duplicate-generation evidence is recorded as the truthful
visual proof. Contact-start damage semantics remain unchanged.
fresh_gap_analysis: PASS — no additional measured Survival gameplay-pressure
blocker. The stale v1.177/Sprint 27 full-Observatory header is a projection
metadata mismatch, not a gameplay blocker or new WO.
next_gate: SPRINT28_FREEZE_REVIEW — READY; Sprint 29 is not entered
automatically.

## SPRINT24_FREEZE_REVIEW

status: DONE — Human/CTO froze Sprint 24 at v1.173 on 2026-08-27. Code Complete
= YES; Product Verified = YES. The clarified completed/Victory exploration
contract is accepted. No Sprint 25 product behavior was implied by the freeze.

## WO-S25-001 — Production Reachability & Legacy Disposition Audit

status: DONE — audit-only; Code Complete = YES; Product Verified = NOT APPLICABLE
priority: P0 / control-plane
dependencies: Human/CTO Sprint 24 freeze and explicit Sprint 25 authorization
architecture_before: v1.173
architecture_after: v1.173
allowed_scope: production call-chain tracing, mandatory-target disposition,
test-confidence review, fresh Gap Analysis, and necessary state/documentation
corrections
forbidden_scope: product behavior changes, legacy reconnection, mass deletion,
mass refactor, architecture replacement, or Sprint 26 work
acceptance: PASS — Chains A–E were traced from the current Studio front door;
all mandatory targets received ACTIVE, SUPPORTING, FROZEN_LEGACY, or DEAD
dispositions; no current reachability blocker was found.
artifact: docs/project/SPRINT25_PRODUCTION_REACHABILITY_AUDIT.md
result: Current generation/provider/fallback, CreateWorldPipeline, semantic
world/DSL/Runtime projection, Runtime gameplay loop, Pixi Renderer,
visual/asset flow, and current Observatory are production-reachable. Legacy
PromptBuilder/strategy/Planner/DefaultPipeline/Canvas2D/Mario paths are not.
No product source file was modified and no file was deleted.

## SPRINT25_GAP_ANALYSIS_POST_WO-S25-001

status: DONE — no current production reachability blocker
measured_result: The current A–E chains are reachable at v1.173. `renderWorld.ts`
is a DEAD candidate by repository call-site evidence, but its public barrel
export makes deletion non-trivial until package consumers are checked. Legacy
Observatory bridge/mapper imports are a bounded cleanup opportunity, not a
runtime defect.
conclusion: Audit goal satisfied. Do not reconnect or mass-delete legacy paths.
next_work_order: SPRINT25_FREEZE_REVIEW — requires Human/CTO freeze decision;
no cleanup WO opened by the audit-only work order.

## SPRINT25_FREEZE_REVIEW

status: DONE — Human/CTO froze Sprint 25 at v1.173 on 2026-08-28. WO-S25-001
Code Complete = YES; Product Verified = NOT APPLICABLE; Audit Complete = YES.
scope: review WO-S25-001 audit artifact, dispositions, documentation drift,
and the bounded future cleanup recommendation
result: Sprint 25 audit and control-plane documentation are finalized. No
reachability blocker was found. `renderWorld.ts` remains a public-export
cleanup candidate and was not deleted; FROZEN_LEGACY systems were not
reconnected. Sprint 26 was explicitly authorized after this review.

## SPRINT26_DISCOVERY — Second-Genre Generalization Proof

status: DONE — first production-path Gap Analysis complete; exactly one next WO
generated
architecture_before: v1.173
measured_result: The exact request `帮我生成一个2D幸存者游戏` reaches CreateWorld
through the Chinese `生成` keyword, but `DefaultGameIntentExtractor` recognizes
only English `survival`/`survivor`. The authoritative intent becomes `sandbox`,
so the deterministic semantic path produces only the sandbox Player. The
survival WorldType, six-entity template, DSL projection, generic movement,
contact/damage, progression, mutation, and visual seams exist but cannot be
measured for this request until the genre alias is corrected.
selected_bottleneck: PRODUCT_GAP — Chinese Survivor intent alias alignment
next_work_order: WO-S26-001 — Chinese Survivor Intent Alias
selection_status: READY — no human decision or architecture fork required

## WO-S26-001 — Chinese Survivor Intent Alias

status: DONE — Code Complete = YES; Product Verified = YES for bounded alias/pipeline acceptance
priority: P0
dependencies: Sprint 25 FROZEN at v1.173; explicit Human/CTO Sprint 26
authorization; SPRINT26_DISCOVERY complete
architecture_before: v1.173
architecture_after: v1.174
measured_bottleneck: The core Chinese Survivor request is routed as CreateWorld
but authoritative intent extraction falls back to `sandbox`, preventing the
production path from constructing the semantic survival world.
allowed_scope: Existing deterministic intent extractor, router genre-confidence
aliases, standalone semantic-generator compatibility matcher, focused AI tests,
Web production CreateWorld regression, and state documentation.
forbidden_scope: SurvivorRuntime, SurvivorEngine, SurvivorGameManager,
genre-specific execution or renderer, new ontology, gravity/movement policy,
enemy chase, weapons/projectiles, spawn/wave/timer infrastructure, ability or
inventory systems, provider changes, structured-output infrastructure, legacy
reconnection, or unrelated refactoring.
implementation_boundaries: Reuse the existing GameGenre/WorldType `survival`
value and current provider/fallback, Semantic World, DSL, Runtime, Gameplay,
visual, and evolution seams. Add aliases only at the existing front-door
classification boundaries; do not make the provider authoritative.
acceptance: The exact Chinese request extracts `survival`, routes with genre
confidence 1.0, and traverses the current CreateWorld pipeline to six
survival semantic/Runtime entities with Position components. Existing English
survival/survivor, platformer, and deterministic fallback behavior remain
valid. No Runtime/Renderer implementation is added.
automated_tests: Focused AI intent/router/generator tests plus the Web production
pipeline regression; affected-package typecheck, lint, and relevant regression
suites.
product_verification: Source/pipeline verification is required for this alias
WO. A genuinely playable Survivor session is intentionally PENDING and must be
measured by the next fresh Gap Analysis.
observability: Preserve actual generation source/fallback diagnostics and do not
claim combat or gameplay facts from semantic classification alone.
non_goals: No Survivor gameplay implementation or Sprint 26 freeze claim.

## SPRINT26_GAP_ANALYSIS_POST_WO-S26-001

status: DONE — alias blocker closed; exactly one next WO generated
architecture_before: v1.173
architecture_after: v1.174
measured_result: The exact request `帮我生成一个2D幸存者游戏` now reaches
`survival` with genre confidence 1.0. Real Studio showed Runtime active with
six entities (`player/resource/tree/stone/enemy/campfire`), Player Position
`(80,400)`, and clean browser diagnostics. The existing semantic → DSL →
Runtime → Pixi path is reachable for the second genre.
selected_bottleneck: PRODUCT_GAP — GameViewportPanel registers platformer
gravity, jump, vertical motion, and ground collision for every WorldType. The
survival probe still exposes `Space Jump` and is not yet a top-down motion
profile. A discrete browser ArrowRight probe left the inspected Player at
`(80,400)`; this is not counted as movement proof.
reusable_capabilities: Existing four-direction DefaultPlayerControllerSystem,
generic Runtime Position/motion/contact systems, and current renderer are
reusable. Enemy AI, offense, spawning, waves, timer, and duration remain
unmeasured/deferred.
next_work_order: WO-S26-002 — World-Type-Selected Generic Motion Profile
selection_status: READY — no human decision or architecture fork required

## WO-S26-002 — World-Type-Selected Generic Motion Profile

status: DONE — Code Complete = YES; Product Verified = YES
priority: P0
dependencies: WO-S26-001 DONE; Sprint 26 explicitly authorized
architecture_before: v1.174
architecture_after: v1.175
measured_bottleneck: Every Studio world receives platformer-only jump,
gravity, and ground-collision registration. The requested survival world is
classified correctly but cannot yet be verified as top-down.
allowed_scope: Existing Web composition boundary, existing semantic WorldType,
existing generic player controller/position/motion/contact systems, focused
motion-profile wiring tests, relevant regression tests, and current state docs.
forbidden_scope: Survivor-specific Runtime/engine/manager/renderer/world
authority, new gameplay loop or ontology, enemy chase, weapons/projectiles,
auto-attack, spawn/wave/timer/survive-duration, ability/inventory/XP/level
expansion, platformer behavior changes, provider authority changes, legacy
reconnection/deletion, or unrelated refactoring.
implementation_boundaries: Select a generic motion profile at the existing Web
composition boundary. Preserve the platformer system set exactly. Compose
survival with existing four-direction input and generic position/motion/contact
capabilities, omitting platformer jump/gravity/ground systems. Do not add a
genre-specific Runtime or Renderer.
acceptance: Survival uses four-direction movement without platformer-only
physics; platformer behavior remains unchanged; real Studio observes survival
movement in at least two directions with six-entity continuity and clean
diagnostics; no Survivor-specific implementation is added.
automated_tests: Focused Web motion-profile/wiring tests, AI/Web regressions,
affected-package TypeScript and lint, and Web production build.
product_verification: PASS — real Studio observed survival Arrow Keys-only
controls and Player movement `x:80→83`, `y:300→297`; reloaded MarioWorld
retained the seven-entity platformer and Space/Jump controls; browser
diagnostics were clean.
observability: Preserve Runtime-derived position and actual system/effect
diagnostics; do not claim combat, waves, or duration from motion evidence.
non_goals: No enemy pressure/combat/spawn/progression expansion and no Sprint
26 freeze claim.

## SPRINT26_GAP_ANALYSIS_POST_WO-S26-002

status: DONE — motion blocker closed; exactly one next WO generated
architecture_before: v1.174
architecture_after: v1.175
measured_result: Survival now uses the existing generic four-direction Player
controller without platformer-only jump/gravity/ground systems. Real Studio
verified two-axis movement and retained platformer controls after reload.
selected_bottleneck: PRODUCT_GAP — active-world five-enemy addition recovery.
The real survival session rejected `再加五只怪`, `再创建5个怪物`, and
`增加5个enemy` with `Structured world evolution planning failed`; world-1
remained at six entities. Source tracing shows the configured browser path
selects the structured evolution planner, while the deterministic provider has
no enemy-addition vocabulary and no provider-error fallback at this boundary.
reusable_capabilities: Existing semantic delta application, Runtime
synchronization, gameplay reconciliation, visual evolution, and deterministic
planner seams. Enemy chase, offense, spawning, waves, timer, and duration
remain deferred.
next_work_order: WO-S26-003 — Deterministic Active-World Enemy Addition Recovery
selection_status: READY — no human decision or architecture fork required

## WO-S26-003 — Deterministic Active-World Enemy Addition Recovery

status: DONE — Code Complete = YES; Product Verified = YES
priority: P0
dependencies: WO-S26-002 DONE; Sprint 26 explicitly authorized
architecture_before: v1.175
architecture_after: v1.176
measured_bottleneck: The same-world five-enemy acceptance request fails when
the structured evolution provider is unavailable, and deterministic evolution
does not recognize enemy-addition language.
allowed_scope: Existing deterministic World Evolution candidate vocabulary and
count parsing, existing Web command-executor provider-error/no-primary recovery
using DefaultWorldEvolutionPlanner, focused planner/store tests, and truthful
state documentation.
forbidden_scope: Enemy chase, weapons, projectiles, auto-attack, combat
balancing, spawn/wave/timer/survive-duration, progression, Survivor-specific
Runtime/engine/manager/renderer/world authority, provider protocol changes,
legacy reconnection/deletion, or unrelated refactoring.
implementation_boundaries: Preserve successful structured-AI evolution when
available. On provider error or no primary provider, use the existing
deterministic planner; operation metadata must identify the actual selected
deterministic source. Add only enemy/怪物/怪 addition aliases and count forms.
acceptance: In an active survival world, `再加五只怪` succeeds on structured
provider failure, preserves world-1, adds five semantic/Runtime enemies, and
completes existing Runtime/visual synchronization. Explicit new-world creation
still reaches CreateWorld, and no Survivor-specific implementation is added.
automated_tests: Focused AI planner and Web active-world fallback tests,
affected-package TypeScript and lint, relevant regressions, and Web build.
product_verification: PASS — clean real Studio verification created survival
world-1 with six entities, applied `再加五只怪` through deterministic fallback,
preserved world-1, added enemy-1 through enemy-5, reached 11 Runtime/Explorer/
Viewport entities, and completed Runtime/visual synchronization. Observatory
showed `deterministic · fallback` and `provider_failed`; warning/error
diagnostics were empty.
observability: Preserve structured-versus-deterministic source/fallback facts;
do not claim combat or enemy behavior from entity addition alone.
non_goals: No enemy movement, combat, spawning, waves, duration, or Sprint 26
 freeze claim.

## SPRINT26_GAP_ANALYSIS_POST_WO-S26-003 (historical; superseded)

status: DONE — bounded Sprint 26 acceptance complete; the original freeze
projection was superseded by the later Human/CTO Sprint 27 authorization
architecture_before: v1.175
architecture_after: v1.176
measured_result: The exact Chinese Survivor request reaches the existing
semantic → DSL → Runtime → Pixi path, uses generic top-down movement in two
axes, and accepts same-world addition of five enemies with deterministic
provider recovery. Entity/world identity and Runtime/visual synchronization
remain coherent.
deferred_non_blockers: Enemy chase, offense, spawn/wave, timer/
survive-duration, ability/inventory, and progression expansion are outside the
bounded Sprint 26 proof and do not open another WO.
next_work_order: SPRINT26_FREEZE_REVIEW — Second-Genre Generalization Proof
selection_status: SUPERSEDED — Human/CTO later opened Sprint 27; this historical
projection is not the current queue state

## SPRINT26_FREEZE_REVIEW

status: READY FOR HUMAN/CTO REVIEW
recommended_architecture: Freeze Sprint 26 at v1.176
code_complete: YES
product_verified: YES for the bounded Second-Genre Generalization Proof
evidence: Exact `帮我生成一个2D幸存者游戏` created a six-entity active survival
world; generic top-down Player movement was observed in two axes; same-world
`再加五只怪` preserved world-1 and produced 11 synchronized entities through
truthful deterministic fallback; clean-page browser diagnostics were empty.
constraints: No Survivor-specific Runtime/engine/manager/renderer/world
authority, no legacy reconnection/deletion, and no Sprint 27 auto-creation.

## SPRINT23_FREEZE_REVIEW

status: DONE — Human/CTO froze Sprint 23 at v1.172; Code Complete = YES;
Product Verified = YES. Exact prompt truth and targeted lineage-linked recovery
are proven. No generation-management expansion is authorized.

## WO-S24-001 — Runtime-Authoritative Lifecycle Overlay

status: CODE COMPLETE — Product Verified = PENDING
priority: P0
dependencies: Human/CTO Sprint 23 freeze and Sprint 24 authorization
architecture_before: v1.172
architecture_after: v1.173
measured_bottleneck: Runtime already owns `active | failed | completed`, blocks
terminal gameplay, and exposes same-world respawn only after failure; Studio
does not present those states as player lifecycle overlays.
allowed_scope: Runtime observer → existing Pinia game-store projection → bounded
Game Viewport overlay; existing Runtime Respawn; i18n; focused regressions.
forbidden_scope: Runtime transition changes, UI authority, managers, restart,
next level, lives/checkpoints, menus, HUD redesign, persistence, or Sprint 25.
automated_tests: PASS — focused GenesisStudioShell lifecycle projection test;
Web typecheck; lint without errors (existing warnings only).
product_verification: PASS — PV A passed in real Studio: legitimate enemy
damage drove `world-1` to `failed`, Game Over exposed only `重生`, failed state
stayed stable, and Runtime respawn returned to `active` with the same world and
11 entities. PV B reached `completed` and Victory with no fabricated action;
the copy truthfully stated that the current world remains explorable, and
ArrowRight continued Player exploration in the same world/session. The
earlier v1.173 routing-regression preflight passed separately (`world-1` 7 →
12 via `再创建5个怪物`; explicit `创建一个新的游戏` → `world-2`). Console
diagnostics remained clean.

## WO-S24-002 — Runtime Completion Execution Gate

status: CANCELLED — Human/CTO clarification; no product code executed
priority: P0
dependencies: superseded by clarified Victory exploration contract
architecture_before: v1.173
architecture_after: NOT APPLICABLE — cancelled before implementation
measured_bottleneck: None. The observed completed + ArrowRight movement is
expected because Victory states that the current world remains explorable.
allowed_scope: None — cancelled.
forbidden_scope: Any change to `DefaultRuntimeExecutionLoop` that gates
`completed` or gives completed failed-state execution-stop semantics.
acceptance: Not applicable. No product code or Runtime regression test was
executed for this cancelled WO.
automated_tests: NOT RUN — no product code was changed.
product_verification: CANCELLED — no implementation occurred.

## SPRINT24_GAP_ANALYSIS_POST_PV

status: DONE — no new lifecycle-presentation blocker; SPRINT24_FREEZE_REVIEW selected
measured_result: PV A PASS. PV B PASS: the authoritative goal reached
`completed`, Victory truthfully stated that the current world remains explorable,
and real ArrowRight exploration moved Player x=641 → x=695 in the same world.
Browser console contained only Vite connection diagnostics.
conclusion: completed exploration is expected product behavior. Cancel
WO-S24-002; do not change Runtime execution gating.
next_work_order: SPRINT24_FREEZE_REVIEW — requires Human/CTO freeze decision;
Sprint 25 is not entered automatically.

## WO-S21-001 — Free-form World Evolution Front-door Fallback

status: DONE — Code Complete = YES; Product Verified = YES
priority: P0
dependencies: Sprint 20 FROZEN; explicit Human/CTO Sprint 21 authorization
architecture_before: v1.170
architecture_expected_after: v1.171
measured_bottleneck: `增加5个enemy` is rejected by the deterministic
IntentRouter target whitelist and reaches the create-only CommandExecutor as
`Unknown command`, even though the existing AI World Evolution planner,
counted `add-entity` delta, atomic semantic applier, targeted Runtime sync,
gameplay reconciliation, and visual grouping can execute a valid candidate.
allowed_scope: Existing Studio command front door; fallback into the existing
structured World Evolution planner; production-reachable paraphrase regression;
ADR/state documentation and required verification.
forbidden_scope: New intent framework/ontology, phrase-specific product
handlers, new World Evolution or Runtime authority, arbitrary code, full world
rebuild, layout framework, asset manager, conversational memory, or Sprint 22
work.
acceptance: Existing deterministic routes remain unchanged. Given a current
world, a deterministic miss can reach the existing AI planner and only a
validated candidate applies. The bounded Chinese/English enemy-addition
paraphrases reach `add-entity` with count 5, add exactly five semantic/Runtime
enemies at distinct existing-safe placements, retain Player/session, and plan
one canonical equivalent visual requirement. Malformed/stale provider results
remain non-applied through existing guards.
automated_tests: Web production front-door paraphrase regression; existing
IntentRouter, semantic-applier, Runtime synchronization, and focused World
Evolution regressions; package checks, typecheck, lint, and Web build.
verification: PASS — Web full suite (3543), focused AI/Shared/Runtime suites,
  Web typecheck, Web lint (existing warnings only), Web production build, and
  `git diff --check`.
product_verification: PASS — through the existing Codex CLI gateway, real Studio
  retained `world-1` and added exactly five enemies for `增加5个enemy` (1 → 6),
  then exactly five for `再加五只怪` (6 → 11). Player `(80,400)`, Health
  `100/100`, XP `0`, Level `1`, original entities, active gameplay, canonical
  Enemy visual reuse, and a clean browser warning/error log were preserved.
human_decision_required: NO

## SPRINT21_GAP_ANALYSIS_POST_WO-S21-001

status: DONE — non-Enemy ADD and REMOVE operation-diversity measurements passed
measured_result: In real Studio, `再加两个金币` added exactly two Coin entities,
  changing the Coin/collectible count `1 → 3` and Runtime entities `7 → 9`,
  while retaining `world-1`, Player, Health, XP/Level, Enemy, original world
  entities, active gameplay, compatible visual reuse, and clean diagnostics.
measured_result_remove: In real Studio, `删掉一个敌人` removed exactly one Enemy,
  changing Enemy `1 → 0` and Runtime entities `7 → 6`, while preserving
  `world-1`, Player, Health, XP/Level, collectible, terrain/Platform, active
  gameplay, visual synchronization, and clean diagnostics. The single-Enemy
  baseline made the remaining shared-Enemy visual condition inapplicable.
conclusion: Enemy/Coin ADD and Enemy REMOVE provide sufficient bounded Sprint 21
  evidence; REPLACE/world-property remain unmeasured candidates, not blockers.
next_work_order: NONE — no product WO; SPRINT21_FREEZE_REVIEW selected.

## SPRINT21_FREEZE_REVIEW

status: DONE — Human/CTO froze Sprint 21 at v1.171
inputs: WO-S21-001 DONE and real Studio measurements for Enemy ADD paraphrases,
  Coin ADD, and Enemy REMOVE, all using deterministic-miss fallback where
  required with same-session Runtime/Renderer continuity.
decision: FROZEN — Code Complete = YES; Product Verified = YES. No REPLACE,
  property mutation, conversational framework, phrase mappings, or semantic
  ontology was added.

## SPRINT22_DISCOVERY

status: DONE — real SPA product measurement found no current continuity blocker
mission: Audit the exact Studio ↔ Full Observatory lifecycle and measure whether
  a current game/session survives navigation without durable persistence.
measured_result: `useGameStore` retains `Runtime` and `RuntimeWorldStore` at
  Pinia application scope while `GameViewportPanel` only releases Pixi/input
  presentation resources. In real Studio, `world-1` changed `7 → 12` through
  `增加5个enemy`; Full Observatory showed Runtime entities `12`; return retained
  the same world, Player `(80,400)`, Health `100/100`, and 12 entities; then
  `再加两个金币` succeeded, reaching 14 entities. Browser warnings/errors were
  empty.
conclusion: The historical navigation-loss report is not reproducible on the
  current SPA route. Do not add a SessionManager, persistence, reload handler,
  router rewrite, or product WO.
next_work_order: NONE — SPRINT22_FREEZE_REVIEW selected.

## SPRINT22_FREEZE_REVIEW

status: DONE — Human/CTO froze Sprint 22 at v1.171
decision: FROZEN — Code Complete = YES; Product Verified = YES. The historical
Studio → Full Observatory loss is NOT REPRODUCED IN CURRENT PRODUCT; refresh,
close, and durable persistence remain out of scope.

## WO-S23-001 — Generation Prompt Truth and Targeted Retry

status: DONE — Code Complete = YES; Product Verified = YES
priority: P0
architecture_before: v1.171
architecture_expected_after: v1.172
measured_bottleneck: The exact Codex CLI provider prompt is built after the
browser request and is not projected to the user; a failed canonical asset has
no explicit targeted retry action even though grouping, incremental manifest
publication, resolver invalidation, and Renderer application already exist.
allowed_scope: Preserve the exact provider-submitted prompt on the existing
operation, project it through existing Observatory generation details, and add
one explicit failed-canonical-asset retry using the existing request/context,
manifest, resolver, and Renderer seams.
forbidden_scope: Manager/queue/persistence/event-sourcing infrastructure,
automatic retries, multi-provider orchestration, world rebuild, successful
asset regeneration, Runtime/session reset, or historical i18n cleanup.
acceptance: Original failure stays immutable; retry receives a new operation ID
linked to it, reuses one canonical identity and existing bindings, updates only
that manifest identity on success, and leaves successful assets/world/session
untouched. The UI exposes only the exact final prompt returned by the provider.
product_verification: PASS — real Codex CLI Studio verified exact final prompt
truth, editable prompt override, successful targeted regeneration, operation
lineage, `published → resolved → Renderer applied`, same `world-1` Runtime
session, and clean diagnostics. A live provider failed/timeout event was not
observed. CTO-authorized controlled product-reachability coverage begins at
the Web retry entry, preserves original failed A, creates lineage-linked B,
recovers only its canonical identity, retains an unrelated ready asset, and
preserves the Runtime world and Player.

## SPRINT23_GAP_ANALYSIS_POST_WO-S23-001

status: DONE — SPRINT23_FREEZE_REVIEW selected
measured_result: The Sprint thesis is satisfied: users can inspect the actual
provider request and safely regenerate or recover one canonical asset without
losing successful assets or the active game. Real provider evidence covers
successful regeneration; controlled product-reachability covers failure
recovery. No live natural provider failed/timeout was observed or claimed.
conclusion: No new bounded transparency/recovery blocker exists. Do not add
generation-management variants merely to seek more failure cases.
next_work_order: SPRINT23_FREEZE_REVIEW — requires Human/CTO freeze decision;
Sprint 24 is not entered automatically.

## Queue rules

- Select the highest-priority READY item with satisfied dependencies.
- A READY item with an open human decision is selectable for review but cannot
  enter IN_PROGRESS until the decision is recorded.
- At most one primary architecture-changing work item may be IN_PROGRESS.
- A work item is DONE only after implementation, verification, architecture
  review, and Product Verification gates required by that item pass.
- WO-META-003 must not execute product work as a side effect.
- Control-plane work orders must not execute product work or satisfy a product
  Product Verification gate as a side effect.
- Under `SPRINT_CONTINUOUS`, a completed product WO triggers one bounded gap
  analysis and exactly one generated next READY/BLOCKED WO. The Supervisor may
  execute that one next WO in the same Sprint only after its dependencies,
  decision gates, and verification scope are satisfied.
- The queue horizon is completed history plus one current READY/BLOCKED item;
  do not pre-generate a future Sprint backlog.
- `SPRINT_CONTINUOUS` is sequential, not parallel: only one primary WO is
  selected/executed at a time, and each discovery pass may generate exactly one
  next WO.
- A generated WO is READY only after the evidence, scope, dependency,
  architecture, verification, and human-decision quality gates pass. An open
  high-impact authority or product-direction choice makes it BLOCKED.
- If the current Sprint checkpoint is already satisfied, generate
  `SPRINT_FREEZE_REVIEW` instead of another feature WO and stop for review.
- At the Sprint boundary, after freeze/review evidence is complete, stop and
  require explicit Human/CTO direction before entering another Sprint.
  `SPRINT_CONTINUOUS` never executes across Sprint boundaries automatically.
- A completed Sprint Freeze Review may generate at most one high-level next
  Sprint discovery or BLOCKED human-decision item; it must not pre-generate a
  future Sprint feature backlog or cross the Sprint boundary automatically.

## WO-S20-001 — Playable Platform Geometry

status: DONE
priority: P0
dependencies: Sprint 19 FROZEN; explicit Human/CTO Sprint 20 authorization
architecture_before: v1.167
architecture_after: v1.170
mission: Make the existing generated semantic Platform a Runtime-authoritative,
bounded, landable gameplay surface without image-derived collision or a
genre-specific Runtime.
allowed_scope: Semantic Platform → Runtime collision bounds projection;
existing gravity/vertical-motion/ground-collision seam; focused Runtime and
production-chain regressions; ADR and state documentation.
forbidden_scope: Physics engine, Platform/Terrain/Physics manager, image-based
collision, solid-all-sides policy framework, moving platforms, slopes, enemy
AI, and Sprint 21 work.
acceptance: PASS (automated) — descending Player lands on and remains supported
by Platform; leaving horizontal bounds resumes falling; global Ground remains;
upward passage remains valid for the current elevated layout; Platform remains
semantic/runtime-distinct from Ground; real registered-system-chain regression
passes.
  The rendered Platform uses the same center-anchored rectangle as Runtime
  collision geometry; no transparent offset remains.
  Player feet land on that top surface, matching the existing Ground and
  Player Renderer coordinate contract.
verification: PASS — Shared 209, AI 9407, Runtime 696, and Web 3537 tests;
affected type checks; package lint with only pre-existing warnings; Web build;
`git diff --check`. Root Turbo typecheck did not start because the local
keychain/TLS environment cannot initialize its API client.
product_verification: YES — Human Product Verification passed on 2026-08-26:
landing, standing, horizontal movement, edge fall, gravity resumption, Ground,
and existing gameplay behavior are verified.
human_decision_required: NO

## WO-S15-004 — Minimal Gameplay Rule Execution Vertical Slice

status: DONE
priority: P0
dependencies: WO-S15-003
architecture_before: v1.150
architecture_after: v1.151
mission: Execute one truthful contact-to-remove gameplay rule through Runtime.
allowed_scope: Bounded matching, supported conditions, one REMOVE_ENTITY action,
  existing WorldMutator, result observation, and regression/product verification.
forbidden_scope: Score, damage, goals, timers, spawn, arbitrary code, rich
  transactions, and gameplay-rule evolution.
acceptance: PASS — player contact with an item can remove the target; deferred,
  stale, unsupported, and Player-removal paths remain gated.
verification: Runtime/Renderer/Shared/AI/Web checks and local Studio browser
  verification passed; see ADR-0265 and SPRINT15_BACKLOG.md.
product_verification: YES
human_decision_required: NO

## WO-META-003 — Genesis Multi-Agent Engineering Supervisor Foundation

status: DONE
priority: P0
dependencies: WO-S15-004
architecture_before: v1.151
architecture_after: v1.151
mission: Establish a repository-native Supervisor control plane for bounded,
  human-controlled future engineering work.
allowed_scope: Engineering Markdown projections, Supervisor operating policy,
  delegation/review rules, queue preparation, dry-run documentation, and a
  minimal AGENTS.md pointer.
forbidden_scope: Genesis Runtime, Gameplay, Renderer, provider, application
  service, CI deployment, external orchestration dependency, database, queue
  service, auto-merge, or autonomous product work.
acceptance: PASS — all seven control documents exist; authority, loop, repair
  budget, escalation, roles, delegation, worktrees, gates, continuation mode,
  and next READY item are documented.
verification: Markdown inspection, dry run, source/wiring audit, git diff check,
  and read-only architecture review delegation.
product_verification: NOT_APPLICABLE — no user-visible product behavior changed.
human_decision_required: NO

## WO-S15-005 — Enemy Stomp Gameplay Rule Vertical Slice

status: DONE
priority: P1
dependencies: WO-S15-004 DONE; measured Studio bottleneck satisfied by the
  approved ENEMY STOMP decision
architecture_before: v1.151
architecture_after: v1.152
architecture_expected_after: v1.152
mission: Execute the approved generic enemy-stomp scenario end to end: a
  Runtime-owned AABB contact from player above enemy emits direction=top,
  matches the enemy-stomp GameplayRule, validates player/enemy/top conditions,
  and commits remove-target plus upward player velocity while preserving the
  existing Runtime/Renderer loop.
allowed_scope: Finalize the typed contact-direction event contract; derive
  direction only from Runtime position/collision-bounds geometry; execute the
  existing generic GameplayRuleSet through the smallest trusted APPLY_VELOCITY
  primitive; define rule-level staged all-or-nothing semantics for the two
  trusted actions; update Genesis capability truth, focused regressions,
  Observatory evidence, and real Studio product verification.
forbidden_scope: Mario-specific Runtime/System or EnemyStompSystem; damage,
  health, goals, score, XP, timers, spawners, question blocks, arbitrary code,
  eval/scripts, generic transaction framework, rich gameplay engine, silent
  partial commits, Runtime/world/Renderer full rebuild, provider capability
  authority, gameplay-rule evolution, or automatic WO-S15-006 continuation.
acceptance: ENEMY STOMP is supported only through the generic rule path;
  contact direction is a truthful Runtime geometry fact; top contact matches
  and non-top contact does not; player/enemy conditions pass; REMOVE_ENTITY
  and APPLY_VELOCITY both commit exactly once; a failed later action rolls back
  earlier staged actions without partial commit; stale RuleSet/World A facts
  cannot affect World B; deferred damage remains visibly non-executed; tests,
  architecture review, and required product verification pass.
verification: PASS — Runtime/Shared/AI/Web focused and affected-package tests,
  TypeScript, ESLint, relevant regression suites, web build, git diff check,
  independent architecture review, and AUTO/MANUAL/PENDING/BLOCKED Product
  Verification classification. Browser evidence showed contact direction,
  rule match, conditions passed, both action results, enemy removal in Runtime
  and Renderer, upward bounce, re-landing, continued control, no camera reset,
  no rebuild, exactly-once behavior, stale isolation, and clean console.
product_verification: YES — MANUAL Studio verification completed on 2026-08-21;
  AUTO gates cover stale isolation, rollback, exactly-once, and Observatory
  truth, while the real browser path covers the visible gameplay sequence.
human_decision_required: NO — ENEMY STOMP and its acceptance boundary were
  explicitly approved in the Supervisor request on 2026-08-21.

## WO-META-004 — Subagent Delegation & Lifecycle Hardening

status: DONE
priority: P0
dependencies: WO-S15-005 DONE; Supervisor Trial #1 evidence available
architecture_before: v1.152
architecture_after: v1.152
mission: Harden delegation granularity, lifecycle/wait semantics, evidence
  ownership, and current Supervisor rollout policy without changing product
  architecture or executing the next product work order.
allowed_scope: Engineering Markdown policy and projections; Trial #1 lessons
  and PASS/FAIL scorecard; bounded subagent task contracts; targeted-test
  boundary; lifecycle/cancellation/checkpoint rules; evidence ownership;
  concurrency and worktree rules; Completion Report extension; S15-006 READY
  preparation; one optional narrow read-only delegation test; dry-run records.
forbidden_scope: Genesis product code; Runtime, Gameplay, Renderer, AI
  provider, or Web changes; new dependencies; orchestration server, database,
  queue service, custom RPC, recursive agent tree, SPRINT_CONTINUOUS, or
  execution of WO-S15-006.
acceptance: PASS — Trial #1 lessons are recorded; delegated tasks are one
  bounded question or code slice; subagent tests are targeted by default;
  Supervisor owns all final gates; waits alone do not imply failure;
  cancellation and zero-evidence rules are explicit; timed-out reviewers do
  not satisfy gates; max concurrent subagents is 2; nested spawning is
  disabled; shared contracts remain Supervisor-owned; prompt templates,
  re-delegation budget, report extension, and trial scorecard are documented;
  WO-S15-006 is prepared READY with the approved DAMAGE/HEALTH boundary; dry
  run and optional narrow delegation test are truthful; no product source
  changed.
verification: PASS — Markdown inspection, work queue/current state review,
  policy dry run, one bounded read-only Health audit, agent lifecycle close,
  no product-source diff, and `git diff --check`.
product_verification: NOT_APPLICABLE — control-plane-only change; WO-S15-005
  remains the last Product Verified product work order.
human_decision_required: NO — Trial #1 tuning and the S15-006 scenario were
  explicitly provided/accepted in the Supervisor request on 2026-08-24.

## WO-S15-006 — Damage / Health Gameplay Rule Vertical Slice

status: DONE
priority: P1
dependencies: WO-S15-005 DONE; measured gameplay goal recorded; DAMAGE/HEALTH
  scenario accepted on 2026-08-24
architecture_before: v1.152
architecture_after: v1.153
architecture_expected_after: v1.153
mission: Prove the smallest generic side-contact damage path: player side
  contact with an enemy produces a truthful Runtime contact fact, matches a
  generic rule, executes trusted `DAMAGE_ENTITY(eventActor)`, and decreases an
  authoritative generic Health value without introducing death/game-over
  systems.
allowed_scope: Generic Health component/state; typed `DAMAGE_ENTITY` action;
  generic side-contact rule; existing Runtime event/rule/mutation boundaries;
  stale/world isolation; truthful Observatory execution state; targeted tests
  and required browser Product Verification.
forbidden_scope: EnemyDamageSystem or Mario-specific Runtime; generated code;
  full rebuild; respawn; lives; game-over UI; death flow unless a minimum
  truthful zero-health representation is strictly unavoidable; invincibility
  frames unless measured behavior proves required; knockback; XP; score; goal
  completion; enemy AI; timers; spawners; progression; unrelated rich actions;
  arbitrary code/eval; autonomous WO continuation.
acceptance: PASS — Supervisor fixed the shared Health/DAMAGE_ENTITY contract;
  generic rule-driven non-top contact damage decreases authoritative current
  Health, preserves max, fails safely without Health, keeps zero as state only,
  and introduces no death/game-over system. Existing binding, stale/world,
  exactly-once, and truthful deferred-rule gates remain active.
verification: PASS — Shared/Runtime/AI/Renderer/Web affected-package tests,
  direct TypeScript checks, direct ESLint checks, Web build, git diff check,
  ADR/architecture review, and real Chrome Studio Product Verification pass.
product_verification: YES — MANUAL Studio verification completed on
  2026-08-24; full Observatory showed ENTITY_CONTACT_STARTED followed by
  committed enemy-contact-damage / DAMAGE_ENTITY execution, and Inspector
  Health changed from 100/100 to 93/100.
human_decision_required: NO — scenario selection was accepted previously and
  the detailed implementation contract was fixed by the Supervisor at start.

## WO-META-005 — Next-Work Discovery & Gap Analysis Foundation

status: DONE
priority: P0
dependencies: WO-S15-006 DONE; current Sprint goal and Product Verified
  capability evidence available
architecture_before: v1.153
architecture_after: v1.153
architecture_expected_after: v1.153
mission: Upgrade the Supervisor from executing human-prepared work items to
  discovering exactly one bounded next work item from the current Sprint goal
  and measured repository gaps, without executing that generated item.
allowed_scope: Engineering control-plane Markdown; explicit Sprint 15 goal;
  gap classification; measured-bottleneck policy; just-in-time WO generation;
  human-decision detection and decision log; short queue horizon;
  ONE_WORK_ITEM_WITH_DISCOVERY semantics; Sprint freeze detection; Trial #1/#2
  records; dry-run evidence and generated WO quality gate.
forbidden_scope: Genesis product code; Runtime, Gameplay, Renderer, AI,
  provider, or Web changes; next product WO execution; SPRINT_CONTINUOUS;
  full future roadmap generation; scoring/ML prioritization; project-management
  database; external issue tracker; new orchestration dependency.
acceptance: PASS — current Sprint 15 goal is explicit; gap classification and
  measured-bottleneck rules exist; exactly one next WO is generated; source
  evidence supports the selection; alternatives are recorded; human-decision
  detection, quality gates, freeze detection, out-of-Sprint deferral, and short
  horizon are documented; Trial #1/#2 and zero-subagent validity are recorded;
  continuation mode is ONE_WORK_ITEM_WITH_DISCOVERY; SPRINT_CONTINUOUS remains
  disabled; the generated WO is not executed; no product architecture/code
  changed.
verification: PASS — control-plane consistency, source/capability evidence
  audit, generated-WO self-review, queue dependency/state review, current
  architecture check, and git diff check.
product_verification: NOT_APPLICABLE — control-plane-only change; last product
  verification remains the MANUAL WO-S15-006 Studio evidence.
human_decision_required: NO — this META WO records the decision gate but does
  not choose the goal-completion authority.
historical_generated_next_work_order: WO-S15-007 BLOCKED → unblocked by the
  accepted Human/CTO decision recorded in HUMAN_DECISION_LOG.md
optional_architecture_review: PASS — Supervisor read-only self-review against
  the invariants; no subagent was needed for this docs-only generated-WO audit.
historical_note: The continuation assertions above describe the control-plane
  state when WO-META-005 completed. The current queue mode is the later
  explicitly accepted `SPRINT_CONTINUOUS` policy declared at the top of this
  file.

## WO-S15-007 — Goal Completion Gameplay Rule Vertical Slice

status: DONE
priority: P1
state_transition: BLOCKED → READY (Human decision accepted 2026-08-24) →
  IN_PROGRESS → VERIFYING → DONE
dependencies: WO-S15-006 DONE; Human/CTO completion-authority decision ACCEPTED
  on 2026-08-24
architecture_before: v1.153
architecture_after: v1.154
architecture_expected_after: v1.154 — RuntimeGameplaySessionState owns the
  current world/session completion truth while preserving Runtime authority
  boundaries
mission: Add the smallest generic goal-contact success path so a platformer
  with `completionMode=goal` can produce one truthful authoritative completion
  result through the existing GameplayEvent → GameplayRule → trusted Runtime
  execution path, without adding failure/progression systems.
measured_bottleneck: Verified S15 capabilities include movement/jump continuity,
  event-driven contact, collectible removal, enemy stomp, and non-top Health
  damage. Sprint acceptance still requires a truthful success/goal path.
  `reach-goal` is modeled, the deterministic RuleSet emits `COMPLETE_GOAL`, but
  the action remains deferred and no Runtime or session completion state exists.
gap_classification: PRODUCT_GAP + ARCHITECTURE_GAP + EXECUTION_GAP;
  VERIFICATION_GAP follows from the missing executable capability.
decision_gate: RESOLVED — Human/CTO accepted RuntimeGameplaySessionState as the
  sole current world/session completion authority, with terminal idempotent
  completion and reset only on world/session replacement.
allowed_scope: The selected narrow completion-state contract; promote only the
  validated `COMPLETE_GOAL` primitive; generic player/goal contact matching;
  current world/session/semantic binding and exactly-once behavior; immutable
  completion mutation/result; truthful Runtime/Renderer/Observatory projection;
  focused Shared/AI/Runtime/Web tests; required Chrome Studio verification.
forbidden_scope: Death, respawn, lives, game-over, invincibility, knockback,
  score, XP, progression, timers, spawners, enemy AI, multi-goal orchestration,
  generic game-state store, unrelated rule actions, rich transaction framework,
  full-world rebuild, provider-specific logic, generated code, eval, or
  SPRINT_CONTINUOUS.
implementation_boundaries: Shared owns the immutable selected completion
  contract; AI owns capability-derived support truth and deterministic rule
  mapping; Runtime owns the selected authoritative mutation/execution boundary;
  Renderer consumes committed Runtime projections; Web/Observatory keeps raw
  contact, rule result, completion result, and Runtime World surfaces distinct.
acceptance: After the decision is accepted, a real player → goal contact emits
  a Runtime-owned contact fact, matches the generic `reach-goal` RuleSet entry,
  executes `COMPLETE_GOAL` exactly once, commits the selected authoritative
  completion state for the current world/session, and remains isolated from
  stale RuleSets and other worlds. Repeated completion follows the chosen
  idempotence contract; world/session replacement follows the chosen reset or
  rebind contract; no entity removal, camera reset, or unrelated gameplay
  behavior is introduced.
automated_tests: Shared immutable completion contract and serialization;
  AI capability promotion and deterministic goal-rule construction; Runtime
  goal contact, selected state mutation, exactly-once, stale/world isolation,
  reset/rebind, and unsupported/missing-target safety; Web/Renderer truthful
  Observatory and Runtime projection regressions.
product_verification: YES — MANUAL Studio verification completed on 2026-08-24.
  A normal platformer reached Runtime session `completed` through real movement
  and jump input; Observatory showed the committed status while Runtime stayed
  Live, and replacing the world produced `world-2` with `active` status. Focused
  automated evidence covers the raw contact/rule boundary, idempotent no-op,
  stale isolation, semantic-revision retention, and clean browser logs.
observability_expectations: Keep the raw contact fact, rule match/conditions,
  action result, committed completion state, and Runtime World projection as
  separate entries/surfaces. Deferred or stale completion must remain visibly
  non-executed and must never be inferred from a label.
completion_report_requirements: Standard Completion Report with architecture
  before/after, product architecture status, selected authority decision,
  changed files, real flow, tests, TypeScript, ESLint, build if Web/Runtime
  wiring changes, architecture review, Product Verification, manual steps,
  Code Complete, and Product Verified.
quality_gate: PASS — evidence is source-backed; the goal path directly blocks
  the Sprint checkpoint; scope is one generic, testable, product-measurable
  slice; non-goals are explicit; invariants and dependencies are preserved;
  Product Verification is feasible after the decision; no speculative
  infrastructure is required; and the human-decision gate is recorded.
explicit_non_goals: No death/failure flow, progression, score, persistence,
  generic state architecture, or future Sprint planning.
human_decision_required: NO — accepted decision is recorded in
  HUMAN_DECISION_LOG.md; all implementation and verification gates passed.

optional_architecture_review: PASS — Supervisor reviewed the committed source
  path against ADR-0268 and ENGINEERING_INVARIANTS.md; no bounded subagent was
  needed because the change set and evidence were directly auditable.

## SPRINT_FREEZE_REVIEW — Sprint 15 Gameplay Mechanics Foundation

status: DONE
priority: P0
state_transition: BLOCKED → READY (Human/CTO decision accepted 2026-08-24) →
  IN_PROGRESS → VERIFYING → DONE
dependencies: WO-S15-007 DONE; Sprint 15 minimum checkpoint evidence available
architecture_before: v1.154
architecture_after: v1.154
architecture_expected_after: v1.154
mission: Human/CTO review of the completed Sprint 15 bounded gameplay slice;
  decide whether to freeze the Sprint or authorize a separately scoped next
  direction.
measured_bottleneck: The Sprint 15 minimum checkpoint is satisfied through
  current-session goal completion. Remaining gaps are explicitly deferred
  failure/progression/product-direction work, not an unverified implementation
  blocker.
gap_classification: QUALITY_GAP + DEFERRED_OUT_OF_SPRINT
decision_gate: RESOLVED — Human/CTO authorized this Freeze Review and limited it
  to the Sprint-level product thesis; deferred future mechanics are not required.
allowed_scope: Read-only review of WO-S15-007 evidence, ADR-0268, current state,
  capability matrix, and deferred boundaries; record the human decision.
forbidden_scope: Product code changes, automatic next-feature execution,
  victory/death/progression implementation, and future backlog pre-generation.
acceptance: PASS — all sixteen Sprint-level criteria in SPRINT15_REVIEW.md are
  satisfied; Sprint 15 is Code Complete = YES, Product Verified = YES, and
  FROZEN = YES. Architecture remains v1.154 and no Sprint 16 implementation
  was executed.
verification: PASS — source/runtime audit, accumulated Studio evidence review,
  affected-package regression evidence, TypeScript, ESLint, Web build, queue
  consistency, and git diff check.
product_verification: YES — accumulated manual Studio evidence covers the
  required collectible, stomp, damage/Health, goal completion, continuity,
  isolation, and clean-console paths.
observability_expectations: Preserve the completed WO-S15-007 evidence and
  keep deferred capabilities visibly deferred in all projections.
completion_report_requirements: Record the sixteen-criterion evidence matrix,
  freeze decision, resulting queue transition, and one measured next Sprint
  horizon without executing it.
explicit_non_goals: No product implementation, no Sprint 16 execution, and no
  automatic continuation.
human_decision_required: NO — Freeze Review decision and Sprint acceptance are
  recorded in HUMAN_DECISION_LOG.md and SPRINT15_REVIEW.md.

optional_architecture_review: PASS — Supervisor reviewed the current source
  wiring against the Sprint thesis and ENGINEERING_INVARIANTS.md; no product
  architecture changed during the freeze review.

## SPRINT16_DISCOVERY — Gameplay-Preserving World Evolution

status: DONE
priority: P1
state_transition: BLOCKED → READY (Human/CTO decision accepted 2026-08-24) →
  IN_PROGRESS → VERIFYING → DONE
dependencies: Sprint 15 FROZEN; Human/CTO targeted Gameplay Rule Reconciliation
  decision recorded
architecture_before: v1.154
architecture_after: v1.154 (decision-resolution only; no product architecture
  changed)
architecture_expected_after: v1.154 before product implementation; the
  generated product WO owns any justified architecture-version change
mission: Measure and define the next Sprint-level thesis for preserving
  truthful generic gameplay intent across natural-language World Evolution and
  generate the first bounded implementation WO after the direction is accepted.
measured_bottleneck: Semantic World Evolution currently updates the semantic
  and Runtime worlds but marks the world-bound GameplayRuleSet stale because
  automatic gameplay-mechanics synchronization is not implemented. The initial
  gameplay slice is coherent; the cross-Sprint gap is targeted evolution
  continuity rather than a Runtime execution rewrite.
gap_classification: PRODUCT_GAP + ARCHITECTURE_GAP
decision_gate: RESOLVED — Human/CTO selected targeted Gameplay Rule
  Reconciliation and explicitly rejected blind stale preservation and full AI
  regeneration as the default.
allowed_scope: Read-only source and product review; define the reconciliation
  inputs, affected-rule boundaries, deterministic fallback, authority/lifecycle
  contract, acceptance evidence, and one generated product WO.
forbidden_scope: Sprint 16 implementation, automatic RuleSet synchronization,
  failure/progression features, future Sprint backlog generation, generic
  gameplay managers, or autonomous continuation.
acceptance: PASS — Human/CTO decision is recorded; the bounded reconciliation
  contract is explicit; exactly one READY product WO was generated and is not
  executed in this continuation.
automated_tests: None required for this control-plane discovery; source-backed
  evidence covers `gameStore.planEvolution`, `SemanticWorldMutationResult`,
  `markGameplayRuleSetStale`, and the existing deterministic
  `DefaultGameplayRuleBuilder`.
product_verification: NOT_APPLICABLE — discovery only; product verification is
  owned by WO-S16-001.
observability_expectations: Keep semantic delta, Runtime World, current
  GameplaySpecification, current/reconciled RuleSet, session authority, and
  Renderer/Observatory projections distinct; no planned or stale rule may be
  presented as committed execution.
completion_report_requirements: Record the Human/CTO direction, the selected
  authority and lifecycle, the measured bottleneck, one bounded product WO,
  and the resulting queue transition.
explicit_non_goals: No Sprint 16 code, no automatic continuation, and no
  feature work outside the accepted reconciliation contract.
human_decision_required: NO — accepted decision recorded in
  HUMAN_DECISION_LOG.md.

## WO-S16-001 — Targeted Gameplay Rule Reconciliation Across World Evolution

status: DONE
state_transition: READY → IN_PROGRESS → VERIFYING → DONE
priority: P1
dependencies: SPRINT16_DISCOVERY DONE; Human/CTO targeted reconciliation
  decision accepted 2026-08-24
architecture_before: v1.154
architecture_expected_after: v1.155
architecture_after: v1.155 — ADR-0269 accepted; targeted reconciliation is a
  real product architecture delta at the semantic-evolution commit boundary
mission: After an applied semantic World Evolution delta, produce a new current
  world-bound GameplayRuleSet by preserving unaffected rules, revalidating
  affected rules, removing invalid rules, and deterministically rebuilding
  affected known rules through the existing GameplaySpecification and
  GameplayRuleBuilder path.
measured_bottleneck: Verified generic gameplay execution and targeted semantic,
  Runtime, visual, and session continuity already exist, but
  `gameStore.planEvolution` currently calls `markGameplayRuleSetStale` for any
  applied semantic revision. That globally disables the current RuleSet and
  leaves the same-session gameplay slice inactive after unrelated evolution.
gap_classification: PRODUCT_GAP + EXECUTION_GAP + ARCHITECTURE_GAP
decision_gate: RESOLVED — targeted reconciliation is the accepted strategy;
  provider/AI regeneration is a fallback only for genuinely new or ambiguous
  gameplay intent that cannot be derived from current deterministic inputs.
allowed_scope: Add the smallest provider-independent reconciliation contract
  and implementation in existing Shared/AI/Web ownership boundaries; consume
  `GameWorldModel`, `GameplaySpecification`, current `GameplayRuleSet`,
  applied `SemanticWorldMutationResult`/delta, and the capability catalog;
  integrate the result at the current semantic-evolution commit boundary;
  expose truthful reconciliation facts through the existing Observatory path;
  add focused Runtime/AI/Shared/Web regressions and manual Studio verification.
  If an evolution introduces genuinely new or ambiguous gameplay intent that
  cannot be derived from these deterministic inputs, record it as an explicit
  deferred/AI-fallback case rather than silently regenerating the whole RuleSet.
forbidden_scope: Blindly preserve a stale RuleSet; full AI/provider RuleSet
  regeneration after every evolution; full Runtime, Renderer, or current-world
  rebuild; GameplayRuleManager; generic workflow engine; event sourcing; a
  second gameplay authority; entity-ID-prefix archetype inference; arbitrary
  code/eval/scripts; death/game-over, respawn, score, XP, progression, timers,
  spawning, waves, or broad World Evolution infrastructure.
implementation_boundaries: `GameplaySpecification` remains design-intent
  authority; the reconciled `GameplayRuleSet` is the executable plan; Runtime
  remains execution/state authority; Web/Pinia/Observatory remain projections.
  Reconciliation must be immutable and deterministic for known changes. Exact
  entity selectors are checked against current semantic entities; archetype,
  category, and role selectors use current semantic truth. A semantic revision
  change alone does not invalidate all rules. Unaffected execution continues in
  the same Runtime/session, and World A rules/results are rejected for World B.
acceptance: PASS only when all of the following are proven: (1) an unrelated
  semantic evolution preserves current executable rules and binds the new
  semantic revision; (2) a targeted entity/category/archetype change affects
  only the rules whose selectors, references, mechanics, or dependencies are
  actually impacted; (3) removed exact targets cannot leave dangling executable
  rules; (4) affected known rules are revalidated or deterministically rebuilt
  from the current GameplaySpecification/RuleBuilder, while unresolvable rules
  are removed or visibly deferred rather than falsely executed; (5) a semantic
  revision-only change never globally disables the RuleSet; (6) provider/AI is
  not called for deterministically reconcilable changes; (7) current Runtime
  gameplay continues in the same session without full-world rebuild; (8) stale
  World A rules/results cannot affect World B; and (9) Observatory separates
  preserved, revalidated, rebuilt, removed/deferred reconciliation facts from
  Runtime execution facts.
automated_tests: Focused Shared/AI/Runtime/Web tests must cover unrelated world
  property/addition preservation, targeted replace/remove invalidation,
  dangling exact-reference rejection, current semantic category/archetype
  resolution, deterministic output and ordering, provider non-invocation on
  known changes, semantic revision binding, same-session execution continuity,
  and World A/World B isolation; then run affected-package regressions,
  TypeScript, ESLint, and Web build when integration changes.
product_verification: REQUIRED — Studio must evolve the current playable world
  in one session, observe an unrelated change preserving an executable rule,
  observe a targeted change removing/rebuilding only affected rules, continue
  movement/jump and an unaffected mechanic, and show truthful current RuleSet,
  Runtime, and Observatory state with no browser errors.
observability_expectations: Preserve separate semantic mutation, reconciliation
  result, current RuleSet binding/revision, raw GameplayEvents, committed rule
  results, Runtime World/session state, and Renderer projection. Reconciliation
  must not be reported as gameplay execution.
completion_report_requirements: Report architecture before/after, files,
  actual reconciliation call chain, focused and affected-package tests,
  TypeScript, ESLint, build, manual Studio steps/results, authority and stale
  isolation review, deferred boundaries, Code Complete, and Product Verified.
explicit_non_goals: No broad World Evolution Sprint, no AI-generated gameplay
  redesign, no progression/failure systems, no Runtime/Renderer rebuild, and no
  automatic execution of a subsequent WO.
human_decision_required: NO — the reconciliation strategy and boundaries are
  accepted; routine implementation details remain Supervisor-owned.

completion_evidence: PASS — deterministic Shared/AI reconciliation preserves
  unaffected rules, rebuilds/removes targeted rules, binds the updated semantic
  revision, keeps the same Runtime/session loop active, and exposes separate
  Observatory reconciliation stages/events. Provider/AI is not used by this
  known-change path and World A/World B binding guards remain intact.
focused_tests: PASS — Shared contract through Web integration; AI 3/3;
  Runtime gameplay execution 15/15; Web World Evolution 6/6; Web Gameplay
  Generation 3/3; AI GameplayRule 3/3.
affected_package_gates: PASS — direct TypeScript, package ESLint, affected
  package regressions, and Web build; root Turbo typecheck wrapper remains a
  managed-environment TLS/keychain limitation documented in CURRENT_STATE.
product_verification: PASS — manual Studio session on 2026-08-24 covered
  unrelated preservation, targeted reconciliation/removal, the same-session
  Running movement/jump control surface, unaffected gameplay, current
  RuleSet/Runtime/Observatory truth, and clean browser logs; Runtime/Renderer
  regression suites provide the authoritative movement/jump continuity proof.
code_complete: YES
product_verified: YES

## SPRINT_FREEZE_REVIEW — Sprint 16 Gameplay Evolution & Progression Foundation

status: DONE
state_transition: GENERATED_AFTER_WO-S16-001 → IN_PROGRESS → VERIFYING → DONE
priority: P0
dependencies: WO-S16-001 DONE; Sprint 16 acceptance evidence complete
mission: Re-evaluate the corrected Sprint 16 goal after the completed targeted
  Gameplay Rule reconciliation bridge; record whether Part 2 progression work
  is required before freeze.
measured_bottleneck: WO-S16-001 closes Gameplay-Preserving World Evolution,
  but no authoritative Runtime numeric progression state exists. The Shared/AI
  schema already describes `CHANGE_NUMERIC_STATE` and `gameState`, while the
  Runtime executor still treats the action as unsupported.
decision_gate: RESOLVED — Human/CTO chose CONTINUE. Sprint 16 is NOT READY FOR
  FREEZE; Part 1 remains Product Verified and Part 2 must be advanced before a
  new freeze review.
allowed_scope: Review the Sprint 16 goal, ADR-0269, capability matrix,
  SPRINT16_REVIEW.md, automated evidence, and manual Studio evidence; record
  the decision, corrected goal, measured bottleneck, and one next bounded WO.
forbidden_scope: Automatic freeze, automatic cross-Sprint execution, or
  generating more than one next product WO.
acceptance: PASS — Human/CTO recorded CONTINUE; Sprint 16 remains open and
  exactly one next bounded READY product WO was generated.
product_verification: ALREADY PASS — WO-S16-001 Product Verified YES; this
  item is a Sprint governance decision rather than a new product slice.
human_decision_required: NO — CONTINUE decision recorded by Human/CTO on
  2026-08-24; routine implementation remains Supervisor-owned.

## WO-S16-002 — First Generic Progression Loop: Authoritative Numeric State

status: DONE
state_transition: READY → IN_PROGRESS → VERIFYING → DONE
priority: P1
dependencies: SPRINT_FREEZE_REVIEW DONE; WO-S16-001 DONE; Human/CTO CONTINUE
  decision recorded; no unresolved architecture/product-direction gate
architecture_before: v1.155
architecture_expected_after: v1.156
architecture_after: v1.156 — ADR-0270 accepted; Runtime-owned numeric
  progression state and the supported additive action are wired end to end.
mission: Close the smallest measured Part 2 bottleneck by carrying one
  validated `CHANGE_NUMERIC_STATE` Gameplay Rule action from a real Runtime
  gameplay event to an authoritative, immutable, Runtime-owned numeric
  progression state. `experience` is the first state key/use case; the
  primitive remains generic and is not a Survivor-specific system.
measured_bottleneck: `GameplayNumericReference.gameState` and
  `CHANGE_NUMERIC_STATE` existed in Shared/AI schema and validation, but the
  capability catalog marked the action deferred, Runtime had no numeric state
  store, and `DefaultGameplayActionExecutor` rejected the action. WO-S16-002
  closed this measured XP-acquisition gap without pre-planning thresholds or
  level-up behavior.
gap_classification: PRODUCT_GAP + EXECUTION_GAP + ARCHITECTURE_GAP
allowed_scope: Add the smallest Runtime-owned immutable numeric progression
  state bound to the current world/session; execute finite numeric deltas through
  the existing GameplayRuleExecutor and World/Renderer loop; preserve state
  across non-replacing semantic revision changes and reset it on world/session
  replacement; expose committed progression facts through ExecutionTickResult,
  Renderer, and the existing Observatory Runtime projection; promote only the
  `CHANGE_NUMERIC_STATE` primitive to Genesis-supported and add focused
  Shared/AI/Runtime/Renderer/Web regressions.
forbidden_scope: SurvivorRuntime, XPManager, ProgressionManager, level
  thresholds, level-up transitions, upgrade/skill selection, modifiers, score
  policy, timers, spawners, waves, death/respawn, generic workflow engines,
  arbitrary generated code/eval/scripts, a second gameplay authority, provider
  regeneration, or offline World Evolution fallback.
implementation_boundaries: Runtime owns the committed progression state;
  GameplayRuleSet remains the executable plan; GameplaySpecification remains
  design intent; Web/Pinia/Observatory only project Runtime facts. The state
  is a small keyed finite-number map with deterministic additive deltas. No
  threshold evaluator or progression manager is introduced.
acceptance: PASS — (1) a supported `CHANGE_NUMERIC_STATE` rule executes from a
  real GameplayEvent and commits an immutable numeric value; (2) non-finite
  amounts, empty keys, missing state, stale World A bindings, and failed later
  actions do not commit; (3) multiple deltas are deterministic and rule-level
  atomic; (4) the same Runtime/session retains state across semantic revision
  changes while a new world/session resets it; (5) `NUMBER_COMPARE`, thresholds,
  levels, skills, modifiers, spawn/wave behavior remain explicitly deferred;
  and (6) Observatory shows committed state separately from raw events and
  rule results.
automated_tests: PASS — Shared 9 files/207 tests; AI 156 files/9,402 tests;
  Runtime 23 files/689 tests; Renderer 25 files/485 tests; Web 47 files/3,528
  tests. Focused numeric execution, AI deterministic collect-reward generation,
  Renderer observation, and Web projection regressions pass. Direct TypeScript,
  package ESLint, and Web build pass; existing lint warnings and the managed
  root Turbo TLS/keychain limitation remain documented.
product_verification: YES — real Studio verification on 2026-08-24 created
  gateway-backed `world-3`, collected the item to show `experience: 1`, applied
  a non-replacing theme evolution in the same Game/Runtime session, and saw
  `experience: 1` remain in Observatory Runtime. New `world-4` showed
  `experience: Unavailable`; final browser diagnostics had no warn/error entries.
observability_expectations: Keep raw GameplayEvent, GameplayRule result,
  numeric state mutation, Runtime World/session, and Renderer output separate.
  A numeric state change is not itself a GameplayEvent or an entity mutation.
completion_report_requirements: Report architecture before/after, files,
  actual event → rule → progression-state flow, focused/affected tests,
  TypeScript, ESLint, Web build, manual Studio steps/results, authority and
  stale isolation, explicit deferred progression boundaries, Code Complete, and
  Product Verified.
explicit_non_goals: No level-up, upgrade choice, modifier application,
  Survivor-specific behavior, spawn/wave pressure, offline gateway fallback, or
  automatic Sprint 17 execution.
human_decision_required: NO — CONTINUE direction and this bounded generic
  primitive were accepted; implementation and product verification are complete.

## SPRINT_FREEZE_REVIEW — Sprint 16 Gameplay Evolution & Progression Foundation (Post-WO-S16-002)

status: DONE
state_transition: GENERATED_AFTER_WO-S16-002 → BLOCKED → IN_PROGRESS → DONE
priority: P0
dependencies: WO-S16-001 DONE; WO-S16-002 DONE; Sprint 16 acceptance evidence complete
mission: Human/CTO review of the corrected Sprint 16 goal after WO-S16-002
  established Runtime-authoritative numeric progression, and decide whether a
  minimal threshold-to-level transition is still required before freeze.
measured_bottleneck: Human/CTO confirmed CONTINUE: numeric storage and XP gain
  are verified, but Sprint acceptance still requires Runtime-authoritative
  level state plus one deterministic XP threshold transition. This is the
  smallest remaining gameplay blocker; offline World Evolution fallback is
  resilience debt and remains non-blocking.
decision_gate: RESOLVED — Human/CTO chose CONTINUE. Sprint 16 is NOT READY FOR
  FREEZE; exactly one bounded product WO is authorized to prove XP threshold →
  Level 1 → Level 2.
allowed_scope: Review WO-S16-002/ADR-0270 evidence, update the Sprint freeze
  criteria, record the CONTINUE decision, run one fresh Next-Work Discovery,
  and generate exactly one bounded generic threshold/level WO.
forbidden_scope: Automatic freeze, skills, modifiers, Survivor-specific
  Runtime, spawn/wave behavior, offline World Evolution fallback, Sprint 17
  work, or generating more than one next product WO.
acceptance: PASS — Human/CTO CONTINUE is recorded; Sprint 16 freeze criteria
  now include Runtime-authoritative level and one deterministic threshold
  transition; exactly one bounded READY product WO was generated.
product_verification: ALREADY PASS — WO-S16-001 and WO-S16-002 remain Product
  Verified; this item is a Sprint governance and discovery decision.
human_decision_required: NO — CONTINUE decision recorded by Human/CTO on
  2026-08-24; routine implementation remains Supervisor-owned.

## WO-S16-003 — Deterministic XP Threshold Level Transition

status: DONE
state_transition: GENERATED_AFTER_SPRINT_FREEZE_REVIEW → READY → IN_PROGRESS → VERIFYING → DONE
priority: P1
dependencies: SPRINT_FREEZE_REVIEW DONE; WO-S16-002 DONE; Human/CTO CONTINUE
  decision recorded; no unresolved architecture/product-direction gate
architecture_before: v1.156
architecture_expected_after: v1.157
architecture_after: v1.157 — ADR-0271 accepted; Runtime-authoritative level
  state and the bounded typed threshold transition are wired end to end.
mission: Prove the smallest remaining Sprint 16 progression transition:
  Runtime-authoritative `experience` and `level` state, a typed numeric
  threshold condition, and one deterministic Level 1 → Level 2 transition
  through the existing GameplayEvent → GameplayRule path.
measured_bottleneck: Verified capabilities are (A) Runtime-owned finite
  `experience` accumulation, (B) same-session retention/reset/isolation, and
  (C) Renderer/Web/Observatory projection. Sprint acceptance still requires
  (D) Runtime-authoritative level plus XP threshold transition; (D) is the
  smallest blocker because `NUMBER_COMPARE` is already typed but the Runtime
  evaluator treats it as unsupported and the deterministic RuleSet has no
  level transition.
gap_classification: PRODUCT_GAP + EXECUTION_GAP
allowed_scope: Initialize the current progression lifecycle at
  `experience=0`, `level=1`; execute finite `NUMBER_COMPARE` references
  against Runtime state and existing event/entity numeric facts; add one
  deterministic platformer `level-up` rule requiring `experience >= 1` and
  `level < 2`, using the existing `CHANGE_NUMERIC_STATE level +1` action;
  expose level through the existing progression projection; add focused
  Shared/AI/Runtime/Renderer/Web regressions and real Studio verification.
forbidden_scope: ProgressionManager, XPManager, SurvivorRuntime, new action
  transaction systems, skill selection/UI, modifiers, upgrade catalog, waves,
  spawners, difficulty scaling, death/respawn, arbitrary code/eval, generated
  code, offline World Evolution fallback, or a complete progression framework.
implementation_boundaries: Runtime remains the sole progression authority;
  GameplaySpecification/GameplayRuleSet remain structured intent/plan;
  `NUMBER_COMPARE` reads only finite typed references; Web/Pinia/Renderer/
  Observatory project committed Runtime state. Repeated evaluation must be
  blocked by the typed `level < 2` condition, not a manager or hidden flag.
acceptance: PASS — all eight are proven: (1) Runtime-authoritative experience
  exists; (2) Runtime-authoritative level exists; (3) a typed deterministic
  threshold transition exists; (4) supported XP commits exactly one Level 1 →
  Level 2 transition; (5) repeated evaluation cannot commit another level;
  (6) same-session semantic World Evolution retains both values; (7) a new
  world/session resets to the lifecycle baseline; and (8) stale World A
  events/rules cannot mutate World B, with Renderer/Observatory projecting the
  committed values separately from raw facts and Rule results.
automated_tests: PASS — Shared 9 files/207 tests; AI 156 files/9,402 tests;
  Runtime 23 files/690 tests; Renderer 25 files/485 tests; Web 47 files/3,528
  tests. Focused and affected-package regressions cover numeric comparison,
  lifecycle, deterministic ordering, exactly-once transition, same-session
  retention, reset, stale isolation, Renderer observation, and Observatory
  projection. Direct TypeScript and package ESLint pass; the Web build passes.
  The managed root Turbo TLS/keychain limitation and existing lint warnings
  remain documented.
product_verification: YES — real Studio shows `经验值: 1` and
  `等级: 2` after one supported collect/XP event, retain both across a
  non-replacing World Evolution in the same Runtime/session, and resets to
  `经验值: 0`, `等级: 1` on a new world/session. Final browser diagnostics
  contain no warning/error entries.
observability_expectations: Keep numeric comparison facts, GameplayRule
  results, numeric state mutations, Runtime World/session, and Renderer/Web
  projections distinct. A level transition is a committed numeric state
  mutation, not a new raw GameplayEvent.
completion_report_requirements: Report architecture before/after, files,
  actual event → XP action → threshold condition → level action flow, focused/
  affected tests, TypeScript, ESLint, Web build, manual Studio evidence,
  stale/lifecycle isolation, deferred boundaries, Code Complete, and Product
  Verified.
explicit_non_goals: No skills, modifiers, upgrade catalog, waves, spawning,
  scaling, death/respawn, Survivor behavior, offline gateway fallback, or
  automatic Sprint 17 execution.
code_complete: YES
product_verified: YES
human_decision_required: NO — the Human/CTO CONTINUE boundary was accepted;
  this single bounded product WO completed under SPRINT_CONTINUOUS.

## SPRINT_FREEZE_REVIEW — Sprint 16 Gameplay Evolution & Progression Foundation (Post-WO-S16-003)

status: DONE
state_transition: GENERATED_AFTER_WO-S16-003 → IN_PROGRESS → VERIFYING → BLOCKED → DONE
priority: P0
dependencies: WO-S16-001 DONE; WO-S16-002 DONE; WO-S16-003 DONE; Sprint 16
  acceptance evidence complete
mission: Evaluate the corrected Sprint 16 goal after the completed deterministic
  XP threshold transition and hold the Sprint at the boundary for the required
  Human/CTO freeze decision.
measured_bottleneck: NONE within the accepted Sprint 16 product scope. All
  eight corrected freeze criteria pass and the Human/CTO governance gate is
  resolved.
decision_gate: RESOLVED — Human/CTO chose FREEZE on 2026-08-24. Sprint 16 is
  frozen at v1.157 with Code Complete = YES and Product Verified = YES.
allowed_scope: Review WO-S16-003/ADR-0271 evidence, record the final Sprint
  Freeze Review, freeze Sprint 16, and perform only a high-level Sprint 17
  discovery at the boundary.
forbidden_scope: Automatic Sprint 17 execution, detailed Sprint 17 WO
  generation, implementation, or treating candidate gaps as mandatory freeze
  criteria.
acceptance: PASS — Runtime-authoritative experience and level, the deterministic
  threshold, exactly-once Level 1 → Level 2 behavior, same-session retention,
  lifecycle reset, stale World A/B isolation, and truthful projections all pass;
  Human/CTO FREEZE is recorded.
automated_tests: PASS — affected-package regressions, direct TypeScript,
  package ESLint, Web build, and `git diff --check` pass; root Turbo typecheck
  remains blocked only by the managed TLS/keychain environment limitation.
product_verification: YES — real Studio evidence covers `world-5` at
  `经验值: 1`, `等级: 2`, same-session theme evolution retaining both values,
  and new `world-6` resetting to `经验值: 0`, `等级: 1`; browser diagnostics
  contain no warning/error entries.
next_work_discovery: HIGH-LEVEL ONLY — candidate Sprint 17 objective is
  `Mechanically Complete Platformer Generation`. Candidate gaps to measure are
  death/failure, restart/respawn, enemy autonomous behavior, score/reward only
  if required, level composition/pacing, and full natural-language platformer
  E2E. No detailed product WO is generated.
human_decision_required: NO for the completed Sprint 16 Freeze Review; Sprint
  17 goal approval is a separate OPEN Human/CTO gate. `SPRINT_CONTINUOUS` stops
  at the Sprint boundary.

## SPRINT17_DISCOVERY — Mechanically Complete Platformer Generation

status: DONE
state_transition: GENERATED_AFTER_SPRINT_FREEZE_REVIEW → BLOCKED → READY → DONE
priority: P0
dependencies: Sprint 16 Freeze Review DONE; Sprint 16 FROZEN at v1.157
mission: Enter the Human/CTO-approved Sprint 17 objective, perform fresh
  product-level Next-Work Discovery, and generate exactly one bounded product
  WO from the measured platformer loop.
measured_gaps_to_assess: death/failure state; restart/respawn; enemy autonomous
  behavior; score/reward feedback if the product loop requires it; level
  composition/pacing; and full natural-language platformer E2E.
boundary: Candidate gaps were measured against actual source and tests; only
  the smallest direct blocker was selected. Sprint 17 remains sequential and
  the queue horizon is one item.
forbidden_scope: Pre-planning the whole Sprint, treating candidate gaps as
  mandatory, automatic Sprint 18 entry, or architecture work unrelated to the
  selected blocker.
result: PASS — Human/CTO approved the goal. The deterministic platformer path
  lacks a collectible because the six-entity template has only goal/checkpoint
  items and the rule builder excludes both; generic collect→XP→level execution
  is already verified when an item exists. Exactly one READY WO was generated:
  `WO-S17-001`.
human_decision_required: NO for the selected generation-composition slice.

## WO-S17-001 — Platformer Baseline Collectible Composition

status: DONE
state_transition: GENERATED_AFTER_SPRINT17_DISCOVERY → READY → IN_PROGRESS → VERIFYING → BLOCKED → DONE
priority: P0
dependencies: SPRINT17_DISCOVERY DONE; Sprint 16 FROZEN at v1.157
architecture_before: v1.157
architecture_expected_after: v1.158
architecture_actual_after: v1.158 — ADR-0272 accepted
mission: Make a normal natural-language platformer request generate one
  deterministic collectible that can enter the already verified generic
  contact → REMOVE_ENTITY + CHANGE_NUMERIC_STATE path before the goal.
measured_bottleneck: Verified generic movement/jump/contact, collectible
  removal, XP/level transition, enemy interaction, damage/Health, and goal
  completion exist. The default platformer template has no collectible selected
  by `GameplayRuleBuilder.collectible()`: `goal`, `flag`, and `checkpoint` are
  excluded, so the generated default RuleSet has no `collect-reward` or
  `level-up` rule. The missing generation composition is the smallest direct
  blocker to the primary Sprint 17 scenario.
allowed_scope: Add one stable semantic `item` collectible to the default
  platformer template; add one deterministic, non-overlapping platformer layout
  anchor; update focused generation/integration tests; verify the existing
  Runtime rule path and Studio projections with a normal natural-language
  creation request; add/update the scoped ADR and project/control-plane docs.
forbidden_scope: Runtime systems, new GameplayEvent/Condition/Action types,
  new managers/factories/workflow frameworks, genre-specific Runtime classes,
  arbitrary generated code/eval, provider authority, death/respawn/game-over,
  hazards, enemy AI, score policy, spawning/waves, visual redesign, and
  unrelated World Evolution or Observatory work.
implementation_boundaries: Package ownership is `@genesis/ai` for semantic
  template/layout composition and focused tests. Reuse the existing
  `GameplayRuleBuilder`, `DefaultSemanticGameDslBuilder`, Runtime loop,
  WorldStore, Renderer, and Observatory seams without modifying their
  authority contracts.
acceptance: A deterministic/fallback request such as `create a simple 2D
  platformer` resolves
  to a platformer world containing player, enemy, collectible, and goal; the
  deterministic RuleSet contains current supported `collect-reward` and
  `level-up` rules; a real collectible contact removes only the collectible and
  commits Runtime progression `experience: 1, level: 2`; enemy stomp/damage and
  goal-completion rules remain present and executable; no stale-world or
  capability-truth regressions occur.
automated_tests: Focused AI template/layout/create-world tests plus affected
  Runtime/Web gameplay regressions; direct TypeScript, package ESLint, relevant
  regression suites, Web build when integration changes, and `git diff --check`.
product_verification: YES — deterministic fallback Studio evidence generated
  seven entities and observed collectible removal with `experience: 1` and
  `level: 2` with clean browser diagnostics. The configured provider-path
  acceptance blocker was closed by WO-S17-002's completeness gate.
observability_expectations: Raw contact, Gameplay Rule results, Runtime World,
  progression, and session projections remain separate; no synthetic
  collectible/result is added to Observatory.
completion_report_requirements: Report v1.157 → v1.158, files, real
  generation → DSL → Runtime → RuleSet → Renderer/Observatory flow, tests,
  TypeScript, ESLint, build, architecture constraints, manual Studio steps,
  known remaining gaps, Code Complete, and Product Verified.
explicit_non_goals: Failure/death, recovery/restart/respawn, hazards, enemy
  autonomous behavior, score beyond current XP/level, pacing overhaul,
  persistence, and automatic Sprint 18.
code_complete: YES
product_verified: YES — verified through the bounded deterministic baseline
  after the provider selection gate.
human_decision_required: NO — the original composition slice required no
  decision; its provider-path gate is recorded in WO-S17-002.

## WO-S17-002 — Provider Candidate Completeness Gate for Platformer Baseline

status: DONE
state_transition: GENERATED_AFTER_WO_S17_001_PRODUCT_GATE → BLOCKED → READY → IN_PROGRESS → VERIFYING → DONE
priority: P0
dependencies: WO-S17-001 code complete at v1.158; Human/CTO completeness
  decision accepted 2026-08-24
architecture_before: v1.158
architecture_expected_after: v1.159 if implemented
mission: Resolve the smallest generation trust-boundary gap exposed by real
  Studio evidence: a structurally valid platformer provider candidate must not
  bypass the deterministic baseline required for the approved mechanics.
measured_bottleneck: The configured AI path reported `ai · success` and
  `Validation: passed` for a two-entity platformer (`player`, `platform`). Web
  applied it as the current semantic world, leaving Runtime active with no
  collectible, enemy, goal, or progression transition. The deterministic
  fallback path already produces seven entities and reaches `experience: 1`,
  `level: 2`, so the failure is at candidate completeness/trust, not Runtime
  execution.
allowed_scope_after_gate: Extend the existing `@genesis/ai` candidate
  validation boundary and fail closed through the existing deterministic
  provider, with focused provider/fallback tests and truthful Observatory
  selection diagnostics. Preserve candidate-as-untrusted-input semantics and
  reuse the current deterministic platformer template and GameplayRuleBuilder.
forbidden_scope: New Runtime authority, genre-specific Runtime, managers,
  arbitrary code/eval, provider capability claims, death/respawn, hazards,
  enemy AI, score, spawning, pacing overhaul, broad quality infrastructure,
  visual polish, or automatic Sprint 18.
acceptance_gate: PASS — complete provider candidates are accepted; structurally
  valid but product-incomplete platformer candidates are rejected into the
  deterministic baseline; provider failures retain safe fallback; all four
  outcomes are distinct in diagnostics.
product_verification: PASS — real Codex CLI Studio generation selected
  `deterministic_fallback` with `product_incomplete`, produced the seven-entity
  baseline, and full Observatory exposed the failed baseline stage and exact
  missing capabilities without provider-outage labeling. Collectible contact
  produced 6 remaining entities, `Experience: 1`, and `Level: 2`; browser logs
  were clean. A/B/C provider contract tests and the existing D gameplay
  regressions pass.
code_complete: YES
product_verified: YES
human_decision_required: NO

## WO-S17-003 — Platformer Goal/Collectible Target Isolation

status: DONE
state_transition: GENERATED_AFTER_WO_S17_002_GAP_ANALYSIS → READY → IN_PROGRESS → VERIFYING → DONE
priority: P0
dependencies: WO-S17-002 DONE; fresh Sprint 17 product-level Gap Analysis
architecture_before: v1.159
architecture_expected_after: v1.159 — existing RuleBuilder boundary only
mission: Preserve the complete platformer lifecycle after adding a
collectible: contact with the selected collectible must not remove a goal or
checkpoint, and goal contact must reach the existing Runtime session
completion authority.
measured_bottleneck: Real Studio fallback traversal reached the `goal` item
  after collectible removal. The deterministic `collect-reward` rule matched
  the goal by category-only `item` conditions, removed it, and left the session
  `active`; `reach-goal` could not commit. This is a direct product execution
  blocker, not a provider or Runtime-authority gap.
allowed_scope: Add exact selected-collectible ID conditions to the existing
  deterministic collect-reward and threshold level-up rules; preserve existing
  event participant identity in the Runtime condition evaluator after an
  earlier same-event rule removes the target; add focused builder/Runtime
  regression coverage; verify the same natural-language fallback path through
  goal contact and Runtime session completion.
forbidden_scope: New Runtime authority, new gameplay primitives, managers,
  genre-specific Runtime, arbitrary code/eval, candidate augmentation,
  provider regeneration, death/respawn, hazards, enemy AI, score, pacing,
  visual redesign, broad Observatory work, or Sprint 18.
acceptance: PASS — the deterministic platformer RuleSet targets the selected
  collectible ID for collection/progression; collectible contact removes only
  the collectible and commits XP/Level even after the removal action; goal
  contact no longer matches collection/progression, `reach-goal` executes
  `COMPLETE_GOAL`, and the Runtime session becomes `completed`; existing
  enemy/damage, stale isolation, provider gate, and failure fallback behavior
  remain intact.
verification: PASS — AI/Runtime/Web affected and full-package regressions,
  TypeScript, ESLint, Web build, git diff check, and real Studio fallback
  traversal passed. Full Observatory Event Stream showed collectible removal
  and level-up, enemy damage and stomp, then committed goal completion.
product_verification: YES — real natural-language Studio verification on
  2026-08-25 showed `product_incomplete → deterministic_fallback`, movement,
  jump, collectible removal, `Experience: 1`, `Level: 2`, Health 100→99,
  enemy stomp removal, goal preservation, Runtime `completed`, and clean
  browser error/warning logs.
code_complete: YES
human_decision_required: NO — the measured fix reuses the approved generic
  RuleBuilder and existing Runtime completion authority.

## WO-S17-004 — Runtime-Authoritative Lethal Failure and Same-Session Respawn

status: DONE
priority: P0
dependencies: WO-S17-003 DONE; Human/CTO Sprint 17 Freeze Review CONTINUE
  recorded on 2026-08-25
architecture_before: v1.159
architecture_expected_after: v1.160 — extend the existing Runtime session
  state contract and expose one bounded Runtime respawn operation
mission: Close the measured lifecycle gap in the generated platformer: a
  trusted lethal player DAMAGE_ENTITY transition must make the Runtime session
  failed, and an explicit same-world respawn must restore active gameplay so
  the player can continue to the existing goal completion path.
measured_bottleneck: WO-S17-003 proved the success path, but a player Health
  value reaching 0 remained only component state; RuntimeGameplaySessionState
  had no failed status and the production path had no recovery control.
allowed_scope: Extend RuntimeGameplaySessionState with failed and bounded
  failure metadata; transition active → failed only from trusted lethal
  player DAMAGE_ENTITY execution; block post-failure gameplay rule commits;
  add one same-world Runtime respawn operation that restores the player's
  existing Health maximum and safe velocity while preserving current world
  entities, progression, semantic revision, and World Evolution continuity;
  add the smallest Studio control needed to request that Runtime operation;
  project failed/active truth through existing Renderer/Web/Observatory seams;
  add focused regressions and real product verification.
forbidden_scope: MarioRuntime, DeathManager, RespawnManager,
  GameplayManager, generic workflow/state-machine framework, lives,
  checkpoints, death animation, autonomous enemy behavior, hazards, score,
  pacing, candidate augmentation/merging, AI regeneration loops, arbitrary
  generated code/eval, visual infrastructure expansion, Observatory expansion,
  or Sprint 18 work.
acceptance: A lethal trusted player DAMAGE_ENTITY action commits Health 0 and
  Runtime session status failed with truthful failure metadata; a goal or
  damage event cannot advance failed gameplay; the explicit same-world respawn
  restores player Health to max, clears unsafe velocity, returns Runtime
  status to active, and preserves collected/progression/world-evolution state;
  the player can then continue and reach COMPLETE_GOAL in the same product
  session path; stale World A events cannot affect World B; no provider or
  Renderer projection becomes authority.
verification: Targeted Runtime session/action/loop tests, affected package
  tests, TypeScript, ESLint, Web build/regression checks as applicable, and
  real Studio/browser verification of lethal failure → respawn → continuation
  → completion with clean browser logs. PASS — Runtime and Web regressions,
  direct package checks, and real Studio verification passed. The browser
  session showed Health `0`, the `Respawn` control, unchanged same-world
  position, and active play after recovery; `99/100` after clicking is the
  existing next-tick contact damage at the preserved position.
product_verification: YES — real Studio failure/recovery traversal completed on
  2026-08-25; the success lifecycle was already Product Verified in
  WO-S17-003.
code_complete: YES
human_decision_required: NO — the Human/CTO CONTINUE boundary is recorded;
  execute this bounded READY item automatically under SPRINT_CONTINUOUS.
state: GENERATED_AFTER_SPRINT17_FREEZE_REVIEW_CONTINUE_GAP_ANALYSIS → READY →
  IN_PROGRESS → VERIFYING → DONE

## SPRINT17_FREEZE_REVIEW — Sprint 17 Mechanically Complete Platformer Generation

status: BLOCKED
state_transition: GENERATED_AFTER_WO_S17_004_GAP_ANALYSIS → BLOCKED
priority: P0
dependencies: WO-S17-001 DONE; WO-S17-002 DONE; WO-S17-003 DONE; WO-S17-004
  DONE; Sprint 17 success and failure/recovery lifecycles Product Verified
architecture_before: v1.160
architecture_expected_after: v1.160
mission: Evaluate whether Sprint 17's product goal is satisfied by the
  provider-gated deterministic baseline and accumulated generic gameplay/
  Runtime evidence.
allowed_scope: Sprint-level acceptance review, evidence reconciliation,
  explicit deferred-gap accounting, and Human/CTO freeze decision.
forbidden_scope: Automatic Sprint 18 entry, pre-generated Sprint 18 backlog,
  unmeasured death/respawn, hazards, enemy AI, score, pacing, or new Runtime
  architecture.
acceptance: PASS only when the complete natural-language platformer path,
  truthful provider selection, deterministic fallback lifecycle, current
  generic mechanics, progression, goal completion, continuity, isolation, and
  both success and bounded failure/recovery lifecycle evidence are reconciled
  against the Sprint 17 goal. Adjacent deferred capabilities remain explicitly
  classified rather than silently claimed.
human_decision_required: YES — Human/CTO must accept FREEZE or CONTINUE after
  WO-S17-004 Product Verification.

## Queue transition vocabulary

BLOCKED → READY only after the blocking decision or dependency is resolved.
READY → IN_PROGRESS only after dependency and human-decision gates pass.
IN_PROGRESS → VERIFYING after implementation is complete.
VERIFYING → DONE only when all required gates pass.
VERIFYING → FAILED or BLOCKED when the repair budget or an escalation rule is
reached.

## SPRINT17_FREEZE_REVIEW — Sprint 17 Mechanically Complete Platformer Generation

status: DONE
priority: P0
state_transition: GENERATED_AFTER_WO_S17_004_GAP_ANALYSIS → BLOCKED → DONE
dependencies: WO-S17-001 DONE; WO-S17-002 DONE; WO-S17-003 DONE; WO-S17-004
  DONE; Human/CTO FREEZE decision accepted 2026-08-25
architecture_before: v1.160
architecture_after: v1.160
mission: Reconcile the complete Sprint 17 natural-language platformer
  success and bounded failure/recovery lifecycles and finalize the Sprint.
acceptance: PASS — provider completeness protection, deterministic fallback,
  movement, jump, collectible/progression, damage, stomp, Runtime failure,
  same-world respawn, continuation, goal completion, stale isolation, and
  truthful projections are Product Verified.
product_verification: YES — accumulated real Studio evidence plus final real
  browser Health 0 → Respawn → unchanged position → active-play evidence.
code_complete: YES
human_decision_required: NO — Human/CTO FREEZE accepted.
next_boundary: Sprint 18 explicitly authorized; no Sprint 17 product work is
  executed after this review.

## SPRINT18_DISCOVERY — Visually Coherent Platformer Generation

status: DONE
priority: P0
state_transition: GENERATED_AFTER_SPRINT17_FREEZE_REVIEW → READY → DONE
dependencies: Sprint 17 FROZEN at v1.160; Human/CTO Sprint 18 authorization
  accepted 2026-08-25
architecture_before: v1.160
architecture_expected_after: v1.161 for the selected bounded contract
mission: Perform fresh repository-grounded Gap Analysis against the measured
  visual composition problems and generate exactly one bounded current WO.
measured_selection: Asset requirements and generation policy expose generic
  kind only; environment role/usage is lost before provider requests and
  manifest consumers. This is the smallest blocker because prompt constraints
  and later Renderer role selection cannot coordinate without the fact.
selected_work_order: WO-S18-001
forbidden_scope: Full graphics framework, platform/tileset editor, image-based
  collision, geometry inference from pixels, broad Renderer rewrite, future
  Sprint backlog, or automatic Sprint 19 entry.
acceptance: PASS — one bounded WO generated with source evidence, explicit
  non-goals, valid dependencies, no unresolved Human/CTO authority fork, and
  SPRINT_CONTINUOUS execution eligibility.
product_verification: NOT_APPLICABLE — discovery/control-plane selection only.
human_decision_required: NO — Sprint 18 direction and bounded role contract
  were explicitly authorized.

## WO-S18-001 — Bounded Platformer Asset Render-Usage Contract

status: DONE
priority: P0
state_transition: GENERATED_AFTER_SPRINT18_DISCOVERY → READY → IN_PROGRESS → VERIFYING → DONE
dependencies: SPRINT18_DISCOVERY DONE; Sprint 17 FROZEN at v1.160
architecture_before: v1.160
architecture_expected_after: v1.161 — preserve bounded render usage through
  the existing asset request/context/manifest contracts
architecture_after: v1.161
mission: Carry the smallest current platformer visual usage fact from semantic
  asset requirement through image generation request/context and manifest, and
  derive deterministic prompt constraints from that fact.
measured_bottleneck: `AssetRequirement` and `AssetManifestEntry` carried only
  generic environment kind; the request prompt policy was kind-based; and the
  environment Renderer selected a terrain resource for both terrain and
  platform. The selected first slice is the missing usage contract, not image
  inspection or Runtime geometry inference.
allowed_scope: Optional typed `renderUsage` metadata; current emitted
  `entity-sprite`, `background-cover`, and `ground-repeat-x` values; usage-aware
  deterministic prompt constraints; usage-preserving manifest/context and
  visual grouping; focused Shared/AI/Assets/Web regressions.
forbidden_scope: VisualAssetManager, TerrainManager, universal role engine,
  platform-specific asset generation, local platform composition, geometry
  inference from images, image-based collision, tilesets, animation,
  spritesheets, parallax, arbitrary code/eval, Runtime changes, provider
  regeneration loops, candidate merge, or broad Renderer rewrite.
implementation_boundaries: Shared owns the provider-neutral usage metadata;
  AI owns deterministic requirement emission; Web owns request/prompt policy;
  manifest preserves the fact for the next Renderer slice. Runtime remains
  gameplay/geometry authority; Renderer remains a projection and is not changed
  by this WO.
acceptance: Current generated entity/background/ground requirements carry
  truthful usage; requests/context/prompts expose it; manifest preserves it;
  usage participates in visual identity/grouping; Sprint 17 gameplay,
  World Evolution continuity, and stale-world isolation do not regress.
automated_tests: Shared manifest/context/image contracts; AI asset builder;
  Web asset generation policy and grouping; affected package suites.
verification: PASS — focused/affected suites, direct TypeScript, ESLint, Web
  build where applicable, `git diff --check`, and real Studio creation/request
  path with clean browser/runtime diagnostics.
product_verification: YES — the real Studio platformer request exercised the
  existing generation path while the captured request/context carried the
  bounded usage facts; no browser/runtime warning or error was introduced.
code_complete: YES
human_decision_required: NO

## SPRINT18_NEXT_WORK_DISCOVERY — Fresh Product-Level Gap Analysis

status: DONE
priority: P0
dependencies: WO-S18-001 DONE; fresh real generated-scene measurement required
mission: Re-measure local platform usage and Runtime-geometry-backed terrain
  composition against the Sprint 18 freeze question and generate exactly one
  next bounded WO if a product blocker remains.
human_decision_required: NO for discovery; implementation selection follows
  the measured result and must not pre-plan the Sprint.
state: GENERATED_AFTER_WO_S18_001_GAP_ANALYSIS → BLOCKED_PENDING_PRODUCT_MEASUREMENT → DONE
measurement_result: Real fallback scene measured the platform selection gap;
  WO-S18-002 was generated and executed. This historical discovery record is
  superseded by the post-WO-S18-002 discovery below.

## WO-S18-002 — Consume Bounded Platform Usage in Environment Composition

status: DONE
priority: P0
state_transition: GENERATED_AFTER_WO_S18_001_GAP_ANALYSIS → READY → IN_PROGRESS → VERIFYING → DONE
dependencies: WO-S18-001 DONE; Sprint 17 FROZEN at v1.160
architecture_before: v1.161
architecture_after: v1.162
mission: Consume the already-proven bounded render usage in the existing
  environment Renderer so a matching platform entity-sprite is preferred over
  the generic ground material.
measured_bottleneck: With a resolved environment terrain asset, the previous
  Renderer selected it for both terrain and platform entities; the exact
  platform entity asset was generated but hidden by the environment projection.
allowed_scope: Existing manifest usage-aware selection for ground, platform,
  and background; legacy kind/target fallback; Renderer regressions.
forbidden_scope: Runtime geometry changes, tiling/repeat, image-pixel
  inference, visual managers, universal taxonomy, broad Renderer rewrite,
  arbitrary code/eval, and Sprint 19 entry.
acceptance: PASS — terrain prefers ground-repeat-x, an exact resolved platform
  entity-sprite is selected for its matching platform, background prefers
  background-cover, and legacy manifests remain renderable.
verification: PASS — focused/full Renderer tests, TypeScript, ESLint, Web
  regressions/build, diff check, and real fallback Studio creation with clean
  browser/runtime diagnostics.
product_verification: YES
code_complete: YES
human_decision_required: NO

## SPRINT18_NEXT_WORK_DISCOVERY_POST_WO_S18_002 — Fresh Product-Level Gap Analysis

status: DONE
priority: P0
state_transition: GENERATED_AFTER_WO_S18_002_GAP_ANALYSIS → READY → DONE
dependencies: WO-S18-002 DONE; real fallback scene measured
mission: Re-measure the next smallest visual composition blocker and generate
  exactly one bounded READY/BLOCKED WO under SPRINT_CONTINUOUS.
measured_result: Real image-backed Studio measurement resolved and applied
Background/Terrain/Player/Enemy (4/9 ready, codex-cli, clean browser
diagnostics). The Runtime snapshot showed Terrain and Platform both as
type=terrain; the adapter dropped semantic.name, so the existing platform
selection/bounds path was not reachable. A bounded semantic projection repair
was implemented and tested. The provider timed out for entity-platform-primary,
so exact real platform application remains unverified; ground-repeat is not a
measured blocker.
selected_work_order: WO-S18-003
acceptance: PASS for bounded measurement/repair scope; exact provider-backed
  platform application remains an unresolved acceptance gate. No speculative
  tiling, Runtime geometry, provider regeneration loop, or image-quality
  framework was introduced.
product_verification: NOT_APPLICABLE — discovery/control-plane selection only.
human_decision_required: NO; blocked on an unresolved image-backed product
  measurement gate.

## WO-S18-003 — Ground-Repeat Composition Measurement

status: DONE
priority: P0
state_transition: GENERATED_AFTER_SPRINT18_NEXT_WORK_DISCOVERY_POST_WO_S18_002 → MEASURED_WITH_BOUNDED_REPAIR → BLOCKED_PENDING_PROVIDER_PLATFORM_APPLICATION → VERIFYING → DONE
dependencies: WO-S18-002 DONE; one real generated scene with resolved
  background, ground, and platform resources is required
architecture_before: v1.162
architecture_expected_after: v1.163 for the bounded semantic projection repair
architecture_after: v1.163
mission: Measure the real image-backed platformer composition across background,
  ground, platform, and entity resources; apply only the smallest existing
  Renderer/adapter repair if the source path proves a role projection gap.
allowed_scope: Real product measurement and one bounded semantic projection
  repair using existing Renderer/adapter contracts; no new subsystem.
forbidden_scope: Tiling/repeat implementation, Runtime geometry contract,
  image-pixel collision/inspection, broad Renderer rewrite, visual quality
  scoring, manager/framework creation, and Sprint 19 entry.
blocking_gate: PASS — the resumed real Studio request emitted the existing
  `entity-elevated-platform-primary` Codex CLI request for the semantic
  `Elevated Platform` entity. Observatory recorded `codex-cli → succeeded →
  published → manifest updated → resolved → Renderer applied`, bound to
  `elevated-platform`. The existing semantic projection selected the exact
  entity sprite and the existing `platform` catalog bounds (96×24); Runtime
  geometry/collision remained unchanged.
product_verification: YES — 2026-08-25 real Studio/Observatory evidence. The
  generated platform was a local grass-and-rock surface with no unrelated sky
  or scenery; no problematic crop/stretch/tile behavior was observed. Background,
  terrain ground material, Player, Enemy, Coin, and Goal remained applied;
  browser warning/error logs were empty and movement/jump input remained live.
code_complete: YES
human_decision_required: NO — the provider-backed acceptance gate closed without
  a direction or architecture change.

## SPRINT18_NEXT_WORK_DISCOVERY_POST_WO_S18_003 — Fresh Product-Level Gap Analysis

status: SUPERSEDED_BY_HUMAN_CTO_PRODUCT_OBSERVATION
priority: P0
dependencies: WO-S18-003 DONE with real provider-backed Platform application
mission: Re-evaluate the Sprint 18 checkpoint from the actual image-backed
  rendered result and generate at most one next work item.
measured_result: Initial verification correctly established (A) real provider success and
  truthful Observatory lifecycle, (B) exact semantic Platform-to-asset binding
  and Renderer application, and (C) Runtime-authoritative geometry composition
  with Background, ground material, and entity rendering intact. The generated
  platform is role-correct and locally composed; it contains no unrelated
  scene/background content and shows no measured crop, stretch, or tiling
  defect. A subsequent direct Human/CTO Studio observation superseded the
  initial no-gap conclusion: the continuous Runtime ground plane was visibly
  covered by only one small terrain rectangle, so walking could appear to be
  in the sky. That measurement is retained as the source for WO-S18-004.
selection: Superseded. The initial freeze-review selection is invalidated by
  the measured Ground composition defect; no Sprint 19 work is implied.
selected_work_order: WO-S18-004
product_verification: NOT_APPLICABLE — discovery reconciles already captured
  WO-S18-003 product evidence.
human_decision_required: NO — the correction specifies the bounded measurement
  and decision rule for the current Sprint work.

## WO-S18-004 — Ground-Repeat Composition Across the Authoritative Ground Plane

status: DONE
priority: P0
state_transition: GENERATED_FROM_DIRECT_HUMAN_CTO_PRODUCT_OBSERVATION → MEASURED_RUNTIME_VS_RENDERER → IMPLEMENTED → PRODUCT_VERIFIED → DONE
dependencies: WO-S18-003 DONE; direct Studio observation of the primary Ground
  visible-coverage mismatch
architecture_before: v1.163
architecture_after: v1.164
mission: Make existing `ground-repeat-x` consumption cover the existing
  Runtime-authoritative continuous Ground plane, without changing Runtime
  geometry, collision, or Platform-local composition.
allowed_scope: Renderer-only camera-visible horizontal tiling for the existing
  `ground-repeat-x` material; focused regression, documentation, and real
  Studio product verification.
forbidden_scope: Runtime/layout/collision changes; image-pixel geometry;
  stretching a world-width image; tilemap, tileset/terrain manager, map editor,
  new visual ontology, provider retries, broad Renderer rewrite, or Sprint 19.
measurement: Primary entity is `ground`, semantic role `Ground`, type `terrain`,
  Runtime/Inspector position `(160, 400)`, two components (position and
  semantic), and no finite width/height component. RenderEntity preserves
  `{ id: ground, type: terrain, semanticName: Ground, position: (160, 400) }`.
  Runtime ground authority is `DefaultGroundCollisionSystem`'s horizontally
  continuous `groundY = 400` plane. Before this WO, Renderer projected the
  terrain catalog's one `64 × 32` sprite, although the resolved
  `terrain-main` asset carries `ground-repeat-x` and its real generated source
  image measured `2172 × 724` pixels. Therefore the measured cause is B:
  Renderer consumption, not narrow Runtime geometry.
implementation: `PixiEnvironmentRenderer` consumes non-Platform
  `ground-repeat-x` as a Pixi `TilingSprite` over the current camera-visible
  Runtime-ground interval, uniformly scaled to the existing terrain height.
  Platform and legacy terrain stay bounded sprites; no Runtime authority moved.
acceptance: PASS — real Studio visual inspection shows Background cover and a
  continuous Ground material across the full visible walkable surface; horizontal
  walking no longer reads as walking in the sky. The resolved semantic Platform
  lifecycle remains `codex-cli → succeeded → published → manifest updated →
  resolved → Renderer applied`; entity sprites remain independent; movement and
  jump work; browser warning/error diagnostics are empty.
code_complete: YES
product_verification: YES — real provider-backed Studio run on 2026-08-25;
  source/canvas/Observatory evidence recorded above.
human_decision_required: NO

## SPRINT18_NEXT_WORK_DISCOVERY_POST_WO_S18_004 — Fresh Product-Level Gap Analysis

status: DONE
priority: P0
dependencies: WO-S18-004 DONE and Product Verified
mission: Re-evaluate Sprint 18 from the corrected real rendered result and
  select at most one next work item.
measured_result: Background remains scene-covering; Ground now horizontally
  repeats across the camera-visible authoritative walkable plane; Platform is
  still a distinct locally bounded provider-resolved visual; player, enemy,
  coin, and goal remain independent generated sprites; Runtime geometry,
  collision, movement/jump, and browser diagnostics remain clean. No additional
  measured visual-composition blocker remains.
selection: The Sprint checkpoint is satisfied. Generate only the required
  Sprint 18 Freeze Review; do not generate another product WO or enter Sprint 19.
selected_work_order: SPRINT18_FREEZE_REVIEW
product_verification: NOT_APPLICABLE — discovery reconciles WO-S18-004 evidence.
human_decision_required: YES for the freeze decision.

## SPRINT18_FREEZE_REVIEW — Visually Coherent Platformer Generation

status: BLOCKED
state_transition: GENERATED_AFTER_WO_S18_003_GAP_ANALYSIS → SUPERSEDED_BY_GROUND_MEASUREMENT → REACTIVATED_AFTER_WO_S18_004_GAP_ANALYSIS → BLOCKED_PENDING_HUMAN_CTO_FREEZE_DECISION
priority: P0
dependencies: WO-S18-001 DONE; WO-S18-002 DONE; WO-S18-003 DONE; Sprint 17
  remains FROZEN at v1.160
architecture_before: v1.164
architecture_expected_after: v1.164
mission: Evaluate whether Sprint 18's visual-coherence goal is satisfied by
  the accumulated real provider-backed rendering evidence and make the
  Human/CTO freeze decision explicit.
allowed_scope: Sprint-level evidence reconciliation, deferred-gap accounting,
  and a Human/CTO freeze decision.
forbidden_scope: New visual architecture, Runtime geometry/collision changes,
  provider retry infrastructure, Sprint 19 entry, or a pre-generated future-
  Sprint backlog.
acceptance: The review may pass only if the natural-language Studio path proves
  provider-successful, resolved, entity-bound, Renderer-applied Platform
  artwork alongside non-regressed Background/ground/entity rendering; Runtime
  geometry remains authoritative; and the measured image contains neither
  unrelated scene content nor problematic composition behavior.
product_verification: YES for the prerequisite WO-S18-003; the review itself
  introduces no product change.
human_decision_required: YES — choose FREEZE or CONTINUE within Sprint 18.

## SPRINT19_ASSET_REUSE_AUDIT_AND_PLAYER_GAP_ANALYSIS

status: DONE
priority: P0
dependencies: Sprint 18 FROZEN by Human/CTO at v1.164
measurement: PASS — `visualGenerationIdentity()` excludes Runtime entity ID;
  equivalent archetype/context requirements group to one canonical request.
  `VisualAssetEvolutionExecutor` generates once and rebinds that resolved URI
  to every equivalent entity asset. Existing regression proves three equivalent
  Sheep bind to one generation while distinct archetypes remain separate.
selection: Asset reuse needs no new WO. Player requirements already state
  `idle/run/jump`, but Runtime velocity/ground truth is not projected to
  Renderer and all states currently use one static entity asset.
selected_work_order: WO-S19-001
human_decision_required: NO

## WO-S19-001 — Runtime-Derived Player Presentation State Assets

status: DONE
priority: P0
dependencies: SPRINT19_ASSET_REUSE_AUDIT_AND_PLAYER_GAP_ANALYSIS DONE
architecture_before: v1.164
architecture_after: v1.166
mission: Prove one Player's idle, run, jump, and facing presentation from
  Runtime behavior without changing Runtime gameplay/collision authority.
allowed_scope: Separate Player state images through the existing request/
  manifest path; minimal render projection of authoritative velocity and
  grounded facts; Renderer state selection and safe horizontal mirroring;
  focused tests and real Studio verification.
forbidden_scope: AnimationManager/Engine, state-machine framework, BlendTree,
  spritesheet pipeline, skeletal animation, attack/death/hurt states,
  all-entity rollout, image-derived gameplay, Runtime gameplay/collision change,
  AssetManager, universal cache, or Sprint 20 entry.
acceptance: Standing Player is idle; horizontal motion visibly presents run;
  left/right facing is correct; airborne presents jump; land-while-moving
  returns run and stopping returns idle. The complete existing gameplay flow
  remains functional and browser diagnostics stay clean.
product_verification: YES — real Studio manual verification completed on
2026-08-26. Stationary→idle, move-right→run, stop→idle, move-left→run with
correct horizontal mirroring, jump→jump, land-while-moving→run,
stop-after-landing→idle, gameplay continuity, and clean browser console all
passed. The same observation measured the remaining static run-pose blocker.
human_decision_required: NO
code_complete: YES
verification_note: Reopened by Human/CTO for P0 production reachability repair.
  The active controller previously mutated Position.x without producing
  production Velocity.x, making Runtime-derived run/facing unreachable through
  real input. The bounded repair writes Velocity.x, preserves existing
  VerticalMotion integration and vertical/jump/collision authority, clears x on
  release, and adds a real registered input → Runtime → adapter → Renderer
  reachability regression. Automated gates and the required real Studio
  observations pass. The browser keyboard bridge limitation was not treated as
  a product defect. Fresh Gap Analysis measured true temporal run animation as
  the next smallest Sprint 19 blocker.

## SPRINT19_GAP_ANALYSIS_POST_WO-S19-001

status: DONE
priority: P0
dependencies: WO-S19-001 DONE; direct real Studio observation recorded
mission: Re-evaluate the actual Sprint 19 Player experience after the repaired
state-selection path was Product Verified and generate exactly one bounded next
WO.
measured_result: Verified capabilities are Runtime-derived idle/run/jump state
switching, horizontal facing/mirroring, real input reachability,
landing/stop continuity, gameplay continuity, and clean browser diagnostics.
The real Studio run still shows one static run pose sliding through the world.
This is a measured PRODUCT_GAP plus a bounded asset/Renderer ARCHITECTURE_GAP;
it directly blocks the Sprint 19 temporal presentation objective.
selection: Add two independent Player run-frame assets and Player-only
Renderer-local tick alternation through the existing asset/manifest/render-loop
contracts. Do not assume spritesheets, AnimationManager, universal state
machines, or skeletal animation.
selected_work_order: WO-S19-002
product_verification: NOT_APPLICABLE — discovery only.
human_decision_required: NO — existing authority boundaries and provider-neutral
asset contracts determine the smallest slice.

problem_register: Player can currently pass through generated Platform geometry.
This remains a separately measured product defect and is not included in
Sprint 19 unless the current Sprint product goal requires it.

## WO-S19-002 — Bounded Player Run-Frame Presentation

status: DONE
priority: P0
state_transition: GENERATED_AFTER_WO-S19-001_PRODUCT_VERIFICATION → READY → IN_PROGRESS → VERIFYING
dependencies: WO-S19-001 DONE; SPRINT19_GAP_ANALYSIS_POST_WO-S19-001 DONE
architecture_before: v1.166
architecture_expected_after: v1.167
architecture_after: v1.167 — bounded Player presentationFrame contract and
  Player-only Renderer tick selection
mission: Close the measured static-run-pose blocker with the smallest real
temporal movement proof while keeping Runtime state and geometry authority
unchanged.
measured_bottleneck: `idle`/`run`/`jump` state selection is Product Verified,
but sustained horizontal movement still shows one static run pose. Existing
separate state assets, manifest selection, and render tick are present; frame
identity and frame selection are the smallest missing capabilities.
allowed_scope: Shared optional presentationFrame metadata; exactly two
independent Player run-frame requirements; distinct generation identity and
prompt/context/request/operation propagation; targeted manifest binding;
Player-only Renderer tick alternation with async replacement and primitive
fallback; focused Shared/AI/Renderer/Web tests and Studio verification.
forbidden_scope: AnimationManager/Engine, universal state machines, BlendTree,
spritesheets/atlases, skeletal animation, interpolation, attack/death/hurt
states, all-entity rollout, Runtime gameplay/collision changes, image-derived
gameplay, durable generated assets, generic cache, Platform collision repair,
or Sprint 20 entry.
implementation_boundaries: Shared owns provider-neutral frame metadata; AI/Web
owns the two Player run requirements, distinct grouping, prompt/context
propagation, and manifest preservation; Renderer owns only Player run-frame
selection. Runtime remains the authority for state, velocity, facing, motion,
and geometry.
acceptance: Two distinct Player run-frame assets complete through provider →
manifest → AssetStore → Pixi; authoritative horizontal movement visibly
alternates those assets; idle/jump/facing/landing/stop/gameplay continuity,
legacy one-frame manifests, and clean browser diagnostics remain intact.
automated_tests: Shared frame contract/manifest/context; AI builder and
generation identity; Web request/prompt/executor propagation; Renderer tick
selection, async replacement, fallback, facing, and legacy manifest behavior;
affected package tests, TypeScript, ESLint, Web build, and regression suites.
product_verification: YES — real Studio manual verification completed on
2026-08-26. Two distinct generated run frames visibly alternate during
sustained right and left movement; idle/jump stop cycling; landing resumes
cycling; facing, Runtime/gameplay authority, mechanically complete platformer
flow, and clean browser diagnostics remain intact.
observability_expectations: Each run frame keeps its own truthful generation
operation and manifest asset ID; preserve the existing succeeded → published →
manifest updated → resolved → Renderer applied lifecycle and fallback status.
completion_report_requirements: architecture v1.166 → v1.167; files created /
modified; real flow; tests; TypeScript; ESLint; constraints; remaining gaps;
manual verification steps; Code Complete; Product Verified.
human_decision_required: NO — no authority, provider, dependency, or
Sprint-direction fork is introduced.

## SPRINT19_FREEZE_REVIEW

status: DONE
priority: P0
dependencies: WO-S19-002 DONE; all Sprint 19 acceptance observations PASS
architecture_before: v1.164
architecture_after: v1.167
decision: FROZEN — 2026-08-26
code_complete: YES
product_verification: YES
human_decision_required: NO for this requested review; Sprint 20 entry still
requires explicit Human/CTO authorization

freeze_question: Can Genesis present the generated Player according to real
Runtime behavior so standing, running, facing, and jumping visually read as
character actions rather than a static image sliding through the world?

verified_scope: Runtime-reachable horizontal motion truth; idle, temporal run,
jump, and left/right facing presentation; two-frame run alternation; landing
back to run; stop back to idle; unchanged Runtime gameplay/collision authority;
existing mechanically complete platformer flow; and no new WO-S19-002-attributable
browser console errors/warnings.

out_of_scope: full spritesheet pipeline, arbitrary frame counts, attack/hurt/
death animation, enemy animation, skeletal animation, AnimationManager,
universal animation state machine, and animation editor.

result: Sprint 19 is frozen at v1.167. No new Sprint 19 feature WO is generated,
and continuation stops at the Sprint boundary.

## SPRINT19_SEPARATE_HIGH_PRIORITY_PROBLEM_REGISTER

The following measured product problems remain preserved after the freeze. They
are not part of WO-S19-002 and require fresh product-level prioritization:

1. Generated Platform is pass-through and does not provide the expected Player
   collision behavior.
2. `增加5个enemy` can return `Unknown command`; the front-door intent layer
   rejects valid free-form World Evolution requests outside deterministic
   mappings.
3. Studio runtime state can be lost when switching to Full Observatory because
   of page reload/navigation lifecycle.
4. Failed image generation lacks a targeted user retry flow.
5. Image generation UI does not expose the actual final prompt submitted to the
   image agent/provider.
6. Failed/completed gameplay lifecycle presentation remains basic and should
   later use a more game-like overlay/modal where appropriate.
