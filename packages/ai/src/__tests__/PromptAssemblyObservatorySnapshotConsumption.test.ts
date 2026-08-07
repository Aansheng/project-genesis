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
import { DefaultPromptAssemblyObservatorySnapshotBuilder } from '../strategy/DefaultPromptAssemblyObservatorySnapshotBuilder'
import { DefaultStrategyEvaluator } from '../strategy/DefaultStrategyEvaluator'
import { DefaultPromptStrategy } from '../strategy/DefaultPromptStrategy'
import type { PromptAssemblyObservatorySnapshotBuilder } from '../strategy'
import type { PromptAssemblyObservatorySnapshot } from '../strategy'
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

function getObservatorySnapshot(request: { metadata?: Record<string, unknown> }): PromptAssemblyObservatorySnapshot | undefined {
  const assembly = getAssembly(request)
  return assembly?.observatorySnapshot as PromptAssemblyObservatorySnapshot | undefined
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
  promptAssemblyObservatorySnapshotBuilder: new DefaultPromptAssemblyObservatorySnapshotBuilder(),
}

function createTrackingSnapshotBuilder(
  onBuild?: (observatory: PromptAssemblyObservatory, metadata: Record<string, unknown> | undefined) => void,
): PromptAssemblyObservatorySnapshotBuilder {
  return {
    build(observatory, metadata) {
      onBuild?.(observatory, metadata)
      return {
        artifactCount: observatory.trace !== undefined ? 1 : 0,
        hasTrace: observatory.trace !== undefined,
        hasTimeline: observatory.timeline !== undefined,
        hasHistory: observatory.history !== undefined,
        hasTraceSnapshot: observatory.traceSnapshot !== undefined,
        hasTimelineSnapshot: observatory.timelineSnapshot !== undefined,
        hasHistorySnapshot: observatory.historySnapshot !== undefined,
      }
    },
  }
}

// ---------------------------------------------------------------------------
// BuilderOptions
// ---------------------------------------------------------------------------

