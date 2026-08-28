import { describe, expect, it } from 'vitest'
import { DefaultVisualDesignSpecificationBuilder } from '../game-design'
import type { GameDesignSpecification } from '@genesis/shared'

function design(overrides: Partial<GameDesignSpecification> = {}): GameDesignSpecification {
  return {
    title: 'Visual test world',
    genre: 'platformer',
    objectives: [],
    entities: [
      { id: 'player-1', category: 'player', name: 'Player' },
      { id: 'enemy-1', category: 'enemy', name: 'Enemy' },
      { id: 'boss-1', category: 'enemy', name: 'Boss', role: 'boss' },
      { id: 'checkpoint-1', category: 'quest', name: 'Checkpoint', role: 'checkpoint' },
      { id: 'terrain-1', category: 'terrain', name: 'Terrain' },
    ],
    ...overrides,
  }
}

describe('DefaultVisualDesignSpecificationBuilder', () => {
  it.each([
    ['snow', 'snow-and-ice', 'cool', 'bright'],
    ['forest', 'forest', 'warm', 'bright'],
    ['desert', 'desert', 'warm', 'bright'],
    ['cyberpunk', 'cyberpunk', 'cool', 'neon'],
  ] as const)('maps %s to stable visual semantics', (sourceTheme, visualTheme, temperature, mood) => {
    const result = new DefaultVisualDesignSpecificationBuilder().build(design({ theme: { name: sourceTheme } }))

    expect(result.theme).toEqual({ sourceTheme, visualTheme })
    expect(result.palette.temperature).toBe(temperature)
    expect(result.palette.mood).toBe(mood)
  })

  it('uses a deterministic neutral fallback when theme is absent', () => {
    const builder = new DefaultVisualDesignSpecificationBuilder()
    const first = builder.build(design())
    const second = builder.build(design())

    expect(first).toEqual(second)
    expect(first.theme).toEqual({ sourceTheme: 'none', visualTheme: 'classic-neutral' })
  })

  it('derives top-down environment semantics for Survival without changing other genres', () => {
    const result = new DefaultVisualDesignSpecificationBuilder().build(design({ genre: 'survival', theme: { name: 'forest' } }))

    expect(result.worldSpatialMode).toBe('top-down')
    expect(result.environment).toEqual({
      terrain: 'natural ground arena surface',
      background: 'layered woodland viewed from above',
      atmosphere: 'lush and grounded',
    })
  })

  it('preserves stable entity identity and derives role semantics', () => {
    const entities = new DefaultVisualDesignSpecificationBuilder().build(design()).entities

    expect(entities.map(entity => entity.entityId)).toEqual([
      'player-1', 'enemy-1', 'boss-1', 'checkpoint-1', 'terrain-1',
    ])
    expect(entities.map(entity => entity.visualRole)).toEqual([
      'player character', 'enemy creature', 'boss character', 'checkpoint marker', 'terrain element',
    ])
  })

  it('deeply freezes the output', () => {
    const result = new DefaultVisualDesignSpecificationBuilder().build(design({ theme: { name: 'snow' } }))

    expect(Object.isFrozen(result)).toBe(true)
    expect(Object.isFrozen(result.theme)).toBe(true)
    expect(Object.isFrozen(result.palette)).toBe(true)
    expect(Object.isFrozen(result.environment)).toBe(true)
    expect(Object.isFrozen(result.entities)).toBe(true)
    expect(Object.isFrozen(result.entities[0])).toBe(true)
  })

  it('does not mutate the game design specification', () => {
    const input = design({ theme: { name: 'Snow' } })
    const snapshot = structuredClone(input)

    new DefaultVisualDesignSpecificationBuilder().build(input)

    expect(input).toEqual(snapshot)
  })
})
