# ADR-0190: Semantic World Generator Enrichment Foundation

**Status:** Accepted  
**Date:** Sprint 9  
**Work Order:** WO-S8-013  
**Architecture Version:** v1.76 → v1.77

---

## Context

WO-S8-007 introduced `DefaultSemanticWorldGenerator` with hard-coded entity templates. Five world types existed but each had a minimal set of entities:

| World Type | Entities (Before) |
|------------|-------------------|
| farm | 4 (player, merchant, wheat-field, harvest-quest) |
| rpg | 4 (player, villager, quest-giver, enemy) |
| platformer | 3 (player, terrain, enemy) |
| survival | 3 (player, resource, enemy) |
| sandbox | 1 (player) |

This was sufficient for the foundation but limited for richer game world generation.

### Problems

1. **Farm template too sparse** — missing farmer, barn, corn-field, storage
2. **RPG template too sparse** — missing merchant, boss, town, forest, main-quest
3. **Platformer template too sparse** — missing platform, goal, checkpoint
4. **Survival template too sparse** — missing tree, stone, campfire
5. **No extensibility mechanism** — entity data was mixed with generation logic
6. **No catalog abstraction** — hard-coded data inside the generator prevented reuse

### Scope Boundaries

Foundation only — all entities are still deterministic, rule-based, and AI-free.
- No Runtime changes
- No Renderer changes
- No DSL changes
- No Projection changes
- No Movement changes
- No Input System
- No Collision
- No Physics
- No LLM

---

## Decision

### 1. Create `WorldTemplate` Interface

```typescript
export interface WorldTemplate {
  readonly worldType: WorldType
  readonly entities: readonly GameWorldEntity[]
}
```

Encapsulates a complete set of entity definitions for a world type. The template is immutable and fully frozen.

### 2. Create `WorldTemplateCatalog` Interface

```typescript
export interface WorldTemplateCatalog {
  getTemplate(worldType: WorldType): WorldTemplate
}
```

Provides a single method for retrieving entity templates by world type. Every WorldType has a guaranteed template.

### 3. Create `DefaultWorldTemplateCatalog`

A concrete implementation that provides enriched entity templates:

| World Type | Entities (After) | Increase |
|------------|------------------|----------|
| farm | 8 entities — player, merchant, farmer, barn, wheat-field, corn-field, storage, harvest-quest | +4 |
| rpg | 9 entities — player, villager, merchant, quest-giver, enemy, boss, town, forest, main-quest | +5 |
| platformer | 6 entities — player, terrain, platform, enemy, goal, checkpoint | +3 |
| survival | 6 entities — player, resource, tree, stone, enemy, campfire | +3 |
| sandbox | 1 entity — player | 0 |

Total: 30 entities across 5 templates (was 15, +100%).

### 4. Update `DefaultSemanticWorldGenerator`

- Added optional `catalog?: WorldTemplateCatalog` constructor parameter
- Replaced internal `getDefaultEntities()` with `this.catalog.getTemplate(worldType)`
- Removed all hard-coded entity template data
- All existing public API unchanged (`generate(model)`)

### 5. Location

| File | Action |
|------|--------|
| `packages/ai/src/game-world/catalog/WorldTemplate.ts` | New — interface |
| `packages/ai/src/game-world/catalog/WorldTemplateCatalog.ts` | New — interface |
| `packages/ai/src/game-world/catalog/DefaultWorldTemplateCatalog.ts` | New — implementation |
| `packages/ai/src/game-world/catalog/index.ts` | New — barrel exports |
| `packages/ai/src/game-world/DefaultSemanticWorldGenerator.ts` | Modified — uses catalog |
| `packages/ai/src/game-world/index.ts` | Modified — added catalog exports |
| `packages/ai/src/__tests__/WorldTemplateCatalog.test.ts` | New — 60+ tests |
| `packages/ai/src/__tests__/SemanticWorldGenerator.test.ts` | Modified — updated entity counts |
| `docs/adr/ADR-0190-semantic-world-generator-enrichment.md` | New — this document |

### 6. Test Strategy

**WorldTemplateCatalog.test.ts** — 60+ tests covering:

