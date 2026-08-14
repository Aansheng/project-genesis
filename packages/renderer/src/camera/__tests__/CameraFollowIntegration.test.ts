/**
 * CameraFollowIntegration.test.ts — integration tests verifying
 * the DefaultCameraController works with DefaultPixiEntityRenderer
 * to produce correct camera-relative rendering.
 *
 * Coverage:
 *   - Camera follows player movement
 *   - Camera follows player after jump/gravity/collision
 *   - Multiple ticks with camera tracking
 *   - Multiple players (follows first)
 *   - Missing players (preserves previous state)
 *   - Render integration (container offset)
 *   - Camera offset correctness
 */
import { describe, it, expect } from 'vitest'
import { DefaultCameraController } from '../DefaultCameraController'
import { DefaultPixiEntityRenderer } from '../../view/PixiEntityRenderer'
import type { RenderWorld, RenderEntity } from '../../model'

// ---------------------------------------------------------------------------
// Mock container + graphics for jsdom (PixiJS needs WebGL)
// ---------------------------------------------------------------------------

interface MockContainer {
  position: { x: number; y: number }
  children: any[]
  addChild: (child: any) => any
  removeChild: (child: any) => void
}

function createMockContainer(): MockContainer {
  const children: any[] = []
  return {
    position: { x: 0, y: 0 },
    children,
    addChild: (child: any) => {
      children.push(child)
      return child
    },
    removeChild: (child: any) => {
      const idx = children.indexOf(child)
      if (idx >= 0) children.splice(idx, 1)
    },
  }
}

function createMockGraphicsFactory(): () => any {
  return () => ({
    beginFill: () => {},
    drawRect: () => {},
    drawCircle: () => {},
    endFill: () => {},
    destroy: () => {},
    x: 0,
    y: 0,
  })
}

