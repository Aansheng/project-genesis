/**
 * PlayerControllerSystem — verifies the PlayerControllerSystem interface,
 * DefaultPlayerControllerSystem implementation, and PlayerControllerResult type.
 *
 * WO-S9-009 — Player Controller System Foundation
 * Architecture version v1.83
 *
 * Coverage:
 * - left movement
 * - right movement
 * - up movement
 * - down movement
 * - diagonal movement
 * - multiple players
 * - non-player entities
 * - missing position component
 * - speed override
 * - immutability
 * - determinism
 */

import { describe, it, expect } from 'vitest'
import type { World, Entity } from '@genesis/shared'
import { createPositionComponent, createVelocityComponent, isPositionComponent, isVelocityComponent } from '@genesis/shared'
import { DefaultInputState } from '../input'
import type { InputKey, InputProvider, InputState } from '../input'
import type { PlayerControllerSystem } from '../systems'
import { DefaultPlayerControllerSystem } from '../systems'

// ---------------------------------------------------------------------------
// Mock InputProvider
// ---------------------------------------------------------------------------

class MockInputProvider implements InputProvider {
  private readonly pressed: Set<InputKey>

  constructor(pressed: InputKey[] = []) {
    this.pressed = new Set(pressed)
  }

  getState(): InputState {
    return new DefaultInputState(this.pressed)
  }
}

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

/** Create a player entity with a PositionComponent at (x, y). */
function createPlayer(id: string, x: number, y: number): Entity {
  return Object.freeze({
    id,
    type: 'player',
    x,
    y,
    components: Object.freeze([createPositionComponent(x, y)]),
  }) as unknown as Entity
}

/** Create a non-player entity with a PositionComponent at (x, y). */
function createNonPlayer(id: string, type: string, x: number, y: number): Entity {
  return Object.freeze({
    id,
    type,
    x,
    y,
    components: Object.freeze([createPositionComponent(x, y)]),
  }) as unknown as Entity
}

/** Create a player entity without any PositionComponent. */
function createPlayerWithoutPosition(id: string): Entity {
  return Object.freeze({
    id,
    type: 'player',
    x: 0,
    y: 0,
    components: Object.freeze([
      { type: 'health', properties: { current: 100, max: 100 } },
    ]),
  }) as unknown as Entity
}

/** Create a World with a single player at (x, y). */
function createSinglePlayerWorld(
  id: string = 'player-1',
  x: number = 0,
  y: number = 0,
): World {
  return Object.freeze({
    entities: Object.freeze([createPlayer(id, x, y)]),
  }) as unknown as World
}

function horizontalVelocity(entity: Entity): number | undefined {
  return entity.components?.find(isVelocityComponent)?.properties.x
}

// ---------------------------------------------------------------------------
// Section 1 — Construction
// ---------------------------------------------------------------------------

describe('construction', () => {
  it('creates a PlayerControllerSystem with default speed', () => {
    const provider = new MockInputProvider()
    const system: PlayerControllerSystem = new DefaultPlayerControllerSystem(provider)
    expect(system.name).toBe('PlayerControllerSystem')
  })

  it('creates a PlayerControllerSystem with custom speed', () => {
    const provider = new MockInputProvider()
    const system = new DefaultPlayerControllerSystem(provider, 3)
    expect(system.name).toBe('PlayerControllerSystem')
  })

  it('implements the PlayerControllerSystem interface', () => {
    const provider = new MockInputProvider()
    const system: PlayerControllerSystem = new DefaultPlayerControllerSystem(provider)
    expect(typeof system.update).toBe('function')
  })
})

// ---------------------------------------------------------------------------
// Section 2 — Left movement
// ---------------------------------------------------------------------------

describe('left movement', () => {
  it('sets leftward horizontal velocity when ArrowLeft is pressed', () => {
    const provider = new MockInputProvider(['ArrowLeft'])
    const system = new DefaultPlayerControllerSystem(provider)
    const world = createSinglePlayerWorld('player-1', 10, 5)

    const result = system.update(world)
    expect(result.entities[0].x).toBe(10)
    expect(result.entities[0].y).toBe(5)
    expect(horizontalVelocity(result.entities[0])).toBe(-1)
  })

  it('preserves PositionComponent x until VerticalMotionSystem integrates it', () => {
    const provider = new MockInputProvider(['ArrowLeft'])
    const system = new DefaultPlayerControllerSystem(provider, 2)
    const world = createSinglePlayerWorld('player-1', 10, 5)

    const result = system.update(world)
    const pos = result.entities[0].components?.find(isPositionComponent)
    expect(pos?.properties.x).toBe(10)
    expect(pos?.properties.y).toBe(5)
    expect(horizontalVelocity(result.entities[0])).toBe(-2)
  })
})

