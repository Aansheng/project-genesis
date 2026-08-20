import type { ObservatoryAdapter } from './ObservatoryAdapter'
import type {
  ObservatoryViewModel,
  OverviewDTO,
  TraceDTO,
  TraceStepDTO,
  TraceViewModel,
  TraceSnapshotEntryVM,
  TimelineViewModel,
  TimelineEntryViewModel,
  HistoryViewModel,
  HistoryEvolutionEntryViewModel,
  DiffViewModel,
  DiffChangeViewModel,
  RuntimeViewModel,
  RuntimeEntityViewModel,
  RuntimeComponentViewModel,
  EventStreamViewModel,
  EventViewModel,
  EventLevel,
  TimelineDTO,
  TimelineEntryDTO,
  HistoryDTO,
  HistoryEntryDTO,
} from './ObservatoryViewModel'

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const DEFAULT_OVERVIEW = Object.freeze({
  traceCount: 0,
  timelineCount: 0,
  historyCount: 0,
})

const DEFAULT_RUNTIME_VIEW: RuntimeViewModel = Object.freeze({
  worldId: '',
  entityCount: 0,
  systemCount: 0,
  eventCount: 0,
  fps: 0,
  entities: Object.freeze([]),
})

const DEFAULT_EVENT_STREAM: EventStreamViewModel = Object.freeze({
  events: Object.freeze([]),
})

const DEFAULT_VIEW_MODEL: ObservatoryViewModel = Object.freeze({
  overview: DEFAULT_OVERVIEW,
  trace: Object.freeze([]),
  traceView: Object.freeze([]),
  timelineView: Object.freeze([]),
  historyView: Object.freeze([]),
  diffView: Object.freeze([]),
  runtimeView: DEFAULT_RUNTIME_VIEW,
  eventStreamView: DEFAULT_EVENT_STREAM,
  timeline: Object.freeze([]),
  history: Object.freeze([]),
})

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Check if a value is a non-null object (including arrays). */
function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

/** Safely read a property from an unknown object, returning undefined if not found. */
function safeGet<T>(obj: Record<string, unknown>, key: string): T | undefined {
  const value = obj[key]
  return value as T | undefined
}

/** Safely convert a value to a number, returning 0 for missing/invalid. */
function safeCount(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
    return Math.floor(value)
  }
  return 0
}

function stringList(value: unknown[] | undefined): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}

/** Safely convert a value to a boolean, returning false for missing/invalid. */
function safeBool(value: unknown): boolean {
  return value === true
}

// ---------------------------------------------------------------------------
// DefaultObservatoryAdapter
// ---------------------------------------------------------------------------

/**
 * DefaultObservatoryAdapter — default implementation of ObservatoryAdapter.
 *
 * Transforms raw observatory data (unknown) into a safe ObservatoryViewModel.
 * Handles undefined, null, invalid objects, partial data, and complete data.
 * Always returns a stable ViewModel with defined defaults.
 *
 * Pure. Stateless. Deterministic.
 */
export class DefaultObservatoryAdapter implements ObservatoryAdapter {
  adapt(observatory: unknown): ObservatoryViewModel {
    // Handle null, undefined, and non-object input
    if (!isObject(observatory)) {
      return DEFAULT_VIEW_MODEL
    }

    // Extract overview and panel data
    const overview = this.adaptOverview(observatory)
    const trace = this.adaptTrace(observatory)
    const traceView = this.adaptTraceView(observatory)
    const timelineView = this.adaptTimelineView(observatory)
    const historyView = this.adaptHistoryView(observatory)
    const diffView = this.adaptDiffView(observatory)
    const runtimeView = this.adaptRuntimeView(observatory)
    const eventStreamView = this.adaptEventStreamView(observatory)
    const timeline = this.adaptTimeline(observatory)
    const history = this.adaptHistory(observatory)

    return {
      overview,
      trace,
      traceView,
      timelineView,
      historyView,
      diffView,
      runtimeView,
      eventStreamView,
      timeline,
      history,
    }
  }

  // -----------------------------------------------------------------------
  // Private adapters
  // -----------------------------------------------------------------------

