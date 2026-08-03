import type { PromptAssemblyStrategy } from './PromptAssemblyStrategy'

/**
 * CreatePromptAssemblyStrategy — create-specific implementation of
 * PromptAssemblyStrategy.
 *
 * Reorders prompt sections by priority for create-oriented requests:
 *   1. userInput
 *   2. worldState
 *   3. strategyModuleRendered
 *   4. strategyRendered
 *
 * All remaining sections keep their original relative order.
 * No sections are removed, filtered, or modified.
 *
 * Properties:
 * - Pure: same sections always produce same result
 * - Stateless: no internal state between calls
 * - Deterministic: no randomness or external factors
 * - Immutable: never modifies input sections
 * - Zero dependencies on Planner, Runtime, Provider, Memory, AgentLoop, or Pipeline
 */
export class CreatePromptAssemblyStrategy implements PromptAssemblyStrategy {
  readonly strategyName = 'create'

  /** Priority-ordered section identifiers — highest priority first */
  private readonly PRIORITY_ORDER: readonly string[] = [
    'userInput',
    'worldState',
    'strategyModuleRendered',
    'strategyRendered',
  ]

  apply(sections: readonly string[]): readonly string[] {
    const priority: string[] = []
    const remaining: string[] = []

    for (const section of sections) {
      if (this.PRIORITY_ORDER.includes(section)) {
        priority.push(section)
      } else {
        remaining.push(section)
      }
    }

    // Sort priority items to match priority order
    priority.sort(
      (a, b) => this.PRIORITY_ORDER.indexOf(a) - this.PRIORITY_ORDER.indexOf(b),
    )

    return [...priority, ...remaining]
  }
}