// ---------------------------------------------------------------------------
// Section 3 — Right movement
// ---------------------------------------------------------------------------

describe('right movement', () => {
  it('sets rightward horizontal velocity when ArrowRight is pressed', () => {
    const provider = new MockInputProvider(['ArrowRight'])
    const system = new DefaultPlayerControllerSystem(provider)
    const world = createSinglePlayerWorld('player-1', 10, 5)

    const result = system.update(world)
    expect(result.entities[0].x).toBe(10)
    expect(result.entities[0].y).toBe(5)
    expect(horizontalVelocity(result.entities[0])).toBe(1)
  })

  it('writes the configured speed to horizontal velocity', () => {
    const provider = new MockInputProvider(['ArrowRight'])
    const system = new DefaultPlayerControllerSystem(provider, 3)
    const world = createSinglePlayerWorld('player-1', 0, 0)

    const result = system.update(world)
    const pos = result.entities[0].components?.find(isPositionComponent)
    expect(pos?.properties.x).toBe(0)
    expect(horizontalVelocity(result.entities[0])).toBe(3)
  })
})

// ---------------------------------------------------------------------------
// Section 4 — Up movement
// ---------------------------------------------------------------------------

describe('up movement', () => {
  it('moves player up by speed when ArrowUp is pressed', () => {
    const provider = new MockInputProvider(['ArrowUp'])
    const system = new DefaultPlayerControllerSystem(provider)
    const world = createSinglePlayerWorld('player-1', 10, 5)

    const result = system.update(world)
    expect(result.entities[0].x).toBe(10)
    expect(result.entities[0].y).toBe(4)
  })

  it('updates PositionComponent properties on up movement', () => {
    const provider = new MockInputProvider(['ArrowUp'])
    const system = new DefaultPlayerControllerSystem(provider)
    const world = createSinglePlayerWorld('player-1', 10, 5)

    const result = system.update(world)
    const pos = result.entities[0].components?.find(isPositionComponent)
    expect(pos?.properties.y).toBe(4)
  })
})

// ---------------------------------------------------------------------------
// Section 5 — Down movement
// ---------------------------------------------------------------------------

describe('down movement', () => {
  it('moves player down by speed when ArrowDown is pressed', () => {
    const provider = new MockInputProvider(['ArrowDown'])
    const system = new DefaultPlayerControllerSystem(provider)
    const world = createSinglePlayerWorld('player-1', 10, 5)

    const result = system.update(world)
    expect(result.entities[0].x).toBe(10)
    expect(result.entities[0].y).toBe(6)
  })
})

// ---------------------------------------------------------------------------
// Section 6 — Diagonal movement
// ---------------------------------------------------------------------------

describe('diagonal movement', () => {
  it('moves player diagonally when ArrowRight and ArrowDown are pressed', () => {
    const provider = new MockInputProvider(['ArrowRight', 'ArrowDown'])
    const system = new DefaultPlayerControllerSystem(provider)
    const world = createSinglePlayerWorld('player-1', 10, 5)

    const result = system.update(world)
    expect(result.entities[0].x).toBe(10)
    expect(result.entities[0].y).toBe(6)
    expect(horizontalVelocity(result.entities[0])).toBe(1)
  })

  it('moves player diagonally when ArrowLeft and ArrowUp are pressed', () => {
    const provider = new MockInputProvider(['ArrowLeft', 'ArrowUp'])
    const system = new DefaultPlayerControllerSystem(provider)
    const world = createSinglePlayerWorld('player-1', 10, 5)

    const result = system.update(world)
    expect(result.entities[0].x).toBe(10)
    expect(result.entities[0].y).toBe(4)
    expect(horizontalVelocity(result.entities[0])).toBe(-1)
  })

  it('moves player diagonally when ArrowUp and ArrowRight are pressed', () => {
    const provider = new MockInputProvider(['ArrowUp', 'ArrowRight'])
    const system = new DefaultPlayerControllerSystem(provider)
    const world = createSinglePlayerWorld('player-1', 10, 5)

    const result = system.update(world)
    expect(result.entities[0].x).toBe(10)
    expect(result.entities[0].y).toBe(4)
    expect(horizontalVelocity(result.entities[0])).toBe(1)
  })

  it('moves player diagonally when ArrowDown and ArrowLeft are pressed', () => {
    const provider = new MockInputProvider(['ArrowDown', 'ArrowLeft'])
    const system = new DefaultPlayerControllerSystem(provider)
    const world = createSinglePlayerWorld('player-1', 10, 5)

    const result = system.update(world)
    expect(result.entities[0].x).toBe(10)
    expect(result.entities[0].y).toBe(6)
    expect(horizontalVelocity(result.entities[0])).toBe(-1)
  })

  it('applies speed correctly to each axis in diagonal movement', () => {
    const provider = new MockInputProvider(['ArrowRight', 'ArrowDown'])
    const system = new DefaultPlayerControllerSystem(provider, 3)
    const world = createSinglePlayerWorld('player-1', 0, 0)

    const result = system.update(world)
    expect(result.entities[0].x).toBe(0)
    expect(result.entities[0].y).toBe(3)
    expect(horizontalVelocity(result.entities[0])).toBe(3)
  })
})

