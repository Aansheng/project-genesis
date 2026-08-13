# ADR-0173: Game DSL Foundation

**Status:** Accepted  
**Date:** Sprint 8  
**Work Order:** WO-S8-001  
**Architecture Version:** v1.59 → v1.60

---

## Context

Sprint 6 completed the Observatory real metadata pipeline (Bridge → Mapper → Adapter → Store → UI). Sprint 7 introduced the typed Prompt Assembly Domain Model (`PromptAssemblyDomainModel`). The next milestone requires introducing the first Game DSL layer.

### Current Architecture

```
PromptBuilder
  ↓
PromptObservatoryMetadata
  ↓
PromptAssemblyDomainModel
  ↓
(DSL Missing)
  ↓
Runtime
  ↓
Renderer
```

### Problem

1. **No Game DSL exists** — the entire pipeline above Runtime has no typed game domain model
2. **No entity-component vocabulary** — existing types (`Entity`, `World` in `@genesis/shared`) are runtime-oriented and action-driven, not declarative
3. **DSL gap** — future AI generation, mapping, and integration work requires a foundational DSL contract

### Scope Boundaries

- Types only — no behavior, no methods, no logic
- No Runtime integration
- No Renderer integration
- No AI generation
- No Planner integration
- No PromptBuilder changes
- No Domain Model changes
- No Store changes
- No Observatory changes
- No UI changes

---

## Decision

### 1. Create `GameDsl` Type

A four-level typed hierarchy in `packages/shared/src/game-dsl/`:

```
GameDsl
  └── world: WorldDsl
        ├── name: string
        └── entities: readonly EntityDsl[]
              ├── id: string
              ├── type: string
              └── components: readonly ComponentDsl[]
                    ├── type: string
                    └── properties: Readonly<Record<string, unknown>>
```

### 2. Interface Definitions

| Interface | Fields | Purpose |
|-----------|--------|---------|
| `GameDsl` | `world: WorldDsl` | Root contract — entry point for all DSL consumers |
| `WorldDsl` | `name: string`, `entities: readonly EntityDsl[]` | World definition with name and entity list |
| `EntityDsl` | `id: string`, `type: string`, `components: readonly ComponentDsl[]` | Entity with ECS-style component attachment |
| `ComponentDsl` | `type: string`, `properties: Readonly<Record<string, unknown>>` | Component with typed key and property bag |

### 3. Design Principles

- **Immutable** — all fields are readonly
- **Serializable** — all types are JSON-serializable primitives
- **Framework-independent** — no Vue, Pinia, or web framework imports
- **Runtime-independent** — no Runtime type imports
- **UI-independent** — no ViewModel or UI type imports
- **Extensible** — future fields can be added without breaking changes
- **Types only** — no behavior, no methods, no logic

### 4. Default Values

`EMPTY_GAME_DSL` — a frozen empty GameDsl constant:
```typescript
export const EMPTY_GAME_DSL: GameDsl = Object.freeze({
  world: Object.freeze({
    name: '',
    entities: Object.freeze([]),
  }),
})
```

### 5. Location

| File | Purpose |
|------|---------|
| `packages/shared/src/game-dsl/GameDsl.ts` | All DSL interfaces + EMPTY_GAME_DSL constant |
| `packages/shared/src/game-dsl/index.ts` | Re-exports |
| `packages/shared/src/index.ts` | Updated — added `export * from './game-dsl'` |

### 6. Package Infrastructure

- Added `vitest` devDependency to `@genesis/shared`
- Created `vitest.config.ts` with test include pattern `src/tests/**/*.test.ts`

---

## Consequences

### Positive

1. **First Game DSL type** — establishes the entity-component vocabulary for the entire project
2. **ECS pattern** — entities with components follow the Entity-Component-System architecture
3. **Future-ready** — `properties: Record<string, unknown>` enables future typed components without breaking changes
4. **Shared package** — accessible to all consumers (Runtime, Renderer, AI, Web)
5. **52 tests** — covers construction, immutability, serialization, nesting, readonly guarantees, empty world, large world, type exports

### Negative

1. **Additional package dependency** — vitest added to shared package (minor)
2. **No integration yet** — the DSL is standalone; future work orders will connect it

### Neutral

1. **Types only** — no behavior or logic
2. **No breaking changes** — existing `Entity`, `World`, `Action` types continue unchanged

---

## Verification

- TypeScript: 0 errors (`packages/shared`, `packages/ai`, `apps/web`)
- ESLint: 0 errors
- 52 tests passing in `packages/shared/src/tests/GameDsl.test.ts`
- All existing AI package tests pass (8493)
- All existing web package tests pass (3929)
- No Runtime changes
- No Renderer changes
- No Planner changes
- No PromptBuilder changes
- No Domain Model changes
- No UI changes

---

## Files Created/Modified

| File | Action |
|------|--------|
| `packages/shared/src/game-dsl/GameDsl.ts` | New — GameDsl, WorldDsl, EntityDsl, ComponentDsl + EMPTY_GAME_DSL |
| `packages/shared/src/game-dsl/index.ts` | New — re-exports |
| `packages/shared/src/index.ts` | Modified — added `export * from './game-dsl'` |
| `packages/shared/src/tests/GameDsl.test.ts` | New — 52 tests |
| `packages/shared/package.json` | Modified — added vitest devDependency + test script |
| `packages/shared/vitest.config.ts` | New — vitest configuration |
| `docs/adr/ADR-0173-game-dsl-foundation.md` | New — this document |
| `docs/project/PROJECT_STATE.md` | Updated — v1.60, WO-S8-001 |
| `docs/project/CHANGELOG.md` | Updated — v1.60, WO-S8-001 |