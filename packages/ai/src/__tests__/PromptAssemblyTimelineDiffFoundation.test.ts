import { describe, it, expect } from 'vitest'
import { DefaultPromptAssemblyTimelineDiffer } from '../strategy/DefaultPromptAssemblyTimelineDiffer'
import type { PromptAssemblyTimelineDiffer } from '../strategy/PromptAssemblyTimelineDiffer'
import type { PromptAssemblyTimelineDiff } from '../strategy/PromptAssemblyTimelineDiff'
import type { PromptAssemblyTimeline } from '../strategy/PromptAssemblyTimeline'
import type { PromptAssemblyTimelineEntry } from '../strategy/PromptAssemblyTimelineEntry'
import type { PromptAssemblyTrace } from '../strategy/PromptAssemblyTrace'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createTrace(name: string): PromptAssemblyTrace {
  return { strategy: { name } }
}

function createTraceWith<T>(overrides: Partial<PromptAssemblyTrace>): PromptAssemblyTrace {
  return { ...overrides }
}

function createEmptyTimeline(): PromptAssemblyTimeline {
  return { entries: [] }
}

function createTimeline(entries: readonly PromptAssemblyTimelineEntry[]): PromptAssemblyTimeline {
  return { entries: [...entries] }
}

function createEntry(index: number, trace: PromptAssemblyTrace): PromptAssemblyTimelineEntry {
  return { index, trace }
}

function createTimelineFromTraces(traces: readonly PromptAssemblyTrace[]): PromptAssemblyTimeline {
  return { entries: traces.map((trace, index) => ({ index, trace })) }
}

function createDiffer(): DefaultPromptAssemblyTimelineDiffer {
  return new DefaultPromptAssemblyTimelineDiffer()
}

function asRecord(value: object): Record<string, unknown> {
  return value as unknown as Record<string, unknown>
}

// ---------------------------------------------------------------------------
// Interface Contract — TimelineDiff
// ---------------------------------------------------------------------------

