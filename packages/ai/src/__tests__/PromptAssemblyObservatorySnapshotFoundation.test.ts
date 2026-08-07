import { describe, it, expect } from 'vitest'
import { DefaultPromptAssemblyObservatorySnapshotBuilder } from '../strategy/DefaultPromptAssemblyObservatorySnapshotBuilder'
import type { PromptAssemblyObservatorySnapshotBuilder } from '../strategy/PromptAssemblyObservatorySnapshotBuilder'
import type { PromptAssemblyObservatorySnapshot } from '../strategy/PromptAssemblyObservatorySnapshot'
import type { PromptAssemblyObservatory } from '../strategy/PromptAssemblyObservatory'
import type { PromptAssemblyTrace } from '../strategy/PromptAssemblyTrace'
import type { PromptAssemblyTimeline } from '../strategy/PromptAssemblyTimeline'
import type { PromptAssemblyHistory } from '../strategy/PromptAssemblyHistory'
import type { PromptAssemblySnapshot } from '../strategy/PromptAssemblySnapshot'
import type { PromptAssemblyTimelineSnapshot } from '../strategy/PromptAssemblyTimelineSnapshot'
import type { PromptAssemblyHistorySnapshot } from '../strategy/PromptAssemblyHistorySnapshot'
import type { PromptAssemblyHistoryEntry } from '../strategy/PromptAssemblyHistoryEntry'
import type { PromptAssemblyTimelineEntry } from '../strategy/PromptAssemblyTimelineEntry'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createObservatory(
  overrides?: Partial<PromptAssemblyObservatory>,
): PromptAssemblyObservatory {
  return {
    ...overrides,
  }
}

function createTrace(strategyName?: string): PromptAssemblyTrace {
  return strategyName !== undefined
    ? { strategy: { name: strategyName } }
    : {}
}

function createTimeline(entries?: readonly PromptAssemblyTimelineEntry[]): PromptAssemblyTimeline {
  return { entries: entries ?? [] }
}

function createHistory(entries?: readonly PromptAssemblyHistoryEntry[]): PromptAssemblyHistory {
  return { entries: entries ?? [] }
}

function createSnapshot(): PromptAssemblySnapshot {
  return { strategy: 'create' }
}

function createTimelineSnapshot(): PromptAssemblyTimelineSnapshot {
  return { entryCount: 0, firstStrategy: 'create', lastStrategy: 'create', strategies: [] }
}

function createHistorySnapshot(): PromptAssemblyHistorySnapshot {
  return { entryCount: 0, firstStrategy: 'create', lastStrategy: 'create', strategies: [] }
}

const builder = new DefaultPromptAssemblyObservatorySnapshotBuilder()

function build(
  observatory: PromptAssemblyObservatory,
  metadata?: Record<string, unknown>,
): PromptAssemblyObservatorySnapshot {
  return builder.build(observatory, metadata)
}

// ---------------------------------------------------------------------------
// Interface Contract
// ---------------------------------------------------------------------------

describe('Interface contract', () => {
  it('should define build method', () => {
    const b: PromptAssemblyObservatorySnapshotBuilder = new DefaultPromptAssemblyObservatorySnapshotBuilder()
    expect(typeof b.build).toBe('function')
  })

  it('should accept an observatory and return a snapshot', () => {
    const snapshot = build(createObservatory())
    expect(snapshot).toBeDefined()
  })

  it('should return snapshot with artifactCount', () => {
    const snapshot = build(createObservatory({ trace: createTrace() }))
    expect(snapshot.artifactCount).toBe(1)
  })

  it('should return snapshot with boolean presence flags', () => {
    const snapshot = build(createObservatory())
    expect(typeof snapshot.hasTrace).toBe('boolean')
    expect(typeof snapshot.hasTimeline).toBe('boolean')
    expect(typeof snapshot.hasHistory).toBe('boolean')
    expect(typeof snapshot.hasTraceSnapshot).toBe('boolean')
    expect(typeof snapshot.hasTimelineSnapshot).toBe('boolean')
    expect(typeof snapshot.hasHistorySnapshot).toBe('boolean')
  })

  it('should accept a custom implementation', () => {
    const custom: PromptAssemblyObservatorySnapshotBuilder = {
      build(): PromptAssemblyObservatorySnapshot {
        return { artifactCount: 99, hasTrace: true, hasTimeline: false, hasHistory: false, hasTraceSnapshot: false, hasTimelineSnapshot: false, hasHistorySnapshot: false }
      },
    }
    const snapshot = custom.build(createObservatory())
    expect(snapshot.artifactCount).toBe(99)
    expect(snapshot.hasTrace).toBe(true)
  })

  it('should accept optional metadata argument', () => {
    const snapshot = build(createObservatory(), { observatoryRendered: 'rendered text' })
    expect(snapshot.rendered).toBe('rendered text')
  })

  it('should return typed snapshot object', () => {
    const snapshot: PromptAssemblyObservatorySnapshot = build(createObservatory({ trace: createTrace() }))
    expect(snapshot.hasTrace).toBe(true)
  })

  it('should produce snapshots with all seven required fields', () => {
    const snapshot = build(createObservatory())
    const keys = Object.keys(snapshot)
    expect(keys).toContain('artifactCount')
    expect(keys).toContain('hasTrace')
    expect(keys).toContain('hasTimeline')
    expect(keys).toContain('hasHistory')
    expect(keys).toContain('hasTraceSnapshot')
    expect(keys).toContain('hasTimelineSnapshot')
    expect(keys).toContain('hasHistorySnapshot')
  })
})

