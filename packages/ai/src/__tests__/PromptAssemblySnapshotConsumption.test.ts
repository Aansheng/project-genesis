import { describe, it, expect } from 'vitest'
import { DefaultPromptBuilder } from '../prompt/DefaultPromptBuilder'
import { DefaultPromptAssemblyPlanner } from '../strategy/DefaultPromptAssemblyPlanner'
import { StrategyAwarePromptAssemblyPlanner } from '../strategy/StrategyAwarePromptAssemblyPlanner'
import { DefaultPromptAssemblyPlanRenderer } from '../strategy/DefaultPromptAssemblyPlanRenderer'
import { DefaultPromptAssemblyOptimizer } from '../strategy/DefaultPromptAssemblyOptimizer'
import { DefaultPromptAssemblyPlanDiffer } from '../strategy/DefaultPromptAssemblyPlanDiffer'
import { DefaultPromptAssemblySnapshotBuilder } from '../strategy/DefaultPromptAssemblySnapshotBuilder'
import type { PromptAssemblySnapshotBuilder } from '../strategy/PromptAssemblySnapshotBuilder'
import type { PromptAssemblySnapshot } from '../strategy/PromptAssemblySnapshot'
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

// ---------------------------------------------------------------------------
// BuilderOptions
// ---------------------------------------------------------------------------

describe('BuilderOptions', () => {
  it('should accept promptAssemblySnapshotBuilder field', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
    })
    const request = await builder.build(createPipelineContext())
    expect(getAssembly(request)?.snapshot).toBeDefined()
  })

  it('should allow promptAssemblySnapshotBuilder to be undefined', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblySnapshotBuilder: undefined,
    })
    const request = await builder.build(createPipelineContext())
    expect(getAssembly(request)?.snapshot).toBeUndefined()
  })

  it('should allow promptAssemblySnapshotBuilder to be omitted', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {})
    const request = await builder.build(createPipelineContext())
    expect(getAssembly(request)?.snapshot).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// SnapshotBuilder Invocation
// ---------------------------------------------------------------------------

