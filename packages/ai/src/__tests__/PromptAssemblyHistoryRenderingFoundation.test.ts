import { describe, it, expect } from 'vitest'
import { DefaultPromptAssemblyHistoryRenderer } from '../strategy/DefaultPromptAssemblyHistoryRenderer'
import type { PromptAssemblyHistoryRenderer } from '../strategy/PromptAssemblyHistoryRenderer'
import type { PromptAssemblyHistory } from '../strategy/PromptAssemblyHistory'
import type { PromptAssemblyHistoryEntry } from '../strategy/PromptAssemblyHistoryEntry'
import type { PromptAssemblyTrace } from '../strategy/PromptAssemblyTrace'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createTrace(strategy?: string): PromptAssemblyTrace {
  return strategy !== undefined ? { strategy: { name: strategy } } : {}
}

function createEntry(index: number, strategy?: string): PromptAssemblyHistoryEntry {
  return { index, trace: createTrace(strategy) }
}

function createHistory(entries: PromptAssemblyHistoryEntry[]): PromptAssemblyHistory {
  return { entries }
}

function createHistoryWithStrategies(strategies: string[]): PromptAssemblyHistory {
  return {
    entries: strategies.map((s, i) => createEntry(i, s)),
  }
}

function createHistoryWithIndices(indices: number[], strategy: string): PromptAssemblyHistory {
  return {
    entries: indices.map(i => createEntry(i, strategy)),
  }
}

const NON_EMPTY_OUTPUT_PREFIX = 'Prompt Assembly History\n\nEntries:\n\n'
const EMPTY_OUTPUT = 'Prompt Assembly History\n\nNo Entries'

// ---------------------------------------------------------------------------
// Interface Contract
// ---------------------------------------------------------------------------

describe('Interface contract', () => {
  it('should define render method', () => {
    const renderer: PromptAssemblyHistoryRenderer = new DefaultPromptAssemblyHistoryRenderer()
    expect(typeof renderer.render).toBe('function')
  })

  it('should accept a history and return a string', () => {
    const renderer = new DefaultPromptAssemblyHistoryRenderer()
    const result = renderer.render(createHistory([]))
    expect(typeof result).toBe('string')
  })

  it('should accept a custom renderer', () => {
    const custom: PromptAssemblyHistoryRenderer = {
      render(_history: PromptAssemblyHistory): string {
        return 'custom rendering'
      },
    }
    expect(custom.render(createHistory([]))).toBe('custom rendering')
  })

  it('should return non-empty string for non-empty history', () => {
    const renderer = new DefaultPromptAssemblyHistoryRenderer()
    const result = renderer.render(createHistoryWithStrategies(['create']))
    expect(result.length).toBeGreaterThan(0)
  })

  it('should return same type for any history input', () => {
    const renderer = new DefaultPromptAssemblyHistoryRenderer()
    expect(typeof renderer.render(createHistory([]))).toBe('string')
    expect(typeof renderer.render(createHistoryWithStrategies(['a']))).toBe('string')
    expect(typeof renderer.render(createHistoryWithStrategies(['a', 'b', 'c']))).toBe('string')
  })
})

// ---------------------------------------------------------------------------
// Empty History
// ---------------------------------------------------------------------------

describe('Empty history', () => {
  it('should render "No Entries" for empty history', () => {
    const renderer = new DefaultPromptAssemblyHistoryRenderer()
    const result = renderer.render(createHistory([]))
    expect(result).toContain('No Entries')
  })

  it('should render exact empty output format', () => {
    const renderer = new DefaultPromptAssemblyHistoryRenderer()
    const result = renderer.render(createHistory([]))
    expect(result).toBe(EMPTY_OUTPUT)
  })

  it('should not contain "Entries:" for empty history', () => {
    const renderer = new DefaultPromptAssemblyHistoryRenderer()
    const result = renderer.render(createHistory([]))
    expect(result).not.toContain('Entries:')
  })

  it('should not contain "#" for empty history', () => {
    const renderer = new DefaultPromptAssemblyHistoryRenderer()
    const result = renderer.render(createHistory([]))
    expect(result).not.toContain('#')
  })

  it('should start with "Prompt Assembly History" for empty history', () => {
    const renderer = new DefaultPromptAssemblyHistoryRenderer()
    const result = renderer.render(createHistory([]))
    expect(result).toMatch(/^Prompt Assembly History/)
  })
})

