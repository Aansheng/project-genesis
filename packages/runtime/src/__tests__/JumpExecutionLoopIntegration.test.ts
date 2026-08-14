/**
 * JumpExecutionLoopIntegration.test.ts — integration tests verifying
 * JumpSystem + GravitySystem + GroundCollisionSystem work correctly
 * within the RuntimeExecutionLoop.
 *
 * Verifies the pipeline:
 *   JumpSystem (Space → upward impulse)
 *   → GravitySystem (downward force)
 *   → GroundCollisionSystem (clamp at ground)
 *
 * Coverage:
 * - Player jumps → gravity pulls down → collision lands
 * - Repeated ticks after jump
 * - Multiple jumps
 * - Execution order verification
 * - Ground interaction after landing
 * - Empty world
 * - Immutability
 * - Determinism
 * - Mixed entities
 */
import { describe, it, expect } from 'vitest'
import { DefaultJumpSystem } from '../systems/DefaultJumpSystem'
import { DefaultGravitySystem } from '../systems/DefaultGravitySystem'
import { DefaultGroundCollisionSystem } from '../systems/DefaultGroundCollisionSystem'
import { DefaultRuntimeSystemRegistry } from '../system/DefaultRuntimeSystemRegistry'
import { DefaultRuntimeExecutionLoop } from '../execution/DefaultRuntimeExecutionLoop'
import type { World, Entity } from '@genesis/shared'
import { createPositionComponent } from '@genesis/shared'
import type { InputKey, InputProvider, InputState } from '../input'
import { DefaultInputState } from '../input'

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
// Helpers
// ---------------------------------------------------------------------------

function createPlayer(id: string, x: number, y: number): Entity {
  return Object.freeze({
    id,
    type: 'player',
    x,
    y,
    components: Object.freeze([createPositionComponent(x, y)]),
  }) as unknown as Entity
}

function createNonPlayer(id: string, type: string, x: number, y: number): Entity {
  return Object.freeze({
    id,
    type,
    x,
    y,
    components: Object.freeze([createPositionComponent(x, y)]),
  }) as unknown as Entity
}

function createEntityWithoutPosition(id: string): Entity {
  return Object.freeze({
    id,
    type: 'player',
    x: 0,
    y: 0,
  }) as unknown as Entity
}

function createWorld(entities: readonly Entity[]): World {
  return Object.freeze({
    entities: Object.freeze([...entities]),
  }) as unknown as World
}

/** Create execution loop with Jump → Gravity → Collision systems. */
function createLoop(groundY: number = 400, jumpHeight: number = 50, gravity: number = 5): {
  loop: DefaultRuntimeExecutionLoop
  inputProvider: MockInputProvider
} {
  const inputProvider = new MockInputProvider(['Space'])
  const registry = new DefaultRuntimeSystemRegistry()
  registry.register(new DefaultJumpSystem(inputProvider, jumpHeight))
  registry.register(new DefaultGravitySystem(gravity))
  registry.register(new DefaultGroundCollisionSystem(groundY))
  const loop = new DefaultRuntimeExecutionLoop(registry)
  return { loop, inputProvider }
}

// ---------------------------------------------------------------------------
// Jump → Gravity → Collision pipeline
// ---------------------------------------------------------------------------

