import type {
  EntityCategory,
  GameWorldModel,
  GameplayCapabilityCatalog,
  GameplayFailureConditionKind,
  GameplayGoalKind,
  GameplayMechanicKind,
  GameplayMechanicParameters,
  GameplayParticipantReference,
  GameplayProgressionMode,
  GameplaySpawnRuleKind,
  GameplaySupportStatus,
} from '@genesis/shared'
import type {
  GameplayFailureConditionCandidate,
  GameplayGoalCandidate,
  GameplayInteractionCandidate,
  GameplayMechanicCandidate,
  GameplayProgressionCandidate,
  GameplaySpecificationCandidate,
  GameplaySpawnRuleCandidate,
} from './GameplaySpecificationCandidate'

export interface GameplaySpecificationValidationOptions {
  readonly semanticWorld: GameWorldModel
  readonly capabilities: GameplayCapabilityCatalog
}

export interface GameplaySpecificationValidationResult {
  readonly valid: boolean
  readonly errors: readonly string[]
  readonly warnings: readonly string[]
  readonly candidate?: GameplaySpecificationCandidate
}

export interface GameplaySpecificationValidator {
  validate(
    candidate: unknown,
    options: GameplaySpecificationValidationOptions,
  ): GameplaySpecificationValidationResult
}

const MECHANIC_KINDS: readonly GameplayMechanicKind[] = [
  'movement', 'interaction', 'combat', 'collection', 'spawn', 'progression', 'goal', 'failure', 'state-change',
]
const GOAL_KINDS: readonly GameplayGoalKind[] = ['reach-goal', 'survive-duration', 'defeat-boss', 'collect-target', 'protect-entity']
const FAILURE_KINDS: readonly GameplayFailureConditionKind[] = ['player-death', 'timer-expired', 'protected-object-destroyed']
const PROGRESSION_MODES: readonly GameplayProgressionMode[] = ['none', 'score', 'experience', 'levels', 'waves', 'upgrades']
const SPAWN_KINDS: readonly GameplaySpawnRuleKind[] = ['periodic', 'on-interaction', 'at-milestone', 'manual']
const ENTITY_CATEGORIES: readonly EntityCategory[] = ['player', 'npc', 'enemy', 'terrain', 'building', 'item', 'quest']
const PARTICIPANT_ROLES: readonly GameplayParticipantReference['role'][] = ['subject', 'target', 'participant']
const SUPPORT_STATUSES: readonly GameplaySupportStatus[] = ['supported', 'deferred', 'unsupported']
const PARAMETER_KEYS = ['amount', 'damage', 'durationSeconds', 'jumpImpulse', 'speed', 'spawnCount', 'targetId', 'targetRole'] as const
const NO_SUPPORTED_CAPABILITIES: GameplayCapabilityCatalog = Object.freeze({
  version: 'v1',
  capabilities: Object.freeze([]),
  supportedMechanicIds: Object.freeze([]),
})

type RecordValue = Record<string, unknown>

const isRecord = (value: unknown): value is RecordValue =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const nonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0

function slug(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/gu, '-').replace(/^-|-$/gu, '')
}

function status(
  value: unknown,
  supportId: string | undefined,
  capabilities: GameplayCapabilityCatalog,
  warnings: string[],
  path: string,
): GameplaySupportStatus {
  const requested = value === undefined ? 'deferred' : value
  if (typeof requested !== 'string' || !SUPPORT_STATUSES.includes(requested as GameplaySupportStatus)) {
    if (value !== undefined) warnings.push(`${path}.supportStatus defaulted to deferred`)
    return 'deferred'
  }
  if (requested === 'supported' && (!supportId || !capabilities.supportedMechanicIds.includes(supportId))) {
    warnings.push(`${path}.supportStatus corrected to deferred because Genesis does not execute ${supportId ?? path}`)
    return 'deferred'
  }
  return requested as GameplaySupportStatus
}

function normalizeParameters(value: unknown, errors: string[], path: string): GameplayMechanicParameters | undefined {
  if (value === undefined) return undefined
  if (!isRecord(value)) {
    errors.push(`${path} must be an object`)
    return undefined
  }
  const parameters: Record<string, string | number> = {}
  for (const key of Object.keys(value)) {
    if (!(PARAMETER_KEYS as readonly string[]).includes(key)) {
      errors.push(`${path}.${key} is not a supported parameter`)
      continue
    }
    const item = value[key]
    if ((key === 'targetId' || key === 'targetRole') && !nonEmptyString(item)) {
      errors.push(`${path}.${key} must be a non-empty string`)
      continue
    }
    if (key !== 'targetId' && key !== 'targetRole' && (typeof item !== 'number' || !Number.isFinite(item))) {
      errors.push(`${path}.${key} must be a finite number`)
      continue
    }
    parameters[key] = typeof item === 'string' ? item.trim() : item as number
  }
  return Object.freeze(parameters) as GameplayMechanicParameters
}

