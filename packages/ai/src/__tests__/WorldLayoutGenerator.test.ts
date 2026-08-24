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
    { id: 'collectible', category: 'item', name: 'Coin' },
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
      collectible: { x: 220, y: 320 },
      goal: { x: 650, y: 300 },
      checkpoint: { x: 500, y: 320 },
    })
    expect(new Set(Object.values(first.positions).map(({ x, y }) => `${x}:${y}`)).size).toBe(7)
  })

  it('uses a grounded deterministic layout for non-platformer worlds and unknown ids', () => {
    const generator = new DefaultWorldLayoutGenerator()
    const world: GameWorldModel = {
      worldType: 'farm',
      entities: [
        { id: 'custom', category: 'item', name: 'Custom' },
        { id: 'custom-2', category: 'terrain', name: 'Custom 2' },
      ],
    }
    expect(generator.generate(world).positions).toEqual({
      custom: { x: 648, y: 384 },
      'custom-2': { x: 376, y: 400 },
    })
  })

  it('keeps player spawn and repeated placements independent of entity order', () => {
    const generator = new DefaultWorldLayoutGenerator()
    const world: GameWorldModel = {
      worldType: 'farm',
      entities: [
        { id: 'cow-1', category: 'npc', name: 'Cow' },
        { id: 'player', category: 'player', name: 'Player' },
        { id: 'cow-2', category: 'npc', name: 'Cow' },
        { id: 'ground', category: 'terrain', name: 'Ground' },
      ],
    }
    const reversed = { ...world, entities: [...world.entities].reverse() }
    const first = generator.generate(world).positions
    const second = generator.generate(reversed).positions

    expect(first).toEqual(second)
    expect(first.player).toEqual({ x: 80, y: 300 })
    expect(first.ground?.y).toBe(400)
    expect(first['cow-1']).not.toEqual(first['cow-2'])
  })

  it('keeps genre anchors readable around the shared player spawn', () => {
    const generator = new DefaultWorldLayoutGenerator()
    const farm = generator.generate({ worldType: 'farm', entities: [{ id: 'player', category: 'player', name: 'Player' }, { id: 'barn', category: 'building', name: 'Barn' }] })
    const rpg = generator.generate({ worldType: 'rpg', entities: [{ id: 'player', category: 'player', name: 'Player' }, { id: 'town', category: 'building', name: 'Town' }] })

    expect(farm.positions.player).toEqual({ x: 80, y: 300 })
    expect(rpg.positions.player).toEqual({ x: 80, y: 300 })
    expect(farm.positions.barn).toEqual({ x: 320, y: 304 })
    expect(rpg.positions.town).toEqual({ x: 320, y: 304 })
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
