/**
 * DefaultPlayerControllerSystem — default implementation of PlayerControllerSystem.
 *
 * Accepts an InputProvider and optional movement speed at construction.
 * On each tick, reads the current keyboard state and computes a delta
 * vector. Horizontal input is written to the Player's VelocityComponent.x;
 * the existing VerticalMotionSystem then integrates that velocity into the
 * PositionComponent. Legacy direct vertical-arrow movement remains unchanged.
 *
 * Input mapping:
 *   ArrowLeft  → x -= speed
 *   ArrowRight → x += speed
 *   ArrowUp    → y -= speed
 *   ArrowDown  → y += speed
 *
 * Diagonal movement is supported (e.g., ArrowRight + ArrowDown → (speed, speed)).
 * No key pressed → zero delta → no entities moved.
 *
 * Two entry points:
 * - update(world):              pure World → World transformation (RuntimeSystem contract)
 * - updateWithResult(world):    returns both the output World and PlayerControllerResult
 *
 * Behaviors:
 * - Pure: no side effects, no I/O, no external calls beyond getState()
 * - Stateless: no internal state between ticks (InputProvider is external state)
 * - Deterministic: same (world, inputState, speed) always produces same output
 * - Immutable: output World is deeply frozen; input is never mutated
 * - Entity without 'player' type: ignored (passed through unchanged)
 * - Entity without PositionComponent: ignored
 * - Empty world: no-op (returns frozen copy)
 *
 * Design principles:
 * - Minimal: single responsibility — input-driven player movement
 * - Foundation only: no physics, no collision, no gameplay logic
 * - Framework-independent: no Vue, Pinia, or web framework imports
 * - UI-independent: no ViewModel or UI type imports
 */

import type { World, Entity } from '@genesis/shared'
import {
  createPositionComponent,
  createVelocityComponent,
  isPositionComponent,
  isVelocityComponent,
} from '@genesis/shared'
import type { InputKey, InputProvider } from '../input'
import type { PlayerControllerSystem } from './PlayerControllerSystem'
import type { PlayerControllerResult } from './PlayerControllerResult'
import type { PositionComponent } from '@genesis/shared'

export class DefaultPlayerControllerSystem implements PlayerControllerSystem {
  readonly name = 'PlayerControllerSystem'

  private readonly inputProvider: InputProvider
  private readonly speed: number

  /**
   * @param inputProvider  — source of keyboard state for each tick
   * @param movementSpeed  — pixel(s) per tick (default: 1)
   */
  constructor(inputProvider: InputProvider, movementSpeed: number = 1) {
    this.inputProvider = inputProvider
    this.speed = movementSpeed
  }

  /**
   * Apply input-driven movement to all player entities.
   *
   * @param world — immutable input World
   * @returns Frozen output World with horizontal velocity and legacy vertical
   * position updated
   */
  update(world: World): World {
    const input = this.applyInput(world)
    return input.requiresWorldUpdate
      ? this.buildUpdatedWorld(world, input.deltaX, input.deltaY)
      : this.freezeCopy(world)
  }

  /**
   * Apply input-driven movement and return full execution metadata.
   *
   * @param world — immutable input World
   * @returns Frozen World and PlayerControllerResult
   */
  updateWithResult(world: World): {
    world: World
    result: PlayerControllerResult
  } {
    const input = this.applyInput(world)
    const outputWorld = input.requiresWorldUpdate
      ? this.buildUpdatedWorld(world, input.deltaX, input.deltaY)
      : this.freezeCopy(world)

    return Object.freeze({
      world: outputWorld,
      result: Object.freeze({
        movedPlayers: input.movedPlayers,
        deltaX: input.deltaX,
        deltaY: input.deltaY,
      }),
    })
  }

  // ---------------------------------------------------------------------------
  // Private Helpers
  // ---------------------------------------------------------------------------

  /**
   * Read the input state and compute how many player entities would move.
   * Returns the delta vector and count.
   */
  private applyInput(world: World): {
    movedPlayers: number
    deltaX: number
    deltaY: number
    requiresWorldUpdate: boolean
  } {
    const inputState = this.inputProvider.getState()
    const deltaX = this.computeDeltaX(inputState)
    const deltaY = this.computeDeltaY(inputState)

    let movedPlayers = 0
    let requiresWorldUpdate = false

    for (const entity of world.entities) {
      if (entity.type === 'player' && this.hasPositionComponent(entity)) {
        if (deltaX !== 0 || deltaY !== 0) {
          movedPlayers++
          requiresWorldUpdate = true
        } else if (this.findVelocityComponent(entity)?.properties.x !== 0) {
          // Released horizontal input must clear the previous motion truth.
          requiresWorldUpdate = true
        }
      }
    }

    return { movedPlayers, deltaX, deltaY, requiresWorldUpdate }
  }

  /**
   * Compute the X displacement from the current input state.
   */
  private computeDeltaX(state: { isPressed(key: InputKey): boolean }): number {
    let dx = 0
    if (state.isPressed('ArrowLeft'))  dx -= this.speed
    if (state.isPressed('ArrowRight')) dx += this.speed
    return dx
  }

  /**
   * Compute the Y displacement from the current input state.
   */
  private computeDeltaY(state: { isPressed(key: InputKey): boolean }): number {
    let dy = 0
    if (state.isPressed('ArrowUp'))   dy -= this.speed
    if (state.isPressed('ArrowDown')) dy += this.speed
    return dy
  }

  /**
   * Build a new frozen World with horizontal velocity and legacy vertical
   * position updated. Horizontal position is integrated by VerticalMotionSystem.
   */
  private buildUpdatedWorld(world: World, deltaX: number, deltaY: number): World {
    const updatedEntities: Entity[] = []

    for (const entity of world.entities) {
      if (entity.type === 'player' && this.hasPositionComponent(entity)) {
        const oldComponent = this.findPositionComponent(entity)!
        const newY = oldComponent.properties.y + deltaY
        const newPositionComponent = createPositionComponent(oldComponent.properties.x, newY)
        const oldVelocity = this.findVelocityComponent(entity)
        const newVelocityComponent = createVelocityComponent(
          deltaX,
          oldVelocity?.properties.y ?? 0,
        )

        const updatedComponents = entity.components
          ? Object.freeze(
              [
                ...entity.components.map((component) =>
                  isPositionComponent(component)
                    ? newPositionComponent
                    : isVelocityComponent(component)
                      ? newVelocityComponent
                      : component,
                ),
                ...(oldVelocity ? [] : [newVelocityComponent]),
              ],
            )
          : Object.freeze([newPositionComponent, newVelocityComponent])

        updatedEntities.push(
          Object.freeze({
            id: entity.id,
            type: entity.type,
            x: entity.x,
            y: newY,
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

  /** Find the current authoritative motion vector, when one exists. */
  private findVelocityComponent(entity: Entity) {
    return entity.components?.find(isVelocityComponent)
  }
}
