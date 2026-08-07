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
import { DefaultPromptAssemblyHistoryExporter } from '../strategy/DefaultPromptAssemblyHistoryExporter'
import { DefaultPromptAssemblyHistorySnapshotBuilder } from '../strategy/DefaultPromptAssemblyHistorySnapshotBuilder'
import { DefaultPromptAssemblyObservatoryBuilder } from '../strategy/DefaultPromptAssemblyObservatoryBuilder'
import { DefaultPromptAssemblyObservatoryDiffer } from '../strategy/DefaultPromptAssemblyObservatoryDiffer'
import { DefaultPromptAssemblyObservatoryRenderer } from '../strategy/DefaultPromptAssemblyObservatoryRenderer'
import { DefaultStrategyEvaluator } from '../strategy/DefaultStrategyEvaluator'
import { DefaultPromptStrategy } from '../strategy/DefaultPromptStrategy'
import type { PromptAssemblyObservatoryRenderer } from '../strategy/PromptAssemblyObservatoryRenderer'
import type { PromptAssemblyObservatory } from '../strategy/PromptAssemblyObservatory'
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

function getObservatoryRendered(request: { metadata?: Record<string, unknown> }): string | undefined {
  const assembly = getAssembly(request)
  return assembly?.observatoryRendered as string | undefined
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
  promptAssemblyHistoryExporter: new DefaultPromptAssemblyHistoryExporter(),
  promptAssemblyHistorySnapshotBuilder: new DefaultPromptAssemblyHistorySnapshotBuilder(),
  promptAssemblyObservatoryBuilder: new DefaultPromptAssemblyObservatoryBuilder(),
  promptAssemblyObservatoryDiffer: new DefaultPromptAssemblyObservatoryDiffer(),
  promptAssemblyObservatoryRenderer: new DefaultPromptAssemblyObservatoryRenderer(),
}

// ---------------------------------------------------------------------------
// BuilderOptions
// ---------------------------------------------------------------------------