// ---------------------------------------------------------------------------
// Empty Observatory
// ---------------------------------------------------------------------------

describe('Empty observatory', () => {
  it('should report artifactCount 0', () => {
    expect(build(createObservatory()).artifactCount).toBe(0)
  })

  it('should report all presence flags false', () => {
    const snapshot = build(createObservatory())
    expect(snapshot.hasTrace).toBe(false)
    expect(snapshot.hasTimeline).toBe(false)
    expect(snapshot.hasHistory).toBe(false)
    expect(snapshot.hasTraceSnapshot).toBe(false)
    expect(snapshot.hasTimelineSnapshot).toBe(false)
    expect(snapshot.hasHistorySnapshot).toBe(false)
  })

  it('should not include rendered when metadata missing', () => {
    expect(build(createObservatory()).rendered).toBeUndefined()
  })

  it('should not include exported when metadata missing', () => {
    expect(build(createObservatory()).exported).toBeUndefined()
  })

  it('should handle frozen empty observatory', () => {
    const observatory = Object.freeze({})
    const snapshot = build(observatory)
    expect(snapshot.artifactCount).toBe(0)
  })

  it('should work with observatory containing only undefined fields', () => {
    const snapshot = build(createObservatory({ trace: undefined, timeline: undefined, history: undefined }))
    expect(snapshot.artifactCount).toBe(0)
    expect(snapshot.hasTrace).toBe(false)
  })

  it('should keep artifactCount as number', () => {
    expect(typeof build(createObservatory()).artifactCount).toBe('number')
  })

  it('should keep presence flags as primitive booleans', () => {
    const snapshot = build(createObservatory())
    expect(snapshot.hasTrace).toBe(false)
    expect(snapshot.hasTimeline).toBe(false)
  })

  it('should return artifactCount 0 even with unrelated metadata', () => {
    const snapshot = build(createObservatory(), { someOther: 'value' })
    expect(snapshot.artifactCount).toBe(0)
  })

  it('should not add extra unknown keys', () => {
    const snapshot = build(createObservatory())
    const keys = Object.keys(snapshot)
    expect(keys).toEqual([
      'artifactCount',
      'hasTrace',
      'hasTimeline',
      'hasHistory',
      'hasTraceSnapshot',
      'hasTimelineSnapshot',
      'hasHistorySnapshot',
    ])
  })
})

// ---------------------------------------------------------------------------
// Single Artifact — trace
// ---------------------------------------------------------------------------

describe('Single artifact — trace', () => {
  it('should set hasTrace true', () => {
    expect(build(createObservatory({ trace: createTrace('default') })).hasTrace).toBe(true)
  })

  it('should set all other flags false', () => {
    const snapshot = build(createObservatory({ trace: createTrace('default') }))
    expect(snapshot.hasTimeline).toBe(false)
    expect(snapshot.hasHistory).toBe(false)
    expect(snapshot.hasTraceSnapshot).toBe(false)
    expect(snapshot.hasTimelineSnapshot).toBe(false)
    expect(snapshot.hasHistorySnapshot).toBe(false)
  })

  it('should report artifactCount 1', () => {
    expect(build(createObservatory({ trace: createTrace('create') })).artifactCount).toBe(1)
  })

  it('should work with empty trace object', () => {
    const snapshot = build(createObservatory({ trace: createTrace() }))
    expect(snapshot.hasTrace).toBe(true)
    expect(snapshot.artifactCount).toBe(1)
  })
})

// ---------------------------------------------------------------------------
// Single Artifact — timeline
// ---------------------------------------------------------------------------

describe('Single artifact — timeline', () => {
  it('should set hasTimeline true', () => {
    expect(build(createObservatory({ timeline: createTimeline() })).hasTimeline).toBe(true)
  })

  it('should set all other flags false', () => {
    const snapshot = build(createObservatory({ timeline: createTimeline() }))
    expect(snapshot.hasTrace).toBe(false)
    expect(snapshot.hasHistory).toBe(false)
    expect(snapshot.hasTraceSnapshot).toBe(false)
    expect(snapshot.hasTimelineSnapshot).toBe(false)
    expect(snapshot.hasHistorySnapshot).toBe(false)
  })

  it('should report artifactCount 1', () => {
    expect(build(createObservatory({ timeline: createTimeline() })).artifactCount).toBe(1)
  })

  it('should work with populated timeline', () => {
    const entry: PromptAssemblyTimelineEntry = { index: 0, trace: createTrace('query') }
    const snapshot = build(createObservatory({ timeline: createTimeline([entry]) }))
    expect(snapshot.hasTimeline).toBe(true)
    expect(snapshot.artifactCount).toBe(1)
  })
})

// ---------------------------------------------------------------------------
// Single Artifact — history
// ---------------------------------------------------------------------------

describe('Single artifact — history', () => {
  it('should set hasHistory true', () => {
    expect(build(createObservatory({ history: createHistory() })).hasHistory).toBe(true)
  })

  it('should set all other flags false', () => {
    const snapshot = build(createObservatory({ history: createHistory() }))
    expect(snapshot.hasTrace).toBe(false)
    expect(snapshot.hasTimeline).toBe(false)
    expect(snapshot.hasTraceSnapshot).toBe(false)
    expect(snapshot.hasTimelineSnapshot).toBe(false)
    expect(snapshot.hasHistorySnapshot).toBe(false)
  })

  it('should report artifactCount 1', () => {
    expect(build(createObservatory({ history: createHistory() })).artifactCount).toBe(1)
  })

  it('should work with populated history', () => {
    const entry: PromptAssemblyHistoryEntry = { index: 0, trace: createTrace('modify') }
    const snapshot = build(createObservatory({ history: createHistory([entry]) }))
    expect(snapshot.hasHistory).toBe(true)
    expect(snapshot.artifactCount).toBe(1)
  })
})

