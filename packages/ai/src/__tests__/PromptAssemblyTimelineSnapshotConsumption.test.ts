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
import { DefaultPromptAssemblyTimelineExporter } from '../strategy/DefaultPromptAssemblyTimelineExporter'
import { DefaultPromptAssemblyTimelineSnapshotBuilder } from '../strategy/DefaultPromptAssemblyTimelineSnapshotBuilder'
import { DefaultStrategyEvaluator } from '../strategy/DefaultStrategyEvaluator'
import { DefaultPromptStrategy } from '../strategy/DefaultPromptStrategy'
import type { PromptAssemblyTimelineSnapshotBuilder } from '../strategy/PromptAssemblyTimelineSnapshotBuilder'
import type { PromptAssemblyTimelineSnapshot } from '../strategy/PromptAssemblyTimelineSnapshot'
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

function getTimelineSnapshot(request: { metadata?: Record<string, unknown> }): Record<string, unknown> | undefined {
  const assembly = getAssembly(request)
  return assembly?.timelineSnapshot as Record<string, unknown> | undefined
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
  promptAssemblyTimelineExporter: new DefaultPromptAssemblyTimelineExporter(),
  promptAssemblyTimelineSnapshotBuilder: new DefaultPromptAssemblyTimelineSnapshotBuilder(),
}

// ---------------------------------------------------------------------------
// BuilderOptions
// ---------------------------------------------------------------------------

describe('BuilderOptions', () => {
  it('should accept promptAssemblyTimelineSnapshotBuilder field', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(getTimelineSnapshot(request)).toBeDefined()
  })

  it('should allow promptAssemblyTimelineSnapshotBuilder to be omitted', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyTimelineBuilder: new DefaultPromptAssemblyTimelineBuilder(),
    })
    const request = await builder.build(createPipelineContext())
    expect(getTimelineSnapshot(request)).toBeUndefined()
  })

  it('should allow promptAssemblyTimelineSnapshotBuilder to be undefined', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyTimelineBuilder: new DefaultPromptAssemblyTimelineBuilder(),
      promptAssemblyTimelineSnapshotBuilder: undefined,
    })
    const request = await builder.build(createPipelineContext())
    expect(getTimelineSnapshot(request)).toBeUndefined()
  })

  it('should be backward compatible with existing fields', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyTimelineBuilder: new DefaultPromptAssemblyTimelineBuilder(),
      promptAssemblyTimelineDiffer: new DefaultPromptAssemblyTimelineDiffer(),
      promptAssemblyTimelineRenderer: new DefaultPromptAssemblyTimelineRenderer(),
      promptAssemblyTimelineExporter: new DefaultPromptAssemblyTimelineExporter(),
    })
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.trace).toBeDefined()
    expect(assembly?.timeline).toBeDefined()
    expect(assembly?.timelineDiff).toBeDefined()
    expect(assembly?.timelineRendered).toBeDefined()
    expect(assembly?.timelineExported).toBeDefined()
    expect(assembly?.timelineSnapshot).toBeUndefined()
  })

  it('should accept promptAssemblyTimelineSnapshotBuilder in full setup', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(getTimelineSnapshot(request)).toBeDefined()
    expect(typeof getTimelineSnapshot(request)).toBe('object')
  })
})

// ---------------------------------------------------------------------------
// Snapshot Builder Invocation
// ---------------------------------------------------------------------------

