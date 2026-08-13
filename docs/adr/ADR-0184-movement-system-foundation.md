# ADR-0184: Movement System Foundation

**Status:** Accepted  
**Date:** Sprint 8  
**Work Order:** WO-S8-012  
**Architecture Version:** v1.70 → v1.71

---

## Context

WO-S8-011 introduced the PositionComponent — the first standardized gameplay component. WO-S8-008 introduced the RuntimeSystem interface, WO-S8-009 introduced the RuntimeExecutionLoop, and WO-S8-010 introduced the WorldMutator. However, there is no **gameplay system** that actually updates component state across ticks.

Current architecture:

```
World
↓
Entity
↓
PositionComponent
↓
RuntimeSystem (generic interface only)
↓
RuntimeExecutionLoop
↓
WorldMutator
```

Systems exist as interfaces and NoOp implementations, but no concrete gameplay behavior exists. Without a MovementSystem:

- PositionComponent values remain static forever
- No pattern exists for iterating over entities and updating typed components
- No pattern exists for selective entity processing (only entities with a specific component)
- The execution loop has no gameplay behavior to execute

### Problem

1. **No gameplay behavior** — existing systems are NoOp only; the loop has nothing to do
2. **No pattern for component-based entity selection** — systems need to process only entities with specific components
3. **No movement behavior** — PositionComponent exists but position values never change
4. **No integration test for the full pipeline** — RuntimeSystem → ExecutionLoop → World evolution is untested end-to-end

### Scope Boundaries

- Foundation only — no Renderer, no Physics, no Collision, no Input, no AI
- No Planner changes
- No PromptBuilder changes
- No Domain Model changes
- No DSL changes
- No Projection changes
- No PixiJS
- No ECS framework
- No breaking changes

---

## Decision

### 1. Create `MovementSystem` Interface

```typescript
export interface MovementSystem extends RuntimeSystem {}
```

A marker interface that extends `RuntimeSystem` with no additional methods. The base `update(world): World` contract is sufficient for movement.

### 2. Create `MovementSystemResult` Type

```typescript
export interface MovementSystemResult {
  readonly movedEntities: number
  readonly deltaX: number
  readonly deltaY: number
}
```

Metadata type capturing what happened during a movement tick. Used by `DefaultMovementSystem.updateWithResult()`.

### 3. Create `DefaultMovementSystem` Implementation

```typescript
export class DefaultMovementSystem implements MovementSystem {
  constructor(deltaX: number, deltaY: number) { ... }
  update(world: World): World { ... }
  updateWithResult(world: World): { world: World, result: MovementSystemResult } { ... }
}
```

| Property | Behavior |
|----------|----------|
| Name | `'MovementSystem'` |
| Constructor | Accepts `(deltaX: number, deltaY: number)` — the per-tick offset |
| `update(world)` | Iterates entities, applies delta to those with PositionComponent, returns frozen World |
| `updateWithResult(world)` | Same as `update` but also returns `MovementSystemResult` metadata |

**Entity selection logic:**
1. For each entity, check if `components[]` contains a `RuntimeComponent` with `type === 'position'`
2. Use `isPositionComponent()` type guard from `@genesis/shared`
3. If found: create a new frozen Entity with `x += deltaX`, `y += deltaY`
4. If not found: pass the entity through unchanged

**Edge case rules:**

| Scenario | Behavior |
|----------|----------|
| Entity with PositionComponent | x += deltaX, y += deltaY |
| Entity without PositionComponent | Pass through unchanged |
| Entity with undefined components | Pass through unchanged |
| Entity with empty components array | Pass through unchanged |
| Entity with non-position components | Pass through unchanged |
| Empty world | Returns frozen copy with empty entities |
| Zero delta (0, 0) | Returns world unchanged (no entity changes) |

### 4. Location

| File | Purpose |
|------|---------|
| `packages/runtime/src/systems/MovementSystem.ts` | New — interface |
| `packages/runtime/src/systems/MovementSystemResult.ts` | New — result type |
| `packages/runtime/src/systems/DefaultMovementSystem.ts` | New — implementation |
| `packages/runtime/src/systems/index.ts` | New — barrel exports |
| `packages/runtime/src/index.ts` | Modified — added systems exports |
| `packages/runtime/src/__tests__/MovementSystem.test.ts` | New — 58 tests |
| `packages/runtime/src/__tests__/MovementExecutionLoopIntegration.test.ts` | New — 16 integration tests |
| `docs/adr/ADR-0184-movement-system-foundation.md` | New — this document |

### 5. Unit Test Strategy

`MovementSystem.test.ts` — 58 tests across 13 sections:

