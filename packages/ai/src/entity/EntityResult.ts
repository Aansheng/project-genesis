import type { Entity } from './Entity'

/**
 * EntityResult — the output of an EntityAnalyzer.
 *
 * Supports multiple entities from a single input.
 *
 * Example:
 *   Input: "Draw a tree and a flower"
 *   Output: { entities: [{ type: 'Tree' }, { type: 'Flower' }] }
 *
 * Design principles:
 * - Pure data: no methods, no behavior
 * - readonly: immutable by design
 * - Empty array is valid (when no entity could be determined)
 */
export interface EntityResult {
  readonly entities: readonly Entity[]
}