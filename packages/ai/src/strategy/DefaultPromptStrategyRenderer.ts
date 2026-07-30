import type { PromptStrategyRenderer } from './PromptStrategyRenderer'
import type { PromptStrategy } from './PromptStrategy'

/**
 * DefaultPromptStrategyRenderer — default implementation of PromptStrategyRenderer.
 *
 * Renders DefaultPromptStrategy as:
 * ```
 * Prompt Strategy:
 *
 * - default
 * ```
 *
 * For custom strategies (name !== 'default'), renders with the strategy name:
 * ```
 * Prompt Strategy:
 *
 * - create
 * ```
 *
 * Empty/blank strategy names return empty string.
 *
 * Properties:
 * - Pure function: same strategy always produces same string
 * - Stateless: no internal state between calls
 * - Deterministic: no randomness or external factors
 * - Immutable: never modifies input strategy
 * - Zero dependencies on Planner, Runtime, Provider, Memory, or any other component
 */
export class DefaultPromptStrategyRenderer implements PromptStrategyRenderer {
  render(strategy: PromptStrategy): string {
    if (strategy === undefined || strategy === null) {
      return ''
    }

    const name = strategy.name
    if (name === undefined || name === null || name.trim().length === 0) {
      return ''
    }

    return `Prompt Strategy:\n\n- ${name}`
  }
}