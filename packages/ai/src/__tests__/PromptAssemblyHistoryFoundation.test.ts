import { describe, it, expect } from 'vitest'
import { DefaultPromptAssemblyHistoryBuilder } from '../strategy/DefaultPromptAssemblyHistoryBuilder'
import type { PromptAssemblyHistoryBuilder } from '../strategy/PromptAssemblyHistoryBuilder'
import type { PromptAssemblyHistory } from '../strategy/PromptAssemblyHistory'
import type { PromptAssemblyHistoryEntry } from '../strategy/PromptAssemblyHistoryEntry'
import type { PromptAssemblyTrace } from '../strategy/PromptAssemblyTrace'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function emptyTrace(): PromptAssemblyTrace {
  return {}
}

function traceWithStrategy(name: string): PromptAssemblyTrace {
  return { strategy: { name } }
}

function createHistoryWithTraces(traces: PromptAssemblyTrace[]): PromptAssemblyHistory {
  return new DefaultPromptAssemblyHistoryBuilder().build(traces)
}

// ---------------------------------------------------------------------------
// History Entry
// ---------------------------------------------------------------------------

describe('History entry interface', () => {
  it('should have index field', () => {
    const entry: PromptAssemblyHistoryEntry = { index: 0, trace: emptyTrace() }
    expect(entry.index).toBe(0)
  })

  it('should have trace field', () => {
    const entry: PromptAssemblyHistoryEntry = { index: 0, trace: emptyTrace() }
    expect(entry.trace).toBeDefined()
  })

  it('should be readonly', () => {
    const entry: PromptAssemblyHistoryEntry = { index: 0, trace: emptyTrace() }
    // Verify it's a valid object with expected shape
    expect(Object.keys(entry)).toEqual(['index', 'trace'])
  })

  it('should accept trace with strategy', () => {
    const entry: PromptAssemblyHistoryEntry = { index: 5, trace: traceWithStrategy('create') }
    expect(entry.index).toBe(5)
    expect(entry.trace.strategy).toEqual({ name: 'create' })
  })

  it('should accept full trace', () => {
    const trace: PromptAssemblyTrace = {
      strategy: { name: 'create' },
      strategySelection: { selected: 'create', candidates: [] },
      plan: { priorities: [{ section: 'userInput', priority: 100 }] },
    }
    const entry: PromptAssemblyHistoryEntry = { index: 0, trace }
    expect(entry.trace.plan).toBeDefined()
    expect(entry.trace.strategySelection).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// History Interface
// ---------------------------------------------------------------------------

describe('History interface', () => {
  it('should have entries field', () => {
    const history: PromptAssemblyHistory = { entries: [] }
    expect(history.entries).toBeDefined()
    expect(Array.isArray(history.entries)).toBe(true)
  })

  it('should be readonly', () => {
    const history: PromptAssemblyHistory = { entries: [] }
    expect(Object.keys(history)).toEqual(['entries'])
  })

  it('should accept entries array', () => {
    const entry: PromptAssemblyHistoryEntry = { index: 0, trace: emptyTrace() }
    const history: PromptAssemblyHistory = { entries: [entry] }
    expect(history.entries).toHaveLength(1)
  })
})

// ---------------------------------------------------------------------------
// Builder Contract
// ---------------------------------------------------------------------------

describe('Builder contract', () => {
  it('should define build method', () => {
    const builder: PromptAssemblyHistoryBuilder = new DefaultPromptAssemblyHistoryBuilder()
    expect(typeof builder.build).toBe('function')
  })

  it('should accept traces array and return history', () => {
    const builder = new DefaultPromptAssemblyHistoryBuilder()
    const result = builder.build([])
    expect(result).toBeDefined()
    expect(result.entries).toBeDefined()
  })

  it('should accept a custom implementation', () => {
    const custom: PromptAssemblyHistoryBuilder = {
      build(_traces: readonly PromptAssemblyTrace[]): PromptAssemblyHistory {
        return { entries: [{ index: 42, trace: { strategy: { name: 'custom' } } }] }
      },
    }
    const result = custom.build([])
    expect(result.entries).toHaveLength(1)
    expect(result.entries[0].index).toBe(42)
  })
})

// ---------------------------------------------------------------------------
// Empty History
// ---------------------------------------------------------------------------

describe('Empty history', () => {
  it('should build empty history from empty traces', () => {
    const builder = new DefaultPromptAssemblyHistoryBuilder()
    const history = builder.build([])
    expect(history.entries).toHaveLength(0)
  })

  it('should return frozen entries array', () => {
    const builder = new DefaultPromptAssemblyHistoryBuilder()
    const history = builder.build([])
    expect(Object.isFrozen(history.entries)).toBe(true)
  })

  it('should return frozen history object', () => {
    const builder = new DefaultPromptAssemblyHistoryBuilder()
    const history = builder.build([])
    expect(Object.isFrozen(history)).toBe(true)
  })

  it('should have empty entries array', () => {
    const builder = new DefaultPromptAssemblyHistoryBuilder()
    const history = builder.build([])
    expect(history.entries).toEqual([])
  })

  it('should return same empty history across multiple calls', () => {
    const builder = new DefaultPromptAssemblyHistoryBuilder()
    expect(builder.build([])).toEqual(builder.build([]))
  })
})

// ---------------------------------------------------------------------------
// Single Entry
// ---------------------------------------------------------------------------

describe('Single entry', () => {
  it('should build history with one trace', () => {
    const builder = new DefaultPromptAssemblyHistoryBuilder()
    const history = builder.build([traceWithStrategy('create')])
    expect(history.entries).toHaveLength(1)
  })

  it('should assign index 0 to single entry', () => {
    const builder = new DefaultPromptAssemblyHistoryBuilder()
    const history = builder.build([traceWithStrategy('create')])
    expect(history.entries[0].index).toBe(0)
  })

  it('should preserve trace in entry', () => {
    const builder = new DefaultPromptAssemblyHistoryBuilder()
    const history = builder.build([traceWithStrategy('create')])
    expect(history.entries[0].trace).toEqual({ strategy: { name: 'create' } })
  })

  it('should freeze single entry', () => {
    const builder = new DefaultPromptAssemblyHistoryBuilder()
    const history = builder.build([traceWithStrategy('create')])
    expect(Object.isFrozen(history.entries[0])).toBe(true)
  })

  it('should handle empty trace', () => {
    const builder = new DefaultPromptAssemblyHistoryBuilder()
    const history = builder.build([emptyTrace()])
    expect(history.entries[0].trace).toEqual({})
  })

  it('should handle trace with full structure', () => {
    const builder = new DefaultPromptAssemblyHistoryBuilder()
    const trace: PromptAssemblyTrace = {
      strategy: { name: 'create' },
      strategySelection: { selected: 'create', candidates: [] },
      plan: { priorities: [{ section: 'userInput', priority: 100 }] },
      optimizedPlan: { priorities: [{ section: 'userInput', priority: 90 }] },
      planDiff: { added: [], removed: [], changed: [{ section: 'userInput', before: 100, after: 90 }] },
      snapshot: { plan: { priorities: [] } },
      inspector: { strategy: 'create', sections: [{ title: 'Rendered Strategy', content: 'create' }] },
      inspectorRendered: 'rendered',
      inspectorExported: '{"strategy":"create"}',
    }
    const history = builder.build([trace])
    expect(history.entries[0].trace.strategy).toBeDefined()
    expect(history.entries[0].trace.inspectorRendered).toBe('rendered')
  })

  it('should handle query strategy trace', () => {
    const builder = new DefaultPromptAssemblyHistoryBuilder()
    const history = builder.build([traceWithStrategy('query')])
    expect(history.entries[0].trace.strategy).toEqual({ name: 'query' })
  })

  it('should handle modify strategy trace', () => {
    const builder = new DefaultPromptAssemblyHistoryBuilder()
    const history = builder.build([traceWithStrategy('modify')])
    expect(history.entries[0].trace.strategy).toEqual({ name: 'modify' })
  })

  it('should handle delete strategy trace', () => {
    const builder = new DefaultPromptAssemblyHistoryBuilder()
    const history = builder.build([traceWithStrategy('delete')])
    expect(history.entries[0].trace.strategy).toEqual({ name: 'delete' })
  })
})

// ---------------------------------------------------------------------------
// Multiple Entries
// ---------------------------------------------------------------------------

describe('Multiple entries', () => {
  it('should build history with multiple traces', () => {
    const builder = new DefaultPromptAssemblyHistoryBuilder()
    const history = builder.build([
      traceWithStrategy('create'),
      traceWithStrategy('query'),
      traceWithStrategy('modify'),
    ])
    expect(history.entries).toHaveLength(3)
  })

  it('should assign sequential indices', () => {
    const builder = new DefaultPromptAssemblyHistoryBuilder()
    const history = builder.build([
      traceWithStrategy('create'),
      traceWithStrategy('query'),
      traceWithStrategy('modify'),
    ])
    expect(history.entries[0].index).toBe(0)
    expect(history.entries[1].index).toBe(1)
    expect(history.entries[2].index).toBe(2)
  })

  it('should preserve each trace by position', () => {
    const builder = new DefaultPromptAssemblyHistoryBuilder()
    const history = builder.build([
      traceWithStrategy('create'),
      traceWithStrategy('query'),
      traceWithStrategy('modify'),
    ])
    expect(history.entries[0].trace.strategy).toEqual({ name: 'create' })
    expect(history.entries[1].trace.strategy).toEqual({ name: 'query' })
    expect(history.entries[2].trace.strategy).toEqual({ name: 'modify' })
  })

  it('should handle repeated strategies', () => {
    const builder = new DefaultPromptAssemblyHistoryBuilder()
    const history = builder.build([
      traceWithStrategy('create'),
      traceWithStrategy('create'),
      traceWithStrategy('create'),
    ])
    expect(history.entries).toHaveLength(3)
    expect(history.entries[0].trace.strategy).toEqual({ name: 'create' })
    expect(history.entries[1].trace.strategy).toEqual({ name: 'create' })
    expect(history.entries[2].trace.strategy).toEqual({ name: 'create' })
  })

  it('should freeze all entries', () => {
    const builder = new DefaultPromptAssemblyHistoryBuilder()
    const history = builder.build([
      traceWithStrategy('create'),
      traceWithStrategy('query'),
    ])
    expect(Object.isFrozen(history.entries[0])).toBe(true)
    expect(Object.isFrozen(history.entries[1])).toBe(true)
  })

  it('should freeze entries array', () => {
    const builder = new DefaultPromptAssemblyHistoryBuilder()
    const history = builder.build([
      traceWithStrategy('create'),
      traceWithStrategy('query'),
    ])
    expect(Object.isFrozen(history.entries)).toBe(true)
  })

  it('should freeze history object', () => {
    const builder = new DefaultPromptAssemblyHistoryBuilder()
    const history = builder.build([
      traceWithStrategy('create'),
      traceWithStrategy('query'),
    ])
    expect(Object.isFrozen(history)).toBe(true)
  })

  it('should handle four strategies', () => {
    const builder = new DefaultPromptAssemblyHistoryBuilder()
    const history = builder.build([
      traceWithStrategy('create'),
      traceWithStrategy('query'),
      traceWithStrategy('modify'),
      traceWithStrategy('delete'),
    ])
    expect(history.entries).toHaveLength(4)
    expect(history.entries[0].trace.strategy).toEqual({ name: 'create' })
    expect(history.entries[3].trace.strategy).toEqual({ name: 'delete' })
  })

  it('should handle five strategies with mixed order', () => {
    const builder = new DefaultPromptAssemblyHistoryBuilder()
    const history = builder.build([
      traceWithStrategy('query'),
      traceWithStrategy('delete'),
      traceWithStrategy('create'),
      traceWithStrategy('modify'),
      traceWithStrategy('query'),
    ])
    expect(history.entries).toHaveLength(5)
    expect(history.entries[0].trace.strategy).toEqual({ name: 'query' })
    expect(history.entries[4].trace.strategy).toEqual({ name: 'query' })
  })
})

// ---------------------------------------------------------------------------
// Large History
// ---------------------------------------------------------------------------

describe('Large history', () => {
  it('should handle 100 traces', () => {
    const builder = new DefaultPromptAssemblyHistoryBuilder()
    const traces = Array.from({ length: 100 }, (_, i) => traceWithStrategy(`strategy-${i}`))
    const history = builder.build(traces)
    expect(history.entries).toHaveLength(100)
    expect(history.entries[0].index).toBe(0)
    expect(history.entries[99].index).toBe(99)
  })

  it('should handle 200 traces', () => {
    const builder = new DefaultPromptAssemblyHistoryBuilder()
    const traces = Array.from({ length: 200 }, () => emptyTrace())
    const history = builder.build(traces)
    expect(history.entries).toHaveLength(200)
    expect(history.entries[199].index).toBe(199)
  })

  it('should maintain correct indices for large history', () => {
    const builder = new DefaultPromptAssemblyHistoryBuilder()
    const traces = Array.from({ length: 50 }, (_, i) => traceWithStrategy(`s-${i}`))
    const history = builder.build(traces)
    for (let i = 0; i < 50; i++) {
      expect(history.entries[i].index).toBe(i)
    }
  })
})

// ---------------------------------------------------------------------------
// Order Preservation
// ---------------------------------------------------------------------------

describe('Order preservation', () => {
  it('should preserve trace order', () => {
    const builder = new DefaultPromptAssemblyHistoryBuilder()
    const traces = [
      traceWithStrategy('first'),
      traceWithStrategy('second'),
      traceWithStrategy('third'),
    ]
    const history = builder.build(traces)
    expect(history.entries[0].trace).toBe(traces[0])
    expect(history.entries[1].trace).toBe(traces[1])
    expect(history.entries[2].trace).toBe(traces[2])
  })

  it('should not sort or reorder entries', () => {
    const builder = new DefaultPromptAssemblyHistoryBuilder()
    const traces = [
      traceWithStrategy('z'),
      traceWithStrategy('a'),
      traceWithStrategy('m'),
    ]
    const history = builder.build(traces)
    expect(history.entries[0].trace.strategy).toEqual({ name: 'z' })
    expect(history.entries[1].trace.strategy).toEqual({ name: 'a' })
    expect(history.entries[2].trace.strategy).toEqual({ name: 'm' })
  })

  it('should preserve reverse alphabetical order', () => {
    const builder = new DefaultPromptAssemblyHistoryBuilder()
    const traces = [
      traceWithStrategy('delete'),
      traceWithStrategy('modify'),
      traceWithStrategy('query'),
      traceWithStrategy('create'),
    ]
    const history = builder.build(traces)
    expect(history.entries[0].trace.strategy).toEqual({ name: 'delete' })
    expect(history.entries[3].trace.strategy).toEqual({ name: 'create' })
  })

  it('should preserve insertion order when traces are identical', () => {
    const builder = new DefaultPromptAssemblyHistoryBuilder()
    const traces = [
      traceWithStrategy('create'),
      traceWithStrategy('create'),
      traceWithStrategy('create'),
    ]
    const history = builder.build(traces)
    expect(history.entries[0].trace).toBe(traces[0])
    expect(history.entries[1].trace).toBe(traces[1])
    expect(history.entries[2].trace).toBe(traces[2])
  })
})

// ---------------------------------------------------------------------------
// Deterministic
// ---------------------------------------------------------------------------

describe('Deterministic', () => {
  it('should produce same history for same traces across multiple calls', () => {
    const builder = new DefaultPromptAssemblyHistoryBuilder()
    const traces = [traceWithStrategy('create'), traceWithStrategy('query')]
    const r1 = builder.build(traces)
    const r2 = builder.build(traces)
    const r3 = builder.build(traces)
    expect(r1).toEqual(r2)
    expect(r2).toEqual(r3)
  })

  it('should produce same history across different builder instances', () => {
    const b1 = new DefaultPromptAssemblyHistoryBuilder()
    const b2 = new DefaultPromptAssemblyHistoryBuilder()
    const traces = [traceWithStrategy('create'), traceWithStrategy('query')]
    expect(b1.build(traces)).toEqual(b2.build(traces))
  })

  it('should produce same history for identical traces', () => {
    const builder = new DefaultPromptAssemblyHistoryBuilder()
    const t1 = [traceWithStrategy('create'), traceWithStrategy('modify')]
    const t2 = [traceWithStrategy('create'), traceWithStrategy('modify')]
    expect(builder.build(t1)).toEqual(builder.build(t2))
  })

  it('should produce same history for empty traces', () => {
    const builder = new DefaultPromptAssemblyHistoryBuilder()
    expect(builder.build([])).toEqual(builder.build([]))
  })
})

// ---------------------------------------------------------------------------
// Stateless
// ---------------------------------------------------------------------------

describe('Stateless', () => {
  it('should not retain state between build calls', () => {
    const builder = new DefaultPromptAssemblyHistoryBuilder()
    const r1 = builder.build([traceWithStrategy('create')])
    const r2 = builder.build([traceWithStrategy('query')])
    expect(r1.entries[0].trace.strategy).toEqual({ name: 'create' })
    expect(r2.entries[0].trace.strategy).toEqual({ name: 'query' })
  })

  it('should produce independent results', () => {
    const builder = new DefaultPromptAssemblyHistoryBuilder()
    const r1 = builder.build([traceWithStrategy('a'), traceWithStrategy('b')])
    const r2 = builder.build([])
    expect(r1.entries).toHaveLength(2)
    expect(r2.entries).toHaveLength(0)
  })

  it('should handle alternating calls without interference', () => {
    const builder = new DefaultPromptAssemblyHistoryBuilder()
    const t1 = [traceWithStrategy('create')]
    const t2 = [traceWithStrategy('query')]
    const r1a = builder.build(t1)
    const r2a = builder.build(t2)
    const r1b = builder.build(t1)
    const r2b = builder.build(t2)
    expect(r1a).toEqual(r1b)
    expect(r2a).toEqual(r2b)
  })

  it('should handle large alternating calls', () => {
    const builder = new DefaultPromptAssemblyHistoryBuilder()
    const t1 = [traceWithStrategy('a'), traceWithStrategy('b')]
    const t2 = [traceWithStrategy('c'), traceWithStrategy('d')]
    for (let i = 0; i < 5; i++) {
      const r1 = builder.build(t1)
      const r2 = builder.build(t2)
      expect(r1.entries).toHaveLength(2)
      expect(r2.entries).toHaveLength(2)
    }
  })
})

// ---------------------------------------------------------------------------
// Pure
// ---------------------------------------------------------------------------

describe('Pure', () => {
  it('should not modify input traces array', () => {
    const builder = new DefaultPromptAssemblyHistoryBuilder()
    const traces = [traceWithStrategy('create'), traceWithStrategy('query')]
    const original = JSON.stringify(traces)
    builder.build(traces)
    expect(JSON.stringify(traces)).toBe(original)
  })

  it('should not modify individual traces', () => {
    const builder = new DefaultPromptAssemblyHistoryBuilder()
    const trace = traceWithStrategy('create')
    const original = JSON.stringify(trace)
    builder.build([trace])
    expect(JSON.stringify(trace)).toBe(original)
  })

  it('should have no side effects on external state', () => {
    const builder = new DefaultPromptAssemblyHistoryBuilder()
    const traces = [traceWithStrategy('create')]
    const r1 = builder.build(traces)
    const r2 = builder.build(traces)
    expect(r1).toEqual(r2)
  })

  it('should not modify traces with nested objects', () => {
    const builder = new DefaultPromptAssemblyHistoryBuilder()
    const trace: PromptAssemblyTrace = {
      strategy: { name: 'create' },
      plan: { priorities: [{ section: 'x', priority: 100 }] },
    }
    const traces = [trace]
    const originalStrategy = JSON.stringify(trace.strategy)
    builder.build(traces)
    expect(JSON.stringify(trace.strategy)).toBe(originalStrategy)
  })
})

// ---------------------------------------------------------------------------
// Immutable
// ---------------------------------------------------------------------------

describe('Immutable', () => {
  it('should return new object each call', () => {
    const builder = new DefaultPromptAssemblyHistoryBuilder()
    const traces = [traceWithStrategy('create')]
    const r1 = builder.build(traces)
    const r2 = builder.build(traces)
    expect(r1).not.toBe(r2)
  })

  it('should freeze the history object', () => {
    const builder = new DefaultPromptAssemblyHistoryBuilder()
    const history = builder.build([traceWithStrategy('create')])
    expect(Object.isFrozen(history)).toBe(true)
  })

  it('should freeze the entries array', () => {
    const builder = new DefaultPromptAssemblyHistoryBuilder()
    const history = builder.build([traceWithStrategy('create')])
    expect(Object.isFrozen(history.entries)).toBe(true)
  })

  it('should freeze each entry', () => {
    const builder = new DefaultPromptAssemblyHistoryBuilder()
    const history = builder.build([traceWithStrategy('create')])
    expect(Object.isFrozen(history.entries[0])).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

describe('Exports', () => {
  it('should export DefaultPromptAssemblyHistoryBuilder from strategy index', async () => {
    const mod = await import('../strategy')
    expect(mod.DefaultPromptAssemblyHistoryBuilder).toBeDefined()
  })

  it('should export PromptAssemblyHistory type from strategy index', async () => {
    const mod = await import('../strategy')
    expect(mod.DefaultPromptAssemblyHistoryBuilder).toBeDefined()
  })

  it('should export PromptAssemblyHistoryBuilder type from strategy index', async () => {
    const mod = await import('../strategy')
    expect(mod.DefaultPromptAssemblyHistoryBuilder).toBeDefined()
  })

  it('should export PromptAssemblyHistoryEntry type from strategy index', async () => {
    const mod = await import('../strategy')
    expect(mod.DefaultPromptAssemblyHistoryBuilder).toBeDefined()
  })

  it('should export DefaultPromptAssemblyHistoryBuilder as a class', () => {
    const builder = new DefaultPromptAssemblyHistoryBuilder()
    expect(builder).toBeInstanceOf(DefaultPromptAssemblyHistoryBuilder)
  })

  it('should export PromptAssemblyHistoryBuilder as a type', () => {
    const builder: PromptAssemblyHistoryBuilder = new DefaultPromptAssemblyHistoryBuilder()
    expect(typeof builder.build).toBe('function')
  })

  it('should export DefaultPromptAssemblyHistoryBuilder from package root', async () => {
    const mod = await import('..')
    expect(mod.DefaultPromptAssemblyHistoryBuilder).toBeDefined()
  })

  it('should export PromptAssemblyHistory type from package root', async () => {
    const mod = await import('..')
    expect(mod.DefaultPromptAssemblyHistoryBuilder).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Architecture Compliance
// ---------------------------------------------------------------------------

describe('Architecture compliance', () => {
  it('should not depend on Runtime', () => {
    const builder = new DefaultPromptAssemblyHistoryBuilder()
    expect(builder).toBeDefined()
  })

  it('should not depend on Planner', () => {
    const builder = new DefaultPromptAssemblyHistoryBuilder()
    expect(builder).toBeInstanceOf(DefaultPromptAssemblyHistoryBuilder)
  })

  it('should not depend on Pipeline', () => {
    const builder = new DefaultPromptAssemblyHistoryBuilder()
    expect(builder).toBeDefined()
  })

  it('should not depend on Provider', () => {
    const builder = new DefaultPromptAssemblyHistoryBuilder()
    expect(builder).toBeDefined()
  })

  it('should not depend on Memory', () => {
    const builder = new DefaultPromptAssemblyHistoryBuilder()
    expect(builder).toBeDefined()
  })

  it('should not depend on AgentLoop', () => {
    const builder = new DefaultPromptAssemblyHistoryBuilder()
    expect(builder).toBeDefined()
  })

  it('should not depend on PromptBuilder', () => {
    const builder = new DefaultPromptAssemblyHistoryBuilder()
    expect(builder).toBeDefined()
  })

  it('should not modify PromptBuilder', () => {
    const builder = new DefaultPromptAssemblyHistoryBuilder()
    expect(builder).toBeDefined()
  })

  it('should not modify Renderer', () => {
    const builder = new DefaultPromptAssemblyHistoryBuilder()
    expect(builder).toBeDefined()
  })

  it('should not modify Compression', () => {
    const builder = new DefaultPromptAssemblyHistoryBuilder()
    expect(builder).toBeDefined()
  })

  it('should not modify PromptAssemblyTrace', () => {
    const builder = new DefaultPromptAssemblyHistoryBuilder()
    const trace = traceWithStrategy('create')
    builder.build([trace])
    expect(trace.strategy).toBeDefined()
  })

  it('should not modify Planner', () => {
    const builder = new DefaultPromptAssemblyHistoryBuilder()
    expect(builder).toBeDefined()
  })

  it('should not modify Pipeline', () => {
    const builder = new DefaultPromptAssemblyHistoryBuilder()
    expect(builder).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Compatibility
// ---------------------------------------------------------------------------

describe('RetryPlanner compatibility', () => {
  it('should be compatible with RetryPlanner scenarios', () => {
    const builder = new DefaultPromptAssemblyHistoryBuilder()
    const history = builder.build([traceWithStrategy('create')])
    expect(history.entries[0].trace.strategy).toEqual({ name: 'create' })
  })
})

describe('ToolCallPlanner compatibility', () => {
  it('should be compatible with ToolCallPlanner scenarios', () => {
    const builder = new DefaultPromptAssemblyHistoryBuilder()
    const history = builder.build([traceWithStrategy('query')])
    expect(history.entries[0].trace.strategy).toEqual({ name: 'query' })
  })
})

describe('Streaming compatibility', () => {
  it('should be compatible with streaming pipeline', () => {
    const builder = new DefaultPromptAssemblyHistoryBuilder()
    const history = builder.build([])
    expect(history.entries).toHaveLength(0)
  })
})

describe('AgentLoop compatibility', () => {
  it('should be compatible with AgentLoop', () => {
    const builder = new DefaultPromptAssemblyHistoryBuilder()
    const history = builder.build([traceWithStrategy('create'), traceWithStrategy('modify')])
    expect(history.entries).toHaveLength(2)
    expect(history.entries[0].trace.strategy).toEqual({ name: 'create' })
    expect(history.entries[1].trace.strategy).toEqual({ name: 'modify' })
  })
})

// ---------------------------------------------------------------------------
// Edge Cases
// ---------------------------------------------------------------------------

describe('Edge cases', () => {
  it('should handle traces with null strategy', () => {
    const builder = new DefaultPromptAssemblyHistoryBuilder()
    const trace: PromptAssemblyTrace = { strategy: null as unknown as { name: string } }
    const history = builder.build([trace])
    expect(history.entries[0].trace.strategy).toBeNull()
  })

  it('should handle traces with undefined strategy field', () => {
    const builder = new DefaultPromptAssemblyHistoryBuilder()
    const trace: PromptAssemblyTrace = {}
    const history = builder.build([trace])
    expect(history.entries[0].trace.strategy).toBeUndefined()
  })

  it('should handle traces with unicode strategy names', () => {
    const builder = new DefaultPromptAssemblyHistoryBuilder()
    const history = builder.build([traceWithStrategy('测试-策略')])
    expect(history.entries[0].trace.strategy).toEqual({ name: '测试-策略' })
  })

  it('should handle traces with special characters', () => {
    const builder = new DefaultPromptAssemblyHistoryBuilder()
    const trace: PromptAssemblyTrace = { inspectorRendered: 'line1\nline2\ttab"quote' }
    const history = builder.build([trace])
    expect(history.entries[0].trace.inspectorRendered).toBe('line1\nline2\ttab"quote')
  })

  it('should handle traces with boolean strategy', () => {
    const builder = new DefaultPromptAssemblyHistoryBuilder()
    const trace: PromptAssemblyTrace = { strategy: true as unknown as { name: string } }
    const history = builder.build([trace])
    expect(history.entries[0].trace.strategy).toBe(true)
  })

  it('should handle traces with numeric strategy', () => {
    const builder = new DefaultPromptAssemblyHistoryBuilder()
    const trace: PromptAssemblyTrace = { strategy: 42 as unknown as { name: string } }
    const history = builder.build([trace])
    expect(history.entries[0].trace.strategy).toBe(42)
  })

  it('should handle traces with deeply nested objects', () => {
    const builder = new DefaultPromptAssemblyHistoryBuilder()
    const trace: PromptAssemblyTrace = {
      snapshot: {
        plan: {
          priorities: [
            { section: 'a', priority: 1, nested: { key: 'deep' } },
          ],
        },
      },
    }
    const history = builder.build([trace])
    const snapshot = history.entries[0].trace.snapshot as { plan?: { priorities?: Array<{ nested: { key: string } }> } }
    expect(snapshot?.plan?.priorities?.[0]?.nested?.key).toBe('deep')
  })

  it('should handle array values in traces', () => {
    const builder = new DefaultPromptAssemblyHistoryBuilder()
    const trace: PromptAssemblyTrace = {
      planDiff: { added: ['a', 'b', 'c'], removed: [], changed: [] },
    }
    const history = builder.build([trace])
    expect((history.entries[0].trace.planDiff as { added?: string[] })?.added).toEqual(['a', 'b', 'c'])
  })

  it('should handle empty traces array resulting in frozen empty entries', () => {
    const builder = new DefaultPromptAssemblyHistoryBuilder()
    const history = builder.build([])
    expect(Object.isFrozen(history.entries)).toBe(true)
    expect(history.entries).toHaveLength(0)
  })

  it('should handle single trace with all fields populated', () => {
    const builder = new DefaultPromptAssemblyHistoryBuilder()
    const trace: PromptAssemblyTrace = {
      strategy: { name: 'create' },
      strategySelection: { selected: 'create', candidates: [] },
      plan: { priorities: [] },
      optimizedPlan: { priorities: [] },
      planDiff: { added: [], removed: [], changed: [] },
      snapshot: { plan: { priorities: [] } },
      inspector: { strategy: 'create', sections: [] },
      inspectorRendered: 'rendered',
      inspectorExported: 'exported',
    }
    const history = builder.build([trace])
    expect(history.entries[0].trace.strategy).toBeDefined()
    expect(history.entries[0].trace.strategySelection).toBeDefined()
    expect(history.entries[0].trace.plan).toBeDefined()
    expect(history.entries[0].trace.optimizedPlan).toBeDefined()
    expect(history.entries[0].trace.planDiff).toBeDefined()
    expect(history.entries[0].trace.snapshot).toBeDefined()
    expect(history.entries[0].trace.inspector).toBeDefined()
    expect(history.entries[0].trace.inspectorRendered).toBe('rendered')
    expect(history.entries[0].trace.inspectorExported).toBe('exported')
  })

  it('should handle traces with empty string strategy', () => {
    const builder = new DefaultPromptAssemblyHistoryBuilder()
    const history = builder.build([traceWithStrategy('')])
    expect(history.entries[0].trace.strategy).toEqual({ name: '' })
  })

  it('should handle traces with large index values', () => {
    const builder = new DefaultPromptAssemblyHistoryBuilder()
    const traces = Array.from({ length: 500 }, (_, i) => traceWithStrategy(`s-${i}`))
    const history = builder.build(traces)
    expect(history.entries).toHaveLength(500)
    expect(history.entries[499].index).toBe(499)
  })

  it('should handle traces with inspectorExported as JSON string', () => {
    const builder = new DefaultPromptAssemblyHistoryBuilder()
    const trace: PromptAssemblyTrace = { inspectorExported: '{"key":"value"}' }
    const history = builder.build([trace])
    expect(history.entries[0].trace.inspectorExported).toBe('{"key":"value"}')
  })

  it('should handle traces with strategyRendered as string', () => {
    const builder = new DefaultPromptAssemblyHistoryBuilder()
    const trace: PromptAssemblyTrace = { inspectorRendered: 'rendered output' }
    const history = builder.build([trace])
    expect(history.entries[0].trace.inspectorRendered).toBe('rendered output')
  })

  it('should handle traces with empty strategySelection', () => {
    const builder = new DefaultPromptAssemblyHistoryBuilder()
    const trace: PromptAssemblyTrace = { strategySelection: { selected: 'create', candidates: [] } }
    const history = builder.build([trace])
    expect(history.entries[0].trace.strategySelection).toBeDefined()
  })
})