import type { StrategySelectionRenderer } from './StrategySelectionRenderer'
import type { StrategySelectionMetadata } from './StrategySelectionMetadata'

/**
 * DefaultStrategySelectionRenderer — default implementation of
 * StrategySelectionRenderer.
 *
 * Renders StrategySelectionMetadata into a formatted, human-readable string:
 *
 * ```
 * Strategy Selection:
 *
 * Selected:
 * - create (100)
 *
 * Candidates:
 * - create: 100
 * - query: 20
 * - modify: 10
 * - delete: 0
 * ```
 *
 * Properties:
 * - Pure: same metadata always produces same string
 * - Stateless: no internal state between calls
 * - Deterministic: no randomness or external factors
 * - Immutable: never modifies input metadata
 * - Zero dependencies on Planner, Runtime, Provider, Memory, AgentLoop, or Pipeline
 */
export class DefaultStrategySelectionRenderer implements StrategySelectionRenderer {
  render(metadata: StrategySelectionMetadata): string {
    const lines: string[] = ['Strategy Selection:', '']

    const selectedCandidate = metadata.candidates.find(
      candidate => candidate.strategy === metadata.selected,
    )
    lines.push('Selected:')
    if (selectedCandidate !== undefined) {
      lines.push(`- ${selectedCandidate.strategy} (${selectedCandidate.score})`)
    } else {
      lines.push(`- ${metadata.selected}`)
    }

    if (metadata.candidates.length > 0) {
      lines.push('')
      lines.push('Candidates:')
      for (const candidate of metadata.candidates) {
        lines.push(`- ${candidate.strategy}: ${candidate.score}`)
      }
    }

    return lines.join('\n')
  }
}