# Engineering Control Plane — Current State

This is a concise orchestration projection. PROJECT_STATE.md and actual source
code remain the product authority.

architecture_version: v1.159
current_sprint: Sprint 17 (ACTIVE — Freeze Review gate)
current_work_order: SPRINT17_FREEZE_REVIEW — Sprint 17 Mechanically Complete Platformer Generation
current_work_order_status: blocked
current_control_plane_work_order: SPRINT17_FREEZE_REVIEW — Sprint 17 Mechanically Complete Platformer Generation
current_control_plane_work_order_status: blocked
last_completed_work_order: WO-S17-003 — Platformer Goal/Collectible Target Isolation
last_completed_product_work_order: WO-S17-003
last_completed_control_plane_work_order: WO-S17-003 — Platformer Goal/Collectible Target Isolation
next_ready_work_order: NONE — the post-WO-S17-003 Gap Analysis found no
  measured product blocker; Freeze Review is the single blocked horizon item
product_architecture_changed: yes — WO-S17-002 implemented v1.158 → v1.159
sprint_status: Sprint 17 is ACTIVE; Sprint 16 remains FROZEN at v1.157
product_verified: YES — WO-S17-003 passed real fallback traversal and the
  primary success lifecycle; Sprint Freeze Review remains a Human/CTO gate
continuation_mode: SPRINT_CONTINUOUS
control_plane_status: SPRINT_CONTINUOUS; sequential same-Sprint execution only;
  max_concurrent_subagents=2; repair_budget=3; Sprint boundary stop enabled;
  automatic cross-Sprint execution disabled

## Current Sprint goal

Sprint 17 — Mechanically Complete Platformer Generation:

1. Generate a simple platformer from one natural-language creation request.
2. Prove the existing generic movement, jump, collectible, enemy, damage/
   health, progression, goal, and Runtime session-completion path as one
   mechanically coherent loop.
3. Add failure/recovery only when a fresh product-level measurement shows it is
   required by the generated loop; do not pre-build candidate capabilities.

Sprint 16 remains frozen at v1.157. Sprint 17 is continuous and sequential:
each completed product WO triggers one fresh Gap Analysis and exactly one next
READY/BLOCKED WO; Sprint 18 is never entered automatically.

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
- Post-WO-S17-003 product-level Gap Analysis found no new measured blocker in
  the primary success lifecycle. Exactly one next control-plane item remains:
  `SPRINT17_FREEZE_REVIEW`, BLOCKED on Human/CTO FREEZE or CONTINUE. Sprint 18
  is not entered automatically.
- The configured AI gateway produced a structurally valid but mechanically
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
  mutation after finalized non-top contact events; zero Health is state only.
- Generic `COMPLETE_GOAL` execution after finalized player→goal contact, with
  immutable RuntimeGameplaySessionState as the sole completion authority and
  committed Renderer/Observatory projection.
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
- Death, respawn, game-over, enemy AI, victory UI, next level, restart, score,
  later level curves, skills, modifiers, timers, spawns, goal deletion, rich actions,
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
- `apps/web/src/projectMetadata.ts` still projects `v1.157` / `Sprint 16` in
  the Full Observatory header. This pre-existing metadata projection mismatch
  does not change the verified generation selection or Runtime truth and is
  deferred to a separately scoped metadata/projection work item.

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
- **Not a current blocker:** zero Health remains state only; the default
  baseline has no hazard, and its player-death failure condition is deferred.
  Failure/death, restart/respawn, autonomous enemy behavior, hazards, score
  beyond XP/level, richer pacing, persistence, and broad gameplay state remain
  candidates rather than pre-approved work.

`WO-S17-003` is complete and the primary success lifecycle is Product
Verified. No new measured blocker was found; the queue horizon is the single
blocked `SPRINT17_FREEZE_REVIEW` Human/CTO gate. No Runtime authority or
genre-specific Runtime was added.

## Next Recommended Verification

Sprint 17 product-level Gap Analysis is complete: the real fallback path
reaches truthful Runtime completion, and no new success-path blocker is
measured. Stop at `SPRINT17_FREEZE_REVIEW` for Human/CTO decision; do not enter
Sprint 18 automatically or pre-select death/respawn or other deferred
candidates.

## Authority

1. Actual source/runtime contracts and production wiring.
2. Accepted ADRs.
3. docs/project/PROJECT_STATE.md, Sprint reviews, and capability matrices.
4. docs/engineering/WORK_QUEUE.md and this projection.
5. A temporary Supervisor plan.
