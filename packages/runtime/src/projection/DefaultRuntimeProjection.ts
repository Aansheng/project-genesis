/**
 * DefaultRuntimeProjection — default implementation of RuntimeProjection.
 *
 * Converts a declarative GameDsl into a Runtime world representation.
 * Each DSL entity is projected as a Runtime entity with id/type preserved
 * and x/y defaulted to 0 (no interpretation). Components are counted
 * but not stored — this is a Foundation-level pipeline validation layer.
 *
 * This is structure projection, not game generation.
 * No AI, no interpretation, no gameplay logic, no simulation.
 *
 * Mapping rules:
 * - GameDsl.world → Runtime World (name preserved via world metadata)
 * - Each EntityDsl → Runtime Entity (id, type preserved; x=0, y=0)
 * - Each ComponentDsl → counted in componentCount (not stored in Runtime
 *   Entity — that requires a future ECS expansion)
 *
 * Design:
 * - Pure: no side effects, no I/O, no external calls
 * - Stateless: no internal state between projects
 * - Deterministic: same input always produces same output
 * - Immutable: all outputs are deeply frozen
 * - Defensive: safe extraction, no assumptions about input shape
 */
import type { GameDsl, World, Entity } from '@genesis/shared'
import type { RuntimeProjection } from './RuntimeProjection'
import type { RuntimeProjectionResult } from './RuntimeProjectionResult'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Default position value when no position data is available. */
const DEFAULT_POSITION = 0

// ---------------------------------------------------------------------------
// DefaultRuntimeProjection
// ---------------------------------------------------------------------------

/**
 * DefaultRuntimeProjection — default implementation of RuntimeProjection.
 *
 * Pure. Stateless. Deterministic.
 */
export class DefaultRuntimeProjection implements RuntimeProjection {
  /**
   * Project a GameDsl onto the Runtime world representation.
   *
   * @param dsl — declarative Game DSL
   * @returns Deeply frozen RuntimeProjectionResult
   */
  project(dsl: GameDsl): RuntimeProjectionResult {
    // Handle invalid input
    if (dsl === undefined || dsl === null) {
      return this.createEmptyResult()
    }
    if (typeof dsl !== 'object' || Array.isArray(dsl)) {
      return this.createEmptyResult()
    }

    const worldDsl = dsl.world
    if (!worldDsl || typeof worldDsl !== 'object' || Array.isArray(worldDsl)) {
      return this.createEmptyResult()
    }

    // Project entities
    const entities = this.projectEntities(worldDsl.entities)

    // Calculate counts
    const entityCount = entities.length
    const componentCount = this.countComponents(worldDsl.entities)

    // Build and freeze the Runtime world
    const world = Object.freeze({
      entities: Object.freeze(entities),
    }) as unknown as World

    // Build and freeze the result
    return Object.freeze({
      world,
      entityCount,
      componentCount,
    }) as unknown as RuntimeProjectionResult
  }

  // -------------------------------------------------------------------------
  // Private — Entity Projection
  // -------------------------------------------------------------------------

  /**
   * Project DSL entities into Runtime entities.
   *
   * Each EntityDsl becomes a Runtime Entity with:
   * - id: preserved from EntityDsl
   * - type: preserved from EntityDsl
   * - x: defaulted to 0 (no position interpretation)
   * - y: defaulted to 0 (no position interpretation)
   */
  private projectEntities(
    dslEntities: readonly import('@genesis/shared').EntityDsl[] | undefined,
  ): Entity[] {
    if (!Array.isArray(dslEntities) || dslEntities.length === 0) {
      return []
    }

    const entities: Entity[] = []

    for (const entityDsl of dslEntities) {
      if (!entityDsl || typeof entityDsl !== 'object') {
        continue
      }

      entities.push(
        Object.freeze({
          id: String(entityDsl.id ?? ''),
          type: String(entityDsl.type ?? ''),
          x: DEFAULT_POSITION,
          y: DEFAULT_POSITION,
        }),
      )
    }

    return entities
  }

  // -------------------------------------------------------------------------
  // Private — Component Counting
  // -------------------------------------------------------------------------

  /**
   * Count total components across all DSL entities.
   *
   * Components are not stored in the Runtime Entity (which has no
   * components field yet). They are counted as pipeline validation.
   */
  private countComponents(
    dslEntities: readonly import('@genesis/shared').EntityDsl[] | undefined,
  ): number {
    if (!Array.isArray(dslEntities) || dslEntities.length === 0) {
      return 0
    }

    let count = 0

    for (const entityDsl of dslEntities) {
      if (!entityDsl || typeof entityDsl !== 'object') {
        continue
      }
      if (Array.isArray(entityDsl.components)) {
        count += entityDsl.components.length
      }
    }

    return count
  }

  // -------------------------------------------------------------------------
  // Private — Empty Result
  // -------------------------------------------------------------------------

  /**
   * Create an empty projection result.
   *
   * Used when the input DSL is invalid or empty.
   */
  private createEmptyResult(): RuntimeProjectionResult {
    return Object.freeze({
      world: Object.freeze({
        entities: Object.freeze([]),
      }) as unknown as World,
      entityCount: 0,
      componentCount: 0,
    }) as unknown as RuntimeProjectionResult
  }
}