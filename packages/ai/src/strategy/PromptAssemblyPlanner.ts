import type { PromptAssemblyPlan } from './PromptAssemblyPlan'

/**
 * PromptAssemblyPlanner — plans how prompt sections should be prioritized
 * during assembly based on the selected strategy.
 *
 * Given a strategy name and the available section keys, produces a
 * PromptAssemblyPlan that assigns priority values to each section.
 * This plan is then consumed by PromptAssemblyStrategy to determine
 * section ordering and inclusion.
 *
 * This is the planning layer that sits between strategy selection and
 * assembly execution:
 *
 *   StrategyEvaluator → PromptStrategySelector
 *     ↓
 *   PromptAssemblyPlanner.buildPlan(strategyName, sections)
 *     ↓
 *   PromptAssemblyPlan { priorities }
 *     ↓
 *   PromptAssemblyStrategy.apply(plan, sections)
 *     ↓
 *   reordered prompt
 *
 * Design principles:
 * - Pure: same inputs always produce same plan
 * - Stateless: no internal state between calls
 * - Deterministic: no randomness or external factors
 * - No side effects: does not modify strategy name or sections
 * - No dependencies on Planner, Runtime, Provider, Memory, AgentLoop, or Pipeline
 */
export interface PromptAssemblyPlanner {
  /**
   * Build a PromptAssemblyPlan for the given strategy and sections.
   *
   * @param strategyName — The name of the selected strategy
   * @param sections — The available section keys in their current order
   * @returns A PromptAssemblyPlan with priority assignments
   */
  buildPlan(
    strategyName: string,
    sections: readonly string[],
  ): PromptAssemblyPlan
}