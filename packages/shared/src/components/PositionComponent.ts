/**
 * PositionComponent — a gameplay component representing 2D spatial position.
 *
 * The PositionComponent is the first standardized gameplay component in the
 * Project Genesis runtime. It provides a minimal foundation for 2D spatial
 * positioning (x, y coordinates) that gameplay systems can query and systems
 * can mutate over time.
 *
 * Design principles:
 * - Frozen output: all instances are deeply frozen
 * - Immutable: all fields are readonly
 * - Deterministic: same inputs always produce the same output
 * - Serializable: all values are JSON-serializable
 * - Framework-independent: no Vue, Pinia, or web framework imports
 * - Runtime-independent: no Runtime type imports
 * - Foundation only: no movement logic, no physics, no gameplay systems
 *
 * @see isPositionComponent — type guard for narrowing RuntimeComponent
 * @see POSITION_COMPONENT_TYPE — the canonical type identifier string
 */

import type { RuntimeComponent } from '../RuntimeComponent'

// ---------------------------------------------------------------------------
// Type Identifier
// ---------------------------------------------------------------------------

/** Canonical type identifier for the Position component. */
export const POSITION_COMPONENT_TYPE = 'position'

// ---------------------------------------------------------------------------
// Interface
// ---------------------------------------------------------------------------

/**
 * PositionComponent — 2D spatial position data.
 *
 * All fields are readonly. Instances must be created via
 * `createPositionComponent(x, y)` which guarantees deep freezing.
 */
export interface PositionComponent {
  /** Discriminant type for type narrowing. Always `'position'`. */
  readonly type: 'position'

  /** Position properties — readonly x/y coordinate bag. */
  readonly properties: {
    readonly x: number
    readonly y: number
  }
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Create a frozen PositionComponent.
 *
 * @param x — X-coordinate (any finite number)
 * @param y — Y-coordinate (any finite number)
 * @returns A deeply frozen PositionComponent
 */
export function createPositionComponent(
  x: number,
  y: number
): PositionComponent {
  return Object.freeze({
    type: POSITION_COMPONENT_TYPE,
    properties: Object.freeze({
      x,
      y,
    }),
  }) as unknown as PositionComponent
}

// ---------------------------------------------------------------------------
// Type Guard
// ---------------------------------------------------------------------------

/**
 * Narrow a RuntimeComponent to PositionComponent when its type matches.
 *
 * @param component — Any RuntimeComponent to test
 * @returns True if the component is a PositionComponent
 */
export function isPositionComponent(
  component: RuntimeComponent
): component is PositionComponent {
  return component.type === POSITION_COMPONENT_TYPE
}