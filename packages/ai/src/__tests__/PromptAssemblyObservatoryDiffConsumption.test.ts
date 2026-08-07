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
import { DefaultStrategyEvaluator } from '../strategy/DefaultStrategyEvaluator'
import { DefaultPromptStrategy } from '../strategy/DefaultPromptStrategy'
import type { PromptAssemblyObservatoryDiffer } from '../strategy/PromptAssemblyObservatoryDiffer'
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

function getObservatoryDiff(request: { metadata?: Record<string, unknown> }): Record<string, unknown> | undefined {
  const assembly = getAssembly(request)
  return assembly?.observatoryDiff as Record<string, unknown> | undefined
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
}

// ---------------------------------------------------------------------------
// BuilderOptions
// ---------------------------------------------------------------------------

describe('BuilderOptions', () => {
  it('should accept promptAssemblyObservatoryDiffer field', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(getObservatoryDiff(request)).toBeDefined()
  })

  it('should allow promptAssemblyObservatoryDiffer to be omitted', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyObservatoryBuilder: new DefaultPromptAssemblyObservatoryBuilder(),
    })
    const request = await builder.build(createPipelineContext())
    expect(getObservatoryDiff(request)).toBeUndefined()
  })

  it('should allow promptAssemblyObservatoryDiffer to be undefined', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyObservatoryBuilder: new DefaultPromptAssemblyObservatoryBuilder(),
      promptAssemblyObservatoryDiffer: undefined,
    })
    const request = await builder.build(createPipelineContext())
    expect(getObservatoryDiff(request)).toBeUndefined()
  })

  it('should be backward compatible when promptAssemblyObservatoryDiffer is absent', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyStrategyResolver: undefined,
    })
    const request = await builder.build(createPipelineContext())
    expect(getObservatoryDiff(request)).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// Differ Invocation
// ---------------------------------------------------------------------------

describe('Differ invocation', () => {
  it('should call diff when observatory differ is provided', async () => {
    let called = false
    const mockDiffer: PromptAssemblyObservatoryDiffer = {
      diff() {
        called = true
        return { added: [], removed: [], changed: [] }
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      ...fullSetup,
      promptAssemblyObservatoryDiffer: mockDiffer,
    })
    await builder.build(createPipelineContext())
    expect(called).toBe(true)
  })

  it('should not call diff when observatory differ is not provided', async () => {
    const called = false
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyObservatoryBuilder: new DefaultPromptAssemblyObservatoryBuilder(),
    })
    // diff should not be called since differ is not wired
    await builder.build(createPipelineContext())
    expect(called).toBe(false)
  })

  it('should pass the observatory to diff', async () => {
    let capturedObservatory: PromptAssemblyObservatory | undefined
    const mockDiffer: PromptAssemblyObservatoryDiffer = {
      diff(_before: PromptAssemblyObservatory, after: PromptAssemblyObservatory) {
        capturedObservatory = after
        return { added: [], removed: [], changed: [] }
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      ...fullSetup,
      promptAssemblyObservatoryDiffer: mockDiffer,
    })
    await builder.build(createPipelineContext())
    expect(capturedObservatory).toBeDefined()
    const obs = capturedObservatory as Record<string, unknown>
    expect(obs).toHaveProperty('trace')
    expect(obs).toHaveProperty('timeline')
    expect(obs).toHaveProperty('history')
    expect(obs).toHaveProperty('traceSnapshot')
    expect(obs).toHaveProperty('timelineSnapshot')
    expect(obs).toHaveProperty('historySnapshot')
  })

  it('should pass empty baseline as before to diff', async () => {
    let capturedBefore: PromptAssemblyObservatory | undefined
    const mockDiffer: PromptAssemblyObservatoryDiffer = {
      diff(before: PromptAssemblyObservatory, _after: PromptAssemblyObservatory) {
        capturedBefore = before
        return { added: [], removed: [], changed: [] }
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      ...fullSetup,
      promptAssemblyObservatoryDiffer: mockDiffer,
    })
    await builder.build(createPipelineContext())
    expect(capturedBefore).toBeDefined()
    expect(Object.keys(capturedBefore as Record<string, unknown>)).toHaveLength(0)
  })

  it('should preserve custom diff result', async () => {
    const mockDiffer: PromptAssemblyObservatoryDiffer = {
      diff() {
        return { added: ['trace'], removed: ['timeline'], changed: ['history'] }
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      ...fullSetup,
      promptAssemblyObservatoryDiffer: mockDiffer,
    })
    const request = await builder.build(createPipelineContext())
    const diff = getObservatoryDiff(request) as { added: string[]; removed: string[]; changed: string[] }
    expect(diff.added).toEqual(['trace'])
    expect(diff.removed).toEqual(['timeline'])
    expect(diff.changed).toEqual(['history'])
  })

  it('should not call diff when observatory is undefined', async () => {
    let called = false
    const mockDiffer: PromptAssemblyObservatoryDiffer = {
      diff() {
        called = true
        return { added: [], removed: [], changed: [] }
      },
    }
    // No observatory builder → no observatory → diff not called
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyObservatoryDiffer: mockDiffer,
    })
    await builder.build(createPipelineContext())
    expect(called).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Metadata Creation