function entityIds(world: GameWorldModel): ReadonlySet<string> {
  return new Set(world.entities.map(entity => entity.id))
}

function participant(
  value: unknown,
  entityIdSet: ReadonlySet<string>,
  errors: string[],
  path: string,
): GameplayParticipantReference | undefined {
  if (!isRecord(value)) {
    errors.push(`${path} must be an object`)
    return undefined
  }
  if (!nonEmptyString(value.role) || !PARTICIPANT_ROLES.includes(value.role as GameplayParticipantReference['role'])) {
    errors.push(`${path}.role must be subject, target, or participant`)
    return undefined
  }
  if (value.entityId !== undefined && (!nonEmptyString(value.entityId) || !entityIdSet.has(value.entityId))) {
    errors.push(`${path}.entityId must reference an existing semantic entity`)
    return undefined
  }
  if (value.entityCategory !== undefined && (!nonEmptyString(value.entityCategory) || !ENTITY_CATEGORIES.includes(value.entityCategory as EntityCategory))) {
    errors.push(`${path}.entityCategory must be a supported semantic category`)
    return undefined
  }
  if (value.entityName !== undefined && !nonEmptyString(value.entityName)) {
    errors.push(`${path}.entityName must be a non-empty string`)
    return undefined
  }
  return Object.freeze({
    role: value.role as GameplayParticipantReference['role'],
    ...(value.entityId ? { entityId: value.entityId.trim() } : {}),
    ...(value.entityCategory ? { entityCategory: value.entityCategory as EntityCategory } : {}),
    ...(value.entityName ? { entityName: value.entityName.trim() } : {}),
  })
}

function normalizeMechanic(
  value: unknown,
  capabilities: GameplayCapabilityCatalog,
  warnings: string[],
  errors: string[],
  path: string,
): GameplayMechanicCandidate | undefined {
  if (!isRecord(value)) {
    errors.push(`${path} must be an object`)
    return undefined
  }
  const id = typeof value.id === 'string' ? slug(value.id) : ''
  if (!id) errors.push(`${path}.id must be a stable non-empty mechanic identity`)
  if (!nonEmptyString(value.kind) || !MECHANIC_KINDS.includes(value.kind as GameplayMechanicKind)) errors.push(`${path}.kind must be supported`)
  if (!nonEmptyString(value.description)) errors.push(`${path}.description must be a non-empty string`)
  if (value.subject !== undefined && !nonEmptyString(value.subject)) errors.push(`${path}.subject must be non-empty when provided`)
  if (value.target !== undefined && !nonEmptyString(value.target)) errors.push(`${path}.target must be non-empty when provided`)
  if (value.enabled !== undefined && typeof value.enabled !== 'boolean') errors.push(`${path}.enabled must be boolean`)
  const parameters = normalizeParameters(value.parameters, errors, `${path}.parameters`)
  const subject = typeof value.subject === 'string' ? value.subject.trim() : undefined
  const target = typeof value.target === 'string' ? value.target.trim() : undefined
  const description = typeof value.description === 'string' ? value.description.trim() : ''
  const enabled = typeof value.enabled === 'boolean' ? value.enabled : undefined
  if (!id || !nonEmptyString(value.kind) || !MECHANIC_KINDS.includes(value.kind as GameplayMechanicKind) || !description) return undefined
  return Object.freeze({
    id,
    kind: value.kind as GameplayMechanicKind,
    ...(subject ? { subject } : {}),
    ...(target ? { target } : {}),
    description,
    ...(enabled !== undefined ? { enabled } : {}),
    ...(parameters ? { parameters } : {}),
    supportStatus: status(value.supportStatus, id, capabilities, warnings, path),
  })
}

