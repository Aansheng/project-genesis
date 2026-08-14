# ADR-0207: Runtime World Injection Foundation

**Status:** Accepted  
**Date:** Sprint 10  
**Work Order:** WO-S10-003  
**Architecture Version:** v1.93 → v1.94

---

## Context

The Create World Pipeline (WO-S10-002) can produce a Runtime World, but there is no mechanism to inject that world into the running game runtime. The visualization loop stores its own copy of the world internally, making it impossible to replace the world without restarting.

### Problem

1. **No world injection mechanism** — the AI pipeline produces a `World`, but there is no store to hold it
2. **Visualization loop owns its own copy** — `DefaultRuntimeVisualizationLoop` stores `_currentWorld` internally and has no way to receive external world updates
3. **No provider abstraction** — the visualization loop reads a fixed initial world instead of a dynamic source
4. **No executor bridge** — there is no component that connects the `CreateWorldPipeline` output to the runtime store

### Scope Boundaries

Foundation only.
- No AI provider
- No LLM
- No Physics changes
- No Renderer changes
- No Asset system
- No Networking
- No Save system

---

## Decision

### Architecture

```
User Input ("创建 MarioWorld")
    ↓
CreateWorldRuntimeExecutor.execute()
    ↓
CreateWorldPipeline.execute()
    ↓
World
    ↓
RuntimeWorldStore.setWorld()
    ↓
(store updated)
    ↓
VisualizationWorldProvider.getWorld()  ← reads store on each tick
    ↓
RuntimeVisualizationLoop.tick()         ← uses provider world
    ↓
Pixi Renderer
    ↓
Canvas
```

### Components

1. **`RuntimeWorldStore`** (`@genesis/runtime`) — mutable store for the active Runtime World
   - `getWorld(): World` — returns frozen World
   - `setWorld(world: World): void` — replaces stored world (frozen before storage)
   - Initializes with empty world when no initial world given

2. **`DefaultRuntimeWorldStore`** — default implementation
   - Stores a single World reference
   - Always returns frozen worlds
   - Pure, deterministic, stateless (single-mutation store)

3. **`VisualizationWorldProvider`** (`@genesis/renderer`) — read-only world source for the visualization loop
   - `getWorld(): World` — returns frozen World

4. **`StoreBackedWorldProvider`** — wraps a `RuntimeWorldStore` as a `VisualizationWorldProvider`
   - Pure wrapper — no caching, no eventing
   - Changes to the store are immediately visible on the next `getWorld()` call

5. **`DefaultRuntimeVisualizationLoop` modification** — accepts optional 5th constructor parameter `worldProvider?: VisualizationWorldProvider`
   - When provided, `executePipeline()` refreshes `_currentWorld` from `worldProvider.getWorld()` before each tick
   - Backward compatible — existing 4-parameter constructor continues to work

6. **`CreateWorldRuntimeExecutor`** (`@genesis/ai`) — bridges AI pipeline to runtime store
   - `execute(input: string): CreateWorldPipelineResult`
   - On success: calls `worldStore.setWorld(result.world)`
   - On unknown route: does NOT inject world (store unchanged)
   - Uses local `WorldStore` interface to avoid importing `@genesis/runtime`

---

## Consequences

### Positive

1. **End-to-end injection** — the full pipeline from user input to canvas is now connected
2. **Backward compatible** — existing 4-parameter constructor for `DefaultRuntimeVisualizationLoop` unchanged
3. **Decoupled** — no direct dependency between `@genesis/ai` and `@genesis/runtime`
4. **Immediate visibility** — store changes are visible on the next visualization tick
5. **Frozen guarantees** — all stored worlds are frozen, preventing mutation

### Negative

1. **Local `WorldStore` interface** — duplicates `RuntimeWorldStore` signature in `@genesis/ai`
2. **No subscriptions** — the visualization loop polls the provider on each tick rather than receiving push notifications

### Neutral

1. No breaking changes to existing APIs
2. All existing tests continue to pass (RuntimeVisualizationLoop tests retain 4-parameter constructor)

---

## Files Created

| File | Purpose |
|------|---------|
| `packages/runtime/src/world/RuntimeWorldStore.ts` | Store interface |
| `packages/runtime/src/world/DefaultRuntimeWorldStore.ts` | Store implementation |
| `packages/runtime/src/world/index.ts` | Barrel exports |
| `packages/renderer/src/runtime/VisualizationWorldProvider.ts` | Provider interface |
| `packages/renderer/src/runtime/StoreBackedWorldProvider.ts` | Provider implementation |
| `packages/ai/src/game-intent/runtime/CreateWorldRuntimeExecutor.ts` | Executor interface |
| `packages/ai/src/game-intent/runtime/DefaultCreateWorldRuntimeExecutor.ts` | Executor implementation |
| `packages/ai/src/game-intent/runtime/index.ts` | Barrel exports |
| `packages/runtime/src/__tests__/RuntimeWorldStore.test.ts` | 24 tests |
| `packages/renderer/src/runtime/__tests__/StoreBackedWorldProvider.test.ts` | 13 tests |
| `packages/ai/src/__tests__/CreateWorldRuntimeExecutor.test.ts` | 16 tests |
| `packages/renderer/src/runtime/__tests__/WorldInjectionIntegration.test.ts` | 9 tests |

## Modified Files

| File | Change |
|------|--------|
| `packages/runtime/src/index.ts` | Added world store exports |
| `packages/renderer/src/runtime/DefaultRuntimeVisualizationLoop.ts` | Added optional 5th `worldProvider` parameter |
| `packages/renderer/src/runtime/index.ts` | Added provider exports |
| `packages/renderer/src/index.ts` | Re-exports provider via runtime barrel |
| `packages/ai/src/game-intent/index.ts` | Added executor exports |
| `packages/ai/src/index.ts` | Added CreateWorldRuntimeExecutor export |

---

## Verification Criteria

- [x] TypeScript 0 errors
- [x] ESLint 0 errors
- [x] All tests pass (runtime 18, renderer 22, AI 144 test files)
- [x] `RuntimeWorldStore` exists with getWorld/setWorld
- [x] `DefaultRuntimeWorldStore` initializes with empty world
- [x] `StoreBackedWorldProvider` wraps store and reflects updates
- [x] `DefaultRuntimeVisualizationLoop` accepts optional provider
- [x] `CreateWorldRuntimeExecutor` injects world on success
- [x] `CreateWorldRuntimeExecutor` does NOT inject on unknown route
- [x] Architecture Version updated to v1.94