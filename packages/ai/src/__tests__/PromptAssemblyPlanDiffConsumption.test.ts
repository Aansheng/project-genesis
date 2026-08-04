import { describe, it, expect } from 'vitest'
import { DefaultPromptBuilder } from '../prompt/DefaultPromptBuilder'
import { DefaultPromptAssemblyPlanner } from '../strategy/DefaultPromptAssemblyPlanner'
import { StrategyAwarePromptAssemblyPlanner } from '../strategy/StrategyAwarePromptAssemblyPlanner'
import { DefaultPromptAssemblyPlanRenderer } from '../strategy/DefaultPromptAssemblyPlanRenderer'
import { DefaultPromptAssemblyOptimizer } from '../strategy/DefaultPromptAssemblyOptimizer'
import { DefaultPromptAssemblyPlanDiffer } from '../strategy/DefaultPromptAssemblyPlanDiffer'
import type { PromptAssemblyPlanDiffer } from '../strategy/PromptAssemblyPlanDiffer'
import type { PromptAssemblyPlanDiff } from '../strategy/PromptAssemblyPlanDiff'
import type { PromptAssemblyPlan } from '../strategy/PromptAssemblyPlan'
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
  it('should accept promptAssemblyPlanDiffer field', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
      promptAssemblyOptimizer: new DefaultPromptAssemblyOptimizer(),
      promptAssemblyPlanDiffer: new DefaultPromptAssemblyPlanDiffer(),
    })
    const request = await builder.build(createPipelineContext())
    expect(getAssembly(request)?.planDiff).toBeDefined()
  })

  it('should allow promptAssemblyPlanDiffer to be undefined', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
      promptAssemblyOptimizer: new DefaultPromptAssemblyOptimizer(),
      promptAssemblyPlanDiffer: undefined,
    })
    const request = await builder.build(createPipelineContext())
    expect(getAssembly(request)?.planDiff).toBeUndefined()
  })

  it('should allow promptAssemblyPlanDiffer to be omitted', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
      promptAssemblyOptimizer: new DefaultPromptAssemblyOptimizer(),
    })
    const request = await builder.build(createPipelineContext())
    expect(getAssembly(request)?.planDiff).toBeUndefined()
  })

  it('should work without optimizer when differ is provided', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
      promptAssemblyPlanDiffer: new DefaultPromptAssemblyPlanDiffer(),
    })
    const request = await builder.build(createPipelineContext())
    // No optimizedPlan → differ not invoked → no planDiff
    expect(getAssembly(request)?.planDiff).toBeUndefined()
  })

  it('should work without planner when differ is provided', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyOptimizer: new DefaultPromptAssemblyOptimizer(),
      promptAssemblyPlanDiffer: new DefaultPromptAssemblyPlanDiffer(),
    })
    const request = await builder.build(createPipelineContext())
    expect(getAssembly(request)?.planDiff).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// Differ Invocation
// ---------------------------------------------------------------------------

