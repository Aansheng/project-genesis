/**
 * DefaultRuntimeSystemRegistry — default implementation of RuntimeSystemRegistry.
 *
 * Stores RuntimeSystem instances by name using a Map. Supports
 * registration, retrieval, and clearing of systems.
 *
 * Behaviors:
 * - Pure: no side effects beyond storage
 * - Deterministic: same operations always produce same state
 * - Immutable: getSystems returns a frozen snapshot
 * - Overwrite-conflict: registering a system with an existing name
 *   overwrites the previous system of that name
 *
 * Design principles:
 * - Simple: no ECS, no scheduling, no update loop
 * - Framework-independent: no Vue, Pinia, or web framework imports
 * - UI-independent: no ViewModel or UI type imports
 */
import type { RuntimeSystem } from './RuntimeSystem'
import type { RuntimeSystemRegistry } from './RuntimeSystemRegistry'

export class DefaultRuntimeSystemRegistry implements RuntimeSystemRegistry {
  private readonly systems = new Map<string, RuntimeSystem>()

  /**
   * Register a system with the registry.
   *
   * If a system with the same name already exists, it is overwritten.
   *
   * @param system — the system to register
   */
  register(system: RuntimeSystem): void {
    this.systems.set(system.name, system)
  }

  /**
   * Retrieve all registered systems.
   *
   * @returns A frozen array of all registered RuntimeSystem instances
   */
  getSystems(): readonly RuntimeSystem[] {
    return Object.freeze([...this.systems.values()])
  }

  /**
   * Remove all registered systems from the registry.
   */
  clear(): void {
    this.systems.clear()
  }
}