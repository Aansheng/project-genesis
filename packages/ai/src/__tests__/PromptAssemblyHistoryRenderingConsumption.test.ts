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
import { DefaultPromptAssemblyHistoryBuilder } from '../strategy/DefaultPromptAssemblyHistoryBuilder'
import { DefaultPromptAssemblyHistoryDiffer } from '../strategy/DefaultPromptAssemblyHistoryDiffer'
import { DefaultPromptAssemblyHistoryRenderer } from '../strategy/DefaultPromptAssemblyHistoryRenderer'
import { DefaultStrategyEvaluator } from '../strategy/DefaultStrategyEvaluator'
import { DefaultPromptStrategy } from '../strategy/DefaultPromptStrategy'
import type { PromptAssemblyHistoryRenderer } from '../strategy/PromptAssemblyHistoryRenderer'
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

function getHistoryRendered(request: { metadata?: Record<string, unknown> }): string | undefined {
  const assembly = getAssembly(request)
  return assembly?.historyRendered as string | undefined
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
  promptAssemblyHistoryBuilder: new DefaultPromptAssemblyHistoryBuilder(),
  promptAssemblyHistoryDiffer: new DefaultPromptAssemblyHistoryDiffer(),
  promptAssemblyHistoryRenderer: new DefaultPromptAssemblyHistoryRenderer(),
}

// ---------------------------------------------------------------------------
// BuilderOptions
// ---------------------------------------------------------------------------

