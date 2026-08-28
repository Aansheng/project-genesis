import { describe, expect, it } from 'vitest'
import { DefaultAssetSpecificationBuilder, DefaultVisualDesignSpecificationBuilder } from '@genesis/ai'
import {
  DefaultSemanticWorldDeltaApplier,
  type AssetSpecification,
  type GameDesignSpecification,
  type GameWorldModel,
  type RuntimeEvolutionResult,
  type SemanticWorldMutationResult,
  type VisualDesignSpecification,
  type World,
  type WorldSemanticDelta,
} from '@genesis/shared'
import { DefaultVisualEvolutionPlanner } from '../VisualEvolutionPlanner'

const worldId = 'world-visual-test'

function world(entities: GameWorldModel['entities'], worldType: GameWorldModel['worldType'] = 'farm'): GameWorldModel {
  return Object.freeze({ worldType, entities: Object.freeze(entities.map(entity => Object.freeze({ ...entity }))) })
}

function designFor(semanticWorld: GameWorldModel, theme = 'green fields'): GameDesignSpecification {
  return {
    title: 'Visual evolution test world',
    genre: semanticWorld.worldType === 'survival' ? 'survival' : 'farm',
    theme: { name: theme },
    objectives: [],
    entities: semanticWorld.entities,
  }
}

function specifications(semanticWorld: GameWorldModel, theme = 'green fields'): {
  readonly visual: VisualDesignSpecification
  readonly assets: AssetSpecification
} {
  const visual = new DefaultVisualDesignSpecificationBuilder().build(designFor(semanticWorld, theme))
  return { visual, assets: new DefaultAssetSpecificationBuilder().build(visual) }
}

function apply(
  before: GameWorldModel,
  operations: WorldSemanticDelta['operations'],
  revision = 0,
  properties: { readonly theme?: string; readonly timeOfDay?: string } = { theme: 'green fields' },
): SemanticWorldMutationResult {
  return new DefaultSemanticWorldDeltaApplier().apply(before, {
    operationId: `visual-evolution-${revision + 1}-${operations[0]?.kind ?? 'change'}`,
    worldId,
    semanticRevision: revision,
    operations,
    summary: 'visual test mutation',
  }, { worldId, semanticRevision: revision, properties })
}

function runtimeResult(mutation: SemanticWorldMutationResult, previousRevision = mutation.previousRevision): RuntimeEvolutionResult {
  const empty: World = Object.freeze({ entities: Object.freeze([]) }) as unknown as World
  return Object.freeze({
    status: 'synchronized',
    runtimeImpact: 'synchronized',
    worldId,
    operationId: mutation.operationId,
    previousWorld: empty,
    updatedWorld: empty,
    appliedOperations: mutation.appliedOperations,
    affectedEntityIds: mutation.affectedEntityIds,
    addedEntityIds: mutation.addedEntityIds,
    removedEntityIds: mutation.removedEntityIds,
    preservedEntityIds: Object.freeze([]),
    preservedComponentFacts: Object.freeze([]),
    previousRevision,
    updatedRevision: mutation.updatedRevision,
  })
}

function planFor(
  before: GameWorldModel,
  operations: WorldSemanticDelta['operations'],
  options: { readonly timeOfDay?: string; readonly visualRevision?: number } = {},
) {
  const specs = specifications(before, 'green fields')
  const mutation = apply(before, operations, 0, {
    theme: 'green fields',
    ...(options.timeOfDay ? { timeOfDay: 'day' } : {}),
  })
  const planner = new DefaultVisualEvolutionPlanner()
  const result = planner.plan(
    before,
    mutation.updatedWorld,
    mutation,
    runtimeResult(mutation),
    specs.visual,
    specs.assets,
    { worldId, semanticRevision: 0, runtimeRevision: 0, visualRevision: options.visualRevision ?? 0 },
  )
  return { result, mutation, specs }
}

const farm = world([
  { id: 'player-1', category: 'player', name: 'Player' },
  { id: 'cow-1', category: 'npc', name: 'Cow' },
  { id: 'cow-2', category: 'npc', name: 'Cow' },
  { id: 'cow-3', category: 'npc', name: 'Cow' },
  { id: 'crop-1', category: 'terrain', name: 'Crop' },
  { id: 'barn-1', category: 'building', name: 'Barn' },
])

