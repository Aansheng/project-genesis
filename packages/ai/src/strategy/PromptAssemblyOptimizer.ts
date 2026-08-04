import type { PromptAssemblyPlan } from './PromptAssemblyPlan'

/**
 * PromptAssemblyOptimizer — optimizes a PromptAssemblyPlan before rendering.
 *
 * Positioned between PromptAssemblyPlan and OptimizedPromptAssemblyPlan
 * (or the existing PromptAssemblyPlan for now), the optimizer enables
 * future plan transformations such as trimming, compression, or section
 * priority adjustments without modifying the planner or builder.
 *
 * The current architecture:
 *   PromptAssemblyPlan
 *       ↓
 *   PromptAssemblyOptimizer
 *       ↓
 *   OptimizedPromptAssemblyPlan (currently: PromptAssemblyPlan)
 *       ↓
 *   PriorityAwarePromptAssemblyStrategy
 *       ↓
 *   Prompt
 *
 * This WO (WO-S5-046) is foundation only — the optimizer returns the plan
 * unchanged. Future WOs will add trimming, compression, and other optimizations.
 *
 * Design principles:
 * - Pure: same plan always produces same optimized plan
 * - Stateless: no internal state between calls
 * - Deterministic: no randomness or external factors
 * - No side effects: does not modify the input plan
 * - Independent: no dependencies on Planner, Runtime, Provider, or Pipeline
 */
export interface PromptAssemblyOptimizer {
  /**
   * Optimize a PromptAssemblyPlan.
   *
   * @param plan — The plan to optimize
   * @returns The optimized plan (may be same or new instance)
   */
  optimize(plan: PromptAssemblyPlan): PromptAssemblyPlan
}