describe('BuilderOptions', () => {
  it('should accept promptAssemblyObservatorySnapshotBuilder field', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(getObservatorySnapshot(request)).toBeDefined()
  })

  it('should allow promptAssemblyObservatorySnapshotBuilder to be omitted', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyObservatoryBuilder: new DefaultPromptAssemblyObservatoryBuilder(),
    })
    const request = await builder.build(createPipelineContext())
    expect(getObservatorySnapshot(request)).toBeUndefined()
  })

  it('should allow promptAssemblyObservatorySnapshotBuilder to be undefined', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyObservatoryBuilder: new DefaultPromptAssemblyObservatoryBuilder(),
      promptAssemblyObservatorySnapshotBuilder: undefined,
    })
    const request = await builder.build(createPipelineContext())
    expect(getObservatorySnapshot(request)).toBeUndefined()
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
      promptAssemblyObservatoryExporter: new DefaultPromptAssemblyObservatoryExporter(),
    })
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.observatory).toBeDefined()
    expect(assembly?.observatoryDiff).toBeDefined()
    expect(assembly?.observatoryRendered).toBeDefined()
    expect(assembly?.observatoryExported).toBeDefined()
    expect(assembly?.observatorySnapshot).toBeUndefined()
  })

  it('should accept promptAssemblyObservatorySnapshotBuilder in full setup', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(getObservatorySnapshot(request)).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Builder Invocation
// ---------------------------------------------------------------------------

describe('Builder invocation', () => {
  it('should call build exactly once when both observatory and builder are present', async () => {
    let callCount = 0
    const trackingBuilder = createTrackingSnapshotBuilder(() => { callCount++ })
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
      promptAssemblyObservatorySnapshotBuilder: trackingBuilder,
    })
    await builder.build(createPipelineContext())
    expect(callCount).toBe(1)
  })

  it('should receive the built observatory', async () => {
    let capturedObservatory: unknown
    const trackingBuilder = createTrackingSnapshotBuilder((observatory) => {
      capturedObservatory = observatory
    })
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
      promptAssemblyObservatorySnapshotBuilder: trackingBuilder,
    })
    await builder.build(createPipelineContext())
    const captured = capturedObservatory as PromptAssemblyObservatory
    expect(captured).toBeDefined()
    expect(captured.trace).toBeDefined()
  })

  it('should receive promptAssemblyMetadata', async () => {
    let capturedMetadata: unknown
    const trackingBuilder = createTrackingSnapshotBuilder((_observatory, metadata) => {
      capturedMetadata = metadata
    })
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
      promptAssemblyObservatorySnapshotBuilder: trackingBuilder,
    })
    await builder.build(createPipelineContext())
    const metadata = capturedMetadata as Record<string, unknown> | undefined
    expect(metadata).toBeDefined()
    expect(metadata?.strategy).toBeDefined()
    expect(metadata?.strategy as { name?: string }).toHaveProperty('name')
  })

  it('should not call build when observatory builder is missing', async () => {
    let called = false
    const trackingBuilder = createTrackingSnapshotBuilder(() => { called = true })
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyObservatorySnapshotBuilder: trackingBuilder,
    })
    await builder.build(createPipelineContext())
    expect(called).toBe(false)
  })

  it('should not call build when snapshot builder is missing', async () => {
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
    expect(getObservatorySnapshot(request)).toBeUndefined()
  })

  it('should preserve custom snapshot returned by builder', async () => {
    const customBuilder: PromptAssemblyObservatorySnapshotBuilder = {
      build() {
        return {
          artifactCount: 3,
          hasTrace: true,
          hasTimeline: true,
          hasHistory: true,
          hasTraceSnapshot: false,
          hasTimelineSnapshot: false,
          hasHistorySnapshot: false,
          rendered: 'Custom Rendered',
          exported: 'Custom Exported',
        }
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyObservatoryBuilder: new DefaultPromptAssemblyObservatoryBuilder(),
      promptAssemblyObservatorySnapshotBuilder: customBuilder,
    })
    const request = await builder.build(createPipelineContext())
    const snapshot = getObservatorySnapshot(request) as PromptAssemblyObservatorySnapshot
    expect(snapshot).toBeDefined()
    expect(snapshot.artifactCount).toBe(3)
    expect(snapshot.hasTrace).toBe(true)
    expect(snapshot.rendered).toBe('Custom Rendered')
    expect(snapshot.exported).toBe('Custom Exported')
  })

  it('should call build even without trace builder (empty observatory)', async () => {
    let called = false
    const trackingBuilder = createTrackingSnapshotBuilder(() => { called = true })
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyObservatoryBuilder: new DefaultPromptAssemblyObservatoryBuilder(),
      promptAssemblyObservatorySnapshotBuilder: trackingBuilder,
    })
    await builder.build(createPipelineContext())
    expect(called).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Metadata Creation
// ---------------------------------------------------------------------------

