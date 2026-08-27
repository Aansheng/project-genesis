# ADR-0284: Runtime-Authoritative Lifecycle Presentation

- Status: Accepted
- Date: 2026-08-27
- Architecture: v1.172 → v1.173

## Context

`RuntimeGameplaySessionState` already owns `active`, `failed`, and `completed`.
The Runtime execution loop stops systems while failed, and its explicit
same-world respawn is valid only after failure. The current completed state is
committed Runtime truth but does not independently suppress systems. Studio previously surfaced
failure as a footer control and did not present completion as a game state.

## Decision

The existing Runtime session observer writes a frozen projection into the
application-scoped `gameStore`. `GameViewportPanel` consumes that projection:

`Runtime gameplay event/action → RuntimeGameplaySessionState → observer →
gameStore projection → Game Over/Victory overlay`.

The Game Over overlay exposes only the existing `respawnGameplay` operation.
The Victory overlay exposes no action, because Runtime has no completion
follow-up action. New UI text uses the established i18n catalog.

## Consequences

Web does not infer failure from Health or completion from visuals/collision, and
it cannot author/reset lifecycle truth. No LifecycleManager, GameStateManager,
ScreenManager, menu framework, next-level/restart flow, lives/checkpoints, or
Runtime mechanics change is introduced. Overlay visibility preserves the active
world, session, visual assets, and World Evolution history.
