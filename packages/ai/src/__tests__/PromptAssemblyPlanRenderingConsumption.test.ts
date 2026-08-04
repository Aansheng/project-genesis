import { describe, it, expect } from 'vitest'
import { DefaultPromptBuilder } from '../prompt/DefaultPromptBuilder'
import { DefaultPromptAssemblyPlanner } from '../strategy/DefaultPromptAssemblyPlanner'
import { StrategyAwarePromptAssemblyPlanner } from '../strategy/StrategyAwarePromptAssemblyPlanner'
import { DefaultPromptAssemblyPlanRenderer } from '../strategy/DefaultPromptAssemblyPlanRenderer'
import type { PromptAssemblyPlanRenderer } from '../strategy/PromptAssemblyPlanRenderer'
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
  it('should accept promptAssemblyPlanRenderer field', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
      promptAssemblyPlanRenderer: new DefaultPromptAssemblyPlanRenderer(),
    })
    const request = await builder.build(createPipelineContext())
    expect(getAssembly(request)?.planRendered).toBeDefined()
  })

  it('should allow promptAssemblyPlanRenderer to be undefined', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
      promptAssemblyPlanRenderer: undefined,
    })
    const request = await builder.build(createPipelineContext())
    expect(getAssembly(request)?.planRendered).toBeUndefined()
  })

  it('should allow promptAssemblyPlanRenderer field omission', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
    })
    const request = await builder.build(createPipelineContext())
    expect(getAssembly(request)?.planRendered).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// Renderer Invocation
// ---------------------------------------------------------------------------

describe('Renderer invocation', () => {
  it('should invoke promptAssemblyPlanRenderer when configured', async () => {
    let invoked = false
    const trackingRenderer: PromptAssemblyPlanRenderer = {
      render(_plan: PromptAssemblyPlan): string {
        invoked = true
        return 'rendered'
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
      promptAssemblyPlanRenderer: trackingRenderer,
    })
    await builder.build(createPipelineContext())
    expect(invoked).toBe(true)
  })

  it('should not invoke renderer when no planner is configured', async () => {
    let invoked = false
    const trackingRenderer: PromptAssemblyPlanRenderer = {
      render(_plan: PromptAssemblyPlan): string {
        invoked = true
        return 'rendered'
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanRenderer: trackingRenderer,
      // No planner → no plan → renderer not called
    })
    await builder.build(createPipelineContext())
    expect(invoked).toBe(false)
  })

  it('should pass the generated plan to the renderer', async () => {
    let receivedPlan: PromptAssemblyPlan | undefined
    const trackingRenderer: PromptAssemblyPlanRenderer = {
      render(plan: PromptAssemblyPlan): string {
        receivedPlan = plan
        return 'rendered'
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
      promptAssemblyPlanRenderer: trackingRenderer,
    })
    await builder.build(createPipelineContext())
    expect(receivedPlan).toBeDefined()
    expect(Array.isArray(receivedPlan?.priorities)).toBe(true)
  })

  it('should store renderer output in planRendered metadata', async () => {
    const customRenderer: PromptAssemblyPlanRenderer = {
      render(_plan: PromptAssemblyPlan): string {
        return 'CUSTOM-RENDERED'
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
      promptAssemblyPlanRenderer: customRenderer,
    })
    const request = await builder.build(createPipelineContext())
    expect(getAssembly(request)?.planRendered).toBe('CUSTOM-RENDERED')
  })
})

// ---------------------------------------------------------------------------
// Metadata Creation
// ---------------------------------------------------------------------------

describe('Metadata creation', () => {
  it('should create planRendered metadata when renderer and planner are configured', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
      promptAssemblyPlanRenderer: new DefaultPromptAssemblyPlanRenderer(),
    })
    const request = await builder.build(createPipelineContext())
    expect(getAssembly(request)?.planRendered).toBeDefined()
  })

  it('should not create planRendered metadata when renderer is absent', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
    })
    const request = await builder.build(createPipelineContext())
    expect(getAssembly(request)?.planRendered).toBeUndefined()
  })

  it('should not create planRendered metadata when planner is absent', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanRenderer: new DefaultPromptAssemblyPlanRenderer(),
    })
    const request = await builder.build(createPipelineContext())
    expect(getAssembly(request)?.planRendered).toBeUndefined()
  })

  it('should not create planRendered metadata when neither is configured', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()])
    const request = await builder.build(createPipelineContext())
    expect(getAssembly(request)?.planRendered).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// Metadata Content
