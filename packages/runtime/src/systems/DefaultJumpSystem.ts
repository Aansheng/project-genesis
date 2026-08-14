/**
 * DefaultJumpSystem — default implementation of JumpSystem.
 *
 * Accepts an InputProvider and optional jump height at construction.
 * On each tick, reads the current keyboard state. If the Space key is
 * pressed, all player entities (type === 'player') with a PositionComponent
 * have their y coordinate decreased by jumpHeight.
 *
 * Entities without type 'player' or without a PositionComponent are
 * passed through unchanged.
 *
 * Two entry points:
 * - update(world):              pure World → World transformation (RuntimeSystem contract)
 * - updateWithResult(world):    returns both the output World and JumpSystemResult
 *
 * Behaviors:
 * - Pure: no side effects, no I/O, no external calls beyond getState()
 * - Stateless: no internal state between ticks (InputProvider is external state)
 * - Deterministic: same (world, inputState, jumpHeight) always produces same output
 * - Immutable: output World is deeply frozen; input is never mutated
 * - Entity without 'player' type: ignored (passed through unchanged)
 * - Entity without PositionComponent: ignored
 * - Space not pressed: no-op (returns frozen copy)
 * - Empty world: no-op (returns frozen copy)
 *
 * Design principles:
 * - Minimal: single responsibility — upward impulse on Space press
 * - Foundation only: no physics engine, no velocity, no acceleration, no double jump
 * - Framework-independent: no Vue, Pinia, or web framework imports
 * - UI-independent: no ViewModel or UI type imports
 */
import type { World, Entity } from '@genesis/shared'
import { createPositionComponent, isPositionComponent } from '@genesis/shared'
import type { InputProvider } from '../input'
import type { JumpSystem } from './JumpSystem'
import type { JumpSystemResult } from './JumpSystemResult'
import type { PositionComponent } from '@genesis/shared'

/** Default jump height when none is specified. */
const DEFAULT_JUMP_HEIGHT = 50

export class DefaultJumpSystem implements JumpSystem {
  readonly name = 'JumpSystem'

  private readonly inputProvider: InputProvider
  private readonly jumpHeight: number

  /**
   * @param inputProvider  — source of keyboard state for each tick
   * @param jumpHeight     — pixels to move upward per Space press (default: 50)
   */
  constructor(inputProvider: InputProvider, jumpHeight: number = DEFAULT_JUMP_HEIGHT) {
    this.inputProvider = inputProvider
    this.jumpHeight = jumpHeight
  }

  /**
   * Apply upward impulse to all player entities if Space is pressed.
   *
   * @param world — immutable input World
   * @returns Frozen output World with player positions updated
   */
  update(world: World): World {
    const { jumpedPlayers } = this.applyJump(world)
    return jumpedPlayers === 0
      ? this.freezeCopy(world)
      : this.buildUpdatedWorld(world)
  }

  /**
   * Apply upward impulse and return full execution metadata.
   *
   * @param world — immutable input World
   * @returns Frozen World and JumpSystemResult
   */
  updateWithResult(world: World): {
    world: World
    result: JumpSystemResult
  } {
    const { jumpedPlayers } = this.applyJump(world)
    const outputWorld = jumpedPlayers === 0
      ? this.freezeCopy(world)
      : this.buildUpdatedWorld(world)

    return Object.freeze({
      world: outputWorld,
      result: Object.freeze({
        jumpedPlayers,
        jumpHeight: this.jumpHeight,
      }),
    })
  }

  // ---------------------------------------------------------------------------
  // Private Helpers
  // ---------------------------------------------------------------------------

  /**
   * Check if Space is pressed and count how many player entities would jump.
   */
  private applyJump(world: World): {
    jumpedPlayers: number
  } {
    // Check if Space is pressed and count how many player entities would jump.
    // Reading inputState directly rather than storing a variable we don't use.
    const inputState = this.inputProvider.getState()

    // No jump when Space is not pressed
    if (!inputState.isPressed('Space')) {
      return { jumpedPlayers: 0 }
    }

    let jumpedPlayers = 0

    for (const entity of world.entities) {
      if (entity.type === 'player' && this.hasPositionComponent(entity)) {
        jumpedPlayers++
      }
    }

    return { jumpedPlayers }
  }

  /**
   * Build a new frozen World with updated player entity positions.
   */
  private buildUpdatedWorld(world: World): World {
    // Space was pressed (pre-validated in applyJump), apply jump to all players
    const updatedEntities: Entity[] = []

    for (const entity of world.entities) {
      if (entity.type === 'player' && this.hasPositionComponent(entity)) {
        const oldComponent = this.findPositionComponent(entity)!
        const newY = oldComponent.properties.y - this.jumpHeight
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
            y: entity.y - this.jumpHeight,
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