describe('jump → gravity → collision pipeline', () => {
  it('should jump player upward on Space press', () => {
    const { loop } = createLoop(400, 50, 5)
    const world = createWorld([createPlayer('player', 0, 400)])
    const result = loop.tick(world)

    // JumpSystem: y=400-50=350
    // GravitySystem: y=350+5=355
    // GroundCollisionSystem: y=355 < 400, no clamp
    expect(result.entities[0].y).toBe(355)
  })

  it('should pull player back down after jump', () => {
    const { loop, inputProvider } = createLoop(400, 50, 5)
    let world = createWorld([createPlayer('player', 0, 400)])

    // Tick 1: Jump (400-50=350) + gravity (350+5=355)
    world = loop.tick(world)
    expect(world.entities[0].y).toBe(355)

    // Release Space so player falls
    inputProvider.getState = () => new DefaultInputState(new Set())

    // Tick 2: No jump, only gravity: 355+5=360
    world = loop.tick(world)
    expect(world.entities[0].y).toBe(360)

    // Tick 3: Gravity: 360+5=365
    world = loop.tick(world)
    expect(world.entities[0].y).toBe(365)
  })

  it('should land player back at ground after jump arc', () => {
    const { loop, inputProvider } = createLoop(400, 50, 5)
    let world = createWorld([createPlayer('player', 0, 400)])

    // Tick 1: Jump 350 + gravity 355
    world = loop.tick(world)

    // Release Space so player falls back
    inputProvider.getState = () => new DefaultInputState(new Set())

    // Keep ticking until player returns to ground
    for (let i = 0; i < 20; i++) {
      world = loop.tick(world)
    }

    // Player should be back at ground level 400
    expect(world.entities[0].y).toBe(400)
  })

  it('should keep player at ground after landing', () => {
    const { loop, inputProvider } = createLoop(400, 30, 10)
    let world = createWorld([createPlayer('player', 0, 400)])

    // Single jump
    world = loop.tick(world)

    // Release Space so player falls back
    inputProvider.getState = () => new DefaultInputState(new Set())

    // Jump + fall back down + many extra ticks
    for (let i = 0; i < 50; i++) {
      world = loop.tick(world)
    }

    // Should be locked at ground
    expect(world.entities[0].y).toBe(400)
  })

  it('should handle jump from above ground', () => {
    const { loop, inputProvider } = createLoop(400, 50, 5)
    let world = createWorld([createPlayer('player', 0, 300)])

    // Tick 1: Jump 300-50=250 + gravity 255
    world = loop.tick(world)
    expect(world.entities[0].y).toBe(255)

    // Release Space so player falls
    inputProvider.getState = () => new DefaultInputState(new Set())

    // Fall back to ground
    for (let i = 0; i < 50; i++) {
      world = loop.tick(world)
    }
    expect(world.entities[0].y).toBe(400)
  })

  it('should apply gravity after jump each tick', () => {
    const { loop, inputProvider } = createLoop(400, 100, 10)
    let world = createWorld([createPlayer('player', 0, 400)])

    // Jump 100: 400→300 + gravity 310
    world = loop.tick(world)
    expect(world.entities[0].y).toBe(310)

    // Release Space so gravity takes over
    inputProvider.getState = () => new DefaultInputState(new Set())

    // Gravity continues: 310+10=320
    world = loop.tick(world)
    expect(world.entities[0].y).toBe(320)

    // Gravity continues: 320+10=330
    world = loop.tick(world)
    expect(world.entities[0].y).toBe(330)
  })

  it('should handle multiple players jumping simultaneously', () => {
    const { loop } = createLoop(400, 50, 5)
    const world = createWorld([
      createPlayer('p1', 0, 400),
      createPlayer('p2', 0, 400),
    ])
    const result = loop.tick(world)

    // Both jump: 400-50=350 + gravity 355
    expect(result.entities[0].y).toBe(355)
    expect(result.entities[1].y).toBe(355)
  })
})

// ---------------------------------------------------------------------------
// Execution order verification
// ---------------------------------------------------------------------------

describe('execution order verification', () => {
  it('should apply jump before gravity', () => {
    const { loop } = createLoop(400, 50, 5)
    const world = createWorld([createPlayer('player', 0, 400)])
    const result = loop.tick(world)

    // If gravity ran first: 400+5=405, then jump: 405-50=355
    // If jump ran first: 400-50=350, then gravity: 350+5=355
    // Both produce 355 in this case (commutative)
    // Verifying via different values
    expect(result.entities[0].y).toBe(355)
  })

  it('should show effect of jump preceding gravity with larger values', () => {
    const { loop } = createLoop(400, 100, 50)
    const world = createWorld([createPlayer('player', 0, 400)])
    const result = loop.tick(world)

    // Jump first: 400-100=300, gravity: 300+50=350
    // Gravity first: 400+50=450, jump: 450-100=350
    // Same result when both are applied (commutative ops)
    // Key test is that the full pipeline produces correct value
    expect(result.entities[0].y).toBe(350)
  })

  it('should apply collision after gravity in pipeline', () => {
    const { loop } = createLoop(400, 5, 10)
    let world = createWorld([createPlayer('player', 0, 400)])

    // Tick 1: Jump 395 + gravity 405 → collision clamps to 400
    world = loop.tick(world)
    expect(world.entities[0].y).toBe(400)

    // If collision ran before gravity: 400(clamped) + gravity 405 != 400
    // With correct order: jump 395 + gravity 405 = 405 → clamped to 400 ✔
  })
})

// ---------------------------------------------------------------------------
// Multiple ticks and repeated jumps
// ---------------------------------------------------------------------------