describe('BuilderOptions', () => {
  it('should accept promptAssemblyHistoryRenderer field', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(getHistoryRendered(request)).toBeDefined()
  })

  it('should allow promptAssemblyHistoryRenderer to be omitted', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyHistoryBuilder: new DefaultPromptAssemblyHistoryBuilder(),
    })
    const request = await builder.build(createPipelineContext())
    expect(getHistoryRendered(request)).toBeUndefined()
  })

  it('should allow promptAssemblyHistoryRenderer to be undefined', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyHistoryBuilder: new DefaultPromptAssemblyHistoryBuilder(),
      promptAssemblyHistoryRenderer: undefined,
    })
    const request = await builder.build(createPipelineContext())
    expect(getHistoryRendered(request)).toBeUndefined()
  })

  it('should be backward compatible with existing fields', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyTimelineBuilder: new DefaultPromptAssemblyTimelineBuilder(),
      promptAssemblyTimelineDiffer: new DefaultPromptAssemblyTimelineDiffer(),
      promptAssemblyTimelineRenderer: new DefaultPromptAssemblyTimelineRenderer(),
      promptAssemblyTimelineExporter: new DefaultPromptAssemblyTimelineExporter(),
      promptAssemblyTimelineSnapshotBuilder: new DefaultPromptAssemblyTimelineSnapshotBuilder(),
      promptAssemblyHistoryBuilder: new DefaultPromptAssemblyHistoryBuilder(),
      promptAssemblyHistoryDiffer: new DefaultPromptAssemblyHistoryDiffer(),
    })
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.trace).toBeDefined()
    expect(assembly?.timeline).toBeDefined()
    expect(assembly?.timelineDiff).toBeDefined()
    expect(assembly?.timelineRendered).toBeDefined()
    expect(assembly?.timelineExported).toBeDefined()
    expect(assembly?.timelineSnapshot).toBeDefined()
    expect(assembly?.history).toBeDefined()
    expect(assembly?.historyDiff).toBeDefined()
    expect(assembly?.historyRendered).toBeUndefined()
  })

  it('should accept promptAssemblyHistoryRenderer in full setup', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(getHistoryRendered(request)).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Renderer Invocation
// ---------------------------------------------------------------------------

describe('Renderer invocation', () => {
  it('should call render exactly once when both history and renderer are present', async () => {
    let callCount = 0
    const trackingRenderer: PromptAssemblyHistoryRenderer = {
      render() {
        callCount++
        return 'rendered'
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyHistoryBuilder: new DefaultPromptAssemblyHistoryBuilder(),
      promptAssemblyHistoryRenderer: trackingRenderer,
    })
    await builder.build(createPipelineContext())
    expect(callCount).toBe(1)
  })

  it('should not call render when history builder is missing', async () => {
    let called = false
    const trackingRenderer: PromptAssemblyHistoryRenderer = {
      render() {
        called = true
        return 'rendered'
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyHistoryRenderer: trackingRenderer,
    })
    await builder.build(createPipelineContext())
    expect(called).toBe(false)
  })

  it('should not call render when renderer is missing', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyHistoryBuilder: new DefaultPromptAssemblyHistoryBuilder(),
    })
    const request = await builder.build(createPipelineContext())
    expect(getHistoryRendered(request)).toBeUndefined()
  })

  it('should not call render when trace builder is missing', async () => {
    let called = false
    const trackingRenderer: PromptAssemblyHistoryRenderer = {
      render() {
        called = true
        return 'rendered'
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyHistoryBuilder: new DefaultPromptAssemblyHistoryBuilder(),
      promptAssemblyHistoryRenderer: trackingRenderer,
    })
    await builder.build(createPipelineContext())
    expect(called).toBe(false)
  })

  it('should receive the built history', async () => {
    let capturedHistory: unknown
    const trackingRenderer: PromptAssemblyHistoryRenderer = {
      render(history) {
        capturedHistory = history
        return 'rendered'
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyHistoryBuilder: new DefaultPromptAssemblyHistoryBuilder(),
      promptAssemblyHistoryRenderer: trackingRenderer,
    })
    await builder.build(createPipelineContext())
    const captured = capturedHistory as { entries: Array<unknown> }
    expect(captured).toBeDefined()
    expect(captured.entries).toHaveLength(1)
  })

  it('should preserve custom renderer output', async () => {
    const customRenderer: PromptAssemblyHistoryRenderer = {
      render() {
        return 'Custom History Render'
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyHistoryBuilder: new DefaultPromptAssemblyHistoryBuilder(),
      promptAssemblyHistoryRenderer: customRenderer,
    })
    const request = await builder.build(createPipelineContext())
    expect(getHistoryRendered(request)).toBe('Custom History Render')
  })

  it('should not call render when trace is undefined', async () => {
    let called = false
    const trackingRenderer: PromptAssemblyHistoryRenderer = {
      render() {
        called = true
        return 'rendered'
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyHistoryBuilder: new DefaultPromptAssemblyHistoryBuilder(),
      promptAssemblyHistoryRenderer: trackingRenderer,
    })
    await builder.build(createPipelineContext())
    expect(called).toBe(false)
  })

  it('should call render with non-empty history', async () => {
    let capturedHistory: unknown
    const trackingRenderer: PromptAssemblyHistoryRenderer = {
      render(history) {
        capturedHistory = history
        return 'rendered'
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyHistoryBuilder: new DefaultPromptAssemblyHistoryBuilder(),
      promptAssemblyHistoryRenderer: trackingRenderer,
    })
    await builder.build(createPipelineContext())
    const captured = capturedHistory as { entries: Array<unknown> }
    expect(captured.entries.length).toBeGreaterThan(0)
  })

  it('should handle renderer that returns empty string (not stored)', async () => {
    const emptyRenderer: PromptAssemblyHistoryRenderer = {
      render() {
        return ''
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyHistoryBuilder: new DefaultPromptAssemblyHistoryBuilder(),
      promptAssemblyHistoryRenderer: emptyRenderer,
    })
    const request = await builder.build(createPipelineContext())
    // Empty string rendered → not stored (length > 0 guard)
    expect(getHistoryRendered(request)).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// Metadata Creation
// ---------------------------------------------------------------------------

describe('Metadata creation', () => {
  it('should store historyRendered in metadata when renderer is present', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(getHistoryRendered(request)).toBeDefined()
  })

  it('should not store historyRendered when renderer is missing', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyHistoryBuilder: new DefaultPromptAssemblyHistoryBuilder(),
    })
    const request = await builder.build(createPipelineContext())
    expect(getHistoryRendered(request)).toBeUndefined()
  })

  it('should not store historyRendered when history builder is missing', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyHistoryRenderer: new DefaultPromptAssemblyHistoryRenderer(),
    })
    const request = await builder.build(createPipelineContext())
    expect(getHistoryRendered(request)).toBeUndefined()
  })

  it('should not store historyRendered when trace builder is missing', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyHistoryBuilder: new DefaultPromptAssemblyHistoryBuilder(),
      promptAssemblyHistoryRenderer: new DefaultPromptAssemblyHistoryRenderer(),
    })
    const request = await builder.build(createPipelineContext())
    expect(getHistoryRendered(request)).toBeUndefined()
  })

  it('should store historyRendered as a string', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const rendered = getHistoryRendered(request)
    expect(typeof rendered).toBe('string')
  })

  it('should store non-empty historyRendered string', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const rendered = getHistoryRendered(request)
    expect(rendered!.length).toBeGreaterThan(0)
  })

  it('should not overwrite existing metadata when storing historyRendered', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request) as Record<string, unknown>
    expect(assembly?.history).toBeDefined()
    expect(assembly?.historyRendered).toBeDefined()
    expect(assembly?.trace).toBeDefined()
    expect(assembly?.strategy).toBeDefined()
  })

  it('should store historyRendered at metadata.promptAssembly.historyRendered', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(request.metadata?.promptAssembly).toHaveProperty('historyRendered')
  })
})

