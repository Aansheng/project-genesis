/**
 * ObservatoryViewModel — UI-safe DTOs for the Observatory UI.
 *
 * Pure data transfer objects bridging the Prompt Assembly Observability
 * Layer to the Vue component layer. Every field has a defined shape so
 * components never deal with undefined or partial data.
 *
 * Design principles:
 * - Immutable (readonly fields)
 * - Pure data (no methods, no behavior)
 * - UI-safe (no AI package types, no Runtime types)
 * - Minimal (only fields consumed by current UI panels)
 * - Extensible (future DTOs can be added without breaking changes)
 */

// ---------------------------------------------------------------------------
// Overview
// ---------------------------------------------------------------------------

/** High-level artifact counts for the Overview dashboard. */
export interface OverviewDTO {
  readonly traceCount: number
  readonly timelineCount: number
  readonly historyCount: number
}

// ---------------------------------------------------------------------------
// Trace (raw DTO — steps-based)
// ---------------------------------------------------------------------------

/** A single step within a trace. */
export interface TraceStepDTO {
  readonly id: string
  readonly label: string
  readonly status: string
}

/** A single trace entry containing ordered steps. */
export interface TraceDTO {
  readonly id: string
  readonly label: string
  readonly steps: readonly TraceStepDTO[]
}

// ---------------------------------------------------------------------------
// Trace Viewer (ViewModel for Trace panel)
// ---------------------------------------------------------------------------

/** A single snapshot entry displayed in the trace details. */
export interface TraceSnapshotEntryVM {
  readonly key: string
  readonly value: string
}

/**
 * TraceViewModel — UI-safe DTO for the Trace Viewer panel.
 *
 * Contains all fields consumed by the TraceList and TraceDetails
 * components. Derived from raw observatory data through the adapter.
 */
export interface TraceViewModel {
  readonly id: string
  readonly strategy: string
  readonly timestamp: string
  readonly plan: string
  readonly snapshot: readonly TraceSnapshotEntryVM[]
  readonly metadata: Readonly<Record<string, unknown>>
  readonly operationId?: string
  readonly worldId?: string
  readonly status?: string
}

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------

/** A single entry within a timeline. */
export interface TimelineEntryDTO {
  readonly id: string
  readonly label: string
  readonly timestamp: string
}

/** A single timeline containing ordered entries. */
export interface TimelineDTO {
  readonly id: string
  readonly label: string
  readonly entries: readonly TimelineEntryDTO[]
}

// ---------------------------------------------------------------------------
// History
// ---------------------------------------------------------------------------

/** A single entry within a history record. */
export interface HistoryEntryDTO {
  readonly id: string
  readonly label: string
  readonly timestamp: string
}

/** A single history record containing ordered entries. */
export interface HistoryDTO {
  readonly id: string
  readonly label: string
  readonly entries: readonly HistoryEntryDTO[]
}

// ---------------------------------------------------------------------------
// Timeline Viewer (ViewModel for Timeline panel)
// ---------------------------------------------------------------------------

/** A single entry within a timeline view. */
export interface TimelineEntryViewModel {
  readonly index: number
  readonly strategy: string
  readonly timestamp?: string
}

/**
 * TimelineViewModel — UI-safe DTO for the Timeline Viewer panel.
 *
 * Contains all fields consumed by the TimelineList and TimelineDetails
 * components. Derived from raw observatory data through the adapter.
 */
export interface TimelineViewModel {
  readonly id: string
  readonly entryCount: number
  readonly entries: readonly TimelineEntryViewModel[]
}

// ---------------------------------------------------------------------------
// History Viewer (ViewModel for History panel)
// ---------------------------------------------------------------------------

/** A single evolution entry within a history view. */
export interface HistoryEvolutionEntryViewModel {
  readonly name: string
}

/**
 * HistoryViewModel — UI-safe DTO for the History Viewer panel.
 *
 * Contains all fields consumed by the HistoryList and HistoryDetails
 * components. Derived from raw observatory data through the adapter.
 */
export interface HistoryViewModel {
  readonly id: string
  readonly timestamp: string
  readonly prompt: string
  readonly result: string
  readonly evolution: readonly HistoryEvolutionEntryViewModel[]
  readonly operationId?: string
  readonly worldId?: string
  readonly status?: string
  readonly semanticRevision?: number
  readonly runtimeSemanticRevision?: number
  readonly runtimeSynchronization?: 'pending' | 'synchronized' | 'no_runtime_impact' | 'failed' | 'not-applicable'
  readonly failureReason?: string
}

