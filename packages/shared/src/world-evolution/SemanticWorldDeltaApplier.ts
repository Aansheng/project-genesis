import type { GameWorldEntity, GameWorldModel } from '../game-world'
import type {
  EvolutionWorldProperty,
  WorldSemanticDelta,
  WorldSemanticDeltaOperation,
  WorldSemanticProperties,
} from './WorldEvolution'

export type SemanticWorldMutationStatus = 'applied' | 'failed'

export type SemanticWorldMutationFailureReason =
  | 'invalid_delta'
  | 'world_mismatch'
  | 'stale_revision'
  | 'duplicate_entity_id'
  | 'entity_not_found'
  | 'property_conflict'
  | 'unsupported_operation'

export interface SemanticWorldDeltaApplicationOptions {
  /** Current session identity. When supplied, delta.worldId must match it. */
  readonly worldId?: string
  /** Current semantic revision. Defaults to zero for standalone callers. */
  readonly semanticRevision?: number
  /** World properties paired with the semantic world snapshot. */
  readonly properties?: WorldSemanticProperties
}

export interface SemanticWorldPropertyUpdate {
  readonly property: EvolutionWorldProperty
  readonly from?: string
  readonly to: string
}

/** Immutable result of one atomic semantic-world delta application. */
export interface SemanticWorldMutationResult {
  readonly status: SemanticWorldMutationStatus
  readonly operationId: string
  readonly worldId: string
  readonly previousWorld: GameWorldModel
  readonly updatedWorld: GameWorldModel
  readonly previousProperties: WorldSemanticProperties
  readonly updatedProperties: WorldSemanticProperties
  readonly updatedWorldProperties: WorldSemanticProperties
  readonly appliedOperations: readonly WorldSemanticDeltaOperation[]
  readonly affectedEntityIds: readonly string[]
  readonly addedEntities: readonly GameWorldEntity[]
  readonly addedEntityIds: readonly string[]
  readonly removedEntityIds: readonly string[]
  readonly worldPropertyUpdates: readonly SemanticWorldPropertyUpdate[]
  readonly previousRevision: number
  readonly updatedRevision: number
  readonly failureReason?: SemanticWorldMutationFailureReason
}

export interface SemanticWorldDeltaApplier {
  apply(
    world: GameWorldModel,
    delta: WorldSemanticDelta,
    options?: SemanticWorldDeltaApplicationOptions,
  ): SemanticWorldMutationResult
}

const WORLD_PROPERTIES: readonly EvolutionWorldProperty[] = ['theme', 'timeOfDay']

function freezeProperties(properties: WorldSemanticProperties | undefined): WorldSemanticProperties {
  return Object.freeze({ ...(properties ?? {}) })
}

function freezeWorld(world: GameWorldModel, entities = world.entities): GameWorldModel {
  return Object.freeze({
    worldType: world.worldType,
    entities: Object.freeze(entities.map(entity => Object.freeze({ ...entity }))),
  })
}

function cloneOperation(operation: WorldSemanticDeltaOperation): WorldSemanticDeltaOperation {
  if (operation.kind === 'add-entity') {
    return Object.freeze({
      ...operation,
      semantic: Object.freeze({ ...operation.semantic }),
    })
  }
  if (operation.kind === 'replace-entity-semantic') {
    return Object.freeze({
      ...operation,
      targetIds: Object.freeze([...operation.targetIds]),
      from: Object.freeze(operation.from.map(item => Object.freeze({ ...item }))),
      replacement: Object.freeze({ ...operation.replacement }),
    })
  }
  if ('targetIds' in operation) {
    return Object.freeze({
      ...operation,
      targetIds: Object.freeze([...operation.targetIds]),
    })
  }
  return Object.freeze({ ...operation })
}

function slug(value: string): string {
  const result = value
    .trim()
    .toLocaleLowerCase()
    .replace(/[\s_]+/gu, '-')
    .replace(/[^a-z0-9-]/giu, '')
    .replace(/-+/gu, '-')
    .replace(/^-|-$/gu, '')
  return result || 'entity'
}