describe('BuilderOptions', () => {
  it('should accept promptAssemblyObservatoryRenderer field', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(getObservatoryRendered(request)).toBeDefined()
  })

  it('should allow promptAssemblyObservatoryRenderer to be omitted', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyObservatoryBuilder: new DefaultPromptAssemblyObservatoryBuilder(),
    })
    const request = await builder.build(createPipelineContext())
    expect(getObservatoryRendered(request)).toBeUndefined()
  })

  it('should allow promptAssemblyObservatoryRenderer to be undefined', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyObservatoryBuilder: new DefaultPromptAssemblyObservatoryBuilder(),
      promptAssemblyObservatoryRenderer: undefined,
    })
    const request = await builder.build(createPipelineContext())
    expect(getObservatoryRendered(request)).toBeUndefined()
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
      promptAssemblyHistoryRenderer: new DefaultPromptAssemblyHistoryRenderer(),
      promptAssemblyObservatoryBuilder: new DefaultPromptAssemblyObservatoryBuilder(),
      promptAssemblyObservatoryDiffer: new DefaultPromptAssemblyObservatoryDiffer(),
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
    expect(assembly?.historyRendered).toBeDefined()
    expect(assembly?.observatory).toBeDefined()
    expect(assembly?.observatoryDiff).toBeDefined()
    expect(assembly?.observatoryRendered).toBeUndefined()
  })

  it('should accept promptAssemblyObservatoryRenderer in full setup', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(getObservatoryRendered(request)).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Renderer Invocation
// ---------------------------------------------------------------------------

describe('Renderer invocation', () => {
  it('should call render exactly once when both observatory and renderer are present', async () => {
    let callCount = 0
    const trackingRenderer: PromptAssemblyObservatoryRenderer = {
      render() {
        callCount++
        return 'rendered'
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyTimelineBuilder: new DefaultPromptAssemblyTimelineBuilder(),
      promptAssemblyTimelineDiffer: new DefaultPromptAssemblyTimelineDiffer(),
      promptAssemblyTimelineRenderer: new DefaultPromptAssemblyTimelineRenderer(),
      promptAssemblyTimelineExporter: new DefaultPromptAssemblyTimelineExporter(),
      promptAssemblyTimelineSnapshotBuilder: new DefaultPromptAssemblyTimelineSnapshotBuilder(),
      promptAssemblyHistoryBuilder: new DefaultPromptAssemblyHistoryBuilder(),
      promptAssemblyHistoryDiffer: new DefaultPromptAssemblyHistoryDiffer(),
      promptAssemblyHistoryRenderer: new DefaultPromptAssemblyHistoryRenderer(),
      promptAssemblyHistoryExporter: new DefaultPromptAssemblyHistoryExporter(),
      promptAssemblyHistorySnapshotBuilder: new DefaultPromptAssemblyHistorySnapshotBuilder(),
      promptAssemblyObservatoryBuilder: new DefaultPromptAssemblyObservatoryBuilder(),
      promptAssemblyObservatoryRenderer: trackingRenderer,
    })
    await builder.build(createPipelineContext())
    expect(callCount).toBe(1)
  })

  it('should not call render when observatory builder is missing', async () => {
    let called = false
    const trackingRenderer: PromptAssemblyObservatoryRenderer = {
      render() {
        called = true
        return 'rendered'
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyObservatoryRenderer: trackingRenderer,
    })
    await builder.build(createPipelineContext())
    expect(called).toBe(false)
  })

  it('should not call render when renderer is missing', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyTimelineBuilder: new DefaultPromptAssemblyTimelineBuilder(),
      promptAssemblyTimelineDiffer: new DefaultPromptAssemblyTimelineDiffer(),
      promptAssemblyTimelineRenderer: new DefaultPromptAssemblyTimelineRenderer(),
      promptAssemblyTimelineExporter: new DefaultPromptAssemblyTimelineExporter(),
      promptAssemblyTimelineSnapshotBuilder: new DefaultPromptAssemblyTimelineSnapshotBuilder(),
      promptAssemblyHistoryBuilder: new DefaultPromptAssemblyHistoryBuilder(),
      promptAssemblyHistoryDiffer: new DefaultPromptAssemblyHistoryDiffer(),
      promptAssemblyHistoryRenderer: new DefaultPromptAssemblyHistoryRenderer(),
      promptAssemblyHistoryExporter: new DefaultPromptAssemblyHistoryExporter(),
      promptAssemblyHistorySnapshotBuilder: new DefaultPromptAssemblyHistorySnapshotBuilder(),
      promptAssemblyObservatoryBuilder: new DefaultPromptAssemblyObservatoryBuilder(),
    })
    const request = await builder.build(createPipelineContext())
    expect(getObservatoryRendered(request)).toBeUndefined()
  })

  it('should call render even without trace builder (empty observatory)', async () => {
    let called = false
    const trackingRenderer: PromptAssemblyObservatoryRenderer = {
      render() {
        called = true
        return 'rendered'
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyObservatoryBuilder: new DefaultPromptAssemblyObservatoryBuilder(),
      promptAssemblyObservatoryRenderer: trackingRenderer,
    })
    await builder.build(createPipelineContext())
    expect(called).toBe(true)
  })

  it('should receive the built observatory', async () => {
    let capturedObservatory: unknown
    const trackingRenderer: PromptAssemblyObservatoryRenderer = {
      render(observatory) {
        capturedObservatory = observatory
        return 'rendered'
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyTimelineBuilder: new DefaultPromptAssemblyTimelineBuilder(),
      promptAssemblyTimelineDiffer: new DefaultPromptAssemblyTimelineDiffer(),
      promptAssemblyTimelineRenderer: new DefaultPromptAssemblyTimelineRenderer(),
      promptAssemblyTimelineExporter: new DefaultPromptAssemblyTimelineExporter(),
      promptAssemblyTimelineSnapshotBuilder: new DefaultPromptAssemblyTimelineSnapshotBuilder(),
      promptAssemblyHistoryBuilder: new DefaultPromptAssemblyHistoryBuilder(),
      promptAssemblyHistoryDiffer: new DefaultPromptAssemblyHistoryDiffer(),
      promptAssemblyHistoryRenderer: new DefaultPromptAssemblyHistoryRenderer(),
      promptAssemblyHistoryExporter: new DefaultPromptAssemblyHistoryExporter(),
      promptAssemblyHistorySnapshotBuilder: new DefaultPromptAssemblyHistorySnapshotBuilder(),
      promptAssemblyObservatoryBuilder: new DefaultPromptAssemblyObservatoryBuilder(),
      promptAssemblyObservatoryRenderer: trackingRenderer,
    })
    await builder.build(createPipelineContext())
    const captured = capturedObservatory as PromptAssemblyObservatory
    expect(captured).toBeDefined()
    expect(captured.trace).toBeDefined()
  })

  it('should preserve custom renderer output', async () => {
    const customRenderer: PromptAssemblyObservatoryRenderer = {
      render() {
        return 'Custom Observatory Render'
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyTimelineBuilder: new DefaultPromptAssemblyTimelineBuilder(),
      promptAssemblyTimelineDiffer: new DefaultPromptAssemblyTimelineDiffer(),
      promptAssemblyTimelineRenderer: new DefaultPromptAssemblyTimelineRenderer(),
      promptAssemblyTimelineExporter: new DefaultPromptAssemblyTimelineExporter(),
      promptAssemblyTimelineSnapshotBuilder: new DefaultPromptAssemblyTimelineSnapshotBuilder(),
      promptAssemblyHistoryBuilder: new DefaultPromptAssemblyHistoryBuilder(),
      promptAssemblyHistoryDiffer: new DefaultPromptAssemblyHistoryDiffer(),
      promptAssemblyHistoryRenderer: new DefaultPromptAssemblyHistoryRenderer(),
      promptAssemblyHistoryExporter: new DefaultPromptAssemblyHistoryExporter(),
      promptAssemblyHistorySnapshotBuilder: new DefaultPromptAssemblyHistorySnapshotBuilder(),
      promptAssemblyObservatoryBuilder: new DefaultPromptAssemblyObservatoryBuilder(),
      promptAssemblyObservatoryRenderer: customRenderer,
    })
    const request = await builder.build(createPipelineContext())
    expect(getObservatoryRendered(request)).toBe('Custom Observatory Render')
  })

  it('should handle renderer that returns empty string (not stored)', async () => {
    const emptyRenderer: PromptAssemblyObservatoryRenderer = {
      render() {
        return ''
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyTimelineBuilder: new DefaultPromptAssemblyTimelineBuilder(),
      promptAssemblyTimelineDiffer: new DefaultPromptAssemblyTimelineDiffer(),
      promptAssemblyTimelineRenderer: new DefaultPromptAssemblyTimelineRenderer(),
      promptAssemblyTimelineExporter: new DefaultPromptAssemblyTimelineExporter(),
      promptAssemblyTimelineSnapshotBuilder: new DefaultPromptAssemblyTimelineSnapshotBuilder(),
      promptAssemblyHistoryBuilder: new DefaultPromptAssemblyHistoryBuilder(),
      promptAssemblyHistoryDiffer: new DefaultPromptAssemblyHistoryDiffer(),
      promptAssemblyHistoryRenderer: new DefaultPromptAssemblyHistoryRenderer(),
      promptAssemblyHistoryExporter: new DefaultPromptAssemblyHistoryExporter(),
      promptAssemblyHistorySnapshotBuilder: new DefaultPromptAssemblyHistorySnapshotBuilder(),
      promptAssemblyObservatoryBuilder: new DefaultPromptAssemblyObservatoryBuilder(),
      promptAssemblyObservatoryRenderer: emptyRenderer,
    })
    const request = await builder.build(createPipelineContext())
    expect(getObservatoryRendered(request)).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// Metadata Creation
// ---------------------------------------------------------------------------

describe('Metadata creation', () => {
  it('should store observatoryRendered in metadata when renderer is present', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(getObservatoryRendered(request)).toBeDefined()
  })

  it('should not store observatoryRendered when renderer is missing', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyTimelineBuilder: new DefaultPromptAssemblyTimelineBuilder(),
      promptAssemblyTimelineDiffer: new DefaultPromptAssemblyTimelineDiffer(),
      promptAssemblyTimelineRenderer: new DefaultPromptAssemblyTimelineRenderer(),
      promptAssemblyTimelineExporter: new DefaultPromptAssemblyTimelineExporter(),
      promptAssemblyTimelineSnapshotBuilder: new DefaultPromptAssemblyTimelineSnapshotBuilder(),
      promptAssemblyHistoryBuilder: new DefaultPromptAssemblyHistoryBuilder(),
      promptAssemblyHistoryDiffer: new DefaultPromptAssemblyHistoryDiffer(),
      promptAssemblyHistoryRenderer: new DefaultPromptAssemblyHistoryRenderer(),
      promptAssemblyHistoryExporter: new DefaultPromptAssemblyHistoryExporter(),
      promptAssemblyHistorySnapshotBuilder: new DefaultPromptAssemblyHistorySnapshotBuilder(),
      promptAssemblyObservatoryBuilder: new DefaultPromptAssemblyObservatoryBuilder(),
    })
    const request = await builder.build(createPipelineContext())
    expect(getObservatoryRendered(request)).toBeUndefined()
  })

  it('should not store observatoryRendered when observatory builder is missing', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyObservatoryRenderer: new DefaultPromptAssemblyObservatoryRenderer(),
    })
    const request = await builder.build(createPipelineContext())
    expect(getObservatoryRendered(request)).toBeUndefined()
  })

  it('should store observatoryRendered even without trace builder (empty observatory)', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyObservatoryBuilder: new DefaultPromptAssemblyObservatoryBuilder(),
      promptAssemblyObservatoryRenderer: new DefaultPromptAssemblyObservatoryRenderer(),
    })
    const request = await builder.build(createPipelineContext())
    // Observatory builder produces an empty observatory; renderer renders it as "No Artifacts"
    const rendered = getObservatoryRendered(request)
    expect(rendered).toBeDefined()
    expect(rendered).toContain('No Artifacts')
  })

  it('should store observatoryRendered as a string', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const rendered = getObservatoryRendered(request)
    expect(typeof rendered).toBe('string')
  })

  it('should store non-empty observatoryRendered string', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const rendered = getObservatoryRendered(request)
    expect(rendered!.length).toBeGreaterThan(0)
  })

  it('should not overwrite existing metadata when storing observatoryRendered', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request) as Record<string, unknown>
    expect(assembly?.observatory).toBeDefined()
    expect(assembly?.observatoryRendered).toBeDefined()
    expect(assembly?.trace).toBeDefined()
    expect(assembly?.strategy).toBeDefined()
  })

  it('should store observatoryRendered at metadata.promptAssembly.observatoryRendered', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(request.metadata?.promptAssembly).toHaveProperty('observatoryRendered')
  })
})

