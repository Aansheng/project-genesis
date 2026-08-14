# ADR-0202: Jump System Foundation

**Status:** Accepted  
**Date:** Sprint 9  
**Work Order:** WO-S9-014  
**Architecture Version:** v1.88 → v1.89

---

## Context

The Ground Collision Foundation (WO-S9-013) introduced ground-level clamping — entities stop falling at groundY. The current runtime pipeline provides movement (PlayerControllerSystem + MovementSystem), gravity (GravitySystem), and ground collision (GroundCollisionSystem). However, players have no way to counteract gravity. They fall and land, but cannot leave the ground.

Current pipeline:

```
Input
↓
PlayerControllerSystem
↓
MovementSystem
↓
GravitySystem
↓
GroundCollisionSystem
↓
Renderer
```

### Problems

1. **No upward movement** — players cannot jump or leave the ground
2. **No jump abstraction** — there is no JumpSystem interface or implementation
3. **No jump metadata** — system execution metadata lacks jump-specific information
4. **No jump integration** — the execution loop has no jump system in the pipeline

### Scope Boundaries

Foundation only.
- No physics engine
- No velocity
- No acceleration
- No double jump
- No animation
- No renderer changes
- No AI changes
- No camera
- No ECS

---

## Decision

### 1. Create `JumpSystem` Interface

```typescript
export interface JumpSystem extends RuntimeSystem {
  // RuntimeSystem contract: name, update(world)
}
```

A marker interface extending `RuntimeSystem` with no additional methods. Jump-specific metadata is provided via the `updateWithResult()` method on the implementation.

### 2. Create `JumpSystemResult` Type

```typescript
export interface JumpSystemResult {
  readonly jumpedPlayers: number
  readonly jumpHeight: number
}
```

Captures how many player entities jumped and the jump height applied. All fields are readonly, immutable, and JSON-serializable.

### 3. Create `DefaultJumpSystem`

```typescript
class DefaultJumpSystem implements JumpSystem {
  readonly name = 'JumpSystem'
  constructor(inputProvider: InputProvider, jumpHeight: number = 50)
  update(world: World): World
  updateWithResult(world: World): { world: World, result: JumpSystemResult }
}
```

**Behavior:**
- Accepts an `InputProvider` and optional `jumpHeight` (default: 50)
- On each tick, reads the current keyboard state via InputProvider
- If the Space key is pressed, all entities with `type === 'player'` AND a `PositionComponent` have their y decremented by jumpHeight
- Entities without type 'player' or without a PositionComponent are passed through unchanged
- Space not pressed → no-op (returns frozen copy of world)
- Uses `createPositionComponent()` to update the PositionComponent in the entity's `components` array
- Keeps legacy `entity.y` in sync with the PositionComponent

**Rules:**
- Pure: no side effects, no I/O, no external calls beyond `getState()`
- Stateless: no internal state between ticks (InputProvider is external state)
- Deterministic: same (world, inputState, jumpHeight) always produces same output
- Immutable: output World is deeply frozen; input is never mutated

### 4. Execution Order

JumpSystem must execute before GravitySystem so the upward impulse counteracts the downward force:

```
PlayerControllerSystem
↓
JumpSystem          ← New
↓
MovementSystem
↓
GravitySystem
↓
GroundCollisionSystem
```

### 5. File Layout

| File | Action |
|------|--------|
| `packages/runtime/src/systems/JumpSystem.ts` | New — interface |
| `packages/runtime/src/systems/JumpSystemResult.ts` | New — result type |
| `packages/runtime/src/systems/DefaultJumpSystem.ts` | New — implementation |
| `packages/runtime/src/systems/index.ts` | Updated — barrel exports |
| `packages/runtime/src/index.ts` | Updated — barrel exports |
| `packages/runtime/src/__tests__/JumpSystem.test.ts` | New — 80 tests |
| `packages/runtime/src/__tests__/JumpExecutionLoopIntegration.test.ts` | New — 23 tests |
| `docs/adr/ADR-0202-jump-system-foundation.md` | New — this document |
| `docs/project/PROJECT_STATE.md` | Updated — v1.89 |
| `docs/project/CHANGELOG.md` | Updated — v1.89 |

### 6. Test Strategy

**JumpSystem.test.ts** — 80 tests across 16 sections:

