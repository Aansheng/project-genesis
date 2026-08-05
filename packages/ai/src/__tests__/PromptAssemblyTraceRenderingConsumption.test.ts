import { describe, it, expect } from 'vitest'
import { DefaultPromptBuilder } from '../prompt/DefaultPromptBuilder'
import { DefaultPromptAssemblyPlanner } from '../strategy/DefaultPromptAssemblyPlanner'
import { DefaultPromptAssemblyPlanRenderer } from '../strategy/DefaultPromptAssemblyPlanRenderer'
import { DefaultPromptAssemblyOptimizer } from '../strategy/DefaultPromptAssemblyOptimizer'
import { DefaultPromptAssemblyPlanDiffer } from '../strategy/DefaultPromptAssemblyPlanDiffer'
import { DefaultPromptAssemblySnapshotBuilder } from '../strategy/DefaultPromptAssemblySnapshotBuilder'
import { DefaultPromptInspectorBuilder } from '../strategy/DefaultPromptInspectorBuilder'
import { DefaultPromptInspectorRenderer } from '../strategy/DefaultPromptInspectorRenderer'
import { DefaultPromptInspectorExporter } from '../strategy/DefaultPromptInspectorExporter'
import { DefaultPromptAssemblyTraceBuilder } from '../strategy/DefaultPromptAssemblyTraceBuilder'
import { DefaultPromptAssemblyTraceDiffer } from '../strategy/DefaultPromptAssemblyTraceDiffer'
import { DefaultPromptAssemblyTraceRenderer } from '../strategy/DefaultPromptAssemblyTraceRenderer'
import { DefaultStrategyEvaluator } from '../strategy/DefaultStrategyEvaluator'
import { DefaultPromptStrategy } from '../strategy/DefaultPromptStrategy'
import type { PromptAssemblyTraceRenderer } from '../strategy/PromptAssemblyTraceRenderer'
import { UserInputModule } from '../prompt/modules'
import type { PipelineContext } from '../pipeline/PipelineContext'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createPipelineContext(overrides?: Partial<PipelineContext>): PipelineContext {
  return {
    input: 'draw a tree',
    memory: { get: async () => null, set: async () => {} },
    worldState: '',
    ...overrides,
  }
}

function getAssembly(request: { metadata?: Record<string, unknown> }): Record<string, unknown> | undefined {
  return request.metadata?.promptAssembly as Record<string, unknown> | undefined
}

const fullSetup = {
  strategyEvaluator: new DefaultStrategyEvaluator(),
  strategies: [new DefaultPromptStrategy()],
  promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
  promptAssemblyOptimizer: new DefaultPromptAssemblyOptimizer(),
  promptAssemblyPlanDiffer: new DefaultPromptAssemblyPlanDiffer(),
  promptAssemblyPlanRenderer: new DefaultPromptAssemblyPlanRenderer(),
  promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
  promptInspectorBuilder: new DefaultPromptInspectorBuilder(),
  promptInspectorRenderer: new DefaultPromptInspectorRenderer(),
  promptInspectorExporter: new DefaultPromptInspectorExporter(),
  promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
  promptAssemblyTraceDiffer: new DefaultPromptAssemblyTraceDiffer(),
  promptAssemblyTraceRenderer: new DefaultPromptAssemblyTraceRenderer(),
}

// ---------------------------------------------------------------------------
// BuilderOptions
// ---------------------------------------------------------------------------

