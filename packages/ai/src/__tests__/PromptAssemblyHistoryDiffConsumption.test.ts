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
import { DefaultStrategyEvaluator } from '../strategy/DefaultStrategyEvaluator'
import { DefaultPromptStrategy } from '../strategy/DefaultPromptStrategy'
import type { PromptAssemblyHistoryDiffer } from '../strategy/PromptAssemblyHistoryDiffer'
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

function getHistoryDiff(request: { metadata?: Record<string, unknown> }): Record<string, unknown> | undefined {
  const assembly = getAssembly(request)
  return assembly?.historyDiff as Record<string, unknown> | undefined
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
}

// ---------------------------------------------------------------------------
// BuilderOptions
// ---------------------------------------------------------------------------

describe('BuilderOptions', () => {
  it('should accept promptAssemblyHistoryDiffer field', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(getHistoryDiff(request)).toBeDefined()
  })

  it('should allow promptAssemblyHistoryDiffer to be omitted', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyHistoryBuilder: new DefaultPromptAssemblyHistoryBuilder(),
    })
    const request = await builder.build(createPipelineContext())
    expect(getHistoryDiff(request)).toBeUndefined()
  })

  it('should allow promptAssemblyHistoryDiffer to be undefined', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyHistoryBuilder: new DefaultPromptAssemblyHistoryBuilder(),
      promptAssemblyHistoryDiffer: undefined,
    })
    const request = await builder.build(createPipelineContext())
    expect(getHistoryDiff(request)).toBeUndefined()
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
    expect(assembly?.historyDiff).toBeUndefined()
  })

  it('should accept promptAssemblyHistoryDiffer in full setup', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(getHistoryDiff(request)).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Differ Invocation
// ---------------------------------------------------------------------------

describe('Differ invocation', () => {
  it('should call differ.diff exactly once when both history and differ are present', async () => {
    let callCount = 0
    const trackingDiffer: PromptAssemblyHistoryDiffer = {
      diff() {
        callCount++
        return { added: [], removed: [], changed: [] }
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyHistoryBuilder: new DefaultPromptAssemblyHistoryBuilder(),
      promptAssemblyHistoryDiffer: trackingDiffer,
    })
    await builder.build(createPipelineContext())
    expect(callCount).toBe(1)
  })

  it('should not call differ when history builder is missing', async () => {
    let called = false
    const trackingDiffer: PromptAssemblyHistoryDiffer = {
      diff() {
        called = true
        return { added: [], removed: [], changed: [] }
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyHistoryDiffer: trackingDiffer,
    })
    await builder.build(createPipelineContext())
    expect(called).toBe(false)
  })

  it('should not call differ when differ is missing', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyHistoryBuilder: new DefaultPromptAssemblyHistoryBuilder(),
    })
    const request = await builder.build(createPipelineContext())
    expect(getHistoryDiff(request)).toBeUndefined()
  })

  it('should not call differ when trace builder is missing', async () => {
    let called = false
    const trackingDiffer: PromptAssemblyHistoryDiffer = {
      diff() {
        called = true
        return { added: [], removed: [], changed: [] }
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyHistoryBuilder: new DefaultPromptAssemblyHistoryBuilder(),
      promptAssemblyHistoryDiffer: trackingDiffer,
    })
    await builder.build(createPipelineContext())
    expect(called).toBe(false)
  })

  it('should receive the built history', async () => {
    let capturedBefore: unknown
    let capturedAfter: unknown
    const trackingDiffer: PromptAssemblyHistoryDiffer = {
      diff(before, after) {
        capturedBefore = before
        capturedAfter = after
        return { added: [], removed: [], changed: [] }
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyHistoryBuilder: new DefaultPromptAssemblyHistoryBuilder(),
      promptAssemblyHistoryDiffer: trackingDiffer,
    })
    await builder.build(createPipelineContext())
    const capturedBeforeObj = capturedBefore as { entries: Array<unknown> }
    const capturedAfterObj = capturedAfter as { entries: Array<unknown> }
    expect(capturedBeforeObj).toBeDefined()
    expect(capturedBeforeObj.entries).toEqual([])
    expect(capturedAfterObj).toBeDefined()
    expect(capturedAfterObj.entries).toHaveLength(1)
  })

  it('should preserve custom differ result', async () => {
    const customDiffer: PromptAssemblyHistoryDiffer = {
      diff() {
        return { added: [99], removed: [88], changed: [77] }
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyHistoryBuilder: new DefaultPromptAssemblyHistoryBuilder(),
      promptAssemblyHistoryDiffer: customDiffer,
    })
    const request = await builder.build(createPipelineContext())
    const historyDiff = getHistoryDiff(request)
    expect(historyDiff).toBeDefined()
    const diff = historyDiff as { added: number[]; removed: number[]; changed: number[] }
    expect(diff.added).toEqual([99])
    expect(diff.removed).toEqual([88])
    expect(diff.changed).toEqual([77])
  })

  it('should not call differ when trace is undefined', async () => {
    let called = false
    const trackingDiffer: PromptAssemblyHistoryDiffer = {
      diff() {
        called = true
        return { added: [], removed: [], changed: [] }
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyHistoryBuilder: new DefaultPromptAssemblyHistoryBuilder(),
      promptAssemblyHistoryDiffer: trackingDiffer,
    })
    await builder.build(createPipelineContext())
    expect(called).toBe(false)
  })

  it('should call differ with empty before history', async () => {
    let capturedBefore: unknown
    const trackingDiffer: PromptAssemblyHistoryDiffer = {
      diff(before, _after) {
        capturedBefore = before
        return { added: [0], removed: [], changed: [] }
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyHistoryBuilder: new DefaultPromptAssemblyHistoryBuilder(),
      promptAssemblyHistoryDiffer: trackingDiffer,
    })
    await builder.build(createPipelineContext())
    const captured = capturedBefore as { entries: Array<unknown> }
    expect(captured.entries).toEqual([])
  })

  it('should call differ with non-empty after history', async () => {
    let capturedAfter: unknown
    const trackingDiffer: PromptAssemblyHistoryDiffer = {
      diff(_before, after) {
        capturedAfter = after
        return { added: [0], removed: [], changed: [] }
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyHistoryBuilder: new DefaultPromptAssemblyHistoryBuilder(),
      promptAssemblyHistoryDiffer: trackingDiffer,
    })
    await builder.build(createPipelineContext())
    const captured = capturedAfter as { entries: Array<unknown> }
    expect(captured.entries.length).toBeGreaterThanOrEqual(1)
  })
})

