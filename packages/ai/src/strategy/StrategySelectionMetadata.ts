/**
 * StrategySelectionMetadata — lightweight snapshot of a strategy selection result.
 *
 * Captures the selected strategy name and all evaluated candidates with
 * their scores, enabling downstream consumers to inspect selection reasoning
 * without depending on the full StrategySelectionResult / PromptStrategy
 * object graph.
 *
 * This is the metadata-friendly representation: strategy objects are reduced
 * to their names, keeping the structure small, serializable, and inspection-ready.
 *
 * Design principles:
 * - Immutable: all fields are readonly
 * - Pure data: no methods, no behavior
 * - Independent: no dependencies on Planner, Runtime, Provider, or Pipeline
 * - Serializable: only primitive types (string, number)
 *
 * Future: Multi Strategy Routing will consume this metadata to make
 * dynamic routing decisions based on candidate scores.
 *
 * @see StrategySelectionResult — full object-graph version (strategy objects, not just names)
 * @see StrategyCandidate — per-candidate score (strategy object + score)
 */
export interface StrategySelectionMetadata {
  /** Name of the selected strategy */
  readonly selected: string
  /** All evaluated candidates with their strategy names and scores */
  readonly candidates: readonly {
    readonly strategy: string
    readonly score: number
  }[]
}
