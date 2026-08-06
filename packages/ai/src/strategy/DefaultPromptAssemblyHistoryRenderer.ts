import type { PromptAssemblyHistory } from './PromptAssemblyHistory'
import type { PromptAssemblyHistoryRenderer } from './PromptAssemblyHistoryRenderer'

/**
 * DefaultPromptAssemblyHistoryRenderer — default implementation of
 * PromptAssemblyHistoryRenderer.
 *
 * Renders a PromptAssemblyHistory into a formatted, human-readable string:
 *
 * Non-empty:
 * ```
 * Prompt Assembly History
 *
 * Entries:
 *
 * #0 create
 * #1 modify
 * #2 query
 * ```
 *
 * Empty:
 * ```
 * Prompt Assembly History
 *
 * No Entries
 * ```
 *
 * Rendering rules:
 * - Each entry is rendered as `#<index> <strategy>`, one per line
 * - Strategy is extracted from `entry.trace.strategy?.name`
 * - When strategy name is unavailable, renders "unknown"
 * - Entries preserve history order — no sorting
 * - Unknown strategy renders as "unknown"
 *
 * Properties:
 * - Pure: same history always produces same string
 * - Stateless: no internal state between calls
 * - Deterministic: no randomness or external factors
 * - Immutable: never modifies the input history
 * - Zero dependencies on Planner, Runtime, Provider, Memory, AgentLoop, or Pipeline
 *
 * Foundation only — not consumed by PromptBuilder yet.
 */
export class DefaultPromptAssemblyHistoryRenderer
  implements PromptAssemblyHistoryRenderer
{
  render(history: PromptAssemblyHistory): string {
    const lines: string[] = ['Prompt Assembly History', '']

    if (history.entries.length === 0) {
      lines.push('No Entries')
      return lines.join('\n')
    }

    lines.push('Entries:')
    lines.push('')

    for (const entry of history.entries) {
      const strategyName = this.extractStrategyName(entry.trace.strategy)
      lines.push(`#${entry.index} ${strategyName}`)
    }

    return lines.join('\n')
  }

  /**
   * Extract the strategy name from a strategy field value.
   *
   * Handles object values with a `name` property and falls back to
   * "unknown" when the strategy is unavailable.
   */
  private extractStrategyName(strategy: unknown): string {
    if (
      strategy !== null &&
      strategy !== undefined &&
      typeof strategy === 'object' &&
      'name' in strategy &&
      typeof (strategy as Record<string, unknown>).name === 'string'
    ) {
      return (strategy as Record<string, unknown>).name as string
    }
    return 'unknown'
  }
}