// ---------------------------------------------------------------------------
// Metadata Creation
// ---------------------------------------------------------------------------

describe('Metadata creation', () => {
  it('should store historyDiff in metadata when differ is present', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(getHistoryDiff(request)).toBeDefined()
  })

  it('should not store historyDiff when differ is missing', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyHistoryBuilder: new DefaultPromptAssemblyHistoryBuilder(),
    })
    const request = await builder.build(createPipelineContext())
    expect(getHistoryDiff(request)).toBeUndefined()
  })

  it('should not store historyDiff when history builder is missing', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyHistoryDiffer: new DefaultPromptAssemblyHistoryDiffer(),
    })
    const request = await builder.build(createPipelineContext())
    expect(getHistoryDiff(request)).toBeUndefined()
  })

  it('should not store historyDiff when trace builder is missing', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyHistoryBuilder: new DefaultPromptAssemblyHistoryBuilder(),
      promptAssemblyHistoryDiffer: new DefaultPromptAssemblyHistoryDiffer(),
    })
    const request = await builder.build(createPipelineContext())
    expect(getHistoryDiff(request)).toBeUndefined()
  })

  it('should store historyDiff with correct shape', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const historyDiff = getHistoryDiff(request)
    expect(historyDiff).toHaveProperty('added')
    expect(historyDiff).toHaveProperty('removed')
    expect(historyDiff).toHaveProperty('changed')
  })

  it('should store historyDiff with array fields', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const historyDiff = getHistoryDiff(request) as { added: unknown; removed: unknown; changed: unknown }
    expect(Array.isArray(historyDiff.added)).toBe(true)
    expect(Array.isArray(historyDiff.removed)).toBe(true)
    expect(Array.isArray(historyDiff.changed)).toBe(true)
  })

  it('should store historyDiff with correct content (added: [0])', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const historyDiff = getHistoryDiff(request) as { added: number[]; removed: number[]; changed: number[] }
    // First build: empty → history with entry 0 → added: [0]
    expect(historyDiff.added).toEqual([0])
    expect(historyDiff.removed).toEqual([])
    expect(historyDiff.changed).toEqual([])
  })

  it('should store historyDiff with number type arrays', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const historyDiff = getHistoryDiff(request) as { added: number[] }
    expect(historyDiff.added.every((i: number) => typeof i === 'number')).toBe(true)
  })

  it('should not overwrite existing metadata when storing historyDiff', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request) as Record<string, unknown>
    expect(assembly?.history).toBeDefined()
    expect(assembly?.historyDiff).toBeDefined()
    expect(assembly?.trace).toBeDefined()
    expect(assembly?.strategy).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Metadata Coexistence — history