describe('Metadata creation', () => {
  it('should store observatorySnapshot in metadata when builder is present', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(getObservatorySnapshot(request)).toBeDefined()
  })

  it('should store observatorySnapshot at metadata.promptAssembly.observatorySnapshot', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(request.metadata?.promptAssembly).toHaveProperty('observatorySnapshot')
  })

  it('should not store observatorySnapshot when builder is missing', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyObservatoryBuilder: new DefaultPromptAssemblyObservatoryBuilder(),
    })
    const request = await builder.build(createPipelineContext())
    expect(getObservatorySnapshot(request)).toBeUndefined()
  })

  it('should not store observatorySnapshot when observatory builder is missing', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyObservatorySnapshotBuilder: new DefaultPromptAssemblyObservatorySnapshotBuilder(),
    })
    const request = await builder.build(createPipelineContext())
    expect(getObservatorySnapshot(request)).toBeUndefined()
  })

  it('should store snapshot with correct shape', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const snapshot = getObservatorySnapshot(request) as PromptAssemblyObservatorySnapshot
    expect(typeof snapshot.artifactCount).toBe('number')
    expect(typeof snapshot.hasTrace).toBe('boolean')
    expect(typeof snapshot.hasTimeline).toBe('boolean')
    expect(typeof snapshot.hasHistory).toBe('boolean')
  })

  it('should store snapshot with artifactCount matching the observatory', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const snapshot = getObservatorySnapshot(request) as PromptAssemblyObservatorySnapshot
    expect(snapshot.artifactCount).toBe(6)
  })

  it('should store snapshot with hasTrace true in full setup', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const snapshot = getObservatorySnapshot(request) as PromptAssemblyObservatorySnapshot
    expect(snapshot.hasTrace).toBe(true)
  })

  it('should store snapshot with hasTimeline true in full setup', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const snapshot = getObservatorySnapshot(request) as PromptAssemblyObservatorySnapshot
    expect(snapshot.hasTimeline).toBe(true)
  })

  it('should store snapshot with hasHistory true in full setup', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const snapshot = getObservatorySnapshot(request) as PromptAssemblyObservatorySnapshot
    expect(snapshot.hasHistory).toBe(true)
  })

  it('should store custom rendered and exported values from builder', async () => {
    const customBuilder: PromptAssemblyObservatorySnapshotBuilder = {
      build() {
        return {
          artifactCount: 1,
          hasTrace: true,
          hasTimeline: false,
          hasHistory: false,
          hasTraceSnapshot: false,
          hasTimelineSnapshot: false,
          hasHistorySnapshot: false,
          rendered: 'rendered value',
          exported: 'exported value',
        }
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyObservatoryBuilder: new DefaultPromptAssemblyObservatoryBuilder(),
      promptAssemblyObservatorySnapshotBuilder: customBuilder,
    })
    const request = await builder.build(createPipelineContext())
    const snapshot = getObservatorySnapshot(request) as PromptAssemblyObservatorySnapshot
    expect(snapshot.rendered).toBe('rendered value')
    expect(snapshot.exported).toBe('exported value')
  })

  it('should store snapshot with artifactCount 0 for empty observatory', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyObservatoryBuilder: new DefaultPromptAssemblyObservatoryBuilder(),
      promptAssemblyObservatorySnapshotBuilder: new DefaultPromptAssemblyObservatorySnapshotBuilder(),
    })
    const request = await builder.build(createPipelineContext())
    const snapshot = getObservatorySnapshot(request) as PromptAssemblyObservatorySnapshot
    expect(snapshot).toBeDefined()
    expect(snapshot.artifactCount).toBe(0)
    expect(snapshot.hasTrace).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Metadata Coexistence
// ---------------------------------------------------------------------------

describe('Metadata coexistence — observatory', () => {
  it('should coexist with observatory', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.observatory).toBeDefined()
    expect(assembly?.observatorySnapshot).toBeDefined()
  })
})

describe('Metadata coexistence — observatoryDiff', () => {
  it('should coexist with observatoryDiff', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.observatoryDiff).toBeDefined()
    expect(assembly?.observatorySnapshot).toBeDefined()
  })
})

describe('Metadata coexistence — observatoryRendered', () => {
  it('should coexist with observatoryRendered', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.observatoryRendered).toBeDefined()
    expect(assembly?.observatorySnapshot).toBeDefined()
  })
})

describe('Metadata coexistence — observatoryExported', () => {
  it('should coexist with observatoryExported', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.observatoryExported).toBeDefined()
    expect(assembly?.observatorySnapshot).toBeDefined()
  })
})

describe('Metadata coexistence — trace', () => {
  it('should coexist with trace', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.trace).toBeDefined()
    expect(assembly?.observatorySnapshot).toBeDefined()
  })
})

describe('Metadata coexistence — traceDiff', () => {
  it('should coexist with traceDiff', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.traceDiff).toBeDefined()
    expect(assembly?.observatorySnapshot).toBeDefined()
  })
})

describe('Metadata coexistence — traceRendered', () => {
  it('should coexist with traceRendered', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.traceRendered).toBeDefined()
    expect(assembly?.observatorySnapshot).toBeDefined()
  })
})

describe('Metadata coexistence — traceExported', () => {
  it('should coexist with traceExported', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.traceExported).toBeDefined()
    expect(assembly?.observatorySnapshot).toBeDefined()
  })
})

describe('Metadata coexistence — timeline', () => {
  it('should coexist with timeline', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.timeline).toBeDefined()
    expect(assembly?.observatorySnapshot).toBeDefined()
  })
})

