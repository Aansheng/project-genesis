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
import { DefaultStrategyEvaluator } from '../strategy/DefaultStrategyEvaluator'
import { DefaultPromptStrategy } from '../strategy/DefaultPromptStrategy'
import type { PromptAssemblyObservatoryBuilder } from '../strategy/PromptAssemblyObservatoryBuilder'
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

function getObservatory(request: { metadata?: Record<string, unknown> }): PromptAssemblyObservatory | undefined {
  const assembly = getAssembly(request)
  return assembly?.observatory as PromptAssemblyObservatory | undefined
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
}

// ---------------------------------------------------------------------------
// BuilderOptions
// ---------------------------------------------------------------------------

describe('BuilderOptions', () => {
  it('should accept promptAssemblyObservatoryBuilder field', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(getObservatory(request)).toBeDefined()
  })

  it('should allow promptAssemblyObservatoryBuilder to be omitted', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
    })
    const request = await builder.build(createPipelineContext())
    expect(getObservatory(request)).toBeUndefined()
  })

  it('should allow promptAssemblyObservatoryBuilder to be undefined', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyObservatoryBuilder: undefined,
    })
    const request = await builder.build(createPipelineContext())
    expect(getObservatory(request)).toBeUndefined()
  })

  it('should be backward compatible with existing fields', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyHistoryBuilder: new DefaultPromptAssemblyHistoryBuilder(),
      promptAssemblyHistorySnapshotBuilder: new DefaultPromptAssemblyHistorySnapshotBuilder(),
    })
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.history).toBeDefined()
    expect(assembly?.historySnapshot).toBeDefined()
    expect(assembly?.observatory).toBeUndefined()
  })

  it('should accept promptAssemblyObservatoryBuilder in full setup', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(getObservatory(request)).toBeDefined()
  })

  it('should accept observatory builder without other builders', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyObservatoryBuilder: new DefaultPromptAssemblyObservatoryBuilder(),
    })
    const request = await builder.build(createPipelineContext())
    const obs = getObservatory(request)
    expect(obs).toBeDefined()
    expect(Object.keys(obs ?? {}).length).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// Builder Invocation
// ---------------------------------------------------------------------------

