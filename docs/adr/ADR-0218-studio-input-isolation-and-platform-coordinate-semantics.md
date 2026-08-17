# ADR-0218: Studio Input Isolation and Platform Coordinate Semantics

- Status: Accepted
- Date: 2026-08-17
- Work Order: WO-S11-004
- Architecture Version: v1.104 to v1.105

## Decision

`KeyboardInputProvider` remains the single DOM-backed gameplay input boundary
and listens to one `window` target per mounted Studio viewport. It ignores
events originating from `input`, `textarea`, `select`, `button`, or
`contenteditable` surfaces. Enter therefore remains available to the command
form, while Space and Arrow keys typed in Studio controls never reach gameplay.
Editable focus clears the tracked set so a key held before focus cannot remain
stuck. Attach/detach also manages the focus listener and remains idempotent.

Gameplay world coordinates use Pixi's conventional orientation:

```text
x increases right; y increases down
Jump: y -= jumpHeight
Gravity: y += gravity
Ground: clamp y to groundY
Renderer: use world coordinates directly
Camera: viewport transform only; it does not redefine world coordinates
```

The existing MarioWorld values remain authoritative: player `(80,300)`,
terrain `(160,400)`, platform `(300,320)`, enemy `(380,360)`, goal `(650,300)`,
checkpoint `(500,320)`, `groundY = 400`, `jumpHeight = 50`, and `gravity = 1`.
The camera still follows the player in world space, but Studio renders it from
an explicit viewport anchor `(400,300)`, so the player is not pinned to the
top-left corner. The renderer default anchor remains `(0,0)` for compatibility.

## Consequences

- Text entry cannot move or jump the player.
- Blur restores normal gameplay input without remounting the runtime.
- World position and screen/container transform are testable separately.
- No new gameplay system, physics model, DSL, AI, or world-layout redesign is added.
