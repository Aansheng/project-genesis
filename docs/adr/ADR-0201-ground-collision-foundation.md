# ADR-0201: Ground Collision Foundation

**Status:** Accepted  
**Date:** Sprint 9  
**Work Order:** WO-S9-013  
**Architecture Version:** v1.87 → v1.88

---

## Context

The Gravity System Foundation (WO-S9-012) introduced a constant downward force on all entities with a PositionComponent. Entities now fall every tick. However, there is no ground — entities fall forever. The y coordinate increases without bound, and entities eventually move off-screen.

Current pipeline:

```
World → ExecutionLoop
  ├─ PlayerControllerSystem (input-driven movement)
  ├─ MovementSystem (delta-based movement)
  ├─ GravitySystem (downward force)
  ↓
RuntimeVisualizationLoop → Renderer
```

### Problems

1. **No ground constraint** — entities with PositionComponent fall indefinitely
2. **No collision abstraction** — there is no GroundCollisionSystem interface or implementation
3. **No collision metadata** — system execution metadata lacks ground collision-specific information
4. **No gravity + collision integration** — the execution loop has no collision system to register after gravity

### Scope Boundaries

Foundation only.
- No jumping
- No velocity
- No physics engine
- No rigid bodies
- No collision shapes
- No AABB intersection
- No renderer changes
- No AI changes
- No DSL changes
- No camera
- No ECS
- No runtime refactor

---

## Decision

### 1. Create `GroundCollisionSystem` Interface

```typescript
export interface GroundCollisionSystem extends RuntimeSystem {
  // RuntimeSystem contract: name, update(world)
}
```

A marker interface extending `RuntimeSystem` with no additional methods. Ground-collision-specific metadata is provided via the `updateWithResult()` method on the implementation.

### 2. Create `GroundCollisionSystemResult` Type

```typescript
export interface GroundCollisionSystemResult {
  readonly groundedEntities: number
  readonly groundY: number
}
```

Captures how many entities were clamped to ground level and the groundY threshold applied. All fields are readonly, immutable, and JSON-serializable.

### 3. Create `DefaultGroundCollisionSystem`

```typescript
class DefaultGroundCollisionSystem implements GroundCollisionSystem {
  readonly name = 'GroundCollisionSystem'
  constructor(groundY: number = 400)
  update(world: World): World
  updateWithResult(world: World): { world: World, result: GroundCollisionSystemResult }
}
```

**Behavior:**
- Accepts an optional `groundY` value (default: 400)
- On each tick, iterates over all entities in the world
- Entities with a `PositionComponent` where `y > groundY` have their y clamped to `groundY`
- Entities with `y <= groundY` (above or at ground) are passed through unchanged
- Entities without a `PositionComponent` are passed through unchanged
- Uses `createPositionComponent()` to update the PositionComponent in the entity's `components` array
- Keeps legacy `entity.y` in sync with the PositionComponent

**Rules:**
- Pure: no side effects, no I/O, no external calls
- Stateless: no internal state between ticks
- Deterministic: same (world, groundY) always produces same output
- Immutable: output World is deeply frozen; input is never mutated
- Only positional clamping: no velocity, no rigid bodies, no collision shapes

### 4. File Layout

| File | Action |
|------|--------|
| `packages/runtime/src/systems/GroundCollisionSystem.ts` | New — interface |
| `packages/runtime/src/systems/GroundCollisionSystemResult.ts` | New — result type |
| `packages/runtime/src/systems/DefaultGroundCollisionSystem.ts` | New — implementation |
| `packages/runtime/src/systems/index.ts` | Updated — barrel exports |
| `packages/runtime/src/index.ts` | Updated — barrel exports |
| `packages/runtime/src/__tests__/GroundCollisionSystem.test.ts` | New — 70+ tests |
| `packages/runtime/src/__tests__/GroundCollisionExecutionLoopIntegration.test.ts` | New — 18 tests |
| `docs/adr/ADR-0201-ground-collision-foundation.md` | New — this document |
| `docs/project/PROJECT_STATE.md` | Updated — v1.88 |
| `docs/project/CHANGELOG.md` | Updated — v1.88 |

### 5. Test Strategy

**GroundCollisionSystem.test.ts** — 70+ tests across 16 sections:

| Section | Tests | Coverage |
|---------|-------|----------|
| Construction | 7 | default/custom/zero/negative/fractional groundY, name, interface |
| Default groundY | 3 | default 400, above, exactly at |
| Custom groundY | 5 | custom 100, above, low, zero, large |
| Clamp behavior | 6 | just below, far below, large distance, x preserved, id/type preserved |
| No clamp behavior | 4 | well above, near ground, negative y, identity preservation |
| Multiple entities | 5 | all below, count preserved, order, mixed, various depths |
| Mixed entities | 3 | with/without PositionComponent, identity preservation, mixed all cases |
| Missing PositionComponent | 4 | null components, empty, undefined, non-position only |
| Empty world | 2 | empty array, frozen |
| PositionComponent update | 3 | y updated, x preserved, non-position components preserved |
| Result metadata | 8 | groundedEntities, groundY, empty, no pos, above ground, at ground, multiple, mixed |
| update() | 3 | clamp, no clamp, frozen |
| updateWithResult() | 5 | frozen result, frozen world, y clamp, default groundY, consistent |
| Immutability | 7 | no input mutation, frozen world/entities/entities/components/y/compoennt |
| Deep freeze | 4 | result, primitives, entities |
| Determinism | 6 | same output, multiple calls, multiple systems, custom groundY, order, updateWithResult |
| Large worlds | 3 | 100 entities, 1000 entities, mixed 1000 |
| Stress cases | 8 | epsilon below/above, MAX_SAFE_INTEGER, Infinity, -Infinity, large no pos, repeated ticks |
| Stateless | 2 | call order independence, no accumulation |

**GroundCollisionExecutionLoopIntegration.test.ts** — 18 tests across 4 sections:

| Section | Tests | Coverage |
|---------|-------|----------|
| Gravity + collision loop | 9 | single tick gravity→clamp, fall then stop, repeated ticks, below ground start, multiple entities, converging entities, different groundY, zero groundY, large groundY |
| Execution order verification | 3 | collision before gravity (no-op), correct gravity→collision, no position entities |
| Immutability in integration | 5 | frozen world, no mutation, empty world, determinism, entity order |

---

## Consequences

### Positive

1. **Ground constraint** — entities with PositionComponent can no longer fall below ground level
2. **No breaking changes** — new GroundCollisionSystem is additive; no existing code modified
3. **Configurable groundY** — constructor accepts any groundY value (default 400)
4. **Deterministic and immutable** — all outputs are deeply frozen
5. **Integration tested** — gravity + collision pipeline verified in execution loop

### Negative

1. **No jumping** — entities cannot leave the ground (no upward force)
2. **No velocity** — collision is purely positional; no velocity-based response
3. **No physics engine** — this is a simple clamp, not a physics simulation

### Neutral

1. **Extensible** — future WOs can add jumping, velocity, platforms, and collision shapes
2. **Registry-ready** — GroundCollisionSystem follows the same pattern as GravitySystem and MovementSystem
3. **Correct execution order** — collision must execute after gravity to catch fallen entities
4. **Foundation for platforming** — ground collision is the first gameplay constraint; platforms and obstacles follow

---

## Verification

- TypeScript: 0 errors (`packages/runtime`)
- ESLint: 0 errors
- GroundCollisionSystem tests: 70/70+ passed
- GroundCollisionExecutionLoopIntegration tests: 18/18 passed
- All Runtime tests pass
- No Renderer changes
- No AI changes
- No DSL changes
- No breaking changes to any Public API
- Architecture version v1.87 to v1.88

---

## Files Created/Modified

| File | Action |
|------|--------|
| `packages/runtime/src/systems/GroundCollisionSystem.ts` | New — interface |
| `packages/runtime/src/systems/GroundCollisionSystemResult.ts` | New — result type |
| `packages/runtime/src/systems/DefaultGroundCollisionSystem.ts` | New — implementation |
| `packages/runtime/src/systems/index.ts` | Updated — barrel exports |
| `packages/runtime/src/index.ts` | Updated — barrel exports |
| `packages/runtime/src/__tests__/GroundCollisionSystem.test.ts` | New — 70+ tests |
| `packages/runtime/src/__tests__/GroundCollisionExecutionLoopIntegration.test.ts` | New — 18 tests |
| `docs/adr/ADR-0201-ground-collision-foundation.md` | New — this document |
| `docs/project/PROJECT_STATE.md` | Updated — v1.88 |
| `docs/project/CHANGELOG.md` | Updated — v1.88 |