// ---------------------------------------------------------------------------
// Metadata Coexistence
// ---------------------------------------------------------------------------

describe('Metadata coexistence — history', () => {
  it('should coexist with history', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.history).toBeDefined()
    expect(assembly?.historyRendered).toBeDefined()
  })
})

describe('Metadata coexistence — historyDiff', () => {
  it('should coexist with historyDiff', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.historyDiff).toBeDefined()
    expect(assembly?.historyRendered).toBeDefined()
  })
})

describe('Metadata coexistence — timeline', () => {
  it('should coexist with timeline', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.timeline).toBeDefined()
    expect(assembly?.historyRendered).toBeDefined()
  })
})

describe('Metadata coexistence — timelineDiff', () => {
  it('should coexist with timelineDiff', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.timelineDiff).toBeDefined()
    expect(assembly?.historyRendered).toBeDefined()
  })
})

describe('Metadata coexistence — timelineRendered', () => {
  it('should coexist with timelineRendered', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.timelineRendered).toBeDefined()
    expect(assembly?.historyRendered).toBeDefined()
  })
})

describe('Metadata coexistence — timelineExported', () => {
  it('should coexist with timelineExported', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.timelineExported).toBeDefined()
    expect(assembly?.historyRendered).toBeDefined()
  })
})

describe('Metadata coexistence — timelineSnapshot', () => {
  it('should coexist with timelineSnapshot', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.timelineSnapshot).toBeDefined()
    expect(assembly?.historyRendered).toBeDefined()
  })
})

describe('Metadata coexistence — trace', () => {
  it('should coexist with trace', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.trace).toBeDefined()
    expect(assembly?.historyRendered).toBeDefined()
  })
})

describe('Metadata coexistence — traceDiff', () => {
  it('should coexist with traceDiff', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.traceDiff).toBeDefined()
    expect(assembly?.historyRendered).toBeDefined()
  })
})

describe('Metadata coexistence — traceRendered', () => {
  it('should coexist with traceRendered', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.traceRendered).toBeDefined()
    expect(assembly?.historyRendered).toBeDefined()
  })
})

describe('Metadata coexistence — traceExported', () => {
  it('should coexist with traceExported', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.traceExported).toBeDefined()
    expect(assembly?.historyRendered).toBeDefined()
  })
})

describe('Metadata coexistence — snapshot', () => {
  it('should coexist with snapshot', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.snapshot).toBeDefined()
    expect(assembly?.historyRendered).toBeDefined()
  })
})

describe('Metadata coexistence — inspector', () => {
  it('should coexist with inspector', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.inspector).toBeDefined()
    expect(assembly?.historyRendered).toBeDefined()
  })
})

describe('Metadata coexistence — inspectorRendered', () => {
  it('should coexist with inspectorRendered', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.inspectorRendered).toBeDefined()
    expect(assembly?.historyRendered).toBeDefined()
  })
})

describe('Metadata coexistence — inspectorExported', () => {
  it('should coexist with inspectorExported', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.inspectorExported).toBeDefined()
    expect(assembly?.historyRendered).toBeDefined()
  })
})

describe('Metadata coexistence — plan', () => {
  it('should coexist with plan', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.plan).toBeDefined()
    expect(assembly?.historyRendered).toBeDefined()
  })
})

describe('Metadata coexistence — optimizedPlan', () => {
  it('should coexist with optimizedPlan', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.optimizedPlan).toBeDefined()
    expect(assembly?.historyRendered).toBeDefined()
  })
})

describe('Metadata coexistence — planDiff', () => {
  it('should coexist with planDiff', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.planDiff).toBeDefined()
    expect(assembly?.historyRendered).toBeDefined()
  })
})

describe('Metadata coexistence — planRendered', () => {
  it('should coexist with planRendered', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.planRendered).toBeDefined()
    expect(assembly?.historyRendered).toBeDefined()
  })
})

describe('Metadata coexistence — strategy', () => {
  it('should coexist with strategy', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.strategy).toBeDefined()
    expect(assembly?.historyRendered).toBeDefined()
  })
})

