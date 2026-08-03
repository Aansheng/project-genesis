import type { StrategySelectionMetadata } from './StrategySelectionMetadata'

/**
 * StrategySelectionRenderer — renders StrategySelectionMetadata into a
 * formatted string for metadata storage and inspection.
 *
 * The rendered output is stored in metadata.promptAssembly.strategySelectionRendered
 * and does NOT affect the final prompt output.
 *
 * Design principles:
 * - Pure: same metadata always produces same string
 * - Stateless: no internal state between calls
 * - Deterministic: no randomness or external factors
 * - No dependencies on Planner, Runtime, Provider, Memory, AgentLoop, or Pipeline
 */
export interface StrategySelectionRenderer {
  /**
   * Render strategy selection metadata into a formatted string.
   *
   * @param metadata — The strategy selection metadata to render
   * @returns A formatted string representation of the selection data
   */
  render(
    metadata: StrategySelectionMetadata
  ): string
}