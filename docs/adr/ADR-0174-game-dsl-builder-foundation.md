# ADR-0174: Game DSL Builder Foundation

**Status:** Accepted  
**Date:** Sprint 8  
**Work Order:** WO-S8-002  
**Architecture Version:** v1.60 → v1.61

---

## Context

Sprint 7 introduced the typed Prompt Assembly Domain Model (`PromptAssemblyDomainModel`). Sprint 8 (WO-S8-001) introduced the Game DSL (`GameDsl`, `WorldDsl`, `EntityDsl`, `ComponentDsl`). The next milestone is establishing the first transformation path between Domain Model and Game DSL.

### Current Architecture

```
PromptBuilder
  ↓
PromptObservatoryMetadata
  ↓
PromptAssemblyDomainModel
  ↓
(GameDsl Builder — MISSING)
  ↓
GameDsl
  ↓
Runtime
  ↓
Renderer
```

### Problem

1. **No transformation path** — there is no mechanism to convert a typed `PromptAssemblyDomainModel` into a `GameDsl`
2. **Pipeline gap** — the architecture has no structural mapping between observability data and game world declarations
3. **No foundation for AI generation** — future AI generation, mapping, and integration work requires a builder contract

### Scope Boundaries

- Foundation only — no AI generation, no Runtime integration, no Renderer integration
- No execution logic — this is structure generation, not game generation
- No PromptBuilder changes
- No Domain Model changes
- No Planner changes
- No UI changes
- No Store changes
- No ECS changes
- No gameplay logic
- No world simulation
- No PixiJS

---

## Decision

### 1. Create `GameDslBuilder` Interface

Defined in `packages/ai/src/game-dsl/GameDslBuilder.ts`:

```typescript
export interface GameDslBuilder {
  build(domainModel: PromptAssemblyDomainModel): GameDsl
}
```

### 2. Create `DefaultGameDslBuilder` Implementation

Defined in `packages/ai/src/game-dsl/DefaultGameDslBuilder.ts`.

The builder implements a deterministic 1-to-1 section-to-entity mapping:

```
PromptAssemblyDomainModel                  GameDsl
┌──────────────────────┐         ┌─────────────────────────┐
│ overview: {...}      │ ──────→ │ entity { id: "overview", │
│ trace: [...]         │ ──────→ │         type: "overview"}│
│ timeline: [...]      │ ──────→ │ entity { id: "timeline"} │
│ history: [...]       │ ──────→ │ entity { id: "history"}  │
│ diff: [...]          │ ──────→ │ entity { id: "diff"}     │
│ runtime: {...}       │ ──────→ │ entity { id: "runtime"}  │
│ eventStream: {...}   │ ──────→ │ entity { id: "eventStrm"}│
└──────────────────────┘         └─────────────────────────┘
```

### 3. Mapping Rules

#### World Name

| Rule | Description |
|------|-------------|
| Source | `domainModel.overview.title` (forward-compatible lookup) |
| Fallback | `"Untitled World"` |
| Forward compatibility | Builder looks for `title` as an optional string — when `OverviewDomain` gains a `title` field, the builder automatically uses it |

#### Entities

| Rule | Description |
|------|-------------|
| Count | One entity per available, non-null section |
| Section list | `overview`, `trace`, `timeline`, `history`, `diff`, `runtime`, `eventStream` |
| Entity `id` | Section name (verbatim, e.g., `"overview"`) |
| Entity `type` | Section name (verbatim, e.g., `"overview"`) |
| Order | Deterministic — always follows the section list order |
| Empty domain | Zero entities |
| Null section | Treated as absent — no entity produced |

#### Components

| Rule | Description |
|------|-------------|
| Count | Exactly one component per entity |
| Component type | `"metadata"` |
| Properties | `{ source: sectionName }` — tracks the source section |
| Purpose | Validates DSL pipeline structure, not gameplay |

### 4. Design Principles

- **Pure** — no side effects, no I/O, no external calls
- **Stateless** — no internal state between builds
- **Deterministic** — same input always produces same output
- **Immutable** — all outputs are deeply frozen
- **Defensive** — safe extraction, no assumptions about input shape

### 5. Output Structure

