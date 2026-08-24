import type {
  EntityCategory,
  GameWorldModel,
  GameplayAction,
  GameplayActionValue,
  GameplayBooleanReference,
  GameplayCapabilityCatalog,
  GameplayCondition,
  GameplayContactDirection,
  GameplayEntitySelector,
  GameplayNumericReference,
  GameplayRuleConditionMode,
  GameplayTrigger,
} from '@genesis/shared'
import {
  GAMEPLAY_RULE_ACTION_TYPES,
  GAMEPLAY_RULE_CONDITION_TYPES,
  GAMEPLAY_RULE_EVENT_TYPES,
} from '@genesis/shared'
import type { GameplayRuleCandidate } from './GameplayRuleCandidate'

export interface GameplayRuleValidationOptions {
  readonly semanticWorld: GameWorldModel
  readonly capabilities: GameplayCapabilityCatalog
  readonly gameplaySpecification?: {
    readonly mechanics: readonly { readonly id: string }[]
    readonly goals?: readonly { readonly id: string }[]
  }
}

export interface GameplayRuleValidationResult {
  readonly valid: boolean
  readonly errors: readonly string[]
  readonly warnings: readonly string[]
  readonly candidate?: readonly GameplayRuleCandidate[]
}

export interface GameplayRuleValidator {
  validate(candidate: unknown, options: GameplayRuleValidationOptions): GameplayRuleValidationResult
}

const ENTITY_CATEGORIES: readonly EntityCategory[] = ['player', 'npc', 'enemy', 'terrain', 'building', 'item', 'quest']
const DIRECTIONS: readonly GameplayContactDirection[] = ['top', 'bottom', 'left', 'right']
const OPERATORS = ['eq', 'neq', 'gt', 'gte', 'lt', 'lte'] as const
const COMPONENTS = ['position', 'velocity', 'collision-bounds', 'semantic', 'health'] as const
const PROPERTY_NAMES = ['activated', 'enabled', 'visible'] as const
const NUMERIC_PAYLOAD_KEYS = ['x', 'y', 'velocityX', 'velocityY', 'amount'] as const
const BOOLEAN_PAYLOAD_KEYS = ['isGrounded', 'isActive'] as const

type RecordValue = Record<string, unknown>

const isRecord = (value: unknown): value is RecordValue =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const nonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0

const primitive = (value: unknown): value is GameplayActionValue =>
  typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'

function slug(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/gu, '-').replace(/^-|-$/gu, '')
}

function archetype(value: string): string {
  return slug(value)
}

function entityIds(world: GameWorldModel): ReadonlySet<string> {
  return new Set(world.entities.map(entity => entity.id))
}

function entityNames(world: GameWorldModel): ReadonlySet<string> {
  return new Set(world.entities.map(entity => archetype(entity.name)))
}

function selectorMatchesKnownEntity(selector: GameplayEntitySelector, world: GameWorldModel): boolean {
  switch (selector.kind) {
    case 'eventActor':
    case 'eventTarget':
      return true
    case 'exactEntityId':
      return world.entities.some(entity => entity.id === selector.entityId)
    case 'category':
      return world.entities.some(entity => entity.category === selector.category)
    case 'archetype':
      return entityNames(world).has(archetype(selector.archetype))
    case 'role':
      return world.entities.some(entity => entity.category === selector.role)
  }
}

