/**
 * JumpSystem.test.ts — comprehensive test suite for DefaultJumpSystem.
 *
 * Target: 70+ tests
 * Coverage: construction, default jump height, custom jump height,
 *           single player jump, multiple players, no player,
 *           no PositionComponent, Space pressed, Space not pressed,
 *           repeated updates, metadata, determinism, immutability,
 *           frozen outputs, stress tests
 */
import { describe, it, expect } from 'vitest'
import type { World, Entity } from '@genesis/shared'
import { createPositionComponent } from '@genesis/shared'
import { DefaultInputState } from '../input'
import type { InputKey, InputProvider, InputState } from '../input'
import { DefaultJumpSystem } from '../systems'

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

/** Create an entity without a PositionComponent. */
function createEntityWithoutPosition(id: string, entityType: string = 'player'): Entity {
  return Object.freeze({
    id,
    type: entityType,
    x: 0,
    y: 0,
  }) as unknown as Entity
}

/** Create a minimal world from an array of entities. */
function createWorld(entities: readonly Entity[]): World {
  return Object.freeze({
    entities: Object.freeze([...entities]),
  }) as unknown as World
}

/** Create a jump system with Space pressed. */
function jumpSystemWithSpace(jumpHeight?: number): DefaultJumpSystem {
  return new DefaultJumpSystem(
    new MockInputProvider(['Space']),
    jumpHeight,
  )
}

/** Create a jump system with no keys pressed. */
function jumpSystemWithoutSpace(): DefaultJumpSystem {
  return new DefaultJumpSystem(new MockInputProvider([]))
}

// ---------------------------------------------------------------------------
// Construction
// ---------------------------------------------------------------------------

describe('construction', () => {
  it('should create a DefaultJumpSystem with default jump height', () => {
    const system = new DefaultJumpSystem(new MockInputProvider(['Space']))
    expect(system).toBeInstanceOf(DefaultJumpSystem)
  })

  it('should have name "JumpSystem"', () => {
    const system = new DefaultJumpSystem(new MockInputProvider(['Space']))
    expect(system.name).toBe('JumpSystem')
  })

  it('should implement JumpSystem interface', () => {
    const system = new DefaultJumpSystem(new MockInputProvider(['Space']))
    expect(typeof system.update).toBe('function')
    expect(typeof system.updateWithResult).toBe('function')
  })

  it('should accept custom jump height', () => {
    const system = new DefaultJumpSystem(new MockInputProvider(['Space']), 100)
    expect(system).toBeInstanceOf(DefaultJumpSystem)
  })

  it('should accept zero jump height', () => {
    const system = new DefaultJumpSystem(new MockInputProvider(['Space']), 0)
    expect(system).toBeInstanceOf(DefaultJumpSystem)
  })

  it('should accept fractional jump height', () => {
    const system = new DefaultJumpSystem(new MockInputProvider(['Space']), 10.5)
    expect(system).toBeInstanceOf(DefaultJumpSystem)
  })

  it('should accept large jump height', () => {
    const system = new DefaultJumpSystem(new MockInputProvider(['Space']), 10000)
    expect(system).toBeInstanceOf(DefaultJumpSystem)
  })
})

// ---------------------------------------------------------------------------
// Default jump height
// ---------------------------------------------------------------------------

describe('default jump height', () => {
  it('should use default jump height of 50', () => {
    const system = jumpSystemWithSpace()
    const world = createWorld([createPlayer('player', 0, 200)])
    const result = system.update(world)
    expect(result.entities[0].y).toBe(150)
  })

  it('should move player up by 50 pixels with default height', () => {
    const system = jumpSystemWithSpace()
    const world = createWorld([createPlayer('player', 10, 300)])
    const result = system.update(world)
    expect(result.entities[0].y).toBe(250)
  })
})

// ---------------------------------------------------------------------------
// Custom jump height
// ---------------------------------------------------------------------------

