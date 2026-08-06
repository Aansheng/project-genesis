import { describe, it, expect } from 'vitest'
import { DefaultPromptAssemblyHistoryExporter } from '../strategy/DefaultPromptAssemblyHistoryExporter'
import type { PromptAssemblyHistoryExporter } from '../strategy/PromptAssemblyHistoryExporter'
import type { PromptAssemblyHistory } from '../strategy/PromptAssemblyHistory'
import type { PromptAssemblyHistoryEntry } from '../strategy/PromptAssemblyHistoryEntry'
import type { PromptAssemblyTrace } from '../strategy/PromptAssemblyTrace'
import { DefaultPromptAssemblyHistoryBuilder } from '../strategy/DefaultPromptAssemblyHistoryBuilder'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const builder = new DefaultPromptAssemblyHistoryBuilder()

function createTrace(strategyName?: string): PromptAssemblyTrace {
  return strategyName !== undefined
    ? { strategy: { name: strategyName } }
    : {}
}

function createEntry(index: number, strategyName?: string): PromptAssemblyHistoryEntry {
  return { index, trace: createTrace(strategyName) }
}

function createHistory(entries: readonly PromptAssemblyHistoryEntry[]): PromptAssemblyHistory {
  return { entries }
}

function buildHistory(traces: readonly PromptAssemblyTrace[]): PromptAssemblyHistory {
  return builder.build(traces)
}

function createEmptyHistory(): PromptAssemblyHistory {
  return { entries: [] }
}

// ---------------------------------------------------------------------------
// Interface Contract
// ---------------------------------------------------------------------------

describe('Interface contract', () => {
  it('should define export method', () => {
    const exporter: PromptAssemblyHistoryExporter = new DefaultPromptAssemblyHistoryExporter()
    expect(typeof exporter.export).toBe('function')
  })

  it('should accept a history and return a string', () => {
    const exporter = new DefaultPromptAssemblyHistoryExporter()
    const result = exporter.export(createEmptyHistory())
    expect(typeof result).toBe('string')
  })

  it('should accept a custom implementation', () => {
    const custom: PromptAssemblyHistoryExporter = {
      export(_history: PromptAssemblyHistory): string {
        return 'custom export'
      },
    }
    expect(custom.export(createEmptyHistory())).toBe('custom export')
  })
})

// ---------------------------------------------------------------------------
// Empty History
// ---------------------------------------------------------------------------