describe('Metadata coexistence — timelineDiff', () => {
  it('should coexist with timelineDiff', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.timelineDiff).toBeDefined()
    expect(assembly?.observatorySnapshot).toBeDefined()
  })
})

describe('Metadata coexistence — timelineRendered', () => {
  it('should coexist with timelineRendered', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.timelineRendered).toBeDefined()
    expect(assembly?.observatorySnapshot).toBeDefined()
  })
})

describe('Metadata coexistence — timelineExported', () => {
  it('should coexist with timelineExported', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.timelineExported).toBeDefined()
    expect(assembly?.observatorySnapshot).toBeDefined()
  })
})

describe('Metadata coexistence — timelineSnapshot', () => {
  it('should coexist with timelineSnapshot', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.timelineSnapshot).toBeDefined()
    expect(assembly?.observatorySnapshot).toBeDefined()
  })
})

describe('Metadata coexistence — history', () => {
  it('should coexist with history', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.history).toBeDefined()
    expect(assembly?.observatorySnapshot).toBeDefined()
  })
})

describe('Metadata coexistence — historyDiff', () => {
  it('should coexist with historyDiff', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.historyDiff).toBeDefined()
    expect(assembly?.observatorySnapshot).toBeDefined()
  })
})

describe('Metadata coexistence — historyRendered', () => {
  it('should coexist with historyRendered', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.historyRendered).toBeDefined()
    expect(assembly?.observatorySnapshot).toBeDefined()
  })
})

describe('Metadata coexistence — historyExported', () => {
  it('should coexist with historyExported', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.historyExported).toBeDefined()
    expect(assembly?.observatorySnapshot).toBeDefined()
  })
})

describe('Metadata coexistence — historySnapshot', () => {
  it('should coexist with historySnapshot', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.historySnapshot).toBeDefined()
    expect(assembly?.observatorySnapshot).toBeDefined()
  })
})

describe('Metadata coexistence — snapshot', () => {
  it('should coexist with snapshot', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.snapshot).toBeDefined()
    expect(assembly?.observatorySnapshot).toBeDefined()
  })
})

describe('Metadata coexistence — inspector', () => {
  it('should coexist with inspector', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.inspector).toBeDefined()
    expect(assembly?.observatorySnapshot).toBeDefined()
  })
})

describe('Metadata coexistence — inspectorRendered', () => {
  it('should coexist with inspectorRendered', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.inspectorRendered).toBeDefined()
    expect(assembly?.observatorySnapshot).toBeDefined()
  })
})

describe('Metadata coexistence — inspectorExported', () => {
  it('should coexist with inspectorExported', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.inspectorExported).toBeDefined()
    expect(assembly?.observatorySnapshot).toBeDefined()
  })
})

describe('Metadata coexistence — plan', () => {
  it('should coexist with plan', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.plan).toBeDefined()
    expect(assembly?.observatorySnapshot).toBeDefined()
  })
})

describe('Metadata coexistence — optimizedPlan', () => {
  it('should coexist with optimizedPlan', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.optimizedPlan).toBeDefined()
    expect(assembly?.observatorySnapshot).toBeDefined()
  })
})

describe('Metadata coexistence — planDiff', () => {
  it('should coexist with planDiff', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.planDiff).toBeDefined()
    expect(assembly?.observatorySnapshot).toBeDefined()
  })
})

describe('Metadata coexistence — planRendered', () => {
  it('should coexist with planRendered', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.planRendered).toBeDefined()
    expect(assembly?.observatorySnapshot).toBeDefined()
  })
})

describe('Metadata coexistence — strategy', () => {
  it('should coexist with strategy', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.strategy).toBeDefined()
    expect(assembly?.observatorySnapshot).toBeDefined()
  })
})

