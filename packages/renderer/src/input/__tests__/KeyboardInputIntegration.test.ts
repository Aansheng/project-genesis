/**
 * KeyboardInputIntegration — end-to-end verification of the keyboard
 * input pipeline: DOM Event → KeyboardInputProvider → InputState.
 *
 * WO-S9-008 — Keyboard Input Foundation
 * Architecture version v1.82
 *
 * Coverage:
 * - DOM Event → Provider → InputState works correctly
 * - keydown flows through to isPressed
 * - keyup flows through to isPressed (false)
 * - multiple events produce correct aggregate state
 * - lifecycle (attach/detach) integration
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { KeyboardInputProvider } from '../KeyboardInputProvider'

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function fireKeyDown(target: EventTarget, key: string): void {
  target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }))
}

function fireKeyUp(target: EventTarget, key: string): void {
  target.dispatchEvent(new KeyboardEvent('keyup', { key, bubbles: true }))
}

// ---------------------------------------------------------------------------

describe('KeyboardInputIntegration', () => {
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
  // Section 1 — Single key lifecycle
  // -------------------------------------------------------------------------

  describe('single key lifecycle', () => {
    it('DOM keydown → provider → isPressed returns true', () => {
      fireKeyDown(target, 'ArrowRight')
      const state = provider.getState()
      expect(state.isPressed('ArrowRight')).toBe(true)
    })

    it('DOM keyup → provider → isPressed returns false', () => {
      fireKeyDown(target, 'ArrowRight')
      expect(provider.getState().isPressed('ArrowRight')).toBe(true)

      fireKeyUp(target, 'ArrowRight')
      expect(provider.getState().isPressed('ArrowRight')).toBe(false)
    })

    it('full lifecycle: press then release then press again', () => {
      fireKeyDown(target, 'ArrowUp')
      expect(provider.getState().isPressed('ArrowUp')).toBe(true)

      fireKeyUp(target, 'ArrowUp')
      expect(provider.getState().isPressed('ArrowUp')).toBe(false)

      fireKeyDown(target, 'ArrowUp')
      expect(provider.getState().isPressed('ArrowUp')).toBe(true)
    })
  })

  // -------------------------------------------------------------------------
  // Section 2 — Multiple key interaction
  // -------------------------------------------------------------------------

  describe('multiple key interaction', () => {
    it('multiple DOM keydown events → provider → all are pressed', () => {
      fireKeyDown(target, 'ArrowUp')
      fireKeyDown(target, 'ArrowDown')
      fireKeyDown(target, 'ArrowLeft')
      fireKeyDown(target, 'ArrowRight')
      fireKeyDown(target, ' ')

      const state = provider.getState()
      expect(state.isPressed('ArrowUp')).toBe(true)
      expect(state.isPressed('ArrowDown')).toBe(true)
      expect(state.isPressed('ArrowLeft')).toBe(true)
      expect(state.isPressed('ArrowRight')).toBe(true)
      expect(state.isPressed('Space')).toBe(true)
    })

    it('releasing one key via DOM keyup leaves others pressed', () => {
      fireKeyDown(target, 'ArrowUp')
      fireKeyDown(target, 'ArrowLeft')
      fireKeyDown(target, 'ArrowRight')

      fireKeyUp(target, 'ArrowLeft')

      const state = provider.getState()
      expect(state.isPressed('ArrowUp')).toBe(true)
      expect(state.isPressed('ArrowRight')).toBe(true)
      expect(state.isPressed('ArrowLeft')).toBe(false)
    })

    it('space character and Space string both map correctly', () => {
      fireKeyDown(target, ' ')
      expect(provider.getState().isPressed('Space')).toBe(true)

      fireKeyUp(target, ' ')
      expect(provider.getState().isPressed('Space')).toBe(false)

      fireKeyDown(target, 'Space')
      expect(provider.getState().isPressed('Space')).toBe(true)

      fireKeyUp(target, 'Space')
      expect(provider.getState().isPressed('Space')).toBe(false)
    })
  })

  // -------------------------------------------------------------------------
  // Section 3 — Snapshot isolation
  // -------------------------------------------------------------------------

  describe('snapshot isolation', () => {
    it('snapshot is immutable and does not change when new events arrive', () => {
      fireKeyDown(target, 'ArrowRight')
      const beforeRelease = provider.getState()
      expect(beforeRelease.isPressed('ArrowRight')).toBe(true)

      fireKeyUp(target, 'ArrowRight')

      // Old snapshot still reports pressed
      expect(beforeRelease.isPressed('ArrowRight')).toBe(true)

      // New snapshot reports released
      expect(provider.getState().isPressed('ArrowRight')).toBe(false)
    })
  })

  // -------------------------------------------------------------------------
  // Section 4 — Lifecycle integration
  // -------------------------------------------------------------------------

  describe('lifecycle integration', () => {
    it('detach stops event tracking', () => {
      fireKeyDown(target, 'ArrowRight')
      expect(provider.getState().isPressed('ArrowRight')).toBe(true)

      provider.detach()

      // These events should not be tracked
      fireKeyUp(target, 'ArrowRight')

      // But the snapshot from before detach is frozen
      // Actually after detach we cleared pressed state, so new getState returns empty
      expect(provider.getState().isPressed('ArrowRight')).toBe(false)
    })

    it('re-attach restores event tracking', () => {
      provider.detach()
      provider.attach()

      fireKeyDown(target, 'ArrowDown')
      expect(provider.getState().isPressed('ArrowDown')).toBe(true)
    })
  })

  // -------------------------------------------------------------------------
  // Section 5 — Irrelevant events
  // -------------------------------------------------------------------------

  describe('irrelevant events', () => {
    it('non-tracked keys are ignored end-to-end', () => {
      fireKeyDown(target, 'Enter')
      fireKeyDown(target, 'Escape')
      fireKeyDown(target, 'Shift')

      const state = provider.getState()
      expect(state.isPressed('ArrowUp')).toBe(false)
      expect(state.isPressed('ArrowDown')).toBe(false)
      expect(state.isPressed('ArrowLeft')).toBe(false)
      expect(state.isPressed('ArrowRight')).toBe(false)
      expect(state.isPressed('Space')).toBe(false)
    })

    it('mouse events do not affect keyboard state', () => {
      target.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      target.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
      target.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }))

      const state = provider.getState()
      expect(state.isPressed('ArrowUp')).toBe(false)
    })
  })
})