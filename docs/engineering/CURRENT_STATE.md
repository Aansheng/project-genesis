# Engineering Control Plane — Current State

This is a concise orchestration projection. PROJECT_STATE.md and actual source
code remain the product authority.

architecture_version: v1.181 (Sprint 31 frozen; Sprint 32 Product Gap Discovery complete; one primary WO ready)
current_sprint: Sprint 32 (Survival Playability Gap)
current_work_order: WO-S32-001 — Generic Player-Directed Short-Range Offense
current_work_order_status: READY — execution not started
current_control_plane_work_order: SPRINT32_PRODUCT_GAP_DISCOVERY
current_control_plane_work_order_status: DONE
last_completed_work_order: WO-S31-002 — Current Observatory Metadata Source
last_completed_product_work_order: WO-S31-002
last_completed_control_plane_work_order: SPRINT32_PRODUCT_GAP_DISCOVERY
next_ready_work_order: WO-S32-001 — Generic Player-Directed Short-Range Offense
product_architecture_changed: NO — Sprint 32 discovery only; implementation remains pending
sprint_status: Sprint 30 is FROZEN at v1.180 and Sprint 31 is FROZEN at v1.181
  by Human/CTO decision on 2026-08-31. Sprint 32 is AUTHORIZED for Product Gap
  Discovery; discovery is complete and exactly one primary product WO is READY.
code_complete: YES for WO-S31-001 and WO-S31-002; product_verified: YES for
WO-S31-001 and WO-S31-002; Sprint 32 WO-S32-001 is READY and not executed

## Sprint 32 Product Gap Discovery and selected primary WO

Human/CTO froze Sprint 31 at v1.181 and authorized Sprint 32 Product Gap
Discovery on 2026-08-31. The real Studio session used
`生成一个幸存者游戏`, produced active deterministic-fallback `world-1`, and
was exercised through movement plus multiple same-session gameplay/lifecycle
cycles.

The first user-visible blocker is a **PRODUCT_GAP in intentional offensive
interaction**. The Game surface exposes only `Arrow Keys — Move`; the first
Enemy contact observed without an explicit attack changed Enemy Health
`100 → 75` while Player Health changed `100 → 99`; Player and Enemy then
remained co-located under target-directed pursuit. Repeated damage was only
observable through route-remount lifecycle cycles, not through a clear player
attack action. A replacement Enemy preserved the active session and component
composition but resumed pressure at the Player's position.

The source audit confirms that the smallest generic alternative can reuse the
existing `Space` input, Runtime Position/Health, deterministic target selection,
and trusted `DAMAGE_ENTITY` action. There is no current nearest/range selector,
attack input fact, or projectile requirement. Timers, waves, projectiles,
upgrades, scaling, and a Survival-specific combat system are explicitly outside
the selected slice.

Exactly one next WO is generated:
`WO-S32-001 — Generic Player-Directed Short-Range Offense`, READY for execution
in a later step. This discovery step does not execute it, enter Sprint 33, or
change the architecture version.

## Sprint 31 Gap Analysis, completed WOs, and selected freeze review

The fresh post-freeze audit found two independent projection defects. The first
divergence for progression was `GameViewportPanel` constructing a fresh
`DefaultRuntimeExecutionLoop` without a supplied progression store on each
route mount; the loop's default Runtime store therefore re-published `0 / 1`.
The first divergence for metadata was the current centralized
`apps/web/src/projectMetadata.ts`, whose values were stale at `v1.177 / Sprint
27`. The current Observatory header and Overview consume that source; the
Observatory store now owns only local selection/status UI state, and the Sprint
25 metadata bridge is FROZEN_LEGACY with no current production caller.

The independent progression defect ranked first because it corrupted active
gameplay truth. `WO-S31-001` is complete at v1.181: the existing Runtime
progression store is held once by `gameStore` as a raw app-session object and
passed into every remounted execution loop. Runtime remains the authority and
the Observatory remains a projection. No persistence, duplicate XP state,
route-state framework, manager, or legacy reconnection was added.

Automated checks and real Studio verification passed. Exact Survival generation
reached `world-1`, Full Observatory showed active `1 / 2`, Game returned with
the same world and continued, and Full Observatory then showed active `2 / 2`.
Browser error/warning diagnostics were empty.

`WO-S31-002` then corrected the existing centralized source to `v1.181 / Sprint
31`. Header and Overview continue to consume that one immutable source, and a
production route regression proves source → Full Observatory display without
reconnecting the FROZEN_LEGACY bridge. The complete real PV retained
`world-1`, active Runtime progression `经验值: 2 / 等级: 2`, current metadata
across repeated navigation, and an empty browser error/warning diagnostic.

Fresh Sprint 31 Gap Analysis: **PASS**. Runtime progression and current
architecture/Sprint metadata both project truthfully through Full Observatory.
The partial image queue and the unproduced Runtime Stats system/event/FPS
metrics remain deferred, non-blocking observations inherited from Sprint 30.
Sprint 31 is now FROZEN at v1.181 by Human/CTO decision. Sprint 32 Product Gap
Discovery is authorized and complete; `WO-S32-001` is the only READY primary
WO. No implementation was performed in the discovery step.

## Sprint 30 Gap Analysis and selected blocker

At authorization, `SPAWN_ENTITY` already existed in the shared rule vocabulary
and AI validation, `ENTITY_REMOVED` was a supported Runtime fact, and
`WorldMutator.addEntity()` could update an active snapshot. The Runtime action
executor rejected spawn, there was no entity-count rule reference, and no timer
rule existed. Neither count nor timing was needed for the first bounded cycle:
one Enemy removal could trigger one replacement.

