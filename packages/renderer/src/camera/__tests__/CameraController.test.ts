/**
 * CameraController.test.ts — comprehensive test suite for DefaultCameraController.
 *
 * Target: 70+ tests
 * Coverage: construction, default state, player follow, multiple players,
 *           missing player, missing position, state updates,
 *           determinism, immutability, deep freeze, large coordinates,
 *           stress tests
 */
import { describe, it, expect } from 'vitest'
import { DefaultCameraController } from '../DefaultCameraController'
import type { RenderWorld, RenderEntity } from '../../model'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createPlayerEntity(id: string, x: number, y: number): RenderEntity {
  return Object.freeze({
    id,
    type: 'player',
    position: Object.freeze({ x, y }),
  })
}

function createNonPlayerEntity(id: string, type: string, x: number, y: number): RenderEntity {
  return Object.freeze({
    id,
    type,
    position: Object.freeze({ x, y }),
  })
}

function createEntityWithoutPosition(id: string, type: string = 'player'): RenderEntity {
  return Object.freeze({
    id,
    type,
  })
}

function createWorld(entities: readonly RenderEntity[]): RenderWorld {
  return Object.freeze({
    entities: Object.freeze([...entities]),
  })
}

// ---------------------------------------------------------------------------
// Construction
// ---------------------------------------------------------------------------

