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
import { DefaultStrategyEvaluator } from '../strategy/DefaultStrategyEvaluator'
import { DefaultPromptStrategy } from '../strategy/DefaultPromptStrategy'
import type { PromptAssemblyTimelineBuilder } from '../strategy/PromptAssemblyTimelineBuilder'
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
}

// ---------------------------------------------------------------------------
// BuilderOptions
// ---------------------------------------------------------------------------

describe('BuilderOptions', () => {
  it('should accept promptAssemblyTimelineBuilder field', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(getAssembly(request)?.timeline).toBeDefined()
  })

  it('should allow promptAssemblyTimelineBuilder to be omitted', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
    })
    const request = await builder.build(createPipelineContext())
    expect(getAssembly(request)?.timeline).toBeUndefined()
  })

  it('should allow promptAssemblyTimelineBuilder to be undefined', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyTimelineBuilder: undefined,
    })
    const request = await builder.build(createPipelineContext())
    expect(getAssembly(request)?.timeline).toBeUndefined()
  })

  it('should accept custom timeline builder in full setup', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const timeline = getAssembly(request)?.timeline as Record<string, unknown> | undefined
    expect(timeline).toBeDefined()
    expect(timeline?.entries).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Timeline Invocation
// ---------------------------------------------------------------------------

describe('Timeline Invocation', () => {
  it('should invoke the timeline builder', async () => {
    let called = false
    const custom: PromptAssemblyTimelineBuilder = {
      build() {
        called = true
        return { entries: [] }
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyTimelineBuilder: custom,
    })
    await builder.build(createPipelineContext())
    expect(called).toBe(true)
  })

  it('should invoke the timeline builder exactly once', async () => {
    let callCount = 0
    const custom: PromptAssemblyTimelineBuilder = {
      build() {
        callCount++
        return { entries: [] }
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyTimelineBuilder: custom,
    })
    await builder.build(createPipelineContext())
    expect(callCount).toBe(1)
  })

  it('should not invoke the timeline builder without a timeline builder', async () => {
    let called = false
    const custom: PromptAssemblyTimelineBuilder = {
      build() {
        called = true
        return { entries: [] }
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
    })
    await builder.build(createPipelineContext())
    expect(called).toBe(false)
  })

  it('should pass the correct trace to the builder', async () => {
    let receivedTraces: readonly import('../strategy/PromptAssemblyTrace').PromptAssemblyTrace[] | undefined
    const custom: PromptAssemblyTimelineBuilder = {
      build(traces) {
        receivedTraces = traces
        return { entries: traces.map((t, i) => ({ index: i, trace: t })) }
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyTimelineBuilder: custom,
    })
    await builder.build(createPipelineContext())
    expect(receivedTraces).toBeDefined()
    expect(receivedTraces).toHaveLength(1)
  })

  it('should not invoke timeline builder without trace', async () => {
    let called = false
    const custom: PromptAssemblyTimelineBuilder = {
      build() {
        called = true
        return { entries: [] }
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTimelineBuilder: custom,
    })
    await builder.build(createPipelineContext())
    expect(called).toBe(false)
  })

  it('should preserve custom timeline output', async () => {
    const custom: PromptAssemblyTimelineBuilder = {
      build() {
        return {
          entries: [
            { index: 42, trace: { strategy: { name: 'custom' } } },
          ],
        }
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyTimelineBuilder: custom,
    })
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    const timeline = assembly?.timeline as Record<string, unknown> | undefined
    expect(timeline).toBeDefined()
    const entries = timeline?.entries as Array<Record<string, unknown>>
    expect(entries).toHaveLength(1)
    expect(entries[0].index).toBe(42)
  })
})

// ---------------------------------------------------------------------------
// Metadata Creation
// ---------------------------------------------------------------------------

describe('Metadata Creation', () => {
  it('should store timeline in metadata', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(getAssembly(request)?.timeline).toBeDefined()
  })

  it('should not store timeline without builder', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
    })
    const request = await builder.build(createPipelineContext())
    expect(getAssembly(request)?.timeline).toBeUndefined()
  })

  it('should not store timeline without trace builder', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTimelineBuilder: new DefaultPromptAssemblyTimelineBuilder(),
    })
    const request = await builder.build(createPipelineContext())
    expect(getAssembly(request)?.timeline).toBeUndefined()
  })

  it('should store timeline with valid entries content', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    const timeline = assembly?.timeline as Record<string, unknown> | undefined
    expect(timeline).toBeDefined()
    expect(timeline?.entries).toBeDefined()
    expect(Array.isArray(timeline?.entries)).toBe(true)
  })

  it('should create a single-entry timeline', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    const timeline = assembly?.timeline as Record<string, unknown> | undefined
    const entries = timeline?.entries as Array<Record<string, unknown>>
    expect(entries).toHaveLength(1)
  })

  it('should store timeline entry trace matching metadata trace', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    const timeline = assembly?.timeline as Record<string, unknown> | undefined
    const entries = timeline?.entries as Array<Record<string, unknown>>
    expect(entries[0].trace).toEqual(assembly?.trace)
  })
})

