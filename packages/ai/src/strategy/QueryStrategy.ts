import type { PromptStrategy } from './PromptStrategy'
import type { SemanticContext } from '../semantic/SemanticContext'

/**
 * QueryStrategy — query-oriented strategy for PromptStrategy.
 *
 * Applies when the SemanticContext contains a Query intent.
 * Second business-specific strategy after CreateStrategy.
 *
 * Selection precedence (when strategies ordered [CreateStrategy, QueryStrategy, DefaultPromptStrategy]):
 * - Create intent → CreateStrategy
 * - Query intent → QueryStrategy
 * - No match → DefaultPromptStrategy (fallback)
 *
 * Rule-based V1 — matches on SemanticContext.intent.intents containing
 * IntentType 'Query'. Leverages the existing intent analysis pipeline
 * rather than re-parsing raw text.
 *
 * Properties:
 * - Pure predicate: same inputs always produce same output
 * - Stateless: no internal state between calls
 * - Deterministic: no randomness or external factors
 * - No side effects: does not modify context or external state
 * - Zero dependencies on Planner, Runtime, Provider, Memory, AgentLoop, or Pipeline
 */
export class QueryStrategy implements PromptStrategy {
  readonly name = 'query'

  applies(context: SemanticContext): boolean {
    return context.intent?.intents.some(i => i.type === 'Query') ?? false
  }
}