WO-S30-001 was the single selected blocker. It reuses the current generic
Runtime composition used by World Evolution additions, keeps the replacement
ephemeral to Runtime gameplay authority, and adds binding-only reuse of the
canonical Enemy visual. No wave/spawn manager or AI call was authorized.

## Sprint 30 Implementation and Verification

The trusted `SPAWN_ENTITY` action now resolves an existing semantic Enemy
template, creates one deterministic Runtime-only entity through the shared
composition helper, and commits it with `WorldMutator.addEntity()` in the
current active snapshot. A committed `ENTITY_REMOVED` fact carries the
authoritative zero Health result from Gameplay Rule removal, so semantic World
evolution removals (which retain their prior Health) do not accidentally
replenish gameplay entities. The new entity receives Position, Health,
collision bounds, target-directed movement, and the existing category-based
contact rules. Web projects its resolved canonical Enemy resource through
binding-only manifest entries; no provider or image-generation call is made.

Automated production reachability passes: four contacts defeat the Enemy,
the next mutation boundary emits `ENTITY_REMOVED(health=0)`, one replacement
executes, the replacement has the full composition, and it can damage Player
and take offense damage while the session remains active. Full package tests,
TypeScript, package ESLint, Web build, and diff hygiene pass. Root Turbo lint
is blocked by this host's missing TLS keychain, while all package lint commands
exit 0 with existing warnings only.

Product Verification classification: **YES**. A fresh Chrome-backed Studio
session submitted `生成一个幸存者游戏`, kept `world-1` active at five entities,
defeated an Enemy through independent contact starts, and observed two
Runtime-only replacements. The Event Stream showed committed
`ENTITY_REMOVED → SPAWN_ENTITY → ENTITY_ADDED` facts; replacement components
included Position, Health, collision, target-directed movement, and contact
compatibility. XP/Level reached `1/2` and then `2/2`; visual operations stayed
at nine with no new provider/image-generation activity; browser warning/error
diagnostics were empty.

Fresh Sprint 30 Gap Analysis: **PASS**. Page-remount progression projection,
stale full Observatory header metadata, and partially settling image statuses
were non-blocking for the frozen Sprint 30 gameplay thesis. The first two
findings became the measured input to authorized Sprint 31; WO-S31-001 closed
progression and WO-S31-002 is the next READY metadata item.

## Sprint 29 Gap Analysis and result (historical)

Repository truth showed that generic Enemy Health, `DAMAGE_ENTITY`, explicit
non-player removal, atomic multi-action rules, Runtime XP/Level, and contact
identity already existed. There is no timed/cooldown trigger, range/nearest
condition, projectile executor, or gameplay spawn executor. The first smallest
gap was production RuleSet composition, not a combat framework.

WO-S29-001 composed 25 contact damage, typed zero-Health removal + XP, and the
existing first Level threshold. Automated production reachability proved the
four-contact defeat chain and continued active session. Real Studio proved
provider acceptance, initial/evolved Enemy damage, pursuit, same-world exact
+5 compatibility, and clean diagnostics. The fresh Gap Analysis found no
immediate offense blocker; Human/CTO accepted `SPRINT29_FREEZE_REVIEW` and
froze Sprint 29 at v1.179 before entering Sprint 30.
prior_product_verification: YES for WO-S18-004 — exact semantic Platform
  binding, camera-visible Ground tiling over Runtime authority, and
  non-regressed gameplay/diagnostics are observed
continuation_mode: SPRINT_CONTINUOUS
control_plane_status: SPRINT_CONTINUOUS; sequential same-Sprint execution only;
  max_concurrent_subagents=2; repair_budget=3; Sprint boundary stop enabled;
  automatic cross-Sprint execution disabled

## Sprint 30 goal (historical; frozen)

Sprint 30 — Sustained Survival Loop was:

1. Sustain a generated Survival loop through one bounded Enemy replacement.
2. Reuse `ENTITY_REMOVED`, trusted generic Runtime creation, current Enemy
   composition, and binding-only visual identity without a wave framework.
3. Complete real Studio Product Verification, perform fresh Gap Analysis, and
   stop at `SPRINT30_FREEZE_REVIEW`. This goal is complete and Sprint 30 is
   frozen; current work is governed by the Sprint 31 section above.

Sprint 25 is frozen at v1.173. Its audit-only WO-S25-001 is complete and the
freeze review is recorded in `docs/project/SPRINT25_REVIEW.md`.

## Sprint 27 Initial Gap Analysis

The existing source chain reaches Survival classification and generic two-axis
motion, but the visual path has no shared spatial contract. Visual/asset
builders request side-view assets, Player requirements include `jump`, and
terrain uses `ground-repeat-x`. Survival vertical input is written directly to
Position while the Renderer adapter only sees horizontal Runtime velocity.
When environment terrain resolves, Pixi suppresses terrain entities and draws
a horizontal ground strip; background prompts request sky/horizon scenery.

The selected smallest slice is `WO-S27-001`: add only the bounded
`WorldSpatialMode`, opt-in generic vector velocity, Runtime-derived four-way
direction, top-view/arena-fill asset and Prompt Truth semantics, and a
camera-visible repeatable X/Y arena surface. Theme evolution must preserve the
mode. No genre-specific Runtime/Renderer or gameplay-pressure work is opened.

## Sprint 27 Product Verification Target