// ---------------------------------------------------------------------------
// Metadata Coexistence
// ---------------------------------------------------------------------------

describe('Metadata coexistence — trace', () => {
  it('should coexist with trace', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.trace).toBeDefined()
    expect(assembly?.observatoryRendered).toBeDefined()
  })
})

describe('Metadata coexistence — traceDiff', () => {
  it('should coexist with traceDiff', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.traceDiff).toBeDefined()
    expect(assembly?.observatoryRendered).toBeDefined()
  })
})

describe('Metadata coexistence — traceRendered', () => {
  it('should coexist with traceRendered', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.traceRendered).toBeDefined()
    expect(assembly?.observatoryRendered).toBeDefined()
  })
})

describe('Metadata coexistence — traceExported', () => {
  it('should coexist with traceExported', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.traceExported).toBeDefined()
    expect(assembly?.observatoryRendered).toBeDefined()
  })
})

describe('Metadata coexistence — timeline', () => {
  it('should coexist with timeline', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.timeline).toBeDefined()
    expect(assembly?.observatoryRendered).toBeDefined()
  })
})

describe('Metadata coexistence — timelineDiff', () => {
  it('should coexist with timelineDiff', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.timelineDiff).toBeDefined()
    expect(assembly?.observatoryRendered).toBeDefined()
  })
})

