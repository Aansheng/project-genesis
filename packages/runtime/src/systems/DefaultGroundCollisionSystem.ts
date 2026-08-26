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
 * - World transformation is pure; optional event sinks receive observations
 * - Bounded landing state is held only for the current Runtime world/session
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
import type { GameplayEventSink, World, Entity } from '@genesis/shared'
import {
  isCollisionBoundsComponent,
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
  private eventSink: GameplayEventSink | undefined
  private readonly groundedByEntityId = new Map<string, boolean>()

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
    const outputWorld = groundedEntities === 0
      ? this.freezeCopy(world)
      : this.buildUpdatedWorld(world)
    this.observeLanding(outputWorld)
    return outputWorld
  }

  setGameplayEventSink(sink: GameplayEventSink): void {
    this.eventSink = sink
  }

  reset(): void {
    this.groundedByEntityId.clear()
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

    this.observeLanding(outputWorld)

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
      if (this.landingYFor(entity, world) !== undefined) {
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
      const landingY = this.landingYFor(entity, world)
      if (landingY !== undefined) {
        const oldComponent = this.findPositionComponent(entity)!
        const clampedY = landingY
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
   * Resolve the next support surface. The global ground plane remains the
   * fallback, while a semantic Platform is a bounded one-way surface: it only
   * catches a Player crossing its top while moving downward.
   */
  private landingYFor(entity: Entity, world: World): number | undefined {
    const component = this.findPositionComponent(entity)
    if (!component) return undefined

    if (entity.type === 'player') {
      const platformLandingY = this.platformLandingY(entity, world)
      if (platformLandingY !== undefined) return platformLandingY
    }

    return component.properties.y > this.groundY ? this.groundY : undefined
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

  private observeLanding(outputWorld: World): void {
    const presentIds = new Set<string>()
    for (const entity of outputWorld.entities) {
      const position = this.findPositionComponent(entity)
      if (!position) continue
      presentIds.add(entity.id)
      const grounded = position.properties.y >= this.groundY || this.isStandingOnPlatform(entity, outputWorld)
      const previous = this.groundedByEntityId.get(entity.id)
      if (previous === false && grounded) {
        this.eventSink?.emit({
          type: 'ENTITY_LANDED',
          actorEntityId: entity.id,
          position: position.properties,
        })
      }
      this.groundedByEntityId.set(entity.id, grounded)
    }
    for (const entityId of this.groundedByEntityId.keys()) {
      if (!presentIds.has(entityId)) this.groundedByEntityId.delete(entityId)
    }
  }

  private platformLandingY(player: Entity, world: World): number | undefined {
    const playerPosition = this.findPositionComponent(player)
    const playerBounds = player.components?.find(isCollisionBoundsComponent)
    const velocity = player.components?.find(isVelocityComponent)
    if (!playerPosition || !playerBounds || !velocity || velocity.properties.y <= 0) return undefined

    const playerLeft = playerPosition.properties.x + playerBounds.properties.offsetX - playerBounds.properties.width / 2
    const playerRight = playerPosition.properties.x + playerBounds.properties.offsetX + playerBounds.properties.width / 2
    // Player PositionComponent is the established feet contact point: global
    // GroundCollisionSystem clamps that value directly to groundY and the
    // Player Renderer uses it as the feet anchor. Platform support must use
    // the same production coordinate contract rather than treating Position as
    // the centre of the generic contact envelope.
    const currentFootY = playerPosition.properties.y
    const previousFootY = currentFootY - velocity.properties.y

    for (const platform of world.entities) {
      const platformPosition = this.findPositionComponent(platform)
      const platformBounds = platform.components?.find(isCollisionBoundsComponent)
      if (!this.isPlatform(platform) || !platformPosition || !platformBounds) continue
      const platformLeft = platformPosition.properties.x + platformBounds.properties.offsetX - platformBounds.properties.width / 2
      const platformRight = platformPosition.properties.x + platformBounds.properties.offsetX + platformBounds.properties.width / 2
      const platformTop = platformPosition.properties.y + platformBounds.properties.offsetY - platformBounds.properties.height / 2
      const overlapsHorizontally = playerLeft < platformRight && playerRight > platformLeft
      if (overlapsHorizontally && previousFootY <= platformTop && currentFootY >= platformTop) {
        return platformTop
      }
    }
    return undefined
  }

  private isStandingOnPlatform(player: Entity, world: World): boolean {
    const playerPosition = this.findPositionComponent(player)
    const playerBounds = player.components?.find(isCollisionBoundsComponent)
    if (!playerPosition || !playerBounds) return false
    const playerLeft = playerPosition.properties.x + playerBounds.properties.offsetX - playerBounds.properties.width / 2
    const playerRight = playerPosition.properties.x + playerBounds.properties.offsetX + playerBounds.properties.width / 2
    const playerFootY = playerPosition.properties.y
    return world.entities.some((platform) => {
      const platformPosition = this.findPositionComponent(platform)
      const platformBounds = platform.components?.find(isCollisionBoundsComponent)
      if (!this.isPlatform(platform) || !platformPosition || !platformBounds) return false
      const platformLeft = platformPosition.properties.x + platformBounds.properties.offsetX - platformBounds.properties.width / 2
      const platformRight = platformPosition.properties.x + platformBounds.properties.offsetX + platformBounds.properties.width / 2
      const platformTop = platformPosition.properties.y + platformBounds.properties.offsetY - platformBounds.properties.height / 2
      return playerLeft < platformRight
        && playerRight > platformLeft
        && Math.abs(playerFootY - platformTop) < 0.0001
    })
  }

  private isPlatform(entity: Entity): boolean {
    const semantic = entity.components?.find((component) => component.type === 'semantic')
    return semantic?.properties.category === 'terrain' && semantic.properties.name === 'Platform'
  }
}
