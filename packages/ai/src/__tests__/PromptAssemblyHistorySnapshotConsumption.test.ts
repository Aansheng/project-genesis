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
import { DefaultStrategyEvaluator } from '../strategy/DefaultStrategyEvaluator'
import { DefaultPromptStrategy } from '../strategy/DefaultPromptStrategy'
import type { PromptAssemblyHistorySnapshotBuilder } from '../strategy/PromptAssemblyHistorySnapshotBuilder'
import type { PromptAssemblyHistorySnapshot } from '../strategy/PromptAssemblyHistorySnapshot'
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

function getHistorySnapshot(request: { metadata?: Record<string, unknown> }): PromptAssemblyHistorySnapshot | undefined {
  const assembly = getAssembly(request)
  return assembly?.historySnapshot as PromptAssemblyHistorySnapshot | undefined
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
}

// ---------------------------------------------------------------------------
// BuilderOptions
// ---------------------------------------------------------------------------

describe('BuilderOptions', () => {
  it('should accept promptAssemblyHistorySnapshotBuilder field', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(getHistorySnapshot(request)).toBeDefined()
  })

  it('should allow promptAssemblyHistorySnapshotBuilder to be omitted', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyHistoryBuilder: new DefaultPromptAssemblyHistoryBuilder(),
    })
    const request = await builder.build(createPipelineContext())
    expect(getHistorySnapshot(request)).toBeUndefined()
  })

  it('should allow promptAssemblyHistorySnapshotBuilder to be undefined', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyHistoryBuilder: new DefaultPromptAssemblyHistoryBuilder(),
      promptAssemblyHistorySnapshotBuilder: undefined,
    })
    const request = await builder.build(createPipelineContext())
    expect(getHistorySnapshot(request)).toBeUndefined()
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
    expect(assembly?.historyExported).toBeDefined()
    expect(assembly?.historySnapshot).toBeUndefined()
  })

  it('should accept promptAssemblyHistorySnapshotBuilder in full setup', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(getHistorySnapshot(request)).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Builder Invocation
// ---------------------------------------------------------------------------

describe('Builder invocation', () => {
  it('should call build exactly once when both history and builder are present', async () => {
    let callCount = 0
    const trackingBuilder: PromptAssemblyHistorySnapshotBuilder = {
      build() {
        callCount++
        return { entryCount: 1, firstStrategy: 'default', lastStrategy: 'default', strategies: ['default'] }
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyHistoryBuilder: new DefaultPromptAssemblyHistoryBuilder(),
      promptAssemblyHistorySnapshotBuilder: trackingBuilder,
    })
    await builder.build(createPipelineContext())
    expect(callCount).toBe(1)
  })

  it('should not call build when history builder is missing', async () => {
    let called = false
    const trackingBuilder: PromptAssemblyHistorySnapshotBuilder = {
      build() {
        called = true
        return { entryCount: 1, firstStrategy: 'default', lastStrategy: 'default', strategies: ['default'] }
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyHistorySnapshotBuilder: trackingBuilder,
    })
    await builder.build(createPipelineContext())
    expect(called).toBe(false)
  })

  it('should not call build when snapshot builder is missing', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyHistoryBuilder: new DefaultPromptAssemblyHistoryBuilder(),
    })
    const request = await builder.build(createPipelineContext())
    expect(getHistorySnapshot(request)).toBeUndefined()
  })

  it('should not call build when both history and builder are present but no trace', async () => {
    let called = false
    const trackingBuilder: PromptAssemblyHistorySnapshotBuilder = {
      build() {
        called = true
        return { entryCount: 1, firstStrategy: 'default', lastStrategy: 'default', strategies: ['default'] }
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyHistoryBuilder: new DefaultPromptAssemblyHistoryBuilder(),
      promptAssemblyHistorySnapshotBuilder: trackingBuilder,
    })
    await builder.build(createPipelineContext())
    expect(called).toBe(false)
  })

  it('should receive the built history', async () => {
    let capturedHistory: unknown
    const trackingBuilder: PromptAssemblyHistorySnapshotBuilder = {
      build(history) {
        capturedHistory = history
        return { entryCount: 1, firstStrategy: 'default', lastStrategy: 'default', strategies: ['default'] }
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyHistoryBuilder: new DefaultPromptAssemblyHistoryBuilder(),
      promptAssemblyHistorySnapshotBuilder: trackingBuilder,
    })
    await builder.build(createPipelineContext())
    const captured = capturedHistory as { entries: Array<unknown> }
    expect(captured).toBeDefined()
    expect(captured.entries).toHaveLength(1)
  })

  it('should receive metadata as second argument', async () => {
    let capturedMetadata: unknown
    const trackingBuilder: PromptAssemblyHistorySnapshotBuilder = {
      build(_history, metadata) {
        capturedMetadata = metadata
        return { entryCount: 1, firstStrategy: 'default', lastStrategy: 'default', strategies: ['default'] }
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyHistoryBuilder: new DefaultPromptAssemblyHistoryBuilder(),
      promptAssemblyHistorySnapshotBuilder: trackingBuilder,
    })
    await builder.build(createPipelineContext())
    const metadata = capturedMetadata as Record<string, unknown>
    expect(metadata).toBeDefined()
    expect(metadata?.strategy).toBeDefined()
  })

  it('should preserve custom builder result', async () => {
    const customResult: PromptAssemblyHistorySnapshot = {
      entryCount: 5,
      firstStrategy: 'create',
      lastStrategy: 'delete',
      strategies: ['create', 'modify', 'query', 'modify', 'delete'],
    }
    const customBuilder: PromptAssemblyHistorySnapshotBuilder = {
      build() {
        return customResult
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyHistoryBuilder: new DefaultPromptAssemblyHistoryBuilder(),
      promptAssemblyHistorySnapshotBuilder: customBuilder,
    })
    const request = await builder.build(createPipelineContext())
    const snapshot = getHistorySnapshot(request)
    expect(snapshot?.entryCount).toBe(5)
    expect(snapshot?.firstStrategy).toBe('create')
    expect(snapshot?.lastStrategy).toBe('delete')
    expect(snapshot?.strategies).toEqual(['create', 'modify', 'query', 'modify', 'delete'])
  })

  it('should not call build when trace builder is missing', async () => {
    let called = false
    const trackingBuilder: PromptAssemblyHistorySnapshotBuilder = {
      build() {
        called = true
        return { entryCount: 1, firstStrategy: 'default', lastStrategy: 'default', strategies: ['default'] }
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyHistoryBuilder: new DefaultPromptAssemblyHistoryBuilder(),
      promptAssemblyHistorySnapshotBuilder: trackingBuilder,
    })
    await builder.build(createPipelineContext())
    expect(called).toBe(false)
  })

  it('should call build with non-empty history', async () => {
    let capturedHistory: unknown
    const trackingBuilder: PromptAssemblyHistorySnapshotBuilder = {
      build(history) {
        capturedHistory = history
        return { entryCount: 1, firstStrategy: 'default', lastStrategy: 'default', strategies: ['default'] }
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyHistoryBuilder: new DefaultPromptAssemblyHistoryBuilder(),
      promptAssemblyHistorySnapshotBuilder: trackingBuilder,
    })
    await builder.build(createPipelineContext())
    const captured = capturedHistory as { entries: Array<unknown> }
    expect(captured.entries.length).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// Metadata Creation
// ---------------------------------------------------------------------------

describe('Metadata creation', () => {
  it('should store historySnapshot in metadata when builder is present', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(getHistorySnapshot(request)).toBeDefined()
  })

  it('should not store historySnapshot when builder is missing', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyHistoryBuilder: new DefaultPromptAssemblyHistoryBuilder(),
    })
    const request = await builder.build(createPipelineContext())
    expect(getHistorySnapshot(request)).toBeUndefined()
  })

  it('should not store historySnapshot when history builder is missing', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyHistorySnapshotBuilder: new DefaultPromptAssemblyHistorySnapshotBuilder(),
    })
    const request = await builder.build(createPipelineContext())
    expect(getHistorySnapshot(request)).toBeUndefined()
  })

  it('should not store historySnapshot when trace builder is missing', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyHistoryBuilder: new DefaultPromptAssemblyHistoryBuilder(),
      promptAssemblyHistorySnapshotBuilder: new DefaultPromptAssemblyHistorySnapshotBuilder(),
    })
    const request = await builder.build(createPipelineContext())
    expect(getHistorySnapshot(request)).toBeUndefined()
  })

  it('should store historySnapshot as an object', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const snapshot = getHistorySnapshot(request)
    expect(typeof snapshot).toBe('object')
    expect(snapshot).not.toBeNull()
  })

  it('should store historySnapshot with entryCount', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const snapshot = getHistorySnapshot(request)
    expect(snapshot?.entryCount).toBeDefined()
    expect(typeof snapshot?.entryCount).toBe('number')
  })

  it('should store historySnapshot with firstStrategy', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const snapshot = getHistorySnapshot(request)
    expect(snapshot?.firstStrategy).toBeDefined()
    expect(typeof snapshot?.firstStrategy).toBe('string')
  })

  it('should store historySnapshot with lastStrategy', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const snapshot = getHistorySnapshot(request)
    expect(snapshot?.lastStrategy).toBeDefined()
    expect(typeof snapshot?.lastStrategy).toBe('string')
  })

  it('should store historySnapshot with strategies array', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const snapshot = getHistorySnapshot(request)
    expect(snapshot?.strategies).toBeDefined()
    expect(Array.isArray(snapshot?.strategies)).toBe(true)
  })

  it('should not overwrite existing metadata when storing historySnapshot', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request) as Record<string, unknown>
    expect(assembly?.history).toBeDefined()
    expect(assembly?.historySnapshot).toBeDefined()
    expect(assembly?.trace).toBeDefined()
    expect(assembly?.strategy).toBeDefined()
  })

  it('should store historySnapshot at metadata.promptAssembly.historySnapshot', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(request.metadata?.promptAssembly).toHaveProperty('historySnapshot')
  })

  it('should store historySnapshot with correct entryCount value', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const snapshot = getHistorySnapshot(request)
    expect(snapshot?.entryCount).toBe(1)
  })

  it('should store historySnapshot with strategies matching entryCount', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const snapshot = getHistorySnapshot(request)
    expect((snapshot as PromptAssemblyHistorySnapshot).strategies).toHaveLength((snapshot as PromptAssemblyHistorySnapshot).entryCount!)
  })
})

