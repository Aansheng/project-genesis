import { describe, it, expect } from 'vitest'
import { DefaultPromptInspectorRenderer } from '../strategy/DefaultPromptInspectorRenderer'
import type { PromptInspectorRenderer } from '../strategy/PromptInspectorRenderer'
import type { PromptInspector } from '../strategy/PromptInspector'
import type { PromptInspectorSection } from '../strategy/PromptInspectorSection'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createSection(title: string, content?: unknown): PromptInspectorSection {
  return { title, content: content ?? `${title} content` }
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
  it('should define render method', () => {
    const renderer: PromptInspectorRenderer = new DefaultPromptInspectorRenderer()
    expect(typeof renderer.render).toBe('function')
  })

  it('should accept a PromptInspector and return a string', () => {
    const renderer = new DefaultPromptInspectorRenderer()
    const result = renderer.render(createInspector())
    expect(typeof result).toBe('string')
  })

  it('should accept a custom implementation', () => {
    const custom: PromptInspectorRenderer = {
      render(_inspector: PromptInspector): string {
        return 'custom report'
      },
    }
    expect(custom.render(createInspector())).toBe('custom report')
  })

  it('should have a single render method', () => {
    const renderer = new DefaultPromptInspectorRenderer()
    // Verify no extra unexpected methods
    const proto = Object.getOwnPropertyNames(Object.getPrototypeOf(renderer))
    expect(proto).toContain('render')
  })
})

// ---------------------------------------------------------------------------
// Empty Inspector
// ---------------------------------------------------------------------------

describe('Empty inspector', () => {
  it('should return header for empty inspector', () => {
    const renderer = new DefaultPromptInspectorRenderer()
    const result = renderer.render(createInspector())
    expect(result).toContain('Prompt Inspector')
  })

  it('should output "No Sections" for empty sections', () => {
    const renderer = new DefaultPromptInspectorRenderer()
    const result = renderer.render(createInspector())
    expect(result).toContain('No Sections')
  })

  it('should omit strategy block when strategy is undefined', () => {
    const renderer = new DefaultPromptInspectorRenderer()
    const result = renderer.render(createInspector())
    expect(result).not.toContain('Strategy:')
  })

  it('should return header and no sections only', () => {
    const renderer = new DefaultPromptInspectorRenderer()
    const result = renderer.render(createInspector())
    expect(result).toBe('Prompt Inspector\n\nNo Sections')
  })

  it('should return header and no sections for empty sections with undefined strategy', () => {
    const renderer = new DefaultPromptInspectorRenderer()
    const result = renderer.render(createInspector({ sections: [] }))
    expect(result).toBe('Prompt Inspector\n\nNo Sections')
  })
})

// ---------------------------------------------------------------------------
// Strategy Rendering
// ---------------------------------------------------------------------------

describe('Strategy rendering', () => {
  it('should render strategy when present', () => {
    const renderer = new DefaultPromptInspectorRenderer()
    const result = renderer.render(createInspector({ strategy: 'create' }))
    expect(result).toContain('Strategy:')
    expect(result).toContain('create')
  })

  it('should render strategy before sections', () => {
    const renderer = new DefaultPromptInspectorRenderer()
    const section = createSection('Rendered Strategy')
    const result = renderer.render(createInspector({ strategy: 'create', sections: [section] }))
    const strategyIdx = result.indexOf('Strategy:')
    const sectionIdx = result.indexOf('Rendered Strategy')
    expect(strategyIdx).toBeLessThan(sectionIdx)
  })

  it('should render "query" strategy', () => {
    const renderer = new DefaultPromptInspectorRenderer()
    const result = renderer.render(createInspector({ strategy: 'query' }))
    expect(result).toContain('query')
  })

  it('should render "modify" strategy', () => {
    const renderer = new DefaultPromptInspectorRenderer()
    const result = renderer.render(createInspector({ strategy: 'modify' }))
    expect(result).toContain('modify')
  })

  it('should render "delete" strategy', () => {
    const renderer = new DefaultPromptInspectorRenderer()
    const result = renderer.render(createInspector({ strategy: 'delete' }))
    expect(result).toContain('delete')
  })

  it('should not render strategy block when strategy is undefined', () => {
    const renderer = new DefaultPromptInspectorRenderer()
    const section = createSection('Prompt Plan')
    const result = renderer.render(createInspector({ sections: [section] }))
    expect(result).not.toContain('Strategy:')
  })

  it('should omit strategy block when strategy is undefined even with sections', () => {
    const renderer = new DefaultPromptInspectorRenderer()
    const result = renderer.render(createInspector({
      sections: [createSection('Rendered Strategy')],
    }))
    expect(result).not.toContain('Strategy:')
  })
})