  private adaptOverview(observatory: Record<string, unknown>): OverviewDTO {
    // Try to extract counts from observatory structure
    const traceArr = safeGet<unknown[]>(observatory, 'trace')
    const timelineArr = safeGet<unknown[]>(observatory, 'timeline')
    const historyArr = safeGet<unknown[]>(observatory, 'history')

    // If arrays exist, derive count from length
    const traceCount = Array.isArray(traceArr) ? traceArr.length : this.deriveTraceCount(observatory)
    const timelineCount = Array.isArray(timelineArr) ? timelineArr.length : this.deriveTimelineCount(observatory)
    const historyCount = Array.isArray(historyArr) ? historyArr.length : this.deriveHistoryCount(observatory)

    return {
      traceCount: safeCount(traceCount),
      timelineCount: safeCount(timelineCount),
      historyCount: safeCount(historyCount),
    }
  }

  /** Derive trace count from snapshot/flag indicators. */
  private deriveTraceCount(observatory: Record<string, unknown>): number {
    const traceVal = safeGet<unknown>(observatory, 'trace')
    if (isObject(traceVal)) return 1
    const snapshot = safeGet<Record<string, unknown>>(observatory, 'traceSnapshot')
    if (isObject(snapshot)) {
      const count = safeGet<number>(snapshot, 'stepCount')
      if (count !== undefined && typeof count === 'number' && Number.isFinite(count)) {
        return Math.max(0, Math.floor(count))
      }
    }
    if (safeBool(safeGet<unknown>(observatory, 'hasTrace'))) return 1
    return 0
  }

  /** Derive timeline count from snapshot/flag indicators. */
  private deriveTimelineCount(observatory: Record<string, unknown>): number {
    const timelineVal = safeGet<unknown>(observatory, 'timeline')
    if (isObject(timelineVal)) return 1
    const snapshot = safeGet<Record<string, unknown>>(observatory, 'timelineSnapshot')
    if (isObject(snapshot)) {
      const count = safeGet<number>(snapshot, 'entryCount')
      if (count !== undefined && typeof count === 'number' && Number.isFinite(count)) {
        return Math.max(0, Math.floor(count))
      }
    }
    if (safeBool(safeGet<unknown>(observatory, 'hasTimeline'))) return 1
    return 0
  }

  /** Derive history count from snapshot/flag indicators. */
  private deriveHistoryCount(observatory: Record<string, unknown>): number {
    const historyVal = safeGet<unknown>(observatory, 'history')
    if (isObject(historyVal)) return 1
    const snapshot = safeGet<Record<string, unknown>>(observatory, 'historySnapshot')
    if (isObject(snapshot)) {
      const count = safeGet<number>(snapshot, 'entryCount')
      if (count !== undefined && typeof count === 'number' && Number.isFinite(count)) {
        return Math.max(0, Math.floor(count))
      }
    }
    if (safeBool(safeGet<unknown>(observatory, 'hasHistory'))) return 1
    return 0
  }

  private adaptTrace(observatory: Record<string, unknown>): readonly TraceDTO[] {
    return this.adaptArray<TraceDTO>(observatory, 'trace', this.adaptTraceItem.bind(this))
  }

  /**
   * Adapt trace viewer data from the raw observatory.
   * Looks for 'traceView' key first, falls back to 'trace'.
   * Returns frozen empty array for missing/invalid data.
   */
  private adaptTraceView(observatory: Record<string, unknown>): readonly TraceViewModel[] {
    const raw = safeGet<unknown[]>(observatory, 'traceView')
    if (!Array.isArray(raw)) return Object.freeze([])
    return Object.freeze(raw.map((item) => this.adaptTraceViewItem(isObject(item) ? item : {})))
  }

  private adaptTraceViewItem(item: Record<string, unknown>): TraceViewModel {
    return {
      id: String(safeGet(item, 'id') ?? ''),
      strategy: String(safeGet(item, 'strategy') ?? ''),
      timestamp: String(safeGet(item, 'timestamp') ?? ''),
      plan: String(safeGet(item, 'plan') ?? ''),
      snapshot: this.adaptTraceViewSnapshot(item),
      metadata: Object.freeze({
        ...safeGet<Record<string, unknown>>(item, 'metadata'),
      }),
      ...(typeof safeGet(item, 'operationId') === 'string' ? { operationId: safeGet<string>(item, 'operationId') } : {}),
      ...(typeof safeGet(item, 'worldId') === 'string' ? { worldId: safeGet<string>(item, 'worldId') } : {}),
      ...(typeof safeGet(item, 'status') === 'string' ? { status: safeGet<string>(item, 'status') } : {}),
    }
  }

