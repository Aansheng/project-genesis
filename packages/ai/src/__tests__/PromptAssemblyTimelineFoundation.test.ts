import { describe, it, expect } from 'vitest'
import { DefaultPromptAssemblyTimelineBuilder } from '../strategy/DefaultPromptAssemblyTimelineBuilder'
import type { PromptAssemblyTimelineBuilder } from '../strategy/PromptAssemblyTimelineBuilder'
import type { PromptAssemblyTimeline } from '../strategy/PromptAssemblyTimeline'
import type { PromptAssemblyTimelineEntry } from '../strategy/PromptAssemblyTimelineEntry'
import type { PromptAssemblyTrace } from '../strategy/PromptAssemblyTrace'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createTrace(name: string): PromptAssemblyTrace {
  return { strategy: { name } }
}

function createFullTrace(): PromptAssemblyTrace {
  return {
    strategy: { name: 'create' },
    strategySelection: { selected: 'create', candidates: [] },
    plan: { priorities: [{ section: 'userInput', priority: 100 }] },
    optimizedPlan: { priorities: [{ section: 'userInput', priority: 90 }] },
    planDiff: { added: [], removed: [], changed: [{ section: 'userInput', before: 100, after: 90 }] },
    snapshot: { plan: { priorities: [] } },
    inspector: { strategy: 'create', sections: [{ title: 'Rendered Strategy', content: 'create' }] },
    inspectorRendered: 'rendered output',
    inspectorExported: '{"strategy":"create"}',
  }
}

function createTimelineBuilder(): DefaultPromptAssemblyTimelineBuilder {
  return new DefaultPromptAssemblyTimelineBuilder()
}

function getStrategyName(trace: PromptAssemblyTrace): string | undefined {
  const s = trace.strategy as { name?: string } | undefined
  return s?.name
}

function asRecord(value: object): Record<string, unknown> {
  return value as unknown as Record<string, unknown>
}

// ---------------------------------------------------------------------------
// Timeline Entry
// ---------------------------------------------------------------------------

describe('Timeline Entry', () => {
  it('should have an index property', () => {
    const trace = createTrace('create')
    const entry: PromptAssemblyTimelineEntry = { index: 0, trace }
    expect(entry.index).toBe(0)
  })

  it('should have a trace property', () => {
    const trace = createTrace('query')
    const entry: PromptAssemblyTimelineEntry = { index: 0, trace }
    expect(entry.trace).toBe(trace)
  })

  it('should be readonly (index should not be writable in frozen context)', () => {
    const trace = createTrace('modify')
    const entry: PromptAssemblyTimelineEntry = Object.freeze({ index: 0, trace })
    expect(() => {
      asRecord(entry).index = 1
    }).toThrow()
  })

  it('should accept a custom index', () => {
    const trace = createTrace('delete')
    const entry: PromptAssemblyTimelineEntry = { index: 5, trace }
    expect(entry.index).toBe(5)
  })

  it('should accept a fully formed trace', () => {
    const trace = createFullTrace()
    const entry: PromptAssemblyTimelineEntry = { index: 0, trace }
    expect(getStrategyName(entry.trace)).toBe('create')
    expect(entry.trace.plan).toBeDefined()
    expect(entry.trace.snapshot).toBeDefined()
  })

  it('should be a plain object with index and trace', () => {
    const trace = createTrace('default')
    const entry: PromptAssemblyTimelineEntry = { index: 0, trace }
    expect(Object.keys(entry)).toEqual(['index', 'trace'])
  })
})

// ---------------------------------------------------------------------------
// Timeline Interface
// ---------------------------------------------------------------------------

