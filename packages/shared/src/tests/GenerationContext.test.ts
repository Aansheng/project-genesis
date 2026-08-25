import { describe, expect, it } from 'vitest'
import {
  DefaultGameDesignGenerationContextBuilder,
  DefaultGameplayGenerationContextBuilder,
  DefaultImageGenerationContextBuilder,
  DefaultWorldEvolutionGenerationContextBuilder,
} from '../generation-context'
import { DEFAULT_GAMEPLAY_CAPABILITY_CATALOG } from '../gameplay'
import type { AssetRequirement, AssetSpecification } from '../asset-specification'
import type { GameWorldModel } from '../game-world'
import type { VisualDesignSpecification } from '../visual-design'

const semanticWorld: GameWorldModel = {
  worldType: 'farm',
  entities: [
    { id: 'cow-1', category: 'npc', name: 'Sheep' },
    { id: 'cow-2', category: 'npc', name: 'Sheep' },
    { id: 'cow-3', category: 'npc', name: 'Sheep' },
    { id: 'barn-1', category: 'building', name: 'Barn' },
  ],
}

const visualDesign: VisualDesignSpecification = {
  artDirection: 'stylized-2d',
  theme: { sourceTheme: 'green fields', visualTheme: 'bright pastoral farm' },
  palette: { temperature: 'warm', contrast: 'standard', mood: 'bright' },
  environment: { terrain: 'soft grass', background: 'rolling fields', atmosphere: 'clear daylight' },
  entities: semanticWorld.entities.map(entity => ({
    entityId: entity.id,
    category: entity.category,
    visualRole: entity.category === 'building' ? 'farm building' : 'livestock',
    visualArchetype: entity.name,
  })),
}

function character(id: string, subject: string, visualArchetype: string, entityId = id): AssetRequirement {
  return {
    id,
    kind: 'character',
    target: 'entity',
    entityId,
    subject,
    visualRole: 'livestock',
    visualArchetype,
    renderUsage: 'entity-sprite',
    requiredStates: ['idle'],
    technicalProfile: { transparentBackground: true, view: 'side' },
  }
}

const sheepBindings = [
  character('entity-cow-1-primary', 'Sheep', 'Sheep', 'cow-1'),
  character('entity-cow-2-primary', 'Sheep', 'Sheep', 'cow-2'),
  character('entity-cow-3-primary', 'Sheep', 'Sheep', 'cow-3'),
]

