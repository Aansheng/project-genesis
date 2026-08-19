import { describe, expect, it } from 'vitest'
import {
  DefaultGameWorldValidator,
  GameWorldGenerationProviderAdapter,
  type GameWorldGenerationCandidateProvider,
} from '../game-world'

describe('structured game world generation contract', () => {
  it('converts a valid semantic candidate into an immutable GameWorldModel', () => {
    const result = new DefaultGameWorldValidator().validate({
      worldType: 'rpg',
      entities: [{ id: 'hero', category: 'player', name: 'Hero' }],
    })

    expect(result.valid).toBe(true)
    expect(result.world?.worldType).toBe('rpg')
    expect(Object.isFrozen(result.world)).toBe(true)
    expect(Object.isFrozen(result.world?.entities)).toBe(true)
  })

  it('rejects malformed, unsupported, and duplicate semantic data', () => {
    const result = new DefaultGameWorldValidator().validate({
      worldType: 'dungeon',
      entities: [
        { id: 'hero', category: 'player', name: 'Hero' },
        { id: 'hero', category: 'runtime', name: '' },
      ],
    })

    expect(result.valid).toBe(false)
    expect(result.world).toBeUndefined()
    expect(result.errors.length).toBe(4)
  })

  it('preserves design semantics while projecting supported fields', () => {
    const result = new DefaultGameWorldValidator().validate({
      title: 'Ice Platformer', genre: 'platformer', theme: { name: 'ice' }, difficulty: 'medium',
      objectives: [{ type: 'defeat-boss', target: 'final-boss' }],
      entities: [
        { id: 'player', category: 'player', name: 'Player' },
        { id: 'boss', category: 'enemy', name: 'Boss', role: 'boss' },
      ],
    })

    expect(result.specification).toEqual({
      title: 'Ice Platformer', genre: 'platformer', theme: { name: 'ice' }, difficulty: 'medium',
      objectives: [{ type: 'defeat-boss', target: 'final-boss' }],
      entities: [
        { id: 'player', category: 'player', name: 'Player' },
        { id: 'boss', category: 'enemy', name: 'Boss', role: 'boss' },
      ],
    })
    expect(result.world).toEqual({ worldType: 'platformer', entities: [
      { id: 'player', category: 'player', name: 'Player' },
      { id: 'boss', category: 'enemy', name: 'Boss' },
    ] })
    expect(Object.isFrozen(result.specification)).toBe(true)
  })

  it('keeps provider output above DSL and runtime boundaries', async () => {
    const provider: GameWorldGenerationCandidateProvider = {
      generate: async () => ({
        worldType: 'sandbox',
        entities: [{ id: 'player', category: 'player', name: 'Player' }],
      }),
    }
    const world = await new GameWorldGenerationProviderAdapter(
      provider,
      new DefaultGameWorldValidator(),
    ).generate({ input: 'create a world', intent: { genre: 'sandbox', title: 'World' } })

    expect(world).toEqual({
      worldType: 'sandbox',
      entities: [{ id: 'player', category: 'player', name: 'Player' }],
    })
  })

  it('rejects a generated world without exactly one player', () => {
    const validator = new DefaultGameWorldValidator()
    expect(validator.validate({ worldType: 'farm', entities: [{ id: 'cow', category: 'npc', name: 'Cow' }] }).errors).toContain('entities must contain exactly one player')
    expect(validator.validate({ worldType: 'farm', entities: [
      { id: 'player-1', category: 'player', name: 'Player 1' },
      { id: 'player-2', category: 'player', name: 'Player 2' },
    ] }).errors).toContain('entities must contain exactly one player')
  })
})
