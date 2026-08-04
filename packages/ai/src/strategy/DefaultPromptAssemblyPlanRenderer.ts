import type { PromptAssemblyPlan } from './PromptAssemblyPlan'
import type { PromptAssemblyPlanRenderer } from './PromptAssemblyPlanRenderer'

/**
 * DefaultPromptAssemblyPlanRenderer — default implementation of
 * PromptAssemblyPlanRenderer.
 *
 * Renders a PromptAssemblyPlan into a formatted, human-readable string:
 *
 * ```
 * Prompt Assembly Plan
 *
 * 1. userInput (100)
 * 2. worldState (90)
 * 3. memory (80)
 * ```
 *
 * Sections are sorted by priority descending, with original order as
 * the tie-breaker. Empty plans produce:
 *
 * ```
 * Prompt Assembly Plan
 *
 * (no sections)
 * ```
 *
 * Properties:
 * - Pure: same plan always produces same string
 * - Stateless: no internal state between calls
 * - Deterministic: no randomness or external factors
 * - Immutable: never modifies input plan
 * - Zero dependencies on Planner, Runtime, Provider, Memory, AgentLoop, or Pipeline
 */
export class DefaultPromptAssemblyPlanRenderer implements PromptAssemblyPlanRenderer {
  render(plan: PromptAssemblyPlan): string {
    const lines: string[] = ['Prompt Assembly Plan', '']

    if (plan.priorities.length === 0) {
      lines.push('(no sections)')
      return lines.join('\n')
    }

    // Sort by priority descending, then by original index for stability
    const sorted = [...plan.priorities].sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority
      // Preserve relative order from the plan's priorities array
      const aIndex = plan.priorities.indexOf(a)
      const bIndex = plan.priorities.indexOf(b)
      return aIndex - bIndex
    })

    for (let i = 0; i < sorted.length; i++) {
      lines.push(`${i + 1}. ${sorted[i].section} (${sorted[i].priority})`)
    }

    return lines.join('\n')
  }
}