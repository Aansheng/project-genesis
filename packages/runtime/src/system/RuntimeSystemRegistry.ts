/**
 * RuntimeSystemRegistry — a registry for RuntimeSystem instances.
 *
 * Provides a read-only contract for registering, retrieving, and
 * clearing RuntimeSystem instances in the Runtime.
 *
 * Design principles:
 * - Minimal: just the contract, no assumptions about storage
 * - Type-safe: all operations are fully typed
 * - Framework-independent: no Vue, Pinia, or web framework imports
 * - UI-independent: no ViewModel or UI type imports
 */
import type { RuntimeSystem } from './RuntimeSystem'

export interface RuntimeSystemRegistry {
  /**
   * Register a system with the registry.
   *
   * Systems are identified by their name. If a system with the same
   * name already exists, it SHOULD be overwritten.
   *
   * @param system — the system to register
   */
  register(system: RuntimeSystem): void

  /**
   * Retrieve all registered systems.
   *
   * @returns An array of all registered RuntimeSystem instances
   */
  getSystems(): readonly RuntimeSystem[]

  /**
   * Remove all registered systems from the registry.
   */
  clear(): void
}