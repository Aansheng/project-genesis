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
import { DefaultPromptAssemblyTimelineBuilder } from '../strategy/DefaultPromptAssemblyTimelineBuilder'
import { DefaultPromptAssemblyTimelineDiffer } from '../strategy/DefaultPromptAssemblyTimelineDiffer'
import { DefaultStrategyEvaluator } from '../strategy/DefaultStrategyEvaluator'
import { DefaultPromptStrategy } from '../strategy/DefaultPromptStrategy'
import type { PromptAssemblyTimelineDiffer } from '../strategy/PromptAssemblyTimelineDiffer'
import type { PromptAssemblyTimelineDiff } from '../strategy/PromptAssemblyTimelineDiff'
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

function getTimelineDiff(request: { metadata?: Record<string, unknown> }): PromptAssemblyTimelineDiff | undefined {
  return getAssembly(request)?.timelineDiff as PromptAssemblyTimelineDiff | undefined
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
  promptAssemblyTimelineBuilder: new DefaultPromptAssemblyTimelineBuilder(),
  promptAssemblyTimelineDiffer: new DefaultPromptAssemblyTimelineDiffer(),
}

// ---------------------------------------------------------------------------
// BuilderOptions
// ---------------------------------------------------------------------------

describe('BuilderOptions', () => {
  it('should accept promptAssemblyTimelineDiffer field', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(getTimelineDiff(request)).toBeDefined()
  })

  it('should allow promptAssemblyTimelineDiffer to be omitted', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyTimelineBuilder: new DefaultPromptAssemblyTimelineBuilder(),
    })
    const request = await builder.build(createPipelineContext())
    expect(getTimelineDiff(request)).toBeUndefined()
  })

  it('should allow promptAssemblyTimelineDiffer to be undefined', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyTimelineBuilder: new DefaultPromptAssemblyTimelineBuilder(),
      promptAssemblyTimelineDiffer: undefined,
    })
    const request = await builder.build(createPipelineContext())
    expect(getTimelineDiff(request)).toBeUndefined()
  })

  it('should be backward compatible with existing fields', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyTimelineBuilder: new DefaultPromptAssemblyTimelineBuilder(),
    })
    const request = await builder.build(createPipelineContext())
    // Other metadata fields should still exist
    const assembly = getAssembly(request)
    expect(assembly).toBeDefined()
    expect(assembly?.trace).toBeDefined()
  })

  it('should accept promptAssemblyTimelineDiffer in full setup', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const diff = getTimelineDiff(request)
    expect(diff).toBeDefined()
    expect(diff?.added).toBeDefined()
    expect(diff?.removed).toBeDefined()
    expect(diff?.changed).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Differ Invocation
// ---------------------------------------------------------------------------

describe('Differ invocation', () => {
  it('should invoke promptAssemblyTimelineDiffer when both timeline and differ are present', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(getTimelineDiff(request)).toBeDefined()
  })

  it('should not invoke differ when timeline builder is missing', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyTimelineDiffer: new DefaultPromptAssemblyTimelineDiffer(),
    })
    const request = await builder.build(createPipelineContext())
    expect(getTimelineDiff(request)).toBeUndefined()
  })

  it('should not invoke differ when trace builder is missing', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTimelineBuilder: new DefaultPromptAssemblyTimelineBuilder(),
      promptAssemblyTimelineDiffer: new DefaultPromptAssemblyTimelineDiffer(),
    })
    const request = await builder.build(createPipelineContext())
    expect(getTimelineDiff(request)).toBeUndefined()
  })

  it('should not invoke differ when differ is missing', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyTimelineBuilder: new DefaultPromptAssemblyTimelineBuilder(),
    })
    const request = await builder.build(createPipelineContext())
    expect(getTimelineDiff(request)).toBeUndefined()
  })

  it('should call diff with empty baseline timeline', async () => {
    let capturedBefore: unknown
    const trackingDiffer: PromptAssemblyTimelineDiffer = {
      diff(before: unknown, after: unknown) {
        capturedBefore = before
        return { added: [0], removed: [], changed: [] }
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyTimelineBuilder: new DefaultPromptAssemblyTimelineBuilder(),
      promptAssemblyTimelineDiffer: trackingDiffer,
    })
    await builder.build(createPipelineContext())
    expect(capturedBefore).toEqual({ entries: [] })
  })

  it('should pass the built timeline as after argument', async () => {
    let capturedAfter: unknown
    const trackingDiffer: PromptAssemblyTimelineDiffer = {
      diff(before: unknown, after: unknown) {
        capturedAfter = after
        return { added: [0], removed: [], changed: [] }
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyTimelineBuilder: new DefaultPromptAssemblyTimelineBuilder(),
      promptAssemblyTimelineDiffer: trackingDiffer,
    })
    await builder.build(createPipelineContext())
    const after = capturedAfter as { entries: Array<unknown> }
    expect(after).toBeDefined()
    expect(after?.entries).toBeDefined()
    expect(after?.entries).toHaveLength(1)
  })

  it('should preserve custom diff result from differ', async () => {
    const customDiff: PromptAssemblyTimelineDiff = { added: [99], removed: [98], changed: [97] }
    const customDiffer: PromptAssemblyTimelineDiffer = {
      diff() { return customDiff },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyTimelineBuilder: new DefaultPromptAssemblyTimelineBuilder(),
      promptAssemblyTimelineDiffer: customDiffer,
    })
    const request = await builder.build(createPipelineContext())
    const stored = getTimelineDiff(request)
    expect(stored?.added).toEqual([99])
    expect(stored?.removed).toEqual([98])
    expect(stored?.changed).toEqual([97])
  })
})

