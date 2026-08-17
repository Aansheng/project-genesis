/**
 * DefaultJumpSystem — default implementation of JumpSystem.
 *
 * Accepts an InputProvider and optional initial jump speed at construction.
 * A Space press edge gives grounded players a negative VelocityComponent.y.
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
 * - Deterministic: same (world, inputState, jumpVelocity) produces the same output
 * - Immutable: output World is deeply frozen; input is never mutated
 * - Entity without 'player' type: ignored (passed through unchanged)
 * - Entity without PositionComponent: ignored
 * - Space not pressed: no-op (returns frozen copy)
 * - Empty world: no-op (returns frozen copy)
 *
 * Design principles:
 * - Minimal: single responsibility — upward impulse on Space press
 * - Foundation only: no physics engine, no acceleration integration, no double jump
 * - Framework-independent: no Vue, Pinia, or web framework imports
 * - UI-independent: no ViewModel or UI type imports
 */
import type { World, Entity } from '@genesis/shared'
import { createVelocityComponent, isPositionComponent, isVelocityComponent } from '@genesis/shared'
import type { InputProvider } from '../input'
import type { JumpSystem } from './JumpSystem'
import type { JumpSystemResult } from './JumpSystemResult'
import type { PositionComponent } from '@genesis/shared'

export class DefaultJumpSystem implements JumpSystem {
  readonly name = 'JumpSystem'

  private readonly inputProvider: InputProvider
  private readonly jumpVelocity: number
  private previousSpacePressed = false

  /**
   * @param inputProvider  — source of keyboard state for each tick
   * @param jumpVelocity   — initial upward velocity (default: -10)
   */
  constructor(inputProvider: InputProvider, jumpVelocity: number = 10) {
    this.inputProvider = inputProvider
    this.jumpVelocity = -Math.abs(jumpVelocity)
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
        jumpHeight: Math.abs(this.jumpVelocity),
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
    const inputState = this.inputProvider.getState()
    const spacePressed = inputState.isPressed('Space')
    const pressedEdge = spacePressed && !this.previousSpacePressed
    this.previousSpacePressed = spacePressed
    if (!pressedEdge) {
      return { jumpedPlayers: 0 }
    }

    let jumpedPlayers = 0

    for (const entity of world.entities) {
      if (entity.type === 'player' && this.canJump(entity)) {
        jumpedPlayers++
      }
    }

    return { jumpedPlayers }
  }

  /**
   * Build a new frozen World with updated player entity positions.
   */
  private buildUpdatedWorld(world: World): World {
    const updatedEntities: Entity[] = []

    for (const entity of world.entities) {
      if (entity.type === 'player' && this.canJump(entity)) {
        const velocity = this.findVelocityComponent(entity)
        const newVelocityComponent = createVelocityComponent(
          velocity?.properties.x ?? 0,
          this.jumpVelocity,
        )

        const hasVelocity = entity.components?.some(isVelocityComponent) ?? false
        const updatedComponents = entity.components
          ? Object.freeze([
              ...entity.components.map((c) =>
                isVelocityComponent(c) ? newVelocityComponent : c,
              ),
              ...(hasVelocity ? [] : [newVelocityComponent]),
            ])
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

  private canJump(entity: Entity): boolean {
    const position = this.findPositionComponent(entity)
    if (!position) return false
    const velocity = this.findVelocityComponent(entity)
    return !velocity || velocity.properties.y === 0
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

  private findVelocityComponent(entity: Entity) {
    return entity.components?.find(isVelocityComponent)
  }
}
