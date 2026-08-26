import { describe, expect, it } from 'vitest'
import type { VisualDesignSpecification } from '@genesis/shared'
import { DefaultAssetSpecificationBuilder } from '../game-design'

function visualDesign(): VisualDesignSpecification {
  return {
    artDirection: 'stylized-2d',
    theme: { sourceTheme: 'snow', visualTheme: 'snow-and-ice' },
    palette: { temperature: 'cool', contrast: 'standard', mood: 'bright' },
    environment: {
      terrain: 'ice platforms',
      background: 'snow mountains',
      atmosphere: 'cold and bright',
    },
    entities: [
      { entityId: 'player-1', category: 'player', visualRole: 'player character' },
      { entityId: 'enemy-1', category: 'enemy', visualRole: 'enemy creature' },
      { entityId: 'enemy-2', category: 'enemy', visualRole: 'enemy creature' },
      { entityId: 'boss-1', category: 'enemy', visualRole: 'boss character' },
      { entityId: 'checkpoint-1', category: 'quest', visualRole: 'checkpoint marker' },
      { entityId: 'goal-1', category: 'quest', visualRole: 'goal marker' },
    ],
  }
}

describe('DefaultAssetSpecificationBuilder', () => {
  it('builds deterministic asset requirements with global context', () => {
    const builder = new DefaultAssetSpecificationBuilder()
    const first = builder.build(visualDesign())
    const second = builder.build(visualDesign())

    expect(first).toEqual(second)
    expect(first.visualContext).toEqual({
      artDirection: 'stylized-2d',
      theme: { sourceTheme: 'snow', visualTheme: 'snow-and-ice' },
      palette: { temperature: 'cool', contrast: 'standard', mood: 'bright' },
    })
  })

  it('creates unique stable IDs and preserves entity bindings', () => {
    const assets = new DefaultAssetSpecificationBuilder().build(visualDesign()).assets

    expect(assets.map(asset => asset.id)).toEqual([
      'entity-player-1-idle',
      'entity-player-1-run',
      'entity-player-1-jump',
      'entity-player-1-run-frame-2',
      'entity-enemy-1-primary',
      'entity-enemy-2-primary',
      'entity-boss-1-primary',
      'entity-checkpoint-1-primary',
      'entity-goal-1-primary',
      'terrain-main',
      'background-main',
    ])
    expect(new Set(assets.map(asset => asset.id)).size).toBe(assets.length)
    expect(assets.slice(0, 9).map(asset => asset.entityId)).toEqual([
      'player-1', 'player-1', 'player-1', 'player-1', 'enemy-1', 'enemy-2', 'boss-1', 'checkpoint-1', 'goal-1',
    ])
  })

  it('creates player, enemy, and boss character requirements', () => {
    const assets = new DefaultAssetSpecificationBuilder().build(visualDesign()).assets

    expect(assets[0]).toMatchObject({ kind: 'character', subject: 'player character', renderUsage: 'entity-sprite', requiredStates: ['idle', 'run', 'jump'] })
    expect(assets[0]).toMatchObject({ presentationState: 'idle' })
    expect(assets[1]).toMatchObject({ presentationState: 'run', presentationFrame: 0 })
    expect(assets[2]).toMatchObject({ presentationState: 'jump' })
    expect(assets[3]).toMatchObject({ presentationState: 'run', presentationFrame: 1 })
    expect(assets[4]).toMatchObject({ kind: 'character', subject: 'enemy creature', renderUsage: 'entity-sprite', requiredStates: ['idle'] })
    expect(assets[6]).toMatchObject({ kind: 'character', subject: 'boss character', renderUsage: 'entity-sprite', requiredStates: ['idle'] })
  })

  it('creates prop requirements for checkpoint and goal entities', () => {
    const assets = new DefaultAssetSpecificationBuilder().build(visualDesign()).assets

    expect(assets[7]).toMatchObject({ kind: 'prop', target: 'entity', visualRole: 'checkpoint marker', renderUsage: 'entity-sprite' })
    expect(assets[8]).toMatchObject({ kind: 'prop', target: 'entity', visualRole: 'goal marker', renderUsage: 'entity-sprite' })
  })

  it('creates terrain and background environment requirements', () => {
    const assets = new DefaultAssetSpecificationBuilder().build(visualDesign()).assets

    expect(assets[9]).toMatchObject({ id: 'terrain-main', kind: 'terrain', target: 'environment', subject: 'ice platforms', visualRole: 'ground terrain', renderUsage: 'ground-repeat-x' })
    expect(assets[10]).toMatchObject({ id: 'background-main', kind: 'background', target: 'environment', subject: 'snow mountains', visualRole: 'scene background', renderUsage: 'background-cover' })
  })

  it('deeply freezes the semantic output', () => {
    const result = new DefaultAssetSpecificationBuilder().build(visualDesign())

    expect(Object.isFrozen(result)).toBe(true)
    expect(Object.isFrozen(result.visualContext)).toBe(true)
    expect(Object.isFrozen(result.visualContext.theme)).toBe(true)
    expect(Object.isFrozen(result.visualContext.palette)).toBe(true)
    expect(Object.isFrozen(result.assets)).toBe(true)
    expect(Object.isFrozen(result.assets[0])).toBe(true)
    expect(Object.isFrozen(result.assets[0].requiredStates)).toBe(true)
    expect(Object.isFrozen(result.assets[0].technicalProfile)).toBe(true)
  })

  it('contains no resolved resource references', () => {
    const serialized = JSON.stringify(new DefaultAssetSpecificationBuilder().build(visualDesign()))

    expect(serialized).not.toContain('"url"')
    expect(serialized).not.toContain('"texture"')
    expect(serialized).not.toContain('"filePath"')
  })
})
