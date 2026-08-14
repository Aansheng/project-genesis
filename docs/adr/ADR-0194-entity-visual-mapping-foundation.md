# ADR-0194: Entity Visual Mapping Foundation

**Status:** Accepted  
**Date:** Sprint 9  
**Work Order:** WO-S9-007  
**Architecture Version:** v1.80 → v1.81

---

## Context

WO-S9-004 created `DefaultPixiEntityRenderer` which renders every positioned entity as a hardcoded 20×20 rectangle. All entities look identical — player, enemy, merchant, and boss are visually indistinguishable.

Current behavior:
- Every entity → 20×20 rectangle
- No visual distinction by entity type
- No shape differentiation (all rectangles)
- No size differentiation (all 20×20)

Without visual mapping:
- Player looks identical to enemy
- Enemy looks identical to merchant
- No foundation for future per-type visual customization
- No catalog abstraction for visual definitions

### Problem

1. **No visual distinction** — all entity types render identically
2. **No size variation** — every entity is 20×20 regardless of type
3. **No shape variation** — all entities are rectangles
4. **No catalog abstraction** — no pluggable source of visual definitions
5. **Hardcoded rendering** — entity type is ignored in the render loop

### Scope Boundaries

- Graphics only — no sprites, textures, or asset pipeline
- No input handling
- No physics
- No collision
- No camera
- No runtime changes
- No DSL changes
- No AI changes
- No breaking changes

---

## Decision

### 1. Create `EntityVisualDefinition` Interface

```typescript
export interface EntityVisualDefinition {
  readonly width: number
  readonly height: number
  readonly shape: 'rectangle' | 'circle'
}
```

A lightweight, immutable contract describing how an entity type should be rendered. `shape` determines which `Graphics` method to use:
- `'rectangle'`: `Graphics.drawRect(0, 0, width, height)`
- `'circle'`: `Graphics.drawCircle(0, 0, radius)` where `radius = Math.min(width, height) / 2`

### 2. Create `EntityVisualCatalog` Interface

```typescript
export interface EntityVisualCatalog {
  getVisual(entityType: string): EntityVisualDefinition
}
```

A stateless, deterministic lookup that maps entity type strings to their visual definitions. Unknown types return a sensible default.

### 3. Create `DefaultEntityVisualCatalog`

| Entity Type | Shape | Width | Height | Notes |
|---|---|---|---|---|
| `player` | circle | 24 | 24 | Rendered as a circle via `drawCircle` |
| `enemy` | rectangle | 20 | 20 | Small rectangle |
| `merchant` | rectangle | 28 | 20 | Wide, short rectangle |
| `boss` | rectangle | 40 | 40 | Large rectangle |
| `*` (default) | rectangle | 20 | 20 | Backward-compatible fallback |

All definitions and the map are deeply frozen. Unknown types return a shared default.

### 4. Update `DefaultPixiEntityRenderer`

**Constructor change**: added optional `catalog?: EntityVisualCatalog` to `PixiEntityRendererOptions`.

**Rendering logic change** (per entity with position):
```
entity.type
  ↓
resolveVisual(entityType) → EntityVisualDefinition
  ↓
if (shape === 'circle'):
  drawCircle(0, 0, radius = min(w, h) / 2)
else:
  drawRect(0, 0, width, height)
```

**Fallback**: when no catalog is provided, the renderer uses a hardcoded 20×20 rectangle default. This ensures backward compatibility with all existing code that creates a `DefaultPixiEntityRenderer` without a catalog.

### 5. Location

| File | Action |
|------|--------|
| `packages/renderer/src/view/EntityVisualDefinition.ts` | New — interface |
| `packages/renderer/src/view/EntityVisualCatalog.ts` | New — interface |
| `packages/renderer/src/view/DefaultEntityVisualCatalog.ts` | New — implementation |
| `packages/renderer/src/view/PixiEntityRenderer.ts` | Modified — catalog-driven rendering |
| `packages/renderer/src/view/index.ts` | Modified — added catalog exports |
| `packages/renderer/src/index.ts` | Modified — added catalog barrel exports |
| `packages/renderer/src/view/__tests__/EntityVisualCatalog.test.ts` | New — 18 tests |
| `packages/renderer/src/view/__tests__/PixiEntityRenderer.test.ts` | Modified — added catalog + 17 new tests |
| `packages/renderer/src/view/__tests__/VisualMappingIntegration.test.ts` | New — 9 integration tests |
| `docs/adr/ADR-0194-entity-visual-mapping-foundation.md` | New — this document |

### 6. Unit Test Strategy

**EntityVisualCatalog.test.ts** — 18 tests across 8 sections:

