import type { PromptInspector } from './PromptInspector'
import type { PromptInspectorRenderer } from './PromptInspectorRenderer'

/**
 * DefaultPromptInspectorRenderer — default implementation of
 * PromptInspectorRenderer.
 *
 * Renders a PromptInspector into a formatted, human-readable string:
 *
 * ```
 * Prompt Inspector
 *
 * Strategy:
 * create
 *
 * Sections:
 *
 * - Rendered Strategy
 * - Strategy Selection
 * - Strategy Module
 * - Prompt Plan
 * - Optimized Plan
 * - Plan Diff
 * - Rendered Plan
 * ```
 *
 * Rules:
 * - If strategy exists: output "Strategy:\n<value>"
 * - If no strategy: omit strategy block entirely
 * - If no sections: output "Prompt Inspector\n\nNo Sections"
 * - Sections are rendered as a bullet list of their titles, preserving
 *   the order they appear in the inspector's sections array
 *
 * Properties:
 * - Pure: same inspector always produces same string
 * - Stateless: no internal state between calls
 * - Deterministic: no randomness or external factors
 * - Immutable: never modifies the input inspector
 * - Zero dependencies on Planner, Runtime, Provider, Memory, AgentLoop, or Pipeline
 */
export class DefaultPromptInspectorRenderer implements PromptInspectorRenderer {
  render(inspector: PromptInspector): string {
    const lines: string[] = ['Prompt Inspector', '']

    if (inspector.strategy !== undefined) {
      lines.push('Strategy:')
      lines.push(inspector.strategy)
      lines.push('')
    }

    if (inspector.sections.length === 0) {
      lines.push('No Sections')
    } else {
      lines.push('Sections:')
      lines.push('')
      for (const section of inspector.sections) {
        lines.push(`- ${section.title}`)
      }
    }

    return lines.join('\n')
  }
}