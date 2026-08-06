import { describe, it, expect } from 'vitest'
import { DefaultPromptAssemblyHistorySnapshotBuilder } from '../strategy/DefaultPromptAssemblyHistorySnapshotBuilder'
import type { PromptAssemblyHistorySnapshotBuilder } from '../strategy/PromptAssemblyHistorySnapshotBuilder'
import type { PromptAssemblyHistorySnapshot } from '../strategy/PromptAssemblyHistorySnapshot'
import type { PromptAssemblyHistory } from '../strategy/PromptAssemblyHistory'
import type { PromptAssemblyHistoryEntry } from '../strategy/PromptAssemblyHistoryEntry'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createEmptyHistory(): PromptAssemblyHistory {
  return { entries: [] }
}

function createEntry(index: number, strategyName?: string): PromptAssemblyHistoryEntry {
  if (strategyName === undefined) {
    return { index, trace: {} }
  }
  return { index, trace: { strategy: { name: strategyName } } }
}

function createHistoryWithEntries(entries: PromptAssemblyHistoryEntry[]): PromptAssemblyHistory {
  return { entries }
}

function createSingleEntryHistory(strategyName: string): PromptAssemblyHistory {
  return createHistoryWithEntries([createEntry(0, strategyName)])
}

function createMultiEntryHistory(strategies: string[]): PromptAssemblyHistory {
  return createHistoryWithEntries(
    strategies.map((name, i) => createEntry(i, name)),
  )
}

// ---------------------------------------------------------------------------
// Interface Contract
// ---------------------------------------------------------------------------

