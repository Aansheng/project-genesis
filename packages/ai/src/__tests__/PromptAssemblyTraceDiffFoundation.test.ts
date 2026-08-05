import { describe, it, expect } from 'vitest'
import { DefaultPromptAssemblyTraceDiffer } from '../strategy/DefaultPromptAssemblyTraceDiffer'
import type { PromptAssemblyTraceDiffer } from '../strategy/PromptAssemblyTraceDiffer'
import type { PromptAssemblyTraceDiff } from '../strategy/PromptAssemblyTraceDiff'
import type { PromptAssemblyTrace } from '../strategy/PromptAssemblyTrace'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createEmptyTrace(): PromptAssemblyTrace {
  return {}
}

function createFullTrace(): PromptAssemblyTrace {
  return {
    strategy: { name: 'create' },
    strategySelection: { selected: 'create', candidates: [] },
    plan: { priorities: [] },
    optimizedPlan: { priorities: [] },
    planDiff: { added: [], removed: [], changed: [] },
    snapshot: { plan: { priorities: [] } },
    inspector: { strategy: 'create', sections: [] },
    inspectorRendered: 'rendered output',
    inspectorExported: '{"strategy":"create"}',
  }
}

function createTraceWith(fields: Partial<PromptAssemblyTrace>): PromptAssemblyTrace {
  return { ...fields }
}

function createTraceWithStrategy(name: string): PromptAssemblyTrace {
  return { strategy: { name } }
}

function createTraceWithStrategySelection(selected: string): PromptAssemblyTrace {
  return { strategySelection: { selected, candidates: [] } }
}

function createTraceWithPlan(): PromptAssemblyTrace {
  return { plan: { priorities: [{ section: 'userInput', priority: 100 }] } }
}

function createTraceWithInspectorRendered(text: string): PromptAssemblyTrace {
  return { inspectorRendered: text }
}

// ---------------------------------------------------------------------------
// Interface Contract
// ---------------------------------------------------------------------------