// ---------------------------------------------------------------------------
// Diff Viewer (ViewModel for Diff panel)
// ---------------------------------------------------------------------------

/** A single change entry within a diff view. */
export interface DiffChangeViewModel {
  readonly name: string
}

/**
 * DiffViewModel — UI-safe DTO for the Diff Viewer panel.
 *
 * Contains all fields consumed by the DiffList and DiffDetails
 * components. Derived from raw observatory data through the adapter.
 */
export interface DiffViewModel {
  readonly id: string
  readonly timestamp: string
  readonly added: readonly DiffChangeViewModel[]
  readonly removed: readonly DiffChangeViewModel[]
  readonly changed: readonly DiffChangeViewModel[]
  readonly operationId?: string
  readonly worldId?: string
  readonly status?: 'planned' | 'applied'
  readonly targetIds?: readonly string[]
  readonly semanticRevision?: number
  readonly runtimeSemanticRevision?: number
  readonly runtimeSynchronization?: 'pending' | 'synchronized' | 'no_runtime_impact' | 'failed' | 'not-applicable'
  readonly runtimeAffectedEntityIds?: readonly string[]
  readonly runtimeAddedEntityIds?: readonly string[]
  readonly runtimeRemovedEntityIds?: readonly string[]
  readonly failureReason?: string
}

// ---------------------------------------------------------------------------
// Runtime Viewer (ViewModel for Runtime panel)
// ---------------------------------------------------------------------------

/** A single component within a runtime entity. */
export interface RuntimeComponentViewModel {
  readonly name: string
  readonly data: string
}

/** A single entity within a runtime view. */
export interface RuntimeEntityViewModel {
  readonly id: string
  readonly type: string
  readonly position: string
  readonly health: string
  readonly state: string
  readonly components: readonly RuntimeComponentViewModel[]
}

/**
 * RuntimeViewModel — UI-safe DTO for the Runtime Viewer panel.
 *
 * Contains all fields consumed by the RuntimeEntityList, RuntimeEntityDetails,
 * and RuntimeEntityInspector components. Derived from raw observatory data
 * through the adapter.
 */
export interface RuntimeViewModel {
  readonly worldId: string
  readonly entityCount: number
  readonly systemCount: number
  readonly eventCount: number
  readonly fps: number
  readonly entities: readonly RuntimeEntityViewModel[]
}

// ---------------------------------------------------------------------------
// Event Stream Viewer (ViewModel for Event Stream panel)
// ---------------------------------------------------------------------------

/** Level of a stream event — maps to UI badge styling. */
export type EventLevel = 'info' | 'warning' | 'error'

/**
 * EventViewModel — UI-safe DTO for a single event in the Event Stream panel.
 *
 * Contains all fields consumed by EventStreamItem and EventStreamList
 * components. Derived from raw observatory event data through the adapter.
 */
export interface EventViewModel {
  readonly id: string
  readonly timestamp: string
  readonly level: EventLevel
  readonly source: string
  readonly message: string
}

/**
 * EventStreamViewModel — UI-safe DTO for the Event Stream panel.
 *
 * Contains an ordered list of events consumed by the EventStreamList
 * and EventFilterBar components. Derived from raw observatory data
 * through the adapter.
 */
export interface EventStreamViewModel {
  readonly events: readonly EventViewModel[]
}

// ---------------------------------------------------------------------------
// Root ViewModel
// ---------------------------------------------------------------------------

/**
 * ObservatoryViewModel — root UI-safe view model for the entire Observatory.
 *
 * Every field has a defined default so consuming components never
 * need null/undefined checks for the top-level shape.
 */
export interface ObservatoryViewModel {
  readonly overview: OverviewDTO
  readonly trace: readonly TraceDTO[]
  readonly traceView: readonly TraceViewModel[]
  readonly timelineView: readonly TimelineViewModel[]
  readonly historyView: readonly HistoryViewModel[]
  readonly diffView: readonly DiffViewModel[]
  readonly runtimeView: RuntimeViewModel
  readonly eventStreamView: EventStreamViewModel
  readonly timeline: readonly TimelineDTO[]
  readonly history: readonly HistoryDTO[]
}
