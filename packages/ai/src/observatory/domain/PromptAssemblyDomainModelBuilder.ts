import type { PromptObservatoryMetadata } from '../PromptObservatoryMetadata'
import type {
  PromptAssemblyDomainModel,
  OverviewDomain,
  TraceDomain,
  TraceStepDomain,
  TimelineDomain,
  TimelineEntryDomain,
  HistoryDomain,
  HistoryEntryDomain,
  DiffDomain,
  RuntimeDomain,
  RuntimeEntityDomain,
  RuntimeComponentDomain,
  EventStreamDomain,
  EventDomain,
  EventLevelDomain,
} from './PromptAssemblyDomainModel'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Check if a value is a non-null object (not an array). */
function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Safely read a property from an unknown object, returning undefined if not found. */
function safeGet<T>(obj: Record<string, unknown>, key: string): T | undefined {
  return obj[key] as T | undefined
}

/** Safely convert a value to a number, returning 0 for missing/invalid. */
function safeNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
    return Math.floor(value)
  }
  return 0
}

/** Safely convert a value to a string, returning empty string for missing/invalid. */
function safeString(value: unknown): string {
  if (typeof value === 'string') return value
  if (typeof value === 'number') return String(value)
  return ''
}

/** Check if a value is a valid EventLevelDomain. */
function isEventLevel(value: unknown): value is EventLevelDomain {
  return value === 'info' || value === 'warning' || value === 'error'
}

/** Safely convert a value to an EventLevelDomain, defaulting to 'info'. */
function safeEventLevel(value: unknown): EventLevelDomain {
  return isEventLevel(value) ? value : 'info'
}

// ---------------------------------------------------------------------------
// Section adapters
// ---------------------------------------------------------------------------

/**
 * Safely adapt overview section.
 * Expected shape: { traceCount?: number, timelineCount?: number, historyCount?: number }
 */
function adaptOverview(raw: unknown): OverviewDomain | undefined {
  if (!isObject(raw)) return undefined

  return Object.freeze({
    traceCount: safeNumber(safeGet(raw, 'traceCount')),
    timelineCount: safeNumber(safeGet(raw, 'timelineCount')),
    historyCount: safeNumber(safeGet(raw, 'historyCount')),
  })
}

/**
 * Safely adapt trace section.
 * Expected shape: Array<{ id?: string, label?: string, steps?: Array<{ id?: string, label?: string, status?: string }> }>
 */
function adaptTrace(raw: unknown): readonly TraceDomain[] | undefined {
  if (!Array.isArray(raw)) return undefined
  if (raw.length === 0) return undefined

  const traces: TraceDomain[] = []
  for (const item of raw) {
    if (!isObject(item)) continue
    const steps = adaptTraceSteps(safeGet(item, 'steps'))
    traces.push(
      Object.freeze({
        id: safeString(safeGet(item, 'id')),
        label: safeString(safeGet(item, 'label')),
        steps,
      }),
    )
  }

  return traces.length > 0 ? Object.freeze(traces) : undefined
}

function adaptTraceSteps(raw: unknown): readonly TraceStepDomain[] {
  if (!Array.isArray(raw)) return Object.freeze([])

  return Object.freeze(
    raw.map((step) => {
      const s = isObject(step) ? step : {}
      return Object.freeze({
        id: safeString(safeGet(s, 'id')),
        label: safeString(safeGet(s, 'label')),
        status: safeString(safeGet(s, 'status')),
      })
    }),
  )
}

/**
 * Safely adapt timeline section.
 * Expected shape: Array<{ id?: string, label?: string, entries?: Array<{ id?: string, label?: string, timestamp?: string }> }>
 */
function adaptTimeline(raw: unknown): readonly TimelineDomain[] | undefined {
  if (!Array.isArray(raw)) return undefined
  if (raw.length === 0) return undefined

  const timelines: TimelineDomain[] = []
  for (const item of raw) {
    if (!isObject(item)) continue
    const entries = adaptTimelineEntries(safeGet(item, 'entries'))
    timelines.push(
      Object.freeze({
        id: safeString(safeGet(item, 'id')),
        label: safeString(safeGet(item, 'label')),
        entries,
      }),
    )
  }

  return timelines.length > 0 ? Object.freeze(timelines) : undefined
}

