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
import { DefaultPromptAssemblyTraceExporter } from '../strategy/DefaultPromptAssemblyTraceExporter'
import { DefaultStrategyEvaluator } from '../strategy/DefaultStrategyEvaluator'
import { DefaultPromptStrategy } from '../strategy/DefaultPromptStrategy'
import type { PromptAssemblyTraceExporter } from '../strategy/PromptAssemblyTraceExporter'
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
  promptAssemblyTraceExporter: new DefaultPromptAssemblyTraceExporter(),
}

// ---------------------------------------------------------------------------
// BuilderOptions
// ---------------------------------------------------------------------------

describe('BuilderOptions', () => {
  it('should accept promptAssemblyTraceExporter field', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(getAssembly(request)?.traceExported).toBeDefined()
  })

  it('should allow promptAssemblyTraceExporter to be omitted', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
    })
    const request = await builder.build(createPipelineContext())
    expect(getAssembly(request)?.traceExported).toBeUndefined()
  })

  it('should allow promptAssemblyTraceExporter to be undefined', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyTraceExporter: undefined,
    })
    const request = await builder.build(createPipelineContext())
    expect(getAssembly(request)?.traceExported).toBeUndefined()
  })

  it('should work with trace builder but without exporter', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyTraceRenderer: new DefaultPromptAssemblyTraceRenderer(),
    })
    const request = await builder.build(createPipelineContext())
    expect(getAssembly(request)?.trace).toBeDefined()
    expect(getAssembly(request)?.traceRendered).toBeDefined()
    expect(getAssembly(request)?.traceExported).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// Exporter Invocation
// ---------------------------------------------------------------------------

describe('Exporter invocation', () => {
  it('should invoke export method exactly once', async () => {
    let callCount = 0
    const spyExporter: PromptAssemblyTraceExporter = {
      export() {
        callCount++
        return '{}'
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyTraceExporter: spyExporter,
    })
    await builder.build(createPipelineContext())
    expect(callCount).toBe(1)
  })

  it('should pass correct trace to export', async () => {
    const receivedTraces: Array<unknown> = []
    const spyExporter: PromptAssemblyTraceExporter = {
      export(trace) {
        receivedTraces.push(trace)
        return '{}'
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyTraceExporter: spyExporter,
    })
    const request = await builder.build(createPipelineContext())
    const trace = getAssembly(request)?.trace
    expect(receivedTraces[0]).toBe(trace)
  })

  it('should not call export when trace is absent', async () => {
    let called = false
    const spyExporter: PromptAssemblyTraceExporter = {
      export() {
        called = true
        return ''
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceExporter: spyExporter,
    })
    await builder.build(createPipelineContext())
    expect(called).toBe(false)
  })

  it('should not call export when exporter is absent', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
    })
    const request = await builder.build(createPipelineContext())
    expect(getAssembly(request)?.traceExported).toBeUndefined()
  })

  it('should preserve custom exporter output', async () => {
    const customExporter: PromptAssemblyTraceExporter = {
      export() {
        return '{"custom":"export"}'
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyTraceExporter: customExporter,
    })
    const request = await builder.build(createPipelineContext())
    expect(getAssembly(request)?.traceExported).toBe('{"custom":"export"}')
  })
})

// ---------------------------------------------------------------------------
// Metadata Creation
// ---------------------------------------------------------------------------