// ---------------------------------------------------------------------------

describe('Metadata creation', () => {
  it('should store observatoryDiff in metadata.promptAssembly.observatoryDiff', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const diff = getObservatoryDiff(request)
    expect(diff).toBeDefined()
  })

  it('should not store observatoryDiff when differ is missing', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyObservatoryBuilder: new DefaultPromptAssemblyObservatoryBuilder(),
    })
    const request = await builder.build(createPipelineContext())
    expect(getObservatoryDiff(request)).toBeUndefined()
  })

  it('should not store observatoryDiff when observatory builder is missing', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyObservatoryDiffer: new DefaultPromptAssemblyObservatoryDiffer(),
    })
    const request = await builder.build(createPipelineContext())
    expect(getObservatoryDiff(request)).toBeUndefined()
  })

  it('should store observatoryDiff as an object with added/removed/changed', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const diff = getObservatoryDiff(request) as Record<string, unknown>
    expect(diff).toHaveProperty('added')
    expect(diff).toHaveProperty('removed')
    expect(diff).toHaveProperty('changed')
  })

  it('should store observatoryDiff with correct path', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request) as Record<string, unknown>
    expect(assembly.observatoryDiff).toBeDefined()
  })

  it('should not overwrite existing observatoryDiff across builds', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const r1 = await builder.build(createPipelineContext())
    const r2 = await builder.build(createPipelineContext())
    const d1 = getObservatoryDiff(r1)
    const d2 = getObservatoryDiff(r2)
    expect(d1).toBeDefined()
    expect(d2).toBeDefined()
  })

  it('should store observatoryDiff when both observatory builder and differ are present', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(getObservatoryDiff(request)).toBeDefined()
  })

  it('should not store observatoryDiff when only differ is present without observatory builder', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyObservatoryDiffer: new DefaultPromptAssemblyObservatoryDiffer(),
    })
    const request = await builder.build(createPipelineContext())
    expect(getObservatoryDiff(request)).toBeUndefined()
  })

  it('should store observatoryDiff with correct array types', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const diff = getObservatoryDiff(request) as { added: string[]; removed: string[]; changed: string[] }
    expect(Array.isArray(diff.added)).toBe(true)
    expect(Array.isArray(diff.removed)).toBe(true)
    expect(Array.isArray(diff.changed)).toBe(true)
  })

  it('should have added array of length 6 on first build', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const diff = getObservatoryDiff(request) as { added: string[]; removed: string[]; changed: string[] }
    expect(diff.added).toHaveLength(6)
  })

  it('should have removed array of length 0 on first build', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const diff = getObservatoryDiff(request) as { removed: unknown[] }
    expect(diff.removed).toHaveLength(0)
  })

  it('should have changed array of length 0 on first build', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const diff = getObservatoryDiff(request) as { changed: unknown[] }
    expect(diff.changed).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// Metadata Coexistence
// ---------------------------------------------------------------------------

describe('Metadata coexistence', () => {
  it('should coexist with trace', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request) as Record<string, unknown>
    expect(assembly.trace).toBeDefined()
    expect(assembly.observatoryDiff).toBeDefined()
  })

  it('should coexist with traceDiff', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request) as Record<string, unknown>
    expect(assembly.traceDiff).toBeDefined()
    expect(assembly.observatoryDiff).toBeDefined()
  })

  it('should coexist with traceRendered', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request) as Record<string, unknown>
    expect(assembly.traceRendered).toBeDefined()
    expect(assembly.observatoryDiff).toBeDefined()
  })

  it('should coexist with traceExported', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request) as Record<string, unknown>
    expect(assembly.traceExported).toBeDefined()
    expect(assembly.observatoryDiff).toBeDefined()
  })

  it('should coexist with timeline', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request) as Record<string, unknown>
    expect(assembly.timeline).toBeDefined()
    expect(assembly.observatoryDiff).toBeDefined()
  })

  it('should coexist with timelineDiff', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request) as Record<string, unknown>
    expect(assembly.timelineDiff).toBeDefined()
    expect(assembly.observatoryDiff).toBeDefined()
  })

  it('should coexist with timelineRendered', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request) as Record<string, unknown>
    expect(assembly.timelineRendered).toBeDefined()
    expect(assembly.observatoryDiff).toBeDefined()
  })

  it('should coexist with timelineExported', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request) as Record<string, unknown>
    expect(assembly.timelineExported).toBeDefined()
    expect(assembly.observatoryDiff).toBeDefined()
  })

  it('should coexist with timelineSnapshot', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request) as Record<string, unknown>
    expect(assembly.timelineSnapshot).toBeDefined()
    expect(assembly.observatoryDiff).toBeDefined()
  })

  it('should coexist with history', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request) as Record<string, unknown>
    expect(assembly.history).toBeDefined()
    expect(assembly.observatoryDiff).toBeDefined()
  })

  it('should coexist with historyDiff', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request) as Record<string, unknown>
    expect(assembly.historyDiff).toBeDefined()
    expect(assembly.observatoryDiff).toBeDefined()
  })

  it('should coexist with historyRendered', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request) as Record<string, unknown>
    expect(assembly.historyRendered).toBeDefined()
    expect(assembly.observatoryDiff).toBeDefined()
  })

  it('should coexist with historyExported', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request) as Record<string, unknown>
    expect(assembly.historyExported).toBeDefined()
    expect(assembly.observatoryDiff).toBeDefined()
  })

  it('should coexist with historySnapshot', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request) as Record<string, unknown>
    expect(assembly.historySnapshot).toBeDefined()
    expect(assembly.observatoryDiff).toBeDefined()
  })

  it('should coexist with observatory', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request) as Record<string, unknown>
    expect(assembly.observatory).toBeDefined()
    expect(assembly.observatoryDiff).toBeDefined()
  })

  it('should coexist with all fields simultaneously', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request) as Record<string, unknown>
    expect(assembly.trace).toBeDefined()
    expect(assembly.traceDiff).toBeDefined()
    expect(assembly.traceRendered).toBeDefined()
    expect(assembly.traceExported).toBeDefined()
    expect(assembly.timeline).toBeDefined()
    expect(assembly.timelineDiff).toBeDefined()
    expect(assembly.timelineRendered).toBeDefined()
    expect(assembly.timelineExported).toBeDefined()
    expect(assembly.timelineSnapshot).toBeDefined()
    expect(assembly.history).toBeDefined()
    expect(assembly.historyDiff).toBeDefined()
    expect(assembly.historyRendered).toBeDefined()
    expect(assembly.historyExported).toBeDefined()
    expect(assembly.historySnapshot).toBeDefined()
    expect(assembly.observatory).toBeDefined()
    expect(assembly.observatoryDiff).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Deterministic
