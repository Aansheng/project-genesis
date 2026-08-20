import { describe, expect, it } from 'vitest'
import type { GameWorldModel, WorldSemanticDelta } from '@genesis/shared'
import { DefaultSemanticWorldDeltaApplier } from '../world-evolution'

const world: GameWorldModel = Object.freeze({
  worldType: 'farm',
  entities: Object.freeze([
    Object.freeze({ id: 'cow-1', category: 'npc' as const, name: 'Cow' }),
    Object.freeze({ id: 'cow-2', category: 'npc' as const, name: 'Cow' }),
    Object.freeze({ id: 'barn-1', category: 'building' as const, name: 'Barn' }),
  ]),
})

function delta(operation: WorldSemanticDelta['operations'][number], revision = 0): WorldSemanticDelta {
  return {
    operationId: 'evolution-1',
    worldId: 'world-a',
    semanticRevision: revision,
    operations: [operation],
    summary: 'test',
  }
}

describe('DefaultSemanticWorldDeltaApplier', () => {
  const applier = new DefaultSemanticWorldDeltaApplier()

  it('replaces a group while preserving IDs and unrelated semantics', () => {
    const result = applier.apply(world, delta({
      kind: 'replace-entity-semantic',
      scope: 'archetype-group',
      targetIds: ['cow-1', 'cow-2'],
      from: [
        { name: 'Cow', category: 'npc' },
        { name: 'Cow', category: 'npc' },
      ],
      replacement: { name: 'Sheep', category: 'npc' },
      preserveIdentity: true,
    }))

    expect(result.status).toBe('applied')
    expect(result.updatedWorld.entities).toEqual([
      { id: 'cow-1', category: 'npc', name: 'Sheep' },
      { id: 'cow-2', category: 'npc', name: 'Sheep' },
      { id: 'barn-1', category: 'building', name: 'Barn' },
    ])
    expect(result.affectedEntityIds).toEqual(['cow-1', 'cow-2'])
    expect(result.previousWorld).toBe(world)
    expect(world.entities[0]?.name).toBe('Cow')
  })

  it('allocates deterministic collision-free IDs for counted additions', () => {
    const operation = {
      kind: 'add-entity' as const,
      scope: 'entity' as const,
      semantic: { name: 'Merchant', category: 'npc' as const },
      count: 3,
    }
    const first = applier.apply(world, delta(operation))
    const second = applier.apply(world, delta(operation))

    expect(first.addedEntityIds).toEqual(['merchant-1', 'merchant-2', 'merchant-3'])
    expect(second.addedEntityIds).toEqual(first.addedEntityIds)
    expect(first.updatedWorld.entities.map(entity => entity.id)).toEqual([
      'cow-1', 'cow-2', 'barn-1', 'merchant-1', 'merchant-2', 'merchant-3',
    ])
  })

  it('removes only selected entities and updates supported world properties', () => {
    const result = applier.apply(world, {
      operationId: 'evolution-1',
      worldId: 'world-a',
      semanticRevision: 0,
      operations: [
        { kind: 'remove-entity', scope: 'entity', targetIds: ['cow-1'] },
        { kind: 'update-world-property', scope: 'world', property: 'timeOfDay', from: 'day', to: 'night' },
      ],
      summary: 'test',
    }, { properties: { timeOfDay: 'day' } })

    expect(result.status).toBe('applied')
    expect(result.removedEntityIds).toEqual(['cow-1'])
    expect(result.updatedWorld.entities.map(entity => entity.id)).toEqual(['cow-2', 'barn-1'])
    expect(result.updatedWorldProperties).toEqual({ timeOfDay: 'night' })
    expect(result.updatedRevision).toBe(1)
  })

  it('rejects stale or wrong-world deltas without changing the current world', () => {
    const stale = applier.apply(world, delta({
      kind: 'remove-entity',
      scope: 'entity',
      targetIds: ['cow-1'],
    }, 2), { worldId: 'world-a', semanticRevision: 1 })
    const wrongWorld = applier.apply(world, delta({
      kind: 'remove-entity',
      scope: 'entity',
      targetIds: ['cow-1'],
    }), { worldId: 'world-b', semanticRevision: 0 })

    expect(stale).toMatchObject({ status: 'failed', failureReason: 'stale_revision', updatedWorld: world })
    expect(wrongWorld).toMatchObject({ status: 'failed', failureReason: 'world_mismatch', updatedWorld: world })
  })

  it('fails atomically for unsupported or partially invalid operations', () => {
    const result = applier.apply(world, {
      operationId: 'evolution-1',
      worldId: 'world-a',
      operations: [
        { kind: 'remove-entity', scope: 'entity', targetIds: ['cow-1'] },
        { kind: 'update-entity-property', scope: 'entity', targetIds: ['cow-2'], property: 'movementSpeed', operation: 'set', value: 2 },
      ],
      summary: 'test',
    })

    expect(result).toMatchObject({ status: 'failed', failureReason: 'unsupported_operation', updatedWorld: world })
    expect(result.appliedOperations).toEqual([])
    expect(result.removedEntityIds).toEqual([])
  })

  it('returns deeply frozen success collections', () => {
    const result = applier.apply(world, delta({
      kind: 'replace-entity-semantic',
      scope: 'entity',
      targetIds: ['cow-1'],
      from: [{ name: 'Cow', category: 'npc' }],
      replacement: { name: 'Sheep', category: 'npc' },
      preserveIdentity: true,
    }))

    expect(Object.isFrozen(result)).toBe(true)
    expect(Object.isFrozen(result.updatedWorld)).toBe(true)
    expect(Object.isFrozen(result.updatedWorld.entities)).toBe(true)
    expect(Object.isFrozen(result.updatedWorld.entities[0])).toBe(true)
    expect(Object.isFrozen(result.affectedEntityIds)).toBe(true)
  })
})
