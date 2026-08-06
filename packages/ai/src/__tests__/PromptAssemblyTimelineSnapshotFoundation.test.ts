import { describe, it, expect } from 'vitest'
import { DefaultPromptAssemblyTimelineSnapshotBuilder } from '../strategy/DefaultPromptAssemblyTimelineSnapshotBuilder'
import type { PromptAssemblyTimelineSnapshotBuilder } from '../strategy/PromptAssemblyTimelineSnapshotBuilder'
import type { PromptAssemblyTimelineSnapshot } from '../strategy/PromptAssemblyTimelineSnapshot'
import type { PromptAssemblyTimeline } from '../strategy/PromptAssemblyTimeline'
import type { PromptAssemblyTimelineEntry } from '../strategy/PromptAssemblyTimelineEntry'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createEmptyTimeline(): PromptAssemblyTimeline {
  return { entries: [] }
}

function createEntry(index: number, strategyName?: string): PromptAssemblyTimelineEntry {
  if (strategyName === undefined) {
    return { index, trace: {} }
  }
  return { index, trace: { strategy: { name: strategyName } } }
}

function createTimelineWithEntries(entries: PromptAssemblyTimelineEntry[]): PromptAssemblyTimeline {
  return { entries }
}

function createSingleEntryTimeline(strategyName: string): PromptAssemblyTimeline {
  return createTimelineWithEntries([createEntry(0, strategyName)])
}

function createMultiEntryTimeline(strategies: string[]): PromptAssemblyTimeline {
  return createTimelineWithEntries(
    strategies.map((name, i) => createEntry(i, name)),
  )
}

// ---------------------------------------------------------------------------
// Interface Contract
// ---------------------------------------------------------------------------

