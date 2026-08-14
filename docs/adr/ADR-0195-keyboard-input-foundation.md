# ADR-0195: Keyboard Input Foundation

**Status:** Accepted  
**Date:** Sprint 9  
**Work Order:** WO-S9-008  
**Architecture Version:** v1.81 → v1.82

---

## Context

The World can render, update, and animate entities, but users cannot interact with or control them. No keyboard input exists, and no input abstraction exists in the codebase.

Current state:
- `RuntimeExecutionLoop` ticks systems per frame
- `MovementSystem` applies positional offsets on each tick (hardcoded values)
- `VisualizationRunner` drives continuous render loops
- No way to query keyboard state from runtime systems
- No input abstraction layer

Without keyboard input:
- Player entities cannot respond to user key presses
- Runtime systems have no access to input state
- No foundation for future input-driven behaviors (movement, actions, menus)
- No abstraction boundary between input sources (keyboard, gamepad, touch)

### Problem

1. **No input abstraction** — no interface for querying keyboard state
2. **No keyboard tracking** — DOM keydown/keyup events are not captured
3. **No immutable snapshots** — input state cannot be safely queried mid-frame
4. **No test coverage** — zero tests for input behavior
5. **No integration** — Runtime systems have no way to read input

### Scope Boundaries

- No player movement integration
- No player controller
- No gameplay logic
- No physics
- No collision
- No camera
- No runtime mutation
- Input only

---

## Decision

### 1. Create `InputKey` Type

```typescript
export type InputKey =
  | 'ArrowUp'
  | 'ArrowDown'
  | 'ArrowLeft'
  | 'ArrowRight'
  | 'Space'
```

A union type of all supported keyboard keys. Currently limited to directionals and Space. Future extensions add values here.

### 2. Create `InputState` Interface

```typescript
export interface InputState {
  isPressed(key: InputKey): boolean
}
```

A read-only query interface. Callers can check whether a specific key is currently pressed. Implementations are expected to provide an immutable snapshot.

### 3. Create `InputProvider` Interface

```typescript
export interface InputProvider {
  getState(): InputState
}
```

An abstraction over any source of input state (DOM events, gamepad, simulated input). The provider tracks input events and produces an `InputState` snapshot on demand.

### 4. Create `DefaultInputState`

An immutable snapshot implementation. The set of pressed keys is captured at construction time. `isPressed()` returns true only for keys that were pressed when the snapshot was created. All outputs are deeply frozen — once constructed, the state cannot change.

```typescript
class DefaultInputState implements InputState {
  constructor(pressed: ReadonlySet<InputKey> = new Set())
  isPressed(key: InputKey): boolean
}
```

### 5. Create `KeyboardInputProvider`

A DOM event-driven implementation of `InputProvider`. Located in `packages/renderer/src/input/` because it depends on DOM APIs.

**Behavior**:
```
keydown 'ArrowRight'
  ↓
provider._pressed.add('ArrowRight')
  ↓
provider.getState()
  ↓
new DefaultInputState({'ArrowRight'})

keyup 'ArrowRight'
  ↓
provider._pressed.delete('ArrowRight')
  ↓
provider.getState()
  ↓
new DefaultInputState({})
```

**Lifecycle methods**: `attach()` starts listening, `detach()` stops and clears state. Double-attach/detach are idempotent. `isAttached()` reports current state.

**Key canonicalization**: The `Space` key is mapped from both `' '` (space character) and `'Space'` to the `'Space'` InputKey. Non-tracked keys (Enter, Escape, letters) are silently ignored.

### 6. Location

| File | Action |
|------|--------|
| `packages/runtime/src/input/InputKey.ts` | New — type |
| `packages/runtime/src/input/InputState.ts` | New — interface |
| `packages/runtime/src/input/InputProvider.ts` | New — interface |
| `packages/runtime/src/input/DefaultInputState.ts` | New — implementation |
| `packages/runtime/src/input/index.ts` | New — barrel exports |
| `packages/renderer/src/input/KeyboardInputProvider.ts` | New — implementation |
| `packages/renderer/src/input/index.ts` | New — barrel exports |
| `packages/runtime/src/index.ts` | Modified — added input exports |
| `packages/renderer/src/index.ts` | Modified — added input exports |
| `packages/runtime/src/__tests__/InputState.test.ts` | New — 16 tests |
| `packages/renderer/src/input/__tests__/KeyboardInputProvider.test.ts` | New — 27 tests |
| `packages/renderer/src/input/__tests__/KeyboardInputIntegration.test.ts` | New — 11 tests |
| `docs/adr/ADR-0195-keyboard-input-foundation.md` | New — this document |