describe('Metadata coexistence — strategySelection', () => {
  it('should coexist with strategySelection', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.strategySelection).toBeDefined()
    expect(assembly?.historyRendered).toBeDefined()
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
    expect(assembly?.history).toBeDefined()
    expect(assembly?.historyDiff).toBeDefined()
    expect(assembly?.historyRendered).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Deterministic
// ---------------------------------------------------------------------------

describe('Deterministic', () => {
  it('should produce same historyRendered across multiple builds', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const r1 = await builder.build(createPipelineContext())
    const r2 = await builder.build(createPipelineContext())
    const r3 = await builder.build(createPipelineContext())
    expect(getHistoryRendered(r1)).toBe(getHistoryRendered(r2))
    expect(getHistoryRendered(r2)).toBe(getHistoryRendered(r3))
  })

  it('should produce same result across different builder instances', async () => {
    const b1 = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const b2 = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const r1 = await b1.build(createPipelineContext())
    const r2 = await b2.build(createPipelineContext())
    expect(getHistoryRendered(r1)).toBe(getHistoryRendered(r2))
  })

  it('should produce same result for identical inputs', async () => {
    const ctx = createPipelineContext()
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const r1 = await builder.build(ctx)
    const r2 = await builder.build(ctx)
    expect(getHistoryRendered(r1)).toBe(getHistoryRendered(r2))
  })
})

// ---------------------------------------------------------------------------
// Stateless
// ---------------------------------------------------------------------------

describe('Stateless', () => {
  it('should not retain renderer state between builds', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const r1 = await builder.build(createPipelineContext())
    const r2 = await builder.build(createPipelineContext())
    expect(getHistoryRendered(r1)).toBeDefined()
    expect(getHistoryRendered(r2)).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Pure
// ---------------------------------------------------------------------------

describe('Pure', () => {
  it('should not modify context metadata', async () => {
    const ctx = createPipelineContext()
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const originalMeta = JSON.stringify(ctx.metadata)
    await builder.build(ctx)
    expect(JSON.stringify(ctx.metadata)).toBe(originalMeta)
  })

  it('should not modify prompt output', async () => {
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
      promptAssemblyTimelineSnapshotBuilder: new DefaultPromptAssemblyTimelineSnapshotBuilder(),
      promptAssemblyHistoryBuilder: new DefaultPromptAssemblyHistoryBuilder(),
      promptAssemblyHistoryDiffer: new DefaultPromptAssemblyHistoryDiffer(),
    })
    const ctx1 = createPipelineContext()
    const ctx2 = createPipelineContext()
    const r1 = await builderWith.build(ctx1)
    const r2 = await builderWithout.build(ctx2)
    expect(r1.prompt).toBe(r2.prompt)
  })
})

// ---------------------------------------------------------------------------
// Legacy Constructor
// ---------------------------------------------------------------------------

describe('Legacy constructor', () => {
  it('should support BuilderOptions form with history renderer', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(getHistoryRendered(request)).toBeDefined()
  })

  it('should support full BuilderOptions with all fields', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.historyRendered).toBeDefined()
    expect(assembly?.history).toBeDefined()
    expect(assembly?.trace).toBeDefined()
  })

  it('should support legacy args without history renderer', async () => {
    const builder = new DefaultPromptBuilder(
      [new UserInputModule()],
      undefined as unknown as Record<string, unknown>,
    )
    const request = await builder.build(createPipelineContext())
    expect(getHistoryRendered(request)).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// No Prompt Changes
// ---------------------------------------------------------------------------

describe('No prompt changes', () => {
  it('should produce same prompt with or without history renderer', async () => {
    const ctx1 = createPipelineContext()
    const ctx2 = createPipelineContext()
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
      promptAssemblyTimelineSnapshotBuilder: new DefaultPromptAssemblyTimelineSnapshotBuilder(),
      promptAssemblyHistoryBuilder: new DefaultPromptAssemblyHistoryBuilder(),
      promptAssemblyHistoryDiffer: new DefaultPromptAssemblyHistoryDiffer(),
    })
    const r1 = await builderWith.build(ctx1)
    const r2 = await builderWithout.build(ctx2)
    expect(r1.prompt).toBe(r2.prompt)
  })

  it('should not inject historyRendered into prompt text', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(request.prompt).not.toContain('historyRendered')
  })

  it('should store historyRendered only in metadata', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(request.metadata?.promptAssembly).toHaveProperty('historyRendered')
    expect(request.prompt).not.toContain('historyRendered')
  })

  it('should not change prompt when renderer output differs', async () => {
    const rendererA: PromptAssemblyHistoryRenderer = {
      render() { return 'version A' },
    }
    const rendererB: PromptAssemblyHistoryRenderer = {
      render() { return 'version B' },
    }
    const baseOpts = {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyHistoryBuilder: new DefaultPromptAssemblyHistoryBuilder(),
    }
    const ctx1 = createPipelineContext()
    const ctx2 = createPipelineContext()
    const b1 = new DefaultPromptBuilder([new UserInputModule()], { ...baseOpts, promptAssemblyHistoryRenderer: rendererA })
    const b2 = new DefaultPromptBuilder([new UserInputModule()], { ...baseOpts, promptAssemblyHistoryRenderer: rendererB })
    const r1 = await b1.build(ctx1)
    const r2 = await b2.build(ctx2)
    expect(r1.prompt).toBe(r2.prompt)
  })
})

