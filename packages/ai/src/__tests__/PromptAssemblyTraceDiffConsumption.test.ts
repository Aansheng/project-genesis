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
import { DefaultStrategyEvaluator } from '../strategy/DefaultStrategyEvaluator'
import { DefaultPromptStrategy } from '../strategy/DefaultPromptStrategy'
import type { PromptAssemblyTraceDiffer } from '../strategy/PromptAssemblyTraceDiffer'
import type { PromptAssemblyTraceDiff } from '../strategy/PromptAssemblyTraceDiff'
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

function getTraceDiff(request: { metadata?: Record<string, unknown> }): PromptAssemblyTraceDiff | undefined {
  return getAssembly(request)?.traceDiff as PromptAssemblyTraceDiff | undefined
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
}

// ---------------------------------------------------------------------------
// BuilderOptions
// ---------------------------------------------------------------------------

describe('BuilderOptions', () => {
  it('should accept promptAssemblyTraceDiffer field', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(getTraceDiff(request)).toBeDefined()
  })

  it('should allow promptAssemblyTraceDiffer to be omitted', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
      promptInspectorBuilder: new DefaultPromptInspectorBuilder(),
    })
    const request = await builder.build(createPipelineContext())
    expect(getTraceDiff(request)).toBeUndefined()
  })

  it('should allow promptAssemblyTraceDiffer to be undefined', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
      promptInspectorBuilder: new DefaultPromptInspectorBuilder(),
      promptAssemblyTraceDiffer: undefined,
    })
    const request = await builder.build(createPipelineContext())
    expect(getTraceDiff(request)).toBeUndefined()
  })

  it('should work with trace builder but without differ', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
    })
    const request = await builder.build(createPipelineContext())
    expect(getAssembly(request)?.trace).toBeDefined()
    expect(getTraceDiff(request)).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// Differ Invocation
// ---------------------------------------------------------------------------