Real Studio shows a provider-backed `生成一个幸存者游戏` with
`worldType: survival`, Arrow Keys-only controls with no Jump, a coherent
top-down arena without Mario sky/horizon or horizontal Ground/Platform strip,
Runtime position/velocity continuity, clean console diagnostics, and actual
submitted top-down/arena-fill/top-view Prompts. Published Survival assets
reached `manifest updated → resolved → Renderer applied` and appeared in the
real canvas. Human/CTO real-product verification confirms the existing
7-entity side-view Mario/Platformer and gameplay experience remains correct;
the earlier automated Space observation is an
`AUTOMATED INPUT / OBSERVATION LIMITATION`, not a product regression. Code
Complete is YES and Product Verified is YES. No Jump, collision, controller,
or Platformer repair WO is opened.

## Sprint 27 Gap Analysis Post Product Verification

The Sprint 27 thesis passes: Survival is immediately recognizable as a
top-down game through its X/Y arena composition, environment, repeatable
arena-fill terrain, top-view asset Prompt Truth, and Runtime-derived
four-direction Player presentation. Platformer non-regression is PASS by the
existing automated evidence plus Human/CTO real-product verification.

No additional measured Spatial & Visual Composition blocker exists. Human/CTO
accepted the freeze at v1.177 and separately authorized Sprint 28. Do not add
visual polish as a new WO or treat the earlier automated Space observation as a
Platformer defect.

## Sprint 28 Initial Gap Analysis

The inspected production chain is:

`StudioCommandBar → gameStore → IntentRouter / CreateWorldPipeline → Semantic
World → Game DSL → Runtime projection → Runtime system registry /
DefaultRuntimeExecutionLoop → Gameplay event collector /
EntityContactSystem → post-system GameplayRuleExecutor → Runtime World,
Health, and session state → RuntimeRendererAdapter / Pixi → Observatory`.

Source findings:

1. Survival enemies are stationary in the current production composition:
   initial enemies have semantic, Position, Health, and collision-bounds
   components, but no Velocity and no target reference.
2. Generic Position, Velocity, collision-bounds, Health, and semantic
   components exist. `DefaultRuntimeProjection` projects them without
   behavior.
3. The current `DefaultMovementSystem` applies fixed deltas, and
   `DefaultVerticalMotionSystem` integrates Player only. Survival's real
   registry has PlayerController, VerticalMotion, EntityContact, and gameplay
   execution, but no target-directed movement system.
4. Contact damage is already production-reachable on the deterministic/default
   Survival path: collision bounds → `ENTITY_CONTACT_STARTED` → the existing
   `survival-enemy-contact` rule → trusted `DAMAGE_ENTITY` → Player Health and
   session state. It is contact-start based rather than repeated while an
   overlap remains.
5. Generic Health, damage, failed state, and same-session Respawn are reusable
   unchanged for this bounded slice and are already product-verified.
6. Same-world `再加五只怪` preserves session and exact entity count, but the
   evolution synchronizer does not yet give added enemies the full initial
   Enemy Health/Velocity composition or any pursuit behavior.

**Selected first blocker:** missing generic Runtime target-directed movement /
pursuit execution. This is the smallest blocker because contact threat and
recovery already exist, while no registered Runtime capability can move an
eligible Enemy toward the current Player and update that direction after Player
movement. The single selected item is `WO-S28-001`; no second Sprint 28 WO is
created.

See `docs/project/SPRINT28_BACKLOG.md` for the complete nine-question audit,
bounded scope, acceptance, and manual verification contract.

## Sprint 28 Implementation and Product Verification

WO-S28-001 is implemented at v1.178. The production chain now composes
`TargetDirectedMovementComponent(targetEntityId, speed)` onto initial and
same-world added Survival enemies. `DefaultTargetDirectedMovementSystem`
resolves the current target Position and writes normalized finite Velocity;
`DefaultVelocityMotionSystem` integrates Position for eligible entities. The
Runtime behavior is generic and component-driven; Survival selection remains
at the Web composition boundary, and Platformer registration is unchanged.

Human/CTO confirms automatic pursuit and the existing contact damage path. A
single Health decrease while entities remain overlapped is expected because
`EntityContactSystem` emits one `ENTITY_CONTACT_STARTED` until separation;
continuous attack damage remains outside this WO.

The reported incremental visual gap was repaired in the existing Web visual
evolution seam. Final real Studio verification passed: `world-1` remained the
same while `再加五只怪` changed 4 Runtime entities to 9 with exactly five
additions. All five additions had `target-directed-movement(target=survivor,
speed=1.5)` and followed the Player after real ArrowRight input x=80→83→86.
The final Diff recorded five visual binding additions and binding-only
execution with no generation required; visual operations remained 8, 6
ready/0 active/0 fallback, manifest assets were 13 generated-origin entries,
and the console was clean. The current Observatory does not expose
per-entity canonical IDs or URLs; its available synchronized
binding/no-generation evidence and visible canvas result are recorded without
inventing those values. Product Verified is YES. The stale v1.177/Sprint 27
Observatory header is a metadata projection mismatch, not a Survival
gameplay-pressure blocker.

## Sprint 28 Fresh Gap Analysis — 2026-08-28

The real production path now satisfies the bounded thesis: Enemy approaches
the current Player, contact threatens Player through the existing
`ENTITY_CONTACT_STARTED` damage semantics, and Player avoidance input is
observable. Same-session +5 evolution preserves Runtime entity independence,
generic pursuit composition, and the existing Enemy visual identity without
duplicate image-generation operations. No additional measured Survival
gameplay-pressure blocker exists.

`SPRINT28_FREEZE_REVIEW` is selected as the next gate. Sprint 29 is not
entered automatically.

## Sprint 26 Initial Gap Analysis (historical)

The exact Chinese request `帮我生成一个2D幸存者游戏` routes with genre
confidence `1.0`, extracts `survival`, reaches six entities, and now uses a
top-down generic motion profile. Real Studio observed Player `x:80→83` and
`y:300→297`, with clean diagnostics; platformer controls remain intact.
WO-S26-001 and WO-S26-002 are complete.