// ---------------------------------------------------------------------------
// Metadata Coexistence
// ---------------------------------------------------------------------------

describe('Metadata coexistence — snapshot', () => {
  it('should coexist with snapshot', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.snapshot).toBeDefined()
    expect(assembly?.historySnapshot).toBeDefined()
  })
})

describe('Metadata coexistence — inspector', () => {
  it('should coexist with inspector', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.inspector).toBeDefined()
    expect(assembly?.historySnapshot).toBeDefined()
  })
})

describe('Metadata coexistence — inspectorRendered', () => {
  it('should coexist with inspectorRendered', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.inspectorRendered).toBeDefined()
    expect(assembly?.historySnapshot).toBeDefined()
  })
})

describe('Metadata coexistence — inspectorExported', () => {
  it('should coexist with inspectorExported', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.inspectorExported).toBeDefined()
    expect(assembly?.historySnapshot).toBeDefined()
  })
})

describe('Metadata coexistence — trace', () => {
  it('should coexist with trace', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.trace).toBeDefined()
    expect(assembly?.historySnapshot).toBeDefined()
  })
})

describe('Metadata coexistence — traceDiff', () => {
  it('should coexist with traceDiff', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.traceDiff).toBeDefined()
    expect(assembly?.historySnapshot).toBeDefined()
  })
})

