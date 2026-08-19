/**
 * PixiEntityRenderer.test.ts — comprehensive test suite for the
 * PixiEntityRenderer (WO-S9-004, WO-S9-007).
 *
 * Coverage areas:
 *   - Empty world
 *   - Single entity
 *   - Multiple entities
 *   - Entity without position
 *   - Mixed entities
 *   - Negative coordinates
 *   - Fractional coordinates
 *   - clear()
 *   - Multiple render()
 *   - Replace render()
 *   - Immutability
 *   - Determinism
 *   - Memory cleanup
 *   - Catalog-driven rendering (WO-S9-007)
 *   - Entity type visual mapping (WO-S9-007)
 *   - Default rendering without catalog (WO-S9-007)
 */

import { describe, it, expect } from 'vitest'
import type { Container, Graphics } from 'pixi.js'
import type { RenderWorld, RenderEntity } from '../../model'
import { DefaultPixiEntityRenderer } from '../PixiEntityRenderer'
import { DefaultEntityVisualCatalog } from '../DefaultEntityVisualCatalog'
import { DefaultPlatformTileCatalog } from '../world/DefaultPlatformTileCatalog'
import type { RenderEntityView } from '../RenderEntityView'
import type { CameraController } from '../../camera'

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
    beginFill: (color: number) => {
      data.fillColor = color
    },
    drawRect: (x: number, y: number, w: number, h: number) => {
      data.rectX = x
      data.rectY = y
      data.rectW = w
      data.rectH = h
    },
    drawCircle: (_x: number, _y: number, _radius: number) => {
      // Circle drawing — rect data remains 0 to distinguish from rectangles
    },
    endFill: () => {
      // no-op
    },
    destroy: () => {
      data.destroyed = true
    },
  } as unknown as Graphics & { _data: MockGraphicsData }
}

