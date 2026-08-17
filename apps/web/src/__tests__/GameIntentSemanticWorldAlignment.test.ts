import { describe, expect, it } from 'vitest'
import {
  DefaultCreateWorldPipeline,
  DefaultGameIntentExtractor,
  DefaultIntentRouter,
  DefaultSemanticGameDslBuilder,
  DefaultSemanticWorldGenerator,
} from '@genesis/ai'
import { DefaultRuntimeProjection } from '@genesis/runtime'

function createPipeline(): DefaultCreateWorldPipeline {
  return new DefaultCreateWorldPipeline(
    new DefaultIntentRouter(),
    new DefaultGameIntentExtractor(),
    new DefaultSemanticWorldGenerator(),
    new DefaultSemanticGameDslBuilder(),
    new DefaultRuntimeProjection(),
  )
}

describe('WO-S10-008: Game Intent → Semantic World alignment', () => {
  it.each([
    ['创建农场', 'farm'],
    ['create RPG world', 'rpg'],
    ['create survival world', 'survival'],
    ['create sandbox world', 'sandbox'],
    ['创建 MarioWorld', 'platformer'],
    ['create Mario game', 'platformer'],
  ] as const)('%s resolves to the %s world template', (input, expectedWorldType) => {
    const pipeline = createPipeline()
    const result = pipeline.execute({ input })

    expect(result.route).toBe('create-world')
    expect(result.success).toBe(true)
    expect(result.world.entities.length).toBeGreaterThan(0)

    if (expectedWorldType === 'platformer') {
      expect(result.world.entities.length).toBe(6)
      expect(result.world.entities.map((entity) => entity.type)).toEqual([
        'player', 'terrain', 'terrain', 'enemy', 'item', 'item',
      ])
    }
  })

  it('uses GameIntent genre as the authoritative world type', () => {
    const generator = new DefaultSemanticWorldGenerator()
    const model = { overview: { title: 'Custom title', traceCount: 0, timelineCount: 0, historyCount: 0 } }
    const result = generator.generate(model, Object.freeze({ genre: 'farm', title: 'Custom title' }))

    expect(result.worldType).toBe('farm')
    expect(result.entities).toHaveLength(8)
  })

  it('keeps standalone title-based generation as a compatibility fallback', () => {
    const generator = new DefaultSemanticWorldGenerator()
    const model = { overview: { title: 'MarioWorld', traceCount: 0, timelineCount: 0, historyCount: 0 } }

    expect(generator.generate(model).worldType).toBe('sandbox')
  })

  it('projects MarioWorld entities with renderable PositionComponents', () => {
    const result = createPipeline().execute({ input: '创建 MarioWorld' })

    expect(result.world.entities).toHaveLength(6)
    for (const entity of result.world.entities) {
      expect(entity.components?.some((component) => component.type === 'position')).toBe(true)
    }
  })

  it('is deterministic and immutable', () => {
    const pipeline = createPipeline()
    const first = pipeline.execute({ input: '创建 MarioWorld' })
    const second = pipeline.execute({ input: '创建 MarioWorld' })

    expect(first.world).toEqual(second.world)
    expect(Object.isFrozen(first.world)).toBe(true)
    expect(Object.isFrozen(first.world.entities)).toBe(true)
  })

  it('preserves unknown command routing behavior', () => {
    const result = createPipeline().execute({ input: 'hello' })

    expect(result).toEqual({
      route: 'unknown',
      world: { entities: [] },
      success: false,
    })
  })
})