function normalizeSelector(
  value: unknown,
  world: GameWorldModel,
  errors: string[],
  path: string,
): GameplayEntitySelector | undefined {
  if (!isRecord(value)) {
    errors.push(`${path} must be a typed selector object`)
    return undefined
  }
  const kind = value.kind ?? value.mode ?? value.type
  if (kind === 'eventActor' || kind === 'eventTarget') return Object.freeze({ kind })
  if (kind === 'exactEntityId') {
    const entityId = typeof value.entityId === 'string' ? value.entityId.trim() : typeof value.id === 'string' ? value.id.trim() : ''
    if (!entityId || !entityIds(world).has(entityId)) {
      errors.push(`${path}.entityId must reference an existing semantic entity`)
      return undefined
    }
    return Object.freeze({ kind, entityId })
  }
  if (kind === 'category') {
    if (typeof value.category !== 'string' || !ENTITY_CATEGORIES.includes(value.category as EntityCategory)) {
      errors.push(`${path}.category must be a supported semantic category`)
      return undefined
    }
    const selector = Object.freeze({ kind, category: value.category as EntityCategory })
    if (!selectorMatchesKnownEntity(selector, world)) errors.push(`${path}.category must match a current semantic entity`)
    return selector
  }
  if (kind === 'archetype') {
    const valueText = typeof value.archetype === 'string' ? value.archetype.trim() : ''
    if (!valueText) {
      errors.push(`${path}.archetype must be non-empty`)
      return undefined
    }
    const selector = Object.freeze({ kind, archetype: valueText })
    if (!selectorMatchesKnownEntity(selector, world)) errors.push(`${path}.archetype must match a current semantic entity name`)
    return selector
  }
  if (kind === 'role') {
    const role = typeof value.role === 'string' ? value.role.trim() : ''
    if (!role || !world.entities.some(entity => entity.category === role)) {
      errors.push(`${path}.role must match a current semantic entity category`)
      return undefined
    }
    return Object.freeze({ kind, role })
  }
  errors.push(`${path}.kind must be eventActor, eventTarget, exactEntityId, category, archetype, or role`)
  return undefined
}

function normalizeTrigger(
  value: unknown,
  world: GameWorldModel,
  errors: string[],
  path: string,
): GameplayTrigger | undefined {
  if (!isRecord(value)) {
    errors.push(`${path} must be an object`)
    return undefined
  }
  const eventType = value.eventType ?? value.type
  if (typeof eventType !== 'string' || !GAMEPLAY_RULE_EVENT_TYPES.includes(eventType as typeof GAMEPLAY_RULE_EVENT_TYPES[number])) {
    errors.push(`${path}.eventType must be an observed GameplayEvent type`)
    return undefined
  }
  const actor = value.actor === undefined ? undefined : normalizeSelector(value.actor, world, errors, `${path}.actor`)
  const target = value.target === undefined ? undefined : normalizeSelector(value.target, world, errors, `${path}.target`)
  return Object.freeze({
    eventType: eventType as GameplayTrigger['eventType'],
    ...(actor ? { actor } : {}),
    ...(target ? { target } : {}),
  })
}

function normalizeNumericReference(
  value: unknown,
  world: GameWorldModel,
  errors: string[],
  path: string,
): GameplayNumericReference | undefined {
  if (!isRecord(value)) {
    errors.push(`${path} must be a typed numeric reference`)
    return undefined
  }
  const kind = value.kind
  if (kind === 'eventPayload') {
    if (!NUMERIC_PAYLOAD_KEYS.includes(value.key as typeof NUMERIC_PAYLOAD_KEYS[number])) {
      errors.push(`${path}.key must be a supported numeric event payload key`)
      return undefined
    }
    return Object.freeze({ kind, key: value.key as typeof NUMERIC_PAYLOAD_KEYS[number] })
  }
  if (kind === 'entityProperty') {
    const entity = normalizeSelector(value.entity ?? value.selector, world, errors, `${path}.entity`)
    const properties = ['x', 'y', 'velocityX', 'velocityY', 'health'] as const
    if (!properties.includes(value.property as typeof properties[number])) errors.push(`${path}.property must be a supported numeric entity property`)
    if (!entity || !properties.includes(value.property as typeof properties[number])) return undefined
    return Object.freeze({ kind, entity, property: value.property as typeof properties[number] })
  }
  if (kind === 'gameState') {
    if (!nonEmptyString(value.key)) {
      errors.push(`${path}.key must be a non-empty game-state key`)
      return undefined
    }
    return Object.freeze({ kind, key: value.key.trim() })
  }
  errors.push(`${path}.kind must be eventPayload, entityProperty, or gameState`)
  return undefined
}

