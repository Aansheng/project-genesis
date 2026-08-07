import type { PromptAssemblyObservatory } from './PromptAssemblyObservatory'
import type { PromptAssemblyObservatoryRenderer } from './PromptAssemblyObservatoryRenderer'

/**
 * Known observatory artifact fields in declaration order.
 *
 * This order is significant — the renderer preserves this order when
 * listing artifacts, ensuring deterministic, predictable output.
 */
const OBSERVATORY_ARTIFACT_FIELDS: ReadonlyArray<keyof PromptAssemblyObservatory> = [
  'trace',
  'timeline',
  'history',
  'traceSnapshot',
  'timelineSnapshot',
  'historySnapshot',
]

/**
 * DefaultPromptAssemblyObservatoryRenderer — default implementation of
 * PromptAssemblyObservatoryRenderer.
 *
 * Renders a PromptAssemblyObservatory into a formatted, human-readable string:
 *
 * Non-empty (with all six artifacts):
 * ```
 * Prompt Assembly Observatory
 *
 * Artifacts:
 *
 * - trace
 * - timeline
 * - history
 * - traceSnapshot
 * - timelineSnapshot
 * - historySnapshot
 * ```
 *
 * Empty:
 * ```
 * Prompt Assembly Observatory
 *
 * No Artifacts
 * ```
 *
 * Rules:
 * - Only existing artifacts are rendered
 * - Artifact order follows PromptAssemblyObservatory field declaration order
 * - Empty observatory produces "No Artifacts" text
 *
 * Properties:
 * - Pure: same observatory always produces same string
 * - Stateless: no internal state between calls
 * - Deterministic: no randomness or external factors
 * - Immutable: never modifies the input observatory
 * - Zero dependencies on Planner, Runtime, Provider, Memory, AgentLoop, or Pipeline
 *
 * Foundation only — not consumed by PromptBuilder yet.
 */
export class DefaultPromptAssemblyObservatoryRenderer
  implements PromptAssemblyObservatoryRenderer {

  render(observatory: PromptAssemblyObservatory): string {
    const lines: string[] = ['Prompt Assembly Observatory', '']

    // Collect present artifacts in declaration order
    const presentArtifacts: string[] = []
    for (const field of OBSERVATORY_ARTIFACT_FIELDS) {
      if (observatory[field] !== undefined) {
        presentArtifacts.push(field)
      }
    }

    if (presentArtifacts.length === 0) {
      lines.push('No Artifacts')
    } else {
      lines.push('Artifacts:')
      lines.push('')
      for (const artifact of presentArtifacts) {
        lines.push(`- ${artifact}`)
      }
    }

    return lines.join('\n')
  }
}