function normalizeInteraction(
  value: unknown,
  entityIdSet: ReadonlySet<string>,
  warnings: string[],
  errors: string[],
  path: string,
): GameplayInteractionCandidate | undefined {
  if (!isRecord(value)) {
    errors.push(`${path} must be an object`)
    return undefined
  }
  const id = typeof value.id === 'string' ? slug(value.id) : ''
  if (!id) errors.push(`${path}.id must be non-empty`)
  if (!Array.isArray(value.participants) || value.participants.length < 2) errors.push(`${path}.participants must contain at least two participants`)
  if (!nonEmptyString(value.concept)) errors.push(`${path}.concept must be non-empty`)
  if (!nonEmptyString(value.outcome)) errors.push(`${path}.outcome must be non-empty`)
  const participants = Array.isArray(value.participants)
    ? value.participants.map((item, index) => participant(item, entityIdSet, errors, `${path}.participants[${index}]`)).filter((item): item is GameplayParticipantReference => item !== undefined)
    : []
  if (!id || participants.length < 2 || !nonEmptyString(value.concept) || !nonEmptyString(value.outcome)) return undefined
  return Object.freeze({
    id,
    participants: Object.freeze(participants),
    concept: value.concept.trim(),
    outcome: value.outcome.trim(),
    supportStatus: status(value.supportStatus, undefined, NO_SUPPORTED_CAPABILITIES, warnings, path),
  })
}

function normalizeGoal(
  value: unknown,
  entityIdSet: ReadonlySet<string>,
  warnings: string[],
  errors: string[],
  path: string,
): GameplayGoalCandidate | undefined {
  if (!isRecord(value)) {
    errors.push(`${path} must be an object`)
    return undefined
  }
  const id = typeof value.id === 'string' ? slug(value.id) : ''
  if (!id) errors.push(`${path}.id must be non-empty`)
  if (!nonEmptyString(value.kind) || !GOAL_KINDS.includes(value.kind as GameplayGoalKind)) errors.push(`${path}.kind must be supported`)
  if (!nonEmptyString(value.description)) errors.push(`${path}.description must be non-empty`)
  if (value.targetEntityId !== undefined && (!nonEmptyString(value.targetEntityId) || !entityIdSet.has(value.targetEntityId))) errors.push(`${path}.targetEntityId must reference an existing semantic entity`)
  if (value.targetCount !== undefined && (typeof value.targetCount !== 'number' || !Number.isInteger(value.targetCount) || value.targetCount < 1)) errors.push(`${path}.targetCount must be a positive integer`)
  if (value.optional !== undefined && typeof value.optional !== 'boolean') errors.push(`${path}.optional must be boolean`)
  if (!id || !nonEmptyString(value.kind) || !GOAL_KINDS.includes(value.kind as GameplayGoalKind) || !nonEmptyString(value.description)) return undefined
  const description = typeof value.description === 'string' ? value.description.trim() : ''
  const targetEntityId = typeof value.targetEntityId === 'string' ? value.targetEntityId.trim() : undefined
  const targetCount = typeof value.targetCount === 'number' ? value.targetCount : undefined
  const optional = typeof value.optional === 'boolean' ? value.optional : undefined
  return Object.freeze({
    id,
    kind: value.kind as GameplayGoalKind,
    description,
    ...(targetEntityId ? { targetEntityId } : {}),
    ...(targetCount !== undefined ? { targetCount } : {}),
    ...(optional !== undefined ? { optional } : {}),
    supportStatus: status(value.supportStatus, undefined, NO_SUPPORTED_CAPABILITIES, warnings, path),
  })
}

function normalizeFailure(
  value: unknown,
  entityIdSet: ReadonlySet<string>,
  warnings: string[],
  errors: string[],
  path: string,
): GameplayFailureConditionCandidate | undefined {
  if (!isRecord(value)) {
    errors.push(`${path} must be an object`)
    return undefined
  }
  const id = typeof value.id === 'string' ? slug(value.id) : ''
  if (!id) errors.push(`${path}.id must be non-empty`)
  if (!nonEmptyString(value.kind) || !FAILURE_KINDS.includes(value.kind as GameplayFailureConditionKind)) errors.push(`${path}.kind must be supported`)
  if (!nonEmptyString(value.description)) errors.push(`${path}.description must be non-empty`)
  if (value.targetEntityId !== undefined && (!nonEmptyString(value.targetEntityId) || !entityIdSet.has(value.targetEntityId))) errors.push(`${path}.targetEntityId must reference an existing semantic entity`)
  if (!id || !nonEmptyString(value.kind) || !FAILURE_KINDS.includes(value.kind as GameplayFailureConditionKind) || !nonEmptyString(value.description)) return undefined
  return Object.freeze({
    id,
    kind: value.kind as GameplayFailureConditionKind,
    description: value.description.trim(),
    ...(typeof value.targetEntityId === 'string' ? { targetEntityId: value.targetEntityId.trim() } : {}),
    supportStatus: status(value.supportStatus, undefined, NO_SUPPORTED_CAPABILITIES, warnings, path),
  })
}