describe('construction', () => {
  it('should create a DefaultCameraController', () => {
    const controller = new DefaultCameraController()
    expect(controller).toBeInstanceOf(DefaultCameraController)
  })

  it('should implement CameraController interface', () => {
    const controller = new DefaultCameraController()
    expect(typeof controller.update).toBe('function')
    expect(typeof controller.getState).toBe('function')
  })

  it('should start with default state at (0, 0)', () => {
    const controller = new DefaultCameraController()
    const state = controller.getState()
    expect(state.x).toBe(0)
    expect(state.y).toBe(0)
  })

  it('should return frozen default state', () => {
    const controller = new DefaultCameraController()
    expect(Object.isFrozen(controller.getState())).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Default state
// ---------------------------------------------------------------------------

describe('default state', () => {
  it('should return (0, 0) before first update', () => {
    const controller = new DefaultCameraController()
    const state = controller.getState()
    expect(state).toEqual({ x: 0, y: 0 })
  })

  it('should preserve default state when no player in world', () => {
    const controller = new DefaultCameraController()
    const world = createWorld([])
    controller.update(world)
    const state = controller.getState()
    expect(state.x).toBe(0)
    expect(state.y).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// Player follow
// ---------------------------------------------------------------------------

describe('player follow', () => {
  it('should follow player position on update', () => {
    const controller = new DefaultCameraController()
    const world = createWorld([createPlayerEntity('player', 100, 200)])
    const state = controller.update(world)
    expect(state.x).toBe(100)
    expect(state.y).toBe(200)
  })

  it('should follow player at origin', () => {
    const controller = new DefaultCameraController()
    const world = createWorld([createPlayerEntity('player', 0, 0)])
    const state = controller.update(world)
    expect(state.x).toBe(0)
    expect(state.y).toBe(0)
  })

  it('should follow player at negative coordinates', () => {
    const controller = new DefaultCameraController()
    const world = createWorld([createPlayerEntity('player', -100, -200)])
    const state = controller.update(world)
    expect(state.x).toBe(-100)
    expect(state.y).toBe(-200)
  })

  it('should follow player at large coordinates', () => {
    const controller = new DefaultCameraController()
    const world = createWorld([createPlayerEntity('player', 10000, 5000)])
    const state = controller.update(world)
    expect(state.x).toBe(10000)
    expect(state.y).toBe(5000)
  })

  it('should follow player at fractional coordinates', () => {
    const controller = new DefaultCameraController()
    const world = createWorld([createPlayerEntity('player', 10.5, 20.75)])
    const state = controller.update(world)
    expect(state.x).toBe(10.5)
    expect(state.y).toBe(20.75)
  })

  it('should update camera state on each update call', () => {
    const controller = new DefaultCameraController()
    let world = createWorld([createPlayerEntity('player', 50, 100)])
    controller.update(world)
    expect(controller.getState()).toEqual({ x: 50, y: 100 })

    world = createWorld([createPlayerEntity('player', 200, 300)])
    controller.update(world)
    expect(controller.getState()).toEqual({ x: 200, y: 300 })
  })
})

// ---------------------------------------------------------------------------
// Multiple players
// ---------------------------------------------------------------------------

describe('multiple players', () => {
  it('should follow the first player entity', () => {
    const controller = new DefaultCameraController()
    const world = createWorld([
      createPlayerEntity('p1', 100, 200),
      createPlayerEntity('p2', 300, 400),
    ])
    const state = controller.update(world)
    expect(state.x).toBe(100)
    expect(state.y).toBe(200)
  })

  it('should follow first player when others are non-player', () => {
    const controller = new DefaultCameraController()
    const world = createWorld([
      createPlayerEntity('player', 50, 60),
      createNonPlayerEntity('enemy', 'enemy', 500, 600),
    ])
    const state = controller.update(world)
    expect(state.x).toBe(50)
    expect(state.y).toBe(60)
  })
})

// ---------------------------------------------------------------------------
// Missing player
// ---------------------------------------------------------------------------

describe('missing player', () => {
  it('should keep previous state when no player exists', () => {
    const controller = new DefaultCameraController()
    const world1 = createWorld([createPlayerEntity('player', 100, 200)])
    controller.update(world1)
    expect(controller.getState()).toEqual({ x: 100, y: 200 })

    const world2 = createWorld([])
    controller.update(world2)
    expect(controller.getState()).toEqual({ x: 100, y: 200 })
  })

  it('should keep previous state when only non-player entities exist', () => {
    const controller = new DefaultCameraController()
    const world1 = createWorld([createPlayerEntity('player', 100, 200)])
    controller.update(world1)

    const world2 = createWorld([createNonPlayerEntity('enemy', 'enemy', 500, 600)])
    controller.update(world2)
    expect(controller.getState()).toEqual({ x: 100, y: 200 })
  })

  it('should keep default state when no player in first update', () => {
    const controller = new DefaultCameraController()
    const world = createWorld([createNonPlayerEntity('enemy', 'enemy', 100, 200)])
    const state = controller.update(world)
    expect(state.x).toBe(0)
    expect(state.y).toBe(0)
  })

  it('should keep previous state when empty world follows a tracked player', () => {
    const controller = new DefaultCameraController()
    controller.update(createWorld([createPlayerEntity('player', 50, 60)]))
    controller.update(createWorld([]))
    expect(controller.getState()).toEqual({ x: 50, y: 60 })
  })
})

// ---------------------------------------------------------------------------
// Missing position
// ---------------------------------------------------------------------------

describe('missing position', () => {
  it('should keep previous state when player has no position', () => {
    const controller = new DefaultCameraController()
    const world1 = createWorld([createPlayerEntity('player', 100, 200)])
    controller.update(world1)

    const world2 = createWorld([createEntityWithoutPosition('player')])
    controller.update(world2)
    expect(controller.getState()).toEqual({ x: 100, y: 200 })
  })

  it('should keep default state when first player has no position', () => {
    const controller = new DefaultCameraController()
    const world = createWorld([createEntityWithoutPosition('player')])
    const state = controller.update(world)
    expect(state.x).toBe(0)
    expect(state.y).toBe(0)
  })

  it('should ignore player without position when player with position exists later', () => {
    const controller = new DefaultCameraController()
    const world = createWorld([
      createEntityWithoutPosition('player'),
      createPlayerEntity('player2', 200, 300),
    ])
    // First player has no position, so no camera update
    const state = controller.update(world)
    expect(state.x).toBe(0)
    expect(state.y).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// State updates
// ---------------------------------------------------------------------------

describe('state updates', () => {
  it('should getState reflect latest update', () => {
    const controller = new DefaultCameraController()
    const world = createWorld([createPlayerEntity('player', 150, 250)])
    controller.update(world)
    expect(controller.getState()).toEqual({ x: 150, y: 250 })
  })

  it('should track player movement over multiple updates', () => {
    const controller = new DefaultCameraController()
    const positions = [
      [0, 0], [10, 20], [50, 100], [200, 300],
    ]
    for (const [x, y] of positions) {
      const world = createWorld([createPlayerEntity('player', x, y)])
      controller.update(world)
      expect(controller.getState()).toEqual({ x, y })
    }
  })

  it('should return same reference on getState after one update', () => {
    const controller = new DefaultCameraController()
    const world = createWorld([createPlayerEntity('player', 100, 200)])
    const state1 = controller.update(world)
    const state2 = controller.getState()
    expect(state1).toBe(state2)
  })

  it('should return different reference after subsequent update', () => {
    const controller = new DefaultCameraController()
    controller.update(createWorld([createPlayerEntity('player', 100, 200)]))
    const state1 = controller.getState()
    controller.update(createWorld([createPlayerEntity('player', 200, 300)]))
    const state2 = controller.getState()
    expect(state1).not.toBe(state2)
  })
})

// ---------------------------------------------------------------------------
// Determinism
// ---------------------------------------------------------------------------

describe('determinism', () => {
  it('should produce identical output for same input', () => {
    const controller1 = new DefaultCameraController()
    const controller2 = new DefaultCameraController()
    const world = createWorld([createPlayerEntity('player', 100, 200)])
    expect(controller1.update(world)).toEqual(controller2.update(world))
  })

  it('should produce identical output across multiple calls', () => {
    const controller = new DefaultCameraController()
    const world = createWorld([createPlayerEntity('player', 100, 200)])
    const results = Array.from({ length: 10 }, () => controller.update(world))
    const first = results[0]
    for (const result of results) {
      expect(result).toEqual(first)
    }
  })

  it('should produce same result for different controller instances', () => {
    const world = createWorld([createPlayerEntity('player', 100, 200)])
    const c1 = new DefaultCameraController()
    const c2 = new DefaultCameraController()
    expect(c1.update(world)).toEqual(c2.update(world))
  })

  it('should produce same result for large coordinates', () => {
    const controller = new DefaultCameraController()
    const world = createWorld([createPlayerEntity('player', 99999, -88888)])
    expect(controller.update(world)).toEqual(controller.update(world))
  })
})

// ---------------------------------------------------------------------------
// Immutability
// ---------------------------------------------------------------------------

describe('immutability', () => {
  it('should return frozen state from update', () => {
    const controller = new DefaultCameraController()
    const world = createWorld([createPlayerEntity('player', 100, 200)])
    const state = controller.update(world)
    expect(Object.isFrozen(state)).toBe(true)
  })

  it('should return frozen state from getState', () => {
    const controller = new DefaultCameraController()
    const state = controller.getState()
    expect(Object.isFrozen(state)).toBe(true)
  })

  it('should return frozen state after update', () => {
    const controller = new DefaultCameraController()
    controller.update(createWorld([createPlayerEntity('player', 100, 200)]))
    expect(Object.isFrozen(controller.getState())).toBe(true)
  })

  it('should not mutate input world', () => {
    const controller = new DefaultCameraController()
    const world = createWorld([createPlayerEntity('player', 100, 200)])
    const worldBefore = JSON.stringify(world)
    controller.update(world)
    expect(JSON.stringify(world)).toBe(worldBefore)
  })

  it('should not expose internal state references', () => {
    const controller = new DefaultCameraController()
    const state = controller.getState()
    // Attempt to modify (should not affect internal state)
    const mutated = { ...state, x: 999 }
    expect(controller.getState().x).toBe(0)
    expect(mutated.x).toBe(999)
  })
})

// ---------------------------------------------------------------------------
// Deep freeze
// ---------------------------------------------------------------------------

describe('deep freeze', () => {
  it('should deeply freeze CameraState from update', () => {
    const controller = new DefaultCameraController()
    const world = createWorld([createPlayerEntity('player', 100, 200)])
    const state = controller.update(world)
    expect(Object.isFrozen(state)).toBe(true)
    // Properties are primitives, but the object itself must be frozen
  })

  it('should deeply freeze CameraState from getState', () => {
    const controller = new DefaultCameraController()
    controller.update(createWorld([createPlayerEntity('player', 100, 200)]))
    const state = controller.getState()
    expect(Object.isFrozen(state)).toBe(true)
  })

  it('should deeply freeze default state', () => {
    const controller = new DefaultCameraController()
    expect(Object.isFrozen(controller.getState())).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Empty world
// ---------------------------------------------------------------------------

describe('empty world', () => {
  it('should handle empty world', () => {
    const controller = new DefaultCameraController()
    const world = createWorld([])
    const state = controller.update(world)
    expect(state.x).toBe(0)
    expect(state.y).toBe(0)
  })

  it('should return frozen state for empty world', () => {
    const controller = new DefaultCameraController()
    const world = createWorld([])
    const state = controller.update(world)
    expect(Object.isFrozen(state)).toBe(true)
  })

  it('should keep previous state when empty world follows update', () => {
    const controller = new DefaultCameraController()
    controller.update(createWorld([createPlayerEntity('player', 100, 200)]))
    controller.update(createWorld([]))
    expect(controller.getState()).toEqual({ x: 100, y: 200 })
  })
})

// ---------------------------------------------------------------------------
// Large worlds
// ---------------------------------------------------------------------------

describe('large worlds', () => {
  it('should handle world with many entities', () => {
    const controller = new DefaultCameraController()
    const entities: RenderEntity[] = []
    for (let i = 0; i < 100; i++) {
      entities.push(createNonPlayerEntity(`e${i}`, 'enemy', i * 10, i * 10))
    }
    entities.push(createPlayerEntity('player', 500, 600))
    const world = createWorld(entities)
    const state = controller.update(world)
    expect(state.x).toBe(500)
    expect(state.y).toBe(600)
  })

  it('should follow player in large world with many entities before', () => {
    const controller = new DefaultCameraController()
    const entities: RenderEntity[] = []
    for (let i = 0; i < 1000; i++) {
      entities.push(createNonPlayerEntity(`e${i}`, 'enemy', i, i))
    }
    entities.push(createPlayerEntity('player', 100, 200))
    const world = createWorld(entities)
    const state = controller.update(world)
    expect(state.x).toBe(100)
    expect(state.y).toBe(200)
  })
})

// ---------------------------------------------------------------------------
// Stress tests
// ---------------------------------------------------------------------------

describe('stress tests', () => {
  it('should handle player at MAX_SAFE_INTEGER', () => {
    const controller = new DefaultCameraController()
    const world = createWorld([
      createPlayerEntity('player', Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER),
    ])
    const state = controller.update(world)
    expect(state.x).toBe(Number.MAX_SAFE_INTEGER)
    expect(state.y).toBe(Number.MAX_SAFE_INTEGER)
  })

  it('should handle player at negative MAX_SAFE_INTEGER', () => {
    const controller = new DefaultCameraController()
    const world = createWorld([
      createPlayerEntity('player', -Number.MAX_SAFE_INTEGER, -Number.MAX_SAFE_INTEGER),
    ])
    const state = controller.update(world)
    expect(state.x).toBe(-Number.MAX_SAFE_INTEGER)
    expect(state.y).toBe(-Number.MAX_SAFE_INTEGER)
  })

  it('should handle many consecutive updates without player', () => {
    const controller = new DefaultCameraController()
    for (let i = 0; i < 100; i++) {
      const world = createWorld([])
      controller.update(world)
    }
    expect(controller.getState()).toEqual({ x: 0, y: 0 })
  })

  it('should handle many consecutive updates following player', () => {
    const controller = new DefaultCameraController()
    for (let i = 0; i < 100; i++) {
      const world = createWorld([createPlayerEntity('player', i * 10, i * 20)])
      controller.update(world)
    }
    expect(controller.getState()).toEqual({ x: 990, y: 1980 })
  })

  it('should handle alternating player and no-player worlds', () => {
    const controller = new DefaultCameraController()
    controller.update(createWorld([createPlayerEntity('player', 100, 200)]))
    expect(controller.getState()).toEqual({ x: 100, y: 200 })

    controller.update(createWorld([]))
    expect(controller.getState()).toEqual({ x: 100, y: 200 })

    controller.update(createWorld([createPlayerEntity('player', 300, 400)]))
    expect(controller.getState()).toEqual({ x: 300, y: 400 })
  })

  it('should handle player moving across large distances over updates', () => {
    const controller = new DefaultCameraController()
    const waypoints = [
      [0, 0],
      [100, 0],
      [100, 100],
      [0, 100],
      [0, 0],
    ]
    for (const [x, y] of waypoints) {
      controller.update(createWorld([createPlayerEntity('player', x, y)]))
    }
    expect(controller.getState()).toEqual({ x: 0, y: 0 })
  })
})

// ---------------------------------------------------------------------------
// Multiple controller instances (stateless external isolation)
// ---------------------------------------------------------------------------

describe('multiple controller instances', () => {
  it('should not share state between instances', () => {
    const c1 = new DefaultCameraController()
    const c2 = new DefaultCameraController()

    c1.update(createWorld([createPlayerEntity('player', 100, 200)]))
    expect(c1.getState()).toEqual({ x: 100, y: 200 })
    expect(c2.getState()).toEqual({ x: 0, y: 0 })
  })

  it('should independently track different worlds', () => {
    const c1 = new DefaultCameraController()
    const c2 = new DefaultCameraController()

    c1.update(createWorld([createPlayerEntity('player', 50, 60)]))
    c2.update(createWorld([createPlayerEntity('player', 200, 300)]))

    expect(c1.getState()).toEqual({ x: 50, y: 60 })
    expect(c2.getState()).toEqual({ x: 200, y: 300 })
  })
})

// ---------------------------------------------------------------------------
// Camera offset (render integration behavior)
// ---------------------------------------------------------------------------

describe('camera offset', () => {
  it('should compute negative camera offset for renderer', () => {
    const controller = new DefaultCameraController()
    const world = createWorld([createPlayerEntity('player', 100, 200)])
    controller.update(world)

    // Renderer applies: container.position = (-camera.x, -camera.y)
    const offsetX = -controller.getState().x
    const offsetY = -controller.getState().y
    expect(offsetX).toBe(-100)
    expect(offsetY).toBe(-200)
  })

  it('should compute zero offset when camera at origin', () => {
    const controller = new DefaultCameraController()
    const world = createWorld([createPlayerEntity('player', 0, 0)])
    controller.update(world)

    // Use addition to avoid -0 vs 0 comparison issue
    expect(controller.getState().x + 0).toBe(0)
    expect(controller.getState().y + 0).toBe(0)
  })

  it('should compute positive offset when camera at negative', () => {
    const controller = new DefaultCameraController()
    const world = createWorld([createPlayerEntity('player', -100, -200)])
    controller.update(world)

    expect(-controller.getState().x).toBe(100)
    expect(-controller.getState().y).toBe(200)
  })
})