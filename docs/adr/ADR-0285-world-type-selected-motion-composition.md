# ADR-0285: WorldType-Selected Generic Motion Composition

- Status: Accepted
- Date: 2026-08-28
- Work order: WO-S26-002
- Architecture: v1.174 → v1.175

## Context

Genesis already has a generic four-direction Player controller and a separate
platformer jump/gravity/ground-collision set. Studio registered the entire
platformer set for every semantic WorldType, so a correctly classified
`survival` world still received a platformer-only motion contract.

## Decision

Select a generic motion profile at the existing Web composition boundary using
the current semantic `WorldType` projection:

- `survival` uses `PlayerControllerSystem`, `VerticalMotionSystem`, and
  `EntityContactSystem`.
- `platformer` and unknown/other worlds retain the established
  `PlayerControllerSystem`, `JumpSystem`, `GravitySystem`,
  `VerticalMotionSystem`, `GroundCollisionSystem`, and contact set.
- The Studio control affordance hides `Space / Jump` only for `survival`.

The Runtime system contracts, Runtime execution loop, semantic model, and Pixi
Renderer remain unchanged. The registry is rebuilt when the active semantic
world changes, so initial empty Studio state does not become authority for the
generated world.

## Consequences

Survival can be verified as a top-down probe through reusable generic systems,
while existing platformer behavior remains intact. No Survivor-specific
Runtime, manager, gameplay loop, Renderer, or world authority is introduced.
Future WorldTypes retain the conservative platformer fallback until a measured
generic profile is explicitly accepted.
