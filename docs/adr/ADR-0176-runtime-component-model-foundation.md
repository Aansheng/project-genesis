# ADR-0176: Runtime Component Model Foundation

**Status:** Accepted  
**Date:** Sprint 8  
**Work Order:** WO-S8-004  
**Architecture Version:** v1.62 → v1.63

---

## Context

Sprint 8 introduced the Game DSL foundation (WO-S8-001), the DSL builder from the Domain Model (WO-S8-002), and the Runtime projection layer (WO-S8-003). The projection layer currently counts `ComponentDsl` entries but does NOT store them as Runtime objects — components are counted but lost after projection.

### Current Architecture

```
PromptAssemblyDomainModel
  ↓
GameDslBuilder
  ↓
GameDsl
  ↓
RuntimeProjection
  ↓
Runtime World (EntityDsl.components[] are counted but not represented)
```

### Current Limitation

`EntityDsl.components[]` are counted at runtime (via `componentCount`) but are **not stored** as Runtime objects. There is no `RuntimeComponent` type and no mechanism for Runtime entities to own component instances. This limits:

1. **No component state** — the Runtime has no record of what components an entity owns
2. **No foundation for ECS** — future Entity-Component-System work has no type to build on
3. **Lost data** — component type and properties are discarded after counting

### Scope Boundaries

- Foundation only — no gameplay systems, no ECS framework
- No Renderer integration
- No PixiJS
- No Planner changes
- No PromptBuilder changes
- No Domain Model changes
- No DSL changes
- No ECS framework
- No simulation
- No interpretation of component data
- No validation logic
- No breaking changes to existing Public API

---

## Decision

### 1. Create `RuntimeComponent` Interface

Defined in `packages/runtime/src/model/RuntimeComponent.ts` (re-exported from `@genesis/shared` via `packages/shared/src/RuntimeComponent.ts`):

```typescript
export interface RuntimeComponent {
  readonly type: string
  readonly properties: Readonly<Record<string, unknown>>
}
```

### 2. Update Runtime Entity Model

Add optional `components` field to the shared `Entity` type:

```typescript
export interface Entity {
  id: string
  type: string
  x: number
  y: number
  readonly components?: readonly RuntimeComponent[]
}
```

The field is **optional** for backward compatibility — existing code that creates `Entity` objects without components (e.g., `CreateEntityHandler`) continues to compile unmodified.

### 3. Update `DefaultRuntimeProjection`

Mapping rules change from component **counting** to component **projection**:

| DSL Field | v1.62 (Counted) | v1.63 (Projected) |
|-----------|-----------------|-------------------|
| `ComponentDsl` | Counted in `componentCount`, NOT stored | Projected as `RuntimeComponent`, stored in entity |
| `ComponentDsl.type` | Tracked in count only | Preserved as `RuntimeComponent.type` |
| `ComponentDsl.properties` | Tracked in count only | Preserved as `RuntimeComponent.properties` (deep frozen copy) |

Projection flow:

```
ComponentDsl                          RuntimeComponent
┌────────────────────────┐            ┌──────────────────────┐
│ type: "Position"       │ ────────→  │ type: "Position"     │
│ properties: { x, y }   │ ────────→  │ properties: { x, y } │
└────────────────────────┘            └──────────────────────┘
                                              ↓
                                      Object.freeze()
                                      Object.freeze(props)
                                              ↓
                                      Entity.components[]
```

### 4. Update `RuntimeProjectionResult`

`componentCount` is now derived from **actual projected `RuntimeComponent` objects** rather than from counting DSL components independently. The value is identical in practice but the derivation is semantically different.

### 5. Deep Freeze

All projected `RuntimeComponent` instances and their `properties` are deeply frozen (`Object.freeze()`).

### 6. Location

| File | Purpose |
|------|---------|
| `packages/shared/src/RuntimeComponent.ts` | New — RuntimeComponent interface definition |
| `packages/shared/src/types.ts` | Modified — added optional `components` field to `Entity` |
| `packages/shared/src/index.ts` | Modified — added RuntimeComponent export |
| `packages/runtime/src/model/RuntimeComponent.ts` | New — re-export of RuntimeComponent |
| `packages/runtime/src/model/index.ts` | New — model directory exports |
| `packages/runtime/src/projection/DefaultRuntimeProjection.ts` | Modified — component projection |
| `packages/runtime/src/projection/RuntimeProjection.ts` | Modified — updated documentation |
| `packages/runtime/src/projection/RuntimeProjectionResult.ts` | Modified — updated documentation |
| `packages/runtime/src/index.ts` | Modified — added model exports |
| `packages/runtime/src/__tests__/RuntimeComponent.test.ts` | New — RuntimeComponent tests |
| `packages/runtime/src/__tests__/RuntimeProjection.test.ts` | Modified — expanded with component tests |

