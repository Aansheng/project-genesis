# ADR-0186: Runtime → Renderer Synchronization Foundation

**Status:** Accepted  
**Date:** Sprint 9  
**Work Order:** WO-S9-002  
**Architecture Version:** v1.72 → v1.73

---

## Context

WO-S9-001 introduced the PixiRenderer — a concrete Renderer shell backed by PixiJS. However, there is **no bridge** between the Runtime World and the Renderer.

Current architecture:

```
Runtime World (Entity[], RuntimeComponent[])
    ↓
(no connection)
    ↓
PixiRenderer (initialize / destroy only)
```

The Runtime World can evolve through gameplay systems (MovementSystem, etc.). The Renderer exists as a lifecycle shell. Without a synchronization layer:

- The Renderer cannot read Runtime entity state
- No abstraction exists for transforming Runtime data into Renderer data
- No pattern exists for entity filtering (id/type only, no components, no position)
- The Runtime and Renderer layers have zero contract between them

### Problem

1. **No data bridge** — Runtime `World`/`Entity` types cannot reach the Renderer
2. **No transformation pattern** — Runtime entities contain position/components that the Renderer does not need (at the foundation level)
3. **No isolated render model** — the Renderer has its own lightweight entity type, but no mapping exists
4. **No contract** — `RuntimeRendererAdapter` interface does not exist, so any future synchronization must be ad-hoc

### Scope Boundaries

- Foundation only — no Pixi changes, no Position rendering, no Sprite creation, no Texture loading, no Animation
- No Runtime changes
- No Gameplay rendering
- No breaking changes

---

## Decision

### 1. Create `RenderEntity` Model Type

```typescript
export interface RenderEntity {
  readonly id: string
  readonly type: string
}
```

A lightweight, renderer-specific entity. Only carries what the rendering layer needs to know.

| Property | Source | Notes |
|----------|--------|-------|
| `id` | `Entity.id` | Preserved verbatim |
| `type` | `Entity.type` | Preserved verbatim |

**Explicitly excluded:**

- `x`, `y` — position will be added in a future work order
- `components` — not needed by the renderer foundation

### 2. Create `RenderWorld` Model Type

```typescript
export interface RenderWorld {
  readonly entities: readonly RenderEntity[]
}
```

A lightweight, renderer-specific world. Contains only the ordered list of `RenderEntity` instances.

### 3. Create `EMPTY_RENDER_WORLD` Constant

```typescript
export const EMPTY_RENDER_WORLD: RenderWorld = Object.freeze({
  entities: Object.freeze([]),
})
```

A frozen, reusable empty world constant. Used as the safe return value when the adapter receives null/undefined/malformed input.

### 4. Create `RuntimeRendererAdapter` Interface

```typescript
export interface RuntimeRendererAdapter {
  adapt(world: World): RenderWorld
}
```

A single-method contract. `adapt()` is:

- **Pure** — no side effects, no state, no I/O
- **Stateless** — the adapter can be used by multiple consumers simultaneously
- **Synchronous** — no Promise, no async I/O

### 5. Create `DefaultRuntimeRendererAdapter` Implementation

| Input Scenario | Behavior |
|----------------|----------|
| Valid world with entities | Maps each entity to a frozen RenderEntity |
| Empty entities array | Returns RenderWorld with empty entities |
| Null world | Returns EMPTY_RENDER_WORLD |
| Undefined world | Returns EMPTY_RENDER_WORLD |
| Null entities array | Returns EMPTY_RENDER_WORLD |
| Null entity in array | Skips the null entity (continues processing) |

**Data flow:**

```
Runtime World
  └── .entities[]
       └── Entity { id, type, x, y, components? }
            ↓
DefaultRuntimeRendererAdapter.adapt(world)
  ├── id   → RenderEntity.id   (preserved)
  ├── type → RenderEntity.type (preserved)
  ├── x    → IGNORED
  ├── y    → IGNORED
  └── components → IGNORED
            ↓
RenderWorld { entities: [RenderEntity, ...] }
  └── Frozen (Object.freeze)
```

### 6. Location