// ---------------------------------------------------------------------------

describe('Metadata content', () => {
  it('should store rendered output as string', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
      promptAssemblyPlanRenderer: new DefaultPromptAssemblyPlanRenderer(),
    })
    const request = await builder.build(createPipelineContext())
    expect(typeof getAssembly(request)?.planRendered).toBe('string')
  })

  it('should include "Prompt Assembly Plan" header in rendered output', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
      promptAssemblyPlanRenderer: new DefaultPromptAssemblyPlanRenderer(),
    })
    const request = await builder.build(createPipelineContext())
    expect(getAssembly(request)?.planRendered).toContain('Prompt Assembly Plan')
  })

  it('should include section entries in rendered output', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
      promptAssemblyPlanRenderer: new DefaultPromptAssemblyPlanRenderer(),
    })
    const request = await builder.build(createPipelineContext())
    const rendered = getAssembly(request)?.planRendered as string | undefined
    expect(rendered).toContain('userInput')
  })

  it('should coexist with plan metadata', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
      promptAssemblyPlanRenderer: new DefaultPromptAssemblyPlanRenderer(),
    })
    const request = await builder.build(createPipelineContext())
    expect(getAssembly(request)?.plan).toBeDefined()
    expect(getAssembly(request)?.planRendered).toBeDefined()
  })

  it('should work with StrategyAwarePromptAssemblyPlanner', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new StrategyAwarePromptAssemblyPlanner(),
      promptAssemblyPlanRenderer: new DefaultPromptAssemblyPlanRenderer(),
    })
    const request = await builder.build(createPipelineContext())
    expect(getAssembly(request)?.planRendered).toBeDefined()
  })

  it('should render numbered sections from plan', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
      promptAssemblyPlanRenderer: new DefaultPromptAssemblyPlanRenderer(),
    })
    const request = await builder.build(createPipelineContext())
    const rendered = getAssembly(request)?.planRendered as string | undefined
    expect(rendered).toMatch(/\d+\.\s+\S+/) // at least one numbered entry
  })

  it('should render with priority values in parentheses', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
      promptAssemblyPlanRenderer: new DefaultPromptAssemblyPlanRenderer(),
    })
    const request = await builder.build(createPipelineContext())
    const rendered = getAssembly(request)?.planRendered as string | undefined
    expect(rendered).toMatch(/\(\d+\)/) // at least one priority value in parens
  })
})

// ---------------------------------------------------------------------------
// Metadata Coexistence
// ---------------------------------------------------------------------------

describe('Metadata coexistence', () => {
  it('should coexist with strategy metadata', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
      promptAssemblyPlanRenderer: new DefaultPromptAssemblyPlanRenderer(),
    })
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.strategy).toBeDefined()
    expect(assembly?.planRendered).toBeDefined()
  })

  it('should coexist with strategyRendered metadata', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
      promptAssemblyPlanRenderer: new DefaultPromptAssemblyPlanRenderer(),
    })
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.strategyRendered).toBeDefined()
    expect(assembly?.planRendered).toBeDefined()
  })

  it('should coexist with strategySelection metadata', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
      promptAssemblyPlanRenderer: new DefaultPromptAssemblyPlanRenderer(),
    })
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.planRendered).toBeDefined()
  })

  it('should coexist with all strategy-related metadata', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
      promptAssemblyPlanRenderer: new DefaultPromptAssemblyPlanRenderer(),
    })
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    expect(assembly?.strategy).toBeDefined()
    expect(assembly?.strategyRendered).toBeDefined()
    expect(assembly?.plan).toBeDefined()
    expect(assembly?.planRendered).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Deterministic
// ---------------------------------------------------------------------------