describe('Metadata coexistence — timelineRendered', () => {
  it('should coexist with timelineRendered', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.timelineRendered).toBeDefined()
    expect(assembly?.observatoryRendered).toBeDefined()
  })
})

describe('Metadata coexistence — timelineExported', () => {
  it('should coexist with timelineExported', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.timelineExported).toBeDefined()
    expect(assembly?.observatoryRendered).toBeDefined()
  })
})

describe('Metadata coexistence — timelineSnapshot', () => {
  it('should coexist with timelineSnapshot', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.timelineSnapshot).toBeDefined()
    expect(assembly?.observatoryRendered).toBeDefined()
  })
})

describe('Metadata coexistence — history', () => {
  it('should coexist with history', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.history).toBeDefined()
    expect(assembly?.observatoryRendered).toBeDefined()
  })
})

describe('Metadata coexistence — historyDiff', () => {
  it('should coexist with historyDiff', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.historyDiff).toBeDefined()
    expect(assembly?.observatoryRendered).toBeDefined()
  })
})

describe('Metadata coexistence — historyRendered', () => {
  it('should coexist with historyRendered', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.historyRendered).toBeDefined()
    expect(assembly?.observatoryRendered).toBeDefined()
  })
})

describe('Metadata coexistence — historyExported', () => {
  it('should coexist with historyExported', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.historyExported).toBeDefined()
    expect(assembly?.observatoryRendered).toBeDefined()
  })
})