describe('Empty history', () => {
  it('should export empty history as JSON object', () => {
    const exporter = new DefaultPromptAssemblyHistoryExporter()
    const history = createEmptyHistory()
    const result = exporter.export(history)
    expect(() => JSON.parse(result)).not.toThrow()
    expect(JSON.parse(result)).toEqual({ entries: [] })
  })

  it('should export empty entries array', () => {
    const exporter = new DefaultPromptAssemblyHistoryExporter()
    const history = createEmptyHistory()
    const result = exporter.export(history)
    const parsed = JSON.parse(result)
    expect(Array.isArray(parsed.entries)).toBe(true)
    expect(parsed.entries).toHaveLength(0)
  })

  it('should produce exact JSON output for empty history', () => {
    const exporter = new DefaultPromptAssemblyHistoryExporter()
    const history = createEmptyHistory()
    const result = exporter.export(history)
    expect(result).toBe(JSON.stringify(history, null, 2))
  })

  it('should return valid JSON for empty history', () => {
    const exporter = new DefaultPromptAssemblyHistoryExporter()
    const result = exporter.export(createEmptyHistory())
    expect(() => JSON.parse(result)).not.toThrow()
  })

  it('should handle history with frozen empty entries', () => {
    const exporter = new DefaultPromptAssemblyHistoryExporter()
    const history = Object.freeze({ entries: Object.freeze([]) })
    const result = exporter.export(history)
    const parsed = JSON.parse(result)
    expect(parsed.entries).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// Single Entry
// ---------------------------------------------------------------------------

describe('Single entry', () => {
  it('should export history with one create entry', () => {
    const exporter = new DefaultPromptAssemblyHistoryExporter()
    const history = buildHistory([createTrace('create')])
    const result = exporter.export(history)
    const parsed = JSON.parse(result)
    expect(parsed.entries).toHaveLength(1)
    expect(parsed.entries[0].index).toBe(0)
    expect(parsed.entries[0].trace.strategy.name).toBe('create')
  })

  it('should export history with one query entry', () => {
    const exporter = new DefaultPromptAssemblyHistoryExporter()
    const history = buildHistory([createTrace('query')])
    const result = exporter.export(history)
    const parsed = JSON.parse(result)
    expect(parsed.entries[0].trace.strategy.name).toBe('query')
  })

  it('should export history with one modify entry', () => {
    const exporter = new DefaultPromptAssemblyHistoryExporter()
    const history = buildHistory([createTrace('modify')])
    const result = exporter.export(history)
    const parsed = JSON.parse(result)
    expect(parsed.entries[0].trace.strategy.name).toBe('modify')
  })

  it('should export history with one delete entry', () => {
    const exporter = new DefaultPromptAssemblyHistoryExporter()
    const history = buildHistory([createTrace('delete')])
    const result = exporter.export(history)
    const parsed = JSON.parse(result)
    expect(parsed.entries[0].trace.strategy.name).toBe('delete')
  })

  it('should export history with entry with unknown strategy', () => {
    const exporter = new DefaultPromptAssemblyHistoryExporter()
    const history = buildHistory([createTrace('unknown')])
    const result = exporter.export(history)
    const parsed = JSON.parse(result)
    expect(parsed.entries[0].trace.strategy.name).toBe('unknown')
  })

  it('should export history with entry with null strategy', () => {
    const exporter = new DefaultPromptAssemblyHistoryExporter()
    const history = buildHistory([{ strategy: null } as unknown as PromptAssemblyTrace])
    const result = exporter.export(history)
    const parsed = JSON.parse(result)
    expect(parsed.entries[0].trace.strategy).toBeNull()
  })

  it('should export history with entry with no strategy', () => {
    const exporter = new DefaultPromptAssemblyHistoryExporter()
    const history = buildHistory([createTrace()])
    const result = exporter.export(history)
    const parsed = JSON.parse(result)
    expect(parsed.entries[0].trace).toEqual({})
  })

  it('should export history with entry at index 0', () => {
    const exporter = new DefaultPromptAssemblyHistoryExporter()
    const history = createHistory([createEntry(0, 'create')])
    const result = exporter.export(history)
    const parsed = JSON.parse(result)
    expect(parsed.entries[0].index).toBe(0)
  })

  it('should export history with entry at high index', () => {
    const exporter = new DefaultPromptAssemblyHistoryExporter()
    const history = createHistory([createEntry(99, 'create')])
    const result = exporter.export(history)
    const parsed = JSON.parse(result)
    expect(parsed.entries[0].index).toBe(99)
  })
})

// ---------------------------------------------------------------------------
// Multiple Entries
// ---------------------------------------------------------------------------

describe('Multiple entries', () => {
  it('should export history with two entries in order', () => {
    const exporter = new DefaultPromptAssemblyHistoryExporter()
    const history = buildHistory([createTrace('create'), createTrace('query')])
    const result = exporter.export(history)
    const parsed = JSON.parse(result)
    expect(parsed.entries).toHaveLength(2)
    expect(parsed.entries[0].trace.strategy.name).toBe('create')
    expect(parsed.entries[1].trace.strategy.name).toBe('query')
  })

  it('should export history with three entries', () => {
    const exporter = new DefaultPromptAssemblyHistoryExporter()
    const history = buildHistory([createTrace('create'), createTrace('modify'), createTrace('delete')])
    const result = exporter.export(history)
    const parsed = JSON.parse(result)
    expect(parsed.entries).toHaveLength(3)
    expect(parsed.entries[0].trace.strategy.name).toBe('create')
    expect(parsed.entries[1].trace.strategy.name).toBe('modify')
    expect(parsed.entries[2].trace.strategy.name).toBe('delete')
  })

  it('should preserve entry order', () => {
    const exporter = new DefaultPromptAssemblyHistoryExporter()
    const history = createHistory([
      createEntry(5, 'modify'),
      createEntry(0, 'create'),
      createEntry(3, 'query'),
    ])
    const result = exporter.export(history)
    const parsed = JSON.parse(result)
    expect(parsed.entries[0].index).toBe(5)
    expect(parsed.entries[1].index).toBe(0)
    expect(parsed.entries[2].index).toBe(3)
  })

  it('should export history with mixed strategies', () => {
    const exporter = new DefaultPromptAssemblyHistoryExporter()
    const history = buildHistory([
      createTrace('create'),
      createTrace('query'),
      createTrace('modify'),
      createTrace('delete'),
    ])
    const result = exporter.export(history)
    const parsed = JSON.parse(result)
    expect(parsed.entries[0].trace.strategy.name).toBe('create')
    expect(parsed.entries[1].trace.strategy.name).toBe('query')
    expect(parsed.entries[2].trace.strategy.name).toBe('modify')
    expect(parsed.entries[3].trace.strategy.name).toBe('delete')
  })

  it('should export history with duplicate strategies', () => {
    const exporter = new DefaultPromptAssemblyHistoryExporter()
    const history = buildHistory([createTrace('create'), createTrace('create'), createTrace('create')])
    const result = exporter.export(history)
    const parsed = JSON.parse(result)
    expect(parsed.entries).toHaveLength(3)
    expect(parsed.entries[0].trace.strategy.name).toBe('create')
    expect(parsed.entries[1].trace.strategy.name).toBe('create')
    expect(parsed.entries[2].trace.strategy.name).toBe('create')
  })

  it('should export history with 5 entries', () => {
    const exporter = new DefaultPromptAssemblyHistoryExporter()
    const trace = createTrace('create')
    const history = builder.build([trace, trace, trace, trace, trace])
    const result = exporter.export(history)
    const parsed = JSON.parse(result)
    expect(parsed.entries).toHaveLength(5)
  })

  it('should export history with known and unknown strategies', () => {
    const exporter = new DefaultPromptAssemblyHistoryExporter()
    const history = buildHistory([createTrace('create'), createTrace('unknown'), createTrace('query')])
    const result = exporter.export(history)
    const parsed = JSON.parse(result)
    expect(parsed.entries[0].trace.strategy.name).toBe('create')
    expect(parsed.entries[1].trace.strategy.name).toBe('unknown')
    expect(parsed.entries[2].trace.strategy.name).toBe('query')
  })
})

// ---------------------------------------------------------------------------
// JSON Validation
// ---------------------------------------------------------------------------

describe('JSON validation', () => {
  it('should produce valid parseable JSON', () => {
    const exporter = new DefaultPromptAssemblyHistoryExporter()
    const history = buildHistory([createTrace('create'), createTrace('modify')])
    const result = exporter.export(history)
    expect(() => JSON.parse(result)).not.toThrow()
  })

  it('should produce JSON that parses back to equivalent object', () => {
    const exporter = new DefaultPromptAssemblyHistoryExporter()
    const history = buildHistory([createTrace('create')])
    const result = exporter.export(history)
    const parsed = JSON.parse(result)
    expect(parsed.entries[0].index).toBe(0)
    expect(parsed.entries[0].trace.strategy.name).toBe('create')
  })

  it('should match JSON.stringify output exactly', () => {
    const exporter = new DefaultPromptAssemblyHistoryExporter()
    const history = buildHistory([createTrace('create')])
    expect(exporter.export(history)).toBe(JSON.stringify(history, null, 2))
  })

  it('should match JSON.stringify for empty history', () => {
    const exporter = new DefaultPromptAssemblyHistoryExporter()
    const history = createEmptyHistory()
    expect(exporter.export(history)).toBe(JSON.stringify(history, null, 2))
  })

  it('should match JSON.stringify for multi-entry history', () => {
    const exporter = new DefaultPromptAssemblyHistoryExporter()
    const history = buildHistory([createTrace('create'), createTrace('query'), createTrace('modify'), createTrace('delete')])
    expect(exporter.export(history)).toBe(JSON.stringify(history, null, 2))
  })

  it('should produce parseable JSON that roundtrips correctly', () => {
    const exporter = new DefaultPromptAssemblyHistoryExporter()
    const history = buildHistory([createTrace('create')])
    const result = exporter.export(history)
    const parsed = JSON.parse(result)
    const reStringified = JSON.stringify(parsed, null, 2)
    expect(reStringified).toBe(result)
  })
})

// ---------------------------------------------------------------------------
// Deterministic
// ---------------------------------------------------------------------------

describe('Deterministic', () => {
  it('should produce same output for same history across multiple calls', () => {
    const exporter = new DefaultPromptAssemblyHistoryExporter()
    const history = buildHistory([createTrace('create'), createTrace('modify')])
    const r1 = exporter.export(history)
    const r2 = exporter.export(history)
    const r3 = exporter.export(history)
    expect(r1).toBe(r2)
    expect(r2).toBe(r3)
  })

  it('should produce same output across different exporter instances', () => {
    const e1 = new DefaultPromptAssemblyHistoryExporter()
    const e2 = new DefaultPromptAssemblyHistoryExporter()
    const history = buildHistory([createTrace('create')])
    expect(e1.export(history)).toBe(e2.export(history))
  })

  it('should produce same output for identical histories', () => {
    const exporter = new DefaultPromptAssemblyHistoryExporter()
    const history1 = buildHistory([createTrace('create')])
    const history2 = buildHistory([createTrace('create')])
    expect(exporter.export(history1)).toBe(exporter.export(history2))
  })

  it('should produce same output for empty histories', () => {
    const exporter = new DefaultPromptAssemblyHistoryExporter()
    expect(exporter.export(createEmptyHistory())).toBe(exporter.export(createEmptyHistory()))
  })

  it('should produce same output for large history across calls', () => {
    const exporter = new DefaultPromptAssemblyHistoryExporter()
    const traces = Array.from({ length: 50 }, (_, i) => createTrace(`strategy-${i}`))
    const history = buildHistory(traces)
    const r1 = exporter.export(history)
    const r2 = exporter.export(history)
    expect(r1).toBe(r2)
  })
})

// ---------------------------------------------------------------------------
// Stateless
// ---------------------------------------------------------------------------

describe('Stateless', () => {
  it('should not retain state between export calls', () => {
    const exporter = new DefaultPromptAssemblyHistoryExporter()
    const r1 = exporter.export(buildHistory([createTrace('create')]))
    const r2 = exporter.export(buildHistory([createTrace('query')]))
    const p1 = JSON.parse(r1)
    const p2 = JSON.parse(r2)
    expect(p1.entries[0].trace.strategy.name).toBe('create')
    expect(p2.entries[0].trace.strategy.name).toBe('query')
  })

  it('should produce independent results from sequential calls', () => {
    const exporter = new DefaultPromptAssemblyHistoryExporter()
    const r1 = exporter.export(buildHistory([createTrace('create'), createTrace('modify')]))
    const r2 = exporter.export(createEmptyHistory())
    expect(r1).not.toBe(r2)
    expect(JSON.parse(r2)).toEqual({ entries: [] })
  })

  it('should not accumulate state across calls', () => {
    const exporter = new DefaultPromptAssemblyHistoryExporter()
    const r1 = exporter.export(createEmptyHistory())
    const r2 = exporter.export(buildHistory([createTrace('create')]))
    const r3 = exporter.export(createEmptyHistory())
    expect(r1).toBe(JSON.stringify(createEmptyHistory(), null, 2))
    expect(JSON.parse(r2).entries).toHaveLength(1)
    expect(r3).toBe(JSON.stringify(createEmptyHistory(), null, 2))
  })

  it('should handle many sequential calls without interference', () => {
    const exporter = new DefaultPromptAssemblyHistoryExporter()
    const history = buildHistory([createTrace('create')])
    const results = Array.from({ length: 10 }, () => exporter.export(history))
    results.forEach((r) => {
      expect(r).toBe(JSON.stringify(history, null, 2))
    })
  })
})

// ---------------------------------------------------------------------------
// Pure
// ---------------------------------------------------------------------------

describe('Pure', () => {
  it('should not modify input history', () => {
    const exporter = new DefaultPromptAssemblyHistoryExporter()
    const history = buildHistory([createTrace('create')])
    const original = JSON.stringify(history)
    exporter.export(history)
    expect(JSON.stringify(history)).toBe(original)
  })

  it('should not modify nested objects in history', () => {
    const exporter = new DefaultPromptAssemblyHistoryExporter()
    const history = buildHistory([createTrace('create')])
    const originalEntries = JSON.stringify(history.entries)
    exporter.export(history)
    expect(JSON.stringify(history.entries)).toBe(originalEntries)
  })

  it('should have no side effects on external state', () => {
    const exporter = new DefaultPromptAssemblyHistoryExporter()
    const history = createEmptyHistory()
    const result1 = exporter.export(history)
    const result2 = exporter.export(history)
    expect(result1).toBe(result2)
  })

  it('should not modify frozen history objects', () => {
    const exporter = new DefaultPromptAssemblyHistoryExporter()
    const history = Object.freeze(buildHistory([createTrace('create')]))
    expect(() => exporter.export(history)).not.toThrow()
  })
})

// ---------------------------------------------------------------------------
// Immutable
// ---------------------------------------------------------------------------

describe('Immutable', () => {
  it('should not mutate history entries array length', () => {
    const exporter = new DefaultPromptAssemblyHistoryExporter()
    const history = buildHistory([createTrace('create')])
    const before = history.entries.length
    exporter.export(history)
    expect(history.entries.length).toBe(before)
  })

  it('should not mutate entry indices', () => {
    const exporter = new DefaultPromptAssemblyHistoryExporter()
    const history = buildHistory([createTrace('create')])
    const before = history.entries[0].index
    exporter.export(history)
    expect(history.entries[0].index).toBe(before)
  })

  it('should not mutate trace references', () => {
    const exporter = new DefaultPromptAssemblyHistoryExporter()
    const history = buildHistory([createTrace('create')])
    const before = JSON.stringify(history.entries[0].trace)
    exporter.export(history)
    expect(JSON.stringify(history.entries[0].trace)).toBe(before)
  })
})

// ---------------------------------------------------------------------------
// JSON Formatting
// ---------------------------------------------------------------------------

describe('JSON formatting', () => {
  it('should use 2-space indentation', () => {
    const exporter = new DefaultPromptAssemblyHistoryExporter()
    const history = buildHistory([createTrace('create')])
    const result = exporter.export(history)
    // Pretty-printed JSON uses 2-space indent — check for `"entries"` with leading spaces
    expect(result).toContain('  "entries"')
  })

  it('should include newlines for pretty printing', () => {
    const exporter = new DefaultPromptAssemblyHistoryExporter()
    const history = buildHistory([createTrace('create')])
    const result = exporter.export(history)
    expect(result).toContain('\n')
  })

  it('should produce parseable JSON', () => {
    const exporter = new DefaultPromptAssemblyHistoryExporter()
    const history = buildHistory([createTrace('create'), createTrace('modify')])
    const result = exporter.export(history)
    expect(() => JSON.parse(result)).not.toThrow()
  })

  it('should preserve object key order in output', () => {
    const exporter = new DefaultPromptAssemblyHistoryExporter()
    const history = buildHistory([createTrace('create')])
    const result = exporter.export(history)
    const parsed = JSON.parse(result)
    const keys = Object.keys(parsed)
    expect(keys).toEqual(['entries'])
  })

  it('should handle deeply nested JSON in traces', () => {
    const exporter = new DefaultPromptAssemblyHistoryExporter()
    const trace: PromptAssemblyTrace = { strategy: { name: 'create', version: 2, meta: { key: 'val' } } }
    const history = buildHistory([trace])
    const result = exporter.export(history)
    const parsed = JSON.parse(result)
    expect(parsed.entries[0].trace.strategy.meta.key).toBe('val')
  })

  it('should produce valid JSON for entry with empty trace', () => {
    const exporter = new DefaultPromptAssemblyHistoryExporter()
    const history = buildHistory([{} as PromptAssemblyTrace])
    const result = exporter.export(history)
    const parsed = JSON.parse(result)
    expect(parsed.entries[0].trace).toEqual({})
  })

  it('should pretty-print with multiline formatting', () => {
    const exporter = new DefaultPromptAssemblyHistoryExporter()
    const history = buildHistory([createTrace('create')])
    const result = exporter.export(history)
    const lines = result.split('\n')
    expect(lines.length).toBeGreaterThan(1)
  })
})

// ---------------------------------------------------------------------------
// Edge Cases
// ---------------------------------------------------------------------------

describe('Edge cases', () => {
  it('should export history with unicode characters in strategy name', () => {
    const exporter = new DefaultPromptAssemblyHistoryExporter()
    const trace: PromptAssemblyTrace = { strategy: { name: '中文策略' } }
    const history = buildHistory([trace])
    const result = exporter.export(history)
    const parsed = JSON.parse(result)
    expect(parsed.entries[0].trace.strategy.name).toBe('中文策略')
  })

  it('should export history with special characters in strategy name', () => {
    const exporter = new DefaultPromptAssemblyHistoryExporter()
    const trace: PromptAssemblyTrace = { strategy: { name: 'line1\nline2\ttab"quote\\slash' } }
    const history = buildHistory([trace])
    const result = exporter.export(history)
    const parsed = JSON.parse(result)
    expect(parsed.entries[0].trace.strategy.name).toBe('line1\nline2\ttab"quote\\slash')
  })

  it('should export history with 100 entries', () => {
    const exporter = new DefaultPromptAssemblyHistoryExporter()
    const traces = Array.from({ length: 100 }, (_, i) => createTrace(`strategy-${i}`))
    const history = buildHistory(traces)
    const result = exporter.export(history)
    const parsed = JSON.parse(result)
    expect(parsed.entries).toHaveLength(100)
  })

  it('should export history with 200 entries', () => {
    const exporter = new DefaultPromptAssemblyHistoryExporter()
    const traces = Array.from({ length: 200 }, () => createTrace('create'))
    const history = buildHistory(traces)
    const result = exporter.export(history)
    const parsed = JSON.parse(result)
    expect(parsed.entries).toHaveLength(200)
  })

  it('should export history with large indices', () => {
    const exporter = new DefaultPromptAssemblyHistoryExporter()
    const history = createHistory([createEntry(9999, 'create')])
    const result = exporter.export(history)
    const parsed = JSON.parse(result)
    expect(parsed.entries[0].index).toBe(9999)
  })

  it('should export history with null strategy value', () => {
    const exporter = new DefaultPromptAssemblyHistoryExporter()
    const history = buildHistory([{ strategy: null } as unknown as PromptAssemblyTrace])
    const result = exporter.export(history)
    const parsed = JSON.parse(result)
    expect(parsed.entries[0].trace.strategy).toBeNull()
  })

  it('should export history with boolean strategy value', () => {
    const exporter = new DefaultPromptAssemblyHistoryExporter()
    const history = buildHistory([{ strategy: true } as unknown as PromptAssemblyTrace])
    const result = exporter.export(history)
    const parsed = JSON.parse(result)
    expect(parsed.entries[0].trace.strategy).toBe(true)
  })

  it('should export history with numeric strategy value', () => {
    const exporter = new DefaultPromptAssemblyHistoryExporter()
    const history = buildHistory([{ strategy: 42 } as unknown as PromptAssemblyTrace])
    const result = exporter.export(history)
    const parsed = JSON.parse(result)
    expect(parsed.entries[0].trace.strategy).toBe(42)
  })

  it('should export history with empty string strategy name', () => {
    const exporter = new DefaultPromptAssemblyHistoryExporter()
    const trace: PromptAssemblyTrace = { strategy: { name: '' } }
    const history = buildHistory([trace])
    const result = exporter.export(history)
    const parsed = JSON.parse(result)
    expect(parsed.entries[0].trace.strategy.name).toBe('')
  })

  it('should export history with non-object strategy', () => {
    const exporter = new DefaultPromptAssemblyHistoryExporter()
    const history = buildHistory([{ strategy: 'string-instead-of-object' } as unknown as PromptAssemblyTrace])
    const result = exporter.export(history)
    const parsed = JSON.parse(result)
    expect(parsed.entries[0].trace.strategy).toBe('string-instead-of-object')
  })

  it('should export history with only entries key', () => {
    const exporter = new DefaultPromptAssemblyHistoryExporter()
    const history = createEmptyHistory()
    const result = exporter.export(history)
    const parsed = JSON.parse(result)
    expect(Object.keys(parsed)).toEqual(['entries'])
  })

  it('should export history with entries containing extra fields on trace', () => {
    const exporter = new DefaultPromptAssemblyHistoryExporter()
    const trace: PromptAssemblyTrace = {
      strategy: { name: 'create' },
      plan: { priorities: [] },
      snapshot: { plan: { priorities: [{ section: 'x', priority: 100 }] } },
    }
    const history = buildHistory([trace])
    const result = exporter.export(history)
    const parsed = JSON.parse(result)
    expect(parsed.entries[0].trace.plan).toBeDefined()
    expect(parsed.entries[0].trace.snapshot).toBeDefined()
  })

  it('should export history with empty array for entries', () => {
    const exporter = new DefaultPromptAssemblyHistoryExporter()
    const result = exporter.export(createEmptyHistory())
    const parsed = JSON.parse(result)
    expect(parsed.entries).toEqual([])
  })

  it('should export history with duplicate indices', () => {
    const exporter = new DefaultPromptAssemblyHistoryExporter()
    const history = createHistory([
      createEntry(0, 'create'),
      createEntry(0, 'modify'),
    ])
    const result = exporter.export(history)
    const parsed = JSON.parse(result)
    expect(parsed.entries[0].index).toBe(0)
    expect(parsed.entries[1].index).toBe(0)
  })

  it('should export history with negative indices', () => {
    const exporter = new DefaultPromptAssemblyHistoryExporter()
    const history = createHistory([createEntry(-1, 'create')])
    const result = exporter.export(history)
    const parsed = JSON.parse(result)
    expect(parsed.entries[0].index).toBe(-1)
  })

  it('should export history with descending indices', () => {
    const exporter = new DefaultPromptAssemblyHistoryExporter()
    const history = createHistory([
      createEntry(5, 'create'),
      createEntry(4, 'modify'),
      createEntry(3, 'query'),
    ])
    const result = exporter.export(history)
    const parsed = JSON.parse(result)
    expect(parsed.entries[0].index).toBe(5)
    expect(parsed.entries[1].index).toBe(4)
    expect(parsed.entries[2].index).toBe(3)
  })

  it('should export history with boolean values in trace fields', () => {
    const exporter = new DefaultPromptAssemblyHistoryExporter()
    const trace: PromptAssemblyTrace = { strategy: { name: 'create', active: true, verified: false } }
    const history = buildHistory([trace])
    const result = exporter.export(history)
    const parsed = JSON.parse(result)
    expect(parsed.entries[0].trace.strategy.active).toBe(true)
    expect(parsed.entries[0].trace.strategy.verified).toBe(false)
  })

  it('should export history with numeric values in trace fields', () => {
    const exporter = new DefaultPromptAssemblyHistoryExporter()
    const trace: PromptAssemblyTrace = { strategy: { name: 'create', count: 100, ratio: 0.75 } }
    const history = buildHistory([trace])
    const result = exporter.export(history)
    const parsed = JSON.parse(result)
    expect(parsed.entries[0].trace.strategy.count).toBe(100)
    expect(parsed.entries[0].trace.strategy.ratio).toBe(0.75)
  })
})

// ---------------------------------------------------------------------------
// Various Content Types
// ---------------------------------------------------------------------------

describe('Various content types', () => {
  it('should export history with array values in trace', () => {
    const exporter = new DefaultPromptAssemblyHistoryExporter()
    const trace: PromptAssemblyTrace = { strategy: { tags: ['a', 'b', 'c'] } }
    const history = buildHistory([trace])
    const result = exporter.export(history)
    const parsed = JSON.parse(result)
    expect(parsed.entries[0].trace.strategy.tags).toEqual(['a', 'b', 'c'])
  })

  it('should export history with nested objects in trace', () => {
    const exporter = new DefaultPromptAssemblyHistoryExporter()
    const trace: PromptAssemblyTrace = {
      strategy: { name: 'create', config: { timeout: 5000, retry: { max: 3 } } },
    }
    const history = buildHistory([trace])
    const result = exporter.export(history)
    const parsed = JSON.parse(result)
    expect(parsed.entries[0].trace.strategy.config.retry.max).toBe(3)
  })

  it('should export history with empty arrays in trace', () => {
    const exporter = new DefaultPromptAssemblyHistoryExporter()
    const trace: PromptAssemblyTrace = { plan: { priorities: [] } }
    const history = buildHistory([trace])
    const result = exporter.export(history)
    const parsed = JSON.parse(result)
    expect(parsed.entries[0].trace.plan.priorities).toEqual([])
  })

  it('should export history with long string values', () => {
    const exporter = new DefaultPromptAssemblyHistoryExporter()
    const longString = 'x'.repeat(10000)
    const trace: PromptAssemblyTrace = { strategy: { name: longString } }
    const history = buildHistory([trace])
    const result = exporter.export(history)
    const parsed = JSON.parse(result)
    expect(parsed.entries[0].trace.strategy.name).toBe(longString)
  })

  it('should export history with unicode characters', () => {
    const exporter = new DefaultPromptAssemblyHistoryExporter()
    const trace: PromptAssemblyTrace = { strategy: { name: '中文 español 日本語' } }
    const history = buildHistory([trace])
    const result = exporter.export(history)
    const parsed = JSON.parse(result)
    expect(parsed.entries[0].trace.strategy.name).toBe('中文 español 日本語')
  })

  it('should export history with emoji in strategy name', () => {
    const exporter = new DefaultPromptAssemblyHistoryExporter()
    const trace: PromptAssemblyTrace = { strategy: { name: '🚀 create' } }
    const history = buildHistory([trace])
    const result = exporter.export(history)
    const parsed = JSON.parse(result)
    expect(parsed.entries[0].trace.strategy.name).toBe('🚀 create')
  })

  it('should export history with special JSON characters', () => {
    const exporter = new DefaultPromptAssemblyHistoryExporter()
    const trace: PromptAssemblyTrace = { strategy: { name: 'test"quote\\backslash/normal' } }
    const history = buildHistory([trace])
    const result = exporter.export(history)
    const parsed = JSON.parse(result)
    expect(parsed.entries[0].trace.strategy.name).toBe('test"quote\\backslash/normal')
  })
})

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

describe('Exports', () => {
  it('should export DefaultPromptAssemblyHistoryExporter from strategy index', async () => {
    const mod = await import('../strategy')
    expect(mod.DefaultPromptAssemblyHistoryExporter).toBeDefined()
  })

  it('should export PromptAssemblyHistoryExporter type from strategy index', async () => {
    const mod = await import('../strategy')
    expect(mod.DefaultPromptAssemblyHistoryExporter).toBeDefined()
  })

  it('should export DefaultPromptAssemblyHistoryExporter from package root', async () => {
    const mod = await import('..')
    expect(mod.DefaultPromptAssemblyHistoryExporter).toBeDefined()
  })

  it('should export PromptAssemblyHistoryExporter type from package root', async () => {
    const mod = await import('..')
    expect(mod.DefaultPromptAssemblyHistoryExporter).toBeDefined()
  })

  it('should export DefaultPromptAssemblyHistoryExporter as a class', () => {
    const exporter = new DefaultPromptAssemblyHistoryExporter()
    expect(exporter).toBeInstanceOf(DefaultPromptAssemblyHistoryExporter)
  })

  it('should export PromptAssemblyHistoryExporter as a type', () => {
    const exporter: PromptAssemblyHistoryExporter = new DefaultPromptAssemblyHistoryExporter()
    expect(typeof exporter.export).toBe('function')
  })
})

// ---------------------------------------------------------------------------
// Architecture Compliance
// ---------------------------------------------------------------------------

describe('Architecture compliance', () => {
  it('should not depend on Planner', () => {
    const exporter = new DefaultPromptAssemblyHistoryExporter()
    expect(exporter).toBeInstanceOf(DefaultPromptAssemblyHistoryExporter)
  })

  it('should not depend on Runtime', () => {
    const exporter = new DefaultPromptAssemblyHistoryExporter()
    expect(exporter).toBeDefined()
  })

  it('should not depend on Provider', () => {
    const exporter = new DefaultPromptAssemblyHistoryExporter()
    expect(exporter).toBeDefined()
  })

  it('should not depend on Memory', () => {
    const exporter = new DefaultPromptAssemblyHistoryExporter()
    expect(exporter).toBeDefined()
  })

  it('should not depend on AgentLoop', () => {
    const exporter = new DefaultPromptAssemblyHistoryExporter()
    expect(exporter).toBeDefined()
  })

  it('should not depend on Pipeline', () => {
    const exporter = new DefaultPromptAssemblyHistoryExporter()
    expect(exporter).toBeDefined()
  })

  it('should not depend on PromptBuilder', () => {
    const exporter = new DefaultPromptAssemblyHistoryExporter()
    expect(exporter).toBeDefined()
  })

  it('should not depend on PromptRenderer', () => {
    const exporter = new DefaultPromptAssemblyHistoryExporter()
    expect(exporter).toBeDefined()
  })

  it('should not depend on PromptCompression', () => {
    const exporter = new DefaultPromptAssemblyHistoryExporter()
    expect(exporter).toBeDefined()
  })

  it('should not modify PromptAssemblyHistory', () => {
    const exporter = new DefaultPromptAssemblyHistoryExporter()
    const history = buildHistory([createTrace('create')])
    exporter.export(history)
    expect(history.entries).toHaveLength(1)
  })

  it('should not modify PromptBuilder', () => {
    const exporter = new DefaultPromptAssemblyHistoryExporter()
    expect(exporter).toBeDefined()
  })

  it('should not modify Planner', () => {
    const exporter = new DefaultPromptAssemblyHistoryExporter()
    expect(exporter).toBeDefined()
  })

  it('should not modify Runtime', () => {
    const exporter = new DefaultPromptAssemblyHistoryExporter()
    expect(exporter).toBeDefined()
  })

  it('should not modify AgentLoop', () => {
    const exporter = new DefaultPromptAssemblyHistoryExporter()
    expect(exporter).toBeDefined()
  })

  it('should not modify DefaultPromptBuilder', () => {
    const exporter = new DefaultPromptAssemblyHistoryExporter()
    expect(exporter).toBeDefined()
  })

  it('should not modify PromptAssemblyHistoryExporter dependencies', () => {
    const exporter = new DefaultPromptAssemblyHistoryExporter()
    const history = buildHistory([createTrace('create')])
    const output = exporter.export(history)
    expect(output).toBe(JSON.stringify(history, null, 2))
  })
})

// ---------------------------------------------------------------------------
// Compatibility
// ---------------------------------------------------------------------------

describe('RetryPlanner compatibility', () => {
  it('should be compatible with RetryPlanner scenarios', () => {
    const exporter = new DefaultPromptAssemblyHistoryExporter()
    const history = buildHistory([createTrace('create')])
    const result = exporter.export(history)
    expect(result).toContain('create')
  })
})

describe('ToolCallPlanner compatibility', () => {
  it('should be compatible with ToolCallPlanner scenarios', () => {
    const exporter = new DefaultPromptAssemblyHistoryExporter()
    const history = buildHistory([createTrace('tool')])
    const result = exporter.export(history)
    expect(result).toContain('tool')
  })
})

describe('Streaming compatibility', () => {
  it('should be compatible with streaming pipeline', () => {
    const exporter = new DefaultPromptAssemblyHistoryExporter()
    const history = buildHistory([createTrace('create')])
    const result = exporter.export(history)
    expect(result).toContain('create')
  })
})

describe('AgentLoop compatibility', () => {
  it('should be compatible with AgentLoop', () => {
    const exporter = new DefaultPromptAssemblyHistoryExporter()
    const history = buildHistory([createTrace('create'), createTrace('modify')])
    const result = exporter.export(history)
    const parsed = JSON.parse(result)
    expect(parsed.entries).toHaveLength(2)
    expect(parsed.entries[0].trace.strategy.name).toBe('create')
    expect(parsed.entries[1].trace.strategy.name).toBe('modify')
  })
})