describe('custom jump height', () => {
  it('should use custom jump height', () => {
    const system = jumpSystemWithSpace(100)
    const world = createWorld([createPlayer('player', 0, 200)])
    const result = system.update(world)
    expect(result.entities[0].y).toBe(100)
  })

  it('should use large jump height', () => {
    const system = jumpSystemWithSpace(500)
    const world = createWorld([createPlayer('player', 0, 200)])
    const result = system.update(world)
    expect(result.entities[0].y).toBe(-300)
  })

  it('should use zero jump height (no movement)', () => {
    const system = jumpSystemWithSpace(0)
    const world = createWorld([createPlayer('player', 0, 200)])
    const result = system.update(world)
    expect(result.entities[0].y).toBe(200)
  })

  it('should use fractional jump height', () => {
    const system = jumpSystemWithSpace(2.5)
    const world = createWorld([createPlayer('player', 0, 100)])
    const result = system.update(world)
    expect(result.entities[0].y).toBe(97.5)
  })
})

// ---------------------------------------------------------------------------
// Single player jump
// ---------------------------------------------------------------------------

describe('single player jump', () => {
  it('should move player upward when Space is pressed', () => {
    const system = jumpSystemWithSpace()
    const world = createWorld([createPlayer('player', 10, 200)])
    const result = system.update(world)
    expect(result.entities[0].y).toBe(150)
  })

  it('should preserve x coordinate on jump', () => {
    const system = jumpSystemWithSpace()
    const world = createWorld([createPlayer('player', 50, 200)])
    const result = system.update(world)
    expect(result.entities[0].x).toBe(50)
  })

  it('should preserve entity id', () => {
    const system = jumpSystemWithSpace()
    const world = createWorld([createPlayer('mario', 0, 200)])
    const result = system.update(world)
    expect(result.entities[0].id).toBe('mario')
  })

  it('should preserve entity type', () => {
    const system = jumpSystemWithSpace()
    const world = createWorld([createPlayer('mario', 0, 200)])
    const result = system.update(world)
    expect(result.entities[0].type).toBe('player')
  })

  it('should jump from ground level', () => {
    const system = jumpSystemWithSpace(50)
    const world = createWorld([createPlayer('player', 0, 400)])
    const result = system.update(world)
    expect(result.entities[0].y).toBe(350)
  })

  it('should jump from zero y', () => {
    const system = jumpSystemWithSpace()
    const world = createWorld([createPlayer('player', 0, 0)])
    const result = system.update(world)
    expect(result.entities[0].y).toBe(-50)
  })

  it('should jump from negative y', () => {
    const system = jumpSystemWithSpace()
    const world = createWorld([createPlayer('player', 0, -100)])
    const result = system.update(world)
    expect(result.entities[0].y).toBe(-150)
  })
})

// ---------------------------------------------------------------------------
// Multiple players
// ---------------------------------------------------------------------------

describe('multiple players', () => {
  it('should move all player entities upward', () => {
    const system = jumpSystemWithSpace(30)
    const world = createWorld([
      createPlayer('a', 0, 200),
      createPlayer('b', 0, 300),
      createPlayer('c', 0, 400),
    ])
    const result = system.update(world)
    expect(result.entities[0].y).toBe(170)
    expect(result.entities[1].y).toBe(270)
    expect(result.entities[2].y).toBe(370)
  })

  it('should preserve entity count', () => {
    const system = jumpSystemWithSpace()
    const world = createWorld([
      createPlayer('a', 0, 200),
      createPlayer('b', 0, 300),
    ])
    const result = system.update(world)
    expect(result.entities).toHaveLength(2)
  })

  it('should preserve entity order', () => {
    const system = jumpSystemWithSpace()
    const world = createWorld([
      createPlayer('first', 0, 200),
      createPlayer('second', 0, 300),
    ])
    const result = system.update(world)
    expect(result.entities[0].id).toBe('first')
    expect(result.entities[1].id).toBe('second')
  })
})

// ---------------------------------------------------------------------------
// No player
// ---------------------------------------------------------------------------