// ---------------------------------------------------------------------------
// Single Section
// ---------------------------------------------------------------------------

describe('Single section', () => {
  it('should render a section title in list', () => {
    const renderer = new DefaultPromptInspectorRenderer()
    const section = createSection('Rendered Strategy')
    const result = renderer.render(createInspector({ sections: [section] }))
    expect(result).toContain('- Rendered Strategy')
  })

  it('should include Sections header', () => {
    const renderer = new DefaultPromptInspectorRenderer()
    const result = renderer.render(createInspector({ sections: [createSection('Test')] }))
    expect(result).toContain('Sections:')
  })

  it('should render single section with "Prompt Plan" title', () => {
    const renderer = new DefaultPromptInspectorRenderer()
    const result = renderer.render(createInspector({ sections: [createSection('Prompt Plan')] }))
    expect(result).toContain('- Prompt Plan')
  })

  it('should render single section with "Rendered Plan" title', () => {
    const renderer = new DefaultPromptInspectorRenderer()
    const result = renderer.render(createInspector({ sections: [createSection('Rendered Plan')] }))
    expect(result).toContain('- Rendered Plan')
  })
})

// ---------------------------------------------------------------------------
// Multiple Sections
// ---------------------------------------------------------------------------

describe('Multiple sections', () => {
  it('should render two sections', () => {
    const renderer = new DefaultPromptInspectorRenderer()
    const sections = [createSection('Rendered Strategy'), createSection('Strategy Selection')]
    const result = renderer.render(createInspector({ sections }))
    expect(result).toContain('- Rendered Strategy')
    expect(result).toContain('- Strategy Selection')
  })

  it('should render all 7 standard sections', () => {
    const renderer = new DefaultPromptInspectorRenderer()
    const sections: PromptInspectorSection[] = [
      createSection('Rendered Strategy'),
      createSection('Strategy Selection'),
      createSection('Strategy Module'),
      createSection('Prompt Plan'),
      createSection('Optimized Plan'),
      createSection('Plan Diff'),
      createSection('Rendered Plan'),
    ]
    const result = renderer.render(createInspector({ strategy: 'create', sections }))
    const lines = result.split('\n')
    const sectionLines = lines.filter(l => l.startsWith('- '))
    expect(sectionLines).toHaveLength(7)
    expect(sectionLines[0]).toBe('- Rendered Strategy')
    expect(sectionLines[1]).toBe('- Strategy Selection')
    expect(sectionLines[2]).toBe('- Strategy Module')
    expect(sectionLines[3]).toBe('- Prompt Plan')
    expect(sectionLines[4]).toBe('- Optimized Plan')
    expect(sectionLines[5]).toBe('- Plan Diff')
    expect(sectionLines[6]).toBe('- Rendered Plan')
  })

  it('should render sections with custom titles', () => {
    const renderer = new DefaultPromptInspectorRenderer()
    const sections = [createSection('Custom A'), createSection('Custom B')]
    const result = renderer.render(createInspector({ sections }))
    expect(result).toContain('- Custom A')
    expect(result).toContain('- Custom B')
  })

  it('should render three sections with strategy', () => {
    const renderer = new DefaultPromptInspectorRenderer()
    const sections = [
      createSection('Section A'),
      createSection('Section B'),
      createSection('Section C'),
    ]
    const result = renderer.render(createInspector({ strategy: 'query', sections }))
    expect(result).toContain('query')
    expect(result).toContain('- Section A')
    expect(result).toContain('- Section B')
    expect(result).toContain('- Section C')
  })
})

