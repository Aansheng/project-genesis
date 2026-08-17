/**
 * KeyboardInputProvider — verifies DOM event-driven keyboard input.
 *
 * WO-S9-008 — Keyboard Input Foundation
 * Architecture version v1.82
 *
 * Coverage:
 * - keydown
 * - keyup
 * - multiple keys
 * - duplicate keydown
 * - cleanup (detach)
 * - snapshot generation
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { KeyboardInputProvider } from '../KeyboardInputProvider'

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

/** Dispatch a keydown event on the given target. */
function fireKeyDown(target: EventTarget, key: string): void {
  target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }))
}

/** Dispatch a keyup event on the given target. */
function fireKeyUp(target: EventTarget, key: string): void {
  target.dispatchEvent(new KeyboardEvent('keyup', { key, bubbles: true }))
}

// ---------------------------------------------------------------------------

describe('KeyboardInputProvider', () => {
  let provider: KeyboardInputProvider
  let target: EventTarget

  beforeEach(() => {
    target = new EventTarget()
    provider = new KeyboardInputProvider(target)
    provider.attach()
  })

  afterEach(() => {
    provider.detach()
  })

  // -------------------------------------------------------------------------
  // Section 1 — keydown
  // -------------------------------------------------------------------------

  describe('keydown', () => {
    it('tracks a pressed key', () => {
      fireKeyDown(target, 'ArrowRight')
      const state = provider.getState()
      expect(state.isPressed('ArrowRight')).toBe(true)
    })

    it('tracks ArrowUp on keydown', () => {
      fireKeyDown(target, 'ArrowUp')
      expect(provider.getState().isPressed('ArrowUp')).toBe(true)
    })

    it('tracks ArrowDown on keydown', () => {
      fireKeyDown(target, 'ArrowDown')
      expect(provider.getState().isPressed('ArrowDown')).toBe(true)
    })

    it('tracks ArrowLeft on keydown', () => {
      fireKeyDown(target, 'ArrowLeft')
      expect(provider.getState().isPressed('ArrowLeft')).toBe(true)
    })

    it('tracks Space on keydown with space character', () => {
      fireKeyDown(target, ' ')
      expect(provider.getState().isPressed('Space')).toBe(true)
    })

    it('tracks Space on keydown with "Space" string', () => {
      fireKeyDown(target, 'Space')
      expect(provider.getState().isPressed('Space')).toBe(true)
    })

    it('ignores non-tracked keys', () => {
      fireKeyDown(target, 'Enter')
      fireKeyDown(target, 'Escape')
      fireKeyDown(target, 'a')
      const state = provider.getState()
      expect(state.isPressed('ArrowUp')).toBe(false)
      expect(state.isPressed('ArrowDown')).toBe(false)
      expect(state.isPressed('ArrowLeft')).toBe(false)
      expect(state.isPressed('ArrowRight')).toBe(false)
      expect(state.isPressed('Space')).toBe(false)
    })

    it.each(['input', 'textarea', 'select', 'button'])('ignores %s keyboard events', (tagName) => {
      const element = document.createElement(tagName)
      document.body.appendChild(element)
      element.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
      element.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }))
      expect(provider.getState().isPressed('ArrowRight')).toBe(false)
      expect(provider.getState().isPressed('Space')).toBe(false)
      element.remove()
    })

    it('ignores contenteditable keyboard events', () => {
      const element = document.createElement('div')
      element.contentEditable = 'true'
      document.body.appendChild(element)
      element.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }))
      expect(provider.getState().isPressed('ArrowLeft')).toBe(false)
      element.remove()
    })

    it('clears keys when editable focus begins', () => {
      const focusProvider = new KeyboardInputProvider(document)
      focusProvider.attach()
      fireKeyDown(document, 'ArrowRight')
      const input = document.createElement('input')
      document.body.appendChild(input)
      input.dispatchEvent(new FocusEvent('focusin', { bubbles: true }))
      expect(focusProvider.getState().isPressed('ArrowRight')).toBe(false)
      focusProvider.detach()
      input.remove()
    })

    it('resumes gameplay tracking after editable focus blurs', () => {
      const input = document.createElement('input')
      document.body.appendChild(input)
      input.dispatchEvent(new FocusEvent('focusin', { bubbles: true }))
      input.dispatchEvent(new FocusEvent('focusout', { bubbles: true }))
      fireKeyDown(target, 'ArrowRight')
      expect(provider.getState().isPressed('ArrowRight')).toBe(true)
      input.remove()
    })
  })

  // -------------------------------------------------------------------------
  // Section 2 — keyup
  // -------------------------------------------------------------------------

  describe('keyup', () => {
    it('releases a previously pressed key', () => {
      fireKeyDown(target, 'ArrowRight')
      expect(provider.getState().isPressed('ArrowRight')).toBe(true)

      fireKeyUp(target, 'ArrowRight')
      expect(provider.getState().isPressed('ArrowRight')).toBe(false)
    })

    it('releases ArrowUp on keyup', () => {
      fireKeyDown(target, 'ArrowUp')
      expect(provider.getState().isPressed('ArrowUp')).toBe(true)

      fireKeyUp(target, 'ArrowUp')
      expect(provider.getState().isPressed('ArrowUp')).toBe(false)
    })

    it('releases Space on keyup', () => {
      fireKeyDown(target, ' ')
      expect(provider.getState().isPressed('Space')).toBe(true)

      fireKeyUp(target, ' ')
      expect(provider.getState().isPressed('Space')).toBe(false)
    })

    it('keyup on non-pressed key is a no-op', () => {
      fireKeyUp(target, 'ArrowRight')
      // Should not throw and state remains unchanged
      expect(provider.getState().isPressed('ArrowRight')).toBe(false)
    })
  })

  // -------------------------------------------------------------------------
  // Section 3 — Multiple keys
  // -------------------------------------------------------------------------

  describe('multiple keys', () => {
    it('tracks multiple independently pressed keys', () => {
      fireKeyDown(target, 'ArrowUp')
      fireKeyDown(target, 'ArrowRight')
      fireKeyDown(target, 'Space')

      const state = provider.getState()
      expect(state.isPressed('ArrowUp')).toBe(true)
      expect(state.isPressed('ArrowRight')).toBe(true)
      expect(state.isPressed('Space')).toBe(true)
      expect(state.isPressed('ArrowDown')).toBe(false)
      expect(state.isPressed('ArrowLeft')).toBe(false)
    })

    it('releasing one key does not affect other pressed keys', () => {
      fireKeyDown(target, 'ArrowUp')
      fireKeyDown(target, 'ArrowLeft')
      fireKeyDown(target, 'ArrowRight')

      fireKeyUp(target, 'ArrowLeft')

      const state = provider.getState()
      expect(state.isPressed('ArrowUp')).toBe(true)
      expect(state.isPressed('ArrowRight')).toBe(true)
      expect(state.isPressed('ArrowLeft')).toBe(false)
    })

    it('releasing all keys returns empty state', () => {
      fireKeyDown(target, 'ArrowUp')
      fireKeyDown(target, 'ArrowDown')
      fireKeyDown(target, 'ArrowLeft')
      fireKeyDown(target, 'ArrowRight')
      fireKeyDown(target, 'Space')

      fireKeyUp(target, 'ArrowUp')
      fireKeyUp(target, 'ArrowDown')
      fireKeyUp(target, 'ArrowLeft')
      fireKeyUp(target, 'ArrowRight')
      fireKeyUp(target, 'Space')

      const state = provider.getState()
      expect(state.isPressed('ArrowUp')).toBe(false)
      expect(state.isPressed('ArrowDown')).toBe(false)
      expect(state.isPressed('ArrowLeft')).toBe(false)
      expect(state.isPressed('ArrowRight')).toBe(false)
      expect(state.isPressed('Space')).toBe(false)
    })
  })

  // -------------------------------------------------------------------------
  // Section 4 — Duplicate keydown
  // -------------------------------------------------------------------------

  describe('duplicate keydown', () => {
    it('duplicate keydown does not change tracked state', () => {
      fireKeyDown(target, 'ArrowRight')
      fireKeyDown(target, 'ArrowRight')
      fireKeyDown(target, 'ArrowRight')

      const state = provider.getState()
      expect(state.isPressed('ArrowRight')).toBe(true)
    })

    it('duplicate keydown on multiple keys is idempotent', () => {
      fireKeyDown(target, 'ArrowUp')
      fireKeyDown(target, 'ArrowUp')
      fireKeyDown(target, 'ArrowDown')
      fireKeyDown(target, 'ArrowDown')

      const state = provider.getState()
      expect(state.isPressed('ArrowUp')).toBe(true)
      expect(state.isPressed('ArrowDown')).toBe(true)
    })
  })

  // -------------------------------------------------------------------------
  // Section 5 — Cleanup (detach)
  // -------------------------------------------------------------------------

  describe('cleanup', () => {
    it('detach removes all event listeners', () => {
      provider.detach()

      // Events should not be tracked after detach
      fireKeyDown(target, 'ArrowRight')
      const state = provider.getState()
      expect(state.isPressed('ArrowRight')).toBe(false)
    })

    it('detach clears pressed state', () => {
      fireKeyDown(target, 'ArrowRight')
      expect(provider.getState().isPressed('ArrowRight')).toBe(true)

      provider.detach()
      expect(provider.getState().isPressed('ArrowRight')).toBe(false)
    })

    it('multiple detach calls are safe', () => {
      provider.detach()
      provider.detach()
      provider.detach()
      // Should not throw
      expect(provider.isAttached()).toBe(false)
    })

    it('re-attach after detach resumes tracking', () => {
      fireKeyDown(target, 'ArrowUp')
      provider.detach()
      provider.attach()

      fireKeyDown(target, 'ArrowRight')
      const state = provider.getState()
      expect(state.isPressed('ArrowUp')).toBe(false) // cleared after detach
      expect(state.isPressed('ArrowRight')).toBe(true) // tracked after re-attach
    })
  })

  // -------------------------------------------------------------------------
  // Section 6 — Snapshot generation
  // -------------------------------------------------------------------------

  describe('snapshot generation', () => {
    it('getState returns a snapshot that is isolated from live state', () => {
      fireKeyDown(target, 'ArrowRight')
      const snapshot1 = provider.getState()
      expect(snapshot1.isPressed('ArrowRight')).toBe(true)

      // Release the key after snapshot
      fireKeyUp(target, 'ArrowRight')

      // Snapshot1 should still report pressed
      expect(snapshot1.isPressed('ArrowRight')).toBe(true)

      // New snapshot should reflect current state
      const snapshot2 = provider.getState()
      expect(snapshot2.isPressed('ArrowRight')).toBe(false)
    })

    it('consecutive snapshots are independent', () => {
      fireKeyDown(target, 'ArrowUp')
      const snap1 = provider.getState()
      const snap2 = provider.getState()
      const snap3 = provider.getState()

      expect(snap1.isPressed('ArrowUp')).toBe(true)
      expect(snap2.isPressed('ArrowUp')).toBe(true)
      expect(snap3.isPressed('ArrowUp')).toBe(true)
    })
  })

  // -------------------------------------------------------------------------
  // Section 7 — Lifecycle
  // -------------------------------------------------------------------------

  describe('lifecycle', () => {
    it('isAttached returns true after construction (attach was not called)', () => {
      const p = new KeyboardInputProvider(target)
      expect(p.isAttached()).toBe(false)
    })

    it('isAttached returns false before attach()', () => {
      const p = new KeyboardInputProvider(target)
      expect(p.isAttached()).toBe(false)
    })

    it('isAttached returns true after attach()', () => {
      const p = new KeyboardInputProvider(target)
      p.attach()
      expect(p.isAttached()).toBe(true)
    })

    it('isAttached returns false after detach()', () => {
      provider.detach()
      expect(provider.isAttached()).toBe(false)
    })

    it('multiple attach calls are idempotent', () => {
      provider.attach()
      provider.attach()
      provider.attach()
      expect(provider.isAttached()).toBe(true)
    })
  })
})
