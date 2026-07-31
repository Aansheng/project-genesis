import type { PromptStrategy } from './PromptStrategy'
import type { SemanticContext } from '../semantic/SemanticContext'

/**
 * DeleteStrategy — deletion-oriented strategy for PromptStrategy.
 *
 * Applies when the SemanticContext contains a Delete intent.
 * Fourth business-specific strategy after CreateStrategy, QueryStrategy,
 * and ModifyStrategy.
 *
 * Selection precedence (when strategies ordered [CreateStrategy, QueryStrategy, ModifyStrategy, DeleteStrategy, DefaultPromptStrategy]):
 * - Create intent → CreateStrategy
 * - Query intent → QueryStrategy
 * - Move or Modify intent → ModifyStrategy
 * - Delete intent → DeleteStrategy
 * - No match → DefaultPromptStrategy (fallback)
 *
 * Rule-based V1 — matches on SemanticContext.intent.intents containing
 * IntentType 'Delete'. Leverages the existing intent analysis pipeline
 * rather than re-parsing raw text.
 *
 * Properties:
 * - Pure predicate: same inputs always produce same output
 * - Stateless: no internal state between calls
 * - Deterministic: no randomness or external factors
 * - No side effects: does not modify context or external state
 * - Zero dependencies on Planner, Runtime, Provider, Memory, AgentLoop, or Pipeline
 */
export class DeleteStrategy implements PromptStrategy {
  readonly name = 'delete'

  applies(context: SemanticContext): boolean {
    return context.intent?.intents.some(i => i.type === 'Delete') ?? false
  }
}
