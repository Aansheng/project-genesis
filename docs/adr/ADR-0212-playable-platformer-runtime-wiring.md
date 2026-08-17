# ADR-0212: Playable Platformer Runtime Wiring

- Status: Accepted
- Date: 2026-08-17
- Work Order: WO-S10-010

## Context

The web application rendered generated worlds, but its runtime system registry
was empty. Keyboard input, player control, jumping, gravity, ground collision,
and camera follow existed as reusable systems but were not connected to the
real Web runtime.

## Decision

Wire the existing systems in `App.vue` in this deterministic order:

1. `PlayerControllerSystem`
2. `JumpSystem`
3. `GravitySystem`
4. `GroundCollisionSystem`

Attach one `KeyboardInputProvider` on mount and detach it on unmount. Pass a
`DefaultCameraController` to `DefaultPixiEntityRenderer`.

Extend `DefaultRuntimeVisualizationLoop` with an optional world sink. When
provided, each tick writes the system-produced world back to the active
`RuntimeWorldStore`, preserving movement and allowing injected worlds to remain
playable without restarting the loop.

## Consequences

- Generated MarioWorld responds to left/right and Space input.
- Gravity and ground collision continue on subsequent ticks.
- Runtime world replacement preserves active gameplay wiring.
- Existing visualization-loop callers remain source-compatible.

## Verification

Automated runtime wiring tests and manual browser verification cover world
creation, movement, jump, gravity, landing, camera wiring, and input cleanup.
