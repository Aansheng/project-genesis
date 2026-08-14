# ADR-0204: Platform World Rendering Foundation

**Status:** Accepted  
**Date:** Sprint 9  
**Work Order:** WO-S9-016  
**Architecture Version:** v1.90 → v1.91

---

## Context

The game is technically playable with player movement, jumping, gravity, and ground collision (WO-S9-009 through WO-S9-015). However, visuals remain a debug visualization: all entities render as identically-colored rectangles regardless of type.

### Problems

1. **No type visual distinction** — terrain, goal, and player all render as the same shape and color
2. **No semantic tile dimensions** — there is no catalog mapping entity types to platform-appropriate sizes
3. **No per-type colors** — the renderer uses a single fill color (`0x4fc3f7`) for all entity types
4. **Mario world does not resemble a platform game** — ground, platforms, enemies, and goals are visually indistinguishable

### Scope Boundaries

Foundation only.
- No sprites
- No textures
- No spritesheets
- No image loading
- No asset management
- No animation
- No runtime changes
- No physics changes
- No AI changes
- No camera changes
- Deterministic rendering only

---

## Decision

### 1. Create `PlatformTileDefinition` Type

```typescript
export interface PlatformTileDefinition {
  readonly width: number
  readonly height: number
}
```

A frozen, immutable description of tile dimensions for a given entity type.

### 2. Create `PlatformTileCatalog` Interface

```typescript
export interface PlatformTileCatalog {
  getTile(entityType: string): PlatformTileDefinition
}
```

Stateless, deterministic lookup for entity type → tile dimensions.

### 3. Create `DefaultPlatformTileCatalog`

| Entity Type  | Width | Height | Description              |
|-------------|-------|--------|--------------------------|
| player      | 24    | 24     | Square character         |
| terrain     | 64    | 32     | Wide platform rectangle  |
| goal        | 24    | 96     | Tall flag-style rectangle |
| platform    | 96    | 24     | Horizontal rectangle     |
| enemy       | 24    | 24     | Square enemy             |
| checkpoint  | 16    | 48     | Tall marker              |
| item        | 16    | 16     | Small square             |
| fallback    | 20    | 20     | Default fallback         |

All definitions and the map are deeply frozen. Unknown types return the 20×20 fallback.

### 4. Update `DefaultEntityVisualCatalog`

Added 5 new mappings:

| Entity Type  | Shape     | Width | Height |
|-------------|-----------|-------|--------|
| terrain     | rectangle | 64    | 32     |
| platform    | rectangle | 96    | 24     |
| goal        | rectangle | 24    | 96     |
| checkpoint  | rectangle | 16    | 48     |
| item        | rectangle | 16    | 16     |

All existing mappings (player, enemy, merchant, boss) unchanged. Determinism preserved.

### 5. Update `DefaultPixiEntityRenderer` (Tile-Aware Rendering)

**New behavior:**

**Per-type colors:**
| Entity Type  | Color      | Hex       |
|-------------|-----------|-----------|
| player      | Light Blue | `0x4fc3f7` |
| terrain     | Brown     | `0x8d6e63` |
| goal        | Yellow    | `0xffd54f` |
| platform    | Green     | `0x66bb6a` |
| enemy       | Red       | `0xef5350` |
| item        | Yellow    | `0xffd54f` |
| checkpoint  | Purple    | `0xce93d8` |
| default     | Light Blue| `0x4fc3f7` |

**New option:** `tileCatalog?: PlatformTileCatalog` in `PixiEntityRendererOptions`. When provided alongside a visual catalog, tile dimensions from the tile catalog are used for rendering. The visual catalog still determines shape (circle vs rectangle).

**Fallback chain:**
1. If `catalog` exists → use `catalog.getVisual(entityType)` for shape + dimensions
2. If `tileCatalog` exists (no catalog) → use `tileCatalog.getTile(entityType)` for dimensions, shape is rectangle
3. If neither exists → 20×20 rectangle fallback (backward compatible)

### 6. File Layout

| File | Action |
|------|--------|
| `packages/renderer/src/view/world/PlatformTileDefinition.ts` | New — tile type interface |
| `packages/renderer/src/view/world/PlatformTileCatalog.ts` | New — tile catalog interface |
| `packages/renderer/src/view/world/DefaultPlatformTileCatalog.ts` | New — default implementation |
| `packages/renderer/src/view/world/index.ts` | New — barrel exports |
| `packages/renderer/src/view/DefaultEntityVisualCatalog.ts` | Updated — added 5 new mappings |
| `packages/renderer/src/view/PixiEntityRenderer.ts` | Updated — per-type colors + tile catalog |
| `packages/renderer/src/view/index.ts` | Updated — tile catalog exports |
| `packages/renderer/src/index.ts` | Updated — tile catalog barrel exports |
| `packages/renderer/src/view/world/__tests__/PlatformTileCatalog.test.ts` | New — 42 tests |
| `packages/renderer/src/view/__tests__/PixiEntityRenderer.test.ts` | Updated — 42 tile-aware tests |
| `packages/renderer/src/view/__tests__/PlatformWorldRenderingIntegration.test.ts` | New — 29 integration tests |
| `packages/renderer/src/view/__tests__/EntityVisualCatalog.test.ts` | Updated — new type coverage |
| `docs/adr/ADR-0204-platform-world-rendering-foundation.md` | New — this document |
| `docs/project/PROJECT_STATE.md` | Updated — v1.91 |
| `docs/project/CHANGELOG.md` | Updated — v1.91 |