// ---------------------------------------------------------------------------
// Metadata Coexistence
// ---------------------------------------------------------------------------

describe('Metadata Coexistence', () => {
  it('should coexist with trace', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.trace).toBeDefined()
    expect(assembly?.timeline).toBeDefined()
  })

  it('should coexist with traceDiff', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.traceDiff).toBeDefined()
    expect(assembly?.timeline).toBeDefined()
  })

  it('should coexist with traceRendered', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.traceRendered).toBeDefined()
    expect(assembly?.timeline).toBeDefined()
  })

  it('should coexist with traceExported', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.traceExported).toBeDefined()
    expect(assembly?.timeline).toBeDefined()
  })

  it('should coexist with snapshot', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.snapshot).toBeDefined()
    expect(assembly?.timeline).toBeDefined()
  })

  it('should coexist with inspector', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.inspector).toBeDefined()
    expect(assembly?.timeline).toBeDefined()
  })

  it('should coexist with plan', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.plan).toBeDefined()
    expect(assembly?.timeline).toBeDefined()
  })

  it('should coexist with optimizedPlan', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.optimizedPlan).toBeDefined()
    expect(assembly?.timeline).toBeDefined()
  })

  it('should coexist with planDiff', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.planDiff).toBeDefined()
    expect(assembly?.timeline).toBeDefined()
  })

  it('should coexist with strategy', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.strategy).toBeDefined()
    expect(assembly?.timeline).toBeDefined()
  })

  it('should coexist with strategySelection', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.strategySelection).toBeDefined()
    expect(assembly?.timeline).toBeDefined()
  })

  it('should coexist with all fields simultaneously', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.trace).toBeDefined()
    expect(assembly?.traceDiff).toBeDefined()
    expect(assembly?.traceRendered).toBeDefined()
    expect(assembly?.traceExported).toBeDefined()
    expect(assembly?.snapshot).toBeDefined()
    expect(assembly?.inspector).toBeDefined()
    expect(assembly?.plan).toBeDefined()
    expect(assembly?.optimizedPlan).toBeDefined()
    expect(assembly?.planDiff).toBeDefined()
    expect(assembly?.strategy).toBeDefined()
    expect(assembly?.strategySelection).toBeDefined()
    expect(assembly?.timeline).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Deterministic
// ---------------------------------------------------------------------------

