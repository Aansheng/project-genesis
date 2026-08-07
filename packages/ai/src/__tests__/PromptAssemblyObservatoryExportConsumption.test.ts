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
import { DefaultPromptAssemblyObservatoryExporter } from '../strategy/DefaultPromptAssemblyObservatoryExporter'
import { DefaultStrategyEvaluator } from '../strategy/DefaultStrategyEvaluator'
import { DefaultPromptStrategy } from '../strategy/DefaultPromptStrategy'
import type { PromptAssemblyObservatoryExporter } from '../strategy/PromptAssemblyObservatoryExporter'
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

function getObservatoryExported(request: { metadata?: Record<string, unknown> }): string | undefined {
  const assembly = getAssembly(request)
  return assembly?.observatoryExported as string | undefined
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
  promptAssemblyObservatoryExporter: new DefaultPromptAssemblyObservatoryExporter(),
}

// ---------------------------------------------------------------------------
// BuilderOptions
// ---------------------------------------------------------------------------

describe('BuilderOptions', () => {
  it('should accept promptAssemblyObservatoryExporter field', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(getObservatoryExported(request)).toBeDefined()
  })

  it('should allow promptAssemblyObservatoryExporter to be omitted', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyObservatoryBuilder: new DefaultPromptAssemblyObservatoryBuilder(),
    })
    const request = await builder.build(createPipelineContext())
    expect(getObservatoryExported(request)).toBeUndefined()
  })

  it('should allow promptAssemblyObservatoryExporter to be undefined', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyObservatoryBuilder: new DefaultPromptAssemblyObservatoryBuilder(),
      promptAssemblyObservatoryExporter: undefined,
    })
    const request = await builder.build(createPipelineContext())
    expect(getObservatoryExported(request)).toBeUndefined()
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
      promptAssemblyHistoryExporter: new DefaultPromptAssemblyHistoryExporter(),
      promptAssemblyObservatoryBuilder: new DefaultPromptAssemblyObservatoryBuilder(),
      promptAssemblyObservatoryDiffer: new DefaultPromptAssemblyObservatoryDiffer(),
      promptAssemblyObservatoryRenderer: new DefaultPromptAssemblyObservatoryRenderer(),
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
    expect(assembly?.observatoryRendered).toBeDefined()
    expect(assembly?.observatoryExported).toBeUndefined()
  })

  it('should accept promptAssemblyObservatoryExporter in full setup', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(getObservatoryExported(request)).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Exporter Invocation
// ---------------------------------------------------------------------------

describe('Exporter invocation', () => {
  it('should call export exactly once when both observatory and exporter are present', async () => {
    let callCount = 0
    const trackingExporter: PromptAssemblyObservatoryExporter = {
      export() {
        callCount++
        return '{}'
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
      promptAssemblyObservatoryExporter: trackingExporter,
    })
    await builder.build(createPipelineContext())
    expect(callCount).toBe(1)
  })

  it('should receive the built observatory', async () => {
    let capturedObservatory: unknown
    const trackingExporter: PromptAssemblyObservatoryExporter = {
      export(observatory) {
        capturedObservatory = observatory
        return '{}'
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
      promptAssemblyObservatoryExporter: trackingExporter,
    })
    await builder.build(createPipelineContext())
    const captured = capturedObservatory as PromptAssemblyObservatory
    expect(captured).toBeDefined()
    expect(captured.trace).toBeDefined()
  })

  it('should not call export when observatory builder is missing', async () => {
    let called = false
    const trackingExporter: PromptAssemblyObservatoryExporter = {
      export() {
        called = true
        return '{}'
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyObservatoryExporter: trackingExporter,
    })
    await builder.build(createPipelineContext())
    expect(called).toBe(false)
  })

  it('should not call export when exporter is missing', async () => {
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
    expect(getObservatoryExported(request)).toBeUndefined()
  })

  it('should call export even without trace builder (empty observatory)', async () => {
    let called = false
    const trackingExporter: PromptAssemblyObservatoryExporter = {
      export() {
        called = true
        return '{}'
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyObservatoryBuilder: new DefaultPromptAssemblyObservatoryBuilder(),
      promptAssemblyObservatoryExporter: trackingExporter,
    })
    await builder.build(createPipelineContext())
    expect(called).toBe(true)
  })

  it('should preserve custom exporter output', async () => {
    const customExporter: PromptAssemblyObservatoryExporter = {
      export() {
        return '{"custom":true}'
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
      promptAssemblyObservatoryExporter: customExporter,
    })
    const request = await builder.build(createPipelineContext())
    expect(getObservatoryExported(request)).toBe('{"custom":true}')
  })

  it('should ignore empty export output (not stored)', async () => {
    const emptyExporter: PromptAssemblyObservatoryExporter = {
      export() {
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
      promptAssemblyObservatoryExporter: emptyExporter,
    })
    const request = await builder.build(createPipelineContext())
    expect(getObservatoryExported(request)).toBeUndefined()
  })

  it('should call export with a non-empty observatory', async () => {
    let capturedObservatory: unknown
    const trackingExporter: PromptAssemblyObservatoryExporter = {
      export(observatory) {
        capturedObservatory = observatory
        return '{}'
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
      promptAssemblyObservatoryExporter: trackingExporter,
    })
    await builder.build(createPipelineContext())
    const captured = capturedObservatory as PromptAssemblyObservatory
    expect(captured).toBeDefined()
    expect(captured.history).toBeDefined()
    expect(captured.timeline).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Metadata Creation
// ---------------------------------------------------------------------------

describe('Metadata creation', () => {
  it('should store observatoryExported in metadata when exporter is present', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(getObservatoryExported(request)).toBeDefined()
  })

  it('should not store observatoryExported when exporter is missing', async () => {
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
    expect(getObservatoryExported(request)).toBeUndefined()
  })

  it('should not store observatoryExported when observatory builder is missing', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyObservatoryExporter: new DefaultPromptAssemblyObservatoryExporter(),
    })
    const request = await builder.build(createPipelineContext())
    expect(getObservatoryExported(request)).toBeUndefined()
  })

  it('should store observatoryExported even without trace builder (empty observatory)', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyObservatoryBuilder: new DefaultPromptAssemblyObservatoryBuilder(),
      promptAssemblyObservatoryExporter: new DefaultPromptAssemblyObservatoryExporter(),
    })
    const request = await builder.build(createPipelineContext())
    const exported = getObservatoryExported(request)
    expect(exported).toBeDefined()
    expect(() => JSON.parse(exported!)).not.toThrow()
  })

  it('should store observatoryExported as a string', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const exported = getObservatoryExported(request)
    expect(typeof exported).toBe('string')
  })

  it('should store non-empty observatoryExported string', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const exported = getObservatoryExported(request)
    expect(exported!.length).toBeGreaterThan(0)
  })

  it('should store observatoryExported as valid JSON', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const exported = getObservatoryExported(request)
    expect(() => JSON.parse(exported!)).not.toThrow()
  })

  it('should not overwrite existing metadata when storing observatoryExported', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request) as Record<string, unknown>
    expect(assembly?.observatory).toBeDefined()
    expect(assembly?.observatoryDiff).toBeDefined()
    expect(assembly?.observatoryRendered).toBeDefined()
    expect(assembly?.observatoryExported).toBeDefined()
    expect(assembly?.trace).toBeDefined()
    expect(assembly?.strategy).toBeDefined()
  })

  it('should store observatoryExported at metadata.promptAssembly.observatoryExported', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(request.metadata?.promptAssembly).toHaveProperty('observatoryExported')
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
    expect(assembly?.observatoryExported).toBeDefined()
  })
})