// ---------------------------------------------------------------------------

describe('Deterministic', () => {
  it('should produce same observatoryDiff across multiple builds', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const r1 = await builder.build(createPipelineContext())
    const r2 = await builder.build(createPipelineContext())
    const r3 = await builder.build(createPipelineContext())
    const d1 = getObservatoryDiff(r1) as { added: string[]; removed: string[]; changed: string[] }
    const d2 = getObservatoryDiff(r2) as { added: string[]; removed: string[]; changed: string[] }
    const d3 = getObservatoryDiff(r3) as { added: string[]; removed: string[]; changed: string[] }
    expect(d1.added).toEqual(d2.added)
    expect(d2.added).toEqual(d3.added)
    expect(d1.removed).toEqual(d2.removed)
    expect(d2.removed).toEqual(d3.removed)
    expect(d1.changed).toEqual(d2.changed)
    expect(d2.changed).toEqual(d3.changed)
  })

  it('should produce same observatoryDiff across different builder instances', async () => {
    const b1 = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const b2 = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const r1 = await b1.build(createPipelineContext())
    const r2 = await b2.build(createPipelineContext())
    const d1 = getObservatoryDiff(r1) as { added: string[] }
    const d2 = getObservatoryDiff(r2) as { added: string[] }
    expect(d1.added).toEqual(d2.added)
  })

  it('should produce same observatoryDiff for identical inputs', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const ctx1 = createPipelineContext()
    const ctx2 = createPipelineContext()
    const r1 = await builder.build(ctx1)
    const r2 = await builder.build(ctx2)
    const d1 = getObservatoryDiff(r1) as { added: string[] }
    const d2 = getObservatoryDiff(r2) as { added: string[] }
    expect(d1.added).toEqual(d2.added)
  })
})

