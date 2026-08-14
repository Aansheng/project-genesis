/**
 * StoreBackedWorldProvider — wraps a RuntimeWorldStore as a VisualizationWorldProvider.
 *
 * Bridges the RuntimeWorldStore (mutable, written by AI pipeline) to the
 * visualization loop (read-only, consumed on each tick). Changes to the
 * store are immediately visible to the visualization loop on the next tick.
 *
 * Pure wrapper — no additional logic, no caching, no eventing.
 */
import type { World } from '@genesis/shared'
import type { RuntimeWorldStore } from '@genesis/runtime'
import type { VisualizationWorldProvider } from './VisualizationWorldProvider'

export class StoreBackedWorldProvider implements VisualizationWorldProvider {
  private readonly store: RuntimeWorldStore

  /**
   * @param store — the RuntimeWorldStore to wrap
   */
  constructor(store: RuntimeWorldStore) {
    this.store = store
  }

  /**
   * Get the current world from the underlying store.
   *
   * Delegates to store.getWorld(). The returned World is frozen.
   *
   * @returns Frozen World from the store
   */
  getWorld(): World {
    return this.store.getWorld()
  }
}