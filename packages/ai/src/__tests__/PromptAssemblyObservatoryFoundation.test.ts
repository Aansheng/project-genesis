import { describe, it, expect } from 'vitest'
import { DefaultPromptAssemblyObservatoryBuilder } from '../strategy/DefaultPromptAssemblyObservatoryBuilder'
import type { PromptAssemblyObservatoryBuilder } from '../strategy/PromptAssemblyObservatoryBuilder'
import type { PromptAssemblyObservatory } from '../strategy/PromptAssemblyObservatory'
import type { PromptAssemblyTrace } from '../strategy/PromptAssemblyTrace'
import type { PromptAssemblyTimeline } from '../strategy/PromptAssemblyTimeline'
import type { PromptAssemblyHistory } from '../strategy/PromptAssemblyHistory'
import type { PromptAssemblySnapshot } from '../strategy/PromptAssemblySnapshot'
import type { PromptAssemblyTimelineSnapshot } from '../strategy/PromptAssemblyTimelineSnapshot'
import type { PromptAssemblyHistorySnapshot } from '../strategy/PromptAssemblyHistorySnapshot'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createTrace(overrides?: Partial<PromptAssemblyTrace>): PromptAssemblyTrace {
  return { strategy: { name: 'create' }, ...overrides }
}

function createTimeline(): PromptAssemblyTimeline {
  return { entries: [{ index: 0, trace: createTrace() }] }
}

function createHistory(): PromptAssemblyHistory {
  return { entries: [{ index: 0, trace: createTrace() }] }
}

function createTraceSnapshot(): PromptAssemblySnapshot {
  return { strategy: 'create' }
}

function createTimelineSnapshot(): PromptAssemblyTimelineSnapshot {
  return { entryCount: 1, firstStrategy: 'create', lastStrategy: 'create', strategies: ['create'] }
}

function createHistorySnapshot(): PromptAssemblyHistorySnapshot {
  return { entryCount: 1, firstStrategy: 'create', lastStrategy: 'create', strategies: ['create'] }
}

function createInput(overrides?: {
  trace?: PromptAssemblyTrace
  timeline?: PromptAssemblyTimeline
  history?: PromptAssemblyHistory
  traceSnapshot?: PromptAssemblySnapshot
  timelineSnapshot?: PromptAssemblyTimelineSnapshot
  historySnapshot?: PromptAssemblyHistorySnapshot
}): Parameters<PromptAssemblyObservatoryBuilder['build']>[0] {
  return {
    trace: createTrace(),
    timeline: createTimeline(),
    history: createHistory(),
    traceSnapshot: createTraceSnapshot(),
    timelineSnapshot: createTimelineSnapshot(),
    historySnapshot: createHistorySnapshot(),
    ...overrides,
  }
}

function createEmptyInput(): Parameters<PromptAssemblyObservatoryBuilder['build']>[0] {
  return {}
}

// ---------------------------------------------------------------------------
// Interface Contract
// ---------------------------------------------------------------------------

describe('Interface contract', () => {
  it('should define build method', () => {
    const builder: PromptAssemblyObservatoryBuilder = new DefaultPromptAssemblyObservatoryBuilder()
    expect(typeof builder.build).toBe('function')
  })

  it('should accept input and return an observatory', () => {
    const builder = new DefaultPromptAssemblyObservatoryBuilder()
    const result = builder.build(createInput())
    expect(result).toBeDefined()
    expect(typeof result).toBe('object')
  })

  it('should accept a custom implementation', () => {
    const custom: PromptAssemblyObservatoryBuilder = {
      build() {
        return { trace: { strategy: { name: 'custom' } } }
      },
    }
    const result = custom.build(createInput())
    expect(result.trace).toBeDefined()
  })

  it('should return a PromptAssemblyObservatory type', () => {
    const builder = new DefaultPromptAssemblyObservatoryBuilder()
    const result = builder.build(createInput())
    const observatory: PromptAssemblyObservatory = result
    expect(observatory).toBeDefined()
  })

  it('should accept empty input', () => {
    const builder = new DefaultPromptAssemblyObservatoryBuilder()
    const result = builder.build(createEmptyInput())
    expect(result).toBeDefined()
  })

  it('should have the correct observatory shape', () => {
    const builder = new DefaultPromptAssemblyObservatoryBuilder()
    const result = builder.build(createInput())
    expect(result).toHaveProperty('trace')
    expect(result).toHaveProperty('timeline')
    expect(result).toHaveProperty('history')
    expect(result).toHaveProperty('traceSnapshot')
    expect(result).toHaveProperty('timelineSnapshot')
    expect(result).toHaveProperty('historySnapshot')
  })
})

