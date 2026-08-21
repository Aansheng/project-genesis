import type {
  EntityCategory,
  GameWorldModel,
  GameplayCapabilityCatalog,
  GameplayFailureConditionSpecification,
  GameplayGoalSpecification,
  GameplayInteractionSpecification,
  GameplayMechanicDefinition,
  GameplayProgressionSpecification,
  GameplaySpecification,
  GameplaySpecificationMetadata,
  GameplaySpawnRuleSpecification,
  GameplaySupportStatus,
} from '@genesis/shared'
import { DEFAULT_GAMEPLAY_CAPABILITY_CATALOG } from '@genesis/shared'
import type { GameplaySpecificationCandidate } from './GameplaySpecificationCandidate'

export interface GameplaySpecificationBuilderInput {
  readonly semanticWorld: GameWorldModel
  readonly candidate?: GameplaySpecificationCandidate
  readonly capabilities?: GameplayCapabilityCatalog
  readonly gameplayRevision?: number
  readonly metadata?: GameplaySpecificationMetadata
}

export interface GameplaySpecificationBuilder {
  build(input: GameplaySpecificationBuilderInput): GameplaySpecification
}

function freezeParameters(parameters: GameplaySpecificationCandidate['mechanics'][number]['parameters']) {
  return parameters ? Object.freeze({ ...parameters }) : undefined
}

function statusFor(
  mechanicId: string,
  requested: GameplaySupportStatus | undefined,
  capabilities: GameplayCapabilityCatalog,
): GameplaySupportStatus {
  if (requested !== 'supported') return requested ?? 'deferred'
  return capabilities.supportedMechanicIds.includes(mechanicId) ? 'supported' : 'deferred'
}

function mechanic(
  id: string,
  kind: GameplayMechanicDefinition['kind'],
  description: string,
  supportStatus: GameplaySupportStatus,
  subject?: string,
  target?: string,
): GameplayMechanicDefinition {
  return Object.freeze({
    id,
    kind,
    description,
    enabled: true,
    ...(subject ? { subject } : {}),
    ...(target ? { target } : {}),
    supportStatus,
  })
}

function entityId(
  world: GameWorldModel,
  predicate: (entity: GameWorldModel['entities'][number]) => boolean,
): string | undefined {
  return world.entities.find(predicate)?.id
}

function participant(role: 'subject' | 'target', id: string): { readonly role: typeof role; readonly entityId: string } {
  return Object.freeze({ role, entityId: id })
}

