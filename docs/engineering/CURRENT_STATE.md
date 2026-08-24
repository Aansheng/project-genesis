# Engineering Control Plane — Current State

This is a concise orchestration projection. PROJECT_STATE.md and actual source
code remain the product authority.

architecture_version: v1.155
current_sprint: Sprint 16 (OPEN — WO-S16-001 complete; freeze review pending)
current_work_order: WO-S16-001 — Targeted Gameplay Rule Reconciliation Across World Evolution
current_work_order_status: done
current_control_plane_work_order: SPRINT_FREEZE_REVIEW
current_control_plane_work_order_status: blocked_pending_human_cto_review
last_completed_work_order: WO-S16-001 — Targeted Gameplay Rule Reconciliation Across World Evolution
last_completed_product_work_order: WO-S16-001
last_completed_control_plane_work_order: SPRINT16_DISCOVERY
next_ready_work_order: none — SPRINT_FREEZE_REVIEW is blocked pending Human/CTO decision
product_architecture_changed: yes — v1.154 → v1.155; targeted reconciliation is wired and verified
sprint_status: Sprint 16 WO-S16-001 is DONE; Sprint 16 is READY FOR FREEZE REVIEW and stopped at the Human/CTO gate
product_verified: YES — WO-S16-001 manual Studio verification completed on 2026-08-24
continuation_mode: SPRINT_CONTINUOUS
control_plane_status: SPRINT_CONTINUOUS; sequential same-Sprint execution only;
  max_concurrent_subagents=2; repair_budget=3; Sprint boundary stop enabled;
  automatic cross-Sprint execution disabled

## Current Sprint goal

Sprint 16 — Gameplay-Preserving World Evolution: after an applied semantic
World Evolution delta, Genesis must preserve unaffected executable gameplay
rules and reconcile only affected rules against the current semantic truth,
GameplaySpecification, and capability catalog. The opening checkpoint is
targeted deterministic reconciliation in the same Runtime/session, with no
global stale disable, dangling exact references, AI regeneration by default,
or full Runtime/Renderer/world rebuild. Sprint 15's Gameplay Mechanics
Foundation remains frozen and is the verified baseline for this bridge.

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
- Sprint 16 freeze review is the single next control-plane item and is blocked
  pending Human/CTO acceptance. No next feature WO is generated or executed.

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
- Sprint-level generic gameplay thesis is verified: structured intent/rules,
  Runtime facts, generic matching, trusted actions, three interaction slices,
  continuity, isolation, and truthful projections are all present.

## Deferred capabilities

- Score or other numeric gameplay state.
- Death, respawn, game-over, enemy AI, victory UI, next level, restart, score,
  numeric state, XP, progression, timers, spawns, goal deletion, rich actions,
  unrelated rich multi-action transactions, generic gameplay state, and broad
  gameplay-rule evolution beyond the bounded reconciliation WO.
- Durable gameplay/context/evolution history, replay, persistence, and reload
  recovery.
- Reference-image transport, similarity search, durable generated assets,
  animation, and tilesets.

## Known environment issues

- Existing AI package lint warnings/debt are recorded in
  docs/project/TECH_DEBT.md and are unrelated to WO-S16-001.
- In this managed environment, the root `pnpm typecheck` Turbo wrapper cannot
  initialize its API client because TLS/keychain access is unavailable; direct
  TypeScript checks for all affected packages pass. A parallel Renderer Vitest
  run can also expose jsdom canvas noise; the standalone Renderer suite passes.
- When the local AI gateway at `127.0.0.1:8787` is unavailable, Studio World
  Creation uses its deterministic fallback but World Evolution currently fails
  before reconciliation because its structured candidate provider is gateway-
  dependent. WO-S16-001 was verified with a localhost-only structured candidate
  gateway; offline evolution fallback is an adjacent follow-up, not part of
  the accepted reconciliation bridge.
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
gameplay engine. Sprint 15 has no implementation blocker and is frozen. Sprint
16 direction is accepted and `WO-S16-001` is Code Complete and Product
Verified. The remaining gate is Human/CTO Sprint Freeze Review. The measured
implementation gap—semantic World Evolution marking the world-bound
`GameplayRuleSet` stale—has been closed by the bounded reconciliation bridge.
Victory UI, next level, restart, death/respawn/game-over, score/numeric state,
XP, progression, timers, spawning, goal deletion, persistence, and gameplay
rule evolution beyond this bounded bridge remain deferred.

## Authority

1. Actual source/runtime contracts and production wiring.
2. Accepted ADRs.
3. docs/project/PROJECT_STATE.md, Sprint reviews, and capability matrices.
4. docs/engineering/WORK_QUEUE.md and this projection.
5. A temporary Supervisor plan.