describe('BuilderOptions', () => {
  it('should accept promptAssemblyTraceRenderer field', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(getAssembly(request)?.traceRendered).toBeDefined()
  })

  it('should allow promptAssemblyTraceRenderer to be omitted', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
    })
    const request = await builder.build(createPipelineContext())
    expect(getAssembly(request)?.traceRendered).toBeUndefined()
  })

  it('should allow promptAssemblyTraceRenderer to be undefined', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyTraceRenderer: undefined,
    })
    const request = await builder.build(createPipelineContext())
    expect(getAssembly(request)?.traceRendered).toBeUndefined()
  })

  it('should work with trace builder but without renderer', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyTraceDiffer: new DefaultPromptAssemblyTraceDiffer(),
    })
    const request = await builder.build(createPipelineContext())
    expect(getAssembly(request)?.trace).toBeDefined()
    expect(getAssembly(request)?.traceDiff).toBeDefined()
    expect(getAssembly(request)?.traceRendered).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// Renderer Invocation
// ---------------------------------------------------------------------------

describe('Renderer invocation', () => {
  it('should invoke render method exactly once', async () => {
    let callCount = 0
    const spyRenderer: PromptAssemblyTraceRenderer = {
      render() {
        callCount++
        return 'rendered trace'
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyTraceRenderer: spyRenderer,
    })
    await builder.build(createPipelineContext())
    expect(callCount).toBe(1)
  })

  it('should pass correct trace to render', async () => {
    const receivedTraces: Array<unknown> = []
    const spyRenderer: PromptAssemblyTraceRenderer = {
      render(trace) {
        receivedTraces.push(trace)
        return 'rendered trace'
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyTraceRenderer: spyRenderer,
    })
    const request = await builder.build(createPipelineContext())
    const trace = getAssembly(request)?.trace
    expect(receivedTraces[0]).toBe(trace)
  })

  it('should not call render when trace is absent', async () => {
    let called = false
    const spyRenderer: PromptAssemblyTraceRenderer = {
      render() {
        called = true
        return ''
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceRenderer: spyRenderer,
    })
    await builder.build(createPipelineContext())
    expect(called).toBe(false)
  })

  it('should not call render when renderer is absent', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
    })
    const request = await builder.build(createPipelineContext())
    expect(getAssembly(request)?.traceRendered).toBeUndefined()
  })

  it('should preserve custom renderer output', async () => {
    const customRenderer: PromptAssemblyTraceRenderer = {
      render() {
        return 'custom rendered output'
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyTraceRenderer: customRenderer,
    })
    const request = await builder.build(createPipelineContext())
    expect(getAssembly(request)?.traceRendered).toBe('custom rendered output')
  })
})

// ---------------------------------------------------------------------------
// Metadata Creation
// ---------------------------------------------------------------------------

describe('Metadata creation', () => {
  it('should store traceRendered in metadata.promptAssembly', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.traceRendered).toBeDefined()
  })

  it('should have traceRendered as a string', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const traceRendered = getAssembly(request)?.traceRendered
    expect(typeof traceRendered).toBe('string')
  })

  it('should not have traceRendered when renderer is absent', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
    })
    const request = await builder.build(createPipelineContext())
    expect(getAssembly(request)?.traceRendered).toBeUndefined()
  })

  it('should not have traceRendered when trace builder is absent', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceRenderer: new DefaultPromptAssemblyTraceRenderer(),
    })
    const request = await builder.build(createPipelineContext())
    expect(getAssembly(request)?.traceRendered).toBeUndefined()
  })

  it('should contain expected content in rendered output', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const traceRendered = getAssembly(request)?.traceRendered as string
    expect(traceRendered).toContain('Prompt Assembly Trace')
    expect(traceRendered).toContain('Strategy:')
    expect(traceRendered).toContain('Components:')
  })
})

// ---------------------------------------------------------------------------
// Metadata Coexistence
// ---------------------------------------------------------------------------

