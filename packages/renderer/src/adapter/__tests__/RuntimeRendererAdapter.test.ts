/**
 * RuntimeRendererAdapter.test.ts — comprehensive test suite for
 * the Runtime → Renderer synchronization foundation.
 *
 * Coverage areas (WO-S9-002):
 *   - Construction
 *   - Empty world
 *   - Single entity
 *   - Multiple entities
 *   - Immutability
 *   - Determinism
 *   - Large worlds
 *   - Serialization
 *   - Frozen outputs
 *   - Edge cases (null/undefined entities, null world)
 */

import { describe, it, expect } from 'vitest'
import { createPositionComponent, createVelocityComponent, type World, type Entity } from '@genesis/shared'
import { DefaultRuntimeRendererAdapter } from '../DefaultRuntimeRendererAdapter'
import { EMPTY_RENDER_WORLD } from '../../model'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeEntity(
  overrides: Partial<Entity> = {}
): Entity {
  return {
    id: 'test-1',
    type: 'tree',
    x: 5,
    y: 3,
    ...overrides,
  }
}

function makeWorld(entities: Entity[] = []): World {
  return { entities }
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('Construction', () => {
  it('creates an adapter instance', () => {
    const adapter = new DefaultRuntimeRendererAdapter()
    expect(adapter).toBeDefined()
    expect(adapter).toBeInstanceOf(DefaultRuntimeRendererAdapter)
  })

  it('implements the RuntimeRendererAdapter interface', () => {
    const adapter = new DefaultRuntimeRendererAdapter()
    expect(typeof adapter.adapt).toBe('function')
  })
})

describe('Empty World', () => {
  it('returns EMPTY_RENDER_WORLD for empty entities', () => {
    const adapter = new DefaultRuntimeRendererAdapter()
    const result = adapter.adapt(makeWorld([]))
    expect(result.entities).toHaveLength(0)
  })

  it('returns frozen result for empty world', () => {
    const adapter = new DefaultRuntimeRendererAdapter()
    const result = adapter.adapt(makeWorld([]))
    expect(Object.isFrozen(result)).toBe(true)
    expect(Object.isFrozen(result.entities)).toBe(true)
  })

  it('returns empty for world with empty entities array', () => {
    const adapter = new DefaultRuntimeRendererAdapter()
    const world = { entities: [] }
    const result = adapter.adapt(world)
    expect(result.entities).toHaveLength(0)
  })
})

describe('Single Entity', () => {
  it('derives Player presentation only from Runtime velocity', () => {
    const adapter = new DefaultRuntimeRendererAdapter()
    const player = (x: number, y: number): Entity => makeEntity({
      id: 'player', type: 'player', components: [createPositionComponent(0, 400), createVelocityComponent(x, y)],
    })

    expect(adapter.adapt(makeWorld([player(0, 0)])).entities[0]).toMatchObject({ presentationState: 'idle', velocity: { x: 0, y: 0 } })
    expect(adapter.adapt(makeWorld([player(2, 0)])).entities[0]).toMatchObject({ presentationState: 'run' })
    expect(adapter.adapt(makeWorld([player(2, -4)])).entities[0]).toMatchObject({ presentationState: 'jump' })
  })

  it('projects top-down velocity into walk state and four-way direction', () => {
    const adapter = new DefaultRuntimeRendererAdapter({ getWorldSpatialMode: () => 'top-down' })
    const player = makeEntity({
      id: 'player',
      type: 'player',
      components: [createPositionComponent(10, 20), createVelocityComponent(0, -3)],
    })

    expect(adapter.adapt(makeWorld([player]))).toMatchObject({
      spatialMode: 'top-down',
      entities: [{ presentationState: 'run', presentationDirection: 'up', velocity: { x: 0, y: -3 } }],
    })
  })

  it('maps a single entity id and type', () => {
    const adapter = new DefaultRuntimeRendererAdapter()
    const entity = makeEntity({ id: 'hero-1', type: 'player' })
    const result = adapter.adapt(makeWorld([entity]))

    expect(result.entities).toHaveLength(1)
    expect(result.entities[0].id).toBe('hero-1')
    expect(result.entities[0].type).toBe('player')
  })

  it('preserves id and type verbatim', () => {
    const adapter = new DefaultRuntimeRendererAdapter()
    const entity = makeEntity({ id: 'entity-42', type: 'oak-tree' })
    const result = adapter.adapt(makeWorld([entity]))

    expect(result.entities[0].id).toBe('entity-42')
    expect(result.entities[0].type).toBe('oak-tree')
  })

  it('ignores position (x, y)', () => {
    const adapter = new DefaultRuntimeRendererAdapter()
    const entity = makeEntity({ id: 'pos-test', type: 'npc', x: 100, y: 200 })
    const result = adapter.adapt(makeWorld([entity]))
    const renderEntity = result.entities[0]

    expect(renderEntity.id).toBe('pos-test')
    expect(renderEntity.type).toBe('npc')
    expect('x' in renderEntity).toBe(false)
    expect('y' in renderEntity).toBe(false)
  })

  it('ignores components', () => {
    const adapter = new DefaultRuntimeRendererAdapter()
    const entity = makeEntity({
      id: 'comp-test',
      type: 'villager',
      components: [
        { type: 'position', properties: { x: 5, y: 3 } },
      ],
    })
    const result = adapter.adapt(makeWorld([entity]))
    const renderEntity = result.entities[0]

    expect(renderEntity.id).toBe('comp-test')
    expect(renderEntity.type).toBe('villager')
    expect('components' in renderEntity).toBe(false)
  })

  it('entity is frozen', () => {
    const adapter = new DefaultRuntimeRendererAdapter()
    const entity = makeEntity()
    const result = adapter.adapt(makeWorld([entity]))

    expect(Object.isFrozen(result.entities[0])).toBe(true)
  })
})

describe('Multiple Entities', () => {
  it('maps multiple entities preserving order', () => {
    const adapter = new DefaultRuntimeRendererAdapter()
    const entities = [
      makeEntity({ id: 'a', type: 'tree' }),
      makeEntity({ id: 'b', type: 'rock' }),
      makeEntity({ id: 'c', type: 'river' }),
    ]
    const result = adapter.adapt(makeWorld(entities))

    expect(result.entities).toHaveLength(3)
    expect(result.entities[0].id).toBe('a')
    expect(result.entities[1].id).toBe('b')
    expect(result.entities[2].id).toBe('c')
  })

  it('maps each entity correctly', () => {
    const adapter = new DefaultRuntimeRendererAdapter()
    const entities = [
      makeEntity({ id: 't-1', type: 'tree' }),
      makeEntity({ id: 'p-1', type: 'player' }),
      makeEntity({ id: 'n-1', type: 'npc' }),
    ]
    const result = adapter.adapt(makeWorld(entities))

    expect(result.entities[0].id).toBe('t-1')
    expect(result.entities[0].type).toBe('tree')
    expect(result.entities[1].id).toBe('p-1')
    expect(result.entities[1].type).toBe('player')
    expect(result.entities[2].id).toBe('n-1')
    expect(result.entities[2].type).toBe('npc')
  })

  it('preserves entity count', () => {
    const adapter = new DefaultRuntimeRendererAdapter()
    const entities = Array.from({ length: 5 }, (_, i) =>
      makeEntity({ id: `e-${i}`, type: 'entity' })
    )
    const result = adapter.adapt(makeWorld(entities))
    expect(result.entities).toHaveLength(5)
  })
})

describe('Immutability', () => {
  it('returns a frozen RenderWorld', () => {
    const adapter = new DefaultRuntimeRendererAdapter()
    const entity = makeEntity()
    const result = adapter.adapt(makeWorld([entity]))

    expect(Object.isFrozen(result)).toBe(true)
  })

  it('returns frozen entities array', () => {
    const adapter = new DefaultRuntimeRendererAdapter()
    const entity = makeEntity()
    const result = adapter.adapt(makeWorld([entity]))

    expect(Object.isFrozen(result.entities)).toBe(true)
  })

  it('each entity is frozen', () => {
    const adapter = new DefaultRuntimeRendererAdapter()
    const entities = [
      makeEntity({ id: 'a', type: 'tree' }),
      makeEntity({ id: 'b', type: 'rock' }),
    ]
    const result = adapter.adapt(makeWorld(entities))

    expect(Object.isFrozen(result.entities[0])).toBe(true)
    expect(Object.isFrozen(result.entities[1])).toBe(true)
  })

  it('does not mutate the input world', () => {
    const adapter = new DefaultRuntimeRendererAdapter()
    const originalEntities = [makeEntity({ id: 'e-1', type: 'tree' })]
    const world = makeWorld(originalEntities)

    adapter.adapt(world)

    expect(world.entities).toHaveLength(1)
    expect(world.entities[0].id).toBe('e-1')
  })
})

describe('Determinism', () => {
  it('same input produces identical output', () => {
    const adapter = new DefaultRuntimeRendererAdapter()
    const entities = [
      makeEntity({ id: 'a', type: 'tree' }),
      makeEntity({ id: 'b', type: 'rock' }),
    ]
    const world = makeWorld(entities)

    const r1 = adapter.adapt(world)
    const r2 = adapter.adapt(world)

    expect(r1).toEqual(r2)
  })

  it('two adapters produce identical output', () => {
    const a = new DefaultRuntimeRendererAdapter()
    const b = new DefaultRuntimeRendererAdapter()
    const entities = [makeEntity({ id: 'x', type: 'tree' })]
    const world = makeWorld(entities)

    expect(a.adapt(world)).toEqual(b.adapt(world))
  })

  it('same input yields same entity order', () => {
    const adapter = new DefaultRuntimeRendererAdapter()
    const entities = [
      makeEntity({ id: 'first', type: 'a' }),
      makeEntity({ id: 'second', type: 'b' }),
      makeEntity({ id: 'third', type: 'c' }),
    ]
    const world = makeWorld(entities)

    const r1 = adapter.adapt(world)
    const r2 = adapter.adapt(world)

    expect(r1.entities[0].id).toBe(r2.entities[0].id)
    expect(r1.entities[1].id).toBe(r2.entities[1].id)
    expect(r1.entities[2].id).toBe(r2.entities[2].id)
  })
})

describe('Large Worlds', () => {
  it('maps 100 entities', () => {
    const adapter = new DefaultRuntimeRendererAdapter()
    const entities = Array.from({ length: 100 }, (_, i) =>
      makeEntity({ id: `e-${i}`, type: i % 2 === 0 ? 'tree' : 'rock' })
    )
    const result = adapter.adapt(makeWorld(entities))

    expect(result.entities).toHaveLength(100)
    expect(result.entities[0].id).toBe('e-0')
    expect(result.entities[99].id).toBe('e-99')
  })

  it('maps 1000 entities', () => {
    const adapter = new DefaultRuntimeRendererAdapter()
    const entities = Array.from({ length: 1000 }, (_, i) =>
      makeEntity({ id: `e-${i}`, type: 'entity' })
    )
    const result = adapter.adapt(makeWorld(entities))

    expect(result.entities).toHaveLength(1000)
  })

  it('preserves type distribution in large worlds', () => {
    const adapter = new DefaultRuntimeRendererAdapter()
    const entities = Array.from({ length: 50 }, (_, i) =>
      makeEntity({ id: `e-${i}`, type: i < 25 ? 'tree' : 'rock' })
    )
    const result = adapter.adapt(makeWorld(entities))

    expect(result.entities[0].type).toBe('tree')
    expect(result.entities[25].type).toBe('rock')
  })
})

describe('Serialization', () => {
  it('serializes to JSON with id and type', () => {
    const adapter = new DefaultRuntimeRendererAdapter()
    const entity = makeEntity({ id: 's-1', type: 'stone' })
    const result = adapter.adapt(makeWorld([entity]))

    const json = JSON.parse(JSON.stringify(result))
    expect(json.entities).toHaveLength(1)
    expect(json.entities[0].id).toBe('s-1')
    expect(json.entities[0].type).toBe('stone')
  })

  it('serialized entities have no position or component fields', () => {
    const adapter = new DefaultRuntimeRendererAdapter()
    const entity = makeEntity({
      id: 's-2',
      type: 'house',
      x: 10,
      y: 20,
      components: [],
    })
    const result = adapter.adapt(makeWorld([entity]))

    const json = JSON.parse(JSON.stringify(result))
    expect(json.entities[0].x).toBeUndefined()
    expect(json.entities[0].y).toBeUndefined()
    expect(json.entities[0].components).toBeUndefined()
  })
})

describe('Frozen Outputs', () => {
  it('EMPTY_RENDER_WORLD is frozen', () => {
    expect(Object.isFrozen(EMPTY_RENDER_WORLD)).toBe(true)
    expect(Object.isFrozen(EMPTY_RENDER_WORLD.entities)).toBe(true)
  })

  it('empty world output is frozen', () => {
    const adapter = new DefaultRuntimeRendererAdapter()
    const result = adapter.adapt(makeWorld([]))

    expect(Object.isFrozen(result)).toBe(true)
    expect(Object.isFrozen(result.entities)).toBe(true)
  })

  it('populated world output is frozen', () => {
    const adapter = new DefaultRuntimeRendererAdapter()
    const entity = makeEntity()
    const result = adapter.adapt(makeWorld([entity]))

    expect(Object.isFrozen(result)).toBe(true)
    expect(Object.isFrozen(result.entities)).toBe(true)
    expect(Object.isFrozen(result.entities[0])).toBe(true)
  })

  it('cannot mutate entities through frozen output', () => {
    const adapter = new DefaultRuntimeRendererAdapter()
    const entity = makeEntity()
    const result = adapter.adapt(makeWorld([entity]))

    expect(() => {
      (result.entities[0] as unknown as Record<string, unknown>).id = 'mutated'
    }).toThrow()
  })
})

describe('Edge Cases', () => {
  it('handles null world gracefully', () => {
    const adapter = new DefaultRuntimeRendererAdapter()
    const result = adapter.adapt(null as unknown as World)

    expect(result.entities).toHaveLength(0)
    expect(Object.isFrozen(result)).toBe(true)
  })

  it('handles undefined world gracefully', () => {
    const adapter = new DefaultRuntimeRendererAdapter()
    const result = adapter.adapt(undefined as unknown as World)

    expect(result.entities).toHaveLength(0)
  })

  it('handles world with null entities gracefully', () => {
    const adapter = new DefaultRuntimeRendererAdapter()
    const world = { entities: null as unknown as Entity[] }
    const result = adapter.adapt(world)

    expect(result.entities).toHaveLength(0)
  })

  it('skips null entities in the array', () => {
    const adapter = new DefaultRuntimeRendererAdapter()
    const entities = [
      makeEntity({ id: 'a', type: 'tree' }),
      null as unknown as Entity,
      makeEntity({ id: 'c', type: 'rock' }),
    ]
    const result = adapter.adapt(makeWorld(entities))

    expect(result.entities).toHaveLength(2)
    expect(result.entities[0].id).toBe('a')
    expect(result.entities[1].id).toBe('c')
  })

  it('handles empty string id', () => {
    const adapter = new DefaultRuntimeRendererAdapter()
    const entity = makeEntity({ id: '', type: 'unknown' })
    const result = adapter.adapt(makeWorld([entity]))

    expect(result.entities[0].id).toBe('')
    expect(result.entities[0].type).toBe('unknown')
  })
})
