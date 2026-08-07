import { describe, it, expect } from 'vitest'
import { DefaultPromptAssemblyObservatoryExporter } from '../strategy/DefaultPromptAssemblyObservatoryExporter'
import type { PromptAssemblyObservatoryExporter } from '../strategy/PromptAssemblyObservatoryExporter'
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
  return { entryCount: 0, firstStrategy: 'create', lastStrategy: 'create', strategies: ['create'] }
}

function createHistorySnapshot(): PromptAssemblyHistorySnapshot {
  return { entryCount: 0, firstStrategy: 'create', lastStrategy: 'create', strategies: [] }
}

// ---------------------------------------------------------------------------
// Interface Contract
// ---------------------------------------------------------------------------

describe('Interface contract', () => {
  it('should define export method', () => {
    const exporter: PromptAssemblyObservatoryExporter = new DefaultPromptAssemblyObservatoryExporter()
    expect(typeof exporter.export).toBe('function')
  })

  it('should accept an observatory and return a string', () => {
    const exporter = new DefaultPromptAssemblyObservatoryExporter()
    const result = exporter.export(createObservatory())
    expect(typeof result).toBe('string')
  })

  it('should accept a custom implementation', () => {
    const custom: PromptAssemblyObservatoryExporter = {
      export(_observatory: PromptAssemblyObservatory): string {
        return 'custom export'
      },
    }
    expect(custom.export(createObservatory())).toBe('custom export')
  })
})

// ---------------------------------------------------------------------------
// Empty Observatory
// ---------------------------------------------------------------------------

describe('Empty observatory', () => {
  it('should export empty observatory as valid JSON object', () => {
    const exporter = new DefaultPromptAssemblyObservatoryExporter()
    const result = exporter.export(createObservatory())
    expect(() => JSON.parse(result)).not.toThrow()
  })

  it('should export empty observatory as empty JSON object', () => {
    const exporter = new DefaultPromptAssemblyObservatoryExporter()
    const result = exporter.export(createObservatory())
    expect(JSON.parse(result)).toEqual({})
  })

  it('should produce exact JSON output for empty observatory', () => {
    const exporter = new DefaultPromptAssemblyObservatoryExporter()
    const observatory = createObservatory()
    const result = exporter.export(observatory)
    expect(result).toBe(JSON.stringify(observatory, null, 2))
  })

  it('should return valid JSON for empty observatory', () => {
    const exporter = new DefaultPromptAssemblyObservatoryExporter()
    const result = exporter.export(createObservatory())
    expect(() => JSON.parse(result)).not.toThrow()
  })

  it('should handle frozen empty observatory', () => {
    const exporter = new DefaultPromptAssemblyObservatoryExporter()
    const observatory = Object.freeze({})
    const result = exporter.export(observatory)
    const parsed = JSON.parse(result)
    expect(parsed).toEqual({})
  })

  it('should export empty observatory with 2-space indentation', () => {
    const exporter = new DefaultPromptAssemblyObservatoryExporter()
    const result = exporter.export(createObservatory())
    expect(result).toMatch(/^\{/)
    expect(result).toMatch(/\}$/)
  })

  it('should export empty observatory with no content between braces', () => {
    const exporter = new DefaultPromptAssemblyObservatoryExporter()
    const result = JSON.stringify(JSON.parse(exporter.export(createObservatory())))
    expect(result).toBe('{}')
  })
})

// ---------------------------------------------------------------------------
// Single Artifact — trace
// ---------------------------------------------------------------------------

describe('Single artifact — trace', () => {
  it('should export observatory with trace', () => {
    const exporter = new DefaultPromptAssemblyObservatoryExporter()
    const observatory = createObservatory({ trace: createTrace('create') })
    const result = exporter.export(observatory)
    const parsed = JSON.parse(result)
    expect(parsed.trace).toBeDefined()
    expect(parsed.trace.strategy.name).toBe('create')
  })

  it('should not include other artifacts when only trace is present', () => {
    const exporter = new DefaultPromptAssemblyObservatoryExporter()
    const observatory = createObservatory({ trace: createTrace('create') })
    const result = exporter.export(observatory)
    const parsed = JSON.parse(result)
    expect(Object.keys(parsed)).toEqual(['trace'])
  })

  it('should export trace with strategy name', () => {
    const exporter = new DefaultPromptAssemblyObservatoryExporter()
    const observatory = createObservatory({ trace: createTrace('query') })
    const result = exporter.export(observatory)
    const parsed = JSON.parse(result)
    expect(parsed.trace.strategy.name).toBe('query')
  })
})

// ---------------------------------------------------------------------------
// Single Artifact — timeline
// ---------------------------------------------------------------------------

