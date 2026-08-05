import type { PromptAssemblyTimeline } from './PromptAssemblyTimeline'
import type { PromptAssemblyTimelineEntry } from './PromptAssemblyTimelineEntry'
import type { PromptAssemblyTimelineRenderer } from './PromptAssemblyTimelineRenderer'

/**
 * DefaultPromptAssemblyTimelineRenderer — default implementation of
 * PromptAssemblyTimelineRenderer.
 *
 * Renders a PromptAssemblyTimeline into a formatted, human-readable string:
 *
 * ```
 * Prompt Assembly Timeline
 *
 * Entries:
 *
 * #0 create
 * #1 modify
 * #2 query
 * ```
 *
 * Rules:
 * - Non-empty timeline: header "Prompt Assembly Timeline", blank line,
 *   "Entries:", blank line, then each entry as "#{index} {strategyName}"
 * - Empty timeline: header "Prompt Assembly Timeline", blank line,
 *   "No Entries"
 * - Strategy name extracted from `entry.trace.strategy?.name`
 * - When strategy or name is missing: "#{index} unknown"
 * - Entries preserve timeline order — no sorting
 *
 * Properties:
 * - Pure: same timeline always produces same string
 * - Stateless: no internal state between calls
 * - Deterministic: no randomness or external factors
 * - Immutable: never modifies the input timeline
 * - Zero dependencies on Planner, Runtime, Provider, Memory, AgentLoop, or Pipeline
 *
 * Foundation only — not consumed by PromptBuilder yet.
 */
export class DefaultPromptAssemblyTimelineRenderer
  implements PromptAssemblyTimelineRenderer
{
  render(timeline: PromptAssemblyTimeline): string {
    const lines: string[] = ['Prompt Assembly Timeline', '']

    if (timeline.entries.length === 0) {
      lines.push('No Entries')
    } else {
      lines.push('Entries:')
      lines.push('')
      for (const entry of timeline.entries) {
        lines.push(this.renderEntry(entry))
      }
    }

    return lines.join('\n')
  }

  /**
   * Render a single timeline entry as a formatted string.
   *
   * Format: "#{index} {strategyName}"
   * When strategy name is unavailable: "#{index} unknown"
   */
  private renderEntry(entry: PromptAssemblyTimelineEntry): string {
    const strategyName = this.getStrategyName(entry)
    return `#${entry.index} ${strategyName}`
  }

  /**
   * Extract the strategy name from a timeline entry.
   *
   * Tries to read `entry.trace.strategy?.name` as a string.
   * Falls back to "unknown" when strategy or name is missing.
   */
  private getStrategyName(entry: PromptAssemblyTimelineEntry): string {
    const strategy = entry.trace.strategy
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