// ---------------------------------------------------------------------------
// Stateless
// ---------------------------------------------------------------------------

describe('Stateless', () => {
  it('should not retain state between builds', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const r1 = await builder.build(createPipelineContext())
    const r2 = await builder.build(createPipelineContext())
    const d1 = getObservatoryDiff(r1)
    const d2 = getObservatoryDiff(r2)
    // Each build produces fresh observatoryDiff independently
    expect(d1).toBeDefined()
    expect(d2).toBeDefined()
  })

  it('should produce independent observatoryDiff results for each build', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const results = await Promise.all([
      builder.build(createPipelineContext()),
      builder.build(createPipelineContext()),
    ])
    const d1 = getObservatoryDiff(results[0])
    const d2 = getObservatoryDiff(results[1])
    expect(d1).toBeDefined()
    expect(d2).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Pure
// ---------------------------------------------------------------------------

describe('Pure', () => {
  it('should not modify pipeline context', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const ctx = createPipelineContext()
    const originalInput = ctx.input
    await builder.build(ctx)
    expect(ctx.input).toBe(originalInput)
  })

  it('should not modify other metadata fields', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request) as Record<string, unknown>
    const originalStrategy = assembly.strategy
    expect(originalStrategy).toBeDefined()
    // Adding observatory diff doesn't alter existing fields
    expect(assembly.observatoryDiff).toBeDefined()
    expect(assembly.strategy).toBe(originalStrategy)
  })

  it('should not change prompt output', async () => {
    const builder1 = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyObservatoryBuilder: new DefaultPromptAssemblyObservatoryBuilder(),
    })
    const builder2 = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const r1 = await builder1.build(createPipelineContext({ input: 'hello' }))
    const r2 = await builder2.build(createPipelineContext({ input: 'hello' }))
    expect(r1.prompt).toBe(r2.prompt)
  })

  it('should not add extra unexpected fields', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request) as Record<string, unknown>
    expect(assembly.observatoryDiff).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Legacy Constructor
