/**
 * RuntimeRendererAdapterPosition.test.ts — position-related tests for
 * the Runtime → Renderer adapter.
 *
 * Coverage areas (WO-S9-003):
 *   - Single entity with position
 *   - Multiple entities with position
 *   - Entity without position
 *   - Mixed entities (some with, some without position)
 *   - Negative coordinates
 *   - Fractional coordinates
 *   - Large coordinates
 *   - Immutability
 *   - Determinism
 *   - Frozen outputs
 */

import { describe, it, expect } from 'vitest'
import type { Entity, World } from '@genesis/shared'
import { createPositionComponent } from '@genesis/shared'
import { DefaultRuntimeRendererAdapter } from '../DefaultRuntimeRendererAdapter'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createEntity(
  overrides: Partial<Entity> & { id: string; type: string }
): Entity {
  return {
    x: 0,
    y: 0,
    ...overrides,
  } as unknown as Entity
}

function makeWorld(entities: Entity[]): World {
  return { entities }
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('Position — Single Entity', () => {
  it('maps position from PositionComponent', () => {
    const adapter = new DefaultRuntimeRendererAdapter()
    const entity = createEntity({
      id: 'hero',
      type: 'player',
      components: Object.freeze([createPositionComponent(10, 20)]),
    })
    const result = adapter.adapt(makeWorld([entity]))

    expect(result.entities).toHaveLength(1)
    expect(result.entities[0].position).toBeDefined()
    expect(result.entities[0].position!.x).toBe(10)
    expect(result.entities[0].position!.y).toBe(20)
  })

  it('preserves id and type alongside position', () => {
    const adapter = new DefaultRuntimeRendererAdapter()
    const entity = createEntity({
      id: 'goblin-1',
      type: 'enemy',
      components: Object.freeze([createPositionComponent(5, 8)]),
    })
    const result = adapter.adapt(makeWorld([entity]))

    expect(result.entities[0].id).toBe('goblin-1')
    expect(result.entities[0].type).toBe('enemy')
    expect(result.entities[0].position).toBeDefined()
  })
})

describe('Position — Multiple Entities', () => {
  it('maps positions for multiple entities', () => {
    const adapter = new DefaultRuntimeRendererAdapter()
    const entities = [
      createEntity({
        id: 'a',
        type: 'tree',
        components: Object.freeze([createPositionComponent(1, 2)]),
      }),
      createEntity({
        id: 'b',
        type: 'rock',
        components: Object.freeze([createPositionComponent(3, 4)]),
      }),
      createEntity({
        id: 'c',
        type: 'river',
        components: Object.freeze([createPositionComponent(5, 6)]),
      }),
    ]
    const result = adapter.adapt(makeWorld(entities))

    expect(result.entities).toHaveLength(3)
    expect(result.entities[0].position).toEqual({ x: 1, y: 2 })
    expect(result.entities[1].position).toEqual({ x: 3, y: 4 })
    expect(result.entities[2].position).toEqual({ x: 5, y: 6 })
  })

  it('preserves entity order with positions', () => {
    const adapter = new DefaultRuntimeRendererAdapter()
    const entities = [
      createEntity({
        id: 'first',
        type: 'a',
        components: Object.freeze([createPositionComponent(0, 0)]),
      }),
      createEntity({
        id: 'second',
        type: 'b',
        components: Object.freeze([createPositionComponent(1, 1)]),
      }),
    ]
    const result = adapter.adapt(makeWorld(entities))

    expect(result.entities[0].id).toBe('first')
    expect(result.entities[1].id).toBe('second')
  })
})

describe('Position — Entity Without Position', () => {
  it('entity without components has no position', () => {
    const adapter = new DefaultRuntimeRendererAdapter()
    const entity = createEntity({ id: 'npc-1', type: 'villager' })
    const result = adapter.adapt(makeWorld([entity]))

    expect(result.entities[0].position).toBeUndefined()
  })

  it('entity with empty components has no position', () => {
    const adapter = new DefaultRuntimeRendererAdapter()
    const entity = createEntity({
      id: 'e-1',
      type: 'building',
      components: Object.freeze([]),
    })
    const result = adapter.adapt(makeWorld([entity]))

    expect(result.entities[0].position).toBeUndefined()
  })

  it('entity with non-position components has no position', () => {
    const adapter = new DefaultRuntimeRendererAdapter()
    const entity = createEntity({
      id: 'e-1',
      type: 'quest',
      components: Object.freeze([
        { type: 'health', properties: { hp: 100 } },
      ] as unknown as Entity['components']),
    })
    const result = adapter.adapt(makeWorld([entity]))

    expect(result.entities[0].position).toBeUndefined()
  })
})

describe('Position — Mixed Entities', () => {
  it('handles mix of positioned and non-positioned entities', () => {
    const adapter = new DefaultRuntimeRendererAdapter()
    const entities = [
      createEntity({
        id: 'p1',
        type: 'player',
        components: Object.freeze([createPositionComponent(0, 0)]),
      }),
      createEntity({ id: 'n1', type: 'npc' }),
      createEntity({
        id: 'p2',
        type: 'enemy',
        components: Object.freeze([createPositionComponent(10, 10)]),
      }),
    ]
    const result = adapter.adapt(makeWorld(entities))

    expect(result.entities[0].position).toBeDefined()
    expect(result.entities[1].position).toBeUndefined()
    expect(result.entities[2].position).toBeDefined()
  })

  it('non-position entities pass through unchanged', () => {
    const adapter = new DefaultRuntimeRendererAdapter()
    const entities = [
      createEntity({ id: 'a', type: 'grass' }),
      createEntity({ id: 'b', type: 'tree' }),
    ]
    const result = adapter.adapt(makeWorld(entities))

    expect(result.entities).toHaveLength(2)
    expect(result.entities[0].id).toBe('a')
    expect(result.entities[0].position).toBeUndefined()
    expect(result.entities[1].id).toBe('b')
    expect(result.entities[1].position).toBeUndefined()
  })
})

describe('Position — Negative Coordinates', () => {
  it('maps negative coordinates', () => {
    const adapter = new DefaultRuntimeRendererAdapter()
    const entity = createEntity({
      id: 'neg',
      type: 'entity',
      components: Object.freeze([createPositionComponent(-5, -10)]),
    })
    const result = adapter.adapt(makeWorld([entity]))

    expect(result.entities[0].position!.x).toBe(-5)
    expect(result.entities[0].position!.y).toBe(-10)
  })

  it('maps mixed negative and positive', () => {
    const adapter = new DefaultRuntimeRendererAdapter()
    const entity = createEntity({
      id: 'mixed',
      type: 'entity',
      components: Object.freeze([createPositionComponent(-3, 7)]),
    })
    const result = adapter.adapt(makeWorld([entity]))

    expect(result.entities[0].position!.x).toBe(-3)
    expect(result.entities[0].position!.y).toBe(7)
  })
})

describe('Position — Fractional Coordinates', () => {
  it('maps fractional coordinates', () => {
    const adapter = new DefaultRuntimeRendererAdapter()
    const entity = createEntity({
      id: 'frac',
      type: 'entity',
      components: Object.freeze([createPositionComponent(1.5, 2.75)]),
    })
    const result = adapter.adapt(makeWorld([entity]))

    expect(result.entities[0].position!.x).toBe(1.5)
    expect(result.entities[0].position!.y).toBe(2.75)
  })

  it('maps negative fractional coordinates', () => {
    const adapter = new DefaultRuntimeRendererAdapter()
    const entity = createEntity({
      id: 'neg-frac',
      type: 'entity',
      components: Object.freeze([createPositionComponent(-0.5, -1.25)]),
    })
    const result = adapter.adapt(makeWorld([entity]))

    expect(result.entities[0].position!.x).toBe(-0.5)
    expect(result.entities[0].position!.y).toBe(-1.25)
  })
})

describe('Position — Large Coordinates', () => {
  it('maps large positive coordinates', () => {
    const adapter = new DefaultRuntimeRendererAdapter()
    const entity = createEntity({
      id: 'big',
      type: 'entity',
      components: Object.freeze([createPositionComponent(10000, 20000)]),
    })
    const result = adapter.adapt(makeWorld([entity]))

    expect(result.entities[0].position!.x).toBe(10000)
    expect(result.entities[0].position!.y).toBe(20000)
  })

  it('maps max safe integer coordinates', () => {
    const adapter = new DefaultRuntimeRendererAdapter()
    const entity = createEntity({
      id: 'max',
      type: 'entity',
      components: Object.freeze([
        createPositionComponent(Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER),
      ]),
    })
    const result = adapter.adapt(makeWorld([entity]))

    expect(result.entities[0].position!.x).toBe(Number.MAX_SAFE_INTEGER)
    expect(result.entities[0].position!.y).toBe(Number.MAX_SAFE_INTEGER)
  })
})

describe('Position — Immutability', () => {
  it('position object is frozen', () => {
    const adapter = new DefaultRuntimeRendererAdapter()
    const entity = createEntity({
      id: 'imm',
      type: 'entity',
      components: Object.freeze([createPositionComponent(1, 2)]),
    })
    const result = adapter.adapt(makeWorld([entity]))

    expect(Object.isFrozen(result.entities[0].position)).toBe(true)
  })

  it('entity without position does not create a position key', () => {
    const adapter = new DefaultRuntimeRendererAdapter()
    const entity = createEntity({ id: 'np', type: 'entity' })
    const result = adapter.adapt(makeWorld([entity]))

    expect('position' in result.entities[0]).toBe(false)
  })

  it('does not mutate input components', () => {
    const adapter = new DefaultRuntimeRendererAdapter()
    const components = Object.freeze([createPositionComponent(5, 5)])
    const entity = createEntity({
      id: 'safe',
      type: 'entity',
      components,
    })
    adapter.adapt(makeWorld([entity]))

    expect(components).toHaveLength(1)
    expect(components[0].properties.x).toBe(5)
  })
})

describe('Position — Determinism', () => {
  it('same input produces identical position output', () => {
    const adapter = new DefaultRuntimeRendererAdapter()
    const entity = createEntity({
      id: 'det',
      type: 'entity',
      components: Object.freeze([createPositionComponent(3, 7)]),
    })
    const world = makeWorld([entity])

    const r1 = adapter.adapt(world)
    const r2 = adapter.adapt(world)

    expect(r1.entities[0].position).toEqual(r2.entities[0].position)
  })

  it('two adapters produce identical positions', () => {
    const a = new DefaultRuntimeRendererAdapter()
    const b = new DefaultRuntimeRendererAdapter()
    const entity = createEntity({
      id: 'x',
      type: 'entity',
      components: Object.freeze([createPositionComponent(1, 2)]),
    })
    const world = makeWorld([entity])

    expect(a.adapt(world).entities[0].position).toEqual(
      b.adapt(world).entities[0].position
    )
  })
})

describe('Position — Frozen Outputs', () => {
  it('position in output is frozen', () => {
    const adapter = new DefaultRuntimeRendererAdapter()
    const entity = createEntity({
      id: 'frz',
      type: 'entity',
      components: Object.freeze([createPositionComponent(4, 8)]),
    })
    const result = adapter.adapt(makeWorld([entity]))

    expect(Object.isFrozen(result.entities[0].position)).toBe(true)
  })

  it('cannot mutate position through frozen output', () => {
    const adapter = new DefaultRuntimeRendererAdapter()
    const entity = createEntity({
      id: 'mut',
      type: 'entity',
      components: Object.freeze([createPositionComponent(1, 2)]),
    })
    const result = adapter.adapt(makeWorld([entity]))

    expect(() => {
      (result.entities[0].position as unknown as Record<string, unknown>).x = 999
    }).toThrow()
  })
})