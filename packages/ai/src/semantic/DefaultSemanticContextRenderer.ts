import type { SemanticContext } from './SemanticContext'
import type { SemanticContextRenderer } from './SemanticContextRenderer'

/**
 * DefaultSemanticContextRenderer — default implementation of SemanticContextRenderer.
 *
 * Renders a SemanticContext into a human-readable string format.
 *
 * Rendering rules:
 * - Empty context (no intent, no entity) → empty string ""
 * - Intent only → "Semantic Context:\n\nIntent:\n- {type}"
 * - Entity only → "Semantic Context:\n\nEntities:\n- {type}"
 * - Both → "Semantic Context:\n\nIntent:\n- {type}\n\nEntities:\n- {type}"
 * - Multi-intent: each intent on its own line with "- " prefix
 * - Multi-entity: each entity on its own line with "- " prefix
 * - Preserves order from SemanticContext (no sorting)
 * - No trailing whitespace
 * - No localization (always uses English type names)
 *
 * Properties:
 * - Pure: same input always produces same output
 * - Stateless: no internal state between calls
 * - Deterministic: no randomness or external factors
 * - Immutable: never modifies input, returns new string
 * - Zero dependencies on Planner, Runtime, Provider, Memory, or any other component
 */
export class DefaultSemanticContextRenderer implements SemanticContextRenderer {
  render(context: SemanticContext): string {
    const hasIntent = context.intent !== undefined && context.intent.intents.length > 0
    const hasEntity = context.entity !== undefined && context.entity.entities.length > 0

    // Empty context — return empty string
    if (!hasIntent && !hasEntity) {
      return ''
    }

    const lines: string[] = ['Semantic Context:']

    if (hasIntent) {
      lines.push('')
      lines.push('Intent:')
      for (const intent of context.intent!.intents) {
        lines.push(`- ${intent.type}`)
      }
    }

    if (hasEntity) {
      lines.push('')
      lines.push('Entities:')
      for (const entity of context.entity!.entities) {
        lines.push(`- ${entity.type}`)
      }
    }

    return lines.join('\n')
  }
}