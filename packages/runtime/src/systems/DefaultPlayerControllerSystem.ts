/**
 * DefaultPlayerControllerSystem — default implementation of PlayerControllerSystem.
 *
 * Accepts an InputProvider and optional movement speed at construction.
 * On each tick, reads the current keyboard state and computes a delta
 * vector. Iterates over all entities in the world; those with type 'player'
 * AND a PositionComponent have their position updated.
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
import { createPositionComponent, isPositionComponent } from '@genesis/shared'
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
   * @returns Frozen output World with player positions updated
   */
  update(world: World): World {
    const { movedPlayers } = this.applyInput(world)
    return movedPlayers === 0
      ? this.freezeCopy(world)
      : this.buildUpdatedWorld(world)
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
    const { deltaX, deltaY, movedPlayers } = this.applyInput(world)
    const outputWorld = movedPlayers === 0
      ? this.freezeCopy(world)
      : this.buildUpdatedWorld(world)

    return Object.freeze({
      world: outputWorld,
      result: Object.freeze({
        movedPlayers,
        deltaX,
        deltaY,
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
  } {
    const inputState = this.inputProvider.getState()
    const deltaX = this.computeDeltaX(inputState)
    const deltaY = this.computeDeltaY(inputState)

    if (deltaX === 0 && deltaY === 0) {
      return { movedPlayers: 0, deltaX: 0, deltaY: 0 }
    }

    let movedPlayers = 0

    for (const entity of world.entities) {
      if (entity.type === 'player' && this.hasPositionComponent(entity)) {
        movedPlayers++
      }
    }

    return { movedPlayers, deltaX, deltaY }
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
   * Build a new frozen World with updated player entity positions.
   */
  private buildUpdatedWorld(world: World): World {
    const inputState = this.inputProvider.getState()
    const deltaX = this.computeDeltaX(inputState)
    const deltaY = this.computeDeltaY(inputState)
    const updatedEntities: Entity[] = []

    for (const entity of world.entities) {
      if (entity.type === 'player' && this.hasPositionComponent(entity)) {
        const oldComponent = this.findPositionComponent(entity)!
        const newX = oldComponent.properties.x + deltaX
        const newY = oldComponent.properties.y + deltaY
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
            x: entity.x + deltaX,
            y: entity.y + deltaY,
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