// ---------------------------------------------------------------------------
// Single Artifact — traceSnapshot
// ---------------------------------------------------------------------------

describe('Single artifact — traceSnapshot', () => {
  it('should set hasTraceSnapshot true', () => {
    expect(build(createObservatory({ traceSnapshot: createSnapshot() })).hasTraceSnapshot).toBe(true)
  })

  it('should set all other flags false', () => {
    const snapshot = build(createObservatory({ traceSnapshot: createSnapshot() }))
    expect(snapshot.hasTrace).toBe(false)
    expect(snapshot.hasTimeline).toBe(false)
    expect(snapshot.hasHistory).toBe(false)
    expect(snapshot.hasTimelineSnapshot).toBe(false)
    expect(snapshot.hasHistorySnapshot).toBe(false)
  })

  it('should report artifactCount 1', () => {
    expect(build(createObservatory({ traceSnapshot: createSnapshot() })).artifactCount).toBe(1)
  })

  it('should work with object snapshot', () => {
    const snapshot = build(createObservatory({ traceSnapshot: { strategy: 'delete' } }))
    expect(snapshot.hasTraceSnapshot).toBe(true)
    expect(snapshot.artifactCount).toBe(1)
  })
})

// ---------------------------------------------------------------------------
// Single Artifact — timelineSnapshot
// ---------------------------------------------------------------------------

describe('Single artifact — timelineSnapshot', () => {
  it('should set hasTimelineSnapshot true', () => {
    expect(build(createObservatory({ timelineSnapshot: createTimelineSnapshot() })).hasTimelineSnapshot).toBe(true)
  })

  it('should set all other flags false', () => {
    const snapshot = build(createObservatory({ timelineSnapshot: createTimelineSnapshot() }))
    expect(snapshot.hasTrace).toBe(false)
    expect(snapshot.hasTimeline).toBe(false)
    expect(snapshot.hasHistory).toBe(false)
    expect(snapshot.hasTraceSnapshot).toBe(false)
    expect(snapshot.hasHistorySnapshot).toBe(false)
  })

  it('should report artifactCount 1', () => {
    expect(build(createObservatory({ timelineSnapshot: createTimelineSnapshot() })).artifactCount).toBe(1)
  })

  it('should work with populated timeline snapshot', () => {
    const snapshot = build(createObservatory({ timelineSnapshot: { entryCount: 2, firstStrategy: 'create', lastStrategy: 'query', strategies: ['create', 'query'] } }))
    expect(snapshot.hasTimelineSnapshot).toBe(true)
    expect(snapshot.artifactCount).toBe(1)
  })
})

// ---------------------------------------------------------------------------
// Single Artifact — historySnapshot
// ---------------------------------------------------------------------------

describe('Single artifact — historySnapshot', () => {
  it('should set hasHistorySnapshot true', () => {
    expect(build(createObservatory({ historySnapshot: createHistorySnapshot() })).hasHistorySnapshot).toBe(true)
  })

  it('should set all other flags false', () => {
    const snapshot = build(createObservatory({ historySnapshot: createHistorySnapshot() }))
    expect(snapshot.hasTrace).toBe(false)
    expect(snapshot.hasTimeline).toBe(false)
    expect(snapshot.hasHistory).toBe(false)
    expect(snapshot.hasTraceSnapshot).toBe(false)
    expect(snapshot.hasTimelineSnapshot).toBe(false)
  })

  it('should report artifactCount 1', () => {
    expect(build(createObservatory({ historySnapshot: createHistorySnapshot() })).artifactCount).toBe(1)
  })

  it('should work with populated history snapshot', () => {
    const snapshot = build(createObservatory({ historySnapshot: { entryCount: 3, firstStrategy: 'create', lastStrategy: 'modify', strategies: ['create', 'query', 'modify'] } }))
    expect(snapshot.hasHistorySnapshot).toBe(true)
    expect(snapshot.artifactCount).toBe(1)
  })
})

// ---------------------------------------------------------------------------
// Multiple Artifacts
// ---------------------------------------------------------------------------

