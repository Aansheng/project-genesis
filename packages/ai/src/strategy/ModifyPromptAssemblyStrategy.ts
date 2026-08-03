import type { PromptAssemblyStrategy } from './PromptAssemblyStrategy'

/**
 * ModifyPromptAssemblyStrategy — modify-specific implementation of
 * PromptAssemblyStrategy.
 *
 * Reorders prompt sections by priority for modify/move workflows:
 *   1. userInput
 *   2. worldState
 *   3. entityRendered
 *   4. memory
 *   5. observations
 *   6. strategyModuleRendered
 *   7. strategyRendered
 *
 * This prioritizes entity context (entityRendered), world knowledge
 * (worldState, memory, observations), and strategy guidance, since
 * modify tasks need to understand what to change and where.
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
export class ModifyPromptAssemblyStrategy implements PromptAssemblyStrategy {
  readonly strategyName = 'modify'

  /** Priority-ordered section identifiers — highest priority first */
  private readonly PRIORITY_ORDER: readonly string[] = [
    'userInput',
    'worldState',
    'entityRendered',
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