describe('Snapshot builder invocation', () => {
  it('should invoke builder when both timeline and builder are present', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(getTimelineSnapshot(request)).toBeDefined()
  })

  it('should not invoke builder when timeline builder is missing', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyTimelineSnapshotBuilder: new DefaultPromptAssemblyTimelineSnapshotBuilder(),
    })
    const request = await builder.build(createPipelineContext())
    expect(getTimelineSnapshot(request)).toBeUndefined()
  })

  it('should not invoke builder when trace builder is missing', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTimelineBuilder: new DefaultPromptAssemblyTimelineBuilder(),
      promptAssemblyTimelineSnapshotBuilder: new DefaultPromptAssemblyTimelineSnapshotBuilder(),
    })
    const request = await builder.build(createPipelineContext())
    expect(getTimelineSnapshot(request)).toBeUndefined()
  })

  it('should not invoke builder when snapshot builder is missing', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyTimelineBuilder: new DefaultPromptAssemblyTimelineBuilder(),
    })
    const request = await builder.build(createPipelineContext())
    expect(getTimelineSnapshot(request)).toBeUndefined()
  })

  it('should pass the built timeline to builder', async () => {
    let capturedTimeline: unknown
    let capturedMetadata: unknown
    const trackingBuilder: PromptAssemblyTimelineSnapshotBuilder = {
      build(timeline, metadata) {
        capturedTimeline = timeline
        capturedMetadata = metadata
        return { entryCount: 1, firstStrategy: 'create', lastStrategy: 'create', strategies: ['create'] }
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyTimelineBuilder: new DefaultPromptAssemblyTimelineBuilder(),
      promptAssemblyTimelineSnapshotBuilder: trackingBuilder,
    })
    await builder.build(createPipelineContext())
    const timeline = capturedTimeline as { entries: Array<unknown> }
    expect(timeline).toBeDefined()
    expect(timeline?.entries).toHaveLength(1)
  })

  it('should pass metadata with timelineRendered and timelineExported', async () => {
    let capturedMetadata: Record<string, unknown> | undefined
    const trackingBuilder: PromptAssemblyTimelineSnapshotBuilder = {
      build(timeline, metadata) {
        capturedMetadata = metadata
        return { entryCount: 1, firstStrategy: 'create', lastStrategy: 'create', strategies: ['create'] }
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyTimelineBuilder: new DefaultPromptAssemblyTimelineBuilder(),
      promptAssemblyTimelineRenderer: new DefaultPromptAssemblyTimelineRenderer(),
      promptAssemblyTimelineExporter: new DefaultPromptAssemblyTimelineExporter(),
      promptAssemblyTimelineSnapshotBuilder: trackingBuilder,
    })
    await builder.build(createPipelineContext())
    expect(capturedMetadata).toBeDefined()
    expect(capturedMetadata).toHaveProperty('timelineRendered')
    expect(capturedMetadata).toHaveProperty('timelineExported')
  })

  it('should preserve custom snapshot result', async () => {
    const customBuilder: PromptAssemblyTimelineSnapshotBuilder = {
      build() {
        return { entryCount: 42, firstStrategy: 'custom', lastStrategy: 'custom', strategies: ['custom'] }
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyTimelineBuilder: new DefaultPromptAssemblyTimelineBuilder(),
      promptAssemblyTimelineSnapshotBuilder: customBuilder,
    })
    const request = await builder.build(createPipelineContext())
    const snapshot = getTimelineSnapshot(request)
    expect(snapshot?.entryCount).toBe(42)
    expect(snapshot?.firstStrategy).toBe('custom')
  })
})

// ---------------------------------------------------------------------------
// Metadata Creation
// ---------------------------------------------------------------------------

describe('Metadata creation', () => {
  it('should store timelineSnapshot in metadata when builder is present', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(getTimelineSnapshot(request)).toBeDefined()
  })

  it('should not store timelineSnapshot when builder is missing', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyTimelineBuilder: new DefaultPromptAssemblyTimelineBuilder(),
    })
    const request = await builder.build(createPipelineContext())
    expect(getTimelineSnapshot(request)).toBeUndefined()
  })

  it('should not store timelineSnapshot when timeline builder is missing', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyTimelineSnapshotBuilder: new DefaultPromptAssemblyTimelineSnapshotBuilder(),
    })
    const request = await builder.build(createPipelineContext())
    expect(getTimelineSnapshot(request)).toBeUndefined()
  })

  it('should not store timelineSnapshot when trace builder is missing', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTimelineBuilder: new DefaultPromptAssemblyTimelineBuilder(),
      promptAssemblyTimelineSnapshotBuilder: new DefaultPromptAssemblyTimelineSnapshotBuilder(),
    })
    const request = await builder.build(createPipelineContext())
    expect(getTimelineSnapshot(request)).toBeUndefined()
  })

  it('should store snapshot with correct shape', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const snapshot = getTimelineSnapshot(request)
    expect(snapshot).toHaveProperty('entryCount')
    expect(snapshot).toHaveProperty('firstStrategy')
    expect(snapshot).toHaveProperty('lastStrategy')
    expect(snapshot).toHaveProperty('strategies')
  })

  it('should store snapshot with valid entryCount', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const snapshot = getTimelineSnapshot(request)
    expect(snapshot?.entryCount).toBe(1)
  })

  it('should store snapshot with correct firstStrategy', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const snapshot = getTimelineSnapshot(request)
    expect(snapshot?.firstStrategy).toBe('default')
  })
})

// ---------------------------------------------------------------------------
// Metadata Coexistence
// ---------------------------------------------------------------------------

describe('Metadata coexistence — timeline', () => {
  it('should coexist with timeline', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.timeline).toBeDefined()
    expect(assembly?.timelineSnapshot).toBeDefined()
  })
})

describe('Metadata coexistence — timelineDiff', () => {
  it('should coexist with timelineDiff', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.timelineDiff).toBeDefined()
    expect(assembly?.timelineSnapshot).toBeDefined()
  })
})

describe('Metadata coexistence — timelineRendered', () => {
  it('should coexist with timelineRendered', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.timelineRendered).toBeDefined()
    expect(assembly?.timelineSnapshot).toBeDefined()
  })
})