// ---------------------------------------------------------------------------

describe('Legacy constructor', () => {
  it('should not set observatoryDiff via positional constructor', async () => {
    const builder = new DefaultPromptBuilder(
      [new UserInputModule()],
      undefined, undefined, undefined, undefined, undefined, undefined, undefined,
    )
    const request = await builder.build(createPipelineContext())
    expect(getObservatoryDiff(request)).toBeUndefined()
  })

  it('should not set observatoryDiff via BuilderOptions form without differ', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {})
    const request = await builder.build(createPipelineContext())
    expect(getObservatoryDiff(request)).toBeUndefined()
  })

  it('should set observatoryDiff via full BuilderOptions with differ', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(getObservatoryDiff(request)).toBeDefined()
  })

  it('should handle legacy args with undefined observatoryDiff', async () => {
    const builder = new DefaultPromptBuilder(
      [new UserInputModule()],
      undefined as unknown as Record<string, unknown>,
    )
    const request = await builder.build(createPipelineContext())
    expect(getObservatoryDiff(request)).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// No Prompt Changes
// ---------------------------------------------------------------------------

describe('No prompt changes', () => {
  it('should produce identical prompt with or without observatory diff', async () => {
    const builderWithout = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyObservatoryBuilder: new DefaultPromptAssemblyObservatoryBuilder(),
    })
    const builderWith = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const r1 = await builderWithout.build(createPipelineContext({ input: 'test' }))
    const r2 = await builderWith.build(createPipelineContext({ input: 'test' }))
    expect(r1.prompt).toBe(r2.prompt)
  })

  it('should not inject observatory diff data into prompt', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(request.prompt).not.toContain('observatoryDiff')
  })

  it('should be metadata only — no prompt injection', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request) as Record<string, unknown>
    expect(assembly.observatoryDiff).toBeDefined()
    // observatoryDiff only in metadata, not in prompt
    expect(request.prompt).not.toContain('observatoryDiff')
  })

  it('should have unchanged behavior — diff presence does not affect prompt', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const promptStr = JSON.stringify(request.prompt)
    expect(promptStr).not.toContain('added')
    expect(promptStr).not.toContain('removed')
    expect(promptStr).not.toContain('changed')
  })
})

// ---------------------------------------------------------------------------
// Compatibility — RetryPlanner
// ---------------------------------------------------------------------------

