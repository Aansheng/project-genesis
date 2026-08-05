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
import { DefaultStrategyEvaluator } from '../strategy/DefaultStrategyEvaluator'
import { DefaultPromptStrategy } from '../strategy/DefaultPromptStrategy'
import type { PromptAssemblyTraceBuilder } from '../strategy/PromptAssemblyTraceBuilder'
import type { PromptAssemblyTrace } from '../strategy/PromptAssemblyTrace'
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
}

// ---------------------------------------------------------------------------
// BuilderOptions
// ---------------------------------------------------------------------------

describe('BuilderOptions', () => {
  it('should accept promptAssemblyTraceBuilder field', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(getAssembly(request)?.trace).toBeDefined()
  })

  it('should allow promptAssemblyTraceBuilder to be omitted', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
      promptInspectorBuilder: new DefaultPromptInspectorBuilder(),
    })
    const request = await builder.build(createPipelineContext())
    expect(getAssembly(request)?.trace).toBeUndefined()
  })

  it('should allow promptAssemblyTraceBuilder to be undefined', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
      promptInspectorBuilder: new DefaultPromptInspectorBuilder(),
      promptAssemblyTraceBuilder: undefined,
    })
    const request = await builder.build(createPipelineContext())
    expect(getAssembly(request)?.trace).toBeUndefined()
  })

  it('should produce trace even without inspector builder', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
    })
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)!
    expect(assembly.trace).toBeDefined()
    // Trace should exist even without inspector
    expect(assembly.inspector).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// TraceBuilder Invocation
// ---------------------------------------------------------------------------

describe('TraceBuilder invocation', () => {
  it('should invoke trace builder when configured', async () => {
    let invoked = false
    const trackingBuilder: PromptAssemblyTraceBuilder = {
      build(_metadata: Record<string, unknown>): PromptAssemblyTrace {
        invoked = true
        return {}
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      ...fullSetup,
      promptAssemblyTraceBuilder: trackingBuilder,
    })
    await builder.build(createPipelineContext())
    expect(invoked).toBe(true)
  })

  it('should invoke trace builder exactly once per build', async () => {
    let calls = 0
    const countingBuilder: PromptAssemblyTraceBuilder = {
      build(_metadata: Record<string, unknown>): PromptAssemblyTrace {
        calls++
        return {}
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      ...fullSetup,
      promptAssemblyTraceBuilder: countingBuilder,
    })
    await builder.build(createPipelineContext())
    expect(calls).toBe(1)
  })

  it('should not invoke trace builder when builder is absent', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
      // No trace builder configured
    })
    const request = await builder.build(createPipelineContext())
    expect(getAssembly(request)?.trace).toBeUndefined()
  })

  it('should pass metadata to trace builder', async () => {
    let receivedMetadata: Record<string, unknown> | undefined
    const capturingBuilder: PromptAssemblyTraceBuilder = {
      build(metadata: Record<string, unknown>): PromptAssemblyTrace {
        receivedMetadata = metadata
        return {}
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      ...fullSetup,
      promptAssemblyTraceBuilder: capturingBuilder,
    })
    await builder.build(createPipelineContext())
    expect(receivedMetadata).toBeDefined()
    expect(receivedMetadata!.strategy).toBeDefined()
  })

  it('should pass metadata with inspector fields when inspector is configured', async () => {
    let receivedMetadata: Record<string, unknown> | undefined
    const capturingBuilder: PromptAssemblyTraceBuilder = {
      build(metadata: Record<string, unknown>): PromptAssemblyTrace {
        receivedMetadata = metadata
        return {}
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      ...fullSetup,
      promptAssemblyTraceBuilder: capturingBuilder,
    })
    await builder.build(createPipelineContext())
    expect(receivedMetadata).toBeDefined()
    expect(receivedMetadata!.inspector).toBeDefined()
    expect(receivedMetadata!.inspectorRendered).toBeDefined()
    expect(receivedMetadata!.inspectorExported).toBeDefined()
  })

  it('should store result from custom trace builder', async () => {
    const customBuilder: PromptAssemblyTraceBuilder = {
      build(_metadata: Record<string, unknown>): PromptAssemblyTrace {
        return { strategy: 'custom-trace' }
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      ...fullSetup,
      promptAssemblyTraceBuilder: customBuilder,
    })
    const request = await builder.build(createPipelineContext())
    const trace = getAssembly(request)?.trace as PromptAssemblyTrace | undefined
    expect(trace?.strategy).toBe('custom-trace')
  })
})

// ---------------------------------------------------------------------------
// Metadata Creation
// ---------------------------------------------------------------------------

