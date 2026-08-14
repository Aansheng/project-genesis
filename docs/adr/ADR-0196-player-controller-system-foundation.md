# ADR-0196: Player Controller System Foundation

**Status:** Accepted  
**Date:** Sprint 9  
**Work Order:** WO-S9-009  
**Architecture Version:** v1.82 → v1.83

---

## Context

WO-S9-008 introduced keyboard input tracking (`KeyboardInputProvider`, `InputState`), but keyboard state does not yet affect the world. No player controller exists, and no entity responds to keyboard input.

Current state:
- `KeyboardInputProvider` captures keydown/keyup events
- `InputState` provides immutable snapshots via `isPressed(key)`
- `MovementSystem` applies fixed-position offsets on each tick (no input awareness)
- No system reads `InputProvider` to drive entity behavior

Without a player controller:
- Keyboard input is tracked but has no effect
- Player entities cannot be controlled by the user
- Runtime systems have no mechanism to consume input state
- No foundation for input-driven gameplay

### Problem

1. **No input consumption** — `InputProvider` exists but nothing reads it
2. **No player detection** — no system identifies entities by `type === 'player'`
3. **No input-to-movement mapping** — arrow keys produce no world changes
4. **No component-level position updates** — PositionComponent is not updated from input
5. **No integration** — input state never reaches the execution loop

### Scope Boundaries

- No physics
- No collision
- No camera
- No jumping
- No gravity
- No animation
- No asset pipeline
- No renderer changes
- No DSL changes
- No prompt changes

---

## Decision

### 1. Create `PlayerControllerSystem` Interface

```typescript
export interface PlayerControllerSystem extends RuntimeSystem {}
```

A marker interface extending `RuntimeSystem`. No additional methods beyond `update(world): World`. Execution metadata is provided via `updateWithResult()` on the default implementation.

### 2. Create `PlayerControllerResult` Type

```typescript
export interface PlayerControllerResult {
  readonly movedPlayers: number
  readonly deltaX: number
  readonly deltaY: number
}
```

Captures how many player entities were moved and the net displacement. Immutable, serializable, framework-independent.

### 3. Create `DefaultPlayerControllerSystem`

```typescript
class DefaultPlayerControllerSystem implements PlayerControllerSystem {
  constructor(
    inputProvider: InputProvider,
    movementSpeed?: number  // default: 1
  )
  update(world: World): World
  updateWithResult(world: World): { world: World; result: PlayerControllerResult }
}
```

**Player detection**: Scans `world.entities` for entities where `entity.type === 'player'`. Non-player entities are passed through unchanged.

**Input mapping**:

| Key Pressed     | Effect        |
|-----------------|---------------|
| `ArrowLeft`     | `x -= speed`  |
| `ArrowRight`    | `x += speed`  |
| `ArrowUp`       | `y -= speed`  |
| `ArrowDown`     | `y += speed`  |

Multiple keys combine into diagonal movement (e.g., `ArrowRight + ArrowDown` → `(speed, speed)`). No keys pressed → zero delta → no entities moved.

**Component usage**:
- **Reads** `PositionComponent` from `entity.components`
- **Updates** `PositionComponent.properties.x/y` with new coordinates
- **Preserves** all other components (health, inventory, etc.)
- **Also updates** legacy `entity.x` / `entity.y` for backward compatibility

**Behavior**:
```
Player at Position(10, 5), ArrowRight pressed
  → Position(11, 5)

Player at Position(10, 5), ArrowRight + ArrowDown pressed
  → Position(11, 6)

Player at Position(10, 5), no key pressed
  → Position(10, 5)  (no movement)
```

### 4. Location

| File | Action |
|------|--------|
| `packages/runtime/src/systems/PlayerControllerSystem.ts` | New — interface |
| `packages/runtime/src/systems/PlayerControllerResult.ts` | New — result type |
| `packages/runtime/src/systems/DefaultPlayerControllerSystem.ts` | New — implementation |
| `packages/runtime/src/systems/index.ts` | Modified — added player controller exports |
| `packages/runtime/src/index.ts` | Modified — added player controller barrel exports |
| `packages/runtime/src/__tests__/PlayerControllerSystem.test.ts` | New — 36 unit tests |
| `packages/runtime/src/__tests__/PlayerControllerIntegration.test.ts` | New — 13 integration tests |
| `docs/adr/ADR-0196-player-controller-system-foundation.md` | New — this document |