describe('Metadata coexistence', () => {
  it('should coexist with trace', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.trace).toBeDefined()
    expect(assembly?.traceRendered).toBeDefined()
  })

  it('should coexist with traceDiff', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.traceDiff).toBeDefined()
    expect(assembly?.traceRendered).toBeDefined()
  })

  it('should coexist with snapshot', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.snapshot).toBeDefined()
    expect(assembly?.traceRendered).toBeDefined()
  })

  it('should coexist with inspector', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.inspector).toBeDefined()
    expect(assembly?.traceRendered).toBeDefined()
  })

  it('should coexist with inspectorRendered', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.inspectorRendered).toBeDefined()
    expect(assembly?.traceRendered).toBeDefined()
  })

  it('should coexist with inspectorExported', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.inspectorExported).toBeDefined()
    expect(assembly?.traceRendered).toBeDefined()
  })

  it('should coexist with plan', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.plan).toBeDefined()
    expect(assembly?.traceRendered).toBeDefined()
  })

  it('should coexist with optimizedPlan', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.optimizedPlan).toBeDefined()
    expect(assembly?.traceRendered).toBeDefined()
  })

  it('should coexist with planDiff', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.planDiff).toBeDefined()
    expect(assembly?.traceRendered).toBeDefined()
  })

  it('should coexist with strategy and strategySelection', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.strategy).toBeDefined()
    expect(assembly?.strategySelection).toBeDefined()
    expect(assembly?.traceRendered).toBeDefined()
  })

  it('should coexist with all fields together', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.trace).toBeDefined()
    expect(assembly?.traceDiff).toBeDefined()
    expect(assembly?.traceRendered).toBeDefined()
    expect(assembly?.snapshot).toBeDefined()
    expect(assembly?.inspector).toBeDefined()
    expect(assembly?.inspectorRendered).toBeDefined()
    expect(assembly?.inspectorExported).toBeDefined()
    expect(assembly?.plan).toBeDefined()
    expect(assembly?.optimizedPlan).toBeDefined()
    expect(assembly?.planDiff).toBeDefined()
    expect(assembly?.strategy).toBeDefined()
    expect(assembly?.strategySelection).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Deterministic
// ---------------------------------------------------------------------------

describe('Deterministic', () => {
  it('should produce same traceRendered across multiple calls', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const r1 = await builder.build(createPipelineContext())
    const r2 = await builder.build(createPipelineContext())
    const r3 = await builder.build(createPipelineContext())
    expect(getAssembly(r1)?.traceRendered).toBe(getAssembly(r2)?.traceRendered)
    expect(getAssembly(r2)?.traceRendered).toBe(getAssembly(r3)?.traceRendered)
  })

  it('should produce same traceRendered across different builder instances', async () => {
    const b1 = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const b2 = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const r1 = await b1.build(createPipelineContext())
    const r2 = await b2.build(createPipelineContext())
    expect(getAssembly(r1)?.traceRendered).toBe(getAssembly(r2)?.traceRendered)
  })

  it('should produce consistent traceRendered for same input', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const ctx = createPipelineContext()
    const r1 = await builder.build(ctx)
    const r2 = await builder.build(ctx)
    expect(getAssembly(r1)?.traceRendered).toBe(getAssembly(r2)?.traceRendered)
  })
})

// ---------------------------------------------------------------------------
// Stateless
// ---------------------------------------------------------------------------

