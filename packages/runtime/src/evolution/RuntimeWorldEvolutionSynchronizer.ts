import {
  type Entity,
  type EntityCategory,
  type RuntimeEvolutionFailureReason,
  type RuntimeEvolutionResult,
  type RuntimeEvolutionSynchronizationOptions,
  type RuntimePreservedComponentFacts,
  type RuntimeWorldEvolutionSynchronizer as RuntimeWorldEvolutionSynchronizerContract,
  type SemanticWorldMutationResult,
  type World,
} from '@genesis/shared'
import {
  createComposedRuntimeEntity,
  findSafeRuntimeEntityPosition,
  runtimeEntityPosition,
} from '../composition'

const SEMANTIC_COMPONENT_TYPE = 'semantic'

interface SemanticFacts {
  readonly name?: string
  readonly category?: EntityCategory
}

interface WorkingResult {
  entities: Entity[]
  affectedEntityIds: string[]
  addedEntityIds: string[]
  removedEntityIds: string[]
  changed: boolean
}

function freezeWorld(entities: readonly Entity[]): World {
  return Object.freeze({
    entities: Object.freeze(entities),
  }) as unknown as World
}

function semanticFactsOf(entity: Entity): SemanticFacts | undefined {
  const component = entity.components?.find(item => item.type === SEMANTIC_COMPONENT_TYPE)
  if (!component) return undefined
  const name = typeof component.properties.name === 'string' ? component.properties.name : undefined
  const category = typeof component.properties.category === 'string'
    ? component.properties.category as EntityCategory
    : undefined
  return name || category ? { name, category } : undefined
}

function replaceSemantic(
  entity: Entity,
  name: string,
  category: EntityCategory,
): Entity {
  const components = entity.components
  if (!components) {
    return Object.freeze({ ...entity, type: category }) as unknown as Entity
  }

  let foundSemantic = false
  const updatedComponents = components.map(component => {
    if (component.type !== SEMANTIC_COMPONENT_TYPE) return component
    foundSemantic = true
    return Object.freeze({
      ...component,
      properties: Object.freeze({
        ...component.properties,
        category,
        name,
      }),
    })
  })

  return Object.freeze({
    ...entity,
    type: category,
    ...(foundSemantic ? { components: Object.freeze(updatedComponents) } : { components }),
  }) as unknown as Entity
}

function preservedFacts(
  previousWorld: World,
  updatedWorld: World,
): readonly RuntimePreservedComponentFacts[] {
  const updatedById = new Map(updatedWorld.entities.map(entity => [entity.id, entity]))
  const facts: RuntimePreservedComponentFacts[] = []
  for (const entity of previousWorld.entities) {
    const updated = updatedById.get(entity.id)
    if (!updated) continue
    const position = runtimeEntityPosition(entity)
    facts.push(Object.freeze({
      entityId: entity.id,
      componentTypes: Object.freeze((entity.components ?? []).map(component => component.type)),
      ...(position ? { position } : {}),
    }))
  }
  return Object.freeze(facts)
}

function result(
  status: RuntimeEvolutionResult['status'],
  runtimeImpact: RuntimeEvolutionResult['runtimeImpact'],
  runtimeWorld: World,
  mutation: SemanticWorldMutationResult,
  previousRevision: number,
  updatedRevision: number,
  failureReason?: RuntimeEvolutionFailureReason,
  updatedWorld = runtimeWorld,
  working?: WorkingResult,
): RuntimeEvolutionResult {
  const previousEntities = Array.isArray(runtimeWorld?.entities) ? runtimeWorld.entities : []
  const nextEntities = Array.isArray(updatedWorld?.entities) ? updatedWorld.entities : []
  const preservedEntityIds = previousEntities
    .map(entity => entity.id)
    .filter(id => nextEntities.some(entity => entity.id === id))
  return Object.freeze({
    status,
    runtimeImpact,
    worldId: mutation.worldId,
    operationId: mutation.operationId,
    previousWorld: runtimeWorld,
    updatedWorld,
    appliedOperations: Object.freeze(working ? mutation.appliedOperations : []),
    affectedEntityIds: Object.freeze(working ? [...working.affectedEntityIds] : []),
    addedEntityIds: Object.freeze(working ? [...working.addedEntityIds] : []),
    removedEntityIds: Object.freeze(working ? [...working.removedEntityIds] : []),
    preservedEntityIds: Object.freeze(preservedEntityIds),
    preservedComponentFacts: Array.isArray(runtimeWorld?.entities)
      ? preservedFacts(runtimeWorld, updatedWorld)
      : Object.freeze([]),
    previousRevision,
    updatedRevision,
    ...(failureReason ? { failureReason } : {}),
  })
}