### 7. Unit Test Strategy

**InputState.test.ts** — 16 tests across 5 sections:

| Section | Tests | Coverage |
|---------|-------|----------|
| Pressed | 6 | All 5 keys individually, all 5 keys simultaneously |
| Not pressed | 3 | Empty state, different key, released key |
| Multiple keys | 2 | Simultaneous pressure, no interference |
| Empty state | 2 | No args constructor, empty set constructor |
| Immutability | 3 | Original set mutations, post-construction adds, snapshot independence |

**KeyboardInputProvider.test.ts** — 27 tests across 7 sections:

| Section | Tests | Coverage |
|---------|-------|----------|
| keydown | 7 | All 5 keys, space char, ignored keys |
| keyup | 4 | Release tracked key, release non-pressed key |
| Multiple keys | 3 | Independent tracking, partial release, full release |
| Duplicate keydown | 2 | Single key, multiple keys |
| Cleanup | 4 | Detach stops events, clears state, double-detach safe, re-attach |
| Snapshot generation | 2 | Snapshot isolation, snapshot independence |
| Lifecycle | 5 | Pre-attach, post-attach, post-detach, double-attach |

### 8. Integration Test Strategy

**KeyboardInputIntegration.test.ts** — 11 tests across 5 sections:

| Section | Tests | Coverage |
|---------|-------|----------|
| Single key lifecycle | 3 | Press, release, press-release-press |
| Multiple key interaction | 3 | All keys, partial release, space variants |
| Snapshot isolation | 1 | Immutability across state changes |
| Lifecycle integration | 2 | Detach stops, re-attach resumes |
| Irrelevant events | 2 | Non-tracked keys, mouse events |

---

## Consequences

### Positive

1. **Input abstraction** — `InputProvider` and `InputState` provide a clean contract for querying keyboard state
2. **Immutable snapshots** — `DefaultInputState` is frozen and isolated from live tracking, safe for systems to query mid-frame
3. **DOM-backed provider** — `KeyboardInputProvider` attaches to any `EventTarget`, defaults to `window`
4. **Tested foundation** — 54 new tests across unit and integration levels
5. **No breaking changes** — all existing public APIs unchanged
6. **Deterministic** — snapshots are deterministic; given the same pressed set, `getState()` always returns equivalent state

### Negative

1. **Foundation only** — no gameplay logic, no player movement, no controller abstraction
2. **5 keys only** — limited to directionals and Space; general keyboard support requires extending `InputKey`
3. **Renderer dependency** — `KeyboardInputProvider` lives in the renderer package because it depends on DOM APIs; runtime-only environments need a different provider

### Neutral

1. **Attach/detach lifecycle** — providers must be manually attached and detached; no automatic cleanup
2. **No gamepad/touch** — only keyboard input is supported; other input sources are future work

---

## Verification

- TypeScript: 0 errors (`packages/runtime`, `packages/renderer`)
- ESLint: 0 errors
- InputState unit tests pass: 16
- KeyboardInputProvider unit tests pass: 27
- KeyboardInputIntegration tests pass: 11
- Total runtime tests: 470
- Total renderer tests: 287
- No Movement Integration
- No Player Controller
- No Physics
- No Collision
- No Camera
- No Gameplay Logic
- No Runtime Mutation
- No breaking changes to any Public API

---

## Files Created/Modified

| File | Action |
|------|--------|
| `packages/runtime/src/input/InputKey.ts` | New — type |
| `packages/runtime/src/input/InputState.ts` | New — interface |
| `packages/runtime/src/input/InputProvider.ts` | New — interface |
| `packages/runtime/src/input/DefaultInputState.ts` | New — implementation |
| `packages/runtime/src/input/index.ts` | New — barrel exports |
| `packages/renderer/src/input/KeyboardInputProvider.ts` | New — implementation |
| `packages/renderer/src/input/index.ts` | New — barrel exports |
| `packages/runtime/src/index.ts` | Modified — added input exports |
| `packages/renderer/src/index.ts` | Modified — added input exports |
| `packages/runtime/src/__tests__/InputState.test.ts` | New — 16 tests |
| `packages/renderer/src/input/__tests__/KeyboardInputProvider.test.ts` | New — 27 tests |
| `packages/renderer/src/input/__tests__/KeyboardInputIntegration.test.ts` | New — 11 tests |
| `docs/adr/ADR-0195-keyboard-input-foundation.md` | New — this document |
| `docs/project/PROJECT_STATE.md` | Updated — v1.82, WO-S9-008 |
| `docs/project/CHANGELOG.md` | Updated — v1.82, WO-S9-008 |