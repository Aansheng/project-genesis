/**
 * DefaultWorldMutator — default implementation of WorldMutator.
 *
 * Provides immutable world mutation operations. Each method takes a
 * World and returns a new World without mutating the input.
 *
 * Behaviors:
 * - Pure: no side effects, no I/O, no external calls
 * - Stateless: no internal state between operations
 * - Deterministic: same input always produces same output
 * - Immutable: outputs are always deeply frozen; inputs are never mutated
 * - Defensive: safe handling of edge cases (missing entities, etc.)
 *
 * Rules:
 * - addEntity: appends entity to the world's entity list
 * - removeEntity: removes entity by matching entity.id; returns world
 *   unchanged if no match found
 * - replaceEntity: replaces entity by matching entity.id; appends if
 *   no match found
 *
 * Design principles:
 * - Simple: no ECS, no scheduling, no game logic
 * - Framework-independent: no Vue, Pinia, or web framework imports
 * - UI-independent: no ViewModel or UI type imports
 */
import type { World, Entity } from '@genesis/shared'
import type { WorldMutator } from './WorldMutator'

export class DefaultWorldMutator implements WorldMutator {
  /**
   * Add an entity to the world.
   *
   * Appends the entity to the world's entity list and returns a new World.
   * The entity is frozen before being added.
   *
   * @param world — immutable input World
   * @param entity — the entity to add
   * @returns Frozen World with the entity appended
   */
  addEntity(world: World, entity: Entity): World {
    const frozenEntity = Object.freeze({ ...entity }) as unknown as Entity
    return Object.freeze({
      entities: Object.freeze([...world.entities, frozenEntity]),
    }) as unknown as World
  }

  /**
   * Remove an entity from the world by id.
   *
   * Finds the entity with the matching id and removes it. If no entity
   * with the given id exists, returns the world unchanged.
   *
   * @param world — immutable input World
   * @param entityId — the id of the entity to remove
   * @returns Frozen World without the removed entity
   */
  removeEntity(world: World, entityId: string): World {
    const remaining = world.entities.filter((e) => e.id !== entityId)
    if (remaining.length === world.entities.length) {
      // No match — return frozen copy
      return Object.freeze({
        entities: Object.freeze([...world.entities]),
      }) as unknown as World
    }
    return Object.freeze({
      entities: Object.freeze(remaining),
    }) as unknown as World
  }

  /**
   * Replace an entity in the world by id.
   *
   * Matches by entity.id and replaces the entity. If no entity with
   * the given id exists, appends the entity.
   *
   * @param world — immutable input World
   * @param entity — the replacement entity
   * @returns Frozen World with the entity replaced (or appended)
   */
  replaceEntity(world: World, entity: Entity): World {
    const frozenEntity = Object.freeze({ ...entity }) as unknown as Entity
    const index = world.entities.findIndex((e) => e.id === entity.id)

    if (index === -1) {
      // No match — append
      return Object.freeze({
        entities: Object.freeze([...world.entities, frozenEntity]),
      }) as unknown as World
    }

    const newEntities = [...world.entities]
    newEntities[index] = frozenEntity
    return Object.freeze({
      entities: Object.freeze(newEntities),
    }) as unknown as World
  }
}