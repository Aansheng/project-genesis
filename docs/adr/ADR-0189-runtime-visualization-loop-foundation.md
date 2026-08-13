# ADR-0189: Runtime Visualization Loop Foundation

**Status:** Accepted  
**Date:** Sprint 9  
**Work Order:** WO-S9-005  
**Architecture Version:** v1.75 → v1.76

---

## Context

WO-S9-001 introduced PixiRenderer (lifecycle shell). WO-S9-002 introduced RuntimeRendererAdapter (Runtime → RenderWorld mapping). WO-S9-003 introduced RenderPosition (spatial data on RenderEntity). WO-S9-004 introduced PixiEntityRenderer (entity visualization as Graphics rectangles).

However, **no loop connects Runtime updates to visual rendering**.

Current architecture:

```
Runtime World            Render World
    ↓                         ↓
ExecutionLoop            PixiEntityRenderer
    ↓                         ↓
MovementSystem               Canvas
```

Both systems exist independently. The Runtime can advance the simulation, and the Renderer can draw entities, but nothing synchronises them. Without a visualization loop:

- The canvas is never updated after the Runtime changes
- No pattern exists for connecting `executionLoop.tick()` → `adapter.adapt()` → `entityRenderer.render()`
- No lifecycle (start/stop) for controlling when visualization occurs
- Multiple ticks with accumulating Runtime state are not possible from the renderer side

### Problem

1. **No synchronization** — Runtime and Renderer are independent; updating one does not update the other
2. **No orchestration point** — nowhere to compose `tick()` → `adapt()` → `render()` as a single unit
3. **No lifecycle control** — no `start()` / `stop()` mechanism for the visualization flow
4. **No tick metadata** — no way to query entity count or rendered count after a tick

### Scope Boundaries

- Foundation only — no animation interpolation, no camera, no sprites
- No Sprite, Texture, or Asset Pipeline changes
- No Animation
- No Camera
- No Input
- No Physics
- No Gameplay Systems
- No Planner changes
- No DSL changes
- No breaking changes

---

## Decision

### 1. Create `VisualizationTickResult` Type

```typescript
export interface VisualizationTickResult {
  readonly entityCount: number
  readonly renderedCount: number
}
```

Provides observability into how many entities exist in the world vs. how many were actually rendered (entities with a PositionComponent).

### 2. Create `RuntimeVisualizationLoop` Interface

```typescript
export interface RuntimeVisualizationLoop {
  start(): void
  stop(): void
  isRunning(): boolean
  tick(): void
  tickWithResult(): VisualizationTickResult
}
```

**Lifecycle:**

| Method | Behavior |
|--------|----------|
| `start()` | Sets `running = true`; tick() will now execute the pipeline |
| `stop()` | Sets `running = false`; tick() becomes a no-op |
| `isRunning()` | Returns current `running` state |
| `tick()` | Executes pipeline when running; no-op when stopped |
| `tickWithResult()` | Same as tick(), returns frozen `VisualizationTickResult` |

### 3. Create `DefaultRuntimeVisualizationLoop`

**Constructor:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `executionLoop` | `RuntimeExecutionLoop` | Advances the simulation |
| `rendererAdapter` | `RuntimeRendererAdapter` | Maps Runtime World → RenderWorld |
| `entityRenderer` | `PixiEntityRenderer` | Renders RenderWorld onto canvas |
| `initialWorld` | `World` | Starting state |

**Pipeline (per tick):**

```
World
  ↓ executionLoop.tick()
newWorld
  ↓ rendererAdapter.adapt()
RenderWorld
  ↓ entityRenderer.render()
Canvas (Graphics updated)
```

**State maintained:**
- `_currentWorld`: the most recently computed World, stored between ticks
- `_running`: whether tick() should execute the full pipeline

**Rules:**
- `start()` sets `running = true`
- `stop()` sets `running = false`
- `tick()` only executes when `running === true`
- The new World is stored as `_currentWorld` for the next tick
- Input World is never mutated
- All outputs are frozen

### 4. Location

| File | Action |
|------|--------|
| `packages/renderer/src/runtime/RuntimeVisualizationLoop.ts` | New — interface |
| `packages/renderer/src/runtime/VisualizationTickResult.ts` | New — interface |
| `packages/renderer/src/runtime/DefaultRuntimeVisualizationLoop.ts` | New — implementation |
| `packages/renderer/src/runtime/index.ts` | New — barrel exports |
| `packages/renderer/src/runtime/__tests__/RuntimeVisualizationLoop.test.ts` | New — 34 unit tests |
| `packages/renderer/src/runtime/__tests__/RuntimeVisualizationLoopIntegration.test.ts` | New — 9 integration tests |
| `packages/renderer/src/index.ts` | Modified — added runtime exports |
| `packages/renderer/package.json` | Modified — added @genesis/runtime dependency |
| `packages/renderer/vitest.config.ts` | Modified — added @genesis/runtime resolve alias |
| `docs/adr/ADR-0189-runtime-visualization-loop-foundation.md` | New — this document |

### 5. Dependencies