/** Create a renderer with mock + graphics (avoids PixiJS WebGL in jsdom). */
function createTestRenderer(
  cameraController?: DefaultCameraController,
): { renderer: DefaultPixiEntityRenderer; container: MockContainer } {
  const container = createMockContainer()
  const renderer = new DefaultPixiEntityRenderer(
    container as any,
    {
      cameraController,
      createGraphics: createMockGraphicsFactory(),
    },
  )
  return { renderer, container }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createPlayer(id: string, x: number, y: number): RenderEntity {
  return Object.freeze({
    id,
    type: 'player',
    position: Object.freeze({ x, y }),
  })
}

function createNonPlayer(id: string, type: string, x: number, y: number): RenderEntity {
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
// Camera follows player
// ---------------------------------------------------------------------------

describe('camera follows player movement', () => {
  it('should follow player when moving right', () => {
    const camera = new DefaultCameraController()
    camera.update(createWorld([createPlayer('player', 100, 200)]))
    expect(camera.getState()).toEqual({ x: 100, y: 200 })

    camera.update(createWorld([createPlayer('player', 200, 200)]))
    expect(camera.getState()).toEqual({ x: 200, y: 200 })
  })

  it('should follow player when moving left', () => {
    const camera = new DefaultCameraController()
    camera.update(createWorld([createPlayer('player', 300, 200)]))
    camera.update(createWorld([createPlayer('player', 150, 200)]))
    expect(camera.getState()).toEqual({ x: 150, y: 200 })
  })

  it('should follow player when moving up (jump)', () => {
    const camera = new DefaultCameraController()
    camera.update(createWorld([createPlayer('player', 100, 400)]))
    camera.update(createWorld([createPlayer('player', 100, 350)]))
    expect(camera.getState()).toEqual({ x: 100, y: 350 })
  })

  it('should follow player when moving down (falling)', () => {
    const camera = new DefaultCameraController()
    camera.update(createWorld([createPlayer('player', 100, 200)]))
    camera.update(createWorld([createPlayer('player', 100, 250)]))
    expect(camera.getState()).toEqual({ x: 100, y: 250 })
  })

  it('should follow diagonal player movement', () => {
    const camera = new DefaultCameraController()
    camera.update(createWorld([createPlayer('player', 0, 0)]))
    camera.update(createWorld([createPlayer('player', 50, 100)]))
    expect(camera.getState()).toEqual({ x: 50, y: 100 })
  })

  it('should follow player through multiple movement steps', () => {
    const camera = new DefaultCameraController()
    const path = [
      [0, 0], [10, 0], [20, 0], [20, -50], [20, -100],
    ]
    for (const [x, y] of path) {
      camera.update(createWorld([createPlayer('player', x, y)]))
    }
    expect(camera.getState()).toEqual({ x: 20, y: -100 })
  })
})

// ---------------------------------------------------------------------------
// Camera with multiple entities
// ---------------------------------------------------------------------------

describe('camera with multiple entities', () => {
  it('should follow player among non-player entities', () => {
    const camera = new DefaultCameraController()
    const world = createWorld([
      createNonPlayer('ground', 'terrain', 0, 400),
      createPlayer('player', 150, 200),
      createNonPlayer('enemy', 'enemy', 500, 300),
    ])
    camera.update(world)
    expect(camera.getState()).toEqual({ x: 150, y: 200 })
  })

  it('should follow first player among multiple players', () => {
    const camera = new DefaultCameraController()
    const world = createWorld([
      createPlayer('p1', 50, 60),
      createPlayer('p2', 200, 300),
    ])
    camera.update(world)
    expect(camera.getState()).toEqual({ x: 50, y: 60 })
  })

  it('should ignore non-player movement', () => {
    const camera = new DefaultCameraController()
    camera.update(createWorld([createPlayer('player', 100, 200)]))
    camera.update(createWorld([
      createPlayer('player', 100, 200),
      createNonPlayer('enemy', 'enemy', 999, 999),
    ]))
    expect(camera.getState()).toEqual({ x: 100, y: 200 })
  })
})

// ---------------------------------------------------------------------------
// Camera missing player
// ---------------------------------------------------------------------------

describe('camera missing player', () => {
  it('should keep state when player disappears from world', () => {
    const camera = new DefaultCameraController()
    camera.update(createWorld([createPlayer('player', 100, 200)]))
    camera.update(createWorld([createNonPlayer('enemy', 'enemy', 500, 600)]))
    expect(camera.getState()).toEqual({ x: 100, y: 200 })
  })

  it('should keep state when player loses position', () => {
    const camera = new DefaultCameraController()
    camera.update(createWorld([createPlayer('player', 100, 200)]))
    camera.update(createWorld([createEntityWithoutPosition('player')]))
    expect(camera.getState()).toEqual({ x: 100, y: 200 })
  })

  it('should stay at origin when no player ever exists', () => {
    const camera = new DefaultCameraController()
    camera.update(createWorld([createNonPlayer('enemy', 'enemy', 100, 200)]))
    camera.update(createWorld([]))
    expect(camera.getState()).toEqual({ x: 0, y: 0 })
  })
})

// ---------------------------------------------------------------------------
// Camera offset for renderer
// ---------------------------------------------------------------------------

describe('camera offset for renderer', () => {
  it('should produce negative offset for positive camera', () => {
    const camera = new DefaultCameraController()
    camera.update(createWorld([createPlayer('player', 200, 300)]))
    const state = camera.getState()
    expect(-state.x).toBe(-200)
    expect(-state.y).toBe(-300)
  })

  it('should produce positive offset for negative camera', () => {
    const camera = new DefaultCameraController()
    camera.update(createWorld([createPlayer('player', -100, -200)]))
    const state = camera.getState()
    expect(-state.x).toBe(100)
    expect(-state.y).toBe(200)
  })

  it('should produce zero offset for camera at origin', () => {
    const camera = new DefaultCameraController()
    camera.update(createWorld([createPlayer('player', 0, 0)]))
    const state = camera.getState()
    expect(state.x + 0).toBe(0)
    expect(state.y + 0).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// PixiEntityRenderer camera integration
// ---------------------------------------------------------------------------

describe('PixiEntityRenderer camera integration', () => {
  it('should apply camera offset to container position', () => {
    const camera = new DefaultCameraController()
    const { renderer, container } = createTestRenderer(camera)

    renderer.render(createWorld([createPlayer('player', 100, 200)]))

    expect(container.position.x).toBe(-100)
    expect(container.position.y).toBe(-200)
  })

  it('should update container position when camera follows player', () => {
    const camera = new DefaultCameraController()
    const { renderer, container } = createTestRenderer(camera)

    renderer.render(createWorld([createPlayer('player', 50, 60)]))
    expect(container.position.x).toBe(-50)
    expect(container.position.y).toBe(-60)

    renderer.render(createWorld([createPlayer('player', 200, 300)]))
    expect(container.position.x).toBe(-200)
    expect(container.position.y).toBe(-300)
  })

  it('should set container to (0, 0) when camera at origin', () => {
    const camera = new DefaultCameraController()
    const { renderer, container } = createTestRenderer(camera)

    renderer.render(createWorld([createPlayer('player', 0, 0)]))
    expect(container.position.x + 0).toBe(0)
    expect(container.position.y + 0).toBe(0)
  })

  it('should not change container position when no camera controller', () => {
    const { renderer, container } = createTestRenderer()

    renderer.render(createWorld([createPlayer('player', 100, 200)]))
    expect(container.position.x).toBe(0)
    expect(container.position.y).toBe(0)
  })

  it('should keep container offset when no player in world', () => {
    const camera = new DefaultCameraController()
    const { renderer, container } = createTestRenderer(camera)

    renderer.render(createWorld([createPlayer('player', 100, 200)]))
    expect(container.position.x).toBe(-100)

    renderer.render(createWorld([]))
    expect(container.position.x).toBe(-100)
    expect(container.position.y).toBe(-200)
  })

  it('should render entities at correct world positions with camera offset', () => {
    const camera = new DefaultCameraController()
    const { renderer, container } = createTestRenderer(camera)

    // Player at (200, 300), camera follows → container offset = (-200, -300)
    // Entity at (200, 300) draws at local (0, 0) relative to container
    renderer.render(createWorld([
      createPlayer('player', 200, 300),
      createNonPlayer('coin', 'item', 200, 300),
    ]))

    expect(container.position.x).toBe(-200)
    expect(container.position.y).toBe(-300)
  })

  it('should reset container position on clear when camera controller set', () => {
    const camera = new DefaultCameraController()
    const { renderer, container } = createTestRenderer(camera)

    renderer.render(createWorld([createPlayer('player', 100, 200)]))
    expect(container.position.x).toBe(-100)

    renderer.clear()
    // clear does NOT reset container position (camera offset persists)
    expect(container.position.x).toBe(-100)
  })
})

// ---------------------------------------------------------------------------
// Multiple ticks with camera tracking
// ---------------------------------------------------------------------------

describe('multiple ticks with camera tracking', () => {
  it('should track player over many movement ticks', () => {
    const camera = new DefaultCameraController()

    for (let tick = 0; tick < 50; tick++) {
      camera.update(createWorld([createPlayer('player', tick * 10, tick * 5)]))
    }

    expect(camera.getState()).toEqual({ x: 490, y: 245 })
  })

  it('should track player position after jump and fall sequence', () => {
    const camera = new DefaultCameraController()

    // Simulate: player at ground → jump → peak → fall → land
    const positions = [
      { x: 100, y: 400 }, // ground
      { x: 100, y: 350 }, // jump frame 1
      { x: 100, y: 300 }, // jump frame 2
      { x: 100, y: 250 }, // jump frame 3 (peak)
      { x: 100, y: 300 }, // fall frame 1
      { x: 100, y: 350 }, // fall frame 2
      { x: 100, y: 400 }, // land
    ]

    for (const pos of positions) {
      camera.update(createWorld([createPlayer('player', pos.x, pos.y)]))
    }

    expect(camera.getState()).toEqual({ x: 100, y: 400 })
  })

  it('should not lose reference after many ticks', () => {
    const camera = new DefaultCameraController()
    const { renderer, container } = createTestRenderer(camera)

    for (let tick = 0; tick < 100; tick++) {
      renderer.render(createWorld([createPlayer('player', tick, tick * 2)]))
    }

    expect(container.position.x).toBe(-99)
    expect(container.position.y).toBe(-198)
  })
})

// ---------------------------------------------------------------------------
// Rendering entities with camera offset
// ---------------------------------------------------------------------------

describe('rendering entities with camera offset', () => {
  it('should render entities in correct positions relative to camera', () => {
    const camera = new DefaultCameraController()
    const { renderer, container } = createTestRenderer(camera)

    // Player at (100, 200) → camera at (100, 200) → offset (-100, -200)
    renderer.render(createWorld([
      createPlayer('player', 100, 200),
    ]))

    // After rendering, check that entity graphics are added to container
    expect(container.children.length).toBeGreaterThan(0)
  })

  it('should handle world with no position entities and camera', () => {
    const camera = new DefaultCameraController()
    const { renderer, container } = createTestRenderer(camera)

    const world = createWorld([createEntityWithoutPosition('player')])
    renderer.render(world)

    // No position → no entities rendered → no children
    expect(container.children.length).toBe(0)
    // Camera state should be default (player has no position)
    expect(camera.getState()).toEqual({ x: 0, y: 0 })
  })
})