The fresh post-WO measurement closed active-world enemy addition recovery:
`再加五只怪` preserved `world-1` and changed the survival world from six to 11
entities through truthful deterministic fallback. The bounded Sprint 26 proof
is complete; the only next gate is SPRINT26_FREEZE_REVIEW. Enemy chase,
offense, spawning, waves, duration, and progression expansion are explicit
deferred non-goals, not new WOs.

## Sprint 26 Gap Analysis Post WO-S26-001

The alias blocker is closed by source tests and real Studio behavior: the
requested Chinese input created six entities (`player/resource/tree/stone/
enemy/campfire`) in an active Runtime/Pixi session; Player Inspector showed
`Position (80,400)` and browser warning/error diagnostics were empty.

The next measured product gap is motion-profile selection. The existing Web
composition wires platformer-only systems unconditionally, and the survival
viewport visibly advertises `Space Jump`. A discrete ArrowRight probe did not
move the inspected Player, so movement is not claimed as verified yet. Reuse
the existing four-direction controller and generic Runtime motion seam in
WO-S26-002; do not add Survivor-specific execution or rendering.

## Sprint 26 Gap Analysis Post WO-S26-002

The motion-profile blocker is closed: survival uses the existing generic
four-direction controller, the viewport omits `Space Jump`, and real Studio
observed horizontal and vertical Player movement while the platformer control
surface remained unchanged.

The next measured product gap is active-world five-enemy addition recovery.
Three equivalent enemy-addition requests failed with the structured evolution
provider in local Studio and left `world-1` at six entities. The existing
deterministic planner lacks enemy aliases, and no provider-error fallback is
wired at the Web command boundary. Reuse the existing semantic, Runtime, and
visual evolution seams in WO-S26-003; do not add Survivor-specific execution
or rendering.

## Sprint 26 Gap Analysis Post WO-S26-003 (historical; superseded)

The bounded acceptance is complete. Clean-page Studio evidence confirms the
exact Chinese request creates an active six-entity survival world, generic
top-down movement works in two axes, and same-world `再加五只怪` keeps `world-1`
and produces 11 Runtime/visual entities via deterministic fallback. Observatory
reports the actual `deterministic · fallback / provider_failed` source and
browser warning/error diagnostics are empty.

At the time, no further blocker was selected within the authorized Sprint 26
target. Enemy chase, offense, spawn/wave, timer/survive-duration,
ability/inventory, and progression expansion remain explicitly deferred
non-goals. The later Human/CTO priority correction superseded this freeze-only
projection and opened Sprint 27.

## Sprint 24 Gap Analysis Post-PV

Fresh Gap Analysis found no new lifecycle-presentation blocker. The measured
completed + ArrowRight movement is expected exploration under the clarified
Victory contract, not a Runtime defect. Cancel WO-S24-002; do not change
`DefaultRuntimeExecutionLoop` to gate `completed`. Select
`SPRINT24_FREEZE_REVIEW`; Sprint 25 is not entered automatically.

Sprint 21 — Free-form Conversational World Evolution (FROZEN):

1. A free-form follow-up outside the narrow deterministic vocabulary reaches
   semantic AI interpretation rather than `Unknown command` when a current
   world exists.
2. Genesis validates any candidate and executes only the existing targeted
   semantic/Runtime/Gameplay/Visual evolution path.
3. The same Runtime session survives a validated targeted addition.

WO-S21-001 is Product Verified in the real provider-connected Studio: a
seven-entity `world-1` with one Enemy received `增加5个enemy` (Enemy `1 → 6`)
and then `再加五只怪` (Enemy `6 → 11`). Both result messages reported targeted
Runtime synchronization and completed visual synchronization; Player
`(80,400)`, Health `100/100`, XP `0`, Level `1`, original entities, and active
gameplay remained, with no browser warning/error. The non-Enemy ADD measurement
also passed: `再加两个金币` changed Coin/collectible count `1 → 3` and entities
`7 → 9`, retained the same world/session and all baseline state, completed
Runtime/visual synchronization without duplicate Coin work, and left the
browser diagnostics clean. The fresh bounded next measurement is
`删掉一个敌人` for operation diversity; it is not a new work order and is not
pre-authorized for implementation. The operation-diversity measurement also
passed: `删掉一个敌人` is a deterministic target miss that reached the existing
AI World Evolution path and changed Enemy `1 → 0` / entities `7 → 6`, with
the same `world-1`, Player, Health, XP/Level, collectible, terrain/Platform,
active session, Runtime/visual synchronization, and clean browser diagnostics.
The single-Enemy baseline makes the remaining shared-Enemy visual condition
inapplicable. Fresh Gap Analysis selects SPRINT21_FREEZE_REVIEW rather than
another conversational feature measurement.

The v1.173 active-world create/generate routing repair received one bounded
real Studio preflight before Sprint 24 verification resumed: `world-1` with 7
entities accepted `再创建5个怪物` as targeted evolution and became 12 entities
with the baseline preserved; `创建一个新的游戏` intentionally created
`world-2`. Sprint 21 remains frozen and no new Sprint/WO was created.

Sprint 20 — Playable Platform Geometry (FROZEN):

1. Make a generated semantic Platform a Runtime-authoritative playable surface.
2. Preserve global Ground, jump, gravity, Runtime-authoritative geometry, and
   Sprint 18/19 visual/presentation behavior.
3. Prove real Studio landing, standing, edge fall, and gameplay continuity.

Sprint 18, Sprint 19, Sprint 20, and Sprint 21 remain frozen. Sprint 22 was
explicitly authorized and has completed its bounded discovery measurement.

