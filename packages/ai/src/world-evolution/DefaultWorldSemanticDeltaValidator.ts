import type {
  WorldEvolutionRequest,
  WorldSemanticDelta,
  WorldSemanticDeltaOperation,
} from '@genesis/shared'
import type {
  WorldSemanticDeltaValidationResult,
  WorldSemanticDeltaValidator,
} from './WorldEvolutionPlanner'

const SUPPORTED_WORLD_PROPERTIES = new Set(['theme', 'timeOfDay'])

function targetIds(operation: WorldSemanticDeltaOperation): readonly string[] {
  return 'targetIds' in operation ? operation.targetIds : []
}

/** Validates semantic plans without attempting Runtime execution semantics. */
export class DefaultWorldSemanticDeltaValidator implements WorldSemanticDeltaValidator {
  validate(delta: WorldSemanticDelta, request: WorldEvolutionRequest): WorldSemanticDeltaValidationResult {
    const errors: string[] = []
    if (delta.operationId !== request.operationId) errors.push('delta operation does not belong to the request')
    if (delta.worldId !== request.context.worldId) errors.push('delta belongs to a different world')
    if (request.context.semanticRevision !== undefined && delta.semanticRevision !== request.context.semanticRevision) errors.push('delta was planned against a different semantic revision')
    if (!Array.isArray(delta.operations) || delta.operations.length === 0) errors.push('delta must contain at least one operation')

    const currentIds = new Set(request.context.semanticWorld.entities.map(entity => entity.id))
    if (currentIds.size !== request.context.semanticWorld.entities.length) errors.push('current semantic world contains duplicate entity IDs')
    const seenTargets = new Map<string, string>()
    for (const operation of delta.operations ?? []) {
      if (operation.kind === 'add-entity') {
        if (!Number.isInteger(operation.count) || operation.count <= 0) errors.push('add count must be a positive integer')
        if (!operation.semantic.name.trim()) errors.push('added semantic name must not be empty')
        continue
      }
      if (operation.kind === 'update-world-property') {
        if (!SUPPORTED_WORLD_PROPERTIES.has(operation.property)) errors.push('world property is not supported')
        if (!operation.to.trim()) errors.push('world property value must not be empty')
        continue
      }
      const ids = targetIds(operation)
      if (ids.length === 0) errors.push(`${operation.kind} requires at least one target`)
      if (new Set(ids).size !== ids.length) errors.push(`${operation.kind} contains duplicate target IDs`)
      for (const id of ids) {
        if (!currentIds.has(id)) errors.push(`target ${id} does not exist in the current world`)
        const previous = seenTargets.get(id)
        if (previous && ((previous === 'remove-entity' && operation.kind === 'replace-entity-semantic') || (previous === 'replace-entity-semantic' && operation.kind === 'remove-entity'))) {
          errors.push(`conflicting operations target ${id}`)
        }
        seenTargets.set(id, operation.kind)
      }
      if (operation.kind === 'replace-entity-semantic' && !operation.replacement.name.trim()) errors.push('replacement semantic name must not be empty')
      if (operation.kind === 'update-entity-property') errors.push('entity property updates are not executable in v1')
    }
    return Object.freeze({ valid: errors.length === 0, errors: Object.freeze(errors) })
  }
}
