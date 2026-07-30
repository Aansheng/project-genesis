import type { PromptStrategy } from './PromptStrategy'
import type { SemanticContext } from '../semantic/SemanticContext'

/**
 * CreateStrategy — creation-oriented strategy for PromptStrategy.
 *
 * Applies when the SemanticContext contains a Create intent.
 * This is the first business-specific strategy beyond DefaultPromptStrategy.
 *
 * Selection precedence:
 * - When CreateStrategy.applies() returns true, DefaultPromptStrategySelector
 *   selects CreateStrategy (first-match wins) instead of DefaultPromptStrategy.
 * - DefaultPromptStrategy remains the fallback when no strategy matches.
 *
 * Rule-based V1 — matches on SemanticContext.intent.intents containing
 * IntentType 'Create'. This leverages the existing intent analysis pipeline
 * rather than re-parsing raw text.
 *
 * Properties:
 * - Pure predicate: same inputs always produce same output
 * - Stateless: no internal state between calls
 * - Deterministic: no randomness or external factors
 * - No side effects: does not modify context or external state
 * - Zero dependencies on Planner, Runtime, Provider, Memory, AgentLoop, or Pipeline
 */
export class CreateStrategy implements PromptStrategy {
  readonly name = 'create'

  applies(context: SemanticContext): boolean {
    return context.intent?.intents.some(i => i.type === 'Create') ?? false
  }
}