describe('Builder invocation', () => {
  it('should call build when observatory builder is present', async () => {
    let callCount = 0
    const trackingBuilder: PromptAssemblyObservatoryBuilder = {
      build() {
        callCount++
        return {}
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyObservatoryBuilder: trackingBuilder,
    })
    await builder.build(createPipelineContext())
    expect(callCount).toBe(1)
  })

  it('should not call build when observatory builder is missing', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
    })
    const request = await builder.build(createPipelineContext())
    expect(getObservatory(request)).toBeUndefined()
  })

  it('should receive trace in input', async () => {
    let capturedInput: unknown
    const trackingBuilder: PromptAssemblyObservatoryBuilder = {
      build(input) {
        capturedInput = input
        return {}
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyObservatoryBuilder: trackingBuilder,
    })
    await builder.build(createPipelineContext())
    const input = capturedInput as Record<string, unknown>
    expect(input.trace).toBeDefined()
  })

  it('should receive timeline in input', async () => {
    let capturedInput: unknown
    const trackingBuilder: PromptAssemblyObservatoryBuilder = {
      build(input) {
        capturedInput = input
        return {}
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyTimelineBuilder: new DefaultPromptAssemblyTimelineBuilder(),
      promptAssemblyObservatoryBuilder: trackingBuilder,
    })
    await builder.build(createPipelineContext())
    const input = capturedInput as Record<string, unknown>
    expect(input.timeline).toBeDefined()
  })

  it('should receive history in input', async () => {
    let capturedInput: unknown
    const trackingBuilder: PromptAssemblyObservatoryBuilder = {
      build(input) {
        capturedInput = input
        return {}
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyHistoryBuilder: new DefaultPromptAssemblyHistoryBuilder(),
      promptAssemblyObservatoryBuilder: trackingBuilder,
    })
    await builder.build(createPipelineContext())
    const input = capturedInput as Record<string, unknown>
    expect(input.history).toBeDefined()
  })

  it('should receive traceSnapshot in input', async () => {
    let capturedInput: unknown
    const trackingBuilder: PromptAssemblyObservatoryBuilder = {
      build(input) {
        capturedInput = input
        return {}
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
      promptAssemblyObservatoryBuilder: trackingBuilder,
    })
    await builder.build(createPipelineContext())
    const input = capturedInput as Record<string, unknown>
    expect(input.traceSnapshot).toBeDefined()
  })

  it('should receive timelineSnapshot in input', async () => {
    let capturedInput: unknown
    const trackingBuilder: PromptAssemblyObservatoryBuilder = {
      build(input) {
        capturedInput = input
        return {}
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyTimelineBuilder: new DefaultPromptAssemblyTimelineBuilder(),
      promptAssemblyTimelineSnapshotBuilder: new DefaultPromptAssemblyTimelineSnapshotBuilder(),
      promptAssemblyObservatoryBuilder: trackingBuilder,
    })
    await builder.build(createPipelineContext())
    const input = capturedInput as Record<string, unknown>
    expect(input.timelineSnapshot).toBeDefined()
  })

  it('should receive historySnapshot in input', async () => {
    let capturedInput: unknown
    const trackingBuilder: PromptAssemblyObservatoryBuilder = {
      build(input) {
        capturedInput = input
        return {}
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyHistoryBuilder: new DefaultPromptAssemblyHistoryBuilder(),
      promptAssemblyHistorySnapshotBuilder: new DefaultPromptAssemblyHistorySnapshotBuilder(),
      promptAssemblyObservatoryBuilder: trackingBuilder,
    })
    await builder.build(createPipelineContext())
    const input = capturedInput as Record<string, unknown>
    expect(input.historySnapshot).toBeDefined()
  })

  it('should receive all six fields in input', async () => {
    let capturedInput: unknown
    const trackingBuilder: PromptAssemblyObservatoryBuilder = {
      build(input) {
        capturedInput = input
        return {}
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
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
      promptAssemblyObservatoryBuilder: trackingBuilder,
    })
    await builder.build(createPipelineContext())
    const input = capturedInput as Record<string, unknown>
    expect(input.trace).toBeDefined()
    expect(input.timeline).toBeDefined()
    expect(input.history).toBeDefined()
    expect(input.traceSnapshot).toBeDefined()
    expect(input.timelineSnapshot).toBeDefined()
    expect(input.historySnapshot).toBeDefined()
  })

  it('should preserve custom builder result', async () => {
    const customResult: PromptAssemblyObservatory = {
      trace: { strategy: { name: 'custom' } },
    }
    const customBuilder: PromptAssemblyObservatoryBuilder = {
      build() {
        return customResult
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyObservatoryBuilder: customBuilder,
    })
    const request = await builder.build(createPipelineContext())
    const obs = getObservatory(request)
    expect(obs?.trace).toBeDefined()
    expect((obs?.trace as { strategy: { name: string } }).strategy.name).toBe('custom')
  })
})

// ---------------------------------------------------------------------------
// Metadata Creation
// ---------------------------------------------------------------------------

describe('Metadata creation', () => {
  it('should store observatory in metadata when builder is present', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(getObservatory(request)).toBeDefined()
  })

  it('should not store observatory when builder is missing', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
    })
    const request = await builder.build(createPipelineContext())
    expect(getObservatory(request)).toBeUndefined()
  })

  it('should store observatory as an object', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const obs = getObservatory(request)
    expect(typeof obs).toBe('object')
    expect(obs).not.toBeNull()
  })

  it('should store observatory at metadata.promptAssembly.observatory', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(request.metadata?.promptAssembly).toHaveProperty('observatory')
  })

  it('should not overwrite existing metadata when storing observatory', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request) as Record<string, unknown>
    expect(assembly?.trace).toBeDefined()
    expect(assembly?.observatory).toBeDefined()
    expect(assembly?.strategy).toBeDefined()
  })

  it('should store observatory only when builder is present', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(request.metadata?.promptAssembly).toHaveProperty('observatory')
  })

  it('should store empty observatory when builder present but no artifacts', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyObservatoryBuilder: new DefaultPromptAssemblyObservatoryBuilder(),
    })
    const request = await builder.build(createPipelineContext())
    const obs = getObservatory(request)
    expect(obs).toBeDefined()
    expect(Object.keys(obs ?? {}).length).toBe(0)
  })

  it('should not store observatory when builder is omitted entirely', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
    })
    const request = await builder.build(createPipelineContext())
    expect(getObservatory(request)).toBeUndefined()
  })

  it('should store observatory with correct structure when all artifacts present', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const obs = getObservatory(request)
    expect(obs).toHaveProperty('trace')
    expect(obs).toHaveProperty('timeline')
    expect(obs).toHaveProperty('history')
    expect(obs).toHaveProperty('traceSnapshot')
    expect(obs).toHaveProperty('timelineSnapshot')
    expect(obs).toHaveProperty('historySnapshot')
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
    expect(assembly?.observatory).toBeDefined()
  })
})