| Section | Tests | Coverage |
|---------|-------|----------|
| Construction | 7 | default/custom/zero/fractional/large jumpHeight, name, interface |
| Default jump height | 2 | default 50, move up by 50 |
| Custom jump height | 4 | custom 100, large 500, zero, fractional |
| Single player jump | 7 | upward, x preserved, id/type preserved, from ground/zero/negative |
| Multiple players | 3 | all moved, count preserved, order preserved |
| No player | 4 | non-player, other types, identity preserved, mixed world |
| No PositionComponent | 4 | no PositionComponent, null/empty/non-position components |
| Space not pressed | 4 | no keys, other keys, identity preserved, empty world |
| Repeated updates | 2 | each tick Space held, Space released |
| Result metadata | 8 | jumpedPlayers, jumpHeight, default height, 0 on no Space/non-player/no-pos/multiple/mixed |
| PositionComponent update | 3 | y updated, x preserved, non-position components preserved |
| update vs updateWithResult | 5 | same world, frozen world, frozen result, consistent |
| Immutability | 8 | no input mutation, frozen world/entities/entities/components/y, non-player unchanged |
| Frozen outputs | 3 | no jump frozen, on jump frozen, result frozen |
| Determinism | 6 | same output, multiple calls, multiple systems, custom height, order, updateWithResult |
| Empty world | 2 | empty array, frozen |
| Stress tests | 7 | 100 players, 1000 mixed, repeated jumping, 300 mixed, high y, low y |
| Stateless | 2 | call order, no accumulation |

**JumpExecutionLoopIntegration.test.ts** — 23 tests across 5 sections:

| Section | Tests | Coverage |
|---------|-------|----------|
| Jump → Gravity → Collision | 7 | jump up, fall back, land, stay landed, jump from above, gravity after jump, multiple players |
| Execution order | 3 | jump before gravity, commutative, collision after gravity |
| Multiple ticks and jumps | 3 | multiple jump cycles, Space release, non-player/unpositioned |
| Ground interaction | 4 | stop at ground, not below ground, never below groundY, different ground heights |
| Immutability and determinism | 5 | frozen world, no mutation, empty world, determinism, entity order |

---

## Consequences

### Positive

1. **Jump capability** — players can now leave the ground by pressing Space
2. **Configurable jump height** — constructor accepts any jumpHeight (default 50)
3. **No breaking changes** — new JumpSystem is additive; no existing code modified
4. **Integration tested** — jump → gravity → collision pipeline verified in execution loop
5. **Deterministic and immutable** — all outputs are deeply frozen

### Negative

1. **No double jump** — only one jump per Space press (no state tracking)
2. **No velocity** — jump is a single positional impulse, not velocity-based
3. **No physics engine** — jump is a simple y-offset, not a physical force

### Neutral

1. **Extensible** — future WOs can add double jump, variable jump height, jump animation
2. **Registry-ready** — JumpSystem follows the same pattern as PlayerControllerSystem
3. **Input-driven** — uses the same InputProvider abstraction as PlayerControllerSystem
4. **Execution order** — JumpSystem must run before GravitySystem (jump → gravity)

---

## Verification

- TypeScript: 0 errors (`packages/runtime`)
- ESLint: 0 errors
- JumpSystem tests: 80/80 passed
- JumpExecutionLoopIntegration tests: 23/23 passed
- All Runtime tests: 799/799 passed (17 files)
- No Renderer changes
- No AI changes
- No DSL changes
- No breaking changes to any Public API
- Architecture version v1.88 to v1.89

---

## Files Created/Modified

| File | Action |
|------|--------|
| `packages/runtime/src/systems/JumpSystem.ts` | New — interface |
| `packages/runtime/src/systems/JumpSystemResult.ts` | New — result type |
| `packages/runtime/src/systems/DefaultJumpSystem.ts` | New — implementation |
| `packages/runtime/src/systems/index.ts` | Updated — barrel exports |
| `packages/runtime/src/index.ts` | Updated — barrel exports |
| `packages/runtime/src/__tests__/JumpSystem.test.ts` | New — 80 tests |
| `packages/runtime/src/__tests__/JumpExecutionLoopIntegration.test.ts` | New — 23 tests |
| `docs/adr/ADR-0202-jump-system-foundation.md` | New — this document |
| `docs/project/PROJECT_STATE.md` | Updated — v1.89 |
| `docs/project/CHANGELOG.md` | Updated — v1.89 |