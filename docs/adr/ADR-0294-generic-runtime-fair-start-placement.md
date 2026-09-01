# ADR-0294 — Generic Runtime Replacement Fair-Start Placement

- **Date:** 2026-09-01
- **Status:** Accepted after implementation and verification gates
- **Architecture:** v1.183 → v1.184
- **Work order:** `WO-S34-001 — Generic Runtime Replacement Fair-Start Policy`

## Context

Fresh Sprint 34 Survival play showed that the existing removal-triggered
replacement path could restore an Enemy at, or effectively immediately beside,
the current Player. The authoritative path was already generic:

`ENTITY_REMOVED → GameplayRuleExecutor → SPAWN_ENTITY → RuntimeEntityComposition
→ position selection → WorldMutator.addEntity → Runtime WorldStore → Renderer`

The missing capability was spatial fair-start placement. Temporal delay,
waves, timers, projectiles, and a second gameplay authority were not required
by the measured blocker and remain outside this decision.

The Runtime model has Position, entity identity, and optional collision-bounds
components, but it has no explicit world-bounds contract. Renderer viewport
dimensions therefore cannot be used as Runtime gameplay geometry. Existing
deterministic category placement remains the bounded fallback domain.

## Decision

Add one reusable Runtime composition helper,
`findRuntimeEntityPositionWithMinimumSeparation`, with these rules:

1. Accept one or more protected Runtime entity IDs and a positive minimum
   center distance. The default is `96`, twice the current Survival attack
   range of `48`.
2. Resolve protected entities and their current Runtime Positions at spawn
   time. Missing identity or invalid Position fails closed.
3. Try deterministic cardinal positions relative to the protected entities,
   with a stable ID-derived direction order, followed by the existing
   category-based candidates.
4. Bound the search to 100 category candidates, reject occupied Positions,
   require finite coordinates and the minimum center distance, and reject
   overlapping Runtime collision AABBs when both colliders are available.
5. Return `undefined` when no fair candidate exists. `SPAWN_ENTITY` then
   returns a failed action and does not silently place the entity on the
   Player.

Only a Survival Enemy replacement uses this policy. The action resolves the
current Runtime Player selected from the current world, passes that identity
as the Enemy target, and then preserves the existing Enemy composition,
target-directed pursuit, contact, defeat, progression, feedback, and
`WorldMutator.addEntity` path. Initial enemies, non-Survival entity creation,
Platformer behavior, attack range, damage, and temporal behavior are unchanged.

## Consequences

- A replacement has a deterministic spatial approach window before normal
  pursuit, while remaining in the current Runtime composition boundary.
- The policy is generic over protected Runtime IDs and can support more than
  one protected entity without introducing a spawn manager or spatial
  framework.
- A Runtime lacking a valid protected Position cannot produce a misleading
  spawn; the Gameplay Rule result is explicitly failed.
- Because Runtime currently has no global world-bounds component, this ADR does
  not invent one or read Pixi dimensions. A future bounds contract would need
  a separate decision.

## Verification

- Runtime targeted composition/execution/synchronizer tests: **33 passed**.
- Web targeted Survival/feedback/motion tests: **15 passed**.
- Runtime full suite: **711 passed**; Renderer full suite: **510 passed**;
  Web full suite: **3574 passed**.
- Runtime and Web TypeScript checks: **pass**.
- Runtime and Web ESLint: **zero errors**; existing Web warnings only.
- Web production build: **pass**.
- Real Studio: exact `生成一个幸存者游戏` generated active `world-1`; a
  replacement was observed at `(134,297)` while the current Player was
  `(80,297)` after the UI observation round trip, retaining non-overlap and a
  readable approach window. The replacement accepted subsequent Space hits
  and produced a second `enemy-runtime-*` replacement. Exact
  `创建 MarioWorld` retained seven entities, running Canvas, and
  `Space — 跳跃`; browser error logs were empty.
- Fresh Sprint 34 post-WO Gap Analysis: **PASS**. The selected fair-pacing
  blocker is resolved; no new immediate P0 blocker was found within the
  accepted slice. `SPRINT34_FREEZE_REVIEW` is selected; Sprint 35 is not
  entered.

