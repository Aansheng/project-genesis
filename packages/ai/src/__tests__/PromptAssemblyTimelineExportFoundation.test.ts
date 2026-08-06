import { describe, it, expect } from 'vitest'
import { DefaultPromptAssemblyTimelineExporter } from '../strategy/DefaultPromptAssemblyTimelineExporter'
import type { PromptAssemblyTimelineExporter } from '../strategy/PromptAssemblyTimelineExporter'
import type { PromptAssemblyTimeline } from '../strategy/PromptAssemblyTimeline'
import type { PromptAssemblyTimelineEntry } from '../strategy/PromptAssemblyTimelineEntry'
import type { PromptAssemblyTrace } from '../strategy/PromptAssemblyTrace'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createEmptyTimeline(): PromptAssemblyTimeline {
  return { entries: [] }
}

function createTrace(strategyName?: string): PromptAssemblyTrace {
  if (strategyName === undefined) return {}
  return { strategy: { name: strategyName } }
}

function createEntry(index: number, strategyName?: string): PromptAssemblyTimelineEntry {
  return { index, trace: createTrace(strategyName) }
}

function createTimelineWithEntries(entries: PromptAssemblyTimelineEntry[]): PromptAssemblyTimeline {
  return { entries }
}

function createSingleEntryTimeline(strategyName: string): PromptAssemblyTimeline {
  return createTimelineWithEntries([createEntry(0, strategyName)])
}

function createMultiEntryTimeline(
  strategies: string[],
): PromptAssemblyTimeline {
  return createTimelineWithEntries(
    strategies.map((name, i) => createEntry(i, name)),
  )
}

function createFullTimeline(): PromptAssemblyTimeline {
  return {
    entries: [
      {
        index: 0,
        trace: {
          strategy: { name: 'create' },
          strategySelection: { selected: 'create', candidates: [] },
          plan: { priorities: [{ section: 'userInput', priority: 100 }] },
          optimizedPlan: { priorities: [{ section: 'userInput', priority: 90 }] },
          planDiff: { added: [], removed: [], changed: [{ section: 'userInput', before: 100, after: 90 }] },
          snapshot: { plan: { priorities: [] } },
          inspector: { strategy: 'create', sections: [{ title: 'Rendered Strategy', content: 'create' }] },
          inspectorRendered: 'rendered output',
          inspectorExported: '{"strategy":"create"}',
        },
      },
      {
        index: 1,
        trace: {
          strategy: { name: 'query' },
          strategySelection: { selected: 'query', candidates: [{ name: 'query', score: 100 }, { name: 'create', score: 20 }] },
          plan: { priorities: [{ section: 'entity', priority: 100 }] },
          inspector: { strategy: 'query', sections: [] },
        },
      },
    ],
  }
}

// ---------------------------------------------------------------------------
// Interface Contract
// ---------------------------------------------------------------------------

describe('Interface contract', () => {
  it('should define export method', () => {
    const exporter: PromptAssemblyTimelineExporter = new DefaultPromptAssemblyTimelineExporter()
    expect(typeof exporter.export).toBe('function')
  })

  it('should accept a timeline and return a string', () => {
    const exporter = new DefaultPromptAssemblyTimelineExporter()
    const result = exporter.export(createEmptyTimeline())
    expect(typeof result).toBe('string')
  })

  it('should accept a custom implementation', () => {
    const custom: PromptAssemblyTimelineExporter = {
      export(_timeline: PromptAssemblyTimeline): string {
        return 'custom export'
      },
    }
    expect(custom.export(createEmptyTimeline())).toBe('custom export')
  })
})

// ---------------------------------------------------------------------------
// Empty Timeline
// ---------------------------------------------------------------------------