function allocateId(name: string, usedIds: Set<string>): string {
  const base = slug(name)
  let suffix = 1
  let id = `${base}-${suffix}`
  while (usedIds.has(id)) {
    suffix++
    id = `${base}-${suffix}`
  }
  usedIds.add(id)
  return id
}

function baseResult(
  status: SemanticWorldMutationStatus,
  world: GameWorldModel,
  worldId: string,
  properties: WorldSemanticProperties,
  revision: number,
  failureReason?: SemanticWorldMutationFailureReason,
  operationId = '',
): SemanticWorldMutationResult {
  return Object.freeze({
    status,
    operationId,
    worldId,
    previousWorld: world,
    updatedWorld: world,
    previousProperties: properties,
    updatedProperties: properties,
    updatedWorldProperties: properties,
    appliedOperations: Object.freeze([]),
    affectedEntityIds: Object.freeze([]),
    addedEntities: Object.freeze([]),
    addedEntityIds: Object.freeze([]),
    removedEntityIds: Object.freeze([]),
    worldPropertyUpdates: Object.freeze([]),
    previousRevision: revision,
    updatedRevision: revision,
    ...(failureReason ? { failureReason } : {}),
  })
}

/**
 * Applies validated semantic operations without AI, Runtime, or Renderer
 * dependencies. All checks happen before the result is committed.
 */