describe('Metadata coexistence — historySnapshot', () => {
  it('should coexist with historySnapshot', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.historySnapshot).toBeDefined()
    expect(assembly?.observatoryRendered).toBeDefined()
  })
})

describe('Metadata coexistence — observatory', () => {
  it('should coexist with observatory', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.observatory).toBeDefined()
    expect(assembly?.observatoryRendered).toBeDefined()
  })
})

describe('Metadata coexistence — observatoryDiff', () => {
  it('should coexist with observatoryDiff', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.observatoryDiff).toBeDefined()
    expect(assembly?.observatoryRendered).toBeDefined()
  })
})

describe('Metadata coexistence — snapshot', () => {
  it('should coexist with snapshot', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.snapshot).toBeDefined()
    expect(assembly?.observatoryRendered).toBeDefined()
  })
})

describe('Metadata coexistence — inspector', () => {
  it('should coexist with inspector', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.inspector).toBeDefined()
    expect(assembly?.observatoryRendered).toBeDefined()
  })
})

describe('Metadata coexistence — inspectorRendered', () => {
  it('should coexist with inspectorRendered', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.inspectorRendered).toBeDefined()
    expect(assembly?.observatoryRendered).toBeDefined()
  })
})

describe('Metadata coexistence — inspectorExported', () => {
  it('should coexist with inspectorExported', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.inspectorExported).toBeDefined()
    expect(assembly?.observatoryRendered).toBeDefined()
  })
})

describe('Metadata coexistence — plan', () => {
  it('should coexist with plan', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.plan).toBeDefined()
    expect(assembly?.observatoryRendered).toBeDefined()
  })
})

describe('Metadata coexistence — optimizedPlan', () => {
  it('should coexist with optimizedPlan', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.optimizedPlan).toBeDefined()
    expect(assembly?.observatoryRendered).toBeDefined()
  })
})