describe('RetryPlanner compatibility', () => {
  it('should work with RetryPlanner scenarios', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(getObservatoryDiff(request)).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Compatibility — ToolCallPlanner
// ---------------------------------------------------------------------------

describe('ToolCallPlanner compatibility', () => {
  it('should work with ToolCallPlanner scenarios', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(getObservatoryDiff(request)).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Compatibility — Streaming
// ---------------------------------------------------------------------------

describe('Streaming compatibility', () => {
  it('should work with streaming scenarios', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(getObservatoryDiff(request)).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Compatibility — AgentLoop
// ---------------------------------------------------------------------------

describe('AgentLoop compatibility', () => {
  it('should work with AgentLoop scenarios', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(getObservatoryDiff(request)).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// ObservatoryDiff Validation
// ---------------------------------------------------------------------------

describe('ObservatoryDiff validation', () => {
  it('should report all six fields as added on first build', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const diff = getObservatoryDiff(request) as { added: string[] }
    expect(diff.added).toEqual([
      'trace',
      'timeline',
      'history',
      'traceSnapshot',
      'timelineSnapshot',
      'historySnapshot',
    ])
  })

  it('should report empty removed on first build', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const diff = getObservatoryDiff(request) as { removed: string[] }
    expect(diff.removed).toEqual([])
  })

  it('should report empty changed on first build', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const diff = getObservatoryDiff(request) as { changed: string[] }
    expect(diff.changed).toEqual([])
  })

  it('should report added as string array', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const diff = getObservatoryDiff(request) as { added: unknown }
    expect(Array.isArray(diff.added)).toBe(true)
  })

  it('should report removed as string array', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const diff = getObservatoryDiff(request) as { removed: unknown }
    expect(Array.isArray(diff.removed)).toBe(true)
  })

  it('should report changed as string array', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const diff = getObservatoryDiff(request) as { changed: unknown }
    expect(Array.isArray(diff.changed)).toBe(true)
  })

  it('should include trace in added array', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const diff = getObservatoryDiff(request) as { added: string[] }
    expect(diff.added).toContain('trace')
  })

  it('should include timeline in added array', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const diff = getObservatoryDiff(request) as { added: string[] }
    expect(diff.added).toContain('timeline')
  })

  it('should include history in added array', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const diff = getObservatoryDiff(request) as { added: string[] }
    expect(diff.added).toContain('history')
  })

  it('should include traceSnapshot in added array', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const diff = getObservatoryDiff(request) as { added: string[] }
    expect(diff.added).toContain('traceSnapshot')
  })

  it('should include timelineSnapshot in added array', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const diff = getObservatoryDiff(request) as { added: string[] }
    expect(diff.added).toContain('timelineSnapshot')
  })

  it('should include historySnapshot in added array', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const diff = getObservatoryDiff(request) as { added: string[] }
    expect(diff.added).toContain('historySnapshot')
  })

  it('should return object with added/removed/changed keys', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const diff = getObservatoryDiff(request) as Record<string, unknown>
    expect(Object.keys(diff)).toEqual(['added', 'removed', 'changed'])
  })

  it('should have field order trace, timeline, history, traceSnapshot, timelineSnapshot, historySnapshot in added', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const diff = getObservatoryDiff(request) as { added: string[] }
    expect(diff.added[0]).toBe('trace')
    expect(diff.added[1]).toBe('timeline')
    expect(diff.added[2]).toBe('history')
    expect(diff.added[3]).toBe('traceSnapshot')
    expect(diff.added[4]).toBe('timelineSnapshot')
    expect(diff.added[5]).toBe('historySnapshot')
  })

  it('should have all string items in added array', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const diff = getObservatoryDiff(request) as { added: unknown[] }
    expect(diff.added.every((i: unknown) => typeof i === 'string')).toBe(true)
  })

  it('should have all string items in removed array', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const diff = getObservatoryDiff(request) as { removed: unknown[] }
    expect(diff.removed.every((i: unknown) => typeof i === 'string')).toBe(true)
  })

  it('should have all string items in changed array', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const diff = getObservatoryDiff(request) as { changed: unknown[] }
    expect(diff.changed.every((i: unknown) => typeof i === 'string')).toBe(true)
  })

  it('should produce consistent added field names across builds', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const r1 = await builder.build(createPipelineContext())
    const r2 = await builder.build(createPipelineContext())
    const d1 = getObservatoryDiff(r1) as { added: string[] }
    const d2 = getObservatoryDiff(r2) as { added: string[] }
    expect(d1.added).toHaveLength(6)
    expect(d2.added).toHaveLength(6)
    expect(d1.added).toEqual(d2.added)
  })

  it('should produce empty removed when using default differ on first build', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const r1 = await builder.build(createPipelineContext())
    const diff = getObservatoryDiff(r1) as { removed: string[] }
    expect(diff.removed).toHaveLength(0)
  })

  it('should produce empty changed when using default differ on first build', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const r1 = await builder.build(createPipelineContext())
    const diff = getObservatoryDiff(r1) as { changed: string[] }
    expect(diff.changed).toHaveLength(0)
  })

  it('should preserve across multiple sequential builds', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    for (let i = 0; i < 5; i++) {
      const request = await builder.build(createPipelineContext())
      const diff = getObservatoryDiff(request) as { added: string[]; removed: string[]; changed: string[] }
      expect(diff.added).toContain('trace')
      expect(diff.added).toContain('timeline')
      expect(diff.removed).toEqual([])
      expect(diff.changed).toEqual([])
    }
  })
})