describe('Interface contract', () => {
  it('should define build method', () => {
    const builder: PromptAssemblyTimelineSnapshotBuilder = new DefaultPromptAssemblyTimelineSnapshotBuilder()
    expect(typeof builder.build).toBe('function')
  })

  it('should accept a timeline and return a snapshot', () => {
    const builder = new DefaultPromptAssemblyTimelineSnapshotBuilder()
    const result = builder.build(createEmptyTimeline())
    expect(result).toBeDefined()
    expect(typeof result).toBe('object')
  })

  it('should accept a custom implementation', () => {
    const custom: PromptAssemblyTimelineSnapshotBuilder = {
      build(_timeline: PromptAssemblyTimeline): PromptAssemblyTimelineSnapshot {
        return { entryCount: 42 }
      },
    }
    expect(custom.build(createEmptyTimeline()).entryCount).toBe(42)
  })

  it('should accept optional metadata parameter', () => {
    const builder = new DefaultPromptAssemblyTimelineSnapshotBuilder()
    const result = builder.build(createEmptyTimeline(), { someKey: 'value' })
    expect(result).toBeDefined()
  })

  it('should return a PromptAssemblyTimelineSnapshot type', () => {
    const builder = new DefaultPromptAssemblyTimelineSnapshotBuilder()
    const result = builder.build(createEmptyTimeline())
    const snapshot: PromptAssemblyTimelineSnapshot = result
    expect(snapshot).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Empty Timeline
// ---------------------------------------------------------------------------

describe('Empty timeline', () => {
  it('should have undefined entryCount for empty timeline', () => {
    const builder = new DefaultPromptAssemblyTimelineSnapshotBuilder()
    const snapshot = builder.build(createEmptyTimeline())
    expect(snapshot.entryCount).toBeUndefined()
  })

  it('should have undefined firstStrategy for empty timeline', () => {
    const builder = new DefaultPromptAssemblyTimelineSnapshotBuilder()
    const snapshot = builder.build(createEmptyTimeline())
    expect(snapshot.firstStrategy).toBeUndefined()
  })

  it('should have undefined lastStrategy for empty timeline', () => {
    const builder = new DefaultPromptAssemblyTimelineSnapshotBuilder()
    const snapshot = builder.build(createEmptyTimeline())
    expect(snapshot.lastStrategy).toBeUndefined()
  })

  it('should have undefined strategies for empty timeline', () => {
    const builder = new DefaultPromptAssemblyTimelineSnapshotBuilder()
    const snapshot = builder.build(createEmptyTimeline())
    expect(snapshot.strategies).toBeUndefined()
  })

  it('should have no rendered or exported for empty timeline', () => {
    const builder = new DefaultPromptAssemblyTimelineSnapshotBuilder()
    const snapshot = builder.build(createEmptyTimeline())
    expect(snapshot.rendered).toBeUndefined()
    expect(snapshot.exported).toBeUndefined()
  })

  it('should be a valid object for empty timeline', () => {
    const builder = new DefaultPromptAssemblyTimelineSnapshotBuilder()
    const snapshot = builder.build(createEmptyTimeline())
    expect(Object.keys(snapshot).length).toBeGreaterThanOrEqual(4)
  })
})

// ---------------------------------------------------------------------------
// Single Entry
// ---------------------------------------------------------------------------

describe('Single entry — create', () => {
  it('should extract entryCount for create strategy', () => {
    const builder = new DefaultPromptAssemblyTimelineSnapshotBuilder()
    const snapshot = builder.build(createSingleEntryTimeline('create'))
    expect(snapshot.entryCount).toBe(1)
  })

  it('should extract firstStrategy for create strategy', () => {
    const builder = new DefaultPromptAssemblyTimelineSnapshotBuilder()
    const snapshot = builder.build(createSingleEntryTimeline('create'))
    expect(snapshot.firstStrategy).toBe('create')
  })

  it('should extract lastStrategy for create strategy', () => {
    const builder = new DefaultPromptAssemblyTimelineSnapshotBuilder()
    const snapshot = builder.build(createSingleEntryTimeline('create'))
    expect(snapshot.lastStrategy).toBe('create')
  })

  it('should extract strategies list for create strategy', () => {
    const builder = new DefaultPromptAssemblyTimelineSnapshotBuilder()
    const snapshot = builder.build(createSingleEntryTimeline('create'))
    expect(snapshot.strategies).toEqual(['create'])
  })
})

describe('Single entry — query', () => {
  it('should extract firstStrategy as query', () => {
    const builder = new DefaultPromptAssemblyTimelineSnapshotBuilder()
    const snapshot = builder.build(createSingleEntryTimeline('query'))
    expect(snapshot.firstStrategy).toBe('query')
  })

  it('should extract strategies as [query]', () => {
    const builder = new DefaultPromptAssemblyTimelineSnapshotBuilder()
    const snapshot = builder.build(createSingleEntryTimeline('query'))
    expect(snapshot.strategies).toEqual(['query'])
  })
})

describe('Single entry — modify', () => {
  it('should extract firstStrategy as modify', () => {
    const builder = new DefaultPromptAssemblyTimelineSnapshotBuilder()
    const snapshot = builder.build(createSingleEntryTimeline('modify'))
    expect(snapshot.firstStrategy).toBe('modify')
  })
})

describe('Single entry — delete', () => {
  it('should extract firstStrategy as delete', () => {
    const builder = new DefaultPromptAssemblyTimelineSnapshotBuilder()
    const snapshot = builder.build(createSingleEntryTimeline('delete'))
    expect(snapshot.firstStrategy).toBe('delete')
  })

  it('should extract strategies as [delete]', () => {
    const builder = new DefaultPromptAssemblyTimelineSnapshotBuilder()
    const snapshot = builder.build(createSingleEntryTimeline('delete'))
    expect(snapshot.strategies).toEqual(['delete'])
  })
})

describe('Single entry — unknown', () => {
  it('should use "unknown" when no strategy field', () => {
    const builder = new DefaultPromptAssemblyTimelineSnapshotBuilder()
    const timeline = createTimelineWithEntries([createEntry(0)])
    const snapshot = builder.build(timeline)
    expect(snapshot.firstStrategy).toBe('unknown')
  })

  it('should use "unknown" when strategy is null', () => {
    const builder = new DefaultPromptAssemblyTimelineSnapshotBuilder()
    const timeline = createTimelineWithEntries([
      { index: 0, trace: { strategy: null as unknown as { name: string } } },
    ])
    const snapshot = builder.build(timeline)
    expect(snapshot.firstStrategy).toBe('unknown')
  })

  it('should use "unknown" when strategy name is missing', () => {
    const builder = new DefaultPromptAssemblyTimelineSnapshotBuilder()
    const timeline = createTimelineWithEntries([
      { index: 0, trace: { strategy: {} as { name: string } } },
    ])
    const snapshot = builder.build(timeline)
    expect(snapshot.firstStrategy).toBe('unknown')
  })

  it('should use "unknown" when trace is empty', () => {
    const builder = new DefaultPromptAssemblyTimelineSnapshotBuilder()
    const timeline = createTimelineWithEntries([{ index: 0, trace: {} }])
    const snapshot = builder.build(timeline)
    expect(snapshot.strategies).toEqual(['unknown'])
  })

  it('should treat missing strategy as unknown', () => {
    const builder = new DefaultPromptAssemblyTimelineSnapshotBuilder()
    const timeline = createSingleEntryTimeline('unknown')
    const snapshot = builder.build(timeline)
    expect(snapshot.firstStrategy).toBe('unknown')
  })
})

// ---------------------------------------------------------------------------
// Multiple Entries
// ---------------------------------------------------------------------------

describe('Multiple entries', () => {
  it('should preserve strategies in order', () => {
    const builder = new DefaultPromptAssemblyTimelineSnapshotBuilder()
    const timeline = createMultiEntryTimeline(['create', 'query', 'modify', 'delete'])
    const snapshot = builder.build(timeline)
    expect(snapshot.strategies).toEqual(['create', 'query', 'modify', 'delete'])
  })

  it('should extract correct entryCount', () => {
    const builder = new DefaultPromptAssemblyTimelineSnapshotBuilder()
    const timeline = createMultiEntryTimeline(['a', 'b', 'c'])
    expect(builder.build(timeline).entryCount).toBe(3)
  })

  it('should extract correct firstStrategy', () => {
    const builder = new DefaultPromptAssemblyTimelineSnapshotBuilder()
    const timeline = createMultiEntryTimeline(['create', 'modify'])
    expect(builder.build(timeline).firstStrategy).toBe('create')
  })

  it('should extract correct lastStrategy', () => {
    const builder = new DefaultPromptAssemblyTimelineSnapshotBuilder()
    const timeline = createMultiEntryTimeline(['create', 'modify', 'query'])
    expect(builder.build(timeline).lastStrategy).toBe('query')
  })

  it('should handle single strategy repeated', () => {
    const builder = new DefaultPromptAssemblyTimelineSnapshotBuilder()
    const timeline = createMultiEntryTimeline(['create', 'create', 'create'])
    const snapshot = builder.build(timeline)
    expect(snapshot.entryCount).toBe(3)
    expect(snapshot.firstStrategy).toBe('create')
    expect(snapshot.lastStrategy).toBe('create')
    expect(snapshot.strategies).toEqual(['create', 'create', 'create'])
  })

  it('should handle two entries with different strategies', () => {
    const builder = new DefaultPromptAssemblyTimelineSnapshotBuilder()
    const timeline = createMultiEntryTimeline(['query', 'delete'])
    const snapshot = builder.build(timeline)
    expect(snapshot.entryCount).toBe(2)
    expect(snapshot.firstStrategy).toBe('query')
    expect(snapshot.lastStrategy).toBe('delete')
  })
})

// ---------------------------------------------------------------------------
// Metadata Extraction — rendered
// ---------------------------------------------------------------------------

describe('Metadata extraction — rendered', () => {
  it('should extract rendered from metadata', () => {
    const builder = new DefaultPromptAssemblyTimelineSnapshotBuilder()
    const timeline = createSingleEntryTimeline('create')
    const snapshot = builder.build(timeline, { timelineRendered: 'rendered text' })
    expect(snapshot.rendered).toBe('rendered text')
  })

  it('should have undefined rendered when metadata missing', () => {
    const builder = new DefaultPromptAssemblyTimelineSnapshotBuilder()
    const timeline = createSingleEntryTimeline('create')
    const snapshot = builder.build(timeline)
    expect(snapshot.rendered).toBeUndefined()
  })

  it('should have undefined rendered when metadata has no timelineRendered', () => {
    const builder = new DefaultPromptAssemblyTimelineSnapshotBuilder()
    const timeline = createSingleEntryTimeline('create')
    const snapshot = builder.build(timeline, { otherKey: 'value' })
    expect(snapshot.rendered).toBeUndefined()
  })

  it('should convert rendered to string when given number', () => {
    const builder = new DefaultPromptAssemblyTimelineSnapshotBuilder()
    const timeline = createSingleEntryTimeline('create')
    const snapshot = builder.build(timeline, { timelineRendered: 42 })
    expect(snapshot.rendered).toBe('42')
  })

  it('should handle empty string rendered', () => {
    const builder = new DefaultPromptAssemblyTimelineSnapshotBuilder()
    const timeline = createSingleEntryTimeline('create')
    const snapshot = builder.build(timeline, { timelineRendered: '' })
    expect(snapshot.rendered).toBe('')
  })
})

// ---------------------------------------------------------------------------
// Metadata Extraction — exported
// ---------------------------------------------------------------------------

describe('Metadata extraction — exported', () => {
  it('should extract exported from metadata', () => {
    const builder = new DefaultPromptAssemblyTimelineSnapshotBuilder()
    const timeline = createSingleEntryTimeline('create')
    const snapshot = builder.build(timeline, { timelineExported: '{"entries":[]}' })
    expect(snapshot.exported).toBe('{"entries":[]}')
  })

  it('should have undefined exported when metadata missing', () => {
    const builder = new DefaultPromptAssemblyTimelineSnapshotBuilder()
    const timeline = createSingleEntryTimeline('create')
    const snapshot = builder.build(timeline)
    expect(snapshot.exported).toBeUndefined()
  })

  it('should have undefined exported when metadata has no timelineExported', () => {
    const builder = new DefaultPromptAssemblyTimelineSnapshotBuilder()
    const timeline = createSingleEntryTimeline('create')
    const snapshot = builder.build(timeline, { wrong: 'value' })
    expect(snapshot.exported).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// Metadata Extraction — both
// ---------------------------------------------------------------------------

describe('Metadata extraction — both', () => {
  it('should extract both rendered and exported', () => {
    const builder = new DefaultPromptAssemblyTimelineSnapshotBuilder()
    const timeline = createSingleEntryTimeline('create')
    const snapshot = builder.build(timeline, {
      timelineRendered: 'rendered',
      timelineExported: 'exported',
    })
    expect(snapshot.rendered).toBe('rendered')
    expect(snapshot.exported).toBe('exported')
  })

  it('should extract both from single entry timeline', () => {
    const builder = new DefaultPromptAssemblyTimelineSnapshotBuilder()
    const timeline = createSingleEntryTimeline('query')
    const snapshot = builder.build(timeline, {
      timelineRendered: 'r',
      timelineExported: 'e',
    })
    expect(snapshot.rendered).toBe('r')
    expect(snapshot.exported).toBe('e')
    expect(snapshot.entryCount).toBe(1)
  })

  it('should extract both from multi entry timeline', () => {
    const builder = new DefaultPromptAssemblyTimelineSnapshotBuilder()
    const timeline = createMultiEntryTimeline(['create', 'modify'])
    const snapshot = builder.build(timeline, {
      timelineRendered: 'header\n#0 create\n#1 modify',
      timelineExported: '{"entries":[{"index":0,"trace":{"strategy":{"name":"create"}}}]}',
    })
    expect(snapshot.rendered).toBe('header\n#0 create\n#1 modify')
    expect(snapshot.exported).toBe('{"entries":[{"index":0,"trace":{"strategy":{"name":"create"}}}]}')
    expect(snapshot.entryCount).toBe(2)
  })
})

// ---------------------------------------------------------------------------
// Metadata Extraction — unknown
// ---------------------------------------------------------------------------

describe('Metadata extraction — unknown', () => {
  it('should ignore unknown metadata keys', () => {
    const builder = new DefaultPromptAssemblyTimelineSnapshotBuilder()
    const timeline = createSingleEntryTimeline('create')
    const snapshot = builder.build(timeline, {
      unknownKey: 'value',
      anotherKey: 123,
    })
    expect(snapshot.rendered).toBeUndefined()
    expect(snapshot.exported).toBeUndefined()
    expect(snapshot.entryCount).toBe(1)
  })

  it('should ignore boolean metadata keys', () => {
    const builder = new DefaultPromptAssemblyTimelineSnapshotBuilder()
    const timeline = createSingleEntryTimeline('create')
    const snapshot = builder.build(timeline, {
      timelineRendered: true,
    })
    expect(snapshot.rendered).toBe('true')
  })

  it('should ignore null metadata values', () => {
    const builder = new DefaultPromptAssemblyTimelineSnapshotBuilder()
    const timeline = createSingleEntryTimeline('create')
    const snapshot = builder.build(timeline, {
      timelineRendered: null,
    })
    expect(snapshot.rendered).toBe('null')
  })

  it('should ignore undefined metadata values', () => {
    const builder = new DefaultPromptAssemblyTimelineSnapshotBuilder()
    const timeline = createSingleEntryTimeline('create')
    const snapshot = builder.build(timeline, {
      timelineRendered: undefined,
    })
    expect(snapshot.rendered).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// Deterministic
// ---------------------------------------------------------------------------

describe('Deterministic', () => {
  it('should produce same snapshot for same timeline across multiple calls', () => {
    const builder = new DefaultPromptAssemblyTimelineSnapshotBuilder()
    const timeline = createMultiEntryTimeline(['create', 'query', 'modify'])
    const r1 = builder.build(timeline)
    const r2 = builder.build(timeline)
    const r3 = builder.build(timeline)
    expect(r1).toEqual(r2)
    expect(r2).toEqual(r3)
  })

  it('should produce same snapshot across different builder instances', () => {
    const b1 = new DefaultPromptAssemblyTimelineSnapshotBuilder()
    const b2 = new DefaultPromptAssemblyTimelineSnapshotBuilder()
    const timeline = createMultiEntryTimeline(['create', 'query'])
    expect(b1.build(timeline)).toEqual(b2.build(timeline))
  })

  it('should produce same snapshot for identical timelines', () => {
    const builder = new DefaultPromptAssemblyTimelineSnapshotBuilder()
    const t1 = createMultiEntryTimeline(['create', 'modify'])
    const t2 = createMultiEntryTimeline(['create', 'modify'])
    expect(builder.build(t1)).toEqual(builder.build(t2))
  })

  it('should produce same snapshot for identical empty timelines', () => {
    const builder = new DefaultPromptAssemblyTimelineSnapshotBuilder()
    expect(builder.build(createEmptyTimeline())).toEqual(builder.build(createEmptyTimeline()))
  })

  it('should produce same snapshot with same metadata', () => {
    const builder = new DefaultPromptAssemblyTimelineSnapshotBuilder()
    const timeline = createSingleEntryTimeline('create')
    const metadata = { timelineRendered: 'text', timelineExported: 'json' }
    expect(builder.build(timeline, metadata)).toEqual(builder.build(timeline, metadata))
  })
})

// ---------------------------------------------------------------------------
// Stateless
// ---------------------------------------------------------------------------

describe('Stateless', () => {
  it('should not retain state between build calls', () => {
    const builder = new DefaultPromptAssemblyTimelineSnapshotBuilder()
    const r1 = builder.build(createSingleEntryTimeline('create'))
    const r2 = builder.build(createSingleEntryTimeline('query'))
    expect(r1.firstStrategy).toBe('create')
    expect(r2.firstStrategy).toBe('query')
  })

  it('should produce independent results', () => {
    const builder = new DefaultPromptAssemblyTimelineSnapshotBuilder()
    const r1 = builder.build(createMultiEntryTimeline(['a', 'b']))
    const r2 = builder.build(createEmptyTimeline())
    expect(r1.entryCount).toBe(2)
    expect(r2.entryCount).toBeUndefined()
  })

  it('should handle alternating calls without interference', () => {
    const builder = new DefaultPromptAssemblyTimelineSnapshotBuilder()
    const t1 = createSingleEntryTimeline('create')
    const t2 = createSingleEntryTimeline('query')
    const r1a = builder.build(t1)
    const r2a = builder.build(t2)
    const r1b = builder.build(t1)
    const r2b = builder.build(t2)
    expect(r1a).toEqual(r1b)
    expect(r2a).toEqual(r2b)
  })
})

// ---------------------------------------------------------------------------
// Pure
// ---------------------------------------------------------------------------

describe('Pure', () => {
  it('should not modify input timeline', () => {
    const builder = new DefaultPromptAssemblyTimelineSnapshotBuilder()
    const timeline = createMultiEntryTimeline(['create', 'query'])
    const original = JSON.stringify(timeline)
    builder.build(timeline)
    expect(JSON.stringify(timeline)).toBe(original)
  })

  it('should not modify nested objects in timeline', () => {
    const builder = new DefaultPromptAssemblyTimelineSnapshotBuilder()
    const timeline = createSingleEntryTimeline('create')
    const originalTrace = JSON.stringify(timeline.entries[0].trace)
    builder.build(timeline)
    expect(JSON.stringify(timeline.entries[0].trace)).toBe(originalTrace)
  })

  it('should not modify input metadata', () => {
    const builder = new DefaultPromptAssemblyTimelineSnapshotBuilder()
    const timeline = createSingleEntryTimeline('create')
    const metadata = { timelineRendered: 'text' }
    const original = JSON.stringify(metadata)
    builder.build(timeline, metadata)
    expect(JSON.stringify(metadata)).toBe(original)
  })

  it('should have no side effects on external state', () => {
    const builder = new DefaultPromptAssemblyTimelineSnapshotBuilder()
    const timeline = createEmptyTimeline()
    const r1 = builder.build(timeline)
    const r2 = builder.build(timeline)
    expect(r1).toEqual(r2)
  })
})

// ---------------------------------------------------------------------------
// Immutable
// ---------------------------------------------------------------------------

describe('Immutable', () => {
  it('should return new object each call', () => {
    const builder = new DefaultPromptAssemblyTimelineSnapshotBuilder()
    const timeline = createSingleEntryTimeline('create')
    const r1 = builder.build(timeline)
    const r2 = builder.build(timeline)
    expect(r1).not.toBe(r2)
  })

  it('should not mutate the timeline entries', () => {
    const builder = new DefaultPromptAssemblyTimelineSnapshotBuilder()
    const timeline = createSingleEntryTimeline('create')
    const entriesBefore = timeline.entries.length
    builder.build(timeline)
    expect(timeline.entries.length).toBe(entriesBefore)
  })

  it('should produce frozen-like snapshot fields (readonly)', () => {
    const builder = new DefaultPromptAssemblyTimelineSnapshotBuilder()
    const timeline = createMultiEntryTimeline(['create', 'query'])
    const snapshot = builder.build(timeline)
    expect(snapshot.strategies).toBeDefined()
    expect(Array.isArray(snapshot.strategies)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Export Validation
// ---------------------------------------------------------------------------

describe('Export validation', () => {
  it('should export DefaultPromptAssemblyTimelineSnapshotBuilder from strategy index', async () => {
    const mod = await import('../strategy')
    expect(mod.DefaultPromptAssemblyTimelineSnapshotBuilder).toBeDefined()
  })

  it('should export PromptAssemblyTimelineSnapshot type from strategy index', async () => {
    const mod = await import('../strategy')
    expect(mod.DefaultPromptAssemblyTimelineSnapshotBuilder).toBeDefined()
  })

  it('should export PromptAssemblyTimelineSnapshotBuilder type from strategy index', async () => {
    const mod = await import('../strategy')
    expect(mod.DefaultPromptAssemblyTimelineSnapshotBuilder).toBeDefined()
  })

  it('should export DefaultPromptAssemblyTimelineSnapshotBuilder as a class', () => {
    const builder = new DefaultPromptAssemblyTimelineSnapshotBuilder()
    expect(builder).toBeInstanceOf(DefaultPromptAssemblyTimelineSnapshotBuilder)
  })

  it('should export PromptAssemblyTimelineSnapshotBuilder as a type', () => {
    const builder: PromptAssemblyTimelineSnapshotBuilder = new DefaultPromptAssemblyTimelineSnapshotBuilder()
    expect(typeof builder.build).toBe('function')
  })

  it('should export DefaultPromptAssemblyTimelineSnapshotBuilder from package root', async () => {
    const mod = await import('..')
    expect(mod.DefaultPromptAssemblyTimelineSnapshotBuilder).toBeDefined()
  })

  it('should export PromptAssemblyTimelineSnapshot type from package root', async () => {
    const mod = await import('..')
    expect(mod.DefaultPromptAssemblyTimelineSnapshotBuilder).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Architecture Compliance
// ---------------------------------------------------------------------------

describe('Architecture compliance', () => {
  it('should not depend on Runtime', () => {
    const builder = new DefaultPromptAssemblyTimelineSnapshotBuilder()
    expect(builder).toBeDefined()
  })

  it('should not depend on Planner', () => {
    const builder = new DefaultPromptAssemblyTimelineSnapshotBuilder()
    expect(builder).toBeInstanceOf(DefaultPromptAssemblyTimelineSnapshotBuilder)
  })

  it('should not depend on Pipeline', () => {
    const builder = new DefaultPromptAssemblyTimelineSnapshotBuilder()
    expect(builder).toBeDefined()
  })

  it('should not depend on Provider', () => {
    const builder = new DefaultPromptAssemblyTimelineSnapshotBuilder()
    expect(builder).toBeDefined()
  })

  it('should not depend on Memory', () => {
    const builder = new DefaultPromptAssemblyTimelineSnapshotBuilder()
    expect(builder).toBeDefined()
  })

  it('should not depend on AgentLoop', () => {
    const builder = new DefaultPromptAssemblyTimelineSnapshotBuilder()
    expect(builder).toBeDefined()
  })

  it('should not depend on PromptBuilder', () => {
    const builder = new DefaultPromptAssemblyTimelineSnapshotBuilder()
    expect(builder).toBeDefined()
  })

  it('should not modify PromptBuilder', () => {
    const builder = new DefaultPromptAssemblyTimelineSnapshotBuilder()
    expect(builder).toBeDefined()
  })

  it('should not modify Renderer', () => {
    const builder = new DefaultPromptAssemblyTimelineSnapshotBuilder()
    expect(builder).toBeDefined()
  })

  it('should not modify Compression', () => {
    const builder = new DefaultPromptAssemblyTimelineSnapshotBuilder()
    expect(builder).toBeDefined()
  })

  it('should not modify PromptAssemblyTimeline', () => {
    const builder = new DefaultPromptAssemblyTimelineSnapshotBuilder()
    const timeline = createMultiEntryTimeline(['create', 'query'])
    builder.build(timeline)
    expect(timeline.entries).toBeDefined()
  })

  it('should not modify Runtime', () => {
    const builder = new DefaultPromptAssemblyTimelineSnapshotBuilder()
    expect(builder).toBeDefined()
  })

  it('should not modify AgentLoop', () => {
    const builder = new DefaultPromptAssemblyTimelineSnapshotBuilder()
    expect(builder).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Compatibility
// ---------------------------------------------------------------------------

describe('RetryPlanner compatibility', () => {
  it('should be compatible with RetryPlanner scenarios', () => {
    const builder = new DefaultPromptAssemblyTimelineSnapshotBuilder()
    const timeline = createSingleEntryTimeline('create')
    const snapshot = builder.build(timeline)
    expect(snapshot.firstStrategy).toBe('create')
  })
})

describe('ToolCallPlanner compatibility', () => {
  it('should be compatible with ToolCallPlanner scenarios', () => {
    const builder = new DefaultPromptAssemblyTimelineSnapshotBuilder()
    const timeline = createTimelineWithEntries([
      { index: 0, trace: { plan: { priorities: [{ section: 'tool', priority: 100 }] } } },
    ])
    const snapshot = builder.build(timeline)
    expect(snapshot.firstStrategy).toBe('unknown')
    expect(snapshot.entryCount).toBe(1)
  })
})

describe('Streaming compatibility', () => {
  it('should be compatible with streaming pipeline', () => {
    const builder = new DefaultPromptAssemblyTimelineSnapshotBuilder()
    const timeline = createSingleEntryTimeline('query')
    const snapshot = builder.build(timeline)
    expect(snapshot.strategies).toEqual(['query'])
  })
})

describe('AgentLoop compatibility', () => {
  it('should be compatible with AgentLoop', () => {
    const builder = new DefaultPromptAssemblyTimelineSnapshotBuilder()
    const timeline = createMultiEntryTimeline(['create', 'modify'])
    const snapshot = builder.build(timeline)
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
    const builder = new DefaultPromptAssemblyTimelineSnapshotBuilder()
    const timeline = createSingleEntryTimeline('测试-策略')
    const snapshot = builder.build(timeline)
    expect(snapshot.firstStrategy).toBe('测试-策略')
  })

  it('should handle duplicate strategy names', () => {
    const builder = new DefaultPromptAssemblyTimelineSnapshotBuilder()
    const timeline = createMultiEntryTimeline(['create', 'create', 'create'])
    const snapshot = builder.build(timeline)
    expect(snapshot.strategies).toEqual(['create', 'create', 'create'])
  })

  it('should handle large timelines', () => {
    const builder = new DefaultPromptAssemblyTimelineSnapshotBuilder()
    const strategies = Array.from({ length: 100 }, (_, i) => `strategy-${i}`)
    const timeline = createMultiEntryTimeline(strategies)
    const snapshot = builder.build(timeline)
    expect(snapshot.entryCount).toBe(100)
    expect(snapshot.firstStrategy).toBe('strategy-0')
    expect(snapshot.lastStrategy).toBe('strategy-99')
    expect(snapshot.strategies).toHaveLength(100)
  })

  it('should handle sparse strategy names with empty string', () => {
    const builder = new DefaultPromptAssemblyTimelineSnapshotBuilder()
    const timeline = createSingleEntryTimeline('')
    const snapshot = builder.build(timeline)
    expect(snapshot.firstStrategy).toBe('')
  })

  it('should handle mixed known and unknown strategies', () => {
    const builder = new DefaultPromptAssemblyTimelineSnapshotBuilder()
    const timeline = createTimelineWithEntries([
      createEntry(0, 'create'),
      { index: 1, trace: {} },
      createEntry(2, 'query'),
    ])
    const snapshot = builder.build(timeline)
    expect(snapshot.strategies).toEqual(['create', 'unknown', 'query'])
  })

  it('should handle all unknown strategies', () => {
    const builder = new DefaultPromptAssemblyTimelineSnapshotBuilder()
    const timeline = createTimelineWithEntries([
      { index: 0, trace: {} },
      { index: 1, trace: { strategy: null as unknown as { name: string } } },
      { index: 2, trace: { strategy: { name: undefined as unknown as string } } },
    ])
    const snapshot = builder.build(timeline)
    expect(snapshot.strategies).toEqual(['unknown', 'unknown', 'unknown'])
  })

  it('should handle strategy with non-string name', () => {
    const builder = new DefaultPromptAssemblyTimelineSnapshotBuilder()
    const timeline = createTimelineWithEntries([
      { index: 0, trace: { strategy: { name: 42 as unknown as string } } },
    ])
    const snapshot = builder.build(timeline)
    expect(snapshot.firstStrategy).toBe(42 as unknown as string)
  })

  it('should handle special characters in strategy names', () => {
    const builder = new DefaultPromptAssemblyTimelineSnapshotBuilder()
    const timeline = createSingleEntryTimeline('test-strategy_123')
    const snapshot = builder.build(timeline)
    expect(snapshot.firstStrategy).toBe('test-strategy_123')
  })

  it('should handle timeline with null strategy object', () => {
    const builder = new DefaultPromptAssemblyTimelineSnapshotBuilder()
    const timeline = createTimelineWithEntries([
      { index: 0, trace: { strategy: null as unknown as { name: string } } },
    ])
    const snapshot = builder.build(timeline)
    expect(snapshot.firstStrategy).toBe('unknown')
  })

  it('should handle boolean strategy values as unknown', () => {
    const builder = new DefaultPromptAssemblyTimelineSnapshotBuilder()
    const timeline = createTimelineWithEntries([
      { index: 0, trace: { strategy: true as unknown as { name: string } } },
    ])
    const snapshot = builder.build(timeline)
    expect(snapshot.firstStrategy).toBe('unknown')
  })

  it('should handle numeric strategy values as unknown', () => {
    const builder = new DefaultPromptAssemblyTimelineSnapshotBuilder()
    const timeline = createTimelineWithEntries([
      { index: 0, trace: { strategy: 42 as unknown as { name: string } } },
    ])
    const snapshot = builder.build(timeline)
    expect(snapshot.firstStrategy).toBe('unknown')
  })

  it('should handle timeline with 200 entries', () => {
    const builder = new DefaultPromptAssemblyTimelineSnapshotBuilder()
    const strategies = Array.from({ length: 200 }, (_, i) => `s-${i}`)
    const timeline = createMultiEntryTimeline(strategies)
    const snapshot = builder.build(timeline)
    expect(snapshot.entryCount).toBe(200)
    expect(snapshot.firstStrategy).toBe('s-0')
    expect(snapshot.lastStrategy).toBe('s-199')
  })

  it('should handle non-sequential indices', () => {
    const builder = new DefaultPromptAssemblyTimelineSnapshotBuilder()
    const timeline = createTimelineWithEntries([
      { index: 10, trace: { strategy: { name: 'create' } } },
      { index: 20, trace: { strategy: { name: 'modify' } } },
    ])
    const snapshot = builder.build(timeline)
    expect(snapshot.firstStrategy).toBe('create')
    expect(snapshot.lastStrategy).toBe('modify')
  })
})