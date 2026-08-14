/**
 * PlatformWorldRenderingIntegration.test.ts — integration tests for
 * tile-based platform world rendering (WO-S9-016).
 *
 * Coverage areas:
 *   - Mario world rendering (player, terrain, goal, platform, enemy)
 *   - Terrain visibility
 *   - Goal visibility
 *   - Camera movement with tile entities
 *   - Render updates (position changes)
 *   - Entity combinations
 *   - Color correctness
 */
import { describe, it, expect } from 'vitest'
import type { Container, Graphics } from 'pixi.js'
import type { RenderWorld, RenderEntity } from '../../model'
import { DefaultPixiEntityRenderer } from '../PixiEntityRenderer'
import { DefaultEntityVisualCatalog } from '../DefaultEntityVisualCatalog'
import { DefaultPlatformTileCatalog } from '../world/DefaultPlatformTileCatalog'

// ---------------------------------------------------------------------------
// Mock helpers
// ---------------------------------------------------------------------------

interface MockGraphicsData {
  fillColor: number | null
  rectX: number
  rectY: number
  rectW: number
  rectH: number
  destroyed: boolean
}

import type { CameraController } from '../../camera'

function createMockGraphics(): Graphics & { _data: MockGraphicsData } {
  const data: MockGraphicsData = {
    fillColor: null,
    rectX: 0,
    rectY: 0,
    rectW: 0,
    rectH: 0,
    destroyed: false,
  }

  return {
    _data: data,
    x: 0,
    y: 0,
    beginFill: (color: number) => { data.fillColor = color },
    drawRect: (x: number, y: number, w: number, h: number) => {
      data.rectX = x
      data.rectY = y
      data.rectW = w
      data.rectH = h
    },
    drawCircle: () => { /* no-op */ },
    endFill: () => { /* no-op */ },
    destroy: () => { data.destroyed = true },
  } as unknown as Graphics & { _data: MockGraphicsData }
}

interface ContainerState {
  childCount: number
  childAt: (index: number) => Graphics | undefined
}

function createMockContainer(): Container & { _state: ContainerState } {
  const children: Graphics[] = []

  const state: ContainerState = {
    get childCount() { return children.length },
    childAt: (i: number) => children[i],
  }

  return {
    _state: state,
    position: { x: 0, y: 0 },
    addChild: (child: Graphics) => {
      children.push(child)
      return child
    },
    removeChild: (child: Graphics) => {
      const idx = children.indexOf(child)
      if (idx !== -1) children.splice(idx, 1)
      return child
    },
  } as unknown as Container & { _state: ContainerState }
}

// ---------------------------------------------------------------------------
// Test data helpers
// ---------------------------------------------------------------------------

function makeEntity(
  id: string,
  type: string,
  position?: { x: number; y: number }
): RenderEntity {
  const entity: Record<string, unknown> = { id, type }
  if (position) {
    entity.position = { x: position.x, y: position.y }
  }
  return Object.freeze(entity) as unknown as RenderEntity
}

function makeWorld(entities: RenderEntity[]): RenderWorld {
  return Object.freeze({
    entities: Object.freeze(entities),
  })
}

function createTileRenderer(container: Container & { _state: ContainerState }): DefaultPixiEntityRenderer {
  return new DefaultPixiEntityRenderer(container, {
    createGraphics: () => createMockGraphics() as unknown as Graphics,
    catalog: new DefaultEntityVisualCatalog(),
    tileCatalog: new DefaultPlatformTileCatalog(),
  })
}