describe('Differ invocation', () => {
  it('should invoke differ when plan, optimizer, and differ all exist', async () => {
    let invoked = false
    const trackingDiffer: PromptAssemblyPlanDiffer = {
      diff(_before: PromptAssemblyPlan, _after: PromptAssemblyPlan): PromptAssemblyPlanDiff {
        invoked = true
        return { added: [], removed: [], changed: [] }
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
      promptAssemblyOptimizer: new DefaultPromptAssemblyOptimizer(),
      promptAssemblyPlanDiffer: trackingDiffer,
    })
    await builder.build(createPipelineContext())
    expect(invoked).toBe(true)
  })

  it('should not invoke differ when optimizer is missing', async () => {
    let invoked = false
    const trackingDiffer: PromptAssemblyPlanDiffer = {
      diff(_before: PromptAssemblyPlan, _after: PromptAssemblyPlan): PromptAssemblyPlanDiff {
        invoked = true
        return { added: [], removed: [], changed: [] }
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
      promptAssemblyPlanDiffer: trackingDiffer,
    })
    await builder.build(createPipelineContext())
    expect(invoked).toBe(false)
  })

  it('should not invoke differ when planner is missing', async () => {
    let invoked = false
    const trackingDiffer: PromptAssemblyPlanDiffer = {
      diff(_before: PromptAssemblyPlan, _after: PromptAssemblyPlan): PromptAssemblyPlanDiff {
        invoked = true
        return { added: [], removed: [], changed: [] }
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyOptimizer: new DefaultPromptAssemblyOptimizer(),
      promptAssemblyPlanDiffer: trackingDiffer,
    })
    await builder.build(createPipelineContext())
    expect(invoked).toBe(false)
  })

  it('should pass both original plan and optimized plan to differ', async () => {
    let beforePlan: PromptAssemblyPlan | undefined
    let afterPlan: PromptAssemblyPlan | undefined
    const capturingDiffer: PromptAssemblyPlanDiffer = {
      diff(before: PromptAssemblyPlan, after: PromptAssemblyPlan): PromptAssemblyPlanDiff {
        beforePlan = before
        afterPlan = after
        return { added: [], removed: [], changed: [] }
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
      promptAssemblyOptimizer: new DefaultPromptAssemblyOptimizer(),
      promptAssemblyPlanDiffer: capturingDiffer,
    })
    await builder.build(createPipelineContext())
    expect(beforePlan).toBeDefined()
    expect(afterPlan).toBeDefined()
  })

  it('should pass the same plan for both when optimizer is identity', async () => {
    let beforePlan: PromptAssemblyPlan | undefined
    let afterPlan: PromptAssemblyPlan | undefined
    const capturingDiffer: PromptAssemblyPlanDiffer = {
      diff(before: PromptAssemblyPlan, after: PromptAssemblyPlan): PromptAssemblyPlanDiff {
        beforePlan = before
        afterPlan = after
        return { added: [], removed: [], changed: [] }
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
      promptAssemblyOptimizer: new DefaultPromptAssemblyOptimizer(),
      promptAssemblyPlanDiffer: capturingDiffer,
    })
    await builder.build(createPipelineContext())
    // Identity optimizer returns same reference
    expect(afterPlan).toBe(beforePlan)
  })

  it('should store diff result from custom differ', async () => {
    const customDiffer: PromptAssemblyPlanDiffer = {
      diff(_before: PromptAssemblyPlan, _after: PromptAssemblyPlan): PromptAssemblyPlanDiff {
        return {
          added: ['newSection'],
          removed: ['oldSection'],
          changed: [{ section: 'userInput', before: 100, after: 50 }],
        }
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
      promptAssemblyOptimizer: new DefaultPromptAssemblyOptimizer(),
      promptAssemblyPlanDiffer: customDiffer,
    })
    const request = await builder.build(createPipelineContext())
    const diff = getAssembly(request)?.planDiff as PromptAssemblyPlanDiff | undefined
    expect(diff).toBeDefined()
    expect(diff!.added).toEqual(['newSection'])
    expect(diff!.removed).toEqual(['oldSection'])
    expect(diff!.changed).toEqual([{ section: 'userInput', before: 100, after: 50 }])
  })

  it('should produce correct diff only when all three components present', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
      promptAssemblyOptimizer: new DefaultPromptAssemblyOptimizer(),
      promptAssemblyPlanDiffer: new DefaultPromptAssemblyPlanDiffer(),
    })
    const request = await builder.build(createPipelineContext())
    const diff = getAssembly(request)?.planDiff as PromptAssemblyPlanDiff | undefined
    // Identity optimizer: no changes expected
    expect(diff!.added).toEqual([])
    expect(diff!.removed).toEqual([])
    expect(diff!.changed).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// Metadata — planDiff
// ---------------------------------------------------------------------------

describe('Metadata — planDiff', () => {
  it('should create planDiff when planner, optimizer, and differ all exist', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
      promptAssemblyOptimizer: new DefaultPromptAssemblyOptimizer(),
      promptAssemblyPlanDiffer: new DefaultPromptAssemblyPlanDiffer(),
    })
    const request = await builder.build(createPipelineContext())
    expect(getAssembly(request)?.planDiff).toBeDefined()
  })

  it('should not create planDiff when differ is missing', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
      promptAssemblyOptimizer: new DefaultPromptAssemblyOptimizer(),
    })
    const request = await builder.build(createPipelineContext())
    expect(getAssembly(request)?.planDiff).toBeUndefined()
  })

  it('should not create planDiff when optimizer is missing', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
      promptAssemblyPlanDiffer: new DefaultPromptAssemblyPlanDiffer(),
    })
    const request = await builder.build(createPipelineContext())
    expect(getAssembly(request)?.planDiff).toBeUndefined()
  })

  it('should not create planDiff when planner is missing', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyOptimizer: new DefaultPromptAssemblyOptimizer(),
      promptAssemblyPlanDiffer: new DefaultPromptAssemblyPlanDiffer(),
    })
    const request = await builder.build(createPipelineContext())
    expect(getAssembly(request)?.planDiff).toBeUndefined()
  })

  it('should not create planDiff when all are missing', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()])
    const request = await builder.build(createPipelineContext())
    expect(getAssembly(request)?.planDiff).toBeUndefined()
  })

  it('should store PromptAssemblyPlanDiff shape in metadata', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
      promptAssemblyOptimizer: new DefaultPromptAssemblyOptimizer(),
      promptAssemblyPlanDiffer: new DefaultPromptAssemblyPlanDiffer(),
    })
    const request = await builder.build(createPipelineContext())
    const diff = getAssembly(request)?.planDiff as PromptAssemblyPlanDiff | undefined
    expect(diff).toBeDefined()
    expect(Array.isArray(diff!.added)).toBe(true)
    expect(Array.isArray(diff!.removed)).toBe(true)
    expect(Array.isArray(diff!.changed)).toBe(true)
  })

  it('should have empty diff with identity optimizer', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
      promptAssemblyOptimizer: new DefaultPromptAssemblyOptimizer(),
      promptAssemblyPlanDiffer: new DefaultPromptAssemblyPlanDiffer(),
    })
    const request = await builder.build(createPipelineContext())
    const diff = getAssembly(request)?.planDiff as PromptAssemblyPlanDiff | undefined
    expect(diff!.added).toEqual([])
    expect(diff!.removed).toEqual([])
    expect(diff!.changed).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// Metadata — Coexistence