### 7. Test Strategy

#### RuntimeComponent.test.ts

| Section | Tests | Coverage |
|---------|-------|----------|
| Construction | 9 | Simple, Position, Health, Inventory, string/boolean/null/undefined types |
| Immutability | 6 | Readonly fields, frozen object, frozen properties |
| Deep Readonly | 4 | Nested properties, array properties, recursive freeze |
| Serialization | 8 | JSON stringify, round-trip, complex types |
| Large Collections | 5 | 10/100/1000 components, property checks, frozen structure |
| Type Safety | 4 | String type, typed records, mixed types |

#### RuntimeProjection.test.ts (Expanded)

| New Section | Tests | Coverage |
|-------------|-------|----------|
| Entity Components | 5 | Components array existence, empty/non-empty, per-entity |
| Single Component | 5 | One ComponentDsl → one RuntimeComponent, type, count |
| Multiple Components | 6 | 2/1 component entities, different types, order, sum |
| Component Preservation | 7 | Type preservation, string conversion, null handling |
| Property Preservation | 7 | Numeric/string/boolean/empty/array properties |
| Nested Properties | 5 | 1-/2-level nesting, arrays, mixed types, no interpretation |
| Component Count | 6 | Consistent with projected components, mixed counts |
| Component Immutability | 9 | Frozen components, properties, arrays, mutation rejection |
| Component Determinism | 4 | Same types/properties/order/JSON across projections |
| Component Serialization | 5 | JSON round-trip, type/property/count preservation |
| Large Worlds with Components | 6 | 100×5, 50×20, frozen deep check, performance, type integrity |

---

## Consequences

### Positive

1. **Components are now Runtime objects** — `RuntimeComponent` instances are stored in `Entity.components[]`
2. **Foundation for ECS** — future ECS work has a type to build on
3. **No data loss** — component type and properties are preserved through projection
4. **No breaking changes** — optional `components` field on `Entity` preserves backward compatibility
5. **Defensive projection** — null/undefined components are safely skipped
6. **Immutable by default** — all projected components and their properties are deeply frozen
7. **Comprehensive tests** — both new test file and expanded existing test file

### Negative

1. **No entity positioning from components** — components are stored but `x`/`y` are still defaulted to 0 (future work)
2. **Optional field on Entity** — TypeScript cannot enforce that projected entities always have components at compile time

### Neutral

1. **Foundation only** — no gameplay logic, no simulation, no interpretation
2. **Pure transformation** — no side effects, no state, no I/O

---

## Verification

- TypeScript: 0 errors (`packages/shared`, `packages/runtime`)
- ESLint: 0 errors
- All Runtime Projection tests pass
- All RuntimeComponent tests pass
- All existing Runtime tests continue to pass
- No Renderer changes
- No PixiJS
- No Planner changes
- No PromptBuilder changes
- No Domain Model changes
- No DSL changes
- No ECS framework
- No gameplay systems
- No simulation
- No AI generation
- No breaking changes to any Public API

---

## Files Created/Modified

| File | Action |
|------|--------|
| `packages/shared/src/RuntimeComponent.ts` | New — RuntimeComponent interface |
| `packages/shared/src/types.ts` | Modified — Entity gets optional `components` |
| `packages/shared/src/index.ts` | Modified — added RuntimeComponent export |
| `packages/runtime/src/model/RuntimeComponent.ts` | New — re-export |
| `packages/runtime/src/model/index.ts` | New — model directory |
| `packages/runtime/src/projection/DefaultRuntimeProjection.ts` | Modified — component projection |
| `packages/runtime/src/projection/RuntimeProjection.ts` | Modified — documentation |
| `packages/runtime/src/projection/RuntimeProjectionResult.ts` | Modified — documentation |
| `packages/runtime/src/projection/index.ts` | Unchanged — no new projection exports needed |
| `packages/runtime/src/index.ts` | Modified — added model exports |
| `packages/runtime/src/__tests__/RuntimeComponent.test.ts` | New — comprehensive component tests |
| `packages/runtime/src/__tests__/RuntimeProjection.test.ts` | Modified — expanded with 11 new sections |
| `docs/adr/ADR-0176-runtime-component-model-foundation.md` | New — this document |
| `docs/project/PROJECT_STATE.md` | Updated — v1.63, WO-S8-004 |
| `docs/project/CHANGELOG.md` | Updated — v1.63, WO-S8-004 |