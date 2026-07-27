import type { SemanticContext } from './SemanticContext'
import type { SemanticContextBuilder } from './SemanticContextBuilder'
import type { IntentResult } from '../intent/IntentResult'
import type { EntityResult } from '../entity/EntityResult'

/**
 * DefaultSemanticContextBuilder — default implementation of SemanticContextBuilder.
 *
 * Combines IntentResult and EntityResult into a SemanticContext through pure composition.
 * No inference, no modification, no filtering — only combination.
 *
 * Properties:
 * - Pure function: same inputs always produce same output
 * - Stateless: no internal state between calls
 * - Deterministic: no randomness or external factors
 * - Immutable: returns new SemanticContext each call, never modifies inputs
 * - Zero dependencies on Planner, Runtime, Provider, Memory, or any other component
 */
export class DefaultSemanticContextBuilder implements SemanticContextBuilder {
  build(intent?: IntentResult, entity?: EntityResult): SemanticContext {
    return {
      ...(intent !== undefined ? { intent } : {}),
      ...(entity !== undefined ? { entity } : {}),
    }
  }
}