describe('Deterministic', () => {
  it('should produce same planRendered for same inputs across multiple builds', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
      promptAssemblyPlanRenderer: new DefaultPromptAssemblyPlanRenderer(),
    })
    const ctx = createPipelineContext()
    const r1 = await builder.build(ctx)
    const r2 = await builder.build(ctx)
    const r3 = await builder.build(ctx)
    expect(getAssembly(r1)?.planRendered).toBe(getAssembly(r2)?.planRendered)
    expect(getAssembly(r2)?.planRendered).toBe(getAssembly(r3)?.planRendered)
  })

  it('should produce same planRendered across different builder instances', async () => {
    const b1 = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
      promptAssemblyPlanRenderer: new DefaultPromptAssemblyPlanRenderer(),
    })
    const b2 = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
      promptAssemblyPlanRenderer: new DefaultPromptAssemblyPlanRenderer(),
    })
    const r1 = await b1.build(createPipelineContext())
    const r2 = await b2.build(createPipelineContext())
    expect(getAssembly(r1)?.planRendered).toBe(getAssembly(r2)?.planRendered)
  })

  it('should produce same planRendered for same input across consecutive builds', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
      promptAssemblyPlanRenderer: new DefaultPromptAssemblyPlanRenderer(),
    })
    const ctx = createPipelineContext()
    const results = await Promise.all([
      builder.build(ctx),
      builder.build(ctx),
      builder.build(ctx),
    ])
    const rendered = results.map(r => getAssembly(r)?.planRendered)
    expect(rendered[0]).toBe(rendered[1])
    expect(rendered[1]).toBe(rendered[2])
  })
})

// ---------------------------------------------------------------------------
// Stateless
// ---------------------------------------------------------------------------

describe('Stateless', () => {
  it('should not retain planRendered state between builds', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
      promptAssemblyPlanRenderer: new DefaultPromptAssemblyPlanRenderer(),
    })
    const r1 = await builder.build(createPipelineContext({ input: 'first' }))
    const r2 = await builder.build(createPipelineContext({ input: 'second' }))
    // Both produce planRendered independently
    expect(getAssembly(r1)?.planRendered).toBeDefined()
    expect(getAssembly(r2)?.planRendered).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Pure
// ---------------------------------------------------------------------------

describe('Pure', () => {
  it('should not modify pipeline context', async () => {
    const context = createPipelineContext()
    const inputBefore = context.input
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
      promptAssemblyPlanRenderer: new DefaultPromptAssemblyPlanRenderer(),
    })
    await builder.build(context)
    expect(context.input).toBe(inputBefore)
  })

  it('should not modify the plan via renderer', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
      promptAssemblyPlanRenderer: new DefaultPromptAssemblyPlanRenderer(),
    })
    const request = await builder.build(createPipelineContext())
    const plan = getAssembly(request)?.plan as PromptAssemblyPlan | undefined
    expect(Array.isArray(plan?.priorities)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// No Prompt Changes
// ---------------------------------------------------------------------------

describe('No prompt changes', () => {
  it('should produce identical prompt with and without renderer', async () => {
    const builderWithout = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
    })
    const builderWith = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
      promptAssemblyPlanRenderer: new DefaultPromptAssemblyPlanRenderer(),
    })
    const ctx = createPipelineContext()
    const reqWithout = await builderWithout.build(ctx)
    const reqWith = await builderWith.build(ctx)
    expect(reqWith.prompt).toBe(reqWithout.prompt)
  })

  it('should produce identical prompt with and without all plan config', async () => {
    const builderMinimal = new DefaultPromptBuilder([new UserInputModule()])
    const builderFull = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
      promptAssemblyPlanRenderer: new DefaultPromptAssemblyPlanRenderer(),
    })
    const ctx = createPipelineContext()
    const reqMinimal = await builderMinimal.build(ctx)
    const reqFull = await builderFull.build(ctx)
    expect(reqFull.prompt).toBe(reqMinimal.prompt)
  })

  it('should not contain planRendered content in prompt text', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
      promptAssemblyPlanRenderer: new DefaultPromptAssemblyPlanRenderer(),
    })
    const request = await builder.build(createPipelineContext())
    expect(request.prompt).not.toContain('Prompt Assembly Plan')
  })
})

