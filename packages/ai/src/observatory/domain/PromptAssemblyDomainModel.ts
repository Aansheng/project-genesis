/**
 * PromptAssemblyDomainModel — typed domain model for Prompt Assembly output.
 *
 * Represents Prompt Assembly observatory data as a structured, typed domain
 * model. Each section maps to a well-defined interface instead of the opaque
 * `unknown` slots used by PromptObservatoryMetadata.
 *
 * This is a PARALLEL model — it does NOT replace PromptObservatoryMetadata.
 * Both coexist. Consumers can opt-in to the typed domain model without
 * breaking the existing `unknown`-based pipeline.
 *
 * Design principles:
 * - Immutable: all fields are readonly
 * - Serializable: all types are JSON-serializable primitives
 * - Framework-independent: no Vue, Pinia, or web framework imports
 * - Runtime-independent: no Runtime type imports
 * - UI-independent: no ViewModel or UI type imports
 * - Extensible: future sections can be added without breaking changes
 */

// ---------------------------------------------------------------------------
// Overview
// ---------------------------------------------------------------------------

/** OverviewDomain — high-level artifact counts for the Prompt Assembly. */
export interface OverviewDomain {
  readonly traceCount: number
  readonly timelineCount: number
  readonly historyCount: number
}

// ---------------------------------------------------------------------------
// Trace
// ---------------------------------------------------------------------------

/** A single step within a trace. */
export interface TraceStepDomain {
  readonly id: string
  readonly label: string
  readonly status: string
}

/** TraceDomain — a single trace entry containing ordered steps. */
export interface TraceDomain {
  readonly id: string
  readonly label: string
  readonly steps: readonly TraceStepDomain[]
}

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------

/** A single entry within a timeline. */
export interface TimelineEntryDomain {
  readonly id: string
  readonly label: string
  readonly timestamp: string
}

/** TimelineDomain — a single timeline containing ordered entries. */
export interface TimelineDomain {
  readonly id: string
  readonly label: string
  readonly entries: readonly TimelineEntryDomain[]
}

// ---------------------------------------------------------------------------
// History
// ---------------------------------------------------------------------------

/** A single entry within a history record. */
export interface HistoryEntryDomain {
  readonly id: string
  readonly label: string
  readonly timestamp: string
}

/** HistoryDomain — a single history record containing ordered entries. */
export interface HistoryDomain {
  readonly id: string
  readonly label: string
  readonly entries: readonly HistoryEntryDomain[]
}

// ---------------------------------------------------------------------------
// Diff
// ---------------------------------------------------------------------------

/** DiffDomain — changes between two Prompt Assembly states. */
export interface DiffDomain {
  readonly id: string
  readonly timestamp: string
  readonly added: readonly string[]
  readonly removed: readonly string[]
  readonly changed: readonly string[]
}

// ---------------------------------------------------------------------------
// Runtime
// ---------------------------------------------------------------------------

/** A single component within a runtime entity. */
export interface RuntimeComponentDomain {
  readonly name: string
  readonly data: string
}

/** A single entity within a runtime view. */
export interface RuntimeEntityDomain {
  readonly id: string
  readonly type: string
  readonly position: string
  readonly health: string
  readonly state: string
  readonly components: readonly RuntimeComponentDomain[]
}

/** RuntimeDomain — runtime world state snapshot. */
export interface RuntimeDomain {
  readonly worldId: string
  readonly entityCount: number
  readonly systemCount: number
  readonly eventCount: number
  readonly fps: number
  readonly entities: readonly RuntimeEntityDomain[]
}

// ---------------------------------------------------------------------------
// Event Stream
// ---------------------------------------------------------------------------

/** Level of a stream event. */
export type EventLevelDomain = 'info' | 'warning' | 'error'

/** EventDomain — a single event in the event stream. */
export interface EventDomain {
  readonly id: string
  readonly timestamp: string
  readonly level: EventLevelDomain
  readonly source: string
  readonly message: string
}

/** EventStreamDomain — ordered list of events. */
export interface EventStreamDomain {
  readonly events: readonly EventDomain[]
}

// ---------------------------------------------------------------------------
// Root Domain Model
// ---------------------------------------------------------------------------

/**
 * PromptAssemblyDomainModel — typed domain model for Prompt Assembly output.
 *
 * All sections are optional — a valid model may have zero sections.
 * Each section is typed instead of `unknown`.
 *
 * This model is produced by PromptAssemblyDomainModelBuilder from
 * PromptObservatoryMetadata.
 */
export interface PromptAssemblyDomainModel {
  /** Optional overview section — typed artifact counts. */
  readonly overview?: OverviewDomain
  /** Optional trace section — typed trace entries. */
  readonly trace?: readonly TraceDomain[]
  /** Optional timeline section — typed timeline entries. */
  readonly timeline?: readonly TimelineDomain[]
  /** Optional history section — typed history records. */
  readonly history?: readonly HistoryDomain[]
  /** Optional diff section — typed diff changes. */
  readonly diff?: readonly DiffDomain[]
  /** Optional runtime section — typed runtime state. */
  readonly runtime?: RuntimeDomain
  /** Optional event stream section — typed event list. */
  readonly eventStream?: EventStreamDomain
}