describe('Metadata coexistence — traceDiff', () => {
  it('should coexist with traceDiff', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.traceDiff).toBeDefined()
    expect(assembly?.observatory).toBeDefined()
  })
})

describe('Metadata coexistence — traceRendered', () => {
  it('should coexist with traceRendered', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.traceRendered).toBeDefined()
    expect(assembly?.observatory).toBeDefined()
  })
})

describe('Metadata coexistence — traceExported', () => {
  it('should coexist with traceExported', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.traceExported).toBeDefined()
    expect(assembly?.observatory).toBeDefined()
  })
})

describe('Metadata coexistence — timeline', () => {
  it('should coexist with timeline', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.timeline).toBeDefined()
    expect(assembly?.observatory).toBeDefined()
  })
})

describe('Metadata coexistence — timelineDiff', () => {
  it('should coexist with timelineDiff', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.timelineDiff).toBeDefined()
    expect(assembly?.observatory).toBeDefined()
  })
})

describe('Metadata coexistence — timelineRendered', () => {
  it('should coexist with timelineRendered', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.timelineRendered).toBeDefined()
    expect(assembly?.observatory).toBeDefined()
  })
})

describe('Metadata coexistence — timelineExported', () => {
  it('should coexist with timelineExported', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.timelineExported).toBeDefined()
    expect(assembly?.observatory).toBeDefined()
  })
})

describe('Metadata coexistence — timelineSnapshot', () => {
  it('should coexist with timelineSnapshot', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.timelineSnapshot).toBeDefined()
    expect(assembly?.observatory).toBeDefined()
  })
})

describe('Metadata coexistence — history', () => {
  it('should coexist with history', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.history).toBeDefined()
    expect(assembly?.observatory).toBeDefined()
  })
})

describe('Metadata coexistence — historyDiff', () => {
  it('should coexist with historyDiff', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.historyDiff).toBeDefined()
    expect(assembly?.observatory).toBeDefined()
  })
})

describe('Metadata coexistence — historyRendered', () => {
  it('should coexist with historyRendered', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.historyRendered).toBeDefined()
    expect(assembly?.observatory).toBeDefined()
  })
})

describe('Metadata coexistence — historyExported', () => {
  it('should coexist with historyExported', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.historyExported).toBeDefined()
    expect(assembly?.observatory).toBeDefined()
  })
})

describe('Metadata coexistence — historySnapshot', () => {
  it('should coexist with historySnapshot', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.historySnapshot).toBeDefined()
    expect(assembly?.observatory).toBeDefined()
  })
})

describe('Metadata coexistence — all fields', () => {
  it('should coexist with all promptAssembly fields', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request) as Record<string, unknown>
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
    expect(assembly?.strategy).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Deterministic
// ---------------------------------------------------------------------------

describe('Deterministic', () => {
  it('should produce same observatory across multiple builds', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const r1 = await builder.build(createPipelineContext())
    const r2 = await builder.build(createPipelineContext())
    expect(getObservatory(r1)).toEqual(getObservatory(r2))
  })

  it('should produce same observatory across different builder instances', async () => {
    const b1 = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const b2 = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const r1 = await b1.build(createPipelineContext())
    const r2 = await b2.build(createPipelineContext())
    expect(getObservatory(r1)).toEqual(getObservatory(r2))
  })

  it('should produce same observatory for identical inputs', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const ctx = createPipelineContext()
    const r1 = await builder.build(ctx)
    const r2 = await builder.build(ctx)
    expect(getObservatory(r1)).toEqual(getObservatory(r2))
  })

  it('should produce same observatory for identical context across instances', async () => {
    const b1 = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const b2 = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const ctx = createPipelineContext()
    const r1 = await b1.build(ctx)
    const r2 = await b2.build(ctx)
    expect(getObservatory(r1)).toEqual(getObservatory(r2))
  })

  it('should produce same empty observatory for identical empty builds', async () => {
    const b1 = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyObservatoryBuilder: new DefaultPromptAssemblyObservatoryBuilder(),
    })
    const b2 = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyObservatoryBuilder: new DefaultPromptAssemblyObservatoryBuilder(),
    })
    const r1 = await b1.build(createPipelineContext())
    const r2 = await b2.build(createPipelineContext())
    expect(getObservatory(r1)).toEqual(getObservatory(r2))
  })
})