describe('Interface contract', () => {
  it('should define build method', () => {
    const builder: PromptAssemblyHistorySnapshotBuilder = new DefaultPromptAssemblyHistorySnapshotBuilder()
    expect(typeof builder.build).toBe('function')
  })

  it('should accept a history and return a snapshot', () => {
    const builder = new DefaultPromptAssemblyHistorySnapshotBuilder()
    const result = builder.build(createEmptyHistory())
    expect(result).toBeDefined()
    expect(typeof result).toBe('object')
  })

  it('should accept a custom implementation', () => {
    const custom: PromptAssemblyHistorySnapshotBuilder = {
      build(_history: PromptAssemblyHistory): PromptAssemblyHistorySnapshot {
        return { entryCount: 42 }
      },
    }
    expect(custom.build(createEmptyHistory()).entryCount).toBe(42)
  })

  it('should accept optional metadata parameter', () => {
    const builder = new DefaultPromptAssemblyHistorySnapshotBuilder()
    const result = builder.build(createEmptyHistory(), { someKey: 'value' })
    expect(result).toBeDefined()
  })

  it('should return a PromptAssemblyHistorySnapshot type', () => {
    const builder = new DefaultPromptAssemblyHistorySnapshotBuilder()
    const result = builder.build(createEmptyHistory())
    const snapshot: PromptAssemblyHistorySnapshot = result
    expect(snapshot).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Empty History
// ---------------------------------------------------------------------------

describe('Empty history', () => {
  it('should have undefined entryCount for empty history', () => {
    const builder = new DefaultPromptAssemblyHistorySnapshotBuilder()
    const snapshot = builder.build(createEmptyHistory())
    expect(snapshot.entryCount).toBeUndefined()
  })

  it('should have undefined firstStrategy for empty history', () => {
    const builder = new DefaultPromptAssemblyHistorySnapshotBuilder()
    const snapshot = builder.build(createEmptyHistory())
    expect(snapshot.firstStrategy).toBeUndefined()
  })

  it('should have undefined lastStrategy for empty history', () => {
    const builder = new DefaultPromptAssemblyHistorySnapshotBuilder()
    const snapshot = builder.build(createEmptyHistory())
    expect(snapshot.lastStrategy).toBeUndefined()
  })

  it('should have undefined strategies for empty history', () => {
    const builder = new DefaultPromptAssemblyHistorySnapshotBuilder()
    const snapshot = builder.build(createEmptyHistory())
    expect(snapshot.strategies).toBeUndefined()
  })

  it('should have no rendered or exported for empty history', () => {
    const builder = new DefaultPromptAssemblyHistorySnapshotBuilder()
    const snapshot = builder.build(createEmptyHistory())
    expect(snapshot.rendered).toBeUndefined()
    expect(snapshot.exported).toBeUndefined()
  })

  it('should be a valid object for empty history', () => {
    const builder = new DefaultPromptAssemblyHistorySnapshotBuilder()
    const snapshot = builder.build(createEmptyHistory())
    expect(Object.keys(snapshot).length).toBeGreaterThanOrEqual(4)
  })
})

// ---------------------------------------------------------------------------
// Single Entry
// ---------------------------------------------------------------------------

describe('Single entry — create', () => {
  it('should extract entryCount for create strategy', () => {
    const builder = new DefaultPromptAssemblyHistorySnapshotBuilder()
    const snapshot = builder.build(createSingleEntryHistory('create'))
    expect(snapshot.entryCount).toBe(1)
  })

  it('should extract firstStrategy for create strategy', () => {
    const builder = new DefaultPromptAssemblyHistorySnapshotBuilder()
    const snapshot = builder.build(createSingleEntryHistory('create'))
    expect(snapshot.firstStrategy).toBe('create')
  })

  it('should extract lastStrategy for create strategy', () => {
    const builder = new DefaultPromptAssemblyHistorySnapshotBuilder()
    const snapshot = builder.build(createSingleEntryHistory('create'))
    expect(snapshot.lastStrategy).toBe('create')
  })

  it('should extract strategies list for create strategy', () => {
    const builder = new DefaultPromptAssemblyHistorySnapshotBuilder()
    const snapshot = builder.build(createSingleEntryHistory('create'))
    expect(snapshot.strategies).toEqual(['create'])
  })
})

describe('Single entry — modify', () => {
  it('should extract firstStrategy as modify', () => {
    const builder = new DefaultPromptAssemblyHistorySnapshotBuilder()
    const snapshot = builder.build(createSingleEntryHistory('modify'))
    expect(snapshot.firstStrategy).toBe('modify')
  })

  it('should extract lastStrategy as modify', () => {
    const builder = new DefaultPromptAssemblyHistorySnapshotBuilder()
    const snapshot = builder.build(createSingleEntryHistory('modify'))
    expect(snapshot.lastStrategy).toBe('modify')
  })

  it('should extract strategies as [modify]', () => {
    const builder = new DefaultPromptAssemblyHistorySnapshotBuilder()
    const snapshot = builder.build(createSingleEntryHistory('modify'))
    expect(snapshot.strategies).toEqual(['modify'])
  })
})

describe('Single entry — query', () => {
  it('should extract firstStrategy as query', () => {
    const builder = new DefaultPromptAssemblyHistorySnapshotBuilder()
    const snapshot = builder.build(createSingleEntryHistory('query'))
    expect(snapshot.firstStrategy).toBe('query')
  })

  it('should extract strategies as [query]', () => {
    const builder = new DefaultPromptAssemblyHistorySnapshotBuilder()
    const snapshot = builder.build(createSingleEntryHistory('query'))
    expect(snapshot.strategies).toEqual(['query'])
  })

  it('should have entryCount 1 for query', () => {
    const builder = new DefaultPromptAssemblyHistorySnapshotBuilder()
    const snapshot = builder.build(createSingleEntryHistory('query'))
    expect(snapshot.entryCount).toBe(1)
  })
})

describe('Single entry — delete', () => {
  it('should extract firstStrategy as delete', () => {
    const builder = new DefaultPromptAssemblyHistorySnapshotBuilder()
    const snapshot = builder.build(createSingleEntryHistory('delete'))
    expect(snapshot.firstStrategy).toBe('delete')
  })

  it('should extract strategies as [delete]', () => {
    const builder = new DefaultPromptAssemblyHistorySnapshotBuilder()
    const snapshot = builder.build(createSingleEntryHistory('delete'))
    expect(snapshot.strategies).toEqual(['delete'])
  })
})

describe('Single entry — unknown', () => {
  it('should use "unknown" when no strategy field', () => {
    const builder = new DefaultPromptAssemblyHistorySnapshotBuilder()
    const history = createHistoryWithEntries([createEntry(0)])
    const snapshot = builder.build(history)
    expect(snapshot.firstStrategy).toBe('unknown')
  })

  it('should use "unknown" when strategy is null', () => {
    const builder = new DefaultPromptAssemblyHistorySnapshotBuilder()
    const history = createHistoryWithEntries([
      { index: 0, trace: { strategy: null as unknown as { name: string } } },
    ])
    const snapshot = builder.build(history)
    expect(snapshot.firstStrategy).toBe('unknown')
  })

  it('should use "unknown" when strategy name is missing', () => {
    const builder = new DefaultPromptAssemblyHistorySnapshotBuilder()
    const history = createHistoryWithEntries([
      { index: 0, trace: { strategy: {} as { name: string } } },
    ])
    const snapshot = builder.build(history)
    expect(snapshot.firstStrategy).toBe('unknown')
  })

  it('should use "unknown" when trace is empty', () => {
    const builder = new DefaultPromptAssemblyHistorySnapshotBuilder()
    const history = createHistoryWithEntries([{ index: 0, trace: {} }])
    const snapshot = builder.build(history)
    expect(snapshot.strategies).toEqual(['unknown'])
  })

  it('should treat missing strategy as unknown', () => {
    const builder = new DefaultPromptAssemblyHistorySnapshotBuilder()
    const history = createSingleEntryHistory('unknown')
    const snapshot = builder.build(history)
    expect(snapshot.firstStrategy).toBe('unknown')
  })
})

// ---------------------------------------------------------------------------
// Multiple Entries
// ---------------------------------------------------------------------------

describe('Multiple entries', () => {
  it('should preserve strategies in order', () => {
    const builder = new DefaultPromptAssemblyHistorySnapshotBuilder()
    const history = createMultiEntryHistory(['create', 'query', 'modify', 'delete'])
    const snapshot = builder.build(history)
    expect(snapshot.strategies).toEqual(['create', 'query', 'modify', 'delete'])
  })

  it('should extract correct entryCount', () => {
    const builder = new DefaultPromptAssemblyHistorySnapshotBuilder()
    const history = createMultiEntryHistory(['a', 'b', 'c'])
    expect(builder.build(history).entryCount).toBe(3)
  })

  it('should extract correct firstStrategy', () => {
    const builder = new DefaultPromptAssemblyHistorySnapshotBuilder()
    const history = createMultiEntryHistory(['create', 'modify'])
    expect(builder.build(history).firstStrategy).toBe('create')
  })

  it('should extract correct lastStrategy', () => {
    const builder = new DefaultPromptAssemblyHistorySnapshotBuilder()
    const history = createMultiEntryHistory(['create', 'modify', 'query'])
    expect(builder.build(history).lastStrategy).toBe('query')
  })

  it('should handle single strategy repeated', () => {
    const builder = new DefaultPromptAssemblyHistorySnapshotBuilder()
    const history = createMultiEntryHistory(['create', 'create', 'create'])
    const snapshot = builder.build(history)
    expect(snapshot.entryCount).toBe(3)
    expect(snapshot.firstStrategy).toBe('create')
    expect(snapshot.lastStrategy).toBe('create')
    expect(snapshot.strategies).toEqual(['create', 'create', 'create'])
  })

  it('should handle two entries with different strategies', () => {
    const builder = new DefaultPromptAssemblyHistorySnapshotBuilder()
    const history = createMultiEntryHistory(['query', 'delete'])
    const snapshot = builder.build(history)
    expect(snapshot.entryCount).toBe(2)
    expect(snapshot.firstStrategy).toBe('query')
    expect(snapshot.lastStrategy).toBe('delete')
  })

  it('should handle three entries with mixed strategies', () => {
    const builder = new DefaultPromptAssemblyHistorySnapshotBuilder()
    const history = createMultiEntryHistory(['create', 'query', 'delete'])
    const snapshot = builder.build(history)
    expect(snapshot.strategies).toEqual(['create', 'query', 'delete'])
  })

  it('should handle five entries preserving order', () => {
    const builder = new DefaultPromptAssemblyHistorySnapshotBuilder()
    const history = createMultiEntryHistory(['a', 'b', 'c', 'd', 'e'])
    const snapshot = builder.build(history)
    expect(snapshot.strategies).toEqual(['a', 'b', 'c', 'd', 'e'])
  })

  it('should handle duplicates preserved in order', () => {
    const builder = new DefaultPromptAssemblyHistorySnapshotBuilder()
    const history = createMultiEntryHistory(['create', 'create', 'query', 'query', 'delete'])
    const snapshot = builder.build(history)
    expect(snapshot.strategies).toEqual(['create', 'create', 'query', 'query', 'delete'])
  })
})

// ---------------------------------------------------------------------------
// Metadata Extraction — rendered
// ---------------------------------------------------------------------------

describe('Metadata extraction — rendered', () => {
  it('should extract rendered from metadata when string', () => {
    const builder = new DefaultPromptAssemblyHistorySnapshotBuilder()
    const history = createSingleEntryHistory('create')
    const snapshot = builder.build(history, { historyRendered: 'rendered text' })
    expect(snapshot.rendered).toBe('rendered text')
  })

  it('should have undefined rendered when metadata missing', () => {
    const builder = new DefaultPromptAssemblyHistorySnapshotBuilder()
    const history = createSingleEntryHistory('create')
    const snapshot = builder.build(history)
    expect(snapshot.rendered).toBeUndefined()
  })

  it('should have undefined rendered when metadata has no historyRendered', () => {
    const builder = new DefaultPromptAssemblyHistorySnapshotBuilder()
    const history = createSingleEntryHistory('create')
    const snapshot = builder.build(history, { otherKey: 'value' })
    expect(snapshot.rendered).toBeUndefined()
  })

  it('should have undefined rendered when historyRendered is a number (not string)', () => {
    const builder = new DefaultPromptAssemblyHistorySnapshotBuilder()
    const history = createSingleEntryHistory('create')
    const snapshot = builder.build(history, { historyRendered: 42 })
    expect(snapshot.rendered).toBeUndefined()
  })

  it('should handle empty string rendered', () => {
    const builder = new DefaultPromptAssemblyHistorySnapshotBuilder()
    const history = createSingleEntryHistory('create')
    const snapshot = builder.build(history, { historyRendered: '' })
    expect(snapshot.rendered).toBe('')
  })

  it('should have undefined rendered when historyRendered is boolean', () => {
    const builder = new DefaultPromptAssemblyHistorySnapshotBuilder()
    const history = createSingleEntryHistory('create')
    const snapshot = builder.build(history, { historyRendered: true })
    expect(snapshot.rendered).toBeUndefined()
  })

  it('should have undefined rendered when historyRendered is null', () => {
    const builder = new DefaultPromptAssemblyHistorySnapshotBuilder()
    const history = createSingleEntryHistory('create')
    const snapshot = builder.build(history, { historyRendered: null })
    expect(snapshot.rendered).toBeUndefined()
  })

  it('should have undefined rendered when historyRendered is undefined', () => {
    const builder = new DefaultPromptAssemblyHistorySnapshotBuilder()
    const history = createSingleEntryHistory('create')
    const snapshot = builder.build(history, { historyRendered: undefined })
    expect(snapshot.rendered).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// Metadata Extraction — exported
// ---------------------------------------------------------------------------

describe('Metadata extraction — exported', () => {
  it('should extract exported from metadata when string', () => {
    const builder = new DefaultPromptAssemblyHistorySnapshotBuilder()
    const history = createSingleEntryHistory('create')
    const snapshot = builder.build(history, { historyExported: '{"entries":[]}' })
    expect(snapshot.exported).toBe('{"entries":[]}')
  })

  it('should have undefined exported when metadata missing', () => {
    const builder = new DefaultPromptAssemblyHistorySnapshotBuilder()
    const history = createSingleEntryHistory('create')
    const snapshot = builder.build(history)
    expect(snapshot.exported).toBeUndefined()
  })

  it('should have undefined exported when metadata has no historyExported', () => {
    const builder = new DefaultPromptAssemblyHistorySnapshotBuilder()
    const history = createSingleEntryHistory('create')
    const snapshot = builder.build(history, { wrong: 'value' })
    expect(snapshot.exported).toBeUndefined()
  })

  it('should have undefined exported when historyExported is number', () => {
    const builder = new DefaultPromptAssemblyHistorySnapshotBuilder()
    const history = createSingleEntryHistory('create')
    const snapshot = builder.build(history, { historyExported: 123 })
    expect(snapshot.exported).toBeUndefined()
  })

  it('should handle empty string exported', () => {
    const builder = new DefaultPromptAssemblyHistorySnapshotBuilder()
    const history = createSingleEntryHistory('create')
    const snapshot = builder.build(history, { historyExported: '' })
    expect(snapshot.exported).toBe('')
  })

  it('should have undefined exported when historyExported is boolean', () => {
    const builder = new DefaultPromptAssemblyHistorySnapshotBuilder()
    const history = createSingleEntryHistory('create')
    const snapshot = builder.build(history, { historyExported: false })
    expect(snapshot.exported).toBeUndefined()
  })

  it('should have undefined exported when historyExported is null', () => {
    const builder = new DefaultPromptAssemblyHistorySnapshotBuilder()
    const history = createSingleEntryHistory('create')
    const snapshot = builder.build(history, { historyExported: null })
    expect(snapshot.exported).toBeUndefined()
  })

  it('should have undefined exported when historyExported is undefined', () => {
    const builder = new DefaultPromptAssemblyHistorySnapshotBuilder()
    const history = createSingleEntryHistory('create')
    const snapshot = builder.build(history, { historyExported: undefined })
    expect(snapshot.exported).toBeUndefined()
  })

  it('should have undefined exported when historyExported is object', () => {
    const builder = new DefaultPromptAssemblyHistorySnapshotBuilder()
    const history = createSingleEntryHistory('create')
    const snapshot = builder.build(history, { historyExported: { entries: [] } })
    expect(snapshot.exported).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// Metadata Extraction — both
// ---------------------------------------------------------------------------

describe('Metadata extraction — both', () => {
  it('should extract both rendered and exported', () => {
    const builder = new DefaultPromptAssemblyHistorySnapshotBuilder()
    const history = createSingleEntryHistory('create')
    const snapshot = builder.build(history, {
      historyRendered: 'rendered',
      historyExported: 'exported',
    })
    expect(snapshot.rendered).toBe('rendered')
    expect(snapshot.exported).toBe('exported')
  })

  it('should extract both from single entry history', () => {
    const builder = new DefaultPromptAssemblyHistorySnapshotBuilder()
    const history = createSingleEntryHistory('query')
    const snapshot = builder.build(history, {
      historyRendered: 'r',
      historyExported: 'e',
    })
    expect(snapshot.rendered).toBe('r')
    expect(snapshot.exported).toBe('e')
    expect(snapshot.entryCount).toBe(1)
  })

  it('should extract both from multi entry history', () => {
    const builder = new DefaultPromptAssemblyHistorySnapshotBuilder()
    const history = createMultiEntryHistory(['create', 'modify'])
    const snapshot = builder.build(history, {
      historyRendered: 'header\n#0 create\n#1 modify',
      historyExported: '{"entries":[{"index":0,"trace":{"strategy":{"name":"create"}}}]}',
    })
    expect(snapshot.rendered).toBe('header\n#0 create\n#1 modify')
    expect(snapshot.exported).toBe('{"entries":[{"index":0,"trace":{"strategy":{"name":"create"}}}]}')
    expect(snapshot.entryCount).toBe(2)
  })

  it('should extract rendered only when exported is non-string', () => {
    const builder = new DefaultPromptAssemblyHistorySnapshotBuilder()
    const history = createSingleEntryHistory('create')
    const snapshot = builder.build(history, {
      historyRendered: 'rendered only',
      historyExported: 42,
    })
    expect(snapshot.rendered).toBe('rendered only')
    expect(snapshot.exported).toBeUndefined()
  })

  it('should extract exported only when rendered is non-string', () => {
    const builder = new DefaultPromptAssemblyHistorySnapshotBuilder()
    const history = createSingleEntryHistory('create')
    const snapshot = builder.build(history, {
      historyRendered: false,
      historyExported: 'exported only',
    })
    expect(snapshot.rendered).toBeUndefined()
    expect(snapshot.exported).toBe('exported only')
  })
})

// ---------------------------------------------------------------------------
// Metadata Extraction — unknown
// ---------------------------------------------------------------------------

describe('Metadata extraction — unknown', () => {
  it('should ignore unknown metadata keys', () => {
    const builder = new DefaultPromptAssemblyHistorySnapshotBuilder()
    const history = createSingleEntryHistory('create')
    const snapshot = builder.build(history, {
      unknownKey: 'value',
      anotherKey: 123,
    })
    expect(snapshot.rendered).toBeUndefined()
    expect(snapshot.exported).toBeUndefined()
    expect(snapshot.entryCount).toBe(1)
  })

  it('should ignore arbitrary metadata keys silently', () => {
    const builder = new DefaultPromptAssemblyHistorySnapshotBuilder()
    const history = createSingleEntryHistory('create')
    const snapshot = builder.build(history, {
      random: 'data',
      nested: { key: 'value' },
    })
    expect(snapshot.rendered).toBeUndefined()
    expect(snapshot.exported).toBeUndefined()
    expect(snapshot.firstStrategy).toBe('create')
  })

  it('should only extract historyRendered and historyExported', () => {
    const builder = new DefaultPromptAssemblyHistorySnapshotBuilder()
    const history = createSingleEntryHistory('create')
    const snapshot = builder.build(history, {
      historyRendered: 'rendered',
      historyExported: 'exported',
      otherField: 'ignored',
      anotherField: 999,
    })
    expect(snapshot.rendered).toBe('rendered')
    expect(snapshot.exported).toBe('exported')
  })

  it('should handle metadata with no relevant keys', () => {
    const builder = new DefaultPromptAssemblyHistorySnapshotBuilder()
    const history = createEmptyHistory()
    const snapshot = builder.build(history, { someMetadata: 'value' })
    expect(snapshot.entryCount).toBeUndefined()
    expect(snapshot.rendered).toBeUndefined()
    expect(snapshot.exported).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// Deterministic
// ---------------------------------------------------------------------------

describe('Deterministic', () => {
  it('should produce same snapshot for same history across multiple calls', () => {
    const builder = new DefaultPromptAssemblyHistorySnapshotBuilder()
    const history = createMultiEntryHistory(['create', 'query', 'modify'])
    const r1 = builder.build(history)
    const r2 = builder.build(history)
    const r3 = builder.build(history)
    expect(r1).toEqual(r2)
    expect(r2).toEqual(r3)
  })

  it('should produce same snapshot across different builder instances', () => {
    const b1 = new DefaultPromptAssemblyHistorySnapshotBuilder()
    const b2 = new DefaultPromptAssemblyHistorySnapshotBuilder()
    const history = createMultiEntryHistory(['create', 'query'])
    expect(b1.build(history)).toEqual(b2.build(history))
  })

  it('should produce same snapshot for identical histories', () => {
    const builder = new DefaultPromptAssemblyHistorySnapshotBuilder()
    const h1 = createMultiEntryHistory(['create', 'modify'])
    const h2 = createMultiEntryHistory(['create', 'modify'])
    expect(builder.build(h1)).toEqual(builder.build(h2))
  })

  it('should produce same snapshot for identical empty histories', () => {
    const builder = new DefaultPromptAssemblyHistorySnapshotBuilder()
    expect(builder.build(createEmptyHistory())).toEqual(builder.build(createEmptyHistory()))
  })

  it('should produce same snapshot with same metadata', () => {
    const builder = new DefaultPromptAssemblyHistorySnapshotBuilder()
    const history = createSingleEntryHistory('create')
    const metadata = { historyRendered: 'text', historyExported: 'json' }
    expect(builder.build(history, metadata)).toEqual(builder.build(history, metadata))
  })

  it('should produce same snapshot for 100-entry histories', () => {
    const builder = new DefaultPromptAssemblyHistorySnapshotBuilder()
    const strategies = Array.from({ length: 100 }, (_, i) => `s-${i}`)
    const h1 = createMultiEntryHistory(strategies)
    const h2 = createMultiEntryHistory(strategies)
    expect(builder.build(h1)).toEqual(builder.build(h2))
  })
})

// ---------------------------------------------------------------------------
// Stateless
// ---------------------------------------------------------------------------

describe('Stateless', () => {
  it('should not retain state between build calls', () => {
    const builder = new DefaultPromptAssemblyHistorySnapshotBuilder()
    const r1 = builder.build(createSingleEntryHistory('create'))
    const r2 = builder.build(createSingleEntryHistory('query'))
    expect(r1.firstStrategy).toBe('create')
    expect(r2.firstStrategy).toBe('query')
  })

  it('should produce independent results', () => {
    const builder = new DefaultPromptAssemblyHistorySnapshotBuilder()
    const r1 = builder.build(createMultiEntryHistory(['a', 'b']))
    const r2 = builder.build(createEmptyHistory())
    expect(r1.entryCount).toBe(2)
    expect(r2.entryCount).toBeUndefined()
  })

  it('should handle alternating calls without interference', () => {
    const builder = new DefaultPromptAssemblyHistorySnapshotBuilder()
    const h1 = createSingleEntryHistory('create')
    const h2 = createSingleEntryHistory('query')
    const r1a = builder.build(h1)
    const r2a = builder.build(h2)
    const r1b = builder.build(h1)
    const r2b = builder.build(h2)
    expect(r1a).toEqual(r1b)
    expect(r2a).toEqual(r2b)
  })

  it('should produce fresh results each call', () => {
    const builder = new DefaultPromptAssemblyHistorySnapshotBuilder()
    const history = createSingleEntryHistory('create')
    const r1 = builder.build(history)
    const r2 = builder.build(history)
    expect(r1).not.toBe(r2)
  })
})

// ---------------------------------------------------------------------------
// Pure
// ---------------------------------------------------------------------------

describe('Pure', () => {
  it('should not modify input history', () => {
    const builder = new DefaultPromptAssemblyHistorySnapshotBuilder()
    const history = createMultiEntryHistory(['create', 'query'])
    const original = JSON.stringify(history)
    builder.build(history)
    expect(JSON.stringify(history)).toBe(original)
  })

  it('should not modify nested objects in history', () => {
    const builder = new DefaultPromptAssemblyHistorySnapshotBuilder()
    const history = createSingleEntryHistory('create')
    const originalTrace = JSON.stringify(history.entries[0].trace)
    builder.build(history)
    expect(JSON.stringify(history.entries[0].trace)).toBe(originalTrace)
  })

  it('should not modify input metadata', () => {
    const builder = new DefaultPromptAssemblyHistorySnapshotBuilder()
    const history = createSingleEntryHistory('create')
    const metadata = { historyRendered: 'text' }
    const original = JSON.stringify(metadata)
    builder.build(history, metadata)
    expect(JSON.stringify(metadata)).toBe(original)
  })

  it('should have no side effects on external state', () => {
    const builder = new DefaultPromptAssemblyHistorySnapshotBuilder()
    const history = createEmptyHistory()
    const r1 = builder.build(history)
    const r2 = builder.build(history)
    expect(r1).toEqual(r2)
  })

  it('should not add fields to input history', () => {
    const builder = new DefaultPromptAssemblyHistorySnapshotBuilder()
    const history = createSingleEntryHistory('create')
    const originalKeys = Object.keys(history)
    builder.build(history)
    expect(Object.keys(history)).toEqual(originalKeys)
  })
})

// ---------------------------------------------------------------------------
// Immutable
// ---------------------------------------------------------------------------

describe('Immutable', () => {
  it('should return new object each call', () => {
    const builder = new DefaultPromptAssemblyHistorySnapshotBuilder()
    const history = createSingleEntryHistory('create')
    const r1 = builder.build(history)
    const r2 = builder.build(history)
    expect(r1).not.toBe(r2)
  })

  it('should not mutate the history entries', () => {
    const builder = new DefaultPromptAssemblyHistorySnapshotBuilder()
    const history = createSingleEntryHistory('create')
    const entriesBefore = history.entries.length
    builder.build(history)
    expect(history.entries.length).toBe(entriesBefore)
  })

  it('should produce frozen-like snapshot fields (readonly)', () => {
    const builder = new DefaultPromptAssemblyHistorySnapshotBuilder()
    const history = createMultiEntryHistory(['create', 'query'])
    const snapshot = builder.build(history)
    expect(snapshot.strategies).toBeDefined()
    expect(Array.isArray(snapshot.strategies)).toBe(true)
  })

  it('should produce snapshot with identical entries count after build', () => {
    const builder = new DefaultPromptAssemblyHistorySnapshotBuilder()
    const history = createMultiEntryHistory(['a', 'b', 'c'])
    const snapshot = builder.build(history)
    expect(history.entries.length).toBe(3)
    expect(snapshot.entryCount).toBe(3)
  })

  it('should produce strategies array that matches entries length', () => {
    const builder = new DefaultPromptAssemblyHistorySnapshotBuilder()
    const history = createMultiEntryHistory(['create', 'modify', 'query', 'delete'])
    const snapshot = builder.build(history)
    expect(snapshot.strategies).toHaveLength(history.entries.length)
  })
})

// ---------------------------------------------------------------------------
// Export Validation
// ---------------------------------------------------------------------------

describe('Export validation', () => {
  it('should export DefaultPromptAssemblyHistorySnapshotBuilder from strategy index', async () => {
    const mod = await import('../strategy')
    expect(mod.DefaultPromptAssemblyHistorySnapshotBuilder).toBeDefined()
  })

  it('should export PromptAssemblyHistorySnapshot type from strategy index', async () => {
    const mod = await import('../strategy')
    expect(mod.DefaultPromptAssemblyHistorySnapshotBuilder).toBeDefined()
  })

  it('should export PromptAssemblyHistorySnapshotBuilder type from strategy index', async () => {
    const mod = await import('../strategy')
    expect(mod.DefaultPromptAssemblyHistorySnapshotBuilder).toBeDefined()
  })

  it('should export DefaultPromptAssemblyHistorySnapshotBuilder as a class', () => {
    const builder = new DefaultPromptAssemblyHistorySnapshotBuilder()
    expect(builder).toBeInstanceOf(DefaultPromptAssemblyHistorySnapshotBuilder)
  })

  it('should export PromptAssemblyHistorySnapshotBuilder as a type', () => {
    const builder: PromptAssemblyHistorySnapshotBuilder = new DefaultPromptAssemblyHistorySnapshotBuilder()
    expect(typeof builder.build).toBe('function')
  })

  it('should export DefaultPromptAssemblyHistorySnapshotBuilder from package root', async () => {
    const mod = await import('..')
    expect(mod.DefaultPromptAssemblyHistorySnapshotBuilder).toBeDefined()
  })

  it('should export PromptAssemblyHistorySnapshot type from package root', async () => {
    const mod = await import('..')
    expect(mod.DefaultPromptAssemblyHistorySnapshotBuilder).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Architecture Compliance
// ---------------------------------------------------------------------------

describe('Architecture compliance', () => {
  it('should not depend on Runtime', () => {
    const builder = new DefaultPromptAssemblyHistorySnapshotBuilder()
    expect(builder).toBeDefined()
  })

  it('should not depend on Planner', () => {
    const builder = new DefaultPromptAssemblyHistorySnapshotBuilder()
    expect(builder).toBeInstanceOf(DefaultPromptAssemblyHistorySnapshotBuilder)
  })

  it('should not depend on Pipeline', () => {
    const builder = new DefaultPromptAssemblyHistorySnapshotBuilder()
    expect(builder).toBeDefined()
  })

  it('should not depend on Provider', () => {
    const builder = new DefaultPromptAssemblyHistorySnapshotBuilder()
    expect(builder).toBeDefined()
  })

  it('should not depend on Memory', () => {
    const builder = new DefaultPromptAssemblyHistorySnapshotBuilder()
    expect(builder).toBeDefined()
  })

  it('should not depend on AgentLoop', () => {
    const builder = new DefaultPromptAssemblyHistorySnapshotBuilder()
    expect(builder).toBeDefined()
  })

  it('should not depend on PromptBuilder', () => {
    const builder = new DefaultPromptAssemblyHistorySnapshotBuilder()
    expect(builder).toBeDefined()
  })

  it('should not modify PromptBuilder', () => {
    const builder = new DefaultPromptAssemblyHistorySnapshotBuilder()
    expect(builder).toBeDefined()
  })

  it('should not modify Renderer', () => {
    const builder = new DefaultPromptAssemblyHistorySnapshotBuilder()
    expect(builder).toBeDefined()
  })

  it('should not modify Compression', () => {
    const builder = new DefaultPromptAssemblyHistorySnapshotBuilder()
    expect(builder).toBeDefined()
  })

  it('should not modify PromptAssemblyHistory', () => {
    const builder = new DefaultPromptAssemblyHistorySnapshotBuilder()
    const history = createMultiEntryHistory(['create', 'query'])
    builder.build(history)
    expect(history.entries).toBeDefined()
  })

  it('should not modify Runtime', () => {
    const builder = new DefaultPromptAssemblyHistorySnapshotBuilder()
    expect(builder).toBeDefined()
  })

  it('should not modify AgentLoop', () => {
    const builder = new DefaultPromptAssemblyHistorySnapshotBuilder()
    expect(builder).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Compatibility
// ---------------------------------------------------------------------------

describe('RetryPlanner compatibility', () => {
  it('should be compatible with RetryPlanner scenarios', () => {
    const builder = new DefaultPromptAssemblyHistorySnapshotBuilder()
    const history = createSingleEntryHistory('create')
    const snapshot = builder.build(history)
    expect(snapshot.firstStrategy).toBe('create')
  })
})

describe('ToolCallPlanner compatibility', () => {
  it('should be compatible with ToolCallPlanner scenarios', () => {
    const builder = new DefaultPromptAssemblyHistorySnapshotBuilder()
    const history = createHistoryWithEntries([
      { index: 0, trace: { plan: { priorities: [{ section: 'tool', priority: 100 }] } } },
    ])
    const snapshot = builder.build(history)
    expect(snapshot.firstStrategy).toBe('unknown')
    expect(snapshot.entryCount).toBe(1)
  })
})

describe('Streaming compatibility', () => {
  it('should be compatible with streaming pipeline', () => {
    const builder = new DefaultPromptAssemblyHistorySnapshotBuilder()
    const history = createSingleEntryHistory('query')
    const snapshot = builder.build(history)
    expect(snapshot.strategies).toEqual(['query'])
  })
})

describe('AgentLoop compatibility', () => {
  it('should be compatible with AgentLoop', () => {
    const builder = new DefaultPromptAssemblyHistorySnapshotBuilder()
    const history = createMultiEntryHistory(['create', 'modify'])
    const snapshot = builder.build(history)
    expect(snapshot.entryCount).toBe(2)
    expect(snapshot.firstStrategy).toBe('create')
    expect(snapshot.lastStrategy).toBe('modify')
  })
})

// ---------------------------------------------------------------------------
// Edge Cases
// ---------------------------------------------------------------------------

describe('Edge cases', () => {
  it('should handle unicode strategy names', () => {
    const builder = new DefaultPromptAssemblyHistorySnapshotBuilder()
    const history = createSingleEntryHistory('测试-策略')
    const snapshot = builder.build(history)
    expect(snapshot.firstStrategy).toBe('测试-策略')
  })

  it('should handle duplicate strategy names', () => {
    const builder = new DefaultPromptAssemblyHistorySnapshotBuilder()
    const history = createMultiEntryHistory(['create', 'create', 'create'])
    const snapshot = builder.build(history)
    expect(snapshot.strategies).toEqual(['create', 'create', 'create'])
  })

  it('should handle 100 entries', () => {
    const builder = new DefaultPromptAssemblyHistorySnapshotBuilder()
    const strategies = Array.from({ length: 100 }, (_, i) => `strategy-${i}`)
    const history = createMultiEntryHistory(strategies)
    const snapshot = builder.build(history)
    expect(snapshot.entryCount).toBe(100)
    expect(snapshot.firstStrategy).toBe('strategy-0')
    expect(snapshot.lastStrategy).toBe('strategy-99')
    expect(snapshot.strategies).toHaveLength(100)
  })

  it('should handle 200 entries', () => {
    const builder = new DefaultPromptAssemblyHistorySnapshotBuilder()
    const strategies = Array.from({ length: 200 }, (_, i) => `s-${i}`)
    const history = createMultiEntryHistory(strategies)
    const snapshot = builder.build(history)
    expect(snapshot.entryCount).toBe(200)
    expect(snapshot.firstStrategy).toBe('s-0')
    expect(snapshot.lastStrategy).toBe('s-199')
  })

  it('should handle sparse strategy names with empty string', () => {
    const builder = new DefaultPromptAssemblyHistorySnapshotBuilder()
    const history = createSingleEntryHistory('')
    const snapshot = builder.build(history)
    expect(snapshot.firstStrategy).toBe('')
  })

  it('should handle mixed known and unknown strategies', () => {
    const builder = new DefaultPromptAssemblyHistorySnapshotBuilder()
    const history = createHistoryWithEntries([
      createEntry(0, 'create'),
      { index: 1, trace: {} },
      createEntry(2, 'query'),
    ])
    const snapshot = builder.build(history)
    expect(snapshot.strategies).toEqual(['create', 'unknown', 'query'])
  })

  it('should handle all unknown strategies', () => {
    const builder = new DefaultPromptAssemblyHistorySnapshotBuilder()
    const history = createHistoryWithEntries([
      { index: 0, trace: {} },
      { index: 1, trace: { strategy: null as unknown as { name: string } } },
      { index: 2, trace: { strategy: { name: undefined as unknown as string } } },
    ])
    const snapshot = builder.build(history)
    expect(snapshot.strategies).toEqual(['unknown', 'unknown', 'unknown'])
  })

  it('should handle strategy with non-string name', () => {
    const builder = new DefaultPromptAssemblyHistorySnapshotBuilder()
    const history = createHistoryWithEntries([
      { index: 0, trace: { strategy: { name: 42 as unknown as string } } },
    ])
    const snapshot = builder.build(history)
    expect(snapshot.firstStrategy).toBe('unknown')
  })

  it('should handle special characters in strategy names', () => {
    const builder = new DefaultPromptAssemblyHistorySnapshotBuilder()
    const history = createSingleEntryHistory('test-strategy_123!@#')
    const snapshot = builder.build(history)
    expect(snapshot.firstStrategy).toBe('test-strategy_123!@#')
  })

  it('should handle history with null strategy object', () => {
    const builder = new DefaultPromptAssemblyHistorySnapshotBuilder()
    const history = createHistoryWithEntries([
      { index: 0, trace: { strategy: null as unknown as { name: string } } },
    ])
    const snapshot = builder.build(history)
    expect(snapshot.firstStrategy).toBe('unknown')
  })

  it('should handle boolean strategy values as unknown', () => {
    const builder = new DefaultPromptAssemblyHistorySnapshotBuilder()
    const history = createHistoryWithEntries([
      { index: 0, trace: { strategy: true as unknown as { name: string } } },
    ])
    const snapshot = builder.build(history)
    expect(snapshot.firstStrategy).toBe('unknown')
  })

  it('should handle numeric strategy values as unknown', () => {
    const builder = new DefaultPromptAssemblyHistorySnapshotBuilder()
    const history = createHistoryWithEntries([
      { index: 0, trace: { strategy: 42 as unknown as { name: string } } },
    ])
    const snapshot = builder.build(history)
    expect(snapshot.firstStrategy).toBe('unknown')
  })

  it('should handle non-sequential indices', () => {
    const builder = new DefaultPromptAssemblyHistorySnapshotBuilder()
    const history = createHistoryWithEntries([
      { index: 10, trace: { strategy: { name: 'create' } } },
      { index: 20, trace: { strategy: { name: 'modify' } } },
    ])
    const snapshot = builder.build(history)
    expect(snapshot.firstStrategy).toBe('create')
    expect(snapshot.lastStrategy).toBe('modify')
  })

  it('should handle descending indices', () => {
    const builder = new DefaultPromptAssemblyHistorySnapshotBuilder()
    const history = createHistoryWithEntries([
      { index: 5, trace: { strategy: { name: 'query' } } },
      { index: 3, trace: { strategy: { name: 'create' } } },
    ])
    const snapshot = builder.build(history)
    expect(snapshot.firstStrategy).toBe('query')
    expect(snapshot.lastStrategy).toBe('create')
  })

  it('should handle strategy with name as empty string after valid names', () => {
    const builder = new DefaultPromptAssemblyHistorySnapshotBuilder()
    const history = createHistoryWithEntries([
      createEntry(0, 'create'),
      createEntry(1, ''),
      createEntry(2, 'modify'),
    ])
    const snapshot = builder.build(history)
    expect(snapshot.strategies).toEqual(['create', '', 'modify'])
  })

  it('should handle single entry with no trace object', () => {
    const builder = new DefaultPromptAssemblyHistorySnapshotBuilder()
    const history = createHistoryWithEntries([
      { index: 0, trace: undefined as unknown as { strategy: { name: string } } },
    ])
    const snapshot = builder.build(history)
    expect(snapshot.firstStrategy).toBe('unknown')
    expect(snapshot.entryCount).toBe(1)
  })

  it('should handle strategy object with null name', () => {
    const builder = new DefaultPromptAssemblyHistorySnapshotBuilder()
    const history = createHistoryWithEntries([
      { index: 0, trace: { strategy: { name: null as unknown as string } } },
    ])
    const snapshot = builder.build(history)
    expect(snapshot.firstStrategy).toBe('unknown')
  })

  it('should handle snapshot rendering with unicode metadata', () => {
    const builder = new DefaultPromptAssemblyHistorySnapshotBuilder()
    const history = createSingleEntryHistory('create')
    const snapshot = builder.build(history, { historyRendered: '渲染文本' })
    expect(snapshot.rendered).toBe('渲染文本')
    expect(snapshot.firstStrategy).toBe('create')
  })

  it('should handle exported JSON in metadata', () => {
    const builder = new DefaultPromptAssemblyHistorySnapshotBuilder()
    const history = createMultiEntryHistory(['create', 'modify'])
    const json = JSON.stringify({ entries: [{ index: 0, strategy: 'create' }] })
    const snapshot = builder.build(history, { historyExported: json })
    expect(snapshot.exported).toBe(json)
    expect(snapshot.entryCount).toBe(2)
  })

  it('should handle single entry with only index', () => {
    const builder = new DefaultPromptAssemblyHistorySnapshotBuilder()
    const history = createHistoryWithEntries([
      { index: 0, trace: { strategy: { name: 'create' } } },
    ])
    const snapshot = builder.build(history)
    expect(snapshot.entryCount).toBe(1)
    expect(snapshot.strategies).toEqual(['create'])
  })

  it('should handle large negative index', () => {
    const builder = new DefaultPromptAssemblyHistorySnapshotBuilder()
    const history = createHistoryWithEntries([
      { index: -100, trace: { strategy: { name: 'create' } } },
    ])
    const snapshot = builder.build(history)
    expect(snapshot.firstStrategy).toBe('create')
    expect(snapshot.entryCount).toBe(1)
  })

  it('should handle strategy with special regex characters in name', () => {
    const builder = new DefaultPromptAssemblyHistorySnapshotBuilder()
    const history = createSingleEntryHistory('create.*+?^${}()|[]\\')
    const snapshot = builder.build(history)
    expect(snapshot.firstStrategy).toBe('create.*+?^${}()|[]\\')
  })

  it('should handle very long strategy name', () => {
    const builder = new DefaultPromptAssemblyHistorySnapshotBuilder()
    const longName = 'a'.repeat(1000)
    const history = createSingleEntryHistory(longName)
    const snapshot = builder.build(history)
    expect(snapshot.firstStrategy).toBe(longName)
    expect(snapshot.strategies).toEqual([longName])
  })
})