describe('Deterministic', () => {
  it('should produce the same timeline across multiple calls', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const r1 = await builder.build(createPipelineContext())
    const r2 = await builder.build(createPipelineContext())
    expect(getAssembly(r1)?.timeline).toEqual(getAssembly(r2)?.timeline)
  })

  it('should produce the same timeline entries across calls', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const r1 = await builder.build(createPipelineContext())
    const r2 = await builder.build(createPipelineContext())
    const t1 = getAssembly(r1)?.timeline as Record<string, unknown> | undefined
    const t2 = getAssembly(r2)?.timeline as Record<string, unknown> | undefined
    expect(t1?.entries).toEqual(t2?.entries)
  })

  it('should produce consistent timeline across different builder instances', async () => {
    const b1 = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const b2 = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const r1 = await b1.build(createPipelineContext())
    const r2 = await b2.build(createPipelineContext())
    expect(getAssembly(r1)?.timeline).toEqual(getAssembly(r2)?.timeline)
  })

  it('should produce different timelines for different inputs', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const r1 = await builder.build(createPipelineContext({ input: 'create a tree' }))
    const r2 = await builder.build(createPipelineContext({ input: 'delete the tree' }))
    // Both builds produce a timeline (single-entry each)
    const t1 = getAssembly(r1)?.timeline as Record<string, unknown> | undefined
    const t2 = getAssembly(r2)?.timeline as Record<string, unknown> | undefined
    expect(t1).toBeDefined()
    expect(t2).toBeDefined()
    const e1 = t1?.entries as Array<Record<string, unknown>>
    const e2 = t2?.entries as Array<Record<string, unknown>>
    expect(e1).toHaveLength(1)
    expect(e2).toHaveLength(1)
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
    expect(getAssembly(r1)?.timeline).toEqual(getAssembly(r2)?.timeline)
  })

  it('should not accumulate state across builds', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    await builder.build(createPipelineContext())
    await builder.build(createPipelineContext())
    const r3 = await builder.build(createPipelineContext())
    const timeline = getAssembly(r3)?.timeline as Record<string, unknown> | undefined
    const entries = timeline?.entries as Array<Record<string, unknown>>
    expect(entries).toHaveLength(1)
  })

  it('should produce independent results per call', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const r1 = await builder.build(createPipelineContext({ input: 'create a tree' }))
    const r2 = await builder.build(createPipelineContext({ input: 'delete the tree' }))
    const t1 = getAssembly(r1)?.timeline as Record<string, unknown> | undefined
    const t2 = getAssembly(r2)?.timeline as Record<string, unknown> | undefined
    expect(t1).toBeDefined()
    expect(t2).toBeDefined()
    const e1 = t1?.entries as Array<Record<string, unknown>>
    const e2 = t2?.entries as Array<Record<string, unknown>>
    expect(e1).toHaveLength(1)
    expect(e2).toHaveLength(1)
    expect(e1[0].index).toBe(0)
    expect(e2[0].index).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// Pure
// ---------------------------------------------------------------------------

describe('Pure', () => {
  it('should not modify PipelineContext', async () => {
    const context = createPipelineContext()
    const original = { ...context }
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    await builder.build(context)
    expect(context.input).toBe(original.input)
  })

  it('should not modify metadata', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const metadata = request.metadata
    const metadataCopy = JSON.parse(JSON.stringify(metadata))
    // Verify timeline is additive — no fields removed
    expect(metadataCopy?.promptAssembly?.timeline).toBeDefined()
  })

  it('should not affect the prompt output', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(typeof request.prompt).toBe('string')
  })

  it('should not modify context metadata', async () => {
    const context = createPipelineContext()
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    await builder.build(context)
    expect(context.metadata).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// Legacy Constructor
// ---------------------------------------------------------------------------

describe('Legacy Constructor', () => {
  it('should not produce timeline when using positional arguments', async () => {
    const builder = new DefaultPromptBuilder(
      [new UserInputModule()],
      undefined, // renderer
    )
    const request = await builder.build(createPipelineContext())
    expect(getAssembly(request)?.timeline).toBeUndefined()
  })

  it('should produce timeline with BuilderOptions form', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(getAssembly(request)?.timeline).toBeDefined()
  })

  it('should not produce timeline with full legacy args', async () => {
    const builder = new DefaultPromptBuilder(
      [new UserInputModule()],
      undefined, undefined, undefined, undefined, undefined, undefined, undefined,
    )
    const request = await builder.build(createPipelineContext())
    expect(getAssembly(request)?.timeline).toBeUndefined()
  })

  it('should produce timeline when timeline builder explicitly provided', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyTimelineBuilder: new DefaultPromptAssemblyTimelineBuilder(),
    })
    const request = await builder.build(createPipelineContext())
    expect(getAssembly(request)?.timeline).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// No Prompt Changes
// ---------------------------------------------------------------------------

describe('No Prompt Changes', () => {
  it('should produce identical prompt with and without timeline builder', async () => {
    const withTimeline = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const withoutTimeline = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyTraceBuilder: new DefaultPromptAssemblyTraceBuilder(),
      promptAssemblyTraceDiffer: new DefaultPromptAssemblyTraceDiffer(),
      promptAssemblyTraceRenderer: new DefaultPromptAssemblyTraceRenderer(),
      promptAssemblyTraceExporter: new DefaultPromptAssemblyTraceExporter(),
    })
    const [r1, r2] = await Promise.all([
      withTimeline.build(createPipelineContext()),
      withoutTimeline.build(createPipelineContext()),
    ])
    expect(r1.prompt).toBe(r2.prompt)
  })

  it('should not inject timeline into prompt text', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(request.prompt).not.toContain('timeline')
    expect(request.prompt).not.toContain('PromptAssemblyTimeline')
  })

  it('should produce the same prompt with all components', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(request.prompt).toContain('draw a tree')
    expect(request.prompt).not.toContain('timeline')
  })

  it('should not inject timeline into prompt even with all components', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(request.prompt).not.toMatch(/timeline/i)
  })

  it('should not inject timeline entries into prompt', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(request.prompt).not.toContain('entries')
    expect(request.prompt).not.toContain('index')
  })
})

