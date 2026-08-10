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
// Trace
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
  readonly timeline: readonly TimelineDTO[]
  readonly history: readonly HistoryDTO[]
}