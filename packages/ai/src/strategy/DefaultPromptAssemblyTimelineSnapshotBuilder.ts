import type { PromptAssemblyTimeline } from './PromptAssemblyTimeline'
import type { PromptAssemblyTimelineSnapshot } from './PromptAssemblyTimelineSnapshot'
import type { PromptAssemblyTimelineSnapshotBuilder } from './PromptAssemblyTimelineSnapshotBuilder'

/**
 * DefaultPromptAssemblyTimelineSnapshotBuilder — default implementation of
 * PromptAssemblyTimelineSnapshotBuilder.
 *
 * Extracts condensed summary data from a PromptAssemblyTimeline:
 * - entryCount: number of entries (undefined when empty)
 * - firstStrategy: strategy name of the first entry (undefined when empty)
 * - lastStrategy: strategy name of the last entry (undefined when empty)
 * - strategies: ordered list of all strategy names (undefined when empty)
 *
 * Optional metadata fields:
 * - timelineRendered → snapshot.rendered
 * - timelineExported → snapshot.exported
 *
 * Unknown metadata keys are silently ignored.
 * Strategy names are extracted from `entry.trace.strategy?.name`.
 * When strategy or name is missing, "unknown" is used.
 *
 * Properties:
 * - Pure: same timeline + metadata always produces same snapshot
 * - Stateless: no internal state between calls
 * - Deterministic: no randomness or external factors
 * - Immutable: never modifies the input timeline or metadata
 * - Zero dependencies on Planner, Runtime, Provider, Memory, AgentLoop, or Pipeline
 *
 * Foundation only — not consumed by PromptBuilder yet.
 */
export class DefaultPromptAssemblyTimelineSnapshotBuilder
  implements PromptAssemblyTimelineSnapshotBuilder {

  build(
    timeline: PromptAssemblyTimeline,
    metadata?: Record<string, unknown>,
  ): PromptAssemblyTimelineSnapshot {
    const entries = timeline.entries
    const entryCount = entries.length

    if (entryCount === 0) {
      return {
        entryCount: undefined,
        firstStrategy: undefined,
        lastStrategy: undefined,
        strategies: undefined,
        ...(metadata?.timelineRendered !== undefined
          ? { rendered: String(metadata.timelineRendered) }
          : {}),
        ...(metadata?.timelineExported !== undefined
          ? { exported: String(metadata.timelineExported) }
          : {}),
      }
    }

    const strategies = entries.map(
      (entry) => {
        const strategy = entry.trace?.strategy as { name?: string } | null | undefined
        return strategy?.name ?? 'unknown'
      },
    )

    return {
      entryCount,
      firstStrategy: strategies[0],
      lastStrategy: strategies[strategies.length - 1],
      strategies,
      ...(metadata?.timelineRendered !== undefined
        ? { rendered: String(metadata.timelineRendered) }
        : {}),
      ...(metadata?.timelineExported !== undefined
        ? { exported: String(metadata.timelineExported) }
        : {}),
    }
  }
}