| File | Purpose |
|------|---------|
| `packages/renderer/src/model/RenderEntity.ts` | New — interface |
| `packages/renderer/src/model/RenderWorld.ts` | New — interface + EMPTY_RENDER_WORLD |
| `packages/renderer/src/model/index.ts` | New — barrel exports |
| `packages/renderer/src/adapter/RuntimeRendererAdapter.ts` | New — interface |
| `packages/renderer/src/adapter/DefaultRuntimeRendererAdapter.ts` | New — implementation |
| `packages/renderer/src/adapter/index.ts` | New — barrel exports |
| `packages/renderer/src/adapter/__tests__/RuntimeRendererAdapter.test.ts` | New — 34 tests across 10 sections |
| `packages/renderer/src/index.ts` | Modified — added model + adapter exports |
| `packages/renderer/package.json` | Modified — added `@genesis/shared` dependency |
| `packages/renderer/vitest.config.ts` | Modified — expanded test include pattern |
| `docs/adr/ADR-0186-runtime-renderer-sync-foundation.md` | New — this document |

### 7. Unit Test Strategy

`RuntimeRendererAdapter.test.ts` — 34 tests across 10 sections:

| Section | Tests | Coverage |
|---------|-------|----------|
| Construction | 2 | Instance creation, interface conformance |
| Empty World | 3 | Empty entities, frozen result, empty array |
| Single Entity | 5 | Id/type mapping, verbatim preservation, position ignored, components ignored, entity frozen |
| Multiple Entities | 3 | Order preservation, correct mapping, count preservation |
| Immutability | 4 | Frozen RenderWorld, frozen array, frozen entities, no input mutation |
| Determinism | 3 | Same input, different instances, same order |
| Large Worlds | 3 | 100 entities, 1000 entities, type distribution |
| Serialization | 2 | JSON id/type, no position/component fields |
| Frozen Outputs | 4 | EMPTY_RENDER_WORLD frozen, empty output frozen, populated output frozen, mutation throws |
| Edge Cases | 6 | Null world, undefined world, null entities, null entity in array, empty string id |

---

## Consequences

### Positive

1. **First data bridge** — establishes the `Runtime → Renderer` data contract
2. **Isolated render model** — `RenderEntity`/`RenderWorld` are independent from Runtime types
3. **Defensive adapter** — null/undefined/malformed inputs produce safe empty results
4. **Frozen outputs** — all outputs are deeply frozen, preventing mutation
5. **No breaking changes** — Runtime, Pixi, and existing renderer code are unchanged

### Negative

1. **Foundation only** — no position, no components, no sprites, no rendering
2. **No bidirectional sync** — renderer does not push data back to Runtime (not needed yet)
3. **Linear entity copy** — every `adapt()` call copies entities (optimizations for large worlds are future work)

### Neutral

1. **Single adapter pattern** — `RuntimeRendererAdapter` is the sole bridge; any future sync strategy changes this one interface
2. **Stateless design** — the adapter can be shared across multiple PixiRenderer instances if needed

---

## Verification

- TypeScript: 0 errors (`packages/renderer`, `packages/shared`)
- ESLint: 0 errors
- All RuntimeRendererAdapter tests pass (34)
- All existing Renderer tests pass (28)
- Total renderer tests: 62
- No Runtime changes
- No Pixi changes
- No Position rendering
- No Sprite creation
- No Texture loading
- No Animation
- No Gameplay rendering
- No breaking changes to any Public API

---

## Files Created/Modified

| File | Action |
|------|--------|
| `packages/renderer/src/model/RenderEntity.ts` | New — interface |
| `packages/renderer/src/model/RenderWorld.ts` | New — interface + EMPTY_RENDER_WORLD |
| `packages/renderer/src/model/index.ts` | New — barrel exports |
| `packages/renderer/src/adapter/RuntimeRendererAdapter.ts` | New — interface |
| `packages/renderer/src/adapter/DefaultRuntimeRendererAdapter.ts` | New — implementation |
| `packages/renderer/src/adapter/index.ts` | New — barrel exports |
| `packages/renderer/src/adapter/__tests__/RuntimeRendererAdapter.test.ts` | New — 34 tests across 10 sections |
| `packages/renderer/src/index.ts` | Modified — added model + adapter exports |
| `packages/renderer/package.json` | Modified — added @genesis/shared dependency |
| `packages/renderer/vitest.config.ts` | Modified — expanded test include pattern |
| `docs/adr/ADR-0186-runtime-renderer-sync-foundation.md` | New — this document |
| `docs/project/PROJECT_STATE.md` | Updated — v1.73, WO-S9-002 |
| `docs/project/CHANGELOG.md` | Updated — v1.73, WO-S9-002 |