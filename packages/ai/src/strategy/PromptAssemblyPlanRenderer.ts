import type { PromptAssemblyPlan } from './PromptAssemblyPlan'

/**
 * PromptAssemblyPlanRenderer — renders a PromptAssemblyPlan into a
 * human-readable string for metadata storage and inspection.
 *
 * The rendered output is intended for metadata storage and does NOT
 * affect the final prompt output.
 *
 * Design principles:
 * - Pure: same plan always produces same string
 * - Stateless: no internal state between calls
 * - Deterministic: no randomness or external factors
 * - No dependencies on Planner, Runtime, Provider, Memory, AgentLoop, or Pipeline
 */
export interface PromptAssemblyPlanRenderer {
  /**
   * Render a PromptAssemblyPlan into a formatted string.
   *
   * @param plan — The PromptAssemblyPlan to render
   * @returns A formatted string representation of the plan
   */
  render(plan: PromptAssemblyPlan): string
}