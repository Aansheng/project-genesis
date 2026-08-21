import { describe, expect, it } from 'vitest'
import {
  createPositionComponent,
  createVelocityComponent,
  DefaultSemanticWorldDeltaApplier,
  type Entity,
  type GameWorldModel,
  type RuntimeComponent,
  type World,
  type WorldSemanticDelta,
} from '@genesis/shared'
import { DefaultRuntimeWorldEvolutionSynchronizer } from '../evolution'

const semanticWorld: GameWorldModel = Object.freeze({
  worldType: 'farm',
  entities: Object.freeze([
    Object.freeze({ id: 'player-1', category: 'player' as const, name: 'Player' }),
    Object.freeze({ id: 'cow-1', category: 'npc' as const, name: 'Cow' }),
    Object.freeze({ id: 'cow-2', category: 'npc' as const, name: 'Cow' }),
    Object.freeze({ id: 'crop-1', category: 'terrain' as const, name: 'Crop' }),
  ]),
})

function runtimeEntity(
  id: string,
  type: string,
  x: number,
  y: number,
  name: string,
  components: readonly RuntimeComponent[] = [],
): Entity {
  return Object.freeze({
    id,
    type,
    x: 0,
    y: 0,
    components: Object.freeze([
      Object.freeze({
        type: 'semantic',
        properties: Object.freeze({ category: type, name }),
      }),
      createPositionComponent(x, y),
      ...components,
    ]),
  })
}

const runtimeWorld = Object.freeze({
  entities: Object.freeze([
    runtimeEntity('player-1', 'player', 80, 300, 'Player'),
    runtimeEntity('cow-1', 'npc', 244, 400, 'Cow', [createVelocityComponent(0, 0)]),
    runtimeEntity('cow-2', 'npc', 316, 400, 'Cow'),
    runtimeEntity('crop-1', 'terrain', 376, 400, 'Crop'),
  ]),
}) as unknown as World

function mutation(
  operations: WorldSemanticDelta['operations'],
  revision = 0,
  properties?: { readonly timeOfDay?: string },
) {
  return new DefaultSemanticWorldDeltaApplier().apply(semanticWorld, {
    operationId: `evolution-${revision + 1}`,
    worldId: 'world-a',
    semanticRevision: revision,
    operations,
    summary: 'test',
  }, {
    worldId: 'world-a',
    semanticRevision: revision,
    properties,
  })
}