describe('no player', () => {
  it('should not affect non-player entities when Space pressed', () => {
    const system = jumpSystemWithSpace()
    const world = createWorld([createNonPlayer('enemy', 'enemy', 0, 200)])
    const result = system.update(world)
    expect(result.entities[0].y).toBe(200)
  })

  it('should not affect entities with other types', () => {
    const system = jumpSystemWithSpace()
    const world = createWorld([
      createNonPlayer('ground', 'terrain', 0, 400),
      createNonPlayer('npc', 'npc', 0, 200),
    ])
    const result = system.update(world)
    expect(result.entities[0].y).toBe(400)
    expect(result.entities[1].y).toBe(200)
  })

  it('should preserve non-player entity identity', () => {
    const system = jumpSystemWithSpace()
    const entity = createNonPlayer('enemy', 'enemy', 0, 200)
    const world = createWorld([entity])
    const result = system.update(world)
    expect(result.entities[0]).toBe(entity)
  })

  it('should handle mixed player and non-player entities', () => {
    const system = jumpSystemWithSpace(50)
    const world = createWorld([
      createPlayer('player', 0, 200),
      createNonPlayer('enemy', 'enemy', 0, 200),
    ])
    const result = system.update(world)
    expect(result.entities[0].y).toBe(150)  // player jumped
    expect(result.entities[1].y).toBe(200)  // enemy unchanged
  })
})

// ---------------------------------------------------------------------------
// No PositionComponent
// ---------------------------------------------------------------------------

describe('no PositionComponent', () => {
  it('should not affect player without PositionComponent', () => {
    const system = jumpSystemWithSpace()
    const world = createWorld([createEntityWithoutPosition('player')])
    const result = system.update(world)
    expect(result.entities[0].y).toBe(0)
  })

  it('should not affect entity with null components', () => {
    const entity = Object.freeze({
      id: 'player',
      type: 'player',
      x: 0,
      y: 200,
      components: null,
    }) as unknown as Entity
    const world = createWorld([entity])
    const system = jumpSystemWithSpace()
    const result = system.update(world)
    expect(result.entities[0].y).toBe(200)
  })

  it('should not affect entity with empty components array', () => {
    const entity = Object.freeze({
      id: 'player',
      type: 'player',
      x: 0,
      y: 200,
      components: Object.freeze([]),
    }) as unknown as Entity
    const world = createWorld([entity])
    const system = jumpSystemWithSpace()
    const result = system.update(world)
    expect(result.entities[0].y).toBe(200)
  })

  it('should not affect entity with non-position components', () => {
    const entity = Object.freeze({
      id: 'player',
      type: 'player',
      x: 0,
      y: 200,
      components: Object.freeze([
        Object.freeze({
          type: 'health',
          properties: Object.freeze({ hp: 100 }),
        }),
      ]),
    }) as unknown as Entity
    const world = createWorld([entity])
    const system = jumpSystemWithSpace()
    const result = system.update(world)
    expect(result.entities[0].y).toBe(200)
  })
})

// ---------------------------------------------------------------------------
// Space not pressed
// ---------------------------------------------------------------------------