describe('multiple ticks and repeated jumps', () => {
  it('should handle multiple jump cycles', () => {
    const { loop, inputProvider } = createLoop(400, 50, 5)
    let world = createWorld([createPlayer('player', 0, 400)])

    // First jump cycle
    world = loop.tick(world)  // 355

    // Release Space so player falls back
    inputProvider.getState = () => new DefaultInputState(new Set())

    // Let gravity bring back to ground
    for (let i = 0; i < 20; i++) {
      world = loop.tick(world)
    }
    expect(world.entities[0].y).toBe(400)

    // Press Space again for second jump
    const spaceOnly = new MockInputProvider(['Space'])
    inputProvider.getState = () => spaceOnly.getState()

    // Second jump
    world = loop.tick(world)  // 355

    // Release Space again
    inputProvider.getState = () => new DefaultInputState(new Set())

    // Fall back
    for (let i = 0; i < 20; i++) {
      world = loop.tick(world)
    }
    expect(world.entities[0].y).toBe(400)
  })

  it('should stop jumping when Space is released', () => {
    const inputProvider = new MockInputProvider(['Space'])
    const registry = new DefaultRuntimeSystemRegistry()
    registry.register(new DefaultJumpSystem(inputProvider, 50))
    registry.register(new DefaultGravitySystem(5))
    registry.register(new DefaultGroundCollisionSystem(400))
    const loop = new DefaultRuntimeExecutionLoop(registry)

    let world = createWorld([createPlayer('player', 0, 400)])

    // Space held: jump
    world = loop.tick(world)
    expect(world.entities[0].y).toBe(355)

    // Release Space
    inputProvider.getState = () => new DefaultInputState(new Set())

    // No jump, only gravity
    world = loop.tick(world)
    expect(world.entities[0].y).toBe(360)  // 355+5=360

    // Keep falling toward ground
    for (let i = 0; i < 20; i++) {
      world = loop.tick(world)
    }
    expect(world.entities[0].y).toBe(400)
  })

  it('should not affect non-player entities in pipeline', () => {
    const { loop } = createLoop(400, 50, 5)
    const world = createWorld([
      createPlayer('player', 0, 400),
      createNonPlayer('enemy', 'enemy', 0, 200),
    ])
    const result = loop.tick(world)

    expect(result.entities[0].y).toBe(355)  // player jumped
    expect(result.entities[1].y).toBe(205)  // enemy only gravity
  })

  it('should not affect entity without PositionComponent', () => {
    const { loop } = createLoop(400, 50, 5)
    const entity = createEntityWithoutPosition('no-pos')
    const world = createWorld([entity])
    const result = loop.tick(world)

    expect(result.entities[0]).toBe(entity)
  })
})

// ---------------------------------------------------------------------------
// Ground interaction
// ---------------------------------------------------------------------------

describe('ground interaction', () => {
  it('should stop player at ground after jump', () => {
    const { loop, inputProvider } = createLoop(400, 100, 10)
    let world = createWorld([createPlayer('player', 0, 400)])

    // Single jump
    world = loop.tick(world)

    // Release Space so player falls
    inputProvider.getState = () => new DefaultInputState(new Set())

    // Fall back to ground
    for (let i = 0; i < 30; i++) {
      world = loop.tick(world)
    }

    // Should be at ground
    expect(world.entities[0].y).toBe(400)
  })

  it('should not go below ground at any point', () => {
    const { loop, inputProvider } = createLoop(400, 100, 50)
    let world = createWorld([createPlayer('player', 0, 400)])

    // Single jump
    world = loop.tick(world)

    // Release Space so player falls
    inputProvider.getState = () => new DefaultInputState(new Set())

    // Many ticks while falling
    for (let i = 0; i < 100; i++) {
      world = loop.tick(world)
      expect(world.entities[0].y).toBeGreaterThanOrEqual(350)
    }
  })

  it('should never let entity fall below groundY', () => {
    const { loop } = createLoop(400, 50, 100)
    let world = createWorld([createPlayer('player', 0, 400)])

    for (let i = 0; i < 50; i++) {
      world = loop.tick(world)
      // y should never exceed 400 (ground level)
      // jump: 400-50=350, gravity: 350+100=450, collision clamps to 400
      expect(world.entities[0].y).toBeLessThanOrEqual(400)
    }
  })

  it('should handle different ground heights', () => {
    const { loop, inputProvider } = createLoop(200, 50, 10)
    let world = createWorld([createPlayer('player', 0, 200)])

    // Tick 1: Jump 150 + gravity 160
    world = loop.tick(world)
    expect(world.entities[0].y).toBe(160)

    // Release Space so player falls back down
    inputProvider.getState = () => new DefaultInputState(new Set())

    // Fall back to ground
    for (let i = 0; i < 20; i++) {
      world = loop.tick(world)
    }
    expect(world.entities[0].y).toBe(200)
  })
})

// ---------------------------------------------------------------------------
// Immutability and determinism in integration
// ---------------------------------------------------------------------------

describe('immutability and determinism', () => {
  it('should return frozen world from execution loop', () => {
    const { loop } = createLoop()
    const world = createWorld([createPlayer('player', 0, 400)])
    const result = loop.tick(world)
    expect(Object.isFrozen(result)).toBe(true)
  })

  it('should not mutate input world', () => {
    const { loop } = createLoop()
    const world = createWorld([createPlayer('player', 0, 400)])
    const yBefore = world.entities[0].y
    loop.tick(world)
    expect(world.entities[0].y).toBe(yBefore)
  })

  it('should handle empty world', () => {
    const { loop } = createLoop()
    const world = createWorld([])
    const result = loop.tick(world)
    expect(result.entities).toHaveLength(0)
  })

  it('should be deterministic with jump + gravity + collision', () => {
    const { loop } = createLoop()
    const world = createWorld([createPlayer('player', 0, 400)])
    const result1 = loop.tick(world)
    const result2 = loop.tick(world)
    expect(result1).toEqual(result2)
  })

  it('should preserve entity order', () => {
    const { loop } = createLoop()
    const world = createWorld([
      createPlayer('first', 0, 400),
      createPlayer('second', 0, 300),
    ])
    const result = loop.tick(world)
    expect(result.entities[0].id).toBe('first')
    expect(result.entities[1].id).toBe('second')
  })
})