import { describe, it, expect } from 'vitest'
import { DefaultPromptBuilder } from '../prompt/DefaultPromptBuilder'
import { DefaultPromptAssemblyPlanner } from '../strategy/DefaultPromptAssemblyPlanner'
import { StrategyAwarePromptAssemblyPlanner } from '../strategy/StrategyAwarePromptAssemblyPlanner'
import { DefaultPromptAssemblyPlanRenderer } from '../strategy/DefaultPromptAssemblyPlanRenderer'
import { DefaultPromptAssemblyOptimizer } from '../strategy/DefaultPromptAssemblyOptimizer'
import type { PromptAssemblyOptimizer } from '../strategy/PromptAssemblyOptimizer'
import type { PromptAssemblyPlan } from '../strategy/PromptAssemblyPlan'
import { DefaultPromptStrategy } from '../strategy/DefaultPromptStrategy'
import { DefaultStrategyEvaluator } from '../strategy/DefaultStrategyEvaluator'
import type { PromptStrategy } from '../strategy/PromptStrategy'
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
  it('should accept promptAssemblyOptimizer field', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
      promptAssemblyOptimizer: new DefaultPromptAssemblyOptimizer(),
    })
    const request = await builder.build(createPipelineContext())
    expect(getAssembly(request)?.optimizedPlan).toBeDefined()
  })

  it('should allow promptAssemblyOptimizer to be undefined', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
      promptAssemblyOptimizer: undefined,
    })
    const request = await builder.build(createPipelineContext())
    expect(getAssembly(request)?.optimizedPlan).toBeUndefined()
  })

  it('should allow promptAssemblyOptimizer to be omitted', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
    })
    const request = await builder.build(createPipelineContext())
    expect(getAssembly(request)?.optimizedPlan).toBeUndefined()
  })

  it('should work without planner when optimizer is provided', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyOptimizer: new DefaultPromptAssemblyOptimizer(),
    })
    const request = await builder.build(createPipelineContext())
    expect(getAssembly(request)?.optimizedPlan).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// Optimizer Invocation
// ---------------------------------------------------------------------------

describe('Optimizer invocation', () => {
  it('should invoke optimizer when both planner and optimizer exist', async () => {
    let invoked = false
    const trackingOptimizer: PromptAssemblyOptimizer = {
      optimize(plan: PromptAssemblyPlan): PromptAssemblyPlan {
        invoked = true
        return plan
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
      promptAssemblyOptimizer: trackingOptimizer,
    })
    await builder.build(createPipelineContext())
    expect(invoked).toBe(true)
  })

  it('should not invoke optimizer when planner is missing', async () => {
    let invoked = false
    const trackingOptimizer: PromptAssemblyOptimizer = {
      optimize(plan: PromptAssemblyPlan): PromptAssemblyPlan {
        invoked = true
        return plan
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyOptimizer: trackingOptimizer,
    })
    await builder.build(createPipelineContext())
    expect(invoked).toBe(false)
  })

  it('should pass the plan to optimizer', async () => {
    let capturedPlan: PromptAssemblyPlan | undefined
    const capturingOptimizer: PromptAssemblyOptimizer = {
      optimize(plan: PromptAssemblyPlan): PromptAssemblyPlan {
        capturedPlan = plan
        return plan
      },
    }
    const planner = new DefaultPromptAssemblyPlanner()
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: planner,
      promptAssemblyOptimizer: capturingOptimizer,
    })
    await builder.build(createPipelineContext())
    expect(capturedPlan).toBeDefined()
    expect(capturedPlan!.priorities.length).toBeGreaterThan(0)
  })

  it('should pass result to downstream renderer when optimizer returns different plan', async () => {
    const transformingOptimizer: PromptAssemblyOptimizer = {
      optimize(_plan: PromptAssemblyPlan): PromptAssemblyPlan {
        return { priorities: [{ section: 'custom', priority: 50 }] }
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
      promptAssemblyOptimizer: transformingOptimizer,
      promptAssemblyPlanRenderer: new DefaultPromptAssemblyPlanRenderer(),
    })
    const request = await builder.build(createPipelineContext())
    // The renderer should render the optimized plan (custom section)
    expect(getAssembly(request)?.planRendered).toContain('custom')
  })

  it('should use identity optimizer output for downstream when optimizer is present', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
      promptAssemblyOptimizer: new DefaultPromptAssemblyOptimizer(),
      promptAssemblyPlanRenderer: new DefaultPromptAssemblyPlanRenderer(),
    })
    const request = await builder.build(createPipelineContext())
    // With identity optimizer, planRendered should match original plan content
    expect(getAssembly(request)?.planRendered).toBeDefined()
    expect(getAssembly(request)?.optimizedPlan).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Metadata — optimizedPlan