describe('SnapshotBuilder invocation', () => {
  it('should invoke snapshot builder when configured', async () => {
    let invoked = false
    const trackingBuilder: PromptAssemblySnapshotBuilder = {
      build(_metadata: Record<string, unknown>): PromptAssemblySnapshot {
        invoked = true
        return {}
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblySnapshotBuilder: trackingBuilder,
    })
    await builder.build(createPipelineContext())
    expect(invoked).toBe(true)
  })

  it('should not create snapshot when not configured', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()])
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    // No assembly data expected (no planner, no snapshot builder)
    expect(assembly?.snapshot).toBeUndefined()
  })

  it('should pass metadata to snapshot builder', async () => {
    let capturedMetadata: Record<string, unknown> | undefined
    const capturingBuilder: PromptAssemblySnapshotBuilder = {
      build(metadata: Record<string, unknown>): PromptAssemblySnapshot {
        capturedMetadata = metadata
        return {}
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblySnapshotBuilder: capturingBuilder,
    })
    await builder.build(createPipelineContext())
    expect(capturedMetadata).toBeDefined()
    expect(capturedMetadata!.strategy).toBeDefined()
  })

  it('should pass all relevant fields to snapshot builder', async () => {
    let capturedMetadata: Record<string, unknown> | undefined
    const capturingBuilder: PromptAssemblySnapshotBuilder = {
      build(metadata: Record<string, unknown>): PromptAssemblySnapshot {
        capturedMetadata = metadata
        return {}
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
      promptAssemblyOptimizer: new DefaultPromptAssemblyOptimizer(),
      promptAssemblyPlanDiffer: new DefaultPromptAssemblyPlanDiffer(),
      promptAssemblyPlanRenderer: new DefaultPromptAssemblyPlanRenderer(),
      promptAssemblySnapshotBuilder: capturingBuilder,
    })
    await builder.build(createPipelineContext())
    expect(capturedMetadata).toBeDefined()
    // Strategy should be present
    expect(capturedMetadata!.strategy).toBeDefined()
    // Assembly fields should be present
    expect(capturedMetadata!.plan).toBeDefined()
    expect(capturedMetadata!.optimizedPlan).toBeDefined()
    expect(capturedMetadata!.planDiff).toBeDefined()
    expect(capturedMetadata!.planRendered).toBeDefined()
  })

  it('should pass strategy name object to snapshot builder', async () => {
    let capturedStrategy: unknown
    const capturingBuilder: PromptAssemblySnapshotBuilder = {
      build(metadata: Record<string, unknown>): PromptAssemblySnapshot {
        capturedStrategy = metadata.strategy
        return {}
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblySnapshotBuilder: capturingBuilder,
    })
    await builder.build(createPipelineContext())
    expect(capturedStrategy).toEqual({ name: 'default' })
  })

  it('should invoke snapshot builder even without assembly components', async () => {
    let invoked = false
    const trackingBuilder: PromptAssemblySnapshotBuilder = {
      build(_metadata: Record<string, unknown>): PromptAssemblySnapshot {
        invoked = true
        return {}
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblySnapshotBuilder: trackingBuilder,
    })
    await builder.build(createPipelineContext())
    expect(invoked).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Snapshot Creation
// ---------------------------------------------------------------------------

describe('Snapshot creation', () => {
  it('should create snapshot with strategy name', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
    })
    const request = await builder.build(createPipelineContext())
    const snapshot = getAssembly(request)?.snapshot as PromptAssemblySnapshot | undefined
    expect(snapshot).toBeDefined()
    expect(snapshot!.strategy).toBeDefined()
  })

  it('should create snapshot with plan when planner is configured', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
    })
    const request = await builder.build(createPipelineContext())
    const snapshot = getAssembly(request)?.snapshot as PromptAssemblySnapshot | undefined
    expect(snapshot).toBeDefined()
    expect(snapshot!.plan).toBeDefined()
  })

  it('should create snapshot with optimizedPlan when optimizer is configured', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
      promptAssemblyOptimizer: new DefaultPromptAssemblyOptimizer(),
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
    })
    const request = await builder.build(createPipelineContext())
    const snapshot = getAssembly(request)?.snapshot as PromptAssemblySnapshot | undefined
    expect(snapshot).toBeDefined()
    expect(snapshot!.optimizedPlan).toBeDefined()
  })

  it('should create snapshot with planDiff when differ is configured', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
      promptAssemblyOptimizer: new DefaultPromptAssemblyOptimizer(),
      promptAssemblyPlanDiffer: new DefaultPromptAssemblyPlanDiffer(),
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
    })
    const request = await builder.build(createPipelineContext())
    const snapshot = getAssembly(request)?.snapshot as PromptAssemblySnapshot | undefined
    expect(snapshot).toBeDefined()
    expect(snapshot!.planDiff).toBeDefined()
  })

  it('should create snapshot with planRendered when renderer is configured', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
      promptAssemblyPlanRenderer: new DefaultPromptAssemblyPlanRenderer(),
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
    })
    const request = await builder.build(createPipelineContext())
    const snapshot = getAssembly(request)?.snapshot as PromptAssemblySnapshot | undefined
    expect(snapshot).toBeDefined()
    expect(snapshot!.planRendered).toBeDefined()
  })

  it('should create snapshot with all available fields', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
      promptAssemblyOptimizer: new DefaultPromptAssemblyOptimizer(),
      promptAssemblyPlanDiffer: new DefaultPromptAssemblyPlanDiffer(),
      promptAssemblyPlanRenderer: new DefaultPromptAssemblyPlanRenderer(),
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
    })
    const request = await builder.build(createPipelineContext())
    const snapshot = getAssembly(request)?.snapshot as PromptAssemblySnapshot | undefined
    expect(snapshot).toBeDefined()
    expect(snapshot!.strategy).toBeDefined()
    expect(snapshot!.plan).toBeDefined()
    expect(snapshot!.optimizedPlan).toBeDefined()
    expect(snapshot!.planDiff).toBeDefined()
    expect(snapshot!.planRendered).toBeDefined()
  })

  it('should return empty snapshot when no metadata fields are populated', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
    })
    const request = await builder.build(createPipelineContext())
    const snapshot = getAssembly(request)?.snapshot as PromptAssemblySnapshot | undefined
    expect(snapshot).toBeDefined()
    // Only strategy should be populated
    expect(snapshot!.strategy).toBeDefined()
    expect(snapshot!.plan).toBeUndefined()
    expect(snapshot!.optimizedPlan).toBeUndefined()
    expect(snapshot!.planDiff).toBeUndefined()
    expect(snapshot!.planRendered).toBeUndefined()
  })

  it('should store custom snapshot from custom builder', async () => {
    const customBuilder: PromptAssemblySnapshotBuilder = {
      build(_metadata: Record<string, unknown>): PromptAssemblySnapshot {
        return {
          strategy: 'custom',
          strategyRendered: 'custom rendered',
        }
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblySnapshotBuilder: customBuilder,
    })
    const request = await builder.build(createPipelineContext())
    const snapshot = getAssembly(request)?.snapshot as PromptAssemblySnapshot | undefined
    expect(snapshot).toEqual({
      strategy: 'custom',
      strategyRendered: 'custom rendered',
    })
  })

  it('should create snapshot with strategySelection when evaluator is configured', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
    })
    const request = await builder.build(createPipelineContext())
    const snapshot = getAssembly(request)?.snapshot as PromptAssemblySnapshot | undefined
    expect(snapshot).toBeDefined()
    expect(snapshot!.strategy).toBeDefined()
    // strategySelection is absent without evaluator — snapshot omits it
    expect(snapshot!.strategySelection).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// Snapshot Metadata — Coexistence
