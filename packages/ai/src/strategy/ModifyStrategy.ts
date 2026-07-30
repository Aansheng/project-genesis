import type { PromptStrategy } from './PromptStrategy'
import type { SemanticContext } from '../semantic/SemanticContext'

/**
 * ModifyStrategy — modification-oriented strategy for PromptStrategy.
 *
 * Applies when the SemanticContext contains a Move or Modify intent.
 * Combines Move and Modify into a single "modify" strategy for
 * future compatibility — both are transformation-oriented operations.
 *
 * Selection precedence (when strategies ordered [CreateStrategy, QueryStrategy, ModifyStrategy, DefaultPromptStrategy]):
 * - Create intent → CreateStrategy
 * - Query intent → QueryStrategy
 * - Move or Modify intent → ModifyStrategy
 * - No match → DefaultPromptStrategy (fallback)
 *
 * Rule-based V1 — matches on SemanticContext.intent.intents containing
 * IntentType 'Move' or IntentType 'Modify'. Leverages the existing intent
 * analysis pipeline rather than re-parsing raw text.
 *
 * Properties:
 * - Pure predicate: same inputs always produce same output
 * - Stateless: no internal state between calls
 * - Deterministic: no randomness or external factors
 * - No side effects: does not modify context or external state
 * - Zero dependencies on Planner, Runtime, Provider, Memory, AgentLoop, or Pipeline
 */
export class ModifyStrategy implements PromptStrategy {
  readonly name = 'modify'

  applies(context: SemanticContext): boolean {
    return context.intent?.intents.some(i => i.type === 'Move' || i.type === 'Modify') ?? false
  }
}