  private adaptTraceViewSnapshot(item: Record<string, unknown>): readonly TraceSnapshotEntryVM[] {
    const raw = safeGet<unknown[]>(item, 'snapshot')
    if (!Array.isArray(raw)) return Object.freeze([])
    return Object.freeze(
      raw.map((entry) => {
        const e = isObject(entry) ? entry : {}
        return {
          key: String(safeGet(e, 'key') ?? ''),
          value: String(safeGet(e, 'value') ?? ''),
        }
      }),
    )
  }

  private adaptTimeline(observatory: Record<string, unknown>): readonly TimelineDTO[] {
    return this.adaptArray<TimelineDTO>(observatory, 'timeline', this.adaptTimelineItem.bind(this))
  }

  private adaptHistory(observatory: Record<string, unknown>): readonly HistoryDTO[] {
    return this.adaptArray<HistoryDTO>(observatory, 'history', this.adaptHistoryItem.bind(this))
  }

  /**
   * Adapt history viewer data from the raw observatory.
   * Looks for 'historyView' key. Returns frozen empty array for missing/invalid data.
   */
  private adaptHistoryView(observatory: Record<string, unknown>): readonly HistoryViewModel[] {
    const raw = safeGet<unknown[]>(observatory, 'historyView')
    if (!Array.isArray(raw)) {
      // Fallback: derive from history array
      const fallback = safeGet<unknown[]>(observatory, 'history')
      if (Array.isArray(fallback) && fallback.length > 0) {
        return Object.freeze(
          fallback.map((item) => this.adaptHistoryViewFromHistoryItem(isObject(item) ? item : {})),
        )
      }
      return Object.freeze([])
    }
    return Object.freeze(raw.map((item) => this.adaptHistoryViewItem(isObject(item) ? item : {})))
  }

  private adaptHistoryViewItem(item: Record<string, unknown>): HistoryViewModel {
    const evolution = this.adaptHistoryEvolution(item)
    return {
      id: String(safeGet(item, 'id') ?? ''),
      timestamp: String(safeGet(item, 'timestamp') ?? ''),
      prompt: String(safeGet(item, 'prompt') ?? ''),
      result: String(safeGet(item, 'result') ?? ''),
      evolution,
      ...(typeof safeGet(item, 'operationId') === 'string' ? { operationId: safeGet<string>(item, 'operationId') } : {}),
      ...(typeof safeGet(item, 'worldId') === 'string' ? { worldId: safeGet<string>(item, 'worldId') } : {}),
      ...(typeof safeGet(item, 'status') === 'string' ? { status: safeGet<string>(item, 'status') } : {}),
      ...(typeof safeGet(item, 'semanticRevision') === 'number' ? { semanticRevision: safeGet<number>(item, 'semanticRevision') } : {}),
      ...(typeof safeGet(item, 'runtimeSemanticRevision') === 'number' ? { runtimeSemanticRevision: safeGet<number>(item, 'runtimeSemanticRevision') } : {}),
      ...(safeGet(item, 'runtimeSynchronization') === 'pending'
        || safeGet(item, 'runtimeSynchronization') === 'synchronized'
        || safeGet(item, 'runtimeSynchronization') === 'no_runtime_impact'
        || safeGet(item, 'runtimeSynchronization') === 'failed'
        || safeGet(item, 'runtimeSynchronization') === 'not-applicable'
        ? { runtimeSynchronization: safeGet<'pending' | 'synchronized' | 'no_runtime_impact' | 'failed' | 'not-applicable'>(item, 'runtimeSynchronization') }
        : {}),
      ...(typeof safeGet(item, 'visualRevision') === 'number' ? { visualRevision: safeGet<number>(item, 'visualRevision') } : {}),
      ...(safeGet(item, 'visualPlanning') === 'pending'
        || safeGet(item, 'visualPlanning') === 'planned'
        || safeGet(item, 'visualPlanning') === 'no_visual_impact'
        || safeGet(item, 'visualPlanning') === 'failed'
        ? { visualPlanning: safeGet<'pending' | 'planned' | 'no_visual_impact' | 'failed'>(item, 'visualPlanning') }
        : {}),
      ...(typeof safeGet(item, 'visualGenerationRequired') === 'number' ? { visualGenerationRequired: safeGet<number>(item, 'visualGenerationRequired') } : {}),
      ...(typeof safeGet(item, 'failureReason') === 'string' ? { failureReason: safeGet<string>(item, 'failureReason') } : {}),
    }
  }

