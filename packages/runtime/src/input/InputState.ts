import type { InputKey } from './InputKey'

/**
 * InputState — a read-only query interface for keyboard state.
 *
 * WO-S9-008 — Keyboard Input Foundation
 * Architecture version v1.82
 *
 * Callers can query whether a specific InputKey is currently pressed.
 * Implementations should provide an immutable snapshot of the
 * keyboard state at the time of query.
 */
export interface InputState {
  /** Returns true if the given key is currently pressed. */
  isPressed(key: InputKey): boolean
}