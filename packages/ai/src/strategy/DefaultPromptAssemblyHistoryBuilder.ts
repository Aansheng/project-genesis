import type { PromptAssemblyTrace } from './PromptAssemblyTrace'
import type { PromptAssemblyHistory } from './PromptAssemblyHistory'
import type { PromptAssemblyHistoryBuilder } from './PromptAssemblyHistoryBuilder'

/**
 * DefaultPromptAssemblyHistoryBuilder — default implementation of
 * PromptAssemblyHistoryBuilder.
 *
 * Builds an immutable PromptAssemblyHistory from an ordered array of traces.
 * Each entry is frozen to enforce immutability.
 *
 * Properties:
 * - Pure: same traces always produces same history
 * - Stateless: no internal state between calls
 * - Deterministic: no randomness or external factors
 * - Immutable: all objects are frozen
 * - Zero dependencies on Planner, Runtime, Provider, Memory, AgentLoop, or Pipeline
 *
 * Foundation only — not consumed by PromptBuilder yet.
 */
export class DefaultPromptAssemblyHistoryBuilder
  implements PromptAssemblyHistoryBuilder {

  build(
    traces: readonly PromptAssemblyTrace[],
  ): PromptAssemblyHistory {
    return Object.freeze({
      entries: Object.freeze(
        traces.map((trace, index) =>
          Object.freeze({
            index,
            trace,
          }),
        ),
      ),
    })
  }
}