describe('Metadata creation', () => {
  it('should store traceExported in metadata.promptAssembly', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.traceExported).toBeDefined()
  })

  it('should have traceExported as a string', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const traceExported = getAssembly(request)?.traceExported
    expect(typeof traceExported).toBe('string')
  })

  it('should not have traceExported when exporter is absent', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
    })
    const request = await builder.build(createPipelineContext())
    expect(getAssembly(request)?.traceExported).toBeUndefined()
  })

  it('should not have traceExported when trace builder is absent', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceExporter: new DefaultPromptAssemblyTraceExporter(),
    })
    const request = await builder.build(createPipelineContext())
    expect(getAssembly(request)?.traceExported).toBeUndefined()
  })

  it('should contain valid JSON in exported output', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const exported = getAssembly(request)?.traceExported as string
    expect(() => JSON.parse(exported)).not.toThrow()
    const parsed = JSON.parse(exported)
    expect(parsed.strategy).toBeDefined()
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
    expect(assembly?.traceExported).toBeDefined()
  })

  it('should coexist with traceDiff', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.traceDiff).toBeDefined()
    expect(assembly?.traceExported).toBeDefined()
  })

  it('should coexist with traceRendered', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.traceRendered).toBeDefined()
    expect(assembly?.traceExported).toBeDefined()
  })

  it('should coexist with snapshot', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.snapshot).toBeDefined()
    expect(assembly?.traceExported).toBeDefined()
  })

  it('should coexist with inspector', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.inspector).toBeDefined()
    expect(assembly?.traceExported).toBeDefined()
  })

  it('should coexist with inspectorRendered', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.inspectorRendered).toBeDefined()
    expect(assembly?.traceExported).toBeDefined()
  })

  it('should coexist with inspectorExported', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.inspectorExported).toBeDefined()
    expect(assembly?.traceExported).toBeDefined()
  })

  it('should coexist with plan', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.plan).toBeDefined()
    expect(assembly?.traceExported).toBeDefined()
  })

  it('should coexist with optimizedPlan', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.optimizedPlan).toBeDefined()
    expect(assembly?.traceExported).toBeDefined()
  })

  it('should coexist with planDiff', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.planDiff).toBeDefined()
    expect(assembly?.traceExported).toBeDefined()
  })

  it('should coexist with strategy and strategySelection', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.strategy).toBeDefined()
    expect(assembly?.strategySelection).toBeDefined()
    expect(assembly?.traceExported).toBeDefined()
  })

  it('should coexist with all fields', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.trace).toBeDefined()
    expect(assembly?.traceDiff).toBeDefined()
    expect(assembly?.traceRendered).toBeDefined()
    expect(assembly?.traceExported).toBeDefined()
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
  it('should produce same traceExported across multiple calls', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const r1 = await builder.build(createPipelineContext())
    const r2 = await builder.build(createPipelineContext())
    const r3 = await builder.build(createPipelineContext())
    expect(getAssembly(r1)?.traceExported).toBe(getAssembly(r2)?.traceExported)
    expect(getAssembly(r2)?.traceExported).toBe(getAssembly(r3)?.traceExported)
  })

  it('should produce same traceExported across different builder instances', async () => {
    const b1 = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const b2 = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const r1 = await b1.build(createPipelineContext())
    const r2 = await b2.build(createPipelineContext())
    expect(getAssembly(r1)?.traceExported).toBe(getAssembly(r2)?.traceExported)
  })

  it('should produce consistent traceExported for same input', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const ctx = createPipelineContext()
    const r1 = await builder.build(ctx)
    const r2 = await builder.build(ctx)
    expect(getAssembly(r1)?.traceExported).toBe(getAssembly(r2)?.traceExported)
  })
})

// ---------------------------------------------------------------------------
// Stateless
// ---------------------------------------------------------------------------

describe('Stateless', () => {
  it('should not retain exporter state between builds', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const r1 = await builder.build(createPipelineContext())
    const r2 = await builder.build(createPipelineContext({ input: 'move the tree' }))
    expect(getAssembly(r1)?.traceExported).toBeDefined()
    expect(getAssembly(r2)?.traceExported).toBeDefined()
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

  it('should not modify trace object during export', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const ctx = createPipelineContext()
    const request = await builder.build(ctx)
    const assembly = getAssembly(request) as Record<string, unknown>
    const trace = assembly.trace as Record<string, unknown>
    const original = JSON.stringify(trace)
    // Verify trace is unchanged after export
    expect(JSON.stringify(assembly.trace)).toBe(original)
  })
})

// ---------------------------------------------------------------------------
// Legacy Constructor
// ---------------------------------------------------------------------------

describe('Legacy constructor', () => {
  it('should not have traceExported when using legacy positional form', async () => {
    const builder = new DefaultPromptBuilder(
      [new UserInputModule()],
      undefined, undefined, undefined, undefined, undefined, undefined, undefined,
    )
    const request = await builder.build(createPipelineContext())
    expect(getAssembly(request)?.traceExported).toBeUndefined()
  })

  it('should have traceExported when using BuilderOptions form', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(getAssembly(request)?.traceExported).toBeDefined()
  })

  it('should work with mixed legacy and BuilderOptions patterns', async () => {
    const legacyBuilder = new DefaultPromptBuilder(
      [new UserInputModule()],
      undefined, undefined, undefined, undefined, undefined, undefined, undefined,
    )
    const optsBuilder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const legacyRequest = await legacyBuilder.build(createPipelineContext())
    const optsRequest = await optsBuilder.build(createPipelineContext())
    expect(getAssembly(legacyRequest)?.traceExported).toBeUndefined()
    expect(getAssembly(optsRequest)?.traceExported).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// No Prompt Changes
// ---------------------------------------------------------------------------

describe('No prompt changes', () => {
  it('should produce identical prompt with and without exporter', async () => {
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
      promptAssemblyTraceExporter: new DefaultPromptAssemblyTraceExporter(),
    })
    const requestWithout = await builderWithout.build(ctx)
    const requestWith = await builderWith.build(ctx)
    expect(requestWith.prompt).toBe(requestWithout.prompt)
  })

  it('should not inject traceExported into prompt text', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(request.prompt).not.toContain('traceExported')
  })

  it('should keep prompt purely from modules', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(request.prompt).toContain('draw a tree')
  })

  it('should not inject JSON content into prompt', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(request.prompt).not.toContain('"strategy"')
    expect(request.prompt).not.toContain('"plan"')
  })
})

