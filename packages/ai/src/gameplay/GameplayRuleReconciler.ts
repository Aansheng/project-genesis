import type {
  GameWorldModel,
  GameplayAction,
  GameplayBooleanReference,
  GameplayCapabilityCatalog,
  GameplayCondition,
  GameplayEntitySelector,
  GameplayNumericReference,
  GameplayRuleReconciliationFact,
  GameplayRuleReconciliationInput,
  GameplayRuleReconciliationResult,
  GameplayRuleReconciler,
  GameplayRuleSpecification,
  GameplaySpecification,
} from '@genesis/shared'
import {
  DEFAULT_GAMEPLAY_CAPABILITY_CATALOG,
} from '@genesis/shared'
import type { GameplayRuleBuilder } from './GameplayRuleBuilder'
import type { GameplayRuleCandidate } from './GameplayRuleCandidate'
import { DefaultGameplayRuleBuilder } from './GameplayRuleBuilder'
import type { GameplayRuleValidator } from './GameplayRuleValidator'
import { DefaultGameplayRuleValidator } from './GameplayRuleValidator'

function freeze<T>(value: T): T {
  if (value === null || typeof value !== 'object' || Object.isFrozen(value)) return value
  if (Array.isArray(value)) value.forEach(item => freeze(item))
  else Object.values(value as Record<string, unknown>).forEach(item => freeze(item))
  return Object.freeze(value)
}

function archetype(value: string): string {
  return value.trim().toLocaleLowerCase().replace(/[^a-z0-9]+/gu, '-').replace(/^-|-$/gu, '')
}

function entityIds(world: GameWorldModel, predicate: (entity: GameWorldModel['entities'][number]) => boolean): readonly string[] {
  return world.entities.filter(predicate).map(entity => entity.id).sort()
}

function selectorDependency(selector: GameplayEntitySelector, world: GameWorldModel): string {
  if (selector.kind === 'eventActor' || selector.kind === 'eventTarget') return selector.kind
  if (selector.kind === 'exactEntityId') {
    const entity = world.entities.find(item => item.id === selector.entityId)
    return `exact:${selector.entityId}:${entity?.category ?? 'missing'}:${entity?.name ?? 'missing'}`
  }
  if (selector.kind === 'category') return `category:${selector.category}:${entityIds(world, entity => entity.category === selector.category).join(',')}`
  if (selector.kind === 'role') return `role:${selector.role}:${entityIds(world, entity => entity.category === selector.role).join(',')}`
  return `archetype:${archetype(selector.archetype)}:${entityIds(world, entity => archetype(entity.name) === archetype(selector.archetype)).join(',')}`
}

function numericDependency(value: GameplayNumericReference, world: GameWorldModel): string {
  if (value.kind === 'entityProperty') return `numeric-entity:${selectorDependency(value.entity, world)}:${value.property}`
  return `${value.kind}:${value.key}`
}

function booleanDependency(value: GameplayBooleanReference, world: GameWorldModel): string {
  if (value.kind === 'entityProperty') return `boolean-entity:${selectorDependency(value.entity, world)}:${value.property}`
  return `${value.kind}:${value.key}`
}

function conditionDependency(condition: GameplayCondition, world: GameWorldModel): string {
  switch (condition.type) {
    case 'ENTITY_CATEGORY_EQUALS':
      return `category-condition:${condition.category}:${entityIds(world, entity => entity.category === condition.category).join(',')}:${selectorDependency(condition.entity, world)}`
    case 'ENTITY_ARCHETYPE_EQUALS':
      return `archetype-condition:${archetype(condition.archetype)}:${entityIds(world, entity => archetype(entity.name) === archetype(condition.archetype)).join(',')}:${selectorDependency(condition.entity, world)}`
    case 'ENTITY_ID_EQUALS':
      return `id-condition:${condition.entityId}:${world.entities.some(entity => entity.id === condition.entityId)}:${selectorDependency(condition.entity, world)}`
    case 'CONTACT_DIRECTION_EQUALS':
      return `contact:${condition.direction}:${condition.negated === true}`
    case 'COMPONENT_EXISTS':
      return `component:${condition.componentType}:${selectorDependency(condition.entity, world)}`
    case 'NUMBER_COMPARE':
      return `number:${numericDependency(condition.value, world)}:${condition.operator}:${condition.expected}`
    case 'BOOLEAN_EQUALS':
      return `boolean:${booleanDependency(condition.value, world)}:${condition.expected}`
  }
}

function actionDependency(action: GameplayAction, world: GameWorldModel): string {
  switch (action.type) {
    case 'REMOVE_ENTITY':
    case 'DAMAGE_ENTITY':
    case 'APPLY_VELOCITY':
    case 'SET_ENTITY_PROPERTY':
      return `${action.type}:${selectorDependency(action.target, world)}`
    case 'COMPLETE_GOAL':
      return `COMPLETE_GOAL:${action.goalId ?? '*'}:${action.goalId === undefined || world.entities.some(entity => entity.id === action.goalId)}`
    case 'SPAWN_ENTITY':
      return `SPAWN_ENTITY:${action.entity.category ?? '*'}:${action.entity.archetype ?? '*'}:${action.entity.role ?? '*'}`
    case 'CHANGE_NUMERIC_STATE':
      return `CHANGE_NUMERIC_STATE:${action.state}`
  }
}

