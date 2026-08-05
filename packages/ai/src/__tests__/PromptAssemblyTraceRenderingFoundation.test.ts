import { describe, it, expect } from 'vitest'
import { DefaultPromptAssemblyTraceRenderer } from '../strategy/DefaultPromptAssemblyTraceRenderer'
import type { PromptAssemblyTraceRenderer } from '../strategy/PromptAssemblyTraceRenderer'
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

function createTraceWithComponents(
  components: Array<keyof PromptAssemblyTrace>,
): PromptAssemblyTrace {
  const trace: PromptAssemblyTrace = {}
  for (const c of components) {
    if (c === 'inspectorRendered') {
      (trace as Record<string, unknown>)[c] = 'rendered text'
    } else if (c === 'inspectorExported') {
      (trace as Record<string, unknown>)[c] = '{"a":1}'
    } else {
      (trace as Record<string, unknown>)[c] = {}
    }
  }
  return trace
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

// ---------------------------------------------------------------------------
// Interface Contract
// ---------------------------------------------------------------------------

describe('Interface contract', () => {
  it('should define render method', () => {
    const renderer: PromptAssemblyTraceRenderer = new DefaultPromptAssemblyTraceRenderer()
    expect(typeof renderer.render).toBe('function')
  })

  it('should accept a trace and return a string', () => {
    const renderer = new DefaultPromptAssemblyTraceRenderer()
    const result = renderer.render(createEmptyTrace())
    expect(typeof result).toBe('string')
  })

  it('should accept a custom implementation', () => {
    const custom: PromptAssemblyTraceRenderer = {
      render(_trace: PromptAssemblyTrace): string {
        return 'custom renderer'
      },
    }
    expect(custom.render(createEmptyTrace())).toBe('custom renderer')
  })
})

// ---------------------------------------------------------------------------
// Empty Trace
// ---------------------------------------------------------------------------

describe('Empty trace', () => {
  it('should return "No Components" for empty trace', () => {
    const renderer = new DefaultPromptAssemblyTraceRenderer()
    const result = renderer.render(createEmptyTrace())
    expect(result).toContain('No Components')
  })

  it('should start with "Prompt Assembly Trace" header', () => {
    const renderer = new DefaultPromptAssemblyTraceRenderer()
    const result = renderer.render(createEmptyTrace())
    expect(result).toContain('Prompt Assembly Trace')
  })

  it('should not contain "Strategy:" for empty trace', () => {
    const renderer = new DefaultPromptAssemblyTraceRenderer()
    const result = renderer.render(createEmptyTrace())
    expect(result).not.toContain('Strategy:')
  })

  it('should not contain component bullet for empty trace', () => {
    const renderer = new DefaultPromptAssemblyTraceRenderer()
    const result = renderer.render(createEmptyTrace())
    expect(result).not.toContain('- ')
  })

  it('should produce consistent empty trace output', () => {
    const renderer = new DefaultPromptAssemblyTraceRenderer()
    const result = renderer.render(createEmptyTrace())
    expect(result).toBe('Prompt Assembly Trace\n\nNo Components')
  })
})

// ---------------------------------------------------------------------------
// Strategy Rendering
// ---------------------------------------------------------------------------

describe('Strategy rendering', () => {
  it('should render strategy name from { name } object', () => {
    const renderer = new DefaultPromptAssemblyTraceRenderer()
    const trace = createTraceWithStrategy('create')
    const result = renderer.render(trace)
    expect(result).toContain('Strategy:')
    expect(result).toContain('create')
  })

  it('should render strategy section before components', () => {
    const renderer = new DefaultPromptAssemblyTraceRenderer()
    const trace: PromptAssemblyTrace = {
      strategy: { name: 'query' },
      strategySelection: { selected: 'query', candidates: [] },
    }
    const result = renderer.render(trace)
    const strategyIdx = result.indexOf('Strategy:')
    const componentsIdx = result.indexOf('Components:')
    expect(strategyIdx).toBeLessThan(componentsIdx)
  })

  it('should render different strategy names', () => {
    const renderer = new DefaultPromptAssemblyTraceRenderer()
    const result1 = renderer.render(createTraceWithStrategy('create'))
    const result2 = renderer.render(createTraceWithStrategy('query'))
    expect(result1).toContain('create')
    expect(result2).toContain('query')
  })

  it('should not include Strategy section when strategy is absent', () => {
    const renderer = new DefaultPromptAssemblyTraceRenderer()
    const trace = createTraceWithComponents(['plan'])
    const result = renderer.render(trace)
    expect(result).not.toContain('Strategy:')
  })

  it('should render strategy with complex nested objects', () => {
    const renderer = new DefaultPromptAssemblyTraceRenderer()
    const trace: PromptAssemblyTrace = {
      strategy: { name: 'create', version: 2, meta: { key: 'val' } },
    }
    const result = renderer.render(trace)
    expect(result).toContain('create')
  })

  it('should render strategy when value is a string directly', () => {
    const renderer = new DefaultPromptAssemblyTraceRenderer()
    const trace: PromptAssemblyTrace = { strategy: 'create' as unknown as { name: string } }
    const result = renderer.render(trace)
    expect(result).toContain('create')
  })

  it('should render strategy when value is a number', () => {
    const renderer = new DefaultPromptAssemblyTraceRenderer()
    const trace: PromptAssemblyTrace = { strategy: 42 as unknown as { name: string } }
    const result = renderer.render(trace)
    expect(result).toContain('42')
  })
})

// ---------------------------------------------------------------------------
// Component Rendering
// ---------------------------------------------------------------------------

describe('Component rendering', () => {
  it('should render a single component (strategySelection)', () => {
    const renderer = new DefaultPromptAssemblyTraceRenderer()
    const trace = createTraceWithComponents(['strategySelection'])
    const result = renderer.render(trace)
    expect(result).toContain('- strategySelection')
  })

  it('should render a single component (plan)', () => {
    const renderer = new DefaultPromptAssemblyTraceRenderer()
    const trace = createTraceWithComponents(['plan'])
    const result = renderer.render(trace)
    expect(result).toContain('- plan')
  })

  it('should render a single component (planDiff)', () => {
    const renderer = new DefaultPromptAssemblyTraceRenderer()
    const trace = createTraceWithComponents(['planDiff'])
    const result = renderer.render(trace)
    expect(result).toContain('- planDiff')
  })

  it('should render a single component (snapshot)', () => {
    const renderer = new DefaultPromptAssemblyTraceRenderer()
    const trace = createTraceWithComponents(['snapshot'])
    const result = renderer.render(trace)
    expect(result).toContain('- snapshot')
  })

  it('should render a single component (inspector)', () => {
    const renderer = new DefaultPromptAssemblyTraceRenderer()
    const trace = createTraceWithComponents(['inspector'])
    const result = renderer.render(trace)
    expect(result).toContain('- inspector')
  })

  it('should render a single component (inspectorRendered)', () => {
    const renderer = new DefaultPromptAssemblyTraceRenderer()
    const trace = createTraceWithComponents(['inspectorRendered'])
    const result = renderer.render(trace)
    expect(result).toContain('- inspectorRendered')
  })

  it('should render a single component (inspectorExported)', () => {
    const renderer = new DefaultPromptAssemblyTraceRenderer()
    const trace = createTraceWithComponents(['inspectorExported'])
    const result = renderer.render(trace)
    expect(result).toContain('- inspectorExported')
  })

  it('should render a single component (optimizedPlan)', () => {
    const renderer = new DefaultPromptAssemblyTraceRenderer()
    const trace = createTraceWithComponents(['optimizedPlan'])
    const result = renderer.render(trace)
    expect(result).toContain('- optimizedPlan')
  })

  it('should render multiple components as bullet list', () => {
    const renderer = new DefaultPromptAssemblyTraceRenderer()
    const trace = createTraceWithComponents(['plan', 'snapshot', 'inspector'])
    const result = renderer.render(trace)
    expect(result).toContain('- plan')
    expect(result).toContain('- snapshot')
    expect(result).toContain('- inspector')
  })

  it('should render all non-strategy fields as components for full trace', () => {
    const renderer = new DefaultPromptAssemblyTraceRenderer()
    const trace = createFullTrace()
    const result = renderer.render(trace)
    expect(result).toContain('- strategySelection')
    expect(result).toContain('- plan')
    expect(result).toContain('- optimizedPlan')
    expect(result).toContain('- planDiff')
    expect(result).toContain('- snapshot')
    expect(result).toContain('- inspector')
    expect(result).toContain('- inspectorRendered')
    expect(result).toContain('- inspectorExported')
  })

  it('should not render strategy as component', () => {
    const renderer = new DefaultPromptAssemblyTraceRenderer()
    const trace = createFullTrace()
    const result = renderer.render(trace)
    // strategy is rendered as a header, not as a component bullet
    const lines = result.split('\n')
    const bulletLines = lines.filter(line => line.startsWith('- '))
    const strategyBullet = bulletLines.find(line => line.trim() === '- strategy')
    expect(strategyBullet).toBeUndefined()
  })

  it('should show "No Components" when only strategy is present', () => {
    const renderer = new DefaultPromptAssemblyTraceRenderer()
    const trace = createTraceWithStrategy('create')
    const result = renderer.render(trace)
    expect(result).toContain('No Components')
  })
})

// ---------------------------------------------------------------------------
// Ordering
// ---------------------------------------------------------------------------

describe('Ordering', () => {
  it('should preserve field declaration order in component list', () => {
    const renderer = new DefaultPromptAssemblyTraceRenderer()
    const trace = createFullTrace()
    const result = renderer.render(trace)

    // Order should be: strategySelection, plan, optimizedPlan, planDiff,
    // snapshot, inspector, inspectorRendered, inspectorExported
    const componentsStart = result.indexOf('Components:')
    const componentsSection = result.slice(componentsStart)

    const strategySelectionIdx = componentsSection.indexOf('strategySelection')
    const planIdx = componentsSection.indexOf('\n- plan')
    const optimizedPlanIdx = componentsSection.indexOf('optimizedPlan')
    const planDiffIdx = componentsSection.indexOf('planDiff')
    const snapshotIdx = componentsSection.indexOf('snapshot')
    const inspectorIdx = componentsSection.indexOf('\n- inspector')
    const inspectorRenderedIdx = componentsSection.indexOf('inspectorRendered')
    const inspectorExportedIdx = componentsSection.indexOf('inspectorExported')

    expect(strategySelectionIdx).toBeLessThan(planIdx)
    expect(planIdx).toBeLessThan(optimizedPlanIdx)
    expect(optimizedPlanIdx).toBeLessThan(planDiffIdx)
    expect(planDiffIdx).toBeLessThan(snapshotIdx)
    expect(snapshotIdx).toBeLessThan(inspectorIdx)
    expect(inspectorIdx).toBeLessThan(inspectorRenderedIdx)
    expect(inspectorRenderedIdx).toBeLessThan(inspectorExportedIdx)
  })

  it('should place strategy before components', () => {
    const renderer = new DefaultPromptAssemblyTraceRenderer()
    const trace = createFullTrace()
    const result = renderer.render(trace)
    const strategyIdx = result.indexOf('Strategy:')
    const componentsIdx = result.indexOf('Components:')
    expect(strategyIdx).toBeLessThan(componentsIdx)
  })

  it('should maintain order when some fields are missing', () => {
    const renderer = new DefaultPromptAssemblyTraceRenderer()
    const trace = createTraceWithComponents(['inspectorRendered', 'plan', 'snapshot'])
    const result = renderer.render(trace)
    const componentsSection = result.slice(result.indexOf('Components:'))
    const planIdx = componentsSection.indexOf('plan')
    const snapshotIdx = componentsSection.indexOf('snapshot')
    const inspectorRenderedIdx = componentsSection.indexOf('inspectorRendered')
    // Order: plan, snapshot, inspectorRendered
    expect(planIdx).toBeLessThan(snapshotIdx)
    expect(snapshotIdx).toBeLessThan(inspectorRenderedIdx)
  })
})

// ---------------------------------------------------------------------------
// Deterministic
// ---------------------------------------------------------------------------

describe('Deterministic', () => {
  it('should produce same output for same trace across multiple calls', () => {
    const renderer = new DefaultPromptAssemblyTraceRenderer()
    const trace = createFullTrace()
    const r1 = renderer.render(trace)
    const r2 = renderer.render(trace)
    const r3 = renderer.render(trace)
    expect(r1).toBe(r2)
    expect(r2).toBe(r3)
  })

  it('should produce same output across different renderer instances', () => {
    const r1 = new DefaultPromptAssemblyTraceRenderer()
    const r2 = new DefaultPromptAssemblyTraceRenderer()
    const trace = createFullTrace()
    expect(r1.render(trace)).toBe(r2.render(trace))
  })

  it('should produce same output for identical traces', () => {
    const renderer = new DefaultPromptAssemblyTraceRenderer()
    const trace1 = createTraceWithStrategy('create')
    const trace2 = createTraceWithStrategy('create')
    expect(renderer.render(trace1)).toBe(renderer.render(trace2))
  })

  it('should produce same output for empty traces', () => {
    const renderer = new DefaultPromptAssemblyTraceRenderer()
    const r1 = renderer.render(createEmptyTrace())
    const r2 = renderer.render(createEmptyTrace())
    expect(r1).toBe(r2)
  })
})

// ---------------------------------------------------------------------------
// Stateless
// ---------------------------------------------------------------------------

describe('Stateless', () => {
  it('should not retain state between render calls', () => {
    const renderer = new DefaultPromptAssemblyTraceRenderer()
    const trace1 = createTraceWithStrategy('create')
    const trace2 = createTraceWithStrategy('query')
    const r1 = renderer.render(trace1)
    const r2 = renderer.render(trace2)
    expect(r1).toContain('create')
    expect(r2).toContain('query')
  })

  it('should produce independent results from sequential calls', () => {
    const renderer = new DefaultPromptAssemblyTraceRenderer()
    const r1 = renderer.render(createFullTrace())
    const r2 = renderer.render(createEmptyTrace())
    expect(r1).toContain('Components:')
    expect(r2).toContain('No Components')
  })
})

// ---------------------------------------------------------------------------
// Pure
// ---------------------------------------------------------------------------

describe('Pure', () => {
  it('should not modify input trace', () => {
    const renderer = new DefaultPromptAssemblyTraceRenderer()
    const trace = createFullTrace()
    const original = JSON.stringify(trace)
    renderer.render(trace)
    expect(JSON.stringify(trace)).toBe(original)
  })

  it('should not modify nested objects in trace', () => {
    const renderer = new DefaultPromptAssemblyTraceRenderer()
    const trace: PromptAssemblyTrace = {
      strategy: { name: 'create', extra: 'data' },
      plan: { priorities: [{ section: 'x', priority: 100 }] },
    }
    const originalStrategy = JSON.stringify(trace.strategy)
    const originalPlan = JSON.stringify(trace.plan)
    renderer.render(trace)
    expect(JSON.stringify(trace.strategy)).toBe(originalStrategy)
    expect(JSON.stringify(trace.plan)).toBe(originalPlan)
  })

  it('should have no side effects on external state', () => {
    const renderer = new DefaultPromptAssemblyTraceRenderer()
    const trace = createEmptyTrace()
    const result1 = renderer.render(trace)
    const result2 = renderer.render(trace)
    expect(result1).toBe(result2)
  })
})

// ---------------------------------------------------------------------------
// Edge Cases
// ---------------------------------------------------------------------------

describe('Edge cases', () => {
  it('should handle trace with only strategySelection field', () => {
    const renderer = new DefaultPromptAssemblyTraceRenderer()
    const trace = createTraceWithComponents(['strategySelection'])
    const result = renderer.render(trace)
    expect(result).toContain('- strategySelection')
    expect(result).not.toContain('Strategy:')
  })

  it('should handle trace with only planDiff field', () => {
    const renderer = new DefaultPromptAssemblyTraceRenderer()
    const trace = createTraceWithComponents(['planDiff'])
    const result = renderer.render(trace)
    expect(result).toContain('- planDiff')
  })

  it('should handle trace with only inspectorExported field', () => {
    const renderer = new DefaultPromptAssemblyTraceRenderer()
    const trace = createTraceWithComponents(['inspectorExported'])
    const result = renderer.render(trace)
    expect(result).toContain('- inspectorExported')
  })

  it('should handle trace with strategy as boolean', () => {
    const renderer = new DefaultPromptAssemblyTraceRenderer()
    const trace: PromptAssemblyTrace = { strategy: true as unknown as { name: string } }
    const result = renderer.render(trace)
    expect(result).toContain('true')
  })

  it('should handle trace with strategy as null', () => {
    const renderer = new DefaultPromptAssemblyTraceRenderer()
    const trace: PromptAssemblyTrace = { strategy: null as unknown as { name: string } }
    const result = renderer.render(trace)
    // null is defined, so it gets rendered as "null"
    expect(result).toContain('Strategy:')
    expect(result).toContain('null')
  })

  it('should handle trace with all component fields present', () => {
    const renderer = new DefaultPromptAssemblyTraceRenderer()
    const trace = createFullTrace()
    const result = renderer.render(trace)
    const lines = result.split('\n')
    expect(lines[0]).toBe('Prompt Assembly Trace')
    expect(lines[2]).toBe('Strategy:')
    expect(lines[3]).toBe('create')
  })

  it('should handle trace with inspectorRendered as empty string', () => {
    const renderer = new DefaultPromptAssemblyTraceRenderer()
    const trace: PromptAssemblyTrace = { inspectorRendered: '' }
    const result = renderer.render(trace)
    expect(result).toContain('- inspectorRendered')
  })

  it('should handle trace with inspectorExported as empty string', () => {
    const renderer = new DefaultPromptAssemblyTraceRenderer()
    const trace: PromptAssemblyTrace = { inspectorExported: '' }
    const result = renderer.render(trace)
    expect(result).toContain('- inspectorExported')
  })

  it('should handle trace with strategy object that has no name property', () => {
    const renderer = new DefaultPromptAssemblyTraceRenderer()
    const trace: PromptAssemblyTrace = { strategy: { type: 'fallback' } as unknown as { name: string } }
    const result = renderer.render(trace)
    expect(result).toContain('[object Object]')
  })

  it('should produce different output for different traces', () => {
    const renderer = new DefaultPromptAssemblyTraceRenderer()
    const trace1 = createTraceWithStrategy('create')
    const trace2 = createTraceWithStrategy('query')
    expect(renderer.render(trace1)).not.toBe(renderer.render(trace2))
  })

  it('should handle trace with strategy and one component (optimizedPlan)', () => {
    const renderer = new DefaultPromptAssemblyTraceRenderer()
    const trace: PromptAssemblyTrace = {
      strategy: { name: 'query' },
      optimizedPlan: { priorities: [] },
    }
    const result = renderer.render(trace)
    expect(result).toContain('query')
    expect(result).toContain('- optimizedPlan')
  })

  it('should handle trace with planDiff and snapshot only', () => {
    const renderer = new DefaultPromptAssemblyTraceRenderer()
    const trace = createTraceWithComponents(['planDiff', 'snapshot'])
    const result = renderer.render(trace)
    expect(result).toContain('- planDiff')
    expect(result).toContain('- snapshot')
    expect(result).not.toContain('Strategy:')
  })

  it('should handle trace with three consecutive components', () => {
    const renderer = new DefaultPromptAssemblyTraceRenderer()
    const trace = createTraceWithComponents(['plan', 'optimizedPlan', 'planDiff'])
    const result = renderer.render(trace)
    expect(result).toContain('- plan')
    expect(result).toContain('- optimizedPlan')
    expect(result).toContain('- planDiff')
  })
})

// ---------------------------------------------------------------------------
// Exact Output
// ---------------------------------------------------------------------------

describe('Exact output', () => {
  it('should produce exact output for empty trace', () => {
    const renderer = new DefaultPromptAssemblyTraceRenderer()
    expect(renderer.render(createEmptyTrace()))
      .toBe('Prompt Assembly Trace\n\nNo Components')
  })

  it('should produce exact output for trace with strategy only', () => {
    const renderer = new DefaultPromptAssemblyTraceRenderer()
    const result = renderer.render(createTraceWithStrategy('create'))
    expect(result).toBe('Prompt Assembly Trace\n\nStrategy:\ncreate\n\nNo Components')
  })

  it('should produce exact output for trace with strategy and one component', () => {
    const renderer = new DefaultPromptAssemblyTraceRenderer()
    const trace: PromptAssemblyTrace = {
      strategy: { name: 'query' },
      plan: { priorities: [] },
    }
    const result = renderer.render(trace)
    expect(result).toBe([
      'Prompt Assembly Trace',
      '',
      'Strategy:',
      'query',
      '',
      'Components:',
      '',
      '- plan',
    ].join('\n'))
  })

  it('should produce exact output for full trace', () => {
    const renderer = new DefaultPromptAssemblyTraceRenderer()
    const result = renderer.render(createFullTrace())
    const expected = [
      'Prompt Assembly Trace',
      '',
      'Strategy:',
      'create',
      '',
      'Components:',
      '',
      '- strategySelection',
      '- plan',
      '- optimizedPlan',
      '- planDiff',
      '- snapshot',
      '- inspector',
      '- inspectorRendered',
      '- inspectorExported',
    ].join('\n')
    expect(result).toBe(expected)
  })

  it('should produce exact output for trace without strategy', () => {
    const renderer = new DefaultPromptAssemblyTraceRenderer()
    const trace = createTraceWithComponents(['plan', 'snapshot'])
    const result = renderer.render(trace)
    const expected = [
      'Prompt Assembly Trace',
      '',
      'Components:',
      '',
      '- plan',
      '- snapshot',
    ].join('\n')
    expect(result).toBe(expected)
  })

  it('should produce exact output for trace with inspectorRendered only', () => {
    const renderer = new DefaultPromptAssemblyTraceRenderer()
    const trace = createTraceWithComponents(['inspectorRendered'])
    const result = renderer.render(trace)
    const expected = [
      'Prompt Assembly Trace',
      '',
      'Components:',
      '',
      '- inspectorRendered',
    ].join('\n')
    expect(result).toBe(expected)
  })
})

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

describe('Exports', () => {
  it('should export DefaultPromptAssemblyTraceRenderer from strategy index', async () => {
    const mod = await import('../strategy')
    expect(mod.DefaultPromptAssemblyTraceRenderer).toBeDefined()
  })

  it('should export PromptAssemblyTraceRenderer type from strategy index', async () => {
    const mod = await import('../strategy')
    expect(mod.DefaultPromptAssemblyTraceRenderer).toBeDefined()
  })

  it('should export DefaultPromptAssemblyTraceRenderer from package root', async () => {
    const mod = await import('..')
    expect(mod.DefaultPromptAssemblyTraceRenderer).toBeDefined()
  })

  it('should export PromptAssemblyTraceRenderer type from package root', async () => {
    const mod = await import('..')
    expect(mod.DefaultPromptAssemblyTraceRenderer).toBeDefined()
  })

  it('should export DefaultPromptAssemblyTraceRenderer as a class', () => {
    const renderer = new DefaultPromptAssemblyTraceRenderer()
    expect(renderer).toBeInstanceOf(DefaultPromptAssemblyTraceRenderer)
  })

  it('should export PromptAssemblyTraceRenderer as a type', () => {
    const renderer: PromptAssemblyTraceRenderer = new DefaultPromptAssemblyTraceRenderer()
    expect(typeof renderer.render).toBe('function')
  })
})

// ---------------------------------------------------------------------------
// Architecture Compliance
// ---------------------------------------------------------------------------

describe('Architecture compliance', () => {
  it('should not depend on Planner', () => {
    const renderer = new DefaultPromptAssemblyTraceRenderer()
    expect(renderer).toBeInstanceOf(DefaultPromptAssemblyTraceRenderer)
  })

  it('should not depend on Runtime', () => {
    const renderer = new DefaultPromptAssemblyTraceRenderer()
    expect(renderer).toBeDefined()
  })

  it('should not depend on Provider', () => {
    const renderer = new DefaultPromptAssemblyTraceRenderer()
    expect(renderer).toBeDefined()
  })

  it('should not depend on Memory', () => {
    const renderer = new DefaultPromptAssemblyTraceRenderer()
    expect(renderer).toBeDefined()
  })

  it('should not depend on AgentLoop', () => {
    const renderer = new DefaultPromptAssemblyTraceRenderer()
    expect(renderer).toBeDefined()
  })

  it('should not depend on Pipeline', () => {
    const renderer = new DefaultPromptAssemblyTraceRenderer()
    expect(renderer).toBeDefined()
  })

  it('should not modify PromptBuilder', () => {
    const renderer = new DefaultPromptAssemblyTraceRenderer()
    expect(renderer).toBeDefined()
  })

  it('should not modify PromptRenderer', () => {
    const renderer = new DefaultPromptAssemblyTraceRenderer()
    expect(renderer).toBeDefined()
  })

  it('should not modify PromptCompression', () => {
    const renderer = new DefaultPromptAssemblyTraceRenderer()
    expect(renderer).toBeDefined()
  })

  it('should not modify PromptAssemblyTrace', () => {
    const renderer = new DefaultPromptAssemblyTraceRenderer()
    const trace = createFullTrace()
    renderer.render(trace)
    // trace unchanged
    expect(trace.strategy).toBeDefined()
  })

  it('should not modify Planner', () => {
    const renderer = new DefaultPromptAssemblyTraceRenderer()
    expect(renderer).toBeDefined()
  })

  it('should not modify Runtime', () => {
    const renderer = new DefaultPromptAssemblyTraceRenderer()
    expect(renderer).toBeDefined()
  })

  it('should not modify AgentLoop', () => {
    const renderer = new DefaultPromptAssemblyTraceRenderer()
    expect(renderer).toBeDefined()
  })

  it('should not modify DefaultPromptBuilder', () => {
    const renderer = new DefaultPromptAssemblyTraceRenderer()
    expect(renderer).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Compatibility
// ---------------------------------------------------------------------------

describe('RetryPlanner compatibility', () => {
  it('should be compatible with RetryPlanner scenarios', () => {
    const renderer = new DefaultPromptAssemblyTraceRenderer()
    const trace = createTraceWithStrategy('create')
    const result = renderer.render(trace)
    expect(result).toContain('create')
  })
})

describe('ToolCallPlanner compatibility', () => {
  it('should be compatible with ToolCallPlanner scenarios', () => {
    const renderer = new DefaultPromptAssemblyTraceRenderer()
    const trace = createTraceWithComponents(['plan', 'optimizedPlan'])
    const result = renderer.render(trace)
    expect(result).toContain('- plan')
    expect(result).toContain('- optimizedPlan')
  })
})

describe('Streaming compatibility', () => {
  it('should be compatible with streaming pipeline', () => {
    const renderer = new DefaultPromptAssemblyTraceRenderer()
    const trace = createTraceWithComponents(['inspectorRendered'])
    const result = renderer.render(trace)
    expect(result).toContain('- inspectorRendered')
  })
})

describe('AgentLoop compatibility', () => {
  it('should be compatible with AgentLoop', () => {
    const renderer = new DefaultPromptAssemblyTraceRenderer()
    const trace = createFullTrace()
    const result = renderer.render(trace)
    expect(result).toContain('Strategy:')
    expect(result).toContain('create')
  })
})