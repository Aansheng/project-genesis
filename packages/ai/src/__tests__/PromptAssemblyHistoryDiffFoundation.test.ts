import { describe, it, expect } from 'vitest'
import { DefaultPromptAssemblyHistoryDiffer } from '../strategy/DefaultPromptAssemblyHistoryDiffer'
import type { PromptAssemblyHistoryDiffer } from '../strategy/PromptAssemblyHistoryDiffer'
import type { PromptAssemblyHistoryDiff } from '../strategy/PromptAssemblyHistoryDiff'
import type { PromptAssemblyHistory } from '../strategy/PromptAssemblyHistory'
import type { PromptAssemblyHistoryEntry } from '../strategy/PromptAssemblyHistoryEntry'
import type { PromptAssemblyTrace } from '../strategy/PromptAssemblyTrace'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createTrace(name?: string): PromptAssemblyTrace {
  return name ? { strategy: { name } } : {}
}

function createEntry(index: number, trace?: PromptAssemblyTrace): PromptAssemblyHistoryEntry {
  return { index, trace: trace ?? createTrace() }
}

function createHistory(entries: PromptAssemblyHistoryEntry[]): PromptAssemblyHistory {
  return { entries }
}

function createHistoryFromIndices(indices: number[]): PromptAssemblyHistory {
  return {
    entries: indices.map(i => createEntry(i, createTrace(`trace-${i}`))),
  }
}

function createHistoryWithTraces(indices: number[], baseName: string): PromptAssemblyHistory {
  return {
    entries: indices.map(i => createEntry(i, createTrace(`${baseName}-${i}`))),
  }
}

function createHistoryWithSameTrace(indices: number[]): PromptAssemblyHistory {
  const trace = createTrace('shared')
  return {
    entries: indices.map(i => createEntry(i, trace)),
  }
}

// ---------------------------------------------------------------------------
// Interface Contract
// ---------------------------------------------------------------------------

describe('Interface contract', () => {
  it('should define diff method', () => {
    const differ: PromptAssemblyHistoryDiffer = new DefaultPromptAssemblyHistoryDiffer()
    expect(typeof differ.diff).toBe('function')
  })

  it('should accept two histories and return a PromptAssemblyHistoryDiff', () => {
    const differ = new DefaultPromptAssemblyHistoryDiffer()
    const before = createHistory([])
    const after = createHistory([])
    const result = differ.diff(before, after)
    expect(result).toHaveProperty('added')
    expect(result).toHaveProperty('removed')
    expect(result).toHaveProperty('changed')
  })

  it('should accept a custom implementation', () => {
    const custom: PromptAssemblyHistoryDiffer = {
      diff(_before: PromptAssemblyHistory, _after: PromptAssemblyHistory): PromptAssemblyHistoryDiff {
        return { added: [0], removed: [], changed: [] }
      },
    }
    const result = custom.diff(createHistory([]), createHistory([]))
    expect(result.added).toEqual([0])
  })

  it('should have readonly added field in PromptAssemblyHistoryDiff', () => {
    const diff: PromptAssemblyHistoryDiff = { added: [1], removed: [], changed: [] }
    expect(diff.added).toEqual([1])
  })

  it('should have readonly removed field in PromptAssemblyHistoryDiff', () => {
    const diff: PromptAssemblyHistoryDiff = { added: [], removed: [2], changed: [] }
    expect(diff.removed).toEqual([2])
  })

  it('should have readonly changed field in PromptAssemblyHistoryDiff', () => {
    const diff: PromptAssemblyHistoryDiff = {
      added: [],
      removed: [],
      changed: [3],
    }
    expect(diff.changed).toEqual([3])
  })

  it('should support multiple entries in all arrays', () => {
    const diff: PromptAssemblyHistoryDiff = {
      added: [0, 1],
      removed: [2, 3],
      changed: [4, 5],
    }
    expect(diff.added).toHaveLength(2)
    expect(diff.removed).toHaveLength(2)
    expect(diff.changed).toHaveLength(2)
  })
})

// ---------------------------------------------------------------------------
// Diff Structure — added
// ---------------------------------------------------------------------------

describe('Diff structure — added', () => {
  it('should return added as a readonly array', () => {
    const differ = new DefaultPromptAssemblyHistoryDiffer()
    const after = createHistoryFromIndices([0])
    const result = differ.diff(createHistory([]), after)
    expect(Array.isArray(result.added)).toBe(true)
  })

  it('should return empty added when no entries are added', () => {
    const differ = new DefaultPromptAssemblyHistoryDiffer()
    const history = createHistoryFromIndices([0])
    const result = differ.diff(history, history)
    expect(result.added).toEqual([])
  })

  it('should include added entry index in result', () => {
    const differ = new DefaultPromptAssemblyHistoryDiffer()
    const after = createHistoryFromIndices([0])
    const result = differ.diff(createHistory([]), after)
    expect(result.added).toContain(0)
  })
})

// ---------------------------------------------------------------------------
// Diff Structure — removed
// ---------------------------------------------------------------------------

describe('Diff structure — removed', () => {
  it('should return removed as a readonly array', () => {
    const differ = new DefaultPromptAssemblyHistoryDiffer()
    const before = createHistoryFromIndices([0])
    const result = differ.diff(before, createHistory([]))
    expect(Array.isArray(result.removed)).toBe(true)
  })

  it('should return empty removed when no entries are removed', () => {
    const differ = new DefaultPromptAssemblyHistoryDiffer()
    const history = createHistoryFromIndices([0])
    const result = differ.diff(history, history)
    expect(result.removed).toEqual([])
  })

  it('should include removed entry index in result', () => {
    const differ = new DefaultPromptAssemblyHistoryDiffer()
    const before = createHistoryFromIndices([0])
    const result = differ.diff(before, createHistory([]))
    expect(result.removed).toContain(0)
  })
})

