# Engineering Control Plane — Current State

This is a concise orchestration projection. PROJECT_STATE.md and actual source
code remain the product authority.

architecture_version: v1.154
current_sprint: Sprint 15 (FROZEN)
current_work_order: SPRINT16_DISCOVERY — Gameplay-Preserving World Evolution
current_work_order_status: blocked
current_control_plane_work_order: SPRINT16_DISCOVERY
current_control_plane_work_order_status: blocked
last_completed_work_order: SPRINT_FREEZE_REVIEW
last_completed_product_work_order: WO-S15-007
last_completed_control_plane_work_order: SPRINT_FREEZE_REVIEW
next_ready_work_order: none — SPRINT16_DISCOVERY is the only horizon item and is BLOCKED pending Human/CTO Sprint 16 direction
product_architecture_changed: no — Freeze Review preserved v1.154
sprint_status: Sprint 15 Gameplay Mechanics Foundation is FROZEN; Code Complete and Product Verified are YES; no Sprint 16 work executed
product_verified: YES — Sprint 15 Freeze Review accepted the accumulated WO-S15-004 through WO-S15-007 evidence on 2026-08-24
control_plane_status: discovery-enabled; ONE_WORK_ITEM_WITH_DISCOVERY; SPRINT_CONTINUOUS disabled

## Current Sprint goal

Sprint 15 — Gameplay Mechanics Foundation: Genesis can generate and execute a
mechanically coherent platformer gameplay slice through generic structured
Gameplay Rules and trusted Runtime primitives. The measurable checkpoint is
movement/jump continuity, event-driven gameplay, collectible interaction,
enemy stomp, enemy damage/Health, a truthful success/goal path, and coherent
end-to-end behavior. Full progression, XP, skill choices, waves, and Survivor
systems are outside this Sprint.

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
  and `ONE_WORK_ITEM_WITH_DISCOVERY`.
- WO-S15-007 is complete and browser-verified: RuntimeGameplaySessionState is
  the current world/session completion authority; trusted `COMPLETE_GOAL`
  commits `active → completed`, repeated completion is a no-op, semantic
  evolution retains completion, and world/session replacement resets the new
  session to `active`.
- Sprint 15 Freeze Review is complete: all sixteen Sprint-level acceptance
  criteria pass against source wiring, automated regressions, accumulated
  Studio evidence, and Observatory truth. Sprint 15 is frozen at v1.154.

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
- Sprint-level generic gameplay thesis is verified: structured intent/rules,
  Runtime facts, generic matching, trusted actions, three interaction slices,
  continuity, isolation, and truthful projections are all present.

## Deferred capabilities

- Score or other numeric gameplay state.
- Death, respawn, game-over, enemy AI, victory UI, next level, restart, score,
  numeric state, XP, progression, timers, spawns, goal deletion, rich actions,
  unrelated rich multi-action transactions, generic gameplay state, and
  gameplay-rule evolution.
- Durable gameplay/context/evolution history, replay, persistence, and reload
  recovery.
- Reference-image transport, similarity search, durable generated assets,
  animation, and tilesets.

## Known environment issues

- Existing AI package lint warnings/debt are recorded in
  docs/project/TECH_DEBT.md and are unrelated to WO-S15-006.
- In this managed environment, the root `pnpm typecheck` Turbo wrapper cannot
  initialize its API client because TLS/keychain access is unavailable; direct
  TypeScript checks for all affected packages pass. A parallel Renderer Vitest
  run can also expose jsdom canvas noise; the standalone Renderer suite passes.
- Compatibility exports, test-only mock Observatory loading, inert streaming
  state, and legacy Canvas2D renderWorld() remain in the repository; current
  production Studio wiring does not use them.

## Known documentation mismatches

- AI_GENERATION_CAPABILITY_MATRIX.md has an older v1.123 header.
- VISUAL_CAPABILITY_MATRIX.md has an older v1.149 header.

For current work, use PROJECT_STATE.md, actual source wiring, accepted ADRs,
and the current gameplay matrix. Update those older matrix headers in their
own capability-focused work item rather than broadening WO-META-003.

## Current product gaps

The current product is a playable bounded slice, not a complete general
gameplay engine. Sprint 15 has no implementation blocker and is frozen. The
next horizon is the BLOCKED `SPRINT16_DISCOVERY` human/product-direction gate;
no product work is authorized automatically. The measured gap is that
semantic World Evolution currently marks the world-bound `GameplayRuleSet`
stale because gameplay-mechanics synchronization is not implemented. Victory
UI, next level, restart, death/respawn/game-over, score/numeric state, XP,
progression, timers, spawning, goal deletion, persistence, and gameplay-rule
evolution beyond this synchronization question remain deferred.

## Authority

1. Actual source/runtime contracts and production wiring.
2. Accepted ADRs.
3. docs/project/PROJECT_STATE.md, Sprint reviews, and capability matrices.
4. docs/engineering/WORK_QUEUE.md and this projection.
5. A temporary Supervisor plan.