/**
 * Captures only semantic dependencies of a rule. Runtime facts and execution
 * state are deliberately excluded so an unrelated semantic revision can keep
 * the same rule object.
 */
function dependencyFingerprint(rule: GameplayRuleSpecification, world: GameWorldModel): string {
  const dependencies = [
    `trigger:${rule.trigger.eventType}`,
    ...(rule.trigger.actor ? [`trigger-actor:${selectorDependency(rule.trigger.actor, world)}`] : []),
    ...(rule.trigger.target ? [`trigger-target:${selectorDependency(rule.trigger.target, world)}`] : []),
    ...rule.conditions.map(condition => conditionDependency(condition, world)),
    ...rule.actions.map(action => actionDependency(action, world)),
  ]
  return JSON.stringify(dependencies)
}

function sameSemanticWorld(left: GameWorldModel, right: GameWorldModel): boolean {
  if (left.worldType !== right.worldType || left.entities.length !== right.entities.length) return false
  return left.entities.every((entity, index) => {
    const other = right.entities[index]
    return other !== undefined
      && entity.id === other.id
      && entity.name === other.name
      && entity.category === other.category
  })
}

function validationOptions(
  world: GameWorldModel,
  specification: GameplaySpecification,
  capabilities: GameplayCapabilityCatalog,
) {
  return {
    semanticWorld: world,
    capabilities,
    gameplaySpecification: {
      mechanics: specification.mechanics,
      ...(specification.goals ? { goals: specification.goals.map(goal => ({ id: goal.id })) } : {}),
    },
  }
}

function resultArrays(facts: readonly GameplayRuleReconciliationFact[]) {
  return {
    preservedRuleIds: Object.freeze(facts.filter(fact => fact.action === 'preserved').map(fact => fact.ruleId)),
    revalidatedRuleIds: Object.freeze(facts.filter(fact => fact.action === 'revalidated').map(fact => fact.ruleId)),
    rebuiltRuleIds: Object.freeze(facts.filter(fact => fact.action === 'rebuilt').map(fact => fact.ruleId)),
    removedRuleIds: Object.freeze(facts.filter(fact => fact.action === 'removed').map(fact => fact.ruleId)),
    deferredRuleIds: Object.freeze(facts.filter(fact => fact.action === 'deferred').map(fact => fact.ruleId)),
  }
}

function failedResult(
  input: GameplayRuleReconciliationInput,
  failureReason: string,
): GameplayRuleReconciliationResult {
  return Object.freeze({
    status: 'failed',
    operationId: input.semanticMutation.operationId,
    worldId: input.semanticMutation.worldId,
    semanticRevision: input.semanticMutation.previousRevision,
    facts: Object.freeze([]),
    ...resultArrays([]),
    failureReason,
  })
}

export class DefaultGameplayRuleReconciler implements GameplayRuleReconciler {
  constructor(
    private readonly ruleBuilder: GameplayRuleBuilder = new DefaultGameplayRuleBuilder(),
    private readonly ruleValidator: GameplayRuleValidator = new DefaultGameplayRuleValidator(),
    private readonly defaultCapabilities: GameplayCapabilityCatalog = DEFAULT_GAMEPLAY_CAPABILITY_CATALOG,
  ) {}