## Problem Register

The following separately measured high-priority product problems are preserved
after the Sprint 19 freeze. They are not part of WO-S19-002 and require fresh
product-level prioritization:

- Free-form World Evolution remains the next likely high-priority gap:
  `增加5个enemy` can return `Unknown command`.
- A follow-up such as `增加5个enemy` can return `Unknown command`, indicating
  that the front-door intent layer rejects valid free-form World Evolution
  requests outside deterministic mappings.
- Full Observatory runtime-state loss is not reproducible in the current SPA
  path: RouterLinks preserve the application-scoped store and real Studio
  navigation retained the active Runtime/session. Closed for the bounded
  Sprint 22 continuity question; durable refresh/close persistence is not in scope.
- Failed image generation lacks a targeted user retry flow.
- Image generation UI does not expose the actual final prompt submitted to the
  image agent/provider.
- Failed/completed gameplay lifecycle presentation is now covered by the
  bounded Runtime-authoritative Studio overlay and real lifecycle PV. No new
  lifecycle-presentation blocker was measured; completed exploration remains
  intentional product behavior.

## Completed

- Sprint 14 semantic world evolution is frozen and browser-verified.
- Sprint 15 capability-specific generation context is complete.
- Sprint 15 GameplaySpecification, bounded GameplayEvent observation, validated
  GameplayRuleSet, and the single supported REMOVE_ENTITY execution slice are
  complete and browser-verified.
- WO-S15-005 is complete and browser-verified: Runtime AABB contact direction,
  generic enemy-stomp matching, staged REMOVE_ENTITY + APPLY_VELOCITY,
  enemy Runtime/Renderer removal, bounce/re-land, continued control, and
  truthful Observatory evidence are connected.
- WO-S15-006 is complete and browser-verified: generic Health defaults,
  supported DAMAGE_ENTITY execution, non-top contact damage, committed
  Health mutation, Inspector projection, and truthful Observatory evidence are
  connected without death/game-over behavior.
- WO-META-003 repository-native engineering control plane is complete.
- WO-META-004 hardens subagent task granularity, lifecycle/wait semantics,
  cancellation and zero-evidence rules, Supervisor gate ownership, current
  rollout concurrency, Trial #1 records, and S15-006 preparation without
  changing product architecture.
- WO-META-005 adds just-in-time gap analysis, measured-bottleneck selection,
  human-decision detection, generated-WO quality gates, Sprint-freeze detection,
  and the historical `ONE_WORK_ITEM_WITH_DISCOVERY` discovery semantics; the
  current continuation mode is `SPRINT_CONTINUOUS`.
- WO-S15-007 is complete and browser-verified: RuntimeGameplaySessionState is
  the current world/session completion authority; trusted `COMPLETE_GOAL`
  commits `active → completed`, repeated completion is a no-op, semantic
  evolution retains completion, and world/session replacement resets the new
  session to `active`.
- Sprint 15 Freeze Review is complete: all sixteen Sprint-level acceptance
  criteria pass against source wiring, automated regressions, accumulated
  Studio evidence, and Observatory truth. Sprint 15 is frozen at v1.154.
- `SPRINT16_DISCOVERY` is complete: Human/CTO accepted targeted Gameplay Rule
  Reconciliation, and the first bounded Sprint 16 product WO is complete.
- `WO-S16-001` is complete at v1.155: applied semantic evolution now performs
  deterministic targeted Gameplay Rule reconciliation before semantic commit;
  unaffected rules remain executable, affected rules are rebuilt/revalidated
  or removed/deferred, the same Runtime/session continues, and Observatory
  exposes separate reconciliation facts.
- Human/CTO CONTINUE decision is recorded: WO-S16-001 closes Part 1 but does
  not satisfy the corrected Sprint 16 goal; Sprint 16 is NOT READY FOR FREEZE.
- Next-Work Discovery identified the smallest measured Part 2 bottleneck:
  `CHANGE_NUMERIC_STATE` and `gameState` references exist in the Shared/AI
  schema, but Runtime had no authoritative numeric state or executable action
  path. WO-S16-002 closed that gap at v1.156.
- WO-S16-002 is complete and Product Verified: the existing GameplayEvent →
  GameplayRule path can commit finite additive deltas to an immutable
  Runtime-owned keyed numeric state; the default collect-reward rule adds
  `experience +1`, semantic revision changes retain the state, and a new
  world/session resets it.
- The post-WO-S16-002 Next-Work Discovery generated exactly one bounded item:
  `WO-S16-003 — Deterministic XP Threshold Level Transition`; Human/CTO chose
  CONTINUE and SPRINT_CONTINUOUS auto-started that single READY item. No Sprint
  17 work was generated or crossed.
- WO-S16-003 is complete at v1.157 and Product Verified: one supported contact
  event commits `experience +1`, the typed `experience >= 1 AND level < 2`
  threshold commits Level 1 → Level 2 exactly once, same-session semantic
  evolution retains both values, a new world/session resets to `0/1`, and
  stale World A bindings cannot mutate World B.
- The fresh post-WO-S16-003 Sprint Freeze Review passed all eight corrected
  criteria. Human/CTO chose FREEZE; Sprint 16 is FROZEN at v1.157 with Code
  Complete = YES and Product Verified = YES.
- Human/CTO approved the Sprint 17 goal on 2026-08-24. Fresh discovery measured
  the missing default collectible composition as the smallest blocker and
  generated exactly one bounded READY item: `WO-S17-001`.
- `WO-S17-001` is Code Complete at v1.158: the default deterministic platformer
  now contains a stable collectible and the existing collect → XP → level path
  remains generic and unchanged. Deterministic fallback Studio verification
  observed seven generated entities, collectible removal, `Experience: 1`,
  `Level: 2`, and clean browser logs.