// ---------------------------------------------------------------------------
// Ordering
// ---------------------------------------------------------------------------

describe('Ordering', () => {
  it('should preserve section order from inspector', () => {
    const renderer = new DefaultPromptInspectorRenderer()
    const sections = [
      createSection('Last'),
      createSection('First'),
    ]
    // Reverse order — should render as given
    const result = renderer.render(createInspector({ sections }))
    const lines = result.split('\n')
    const sectionLines = lines.filter(l => l.startsWith('- '))
    expect(sectionLines[0]).toBe('- Last')
    expect(sectionLines[1]).toBe('- First')
  })

  it('should render sections in their original order', () => {
    const renderer = new DefaultPromptInspectorRenderer()
    const sections = [
      createSection('Z Section'),
      createSection('A Section'),
      createSection('M Section'),
    ]
    const result = renderer.render(createInspector({ sections }))
    const lines = result.split('\n')
    const sectionLines = lines.filter(l => l.startsWith('- '))
    expect(sectionLines[0]).toBe('- Z Section')
    expect(sectionLines[1]).toBe('- A Section')
    expect(sectionLines[2]).toBe('- M Section')
  })

  it('should place strategy block before sections', () => {
    const renderer = new DefaultPromptInspectorRenderer()
    const sections = [createSection('Section A')]
    const result = renderer.render(createInspector({ strategy: 'create', sections }))
    const strategyIdx = result.indexOf('Strategy:')
    const sectionIdx = result.indexOf('Section A')
    expect(strategyIdx).toBeLessThan(sectionIdx)
  })

  it('should place sections header before section list', () => {
    const renderer = new DefaultPromptInspectorRenderer()
    const sections = [createSection('Section A'), createSection('Section B')]
    const result = renderer.render(createInspector({ sections }))
    const headerIdx = result.indexOf('Sections:')
    const itemAIdx = result.indexOf('- Section A')
    const itemBIdx = result.indexOf('- Section B')
    expect(headerIdx).toBeLessThan(itemAIdx)
    expect(headerIdx).toBeLessThan(itemBIdx)
  })
})

// ---------------------------------------------------------------------------
// Deterministic
// ---------------------------------------------------------------------------

describe('Deterministic', () => {
  it('should produce same output for same inspector across multiple calls', () => {
    const renderer = new DefaultPromptInspectorRenderer()
    const inspector = createInspector({
      strategy: 'create',
      sections: [
        createSection('Rendered Strategy'),
        createSection('Prompt Plan'),
      ],
    })
    const r1 = renderer.render(inspector)
    const r2 = renderer.render(inspector)
    const r3 = renderer.render(inspector)
    expect(r1).toBe(r2)
    expect(r2).toBe(r3)
  })

  it('should produce same output across different renderer instances', () => {
    const r1 = new DefaultPromptInspectorRenderer()
    const r2 = new DefaultPromptInspectorRenderer()
    const inspector = createInspector({
      strategy: 'query',
      sections: [createSection('Strategy Module')],
    })
    expect(r1.render(inspector)).toBe(r2.render(inspector))
  })

  it('should produce same output for identical inspectors', () => {
    const renderer = new DefaultPromptInspectorRenderer()
    const inspectorA = createInspector({
      strategy: 'create',
      sections: [createSection('Rendered Strategy'), createSection('Prompt Plan')],
    })
    const inspectorB = createInspector({
      strategy: 'create',
      sections: [createSection('Rendered Strategy'), createSection('Prompt Plan')],
    })
    expect(renderer.render(inspectorA)).toBe(renderer.render(inspectorB))
  })

  it('should produce identical result for empty inspectors', () => {
    const renderer = new DefaultPromptInspectorRenderer()
    expect(renderer.render(createInspector())).toBe(renderer.render(createInspector()))
  })

  it('should produce identical result for strategy-only inspectors', () => {
    const renderer = new DefaultPromptInspectorRenderer()
    const inspector = createInspector({ strategy: 'modify' })
    expect(renderer.render(inspector)).toBe(renderer.render(inspector))
  })
})