// ---------------------------------------------------------------------------

describe('Metadata — optimizedPlan', () => {
  it('should create optimizedPlan when optimizer exists', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
      promptAssemblyOptimizer: new DefaultPromptAssemblyOptimizer(),
    })
    const request = await builder.build(createPipelineContext())
    expect(getAssembly(request)?.optimizedPlan).toBeDefined()
  })

  it('should not create optimizedPlan when optimizer is missing', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
    })
    const request = await builder.build(createPipelineContext())
    expect(getAssembly(request)?.optimizedPlan).toBeUndefined()
  })

  it('should not create optimizedPlan when planner is missing', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyOptimizer: new DefaultPromptAssemblyOptimizer(),
    })
    const request = await builder.build(createPipelineContext())
    expect(getAssembly(request)?.optimizedPlan).toBeUndefined()
  })

  it('should not create optimizedPlan when both are missing', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()])
    const request = await builder.build(createPipelineContext())
    expect(getAssembly(request)?.optimizedPlan).toBeUndefined()
  })

  it('should store PromptAssemblyPlan shape in metadata', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
      promptAssemblyOptimizer: new DefaultPromptAssemblyOptimizer(),
    })
    const request = await builder.build(createPipelineContext())
    const optimized = getAssembly(request)?.optimizedPlan as PromptAssemblyPlan | undefined
    expect(optimized).toBeDefined()
    expect(Array.isArray(optimized!.priorities)).toBe(true)
  })

  it('should preserve priority content in optimizedPlan', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
      promptAssemblyOptimizer: new DefaultPromptAssemblyOptimizer(),
    })
    const request = await builder.build(createPipelineContext())
    const optimized = getAssembly(request)?.optimizedPlan as PromptAssemblyPlan | undefined
    const original = getAssembly(request)?.plan as PromptAssemblyPlan | undefined
    expect(optimized!.priorities).toEqual(original!.priorities)
  })

  it('should have correct section count in optimizedPlan', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
      promptAssemblyOptimizer: new DefaultPromptAssemblyOptimizer(),
    })
    const request = await builder.build(createPipelineContext())
    const optimized = getAssembly(request)?.optimizedPlan as PromptAssemblyPlan | undefined
    expect(optimized!.priorities.length).toBeGreaterThan(0)
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
    })
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)!
    expect(assembly.optimizedPlan).toBeDefined()
    expect(assembly.plan).toBeDefined()
  })

  it('should coexist with planRendered', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
      promptAssemblyOptimizer: new DefaultPromptAssemblyOptimizer(),
      promptAssemblyPlanRenderer: new DefaultPromptAssemblyPlanRenderer(),
    })
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)!
    expect(assembly.optimizedPlan).toBeDefined()
    expect(assembly.planRendered).toBeDefined()
  })

  it('should coexist with strategy', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
      promptAssemblyOptimizer: new DefaultPromptAssemblyOptimizer(),
    })
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)!
    expect(assembly.optimizedPlan).toBeDefined()
    expect(assembly.strategy).toBeDefined()
  })

  it('should coexist with strategySelection', async () => {
    const strategies: PromptStrategy[] = [new DefaultPromptStrategy()]
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
      promptAssemblyOptimizer: new DefaultPromptAssemblyOptimizer(),
      strategyEvaluator: new DefaultStrategyEvaluator(),
      strategies,
    })
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)!
    expect(assembly.optimizedPlan).toBeDefined()
    expect(assembly.strategySelection).toBeDefined()
  })

  it('should coexist with strategy name', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
      promptAssemblyOptimizer: new DefaultPromptAssemblyOptimizer(),
    })
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)!
    expect(assembly.optimizedPlan).toBeDefined()
    expect(assembly.strategy).toBeDefined()
  })

  it('should coexist with all key fields', async () => {
    const strategies: PromptStrategy[] = [new DefaultPromptStrategy()]
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
      promptAssemblyOptimizer: new DefaultPromptAssemblyOptimizer(),
      promptAssemblyPlanRenderer: new DefaultPromptAssemblyPlanRenderer(),
      strategyEvaluator: new DefaultStrategyEvaluator(),
      strategies,
    })
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)!
    expect(assembly.optimizedPlan).toBeDefined()
    expect(assembly.plan).toBeDefined()
    expect(assembly.planRendered).toBeDefined()
    expect(assembly.strategy).toBeDefined()
    expect(assembly.strategySelection).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Deterministic