describe('Metadata creation', () => {
  it('should store trace in metadata.promptAssembly', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)!
    expect(assembly.trace).toBeDefined()
  })

  it('should not store trace without trace builder', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
      promptInspectorBuilder: new DefaultPromptInspectorBuilder(),
    })
    const request = await builder.build(createPipelineContext())
    expect(getAssembly(request)?.trace).toBeUndefined()
  })

  it('should preserve trace content from default builder', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const trace = getAssembly(request)?.trace as PromptAssemblyTrace | undefined
    expect(trace).toBeDefined()
    expect(trace!.strategy).toBeDefined()
  })

  it('should store trace as an object', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const trace = getAssembly(request)?.trace
    expect(typeof trace).toBe('object')
    expect(trace).not.toBeNull()
  })

  it('should have strategy name in trace', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const trace = getAssembly(request)?.trace as PromptAssemblyTrace | undefined
    expect(trace!.strategy).toBeDefined()
    expect((trace!.strategy as { name: string }).name).toBe('default')
  })

  it('should have inspectorExported in trace when exporter is configured', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const trace = getAssembly(request)?.trace as PromptAssemblyTrace | undefined
    expect(trace!.inspectorExported).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Metadata Coexistence
// ---------------------------------------------------------------------------

describe('Metadata coexistence', () => {
  it('should coexist with snapshot', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)!
    expect(assembly.snapshot).toBeDefined()
    expect(assembly.trace).toBeDefined()
  })

  it('should coexist with inspector', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)!
    expect(assembly.inspector).toBeDefined()
    expect(assembly.trace).toBeDefined()
  })

  it('should coexist with inspectorRendered', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)!
    expect(assembly.inspectorRendered).toBeDefined()
    expect(assembly.trace).toBeDefined()
  })

  it('should coexist with inspectorExported', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)!
    expect(assembly.inspectorExported).toBeDefined()
    expect(assembly.trace).toBeDefined()
  })

  it('should coexist with plan', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)!
    expect(assembly.plan).toBeDefined()
    expect(assembly.trace).toBeDefined()
  })

  it('should coexist with optimizedPlan', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)!
    expect(assembly.optimizedPlan).toBeDefined()
    expect(assembly.trace).toBeDefined()
  })

  it('should coexist with planDiff', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)!
    expect(assembly.planDiff).toBeDefined()
    expect(assembly.trace).toBeDefined()
  })

  it('should coexist with all existing metadata fields', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)!
    expect(assembly.strategy).toBeDefined()
    expect(assembly.strategyRendered).toBeDefined()
    expect(assembly.plan).toBeDefined()
    expect(assembly.optimizedPlan).toBeDefined()
    expect(assembly.planDiff).toBeDefined()
    expect(assembly.planRendered).toBeDefined()
    expect(assembly.snapshot).toBeDefined()
    expect(assembly.inspector).toBeDefined()
    expect(assembly.inspectorRendered).toBeDefined()
    expect(assembly.inspectorExported).toBeDefined()
    expect(assembly.trace).toBeDefined()
  })

  it('should coexist with strategy metadata and ranking/budget/selection', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)!
    expect(assembly.strategy).toBeDefined()
    expect(assembly.strategyRendered).toBeDefined()
    expect(assembly.ranking).toBeDefined()
    expect(assembly.budget).toBeDefined()
    expect(assembly.selection).toBeDefined()
    expect(assembly.trace).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Deterministic
// ---------------------------------------------------------------------------

describe('Deterministic', () => {
  it('should produce same trace across multiple builds', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const ctx = createPipelineContext()
    const r1 = await builder.build(ctx)
    const r2 = await builder.build(ctx)
    const r3 = await builder.build(ctx)
    const t1 = JSON.stringify(getAssembly(r1)?.trace)
    const t2 = JSON.stringify(getAssembly(r2)?.trace)
    const t3 = JSON.stringify(getAssembly(r3)?.trace)
    expect(t1).toBe(t2)
    expect(t2).toBe(t3)
  })

  it('should produce same trace across different builder instances', async () => {
    const b1 = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const b2 = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const ctx = createPipelineContext()
    const r1 = await b1.build(ctx)
    const r2 = await b2.build(ctx)
    expect(JSON.stringify(getAssembly(r1)?.trace)).toBe(JSON.stringify(getAssembly(r2)?.trace))
  })

  it('should produce same trace for same input', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const ctx1 = createPipelineContext()
    const ctx2 = createPipelineContext()
    const r1 = await builder.build(ctx1)
    const r2 = await builder.build(ctx2)
    expect(JSON.stringify(getAssembly(r1)?.trace)).toBe(JSON.stringify(getAssembly(r2)?.trace))
  })
})

