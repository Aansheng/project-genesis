import type { InputKey, InputProvider, InputState } from '@genesis/runtime'
import { DefaultInputState } from '@genesis/runtime'

/** Returns whether keyboard input originated from a text or UI control. */
export function isEditableKeyboardTarget(target: EventTarget | null): boolean {
  if (!target || typeof target !== 'object') return false

  const element = target as Element
  const tagName = typeof element.tagName === 'string'
    ? element.tagName.toLowerCase()
    : ''

  if (tagName === 'input' || tagName === 'textarea' || tagName === 'select' || tagName === 'button') {
    return true
  }

  if (typeof Element !== 'undefined' && element instanceof Element) {
    if ((element as HTMLElement).isContentEditable) return true
    const contentEditable = element.getAttribute('contenteditable')
    if (contentEditable !== null && contentEditable !== 'false') return true
    return element.closest('input, textarea, select, button, [contenteditable]:not([contenteditable="false"])') !== null
  }

  return false
}

/**
 * KeyboardInputProvider — DOM event-driven implementation of InputProvider.
 *
 * WO-S9-008 — Keyboard Input Foundation
 * Architecture version v1.82
 *
 * Listens to `keydown` and `keyup` events on a given target (default: window).
 * Pressed keys are tracked in an internal set. Each call to `getState()`
 * returns a new immutable snapshot (DefaultInputState) of the current
 * pressed keys.
 *
 * Behavioral guarantees:
 * - Duplicate keydown events are idempotent (set-based tracking)
 * - Keyup removes the key from the pressed set
 * - The provider exposes lifecycle methods: attach() / detach()
 * - Snapshots are immutable and isolated from live tracking state
 */
export class KeyboardInputProvider implements InputProvider {
  private readonly _pressed: Set<InputKey> = new Set()
  private readonly _target: EventTarget
  private _attached = false

  // Bound listener references (for removal)
  private readonly _handleKeyDown: (event: Event) => void
  private readonly _handleKeyUp: (event: Event) => void
  private readonly _handleFocusIn: (event: Event) => void

  constructor(target: EventTarget = window) {
    this._target = target
    this._handleKeyDown = this._onKeyDown.bind(this)
    this._handleKeyUp = this._onKeyUp.bind(this)
    this._handleFocusIn = this._onFocusIn.bind(this)
  }

  // -------------------------------------------------------------------------
  // Lifecycle
  // -------------------------------------------------------------------------

  /** Start listening to keyboard events on the target. */
  attach(): void {
    if (this._attached) return
    this._target.addEventListener('keydown', this._handleKeyDown)
    this._target.addEventListener('keyup', this._handleKeyUp)
    this._target.addEventListener('focusin', this._handleFocusIn)
    this._attached = true
  }

  /** Stop listening and clear the tracked state. */
  detach(): void {
    if (!this._attached) return
    this._target.removeEventListener('keydown', this._handleKeyDown)
    this._target.removeEventListener('keyup', this._handleKeyUp)
    this._target.removeEventListener('focusin', this._handleFocusIn)
    this._pressed.clear()
    this._attached = false
  }

  /** Returns true if the provider is currently attached to its target. */
  isAttached(): boolean {
    return this._attached
  }

  // -------------------------------------------------------------------------
  // InputProvider
  // -------------------------------------------------------------------------

  /** Returns an immutable snapshot of the current keyboard state. */
  getState(): InputState {
    return new DefaultInputState(this._pressed)
  }

  // -------------------------------------------------------------------------
  // Internal
  // -------------------------------------------------------------------------

  private _canonicalize(key: string): InputKey | null {
    if (key === ' ') return 'Space'
    const validKeys: ReadonlySet<string> = new Set([
      'ArrowUp',
      'ArrowDown',
      'ArrowLeft',
      'ArrowRight',
      'Space',
      'Enter',
    ])
    return validKeys.has(key) ? (key as InputKey) : null
  }

  private _onKeyDown(event: Event): void {
    if (isEditableKeyboardTarget(event.target)) {
      this._pressed.clear()
      return
    }

    const ke = event as KeyboardEvent
    const canonical = this._canonicalize(ke.key)
    if (canonical) {
      this._pressed.add(canonical)
    }
  }

  private _onKeyUp(event: Event): void {
    if (isEditableKeyboardTarget(event.target)) {
      this._pressed.clear()
      return
    }

    const ke = event as KeyboardEvent
    const canonical = this._canonicalize(ke.key)
    if (canonical) {
      this._pressed.delete(canonical)
    }
  }

  private _onFocusIn(event: Event): void {
    if (isEditableKeyboardTarget(event.target)) this._pressed.clear()
  }
}
