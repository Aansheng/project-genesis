import type { StrategyModuleRenderer } from './StrategyModuleRenderer'

/**
 * DefaultStrategyModuleRenderer — default implementation of StrategyModuleRenderer.
 *
 * Prepends "Strategy Module:" header to the raw module content:
 * ```
 * Strategy Module:
 *
 * Creation Guidelines:
 *
 * - Prefer creating new entities
 * - Avoid modifying existing entities
 * ```
 *
 * Empty string input returns empty string output.
 *
 * Properties:
 * - Pure function: same input always produces same output
 * - Stateless: no internal state between calls
 * - Deterministic: no randomness or external factors
 * - Immutable: never modifies input content
 * - Zero dependencies on Planner, Runtime, Provider, Memory, or any other component
 */
export class DefaultStrategyModuleRenderer implements StrategyModuleRenderer {
  render(moduleContent: string): string {
    if (moduleContent === undefined || moduleContent === null || moduleContent.trim().length === 0) {
      return ''
    }

    return `Strategy Module:\n\n${moduleContent}`
  }
}