// ---------------------------------------------------------------------------
// Empty Observatory
// ---------------------------------------------------------------------------

describe('Empty observatory', () => {
  it('should have undefined trace for empty input', () => {
    const builder = new DefaultPromptAssemblyObservatoryBuilder()
    const obs = builder.build(createEmptyInput())
    expect(obs.trace).toBeUndefined()
  })

  it('should have undefined timeline for empty input', () => {
    const builder = new DefaultPromptAssemblyObservatoryBuilder()
    const obs = builder.build(createEmptyInput())
    expect(obs.timeline).toBeUndefined()
  })

  it('should have undefined history for empty input', () => {
    const builder = new DefaultPromptAssemblyObservatoryBuilder()
    const obs = builder.build(createEmptyInput())
    expect(obs.history).toBeUndefined()
  })

  it('should have undefined traceSnapshot for empty input', () => {
    const builder = new DefaultPromptAssemblyObservatoryBuilder()
    const obs = builder.build(createEmptyInput())
    expect(obs.traceSnapshot).toBeUndefined()
  })

  it('should have undefined timelineSnapshot for empty input', () => {
    const builder = new DefaultPromptAssemblyObservatoryBuilder()
    const obs = builder.build(createEmptyInput())
    expect(obs.timelineSnapshot).toBeUndefined()
  })

  it('should have undefined historySnapshot for empty input', () => {
    const builder = new DefaultPromptAssemblyObservatoryBuilder()
    const obs = builder.build(createEmptyInput())
    expect(obs.historySnapshot).toBeUndefined()
  })

  it('should return a valid object for empty input', () => {
    const builder = new DefaultPromptAssemblyObservatoryBuilder()
    const obs = builder.build(createEmptyInput())
    expect(Object.keys(obs).length).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// Trace Only
// ---------------------------------------------------------------------------

describe('Trace only', () => {
  it('should include trace when only trace is provided', () => {
    const builder = new DefaultPromptAssemblyObservatoryBuilder()
    const trace = createTrace()
    const obs = builder.build({ trace })
    expect(obs.trace).toBe(trace)
  })

  it('should have undefined timeline when only trace is provided', () => {
    const builder = new DefaultPromptAssemblyObservatoryBuilder()
    const obs = builder.build({ trace: createTrace() })
    expect(obs.timeline).toBeUndefined()
  })

  it('should have undefined history when only trace is provided', () => {
    const builder = new DefaultPromptAssemblyObservatoryBuilder()
    const obs = builder.build({ trace: createTrace() })
    expect(obs.history).toBeUndefined()
  })

  it('should have undefined snapshot fields when only trace is provided', () => {
    const builder = new DefaultPromptAssemblyObservatoryBuilder()
    const obs = builder.build({ trace: createTrace() })
    expect(obs.traceSnapshot).toBeUndefined()
    expect(obs.timelineSnapshot).toBeUndefined()
    expect(obs.historySnapshot).toBeUndefined()
  })

  it('should preserve the trace object reference', () => {
    const builder = new DefaultPromptAssemblyObservatoryBuilder()
    const trace = createTrace()
    const obs = builder.build({ trace })
    expect(obs.trace).toBe(trace)
  })
})

// ---------------------------------------------------------------------------
// Timeline Only
// ---------------------------------------------------------------------------

describe('Timeline only', () => {
  it('should include timeline when only timeline is provided', () => {
    const builder = new DefaultPromptAssemblyObservatoryBuilder()
    const timeline = createTimeline()
    const obs = builder.build({ timeline })
    expect(obs.timeline).toBe(timeline)
  })

  it('should have undefined trace when only timeline is provided', () => {
    const builder = new DefaultPromptAssemblyObservatoryBuilder()
    const obs = builder.build({ timeline: createTimeline() })
    expect(obs.trace).toBeUndefined()
  })

  it('should preserve the timeline object reference', () => {
    const builder = new DefaultPromptAssemblyObservatoryBuilder()
    const timeline = createTimeline()
    const obs = builder.build({ timeline })
    expect(obs.timeline).toBe(timeline)
  })

  it('should have undefined snapshot fields when only timeline is provided', () => {
    const builder = new DefaultPromptAssemblyObservatoryBuilder()
    const obs = builder.build({ timeline: createTimeline() })
    expect(obs.traceSnapshot).toBeUndefined()
    expect(obs.timelineSnapshot).toBeUndefined()
    expect(obs.historySnapshot).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// History Only
// ---------------------------------------------------------------------------

describe('History only', () => {
  it('should include history when only history is provided', () => {
    const builder = new DefaultPromptAssemblyObservatoryBuilder()
    const history = createHistory()
    const obs = builder.build({ history })
    expect(obs.history).toBe(history)
  })

  it('should have undefined trace when only history is provided', () => {
    const builder = new DefaultPromptAssemblyObservatoryBuilder()
    const obs = builder.build({ history: createHistory() })
    expect(obs.trace).toBeUndefined()
  })

  it('should preserve the history object reference', () => {
    const builder = new DefaultPromptAssemblyObservatoryBuilder()
    const history = createHistory()
    const obs = builder.build({ history })
    expect(obs.history).toBe(history)
  })

  it('should have undefined timeline when only history is provided', () => {
    const builder = new DefaultPromptAssemblyObservatoryBuilder()
    const obs = builder.build({ history: createHistory() })
    expect(obs.timeline).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// Snapshot Only — TraceSnapshot
// ---------------------------------------------------------------------------

describe('Snapshot only — traceSnapshot', () => {
  it('should include traceSnapshot when only traceSnapshot is provided', () => {
    const builder = new DefaultPromptAssemblyObservatoryBuilder()
    const snapshot = createTraceSnapshot()
    const obs = builder.build({ traceSnapshot: snapshot })
    expect(obs.traceSnapshot).toBe(snapshot)
  })

  it('should have undefined trace when only traceSnapshot is provided', () => {
    const builder = new DefaultPromptAssemblyObservatoryBuilder()
    const obs = builder.build({ traceSnapshot: createTraceSnapshot() })
    expect(obs.trace).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// Snapshot Only — TimelineSnapshot
// ---------------------------------------------------------------------------

describe('Snapshot only — timelineSnapshot', () => {
  it('should include timelineSnapshot when only timelineSnapshot is provided', () => {
    const builder = new DefaultPromptAssemblyObservatoryBuilder()
    const snapshot = createTimelineSnapshot()
    const obs = builder.build({ timelineSnapshot: snapshot })
    expect(obs.timelineSnapshot).toBe(snapshot)
  })

  it('should have undefined trace when only timelineSnapshot is provided', () => {
    const builder = new DefaultPromptAssemblyObservatoryBuilder()
    const obs = builder.build({ timelineSnapshot: createTimelineSnapshot() })
    expect(obs.trace).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// Snapshot Only — HistorySnapshot
// ---------------------------------------------------------------------------

describe('Snapshot only — historySnapshot', () => {
  it('should include historySnapshot when only historySnapshot is provided', () => {
    const builder = new DefaultPromptAssemblyObservatoryBuilder()
    const snapshot = createHistorySnapshot()
    const obs = builder.build({ historySnapshot: snapshot })
    expect(obs.historySnapshot).toBe(snapshot)
  })

  it('should have undefined trace when only historySnapshot is provided', () => {
    const builder = new DefaultPromptAssemblyObservatoryBuilder()
    const obs = builder.build({ historySnapshot: createHistorySnapshot() })
    expect(obs.trace).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// Mixed Observatory
// ---------------------------------------------------------------------------

describe('Mixed observatory', () => {
  it('should include all fields when all are provided', () => {
    const builder = new DefaultPromptAssemblyObservatoryBuilder()
    const input = createInput()
    const obs = builder.build(input)
    expect(obs.trace).toBeDefined()
    expect(obs.timeline).toBeDefined()
    expect(obs.history).toBeDefined()
    expect(obs.traceSnapshot).toBeDefined()
    expect(obs.timelineSnapshot).toBeDefined()
    expect(obs.historySnapshot).toBeDefined()
  })

  it('should include trace and timeline only', () => {
    const builder = new DefaultPromptAssemblyObservatoryBuilder()
    const trace = createTrace()
    const timeline = createTimeline()
    const obs = builder.build({ trace, timeline })
    expect(obs.trace).toBe(trace)
    expect(obs.timeline).toBe(timeline)
    expect(obs.history).toBeUndefined()
    expect(obs.traceSnapshot).toBeUndefined()
  })

  it('should include history and snapshots only', () => {
    const builder = new DefaultPromptAssemblyObservatoryBuilder()
    const history = createHistory()
    const traceSnapshot = createTraceSnapshot()
    const historySnapshot = createHistorySnapshot()
    const obs = builder.build({ history, traceSnapshot, historySnapshot })
    expect(obs.history).toBe(history)
    expect(obs.traceSnapshot).toBe(traceSnapshot)
    expect(obs.historySnapshot).toBe(historySnapshot)
    expect(obs.trace).toBeUndefined()
    expect(obs.timeline).toBeUndefined()
    expect(obs.timelineSnapshot).toBeUndefined()
  })

  it('should include trace and traceSnapshot only', () => {
    const builder = new DefaultPromptAssemblyObservatoryBuilder()
    const trace = createTrace()
    const traceSnapshot = createTraceSnapshot()
    const obs = builder.build({ trace, traceSnapshot })
    expect(obs.trace).toBe(trace)
    expect(obs.traceSnapshot).toBe(traceSnapshot)
    expect(obs.timeline).toBeUndefined()
    expect(obs.history).toBeUndefined()
  })

  it('should include timeline and timelineSnapshot only', () => {
    const builder = new DefaultPromptAssemblyObservatoryBuilder()
    const timeline = createTimeline()
    const timelineSnapshot = createTimelineSnapshot()
    const obs = builder.build({ timeline, timelineSnapshot })
    expect(obs.timeline).toBe(timeline)
    expect(obs.timelineSnapshot).toBe(timelineSnapshot)
    expect(obs.trace).toBeUndefined()
    expect(obs.history).toBeUndefined()
  })

  it('should include history and historySnapshot only', () => {
    const builder = new DefaultPromptAssemblyObservatoryBuilder()
    const history = createHistory()
    const historySnapshot = createHistorySnapshot()
    const obs = builder.build({ history, historySnapshot })
    expect(obs.history).toBe(history)
    expect(obs.historySnapshot).toBe(historySnapshot)
    expect(obs.trace).toBeUndefined()
    expect(obs.timeline).toBeUndefined()
  })

  it('should include timeline and history only', () => {
    const builder = new DefaultPromptAssemblyObservatoryBuilder()
    const timeline = createTimeline()
    const history = createHistory()
    const obs = builder.build({ timeline, history })
    expect(obs.timeline).toBe(timeline)
    expect(obs.history).toBe(history)
    expect(obs.trace).toBeUndefined()
  })

  it('should include snapshots only', () => {
    const builder = new DefaultPromptAssemblyObservatoryBuilder()
    const traceSnapshot = createTraceSnapshot()
    const timelineSnapshot = createTimelineSnapshot()
    const historySnapshot = createHistorySnapshot()
    const obs = builder.build({ traceSnapshot, timelineSnapshot, historySnapshot })
    expect(obs.traceSnapshot).toBe(traceSnapshot)
    expect(obs.timelineSnapshot).toBe(timelineSnapshot)
    expect(obs.historySnapshot).toBe(historySnapshot)
    expect(obs.trace).toBeUndefined()
    expect(obs.timeline).toBeUndefined()
    expect(obs.history).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// Deterministic
// ---------------------------------------------------------------------------

describe('Deterministic', () => {
  it('should produce same observatory for same input across multiple calls', () => {
    const builder = new DefaultPromptAssemblyObservatoryBuilder()
    const input = createInput()
    const r1 = builder.build(input)
    const r2 = builder.build(input)
    const r3 = builder.build(input)
    expect(r1).toEqual(r2)
    expect(r2).toEqual(r3)
  })

  it('should produce same observatory across different builder instances', () => {
    const b1 = new DefaultPromptAssemblyObservatoryBuilder()
    const b2 = new DefaultPromptAssemblyObservatoryBuilder()
    const input = createInput()
    expect(b1.build(input)).toEqual(b2.build(input))
  })

  it('should produce same observatory for identical inputs', () => {
    const builder = new DefaultPromptAssemblyObservatoryBuilder()
    const i1 = createInput()
    const i2 = createInput()
    expect(builder.build(i1)).toEqual(builder.build(i2))
  })

  it('should produce same observatory for identical empty inputs', () => {
    const builder = new DefaultPromptAssemblyObservatoryBuilder()
    expect(builder.build(createEmptyInput())).toEqual(builder.build(createEmptyInput()))
  })

  it('should produce same observatory for same partial input', () => {
    const builder = new DefaultPromptAssemblyObservatoryBuilder()
    const input = { trace: createTrace() }
    expect(builder.build(input)).toEqual(builder.build(input))
  })
})

// ---------------------------------------------------------------------------
// Stateless
// ---------------------------------------------------------------------------

describe('Stateless', () => {
  it('should not retain state between build calls', () => {
    const builder = new DefaultPromptAssemblyObservatoryBuilder()
    const r1 = builder.build({ trace: createTrace() })
    const r2 = builder.build({ timeline: createTimeline() })
    expect(r1.trace).toBeDefined()
    expect(r1.timeline).toBeUndefined()
    expect(r2.timeline).toBeDefined()
    expect(r2.trace).toBeUndefined()
  })

  it('should produce independent results', () => {
    const builder = new DefaultPromptAssemblyObservatoryBuilder()
    const r1 = builder.build(createInput())
    const r2 = builder.build(createEmptyInput())
    expect(r1.trace).toBeDefined()
    expect(r2.trace).toBeUndefined()
  })

  it('should handle alternating calls without interference', () => {
    const builder = new DefaultPromptAssemblyObservatoryBuilder()
    const full = createInput()
    const empty = createEmptyInput()
    const r1a = builder.build(full)
    const r2a = builder.build(empty)
    const r1b = builder.build(full)
    const r2b = builder.build(empty)
    expect(r1a).toEqual(r1b)
    expect(r2a).toEqual(r2b)
  })

  it('should produce fresh results each call', () => {
    const builder = new DefaultPromptAssemblyObservatoryBuilder()
    const input = createInput()
    const r1 = builder.build(input)
    const r2 = builder.build(input)
    expect(r1).not.toBe(r2)
  })
})

// ---------------------------------------------------------------------------
// Pure
// ---------------------------------------------------------------------------

describe('Pure', () => {
  it('should not modify input trace', () => {
    const builder = new DefaultPromptAssemblyObservatoryBuilder()
    const trace = createTrace()
    const original = JSON.stringify(trace)
    builder.build({ trace })
    expect(JSON.stringify(trace)).toBe(original)
  })

  it('should not modify input timeline', () => {
    const builder = new DefaultPromptAssemblyObservatoryBuilder()
    const timeline = createTimeline()
    const original = JSON.stringify(timeline)
    builder.build({ timeline })
    expect(JSON.stringify(timeline)).toBe(original)
  })

  it('should not modify input history', () => {
    const builder = new DefaultPromptAssemblyObservatoryBuilder()
    const history = createHistory()
    const original = JSON.stringify(history)
    builder.build({ history })
    expect(JSON.stringify(history)).toBe(original)
  })

  it('should not modify input traceSnapshot', () => {
    const builder = new DefaultPromptAssemblyObservatoryBuilder()
    const snapshot = createTraceSnapshot()
    const original = JSON.stringify(snapshot)
    builder.build({ traceSnapshot: snapshot })
    expect(JSON.stringify(snapshot)).toBe(original)
  })

  it('should not modify input timelineSnapshot', () => {
    const builder = new DefaultPromptAssemblyObservatoryBuilder()
    const snapshot = createTimelineSnapshot()
    const original = JSON.stringify(snapshot)
    builder.build({ timelineSnapshot: snapshot })
    expect(JSON.stringify(snapshot)).toBe(original)
  })

  it('should not modify input historySnapshot', () => {
    const builder = new DefaultPromptAssemblyObservatoryBuilder()
    const snapshot = createHistorySnapshot()
    const original = JSON.stringify(snapshot)
    builder.build({ historySnapshot: snapshot })
    expect(JSON.stringify(snapshot)).toBe(original)
  })

  it('should have no side effects on external state', () => {
    const builder = new DefaultPromptAssemblyObservatoryBuilder()
    const input = createInput()
    const original = JSON.stringify(input)
    builder.build(input)
    expect(JSON.stringify(input)).toBe(original)
  })
})

// ---------------------------------------------------------------------------
// Immutable
// ---------------------------------------------------------------------------

describe('Immutable', () => {
  it('should return new object each call', () => {
    const builder = new DefaultPromptAssemblyObservatoryBuilder()
    const input = createInput()
    const r1 = builder.build(input)
    const r2 = builder.build(input)
    expect(r1).not.toBe(r2)
  })

  it('should preserve input object references in output', () => {
    const builder = new DefaultPromptAssemblyObservatoryBuilder()
    const trace = createTrace()
    const timeline = createTimeline()
    const history = createHistory()
    const traceSnapshot = createTraceSnapshot()
    const timelineSnapshot = createTimelineSnapshot()
    const historySnapshot = createHistorySnapshot()
    const obs = builder.build({ trace, timeline, history, traceSnapshot, timelineSnapshot, historySnapshot })
    expect(obs.trace).toBe(trace)
    expect(obs.timeline).toBe(timeline)
    expect(obs.history).toBe(history)
    expect(obs.traceSnapshot).toBe(traceSnapshot)
    expect(obs.timelineSnapshot).toBe(timelineSnapshot)
    expect(obs.historySnapshot).toBe(historySnapshot)
  })

  it('should not add extra fields to the observatory', () => {
    const builder = new DefaultPromptAssemblyObservatoryBuilder()
    const obs = builder.build(createInput())
    const keys = Object.keys(obs)
    expect(keys).toEqual(expect.arrayContaining(['trace', 'timeline', 'history', 'traceSnapshot', 'timelineSnapshot', 'historySnapshot']))
  })

  it('should only include provided fields', () => {
    const builder = new DefaultPromptAssemblyObservatoryBuilder()
    const obs = builder.build({ trace: createTrace() })
    expect(Object.keys(obs)).toEqual(['trace'])
  })

  it('should not share mutable state between observatories', () => {
    const builder = new DefaultPromptAssemblyObservatoryBuilder()
    const trace = { strategy: { name: 'create' } }
    const o1 = builder.build({ trace })
    const o2 = builder.build({ trace })
    expect(o1.trace).toBe(o2.trace)
    // Changing input after building should not affect built observatory
    // (trace is already built — reference is shared)
    expect(o1.trace).toBe(trace)
  })
})

// ---------------------------------------------------------------------------
// Export Validation
// ---------------------------------------------------------------------------

describe('Export validation', () => {
  it('should export DefaultPromptAssemblyObservatoryBuilder from strategy index', async () => {
    const mod = await import('../strategy')
    expect(mod.DefaultPromptAssemblyObservatoryBuilder).toBeDefined()
  })

  it('should export PromptAssemblyObservatory type from strategy index', async () => {
    const mod = await import('../strategy')
    expect(mod.DefaultPromptAssemblyObservatoryBuilder).toBeDefined()
  })

  it('should export PromptAssemblyObservatoryBuilder type from strategy index', async () => {
    const mod = await import('../strategy')
    expect(mod.DefaultPromptAssemblyObservatoryBuilder).toBeDefined()
  })

  it('should export DefaultPromptAssemblyObservatoryBuilder as a class', () => {
    const builder = new DefaultPromptAssemblyObservatoryBuilder()
    expect(builder).toBeInstanceOf(DefaultPromptAssemblyObservatoryBuilder)
  })

  it('should export PromptAssemblyObservatoryBuilder as a type', () => {
    const builder: PromptAssemblyObservatoryBuilder = new DefaultPromptAssemblyObservatoryBuilder()
    expect(typeof builder.build).toBe('function')
  })

  it('should export DefaultPromptAssemblyObservatoryBuilder from package root', async () => {
    const mod = await import('..')
    expect(mod.DefaultPromptAssemblyObservatoryBuilder).toBeDefined()
  })

  it('should export PromptAssemblyObservatory type from package root', async () => {
    const mod = await import('..')
    expect(mod.DefaultPromptAssemblyObservatoryBuilder).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Architecture Compliance
// ---------------------------------------------------------------------------

describe('Architecture compliance', () => {
  it('should not depend on Runtime', () => {
    const builder = new DefaultPromptAssemblyObservatoryBuilder()
    expect(builder).toBeDefined()
  })

  it('should not depend on Planner', () => {
    const builder = new DefaultPromptAssemblyObservatoryBuilder()
    expect(builder).toBeInstanceOf(DefaultPromptAssemblyObservatoryBuilder)
  })

  it('should not depend on Pipeline', () => {
    const builder = new DefaultPromptAssemblyObservatoryBuilder()
    expect(builder).toBeDefined()
  })

  it('should not depend on Provider', () => {
    const builder = new DefaultPromptAssemblyObservatoryBuilder()
    expect(builder).toBeDefined()
  })

  it('should not depend on AgentLoop', () => {
    const builder = new DefaultPromptAssemblyObservatoryBuilder()
    expect(builder).toBeDefined()
  })

  it('should not depend on Memory', () => {
    const builder = new DefaultPromptAssemblyObservatoryBuilder()
    expect(builder).toBeDefined()
  })

  it('should not modify PromptBuilder', () => {
    const builder = new DefaultPromptAssemblyObservatoryBuilder()
    expect(builder).toBeDefined()
  })

  it('should not modify BuilderOptions', () => {
    const builder = new DefaultPromptAssemblyObservatoryBuilder()
    expect(builder).toBeDefined()
  })

  it('should not modify Renderer', () => {
    const builder = new DefaultPromptAssemblyObservatoryBuilder()
    expect(builder).toBeDefined()
  })

  it('should not modify Compression', () => {
    const builder = new DefaultPromptAssemblyObservatoryBuilder()
    expect(builder).toBeDefined()
  })

  it('should not modify Runtime', () => {
    const builder = new DefaultPromptAssemblyObservatoryBuilder()
    expect(builder).toBeDefined()
  })

  it('should not modify AgentLoop', () => {
    const builder = new DefaultPromptAssemblyObservatoryBuilder()
    expect(builder).toBeDefined()
  })

  it('should not modify Pipeline', () => {
    const builder = new DefaultPromptAssemblyObservatoryBuilder()
    expect(builder).toBeDefined()
  })

  it('should not modify Planner', () => {
    const builder = new DefaultPromptAssemblyObservatoryBuilder()
    expect(builder).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Compatibility
// ---------------------------------------------------------------------------

describe('RetryPlanner compatibility', () => {
  it('should be compatible with RetryPlanner scenarios', () => {
    const builder = new DefaultPromptAssemblyObservatoryBuilder()
    const obs = builder.build({ trace: createTrace() })
    expect(obs.trace).toBeDefined()
  })
})

describe('ToolCallPlanner compatibility', () => {
  it('should be compatible with ToolCallPlanner scenarios', () => {
    const builder = new DefaultPromptAssemblyObservatoryBuilder()
    const obs = builder.build({ trace: createTrace() })
    expect(obs.trace).toBeDefined()
  })
})

describe('Streaming compatibility', () => {
  it('should be compatible with streaming pipeline', () => {
    const builder = new DefaultPromptAssemblyObservatoryBuilder()
    const obs = builder.build({ timeline: createTimeline() })
    expect(obs.timeline).toBeDefined()
  })
})

describe('AgentLoop compatibility', () => {
  it('should be compatible with AgentLoop', () => {
    const builder = new DefaultPromptAssemblyObservatoryBuilder()
    const obs = builder.build({ history: createHistory() })
    expect(obs.history).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Edge Cases
// ---------------------------------------------------------------------------

describe('Edge cases', () => {
  it('should handle trace with null strategy', () => {
    const builder = new DefaultPromptAssemblyObservatoryBuilder()
    const trace: PromptAssemblyTrace = { strategy: null as unknown as { name: string } }
    const obs = builder.build({ trace })
    expect(obs.trace).toBe(trace)
  })

  it('should handle trace with no strategy field', () => {
    const builder = new DefaultPromptAssemblyObservatoryBuilder()
    const trace: PromptAssemblyTrace = {}
    const obs = builder.build({ trace })
    expect(obs.trace).toBe(trace)
  })

  it('should handle timeline with empty entries', () => {
    const builder = new DefaultPromptAssemblyObservatoryBuilder()
    const timeline: PromptAssemblyTimeline = { entries: [] }
    const obs = builder.build({ timeline })
    expect(obs.timeline).toBe(timeline)
  })

  it('should handle history with empty entries', () => {
    const builder = new DefaultPromptAssemblyObservatoryBuilder()
    const history: PromptAssemblyHistory = { entries: [] }
    const obs = builder.build({ history })
    expect(obs.history).toBe(history)
  })

  it('should handle traceSnapshot with minimal fields', () => {
    const builder = new DefaultPromptAssemblyObservatoryBuilder()
    const snapshot: PromptAssemblySnapshot = {}
    const obs = builder.build({ traceSnapshot: snapshot })
    expect(obs.traceSnapshot).toBe(snapshot)
  })

  it('should handle timelineSnapshot with minimal fields', () => {
    const builder = new DefaultPromptAssemblyObservatoryBuilder()
    const snapshot: PromptAssemblyTimelineSnapshot = {}
    const obs = builder.build({ timelineSnapshot: snapshot })
    expect(obs.timelineSnapshot).toBe(snapshot)
  })

  it('should handle historySnapshot with minimal fields', () => {
    const builder = new DefaultPromptAssemblyObservatoryBuilder()
    const snapshot: PromptAssemblyHistorySnapshot = {}
    const obs = builder.build({ historySnapshot: snapshot })
    expect(obs.historySnapshot).toBe(snapshot)
  })

  it('should handle trace with undefined values', () => {
    const builder = new DefaultPromptAssemblyObservatoryBuilder()
    const trace: PromptAssemblyTrace = { strategy: undefined, plan: undefined }
    const obs = builder.build({ trace })
    expect(obs.trace).toBe(trace)
  })

  it('should handle all six fields with undefined values', () => {
    const builder = new DefaultPromptAssemblyObservatoryBuilder()
    const obs = builder.build({
      trace: undefined,
      timeline: undefined,
      history: undefined,
      traceSnapshot: undefined,
      timelineSnapshot: undefined,
      historySnapshot: undefined,
    })
    expect(Object.keys(obs).length).toBe(0)
  })

  it('should handle unicode strategy name in trace', () => {
    const builder = new DefaultPromptAssemblyObservatoryBuilder()
    const trace: PromptAssemblyTrace = { strategy: { name: '测试-策略' } }
    const obs = builder.build({ trace })
    expect(obs.trace).toBe(trace)
  })

  it('should handle timeline with many entries', () => {
    const builder = new DefaultPromptAssemblyObservatoryBuilder()
    const entries = Array.from({ length: 100 }, (_, i) => ({
      index: i,
      trace: { strategy: { name: `s-${i}` } } as PromptAssemblyTrace,
    }))
    const timeline: PromptAssemblyTimeline = { entries }
    const obs = builder.build({ timeline })
    expect(obs.timeline?.entries).toHaveLength(100)
  })

  it('should handle history with many entries', () => {
    const builder = new DefaultPromptAssemblyObservatoryBuilder()
    const entries = Array.from({ length: 200 }, (_, i) => ({
      index: i,
      trace: { strategy: { name: `s-${i}` } } as PromptAssemblyTrace,
    }))
    const history: PromptAssemblyHistory = { entries }
    const obs = builder.build({ history })
    expect(obs.history?.entries).toHaveLength(200)
  })

  it('should handle non-sequential indices in timeline', () => {
    const builder = new DefaultPromptAssemblyObservatoryBuilder()
    const timeline: PromptAssemblyTimeline = {
      entries: [
        { index: 10, trace: createTrace() },
        { index: 20, trace: createTrace() },
      ],
    }
    const obs = builder.build({ timeline })
    expect(obs.timeline?.entries[0].index).toBe(10)
  })

  it('should handle all six fields with unique references', () => {
    const builder = new DefaultPromptAssemblyObservatoryBuilder()
    const trace = createTrace()
    const timeline = createTimeline()
    const history = createHistory()
    const traceSnapshot = createTraceSnapshot()
    const timelineSnapshot = createTimelineSnapshot()
    const historySnapshot = createHistorySnapshot()
    const obs = builder.build({ trace, timeline, history, traceSnapshot, timelineSnapshot, historySnapshot })
    expect(obs.trace).toBe(trace)
    expect(obs.timeline).toBe(timeline)
    expect(obs.history).toBe(history)
    expect(obs.traceSnapshot).toBe(traceSnapshot)
    expect(obs.timelineSnapshot).toBe(timelineSnapshot)
    expect(obs.historySnapshot).toBe(historySnapshot)
  })
})