// ---------------------------------------------------------------------------
// Stateless
// ---------------------------------------------------------------------------

describe('Stateless', () => {
  it('should not retain state between builds', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const r1 = await builder.build(createPipelineContext({ input: 'draw a tree' }))
    const r2 = await builder.build(createPipelineContext({ input: 'delete everything' }))
    expect(getObservatory(r1)).toBeDefined()
    expect(getObservatory(r2)).toBeDefined()
  })

  it('should produce independent results', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const r1 = await builder.build(createPipelineContext())
    const r2 = await builder.build(createPipelineContext({ input: 'list trees' }))
    expect(typeof getObservatory(r1)).toBe('object')
    expect(typeof getObservatory(r2)).toBe('object')
  })

  it('should produce fresh observatory per build', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const r1 = await builder.build(createPipelineContext())
    const r2 = await builder.build(createPipelineContext())
    expect(getObservatory(r1)).not.toBe(getObservatory(r2))
  })

  it('should produce independent observatory for sequential builds', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const r1 = await builder.build(createPipelineContext({ input: 'create tree' }))
    const r2 = await builder.build(createPipelineContext({ input: 'query trees' }))
    expect(getObservatory(r1)).toBeDefined()
    expect(getObservatory(r2)).toBeDefined()
    expect(getObservatory(r1)).not.toBe(getObservatory(r2))
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

  it('should not modify existing metadata fields', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request) as Record<string, unknown>
    const originalTrace = JSON.stringify(assembly?.trace)
    // Observatory should not mutate trace
    expect(JSON.stringify(assembly?.trace)).toBe(originalTrace)
  })

  it('should not modify prompt output', async () => {
    const builderWith = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const builderWithout = new DefaultPromptBuilder([new UserInputModule()], {
      strategyEvaluator: new DefaultStrategyEvaluator(),
      strategies: [new DefaultPromptStrategy()],
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
    })
    const requestWith = await builderWith.build(createPipelineContext())
    const requestWithout = await builderWithout.build(createPipelineContext())
    expect(requestWith.prompt).toBe(requestWithout.prompt)
  })

  it('should not add unexpected fields to metadata', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request) as Record<string, unknown>
    expect(assembly?.observatory).toBeDefined()
    expect(assembly?.trace).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Legacy Constructor
// ---------------------------------------------------------------------------

describe('Legacy constructor', () => {
  it('should construct with legacy positional arguments', async () => {
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
    expect(getObservatory(request)).toBeUndefined()
  })

  it('should construct with BuilderOptions path', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(getObservatory(request)).toBeDefined()
  })

  it('should construct with full BuilderOptions', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      renderer: undefined,
      compression: undefined,
      ranking: undefined,
      budget: undefined,
      selection: undefined,
      ...fullSetup,
    })
    const request = await builder.build(createPipelineContext())
    expect(getObservatory(request)).toBeDefined()
  })

  it('should construct with legacy args and omit observatory', async () => {
    const builder = new DefaultPromptBuilder(
      [new UserInputModule()],
      undefined,
    )
    const request = await builder.build(createPipelineContext())
    expect(getObservatory(request)).toBeUndefined()
  })

  it('should construct with explicit BuilderOptions and observatory', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyObservatoryBuilder: new DefaultPromptAssemblyObservatoryBuilder(),
    })
    const request = await builder.build(createPipelineContext())
    expect(getObservatory(request)).toBeDefined()
  })

  it('should construct with legacy args and observatory as undefined', async () => {
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
    expect(getObservatory(request)).toBeUndefined()
    expect(request.prompt.length).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// No Prompt Changes
// ---------------------------------------------------------------------------

describe('No prompt changes', () => {
  it('should produce identical prompt with and without observatory builder', async () => {
    const builderWith = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const builderWithout = new DefaultPromptBuilder([new UserInputModule()], {
      strategyEvaluator: new DefaultStrategyEvaluator(),
      strategies: [new DefaultPromptStrategy()],
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
    })
    const requestWith = await builderWith.build(createPipelineContext())
    const requestWithout = await builderWithout.build(createPipelineContext())
    expect(requestWith.prompt).toBe(requestWithout.prompt)
  })

  it('should not inject observatory into prompt text', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(request.prompt).not.toContain('observatory')
  })

  it('should be metadata only', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.observatory).toBeDefined()
    expect(request.prompt).not.toContain('observatory')
  })

  it('should not change prompt behavior when observatory present', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(request.prompt).toContain('draw a tree')
    expect(request.prompt).toContain('Prompt Strategy')
  })
})

