# ADR-0188: Pixi Entity Visualization Foundation

**Status:** Accepted  
**Date:** Sprint 9  
**Work Order:** WO-S9-004  
**Architecture Version:** v1.74 → v1.75

---

## Context

WO-S9-001 introduced PixiRenderer (lifecycle shell). WO-S9-002 introduced RuntimeRendererAdapter (Runtime → RenderWorld mapping). WO-S9-003 introduced RenderPosition (spatial data on RenderEntity).

However, the rendering pipeline stops at data — **no entity is drawn on the canvas**.

Current architecture:

```
Runtime World
  ↓
RuntimeRendererAdapter
  ↓
RenderWorld { entities: [RenderEntity] }
  ↓
RenderEntity { id, type, position? }
  ↓
(no rendering)
```

The PixiRenderer creates a canvas, and the adapter produces RenderWorld data, but nothing connects the two. Without entity visualization:

- The canvas is blank — no entities are visible
- No pattern exists for converting RenderWorld → PixiJS display objects
- No `render()` or `clear()` lifecycle exists for entity graphics
- Position data exists but is never translated to canvas coordinates

### Problem

1. **No visual output** — the renderer creates a canvas but draws nothing
2. **No rendering pattern** — no established way to create/update/remove Graphics for entities
3. **No cleanup pattern** — `clear()` for removing all rendered entities is missing
4. **No view types** — `RenderEntityView`/`RenderWorldView` do not exist

### Scope Boundaries

- Foundation only — no sprites, no textures, no assets, no animation
- No Runtime changes
- No Movement changes
- No Camera
- No Gameplay rendering
- No breaking changes

---

## Decision

### 1. Create `RenderEntityView` Type

```typescript
export interface RenderEntityView {
  readonly id: string
  readonly graphics: Graphics
}
```

Binds a `RenderEntity.id` to its PixiJS `Graphics` display object. The consumer can inspect which entity owns which graphics instance.

### 2. Create `RenderWorldView` Type

```typescript
export interface RenderWorldView {
  readonly entities: readonly RenderEntityView[]
}
```

A collection of all rendered entity views. Returned by `render()` for inspection and debugging.

### 3. Create `PixiEntityRenderer` Interface + Implementation

```typescript
export interface PixiEntityRenderer {
  render(world: RenderWorld): RenderWorldView
  clear(): void
}
```

**Constructor:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `container` | `Container` | PixiJS display container to add/remove children |
| `createGraphics?` | `() => Graphics` | Optional factory (testability injection) |

**`render(world)` behavior:**

```
For each entity in world.entities:
  If entity.position exists:
    1. Create Graphics via factory
    2. Draw filled 20×20 rectangle
       → beginFill(0x4fc3f7)
       → drawRect(0, 0, 20, 20)
       → endFill()
    3. Set graphics.x = position.x
    4. Set graphics.y = position.y
    5. Add child to container
    6. Record { id, graphics }
  If no position:
    → Skip (nothing drawn)
Return RenderWorldView { entities: [...] }
```

**`clear()` behavior:**

```
For each tracked entity view:
  1. Remove from container
  2. Destroy graphics
Clear tracking array
```

**Safe to call on empty state:** `clear()` on an empty renderer is a no-op.

**Re-render:** Each `render()` call:
1. Calls `clear()` internally
2. Removes all old graphics from the container
3. Destroys old graphics
4. Creates new graphics from the fresh RenderWorld

This ensures no stale graphics remain between frames/ticks.

### 4. Testability Pattern

Following the same pattern established in WO-S9-001 (`createApp` for Application), `PixiEntityRenderer` accepts an optional `createGraphics` factory. Production defaults to `() => new Graphics()`. Tests inject `createMockGraphics()` which does not require a real canvas context.

### 5. Graphics Details

| Property | Value |
|----------|-------|
| Shape | Filled rectangle |
| Width | 20 px |
| Height | 20 px |
| Fill color | `0x4fc3f7` (light blue) |
| Origin | Rectangle drawn from (0, 0) relative to Graphics |
| Position | `graphics.x` = entity position.x, `graphics.y` = entity position.y |
| Drawing origin (local) | 0, 0 (top-left of rectangle) |

