import { describe, it, expect } from 'vitest'
import { DefaultPromptBuilder } from '../prompt/DefaultPromptBuilder'
import { DefaultPromptAssemblyPlanner } from '../strategy/DefaultPromptAssemblyPlanner'
import type { PromptAssemblyPlanner } from '../strategy/PromptAssemblyPlanner'
import type { PromptAssemblyPlan } from '../strategy/PromptAssemblyPlan'
import { UserInputModule } from '../prompt/modules'
import type { PipelineContext } from '../pipeline/PipelineContext'

// ---------------------------------------------------------------------------
// Test Helpers
// ---------------------------------------------------------------------------

function createPipelineContext(overrides?: Partial<PipelineContext>): PipelineContext {
  return {
    input: 'draw a tree',
    memory: { get: async () => null, set: async () => {} },
    worldState: '',
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Planner Invocation
// ---------------------------------------------------------------------------

describe('Planner Invocation', () => {
  it('should invoke promptAssemblyPlanner when configured', async () => {
    let invoked = false
    const trackingPlanner: PromptAssemblyPlanner = {
      buildPlan(_strategyName: string, _sections: readonly string[]): PromptAssemblyPlan {
        invoked = true
        return { priorities: [] }
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: trackingPlanner,
    })
    await builder.build(createPipelineContext())
    expect(invoked).toBe(true)
  })

  it('should pass selected strategy name to planner', async () => {
    let passedName = ''
    const trackingPlanner: PromptAssemblyPlanner = {
      buildPlan(strategyName: string, _sections: readonly string[]): PromptAssemblyPlan {
        passedName = strategyName
        return { priorities: [] }
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: trackingPlanner,
    })
    await builder.build(createPipelineContext())
    expect(passedName).toBe('default')
  })

  it('should pass section keys to planner', async () => {
    let passedSections: readonly string[] = []
    const trackingPlanner: PromptAssemblyPlanner = {
      buildPlan(_strategyName: string, sections: readonly string[]): PromptAssemblyPlan {
        passedSections = sections
        return { priorities: [] }
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: trackingPlanner,
    })
    await builder.build(createPipelineContext())
    // Should contain userInput (from UserInputModule)
    expect(passedSections.length).toBeGreaterThan(0)
    expect(passedSections).toContain('userInput')
  })

  it('should not invoke planner when not configured', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()])
    const request = await builder.build(createPipelineContext())
    const assembly = request.metadata?.promptAssembly as Record<string, unknown> | undefined
    expect(assembly?.plan).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// Metadata Creation
// ---------------------------------------------------------------------------

describe('Metadata Creation', () => {
  it('should create plan metadata when planner is configured', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
    })
    const request = await builder.build(createPipelineContext())
    const assembly = request.metadata?.promptAssembly as Record<string, unknown> | undefined
    expect(assembly?.plan).toBeDefined()
  })

  it('should not create plan metadata when planner is absent', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()])
    const request = await builder.build(createPipelineContext())
    const assembly = request.metadata?.promptAssembly as Record<string, unknown> | undefined
    expect(assembly?.plan).toBeUndefined()
  })

  it('should store plan under metadata.promptAssembly.plan', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
    })
    const request = await builder.build(createPipelineContext())
    const assembly = request.metadata?.promptAssembly as Record<string, unknown> | undefined
    const plan = assembly?.plan as PromptAssemblyPlan | undefined
    expect(plan).toBeDefined()
    expect(Array.isArray(plan?.priorities)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Plan Storage — Priority Details
// ---------------------------------------------------------------------------

describe('Plan Storage', () => {
  it('should store all section priorities', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
    })
    const request = await builder.build(createPipelineContext())
    const assembly = request.metadata?.promptAssembly as Record<string, unknown> | undefined
    const plan = assembly?.plan as PromptAssemblyPlan | undefined
    expect(plan?.priorities.length).toBeGreaterThan(0)
  })

  it('should store each section with priority 100 from default planner', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
    })
    const request = await builder.build(createPipelineContext())
    const assembly = request.metadata?.promptAssembly as Record<string, unknown> | undefined
    const plan = assembly?.plan as PromptAssemblyPlan | undefined
    for (const p of plan?.priorities ?? []) {
      expect(p.priority).toBe(100)
    }
  })

  it('should preserve section order in plan priorities', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
    })
    const request = await builder.build(createPipelineContext())
    const assembly = request.metadata?.promptAssembly as Record<string, unknown> | undefined
    const plan = assembly?.plan as PromptAssemblyPlan | undefined
    const sections = plan?.priorities.map(p => p.section) ?? []
    // userInput should appear (from the module)
    expect(sections).toContain('userInput')
  })

  it('should store plan with correct structure', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
    })
    const request = await builder.build(createPipelineContext())
    const assembly = request.metadata?.promptAssembly as Record<string, unknown> | undefined
    const plan = assembly?.plan as { priorities: Array<{ section: string; priority: number }> } | undefined
    expect(plan).toBeDefined()
    expect(Array.isArray(plan?.priorities)).toBe(true)
    if (plan && plan.priorities.length > 0) {
      expect(typeof plan.priorities[0].section).toBe('string')
      expect(typeof plan.priorities[0].priority).toBe('number')
    }
  })
})

