import type { PromptAssemblyStrategy } from './PromptAssemblyStrategy'

/**
 * QueryPromptAssemblyStrategy — query-specific implementation of
 * PromptAssemblyStrategy.
 *
 * Reorders prompt sections by priority for information retrieval requests:
 *   1. userInput
 *   2. worldState
 *   3. memory
 *   4. observations
 *   5. strategyModuleRendered
 *   6. strategyRendered
 *
 * This prioritizes world knowledge (worldState, memory, observations)
 * over strategy guidance, since query tasks primarily need context
 * rather than creation-oriented instructions.
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
export class QueryPromptAssemblyStrategy implements PromptAssemblyStrategy {
  readonly strategyName = 'query'

  /** Priority-ordered section identifiers — highest priority first */
  private readonly PRIORITY_ORDER: readonly string[] = [
    'userInput',
    'worldState',
    'memory',
    'observations',
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