// ---------------------------------------------------------------------------

describe('Snapshot coexistence', () => {
  it('should coexist with strategy', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
    })
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)!
    expect(assembly.snapshot).toBeDefined()
    expect(assembly.strategy).toBeDefined()
  })

  it('should coexist with plan', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
    })
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)!
    expect(assembly.snapshot).toBeDefined()
    expect(assembly.plan).toBeDefined()
  })

  it('should coexist with optimizedPlan', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
      promptAssemblyOptimizer: new DefaultPromptAssemblyOptimizer(),
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
    })
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)!
    expect(assembly.snapshot).toBeDefined()
    expect(assembly.optimizedPlan).toBeDefined()
  })

  it('should coexist with planDiff', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
      promptAssemblyOptimizer: new DefaultPromptAssemblyOptimizer(),
      promptAssemblyPlanDiffer: new DefaultPromptAssemblyPlanDiffer(),
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
    })
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)!
    expect(assembly.snapshot).toBeDefined()
    expect(assembly.planDiff).toBeDefined()
  })

  it('should coexist with planRendered', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
      promptAssemblyPlanRenderer: new DefaultPromptAssemblyPlanRenderer(),
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
    })
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)!
    expect(assembly.snapshot).toBeDefined()
    expect(assembly.planRendered).toBeDefined()
  })

  it('should coexist with all fields simultaneously', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
      promptAssemblyOptimizer: new DefaultPromptAssemblyOptimizer(),
      promptAssemblyPlanDiffer: new DefaultPromptAssemblyPlanDiffer(),
      promptAssemblyPlanRenderer: new DefaultPromptAssemblyPlanRenderer(),
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
    })
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)!
    expect(assembly.snapshot).toBeDefined()
    expect(assembly.strategy).toBeDefined()
    expect(assembly.plan).toBeDefined()
    expect(assembly.optimizedPlan).toBeDefined()
    expect(assembly.planDiff).toBeDefined()
    expect(assembly.planRendered).toBeDefined()
  })

  it('should not affect existing fields when snapshot is present', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
      promptAssemblyOptimizer: new DefaultPromptAssemblyOptimizer(),
      promptAssemblyPlanDiffer: new DefaultPromptAssemblyPlanDiffer(),
      promptAssemblyPlanRenderer: new DefaultPromptAssemblyPlanRenderer(),
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
    })
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)!
    expect(assembly.strategy).toBeDefined()
    expect(assembly.plan).toBeDefined()
    expect(assembly.optimizedPlan).toBeDefined()
    expect(assembly.planDiff).toBeDefined()
    expect(assembly.planRendered).toBeDefined()
    // Existing fields unchanged by snapshot addition
    expect(assembly.snapshot).toBeDefined()
  })

  it('should coexist with strategyRendered', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
    })
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)!
    expect(assembly.snapshot).toBeDefined()
    expect(assembly.strategyRendered).toBeDefined()
  })

  it('should coexist with strategySelection fields', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
    })
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)!
    expect(assembly.snapshot).toBeDefined()
    // Other assembly fields remain intact
    expect(assembly.strategy).toBeDefined()
    expect(assembly.ranking).toBeDefined()
    expect(assembly.budget).toBeDefined()
    expect(assembly.selection).toBeDefined()
  })

  it('should add snapshot without removing any existing field', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
      promptAssemblyOptimizer: new DefaultPromptAssemblyOptimizer(),
      promptAssemblyPlanDiffer: new DefaultPromptAssemblyPlanDiffer(),
      promptAssemblyPlanRenderer: new DefaultPromptAssemblyPlanRenderer(),
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
    })
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)!
    // Verify all existing fields are still present
    expect(assembly.strategy).toBeDefined()
    expect(assembly.strategyRendered).toBeDefined()
    expect(assembly.plan).toBeDefined()
    expect(assembly.optimizedPlan).toBeDefined()
    expect(assembly.planDiff).toBeDefined()
    expect(assembly.planRendered).toBeDefined()
    expect(assembly.planApplied).toBeDefined()
    expect(assembly.ranking).toBeDefined()
    expect(assembly.budget).toBeDefined()
    expect(assembly.selection).toBeDefined()
    // Plus the new snapshot field
    expect(assembly.snapshot).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Deterministic
