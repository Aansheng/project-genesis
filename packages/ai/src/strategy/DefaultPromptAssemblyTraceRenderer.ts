import type { PromptAssemblyTrace } from './PromptAssemblyTrace'
import type { PromptAssemblyTraceRenderer } from './PromptAssemblyTraceRenderer'

/**
 * Known trace fields in declaration order.
 *
 * This order is significant — the renderer preserves this order when
 * listing components, ensuring deterministic, predictable output.
 */
const TRACE_COMPONENT_FIELDS: ReadonlyArray<keyof PromptAssemblyTrace> = [
  'strategySelection',
  'plan',
  'optimizedPlan',
  'planDiff',
  'snapshot',
  'inspector',
  'inspectorRendered',
  'inspectorExported',
]

/**
 * DefaultPromptAssemblyTraceRenderer — default implementation of
 * PromptAssemblyTraceRenderer.
 *
 * Renders a PromptAssemblyTrace into a formatted, human-readable string:
 *
 * ```
 * Prompt Assembly Trace
 *
 * Strategy:
 * create
 *
 * Components:
 *
 * - strategySelection
 * - plan
 * - optimizedPlan
 * - planDiff
 * - snapshot
 * - inspector
 * - inspectorRendered
 * - inspectorExported
 * ```
 *
 * Rules:
 * - If strategy exists: output "Strategy:\n<strategy name or representation>"
 * - If no strategy: omit Strategy section entirely
 * - If no components (only strategy or empty): output "Prompt Assembly Trace\n\nNo Components"
 * - Component order follows PromptAssemblyTrace field declaration order
 * - The `strategy` field is rendered separately as a header; all other
 *   present fields are listed as components
 *
 * Properties:
 * - Pure: same trace always produces same string
 * - Stateless: no internal state between calls
 * - Deterministic: no randomness or external factors
 * - Immutable: never modifies the input trace
 * - Zero dependencies on Planner, Runtime, Provider, Memory, AgentLoop, or Pipeline
 *
 * Foundation only — not consumed by PromptBuilder yet.
 */
export class DefaultPromptAssemblyTraceRenderer implements PromptAssemblyTraceRenderer {
  render(trace: PromptAssemblyTrace): string {
    const lines: string[] = ['Prompt Assembly Trace', '']

    // Strategy section — only when strategy field is present
    if (trace.strategy !== undefined) {
      const strategyValue = this.renderStrategyValue(trace.strategy)
      lines.push('Strategy:')
      lines.push(strategyValue)
      lines.push('')
    }

    // Components section — all other present fields in declaration order
    const presentComponents: string[] = []
    for (const field of TRACE_COMPONENT_FIELDS) {
      if (trace[field] !== undefined) {
        presentComponents.push(field)
      }
    }

    if (presentComponents.length === 0) {
      lines.push('No Components')
    } else {
      lines.push('Components:')
      lines.push('')
      for (const component of presentComponents) {
        lines.push(`- ${component}`)
      }
    }

    return lines.join('\n')
  }

  /**
   * Render the strategy field value to a string.
   *
   * Handles both object values (extracting name) and primitive values.
   */
  private renderStrategyValue(value: unknown): string {
    if (
      value !== null &&
      typeof value === 'object' &&
      'name' in value &&
      typeof (value as Record<string, unknown>).name === 'string'
    ) {
      return (value as Record<string, unknown>).name as string
    }
    return String(value)
  }
}