# ADR-0187: Position Render Model Foundation

**Status:** Accepted  
**Date:** Sprint 9  
**Work Order:** WO-S9-003  
**Architecture Version:** v1.73 → v1.74

---

## Context

WO-S9-001 introduced the PixiRenderer shell. WO-S9-002 introduced the RuntimeRendererAdapter — mapping Runtime `World` → `RenderWorld` with only `id` and `type` on entities. However, the rendering layer has **no spatial representation**.

Current architecture:

```
Runtime World
  └── Entity { id, type, x, y, components: [PositionComponent] }
       ↓
DefaultRuntimeRendererAdapter
  ├── id   → RenderEntity.id
  ├── type → RenderEntity.type
  ├── x    → IGNORED
  ├── y    → IGNORED
  └── components → IGNORED
       ↓
RenderEntity { id, type }  ← no position
```

The `Runtime Entity` carries position data (via `x`, `y` fields and optionally via `PositionComponent` in `components[]`), but the `RenderEntity` discards it entirely.

Without a position model:

- The rendering layer cannot represent where entities are in space
- There is no `RenderPosition` type to use in future sprite placement
- The adapter ignores PositionComponent — a future WO must add this support

### Problem

1. **No RenderPosition type** — the renderer model has no concept of spatial coordinates
2. **PositionComponent is ignored** — the adapter silently discards Runtime PositionComponent data
3. **No position extraction pattern** — there is no established way to read component data in the adapter
4. **Renderer cannot place sprites** — even if sprites were added, there is no position data to place them

### Scope Boundaries

- Foundation only — no Pixi rendering, no sprites, no textures, no animation
- No Runtime changes
- No Movement changes
- No breaking changes

---

## Decision

### 1. Create `RenderPosition` Type

```typescript
export interface RenderPosition {
  readonly x: number
  readonly y: number
}
```

A simple 2D coordinate bag. All fields are readonly. Instances are frozen.

### 2. Create `EMPTY_RENDER_POSITION` Constant

```typescript
export const EMPTY_RENDER_POSITION: RenderPosition = Object.freeze({
  x: 0,
  y: 0,
})
```

A frozen, reusable zero-position constant. Available for consumers that need a safe default.

### 3. Update `RenderEntity` Interface

```typescript
export interface RenderEntity {
  readonly id: string
  readonly type: string
  readonly position?: RenderPosition  // NEW — optional
}
```

The `position` field is **optional** — entities without a PositionComponent simply lack the field. This is backward compatible: all existing code that creates `RenderEntity` without `position` continues to work unchanged.

### 4. Update `DefaultRuntimeRendererAdapter` Extraction

**New mapping rule:**

| Runtime Source | Render Target | Condition |
|---------------|---------------|-----------|
| `PositionComponent.properties.x` | `RenderPosition.x` | If PositionComponent exists |
| `PositionComponent.properties.y` | `RenderPosition.y` | If PositionComponent exists |

**Extraction logic (`extractPosition`):**

```
For each entity:
  If no components → undefined
  For each component:
    If isPositionComponent(component):
      → RenderPosition { x: component.properties.x, y: component.properties.y } (frozen)
  If not found → undefined
```

**Entity construction:**

```
If position exists:
  → RenderEntity { id, type, position }  (frozen with position key)
If position undefined:
  → RenderEntity { id, type }            (frozen without position key)
```

**Behavior matrix:**

| Input Scenario | `position` in output |
|----------------|---------------------|
| Entity with PositionComponent | `{ x, y }` (frozen) |
| Entity without components | `undefined` (key absent) |
| Entity with empty components | `undefined` (key absent) |
| Entity with non-position components only | `undefined` (key absent) |
| Entity with multiple components (including position) | `{ x, y }` (frozen) |

### 5. Location

| File | Action |
|------|--------|
| `packages/renderer/src/model/RenderPosition.ts` | New — interface + EMPTY_RENDER_POSITION |
| `packages/renderer/src/model/RenderEntity.ts` | Modified — added `position?` field |
| `packages/renderer/src/model/index.ts` | Modified — added RenderPosition exports |
| `packages/renderer/src/adapter/DefaultRuntimeRendererAdapter.ts` | Modified — added `extractPosition()` + position mapping |
| `packages/renderer/src/adapter/__tests__/RuntimeRendererAdapterPosition.test.ts` | New — 22 tests across 10 sections |
| `docs/adr/ADR-0187-position-render-model-foundation.md` | New — this document |

### 6. Unit Test Strategy

`RuntimeRendererAdapterPosition.test.ts` — 22 tests across 10 sections:

| Section | Tests | Coverage |
|---------|-------|----------|
| Single Entity | 2 | Position mapped correctly, id/type preserved |
| Multiple Entities | 2 | All positions mapped, order preserved |
| Entity Without Position | 3 | No components, empty components, non-position components |
| Mixed Entities | 2 | Mix of positioned/non-positioned, non-position pass-through |
| Negative Coordinates | 2 | Negative values, mixed negative/positive |
| Fractional Coordinates | 2 | Fractional values, negative fractional |
| Large Coordinates | 2 | Large values, MAX_SAFE_INTEGER |
| Immutability | 3 | Position frozen, absent key, no input mutation |
| Determinism | 2 | Same input, different instances |
| Frozen Outputs | 2 | Position frozen, mutation throws |

---

## Consequences

### Positive

1. **First spatial data** — `RenderPosition` enables future sprite placement
2. **Backward compatible** — `position` is optional; existing entities without position work unchanged
3. **Component extraction pattern** — `extractPosition()` establishes the pattern for future component extraction (HealthComponent, AIComponent, etc.)
4. **No breaking changes** — all existing types, adapters, and tests continue to work
5. **Selective mapping** — only entities with PositionComponent get position data; others remain lean

### Negative

1. **Foundation only** — position data exists in the model but is not rendered on screen
2. **No pixel conversion** — `RenderPosition.x/y` are in game coordinates, not pixel coordinates (future WO)
3. **No velocity** — position is static; movement is handled by Runtime MovementSystem, not reflected here (read-only projection)

### Neutral

1. **Position extraction pattern** — `isPositionComponent()` type guard is used for type-safe narrowing
2. **No sprite changes** — position is now modeled but not drawn (future WO-S9-004+)

---

## Verification

- TypeScript: 0 errors (`packages/renderer`)
- ESLint: 0 errors
- All position tests pass (22)
- All existing adapter tests pass (34)
- All existing core tests pass (28)
- Total renderer tests: 84
- No Runtime changes
- No Movement changes
- No Pixi changes
- No Sprite creation
- No Texture loading
- No Animation
- No Gameplay rendering
- No breaking changes to any Public API

---

## Files Created/Modified

| File | Action |
|------|--------|
| `packages/renderer/src/model/RenderPosition.ts` | New — interface + EMPTY_RENDER_POSITION |
| `packages/renderer/src/model/RenderEntity.ts` | Modified — added `position?` field |
| `packages/renderer/src/model/index.ts` | Modified — added RenderPosition exports |
| `packages/renderer/src/adapter/DefaultRuntimeRendererAdapter.ts` | Modified — position extraction logic |
| `packages/renderer/src/adapter/__tests__/RuntimeRendererAdapterPosition.test.ts` | New — 22 tests across 10 sections |
| `docs/adr/ADR-0187-position-render-model-foundation.md` | New — this document |
| `docs/project/PROJECT_STATE.md` | Updated — v1.74, WO-S9-003 |
| `docs/project/CHANGELOG.md` | Updated — v1.74, WO-S9-003 |