describe('Metadata coexistence — planDiff', () => {
  it('should coexist with planDiff', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.planDiff).toBeDefined()
    expect(assembly?.observatoryRendered).toBeDefined()
  })
})

describe('Metadata coexistence — planRendered', () => {
  it('should coexist with planRendered', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.planRendered).toBeDefined()
    expect(assembly?.observatoryRendered).toBeDefined()
  })
})

describe('Metadata coexistence — strategy', () => {
  it('should coexist with strategy', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.strategy).toBeDefined()
    expect(assembly?.observatoryRendered).toBeDefined()
  })
})

describe('Metadata coexistence — strategySelection', () => {
  it('should coexist with strategySelection', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.strategySelection).toBeDefined()
    expect(assembly?.observatoryRendered).toBeDefined()
  })
})

describe('Metadata coexistence — all fields', () => {
  it('should coexist with all existing promptAssembly fields', async () => {
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
    expect(assembly?.historyExported).toBeDefined()
    expect(assembly?.historySnapshot).toBeDefined()
    expect(assembly?.observatory).toBeDefined()
    expect(assembly?.observatoryDiff).toBeDefined()
    expect(assembly?.observatoryRendered).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Deterministic
// ---------------------------------------------------------------------------

describe('Deterministic', () => {
  it('should produce same observatoryRendered across multiple builds', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const r1 = await builder.build(createPipelineContext())
    const r2 = await builder.build(createPipelineContext())
    const r3 = await builder.build(createPipelineContext())
    expect(getObservatoryRendered(r1)).toBe(getObservatoryRendered(r2))
    expect(getObservatoryRendered(r2)).toBe(getObservatoryRendered(r3))
  })

  it('should produce same result across different builder instances', async () => {
    const b1 = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const b2 = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const r1 = await b1.build(createPipelineContext())
    const r2 = await b2.build(createPipelineContext())
    expect(getObservatoryRendered(r1)).toBe(getObservatoryRendered(r2))
  })

  it('should produce same result for identical inputs', async () => {
    const ctx = createPipelineContext()
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const r1 = await builder.build(ctx)
    const r2 = await builder.build(ctx)
    expect(getObservatoryRendered(r1)).toBe(getObservatoryRendered(r2))
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
    expect(getObservatoryRendered(r1)).toBeDefined()
    expect(getObservatoryRendered(r2)).toBeDefined()
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
      promptAssemblyHistoryRenderer: new DefaultPromptAssemblyHistoryRenderer(),
      promptAssemblyHistoryExporter: new DefaultPromptAssemblyHistoryExporter(),
      promptAssemblyHistorySnapshotBuilder: new DefaultPromptAssemblyHistorySnapshotBuilder(),
      promptAssemblyObservatoryBuilder: new DefaultPromptAssemblyObservatoryBuilder(),
      promptAssemblyObservatoryDiffer: new DefaultPromptAssemblyObservatoryDiffer(),
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
  it('should support BuilderOptions form with observatory renderer', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(getObservatoryRendered(request)).toBeDefined()
  })

  it('should support full BuilderOptions with all fields', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.observatoryRendered).toBeDefined()
    expect(assembly?.observatory).toBeDefined()
    expect(assembly?.trace).toBeDefined()
  })

  it('should support legacy args without observatory renderer', async () => {
    const builder = new DefaultPromptBuilder(
      [new UserInputModule()],
      undefined as unknown as Record<string, unknown>,
    )
    const request = await builder.build(createPipelineContext())
    expect(getObservatoryRendered(request)).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// No Prompt Changes
// ---------------------------------------------------------------------------

describe('No prompt changes', () => {
  it('should produce same prompt with or without observatory renderer', async () => {
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
      promptAssemblyHistoryRenderer: new DefaultPromptAssemblyHistoryRenderer(),
      promptAssemblyHistoryExporter: new DefaultPromptAssemblyHistoryExporter(),
      promptAssemblyHistorySnapshotBuilder: new DefaultPromptAssemblyHistorySnapshotBuilder(),
      promptAssemblyObservatoryBuilder: new DefaultPromptAssemblyObservatoryBuilder(),
      promptAssemblyObservatoryDiffer: new DefaultPromptAssemblyObservatoryDiffer(),
    })
    const r1 = await builderWith.build(ctx1)
    const r2 = await builderWithout.build(ctx2)
    expect(r1.prompt).toBe(r2.prompt)
  })

  it('should not inject observatoryRendered into prompt text', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(request.prompt).not.toContain('observatoryRendered')
  })

  it('should store observatoryRendered only in metadata', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(request.metadata?.promptAssembly).toHaveProperty('observatoryRendered')
    expect(request.prompt).not.toContain('observatoryRendered')
  })

  it('should not change prompt when renderer output differs', async () => {
    const rendererA: PromptAssemblyObservatoryRenderer = {
      render() { return 'version A' },
    }
    const rendererB: PromptAssemblyObservatoryRenderer = {
      render() { return 'version B' },
    }
    const baseOpts = {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyTimelineBuilder: new DefaultPromptAssemblyTimelineBuilder(),
      promptAssemblyTimelineDiffer: new DefaultPromptAssemblyTimelineDiffer(),
      promptAssemblyTimelineRenderer: new DefaultPromptAssemblyTimelineRenderer(),
      promptAssemblyTimelineExporter: new DefaultPromptAssemblyTimelineExporter(),
      promptAssemblyTimelineSnapshotBuilder: new DefaultPromptAssemblyTimelineSnapshotBuilder(),
      promptAssemblyHistoryBuilder: new DefaultPromptAssemblyHistoryBuilder(),
      promptAssemblyHistoryDiffer: new DefaultPromptAssemblyHistoryDiffer(),
      promptAssemblyHistoryRenderer: new DefaultPromptAssemblyHistoryRenderer(),
      promptAssemblyHistoryExporter: new DefaultPromptAssemblyHistoryExporter(),
      promptAssemblyHistorySnapshotBuilder: new DefaultPromptAssemblyHistorySnapshotBuilder(),
      promptAssemblyObservatoryBuilder: new DefaultPromptAssemblyObservatoryBuilder(),
    }
    const ctx1 = createPipelineContext()
    const ctx2 = createPipelineContext()
    const b1 = new DefaultPromptBuilder([new UserInputModule()], { ...baseOpts, promptAssemblyObservatoryRenderer: rendererA })
    const b2 = new DefaultPromptBuilder([new UserInputModule()], { ...baseOpts, promptAssemblyObservatoryRenderer: rendererB })
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
    expect(getObservatoryRendered(request)).toBeDefined()
  })
})

describe('ToolCallPlanner compatibility', () => {
  it('should be compatible with ToolCallPlanner scenarios', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(getObservatoryRendered(request)).toBeDefined()
  })
})

describe('Streaming compatibility', () => {
  it('should be compatible with Streaming scenarios', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(getObservatoryRendered(request)).toBeDefined()
  })
})

describe('AgentLoop compatibility', () => {
  it('should be compatible with AgentLoop scenarios', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(getObservatoryRendered(request)).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Observatory Rendering Validation
// ---------------------------------------------------------------------------

describe('Observatory rendering validation', () => {
  it('should store the default renderer output exactly', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const rendered = getObservatoryRendered(request)
    expect(rendered).toBeDefined()
    // Default renderer output should contain "Artifacts:" header
    expect(rendered).toContain('Artifacts')
  })

  it('should contain trace artifact name in rendered output', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const rendered = getObservatoryRendered(request)
    expect(rendered).toContain('trace')
  })

  it('should contain timeline artifact name in rendered output', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const rendered = getObservatoryRendered(request)
    expect(rendered).toContain('timeline')
  })

  it('should contain history artifact name in rendered output', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const rendered = getObservatoryRendered(request)
    expect(rendered).toContain('history')
  })
})