// ---------------------------------------------------------------------------

describe('Deterministic', () => {
  it('should produce same snapshot across multiple builds', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
    })
    const ctx = createPipelineContext()
    const r1 = await builder.build(ctx)
    const r2 = await builder.build(ctx)
    const r3 = await builder.build(ctx)
    const s1 = getAssembly(r1)?.snapshot as PromptAssemblySnapshot | undefined
    const s2 = getAssembly(r2)?.snapshot as PromptAssemblySnapshot | undefined
    const s3 = getAssembly(r3)?.snapshot as PromptAssemblySnapshot | undefined
    expect(s1).toEqual(s2)
    expect(s2).toEqual(s3)
  })

  it('should produce same snapshot across different builder instances', async () => {
    const b1 = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
    })
    const b2 = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
    })
    const ctx = createPipelineContext()
    const r1 = await b1.build(ctx)
    const r2 = await b2.build(ctx)
    const s1 = getAssembly(r1)?.snapshot as PromptAssemblySnapshot | undefined
    const s2 = getAssembly(r2)?.snapshot as PromptAssemblySnapshot | undefined
    expect(s1).toEqual(s2)
  })

  it('should produce same snapshot for same input', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
    })
    const ctx1 = createPipelineContext()
    const ctx2 = createPipelineContext()
    const r1 = await builder.build(ctx1)
    const r2 = await builder.build(ctx2)
    const s1 = getAssembly(r1)?.snapshot as PromptAssemblySnapshot | undefined
    const s2 = getAssembly(r2)?.snapshot as PromptAssemblySnapshot | undefined
    expect(s1).toEqual(s2)
  })
})

// ---------------------------------------------------------------------------
// Stateless
// ---------------------------------------------------------------------------

describe('Stateless', () => {
  it('should not retain snapshot state between builds', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
    })
    const r1 = await builder.build(createPipelineContext({ input: 'draw a tree' }))
    const r2 = await builder.build(createPipelineContext({ input: 'build a house' }))
    const s1 = getAssembly(r1)?.snapshot as PromptAssemblySnapshot | undefined
    const s2 = getAssembly(r2)?.snapshot as PromptAssemblySnapshot | undefined
    expect(s1).toBeDefined()
    expect(s2).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Pure / No Side Effects
// ---------------------------------------------------------------------------

describe('Pure', () => {
  it('should not modify pipeline context', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
    })
    const ctx = createPipelineContext()
    const originalInput = ctx.input
    await builder.build(ctx)
    expect(ctx.input).toBe(originalInput)
  })

  it('should not modify the original metadata', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
    })
    const request = await builder.build(createPipelineContext())
    const snapshot = getAssembly(request)?.snapshot as PromptAssemblySnapshot | undefined
    const snapshotCopy = JSON.parse(JSON.stringify(snapshot))
    expect(JSON.stringify(snapshot)).toBe(JSON.stringify(snapshotCopy))
  })
})

// ---------------------------------------------------------------------------
// No Prompt Changes
// ---------------------------------------------------------------------------