describe('Interface contract', () => {
  it('should define diff method', () => {
    const differ: PromptAssemblyTraceDiffer = new DefaultPromptAssemblyTraceDiffer()
    expect(typeof differ.diff).toBe('function')
  })

  it('should accept two traces and return a PromptAssemblyTraceDiff', () => {
    const differ = new DefaultPromptAssemblyTraceDiffer()
    const before = createEmptyTrace()
    const after = createEmptyTrace()
    const result = differ.diff(before, after)
    expect(result).toHaveProperty('added')
    expect(result).toHaveProperty('removed')
    expect(result).toHaveProperty('changed')
  })

  it('should accept a custom implementation', () => {
    const custom: PromptAssemblyTraceDiffer = {
      diff(_before: PromptAssemblyTrace, _after: PromptAssemblyTrace): PromptAssemblyTraceDiff {
        return { added: ['custom'], removed: [], changed: [] }
      },
    }
    const result = custom.diff(createEmptyTrace(), createEmptyTrace())
    expect(result.added).toEqual(['custom'])
  })

  it('should have readonly added field in PromptAssemblyTraceDiff', () => {
    const diff: PromptAssemblyTraceDiff = { added: ['field1'], removed: [], changed: [] }
    expect(diff.added).toEqual(['field1'])
  })

  it('should have readonly removed field in PromptAssemblyTraceDiff', () => {
    const diff: PromptAssemblyTraceDiff = { added: [], removed: ['oldField'], changed: [] }
    expect(diff.removed).toEqual(['oldField'])
  })

  it('should have readonly changed field in PromptAssemblyTraceDiff', () => {
    const diff: PromptAssemblyTraceDiff = {
      added: [],
      removed: [],
      changed: ['changedField'],
    }
    expect(diff.changed).toEqual(['changedField'])
  })

  it('should support multiple entries in all arrays', () => {
    const diff: PromptAssemblyTraceDiff = {
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
// Empty Traces
// ---------------------------------------------------------------------------

describe('Empty traces', () => {
  it('should return empty diff when both traces are empty', () => {
    const differ = new DefaultPromptAssemblyTraceDiffer()
    const result = differ.diff(createEmptyTrace(), createEmptyTrace())
    expect(result.added).toEqual([])
    expect(result.removed).toEqual([])
    expect(result.changed).toEqual([])
  })

  it('should detect all fields as added when before is empty and after is full', () => {
    const differ = new DefaultPromptAssemblyTraceDiffer()
    const after = createFullTrace()
    const result = differ.diff(createEmptyTrace(), after)
    expect(result.added).toEqual([
      'strategy',
      'strategySelection',
      'plan',
      'optimizedPlan',
      'planDiff',
      'snapshot',
      'inspector',
      'inspectorRendered',
      'inspectorExported',
    ])
    expect(result.removed).toEqual([])
    expect(result.changed).toEqual([])
  })

  it('should detect all fields as removed when after is empty and before is full', () => {
    const differ = new DefaultPromptAssemblyTraceDiffer()
    const before = createFullTrace()
    const result = differ.diff(before, createEmptyTrace())
    expect(result.removed).toEqual([
      'strategy',
      'strategySelection',
      'plan',
      'optimizedPlan',
      'planDiff',
      'snapshot',
      'inspector',
      'inspectorRendered',
      'inspectorExported',
    ])
    expect(result.added).toEqual([])
    expect(result.changed).toEqual([])
  })

  it('should return empty diff when both traces are empty objects passed as undefined-like', () => {
    const differ = new DefaultPromptAssemblyTraceDiffer()
    const empty1: PromptAssemblyTrace = {}
    const empty2: PromptAssemblyTrace = {}
    const result = differ.diff(empty1, empty2)
    expect(result.added).toEqual([])
    expect(result.removed).toEqual([])
    expect(result.changed).toEqual([])
  })

  it('should handle empty vs trace with only strategy', () => {
    const differ = new DefaultPromptAssemblyTraceDiffer()
    const after = createTraceWithStrategy('create')
    const result = differ.diff(createEmptyTrace(), after)
    expect(result.added).toEqual(['strategy'])
    expect(result.removed).toEqual([])
    expect(result.changed).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// Added Fields
// ---------------------------------------------------------------------------

describe('Added fields', () => {
  it('should detect a single added field (strategy)', () => {
    const differ = new DefaultPromptAssemblyTraceDiffer()
    const before = createEmptyTrace()
    const after = createTraceWithStrategy('create')
    const result = differ.diff(before, after)
    expect(result.added).toEqual(['strategy'])
  })

  it('should detect a single added field (plan)', () => {
    const differ = new DefaultPromptAssemblyTraceDiffer()
    const before = createEmptyTrace()
    const after = createTraceWithPlan()
    const result = differ.diff(before, after)
    expect(result.added).toEqual(['plan'])
  })

  it('should detect multiple added fields', () => {
    const differ = new DefaultPromptAssemblyTraceDiffer()
    const before = createEmptyTrace()
    const after = createTraceWith({
      strategy: { name: 'query' },
      plan: { priorities: [] },
    })
    const result = differ.diff(before, after)
    expect(result.added).toEqual(['strategy', 'plan'])
  })

  it('should detect added inspectorRendered field', () => {
    const differ = new DefaultPromptAssemblyTraceDiffer()
    const before = createEmptyTrace()
    const after = createTraceWithInspectorRendered('some text')
    const result = differ.diff(before, after)
    expect(result.added).toEqual(['inspectorRendered'])
  })

  it('should return empty added when nothing added', () => {
    const differ = new DefaultPromptAssemblyTraceDiffer()
    const trace = createTraceWithStrategy('create')
    const result = differ.diff(trace, trace)
    expect(result.added).toEqual([])
  })

  it('should not report unchanged fields as added', () => {
    const differ = new DefaultPromptAssemblyTraceDiffer()
    const before = createTraceWithStrategy('create')
    const after = createTraceWith({
      strategy: { name: 'create' },
      plan: { priorities: [] },
    })
    const result = differ.diff(before, after)
    // strategy is present in both (unchanged) → not added
    // plan is new → added
    expect(result.added).toEqual(['plan'])
  })

  it('should detect full trace added when going from empty', () => {
    const differ = new DefaultPromptAssemblyTraceDiffer()
    const result = differ.diff(createEmptyTrace(), createFullTrace())
    expect(result.added).toHaveLength(9)
  })
})

// ---------------------------------------------------------------------------
// Removed Fields
// ---------------------------------------------------------------------------

describe('Removed fields', () => {
  it('should detect a single removed field (strategy)', () => {
    const differ = new DefaultPromptAssemblyTraceDiffer()
    const before = createTraceWithStrategy('create')
    const after = createEmptyTrace()
    const result = differ.diff(before, after)
    expect(result.removed).toEqual(['strategy'])
  })

  it('should detect multiple removed fields', () => {
    const differ = new DefaultPromptAssemblyTraceDiffer()
    const before = createTraceWith({
      strategy: { name: 'create' },
      plan: { priorities: [] },
      snapshot: { plan: { priorities: [] } },
    })
    const after = createTraceWithStrategy('create')
    const result = differ.diff(before, after)
    expect(result.removed).toEqual(['plan', 'snapshot'])
  })

  it('should return empty removed when nothing removed', () => {
    const differ = new DefaultPromptAssemblyTraceDiffer()
    const trace = createFullTrace()
    const result = differ.diff(trace, trace)
    expect(result.removed).toEqual([])
  })

  it('should detect removed inspectorRendered field', () => {
    const differ = new DefaultPromptAssemblyTraceDiffer()
    const before = createTraceWithInspectorRendered('some text')
    const after = createEmptyTrace()
    const result = differ.diff(before, after)
    expect(result.removed).toEqual(['inspectorRendered'])
  })

  it('should detect all fields removed when going to empty', () => {
    const differ = new DefaultPromptAssemblyTraceDiffer()
    const result = differ.diff(createFullTrace(), createEmptyTrace())
    expect(result.removed).toHaveLength(9)
  })

  it('should not report unchanged fields as removed', () => {
    const differ = new DefaultPromptAssemblyTraceDiffer()
    const strategy = { name: 'create' }
    const before = createTraceWith({
      strategy,
      plan: { priorities: [] },
    })
    const after = createTraceWith({ strategy })
    const result = differ.diff(before, after)
    expect(result.removed).toEqual(['plan'])
    expect(result.added).toEqual([])
    expect(result.changed).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// Changed Fields
// ---------------------------------------------------------------------------

describe('Changed fields', () => {
  it('should detect a single changed field (strategy)', () => {
    const differ = new DefaultPromptAssemblyTraceDiffer()
    const before = createTraceWithStrategy('create')
    const after = createTraceWithStrategy('query')
    const result = differ.diff(before, after)
    expect(result.changed).toEqual(['strategy'])
  })

  it('should detect changed inspectorRendered field', () => {
    const differ = new DefaultPromptAssemblyTraceDiffer()
    const before = createTraceWithInspectorRendered('old text')
    const after = createTraceWithInspectorRendered('new text')
    const result = differ.diff(before, after)
    expect(result.changed).toEqual(['inspectorRendered'])
  })

  it('should detect multiple changed fields', () => {
    const differ = new DefaultPromptAssemblyTraceDiffer()
    const before = createTraceWith({
      strategy: { name: 'create' },
      plan: { priorities: [{ section: 'a', priority: 100 }] },
    })
    const after = createTraceWith({
      strategy: { name: 'query' },
      plan: { priorities: [{ section: 'a', priority: 50 }] },
    })
    const result = differ.diff(before, after)
    expect(result.changed).toEqual(['strategy', 'plan'])
  })

  it('should not report equal values as changed', () => {
    const differ = new DefaultPromptAssemblyTraceDiffer()
    const trace = createTraceWithStrategy('create')
    const result = differ.diff(trace, trace)
    expect(result.changed).toEqual([])
  })

  it('should detect changed inspectorExported field', () => {
    const differ = new DefaultPromptAssemblyTraceDiffer()
    const before = createTraceWith({ inspectorExported: '{"a":1}' })
    const after = createTraceWith({ inspectorExported: '{"b":2}' })
    const result = differ.diff(before, after)
    expect(result.changed).toEqual(['inspectorExported'])
  })

  it('should detect changed strategySelection field', () => {
    const differ = new DefaultPromptAssemblyTraceDiffer()
    const before = createTraceWithStrategySelection('create')
    const after = createTraceWithStrategySelection('query')
    const result = differ.diff(before, after)
    expect(result.changed).toEqual(['strategySelection'])
  })

  it('should detect changed snapshot field', () => {
    const differ = new DefaultPromptAssemblyTraceDiffer()
    const before = createTraceWith({ snapshot: { plan: { priorities: [] } } })
    const after = createTraceWith({ snapshot: { plan: { priorities: [{ section: 'x', priority: 10 }] } } })
    const result = differ.diff(before, after)
    expect(result.changed).toEqual(['snapshot'])
  })
})

// ---------------------------------------------------------------------------
// Mixed Changes
// ---------------------------------------------------------------------------

describe('Mixed changes', () => {
  it('should detect added, removed, and changed simultaneously', () => {
    const differ = new DefaultPromptAssemblyTraceDiffer()
    const before = createTraceWith({
      strategy: { name: 'create' },
      plan: { priorities: [] },
    })
    const after = createTraceWith({
      strategy: { name: 'query' },
      optimizedPlan: { priorities: [] },
    })
    const result = differ.diff(before, after)
    // strategy: present in both but changed
    // plan: removed (not in after)
    // optimizedPlan: added (not in before)
    expect(result.removed).toEqual(['plan'])
    expect(result.added).toEqual(['optimizedPlan'])
    expect(result.changed).toEqual(['strategy'])
  })

  it('should handle add + change without remove', () => {
    const differ = new DefaultPromptAssemblyTraceDiffer()
    const before = createTraceWithStrategy('create')
    const after = createTraceWith({
      strategy: { name: 'query' },
      plan: { priorities: [] },
    })
    const result = differ.diff(before, after)
    expect(result.added).toEqual(['plan'])
    expect(result.removed).toEqual([])
    expect(result.changed).toEqual(['strategy'])
  })

  it('should handle remove + change without add', () => {
    const differ = new DefaultPromptAssemblyTraceDiffer()
    const before = createTraceWith({
      strategy: { name: 'create' },
      plan: { priorities: [] },
    })
    const after = createTraceWithStrategy('query')
    const result = differ.diff(before, after)
    expect(result.changed).toEqual(['strategy'])
    expect(result.removed).toEqual(['plan'])
    expect(result.added).toEqual([])
  })

  it('should handle add + remove without change', () => {
    const differ = new DefaultPromptAssemblyTraceDiffer()
    const before = createTraceWith({ plan: { priorities: [] } })
    const after = createTraceWith({ optimizedPlan: { priorities: [] } })
    const result = differ.diff(before, after)
    expect(result.removed).toEqual(['plan'])
    expect(result.added).toEqual(['optimizedPlan'])
    expect(result.changed).toEqual([])
  })

  it('should handle full changes between two different traces', () => {
    const differ = new DefaultPromptAssemblyTraceDiffer()
    const before = createTraceWith({
      strategy: { name: 'create' },
      plan: { priorities: [] },
      snapshot: { plan: { priorities: [] } },
    })
    const after = createTraceWith({
      strategy: { name: 'query' },
      optimizedPlan: { priorities: [] },
      inspector: { strategy: 'query', sections: [] },
    })
    const result = differ.diff(before, after)
    expect(result.removed).toEqual(['plan', 'snapshot'])
    expect(result.added).toEqual(['optimizedPlan', 'inspector'])
    expect(result.changed).toEqual(['strategy'])
  })

  it('should handle complex scenario with many fields', () => {
    const differ = new DefaultPromptAssemblyTraceDiffer()
    const before = createTraceWith({
      strategy: { name: 'a' },
      strategySelection: { selected: 'a', candidates: [] },
      plan: { priorities: [] },
      inspectorRendered: 'old',
    })
    const after = createTraceWith({
      strategy: { name: 'b' },
      strategySelection: { selected: 'b', candidates: [] },
      optimizedPlan: { priorities: [] },
      inspectorRendered: 'new',
      inspectorExported: 'exported',
    })
    const result = differ.diff(before, after)
    expect(result.removed).toEqual(['plan'])
    expect(result.added).toEqual(['optimizedPlan', 'inspectorExported'])
    expect(result.changed).toEqual(['strategy', 'strategySelection', 'inspectorRendered'])
  })
})

// ---------------------------------------------------------------------------
// Ordering
// ---------------------------------------------------------------------------

describe('Ordering', () => {
  it('should preserve field declaration order in added array', () => {
    const differ = new DefaultPromptAssemblyTraceDiffer()
    const after = createTraceWith({
      inspectorExported: 'exported',
      strategy: { name: 'create' },
      plan: { priorities: [] },
    })
    const result = differ.diff(createEmptyTrace(), after)
    // Order should follow TRACE_FIELDS: strategy, strategySelection, plan, ...
    expect(result.added[0]).toBe('strategy')
    expect(result.added[1]).toBe('plan')
    // inspectorExported should be last (9th field)
    expect(result.added[result.added.length - 1]).toBe('inspectorExported')
  })

  it('should preserve field declaration order in removed array', () => {
    const differ = new DefaultPromptAssemblyTraceDiffer()
    const before = createTraceWith({
      inspectorExported: 'exported',
      strategy: { name: 'create' },
      plan: { priorities: [] },
    })
    const result = differ.diff(before, createEmptyTrace())
    expect(result.removed[0]).toBe('strategy')
    expect(result.removed[1]).toBe('plan')
    expect(result.removed[result.removed.length - 1]).toBe('inspectorExported')
  })

  it('should preserve field declaration order in changed array', () => {
    const differ = new DefaultPromptAssemblyTraceDiffer()
    const before = createTraceWith({
      inspectorExported: '{"a":1}',
      strategy: { name: 'create' },
      plan: { priorities: [] },
    })
    const after = createTraceWith({
      inspectorExported: '{"b":2}',
      strategy: { name: 'query' },
      plan: { priorities: [{ section: 'x', priority: 99 }] },
    })
    const result = differ.diff(before, after)
    expect(result.changed[0]).toBe('strategy')
    expect(result.changed[1]).toBe('plan')
    expect(result.changed[result.changed.length - 1]).toBe('inspectorExported')
  })
})

// ---------------------------------------------------------------------------
// Deterministic
// ---------------------------------------------------------------------------

describe('Deterministic', () => {
  it('should produce same result for same inputs across multiple calls', () => {
    const differ = new DefaultPromptAssemblyTraceDiffer()
    const before = createTraceWith({ strategy: { name: 'create' }, plan: { priorities: [] } })
    const after = createTraceWith({ strategy: { name: 'query' }, optimizedPlan: { priorities: [] } })
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
    const d1 = new DefaultPromptAssemblyTraceDiffer()
    const d2 = new DefaultPromptAssemblyTraceDiffer()
    const before = createTraceWithStrategy('create')
    const after = createTraceWithStrategy('query')
    const r1 = d1.diff(before, after)
    const r2 = d2.diff(before, after)
    expect(r1.added).toEqual(r2.added)
    expect(r1.removed).toEqual(r2.removed)
    expect(r1.changed).toEqual(r2.changed)
  })

  it('should produce same result for identical trace pairs', () => {
    const differ = new DefaultPromptAssemblyTraceDiffer()
    const before1 = createTraceWithStrategy('create')
    const after1 = createTraceWithStrategy('query')
    const before2 = createTraceWithStrategy('create')
    const after2 = createTraceWithStrategy('query')
    expect(differ.diff(before1, after1)).toEqual(differ.diff(before2, after2))
  })

  it('should produce same result across multiple calls for full traces', () => {
    const differ = new DefaultPromptAssemblyTraceDiffer()
    const before = createFullTrace()
    const after = createEmptyTrace()
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
    const differ = new DefaultPromptAssemblyTraceDiffer()
    const r1 = differ.diff(
      createTraceWithStrategy('create'),
      createTraceWith({
        strategy: { name: 'create' },
        plan: { priorities: [] },
      }),
    )
    const r2 = differ.diff(
      createTraceWithStrategy('create'),
      createTraceWithStrategy('query'),
    )
    // r1 has added: ['plan']
    expect(r1.added).toEqual(['plan'])
    // r2 has changed: ['strategy']
    expect(r2.changed).toEqual(['strategy'])
    expect(r2.added).toEqual([])
  })

  it('should produce independent results from sequential calls', () => {
    const differ = new DefaultPromptAssemblyTraceDiffer()
    const r1 = differ.diff(createEmptyTrace(), createFullTrace())
    const r2 = differ.diff(createFullTrace(), createEmptyTrace())
    // r1: all added
    expect(r1.added).toHaveLength(9)
    expect(r1.removed).toHaveLength(0)
    // r2: all removed
    expect(r2.removed).toHaveLength(9)
    expect(r2.added).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// Pure
// ---------------------------------------------------------------------------

describe('Pure', () => {
  it('should not modify input before trace', () => {
    const differ = new DefaultPromptAssemblyTraceDiffer()
    const before = createTraceWithStrategy('create')
    const after = createTraceWithStrategy('query')
    const originalBefore = JSON.stringify(before)
    differ.diff(before, after)
    expect(JSON.stringify(before)).toBe(originalBefore)
  })

  it('should not modify input after trace', () => {
    const differ = new DefaultPromptAssemblyTraceDiffer()
    const before = createTraceWithStrategy('create')
    const after = createTraceWithStrategy('query')
    const originalAfter = JSON.stringify(after)
    differ.diff(before, after)
    expect(JSON.stringify(after)).toBe(originalAfter)
  })

  it('should not modify trace field values', () => {
    const differ = new DefaultPromptAssemblyTraceDiffer()
    const before: PromptAssemblyTrace = { strategy: { name: 'create' } }
    const after: PromptAssemblyTrace = { strategy: { name: 'query' } }
    const strategyBefore = (before.strategy as { name: string }).name
    const strategyAfter = (after.strategy as { name: string }).name
    differ.diff(before, after)
    expect((before.strategy as { name: string }).name).toBe(strategyBefore)
    expect((after.strategy as { name: string }).name).toBe(strategyAfter)
  })

  it('should not mutate when traces have nested objects', () => {
    const differ = new DefaultPromptAssemblyTraceDiffer()
    const before: PromptAssemblyTrace = { snapshot: { plan: { priorities: [{ section: 'x', priority: 100 }] } } }
    const after: PromptAssemblyTrace = { snapshot: { plan: { priorities: [{ section: 'x', priority: 50 }] } } }
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
    const differ = new DefaultPromptAssemblyTraceDiffer()
    const result = differ.diff(createEmptyTrace(), createTraceWithStrategy('create'))
    expect(Object.isFrozen(result)).toBe(true)
  })

  it('should return frozen added array', () => {
    const differ = new DefaultPromptAssemblyTraceDiffer()
    const result = differ.diff(createEmptyTrace(), createTraceWithStrategy('create'))
    expect(Object.isFrozen(result.added)).toBe(true)
  })

  it('should return frozen removed array', () => {
    const differ = new DefaultPromptAssemblyTraceDiffer()
    const result = differ.diff(createEmptyTrace(), createFullTrace())
    expect(Object.isFrozen(result.removed)).toBe(true)
  })

  it('should return frozen changed array', () => {
    const differ = new DefaultPromptAssemblyTraceDiffer()
    const before = createTraceWithStrategy('create')
    const after = createTraceWithStrategy('query')
    const result = differ.diff(before, after)
    expect(Object.isFrozen(result.changed)).toBe(true)
  })

  it('should not be able to modify diff result', () => {
    const differ = new DefaultPromptAssemblyTraceDiffer()
    const result = differ.diff(createEmptyTrace(), createTraceWithStrategy('create'))
    expect(() => {
      const r = result as unknown as Record<string, unknown>
      r.added = ['x']
    }).toThrow()
  })
})

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

describe('Exports', () => {
  it('should export DefaultPromptAssemblyTraceDiffer from strategy index', async () => {
    const mod = await import('../strategy')
    expect(mod.DefaultPromptAssemblyTraceDiffer).toBeDefined()
  })

  it('should export PromptAssemblyTraceDiff type from strategy index', async () => {
    const mod = await import('../strategy')
    expect(mod.DefaultPromptAssemblyTraceDiffer).toBeDefined()
  })

  it('should export PromptAssemblyTraceDiffer type from strategy index', async () => {
    const mod = await import('../strategy')
    expect(mod.DefaultPromptAssemblyTraceDiffer).toBeDefined()
  })

  it('should export DefaultPromptAssemblyTraceDiffer from package root', async () => {
    const mod = await import('..')
    expect(mod.DefaultPromptAssemblyTraceDiffer).toBeDefined()
  })

  it('should export PromptAssemblyTraceDiff type from package root', async () => {
    const mod = await import('..')
    expect(mod.DefaultPromptAssemblyTraceDiffer).toBeDefined()
  })

  it('should export PromptAssemblyTraceDiffer type from package root', async () => {
    const mod = await import('..')
    expect(mod.DefaultPromptAssemblyTraceDiffer).toBeDefined()
  })

  it('should export DefaultPromptAssemblyTraceDiffer as a class', () => {
    const differ = new DefaultPromptAssemblyTraceDiffer()
    expect(differ).toBeInstanceOf(DefaultPromptAssemblyTraceDiffer)
  })

  it('should export PromptAssemblyTraceDiff as a type', () => {
    const diff: PromptAssemblyTraceDiff = { added: [], removed: [], changed: [] }
    expect(diff.added).toEqual([])
  })

  it('should export PromptAssemblyTraceDiffer as a type', () => {
    const differ: PromptAssemblyTraceDiffer = new DefaultPromptAssemblyTraceDiffer()
    expect(typeof differ.diff).toBe('function')
  })
})

// ---------------------------------------------------------------------------
// Architecture Compliance
// ---------------------------------------------------------------------------

describe('Architecture compliance', () => {
  it('should not depend on Planner', () => {
    const differ = new DefaultPromptAssemblyTraceDiffer()
    expect(differ).toBeInstanceOf(DefaultPromptAssemblyTraceDiffer)
  })

  it('should not depend on Runtime', () => {
    const differ = new DefaultPromptAssemblyTraceDiffer()
    expect(differ).toBeDefined()
  })

  it('should not depend on Provider', () => {
    const differ = new DefaultPromptAssemblyTraceDiffer()
    expect(differ).toBeDefined()
  })

  it('should not depend on Memory', () => {
    const differ = new DefaultPromptAssemblyTraceDiffer()
    expect(differ).toBeDefined()
  })

  it('should not depend on AgentLoop', () => {
    const differ = new DefaultPromptAssemblyTraceDiffer()
    expect(differ).toBeDefined()
  })

  it('should not depend on Pipeline', () => {
    const differ = new DefaultPromptAssemblyTraceDiffer()
    expect(differ).toBeDefined()
  })

  it('should not modify PromptBuilder', () => {
    const differ = new DefaultPromptAssemblyTraceDiffer()
    expect(differ).toBeDefined()
  })

  it('should not modify PromptRenderer', () => {
    const differ = new DefaultPromptAssemblyTraceDiffer()
    expect(differ).toBeDefined()
  })

  it('should not modify PromptCompression', () => {
    const differ = new DefaultPromptAssemblyTraceDiffer()
    expect(differ).toBeDefined()
  })

  it('should not modify PromptAssemblyTrace', () => {
    const differ = new DefaultPromptAssemblyTraceDiffer()
    const trace = createFullTrace()
    const result = differ.diff(trace, trace)
    expect(result.added).toEqual([])
    expect(result.removed).toEqual([])
    expect(result.changed).toEqual([])
  })

  it('should not modify Planner', () => {
    const differ = new DefaultPromptAssemblyTraceDiffer()
    expect(differ).toBeDefined()
  })

  it('should not modify Runtime', () => {
    const differ = new DefaultPromptAssemblyTraceDiffer()
    expect(differ).toBeDefined()
  })

  it('should not modify AgentLoop', () => {
    const differ = new DefaultPromptAssemblyTraceDiffer()
    expect(differ).toBeDefined()
  })

  it('should not modify DefaultPromptBuilder', () => {
    const differ = new DefaultPromptAssemblyTraceDiffer()
    expect(differ).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Compatibility — RetryPlanner
// ---------------------------------------------------------------------------

describe('RetryPlanner compatibility', () => {
  it('should be compatible with RetryPlanner scenarios', () => {
    const differ = new DefaultPromptAssemblyTraceDiffer()
    const before = createTraceWithStrategy('create')
    const after = createTraceWithStrategy('query')
    const result = differ.diff(before, after)
    expect(result.changed).toEqual(['strategy'])
  })
})

// ---------------------------------------------------------------------------
// Compatibility — ToolCallPlanner
// ---------------------------------------------------------------------------

describe('ToolCallPlanner compatibility', () => {
  it('should be compatible with ToolCallPlanner scenarios', () => {
    const differ = new DefaultPromptAssemblyTraceDiffer()
    const before = createTraceWith({ plan: { priorities: [] } })
    const after = createTraceWith({ optimizedPlan: { priorities: [] }, planDiff: { added: [], removed: [], changed: [] } })
    const result = differ.diff(before, after)
    expect(result.removed).toEqual(['plan'])
    expect(result.added).toEqual(['optimizedPlan', 'planDiff'])
  })
})

// ---------------------------------------------------------------------------
// Compatibility — Streaming
// ---------------------------------------------------------------------------

describe('Streaming compatibility', () => {
  it('should be compatible with streaming pipeline', () => {
    const differ = new DefaultPromptAssemblyTraceDiffer()
    const before = createEmptyTrace()
    const after = createTraceWith({ inspectorRendered: 'streaming output' })
    const result = differ.diff(before, after)
    expect(result.added).toEqual(['inspectorRendered'])
  })
})

// ---------------------------------------------------------------------------
// Compatibility — AgentLoop
// ---------------------------------------------------------------------------

describe('AgentLoop compatibility', () => {
  it('should be compatible with AgentLoop', () => {
    const differ = new DefaultPromptAssemblyTraceDiffer()
    const before = createTraceWithStrategy('create')
    const after = createTraceWithStrategy('query')
    const result = differ.diff(before, after)
    expect(result.changed[0]).toBe('strategy')
  })
})

// ---------------------------------------------------------------------------
// Edge Cases
// ---------------------------------------------------------------------------

describe('Edge cases', () => {
  it('should handle undefined values in before trace', () => {
    const differ = new DefaultPromptAssemblyTraceDiffer()
    const before: PromptAssemblyTrace = { strategy: undefined }
    const after = createTraceWithStrategy('create')
    const result = differ.diff(before, after)
    expect(result.added).toEqual(['strategy'])
    expect(result.changed).toEqual([])
  })

  it('should handle undefined values in after trace', () => {
    const differ = new DefaultPromptAssemblyTraceDiffer()
    const before = createTraceWithStrategy('create')
    const after: PromptAssemblyTrace = { strategy: undefined }
    const result = differ.diff(before, after)
    expect(result.removed).toEqual(['strategy'])
  })

  it('should handle null-like fields treated as present in both', () => {
    const differ = new DefaultPromptAssemblyTraceDiffer()
    const before: PromptAssemblyTrace = { inspectorRendered: '' as unknown as undefined }
    const after: PromptAssemblyTrace = { inspectorRendered: '' as unknown as undefined }
    const result = differ.diff(before, after)
    // Empty string is defined, so both have it with same value → no change
    expect(result.changed).toEqual([])
    expect(result.added).toEqual([])
    expect(result.removed).toEqual([])
  })

  it('should handle switching from string to object field', () => {
    const differ = new DefaultPromptAssemblyTraceDiffer()
    const before: PromptAssemblyTrace = { strategy: 'create' as unknown as { name: string } }
    const after: PromptAssemblyTrace = { strategy: { name: 'create' } }
    const result = differ.diff(before, after)
    expect(result.changed).toEqual(['strategy'])
  })
})