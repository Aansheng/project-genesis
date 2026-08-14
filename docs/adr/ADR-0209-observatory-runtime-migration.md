# ADR-0209: Observatory Runtime Migration

**Status:** Accepted  
**Date:** Sprint 10  
**Work Order:** WO-S10-006  
**Architecture Version:** v1.95 → v1.96

---

## Context

The web application (`apps/web`) renders game worlds using the legacy Canvas2D `renderWorld()` function from Sprint 1. This function only handles `type === 'tree'` entities and has no integration with the Sprint 9 Pixi rendering stack.

### Problem

1. **Legacy Canvas2D renderer** — `renderWorld.ts` only renders `type === 'tree'` entities; all other entity types (player, enemy, npc, etc.) are silently skipped
2. **No Pixi integration** — the `DefaultRuntimeVisualizationLoop`, `DefaultRuntimeRendererAdapter`, `DefaultPixiEntityRenderer`, `DefaultAnimationFrameScheduler`, and `DefaultVisualizationRunner` built in Sprint 9 are not connected to the web UI
3. **No StoreBackedWorldProvider integration** — the `RuntimeWorldStore` injects worlds, but the rendering loop does not read from it
4. **Manual draw() calls** — `App.vue` uses `watch()` + `draw()` instead of an automatic animation frame loop

### Scope Boundaries

- Migration only — no new gameplay features
- No changes to the `Runtime` package
- No changes to AI pipeline implementation
- Keep existing chat log and command input UI
- Keep observatory side panels

---

## Decision

Replace the legacy Canvas2D rendering path with the full Pixi runtime stack. `App.vue` creates all Pixi components directly and connects them to the existing `RuntimeWorldStore` via `StoreBackedWorldProvider`.

### Architecture

```
RuntimeWorldStore (from gameStore)
    ↓
StoreBackedWorldProvider
    ↓
DefaultRuntimeVisualizationLoop (reads from provider on each tick)
    ├── DefaultRuntimeExecutionLoop (empty registry — no gameplay systems)
    ├── DefaultRuntimeRendererAdapter (Runtime World → RenderWorld)
    └── DefaultPixiEntityRenderer (RenderWorld → Pixi Graphics)
    ↓
DefaultAnimationFrameScheduler (requestAnimationFrame)
    ↓
DefaultVisualizationRunner (drives continuous ticks)
    ↓
PIXI.Application (attached to <div ref="gameContainer">)
```

### App.vue Changes

| Before | After |
|--------|-------|
| `<canvas>` with manual `renderWorld()` | `<div ref="gameContainer">` — Pixi attaches canvas automatically |
| `import { renderWorld, CANVAS_WIDTH, CANVAS_HEIGHT }` | `import { Application, Container } from 'pixi.js'` |
| `onMounted → draw()` | `onMounted → create Pixi stack → runner.start()` |
| `watch(renderVersion) → draw()` | No manual `draw()` — loop runs on `requestAnimationFrame` |
| `draw() → renderWorld(ctx, store.runtime.world)` | `visLoop.tick()` → adapter → renderer → canvas |

### Dependencies Added

- `apps/web` now depends on `pixi.js@7.4.3` (required for `Application` and `Container`)

### Renderer Package Export

- `packages/renderer/src/index.ts`: Added `StoreBackedWorldProvider` and `VisualizationWorldProvider` exports

---

## Consequences

### Positive

1. **Full Pixi rendering pipeline** — entities are rendered via `DefaultPixiEntityRenderer` with visual catalog support
2. **Auto-rendering** — no manual `draw()` calls; the `VisualizationRunner` drives continuous frames via `requestAnimationFrame`
3. **World injection compatible** — `StoreBackedWorldProvider` bridges `RuntimeWorldStore` to the visualization loop; store changes are reflected on the next tick
4. **Legacy Canvas2D removed** — `renderWorld.ts` is no longer used for game rendering
5. **Chat log and command input preserved** — UI unchanged
6. **Observatory panels preserved** — `router-view` before the game container

### Negative

1. **PositionComponent gap** — entities projected by `DefaultRuntimeProjection` have `x`/`y` at the entity top level but no `PositionComponent`; `DefaultRuntimeRendererAdapter` only reads from `PositionComponent`, so entities will not have positions in the `RenderWorld`. This is a pre-existing issue documented in WO-S10-005.
2. **Pixi.js dependency** — `apps/web` now directly depends on `pixi.js`, increasing bundle size

### Neutral

1. `renderWorld.ts` remains in the renderer package for backward compatibility
2. `PixiRenderer` is not used directly — `PIXI.Application` is created in `App.vue` for stage access

---

## Files Created

| File | Purpose |
|------|---------|
| `apps/web/src/__tests__/PixiRuntimeMigration.test.ts` | Integration tests (6 tests across 3 stages) |

## Files Modified

| File | Change |
|------|--------|
| `apps/web/src/App.vue` | Replaced Canvas2D rendering with full Pixi runtime stack |
| `apps/web/package.json` | Added `pixi.js@7.4.3` dependency |
| `packages/renderer/src/index.ts` | Added `StoreBackedWorldProvider` and `VisualizationWorldProvider` exports |
| `docs/project/PROJECT_STATE.md` | Updated to v1.96 |
| `docs/project/CHANGELOG.md` | Added WO-S10-006 entry |

---

## Verification Criteria

- [x] TypeScript 0 errors
- [x] All 3977 tests pass (30 suites)
- [x] 6 new integration tests pass (proving full pipeline)
- [x] CreateWorldRuntimeExecutor → RuntimeWorldStore → StoreBackedWorldProvider → VisualizationLoop → renderer
- [x] No manual `draw()` calls
- [x] Chat log and command input preserved
- [x] Observatory panels preserved
- [x] Architecture Version updated to v1.96