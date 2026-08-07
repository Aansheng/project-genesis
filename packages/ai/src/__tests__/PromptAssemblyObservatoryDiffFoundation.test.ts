import { describe, it, expect } from 'vitest'
import { DefaultPromptAssemblyObservatoryDiffer } from '../strategy/DefaultPromptAssemblyObservatoryDiffer'
import type { PromptAssemblyObservatoryDiffer } from '../strategy/PromptAssemblyObservatoryDiffer'
import type { PromptAssemblyObservatoryDiff } from '../strategy/PromptAssemblyObservatoryDiff'
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

function createTrace(): PromptAssemblyTrace {
  return { strategy: { name: 'create' } }
}

function createTraceAlt(): PromptAssemblyTrace {
  return { strategy: { name: 'query' } }
}

function createTimeline(): PromptAssemblyTimeline {
  return { entries: [{ index: 0, trace: createTrace() }] }
}

function createTimelineAlt(): PromptAssemblyTimeline {
  return { entries: [{ index: 1, trace: createTrace() }] }
}

function createHistory(): PromptAssemblyHistory {
  return { entries: [{ index: 0, trace: createTrace() }] }
}

function createHistoryAlt(): PromptAssemblyHistory {
  return { entries: [{ index: 1, trace: createTrace() }] }
}

function createTraceSnapshot(): PromptAssemblySnapshot {
  return { strategy: 'create' }
}

function createTraceSnapshotAlt(): PromptAssemblySnapshot {
  return { strategy: 'query' }
}

function createTimelineSnapshot(): PromptAssemblyTimelineSnapshot {
  return { entryCount: 1, firstStrategy: 'create', lastStrategy: 'create', strategies: ['create'] }
}

function createTimelineSnapshotAlt(): PromptAssemblyTimelineSnapshot {
  return { entryCount: 1, firstStrategy: 'query', lastStrategy: 'query', strategies: ['query'] }
}

function createHistorySnapshot(): PromptAssemblyHistorySnapshot {
  return { entryCount: 1, firstStrategy: 'create', lastStrategy: 'create', strategies: ['create'] }
}

function createHistorySnapshotAlt(): PromptAssemblyHistorySnapshot {
  return { entryCount: 1, firstStrategy: 'query', lastStrategy: 'query', strategies: ['query'] }
}

function createFullObservatory(): PromptAssemblyObservatory {
  return {
    trace: createTrace(),
    timeline: createTimeline(),
    history: createHistory(),
    traceSnapshot: createTraceSnapshot(),
    timelineSnapshot: createTimelineSnapshot(),
    historySnapshot: createHistorySnapshot(),
  }
}

function createFullObservatoryAlt(): PromptAssemblyObservatory {
  return {
    trace: createTraceAlt(),
    timeline: createTimelineAlt(),
    history: createHistoryAlt(),
    traceSnapshot: createTraceSnapshotAlt(),
    timelineSnapshot: createTimelineSnapshotAlt(),
    historySnapshot: createHistorySnapshotAlt(),
  }
}

function createEmptyObservatory(): PromptAssemblyObservatory {
  return {}
}

function createObservatoryWith(
  overrides: Partial<PromptAssemblyObservatory>,
): PromptAssemblyObservatory {
  return { ...overrides }
}

// ---------------------------------------------------------------------------
// Interface Contract
// ---------------------------------------------------------------------------

describe('Interface contract', () => {
  it('should define diff method', () => {
    const differ: PromptAssemblyObservatoryDiffer = new DefaultPromptAssemblyObservatoryDiffer()
    expect(typeof differ.diff).toBe('function')
  })

  it('should accept two observatories and return a PromptAssemblyObservatoryDiff', () => {
    const differ = new DefaultPromptAssemblyObservatoryDiffer()
    const before = createEmptyObservatory()
    const after = createEmptyObservatory()
    const result = differ.diff(before, after)
    expect(result).toHaveProperty('added')
    expect(result).toHaveProperty('removed')
    expect(result).toHaveProperty('changed')
  })

  it('should accept a custom implementation', () => {
    const custom: PromptAssemblyObservatoryDiffer = {
      diff(
        _before: PromptAssemblyObservatory,
        _after: PromptAssemblyObservatory,
      ): PromptAssemblyObservatoryDiff {
        return { added: ['custom'], removed: [], changed: [] }
      },
    }
    const result = custom.diff(createEmptyObservatory(), createEmptyObservatory())
    expect(result.added).toEqual(['custom'])
  })

  it('should have readonly added field in PromptAssemblyObservatoryDiff', () => {
    const diff: PromptAssemblyObservatoryDiff = { added: ['trace'], removed: [], changed: [] }
    expect(diff.added).toEqual(['trace'])
  })

  it('should have readonly removed field in PromptAssemblyObservatoryDiff', () => {
    const diff: PromptAssemblyObservatoryDiff = { added: [], removed: ['history'], changed: [] }
    expect(diff.removed).toEqual(['history'])
  })

  it('should have readonly changed field in PromptAssemblyObservatoryDiff', () => {
    const diff: PromptAssemblyObservatoryDiff = {
      added: [],
      removed: [],
      changed: ['timeline'],
    }
    expect(diff.changed).toEqual(['timeline'])
  })

  it('should support multiple entries in all arrays', () => {
    const diff: PromptAssemblyObservatoryDiff = {
      added: ['a', 'b'],
      removed: ['c', 'd'],
      changed: ['e', 'f'],
    }
    expect(diff.added).toHaveLength(2)
    expect(diff.removed).toHaveLength(2)
    expect(diff.changed).toHaveLength(2)
  })
})