function normalizeBooleanReference(
  value: unknown,
  world: GameWorldModel,
  errors: string[],
  path: string,
): GameplayBooleanReference | undefined {
  if (!isRecord(value)) {
    errors.push(`${path} must be a typed boolean reference`)
    return undefined
  }
  if (value.kind === 'eventPayload') {
    if (!BOOLEAN_PAYLOAD_KEYS.includes(value.key as typeof BOOLEAN_PAYLOAD_KEYS[number])) {
      errors.push(`${path}.key must be a supported boolean event payload key`)
      return undefined
    }
    return Object.freeze({ kind: 'eventPayload', key: value.key as typeof BOOLEAN_PAYLOAD_KEYS[number] })
  }
  if (value.kind === 'entityProperty') {
    const entity = normalizeSelector(value.entity ?? value.selector, world, errors, `${path}.entity`)
    if (!PROPERTY_NAMES.includes(value.property as typeof PROPERTY_NAMES[number])) errors.push(`${path}.property must be a supported boolean entity property`)
    if (!entity || !PROPERTY_NAMES.includes(value.property as typeof PROPERTY_NAMES[number])) return undefined
    return Object.freeze({ kind: 'entityProperty', entity, property: value.property as typeof PROPERTY_NAMES[number] })
  }
  if (value.kind === 'gameState') {
    if (!nonEmptyString(value.key)) errors.push(`${path}.key must be a non-empty game-state key`)
    return nonEmptyString(value.key) ? Object.freeze({ kind: 'gameState', key: value.key.trim() }) : undefined
  }
  errors.push(`${path}.kind must be eventPayload, entityProperty, or gameState`)
  return undefined
}

function normalizeCondition(
  value: unknown,
  world: GameWorldModel,
  errors: string[],
  path: string,
): GameplayCondition | undefined {
  if (!isRecord(value)) {
    errors.push(`${path} must be an object`)
    return undefined
  }
  const type = value.type
  if (typeof type !== 'string' || !GAMEPLAY_RULE_CONDITION_TYPES.includes(type as typeof GAMEPLAY_RULE_CONDITION_TYPES[number])) {
    errors.push(`${path}.type must be a whitelisted GameplayCondition type`)
    return undefined
  }
  if (type === 'ENTITY_CATEGORY_EQUALS') {
    const entity = normalizeSelector(value.entity ?? value.selector, world, errors, `${path}.entity`)
    if (typeof value.category !== 'string' || !ENTITY_CATEGORIES.includes(value.category as EntityCategory)) errors.push(`${path}.category must be a supported semantic category`)
    if (!entity || typeof value.category !== 'string' || !ENTITY_CATEGORIES.includes(value.category as EntityCategory)) return undefined
    return Object.freeze({ type, entity, category: value.category as EntityCategory })
  }
  if (type === 'ENTITY_ARCHETYPE_EQUALS') {
    const entity = normalizeSelector(value.entity ?? value.selector, world, errors, `${path}.entity`)
    const valueText = typeof value.archetype === 'string' ? value.archetype.trim() : ''
    if (!valueText || !entityNames(world).has(archetype(valueText))) errors.push(`${path}.archetype must match a current semantic entity name`)
    if (!entity || !valueText || !entityNames(world).has(archetype(valueText))) return undefined
    return Object.freeze({ type, entity, archetype: valueText })
  }
  if (type === 'ENTITY_ID_EQUALS') {
    const entity = normalizeSelector(value.entity ?? value.selector, world, errors, `${path}.entity`)
    const entityId = typeof value.entityId === 'string' ? value.entityId.trim() : ''
    if (!entityId || !entityIds(world).has(entityId)) errors.push(`${path}.entityId must reference an existing semantic entity`)
    if (!entity || !entityId || !entityIds(world).has(entityId)) return undefined
    return Object.freeze({ type, entity, entityId })
  }
  if (type === 'CONTACT_DIRECTION_EQUALS') {
    if (!DIRECTIONS.includes(value.direction as GameplayContactDirection)) errors.push(`${path}.direction must be top, bottom, left, or right`)
    if (value.negated !== undefined && typeof value.negated !== 'boolean') errors.push(`${path}.negated must be boolean when provided`)
    if (!DIRECTIONS.includes(value.direction as GameplayContactDirection)) return undefined
    return Object.freeze({ type, direction: value.direction as GameplayContactDirection, ...(value.negated === true ? { negated: true } : {}) })
  }
  if (type === 'NUMBER_COMPARE') {
    const reference = normalizeNumericReference(value.value ?? value.reference, world, errors, `${path}.value`)
    if (!OPERATORS.includes(value.operator as typeof OPERATORS[number])) errors.push(`${path}.operator must be eq, neq, gt, gte, lt, or lte`)
    if (typeof value.expected !== 'number' || !Number.isFinite(value.expected)) errors.push(`${path}.expected must be a finite number`)
    if (!reference || !OPERATORS.includes(value.operator as typeof OPERATORS[number]) || typeof value.expected !== 'number' || !Number.isFinite(value.expected)) return undefined
    return Object.freeze({ type, value: reference, operator: value.operator as typeof OPERATORS[number], expected: value.expected })
  }
  if (type === 'BOOLEAN_EQUALS') {
    const reference = normalizeBooleanReference(value.value ?? value.reference, world, errors, `${path}.value`)
    if (typeof value.expected !== 'boolean') errors.push(`${path}.expected must be boolean`)
    if (!reference || typeof value.expected !== 'boolean') return undefined
    return Object.freeze({ type, value: reference, expected: value.expected })
  }
  const entity = normalizeSelector(value.entity ?? value.selector, world, errors, `${path}.entity`)
  if (!COMPONENTS.includes(value.componentType as typeof COMPONENTS[number])) errors.push(`${path}.componentType must be a known Runtime component type`)
  if (!entity || !COMPONENTS.includes(value.componentType as typeof COMPONENTS[number])) return undefined
  return Object.freeze({ type: 'COMPONENT_EXISTS', entity, componentType: value.componentType as typeof COMPONENTS[number] })
}

