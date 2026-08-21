# Engineering Control Plane — Current State

This is a concise orchestration projection. PROJECT_STATE.md and actual source
code remain the product authority.

architecture_version: v1.151
current_sprint: Sprint 15
current_work_order: WO-S15-004
current_work_order_status: completed
current_control_plane_work_order: WO-META-003
current_control_plane_work_order_status: completed
last_completed_work_order: WO-META-003
last_completed_product_work_order: WO-S15-004
next_ready_work_order: WO-S15-005
product_architecture_changed: false
sprint_status: S15 product slice complete through S15-004; next boundary staged
product_verified: yes, for WO-S15-004
control_plane_status: initialized; one-work-item continuation

## Completed

- Sprint 14 semantic world evolution is frozen and browser-verified.
- Sprint 15 capability-specific generation context is complete.
- Sprint 15 GameplaySpecification, bounded GameplayEvent observation, validated
  GameplayRuleSet, and the single supported REMOVE_ENTITY execution slice are
  complete and browser-verified.
- WO-META-003 repository-native engineering control plane is complete.

## Active capabilities

- Natural-language world creation through the current Studio command path.
- Semantic World → Game DSL → Runtime projection.
- Runtime movement, jump, gravity, vertical motion, basic ground collision, and
  targeted entity mutation.
- Bounded Runtime gameplay facts: jump, landing, contact-start, add, remove.
- Genesis-validated gameplay rules with only current supported rules executable.
- Single REMOVE_ENTITY rule execution after finalized Runtime events.
- Pixi Renderer synchronization and truthful Observatory projections.
- Targeted semantic, Runtime, visual, and asset evolution in the current
  session, with stale/revision guards.

## Deferred capabilities

- Score or other numeric gameplay state.
- Damage, health resolution, enemy AI, goals, win/lose, timers, spawns,
  progression, rich actions, multi-action transactions, and gameplay-rule
  evolution.
- Durable gameplay/context/evolution history, replay, persistence, and reload
  recovery.
- Reference-image transport, similarity search, durable generated assets,
  animation, and tilesets.

## Known environment issues

- Existing AI package lint debt is recorded in docs/project/TECH_DEBT.md and is
  unrelated to this documentation-only work item.
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
gameplay engine. The next product work must be selected from a measured
user-visible bottleneck and must keep Runtime facts, rule interpretation,
mutation, and result observation separate.

## Authority

1. Actual source/runtime contracts and production wiring.
2. Accepted ADRs.
3. docs/project/PROJECT_STATE.md, Sprint reviews, and capability matrices.
4. docs/engineering/WORK_QUEUE.md and this projection.
5. A temporary Supervisor plan.