describe('Metadata coexistence — timelineExported', () => {
  it('should coexist with timelineExported', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.timelineExported).toBeDefined()
    expect(assembly?.timelineSnapshot).toBeDefined()
  })
})

describe('Metadata coexistence — trace', () => {
  it('should coexist with trace', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.trace).toBeDefined()
    expect(assembly?.timelineSnapshot).toBeDefined()
  })
})

describe('Metadata coexistence — traceDiff', () => {
  it('should coexist with traceDiff', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.traceDiff).toBeDefined()
    expect(assembly?.timelineSnapshot).toBeDefined()
  })
})

describe('Metadata coexistence — traceRendered', () => {
  it('should coexist with traceRendered', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.traceRendered).toBeDefined()
    expect(assembly?.timelineSnapshot).toBeDefined()
  })
})

describe('Metadata coexistence — traceExported', () => {
  it('should coexist with traceExported', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.traceExported).toBeDefined()
    expect(assembly?.timelineSnapshot).toBeDefined()
  })
})

describe('Metadata coexistence — snapshot', () => {
  it('should coexist with snapshot', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.snapshot).toBeDefined()
    expect(assembly?.timelineSnapshot).toBeDefined()
  })
})

describe('Metadata coexistence — inspector', () => {
  it('should coexist with inspector', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.inspector).toBeDefined()
    expect(assembly?.timelineSnapshot).toBeDefined()
  })
})

describe('Metadata coexistence — inspectorRendered', () => {
  it('should coexist with inspectorRendered', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.inspectorRendered).toBeDefined()
    expect(assembly?.timelineSnapshot).toBeDefined()
  })
})

describe('Metadata coexistence — inspectorExported', () => {
  it('should coexist with inspectorExported', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.inspectorExported).toBeDefined()
    expect(assembly?.timelineSnapshot).toBeDefined()
  })
})

describe('Metadata coexistence — plan', () => {
  it('should coexist with plan', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.plan).toBeDefined()
    expect(assembly?.timelineSnapshot).toBeDefined()
  })
})

describe('Metadata coexistence — optimizedPlan', () => {
  it('should coexist with optimizedPlan', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.optimizedPlan).toBeDefined()
    expect(assembly?.timelineSnapshot).toBeDefined()
  })
})

describe('Metadata coexistence — planDiff', () => {
  it('should coexist with planDiff', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.planDiff).toBeDefined()
    expect(assembly?.timelineSnapshot).toBeDefined()
  })
})

describe('Metadata coexistence — planRendered', () => {
  it('should coexist with planRendered', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.planRendered).toBeDefined()
    expect(assembly?.timelineSnapshot).toBeDefined()
  })
})

describe('Metadata coexistence — strategy', () => {
  it('should coexist with strategy', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.strategy).toBeDefined()
    expect(assembly?.timelineSnapshot).toBeDefined()
  })
})

describe('Metadata coexistence — strategySelection', () => {
  it('should coexist with strategySelection', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.strategySelection).toBeDefined()
    expect(assembly?.timelineSnapshot).toBeDefined()
  })
})

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
    expect(assembly?.inspectorRendered).toBeDefined()
    expect(assembly?.inspectorExported).toBeDefined()
    expect(assembly?.trace).toBeDefined()
    expect(assembly?.traceDiff).toBeDefined()
    expect(assembly?.traceRendered).toBeDefined()
    expect(assembly?.traceExported).toBeDefined()
    expect(assembly?.timeline).toBeDefined()
    expect(assembly?.timelineDiff).toBeDefined()
    expect(assembly?.timelineRendered).toBeDefined()
    expect(assembly?.timelineExported).toBeDefined()
    expect(assembly?.timelineSnapshot).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Deterministic
// ---------------------------------------------------------------------------