function defaultsFor(world: GameWorldModel): GameplaySpecificationCandidate {
  const playerId = entityId(world, entity => entity.category === 'player') ?? 'player'
  const enemyId = entityId(world, entity => entity.category === 'enemy')
  const goalId = entityId(world, entity => entity.id === 'goal' || entity.name.toLowerCase().includes('goal'))
  const itemId = entityId(world, entity => entity.category === 'item' && entity.id !== goalId)

  if (world.worldType === 'platformer') {
    const mechanics = [
      mechanic('player-move', 'movement', 'Player moves through the level.', 'supported', playerId),
      mechanic('player-jump', 'movement', 'Player jumps over terrain and hazards.', 'supported', playerId),
      mechanic('gravity', 'state-change', 'Gravity affects vertical player motion.', 'supported', playerId),
      mechanic('basic-collision', 'state-change', 'Ground collision keeps entities on the playable plane.', 'supported'),
      mechanic('enemy-stomp', 'combat', 'Player can defeat an enemy by a downward contact.', 'deferred', playerId, enemyId ? 'enemy' : undefined),
      mechanic('collect-reward', 'collection', 'Player collects a reward during traversal.', 'deferred', playerId, itemId ? 'item' : undefined),
      mechanic('reach-goal', 'goal', 'Player reaches the level goal.', 'deferred', playerId, goalId ? 'goal' : undefined),
      mechanic('player-death', 'failure', 'Player death ends or resets the attempt.', 'deferred', playerId),
    ]
    const interactions: GameplayInteractionSpecification[] = []
    if (enemyId) interactions.push(Object.freeze({
      id: 'player-enemy-contact',
      participants: Object.freeze([participant('subject', playerId), participant('target', enemyId)]),
      concept: 'enemy-contact',
      outcome: 'Damage or stomp resolution is intentionally deferred to a later rule system.',
      supportStatus: 'deferred',
    }))
    if (goalId) interactions.push(Object.freeze({
      id: 'player-goal-reach',
      participants: Object.freeze([participant('subject', playerId), participant('target', goalId)]),
      concept: 'reach-goal',
      outcome: 'Level completion is represented but not executed by Runtime yet.',
      supportStatus: 'deferred',
    }))
    const goals: GameplayGoalSpecification[] = goalId ? [Object.freeze({
      id: 'reach-level-goal',
      kind: 'reach-goal',
      description: 'Reach the level goal.',
      targetEntityId: goalId,
      optional: false,
      supportStatus: 'deferred',
    })] : []
    const failures: GameplayFailureConditionSpecification[] = [Object.freeze({
      id: 'player-death',
      kind: 'player-death',
      description: 'Player death causes the attempt to fail.',
      supportStatus: 'deferred',
    })]
    return Object.freeze({
      gameLoop: Object.freeze({
        objective: 'Traverse the level and reach the goal.',
        repeatableActions: Object.freeze(['move', 'jump', 'avoid or defeat enemies', 'collect rewards']),
        challengeSources: Object.freeze(['terrain', 'enemies', 'hazards']),
        rewardSources: Object.freeze(['collectibles', 'powerups', 'level progress']),
        progressionModes: Object.freeze(['none' as const]),
        completionMode: 'goal' as const,
        success: 'Reach the level goal.',
        failure: 'Player death.',
      }),
      playerMechanics: Object.freeze(['player-move', 'player-jump']),
      mechanics: Object.freeze(mechanics),
      interactions: Object.freeze(interactions),
      goals: Object.freeze(goals),
      failureConditions: Object.freeze(failures),
    })
  }

  if (world.worldType === 'survival') {
    const mechanics = Object.freeze([
      mechanic('player-move', 'movement', 'Player moves to avoid pressure.', 'supported', playerId),
      mechanic('enemy-spawn', 'spawn', 'Enemies appear over time.', 'deferred'),
      mechanic('enemy-chase', 'movement', 'Enemies pursue the player.', 'deferred', 'enemy', playerId),
      mechanic('auto-attack', 'combat', 'Player attacks threats automatically.', 'deferred', playerId, 'enemy'),
      mechanic('gain-experience', 'progression', 'Enemy defeat grants experience.', 'deferred', playerId),
      mechanic('level-up', 'progression', 'Experience thresholds offer a stronger player state.', 'deferred', playerId),
      mechanic('choose-skill', 'progression', 'The player chooses an upgrade.', 'deferred', playerId),
      mechanic('player-death', 'failure', 'Player death ends the run.', 'deferred', playerId),
    ])
    return Object.freeze({
      gameLoop: Object.freeze({
        objective: 'Survive enemy pressure and become stronger.',
        repeatableActions: Object.freeze(['move', 'avoid enemies', 'attack', 'collect experience', 'choose upgrades']),
        challengeSources: Object.freeze(['enemy density', 'enemy strength']),
        rewardSources: Object.freeze(['experience', 'skills', 'power growth']),
        progressionModes: Object.freeze(['experience', 'levels', 'upgrades'] as const),
        completionMode: 'endless' as const,
        success: 'Survive the run or its configured duration.',
        failure: 'Player death.',
      }),
      playerMechanics: Object.freeze(['player-move']),
      mechanics,
      progression: Object.freeze({
        modes: Object.freeze(['experience', 'levels', 'upgrades'] as const),
        description: 'Experience, levels, and upgrades are desired but not executed yet.',
        supportStatus: 'deferred',
      }),
      goals: Object.freeze([Object.freeze({
        id: 'survive-run',
        kind: 'survive-duration',
        description: 'Survive the configured run duration.',
        optional: false,
        supportStatus: 'deferred',
      })]),
      failureConditions: Object.freeze([Object.freeze({
        id: 'player-death',
        kind: 'player-death',
        description: 'Player death ends the run.',
        supportStatus: 'deferred',
      })]),
      spawnRules: Object.freeze([Object.freeze({
        id: 'periodic-enemy-spawn',
        kind: 'periodic',
        description: 'Spawn enemies periodically as pressure escalates.',
        entityCategory: 'enemy' as EntityCategory,
        entityName: 'Enemy',
        supportStatus: 'deferred',
      })]),
    })
  }

  if (world.worldType === 'farm') {
    return Object.freeze({
      gameLoop: Object.freeze({
        objective: 'Perform farm activities and interact with the world.',
        repeatableActions: Object.freeze(['move', 'interact', 'tend resources']),
        challengeSources: Object.freeze(['daily tasks', 'resource management']),
        rewardSources: Object.freeze(['harvests', 'completed tasks', 'world progress']),
        progressionModes: Object.freeze(['none' as const]),
        completionMode: 'open-ended' as const,
        success: 'Complete the requested farm activities.',
        failure: 'No failure condition is currently defined.',
      }),
      playerMechanics: Object.freeze(['player-move']),
      mechanics: Object.freeze([
        mechanic('player-move', 'movement', 'Player moves around the farm.', 'supported', playerId),
        mechanic('farm-interact', 'interaction', 'Player interacts with farm entities.', 'deferred', playerId, 'farm entity'),
        mechanic('tend-resource', 'interaction', 'Player tends or harvests a farm resource.', 'deferred', playerId, 'resource'),
      ]),
    })
  }

  return Object.freeze({
    gameLoop: Object.freeze({
      objective: 'Explore and interact with the current world.',
      repeatableActions: Object.freeze(['move', 'observe', 'interact']),
      challengeSources: Object.freeze([]),
      rewardSources: Object.freeze(['world progress']),
      progressionModes: Object.freeze(['none' as const]),
      completionMode: 'open-ended' as const,
      success: 'The player completes the requested interaction.',
      failure: 'No failure condition is currently defined.',
    }),
    playerMechanics: Object.freeze(['player-move']),
    mechanics: Object.freeze([
      mechanic('player-move', 'movement', 'Player moves through the world.', 'supported', playerId),
    ]),
  })
}

