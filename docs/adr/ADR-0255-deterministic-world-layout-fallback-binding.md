# ADR-0255: Deterministic World Layout and Fallback Binding Correctness

- Status: Accepted
- Date: 2026-08-19
- Work Order: WO-POST-S13-002
- Architecture Version: v1.140 → v1.141

## Context

The semantic-to-DSL path already owned initial positions, but non-platformer
worlds used array-index placement and spawned the player at `y=80`. The runtime
collision floor remains `groundY=400`, so the player could fall outside the
initial camera framing. Generated candidates could also omit or duplicate the
player, leaving the renderer without one canonical player binding.

## Decision

- `DefaultWorldLayoutGenerator` remains the single initial-layout authority.
- Player spawn is deterministic at `(80, 300)` world units; grounded terrain
  uses the existing Runtime floor at `y=400`.
- Entity placement is derived from stable entity identity/category and fixed
  genre anchors, not array index or random state. Repeated IDs are probed into
  distinct deterministic slots.
- Structured world candidates must contain exactly one player; invalid
  candidates use the existing deterministic fallback provider.
- `DefaultCameraController.reset()` is called only for a new world revision;
  dead-zone follow behavior is unchanged.
- Primitive fallback remains active until a replacement Sprite is usable; the
  Runtime entity ID and world position are never changed by asset resolution.

## Consequences

Farm, RPG, survival, sandbox, and platformer fallback worlds begin with a
readable player/ground relationship. Repeated semantic entities remain
inspectable across stable input ordering. This does not add procedural level
generation, camera redesign, persistence, or new physics geometry.

## Verification

- AI layout, extraction, count, candidate validation, and deterministic world
  tests pass.
- Camera reset and Pixi fallback/Sprite replacement tests pass.
- Browser verification remains required for provider-unavailable landing/jump,
  provider-available replacement, Farm, RPG, and World A → World B scenarios.
