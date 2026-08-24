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

  it('retries truncation once, passes the configured budget, and records attempts', async () => {
    const calls: unknown[] = []
    const provider = new LLMGameWorldGenerationCandidateProvider({
      generateStructured: async (...args) => {
        calls.push(args[2])
        return calls.length === 1 ? '{"entities":[' : validCandidate
      },
    }, undefined, { maxOutputTokens: 1234, timeoutMs: 99, maxAttempts: 2 })

    await expect(provider.generate(request)).resolves.toEqual(JSON.parse(validCandidate))
    expect(calls).toEqual([{ maxOutputTokens: 1234, timeoutMs: 99 }, { maxOutputTokens: 1234, timeoutMs: 99 }])
    expect(provider.getGenerationAttempts?.()).toEqual([
      { attempt: 1, status: 'failed', failureReason: 'output_truncated' },
      { attempt: 2, status: 'success' },
    ])
  })

  it('does not retry invalid candidate-shaped JSON', async () => {
    let calls = 0
    const provider = new LLMGameWorldGenerationCandidateProvider({
      generateStructured: async () => { calls++; return '{"entities":}' },
    })
    await expect(provider.generate(request)).rejects.toThrow('invalid structured JSON')
    expect(calls).toBe(1)
  })
})

describe('LLM candidate validation and deterministic fallback', () => {
  it('exposes AI source and the accepted rich design specification', async () => {
    const provider = new GameWorldGenerationProviderAdapter(
      new LLMGameWorldGenerationCandidateProvider({
        generateStructured: async () => ({
          title: '冰雪平台游戏', genre: 'platformer', theme: { name: 'ice' }, difficulty: 'medium',
          entities: [
            { id: 'player', category: 'player', name: 'Player' },
            { id: 'enemy-1', category: 'enemy', name: 'Patrol Enemy 1', role: 'patrol' },
            { id: 'enemy-2', category: 'enemy', name: 'Patrol Enemy 2', role: 'patrol' },
            { id: 'checkpoint', category: 'quest', name: 'Checkpoint' },
            { id: 'boss', category: 'enemy', name: 'Boss', role: 'boss' },
          ],
        }),
      }),
      new DefaultGameWorldValidator(),
    )

    const result = await provider.generateWithDiagnostics({ ...request, input: '创建冰雪平台游戏' })
    expect(result.diagnostics.source).toBe('ai')
    expect(result.diagnostics.validationStatus).toBe('valid')
    expect(result.diagnostics.specification?.theme).toEqual({ name: 'ice' })
    expect(result.diagnostics.specification?.difficulty).toBe('medium')
    expect(result.diagnostics.specification?.entities.filter(entity => entity.role === 'patrol')).toHaveLength(2)
    expect(result.world.entities.map(entity => entity.id)).toEqual(['player', 'enemy-1', 'enemy-2', 'checkpoint', 'boss'])
  })

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

    const result = await provider.generateWithDiagnostics(request)
    expect(result.world.worldType).toBe('platformer')
    expect(result.world.entities).toHaveLength(7)
    expect(result.diagnostics.source).toBe('deterministic')
    expect(result.diagnostics.validationStatus).toBe('invalid')
    expect(result.diagnostics.fallbackReason).toContain('entities must not be empty')
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