- Human/CTO approved WO-S17-002: a structurally valid but incomplete platformer
  candidate must not be accepted as the generation result; it must fail closed
  into the deterministic baseline. A complete candidate remains acceptable.
- `WO-S17-002` is complete at v1.159 and Product Verified: the existing
  validator now runs the bounded platformer baseline gate after structural
  validation; diagnostics distinguish accepted, structurally invalid,
  product-incomplete, and provider-failed outcomes; Studio and full Observatory
  show `deterministic_fallback` plus `product_incomplete` for the real Codex
  CLI candidate; fallback traversal removed the collectible and committed
  `experience: 1`, `level: 2` with clean browser logs.
- Post-WO-S17-002 product-level Gap Analysis found one measured execution
  blocker in the same real fallback session: the broad deterministic
  `collect-reward` item-category condition matched the `goal` item first,
  removed the goal, and left the Runtime session `active` instead of allowing
  `reach-goal` to complete. Exactly one next product WO was generated:
  `WO-S17-003`, READY with no Human/CTO decision required, and execution began
  automatically. Sprint 18 is not entered automatically.
- WO-S17-003 is complete at v1.159 with no new architecture layer: exact
  collectible ID conditions isolate collection/progression from goal and
  checkpoint items, while the existing Runtime evaluator preserves event
  participant identity when an earlier rule in the same event removes the
  target. Real Studio traversal reached `Experience: 1`, `Level: 2`, Health
  100→99, enemy stomp removal, and committed `reach-goal` completion in one
  fallback session; Full Observatory showed the ordered rule/event facts and
  browser error/warning logs were empty.
- Human/CTO Sprint 17 Freeze Review chose CONTINUE on 2026-08-25. Fresh
  lifecycle measurement found the smallest remaining blocker: lethal player
  damage reaches Health `0`, but the Runtime session remains `active` and no
  same-world recovery operation exists. Exactly one bounded READY item was
  generated: `WO-S17-004`.
- WO-S17-004 is complete at v1.160 and Product Verified: trusted lethal player
  damage commits Runtime `failed`, failed ticks stop gameplay rule execution,
  and the Studio Respawn control invokes a Runtime-owned same-world recovery
  that restores Health/velocity while preserving position, entities,
  progression, and World Evolution continuity. Real Studio verification
  confirmed the button and recovery; the existing contact rule can immediately
  reduce restored `100/100` to `99/100` when the preserved position overlaps
  the enemy.
- Human/CTO froze Sprint 17 on 2026-08-25. `SPRINT17_REVIEW.md` reconciles the
  complete success and bounded failure/recovery evidence; enemy AI, hazards,
  lives, checkpoints, score, pacing, visual polish, offline evolution fallback,
  and stale Full Observatory metadata remain explicitly non-blocking.
- Human/CTO authorized Sprint 18 — Visually Coherent Platformer Generation.
  Fresh Gap Analysis measured the missing asset render-usage contract as the
  smallest blocker and generated exactly one bounded item: `WO-S18-001`.
- WO-S18-001 is complete at v1.161 and Product Verified: bounded `renderUsage`
  metadata travels from current asset requirements through image requests,
  generation context, and manifest entries; prompt constraints derive from
  that fact. No Runtime or image-based geometry authority changed.
- Fresh post-WO-S18-001 measurement found the existing environment Renderer
  reused the ground material for platform entities even when an exact platform
  entity-sprite was present. WO-S18-002 is complete at v1.162 and Product
  Verified: the Renderer now consumes the bounded platform usage while keeping
  Runtime-projected position/bounds authoritative.
- WO-S18-003 is complete at v1.163 and Product Verified: a resumed real Studio
  run requested `entity-elevated-platform-primary` through `codex-cli`; Full
  Observatory recorded succeeded → published → manifest updated → resolved →
  Renderer applied for `elevated-platform`. The visible grass-and-rock platform
  has no unrelated scenery and fits the local 96×24 Platform projection; no
  crop/stretch/tile defect, Runtime-geometry change, gameplay regression, or
  browser warning/error was observed. A later direct Human/CTO observation
  measured a distinct Ground coverage defect and superseded the initial
  no-gap conclusion.
- WO-S18-004 is complete at v1.164 and Product Verified: measurement proved
  the continuous Runtime `groundY=400` plane was correct while Renderer drew
  only one `64×32` terrain catalog sprite. The existing `ground-repeat-x`
  material now tiles across the camera-visible authoritative interval; no
  Runtime/collision change or Platform reuse was introduced.
- Historical pre-WO-S17-002 evidence: the configured AI gateway produced a structurally
  valid but mechanically
  incomplete platformer candidate containing only `player` and `platform`.
  Observatory truthfully reported `ai · success`, `Validation: passed`, and
  `Entities: 2`; this failed the primary product gate. Fresh discovery
  generated exactly one blocked next item: `WO-S17-002`.

## Active capabilities

- Natural-language world creation through the current Studio command path.
- Semantic World → Game DSL → Runtime projection.
- Runtime movement, jump, gravity, vertical motion, basic ground collision, and
  targeted entity mutation.
- Bounded Runtime gameplay facts: jump, landing, contact-start, add, remove.
- Genesis-validated gameplay rules with only current supported rules executable.
- Generic REMOVE_ENTITY and APPLY_VELOCITY rule execution after finalized
  Runtime events; the approved enemy-stomp rule is the bounded two-action slice.
- Generic Health components for player/enemy/npc and trusted DAMAGE_ENTITY
  mutation after finalized non-top contact events; lethal player damage makes
  the Runtime session `failed`.