describe('Deterministic', () => {
  it('should produce same timelineSnapshot across multiple builds', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const r1 = await builder.build(createPipelineContext())
    const r2 = await builder.build(createPipelineContext())
    expect(getTimelineSnapshot(r1)).toEqual(getTimelineSnapshot(r2))
  })

  it('should produce same timelineSnapshot across different builder instances', async () => {
    const b1 = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const b2 = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const r1 = await b1.build(createPipelineContext())
    const r2 = await b2.build(createPipelineContext())
    expect(getTimelineSnapshot(r1)).toEqual(getTimelineSnapshot(r2))
  })

  it('should produce same timelineSnapshot for same inputs', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const ctx = createPipelineContext()
    const r1 = await builder.build(ctx)
    const r2 = await builder.build(ctx)
    expect(getTimelineSnapshot(r1)).toEqual(getTimelineSnapshot(r2))
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
    expect(getTimelineSnapshot(r1)).toEqual(getTimelineSnapshot(r2))
  })

  it('should produce independent timelineSnapshot results', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const r1 = await builder.build(createPipelineContext())
    const r2 = await builder.build(createPipelineContext())
    expect(getTimelineSnapshot(r1)).not.toBe(undefined)
    expect(getTimelineSnapshot(r2)).not.toBe(undefined)
  })

  it('should produce fresh timelineSnapshot for each build', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const r1 = await builder.build(createPipelineContext({ input: 'a' }))
    const r2 = await builder.build(createPipelineContext({ input: 'b' }))
    expect(getTimelineSnapshot(r1)).toBeDefined()
    expect(getTimelineSnapshot(r2)).toBeDefined()
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
    expect(getTimelineSnapshot(request)).toBeDefined()
  })

  it('should produce same prompt regardless of snapshot builder presence', async () => {
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
      promptAssemblyTimelineRenderer: new DefaultPromptAssemblyTimelineRenderer(),
      promptAssemblyTimelineExporter: new DefaultPromptAssemblyTimelineExporter(),
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
  it('should not produce timelineSnapshot with legacy constructor', async () => {
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
    expect(getTimelineSnapshot(request)).toBeUndefined()
  })

  it('should not produce timelineSnapshot with BuilderOptions without snapshot builder', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyTimelineBuilder: new DefaultPromptAssemblyTimelineBuilder(),
    })
    const request = await builder.build(createPipelineContext())
    expect(getTimelineSnapshot(request)).toBeUndefined()
  })

  it('should produce timelineSnapshot with full BuilderOptions', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(getTimelineSnapshot(request)).toBeDefined()
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
    expect(getTimelineSnapshot(request)).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// No Prompt Changes
// ---------------------------------------------------------------------------

describe('No prompt changes', () => {
  it('should produce identical prompt with and without snapshot builder', async () => {
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
      promptAssemblyTimelineRenderer: new DefaultPromptAssemblyTimelineRenderer(),
      promptAssemblyTimelineExporter: new DefaultPromptAssemblyTimelineExporter(),
    })
    const rWith = await builderWith.build(createPipelineContext())
    const rWithout = await builderWithout.build(createPipelineContext())
    expect(rWith.prompt).toBe(rWithout.prompt)
  })

  it('should not inject timelineSnapshot into prompt output', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(request.prompt).not.toContain('timelineSnapshot')
  })

  it('should have timelineSnapshot only in metadata', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(getTimelineSnapshot(request)).toBeDefined()
    expect(request.prompt).not.toContain('timelineSnapshot')
  })

  it('should not have timelineSnapshot in prompt text', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(request.metadata?.promptAssembly).toHaveProperty('timelineSnapshot')
    expect(request.prompt).toBeDefined()
    expect(request.prompt.length).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// Compatibility
// ---------------------------------------------------------------------------

describe('RetryPlanner compatibility', () => {
  it('should work with RetryPlanner scenarios', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(getTimelineSnapshot(request)).toBeDefined()
    expect(request.prompt).toBeDefined()
  })
})

describe('ToolCallPlanner compatibility', () => {
  it('should work with ToolCallPlanner scenarios', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(getTimelineSnapshot(request)).toBeDefined()
  })
})

describe('Streaming compatibility', () => {
  it('should work with streaming pipeline', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(getTimelineSnapshot(request)).toBeDefined()
    expect(request.prompt).toBeDefined()
  })
})

describe('AgentLoop compatibility', () => {
  it('should work with AgentLoop', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(getTimelineSnapshot(request)).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Timeline Snapshot Validation
// ---------------------------------------------------------------------------

describe('Timeline snapshot validation', () => {
  it('should have correct entryCount', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const snapshot = getTimelineSnapshot(request)
    expect(snapshot?.entryCount).toBe(1)
  })

  it('should have correct firstStrategy', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const snapshot = getTimelineSnapshot(request)
    expect(snapshot?.firstStrategy).toBe('default')
  })

  it('should have correct lastStrategy', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const snapshot = getTimelineSnapshot(request)
    expect(snapshot?.lastStrategy).toBe('default')
  })

  it('should have strategies array with correct length', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const snapshot = getTimelineSnapshot(request)
    expect(Array.isArray(snapshot?.strategies)).toBe(true)
    expect((snapshot?.strategies as string[]).length).toBe(1)
  })

  it('should have rendered field from metadata', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const snapshot = getTimelineSnapshot(request)
    expect(snapshot).toHaveProperty('rendered')
  })

  it('should have exported field from metadata', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const snapshot = getTimelineSnapshot(request)
    expect(snapshot).toHaveProperty('exported')
  })

  it('should export rendered as a string', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const snapshot = getTimelineSnapshot(request)
    expect(typeof snapshot?.rendered).toBe('string')
  })

  it('should export exported as a string', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const snapshot = getTimelineSnapshot(request)
    expect(typeof snapshot?.exported).toBe('string')
  })
})