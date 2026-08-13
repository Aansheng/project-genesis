# ADR-0175: Game DSL Runtime Projection Foundation

**Status:** Accepted  
**Date:** Sprint 8  
**Work Order:** WO-S8-003  
**Architecture Version:** v1.61 → v1.62

---

## Context

Sprint 8 introduced the Game DSL foundation (WO-S8-001, `GameDsl`/`WorldDsl`/`EntityDsl`/`ComponentDsl`) and the DSL builder from the Domain Model (WO-S8-002, `GameDslBuilder`). The next milestone is creating the first projection layer between the declarative Game DSL and the Runtime imperative world.

### Current Architecture

```
PromptAssemblyDomainModel
  ↓
GameDslBuilder
  ↓
GameDsl
  ↓
(Runtime Projection — MISSING)
  ↓
Runtime World
```

### Problem

1. **No projection path** — there is no mechanism to convert a `GameDsl` into a Runtime `World`
2. **DSL-to-Runtime gap** — the declarative entity-component DSL has no Runtime counterpart
3. **No foundation for projection** — future integration work requires a projection contract

### Scope Boundaries

- Foundation only — no Renderer integration, no gameplay, no simulation
- No ECS expansion — Runtime Entity type unchanged
- No AI generation
- No Planner changes
- No PromptBuilder changes
- No Domain Model changes
- No DSL changes
- No breaking changes to existing Runtime World/Entity types

---

## Decision

### 1. Create `RuntimeProjection` Interface

Defined in `packages/runtime/src/projection/RuntimeProjection.ts`:

```typescript
export interface RuntimeProjection {
  project(dsl: GameDsl): RuntimeProjectionResult
}
```

### 2. Create `RuntimeProjectionResult` Interface

Defined in `packages/runtime/src/projection/RuntimeProjectionResult.ts`:

```typescript
export interface RuntimeProjectionResult {
  readonly world: World
  readonly entityCount: number
  readonly componentCount: number
}
```

### 3. Create `DefaultRuntimeProjection` Implementation

Defined in `packages/runtime/src/projection/DefaultRuntimeProjection.ts`.

```
GameDsl                           Runtime World
┌─────────────────────┐           ┌──────────────────────┐
│ world: WorldDsl     │ ────────→ │ world: World         │
│   name: "My World"  │  (meta)   │   entities: Entity[] │
│   entities:         │           │                      │
│     EntityDsl[]     │ ────────→ │     Entity[]         │
│       id: string    │ ────────→ │       id: string     │
│       type: string  │ ────────→ │       type: string   │
│       components[]  │ ────────→ │       x: 0 (default) │
│                      │           │       y: 0 (default) │
│                      │           │                      │
│ entityCount          │ ────────→ │ entityCount: 3       │
│ componentCount       │ ────────→ │ componentCount: 5    │
└─────────────────────┘           └──────────────────────┘
```

### 4. Mapping Rules

#### World

| DSL Field | Runtime Field | Rule |
|-----------|---------------|------|
| `GameDsl.world` | `result.world` | Runtime `World` — entity container (no name field) |
| `world.name` | (metadata) | Not projected — Runtime World has no name field |

#### Entity

| DSL Field | Runtime Field | Rule |
|-----------|---------------|------|
| `EntityDsl.id` | `Entity.id` | Preserved (converted to string) |
| `EntityDsl.type` | `Entity.type` | Preserved (converted to string) |
| (none) | `Entity.x` | Defaulted to `0` — no position interpretation |
| (none) | `Entity.y` | Defaulted to `0` — no position interpretation |

#### Component

| DSL Field | Runtime Field | Rule |
|-----------|---------------|------|
| `ComponentDsl` | `componentCount` | Counted only — not stored in Runtime Entity |
| `ComponentDsl.type` | (counted) | Preserved in count, no interpretation |
| `ComponentDsl.properties` | (counted) | Preserved in count, no interpretation |

### 5. Entity Rejection Rules

| Condition | Behavior |
|-----------|----------|
| Null/undefined entity | Skipped — excluded from count |
| Null `id` | Converted to `""` |
| Null `type` | Converted to `""` |
| Non-object entity | Skipped silently |