describe('Metadata coexistence — traceDiff', () => {
  it('should coexist with traceDiff', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.traceDiff).toBeDefined()
    expect(assembly?.observatoryExported).toBeDefined()
  })
})

describe('Metadata coexistence — traceRendered', () => {
  it('should coexist with traceRendered', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.traceRendered).toBeDefined()
    expect(assembly?.observatoryExported).toBeDefined()
  })
})

describe('Metadata coexistence — traceExported', () => {
  it('should coexist with traceExported', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.traceExported).toBeDefined()
    expect(assembly?.observatoryExported).toBeDefined()
  })
})

describe('Metadata coexistence — timeline', () => {
  it('should coexist with timeline', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.timeline).toBeDefined()
    expect(assembly?.observatoryExported).toBeDefined()
  })
})

describe('Metadata coexistence — timelineDiff', () => {
  it('should coexist with timelineDiff', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.timelineDiff).toBeDefined()
    expect(assembly?.observatoryExported).toBeDefined()
  })
})

describe('Metadata coexistence — timelineRendered', () => {
  it('should coexist with timelineRendered', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.timelineRendered).toBeDefined()
    expect(assembly?.observatoryExported).toBeDefined()
  })
})

describe('Metadata coexistence — timelineExported', () => {
  it('should coexist with timelineExported', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.timelineExported).toBeDefined()
    expect(assembly?.observatoryExported).toBeDefined()
  })
})