function buildMechanics(
  candidate: GameplaySpecificationCandidate['mechanics'],
  capabilities: GameplayCapabilityCatalog,
): readonly GameplayMechanicDefinition[] {
  return Object.freeze(candidate.map(item => Object.freeze({
    id: item.id,
    kind: item.kind,
    ...(item.subject ? { subject: item.subject } : {}),
    ...(item.target ? { target: item.target } : {}),
    description: item.description,
    enabled: item.enabled ?? true,
    ...(item.parameters ? { parameters: freezeParameters(item.parameters) } : {}),
    supportStatus: statusFor(item.id, item.supportStatus, capabilities),
  })))
}

export class DefaultGameplaySpecificationBuilder implements GameplaySpecificationBuilder {
  constructor(private readonly capabilities: GameplayCapabilityCatalog = DEFAULT_GAMEPLAY_CAPABILITY_CATALOG) {}

  build(input: GameplaySpecificationBuilderInput): GameplaySpecification {
    const candidate = input.candidate ?? defaultsFor(input.semanticWorld)
    const capabilities = input.capabilities ?? this.capabilities
    const metadata = Object.freeze({
      source: input.metadata?.source ?? 'deterministic',
      ...(input.metadata?.assumptions ? { assumptions: Object.freeze([...input.metadata.assumptions]) } : {}),
      ...(input.metadata?.warnings ? { warnings: Object.freeze([...input.metadata.warnings]) } : {}),
      ...(input.metadata?.architectureVersion ? { architectureVersion: input.metadata.architectureVersion } : {}),
    })
    const mechanics = buildMechanics(candidate.mechanics, capabilities)
    const interactions = candidate.interactions?.map(item => Object.freeze({
      id: item.id,
      participants: Object.freeze(item.participants.map(participant => Object.freeze({ ...participant }))),
      concept: item.concept,
      outcome: item.outcome,
      supportStatus: 'deferred' as const,
    }))
    const progression: GameplayProgressionSpecification | undefined = candidate.progression
      ? Object.freeze({
          modes: Object.freeze([...candidate.progression.modes]),
          description: candidate.progression.description,
          supportStatus: 'deferred' as const,
        })
      : undefined
    const goals: readonly GameplayGoalSpecification[] | undefined = candidate.goals?.map(item => Object.freeze({
      id: item.id,
      kind: item.kind,
      description: item.description,
      ...(item.targetEntityId ? { targetEntityId: item.targetEntityId } : {}),
      ...(item.targetCount !== undefined ? { targetCount: item.targetCount } : {}),
      optional: item.optional ?? false,
      supportStatus: 'deferred' as const,
    }))
    const failureConditions: readonly GameplayFailureConditionSpecification[] | undefined = candidate.failureConditions?.map(item => Object.freeze({
      id: item.id,
      kind: item.kind,
      description: item.description,
      ...(item.targetEntityId ? { targetEntityId: item.targetEntityId } : {}),
      supportStatus: 'deferred' as const,
    }))
    const spawnRules: readonly GameplaySpawnRuleSpecification[] | undefined = candidate.spawnRules?.map(item => Object.freeze({
      id: item.id,
      kind: item.kind,
      description: item.description,
      ...(item.entityCategory ? { entityCategory: item.entityCategory } : {}),
      ...(item.entityName ? { entityName: item.entityName } : {}),
      ...(item.intervalSeconds !== undefined ? { intervalSeconds: item.intervalSeconds } : {}),
      supportStatus: 'deferred' as const,
    }))
    return Object.freeze({
      schemaVersion: 1 as const,
      gameplayRevision: Math.max(0, Math.trunc(input.gameplayRevision ?? 1)),
      gameLoop: Object.freeze({ ...candidate.gameLoop, ...{
        repeatableActions: Object.freeze([...candidate.gameLoop.repeatableActions]),
        challengeSources: Object.freeze([...candidate.gameLoop.challengeSources]),
        rewardSources: Object.freeze([...candidate.gameLoop.rewardSources]),
        progressionModes: Object.freeze([...candidate.gameLoop.progressionModes]),
      } }),
      playerMechanics: Object.freeze([...candidate.playerMechanics]),
      mechanics,
      ...(interactions ? { interactions: Object.freeze(interactions) } : {}),
      ...(progression ? { progression } : {}),
      ...(goals ? { goals: Object.freeze(goals) } : {}),
      ...(failureConditions ? { failureConditions: Object.freeze(failureConditions) } : {}),
      ...(spawnRules ? { spawnRules: Object.freeze(spawnRules) } : {}),
      metadata,
    })
  }
}

export { defaultsFor as buildDefaultGameplaySpecificationCandidate }
