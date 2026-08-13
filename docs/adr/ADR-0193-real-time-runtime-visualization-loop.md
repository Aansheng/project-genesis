# ADR-0193: Real-Time Runtime Visualization Loop Foundation

**Status:** Accepted  
**Date:** Sprint 9  
**Work Order:** WO-S9-006  
**Architecture Version:** v1.79 → v1.80

---

## Context

WO-S9-005 created `RuntimeVisualizationLoop` with `tick()` / `tickWithResult()` methods that execute the full pipeline: `executionLoop.tick()` → `adapter.adapt()` → `entityRenderer.render()`. However, **no continuous execution loop exists**.

Current behavior:
- `tick()` must be called manually
- No `requestAnimationFrame` integration
- No animation loop
- No scheduler abstraction

The visualization loop can advance the simulation and render entities, but nothing drives it continuously. Without a real-time loop:

- The world simulation cannot run on its own
- No continuous animation is possible
- No foundation exists for future gameplay features that depend on frame timing
- External consumers must implement their own RAF scheduling inline

### Problem

1. **No continuous execution** — `tick()` must be called manually; no loop drives it
2. **No animation loop** — no requestAnimationFrame integration exists
3. **No scheduler abstraction** — no interface for pluggable frame scheduling (RAF, setTimeout, worker, test mock)
4. **No runner abstraction** — no component that bridges scheduling and visualization
5. **Foundation missing** — gameplay features (movement, physics, input) will need continuous ticks

### Scope Boundaries

- Foundation only — no gameplay logic
- No input handling
- No collision detection
- No physics simulation
- No ECS scheduler changes
- No networking
- No asset pipeline
- No AI changes
- No Prompt changes
- No DSL changes

---

## Decision

### 1. Create `AnimationFrameScheduler` Interface

```typescript
export interface AnimationFrameScheduler {
  start(callback: () => void): void
  stop(): void
  isRunning(): boolean
}
```

A lightweight abstraction over `requestAnimationFrame` / `cancelAnimationFrame`. The callback receives no arguments — consumers who need frame timing should measure it themselves.

**Lifecycle:**

| Method | Behavior |
|--------|----------|
| `start(callback)` | Begins scheduling the callback on every animation frame; no-op if already running |
| `stop()` | Cancels pending frame and stops scheduling; no-op if not running |
| `isRunning()` | Returns whether the loop is currently active |

### 2. Create `DefaultAnimationFrameScheduler`

Concrete implementation backed by `requestAnimationFrame` and `cancelAnimationFrame`.

**Scheduling behavior:**
- `start(callback)` issues the first `requestAnimationFrame` immediately
- Each frame re-requests the next frame before invoking the callback, creating a continuous loop
- `stop()` cancels via `cancelAnimationFrame` and resets internal state
- Double-start is a no-op (callback unchanged)
- Double-stop is a no-op (safe to call when not running)
- Non-function callback throws on start

### 3. Create `VisualizationRunner` Interface

```typescript
export interface VisualizationRunner {
  start(): void
  stop(): void
  isRunning(): boolean
}
```

Drives continuous visualization by connecting a scheduler to a visualization loop.

### 4. Create `DefaultVisualizationRunner`

Orchestrates the continuous animation loop:

```
start()
  ↓
scheduler.start(frameCallback)
  ↓
requestAnimationFrame → frameCallback → visualizationLoop.tick() → loop
  ↓
stop()
  ↓
scheduler.stop() → cancelAnimationFrame
```

**Flow per frame:**

```
scheduler
  ↓
requestAnimationFrame
  ↓
visualizationLoop.tick()
  ↓
executionLoop.tick()
  ↓
adapter.adapt()
  ↓
entityRenderer.render()
  ↓
Canvas Update
```

**Edge cases:**
- Double start: no-op (delegated to scheduler)
- Double stop: no-op (delegated to scheduler)
- Auto-starts visualization loop if not already running
- Running state derived from scheduler.isRunning()

### 5. Location

| File | Action |
|------|--------|
| `packages/renderer/src/runtime/AnimationFrameScheduler.ts` | New — interface |
| `packages/renderer/src/runtime/DefaultAnimationFrameScheduler.ts` | New — implementation |
| `packages/renderer/src/runtime/VisualizationRunner.ts` | New — interface |
| `packages/renderer/src/runtime/DefaultVisualizationRunner.ts` | New — implementation |
| `packages/renderer/src/runtime/index.ts` | Modified — added scheduler and runner exports |
| `packages/renderer/src/runtime/__tests__/AnimationFrameScheduler.test.ts` | New — unit tests |
| `packages/renderer/src/runtime/__tests__/VisualizationRunner.test.ts` | New — unit tests |
| `packages/renderer/src/runtime/__tests__/VisualizationRunnerIntegration.test.ts` | New — integration tests |
| `packages/renderer/src/index.ts` | Modified — added scheduler and runner exports |
| `docs/adr/ADR-0193-real-time-runtime-visualization-loop.md` | New — this document |

