import type { PromptAssemblyPlan } from './PromptAssemblyPlan'
import type { PromptAssemblyPlanDiff } from './PromptAssemblyPlanDiff'

/**
 * PromptAssemblyPlanDiffer — compares two PromptAssemblyPlan instances.
 *
 * Produces a structured diff showing what sections were added, removed,
 * or had their priority changed between two plans. This enables inspection
 * of optimization effects without coupling to the optimizer implementation.
 *
 * Design principles:
 * - Pure: same before/after always produces same diff
 * - Stateless: no internal state between calls
 * - Deterministic: no randomness or external factors
 * - No side effects: does not modify either plan
 * - Independent: no dependencies on Planner, Runtime, Provider, or Pipeline
 */
export interface PromptAssemblyPlanDiffer {
  /**
   * Diff two PromptAssemblyPlan instances.
   *
   * @param before — The plan before optimization (or baseline)
   * @param after — The plan after optimization (or comparison)
   * @returns A PromptAssemblyPlanDiff describing the changes
   */
  diff(
    before: PromptAssemblyPlan,
    after: PromptAssemblyPlan,
  ): PromptAssemblyPlanDiff
}