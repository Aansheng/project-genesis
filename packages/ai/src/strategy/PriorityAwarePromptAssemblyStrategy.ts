import type { PromptAssemblyPlan } from './PromptAssemblyPlan'
import type { PromptAssemblyStrategy } from './PromptAssemblyStrategy'

/**
 * PriorityAwarePromptAssemblyStrategy — extends PromptAssemblyStrategy with
 * plan-aware section ordering.
 *
 * In addition to the standard `apply()` method (which works without a plan),
 * this interface adds `applyPlan()` which uses a PromptAssemblyPlan to
 * determine section ordering based on priority values.
 *
 * The plan-aware flow:
 *
 *   PromptAssemblyPlanner
 *     ↓ buildPlan()
 *   PromptAssemblyPlan { priorities[] }
 *     ↓
 *   PriorityAwarePromptAssemblyStrategy.applyPlan(sections, plan)
 *     ↓
 *   reordered sections
 *
 * Design principles:
 * - Pure: same inputs always produce same output
 * - Stateless: no internal state between calls
 * - Deterministic: no randomness or external factors
 * - No side effects: does not modify input sections or plan
 * - No dependencies on Planner, Runtime, Provider, Memory, AgentLoop, or Pipeline
 */
export interface PriorityAwarePromptAssemblyStrategy extends PromptAssemblyStrategy {
  /**
   * Apply a PromptAssemblyPlan to reorder the given sections.
   *
   * Sections are ordered by priority (higher priority first).
   * When priorities tie, the original relative order is preserved
   * (stable sorting).
   *
   * @param sections — The ordered prompt section keys
   * @param plan — The PromptAssemblyPlan with priority assignments
   * @returns The reordered section keys
   */
  applyPlan(
    sections: readonly string[],
    plan: PromptAssemblyPlan,
  ): readonly string[]
}