function normalizeProgression(
  value: unknown,
  warnings: string[],
  errors: string[],
  path: string,
): GameplayProgressionCandidate | undefined {
  if (!isRecord(value)) {
    errors.push(`${path} must be an object`)
    return undefined
  }
  if (!Array.isArray(value.modes) || value.modes.length === 0 || value.modes.some(mode => typeof mode !== 'string' || !PROGRESSION_MODES.includes(mode as GameplayProgressionMode))) errors.push(`${path}.modes must contain supported progression modes`)
  if (!nonEmptyString(value.description)) errors.push(`${path}.description must be non-empty`)
  if (!Array.isArray(value.modes) || value.modes.length === 0 || !nonEmptyString(value.description)) return undefined
  const description = typeof value.description === 'string' ? value.description.trim() : ''
  const modes = value.modes as GameplayProgressionMode[]
  return Object.freeze({
    modes: Object.freeze(modes),
    description,
    supportStatus: status(value.supportStatus, undefined, NO_SUPPORTED_CAPABILITIES, warnings, path),
  })
}

function normalizeSpawnRule(
  value: unknown,
  warnings: string[],
  errors: string[],
  path: string,
): GameplaySpawnRuleCandidate | undefined {
  if (!isRecord(value)) {
    errors.push(`${path} must be an object`)
    return undefined
  }
  const id = typeof value.id === 'string' ? slug(value.id) : ''
  if (!id) errors.push(`${path}.id must be non-empty`)
  if (!nonEmptyString(value.kind) || !SPAWN_KINDS.includes(value.kind as GameplaySpawnRuleKind)) errors.push(`${path}.kind must be supported`)
  if (!nonEmptyString(value.description)) errors.push(`${path}.description must be non-empty`)
  if (value.entityCategory !== undefined && (!nonEmptyString(value.entityCategory) || !ENTITY_CATEGORIES.includes(value.entityCategory as EntityCategory))) errors.push(`${path}.entityCategory must be supported`)
  if (value.entityName !== undefined && !nonEmptyString(value.entityName)) errors.push(`${path}.entityName must be non-empty when provided`)
  if (value.intervalSeconds !== undefined && (typeof value.intervalSeconds !== 'number' || !Number.isFinite(value.intervalSeconds) || value.intervalSeconds <= 0)) errors.push(`${path}.intervalSeconds must be positive when provided`)
  if (!id || !nonEmptyString(value.kind) || !SPAWN_KINDS.includes(value.kind as GameplaySpawnRuleKind) || !nonEmptyString(value.description)) return undefined
  const description = typeof value.description === 'string' ? value.description.trim() : ''
  const entityName = typeof value.entityName === 'string' ? value.entityName.trim() : undefined
  const intervalSeconds = typeof value.intervalSeconds === 'number' ? value.intervalSeconds : undefined
  return Object.freeze({
    id,
    kind: value.kind as GameplaySpawnRuleKind,
    description,
    ...(value.entityCategory ? { entityCategory: value.entityCategory as EntityCategory } : {}),
    ...(entityName ? { entityName } : {}),
    ...(intervalSeconds !== undefined ? { intervalSeconds } : {}),
    supportStatus: status(value.supportStatus, undefined, NO_SUPPORTED_CAPABILITIES, warnings, path),
  })
}

