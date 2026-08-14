import type { InputState } from './InputState'

/**
 * InputProvider — an abstraction over any source of input state.
 *
 * WO-S9-008 — Keyboard Input Foundation
 * Architecture version v1.82
 *
 * The provider is responsible for tracking input events and
 * producing an InputState snapshot on demand. The concrete
 * source (DOM events, gamepad, simulated input) is determined
 * by the implementation.
 */
export interface InputProvider {
  /** Returns a snapshot of the current input state. */
  getState(): InputState
}