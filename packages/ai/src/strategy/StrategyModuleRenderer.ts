/**
 * StrategyModuleRenderer — renders StrategyModule content into a formatted string.
 *
 * Separates the raw module output (strategyModule) from the rendered form
 * (strategyModuleRendered), following the same pattern as PromptStrategyRenderer.
 *
 * The renderer adds a "Strategy Module:" header prefix to the raw content,
 * making it suitable for prompt injection in a future WO.
 *
 * Properties:
 * - Pure function: same input always produces same output
 * - Stateless: no internal state between calls
 * - Deterministic: no randomness or external factors
 * - Immutable: never modifies input content
 */
export interface StrategyModuleRenderer {
  /**
   * Render raw module content into a formatted string.
   *
   * @param moduleContent - Raw guideline text from StrategyModule.build()
   * @returns Formatted string with header prefix, or empty string for empty input
   */
  render(moduleContent: string): string
}