function normalizeAction(
  value: unknown,
  world: GameWorldModel,
  gameplaySpecification: GameplayRuleValidationOptions['gameplaySpecification'],
  errors: string[],
  path: string,
): GameplayAction | undefined {
  if (!isRecord(value)) {
    errors.push(`${path} must be an object`)
    return undefined
  }
  const hasExecutableField = ['code', 'script', 'expression', 'handler', 'execute'].some(key => key in value)
  if (hasExecutableField) {
    errors.push(`${path} cannot contain executable code, scripts, expressions, or handlers`)
  }
  const type = value.type
  if (typeof type !== 'string' || !GAMEPLAY_RULE_ACTION_TYPES.includes(type as typeof GAMEPLAY_RULE_ACTION_TYPES[number])) {
    errors.push(`${path}.type must be a whitelisted GameplayAction type`)
    return undefined
  }
  if (hasExecutableField) return undefined
  if (type === 'REMOVE_ENTITY' || type === 'DAMAGE_ENTITY' || type === 'APPLY_VELOCITY' || type === 'SET_ENTITY_PROPERTY') {
    const target = normalizeSelector(value.target ?? value.entity, world, errors, `${path}.target`)
    if (!target) return undefined
    if (type === 'REMOVE_ENTITY') return Object.freeze({ type, target })
    if (type === 'DAMAGE_ENTITY') {
      if (typeof value.amount !== 'number' || !Number.isFinite(value.amount) || value.amount <= 0) errors.push(`${path}.amount must be a positive finite number`)
      return typeof value.amount === 'number' && Number.isFinite(value.amount) && value.amount > 0 ? Object.freeze({ type, target, amount: value.amount }) : undefined
    }
    if (type === 'SET_ENTITY_PROPERTY') {
      if (!PROPERTY_NAMES.includes(value.property as typeof PROPERTY_NAMES[number])) errors.push(`${path}.property must be activated, enabled, or visible`)
      if (!primitive(value.value)) errors.push(`${path}.value must be a JSON primitive`)
      return PROPERTY_NAMES.includes(value.property as typeof PROPERTY_NAMES[number]) && primitive(value.value)
        ? Object.freeze({ type, target, property: value.property as typeof PROPERTY_NAMES[number], value: value.value })
        : undefined
    }
    const velocityValue = value.velocity
    if (!isRecord(velocityValue)) {
      errors.push(`${path}.velocity must be an object`)
      return undefined
    }
    const hasX = velocityValue.x !== undefined
    const hasY = velocityValue.y !== undefined
    if (!hasX && !hasY) errors.push(`${path}.velocity must define x or y`)
    if (hasX && (typeof velocityValue.x !== 'number' || !Number.isFinite(velocityValue.x))) errors.push(`${path}.velocity.x must be finite when provided`)
    if (hasY && (typeof velocityValue.y !== 'number' || !Number.isFinite(velocityValue.y))) errors.push(`${path}.velocity.y must be finite when provided`)
    if (velocityValue.mode !== undefined && velocityValue.mode !== 'set' && velocityValue.mode !== 'add') errors.push(`${path}.velocity.mode must be set or add`)
    if (!hasX && !hasY) return undefined
    if ((hasX && (typeof velocityValue.x !== 'number' || !Number.isFinite(velocityValue.x))) || (hasY && (typeof velocityValue.y !== 'number' || !Number.isFinite(velocityValue.y)))) return undefined
    return Object.freeze({
      type,
      target,
      velocity: Object.freeze({
        ...(hasX ? { x: velocityValue.x as number } : {}),
        ...(hasY ? { y: velocityValue.y as number } : {}),
        ...(velocityValue.mode ? { mode: velocityValue.mode as 'set' | 'add' } : {}),
      }),
    })
  }
  if (type === 'SPAWN_ENTITY') {
    const entity = isRecord(value.entity) ? value.entity : value
    const category = entity.category
    const archetypeValue = entity.archetype
    const role = entity.role
    if (category !== undefined && (typeof category !== 'string' || !ENTITY_CATEGORIES.includes(category as EntityCategory))) errors.push(`${path}.entity.category must be a supported semantic category`)
    if (archetypeValue !== undefined && !nonEmptyString(archetypeValue)) errors.push(`${path}.entity.archetype must be non-empty when provided`)
    if (role !== undefined && !nonEmptyString(role)) errors.push(`${path}.entity.role must be non-empty when provided`)
    if (category === undefined && !nonEmptyString(archetypeValue) && !nonEmptyString(role)) errors.push(`${path}.entity must describe a category, archetype, or role`)
    if (category !== undefined && (typeof category !== 'string' || !ENTITY_CATEGORIES.includes(category as EntityCategory))) return undefined
    if (category === undefined && !nonEmptyString(archetypeValue) && !nonEmptyString(role)) return undefined
    return Object.freeze({
      type,
      entity: Object.freeze({
        ...(category ? { category: category as EntityCategory } : {}),
        ...(nonEmptyString(archetypeValue) ? { archetype: archetypeValue.trim() } : {}),
        ...(nonEmptyString(role) ? { role: role.trim() } : {}),
      }),
    })
  }
  if (type === 'CHANGE_NUMERIC_STATE') {
    const state = typeof value.state === 'string' ? value.state.trim() : typeof value.key === 'string' ? value.key.trim() : ''
    if (!state) errors.push(`${path}.state must be a non-empty state key`)
    if (typeof value.amount !== 'number' || !Number.isFinite(value.amount)) errors.push(`${path}.amount must be finite`)
    if (!state || typeof value.amount !== 'number' || !Number.isFinite(value.amount)) return undefined
    return Object.freeze({ type, state, amount: value.amount })
  }
  if (type === 'COMPLETE_GOAL') {
    const goalId = typeof value.goalId === 'string' ? value.goalId.trim() : undefined
    const knownGoal = goalId === undefined || entityIds(world).has(goalId) || gameplaySpecification?.goals?.some(goal => goal.id === goalId)
    if (!knownGoal) errors.push(`${path}.goalId must reference an existing semantic goal or entity`)
    if (!knownGoal) return undefined
    return Object.freeze({ type, ...(goalId ? { goalId } : {}) })
  }
  return undefined
}

