# Sprint 24 Backlog — Game Lifecycle Presentation

## WO-S24-001 — Runtime-Authoritative Lifecycle Overlay

Status: Code Complete = YES; Product Verified = PENDING

Architecture: v1.172 → v1.173

Measured bottleneck: `RuntimeGameplaySessionState` already truthfully commits
`active | failed | completed`; failed has existing same-world Runtime respawn,
and completed has no valid follow-up action. Studio only exposed an engineering
footer Respawn control and had no player-facing lifecycle presentation.

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

Known audit note: Runtime suppresses systems while `failed`; current
`completed` does not suppress systems independently. This WO does not alter
Runtime mechanics; the Victory overlay visibly ends the active-play
presentation. Any terminal-system policy is a separate future decision.

Product Verification: PENDING. A real local Studio run began world generation
but the configured provider did not return during this verification attempt;
the real failure → respawn and completion paths were not claimed.

## Next work

`SPRINT24_FREEZE_REVIEW` after real generated-platformer evidence proves:
`active → failed → Game Over → Runtime respawn → active` and
`active → completed → Victory`.
