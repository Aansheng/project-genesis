# ADR-0220: Platformer Control Semantics Stabilization

**Status:** Accepted  
**Work Order:** WO-S11-006  
**Architecture Version:** v1.106 → v1.107

## Decision

- World coordinates remain `x → right` and `y → down`; screen coordinates use
  the same direction after the camera transform.
- The camera starts with a stable vertical baseline and keeps a 240px
  horizontal dead zone. It follows horizontally only after the player exits
  that zone and never follows small vertical jumps.
- `VelocityComponent` stores vertical velocity. `JumpSystem` applies an
  initial negative velocity on a Space press edge, `GravitySystem` adds
  acceleration, `VerticalMotionSystem` applies velocity to position, and
  `GroundCollisionSystem` clamps and resets velocity.
- Grounded state is derived from the player's velocity (`y === 0`); no new
  `GroundedComponent` is needed for this slice.
- `DefaultJumpSystem` tracks the previous Space snapshot locally to implement
  press-edge semantics without introducing an input action framework.

## Execution Order

`PlayerController → Jump → Gravity → VerticalMotion → GroundCollision`

Horizontal movement remains world-space movement. The renderer still applies
`container = viewportAnchor - camera`, but the dead zone prevents ordinary
movement from being masked by immediate camera motion.

## Constraints

No physics package, smoothing, zoom, parallax, slopes, moving platforms, air
double-jump, animation, AI, DSL, Observatory, or Studio redesign was added.