### 6. Invalid Input Rules

| Input | Behavior |
|-------|----------|
| `undefined` / `null` DSL | Empty result (0 entities, 0 components) |
| Non-object DSL | Empty result |
| Array DSL | Empty result |
| Missing `world` field | Empty result |
| Null/undefined `entities` | Empty result |

### 7. Location

| File | Purpose |
|------|---------|
| `packages/runtime/src/projection/RuntimeProjection.ts` | RuntimeProjection interface |
| `packages/runtime/src/projection/RuntimeProjectionResult.ts` | RuntimeProjectionResult interface |
| `packages/runtime/src/projection/DefaultRuntimeProjection.ts` | DefaultRuntimeProjection implementation |
| `packages/runtime/src/projection/index.ts` | Re-exports |
| `packages/runtime/src/index.ts` | Updated — added projection exports |
| `packages/runtime/src/__tests__/RuntimeProjection.test.ts` | Tests |

### 8. Test Strategy

| Section | Tests | Coverage |
|---------|-------|----------|
| Construction | 5 | Builder creation, interface conformance, build method |
| Empty world | 10 | Zero entities, zero components, undefined/null/array DSL, null world |
| Single entity | 11 | ID/type preservation, default position, null handling |
| Multiple entities | 10 | 3 entities, ID/type preservation, order, position defaults |
| Multiple components | 5 | Sum count, null/undefined components |
| Entity count | 6 | Empty, single, multiple, mismatch, exclusion |
| Component count | 6 | Empty, single, multiple, sum, mixed |
| Immutability | 8 | Frozen result/world/entities/entities, no input mutation |
| Determinism | 5 | Same input, multiple projectors, empty/single, order |
| Serialization | 9 | JSON round-trip, key presence, primitive types |
| Large worlds | 5 | 100/1000 entities, many components, performance, frozen |
| Invalid DSL | 8 | Undefined/null, non-object, missing world, mixed |
| Edge cases | 7 | String conversion, name handling, property count, stateless |

---

## Consequences

### Positive

1. **First DSL-to-Runtime projection** — establishes the bridge between declarative DSL and imperative Runtime
2. **No breaking changes** — existing Runtime `World` and `Entity` types unchanged
3. **Defensive** — invalid input produces safe empty results
4. **Pipeline validation** — component counting validates the DSL pipeline end-to-end
5. **Tested** — comprehensive test suite covering all specified areas

### Negative

1. **Components not stored** — components are counted but not stored in Runtime entities (future ECS expansion required)
2. **No entity positioning** — all entities get default position (0,0); future work will interpret position data

### Neutral

1. **Foundation only** — no gameplay logic, no simulation, no interpretation
2. **Pure transformation** — no side effects, no state, no I/O

---

## Verification

- TypeScript: 0 errors (`packages/runtime`)
- ESLint: 0 errors
- All Runtime Projection tests pass
- All existing Runtime tests continue to pass
- No Renderer changes
- No PixiJS
- No Planner changes
- No PromptBuilder changes
- No Domain Model changes
- No DSL changes
- No ECS redesign
- No simulation
- No gameplay systems
- No AI generation
- No breaking changes to any Public API

---

## Files Created/Modified

| File | Action |
|------|--------|
| `packages/runtime/src/projection/RuntimeProjection.ts` | New — RuntimeProjection interface |
| `packages/runtime/src/projection/RuntimeProjectionResult.ts` | New — RuntimeProjectionResult interface |
| `packages/runtime/src/projection/DefaultRuntimeProjection.ts` | New — DefaultRuntimeProjection implementation |
| `packages/runtime/src/projection/index.ts` | New — re-exports |
| `packages/runtime/src/index.ts` | Modified — added projection exports |
| `packages/runtime/src/__tests__/RuntimeProjection.test.ts` | New — comprehensive tests |
| `docs/adr/ADR-0175-game-dsl-runtime-projection-foundation.md` | New — this document |
| `docs/project/PROJECT_STATE.md` | Updated — v1.62, WO-S8-003 |
| `docs/project/CHANGELOG.md` | Updated — v1.62, WO-S8-003 |