The `@genesis/runtime` package was added as a dependency to `packages/renderer/package.json` and as a resolve alias in `packages/renderer/vitest.config.ts`.

### 6. Unit Test Strategy

`RuntimeVisualizationLoop.test.ts` — 34 tests across 15 sections:

| Section | Tests | Coverage |
|---------|-------|----------|
| Construction | 3 | Instance creation, initially not running, non-empty initial world |
| start / stop lifecycle | 3 | Start sets running, stop clears, initial state |
| multiple start | 1 | Calling start multiple times keeps running true |
| multiple stop | 2 | Calling stop multiple times, start then multiple stops |
| tick while stopped | 4 | No invocation, no effect after stop, zero renderedCount, entityCount preserved |
| tick while running | 3 | Invokes execution loop, adapter, entity renderer |
| world progression | 2 | World changes after tick, across multiple ticks |
| renderer invocation | 2 | Renderer called with adapted world, receives RenderWorld |
| adapter invocation | 1 | Adapter called with execution loop output |
| execution loop invocation | 1 | Execution loop receives stored currentWorld |
| entity counts | 2 | tickWithResult returns entityCount and renderedCount |
| multiple ticks | 2 | Pipeline invoked per call, correct counts across ticks |
| immutability | 3 | Input not mutated, frozen result, internal state not exposed |
| determinism | 1 | Same setup produces same result |
| large worlds | 2 | Handles 1000 entities in tick and tickWithResult |
| memory stability | 2 | No leaks across 100 ticks, stop/restart cycle stable |

### 7. Integration Test Strategy

`RuntimeVisualizationLoopIntegration.test.ts` — 9 tests across 2 sections:

| Section | Tests | Coverage |
|---------|-------|----------|
| Position changes | 3 | Single tick movement, multiple ticks accumulation, two entities independently |
| Graphics positions after tick | 6 | Graphics reflect world, non-positioned not rendered, counts match, zero delta, stop/start cycle, re-render |

Integration tests use mock containers (same pattern as PixiEntityRenderer tests) and a custom `IntegrationRendererAdapter` that reads position from entity.x/y (bridging the gap between DefaultMovementSystem which mutates entity.x/y and the PixiEntityRenderer which renders based on position).

---

## Consequences

### Positive

1. **Runtime and Renderer synchronised** — each tick advances the simulation and renders the result
2. **Clean orchestration** — `executionLoop.tick()` → `adapter.adapt()` → `entityRenderer.render()` as a single unit
3. **Lifecycle control** — `start()` / `stop()` provides explicit control over visualization flow
4. **Observability** — `tickWithResult()` provides entity and rendered counts
5. **No breaking changes** — all existing types and packages unchanged
6. **Testable by design** — all dependencies injectable; mock containers and adapters used in tests

### Negative

1. **Foundation only** — no animation interpolation, no camera, no sprites
2. **No scheduling** — does not manage RAF or setInterval; external scheduler required
3. **No camera/viewport** — entities with negative coordinates are drawn off-screen
4. **Stateful loop** — maintains mutable `currentWorld` and `running` state between ticks

### Neutral

1. **No interpolation** — raw state snapshots only; future WOs will add smooth transitions
2. **External scheduling required** — RAF / setInterval must be provided by the consumer
3. **Single pipeline** — one execution loop, one adapter, one renderer per visualization loop instance

---

## Verification

- TypeScript: 0 errors (`packages/renderer`, `packages/runtime`, `packages/shared`)
- ESLint: 0 errors (4 warnings for `any` type in test helpers, acceptable)
- RuntimeVisualizationLoop unit tests pass: 34
- RuntimeVisualizationLoop integration tests pass: 9
- All existing renderer tests pass (112)
- Total renderer tests: 155
- No Sprite changes
- No Texture changes
- No Asset loading
- No Animation
- No Camera
- No Input
- No Physics
- No Gameplay Systems
- No Planner changes
- No DSL changes
- No breaking changes to any Public API

---

## Files Created/Modified

| File | Action |
|------|--------|
| `packages/renderer/src/runtime/RuntimeVisualizationLoop.ts` | New — interface |
| `packages/renderer/src/runtime/VisualizationTickResult.ts` | New — interface |
| `packages/renderer/src/runtime/DefaultRuntimeVisualizationLoop.ts` | New — implementation |
| `packages/renderer/src/runtime/index.ts` | New — barrel exports |
| `packages/renderer/src/runtime/__tests__/RuntimeVisualizationLoop.test.ts` | New — 34 unit tests |
| `packages/renderer/src/runtime/__tests__/RuntimeVisualizationLoopIntegration.test.ts` | New — 9 integration tests |
| `packages/renderer/src/index.ts` | Modified — added runtime exports |
| `packages/renderer/package.json` | Modified — added @genesis/runtime dependency |
| `packages/renderer/vitest.config.ts` | Modified — added @genesis/runtime resolve alias |
| `docs/adr/ADR-0189-runtime-visualization-loop-foundation.md` | New — this document |
| `docs/project/PROJECT_STATE.md` | Updated — v1.76, WO-S9-005 |
| `docs/project/CHANGELOG.md` | Updated — v1.76, WO-S9-005 |