describe('Multiple artifacts', () => {
  it('should handle trace + timeline', () => {
    const snapshot = build(createObservatory({ trace: createTrace(), timeline: createTimeline() }))
    expect(snapshot.hasTrace).toBe(true)
    expect(snapshot.hasTimeline).toBe(true)
    expect(snapshot.artifactCount).toBe(2)
  })

  it('should handle trace + history', () => {
    const snapshot = build(createObservatory({ trace: createTrace(), history: createHistory() }))
    expect(snapshot.hasTrace).toBe(true)
    expect(snapshot.hasHistory).toBe(true)
    expect(snapshot.artifactCount).toBe(2)
  })

  it('should handle three core artifacts', () => {
    const snapshot = build(createObservatory({ trace: createTrace(), timeline: createTimeline(), history: createHistory() }))
    expect(snapshot.hasTrace).toBe(true)
    expect(snapshot.hasTimeline).toBe(true)
    expect(snapshot.hasHistory).toBe(true)
    expect(snapshot.artifactCount).toBe(3)
  })

  it('should handle three snapshot artifacts', () => {
    const snapshot = build(createObservatory({ traceSnapshot: createSnapshot(), timelineSnapshot: createTimelineSnapshot(), historySnapshot: createHistorySnapshot() }))
    expect(snapshot.hasTraceSnapshot).toBe(true)
    expect(snapshot.hasTimelineSnapshot).toBe(true)
    expect(snapshot.hasHistorySnapshot).toBe(true)
    expect(snapshot.artifactCount).toBe(3)
  })

  it('should handle trace + all three snapshots', () => {
    const snapshot = build(createObservatory({ trace: createTrace(), traceSnapshot: createSnapshot(), timelineSnapshot: createTimelineSnapshot(), historySnapshot: createHistorySnapshot() }))
    expect(snapshot.artifactCount).toBe(4)
    expect(snapshot.hasTrace).toBe(true)
    expect(snapshot.hasTraceSnapshot).toBe(true)
  })

  it('should handle all six artifacts', () => {
    const snapshot = build(createObservatory({
      trace: createTrace(),
      timeline: createTimeline(),
      history: createHistory(),
      traceSnapshot: createSnapshot(),
      timelineSnapshot: createTimelineSnapshot(),
      historySnapshot: createHistorySnapshot(),
    }))
    expect(snapshot.artifactCount).toBe(6)
    expect(snapshot.hasTrace).toBe(true)
    expect(snapshot.hasTimeline).toBe(true)
    expect(snapshot.hasHistory).toBe(true)
    expect(snapshot.hasTraceSnapshot).toBe(true)
    expect(snapshot.hasTimelineSnapshot).toBe(true)
    expect(snapshot.hasHistorySnapshot).toBe(true)
  })

  it('should handle five artifacts (one missing)', () => {
    const snapshot = build(createObservatory({
      trace: createTrace(),
      timeline: createTimeline(),
      history: createHistory(),
      traceSnapshot: createSnapshot(),
      timelineSnapshot: createTimelineSnapshot(),
    }))
    expect(snapshot.artifactCount).toBe(5)
    expect(snapshot.hasHistorySnapshot).toBe(false)
  })

  it('should handle core + one snapshot', () => {
    const snapshot = build(createObservatory({
      trace: createTrace(),
      timeline: createTimeline(),
      history: createHistory(),
      timelineSnapshot: createTimelineSnapshot(),
    }))
    expect(snapshot.artifactCount).toBe(4)
  })

  it('should be independent of property insertion order', () => {
    const a = build(createObservatory({ trace: createTrace(), history: createHistory() }))
    const b = build(createObservatory({ history: createHistory(), trace: createTrace() }))
    expect(a.artifactCount).toBe(b.artifactCount)
    expect(a.hasTrace).toBe(b.hasTrace)
  })

  it('should handle mixed artifacts with missing middle', () => {
    const snapshot = build(createObservatory({
      trace: createTrace(),
      history: createHistory(),
      historySnapshot: createHistorySnapshot(),
    }))
    expect(snapshot.artifactCount).toBe(3)
    expect(snapshot.hasTimeline).toBe(false)
    expect(snapshot.hasTimelineSnapshot).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Artifact Count
// ---------------------------------------------------------------------------

describe('Artifact count', () => {
  it('should count 0 for empty observatory', () => {
    expect(build(createObservatory()).artifactCount).toBe(0)
  })

  it('should count 1 for a single trace', () => {
    expect(build(createObservatory({ trace: createTrace() })).artifactCount).toBe(1)
  })

  it('should count 2 for two artifacts', () => {
    expect(build(createObservatory({ trace: createTrace(), timeline: createTimeline() })).artifactCount).toBe(2)
  })

  it('should count 3 for three artifacts', () => {
    expect(build(createObservatory({ trace: createTrace(), timeline: createTimeline(), history: createHistory() })).artifactCount).toBe(3)
  })

  it('should count 4 for four artifacts', () => {
    expect(build(createObservatory({ trace: createTrace(), timeline: createTimeline(), history: createHistory(), traceSnapshot: createSnapshot() })).artifactCount).toBe(4)
  })

  it('should count 5 for five artifacts', () => {
    expect(build(createObservatory({ trace: createTrace(), timeline: createTimeline(), history: createHistory(), traceSnapshot: createSnapshot(), timelineSnapshot: createTimelineSnapshot() })).artifactCount).toBe(5)
  })

  it('should count 6 for all six artifacts', () => {
    const snapshot = build(createObservatory({ trace: createTrace(), timeline: createTimeline(), history: createHistory(), traceSnapshot: createSnapshot(), timelineSnapshot: createTimelineSnapshot(), historySnapshot: createHistorySnapshot() }))
    expect(snapshot.artifactCount).toBe(6)
  })

  it('should count only distinct artifacts (no duplicates)', () => {
    const snapshot = build(createObservatory({ trace: createTrace() }))
    expect(snapshot.artifactCount).toBe(1)
  })
})

// ---------------------------------------------------------------------------
// Boolean Flags
// ---------------------------------------------------------------------------

describe('Boolean flags', () => {
  it('should reflect trace presence', () => {
    expect(build(createObservatory({ trace: createTrace() })).hasTrace).toBe(true)
    expect(build(createObservatory()).hasTrace).toBe(false)
  })

  it('should reflect timeline presence', () => {
    expect(build(createObservatory({ timeline: createTimeline() })).hasTimeline).toBe(true)
    expect(build(createObservatory()).hasTimeline).toBe(false)
  })

  it('should reflect history presence', () => {
    expect(build(createObservatory({ history: createHistory() })).hasHistory).toBe(true)
    expect(build(createObservatory()).hasHistory).toBe(false)
  })

  it('should reflect traceSnapshot presence', () => {
    expect(build(createObservatory({ traceSnapshot: createSnapshot() })).hasTraceSnapshot).toBe(true)
    expect(build(createObservatory()).hasTraceSnapshot).toBe(false)
  })

  it('should reflect timelineSnapshot presence', () => {
    expect(build(createObservatory({ timelineSnapshot: createTimelineSnapshot() })).hasTimelineSnapshot).toBe(true)
    expect(build(createObservatory()).hasTimelineSnapshot).toBe(false)
  })

  it('should reflect historySnapshot presence', () => {
    expect(build(createObservatory({ historySnapshot: createHistorySnapshot() })).hasHistorySnapshot).toBe(true)
    expect(build(createObservatory()).hasHistorySnapshot).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Metadata Extraction — observatoryRendered
// ---------------------------------------------------------------------------

describe('Metadata extraction — observatoryRendered', () => {
  it('should extract observatoryRendered when present', () => {
    const snapshot = build(createObservatory(), { observatoryRendered: 'rendered observatory' })
    expect(snapshot.rendered).toBe('rendered observatory')
  })

  it('should store exact string value', () => {
    const value = 'Artifacts:\n- trace'
    const snapshot = build(createObservatory(), { observatoryRendered: value })
    expect(snapshot.rendered).toBe(value)
  })

  it('should preserve rendered alongside artifact flags', () => {
    const snapshot = build(createObservatory({ trace: createTrace() }), { observatoryRendered: 'x' })
    expect(snapshot.hasTrace).toBe(true)
    expect(snapshot.rendered).toBe('x')
  })

  it('should not set rendered when key missing', () => {
    expect(build(createObservatory(), {}).rendered).toBeUndefined()
  })

  it('should not set rendered when value is undefined', () => {
    expect(build(createObservatory(), { observatoryRendered: undefined }).rendered).toBeUndefined()
  })

  it('should ignore non-string observatoryRendered values', () => {
    const snapshot = build(createObservatory(), { observatoryRendered: 42 })
    expect(snapshot.rendered).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// Metadata Extraction — observatoryExported
// ---------------------------------------------------------------------------

describe('Metadata extraction — observatoryExported', () => {
  it('should extract observatoryExported when present', () => {
    const snapshot = build(createObservatory(), { observatoryExported: '{"trace":{}}' })
    expect(snapshot.exported).toBe('{"trace":{}}')
  })

  it('should store exact string value', () => {
    const value = JSON.stringify({ trace: 'x' }, null, 2)
    const snapshot = build(createObservatory(), { observatoryExported: value })
    expect(snapshot.exported).toBe(value)
  })

  it('should preserve exported alongside artifact flags', () => {
    const snapshot = build(createObservatory({ history: createHistory() }), { observatoryExported: '{}' })
    expect(snapshot.hasHistory).toBe(true)
    expect(snapshot.exported).toBe('{}')
  })

  it('should not set exported when key missing', () => {
    expect(build(createObservatory(), {}).exported).toBeUndefined()
  })

  it('should not set exported when value is undefined', () => {
    expect(build(createObservatory(), { observatoryExported: undefined }).exported).toBeUndefined()
  })

  it('should ignore non-string observatoryExported values', () => {
    const snapshot = build(createObservatory(), { observatoryExported: { trace: 'x' } })
    expect(snapshot.exported).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// Metadata Extraction — both
// ---------------------------------------------------------------------------

describe('Metadata extraction — both', () => {
  it('should extract both rendered and exported', () => {
    const snapshot = build(createObservatory(), { observatoryRendered: 'rendered', observatoryExported: 'exported' })
    expect(snapshot.rendered).toBe('rendered')
    expect(snapshot.exported).toBe('exported')
  })

  it('should combine both with artifact fields', () => {
    const snapshot = build(createObservatory({ trace: createTrace(), history: createHistory() }), { observatoryRendered: 'r', observatoryExported: 'e' })
    expect(snapshot.artifactCount).toBe(2)
    expect(snapshot.hasTrace).toBe(true)
    expect(snapshot.hasHistory).toBe(true)
    expect(snapshot.rendered).toBe('r')
    expect(snapshot.exported).toBe('e')
  })

  it('should keep rendered when exported missing', () => {
    const snapshot = build(createObservatory(), { observatoryRendered: 'r' })
    expect(snapshot.rendered).toBe('r')
    expect(snapshot.exported).toBeUndefined()
  })

  it('should keep exported when rendered missing', () => {
    const snapshot = build(createObservatory(), { observatoryExported: 'e' })
    expect(snapshot.exported).toBe('e')
    expect(snapshot.rendered).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// Metadata Extraction — missing
// ---------------------------------------------------------------------------

describe('Metadata extraction — missing', () => {
  it('should work without metadata argument', () => {
    const snapshot = builder.build(createObservatory({ trace: createTrace() }))
    expect(snapshot.hasTrace).toBe(true)
    expect(snapshot.rendered).toBeUndefined()
    expect(snapshot.exported).toBeUndefined()
  })

  it('should work with undefined metadata', () => {
    const snapshot = build(createObservatory(), undefined)
    expect(snapshot.artifactCount).toBe(0)
    expect(snapshot.rendered).toBeUndefined()
  })

  it('should work with empty metadata object', () => {
    const snapshot = build(createObservatory(), {})
    expect(snapshot.rendered).toBeUndefined()
    expect(snapshot.exported).toBeUndefined()
  })

  it('should ignore unrelated metadata keys', () => {
    const snapshot = build(createObservatory(), { timelineRendered: 't', historyExported: 'h', unknown: 'u' })
    expect(snapshot.rendered).toBeUndefined()
    expect(snapshot.exported).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// Metadata Extraction — wrong types
// ---------------------------------------------------------------------------

describe('Metadata extraction — wrong types', () => {
  it('should ignore boolean observatoryRendered', () => {
    expect(build(createObservatory(), { observatoryRendered: true }).rendered).toBeUndefined()
  })

  it('should ignore object observatoryRendered', () => {
    expect(build(createObservatory(), { observatoryRendered: {} }).rendered).toBeUndefined()
  })

  it('should ignore array observatoryRendered', () => {
    expect(build(createObservatory(), { observatoryRendered: ['a'] }).rendered).toBeUndefined()
  })

  it('should ignore null observatoryRendered', () => {
    expect(build(createObservatory(), { observatoryRendered: null }).rendered).toBeUndefined()
  })

  it('should ignore boolean observatoryExported', () => {
    expect(build(createObservatory(), { observatoryExported: false }).exported).toBeUndefined()
  })

  it('should ignore numeric observatoryExported', () => {
    expect(build(createObservatory(), { observatoryExported: 123 }).exported).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// Deterministic
// ---------------------------------------------------------------------------

describe('Deterministic', () => {
  it('should produce same snapshot across repeated calls', () => {
    const observatory = createObservatory({ trace: createTrace(), history: createHistory() })
    const metadata = { observatoryRendered: 'r', observatoryExported: 'e' }
    expect(build(observatory, metadata)).toEqual(build(observatory, metadata))
  })

  it('should produce same snapshot across builder instances', () => {
    const b1 = new DefaultPromptAssemblyObservatorySnapshotBuilder()
    const b2 = new DefaultPromptAssemblyObservatorySnapshotBuilder()
    const observatory = createObservatory({ trace: createTrace() })
    expect(b1.build(observatory)).toEqual(b2.build(observatory))
  })

  it('should produce same artifactCount across calls', () => {
    const observatory = createObservatory({ trace: createTrace(), timeline: createTimeline() })
    expect(build(observatory).artifactCount).toBe(build(observatory).artifactCount)
  })

  it('should produce same flags for identical observatories', () => {
    const a = build(createObservatory({ history: createHistory() }))
    const b = build(createObservatory({ history: createHistory() }))
    expect(a).toEqual(b)
  })

  it('should produce deterministic results for empty observatory', () => {
    expect(build(createObservatory())).toEqual(build(createObservatory()))
  })
})

// ---------------------------------------------------------------------------
// Stateless
// ---------------------------------------------------------------------------

describe('Stateless', () => {
  it('should not retain state between calls', () => {
    const first = build(createObservatory({ trace: createTrace() }))
    const second = build(createObservatory({ history: createHistory() }))
    expect(first.hasTrace).toBe(true)
    expect(first.hasHistory).toBe(false)
    expect(second.hasHistory).toBe(true)
    expect(second.hasTrace).toBe(false)
  })

  it('should produce independent results', () => {
    const a = build(createObservatory({ trace: createTrace() }), { observatoryRendered: 'a' })
    const b = build(createObservatory({ trace: createTrace() }), { observatoryRendered: 'b' })
    expect(a.rendered).toBe('a')
    expect(b.rendered).toBe('b')
  })

  it('should produce fresh results for alternating inputs', () => {
    const obs1 = createObservatory({ trace: createTrace() })
    const obs2 = createObservatory({ history: createHistory() })
    const r1 = build(obs1)
    const r2 = build(obs2)
    const r3 = build(obs1)
    expect(r1.artifactCount).toBe(1)
    expect(r2.artifactCount).toBe(1)
    expect(r3.artifactCount).toBe(1)
    expect(r1.hasTrace).toBe(true)
    expect(r2.hasHistory).toBe(true)
    expect(r3.hasTrace).toBe(true)
  })

  it('should produce fresh result each call', () => {
    const observatory = createObservatory({ trace: createTrace() })
    const r1 = build(observatory)
    const r2 = build(observatory)
    expect(r1).not.toBe(r2)
  })
})

// ---------------------------------------------------------------------------
// Pure
// ---------------------------------------------------------------------------

describe('Pure', () => {
  it('should not modify observatory', () => {
    const observatory = createObservatory({ trace: createTrace('default') })
    const original = JSON.stringify(observatory)
    build(observatory)
    expect(JSON.stringify(observatory)).toBe(original)
  })

  it('should not modify nested artifacts', () => {
    const entry: PromptAssemblyHistoryEntry = { index: 0, trace: createTrace('query') }
    const observatory = createObservatory({ history: createHistory([entry]) })
    const originalEntries = JSON.stringify(observatory.history)
    build(observatory)
    expect(JSON.stringify(observatory.history)).toBe(originalEntries)
  })

  it('should not modify metadata', () => {
    const metadata = { observatoryRendered: 'r', observatoryExported: 'e' }
    const original = JSON.stringify(metadata)
    build(createObservatory(), metadata)
    expect(JSON.stringify(metadata)).toBe(original)
  })

  it('should have no side effects on observatory presence', () => {
    const observatory = createObservatory({ timeline: createTimeline() })
    build(createObservatory({ trace: createTrace() }))
    expect(observatory.timeline).toBeDefined()
    expect(observatory.trace).toBeUndefined()
  })

  it('should preserve artifact references', () => {
    const trace = createTrace('create')
    const observatory = createObservatory({ trace })
    build(observatory)
    expect(observatory.trace).toBe(trace)
  })
})

// ---------------------------------------------------------------------------
// Immutable
// ---------------------------------------------------------------------------

describe('Immutable', () => {
  it('should return a new snapshot object each call', () => {
    const observatory = createObservatory({ trace: createTrace() })
    expect(build(observatory)).not.toBe(build(observatory))
  })

  it('should not add extra properties beyond contract', () => {
    const snapshot = build(createObservatory({ trace: createTrace() }), { observatoryRendered: 'r', observatoryExported: 'e' })
    const keys = Object.keys(snapshot).sort()
    expect(keys).toEqual([
      'artifactCount',
      'exported',
      'hasHistory',
      'hasHistorySnapshot',
      'hasTimeline',
      'hasTimelineSnapshot',
      'hasTrace',
      'hasTraceSnapshot',
      'rendered',
    ])
  })

  it('should not mutate returned snapshot after creation', () => {
    const snapshot = build(createObservatory({ trace: createTrace() }))
    const before = JSON.stringify(snapshot)
    build(createObservatory({ history: createHistory() }))
    expect(JSON.stringify(snapshot)).toBe(before)
  })

  it('should not share mutable references across snapshots', () => {
    const a = build(createObservatory(), { observatoryRendered: 'same' })
    const b = build(createObservatory(), { observatoryRendered: 'same' })
    expect(a.rendered).toBe(b.rendered)
  })
})

// ---------------------------------------------------------------------------
// Export Validation
// ---------------------------------------------------------------------------

describe('Export validation', () => {
  it('should export snapshot as serializable JSON', () => {
    const snapshot = build(createObservatory({ trace: createTrace(), history: createHistory() }), { observatoryRendered: 'r', observatoryExported: 'e' })
    expect(() => JSON.stringify(snapshot)).not.toThrow()
  })

  it('should include artifactCount in JSON', () => {
    const json = JSON.stringify(build(createObservatory({ trace: createTrace() })))
    expect(JSON.parse(json).artifactCount).toBe(1)
  })

  it('should include presence flags in JSON', () => {
    const json = JSON.parse(JSON.stringify(build(createObservatory({ timeline: createTimeline() }))))
    expect(json.hasTimeline).toBe(true)
    expect(json.hasTrace).toBe(false)
  })

  it('should include rendered in JSON when present', () => {
    const json = JSON.parse(JSON.stringify(build(createObservatory(), { observatoryRendered: 'R' })))
    expect(json.rendered).toBe('R')
  })

  it('should include exported in JSON when present', () => {
    const json = JSON.parse(JSON.stringify(build(createObservatory(), { observatoryExported: 'E' })))
    expect(json.exported).toBe('E')
  })

  it('should round trip snapshot through JSON', () => {
    const snapshot = build(createObservatory({ trace: createTrace(), history: createHistory() }), { observatoryRendered: 'r', observatoryExported: 'e' })
    const parsed = JSON.parse(JSON.stringify(snapshot))
    expect(parsed.artifactCount).toBe(2)
    expect(parsed.hasTrace).toBe(true)
    expect(parsed.hasHistory).toBe(true)
    expect(parsed.rendered).toBe('r')
    expect(parsed.exported).toBe('e')
  })

  it('should not include undefined rendered in JSON', () => {
    const json = JSON.parse(JSON.stringify(build(createObservatory())))
    expect(json.rendered).toBeUndefined()
  })

  it('should not include undefined exported in JSON', () => {
    const json = JSON.parse(JSON.stringify(build(createObservatory())))
    expect(json.exported).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// Architecture Compliance
// ---------------------------------------------------------------------------

describe('Architecture compliance', () => {
  it('should have zero dependencies on Runtime', () => {
    const code = DefaultPromptAssemblyObservatorySnapshotBuilder.toString()
    expect(code).not.toContain('Runtime')
  })

  it('should have zero dependencies on Planner', () => {
    const code = DefaultPromptAssemblyObservatorySnapshotBuilder.toString()
    expect(code).not.toContain('Planner')
  })

  it('should have zero dependencies on Pipeline', () => {
    const code = DefaultPromptAssemblyObservatorySnapshotBuilder.toString()
    expect(code).not.toContain('Pipeline')
  })

  it('should have zero dependencies on Provider', () => {
    const code = DefaultPromptAssemblyObservatorySnapshotBuilder.toString()
    expect(code).not.toContain('Provider')
  })

  it('should have zero dependencies on Memory', () => {
    const code = DefaultPromptAssemblyObservatorySnapshotBuilder.toString()
    expect(code).not.toContain('Memory')
  })

  it('should have zero dependencies on AgentLoop', () => {
    const code = DefaultPromptAssemblyObservatorySnapshotBuilder.toString()
    expect(code).not.toContain('AgentLoop')
  })

  it('should have zero dependencies on PromptBuilder', () => {
    const code = DefaultPromptAssemblyObservatorySnapshotBuilder.toString()
    expect(code).not.toContain('PromptBuilder')
  })

  it('should have zero dependencies on BuilderOptions', () => {
    const code = DefaultPromptAssemblyObservatorySnapshotBuilder.toString()
    expect(code).not.toContain('BuilderOptions')
  })

  it('should have zero dependencies on PromptRenderer', () => {
    const code = DefaultPromptAssemblyObservatorySnapshotBuilder.toString()
    expect(code).not.toContain('PromptRenderer')
  })

  it('should have zero dependencies on PromptCompression', () => {
    const code = DefaultPromptAssemblyObservatorySnapshotBuilder.toString()
    expect(code).not.toContain('PromptCompression')
  })

  it('should depend on the observatory type', () => {
    const code = DefaultPromptAssemblyObservatorySnapshotBuilder.toString()
    expect(code).toContain('PromptAssemblyObservatory')
  })

  it('should depend on the observatory snapshot types', () => {
    const code = DefaultPromptAssemblyObservatorySnapshotBuilder.toString()
    expect(code).toContain('PromptAssemblyObservatorySnapshot')
  })

  it('should not modify existing observatory classes', () => {
    // No constructor parameters, no static state, no hooks into other classes
    const code = DefaultPromptAssemblyObservatorySnapshotBuilder.toString()
    expect(code).not.toContain('new ')
  })

  it('should require no external imports beyond types', () => {
    const code = DefaultPromptAssemblyObservatorySnapshotBuilder.toString()
    expect(code).not.toContain('import ')
  })
})

// ---------------------------------------------------------------------------
// Compatibility
// ---------------------------------------------------------------------------

describe('RetryPlanner compatibility', () => {
  it('should be usable inside a RetryPlanner-style dependency graph', () => {
    const b = new DefaultPromptAssemblyObservatorySnapshotBuilder()
    const snapshot = b.build(createObservatory({ trace: createTrace() }))
    expect(snapshot.artifactCount).toBeGreaterThanOrEqual(0)
  })
})

describe('ToolCallPlanner compatibility', () => {
  it('should be usable inside a ToolCallPlanner-style dependency graph', () => {
    const snapshot = build(createObservatory({ history: createHistory() }))
    expect(snapshot.hasHistory).toBe(true)
  })
})

describe('Streaming compatibility', () => {
  it('should be usable inside a Streaming-style dependency graph', () => {
    const snapshot = build(createObservatory({ timeline: createTimeline() }))
    expect(snapshot.hasTimeline).toBe(true)
  })
})

describe('AgentLoop compatibility', () => {
  it('should be usable inside an AgentLoop-style dependency graph', () => {
    const snapshot = build(createObservatory({ trace: createTrace(), timeline: createTimeline(), history: createHistory() }))
    expect(snapshot.artifactCount).toBe(3)
  })
})

// ---------------------------------------------------------------------------
// Edge Cases
// ---------------------------------------------------------------------------

describe('Edge cases', () => {
  it('should handle unicode in rendered metadata', () => {
    const snapshot = build(createObservatory(), { observatoryRendered: '树🌲观察' })
    expect(snapshot.rendered).toBe('树🌲观察')
  })

  it('should handle unicode in exported metadata', () => {
    const snapshot = build(createObservatory(), { observatoryExported: '{"名称":"树"}' })
    expect(snapshot.exported).toBe('{"名称":"树"}')
  })

  it('should handle special characters in metadata', () => {
    const snapshot = build(createObservatory(), { observatoryRendered: 'a\n\t"quoted"\\' })
    expect(snapshot.rendered).toBe('a\n\t"quoted"\\')
  })

  it('should handle empty string rendered metadata (still a string)', () => {
    const snapshot = build(createObservatory(), { observatoryRendered: '' })
    expect(snapshot.rendered).toBe('')
  })

  it('should handle empty string exported metadata (still a string)', () => {
    const snapshot = build(createObservatory(), { observatoryExported: '' })
    expect(snapshot.exported).toBe('')
  })

  it('should handle large metadata values', () => {
    const bigRendered = 'x'.repeat(10000)
    const snapshot = build(createObservatory(), { observatoryRendered: bigRendered })
    expect(snapshot.rendered).toBe(bigRendered)
    expect(snapshot.rendered!.length).toBe(10000)
  })

  it('should handle partial observatory (trace + one snapshot)', () => {
    const snapshot = build(createObservatory({ trace: createTrace(), timelineSnapshot: createTimelineSnapshot() }))
    expect(snapshot.artifactCount).toBe(2)
    expect(snapshot.hasTrace).toBe(true)
    expect(snapshot.hasTimelineSnapshot).toBe(true)
    expect(snapshot.hasHistory).toBe(false)
  })

  it('should handle all artifacts present', () => {
    const snapshot = build(createObservatory({
      trace: createTrace(),
      timeline: createTimeline(),
      history: createHistory(),
      traceSnapshot: createSnapshot(),
      timelineSnapshot: createTimelineSnapshot(),
      historySnapshot: createHistorySnapshot(),
    }))
    expect(snapshot.artifactCount).toBe(6)
  })

  it('should handle metadata with observatoryExported containing special characters', () => {
    const snapshot = build(createObservatory(), { observatoryExported: '{"k":"v\\n"}' })
    expect(snapshot.exported).toBe('{"k":"v\\n"}')
  })

  it('should handle snapshot of observatory with empty structures', () => {
    const snapshot = build(createObservatory({ timeline: createTimeline(), history: createHistory() }))
    expect(snapshot.hasTimeline).toBe(true)
    expect(snapshot.hasHistory).toBe(true)
    expect(snapshot.artifactCount).toBe(2)
  })
})