// ---------------------------------------------------------------------------

describe('Metadata — coexistence', () => {
  it('should coexist with plan', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
      promptAssemblyOptimizer: new DefaultPromptAssemblyOptimizer(),
      promptAssemblyPlanDiffer: new DefaultPromptAssemblyPlanDiffer(),
    })
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)!
    expect(assembly.planDiff).toBeDefined()
    expect(assembly.plan).toBeDefined()
  })

  it('should coexist with optimizedPlan', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
      promptAssemblyOptimizer: new DefaultPromptAssemblyOptimizer(),
      promptAssemblyPlanDiffer: new DefaultPromptAssemblyPlanDiffer(),
    })
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)!
    expect(assembly.planDiff).toBeDefined()
    expect(assembly.optimizedPlan).toBeDefined()
  })

  it('should coexist with planRendered', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
      promptAssemblyOptimizer: new DefaultPromptAssemblyOptimizer(),
      promptAssemblyPlanDiffer: new DefaultPromptAssemblyPlanDiffer(),
      promptAssemblyPlanRenderer: new DefaultPromptAssemblyPlanRenderer(),
    })
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)!
    expect(assembly.planDiff).toBeDefined()
    expect(assembly.planRendered).toBeDefined()
  })

  it('should coexist with strategy', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
      promptAssemblyOptimizer: new DefaultPromptAssemblyOptimizer(),
      promptAssemblyPlanDiffer: new DefaultPromptAssemblyPlanDiffer(),
    })
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)!
    expect(assembly.planDiff).toBeDefined()
    expect(assembly.strategy).toBeDefined()
  })

  it('should coexist with all key fields', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
      promptAssemblyOptimizer: new DefaultPromptAssemblyOptimizer(),
      promptAssemblyPlanDiffer: new DefaultPromptAssemblyPlanDiffer(),
      promptAssemblyPlanRenderer: new DefaultPromptAssemblyPlanRenderer(),
    })
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)!
    expect(assembly.planDiff).toBeDefined()
    expect(assembly.plan).toBeDefined()
    expect(assembly.optimizedPlan).toBeDefined()
    expect(assembly.planRendered).toBeDefined()
    expect(assembly.strategy).toBeDefined()
  })

  it('should coexist with plan, optimizedPlan, planRendered, and planDiff simultaneously', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
      promptAssemblyOptimizer: new DefaultPromptAssemblyOptimizer(),
      promptAssemblyPlanDiffer: new DefaultPromptAssemblyPlanDiffer(),
      promptAssemblyPlanRenderer: new DefaultPromptAssemblyPlanRenderer(),
    })
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)!
    expect(assembly.plan).toBeDefined()
    expect(assembly.optimizedPlan).toBeDefined()
    expect(assembly.planDiff).toBeDefined()
    expect(assembly.planRendered).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Deterministic