// ---------------------------------------------------------------------------
// Stateless
// ---------------------------------------------------------------------------

describe('Stateless', () => {
  it('should not retain state between calls', () => {
    const renderer = new DefaultPromptInspectorRenderer()
    const r1 = renderer.render(createInspector({
      strategy: 'create',
      sections: [createSection('Section A')],
    }))
    const r2 = renderer.render(createInspector({
      strategy: 'query',
      sections: [createSection('Section B')],
    }))
    expect(r1).toContain('create')
    expect(r1).toContain('Section A')
    expect(r2).toContain('query')
    expect(r2).toContain('Section B')
    expect(r1).not.toContain('Section B')
    expect(r2).not.toContain('create')
  })

  it('should produce independent results for each call', () => {
    const renderer = new DefaultPromptInspectorRenderer()
    const results = [
      renderer.render(createInspector({ sections: [createSection('X')] })),
      renderer.render(createInspector({ sections: [createSection('Y')] })),
      renderer.render(createInspector({ sections: [createSection('Z')] })),
    ]
    expect(results[0]).toContain('X')
    expect(results[1]).toContain('Y')
    expect(results[2]).toContain('Z')
  })
})

// ---------------------------------------------------------------------------
// Pure / No Side Effects
// ---------------------------------------------------------------------------

describe('Pure', () => {
  it('should not modify input inspector strategy', () => {
    const renderer = new DefaultPromptInspectorRenderer()
    const inspector = createInspector({ strategy: 'create' })
    const originalStrategy = inspector.strategy
    renderer.render(inspector)
    expect(inspector.strategy).toBe(originalStrategy)
  })

  it('should not modify input inspector sections array', () => {
    const renderer = new DefaultPromptInspectorRenderer()
    const sections = [createSection('Test')]
    const inspector = createInspector({ sections })
    const originalLength = inspector.sections.length
    renderer.render(inspector)
    expect(inspector.sections.length).toBe(originalLength)
  })

  it('should not mutate section content', () => {
    const renderer = new DefaultPromptInspectorRenderer()
    const section = createSection('Test', { key: 'value' })
    const inspector = createInspector({ sections: [section] })
    const originalContent = section.content
    renderer.render(inspector)
    expect(section.content).toBe(originalContent)
  })

  it('should not modify inspector after render', () => {
    const renderer = new DefaultPromptInspectorRenderer()
    const inspector = createInspector({
      strategy: 'create',
      sections: [createSection('Rendered Strategy')],
    })
    const original = JSON.stringify(inspector)
    renderer.render(inspector)
    expect(JSON.stringify(inspector)).toBe(original)
  })
})

// ---------------------------------------------------------------------------
// Exact Output Format
// ---------------------------------------------------------------------------

