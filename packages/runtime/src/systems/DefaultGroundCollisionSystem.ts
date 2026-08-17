/**
 * DefaultGroundCollisionSystem — default implementation of GroundCollisionSystem.
 *
 * Accepts an optional groundY value at construction (default: 400).
 * On each tick, iterates over all entities in the world. Entities that
 * carry a PositionComponent in their components array and have a y
 * coordinate >= groundY are clamped to y = groundY.
 *
 * Entities without a PositionComponent, or with y < groundY, are passed
 * through unchanged.
 *
 * Two entry points:
 * - update(world):       pure World → World transformation (RuntimeSystem contract)
 * - updateWithResult(world): returns both the output World and GroundCollisionSystemResult
 *
 * Behaviors:
 * - Pure: no side effects, no I/O, no external calls
 * - Stateless: no internal state between ticks
 * - Deterministic: same (world, groundY) always produces same output
 * - Immutable: output World is deeply frozen; input is never mutated
 * - Entity without PositionComponent: ignored (passed through unchanged)
 * - Entity above ground (y < groundY): ignored (passed through unchanged)
 * - Entity at ground level (y === groundY): no change needed, not counted
 * - Empty world: no-op (returns frozen copy)
 *
 * Design principles:
 * - Minimal: single responsibility — clamp entities at ground level
 * - Foundation only: no physics engine, no velocity, no rigid bodies
 * - Framework-independent: no Vue, Pinia, or web framework imports
 * - UI-independent: no ViewModel or UI type imports
 */
import type { World, Entity } from '@genesis/shared'
import {
  isPositionComponent,
  createPositionComponent,
  createVelocityComponent,
  isVelocityComponent,
} from '@genesis/shared'
import type { GroundCollisionSystem } from './GroundCollisionSystem'
import type { GroundCollisionSystemResult } from './GroundCollisionSystemResult'
import type { PositionComponent } from '@genesis/shared'

/** Default ground Y threshold when none is specified. */
const DEFAULT_GROUND_Y = 400

export class DefaultGroundCollisionSystem implements GroundCollisionSystem {
  readonly name = 'GroundCollisionSystem'

  private readonly groundY: number

  /**
   * @param groundY — the Y threshold at which entities are grounded (default: 400)
   */
  constructor(groundY: number = DEFAULT_GROUND_Y) {
    this.groundY = groundY
  }

  /**
   * Clamp all entities at or below ground level to groundY.
   *
   * @param world — immutable input World
   * @returns Frozen output World with positions grounded
   */
  update(world: World): World {
    const { groundedEntities } = this.checkGrounding(world)
    return groundedEntities === 0
      ? this.freezeCopy(world)
      : this.buildUpdatedWorld(world)
  }

  /**
   * Clamp entities to ground and return full execution metadata.
   *
   * @param world — immutable input World
   * @returns Frozen World and GroundCollisionSystemResult
   */
  updateWithResult(world: World): {
    world: World
    result: GroundCollisionSystemResult
  } {
    const { groundedEntities } = this.checkGrounding(world)
    const outputWorld = groundedEntities === 0
      ? this.freezeCopy(world)
      : this.buildUpdatedWorld(world)

    return Object.freeze({
      world: outputWorld,
      result: Object.freeze({
        groundedEntities,
        groundY: this.groundY,
      }),
    })
  }

  // ---------------------------------------------------------------------------
  // Private Helpers
  // ---------------------------------------------------------------------------

  /**
   * Determine whether any entities are below ground and count how many.
   */
  private checkGrounding(world: World): {
    groundedEntities: number
  } {
    let groundedEntities = 0

    for (const entity of world.entities) {
      if (this.isBelowGround(entity)) {
        groundedEntities++
      }
    }

    return { groundedEntities }
  }

  /**
   * Build a new frozen World with grounded entity positions.
   */
  private buildUpdatedWorld(world: World): World {
    const updatedEntities: Entity[] = []

    for (const entity of world.entities) {
      if (this.isBelowGround(entity)) {
        const oldComponent = this.findPositionComponent(entity)!
        const clampedY = this.groundY
        const newPositionComponent = createPositionComponent(
          oldComponent.properties.x,
          clampedY,
        )

        const updatedComponents = entity.components
          ? Object.freeze(
              entity.components.map((c) =>
                isPositionComponent(c)
                  ? newPositionComponent
                  : isVelocityComponent(c)
                    ? createVelocityComponent(c.properties.x, 0)
                    : c,
              ),
            )
          : Object.freeze([newPositionComponent, createVelocityComponent()])

        updatedEntities.push(
          Object.freeze({
            id: entity.id,
            type: entity.type,
            x: entity.x,
            y: clampedY,
            components: updatedComponents,
          }) as unknown as Entity,
        )
      } else {
        updatedEntities.push(entity)
      }
    }

    return Object.freeze({
      entities: Object.freeze(updatedEntities),
    }) as unknown as World
  }

  /**
   * Create a shallow frozen copy of the world (no entities changed).
   */
  private freezeCopy(world: World): World {
    return Object.freeze({
      entities: Object.freeze([...world.entities]),
    }) as unknown as World
  }

  /**
   * Check whether an entity with a PositionComponent is below ground level.
   * Only entities with a PositionComponent and y > groundY are considered.
   * At exactly groundY (y === groundY), no clamping is needed.
   */
  private isBelowGround(entity: Entity): boolean {
    const component = this.findPositionComponent(entity)
    if (!component) return false

    // Only clamp when strictly above groundY — at groundY or above, no change
    return component.properties.y > this.groundY
  }

  /**
   * Find the PositionComponent in an entity's components array.
   */
  private findPositionComponent(entity: Entity): PositionComponent | undefined {
    const components = entity.components
    if (!components) return undefined
    for (const component of components) {
      if (isPositionComponent(component)) {
        return component
      }
    }
    return undefined
  }
}
