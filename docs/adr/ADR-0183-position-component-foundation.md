# ADR-0183: Position Component Foundation

**Status:** Accepted  
**Date:** Sprint 8  
**Work Order:** WO-S8-011  
**Architecture Version:** v1.69 → v1.70

---

## Context

WO-S8-004 introduced the Runtime Component Model Foundation (`RuntimeComponent` interface), providing a generic component type that any component can conform to. However, there is no **standardized gameplay component** that Runtime Systems can query or mutate.

The current component stack:

```
RuntimeComponent (generic)
  └── (no concrete components exist)
```

Without a standardized gameplay component:
- Each system would define its own position data representation
- No type-safe way to narrow `RuntimeComponent` to a specific component type
- No consistent pattern for component factory creation
- No established pattern for component type guards

### Problem

1. **No typed component interface** — `RuntimeComponent.properties` is `Record<string, unknown>`, requiring runtime type narrowing to access typed fields
2. **No factory pattern** — each component would need its own creation logic
3. **No type guard pattern** — no consistent way to narrow `RuntimeComponent` to a specific component type
4. **No establishment of patterns** — the first gameplay component sets the patterns that all future components will follow

### Scope Boundaries

- Foundation only — no movement logic, no physics, no gameplay systems
- No Runtime changes
- No Projection changes
- No Renderer changes
- No PixiJS
- No Planner changes
- No PromptBuilder changes
- No ECS implementation
- No gameplay systems
- No movement logic

---

## Decision

### 1. Create `PositionComponent` Interface

```typescript
export interface PositionComponent {
  readonly type: 'position'
  readonly properties: {
    readonly x: number
    readonly y: number
  }
}
```

A concrete gameplay component with a **discriminant `type` field** set to the string literal `'position'`. This enables TypeScript's discriminated union narrowing when combined with `isPositionComponent()`.

**Why a literal `'position'` type instead of `string`?**
- Enables TypeScript discriminated unions: `if (comp.type === 'position')` narrows automatically
- Enables exact type narrowing via `isPositionComponent()` type guard

### 2. Create `POSITION_COMPONENT_TYPE` Constant

```typescript
export const POSITION_COMPONENT_TYPE = 'position'
```

A canonical string constant that serves as:
- The single source of truth for the type identifier
- The value used by `isPositionComponent()` for runtime type checking
- The key used by the type guard's pattern matching

### 3. Create `createPositionComponent()` Factory

```typescript
export function createPositionComponent(
  x: number,
  y: number
): PositionComponent
```

| Property | Behavior |
|----------|----------|
| Pure | No side effects, no I/O, no external calls |
| Stateless | No internal state between calls |
| Deterministic | Same (x, y) always produces identical output |
| Immutable | Output is deeply frozen via `Object.freeze()` |

**Frozen structure:**
```
PositionComponent (frozen)
  └── properties (frozen)
       ├── x: number
       └── y: number
```

### 4. Create `isPositionComponent()` Type Guard

```typescript
export function isPositionComponent(
  component: RuntimeComponent
): component is PositionComponent
```

A user-defined type guard that:
- Checks `component.type === POSITION_COMPONENT_TYPE` at runtime
- Narrows `RuntimeComponent` to `PositionComponent` in TypeScript
- Returns `false` for components with different types (e.g., `'health'`, `'Position'` with capital P, empty string)

### 5. Location

| File | Purpose |
|------|---------|
| `packages/shared/src/components/PositionComponent.ts` | New — interface, factory, type guard |
| `packages/shared/src/components/index.ts` | New — barrel exports |
| `packages/shared/src/index.ts` | Modified — added component exports |
| `packages/shared/src/tests/PositionComponent.test.ts` | New — tests |
| `docs/adr/ADR-0183-position-component-foundation.md` | New — this document |

### 6. Test Strategy

| Section | Tests | Coverage |
|---------|-------|----------|
| Construction | 5 | Origin, positive, type string, properties field, type constant |
| Type Guard | 5 | Valid component, different type, capitalized, empty, narrowing |
| Serialization | 6 | Origin, positive, round-trip (positive/negative/large/floating) |
| Immutability | 6 | Frozen root, frozen properties, type/properties reassignment throws, compile-time check |
| Deep Freeze | 5 | Origin, positive, negative, large, floating point — all deeply frozen |
| Determinism | 6 | Same inputs (origin/positive/negative/large/floating), different inputs |
| Negative Coordinates | 5 | Negative x, negative y, both, frozen, JSON round-trip |
| Large Coordinates | 6 | 500k x, 750k y, both 999k, negative large, JSON round-trip, frozen |
| Floating Point Values | 7 | Decimal x/y, pi/e, small decimals, negative float, JSON round-trip, frozen |
| Type Exports | 5 | PositionComponent type, POSITION_COMPONENT_TYPE, factory, type guard, RuntimeComponent compatibility |

**Total: 56 tests across 10 sections**

---

## Consequences

### Positive

1. **First standardized gameplay component** — establishes the pattern for all future components
2. **Type-safe narrowing** — `isPositionComponent()` enables TypeScript to narrow `RuntimeComponent` to a typed `PositionComponent`
3. **Discriminated union pattern** — the literal `'position'` type enables future `switch` / `if` narrowing across component types
4. **Immutable by default** — all instances are deeply frozen, preventing accidental mutation
5. **Deterministic and pure** — same inputs always produce identical output
6. **No breaking changes** — all existing types and code are unchanged

### Negative

1. **No movement logic** — intentionally excluded; systems will implement movement in future work orders
2. **No renderer integration** — intentionally excluded; Renderer will consume PositionComponent in a future work order
3. **No physics** — intentionally excluded; physics would add dependencies beyond this foundation
4. **Two-dimensional only** — no z-axis or 3D support (future work could add Z component or switch to a vector type)

### Neutral

1. **Foundation only** — no gameplay systems, no movement logic, no physics
2. **Pattern establishment** — future components (Health, AI, Inventory, etc.) will follow the same structure

---

## Verification

- TypeScript: 0 errors (`packages/shared`)
- ESLint: 0 errors
- All PositionComponent tests pass
- All existing tests continue to pass
- No Runtime changes
- No Projection changes
- No Renderer changes
- No PixiJS
- No Planner changes
- No PromptBuilder changes
- No ECS implementation
- No gameplay systems
- No movement logic
- No breaking changes to any Public API

---

## Files Created/Modified

| File | Action |
|------|--------|
| `packages/shared/src/components/PositionComponent.ts` | New — interface, factory, type guard |
| `packages/shared/src/components/index.ts` | New — barrel exports |
| `packages/shared/src/index.ts` | Modified — added component exports |
| `packages/shared/src/tests/PositionComponent.test.ts` | New — 56 tests across 10 sections |
| `docs/adr/ADR-0183-position-component-foundation.md` | New — this document |
| `docs/project/PROJECT_STATE.md` | Updated — v1.70, WO-S8-011 |
| `docs/project/CHANGELOG.md` | Updated — v1.70, WO-S8-011 |