| Section | Tests | Coverage |
|---------|-------|----------|
| Construction | 1 | Instance creation |
| player mapping | 2 | Circle shape, 24×24 dimensions |
| enemy mapping | 2 | Rectangle shape, 20×20 dimensions |
| merchant mapping | 2 | Rectangle shape, 28×20 dimensions |
| boss mapping | 2 | Rectangle shape, 40×40 dimensions |
| unknown types | 3 | Unknown type, empty string, null-like |
| immutability | 2 | Frozen outputs, readonly properties |
| determinism | 2 | Same type across calls, across instances |
| all mappings | 2 | All valid, no duplicates |

**PixiEntityRenderer.test.ts** — updated with 17 new catalog-driven tests:

| Section | Tests | Coverage |
|---------|-------|----------|
| Catalog — player | 2 | Circle rendering, correct position |
| Catalog — enemy | 1 | 20×20 rectangle |
| Catalog — merchant | 1 | 28×20 rectangle |
| Catalog — boss | 1 | 40×40 rectangle |
| Catalog — default | 1 | Unknown type → 20×20 rectangle |
| Catalog — clear() | 1 | Clear with catalog |
| Catalog — multiple renders | 1 | Mixed types across renders |
| Catalog integration | 3 | No-catalog fallback, backward compat, mixed types |
| Catalog determinism | 1 | Same input → same output |

### 7. Integration Test Strategy

**VisualMappingIntegration.test.ts** — 9 tests across 7 sections:

| Section | Tests | Coverage |
|---------|-------|----------|
| Visual distinction exists | 3 | Player≠enemy, merchant≠boss, all types unique |
| Player renders as circle | 2 | No drawRect, correct position |
| Different sizes | 1 | Enemy 20×20, merchant 28×20, boss 40×40 |
| Default entity | 1 | Unknown → 20×20 rectangle |
| Cleanup with catalog | 1 | Clear removes all |
| Real-world rendering | 1 | Mixed world with all types |

---

## Consequences

### Positive

1. **Visual distinction** — each entity type now renders with its own size and shape
2. **Player is a circle** — visually distinct from all rectangular entities
3. **Catalog abstraction** — new visual mappings can be added without touching the renderer
4. **Backward compatible** — existing code without a catalog still works (20×20 rectangle)
5. **Foundation for future work** — colors, sprites, animations can build on this
6. **Deterministic** — same entity type + same catalog = same visual output

### Negative

1. **Graphics only** — no sprites, textures, or rich visuals
2. **Two shapes only** — rectangle and circle; no polygons, arcs, or compound shapes
3. **Single catalog per renderer** — all entities in a world use the same catalog

### Neutral

1. **Color is still hardcoded** — all entities use the same `0x4fc3f7` fill
2. **No per-instance visual** — all entities of the same type look identical
3. **Foundation only** — future WOs will add colors, sprites, and animations

---

## Verification

- TypeScript: 0 errors (`packages/renderer`)
- ESLint: 0 errors
- EntityVisualCatalog unit tests pass: 18
- PixiEntityRenderer tests pass: 40 (23 existing + 17 new)
- VisualMappingIntegration tests pass: 9
- Total renderer tests: 249
- No Sprite changes
- No Texture changes
- No Asset loading
- No Input changes
- No Physics changes
- No Collision changes
- No Camera changes
- No Runtime changes
- No DSL changes
- No AI changes
- No breaking changes to any Public API

---

## Files Created/Modified

| File | Action |
|------|--------|
| `packages/renderer/src/view/EntityVisualDefinition.ts` | New — interface |
| `packages/renderer/src/view/EntityVisualCatalog.ts` | New — interface |
| `packages/renderer/src/view/DefaultEntityVisualCatalog.ts` | New — implementation |
| `packages/renderer/src/view/PixiEntityRenderer.ts` | Modified — catalog-driven rendering |
| `packages/renderer/src/view/index.ts` | Modified — added catalog exports |
| `packages/renderer/src/index.ts` | Modified — added catalog barrel exports |
| `packages/renderer/src/view/__tests__/EntityVisualCatalog.test.ts` | New — 18 tests |
| `packages/renderer/src/view/__tests__/PixiEntityRenderer.test.ts` | Modified — +17 catalog tests |
| `packages/renderer/src/view/__tests__/VisualMappingIntegration.test.ts` | New — 9 tests |
| `docs/adr/ADR-0194-entity-visual-mapping-foundation.md` | New — this document |
| `docs/project/PROJECT_STATE.md` | Updated — v1.81, WO-S9-007 |
| `docs/project/CHANGELOG.md` | Updated — v1.81, WO-S9-007 |