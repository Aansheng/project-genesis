/**
 * Runtime-owned completion truth for one world/session.
 *
 * This is deliberately narrower than a general gameplay state framework:
 * goal entities can trigger completion, but only this session state says
 * whether the current Runtime session is complete.
 */

export type RuntimeGameplaySessionStatus = 'active' | 'completed'

export interface RuntimeGameplaySessionState {
  readonly status: RuntimeGameplaySessionStatus
  readonly completedByGoalId?: string
  readonly completedAtTick?: number
}

export interface RuntimeGameplaySessionBinding {
  readonly worldId?: string
  readonly sessionId?: string
}

export type RuntimeGameplaySessionCompletionOutcome = 'completed' | 'already_completed'

export interface RuntimeGameplaySessionCompletionResult {
  readonly outcome: RuntimeGameplaySessionCompletionOutcome
  readonly state: RuntimeGameplaySessionState
}

export function createRuntimeGameplaySessionState(): RuntimeGameplaySessionState {
  return Object.freeze({ status: 'active' as const })
}

export function completeRuntimeGameplaySession(
  state: RuntimeGameplaySessionState,
  options: { readonly goalId?: string; readonly tick?: number } = {},
): RuntimeGameplaySessionCompletionResult {
  if (state.status === 'completed') {
    return Object.freeze({ outcome: 'already_completed' as const, state })
  }

  return Object.freeze({
    outcome: 'completed' as const,
    state: Object.freeze({
      status: 'completed' as const,
      ...(options.goalId ? { completedByGoalId: options.goalId } : {}),
      ...(options.tick !== undefined && Number.isFinite(options.tick) ? { completedAtTick: options.tick } : {}),
    }),
  })
}

function bindingKey(binding: RuntimeGameplaySessionBinding): string {
  return `${binding.worldId ?? 'runtime'}\u0000${binding.sessionId ?? 'session'}`
}

/**
 * Holds exactly one current world/session state and rebinds it on replacement.
 * Semantic revisions and non-replacing World Evolution do not change the key.
 */
export class DefaultRuntimeGameplaySessionStateStore {
  private currentBindingKey: string | undefined
  private state: RuntimeGameplaySessionState = createRuntimeGameplaySessionState()

  bind(binding: RuntimeGameplaySessionBinding): RuntimeGameplaySessionState {
    const nextBindingKey = bindingKey(binding)
    if (nextBindingKey !== this.currentBindingKey) {
      this.currentBindingKey = nextBindingKey
      this.state = createRuntimeGameplaySessionState()
    }
    return this.state
  }

  getState(): RuntimeGameplaySessionState {
    return this.state
  }

  commit(state: RuntimeGameplaySessionState): void {
    this.state = Object.freeze({ ...state })
  }
}