| Section | Tests | Coverage |
|---------|-------|----------|
| Construction | 6 | Instance creation, interface, name, deltaX/Y, updateWithResult |
| Single Entity | 5 | (1,0), (0,1), (3,7), id/type preservation, component preservation |
| Multiple Entities | 3 | All moved, order preserved, count preserved |
| Entity Without Position | 5 | Non-position entity, mixed world, moved count, empty components, undefined components |
| Negative Movement | 4 | (-1,0), (0,-1), (-5,-10), negative delta in result |
| Fractional Movement | 4 | (0.5,0.5), (1.5,2.25), (-0.1,0.2), fractional delta in result |
| Large Worlds | 4 | 100 entities, 1000 entities, 100 positioned, moved count in 100 |
| Immutability | 7 | Frozen world/entities/entity/result, no input mutation, nested readonly, empty world freeze |
| Determinism | 5 | Same input, different instances, mixed world, empty world, different deltas |
| Multiple Ticks | 4 | 2/5/10 ticks accumulation, id/type preservation |
| Execution Loop Integration | 4 | Tick moves entity, non-position preserved, tickWithResult |
| World Mutation Integration | 3 | Add → move, remove → not move, replace → move |
| Empty World | 4 | No entities, zero moved, no-op across ticks, frozen |

### 6. Integration Test Strategy

`MovementExecutionLoopIntegration.test.ts` — 16 tests across 7 sections:

| Section | Tests | Coverage |
|---------|-------|----------|
| Single Entity Across Ticks | 4 | t0→t1, t0→t1→t2, 3 ticks accumulation, id/type preservation |
| Multiple Entities Across Ticks | 3 | Two entities, count preservation, order preservation |
| Mixed Entity Types Across Ticks | 2 | Positioned moves, non-positioned stays; many ticks on static |
| Negative/Fractional Across Ticks | 2 | Negative accumulates backward, fractional accumulates |
| Empty and Large Worlds | 2 | Empty stays empty, 100 entities all move correctly |
| Immutability Across Ticks | 2 | Each tick output frozen, t0 never mutated |
| Determinism Across Ticks | 1 | Identical pipelines produce identical sequences |

### 7. Data Flow

```
World(t0)
  ↓
MovementSystem.update(t0)
  ├── For each entity:
  │   ├── Has PositionComponent? → x += deltaX, y += deltaY
  │   └── No PositionComponent? → pass through
  └── Return frozen World(t1)

World(t1)
  ↓
MovementSystem.update(t1)
  ├── Same logic applied again
  └── Return frozen World(t2)

...continues across ticks...
```

---

## Consequences

### Positive

1. **First gameplay system** — establishes the pattern for all future gameplay systems (iterating entities, checking components, applying logic)
2. **Component-based entity selection** — demonstrates how to select entities by component type using `isPositionComponent()`
3. **Full pipeline integration tested** — RuntimeSystem → ExecutionLoop → World evolution is verified end-to-end
4. **No breaking changes** — all existing types and code are unchanged
5. **Backward compatible** — NoOp systems and existing tests continue to work

### Negative

1. **No physics** — movement is simple (delta offset), no velocity, acceleration, or collision
2. **No renderer integration** — position changes are not rendered (future work order)
3. **Linear scan on every tick** — all entities are checked each tick (optimization not needed at this scale)
4. **Fixed delta per tick** — deltaX/deltaY is set at construction and cannot change (future work could add variable velocity)

### Neutral

1. **Foundation only** — no physics, no collision, no input, no AI
2. **Pattern establishment** — future systems (HealthSystem, AISystem, etc.) will follow the same structure

---

## Verification

- TypeScript: 0 errors (`packages/runtime`, `packages/shared`)
- ESLint: 0 errors
- All MovementSystem tests pass (58)
- All MovementExecutionLoopIntegration tests pass (16)
- All existing tests continue to pass (380 → 454 total)
- No Renderer changes
- No PixiJS
- No Planner changes
- No PromptBuilder changes
- No Domain Model changes
- No DSL changes
- No Projection changes
- No Physics
- No Collision
- No Input
- No AI
- No breaking changes to any Public API

---

## Files Created/Modified

| File | Action |
|------|--------|
| `packages/runtime/src/systems/MovementSystem.ts` | New — interface |
| `packages/runtime/src/systems/MovementSystemResult.ts` | New — result type |
| `packages/runtime/src/systems/DefaultMovementSystem.ts` | New — implementation |
| `packages/runtime/src/systems/index.ts` | New — barrel exports |
| `packages/runtime/src/index.ts` | Modified — added systems exports |
| `packages/runtime/src/__tests__/MovementSystem.test.ts` | New — 58 tests across 13 sections |
| `packages/runtime/src/__tests__/MovementExecutionLoopIntegration.test.ts` | New — 16 tests across 7 sections |
| `docs/adr/ADR-0184-movement-system-foundation.md` | New — this document |
| `docs/project/PROJECT_STATE.md` | Updated — v1.71, WO-S8-012 |
| `docs/project/CHANGELOG.md` | Updated — v1.71, WO-S8-012 |