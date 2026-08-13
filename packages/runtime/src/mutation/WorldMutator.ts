/**
 * WorldMutator — immutable world mutation helpers.
 *
 * Provides a standard set of world mutation operations that follow the
 * immutable, pure, deterministic patterns established by the Runtime.
 * Each operation takes a World and returns a new World without mutating
 * the input.
 *
 * Operations:
 * - addEntity:     append an entity to the world
 * - removeEntity:  remove an entity by id
 * - replaceEntity: replace an entity by id
 *
 * Design principles:
 * - Pure: no side effects, no I/O, no external calls
 * - Stateless: no internal state between operations
 * - Deterministic: same input always produces same output
 * - Immutable: outputs are always frozen; inputs are never mutated
 * - Framework-independent: no Vue, Pinia, or web framework imports
 * - UI-independent: no ViewModel or UI type imports
 */
import type { World, Entity } from '@genesis/shared'

export interface WorldMutator {
  /**
   * Add an entity to the world.
   *
   * Appends the entity to the world's entity list and returns a new World.
   *
   * @param world — immutable input World
   * @param entity — the entity to add
   * @returns Frozen World with the entity appended
   */
  addEntity(world: World, entity: Entity): World

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
  removeEntity(world: World, entityId: string): World

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
  replaceEntity(world: World, entity: Entity): World
}