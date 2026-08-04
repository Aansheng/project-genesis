import type { PromptAssemblyPlan } from './PromptAssemblyPlan'
import type { PromptAssemblyOptimizer } from './PromptAssemblyOptimizer'

/**
 * DefaultPromptAssemblyOptimizer — identity implementation of PromptAssemblyOptimizer.
 *
 * Returns the plan unchanged. This is the foundation implementation that
 * preserves all existing behavior while providing the optimization extension
 * point. Future WOs will add actual optimization logic (trimming, compression,
 * priority adjustment) while keeping this identity implementation as the
 * baseline default.
 *
 * Properties:
 * - Pure: same plan always produces same optimized plan
 * - Stateless: no internal state between calls
 * - Deterministic: no randomness or external factors
 * - Immutable: never modifies the input plan
 * - Zero dependencies on Planner, Runtime, Provider, Memory, AgentLoop, or Pipeline
 *
 * Foundation only — not consumed by PromptBuilder yet.
 */
export class DefaultPromptAssemblyOptimizer implements PromptAssemblyOptimizer {
  optimize(plan: PromptAssemblyPlan): PromptAssemblyPlan {
    return plan
  }
}