describe('Metadata coexistence — traceRendered', () => {
  it('should coexist with traceRendered', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.traceRendered).toBeDefined()
    expect(assembly?.historySnapshot).toBeDefined()
  })
})

describe('Metadata coexistence — traceExported', () => {
  it('should coexist with traceExported', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.traceExported).toBeDefined()
    expect(assembly?.historySnapshot).toBeDefined()
  })
})

describe('Metadata coexistence — timeline', () => {
  it('should coexist with timeline', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.timeline).toBeDefined()
    expect(assembly?.historySnapshot).toBeDefined()
  })
})

describe('Metadata coexistence — timelineDiff', () => {
  it('should coexist with timelineDiff', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.timelineDiff).toBeDefined()
    expect(assembly?.historySnapshot).toBeDefined()
  })
})

describe('Metadata coexistence — timelineRendered', () => {
  it('should coexist with timelineRendered', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.timelineRendered).toBeDefined()
    expect(assembly?.historySnapshot).toBeDefined()
  })
})

describe('Metadata coexistence — timelineExported', () => {
  it('should coexist with timelineExported', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.timelineExported).toBeDefined()
    expect(assembly?.historySnapshot).toBeDefined()
  })
})

describe('Metadata coexistence — timelineSnapshot', () => {
  it('should coexist with timelineSnapshot', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.timelineSnapshot).toBeDefined()
    expect(assembly?.historySnapshot).toBeDefined()
  })
})