describe('generation context builders', () => {
  it('projects only current semantic authority for world evolution', () => {
    const context = new DefaultWorldEvolutionGenerationContextBuilder().build({
      metadata: { worldId: 'world-a', operationId: 'evolution-1', semanticRevision: 4, runtimeSemanticRevision: 4, visualRevision: 2 },
      semanticWorld,
      properties: { theme: 'green fields', timeOfDay: 'day' },
      selectedEntityId: 'cow-2',
    })

    expect(context).toMatchObject({
      scope: 'world-evolution',
      worldId: 'world-a',
      semanticRevision: 4,
      runtimeSemanticRevision: 4,
      visualRevision: 2,
      world: { worldType: 'farm', properties: { theme: 'green fields', timeOfDay: 'day' } },
      entities: [
        { id: 'cow-1', name: 'Sheep', category: 'npc' },
        { id: 'cow-2', name: 'Sheep', category: 'npc' },
        { id: 'cow-3', name: 'Sheep', category: 'npc' },
        { id: 'barn-1', name: 'Barn', category: 'building' },
      ],
      selectedEntityId: 'cow-2',
    })
    expect(context).not.toHaveProperty('renderer')
    expect(context).not.toHaveProperty('runtimeTick')
    expect(context).not.toHaveProperty('history')
    expect(Object.isFrozen(context)).toBe(true)
    expect(Object.isFrozen(context.entities)).toBe(true)
    expect(Object.isFrozen(context.world.properties)).toBe(true)

    const invalidSelection = new DefaultWorldEvolutionGenerationContextBuilder().build({
      semanticWorld,
      selectedEntityId: 'missing-entity',
    })
    expect(invalidSelection).not.toHaveProperty('selectedEntityId')
  })

  it('keeps image context current-state based when identity bindings retain old IDs', () => {
    const otherRequirements = [
      character('entity-fox-1-primary', 'Fox', 'Fox'),
      character('entity-wolf-1-primary', 'Wolf', 'Wolf'),
      character('entity-goat-1-primary', 'Goat', 'Goat'),
      character('entity-horse-1-primary', 'Horse', 'Horse'),
    ]
    const assetSpecification: AssetSpecification = {
      visualContext: {
        artDirection: visualDesign.artDirection,
        theme: visualDesign.theme,
        palette: visualDesign.palette,
      },
      assets: [...sheepBindings, ...otherRequirements],
    }
    const context = new DefaultImageGenerationContextBuilder().build({
      metadata: { worldId: 'world-a', operationId: 'evolution-1', semanticRevision: 5, runtimeSemanticRevision: 5, visualRevision: 3 },
      semanticWorld,
      properties: { theme: 'green fields', timeOfDay: 'night' },
      visualDesign,
      assetSpecification,
      requirement: sheepBindings[0],
      bindings: sheepBindings,
    })

    expect(context.game).toEqual({ worldType: 'farm', theme: 'green fields' })
    expect(context.visual.targetArchetype).toBe('Sheep')
    expect(context.asset).toMatchObject({
      canonicalAssetId: 'entity-cow-1-primary',
      assetIds: ['entity-cow-1-primary', 'entity-cow-2-primary', 'entity-cow-3-primary'],
      entityIds: ['cow-1', 'cow-2', 'cow-3'],
      kind: 'character',
      target: 'entity',
      subject: 'Sheep',
    })
    expect(context.asset.renderUsage).toBe('entity-sprite')
    expect(context.references.length).toBeLessThanOrEqual(3)
    expect(context.references.map(reference => reference.visualArchetype)).toEqual(['Fox', 'Wolf', 'Goat'])
    expect(JSON.stringify(context)).not.toContain('resource')
    expect(JSON.stringify(context)).not.toContain('uri')
    expect(Object.isFrozen(context)).toBe(true)
    expect(Object.isFrozen(context.asset)).toBe(true)
    expect(Object.isFrozen(context.references)).toBe(true)
  })

  it('captures existing game-design request and capabilities without requiring a world', () => {
    const context = new DefaultGameDesignGenerationContextBuilder().build({
      metadata: { sessionId: 'session-a' },
      instruction: '创建一个农场游戏',
      genre: 'farm',
      title: '牧场',
      capabilities: {
        supportedGenres: ['farm', 'rpg'],
        supportedEntityCategories: ['player', 'npc'],
        supportedDifficulties: ['easy', 'medium'],
        supportedObjectiveTypes: ['collect-item'],
        realizedSemantics: ['semantic-world'],
        preservedSemantics: ['theme'],
      },
    })

    expect(context.scope).toBe('game-design')
    expect(context.sessionId).toBe('session-a')
    expect(context.request).toEqual({ instruction: '创建一个农场游戏', genre: 'farm', title: '牧场' })
    expect(context.capabilities.realizedSemantics).toEqual(['semantic-world'])
    expect(context).not.toHaveProperty('world')
    expect(Object.isFrozen(context.capabilities)).toBe(true)
  })

  it('builds gameplay context from current semantic entities and capability truth', () => {
    const context = new DefaultGameplayGenerationContextBuilder().build({
      metadata: { worldId: 'world-1', semanticRevision: 3, gameplayRevision: 0 },
      semanticWorld,
      capabilities: DEFAULT_GAMEPLAY_CAPABILITY_CATALOG,
      instruction: 'design the farm loop',
    })

    expect(Object.isFrozen(context)).toBe(true)
    expect(Object.isFrozen(context.semanticWorld)).toBe(true)
    expect(Object.isFrozen(context.semanticWorld.entities)).toBe(true)
    expect(context.game.worldType).toBe('farm')
    expect(context.semanticWorld.entities.map(entity => entity.id)).toEqual(['cow-1', 'cow-2', 'cow-3', 'barn-1'])
    expect(context.capabilities.supportedMechanicIds).toContain('player-move')
    expect(context).not.toHaveProperty('pixi')
    expect(context).not.toHaveProperty('rawProviderLogs')
  })
})
