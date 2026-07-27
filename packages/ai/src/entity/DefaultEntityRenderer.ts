import type { EntityRenderer } from './EntityRenderer'
import type { EntityResult } from './EntityResult'

/**
 * DefaultEntityRenderer — default implementation of EntityRenderer.
 *
 * Renders EntityResult as a formatted "Entities:" section.
 *
 * Rendering rules:
 * - Empty EntityResult → empty string ""
 * - Single entity → "Entities:\n- Tree"
 * - Multiple entities → "Entities:\n- Tree\n- Flower\n- House"
 * - Preserves EntityResult order (no sorting)
 * - No localization (always uses English entity type names)
 *
 * Properties:
 * - Pure function: same input always produces same output
 * - Stateless: no internal state between calls
 * - Deterministic: no randomness or external factors
 * - Zero dependencies on Planner, Runtime, Provider, Memory, or any other component
 */
export class DefaultEntityRenderer implements EntityRenderer {
  render(entity: EntityResult): string {
    if (entity.entities.length === 0) {
      return ''
    }

    const lines = entity.entities.map(e => `- ${e.type}`)
    return `Entities:\n${lines.join('\n')}`
  }
}