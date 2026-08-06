import type { PromptAssemblyHistory } from './PromptAssemblyHistory'
import type { PromptAssemblyHistorySnapshot } from './PromptAssemblyHistorySnapshot'
import type { PromptAssemblyHistorySnapshotBuilder } from './PromptAssemblyHistorySnapshotBuilder'

/**
 * DefaultPromptAssemblyHistorySnapshotBuilder — default implementation of
 * PromptAssemblyHistorySnapshotBuilder.
 *
 * Extracts condensed summary data from a PromptAssemblyHistory:
 * - entryCount: number of entries (undefined when empty)
 * - firstStrategy: strategy name of the first entry (undefined when empty)
 * - lastStrategy: strategy name of the last entry (undefined when empty)
 * - strategies: ordered list of all strategy names (undefined when empty)
 *
 * Optional metadata fields:
 * - historyRendered (string) → snapshot.rendered
 * - historyExported (string) → snapshot.exported
 *
 * Unknown metadata keys are silently ignored.
 * Strategy names are extracted from `entry.trace?.strategy`.
 * When strategy is not an object with a string name, "unknown" is used.
 *
 * Properties:
 * - Pure: same history + metadata always produces same snapshot
 * - Stateless: no internal state between calls
 * - Deterministic: no randomness or external factors
 * - Immutable: never modifies the input history or metadata
 * - Zero dependencies on Planner, Runtime, Provider, Memory, AgentLoop, or Pipeline
 *
 * Foundation only — not consumed by PromptBuilder yet.
 */
export class DefaultPromptAssemblyHistorySnapshotBuilder
  implements PromptAssemblyHistorySnapshotBuilder {

  build(
    history: PromptAssemblyHistory,
    metadata?: Record<string, unknown>,
  ): PromptAssemblyHistorySnapshot {
    const entries = history.entries
    const entryCount = entries.length

    if (entryCount === 0) {
      return {
        entryCount: undefined,
        firstStrategy: undefined,
        lastStrategy: undefined,
        strategies: undefined,
        ...(typeof metadata?.historyRendered === 'string'
          ? { rendered: metadata.historyRendered }
          : {}),
        ...(typeof metadata?.historyExported === 'string'
          ? { exported: metadata.historyExported }
          : {}),
      }
    }

    const strategies = entries.map(
      (entry) => {
        const strategy = entry.trace?.strategy as { name?: string } | null | undefined
        if (strategy && typeof strategy === 'object' && typeof strategy.name === 'string') {
          return strategy.name
        }
        return 'unknown'
      },
    )

    return {
      entryCount,
      firstStrategy: strategies[0],
      lastStrategy: strategies[strategies.length - 1],
      strategies,
      ...(typeof metadata?.historyRendered === 'string'
        ? { rendered: metadata.historyRendered }
        : {}),
      ...(typeof metadata?.historyExported === 'string'
        ? { exported: metadata.historyExported }
        : {}),
    }
  }
}