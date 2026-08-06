/**
 * PromptAssemblyHistorySnapshot — a condensed summary of a
 * PromptAssemblyHistory.
 *
 * Captures key metadata about the history: number of entries, first
 * and last strategy names, all strategies preserving order, and optional
 * rendered/exported representations pulled from metadata.
 *
 * Design principles:
 * - Immutable: all fields are readonly
 * - Pure data: no methods, no behavior
 * - Independent: no dependencies on Planner, Runtime, Provider, or Pipeline
 * - Extensible: future fields can be added without breaking changes
 */
export interface PromptAssemblyHistorySnapshot {
  /**
   * Number of entries in the history.
   * Undefined when the history is empty.
   */
  readonly entryCount?: number

  /**
   * Strategy name of the first history entry.
   * Undefined when the history is empty.
   */
  readonly firstStrategy?: string

  /**
   * Strategy name of the last history entry.
   * Undefined when the history is empty.
   */
  readonly lastStrategy?: string

  /**
   * Ordered list of all strategy names from the history entries,
   * preserving insertion order.
   * Undefined when the history is empty.
   */
  readonly strategies?: readonly string[]

  /**
   * Optional rendered representation from metadata.
   * Present when metadata.historyRendered is a string.
   */
  readonly rendered?: string

  /**
   * Optional exported representation from metadata.
   * Present when metadata.historyExported is a string.
   */
  readonly exported?: string
}