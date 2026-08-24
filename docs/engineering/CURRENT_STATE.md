# Engineering Control Plane — Current State

This is a concise orchestration projection. PROJECT_STATE.md and actual source
code remain the product authority.

architecture_version: v1.152
current_sprint: Sprint 15
current_work_order: WO-META-004
current_work_order_status: completed
current_control_plane_work_order: WO-META-004
current_control_plane_work_order_status: completed
last_completed_work_order: WO-META-004
last_completed_product_work_order: WO-S15-005
next_ready_work_order: WO-S15-006 — READY, prepared only; do not execute in this turn
product_architecture_changed: false
sprint_status: S15 product slice complete through WO-S15-005; WO-META-004 hardening complete; Supervisor stopped at the continuation boundary
product_verified: N/A for WO-META-004; WO-S15-005 remains YES (MANUAL Studio verification)
control_plane_status: hardened; one-work-item continuation

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
- WO-META-003 repository-native engineering control plane is complete.
- WO-META-004 hardens subagent task granularity, lifecycle/wait semantics,
  cancellation and zero-evidence rules, Supervisor gate ownership, current
  rollout concurrency, Trial #1 records, and S15-006 preparation without
  changing product architecture.

## Active capabilities

- Natural-language world creation through the current Studio command path.
- Semantic World → Game DSL → Runtime projection.
- Runtime movement, jump, gravity, vertical motion, basic ground collision, and
  targeted entity mutation.
- Bounded Runtime gameplay facts: jump, landing, contact-start, add, remove.
- Genesis-validated gameplay rules with only current supported rules executable.
- Generic REMOVE_ENTITY and APPLY_VELOCITY rule execution after finalized
  Runtime events; the approved enemy-stomp rule is the bounded two-action slice.
- Typed Runtime-owned contact direction and deterministic rule-level staged
  all-or-nothing execution for the two trusted stomp actions.
- Pixi Renderer synchronization and truthful Observatory projections.
- Targeted semantic, Runtime, visual, and asset evolution in the current
  session, with stale/revision guards.

## Deferred capabilities

- Score or other numeric gameplay state.
- Damage, health resolution, enemy AI, goals, win/lose, timers, spawns,
  progression, rich actions, unrelated rich multi-action transactions, and
  gameplay-rule evolution.
- Durable gameplay/context/evolution history, replay, persistence, and reload
  recovery.
- Reference-image transport, similarity search, durable generated assets,
  animation, and tilesets.

## Known environment issues

- Existing AI package lint debt is recorded in docs/project/TECH_DEBT.md and is
  unrelated to WO-S15-005.
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
gameplay engine. WO-S15-005 has no remaining blocker; the next product work
is WO-S15-006 READY for the approved DAMAGE/HEALTH scenario, but it must not
execute until a new Supervisor turn fixes its shared contract. Runtime facts,
rule interpretation, mutation, and result observation must remain separate.

## Authority

1. Actual source/runtime contracts and production wiring.
2. Accepted ADRs.
3. docs/project/PROJECT_STATE.md, Sprint reviews, and capability matrices.
4. docs/engineering/WORK_QUEUE.md and this projection.
5. A temporary Supervisor plan.
