# Sprint 24 Backlog — Game Lifecycle Presentation

## WO-S24-001 — Runtime-Authoritative Lifecycle Overlay

Status: Code Complete = YES; Product Verified = YES

Architecture: v1.172 → v1.173

Measured bottleneck: `RuntimeGameplaySessionState` truthfully commits
`active | failed | completed`; failed has existing same-world Runtime respawn,
while completed intentionally keeps the current world explorable. Studio only
exposed an engineering footer Respawn control and had no player-facing
lifecycle presentation.

Allowed scope: existing Runtime observer → Pinia projection → Game Viewport
overlay; existing Runtime respawn only; localized static strings; focused Web
coverage and required documentation.

Forbidden scope: Runtime mechanics changes, UI-owned state machine,
Lifecycle/GameState/Screen managers, restart/next-level actions, lives,
checkpoints, menus, HUD redesign, persistence, asset regeneration, or World
Evolution changes.

Acceptance: Runtime `failed` dominates the viewport with Game Over and exactly
the existing Respawn action. Runtime `completed` dominates it with Victory and
no invented action. `active` removes the overlay. The Web projection does not
author state; only the Runtime observer writes it.

Automated evidence: `GenesisStudioShell.test.ts` verifies failed/completed
projection and allowed action visibility; Web typecheck passes; lint has no
errors (existing warnings only).

Known behavior: Runtime suppresses systems while `failed`; `completed` remains
explorable by product contract. The Victory copy truthfully states
`目标已完成。当前世界仍可继续探索`, so Player movement after completion is
expected. The overlay remains presentation-only and is not the gameplay
authority.

Product Verification: PASS for the lifecycle acceptance paths. PV A passed in
a real generated platformer: `world-1` reached `failed` through legitimate
enemy damage, showed Game Over with only `重生`, remained stable with the same
world and entities, and returned to `active` through Runtime respawn with the
same `world-1` and 11 entities. PV B reached the authoritative goal, showed
Victory with no fabricated restart/next-level action, truthfully stated that
the current world remains explorable, and allowed Player exploration in the
same world/session. Console diagnostics stayed clean. The earlier bounded
routing-regression preflight remains separate evidence: `再创建5个怪物`
preserved `world-1` and added five enemies, while `创建一个新的游戏`
intentionally created `world-2`.

## WO-S24-002 — Runtime Completion Execution Gate

Status: CANCELLED — Human/CTO clarification; no product code executed.

Cancellation reason: the existing Victory contract explicitly says
`目标已完成。当前世界仍可继续探索`. Therefore completed is a goal-achieved
presentation state, not an execution-blocking state. The measured
`completed → ArrowRight → Player x=641 → x=695` behavior is expected
exploration and is not a Runtime defect.

Do not modify `DefaultRuntimeExecutionLoop` to gate `completed`, and do not
make completed share failed-state execution-stop semantics.

## Next work

Fresh Sprint 24 Gap Analysis found no new lifecycle-presentation blocker.
Select `SPRINT24_FREEZE_REVIEW` after real generated-platformer evidence proves:
`active → failed → Game Over → Runtime respawn → active` and
`active → completed → Victory`.