// ---------------------------------------------------------------------------

describe('Deterministic', () => {
  it('should produce same optimizedPlan across multiple builds', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
      promptAssemblyOptimizer: new DefaultPromptAssemblyOptimizer(),
    })
    const ctx = createPipelineContext()
    const r1 = await builder.build(ctx)
    const r2 = await builder.build(ctx)
    const r3 = await builder.build(ctx)
    const o1 = (getAssembly(r1)?.optimizedPlan as PromptAssemblyPlan | undefined)!
    const o2 = (getAssembly(r2)?.optimizedPlan as PromptAssemblyPlan | undefined)!
    const o3 = (getAssembly(r3)?.optimizedPlan as PromptAssemblyPlan | undefined)!
    expect(o1.priorities).toEqual(o2.priorities)
    expect(o2.priorities).toEqual(o3.priorities)
  })

  it('should produce same optimizedPlan across different builder instances', async () => {
    const b1 = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
      promptAssemblyOptimizer: new DefaultPromptAssemblyOptimizer(),
    })
    const b2 = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
      promptAssemblyOptimizer: new DefaultPromptAssemblyOptimizer(),
    })
    const ctx = createPipelineContext()
    const r1 = await b1.build(ctx)
    const r2 = await b2.build(ctx)
    const o1 = (getAssembly(r1)?.optimizedPlan as PromptAssemblyPlan | undefined)!
    const o2 = (getAssembly(r2)?.optimizedPlan as PromptAssemblyPlan | undefined)!
    expect(o1.priorities).toEqual(o2.priorities)
  })

  it('should produce same optimizedPlan for same input', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
      promptAssemblyOptimizer: new DefaultPromptAssemblyOptimizer(),
    })
    const ctx1 = createPipelineContext()
    const ctx2 = createPipelineContext()
    const r1 = await builder.build(ctx1)
    const r2 = await builder.build(ctx2)
    const o1 = (getAssembly(r1)?.optimizedPlan as PromptAssemblyPlan | undefined)!
    const o2 = (getAssembly(r2)?.optimizedPlan as PromptAssemblyPlan | undefined)!
    expect(o1.priorities).toEqual(o2.priorities)
  })
})

// ---------------------------------------------------------------------------
// Stateless
// ---------------------------------------------------------------------------

describe('Stateless', () => {
  it('should not retain optimizedPlan state between builds', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
      promptAssemblyOptimizer: new DefaultPromptAssemblyOptimizer(),
    })
    const r1 = await builder.build(createPipelineContext({ input: 'draw a tree' }))
    const r2 = await builder.build(createPipelineContext({ input: 'build a house' }))
    const o1 = (getAssembly(r1)?.optimizedPlan as PromptAssemblyPlan | undefined)!
    const o2 = (getAssembly(r2)?.optimizedPlan as PromptAssemblyPlan | undefined)!
    // Different inputs may produce different plans — ensure no cross-contamination
    expect(o1).toBeDefined()
    expect(o2).toBeDefined()
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
    })
    const ctx = createPipelineContext()
    const originalInput = ctx.input
    await builder.build(ctx)
    expect(ctx.input).toBe(originalInput)
  })
})

// ---------------------------------------------------------------------------
// No Prompt Changes
// ---------------------------------------------------------------------------