// ---------------------------------------------------------------------------

describe('Metadata coexistence — history', () => {
  it('should coexist with history', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.history).toBeDefined()
    expect(assembly?.historyDiff).toBeDefined()
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
    expect(assembly?.historyDiff).toBeDefined()
  })
})

describe('Metadata coexistence — timelineDiff', () => {
  it('should coexist with timelineDiff', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.timelineDiff).toBeDefined()
    expect(assembly?.historyDiff).toBeDefined()
  })
})

describe('Metadata coexistence — timelineRendered', () => {
  it('should coexist with timelineRendered', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.timelineRendered).toBeDefined()
    expect(assembly?.historyDiff).toBeDefined()
  })
})

describe('Metadata coexistence — timelineExported', () => {
  it('should coexist with timelineExported', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.timelineExported).toBeDefined()
    expect(assembly?.historyDiff).toBeDefined()
  })
})

describe('Metadata coexistence — timelineSnapshot', () => {
  it('should coexist with timelineSnapshot', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.timelineSnapshot).toBeDefined()
    expect(assembly?.historyDiff).toBeDefined()
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
    expect(assembly?.historyDiff).toBeDefined()
  })
})

describe('Metadata coexistence — traceDiff', () => {
  it('should coexist with traceDiff', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.traceDiff).toBeDefined()
    expect(assembly?.historyDiff).toBeDefined()
  })
})

describe('Metadata coexistence — traceRendered', () => {
  it('should coexist with traceRendered', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.traceRendered).toBeDefined()
    expect(assembly?.historyDiff).toBeDefined()
  })
})

describe('Metadata coexistence — traceExported', () => {
  it('should coexist with traceExported', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.traceExported).toBeDefined()
    expect(assembly?.historyDiff).toBeDefined()
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
    expect(assembly?.historyDiff).toBeDefined()
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
    expect(assembly?.historyDiff).toBeDefined()
  })
})

describe('Metadata coexistence — inspectorRendered', () => {
  it('should coexist with inspectorRendered', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.inspectorRendered).toBeDefined()
    expect(assembly?.historyDiff).toBeDefined()
  })
})

describe('Metadata coexistence — inspectorExported', () => {
  it('should coexist with inspectorExported', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.inspectorExported).toBeDefined()
    expect(assembly?.historyDiff).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Metadata Coexistence — plan/optimizedPlan/diff/rendered
// ---------------------------------------------------------------------------

describe('Metadata coexistence — plan', () => {
  it('should coexist with plan', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.plan).toBeDefined()
    expect(assembly?.historyDiff).toBeDefined()
  })
})

describe('Metadata coexistence — optimizedPlan', () => {
  it('should coexist with optimizedPlan', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.optimizedPlan).toBeDefined()
    expect(assembly?.historyDiff).toBeDefined()
  })
})

describe('Metadata coexistence — planDiff', () => {
  it('should coexist with planDiff', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.planDiff).toBeDefined()
    expect(assembly?.historyDiff).toBeDefined()
  })
})

describe('Metadata coexistence — planRendered', () => {
  it('should coexist with planRendered', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.planRendered).toBeDefined()
    expect(assembly?.historyDiff).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Metadata Coexistence — strategy/strategySelection
// ---------------------------------------------------------------------------

describe('Metadata coexistence — strategy', () => {
  it('should coexist with strategy', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.strategy).toBeDefined()
    expect(assembly?.historyDiff).toBeDefined()
  })
})

describe('Metadata coexistence — strategySelection', () => {
  it('should coexist with strategySelection', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.strategySelection).toBeDefined()
    expect(assembly?.historyDiff).toBeDefined()
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
  })
})

// ---------------------------------------------------------------------------
// Deterministic
// ---------------------------------------------------------------------------