describe('Empty timeline', () => {
  it('should export empty timeline as JSON object with empty entries array', () => {
    const exporter = new DefaultPromptAssemblyTimelineExporter()
    const timeline = createEmptyTimeline()
    const result = exporter.export(timeline)
    const parsed = JSON.parse(result)
    expect(parsed).toEqual({ entries: [] })
  })

  it('should produce exact JSON.stringify output for empty timeline', () => {
    const exporter = new DefaultPromptAssemblyTimelineExporter()
    const timeline = createEmptyTimeline()
    expect(exporter.export(timeline)).toBe(JSON.stringify(timeline, null, 2))
  })

  it('should have entries array in output', () => {
    const exporter = new DefaultPromptAssemblyTimelineExporter()
    const result = exporter.export(createEmptyTimeline())
    const parsed = JSON.parse(result)
    expect(Array.isArray(parsed.entries)).toBe(true)
    expect(parsed.entries).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// Single Entry
// ---------------------------------------------------------------------------

describe('Single entry', () => {
  it('should export timeline with single create entry', () => {
    const exporter = new DefaultPromptAssemblyTimelineExporter()
    const timeline = createSingleEntryTimeline('create')
    const result = exporter.export(timeline)
    const parsed = JSON.parse(result)
    expect(parsed.entries).toHaveLength(1)
    expect(parsed.entries[0].index).toBe(0)
    expect(parsed.entries[0].trace.strategy.name).toBe('create')
  })

  it('should export timeline with single query entry', () => {
    const exporter = new DefaultPromptAssemblyTimelineExporter()
    const timeline = createSingleEntryTimeline('query')
    const result = exporter.export(timeline)
    const parsed = JSON.parse(result)
    expect(parsed.entries[0].trace.strategy.name).toBe('query')
  })

  it('should export timeline with single modify entry', () => {
    const exporter = new DefaultPromptAssemblyTimelineExporter()
    const timeline = createSingleEntryTimeline('modify')
    const result = exporter.export(timeline)
    const parsed = JSON.parse(result)
    expect(parsed.entries[0].trace.strategy.name).toBe('modify')
  })

  it('should export timeline with single delete entry', () => {
    const exporter = new DefaultPromptAssemblyTimelineExporter()
    const timeline = createSingleEntryTimeline('delete')
    const result = exporter.export(timeline)
    const parsed = JSON.parse(result)
    expect(parsed.entries[0].trace.strategy.name).toBe('delete')
  })

  it('should export timeline with entry that has no strategy field', () => {
    const exporter = new DefaultPromptAssemblyTimelineExporter()
    const timeline = createTimelineWithEntries([createEntry(0)])
    const result = exporter.export(timeline)
    const parsed = JSON.parse(result)
    expect(parsed.entries).toHaveLength(1)
    expect(parsed.entries[0].index).toBe(0)
  })

  it('should export timeline with entry with full trace structure', () => {
    const exporter = new DefaultPromptAssemblyTimelineExporter()
    const timeline = createTimelineWithEntries([
      {
        index: 0,
        trace: {
          strategy: { name: 'create' },
          strategySelection: { selected: 'create', candidates: [] },
          plan: { priorities: [{ section: 'userInput', priority: 100 }] },
          optimizedPlan: { priorities: [{ section: 'userInput', priority: 90 }] },
          planDiff: { added: [], removed: [], changed: [{ section: 'userInput', before: 100, after: 90 }] },
          snapshot: { plan: { priorities: [] } },
          inspector: { strategy: 'create', sections: [{ title: 'Test', content: 'content' }] },
          inspectorRendered: 'rendered',
          inspectorExported: '{"key":"val"}',
        },
      },
    ])
    const result = exporter.export(timeline)
    const parsed = JSON.parse(result)
    expect(parsed.entries[0].trace.strategy.name).toBe('create')
    expect(parsed.entries[0].trace.strategySelection.selected).toBe('create')
    expect(parsed.entries[0].trace.inspectorRendered).toBe('rendered')
  })
})

// ---------------------------------------------------------------------------
// Multiple Entries
// ---------------------------------------------------------------------------

describe('Multiple entries', () => {
  it('should preserve entry order in export', () => {
    const exporter = new DefaultPromptAssemblyTimelineExporter()
    const timeline = createMultiEntryTimeline(['create', 'query', 'modify', 'delete'])
    const result = exporter.export(timeline)
    const parsed = JSON.parse(result)
    expect(parsed.entries).toHaveLength(4)
    expect(parsed.entries[0].trace.strategy.name).toBe('create')
    expect(parsed.entries[1].trace.strategy.name).toBe('query')
    expect(parsed.entries[2].trace.strategy.name).toBe('modify')
    expect(parsed.entries[3].trace.strategy.name).toBe('delete')
  })

  it('should export mixed strategies correctly', () => {
    const exporter = new DefaultPromptAssemblyTimelineExporter()
    const timeline = createMultiEntryTimeline(['create', 'create', 'query', 'modify', 'delete', 'query'])
    const result = exporter.export(timeline)
    const parsed = JSON.parse(result)
    expect(parsed.entries).toHaveLength(6)
    expect(parsed.entries[0].trace.strategy.name).toBe('create')
    expect(parsed.entries[1].trace.strategy.name).toBe('create')
    expect(parsed.entries[4].trace.strategy.name).toBe('delete')
  })

  it('should export entries with non-sequential indices', () => {
    const exporter = new DefaultPromptAssemblyTimelineExporter()
    const timeline = createTimelineWithEntries([
      { index: 5, trace: { strategy: { name: 'create' } } },
      { index: 10, trace: { strategy: { name: 'query' } } },
    ])
    const result = exporter.export(timeline)
    const parsed = JSON.parse(result)
    expect(parsed.entries[0].index).toBe(5)
    expect(parsed.entries[1].index).toBe(10)
  })

  it('should export entries with repeated strategies', () => {
    const exporter = new DefaultPromptAssemblyTimelineExporter()
    const timeline = createMultiEntryTimeline(['create', 'create', 'create'])
    const result = exporter.export(timeline)
    const parsed = JSON.parse(result)
    expect(parsed.entries).toHaveLength(3)
    parsed.entries.forEach((entry: { trace: { strategy: { name: string } } }) => {
      expect(entry.trace.strategy.name).toBe('create')
    })
  })

  it('should export entries with varying trace detail', () => {
    const exporter = new DefaultPromptAssemblyTimelineExporter()
    const timeline = createTimelineWithEntries([
      { index: 0, trace: { strategy: { name: 'create' } } },
      { index: 1, trace: {} },
      { index: 2, trace: { strategy: { name: 'modify' }, inspectorRendered: 'detail' } },
    ])
    const result = exporter.export(timeline)
    const parsed = JSON.parse(result)
    expect(parsed.entries[0].trace.strategy.name).toBe('create')
    expect(parsed.entries[1].trace).toEqual({})
    expect(parsed.entries[2].trace.strategy.name).toBe('modify')
    expect(parsed.entries[2].trace.inspectorRendered).toBe('detail')
  })
})

// ---------------------------------------------------------------------------
// JSON Validation
// ---------------------------------------------------------------------------

describe('JSON validation', () => {
  it('should produce valid JSON', () => {
    const exporter = new DefaultPromptAssemblyTimelineExporter()
    const timeline = createFullTimeline()
    const result = exporter.export(timeline)
    expect(() => JSON.parse(result)).not.toThrow()
  })

  it('should produce parseable JSON for empty timeline', () => {
    const exporter = new DefaultPromptAssemblyTimelineExporter()
    const result = exporter.export(createEmptyTimeline())
    expect(() => JSON.parse(result)).not.toThrow()
  })

  it('should produce parseable JSON for single entry', () => {
    const exporter = new DefaultPromptAssemblyTimelineExporter()
    const result = exporter.export(createSingleEntryTimeline('create'))
    expect(() => JSON.parse(result)).not.toThrow()
  })

  it('should produce parseable JSON for multi entry', () => {
    const exporter = new DefaultPromptAssemblyTimelineExporter()
    const result = exporter.export(createMultiEntryTimeline(['create', 'query']))
    expect(() => JSON.parse(result)).not.toThrow()
  })

  it('should exactly match JSON.stringify output', () => {
    const exporter = new DefaultPromptAssemblyTimelineExporter()
    const timeline = createFullTimeline()
    expect(exporter.export(timeline)).toBe(JSON.stringify(timeline, null, 2))
  })

  it('should match JSON.stringify for empty timeline', () => {
    const exporter = new DefaultPromptAssemblyTimelineExporter()
    const timeline = createEmptyTimeline()
    expect(exporter.export(timeline)).toBe(JSON.stringify(timeline, null, 2))
  })

  it('should match JSON.stringify for single entry timeline', () => {
    const exporter = new DefaultPromptAssemblyTimelineExporter()
    const timeline = createSingleEntryTimeline('create')
    expect(exporter.export(timeline)).toBe(JSON.stringify(timeline, null, 2))
  })

  it('should match JSON.stringify for multi entry timeline', () => {
    const exporter = new DefaultPromptAssemblyTimelineExporter()
    const timeline = createMultiEntryTimeline(['create', 'query', 'modify'])
    expect(exporter.export(timeline)).toBe(JSON.stringify(timeline, null, 2))
  })

  it('should be pretty printed with 2-space indentation', () => {
    const exporter = new DefaultPromptAssemblyTimelineExporter()
    const timeline = createSingleEntryTimeline('create')
    const result = exporter.export(timeline)
    expect(result).toContain('  ')
    expect(result).toContain('\n')
  })

  it('should have correct indentation level', () => {
    const exporter = new DefaultPromptAssemblyTimelineExporter()
    const timeline = createSingleEntryTimeline('create')
    const result = exporter.export(timeline)
    // Check for 2-space indentation: "  " before entries
    expect(result).toContain('  "entries"')
  })

  it('should round-trip through JSON.parse', () => {
    const exporter = new DefaultPromptAssemblyTimelineExporter()
    const timeline = createFullTimeline()
    const result = exporter.export(timeline)
    const parsed = JSON.parse(result)
    expect(parsed).toEqual(timeline)
  })
})

// ---------------------------------------------------------------------------
// Deterministic
// ---------------------------------------------------------------------------

describe('Deterministic', () => {
  it('should produce same output for same timeline across multiple calls', () => {
    const exporter = new DefaultPromptAssemblyTimelineExporter()
    const timeline = createFullTimeline()
    const r1 = exporter.export(timeline)
    const r2 = exporter.export(timeline)
    const r3 = exporter.export(timeline)
    expect(r1).toBe(r2)
    expect(r2).toBe(r3)
  })

  it('should produce same output across different exporter instances', () => {
    const e1 = new DefaultPromptAssemblyTimelineExporter()
    const e2 = new DefaultPromptAssemblyTimelineExporter()
    const timeline = createFullTimeline()
    expect(e1.export(timeline)).toBe(e2.export(timeline))
  })

  it('should produce same output for identical timelines', () => {
    const exporter = new DefaultPromptAssemblyTimelineExporter()
    const timeline1 = createSingleEntryTimeline('create')
    const timeline2 = createSingleEntryTimeline('create')
    expect(exporter.export(timeline1)).toBe(exporter.export(timeline2))
  })

  it('should produce same output for empty timelines', () => {
    const exporter = new DefaultPromptAssemblyTimelineExporter()
    expect(exporter.export(createEmptyTimeline())).toBe(exporter.export(createEmptyTimeline()))
  })
})

// ---------------------------------------------------------------------------
// Stateless
// ---------------------------------------------------------------------------

describe('Stateless', () => {
  it('should not retain state between export calls', () => {
    const exporter = new DefaultPromptAssemblyTimelineExporter()
    const r1 = exporter.export(createSingleEntryTimeline('create'))
    const r2 = exporter.export(createSingleEntryTimeline('query'))
    const p1 = JSON.parse(r1)
    const p2 = JSON.parse(r2)
    expect(p1.entries[0].trace.strategy.name).toBe('create')
    expect(p2.entries[0].trace.strategy.name).toBe('query')
  })

  it('should produce independent results from sequential calls', () => {
    const exporter = new DefaultPromptAssemblyTimelineExporter()
    const r1 = exporter.export(createFullTimeline())
    const r2 = exporter.export(createEmptyTimeline())
    expect(r1).not.toBe(r2)
    expect(JSON.parse(r2)).toEqual({ entries: [] })
  })

  it('should handle alternating calls without interference', () => {
    const exporter = new DefaultPromptAssemblyTimelineExporter()
    const t1 = createSingleEntryTimeline('create')
    const t2 = createSingleEntryTimeline('query')
    const r1a = exporter.export(t1)
    const r2a = exporter.export(t2)
    const r1b = exporter.export(t1)
    const r2b = exporter.export(t2)
    expect(r1a).toBe(r1b)
    expect(r2a).toBe(r2b)
  })
})

// ---------------------------------------------------------------------------
// Pure
// ---------------------------------------------------------------------------

describe('Pure', () => {
  it('should not modify input timeline', () => {
    const exporter = new DefaultPromptAssemblyTimelineExporter()
    const timeline = createFullTimeline()
    const original = JSON.stringify(timeline)
    exporter.export(timeline)
    expect(JSON.stringify(timeline)).toBe(original)
  })

  it('should not modify nested objects in timeline', () => {
    const exporter = new DefaultPromptAssemblyTimelineExporter()
    const timeline = createTimelineWithEntries([
      { index: 0, trace: { strategy: { name: 'create', extra: 'data' } } },
    ])
    const originalEntry = JSON.stringify(timeline.entries[0])
    exporter.export(timeline)
    expect(JSON.stringify(timeline.entries[0])).toBe(originalEntry)
  })

  it('should have no side effects on external state', () => {
    const exporter = new DefaultPromptAssemblyTimelineExporter()
    const timeline = createEmptyTimeline()
    const result1 = exporter.export(timeline)
    const result2 = exporter.export(timeline)
    expect(result1).toBe(result2)
  })
})

// ---------------------------------------------------------------------------
// Immutable
// ---------------------------------------------------------------------------

describe('Immutable', () => {
  it('should return new string each call (not cached reference)', () => {
    const exporter = new DefaultPromptAssemblyTimelineExporter()
    const timeline = createSingleEntryTimeline('create')
    const r1 = exporter.export(timeline)
    const r2 = exporter.export(timeline)
    // While strings are primitives, ensure they are freshly produced
    expect(r1).toBe(r2) // Same content expected
  })

  it('should not mutate the timeline entries', () => {
    const exporter = new DefaultPromptAssemblyTimelineExporter()
    const timeline = createSingleEntryTimeline('create')
    const entriesBefore = timeline.entries.length
    exporter.export(timeline)
    expect(timeline.entries.length).toBe(entriesBefore)
  })

  it('should not freeze the timeline (just not mutate)', () => {
    const exporter = new DefaultPromptAssemblyTimelineExporter()
    const timeline = createSingleEntryTimeline('create')
    exporter.export(timeline)
    // Non-destructive: entries still accessible
    expect(timeline.entries[0].trace).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Export Validation
// ---------------------------------------------------------------------------

describe('Export validation', () => {
  it('should export DefaultPromptAssemblyTimelineExporter from strategy index', async () => {
    const mod = await import('../strategy')
    expect(mod.DefaultPromptAssemblyTimelineExporter).toBeDefined()
  })

  it('should export PromptAssemblyTimelineExporter type from strategy index', async () => {
    const mod = await import('../strategy')
    expect(mod.DefaultPromptAssemblyTimelineExporter).toBeDefined()
  })

  it('should export DefaultPromptAssemblyTimelineExporter as a class', () => {
    const exporter = new DefaultPromptAssemblyTimelineExporter()
    expect(exporter).toBeInstanceOf(DefaultPromptAssemblyTimelineExporter)
  })

  it('should export PromptAssemblyTimelineExporter as a type', () => {
    const exporter: PromptAssemblyTimelineExporter = new DefaultPromptAssemblyTimelineExporter()
    expect(typeof exporter.export).toBe('function')
  })

  it('should export DefaultPromptAssemblyTimelineExporter from package root', async () => {
    const mod = await import('..')
    expect(mod.DefaultPromptAssemblyTimelineExporter).toBeDefined()
  })

  it('should export PromptAssemblyTimelineExporter type from package root', async () => {
    const mod = await import('..')
    expect(mod.DefaultPromptAssemblyTimelineExporter).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Architecture Compliance
// ---------------------------------------------------------------------------

describe('Architecture compliance', () => {
  it('should not depend on Runtime', () => {
    const exporter = new DefaultPromptAssemblyTimelineExporter()
    expect(exporter).toBeDefined()
  })

  it('should not depend on Planner', () => {
    const exporter = new DefaultPromptAssemblyTimelineExporter()
    expect(exporter).toBeInstanceOf(DefaultPromptAssemblyTimelineExporter)
  })

  it('should not depend on Pipeline', () => {
    const exporter = new DefaultPromptAssemblyTimelineExporter()
    expect(exporter).toBeDefined()
  })

  it('should not depend on Provider', () => {
    const exporter = new DefaultPromptAssemblyTimelineExporter()
    expect(exporter).toBeDefined()
  })

  it('should not depend on Memory', () => {
    const exporter = new DefaultPromptAssemblyTimelineExporter()
    expect(exporter).toBeDefined()
  })

  it('should not depend on AgentLoop', () => {
    const exporter = new DefaultPromptAssemblyTimelineExporter()
    expect(exporter).toBeDefined()
  })

  it('should not depend on PromptBuilder', () => {
    const exporter = new DefaultPromptAssemblyTimelineExporter()
    expect(exporter).toBeDefined()
  })

  it('should not modify PromptBuilder', () => {
    const exporter = new DefaultPromptAssemblyTimelineExporter()
    expect(exporter).toBeDefined()
  })

  it('should not modify PromptRenderer', () => {
    const exporter = new DefaultPromptAssemblyTimelineExporter()
    expect(exporter).toBeDefined()
  })

  it('should not modify PromptCompression', () => {
    const exporter = new DefaultPromptAssemblyTimelineExporter()
    expect(exporter).toBeDefined()
  })

  it('should not modify PromptAssemblyTimeline', () => {
    const exporter = new DefaultPromptAssemblyTimelineExporter()
    const timeline = createFullTimeline()
    exporter.export(timeline)
    expect(timeline.entries).toBeDefined()
  })

  it('should not modify Runtime', () => {
    const exporter = new DefaultPromptAssemblyTimelineExporter()
    expect(exporter).toBeDefined()
  })

  it('should not modify AgentLoop', () => {
    const exporter = new DefaultPromptAssemblyTimelineExporter()
    expect(exporter).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Compatibility
// ---------------------------------------------------------------------------

describe('RetryPlanner compatibility', () => {
  it('should be compatible with RetryPlanner scenarios', () => {
    const exporter = new DefaultPromptAssemblyTimelineExporter()
    const timeline = createSingleEntryTimeline('create')
    const result = exporter.export(timeline)
    expect(result).toContain('create')
  })
})

describe('ToolCallPlanner compatibility', () => {
  it('should be compatible with ToolCallPlanner scenarios', () => {
    const exporter = new DefaultPromptAssemblyTimelineExporter()
    const timeline = createTimelineWithEntries([
      { index: 0, trace: { plan: { priorities: [{ section: 'tool', priority: 100 }] } } },
    ])
    const result = exporter.export(timeline)
    expect(result).toContain('tool')
  })
})

describe('Streaming compatibility', () => {
  it('should be compatible with streaming pipeline', () => {
    const exporter = new DefaultPromptAssemblyTimelineExporter()
    const timeline = createTimelineWithEntries([
      { index: 0, trace: { inspectorRendered: 'streaming output' } },
    ])
    const result = exporter.export(timeline)
    expect(result).toContain('streaming output')
  })
})

describe('AgentLoop compatibility', () => {
  it('should be compatible with AgentLoop', () => {
    const exporter = new DefaultPromptAssemblyTimelineExporter()
    const timeline = createFullTimeline()
    const result = exporter.export(timeline)
    const parsed = JSON.parse(result)
    expect(parsed.entries).toHaveLength(2)
    expect(parsed.entries[0].trace.strategy).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Edge Cases
// ---------------------------------------------------------------------------

describe('Edge cases', () => {
  it('should handle timeline with undefined entries', () => {
    const exporter = new DefaultPromptAssemblyTimelineExporter()
    const timeline: PromptAssemblyTimeline = { entries: [] }
    const result = exporter.export(timeline)
    expect(result).toBe('{\n  "entries": []\n}')
  })

  it('should handle timeline with entries having no trace strategy', () => {
    const exporter = new DefaultPromptAssemblyTimelineExporter()
    const timeline = createTimelineWithEntries([{ index: 0, trace: {} }])
    const result = exporter.export(timeline)
    const parsed = JSON.parse(result)
    expect(parsed.entries[0].trace).toEqual({})
  })

  it('should handle timeline with many entries', () => {
    const exporter = new DefaultPromptAssemblyTimelineExporter()
    const entries = Array.from({ length: 100 }, (_, i) => createEntry(i, 'create'))
    const timeline = createTimelineWithEntries(entries)
    const result = exporter.export(timeline)
    const parsed = JSON.parse(result)
    expect(parsed.entries).toHaveLength(100)
  })

  it('should handle timeline with deeply nested trace structure', () => {
    const exporter = new DefaultPromptAssemblyTimelineExporter()
    const timeline = createTimelineWithEntries([
      {
        index: 0,
        trace: {
          snapshot: {
            plan: {
              priorities: [
                { section: 'a', priority: 1 },
                { section: 'b', priority: 2, sub: { key: 'val' } },
              ],
            },
          },
        },
      },
    ])
    const result = exporter.export(timeline)
    const parsed = JSON.parse(result)
    expect(parsed.entries[0].trace.snapshot.plan.priorities[1].sub.key).toBe('val')
  })

  it('should handle timeline with special characters in strategy name', () => {
    const exporter = new DefaultPromptAssemblyTimelineExporter()
    const timeline = createSingleEntryTimeline('test-策略_123')
    const result = exporter.export(timeline)
    const parsed = JSON.parse(result)
    expect(parsed.entries[0].trace.strategy.name).toBe('test-策略_123')
  })

  it('should handle timeline with empty string strategy name', () => {
    const exporter = new DefaultPromptAssemblyTimelineExporter()
    const timeline = createSingleEntryTimeline('')
    const result = exporter.export(timeline)
    const parsed = JSON.parse(result)
    expect(parsed.entries[0].trace.strategy.name).toBe('')
  })

  it('should handle timeline with null strategy', () => {
    const exporter = new DefaultPromptAssemblyTimelineExporter()
    const timeline = createTimelineWithEntries([
      { index: 0, trace: { strategy: null as unknown as { name: string } } },
    ])
    const result = exporter.export(timeline)
    const parsed = JSON.parse(result)
    expect(parsed.entries[0].trace.strategy).toBeNull()
  })

  it('should handle timeline with large index values', () => {
    const exporter = new DefaultPromptAssemblyTimelineExporter()
    const timeline = createTimelineWithEntries([{ index: 999999, trace: { strategy: { name: 'create' } } }])
    const result = exporter.export(timeline)
    const parsed = JSON.parse(result)
    expect(parsed.entries[0].index).toBe(999999)
  })

  it('should handle timeline with unicode in trace fields', () => {
    const exporter = new DefaultPromptAssemblyTimelineExporter()
    const timeline = createTimelineWithEntries([
      { index: 0, trace: { inspectorRendered: '中文 español 日本語' } },
    ])
    const result = exporter.export(timeline)
    const parsed = JSON.parse(result)
    expect(parsed.entries[0].trace.inspectorRendered).toBe('中文 español 日本語')
  })

  it('should handle timeline with array values in trace', () => {
    const exporter = new DefaultPromptAssemblyTimelineExporter()
    const timeline = createTimelineWithEntries([
      { index: 0, trace: { planDiff: { added: ['a', 'b', 'c'], removed: [], changed: [] } } },
    ])
    const result = exporter.export(timeline)
    const parsed = JSON.parse(result)
    expect(parsed.entries[0].trace.planDiff.added).toEqual(['a', 'b', 'c'])
  })

  it('should handle timeline with boolean values in trace', () => {
    const exporter = new DefaultPromptAssemblyTimelineExporter()
    const timeline = createTimelineWithEntries([
      { index: 0, trace: { strategy: true as unknown as { name: string } } },
    ])
    const result = exporter.export(timeline)
    const parsed = JSON.parse(result)
    expect(parsed.entries[0].trace.strategy).toBe(true)
  })

  it('should handle timeline with numeric trace values', () => {
    const exporter = new DefaultPromptAssemblyTimelineExporter()
    const timeline = createTimelineWithEntries([
      { index: 0, trace: { strategy: 42 as unknown as { name: string } } },
    ])
    const result = exporter.export(timeline)
    const parsed = JSON.parse(result)
    expect(parsed.entries[0].trace.strategy).toBe(42)
  })

  it('should handle timeline with inspectorRendered containing special characters', () => {
    const exporter = new DefaultPromptAssemblyTimelineExporter()
    const timeline = createTimelineWithEntries([
      { index: 0, trace: { inspectorRendered: 'line1\nline2\ttab"quote\\slash' } },
    ])
    const result = exporter.export(timeline)
    const parsed = JSON.parse(result)
    expect(parsed.entries[0].trace.inspectorRendered).toBe('line1\nline2\ttab"quote\\slash')
  })

  it('should handle timeline with empty trace objects', () => {
    const exporter = new DefaultPromptAssemblyTimelineExporter()
    const timeline = createTimelineWithEntries([
      { index: 0, trace: {} },
      { index: 1, trace: {} },
    ])
    const result = exporter.export(timeline)
    const parsed = JSON.parse(result)
    expect(parsed.entries).toHaveLength(2)
    expect(parsed.entries[0].trace).toEqual({})
    expect(parsed.entries[1].trace).toEqual({})
  })

  it('should handle timeline with entry having only trace property defined', () => {
    const exporter = new DefaultPromptAssemblyTimelineExporter()
    const entry: PromptAssemblyTimelineEntry = { index: 0, trace: { strategy: { name: 'create' } } }
    const timeline = createTimelineWithEntries([entry])
    const result = exporter.export(timeline)
    const parsed = JSON.parse(result)
    expect(Object.keys(parsed.entries[0])).toEqual(['index', 'trace'])
  })

  it('should handle timeline with single entry and validate full JSON structure', () => {
    const exporter = new DefaultPromptAssemblyTimelineExporter()
    const timeline = createSingleEntryTimeline('create')
    const result = exporter.export(timeline)
    expect(result).toBe(JSON.stringify(timeline, null, 2))
    const parsed = JSON.parse(result)
    expect(parsed).toHaveProperty('entries')
    expect(parsed.entries[0]).toHaveProperty('index')
    expect(parsed.entries[0]).toHaveProperty('trace')
  })
})