export class DefaultGameplaySpecificationValidator implements GameplaySpecificationValidator {
  validate(candidate: unknown, options: GameplaySpecificationValidationOptions): GameplaySpecificationValidationResult {
    const errors: string[] = []
    const warnings: string[] = []
    if (!isRecord(candidate)) return { valid: false, errors: Object.freeze(['candidate must be an object']), warnings: Object.freeze([]) }

    const loop = candidate.gameLoop
    if (!isRecord(loop)) errors.push('gameLoop must be an object')
    if (!isRecord(loop)) return { valid: false, errors: Object.freeze(errors), warnings: Object.freeze(warnings) }
    const objective = typeof loop.objective === 'string' ? loop.objective.trim() : ''
    const success = typeof loop.success === 'string' ? loop.success.trim() : ''
    const failure = typeof loop.failure === 'string' ? loop.failure.trim() : ''
    for (const field of ['objective', 'success', 'failure'] as const) if (!nonEmptyString(loop[field])) errors.push(`gameLoop.${field} must be non-empty`)
    for (const field of ['repeatableActions', 'challengeSources', 'rewardSources', 'progressionModes'] as const) {
      const values = loop[field]
      const mustHaveValue = field === 'repeatableActions' || field === 'progressionModes'
      if (!Array.isArray(values) || (mustHaveValue && values.length === 0) || values.some(item => !nonEmptyString(item))) {
        errors.push(`gameLoop.${field} must contain non-empty strings`)
      }
    }
    if (!nonEmptyString(loop.completionMode) || !['goal', 'duration', 'endless', 'open-ended'].includes(loop.completionMode)) errors.push('gameLoop.completionMode must be supported')

    if (!Array.isArray(candidate.mechanics) || candidate.mechanics.length === 0) errors.push('mechanics must contain at least one definition')
    const mechanics = Array.isArray(candidate.mechanics)
      ? candidate.mechanics.map((item, index) => normalizeMechanic(item, options.capabilities, warnings, errors, `mechanics[${index}]`)).filter((item): item is GameplayMechanicCandidate => item !== undefined)
      : []
    const mechanicIds = new Set<string>()
    for (const mechanic of mechanics) {
      if (mechanicIds.has(mechanic.id)) errors.push(`mechanics.${mechanic.id} must be unique`)
      mechanicIds.add(mechanic.id)
    }
    if (!Array.isArray(candidate.playerMechanics) || candidate.playerMechanics.some(item => !nonEmptyString(item))) errors.push('playerMechanics must contain mechanic IDs')
    const playerMechanics = Array.isArray(candidate.playerMechanics) ? candidate.playerMechanics.map(item => slug(String(item))) : []
    for (const id of playerMechanics) if (!mechanicIds.has(id)) errors.push(`playerMechanics references unknown mechanic ${id}`)

    const ids = entityIds(options.semanticWorld)
    const interactions = candidate.interactions === undefined ? undefined : Array.isArray(candidate.interactions)
      ? candidate.interactions.map((item, index) => normalizeInteraction(item, ids, warnings, errors, `interactions[${index}]`)).filter((item): item is GameplayInteractionCandidate => item !== undefined)
      : (errors.push('interactions must be an array when provided'), [])
    const goals = candidate.goals === undefined ? undefined : Array.isArray(candidate.goals)
      ? candidate.goals.map((item, index) => normalizeGoal(item, ids, warnings, errors, `goals[${index}]`)).filter((item): item is GameplayGoalCandidate => item !== undefined)
      : (errors.push('goals must be an array when provided'), [])
    const failures = candidate.failureConditions === undefined ? undefined : Array.isArray(candidate.failureConditions)
      ? candidate.failureConditions.map((item, index) => normalizeFailure(item, ids, warnings, errors, `failureConditions[${index}]`)).filter((item): item is GameplayFailureConditionCandidate => item !== undefined)
      : (errors.push('failureConditions must be an array when provided'), [])
    const progression = candidate.progression === undefined ? undefined : normalizeProgression(candidate.progression, warnings, errors, 'progression')
    const spawnRules = candidate.spawnRules === undefined ? undefined : Array.isArray(candidate.spawnRules)
      ? candidate.spawnRules.map((item, index) => normalizeSpawnRule(item, warnings, errors, `spawnRules[${index}]`)).filter((item): item is GameplaySpawnRuleCandidate => item !== undefined)
      : (errors.push('spawnRules must be an array when provided'), [])

    if (errors.length > 0) return { valid: false, errors: Object.freeze(errors), warnings: Object.freeze(warnings) }
    const normalized = Object.freeze({
      gameLoop: Object.freeze({
        objective,
        repeatableActions: Object.freeze((loop.repeatableActions as string[]).map(item => item.trim())),
        challengeSources: Object.freeze((loop.challengeSources as string[]).map(item => item.trim())),
        rewardSources: Object.freeze((loop.rewardSources as string[]).map(item => item.trim())),
        progressionModes: Object.freeze((loop.progressionModes as GameplayProgressionMode[]).map(item => item)),
        completionMode: loop.completionMode as 'goal' | 'duration' | 'endless' | 'open-ended',
        success,
        failure,
      }),
      playerMechanics: Object.freeze(playerMechanics),
      mechanics: Object.freeze(mechanics),
      ...(interactions ? { interactions: Object.freeze(interactions) } : {}),
      ...(progression ? { progression } : {}),
      ...(goals ? { goals: Object.freeze(goals) } : {}),
      ...(failures ? { failureConditions: Object.freeze(failures) } : {}),
      ...(spawnRules ? { spawnRules: Object.freeze(spawnRules) } : {}),
    }) as GameplaySpecificationCandidate
    return { valid: true, errors: Object.freeze([]), warnings: Object.freeze(warnings), candidate: normalized }
  }
}
