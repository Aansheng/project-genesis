import type { PromptAssemblyObservatory } from './PromptAssemblyObservatory'
import type { PromptAssemblyObservatoryBuilder } from './PromptAssemblyObservatoryBuilder'

/**
 * DefaultPromptAssemblyObservatoryBuilder — default implementation of
 * PromptAssemblyObservatoryBuilder.
 *
 * Directly returns the provided input fields as the observatory, with no
 * transformation, derivation, or side effects. Unknown fields are silently
 * ignored.
 *
 * Properties:
 * - Pure: same inputs always produce same observatory
 * - Stateless: no internal state between calls
 * - Deterministic: no randomness or external factors
 * - Immutable: never modifies the input objects
 * - Zero dependencies on Planner, Runtime, Provider, Memory, AgentLoop, or Pipeline
 *
 * Foundation only — not consumed by PromptBuilder yet.
 */
export class DefaultPromptAssemblyObservatoryBuilder
  implements PromptAssemblyObservatoryBuilder {

  build(
    input: Parameters<PromptAssemblyObservatoryBuilder['build']>[0],
  ): PromptAssemblyObservatory {
    return {
      ...(input.trace !== undefined ? { trace: input.trace } : {}),
      ...(input.timeline !== undefined ? { timeline: input.timeline } : {}),
      ...(input.history !== undefined ? { history: input.history } : {}),
      ...(input.traceSnapshot !== undefined ? { traceSnapshot: input.traceSnapshot } : {}),
      ...(input.timelineSnapshot !== undefined ? { timelineSnapshot: input.timelineSnapshot } : {}),
      ...(input.historySnapshot !== undefined ? { historySnapshot: input.historySnapshot } : {}),
    }
  }
}