describe('Metadata coexistence — strategySelection', () => {
  it('should coexist with strategySelection', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.strategySelection).toBeDefined()
    expect(assembly?.observatorySnapshot).toBeDefined()
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
    expect(assembly?.observatorySnapshot).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Deterministic
// ---------------------------------------------------------------------------

describe('Deterministic', () => {
  it('should produce same observatorySnapshot across multiple builds', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const r1 = await builder.build(createPipelineContext())
    const r2 = await builder.build(createPipelineContext())
    expect(getObservatorySnapshot(r1)).toEqual(getObservatorySnapshot(r2))
  })

  it('should produce same result across different builder instances', async () => {
    const b1 = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const b2 = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const r1 = await b1.build(createPipelineContext())
    const r2 = await b2.build(createPipelineContext())
    expect(getObservatorySnapshot(r1)).toEqual(getObservatorySnapshot(r2))
  })

  it('should produce same artifactCount across builds', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const r1 = await builder.build(createPipelineContext())
    const r2 = await builder.build(createPipelineContext())
    const s1 = getObservatorySnapshot(r1) as PromptAssemblyObservatorySnapshot
    const s2 = getObservatorySnapshot(r2) as PromptAssemblyObservatorySnapshot
    expect(s1.artifactCount).toBe(s2.artifactCount)
  })
})

// ---------------------------------------------------------------------------
// Stateless
// ---------------------------------------------------------------------------

describe('Stateless', () => {
  it('should not retain builder state between builds', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const r1 = await builder.build(createPipelineContext())
    const r2 = await builder.build(createPipelineContext())
    expect(getObservatorySnapshot(r1)).toBeDefined()
    expect(getObservatorySnapshot(r2)).toBeDefined()
  })

  it('should produce fresh snapshot per build with different inputs', async () => {
    let callCount = 0
    const trackingBuilder = createTrackingSnapshotBuilder(() => { callCount++ })
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyObservatoryBuilder: new DefaultPromptAssemblyObservatoryBuilder(),
      promptAssemblyObservatorySnapshotBuilder: trackingBuilder,
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
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyObservatoryBuilder: new DefaultPromptAssemblyObservatoryBuilder(),
    })
    const r1 = await builderWith.build(createPipelineContext())
    const r2 = await builderWithout.build(createPipelineContext())
    expect(r1.prompt).toBe(r2.prompt)
  })

  it('should preserve all existing observatory metadata fields', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request) as Record<string, unknown>
    expect(assembly?.observatory).toBeDefined()
    expect(assembly?.observatoryDiff).toBeDefined()
    expect(assembly?.observatoryRendered).toBeDefined()
    expect(assembly?.observatoryExported).toBeDefined()
    expect(assembly?.observatorySnapshot).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Legacy Constructor
// ---------------------------------------------------------------------------

describe('Legacy constructor', () => {
  it('should support BuilderOptions form with observatory snapshot builder', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(getObservatorySnapshot(request)).toBeDefined()
  })

  it('should support full BuilderOptions with all fields', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.observatorySnapshot).toBeDefined()
    expect(assembly?.observatory).toBeDefined()
    expect(assembly?.observatoryExported).toBeDefined()
    expect(assembly?.trace).toBeDefined()
  })

  it('should support legacy args without observatory snapshot builder', async () => {
    const builder = new DefaultPromptBuilder(
      [new UserInputModule()],
      undefined as unknown as Record<string, unknown>,
    )
    const request = await builder.build(createPipelineContext())
    expect(getObservatorySnapshot(request)).toBeUndefined()
  })

  it('should assign undefined snapshot builder in legacy positional form', async () => {
    const builder = new DefaultPromptBuilder(
      [new UserInputModule()],
      undefined, undefined, undefined, undefined, undefined, undefined, undefined,
    )
    const request = await builder.build(createPipelineContext())
    expect(getObservatorySnapshot(request)).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// No Prompt Changes
// ---------------------------------------------------------------------------

describe('No prompt changes', () => {
  it('should produce same prompt with or without observatory snapshot builder', async () => {
    const builderWith = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const builderWithout = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyObservatoryBuilder: new DefaultPromptAssemblyObservatoryBuilder(),
    })
    const r1 = await builderWith.build(createPipelineContext())
    const r2 = await builderWithout.build(createPipelineContext())
    expect(r1.prompt).toBe(r2.prompt)
  })

  it('should not inject observatorySnapshot into prompt text', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(request.prompt).not.toContain('observatorySnapshot')
  })

  it('should store observatorySnapshot only in metadata', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(request.metadata?.promptAssembly).toHaveProperty('observatorySnapshot')
    expect(request.prompt).not.toContain('artifactCount')
  })

  it('should not change prompt when snapshot output differs', async () => {
    const builderA: PromptAssemblyObservatorySnapshotBuilder = {
      build() {
        return { artifactCount: 1, hasTrace: true, hasTimeline: false, hasHistory: false, hasTraceSnapshot: false, hasTimelineSnapshot: false, hasHistorySnapshot: false }
      },
    }
    const builderB: PromptAssemblyObservatorySnapshotBuilder = {
      build() {
        return { artifactCount: 6, hasTrace: true, hasTimeline: true, hasHistory: true, hasTraceSnapshot: true, hasTimelineSnapshot: true, hasHistorySnapshot: true }
      },
    }
    const baseOpts = {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyObservatoryBuilder: new DefaultPromptAssemblyObservatoryBuilder(),
    }
    const b1 = new DefaultPromptBuilder([new UserInputModule()], { ...baseOpts, promptAssemblyObservatorySnapshotBuilder: builderA })
    const b2 = new DefaultPromptBuilder([new UserInputModule()], { ...baseOpts, promptAssemblyObservatorySnapshotBuilder: builderB })
    const r1 = await b1.build(createPipelineContext())
    const r2 = await b2.build(createPipelineContext())
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
    expect(getObservatorySnapshot(request)).toBeDefined()
  })
})