describe('Differ invocation', () => {
  it('should invoke diff method exactly once', async () => {
    let callCount = 0
    const spyDiffer: PromptAssemblyTraceDiffer = {
      diff() {
        callCount++
        return { added: [], removed: [], changed: [] }
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyTraceDiffer: spyDiffer,
    })
    await builder.build(createPipelineContext())
    expect(callCount).toBe(1)
  })

  it('should pass empty before trace to diff', async () => {
    const receivedArgs: Array<unknown> = []
    const spyDiffer: PromptAssemblyTraceDiffer = {
      diff(before, after) {
        receivedArgs.push(before, after)
        return { added: [], removed: [], changed: [] }
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyTraceDiffer: spyDiffer,
    })
    await builder.build(createPipelineContext())
    expect(receivedArgs[0]).toEqual({})
  })

  it('should pass current trace as after to diff', async () => {
    const receivedArgs: Array<unknown> = []
    const spyDiffer: PromptAssemblyTraceDiffer = {
      diff(before, after) {
        receivedArgs.push(before, after)
        return { added: [], removed: [], changed: [] }
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyTraceDiffer: spyDiffer,
    })
    const request = await builder.build(createPipelineContext())
    const trace = getAssembly(request)?.trace
    // The after trace passed to diff should be the same as stored trace
    expect(receivedArgs[1]).toBe(trace)
  })

  it('should not invoke diff when trace is absent', async () => {
    let called = false
    const spyDiffer: PromptAssemblyTraceDiffer = {
      diff() {
        called = true
        return { added: [], removed: [], changed: [] }
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceDiffer: spyDiffer,
    })
    await builder.build(createPipelineContext())
    expect(called).toBe(false)
  })

  it('should not invoke diff when differ is absent', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
    })
    const request = await builder.build(createPipelineContext())
    expect(getAssembly(request)?.trace).toBeDefined()
    expect(getTraceDiff(request)).toBeUndefined()
  })

  it('should invoke diff only when both trace and differ are present', async () => {
    let called = false
    const spyDiffer: PromptAssemblyTraceDiffer = {
      diff() {
        called = true
        return { added: [], removed: [], changed: [] }
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyTraceDiffer: spyDiffer,
    })
    await builder.build(createPipelineContext())
    expect(called).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Metadata Creation
// ---------------------------------------------------------------------------

describe('Metadata creation', () => {
  it('should store traceDiff in metadata.promptAssembly', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.traceDiff).toBeDefined()
  })

  it('should have added, removed, and changed fields in traceDiff', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const diff = getTraceDiff(request)
    expect(diff).toHaveProperty('added')
    expect(diff).toHaveProperty('removed')
    expect(diff).toHaveProperty('changed')
  })

  it('should have traceDiff as an object', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const diff = getTraceDiff(request)
    expect(typeof diff).toBe('object')
  })

  it('should produce a diff with all fields added from empty baseline', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const diff = getTraceDiff(request)
    expect(diff!.added.length).toBeGreaterThan(0)
  })

  it('should not have traceDiff when differ is absent', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
    })
    const request = await builder.build(createPipelineContext())
    expect(getTraceDiff(request)).toBeUndefined()
  })

  it('should not have traceDiff when trace builder is absent', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceDiffer: new DefaultPromptAssemblyTraceDiffer(),
    })
    const request = await builder.build(createPipelineContext())
    expect(getTraceDiff(request)).toBeUndefined()
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
    expect(assembly?.traceDiff).toBeDefined()
  })

  it('should coexist with snapshot', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.snapshot).toBeDefined()
    expect(assembly?.traceDiff).toBeDefined()
  })

  it('should coexist with inspector', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.inspector).toBeDefined()
    expect(assembly?.traceDiff).toBeDefined()
  })

  it('should coexist with inspectorRendered', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.inspectorRendered).toBeDefined()
    expect(assembly?.traceDiff).toBeDefined()
  })

  it('should coexist with inspectorExported', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.inspectorExported).toBeDefined()
    expect(assembly?.traceDiff).toBeDefined()
  })

  it('should coexist with plan', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.plan).toBeDefined()
    expect(assembly?.traceDiff).toBeDefined()
  })

  it('should coexist with optimizedPlan', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.optimizedPlan).toBeDefined()
    expect(assembly?.traceDiff).toBeDefined()
  })

  it('should coexist with planDiff', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.planDiff).toBeDefined()
    expect(assembly?.traceDiff).toBeDefined()
  })

  it('should coexist with all metadata fields', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.trace).toBeDefined()
    expect(assembly?.traceDiff).toBeDefined()
    expect(assembly?.snapshot).toBeDefined()
    expect(assembly?.inspector).toBeDefined()
    expect(assembly?.inspectorRendered).toBeDefined()
    expect(assembly?.inspectorExported).toBeDefined()
    expect(assembly?.plan).toBeDefined()
    expect(assembly?.optimizedPlan).toBeDefined()
    expect(assembly?.planDiff).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Deterministic
// ---------------------------------------------------------------------------

describe('Deterministic', () => {
  it('should produce same traceDiff across multiple calls with same setup', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const r1 = await builder.build(createPipelineContext())
    const r2 = await builder.build(createPipelineContext())
    const r3 = await builder.build(createPipelineContext())
    expect(getTraceDiff(r1)?.added).toEqual(getTraceDiff(r2)?.added)
    expect(getTraceDiff(r2)?.added).toEqual(getTraceDiff(r3)?.added)
    expect(getTraceDiff(r1)?.removed).toEqual(getTraceDiff(r2)?.removed)
    expect(getTraceDiff(r2)?.removed).toEqual(getTraceDiff(r3)?.removed)
    expect(getTraceDiff(r1)?.changed).toEqual(getTraceDiff(r2)?.changed)
    expect(getTraceDiff(r2)?.changed).toEqual(getTraceDiff(r3)?.changed)
  })

  it('should produce same traceDiff across different builder instances', async () => {
    const b1 = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const b2 = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const r1 = await b1.build(createPipelineContext())
    const r2 = await b2.build(createPipelineContext())
    expect(getTraceDiff(r1)).toEqual(getTraceDiff(r2))
  })

  it('should produce consistent traceDiff for same input', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const ctx = createPipelineContext()
    const r1 = await builder.build(ctx)
    const r2 = await builder.build(ctx)
    expect(getTraceDiff(r1)).toEqual(getTraceDiff(r2))
  })
})

// ---------------------------------------------------------------------------
// Stateless
// ---------------------------------------------------------------------------