  private adaptHistoryViewFromHistoryItem(item: Record<string, unknown>): HistoryViewModel {
    const entries = safeGet<unknown[]>(item, 'entries')
    const evolution: HistoryEvolutionEntryViewModel[] = []
    if (Array.isArray(entries)) {
      for (const entry of entries) {
        const e = isObject(entry) ? entry : {}
        evolution.push({
          name: String(safeGet(e, 'label') ?? ''),
        })
      }
    }
    return {
      id: String(safeGet(item, 'id') ?? ''),
      timestamp: String(safeGet(item, 'label') ?? ''),
      prompt: String(safeGet(item, 'label') ?? ''),
      result: '',
      evolution: Object.freeze(evolution),
    }
  }

  private adaptHistoryEvolution(item: Record<string, unknown>): readonly HistoryEvolutionEntryViewModel[] {
    const raw = safeGet<unknown[]>(item, 'evolution')
    if (!Array.isArray(raw)) return Object.freeze([])
    return Object.freeze(
      raw.map((entry) => {
        // Handle both string[] and HistoryEvolutionEntryViewModel[]
        if (typeof entry === 'string') {
          return { name: entry }
        }
        const e = isObject(entry) ? entry : {}
        return {
          name: String(safeGet(e, 'name') ?? ''),
        }
      }),
    )
  }

  /**
   * Adapt runtime viewer data from the raw observatory.
   * Looks for 'runtimeView' key. Returns default RuntimeViewModel for missing/invalid data.
   */
  private adaptRuntimeView(observatory: Record<string, unknown>): RuntimeViewModel {
    const raw = safeGet<Record<string, unknown>>(observatory, 'runtimeView')
    if (!isObject(raw)) return DEFAULT_RUNTIME_VIEW

    const entities = this.adaptRuntimeEntities(raw)
    return Object.freeze({
      worldId: String(safeGet(raw, 'worldId') ?? ''),
      entityCount: safeCount(safeGet(raw, 'entityCount')),
      systemCount: safeCount(safeGet(raw, 'systemCount')),
      eventCount: safeCount(safeGet(raw, 'eventCount')),
      fps: safeCount(safeGet(raw, 'fps')),
      entities,
    })
  }

  private adaptRuntimeEntities(raw: Record<string, unknown>): readonly RuntimeEntityViewModel[] {
    const rawEntities = safeGet<unknown[]>(raw, 'entities')
    if (!Array.isArray(rawEntities)) return Object.freeze([])
    return Object.freeze(
      rawEntities.map((item) => this.adaptRuntimeEntity(isObject(item) ? item : {})),
    )
  }

  private adaptRuntimeEntity(item: Record<string, unknown>): RuntimeEntityViewModel {
    return {
      id: String(safeGet(item, 'id') ?? ''),
      type: String(safeGet(item, 'type') ?? ''),
      position: String(safeGet(item, 'position') ?? ''),
      health: this.adaptHealth(item),
      state: String(safeGet(item, 'state') ?? ''),
      components: this.adaptRuntimeComponents(item),
    }
  }

  /** Convert health to string for UI safety. */
  private adaptHealth(item: Record<string, unknown>): string {
    const health = safeGet(item, 'health')
    if (typeof health === 'number' && Number.isFinite(health)) {
      return String(health)
    }
    if (typeof health === 'string') {
      return health
    }
    return ''
  }

  private adaptRuntimeComponents(item: Record<string, unknown>): readonly RuntimeComponentViewModel[] {
    const raw = safeGet<unknown[]>(item, 'components')
    if (!Array.isArray(raw)) return Object.freeze([])
    return Object.freeze(
      raw.map((comp) => {
        const c = isObject(comp) ? comp : {}
        return {
          name: String(safeGet(c, 'name') ?? ''),
          data: this.adaptComponentData(c),
        }
      }),
    )
  }

  /** Serialize component data to JSON string for UI safety. */
  private adaptComponentData(comp: Record<string, unknown>): string {
    const data = safeGet(comp, 'data')
    if (data === undefined) return ''
    if (typeof data === 'string') return data
    try {
      return JSON.stringify(data, null, 2)
    } catch {
      return String(data ?? '')
    }
  }

