# ADR-0182: Runtime World Mutation Foundation

**Status:** Accepted  
**Date:** Sprint 8  
**Work Order:** WO-S8-010  
**Architecture Version:** v1.68 → v1.69

---

## Context

WO-S8-008 introduced the Runtime System Foundation and WO-S8-009 introduced the Runtime Execution Loop. Systems can now be registered and executed in a loop. However, there is no **standard world mutation mechanism** for systems to use.

Current state:

```
World → System[].update() → World
```

Systems currently have no consistent way to:
- Add entities to the World
- Remove entities from the World
- Replace entities in the World

Without a standard mutation model, each system would implement its own world manipulation logic, leading to duplicated, inconsistent, and error-prone code.

### Problem

1. **No standard mutation helpers** — each system would need to implement its own entity add/remove/replace logic
2. **No consistent immutability guarantees** — ad-hoc mutations risk breaking the immutable contract
3. **No defensive edge case handling** — missing entities, duplicate IDs, and empty worlds need consistent treatment
4. **No frozen output guarantee** — mutation results must be frozen to maintain the immutable pipeline

### Scope Boundaries

- Foundation only — no ECS, no game logic, no gameplay systems
- No Renderer changes
- No PixiJS
- No Planner changes
- No PromptBuilder changes
- No Domain Model changes
- No DSL changes
- No Projection changes
- No ECS implementation
- No gameplay systems

---

## Decision

### 1. Create `WorldMutator` Interface

```typescript
export interface WorldMutator {
  addEntity(world: World, entity: Entity): World
  removeEntity(world: World, entityId: string): World
  replaceEntity(world: World, entity: Entity): World
}
```

Three fundamental mutation operations, each following the immutable `World → World` transformation pattern.

### 2. Create `WorldMutationResult` Type

```typescript
export interface WorldMutationResult {
  readonly world: World
  readonly entityCount: number
  readonly operation: string
}
```

Provides mutation metadata alongside the output world.

### 3. Create `DefaultWorldMutator` Implementation

| Operation | Behavior |
|-----------|----------|
| `addEntity` | Freezes entity, appends to entity list, returns frozen World |
| `removeEntity` | Filters entity list by id; returns frozen copy if no match; returns unchanged frozen copy if not found |
| `replaceEntity` | Finds entity by id and replaces it; appends if id not found |

All operations:
- **Pure**: no side effects, no I/O, no external calls
- **Stateless**: no internal state between operations
- **Deterministic**: same input always produces same output
- **Immutable**: outputs are deeply frozen; inputs are never mutated

### 4. Edge Case Rules

| Scenario | Behavior |
|----------|----------|
| `removeEntity` with non-existent id | Returns world unchanged (frozen copy) |
| `replaceEntity` with non-existent id | Appends the entity |
| `addEntity` with duplicate id | Allows duplicates (appends) |
| `removeEntity` with duplicate id | Removes only first match |
| `replaceEntity` with duplicate id | Replaces first match |
| Empty world input | Always produces valid frozen output |

### 5. Location

| File | Purpose |
|------|---------|
| `packages/runtime/src/mutation/WorldMutator.ts` | New — interface |
| `packages/runtime/src/mutation/WorldMutationResult.ts` | New — type |
| `packages/runtime/src/mutation/DefaultWorldMutator.ts` | New — implementation |
| `packages/runtime/src/mutation/index.ts` | New — barrel exports |
| `packages/runtime/src/index.ts` | Modified — added mutation exports |
| `packages/runtime/src/__tests__/WorldMutator.test.ts` | New — tests |
| `docs/adr/ADR-0182-runtime-world-mutation-foundation.md` | New — this document |

### 6. Test Strategy

| Section | Tests | Coverage |
|---------|-------|----------|
| Construction | 3 | Instance creation, interface conformance, stateless |
| addEntity | 6 | Empty world, populated world, end of list, sequential, preserve existing data, with components |
| removeEntity | 8 | By id, correct entity, first, last, all, non-existent, empty world, preserve order |
| replaceEntity | 7 | Matching id, append new, preserve others, first, last, single-entity, with components |
| Missing Entity | 4 | removeEntity unchanged, preserve ids, replaceEntity appends, append to empty |
| Duplicate IDs | 3 | addEntity allows, removeEntity first, replaceEntity first |
| Immutability | 8 | Frozen add/remove/replace outputs, no input mutation, frozen entities |
| Determinism | 5 | Same add/remove/replace output, across instances, non-existent |
| Large Worlds | 5 | Add to 100/1000, remove from 100/1000, replace in 1000 |
| Deep Freeze | 5 | Frozen entities, frozen arrays, mutation throws, empty world freeze |
| Serialization | 5 | JSON round-trip for add/remove/replace, components, empty |

---

## Consequences

### Positive

1. **Standard mutation model** — all systems use the same mutation helpers
2. **Consistent immutability** — all outputs are deeply frozen; inputs are never mutated
3. **Defensive edge case handling** — missing entities, duplicates, and empty worlds are handled consistently
4. **Deterministic and pure** — all operations produce the same output for the same input
5. **No breaking changes** — all existing types and code are unchanged

### Negative

1. **No batch operations** — each mutation is a single entity operation (future work could add batch add/remove/replace)
2. **No query before mutation** — there is no built-in pattern for "find then mutate" (future work could add query-based mutation)
3. **Simple linear search** — `removeEntity` and `replaceEntity` use linear search (future work could add indexing)

### Neutral

1. **Foundation only** — no ECS, no game logic, no gameplay systems
2. **Three fundamental operations** — add, remove, and replace cover the majority of mutation needs

---

## Verification

- TypeScript: 0 errors (`packages/runtime`, `packages/shared`)
- ESLint: 0 errors
- All WorldMutator tests pass
- All existing tests continue to pass
- No Renderer changes
- No PixiJS
- No Planner changes
- No PromptBuilder changes
- No Domain Model changes
- No DSL changes
- No Projection changes
- No ECS implementation
- No gameplay systems
- No breaking changes to any Public API

---

## Files Created/Modified

| File | Action |
|------|--------|
| `packages/runtime/src/mutation/WorldMutator.ts` | New — interface |
| `packages/runtime/src/mutation/WorldMutationResult.ts` | New — type |
| `packages/runtime/src/mutation/DefaultWorldMutator.ts` | New — implementation |
| `packages/runtime/src/mutation/index.ts` | New — barrel exports |
| `packages/runtime/src/index.ts` | Modified — added mutation exports |
| `packages/runtime/src/__tests__/WorldMutator.test.ts` | New — 59 tests across 11 sections |
| `docs/adr/ADR-0182-runtime-world-mutation-foundation.md` | New — this document |
| `docs/project/PROJECT_STATE.md` | Updated — v1.69, WO-S8-010 |
| `docs/project/CHANGELOG.md` | Updated — v1.69, WO-S8-010 |