### 6. Unit Test Strategy

**AnimationFrameScheduler.test.ts** — coverage:

| Section | Tests | Coverage |
|---------|-------|----------|
| Construction | 2 | Instance creation, initially not running |
| start | 5 | Running state, RAF called, callback invoked, invalid callback throws |
| stop | 4 | Running state, CAF called, prevents callbacks, initial state |
| double start | 3 | Running state, RAF not called again, callback unchanged |
| double stop | 2 | Running state, CAF not called |
| callback invocation | 4 | Invoked per frame, not after stop, no arguments |
| running state | 4 | True after start, false after stop, toggle cycles |
| cleanup | 2 | State reset after stop, start-stop cycle stability |

**VisualizationRunner.test.ts** — coverage:

| Section | Tests | Coverage |
|---------|-------|----------|
| Construction | 2 | Instance creation, initially not running |
| start | 4 | Running state, callback registration, auto-start visualization loop |
| stop | 2 | Running state, scheduler stop delegation |
| multiple starts | 2 | Idempotent, single callback |
| multiple stops | 2 | Idempotent, correct toggle |
| tick invocation | 2 | Callback invokes tick, multiple invocations |
| scheduler integration | 3 | Delegate start/stop, sync state |
| determinism | 2 | Same setup, tick behavior |
| cleanup | 3 | Start-stop cycles, scheduler cleanup, tick after stop |

### 7. Integration Test Strategy

**VisualizationRunnerIntegration.test.ts** — coverage:

| Section | Tests | Coverage |
|---------|-------|----------|
| start → ticks occur | 2 | World update on start, position changes |
| world updates | 2 | Entities move, two entities independently |
| render updates | 2 | Graphics reflect world, non-positioned not rendered |
| stop → ticks stop | 1 | World stops updating |
| restart cycle | 1 | Start-stop-start cycle continues updates |

Integration tests use mocked `requestAnimationFrame` (synchronous invocation) and the same mock container/entity renderer patterns as WO-S9-005 integration tests.

---

## Consequences

### Positive

1. **Continuous execution** — world simulation runs on every animation frame
2. **requestAnimationFrame integration** — browser-native frame scheduling
3. **Clean abstractions** — scheduler and runner are independently testable
4. **Pluggable scheduler** — can be replaced with setTimeout, worker, or test mock
5. **No breaking changes** — all existing types and packages unchanged
6. **Foundation for gameplay** — movement, physics, input all depend on continuous ticks
7. **Deterministic testing** — RAF mocked for synchronous, controlled test execution

### Negative

1. **Foundation only** — no delta-time tracking, no frame-skip, no interpolation
2. **Browser API dependency** — requestAnimationFrame requires browser or jsdom environment
3. **No frame timing** — callback receives no timestamp; consumers measure their own if needed

### Neutral

1. **Browser-only** — requestAnimationFrame is a browser API; server-side runtimes need a different scheduler
2. **Single loop** — one scheduler per runner; complex scenarios may need multiple runners
3. **Visualization loop must be started** — runner auto-starts visualization loop, but consumers can pre-configure it

---

## Verification

- TypeScript: 0 errors (`packages/renderer`)
- ESLint: 0 errors
- AnimationFrameScheduler unit tests pass
- VisualizationRunner unit tests pass
- VisualizationRunner integration tests pass
- All existing renderer tests pass
- No Physics changes
- No Collision changes
- No Input changes
- No ECS Scheduler changes
- No Networking changes
- No Asset Pipeline changes
- No AI changes
- No Prompt changes
- No DSL changes
- No breaking changes to any Public API

---

## Files Created/Modified

| File | Action |
|------|--------|
| `packages/renderer/src/runtime/AnimationFrameScheduler.ts` | New — interface |
| `packages/renderer/src/runtime/DefaultAnimationFrameScheduler.ts` | New — implementation |
| `packages/renderer/src/runtime/VisualizationRunner.ts` | New — interface |
| `packages/renderer/src/runtime/DefaultVisualizationRunner.ts` | New — implementation |
| `packages/renderer/src/runtime/index.ts` | Modified — added scheduler and runner exports |
| `packages/renderer/src/runtime/__tests__/AnimationFrameScheduler.test.ts` | New — unit tests |
| `packages/renderer/src/runtime/__tests__/VisualizationRunner.test.ts` | New — unit tests |
| `packages/renderer/src/runtime/__tests__/VisualizationRunnerIntegration.test.ts` | New — integration tests |
| `packages/renderer/src/index.ts` | Modified — added scheduler and runner exports |
| `docs/adr/ADR-0193-real-time-runtime-visualization-loop.md` | New — this document |
| `docs/project/PROJECT_STATE.md` | Updated — v1.80, WO-S9-006 |
| `docs/project/CHANGELOG.md` | Updated — v1.80, WO-S9-006 |