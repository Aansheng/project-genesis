import type { PromptStrategy } from './PromptStrategy'
import type { SemanticContext } from '../semantic/SemanticContext'

/**
 * DefaultPromptStrategy — default implementation of PromptStrategy.
 *
 * Acts as the current baseline strategy. Always applies to any context.
 * No prompt changes — serves as the fallback when no other strategy matches.
 *
 * This is the strategy that all existing requests implicitly use.
 * Introducing it as an explicit first-class citizen ensures backward
 * compatibility: when PromptStrategySelector finds no matching strategy,
 * DefaultPromptStrategy is returned.
 *
 * Properties:
 * - Pure predicate: same inputs always produce same output
 * - Stateless: no internal state between calls
 * - Deterministic: no randomness or external factors
 * - Always applies: returns true for any SemanticContext
 * - Zero dependencies on Planner, Runtime, Provider, Memory, or any other component
 */
export class DefaultPromptStrategy implements PromptStrategy {
  readonly name = 'default'

  applies(_context: SemanticContext): boolean {
    return true
  }
}