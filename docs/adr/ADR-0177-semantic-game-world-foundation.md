# ADR-0177: Semantic Game World DSL Foundation

**Status:** Accepted  
**Date:** Sprint 8  
**Work Order:** WO-S8-005  
**Architecture Version:** v1.63 → v1.64

---

## Context

Sprint 8 introduced four foundational layers: the Game DSL (WO-S8-001), the DSL Builder (WO-S8-002), the Runtime Projection (WO-S8-003), and the Runtime Component Model (WO-S8-004). Together these form the **structural pipeline** — they describe *how* entities and components are defined, built, and projected.

What's missing is the **semantic layer** — types that describe *what* a game world actually is. The `GameDsl` is a generic entity-component container; it doesn't express whether the world is a farm, an RPG, or a platformer. The builder generates entities from observatory sections, which validates architecture but doesn't represent actual game content.

### Current Architecture

```
PromptAssemblyDomainModel
  ↓
GameDslBuilder (generates entities from observatory sections)
  ↓
GameDsl (generic entity-component container)
  ↓
RuntimeProjection
  ↓
Runtime World
  ↓
RuntimeComponentModel
```

### Problem

1. **No semantic types** — there is no way to express "this is a farm game" or "this entity is an NPC"
2. **Builder produces generic DSL** — the GameDslBuilder creates entities from observatory metadata, not from game design intent
3. **No domain concepts** — `WorldType`, `EntityCategory`, and `GameWorldModel` are absent from the type system

### Scope Boundaries

- Contracts only — no AI generation, no Runtime systems, no Renderer
- No Runtime changes
- No Projection changes
- No Renderer changes
- No PixiJS
- No Planner changes
- No PromptBuilder changes
- No Domain Model changes
- No DSL changes
- No ECS changes
- No gameplay execution

---

## Decision

### 1. Create `WorldType`

A union of five string literals describing game world genres:

```typescript
export type WorldType =
  | 'farm'
  | 'platformer'
  | 'rpg'
  | 'survival'
  | 'sandbox'
```

### 2. Create `EntityCategory`

A union of seven string literals describing entity roles:

```typescript
export type EntityCategory =
  | 'player'
  | 'npc'
  | 'enemy'
  | 'terrain'
  | 'building'
  | 'item'
  | 'quest'
```

### 3. Create `GameWorldEntity`

```typescript
export interface GameWorldEntity {
  readonly id: string
  readonly category: EntityCategory
  readonly name: string
}
```

### 4. Create `GameWorldModel`

```typescript
export interface GameWorldModel {
  readonly worldType: WorldType
  readonly entities: readonly GameWorldEntity[]
}
```

### 5. Create `EMPTY_GAME_WORLD_MODEL`

```typescript
export const EMPTY_GAME_WORLD_MODEL: GameWorldModel = Object.freeze({
  worldType: 'sandbox',
  entities: Object.freeze([]),
})
```

### 6. Relationship to GameDsl

```
GameWorldModel (semantic)              GameDsl (structural)
┌─────────────────────┐               ┌──────────────────────┐
│ worldType: 'rpg'    │               │ world: WorldDsl      │
│ entities:           │               │   name: "My World"   │
│   id: "hero"        │               │   entities:          │
│   category: player  │               │     EntityDsl[]      │
│   name: "Hero"      │               │       id: "hero"     │
│   id: "goblin"      │               │       type: "Hero"   │
│   category: enemy   │               │       components[]   │
│   name: "Goblin"    │               └──────────────────────┘
└─────────────────────┘
```

The two models serve different purposes:
- **GameWorldModel** — semantic, human-friendly: describes what the world *is*
- **GameDsl** — structural, machine-friendly: describes how the world is *built*

Future work will map between the two (GameWorldModel → GameDsl).

### 7. Location

| File | Purpose |
|------|---------|
| `packages/shared/src/game-world/GameWorldModel.ts` | New — all type definitions and EMPTY constant |
| `packages/shared/src/game-world/index.ts` | New — game-world directory exports |
| `packages/shared/src/index.ts` | Modified — added game-world export |
| `packages/shared/src/tests/GameWorldModel.test.ts` | New — comprehensive tests |

### 8. Test Strategy

| Section | Tests | Coverage |
|---------|-------|----------|
| Construction | 10 | All 5 world types, property existence |
| World Types | 7 | Each value, runtime type, distinctness |
| Entity Categories | 11 | Each value, all 7 in RPG model, runtime type, distinctness |
| Empty Model | 5 | EMPTY constant, default type, frozen |
| Serialization | 9 | JSON stringify, round-trip, structure, primitives |
| Immutability | 4 | Readonly at type level |
| Determinism | 7 | Same input, per-world-type, entity order, empty |
| Entity Structure | 7 | Property count, string preservation, uniqueness |
| Large Models | 6 | 100/1000 entities, categories, names, JSON |
| Type Exports | 7 | All types exported, assignability |

---

## Consequences

### Positive

1. **First semantic game types** — `WorldType` and `EntityCategory` introduce domain-level game concepts
2. **Higher-level abstraction** — `GameWorldModel` sits above `GameDsl`, describing game intent
3. **No breaking changes** — no existing types or code are modified
4. **Contracts only** — pure types with a default constant, zero runtime logic
5. **Extensible** — new world types and entity categories can be added without breaking changes

### Negative

1. **No mapping to GameDsl** — the semantic model is disconnected from the structural pipeline (future work)
2. **Static set of types** — `WorldType` and `EntityCategory` are fixed unions, requiring a type change for new members

### Neutral

1. **Foundation only** — no AI generation, no Runtime, no gameplay execution
2. **Types only** — no behavior, no methods, no logic

---

## Verification

- TypeScript: 0 errors (`packages/shared`)
- ESLint: 0 errors
- All GameWorldModel tests pass
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
| `packages/shared/src/game-world/GameWorldModel.ts` | New — types and EMPTY constant |
| `packages/shared/src/game-world/index.ts` | New — directory exports |
| `packages/shared/src/index.ts` | Modified — added game-world export |
| `packages/shared/src/tests/GameWorldModel.test.ts` | New — 73 tests across 10 sections |
| `docs/adr/ADR-0177-semantic-game-world-foundation.md` | New — this document |
| `docs/project/PROJECT_STATE.md` | Updated — v1.64, WO-S8-005 |
| `docs/project/CHANGELOG.md` | Updated — v1.64, WO-S8-005 |