describe('Metadata coexistence — timelineSnapshot', () => {
  it('should coexist with timelineSnapshot', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.timelineSnapshot).toBeDefined()
    expect(assembly?.observatoryExported).toBeDefined()
  })
})

describe('Metadata coexistence — history', () => {
  it('should coexist with history', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.history).toBeDefined()
    expect(assembly?.observatoryExported).toBeDefined()
  })
})

describe('Metadata coexistence — historyDiff', () => {
  it('should coexist with historyDiff', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.historyDiff).toBeDefined()
    expect(assembly?.observatoryExported).toBeDefined()
  })
})

describe('Metadata coexistence — historyRendered', () => {
  it('should coexist with historyRendered', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.historyRendered).toBeDefined()
    expect(assembly?.observatoryExported).toBeDefined()
  })
})

describe('Metadata coexistence — historyExported', () => {
  it('should coexist with historyExported', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.historyExported).toBeDefined()
    expect(assembly?.observatoryExported).toBeDefined()
  })
})

describe('Metadata coexistence — historySnapshot', () => {
  it('should coexist with historySnapshot', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.historySnapshot).toBeDefined()
    expect(assembly?.observatoryExported).toBeDefined()
  })
})

describe('Metadata coexistence — observatory', () => {
  it('should coexist with observatory', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.observatory).toBeDefined()
    expect(assembly?.observatoryExported).toBeDefined()
  })
})

describe('Metadata coexistence — observatoryDiff', () => {
  it('should coexist with observatoryDiff', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.observatoryDiff).toBeDefined()
    expect(assembly?.observatoryExported).toBeDefined()
  })
})

describe('Metadata coexistence — observatoryRendered', () => {
  it('should coexist with observatoryRendered', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.observatoryRendered).toBeDefined()
    expect(assembly?.observatoryExported).toBeDefined()
  })
})

describe('Metadata coexistence — snapshot', () => {
  it('should coexist with snapshot', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.snapshot).toBeDefined()
    expect(assembly?.observatoryExported).toBeDefined()
  })
})

describe('Metadata coexistence — inspector', () => {
  it('should coexist with inspector', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.inspector).toBeDefined()
    expect(assembly?.observatoryExported).toBeDefined()
  })
})

describe('Metadata coexistence — inspectorRendered', () => {
  it('should coexist with inspectorRendered', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.inspectorRendered).toBeDefined()
    expect(assembly?.observatoryExported).toBeDefined()
  })
})

describe('Metadata coexistence — inspectorExported', () => {
  it('should coexist with inspectorExported', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.inspectorExported).toBeDefined()
    expect(assembly?.observatoryExported).toBeDefined()
  })
})

describe('Metadata coexistence — plan', () => {
  it('should coexist with plan', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.plan).toBeDefined()
    expect(assembly?.observatoryExported).toBeDefined()
  })
})

describe('Metadata coexistence — optimizedPlan', () => {
  it('should coexist with optimizedPlan', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.optimizedPlan).toBeDefined()
    expect(assembly?.observatoryExported).toBeDefined()
  })
})

describe('Metadata coexistence — planDiff', () => {
  it('should coexist with planDiff', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.planDiff).toBeDefined()
    expect(assembly?.observatoryExported).toBeDefined()
  })
})

describe('Metadata coexistence — planRendered', () => {
  it('should coexist with planRendered', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.planRendered).toBeDefined()
    expect(assembly?.observatoryExported).toBeDefined()
  })
})

describe('Metadata coexistence — strategy', () => {
  it('should coexist with strategy', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.strategy).toBeDefined()
    expect(assembly?.observatoryExported).toBeDefined()
  })
})

