/**
 * DefaultRuntimeProjection — default implementation of RuntimeProjection.
 *
 * Converts a declarative GameDsl into a Runtime world representation.
 * Each DSL entity is projected as a Runtime entity with id/type preserved,
 * x/y defaulted to 0 (no interpretation), and components projected as
 * RuntimeComponent objects with type and properties preserved.
 *
 * This is structure projection, not game generation.
 * No AI, no interpretation, no gameplay logic, no simulation.
 *
 * Mapping rules (v1.63 — component projection):
 * - GameDsl.world → Runtime World
 * - Each EntityDsl → Runtime Entity (id, type preserved; x=0, y=0)
 * - Each ComponentDsl → RuntimeComponent (type, properties preserved)
 * - componentCount derived from actual projected RuntimeComponent objects
 *
 * Design:
 * - Pure: no side effects, no I/O, no external calls
 * - Stateless: no internal state between projects
 * - Deterministic: same input always produces same output
 * - Immutable: all outputs are deeply frozen
 * - Defensive: safe extraction, no assumptions about input shape
 */
import type { GameDsl, World, Entity, RuntimeComponent } from '@genesis/shared'
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

    // Project entities (components are projected as part of each entity)
    const entities = this.projectEntities(worldDsl.entities)

    // Calculate counts from projected data
    const entityCount = entities.length
    const componentCount = this.countProjectedComponents(entities)

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
   * Project DSL entities into Runtime entities with projected components.
   *
   * Each EntityDsl becomes a Runtime Entity with:
   * - id: preserved from EntityDsl
   * - type: preserved from EntityDsl
   * - x: defaulted to 0 (no position interpretation)
   * - y: defaulted to 0 (no position interpretation)
   * - components: projected from ComponentDsl[]
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

      // Project components for this entity
      const components = this.projectComponents(entityDsl.components)

      entities.push(
        Object.freeze({
          id: String(entityDsl.id ?? ''),
          type: String(entityDsl.type ?? ''),
          x: DEFAULT_POSITION,
          y: DEFAULT_POSITION,
          components: Object.freeze(components),
        }),
      )
    }

    return entities
  }

  // -------------------------------------------------------------------------
  // Private — Component Projection
  // -------------------------------------------------------------------------

  /**
   * Project DSL components into RuntimeComponent objects.
   *
   * Each ComponentDsl becomes a RuntimeComponent with:
   * - type: preserved from ComponentDsl (no interpretation)
   * - properties: preserved from ComponentDsl (no interpretation)
   *
   * All outputs are deeply frozen.
   */
  private projectComponents(
    dslComponents: readonly import('@genesis/shared').ComponentDsl[] | undefined,
  ): RuntimeComponent[] {
    if (!Array.isArray(dslComponents) || dslComponents.length === 0) {
      return []
    }

    const components: RuntimeComponent[] = []

    for (const componentDsl of dslComponents) {
      if (!componentDsl || typeof componentDsl !== 'object') {
        continue
      }

      components.push(
        Object.freeze({
          type: String(componentDsl.type ?? ''),
          properties: Object.freeze({ ...componentDsl.properties }),
        }),
      )
    }

    return components
  }

  // -------------------------------------------------------------------------
  // Private — Projected Component Counting
  // -------------------------------------------------------------------------

  /**
   * Count total RuntimeComponent objects across all projected entities.
   *
   * Unlike the previous countComponents (which counted DSL components),
   * this counts from the actual projected RuntimeComponent objects.
   */
  private countProjectedComponents(entities: Entity[]): number {
    let count = 0

    for (const entity of entities) {
      if (entity.components) {
        count += entity.components.length
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