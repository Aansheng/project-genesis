# ADR-0223: Game Viewport Product Polish Foundation

- Status: Accepted
- Date: 2026-08-17
- Work Order: WO-S11-009
- Architecture Version: v1.109 to v1.110

## Decision

`GameViewportPanel` owns one container-driven Pixi sizing lifecycle. After
mount, the container's measured content size is applied to
`pixiApp.renderer.resize(width, height)`; a native `ResizeObserver` repeats the
sync for Studio/browser resizing and is disconnected on unmount.

The existing platformer camera policy is preserved. Its renderer anchor is a
shared mutable point updated to the measured viewport center, removing the
previous fixed `(400,300)` assumption without changing world coordinates,
dead-zone behavior, physics, or camera smoothing.

The viewport chrome exposes only real state (`Empty`, `Ready`, `Running`) and
supported controls (`Arrow Keys` move, `Space` jump). Empty state copy is
Studio-local and does not create mock world content.

## Consequences

- The Pixi render surface matches the visible viewport instead of CSS-scaling a
  fixed 800×600 surface.
- Remounts still stop the runner, detach keyboard input, disconnect the resize
  observer, and destroy the single Pixi application.
- RuntimeWorldStore, entity selection, Inspector, Observatory, and gameplay
  semantics remain unchanged.