function failure(
  runtimeWorld: World,
  mutation: SemanticWorldMutationResult,
  previousRevision: number,
  reason: RuntimeEvolutionFailureReason,
): RuntimeEvolutionResult {
  return result('failed', 'none', runtimeWorld, mutation, previousRevision, previousRevision, reason)
}

function hasDuplicateIds(world: World): boolean {
  const ids = new Set<string>()
  for (const entity of world.entities) {
    if (!entity || typeof entity.id !== 'string' || ids.has(entity.id)) return true
    ids.add(entity.id)
  }
  return false
}

function expectedMatches(actual: SemanticFacts | undefined, expected: SemanticFacts | undefined): boolean {
  if (!actual || !expected) return true
  return (expected.name === undefined || actual.name === expected.name)
    && (expected.category === undefined || actual.category === expected.category)
}

/**
 * Applies one semantic mutation to the current Runtime snapshot atomically.
 * This class has no store, provider, framework, or renderer dependency.
 */
export class DefaultRuntimeWorldEvolutionSynchronizer
  implements RuntimeWorldEvolutionSynchronizerContract {
  synchronize(
    runtimeWorld: World,
    semanticMutation: SemanticWorldMutationResult,
    options: RuntimeEvolutionSynchronizationOptions = {},
  ): RuntimeEvolutionResult {
    const previousRevision = options.runtimeRevision ?? semanticMutation.previousRevision
    const operationId = semanticMutation.operationId

    if (!runtimeWorld || !Array.isArray(runtimeWorld.entities)) {
      return failure(runtimeWorld, semanticMutation, previousRevision, 'invalid_runtime_world')
    }
    if (semanticMutation.status !== 'applied' || !operationId) {
      return failure(runtimeWorld, semanticMutation, previousRevision, 'invalid_mutation')
    }
    if (options.worldId !== undefined && options.worldId !== semanticMutation.worldId) {
      return failure(runtimeWorld, semanticMutation, previousRevision, 'world_mismatch')
    }
    if (hasDuplicateIds(runtimeWorld)) {
      return failure(runtimeWorld, semanticMutation, previousRevision, 'duplicate_entity_id')
    }

    if (options.lastAppliedOperationId === operationId) {
      return previousRevision === semanticMutation.updatedRevision
        ? result('already_applied', 'none', runtimeWorld, semanticMutation, previousRevision, previousRevision, undefined, runtimeWorld)
        : failure(runtimeWorld, semanticMutation, previousRevision, 'duplicate_operation')
    }
    if (previousRevision !== semanticMutation.previousRevision) {
      return failure(runtimeWorld, semanticMutation, previousRevision, 'stale_revision')
    }

    const working: WorkingResult = {
      entities: [...runtimeWorld.entities],
      affectedEntityIds: [],
      addedEntityIds: [],
      removedEntityIds: [],
      changed: false,
    }
    const addedSemanticEntities = [...semanticMutation.addedEntities]
    const targetEntityId = semanticMutation.updatedWorld.worldType === 'survival'
      ? semanticMutation.updatedWorld.entities.find(entity => entity.category === 'player')?.id
      : undefined
    const touched = new Set<string>()

    for (const operation of semanticMutation.appliedOperations) {
      if (operation.kind === 'update-world-property') continue
      if (operation.kind === 'update-entity-property') {
        return failure(runtimeWorld, semanticMutation, previousRevision, 'unsupported_operation')
      }

      if (operation.kind === 'add-entity') {
        for (let index = 0; index < operation.count; index += 1) {
          const semantic = addedSemanticEntities.shift()
          if (!semantic || working.entities.some(entity => entity.id === semantic.id)) {
            return failure(runtimeWorld, semanticMutation, previousRevision, 'duplicate_entity_id')
          }
          const position = findSafeRuntimeEntityPosition(working.entities, semantic.id, semantic.category)
          working.entities.push(createComposedRuntimeEntity({
            id: semantic.id,
            semanticEntity: semantic,
            position,
            worldType: semanticMutation.updatedWorld.worldType,
            ...(targetEntityId ? { targetEntityId } : {}),
          }))
          working.addedEntityIds.push(semantic.id)
          working.affectedEntityIds.push(semantic.id)
          touched.add(semantic.id)
          working.changed = true
        }
        continue
      }

      if (operation.kind === 'remove-entity') {
        for (const id of operation.targetIds) {
          if (touched.has(id)) return failure(runtimeWorld, semanticMutation, previousRevision, 'duplicate_operation')
          const index = working.entities.findIndex(entity => entity.id === id)
          if (index < 0) return failure(runtimeWorld, semanticMutation, previousRevision, 'entity_not_found')
          const entity = working.entities[index]
          const facts = semanticFactsOf(entity)
          if (entity.type === 'player' || facts?.category === 'player') {
            return failure(runtimeWorld, semanticMutation, previousRevision, 'player_removal_unsupported')
          }
          working.entities.splice(index, 1)
          working.removedEntityIds.push(id)
          working.affectedEntityIds.push(id)
          touched.add(id)
          working.changed = true
        }
        continue
      }

      if (operation.kind === 'replace-entity-semantic') {
        if (!operation.preserveIdentity) return failure(runtimeWorld, semanticMutation, previousRevision, 'unsupported_operation')
        for (const [index, id] of operation.targetIds.entries()) {
          if (touched.has(id)) return failure(runtimeWorld, semanticMutation, previousRevision, 'duplicate_operation')
          const entityIndex = working.entities.findIndex(entity => entity.id === id)
          if (entityIndex < 0) return failure(runtimeWorld, semanticMutation, previousRevision, 'entity_not_found')
          const current = working.entities[entityIndex]
          const expected = operation.from[index] ?? operation.from[0]
          if (!expectedMatches(semanticFactsOf(current), expected)) {
            return failure(runtimeWorld, semanticMutation, previousRevision, 'entity_semantic_mismatch')
          }
          const replacement = operation.replacement
          const before = semanticFactsOf(current)
          const updated = replaceSemantic(current, replacement.name, replacement.category)
          const after = semanticFactsOf(updated)
          working.entities[entityIndex] = updated
          working.affectedEntityIds.push(id)
          touched.add(id)
          working.changed = working.changed
            || updated.type !== current.type
            || before?.name !== after?.name
            || before?.category !== after?.category
        }
        continue
      }

      return failure(runtimeWorld, semanticMutation, previousRevision, 'unsupported_operation')
    }

    if (addedSemanticEntities.length > 0) {
      return failure(runtimeWorld, semanticMutation, previousRevision, 'invalid_mutation')
    }

    const updatedWorld = working.changed ? freezeWorld(working.entities) : runtimeWorld
    const status = working.changed ? 'synchronized' : 'no_runtime_impact'
    return result(
      status,
      working.changed ? 'synchronized' : 'none',
      runtimeWorld,
      semanticMutation,
      previousRevision,
      semanticMutation.updatedRevision,
      undefined,
      updatedWorld,
      working,
    )
  }
}

/** Short alias for callers that use the contract name as the implementation. */
export const RuntimeWorldEvolutionSynchronizer = DefaultRuntimeWorldEvolutionSynchronizer