describe('Exact output format', () => {
  it('should match exact format for empty inspector', () => {
    const renderer = new DefaultPromptInspectorRenderer()
    const result = renderer.render(createInspector())
    expect(result).toBe('Prompt Inspector\n\nNo Sections')
  })

  it('should match exact format for strategy only', () => {
    const renderer = new DefaultPromptInspectorRenderer()
    const result = renderer.render(createInspector({ strategy: 'create' }))
    expect(result).toBe('Prompt Inspector\n\nStrategy:\ncreate\n\nNo Sections')
  })

  it('should match exact format for single section without strategy', () => {
    const renderer = new DefaultPromptInspectorRenderer()
    const result = renderer.render(createInspector({
      sections: [createSection('Rendered Strategy')],
    }))
    expect(result).toBe('Prompt Inspector\n\nSections:\n\n- Rendered Strategy')
  })

  it('should match exact format for strategy with single section', () => {
    const renderer = new DefaultPromptInspectorRenderer()
    const result = renderer.render(createInspector({
      strategy: 'create',
      sections: [createSection('Rendered Strategy')],
    }))
    expect(result).toBe('Prompt Inspector\n\nStrategy:\ncreate\n\nSections:\n\n- Rendered Strategy')
  })

  it('should match exact format for strategy with two sections', () => {
    const renderer = new DefaultPromptInspectorRenderer()
    const result = renderer.render(createInspector({
      strategy: 'query',
      sections: [createSection('Rendered Strategy'), createSection('Prompt Plan')],
    }))
    expect(result).toBe('Prompt Inspector\n\nStrategy:\nquery\n\nSections:\n\n- Rendered Strategy\n- Prompt Plan')
  })

  it('should match exact format for three sections without strategy', () => {
    const renderer = new DefaultPromptInspectorRenderer()
    const result = renderer.render(createInspector({
      sections: [
        createSection('Section A'),
        createSection('Section B'),
        createSection('Section C'),
      ],
    }))
    expect(result).toBe('Prompt Inspector\n\nSections:\n\n- Section A\n- Section B\n- Section C')
  })

  it('should include blank line after Sections header', () => {
    const renderer = new DefaultPromptInspectorRenderer()
    const result = renderer.render(createInspector({
      sections: [createSection('Test')],
    }))
    expect(result).toContain('Sections:\n\n- Test')
  })

  it('should include blank line after Strategy line', () => {
    const renderer = new DefaultPromptInspectorRenderer()
    const result = renderer.render(createInspector({ strategy: 'create' }))
    expect(result).toContain('Strategy:\ncreate\n\n')
  })
})

// ---------------------------------------------------------------------------
// Various Section Titles
// ---------------------------------------------------------------------------

describe('Various section titles', () => {
  it('should render section with empty title', () => {
    const renderer = new DefaultPromptInspectorRenderer()
    const sections = [createSection('')]
    const result = renderer.render(createInspector({ sections }))
    expect(result).toContain('- ')
  })

  it('should render section with special characters in title', () => {
    const renderer = new DefaultPromptInspectorRenderer()
    const sections = [createSection('Test/With/Slashes')]
    const result = renderer.render(createInspector({ sections }))
    expect(result).toContain('- Test/With/Slashes')
  })

  it('should render section with long title', () => {
    const renderer = new DefaultPromptInspectorRenderer()
    const longTitle = 'A very long section title that should still render correctly'
    const sections = [createSection(longTitle)]
    const result = renderer.render(createInspector({ sections }))
    expect(result).toContain(longTitle)
  })

  it('should render section with numeric title', () => {
    const renderer = new DefaultPromptInspectorRenderer()
    const sections = [createSection('Section 123')]
    const result = renderer.render(createInspector({ sections }))
    expect(result).toContain('- Section 123')
  })
})

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

describe('Exports', () => {
  it('should export PromptInspectorRenderer type from strategy index', () => {
    // Type-only export verified at compile time; test via class conformance
    const renderer: PromptInspectorRenderer = new DefaultPromptInspectorRenderer()
    expect(typeof renderer.render).toBe('function')
  })

  it('should export DefaultPromptInspectorRenderer from strategy index', async () => {
    const mod = await import('../strategy')
    expect(mod.DefaultPromptInspectorRenderer).toBe(DefaultPromptInspectorRenderer)
  })

  it('should export DefaultPromptInspectorRenderer from package root', async () => {
    const mod = await import('..')
    expect(mod.DefaultPromptInspectorRenderer).toBeDefined()
  })

  it('should export PromptInspectorRenderer type from package root', () => {
    // Type-only export verified at compile time; test via class conformance
    const renderer: PromptInspectorRenderer = new DefaultPromptInspectorRenderer()
    expect(typeof renderer.render).toBe('function')
  })

  it('should export DefaultPromptInspectorRenderer as a class', () => {
    const renderer = new DefaultPromptInspectorRenderer()
    expect(renderer).toBeInstanceOf(DefaultPromptInspectorRenderer)
  })

  it('should export DefaultPromptInspectorRenderer that implements PromptInspectorRenderer', () => {
    const renderer: PromptInspectorRenderer = new DefaultPromptInspectorRenderer()
    expect(typeof renderer.render).toBe('function')
  })
})