### 7. Test Strategy

**PlatformTileCatalog.test.ts** — 42 tests across 16 sections:

| Section | Tests | Coverage |
|---------|-------|----------|
| Construction | 1 | instance creation |
| player mapping | 1 | dimensions |
| terrain mapping | 2 | dimensions, aspect ratio |
| goal mapping | 2 | dimensions, aspect ratio |
| platform mapping | 2 | dimensions, aspect ratio |
| enemy mapping | 2 | dimensions, square |
| checkpoint mapping | 2 | dimensions, aspect ratio |
| item mapping | 2 | dimensions, small square |
| Fallback | 4 | unknown type, empty, null-like, undefined-like |
| Immutability | 3 | frozen, readonly, fallback frozen |
| Determinism | 3 | same call, same instance, multiple calls |
| All mappings | 5 | valid types, uniqueness, positive integers |
| Large inputs | 3 | long strings, special chars, unicode |
| Edge cases | 5 | player=enemy size, terrain/player ratio, ratio checks, fallback uniqueness |
| Interface contract | 3 | method exists, has width/height, accepts any string |
| Return value consistency | 2 | positive integers, fallback positive integers |

**PixiEntityRenderer.test.ts** — Existing 25 sections + 12 new sections covering:

| Section | Tests | Coverage |
|---------|-------|----------|
| Terrain rendering | 2 | 64×32 rectangle, correct position |
| Goal rendering | 2 | 24×96 flag, taller-than-wide |
| Platform rendering | 2 | 96×24 rectangle, wider-than-tall |
| Checkpoint rendering | 2 | 16×48 marker, taller-than-wide |
| Item rendering | 2 | 16×16 small square |
| Per-type colors | 9 | all 7 types + player default + unknown default |
| Camera compatibility | 2 | with tile catalog and camera, multiple types |
| Fallback behavior | 2 | tile without visual catalog, unknown fallback |
| Clear and re-render | 2 | clear with tile, re-render replacement |
| Determinism | 1 | same input same output |

**PlatformWorldRenderingIntegration.test.ts** — 29 tests across 9 sections:

| Section | Tests | Coverage |
|---------|-------|----------|
| Mario world rendering | 4 | full world, player circle, terrain positions, distinct positions |
| Terrain visibility | 4 | brown color, 64×32, continuous ground, no position |
| Goal visibility | 3 | yellow color, 24×96 flag, above ground |
| Platform rendering | 2 | green color, 96×24 rectangle |
| Camera movement | 2 | offset with tile catalog, position shifting |
| Render updates | 3 | entity replacement, clear, safe clear |
| Entity combinations | 6 | mixed types, unique colors, error-free, no-position, large count |
| Determinism | 2 | same output across instances and re-renders |
| Edge cases | 3 | empty world, fractional, large coordinates |

---

## Consequences

### Positive

1. **Visual distinction** — terrain, platforms, goals, enemies, items, and checkpoints each have unique shapes and colors
2. **Mario world resembles a platform game** — brown ground, yellow flag, green platforms, red enemies
3. **No breaking changes** — tile catalog is optional; renderers without it work unchanged
4. **Backward compatible** — existing EntityVisualCatalog + colors unchanged
5. **Deterministic and immutable** — all mappings are deeply frozen
6. **Integrations tested** — camera + tile catalog combined, full Mario world rendering

### Negative

1. **No sprites or textures** — still shape-only (intentional, foundation only)
2. **No animation** — entities are static shapes (intentional, future WO)

### Neutral

1. **Extensible** — new entity types can be added to both catalogs without breaking existing mappings
2. **Renderer-scoped** — all changes live in the renderer package
3. **Optional integration** — tile catalog is optional; backwards compatible

---

## Verification

- TypeScript: 0 errors (`packages/renderer`)
- ESLint: 0 errors
- PlatformTileCatalog tests: 42 passed
- PixiEntityRenderer tests: 65+ passed (existing + 42 new)
- PlatformWorldRenderingIntegration tests: 29 passed
- All Renderer tests: 513/513 passed (20 files)
- No Runtime changes
- No Physics changes
- No AI changes
- No breaking changes to any Public API
- Architecture version v1.90 to v1.91

---

## Files Created/Modified

| File | Action |
|------|--------|
| `packages/renderer/src/view/world/PlatformTileDefinition.ts` | New |
| `packages/renderer/src/view/world/PlatformTileCatalog.ts` | New |
| `packages/renderer/src/view/world/DefaultPlatformTileCatalog.ts` | New |
| `packages/renderer/src/view/world/index.ts` | New |
| `packages/renderer/src/view/world/__tests__/PlatformTileCatalog.test.ts` | New |
| `packages/renderer/src/view/__tests__/PlatformWorldRenderingIntegration.test.ts` | New |
| `packages/renderer/src/view/__tests__/PixiEntityRenderer.test.ts` | Updated |
| `packages/renderer/src/view/__tests__/EntityVisualCatalog.test.ts` | Updated |
| `packages/renderer/src/view/DefaultEntityVisualCatalog.ts` | Updated |
| `packages/renderer/src/view/PixiEntityRenderer.ts` | Updated |
| `packages/renderer/src/view/index.ts` | Updated |
| `packages/renderer/src/index.ts` | Updated |
| `docs/adr/ADR-0204-platform-world-rendering-foundation.md` | New |
| `docs/project/PROJECT_STATE.md` | Updated |
| `docs/project/CHANGELOG.md` | Updated |