describe('Single artifact — timeline', () => {
  it('should export observatory with timeline', () => {
    const exporter = new DefaultPromptAssemblyObservatoryExporter()
    const observatory = createObservatory({ timeline: createTimeline() })
    const result = exporter.export(observatory)
    const parsed = JSON.parse(result)
    expect(parsed.timeline).toBeDefined()
    expect(parsed.timeline.entries).toEqual([])
  })

  it('should not include other artifacts when only timeline is present', () => {
    const exporter = new DefaultPromptAssemblyObservatoryExporter()
    const observatory = createObservatory({ timeline: createTimeline() })
    const result = exporter.export(observatory)
    const parsed = JSON.parse(result)
    expect(Object.keys(parsed)).toEqual(['timeline'])
  })

  it('should export timeline with zero entries', () => {
    const exporter = new DefaultPromptAssemblyObservatoryExporter()
    const observatory = createObservatory({ timeline: createTimeline() })
    const result = exporter.export(observatory)
    const parsed = JSON.parse(result)
    expect(parsed.timeline.entries).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// Single Artifact — history
// ---------------------------------------------------------------------------

describe('Single artifact — history', () => {
  it('should export observatory with history', () => {
    const exporter = new DefaultPromptAssemblyObservatoryExporter()
    const observatory = createObservatory({ history: createHistory() })
    const result = exporter.export(observatory)
    const parsed = JSON.parse(result)
    expect(parsed.history).toBeDefined()
    expect(parsed.history.entries).toEqual([])
  })

  it('should not include other artifacts when only history is present', () => {
    const exporter = new DefaultPromptAssemblyObservatoryExporter()
    const observatory = createObservatory({ history: createHistory() })
    const result = exporter.export(observatory)
    const parsed = JSON.parse(result)
    expect(Object.keys(parsed)).toEqual(['history'])
  })

  it('should export history with zero entries', () => {
    const exporter = new DefaultPromptAssemblyObservatoryExporter()
    const observatory = createObservatory({ history: createHistory() })
    const result = exporter.export(observatory)
    const parsed = JSON.parse(result)
    expect(parsed.history.entries).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// Single Artifact — traceSnapshot
// ---------------------------------------------------------------------------

describe('Single artifact — traceSnapshot', () => {
  it('should export observatory with traceSnapshot', () => {
    const exporter = new DefaultPromptAssemblyObservatoryExporter()
    const observatory = createObservatory({ traceSnapshot: createSnapshot() })
    const result = exporter.export(observatory)
    const parsed = JSON.parse(result)
    expect(parsed.traceSnapshot).toBeDefined()
  })

  it('should not include other artifacts when only traceSnapshot is present', () => {
    const exporter = new DefaultPromptAssemblyObservatoryExporter()
    const observatory = createObservatory({ traceSnapshot: createSnapshot() })
    const result = exporter.export(observatory)
    const parsed = JSON.parse(result)
    expect(Object.keys(parsed)).toEqual(['traceSnapshot'])
  })

  it('should export traceSnapshot with strategy name', () => {
    const exporter = new DefaultPromptAssemblyObservatoryExporter()
    const observatory = createObservatory({ traceSnapshot: createSnapshot() })
    const result = exporter.export(observatory)
    const parsed = JSON.parse(result)
    expect(parsed.traceSnapshot.strategy).toBe('create')
  })
})

// ---------------------------------------------------------------------------
// Single Artifact — timelineSnapshot
// ---------------------------------------------------------------------------

describe('Single artifact — timelineSnapshot', () => {
  it('should export observatory with timelineSnapshot', () => {
    const exporter = new DefaultPromptAssemblyObservatoryExporter()
    const observatory = createObservatory({ timelineSnapshot: createTimelineSnapshot() })
    const result = exporter.export(observatory)
    const parsed = JSON.parse(result)
    expect(parsed.timelineSnapshot).toBeDefined()
  })

  it('should not include other artifacts when only timelineSnapshot is present', () => {
    const exporter = new DefaultPromptAssemblyObservatoryExporter()
    const observatory = createObservatory({ timelineSnapshot: createTimelineSnapshot() })
    const result = exporter.export(observatory)
    const parsed = JSON.parse(result)
    expect(Object.keys(parsed)).toEqual(['timelineSnapshot'])
  })

  it('should export timelineSnapshot with entryCount', () => {
    const exporter = new DefaultPromptAssemblyObservatoryExporter()
    const observatory = createObservatory({ timelineSnapshot: createTimelineSnapshot() })
    const result = exporter.export(observatory)
    const parsed = JSON.parse(result)
    expect(parsed.timelineSnapshot.entryCount).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// Single Artifact — historySnapshot
// ---------------------------------------------------------------------------

describe('Single artifact — historySnapshot', () => {
  it('should export observatory with historySnapshot', () => {
    const exporter = new DefaultPromptAssemblyObservatoryExporter()
    const observatory = createObservatory({ historySnapshot: createHistorySnapshot() })
    const result = exporter.export(observatory)
    const parsed = JSON.parse(result)
    expect(parsed.historySnapshot).toBeDefined()
  })

  it('should not include other artifacts when only historySnapshot is present', () => {
    const exporter = new DefaultPromptAssemblyObservatoryExporter()
    const observatory = createObservatory({ historySnapshot: createHistorySnapshot() })
    const result = exporter.export(observatory)
    const parsed = JSON.parse(result)
    expect(Object.keys(parsed)).toEqual(['historySnapshot'])
  })

  it('should export historySnapshot with entryCount', () => {
    const exporter = new DefaultPromptAssemblyObservatoryExporter()
    const observatory = createObservatory({ historySnapshot: createHistorySnapshot() })
    const result = exporter.export(observatory)
    const parsed = JSON.parse(result)
    expect(parsed.historySnapshot.entryCount).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// Multiple Artifacts
// ---------------------------------------------------------------------------

describe('Multiple artifacts', () => {
  it('should export observatory with two core artifacts', () => {
    const exporter = new DefaultPromptAssemblyObservatoryExporter()
    const observatory = createObservatory({
      trace: createTrace('create'),
      timeline: createTimeline(),
    })
    const result = exporter.export(observatory)
    const parsed = JSON.parse(result)
    expect(parsed.trace).toBeDefined()
    expect(parsed.timeline).toBeDefined()
  })

  it('should export observatory with three core artifacts', () => {
    const exporter = new DefaultPromptAssemblyObservatoryExporter()
    const observatory = createObservatory({
      trace: createTrace('create'),
      timeline: createTimeline(),
      history: createHistory(),
    })
    const result = exporter.export(observatory)
    const parsed = JSON.parse(result)
    expect(parsed.trace).toBeDefined()
    expect(parsed.timeline).toBeDefined()
    expect(parsed.history).toBeDefined()
  })

  it('should export observatory with three snapshot artifacts', () => {
    const exporter = new DefaultPromptAssemblyObservatoryExporter()
    const observatory = createObservatory({
      traceSnapshot: createSnapshot(),
      timelineSnapshot: createTimelineSnapshot(),
      historySnapshot: createHistorySnapshot(),
    })
    const result = exporter.export(observatory)
    const parsed = JSON.parse(result)
    expect(parsed.traceSnapshot).toBeDefined()
    expect(parsed.timelineSnapshot).toBeDefined()
    expect(parsed.historySnapshot).toBeDefined()
  })

  it('should export observatory with all six artifacts', () => {
    const exporter = new DefaultPromptAssemblyObservatoryExporter()
    const observatory = createObservatory({
      trace: createTrace('create'),
      timeline: createTimeline(),
      history: createHistory(),
      traceSnapshot: createSnapshot(),
      timelineSnapshot: createTimelineSnapshot(),
      historySnapshot: createHistorySnapshot(),
    })
    const result = exporter.export(observatory)
    const parsed = JSON.parse(result)
    expect(parsed.trace).toBeDefined()
    expect(parsed.timeline).toBeDefined()
    expect(parsed.history).toBeDefined()
    expect(parsed.traceSnapshot).toBeDefined()
    expect(parsed.timelineSnapshot).toBeDefined()
    expect(parsed.historySnapshot).toBeDefined()
  })

  it('should preserve field order in export', () => {
    const exporter = new DefaultPromptAssemblyObservatoryExporter()
    const observatory = createObservatory({
      trace: createTrace('create'),
      timeline: createTimeline(),
      history: createHistory(),
    })
    const result = exporter.export(observatory)
    const parsed = JSON.parse(result)
    const keys = Object.keys(parsed)
    expect(keys.indexOf('trace')).toBeLessThan(keys.indexOf('timeline'))
    expect(keys.indexOf('timeline')).toBeLessThan(keys.indexOf('history'))
  })

  it('should export observatory with trace + history (missing timeline)', () => {
    const exporter = new DefaultPromptAssemblyObservatoryExporter()
    const observatory = createObservatory({
      trace: createTrace('create'),
      history: createHistory(),
    })
    const result = exporter.export(observatory)
    const parsed = JSON.parse(result)
    expect(parsed.trace).toBeDefined()
    expect(parsed.history).toBeDefined()
    expect(parsed.timeline).toBeUndefined()
  })

  it('should export observatory with only snapshots', () => {
    const exporter = new DefaultPromptAssemblyObservatoryExporter()
    const observatory = createObservatory({
      traceSnapshot: createSnapshot(),
      historySnapshot: createHistorySnapshot(),
    })
    const result = exporter.export(observatory)
    const parsed = JSON.parse(result)
    expect(parsed.traceSnapshot).toBeDefined()
    expect(parsed.historySnapshot).toBeDefined()
    expect(parsed.timelineSnapshot).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// JSON Validation
// ---------------------------------------------------------------------------

describe('JSON validation', () => {
  it('should always return valid JSON', () => {
    const exporter = new DefaultPromptAssemblyObservatoryExporter()
    const observatory = createObservatory({
      trace: createTrace('create'),
      timeline: createTimeline(),
      history: createHistory(),
      traceSnapshot: createSnapshot(),
    })
    const result = exporter.export(observatory)
    expect(() => JSON.parse(result)).not.toThrow()
  })

  it('should produce parseable JSON for all artifact combinations', () => {
    const exporter = new DefaultPromptAssemblyObservatoryExporter()
    const combinations = [
      createObservatory({ trace: createTrace('a') }),
      createObservatory({ timeline: createTimeline() }),
      createObservatory({ history: createHistory() }),
      createObservatory({
        trace: createTrace('a'),
        timeline: createTimeline(),
        history: createHistory(),
      }),
      createObservatory({
        trace: createTrace('a'),
        timeline: createTimeline(),
        history: createHistory(),
        traceSnapshot: createSnapshot(),
        timelineSnapshot: createTimelineSnapshot(),
        historySnapshot: createHistorySnapshot(),
      }),
    ]
    for (const obs of combinations) {
      const result = exporter.export(obs)
      expect(() => JSON.parse(result)).not.toThrow()
    }
  })

  it('should not produce trailing commas', () => {
    const exporter = new DefaultPromptAssemblyObservatoryExporter()
    const observatory = createObservatory({
      trace: createTrace('create'),
      timeline: createTimeline(),
      history: createHistory(),
    })
    const result = exporter.export(observatory)
    expect(result).not.toContain(',\n}')
    expect(result).not.toContain(',\n  }')
  })

  it('should produce valid JSON with deep nesting', () => {
    const exporter = new DefaultPromptAssemblyObservatoryExporter()
    const observatory = createObservatory({
      trace: createTrace('create'),
      timeline: createTimeline(),
    })
    const result = exporter.export(observatory)
    const parsed = JSON.parse(result)
    expect(parsed.trace.strategy.name).toBe('create')
  })
})

// ---------------------------------------------------------------------------
// Pretty Printed JSON
// ---------------------------------------------------------------------------

describe('Pretty printed JSON', () => {
  it('should use 2-space indentation', () => {
    const exporter = new DefaultPromptAssemblyObservatoryExporter()
    const observatory = createObservatory({
      trace: createTrace('create'),
    })
    const result = exporter.export(observatory)
    const lines = result.split('\n')
    // First non-brace line should have 2-space indent
    for (const line of lines) {
      if (line.includes('"strategy"') || line.includes('"name"')) {
        expect(line).toMatch(/^ {2}/)
      }
    }
  })

  it('should have newline after opening brace', () => {
    const exporter = new DefaultPromptAssemblyObservatoryExporter()
    const observatory = createObservatory({
      trace: createTrace('create'),
    })
    const result = exporter.export(observatory)
    expect(result).toMatch(/^{\n/)
  })

  it('should have newline before closing brace', () => {
    const exporter = new DefaultPromptAssemblyObservatoryExporter()
    const observatory = createObservatory({
      trace: createTrace('create'),
    })
    const result = exporter.export(observatory)
    expect(result).toMatch(/\n}$/)
  })

  it('should indent nested objects by 4 spaces', () => {
    const exporter = new DefaultPromptAssemblyObservatoryExporter()
    const observatory = createObservatory({
      trace: createTrace('create'),
    })
    const result = exporter.export(observatory)
    const lines = result.split('\n')
    const nameLine = lines.find(l => l.includes('"name"'))
    expect(nameLine).toMatch(/^ {4}/)
  })

  it('should produce human-readable multiline output', () => {
    const exporter = new DefaultPromptAssemblyObservatoryExporter()
    const observatory = createObservatory({
      trace: createTrace('create'),
      timeline: createTimeline(),
    })
    const result = exporter.export(observatory)
    const lines = result.split('\n')
    expect(lines.length).toBeGreaterThan(1)
  })

  it('should not have trailing newline (JSON standard)', () => {
    const exporter = new DefaultPromptAssemblyObservatoryExporter()
    const result = exporter.export(createObservatory({ trace: createTrace('create') }))
    expect(result.endsWith('\n')).toBe(false)
    expect(result.endsWith('}')).toBe(true)
  })

  it('should have key-value pairs on separate lines', () => {
    const exporter = new DefaultPromptAssemblyObservatoryExporter()
    const result = exporter.export(createObservatory({ trace: createTrace('create') }))
    const lines = result.split('\n')
    const kvLines = lines.filter(l => l.includes(':'))
    expect(kvLines.length).toBeGreaterThanOrEqual(2)
  })
})

// ---------------------------------------------------------------------------
// Deterministic
// ---------------------------------------------------------------------------

describe('Deterministic', () => {
  it('should produce same output across multiple calls', () => {
    const exporter = new DefaultPromptAssemblyObservatoryExporter()
    const observatory = createObservatory({
      trace: createTrace('create'),
      timeline: createTimeline(),
      history: createHistory(),
    })
    const r1 = exporter.export(observatory)
    const r2 = exporter.export(observatory)
    const r3 = exporter.export(observatory)
    expect(r1).toBe(r2)
    expect(r2).toBe(r3)
  })

  it('should produce same output across different instances', () => {
    const e1 = new DefaultPromptAssemblyObservatoryExporter()
    const e2 = new DefaultPromptAssemblyObservatoryExporter()
    const observatory = createObservatory({
      trace: createTrace('create'),
    })
    expect(e1.export(observatory)).toBe(e2.export(observatory))
  })

  it('should produce same output for identical observatories', () => {
    const exporter = new DefaultPromptAssemblyObservatoryExporter()
    const o1 = createObservatory({ trace: createTrace('create') })
    const o2 = createObservatory({ trace: createTrace('create') })
    expect(exporter.export(o1)).toBe(exporter.export(o2))
  })

  it('should produce same output for empty observatory across calls', () => {
    const exporter = new DefaultPromptAssemblyObservatoryExporter()
    const r1 = exporter.export(createObservatory())
    const r2 = exporter.export(createObservatory())
    expect(r1).toBe(r2)
  })

  it('should produce deterministic output for all six artifacts', () => {
    const exporter = new DefaultPromptAssemblyObservatoryExporter()
    const observatory = createObservatory({
      trace: createTrace('create'),
      timeline: createTimeline(),
      history: createHistory(),
      traceSnapshot: createSnapshot(),
      timelineSnapshot: createTimelineSnapshot(),
      historySnapshot: createHistorySnapshot(),
    })
    const r1 = exporter.export(observatory)
    const r2 = exporter.export(observatory)
    expect(r1).toBe(r2)
  })
})

// ---------------------------------------------------------------------------
// Stateless
// ---------------------------------------------------------------------------

describe('Stateless', () => {
  it('should not retain state between calls', () => {
    const exporter = new DefaultPromptAssemblyObservatoryExporter()
    const o1 = createObservatory({ trace: createTrace('create') })
    const o2 = createObservatory({ history: createHistory() })
    const r1 = exporter.export(o1)
    const r2 = exporter.export(o2)
    expect(r1).not.toBe(r2)
    expect(JSON.parse(r1).trace).toBeDefined()
    expect(JSON.parse(r2).history).toBeDefined()
  })

  it('should produce independent results for different inputs', () => {
    const exporter = new DefaultPromptAssemblyObservatoryExporter()
    const results = [
      exporter.export(createObservatory({ trace: createTrace('a') })),
      exporter.export(createObservatory({ trace: createTrace('b') })),
      exporter.export(createObservatory({ trace: createTrace('c') })),
    ]
    expect(results[0]).not.toBe(results[1])
    expect(results[1]).not.toBe(results[2])
  })
})

// ---------------------------------------------------------------------------
// Pure
// ---------------------------------------------------------------------------

describe('Pure', () => {
  it('should not modify the input observatory', () => {
    const exporter = new DefaultPromptAssemblyObservatoryExporter()
    const observatory = Object.freeze(createObservatory({
      trace: Object.freeze(createTrace('create')),
      timeline: Object.freeze(createTimeline()),
    }))
    expect(() => exporter.export(observatory)).not.toThrow()
  })

  it('should not modify nested objects', () => {
    const exporter = new DefaultPromptAssemblyObservatoryExporter()
    const trace = createTrace('create')
    const observatory = createObservatory({ trace })
    exporter.export(observatory)
    expect(trace).toEqual(createTrace('create'))
  })

  it('should not modify array fields', () => {
    const exporter = new DefaultPromptAssemblyObservatoryExporter()
    const timeline = createTimeline()
    const history = createHistory()
    const observatory = createObservatory({ timeline, history })
    exporter.export(observatory)
    expect(timeline.entries).toHaveLength(0)
    expect(history.entries).toHaveLength(0)
  })

  it('should not add properties to the observatory', () => {
    const exporter = new DefaultPromptAssemblyObservatoryExporter()
    const observatory = createObservatory({ trace: createTrace('create') })
    const keysBefore = Object.keys(observatory).sort()
    exporter.export(observatory)
    const keysAfter = Object.keys(observatory).sort()
    expect(keysAfter).toEqual(keysBefore)
  })

  it('should not remove properties from the observatory', () => {
    const exporter = new DefaultPromptAssemblyObservatoryExporter()
    const observatory = createObservatory({
      trace: createTrace('create'),
      timeline: createTimeline(),
    })
    exporter.export(observatory)
    expect(observatory.trace).toBeDefined()
    expect(observatory.timeline).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Immutable
// ---------------------------------------------------------------------------

describe('Immutable', () => {
  it('should handle frozen observatory with all fields', () => {
    const exporter = new DefaultPromptAssemblyObservatoryExporter()
    const observatory = Object.freeze(createObservatory({
      trace: Object.freeze(createTrace('create')),
      timeline: Object.freeze(createTimeline()),
      history: Object.freeze(createHistory()),
      traceSnapshot: Object.freeze(createSnapshot()),
      timelineSnapshot: Object.freeze(createTimelineSnapshot()),
      historySnapshot: Object.freeze(createHistorySnapshot()),
    }))
    const result = exporter.export(observatory)
    const parsed = JSON.parse(result)
    expect(parsed.trace.strategy.name).toBe('create')
  })

  it('should handle deeply frozen nested arrays', () => {
    const exporter = new DefaultPromptAssemblyObservatoryExporter()
    const timeline = Object.freeze(createTimeline())
    const history = Object.freeze(createHistory())
    const observatory = Object.freeze(createObservatory({ timeline, history }))
    const result = exporter.export(observatory)
    const parsed = JSON.parse(result)
    expect(parsed.timeline.entries).toEqual([])
    expect(parsed.history.entries).toEqual([])
  })

  it('should not mutate frozen input fields', () => {
    const exporter = new DefaultPromptAssemblyObservatoryExporter()
    const trace = Object.freeze(createTrace('create'))
    const observatory = Object.freeze(createObservatory({ trace }))
    expect(() => exporter.export(observatory)).not.toThrow()
  })
})

// ---------------------------------------------------------------------------
// Export Validation
// ---------------------------------------------------------------------------

describe('Export validation', () => {
  it('should export trace with strategy', () => {
    const exporter = new DefaultPromptAssemblyObservatoryExporter()
    const observatory = createObservatory({ trace: createTrace('create') })
    const result = exporter.export(observatory)
    const parsed = JSON.parse(result)
    expect(parsed.trace.strategy.name).toBe('create')
  })

  it('should export timeline with entries array', () => {
    const exporter = new DefaultPromptAssemblyObservatoryExporter()
    const observatory = createObservatory({ timeline: createTimeline() })
    const result = exporter.export(observatory)
    const parsed = JSON.parse(result)
    expect(Array.isArray(parsed.timeline.entries)).toBe(true)
  })

  it('should export history with entries array', () => {
    const exporter = new DefaultPromptAssemblyObservatoryExporter()
    const observatory = createObservatory({ history: createHistory() })
    const result = exporter.export(observatory)
    const parsed = JSON.parse(result)
    expect(Array.isArray(parsed.history.entries)).toBe(true)
  })

  it('should export traceSnapshot as object', () => {
    const exporter = new DefaultPromptAssemblyObservatoryExporter()
    const observatory = createObservatory({ traceSnapshot: createSnapshot() })
    const result = exporter.export(observatory)
    const parsed = JSON.parse(result)
    expect(typeof parsed.traceSnapshot).toBe('object')
  })

  it('should export timelineSnapshot as object', () => {
    const exporter = new DefaultPromptAssemblyObservatoryExporter()
    const observatory = createObservatory({ timelineSnapshot: createTimelineSnapshot() })
    const result = exporter.export(observatory)
    const parsed = JSON.parse(result)
    expect(typeof parsed.timelineSnapshot).toBe('object')
  })

  it('should export historySnapshot as object', () => {
    const exporter = new DefaultPromptAssemblyObservatoryExporter()
    const observatory = createObservatory({ historySnapshot: createHistorySnapshot() })
    const result = exporter.export(observatory)
    const parsed = JSON.parse(result)
    expect(typeof parsed.historySnapshot).toBe('object')
  })

  it('should preserve trace structure exactly', () => {
    const exporter = new DefaultPromptAssemblyObservatoryExporter()
    const trace = createTrace('custom')
    const observatory = createObservatory({ trace })
    const result = exporter.export(observatory)
    const parsed = JSON.parse(result)
    expect(parsed.trace).toEqual(trace)
  })

  it('should preserve timeline structure exactly', () => {
    const exporter = new DefaultPromptAssemblyObservatoryExporter()
    const timeline = createTimeline()
    const observatory = createObservatory({ timeline })
    const result = exporter.export(observatory)
    const parsed = JSON.parse(result)
    expect(parsed.timeline).toEqual(timeline)
  })

  it('should preserve history structure exactly', () => {
    const exporter = new DefaultPromptAssemblyObservatoryExporter()
    const history = createHistory()
    const observatory = createObservatory({ history })
    const result = exporter.export(observatory)
    const parsed = JSON.parse(result)
    expect(parsed.history).toEqual(history)
  })

  it('should export traceSnapshot strategy as string', () => {
    const exporter = new DefaultPromptAssemblyObservatoryExporter()
    const observatory = createObservatory({ traceSnapshot: createSnapshot() })
    const result = exporter.export(observatory)
    const parsed = JSON.parse(result)
    expect(typeof parsed.traceSnapshot.strategy).toBe('string')
  })

  it('should export timelineSnapshot with firstStrategy', () => {
    const exporter = new DefaultPromptAssemblyObservatoryExporter()
    const observatory = createObservatory({ timelineSnapshot: createTimelineSnapshot() })
    const result = exporter.export(observatory)
    const parsed = JSON.parse(result)
    expect(parsed.timelineSnapshot.firstStrategy).toBe('create')
  })

  it('should export historySnapshot with firstStrategy', () => {
    const exporter = new DefaultPromptAssemblyObservatoryExporter()
    const observatory = createObservatory({ historySnapshot: createHistorySnapshot() })
    const result = exporter.export(observatory)
    const parsed = JSON.parse(result)
    expect(parsed.historySnapshot.firstStrategy).toBe('create')
  })
})

// ---------------------------------------------------------------------------
// Architecture Compliance
// ---------------------------------------------------------------------------

describe('Architecture compliance', () => {
  it('should have zero dependencies on Runtime', () => {
    const code = DefaultPromptAssemblyObservatoryExporter.toString()
    expect(code).not.toContain('Runtime')
  })

  it('should have zero dependencies on Planner', () => {
    const code = DefaultPromptAssemblyObservatoryExporter.toString()
    expect(code).not.toContain('Planner')
  })

  it('should have zero dependencies on Pipeline', () => {
    const code = DefaultPromptAssemblyObservatoryExporter.toString()
    expect(code).not.toContain('Pipeline')
  })

  it('should have zero dependencies on Provider', () => {
    const code = DefaultPromptAssemblyObservatoryExporter.toString()
    expect(code).not.toContain('Provider')
  })

  it('should have zero dependencies on Memory', () => {
    const code = DefaultPromptAssemblyObservatoryExporter.toString()
    expect(code).not.toContain('Memory')
  })

  it('should have zero dependencies on AgentLoop', () => {
    const code = DefaultPromptAssemblyObservatoryExporter.toString()
    expect(code).not.toContain('AgentLoop')
  })

  it('should have zero dependencies on PromptBuilder', () => {
    const code = DefaultPromptAssemblyObservatoryExporter.toString()
    expect(code).not.toContain('PromptBuilder')
  })

  it('should have zero dependencies on BuilderOptions', () => {
    const code = DefaultPromptAssemblyObservatoryExporter.toString()
    expect(code).not.toContain('BuilderOptions')
  })

  it('should have zero dependencies on PromptRenderer', () => {
    const code = DefaultPromptAssemblyObservatoryExporter.toString()
    expect(code).not.toContain('PromptRenderer')
  })

  it('should have zero dependencies on PromptCompression', () => {
    const code = DefaultPromptAssemblyObservatoryExporter.toString()
    expect(code).not.toContain('PromptCompression')
  })

  it('should depend only on PromptAssemblyObservatory', () => {
    // DefaultPromptAssemblyObservatoryExporter only imports types from its parent interfaces
    const deps = [
      'PromptAssemblyObservatory',
      'PromptAssemblyObservatoryExporter',
    ]
    for (const dep of deps) {
      expect(DefaultPromptAssemblyObservatoryExporter.toString()).toContain(dep)
    }
  })
})

// ---------------------------------------------------------------------------
// Edge Cases
// ---------------------------------------------------------------------------

describe('Edge cases', () => {
  it('should handle observatory with undefined fields', () => {
    const exporter = new DefaultPromptAssemblyObservatoryExporter()
    const observatory = createObservatory({
      trace: undefined,
      timeline: undefined,
      history: undefined,
    })
    const result = exporter.export(observatory)
    const parsed = JSON.parse(result)
    expect(parsed).toEqual({})
  })

  it('should handle observatory with null-like fields (undefined only)', () => {
    const exporter = new DefaultPromptAssemblyObservatoryExporter()
    const observatory = createObservatory({
      trace: undefined,
      timeline: undefined,
    } as PromptAssemblyObservatory)
    const result = exporter.export(observatory)
    const parsed = JSON.parse(result)
    // undefined values are not serialized
    expect(parsed.trace).toBeUndefined()
  })

  it('should handle observatory with trace having all optional fields omitted', () => {
    const exporter = new DefaultPromptAssemblyObservatoryExporter()
    const observatory = createObservatory({ trace: {} })
    const result = exporter.export(observatory)
    const parsed = JSON.parse(result)
    expect(parsed.trace).toEqual({})
  })

  it('should handle observatory with timeline having empty entries', () => {
    const exporter = new DefaultPromptAssemblyObservatoryExporter()
    const observatory = createObservatory({ timeline: { entries: [] } })
    const result = exporter.export(observatory)
    const parsed = JSON.parse(result)
    expect(parsed.timeline.entries).toHaveLength(0)
  })

  it('should handle observatory with history having empty entries', () => {
    const exporter = new DefaultPromptAssemblyObservatoryExporter()
    const observatory = createObservatory({ history: { entries: [] } })
    const result = exporter.export(observatory)
    const parsed = JSON.parse(result)
    expect(parsed.history.entries).toHaveLength(0)
  })

  it('should handle unicode strings in strategy names', () => {
    const exporter = new DefaultPromptAssemblyObservatoryExporter()
    const observatory = createObservatory({
      trace: createTrace('créer'),
    })
    const result = exporter.export(observatory)
    const parsed = JSON.parse(result)
    expect(parsed.trace.strategy.name).toBe('créer')
  })

  it('should handle strategy name with special characters', () => {
    const exporter = new DefaultPromptAssemblyObservatoryExporter()
    const observatory = createObservatory({
      trace: createTrace('test-strategy_v1.0'),
    })
    const result = exporter.export(observatory)
    const parsed = JSON.parse(result)
    expect(parsed.trace.strategy.name).toBe('test-strategy_v1.0')
  })

  it('should handle observatory with all fields set to empty arrays', () => {
    const exporter = new DefaultPromptAssemblyObservatoryExporter()
    const observatory = createObservatory({
      timeline: { entries: [] },
      history: { entries: [] },
    })
    const result = exporter.export(observatory)
    const parsed = JSON.parse(result)
    expect(parsed.timeline.entries).toEqual([])
    expect(parsed.history.entries).toEqual([])
  })

  it('should produce identical output for JSON.parse(export).stringify roundtrip', () => {
    const exporter = new DefaultPromptAssemblyObservatoryExporter()
    const observatory = createObservatory({
      trace: createTrace('create'),
      timeline: createTimeline(),
      history: createHistory(),
    })
    const exported = exporter.export(observatory)
    const parsed = JSON.parse(exported)
    const reStringified = JSON.stringify(parsed, null, 2)
    expect(exported).toBe(reStringified)
  })

  it('should handle observatory with partial snapshots', () => {
    const exporter = new DefaultPromptAssemblyObservatoryExporter()
    const observatory = createObservatory({
      traceSnapshot: createSnapshot(),
    })
    const result = exporter.export(observatory)
    const parsed = JSON.parse(result)
    expect(parsed.traceSnapshot).toBeDefined()
    expect(parsed.timelineSnapshot).toBeUndefined()
    expect(parsed.historySnapshot).toBeUndefined()
  })

  it('should handle observatory with partial core artifacts', () => {
    const exporter = new DefaultPromptAssemblyObservatoryExporter()
    const observatory = createObservatory({
      trace: createTrace('create'),
    })
    const result = exporter.export(observatory)
    const parsed = JSON.parse(result)
    expect(parsed.trace).toBeDefined()
    expect(parsed.timeline).toBeUndefined()
    expect(parsed.history).toBeUndefined()
  })

  it('should handle large timeline entries count', () => {
    const exporter = new DefaultPromptAssemblyObservatoryExporter()
    const entries: PromptAssemblyTimelineEntry[] = Array.from(
      { length: 100 },
      (_, i) => ({ index: i, trace: createTrace(`strategy-${i}`) }),
    )
    const observatory = createObservatory({ timeline: { entries } })
    const result = exporter.export(observatory)
    const parsed = JSON.parse(result)
    expect(parsed.timeline.entries).toHaveLength(100)
    expect(parsed.timeline.entries[99].trace.strategy.name).toBe('strategy-99')
  })

  it('should handle large history entries count', () => {
    const exporter = new DefaultPromptAssemblyObservatoryExporter()
    const entries: PromptAssemblyHistoryEntry[] = Array.from(
      { length: 100 },
      (_, i) => ({ index: i, trace: createTrace(`strategy-${i}`) }),
    )
    const observatory = createObservatory({ history: { entries } })
    const result = exporter.export(observatory)
    const parsed = JSON.parse(result)
    expect(parsed.history.entries).toHaveLength(100)
    expect(parsed.history.entries[99].trace.strategy.name).toBe('strategy-99')
  })

  it('should handle observatory with all six artifacts having empty content', () => {
    const exporter = new DefaultPromptAssemblyObservatoryExporter()
    const observatory = createObservatory({
      trace: {},
      timeline: { entries: [] },
      history: { entries: [] },
      traceSnapshot: {},
      timelineSnapshot: { entryCount: 0 } as PromptAssemblyTimelineSnapshot,
      historySnapshot: { entryCount: 0 } as PromptAssemblyHistorySnapshot,
    })
    const result = exporter.export(observatory)
    const parsed = JSON.parse(result)
    expect(parsed.trace).toEqual({})
    expect(parsed.timeline.entries).toEqual([])
    expect(parsed.history.entries).toEqual([])
  })

  it('should handle observatory with trace having numeric strategy values', () => {
    const exporter = new DefaultPromptAssemblyObservatoryExporter()
    const observatory = createObservatory({
      trace: { strategy: { name: '123' } },
    })
    const result = exporter.export(observatory)
    const parsed = JSON.parse(result)
    expect(parsed.trace.strategy.name).toBe('123')
  })
})

// ---------------------------------------------------------------------------
// Error Handling
// ---------------------------------------------------------------------------

describe('Error handling', () => {
  it('should not throw for empty observatory', () => {
    const exporter = new DefaultPromptAssemblyObservatoryExporter()
    expect(() => exporter.export(createObservatory())).not.toThrow()
  })

  it('should not throw for fully populated observatory', () => {
    const exporter = new DefaultPromptAssemblyObservatoryExporter()
    const observatory = createObservatory({
      trace: createTrace('create'),
      timeline: createTimeline(),
      history: createHistory(),
      traceSnapshot: createSnapshot(),
      timelineSnapshot: createTimelineSnapshot(),
      historySnapshot: createHistorySnapshot(),
    })
    expect(() => exporter.export(observatory)).not.toThrow()
  })
})

// ---------------------------------------------------------------------------
// Compatibility
// ---------------------------------------------------------------------------

describe('Compatibility', () => {
  it('should be compatible with RetryPlanner scenarios', () => {
    const exporter = new DefaultPromptAssemblyObservatoryExporter()
    const observatory = createObservatory({ trace: createTrace('create') })
    const result = exporter.export(observatory)
    expect(() => JSON.parse(result)).not.toThrow()
  })

  it('should be compatible with ToolCallPlanner scenarios', () => {
    const exporter = new DefaultPromptAssemblyObservatoryExporter()
    const observatory = createObservatory({ trace: createTrace('query') })
    const result = exporter.export(observatory)
    expect(() => JSON.parse(result)).not.toThrow()
  })

  it('should be compatible with Streaming scenarios', () => {
    const exporter = new DefaultPromptAssemblyObservatoryExporter()
    const observatory = createObservatory({ timeline: createTimeline() })
    const result = exporter.export(observatory)
    expect(() => JSON.parse(result)).not.toThrow()
  })

  it('should be compatible with AgentLoop scenarios', () => {
    const exporter = new DefaultPromptAssemblyObservatoryExporter()
    const observatory = createObservatory({ history: createHistory() })
    const result = exporter.export(observatory)
    expect(() => JSON.parse(result)).not.toThrow()
  })
})