  reconcile(input: GameplayRuleReconciliationInput): GameplayRuleReconciliationResult {
    const mutation = input.semanticMutation
    const currentRuleSet = input.currentRuleSet
    const capabilities = input.capabilities ?? this.defaultCapabilities
    if (mutation.status !== 'applied') return failedResult(input, 'semantic_mutation_not_applied')
    if (currentRuleSet.bindingStatus !== 'current') return failedResult(input, 'current_rule_set_is_stale')
    if (currentRuleSet.worldId !== undefined && currentRuleSet.worldId !== mutation.worldId) return failedResult(input, 'world_mismatch')
    if (currentRuleSet.semanticRevision !== mutation.previousRevision) return failedResult(input, 'stale_rule_set_revision')
    if (!sameSemanticWorld(input.semanticWorld, mutation.updatedWorld)) return failedResult(input, 'semantic_world_mismatch')

    const buildInput = (world: GameWorldModel, revision: number) => ({
      semanticWorld: world,
      gameplaySpecification: input.gameplaySpecification,
      capabilities,
      worldId: currentRuleSet.worldId ?? mutation.worldId,
      ...(currentRuleSet.sessionId ? { sessionId: currentRuleSet.sessionId } : {}),
      semanticRevision: revision,
      metadata: Object.freeze({ source: 'deterministic' as const }),
    })
    const beforeBaseline = this.ruleBuilder.build(buildInput(mutation.previousWorld, mutation.previousRevision))
    const afterBaseline = this.ruleBuilder.build(buildInput(mutation.updatedWorld, mutation.updatedRevision))
    const beforeBaselineById = new Map(beforeBaseline.rules.map(rule => [rule.ruleId, rule]))
    const afterBaselineById = new Map(afterBaseline.rules.map(rule => [rule.ruleId, rule]))
    const currentById = new Map(currentRuleSet.rules.map(rule => [rule.ruleId, rule]))
    const facts: GameplayRuleReconciliationFact[] = []
    const nextRules: GameplayRuleSpecification[] = []

    const addFact = (ruleId: string, action: GameplayRuleReconciliationFact['action'], reason?: string): void => {
      facts.push(Object.freeze({ ruleId, action, ...(reason ? { reason } : {}) }))
    }
    const buildCandidate = (candidate: GameplayRuleCandidate): GameplayRuleSpecification | undefined => {
      const rebuilt = this.ruleBuilder.build({
        ...buildInput(mutation.updatedWorld, mutation.updatedRevision),
        candidate: Object.freeze([candidate]),
        metadata: Object.freeze({
          source: currentRuleSet.metadata.source,
          ...(currentRuleSet.metadata.warnings ? { warnings: currentRuleSet.metadata.warnings } : {}),
          ...(currentRuleSet.metadata.architectureVersion ? { architectureVersion: currentRuleSet.metadata.architectureVersion } : {}),
        }),
      })
      return rebuilt.rules[0]
    }

    for (const currentRule of currentRuleSet.rules) {
      const beforeDependency = dependencyFingerprint(currentRule, mutation.previousWorld)
      const afterDependency = dependencyFingerprint(currentRule, mutation.updatedWorld)
      const affected = beforeDependency !== afterDependency
      const known = beforeBaselineById.has(currentRule.ruleId) || afterBaselineById.has(currentRule.ruleId)
      const freshRule = afterBaselineById.get(currentRule.ruleId)
      const validation = this.ruleValidator.validate([currentRule], validationOptions(mutation.updatedWorld, input.gameplaySpecification, capabilities))

      if (known && affected) {
        if (freshRule) {
          nextRules.push(freshRule)
          addFact(currentRule.ruleId, 'rebuilt', 'deterministic baseline changed with semantic dependencies')
        } else {
          addFact(currentRule.ruleId, 'removed', 'deterministic rule is no longer resolvable against current semantic truth')
        }
        continue
      }

      if (!validation.valid || !validation.candidate?.[0]) {
        addFact(currentRule.ruleId, 'removed', validation.errors.join('; ') || 'rule is not valid against the current semantic world')
        continue
      }

      if (affected) {
        const revalidated = buildCandidate(validation.candidate[0])
        if (!revalidated) {
          addFact(currentRule.ruleId, 'deferred', 'affected rule could not be rebuilt deterministically')
          continue
        }
        nextRules.push(revalidated)
        addFact(currentRule.ruleId, 'revalidated', 'rule remains valid against current semantic truth')
        continue
      }

      nextRules.push(currentRule)
      addFact(currentRule.ruleId, 'preserved')
    }

    for (const freshRule of afterBaseline.rules) {
      if (currentById.has(freshRule.ruleId)) continue
      const beforeRule = beforeBaselineById.get(freshRule.ruleId)
      const changed = !beforeRule
        || dependencyFingerprint(beforeRule, mutation.previousWorld) !== dependencyFingerprint(freshRule, mutation.updatedWorld)
      if (!changed) continue
      nextRules.push(freshRule)
      addFact(freshRule.ruleId, 'rebuilt', 'new deterministic rule became resolvable after semantic evolution')
    }

    const warnings = Object.freeze([
      ...(currentRuleSet.metadata.warnings ?? []).filter(warning => !warning.includes('gameplay rule synchronization is deferred')),
      ...facts
        .filter(fact => fact.action === 'removed' || fact.action === 'deferred')
        .map(fact => `Gameplay rule ${fact.ruleId} ${fact.action} during semantic reconciliation: ${fact.reason ?? 'unresolved'}.`),
    ])
    const ruleSet = freeze({
      ...currentRuleSet,
      semanticRevision: mutation.updatedRevision,
      sourceSemanticRevision: mutation.updatedRevision,
      bindingStatus: 'current' as const,
      rules: Object.freeze(nextRules),
      metadata: Object.freeze({
        ...currentRuleSet.metadata,
        ...(warnings.length > 0 ? { warnings } : {}),
      }),
    })
    const arrays = resultArrays(facts)
    return Object.freeze({
      status: 'reconciled',
      operationId: mutation.operationId,
      worldId: mutation.worldId,
      semanticRevision: mutation.updatedRevision,
      ruleSet,
      facts: Object.freeze(facts),
      ...arrays,
    })
  }
}