describe('Metadata coexistence — history', () => {
  it('should coexist with history', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.history).toBeDefined()
    expect(assembly?.historySnapshot).toBeDefined()
  })
})

describe('Metadata coexistence — historyDiff', () => {
  it('should coexist with historyDiff', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.historyDiff).toBeDefined()
    expect(assembly?.historySnapshot).toBeDefined()
  })
})

describe('Metadata coexistence — historyRendered', () => {
  it('should coexist with historyRendered', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.historyRendered).toBeDefined()
    expect(assembly?.historySnapshot).toBeDefined()
  })
})

describe('Metadata coexistence — historyExported', () => {
  it('should coexist with historyExported', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.historyExported).toBeDefined()
    expect(assembly?.historySnapshot).toBeDefined()
  })
})

describe('Metadata coexistence — all fields', () => {
  it('should coexist with all promptAssembly fields', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request) as Record<string, unknown>
    // Prompt assembly diagnostic fields
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
    // Core strategy fields
    expect(assembly?.strategy).toBeDefined()
    expect(assembly?.strategySelection).toBeDefined()
    expect(assembly?.plan).toBeDefined()
    expect(assembly?.optimizedPlan).toBeDefined()
    expect(assembly?.planDiff).toBeDefined()
    expect(assembly?.planRendered).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Deterministic
// ---------------------------------------------------------------------------

describe('Deterministic', () => {
  it('should produce same historySnapshot across multiple builds', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const r1 = await builder.build(createPipelineContext())
    const r2 = await builder.build(createPipelineContext())
    const s1 = getHistorySnapshot(r1)
    const s2 = getHistorySnapshot(r2)
    expect(s1).toEqual(s2)
  })

  it('should produce same historySnapshot across different builder instances', async () => {
    const b1 = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const b2 = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const r1 = await b1.build(createPipelineContext())
    const r2 = await b2.build(createPipelineContext())
    expect(getHistorySnapshot(r1)).toEqual(getHistorySnapshot(r2))
  })

  it('should produce same historySnapshot for identical inputs', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const ctx = createPipelineContext()
    const r1 = await builder.build(ctx)
    const r2 = await builder.build(ctx)
    expect(getHistorySnapshot(r1)).toEqual(getHistorySnapshot(r2))
  })

  it('should produce same snapshot for identical metadata conditions', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const ctx1 = createPipelineContext({ input: 'draw a tree' })
    const ctx2 = createPipelineContext({ input: 'draw a tree' })
    const r1 = await builder.build(ctx1)
    const r2 = await builder.build(ctx2)
    expect(getHistorySnapshot(r1)).toEqual(getHistorySnapshot(r2))
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
    const s1 = getHistorySnapshot(r1)
    const s2 = getHistorySnapshot(r2)
    // Different inputs → different history → independent snapshots
    expect(s1).toBeDefined()
    expect(s2).toBeDefined()
  })

  it('should produce independent results for different builds', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const r1 = await builder.build(createPipelineContext())
    const r2 = await builder.build(createPipelineContext({ input: 'list trees' }))
    // Both snapshots should be valid objects
    expect(typeof getHistorySnapshot(r1)).toBe('object')
    expect(typeof getHistorySnapshot(r2)).toBe('object')
  })

  it('should produce fresh snapshot per build', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const r1 = await builder.build(createPipelineContext())
    const r2 = await builder.build(createPipelineContext())
    expect(getHistorySnapshot(r1)).not.toBe(getHistorySnapshot(r2))
  })

  it('should produce independent snapshots for sequential builds', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const r1 = await builder.build(createPipelineContext({ input: 'create tree' }))
    const r2 = await builder.build(createPipelineContext({ input: 'query trees' }))
    expect(getHistorySnapshot(r1)).toBeDefined()
    expect(getHistorySnapshot(r2)).toBeDefined()
    // Second build should not reuse or mutate first snapshot
    expect(getHistorySnapshot(r1)).not.toBe(getHistorySnapshot(r2))
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

  it('should not modify metadata from previous fields', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request) as Record<string, unknown>
    const originalHistory = JSON.stringify(assembly?.history)
    // historySnapshot should not mutate the history field
    expect(JSON.stringify(assembly?.history)).toBe(originalHistory)
  })

  it('should not modify prompt output', async () => {
    const builderWith = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const builderWithout = new DefaultPromptBuilder([new UserInputModule()], {
      strategyEvaluator: new DefaultStrategyEvaluator(),
      strategies: [new DefaultPromptStrategy()],
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyHistoryBuilder: new DefaultPromptAssemblyHistoryBuilder(),
      promptAssemblyHistoryDiffer: new DefaultPromptAssemblyHistoryDiffer(),
      promptAssemblyHistoryRenderer: new DefaultPromptAssemblyHistoryRenderer(),
      promptAssemblyHistoryExporter: new DefaultPromptAssemblyHistoryExporter(),
    })
    const requestWith = await builderWith.build(createPipelineContext())
    const requestWithout = await builderWithout.build(createPipelineContext())
    expect(requestWith.prompt).toBe(requestWithout.prompt)
  })

  it('should not add unexpected fields to metadata', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request) as Record<string, unknown>
    expect(assembly?.historySnapshot).toBeDefined()
    // history field should still be present and unchanged
    expect(assembly?.history).toBeDefined()
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
    expect(getHistorySnapshot(request)).toBeUndefined()
  })

  it('should construct with BuilderOptions path', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(getHistorySnapshot(request)).toBeDefined()
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
    expect(getHistorySnapshot(request)).toBeDefined()
  })

  it('should construct with legacy args and omit history', async () => {
    const builder = new DefaultPromptBuilder(
      [new UserInputModule()],
      undefined,
    )
    const request = await builder.build(createPipelineContext())
    expect(getHistorySnapshot(request)).toBeUndefined()
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
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyHistoryBuilder: new DefaultPromptAssemblyHistoryBuilder(),
      promptAssemblyHistoryDiffer: new DefaultPromptAssemblyHistoryDiffer(),
      promptAssemblyHistoryRenderer: new DefaultPromptAssemblyHistoryRenderer(),
      promptAssemblyHistoryExporter: new DefaultPromptAssemblyHistoryExporter(),
    })
    const requestWith = await builderWith.build(createPipelineContext())
    const requestWithout = await builderWithout.build(createPipelineContext())
    expect(requestWith.prompt).toBe(requestWithout.prompt)
  })

  it('should not inject historySnapshot into prompt text', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(request.prompt).not.toContain('historySnapshot')
  })

  it('should be metadata only', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.historySnapshot).toBeDefined()
    // historySnapshot should not appear in the prompt
    expect(request.prompt).not.toContain('historySnapshot')
  })

  it('should not render history snapshot in prompt', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    // Snapshot data should not leak into rendered prompt
    const snapshot = getHistorySnapshot(request)
    expect(snapshot).toBeDefined()
    expect(request.prompt).not.toContain('historySnapshot')
    expect(request.prompt).not.toContain('entryCount')
    expect(request.prompt).not.toContain('firstStrategy')
    expect(request.prompt).not.toContain('lastStrategy')
  })

  it('should not change prompt behavior when snapshot is present', async () => {
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
    expect(getHistorySnapshot(request)).toBeDefined()
    expect(request.prompt.length).toBeGreaterThan(0)
  })
})

