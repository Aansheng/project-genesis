import { describe, expect, it } from 'vitest'
import { DefaultGameIntentExtractor } from '../game-intent'
import {
  DeterministicGameWorldGenerationProvider,
  type GameWorldGenerationProvider,
} from '../game-world'
import { DefaultCreateWorldPipeline } from '../game-intent/pipeline'
import { DefaultIntentRouter } from '../game-intent/router'
import { DefaultSemanticGameDslBuilder } from '../game-world'
import type { PromptAssemblyDomainModel } from '../observatory/domain'

describe('DeterministicGameWorldGenerationProvider', () => {
  it('implements the async provider boundary and preserves semantic output', async () => {
    const provider: GameWorldGenerationProvider = new DeterministicGameWorldGenerationProvider()
    const input = '创建 MarioWorld'
    const intent = new DefaultGameIntentExtractor().extract({
      overview: { title: input, traceCount: 0, timelineCount: 0, historyCount: 0 },
    } as unknown as PromptAssemblyDomainModel)

    const world = await provider.generate({ input, intent })

    expect(world.worldType).toBe('platformer')
    expect(world.entities.length).toBeGreaterThan(0)
  })

  it('can be injected at the async CreateWorld integration point', async () => {
    const pipeline = new DefaultCreateWorldPipeline(
      new DefaultIntentRouter(),
      new DefaultGameIntentExtractor(),
      { generate: () => { throw new Error('sync generator should not run') } },
      new DefaultSemanticGameDslBuilder(),
      { project: (dsl) => ({ world: { entities: dsl.world.entities.map((entity) => ({ id: entity.id, type: entity.type, x: 0, y: 0 })) } }) },
      new DeterministicGameWorldGenerationProvider(),
    )

    const result = await pipeline.executeAsync({ input: '创建 MarioWorld' })
    expect(result.success).toBe(true)
    expect(result.world.entities.length).toBeGreaterThan(0)
  })
})
