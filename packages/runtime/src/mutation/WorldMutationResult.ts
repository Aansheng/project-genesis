/**
 * WorldMutationResult — the result of a single world mutation operation.
 *
 * Captures the output World along with metadata about the mutation:
 * the resulting entity count and the operation that was performed.
 *
 * Design principles:
 * - Immutable: all fields are readonly
 * - Serializable: all types are JSON-serializable primitives
 * - Informative: provides metadata for debugging and observability
 * - Framework-independent: no Vue, Pinia, or web framework imports
 * - UI-independent: no ViewModel or UI type imports
 */
import type { World } from '@genesis/shared'

export interface WorldMutationResult {
  /**
   * The output World after the mutation has been applied.
   */
  readonly world: World

  /**
   * The number of entities in the output World.
   */
  readonly entityCount: number

  /**
   * The operation that was performed (e.g. 'addEntity', 'removeEntity',
   * 'replaceEntity').
   */
  readonly operation: string
}