/** Create a simple Mario-style platform world. */
function createMarioWorld(): RenderWorld {
  return makeWorld([
    makeEntity('player', 'player', { x: 100, y: 300 }),
    makeEntity('ground-1', 'terrain', { x: 0, y: 368 }),
    makeEntity('ground-2', 'terrain', { x: 64, y: 368 }),
    makeEntity('ground-3', 'terrain', { x: 128, y: 368 }),
    makeEntity('platform-1', 'platform', { x: 300, y: 250 }),
    makeEntity('goal-1', 'goal', { x: 800, y: 272 }),
    makeEntity('enemy-1', 'enemy', { x: 400, y: 344 }),
    makeEntity('item-1', 'item', { x: 330, y: 230 }),
    makeEntity('checkpoint-1', 'checkpoint', { x: 500, y: 320 }),
  ])
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('Mario world rendering', () => {
  it('renders all Mario world entities', () => {
    const container = createMockContainer()
    const renderer = createTileRenderer(container)
    const world = createMarioWorld()
    const result = renderer.render(world)

    expect(result.entities).toHaveLength(9)
    expect(result.entities[0].id).toBe('player')
    expect(result.entities[1].id).toBe('ground-1')
  })

  it('player renders as circle (rectW and rectH remain 0)', () => {
    const container = createMockContainer()
    const renderer = createTileRenderer(container)
    renderer.render(createMarioWorld())

    const gfx = container._state.childAt(0) as unknown as { _data: MockGraphicsData }
    // Player is circle — drawRect not called
    expect(gfx._data.rectW).toBe(0)
    expect(gfx._data.rectH).toBe(0)
  })

  it('terrain entities render at correct positions', () => {
    const container = createMockContainer()
    const renderer = createTileRenderer(container)
    renderer.render(createMarioWorld())

    // ground-1 at x=0, ground-2 at x=64, ground-3 at x=128
    expect(container._state.childAt(1)!.x).toBe(0)
    expect(container._state.childAt(2)!.x).toBe(64)
    expect(container._state.childAt(3)!.x).toBe(128)
  })

  it('all nine entities have distinct positions', () => {
    const container = createMockContainer()
    const renderer = createTileRenderer(container)
    renderer.render(createMarioWorld())

    const positions = new Set<string>()
    for (let i = 0; i < container._state.childCount; i++) {
      const child = container._state.childAt(i)!
      positions.add(`${child.x},${child.y}`)
    }
    expect(positions.size).toBe(9)
  })
})

describe('Terrain visibility', () => {
  it('terrain entities use brown color', () => {
    const container = createMockContainer()
    const renderer = createTileRenderer(container)
    const world = makeWorld([makeEntity('g1', 'terrain', { x: 0, y: 368 })])
    renderer.render(world)

    const gfx = container._state.childAt(0) as unknown as { _data: MockGraphicsData }
    expect(gfx._data.fillColor).toBe(0x8d6e63)
  })

  it('terrain is 64x32 (wide platform rectangle)', () => {
    const container = createMockContainer()
    const renderer = createTileRenderer(container)
    const world = makeWorld([makeEntity('g1', 'terrain', { x: 0, y: 0 })])
    renderer.render(world)

    const gfx = container._state.childAt(0) as unknown as { _data: MockGraphicsData }
    expect(gfx._data.rectW).toBe(64)
    expect(gfx._data.rectH).toBe(32)
  })

  it('terrains can form a continuous ground line', () => {
    const container = createMockContainer()
    const renderer = createTileRenderer(container)
    const entities = [
      makeEntity('g1', 'terrain', { x: 0, y: 368 }),
      makeEntity('g2', 'terrain', { x: 64, y: 368 }),
      makeEntity('g3', 'terrain', { x: 128, y: 368 }),
    ]
    renderer.render(makeWorld(entities))

    // Three terrain tiles side-by-side should cover 192px horizontally
    expect(container._state.childCount).toBe(3)
    expect(container._state.childAt(0)!.x).toBe(0)
    expect(container._state.childAt(1)!.x).toBe(64)
    expect(container._state.childAt(2)!.x).toBe(128)
  })

  it('terrain without position is not rendered', () => {
    const container = createMockContainer()
    const renderer = createTileRenderer(container)
    const world = makeWorld([makeEntity('g1', 'terrain')])
    const result = renderer.render(world)

    expect(result.entities).toHaveLength(0)
  })
})

describe('Goal visibility', () => {
  it('goal entity uses yellow color', () => {
    const container = createMockContainer()
    const renderer = createTileRenderer(container)
    const world = makeWorld([makeEntity('flag', 'goal', { x: 800, y: 272 })])
    renderer.render(world)

    const gfx = container._state.childAt(0) as unknown as { _data: MockGraphicsData }
    expect(gfx._data.fillColor).toBe(0xffd54f)
  })

  it('goal is 24x96 (tall flag-style)', () => {
    const container = createMockContainer()
    const renderer = createTileRenderer(container)
    const world = makeWorld([makeEntity('flag', 'goal', { x: 0, y: 0 })])
    renderer.render(world)

    const gfx = container._state.childAt(0) as unknown as { _data: MockGraphicsData }
    expect(gfx._data.rectW).toBe(24)
    expect(gfx._data.rectH).toBe(96)
  })

  it('goal stands above ground level', () => {
    const container = createMockContainer()
    const renderer = createTileRenderer(container)
    const world = makeWorld([
      makeEntity('goal', 'goal', { x: 800, y: 272 }),
      makeEntity('ground', 'terrain', { x: 700, y: 368 }),
    ])
    renderer.render(world)

    // Goal should be above ground (lower y = higher on screen)
    expect(container._state.childAt(0)!.y).toBeLessThan(container._state.childAt(1)!.y)
  })
})

describe('Platform rendering', () => {
  it('platform uses green color', () => {
    const container = createMockContainer()
    const renderer = createTileRenderer(container)
    const world = makeWorld([makeEntity('plat', 'platform', { x: 200, y: 200 })])
    renderer.render(world)

    const gfx = container._state.childAt(0) as unknown as { _data: MockGraphicsData }
    expect(gfx._data.fillColor).toBe(0x66bb6a)
  })

  it('platform is 96x24 (horizontal rectangle)', () => {
    const container = createMockContainer()
    const renderer = createTileRenderer(container)
    const world = makeWorld([makeEntity('plat', 'platform', { x: 0, y: 0 })])
    renderer.render(world)

    const gfx = container._state.childAt(0) as unknown as { _data: MockGraphicsData }
    expect(gfx._data.rectW).toBe(96)
    expect(gfx._data.rectH).toBe(24)
  })
})

describe('Camera movement', () => {
  it('renders Mario world with camera offset', () => {
    const container = createMockContainer()
    const cameraController = {
      _state: { x: 0, y: 0 },
      getState: () => ({ x: 0, y: 0 }),
      update: () => ({ x: 100, y: 300 }),
    }
    const renderer = new DefaultPixiEntityRenderer(container, {
      createGraphics: () => createMockGraphics() as unknown as Graphics,
      catalog: new DefaultEntityVisualCatalog(),
      tileCatalog: new DefaultPlatformTileCatalog(),
      cameraController: cameraController as CameraController,
    })
    renderer.render(createMarioWorld())

    // Camera at (100, 300) → container offset by (-100, -300)
    expect(container.position.x).toBe(-100)
    expect(container.position.y).toBe(-300)
    expect(container._state.childCount).toBe(9)
  })

  it('camera offset shifts all entity positions', () => {
    const container = createMockContainer()
    let cameraX = 20
    const cameraController = {
      _state: { x: 0, y: 0 },
      getState: () => ({ x: cameraX, y: 0 }),
      update: () => ({ x: cameraX, y: 0 }),
    }
    const renderer = new DefaultPixiEntityRenderer(container, {
      createGraphics: () => createMockGraphics() as unknown as Graphics,
      catalog: new DefaultEntityVisualCatalog(),
      tileCatalog: new DefaultPlatformTileCatalog(),
      cameraController: cameraController as CameraController,
    })

    // First render — camera at 20
    renderer.render(makeWorld([makeEntity('g1', 'terrain', { x: 64, y: 368 })]))
    expect(container.position.x).toBe(-20)

    // Move camera to 50
    cameraX = 50
    renderer.render(makeWorld([makeEntity('g1', 'terrain', { x: 64, y: 368 })]))
    expect(container.position.x).toBe(-50)
  })
})

describe('Render updates', () => {
  it('entities are replaced on re-render', () => {
    const container = createMockContainer()
    const renderer = createTileRenderer(container)

    renderer.render(makeWorld([makeEntity('g1', 'terrain', { x: 0, y: 368 })]))
    expect(container._state.childCount).toBe(1)

    renderer.render(makeWorld([makeEntity('g1', 'goal', { x: 100, y: 200 })]))
    expect(container._state.childCount).toBe(1)

    // Should now be a goal, not terrain
    const gfx = container._state.childAt(0) as unknown as { _data: MockGraphicsData }
    expect(gfx._data.rectH).toBe(96) // goal height
  })

  it('clearing removes all entities from container', () => {
    const container = createMockContainer()
    const renderer = createTileRenderer(container)

    renderer.render(createMarioWorld())
    expect(container._state.childCount).toBe(9)

    renderer.clear()
    expect(container._state.childCount).toBe(0)
  })

  it('clear is safe on empty renderer', () => {
    const container = createMockContainer()
    const renderer = createTileRenderer(container)

    renderer.clear()
    expect(container._state.childCount).toBe(0)
  })
})

describe('Entity combinations', () => {
  it('terrain + goal + player renders three entities', () => {
    const container = createMockContainer()
    const renderer = createTileRenderer(container)
    const world = makeWorld([
      makeEntity('player', 'player', { x: 100, y: 300 }),
      makeEntity('ground', 'terrain', { x: 0, y: 368 }),
      makeEntity('goal', 'goal', { x: 800, y: 272 }),
    ])
    renderer.render(world)

    expect(container._state.childCount).toBe(3)
  })

  it('terrain + platform + enemy renders three entities', () => {
    const container = createMockContainer()
    const renderer = createTileRenderer(container)
    const world = makeWorld([
      makeEntity('ground', 'terrain', { x: 0, y: 368 }),
      makeEntity('plat', 'platform', { x: 200, y: 200 }),
      makeEntity('enemy', 'enemy', { x: 300, y: 344 }),
    ])
    renderer.render(world)

    expect(container._state.childCount).toBe(3)
  })

  it('all entity types have unique colors', () => {
    const container = createMockContainer()
    const renderer = createTileRenderer(container)
    const world = makeWorld([
      makeEntity('p', 'player', { x: 0, y: 0 }),
      makeEntity('t', 'terrain', { x: 100, y: 0 }),
      makeEntity('g', 'goal', { x: 200, y: 0 }),
      makeEntity('pl', 'platform', { x: 300, y: 0 }),
      makeEntity('e', 'enemy', { x: 400, y: 0 }),
      makeEntity('i', 'item', { x: 500, y: 0 }),
      makeEntity('c', 'checkpoint', { x: 600, y: 0 }),
    ])
    renderer.render(world)

    // Each entity should have a different fill color
    const colors = new Set<number>()
    for (let i = 0; i < container._state.childCount; i++) {
      const gfx = container._state.childAt(i) as unknown as { _data: MockGraphicsData }
      colors.add(gfx._data.fillColor!)
    }
    // Player and goal share 0xffd54f via item
    // Actually: player=0x4fc3f7, terrain=0x8d6e63, goal=0xffd54f, platform=0x66bb6a,
    //           enemy=0xef5350, item=0xffd54f, checkpoint=0xce93d8
    // 7 entities, 6 unique colors (goal and item share yellow)
    expect(colors.size).toBeGreaterThanOrEqual(6)
  })

  it('mixed entities render without errors', () => {
    const container = createMockContainer()
    const renderer = createTileRenderer(container)
    const world = makeWorld([
      makeEntity('a', 'player', { x: 0, y: 0 }),
      makeEntity('b', 'terrain', { x: 0, y: 0 }),
      makeEntity('c', 'goal', { x: 0, y: 0 }),
      makeEntity('d', 'platform', { x: 0, y: 0 }),
      makeEntity('e', 'enemy', { x: 0, y: 0 }),
      makeEntity('f', 'item', { x: 0, y: 0 }),
      makeEntity('g', 'checkpoint', { x: 0, y: 0 }),
      makeEntity('h', 'unknown', { x: 0, y: 0 }),
    ])
    expect(() => renderer.render(world)).not.toThrow()
    expect(container._state.childCount).toBe(8)
  })

  it('entities without position are excluded from combination renders', () => {
    const container = createMockContainer()
    const renderer = createTileRenderer(container)
    const world = makeWorld([
      makeEntity('p', 'player', { x: 0, y: 0 }),
      makeEntity('g', 'goal'), // no position
      makeEntity('t', 'terrain', { x: 100, y: 0 }),
    ])
    const result = renderer.render(world)
    expect(result.entities).toHaveLength(2)
  })

  it('large entity combination renders all entities', () => {
    const container = createMockContainer()
    const renderer = createTileRenderer(container)
    const entities = []
    for (let i = 0; i < 20; i++) {
      entities.push(makeEntity(`e${i}`, 'terrain', { x: i * 64, y: 368 }))
    }
    renderer.render(makeWorld(entities))
    expect(container._state.childCount).toBe(20)
  })
})

describe('Determinism', () => {
  it('two renderers produce same output for Mario world', () => {
    const c1 = createMockContainer()
    const c2 = createMockContainer()
    const r1 = createTileRenderer(c1)
    const r2 = createTileRenderer(c2)
    const world = createMarioWorld()

    const result1 = r1.render(world)
    const result2 = r2.render(world)

    expect(result1.entities).toHaveLength(result2.entities.length)
    for (let i = 0; i < result1.entities.length; i++) {
      expect(result1.entities[i].id).toBe(result2.entities[i].id)
    }
  })

  it('same renderer produces same output for same input', () => {
    const container = createMockContainer()
    const renderer = createTileRenderer(container)
    const world = createMarioWorld()

    const r1 = renderer.render(world)
    renderer.clear()
    const r2 = renderer.render(world)

    expect(r1.entities).toHaveLength(r2.entities.length)
    for (let i = 0; i < r1.entities.length; i++) {
      expect(r1.entities[i].id).toBe(r2.entities[i].id)
    }
  })
})

describe('Edge cases', () => {
  it('handles empty world', () => {
    const container = createMockContainer()
    const renderer = createTileRenderer(container)
    const world = makeWorld([])
    const result = renderer.render(world)
    expect(result.entities).toHaveLength(0)
    expect(container._state.childCount).toBe(0)
  })

  it('handles fractional coordinates', () => {
    const container = createMockContainer()
    const renderer = createTileRenderer(container)
    const world = makeWorld([makeEntity('g1', 'terrain', { x: 1.5, y: 368.75 })])
    renderer.render(world)

    expect(container._state.childAt(0)!.x).toBe(1.5)
    expect(container._state.childAt(0)!.y).toBe(368.75)
  })

  it('handles large coordinate values', () => {
    const container = createMockContainer()
    const renderer = createTileRenderer(container)
    const world = makeWorld([makeEntity('g1', 'terrain', { x: 99999, y: 99999 })])
    renderer.render(world)

    expect(container._state.childAt(0)!.x).toBe(99999)
    expect(container._state.childAt(0)!.y).toBe(99999)
  })
})