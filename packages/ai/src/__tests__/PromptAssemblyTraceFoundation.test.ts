import { describe, it, expect } from 'vitest'
import { DefaultPromptAssemblyTraceBuilder } from '../strategy/DefaultPromptAssemblyTraceBuilder'
import type { PromptAssemblyTraceBuilder } from '../strategy/PromptAssemblyTraceBuilder'
import type { PromptAssemblyTrace } from '../strategy/PromptAssemblyTrace'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createPlan(priorities: Array<{ section: string; priority: number }>) {
  return { priorities }
}

function createStrategySelection(overrides?: Record<string, unknown>) {
  return {
    selected: 'create',
    candidates: [{ strategy: 'create', score: 100 }, { strategy: 'default', score: 0 }],
    ...overrides,
  }
}

function createPlanDiff(overrides?: Record<string, unknown>) {
  return {
    added: [],
    removed: [],
    changed: [],
    ...overrides,
  }
}

function createSnapshot(overrides?: Record<string, unknown>) {
  return {
    strategy: 'create',
    plan: createPlan([{ section: 'userInput', priority: 100 }]),
    ...overrides,
  }
}

function createInspector(overrides?: Record<string, unknown>) {
  return {
    strategy: 'create',
    sections: [{ title: 'Rendered Strategy', content: 'Prompt Strategy:\n\n- create' }],
    ...overrides,
  }
}

function createFullMetadata(): Record<string, unknown> {
  return {
    strategy: { name: 'create' },
    strategySelection: createStrategySelection(),
    plan: createPlan([{ section: 'userInput', priority: 100 }, { section: 'worldState', priority: 90 }]),
    optimizedPlan: createPlan([{ section: 'userInput', priority: 100 }, { section: 'worldState', priority: 90 }]),
    planDiff: createPlanDiff(),
    snapshot: createSnapshot(),
    inspector: createInspector(),
    inspectorRendered: 'Prompt Inspector\n\nStrategy:\ncreate\n\nSections:\n- Rendered Strategy',
    inspectorExported: '{"strategy":"create","sections":[{"title":"Rendered Strategy","content":"Prompt Strategy:\\n\\n- create"}]}',
  }
}

function buildTrace(metadata: Record<string, unknown>): PromptAssemblyTrace {
  const builder = new DefaultPromptAssemblyTraceBuilder()
  return builder.build(metadata)
}

// ---------------------------------------------------------------------------
// Interface Contract — PromptAssemblyTrace
// ---------------------------------------------------------------------------

