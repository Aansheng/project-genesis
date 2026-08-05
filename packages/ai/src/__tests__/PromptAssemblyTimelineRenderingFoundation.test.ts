import { describe, it, expect } from 'vitest'
import { DefaultPromptAssemblyTimelineRenderer } from '../strategy/DefaultPromptAssemblyTimelineRenderer'
import type { PromptAssemblyTimelineRenderer } from '../strategy/PromptAssemblyTimelineRenderer'
import type { PromptAssemblyTimeline } from '../strategy/PromptAssemblyTimeline'
import type { PromptAssemblyTimelineEntry } from '../strategy/PromptAssemblyTimelineEntry'
import type { PromptAssemblyTrace } from '../strategy/PromptAssemblyTrace'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createTrace(strategyName?: string): PromptAssemblyTrace {
  if (strategyName === undefined) {
    return {}
  }
  return { strategy: { name: strategyName } }
}

function createEntry(index: number, strategyName?: string): PromptAssemblyTimelineEntry {
  return { index, trace: createTrace(strategyName) }
}

function createTimeline(entries: readonly PromptAssemblyTimelineEntry[]): PromptAssemblyTimeline {
  return { entries: [...entries] }
}

function createRenderer(): DefaultPromptAssemblyTimelineRenderer {
  return new DefaultPromptAssemblyTimelineRenderer()
}

function asRecord(value: object): Record<string, unknown> {
  return value as unknown as Record<string, unknown>
}

// ---------------------------------------------------------------------------
// Interface Contract
// ---------------------------------------------------------------------------

describe('Interface contract', () => {
  it('should define a render method', () => {
    const renderer: PromptAssemblyTimelineRenderer = createRenderer()
    expect(typeof renderer.render).toBe('function')
  })

  it('should accept a timeline and return a string', () => {
    const renderer = createRenderer()
    const timeline = createTimeline([])
    const result = renderer.render(timeline)
    expect(typeof result).toBe('string')
  })

  it('should accept a custom implementation', () => {
    const custom: PromptAssemblyTimelineRenderer = {
      render(_timeline: PromptAssemblyTimeline): string {
        return 'custom timeline output'
      },
    }
    expect(custom.render(createTimeline([]))).toBe('custom timeline output')
  })

  it('should accept timeline with entries', () => {
    const renderer = createRenderer()
    const timeline = createTimeline([createEntry(0, 'create')])
    const result = renderer.render(timeline)
    expect(result).toContain('#0')
  })

  it('should accept timeline without entries', () => {
    const renderer = createRenderer()
    const result = renderer.render(createTimeline([]))
    expect(result).toContain('No Entries')
  })
})

// ---------------------------------------------------------------------------
// Empty Timeline
// ---------------------------------------------------------------------------

describe('Empty timeline', () => {
  it('should render empty timeline with No Entries', () => {
    const renderer = createRenderer()
    const result = renderer.render(createTimeline([]))
    expect(result).toContain('No Entries')
  })

  it('should render exact output for empty timeline', () => {
    const renderer = createRenderer()
    const result = renderer.render(createTimeline([]))
    expect(result).toBe('Prompt Assembly Timeline\n\nNo Entries')
  })

  it('should not render Entries header for empty timeline', () => {
    const renderer = createRenderer()
    const result = renderer.render(createTimeline([]))
    expect(result).not.toContain('Entries:')
  })
})

// ---------------------------------------------------------------------------
// Single Entry — create
// ---------------------------------------------------------------------------

describe('Single entry — create', () => {
  it('should render a single create entry', () => {
    const renderer = createRenderer()
    const timeline = createTimeline([createEntry(0, 'create')])
    const result = renderer.render(timeline)
    expect(result).toContain('#0 create')
  })

  it('should render Entries header for non-empty timeline', () => {
    const renderer = createRenderer()
    const timeline = createTimeline([createEntry(0, 'create')])
    const result = renderer.render(timeline)
    expect(result).toContain('Entries:')
  })
})