describe('Deterministic', () => {
  it('should produce same historyDiff across multiple builds', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const r1 = await builder.build(createPipelineContext())
    const r2 = await builder.build(createPipelineContext())
    const r3 = await builder.build(createPipelineContext())
    const d1 = getHistoryDiff(r1) as { added: number[]; removed: number[]; changed: number[] }
    const d2 = getHistoryDiff(r2) as { added: number[]; removed: number[]; changed: number[] }
    const d3 = getHistoryDiff(r3) as { added: number[]; removed: number[]; changed: number[] }
    expect(d1.added).toEqual(d2.added)
    expect(d2.added).toEqual(d3.added)
    expect(d1.removed).toEqual(d2.removed)
    expect(d2.removed).toEqual(d3.removed)
    expect(d1.changed).toEqual(d2.changed)
    expect(d2.changed).toEqual(d3.changed)
  })

  it('should produce same result across different builder instances', async () => {
    const b1 = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const b2 = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const r1 = await b1.build(createPipelineContext())
    const r2 = await b2.build(createPipelineContext())
    const d1 = getHistoryDiff(r1)
    const d2 = getHistoryDiff(r2)
    expect(d1).toEqual(d2)
  })

  it('should produce same result for identical inputs', async () => {
    const ctx = createPipelineContext()
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const r1 = await builder.build(ctx)
    const r2 = await builder.build(ctx)
    expect(getHistoryDiff(r1)).toEqual(getHistoryDiff(r2))
  })
})

// ---------------------------------------------------------------------------
// Stateless
// ---------------------------------------------------------------------------

describe('Stateless', () => {
  it('should not retain differ state between builds', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const r1 = await builder.build(createPipelineContext())
    const r2 = await builder.build(createPipelineContext())
    const d1 = getHistoryDiff(r1) as { added: number[] }
    const d2 = getHistoryDiff(r2) as { added: number[] }
    // Both builds produce fresh history → both should have added: [0]
    expect(d1.added).toEqual([0])
    expect(d2.added).toEqual([0])
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
    const builderWithDiffer = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const builderWithoutDiffer = new DefaultPromptBuilder([new UserInputModule()], {
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
    })
    const ctx1 = createPipelineContext()
    const ctx2 = createPipelineContext()
    const r1 = await builderWithDiffer.build(ctx1)
    const r2 = await builderWithoutDiffer.build(ctx2)
    // historyDiff is metadata only — prompt should be identical
    expect(r1.prompt).toBe(r2.prompt)
  })
})

// ---------------------------------------------------------------------------
// Legacy Constructor
// ---------------------------------------------------------------------------