describe('Space not pressed', () => {
  it('should not jump when no keys pressed', () => {
    const system = jumpSystemWithoutSpace()
    const world = createWorld([createPlayer('player', 0, 200)])
    const result = system.update(world)
    expect(result.entities[0].y).toBe(200)
  })

  it('should not jump when other keys are pressed', () => {
    const system = new DefaultJumpSystem(
      new MockInputProvider(['ArrowLeft', 'ArrowRight']),
    )
    const world = createWorld([createPlayer('player', 0, 200)])
    const result = system.update(world)
    expect(result.entities[0].y).toBe(200)
  })

  it('should preserve entity identity when not jumping', () => {
    const system = jumpSystemWithoutSpace()
    const entity = createPlayer('player', 0, 200)
    const world = createWorld([entity])
    const result = system.update(world)
    expect(result.entities[0]).toBe(entity)
  })

  it('should handle empty world when no Space', () => {
    const system = jumpSystemWithoutSpace()
    const world = createWorld([])
    const result = system.update(world)
    expect(result.entities).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// Repeated updates
// ---------------------------------------------------------------------------

describe('repeated updates', () => {
  it('should apply jump each tick Space is held', () => {
    const system = jumpSystemWithSpace(10)
    let world = createWorld([createPlayer('player', 0, 200)])

    world = system.update(world)
    expect(world.entities[0].y).toBe(190)

    world = system.update(world)
    expect(world.entities[0].y).toBe(180)

    world = system.update(world)
    expect(world.entities[0].y).toBe(170)
  })

  it('should not apply jump when Space is released', () => {
    const system = new DefaultJumpSystem(new MockInputProvider(['Space']))
    const noSpace = new DefaultJumpSystem(new MockInputProvider([]))
    let world = createWorld([createPlayer('player', 0, 200)])

    // Space held - jumps
    world = system.update(world)
    expect(world.entities[0].y).toBe(150)

    // Space released - no jump
    world = noSpace.update(world)
    expect(world.entities[0].y).toBe(150)
  })
})

// ---------------------------------------------------------------------------
// Result metadata
// ---------------------------------------------------------------------------

describe('result metadata', () => {
  it('should return jumpedPlayers count', () => {
    const system = jumpSystemWithSpace()
    const world = createWorld([createPlayer('player', 0, 200)])
    const { result } = system.updateWithResult(world)
    expect(result.jumpedPlayers).toBe(1)
  })

  it('should return jumpHeight in result', () => {
    const system = jumpSystemWithSpace(75)
    const world = createWorld([createPlayer('player', 0, 200)])
    const { result } = system.updateWithResult(world)
    expect(result.jumpHeight).toBe(75)
  })

  it('should return default jumpHeight in result', () => {
    const system = jumpSystemWithSpace()
    const world = createWorld([createPlayer('player', 0, 200)])
    const { result } = system.updateWithResult(world)
    expect(result.jumpHeight).toBe(50)
  })

  it('should return 0 jumped players when Space not pressed', () => {
    const system = jumpSystemWithoutSpace()
    const world = createWorld([createPlayer('player', 0, 200)])
    const { result } = system.updateWithResult(world)
    expect(result.jumpedPlayers).toBe(0)
  })

  it('should return 0 jumped players for non-player entities', () => {
    const system = jumpSystemWithSpace()
    const world = createWorld([createNonPlayer('enemy', 'enemy', 0, 200)])
    const { result } = system.updateWithResult(world)
    expect(result.jumpedPlayers).toBe(0)
  })

  it('should return 0 jumped players for entity without PositionComponent', () => {
    const system = jumpSystemWithSpace()
    const world = createWorld([createEntityWithoutPosition('player')])
    const { result } = system.updateWithResult(world)
    expect(result.jumpedPlayers).toBe(0)
  })

  it('should return jumpedPlayers for multiple players', () => {
    const system = jumpSystemWithSpace()
    const world = createWorld([
      createPlayer('a', 0, 200),
      createPlayer('b', 0, 300),
    ])
    const { result } = system.updateWithResult(world)
    expect(result.jumpedPlayers).toBe(2)
  })

  it('should return jumpedPlayers for mixed world', () => {
    const system = jumpSystemWithSpace()
    const world = createWorld([
      createPlayer('player', 0, 200),
      createNonPlayer('enemy', 'enemy', 0, 200),
      createPlayer('player2', 0, 300),
    ])
    const { result } = system.updateWithResult(world)
    expect(result.jumpedPlayers).toBe(2)
  })
})

// ---------------------------------------------------------------------------
// PositionComponent update
// ---------------------------------------------------------------------------

describe('PositionComponent update', () => {
  it('should update PositionComponent y on jump', () => {
    const system = jumpSystemWithSpace(30)
    const world = createWorld([createPlayer('player', 0, 200)])
    const result = system.update(world)
    const component = result.entities[0].components?.[0]
    expect(component).toBeDefined()
    const pos = component as { type: string; properties: { x: number; y: number } }
    expect(pos.properties.y).toBe(170)
  })

  it('should preserve PositionComponent x on jump', () => {
    const system = jumpSystemWithSpace()
    const world = createWorld([createPlayer('player', 50, 200)])
    const result = system.update(world)
    const component = result.entities[0].components?.[0]
    const pos = component as { type: string; properties: { x: number; y: number } }
    expect(pos.properties.x).toBe(50)
  })

  it('should preserve non-position components on jump', () => {
    const healthComponent = Object.freeze({
      type: 'health',
      properties: Object.freeze({ hp: 100 }),
    })
    const entity = Object.freeze({
      id: 'player',
      type: 'player',
      x: 0,
      y: 200,
      components: Object.freeze([
        createPositionComponent(0, 200),
        healthComponent,
      ]),
    }) as unknown as Entity
    const world = createWorld([entity])
    const system = jumpSystemWithSpace(30)
    const result = system.update(world)
    const components = result.entities[0].components
    expect(components).toHaveLength(2)
    const health = components?.[1] as { type: string; properties: { hp: number } }
    expect(health.properties.hp).toBe(100)
  })
})

// ---------------------------------------------------------------------------
// update() vs updateWithResult()
// ---------------------------------------------------------------------------

describe('update vs updateWithResult', () => {
  it('should produce same world via update and updateWithResult', () => {
    const system = jumpSystemWithSpace(30)
    const world = createWorld([createPlayer('player', 0, 200)])
    const updateResult = system.update(world)
    const { world: withResultWorld } = system.updateWithResult(world)
    expect(updateResult).toEqual(withResultWorld)
  })

  it('should return frozen world from update', () => {
    const system = jumpSystemWithSpace()
    const world = createWorld([createPlayer('player', 0, 200)])
    const result = system.update(world)
    expect(Object.isFrozen(result)).toBe(true)
  })

  it('should return frozen world from updateWithResult', () => {
    const system = jumpSystemWithSpace()
    const world = createWorld([createPlayer('player', 0, 200)])
    const { world: outputWorld } = system.updateWithResult(world)
    expect(Object.isFrozen(outputWorld)).toBe(true)
  })

  it('should return frozen result from updateWithResult', () => {
    const system = jumpSystemWithSpace()
    const world = createWorld([createPlayer('player', 0, 200)])
    const { result } = system.updateWithResult(world)
    expect(Object.isFrozen(result)).toBe(true)
  })

  it('should return consistent world and result', () => {
    const system = jumpSystemWithSpace(30)
    const world = createWorld([createPlayer('player', 0, 200)])
    const { world: outputWorld, result } = system.updateWithResult(world)
    expect(result.jumpedPlayers).toBe(1)
    expect(outputWorld.entities[0].y).toBe(170)
  })
})

// ---------------------------------------------------------------------------
// Immutability
// ---------------------------------------------------------------------------

describe('immutability', () => {
  it('should not mutate input world', () => {
    const system = jumpSystemWithSpace()
    const world = createWorld([createPlayer('player', 0, 200)])
    const yBefore = world.entities[0].y
    system.update(world)
    expect(world.entities[0].y).toBe(yBefore)
  })

  it('should return frozen world', () => {
    const system = jumpSystemWithSpace()
    const world = createWorld([createPlayer('player', 0, 200)])
    const result = system.update(world)
    expect(Object.isFrozen(result)).toBe(true)
  })

  it('should return frozen entities array', () => {
    const system = jumpSystemWithSpace()
    const world = createWorld([createPlayer('player', 0, 200)])
    const result = system.update(world)
    expect(Object.isFrozen(result.entities)).toBe(true)
  })

  it('should return frozen individual entities', () => {
    const system = jumpSystemWithSpace()
    const world = createWorld([createPlayer('player', 0, 200)])
    const result = system.update(world)
    for (const entity of result.entities) {
      expect(Object.isFrozen(entity)).toBe(true)
    }
  })

  it('should return frozen components', () => {
    const system = jumpSystemWithSpace()
    const world = createWorld([createPlayer('player', 0, 200)])
    const result = system.update(world)
    for (const entity of result.entities) {
      if (entity.components) {
        expect(Object.isFrozen(entity.components)).toBe(true)
      }
    }
  })

  it('should not mutate input entity y when jumping', () => {
    const system = jumpSystemWithSpace()
    const world = createWorld([createPlayer('player', 0, 200)])
    const yBefore = world.entities[0].y
    system.update(world)
    expect(world.entities[0].y).toBe(yBefore)
  })

  it('should not mutate input PositionComponent', () => {
    const system = jumpSystemWithSpace()
    const world = createWorld([createPlayer('player', 0, 200)])
    const componentBefore = world.entities[0].components?.[0]
    const yBefore = (componentBefore as unknown as { properties: { y: number } }).properties.y
    system.update(world)
    const componentAfter = world.entities[0].components?.[0]
    const yAfter = (componentAfter as unknown as { properties: { y: number } }).properties.y
    expect(yAfter).toBe(yBefore)
  })

  it('should not mutate non-player entity in world', () => {
    const system = jumpSystemWithSpace()
    const entity = createNonPlayer('enemy', 'enemy', 0, 200)
    const world = createWorld([entity])
    const yBefore = world.entities[0].y
    system.update(world)
    expect(world.entities[0].y).toBe(yBefore)
  })
})

// ---------------------------------------------------------------------------
// Frozen outputs
// ---------------------------------------------------------------------------

describe('frozen outputs', () => {
  it('should deeply freeze world when no jump', () => {
    const system = jumpSystemWithoutSpace()
    const world = createWorld([createPlayer('player', 0, 200)])
    const result = system.update(world)
    expect(Object.isFrozen(result)).toBe(true)
    expect(Object.isFrozen(result.entities)).toBe(true)
  })

  it('should deeply freeze world on jump', () => {
    const system = jumpSystemWithSpace()
    const world = createWorld([createPlayer('player', 0, 200)])
    const result = system.update(world)
    expect(Object.isFrozen(result)).toBe(true)
    expect(Object.isFrozen(result.entities)).toBe(true)
    for (const entity of result.entities) {
      expect(Object.isFrozen(entity)).toBe(true)
    }
  })

  it('should deeply freeze result object', () => {
    const system = jumpSystemWithSpace()
    const world = createWorld([createPlayer('player', 0, 200)])
    const { result } = system.updateWithResult(world)
    expect(Object.isFrozen(result)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Determinism
// ---------------------------------------------------------------------------

describe('determinism', () => {
  it('should produce identical output for same input', () => {
    const system = jumpSystemWithSpace()
    const world = createWorld([createPlayer('player', 0, 200)])
    const result1 = system.update(world)
    const result2 = system.update(world)
    expect(result1).toEqual(result2)
  })

  it('should produce identical output across multiple calls', () => {
    const system = jumpSystemWithSpace()
    const world = createWorld([createPlayer('player', 0, 200)])
    const results = Array.from({ length: 10 }, () => system.update(world))
    const first = results[0]
    for (const result of results) {
      expect(result).toEqual(first)
    }
  })

  it('should produce identical output across different systems with same params', () => {
    const world = createWorld([createPlayer('player', 0, 200)])
    const system1 = jumpSystemWithSpace()
    const system2 = jumpSystemWithSpace()
    expect(system1.update(world)).toEqual(system2.update(world))
  })

  it('should produce same result for custom jump height', () => {
    const system = jumpSystemWithSpace(100)
    const world = createWorld([createPlayer('player', 0, 200)])
    expect(system.update(world)).toEqual(system.update(world))
  })

  it('should preserve entity order deterministically', () => {
    const system = jumpSystemWithSpace()
    const world = createWorld([
      createPlayer('a', 0, 200),
      createPlayer('b', 0, 300),
    ])
    for (let i = 0; i < 10; i++) {
      const result = system.update(world)
      expect(result.entities[0].id).toBe('a')
      expect(result.entities[1].id).toBe('b')
    }
  })

  it('should produce identical updateWithResult for same input', () => {
    const system = jumpSystemWithSpace()
    const world = createWorld([createPlayer('player', 0, 200)])
    const r1 = system.updateWithResult(world)
    const r2 = system.updateWithResult(world)
    expect(r1.world).toEqual(r2.world)
    expect(r1.result).toEqual(r2.result)
  })
})

// ---------------------------------------------------------------------------
// Empty world
// ---------------------------------------------------------------------------

describe('empty world', () => {
  it('should handle empty entity array', () => {
    const system = jumpSystemWithSpace()
    const world = createWorld([])
    const result = system.update(world)
    expect(result.entities).toHaveLength(0)
  })

  it('should return frozen empty array', () => {
    const system = jumpSystemWithSpace()
    const world = createWorld([])
    const result = system.update(world)
    expect(Object.isFrozen(result.entities)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Stress tests
// ---------------------------------------------------------------------------

describe('stress tests', () => {
  it('should handle 100 player entities jumping', () => {
    const system = jumpSystemWithSpace(10)
    const entities = Array.from({ length: 100 }, (_, i) =>
      createPlayer(`p${i}`, i, 200 + i),
    )
    const world = createWorld(entities)
    const result = system.update(world)
    expect(result.entities).toHaveLength(100)
    expect(result.entities[0].y).toBe(190)
    expect(result.entities[50].y).toBe(240)
  })

  it('should handle 1000 entities with mixed types', () => {
    const system = jumpSystemWithSpace(10)
    const entities: Entity[] = []
    for (let i = 0; i < 500; i++) {
      entities.push(createPlayer(`p${i}`, 0, 200))
      entities.push(createNonPlayer(`e${i}`, 'enemy', 0, 200))
    }
    const world = createWorld(entities)
    const result = system.update(world)
    expect(result.entities).toHaveLength(1000)
    // Player entities jump to 190
    expect(result.entities[0].y).toBe(190)
    // Non-player entities unchanged
    expect(result.entities[1].y).toBe(200)
  })

  it('should handle repeated jumping over many ticks', () => {
    const system = jumpSystemWithSpace(5)
    let world = createWorld([createPlayer('player', 0, 200)])

    for (let i = 0; i < 10; i++) {
      world = system.update(world)
    }
    // After 10 ticks of 5 pixels each: y = 200 - 50 = 150
    expect(world.entities[0].y).toBe(150)
  })

  it('should handle large number of mixed player/non-player/without-position', () => {
    const system = jumpSystemWithSpace(10)
    const entities: Entity[] = []
    for (let i = 0; i < 100; i++) {
      entities.push(createPlayer(`p${i}`, 0, 200))
      entities.push(createNonPlayer(`e${i}`, 'enemy', 0, 200))
      entities.push(createEntityWithoutPosition(`n${i}`))
    }
    const world = createWorld(entities)
    const result = system.update(world)
    expect(result.entities).toHaveLength(300)
    expect(result.entities[0].y).toBe(190)   // player
    expect(result.entities[1].y).toBe(200)   // enemy
    expect(result.entities[2].y).toBe(0)     // no pos
  })

  it('should handle player at very high y coordinate', () => {
    const system = jumpSystemWithSpace()
    const world = createWorld([createPlayer('player', 0, 100000)])
    const result = system.update(world)
    expect(result.entities[0].y).toBe(99950)
  })

  it('should handle player at very negative y coordinate', () => {
    const system = jumpSystemWithSpace()
    const world = createWorld([createPlayer('player', 0, -100000)])
    const result = system.update(world)
    expect(result.entities[0].y).toBe(-100050)
  })
})

// ---------------------------------------------------------------------------
// Stateless
// ---------------------------------------------------------------------------

describe('stateless', () => {
  it('should produce same output regardless of call order', () => {
    const system = jumpSystemWithSpace()
    const world1 = createWorld([createPlayer('a', 0, 200)])
    const world2 = createWorld([createPlayer('b', 0, 500)])

    const r1 = system.update(world1)
    const r2 = system.update(world2)

    expect(r1.entities[0].y).toBe(150)
    expect(r2.entities[0].y).toBe(450)
  })

  it('should not accumulate state across calls', () => {
    const system = jumpSystemWithSpace()
    const world = createWorld([createNonPlayer('e', 'enemy', 0, 200)])

    for (let i = 0; i < 10; i++) {
      const result = system.update(world)
      expect(result.entities[0].y).toBe(200)
    }
  })
})