// ---------------------------------------------------------------------------
// Custom Renderer Integration
// ---------------------------------------------------------------------------

describe('Custom renderer integration', () => {
  it('should accept a custom renderer with custom output', async () => {
    const customRenderer: PromptAssemblyPlanRenderer = {
      render(plan: PromptAssemblyPlan): string {
        return `Custom:${plan.priorities.length}`
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
      promptAssemblyPlanRenderer: customRenderer,
    })
    const request = await builder.build(createPipelineContext())
    const rendered = getAssembly(request)?.planRendered as string | undefined
    expect(rendered).toMatch(/^Custom:\d+$/)
  })
})

// ---------------------------------------------------------------------------
// Legacy Constructor Compatibility
// ---------------------------------------------------------------------------

describe('Legacy constructor compatibility', () => {
  it('should work with legacy positional constructor', async () => {
    const builder = new DefaultPromptBuilder(
      [new UserInputModule()],
      undefined,  // renderer
      undefined,  // compression
      undefined,  // ranking
      undefined,  // budget
      undefined,  // selection
      undefined,  // providerBudget
      undefined,  // configuration
    )
    const request = await builder.build(createPipelineContext())
    expect(request.prompt).toBeDefined()
    expect(getAssembly(request)?.planRendered).toBeUndefined()
  })

  it('should work with BuilderOptions and produce planRendered', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
      promptAssemblyPlanRenderer: new DefaultPromptAssemblyPlanRenderer(),
    })
    const request = await builder.build(createPipelineContext())
    expect(getAssembly(request)?.planRendered).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// RetryPlanner Compatibility
// ---------------------------------------------------------------------------

describe('RetryPlanner compatibility', () => {
  it('should work with RetryPlanner', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
      promptAssemblyPlanRenderer: new DefaultPromptAssemblyPlanRenderer(),
    })
    const request = await builder.build(createPipelineContext())
    expect(getAssembly(request)?.planRendered).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// ToolCallPlanner Compatibility
// ---------------------------------------------------------------------------

describe('ToolCallPlanner compatibility', () => {
  it('should work with ToolCallPlanner', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
      promptAssemblyPlanRenderer: new DefaultPromptAssemblyPlanRenderer(),
    })
    const request = await builder.build(createPipelineContext())
    expect(getAssembly(request)?.planRendered).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Streaming Compatibility
// ---------------------------------------------------------------------------

describe('Streaming compatibility', () => {
  it('should work with streaming pipeline', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
      promptAssemblyPlanRenderer: new DefaultPromptAssemblyPlanRenderer(),
    })
    const request = await builder.build(createPipelineContext())
    expect(getAssembly(request)?.planRendered).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// AgentLoop Compatibility
// ---------------------------------------------------------------------------

describe('AgentLoop compatibility', () => {
  it('should work with AgentLoop', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
      promptAssemblyPlanRenderer: new DefaultPromptAssemblyPlanRenderer(),
    })
    const request = await builder.build(createPipelineContext())
    expect(getAssembly(request)?.planRendered).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

describe('Exports', () => {
  it('should export DefaultPromptAssemblyPlanRenderer from package root', async () => {
    const mod = await import('..')
    expect(mod.DefaultPromptAssemblyPlanRenderer).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Edge Cases
// ---------------------------------------------------------------------------

describe('Edge cases', () => {
  it('should handle empty plan gracefully', async () => {
    const emptyPlanRenderer: PromptAssemblyPlanRenderer = {
      render(_plan: PromptAssemblyPlan): string {
        return 'Prompt Assembly Plan\n\n(no sections)'
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
      promptAssemblyPlanRenderer: emptyPlanRenderer,
    })
    const request = await builder.build(createPipelineContext())
    expect(getAssembly(request)?.planRendered).toBe('Prompt Assembly Plan\n\n(no sections)')
  })

  it('should not render when plan is undefined even if renderer exists', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanRenderer: new DefaultPromptAssemblyPlanRenderer(),
    })
    const request = await builder.build(createPipelineContext())
    expect(getAssembly(request)?.planRendered).toBeUndefined()
  })
})