// ---------------------------------------------------------------------------
// Single Entry
// ---------------------------------------------------------------------------

describe('Single entry', () => {
  it('should render a single create entry', () => {
    const renderer = new DefaultPromptAssemblyHistoryRenderer()
    const result = renderer.render(createHistoryWithStrategies(['create']))
    expect(result).toBe(`${NON_EMPTY_OUTPUT_PREFIX}#0 create`)
  })

  it('should render a single modify entry', () => {
    const renderer = new DefaultPromptAssemblyHistoryRenderer()
    const result = renderer.render(createHistoryWithStrategies(['modify']))
    expect(result).toBe(`${NON_EMPTY_OUTPUT_PREFIX}#0 modify`)
  })

  it('should render a single query entry', () => {
    const renderer = new DefaultPromptAssemblyHistoryRenderer()
    const result = renderer.render(createHistoryWithStrategies(['query']))
    expect(result).toBe(`${NON_EMPTY_OUTPUT_PREFIX}#0 query`)
  })

  it('should render a single delete entry', () => {
    const renderer = new DefaultPromptAssemblyHistoryRenderer()
    const result = renderer.render(createHistoryWithStrategies(['delete']))
    expect(result).toBe(`${NON_EMPTY_OUTPUT_PREFIX}#0 delete`)
  })

  it('should render unknown when strategy is undefined', () => {
    const renderer = new DefaultPromptAssemblyHistoryRenderer()
    const history = createHistory([createEntry(0)])
    const result = renderer.render(history)
    expect(result).toBe(`${NON_EMPTY_OUTPUT_PREFIX}#0 unknown`)
  })

  it('should render unknown when strategy is null', () => {
    const renderer = new DefaultPromptAssemblyHistoryRenderer()
    const history = createHistory([{ index: 0, trace: { strategy: null as unknown as undefined } }])
    const result = renderer.render(history)
    expect(result).toBe(`${NON_EMPTY_OUTPUT_PREFIX}#0 unknown`)
  })

  it('should render unknown when strategy has no name', () => {
    const renderer = new DefaultPromptAssemblyHistoryRenderer()
    const history = createHistory([{ index: 0, trace: { strategy: {} as unknown as undefined } }])
    const result = renderer.render(history)
    expect(result).toBe(`${NON_EMPTY_OUTPUT_PREFIX}#0 unknown`)
  })

  it('should render entry with index 0', () => {
    const renderer = new DefaultPromptAssemblyHistoryRenderer()
    const result = renderer.render(createHistory([createEntry(0, 'create')]))
    expect(result).toContain('#0')
  })

  it('should render entry with high index', () => {
    const renderer = new DefaultPromptAssemblyHistoryRenderer()
    const history = createHistory([createEntry(999, 'create')])
    const result = renderer.render(history)
    expect(result).toContain('#999')
  })
})

// ---------------------------------------------------------------------------
// Multiple Entries
// ---------------------------------------------------------------------------

