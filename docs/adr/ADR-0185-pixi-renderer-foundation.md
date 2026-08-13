# ADR-0185: Pixi Renderer Foundation

**Status:** Accepted  
**Date:** Sprint 9  
**Work Order:** WO-S9-001  
**Architecture Version:** v1.71 → v1.72

---

## Context

The Project Genesis runtime can evolve (Runtime System Foundation → Runtime Execution Loop → WorldMutator → Movement System + Position Component). However, there is **no visual representation** of the runtime world.

Current architecture:

```
PromptAssemblyDomainModel
↓
SemanticWorldGenerator
↓
GameWorldModel
↓
GameDsl
↓
RuntimeProjection
↓
Runtime World
↓
Execution Loop
```

The Runtime World can evolve through gameplay systems (WO-S8-012 Movement System), but no Renderer exists to display the world state. Every visual project needs a rendering layer, and without it:

- There is no way to see what the runtime world looks like
- No foundation exists for future sprite rendering, animation, or gameplay visualization
- No pattern exists for wrapping a rendering library (PixiJS) behind an abstract contract

### Problem

1. **No renderer abstraction** — the Renderer concept does not exist as an interface or package
2. **No PixiJS integration** — no foundation for canvas-based rendering at all
3. **No lifecycle pattern** — initialize/destroy lifecycle is untested and unestablished
4. **No pattern for renderer isolation** — runtime and rendering are completely decoupled, but no example exists

### Scope Boundaries

- Foundation only — no Runtime synchronization, no Position rendering, no sprites, no textures, no assets
- No Runtime changes
- No Projection changes
- No GameDsl changes
- No gameplay visualization
- No breaking changes

---

## Decision

### 1. Create New `packages/renderer/` Package

| File | Purpose |
|------|---------|
| `packages/renderer/package.json` | Package manifest — `@genesis/renderer`, depends on `pixi.js` |
| `packages/renderer/tsconfig.json` | TypeScript config — extends root |
| `packages/renderer/vitest.config.ts` | Test config — `jsdom` environment |
| `packages/renderer/src/index.ts` | Barrel exports |
| `packages/renderer/src/core/Renderer.ts` | Interface |
| `packages/renderer/src/core/RendererState.ts` | State type |
| `packages/renderer/src/core/RendererResult.ts` | Result type |
| `packages/renderer/src/core/PixiRenderer.ts` | Implementation |
| `packages/renderer/src/core/__tests__/Renderer.test.ts` | Tests — 28 cases |

### 2. Create `Renderer` Interface

```typescript
export interface Renderer {
  initialize(container: HTMLElement): Promise<void>
  destroy(): Promise<void>
}
```

A minimal contract. Two lifecycle methods:

| Method | Purpose |
|--------|---------|
| `initialize(container)` | Boot the renderer into a host DOM element |
| `destroy()` | Tear down the renderer and release resources |

Both methods return `Promise<void>` — the foundation expects future renderers may need async setup/teardown (asset loading, shader compilation, worker spawning).

### 3. Create `RendererState` Interface

```typescript
export interface RendererState {
  readonly initialized: boolean
  readonly width: number
  readonly height: number
}
```

A frozen, read-only snapshot. Properties:

| Property | Type | Description |
|----------|------|-------------|
| `initialized` | `boolean` | Whether `initialize()` completed successfully |
| `width` | `number` | Viewport width in pixels |
| `height` | `number` | Viewport height in pixels |

### 4. Create `RendererResult` Interface

```typescript
export interface RendererResult {
  readonly success: boolean
}
```

A simple boolean wrapper. Used as a foundation for future operation result types.

### 5. Create `PixiRenderer` Implementation

```typescript
export class PixiRenderer implements Renderer {
  constructor(options?: PixiRendererOptions)
  initialize(container: HTMLElement): Promise<void>
  destroy(): Promise<void>
  getState(): RendererState
}
```

| Property | Behavior |
|----------|----------|
| Constructor | Accepts optional `{ width?, height?, backgroundColor?, createApp? }` |
| `initialize(container)` | Creates PIXI.Application, appends canvas to container |
| `destroy()` | Calls `app.destroy(true, { children, texture })`, nulls reference |
| `getState()` | Returns frozen `RendererState` snapshot |

**`createApp` factory injection** — the constructor accepts an optional `createApp` factory function that defaults to `new Application(...)`. This enables testability without a real WebGL context. Production code never provides this — the default is always used.

**Default values:**

