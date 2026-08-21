import type {
  GameLoopSpecification,
  GameplayFailureConditionKind,
  GameplayGoalKind,
  GameplayMechanicKind,
  GameplayMechanicParameters,
  GameplayParticipantReference,
  GameplayProgressionMode,
  GameplaySpawnRuleKind,
  GameplaySupportStatus,
} from '@genesis/shared'

export interface GameplayMechanicCandidate {
  readonly id: string
  readonly kind: GameplayMechanicKind
  readonly subject?: string
  readonly target?: string
  readonly description: string
  readonly enabled?: boolean
  readonly parameters?: GameplayMechanicParameters
  readonly supportStatus?: GameplaySupportStatus
}

export interface GameplayInteractionCandidate {
  readonly id: string
  readonly participants: readonly GameplayParticipantReference[]
  readonly concept: string
  readonly outcome: string
  readonly supportStatus?: GameplaySupportStatus
}

export interface GameplayGoalCandidate {
  readonly id: string
  readonly kind: GameplayGoalKind
  readonly description: string
  readonly targetEntityId?: string
  readonly targetCount?: number
  readonly optional?: boolean
  readonly supportStatus?: GameplaySupportStatus
}

export interface GameplayFailureConditionCandidate {
  readonly id: string
  readonly kind: GameplayFailureConditionKind
  readonly description: string
  readonly targetEntityId?: string
  readonly supportStatus?: GameplaySupportStatus
}

export interface GameplayProgressionCandidate {
  readonly modes: readonly GameplayProgressionMode[]
  readonly description: string
  readonly supportStatus?: GameplaySupportStatus
}

export interface GameplaySpawnRuleCandidate {
  readonly id: string
  readonly kind: GameplaySpawnRuleKind
  readonly description: string
  readonly entityCategory?: GameplayParticipantReference['entityCategory']
  readonly entityName?: string
  readonly intervalSeconds?: number
  readonly supportStatus?: GameplaySupportStatus
}

export interface GameplaySpecificationCandidate {
  readonly gameLoop: GameLoopSpecification
  readonly playerMechanics: readonly string[]
  readonly mechanics: readonly GameplayMechanicCandidate[]
  readonly interactions?: readonly GameplayInteractionCandidate[]
  readonly progression?: GameplayProgressionCandidate
  readonly goals?: readonly GameplayGoalCandidate[]
  readonly failureConditions?: readonly GameplayFailureConditionCandidate[]
  readonly spawnRules?: readonly GameplaySpawnRuleCandidate[]
}