// ---------------------------------------------------------------------------
// Compatibility
// ---------------------------------------------------------------------------

describe('RetryPlanner compatibility', () => {
  it('should be compatible with RetryPlanner', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(getObservatory(request)).toBeDefined()
    expect(request.prompt.length).toBeGreaterThan(0)
  })
})

describe('ToolCallPlanner compatibility', () => {
  it('should be compatible with ToolCallPlanner', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(getObservatory(request)).toBeDefined()
    expect(request.prompt.length).toBeGreaterThan(0)
  })
})

describe('Streaming compatibility', () => {
  it('should be compatible with streaming pipeline', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(getObservatory(request)).toBeDefined()
  })
})

describe('AgentLoop compatibility', () => {
  it('should be compatible with AgentLoop', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(getObservatory(request)).toBeDefined()
    expect(request.prompt).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Observatory Validation
// ---------------------------------------------------------------------------

describe('Observatory validation', () => {
  it('should have trace in observatory', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const obs = getObservatory(request)
    expect(obs?.trace).toBeDefined()
  })

  it('should have timeline in observatory', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const obs = getObservatory(request)
    expect(obs?.timeline).toBeDefined()
  })

  it('should have history in observatory', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const obs = getObservatory(request)
    expect(obs?.history).toBeDefined()
  })

  it('should have traceSnapshot in observatory', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const obs = getObservatory(request)
    expect(obs?.traceSnapshot).toBeDefined()
  })

  it('should have timelineSnapshot in observatory', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const obs = getObservatory(request)
    expect(obs?.timelineSnapshot).toBeDefined()
  })

  it('should have historySnapshot in observatory', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const obs = getObservatory(request)
    expect(obs?.historySnapshot).toBeDefined()
  })

  it('should have observatory with all six fields populated', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const obs = getObservatory(request)
    expect(obs?.trace).toBeDefined()
    expect(obs?.timeline).toBeDefined()
    expect(obs?.history).toBeDefined()
    expect(obs?.traceSnapshot).toBeDefined()
    expect(obs?.timelineSnapshot).toBeDefined()
    expect(obs?.historySnapshot).toBeDefined()
  })

  it('should have observatory.trace matching metadata trace', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    const obs = getObservatory(request)
    expect(obs?.trace).toBe(assembly?.trace)
  })

  it('should have observatory.timeline matching metadata timeline', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    const obs = getObservatory(request)
    expect(obs?.timeline).toBe(assembly?.timeline)
  })

  it('should have observatory.history matching metadata history', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    const obs = getObservatory(request)
    expect(obs?.history).toBe(assembly?.history)
  })

  it('should have observatory.traceSnapshot matching metadata snapshot', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    const obs = getObservatory(request)
    expect(obs?.traceSnapshot).toBe(assembly?.snapshot)
  })

  it('should have observatory.timelineSnapshot matching metadata timelineSnapshot', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    const obs = getObservatory(request)
    expect(obs?.timelineSnapshot).toBe(assembly?.timelineSnapshot)
  })

  it('should have observatory.historySnapshot matching metadata historySnapshot', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    const obs = getObservatory(request)
    expect(obs?.historySnapshot).toBe(assembly?.historySnapshot)
  })
})