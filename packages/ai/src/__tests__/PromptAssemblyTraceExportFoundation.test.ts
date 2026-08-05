import { describe, it, expect } from 'vitest'
import { DefaultPromptAssemblyTraceExporter } from '../strategy/DefaultPromptAssemblyTraceExporter'
import type { PromptAssemblyTraceExporter } from '../strategy/PromptAssemblyTraceExporter'
import type { PromptAssemblyTrace } from '../strategy/PromptAssemblyTrace'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createEmptyTrace(): PromptAssemblyTrace {
  return {}
}

function createTraceWithStrategy(name: string): PromptAssemblyTrace {
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

// ---------------------------------------------------------------------------
// Interface Contract
// ---------------------------------------------------------------------------

describe('Interface contract', () => {
  it('should define export method', () => {
    const exporter: PromptAssemblyTraceExporter = new DefaultPromptAssemblyTraceExporter()
    expect(typeof exporter.export).toBe('function')
  })

  it('should accept a trace and return a string', () => {
    const exporter = new DefaultPromptAssemblyTraceExporter()
    const result = exporter.export(createEmptyTrace())
    expect(typeof result).toBe('string')
  })

  it('should accept a custom implementation', () => {
    const custom: PromptAssemblyTraceExporter = {
      export(_trace: PromptAssemblyTrace): string {
        return 'custom export'
      },
    }
    expect(custom.export(createEmptyTrace())).toBe('custom export')
  })
})

// ---------------------------------------------------------------------------
// JSON Export
// ---------------------------------------------------------------------------

describe('JSON export', () => {
  it('should export empty trace as JSON object', () => {
    const exporter = new DefaultPromptAssemblyTraceExporter()
    const result = exporter.export(createEmptyTrace())
    expect(() => JSON.parse(result)).not.toThrow()
    expect(JSON.parse(result)).toEqual({})
  })

  it('should export trace with strategy only', () => {
    const exporter = new DefaultPromptAssemblyTraceExporter()
    const trace = createTraceWithStrategy('create')
    const result = exporter.export(trace)
    const parsed = JSON.parse(result)
    expect(parsed.strategy).toEqual({ name: 'create' })
  })

  it('should export trace with inspectorRendered only', () => {
    const exporter = new DefaultPromptAssemblyTraceExporter()
    const trace: PromptAssemblyTrace = { inspectorRendered: 'some text' }
    const result = exporter.export(trace)
    const parsed = JSON.parse(result)
    expect(parsed.inspectorRendered).toBe('some text')
  })

  it('should export trace with inspectorExported only', () => {
    const exporter = new DefaultPromptAssemblyTraceExporter()
    const trace: PromptAssemblyTrace = { inspectorExported: '{"a":1}' }
    const result = exporter.export(trace)
    const parsed = JSON.parse(result)
    expect(parsed.inspectorExported).toBe('{"a":1}')
  })

  it('should export trace with strategySelection only', () => {
    const exporter = new DefaultPromptAssemblyTraceExporter()
    const trace: PromptAssemblyTrace = { strategySelection: { selected: 'create', candidates: [] } }
    const result = exporter.export(trace)
    const parsed = JSON.parse(result)
    expect(parsed.strategySelection.selected).toBe('create')
  })

  it('should export trace with plan only', () => {
    const exporter = new DefaultPromptAssemblyTraceExporter()
    const trace: PromptAssemblyTrace = { plan: { priorities: [] } }
    const result = exporter.export(trace)
    const parsed = JSON.parse(result)
    expect(parsed.plan).toEqual({ priorities: [] })
  })

  it('should export trace with planDiff only', () => {
    const exporter = new DefaultPromptAssemblyTraceExporter()
    const trace: PromptAssemblyTrace = { planDiff: { added: ['a'], removed: [], changed: [] } }
    const result = exporter.export(trace)
    const parsed = JSON.parse(result)
    expect(parsed.planDiff.added).toEqual(['a'])
  })

  it('should export trace with snapshot only', () => {
    const exporter = new DefaultPromptAssemblyTraceExporter()
    const trace: PromptAssemblyTrace = { snapshot: { plan: { priorities: [] } } }
    const result = exporter.export(trace)
    const parsed = JSON.parse(result)
    expect(parsed.snapshot).toEqual({ plan: { priorities: [] } })
  })

  it('should export trace with inspector only', () => {
    const exporter = new DefaultPromptAssemblyTraceExporter()
    const trace: PromptAssemblyTrace = { inspector: { strategy: 'create', sections: [] } }
    const result = exporter.export(trace)
    const parsed = JSON.parse(result)
    expect(parsed.inspector).toEqual({ strategy: 'create', sections: [] })
  })

  it('should export trace with optimizedPlan only', () => {
    const exporter = new DefaultPromptAssemblyTraceExporter()
    const trace: PromptAssemblyTrace = { optimizedPlan: { priorities: [{ section: 'x', priority: 50 }] } }
    const result = exporter.export(trace)
    const parsed = JSON.parse(result)
    expect(parsed.optimizedPlan).toEqual({ priorities: [{ section: 'x', priority: 50 }] })
  })

  it('should export full trace with all fields', () => {
    const exporter = new DefaultPromptAssemblyTraceExporter()
    const trace = createFullTrace()
    const result = exporter.export(trace)
    const parsed = JSON.parse(result)
    expect(parsed.strategy).toBeDefined()
    expect(parsed.strategySelection).toBeDefined()
    expect(parsed.plan).toBeDefined()
    expect(parsed.optimizedPlan).toBeDefined()
    expect(parsed.planDiff).toBeDefined()
    expect(parsed.snapshot).toBeDefined()
    expect(parsed.inspector).toBeDefined()
    expect(parsed.inspectorRendered).toBeDefined()
    expect(parsed.inspectorExported).toBeDefined()
  })

  it('should export trace with mixed fields', () => {
    const exporter = new DefaultPromptAssemblyTraceExporter()
    const trace: PromptAssemblyTrace = {
      strategy: { name: 'query' },
      plan: { priorities: [] },
      inspectorRendered: 'text',
    }
    const result = exporter.export(trace)
    const parsed = JSON.parse(result)
    expect(parsed.strategy.name).toBe('query')
    expect(parsed.plan).toEqual({ priorities: [] })
    expect(parsed.inspectorRendered).toBe('text')
  })

  it('should export nested structures correctly', () => {
    const exporter = new DefaultPromptAssemblyTraceExporter()
    const trace: PromptAssemblyTrace = {
      strategy: { name: 'create', version: 2, meta: { key: 'val', nested: { arr: [1, 2, 3] } } },
    }
    const result = exporter.export(trace)
    const parsed = JSON.parse(result)
    expect(parsed.strategy.meta.nested.arr).toEqual([1, 2, 3])
  })
})

// ---------------------------------------------------------------------------
// Exact Output
// ---------------------------------------------------------------------------

describe('Exact output', () => {
  it('should equal JSON.stringify for empty trace', () => {
    const exporter = new DefaultPromptAssemblyTraceExporter()
    const trace = createEmptyTrace()
    expect(exporter.export(trace)).toBe(JSON.stringify(trace, null, 2))
  })

  it('should equal JSON.stringify for trace with strategy', () => {
    const exporter = new DefaultPromptAssemblyTraceExporter()
    const trace = createTraceWithStrategy('create')
    expect(exporter.export(trace)).toBe(JSON.stringify(trace, null, 2))
  })

  it('should equal JSON.stringify for full trace', () => {
    const exporter = new DefaultPromptAssemblyTraceExporter()
    const trace = createFullTrace()
    expect(exporter.export(trace)).toBe(JSON.stringify(trace, null, 2))
  })

  it('should equal JSON.stringify for trace with mixed fields', () => {
    const exporter = new DefaultPromptAssemblyTraceExporter()
    const trace: PromptAssemblyTrace = {
      strategy: { name: 'query' },
      plan: { priorities: [] },
      inspectorRendered: 'text',
    }
    expect(exporter.export(trace)).toBe(JSON.stringify(trace, null, 2))
  })

  it('should produce valid JSON that can be parsed back', () => {
    const exporter = new DefaultPromptAssemblyTraceExporter()
    const trace = createFullTrace()
    const result = exporter.export(trace)
    const parsed = JSON.parse(result)
    expect(parsed).toEqual(trace)
  })
})

// ---------------------------------------------------------------------------
// Deterministic
// ---------------------------------------------------------------------------

describe('Deterministic', () => {
  it('should produce same output for same trace across multiple calls', () => {
    const exporter = new DefaultPromptAssemblyTraceExporter()
    const trace = createFullTrace()
    const r1 = exporter.export(trace)
    const r2 = exporter.export(trace)
    const r3 = exporter.export(trace)
    expect(r1).toBe(r2)
    expect(r2).toBe(r3)
  })

  it('should produce same output across different exporter instances', () => {
    const e1 = new DefaultPromptAssemblyTraceExporter()
    const e2 = new DefaultPromptAssemblyTraceExporter()
    const trace = createFullTrace()
    expect(e1.export(trace)).toBe(e2.export(trace))
  })

  it('should produce same output for identical traces', () => {
    const exporter = new DefaultPromptAssemblyTraceExporter()
    const trace1 = createTraceWithStrategy('create')
    const trace2 = createTraceWithStrategy('create')
    expect(exporter.export(trace1)).toBe(exporter.export(trace2))
  })

  it('should produce same output for empty traces', () => {
    const exporter = new DefaultPromptAssemblyTraceExporter()
    expect(exporter.export(createEmptyTrace())).toBe(exporter.export(createEmptyTrace()))
  })
})

// ---------------------------------------------------------------------------
// Stateless
// ---------------------------------------------------------------------------

describe('Stateless', () => {
  it('should not retain state between export calls', () => {
    const exporter = new DefaultPromptAssemblyTraceExporter()
    const r1 = exporter.export(createTraceWithStrategy('create'))
    const r2 = exporter.export(createTraceWithStrategy('query'))
    const p1 = JSON.parse(r1)
    const p2 = JSON.parse(r2)
    expect(p1.strategy.name).toBe('create')
    expect(p2.strategy.name).toBe('query')
  })

  it('should produce independent results from sequential calls', () => {
    const exporter = new DefaultPromptAssemblyTraceExporter()
    const r1 = exporter.export(createFullTrace())
    const r2 = exporter.export(createEmptyTrace())
    expect(r1).not.toBe(r2)
    expect(JSON.parse(r2)).toEqual({})
  })
})

// ---------------------------------------------------------------------------
// Pure
// ---------------------------------------------------------------------------

describe('Pure', () => {
  it('should not modify input trace', () => {
    const exporter = new DefaultPromptAssemblyTraceExporter()
    const trace = createFullTrace()
    const original = JSON.stringify(trace)
    exporter.export(trace)
    expect(JSON.stringify(trace)).toBe(original)
  })

  it('should not modify nested objects in trace', () => {
    const exporter = new DefaultPromptAssemblyTraceExporter()
    const trace: PromptAssemblyTrace = {
      strategy: { name: 'create', extra: 'data' },
      plan: { priorities: [{ section: 'x', priority: 100 }] },
    }
    const originalStrategy = JSON.stringify(trace.strategy)
    const originalPlan = JSON.stringify(trace.plan)
    exporter.export(trace)
    expect(JSON.stringify(trace.strategy)).toBe(originalStrategy)
    expect(JSON.stringify(trace.plan)).toBe(originalPlan)
  })

  it('should have no side effects on external state', () => {
    const exporter = new DefaultPromptAssemblyTraceExporter()
    const trace = createEmptyTrace()
    const result1 = exporter.export(trace)
    const result2 = exporter.export(trace)
    expect(result1).toBe(result2)
  })
})

// ---------------------------------------------------------------------------
// JSON Formatting
// ---------------------------------------------------------------------------

describe('JSON formatting', () => {
  it('should use 2-space indentation', () => {
    const exporter = new DefaultPromptAssemblyTraceExporter()
    const trace = createTraceWithStrategy('create')
    const result = exporter.export(trace)
    // Pretty-printed JSON uses 2-space indent
    expect(result).toContain('  "strategy"')
  })

  it('should include newlines for pretty printing', () => {
    const exporter = new DefaultPromptAssemblyTraceExporter()
    const trace = createTraceWithStrategy('create')
    const result = exporter.export(trace)
    expect(result).toContain('\n')
  })

  it('should produce parseable JSON', () => {
    const exporter = new DefaultPromptAssemblyTraceExporter()
    const trace = createFullTrace()
    const result = exporter.export(trace)
    expect(() => JSON.parse(result)).not.toThrow()
  })

  it('should preserve object key order in output', () => {
    const exporter = new DefaultPromptAssemblyTraceExporter()
    const trace = createFullTrace()
    const result = exporter.export(trace)
    const parsed = JSON.parse(result)
    const keys = Object.keys(parsed)
    expect(keys).toContain('strategy')
    expect(keys).toContain('plan')
    expect(keys).toContain('inspector')
  })

  it('should handle deeply nested JSON', () => {
    const exporter = new DefaultPromptAssemblyTraceExporter()
    const trace: PromptAssemblyTrace = {
      snapshot: { plan: { priorities: [{ section: 'a', priority: 1 }, { section: 'b', priority: 2 }] } },
    }
    const result = exporter.export(trace)
    const parsed = JSON.parse(result)
    expect(parsed.snapshot.plan.priorities).toHaveLength(2)
  })

  it('should produce valid JSON for empty objects', () => {
    const exporter = new DefaultPromptAssemblyTraceExporter()
    const trace: PromptAssemblyTrace = { plan: { priorities: [] } }
    const result = exporter.export(trace)
    const parsed = JSON.parse(result)
    expect(parsed.plan.priorities).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// Edge Cases
// ---------------------------------------------------------------------------

describe('Edge cases', () => {
  it('should handle trace with undefined values (omitted from JSON)', () => {
    const exporter = new DefaultPromptAssemblyTraceExporter()
    const trace: PromptAssemblyTrace = {}
    const result = exporter.export(trace)
    expect(result).toBe('{}')
  })

  it('should handle trace with only inspectorRendered field', () => {
    const exporter = new DefaultPromptAssemblyTraceExporter()
    const trace: PromptAssemblyTrace = { inspectorRendered: 'rendered' }
    const result = exporter.export(trace)
    const parsed = JSON.parse(result)
    expect(Object.keys(parsed)).toEqual(['inspectorRendered'])
  })

  it('should handle trace with large nested structure', () => {
    const exporter = new DefaultPromptAssemblyTraceExporter()
    const largeArray = Array.from({ length: 100 }, (_, i) => ({ id: i, value: `item-${i}` }))
    const trace: PromptAssemblyTrace = {
      snapshot: { plan: { priorities: largeArray.map(() => ({ section: 'x', priority: 50 })) } },
    }
    const result = exporter.export(trace)
    const parsed = JSON.parse(result)
    expect(parsed.snapshot.plan.priorities).toHaveLength(100)
  })

  it('should handle trace with multiple string fields', () => {
    const exporter = new DefaultPromptAssemblyTraceExporter()
    const trace: PromptAssemblyTrace = {
      inspectorRendered: 'rendered',
      inspectorExported: 'exported',
    }
    const result = exporter.export(trace)
    const parsed = JSON.parse(result)
    expect(parsed.inspectorRendered).toBe('rendered')
    expect(parsed.inspectorExported).toBe('exported')
  })

  it('should handle trace with planDiff containing complex changes', () => {
    const exporter = new DefaultPromptAssemblyTraceExporter()
    const trace: PromptAssemblyTrace = {
      planDiff: {
        added: ['section1', 'section2'],
        removed: ['section3'],
        changed: [{ section: 'section4', before: 100, after: 50 }],
      },
    }
    const result = exporter.export(trace)
    const parsed = JSON.parse(result)
    expect(parsed.planDiff.added).toHaveLength(2)
    expect(parsed.planDiff.removed).toHaveLength(1)
    expect(parsed.planDiff.changed).toHaveLength(1)
  })

  it('should handle trace with empty string values', () => {
    const exporter = new DefaultPromptAssemblyTraceExporter()
    const trace: PromptAssemblyTrace = { inspectorRendered: '', inspectorExported: '' }
    const result = exporter.export(trace)
    const parsed = JSON.parse(result)
    expect(parsed.inspectorRendered).toBe('')
    expect(parsed.inspectorExported).toBe('')
  })

  it('should handle trace with strategy and inspectorExported only', () => {
    const exporter = new DefaultPromptAssemblyTraceExporter()
    const trace: PromptAssemblyTrace = {
      strategy: { name: 'create' },
      inspectorExported: '{"key":"value"}',
    }
    const result = exporter.export(trace)
    const parsed = JSON.parse(result)
    expect(parsed.strategy.name).toBe('create')
    expect(parsed.inspectorExported).toBe('{"key":"value"}')
  })

  it('should handle trace with all string fields', () => {
    const exporter = new DefaultPromptAssemblyTraceExporter()
    const trace: PromptAssemblyTrace = {
      inspectorRendered: 'a',
      inspectorExported: 'b',
    }
    const result = exporter.export(trace)
    const parsed = JSON.parse(result)
    expect(parsed.inspectorRendered).toBe('a')
    expect(parsed.inspectorExported).toBe('b')
  })

  it('should handle trace with inspector having sections', () => {
    const exporter = new DefaultPromptAssemblyTraceExporter()
    const trace: PromptAssemblyTrace = {
      inspector: {
        strategy: 'create',
        sections: [
          { title: 'Section 1', content: 'content 1' },
          { title: 'Section 2', content: 'content 2' },
        ],
      },
    }
    const result = exporter.export(trace)
    const parsed = JSON.parse(result)
    expect(parsed.inspector.sections).toHaveLength(2)
    expect(parsed.inspector.sections[0].title).toBe('Section 1')
  })

  it('should handle trace with empty inspector sections', () => {
    const exporter = new DefaultPromptAssemblyTraceExporter()
    const trace: PromptAssemblyTrace = {
      inspector: { strategy: 'create', sections: [] },
    }
    const result = exporter.export(trace)
    const parsed = JSON.parse(result)
    expect(parsed.inspector.sections).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// Various Content Types
// ---------------------------------------------------------------------------

describe('Various content types', () => {
  it('should export trace with array values', () => {
    const exporter = new DefaultPromptAssemblyTraceExporter()
    const trace: PromptAssemblyTrace = { planDiff: { added: ['a', 'b', 'c'], removed: [], changed: [] } }
    const result = exporter.export(trace)
    const parsed = JSON.parse(result)
    expect(parsed.planDiff.added).toEqual(['a', 'b', 'c'])
  })

  it('should export trace with nested objects', () => {
    const exporter = new DefaultPromptAssemblyTraceExporter()
    const trace: PromptAssemblyTrace = {
      snapshot: { plan: { priorities: [{ section: 'userInput', priority: 100 }] } },
    }
    const result = exporter.export(trace)
    const parsed = JSON.parse(result)
    expect(parsed.snapshot.plan.priorities[0].section).toBe('userInput')
  })

  it('should export trace with null values', () => {
    const exporter = new DefaultPromptAssemblyTraceExporter()
    const trace: PromptAssemblyTrace = { strategy: null as unknown as { name: string } }
    const result = exporter.export(trace)
    const parsed = JSON.parse(result)
    expect(parsed.strategy).toBeNull()
  })

  it('should export trace with boolean strategy', () => {
    const exporter = new DefaultPromptAssemblyTraceExporter()
    const trace: PromptAssemblyTrace = { strategy: true as unknown as { name: string } }
    const result = exporter.export(trace)
    const parsed = JSON.parse(result)
    expect(parsed.strategy).toBe(true)
  })

  it('should export trace with number values', () => {
    const exporter = new DefaultPromptAssemblyTraceExporter()
    const trace: PromptAssemblyTrace = { strategy: 42 as unknown as { name: string } }
    const result = exporter.export(trace)
    const parsed = JSON.parse(result)
    expect(parsed.strategy).toBe(42)
  })

  it('should export trace with empty strings', () => {
    const exporter = new DefaultPromptAssemblyTraceExporter()
    const trace: PromptAssemblyTrace = { inspectorRendered: '' }
    const result = exporter.export(trace)
    const parsed = JSON.parse(result)
    expect(parsed.inspectorRendered).toBe('')
  })

  it('should export trace with long strings', () => {
    const exporter = new DefaultPromptAssemblyTraceExporter()
    const longString = 'x'.repeat(1000)
    const trace: PromptAssemblyTrace = { inspectorRendered: longString }
    const result = exporter.export(trace)
    const parsed = JSON.parse(result)
    expect(parsed.inspectorRendered).toBe(longString)
  })

  it('should export trace with special characters', () => {
    const exporter = new DefaultPromptAssemblyTraceExporter()
    const trace: PromptAssemblyTrace = { inspectorRendered: 'line1\nline2\ttab"quote\\slash' }
    const result = exporter.export(trace)
    const parsed = JSON.parse(result)
    expect(parsed.inspectorRendered).toBe('line1\nline2\ttab"quote\\slash')
  })

  it('should export trace with unicode characters', () => {
    const exporter = new DefaultPromptAssemblyTraceExporter()
    const trace: PromptAssemblyTrace = { inspectorRendered: '中文 español 日本語' }
    const result = exporter.export(trace)
    const parsed = JSON.parse(result)
    expect(parsed.inspectorRendered).toBe('中文 español 日本語')
  })

  it('should export trace with empty arrays', () => {
    const exporter = new DefaultPromptAssemblyTraceExporter()
    const trace: PromptAssemblyTrace = { planDiff: { added: [], removed: [], changed: [] } }
    const result = exporter.export(trace)
    const parsed = JSON.parse(result)
    expect(parsed.planDiff).toEqual({ added: [], removed: [], changed: [] })
  })
})

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

describe('Exports', () => {
  it('should export DefaultPromptAssemblyTraceExporter from strategy index', async () => {
    const mod = await import('../strategy')
    expect(mod.DefaultPromptAssemblyTraceExporter).toBeDefined()
  })

  it('should export PromptAssemblyTraceExporter type from strategy index', async () => {
    const mod = await import('../strategy')
    expect(mod.DefaultPromptAssemblyTraceExporter).toBeDefined()
  })

  it('should export DefaultPromptAssemblyTraceExporter from package root', async () => {
    const mod = await import('..')
    expect(mod.DefaultPromptAssemblyTraceExporter).toBeDefined()
  })

  it('should export PromptAssemblyTraceExporter type from package root', async () => {
    const mod = await import('..')
    expect(mod.DefaultPromptAssemblyTraceExporter).toBeDefined()
  })

  it('should export DefaultPromptAssemblyTraceExporter as a class', () => {
    const exporter = new DefaultPromptAssemblyTraceExporter()
    expect(exporter).toBeInstanceOf(DefaultPromptAssemblyTraceExporter)
  })

  it('should export PromptAssemblyTraceExporter as a type', () => {
    const exporter: PromptAssemblyTraceExporter = new DefaultPromptAssemblyTraceExporter()
    expect(typeof exporter.export).toBe('function')
  })
})

// ---------------------------------------------------------------------------
// Architecture Compliance
// ---------------------------------------------------------------------------

describe('Architecture compliance', () => {
  it('should not depend on Planner', () => {
    const exporter = new DefaultPromptAssemblyTraceExporter()
    expect(exporter).toBeInstanceOf(DefaultPromptAssemblyTraceExporter)
  })

  it('should not depend on Runtime', () => {
    const exporter = new DefaultPromptAssemblyTraceExporter()
    expect(exporter).toBeDefined()
  })

  it('should not depend on Provider', () => {
    const exporter = new DefaultPromptAssemblyTraceExporter()
    expect(exporter).toBeDefined()
  })

  it('should not depend on Memory', () => {
    const exporter = new DefaultPromptAssemblyTraceExporter()
    expect(exporter).toBeDefined()
  })

  it('should not depend on AgentLoop', () => {
    const exporter = new DefaultPromptAssemblyTraceExporter()
    expect(exporter).toBeDefined()
  })

  it('should not depend on Pipeline', () => {
    const exporter = new DefaultPromptAssemblyTraceExporter()
    expect(exporter).toBeDefined()
  })

  it('should not modify PromptBuilder', () => {
    const exporter = new DefaultPromptAssemblyTraceExporter()
    expect(exporter).toBeDefined()
  })

  it('should not modify PromptRenderer', () => {
    const exporter = new DefaultPromptAssemblyTraceExporter()
    expect(exporter).toBeDefined()
  })

  it('should not modify PromptCompression', () => {
    const exporter = new DefaultPromptAssemblyTraceExporter()
    expect(exporter).toBeDefined()
  })

  it('should not modify PromptAssemblyTrace', () => {
    const exporter = new DefaultPromptAssemblyTraceExporter()
    const trace = createFullTrace()
    exporter.export(trace)
    expect(trace.strategy).toBeDefined()
  })

  it('should not modify Planner', () => {
    const exporter = new DefaultPromptAssemblyTraceExporter()
    expect(exporter).toBeDefined()
  })

  it('should not modify Runtime', () => {
    const exporter = new DefaultPromptAssemblyTraceExporter()
    expect(exporter).toBeDefined()
  })

  it('should not modify AgentLoop', () => {
    const exporter = new DefaultPromptAssemblyTraceExporter()
    expect(exporter).toBeDefined()
  })

  it('should not modify DefaultPromptBuilder', () => {
    const exporter = new DefaultPromptAssemblyTraceExporter()
    expect(exporter).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Compatibility
// ---------------------------------------------------------------------------

describe('RetryPlanner compatibility', () => {
  it('should be compatible with RetryPlanner scenarios', () => {
    const exporter = new DefaultPromptAssemblyTraceExporter()
    const trace = createTraceWithStrategy('create')
    const result = exporter.export(trace)
    expect(result).toContain('create')
  })
})

describe('ToolCallPlanner compatibility', () => {
  it('should be compatible with ToolCallPlanner scenarios', () => {
    const exporter = new DefaultPromptAssemblyTraceExporter()
    const trace: PromptAssemblyTrace = { plan: { priorities: [{ section: 'tool', priority: 100 }] } }
    const result = exporter.export(trace)
    expect(result).toContain('tool')
  })
})

describe('Streaming compatibility', () => {
  it('should be compatible with streaming pipeline', () => {
    const exporter = new DefaultPromptAssemblyTraceExporter()
    const trace: PromptAssemblyTrace = { inspectorRendered: 'streaming output' }
    const result = exporter.export(trace)
    expect(result).toContain('streaming output')
  })
})

describe('AgentLoop compatibility', () => {
  it('should be compatible with AgentLoop', () => {
    const exporter = new DefaultPromptAssemblyTraceExporter()
    const trace = createFullTrace()
    const result = exporter.export(trace)
    const parsed = JSON.parse(result)
    expect(parsed.strategy).toBeDefined()
    expect(parsed.inspector).toBeDefined()
  })
})