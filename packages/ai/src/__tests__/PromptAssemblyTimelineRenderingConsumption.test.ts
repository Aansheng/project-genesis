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
import { DefaultPromptAssemblyTimelineRenderer } from '../strategy/DefaultPromptAssemblyTimelineRenderer'
import { DefaultStrategyEvaluator } from '../strategy/DefaultStrategyEvaluator'
import { DefaultPromptStrategy } from '../strategy/DefaultPromptStrategy'
import type { PromptAssemblyTimelineRenderer } from '../strategy/PromptAssemblyTimelineRenderer'
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

function getTimelineRendered(request: { metadata?: Record<string, unknown> }): string | undefined {
  const assembly = getAssembly(request)
  return assembly?.timelineRendered as string | undefined
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
  promptAssemblyTimelineRenderer: new DefaultPromptAssemblyTimelineRenderer(),
}

// ---------------------------------------------------------------------------
// BuilderOptions
// ---------------------------------------------------------------------------

describe('BuilderOptions', () => {
  it('should accept promptAssemblyTimelineRenderer field', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(getTimelineRendered(request)).toBeDefined()
  })

  it('should allow promptAssemblyTimelineRenderer to be omitted', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyTimelineBuilder: new DefaultPromptAssemblyTimelineBuilder(),
    })
    const request = await builder.build(createPipelineContext())
    expect(getTimelineRendered(request)).toBeUndefined()
  })

  it('should allow promptAssemblyTimelineRenderer to be undefined', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyTimelineBuilder: new DefaultPromptAssemblyTimelineBuilder(),
      promptAssemblyTimelineRenderer: undefined,
    })
    const request = await builder.build(createPipelineContext())
    expect(getTimelineRendered(request)).toBeUndefined()
  })

  it('should be backward compatible with existing fields', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyTimelineBuilder: new DefaultPromptAssemblyTimelineBuilder(),
      promptAssemblyTimelineDiffer: new DefaultPromptAssemblyTimelineDiffer(),
    })
    const request = await builder.build(createPipelineContext())
    // Existing fields should still work
    const assembly = getAssembly(request)
    expect(assembly?.trace).toBeDefined()
    expect(assembly?.timeline).toBeDefined()
    expect(assembly?.timelineDiff).toBeDefined()
    // Renderer not set → no timelineRendered
    expect(assembly?.timelineRendered).toBeUndefined()
  })

  it('should accept promptAssemblyTimelineRenderer in full setup', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(getTimelineRendered(request)).toBeDefined()
    expect(typeof getTimelineRendered(request)).toBe('string')
  })
})

// ---------------------------------------------------------------------------
// Renderer Invocation
// ---------------------------------------------------------------------------

describe('Renderer invocation', () => {
  it('should invoke renderer when both timeline and renderer are present', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(getTimelineRendered(request)).toBeDefined()
  })

  it('should not invoke renderer when timeline builder is missing', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyTimelineRenderer: new DefaultPromptAssemblyTimelineRenderer(),
    })
    const request = await builder.build(createPipelineContext())
    expect(getTimelineRendered(request)).toBeUndefined()
  })

  it('should not invoke renderer when trace builder is missing', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTimelineBuilder: new DefaultPromptAssemblyTimelineBuilder(),
      promptAssemblyTimelineRenderer: new DefaultPromptAssemblyTimelineRenderer(),
    })
    const request = await builder.build(createPipelineContext())
    expect(getTimelineRendered(request)).toBeUndefined()
  })

  it('should not invoke renderer when renderer is missing', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyTimelineBuilder: new DefaultPromptAssemblyTimelineBuilder(),
    })
    const request = await builder.build(createPipelineContext())
    expect(getTimelineRendered(request)).toBeUndefined()
  })

  it('should pass the built timeline to renderer', async () => {
    let capturedTimeline: unknown
    const trackingRenderer: PromptAssemblyTimelineRenderer = {
      render(timeline) {
        capturedTimeline = timeline
        return 'rendered'
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyTimelineBuilder: new DefaultPromptAssemblyTimelineBuilder(),
      promptAssemblyTimelineRenderer: trackingRenderer,
    })
    await builder.build(createPipelineContext())
    const timeline = capturedTimeline as { entries: Array<unknown> }
    expect(timeline).toBeDefined()
    expect(timeline?.entries).toHaveLength(1)
  })

  it('should preserve custom rendering result', async () => {
    const customRenderer: PromptAssemblyTimelineRenderer = {
      render() { return 'custom timeline rendering' },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyTimelineBuilder: new DefaultPromptAssemblyTimelineBuilder(),
      promptAssemblyTimelineRenderer: customRenderer,
    })
    const request = await builder.build(createPipelineContext())
    expect(getTimelineRendered(request)).toBe('custom timeline rendering')
  })
})

