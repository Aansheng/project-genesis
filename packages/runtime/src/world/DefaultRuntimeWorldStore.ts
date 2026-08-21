/**
 * DefaultRuntimeWorldStore — default implementation of RuntimeWorldStore.
 *
 * Stores a single World reference. Initialized with an empty world
 * (zero entities). The stored world is always frozen.
 *
 * Minimal mutable holder with frozen output. An optional Runtime event
 * collector observes committed entity ID-set deltas; it is not a subscription
 * API or a generic event bus.
 */
import type { World } from '@genesis/shared'
import type { RuntimeWorldStore } from './RuntimeWorldStore'
import type { RuntimeGameplayEventCollector } from '../events'

/** Empty world used as the initial state. */
const EMPTY_WORLD: World = { entities: [] }

export class DefaultRuntimeWorldStore implements RuntimeWorldStore {
  /** The internally stored world (always frozen). */
  private _world: World
  private readonly gameplayEventCollector?: RuntimeGameplayEventCollector

  /**
   * Construct a DefaultRuntimeWorldStore.
   *
   * @param initialWorld — optional initial World (defaults to empty world)
   */
  constructor(initialWorld?: World, gameplayEventCollector?: RuntimeGameplayEventCollector) {
    this._world = initialWorld !== undefined ? Object.freeze(initialWorld) : Object.freeze(EMPTY_WORLD)
    this.gameplayEventCollector = gameplayEventCollector
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
    const previousWorld = this._world
    this._world = Object.freeze(world)
    this.gameplayEventCollector?.observeWorldMutation(previousWorld, this._world)
  }
}
