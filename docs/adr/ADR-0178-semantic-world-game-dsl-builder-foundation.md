# ADR-0178: Semantic World To Game DSL Builder Foundation

**Status:** Accepted  
**Date:** Sprint 8  
**Work Order:** WO-S8-006  
**Architecture Version:** v1.64 → v1.65

---

## Context

WO-S8-005 (Semantic Game World DSL Foundation) introduced `GameWorldModel`, `WorldType`, `EntityCategory`, and `GameWorldEntity` — the first domain-level game concepts. This created a semantic layer that describes *what* a game world is.

However, there is no conversion path between semantic concepts and the structural `GameDsl` that the Runtime projection consumes. The architecture has a missing bridge:

```
GameWorldModel (semantic)
     ↓
    (MISSING — SemanticGameDslBuilder)
     ↓
GameDsl (structural)
     ↓
RuntimeProjection
     ↓
Runtime
```

### Current Architecture

```
PromptAssemblyDomainModel
   ↓
GameDslBuilder (section → entity)
   ↓
GameDsl
   ↓
RuntimeProjection
   ↓
Runtime World
   ↓
RuntimeComponentModel

GameWorldModel ← (no builder to GameDsl)
```

### Problem

1. **No semantic-to-structural bridge** — `GameWorldModel` exists but cannot be converted to `GameDsl`
2. **Semantic data is lost** — world type, entity categories, and entity names are not representable in the game DSL pipeline
3. **No composable pipeline** — the semantic model and structural pipeline are disconnected

### Scope Boundaries

- Foundation only — no AI generation, no Runtime systems, no Renderer
- No Runtime changes
- No Projection changes
- No Renderer changes
- No PixiJS
- No Planner changes
- No PromptBuilder changes
- No Domain Model changes
- No ECS changes
- No gameplay execution

---

## Decision

### 1. Create `SemanticGameDslBuilder` Interface

```typescript
export interface SemanticGameDslBuilder {
  build(world: GameWorldModel): GameDsl
}
```

### 2. Create `DefaultSemanticGameDslBuilder` Implementation

Pure, stateless, deterministic, with deeply frozen outputs.

### 3. Mapping Rules

#### World

| GameWorldModel | GameDsl.world | Rule |
|----------------|---------------|------|
| `worldType: 'farm'` | `name: 'Farm World'` | Lookup table conversion |
| `worldType: 'platformer'` | `name: 'Platformer World'` | Lookup table conversion |
| `worldType: 'rpg'` | `name: 'RPG World'` | Lookup table conversion |
| `worldType: 'survival'` | `name: 'Survival World'` | Lookup table conversion |
| `worldType: 'sandbox'` | `name: 'Sandbox World'` | Lookup table conversion |
| Unknown `worldType` | `name: 'Game World'` | Fallback |

#### Entity

| GameWorldEntity | EntityDsl | Rule |
|-----------------|-----------|------|
| `id` | `id` | Preserved (converted to string) |
| `category` | `type` | Preserved (converted to string) |

#### Component

Each entity gets exactly one component:

| Field | Value |
|-------|-------|
| `type` | `'semantic'` |
| `properties.category` | `entity.category` |
| `properties.name` | `entity.name` |

### 4. Pipeline Integration

```
GameWorldModel
   ↓
DefaultSemanticGameDslBuilder.build()
   ↓
GameDsl ──→ RuntimeProjection ──→ Runtime World
```

The `GameDsl` produced by the semantic builder is structurally identical to the `GameDsl` produced by the existing `DefaultGameDslBuilder` (which converts `PromptAssemblyDomainModel`). Both produce `GameDsl` that can be consumed by the existing `RuntimeProjection`.

### 5. Invalid Input Handling

| Input | Behavior |
|-------|----------|
| `undefined` / `null` world | Empty DSL (empty name, zero entities) |
| Non-object world | Empty DSL |
| Null entity in entities array | Skipped (excluded from output) |
| Null entity id | Converted to `""` |

### 6. Location

| File | Purpose |
|------|---------|
| `packages/ai/src/game-world/SemanticGameDslBuilder.ts` | New — interface |
| `packages/ai/src/game-world/DefaultSemanticGameDslBuilder.ts` | New — implementation |
| `packages/ai/src/game-world/index.ts` | New — directory exports |
| `packages/ai/src/index.ts` | Modified — added game-world exports |
| `packages/ai/src/__tests__/SemanticGameDslBuilder.test.ts` | New — tests |

### 7. Test Strategy

| Section | Tests | Coverage |
|---------|-------|----------|
| Construction | 5 | Builder creation, interface conformance, build method |
| Empty World | 7 | EMPTY model, empty entities, undefined/null/non-object input |
| All World Types | 7 | 5 world types, unknown fallback, string type |
| All Entity Categories | 9 | All 7 categories mapped, all present in RPG |
| Entity Mapping | 9 | ID preservation, type derivation, count, order, null handling |
| Component Mapping | 8 | Semantic component type, category/name properties |
| Immutability | 10 | Frozen result/world/entities/entities/components/properties, input unchanged |
| Determinism | 8 | Same input, multiple builders, per-world-type, order, empty |
| Serialization | 9 | JSON stringify, key presence, entity types, round-trip |
| Large Worlds | 8 | 100/1000 entities, IDs, types, components, frozen, JSON |
| Edge Cases | 7 | Stateful behavior, duplicate categories, component cardinality |

---

## Consequences

### Positive

1. **Semantic-to-structural bridge** — `GameWorldModel` can now be converted to `GameDsl`
2. **Preserves semantic data** — entity category and name are stored in a "semantic" component
3. **Composable with existing pipeline** — output `GameDsl` is structurally identical to `DefaultGameDslBuilder` output
4. **No breaking changes** — all existing types and code are unchanged
5. **Pure transformation** — no side effects, no state, no I/O
6. **World type naming** — human-readable world names from semantic types

### Negative

1. **Fixed world name mapping** — world type names are hardcoded in a lookup table (future work could make them configurable)
2. **One component per entity** — each entity always gets exactly one "semantic" component (future work could add more)

### Neutral

1. **Foundation only** — no AI generation, no Runtime, no gameplay execution
2. **Types only** — no behavior, no methods, no logic

---

## Verification

- TypeScript: 0 errors (`packages/ai`, `packages/shared`)
- ESLint: 0 errors
- All SemanticGameDslBuilder tests pass
- All existing tests continue to pass
- No Runtime changes
- No Projection changes
- No Renderer changes
- No PixiJS
- No Planner changes
- No PromptBuilder changes
- No Domain Model changes
- No DSL changes
- No ECS changes
- No breaking changes to any Public API

---

## Files Created/Modified

| File | Action |
|------|--------|
| `packages/ai/src/game-world/SemanticGameDslBuilder.ts` | New — interface |
| `packages/ai/src/game-world/DefaultSemanticGameDslBuilder.ts` | New — implementation |
| `packages/ai/src/game-world/index.ts` | New — directory exports |
| `packages/ai/src/index.ts` | Modified — added game-world exports |
| `packages/ai/src/__tests__/SemanticGameDslBuilder.test.ts` | New — 86 tests across 11 sections |
| `docs/adr/ADR-0178-semantic-world-game-dsl-builder-foundation.md` | New — this document |
| `docs/project/PROJECT_STATE.md` | Updated — v1.65, WO-S8-006 |
| `docs/project/CHANGELOG.md` | Updated — v1.65, WO-S8-006 |