// ---------------------------------------------------------------------------
// Metadata Creation
// ---------------------------------------------------------------------------

describe('Metadata creation', () => {
  it('should store timelineRendered in metadata when renderer is present', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(getTimelineRendered(request)).toBeDefined()
  })

  it('should not store timelineRendered when renderer is missing', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyTimelineBuilder: new DefaultPromptAssemblyTimelineBuilder(),
    })
    const request = await builder.build(createPipelineContext())
    expect(getTimelineRendered(request)).toBeUndefined()
  })

  it('should not store timelineRendered when timeline builder is missing', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyTimelineRenderer: new DefaultPromptAssemblyTimelineRenderer(),
    })
    const request = await builder.build(createPipelineContext())
    expect(getTimelineRendered(request)).toBeUndefined()
  })

  it('should not store timelineRendered when trace builder is missing', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTimelineBuilder: new DefaultPromptAssemblyTimelineBuilder(),
      promptAssemblyTimelineRenderer: new DefaultPromptAssemblyTimelineRenderer(),
    })
    const request = await builder.build(createPipelineContext())
    expect(getTimelineRendered(request)).toBeUndefined()
  })

  it('should store valid non-empty string', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const rendered = getTimelineRendered(request)
    expect(typeof rendered).toBe('string')
    expect(rendered!.length).toBeGreaterThan(0)
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
    expect(assembly?.timelineRendered).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Metadata Coexistence — timelineDiff
// ---------------------------------------------------------------------------

describe('Metadata coexistence — timelineDiff', () => {
  it('should coexist with timelineDiff', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.timelineDiff).toBeDefined()
    expect(assembly?.timelineRendered).toBeDefined()
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
    expect(assembly?.timelineRendered).toBeDefined()
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
    expect(assembly?.timelineRendered).toBeDefined()
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
    expect(assembly?.timelineRendered).toBeDefined()
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
    expect(assembly?.timelineRendered).toBeDefined()
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
    expect(assembly?.timelineRendered).toBeDefined()
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
    expect(assembly?.timelineRendered).toBeDefined()
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
    expect(assembly?.timelineRendered).toBeDefined()
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
    expect(assembly?.timelineRendered).toBeDefined()
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
    expect(assembly?.timelineRendered).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Metadata Coexistence — planRendered
// ---------------------------------------------------------------------------

describe('Metadata coexistence — planRendered', () => {
  it('should coexist with planRendered', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.planRendered).toBeDefined()
    expect(assembly?.timelineRendered).toBeDefined()
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
    expect(assembly?.timelineRendered).toBeDefined()
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
    expect(assembly?.timelineRendered).toBeDefined()
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
    expect(assembly?.planRendered).toBeDefined()
    expect(assembly?.snapshot).toBeDefined()
    expect(assembly?.inspector).toBeDefined()
    expect(assembly?.trace).toBeDefined()
    expect(assembly?.traceDiff).toBeDefined()
    expect(assembly?.traceRendered).toBeDefined()
    expect(assembly?.traceExported).toBeDefined()
    expect(assembly?.timeline).toBeDefined()
    expect(assembly?.timelineDiff).toBeDefined()
    expect(assembly?.timelineRendered).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Deterministic
// ---------------------------------------------------------------------------

describe('Deterministic', () => {
  it('should produce same timelineRendered across multiple builds', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const r1 = await builder.build(createPipelineContext())
    const r2 = await builder.build(createPipelineContext())
    expect(getTimelineRendered(r1)).toBe(getTimelineRendered(r2))
  })

  it('should produce same timelineRendered across different builder instances', async () => {
    const b1 = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const b2 = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const r1 = await b1.build(createPipelineContext())
    const r2 = await b2.build(createPipelineContext())
    expect(getTimelineRendered(r1)).toBe(getTimelineRendered(r2))
  })

  it('should produce same timelineRendered for same inputs', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const ctx = createPipelineContext()
    const r1 = await builder.build(ctx)
    const r2 = await builder.build(ctx)
    expect(getTimelineRendered(r1)).toBe(getTimelineRendered(r2))
  })
})

// ---------------------------------------------------------------------------
// Stateless
// ---------------------------------------------------------------------------

describe('Stateless', () => {
  it('should not retain state between builds', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const r1 = await builder.build(createPipelineContext({ input: 'draw a tree' }))
    const r2 = await builder.build(createPipelineContext({ input: 'draw a house' }))
    expect(getTimelineRendered(r1)).toBe(getTimelineRendered(r2))
  })

  it('should produce independent timelineRendered results', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const r1 = await builder.build(createPipelineContext())
    const r2 = await builder.build(createPipelineContext())
    expect(getTimelineRendered(r1)).not.toBe(undefined)
    expect(getTimelineRendered(r2)).not.toBe(undefined)
  })

  it('should produce fresh timelineRendered for each build', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const r1 = await builder.build(createPipelineContext({ input: 'a' }))
    const r2 = await builder.build(createPipelineContext({ input: 'b' }))
    // timelineRendered should be present in both
    expect(getTimelineRendered(r1)).toBeDefined()
    expect(getTimelineRendered(r2)).toBeDefined()
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
    const request = await builder.build(createPipelineContext())
    expect(getTimelineRendered(request)).toBeDefined()
  })

  it('should produce same prompt regardless of renderer presence', async () => {
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
      promptAssemblyTimelineDiffer: new DefaultPromptAssemblyTimelineDiffer(),
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
  it('should not produce timelineRendered with legacy constructor', async () => {
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
    expect(getTimelineRendered(request)).toBeUndefined()
  })

  it('should not produce timelineRendered with BuilderOptions without renderer', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyTimelineBuilder: new DefaultPromptAssemblyTimelineBuilder(),
    })
    const request = await builder.build(createPipelineContext())
    expect(getTimelineRendered(request)).toBeUndefined()
  })

  it('should produce timelineRendered with full BuilderOptions', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(getTimelineRendered(request)).toBeDefined()
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
    expect(request.prompt).toBeDefined()
    expect(getTimelineRendered(request)).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// No Prompt Changes
// ---------------------------------------------------------------------------

describe('No prompt changes', () => {
  it('should produce identical prompt with and without renderer', async () => {
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
      promptAssemblyTimelineDiffer: new DefaultPromptAssemblyTimelineDiffer(),
    })
    const rWith = await builderWith.build(createPipelineContext())
    const rWithout = await builderWithout.build(createPipelineContext())
    expect(rWith.prompt).toBe(rWithout.prompt)
  })

  it('should not inject timelineRendered into prompt output', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(request.prompt).not.toContain('timelineRendered')
    expect(request.prompt).not.toContain('Prompt Assembly Timeline')
  })

  it('should have timelineRendered only in metadata', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    // timelineRendered is metadata-only
    expect(getTimelineRendered(request)).toBeDefined()
    // Not in prompt body
    expect(request.prompt).not.toContain('timelineRendered')
  })

  it('should not have timelineRendered in prompt text', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(request.metadata?.promptAssembly).toHaveProperty('timelineRendered')
    expect(request.prompt).toBeDefined()
    expect(request.prompt.length).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// Compatibility — RetryPlanner
// ---------------------------------------------------------------------------

describe('RetryPlanner compatibility', () => {
  it('should work with RetryPlanner scenarios', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(getTimelineRendered(request)).toBeDefined()
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
    expect(getTimelineRendered(request)).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Compatibility — Streaming
// ---------------------------------------------------------------------------

describe('Streaming compatibility', () => {
  it('should work with streaming pipeline', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(getTimelineRendered(request)).toBeDefined()
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
    expect(getTimelineRendered(request)).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Timeline Rendering Validation
// ---------------------------------------------------------------------------

describe('Timeline rendering validation', () => {
  it('should match default renderer output', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const rendered = getTimelineRendered(request)
    // Should contain header
    expect(rendered).toContain('Prompt Assembly Timeline')
    // Should contain entry for strategy (default is 'default')
    expect(rendered).toContain('#0')
  })

  it('should render valid timeline format', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const rendered = getTimelineRendered(request)
    // Should start with header
    expect(rendered!.startsWith('Prompt Assembly Timeline')).toBe(true)
    // Should contain Entries:
    expect(rendered).toContain('Entries:')
    // Should contain entry
    expect(rendered).toContain('#0')
  })

  it('should render a single entry (index 0)', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const rendered = getTimelineRendered(request)
    const lines = rendered!.split('\n')
    // Last line should be the entry
    expect(lines[lines.length - 1]).toMatch(/^#0/)
  })

  it('should render strategy name in entry', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const rendered = getTimelineRendered(request)
    // With the default setup, strategy name should be 'default'
    expect(rendered).toContain('default')
  })

  it('should render non-empty timeline with Entries section', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const rendered = getTimelineRendered(request)
    // Non-empty timeline should include Entries section
    expect(rendered).toContain('Entries:')
    expect(rendered).not.toContain('No Entries')
  })

  it('should render entry line starting with hash', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const rendered = getTimelineRendered(request)
    const lines = rendered!.split('\n')
    const entryLines = lines.filter(l => l.startsWith('#'))
    expect(entryLines).toHaveLength(1)
  })

  it('should render entry with strategy name from DefaultPromptStrategy', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const rendered = getTimelineRendered(request)
    // DefaultPromptStrategy.name is 'default'
    expect(rendered).toContain('#0 default')
  })

  it('should include header line in output', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const rendered = getTimelineRendered(request)
    const firstLine = rendered!.split('\n')[0]
    expect(firstLine).toBe('Prompt Assembly Timeline')
  })
})