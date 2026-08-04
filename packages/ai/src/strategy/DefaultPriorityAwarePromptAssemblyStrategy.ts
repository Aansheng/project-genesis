import type { PromptAssemblyPlan } from './PromptAssemblyPlan'
import type { PriorityAwarePromptAssemblyStrategy } from './PriorityAwarePromptAssemblyStrategy'

/**
 * DefaultPriorityAwarePromptAssemblyStrategy — default implementation of
 * PriorityAwarePromptAssemblyStrategy.
 *
 * Behavior:
 * - `apply()`: identity — returns sections in original order (no-op)
 * - `applyPlan()`: sorts sections by priority descending (from the plan)
 * - Stable sorting: when priorities tie, original relative order is preserved
 * - Sections not in the plan receive priority 0 and are placed at the end
 * - Deterministic: same inputs always produce same output
 * - Stateless: no internal state between calls
 * - Pure: no side effects, does not modify inputs
 * - Zero dependencies on Planner, Runtime, Provider, Memory, or any other component
 */
export class DefaultPriorityAwarePromptAssemblyStrategy implements PriorityAwarePromptAssemblyStrategy {
  readonly strategyName = 'priority-aware'

  apply(
    sections: readonly string[],
  ): readonly string[] {
    // Identity — no plan available, keep original order
    return [...sections]
  }

  applyPlan(
    sections: readonly string[],
    plan: PromptAssemblyPlan,
  ): readonly string[] {
    // Build priority map from plan
    const priorityMap = new Map<string, number>()
    for (const p of plan.priorities) {
      priorityMap.set(p.section, p.priority)
    }

    // Map each section with its original index for stable sort
    const indexed = sections.map((section, index) => ({
      section,
      index,
      priority: priorityMap.get(section) ?? 0,
    }))

    // Sort by priority descending, then by original index for stability
    indexed.sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority
      return a.index - b.index
    })

    return indexed.map(i => i.section)
  }
}