/**
 * DefaultGravitySystem — default implementation of GravitySystem.
 *
 * Accepts an optional gravity value at construction (default: 1).
 * On each tick, iterates over all entities in the world. Entities that
 * carry a PositionComponent in their components array have their y
 * coordinate incremented by the gravity value.
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
 * - Minimal: single responsibility — apply gravity to entities with PositionComponent
 * - Foundation only: no collision, no jumping, no physics engine
 * - Framework-independent: no Vue, Pinia, or web framework imports
 * - UI-independent: no ViewModel or UI type imports
 */
import type { World, Entity } from '@genesis/shared'
import {
  isPositionComponent,
  createPositionComponent,
} from '@genesis/shared'
import type { GravitySystem } from './GravitySystem'
import type { GravitySystemResult } from './GravitySystemResult'
import type { PositionComponent } from '@genesis/shared'

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
   * Determine whether any entities are affected by gravity and count how many.
   */
  private applyGravity(world: World): {
    affectedEntities: number
  } {
    let affectedEntities = 0

    for (const entity of world.entities) {
      if (this.hasPositionComponent(entity)) {
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
      if (this.hasPositionComponent(entity)) {
        const oldComponent = this.findPositionComponent(entity)!
        const newY = oldComponent.properties.y + this.gravity
        const newX = oldComponent.properties.x
        const newPositionComponent = createPositionComponent(newX, newY)

        const updatedComponents = entity.components
          ? Object.freeze(
              entity.components.map((c) =>
                isPositionComponent(c) ? newPositionComponent : c,
              ),
            )
          : Object.freeze([newPositionComponent])

        updatedEntities.push(
          Object.freeze({
            id: entity.id,
            type: entity.type,
            x: entity.x,
            y: entity.y + this.gravity,
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
   * Check whether an entity has a PositionComponent in its components array.
   */
  private hasPositionComponent(entity: Entity): boolean {
    const components = entity.components
    if (!components || components.length === 0) {
      return false
    }

    for (const component of components) {
      if (isPositionComponent(component)) {
        return true
      }
    }

    return false
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