import type { InputKey } from './InputKey'
import type { InputState } from './InputState'

/**
 * DefaultInputState — an immutable snapshot of keyboard state.
 *
 * WO-S9-008 — Keyboard Input Foundation
 * Architecture version v1.82
 *
 * The set of pressed keys is captured at construction time.
 * `isPressed()` returns true only for keys that were pressed
 * when this snapshot was created.
 *
 * All outputs are deeply frozen. Once constructed, the state
 * cannot change.
 */
export class DefaultInputState implements InputState {
  private readonly _pressed: ReadonlySet<InputKey>

  constructor(pressed: ReadonlySet<InputKey> = new Set()) {
    this._pressed = new Set(pressed)
    Object.freeze(this)
  }

  isPressed(key: InputKey): boolean {
    return this._pressed.has(key)
  }
}