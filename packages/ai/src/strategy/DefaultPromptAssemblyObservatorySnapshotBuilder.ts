import type { PromptAssemblyObservatory } from './PromptAssemblyObservatory'
import type { PromptAssemblyObservatorySnapshot } from './PromptAssemblyObservatorySnapshot'
import type { PromptAssemblyObservatorySnapshotBuilder } from './PromptAssemblyObservatorySnapshotBuilder'

/**
 * DefaultPromptAssemblyObservatorySnapshotBuilder — default implementation of
 * PromptAssemblyObservatorySnapshotBuilder.
 *
 * Extracts condensed summary data from a PromptAssemblyObservatory:
 * - artifactCount: number of present artifacts (trace, timeline, history,
 *   traceSnapshot, timelineSnapshot, historySnapshot)
 * - hasTrace: whether the trace artifact is present
 * - hasTimeline: whether the timeline artifact is present
 * - hasHistory: whether the history artifact is present
 * - hasTraceSnapshot: whether the traceSnapshot artifact is present
 * - hasTimelineSnapshot: whether the timelineSnapshot artifact is present
 * - hasHistorySnapshot: whether the historySnapshot artifact is present
 *
 * Optional metadata fields (only stored when the value is a string):
 * - observatoryRendered (string) → snapshot.rendered
 * - observatoryExported (string) → snapshot.exported
 *
 * Unknown metadata keys are silently ignored.
 * Non-string metadata values for observatoryRendered/observatoryExported
 * are ignored (not converted).
 *
 * Properties:
 * - Pure: same observatory + metadata always produces same snapshot
 * - Stateless: no internal state between calls
 * - Deterministic: no randomness or external factors
 * - Immutable: never modifies the input observatory or metadata
 * - Zero dependencies on Planner, Runtime, Provider, Memory, AgentLoop, or Pipeline
 *
 * Foundation only — not consumed by PromptBuilder yet.
 */
export class DefaultPromptAssemblyObservatorySnapshotBuilder
  implements PromptAssemblyObservatorySnapshotBuilder {

  build(
    observatory: PromptAssemblyObservatory,
    metadata?: Record<string, unknown>,
  ): PromptAssemblyObservatorySnapshot {
    const hasTrace = observatory.trace !== undefined
    const hasTimeline = observatory.timeline !== undefined
    const hasHistory = observatory.history !== undefined
    const hasTraceSnapshot = observatory.traceSnapshot !== undefined
    const hasTimelineSnapshot = observatory.timelineSnapshot !== undefined
    const hasHistorySnapshot = observatory.historySnapshot !== undefined

    const artifactCount =
      (hasTrace ? 1 : 0) +
      (hasTimeline ? 1 : 0) +
      (hasHistory ? 1 : 0) +
      (hasTraceSnapshot ? 1 : 0) +
      (hasTimelineSnapshot ? 1 : 0) +
      (hasHistorySnapshot ? 1 : 0)

    return {
      artifactCount,
      hasTrace,
      hasTimeline,
      hasHistory,
      hasTraceSnapshot,
      hasTimelineSnapshot,
      hasHistorySnapshot,
      ...(typeof metadata?.observatoryRendered === 'string'
        ? { rendered: metadata.observatoryRendered }
        : {}),
      ...(typeof metadata?.observatoryExported === 'string'
        ? { exported: metadata.observatoryExported }
        : {}),
    }
  }
}