# ADR-0197: Playable Game Bootstrap Foundation

**Status:** Accepted  
**Date:** Sprint 9  
**Work Order:** WO-S9-010  
**Architecture Version:** v1.83 → v1.84

---

## Context

All individual game components exist: `KeyboardInputProvider`, `PlayerControllerSystem`, `MovementSystem`, `ExecutionLoop`, `RuntimeVisualizationLoop`, `VisualizationRunner`, `PixiRenderer`, and `PixiEntityRenderer`. However, no unified bootstrap exists. Everything must be wired manually — creating the renderer, registering systems, connecting the visualization loop, and starting the runner. No playable game startup flow exists.

Current state:
- Each component is independently usable but requires manual orchestration
- No single API to start a complete game
- No standardized stop/cleanup lifecycle
- No test coverage for the startup flow

Without a bootstrap layer:
- Developers must understand and wire 8+ components to get a playable game
- No standardized teardown — renderer, loops, and runners may leak
- Testing the full pipeline requires custom wiring in every test

### Problem

1. **No unified entry point** — starting a game requires manual wiring of 8+ components
2. **No lifecycle management** — stop/cleanup is ad-hoc per component
3. **No configuration abstraction** — world and input provider are passed piecemeal
4. **No pipeline test coverage** — the full World→Renderer pipeline is untested end-to-end
5. **High barrier to entry** — new developers must understand the entire component graph before running anything

### Scope Boundaries

- No camera
- No physics
- No collision
- No asset pipeline
- No networking
- No save system
- No AI changes
- No prompt changes
- No DSL changes

---

## Decision

### 1. Create `GameBootstrap` Interface

```typescript
export interface GameBootstrap {
  start(container: HTMLElement): Promise<void>
  stop(): Promise<void>
  isRunning(): boolean
}
```

A single entry point with three lifecycle methods. `start()` begins everything; `stop()` tears down everything. `isRunning()` queries whether the game is active.

### 2. Create `GameBootstrapConfig` Interface

```typescript
export interface GameBootstrapConfig {
  readonly world: World
  readonly inputProvider: InputProvider
}
```

Encapsulates the two external dependencies needed to bootstrap a game: the initial world state and the source of input.

### 3. Create `DefaultGameBootstrap`

```typescript
class DefaultGameBootstrap implements GameBootstrap {
  constructor(config: GameBootstrapConfig, options?: GameBootstrapOptions)
  async start(container: HTMLElement): Promise<void>
  async stop(): Promise<void>
  isRunning(): boolean
}
```

**Options:**
```typescript
interface GameBootstrapOptions {
  readonly createRenderer?: (options?: PixiRendererOptions) => Renderer
}
```

**start() pipeline:**

```
DefaultGameBootstrap.start(container)
  │
  ├─ 1. Create Renderer (via factory or new PixiRenderer())
  ├─ 2. renderer.initialize(container) → append canvas to DOM
  │
  ├─ 3. Create DefaultRuntimeSystemRegistry
  ├─ 4. Register DefaultPlayerControllerSystem (with InputProvider)
  ├─ 5. Register DefaultMovementSystem (delta 0,0 — no-op by default)
  │
  ├─ 6. Create DefaultRuntimeExecutionLoop(registry)
  ├─ 7. Create DefaultRuntimeRendererAdapter()
  ├─ 8. Create stage Container + DefaultPixiEntityRenderer(stage)
  │
  ├─ 9. Create DefaultRuntimeVisualizationLoop(
  │      executionLoop, adapter, entityRenderer, world)
  │
  ├─ 10. Create DefaultAnimationFrameScheduler()
  ├─ 11. Create DefaultVisualizationRunner(scheduler, visLoop)
  │
  └─ 12. runner.start() → game is playable
```

**stop() pipeline:**

```
DefaultGameBootstrap.stop()
  │
  ├─ 1. runner.stop()
  ├─ 2. visualizationLoop.stop()
  ├─ 3. null internal references
  ├─ 4. renderer.destroy()
  └─ 5. _running = false
```

**Behavioral guarantees:**
- Double `start()` is a no-op (guards `_running`)
- Double `stop()` is a no-op (guards `!_running`)
- `start()` → `stop()` → `start()` cycle is supported (clean reset)
- Injectable `createRenderer` factory for testability (avoids PixiJS/WebGL dependency)

### 4. Location

The `GameBootstrap` and `GameBootstrapConfig` interfaces are in `packages/runtime/src/bootstrap/` (they use only runtime/shared types). The `DefaultGameBootstrap` implementation is in `packages/renderer/src/bootstrap/` (it needs both runtime and renderer types).

