import type {
  GameplayAction,
  GameplayRuleConditionMode,
  GameplayCondition,
  GameplayRuleMetadata,
  GameplaySupportStatus,
  GameplayTrigger,
} from '@genesis/shared'

/** Untrusted provider-facing rule proposal. Genesis normalizes every field. */
export interface GameplayRuleCandidate {
  readonly ruleId?: string
  readonly id?: string
  readonly name?: string
  readonly label?: string
  readonly enabled?: boolean
  readonly sourceMechanicId?: string
  readonly trigger: GameplayTrigger
  readonly conditionMode?: GameplayRuleConditionMode
  readonly conditions: readonly GameplayCondition[]
  readonly actions: readonly GameplayAction[]
  readonly priority?: number
  /** Accepted only as a claim; Genesis derives the final value. */
  readonly supportStatus?: GameplaySupportStatus
  readonly metadata?: GameplayRuleMetadata
}