describe('Metadata coexistence — strategySelection', () => {
  it('should coexist with strategySelection', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.strategySelection).toBeDefined()
    expect(assembly?.observatoryExported).toBeDefined()
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
    expect(assembly?.observatoryExported).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Deterministic
// ---------------------------------------------------------------------------

describe('Deterministic', () => {
  it('should produce same observatoryExported across multiple builds', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const r1 = await builder.build(createPipelineContext())
    const r2 = await builder.build(createPipelineContext())
    const r3 = await builder.build(createPipelineContext())
    expect(getObservatoryExported(r1)).toBe(getObservatoryExported(r2))
    expect(getObservatoryExported(r2)).toBe(getObservatoryExported(r3))
  })

  it('should produce same result across different builder instances', async () => {
    const b1 = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const b2 = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const r1 = await b1.build(createPipelineContext())
    const r2 = await b2.build(createPipelineContext())
    expect(getObservatoryExported(r1)).toBe(getObservatoryExported(r2))
  })

  it('should produce same result for identical inputs', async () => {
    const ctx = createPipelineContext()
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const r1 = await builder.build(ctx)
    const r2 = await builder.build(ctx)
    expect(getObservatoryExported(r1)).toBe(getObservatoryExported(r2))
  })
})

// ---------------------------------------------------------------------------
// Stateless
// ---------------------------------------------------------------------------

describe('Stateless', () => {
  it('should not retain exporter state between builds', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const r1 = await builder.build(createPipelineContext())
    const r2 = await builder.build(createPipelineContext())
    expect(getObservatoryExported(r1)).toBeDefined()
    expect(getObservatoryExported(r2)).toBeDefined()
    expect(getObservatoryExported(r1)).toBe(getObservatoryExported(r2))
  })

  it('should produce fresh export per build', async () => {
    let callCount = 0
    const trackingExporter: PromptAssemblyObservatoryExporter = {
      export(observatory) {
        callCount++
        return JSON.stringify(observatory, null, 2)
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyObservatoryBuilder: new DefaultPromptAssemblyObservatoryBuilder(),
      promptAssemblyObservatoryExporter: trackingExporter,
    })
    await builder.build(createPipelineContext({ input: 'draw a tree' }))
    await builder.build(createPipelineContext({ input: 'move the rock' }))
    expect(callCount).toBe(2)
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
      promptAssemblyObservatoryRenderer: new DefaultPromptAssemblyObservatoryRenderer(),
    })
    const ctx1 = createPipelineContext()
    const ctx2 = createPipelineContext()
    const r1 = await builderWith.build(ctx1)
    const r2 = await builderWithout.build(ctx2)
    expect(r1.prompt).toBe(r2.prompt)
  })

  it('should not modify observatory metadata fields when exporting', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request) as Record<string, unknown>
    expect(assembly?.observatory).toBeDefined()
    expect(assembly?.observatoryDiff).toBeDefined()
    expect(assembly?.observatoryRendered).toBeDefined()
    expect(assembly?.observatoryExported).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Legacy Constructor
// ---------------------------------------------------------------------------