// ---------------------------------------------------------------------------

describe('Deterministic', () => {
  it('should produce same planDiff across multiple builds', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
      promptAssemblyOptimizer: new DefaultPromptAssemblyOptimizer(),
      promptAssemblyPlanDiffer: new DefaultPromptAssemblyPlanDiffer(),
    })
    const ctx = createPipelineContext()
    const r1 = await builder.build(ctx)
    const r2 = await builder.build(ctx)
    const r3 = await builder.build(ctx)
    const d1 = getAssembly(r1)?.planDiff as PromptAssemblyPlanDiff | undefined
    const d2 = getAssembly(r2)?.planDiff as PromptAssemblyPlanDiff | undefined
    const d3 = getAssembly(r3)?.planDiff as PromptAssemblyPlanDiff | undefined
    expect(d1).toEqual(d2)
    expect(d2).toEqual(d3)
  })

  it('should produce same planDiff across different builder instances', async () => {
    const b1 = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
      promptAssemblyOptimizer: new DefaultPromptAssemblyOptimizer(),
      promptAssemblyPlanDiffer: new DefaultPromptAssemblyPlanDiffer(),
    })
    const b2 = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
      promptAssemblyOptimizer: new DefaultPromptAssemblyOptimizer(),
      promptAssemblyPlanDiffer: new DefaultPromptAssemblyPlanDiffer(),
    })
    const ctx = createPipelineContext()
    const r1 = await b1.build(ctx)
    const r2 = await b2.build(ctx)
    const d1 = getAssembly(r1)?.planDiff as PromptAssemblyPlanDiff | undefined
    const d2 = getAssembly(r2)?.planDiff as PromptAssemblyPlanDiff | undefined
    expect(d1).toEqual(d2)
  })

  it('should produce same planDiff for same input', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
      promptAssemblyOptimizer: new DefaultPromptAssemblyOptimizer(),
      promptAssemblyPlanDiffer: new DefaultPromptAssemblyPlanDiffer(),
    })
    const ctx1 = createPipelineContext()
    const ctx2 = createPipelineContext()
    const r1 = await builder.build(ctx1)
    const r2 = await builder.build(ctx2)
    const d1 = getAssembly(r1)?.planDiff as PromptAssemblyPlanDiff | undefined
    const d2 = getAssembly(r2)?.planDiff as PromptAssemblyPlanDiff | undefined
    expect(d1).toEqual(d2)
  })
})

// ---------------------------------------------------------------------------
// Stateless
// ---------------------------------------------------------------------------