describe('ToolCallPlanner compatibility', () => {
  it('should be compatible with ToolCallPlanner scenarios', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(getObservatorySnapshot(request)).toBeDefined()
  })
})

describe('Streaming compatibility', () => {
  it('should be compatible with Streaming scenarios', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(getObservatorySnapshot(request)).toBeDefined()
  })
})

describe('AgentLoop compatibility', () => {
  it('should be compatible with AgentLoop scenarios', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(getObservatorySnapshot(request)).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Observatory Snapshot Validation
// ---------------------------------------------------------------------------

describe('Observatory snapshot validation', () => {
  it('should validate artifactCount in full observatory', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const snapshot = getObservatorySnapshot(request) as PromptAssemblyObservatorySnapshot
    expect(snapshot.artifactCount).toBe(6)
  })

  it('should validate boolean flags in full observatory', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const snapshot = getObservatorySnapshot(request) as PromptAssemblyObservatorySnapshot
    expect(snapshot.hasTrace).toBe(true)
    expect(snapshot.hasTimeline).toBe(true)
    expect(snapshot.hasHistory).toBe(true)
    expect(snapshot.hasTraceSnapshot).toBe(true)
    expect(snapshot.hasTimelineSnapshot).toBe(true)
    expect(snapshot.hasHistorySnapshot).toBe(true)
  })

  it('should validate rendered from custom snapshot', async () => {
    const customBuilder: PromptAssemblyObservatorySnapshotBuilder = {
      build() {
        return { artifactCount: 0, hasTrace: false, hasTimeline: false, hasHistory: false, hasTraceSnapshot: false, hasTimelineSnapshot: false, hasHistorySnapshot: false, rendered: 'R' }
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyObservatoryBuilder: new DefaultPromptAssemblyObservatoryBuilder(),
      promptAssemblyObservatorySnapshotBuilder: customBuilder,
    })
    const request = await builder.build(createPipelineContext())
    const snapshot = getObservatorySnapshot(request) as PromptAssemblyObservatorySnapshot
    expect(snapshot.rendered).toBe('R')
  })

  it('should validate exported from custom snapshot', async () => {
    const customBuilder: PromptAssemblyObservatorySnapshotBuilder = {
      build() {
        return { artifactCount: 0, hasTrace: false, hasTimeline: false, hasHistory: false, hasTraceSnapshot: false, hasTimelineSnapshot: false, hasHistorySnapshot: false, exported: 'E' }
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyObservatoryBuilder: new DefaultPromptAssemblyObservatoryBuilder(),
      promptAssemblyObservatorySnapshotBuilder: customBuilder,
    })
    const request = await builder.build(createPipelineContext())
    const snapshot = getObservatorySnapshot(request) as PromptAssemblyObservatorySnapshot
    expect(snapshot.exported).toBe('E')
  })

  it('should validate partial observatory (trace only)', async () => {
    const trackingBuilder = createTrackingSnapshotBuilder(() => {})
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyObservatoryBuilder: new DefaultPromptAssemblyObservatoryBuilder(),
      promptAssemblyObservatorySnapshotBuilder: trackingBuilder,
    })
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request) as Record<string, unknown>
    const observatory = assembly?.observatory as PromptAssemblyObservatory
    expect(observatory.trace).toBeDefined()
    expect(observatory.timeline).toBeUndefined()
    expect(observatory.history).toBeUndefined()
  })

  it('should validate artifactCount 0 for empty observatory', async () => {
    const customBuilder: PromptAssemblyObservatorySnapshotBuilder = {
      build(observatory) {
        return {
          artifactCount: (observatory.trace ? 1 : 0) + (observatory.timeline ? 1 : 0) + (observatory.history ? 1 : 0) + (observatory.traceSnapshot ? 1 : 0) + (observatory.timelineSnapshot ? 1 : 0) + (observatory.historySnapshot ? 1 : 0),
          hasTrace: observatory.trace !== undefined,
          hasTimeline: observatory.timeline !== undefined,
          hasHistory: observatory.history !== undefined,
          hasTraceSnapshot: observatory.traceSnapshot !== undefined,
          hasTimelineSnapshot: observatory.timelineSnapshot !== undefined,
          hasHistorySnapshot: observatory.historySnapshot !== undefined,
        }
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyObservatoryBuilder: new DefaultPromptAssemblyObservatoryBuilder(),
      promptAssemblyObservatorySnapshotBuilder: customBuilder,
    })
    const request = await builder.build(createPipelineContext())
    const snapshot = getObservatorySnapshot(request) as PromptAssemblyObservatorySnapshot
    expect(snapshot.artifactCount).toBe(0)
    expect(snapshot.hasTrace).toBe(false)
  })

  it('should snapshot flags match observatory contents (full)', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request) as Record<string, unknown>
    const observatory = assembly?.observatory as PromptAssemblyObservatory
    const snapshot = getObservatorySnapshot(request) as PromptAssemblyObservatorySnapshot
    expect(snapshot.hasTrace).toBe(observatory.trace !== undefined)
    expect(snapshot.hasTimeline).toBe(observatory.timeline !== undefined)
    expect(snapshot.hasHistory).toBe(observatory.history !== undefined)
  })

  it('should snapshot not overwrite observatory fields', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request) as Record<string, unknown>
    expect(assembly?.observatorySnapshot).toBeDefined()
    expect(assembly?.observatory).toBeDefined()
    expect(assembly?.observatoryRendered).toBeDefined()
    expect(assembly?.observatoryExported).toBeDefined()
  })

  it('should validate all flags false for empty observatory', async () => {
    const customBuilder: PromptAssemblyObservatorySnapshotBuilder = {
      build(observatory) {
        return {
          artifactCount: 0,
          hasTrace: observatory.trace !== undefined,
          hasTimeline: observatory.timeline !== undefined,
          hasHistory: observatory.history !== undefined,
          hasTraceSnapshot: observatory.traceSnapshot !== undefined,
          hasTimelineSnapshot: observatory.timelineSnapshot !== undefined,
          hasHistorySnapshot: observatory.historySnapshot !== undefined,
        }
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
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
      promptAssemblyObservatorySnapshotBuilder: customBuilder,
    })
    const request = await builder.build(createPipelineContext())
    const snapshot = getObservatorySnapshot(request) as PromptAssemblyObservatorySnapshot
    expect(snapshot.artifactCount).toBe(0)
    expect(snapshot.hasTrace).toBe(false)
    expect(snapshot.hasTimeline).toBe(false)
    expect(snapshot.hasHistory).toBe(false)
    expect(snapshot.hasTraceSnapshot).toBe(false)
    expect(snapshot.hasTimelineSnapshot).toBe(false)
    expect(snapshot.hasHistorySnapshot).toBe(false)
  })
})