  /**
   * Adapt diff viewer data from the raw observatory.
   * Looks for 'diffView' key. Returns frozen empty array for missing/invalid data.
   */
  private adaptDiffView(observatory: Record<string, unknown>): readonly DiffViewModel[] {
    const raw = safeGet<unknown[]>(observatory, 'diffView')
    if (!Array.isArray(raw)) return Object.freeze([])
    return Object.freeze(raw.map((item) => this.adaptDiffViewItem(isObject(item) ? item : {})))
  }

  private adaptDiffViewItem(item: Record<string, unknown>): DiffViewModel {
    const status = safeGet(item, 'status')
    return {
      id: String(safeGet(item, 'id') ?? ''),
      timestamp: String(safeGet(item, 'timestamp') ?? ''),
      added: this.adaptDiffChangeArray(item, 'added'),
      removed: this.adaptDiffChangeArray(item, 'removed'),
      changed: this.adaptDiffChangeArray(item, 'changed'),
      ...(status === 'planned' || status === 'applied' ? { status } : {}),
      ...(typeof safeGet(item, 'operationId') === 'string' ? { operationId: safeGet<string>(item, 'operationId') } : {}),
      ...(typeof safeGet(item, 'worldId') === 'string' ? { worldId: safeGet<string>(item, 'worldId') } : {}),
      ...(Array.isArray(safeGet<unknown[]>(item, 'targetIds')) ? { targetIds: Object.freeze(stringList(safeGet<unknown[]>(item, 'targetIds'))) } : {}),
      ...(typeof safeGet(item, 'semanticRevision') === 'number' ? { semanticRevision: safeGet<number>(item, 'semanticRevision') } : {}),
      ...(typeof safeGet(item, 'runtimeSemanticRevision') === 'number' ? { runtimeSemanticRevision: safeGet<number>(item, 'runtimeSemanticRevision') } : {}),
      ...(safeGet(item, 'runtimeSynchronization') === 'pending'
        || safeGet(item, 'runtimeSynchronization') === 'synchronized'
        || safeGet(item, 'runtimeSynchronization') === 'no_runtime_impact'
        || safeGet(item, 'runtimeSynchronization') === 'failed'
        || safeGet(item, 'runtimeSynchronization') === 'not-applicable'
        ? { runtimeSynchronization: safeGet<'pending' | 'synchronized' | 'no_runtime_impact' | 'failed' | 'not-applicable'>(item, 'runtimeSynchronization') }
        : {}),
      ...(Array.isArray(safeGet<unknown[]>(item, 'runtimeAffectedEntityIds')) ? { runtimeAffectedEntityIds: Object.freeze(stringList(safeGet<unknown[]>(item, 'runtimeAffectedEntityIds'))) } : {}),
      ...(Array.isArray(safeGet<unknown[]>(item, 'runtimeAddedEntityIds')) ? { runtimeAddedEntityIds: Object.freeze(stringList(safeGet<unknown[]>(item, 'runtimeAddedEntityIds'))) } : {}),
      ...(Array.isArray(safeGet<unknown[]>(item, 'runtimeRemovedEntityIds')) ? { runtimeRemovedEntityIds: Object.freeze(stringList(safeGet<unknown[]>(item, 'runtimeRemovedEntityIds'))) } : {}),
      ...(typeof safeGet(item, 'visualRevision') === 'number' ? { visualRevision: safeGet<number>(item, 'visualRevision') } : {}),
      ...(safeGet(item, 'visualPlanning') === 'pending'
        || safeGet(item, 'visualPlanning') === 'planned'
        || safeGet(item, 'visualPlanning') === 'no_visual_impact'
        || safeGet(item, 'visualPlanning') === 'failed'
        ? { visualPlanning: safeGet<'pending' | 'planned' | 'no_visual_impact' | 'failed'>(item, 'visualPlanning') }
        : {}),
      ...(typeof safeGet(item, 'visualGenerationRequired') === 'number' ? { visualGenerationRequired: safeGet<number>(item, 'visualGenerationRequired') } : {}),
      ...(Array.isArray(safeGet<unknown[]>(item, 'visualAffectedArchetypes')) ? { visualAffectedArchetypes: Object.freeze(stringList(safeGet<unknown[]>(item, 'visualAffectedArchetypes'))) } : {}),
      ...(Array.isArray(safeGet<unknown[]>(item, 'visualBindingOnlyEntityIds')) ? { visualBindingOnlyEntityIds: Object.freeze(stringList(safeGet<unknown[]>(item, 'visualBindingOnlyEntityIds'))) } : {}),
      ...(Array.isArray(safeGet<unknown[]>(item, 'visualOrphanedAssetIds')) ? { visualOrphanedAssetIds: Object.freeze(stringList(safeGet<unknown[]>(item, 'visualOrphanedAssetIds'))) } : {}),
      ...(typeof safeGet(item, 'failureReason') === 'string' ? { failureReason: safeGet<string>(item, 'failureReason') } : {}),
    }
  }