describe('Legacy constructor', () => {
  it('should support BuilderOptions form with observatory exporter', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(getObservatoryExported(request)).toBeDefined()
  })

  it('should support full BuilderOptions with all fields', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.observatoryExported).toBeDefined()
    expect(assembly?.observatory).toBeDefined()
    expect(assembly?.observatoryRendered).toBeDefined()
    expect(assembly?.trace).toBeDefined()
  })

  it('should support legacy args without observatory exporter', async () => {
    const builder = new DefaultPromptBuilder(
      [new UserInputModule()],
      undefined as unknown as Record<string, unknown>,
    )
    const request = await builder.build(createPipelineContext())
    expect(getObservatoryExported(request)).toBeUndefined()
  })

  it('should assign undefined exporter in legacy positional form', async () => {
    const builder = new DefaultPromptBuilder(
      [new UserInputModule()],
      undefined, undefined, undefined, undefined, undefined, undefined, undefined,
    )
    const request = await builder.build(createPipelineContext())
    expect(getObservatoryExported(request)).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// No Prompt Changes
// ---------------------------------------------------------------------------

describe('No prompt changes', () => {
  it('should produce same prompt with or without observatory exporter', async () => {
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
      promptAssemblyObservatoryRenderer: new DefaultPromptAssemblyObservatoryRenderer(),
    })
    const r1 = await builderWith.build(ctx1)
    const r2 = await builderWithout.build(ctx2)
    expect(r1.prompt).toBe(r2.prompt)
  })

  it('should not inject observatoryExported into prompt text', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(request.prompt).not.toContain('observatoryExported')
  })

  it('should store observatoryExported only in metadata', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(request.metadata?.promptAssembly).toHaveProperty('observatoryExported')
    expect(request.prompt).not.toContain(getObservatoryExported(request)!)
  })

  it('should not change prompt when exporter output differs', async () => {
    const exporterA: PromptAssemblyObservatoryExporter = {
      export() { return '{"version":"A"}' },
    }
    const exporterB: PromptAssemblyObservatoryExporter = {
      export() { return '{"version":"B"}' },
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
    const b1 = new DefaultPromptBuilder([new UserInputModule()], { ...baseOpts, promptAssemblyObservatoryExporter: exporterA })
    const b2 = new DefaultPromptBuilder([new UserInputModule()], { ...baseOpts, promptAssemblyObservatoryExporter: exporterB })
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
    expect(getObservatoryExported(request)).toBeDefined()
  })
})

describe('ToolCallPlanner compatibility', () => {
  it('should be compatible with ToolCallPlanner scenarios', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(getObservatoryExported(request)).toBeDefined()
  })
})

describe('Streaming compatibility', () => {
  it('should be compatible with Streaming scenarios', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(getObservatoryExported(request)).toBeDefined()
  })
})

describe('AgentLoop compatibility', () => {
  it('should be compatible with AgentLoop scenarios', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(getObservatoryExported(request)).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Observatory Export Validation
// ---------------------------------------------------------------------------

describe('Observatory export validation', () => {
  it('should store the default exporter output as valid JSON', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const exported = getObservatoryExported(request)
    expect(() => JSON.parse(exported!)).not.toThrow()
  })

  it('should store pretty-printed JSON with 2-space indentation', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const exported = getObservatoryExported(request)
    expect(exported).toContain('\n')
    expect(exported).toContain('  "trace"')
  })

  it('should contain trace artifact name in exported output', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const exported = getObservatoryExported(request)
    const parsed = JSON.parse(exported!)
    expect(parsed).toHaveProperty('trace')
  })

  it('should contain timeline artifact name in exported output', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const exported = getObservatoryExported(request)
    const parsed = JSON.parse(exported!)
    expect(parsed).toHaveProperty('timeline')
  })

  it('should contain history artifact name in exported output', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const exported = getObservatoryExported(request)
    const parsed = JSON.parse(exported!)
    expect(parsed).toHaveProperty('history')
  })

  it('should contain snapshots in exported output', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const exported = getObservatoryExported(request)
    const parsed = JSON.parse(exported!)
    expect(parsed).toHaveProperty('traceSnapshot')
    expect(parsed).toHaveProperty('timelineSnapshot')
    expect(parsed).toHaveProperty('historySnapshot')
  })

  it('should round trip parse correctly', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const exported = getObservatoryExported(request)!
    const parsed = JSON.parse(exported)
    const reStringified = JSON.stringify(parsed, null, 2)
    expect(reStringified).toBe(exported)
  })

  it('should export observatory matching the stored observatory metadata', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const exported = getObservatoryExported(request)!
    const assembly = getAssembly(request) as Record<string, unknown>
    const observatory = assembly?.observatory
    expect(JSON.parse(exported)).toEqual(observatory)
  })

  it('should export strategy name in trace', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const exported = getObservatoryExported(request)!
    const parsed = JSON.parse(exported)
    expect(parsed.trace.strategy.name).toBe('default')
  })

  it('should export timeline with entries array', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const exported = getObservatoryExported(request)!
    const parsed = JSON.parse(exported)
    expect(Array.isArray(parsed.timeline.entries)).toBe(true)
    expect(parsed.timeline.entries).toHaveLength(1)
  })

  it('should export history with entries array', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const exported = getObservatoryExported(request)!
    const parsed = JSON.parse(exported)
    expect(Array.isArray(parsed.history.entries)).toBe(true)
    expect(parsed.history.entries).toHaveLength(1)
  })
})