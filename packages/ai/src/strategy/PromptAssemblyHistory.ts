import type { PromptAssemblyHistoryEntry } from './PromptAssemblyHistoryEntry'

/**
 * PromptAssemblyHistory — a dedicated history of PromptAssemblyTrace entries
 * across multiple builds.
 *
 * The history captures the sequential history of prompt assembly builds,
 * enabling downstream consumers (observers, loggers, debug UIs) to inspect
 * how the assembly evolved over time.
 *
 * This is a dedicated history abstraction, distinct from PromptAssemblyTimeline
 * which represents a collection of traces with additional metadata.
 *
 * Design principles:
 * - Immutable: all fields are readonly
 * - Pure data: no methods, no behavior
 * - Independent: no dependencies on Planner, Runtime, Provider, or Pipeline
 * - Extensible: future fields can be added without breaking changes
 */
export interface PromptAssemblyHistory {
  /**
   * Ordered list of history entries.
   * Entries are in build order (index 0 = first build).
   */
  readonly entries: readonly PromptAssemblyHistoryEntry[]
}