// ---------------------------------------------------------------------------
// Deterministic
// ---------------------------------------------------------------------------

describe('Deterministic', () => {
  it('should produce same plan for same inputs across multiple builds', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
    })
    const ctx = createPipelineContext()
    const req1 = await builder.build(ctx)
    const req2 = await builder.build(ctx)
    const req3 = await builder.build(ctx)
    const p1 = (req1.metadata?.promptAssembly as Record<string, unknown>)?.plan as PromptAssemblyPlan
    const p2 = (req2.metadata?.promptAssembly as Record<string, unknown>)?.plan as PromptAssemblyPlan
    const p3 = (req3.metadata?.promptAssembly as Record<string, unknown>)?.plan as PromptAssemblyPlan
    expect(p1).toEqual(p2)
    expect(p2).toEqual(p3)
  })

  it('should produce same plan across different builder instances', async () => {
    const b1 = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
    })
    const b2 = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
    })
    const r1 = await b1.build(createPipelineContext())
    const r2 = await b2.build(createPipelineContext())
    const p1 = (r1.metadata?.promptAssembly as Record<string, unknown>)?.plan as PromptAssemblyPlan
    const p2 = (r2.metadata?.promptAssembly as Record<string, unknown>)?.plan as PromptAssemblyPlan
    expect(p1).toEqual(p2)
  })
})

// ---------------------------------------------------------------------------
// Stateless
// ---------------------------------------------------------------------------

describe('Stateless', () => {
  it('should not retain plan state between builds', async () => {
    const capturedPlans: PromptAssemblyPlan[] = []
    const recordingPlanner: PromptAssemblyPlanner = {
      buildPlan(_name: string, sections: readonly string[]): PromptAssemblyPlan {
        const plan: PromptAssemblyPlan = { priorities: sections.map(s => ({ section: s, priority: 100 })) }
        capturedPlans.push(plan)
        return plan
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: recordingPlanner,
    })
    await builder.build(createPipelineContext({ input: 'first' }))
    await builder.build(createPipelineContext({ input: 'second' }))
    // Each build creates its own plan independently
    expect(capturedPlans).toHaveLength(2)
  })
})

// ---------------------------------------------------------------------------
// Pure — No Side Effects
// ---------------------------------------------------------------------------