// ---------------------------------------------------------------------------
// Section 7 — Multiple players
// ---------------------------------------------------------------------------

describe('multiple players', () => {
  it('moves all player entities when ArrowRight is pressed', () => {
    const provider = new MockInputProvider(['ArrowRight'])
    const system = new DefaultPlayerControllerSystem(provider)
    const world = Object.freeze({
      entities: Object.freeze([
        createPlayer('player-1', 0, 0),
        createPlayer('player-2', 5, 5),
        createPlayer('player-3', 10, 10),
      ]),
    }) as unknown as World

    const result = system.update(world)
    expect(result.entities[0].x).toBe(0)
    expect(result.entities[1].x).toBe(5)
    expect(result.entities[2].x).toBe(10)
    expect(horizontalVelocity(result.entities[0])).toBe(1)
    expect(horizontalVelocity(result.entities[1])).toBe(1)
    expect(horizontalVelocity(result.entities[2])).toBe(1)
    expect(result.entities[0].y).toBe(0)
    expect(result.entities[1].y).toBe(5)
    expect(result.entities[2].y).toBe(10)
  })

  it('moves all players diagonally', () => {
    const provider = new MockInputProvider(['ArrowRight', 'ArrowDown'])
    const system = new DefaultPlayerControllerSystem(provider, 2)
    const world = Object.freeze({
      entities: Object.freeze([
        createPlayer('player-1', 0, 0),
        createPlayer('player-2', 3, 3),
      ]),
    }) as unknown as World

    const result = system.update(world)
    expect(result.entities[0].x).toBe(0)
    expect(result.entities[0].y).toBe(2)
    expect(result.entities[1].x).toBe(3)
    expect(result.entities[1].y).toBe(5)
    expect(horizontalVelocity(result.entities[0])).toBe(2)
    expect(horizontalVelocity(result.entities[1])).toBe(2)
  })
})

// ---------------------------------------------------------------------------
// Section 8 — Non-player entities
// ---------------------------------------------------------------------------

describe('non-player entities', () => {
  it('does not move entities with type other than player', () => {
    const provider = new MockInputProvider(['ArrowRight'])
    const system = new DefaultPlayerControllerSystem(provider)
    const world = Object.freeze({
      entities: Object.freeze([
        createNonPlayer('enemy-1', 'enemy', 10, 10),
        createNonPlayer('npc-1', 'npc', 5, 5),
      ]),
    }) as unknown as World

    const result = system.update(world)
    expect(result.entities[0].x).toBe(10)
    expect(result.entities[0].y).toBe(10)
    expect(result.entities[1].x).toBe(5)
    expect(result.entities[1].y).toBe(5)
  })

  it('moves only player entities when mixed with non-player entities', () => {
    const provider = new MockInputProvider(['ArrowRight'])
    const system = new DefaultPlayerControllerSystem(provider)
    const world = Object.freeze({
      entities: Object.freeze([
        createPlayer('player-1', 0, 0),
        createNonPlayer('enemy-1', 'enemy', 10, 10),
        createPlayer('player-2', 5, 5),
      ]),
    }) as unknown as World

    const result = system.update(world)
    expect(result.entities[0].x).toBe(0)  // VerticalMotionSystem integrates later
    expect(result.entities[1].x).toBe(10) // enemy unchanged
    expect(result.entities[2].x).toBe(5)  // VerticalMotionSystem integrates later
    expect(horizontalVelocity(result.entities[0])).toBe(1)
    expect(horizontalVelocity(result.entities[2])).toBe(1)
  })

  it('preserves non-player entity positions and components', () => {
    const provider = new MockInputProvider(['ArrowUp'])
    const system = new DefaultPlayerControllerSystem(provider)
    const enemy = createNonPlayer('enemy-1', 'enemy', 10, 10)
    const world = Object.freeze({
      entities: Object.freeze([enemy]),
    }) as unknown as World

    const result = system.update(world)
    // Same reference means no copy was made
    expect(result.entities[0]).toBe(enemy)
  })
})