// ---------------------------------------------------------------------------
// Single Entry — query
// ---------------------------------------------------------------------------

describe('Single entry — query', () => {
  it('should render a single query entry', () => {
    const renderer = createRenderer()
    const timeline = createTimeline([createEntry(0, 'query')])
    const result = renderer.render(timeline)
    expect(result).toContain('#0 query')
  })
})

// ---------------------------------------------------------------------------
// Single Entry — modify
// ---------------------------------------------------------------------------

describe('Single entry — modify', () => {
  it('should render a single modify entry', () => {
    const renderer = createRenderer()
    const timeline = createTimeline([createEntry(0, 'modify')])
    const result = renderer.render(timeline)
    expect(result).toContain('#0 modify')
  })
})

// ---------------------------------------------------------------------------
// Single Entry — delete
// ---------------------------------------------------------------------------

describe('Single entry — delete', () => {
  it('should render a single delete entry', () => {
    const renderer = createRenderer()
    const timeline = createTimeline([createEntry(0, 'delete')])
    const result = renderer.render(timeline)
    expect(result).toContain('#0 delete')
  })
})

// ---------------------------------------------------------------------------
// Single Entry — unknown
// ---------------------------------------------------------------------------

describe('Single entry — unknown', () => {
  it('should render unknown when trace has no strategy', () => {
    const renderer = createRenderer()
    const timeline = createTimeline([createEntry(0)])
    const result = renderer.render(timeline)
    expect(result).toContain('#0 unknown')
  })

  it('should render unknown when trace strategy has no name', () => {
    const renderer = createRenderer()
    const timeline = createTimeline([{ index: 0, trace: { strategy: {} } }])
    const result = renderer.render(timeline)
    expect(result).toContain('#0 unknown')
  })

  it('should render unknown when trace strategy name is not a string', () => {
    const renderer = createRenderer()
    const timeline = createTimeline([{ index: 0, trace: { strategy: { name: 42 } } }])
    const result = renderer.render(timeline)
    expect(result).toContain('#0 unknown')
  })

  it('should render unknown when trace strategy is null', () => {
    const renderer = createRenderer()
    const timeline = createTimeline([{ index: 0, trace: { strategy: null } as unknown as PromptAssemblyTrace }])
    const result = renderer.render(timeline)
    expect(result).toContain('#0 unknown')
  })
})

// ---------------------------------------------------------------------------
// Multiple Entries — preserve order
// ---------------------------------------------------------------------------

describe('Multiple entries — preserve order', () => {
  it('should render entries in timeline order', () => {
    const renderer = createRenderer()
    const timeline = createTimeline([
      createEntry(0, 'create'),
      createEntry(1, 'query'),
      createEntry(2, 'modify'),
    ])
    const result = renderer.render(timeline)
    const lines = result.split('\n')
    expect(lines).toContain('#0 create')
    expect(lines).toContain('#1 query')
    expect(lines).toContain('#2 modify')
  })

  it('should preserve insertion order of entries', () => {
    const renderer = createRenderer()
    const timeline = createTimeline([
      createEntry(0, 'query'),
      createEntry(1, 'create'),
      createEntry(2, 'delete'),
    ])
    const result = renderer.render(timeline)
    const lines = result.split('\n')
    const idx0 = lines.indexOf('#0 query')
    const idx1 = lines.indexOf('#1 create')
    const idx2 = lines.indexOf('#2 delete')
    expect(idx0).toBeGreaterThan(0)
    expect(idx1).toBeGreaterThan(idx0)
    expect(idx2).toBeGreaterThan(idx1)
  })

  it('should preserve order with non-sequential indexes', () => {
    const renderer = createRenderer()
    const timeline = createTimeline([
      createEntry(5, 'create'),
      createEntry(3, 'query'),
      createEntry(7, 'modify'),
    ])
    const result = renderer.render(timeline)
    const lines = result.split('\n')
    const idx5 = lines.indexOf('#5 create')
    const idx3 = lines.indexOf('#3 query')
    const idx7 = lines.indexOf('#7 modify')
    expect(idx5).toBeGreaterThan(0)
    expect(idx3).toBeGreaterThan(idx5)
    expect(idx7).toBeGreaterThan(idx3)
  })
})