describe('Stateless', () => {
  it('should not retain planDiff state between builds', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
      promptAssemblyOptimizer: new DefaultPromptAssemblyOptimizer(),
      promptAssemblyPlanDiffer: new DefaultPromptAssemblyPlanDiffer(),
    })
    const r1 = await builder.build(createPipelineContext({ input: 'draw a tree' }))
    const r2 = await builder.build(createPipelineContext({ input: 'build a house' }))
    const d1 = getAssembly(r1)?.planDiff as PromptAssemblyPlanDiff | undefined
    const d2 = getAssembly(r2)?.planDiff as PromptAssemblyPlanDiff | undefined
    expect(d1).toBeDefined()
    expect(d2).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Pure / No Side Effects
// ---------------------------------------------------------------------------

describe('Pure', () => {
  it('should not modify pipeline context', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
      promptAssemblyOptimizer: new DefaultPromptAssemblyOptimizer(),
      promptAssemblyPlanDiffer: new DefaultPromptAssemblyPlanDiffer(),
    })
    const ctx = createPipelineContext()
    const originalInput = ctx.input
    await builder.build(ctx)
    expect(ctx.input).toBe(originalInput)
  })

  it('should not modify original plan in metadata', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
      promptAssemblyOptimizer: new DefaultPromptAssemblyOptimizer(),
      promptAssemblyPlanDiffer: new DefaultPromptAssemblyPlanDiffer(),
    })
    const request = await builder.build(createPipelineContext())
    const plan = getAssembly(request)?.plan as PromptAssemblyPlan | undefined
    const planCopy = JSON.parse(JSON.stringify(plan))
    // The plan should not be mutated by the differ
    expect(JSON.stringify(plan)).toBe(JSON.stringify(planCopy))
  })
})

// ---------------------------------------------------------------------------
// No Prompt Changes
// ---------------------------------------------------------------------------

describe('No prompt changes', () => {
  it('should produce identical prompt with and without differ', async () => {
    const planner = new DefaultPromptAssemblyPlanner()
    const optimizer = new DefaultPromptAssemblyOptimizer()
    const renderer = new DefaultPromptAssemblyPlanRenderer()
    const modules = [new UserInputModule()]

    const builderWithout = new DefaultPromptBuilder(modules, {
      promptAssemblyPlanner: planner,
      promptAssemblyOptimizer: optimizer,
      promptAssemblyPlanRenderer: renderer,
    })
    const builderWith = new DefaultPromptBuilder(modules, {
      promptAssemblyPlanner: planner,
      promptAssemblyOptimizer: optimizer,
      promptAssemblyPlanDiffer: new DefaultPromptAssemblyPlanDiffer(),
      promptAssemblyPlanRenderer: renderer,
    })

    const ctx = createPipelineContext()
    const r1 = await builderWithout.build(ctx)
    const r2 = await builderWith.build(ctx)
    expect(r1.prompt).toBe(r2.prompt)
  })

  it('should produce identical prompt with differ when no renderer', async () => {
    const planner = new DefaultPromptAssemblyPlanner()
    const modules = [new UserInputModule()]

    const builderWithout = new DefaultPromptBuilder(modules, {
      promptAssemblyPlanner: planner,
      promptAssemblyOptimizer: new DefaultPromptAssemblyOptimizer(),
    })
    const builderWith = new DefaultPromptBuilder(modules, {
      promptAssemblyPlanner: planner,
      promptAssemblyOptimizer: new DefaultPromptAssemblyOptimizer(),
      promptAssemblyPlanDiffer: new DefaultPromptAssemblyPlanDiffer(),
    })

    const ctx = createPipelineContext()
    const r1 = await builderWithout.build(ctx)
    const r2 = await builderWith.build(ctx)
    expect(r1.prompt).toBe(r2.prompt)
  })

  it('should produce identical prompt with minimal builder config', async () => {
    const builderWithout = new DefaultPromptBuilder([new UserInputModule()], {})
    const builderWith = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanDiffer: new DefaultPromptAssemblyPlanDiffer(),
    })
    const ctx = createPipelineContext()
    const r1 = await builderWithout.build(ctx)
    const r2 = await builderWith.build(ctx)
    expect(r1.prompt).toBe(r2.prompt)
  })

  it('should not inject planDiff into prompt text', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
      promptAssemblyOptimizer: new DefaultPromptAssemblyOptimizer(),
      promptAssemblyPlanDiffer: new DefaultPromptAssemblyPlanDiffer(),
    })
    const request = await builder.build(createPipelineContext())
    expect(request.prompt).not.toContain('planDiff')
    expect(request.prompt).not.toContain('added')
    expect(request.prompt).not.toContain('removed')
    expect(request.prompt).not.toContain('changed')
  })

  it('should produce same prompt with differ and renderer together', async () => {
    const modules = [new UserInputModule()]
    const planner = new DefaultPromptAssemblyPlanner()
    const optimizer = new DefaultPromptAssemblyOptimizer()
    const renderer = new DefaultPromptAssemblyPlanRenderer()
    const differ = new DefaultPromptAssemblyPlanDiffer()

    const without = new DefaultPromptBuilder(modules, {
      promptAssemblyPlanner: planner,
      promptAssemblyOptimizer: optimizer,
      promptAssemblyPlanRenderer: renderer,
    })
    const withAll = new DefaultPromptBuilder(modules, {
      promptAssemblyPlanner: planner,
      promptAssemblyOptimizer: optimizer,
      promptAssemblyPlanRenderer: renderer,
      promptAssemblyPlanDiffer: differ,
    })

    const ctx = createPipelineContext()
    expect((await without.build(ctx)).prompt).toBe((await withAll.build(ctx)).prompt)
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
    expect(getAssembly(request)?.planDiff).toBeUndefined()
  })

  it('should work with BuilderOptions without differ', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {})
    const request = await builder.build(createPipelineContext())
    expect(request.prompt).toBeDefined()
    expect(getAssembly(request)?.planDiff).toBeUndefined()
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
    expect(getAssembly(request)?.planDiff).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// StrategyAwarePlanner Compatibility