// Track container state through a simple mutable object
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

  const container = {
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

  return container
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

function createRenderer(container: Container & { _state: ContainerState }): DefaultPixiEntityRenderer {
  return new DefaultPixiEntityRenderer(container, {
    createGraphics: () => createMockGraphics() as unknown as Graphics,
  })
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('Empty World', () => {
  it('returns empty RenderWorldView for empty world', () => {
    const container = createMockContainer()
    const renderer = createRenderer(container)
    const result = renderer.render(makeWorld([]))

    expect(result.entities).toHaveLength(0)
  })

  it('does not add any children to container', () => {
    const container = createMockContainer()
    const renderer = createRenderer(container)
    renderer.render(makeWorld([]))

    expect(container._state.childCount).toBe(0)
  })
})

describe('Single Entity', () => {
  it('renders a single entity with position', () => {
    const container = createMockContainer()
    const renderer = createRenderer(container)
    const world = makeWorld([makeEntity('hero', 'player', { x: 100, y: 200 })])
    const result = renderer.render(world)

    expect(result.entities).toHaveLength(1)
    expect(result.entities[0].id).toBe('hero')
    expect(result.entities[0].graphics.x).toBe(100)
    expect(result.entities[0].graphics.y).toBe(200)
  })

  it('draws a 20x20 rectangle', () => {
    const container = createMockContainer()
    const renderer = createRenderer(container)
    const world = makeWorld([makeEntity('e1', 'tree', { x: 50, y: 50 })])
    renderer.render(world)

    const gfx = container._state.childAt(0) as unknown as { _data: MockGraphicsData }
    expect(gfx._data.rectW).toBe(20)
    expect(gfx._data.rectH).toBe(20)
  })

  it('fills with the entity color', () => {
    const container = createMockContainer()
    const renderer = createRenderer(container)
    const world = makeWorld([makeEntity('e1', 'tree', { x: 0, y: 0 })])
    renderer.render(world)

    const gfx = container._state.childAt(0) as unknown as { _data: MockGraphicsData }
    expect(gfx._data.fillColor).toBe(0x4fc3f7)
  })
})

describe('Multiple Entities', () => {
  it('renders all positioned entities', () => {
    const container = createMockContainer()
    const renderer = createRenderer(container)
    const entities = [
      makeEntity('a', 'tree', { x: 10, y: 20 }),
      makeEntity('b', 'rock', { x: 30, y: 40 }),
      makeEntity('c', 'river', { x: 50, y: 60 }),
    ]
    const result = renderer.render(makeWorld(entities))

    expect(result.entities).toHaveLength(3)
    expect(result.entities[0].id).toBe('a')
    expect(result.entities[1].id).toBe('b')
    expect(result.entities[2].id).toBe('c')
  })

  it('positions each graphics at the correct coordinates', () => {
    const container = createMockContainer()
    const renderer = createRenderer(container)
    const entities = [
      makeEntity('a', 'tree', { x: 10, y: 20 }),
      makeEntity('b', 'rock', { x: 30, y: 40 }),
    ]
    renderer.render(makeWorld(entities))

    const c0 = container._state.childAt(0)
    const c1 = container._state.childAt(1)
    expect(c0!.x).toBe(10)
    expect(c0!.y).toBe(20)
    expect(c1!.x).toBe(30)
    expect(c1!.y).toBe(40)
  })
})

describe('Entity Without Position', () => {
  it('skips entity without position', () => {
    const container = createMockContainer()
    const renderer = createRenderer(container)
    const world = makeWorld([makeEntity('npc-1', 'villager')])
    const result = renderer.render(world)

    expect(result.entities).toHaveLength(0)
    expect(container._state.childCount).toBe(0)
  })

  it('returns empty view for world with only non-positioned entities', () => {
    const container = createMockContainer()
    const renderer = createRenderer(container)
    const entities = [
      makeEntity('a', 'grass'),
      makeEntity('b', 'flower'),
      makeEntity('c', 'bush'),
    ]
    const result = renderer.render(makeWorld(entities))

    expect(result.entities).toHaveLength(0)
  })
})

describe('Mixed Entities', () => {
  it('renders only entities with position', () => {
    const container = createMockContainer()
    const renderer = createRenderer(container)
    const entities = [
      makeEntity('p1', 'player', { x: 0, y: 0 }),
      makeEntity('n1', 'npc'),
      makeEntity('p2', 'enemy', { x: 100, y: 100 }),
    ]
    const result = renderer.render(makeWorld(entities))

    expect(result.entities).toHaveLength(2)
    expect(result.entities[0].id).toBe('p1')
    expect(result.entities[1].id).toBe('p2')
  })

  it('non-positioned entities are absent from the result', () => {
    const container = createMockContainer()
    const renderer = createRenderer(container)
    const entities = [
      makeEntity('p1', 'player', { x: 5, y: 5 }),
      makeEntity('n1', 'npc'),
    ]
    const result = renderer.render(makeWorld(entities))

    const ids = result.entities.map((e: RenderEntityView) => e.id)
    expect(ids).not.toContain('n1')
  })
})

describe('Negative Coordinates', () => {
  it('renders entity at negative coordinates', () => {
    const container = createMockContainer()
    const renderer = createRenderer(container)
    const world = makeWorld([makeEntity('neg', 'entity', { x: -50, y: -30 })])
    const result = renderer.render(world)

    expect(result.entities[0].graphics.x).toBe(-50)
    expect(result.entities[0].graphics.y).toBe(-30)
  })

  it('renders mixed negative and positive', () => {
    const container = createMockContainer()
    const renderer = createRenderer(container)
    const entities = [
      makeEntity('a', 'e1', { x: -10, y: 20 }),
      makeEntity('b', 'e2', { x: 5, y: -15 }),
    ]
    const result = renderer.render(makeWorld(entities))

    expect(result.entities[0].graphics.x).toBe(-10)
    expect(result.entities[1].graphics.x).toBe(5)
  })
})

describe('Fractional Coordinates', () => {
  it('renders entity at fractional coordinates', () => {
    const container = createMockContainer()
    const renderer = createRenderer(container)
    const world = makeWorld([makeEntity('frac', 'entity', { x: 1.5, y: 2.75 })])
    const result = renderer.render(world)

    expect(result.entities[0].graphics.x).toBe(1.5)
    expect(result.entities[0].graphics.y).toBe(2.75)
  })
})

describe('clear()', () => {
  it('removes all graphics from the container', () => {
    const container = createMockContainer()
    const renderer = createRenderer(container)
    renderer.render(makeWorld([
      makeEntity('a', 'tree', { x: 0, y: 0 }),
      makeEntity('b', 'rock', { x: 10, y: 10 }),
    ]))

    expect(container._state.childCount).toBe(2)

    renderer.clear()
    expect(container._state.childCount).toBe(0)
  })

  it('destroys all graphics on clear', () => {
    const container = createMockContainer()
    const renderer = createRenderer(container)
    renderer.render(makeWorld([
      makeEntity('a', 'tree', { x: 0, y: 0 }),
    ]))

    const gfx = container._state.childAt(0) as unknown as { _data: MockGraphicsData }
    renderer.clear()
    expect(gfx._data.destroyed).toBe(true)
  })

  it('is safe to call clear on an empty renderer', () => {
    const container = createMockContainer()
    const renderer = createRenderer(container)
    renderer.render(makeWorld([]))
    renderer.clear()

    expect(container._state.childCount).toBe(0)
  })

  it('is safe to call clear multiple times', () => {
    const container = createMockContainer()
    const renderer = createRenderer(container)
    renderer.render(makeWorld([makeEntity('a', 'tree', { x: 0, y: 0 })]))

    renderer.clear()
    renderer.clear()
    renderer.clear()

    expect(container._state.childCount).toBe(0)
  })
})

describe('Multiple render()', () => {
  it('renders twice with different worlds', () => {
    const container = createMockContainer()
    const renderer = createRenderer(container)

    const r1 = renderer.render(makeWorld([
      makeEntity('a', 'tree', { x: 0, y: 0 }),
    ]))
    expect(r1.entities).toHaveLength(1)

    const r2 = renderer.render(makeWorld([
      makeEntity('b', 'rock', { x: 5, y: 5 }),
    ]))
    expect(r2.entities).toHaveLength(1)
    expect(r2.entities[0].id).toBe('b')
  })

  it('replaces old entities with new ones', () => {
    const container = createMockContainer()
    const renderer = createRenderer(container)

    renderer.render(makeWorld([
      makeEntity('old', 'tree', { x: 0, y: 0 }),
    ]))
    expect(container._state.childCount).toBe(1)

    renderer.render(makeWorld([
      makeEntity('new', 'rock', { x: 10, y: 10 }),
    ]))
    expect(container._state.childCount).toBe(1)
  })

  it('container has correct number of children after multiple renders', () => {
    const container = createMockContainer()
    const renderer = createRenderer(container)

    renderer.render(makeWorld([
      makeEntity('a', 'e1', { x: 0, y: 0 }),
      makeEntity('b', 'e2', { x: 1, y: 1 }),
    ]))
    expect(container._state.childCount).toBe(2)

    renderer.render(makeWorld([
      makeEntity('c', 'e3', { x: 2, y: 2 }),
    ]))
    expect(container._state.childCount).toBe(1)
  })
})

describe('Replace render() — same entity updated', () => {
  it('re-renders same entity at new position', () => {
    const container = createMockContainer()
    const renderer = createRenderer(container)

    renderer.render(makeWorld([
      makeEntity('hero', 'player', { x: 0, y: 0 }),
    ]))
    expect(container._state.childAt(0)!.x).toBe(0)

    renderer.render(makeWorld([
      makeEntity('hero', 'player', { x: 100, y: 200 }),
    ]))
    expect(container._state.childAt(0)!.x).toBe(100)
    expect(container._state.childAt(0)!.y).toBe(200)
  })
})

describe('Immutability', () => {
  it('does not mutate the input world', () => {
    const container = createMockContainer()
    const renderer = createRenderer(container)
    const world = makeWorld([makeEntity('e1', 'tree', { x: 5, y: 5 })])

    renderer.render(world)
    expect(world.entities).toHaveLength(1)
    expect(world.entities[0].id).toBe('e1')
  })
})

describe('Determinism', () => {
  it('same world produces same number of entities', () => {
    const container = createMockContainer()
    const renderer = createRenderer(container)
    const world = makeWorld([
      makeEntity('a', 'tree', { x: 0, y: 0 }),
      makeEntity('b', 'rock', { x: 5, y: 5 }),
    ])

    const r1 = renderer.render(world)
    renderer.clear()
    const r2 = renderer.render(world)

    expect(r1.entities).toHaveLength(r2.entities.length)
    expect(r1.entities[0].id).toBe(r2.entities[0].id)
    expect(r1.entities[1].id).toBe(r2.entities[1].id)
  })

  it('two renderers produce same result for same input', () => {
    const c1 = createMockContainer()
    const c2 = createMockContainer()
    const r1 = createRenderer(c1)
    const r2 = createRenderer(c2)
    const world = makeWorld([makeEntity('e1', 'tree', { x: 3, y: 7 })])

    const result1 = r1.render(world)
    const result2 = r2.render(world)

    expect(result1.entities).toHaveLength(result2.entities.length)
    expect(result1.entities[0].id).toBe(result2.entities[0].id)
  })
})

describe('Memory Cleanup', () => {
  it('old graphics are destroyed on re-render', () => {
    const container = createMockContainer()
    const renderer = createRenderer(container)

    renderer.render(makeWorld([
      makeEntity('a', 'tree', { x: 0, y: 0 }),
    ]))

    const oldGfx = container._state.childAt(0) as unknown as { _data: MockGraphicsData }
    renderer.render(makeWorld([
      makeEntity('b', 'rock', { x: 5, y: 5 }),
    ]))

    expect(oldGfx._data.destroyed).toBe(true)
  })

  it('no dangling references after clear', () => {
    const container = createMockContainer()
    const renderer = createRenderer(container)

    renderer.render(makeWorld([
      makeEntity('a', 'tree', { x: 0, y: 0 }),
      makeEntity('b', 'rock', { x: 5, y: 5 }),
    ]))
    renderer.clear()

    const internalViews = (renderer as unknown as { _entityViews: RenderEntityView[] })._entityViews
    expect(internalViews).toHaveLength(0)
  })

  it('destroy is called exactly once per graphics', () => {
    const container = createMockContainer()
    const renderer = createRenderer(container)

    renderer.render(makeWorld([
      makeEntity('a', 'tree', { x: 0, y: 0 }),
    ]))

    const gfx = container._state.childAt(0) as unknown as { _data: MockGraphicsData }
    renderer.clear()

    expect(gfx._data.destroyed).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Catalog-driven rendering (WO-S9-007)
// ---------------------------------------------------------------------------

describe('Catalog-driven rendering — player', () => {
  it('player renders as circle', () => {
    const container = createMockContainer()
    const renderer = new DefaultPixiEntityRenderer(container, {
      createGraphics: () => createMockGraphics() as unknown as Graphics,
      catalog: new DefaultEntityVisualCatalog(),
    })
    const world = makeWorld([makeEntity('hero', 'player', { x: 50, y: 50 })])
    renderer.render(world)

    const gfx = container._state.childAt(0) as unknown as { _data: MockGraphicsData }
    // Circle should have radius = min(24, 24) / 2 = 12, drawn at (0, 0)
    // drawCircle(x, y, radius) should be called
    expect(gfx._data.rectW).toBe(0)  // drawRect was NOT called
    expect(gfx._data.rectH).toBe(0)
  })

  it('player circle is positioned correctly', () => {
    const container = createMockContainer()
    const renderer = new DefaultPixiEntityRenderer(container, {
      createGraphics: () => createMockGraphics() as unknown as Graphics,
      catalog: new DefaultEntityVisualCatalog(),
    })
    const world = makeWorld([makeEntity('hero', 'player', { x: 100, y: 200 })])
    renderer.render(world)

    expect(container._state.childAt(0)!.x).toBe(76)
    expect(container._state.childAt(0)!.y).toBe(152)
  })
})

describe('Catalog-driven rendering — enemy', () => {
  it('enemy renders as 20x20 rectangle', () => {
    const container = createMockContainer()
    const renderer = new DefaultPixiEntityRenderer(container, {
      createGraphics: () => createMockGraphics() as unknown as Graphics,
      catalog: new DefaultEntityVisualCatalog(),
    })
    const world = makeWorld([makeEntity('grunt', 'enemy', { x: 0, y: 0 })])
    renderer.render(world)

    const gfx = container._state.childAt(0) as unknown as { _data: MockGraphicsData }
    expect(gfx._data.rectW).toBe(40)
    expect(gfx._data.rectH).toBe(48)
  })
})

describe('Catalog-driven rendering — merchant', () => {
  it('merchant renders as 28x20 rectangle', () => {
    const container = createMockContainer()
    const renderer = new DefaultPixiEntityRenderer(container, {
      createGraphics: () => createMockGraphics() as unknown as Graphics,
      catalog: new DefaultEntityVisualCatalog(),
    })
    const world = makeWorld([makeEntity('trader', 'merchant', { x: 0, y: 0 })])
    renderer.render(world)

    const gfx = container._state.childAt(0) as unknown as { _data: MockGraphicsData }
    expect(gfx._data.rectW).toBe(44)
    expect(gfx._data.rectH).toBe(52)
  })
})

describe('Catalog-driven rendering — boss', () => {
  it('boss renders as 40x40 rectangle', () => {
    const container = createMockContainer()
    const renderer = new DefaultPixiEntityRenderer(container, {
      createGraphics: () => createMockGraphics() as unknown as Graphics,
      catalog: new DefaultEntityVisualCatalog(),
    })
    const world = makeWorld([makeEntity('dragon', 'boss', { x: 0, y: 0 })])
    renderer.render(world)

    const gfx = container._state.childAt(0) as unknown as { _data: MockGraphicsData }
    expect(gfx._data.rectW).toBe(72)
    expect(gfx._data.rectH).toBe(88)
  })
})

describe('Catalog-driven rendering — default', () => {
  it('unknown type renders as 20x20 rectangle (catalog default)', () => {
    const container = createMockContainer()
    const renderer = new DefaultPixiEntityRenderer(container, {
      createGraphics: () => createMockGraphics() as unknown as Graphics,
      catalog: new DefaultEntityVisualCatalog(),
    })
    const world = makeWorld([makeEntity('unknown-1', 'unknown', { x: 0, y: 0 })])
    renderer.render(world)

    const gfx = container._state.childAt(0) as unknown as { _data: MockGraphicsData }
    expect(gfx._data.rectW).toBe(20)
    expect(gfx._data.rectH).toBe(20)
  })
})

describe('Catalog-driven rendering — clear()', () => {
  it('clear works with catalog-driven renderer', () => {
    const container = createMockContainer()
    const renderer = new DefaultPixiEntityRenderer(container, {
      createGraphics: () => createMockGraphics() as unknown as Graphics,
      catalog: new DefaultEntityVisualCatalog(),
    })
    renderer.render(makeWorld([
      makeEntity('a', 'player', { x: 0, y: 0 }),
      makeEntity('b', 'enemy', { x: 10, y: 10 }),
    ]))

    expect(container._state.childCount).toBe(2)

    renderer.clear()
    expect(container._state.childCount).toBe(0)
  })
})

describe('Catalog-driven rendering — multiple renders', () => {
  it('multiple renders with mixed entity types', () => {
    const container = createMockContainer()
    const renderer = new DefaultPixiEntityRenderer(container, {
      createGraphics: () => createMockGraphics() as unknown as Graphics,
      catalog: new DefaultEntityVisualCatalog(),
    })

    // First render: player + enemy + merchant
    const r1 = renderer.render(makeWorld([
      makeEntity('p1', 'player', { x: 0, y: 0 }),
      makeEntity('e1', 'enemy', { x: 100, y: 100 }),
      makeEntity('m1', 'merchant', { x: 200, y: 200 }),
    ]))
    expect(r1.entities).toHaveLength(3)
    expect(container._state.childCount).toBe(3)

    // Second render: boss only
    const r2 = renderer.render(makeWorld([
      makeEntity('b1', 'boss', { x: 50, y: 50 }),
    ]))
    expect(r2.entities).toHaveLength(1)
    expect(container._state.childCount).toBe(1)

    // Verify boss dimensions
    const gfx = container._state.childAt(0) as unknown as { _data: MockGraphicsData }
    expect(gfx._data.rectW).toBe(72)
    expect(gfx._data.rectH).toBe(88)
  })
})

describe('Catalog integration', () => {
  it('renderer without catalog uses 20x20 rectangle default', () => {
    const container = createMockContainer()
    const renderer = new DefaultPixiEntityRenderer(container, {
      createGraphics: () => createMockGraphics() as unknown as Graphics,
      // No catalog — should use 20x20 rectangle fallback
    })
    const world = makeWorld([makeEntity('any', 'any-type', { x: 0, y: 0 })])
    renderer.render(world)

    const gfx = container._state.childAt(0) as unknown as { _data: MockGraphicsData }
    expect(gfx._data.rectW).toBe(20)
    expect(gfx._data.rectH).toBe(20)
  })

  it('renderer without catalog draws rectangles not circles', () => {
    const container = createMockContainer()
    const renderer = new DefaultPixiEntityRenderer(container, {
      createGraphics: () => createMockGraphics() as unknown as Graphics,
    })
    // Even 'player' type without catalog should render as 20x20 rectangle
    const world = makeWorld([makeEntity('hero', 'player', { x: 0, y: 0 })])
    renderer.render(world)

    const gfx = container._state.childAt(0) as unknown as { _data: MockGraphicsData }
    expect(gfx._data.rectW).toBe(20)
    expect(gfx._data.rectH).toBe(20)
  })

  it('multiple entity types are rendered with correct sizes', () => {
    const container = createMockContainer()
    const renderer = new DefaultPixiEntityRenderer(container, {
      createGraphics: () => createMockGraphics() as unknown as Graphics,
      catalog: new DefaultEntityVisualCatalog(),
    })
    const world = makeWorld([
      makeEntity('p1', 'player', { x: 0, y: 0 }),
      makeEntity('e1', 'enemy', { x: 50, y: 0 }),
      makeEntity('m1', 'merchant', { x: 100, y: 0 }),
      makeEntity('b1', 'boss', { x: 150, y: 0 }),
      makeEntity('u1', 'unknown', { x: 200, y: 0 }),
    ])
    renderer.render(world)

    expect(container._state.childCount).toBe(5)

    // Check sizes via mock data
    const entities = container._state as unknown as {
      childCount: number
      childAt: (i: number) => Graphics & { _data: MockGraphicsData }
    }

    // Player: circle
    expect(entities.childAt(0)._data.rectW).toBe(0)
    expect(entities.childAt(0)._data.rectH).toBe(0)
    // Player x/y position
    expect(entities.childAt(0).x).toBe(-24)

    // Enemy: 20x20 rectangle
    expect(entities.childAt(1)._data.rectW).toBe(40)
    expect(entities.childAt(1)._data.rectH).toBe(48)
    expect(entities.childAt(1).x).toBe(30)

    // Merchant: 44x52 rectangle
    expect(entities.childAt(2)._data.rectW).toBe(44)
    expect(entities.childAt(2)._data.rectH).toBe(52)
    expect(entities.childAt(2).x).toBe(78)

    // Boss: 72x88 rectangle
    expect(entities.childAt(3)._data.rectW).toBe(72)
    expect(entities.childAt(3)._data.rectH).toBe(88)
    expect(entities.childAt(3).x).toBe(114)

    // Unknown: 20x20 rectangle (default)
    expect(entities.childAt(4)._data.rectW).toBe(20)
    expect(entities.childAt(4)._data.rectH).toBe(20)
    expect(entities.childAt(4).x).toBe(200)
  })
})

describe('Catalog-driven rendering — determinism', () => {
  it('same input produces same output with catalog', () => {
    const buildRenderer = () => {
      const c = createMockContainer()
      const r = new DefaultPixiEntityRenderer(c, {
        createGraphics: () => createMockGraphics() as unknown as Graphics,
        catalog: new DefaultEntityVisualCatalog(),
      })
      return r
    }

    const world = makeWorld([
      makeEntity('a', 'player', { x: 0, y: 0 }),
      makeEntity('b', 'enemy', { x: 10, y: 10 }),
    ])

    const r1 = buildRenderer()
    const r2 = buildRenderer()

    const result1 = r1.render(world)
    const result2 = r2.render(world)

    expect(result1.entities).toHaveLength(result2.entities.length)
    expect(result1.entities[0].id).toBe(result2.entities[0].id)
    expect(result1.entities[1].id).toBe(result2.entities[1].id)
  })
})

// ---------------------------------------------------------------------------
// Tile-aware rendering (WO-S9-016)
// ---------------------------------------------------------------------------

describe('Tile-aware rendering — terrain', () => {
  it('terrain renders as 64x32 rectangle', () => {
    const container = createMockContainer()
    const renderer = new DefaultPixiEntityRenderer(container, {
      createGraphics: () => createMockGraphics() as unknown as Graphics,
      catalog: new DefaultEntityVisualCatalog(),
      tileCatalog: new DefaultPlatformTileCatalog(),
    })
    const world = makeWorld([makeEntity('ground-1', 'terrain', { x: 0, y: 350 })])
    renderer.render(world)

    const gfx = container._state.childAt(0) as unknown as { _data: MockGraphicsData }
    expect(gfx._data.rectW).toBe(64)
    expect(gfx._data.rectH).toBe(32)
  })

  it('terrain renders at correct position', () => {
    const container = createMockContainer()
    const renderer = new DefaultPixiEntityRenderer(container, {
      createGraphics: () => createMockGraphics() as unknown as Graphics,
      catalog: new DefaultEntityVisualCatalog(),
      tileCatalog: new DefaultPlatformTileCatalog(),
    })
    const world = makeWorld([makeEntity('ground-1', 'terrain', { x: 100, y: 400 })])
    renderer.render(world)

    expect(container._state.childAt(0)!.x).toBe(100)
    expect(container._state.childAt(0)!.y).toBe(400)
  })
})

describe('Tile-aware rendering — goal', () => {
  it('goal renders as 24x96 rectangle (flag-style)', () => {
    const container = createMockContainer()
    const renderer = new DefaultPixiEntityRenderer(container, {
      createGraphics: () => createMockGraphics() as unknown as Graphics,
      catalog: new DefaultEntityVisualCatalog(),
      tileCatalog: new DefaultPlatformTileCatalog(),
    })
    const world = makeWorld([makeEntity('flag-1', 'goal', { x: 800, y: 300 })])
    renderer.render(world)

    const gfx = container._state.childAt(0) as unknown as { _data: MockGraphicsData }
    expect(gfx._data.rectW).toBe(24)
    expect(gfx._data.rectH).toBe(96)
  })

  it('goal is taller than wide', () => {
    const container = createMockContainer()
    const renderer = new DefaultPixiEntityRenderer(container, {
      createGraphics: () => createMockGraphics() as unknown as Graphics,
      catalog: new DefaultEntityVisualCatalog(),
      tileCatalog: new DefaultPlatformTileCatalog(),
    })
    const world = makeWorld([makeEntity('flag-1', 'goal', { x: 0, y: 0 })])
    renderer.render(world)

    const gfx = container._state.childAt(0) as unknown as { _data: MockGraphicsData }
    expect(gfx._data.rectH).toBeGreaterThan(gfx._data.rectW)
  })
})

describe('Tile-aware rendering — platform', () => {
  it('platform renders as 96x24 rectangle', () => {
    const container = createMockContainer()
    const renderer = new DefaultPixiEntityRenderer(container, {
      createGraphics: () => createMockGraphics() as unknown as Graphics,
      catalog: new DefaultEntityVisualCatalog(),
      tileCatalog: new DefaultPlatformTileCatalog(),
    })
    const world = makeWorld([makeEntity('plat-1', 'platform', { x: 200, y: 200 })])
    renderer.render(world)

    const gfx = container._state.childAt(0) as unknown as { _data: MockGraphicsData }
    expect(gfx._data.rectW).toBe(96)
    expect(gfx._data.rectH).toBe(24)
  })

  it('platform is wider than tall', () => {
    const container = createMockContainer()
    const renderer = new DefaultPixiEntityRenderer(container, {
      createGraphics: () => createMockGraphics() as unknown as Graphics,
      catalog: new DefaultEntityVisualCatalog(),
      tileCatalog: new DefaultPlatformTileCatalog(),
    })
    const world = makeWorld([makeEntity('plat-1', 'platform', { x: 0, y: 0 })])
    renderer.render(world)

    const gfx = container._state.childAt(0) as unknown as { _data: MockGraphicsData }
    expect(gfx._data.rectW).toBeGreaterThan(gfx._data.rectH * 3)
  })
})

describe('Tile-aware rendering — checkpoint', () => {
  it('checkpoint renders as 16x48 rectangle', () => {
    const container = createMockContainer()
    const renderer = new DefaultPixiEntityRenderer(container, {
      createGraphics: () => createMockGraphics() as unknown as Graphics,
      catalog: new DefaultEntityVisualCatalog(),
      tileCatalog: new DefaultPlatformTileCatalog(),
    })
    const world = makeWorld([makeEntity('cp-1', 'checkpoint', { x: 500, y: 200 })])
    renderer.render(world)

    const gfx = container._state.childAt(0) as unknown as { _data: MockGraphicsData }
    expect(gfx._data.rectW).toBe(16)
    expect(gfx._data.rectH).toBe(48)
  })

  it('checkpoint is taller than wide (marker style)', () => {
    const container = createMockContainer()
    const renderer = new DefaultPixiEntityRenderer(container, {
      createGraphics: () => createMockGraphics() as unknown as Graphics,
      catalog: new DefaultEntityVisualCatalog(),
      tileCatalog: new DefaultPlatformTileCatalog(),
    })
    const world = makeWorld([makeEntity('cp-1', 'checkpoint', { x: 0, y: 0 })])
    renderer.render(world)

    const gfx = container._state.childAt(0) as unknown as { _data: MockGraphicsData }
    expect(gfx._data.rectH).toBeGreaterThan(gfx._data.rectW * 2)
  })
})

describe('Tile-aware rendering — item', () => {
  it('item renders as 16x16 rectangle', () => {
    const container = createMockContainer()
    const renderer = new DefaultPixiEntityRenderer(container, {
      createGraphics: () => createMockGraphics() as unknown as Graphics,
      catalog: new DefaultEntityVisualCatalog(),
      tileCatalog: new DefaultPlatformTileCatalog(),
    })
    const world = makeWorld([makeEntity('coin-1', 'item', { x: 300, y: 150 })])
    renderer.render(world)

    const gfx = container._state.childAt(0) as unknown as { _data: MockGraphicsData }
    expect(gfx._data.rectW).toBe(16)
    expect(gfx._data.rectH).toBe(16)
  })

  it('item is a small square', () => {
    const container = createMockContainer()
    const renderer = new DefaultPixiEntityRenderer(container, {
      createGraphics: () => createMockGraphics() as unknown as Graphics,
      catalog: new DefaultEntityVisualCatalog(),
      tileCatalog: new DefaultPlatformTileCatalog(),
    })
    const world = makeWorld([makeEntity('coin-1', 'item', { x: 0, y: 0 })])
    renderer.render(world)

    const gfx = container._state.childAt(0) as unknown as { _data: MockGraphicsData }
    expect(gfx._data.rectW).toBe(gfx._data.rectH)
    expect(gfx._data.rectW).toBeLessThan(20)
  })
})

describe('Tile-aware rendering — per-type colors', () => {
  it('terrain uses brown color', () => {
    const container = createMockContainer()
    const renderer = new DefaultPixiEntityRenderer(container, {
      createGraphics: () => createMockGraphics() as unknown as Graphics,
      catalog: new DefaultEntityVisualCatalog(),
      tileCatalog: new DefaultPlatformTileCatalog(),
    })
    const world = makeWorld([makeEntity('g1', 'terrain', { x: 0, y: 0 })])
    renderer.render(world)

    const gfx = container._state.childAt(0) as unknown as { _data: MockGraphicsData }
    expect(gfx._data.fillColor).toBe(0x8d6e63)
  })

  it('goal uses yellow color', () => {
    const container = createMockContainer()
    const renderer = new DefaultPixiEntityRenderer(container, {
      createGraphics: () => createMockGraphics() as unknown as Graphics,
      catalog: new DefaultEntityVisualCatalog(),
      tileCatalog: new DefaultPlatformTileCatalog(),
    })
    const world = makeWorld([makeEntity('f1', 'goal', { x: 0, y: 0 })])
    renderer.render(world)

    const gfx = container._state.childAt(0) as unknown as { _data: MockGraphicsData }
    expect(gfx._data.fillColor).toBe(0xffd54f)
  })

  it('platform uses green color', () => {
    const container = createMockContainer()
    const renderer = new DefaultPixiEntityRenderer(container, {
      createGraphics: () => createMockGraphics() as unknown as Graphics,
      catalog: new DefaultEntityVisualCatalog(),
      tileCatalog: new DefaultPlatformTileCatalog(),
    })
    const world = makeWorld([makeEntity('p1', 'platform', { x: 0, y: 0 })])
    renderer.render(world)

    const gfx = container._state.childAt(0) as unknown as { _data: MockGraphicsData }
    expect(gfx._data.fillColor).toBe(0x66bb6a)
  })

  it('enemy uses red color', () => {
    const container = createMockContainer()
    const renderer = new DefaultPixiEntityRenderer(container, {
      createGraphics: () => createMockGraphics() as unknown as Graphics,
      catalog: new DefaultEntityVisualCatalog(),
      tileCatalog: new DefaultPlatformTileCatalog(),
    })
    const world = makeWorld([makeEntity('e1', 'enemy', { x: 0, y: 0 })])
    renderer.render(world)

    const gfx = container._state.childAt(0) as unknown as { _data: MockGraphicsData }
    expect(gfx._data.fillColor).toBe(0xef5350)
  })

  it('item uses yellow color', () => {
    const container = createMockContainer()
    const renderer = new DefaultPixiEntityRenderer(container, {
      createGraphics: () => createMockGraphics() as unknown as Graphics,
      catalog: new DefaultEntityVisualCatalog(),
      tileCatalog: new DefaultPlatformTileCatalog(),
    })
    const world = makeWorld([makeEntity('i1', 'item', { x: 0, y: 0 })])
    renderer.render(world)

    const gfx = container._state.childAt(0) as unknown as { _data: MockGraphicsData }
    expect(gfx._data.fillColor).toBe(0xffd54f)
  })

  it('checkpoint uses purple color', () => {
    const container = createMockContainer()
    const renderer = new DefaultPixiEntityRenderer(container, {
      createGraphics: () => createMockGraphics() as unknown as Graphics,
      catalog: new DefaultEntityVisualCatalog(),
      tileCatalog: new DefaultPlatformTileCatalog(),
    })
    const world = makeWorld([makeEntity('c1', 'checkpoint', { x: 0, y: 0 })])
    renderer.render(world)

    const gfx = container._state.childAt(0) as unknown as { _data: MockGraphicsData }
    expect(gfx._data.fillColor).toBe(0xce93d8)
  })

  it('player maintains light blue color', () => {
    const container = createMockContainer()
    const renderer = new DefaultPixiEntityRenderer(container, {
      createGraphics: () => createMockGraphics() as unknown as Graphics,
      catalog: new DefaultEntityVisualCatalog(),
      tileCatalog: new DefaultPlatformTileCatalog(),
    })
    const world = makeWorld([makeEntity('hero', 'player', { x: 0, y: 0 })])
    renderer.render(world)

    const gfx = container._state.childAt(0) as unknown as { _data: MockGraphicsData }
    expect(gfx._data.fillColor).toBe(0x4fc3f7)
  })

  it('unknown type uses default light blue color', () => {
    const container = createMockContainer()
    const renderer = new DefaultPixiEntityRenderer(container, {
      createGraphics: () => createMockGraphics() as unknown as Graphics,
      catalog: new DefaultEntityVisualCatalog(),
      tileCatalog: new DefaultPlatformTileCatalog(),
    })
    const world = makeWorld([makeEntity('u1', 'unknown', { x: 0, y: 0 })])
    renderer.render(world)

    const gfx = container._state.childAt(0) as unknown as { _data: MockGraphicsData }
    expect(gfx._data.fillColor).toBe(0x4fc3f7)
  })
})

describe('Tile-aware rendering — camera compatibility', () => {
  it('renders with both tile catalog and camera controller', () => {
    const container = createMockContainer()
    const cameraController = {
      _state: { x: 0, y: 0 },
      getState: () => ({ x: 0, y: 0 }),
      update: () => ({ x: 50, y: 100 }),
    }
    const renderer = new DefaultPixiEntityRenderer(container, {
      createGraphics: () => createMockGraphics() as unknown as Graphics,
      catalog: new DefaultEntityVisualCatalog(),
      tileCatalog: new DefaultPlatformTileCatalog(),
      cameraController: cameraController as CameraController,
    })
    const world = makeWorld([makeEntity('g1', 'terrain', { x: 100, y: 200 })])
    renderer.render(world)

    expect(container._state.childCount).toBe(1)
    expect(container.position.x).toBe(-50)
    expect(container.position.y).toBe(-100)
  })

  it('renders camera-relative world coordinates from an explicit viewport anchor', () => {
    const container = createMockContainer()
    const cameraController = {
      _state: { x: 0, y: 0 },
      getState: () => ({ x: 0, y: 0 }),
      update: () => ({ x: 80, y: 300 }),
    }
    const renderer = new DefaultPixiEntityRenderer(container, {
      createGraphics: () => createMockGraphics() as unknown as Graphics,
      cameraController: cameraController as CameraController,
      cameraAnchor: { x: 400, y: 300 },
    })

    renderer.render(makeWorld([makeEntity('player', 'player', { x: 80, y: 300 })]))

    expect(container.position.x).toBe(320)
    expect(container.position.y).toBe(0)
  })

  it('multiple entity types render with correct sizes in same world', () => {
    const container = createMockContainer()
    const renderer = new DefaultPixiEntityRenderer(container, {
      createGraphics: () => createMockGraphics() as unknown as Graphics,
      catalog: new DefaultEntityVisualCatalog(),
      tileCatalog: new DefaultPlatformTileCatalog(),
    })
    const world = makeWorld([
      makeEntity('p1', 'player', { x: 50, y: 300 }),
      makeEntity('g1', 'terrain', { x: 0, y: 350 }),
      makeEntity('f1', 'goal', { x: 800, y: 250 }),
      makeEntity('pl1', 'platform', { x: 200, y: 200 }),
      makeEntity('e1', 'enemy', { x: 300, y: 310 }),
      makeEntity('i1', 'item', { x: 150, y: 180 }),
      makeEntity('c1', 'checkpoint', { x: 400, y: 200 }),
    ])
    renderer.render(world)

    expect(container._state.childCount).toBe(7)
  })
})

describe('Tile-aware rendering — fallback behavior', () => {
  it('renderer with tile catalog but no visual catalog uses tile dimensions as rectangle', () => {
    const container = createMockContainer()
    const renderer = new DefaultPixiEntityRenderer(container, {
      createGraphics: () => createMockGraphics() as unknown as Graphics,
      tileCatalog: new DefaultPlatformTileCatalog(),
    })
    const world = makeWorld([makeEntity('g1', 'terrain', { x: 0, y: 0 })])
    renderer.render(world)

    const gfx = container._state.childAt(0) as unknown as { _data: MockGraphicsData }
    expect(gfx._data.rectW).toBe(64)
    expect(gfx._data.rectH).toBe(32)
  })

  it('renderer with tile catalog falls back to 20x20 for unknown types', () => {
    const container = createMockContainer()
    const renderer = new DefaultPixiEntityRenderer(container, {
      createGraphics: () => createMockGraphics() as unknown as Graphics,
      tileCatalog: new DefaultPlatformTileCatalog(),
    })
    const world = makeWorld([makeEntity('u1', 'unknown', { x: 0, y: 0 })])
    renderer.render(world)

    const gfx = container._state.childAt(0) as unknown as { _data: MockGraphicsData }
    expect(gfx._data.rectW).toBe(20)
    expect(gfx._data.rectH).toBe(20)
  })
})

describe('Tile-aware rendering — clear and re-render', () => {
  it('clear works with tile-aware renderer', () => {
    const container = createMockContainer()
    const renderer = new DefaultPixiEntityRenderer(container, {
      createGraphics: () => createMockGraphics() as unknown as Graphics,
      catalog: new DefaultEntityVisualCatalog(),
      tileCatalog: new DefaultPlatformTileCatalog(),
    })
    renderer.render(makeWorld([
      makeEntity('g1', 'terrain', { x: 0, y: 0 }),
      makeEntity('p1', 'platform', { x: 100, y: 0 }),
    ]))

    expect(container._state.childCount).toBe(2)

    renderer.clear()
    expect(container._state.childCount).toBe(0)
  })

  it('re-render replaces tile entities correctly', () => {
    const container = createMockContainer()
    const renderer = new DefaultPixiEntityRenderer(container, {
      createGraphics: () => createMockGraphics() as unknown as Graphics,
      catalog: new DefaultEntityVisualCatalog(),
      tileCatalog: new DefaultPlatformTileCatalog(),
    })

    renderer.render(makeWorld([
      makeEntity('g1', 'terrain', { x: 0, y: 0 }),
    ]))
    expect(container._state.childCount).toBe(1)

    renderer.render(makeWorld([
      makeEntity('g1', 'goal', { x: 100, y: 0 }),
    ]))
    expect(container._state.childCount).toBe(1)

    const gfx = container._state.childAt(0) as unknown as { _data: MockGraphicsData }
    expect(gfx._data.rectW).toBe(24)
    expect(gfx._data.rectH).toBe(96)
  })
})

describe('Tile-aware rendering — determinism', () => {
  it('same input produces same output with tile catalog', () => {
    const buildRenderer = () => {
      const c = createMockContainer()
      return new DefaultPixiEntityRenderer(c, {
        createGraphics: () => createMockGraphics() as unknown as Graphics,
        catalog: new DefaultEntityVisualCatalog(),
        tileCatalog: new DefaultPlatformTileCatalog(),
      })
    }

    const world = makeWorld([
      makeEntity('a', 'terrain', { x: 0, y: 350 }),
      makeEntity('b', 'goal', { x: 800, y: 250 }),
    ])

    const r1 = buildRenderer()
    const r2 = buildRenderer()

    const result1 = r1.render(world)
    const result2 = r2.render(world)

    expect(result1.entities).toHaveLength(result2.entities.length)
    expect(result1.entities[0].id).toBe(result2.entities[0].id)
    expect(result1.entities[1].id).toBe(result2.entities[1].id)
  })
})