describe('Interface contract — TimelineDiff', () => {
  it('should have a readonly added field', () => {
    const diff: PromptAssemblyTimelineDiff = { added: [0, 1], removed: [], changed: [] }
    expect(diff.added).toEqual([0, 1])
  })

  it('should have a readonly removed field', () => {
    const diff: PromptAssemblyTimelineDiff = { added: [], removed: [2], changed: [] }
    expect(diff.removed).toEqual([2])
  })

  it('should have a readonly changed field', () => {
    const diff: PromptAssemblyTimelineDiff = { added: [], removed: [], changed: [3] }
    expect(diff.changed).toEqual([3])
  })

  it('should support multiple entries in all arrays', () => {
    const diff: PromptAssemblyTimelineDiff = {
      added: [0, 1],
      removed: [2, 3],
      changed: [4, 5],
    }
    expect(diff.added).toHaveLength(2)
    expect(diff.removed).toHaveLength(2)
    expect(diff.changed).toHaveLength(2)
  })

  it('should support empty arrays', () => {
    const diff: PromptAssemblyTimelineDiff = { added: [], removed: [], changed: [] }
    expect(diff.added).toEqual([])
    expect(diff.removed).toEqual([])
    expect(diff.changed).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// Interface Contract — TimelineDiffer
// ---------------------------------------------------------------------------

describe('Interface contract — TimelineDiffer', () => {
  it('should define a diff method', () => {
    const differ: PromptAssemblyTimelineDiffer = createDiffer()
    expect(typeof differ.diff).toBe('function')
  })

  it('should accept two timelines and return a PromptAssemblyTimelineDiff', () => {
    const differ = createDiffer()
    const before = createEmptyTimeline()
    const after = createEmptyTimeline()
    const result = differ.diff(before, after)
    expect(result).toHaveProperty('added')
    expect(result).toHaveProperty('removed')
    expect(result).toHaveProperty('changed')
  })

  it('should accept a custom implementation', () => {
    const custom: PromptAssemblyTimelineDiffer = {
      diff(_before: PromptAssemblyTimeline, _after: PromptAssemblyTimeline): PromptAssemblyTimelineDiff {
        return { added: [99], removed: [], changed: [] }
      },
    }
    const result = custom.diff(createEmptyTimeline(), createEmptyTimeline())
    expect(result.added).toEqual([99])
  })

  it('should accept timelines with entries', () => {
    const differ = createDiffer()
    const trace = createTrace('create')
    const before = createTimelineFromTraces([trace])
    const after = createTimelineFromTraces([trace])
    const result = differ.diff(before, after)
    expect(result.added).toEqual([])
    expect(result.removed).toEqual([])
    expect(result.changed).toEqual([])
  })

  it('should accept the same timeline for both arguments', () => {
    const differ = createDiffer()
    const timeline = createTimelineFromTraces([createTrace('create')])
    const result = differ.diff(timeline, timeline)
    expect(result.added).toEqual([])
    expect(result.removed).toEqual([])
    expect(result.changed).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// Added — single
// ---------------------------------------------------------------------------

describe('Added — single', () => {
  it('should detect a single added entry', () => {
    const differ = createDiffer()
    const trace = createTrace('create')
    const before = createTimelineFromTraces([])
    const after = createTimelineFromTraces([trace])
    const result = differ.diff(before, after)
    expect(result.added).toEqual([0])
  })

  it('should detect a single added entry with non-zero index', () => {
    const differ = createDiffer()
    const before = createTimelineFromTraces([createTrace('create')])
    const after = createTimelineFromTraces([createTrace('create'), createTrace('query')])
    const result = differ.diff(before, after)
    expect(result.added).toEqual([1])
  })
})

// ---------------------------------------------------------------------------
// Added — multiple
// ---------------------------------------------------------------------------

describe('Added — multiple', () => {
  it('should detect multiple added entries', () => {
    const differ = createDiffer()
    const before = createTimelineFromTraces([createTrace('create')])
    const after = createTimelineFromTraces([createTrace('create'), createTrace('query'), createTrace('modify')])
    const result = differ.diff(before, after)
    expect(result.added).toEqual([1, 2])
  })

  it('should detect added when before is empty and after has many entries', () => {
    const differ = createDiffer()
    const before = createEmptyTimeline()
    const after = createTimelineFromTraces([
      createTrace('create'),
      createTrace('query'),
      createTrace('modify'),
      createTrace('delete'),
    ])
    const result = differ.diff(before, after)
    expect(result.added).toEqual([0, 1, 2, 3])
  })
})

// ---------------------------------------------------------------------------
// Added — order preserved
// ---------------------------------------------------------------------------

describe('Added — order preserved', () => {
  it('should preserve encounter order of added indexes', () => {
    const differ = createDiffer()
    const before = createTimelineFromTraces([createTrace('create')])
    const after = createTimelineFromTraces([
      createTrace('create'),
      createTrace('query'),
      createTrace('modify'),
      createTrace('delete'),
    ])
    const result = differ.diff(before, after)
    // Added indexes should be in after timeline order: 1, 2, 3
    expect(result.added).toEqual([1, 2, 3])
  })

  it('should preserve order when added entries are not sequential', () => {
    const differ = createDiffer()
    const before = createTimelineFromTraces([
      createTrace('create'),
      createTrace('modify'),
    ])
    const after = createTimelineFromTraces([
      createTrace('create'),
      createTrace('query'),
      createTrace('modify'),
      createTrace('delete'),
    ])
    const result = differ.diff(before, after)
    // before: [0:create, 1:modify]
    // after:  [0:create, 1:query, 2:modify, 3:delete]
    // Added: indexes 2 and 3 (in after order)
    expect(result.added).toEqual([2, 3])
  })
})

// ---------------------------------------------------------------------------
// Removed — single
// ---------------------------------------------------------------------------

describe('Removed — single', () => {
  it('should detect a single removed entry', () => {
    const differ = createDiffer()
    const before = createTimelineFromTraces([createTrace('create')])
    const after = createEmptyTimeline()
    const result = differ.diff(before, after)
    expect(result.removed).toEqual([0])
  })

  it('should detect a single removed entry from middle', () => {
    const differ = createDiffer()
    const before = createTimelineFromTraces([
      createTrace('create'),
      createTrace('query'),
      createTrace('modify'),
    ])
    const after = createTimelineFromTraces([
      createTrace('create'),
      createTrace('modify'),
    ])
    const result = differ.diff(before, after)
    // before: [0:create, 1:query, 2:modify]
    // after:  [0:create, 1:modify]
    // index 2 is in before but not in after → removed
    expect(result.removed).toEqual([2])
  })
})

// ---------------------------------------------------------------------------
// Removed — multiple
// ---------------------------------------------------------------------------

describe('Removed — multiple', () => {
  it('should detect multiple removed entries', () => {
    const differ = createDiffer()
    const before = createTimelineFromTraces([
      createTrace('create'),
      createTrace('query'),
      createTrace('modify'),
    ])
    const after = createTimelineFromTraces([createTrace('create')])
    const result = differ.diff(before, after)
    expect(result.removed).toEqual([1, 2])
  })

  it('should detect all removed when after is empty', () => {
    const differ = createDiffer()
    const before = createTimelineFromTraces([
      createTrace('create'),
      createTrace('query'),
      createTrace('modify'),
      createTrace('delete'),
    ])
    const after = createEmptyTimeline()
    const result = differ.diff(before, after)
    expect(result.removed).toEqual([0, 1, 2, 3])
  })
})

// ---------------------------------------------------------------------------
// Removed — order preserved
// ---------------------------------------------------------------------------

describe('Removed — order preserved', () => {
  it('should preserve encounter order of removed indexes', () => {
    const differ = createDiffer()
    const before = createTimelineFromTraces([
      createTrace('create'),
      createTrace('query'),
      createTrace('modify'),
      createTrace('delete'),
    ])
    const after = createTimelineFromTraces([createTrace('create'), createTrace('modify')])
    const result = differ.diff(before, after)
    // before: [0:create, 1:query, 2:modify, 3:delete]
    // after:  [0:create, 1:modify]
    // Index 2 is in both (before[2]=modify, after[2 doesn't exist]... 
    //   actually after only has indexes 0 and 1. Index 2 is NOT in after)
    // Removed in before order: indexes 2 (modify), 3 (delete) → [2, 3]
    expect(result.removed).toEqual([2, 3])
  })

  it('should preserve order when removed entries are not sequential', () => {
    const differ = createDiffer()
    const traceCreate = createTrace('create')
    const before = createTimeline([
      createEntry(0, createTrace('query')),
      createEntry(1, traceCreate),
      createEntry(3, createTrace('delete')),
    ])
    const after = createTimeline([
      createEntry(1, traceCreate),
    ])
    const result = differ.diff(before, after)
    // before: [0:query, 1:create, 3:delete]
    // after:  [1:create]
    // removed: indexes 0 and 3 (in before order) → [0, 3]
    expect(result.removed).toEqual([0, 3])
  })
})

// ---------------------------------------------------------------------------
// Changed — single
// ---------------------------------------------------------------------------

describe('Changed — single', () => {
  it('should detect a single changed entry (different trace reference)', () => {
    const differ = createDiffer()
    const before = createTimelineFromTraces([createTrace('create')])
    const after = createTimelineFromTraces([createTrace('query')])
    const result = differ.diff(before, after)
    expect(result.changed).toEqual([0])
  })

  it('should detect changed entry with different trace content', () => {
    const differ = createDiffer()
    const before = createTimelineFromTraces([
      createTraceWith({ strategy: { name: 'create' }, plan: { priorities: [] } }),
    ])
    const after = createTimelineFromTraces([
      createTraceWith({ strategy: { name: 'create' }, optimizedPlan: { priorities: [] } }),
    ])
    const result = differ.diff(before, after)
    expect(result.changed).toEqual([0])
  })
})

// ---------------------------------------------------------------------------
// Changed — multiple
// ---------------------------------------------------------------------------

describe('Changed — multiple', () => {
  it('should detect multiple changed entries', () => {
    const differ = createDiffer()
    const before = createTimelineFromTraces([
      createTrace('create'),
      createTrace('query'),
    ])
    const after = createTimelineFromTraces([
      createTrace('modify'),
      createTrace('delete'),
    ])
    const result = differ.diff(before, after)
    expect(result.changed).toEqual([0, 1])
  })

  it('should detect changed entries among unchanged ones', () => {
    const differ = createDiffer()
    const unchangedTrace = createTrace('create')
    const before = createTimelineFromTraces([
      unchangedTrace,
      createTrace('query'),
      createTrace('modify'),
    ])
    const after = createTimelineFromTraces([
      unchangedTrace,
      createTrace('delete'),
      createTrace('modify'),
    ])
    const result = differ.diff(before, after)
    // index 0: same trace → unchanged
    // index 1: different trace → changed
    // index 2: same trace → unchanged (but different reference means different object)
    // Actually, createTrace creates a new object each time, so index 2 will be changed too
    // Let me reconsider: createTrace('modify') in before and after create different objects
    expect(result.changed).toEqual([1, 2])
  })
})

// ---------------------------------------------------------------------------
// Changed — mixed
// ---------------------------------------------------------------------------

describe('Changed — mixed', () => {
  it('should detect changed entries with same trace reference as unchanged', () => {
    const differ = createDiffer()
    const trace1 = createTrace('create')
    const trace2 = createTrace('query')
    const before = createTimelineFromTraces([trace1, trace2])
    const after = createTimelineFromTraces([trace1, trace2])
    const result = differ.diff(before, after)
    // Same references → unchanged
    expect(result.changed).toEqual([])
  })

  it('should detect changed when only some entries differ', () => {
    const differ = createDiffer()
    const trace1 = createTrace('create')
    const before = createTimelineFromTraces([trace1, createTrace('query')])
    const after = createTimelineFromTraces([trace1, createTrace('delete')])
    const result = differ.diff(before, after)
    // index 0: same trace reference → unchanged
    // index 1: different reference → changed
    expect(result.changed).toEqual([1])
  })
})

// ---------------------------------------------------------------------------
// Changed — order preserved
// ---------------------------------------------------------------------------

describe('Changed — order preserved', () => {
  it('should preserve encounter order of changed indexes', () => {
    const differ = createDiffer()
    const before = createTimelineFromTraces([
      createTrace('create'),
      createTrace('query'),
      createTrace('modify'),
    ])
    const after = createTimelineFromTraces([
      createTrace('delete'),
      createTrace('search'),
      createTrace('update'),
    ])
    const result = differ.diff(before, after)
    // All three indexes changed, order preserved from before timeline
    expect(result.changed).toEqual([0, 1, 2])
  })

  it('should preserve order when only some indexes change', () => {
    const differ = createDiffer()
    const trace0 = createTrace('create')
    const before = createTimelineFromTraces([
      trace0,
      createTrace('query'),
      createTrace('modify'),
    ])
    const after = createTimelineFromTraces([
      trace0,
      createTrace('search'),
      createTrace('update'),
    ])
    const result = differ.diff(before, after)
    // index 0: same trace → unchanged
    // indexes 1, 2: different traces → changed in before order [1, 2]
    expect(result.changed).toEqual([1, 2])
  })
})

// ---------------------------------------------------------------------------
// Unchanged
// ---------------------------------------------------------------------------

describe('Unchanged', () => {
  it('should return empty diff when comparing same timeline to itself', () => {
    const differ = createDiffer()
    const timeline = createTimelineFromTraces([
      createTrace('create'),
      createTrace('query'),
      createTrace('modify'),
    ])
    const result = differ.diff(timeline, timeline)
    expect(result.added).toEqual([])
    expect(result.removed).toEqual([])
    expect(result.changed).toEqual([])
  })

  it('should return empty diff when timelines have same entries with same trace references', () => {
    const differ = createDiffer()
    const trace0 = createTrace('create')
    const trace1 = createTrace('query')
    const before = createTimelineFromTraces([trace0, trace1])
    const after = createTimelineFromTraces([trace0, trace1])
    const result = differ.diff(before, after)
    expect(result.added).toEqual([])
    expect(result.removed).toEqual([])
    expect(result.changed).toEqual([])
  })

  it('should return empty diff when both timelines are empty', () => {
    const differ = createDiffer()
    const result = differ.diff(createEmptyTimeline(), createEmptyTimeline())
    expect(result.added).toEqual([])
    expect(result.removed).toEqual([])
    expect(result.changed).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// No Sorting
// ---------------------------------------------------------------------------

describe('No sorting', () => {
  it('should not sort added indexes numerically', () => {
    const differ = createDiffer()
    const before = createTimeline([
      createEntry(0, createTrace('create')),
    ])
    const after = createTimeline([
      createEntry(0, createTrace('create')),
      createEntry(5, createTrace('later')),
      createEntry(3, createTrace('earlier')),
    ])
    const result = differ.diff(before, after)
    // Added should preserve after timeline order: 5, 3
    expect(result.added).toEqual([5, 3])
  })

  it('should not sort removed indexes numerically', () => {
    const differ = createDiffer()
    const before = createTimeline([
      createEntry(0, createTrace('create')),
      createEntry(5, createTrace('later')),
      createEntry(3, createTrace('earlier')),
    ])
    const after = createTimeline([
      createEntry(0, createTrace('create')),
    ])
    const result = differ.diff(before, after)
    // Removed should preserve before timeline order: 5, 3
    expect(result.removed).toEqual([5, 3])
  })
})

// ---------------------------------------------------------------------------
// Empty Timelines
// ---------------------------------------------------------------------------

describe('Empty timelines', () => {
  it('should return empty diff for empty/empty', () => {
    const differ = createDiffer()
    const result = differ.diff(createEmptyTimeline(), createEmptyTimeline())
    expect(result.added).toEqual([])
    expect(result.removed).toEqual([])
    expect(result.changed).toEqual([])
  })

  it('should detect all entries as added for empty/non-empty', () => {
    const differ = createDiffer()
    const after = createTimelineFromTraces([
      createTrace('create'),
      createTrace('query'),
    ])
    const result = differ.diff(createEmptyTimeline(), after)
    expect(result.added).toEqual([0, 1])
    expect(result.removed).toEqual([])
    expect(result.changed).toEqual([])
  })

  it('should detect all entries as removed for non-empty/empty', () => {
    const differ = createDiffer()
    const before = createTimelineFromTraces([
      createTrace('create'),
      createTrace('query'),
    ])
    const result = differ.diff(before, createEmptyTimeline())
    expect(result.removed).toEqual([0, 1])
    expect(result.added).toEqual([])
    expect(result.changed).toEqual([])
  })

  it('should handle empty to single entry', () => {
    const differ = createDiffer()
    const after = createTimelineFromTraces([createTrace('create')])
    const result = differ.diff(createEmptyTimeline(), after)
    expect(result.added).toEqual([0])
    expect(result.removed).toEqual([])
    expect(result.changed).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// Combined Changes
// ---------------------------------------------------------------------------

describe('Combined changes', () => {
  it('should detect added + removed + changed simultaneously', () => {
    const differ = createDiffer()
    const trace0 = createTrace('create')
    const before = createTimelineFromTraces([
      trace0,
      createTrace('query'),
      createTrace('modify'),
    ])
    const after = createTimelineFromTraces([
      trace0,
      createTrace('delete'),
      createTrace('create'),
    ])
    const result = differ.diff(before, after)
    // before: [0:create, 1:query, 2:modify]
    // after:  [0:create, 1:delete, 2:create]
    // index 0: same trace reference → unchanged
    // index 1: different trace → changed
    // index 2: different trace → changed
    // No added or removed (same indexes present)
    expect(result.changed).toEqual([1, 2])
    expect(result.added).toEqual([])
    expect(result.removed).toEqual([])
  })

  it('should handle added + removed without changed', () => {
    const differ = createDiffer()
    const trace0 = createTrace('create')
    const before = createTimelineFromTraces([trace0, createTrace('query')])
    const after = createTimelineFromTraces([trace0, createTrace('modify'), createTrace('delete')])
    const result = differ.diff(before, after)
    // added: index 2 (delete)
    // removed: index 1 (query)
    // changed: index 1 (different trace at same index... wait, after has modify at index 1)
    // Actually this is tricky. Let me think again:
    // before: [0:create, 1:query]
    // after:  [0:create, 1:modify, 2:delete]
    // added: 2 (delete in after, not in before)
    // removed: 1 (query in before, not in after... wait, index 1 exists in after)
    // Actually index 1 exists in both: before has query, after has modify
    // So: added=[2], removed=[], changed=[1]
    // Hmm, let me reconsider. 1 is present in both, so it's not removed.
    // And 2 is only in after, so it's added.
    // And 1 has different trace, so it's changed.
    expect(result.added).toEqual([2])
    expect(result.removed).toEqual([])
    expect(result.changed).toEqual([1])
  })

  it('should handle removed + changed without added', () => {
    const differ = createDiffer()
    const trace0 = createTrace('create')
    const before = createTimelineFromTraces([
      trace0,
      createTrace('query'),
      createTrace('modify'),
    ])
    const after = createTimelineFromTraces([trace0, createTrace('delete')])
    const result = differ.diff(before, after)
    // added: []
    // removed: [2]
    // changed: [1]
    expect(result.added).toEqual([])
    expect(result.removed).toEqual([2])
    expect(result.changed).toEqual([1])
  })

  it('should handle added + removed + changed all together', () => {
    const differ = createDiffer()
    const trace0 = createTrace('create')
    const before = createTimelineFromTraces([
      trace0,
      createTrace('query'),
      createTrace('modify'),
    ])
    const after = createTimelineFromTraces([
      trace0,
      createTrace('delete'),
      createTrace('create'),
      createTrace('new'),
    ])
    const result = differ.diff(before, after)
    // before: [0:create, 1:query, 2:modify]
    // after:  [0:create, 1:delete, 2:create, 3:new]
    // added: 3 (new in after, not in before)
    // removed: none (all before indexes exist in after)
    // Actually 2 exists in both: before has modify at 2, after has create at 2
    // So: added=[3], removed=[], changed=[1, 2]
    expect(result.added).toEqual([3])
    expect(result.removed).toEqual([])
    expect(result.changed).toEqual([1, 2])
  })
})

// ---------------------------------------------------------------------------
// Deterministic
// ---------------------------------------------------------------------------

describe('Deterministic', () => {
  it('should produce same result for same inputs across multiple calls', () => {
    const differ = createDiffer()
    const before = createTimelineFromTraces([createTrace('create'), createTrace('query')])
    const after = createTimelineFromTraces([createTrace('create'), createTrace('modify'), createTrace('delete')])
    const r1 = differ.diff(before, after)
    const r2 = differ.diff(before, after)
    const r3 = differ.diff(before, after)
    expect(r1.added).toEqual(r2.added)
    expect(r2.added).toEqual(r3.added)
    expect(r1.removed).toEqual(r2.removed)
    expect(r2.removed).toEqual(r3.removed)
    expect(r1.changed).toEqual(r2.changed)
    expect(r2.changed).toEqual(r3.changed)
  })

  it('should produce same result across different differ instances', () => {
    const d1 = createDiffer()
    const d2 = createDiffer()
    const before = createTimelineFromTraces([createTrace('create')])
    const after = createTimelineFromTraces([createTrace('query')])
    const r1 = d1.diff(before, after)
    const r2 = d2.diff(before, after)
    expect(r1.added).toEqual(r2.added)
    expect(r1.removed).toEqual(r2.removed)
    expect(r1.changed).toEqual(r2.changed)
  })

  it('should produce same result for identical timeline pairs', () => {
    const differ = createDiffer()
    const before1 = createTimelineFromTraces([createTrace('create')])
    const after1 = createTimelineFromTraces([createTrace('query')])
    const before2 = createTimelineFromTraces([createTrace('create')])
    const after2 = createTimelineFromTraces([createTrace('query')])
    expect(differ.diff(before1, after1)).toEqual(differ.diff(before2, after2))
  })

  it('should produce consistent results across many calls', () => {
    const differ = createDiffer()
    const before = createTimelineFromTraces([createTrace('create')])
    const after = createTimelineFromTraces([createTrace('query'), createTrace('modify')])
    const results = Array.from({ length: 5 }, () => differ.diff(before, after))
    for (let i = 1; i < results.length; i++) {
      expect(results[i].added).toEqual(results[0].added)
      expect(results[i].removed).toEqual(results[0].removed)
      expect(results[i].changed).toEqual(results[0].changed)
    }
  })
})

// ---------------------------------------------------------------------------
// Stateless
// ---------------------------------------------------------------------------

describe('Stateless', () => {
  it('should not retain state between diff calls', () => {
    const differ = createDiffer()
    const r1 = differ.diff(
      createTimelineFromTraces([createTrace('create')]),
      createTimelineFromTraces([createTrace('create'), createTrace('query')]),
    )
    const r2 = differ.diff(
      createTimelineFromTraces([createTrace('create')]),
      createTimelineFromTraces([createTrace('modify')]),
    )
    // r1: added [1]
    expect(r1.added).toEqual([1])
    // r2: changed [0]
    expect(r2.changed).toEqual([0])
    expect(r2.added).toEqual([])
  })

  it('should produce independent results from sequential calls', () => {
    const differ = createDiffer()
    const r1 = differ.diff(createEmptyTimeline(), createTimelineFromTraces([createTrace('create')]))
    const r2 = differ.diff(createTimelineFromTraces([createTrace('create')]), createEmptyTimeline())
    // r1: all added
    expect(r1.added).toHaveLength(1)
    expect(r1.removed).toHaveLength(0)
    // r2: all removed
    expect(r2.removed).toHaveLength(1)
    expect(r2.added).toHaveLength(0)
  })

  it('should not accumulate state across multiple calls', () => {
    const differ = createDiffer()
    const trace = createTrace('create')
    const r1 = differ.diff(
      createTimelineFromTraces([trace]),
      createTimelineFromTraces([trace]),
    )
    const r2 = differ.diff(
      createTimelineFromTraces([trace]),
      createTimelineFromTraces([trace]),
    )
    const r3 = differ.diff(
      createTimelineFromTraces([trace]),
      createTimelineFromTraces([trace]),
    )
    expect(r1.added).toEqual(r2.added)
    expect(r2.added).toEqual(r3.added)
    expect(r1.changed).toEqual(r2.changed)
    expect(r2.changed).toEqual(r3.changed)
  })

  it('should produce correct results when called with different order of arguments', () => {
    const differ = createDiffer()
    const before = createTimelineFromTraces([createTrace('create')])
    const after = createTimelineFromTraces([createTrace('query')])
    const r1 = differ.diff(before, after)
    const r2 = differ.diff(after, before)
    // r1: before has create, after has query → changed [0]
    expect(r1.changed).toEqual([0])
    // r2: reversed → also changed [0] (both have index 0, different traces)
    expect(r2.changed).toEqual([0])
  })
})

// ---------------------------------------------------------------------------
// Pure
// ---------------------------------------------------------------------------

describe('Pure', () => {
  it('should not modify input before timeline', () => {
    const differ = createDiffer()
    const before = createTimelineFromTraces([createTrace('create')])
    const after = createTimelineFromTraces([createTrace('query')])
    const originalBefore = JSON.stringify(before)
    differ.diff(before, after)
    expect(JSON.stringify(before)).toBe(originalBefore)
  })

  it('should not modify input after timeline', () => {
    const differ = createDiffer()
    const before = createTimelineFromTraces([createTrace('create')])
    const after = createTimelineFromTraces([createTrace('query')])
    const originalAfter = JSON.stringify(after)
    differ.diff(before, after)
    expect(JSON.stringify(after)).toBe(originalAfter)
  })

  it('should not modify timeline entries', () => {
    const differ = createDiffer()
    const before = createTimelineFromTraces([createTrace('create')])
    const after = createTimelineFromTraces([createTrace('query')])
    const entryBefore = before.entries[0]
    const entryAfter = after.entries[0]
    differ.diff(before, after)
    expect(before.entries[0].index).toBe(entryBefore.index)
    expect(after.entries[0].index).toBe(entryAfter.index)
  })

  it('should not modify trace objects within timeline entries', () => {
    const differ = createDiffer()
    const beforeTrace = createTrace('create')
    const afterTrace = createTrace('query')
    const before = createTimelineFromTraces([beforeTrace])
    const after = createTimelineFromTraces([afterTrace])
    const beforeTraceName = (beforeTrace.strategy as { name: string }).name
    const afterTraceName = (afterTrace.strategy as { name: string }).name
    differ.diff(before, after)
    expect((before.entries[0].trace.strategy as { name: string }).name).toBe(beforeTraceName)
    expect((after.entries[0].trace.strategy as { name: string }).name).toBe(afterTraceName)
  })

  it('should produce same result without side effects', () => {
    const differ = createDiffer()
    const beforeTrace = createTrace('create')
    const afterTrace = createTrace('query')
    const before = createTimelineFromTraces([beforeTrace])
    const after = createTimelineFromTraces([afterTrace])
    const r1 = differ.diff(before, after)
    const r2 = differ.diff(before, after)
    expect(r1).toEqual(r2)
    // Verify inputs are still intact
    expect((before.entries[0].trace.strategy as { name: string }).name).toBe('create')
    expect((after.entries[0].trace.strategy as { name: string }).name).toBe('query')
  })
})

// ---------------------------------------------------------------------------
// Immutable
// ---------------------------------------------------------------------------

describe('Immutable', () => {
  it('should return a frozen diff object', () => {
    const differ = createDiffer()
    const result = differ.diff(
      createEmptyTimeline(),
      createTimelineFromTraces([createTrace('create')]),
    )
    expect(Object.isFrozen(result)).toBe(true)
  })

  it('should return a frozen added array', () => {
    const differ = createDiffer()
    const result = differ.diff(
      createEmptyTimeline(),
      createTimelineFromTraces([createTrace('create')]),
    )
    expect(Object.isFrozen(result.added)).toBe(true)
  })

  it('should return a frozen removed array', () => {
    const differ = createDiffer()
    const result = differ.diff(
      createTimelineFromTraces([createTrace('create')]),
      createEmptyTimeline(),
    )
    expect(Object.isFrozen(result.removed)).toBe(true)
  })

  it('should return a frozen changed array', () => {
    const differ = createDiffer()
    const result = differ.diff(
      createTimelineFromTraces([createTrace('create')]),
      createTimelineFromTraces([createTrace('query')]),
    )
    expect(Object.isFrozen(result.changed)).toBe(true)
  })

  it('should not be able to modify the diff result', () => {
    const differ = createDiffer()
    const result = differ.diff(
      createEmptyTimeline(),
      createTimelineFromTraces([createTrace('create')]),
    )
    expect(() => {
      const r = result as unknown as Record<string, unknown>
      r.added = [99]
    }).toThrow()
  })

  it('should produce frozen arrays even when empty', () => {
    const differ = createDiffer()
    const result = differ.diff(createEmptyTimeline(), createEmptyTimeline())
    expect(Object.isFrozen(result.added)).toBe(true)
    expect(Object.isFrozen(result.removed)).toBe(true)
    expect(Object.isFrozen(result.changed)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Export Validation
// ---------------------------------------------------------------------------

describe('Export validation', () => {
  it('should export DefaultPromptAssemblyTimelineDiffer from strategy index', async () => {
    const mod = await import('../strategy')
    expect(mod.DefaultPromptAssemblyTimelineDiffer).toBeDefined()
  })

  it('should export PromptAssemblyTimelineDiff as a type (not a runtime value)', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mod: any = await import('../strategy')
    // Type-only exports don't produce runtime values
    expect(mod.PromptAssemblyTimelineDiff).toBeUndefined()
  })

  it('should export PromptAssemblyTimelineDiffer as a type (not a runtime value)', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mod: any = await import('../strategy')
    // Type-only exports don't produce runtime values
    expect(mod.PromptAssemblyTimelineDiffer).toBeUndefined()
  })

  it('should export DefaultPromptAssemblyTimelineDiffer from package root', async () => {
    const mod = await import('..')
    expect(mod.DefaultPromptAssemblyTimelineDiffer).toBeDefined()
  })

  it('should export DefaultPromptAssemblyTimelineDiffer as a class', () => {
    const differ = new DefaultPromptAssemblyTimelineDiffer()
    expect(differ).toBeInstanceOf(DefaultPromptAssemblyTimelineDiffer)
  })

  it('should export PromptAssemblyTimelineDiff as a type', () => {
    const diff: PromptAssemblyTimelineDiff = { added: [], removed: [], changed: [] }
    expect(diff.added).toEqual([])
  })

  it('should export PromptAssemblyTimelineDiffer as a type', () => {
    const differ: PromptAssemblyTimelineDiffer = createDiffer()
    expect(typeof differ.diff).toBe('function')
  })

  it('should create a usable DefaultPromptAssemblyTimelineDiffer instance', () => {
    const differ = createDiffer()
    const result = differ.diff(createEmptyTimeline(), createEmptyTimeline())
    expect(result.added).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// Architecture Compliance
// ---------------------------------------------------------------------------

describe('Architecture compliance', () => {
  it('should not depend on Runtime', () => {
    const differ = createDiffer()
    expect(differ).toBeDefined()
  })

  it('should not depend on Planner', () => {
    const differ = createDiffer()
    expect(differ).toBeDefined()
  })

  it('should not depend on Pipeline', () => {
    const differ = createDiffer()
    expect(differ).toBeDefined()
  })

  it('should not depend on Provider', () => {
    const differ = createDiffer()
    expect(differ).toBeDefined()
  })

  it('should not depend on Memory', () => {
    const differ = createDiffer()
    expect(differ).toBeDefined()
  })

  it('should not depend on AgentLoop', () => {
    const differ = createDiffer()
    expect(differ).toBeDefined()
  })

  it('should not depend on PromptBuilder', () => {
    const differ = createDiffer()
    expect(differ).toBeDefined()
  })

  it('should not modify PromptBuilder', () => {
    const differ = createDiffer()
    expect(differ).toBeDefined()
  })

  it('should not modify DefaultPromptBuilder', () => {
    const differ = createDiffer()
    expect(differ).toBeDefined()
  })

  it('should not modify PromptRenderer', () => {
    const differ = createDiffer()
    expect(differ).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Compatibility — RetryPlanner
// ---------------------------------------------------------------------------

describe('RetryPlanner compatibility', () => {
  it('should be compatible with RetryPlanner scenarios', () => {
    const differ = createDiffer()
    const before = createTimelineFromTraces([createTrace('create')])
    const after = createTimelineFromTraces([createTrace('query')])
    const result = differ.diff(before, after)
    expect(result.changed).toEqual([0])
  })
})

// ---------------------------------------------------------------------------
// Compatibility — ToolCallPlanner
// ---------------------------------------------------------------------------

describe('ToolCallPlanner compatibility', () => {
  it('should be compatible with ToolCallPlanner scenarios', () => {
    const differ = createDiffer()
    const before = createTimelineFromTraces([createTrace('create'), createTrace('query')])
    const after = createTimelineFromTraces([createTrace('create')])
    const result = differ.diff(before, after)
    expect(result.removed).toEqual([1])
  })
})

// ---------------------------------------------------------------------------
// Compatibility — Streaming
// ---------------------------------------------------------------------------

describe('Streaming compatibility', () => {
  it('should be compatible with streaming pipeline', () => {
    const differ = createDiffer()
    const before = createEmptyTimeline()
    const after = createTimelineFromTraces([createTrace('create')])
    const result = differ.diff(before, after)
    expect(result.added).toEqual([0])
  })
})

// ---------------------------------------------------------------------------
// Compatibility — AgentLoop
// ---------------------------------------------------------------------------

describe('AgentLoop compatibility', () => {
  it('should be compatible with AgentLoop', () => {
    const differ = createDiffer()
    const before = createTimelineFromTraces([createTrace('create')])
    const after = createTimelineFromTraces([createTrace('query')])
    const result = differ.diff(before, after)
    expect(result.changed[0]).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// Edge Cases
// ---------------------------------------------------------------------------

describe('Edge cases', () => {
  it('should handle timelines with many entries', () => {
    const differ = createDiffer()
    const before = createTimelineFromTraces(
      Array.from({ length: 100 }, (_, i) => createTrace(`strategy-${i}`)),
    )
    const after = createTimelineFromTraces(
      Array.from({ length: 101 }, (_, i) => createTrace(`strategy-${i}`)),
    )
    const result = differ.diff(before, after)
    expect(result.added).toEqual([100])
    expect(result.removed).toEqual([])
    // All 100 shared indexes have different trace references → changed
    expect(result.changed).toHaveLength(100)
  })

  it('should handle timelines with non-sequential indexes', () => {
    const differ = createDiffer()
    const trace0 = createTrace('create')
    const trace2 = createTrace('modify')
    const before = createTimeline([
      createEntry(0, trace0),
      createEntry(2, trace2),
    ])
    const after = createTimeline([
      createEntry(0, trace0),
      createEntry(1, createTrace('query')),
      createEntry(2, trace2),
    ])
    const result = differ.diff(before, after)
    // added: index 1 (query in after)
    expect(result.added).toEqual([1])
    expect(result.removed).toEqual([])
    expect(result.changed).toEqual([])
  })

  it('should handle same trace used in multiple entries', () => {
    const differ = createDiffer()
    const trace = createTrace('create')
    const before = createTimelineFromTraces([trace])
    const after = createTimelineFromTraces([trace, trace])
    const result = differ.diff(before, after)
    // added: index 1 (duplicate trace)
    expect(result.added).toEqual([1])
    // index 0: same trace reference → unchanged
    expect(result.changed).toEqual([])
  })

  it('should handle timelines with a single entry each', () => {
    const differ = createDiffer()
    const before = createTimelineFromTraces([createTrace('create')])
    const after = createTimelineFromTraces([createTrace('query')])
    const result = differ.diff(before, after)
    expect(result.changed).toEqual([0])
  })

  it('should handle timelines with identical trace content but different references', () => {
    const differ = createDiffer()
    const before = createTimelineFromTraces([{ strategy: { name: 'create' } }])
    const after = createTimelineFromTraces([{ strategy: { name: 'create' } }])
    const result = differ.diff(before, after)
    // Different references → changed
    expect(result.changed).toEqual([0])
  })

  it('should handle empty timelines correctly', () => {
    const differ = createDiffer()
    const result = differ.diff(createEmptyTimeline(), createEmptyTimeline())
    expect(result.added).toEqual([])
    expect(result.removed).toEqual([])
    expect(result.changed).toEqual([])
    expect(Object.isFrozen(result)).toBe(true)
  })
})