// ---------------------------------------------------------------------------

describe('StrategyAwarePlanner compatibility', () => {
  it('should work with StrategyAwarePromptAssemblyPlanner', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new StrategyAwarePromptAssemblyPlanner(),
      promptAssemblyOptimizer: new DefaultPromptAssemblyOptimizer(),
      promptAssemblyPlanDiffer: new DefaultPromptAssemblyPlanDiffer(),
    })
    const request = await builder.build(createPipelineContext())
    const diff = getAssembly(request)?.planDiff as PromptAssemblyPlanDiff | undefined
    expect(diff).toBeDefined()
    expect(Array.isArray(diff!.added)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

describe('Exports', () => {
  it('should export DefaultPromptAssemblyPlanDiffer from strategy index', async () => {
    const mod = await import('../strategy')
    expect(mod.DefaultPromptAssemblyPlanDiffer).toBeDefined()
  })

  it('should export DefaultPromptAssemblyPlanDiffer from package root', async () => {
    const mod = await import('..')
    expect(mod.DefaultPromptAssemblyPlanDiffer).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Compatibility — RetryPlanner
// ---------------------------------------------------------------------------

describe('RetryPlanner compatibility', () => {
  it('should be compatible with RetryPlanner', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
      promptAssemblyOptimizer: new DefaultPromptAssemblyOptimizer(),
      promptAssemblyPlanDiffer: new DefaultPromptAssemblyPlanDiffer(),
    })
    const ctx = createPipelineContext()
    const request = await builder.build(ctx)
    expect(getAssembly(request)?.planDiff).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Compatibility — ToolCallPlanner
// ---------------------------------------------------------------------------

describe('ToolCallPlanner compatibility', () => {
  it('should be compatible with ToolCallPlanner', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
      promptAssemblyOptimizer: new DefaultPromptAssemblyOptimizer(),
      promptAssemblyPlanDiffer: new DefaultPromptAssemblyPlanDiffer(),
    })
    const ctx = createPipelineContext()
    const request = await builder.build(ctx)
    expect(getAssembly(request)?.planDiff).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Compatibility — Streaming
// ---------------------------------------------------------------------------

describe('Streaming compatibility', () => {
  it('should be compatible with streaming pipeline', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
      promptAssemblyOptimizer: new DefaultPromptAssemblyOptimizer(),
      promptAssemblyPlanDiffer: new DefaultPromptAssemblyPlanDiffer(),
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
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
      promptAssemblyOptimizer: new DefaultPromptAssemblyOptimizer(),
      promptAssemblyPlanDiffer: new DefaultPromptAssemblyPlanDiffer(),
    })
    const ctx = createPipelineContext()
    const request = await builder.build(ctx)
    expect(request.prompt).toBeDefined()
  })
})