describe('DefaultRuntimeWorldEvolutionSynchronizer', () => {
  const synchronizer = new DefaultRuntimeWorldEvolutionSynchronizer()

  it('replaces exact Runtime targets while preserving identity, position, gameplay components, and unrelated entities', () => {
    const result = synchronizer.synchronize(runtimeWorld, mutation([{
      kind: 'replace-entity-semantic',
      scope: 'entity',
      targetIds: ['cow-1'],
      from: [{ name: 'Cow', category: 'npc' }],
      replacement: { name: 'Sheep', category: 'npc' },
      preserveIdentity: true,
    }]), { worldId: 'world-a', runtimeRevision: 0 })

    const updated = result.updatedWorld.entities.find(entity => entity.id === 'cow-1')!
    expect(result.status).toBe('synchronized')
    expect(result.affectedEntityIds).toEqual(['cow-1'])
    expect(updated.id).toBe('cow-1')
    expect(updated.type).toBe('npc')
    expect(updated.components?.find(component => component.type === 'position')?.properties).toEqual({ x: 244, y: 400 })
    expect(updated.components?.find(component => component.type === 'velocity')).toBe(runtimeWorld.entities[1]?.components?.[2])
    expect(updated.components?.find(component => component.type === 'semantic')?.properties).toMatchObject({ name: 'Sheep', category: 'npc' })
    expect(result.updatedWorld.entities.find(entity => entity.id === 'player-1')).toBe(runtimeWorld.entities[0])
    expect(result.updatedWorld.entities.find(entity => entity.id === 'crop-1')).toBe(runtimeWorld.entities[3])
  })

  it('replaces a group without changing IDs or existing placement', () => {
    const result = synchronizer.synchronize(runtimeWorld, mutation([{
      kind: 'replace-entity-semantic',
      scope: 'archetype-group',
      targetIds: ['cow-1', 'cow-2'],
      from: [{ name: 'Cow', category: 'npc' }, { name: 'Cow', category: 'npc' }],
      replacement: { name: 'Sheep', category: 'npc' },
      preserveIdentity: true,
    }]), { worldId: 'world-a', runtimeRevision: 0 })

    expect(result.updatedWorld.entities.map(entity => entity.id)).toEqual(['player-1', 'cow-1', 'cow-2', 'crop-1'])
    expect(result.updatedWorld.entities.slice(1, 3).map(entity => entity.components?.find(component => component.type === 'position')?.properties)).toEqual([
      { x: 244, y: 400 }, { x: 316, y: 400 },
    ])
  })

  it('adds one deterministic fallback entity without moving existing entities', () => {
    const result = synchronizer.synchronize(runtimeWorld, mutation([{
      kind: 'add-entity',
      scope: 'entity',
      semantic: { name: 'Merchant', category: 'npc' },
      count: 1,
    }]), { worldId: 'world-a', runtimeRevision: 0 })
    const added = result.updatedWorld.entities.find(entity => entity.id === 'merchant-1')!

    expect(result.status).toBe('synchronized')
    expect(result.addedEntityIds).toEqual(['merchant-1'])
    expect(added.type).toBe('npc')
    expect(added.components?.map(component => component.type)).toEqual(['semantic', 'position', 'collision-bounds'])
    expect(added.components?.find(component => component.type === 'position')?.properties).toEqual({ x: 460, y: 400 })
    expect(result.updatedWorld.entities.slice(0, 4)).toEqual(runtimeWorld.entities)
  })

  it('removes exactly the target and rejects player removal without a partial commit', () => {
    const removeResult = synchronizer.synchronize(runtimeWorld, mutation([{
      kind: 'remove-entity',
      scope: 'entity',
      targetIds: ['cow-1'],
    }]), { worldId: 'world-a', runtimeRevision: 0 })
    expect(removeResult.updatedWorld.entities.map(entity => entity.id)).toEqual(['player-1', 'cow-2', 'crop-1'])

    const playerMutation = mutation([{
      kind: 'remove-entity',
      scope: 'entity',
      targetIds: ['player-1'],
    }])
    const playerResult = synchronizer.synchronize(runtimeWorld, playerMutation, { worldId: 'world-a', runtimeRevision: 0 })
    expect(playerResult).toMatchObject({ status: 'failed', failureReason: 'player_removal_unsupported', updatedWorld: runtimeWorld })
  })

  it('reports no Runtime impact for a world property and advances the revision marker', () => {
    const result = synchronizer.synchronize(runtimeWorld, mutation([{
      kind: 'update-world-property',
      scope: 'world',
      property: 'timeOfDay',
      to: 'night',
    }]), { worldId: 'world-a', runtimeRevision: 0 })

    expect(result).toMatchObject({ status: 'no_runtime_impact', runtimeImpact: 'none', previousRevision: 0, updatedRevision: 1 })
    expect(result.updatedWorld).toBe(runtimeWorld)
  })

  it('is idempotent when the session marker already contains the operation', () => {
    const semanticMutation = mutation([{
      kind: 'add-entity',
      scope: 'entity',
      semantic: { name: 'Merchant', category: 'npc' },
      count: 1,
    }])
    const first = synchronizer.synchronize(runtimeWorld, semanticMutation, { worldId: 'world-a', runtimeRevision: 0 })
    const second = synchronizer.synchronize(first.updatedWorld, semanticMutation, {
      worldId: 'world-a',
      runtimeRevision: first.updatedRevision,
      lastAppliedOperationId: semanticMutation.operationId,
    })

    expect(second.status).toBe('already_applied')
    expect(second.updatedWorld).toBe(first.updatedWorld)
    expect(second.updatedWorld.entities.filter(entity => entity.id === 'merchant-1')).toHaveLength(1)
  })

  it('fails stale, wrong-session, and missing-target synchronization safely', () => {
    const semanticMutation = mutation([{
      kind: 'remove-entity',
      scope: 'entity',
      targetIds: ['cow-1'],
    }])
    expect(synchronizer.synchronize(runtimeWorld, semanticMutation, { worldId: 'world-b', runtimeRevision: 0 })).toMatchObject({ status: 'failed', failureReason: 'world_mismatch', updatedWorld: runtimeWorld })
    expect(synchronizer.synchronize(runtimeWorld, semanticMutation, { worldId: 'world-a', runtimeRevision: 2 })).toMatchObject({ status: 'failed', failureReason: 'stale_revision', updatedWorld: runtimeWorld })
    expect(synchronizer.synchronize(runtimeWorld, semanticMutation, { worldId: 'world-a', runtimeRevision: 0 })).toMatchObject({ status: 'synchronized' })
    const withoutCow = Object.freeze({ entities: Object.freeze(runtimeWorld.entities.filter(entity => entity.id !== 'cow-1')) }) as unknown as World
    expect(synchronizer.synchronize(withoutCow, semanticMutation, { worldId: 'world-a', runtimeRevision: 0 })).toMatchObject({ status: 'failed', failureReason: 'entity_not_found', updatedWorld: withoutCow })
  })
})