| Option | Default |
|--------|---------|
| `width` | `800` |
| `height` | `600` |
| `backgroundColor` | `0x1a1a2e` (dark navy) |

### 6. Lifecycle Rules

| Scenario | Behavior |
|----------|----------|
| Before initialize | `getState().initialized === false` |
| After initialize | `getState().initialized === true`, canvas attached |
| After destroy | `getState().initialized === false`, app destroyed |
| Double initialize | Throws `'already initialized'` |
| Double destroy | Throws `'not initialized'` |
| Destroy before init | Throws `'not initialized'` |

### 7. Unit Test Strategy

`Renderer.test.ts` — 28 tests across 10 sections:

| Section | Tests | Coverage |
|---------|-------|----------|
| Construction | 5 | Default options, custom dimensions, custom bgColor, getState before init, frozen state |
| Initialize | 4 | Canvas appended, state reflects init, canvas attachment, dynamic container |
| Destroy | 2 | State cleared, destroy after init |
| Multiple Initialize | 2 | Throws on double init, state unchanged |
| Multiple Destroy | 2 | Throws on double destroy, throws destroy before init |
| Destroy Before Init | 1 | Throws on destroy without init |
| State Transitions | 4 | Uninitialized → initialized → uninitialized, dimensions persist |
| Immutability | 3 | Frozen before init, after init, after destroy |
| Determinism | 2 | Same options → same state, different options → different dims |
| Error Handling | 3 | Fresh container, arbitrary element, multiple init attempts |

### 8. Data Flow

```
Consumer code
  ↓
new PixiRenderer(options)
  ↓
renderer.initialize(container)
  ├── new PIXI.Application({ width, height, ... })
  ├── container.appendChild(app.view)  ← canvas attached
  └── this._initialized = true
  ↓
renderer.getState()
  └── { initialized: true, width: 800, height: 600 }  ← frozen
  ↓
renderer.destroy()
  ├── app.destroy(true, { children, texture })
  └── this._initialized = false
```

---

## Consequences

### Positive

1. **First Renderer package** — establishes `packages/renderer/` as a new workspace package
2. **Abstract contract** — `Renderer` interface decouples rendering from any specific library
3. **PixiJS integration** — concrete implementation ready for future sprite/position/asset work
4. **Testable by design** — `createApp` factory injection lets tests run without WebGL
5. **No breaking changes** — all existing packages and types are unchanged
6. **Isolation** — zero coupling to Runtime, Projection, DSL, or any other package

### Negative

1. **Foundation only** — no Runtime synchronization, no sprites, no animation, no gameplay
2. **No rendering output** — the renderer creates a canvas but draws nothing on it yet
3. **No canvas removal on destroy** — the canvas element remains in the DOM after destroy (the PIXI app is destroyed, but the DOM node is not removed — a future work order)

### Neutral

1. **PixiJS is the only implementation** — future renderers (Canvas2D, WebGL raw, Three.js) can implement the same `Renderer` interface
2. **Dark background** — `0x1a1a2e` is a placeholder; will be configurable when game worlds are rendered
3. **`createApp` factory** — production never uses it; it exists solely so unit tests don't need WebGL

---

## Verification

- TypeScript: 0 errors (`packages/renderer`)
- ESLint: 0 errors
- All Renderer tests pass (28)
- No Runtime changes
- No Projection changes
- No GameDsl changes
- No Position rendering
- No Runtime synchronization
- No sprites, textures, or assets
- No animation
- No gameplay visualization
- No breaking changes to any Public API

---

## Files Created/Modified

| File | Action |
|------|--------|
| `packages/renderer/package.json` | New — package manifest |
| `packages/renderer/tsconfig.json` | New — TypeScript config |
| `packages/renderer/vitest.config.ts` | New — Vitest config |
| `packages/renderer/src/index.ts` | New — barrel exports |
| `packages/renderer/src/core/Renderer.ts` | New — interface |
| `packages/renderer/src/core/RendererState.ts` | New — state type |
| `packages/renderer/src/core/RendererResult.ts` | New — result type |
| `packages/renderer/src/core/PixiRenderer.ts` | New — implementation |
| `packages/renderer/src/core/index.ts` | New — core barrel exports |
| `packages/renderer/src/core/__tests__/Renderer.test.ts` | New — 28 tests across 10 sections |
| `docs/adr/ADR-0185-pixi-renderer-foundation.md` | New — this document |
| `docs/project/PROJECT_STATE.md` | Updated — v1.72, WO-S9-001 |
| `docs/project/CHANGELOG.md` | Updated — v1.72, WO-S9-001 |