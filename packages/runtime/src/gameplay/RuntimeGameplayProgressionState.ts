/**
 * Runtime-owned numeric progression truth for one world/session.
 *
 * This is intentionally a small keyed numeric state, not a progression
 * manager. Thresholds, level transitions, and upgrade selection remain
 * separate capabilities.
 */

export interface RuntimeGameplayProgressionState {
  readonly values: Readonly<Record<string, number>>
}

export interface RuntimeGameplayProgressionBinding {
  readonly worldId?: string
  readonly sessionId?: string
}

export interface RuntimeGameplayNumericChangeResult {
  readonly state: RuntimeGameplayProgressionState
  readonly key: string
  readonly previousValue: number
  readonly value: number
  readonly amount: number
}

export function createRuntimeGameplayProgressionState(): RuntimeGameplayProgressionState {
  return Object.freeze({
    values: Object.freeze({
      experience: 0,
      level: 1,
    }),
  })
}

export function applyRuntimeGameplayNumericChange(
  state: RuntimeGameplayProgressionState,
  key: string,
  amount: number,
): RuntimeGameplayNumericChangeResult | undefined {
  const normalizedKey = key.trim()
  if (!normalizedKey || !Number.isFinite(amount)) return undefined

  const previousValue = state.values[normalizedKey] ?? 0
  if (!Number.isFinite(previousValue)) return undefined

  const value = previousValue + amount
  if (!Number.isFinite(value)) return undefined

  return Object.freeze({
    state: Object.freeze({
      values: Object.freeze({
        ...state.values,
        [normalizedKey]: value,
      }),
    }),
    key: normalizedKey,
    previousValue,
    value,
    amount,
  })
}

function bindingKey(binding: RuntimeGameplayProgressionBinding): string {
  return `${binding.worldId ?? 'runtime'}\u0000${binding.sessionId ?? 'session'}`
}

export class DefaultRuntimeGameplayProgressionStateStore {
  private currentBindingKey: string | undefined
  private state: RuntimeGameplayProgressionState = createRuntimeGameplayProgressionState()

  bind(binding: RuntimeGameplayProgressionBinding): RuntimeGameplayProgressionState {
    const nextBindingKey = bindingKey(binding)
    if (nextBindingKey !== this.currentBindingKey) {
      this.currentBindingKey = nextBindingKey
      this.state = createRuntimeGameplayProgressionState()
    }
    return this.state
  }

  getState(): RuntimeGameplayProgressionState {
    return this.state
  }

  commit(state: RuntimeGameplayProgressionState): void {
    this.state = Object.freeze({
      values: Object.freeze({ ...state.values }),
    })
  }
}
