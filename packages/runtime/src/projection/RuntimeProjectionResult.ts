/**
 * RuntimeProjectionResult — typed result of a GameDsl → Runtime projection.
 *
 * Represents the output of projecting a declarative Game DSL onto the
 * Runtime world representation. The result bundles the projected world
 * with metadata about what was projected (entity count, component count).
 *
 * Since v1.63, componentCount is derived from actual projected
 * RuntimeComponent objects stored on Runtime entities, not from
 * counting DSL components independently.
 *
 * This is a FOUNDATION contract — no gameplay logic, no simulation,
 * no interpretation of component data.
 *
 * Design principles:
 * - Immutable: all fields are readonly
 * - Serializable: all types are JSON-serializable primitives
 * - Framework-independent: no Vue, Pinia, or web framework imports
 * - UI-independent: no ViewModel or UI type imports
 */
import type { World } from '@genesis/shared'

/**
 * RuntimeProjectionResult — the output of a GameDsl → Runtime projection.
 *
 * Includes the projected world and metadata about the projection.
 */
export interface RuntimeProjectionResult {
  /** The projected Runtime world with entities. */
  readonly world: World

  /** Number of entities projected into the world. */
  readonly entityCount: number

  /**
   * Total number of RuntimeComponent objects across all projected entities.
   * Derived from actual projected RuntimeComponent instances.
   */
  readonly componentCount: number
}