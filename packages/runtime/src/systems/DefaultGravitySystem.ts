/**
 * DefaultGravitySystem — default implementation of GravitySystem.
 *
 * Accepts an optional gravity value at construction (default: 1).
 * On each tick, gravity increments the y value of a player's
 * VelocityComponent. Position is applied by VerticalMotionSystem.
 *
 * Entities without a PositionComponent are passed through unchanged.
 *
 * Two entry points:
 * - update(world):       pure World → World transformation (RuntimeSystem contract)
 * - updateWithResult(world): returns both the output World and GravitySystemResult
 *
 * Behaviors:
 * - Pure: no side effects, no I/O, no external calls
 * - Stateless: no internal state between ticks
 * - Deterministic: same (world, gravity) always produces same output
 * - Immutable: output World is deeply frozen; input is never mutated
 * - Entity without PositionComponent: ignored (passed through unchanged)
 * - Empty world: no-op (returns frozen copy)
 *
 * Design principles:
 * - Minimal: single responsibility — apply gravity to entities with velocity
 * - Foundation only: no position integration, collision, jumping, or physics engine
 * - Framework-independent: no Vue, Pinia, or web framework imports
 * - UI-independent: no ViewModel or UI type imports
 */
import type { World, Entity } from '@genesis/shared'
import {
  createVelocityComponent,
  isVelocityComponent,
} from '@genesis/shared'
import type { GravitySystem } from './GravitySystem'
import type { GravitySystemResult } from './GravitySystemResult'

/** Default gravity value when none is specified. */
const DEFAULT_GRAVITY = 1

export class DefaultGravitySystem implements GravitySystem {
  readonly name = 'GravitySystem'

  private readonly gravity: number

  /**
   * @param gravity — the downward force to apply each tick (default: 1)
   */
  constructor(gravity: number = DEFAULT_GRAVITY) {
    this.gravity = gravity
  }

  /**
   * Apply gravity to all entities with a PositionComponent.
   *
   * @param world — immutable input World
   * @returns Frozen output World with positions updated
   */
  update(world: World): World {
    const { affectedEntities } = this.applyGravity(world)
    return affectedEntities === 0
      ? this.freezeCopy(world)
      : this.buildUpdatedWorld(world)
  }

  /**
   * Apply gravity and return full execution metadata.
   *
   * @param world — immutable input World
   * @returns Frozen World and GravitySystemResult
   */
  updateWithResult(world: World): {
    world: World
    result: GravitySystemResult
  } {
    const { affectedEntities } = this.applyGravity(world)
    const outputWorld = affectedEntities === 0
      ? this.freezeCopy(world)
      : this.buildUpdatedWorld(world)

    return Object.freeze({
      world: outputWorld,
      result: Object.freeze({
        affectedEntities,
        gravity: this.gravity,
      }),
    })
  }

  // ---------------------------------------------------------------------------
  // Private Helpers
  // ---------------------------------------------------------------------------

  /**
   * Determine whether any entities carry vertical velocity and count them.
   */
  private applyGravity(world: World): {
    affectedEntities: number
  } {
    let affectedEntities = 0

    for (const entity of world.entities) {
      if (this.hasVelocityComponent(entity)) {
        affectedEntities++
      }
    }

    return { affectedEntities }
  }

  /**
   * Build a new frozen World with updated entity positions.
   */
  private buildUpdatedWorld(world: World): World {
    const updatedEntities: Entity[] = []

    for (const entity of world.entities) {
      if (this.hasVelocityComponent(entity)) {
        const oldVelocity = this.findVelocityComponent(entity)!
        const newVelocityComponent = createVelocityComponent(
          oldVelocity.properties.x,
          oldVelocity.properties.y + this.gravity,
        )
        const updatedComponents = entity.components
          ? Object.freeze(
              entity.components.map((c) =>
                isVelocityComponent(c) ? newVelocityComponent : c,
              ),
            )
          : Object.freeze([newVelocityComponent])

        updatedEntities.push(
          Object.freeze({
            ...entity,
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
   * Check whether an entity has a VelocityComponent in its components array.
   */
  private hasVelocityComponent(entity: Entity): boolean {
    const components = entity.components
    if (!components || components.length === 0) {
      return false
    }

    for (const component of components) {
      if (isVelocityComponent(component)) {
        return true
      }
    }

    return false
  }

  /**
   * Find the VelocityComponent in an entity's components array.
   */
  private findVelocityComponent(entity: Entity) {
    const components = entity.components
    if (!components) return undefined
    for (const component of components) {
      if (isVelocityComponent(component)) {
        return component
      }
    }
    return undefined
  }
}