function normalizeRule(
  value: unknown,
  index: number,
  options: GameplayRuleValidationOptions,
  errors: string[],
  warnings: string[],
): GameplayRuleCandidate | undefined {
  const path = `rules[${index}]`
  if (!isRecord(value)) {
    errors.push(`${path} must be an object`)
    return undefined
  }
  const rawId = typeof value.ruleId === 'string' ? value.ruleId : typeof value.id === 'string' ? value.id : ''
  const ruleId = slug(rawId)
  if (!ruleId) errors.push(`${path}.ruleId must be a stable non-empty identity`)
  const name = typeof value.name === 'string' ? value.name.trim() : typeof value.label === 'string' ? value.label.trim() : ruleId
  if (!name) errors.push(`${path}.name must be non-empty`)
  if (value.enabled !== undefined && typeof value.enabled !== 'boolean') errors.push(`${path}.enabled must be boolean`)
  if (value.sourceMechanicId !== undefined && !nonEmptyString(value.sourceMechanicId)) errors.push(`${path}.sourceMechanicId must be non-empty when provided`)
  if (value.sourceMechanicId !== undefined && options.gameplaySpecification && !options.gameplaySpecification.mechanics.some(mechanic => mechanic.id === slug(String(value.sourceMechanicId)))) {
    errors.push(`${path}.sourceMechanicId must reference an existing GameplaySpecification mechanic`)
  }
  const trigger = normalizeTrigger(value.trigger, options.semanticWorld, errors, `${path}.trigger`)
  if (!Array.isArray(value.conditions)) errors.push(`${path}.conditions must be an array`)
  if (!Array.isArray(value.actions) || value.actions.length === 0) errors.push(`${path}.actions must contain at least one typed action`)
  const conditions = Array.isArray(value.conditions)
    ? value.conditions.map((item, itemIndex) => normalizeCondition(item, options.semanticWorld, errors, `${path}.conditions[${itemIndex}]`)).filter((item): item is GameplayCondition => item !== undefined)
    : []
  const actions = Array.isArray(value.actions)
    ? value.actions.map((item, itemIndex) => normalizeAction(item, options.semanticWorld, options.gameplaySpecification, errors, `${path}.actions[${itemIndex}]`)).filter((item): item is GameplayAction => item !== undefined)
    : []
  const conditionMode = value.conditionMode === undefined ? 'all' : value.conditionMode
  if (conditionMode !== 'all' && conditionMode !== 'any') errors.push(`${path}.conditionMode must be all or any`)
  if (value.priority !== undefined && (typeof value.priority !== 'number' || !Number.isInteger(value.priority))) errors.push(`${path}.priority must be an integer when provided`)
  if (value.supportStatus === 'supported') warnings.push(`${path}.supportStatus is a provider claim; Genesis will derive it from the capability catalog`)
  if (!trigger || !ruleId || !name || !Array.isArray(value.actions) || value.actions.length === 0 || conditionMode !== 'all' && conditionMode !== 'any') return undefined
  return Object.freeze({
    ruleId,
    name,
    ...(typeof value.label === 'string' && value.label.trim() ? { label: value.label.trim() } : {}),
    enabled: typeof value.enabled === 'boolean' ? value.enabled : true,
    ...(typeof value.sourceMechanicId === 'string' ? { sourceMechanicId: slug(value.sourceMechanicId) } : {}),
    trigger,
    conditionMode: conditionMode as GameplayRuleConditionMode,
    conditions: Object.freeze(conditions),
    actions: Object.freeze(actions),
    priority: typeof value.priority === 'number' && Number.isInteger(value.priority) ? value.priority : 0,
  })
}