function adaptTimelineEntries(raw: unknown): readonly TimelineEntryDomain[] {
  if (!Array.isArray(raw)) return Object.freeze([])

  return Object.freeze(
    raw.map((entry) => {
      const e = isObject(entry) ? entry : {}
      return Object.freeze({
        id: safeString(safeGet(e, 'id')),
        label: safeString(safeGet(e, 'label')),
        timestamp: safeString(safeGet(e, 'timestamp')),
      })
    }),
  )
}

/**
 * Safely adapt history section.
 * Expected shape: Array<{ id?: string, label?: string, entries?: Array<{ id?: string, label?: string, timestamp?: string }> }>
 */
function adaptHistory(raw: unknown): readonly HistoryDomain[] | undefined {
  if (!Array.isArray(raw)) return undefined
  if (raw.length === 0) return undefined

  const histories: HistoryDomain[] = []
  for (const item of raw) {
    if (!isObject(item)) continue
    const entries = adaptHistoryEntries(safeGet(item, 'entries'))
    histories.push(
      Object.freeze({
        id: safeString(safeGet(item, 'id')),
        label: safeString(safeGet(item, 'label')),
        entries,
      }),
    )
  }

  return histories.length > 0 ? Object.freeze(histories) : undefined
}

function adaptHistoryEntries(raw: unknown): readonly HistoryEntryDomain[] {
  if (!Array.isArray(raw)) return Object.freeze([])

  return Object.freeze(
    raw.map((entry) => {
      const e = isObject(entry) ? entry : {}
      return Object.freeze({
        id: safeString(safeGet(e, 'id')),
        label: safeString(safeGet(e, 'label')),
        timestamp: safeString(safeGet(e, 'timestamp')),
      })
    }),
  )
}

/**
 * Safely adapt diff section.
 * Expected shape: Array<{ id?: string, timestamp?: string, added?: string[], removed?: string[], changed?: string[] }>
 */
function adaptDiff(raw: unknown): readonly DiffDomain[] | undefined {
  if (!Array.isArray(raw)) return undefined
  if (raw.length === 0) return undefined

  const diffs: DiffDomain[] = []
  for (const item of raw) {
    if (!isObject(item)) continue
    diffs.push(
      Object.freeze({
        id: safeString(safeGet(item, 'id')),
        timestamp: safeString(safeGet(item, 'timestamp')),
        added: safeStringArray(safeGet(item, 'added')),
        removed: safeStringArray(safeGet(item, 'removed')),
        changed: safeStringArray(safeGet(item, 'changed')),
      }),
    )
  }

  return diffs.length > 0 ? Object.freeze(diffs) : undefined
}

/** Safely extract a readonly string array from unknown. */
function safeStringArray(raw: unknown): readonly string[] {
  if (!Array.isArray(raw)) return Object.freeze([])
  return Object.freeze(raw.map((item) => safeString(item)))
}

/**
 * Safely adapt runtime section.
 * Expected shape: { worldId?: string, entityCount?: number, systemCount?: number, eventCount?: number, fps?: number, entities?: Array<...> }
 */
function adaptRuntime(raw: unknown): RuntimeDomain | undefined {
  if (!isObject(raw)) return undefined

  const entities = adaptRuntimeEntities(safeGet(raw, 'entities'))

  return Object.freeze({
    worldId: safeString(safeGet(raw, 'worldId')),
    entityCount: safeNumber(safeGet(raw, 'entityCount')),
    systemCount: safeNumber(safeGet(raw, 'systemCount')),
    eventCount: safeNumber(safeGet(raw, 'eventCount')),
    fps: safeNumber(safeGet(raw, 'fps')),
    entities,
  })
}

function adaptRuntimeEntities(raw: unknown): readonly RuntimeEntityDomain[] {
  if (!Array.isArray(raw)) return Object.freeze([])

  return Object.freeze(
    raw.map((item) => {
      const e = isObject(item) ? item : {}
      return Object.freeze({
        id: safeString(safeGet(e, 'id')),
        type: safeString(safeGet(e, 'type')),
        position: safeString(safeGet(e, 'position')),
        health: adaptHealth(safeGet(e, 'health')),
        state: safeString(safeGet(e, 'state')),
        components: adaptRuntimeComponents(safeGet(e, 'components')),
      })
    }),
  )
}

/** Convert health to string for domain safety. */
function adaptHealth(value: unknown): string {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  if (typeof value === 'string') return value
  return ''
}