describe('Stateless', () => {
  it('should not retain differ state between builds', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const r1 = await builder.build(createPipelineContext())
    const r2 = await builder.build(createPipelineContext({ input: 'move the tree' }))
    // Both should have traceDiff despite different inputs
    expect(getTraceDiff(r1)).toBeDefined()
    expect(getTraceDiff(r2)).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Pure / No Side Effects
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
  it('should not have traceDiff when using legacy positional form', async () => {
    const builder = new DefaultPromptBuilder(
      [new UserInputModule()],
      undefined, // renderer
      undefined, // compression
      undefined, // ranking
      undefined, // budget
      undefined, // selection
      undefined, // providerBudget
      undefined, // configuration
    )
    const request = await builder.build(createPipelineContext())
    expect(getTraceDiff(request)).toBeUndefined()
  })

  it('should have traceDiff when using BuilderOptions form', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(getTraceDiff(request)).toBeDefined()
  })

  it('should work with mixed legacy and BuilderOptions patterns', async () => {
    const legacyBuilder = new DefaultPromptBuilder(
      [new UserInputModule()],
      undefined, undefined, undefined, undefined, undefined, undefined, undefined,
    )
    const optsBuilder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const legacyRequest = await legacyBuilder.build(createPipelineContext())
    const optsRequest = await optsBuilder.build(createPipelineContext())
    expect(getTraceDiff(legacyRequest)).toBeUndefined()
    expect(getTraceDiff(optsRequest)).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// No Prompt Changes
// ---------------------------------------------------------------------------

describe('No prompt changes', () => {
  it('should produce identical prompt with and without differ', async () => {
    const ctx = createPipelineContext()
    const builderWith = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const builderWithout = new DefaultPromptBuilder([new UserInputModule()], {
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
    })
    const requestWith = await builderWith.build(ctx)
    const requestWithout = await builderWithout.build(ctx)
    expect(requestWith.prompt).toBe(requestWithout.prompt)
  })

  it('should not inject traceDiff data into prompt text', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(request.prompt).not.toContain('traceDiff')
  })

  it('should keep prompt purely from modules', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(request.prompt).toContain('draw a tree')
  })

  it('should not affect prompt rendering with differ configured', async () => {
    const baseOpts = {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
    }
    const builderWithout = new DefaultPromptBuilder([new UserInputModule()], baseOpts)
    const builderWith = new DefaultPromptBuilder([new UserInputModule()], {
      ...baseOpts,
      promptAssemblyTraceDiffer: new DefaultPromptAssemblyTraceDiffer(),
    })
    const requestWithout = await builderWithout.build(createPipelineContext())
    const requestWith = await builderWith.build(createPipelineContext())
    // Prompt should be identical with and without differ
    expect(requestWith.prompt).toBe(requestWithout.prompt)
  })
})

// ---------------------------------------------------------------------------
// Trace Dependency
// ---------------------------------------------------------------------------

describe('Trace dependency', () => {
  it('should not produce traceDiff when trace is absent despite differ present', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceDiffer: new DefaultPromptAssemblyTraceDiffer(),
    })
    const request = await builder.build(createPipelineContext())
    expect(getTraceDiff(request)).toBeUndefined()
  })

  it('should produce traceDiff when both trace and differ are present', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyTraceDiffer: new DefaultPromptAssemblyTraceDiffer(),
    })
    const request = await builder.build(createPipelineContext())
    expect(getTraceDiff(request)).toBeDefined()
  })

  it('should trace diff from empty baseline to current trace', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const diff = getTraceDiff(request)
    // All fields should be in added (compared to empty baseline)
    expect(diff!.added.length).toBeGreaterThan(0)
    expect(diff!.removed).toEqual([])
    expect(diff!.changed).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// Custom Differ
// ---------------------------------------------------------------------------

describe('Custom differ', () => {
  it('should accept a custom differ implementation', async () => {
    const customDiffer: PromptAssemblyTraceDiffer = {
      diff() {
        return { added: ['custom-added'], removed: ['custom-removed'], changed: ['custom-changed'] }
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyTraceDiffer: customDiffer,
    })
    const request = await builder.build(createPipelineContext())
    const diff = getTraceDiff(request)
    expect(diff?.added).toEqual(['custom-added'])
    expect(diff?.removed).toEqual(['custom-removed'])
    expect(diff?.changed).toEqual(['custom-changed'])
  })

  it('should preserve custom diff result across builds', async () => {
    const customDiffer: PromptAssemblyTraceDiffer = {
      diff() {
        return { added: ['strategy'], removed: [], changed: [] }
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyTraceDiffer: customDiffer,
    })
    const r1 = await builder.build(createPipelineContext())
    const r2 = await builder.build(createPipelineContext())
    expect(getTraceDiff(r1)).toEqual(getTraceDiff(r2))
  })

  it('should work with differ returning empty diff', async () => {
    const emptyDiffer: PromptAssemblyTraceDiffer = {
      diff() {
        return { added: [], removed: [], changed: [] }
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyTraceDiffer: emptyDiffer,
    })
    const request = await builder.build(createPipelineContext())
    const diff = getTraceDiff(request)
    expect(diff?.added).toEqual([])
    expect(diff?.removed).toEqual([])
    expect(diff?.changed).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// Compatibility
// ---------------------------------------------------------------------------

describe('RetryPlanner compatibility', () => {
  it('should produce correct traceDiff with RetryPlanner setup', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const diff = getTraceDiff(request)
    expect(diff).toBeDefined()
    expect(Array.isArray(diff!.added)).toBe(true)
    expect(Array.isArray(diff!.removed)).toBe(true)
    expect(Array.isArray(diff!.changed)).toBe(true)
  })
})

describe('ToolCallPlanner compatibility', () => {
  it('should produce correct traceDiff with ToolCallPlanner setup', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const diff = getTraceDiff(request)
    expect(diff).toBeDefined()
    expect(diff!.added).toContain('snapshot')
    expect(diff!.added).toContain('inspector')
  })
})

describe('Streaming compatibility', () => {
  it('should produce correct traceDiff in streaming pipeline scenario', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const diff = getTraceDiff(request)
    expect(diff).toBeDefined()
    expect(diff!.added).toContain('inspectorRendered')
  })
})

describe('AgentLoop compatibility', () => {
  it('should produce correct traceDiff with AgentLoop setup', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const diff = getTraceDiff(request)
    expect(diff).toBeDefined()
    expect(diff!.added).toContain('strategy')
    expect(diff!.added).toContain('plan')
  })
})

// ---------------------------------------------------------------------------
// TraceDiff Validation
// ---------------------------------------------------------------------------

describe('TraceDiff validation', () => {
  it('should have strategy in added fields', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const diff = getTraceDiff(request)
    expect(diff!.added).toContain('strategy')
  })

  it('should have inspectorRendered in added fields', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const diff = getTraceDiff(request)
    expect(diff!.added).toContain('inspectorRendered')
  })

  it('should have inspectorExported in added fields', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const diff = getTraceDiff(request)
    expect(diff!.added).toContain('inspectorExported')
  })

  it('should have plan present in added fields', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const diff = getTraceDiff(request)
    expect(diff!.added).toContain('plan')
  })

  it('should have all trace fields present in added', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const diff = getTraceDiff(request)
    // All 9 trace fields should be in 'added' (compared to empty baseline)
    expect(diff!.added).toContain('strategy')
    expect(diff!.added).toContain('strategySelection')
    expect(diff!.added).toContain('plan')
    expect(diff!.added).toContain('optimizedPlan')
    expect(diff!.added).toContain('planDiff')
    expect(diff!.added).toContain('snapshot')
    expect(diff!.added).toContain('inspector')
    expect(diff!.added).toContain('inspectorRendered')
    expect(diff!.added).toContain('inspectorExported')
  })

  it('should have empty removed since compared to empty baseline', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const diff = getTraceDiff(request)
    expect(diff!.removed).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

describe('Exports', () => {
  it('should export PromptAssemblyTraceDiff from package root', async () => {
    const mod = await import('..')
    expect(mod.DefaultPromptAssemblyTraceDiffer).toBeDefined()
  })

  it('should export DefaultPromptAssemblyTraceDiffer from package root', async () => {
    const mod = await import('..')
    expect(mod.DefaultPromptAssemblyTraceDiffer).toBe(DefaultPromptAssemblyTraceDiffer)
  })
})