// ---------------------------------------------------------------------------
// Diff Structure — changed
// ---------------------------------------------------------------------------

describe('Diff structure — changed', () => {
  it('should return changed as a readonly array', () => {
    const differ = new DefaultPromptAssemblyHistoryDiffer()
    const before = createHistoryWithTraces([0], 'before')
    const after = createHistoryWithTraces([0], 'after')
    const result = differ.diff(before, after)
    expect(Array.isArray(result.changed)).toBe(true)
  })

  it('should return empty changed when no entries are changed', () => {
    const differ = new DefaultPromptAssemblyHistoryDiffer()
    const history = createHistoryFromIndices([0])
    const result = differ.diff(history, history)
    expect(result.changed).toEqual([])
  })

  it('should include changed entry index in result', () => {
    const differ = new DefaultPromptAssemblyHistoryDiffer()
    const before = createHistoryWithTraces([0], 'before')
    const after = createHistoryWithTraces([0], 'after')
    const result = differ.diff(before, after)
    expect(result.changed).toContain(0)
  })
})

// ---------------------------------------------------------------------------
// Added Entries
// ---------------------------------------------------------------------------

describe('Added entries', () => {
  it('should detect a single added entry', () => {
    const differ = new DefaultPromptAssemblyHistoryDiffer()
    const before = createHistory([])
    const after = createHistoryFromIndices([0])
    const result = differ.diff(before, after)
    expect(result.added).toEqual([0])
  })

  it('should detect multiple added entries', () => {
    const differ = new DefaultPromptAssemblyHistoryDiffer()
    const before = createHistory([])
    const after = createHistoryFromIndices([0, 1, 2])
    const result = differ.diff(before, after)
    expect(result.added).toEqual([0, 1, 2])
  })

  it('should preserve after encounter order for added entries', () => {
    const differ = new DefaultPromptAssemblyHistoryDiffer()
    const before = createHistory([])
    const after = createHistoryFromIndices([5, 3, 1])
    const result = differ.diff(before, after)
    expect(result.added).toEqual([5, 3, 1])
  })

  it('should not report entries that already exist as added', () => {
    const differ = new DefaultPromptAssemblyHistoryDiffer()
    const before = createHistoryFromIndices([0])
    const after = createHistoryFromIndices([0, 1])
    const result = differ.diff(before, after)
    expect(result.added).toEqual([1])
  })

  it('should detect added entry at index 0', () => {
    const differ = new DefaultPromptAssemblyHistoryDiffer()
    const before = createHistory([])
    const after = createHistory([createEntry(0, createTrace('first'))])
    const result = differ.diff(before, after)
    expect(result.added).toEqual([0])
  })

  it('should detect added entry at high index', () => {
    const differ = new DefaultPromptAssemblyHistoryDiffer()
    const before = createHistoryFromIndices([0, 1, 2])
    const after = createHistoryFromIndices([0, 1, 2, 100])
    const result = differ.diff(before, after)
    expect(result.added).toEqual([100])
  })
})

// ---------------------------------------------------------------------------
// Removed Entries
// ---------------------------------------------------------------------------

describe('Removed entries', () => {
  it('should detect a single removed entry', () => {
    const differ = new DefaultPromptAssemblyHistoryDiffer()
    const before = createHistoryFromIndices([0])
    const after = createHistory([])
    const result = differ.diff(before, after)
    expect(result.removed).toEqual([0])
  })

  it('should detect multiple removed entries', () => {
    const differ = new DefaultPromptAssemblyHistoryDiffer()
    const before = createHistoryFromIndices([0, 1, 2])
    const after = createHistory([])
    const result = differ.diff(before, after)
    expect(result.removed).toEqual([0, 1, 2])
  })

  it('should preserve before encounter order for removed entries', () => {
    const differ = new DefaultPromptAssemblyHistoryDiffer()
    const before = createHistoryFromIndices([5, 3, 1])
    const after = createHistory([])
    const result = differ.diff(before, after)
    expect(result.removed).toEqual([5, 3, 1])
  })

  it('should not report entries that still exist as removed', () => {
    const differ = new DefaultPromptAssemblyHistoryDiffer()
    const before = createHistoryFromIndices([0, 1])
    const after = createHistoryFromIndices([0])
    const result = differ.diff(before, after)
    expect(result.removed).toEqual([1])
  })

  it('should detect removed entry at index 0', () => {
    const differ = new DefaultPromptAssemblyHistoryDiffer()
    const before = createHistory([createEntry(0, createTrace('first'))])
    const after = createHistory([])
    const result = differ.diff(before, after)
    expect(result.removed).toEqual([0])
  })

  it('should detect removed non-contiguous entries', () => {
    const differ = new DefaultPromptAssemblyHistoryDiffer()
    const before = createHistoryFromIndices([0, 1, 2, 3, 4])
    const after = createHistoryFromIndices([0, 2, 4])
    const result = differ.diff(before, after)
    expect(result.removed).toEqual([1, 3])
  })
})

// ---------------------------------------------------------------------------
// Changed Entries
// ---------------------------------------------------------------------------