// ---------------------------------------------------------------------------
// Empty Observatory
// ---------------------------------------------------------------------------

describe('Empty observatory', () => {
  it('should return empty diff when both observatories are empty', () => {
    const differ = new DefaultPromptAssemblyObservatoryDiffer()
    const result = differ.diff(createEmptyObservatory(), createEmptyObservatory())
    expect(result.added).toEqual([])
    expect(result.removed).toEqual([])
    expect(result.changed).toEqual([])
  })

  it('should detect all fields as added when before is empty and after is full', () => {
    const differ = new DefaultPromptAssemblyObservatoryDiffer()
    const after = createFullObservatory()
    const result = differ.diff(createEmptyObservatory(), after)
    expect(result.added).toEqual([
      'trace',
      'timeline',
      'history',
      'traceSnapshot',
      'timelineSnapshot',
      'historySnapshot',
    ])
    expect(result.removed).toEqual([])
    expect(result.changed).toEqual([])
  })

  it('should detect all fields as removed when after is empty and before is full', () => {
    const differ = new DefaultPromptAssemblyObservatoryDiffer()
    const before = createFullObservatory()
    const result = differ.diff(before, createEmptyObservatory())
    expect(result.removed).toEqual([
      'trace',
      'timeline',
      'history',
      'traceSnapshot',
      'timelineSnapshot',
      'historySnapshot',
    ])
    expect(result.added).toEqual([])
    expect(result.changed).toEqual([])
  })

  it('should return empty diff when both observatories are empty objects', () => {
    const differ = new DefaultPromptAssemblyObservatoryDiffer()
    const empty1: PromptAssemblyObservatory = {}
    const empty2: PromptAssemblyObservatory = {}
    const result = differ.diff(empty1, empty2)
    expect(result.added).toEqual([])
    expect(result.removed).toEqual([])
    expect(result.changed).toEqual([])
  })

  it('should handle empty vs observatory with only trace', () => {
    const differ = new DefaultPromptAssemblyObservatoryDiffer()
    const after = createObservatoryWith({ trace: createTrace() })
    const result = differ.diff(createEmptyObservatory(), after)
    expect(result.added).toEqual(['trace'])
    expect(result.removed).toEqual([])
    expect(result.changed).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// Added Fields
// ---------------------------------------------------------------------------

describe('Added fields', () => {
  it('should detect added trace', () => {
    const differ = new DefaultPromptAssemblyObservatoryDiffer()
    const result = differ.diff(
      createEmptyObservatory(),
      createObservatoryWith({ trace: createTrace() }),
    )
    expect(result.added).toEqual(['trace'])
  })

  it('should detect added timeline', () => {
    const differ = new DefaultPromptAssemblyObservatoryDiffer()
    const result = differ.diff(
      createEmptyObservatory(),
      createObservatoryWith({ timeline: createTimeline() }),
    )
    expect(result.added).toEqual(['timeline'])
  })

  it('should detect added history', () => {
    const differ = new DefaultPromptAssemblyObservatoryDiffer()
    const result = differ.diff(
      createEmptyObservatory(),
      createObservatoryWith({ history: createHistory() }),
    )
    expect(result.added).toEqual(['history'])
  })

  it('should detect added traceSnapshot', () => {
    const differ = new DefaultPromptAssemblyObservatoryDiffer()
    const result = differ.diff(
      createEmptyObservatory(),
      createObservatoryWith({ traceSnapshot: createTraceSnapshot() }),
    )
    expect(result.added).toEqual(['traceSnapshot'])
  })

  it('should detect added timelineSnapshot', () => {
    const differ = new DefaultPromptAssemblyObservatoryDiffer()
    const result = differ.diff(
      createEmptyObservatory(),
      createObservatoryWith({ timelineSnapshot: createTimelineSnapshot() }),
    )
    expect(result.added).toEqual(['timelineSnapshot'])
  })

  it('should detect added historySnapshot', () => {
    const differ = new DefaultPromptAssemblyObservatoryDiffer()
    const result = differ.diff(
      createEmptyObservatory(),
      createObservatoryWith({ historySnapshot: createHistorySnapshot() }),
    )
    expect(result.added).toEqual(['historySnapshot'])
  })

  it('should detect multiple added fields', () => {
    const differ = new DefaultPromptAssemblyObservatoryDiffer()
    const result = differ.diff(
      createEmptyObservatory(),
      createObservatoryWith({
        trace: createTrace(),
        timeline: createTimeline(),
      }),
    )
    expect(result.added).toEqual(['trace', 'timeline'])
  })

  it('should return empty added when nothing added', () => {
    const differ = new DefaultPromptAssemblyObservatoryDiffer()
    const obs = createFullObservatory()
    const result = differ.diff(obs, obs)
    expect(result.added).toEqual([])
  })

  it('should not report unchanged fields as added', () => {
    const differ = new DefaultPromptAssemblyObservatoryDiffer()
    const trace = createTrace()
    const result = differ.diff(
      createObservatoryWith({ trace }),
      createObservatoryWith({ trace, timeline: createTimeline() }),
    )
    expect(result.added).toEqual(['timeline'])
  })

  it('should detect all fields added when going from empty to full', () => {
    const differ = new DefaultPromptAssemblyObservatoryDiffer()
    const result = differ.diff(createEmptyObservatory(), createFullObservatory())
    expect(result.added).toHaveLength(6)
  })
})

// ---------------------------------------------------------------------------
// Removed Fields
// ---------------------------------------------------------------------------

describe('Removed fields', () => {
  it('should detect removed trace', () => {
    const differ = new DefaultPromptAssemblyObservatoryDiffer()
    const result = differ.diff(
      createObservatoryWith({ trace: createTrace() }),
      createEmptyObservatory(),
    )
    expect(result.removed).toEqual(['trace'])
  })

  it('should detect removed timeline', () => {
    const differ = new DefaultPromptAssemblyObservatoryDiffer()
    const result = differ.diff(
      createObservatoryWith({ timeline: createTimeline() }),
      createEmptyObservatory(),
    )
    expect(result.removed).toEqual(['timeline'])
  })

  it('should detect removed history', () => {
    const differ = new DefaultPromptAssemblyObservatoryDiffer()
    const result = differ.diff(
      createObservatoryWith({ history: createHistory() }),
      createEmptyObservatory(),
    )
    expect(result.removed).toEqual(['history'])
  })

  it('should detect removed traceSnapshot', () => {
    const differ = new DefaultPromptAssemblyObservatoryDiffer()
    const result = differ.diff(
      createObservatoryWith({ traceSnapshot: createTraceSnapshot() }),
      createEmptyObservatory(),
    )
    expect(result.removed).toEqual(['traceSnapshot'])
  })

  it('should detect removed timelineSnapshot', () => {
    const differ = new DefaultPromptAssemblyObservatoryDiffer()
    const result = differ.diff(
      createObservatoryWith({ timelineSnapshot: createTimelineSnapshot() }),
      createEmptyObservatory(),
    )
    expect(result.removed).toEqual(['timelineSnapshot'])
  })

  it('should detect removed historySnapshot', () => {
    const differ = new DefaultPromptAssemblyObservatoryDiffer()
    const result = differ.diff(
      createObservatoryWith({ historySnapshot: createHistorySnapshot() }),
      createEmptyObservatory(),
    )
    expect(result.removed).toEqual(['historySnapshot'])
  })

  it('should detect multiple removed fields', () => {
    const differ = new DefaultPromptAssemblyObservatoryDiffer()
    const result = differ.diff(
      createObservatoryWith({
        trace: createTrace(),
        timeline: createTimeline(),
        history: createHistory(),
      }),
      createObservatoryWith({ trace: createTrace() }),
    )
    expect(result.removed).toEqual(['timeline', 'history'])
  })

  it('should return empty removed when nothing removed', () => {
    const differ = new DefaultPromptAssemblyObservatoryDiffer()
    const obs = createFullObservatory()
    const result = differ.diff(obs, obs)
    expect(result.removed).toEqual([])
  })

  it('should detect all fields removed when going to empty', () => {
    const differ = new DefaultPromptAssemblyObservatoryDiffer()
    const result = differ.diff(createFullObservatory(), createEmptyObservatory())
    expect(result.removed).toHaveLength(6)
  })

  it('should not report unchanged fields as removed', () => {
    const differ = new DefaultPromptAssemblyObservatoryDiffer()
    const trace = createTrace()
    const result = differ.diff(
      createObservatoryWith({ trace, timeline: createTimeline() }),
      createObservatoryWith({ trace }),
    )
    expect(result.removed).toEqual(['timeline'])
    expect(result.added).toEqual([])
    expect(result.changed).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// Changed Fields
// ---------------------------------------------------------------------------

describe('Changed fields', () => {
  it('should detect changed trace', () => {
    const differ = new DefaultPromptAssemblyObservatoryDiffer()
    const result = differ.diff(
      createObservatoryWith({ trace: createTrace() }),
      createObservatoryWith({ trace: createTraceAlt() }),
    )
    expect(result.changed).toEqual(['trace'])
  })

  it('should detect changed timeline', () => {
    const differ = new DefaultPromptAssemblyObservatoryDiffer()
    const result = differ.diff(
      createObservatoryWith({ timeline: createTimeline() }),
      createObservatoryWith({ timeline: createTimelineAlt() }),
    )
    expect(result.changed).toEqual(['timeline'])
  })

  it('should detect changed history', () => {
    const differ = new DefaultPromptAssemblyObservatoryDiffer()
    const result = differ.diff(
      createObservatoryWith({ history: createHistory() }),
      createObservatoryWith({ history: createHistoryAlt() }),
    )
    expect(result.changed).toEqual(['history'])
  })

  it('should detect changed traceSnapshot', () => {
    const differ = new DefaultPromptAssemblyObservatoryDiffer()
    const result = differ.diff(
      createObservatoryWith({ traceSnapshot: createTraceSnapshot() }),
      createObservatoryWith({ traceSnapshot: createTraceSnapshotAlt() }),
    )
    expect(result.changed).toEqual(['traceSnapshot'])
  })

  it('should detect changed timelineSnapshot', () => {
    const differ = new DefaultPromptAssemblyObservatoryDiffer()
    const result = differ.diff(
      createObservatoryWith({ timelineSnapshot: createTimelineSnapshot() }),
      createObservatoryWith({ timelineSnapshot: createTimelineSnapshotAlt() }),
    )
    expect(result.changed).toEqual(['timelineSnapshot'])
  })

  it('should detect changed historySnapshot', () => {
    const differ = new DefaultPromptAssemblyObservatoryDiffer()
    const result = differ.diff(
      createObservatoryWith({ historySnapshot: createHistorySnapshot() }),
      createObservatoryWith({ historySnapshot: createHistorySnapshotAlt() }),
    )
    expect(result.changed).toEqual(['historySnapshot'])
  })

  it('should detect multiple changed fields', () => {
    const differ = new DefaultPromptAssemblyObservatoryDiffer()
    const result = differ.diff(
      createObservatoryWith({ trace: createTrace(), timeline: createTimeline() }),
      createObservatoryWith({ trace: createTraceAlt(), timeline: createTimelineAlt() }),
    )
    expect(result.changed).toEqual(['trace', 'timeline'])
  })

  it('should not report equal values as changed', () => {
    const differ = new DefaultPromptAssemblyObservatoryDiffer()
    const obs = createFullObservatory()
    const result = differ.diff(obs, obs)
    expect(result.changed).toEqual([])
  })

  it('should detect changed when same field different object reference', () => {
    const differ = new DefaultPromptAssemblyObservatoryDiffer()
    const result = differ.diff(
      createObservatoryWith({ trace: { strategy: { name: 'create' } } }),
      createObservatoryWith({ trace: { strategy: { name: 'create' } } }),
    )
    // Different object references with same content → !== is true → changed
    expect(result.changed).toEqual(['trace'])
  })

  it('should detect changed for all six fields simultaneously', () => {
    const differ = new DefaultPromptAssemblyObservatoryDiffer()
    const result = differ.diff(
      createFullObservatory(),
      createFullObservatoryAlt(),
    )
    expect(result.changed).toEqual([
      'trace',
      'timeline',
      'history',
      'traceSnapshot',
      'timelineSnapshot',
      'historySnapshot',
    ])
  })
})

// ---------------------------------------------------------------------------
// Mixed Changes
// ---------------------------------------------------------------------------

describe('Mixed changes', () => {
  it('should detect added, removed, and changed simultaneously', () => {
    const differ = new DefaultPromptAssemblyObservatoryDiffer()
    const trace = createTrace()
    const result = differ.diff(
      createObservatoryWith({ trace, timeline: createTimeline() }),
      createObservatoryWith({ trace: createTraceAlt(), history: createHistory() }),
    )
    // trace: present in both but changed (different object refs)
    // timeline: removed (not in after)
    // history: added (not in before)
    expect(result.removed).toEqual(['timeline'])
    expect(result.added).toEqual(['history'])
    expect(result.changed).toEqual(['trace'])
  })

  it('should handle add + change without remove', () => {
    const differ = new DefaultPromptAssemblyObservatoryDiffer()
    const result = differ.diff(
      createObservatoryWith({ trace: createTrace() }),
      createObservatoryWith({
        trace: createTraceAlt(),
        timeline: createTimeline(),
      }),
    )
    expect(result.added).toEqual(['timeline'])
    expect(result.removed).toEqual([])
    expect(result.changed).toEqual(['trace'])
  })

  it('should handle remove + change without add', () => {
    const differ = new DefaultPromptAssemblyObservatoryDiffer()
    const result = differ.diff(
      createObservatoryWith({
        trace: createTrace(),
        timeline: createTimeline(),
      }),
      createObservatoryWith({ trace: createTraceAlt() }),
    )
    expect(result.changed).toEqual(['trace'])
    expect(result.removed).toEqual(['timeline'])
    expect(result.added).toEqual([])
  })

  it('should handle add + remove without change', () => {
    const differ = new DefaultPromptAssemblyObservatoryDiffer()
    const result = differ.diff(
      createObservatoryWith({ timeline: createTimeline() }),
      createObservatoryWith({ history: createHistory() }),
    )
    expect(result.removed).toEqual(['timeline'])
    expect(result.added).toEqual(['history'])
    expect(result.changed).toEqual([])
  })

  it('should handle two added and two removed', () => {
    const differ = new DefaultPromptAssemblyObservatoryDiffer()
    const result = differ.diff(
      createObservatoryWith({
        trace: createTrace(),
        timeline: createTimeline(),
      }),
      createObservatoryWith({
        history: createHistory(),
        traceSnapshot: createTraceSnapshot(),
      }),
    )
    expect(result.removed).toEqual(['trace', 'timeline'])
    expect(result.added).toEqual(['history', 'traceSnapshot'])
    expect(result.changed).toEqual([])
  })

  it('should handle complex scenario with multiple categories', () => {
    const differ = new DefaultPromptAssemblyObservatoryDiffer()
    const trace = createTrace()
    const result = differ.diff(
      createObservatoryWith({
        trace,
        timeline: createTimeline(),
        historySnapshot: createHistorySnapshot(),
      }),
      createObservatoryWith({
        trace: createTraceAlt(),
        timelineSnapshot: createTimelineSnapshot(),
        history: createHistory(),
      }),
    )
    // trace: changed (different ref)
    // timeline: removed
    // historySnapshot: removed
    // history: added
    // timelineSnapshot: added
    expect(result.removed).toEqual(['timeline', 'historySnapshot'])
    expect(result.added).toEqual(['history', 'timelineSnapshot'])
    expect(result.changed).toEqual(['trace'])
  })
})

// ---------------------------------------------------------------------------
// Ordering
// ---------------------------------------------------------------------------

describe('Ordering', () => {
  it('should preserve field declaration order in added array', () => {
    const differ = new DefaultPromptAssemblyObservatoryDiffer()
    const result = differ.diff(
      createEmptyObservatory(),
      createObservatoryWith({
        historySnapshot: createHistorySnapshot(),
        trace: createTrace(),
        timeline: createTimeline(),
      }),
    )
    // Order should follow OBSERVATORY_FIELDS: trace, timeline, history, traceSnapshot, timelineSnapshot, historySnapshot
    expect(result.added[0]).toBe('trace')
    expect(result.added[1]).toBe('timeline')
    // historySnapshot should come after trace and timeline (3rd of 3 added fields)
    expect(result.added[2]).toBe('historySnapshot')
    expect(result.added).toHaveLength(3)
  })

  it('should preserve field declaration order in removed array', () => {
    const differ = new DefaultPromptAssemblyObservatoryDiffer()
    const result = differ.diff(
      createObservatoryWith({
        historySnapshot: createHistorySnapshot(),
        trace: createTrace(),
        timeline: createTimeline(),
      }),
      createEmptyObservatory(),
    )
    expect(result.removed[0]).toBe('trace')
    expect(result.removed[1]).toBe('timeline')
    // historySnapshot is the 3rd field in declaration order of the 3 present fields
    expect(result.removed[2]).toBe('historySnapshot')
    expect(result.removed).toHaveLength(3)
  })

  it('should preserve field declaration order in changed array', () => {
    const differ = new DefaultPromptAssemblyObservatoryDiffer()
    const result = differ.diff(
      createObservatoryWith({
        historySnapshot: createHistorySnapshot(),
        trace: createTrace(),
        timeline: createTimeline(),
      }),
      createObservatoryWith({
        historySnapshot: createHistorySnapshotAlt(),
        trace: createTraceAlt(),
        timeline: createTimelineAlt(),
      }),
    )
    expect(result.changed[0]).toBe('trace')
    expect(result.changed[1]).toBe('timeline')
    expect(result.changed[result.changed.length - 1]).toBe('historySnapshot')
  })
})

// ---------------------------------------------------------------------------
// Deterministic
// ---------------------------------------------------------------------------

describe('Deterministic', () => {
  it('should produce same result for same inputs across multiple calls', () => {
    const differ = new DefaultPromptAssemblyObservatoryDiffer()
    const before = createObservatoryWith({ trace: createTrace(), timeline: createTimeline() })
    const after = createObservatoryWith({ trace: createTraceAlt(), history: createHistory() })
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
    const d1 = new DefaultPromptAssemblyObservatoryDiffer()
    const d2 = new DefaultPromptAssemblyObservatoryDiffer()
    const before = createObservatoryWith({ trace: createTrace() })
    const after = createObservatoryWith({ trace: createTraceAlt() })
    const r1 = d1.diff(before, after)
    const r2 = d2.diff(before, after)
    expect(r1.added).toEqual(r2.added)
    expect(r1.removed).toEqual(r2.removed)
    expect(r1.changed).toEqual(r2.changed)
  })

  it('should produce same result for identical observatory pairs', () => {
    const differ = new DefaultPromptAssemblyObservatoryDiffer()
    const before1 = createObservatoryWith({ trace: createTrace() })
    const after1 = createObservatoryWith({ trace: createTraceAlt() })
    const before2 = createObservatoryWith({ trace: createTrace() })
    const after2 = createObservatoryWith({ trace: createTraceAlt() })
    expect(differ.diff(before1, after1)).toEqual(differ.diff(before2, after2))
  })

  it('should produce same result across multiple calls for full observatories', () => {
    const differ = new DefaultPromptAssemblyObservatoryDiffer()
    const before = createFullObservatory()
    const after = createEmptyObservatory()
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
    const differ = new DefaultPromptAssemblyObservatoryDiffer()
    const r1 = differ.diff(
      createObservatoryWith({ trace: createTrace() }),
      createObservatoryWith({ trace: createTrace(), timeline: createTimeline() }),
    )
    const r2 = differ.diff(
      createObservatoryWith({ trace: createTrace() }),
      createObservatoryWith({ trace: createTraceAlt() }),
    )
    // r1 has added: ['timeline']
    expect(r1.added).toEqual(['timeline'])
    // r2 has changed: ['trace']
    expect(r2.changed).toEqual(['trace'])
    expect(r2.added).toEqual([])
  })

  it('should produce independent results from sequential calls', () => {
    const differ = new DefaultPromptAssemblyObservatoryDiffer()
    const r1 = differ.diff(createEmptyObservatory(), createFullObservatory())
    const r2 = differ.diff(createFullObservatory(), createEmptyObservatory())
    // r1: all added
    expect(r1.added).toHaveLength(6)
    expect(r1.removed).toHaveLength(0)
    // r2: all removed
    expect(r2.removed).toHaveLength(6)
    expect(r2.added).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// Pure
// ---------------------------------------------------------------------------

describe('Pure', () => {
  it('should not modify input before observatory', () => {
    const differ = new DefaultPromptAssemblyObservatoryDiffer()
    const before = createObservatoryWith({ trace: createTrace() })
    const after = createObservatoryWith({ trace: createTraceAlt() })
    const originalBefore = JSON.stringify(before)
    differ.diff(before, after)
    expect(JSON.stringify(before)).toBe(originalBefore)
  })

  it('should not modify input after observatory', () => {
    const differ = new DefaultPromptAssemblyObservatoryDiffer()
    const before = createObservatoryWith({ trace: createTrace() })
    const after = createObservatoryWith({ trace: createTraceAlt() })
    const originalAfter = JSON.stringify(after)
    differ.diff(before, after)
    expect(JSON.stringify(after)).toBe(originalAfter)
  })

  it('should not modify observatory field values', () => {
    const differ = new DefaultPromptAssemblyObservatoryDiffer()
    const before: PromptAssemblyObservatory = { trace: { strategy: { name: 'create' } } }
    const after: PromptAssemblyObservatory = { trace: { strategy: { name: 'query' } } }
    const traceBefore = (before.trace as PromptAssemblyTrace).strategy as { name: string }
    const traceAfter = (after.trace as PromptAssemblyTrace).strategy as { name: string }
    differ.diff(before, after)
    expect(traceBefore.name).toBe('create')
    expect(traceAfter.name).toBe('query')
  })

  it('should not mutate when observatories have nested objects', () => {
    const differ = new DefaultPromptAssemblyObservatoryDiffer()
    const before: PromptAssemblyObservatory = {
      timeline: { entries: [{ index: 0, trace: { strategy: { name: 'create' } } }] },
    }
    const after: PromptAssemblyObservatory = {
      timeline: { entries: [{ index: 1, trace: { strategy: { name: 'query' } } }] },
    }
    const originalBefore = JSON.stringify(before)
    const originalAfter = JSON.stringify(after)
    differ.diff(before, after)
    expect(JSON.stringify(before)).toBe(originalBefore)
    expect(JSON.stringify(after)).toBe(originalAfter)
  })

  it('should not mutate full observatory fields', () => {
    const differ = new DefaultPromptAssemblyObservatoryDiffer()
    const before = createFullObservatory()
    const after = createFullObservatoryAlt()
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
    const differ = new DefaultPromptAssemblyObservatoryDiffer()
    const result = differ.diff(createEmptyObservatory(), createObservatoryWith({ trace: createTrace() }))
    expect(Object.isFrozen(result)).toBe(true)
  })

  it('should return frozen added array', () => {
    const differ = new DefaultPromptAssemblyObservatoryDiffer()
    const result = differ.diff(createEmptyObservatory(), createObservatoryWith({ trace: createTrace() }))
    expect(Object.isFrozen(result.added)).toBe(true)
  })

  it('should return frozen removed array', () => {
    const differ = new DefaultPromptAssemblyObservatoryDiffer()
    const result = differ.diff(createFullObservatory(), createEmptyObservatory())
    expect(Object.isFrozen(result.removed)).toBe(true)
  })

  it('should return frozen changed array', () => {
    const differ = new DefaultPromptAssemblyObservatoryDiffer()
    const before = createObservatoryWith({ trace: createTrace() })
    const after = createObservatoryWith({ trace: createTraceAlt() })
    const result = differ.diff(before, after)
    expect(Object.isFrozen(result.changed)).toBe(true)
  })

  it('should not be able to modify diff result', () => {
    const differ = new DefaultPromptAssemblyObservatoryDiffer()
    const result = differ.diff(createEmptyObservatory(), createObservatoryWith({ trace: createTrace() }))
    expect(() => {
      const r = result as unknown as Record<string, unknown>
      r.added = ['x']
    }).toThrow()
  })

  it('should not be able to push to diff arrays', () => {
    const differ = new DefaultPromptAssemblyObservatoryDiffer()
    const result = differ.diff(createEmptyObservatory(), createFullObservatory())
    expect(() => {
      (result.added as unknown as string[]).push('trace')
    }).toThrow()
  })
})

// ---------------------------------------------------------------------------
// Export Validation
// ---------------------------------------------------------------------------

describe('Export validation', () => {
  it('should export DefaultPromptAssemblyObservatoryDiffer from strategy index', async () => {
    const mod = await import('../strategy')
    expect(mod.DefaultPromptAssemblyObservatoryDiffer).toBeDefined()
  })

  it('should export PromptAssemblyObservatoryDiff type from strategy index', async () => {
    const mod = await import('../strategy')
    expect(mod.DefaultPromptAssemblyObservatoryDiffer).toBeDefined()
  })

  it('should export PromptAssemblyObservatoryDiffer type from strategy index', async () => {
    const mod = await import('../strategy')
    expect(mod.DefaultPromptAssemblyObservatoryDiffer).toBeDefined()
  })

  it('should export DefaultPromptAssemblyObservatoryDiffer from package root', async () => {
    const mod = await import('..')
    expect(mod.DefaultPromptAssemblyObservatoryDiffer).toBeDefined()
  })

  it('should export PromptAssemblyObservatoryDiff type from package root', async () => {
    const mod = await import('..')
    expect(mod.DefaultPromptAssemblyObservatoryDiffer).toBeDefined()
  })

  it('should export PromptAssemblyObservatoryDiffer type from package root', async () => {
    const mod = await import('..')
    expect(mod.DefaultPromptAssemblyObservatoryDiffer).toBeDefined()
  })

  it('should export DefaultPromptAssemblyObservatoryDiffer as a class', () => {
    const differ = new DefaultPromptAssemblyObservatoryDiffer()
    expect(differ).toBeInstanceOf(DefaultPromptAssemblyObservatoryDiffer)
  })

  it('should export PromptAssemblyObservatoryDiff as a type', () => {
    const diff: PromptAssemblyObservatoryDiff = { added: [], removed: [], changed: [] }
    expect(diff.added).toEqual([])
  })

  it('should export PromptAssemblyObservatoryDiffer as a type', () => {
    const differ: PromptAssemblyObservatoryDiffer = new DefaultPromptAssemblyObservatoryDiffer()
    expect(typeof differ.diff).toBe('function')
  })
})

// ---------------------------------------------------------------------------
// Architecture Compliance
// ---------------------------------------------------------------------------

describe('Architecture compliance', () => {
  it('should not depend on Runtime', () => {
    const differ = new DefaultPromptAssemblyObservatoryDiffer()
    expect(differ).toBeDefined()
  })

  it('should not depend on Planner', () => {
    const differ = new DefaultPromptAssemblyObservatoryDiffer()
    expect(differ).toBeDefined()
  })

  it('should not depend on Pipeline', () => {
    const differ = new DefaultPromptAssemblyObservatoryDiffer()
    expect(differ).toBeDefined()
  })

  it('should not depend on Provider', () => {
    const differ = new DefaultPromptAssemblyObservatoryDiffer()
    expect(differ).toBeDefined()
  })

  it('should not depend on Memory', () => {
    const differ = new DefaultPromptAssemblyObservatoryDiffer()
    expect(differ).toBeDefined()
  })

  it('should not depend on AgentLoop', () => {
    const differ = new DefaultPromptAssemblyObservatoryDiffer()
    expect(differ).toBeDefined()
  })

  it('should not depend on PromptBuilder', () => {
    const differ = new DefaultPromptAssemblyObservatoryDiffer()
    expect(differ).toBeDefined()
  })

  it('should not depend on BuilderOptions', () => {
    const differ = new DefaultPromptAssemblyObservatoryDiffer()
    expect(differ).toBeDefined()
  })

  it('should not depend on PromptRenderer', () => {
    const differ = new DefaultPromptAssemblyObservatoryDiffer()
    expect(differ).toBeDefined()
  })

  it('should not depend on PromptCompression', () => {
    const differ = new DefaultPromptAssemblyObservatoryDiffer()
    expect(differ).toBeDefined()
  })

  it('should not modify PromptBuilder', () => {
    const differ = new DefaultPromptAssemblyObservatoryDiffer()
    expect(differ).toBeDefined()
  })

  it('should not modify BuilderOptions', () => {
    const differ = new DefaultPromptAssemblyObservatoryDiffer()
    expect(differ).toBeDefined()
  })

  it('should not modify Runtime', () => {
    const differ = new DefaultPromptAssemblyObservatoryDiffer()
    expect(differ).toBeDefined()
  })

  it('should not modify Planner', () => {
    const differ = new DefaultPromptAssemblyObservatoryDiffer()
    expect(differ).toBeDefined()
  })

  it('should not modify Pipeline', () => {
    const differ = new DefaultPromptAssemblyObservatoryDiffer()
    expect(differ).toBeDefined()
  })

  it('should not modify AgentLoop', () => {
    const differ = new DefaultPromptAssemblyObservatoryDiffer()
    expect(differ).toBeDefined()
  })

  it('should not modify DefaultPromptBuilder', () => {
    const differ = new DefaultPromptAssemblyObservatoryDiffer()
    expect(differ).toBeDefined()
  })

  it('should not modify PromptAssemblyObservatory', () => {
    const differ = new DefaultPromptAssemblyObservatoryDiffer()
    const obs = createFullObservatory()
    const result = differ.diff(obs, obs)
    expect(result.added).toEqual([])
    expect(result.removed).toEqual([])
    expect(result.changed).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// Compatibility — RetryPlanner
// ---------------------------------------------------------------------------

describe('RetryPlanner compatibility', () => {
  it('should be compatible with RetryPlanner scenarios', () => {
    const differ = new DefaultPromptAssemblyObservatoryDiffer()
    const before = createObservatoryWith({ trace: createTrace() })
    const after = createObservatoryWith({ trace: createTraceAlt() })
    const result = differ.diff(before, after)
    expect(result.changed).toEqual(['trace'])
  })
})

// ---------------------------------------------------------------------------
// Compatibility — ToolCallPlanner
// ---------------------------------------------------------------------------

describe('ToolCallPlanner compatibility', () => {
  it('should be compatible with ToolCallPlanner scenarios', () => {
    const differ = new DefaultPromptAssemblyObservatoryDiffer()
    const before = createObservatoryWith({ trace: createTrace(), timeline: createTimeline() })
    const after = createObservatoryWith({
      trace: createTraceAlt(),
      timeline: createTimelineAlt(),
    })
    const result = differ.diff(before, after)
    expect(result.changed).toEqual(['trace', 'timeline'])
  })
})

// ---------------------------------------------------------------------------
// Compatibility — Streaming
// ---------------------------------------------------------------------------

describe('Streaming compatibility', () => {
  it('should be compatible with streaming scenarios', () => {
    const differ = new DefaultPromptAssemblyObservatoryDiffer()
    const before = createObservatoryWith({ trace: createTrace() })
    const after = createObservatoryWith({
      trace: createTrace(),
      timeline: createTimeline(),
    })
    const result = differ.diff(before, after)
    expect(result.added).toEqual(['timeline'])
  })
})

// ---------------------------------------------------------------------------
// Compatibility — AgentLoop
// ---------------------------------------------------------------------------

describe('AgentLoop compatibility', () => {
  it('should be compatible with AgentLoop scenarios', () => {
    const differ = new DefaultPromptAssemblyObservatoryDiffer()
    const before = createObservatoryWith({ timeline: createTimeline() })
    const after = createObservatoryWith({
      timeline: createTimeline(),
      history: createHistory(),
    })
    const result = differ.diff(before, after)
    expect(result.added).toEqual(['history'])
  })
})

// ---------------------------------------------------------------------------
// Edge Cases
// ---------------------------------------------------------------------------

describe('Edge cases', () => {
  it('should handle all fields changed', () => {
    const differ = new DefaultPromptAssemblyObservatoryDiffer()
    const result = differ.diff(createFullObservatory(), createFullObservatoryAlt())
    expect(result.added).toEqual([])
    expect(result.removed).toEqual([])
    expect(result.changed).toHaveLength(6)
  })

  it('should handle all fields added', () => {
    const differ = new DefaultPromptAssemblyObservatoryDiffer()
    const result = differ.diff(createEmptyObservatory(), createFullObservatory())
    expect(result.added).toHaveLength(6)
    expect(result.removed).toEqual([])
    expect(result.changed).toEqual([])
  })

  it('should handle all fields removed', () => {
    const differ = new DefaultPromptAssemblyObservatoryDiffer()
    const result = differ.diff(createFullObservatory(), createEmptyObservatory())
    expect(result.added).toEqual([])
    expect(result.removed).toHaveLength(6)
    expect(result.changed).toEqual([])
  })

  it('should handle mixed all fields', () => {
    const differ = new DefaultPromptAssemblyObservatoryDiffer()
    // before has: trace, timeline, history
    // after has: traceAlt, timelineSnapshot, historySnapshot
    const result = differ.diff(
      createObservatoryWith({
        trace: createTrace(),
        timeline: createTimeline(),
        history: createHistory(),
      }),
      createObservatoryWith({
        trace: createTraceAlt(),
        timelineSnapshot: createTimelineSnapshot(),
        historySnapshot: createHistorySnapshot(),
      }),
    )
    // trace: changed
    // timeline: removed
    // history: removed
    // timelineSnapshot: added
    // historySnapshot: added
    expect(result.changed).toEqual(['trace'])
    expect(result.removed).toEqual(['timeline', 'history'])
    expect(result.added).toEqual(['timelineSnapshot', 'historySnapshot'])
  })

  it('should handle same reference passed as both before and after', () => {
    const differ = new DefaultPromptAssemblyObservatoryDiffer()
    const obs = createFullObservatory()
    const result = differ.diff(obs, obs)
    expect(result.added).toEqual([])
    expect(result.removed).toEqual([])
    expect(result.changed).toEqual([])
  })

  it('should handle observatory with only trace field', () => {
    const differ = new DefaultPromptAssemblyObservatoryDiffer()
    const result = differ.diff(
      createObservatoryWith({ trace: createTrace() }),
      createObservatoryWith({ trace: createTraceAlt() }),
    )
    expect(result.changed).toEqual(['trace'])
  })

  it('should handle observatory with only snapshot fields', () => {
    const differ = new DefaultPromptAssemblyObservatoryDiffer()
    const result = differ.diff(
      createObservatoryWith({
        traceSnapshot: createTraceSnapshot(),
        timelineSnapshot: createTimelineSnapshot(),
        historySnapshot: createHistorySnapshot(),
      }),
      createObservatoryWith({
        traceSnapshot: createTraceSnapshotAlt(),
        timelineSnapshot: createTimelineSnapshotAlt(),
        historySnapshot: createHistorySnapshotAlt(),
      }),
    )
    expect(result.changed).toEqual(['traceSnapshot', 'timelineSnapshot', 'historySnapshot'])
  })

  it('should handle observatory with same trace reference but different timeline', () => {
    const differ = new DefaultPromptAssemblyObservatoryDiffer()
    const trace = createTrace()
    const result = differ.diff(
      createObservatoryWith({ trace, timeline: createTimeline() }),
      createObservatoryWith({ trace, timeline: createTimelineAlt() }),
    )
    expect(result.changed).toEqual(['timeline'])
    expect(result.added).toEqual([])
    expect(result.removed).toEqual([])
  })

  it('should handle undefined field values explicitly', () => {
    const differ = new DefaultPromptAssemblyObservatoryDiffer()
    const result = differ.diff(
      { trace: undefined } as unknown as PromptAssemblyObservatory,
      { trace: createTrace() },
    )
    expect(result.added).toEqual(['trace'])
  })

  it('should handle observatory with all trace-related fields present', () => {
    const differ = new DefaultPromptAssemblyObservatoryDiffer()
    const result = differ.diff(
      createObservatoryWith({
        trace: createTrace(),
        traceSnapshot: createTraceSnapshot(),
      }),
      createObservatoryWith({
        trace: createTraceAlt(),
        traceSnapshot: createTraceSnapshotAlt(),
      }),
    )
    expect(result.changed).toEqual(['trace', 'traceSnapshot'])
  })

  it('should handle observatory with all timeline-related fields present', () => {
    const differ = new DefaultPromptAssemblyObservatoryDiffer()
    const result = differ.diff(
      createObservatoryWith({
        timeline: createTimeline(),
        timelineSnapshot: createTimelineSnapshot(),
      }),
      createObservatoryWith({
        timeline: createTimelineAlt(),
        timelineSnapshot: createTimelineSnapshotAlt(),
      }),
    )
    expect(result.changed).toEqual(['timeline', 'timelineSnapshot'])
  })

  it('should handle observatory with all history-related fields present', () => {
    const differ = new DefaultPromptAssemblyObservatoryDiffer()
    const result = differ.diff(
      createObservatoryWith({
        history: createHistory(),
        historySnapshot: createHistorySnapshot(),
      }),
      createObservatoryWith({
        history: createHistoryAlt(),
        historySnapshot: createHistorySnapshotAlt(),
      }),
    )
    expect(result.changed).toEqual(['history', 'historySnapshot'])
  })

  it('should handle identity diff between two full observatories', () => {
    const differ = new DefaultPromptAssemblyObservatoryDiffer()
    const obs = createFullObservatory()
    expect(differ.diff(obs, obs).added).toEqual([])
    expect(differ.diff(obs, obs).removed).toEqual([])
    expect(differ.diff(obs, obs).changed).toEqual([])
  })

  it('should handle transition from partial to full observatory', () => {
    const differ = new DefaultPromptAssemblyObservatoryDiffer()
    const result = differ.diff(
      createObservatoryWith({ trace: createTrace() }),
      createFullObservatory(),
    )
    expect(result.added).toEqual(['timeline', 'history', 'traceSnapshot', 'timelineSnapshot', 'historySnapshot'])
  })
})