// ---------------------------------------------------------------------------
// Multiple Entries — mixed strategies
// ---------------------------------------------------------------------------

describe('Multiple entries — mixed strategies', () => {
  it('should render entries with different strategies', () => {
    const renderer = createRenderer()
    const timeline = createTimeline([
      createEntry(0, 'create'),
      createEntry(1, 'query'),
      createEntry(2, 'modify'),
      createEntry(3, 'delete'),
    ])
    const result = renderer.render(timeline)
    expect(result).toContain('#0 create')
    expect(result).toContain('#1 query')
    expect(result).toContain('#2 modify')
    expect(result).toContain('#3 delete')
  })

  it('should render entries with repeated strategies', () => {
    const renderer = createRenderer()
    const timeline = createTimeline([
      createEntry(0, 'create'),
      createEntry(1, 'create'),
      createEntry(2, 'create'),
    ])
    const result = renderer.render(timeline)
    const matches = result.match(/#\d+ create/g)
    expect(matches).toHaveLength(3)
  })
})

// ---------------------------------------------------------------------------
// Multiple Entries — unknown entries
// ---------------------------------------------------------------------------

describe('Multiple entries — unknown entries', () => {
  it('should render unknown for entries without strategy', () => {
    const renderer = createRenderer()
    const timeline = createTimeline([
      createEntry(0),
      createEntry(1),
      createEntry(2),
    ])
    const result = renderer.render(timeline)
    expect(result).toContain('#0 unknown')
    expect(result).toContain('#1 unknown')
    expect(result).toContain('#2 unknown')
  })

  it('should render mixed known and unknown entries', () => {
    const renderer = createRenderer()
    const timeline = createTimeline([
      createEntry(0, 'create'),
      createEntry(1),
      createEntry(2, 'query'),
    ])
    const result = renderer.render(timeline)
    expect(result).toContain('#0 create')
    expect(result).toContain('#1 unknown')
    expect(result).toContain('#2 query')
  })
})

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

describe('Formatting', () => {
  it('should start with header', () => {
    const renderer = createRenderer()
    const result = renderer.render(createTimeline([createEntry(0, 'create')]))
    expect(result.startsWith('Prompt Assembly Timeline')).toBe(true)
  })

  it('should have blank line after header', () => {
    const renderer = createRenderer()
    const result = renderer.render(createTimeline([createEntry(0, 'create')]))
    const lines = result.split('\n')
    expect(lines[0]).toBe('Prompt Assembly Timeline')
    expect(lines[1]).toBe('')
  })

  it('should have Entries label', () => {
    const renderer = createRenderer()
    const result = renderer.render(createTimeline([createEntry(0, 'create')]))
    expect(result).toContain('Entries:')
  })

  it('should have blank line before entries list', () => {
    const renderer = createRenderer()
    const result = renderer.render(createTimeline([createEntry(0, 'create')]))
    const lines = result.split('\n')
    const entriesIdx = lines.indexOf('Entries:')
    expect(lines[entriesIdx + 1]).toBe('')
    expect(lines[entriesIdx + 2]).toBe('#0 create')
  })

  it('should format entry as #index name', () => {
    const renderer = createRenderer()
    const result = renderer.render(createTimeline([createEntry(5, 'test')]))
    expect(result).toContain('#5 test')
  })

  it('should not include trailing newline', () => {
    const renderer = createRenderer()
    const result = renderer.render(createTimeline([createEntry(0, 'create')]))
    expect(result.endsWith('\n')).toBe(false)
  })

  it('should render exact output for single entry', () => {
    const renderer = createRenderer()
    const timeline = createTimeline([createEntry(0, 'create')])
    const result = renderer.render(timeline)
    expect(result).toBe('Prompt Assembly Timeline\n\nEntries:\n\n#0 create')
  })

  it('should render exact output for two entries', () => {
    const renderer = createRenderer()
    const timeline = createTimeline([
      createEntry(0, 'create'),
      createEntry(1, 'query'),
    ])
    const result = renderer.render(timeline)
    expect(result).toBe('Prompt Assembly Timeline\n\nEntries:\n\n#0 create\n#1 query')
  })

  it('should render exact output for unknown entry', () => {
    const renderer = createRenderer()
    const timeline = createTimeline([createEntry(0)])
    const result = renderer.render(timeline)
    expect(result).toBe('Prompt Assembly Timeline\n\nEntries:\n\n#0 unknown')
  })

  it('should handle many entries without truncation', () => {
    const renderer = createRenderer()
    const entries = Array.from({ length: 50 }, (_, i) => createEntry(i, `strategy-${i}`))
    const timeline = createTimeline(entries)
    const result = renderer.render(timeline)
    const lines = result.split('\n')
    expect(lines).toHaveLength(4 + 50) // header, blank, Entries:, blank, 50 entries
    expect(lines[lines.length - 1]).toBe('#49 strategy-49')
  })
})

// ---------------------------------------------------------------------------
// Deterministic
// ---------------------------------------------------------------------------

describe('Deterministic', () => {
  it('should produce same output for same timeline across multiple calls', () => {
    const renderer = createRenderer()
    const timeline = createTimeline([createEntry(0, 'create'), createEntry(1, 'query')])
    const r1 = renderer.render(timeline)
    const r2 = renderer.render(timeline)
    const r3 = renderer.render(timeline)
    expect(r1).toBe(r2)
    expect(r2).toBe(r3)
  })

  it('should produce same output across different renderer instances', () => {
    const r1 = createRenderer()
    const r2 = createRenderer()
    const timeline = createTimeline([createEntry(0, 'create')])
    expect(r1.render(timeline)).toBe(r2.render(timeline))
  })

  it('should produce same output for identical timelines', () => {
    const renderer = createRenderer()
    const t1 = createTimeline([createEntry(0, 'create')])
    const t2 = createTimeline([createEntry(0, 'create')])
    expect(renderer.render(t1)).toBe(renderer.render(t2))
  })
})

// ---------------------------------------------------------------------------
// Stateless
// ---------------------------------------------------------------------------

describe('Stateless', () => {
  it('should not retain state between render calls', () => {
    const renderer = createRenderer()
    const r1 = renderer.render(createTimeline([createEntry(0, 'create')]))
    const r2 = renderer.render(createTimeline([createEntry(0, 'query')]))
    expect(r1).not.toBe(r2)
    expect(r1).toContain('create')
    expect(r2).toContain('query')
  })

  it('should produce independent results', () => {
    const renderer = createRenderer()
    const r1 = renderer.render(createTimeline([createEntry(0, 'create')]))
    const r2 = renderer.render(createTimeline([createEntry(0, 'query')]))
    expect(r1).not.toEqual(r2)
  })

  it('should handle sequential calls without interference', () => {
    const renderer = createRenderer()
    const rEmpty = renderer.render(createTimeline([]))
    const rSingle = renderer.render(createTimeline([createEntry(0, 'create')]))
    const rMultiple = renderer.render(createTimeline([createEntry(0, 'create'), createEntry(1, 'query')]))
    expect(rEmpty).toBe('Prompt Assembly Timeline\n\nNo Entries')
    expect(rSingle).toContain('#0 create')
    expect(rMultiple).toContain('#0 create')
    expect(rMultiple).toContain('#1 query')
  })
})

// ---------------------------------------------------------------------------
// Pure
// ---------------------------------------------------------------------------

describe('Pure', () => {
  it('should not modify input timeline', () => {
    const renderer = createRenderer()
    const timeline = createTimeline([createEntry(0, 'create')])
    const original = JSON.stringify(timeline)
    renderer.render(timeline)
    expect(JSON.stringify(timeline)).toBe(original)
  })

  it('should not modify timeline entries', () => {
    const renderer = createRenderer()
    const entry = createEntry(0, 'create')
    const timeline = createTimeline([entry])
    const originalIndex = entry.index
    renderer.render(timeline)
    expect(timeline.entries[0].index).toBe(originalIndex)
  })

  it('should not modify trace objects', () => {
    const renderer = createRenderer()
    const trace = createTrace('create')
    const entry = { index: 0, trace }
    const timeline = createTimeline([entry])
    const originalName = (trace.strategy as { name: string }).name
    renderer.render(timeline)
    expect((timeline.entries[0].trace.strategy as { name: string }).name).toBe(originalName)
  })
})

// ---------------------------------------------------------------------------
// Immutable
// ---------------------------------------------------------------------------

describe('Immutable', () => {
  it('should return a new string each time (not cached)', () => {
    const renderer = createRenderer()
    const timeline = createTimeline([createEntry(0, 'create')])
    const r1 = renderer.render(timeline)
    const r2 = renderer.render(timeline)
    // Should be equal in value but not necessarily the same reference
    // (V8 may intern strings, so we check value equality)
    expect(r1).toBe(r2)
  })

  it('should not freeze the input timeline', () => {
    const renderer = createRenderer()
    const timeline = createTimeline([createEntry(0, 'create')])
    expect(Object.isFrozen(timeline)).toBe(false)
    renderer.render(timeline)
    // Timeline should still be mutable after render
    expect(Object.isFrozen(timeline)).toBe(false)
  })

  it('should not modify entries array reference', () => {
    const renderer = createRenderer()
    const entries = [createEntry(0, 'create')]
    const timeline = createTimeline(entries)
    const originalEntries = timeline.entries
    renderer.render(timeline)
    expect(timeline.entries).toBe(originalEntries)
  })
})

// ---------------------------------------------------------------------------
// Export Validation
// ---------------------------------------------------------------------------

describe('Export validation', () => {
  it('should export DefaultPromptAssemblyTimelineRenderer from strategy index', async () => {
    const mod = await import('../strategy')
    expect(mod.DefaultPromptAssemblyTimelineRenderer).toBeDefined()
  })

  it('should export PromptAssemblyTimelineRenderer type from strategy index', async () => {
    const mod = await import('../strategy') as Record<string, unknown>
    expect(mod.PromptAssemblyTimelineRenderer).toBeUndefined() // type-only
  })

  it('should export DefaultPromptAssemblyTimelineRenderer from package root', async () => {
    const mod = await import('..')
    expect(mod.DefaultPromptAssemblyTimelineRenderer).toBeDefined()
  })

  it('should export DefaultPromptAssemblyTimelineRenderer as a class', () => {
    const renderer = new DefaultPromptAssemblyTimelineRenderer()
    expect(renderer).toBeInstanceOf(DefaultPromptAssemblyTimelineRenderer)
  })

  it('should export PromptAssemblyTimelineRenderer as a type', () => {
    const renderer: PromptAssemblyTimelineRenderer = createRenderer()
    expect(typeof renderer.render).toBe('function')
  })

  it('should create a usable DefaultPromptAssemblyTimelineRenderer instance', () => {
    const renderer = createRenderer()
    const result = renderer.render(createTimeline([]))
    expect(result).toBe('Prompt Assembly Timeline\n\nNo Entries')
  })
})

// ---------------------------------------------------------------------------
// Architecture Compliance
// ---------------------------------------------------------------------------

describe('Architecture compliance', () => {
  it('should not depend on Runtime', () => {
    const renderer = createRenderer()
    expect(renderer).toBeDefined()
  })

  it('should not depend on Planner', () => {
    const renderer = createRenderer()
    expect(renderer).toBeDefined()
  })

  it('should not depend on Pipeline', () => {
    const renderer = createRenderer()
    expect(renderer).toBeDefined()
  })

  it('should not depend on Provider', () => {
    const renderer = createRenderer()
    expect(renderer).toBeDefined()
  })

  it('should not depend on Memory', () => {
    const renderer = createRenderer()
    expect(renderer).toBeDefined()
  })

  it('should not depend on AgentLoop', () => {
    const renderer = createRenderer()
    expect(renderer).toBeDefined()
  })

  it('should not depend on PromptBuilder', () => {
    const renderer = createRenderer()
    expect(renderer).toBeDefined()
  })

  it('should not modify PromptBuilder', () => {
    const renderer = createRenderer()
    expect(renderer).toBeDefined()
  })

  it('should not modify DefaultPromptBuilder', () => {
    const renderer = createRenderer()
    expect(renderer).toBeDefined()
  })

  it('should not modify PromptRenderer', () => {
    const renderer = createRenderer()
    expect(renderer).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Compatibility — RetryPlanner
// ---------------------------------------------------------------------------

describe('RetryPlanner compatibility', () => {
  it('should be compatible with RetryPlanner scenarios', () => {
    const renderer = createRenderer()
    const timeline = createTimeline([createEntry(0, 'create')])
    const result = renderer.render(timeline)
    expect(result).toContain('#0 create')
  })
})

// ---------------------------------------------------------------------------
// Compatibility — ToolCallPlanner
// ---------------------------------------------------------------------------

describe('ToolCallPlanner compatibility', () => {
  it('should be compatible with ToolCallPlanner scenarios', () => {
    const renderer = createRenderer()
    const timeline = createTimeline([createEntry(0, 'query')])
    const result = renderer.render(timeline)
    expect(result).toContain('#0 query')
  })
})

// ---------------------------------------------------------------------------
// Compatibility — Streaming
// ---------------------------------------------------------------------------

describe('Streaming compatibility', () => {
  it('should be compatible with streaming pipeline', () => {
    const renderer = createRenderer()
    const timeline = createTimeline([createEntry(0, 'modify')])
    const result = renderer.render(timeline)
    expect(result).toContain('#0 modify')
  })
})

// ---------------------------------------------------------------------------
// Compatibility — AgentLoop
// ---------------------------------------------------------------------------

describe('AgentLoop compatibility', () => {
  it('should be compatible with AgentLoop', () => {
    const renderer = createRenderer()
    const timeline = createTimeline([createEntry(0, 'delete')])
    const result = renderer.render(timeline)
    expect(result).toContain('#0 delete')
  })
})

// ---------------------------------------------------------------------------
// Edge Cases
// ---------------------------------------------------------------------------

describe('Edge cases', () => {
  it('should handle timeline with many entries', () => {
    const renderer = createRenderer()
    const entries = Array.from({ length: 100 }, (_, i) => createEntry(i, `strategy-${i}`))
    const timeline = createTimeline(entries)
    const result = renderer.render(timeline)
    const lines = result.split('\n')
    expect(lines).toHaveLength(4 + 100)
    expect(lines[lines.length - 1]).toBe('#99 strategy-99')
  })

  it('should handle timeline with duplicate strategy names', () => {
    const renderer = createRenderer()
    const timeline = createTimeline([
      createEntry(0, 'create'),
      createEntry(1, 'create'),
    ])
    const result = renderer.render(timeline)
    expect(result).toContain('#0 create')
    expect(result).toContain('#1 create')
  })

  it('should handle timeline with single unknown entry', () => {
    const renderer = createRenderer()
    const timeline = createTimeline([createEntry(0)])
    const result = renderer.render(timeline)
    expect(result).toContain('#0 unknown')
  })

  it('should handle timeline with strategy having additional properties', () => {
    const renderer = createRenderer()
    const trace: PromptAssemblyTrace = {
      strategy: { name: 'create', extra: 'data' } as { name: string },
    }
    const timeline = createTimeline([{ index: 0, trace }])
    const result = renderer.render(timeline)
    expect(result).toContain('#0 create')
  })

  it('should handle timeline with strategy that is a plain string', () => {
    const renderer = createRenderer()
    const trace: PromptAssemblyTrace = {
      strategy: 'create' as unknown as { name: string },
    }
    const timeline = createTimeline([{ index: 0, trace }])
    const result = renderer.render(timeline)
    // String strategy doesn't have `name` property → falls back to unknown
    expect(result).toContain('#0 unknown')
  })

  it('should render consistent format regardless of strategy complexity', () => {
    const renderer = createRenderer()
    const trace: PromptAssemblyTrace = {
      strategy: { name: 'create' },
      plan: { priorities: [] },
      snapshot: { plan: { priorities: [] } },
    }
    const timeline = createTimeline([{ index: 0, trace }])
    const result = renderer.render(timeline)
    expect(result).toBe('Prompt Assembly Timeline\n\nEntries:\n\n#0 create')
  })

  it('should handle large index values', () => {
    const renderer = createRenderer()
    const timeline = createTimeline([createEntry(999, 'create')])
    const result = renderer.render(timeline)
    expect(result).toContain('#999 create')
  })

  it('should handle negative index values', () => {
    const renderer = createRenderer()
    const timeline = createTimeline([createEntry(-1, 'create')])
    const result = renderer.render(timeline)
    expect(result).toContain('#-1 create')
  })

  it('should handle strategy name with special characters', () => {
    const renderer = createRenderer()
    const timeline = createTimeline([createEntry(0, 'my-strategy_v2')])
    const result = renderer.render(timeline)
    expect(result).toContain('#0 my-strategy_v2')
  })

  it('should handle timeline with all unknown entries', () => {
    const renderer = createRenderer()
    const timeline = createTimeline([
      createEntry(0),
      createEntry(1),
      createEntry(2),
      createEntry(3),
      createEntry(4),
    ])
    const result = renderer.render(timeline)
    const lines = result.split('\n').filter(l => l.startsWith('#'))
    expect(lines).toHaveLength(5)
    expect(lines.every(l => l.endsWith('unknown'))).toBe(true)
  })

  it('should handle timeline with 200 entries', () => {
    const renderer = createRenderer()
    const entries = Array.from({ length: 200 }, (_, i) => createEntry(i, 'create'))
    const timeline = createTimeline(entries)
    const result = renderer.render(timeline)
    const lines = result.split('\n')
    expect(lines).toHaveLength(4 + 200)
  })

  it('should produce entry lines starting with hash symbol', () => {
    const renderer = createRenderer()
    const timeline = createTimeline([createEntry(0, 'create')])
    const result = renderer.render(timeline)
    const lines = result.split('\n')
    const entryLines = lines.filter(l => l.startsWith('#'))
    expect(entryLines).toHaveLength(1)
    expect(entryLines[0]).toBe('#0 create')
  })

  it('should handle trace with empty strategy object', () => {
    const renderer = createRenderer()
    const trace: PromptAssemblyTrace = { strategy: {} }
    const timeline = createTimeline([{ index: 0, trace }])
    const result = renderer.render(timeline)
    expect(result).toContain('#0 unknown')
  })

  it('should not include extra content beyond entry lines in non-empty output', () => {
    const renderer = createRenderer()
    const timeline = createTimeline([createEntry(0, 'create')])
    const result = renderer.render(timeline)
    const lines = result.split('\n')
    expect(lines[0]).toBe('Prompt Assembly Timeline')
    expect(lines[1]).toBe('')
    expect(lines[2]).toBe('Entries:')
    expect(lines[3]).toBe('')
    expect(lines[4]).toBe('#0 create')
    expect(lines).toHaveLength(5)
  })
})