| Section | Coverage |
|---------|----------|
| All templates | Every WorldType returns a defined template |
| Entity counts | Exact count per template (farm: 8, rpg: 9, platformer: 6, survival: 6, sandbox: 1) |
| Farm template | IDs, categories, names, new entities (farmer, barn, corn-field, storage) |
| RPG template | IDs, categories, names, new entities (merchant, boss, town, forest, main-quest) |
| Platformer template | IDs, categories, names, new entities (platform, goal, checkpoint) |
| Survival template | IDs, categories, names, new entities (tree, stone, campfire) |
| Sandbox template | ID, category, name |
| Immutability | Template, entities array, each entity frozen; all types verified |
| Determinism | Same type = same result; different catalogs = same result; order stable |
| Frozen outputs | worldType readonly, entities readonly, entity properties readonly |
| Valid categories | All entities have valid EntityCategory; non-empty names and ids |

**SemanticWorldGenerator.test.ts** — existing tests updated for new entity counts:

- Farm: 4 → 8 entities verified
- RPG: 4 → 9 entities verified
- Platformer: 3 → 6 entities verified
- Survival: 3 → 6 entities verified
- Sandbox: 1 entity unchanged
- All new entity IDs, categories, names verified
- All existing determinism, immutability, serialization tests preserved

---

## Consequences

### Positive

1. **Richer worlds** — templates doubled total entities from 15 to 30 (+100%)
2. **Farm world** — includes farmer NPC, barn and storage buildings, corn field terrain
3. **RPG world** — includes merchant NPC, boss enemy, town building, forest terrain, main quest
4. **Platformer world** — includes platform terrain, goal and checkpoint items
5. **Survival world** — includes tree and stone terrain, campfire item
6. **Catalog abstraction** — generators can be swapped without touching generation logic
7. **No breaking changes** — `DefaultSemanticWorldGenerator` accepts optional catalog; defaults to `DefaultWorldTemplateCatalog`
8. **Deterministic and immutable** — all templates are deeply frozen

### Negative

1. **Foundation only** — no dynamic entity generation, no AI, no procedural generation
2. **Static templates** — all entities are predefined; no runtime customization
3. **No entity variation** — same template always produces identical entities

### Neutral

1. **Catalog pattern** — follow-on WOs can add custom catalogs, merged catalogs, or dynamic catalogs
2. **Constructable** — `new DefaultSemanticWorldGenerator(customCatalog)` for DI
3. **No Runtime dependency** — catalog is in the AI package only

---

## Verification

- TypeScript: 0 errors (`packages/ai`, `packages/shared`)
- ESLint: 0 errors
- All WorldTemplateCatalog tests pass: 60+
- All SemanticWorldGenerator tests pass (updated for new counts)
- All existing AI tests pass (8789)
- No Runtime changes
- No Renderer changes
- No DSL changes
- No Projection changes
- No Movement changes
- No Input System
- No Collision
- No Physics
- No LLM
- No breaking changes to any Public API

---

## Files Created/Modified

| File | Action |
|------|--------|
| `packages/ai/src/game-world/catalog/WorldTemplate.ts` | New — interface |
| `packages/ai/src/game-world/catalog/WorldTemplateCatalog.ts` | New — interface |
| `packages/ai/src/game-world/catalog/DefaultWorldTemplateCatalog.ts` | New — implementation |
| `packages/ai/src/game-world/catalog/index.ts` | New — barrel exports |
| `packages/ai/src/game-world/DefaultSemanticWorldGenerator.ts` | Modified — catalog-driven |
| `packages/ai/src/game-world/index.ts` | Modified — added catalog exports |
| `packages/ai/src/__tests__/WorldTemplateCatalog.test.ts` | New — 60+ tests |
| `packages/ai/src/__tests__/SemanticWorldGenerator.test.ts` | Modified — richer entities |
| `docs/adr/ADR-0190-semantic-world-generator-enrichment.md` | New — this document |
| `docs/project/PROJECT_STATE.md` | Updated — v1.77, WO-S8-013 |
| `docs/project/CHANGELOG.md` | Updated — v1.77, WO-S8-013 |