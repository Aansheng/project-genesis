import type { EntityAnalyzer } from './EntityAnalyzer'
import type { EntityResult } from './EntityResult'

/**
 * DefaultEntityAnalyzer — placeholder implementation of EntityAnalyzer.
 *
 * Returns empty EntityResult for every input.
 * No parsing, no AI, no heuristics, no runtime.
 *
 * Serves as the default implementation for the interface.
 * All future implementations must produce the same type (EntityResult).
 *
 * Properties:
 * - Pure function: same input always produces same output
 * - Stateless: no internal state between calls
 * - Deterministic: no randomness or external factors
 * - Idempotent: calling twice produces the same result as calling once
 * - Zero dependencies on Planner, Runtime, Provider, Memory, Intent, or ToolCalling
 */
export class DefaultEntityAnalyzer implements EntityAnalyzer {
  analyze(_input: string): EntityResult {
    return { entities: [] }
  }
}