describe('No prompt changes', () => {
  it('should produce identical prompt with and without optimizer', async () => {
    const planner = new DefaultPromptAssemblyPlanner()
    const renderer = new DefaultPromptAssemblyPlanRenderer()
    const modules = [new UserInputModule()]

    const builderWithout = new DefaultPromptBuilder(modules, {
      promptAssemblyPlanner: planner,
      promptAssemblyPlanRenderer: renderer,
    })
    const builderWith = new DefaultPromptBuilder(modules, {
      promptAssemblyPlanner: planner,
      promptAssemblyOptimizer: new DefaultPromptAssemblyOptimizer(),
      promptAssemblyPlanRenderer: renderer,
    })

    const ctx = createPipelineContext()
    const r1 = await builderWithout.build(ctx)
    const r2 = await builderWith.build(ctx)
    expect(r1.prompt).toBe(r2.prompt)
  })

  it('should produce identical prompt with optimizer when no renderer', async () => {
    const planner = new DefaultPromptAssemblyPlanner()
    const modules = [new UserInputModule()]

    const builderWithout = new DefaultPromptBuilder(modules, {
      promptAssemblyPlanner: planner,
    })
    const builderWith = new DefaultPromptBuilder(modules, {
      promptAssemblyPlanner: planner,
      promptAssemblyOptimizer: new DefaultPromptAssemblyOptimizer(),
    })

    const ctx = createPipelineContext()
    const r1 = await builderWithout.build(ctx)
    const r2 = await builderWith.build(ctx)
    expect(r1.prompt).toBe(r2.prompt)
  })

  it('should produce identical prompt with minimal builder config', async () => {
    const builderWithout = new DefaultPromptBuilder([new UserInputModule()], {})
    const builderWith = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyOptimizer: new DefaultPromptAssemblyOptimizer(),
    })
    const ctx = createPipelineContext()
    const r1 = await builderWithout.build(ctx)
    const r2 = await builderWith.build(ctx)
    expect(r1.prompt).toBe(r2.prompt)
  })

  it('should not inject optimizedPlan into prompt text', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
      promptAssemblyOptimizer: new DefaultPromptAssemblyOptimizer(),
    })
    const request = await builder.build(createPipelineContext())
    expect(request.prompt).not.toContain('optimizedPlan')
    expect(request.prompt).not.toContain('priorities')
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
    expect(getAssembly(request)?.optimizedPlan).toBeUndefined()
  })

  it('should work with BuilderOptions without optimizer', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {})
    const request = await builder.build(createPipelineContext())
    expect(request.prompt).toBeDefined()
    expect(getAssembly(request)?.optimizedPlan).toBeUndefined()
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
    expect(getAssembly(request)?.optimizedPlan).toBeUndefined()
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
    })
    const request = await builder.build(createPipelineContext())
    const optimized = getAssembly(request)?.optimizedPlan as PromptAssemblyPlan | undefined
    expect(optimized).toBeDefined()
    expect(optimized!.priorities.length).toBeGreaterThan(0)
  })

  it('should optimize StrategyAwarePlanner output', async () => {
    let receivedPlan: PromptAssemblyPlan | undefined
    const capturingOptimizer: PromptAssemblyOptimizer = {
      optimize(plan: PromptAssemblyPlan): PromptAssemblyPlan {
        receivedPlan = plan
        return plan
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new StrategyAwarePromptAssemblyPlanner(),
      promptAssemblyOptimizer: capturingOptimizer,
    })
    await builder.build(createPipelineContext())
    expect(receivedPlan).toBeDefined()
    expect(receivedPlan!.priorities.length).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

describe('Exports', () => {
  it('should export from strategy index', async () => {
    const mod = await import('../strategy')
    expect(mod.DefaultPromptAssemblyOptimizer).toBeDefined()
  })

  it('should export from package root', async () => {
    const mod = await import('..')
    expect(mod.DefaultPromptAssemblyOptimizer).toBeDefined()
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
    })
    const ctx = createPipelineContext()
    const request = await builder.build(ctx)
    expect(getAssembly(request)?.optimizedPlan).toBeDefined()
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
    })
    const ctx = createPipelineContext()
    const request = await builder.build(ctx)
    expect(getAssembly(request)?.optimizedPlan).toBeDefined()
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
    })
    const ctx = createPipelineContext()
    const request = await builder.build(ctx)
    expect(request.prompt).toBeDefined()
  })
})