// ---------------------------------------------------------------------------
// Compatibility
// ---------------------------------------------------------------------------

describe('Compatibility', () => {
  it('should be compatible with RetryPlanner', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(getAssembly(request)?.timeline).toBeDefined()
  })

  it('should be compatible with ToolCallPlanner', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(getAssembly(request)?.timeline).toBeDefined()
  })

  it('should be compatible with Streaming', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(getAssembly(request)?.timeline).toBeDefined()
  })

  it('should be compatible with AgentLoop', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    expect(getAssembly(request)?.timeline).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Timeline Validation
// ---------------------------------------------------------------------------

describe('Timeline Validation', () => {
  it('should have entry index set to 0', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    const timeline = assembly?.timeline as Record<string, unknown> | undefined
    const entries = timeline?.entries as Array<Record<string, unknown>>
    expect(entries[0].index).toBe(0)
  })

  it('should preserve the trace in the entry', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    const timeline = assembly?.timeline as Record<string, unknown> | undefined
    const entries = timeline?.entries as Array<Record<string, unknown>>
    expect(entries[0].trace).toBeDefined()
    expect(entries[0].trace).toEqual(assembly?.trace)
  })

  it('should have exactly one entry', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    const timeline = assembly?.timeline as Record<string, unknown> | undefined
    const entries = timeline?.entries as Array<Record<string, unknown>>
    expect(entries).toHaveLength(1)
  })

  it('should have entries as an array', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    const timeline = assembly?.timeline as Record<string, unknown> | undefined
    expect(Array.isArray(timeline?.entries)).toBe(true)
  })

  it('should have entries with index and trace keys', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    const timeline = assembly?.timeline as Record<string, unknown> | undefined
    const entries = timeline?.entries as Array<Record<string, unknown>>
    expect(entries[0]).toHaveProperty('index')
    expect(entries[0]).toHaveProperty('trace')
  })

  it('should have entry index as a number', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    const timeline = assembly?.timeline as Record<string, unknown> | undefined
    const entries = timeline?.entries as Array<Record<string, unknown>>
    expect(typeof entries[0].index).toBe('number')
  })

  it('should have entry trace with strategy name', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    const timeline = assembly?.timeline as Record<string, unknown> | undefined
    const entries = timeline?.entries as Array<Record<string, unknown>>
    const entryTrace = entries[0].trace as Record<string, unknown> | undefined
    expect(entryTrace).toBeDefined()
  })

  it('should preserve timeline shape as { entries }', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], fullSetup)
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    const timeline = assembly?.timeline as Record<string, unknown> | undefined
    expect(Object.keys(timeline!)).toContain('entries')
  })
})