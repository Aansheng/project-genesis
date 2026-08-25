/**
 * Runtime-owned completion truth for one world/session.
 *
 * This is deliberately narrower than a general gameplay state framework:
 * goal entities can trigger completion, but only this session state says
 * whether the current Runtime session is complete.
 */

export type RuntimeGameplaySessionStatus = 'active' | 'failed' | 'completed'

export interface RuntimeGameplaySessionState {
  readonly status: RuntimeGameplaySessionStatus
  readonly completedByGoalId?: string
  readonly completedAtTick?: number
  readonly failedByEntityId?: string
  readonly failedAtTick?: number
}

export interface RuntimeGameplaySessionBinding {
  readonly worldId?: string
  readonly sessionId?: string
}

export type RuntimeGameplaySessionCompletionOutcome = 'completed' | 'already_completed' | 'already_failed'

export interface RuntimeGameplaySessionCompletionResult {
  readonly outcome: RuntimeGameplaySessionCompletionOutcome
  readonly state: RuntimeGameplaySessionState
}

export type RuntimeGameplaySessionFailureOutcome = 'failed' | 'already_failed' | 'already_completed'

export interface RuntimeGameplaySessionFailureResult {
  readonly outcome: RuntimeGameplaySessionFailureOutcome
  readonly state: RuntimeGameplaySessionState
}

export type RuntimeGameplaySessionRespawnOutcome = 'respawned' | 'not_failed'

export interface RuntimeGameplaySessionRespawnResult {
  readonly outcome: RuntimeGameplaySessionRespawnOutcome
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
  if (state.status === 'failed') {
    return Object.freeze({ outcome: 'already_failed' as const, state })
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

/**
 * Commit the Runtime-owned failure truth for lethal damage to the player.
 * Completed sessions are terminal; a failed session is idempotent until the
 * explicit same-world respawn operation is requested.
 */
export function failRuntimeGameplaySession(
  state: RuntimeGameplaySessionState,
  options: { readonly entityId?: string; readonly tick?: number } = {},
): RuntimeGameplaySessionFailureResult {
  if (state.status === 'completed') {
    return Object.freeze({ outcome: 'already_completed' as const, state })
  }
  if (state.status === 'failed') {
    return Object.freeze({ outcome: 'already_failed' as const, state })
  }

  return Object.freeze({
    outcome: 'failed' as const,
    state: Object.freeze({
      status: 'failed' as const,
      ...(options.entityId ? { failedByEntityId: options.entityId } : {}),
      ...(options.tick !== undefined && Number.isFinite(options.tick) ? { failedAtTick: options.tick } : {}),
    }),
  })
}

/**
 * Resume only a failed session. World/entity continuity and numeric
 * progression remain untouched; the Runtime respawn boundary restores the
 * player's current Health and safe velocity separately.
 */
export function respawnRuntimeGameplaySession(
  state: RuntimeGameplaySessionState,
): RuntimeGameplaySessionRespawnResult {
  if (state.status !== 'failed') {
    return Object.freeze({ outcome: 'not_failed' as const, state })
  }
  return Object.freeze({
    outcome: 'respawned' as const,
    state: createRuntimeGameplaySessionState(),
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

  respawn(): RuntimeGameplaySessionRespawnResult {
    const result = respawnRuntimeGameplaySession(this.state)
    if (result.outcome === 'respawned') this.commit(result.state)
    return result
  }
}
