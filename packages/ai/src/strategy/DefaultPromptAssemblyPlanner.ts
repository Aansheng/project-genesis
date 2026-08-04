import type { PromptAssemblyPlan } from './PromptAssemblyPlan'
import type { PromptAssemblyPlanner } from './PromptAssemblyPlanner'
import type { PromptSectionPriority } from './PromptSectionPriority'

/**
 * DefaultPromptAssemblyPlanner — default implementation of PromptAssemblyPlanner.
 *
 * Produces a plan where all sections receive the default priority of 100,
 * preserving the original section order. This is a baseline implementation
 * that ensures no behavioral change when the planner is introduced.
 *
 * Future implementations will assign strategy-specific priorities to enable
 * dynamic section reordering based on semantic context.
 *
 * Behavior:
 * - Preserves section order from input
 * - All priorities = 100 (neutral default)
 * - Deterministic: same inputs always produce same plan
 * - Stateless: no internal state between calls
 * - Pure: no side effects, does not modify inputs
 * - Zero dependencies on Planner, Runtime, Provider, Memory, or any other component
 */
export class DefaultPromptAssemblyPlanner implements PromptAssemblyPlanner {
  /** Default priority value for all sections */
  static readonly DEFAULT_PRIORITY = 100

  buildPlan(
    _strategyName: string,
    sections: readonly string[],
  ): PromptAssemblyPlan {
    const priorities: PromptSectionPriority[] = sections.map(section => ({
      section,
      priority: DefaultPromptAssemblyPlanner.DEFAULT_PRIORITY,
    }))

    return { priorities }
  }
}