- Same-world Runtime respawn restores the player's current Health maximum and
  existing velocity to zero, resumes `active`, and preserves current entities,
  numeric progression, semantic revision, and World Evolution continuity.
- Generic `COMPLETE_GOAL` execution after finalized player→goal contact, with
  immutable RuntimeGameplaySessionState as the sole completion/failure
  authority and committed Renderer/Observatory projection.
- Typed Runtime-owned contact direction and deterministic rule-level staged
  all-or-nothing execution for the two trusted stomp actions.
- Pixi Renderer synchronization and truthful Observatory projections.
- Targeted semantic, Runtime, visual, and asset evolution in the current
  session, with stale/revision guards.
- Targeted Gameplay Rule Reconciliation is implemented and current: the Web
  semantic-evolution commit boundary consumes the deterministic reconciler and
  commits the updated semantic world and RuleSet together.
- Runtime owns an immutable keyed finite numeric state bound to the current
  world/session. The existing `CHANGE_NUMERIC_STATE` action commits finite
  additive deltas through the GameplayEvent → GameplayRule path.
- The deterministic platformer collect-reward rule removes the collected item
  and commits `experience +1`; the following typed `NUMBER_COMPARE` threshold
  rule commits `level +1` from the Runtime baseline `level=1` to `level=2`.
  Both committed values are forwarded through the existing Renderer loop and
  shown separately in the Observatory Runtime view.
- Numeric progression state survives non-replacing semantic revision changes
  in the same Runtime/session, starts at `experience=0, level=1` for a new
  binding, and rejects stale World A/B bindings and failed multi-action rules.
- Sprint-level generic gameplay thesis is verified: structured intent/rules,
  Runtime facts, generic matching, trusted actions, three interaction slices,
  continuity, isolation, and truthful projections are all present.

## Deferred capabilities

- Upgrade/skill selection and progression-driven modifiers.
- Score or other numeric gameplay state beyond the bounded `experience`
  progression use case.
- Game-over, lives, checkpoints, victory UI, next level, restart beyond the
  bounded same-world respawn, score, later level curves, skills, modifiers,
  timers, spawns, goal deletion, rich actions,
  enemy AI,
  unrelated rich multi-action transactions, generic gameplay state, and broad
  gameplay-rule evolution beyond the bounded reconciliation WO.
- Durable gameplay/context/evolution history, replay, persistence, and reload
  recovery.
- Reference-image transport, similarity search, durable generated assets,
  animation, and tilesets.

## Known environment issues

- Existing AI/Renderer/Web package lint warnings/debt are recorded in
  docs/project/TECH_DEBT.md and are unrelated to WO-S16-003.
- In this managed environment, the root `pnpm typecheck` Turbo wrapper cannot
  initialize its API client because TLS/keychain access is unavailable; direct
  TypeScript checks for all affected packages pass. A parallel Renderer Vitest
  run can also expose jsdom canvas noise; the standalone Renderer suite passes.
- When the local AI gateway at `127.0.0.1:8787` is unavailable, Studio World
  Creation uses its deterministic fallback but World Evolution currently fails
  before reconciliation because its structured candidate provider is gateway-
  dependent. WO-S16-001 was verified with a localhost-only structured candidate
  gateway; offline evolution fallback is deferred/non-blocking and is not the
  current Sprint 16 gameplay bottleneck.
- Compatibility exports, test-only mock Observatory loading, inert streaming
  state, and legacy Canvas2D renderWorld() remain in the repository; current
  production Studio wiring does not use them.

## Known documentation mismatches

- AI_GENERATION_CAPABILITY_MATRIX.md has an older v1.123 header.
- VISUAL_CAPABILITY_MATRIX.md has an older v1.149 header.
- `AI_GENERATION_CAPABILITY_MATRIX.md` and `VISUAL_CAPABILITY_MATRIX.md`
  still carry older architecture headers; those remain projection debt and
  are not the current visual product bottleneck.

For current work, use PROJECT_STATE.md, actual source wiring, accepted ADRs,
and the current gameplay matrix. Update those older matrix headers in their
own capability-focused work item rather than broadening WO-META-003.

## Current product gaps

Fresh Sprint 32 Product Gap Discovery (2026-08-31):

- **Selected PRODUCT_GAP:** Survival offense is contact-only in the current
  product. The visible Game surface does not expose an attack input; the first
  Enemy damage is an automatic contact side effect that also damages the
  Player, and same-position replacement pressure makes the interaction
  ambiguous. This is the first largest user-visible blocker.
- **Secondary PRODUCT_GAP:** replacement placement/pacing is awkward because a
  Runtime-only replacement can resume at the Player's current position. It is
  not a separate WO; it will be reassessed after offensive agency is usable.
- **Secondary PRODUCT_GAP:** XP/Level reaches `1/2` and `2/2` in Observatory,
  but the Game surface shows no visible consequence. It is not selected before
  the user can intentionally defeat an Enemy.
- **Selected next WO:** `WO-S32-001 — Generic Player-Directed Short-Range
  Offense` is READY, with implementation and Product Verification pending.
  No code, ADR, or Sprint 33 work is authorized by this discovery record.

Fresh post-WO-S17-002 Gap Analysis (2026-08-24):

- **Resolved PRODUCT_GAP / EXECUTION_GAP:** the deterministic platformer
  baseline contains `player`, `terrain`, `platform`, `enemy`, `collectible`,
  `goal`, and `checkpoint`; its generic RuleSet includes collectible removal,
  XP/level progression, enemy stomp, Health/damage, and goal completion.