describe('DefaultVisualEvolutionPlanner', () => {
  it('plans Cow ×3 → Sheep as one canonical requirement with three bindings', () => {
    const { result, specs } = planFor(farm, [{
      kind: 'replace-entity-semantic',
      scope: 'archetype-group',
      targetIds: ['cow-1', 'cow-2', 'cow-3'],
      from: [
        { name: 'Cow', category: 'npc' },
        { name: 'Cow', category: 'npc' },
        { name: 'Cow', category: 'npc' },
      ],
      replacement: { name: 'Sheep', category: 'npc' },
      preserveIdentity: true,
    }])

    expect(result.status).toBe('planned')
    expect(result.generationRequired).toHaveLength(1)
    expect(result.generationRequired[0]?.visualArchetype).toBe('Sheep')
    expect(result.replacedVisualRequirements).toHaveLength(1)
    expect(result.replacedVisualRequirements[0]?.before.visualArchetype).toBe('Cow')
    expect(result.replacedVisualRequirements[0]?.after.visualArchetype).toBe('Sheep')
    expect(result.newArchetypes[0]?.entityIds).toEqual(['cow-1', 'cow-2', 'cow-3'])
    expect(result.generationRequired).not.toHaveLength(3)
    expect(result.unaffectedArchetypes).toEqual(expect.arrayContaining(['Player', 'Crop', 'Barn']))
    expect(result.previousAssetSpecification).toBe(specs.assets)
  })

  it('keeps distinct Cow and Sheep archetypes in separate canonical groups', () => {
    const before = world([
      { id: 'cow-1', category: 'npc', name: 'Cow' },
      { id: 'sheep-1', category: 'npc', name: 'Sheep' },
    ])
    const { result } = planFor(before, [{
      kind: 'update-world-property',
      scope: 'world',
      property: 'timeOfDay',
      to: 'night',
    }], { timeOfDay: 'day' })

    expect(result.generationRequired.map(asset => asset.kind)).toEqual(['background'])
    expect(result.assetImpactPlan.entries.filter(entry => entry.after?.visualArchetype === 'Cow' || entry.after?.visualArchetype === 'Sheep').map(entry => entry.action)).toEqual(['UNCHANGED', 'UNCHANGED'])
    expect(result.bindingOnlyChanges).toHaveLength(0)
    expect(result.unaffectedArchetypes).toEqual(expect.arrayContaining(['Cow', 'Sheep']))
  })

  it('keeps the shared Cow asset for remaining cows while adding one Bull canonical requirement', () => {
    const { result } = planFor(farm, [{
      kind: 'replace-entity-semantic',
      scope: 'entity',
      targetIds: ['cow-1'],
      from: [{ name: 'Cow', category: 'npc' }],
      replacement: { name: 'Bull', category: 'npc' },
      preserveIdentity: true,
    }])

    expect(result.generationRequired.map(asset => asset.visualArchetype)).toEqual(['Bull'])
    expect(result.unaffectedArchetypes).toContain('Cow')
    expect(result.bindingOnlyChanges).toHaveLength(1)
    expect(result.bindingOnlyChanges[0]).toMatchObject({ entityId: 'cow-1', action: 'REMOVE' })
    expect(result.assetImpactPlan.entries.some(entry => entry.action === 'ADD' && entry.after?.visualArchetype === 'Bull')).toBe(true)
  })

  it('changes Merchant to Robot without touching a shared Villager archetype', () => {
    const before = world([
      { id: 'merchant-1', category: 'npc', name: 'Merchant' },
      { id: 'villager-1', category: 'npc', name: 'Villager' },
    ])
    const { result } = planFor(before, [{
      kind: 'replace-entity-semantic',
      scope: 'entity',
      targetIds: ['merchant-1'],
      from: [{ name: 'Merchant', category: 'npc' }],
      replacement: { name: 'Robot', category: 'npc' },
      preserveIdentity: true,
    }])

    expect(result.generationRequired.map(asset => asset.visualArchetype)).toEqual(['Robot'])
    expect(result.unaffectedArchetypes).toContain('Villager')
    expect(result.unaffectedAssetIds).toContain('entity-villager-1-primary')
  })

  it('keeps Slime and Skeleton as distinct canonical identities', () => {
    const before = world([
      { id: 'slime-1', category: 'enemy', name: 'Slime' },
      { id: 'skeleton-1', category: 'enemy', name: 'Skeleton' },
    ])
    const { result } = planFor(before, [{
      kind: 'update-world-property',
      scope: 'world',
      property: 'timeOfDay',
      to: 'night',
    }], { timeOfDay: 'day' })

    expect(result.assetImpactPlan.entries.filter(entry => entry.after?.visualArchetype === 'Slime' || entry.after?.visualArchetype === 'Skeleton').map(entry => entry.action)).toEqual(['UNCHANGED', 'UNCHANGED'])
    expect(result.unaffectedArchetypes).toEqual(expect.arrayContaining(['Slime', 'Skeleton']))
  })

  it('adds Merchant as one generation-eligible canonical requirement', () => {
    const { result } = planFor(farm, [{
      kind: 'add-entity',
      scope: 'entity',
      semantic: { name: 'Merchant', category: 'npc' },
      count: 1,
    }])

    expect(result.addedVisualRequirements).toHaveLength(1)
    expect(result.addedVisualRequirements[0]?.visualArchetype).toBe('Merchant')
    expect(result.generationRequired).toHaveLength(1)
    expect(result.assetImpactPlan.entries.at(-1)?.action).toBe('ADD')
  })

  it('reuses the existing Survival enemy visual identity for added enemies', () => {
    const before = world([
      { id: 'player', category: 'player', name: 'Survivor' },
      { id: 'enemy', category: 'enemy', name: '荒野敌人' },
    ], 'survival')
    const { result } = planFor(before, [{
      kind: 'add-entity',
      scope: 'entity',
      semantic: { name: '怪物', category: 'enemy' },
      count: 2,
    }])

    expect(result.generationRequired).toHaveLength(0)
    expect(result.status).toBe('no_visual_impact')
    expect(result.bindingOnlyChanges).toEqual([
      expect.objectContaining({ entityId: 'entity-1', action: 'ADD' }),
      expect.objectContaining({ entityId: 'entity-2', action: 'ADD' }),
    ])
    expect(result.updatedVisualDesign.entities.filter(entity => entity.entityId.startsWith('entity-'))).toEqual([
      expect.objectContaining({ visualArchetype: '荒野敌人', visualRole: 'enemy creature' }),
      expect.objectContaining({ visualArchetype: '荒野敌人', visualRole: 'enemy creature' }),
    ])
  })

  it('removes Boss binding and marks its orphaned asset without generation', () => {
    const before = world([
      { id: 'boss-1', category: 'enemy', name: 'Boss' },
      { id: 'player-1', category: 'player', name: 'Player' },
    ])
    const { result } = planFor(before, [{
      kind: 'remove-entity',
      scope: 'entity',
      targetIds: ['boss-1'],
    }])

    expect(result.removedVisualRequirements).toHaveLength(1)
    expect(result.assetImpactPlan.orphanedAssetIds).toEqual(['entity-boss-1-primary'])
    expect(result.generationRequired).toHaveLength(0)
    expect(result.status).toBe('no_visual_impact')
  })

  it('removes one member from a shared group as binding-only', () => {
    const { result } = planFor(farm, [{
      kind: 'remove-entity',
      scope: 'entity',
      targetIds: ['cow-1'],
    }])

    expect(result.generationRequired).toHaveLength(0)
    expect(result.bindingOnlyChanges).toEqual([
      expect.objectContaining({ entityId: 'cow-1', action: 'REMOVE' }),
    ])
    expect(result.unaffectedArchetypes).toContain('Cow')
  })

  it('removes all members of a shared group as one orphan without generation', () => {
    const { result } = planFor(farm, [{
      kind: 'remove-entity',
      scope: 'archetype-group',
      targetIds: ['cow-1', 'cow-2', 'cow-3'],
    }])

    expect(result.assetImpactPlan.entries.filter(entry => entry.action === 'REMOVE')).toHaveLength(1)
    expect(result.assetImpactPlan.orphanedAssetIds).toEqual(['entity-cow-1-primary'])
    expect(result.generationRequired).toHaveLength(0)
  })

  it('returns no generation work for a world update that leaves visual context unchanged', () => {
    const { result } = planFor(farm, [{
      kind: 'update-world-property',
      scope: 'world',
      property: 'theme',
      from: 'green fields',
      to: 'green fields',
    }])

    expect(result.generationRequired).toHaveLength(0)
    expect(result.status).toBe('no_visual_impact')
    expect(result.noVisualImpactReason).toContain('No visual specification')
  })

  it('applies the typed time-of-day dependency to background only', () => {
    const { result } = planFor(farm, [{
      kind: 'update-world-property',
      scope: 'world',
      property: 'timeOfDay',
      to: 'night',
    }], { timeOfDay: 'day' })

    expect(result.worldLevelVisualImpact).toEqual([
      expect.objectContaining({ property: 'timeOfDay', affectedAssetKinds: ['background'], affectedAssetIds: ['background-main'] }),
    ])
    expect(result.generationRequired).toHaveLength(1)
    expect(result.generationRequired[0]?.kind).toBe('background')
    expect(result.generationRequired.every(asset => asset.kind !== 'character' && asset.kind !== 'terrain')).toBe(true)
  })

  it('treats theme changes as broad eligible visual impact', () => {
    const { result } = planFor(farm, [{
      kind: 'update-world-property',
      scope: 'world',
      property: 'theme',
      from: 'green fields',
      to: 'snow',
    }])

    expect(result.worldLevelVisualImpact[0]).toMatchObject({ property: 'theme' })
    expect(result.generationRequired.map(asset => asset.kind)).toEqual(expect.arrayContaining(['background', 'terrain', 'character']))
  })

  it('returns an immutable idempotent already-planned result', () => {
    const { result, mutation, specs } = planFor(farm, [{
      kind: 'remove-entity',
      scope: 'entity',
      targetIds: ['cow-1'],
    }])
    const repeat = new DefaultVisualEvolutionPlanner().plan(
      farm,
      mutation.updatedWorld,
      mutation,
      runtimeResult(mutation),
      specs.visual,
      specs.assets,
      { worldId, semanticRevision: 0, runtimeRevision: 0, visualRevision: result.updatedVisualRevision, lastPlannedOperationId: mutation.operationId },
    )

    expect(repeat.status).toBe('already_planned')
    expect(repeat.failureReason).toBeUndefined()
    expect(repeat.updatedVisualRevision).toBe(result.updatedVisualRevision)
    expect(Object.isFrozen(repeat)).toBe(true)
  })

  it('rejects stale session revisions without changing the supplied specifications', () => {
    const { mutation, specs } = planFor(farm, [{
      kind: 'remove-entity',
      scope: 'entity',
      targetIds: ['cow-1'],
    }])
    const result = new DefaultVisualEvolutionPlanner().plan(
      farm,
      mutation.updatedWorld,
      mutation,
      runtimeResult(mutation),
      specs.visual,
      specs.assets,
      { worldId, semanticRevision: 4, runtimeRevision: 0, visualRevision: 2 },
    )

    expect(result).toMatchObject({ status: 'failed', failureReason: 'stale_revision', previousVisualRevision: 2, updatedVisualRevision: 2 })
    expect(result.previousVisualDesign).toBe(specs.visual)
    expect(result.updatedAssetSpecification).toBe(specs.assets)
  })

  it('rejects a wrong world/session without changing the supplied specifications', () => {
    const { mutation, specs } = planFor(farm, [{
      kind: 'remove-entity',
      scope: 'entity',
      targetIds: ['cow-1'],
    }])
    const result = new DefaultVisualEvolutionPlanner().plan(
      farm,
      mutation.updatedWorld,
      mutation,
      runtimeResult(mutation),
      specs.visual,
      specs.assets,
      { worldId: 'world-other', semanticRevision: 0, runtimeRevision: 0 },
    )

    expect(result).toMatchObject({ status: 'failed', failureReason: 'world_mismatch' })
    expect(result.previousVisualDesign).toBe(specs.visual)
    expect(result.previousAssetSpecification).toBe(specs.assets)
  })
})
