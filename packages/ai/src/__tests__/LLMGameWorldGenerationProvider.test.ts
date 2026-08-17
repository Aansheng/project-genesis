import { describe, expect, it } from 'vitest'
import { DefaultGameIntentExtractor } from '../game-intent'
import { DefaultCreateWorldPipeline } from '../game-intent/pipeline'
import { DefaultIntentRouter } from '../game-intent/router'
import { DefaultSemanticGameDslBuilder } from '../game-world'
import {
  DefaultGameWorldValidator,
  DeterministicGameWorldGenerationProvider,
  FallbackGameWorldGenerationProvider,
  GameWorldGenerationProviderAdapter,
  LLMGameWorldGenerationCandidateProvider,
  type StructuredGenerationClient,
} from '../game-world'

const request = {
  input: '创建 MarioWorld',
  intent: { genre: 'platformer' as const, title: 'MarioWorld' },
}

const validCandidate = JSON.stringify({
  worldType: 'platformer',
  entities: [{ id: 'player', category: 'player', name: 'Player' }],
})

describe('LLMGameWorldGenerationCandidateProvider', () => {
  it('passes the original request to the client and parses structured JSON', async () => {
    let received: unknown
    const client: StructuredGenerationClient = {
      generateStructured: async (value) => {
        received = value
        return validCandidate
      },
    }

    const candidate = await new LLMGameWorldGenerationCandidateProvider(client).generate(request)
    expect(received).toEqual(request)
    expect(candidate).toEqual(JSON.parse(validCandidate))
  })

  it('keeps malformed JSON and empty responses as failures', async () => {
    const malformed = new LLMGameWorldGenerationCandidateProvider({
      generateStructured: async () => '{',
    })
    const empty = new LLMGameWorldGenerationCandidateProvider({
      generateStructured: async () => '  ',
    })

    await expect(malformed.generate(request)).rejects.toThrow()
    await expect(empty.generate(request)).rejects.toThrow('Empty structured generation response')
  })
})

describe('LLM candidate validation and deterministic fallback', () => {
  it('rejects invalid semantic responses at the existing validator boundary', async () => {
    const invalidClient: StructuredGenerationClient = {
      generateStructured: async () => ({
        worldType: 'platformer',
        entities: [
          { id: 'player', category: 'player', name: 'Player' },
          { id: 'player', category: 'invalid', name: '' },
        ],
      }),
    }
    const primary = new GameWorldGenerationProviderAdapter(
      new LLMGameWorldGenerationCandidateProvider(invalidClient),
      new DefaultGameWorldValidator(),
    )

    await expect(primary.generate(request)).rejects.toThrow('Invalid game world candidate')
  })

  it('falls back to a playable deterministic platform world after validation failure', async () => {
    const primary = new GameWorldGenerationProviderAdapter(
      new LLMGameWorldGenerationCandidateProvider({
        generateStructured: async () => ({ worldType: 'platformer', entities: [] }),
      }),
      new DefaultGameWorldValidator(),
    )
    const provider = new FallbackGameWorldGenerationProvider(
      primary,
      new DeterministicGameWorldGenerationProvider(),
    )

    const world = await provider.generate(request)
    expect(world.worldType).toBe('platformer')
    expect(world.entities).toHaveLength(6)
  })

  it('runs through the async pipeline into the projected runtime world', async () => {
    const pipeline = new DefaultCreateWorldPipeline(
      new DefaultIntentRouter(),
      new DefaultGameIntentExtractor(),
      { generate: () => { throw new Error('sync path must not run') } },
      new DefaultSemanticGameDslBuilder(),
      { project: (dsl) => ({ world: { entities: dsl.world.entities.map((entity) => ({ id: entity.id, type: entity.type, x: 0, y: 0 })) } }) },
      new FallbackGameWorldGenerationProvider(
        new GameWorldGenerationProviderAdapter(
          new LLMGameWorldGenerationCandidateProvider({ generateStructured: async () => validCandidate }),
          new DefaultGameWorldValidator(),
        ),
        new DeterministicGameWorldGenerationProvider(),
      ),
    )

    const result = await pipeline.executeAsync(request)
    expect(result.success).toBe(true)
    expect(result.world.entities).toEqual([{ id: 'player', type: 'player', x: 0, y: 0 }])
  })
})