  /**
   * Adapt a diff change array (added, removed, changed).
   * Handles both string[] and DiffChangeViewModel[].
   */
  private adaptDiffChangeArray(item: Record<string, unknown>, key: string): readonly DiffChangeViewModel[] {
    const raw = safeGet<unknown[]>(item, key)
    if (!Array.isArray(raw)) return Object.freeze([])
    return Object.freeze(
      raw.map((entry) => {
        if (typeof entry === 'string') {
          return { name: entry }
        }
        const e = isObject(entry) ? entry : {}
        return {
          name: String(safeGet(e, 'name') ?? ''),
        }
      }),
    )
  }

  /**
   * Adapt timeline viewer data from the raw observatory.
   * Looks for 'timelineView' key. Falls back to deriving from 'timeline'
   * for backward compatibility. Returns frozen empty array for missing/invalid data.
   */
  private adaptTimelineView(observatory: Record<string, unknown>): readonly TimelineViewModel[] {
    const raw = safeGet<unknown[]>(observatory, 'timelineView')
    if (!Array.isArray(raw)) {
      // Fallback: derive from timeline array
      const fallback = safeGet<unknown[]>(observatory, 'timeline')
      if (Array.isArray(fallback) && fallback.length > 0) {
        return Object.freeze(
          fallback.map((item) => this.adaptTimelineViewFromTimelineItem(isObject(item) ? item : {})),
        )
      }
      return Object.freeze([])
    }
    return Object.freeze(raw.map((item) => this.adaptTimelineViewItem(isObject(item) ? item : {})))
  }

  private adaptTimelineViewItem(item: Record<string, unknown>): TimelineViewModel {
    const entries = this.adaptTimelineViewEntries(item)
    return {
      id: String(safeGet(item, 'id') ?? ''),
      entryCount: entries.length,
      entries,
    }
  }

  private adaptTimelineViewFromTimelineItem(item: Record<string, unknown>): TimelineViewModel {
    const rawEntries = safeGet<unknown[]>(item, 'entries')
    const entries = this.adaptTimelineViewEntriesFromRawEntries(rawEntries)
    return {
      id: String(safeGet(item, 'id') ?? ''),
      entryCount: entries.length,
      entries,
    }
  }

  private adaptTimelineViewEntries(item: Record<string, unknown>): readonly TimelineEntryViewModel[] {
    const raw = safeGet<unknown[]>(item, 'entries')
    return this.adaptTimelineViewEntriesFromRawEntries(raw)
  }

  private adaptTimelineViewEntriesFromRawEntries(raw: unknown[] | undefined): readonly TimelineEntryViewModel[] {
    if (!Array.isArray(raw)) return Object.freeze([])
    return Object.freeze(
      raw.map((entry, i) => {
        const e = isObject(entry) ? entry : {}
        return {
          index: safeCount(safeGet(e, 'index') !== undefined ? safeGet(e, 'index') : i),
          strategy: String(safeGet(e, 'strategy') ?? safeGet(e, 'label') ?? ''),
        }
      }),
    )
  }

  /**
   * Adapt event stream view data from the raw observatory.
   * Looks for 'eventStreamView' key. Returns default EventStreamViewModel
   * for missing/invalid data.
   */
  private adaptEventStreamView(observatory: Record<string, unknown>): EventStreamViewModel {
    const raw = safeGet<Record<string, unknown>>(observatory, 'eventStreamView')
    if (!isObject(raw)) return DEFAULT_EVENT_STREAM

    const rawEvents = safeGet<unknown[]>(raw, 'events')
    if (!Array.isArray(rawEvents)) return DEFAULT_EVENT_STREAM

    const events: readonly EventViewModel[] = Object.freeze(
      rawEvents.map((item) => this.adaptEventViewModel(isObject(item) ? item : {})),
    )

    return Object.freeze({ events })
  }