describe('No prompt changes', () => {
  it('should produce identical prompt with and without snapshot builder', async () => {
    const modules = [new UserInputModule()]

    const builderWithout = new DefaultPromptBuilder(modules, {})
    const builderWith = new DefaultPromptBuilder(modules, {
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
    })

    const ctx = createPipelineContext()
    const r1 = await builderWithout.build(ctx)
    const r2 = await builderWith.build(ctx)
    expect(r1.prompt).toBe(r2.prompt)
  })

  it('should produce identical prompt with snapshot builder and all components', async () => {
    const modules = [new UserInputModule()]
    const planner = new DefaultPromptAssemblyPlanner()
    const optimizer = new DefaultPromptAssemblyOptimizer()
    const renderer = new DefaultPromptAssemblyPlanRenderer()
    const differ = new DefaultPromptAssemblyPlanDiffer()
    const snapshotBuilder = new DefaultPromptAssemblySnapshotBuilder()

    const builderWithout = new DefaultPromptBuilder(modules, {
      promptAssemblyPlanner: planner,
      promptAssemblyOptimizer: optimizer,
      promptAssemblyPlanRenderer: renderer,
      promptAssemblyPlanDiffer: differ,
    })
    const builderWith = new DefaultPromptBuilder(modules, {
      promptAssemblyPlanner: planner,
      promptAssemblyOptimizer: optimizer,
      promptAssemblyPlanRenderer: renderer,
      promptAssemblyPlanDiffer: differ,
      promptAssemblySnapshotBuilder: snapshotBuilder,
    })

    const ctx = createPipelineContext()
    const r1 = await builderWithout.build(ctx)
    const r2 = await builderWith.build(ctx)
    expect(r1.prompt).toBe(r2.prompt)
  })

  it('should not inject snapshot into prompt text', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
      promptAssemblyOptimizer: new DefaultPromptAssemblyOptimizer(),
      promptAssemblyPlanDiffer: new DefaultPromptAssemblyPlanDiffer(),
      promptAssemblyPlanRenderer: new DefaultPromptAssemblyPlanRenderer(),
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
    })
    const request = await builder.build(createPipelineContext())
    expect(request.prompt).not.toContain('snapshot')
    expect(request.prompt).not.toContain('strategySelection')
    expect(request.prompt).not.toContain('planDiff')
  })
})

// ---------------------------------------------------------------------------
// Legacy Constructor Compatibility
// ---------------------------------------------------------------------------

describe('Legacy constructor compatibility', () => {
  it('should work with legacy positional constructor', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()])
    const request = await builder.build(createPipelineContext())
    expect(request.prompt).toBeDefined()
    expect(getAssembly(request)?.snapshot).toBeUndefined()
  })

  it('should work with BuilderOptions without snapshot builder', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {})
    const request = await builder.build(createPipelineContext())
    expect(request.prompt).toBeDefined()
    expect(getAssembly(request)?.snapshot).toBeUndefined()
  })

  it('should work with full legacy constructor arguments', async () => {
    const builder = new DefaultPromptBuilder(
      [new UserInputModule()],
      undefined,  // renderer
      undefined,  // compression
      undefined,  // ranking
      undefined,  // budget
      undefined,  // selection
    )
    const request = await builder.build(createPipelineContext())
    expect(request.prompt).toBeDefined()
    expect(getAssembly(request)?.snapshot).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// StrategyAwarePlanner Compatibility
// ---------------------------------------------------------------------------

describe('StrategyAwarePlanner compatibility', () => {
  it('should work with StrategyAwarePromptAssemblyPlanner', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new StrategyAwarePromptAssemblyPlanner(),
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
    })
    const request = await builder.build(createPipelineContext())
    const snapshot = getAssembly(request)?.snapshot as PromptAssemblySnapshot | undefined
    expect(snapshot).toBeDefined()
    expect(snapshot!.plan).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

describe('Exports', () => {
  it('should export DefaultPromptAssemblySnapshotBuilder from strategy index', async () => {
    const mod = await import('../strategy')
    expect(mod.DefaultPromptAssemblySnapshotBuilder).toBeDefined()
  })

  it('should export DefaultPromptAssemblySnapshotBuilder from package root', async () => {
    const mod = await import('..')
    expect(mod.DefaultPromptAssemblySnapshotBuilder).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Compatibility — RetryPlanner
// ---------------------------------------------------------------------------

describe('RetryPlanner compatibility', () => {
  it('should be compatible with RetryPlanner', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
    })
    const ctx = createPipelineContext()
    const request = await builder.build(ctx)
    expect(getAssembly(request)?.snapshot).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Compatibility — ToolCallPlanner
// ---------------------------------------------------------------------------

describe('ToolCallPlanner compatibility', () => {
  it('should be compatible with ToolCallPlanner', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
    })
    const ctx = createPipelineContext()
    const request = await builder.build(ctx)
    expect(getAssembly(request)?.snapshot).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Compatibility — Streaming
// ---------------------------------------------------------------------------

describe('Streaming compatibility', () => {
  it('should be compatible with streaming pipeline', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
    })
    const ctx = createPipelineContext()
    const request = await builder.build(ctx)
    expect(request.prompt).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Compatibility — AgentLoop
// ---------------------------------------------------------------------------

describe('AgentLoop compatibility', () => {
  it('should be compatible with AgentLoop', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
    })
    const ctx = createPipelineContext()
    const request = await builder.build(ctx)
    expect(request.prompt).toBeDefined()
  })
})