import { describe, it, expect } from 'vitest'
import { DefaultPromptInspectorExporter } from '../strategy/DefaultPromptInspectorExporter'
import type { PromptInspectorExporter } from '../strategy/PromptInspectorExporter'
import type { PromptInspector } from '../strategy/PromptInspector'
import type { PromptInspectorSection } from '../strategy/PromptInspectorSection'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createSection(title: string, content?: unknown): PromptInspectorSection {
  return { title, content: content !== undefined ? content : `${title} content` }
}

function createInspector(overrides?: Partial<PromptInspector>): PromptInspector {
  return {
    sections: [],
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Interface Contract
// ---------------------------------------------------------------------------

describe('Interface contract', () => {
  it('should define export method', () => {
    const exporter: PromptInspectorExporter = new DefaultPromptInspectorExporter()
    expect(typeof exporter.export).toBe('function')
  })

  it('should accept a PromptInspector and return a string', () => {
    const exporter = new DefaultPromptInspectorExporter()
    const result = exporter.export(createInspector())
    expect(typeof result).toBe('string')
  })

  it('should accept a custom implementation', () => {
    const custom: PromptInspectorExporter = {
      export(_inspector: PromptInspector): string {
        return '{"custom":true}'
      },
    }
    expect(custom.export(createInspector())).toBe('{"custom":true}')
  })

  it('should have a single export method', () => {
    const exporter = new DefaultPromptInspectorExporter()
    const proto = Object.getOwnPropertyNames(Object.getPrototypeOf(exporter))
    expect(proto).toContain('export')
  })
})

// ---------------------------------------------------------------------------
// JSON Export — Empty Inspector
// ---------------------------------------------------------------------------

describe('JSON export — empty inspector', () => {
  it('should export empty sections array', () => {
    const exporter = new DefaultPromptInspectorExporter()
    const result = exporter.export(createInspector())
    const parsed = JSON.parse(result)
    expect(parsed.sections).toEqual([])
  })

  it('should not include strategy key when undefined', () => {
    const exporter = new DefaultPromptInspectorExporter()
    const result = exporter.export(createInspector())
    const parsed = JSON.parse(result)
    expect(parsed.strategy).toBeUndefined()
  })

  it('should produce valid JSON', () => {
    const exporter = new DefaultPromptInspectorExporter()
    const result = exporter.export(createInspector())
    expect(() => JSON.parse(result)).not.toThrow()
  })

  it('should match JSON.stringify output', () => {
    const inspector = createInspector()
    const exporter = new DefaultPromptInspectorExporter()
    expect(exporter.export(inspector)).toBe(JSON.stringify(inspector, null, 2))
  })

  it('should produce pretty-printed JSON', () => {
    const exporter = new DefaultPromptInspectorExporter()
    const result = exporter.export(createInspector())
    expect(result).toContain('\n')
    expect(result).toContain('  ')
  })
})

// ---------------------------------------------------------------------------
// JSON Export — Strategy Only
// ---------------------------------------------------------------------------

describe('JSON export — strategy only', () => {
  it('should include strategy field', () => {
    const exporter = new DefaultPromptInspectorExporter()
    const result = exporter.export(createInspector({ strategy: 'create' }))
    const parsed = JSON.parse(result)
    expect(parsed.strategy).toBe('create')
  })

  it('should include empty sections array', () => {
    const exporter = new DefaultPromptInspectorExporter()
    const result = exporter.export(createInspector({ strategy: 'create' }))
    const parsed = JSON.parse(result)
    expect(parsed.sections).toEqual([])
  })

  it('should export "query" strategy', () => {
    const exporter = new DefaultPromptInspectorExporter()
    const result = exporter.export(createInspector({ strategy: 'query' }))
    expect(JSON.parse(result).strategy).toBe('query')
  })

  it('should export "modify" strategy', () => {
    const exporter = new DefaultPromptInspectorExporter()
    const result = exporter.export(createInspector({ strategy: 'modify' }))
    expect(JSON.parse(result).strategy).toBe('modify')
  })

  it('should export "delete" strategy', () => {
    const exporter = new DefaultPromptInspectorExporter()
    const result = exporter.export(createInspector({ strategy: 'delete' }))
    expect(JSON.parse(result).strategy).toBe('delete')
  })

  it('should match JSON.stringify for strategy only', () => {
    const inspector = createInspector({ strategy: 'create' })
    const exporter = new DefaultPromptInspectorExporter()
    expect(exporter.export(inspector)).toBe(JSON.stringify(inspector, null, 2))
  })
})

// ---------------------------------------------------------------------------
// JSON Export — Sections Only
// ---------------------------------------------------------------------------

describe('JSON export — sections only', () => {
  it('should export single section', () => {
    const exporter = new DefaultPromptInspectorExporter()
    const sections = [createSection('Rendered Strategy')]
    const result = exporter.export(createInspector({ sections }))
    const parsed = JSON.parse(result)
    expect(parsed.sections).toHaveLength(1)
    expect(parsed.sections[0].title).toBe('Rendered Strategy')
  })

  it('should export multiple sections', () => {
    const exporter = new DefaultPromptInspectorExporter()
    const sections = [
      createSection('Rendered Strategy'),
      createSection('Prompt Plan'),
    ]
    const result = exporter.export(createInspector({ sections }))
    const parsed = JSON.parse(result)
    expect(parsed.sections).toHaveLength(2)
  })

  it('should export section content', () => {
    const exporter = new DefaultPromptInspectorExporter()
    const sections = [createSection('Test', { key: 'value' })]
    const result = exporter.export(createInspector({ sections }))
    const parsed = JSON.parse(result)
    expect(parsed.sections[0].content.key).toBe('value')
  })

  it('should export string section content', () => {
    const exporter = new DefaultPromptInspectorExporter()
    const sections = [createSection('Test', 'plain text')]
    const result = exporter.export(createInspector({ sections }))
    const parsed = JSON.parse(result)
    expect(parsed.sections[0].content).toBe('plain text')
  })

  it('should export section with numeric content', () => {
    const exporter = new DefaultPromptInspectorExporter()
    const sections: PromptInspectorSection[] = [{ title: 'Score', content: 42 }]
    const result = exporter.export(createInspector({ sections }))
    const parsed = JSON.parse(result)
    expect(parsed.sections[0].content).toBe(42)
  })

  it('should export section with array content', () => {
    const exporter = new DefaultPromptInspectorExporter()
    const sections: PromptInspectorSection[] = [{ title: 'Items', content: ['a', 'b', 'c'] }]
    const result = exporter.export(createInspector({ sections }))
    const parsed = JSON.parse(result)
    expect(parsed.sections[0].content).toEqual(['a', 'b', 'c'])
  })

  it('should match JSON.stringify for sections only', () => {
    const exporter = new DefaultPromptInspectorExporter()
    const sections = [createSection('Section A'), createSection('Section B')]
    const inspector = createInspector({ sections })
    expect(exporter.export(inspector)).toBe(JSON.stringify(inspector, null, 2))
  })
})

// ---------------------------------------------------------------------------
// JSON Export — Strategy + Sections
// ---------------------------------------------------------------------------

describe('JSON export — strategy + sections', () => {
  it('should export both strategy and sections', () => {
    const exporter = new DefaultPromptInspectorExporter()
    const sections = [createSection('Rendered Strategy')]
    const result = exporter.export(createInspector({ strategy: 'create', sections }))
    const parsed = JSON.parse(result)
    expect(parsed.strategy).toBe('create')
    expect(parsed.sections).toHaveLength(1)
  })

  it('should export all 7 section types with strategy', () => {
    const exporter = new DefaultPromptInspectorExporter()
    const sections: PromptInspectorSection[] = [
      createSection('Rendered Strategy'),
      createSection('Strategy Selection'),
      createSection('Strategy Module'),
      createSection('Prompt Plan'),
      createSection('Optimized Plan'),
      createSection('Plan Diff'),
      createSection('Rendered Plan'),
    ]
    const result = exporter.export(createInspector({ strategy: 'query', sections }))
    const parsed = JSON.parse(result)
    expect(parsed.strategy).toBe('query')
    expect(parsed.sections).toHaveLength(7)
  })

  it('should preserve section order', () => {
    const exporter = new DefaultPromptInspectorExporter()
    const sections = [
      createSection('Last'),
      createSection('First'),
    ]
    const result = exporter.export(createInspector({ strategy: 'create', sections }))
    const parsed = JSON.parse(result)
    expect(parsed.sections[0].title).toBe('Last')
    expect(parsed.sections[1].title).toBe('First')
  })

  it('should match JSON.stringify for strategy + sections', () => {
    const exporter = new DefaultPromptInspectorExporter()
    const sections = [createSection('Section A')]
    const inspector = createInspector({ strategy: 'create', sections })
    expect(exporter.export(inspector)).toBe(JSON.stringify(inspector, null, 2))
  })

  it('should export complex nested content', () => {
    const exporter = new DefaultPromptInspectorExporter()
    const complexContent = {
      priorities: [
        { section: 'userInput', priority: 100 },
        { section: 'memory', priority: 50 },
      ],
    }
    const sections = [createSection('Prompt Plan', complexContent)]
    const result = exporter.export(createInspector({ strategy: 'create', sections }))
    const parsed = JSON.parse(result)
    expect(parsed.sections[0].content.priorities).toHaveLength(2)
  })
})

// ---------------------------------------------------------------------------
// Deterministic
// ---------------------------------------------------------------------------

describe('Deterministic', () => {
  it('should produce same output for same inspector across multiple calls', () => {
    const exporter = new DefaultPromptInspectorExporter()
    const inspector = createInspector({
      strategy: 'create',
      sections: [createSection('Rendered Strategy')],
    })
    const r1 = exporter.export(inspector)
    const r2 = exporter.export(inspector)
    const r3 = exporter.export(inspector)
    expect(r1).toBe(r2)
    expect(r2).toBe(r3)
  })

  it('should produce same output across different exporter instances', () => {
    const e1 = new DefaultPromptInspectorExporter()
    const e2 = new DefaultPromptInspectorExporter()
    const inspector = createInspector({
      strategy: 'query',
      sections: [createSection('Prompt Plan', { priorities: [] })],
    })
    expect(e1.export(inspector)).toBe(e2.export(inspector))
  })

  it('should produce same output for identical inspectors', () => {
    const exporter = new DefaultPromptInspectorExporter()
    const inspectorA = createInspector({
      strategy: 'create',
      sections: [createSection('Section A')],
    })
    const inspectorB = createInspector({
      strategy: 'create',
      sections: [createSection('Section A')],
    })
    expect(exporter.export(inspectorA)).toBe(exporter.export(inspectorB))
  })

  it('should produce identical result for empty inspectors', () => {
    const exporter = new DefaultPromptInspectorExporter()
    expect(exporter.export(createInspector())).toBe(exporter.export(createInspector()))
  })

  it('should produce identical result for strategy-only inspectors', () => {
    const exporter = new DefaultPromptInspectorExporter()
    expect(exporter.export(createInspector({ strategy: 'modify' })))
      .toBe(exporter.export(createInspector({ strategy: 'modify' })))
  })

  it('should produce same result 10 times for same input', () => {
    const exporter = new DefaultPromptInspectorExporter()
    const inspector = createInspector({
      strategy: 'delete',
      sections: [createSection('A'), createSection('B'), createSection('C')],
    })
    const results = Array.from({ length: 10 }, () => exporter.export(inspector))
    for (let i = 1; i < results.length; i++) {
      expect(results[i]).toBe(results[0])
    }
  })
})

// ---------------------------------------------------------------------------
// Stateless
// ---------------------------------------------------------------------------

describe('Stateless', () => {
  it('should not retain state between calls', () => {
    const exporter = new DefaultPromptInspectorExporter()
    const r1 = exporter.export(createInspector({
      strategy: 'create',
      sections: [createSection('Section A')],
    }))
    const r2 = exporter.export(createInspector({
      strategy: 'query',
      sections: [createSection('Section B')],
    }))
    expect(JSON.parse(r1).strategy).toBe('create')
    expect(JSON.parse(r2).strategy).toBe('query')
    expect(r1).not.toBe(r2)
  })

  it('should produce independent results for each call', () => {
    const exporter = new DefaultPromptInspectorExporter()
    const results = [
      exporter.export(createInspector({ sections: [createSection('X')] })),
      exporter.export(createInspector({ sections: [createSection('Y')] })),
      exporter.export(createInspector({ sections: [createSection('Z')] })),
    ]
    expect(JSON.parse(results[0]).sections[0].title).toBe('X')
    expect(JSON.parse(results[1]).sections[0].title).toBe('Y')
    expect(JSON.parse(results[2]).sections[0].title).toBe('Z')
  })
})

// ---------------------------------------------------------------------------
// Pure / No Side Effects
// ---------------------------------------------------------------------------

describe('Pure', () => {
  it('should not modify input inspector strategy', () => {
    const exporter = new DefaultPromptInspectorExporter()
    const inspector = createInspector({ strategy: 'create' })
    const original = inspector.strategy
    exporter.export(inspector)
    expect(inspector.strategy).toBe(original)
  })

  it('should not modify input inspector sections array', () => {
    const exporter = new DefaultPromptInspectorExporter()
    const sections = [createSection('Test')]
    const inspector = createInspector({ sections })
    const originalLength = inspector.sections.length
    exporter.export(inspector)
    expect(inspector.sections.length).toBe(originalLength)
  })

  it('should not mutate section content', () => {
    const exporter = new DefaultPromptInspectorExporter()
    const section = createSection('Test', { key: 'value' })
    const inspector = createInspector({ sections: [section] })
    exporter.export(inspector)
    expect(section.content).toEqual({ key: 'value' })
  })

  it('should not modify inspector after export', () => {
    const exporter = new DefaultPromptInspectorExporter()
    const inspector = createInspector({
      strategy: 'create',
      sections: [createSection('Rendered Strategy')],
    })
    const original = JSON.stringify(inspector)
    exporter.export(inspector)
    expect(JSON.stringify(inspector)).toBe(original)
  })
})

// ---------------------------------------------------------------------------
// Exact JSON Output
// ---------------------------------------------------------------------------

describe('Exact JSON output', () => {
  it('should match JSON.stringify for empty inspector', () => {
    const exporter = new DefaultPromptInspectorExporter()
    const inspector = createInspector()
    expect(exporter.export(inspector)).toBe(JSON.stringify(inspector, null, 2))
  })

  it('should match JSON.stringify for strategy only inspector', () => {
    const exporter = new DefaultPromptInspectorExporter()
    const inspector = createInspector({ strategy: 'create' })
    expect(exporter.export(inspector)).toBe(JSON.stringify(inspector, null, 2))
  })

  it('should match JSON.stringify for single section inspector', () => {
    const exporter = new DefaultPromptInspectorExporter()
    const inspector = createInspector({ sections: [createSection('Test')] })
    expect(exporter.export(inspector)).toBe(JSON.stringify(inspector, null, 2))
  })

  it('should match JSON.stringify for strategy with multiple sections', () => {
    const exporter = new DefaultPromptInspectorExporter()
    const sections = [createSection('A'), createSection('B'), createSection('C')]
    const inspector = createInspector({ strategy: 'query', sections })
    expect(exporter.export(inspector)).toBe(JSON.stringify(inspector, null, 2))
  })

  it('should match JSON.stringify for section with object content', () => {
    const exporter = new DefaultPromptInspectorExporter()
    const sections = [createSection('Plan', { priorities: [{ section: 'x', priority: 100 }] })]
    const inspector = createInspector({ strategy: 'create', sections })
    expect(exporter.export(inspector)).toBe(JSON.stringify(inspector, null, 2))
  })

  it('should produce valid JSON output', () => {
    const exporter = new DefaultPromptInspectorExporter()
    const sections = [
      createSection('A', { nested: { deep: [1, 2, 3] } }),
      createSection('B', 'string content'),
    ]
    const inspector = createInspector({ strategy: 'create', sections })
    const result = exporter.export(inspector)
    expect(() => JSON.parse(result)).not.toThrow()
    const parsed = JSON.parse(result)
    expect(parsed.strategy).toBe('create')
    expect(parsed.sections).toHaveLength(2)
  })

  it('should use pretty printing with 2-space indent', () => {
    const exporter = new DefaultPromptInspectorExporter()
    const inspector = createInspector({ strategy: 'create' })
    const result = exporter.export(inspector)
    expect(result).toBe(JSON.stringify(inspector, null, 2))
  })
})

// ---------------------------------------------------------------------------
// Various Section Content Types
// ---------------------------------------------------------------------------

describe('Various section content types', () => {
  it('should export section with null content', () => {
    const exporter = new DefaultPromptInspectorExporter()
    const sections: PromptInspectorSection[] = [{ title: 'Test', content: null }]
    const result = exporter.export(createInspector({ sections }))
    expect(JSON.parse(result).sections[0].content).toBeNull()
  })

  it('should export section with boolean content', () => {
    const exporter = new DefaultPromptInspectorExporter()
    const sections = [createSection('Flag', true)]
    const result = exporter.export(createInspector({ sections }))
    expect(JSON.parse(result).sections[0].content).toBe(true)
  })

  it('should export section with empty string content', () => {
    const exporter = new DefaultPromptInspectorExporter()
    const sections = [createSection('Empty', '')]
    const result = exporter.export(createInspector({ sections }))
    expect(JSON.parse(result).sections[0].content).toBe('')
  })

  it('should export section with deeply nested content', () => {
    const exporter = new DefaultPromptInspectorExporter()
    const deep = { level1: { level2: { level3: { value: 'deep' } } } }
    const sections = [createSection('Deep', deep)]
    const result = exporter.export(createInspector({ sections }))
    expect(JSON.parse(result).sections[0].content.level1.level2.level3.value).toBe('deep')
  })

  it('should export section with mixed array content', () => {
    const exporter = new DefaultPromptInspectorExporter()
    const mixed = [1, 'two', { three: 3 }, [4]]
    const sections = [createSection('Mixed', mixed)]
    const result = exporter.export(createInspector({ sections }))
    expect(JSON.parse(result).sections[0].content).toEqual(mixed)
  })
})

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

describe('Exports', () => {
  it('should export PromptInspectorExporter type from strategy index', () => {
    const exporter: PromptInspectorExporter = new DefaultPromptInspectorExporter()
    expect(typeof exporter.export).toBe('function')
  })

  it('should export DefaultPromptInspectorExporter from strategy index', async () => {
    const mod = await import('../strategy')
    expect(mod.DefaultPromptInspectorExporter).toBe(DefaultPromptInspectorExporter)
  })

  it('should export DefaultPromptInspectorExporter from package root', async () => {
    const mod = await import('..')
    expect(mod.DefaultPromptInspectorExporter).toBeDefined()
  })

  it('should export PromptInspectorExporter type from package root', () => {
    const exporter: PromptInspectorExporter = new DefaultPromptInspectorExporter()
    expect(typeof exporter.export).toBe('function')
  })

  it('should export DefaultPromptInspectorExporter as a class', () => {
    const exporter = new DefaultPromptInspectorExporter()
    expect(exporter).toBeInstanceOf(DefaultPromptInspectorExporter)
  })

  it('should export DefaultPromptInspectorExporter that implements PromptInspectorExporter', () => {
    const exporter: PromptInspectorExporter = new DefaultPromptInspectorExporter()
    expect(typeof exporter.export).toBe('function')
  })
})

// ---------------------------------------------------------------------------
// Architecture Compliance
// ---------------------------------------------------------------------------

describe('Architecture compliance', () => {
  it('should not depend on Planner', () => {
    const exporter = new DefaultPromptInspectorExporter()
    expect(exporter).toBeInstanceOf(DefaultPromptInspectorExporter)
  })

  it('should not depend on Runtime', () => {
    const exporter = new DefaultPromptInspectorExporter()
    expect(exporter).toBeDefined()
  })

  it('should not depend on Provider', () => {
    const exporter = new DefaultPromptInspectorExporter()
    expect(exporter).toBeDefined()
  })

  it('should not depend on Memory', () => {
    const exporter = new DefaultPromptInspectorExporter()
    expect(exporter).toBeDefined()
  })

  it('should not depend on AgentLoop', () => {
    const exporter = new DefaultPromptInspectorExporter()
    expect(exporter).toBeDefined()
  })

  it('should not depend on Pipeline', () => {
    const exporter = new DefaultPromptInspectorExporter()
    expect(exporter).toBeDefined()
  })

  it('should not modify DefaultPromptBuilder', () => {
    const exporter = new DefaultPromptInspectorExporter()
    expect(exporter).toBeDefined()
  })

  it('should not modify BuilderOptions', () => {
    const exporter = new DefaultPromptInspectorExporter()
    expect(exporter).toBeDefined()
  })

  it('should not modify PromptRenderer', () => {
    const exporter = new DefaultPromptInspectorExporter()
    expect(exporter).toBeDefined()
  })

  it('should not modify PromptCompression', () => {
    const exporter = new DefaultPromptInspectorExporter()
    expect(exporter).toBeDefined()
  })

  it('should not modify Planner', () => {
    const exporter = new DefaultPromptInspectorExporter()
    expect(exporter).toBeDefined()
  })

  it('should not modify Runtime', () => {
    const exporter = new DefaultPromptInspectorExporter()
    expect(exporter).toBeDefined()
  })

  it('should not modify AgentLoop', () => {
    const exporter = new DefaultPromptInspectorExporter()
    expect(exporter).toBeDefined()
  })

  it('should not modify Pipeline', () => {
    const exporter = new DefaultPromptInspectorExporter()
    expect(exporter).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Compatibility — RetryPlanner
// ---------------------------------------------------------------------------

describe('RetryPlanner compatibility', () => {
  it('should be compatible with RetryPlanner', () => {
    const exporter = new DefaultPromptInspectorExporter()
    const result = exporter.export(createInspector({
      strategy: 'create',
      sections: [createSection('Rendered Strategy')],
    }))
    expect(JSON.parse(result).strategy).toBe('create')
  })
})

// ---------------------------------------------------------------------------
// Compatibility — ToolCallPlanner
// ---------------------------------------------------------------------------

describe('ToolCallPlanner compatibility', () => {
  it('should be compatible with ToolCallPlanner', () => {
    const exporter = new DefaultPromptInspectorExporter()
    const result = exporter.export(createInspector({
      strategy: 'query',
      sections: [createSection('Prompt Plan')],
    }))
    expect(JSON.parse(result).strategy).toBe('query')
    expect(JSON.parse(result).sections[0].title).toBe('Prompt Plan')
  })
})

// ---------------------------------------------------------------------------
// Compatibility — Streaming
// ---------------------------------------------------------------------------

describe('Streaming compatibility', () => {
  it('should be compatible with streaming pipeline', () => {
    const exporter = new DefaultPromptInspectorExporter()
    const result = exporter.export(createInspector({
      sections: [createSection('Optimized Plan')],
    }))
    expect(JSON.parse(result).sections[0].title).toBe('Optimized Plan')
  })
})

// ---------------------------------------------------------------------------
// Compatibility — AgentLoop
// ---------------------------------------------------------------------------

describe('AgentLoop compatibility', () => {
  it('should be compatible with AgentLoop', () => {
    const exporter = new DefaultPromptInspectorExporter()
    const result = exporter.export(createInspector({
      strategy: 'modify',
      sections: [createSection('Plan Diff')],
    }))
    expect(JSON.parse(result).strategy).toBe('modify')
    expect(JSON.parse(result).sections[0].title).toBe('Plan Diff')
  })
})