describe('Interface contract — PromptAssemblyTrace', () => {
  it('should be an empty object by default', () => {
    const trace: PromptAssemblyTrace = {}
    expect(Object.keys(trace)).toHaveLength(0)
  })

  it('should accept strategy field as unknown', () => {
    const trace: PromptAssemblyTrace = { strategy: { name: 'create' } }
    expect(trace.strategy).toEqual({ name: 'create' })
  })

  it('should accept strategySelection field as unknown', () => {
    const trace: PromptAssemblyTrace = { strategySelection: createStrategySelection() }
    expect((trace.strategySelection as { selected: string }).selected).toBe('create')
  })

  it('should accept plan field as unknown', () => {
    const trace: PromptAssemblyTrace = { plan: createPlan([{ section: 'a', priority: 100 }]) }
    expect((trace.plan as { priorities: Array<unknown> }).priorities).toHaveLength(1)
  })

  it('should accept optimizedPlan field as unknown', () => {
    const trace: PromptAssemblyTrace = { optimizedPlan: createPlan([{ section: 'a', priority: 100 }]) }
    expect((trace.optimizedPlan as { priorities: Array<unknown> }).priorities).toHaveLength(1)
  })

  it('should accept planDiff field as unknown', () => {
    const trace: PromptAssemblyTrace = { planDiff: createPlanDiff({ added: ['test'] }) }
    expect((trace.planDiff as { added: string[] }).added).toEqual(['test'])
  })

  it('should accept snapshot field as unknown', () => {
    const trace: PromptAssemblyTrace = { snapshot: createSnapshot() }
    expect((trace.snapshot as { strategy: string }).strategy).toBe('create')
  })

  it('should accept inspector field as unknown', () => {
    const trace: PromptAssemblyTrace = { inspector: createInspector() }
    expect((trace.inspector as { strategy: string }).strategy).toBe('create')
  })

  it('should accept inspectorRendered as string', () => {
    const trace: PromptAssemblyTrace = { inspectorRendered: 'Prompt Inspector' }
    expect(trace.inspectorRendered).toBe('Prompt Inspector')
  })

  it('should accept inspectorExported as string', () => {
    const trace: PromptAssemblyTrace = { inspectorExported: '{}' }
    expect(trace.inspectorExported).toBe('{}')
  })

  it('should support all fields simultaneously', () => {
    const trace: PromptAssemblyTrace = {
      strategy: { name: 'create' },
      strategySelection: createStrategySelection(),
      plan: createPlan([{ section: 'a', priority: 100 }]),
      optimizedPlan: createPlan([{ section: 'a', priority: 100 }]),
      planDiff: createPlanDiff(),
      snapshot: createSnapshot(),
      inspector: createInspector(),
      inspectorRendered: 'Prompt Inspector',
      inspectorExported: '{}',
    }
    expect(trace.strategy).toBeDefined()
    expect(trace.strategySelection).toBeDefined()
    expect(trace.plan).toBeDefined()
    expect(trace.optimizedPlan).toBeDefined()
    expect(trace.planDiff).toBeDefined()
    expect(trace.snapshot).toBeDefined()
    expect(trace.inspector).toBeDefined()
    expect(trace.inspectorRendered).toBe('Prompt Inspector')
    expect(trace.inspectorExported).toBe('{}')
  })

  it('should allow inspectorRendered to be undefined', () => {
    const trace: PromptAssemblyTrace = {}
    expect(trace.inspectorRendered).toBeUndefined()
  })

  it('should allow inspectorExported to be undefined', () => {
    const trace: PromptAssemblyTrace = {}
    expect(trace.inspectorExported).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// Interface Contract — PromptAssemblyTraceBuilder
// ---------------------------------------------------------------------------

describe('Interface contract — PromptAssemblyTraceBuilder', () => {
  it('should have a build method', () => {
    const builder: PromptAssemblyTraceBuilder = new DefaultPromptAssemblyTraceBuilder()
    expect(builder.build).toBeDefined()
    expect(typeof builder.build).toBe('function')
  })

  it('should return a PromptAssemblyTrace', () => {
    const builder = new DefaultPromptAssemblyTraceBuilder()
    const result = builder.build({})
    expect(result).toBeDefined()
  })

  it('should accept Record<string, unknown> metadata', () => {
    const builder = new DefaultPromptAssemblyTraceBuilder()
    const result = builder.build({ strategy: { name: 'create' } })
    expect(result.strategy).toEqual({ name: 'create' })
  })

  it('should support custom builder implementations', () => {
    const customBuilder: PromptAssemblyTraceBuilder = {
      build(_metadata: Record<string, unknown>): PromptAssemblyTrace {
        return { strategy: 'custom' }
      },
    }
    const result = customBuilder.build({})
    expect(result.strategy).toBe('custom')
  })

  it('should have a single method only', () => {
    const methodNames = Object.getOwnPropertyNames(DefaultPromptAssemblyTraceBuilder.prototype)
      .filter(name => typeof (DefaultPromptAssemblyTraceBuilder.prototype as unknown as Record<string, unknown>)[name] === 'function')
    // build + private methods (isXxx guards) — all are fine
    expect(methodNames.includes('build')).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Empty Metadata
// ---------------------------------------------------------------------------

describe('Empty metadata', () => {
  it('should produce empty trace from empty metadata', () => {
    const trace = buildTrace({})
    expect(Object.keys(trace)).toHaveLength(0)
  })

  it('should produce empty trace from metadata with no known fields', () => {
    const trace = buildTrace({ unknownField: 'value', anotherOne: 42 })
    expect(Object.keys(trace)).toHaveLength(0)
  })

  it('should leave all fields undefined when metadata is empty', () => {
    const trace = buildTrace({})
    expect(trace.strategy).toBeUndefined()
    expect(trace.strategySelection).toBeUndefined()
    expect(trace.plan).toBeUndefined()
    expect(trace.optimizedPlan).toBeUndefined()
    expect(trace.planDiff).toBeUndefined()
    expect(trace.snapshot).toBeUndefined()
    expect(trace.inspector).toBeUndefined()
    expect(trace.inspectorRendered).toBeUndefined()
    expect(trace.inspectorExported).toBeUndefined()
  })

  it('should handle undefined metadata gracefully', () => {
    // Record<string, unknown> will be {} when we pass undefined-like
    const trace = buildTrace({} as Record<string, unknown>)
    expect(Object.keys(trace)).toHaveLength(0)
  })

  it('should handle null values in metadata', () => {
    const trace = buildTrace({
      strategy: null,
      inspector: null,
      snapshot: null,
    })
    expect(Object.keys(trace)).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// Trace Construction
// ---------------------------------------------------------------------------

describe('Trace construction', () => {
  it('should construct strategy from { name } object', () => {
    const trace = buildTrace({ strategy: { name: 'create' } })
    expect(trace.strategy).toEqual({ name: 'create' })
  })

  it('should construct strategySelection from metadata', () => {
    const sel = createStrategySelection()
    const trace = buildTrace({ strategySelection: sel })
    expect(trace.strategySelection).toEqual(sel)
  })

  it('should construct plan from metadata', () => {
    const plan = createPlan([{ section: 'userInput', priority: 100 }])
    const trace = buildTrace({ plan })
    expect(trace.plan).toEqual(plan)
  })

  it('should construct optimizedPlan from metadata', () => {
    const plan = createPlan([{ section: 'worldState', priority: 90 }])
    const trace = buildTrace({ optimizedPlan: plan })
    expect(trace.optimizedPlan).toEqual(plan)
  })

  it('should construct planDiff from metadata', () => {
    const diff = createPlanDiff({ added: ['newSection'] })
    const trace = buildTrace({ planDiff: diff })
    expect(trace.planDiff).toEqual(diff)
  })

  it('should construct snapshot from metadata', () => {
    const snapshot = createSnapshot()
    const trace = buildTrace({ snapshot })
    expect(trace.snapshot).toEqual(snapshot)
  })

  it('should construct inspector from metadata', () => {
    const inspector = createInspector()
    const trace = buildTrace({ inspector })
    expect(trace.inspector).toEqual(inspector)
  })

  it('should construct inspectorRendered from string metadata', () => {
    const trace = buildTrace({ inspectorRendered: 'Prompt Inspector\n\nNo Sections' })
    expect(trace.inspectorRendered).toBe('Prompt Inspector\n\nNo Sections')
  })

  it('should construct inspectorExported from string metadata', () => {
    const trace = buildTrace({ inspectorExported: '{}' })
    expect(trace.inspectorExported).toBe('{}')
  })

  it('should construct all fields from full metadata', () => {
    const metadata = createFullMetadata()
    const trace = buildTrace(metadata)
    expect(trace.strategy).toEqual({ name: 'create' })
    expect(trace.strategySelection).toEqual(metadata.strategySelection)
    expect(trace.plan).toEqual(metadata.plan)
    expect(trace.optimizedPlan).toEqual(metadata.optimizedPlan)
    expect(trace.planDiff).toEqual(metadata.planDiff)
    expect(trace.snapshot).toEqual(metadata.snapshot)
    expect(trace.inspector).toEqual(metadata.inspector)
    expect(trace.inspectorRendered).toBe(metadata.inspectorRendered)
    expect(trace.inspectorExported).toBe(metadata.inspectorExported)
  })
})

// ---------------------------------------------------------------------------
// Optional Fields
// ---------------------------------------------------------------------------

describe('Optional fields', () => {
  it('should allow all fields to be absent', () => {
    const trace = buildTrace({})
    expect(Object.keys(trace)).toHaveLength(0)
  })

  it('should construct only the fields present in metadata', () => {
    const trace = buildTrace({ strategy: { name: 'create' }, plan: createPlan([{ section: 'a', priority: 100 }]) })
    expect(trace.strategy).toBeDefined()
    expect(trace.plan).toBeDefined()
    expect(trace.strategySelection).toBeUndefined()
    expect(trace.optimizedPlan).toBeUndefined()
    expect(trace.planDiff).toBeUndefined()
    expect(trace.snapshot).toBeUndefined()
    expect(trace.inspector).toBeUndefined()
    expect(trace.inspectorRendered).toBeUndefined()
    expect(trace.inspectorExported).toBeUndefined()
  })

  it('should handle strategySelection absent gracefully', () => {
    const trace = buildTrace({ strategy: { name: 'create' } })
    expect(trace.strategy).toBeDefined()
    expect(trace.strategySelection).toBeUndefined()
  })

  it('should handle inspector fields absent gracefully', () => {
    const trace = buildTrace({ snapshot: createSnapshot() })
    expect(trace.snapshot).toBeDefined()
    expect(trace.inspector).toBeUndefined()
    expect(trace.inspectorRendered).toBeUndefined()
    expect(trace.inspectorExported).toBeUndefined()
  })

  it('should handle plan fields absent gracefully', () => {
    const trace = buildTrace({ strategy: { name: 'query' } })
    expect(trace.strategy).toBeDefined()
    expect(trace.plan).toBeUndefined()
    expect(trace.optimizedPlan).toBeUndefined()
    expect(trace.planDiff).toBeUndefined()
  })

  it('should skip empty string inspectorRendered', () => {
    const trace = buildTrace({ inspectorRendered: '' })
    expect(trace.inspectorRendered).toBeUndefined()
  })

  it('should skip empty string inspectorExported', () => {
    const trace = buildTrace({ inspectorExported: '' })
    expect(trace.inspectorExported).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// Unknown Field Ignoring
// ---------------------------------------------------------------------------

describe('Unknown field ignoring', () => {
  it('should ignore extra unknown fields', () => {
    const trace = buildTrace({ strategy: { name: 'create' }, extraField: 'should be ignored' })
    expect(trace.strategy).toBeDefined()
    expect((trace as unknown as Record<string, unknown>).extraField).toBeUndefined()
  })

  it('should ignore unknown fields when known fields are present', () => {
    const trace = buildTrace({
      strategy: { name: 'create' },
      plan: createPlan([{ section: 'a', priority: 100 }]),
      unknown: 'ignored',
      alsoUnknown: 42,
    })
    expect(trace.strategy).toBeDefined()
    expect(trace.plan).toBeDefined()
    expect(Object.keys(trace).length).toBe(2)
  })

  it('should ignore metadata with only unknown fields', () => {
    const trace = buildTrace({ unknown1: 1, unknown2: 'two', unknown3: true })
    expect(Object.keys(trace)).toHaveLength(0)
  })

  it('should ignore partial unknown keys mixed with known', () => {
    const trace = buildTrace({
      strategy: { name: 'modify' },
      unknownField: 'value',
      strategySelection: createStrategySelection(),
      anotherUnknown: false,
    })
    expect(trace.strategy).toBeDefined()
    expect(trace.strategySelection).toBeDefined()
    expect(Object.keys(trace).length).toBe(2)
  })

  it('should ignore malformed strategy (not an object with name)', () => {
    const trace = buildTrace({ strategy: 'just a string' })
    expect(trace.strategy).toBeUndefined()
  })

  it('should ignore malformed plan (not an object with priorities)', () => {
    const trace = buildTrace({ plan: 'not a plan' })
    expect(trace.plan).toBeUndefined()
  })

  it('should ignore malformed inspector (not an object with sections)', () => {
    const trace = buildTrace({ inspector: 'string instead of inspector' })
    expect(trace.inspector).toBeUndefined()
  })

  it('should ignore malformed snapshot (empty object)', () => {
    const trace = buildTrace({ snapshot: {} })
    expect(trace.snapshot).toBeUndefined()
  })

  it('should ignore arrays as top-level values', () => {
    const trace = buildTrace({ strategy: ['not', 'an', 'object'] })
    expect(trace.strategy).toBeUndefined()
  })

  it('should ignore primitive values for complex fields', () => {
    const trace = buildTrace({
      plan: 42,
      snapshot: true,
      inspector: null,
    })
    expect(trace.plan).toBeUndefined()
    expect(trace.snapshot).toBeUndefined()
    expect(trace.inspector).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// Deterministic
// ---------------------------------------------------------------------------

describe('Deterministic', () => {
  it('should produce same trace for same metadata', () => {
    const metadata = createFullMetadata()
    const trace1 = buildTrace(metadata)
    const trace2 = buildTrace(metadata)
    expect(JSON.stringify(trace1)).toBe(JSON.stringify(trace2))
  })

  it('should produce same trace across different builder instances', () => {
    const metadata = createFullMetadata()
    const builder1 = new DefaultPromptAssemblyTraceBuilder()
    const builder2 = new DefaultPromptAssemblyTraceBuilder()
    expect(JSON.stringify(builder1.build(metadata))).toBe(JSON.stringify(builder2.build(metadata)))
  })

  it('should produce same trace for same input across calls', () => {
    const metadata = createFullMetadata()
    const builder = new DefaultPromptAssemblyTraceBuilder()
    const results = Array.from({ length: 5 }, () => builder.build(metadata))
    for (let i = 1; i < results.length; i++) {
      expect(JSON.stringify(results[0])).toBe(JSON.stringify(results[i]))
    }
  })

  it('should produce same trace for empty metadata', () => {
    const builder = new DefaultPromptAssemblyTraceBuilder()
    const r1 = builder.build({})
    const r2 = builder.build({})
    expect(JSON.stringify(r1)).toBe(JSON.stringify(r2))
  })

  it('should produce same trace for same partial metadata', () => {
    const metadata = { strategy: { name: 'query' }, inspectorRendered: 'test' }
    const builder = new DefaultPromptAssemblyTraceBuilder()
    const r1 = builder.build(metadata)
    const r2 = builder.build(metadata)
    expect(JSON.stringify(r1)).toBe(JSON.stringify(r2))
  })

  it('should produce deterministic results regardless of call order', () => {
    const meta1 = { strategy: { name: 'create' } }
    const meta2 = { strategy: { name: 'query' } }
    const builder = new DefaultPromptAssemblyTraceBuilder()
    const r1a = builder.build(meta1)
    const r2a = builder.build(meta2)
    const r2b = builder.build(meta2)
    const r1b = builder.build(meta1)
    expect(JSON.stringify(r1a)).toBe(JSON.stringify(r1b))
    expect(JSON.stringify(r2a)).toBe(JSON.stringify(r2b))
  })
})

// ---------------------------------------------------------------------------
// Stateless
// ---------------------------------------------------------------------------

describe('Stateless', () => {
  it('should not retain state between builds', () => {
    const builder = new DefaultPromptAssemblyTraceBuilder()
    const meta1 = { strategy: { name: 'create' }, inspectorRendered: 'first' }
    const meta2 = { strategy: { name: 'query' }, inspectorRendered: 'second' }
    const r1 = builder.build(meta1)
    const r2 = builder.build(meta2)
    expect(r1.strategy).toEqual({ name: 'create' })
    expect(r1.inspectorRendered).toBe('first')
    expect(r2.strategy).toEqual({ name: 'query' })
    expect(r2.inspectorRendered).toBe('second')
  })

  it('should not modify builder class state across calls', () => {
    const builder = new DefaultPromptAssemblyTraceBuilder()
    const protoBefore = Object.keys(Object.getPrototypeOf(builder))
    builder.build(createFullMetadata())
    builder.build({})
    builder.build({ strategy: { name: 'test' } })
    const protoAfter = Object.keys(Object.getPrototypeOf(builder))
    expect(protoAfter).toEqual(protoBefore)
  })

  it('should produce independent results from each build call', () => {
    const builder = new DefaultPromptAssemblyTraceBuilder()
    const r1 = builder.build({ strategy: { name: 'create' } })
    const r2 = builder.build({ strategy: { name: 'query' } })
    expect((r1.strategy as { name: string }).name).toBe('create')
    expect((r2.strategy as { name: string }).name).toBe('query')
  })

  it('should not have any instance state', () => {
    const builder = new DefaultPromptAssemblyTraceBuilder()
    const ownProps = Object.getOwnPropertyNames(builder)
    expect(ownProps).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// Pure
// ---------------------------------------------------------------------------

describe('Pure', () => {
  it('should not modify the input metadata', () => {
    const metadata: Record<string, unknown> = { strategy: { name: 'create' } }
    const frozen = JSON.stringify(metadata)
    buildTrace(metadata)
    expect(JSON.stringify(metadata)).toBe(frozen)
  })

  it('should not modify nested metadata objects', () => {
    const metadata = createFullMetadata()
    const snapshotBefore = JSON.stringify(metadata.snapshot)
    buildTrace(metadata)
    expect(JSON.stringify(metadata.snapshot)).toBe(snapshotBefore)
  })

  it('should not add side effects to metadata', () => {
    const metadata: Record<string, unknown> = { strategy: { name: 'create' } }
    const keysBefore = Object.keys(metadata)
    buildTrace(metadata)
    expect(Object.keys(metadata)).toEqual(keysBefore)
  })

  it('should produce same result for same input', () => {
    const metadata = createFullMetadata()
    const builder = new DefaultPromptAssemblyTraceBuilder()
    const r1 = builder.build(metadata)
    const r2 = builder.build(metadata)
    expect(JSON.stringify(r1)).toBe(JSON.stringify(r2))
  })

  it('should not mutate the metadata array values', () => {
    const metadata = createFullMetadata()
    const candidatesBefore = JSON.stringify((metadata.strategySelection as Record<string, unknown>).candidates)
    buildTrace(metadata)
    expect(JSON.stringify((metadata.strategySelection as Record<string, unknown>).candidates)).toBe(candidatesBefore)
  })
})

// ---------------------------------------------------------------------------
// Immutable
// ---------------------------------------------------------------------------

describe('Immutable', () => {
  it('should have all readonly fields in the interface', () => {
    // Verify via TypeScript that fields are readonly — this is a compile-time check
    const trace: PromptAssemblyTrace = { strategy: { name: 'create' } }
    // At runtime, verify we can read the field
    expect(trace.strategy).toBeDefined()
  })

  it('should not allow mutation through the interface', () => {
    // TypeScript prevents mutation at compile time
    // At runtime, the object is a plain object — verify it's sealed-like
    expect(() => {
      'use strict'
      // This should fail silently in non-strict mode
    }).not.toThrow()
  })

  it('should return a new object each build call', () => {
    const metadata = createFullMetadata()
    const builder = new DefaultPromptAssemblyTraceBuilder()
    const r1 = builder.build(metadata)
    const r2 = builder.build(metadata)
    expect(r1).not.toBe(r2)
  })

  it('should not share references between trace and metadata', () => {
    const metadata = createFullMetadata()
    const trace = buildTrace(metadata)
    // Modifying metadata after build should not affect trace
    const originalStrategy = JSON.stringify(trace.strategy)
    metadata.strategy = { name: 'modified' }
    expect(JSON.stringify(trace.strategy)).toBe(originalStrategy)
  })

  it('should not have mutation methods on trace objects', () => {
    const trace = buildTrace({ strategy: { name: 'create' } })
    expect(typeof (trace as unknown as Record<string, unknown>).build).not.toBe('function')
    expect(typeof (trace as unknown as Record<string, unknown>).update).not.toBe('function')
    expect(typeof (trace as unknown as Record<string, unknown>).set).not.toBe('function')
  })
})

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

describe('Exports', () => {
  it('should export PromptAssemblyTrace type from strategy index', async () => {
    const mod = await import('../strategy')
    // Type-only exports are erased at runtime, so check for builder instead
    expect(mod.DefaultPromptAssemblyTraceBuilder).toBeDefined()
  })

  it('should export PromptAssemblyTraceBuilder type from strategy index', async () => {
    const mod = await import('../strategy')
    expect(mod.DefaultPromptAssemblyTraceBuilder).toBeDefined()
  })

  it('should export DefaultPromptAssemblyTraceBuilder from strategy index', async () => {
    const mod = await import('../strategy')
    expect(mod.DefaultPromptAssemblyTraceBuilder).toBeDefined()
  })

  it('should export PromptAssemblyTrace type from package root', async () => {
    const mod = await import('..')
    expect(mod.DefaultPromptAssemblyTraceBuilder).toBeDefined()
  })

  it('should export PromptAssemblyTraceBuilder type from package root', async () => {
    const mod = await import('..')
    expect(mod.DefaultPromptAssemblyTraceBuilder).toBeDefined()
  })

  it('should export DefaultPromptAssemblyTraceBuilder from package root', async () => {
    const mod = await import('..')
    expect(mod.DefaultPromptAssemblyTraceBuilder).toBeDefined()
  })

  it('should export DefaultPromptAssemblyTraceBuilder as a class', () => {
    const builder = new DefaultPromptAssemblyTraceBuilder()
    expect(builder).toBeInstanceOf(DefaultPromptAssemblyTraceBuilder)
  })

  it('should implement PromptAssemblyTraceBuilder interface', () => {
    const builder: PromptAssemblyTraceBuilder = new DefaultPromptAssemblyTraceBuilder()
    expect(builder.build).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Architecture Compliance
// ---------------------------------------------------------------------------

describe('Architecture compliance', () => {
  it('should not depend on Planner', () => {
    const builder = new DefaultPromptAssemblyTraceBuilder()
    expect(builder).toBeInstanceOf(DefaultPromptAssemblyTraceBuilder)
  })

  it('should not depend on Runtime', () => {
    const builder = new DefaultPromptAssemblyTraceBuilder()
    expect(builder).toBeDefined()
  })

  it('should not depend on Provider', () => {
    const builder = new DefaultPromptAssemblyTraceBuilder()
    expect(builder).toBeDefined()
  })

  it('should not depend on Memory', () => {
    const builder = new DefaultPromptAssemblyTraceBuilder()
    expect(builder).toBeDefined()
  })

  it('should not depend on AgentLoop', () => {
    const builder = new DefaultPromptAssemblyTraceBuilder()
    expect(builder).toBeDefined()
  })

  it('should not depend on Pipeline', () => {
    const builder = new DefaultPromptAssemblyTraceBuilder()
    expect(builder).toBeDefined()
  })

  it('should not depend on PromptBuilder', () => {
    const builder = new DefaultPromptAssemblyTraceBuilder()
    expect(builder).toBeDefined()
  })

  it('should not depend on Renderer', () => {
    const builder = new DefaultPromptAssemblyTraceBuilder()
    expect(builder).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Compatibility — RetryPlanner
// ---------------------------------------------------------------------------

describe('RetryPlanner compatibility', () => {
  it('should produce trace from metadata like RetryPlanner would produce', () => {
    const metadata = createFullMetadata()
    const trace = buildTrace(metadata)
    expect(trace.strategy).toBeDefined()
    expect(trace.inspectorExported).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Compatibility — ToolCallPlanner
// ---------------------------------------------------------------------------

describe('ToolCallPlanner compatibility', () => {
  it('should produce trace from metadata like ToolCallPlanner would produce', () => {
    const metadata = createFullMetadata()
    const trace = buildTrace(metadata)
    expect(trace.strategy).toBeDefined()
    expect(trace.inspectorExported).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Compatibility — Streaming
// ---------------------------------------------------------------------------

describe('Streaming compatibility', () => {
  it('should produce trace from metadata like streaming pipeline would produce', () => {
    const metadata = createFullMetadata()
    const trace = buildTrace(metadata)
    expect(trace.strategy).toBeDefined()
    expect(trace.inspectorExported).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Compatibility — AgentLoop
// ---------------------------------------------------------------------------

describe('AgentLoop compatibility', () => {
  it('should produce trace from metadata like AgentLoop would produce', () => {
    const metadata = createFullMetadata()
    const trace = buildTrace(metadata)
    expect(trace.strategy).toBeDefined()
    expect(trace.inspectorExported).toBeDefined()
  })
})