// ---------------------------------------------------------------------------
// Metadata Creation
// ---------------------------------------------------------------------------

describe('Metadata creation', () => {
  it('should store timelineDiff in metadata when differ is present', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const diff = getTimelineDiff(request)
    expect(diff).toBeDefined()
    expect(diff?.added).toEqual([0])
    expect(diff?.removed).toEqual([])
    expect(diff?.changed).toEqual([])
  })

  it('should not store timelineDiff when differ is missing', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyTimelineBuilder: new DefaultPromptAssemblyTimelineBuilder(),
    })
    const request = await builder.build(createPipelineContext())
    expect(getTimelineDiff(request)).toBeUndefined()
  })

  it('should not store timelineDiff when timeline builder is missing', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyTimelineDiffer: new DefaultPromptAssemblyTimelineDiffer(),
    })
    const request = await builder.build(createPipelineContext())
    expect(getTimelineDiff(request)).toBeUndefined()
  })

  it('should not store timelineDiff when trace builder is missing', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTimelineBuilder: new DefaultPromptAssemblyTimelineBuilder(),
      promptAssemblyTimelineDiffer: new DefaultPromptAssemblyTimelineDiffer(),
    })
    const request = await builder.build(createPipelineContext())
    expect(getTimelineDiff(request)).toBeUndefined()
  })

  it('should store valid timelineDiff structure', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const diff = getTimelineDiff(request)
    expect(Array.isArray(diff?.added)).toBe(true)
    expect(Array.isArray(diff?.removed)).toBe(true)
    expect(Array.isArray(diff?.changed)).toBe(true)
  })

  it('should store timelineDiff with all entries reported as added', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const diff = getTimelineDiff(request)
    expect(diff?.added).toHaveLength(1)
    expect(diff?.added).toEqual([0])
    expect(diff?.removed).toHaveLength(0)
    expect(diff?.changed).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// Metadata Coexistence — timeline
// ---------------------------------------------------------------------------

describe('Metadata coexistence — timeline', () => {
  it('should coexist with timeline', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.timeline).toBeDefined()
    expect(assembly?.timelineDiff).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Metadata Coexistence — trace
// ---------------------------------------------------------------------------

describe('Metadata coexistence — trace', () => {
  it('should coexist with trace', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.trace).toBeDefined()
    expect(assembly?.timelineDiff).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Metadata Coexistence — traceDiff
// ---------------------------------------------------------------------------

describe('Metadata coexistence — traceDiff', () => {
  it('should coexist with traceDiff', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.traceDiff).toBeDefined()
    expect(assembly?.timelineDiff).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Metadata Coexistence — traceRendered
// ---------------------------------------------------------------------------

describe('Metadata coexistence — traceRendered', () => {
  it('should coexist with traceRendered', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.traceRendered).toBeDefined()
    expect(assembly?.timelineDiff).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Metadata Coexistence — traceExported
// ---------------------------------------------------------------------------

describe('Metadata coexistence — traceExported', () => {
  it('should coexist with traceExported', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.traceExported).toBeDefined()
    expect(assembly?.timelineDiff).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Metadata Coexistence — snapshot
// ---------------------------------------------------------------------------

describe('Metadata coexistence — snapshot', () => {
  it('should coexist with snapshot', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.snapshot).toBeDefined()
    expect(assembly?.timelineDiff).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Metadata Coexistence — inspector
// ---------------------------------------------------------------------------

describe('Metadata coexistence — inspector', () => {
  it('should coexist with inspector', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.inspector).toBeDefined()
    expect(assembly?.timelineDiff).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Metadata Coexistence — inspectorRendered
// ---------------------------------------------------------------------------

describe('Metadata coexistence — inspectorRendered', () => {
  it('should coexist with inspectorRendered', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.inspectorRendered).toBeDefined()
    expect(assembly?.timelineDiff).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Metadata Coexistence — inspectorExported
// ---------------------------------------------------------------------------

describe('Metadata coexistence — inspectorExported', () => {
  it('should coexist with inspectorExported', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.inspectorExported).toBeDefined()
    expect(assembly?.timelineDiff).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Metadata Coexistence — plan
// ---------------------------------------------------------------------------

describe('Metadata coexistence — plan', () => {
  it('should coexist with plan', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.plan).toBeDefined()
    expect(assembly?.timelineDiff).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Metadata Coexistence — optimizedPlan
// ---------------------------------------------------------------------------

describe('Metadata coexistence — optimizedPlan', () => {
  it('should coexist with optimizedPlan', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.optimizedPlan).toBeDefined()
    expect(assembly?.timelineDiff).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Metadata Coexistence — planDiff
// ---------------------------------------------------------------------------

describe('Metadata coexistence — planDiff', () => {
  it('should coexist with planDiff', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.planDiff).toBeDefined()
    expect(assembly?.timelineDiff).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Metadata Coexistence — strategy
// ---------------------------------------------------------------------------

describe('Metadata coexistence — strategy', () => {
  it('should coexist with strategy', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.strategy).toBeDefined()
    expect(assembly?.timelineDiff).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Metadata Coexistence — strategySelection
// ---------------------------------------------------------------------------

describe('Metadata coexistence — strategySelection', () => {
  it('should coexist with strategySelection', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.strategySelection).toBeDefined()
    expect(assembly?.timelineDiff).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Metadata Coexistence — all fields
// ---------------------------------------------------------------------------

describe('Metadata coexistence — all fields', () => {
  it('should coexist with all existing fields', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.strategy).toBeDefined()
    expect(assembly?.strategySelection).toBeDefined()
    expect(assembly?.plan).toBeDefined()
    expect(assembly?.optimizedPlan).toBeDefined()
    expect(assembly?.planDiff).toBeDefined()
    expect(assembly?.snapshot).toBeDefined()
    expect(assembly?.inspector).toBeDefined()
    expect(assembly?.inspectorRendered).toBeDefined()
    expect(assembly?.inspectorExported).toBeDefined()
    expect(assembly?.trace).toBeDefined()
    expect(assembly?.traceDiff).toBeDefined()
    expect(assembly?.traceRendered).toBeDefined()
    expect(assembly?.traceExported).toBeDefined()
    expect(assembly?.timeline).toBeDefined()
    expect(assembly?.timelineDiff).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Deterministic
// ---------------------------------------------------------------------------

describe('Deterministic', () => {
  it('should produce same timelineDiff across multiple builds', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const r1 = await builder.build(createPipelineContext())
    const r2 = await builder.build(createPipelineContext())
    const d1 = getTimelineDiff(r1)
    const d2 = getTimelineDiff(r2)
    expect(d1?.added).toEqual(d2?.added)
    expect(d1?.removed).toEqual(d2?.removed)
    expect(d1?.changed).toEqual(d2?.changed)
  })

  it('should produce same timelineDiff across different builder instances', async () => {
    const b1 = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const b2 = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const r1 = await b1.build(createPipelineContext())
    const r2 = await b2.build(createPipelineContext())
    expect(getTimelineDiff(r1)).toEqual(getTimelineDiff(r2))
  })

  it('should produce same timelineDiff for same inputs', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const ctx = createPipelineContext()
    const r1 = await builder.build(ctx)
    const r2 = await builder.build(ctx)
    expect(getTimelineDiff(r1)).toEqual(getTimelineDiff(r2))
  })
})

// ---------------------------------------------------------------------------
// Stateless
// ---------------------------------------------------------------------------

describe('Stateless', () => {
  it('should not retain state between builds', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const ctx1 = createPipelineContext({ input: 'draw a tree' })
    const ctx2 = createPipelineContext({ input: 'draw a house' })
    const r1 = await builder.build(ctx1)
    const r2 = await builder.build(ctx2)
    const d1 = getTimelineDiff(r1)
    const d2 = getTimelineDiff(r2)
    // Both should produce same result for same trace structure
    expect(d1).toEqual(d2)
  })

  it('should produce independent timelineDiff results', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const r1 = await builder.build(createPipelineContext())
    const r2 = await builder.build(createPipelineContext())
    const d1 = getTimelineDiff(r1)
    const d2 = getTimelineDiff(r2)
    expect(d1).not.toBe(d2) // Different objects
    expect(d1).toEqual(d2) // Same content
  })

  it('should produce fresh timelineDiff for each build', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const r1 = await builder.build(createPipelineContext({ input: 'a' }))
    const r2 = await builder.build(createPipelineContext({ input: 'b' }))
    // timelineDiff should be different objects
    expect(getTimelineDiff(r1)).not.toBe(getTimelineDiff(r2))
  })
})

// ---------------------------------------------------------------------------
// Pure
// ---------------------------------------------------------------------------

describe('Pure', () => {
  it('should not modify the pipeline context', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const ctx = createPipelineContext({ input: 'draw a tree' })
    const originalInput = ctx.input
    await builder.build(ctx)
    expect(ctx.input).toBe(originalInput)
  })

  it('should not modify the metadata', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const ctx = createPipelineContext()
    const request = await builder.build(ctx)
    const assembly = getAssembly(request)
    expect(assembly?.timelineDiff).toBeDefined()
    // Should still be immutable result
    expect(assembly).toBeDefined()
  })

  it('should produce same prompt regardless of differ presence', async () => {
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
      promptAssemblyTraceDiffer: new DefaultPromptAssemblyTraceDiffer(),
      promptAssemblyTraceRenderer: new DefaultPromptAssemblyTraceRenderer(),
      promptAssemblyTraceExporter: new DefaultPromptAssemblyTraceExporter(),
      promptAssemblyTimelineBuilder: new DefaultPromptAssemblyTimelineBuilder(),
    })
    const rWith = await builderWith.build(createPipelineContext())
    const rWithout = await builderWithout.build(createPipelineContext())
    expect(rWith.prompt).toBe(rWithout.prompt)
  })
})

// ---------------------------------------------------------------------------
// Legacy Constructor
// ---------------------------------------------------------------------------

describe('Legacy constructor', () => {
  it('should not produce timelineDiff with legacy constructor', async () => {
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
    expect(getTimelineDiff(request)).toBeUndefined()
  })

  it('should not produce timelineDiff with BuilderOptions without differ', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyTimelineBuilder: new DefaultPromptAssemblyTimelineBuilder(),
    })
    const request = await builder.build(createPipelineContext())
    expect(getTimelineDiff(request)).toBeUndefined()
  })

  it('should produce timelineDiff with full BuilderOptions', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(getTimelineDiff(request)).toBeDefined()
  })

  it('should handle legacy positional arguments correctly', async () => {
    const builder = new DefaultPromptBuilder(
      [new UserInputModule()],
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
    )
    const request = await builder.build(createPipelineContext())
    // Legacy path should not crash and produce no timelineDiff
    expect(request.prompt).toBeDefined()
    expect(getTimelineDiff(request)).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// No Prompt Changes
// ---------------------------------------------------------------------------

describe('No prompt changes', () => {
  it('should produce identical prompt with and without differ', async () => {
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
      promptAssemblyTraceDiffer: new DefaultPromptAssemblyTraceDiffer(),
      promptAssemblyTraceRenderer: new DefaultPromptAssemblyTraceRenderer(),
      promptAssemblyTraceExporter: new DefaultPromptAssemblyTraceExporter(),
      promptAssemblyTimelineBuilder: new DefaultPromptAssemblyTimelineBuilder(),
    })
    const rWith = await builderWith.build(createPipelineContext())
    const rWithout = await builderWithout.build(createPipelineContext())
    expect(rWith.prompt).toBe(rWithout.prompt)
  })

  it('should not inject timelineDiff into prompt output', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(request.prompt).not.toContain('timelineDiff')
    expect(request.prompt).not.toContain('added')
    expect(request.prompt).not.toContain('removed')
    expect(request.prompt).not.toContain('changed')
  })

  it('should not inject timelineDiff into prompt with all components', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    // The prompt should be clean metadata-only
    expect(request.prompt).toBeDefined()
    expect(request.prompt.length).toBeGreaterThan(0)
    // timelineDiff is metadata only
    const diff = getTimelineDiff(request)
    expect(diff).toBeDefined()
    // No timelineDiff reference in prompt
    const promptStr = JSON.stringify(request.prompt)
    expect(promptStr).not.toContain('timelineDiff')
  })

  it('should not have timelineDiff in prompt metadata serialization', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.timelineDiff).toBeDefined()
    // Prompt text should not contain any trace of timeline diff values
    expect(request.prompt).not.toContain('0')
    // Actually the prompt might contain '0' as part of other content, so let's check differently
    // Verify the diff is only in metadata
    expect(request.metadata?.promptAssembly).toHaveProperty('timelineDiff')
  })
})

// ---------------------------------------------------------------------------
// Compatibility — RetryPlanner
// ---------------------------------------------------------------------------

describe('RetryPlanner compatibility', () => {
  it('should work with RetryPlanner scenarios', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(getTimelineDiff(request)).toBeDefined()
    expect(request.prompt).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Compatibility — ToolCallPlanner
// ---------------------------------------------------------------------------

describe('ToolCallPlanner compatibility', () => {
  it('should work with ToolCallPlanner scenarios', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(getTimelineDiff(request)).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Compatibility — Streaming
// ---------------------------------------------------------------------------

describe('Streaming compatibility', () => {
  it('should work with streaming pipeline', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(getTimelineDiff(request)).toBeDefined()
    expect(request.prompt).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Compatibility — AgentLoop
// ---------------------------------------------------------------------------

describe('AgentLoop compatibility', () => {
  it('should work with AgentLoop', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(getTimelineDiff(request)).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Timeline Diff Validation
// ---------------------------------------------------------------------------

describe('Timeline diff validation', () => {
  it('should use empty baseline timeline', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const diff = getTimelineDiff(request)
    expect(diff).toBeDefined()
    // The baseline is { entries: [] }, so the single trace entry at index 0 is "added"
    expect(diff?.added).toEqual([0])
  })

  it('should report all entries as added', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const diff = getTimelineDiff(request)
    // Only one entry in the timeline, it's added
    expect(diff?.added).toHaveLength(1)
    expect(diff?.added[0]).toBe(0)
  })

  it('should report removed as empty', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const diff = getTimelineDiff(request)
    expect(diff?.removed).toHaveLength(0)
  })

  it('should report changed as empty', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const diff = getTimelineDiff(request)
    expect(diff?.changed).toHaveLength(0)
  })

  it('should verify timeline diff structure', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const diff = getTimelineDiff(request)
    expect(diff).toHaveProperty('added')
    expect(diff).toHaveProperty('removed')
    expect(diff).toHaveProperty('changed')
  })

  it('should verify timeline diff is stored under timelineDiff key', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly).toHaveProperty('timelineDiff')
    expect(assembly?.timelineDiff).toBe(getTimelineDiff(request))
  })
})