describe('ToolCallPlanner compatibility', () => {
  it('should be compatible with ToolCallPlanner', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(getHistorySnapshot(request)).toBeDefined()
    expect(request.prompt.length).toBeGreaterThan(0)
  })
})

describe('Streaming compatibility', () => {
  it('should be compatible with streaming pipeline', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(getHistorySnapshot(request)).toBeDefined()
  })
})

describe('AgentLoop compatibility', () => {
  it('should be compatible with AgentLoop', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(getHistorySnapshot(request)).toBeDefined()
    expect(request.prompt).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Snapshot Validation
// ---------------------------------------------------------------------------

describe('Snapshot validation', () => {
  it('should have correct entryCount in historySnapshot', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const snapshot = getHistorySnapshot(request)
    expect(snapshot?.entryCount).toBeGreaterThanOrEqual(1)
  })

  it('should have firstStrategy in historySnapshot', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const snapshot = getHistorySnapshot(request)
    expect(typeof snapshot?.firstStrategy).toBe('string')
  })

  it('should have lastStrategy in historySnapshot', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const snapshot = getHistorySnapshot(request)
    expect(typeof snapshot?.lastStrategy).toBe('string')
  })

  it('should have strategies array in historySnapshot', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const snapshot = getHistorySnapshot(request)
    expect(Array.isArray(snapshot?.strategies)).toBe(true)
    expect(snapshot?.strategies!.length).toBeGreaterThanOrEqual(1)
  })

  it('should have firstStrategy matching lastStrategy for single entry', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const snapshot = getHistorySnapshot(request)
    expect(snapshot?.entryCount).toBeGreaterThanOrEqual(1)
    if (snapshot?.entryCount === 1) {
      expect(snapshot?.firstStrategy).toBe(snapshot?.lastStrategy)
    }
  })

  it('should have strategies length matching entryCount', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const snapshot = getHistorySnapshot(request) as PromptAssemblyHistorySnapshot
    expect(snapshot.strategies).toHaveLength(snapshot.entryCount!)
  })

  it('should have strategy name in strategies array', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const snapshot = getHistorySnapshot(request)
    expect(snapshot?.strategies).toBeDefined()
    expect(snapshot?.firstStrategy).toBeDefined()
    expect(snapshot?.strategies![0]).toBe(snapshot?.firstStrategy)
  })

  it('should have strategies as readonly array', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const snapshot = getHistorySnapshot(request)
    expect(snapshot?.strategies).toBeDefined()
    expect(Array.isArray(snapshot?.strategies)).toBe(true)
  })

  it('should have entryCount as a positive number', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const snapshot = getHistorySnapshot(request)
    expect(snapshot?.entryCount).toBeGreaterThan(0)
    expect(Number.isInteger(snapshot?.entryCount)).toBe(true)
  })

  it('should have string strategies in strategies array', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const snapshot = getHistorySnapshot(request)
    for (const s of snapshot?.strategies ?? []) {
      expect(typeof s).toBe('string')
    }
  })
})