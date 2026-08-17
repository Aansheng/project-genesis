import type { EntityCategory, GameWorldModel, WorldType } from '@genesis/shared'
import type { GameWorldGenerationCandidate } from './GameWorldGenerationCandidate'
import type { GameWorldValidationResult, GameWorldValidator } from './GameWorldValidator'

const WORLD_TYPES: readonly WorldType[] = ['farm', 'platformer', 'rpg', 'survival', 'sandbox']
const CATEGORIES: readonly EntityCategory[] = ['player', 'npc', 'enemy', 'terrain', 'building', 'item', 'quest']

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/** Strict, dependency-free validation and conversion for semantic candidates. */
export class DefaultGameWorldValidator implements GameWorldValidator {
  validate(candidate: unknown): GameWorldValidationResult {
    const errors: string[] = []

    if (!isRecord(candidate)) {
      return { valid: false, errors: ['candidate must be an object'] }
    }

    const worldType = candidate.worldType
    if (typeof worldType !== 'string' || !WORLD_TYPES.includes(worldType as WorldType)) {
      errors.push('worldType must be a supported semantic world type')
    }

    const entities = candidate.entities
    if (!Array.isArray(entities)) {
      errors.push('entities must be an array')
    } else {
      if (entities.length === 0) errors.push('entities must not be empty')
      const ids = new Set<string>()
      entities.forEach((entity, index) => {
        if (!isRecord(entity)) {
          errors.push(`entities[${index}] must be an object`)
          return
        }
        if (typeof entity.id !== 'string' || entity.id.trim() === '') errors.push(`entities[${index}].id must be a non-empty string`)
        else if (ids.has(entity.id)) errors.push(`entities[${index}].id must be unique`)
        else ids.add(entity.id)
        if (typeof entity.name !== 'string' || entity.name.trim() === '') errors.push(`entities[${index}].name must be a non-empty string`)
        if (typeof entity.category !== 'string' || !CATEGORIES.includes(entity.category as EntityCategory)) errors.push(`entities[${index}].category must be a supported semantic category`)
      })
    }

    if (errors.length > 0) return { valid: false, errors: Object.freeze(errors) }

    const validCandidate = candidate as unknown as GameWorldGenerationCandidate
    const world: GameWorldModel = Object.freeze({
      worldType: validCandidate.worldType,
      entities: Object.freeze(validCandidate.entities.map(entity => Object.freeze({ ...entity }))),
    })
    return { valid: true, errors: Object.freeze([]), world }
  }
}