  private adaptEventViewModel(item: Record<string, unknown>): EventViewModel {
    return {
      id: String(safeGet(item, 'id') ?? ''),
      timestamp: String(safeGet(item, 'timestamp') ?? ''),
      level: this.adaptEventLevel(safeGet(item, 'level')),
      source: String(safeGet(item, 'source') ?? ''),
      ...(typeof safeGet(item, 'type') === 'string' ? { type: safeGet<string>(item, 'type') } : {}),
      message: String(safeGet(item, 'message') ?? ''),
    }
  }

  /** Convert raw level to a valid EventLevel, defaulting to 'info'. */
  private adaptEventLevel(value: unknown): EventLevel {
    if (value === 'info' || value === 'warning' || value === 'error') {
      return value
    }
    return 'info'
  }

  /** Safely adapt an array of items from the observatory. */
  private adaptArray<T>(
    observatory: Record<string, unknown>,
    key: string,
    adaptItem: (item: Record<string, unknown>) => T,
  ): readonly T[] {
    const raw = safeGet<unknown[]>(observatory, key)
    if (!Array.isArray(raw)) return Object.freeze([])
    return Object.freeze(raw.map((item) => adaptItem(isObject(item) ? item : {})))
  }

  private adaptTraceItem(item: Record<string, unknown>): TraceDTO {
    const steps = this.adaptTraceSteps(item)
    return {
      id: String(safeGet(item, 'id') ?? ''),
      label: String(safeGet(item, 'label') ?? ''),
      steps,
    }
  }

  private adaptTraceSteps(item: Record<string, unknown>): readonly TraceStepDTO[] {
    const raw = safeGet<unknown[]>(item, 'steps')
    if (!Array.isArray(raw)) return Object.freeze([])
    return Object.freeze(
      raw.map((step) => {
        const s = isObject(step) ? step : {}
        return {
          id: String(safeGet(s, 'id') ?? ''),
          label: String(safeGet(s, 'label') ?? ''),
          status: String(safeGet(s, 'status') ?? ''),
        }
      }),
    )
  }

  private adaptTimelineItem(item: Record<string, unknown>): TimelineDTO {
    const entries = this.adaptTimelineEntries(item)
    return {
      id: String(safeGet(item, 'id') ?? ''),
      label: String(safeGet(item, 'label') ?? ''),
      entries,
    }
  }

  private adaptTimelineEntries(item: Record<string, unknown>): readonly TimelineEntryDTO[] {
    const raw = safeGet<unknown[]>(item, 'entries')
    if (!Array.isArray(raw)) return Object.freeze([])
    return Object.freeze(
      raw.map((entry) => {
        const e = isObject(entry) ? entry : {}
        return {
          id: String(safeGet(e, 'id') ?? ''),
          label: String(safeGet(e, 'label') ?? ''),
          timestamp: String(safeGet(e, 'timestamp') ?? ''),
        }
      }),
    )
  }

  private adaptHistoryItem(item: Record<string, unknown>): HistoryDTO {
    const entries = this.adaptHistoryEntries(item)
    return {
      id: String(safeGet(item, 'id') ?? ''),
      label: String(safeGet(item, 'label') ?? ''),
      entries,
    }
  }

  private adaptHistoryEntries(item: Record<string, unknown>): readonly HistoryEntryDTO[] {
    const raw = safeGet<unknown[]>(item, 'entries')
    if (!Array.isArray(raw)) return Object.freeze([])
    return Object.freeze(
      raw.map((entry) => {
        const e = isObject(entry) ? entry : {}
        return {
          id: String(safeGet(e, 'id') ?? ''),
          label: String(safeGet(e, 'label') ?? ''),
          timestamp: String(safeGet(e, 'timestamp') ?? ''),
        }
      }),
    )
  }
}

// Re-export DTO types for convenience
export type {
  OverviewDTO,
  TraceDTO,
  TraceStepDTO,
  TraceViewModel,
  TraceSnapshotEntryVM,
  TimelineViewModel,
  TimelineEntryViewModel,
  HistoryViewModel,
  HistoryEvolutionEntryViewModel,
  DiffViewModel,
  DiffChangeViewModel,
  RuntimeViewModel,
  RuntimeEntityViewModel,
  RuntimeComponentViewModel,
  EventStreamViewModel,
  EventViewModel,
  EventLevel,
  TimelineDTO,
  TimelineEntryDTO,
  HistoryDTO,
  HistoryEntryDTO,
  ObservatoryViewModel,
} from './ObservatoryViewModel'