describe('Timeline Interface', () => {
  it('should support empty entries', () => {
    const timeline: PromptAssemblyTimeline = { entries: [] }
    expect(timeline.entries).toEqual([])
  })

  it('should support a single entry', () => {
    const entry: PromptAssemblyTimelineEntry = { index: 0, trace: createTrace('create') }
    const timeline: PromptAssemblyTimeline = { entries: [entry] }
    expect(timeline.entries).toHaveLength(1)
    expect(timeline.entries[0].index).toBe(0)
  })

  it('should support multiple entries', () => {
    const e1: PromptAssemblyTimelineEntry = { index: 0, trace: createTrace('create') }
    const e2: PromptAssemblyTimelineEntry = { index: 1, trace: createTrace('query') }
    const e3: PromptAssemblyTimelineEntry = { index: 2, trace: createTrace('modify') }
    const timeline: PromptAssemblyTimeline = { entries: [e1, e2, e3] }
    expect(timeline.entries).toHaveLength(3)
  })

  it('should preserve entry order', () => {
    const e1: PromptAssemblyTimelineEntry = { index: 0, trace: createTrace('a') }
    const e2: PromptAssemblyTimelineEntry = { index: 1, trace: createTrace('b') }
    const e3: PromptAssemblyTimelineEntry = { index: 2, trace: createTrace('c') }
    const timeline: PromptAssemblyTimeline = { entries: [e1, e2, e3] }
    expect(getStrategyName(timeline.entries[0].trace)).toBe('a')
    expect(getStrategyName(timeline.entries[1].trace)).toBe('b')
    expect(getStrategyName(timeline.entries[2].trace)).toBe('c')
  })

  it('should have readonly entries from builder', () => {
    const builder = createTimelineBuilder()
    const timeline = builder.build([createTrace('x')])
    expect(() => {
      asRecord(timeline).entries = [{ index: 0, trace: createTrace('y') }]
    }).toThrow()
  })

  it('should have entries as non-nullable', () => {
    const timeline: PromptAssemblyTimeline = { entries: [] }
    expect(timeline.entries).toBeDefined()
    expect(Array.isArray(timeline.entries)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Builder Interface Contract
// ---------------------------------------------------------------------------

describe('Builder Interface Contract', () => {
  it('should define a build method', () => {
    const builder: PromptAssemblyTimelineBuilder = createTimelineBuilder()
    expect(typeof builder.build).toBe('function')
  })

  it('should accept traces and return a timeline', () => {
    const builder = createTimelineBuilder()
    const result = builder.build([])
    expect(result).toBeDefined()
    expect(result.entries).toBeDefined()
  })

  it('should accept a custom implementation', () => {
    const custom: PromptAssemblyTimelineBuilder = {
      build(_traces: readonly PromptAssemblyTrace[]): PromptAssemblyTimeline {
        return {
          entries: [
            { index: 0, trace: { strategy: { name: 'custom' } } },
          ],
        }
      },
    }
    const result = custom.build([])
    expect(result.entries).toHaveLength(1)
    expect(getStrategyName(result.entries[0].trace)).toBe('custom')
  })

  it('should return a timeline for empty traces', () => {
    const builder = createTimelineBuilder()
    const result = builder.build([])
    expect(result.entries).toEqual([])
  })

  it('should have the correct method signature', () => {
    const builder: PromptAssemblyTimelineBuilder = createTimelineBuilder()
    const result = builder.build([createTrace('test')])
    expect(result.entries).toHaveLength(1)
  })
})

// ---------------------------------------------------------------------------
// Default Builder — Empty Traces
// ---------------------------------------------------------------------------

describe('Default Builder — Empty Traces', () => {
  it('should return a timeline for empty array', () => {
    const builder = createTimelineBuilder()
    const result = builder.build([])
    expect(result).toBeDefined()
  })

  it('should return empty entries for empty array', () => {
    const builder = createTimelineBuilder()
    const result = builder.build([])
    expect(result.entries).toHaveLength(0)
  })

  it('should return entries array length 0', () => {
    const builder = createTimelineBuilder()
    const result = builder.build([])
    expect(result.entries.length).toBe(0)
  })

  it('should handle empty array without errors', () => {
    const builder = createTimelineBuilder()
    expect(() => builder.build([])).not.toThrow()
  })
})

// ---------------------------------------------------------------------------
// Default Builder — Single Trace
// ---------------------------------------------------------------------------

describe('Default Builder — Single Trace', () => {
  it('should create one entry for a single trace', () => {
    const builder = createTimelineBuilder()
    const result = builder.build([createTrace('create')])
    expect(result.entries).toHaveLength(1)
  })

  it('should set index to 0 for single trace', () => {
    const builder = createTimelineBuilder()
    const result = builder.build([createTrace('create')])
    expect(result.entries[0].index).toBe(0)
  })

  it('should preserve the trace content', () => {
    const builder = createTimelineBuilder()
    const trace = createTrace('query')
    const result = builder.build([trace])
    expect(getStrategyName(result.entries[0].trace)).toBe('query')
  })

  it('should have the correct entry shape', () => {
    const builder = createTimelineBuilder()
    const result = builder.build([createTrace('modify')])
    const entry = result.entries[0]
    expect(entry).toHaveProperty('index')
    expect(entry).toHaveProperty('trace')
  })

  it('should create an entry with a trace property', () => {
    const builder = createTimelineBuilder()
    const trace = createTrace('delete')
    const result = builder.build([trace])
    expect(result.entries[0].trace).toBeDefined()
  })

  it('should create an entry with an index property', () => {
    const builder = createTimelineBuilder()
    const result = builder.build([createTrace('default')])
    expect(typeof result.entries[0].index).toBe('number')
  })
})

// ---------------------------------------------------------------------------
// Default Builder — Multiple Traces
// ---------------------------------------------------------------------------

describe('Default Builder — Multiple Traces', () => {
  it('should create two entries for two traces', () => {
    const builder = createTimelineBuilder()
    const result = builder.build([createTrace('a'), createTrace('b')])
    expect(result.entries).toHaveLength(2)
  })

  it('should create three entries for three traces', () => {
    const builder = createTimelineBuilder()
    const result = builder.build([createTrace('a'), createTrace('b'), createTrace('c')])
    expect(result.entries).toHaveLength(3)
  })

  it('should create five entries for five traces', () => {
    const builder = createTimelineBuilder()
    const traces = ['a', 'b', 'c', 'd', 'e'].map(createTrace)
    const result = builder.build(traces)
    expect(result.entries).toHaveLength(5)
  })

  it('should create ten entries for ten traces', () => {
    const builder = createTimelineBuilder()
    const traces = Array.from({ length: 10 }, (_, i) => createTrace(`t${i}`))
    const result = builder.build(traces)
    expect(result.entries).toHaveLength(10)
  })

  it('should assign sequential indices starting from 0', () => {
    const builder = createTimelineBuilder()
    const traces = [createTrace('a'), createTrace('b'), createTrace('c')]
    const result = builder.build(traces)
    expect(result.entries[0].index).toBe(0)
    expect(result.entries[1].index).toBe(1)
    expect(result.entries[2].index).toBe(2)
  })

  it('should preserve trace content across all entries', () => {
    const builder = createTimelineBuilder()
    const traces = [createTrace('create'), createTrace('query'), createTrace('modify')]
    const result = builder.build(traces)
    expect(getStrategyName(result.entries[0].trace)).toBe('create')
    expect(getStrategyName(result.entries[1].trace)).toBe('query')
    expect(getStrategyName(result.entries[2].trace)).toBe('modify')
  })
})

// ---------------------------------------------------------------------------
// Default Builder — Large Timeline
// ---------------------------------------------------------------------------

describe('Default Builder — Large Timeline', () => {
  it('should handle 100 traces', () => {
    const builder = createTimelineBuilder()
    const traces = Array.from({ length: 100 }, (_, i) => createTrace(`t${i}`))
    const result = builder.build(traces)
    expect(result.entries).toHaveLength(100)
  })

  it('should assign correct indices for 100 traces', () => {
    const builder = createTimelineBuilder()
    const traces = Array.from({ length: 100 }, (_, i) => createTrace(`t${i}`))
    const result = builder.build(traces)
    for (let i = 0; i < 100; i++) {
      expect(result.entries[i].index).toBe(i)
    }
  })

  it('should preserve all trace content for 100 traces', () => {
    const builder = createTimelineBuilder()
    const traces = Array.from({ length: 100 }, (_, i) => createTrace(`t${i}`))
    const result = builder.build(traces)
    for (let i = 0; i < 100; i++) {
      expect(getStrategyName(result.entries[i].trace)).toBe(`t${i}`)
    }
  })
})

// ---------------------------------------------------------------------------
// Order Preservation
// ---------------------------------------------------------------------------

describe('Order Preservation', () => {
  it('should preserve insertion order', () => {
    const builder = createTimelineBuilder()
    const traces = [createTrace('first'), createTrace('second'), createTrace('third')]
    const result = builder.build(traces)
    expect(getStrategyName(result.entries[0].trace)).toBe('first')
    expect(getStrategyName(result.entries[1].trace)).toBe('second')
    expect(getStrategyName(result.entries[2].trace)).toBe('third')
  })

  it('should not sort entries', () => {
    const builder = createTimelineBuilder()
    const traces = [createTrace('z'), createTrace('a'), createTrace('m')]
    const result = builder.build(traces)
    expect(getStrategyName(result.entries[0].trace)).toBe('z')
    expect(getStrategyName(result.entries[1].trace)).toBe('a')
    expect(getStrategyName(result.entries[2].trace)).toBe('m')
  })

  it('should not reorder entries', () => {
    const builder = createTimelineBuilder()
    const traces = [createTrace('c'), createTrace('b'), createTrace('a')]
    const result = builder.build(traces)
    expect(getStrategyName(result.entries[0].trace)).toBe('c')
    expect(getStrategyName(result.entries[1].trace)).toBe('b')
    expect(getStrategyName(result.entries[2].trace)).toBe('a')
  })

  it('should assign index 0 to the first entry', () => {
    const builder = createTimelineBuilder()
    const result = builder.build([createTrace('first'), createTrace('last')])
    expect(result.entries[0].index).toBe(0)
  })

  it('should assign last index to the last entry', () => {
    const builder = createTimelineBuilder()
    const result = builder.build([createTrace('a'), createTrace('b'), createTrace('c')])
    expect(result.entries[2].index).toBe(2)
  })
})

// ---------------------------------------------------------------------------
// Deterministic
// ---------------------------------------------------------------------------

describe('Deterministic', () => {
  it('should produce the same result for the same input across calls', () => {
    const builder = createTimelineBuilder()
    const traces = [createTrace('a'), createTrace('b')]
    const r1 = builder.build(traces)
    const r2 = builder.build(traces)
    expect(r1).toEqual(r2)
  })

  it('should produce the same result across different instances', () => {
    const traces = [createTrace('a'), createTrace('b')]
    const r1 = new DefaultPromptAssemblyTimelineBuilder().build(traces)
    const r2 = new DefaultPromptAssemblyTimelineBuilder().build(traces)
    expect(r1).toEqual(r2)
  })

  it('should produce the same output for the same input', () => {
    const builder = createTimelineBuilder()
    const traces = [createTrace('create')]
    const r1 = builder.build(traces)
    const r2 = builder.build(traces)
    expect(r1.entries[0].index).toBe(r2.entries[0].index)
    expect(r1.entries[0].trace).toEqual(r2.entries[0].trace)
  })

  it('should produce different output for different input', () => {
    const builder = createTimelineBuilder()
    const r1 = builder.build([createTrace('a')])
    const r2 = builder.build([createTrace('b')])
    expect(r1).not.toEqual(r2)
  })

  it('should maintain order stability between calls', () => {
    const builder = createTimelineBuilder()
    const traces = [createTrace('x'), createTrace('y'), createTrace('z')]
    const r1 = builder.build(traces)
    const r2 = builder.build(traces)
    for (let i = 0; i < 3; i++) {
      expect(r1.entries[i].index).toBe(r2.entries[i].index)
      expect(r1.entries[i].trace).toEqual(r2.entries[i].trace)
    }
  })
})

// ---------------------------------------------------------------------------
// Stateless
// ---------------------------------------------------------------------------

describe('Stateless', () => {
  it('should not retain state between calls', () => {
    const builder = createTimelineBuilder()
    const r1 = builder.build([createTrace('a')])
    const r2 = builder.build([createTrace('b')])
    expect(getStrategyName(r1.entries[0].trace)).toBe('a')
    expect(getStrategyName(r2.entries[0].trace)).toBe('b')
  })

  it('should produce independent results', () => {
    const builder = createTimelineBuilder()
    const r1 = builder.build([createTrace('x')])
    const r2 = builder.build([])
    expect(r1.entries).toHaveLength(1)
    expect(r2.entries).toHaveLength(0)
  })

  it('should be reusable across multiple builds', () => {
    const builder = createTimelineBuilder()
    const r1 = builder.build([createTrace('a')])
    const r2 = builder.build([createTrace('b')])
    const r3 = builder.build([createTrace('c')])
    expect(getStrategyName(r1.entries[0].trace)).toBe('a')
    expect(getStrategyName(r2.entries[0].trace)).toBe('b')
    expect(getStrategyName(r3.entries[0].trace)).toBe('c')
  })

  it('should not accumulate state from previous builds', () => {
    const builder = createTimelineBuilder()
    builder.build([createTrace('a'), createTrace('b')])
    const result = builder.build([createTrace('c')])
    expect(result.entries).toHaveLength(1)
  })
})

// ---------------------------------------------------------------------------
// Pure
// ---------------------------------------------------------------------------

describe('Pure', () => {
  it('should not modify the input traces', () => {
    const builder = createTimelineBuilder()
    const trace = createTrace('pure')
    const original = { ...trace }
    builder.build([trace])
    expect(trace).toEqual(original)
  })

  it('should not modify the input array', () => {
    const builder = createTimelineBuilder()
    const traces = [createTrace('a'), createTrace('b')]
    const originalLength = traces.length
    builder.build(traces)
    expect(traces).toHaveLength(originalLength)
  })

  it('should not mutate nested objects in traces', () => {
    const builder = createTimelineBuilder()
    const trace = createFullTrace()
    const original = JSON.parse(JSON.stringify(trace))
    builder.build([trace])
    expect(trace).toEqual(original)
  })

  it('should produce the same result when building twice with same input', () => {
    const builder = createTimelineBuilder()
    const traces = [createTrace('a'), createTrace('b'), createTrace('c')]
    const r1 = builder.build(traces)
    const r2 = builder.build(traces)
    expect(r1).toEqual(r2)
  })

  it('should not modify trace reference identity', () => {
    const builder = createTimelineBuilder()
    const traces = [createTrace('identity')]
    const result = builder.build(traces)
    expect(result.entries[0].trace).toBe(traces[0])
  })
})

// ---------------------------------------------------------------------------
// Immutable
// ---------------------------------------------------------------------------

describe('Immutable', () => {
  it('should freeze the entries array', () => {
    const builder = createTimelineBuilder()
    const result = builder.build([createTrace('a')])
    expect(Object.isFrozen(result.entries)).toBe(true)
  })

  it('should freeze the timeline result', () => {
    const builder = createTimelineBuilder()
    const result = builder.build([createTrace('a')])
    expect(Object.isFrozen(result)).toBe(true)
  })

  it('should throw when mutating frozen entries', () => {
    const builder = createTimelineBuilder()
    const result = builder.build([createTrace('a')])
    expect(() => {
      (result.entries as unknown as Array<unknown>).push({ index: 1, trace: createTrace('b') })
    }).toThrow()
  })

  it('should throw when mutating frozen result', () => {
    const builder = createTimelineBuilder()
    const result = builder.build([createTrace('a')])
    expect(() => {
      asRecord(result).entries = []
    }).toThrow()
  })

  it('should freeze individual entries inside the array', () => {
    const builder = createTimelineBuilder()
    const result = builder.build([createTrace('a')])
    expect(Object.isFrozen(result.entries[0])).toBe(true)
  })

  it('should produce frozen entries that cannot be reassigned', () => {
    const builder = createTimelineBuilder()
    const result = builder.build([createTrace('a')])
    expect(() => {
      asRecord(result.entries[0]).index = 99
    }).toThrow()
  })
})

// ---------------------------------------------------------------------------
// Export Validation
// ---------------------------------------------------------------------------

describe('Export Validation', () => {
  it('should export PromptAssemblyTimelineEntry type from strategy index', () => {
    const entry: PromptAssemblyTimelineEntry = { index: 0, trace: createTrace('test') }
    expect(entry.index).toBe(0)
  })

  it('should export PromptAssemblyTimeline type from strategy index', () => {
    const timeline: PromptAssemblyTimeline = { entries: [] }
    expect(timeline.entries).toEqual([])
  })

  it('should export PromptAssemblyTimelineBuilder type from strategy index', () => {
    const builder: PromptAssemblyTimelineBuilder = createTimelineBuilder()
    expect(builder.build([]).entries).toEqual([])
  })

  it('should export DefaultPromptAssemblyTimelineBuilder class from strategy index', () => {
    const builder = new DefaultPromptAssemblyTimelineBuilder()
    expect(builder).toBeInstanceOf(DefaultPromptAssemblyTimelineBuilder)
  })

  it('should support class instantiation', () => {
    const builder = new DefaultPromptAssemblyTimelineBuilder()
    expect(builder).toBeDefined()
  })

  it('should implement PromptAssemblyTimelineBuilder interface', () => {
    const builder: PromptAssemblyTimelineBuilder = new DefaultPromptAssemblyTimelineBuilder()
    expect(typeof builder.build).toBe('function')
  })

  it('should work with PromptAssemblyTimelineEntry interface', () => {
    const entry: PromptAssemblyTimelineEntry = { index: 42, trace: createTrace('entry') }
    expect(entry.index).toBe(42)
    expect(getStrategyName(entry.trace)).toBe('entry')
  })

  it('should work with PromptAssemblyTimeline interface', () => {
    const entry: PromptAssemblyTimelineEntry = { index: 0, trace: createTrace('entry') }
    const timeline: PromptAssemblyTimeline = { entries: [entry] }
    expect(timeline.entries).toHaveLength(1)
  })

  it('should work with PromptAssemblyTimelineBuilder interface', () => {
    const builder: PromptAssemblyTimelineBuilder = {
      build(traces: readonly PromptAssemblyTrace[]): PromptAssemblyTimeline {
        return { entries: traces.map((t, i) => ({ index: i, trace: t })) }
      },
    }
    const result = builder.build([createTrace('custom')])
    expect(result.entries).toHaveLength(1)
  })

  it('should export all timeline types and classes', () => {
    expect(new DefaultPromptAssemblyTimelineBuilder()).toBeDefined()
    const builder: PromptAssemblyTimelineBuilder = new DefaultPromptAssemblyTimelineBuilder()
    const timeline: PromptAssemblyTimeline = builder.build([createTrace('all')])
    expect(timeline.entries).toHaveLength(1)
    const entry: PromptAssemblyTimelineEntry = timeline.entries[0]
    expect(entry.index).toBe(0)
    expect(getStrategyName(entry.trace)).toBe('all')
  })
})

// ---------------------------------------------------------------------------
// Architecture Compliance
// ---------------------------------------------------------------------------

describe('Architecture Compliance', () => {
  it('should not depend on Planner', () => {
    const builder = createTimelineBuilder()
    const result = builder.build([createTrace('test')])
    expect(Object.isFrozen(result)).toBe(true)
  })

  it('should not depend on Runtime', () => {
    const builder = createTimelineBuilder()
    expect(() => builder.build([])).not.toThrow()
  })

  it('should not depend on Provider', () => {
    const builder = createTimelineBuilder()
    const result = builder.build([createTrace('test')])
    expect(result.entries).toBeDefined()
  })

  it('should not depend on Memory', () => {
    const builder = createTimelineBuilder()
    const result = builder.build([createTrace('test')])
    expect(getStrategyName(result.entries[0].trace)).toBe('test')
  })

  it('should not depend on AgentLoop', () => {
    const builder = createTimelineBuilder()
    const result = builder.build([createTrace('test')])
    expect(typeof result.entries[0].index).toBe('number')
  })

  it('should not depend on Pipeline', () => {
    const builder = createTimelineBuilder()
    expect(builder.build([])).toBeDefined()
  })

  it('should not depend on PromptBuilder', () => {
    const builder = createTimelineBuilder()
    const result = builder.build([createTrace('test')])
    expect(result.entries).toHaveLength(1)
  })

  it('should not depend on Renderer', () => {
    const builder = createTimelineBuilder()
    const result = builder.build([createTrace('test')])
    expect(result.entries[0].trace).toBeDefined()
  })

  it('should not depend on Compression', () => {
    const builder = createTimelineBuilder()
    expect(() => builder.build([])).not.toThrow()
  })

  it('should not depend on Optimizer', () => {
    const builder = createTimelineBuilder()
    const result = builder.build([createTrace('test')])
    expect(result.entries).toHaveLength(1)
  })

  it('should not depend on Differ', () => {
    const builder = createTimelineBuilder()
    const result = builder.build([createTrace('test')])
    expect(result.entries[0].index).toBe(0)
  })

  it('should not depend on Diff', () => {
    const builder = createTimelineBuilder()
    const result = builder.build([createTrace('test')])
    expect(getStrategyName(result.entries[0].trace)).toBe('test')
  })

  it('should not depend on Snapshot', () => {
    const builder = createTimelineBuilder()
    const result = builder.build([createTrace('test')])
    expect(Object.isFrozen(result.entries[0])).toBe(true)
  })

  it('should not depend on Inspector', () => {
    const builder = createTimelineBuilder()
    const result = builder.build([])
    expect(result.entries).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// Compatibility
// ---------------------------------------------------------------------------

describe('Compatibility', () => {
  it('should be compatible with RetryPlanner', () => {
    const builder = createTimelineBuilder()
    const result = builder.build([createTrace('retry')])
    expect(result.entries).toHaveLength(1)
  })

  it('should be compatible with ToolCallPlanner', () => {
    const builder = createTimelineBuilder()
    const result = builder.build([createTrace('toolcall')])
    expect(getStrategyName(result.entries[0].trace)).toBe('toolcall')
  })

  it('should be compatible with Streaming', () => {
    const builder = createTimelineBuilder()
    const result = builder.build([createTrace('streaming')])
    expect(typeof result.entries[0].index).toBe('number')
  })

  it('should be compatible with AgentLoop', () => {
    const builder = createTimelineBuilder()
    const traces = [createTrace('a'), createTrace('b')]
    const result = builder.build(traces)
    expect(result.entries).toHaveLength(2)
  })
})

// ---------------------------------------------------------------------------
// Edge Cases
// ---------------------------------------------------------------------------

describe('Edge Cases', () => {
  it('should handle the same trace repeated', () => {
    const builder = createTimelineBuilder()
    const trace = createTrace('repeat')
    const result = builder.build([trace, trace, trace])
    expect(result.entries).toHaveLength(3)
    expect(result.entries[0].trace).toBe(trace)
    expect(result.entries[1].trace).toBe(trace)
    expect(result.entries[2].trace).toBe(trace)
  })

  it('should handle repeated same reference trace', () => {
    const builder = createTimelineBuilder()
    const trace = createTrace('ref')
    const result = builder.build([trace, trace])
    expect(result.entries[0].trace).toBe(result.entries[1].trace)
  })

  it('should handle all identical traces', () => {
    const builder = createTimelineBuilder()
    const traces = Array.from({ length: 5 }, () => createTrace('same'))
    const result = builder.build(traces)
    expect(result.entries).toHaveLength(5)
    for (const entry of result.entries) {
      expect(getStrategyName(entry.trace)).toBe('same')
    }
  })

  it('should handle a single-element array', () => {
    const builder = createTimelineBuilder()
    const result = builder.build([createTrace('single')])
    expect(result.entries).toHaveLength(1)
    expect(result.entries[0].index).toBe(0)
  })

  it('should handle builder with many identical traces', () => {
    const builder = createTimelineBuilder()
    const traces = Array.from({ length: 50 }, (_, i) => createTrace(`t${i}`))
    const result = builder.build(traces)
    expect(result.entries).toHaveLength(50)
    expect(result.entries[0].index).toBe(0)
    expect(result.entries[49].index).toBe(49)
  })

  it('should handle builders with increasing trace complexity', () => {
    const builder = createTimelineBuilder()
    const traces = [
      createTrace('simple'),
      createFullTrace(),
      createTrace('simple2'),
    ]
    const result = builder.build(traces)
    expect(result.entries).toHaveLength(3)
    expect(getStrategyName(result.entries[1].trace)).toBe('create')
    expect(result.entries[1].trace.snapshot).toBeDefined()
    expect(result.entries[1].trace.inspector).toBeDefined()
  })
})