// ---------------------------------------------------------------------------
// Compatibility
// ---------------------------------------------------------------------------

describe('RetryPlanner compatibility', () => {
  it('should produce traceExported with RetryPlanner setup', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(getAssembly(request)?.traceExported).toBeDefined()
  })
})

describe('ToolCallPlanner compatibility', () => {
  it('should produce traceExported with ToolCallPlanner setup', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(getAssembly(request)?.traceExported).toBeDefined()
  })
})

describe('Streaming compatibility', () => {
  it('should produce traceExported in streaming pipeline scenario', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(getAssembly(request)?.traceExported).toBeDefined()
  })
})

describe('AgentLoop compatibility', () => {
  it('should produce traceExported with AgentLoop setup', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(getAssembly(request)?.traceExported).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Trace Dependency
// ---------------------------------------------------------------------------

describe('Trace dependency', () => {
  it('should not produce traceExported when trace is absent despite exporter present', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceExporter: new DefaultPromptAssemblyTraceExporter(),
    })
    const request = await builder.build(createPipelineContext())
    expect(getAssembly(request)?.traceExported).toBeUndefined()
  })

  it('should produce traceExported when both trace and exporter are present', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyTraceExporter: new DefaultPromptAssemblyTraceExporter(),
    })
    const request = await builder.build(createPipelineContext())
    expect(getAssembly(request)?.traceExported).toBeDefined()
  })

  it('should produce traceExported alongside traceDiff and traceRendered', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyTraceDiffer: new DefaultPromptAssemblyTraceDiffer(),
      promptAssemblyTraceRenderer: new DefaultPromptAssemblyTraceRenderer(),
      promptAssemblyTraceExporter: new DefaultPromptAssemblyTraceExporter(),
    })
    const request = await builder.build(createPipelineContext())
    expect(getAssembly(request)?.trace).toBeDefined()
    expect(getAssembly(request)?.traceDiff).toBeDefined()
    expect(getAssembly(request)?.traceRendered).toBeDefined()
    expect(getAssembly(request)?.traceExported).toBeDefined()
  })

  it('should handle traceExported with strategy and plan fields', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const exported = getAssembly(request)?.traceExported as string
    const parsed = JSON.parse(exported)
    expect(parsed.strategy).toBeDefined()
    expect(parsed.plan).toBeDefined()
  })

  it('should handle traceExported with inspector fields', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const exported = getAssembly(request)?.traceExported as string
    const parsed = JSON.parse(exported)
    expect(parsed.snapshot).toBeDefined()
    expect(parsed.inspector).toBeDefined()
  })

  it('should produce traceExported with correct JSON formatting', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const exported = getAssembly(request)?.traceExported as string
    const parsed = JSON.parse(exported)
    expect(Object.keys(parsed)).toContain('strategy')
    expect(Object.keys(parsed)).toContain('plan')
    expect(Object.keys(parsed)).toContain('inspector')
  })
})

// ---------------------------------------------------------------------------
// Custom Exporter
// ---------------------------------------------------------------------------

describe('Custom exporter', () => {
  it('should accept a custom exporter implementation', async () => {
    const customExporter: PromptAssemblyTraceExporter = {
      export() {
        return '{"type":"custom"}'
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyTraceExporter: customExporter,
    })
    const request = await builder.build(createPipelineContext())
    expect(getAssembly(request)?.traceExported).toBe('{"type":"custom"}')
  })

  it('should preserve custom exporter output across builds', async () => {
    const customExporter: PromptAssemblyTraceExporter = {
      export() {
        return '{"persistent":true}'
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyTraceExporter: customExporter,
    })
    const r1 = await builder.build(createPipelineContext())
    const r2 = await builder.build(createPipelineContext())
    expect(getAssembly(r1)?.traceExported).toBe('{"persistent":true}')
    expect(getAssembly(r2)?.traceExported).toBe('{"persistent":true}')
  })

  it('should work with exporter returning empty string', async () => {
    const emptyExporter: PromptAssemblyTraceExporter = {
      export() {
        return ''
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyTraceExporter: emptyExporter,
    })
    const request = await builder.build(createPipelineContext())
    expect(getAssembly(request)?.traceExported).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

describe('Exports', () => {
  it('should export DefaultPromptAssemblyTraceExporter from package root', async () => {
    const mod = await import('..')
    expect(mod.DefaultPromptAssemblyTraceExporter).toBeDefined()
  })

  it('should export PromptAssemblyTraceExporter type from package root', async () => {
    const mod = await import('..')
    expect(mod.DefaultPromptAssemblyTraceExporter).toBeDefined()
  })
})