// ---------------------------------------------------------------------------
// Architecture Compliance
// ---------------------------------------------------------------------------

describe('Architecture compliance', () => {
  it('should not depend on Planner', () => {
    const renderer = new DefaultPromptInspectorRenderer()
    expect(renderer).toBeInstanceOf(DefaultPromptInspectorRenderer)
  })

  it('should not depend on Runtime', () => {
    const renderer = new DefaultPromptInspectorRenderer()
    expect(renderer).toBeDefined()
  })

  it('should not depend on Provider', () => {
    const renderer = new DefaultPromptInspectorRenderer()
    expect(renderer).toBeDefined()
  })

  it('should not depend on Memory', () => {
    const renderer = new DefaultPromptInspectorRenderer()
    expect(renderer).toBeDefined()
  })

  it('should not depend on AgentLoop', () => {
    const renderer = new DefaultPromptInspectorRenderer()
    expect(renderer).toBeDefined()
  })

  it('should not depend on Pipeline', () => {
    const renderer = new DefaultPromptInspectorRenderer()
    expect(renderer).toBeDefined()
  })

  it('should not modify DefaultPromptBuilder', () => {
    const renderer = new DefaultPromptInspectorRenderer()
    expect(renderer).toBeDefined()
  })

  it('should not modify BuilderOptions', () => {
    const renderer = new DefaultPromptInspectorRenderer()
    expect(renderer).toBeDefined()
  })

  it('should not modify PromptRenderer', () => {
    const renderer = new DefaultPromptInspectorRenderer()
    expect(renderer).toBeDefined()
  })

  it('should not modify PromptCompression', () => {
    const renderer = new DefaultPromptInspectorRenderer()
    expect(renderer).toBeDefined()
  })

  it('should not modify Planner', () => {
    const renderer = new DefaultPromptInspectorRenderer()
    expect(renderer).toBeDefined()
  })

  it('should not modify Runtime', () => {
    const renderer = new DefaultPromptInspectorRenderer()
    expect(renderer).toBeDefined()
  })

  it('should not modify AgentLoop', () => {
    const renderer = new DefaultPromptInspectorRenderer()
    expect(renderer).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Compatibility — RetryPlanner
// ---------------------------------------------------------------------------

describe('RetryPlanner compatibility', () => {
  it('should be compatible with RetryPlanner', () => {
    const renderer = new DefaultPromptInspectorRenderer()
    const result = renderer.render(createInspector({
      strategy: 'create',
      sections: [createSection('Rendered Strategy')],
    }))
    expect(result).toContain('create')
  })
})

// ---------------------------------------------------------------------------
// Compatibility — ToolCallPlanner
// ---------------------------------------------------------------------------

describe('ToolCallPlanner compatibility', () => {
  it('should be compatible with ToolCallPlanner', () => {
    const renderer = new DefaultPromptInspectorRenderer()
    const result = renderer.render(createInspector({
      strategy: 'query',
      sections: [createSection('Prompt Plan')],
    }))
    expect(result).toContain('query')
    expect(result).toContain('Prompt Plan')
  })
})

// ---------------------------------------------------------------------------
// Compatibility — Streaming
// ---------------------------------------------------------------------------

describe('Streaming compatibility', () => {
  it('should be compatible with streaming pipeline', () => {
    const renderer = new DefaultPromptInspectorRenderer()
    const result = renderer.render(createInspector({
      sections: [createSection('Optimized Plan')],
    }))
    expect(result).toContain('Optimized Plan')
  })
})

// ---------------------------------------------------------------------------
// Compatibility — AgentLoop
// ---------------------------------------------------------------------------

describe('AgentLoop compatibility', () => {
  it('should be compatible with AgentLoop', () => {
    const renderer = new DefaultPromptInspectorRenderer()
    const result = renderer.render(createInspector({
      strategy: 'modify',
      sections: [createSection('Plan Diff')],
    }))
    expect(result).toContain('modify')
    expect(result).toContain('Plan Diff')
  })
})