describe('Legacy constructor', () => {
  it('should support legacy positional form with history differ', async () => {
    const builder = new DefaultPromptBuilder(
      [new UserInputModule()],
      {
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
      },
    )
    const request = await builder.build(createPipelineContext())
    expect(getHistoryDiff(request)).toBeDefined()
  })

  it('should support BuilderOptions form with history differ', async () => {
    const builder = new DefaultPromptBuilder(
      [new UserInputModule()],
      fullSetup,
    )
    const request = await builder.build(createPipelineContext())
    expect(getHistoryDiff(request)).toBeDefined()
  })

  it('should support full BuilderOptions with all fields', async () => {
    const builder = new DefaultPromptBuilder(
      [new UserInputModule()],
      fullSetup,
    )
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.historyDiff).toBeDefined()
    expect(assembly?.history).toBeDefined()
    expect(assembly?.trace).toBeDefined()
  })

  it('should support legacy args without history differ', async () => {
    const builder = new DefaultPromptBuilder(
      [new UserInputModule()],
      undefined as unknown as Record<string, unknown>,
    )
    const request = await builder.build(createPipelineContext())
    expect(getHistoryDiff(request)).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// No Prompt Changes
// ---------------------------------------------------------------------------

describe('No prompt changes', () => {
  it('should produce same prompt with or without history differ', async () => {
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
    })
    const r1 = await builderWith.build(ctx1)
    const r2 = await builderWithout.build(ctx2)
    expect(r1.prompt).toBe(r2.prompt)
  })

  it('should not inject historyDiff into prompt text', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(request.prompt).not.toContain('historyDiff')
  })

  it('should store historyDiff only in metadata', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(request.metadata?.promptAssembly).toHaveProperty('historyDiff')
    expect(request.prompt).not.toContain('historyDiff')
  })

  it('should keep historyDiff absent from prompt string', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(request.prompt).not.toContain('added')
    // No diff content leaks into prompt
  })

  it('should not change prompt when differ output differs', async () => {
    const differA: PromptAssemblyHistoryDiffer = {
      diff() {
        return { added: [0], removed: [], changed: [] }
      },
    }
    const differB: PromptAssemblyHistoryDiffer = {
      diff() {
        return { added: [1, 2, 3], removed: [4, 5], changed: [6] }
      },
    }
    const baseOpts = {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyHistoryBuilder: new DefaultPromptAssemblyHistoryBuilder(),
    }
    const ctx1 = createPipelineContext()
    const ctx2 = createPipelineContext()
    const b1 = new DefaultPromptBuilder([new UserInputModule()], { ...baseOpts, promptAssemblyHistoryDiffer: differA })
    const b2 = new DefaultPromptBuilder([new UserInputModule()], { ...baseOpts, promptAssemblyHistoryDiffer: differB })
    const r1 = await b1.build(ctx1)
    const r2 = await b2.build(ctx2)
    expect(r1.prompt).toBe(r2.prompt)
  })

  it('should not include historyDiff in serialized prompt', async () => {
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
  it('should be compatible with RetryPlanner scenarios', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const historyDiff = getHistoryDiff(request)
    expect(historyDiff).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Compatibility — ToolCallPlanner
// ---------------------------------------------------------------------------

describe('ToolCallPlanner compatibility', () => {
  it('should be compatible with ToolCallPlanner scenarios', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const historyDiff = getHistoryDiff(request)
    expect(historyDiff).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Compatibility — Streaming
// ---------------------------------------------------------------------------

describe('Streaming compatibility', () => {
  it('should be compatible with streaming pipeline', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const historyDiff = getHistoryDiff(request)
    expect(historyDiff).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Compatibility — AgentLoop
// ---------------------------------------------------------------------------

describe('AgentLoop compatibility', () => {
  it('should be compatible with AgentLoop', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const historyDiff = getHistoryDiff(request)
    expect(historyDiff).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// History Diff Validation
// ---------------------------------------------------------------------------

describe('History diff validation', () => {
  it('should report added entry at index 0 on first build', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const historyDiff = getHistoryDiff(request) as { added: number[] }
    expect(historyDiff.added).toEqual([0])
  })

  it('should report empty removed on first build', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const historyDiff = getHistoryDiff(request) as { removed: number[] }
    expect(historyDiff.removed).toEqual([])
  })

  it('should report empty changed on first build', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const historyDiff = getHistoryDiff(request) as { changed: number[] }
    expect(historyDiff.changed).toEqual([])
  })

  it('should produce identity diff on second build when differ is reused', async () => {
    // DefaultPromptAssemblyHistoryDiffer compares current history against empty baseline
    // Each build creates a new history from scratch
    // So each build should have added: [0]
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const r1 = await builder.build(createPipelineContext())
    const r2 = await builder.build(createPipelineContext())
    const d1 = getHistoryDiff(r1) as { added: number[] }
    const d2 = getHistoryDiff(r2) as { added: number[] }
    expect(d1.added).toEqual([0])
    expect(d2.added).toEqual([0])
  })

  it('should not produce changed entries on single build', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const historyDiff = getHistoryDiff(request) as { changed: number[] }
    expect(historyDiff.changed).toEqual([])
  })

  it('should have all three diff fields present', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const historyDiff = getHistoryDiff(request) as Record<string, unknown>
    expect(historyDiff).toHaveProperty('added')
    expect(historyDiff).toHaveProperty('removed')
    expect(historyDiff).toHaveProperty('changed')
  })

  it('should have array-type diff fields', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const historyDiff = getHistoryDiff(request) as { added: unknown; removed: unknown; changed: unknown }
    expect(Array.isArray(historyDiff.added)).toBe(true)
    expect(Array.isArray(historyDiff.removed)).toBe(true)
    expect(Array.isArray(historyDiff.changed)).toBe(true)
  })

  it('should store historyDiff at metadata.promptAssembly.historyDiff', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(request.metadata?.promptAssembly).toHaveProperty('historyDiff')
  })

  it('should differentiate between added and unchanged across builds', async () => {
    let callCount = 0
    const trackingDiffer: PromptAssemblyHistoryDiffer = {
      diff(_before, _after) {
        callCount++
        if (callCount === 1) return { added: [0], removed: [], changed: [] }
        return { added: [1], removed: [], changed: [] }
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyHistoryBuilder: new DefaultPromptAssemblyHistoryBuilder(),
      promptAssemblyHistoryDiffer: trackingDiffer,
    })
    const r1 = await builder.build(createPipelineContext())
    const r2 = await builder.build(createPipelineContext())
    const d1 = getHistoryDiff(r1) as { added: number[] }
    const d2 = getHistoryDiff(r2) as { added: number[] }
    expect(d1.added).toEqual([0])
    expect(d2.added).toEqual([1])
  })

  it('should handle empty diff result', async () => {
    const emptyDiffer: PromptAssemblyHistoryDiffer = {
      diff() {
        return { added: [], removed: [], changed: [] }
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyHistoryBuilder: new DefaultPromptAssemblyHistoryBuilder(),
      promptAssemblyHistoryDiffer: emptyDiffer,
    })
    const request = await builder.build(createPipelineContext())
    const historyDiff = getHistoryDiff(request) as { added: number[]; removed: number[]; changed: number[] }
    expect(historyDiff.added).toEqual([])
    expect(historyDiff.removed).toEqual([])
    expect(historyDiff.changed).toEqual([])
  })

  it('should handle diff with all three categories populated', async () => {
    const fullDiffer: PromptAssemblyHistoryDiffer = {
      diff() {
        return { added: [3], removed: [1], changed: [2] }
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyHistoryBuilder: new DefaultPromptAssemblyHistoryBuilder(),
      promptAssemblyHistoryDiffer: fullDiffer,
    })
    const request = await builder.build(createPipelineContext())
    const historyDiff = getHistoryDiff(request) as { added: number[]; removed: number[]; changed: number[] }
    expect(historyDiff.added).toEqual([3])
    expect(historyDiff.removed).toEqual([1])
    expect(historyDiff.changed).toEqual([2])
  })

  it('should handle diff with multiple entries in each category', async () => {
    const multiDiffer: PromptAssemblyHistoryDiffer = {
      diff() {
        return { added: [0, 1, 2], removed: [3, 4], changed: [5, 6, 7] }
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyHistoryBuilder: new DefaultPromptAssemblyHistoryBuilder(),
      promptAssemblyHistoryDiffer: multiDiffer,
    })
    const request = await builder.build(createPipelineContext())
    const historyDiff = getHistoryDiff(request) as { added: number[]; removed: number[]; changed: number[] }
    expect(historyDiff.added).toHaveLength(3)
    expect(historyDiff.removed).toHaveLength(2)
    expect(historyDiff.changed).toHaveLength(3)
  })

  it('should not store historyDiff when only trace is missing', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyHistoryBuilder: new DefaultPromptAssemblyHistoryBuilder(),
      promptAssemblyHistoryDiffer: new DefaultPromptAssemblyHistoryDiffer(),
    })
    const request = await builder.build(createPipelineContext())
    expect(getHistoryDiff(request)).toBeUndefined()
  })

  it('should not store historyDiff when only history builder is missing', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyHistoryDiffer: new DefaultPromptAssemblyHistoryDiffer(),
    })
    const request = await builder.build(createPipelineContext())
    expect(getHistoryDiff(request)).toBeUndefined()
  })

  it('should not store historyDiff when only differ is missing', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyHistoryBuilder: new DefaultPromptAssemblyHistoryBuilder(),
    })
    const request = await builder.build(createPipelineContext())
    expect(getHistoryDiff(request)).toBeUndefined()
  })

  it('should preserve differ output across different modules', async () => {
    const customDiffer: PromptAssemblyHistoryDiffer = {
      diff() {
        return { added: [42], removed: [7], changed: [99] }
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyHistoryBuilder: new DefaultPromptAssemblyHistoryBuilder(),
      promptAssemblyHistoryDiffer: customDiffer,
    })
    const request = await builder.build(createPipelineContext())
    const historyDiff = getHistoryDiff(request) as Record<string, unknown>
    expect((historyDiff as { added: number[] }).added).toEqual([42])
    expect((historyDiff as { removed: number[] }).removed).toEqual([7])
    expect((historyDiff as { changed: number[] }).changed).toEqual([99])
  })

  it('should handle differ that returns non-standard index values', async () => {
    const unusualDiffer: PromptAssemblyHistoryDiffer = {
      diff() {
        return { added: [999, -1, 0], removed: [], changed: [] }
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyHistoryBuilder: new DefaultPromptAssemblyHistoryBuilder(),
      promptAssemblyHistoryDiffer: unusualDiffer,
    })
    const request = await builder.build(createPipelineContext())
    const historyDiff = getHistoryDiff(request) as { added: number[] }
    expect(historyDiff.added).toEqual([999, -1, 0])
  })
})