/**
 * DefaultRuntimeWorldStore — default implementation of RuntimeWorldStore.
 *
 * Stores a single World reference. Initialized with an empty world
 * (zero entities). The stored world is always frozen.
 *
 * Pure. Stateless (single-mutation store). Frozen output.
 */
import type { World } from '@genesis/shared'
import type { RuntimeWorldStore } from './RuntimeWorldStore'

/** Empty world used as the initial state. */
const EMPTY_WORLD: World = { entities: [] }

export class DefaultRuntimeWorldStore implements RuntimeWorldStore {
  /** The internally stored world (always frozen). */
  private _world: World

  /**
   * Construct a DefaultRuntimeWorldStore.
   *
   * @param initialWorld — optional initial World (defaults to empty world)
   */
  constructor(initialWorld?: World) {
    this._world = initialWorld !== undefined ? Object.freeze(initialWorld) : Object.freeze(EMPTY_WORLD)
  }

  /**
   * Get the currently active world.
   *
   * @returns Frozen World
   */
  getWorld(): World {
    return this._world
  }

  /**
   * Set the currently active world.
   *
   * The new world is frozen before storage.
   *
   * @param world — the new World to store
   */
  setWorld(world: World): void {
    this._world = Object.freeze(world)
  }
}