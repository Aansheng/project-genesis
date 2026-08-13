/**
 * DefaultMovementSystem — default implementation of MovementSystem.
 *
 * Accepts a fixed (deltaX, deltaY) offset at construction. On each tick,
 * iterates over all entities in the world. Entities that carry a
 * PositionComponent in their components array have their x and y
 * coordinates incremented by deltaX and deltaY respectively.
 *
 * Entities without a PositionComponent are passed through unchanged.
 *
 * Two entry points:
 * - update(world):       pure World → World transformation (RuntimeSystem contract)
 * - updateWithResult(world): returns both the output World and MovementSystemResult
 *
 * Behaviors:
 * - Pure: no side effects, no I/O, no external calls
 * - Stateless: no internal state between ticks
 * - Deterministic: same (world, deltaX, deltaY) always produces same output
 * - Immutable: output World is deeply frozen; input is never mutated
 * - Entity without PositionComponent: ignored (passed through unchanged)
 * - Empty world: no-op (returns frozen copy)
 *
 * Design principles:
 * - Minimal: single responsibility — apply delta to entities with PositionComponent
 * - Foundation only: no physics, no collision, no input, no AI
 * - Framework-independent: no Vue, Pinia, or web framework imports
 * - UI-independent: no ViewModel or UI type imports
 */
import type { World, Entity } from '@genesis/shared'
import {
  isPositionComponent,
} from '@genesis/shared'
import type { MovementSystem } from './MovementSystem'
import type { MovementSystemResult } from './MovementSystemResult'

export class DefaultMovementSystem implements MovementSystem {
  readonly name = 'MovementSystem'

  private readonly deltaX: number
  private readonly deltaY: number

  /**
   * @param deltaX — the X offset to apply each tick
   * @param deltaY — the Y offset to apply each tick
   */
  constructor(deltaX: number, deltaY: number) {
    this.deltaX = deltaX
    this.deltaY = deltaY
  }

  /**
   * Apply the movement offset to all entities with a PositionComponent.
   *
   * @param world — immutable input World
   * @returns Frozen output World with positions updated
   */
  update(world: World): World {
    const { movedEntities } = this.applyMovement(world)
    return movedEntities === 0
      ? this.freezeCopy(world)
      : this.buildUpdatedWorld(world)
  }

  /**
   * Apply the movement offset and return full execution metadata.
   *
   * @param world — immutable input World
   * @returns Frozen World and metadata
   */
  updateWithResult(world: World): {
    world: World
    result: MovementSystemResult
  } {
    const { movedEntities } = this.applyMovement(world)
    const outputWorld = movedEntities === 0
      ? this.freezeCopy(world)
      : this.buildUpdatedWorld(world)

    return Object.freeze({
      world: outputWorld,
      result: Object.freeze({
        movedEntities,
        deltaX: this.deltaX,
        deltaY: this.deltaY,
      }),
    })
  }

  // ---------------------------------------------------------------------------
  // Private Helpers
  // ---------------------------------------------------------------------------

  /**
   * Determine whether any entities need movement and count how many.
   * Returns the updated entity list (if changes needed) and the count.
   */
  private applyMovement(world: World): {
    movedEntities: number
  } {
    let movedEntities = 0

    for (const entity of world.entities) {
      if (this.hasPositionComponent(entity)) {
        movedEntities++
      }
    }

    return { movedEntities }
  }

  /**
   * Build a new frozen World with updated entity positions.
   */
  private buildUpdatedWorld(world: World): World {
    const updatedEntities: Entity[] = []

    for (const entity of world.entities) {
      if (this.hasPositionComponent(entity)) {
        updatedEntities.push(
          Object.freeze({
            id: entity.id,
            type: entity.type,
            x: entity.x + this.deltaX,
            y: entity.y + this.deltaY,
            components: entity.components,
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
}