```typescript
// Empty domain model → Minimal GameDsl
{
  world: {
    name: "Untitled World",
    entities: []
  }
}

// Full domain model (7 sections) → 7 entities
{
  world: {
    name: "Untitled World",
    entities: [
      { id: "overview",    type: "overview",    components: [{ type: "metadata", properties: { source: "overview" } }] },
      { id: "trace",       type: "trace",       components: [{ type: "metadata", properties: { source: "trace" } }] },
      { id: "timeline",    type: "timeline",    components: [{ type: "metadata", properties: { source: "timeline" } }] },
      { id: "history",     type: "history",     components: [{ type: "metadata", properties: { source: "history" } }] },
      { id: "diff",        type: "diff",        components: [{ type: "metadata", properties: { source: "diff" } }] },
      { id: "runtime",     type: "runtime",     components: [{ type: "metadata", properties: { source: "runtime" } }] },
      { id: "eventStream", type: "eventStream", components: [{ type: "metadata", properties: { source: "eventStream" } }] },
    ]
  }
}
```

### 6. Location

| File | Purpose |
|------|---------|
| `packages/ai/src/game-dsl/GameDslBuilder.ts` | GameDslBuilder interface |
| `packages/ai/src/game-dsl/DefaultGameDslBuilder.ts` | DefaultGameDslBuilder implementation |
| `packages/ai/src/game-dsl/index.ts` | Re-exports |

### 7. Test Strategy

The test file `packages/ai/src/__tests__/GameDslBuilder.test.ts` covers:

| Section | Tests | Coverage |
|---------|-------|----------|
| Construction | 5 | Builder creation, interface conformance, build method |
| Empty domain | 7 | Fallback name, zero entities, undefined/null sections, frozen output |
| Partial domain | 7 | Single sections, multi-section, entity order, fallback name |
| Full domain | 9 | All 7 section entities, MetadataComponent, deterministic order |
| World naming | 9 | Fallback, title extraction, numeric/null title |
| Entity generation | 8 | ID/type properties, components array, no duplicates |
| Component generation | 7 | Type, properties, source tracking, serializability |
| Immutability | 10 | Root/world/entities/components frozen, no input mutation |
| Determinism | 5 | Same input, different builders, empty/partial, order |
| Serialization | 9 | JSON round-trip, key presence, primitive types |
| Large inputs | 5 | Many items, all sections, deeply nested, empty arrays, performance |
| Edge cases | 5 | Verbatim section names, no extra properties, phantom sections |
| Compatibility | 5 | No input mutation, no web/types, stateless, EMPTY_GAME_DSL |

---

## Consequences

### Positive

1. **First transformation path** — establishes the bridge between Domain Model and Game DSL
2. **Deterministic mapping** — 1-to-1 section-to-entity mapping with no ambiguity
3. **Pipeline validation** — the builder validates the DSL pipeline structure end-to-end
4. **Forward-compatible** — world name lookup is prepared for future `overview.title`
5. **Tested** — comprehensive test suite covering all specified areas

### Negative

1. **Simple mapping only** — the initial entity structure is minimal; future work will add richer entity types and component patterns
2. **No AI generation** — the builder does not generate game content; it only maps structure

### Neutral

1. **No breaking changes** — existing PromptAssemblyDomainModel, GameDsl, and all downstream consumers continue unchanged
2. **Pure transformation** — no side effects, no state, no I/O

---

## Verification

- TypeScript: 0 errors (`packages/ai`, `packages/shared`)
- ESLint: 0 errors
- All Game DSL builder tests pass
- All existing AI package tests continue to pass
- No Runtime changes
- No Renderer changes
- No Planner changes
- No PromptBuilder changes
- No Domain Model changes
- No UI changes
- No Store changes
- No ECS changes
- No gameplay logic
- No world simulation
- No breaking changes to any Public API

---

## Files Created/Modified

| File | Action |
|------|--------|
| `packages/ai/src/game-dsl/GameDslBuilder.ts` | New — GameDslBuilder interface |
| `packages/ai/src/game-dsl/DefaultGameDslBuilder.ts` | New — DefaultGameDslBuilder implementation |
| `packages/ai/src/game-dsl/index.ts` | New — re-exports |
| `packages/ai/src/__tests__/GameDslBuilder.test.ts` | New — comprehensive tests |
| `docs/adr/ADR-0174-game-dsl-builder-foundation.md` | New — this document |
| `docs/project/PROJECT_STATE.md` | Updated — v1.61, WO-S8-002 |
| `docs/project/CHANGELOG.md` | Updated — v1.61, WO-S8-002 |