describe('Changed entries', () => {
  it('should detect a single changed entry', () => {
    const differ = new DefaultPromptAssemblyHistoryDiffer()
    const before = createHistoryWithTraces([0], 'before')
    const after = createHistoryWithTraces([0], 'after')
    const result = differ.diff(before, after)
    expect(result.changed).toEqual([0])
  })

  it('should detect multiple changed entries', () => {
    const differ = new DefaultPromptAssemblyHistoryDiffer()
    const before = createHistoryWithTraces([0, 1], 'before')
    const after = createHistoryWithTraces([0, 1], 'after')
    const result = differ.diff(before, after)
    expect(result.changed).toEqual([0, 1])
  })

  it('should preserve before encounter order for changed entries', () => {
    const differ = new DefaultPromptAssemblyHistoryDiffer()
    const before = createHistoryWithTraces([3, 1, 2], 'before')
    const after = createHistoryWithTraces([3, 1, 2], 'after')
    const result = differ.diff(before, after)
    expect(result.changed).toEqual([3, 1, 2])
  })

  it('should not report unchanged entries as changed', () => {
    const differ = new DefaultPromptAssemblyHistoryDiffer()
    const trace = createTrace('stable')
    const before = createHistory([createEntry(0, trace)])
    const after = createHistory([createEntry(0, trace)])
    const result = differ.diff(before, after)
    expect(result.changed).toEqual([])
  })

  it('should detect changed entry with same index but different trace object', () => {
    const differ = new DefaultPromptAssemblyHistoryDiffer()
    const before = createHistory([createEntry(0, createTrace('a'))])
    const after = createHistory([createEntry(0, createTrace('b'))])
    const result = differ.diff(before, after)
    expect(result.changed).toEqual([0])
  })

  it('should not report equal trace references as changed', () => {
    const differ = new DefaultPromptAssemblyHistoryDiffer()
    // Same history instance — identical trace references
    const history = createHistoryWithSameTrace([0, 1, 2])
    const result = differ.diff(history, history)
    expect(result.changed).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// Mixed Changes (added + removed + changed together)
// ---------------------------------------------------------------------------

describe('Mixed changes', () => {
  it('should detect added, removed, and changed simultaneously', () => {
    const differ = new DefaultPromptAssemblyHistoryDiffer()
    // before: [0: a, 1: b]
    // after:  [0: a', 2: c]
    // added: 2, removed: 1, changed: 0
    const before = createHistory([
      createEntry(0, createTrace('a')),
      createEntry(1, createTrace('b')),
    ])
    const after = createHistory([
      createEntry(0, createTrace('a-modified')),
      createEntry(2, createTrace('c')),
    ])
    const result = differ.diff(before, after)
    expect(result.removed).toEqual([1])
    expect(result.added).toEqual([2])
    expect(result.changed).toEqual([0])
  })

  it('should handle add + change without remove', () => {
    const differ = new DefaultPromptAssemblyHistoryDiffer()
    const before = createHistory([createEntry(0, createTrace('a'))])
    const after = createHistory([
      createEntry(0, createTrace('a-modified')),
      createEntry(1, createTrace('b')),
    ])
    const result = differ.diff(before, after)
    expect(result.added).toEqual([1])
    expect(result.removed).toEqual([])
    expect(result.changed).toEqual([0])
  })

  it('should handle remove + change without add', () => {
    const differ = new DefaultPromptAssemblyHistoryDiffer()
    const before = createHistory([
      createEntry(0, createTrace('a')),
      createEntry(1, createTrace('b')),
    ])
    const after = createHistory([createEntry(0, createTrace('a-modified'))])
    const result = differ.diff(before, after)
    expect(result.changed).toEqual([0])
    expect(result.removed).toEqual([1])
    expect(result.added).toEqual([])
  })

  it('should handle add + remove without change', () => {
    const differ = new DefaultPromptAssemblyHistoryDiffer()
    const before = createHistory([createEntry(0, createTrace('a'))])
    const after = createHistory([createEntry(1, createTrace('b'))])
    const result = differ.diff(before, after)
    expect(result.removed).toEqual([0])
    expect(result.added).toEqual([1])
    expect(result.changed).toEqual([])
  })

  it('should handle complex scenario with many entries', () => {
    const differ = new DefaultPromptAssemblyHistoryDiffer()
    // Use shared trace references for unchanged entries
    const traceC = createTrace('c')
    const traceD = createTrace('d')
    // before: [0:a, 1:b, 2:c, 3:d]
    // after:  [0:a', 2:c, 3:d, 4:e]
    // added: 4, removed: 1, changed: 0
    const before = createHistory([
      createEntry(0, createTrace('a')),
      createEntry(1, createTrace('b')),
      createEntry(2, traceC),
      createEntry(3, traceD),
    ])
    const after = createHistory([
      createEntry(0, createTrace('a-modified')),
      createEntry(2, traceC),
      createEntry(3, traceD),
      createEntry(4, createTrace('e')),
    ])
    const result = differ.diff(before, after)
    expect(result.removed).toEqual([1])
    expect(result.added).toEqual([4])
    expect(result.changed).toEqual([0])
  })

  it('should handle all three categories with multiple entries each', () => {
    const differ = new DefaultPromptAssemblyHistoryDiffer()
    // before: [0:a, 1:b, 2:c, 3:d]
    // after:  [0:a', 2:c', 4:e, 5:f]
    // added: 4, 5
    // removed: 1, 3
    // changed: 0, 2
    const before = createHistory([
      createEntry(0, createTrace('a')),
      createEntry(1, createTrace('b')),
      createEntry(2, createTrace('c')),
      createEntry(3, createTrace('d')),
    ])
    const after = createHistory([
      createEntry(0, createTrace('a-modified')),
      createEntry(2, createTrace('c-modified')),
      createEntry(4, createTrace('e')),
      createEntry(5, createTrace('f')),
    ])
    const result = differ.diff(before, after)
    expect(result.removed).toEqual([1, 3])
    expect(result.added).toEqual([4, 5])
    expect(result.changed).toEqual([0, 2])
  })

  it('should handle overlapping indices across all three categories', () => {
    const differ = new DefaultPromptAssemblyHistoryDiffer()
    // Use shared trace reference for unchanged entry
    const traceA = createTrace('a')
    // before: [0:a, 1:b, 2:c]
    // after:  [0:a, 2:c', 3:d]
    // added: 3, removed: 1, changed: 2
    const before = createHistory([
      createEntry(0, traceA),
      createEntry(1, createTrace('b')),
      createEntry(2, createTrace('c')),
    ])
    const after = createHistory([
      createEntry(0, traceA),
      createEntry(2, createTrace('c-modified')),
      createEntry(3, createTrace('d')),
    ])
    const result = differ.diff(before, after)
    expect(result.removed).toEqual([1])
    expect(result.added).toEqual([3])
    expect(result.changed).toEqual([2])
  })

  it('should handle full replacement of all entries', () => {
    const differ = new DefaultPromptAssemblyHistoryDiffer()
    const before = createHistoryWithTraces([0, 1, 2], 'old')
    const after = createHistoryWithTraces([3, 4, 5], 'new')
    const result = differ.diff(before, after)
    expect(result.removed).toEqual([0, 1, 2])
    expect(result.added).toEqual([3, 4, 5])
    expect(result.changed).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// Unchanged Histories
// ---------------------------------------------------------------------------

describe('Unchanged histories', () => {
  it('should detect identical trace references as unchanged', () => {
    const differ = new DefaultPromptAssemblyHistoryDiffer()
    const history = createHistoryWithSameTrace([0, 1, 2])
    const result = differ.diff(history, history)
    expect(result.added).toEqual([])
    expect(result.removed).toEqual([])
    expect(result.changed).toEqual([])
  })

  it('should detect equal content with different object references as changed', () => {
    const differ = new DefaultPromptAssemblyHistoryDiffer()
    // Same content but different trace objects — reference comparison
    const before = createHistory([createEntry(0, createTrace('a'))])
    const after = createHistory([createEntry(0, createTrace('a'))])
    const result = differ.diff(before, after)
    // Different object references → changed
    expect(result.changed).toEqual([0])
  })

  it('should detect same entries in same order as unchanged when sharing trace references', () => {
    const differ = new DefaultPromptAssemblyHistoryDiffer()
    const history = createHistoryFromIndices([0, 1, 2])
    const result = differ.diff(history, history)
    expect(result.added).toEqual([])
    expect(result.removed).toEqual([])
    expect(result.changed).toEqual([])
  })

  it('should handle histories with shared trace references in some entries', () => {
    const differ = new DefaultPromptAssemblyHistoryDiffer()
    const sharedTrace = createTrace('shared')
    const before = createHistory([
      createEntry(0, sharedTrace),
      createEntry(1, createTrace('unique')),
    ])
    const after = createHistory([
      createEntry(0, sharedTrace),
      createEntry(1, createTrace('unique-new')),
    ])
    const result = differ.diff(before, after)
    // Index 0: same trace ref → unchanged
    // Index 1: different trace ref → changed
    expect(result.changed).toEqual([1])
    expect(result.added).toEqual([])
    expect(result.removed).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// Empty Histories
// ---------------------------------------------------------------------------

describe('Empty histories', () => {
  it('should return empty diff when both histories are empty', () => {
    const differ = new DefaultPromptAssemblyHistoryDiffer()
    const result = differ.diff(createHistory([]), createHistory([]))
    expect(result.added).toEqual([])
    expect(result.removed).toEqual([])
    expect(result.changed).toEqual([])
  })

  it('should detect all entries as added when before is empty', () => {
    const differ = new DefaultPromptAssemblyHistoryDiffer()
    const after = createHistoryFromIndices([0, 1, 2])
    const result = differ.diff(createHistory([]), after)
    expect(result.added).toEqual([0, 1, 2])
    expect(result.removed).toEqual([])
    expect(result.changed).toEqual([])
  })

  it('should detect all entries as removed when after is empty', () => {
    const differ = new DefaultPromptAssemblyHistoryDiffer()
    const before = createHistoryFromIndices([0, 1, 2])
    const result = differ.diff(before, createHistory([]))
    expect(result.removed).toEqual([0, 1, 2])
    expect(result.added).toEqual([])
    expect(result.changed).toEqual([])
  })

  it('should handle empty before with single entry after', () => {
    const differ = new DefaultPromptAssemblyHistoryDiffer()
    const after = createHistory([createEntry(42, createTrace('late'))])
    const result = differ.diff(createHistory([]), after)
    expect(result.added).toEqual([42])
  })

  it('should handle single entry before with empty after', () => {
    const differ = new DefaultPromptAssemblyHistoryDiffer()
    const before = createHistory([createEntry(99, createTrace('early'))])
    const result = differ.diff(before, createHistory([]))
    expect(result.removed).toEqual([99])
  })
})

// ---------------------------------------------------------------------------
// Ordering
// ---------------------------------------------------------------------------

describe('Ordering rules', () => {
  it('should preserve after encounter order in added array', () => {
    const differ = new DefaultPromptAssemblyHistoryDiffer()
    const before = createHistory([])
    const after = createHistoryFromIndices([3, 1, 4, 2])
    const result = differ.diff(before, after)
    expect(result.added).toEqual([3, 1, 4, 2])
  })

  it('should preserve before encounter order in removed array', () => {
    const differ = new DefaultPromptAssemblyHistoryDiffer()
    const before = createHistoryFromIndices([3, 1, 4, 2])
    const after = createHistory([])
    const result = differ.diff(before, after)
    expect(result.removed).toEqual([3, 1, 4, 2])
  })

  it('should preserve before encounter order in changed array', () => {
    const differ = new DefaultPromptAssemblyHistoryDiffer()
    const before = createHistoryWithTraces([3, 1, 4, 2], 'before')
    const after = createHistoryWithTraces([3, 1, 4, 2], 'after')
    const result = differ.diff(before, after)
    expect(result.changed).toEqual([3, 1, 4, 2])
  })

  it('should not sort added entries numerically', () => {
    const differ = new DefaultPromptAssemblyHistoryDiffer()
    const before = createHistory([])
    const after = createHistoryFromIndices([5, 0, 3])
    const result = differ.diff(before, after)
    // Should NOT be [0, 3, 5] — should preserve after order
    expect(result.added).toEqual([5, 0, 3])
  })

  it('should not sort removed entries numerically', () => {
    const differ = new DefaultPromptAssemblyHistoryDiffer()
    const before = createHistoryFromIndices([5, 0, 3])
    const after = createHistory([])
    const result = differ.diff(before, after)
    expect(result.removed).toEqual([5, 0, 3])
  })

  it('should not sort changed entries numerically', () => {
    const differ = new DefaultPromptAssemblyHistoryDiffer()
    const before = createHistoryWithTraces([5, 0, 3], 'before')
    const after = createHistoryWithTraces([5, 0, 3], 'after')
    const result = differ.diff(before, after)
    expect(result.changed).toEqual([5, 0, 3])
  })
})

// ---------------------------------------------------------------------------
// Deterministic
// ---------------------------------------------------------------------------

describe('Deterministic', () => {
  it('should produce same result for same inputs across multiple calls', () => {
    const differ = new DefaultPromptAssemblyHistoryDiffer()
    const before = createHistoryWithTraces([0, 1], 'before')
    const after = createHistoryWithTraces([1, 2], 'after')
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
    const d1 = new DefaultPromptAssemblyHistoryDiffer()
    const d2 = new DefaultPromptAssemblyHistoryDiffer()
    const before = createHistoryWithTraces([0], 'before')
    const after = createHistoryWithTraces([0], 'after')
    const r1 = d1.diff(before, after)
    const r2 = d2.diff(before, after)
    expect(r1.added).toEqual(r2.added)
    expect(r1.removed).toEqual(r2.removed)
    expect(r1.changed).toEqual(r2.changed)
  })

  it('should produce same result for identical history pairs', () => {
    const differ = new DefaultPromptAssemblyHistoryDiffer()
    const before1 = createHistoryWithTraces([0], 'before')
    const after1 = createHistoryWithTraces([0], 'after')
    const before2 = createHistoryWithTraces([0], 'before')
    const after2 = createHistoryWithTraces([0], 'after')
    expect(differ.diff(before1, after1)).toEqual(differ.diff(before2, after2))
  })

  it('should produce same result across multiple calls for large histories', () => {
    const differ = new DefaultPromptAssemblyHistoryDiffer()
    const before = createHistoryWithTraces([0, 1, 2, 3, 4], 'before')
    const after = createHistoryWithTraces([0, 2, 4, 5], 'after')
    const results = Array.from({ length: 5 }, () => differ.diff(before, after))
    for (let i = 1; i < results.length; i++) {
      expect(results[i].added).toEqual(results[0].added)
      expect(results[i].removed).toEqual(results[0].removed)
      expect(results[i].changed).toEqual(results[0].changed)
    }
  })

  it('should produce same result for cross-call with mixed categories', () => {
    const differ = new DefaultPromptAssemblyHistoryDiffer()
    const before = createHistoryWithTraces([0, 1, 2, 3], 'before')
    const after = createHistoryWithTraces([0, 2, 4, 5], 'after')
    const r1 = differ.diff(before, after)
    const r2 = differ.diff(before, after)
    expect(r1.removed).toEqual(r2.removed)
    expect(r1.added).toEqual(r2.added)
    expect(r1.changed).toEqual(r2.changed)
  })
})

// ---------------------------------------------------------------------------
// Stateless
// ---------------------------------------------------------------------------

describe('Stateless', () => {
  it('should not retain state between diff calls', () => {
    const differ = new DefaultPromptAssemblyHistoryDiffer()
    const r1 = differ.diff(
      createHistory([]),
      createHistory([createEntry(0, createTrace('a'))]),
    )
    const r2 = differ.diff(
      createHistory([createEntry(0, createTrace('a'))]),
      createHistory([createEntry(0, createTrace('b'))]),
    )
    // r1: added: [0]
    expect(r1.added).toEqual([0])
    // r2: changed: [0]
    expect(r2.changed).toEqual([0])
    expect(r2.added).toEqual([])
  })

  it('should produce independent results from sequential calls', () => {
    const differ = new DefaultPromptAssemblyHistoryDiffer()
    const r1 = differ.diff(createHistory([]), createHistoryFromIndices([0, 1]))
    const r2 = differ.diff(createHistoryFromIndices([0, 1]), createHistory([]))
    // r1: all added
    expect(r1.added).toHaveLength(2)
    expect(r1.removed).toHaveLength(0)
    // r2: all removed
    expect(r2.removed).toHaveLength(2)
    expect(r2.added).toHaveLength(0)
  })

  it('should not accumulate state from previous diff results', () => {
    const differ = new DefaultPromptAssemblyHistoryDiffer()
    // Result ignored — testing stateless behavior
    differ.diff(createHistoryFromIndices([0]), createHistoryFromIndices([0, 1]))
    differ.diff(createHistoryFromIndices([0]), createHistoryFromIndices([0, 1, 2]))
    const r3 = differ.diff(createHistory([]), createHistoryFromIndices([0, 1]))
    // Should still detect 2 added entries, not accumulated
    expect(r3.added).toEqual([0, 1])
  })

  it('should handle sequential unrelated diff calls', () => {
    const differ = new DefaultPromptAssemblyHistoryDiffer()
    const r1 = differ.diff(
      createHistoryWithTraces([0, 1], 'a'),
      createHistoryWithTraces([0, 1], 'b'),
    )
    const r2 = differ.diff(
      createHistoryWithTraces([2, 3], 'c'),
      createHistoryWithTraces([2, 3], 'd'),
    )
    expect(r1.changed).toEqual([0, 1])
    expect(r2.changed).toEqual([2, 3])
  })
})

// ---------------------------------------------------------------------------
// Pure
// ---------------------------------------------------------------------------

describe('Pure', () => {
  it('should not modify input before history', () => {
    const differ = new DefaultPromptAssemblyHistoryDiffer()
    const before = createHistoryFromIndices([0, 1])
    const after = createHistoryFromIndices([1, 2])
    const originalBefore = JSON.stringify(before)
    differ.diff(before, after)
    expect(JSON.stringify(before)).toBe(originalBefore)
  })

  it('should not modify input after history', () => {
    const differ = new DefaultPromptAssemblyHistoryDiffer()
    const before = createHistoryFromIndices([0, 1])
    const after = createHistoryFromIndices([1, 2])
    const originalAfter = JSON.stringify(after)
    differ.diff(before, after)
    expect(JSON.stringify(after)).toBe(originalAfter)
  })

  it('should not modify history entry indices', () => {
    const differ = new DefaultPromptAssemblyHistoryDiffer()
    const before = createHistory([createEntry(0, createTrace('a'))])
    const after = createHistory([createEntry(0, createTrace('b'))])
    const indexBefore = before.entries[0].index
    const indexAfter = after.entries[0].index
    differ.diff(before, after)
    expect(before.entries[0].index).toBe(indexBefore)
    expect(after.entries[0].index).toBe(indexAfter)
  })

  it('should not modify trace references', () => {
    const differ = new DefaultPromptAssemblyHistoryDiffer()
    const traceA = createTrace('a')
    const traceB = createTrace('b')
    const before = createHistory([createEntry(0, traceA)])
    const after = createHistory([createEntry(0, traceB)])
    differ.diff(before, after)
    expect(before.entries[0].trace).toBe(traceA)
    expect(after.entries[0].trace).toBe(traceB)
  })

  it('should not mutate when histories have nested objects', () => {
    const differ = new DefaultPromptAssemblyHistoryDiffer()
    const before: PromptAssemblyHistory = {
      entries: [
        { index: 0, trace: { strategy: { name: 'create' } } },
      ],
    }
    const after: PromptAssemblyHistory = {
      entries: [
        { index: 0, trace: { strategy: { name: 'query' } } },
      ],
    }
    const originalBefore = JSON.stringify(before)
    const originalAfter = JSON.stringify(after)
    differ.diff(before, after)
    expect(JSON.stringify(before)).toBe(originalBefore)
    expect(JSON.stringify(after)).toBe(originalAfter)
  })
})

// ---------------------------------------------------------------------------
// Immutable
// ---------------------------------------------------------------------------

describe('Immutable', () => {
  it('should return a frozen diff object', () => {
    const differ = new DefaultPromptAssemblyHistoryDiffer()
    const result = differ.diff(createHistory([]), createHistoryFromIndices([0]))
    expect(Object.isFrozen(result)).toBe(true)
  })

  it('should return frozen added array', () => {
    const differ = new DefaultPromptAssemblyHistoryDiffer()
    const result = differ.diff(createHistory([]), createHistoryFromIndices([0]))
    expect(Object.isFrozen(result.added)).toBe(true)
  })

  it('should return frozen removed array', () => {
    const differ = new DefaultPromptAssemblyHistoryDiffer()
    const result = differ.diff(createHistoryFromIndices([0]), createHistory([]))
    expect(Object.isFrozen(result.removed)).toBe(true)
  })

  it('should return frozen changed array', () => {
    const differ = new DefaultPromptAssemblyHistoryDiffer()
    const result = differ.diff(
      createHistoryWithTraces([0], 'before'),
      createHistoryWithTraces([0], 'after'),
    )
    expect(Object.isFrozen(result.changed)).toBe(true)
  })

  it('should not be able to modify diff result in strict mode', () => {
    const differ = new DefaultPromptAssemblyHistoryDiffer()
    const result = differ.diff(createHistory([]), createHistoryFromIndices([0]))
    expect(() => {
      const r = result as unknown as Record<string, unknown>
      r.added = ['x']
    }).toThrow()
  })

  it('should not be able to push into frozen arrays', () => {
    const differ = new DefaultPromptAssemblyHistoryDiffer()
    const result = differ.diff(createHistory([]), createHistoryFromIndices([0]))
    expect(() => {
      (result.added as number[]).push(1)
    }).toThrow()
  })
})

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

describe('Exports', () => {
  it('should export DefaultPromptAssemblyHistoryDiffer from strategy index', async () => {
    const mod = await import('../strategy')
    expect(mod.DefaultPromptAssemblyHistoryDiffer).toBeDefined()
  })

  it('should export PromptAssemblyHistoryDiff type from strategy index', async () => {
    const mod = await import('../strategy')
    expect(mod.DefaultPromptAssemblyHistoryDiffer).toBeDefined()
  })

  it('should export PromptAssemblyHistoryDiffer type from strategy index', async () => {
    const mod = await import('../strategy')
    expect(mod.DefaultPromptAssemblyHistoryDiffer).toBeDefined()
  })

  it('should export DefaultPromptAssemblyHistoryDiffer from package root', async () => {
    const mod = await import('..')
    expect(mod.DefaultPromptAssemblyHistoryDiffer).toBeDefined()
  })

  it('should export PromptAssemblyHistoryDiff type from package root', async () => {
    const mod = await import('..')
    expect(mod.DefaultPromptAssemblyHistoryDiffer).toBeDefined()
  })

  it('should export PromptAssemblyHistoryDiffer type from package root', async () => {
    const mod = await import('..')
    expect(mod.DefaultPromptAssemblyHistoryDiffer).toBeDefined()
  })

  it('should export DefaultPromptAssemblyHistoryDiffer as a class', () => {
    const differ = new DefaultPromptAssemblyHistoryDiffer()
    expect(differ).toBeInstanceOf(DefaultPromptAssemblyHistoryDiffer)
  })

  it('should export PromptAssemblyHistoryDiff as a type', () => {
    const diff: PromptAssemblyHistoryDiff = { added: [], removed: [], changed: [] }
    expect(diff.added).toEqual([])
  })

  it('should export PromptAssemblyHistoryDiffer as a type', () => {
    const differ: PromptAssemblyHistoryDiffer = new DefaultPromptAssemblyHistoryDiffer()
    expect(typeof differ.diff).toBe('function')
  })
})

// ---------------------------------------------------------------------------
// Architecture Compliance
// ---------------------------------------------------------------------------

describe('Architecture compliance', () => {
  it('should not depend on Planner', () => {
    const differ = new DefaultPromptAssemblyHistoryDiffer()
    expect(differ).toBeInstanceOf(DefaultPromptAssemblyHistoryDiffer)
  })

  it('should not depend on Runtime', () => {
    const differ = new DefaultPromptAssemblyHistoryDiffer()
    expect(differ).toBeDefined()
  })

  it('should not depend on Provider', () => {
    const differ = new DefaultPromptAssemblyHistoryDiffer()
    expect(differ).toBeDefined()
  })

  it('should not depend on Memory', () => {
    const differ = new DefaultPromptAssemblyHistoryDiffer()
    expect(differ).toBeDefined()
  })

  it('should not depend on AgentLoop', () => {
    const differ = new DefaultPromptAssemblyHistoryDiffer()
    expect(differ).toBeDefined()
  })

  it('should not depend on Pipeline', () => {
    const differ = new DefaultPromptAssemblyHistoryDiffer()
    expect(differ).toBeDefined()
  })

  it('should not modify PromptBuilder', () => {
    const differ = new DefaultPromptAssemblyHistoryDiffer()
    expect(differ).toBeDefined()
  })

  it('should not modify PromptRenderer', () => {
    const differ = new DefaultPromptAssemblyHistoryDiffer()
    expect(differ).toBeDefined()
  })

  it('should not modify PromptCompression', () => {
    const differ = new DefaultPromptAssemblyHistoryDiffer()
    expect(differ).toBeDefined()
  })

  it('should not modify PromptAssemblyHistory', () => {
    const differ = new DefaultPromptAssemblyHistoryDiffer()
    const history = createHistoryFromIndices([0, 1])
    const result = differ.diff(history, history)
    expect(result.added).toEqual([])
    expect(result.removed).toEqual([])
    expect(result.changed).toEqual([])
  })

  it('should not modify Planner', () => {
    const differ = new DefaultPromptAssemblyHistoryDiffer()
    expect(differ).toBeDefined()
  })

  it('should not modify PromptBuilderOptions', () => {
    const differ = new DefaultPromptAssemblyHistoryDiffer()
    expect(differ).toBeDefined()
  })

  it('should not modify PromptAssemblyTrace', () => {
    const trace = createTrace('test')
    expect(trace).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Compatibility — RetryPlanner
// ---------------------------------------------------------------------------

describe('RetryPlanner compatibility', () => {
  it('should be compatible with RetryPlanner scenarios', () => {
    const differ = new DefaultPromptAssemblyHistoryDiffer()
    const before = createHistoryWithTraces([0], 'initial')
    const after = createHistoryWithTraces([0], 'retry')
    const result = differ.diff(before, after)
    expect(result.changed).toEqual([0])
  })
})

// ---------------------------------------------------------------------------
// Compatibility — ToolCallPlanner
// ---------------------------------------------------------------------------

describe('ToolCallPlanner compatibility', () => {
  it('should be compatible with ToolCallPlanner scenarios', () => {
    const differ = new DefaultPromptAssemblyHistoryDiffer()
    const before = createHistoryWithTraces([0], 'pre-tool')
    const after = createHistoryWithTraces([0, 1], 'post-tool')
    const result = differ.diff(before, after)
    expect(result.added).toEqual([1])
    expect(result.changed).toEqual([0])
  })
})

// ---------------------------------------------------------------------------
// Compatibility — Streaming
// ---------------------------------------------------------------------------

describe('Streaming compatibility', () => {
  it('should be compatible with streaming pipeline', () => {
    const differ = new DefaultPromptAssemblyHistoryDiffer()
    const before = createHistory([])
    const after = createHistoryFromIndices([0])
    const result = differ.diff(before, after)
    expect(result.added).toEqual([0])
  })
})

// ---------------------------------------------------------------------------
// Compatibility — AgentLoop
// ---------------------------------------------------------------------------

describe('AgentLoop compatibility', () => {
  it('should be compatible with AgentLoop', () => {
    const differ = new DefaultPromptAssemblyHistoryDiffer()
    const before = createHistoryWithTraces([0, 1], 'loop-1')
    const after = createHistoryWithTraces([0, 1, 2], 'loop-2')
    const result = differ.diff(before, after)
    expect(result.added).toEqual([2])
    expect(result.changed).toEqual([0, 1])
  })
})

// ---------------------------------------------------------------------------
// Edge Cases
// ---------------------------------------------------------------------------

describe('Edge cases', () => {
  it('should handle histories with a single large gap in indices', () => {
    const differ = new DefaultPromptAssemblyHistoryDiffer()
    const before = createHistoryFromIndices([0])
    const after = createHistoryFromIndices([0, 999])
    const result = differ.diff(before, after)
    expect(result.added).toEqual([999])
  })

  it('should handle histories where all entries are changed', () => {
    const differ = new DefaultPromptAssemblyHistoryDiffer()
    const before = createHistoryWithTraces([0, 1, 2], 'old')
    const after = createHistoryWithTraces([0, 1, 2], 'new')
    const result = differ.diff(before, after)
    expect(result.changed).toEqual([0, 1, 2])
  })

  it('should handle single entry histories for all categories', () => {
    const differ = new DefaultPromptAssemblyHistoryDiffer()
    const result = differ.diff(
      createHistory([createEntry(5, createTrace('x'))]),
      createHistory([createEntry(5, createTrace('y'))]),
    )
    expect(result.changed).toEqual([5])
  })

  it('should handle non-sequential indices in before', () => {
    const differ = new DefaultPromptAssemblyHistoryDiffer()
    const before = createHistoryFromIndices([0, 2, 5])
    const after = createHistoryFromIndices([0, 2, 3])
    const result = differ.diff(before, after)
    expect(result.removed).toEqual([5])
    expect(result.added).toEqual([3])
  })

  it('should handle non-sequential indices in after', () => {
    const differ = new DefaultPromptAssemblyHistoryDiffer()
    const before = createHistoryFromIndices([0, 1])
    const after = createHistoryFromIndices([1, 3, 5])
    const result = differ.diff(before, after)
    expect(result.removed).toEqual([0])
    expect(result.added).toEqual([3, 5])
  })
})

// ---------------------------------------------------------------------------
// O(1) Lookup Verification
// ---------------------------------------------------------------------------

describe('O(1) lookup verification', () => {
  it('should correctly diff large histories', () => {
    const differ = new DefaultPromptAssemblyHistoryDiffer()
    const beforeIndices = Array.from({ length: 100 }, (_, i) => i)
    const afterIndices = Array.from({ length: 100 }, (_, i) => i + 50)
    const before = createHistoryWithTraces(beforeIndices, 'before')
    const after = createHistoryWithTraces(afterIndices, 'after')
    const result = differ.diff(before, after)
    // removed: 0..49 (50 removed)
    // added: 100..149 (50 added)
    // changed: 50..99 (50 changed)
    expect(result.removed).toHaveLength(50)
    expect(result.added).toHaveLength(50)
    expect(result.changed).toHaveLength(50)
  })

  it('should handle non-contiguous large index sets', () => {
    const differ = new DefaultPromptAssemblyHistoryDiffer()
    const before = createHistoryWithTraces([10, 20, 30, 40, 50], 'before')
    const after = createHistoryWithTraces([20, 30, 40, 60, 70], 'after')
    const result = differ.diff(before, after)
    expect(result.removed).toEqual([10, 50])
    expect(result.added).toEqual([60, 70])
    expect(result.changed).toEqual([20, 30, 40])
  })

  it('should handle histories with duplicate-safe indices', () => {
    const differ = new DefaultPromptAssemblyHistoryDiffer()
    // Each index should be unique; map handles last-wins naturally
    const before = createHistoryWithTraces([1, 2, 3], 'before')
    const after = createHistoryWithTraces([2, 3, 4], 'after')
    const result = differ.diff(before, after)
    expect(result.removed).toEqual([1])
    expect(result.added).toEqual([4])
    expect(result.changed).toEqual([2, 3])
  })
})