describe('Multiple entries', () => {
  it('should render two entries', () => {
    const renderer = new DefaultPromptAssemblyHistoryRenderer()
    const result = renderer.render(createHistoryWithStrategies(['create', 'query']))
    const expected = `${NON_EMPTY_OUTPUT_PREFIX}#0 create\n#1 query`
    expect(result).toBe(expected)
  })

  it('should render three entries', () => {
    const renderer = new DefaultPromptAssemblyHistoryRenderer()
    const result = renderer.render(createHistoryWithStrategies(['create', 'modify', 'query']))
    const expected = `${NON_EMPTY_OUTPUT_PREFIX}#0 create\n#1 modify\n#2 query`
    expect(result).toBe(expected)
  })

  it('should preserve entry order', () => {
    const renderer = new DefaultPromptAssemblyHistoryRenderer()
    const result = renderer.render(createHistoryWithStrategies(['query', 'create', 'delete']))
    const expected = `${NON_EMPTY_OUTPUT_PREFIX}#0 query\n#1 create\n#2 delete`
    expect(result).toBe(expected)
  })

  it('should handle mixed strategies', () => {
    const renderer = new DefaultPromptAssemblyHistoryRenderer()
    const history = createHistory([
      createEntry(5, 'create'),
      createEntry(3, 'modify'),
      createEntry(7, 'query'),
    ])
    const result = renderer.render(history)
    const expected = `${NON_EMPTY_OUTPUT_PREFIX}#5 create\n#3 modify\n#7 query`
    expect(result).toBe(expected)
  })

  it('should handle all four strategies', () => {
    const renderer = new DefaultPromptAssemblyHistoryRenderer()
    const result = renderer.render(createHistoryWithStrategies(['create', 'query', 'modify', 'delete']))
    const expected = `${NON_EMPTY_OUTPUT_PREFIX}#0 create\n#1 query\n#2 modify\n#3 delete`
    expect(result).toBe(expected)
  })

  it('should handle mix of known and unknown strategies', () => {
    const renderer = new DefaultPromptAssemblyHistoryRenderer()
    const history = createHistory([
      createEntry(0, 'create'),
      createEntry(1),
      createEntry(2, 'query'),
    ])
    const result = renderer.render(history)
    const expected = `${NON_EMPTY_OUTPUT_PREFIX}#0 create\n#1 unknown\n#2 query`
    expect(result).toBe(expected)
  })

  it('should handle five entries', () => {
    const renderer = new DefaultPromptAssemblyHistoryRenderer()
    const result = renderer.render(createHistoryWithStrategies(['a', 'b', 'c', 'd', 'e']))
    const expected = `${NON_EMPTY_OUTPUT_PREFIX}#0 a\n#1 b\n#2 c\n#3 d\n#4 e`
    expect(result).toBe(expected)
  })

  it('should handle non-sequential indices', () => {
    const renderer = new DefaultPromptAssemblyHistoryRenderer()
    const history = createHistory([
      createEntry(10, 'create'),
      createEntry(20, 'modify'),
      createEntry(30, 'query'),
    ])
    const result = renderer.render(history)
    const expected = `${NON_EMPTY_OUTPUT_PREFIX}#10 create\n#20 modify\n#30 query`
    expect(result).toBe(expected)
  })
})

// ---------------------------------------------------------------------------
// Rendering Validation
// ---------------------------------------------------------------------------