- **Resolved GENERATION_TRUST_GAP:** the real Codex CLI provider path now
  passes structural validation only when appropriate, then fails closed when
  the platformer baseline is incomplete. The observed candidate was reported
  as `product_incomplete`, selected `deterministic_fallback`, and did not
  masquerade as a provider outage. Complete candidates are covered by the
  provider acceptance regression and do not select fallback.
- **Resolved PRODUCT_GAP / EXECUTION_GAP:** after collectible removal, the
  generic deterministic `collect-reward` rule no longer matches goal or
  checkpoint items. Exact event-target identity remains evaluable after the
  earlier same-event removal, so level-up and goal completion both commit.
- **Already verified:** natural-language create routing, provider/fallback
  selection, semantic world → DSL → Runtime projection, movement,
  jump/gravity/grounding, collectible removal, enemy stomp, non-top damage/
  Health mutation, Runtime numeric XP/level transition, goal completion,
  same-session evolution continuity, stale-world isolation, and truthful
  projections. The fallback Studio path observed `Experience: 1`, `Level: 2`
  after collectible contact.
- WO-S17-004 is Code Complete and Product Verified. Real Studio confirmed
  lethal player damage → visible `failed` state → Respawn control → same-world
  active play; the current player position is preserved and the next existing
  contact tick may truthfully apply one more nonlethal damage point, so the
  observed post-respawn Health can be `99/100` when respawning in contact.
  The bounded scope does not add checkpoints, lives, death animation,
  autonomous enemy behavior, hazards, score, or a manager.
- Autonomous enemy behavior, hazards, score beyond XP/level, richer pacing,
  persistence, and broad gameplay state remain deferred candidates.

`WO-S17-003` and `WO-S17-004` are complete and both the primary success
lifecycle and the bounded failure/recovery lifecycle are Product Verified.
The fresh post-WO-S17-004 measurement found no remaining product blocker in
the Sprint 17 platformer loop; only `SPRINT17_FREEZE_REVIEW` remains, blocked
on the Human/CTO decision. No Runtime authority or genre-specific Runtime was
added, and adjacent candidate gaps remain deferred.

Fresh Sprint 18 Gap Analysis (2026-08-25): the initial asset path exposed only
generic `kind` values to generation and manifest consumers. Environment
requirements did not preserve a typed usage, the prompt policy was kind-based,
and the environment Renderer selected one terrain resource for both terrain and
platform entities. The smallest measured blocker was the missing usage fact at
the existing asset boundary, so `WO-S18-001` added bounded `entity-sprite`,
`background-cover`, and `ground-repeat-x` metadata through the request/context/
manifest path.

Post-WO-S18-001 measurement against the real fallback-created scene then
confirmed the next smallest consumer gap: `PixiEnvironmentRenderer` still
ignored the exact platform entity-sprite when a ground material was resolved.
`WO-S18-002` added the usage-aware selection contract at v1.162, but a fresh
real image-backed measurement found that the production Runtime models both
`Terrain` and `Platform` as `type: terrain`; the adapter had dropped the
semantic name. The bounded v1.163 repair projects only `semantic.name` into
the Renderer and maps the Platform surface to the existing platform catalog
bounds. Runtime-projected position/collision geometry remains authoritative.

The resumed real Studio run resolved and applied the exact semantic Platform
asset through `codex-cli`; Observatory records
`entity-elevated-platform-primary` as succeeded/published/updated/resolved/
applied and bound to `elevated-platform`. Ground separately consumes its
existing `ground-repeat-x` material as a camera-visible tile across the
Runtime-authoritative ground plane. No scene contamination, Ground coverage
gap, Runtime-geometry change, or Platform material reuse remains measured.

WO-S19-001 is complete at v1.166 and Product Verified. The repaired
`DefaultPlayerControllerSystem` writes truthful horizontal
`VelocityComponent.x`; the existing `DefaultVerticalMotionSystem` integrates
that velocity into Position, release clears it, vertical/jump/collision
behavior is preserved, and a real registered input → Runtime → adapter →
Renderer reachability regression covers idle, right/left run, stop, jump,
airborne horizontal movement, landing, and facing. Real Studio verification on
2026-08-26 passed all nine required observations, including gameplay continuity
and clean browser console.

Fresh post-WO-S19-001 Sprint 19 Gap Analysis measured the actual remaining
blocker: sustained movement still displays one static run pose sliding through
the world. Exactly one next bounded WO was generated, `WO-S19-002 — Bounded
Player Run-Frame Presentation`, and execution began automatically because no
Human/CTO decision is required. The selected slice uses two independent run
images plus Player-only Renderer tick alternation; spritesheets,
AnimationManager, universal state machines, and skeletal animation remain
excluded.

WO-S19-002 is Code Complete and Product Verified at v1.167. Real Studio
observed two distinct generated run frames alternating during sustained right
and left movement; idle and jump stopped cycling; landing resumed cycling;
facing, Runtime/gameplay authority, the mechanically complete platformer flow,
and clean browser diagnostics remained intact. The implementation preserves
the old one-frame manifest fallback and all Runtime state/geometry authority.

Sprint 19 Freeze Review passed on 2026-08-26. The Player presentation loop is
frozen at v1.167; no Sprint 20 work is entered automatically.

## Next Recommended Verification

Execute the single READY `WO-S32-001` in a later bounded step. Its Product
Verification must use a real Survival session, preserve Runtime/Observatory
truth and current metadata, and stop if the measured first blocker changes.
Do not generate a second Sprint 32 feature WO or enter Sprint 33.

## Authority

1. Actual source/runtime contracts and production wiring.
2. Accepted ADRs.
3. docs/project/PROJECT_STATE.md, Sprint reviews, and capability matrices.
4. docs/engineering/WORK_QUEUE.md and this projection.
5. A temporary Supervisor plan.
