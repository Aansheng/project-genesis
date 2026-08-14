/**
 * InputState — verifies the InputState interface and DefaultInputState implementation.
 *
 * WO-S9-008 — Keyboard Input Foundation
 * Architecture version v1.82
 *
 * Coverage:
 * - pressed keys
 * - not pressed keys
 * - multiple keys
 * - empty state
 * - immutability
 */

import { describe, it, expect } from 'vitest'
import { DefaultInputState } from '../input/DefaultInputState'
import type { InputKey, InputState } from '../input'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Create an InputState with no keys pressed. */
function createEmptyState(): InputState {
  return new DefaultInputState()
}

/** Create an InputState with a single key pressed. */
function createSingleKeyState(key: InputKey): InputState {
  return new DefaultInputState(new Set([key]))
}

/** Create an InputState with multiple keys pressed. */
function createMultiKeyState(): InputState {
  return new DefaultInputState(new Set<InputKey>([
    'ArrowUp',
    'ArrowDown',
    'ArrowLeft',
    'ArrowRight',
    'Space',
  ]))
}

// ---------------------------------------------------------------------------
// Section 1 — Pressed
// ---------------------------------------------------------------------------

describe('pressed', () => {
  it('returns true for a pressed key', () => {
    const state = createSingleKeyState('ArrowRight')
    expect(state.isPressed('ArrowRight')).toBe(true)
  })

  it('returns true for each pressed key when multiple are pressed', () => {
    const state = createMultiKeyState()
    expect(state.isPressed('ArrowUp')).toBe(true)
    expect(state.isPressed('ArrowDown')).toBe(true)
    expect(state.isPressed('ArrowLeft')).toBe(true)
    expect(state.isPressed('ArrowRight')).toBe(true)
    expect(state.isPressed('Space')).toBe(true)
  })

  it('returns true for ArrowUp when pressed', () => {
    const state = createSingleKeyState('ArrowUp')
    expect(state.isPressed('ArrowUp')).toBe(true)
  })

  it('returns true for ArrowDown when pressed', () => {
    const state = createSingleKeyState('ArrowDown')
    expect(state.isPressed('ArrowDown')).toBe(true)
  })

  it('returns true for ArrowLeft when pressed', () => {
    const state = createSingleKeyState('ArrowLeft')
    expect(state.isPressed('ArrowLeft')).toBe(true)
  })

  it('returns true for Space when pressed', () => {
    const state = createSingleKeyState('Space')
    expect(state.isPressed('Space')).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Section 2 — Not pressed
// ---------------------------------------------------------------------------

describe('not pressed', () => {
  it('returns false for a key that was never pressed', () => {
    const state = createEmptyState()
    expect(state.isPressed('ArrowUp')).toBe(false)
    expect(state.isPressed('ArrowDown')).toBe(false)
    expect(state.isPressed('ArrowLeft')).toBe(false)
    expect(state.isPressed('ArrowRight')).toBe(false)
    expect(state.isPressed('Space')).toBe(false)
  })

  it('returns false when a different key is pressed', () => {
    const state = createSingleKeyState('ArrowUp')
    expect(state.isPressed('ArrowDown')).toBe(false)
    expect(state.isPressed('ArrowLeft')).toBe(false)
    expect(state.isPressed('ArrowRight')).toBe(false)
    expect(state.isPressed('Space')).toBe(false)
  })

  it('returns false after the only pressed key is released (recreated state)', () => {
    const pressed = new Set<InputKey>(['ArrowRight'])
    const state = new DefaultInputState(pressed)
    expect(state.isPressed('ArrowRight')).toBe(true)

    // Simulate a new snapshot without ArrowRight
    const releasedState = new DefaultInputState()
    expect(releasedState.isPressed('ArrowRight')).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Section 3 — Multiple keys
// ---------------------------------------------------------------------------

describe('multiple keys', () => {
  it('tracks multiple simultaneously pressed keys', () => {
    const state = new DefaultInputState(new Set<InputKey>([
      'ArrowUp',
      'Space',
    ]))
    expect(state.isPressed('ArrowUp')).toBe(true)
    expect(state.isPressed('Space')).toBe(true)
    expect(state.isPressed('ArrowDown')).toBe(false)
  })

  it('does not interfere between keys', () => {
    const state = new DefaultInputState(new Set<InputKey>([
      'ArrowLeft',
      'ArrowRight',
    ]))
    expect(state.isPressed('ArrowLeft')).toBe(true)
    expect(state.isPressed('ArrowRight')).toBe(true)
    expect(state.isPressed('ArrowUp')).toBe(false)
    expect(state.isPressed('ArrowDown')).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Section 4 — Empty state
// ---------------------------------------------------------------------------

describe('empty state', () => {
  it('returns false for all keys when created without arguments', () => {
    const state = createEmptyState()
    expect(state.isPressed('ArrowUp')).toBe(false)
    expect(state.isPressed('ArrowDown')).toBe(false)
    expect(state.isPressed('ArrowLeft')).toBe(false)
    expect(state.isPressed('ArrowRight')).toBe(false)
    expect(state.isPressed('Space')).toBe(false)
  })

  it('returns false for all keys when created with empty set', () => {
    const state = new DefaultInputState(new Set())
    expect(state.isPressed('ArrowUp')).toBe(false)
    expect(state.isPressed('ArrowDown')).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Section 5 — Immutability
// ---------------------------------------------------------------------------

describe('immutability', () => {
  it('is unaffected by changes to the original pressed set', () => {
    const set = new Set<InputKey>(['ArrowRight'])
    const state = new DefaultInputState(set)
    expect(state.isPressed('ArrowRight')).toBe(true)

    // Mutate original set
    set.delete('ArrowRight')
    expect(state.isPressed('ArrowRight')).toBe(true)
  })

  it('is unaffected by adding keys to the original set after construction', () => {
    const set = new Set<InputKey>()
    const state = new DefaultInputState(set)
    expect(state.isPressed('ArrowUp')).toBe(false)

    set.add('ArrowUp')
    expect(state.isPressed('ArrowUp')).toBe(false)
  })

  it('multiple snapshots from the same source set are independent', () => {
    const set = new Set<InputKey>(['ArrowUp'])
    const state1 = new DefaultInputState(set)
    const state2 = new DefaultInputState(set)

    expect(state1.isPressed('ArrowUp')).toBe(true)
    expect(state2.isPressed('ArrowUp')).toBe(true)

    set.delete('ArrowUp')
    expect(state1.isPressed('ArrowUp')).toBe(true)
    expect(state2.isPressed('ArrowUp')).toBe(true)
  })
})