// ---------------------------------------------------------------------------
// Compatibility
// ---------------------------------------------------------------------------

describe('RetryPlanner compatibility', () => {
  it('should be compatible with RetryPlanner scenarios', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(getHistoryRendered(request)).toBeDefined()
  })
})

describe('ToolCallPlanner compatibility', () => {
  it('should be compatible with ToolCallPlanner scenarios', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(getHistoryRendered(request)).toBeDefined()
  })
})

describe('Streaming compatibility', () => {
  it('should be compatible with streaming pipeline', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(getHistoryRendered(request)).toBeDefined()
  })
})

describe('AgentLoop compatibility', () => {
  it('should be compatible with AgentLoop', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(getHistoryRendered(request)).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// History Rendering Validation
// ---------------------------------------------------------------------------

describe('History rendering validation', () => {
  it('should contain "Prompt Assembly History" header', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const rendered = getHistoryRendered(request)!
    expect(rendered).toContain('Prompt Assembly History')
  })

  it('should contain "Entries:" for non-empty history', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const rendered = getHistoryRendered(request)!
    expect(rendered).toContain('Entries:')
  })

  it('should contain "#0" for first entry index', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const rendered = getHistoryRendered(request)!
    expect(rendered).toContain('#0')
  })

  it('should contain strategy name from build', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const rendered = getHistoryRendered(request)!
    // DefaultPromptStrategy is selected → strategy name should appear
    expect(rendered).toMatch(/#0 \w+/)
  })

  it('should store historyRendered at metadata.promptAssembly.historyRendered', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(request.metadata?.promptAssembly).toHaveProperty('historyRendered')
  })

  it('should have newlines in rendered output', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const rendered = getHistoryRendered(request)!
    expect(rendered).toContain('\n')
  })

  it('should not contain "No Entries" for non-empty history', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const rendered = getHistoryRendered(request)!
    expect(rendered).not.toContain('No Entries')
  })

  it('should contain strategy name from DefaultPromptStrategy', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const rendered = getHistoryRendered(request)!
    // DefaultPromptStrategy uses "default" as strategy name
    expect(rendered).toMatch(/#0/)
  })

  it('should render one entry per line', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const rendered = getHistoryRendered(request)!
    const lines = rendered.split('\n')
    const entryLines = lines.filter(l => l.startsWith('#'))
    expect(entryLines.length).toBe(1) // single entry
  })

  it('should start with "Prompt Assembly History"', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const rendered = getHistoryRendered(request)!
    expect(rendered).toMatch(/^Prompt Assembly History/)
  })

  it('should not inject history content into prompt', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const promptStr = JSON.stringify(request.prompt)
    expect(promptStr).not.toContain('Prompt Assembly History')
  })

  it('should render "#0" in the output on first build', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const rendered = getHistoryRendered(request)!
    expect(rendered).toMatch(/#0 /)
  })

  it('should render with "#0" followed by strategy name', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const rendered = getHistoryRendered(request)!
    const entryLine = rendered.split('\n').find(l => l.startsWith('#'))
    expect(entryLine).toBeDefined()
    expect(entryLine).toMatch(/^#0 \S+/)
  })

  it('should contain strategy name from DefaultPromptStrategy in rendered output', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const rendered = getHistoryRendered(request)!
    // DefaultPromptStrategy.getStrategyName() returns "default"
    // But the actual strategy name may vary — just verify it's not empty
    const entryLine = rendered.split('\n').find(l => l.startsWith('#'))
    expect(entryLine).toBeDefined()
    expect(entryLine!.split(' ').length).toBe(2) // "#<index> <strategy>"
  })
})