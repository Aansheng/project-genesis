/**
 * RuntimeWorldStore — mutable store for the active Runtime World.
 *
 * Provides a single source of truth for the currently active game world.
 * The store can be read by the visualization loop and written by the
 * AI generation pipeline when a new world is created.
 *
 * This is NOT an event system. This is a pure data store.
 * No subscriptions, no observers, no reactive bindings.
 *
 * Design principles:
 * - Minimal: single get/set contract
 * - Deterministic: set then get always returns what was set
 * - Immutable output: getWorld() returns a frozen World
 * - Framework-independent: no Vue, Pinia, or web framework imports
 * - UI-independent: no ViewModel or UI type imports
 */
import type { World } from '@genesis/shared'

export interface RuntimeWorldStore {
  /**
   * Get the currently active world.
   *
   * Always returns a valid World (never undefined or null).
   * The returned World is frozen.
   *
   * @returns Frozen World
   */
  getWorld(): World

  /**
   * Set the currently active world.
   *
   * Replaces the stored world entirely. The new world is frozen
   * before storage.
   *
   * @param world — the new World to store
   */
  setWorld(world: World): void
}