export class DefaultSemanticWorldDeltaApplier implements SemanticWorldDeltaApplier {
  apply(
    world: GameWorldModel,
    delta: WorldSemanticDelta,
    options: SemanticWorldDeltaApplicationOptions = {},
  ): SemanticWorldMutationResult {
    const properties = freezeProperties(options.properties)
    const previousRevision = options.semanticRevision ?? 0
    const worldId = options.worldId ?? (delta && typeof delta === 'object' ? delta.worldId : '')
    const operationId = delta && typeof delta === 'object' && typeof delta.operationId === 'string' ? delta.operationId : ''
    const invalid = baseResult('failed', world, worldId, properties, previousRevision, 'invalid_delta', operationId)

    if (!world || typeof world !== 'object' || !Array.isArray(world.entities) || !delta || typeof delta !== 'object') return invalid
    if (options.worldId !== undefined && delta.worldId !== options.worldId) {
      return baseResult('failed', world, worldId, properties, previousRevision, 'world_mismatch', operationId)
    }
    if (options.semanticRevision !== undefined && delta.semanticRevision !== options.semanticRevision) {
      return baseResult('failed', world, worldId, properties, previousRevision, 'stale_revision', operationId)
    }
    if (!Array.isArray(delta.operations) || delta.operations.length === 0) return invalid

    const usedIds = new Set<string>()
    for (const entity of world.entities) {
      if (!entity || typeof entity.id !== 'string' || usedIds.has(entity.id)) {
        return baseResult('failed', world, worldId, properties, previousRevision, 'duplicate_entity_id', operationId)
      }
      usedIds.add(entity.id)
    }

    const currentIds = new Set(usedIds)
    const touchedIds = new Set<string>()
    const draftEntities = [...world.entities]
    const draftProperties: Record<string, string | undefined> = { ...properties }
    const appliedOperations: WorldSemanticDeltaOperation[] = []
    const affectedEntityIds: string[] = []
    const addedEntities: GameWorldEntity[] = []
    const addedEntityIds: string[] = []
    const removedEntityIds: string[] = []
    const worldPropertyUpdates: SemanticWorldPropertyUpdate[] = []

    const fail = (reason: SemanticWorldMutationFailureReason): SemanticWorldMutationResult =>
      baseResult('failed', world, worldId, properties, previousRevision, reason, operationId)

    for (const operation of delta.operations) {
      if (!operation || typeof operation !== 'object') return fail('invalid_delta')

      if (operation.kind === 'add-entity') {
        if (!Number.isInteger(operation.count) || operation.count <= 0 || !operation.semantic?.name?.trim() || !operation.semantic.category) {
          return fail('invalid_delta')
        }
        for (let index = 0; index < operation.count; index++) {
          const id = allocateId(operation.semantic.name, usedIds)
          const entity = Object.freeze({
            id,
            category: operation.semantic.category,
            name: operation.semantic.name.trim(),
          })
          draftEntities.push(entity)
          addedEntities.push(entity)
          addedEntityIds.push(id)
          affectedEntityIds.push(id)
        }
        appliedOperations.push(cloneOperation(operation))
        continue
      }

      if (operation.kind === 'update-world-property') {
        if (!WORLD_PROPERTIES.includes(operation.property) || !operation.to?.trim()) return fail('invalid_delta')
        const currentValue = draftProperties[operation.property]
        if (operation.from !== undefined && operation.from !== currentValue) return fail('property_conflict')
        draftProperties[operation.property] = operation.to.trim()
        worldPropertyUpdates.push(Object.freeze({
          property: operation.property,
          ...(currentValue !== undefined ? { from: currentValue } : {}),
          to: operation.to.trim(),
        }))
        appliedOperations.push(cloneOperation(operation))
        continue
      }

      if (operation.kind === 'update-entity-property') return fail('unsupported_operation')
      if (!Array.isArray(operation.targetIds) || operation.targetIds.length === 0 || new Set(operation.targetIds).size !== operation.targetIds.length) return fail('invalid_delta')
      for (const id of operation.targetIds) {
        if (!currentIds.has(id) || touchedIds.has(id)) return fail(currentIds.has(id) ? 'invalid_delta' : 'entity_not_found')
        touchedIds.add(id)
      }

      if (operation.kind === 'remove-entity') {
        for (const id of operation.targetIds) {
          const index = draftEntities.findIndex(entity => entity.id === id)
          if (index < 0) return fail('entity_not_found')
          draftEntities.splice(index, 1)
          removedEntityIds.push(id)
          affectedEntityIds.push(id)
        }
        appliedOperations.push(cloneOperation(operation))
        continue
      }

      if (operation.kind === 'replace-entity-semantic') {
        if (!operation.preserveIdentity || !operation.replacement?.name?.trim() || !operation.replacement.category) return fail('unsupported_operation')
        for (const id of operation.targetIds) {
          const index = draftEntities.findIndex(entity => entity.id === id)
          if (index < 0) return fail('entity_not_found')
          const current = draftEntities[index]
          const expected = operation.from[operation.targetIds.indexOf(id)] ?? operation.from[0]
          if (expected && (expected.name !== current.name || expected.category !== current.category)) return fail('invalid_delta')
          draftEntities[index] = {
            ...current,
            id,
            name: operation.replacement.name.trim(),
            category: operation.replacement.category,
          }
          affectedEntityIds.push(id)
        }
        appliedOperations.push(cloneOperation(operation))
        continue
      }

      return fail('invalid_delta')
    }

    const updatedProperties = freezeProperties(draftProperties)
    const updatedWorld = freezeWorld(world, draftEntities)
    const frozenAdded = Object.freeze(addedEntities.map(entity => Object.freeze({ ...entity })))
    const frozenApplied = Object.freeze(appliedOperations)
    return Object.freeze({
      status: 'applied',
      operationId,
      worldId,
      previousWorld: world,
      updatedWorld,
      previousProperties: properties,
      updatedProperties,
      updatedWorldProperties: updatedProperties,
      appliedOperations: frozenApplied,
      affectedEntityIds: Object.freeze([...affectedEntityIds]),
      addedEntities: frozenAdded,
      addedEntityIds: Object.freeze([...addedEntityIds]),
      removedEntityIds: Object.freeze([...removedEntityIds]),
      worldPropertyUpdates: Object.freeze(worldPropertyUpdates),
      previousRevision,
      updatedRevision: previousRevision + 1,
    })
  }
}