function adaptRuntimeComponents(raw: unknown): readonly RuntimeComponentDomain[] {
  if (!Array.isArray(raw)) return Object.freeze([])

  return Object.freeze(
    raw.map((comp) => {
      const c = isObject(comp) ? comp : {}
      return Object.freeze({
        name: safeString(safeGet(c, 'name')),
        data: adaptComponentData(safeGet(c, 'data')),
      })
    }),
  )
}

/** Serialize component data to JSON string for domain safety. */
function adaptComponentData(data: unknown): string {
  if (data === undefined) return ''
  if (typeof data === 'string') return data
  try {
    return JSON.stringify(data, null, 2)
  } catch {
    return String(data ?? '')
  }
}

/**
 * Safely adapt event stream section.
 * Expected shape: { events?: Array<{ id?: string, timestamp?: string, level?: string, source?: string, message?: string }> }
 */
function adaptEventStream(raw: unknown): EventStreamDomain | undefined {
  if (!isObject(raw)) return undefined

  const rawEvents = safeGet<unknown[]>(raw, 'events')
  if (!Array.isArray(rawEvents) || rawEvents.length === 0) return undefined

  const events: EventDomain[] = []
  for (const item of rawEvents) {
    if (!isObject(item)) continue
    events.push(
      Object.freeze({
        id: safeString(safeGet(item, 'id')),
        timestamp: safeString(safeGet(item, 'timestamp')),
        level: safeEventLevel(safeGet(item, 'level')),
        source: safeString(safeGet(item, 'source')),
        message: safeString(safeGet(item, 'message')),
      }),
    )
  }

  return Object.freeze({ events: Object.freeze(events) })
}

// ---------------------------------------------------------------------------
// PromptAssemblyDomainModelBuilder
// ---------------------------------------------------------------------------

/**
 * PromptAssemblyDomainModelBuilder — converts PromptObservatoryMetadata
 * into a typed PromptAssemblyDomainModel.
 *
 * Accepts the existing `unknown`-based metadata contract and produces a
 * fully typed domain model. Invalid or missing sections are omitted.
 * The output is always frozen.
 *
 * Rules:
 * - undefined/null metadata → empty frozen model
 * - non-object metadata → empty frozen model
 * - missing section → omitted from output
 * - invalid section shape → omitted from output
 * - section with valid data → included with typed structure
 * - all arrays are frozen
 * - all objects are frozen
 * - no input mutation
 *
 * Pure. Stateless. Deterministic.
 */
export interface PromptAssemblyDomainModelBuilder {
  /**
   * Build a typed PromptAssemblyDomainModel from metadata.
   *
   * @param metadata — PromptObservatoryMetadata with unknown-typed payloads
   * @returns Frozen PromptAssemblyDomainModel with typed sections
   */
  build(metadata: PromptObservatoryMetadata): PromptAssemblyDomainModel
}

/**
 * DefaultPromptAssemblyDomainModelBuilder — default implementation of
 * PromptAssemblyDomainModelBuilder.
 *
 * Converts each `unknown`-typed section of PromptObservatoryMetadata into
 * its typed domain counterpart using safe, defensive extraction helpers.
 *
 * Pure. Stateless. Deterministic.
 */
export class DefaultPromptAssemblyDomainModelBuilder
  implements PromptAssemblyDomainModelBuilder
{
  build(metadata: PromptObservatoryMetadata): PromptAssemblyDomainModel {
    // Handle invalid input
    if (metadata === undefined || metadata === null) {
      return Object.freeze({})
    }
    if (typeof metadata !== 'object' || Array.isArray(metadata)) {
      return Object.freeze({})
    }

    // Use Record<string, unknown> for mutable accumulation, then cast
    const result: Record<string, unknown> = {}

    // Adapt each section independently
    const overview = adaptOverview(metadata.overview)
    if (overview !== undefined) result.overview = overview

    const trace = adaptTrace(metadata.trace)
    if (trace !== undefined) result.trace = trace

    const timeline = adaptTimeline(metadata.timeline)
    if (timeline !== undefined) result.timeline = timeline

    const history = adaptHistory(metadata.history)
    if (history !== undefined) result.history = history

    const diff = adaptDiff(metadata.diff)
    if (diff !== undefined) result.diff = diff

    const runtime = adaptRuntime(metadata.runtime)
    if (runtime !== undefined) result.runtime = runtime

    const eventStream = adaptEventStream(metadata.eventStream)
    if (eventStream !== undefined) result.eventStream = eventStream

    return Object.freeze(result) as unknown as PromptAssemblyDomainModel
  }
}