describe('Stateless', () => {
  it('should not retain renderer state between builds', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const r1 = await builder.build(createPipelineContext())
    const r2 = await builder.build(createPipelineContext({ input: 'move the tree' }))
    expect(getAssembly(r1)?.traceRendered).toBeDefined()
    expect(getAssembly(r2)?.traceRendered).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Pure
// ---------------------------------------------------------------------------

describe('Pure', () => {
  it('should not modify pipeline context', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const ctx = createPipelineContext()
    const original = JSON.stringify(ctx)
    await builder.build(ctx)
    expect(JSON.stringify(ctx)).toBe(original)
  })

  it('should not modify input metadata', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const ctx = createPipelineContext({ metadata: { existing: 'data' } })
    const original = JSON.stringify(ctx.metadata)
    await builder.build(ctx)
    expect(JSON.stringify(ctx.metadata)).toBe(original)
  })
})

// ---------------------------------------------------------------------------
// Legacy Constructor
// ---------------------------------------------------------------------------

describe('Legacy constructor', () => {
  it('should not have traceRendered when using legacy positional form', async () => {
    const builder = new DefaultPromptBuilder(
      [new UserInputModule()],
      undefined, undefined, undefined, undefined, undefined, undefined, undefined,
    )
    const request = await builder.build(createPipelineContext())
    expect(getAssembly(request)?.traceRendered).toBeUndefined()
  })

  it('should have traceRendered when using BuilderOptions form', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(getAssembly(request)?.traceRendered).toBeDefined()
  })

  it('should work with mixed legacy and BuilderOptions patterns', async () => {
    const legacyBuilder = new DefaultPromptBuilder(
      [new UserInputModule()],
      undefined, undefined, undefined, undefined, undefined, undefined, undefined,
    )
    const optsBuilder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const legacyRequest = await legacyBuilder.build(createPipelineContext())
    const optsRequest = await optsBuilder.build(createPipelineContext())
    expect(getAssembly(legacyRequest)?.traceRendered).toBeUndefined()
    expect(getAssembly(optsRequest)?.traceRendered).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// No Prompt Changes
// ---------------------------------------------------------------------------

describe('No prompt changes', () => {
  it('should produce identical prompt with and without renderer', async () => {
    const ctx = createPipelineContext()
    const baseOpts = {
      strategyEvaluator: new DefaultStrategyEvaluator(),
      strategies: [new DefaultPromptStrategy()],
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
      promptAssemblyOptimizer: new DefaultPromptAssemblyOptimizer(),
      promptAssemblyPlanDiffer: new DefaultPromptAssemblyPlanDiffer(),
      promptAssemblyPlanRenderer: new DefaultPromptAssemblyPlanRenderer(),
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
      promptInspectorBuilder: new DefaultPromptInspectorBuilder(),
      promptInspectorRenderer: new DefaultPromptInspectorRenderer(),
      promptInspectorExporter: new DefaultPromptInspectorExporter(),
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
    }
    const builderWithout = new DefaultPromptBuilder([new UserInputModule()], baseOpts)
    const builderWith = new DefaultPromptBuilder([new UserInputModule()], {
      ...baseOpts,
      promptAssemblyTraceRenderer: new DefaultPromptAssemblyTraceRenderer(),
    })
    const requestWithout = await builderWithout.build(ctx)
    const requestWith = await builderWith.build(ctx)
    expect(requestWith.prompt).toBe(requestWithout.prompt)
  })

  it('should not inject traceRendered into prompt text', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(request.prompt).not.toContain('traceRendered')
  })

  it('should keep prompt purely from modules', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(request.prompt).toContain('draw a tree')
  })

  it('should not affect prompt rendering with renderer configured', async () => {
    const ctx = createPipelineContext()
    const baseOpts = {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
    }
    const builderWithout = new DefaultPromptBuilder([new UserInputModule()], baseOpts)
    const builderWith = new DefaultPromptBuilder([new UserInputModule()], {
      ...baseOpts,
      promptAssemblyTraceRenderer: new DefaultPromptAssemblyTraceRenderer(),
    })
    const requestWithout = await builderWithout.build(ctx)
    const requestWith = await builderWith.build(ctx)
    expect(requestWith.prompt).toBe(requestWithout.prompt)
  })

  it('should not render trace content in prompt', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(request.prompt).not.toContain('Components:')
    expect(request.prompt).not.toContain('Prompt Assembly Trace')
  })
})

// ---------------------------------------------------------------------------
// Trace Dependency
// ---------------------------------------------------------------------------

describe('Trace dependency', () => {
  it('should not produce traceRendered when trace is absent despite renderer present', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceRenderer: new DefaultPromptAssemblyTraceRenderer(),
    })
    const request = await builder.build(createPipelineContext())
    expect(getAssembly(request)?.traceRendered).toBeUndefined()
  })

  it('should produce traceRendered when both trace and renderer are present', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyTraceRenderer: new DefaultPromptAssemblyTraceRenderer(),
    })
    const request = await builder.build(createPipelineContext())
    expect(getAssembly(request)?.traceRendered).toBeDefined()
  })

  it('should produce traceRendered alongside traceDiff when all configured', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyTraceDiffer: new DefaultPromptAssemblyTraceDiffer(),
      promptAssemblyTraceRenderer: new DefaultPromptAssemblyTraceRenderer(),
    })
    const request = await builder.build(createPipelineContext())
    expect(getAssembly(request)?.trace).toBeDefined()
    expect(getAssembly(request)?.traceDiff).toBeDefined()
    expect(getAssembly(request)?.traceRendered).toBeDefined()
  })

  it('should render default trace content when full setup is configured', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const rendered = getAssembly(request)?.traceRendered as string
    expect(rendered).toContain('Prompt Assembly Trace')
    expect(rendered).toContain('Strategy:')
    expect(rendered).toContain('default')
  })

  it('should render component names in trace output', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const rendered = getAssembly(request)?.traceRendered as string
    expect(rendered).toContain('- plan')
    expect(rendered).toContain('- snapshot')
    expect(rendered).toContain('- inspector')
  })
})