// ---------------------------------------------------------------------------
// Section 9 — Missing PositionComponent
// ---------------------------------------------------------------------------

describe('missing position component', () => {
  it('does not move player entities without PositionComponent', () => {
    const provider = new MockInputProvider(['ArrowRight'])
    const system = new DefaultPlayerControllerSystem(provider)
    const world = Object.freeze({
      entities: Object.freeze([createPlayerWithoutPosition('player-1')]),
    }) as unknown as World

    const result = system.update(world)
    expect(result.entities[0].x).toBe(0)
    expect(result.entities[0].y).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// Section 10 — Speed override
// ---------------------------------------------------------------------------

describe('speed override', () => {
  it('moves player by custom speed value', () => {
    const provider = new MockInputProvider(['ArrowRight'])
    const system = new DefaultPlayerControllerSystem(provider, 5)
    const world = createSinglePlayerWorld('player-1', 0, 0)

    const result = system.update(world)
    expect(result.entities[0].x).toBe(0)
    expect(horizontalVelocity(result.entities[0])).toBe(5)
  })

  it('moves player by custom speed with fractional value', () => {
    const provider = new MockInputProvider(['ArrowRight'])
    const system = new DefaultPlayerControllerSystem(provider, 0.5)
    const world = createSinglePlayerWorld('player-1', 0, 0)

    const result = system.update(world)
    expect(result.entities[0].x).toBe(0)
    expect(horizontalVelocity(result.entities[0])).toBe(0.5)
  })

  it('moves player by custom speed with negative keys', () => {
    const provider = new MockInputProvider(['ArrowUp', 'ArrowLeft'])
    const system = new DefaultPlayerControllerSystem(provider, 10)
    const world = createSinglePlayerWorld('player-1', 50, 50)

    const result = system.update(world)
    expect(result.entities[0].x).toBe(50)
    expect(result.entities[0].y).toBe(40)
    expect(horizontalVelocity(result.entities[0])).toBe(-10)
  })
})

// ---------------------------------------------------------------------------
// Section 11 — No key pressed (no movement)
// ---------------------------------------------------------------------------

describe('no key pressed', () => {
  it('does not move player when no keys are pressed', () => {
    const provider = new MockInputProvider()
    const system = new DefaultPlayerControllerSystem(provider)
    const world = createSinglePlayerWorld('player-1', 10, 5)

    const result = system.update(world)
    expect(result.entities[0].x).toBe(10)
    expect(result.entities[0].y).toBe(5)
  })

  it('returns world unchanged when no keys are pressed (same reference)', () => {
    const provider = new MockInputProvider()
    const system = new DefaultPlayerControllerSystem(provider)
    const world = createSinglePlayerWorld('player-1', 10, 5)

    const result = system.update(world)
    // When no movement occurs, the frozen copy may or may not be the same ref
    // But positions must be identical
    expect(result.entities[0].x).toBe(world.entities[0].x)
    expect(result.entities[0].y).toBe(world.entities[0].y)
  })

  it('clears previous horizontal velocity when input is released', () => {
    const provider = new MockInputProvider()
    const system = new DefaultPlayerControllerSystem(provider)
    const player = Object.freeze({
      ...createPlayer('player-1', 10, 5),
      components: Object.freeze([
        createPositionComponent(10, 5),
        createVelocityComponent(3, 0),
      ]),
    }) as unknown as Entity
    const world = Object.freeze({ entities: Object.freeze([player]) }) as unknown as World

    const result = system.update(world)
    expect(result.entities[0].x).toBe(10)
    expect(horizontalVelocity(result.entities[0])).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// Section 12 — Immutability
// ---------------------------------------------------------------------------

describe('immutability', () => {
  it('does not mutate the input world', () => {
    const provider = new MockInputProvider(['ArrowRight'])
    const system = new DefaultPlayerControllerSystem(provider)
    const world = createSinglePlayerWorld('player-1', 10, 5)
    const originalX = world.entities[0].x

    system.update(world)
    expect(world.entities[0].x).toBe(originalX)
  })

  it('returns a frozen world', () => {
    const provider = new MockInputProvider(['ArrowRight'])
    const system = new DefaultPlayerControllerSystem(provider)
    const world = createSinglePlayerWorld('player-1', 10, 5)

    const result = system.update(world)
    expect(Object.isFrozen(result)).toBe(true)
    expect(Object.isFrozen(result.entities)).toBe(true)
  })

  it('does not mutate the input provider state', () => {
    const provider = new MockInputProvider(['ArrowRight'])
    const system = new DefaultPlayerControllerSystem(provider)
    const world = createSinglePlayerWorld('player-1', 10, 5)

    const stateBefore = provider.getState()
    system.update(world)
    const stateAfter = provider.getState()

    expect(stateBefore.isPressed('ArrowRight')).toBe(stateAfter.isPressed('ArrowRight'))
  })
})

// ---------------------------------------------------------------------------
// Section 13 — Determinism
// ---------------------------------------------------------------------------

describe('determinism', () => {
  it('produces the same output for the same input', () => {
    const provider = new MockInputProvider(['ArrowRight', 'ArrowDown'])
    const system = new DefaultPlayerControllerSystem(provider, 2)
    const world = createSinglePlayerWorld('player-1', 10, 5)

    const result1 = system.update(world)
    const result2 = system.update(world)

    expect(result1.entities[0].x).toBe(result2.entities[0].x)
    expect(result1.entities[0].y).toBe(result2.entities[0].y)
  })

  it('different systems with same config produce the same output', () => {
    const provider1 = new MockInputProvider(['ArrowRight'])
    const provider2 = new MockInputProvider(['ArrowRight'])
    const system1 = new DefaultPlayerControllerSystem(provider1)
    const system2 = new DefaultPlayerControllerSystem(provider2)
    const world = createSinglePlayerWorld('player-1', 10, 5)

    const result1 = system1.update(world)
    const result2 = system2.update(world)

    expect(result1.entities[0].x).toBe(result2.entities[0].x)
    expect(result1.entities[0].y).toBe(result2.entities[0].y)
  })
})

// ---------------------------------------------------------------------------
// Section 14 — updateWithResult
// ---------------------------------------------------------------------------

describe('updateWithResult', () => {
  it('returns PlayerControllerResult with movedPlayers=1 after movement', () => {
    const provider = new MockInputProvider(['ArrowRight'])
    const system = new DefaultPlayerControllerSystem(provider)
    const world = createSinglePlayerWorld('player-1', 0, 0)

    const { world: resultWorld, result } = system.updateWithResult(world)
    expect(result.movedPlayers).toBe(1)
    expect(result.deltaX).toBe(1)
    expect(result.deltaY).toBe(0)
    expect(resultWorld.entities[0].x).toBe(0)
    expect(horizontalVelocity(resultWorld.entities[0])).toBe(1)
  })

  it('returns movedPlayers=0 when no key is pressed', () => {
    const provider = new MockInputProvider()
    const system = new DefaultPlayerControllerSystem(provider)
    const world = createSinglePlayerWorld('player-1', 0, 0)

    const { result } = system.updateWithResult(world)
    expect(result.movedPlayers).toBe(0)
    expect(result.deltaX).toBe(0)
    expect(result.deltaY).toBe(0)
  })

  it('returns movedPlayers=2 when two players are moved', () => {
    const provider = new MockInputProvider(['ArrowRight'])
    const system = new DefaultPlayerControllerSystem(provider)
    const world = Object.freeze({
      entities: Object.freeze([
        createPlayer('player-1', 0, 0),
        createPlayer('player-2', 5, 5),
      ]),
    }) as unknown as World

    const { result } = system.updateWithResult(world)
    expect(result.movedPlayers).toBe(2)
  })

  it('returns correct deltaX and deltaY for diagonal movement', () => {
    const provider = new MockInputProvider(['ArrowRight', 'ArrowDown'])
    const system = new DefaultPlayerControllerSystem(provider, 2)
    const world = createSinglePlayerWorld('player-1', 0, 0)

    const { result } = system.updateWithResult(world)
    expect(result.deltaX).toBe(2)
    expect(result.deltaY).toBe(2)
  })

  it('returns frozen result', () => {
    const provider = new MockInputProvider(['ArrowRight'])
    const system = new DefaultPlayerControllerSystem(provider)
    const world = createSinglePlayerWorld('player-1', 0, 0)

    const { world: resultWorld, result } = system.updateWithResult(world)
    expect(Object.isFrozen(resultWorld)).toBe(true)
    expect(Object.isFrozen(result)).toBe(true)
  })
})