export class DefaultGameplayRuleValidator implements GameplayRuleValidator {
  validate(candidate: unknown, options: GameplayRuleValidationOptions): GameplayRuleValidationResult {
    if (candidate === undefined || candidate === null) return { valid: true, errors: Object.freeze([]), warnings: Object.freeze([]), candidate: Object.freeze([]) }
    const errors: string[] = []
    const warnings: string[] = []
    const values = Array.isArray(candidate)
      ? candidate
      : isRecord(candidate) && Array.isArray(candidate.rules)
        ? candidate.rules
        : undefined
    if (!values) return { valid: false, errors: Object.freeze(['rules must be an array']), warnings: Object.freeze([]) }
    const normalized = values.map((item, index) => normalizeRule(item, index, options, errors, warnings)).filter((item): item is GameplayRuleCandidate => item !== undefined)
    const ids = new Set<string>()
    for (const rule of normalized) {
      if (ids.has(rule.ruleId ?? rule.id ?? '')) errors.push(`rules.${rule.ruleId ?? rule.id} must be unique`)
      ids.add(rule.ruleId ?? rule.id ?? '')
    }
    return Object.freeze({
      valid: errors.length === 0,
      errors: Object.freeze(errors),
      warnings: Object.freeze(warnings),
      ...(errors.length === 0 ? { candidate: Object.freeze(normalized) } : {}),
    })
  }
}
