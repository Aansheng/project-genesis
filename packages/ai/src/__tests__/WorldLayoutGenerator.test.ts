import { describe, expect, it } from 'vitest'
import { DefaultWorldLayoutGenerator } from '../game-world'
import type { GameWorldModel } from '@genesis/shared'

const platformer: GameWorldModel = {
  worldType: 'platformer',
  entities: [
    { id: 'player', category: 'player', name: 'Player' },
    { id: 'terrain', category: 'terrain', name: 'Terrain' },
    { id: 'platform', category: 'terrain', name: 'Platform' },
    { id: 'enemy', category: 'enemy', name: 'Enemy' },
    { id: 'goal', category: 'item', name: 'Goal' },
    { id: 'checkpoint', category: 'item', name: 'Checkpoint' },
  ],
}

describe('DefaultWorldLayoutGenerator', () => {
  it('creates frozen deterministic platformer positions', () => {
    const generator = new DefaultWorldLayoutGenerator()
    const first = generator.generate(platformer)
    const second = generator.generate(platformer)
    expect(first).toEqual(second)
    expect(Object.isFrozen(first)).toBe(true)
    expect(Object.isFrozen(first.positions)).toBe(true)
    expect(Object.isFrozen(first.positions.player)).toBe(true)
    expect(first.positions).toEqual({
      player: { x: 80, y: 300 },
      terrain: { x: 160, y: 400 },
      platform: { x: 300, y: 320 },
      enemy: { x: 380, y: 360 },
      goal: { x: 650, y: 300 },
      checkpoint: { x: 500, y: 320 },
    })
    expect(new Set(Object.values(first.positions).map(({ x, y }) => `${x}:${y}`)).size).toBe(6)
  })

  it('uses a generic deterministic layout for non-platformer worlds and unknown ids', () => {
    const generator = new DefaultWorldLayoutGenerator()
    const world: GameWorldModel = {
      worldType: 'farm',
      entities: [
        { id: 'custom', category: 'item', name: 'Custom' },
        { id: 'custom-2', category: 'terrain', name: 'Custom 2' },
      ],
    }
    expect(generator.generate(world).positions).toEqual({
      custom: { x: 80, y: 80 },
      'custom-2': { x: 200, y: 80 },
    })
  })

  it('handles empty and large worlds without mutating input', () => {
    const generator = new DefaultWorldLayoutGenerator()
    const entities = Array.from({ length: 100 }, (_, index) => ({
      id: `entity-${index}`, category: 'item' as const, name: `Entity ${index}`,
    }))
    const world: GameWorldModel = { worldType: 'sandbox', entities }
    const before = JSON.stringify(world)
    const result = generator.generate(world)
    expect(generator.generate({ worldType: 'sandbox', entities: [] }).positions).toEqual({})
    expect(Object.keys(result.positions)).toHaveLength(100)
    expect(JSON.stringify(world)).toBe(before)
  })
})
