# ADR-0274 — Runtime Gameplay Failure and Same-World Respawn

- Status: Accepted for Sprint 17 WO-S17-004
- Date: 2026-08-25
- Architecture: v1.159 → v1.160

## Context

WO-S17-003 proved the natural-language platformer success lifecycle, but fresh
Sprint 17 measurement found that trusted `DAMAGE_ENTITY` could reduce the
player's Health to zero without changing `RuntimeGameplaySessionState`. The
session therefore remained `active`, and the Studio path had no way to make
the player playable again.

## Decision

Extend the existing Runtime session contract with a `failed` status and bounded
failure metadata. A trusted `DAMAGE_ENTITY` action changes an active session to
`failed` only when the Runtime player entity reaches Health `0`. Failed session
execution does not commit later gameplay rules until an explicit Runtime
respawn operation is requested.

The existing `DefaultRuntimeExecutionLoop` owns the respawn operation. It
restores the current player entity's Health to its existing maximum and resets
an existing velocity component to zero. It preserves the current World entity
set, numeric progression, semantic revision, and targeted World Evolution
continuity. The Studio button only requests this Runtime operation and projects
the returned authoritative result through the existing world sink and
Observatory observers.

## Consequences

- Runtime remains the only gameplay/session-state authority.
- Failure and recovery are observable as `failed → active` without a new
  workflow or generic state-machine framework.
- Collectibles already consumed, XP/Level, enemy state, and World Evolution
  are intentionally preserved across respawn.
- Because the position is intentionally preserved, a player respawning inside
  an existing enemy contact can receive the already-supported one-point damage
  on the next tick; Studio may therefore show `99/100` immediately after a
  successful recovery without changing the respawn authority.
- There is no lives, checkpoint, death animation, autonomous enemy, hazard,
  score, manager, provider augmentation, regeneration loop, or generated code.
- `RuntimeGameplaySessionState` and its Web Observatory projection now accept
  `failed` in addition to `active` and `completed`.

## Rejected alternatives

- Replacing the whole World would reset or obscure World Evolution and
  progression continuity.
- Adding a checkpoint/lives/death manager would exceed the measured blocker.
- Letting Web or Renderer write Health/session state would violate Runtime
  authority.
