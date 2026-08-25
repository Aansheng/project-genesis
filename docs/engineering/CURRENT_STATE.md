# Engineering Control Plane — Current State

This is a concise orchestration projection. PROJECT_STATE.md and actual source
code remain the product authority.

architecture_version: v1.163 (bounded semantic platform projection repair; Product Verification pending)
current_sprint: Sprint 18 (ACTIVE)
current_work_order: WO-S18-003 — Ground-Repeat Composition Measurement
current_work_order_status: blocked
current_control_plane_work_order: SPRINT18_NEXT_WORK_DISCOVERY — post-WO-S18-002 Gap Analysis
current_control_plane_work_order_status: done
last_completed_work_order: WO-S18-002 — Consume Bounded Platform Usage in Environment Composition
last_completed_product_work_order: WO-S18-002
last_completed_control_plane_work_order: SPRINT18_NEXT_WORK_DISCOVERY — post-WO-S18-002 Gap Analysis
next_ready_work_order: WO-S18-003 — BLOCKED pending provider-backed platform application
product_architecture_changed: yes — bounded WO-S18-003 repair implemented v1.162 → v1.163; Product Verification pending
sprint_status: Sprint 17 is FROZEN at v1.160; Sprint 18 is ACTIVE under SPRINT_CONTINUOUS
product_verified: PENDING for WO-S18-003 — Sprint 17 success/failure lifecycles
  and WO-S18-001/WO-S18-002 remain Product Verified; the bounded semantic
  platform repair awaits provider-backed platform application evidence
continuation_mode: SPRINT_CONTINUOUS
control_plane_status: SPRINT_CONTINUOUS; sequential same-Sprint execution only;
  max_concurrent_subagents=2; repair_budget=3; Sprint boundary stop enabled;
  automatic cross-Sprint execution disabled; Sprint 19 boundary stop enabled

## Current Sprint goal

Sprint 18 — Visually Coherent Platformer Generation:

1. Preserve the Sprint 17 mechanically complete platformer lifecycle.
2. Assign generated visual assets according to actual semantic/render usage.
3. Compose visuals from Runtime-authoritative geometry; never infer gameplay
   geometry from image pixels.

Sprint 16 remains frozen at v1.157 and Sprint 17 remains frozen at v1.160.
Sprint 18 is continuous and sequential: each completed product WO triggers one
fresh Gap Analysis and exactly one next READY/BLOCKED WO; Sprint 19 is never
entered automatically.

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
- `apps/web/src/projectMetadata.ts` was corrected to project `v1.163` /
  `Sprint 18` after the bounded semantic platform projection repair. The older
  AI/visual capability matrices remain projection debt.
  `AI_GENERATION_CAPABILITY_MATRIX.md` and `VISUAL_CAPABILITY_MATRIX.md`
  still carry older architecture headers; those remain projection debt and
  are not the current visual product bottleneck.

For current work, use PROJECT_STATE.md, actual source wiring, accepted ADRs,
and the current gameplay matrix. Update those older matrix headers in their
own capability-focused work item rather than broadening WO-META-003.

## Current product gaps

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

The same real Studio run resolved and applied Background/Terrain/Player/Enemy
through `codex-cli` (4/9 ready, clean browser diagnostics), but
`entity-platform-primary` timed out at the provider boundary. Observatory
truthfully retained fallback, so WO-S18-003 remains blocked on exact
provider-backed platform application. Ground-repeat composition is not a
measured blocker and no tiling/Runtime geometry work is authorized.

## Next Recommended Verification

Sprint 17 success and failure/recovery are frozen and verified. WO-S18-001 and
WO-S18-002 are complete and Product Verified. WO-S18-003 has completed the
bounded measurement/repair portion but remains BLOCKED because the real
provider-backed Platform asset timed out before exact application could be
verified. Do not generate WO-S18-004, implement tiling/repeat or Runtime
geometry speculatively, or enter Sprint 19 automatically. The stale
capability-matrix headers remain projection debt and are not the current
product bottleneck.

## Authority

1. Actual source/runtime contracts and production wiring.
2. Accepted ADRs.
3. docs/project/PROJECT_STATE.md, Sprint reviews, and capability matrices.
4. docs/engineering/WORK_QUEUE.md and this projection.
5. A temporary Supervisor plan.