### 6. Location

| File | Action |
|------|--------|
| `packages/renderer/src/view/RenderEntityView.ts` | New — interface |
| `packages/renderer/src/view/RenderWorldView.ts` | New — interface |
| `packages/renderer/src/view/PixiEntityRenderer.ts` | New — interface + implementation |
| `packages/renderer/src/view/index.ts` | New — barrel exports |
| `packages/renderer/src/view/__tests__/PixiEntityRenderer.test.ts` | New — 28 tests across 13 sections |
| `packages/renderer/src/index.ts` | Modified — added view exports |
| `docs/adr/ADR-0188-pixi-entity-visualization-foundation.md` | New — this document |

### 7. Unit Test Strategy

`PixiEntityRenderer.test.ts` — 28 tests across 13 sections:

| Section | Tests | Coverage |
|---------|-------|----------|
| Empty World | 2 | Empty view, no children added |
| Single Entity | 3 | Position mapped, 20×20 rect, fill color |
| Multiple Entities | 2 | All rendered, correct positions |
| Entity Without Position | 2 | Skipped, empty view result |
| Mixed Entities | 2 | Only positioned rendered, non-position absent |
| Negative Coordinates | 2 | Negative x/y, mixed negative/positive |
| Fractional Coordinates | 1 | Sub-pixel positions preserved |
| clear() | 4 | Removes children, destroys graphics, safe on empty, safe multiple |
| Multiple render() | 3 | Different worlds, replaces old, correct child count |
| Replace render() | 1 | Same entity re-rendered at new position |
| Immutability | 1 | Input world never mutated |
| Determinism | 2 | Same input → same output, different renderers |
| Memory Cleanup | 3 | Old graphics destroyed on re-render, no dangling refs, destroy called once |

---

## Consequences

### Positive

1. **First visual output** — entities with positions are now visible as rectangles on the canvas
2. **Clean rendering pattern** — `render()` → `clear()` lifecycle is established
3. **Safe re-render** — `render()` clears before drawing, preventing stale graphics
4. **No memory leaks** — graphics are destroyed on `clear()` and on every re-render
5. **Testable by design** — `createGraphics` factory lets tests run without WebGL
6. **No breaking changes** — all existing types and packages unchanged

### Negative

1. **Foundation only** — rectangles only, no sprites, no textures, no animation
2. **No entity type differentiation** — all entities look identical (same color, same size)
3. **No camera/viewport** — entities with negative coordinates are drawn off-screen
4. **No pixel conversion** — position is in game coordinates, not canvas pixel coordinates
5. **No Runtime synchronization** — renderer does not auto-update when Runtime changes

### Neutral

1. **Fixed entity size** — 20×20 is a placeholder; will be configurable when sprites exist
2. **Fixed color** — `0x4fc3f7` (light blue) is placeholder; future WOs will add type-based coloring
3. **Inject `createGraphics`** — tests inject mock factories; production always uses new Graphics()

---

## Verification

- TypeScript: 0 errors (`packages/renderer`)
- ESLint: 0 errors
- All entity visualization tests pass (28)
- All existing tests pass (84)
- Total renderer tests: 112
- No Runtime changes
- No Movement changes
- No Sprite changes
- No Texture changes
- No Asset loading
- No Animation
- No Camera
- No Gameplay rendering
- No breaking changes to any Public API

---

## Files Created/Modified

| File | Action |
|------|--------|
| `packages/renderer/src/view/RenderEntityView.ts` | New — interface |
| `packages/renderer/src/view/RenderWorldView.ts` | New — interface |
| `packages/renderer/src/view/PixiEntityRenderer.ts` | New — interface + implementation |
| `packages/renderer/src/view/index.ts` | New — barrel exports |
| `packages/renderer/src/view/__tests__/PixiEntityRenderer.test.ts` | New — 28 tests across 13 sections |
| `packages/renderer/src/index.ts` | Modified — added view exports |
| `docs/adr/ADR-0188-pixi-entity-visualization-foundation.md` | New — this document |
| `docs/project/PROJECT_STATE.md` | Updated — v1.75, WO-S9-004 |
| `docs/project/CHANGELOG.md` | Updated — v1.75, WO-S9-004 |