### 5. Unit Test Strategy

**PlayerControllerSystem.test.ts** — 36 tests across 14 sections:

| Section | Tests | Coverage |
|---------|-------|----------|
| Construction | 3 | Default speed, custom speed, interface conformance |
| Left movement | 2 | x decreases, PositionComponent updated |
| Right movement | 2 | x increases, PositionComponent updated |
| Up movement | 2 | y decreases, PositionComponent updated |
| Down movement | 1 | y increases |
| Diagonal movement | 5 | All 4 diagonal combos, speed applied per axis |
| Multiple players | 2 | All move, diagonal with multiple |
| Non-player entities | 3 | Ignored, mixed world, same reference preserved |
| Missing PositionComponent | 1 | Player without PositionComponent ignored |
| Speed override | 3 | Custom int, fractional, negative direction |
| No key pressed | 2 | No movement, world unchanged |
| Immutability | 3 | Input world not mutated, output frozen, provider state preserved |
| Determinism | 2 | Same input, different systems |
| updateWithResult | 5 | movedPlayers, delta, multiple players, diagonal, frozen |

### 6. Integration Test Strategy

**PlayerControllerIntegration.test.ts** — 13 tests across 7 sections:

| Section | Tests | Coverage |
|---------|-------|----------|
| Single key single player | 4 | All 4 arrow keys |
| Diagonal movement | 2 | Two diagonal combos |
| No movement | 1 | No keys → no deltas |
| Multiple players | 1 | All move |
| Mixed entities | 1 | Only players move |
| PositionComponent updates | 2 | Both fields synced, other components preserved |
| updateWithResult metadata | 2 | movedPlayers, delta values |

---

## Consequences

### Positive

1. **Input-driven movement** — keyboard state directly affects player entity positions
2. **Player detection** — only entities with `type === 'player'` respond; all other types are ignored
3. **PositionComponent updates** — both legacy x/y fields and PositionComponent are kept in sync
4. **Component preservation** — all non-position components (health, inventory, etc.) are preserved
5. **Deterministic** — same (world, inputState, speed) always produces the same output
6. **Fully tested** — 49 new tests across unit and integration levels

### Negative

1. **Foundation only** — no physics, no collision, no camera follow, no animation
2. **Single speed per system** — all player entities move at the same speed
3. **No deceleration** — movement is instant (no acceleration curves)

### Neutral

1. **InputProvider dependency** — the system requires an external `InputProvider`; testing requires mocks
2. **Grid-based movement** — speed 1 produces pixel-perfect grid-aligned movement; fractional speeds are supported

---

## Verification

- TypeScript: 0 errors (`packages/runtime`)
- ESLint: 0 errors
- PlayerControllerSystem unit tests pass: 36
- PlayerControllerIntegration tests pass: 13
- Total runtime tests: 519
- No Physics
- No Collision
- No Camera
- No Jumping
- No Gravity
- No Animation
- No Asset Pipeline
- No Renderer Changes
- No DSL Changes
- No Prompt Changes
- No breaking changes to any Public API

---

## Files Created/Modified

| File | Action |
|------|--------|
| `packages/runtime/src/systems/PlayerControllerSystem.ts` | New — interface |
| `packages/runtime/src/systems/PlayerControllerResult.ts` | New — result type |
| `packages/runtime/src/systems/DefaultPlayerControllerSystem.ts` | New — implementation |
| `packages/runtime/src/systems/index.ts` | Modified — added exports |
| `packages/runtime/src/index.ts` | Modified — added barrel exports |
| `packages/runtime/src/__tests__/PlayerControllerSystem.test.ts` | New — 36 tests |
| `packages/runtime/src/__tests__/PlayerControllerIntegration.test.ts` | New — 13 tests |
| `docs/adr/ADR-0196-player-controller-system-foundation.md` | New — this document |
| `docs/project/PROJECT_STATE.md` | Updated — v1.83, WO-S9-009 |
| `docs/project/CHANGELOG.md` | Updated — v1.83, WO-S9-009 |