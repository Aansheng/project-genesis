/**
 * InputKey — the set of keyboard keys that the input system tracks.
 *
 * WO-S9-008 — Keyboard Input Foundation
 * Architecture version v1.82
 *
 * This is a union type of all supported input keys.
 * Currently limited to directionals and Space.
 */
export type InputKey =
  | 'ArrowUp'
  | 'ArrowDown'
  | 'ArrowLeft'
  | 'ArrowRight'
  | 'Space'