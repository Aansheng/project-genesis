import type { EntityCategory, GameDesignSpecification, GameDifficulty, GameObjectiveType, GameWorldModel, WorldType } from '@genesis/shared'
import type { GameWorldGenerationCandidate } from './GameWorldGenerationCandidate'
import type { GameWorldValidationResult, GameWorldValidator } from './GameWorldValidator'
import { DefaultGameDesignWorldBuilder } from '../../game-design'

const WORLD_TYPES: readonly WorldType[] = ['farm', 'platformer', 'rpg', 'survival', 'sandbox']
const CATEGORIES: readonly EntityCategory[] = ['player', 'npc', 'enemy', 'terrain', 'building', 'item', 'quest']
const DIFFICULTIES: readonly GameDifficulty[] = ['easy', 'medium', 'hard']
const OBJECTIVES: readonly GameObjectiveType[] = ['reach-goal', 'defeat-boss', 'collect-item', 'survive']
const MAX_ENTITIES = 100
const MAX_OBJECTIVES = 20

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/** Strict, dependency-free validation and conversion for semantic candidates. */
export class DefaultGameWorldValidator implements GameWorldValidator {
  validate(candidate: unknown): GameWorldValidationResult {
    const errors: string[] = []

    if (!isRecord(candidate)) {
      return { valid: false, errors: ['candidate must be an object'] }
    }

    const worldType = candidate.worldType ?? candidate.genre
    if (typeof worldType !== 'string' || !WORLD_TYPES.includes(worldType as WorldType)) errors.push('genre/worldType must be a supported semantic world type')

    const title = candidate.title
    if (title !== undefined && (typeof title !== 'string' || title.trim() === '')) errors.push('title must be a non-empty string when provided')
    if (candidate.difficulty !== undefined && (typeof candidate.difficulty !== 'string' || !DIFFICULTIES.includes(candidate.difficulty as GameDifficulty))) errors.push('difficulty must be easy, medium, or hard')

    const theme = candidate.theme
    if (theme !== undefined && (!isRecord(theme) || typeof theme.name !== 'string' || theme.name.trim() === '')) errors.push('theme.name must be a non-empty string')

    const objectives = candidate.objectives
    if (objectives !== undefined) {
      if (!Array.isArray(objectives) || objectives.length > MAX_OBJECTIVES) errors.push(`objectives must be an array with at most ${MAX_OBJECTIVES} items`)
      else objectives.forEach((objective, index) => {
        if (!isRecord(objective) || typeof objective.type !== 'string' || !OBJECTIVES.includes(objective.type as GameObjectiveType)) errors.push(`objectives[${index}].type must be supported`)
        else if (objective.target !== undefined && (typeof objective.target !== 'string' || objective.target.trim() === '')) errors.push(`objectives[${index}].target must be a non-empty string when provided`)
      })
    }

    const entities = candidate.entities
    if (!Array.isArray(entities)) {
      errors.push('entities must be an array')
    } else {
      if (entities.length === 0) errors.push('entities must not be empty')
      if (entities.length > MAX_ENTITIES) errors.push(`entities must contain at most ${MAX_ENTITIES} items`)
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
        if (entity.role !== undefined && (typeof entity.role !== 'string' || entity.role.trim() === '')) errors.push(`entities[${index}].role must be a non-empty string when provided`)
      })
      const playerCount = entities.filter(entity => isRecord(entity) && entity.category === 'player').length
      if (playerCount !== 1) errors.push('entities must contain exactly one player')
    }

    if (errors.length > 0) return { valid: false, errors: Object.freeze(errors) }

    const validCandidate = candidate as unknown as GameWorldGenerationCandidate
    const genre = (validCandidate.genre ?? validCandidate.worldType) as WorldType
    const specification: GameDesignSpecification = Object.freeze({
      title: validCandidate.title?.trim() || genre,
      genre,
      ...(validCandidate.theme ? { theme: Object.freeze({ name: validCandidate.theme.name.trim() }) } : {}),
      ...(validCandidate.difficulty ? { difficulty: validCandidate.difficulty } : {}),
      objectives: Object.freeze((validCandidate.objectives ?? []).map(objective => Object.freeze({ ...objective }))),
      entities: Object.freeze(validCandidate.entities.map(entity => Object.freeze({ ...entity, ...(entity.role ? { role: entity.role.trim() } : {}) }))),
    })
    const world: GameWorldModel = new DefaultGameDesignWorldBuilder().build(specification)
    return { valid: true, errors: Object.freeze([]), world, specification }
  }
}