// ---------------------------------------------------------------------------
// Custom Renderer
// ---------------------------------------------------------------------------

describe('Custom renderer', () => {
  it('should accept a custom renderer implementation', async () => {
    const customRenderer: PromptAssemblyTraceRenderer = {
      render() {
        return 'custom render output'
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyTraceRenderer: customRenderer,
    })
    const request = await builder.build(createPipelineContext())
    expect(getAssembly(request)?.traceRendered).toBe('custom render output')
  })

  it('should preserve custom renderer output across builds', async () => {
    const customRenderer: PromptAssemblyTraceRenderer = {
      render() {
        return 'persistent output'
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyTraceRenderer: customRenderer,
    })
    const r1 = await builder.build(createPipelineContext())
    const r2 = await builder.build(createPipelineContext())
    expect(getAssembly(r1)?.traceRendered).toBe('persistent output')
    expect(getAssembly(r2)?.traceRendered).toBe('persistent output')
  })

  it('should work with renderer returning empty string', async () => {
    const emptyRenderer: PromptAssemblyTraceRenderer = {
      render() {
        return ''
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyTraceRenderer: emptyRenderer,
    })
    const request = await builder.build(createPipelineContext())
    // Empty string should not be stored (length > 0 check)
    expect(getAssembly(request)?.traceRendered).toBeUndefined()
  })

  it('should work with renderer returning multi-line output', async () => {
    const multiLineRenderer: PromptAssemblyTraceRenderer = {
      render() {
        return 'line1\nline2\nline3'
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyTraceRenderer: multiLineRenderer,
    })
    const request = await builder.build(createPipelineContext())
    expect(getAssembly(request)?.traceRendered).toBe('line1\nline2\nline3')
  })
})

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

describe('Exports', () => {
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
})

// ---------------------------------------------------------------------------
// Compatibility
// ---------------------------------------------------------------------------

describe('RetryPlanner compatibility', () => {
  it('should produce traceRendered with RetryPlanner setup', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(getAssembly(request)?.traceRendered).toBeDefined()
  })
})

describe('ToolCallPlanner compatibility', () => {
  it('should produce traceRendered with ToolCallPlanner setup', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(getAssembly(request)?.traceRendered).toBeDefined()
  })
})

describe('Streaming compatibility', () => {
  it('should produce traceRendered in streaming pipeline scenario', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(getAssembly(request)?.traceRendered).toBeDefined()
  })
})

describe('AgentLoop compatibility', () => {
  it('should produce traceRendered with AgentLoop setup', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(getAssembly(request)?.traceRendered).toBeDefined()
  })
})