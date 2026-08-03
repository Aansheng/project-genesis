import type { PromptAssemblyStrategy } from './PromptAssemblyStrategy'

/**
 * DeletePromptAssemblyStrategy — delete-specific implementation of
 * PromptAssemblyStrategy.
 *
 * Reorders prompt sections by priority for delete-oriented requests:
 *   1. userInput
 *   2. worldState
 *   3. entityRendered
 *   4. observations
 *   5. memory
 *   6. strategyModuleRendered
 *   7. strategyRendered
 *
 * This prioritizes entity context (entityRendered), world observations,
 * and memory, since delete tasks need to identify what to remove.
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
export class DeletePromptAssemblyStrategy implements PromptAssemblyStrategy {
  readonly strategyName = 'delete'

  /** Priority-ordered section identifiers — highest priority first */
  private readonly PRIORITY_ORDER: readonly string[] = [
    'userInput',
    'worldState',
    'entityRendered',
    'observations',
    'memory',
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