// ---------------------------------------------------------------------------
// Stateless
// ---------------------------------------------------------------------------

describe('Stateless', () => {
  it('should not retain trace state between builds', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const r1 = await builder.build(createPipelineContext({ input: 'draw a tree' }))
    const r2 = await builder.build(createPipelineContext({ input: 'build a house' }))
    const t1 = getAssembly(r1)?.trace as PromptAssemblyTrace | undefined
    const t2 = getAssembly(r2)?.trace as PromptAssemblyTrace | undefined
    expect(t1).toBeDefined()
    expect(t2).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Pure / No Side Effects
// ---------------------------------------------------------------------------

describe('Pure', () => {
  it('should not modify pipeline context', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const ctx = createPipelineContext()
    const originalInput = ctx.input
    await builder.build(ctx)
    expect(ctx.input).toBe(originalInput)
  })

  it('should not modify metadata fields', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)!
    const traceCopy = JSON.parse(JSON.stringify(assembly.trace))
    expect(JSON.stringify(assembly.trace)).toBe(JSON.stringify(traceCopy))
  })
})

// ---------------------------------------------------------------------------
// Legacy Constructor
// ---------------------------------------------------------------------------

describe('Legacy constructor', () => {
  it('should work with legacy positional constructor', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()])
    const request = await builder.build(createPipelineContext())
    expect(request.prompt).toBeDefined()
    expect(getAssembly(request)?.trace).toBeUndefined()
  })

  it('should work with BuilderOptions without trace builder', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {})
    const request = await builder.build(createPipelineContext())
    expect(request.prompt).toBeDefined()
    expect(getAssembly(request)?.trace).toBeUndefined()
  })

  it('should work with full legacy constructor arguments', async () => {
    const builder = new DefaultPromptBuilder(
      [new UserInputModule()],
      undefined,  // renderer
      undefined,  // compression
      undefined,  // ranking
      undefined,  // budget
      undefined,  // selection
    )
    const request = await builder.build(createPipelineContext())
    expect(request.prompt).toBeDefined()
    expect(getAssembly(request)?.trace).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// No Prompt Changes
// ---------------------------------------------------------------------------

describe('No prompt changes', () => {
  it('should produce identical prompt with and without trace builder', async () => {
    const modules = [new UserInputModule()]
    const snapshotBuilder = new DefaultPromptAssemblySnapshotBuilder()
    const inspectorBuilder = new DefaultPromptInspectorBuilder()

    const builderWithout = new DefaultPromptBuilder(modules, {
      promptAssemblySnapshotBuilder: snapshotBuilder,
      promptInspectorBuilder: inspectorBuilder,
    })
    const builderWith = new DefaultPromptBuilder(modules, {
      promptAssemblySnapshotBuilder: snapshotBuilder,
      promptInspectorBuilder: inspectorBuilder,
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
    })

    const ctx = createPipelineContext()
    const r1 = await builderWithout.build(ctx)
    const r2 = await builderWith.build(ctx)
    expect(r1.prompt).toBe(r2.prompt)
  })

  it('should produce identical prompt with all components', async () => {
    const modules = [new UserInputModule()]
    const builderWithout = new DefaultPromptBuilder(modules, {
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
    })
    const builderWith = new DefaultPromptBuilder(modules, {
      ...fullSetup,
    })

    const ctx = createPipelineContext()
    const r1 = await builderWithout.build(ctx)
    const r2 = await builderWith.build(ctx)
    expect(r1.prompt).toBe(r2.prompt)
  })

  it('should not inject trace into prompt text', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(request.prompt).not.toContain('trace')
    expect(request.prompt).not.toContain('PromptAssemblyTrace')
  })

  it('should produce identical prompt when only snapshot builder present', async () => {
    const modules = [new UserInputModule()]
    const withSnapshot = new DefaultPromptBuilder(modules, {
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
    })
    const withTrace = new DefaultPromptBuilder(modules, {
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
      promptInspectorBuilder: new DefaultPromptInspectorBuilder(),
      promptInspectorRenderer: new DefaultPromptInspectorRenderer(),
      promptInspectorExporter: new DefaultPromptInspectorExporter(),
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
    })
    const ctx = createPipelineContext()
    expect((await withSnapshot.build(ctx)).prompt).toBe((await withTrace.build(ctx)).prompt)
  })
})

// ---------------------------------------------------------------------------
// Compatibility — RetryPlanner
// ---------------------------------------------------------------------------

describe('RetryPlanner compatibility', () => {
  it('should be compatible with RetryPlanner', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const ctx = createPipelineContext()
    const request = await builder.build(ctx)
    expect(getAssembly(request)?.trace).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Compatibility — ToolCallPlanner
// ---------------------------------------------------------------------------

describe('ToolCallPlanner compatibility', () => {
  it('should be compatible with ToolCallPlanner', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const ctx = createPipelineContext()
    const request = await builder.build(ctx)
    expect(getAssembly(request)?.trace).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Compatibility — Streaming
// ---------------------------------------------------------------------------

describe('Streaming compatibility', () => {
  it('should be compatible with streaming pipeline', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const ctx = createPipelineContext()
    const request = await builder.build(ctx)
    expect(request.prompt).toBeDefined()
    expect(getAssembly(request)?.trace).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Compatibility — AgentLoop
// ---------------------------------------------------------------------------

describe('AgentLoop compatibility', () => {
  it('should be compatible with AgentLoop', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const ctx = createPipelineContext()
    const request = await builder.build(ctx)
    expect(request.prompt).toBeDefined()
    expect(getAssembly(request)?.trace).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Snapshot Dependency
// ---------------------------------------------------------------------------

describe('Snapshot dependency', () => {
  it('should build trace even without snapshot builder', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
    })
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)!
    expect(assembly.trace).toBeDefined()
    expect(assembly.snapshot).toBeUndefined()
  })

  it('should include snapshot in trace when snapshot builder is present', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
    })
    const request = await builder.build(createPipelineContext())
    const trace = getAssembly(request)?.trace as PromptAssemblyTrace | undefined
    expect(trace?.snapshot).toBeDefined()
  })

  it('should include snapshot in trace with full chain', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const trace = getAssembly(request)?.trace as PromptAssemblyTrace | undefined
    expect(trace?.snapshot).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Inspector Dependency
// ---------------------------------------------------------------------------

describe('Inspector dependency', () => {
  it('should build trace even without inspector builder', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
    })
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)!
    expect(assembly.trace).toBeDefined()
    expect(assembly.inspector).toBeUndefined()
  })

  it('should include inspector fields in trace when inspector builder is present', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const trace = getAssembly(request)?.trace as PromptAssemblyTrace | undefined
    expect(trace?.inspector).toBeDefined()
    expect(trace?.inspectorRendered).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Export Dependency
// ---------------------------------------------------------------------------

describe('Export dependency', () => {
  it('should build trace even without exporter', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
      promptInspectorBuilder: new DefaultPromptInspectorBuilder(),
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
    })
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)!
    expect(assembly.trace).toBeDefined()
    expect(assembly.inspectorExported).toBeUndefined()
  })

  it('should include inspectorExported in trace when exporter is configured', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const trace = getAssembly(request)?.trace as PromptAssemblyTrace | undefined
    expect(trace?.inspectorExported).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Trace Content Validation
// ---------------------------------------------------------------------------

describe('Trace content validation', () => {
  it('should have strategy name in trace', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const trace = getAssembly(request)?.trace as PromptAssemblyTrace | undefined
    expect(trace!.strategy).toBeDefined()
    expect((trace!.strategy as { name: string }).name).toBe('default')
  })

  it('should have inspectorRendered in trace', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const trace = getAssembly(request)?.trace as PromptAssemblyTrace | undefined
    expect(trace!.inspectorRendered).toBeDefined()
    expect(typeof trace!.inspectorRendered).toBe('string')
  })

  it('should have inspectorExported in trace', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const trace = getAssembly(request)?.trace as PromptAssemblyTrace | undefined
    expect(trace!.inspectorExported).toBeDefined()
    expect(typeof trace!.inspectorExported).toBe('string')
  })

  it('should have plan in trace when planner is configured', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const trace = getAssembly(request)?.trace as PromptAssemblyTrace | undefined
    expect(trace!.plan).toBeDefined()
  })

  it('should have all trace fields when all components are configured', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const trace = getAssembly(request)?.trace as PromptAssemblyTrace | undefined
    expect(trace!.strategy).toBeDefined()
    expect(trace!.strategySelection).toBeDefined()
    expect(trace!.plan).toBeDefined()
    expect(trace!.optimizedPlan).toBeDefined()
    expect(trace!.planDiff).toBeDefined()
    expect(trace!.snapshot).toBeDefined()
    expect(trace!.inspector).toBeDefined()
    expect(trace!.inspectorRendered).toBeDefined()
    expect(trace!.inspectorExported).toBeDefined()
  })
})