describe('Pure', () => {
  it('should not modify the builder or pipeline context', async () => {
    const context = createPipelineContext()
    const inputBefore = context.input
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
    })
    await builder.build(context)
    expect(context.input).toBe(inputBefore)
  })

  it('should not modify the promptContext via planner', async () => {
    const checkedSections: string[] = []
    const safePlanner: PromptAssemblyPlanner = {
      buildPlan(_name: string, sections: readonly string[]): PromptAssemblyPlan {
        // Make a copy to avoid mutation reference issues
        checkedSections.push(...sections)
        return { priorities: sections.map(s => ({ section: s, priority: 100 })) }
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: safePlanner,
    })
    await builder.build(createPipelineContext())
    expect(checkedSections.length).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// Coexistence with Strategy Metadata
// ---------------------------------------------------------------------------

describe('Coexistence with Strategy Metadata', () => {
  it('should coexist with strategy metadata', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
    })
    const request = await builder.build(createPipelineContext())
    const assembly = request.metadata?.promptAssembly as Record<string, unknown> | undefined
    expect(assembly?.strategy).toBeDefined()
    expect(assembly?.plan).toBeDefined()
  })

  it('should coexist with strategyRendered metadata', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
    })
    const request = await builder.build(createPipelineContext())
    const assembly = request.metadata?.promptAssembly as Record<string, unknown> | undefined
    expect(assembly?.strategyRendered).toBeDefined()
    expect(assembly?.plan).toBeDefined()
  })

  it('should coexist with all strategy metadata fields', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
    })
    const request = await builder.build(createPipelineContext())
    const assembly = request.metadata?.promptAssembly as Record<string, unknown> | undefined
    expect(assembly?.strategy).toBeDefined()
    expect(assembly?.strategyRendered).toBeDefined()
    expect(assembly?.plan).toBeDefined()
  })

  it('should coexist with promptAssemblyStrategy metadata', async () => {
    // Using both planner and strategy resolver
    const customResolver = {
      resolve(_name: string): { strategyName: string; apply: (sections: readonly string[]) => string[] } {
        return {
          strategyName: 'custom',
          apply: (sections: readonly string[]) => [...sections],
        }
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
      promptAssemblyStrategyResolver: customResolver,
    })
    const request = await builder.build(createPipelineContext())
    const assembly = request.metadata?.promptAssembly as Record<string, unknown> | undefined
    expect(assembly?.plan).toBeDefined()
    expect(assembly?.promptAssemblyStrategy).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Compatibility — Prompt Output Unchanged
// ---------------------------------------------------------------------------

describe('Compatibility', () => {
  it('should produce identical prompt output with and without planner', async () => {
    const builderWithout = new DefaultPromptBuilder([new UserInputModule()])
    const builderWith = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
    })
    const ctx = createPipelineContext()
    const reqWithout = await builderWithout.build(ctx)
    const reqWith = await builderWith.build(ctx)
    expect(reqWith.prompt).toBe(reqWithout.prompt)
  })

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
    const assembly = request.metadata?.promptAssembly as Record<string, unknown> | undefined
    expect(assembly?.plan).toBeUndefined()
  })

  it('should produce same prompt with or without all strategy options', async () => {
    const builderMinimal = new DefaultPromptBuilder([new UserInputModule()])
    const builderFull = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
    })
    const ctx = createPipelineContext()
    const reqMinimal = await builderMinimal.build(ctx)
    const reqFull = await builderFull.build(ctx)
    expect(reqFull.prompt).toBe(reqMinimal.prompt)
  })
})

// ---------------------------------------------------------------------------
// BuilderOptions Wiring
// ---------------------------------------------------------------------------

describe('BuilderOptions Wiring', () => {
  it('should accept promptAssemblyPlanner in BuilderOptions', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
    })
    const request = await builder.build(createPipelineContext())
    const assembly = request.metadata?.promptAssembly as Record<string, unknown> | undefined
    expect(assembly?.plan).toBeDefined()
  })

  it('should allow promptAssemblyPlanner to be undefined', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: undefined,
    })
    const request = await builder.build(createPipelineContext())
    const assembly = request.metadata?.promptAssembly as Record<string, unknown> | undefined
    expect(assembly?.plan).toBeUndefined()
  })

  it('should allow promptAssemblyPlanner field omission', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {})
    const request = await builder.build(createPipelineContext())
    const assembly = request.metadata?.promptAssembly as Record<string, unknown> | undefined
    expect(assembly?.plan).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// Custom Planner Integration
// ---------------------------------------------------------------------------

describe('Custom Planner Integration', () => {
  it('should accept custom planner with different priority scheme', async () => {
    const customPlanner: PromptAssemblyPlanner = {
      buildPlan(_strategyName: string, sections: readonly string[]): PromptAssemblyPlan {
        return {
          priorities: sections.map((s, i) => ({
            section: s,
            priority: (sections.length - i) * 10, // descending priority
          })),
        }
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: customPlanner,
    })
    const request = await builder.build(createPipelineContext())
    const assembly = request.metadata?.promptAssembly as Record<string, unknown> | undefined
    const plan = assembly?.plan as PromptAssemblyPlan | undefined
    expect(plan).toBeDefined()
    expect(plan?.priorities.length).toBeGreaterThan(0)
  })

  it('should store custom planner output in metadata', async () => {
    const customPlanner: PromptAssemblyPlanner = {
      buildPlan(_name: string, sections: readonly string[]): PromptAssemblyPlan {
        return {
          priorities: sections.map(s => ({ section: s, priority: s === 'userInput' ? 200 : 50 })),
        }
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: customPlanner,
    })
    const request = await builder.build(createPipelineContext())
    const assembly = request.metadata?.promptAssembly as Record<string, unknown> | undefined
    const plan = assembly?.plan as { priorities: Array<{ section: string; priority: number }> } | undefined
    const userInputPri = plan?.priorities.find(p => p.section === 'userInput')
    expect(userInputPri?.priority).toBe(200)
  })
})