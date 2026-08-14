# ADR-0200: Gravity System Foundation

**Status:** Accepted  
**Date:** Sprint 9  
**Work Order:** WO-S9-012  
**Architecture Version:** v1.86 → v1.87

---

## Context

Player movement exists (WO-S9-009). The Mario playable slice (WO-S9-011) demonstrates a working game loop with arrow-key-driven player movement. However, entities never fall — there is no gravity simulation. Entities with PositionComponent remain at their initial y coordinate indefinitely.

Current pipeline:

```
World → ExecutionLoop
  ├─ PlayerControllerSystem (input-driven movement)
  ├─ MovementSystem (delta-based movement)
  ↓
RuntimeVisualizationLoop → Renderer
```

### Problems

1. **No downward force** — entities hover at their starting y position forever
2. **No gravity abstraction** — there is no GravitySystem interface or implementation
3. **No gravity metadata** — system execution metadata lacks gravity-specific information
4. **No gravity integration** — the execution loop has no gravity system to register

### Scope Boundaries

Foundation only.
- No collision
- No jumping
- No camera
- No renderer changes
- No AI changes
- No DSL changes
- No physics engine
- Constant velocity only (no acceleration)

---

## Decision

### 1. Create `GravitySystem` Interface

```typescript
export interface GravitySystem extends RuntimeSystem {
  // RuntimeSystem contract: name, update(world)
}
```

A marker interface extending `RuntimeSystem` with no additional methods. Gravity-specific metadata is provided via the `updateWithResult()` method on the implementation.

### 2. Create `GravitySystemResult` Type

```typescript
export interface GravitySystemResult {
  readonly affectedEntities: number
  readonly gravity: number
}
```

Captures how many entities were affected by gravity and the gravity value applied. All fields are readonly, immutable, and JSON-serializable.

### 3. Create `DefaultGravitySystem`

```typescript
class DefaultGravitySystem implements GravitySystem {
  readonly name = 'GravitySystem'
  constructor(gravity: number = 1)
  update(world: World): World
  updateWithResult(world: World): { world: World, result: GravitySystemResult }
}
```

**Behavior:**
- Accepts an optional `gravity` value (default: 1)
- On each tick, iterates over all entities in the world
- Entities with a `PositionComponent` have their y coordinate incremented by gravity
- Entities without a `PositionComponent` are passed through unchanged
- Uses `createPositionComponent()` to update the PositionComponent in the entity's `components` array
- Keeps legacy `entity.y` in sync with the PositionComponent

**Rules:**
- Pure: no side effects, no I/O, no external calls
- Stateless: no internal state between ticks
- Deterministic: same (world, gravity) always produces same output
- Immutable: output World is deeply frozen; input is never mutated

### 4. File Layout

| File | Action |
|------|--------|
| `packages/runtime/src/systems/GravitySystem.ts` | New — interface |
| `packages/runtime/src/systems/GravitySystemResult.ts` | New — result type |
| `packages/runtime/src/systems/DefaultGravitySystem.ts` | New — implementation |
| `packages/runtime/src/systems/index.ts` | Updated — barrel exports |
| `packages/runtime/src/index.ts` | Updated — barrel exports |
| `packages/runtime/src/__tests__/GravitySystem.test.ts` | New — 60 tests |
| `packages/runtime/src/__tests__/GravityExecutionLoopIntegration.test.ts` | New — 12 tests |
| `docs/adr/ADR-0200-gravity-system-foundation.md` | New — this document |
| `docs/project/PROJECT_STATE.md` | Updated — v1.87 |
| `docs/project/CHANGELOG.md` | Updated — v1.87 |

### 5. Test Strategy

**GravitySystem.test.ts** — 60 tests across 12 sections:

| Section | Tests | Coverage |
|---------|-------|----------|
| Construction | 7 | default/custom/zero/negative/fractional gravity, name, interface |
| Single entity | 9 | y movement, x unchanged, id/type preserved, fractional/negative/zero gravity, PositionComponent update |
| Multiple entities | 3 | all moved, count preserved, order preserved |
| No position | 3 | no effect, mixed world, identity preservation |
| Empty world | 2 | empty array, frozen |
| Gravity override | 4 | default 1, custom 10/100, zero |
| Immutability | 6 | no input mutation, frozen world/entities/entities/components |
| Determinism | 5 | same output, multiple calls, multiple systems, custom gravity, order |
| Large worlds | 3 | 100 entities, 1000 entities, mixed 1000 |
| updateWithResult | 9 | affectedEntities count, gravity value, empty world, no position, mixed world, frozen result, frozen world, y update |
| Multiple ticks | 3 | accumulation over 5/100 ticks, multiple entities |
| Edge cases | 5 | null/empty/undefined components, large gravity, negative y |

**GravityExecutionLoopIntegration.test.ts** — 12 tests across 3 sections:

| Section | Tests | Coverage |
|---------|-------|----------|
| Gravity in execution loop | 9 | single tick, multiple ticks, mixed entities, empty world, frozen output, determinism, order, no position, no mutation |
| Gravity + movement | 3 | sequence, stacking ticks, large entities |

---

## Consequences

### Positive

1. **Gravity simulation** — entities with PositionComponent fall downward every tick
2. **No breaking changes** — new GravitySystem is additive; no existing code modified
3. **Configurable gravity** — constructor accepts any gravity value (default 1)
4. **Deterministic and immutable** — all outputs are deeply frozen
5. **Integration tested** — gravity works within the execution loop alongside other systems

### Negative

1. **No acceleration** — gravity is a constant velocity, not a physical force
2. **No collision** — entities fall through the floor (no ground collision yet)
3. **No jumping** — gravity has no counter-force (follow-up WO)

### Neutral

1. **Extensible** — additional physics concepts (acceleration, collision, jumping) can be added as follow-on WOs
2. **Registry-ready** — GravitySystem follows the same pattern as MovementSystem and PlayerControllerSystem
3. **Execution loop compatible** — gravity works in any system order within the execution loop

---

## Verification

- TypeScript: 0 errors (`packages/runtime`)
- ESLint: 0 errors
- GravitySystem tests: 60/60 passed
- GravityExecutionLoopIntegration tests: 12/12 passed
- All Runtime tests: 591/591 passed (13 files)
- No Renderer changes
- No AI changes
- No DSL changes
- No breaking changes to any Public API
- Architecture version v1.86 to v1.87

---

## Files Created/Modified

| File | Action |
|------|--------|
| `packages/runtime/src/systems/GravitySystem.ts` | New — interface |
| `packages/runtime/src/systems/GravitySystemResult.ts` | New — result type |
| `packages/runtime/src/systems/DefaultGravitySystem.ts` | New — implementation |
| `packages/runtime/src/systems/index.ts` | Updated — barrel exports |
| `packages/runtime/src/index.ts` | Updated — barrel exports |
| `packages/runtime/src/__tests__/GravitySystem.test.ts` | New — 60 tests |
| `packages/runtime/src/__tests__/GravityExecutionLoopIntegration.test.ts` | New — 12 tests |
| `docs/adr/ADR-0200-gravity-system-foundation.md` | New — this document |
| `docs/project/PROJECT_STATE.md` | Updated — v1.87 |
| `docs/project/CHANGELOG.md` | Updated — v1.87 |