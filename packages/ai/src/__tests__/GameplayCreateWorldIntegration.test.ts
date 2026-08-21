import { describe, expect, it, vi } from 'vitest'
import type { GameDsl, GameWorldModel, World } from '@genesis/shared'
import {
  DefaultCreateWorldPipeline,
  DefaultGameIntentExtractor,
  DefaultIntentRouter,
  DefaultSemanticGameDslBuilder,
  DefaultSemanticWorldGenerator,
} from '../index'
import { DefaultGameplaySpecificationBuilder } from '../gameplay/GameplaySpecificationBuilder'
import type { GameplayGenerationResult, GameplayGenerationProvider } from '../gameplay/GameplayGenerationProvider'
import type { Projection } from '../game-intent/pipeline/DefaultCreateWorldPipeline'

const projection: Projection = {
  project(dsl: GameDsl): { world: World } {
    return {
      world: {
        entities: (dsl.world?.entities ?? []).map(entity => ({
          id: entity.id,
          type: entity.type,
          x: 0,
          y: 0,
        })),
      },
    }
  },
}

function createPipeline(gameplayProvider?: GameplayGenerationProvider): DefaultCreateWorldPipeline {
  return new DefaultCreateWorldPipeline(
    new DefaultIntentRouter(),
    new DefaultGameIntentExtractor(),
    new DefaultSemanticWorldGenerator(),
    new DefaultSemanticGameDslBuilder(),
    projection,
    undefined,
    gameplayProvider,
  )
}

describe('Gameplay create-world integration', () => {
  it('attaches a deterministic gameplay specification without changing the legacy result shape', () => {
    const result = createPipeline().execute({ input: 'create mario' })

    expect(result.success).toBe(true)
    expect(result.gameplaySpecification?.gameplayRevision).toBe(1)
    expect(result.gameplaySpecification?.mechanics.some(item => item.id === 'player-jump')).toBe(true)
    expect(result.gameplayRuleSet?.execution.status).toBe('not-active')
    expect(Object.keys(result)).toEqual(['route', 'world', 'success'])
  })

  it('passes the semantic world and capability catalog to an injected gameplay provider', async () => {
    let requestWorld: GameWorldModel | undefined
    const builder = new DefaultGameplaySpecificationBuilder()
    const gameplayProvider: GameplayGenerationProvider = {
      generate: async request => builder.build({
        semanticWorld: {
          worldType: request.context.game.worldType,
          entities: request.context.semanticWorld.entities,
        },
        capabilities: request.context.capabilities,
        gameplayRevision: 2,
        metadata: { source: 'ai' },
      }),
      generateWithDiagnostics: vi.fn(async request => {
        requestWorld = {
          worldType: request.context.game.worldType,
          entities: request.context.semanticWorld.entities,
        }
        const specification = builder.build({
          semanticWorld: requestWorld,
          capabilities: request.context.capabilities,
          gameplayRevision: 2,
          metadata: { source: 'ai' },
        })
        return {
          specification,
          diagnostics: {
            source: 'ai',
            validationStatus: 'valid',
            validationErrors: [],
            specification,
          },
        } satisfies GameplayGenerationResult
      }),
    }

    const result = await createPipeline(gameplayProvider).executeAsync({ input: 'create mario' })

    expect(result.success).toBe(true)
    expect(requestWorld?.worldType).toBe('platformer')
    expect(requestWorld?.entities.length).toBeGreaterThan(0)
    expect(result.gameplaySpecification?.gameplayRevision).toBe(2)
    expect(result.gameplayDiagnostics?.source).toBe('ai')
    expect(result.gameplayRuleSet?.metadata.source).toBe('ai')
  })

  it('falls back to deterministic gameplay data when the provider fails', async () => {
    const gameplayProvider: GameplayGenerationProvider = {
      generate: async () => {
        throw new Error('gameplay provider unavailable')
      },
      generateWithDiagnostics: vi.fn(async () => {
        throw new Error('gameplay provider unavailable')
      }),
    }

    const result = await createPipeline(gameplayProvider).executeAsync({ input: 'create farm' })

    expect(result.success).toBe(true)
    expect(result.gameplaySpecification?.gameLoop.completionMode).toBe('open-ended')
    expect(result.gameplayDiagnostics?.source).toBe('deterministic')
    expect(result.gameplayDiagnostics?.validationStatus).toBe('invalid')
    expect(result.gameplayDiagnostics?.fallbackReason).toContain('gameplay provider unavailable')
    expect(result.gameplayRuleSet?.metadata.source).toBe('deterministic')
    expect(result.gameplayRuleSet?.execution.status).toBe('not-active')
  })
})