| File | Action |
|------|--------|
| `packages/runtime/src/bootstrap/GameBootstrap.ts` | New — interface |
| `packages/runtime/src/bootstrap/GameBootstrapConfig.ts` | New — config interface |
| `packages/runtime/src/bootstrap/index.ts` | New — barrel exports |
| `packages/renderer/src/bootstrap/DefaultGameBootstrap.ts` | New — implementation |
| `packages/renderer/src/bootstrap/index.ts` | New — barrel exports |
| `packages/runtime/src/index.ts` | Modified — added bootstrap exports |
| `packages/renderer/src/index.ts` | Modified — added bootstrap exports |
| `packages/renderer/src/bootstrap/__tests__/GameBootstrap.test.ts` | New — 17 tests |
| `packages/renderer/src/bootstrap/__tests__/PlayableGameBootstrap.test.ts` | New — 6 tests |
| `docs/adr/ADR-0197-playable-game-bootstrap-foundation.md` | New — this document |

### 5. Unit Test Strategy

**GameBootstrap.test.ts** — 17 tests across 9 sections:

| Section | Tests | Coverage |
|---------|-------|----------|
| Construction | 3 | Valid config, config+options, interface conformance |
| Start | 2 | Valid container, default renderer factory |
| Stop | 2 | Stop running game, stop before start |
| Multiple starts | 1 | Second start is no-op |
| Multiple stops | 1 | Second stop is no-op |
| Running state | 3 | Before start, after start, after stop |
| Renderer initialization | 1 | Container passed correctly |
| Cleanup | 2 | Renderer destroyed, full cycle |
| Determinism | 2 | Same config, start-stop cycle |

### 6. Integration Test Strategy

**PlayableGameBootstrap.test.ts** — 6 tests across 6 sections:

| Section | Tests | Coverage |
|---------|-------|----------|
| Full lifecycle | 1 | Start → play → stop |
| Player movement integration | 1 | Bootstrap creates controller with input provider |
| Keyboard integration | 1 | InputProvider wired to PlayerControllerSystem |
| Start-stop-restart cycle | 1 | Restart after stop |
| Multiple containers | 1 | Different containers across cycles |
| Empty world | 1 | Bootstrap handles empty world gracefully |

---

## Consequences

### Positive

1. **Single API** — one `start(container)` call for a fully playable game
2. **Standardized teardown** — `stop()` cleans up renderer, runner, and loops
3. **Testable** — injectable `createRenderer` factory avoids WebGL dependency in tests
4. **Idempotent** — double-start and double-stop are safe no-ops
5. **Restartable** — full start-stop-start cycle is supported
6. **23 new tests** — comprehensive lifecycle, wiring, and integration coverage
7. **No breaking changes** — all existing public APIs unchanged

### Negative

1. **Fixed system order** — PlayerControllerSystem then MovementSystem (not configurable)
2. **Fixed MovementSystem delta** — hardcoded to (0,0); custom deltas require using the system directly
3. **Renderer dependency** — the bootstrap lives in the renderer package (needs DOM access)

### Neutral

1. **Foundation only** — no physics, collision, camera, or gameplay logic
2. **Single renderer** — always creates a PixiRenderer; other renderers need custom factory
3. **No configuration beyond world + input** — future WOs may add movement speed, system list, etc.

---

## Verification

- TypeScript: 0 errors (`packages/runtime`, `packages/renderer`)
- ESLint: 0 errors (0 new warnings)
- GameBootstrap unit tests pass: 17
- PlayableGameBootstrap integration tests pass: 6
- Total renderer tests: 310
- Total runtime tests: 519
- No Camera
- No Physics
- No Collision
- No Asset Pipeline
- No Networking
- No Save System
- No AI changes
- No Prompt changes
- No DSL changes
- No breaking changes to any Public API

---

## Files Created/Modified

| File | Action |
|------|--------|
| `packages/runtime/src/bootstrap/GameBootstrap.ts` | New — interface |
| `packages/runtime/src/bootstrap/GameBootstrapConfig.ts` | New — config type |
| `packages/runtime/src/bootstrap/index.ts` | New — barrel exports |
| `packages/renderer/src/bootstrap/DefaultGameBootstrap.ts` | New — implementation |
| `packages/renderer/src/bootstrap/index.ts` | New — barrel exports |
| `packages/runtime/src/index.ts` | Modified — added bootstrap exports |
| `packages/renderer/src/index.ts` | Modified — added bootstrap exports |
| `packages/renderer/src/bootstrap/__tests__/GameBootstrap.test.ts` | New — 17 tests |
| `packages/renderer/src/bootstrap/__tests__/PlayableGameBootstrap.test.ts` | New — 6 tests |
| `docs/adr/ADR-0197-playable-game-bootstrap-foundation.md` | New — this document |
| `docs/project/PROJECT_STATE.md` | Updated — v1.84, WO-S9-010 |
| `docs/project/CHANGELOG.md` | Updated — v1.84, WO-S9-010 |