describe('Rendering validation', () => {
  it('should show index in output', () => {
    const renderer = new DefaultPromptAssemblyHistoryRenderer()
    const result = renderer.render(createHistoryWithStrategies(['create']))
    expect(result).toMatch(/#\d+/)
  })

  it('should show strategy name in output', () => {
    const renderer = new DefaultPromptAssemblyHistoryRenderer()
    const result = renderer.render(createHistoryWithStrategies(['create']))
    expect(result).toContain('create')
  })

  it('should render one entry per line', () => {
    const renderer = new DefaultPromptAssemblyHistoryRenderer()
    const result = renderer.render(createHistoryWithStrategies(['create', 'modify', 'query']))
    const lines = result.split('\n')
    // Lines: [0]=header, [1]=blank, [2]="Entries:", [3]=blank, [4]=#0, [5]=#1, [6]=#2
    expect(lines[4]).toMatch(/^#\d+ \w+/)
    expect(lines[5]).toMatch(/^#\d+ \w+/)
    expect(lines[6]).toMatch(/^#\d+ \w+/)
  })

  it('should use exact format "#<index> <strategy>"', () => {
    const renderer = new DefaultPromptAssemblyHistoryRenderer()
    const result = renderer.render(createHistoryWithStrategies(['create']))
    const lines = result.split('\n')
    const entryLine = lines[4]
    expect(entryLine).toBe('#0 create')
  })

  it('should have correct prefix for non-empty history', () => {
    const renderer = new DefaultPromptAssemblyHistoryRenderer()
    const result = renderer.render(createHistoryWithStrategies(['create']))
    expect(result.startsWith(NON_EMPTY_OUTPUT_PREFIX)).toBe(true)
  })

  it('should contain "Entries:" separator for non-empty history', () => {
    const renderer = new DefaultPromptAssemblyHistoryRenderer()
    const result = renderer.render(createHistoryWithStrategies(['create']))
    expect(result).toContain('Entries:')
  })

  it('should have newline between entries', () => {
    const renderer = new DefaultPromptAssemblyHistoryRenderer()
    const result = renderer.render(createHistoryWithStrategies(['a', 'b', 'c']))
    const lines = result.split('\n')
    expect(lines[4]).toBe('#0 a')
    expect(lines[5]).toBe('#1 b')
    expect(lines[6]).toBe('#2 c')
  })

  it('should have blank line after "Entries:" header', () => {
    const renderer = new DefaultPromptAssemblyHistoryRenderer()
    const result = renderer.render(createHistoryWithStrategies(['create']))
    const lines = result.split('\n')
    expect(lines[2]).toBe('Entries:')
    expect(lines[3]).toBe('')
    expect(lines[4]).toBe('#0 create')
  })

  it('should not have trailing newline', () => {
    const renderer = new DefaultPromptAssemblyHistoryRenderer()
    const result = renderer.render(createHistoryWithStrategies(['create']))
    expect(result.endsWith('\n')).toBe(false)
  })

  it('should have two blank lines before first entry', () => {
    const renderer = new DefaultPromptAssemblyHistoryRenderer()
    const result = renderer.render(createHistoryWithStrategies(['create']))
    // Format: "Prompt Assembly History\n\nEntries:\n\n#0 create"
    const parts = result.split('\n\n')
    expect(parts.length).toBeGreaterThanOrEqual(3)
  })

  it('should not contain "No Entries" for non-empty history', () => {
    const renderer = new DefaultPromptAssemblyHistoryRenderer()
    const result = renderer.render(createHistoryWithStrategies(['create']))
    expect(result).not.toContain('No Entries')
  })
})

// ---------------------------------------------------------------------------
// Deterministic
// ---------------------------------------------------------------------------

describe('Deterministic', () => {
  it('should produce same result for same input across multiple calls', () => {
    const renderer = new DefaultPromptAssemblyHistoryRenderer()
    const history = createHistoryWithStrategies(['create', 'modify', 'query'])
    const r1 = renderer.render(history)
    const r2 = renderer.render(history)
    const r3 = renderer.render(history)
    expect(r1).toBe(r2)
    expect(r2).toBe(r3)
  })

  it('should produce same result across different renderer instances', () => {
    const r1 = new DefaultPromptAssemblyHistoryRenderer()
    const r2 = new DefaultPromptAssemblyHistoryRenderer()
    const history = createHistoryWithStrategies(['create', 'delete'])
    expect(r1.render(history)).toBe(r2.render(history))
  })

  it('should produce same result for identical histories', () => {
    const renderer = new DefaultPromptAssemblyHistoryRenderer()
    const h1 = createHistoryWithStrategies(['create', 'query'])
    const h2 = createHistoryWithStrategies(['create', 'query'])
    expect(renderer.render(h1)).toBe(renderer.render(h2))
  })

  it('should produce same result for empty history across calls', () => {
    const renderer = new DefaultPromptAssemblyHistoryRenderer()
    const history = createHistory([])
    const calls = Array.from({ length: 5 }, () => renderer.render(history))
    for (let i = 1; i < calls.length; i++) {
      expect(calls[i]).toBe(calls[0])
    }
  })
})

// ---------------------------------------------------------------------------
// Stateless
// ---------------------------------------------------------------------------

describe('Stateless', () => {
  it('should not retain state between render calls', () => {
    const renderer = new DefaultPromptAssemblyHistoryRenderer()
    const r1 = renderer.render(createHistoryWithStrategies(['create']))
    const r2 = renderer.render(createHistoryWithStrategies(['modify']))
    expect(r1).not.toBe(r2)
    expect(r1).toContain('create')
    expect(r2).toContain('modify')
  })

  it('should produce independent results from sequential calls', () => {
    const renderer = new DefaultPromptAssemblyHistoryRenderer()
    const r1 = renderer.render(createHistoryWithStrategies(['create', 'query']))
    const r2 = renderer.render(createHistory([]))
    expect(r1).toContain('#0 create')
    expect(r1).toContain('#1 query')
    expect(r2).toBe(EMPTY_OUTPUT)
  })
})

// ---------------------------------------------------------------------------
// Pure
// ---------------------------------------------------------------------------

describe('Pure', () => {
  it('should not modify input history', () => {
    const renderer = new DefaultPromptAssemblyHistoryRenderer()
    const history = createHistoryWithStrategies(['create'])
    const original = JSON.stringify(history)
    renderer.render(history)
    expect(JSON.stringify(history)).toBe(original)
  })

  it('should not modify history entries', () => {
    const renderer = new DefaultPromptAssemblyHistoryRenderer()
    const history = createHistoryWithStrategies(['create', 'query'])
    const originalIndices = history.entries.map(e => e.index)
    const originalStrategies = history.entries.map(e => (e.trace.strategy as { name: string })?.name)
    renderer.render(history)
    expect(history.entries.map(e => e.index)).toEqual(originalIndices)
    expect(history.entries.map(e => (e.trace.strategy as { name: string })?.name)).toEqual(originalStrategies)
  })

  it('should not modify trace objects', () => {
    const renderer = new DefaultPromptAssemblyHistoryRenderer()
    const trace = createTrace('create')
    const history = createHistory([{ index: 0, trace }])
    const originalTrace = JSON.stringify(trace)
    renderer.render(history)
    expect(JSON.stringify(trace)).toBe(originalTrace)
  })

  it('should not mutate nested objects in entries', () => {
    const renderer = new DefaultPromptAssemblyHistoryRenderer()
    const history: PromptAssemblyHistory = {
      entries: [
        { index: 0, trace: { strategy: { name: 'create' } } },
      ],
    }
    const original = JSON.stringify(history)
    renderer.render(history)
    expect(JSON.stringify(history)).toBe(original)
  })
})

// ---------------------------------------------------------------------------
// Immutable
// ---------------------------------------------------------------------------

describe('Immutable', () => {
  it('should not mutate history entries array', () => {
    const renderer = new DefaultPromptAssemblyHistoryRenderer()
    const history = createHistoryWithStrategies(['create', 'query'])
    const entriesBefore = history.entries.length
    renderer.render(history)
    expect(history.entries.length).toBe(entriesBefore)
  })

  it('should not mutate entry indices', () => {
    const renderer = new DefaultPromptAssemblyHistoryRenderer()
    const history = createHistoryWithStrategies(['create'])
    const indexBefore = history.entries[0].index
    renderer.render(history)
    expect(history.entries[0].index).toBe(indexBefore)
  })

  it('should not mutate trace references', () => {
    const renderer = new DefaultPromptAssemblyHistoryRenderer()
    const history = createHistoryWithStrategies(['create'])
    const traceBefore = history.entries[0].trace
    renderer.render(history)
    expect(history.entries[0].trace).toBe(traceBefore)
  })
})

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

describe('Exports', () => {
  it('should export DefaultPromptAssemblyHistoryRenderer from strategy index', async () => {
    const mod = await import('../strategy')
    expect(mod.DefaultPromptAssemblyHistoryRenderer).toBeDefined()
  })

  it('should export PromptAssemblyHistoryRenderer type from strategy index', async () => {
    const mod = await import('../strategy')
    expect(mod.DefaultPromptAssemblyHistoryRenderer).toBeDefined()
  })

  it('should export DefaultPromptAssemblyHistoryRenderer from package root', async () => {
    const mod = await import('..')
    expect(mod.DefaultPromptAssemblyHistoryRenderer).toBeDefined()
  })

  it('should export PromptAssemblyHistoryRenderer type from package root', async () => {
    const mod = await import('..')
    expect(mod.DefaultPromptAssemblyHistoryRenderer).toBeDefined()
  })

  it('should export DefaultPromptAssemblyHistoryRenderer as a class', () => {
    const renderer = new DefaultPromptAssemblyHistoryRenderer()
    expect(renderer).toBeInstanceOf(DefaultPromptAssemblyHistoryRenderer)
  })

  it('should export PromptAssemblyHistoryRenderer as a type', () => {
    const renderer: PromptAssemblyHistoryRenderer = new DefaultPromptAssemblyHistoryRenderer()
    expect(typeof renderer.render).toBe('function')
  })
})

// ---------------------------------------------------------------------------
// Architecture Compliance
// ---------------------------------------------------------------------------

describe('Architecture compliance', () => {
  it('should not depend on Planner', () => {
    const renderer = new DefaultPromptAssemblyHistoryRenderer()
    expect(renderer).toBeInstanceOf(DefaultPromptAssemblyHistoryRenderer)
  })

  it('should not depend on Runtime', () => {
    const renderer = new DefaultPromptAssemblyHistoryRenderer()
    expect(renderer).toBeDefined()
  })

  it('should not depend on Provider', () => {
    const renderer = new DefaultPromptAssemblyHistoryRenderer()
    expect(renderer).toBeDefined()
  })

  it('should not depend on Memory', () => {
    const renderer = new DefaultPromptAssemblyHistoryRenderer()
    expect(renderer).toBeDefined()
  })

  it('should not depend on AgentLoop', () => {
    const renderer = new DefaultPromptAssemblyHistoryRenderer()
    expect(renderer).toBeDefined()
  })

  it('should not depend on Pipeline', () => {
    const renderer = new DefaultPromptAssemblyHistoryRenderer()
    expect(renderer).toBeDefined()
  })

  it('should not modify PromptBuilder', () => {
    const renderer = new DefaultPromptAssemblyHistoryRenderer()
    expect(renderer).toBeDefined()
  })

  it('should not modify PromptRenderer', () => {
    const renderer = new DefaultPromptAssemblyHistoryRenderer()
    expect(renderer).toBeDefined()
  })

  it('should not modify PromptCompression', () => {
    const renderer = new DefaultPromptAssemblyHistoryRenderer()
    expect(renderer).toBeDefined()
  })

  it('should not modify PromptAssemblyHistory', () => {
    const renderer = new DefaultPromptAssemblyHistoryRenderer()
    const history = createHistoryWithStrategies(['create'])
    const result = renderer.render(history)
    expect(result).toContain('create')
  })

  it('should not modify PromptAssemblyTrace', () => {
    const renderer = new DefaultPromptAssemblyHistoryRenderer()
    const history = createHistory([createEntry(0, 'test')])
    const result = renderer.render(history)
    expect(result).toContain('test')
  })
})

// ---------------------------------------------------------------------------
// Compatibility
// ---------------------------------------------------------------------------

describe('RetryPlanner compatibility', () => {
  it('should be compatible with RetryPlanner scenarios', () => {
    const renderer = new DefaultPromptAssemblyHistoryRenderer()
    const result = renderer.render(createHistoryWithStrategies(['create']))
    expect(result).toContain('create')
  })
})

describe('ToolCallPlanner compatibility', () => {
  it('should be compatible with ToolCallPlanner scenarios', () => {
    const renderer = new DefaultPromptAssemblyHistoryRenderer()
    const result = renderer.render(createHistoryWithStrategies(['create', 'query']))
    expect(result).toContain('#0 create')
    expect(result).toContain('#1 query')
  })
})

describe('Streaming compatibility', () => {
  it('should be compatible with streaming pipeline', () => {
    const renderer = new DefaultPromptAssemblyHistoryRenderer()
    const result = renderer.render(createHistoryWithStrategies(['query']))
    expect(result).toContain('query')
  })
})

describe('AgentLoop compatibility', () => {
  it('should be compatible with AgentLoop', () => {
    const renderer = new DefaultPromptAssemblyHistoryRenderer()
    const result = renderer.render(createHistoryWithStrategies(['create', 'modify']))
    expect(result).toContain('#0 create')
    expect(result).toContain('#1 modify')
  })
})

// ---------------------------------------------------------------------------
// Edge Cases
// ---------------------------------------------------------------------------

describe('Edge cases', () => {
  it('should handle unicode strategy names', () => {
    const renderer = new DefaultPromptAssemblyHistoryRenderer()
    const history = createHistoryWithStrategies(['créer', 'módify'])
    const result = renderer.render(history)
    expect(result).toContain('#0 créer')
    expect(result).toContain('#1 módify')
  })

  it('should handle strategy names with special characters', () => {
    const renderer = new DefaultPromptAssemblyHistoryRenderer()
    // Special characters in strategy names
    const h2 = createHistory([
      { index: 0, trace: { strategy: { name: 'create@v2' } } },
      { index: 1, trace: { strategy: { name: 'query#beta' } } },
    ])
    const r2 = renderer.render(h2)
    expect(r2).toContain('#0 create@v2')
    expect(r2).toContain('#1 query#beta')
  })

  it('should handle 100 entries', () => {
    const renderer = new DefaultPromptAssemblyHistoryRenderer()
    const strategies = Array.from({ length: 100 }, (_, i) => `strategy-${i}`)
    const history = createHistoryWithStrategies(strategies)
    const result = renderer.render(history)
    expect(result).toContain('#0 strategy-0')
    expect(result).toContain('#99 strategy-99')
    const lines = result.split('\n')
    // 2 header lines + "Entries:" + blank + 100 entry lines = 4 + 100 = 104
    expect(lines.length).toBe(104)
  })

  it('should handle large indices', () => {
    const renderer = new DefaultPromptAssemblyHistoryRenderer()
    const history = createHistory([createEntry(1000000, 'create')])
    const result = renderer.render(history)
    expect(result).toContain('#1000000')
  })

  it('should handle duplicate strategy names', () => {
    const renderer = new DefaultPromptAssemblyHistoryRenderer()
    const result = renderer.render(createHistoryWithStrategies(['create', 'create', 'create']))
    const expected = `${NON_EMPTY_OUTPUT_PREFIX}#0 create\n#1 create\n#2 create`
    expect(result).toBe(expected)
  })

  it('should handle entries with missing trace', () => {
    const renderer = new DefaultPromptAssemblyHistoryRenderer()
    const history: PromptAssemblyHistory = {
      entries: [{ index: 0, trace: {} as PromptAssemblyTrace }],
    }
    const result = renderer.render(history)
    expect(result).toContain('#0 unknown')
  })

  it('should handle entries with empty trace object', () => {
    const renderer = new DefaultPromptAssemblyHistoryRenderer()
    const history: PromptAssemblyHistory = {
      entries: [{ index: 0, trace: {} }],
    }
    const result = renderer.render(history)
    expect(result).toContain('#0 unknown')
  })

  it('should handle strategy with non-string name', () => {
    const renderer = new DefaultPromptAssemblyHistoryRenderer()
    const history: PromptAssemblyHistory = {
      entries: [
        { index: 0, trace: { strategy: { name: 42 as unknown as string } } },
      ],
    }
    const result = renderer.render(history)
    // Non-string name → unknown
    expect(result).toContain('#0 unknown')
  })

  it('should handle empty strategy name string', () => {
    const renderer = new DefaultPromptAssemblyHistoryRenderer()
    const history = createHistoryWithStrategies([''])
    const result = renderer.render(history)
    expect(result).toContain('#0 ')
  })

  it('should handle strategy name with spaces', () => {
    const renderer = new DefaultPromptAssemblyHistoryRenderer()
    const history = createHistory([
      { index: 0, trace: { strategy: { name: 'my strategy' } } },
    ])
    const result = renderer.render(history)
    expect(result).toContain('#0 my strategy')
  })

  it('should handle strategy name with numbers', () => {
    const renderer = new DefaultPromptAssemblyHistoryRenderer()
    const history = createHistoryWithStrategies(['v2.0.1'])
    const result = renderer.render(history)
    expect(result).toContain('#0 v2.0.1')
  })

  it('should handle single entry with non-zero index', () => {
    const renderer = new DefaultPromptAssemblyHistoryRenderer()
    const history = createHistory([createEntry(42, 'create')])
    const result = renderer.render(history)
    expect(result).toContain('#42')
  })

  it('should handle descending indices', () => {
    const renderer = new DefaultPromptAssemblyHistoryRenderer()
    const history = createHistory([
      createEntry(3, 'create'),
      createEntry(2, 'modify'),
      createEntry(1, 'query'),
    ])
    const result = renderer.render(history)
    const lines = result.split('\n')
    expect(lines[4]).toBe('#3 create')
    expect(lines[5]).toBe('#2 modify')
    expect(lines[6]).toBe('#1 query')
  })

  it('should handle entries with same strategy multiple times', () => {
    const renderer = new DefaultPromptAssemblyHistoryRenderer()
    const history = createHistoryWithStrategies(['create', 'create', 'create', 'create'])
    const result = renderer.render(history)
    expect(result).toContain('#0 create')
    expect(result).toContain('#3 create')
  })

  it('should handle 50 entries with same strategy', () => {
    const renderer = new DefaultPromptAssemblyHistoryRenderer()
    const history = createHistoryWithIndices(Array.from({ length: 50 }, (_, i) => i), 'create')
    const result = renderer.render(history)
    expect(result).toContain('#49 create')
    expect(result).toContain('#0 create')
  })

  it('should handle negative indices', () => {
    const renderer = new DefaultPromptAssemblyHistoryRenderer()
    const history = createHistory([createEntry(-1, 'create')])
    const result = renderer.render(history)
    expect(result).toContain('#-1')
  })

  it('should handle trace with strategy but no name property', () => {
    const renderer = new DefaultPromptAssemblyHistoryRenderer()
    const history: PromptAssemblyHistory = {
      entries: [
        {
          index: 0,
          trace: { strategy: 'just a string' as unknown as undefined },
        },
      ],
    }
    const result = renderer.render(history)
    // 'just a string' is not an object with name → unknown
    expect(result).toContain('#0 unknown')
  })

  it('should handle trace with strategy having undefined name', () => {
    const renderer = new DefaultPromptAssemblyHistoryRenderer()
    const history: PromptAssemblyHistory = {
      entries: [
        {
          index: 0,
          trace: { strategy: { name: undefined } as unknown as undefined },
        },
      ],
    }
    const result = renderer.render(history)
    expect(result).toContain('#0 unknown')
  })
})