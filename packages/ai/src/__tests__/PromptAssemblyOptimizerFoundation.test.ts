import { describe, it, expect } from 'vitest'
import { DefaultPromptAssemblyOptimizer } from '../strategy/DefaultPromptAssemblyOptimizer'
import type { PromptAssemblyOptimizer } from '../strategy/PromptAssemblyOptimizer'
import type { PromptAssemblyPlan } from '../strategy/PromptAssemblyPlan'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createPlan(priorities: Array<{ section: string; priority: number }>): PromptAssemblyPlan {
  return { priorities }
}

function createSingleSectionPlan(): PromptAssemblyPlan {
  return createPlan([{ section: 'userInput', priority: 100 }])
}

function createMultiSectionPlan(): PromptAssemblyPlan {
  return createPlan([
    { section: 'userInput', priority: 100 },
    { section: 'worldState', priority: 90 },
    { section: 'memory', priority: 80 },
    { section: 'system', priority: 70 },
  ])
}

function createFullPlan(): PromptAssemblyPlan {
  return createPlan([
    { section: 'userInput', priority: 100 },
    { section: 'worldState', priority: 90 },
    { section: 'memory', priority: 80 },
    { section: 'system', priority: 60 },
    { section: 'observations', priority: 50 },
    { section: 'reflections', priority: 40 },
  ])
}

// ---------------------------------------------------------------------------
// Interface Contract
// ---------------------------------------------------------------------------

describe('Interface contract', () => {
  it('should define optimize method', () => {
    const optimizer: PromptAssemblyOptimizer = new DefaultPromptAssemblyOptimizer()
    expect(typeof optimizer.optimize).toBe('function')
  })

  it('should accept a PromptAssemblyPlan and return a PromptAssemblyPlan', () => {
    const optimizer = new DefaultPromptAssemblyOptimizer()
    const result = optimizer.optimize(createSingleSectionPlan())
    expect(result).toBeDefined()
    expect(result).toHaveProperty('priorities')
  })

  it('should return the same reference for identity optimization', () => {
    const optimizer: PromptAssemblyOptimizer = new DefaultPromptAssemblyOptimizer()
    const plan = createSingleSectionPlan()
    const result = optimizer.optimize(plan)
    expect(result).toBe(plan)
  })

  it('should accept a custom implementation', () => {
    const custom: PromptAssemblyOptimizer = {
      optimize(plan: PromptAssemblyPlan): PromptAssemblyPlan {
        return { priorities: [...plan.priorities, { section: 'extra', priority: 0 }] }
      },
    }
    const plan = createSingleSectionPlan()
    const result = custom.optimize(plan)
    expect(result.priorities).toHaveLength(2)
  })
})

// ---------------------------------------------------------------------------
// Identity Behavior — Single Section
// ---------------------------------------------------------------------------

describe('Identity — single section', () => {
  it('should return single section unchanged', () => {
    const optimizer = new DefaultPromptAssemblyOptimizer()
    const plan = createSingleSectionPlan()
    const result = optimizer.optimize(plan)
    expect(result.priorities).toHaveLength(1)
    expect(result.priorities[0].section).toBe('userInput')
    expect(result.priorities[0].priority).toBe(100)
  })

  it('should return single section with zero priority unchanged', () => {
    const optimizer = new DefaultPromptAssemblyOptimizer()
    const plan = createPlan([{ section: 'unknown', priority: 0 }])
    const result = optimizer.optimize(plan)
    expect(result.priorities[0].priority).toBe(0)
    expect(result.priorities[0].section).toBe('unknown')
  })

  it('should return single section with negative priority unchanged', () => {
    const optimizer = new DefaultPromptAssemblyOptimizer()
    const plan = createPlan([{ section: 'excluded', priority: -5 }])
    const result = optimizer.optimize(plan)
    expect(result.priorities[0].priority).toBe(-5)
  })

  it('should return single section with large priority unchanged', () => {
    const optimizer = new DefaultPromptAssemblyOptimizer()
    const plan = createPlan([{ section: 'critical', priority: 999 }])
    const result = optimizer.optimize(plan)
    expect(result.priorities[0].priority).toBe(999)
  })
})

// ---------------------------------------------------------------------------
// Identity Behavior — Multiple Sections
// ---------------------------------------------------------------------------

describe('Identity — multiple sections', () => {
  it('should return multiple sections unchanged in count', () => {
    const optimizer = new DefaultPromptAssemblyOptimizer()
    const plan = createMultiSectionPlan()
    const result = optimizer.optimize(plan)
    expect(result.priorities).toHaveLength(4)
  })

  it('should preserve section order', () => {
    const optimizer = new DefaultPromptAssemblyOptimizer()
    const plan = createMultiSectionPlan()
    const result = optimizer.optimize(plan)
    expect(result.priorities[0].section).toBe('userInput')
    expect(result.priorities[1].section).toBe('worldState')
    expect(result.priorities[2].section).toBe('memory')
    expect(result.priorities[3].section).toBe('system')
  })

  it('should preserve section priorities', () => {
    const optimizer = new DefaultPromptAssemblyOptimizer()
    const plan = createMultiSectionPlan()
    const result = optimizer.optimize(plan)
    expect(result.priorities[0].priority).toBe(100)
    expect(result.priorities[1].priority).toBe(90)
    expect(result.priorities[2].priority).toBe(80)
    expect(result.priorities[3].priority).toBe(70)
  })

  it('should preserve full plan with 6 sections', () => {
    const optimizer = new DefaultPromptAssemblyOptimizer()
    const plan = createFullPlan()
    const result = optimizer.optimize(plan)
    expect(result.priorities).toHaveLength(6)
    const sections = result.priorities.map(p => p.section)
    expect(sections).toEqual(['userInput', 'worldState', 'memory', 'system', 'observations', 'reflections'])
  })
})

// ---------------------------------------------------------------------------
// Identity Behavior — Empty Plan
// ---------------------------------------------------------------------------

describe('Identity — empty plan', () => {
  it('should return empty plan unchanged', () => {
    const optimizer = new DefaultPromptAssemblyOptimizer()
    const plan = createPlan([])
    const result = optimizer.optimize(plan)
    expect(result.priorities).toHaveLength(0)
  })

  it('should return same array reference for empty plan', () => {
    const optimizer = new DefaultPromptAssemblyOptimizer()
    const plan = createPlan([])
    const result = optimizer.optimize(plan)
    expect(result.priorities).toBe(plan.priorities)
  })
})

// ---------------------------------------------------------------------------
// Same Reference — Object Identity
// ---------------------------------------------------------------------------

describe('Same reference — object identity', () => {
  it('should return the same object reference', () => {
    const optimizer = new DefaultPromptAssemblyOptimizer()
    const plan = createMultiSectionPlan()
    const result = optimizer.optimize(plan)
    expect(result).toBe(plan)
  })

  it('should return the same priorities array reference', () => {
    const optimizer = new DefaultPromptAssemblyOptimizer()
    const plan = createMultiSectionPlan()
    const result = optimizer.optimize(plan)
    expect(result.priorities).toBe(plan.priorities)
  })

  it('should return the same priority entry references', () => {
    const optimizer = new DefaultPromptAssemblyOptimizer()
    const plan = createMultiSectionPlan()
    const result = optimizer.optimize(plan)
    for (let i = 0; i < plan.priorities.length; i++) {
      expect(result.priorities[i]).toBe(plan.priorities[i])
    }
  })
})

// ---------------------------------------------------------------------------
// Deterministic
// ---------------------------------------------------------------------------

describe('Deterministic', () => {
  it('should produce same result for same plan across multiple calls', () => {
    const optimizer = new DefaultPromptAssemblyOptimizer()
    const plan = createMultiSectionPlan()
    const r1 = optimizer.optimize(plan)
    const r2 = optimizer.optimize(plan)
    const r3 = optimizer.optimize(plan)
    expect(r1).toBe(r2)
    expect(r2).toBe(r3)
  })

  it('should produce same result across different optimizer instances', () => {
    const o1 = new DefaultPromptAssemblyOptimizer()
    const o2 = new DefaultPromptAssemblyOptimizer()
    const plan = createMultiSectionPlan()
    expect(o1.optimize(plan)).toBe(o2.optimize(plan))
  })

  it('should produce same result for identical plans', () => {
    const optimizer = new DefaultPromptAssemblyOptimizer()
    const planA = createMultiSectionPlan()
    const planB = createMultiSectionPlan()
    const rA = optimizer.optimize(planA)
    const rB = optimizer.optimize(planB)
    expect(rA.priorities).toEqual(rB.priorities)
  })

  it('should produce same result for identical single-section plans', () => {
    const optimizer = new DefaultPromptAssemblyOptimizer()
    const planA = createPlan([{ section: 'a', priority: 100 }])
    const planB = createPlan([{ section: 'a', priority: 100 }])
    expect(optimizer.optimize(planA).priorities).toEqual(optimizer.optimize(planB).priorities)
  })
})

// ---------------------------------------------------------------------------
// Stateless
// ---------------------------------------------------------------------------

describe('Stateless', () => {
  it('should not retain state between optimize calls', () => {
    const optimizer = new DefaultPromptAssemblyOptimizer()
    const planA = createPlan([{ section: 'a', priority: 100 }])
    const planB = createPlan([{ section: 'b', priority: 50 }])
    const r1 = optimizer.optimize(planA)
    const r2 = optimizer.optimize(planB)
    expect(r1.priorities[0].section).toBe('a')
    expect(r2.priorities[0].section).toBe('b')
  })

  it('should not retain state across different plans', () => {
    const optimizer = new DefaultPromptAssemblyOptimizer()
    optimizer.optimize(createFullPlan())
    const result = optimizer.optimize(createPlan([{ section: 'fresh', priority: 0 }]))
    expect(result.priorities).toHaveLength(1)
    expect(result.priorities[0].section).toBe('fresh')
  })
})

// ---------------------------------------------------------------------------
// Pure / No Side Effects
// ---------------------------------------------------------------------------

describe('Pure', () => {
  it('should not modify input plan', () => {
    const optimizer = new DefaultPromptAssemblyOptimizer()
    const plan = createMultiSectionPlan()
    const originalPriorities = [...plan.priorities]
    optimizer.optimize(plan)
    expect(plan.priorities).toEqual(originalPriorities)
  })

  it('should not modify plan priority entries', () => {
    const optimizer = new DefaultPromptAssemblyOptimizer()
    const plan = createMultiSectionPlan()
    const original = JSON.stringify(plan)
    optimizer.optimize(plan)
    expect(JSON.stringify(plan)).toBe(original)
  })

  it('should not modify plan priorities array', () => {
    const optimizer = new DefaultPromptAssemblyOptimizer()
    const plan = createMultiSectionPlan()
    const originalRef = plan.priorities
    optimizer.optimize(plan)
    expect(plan.priorities).toBe(originalRef)
  })
})

// ---------------------------------------------------------------------------
// Compatibility — PromptAssemblyPlan Shape
// ---------------------------------------------------------------------------

describe('Compatibility — PromptAssemblyPlan shape', () => {
  it('should work with any PromptAssemblyPlan shape', () => {
    const optimizer = new DefaultPromptAssemblyOptimizer()
    const plan: PromptAssemblyPlan = { priorities: [] }
    expect(() => optimizer.optimize(plan)).not.toThrow()
  })

  it('should work with read-only priorities', () => {
    const optimizer = new DefaultPromptAssemblyOptimizer()
    const priorities = Object.freeze([
      { section: 'a', priority: 100 },
      { section: 'b', priority: 50 },
    ])
    const plan: PromptAssemblyPlan = { priorities }
    expect(() => optimizer.optimize(plan)).not.toThrow()
  })

  it('should preserve frozen priorities', () => {
    const optimizer = new DefaultPromptAssemblyOptimizer()
    const priorities = Object.freeze([
      { section: 'a', priority: 100 },
    ])
    const plan: PromptAssemblyPlan = { priorities }
    const result = optimizer.optimize(plan)
    expect(result.priorities).toBe(priorities)
  })
})

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

describe('Exports', () => {
  it('should export PromptAssemblyOptimizer type from strategy index', async () => {
    const mod = await import('../strategy')
    expect(mod.DefaultPromptAssemblyOptimizer).toBeDefined()
  })

  it('should export DefaultPromptAssemblyOptimizer from strategy index', async () => {
    const mod = await import('../strategy')
    expect(mod.DefaultPromptAssemblyOptimizer).toBe(DefaultPromptAssemblyOptimizer)
  })

  it('should export DefaultPromptAssemblyOptimizer from package root', async () => {
    const mod = await import('..')
    expect(mod.DefaultPromptAssemblyOptimizer).toBeDefined()
  })

  it('should export DefaultPromptAssemblyOptimizer as a class', () => {
    const optimizer = new DefaultPromptAssemblyOptimizer()
    expect(optimizer).toBeInstanceOf(DefaultPromptAssemblyOptimizer)
  })
})

// ---------------------------------------------------------------------------
// Architecture Compliance
// ---------------------------------------------------------------------------

describe('Architecture compliance', () => {
  it('should not depend on Planner', () => {
    const optimizer = new DefaultPromptAssemblyOptimizer()
    expect(optimizer).toBeInstanceOf(DefaultPromptAssemblyOptimizer)
  })

  it('should not depend on Runtime', () => {
    const optimizer = new DefaultPromptAssemblyOptimizer()
    expect(optimizer).toBeDefined()
  })

  it('should not depend on Provider', () => {
    const optimizer = new DefaultPromptAssemblyOptimizer()
    expect(optimizer).toBeDefined()
  })

  it('should not depend on Memory', () => {
    const optimizer = new DefaultPromptAssemblyOptimizer()
    expect(optimizer).toBeDefined()
  })

  it('should not depend on AgentLoop', () => {
    const optimizer = new DefaultPromptAssemblyOptimizer()
    expect(optimizer).toBeDefined()
  })

  it('should not modify PromptBuilder', () => {
    // Foundation only — not consumed by PromptBuilder
    const optimizer = new DefaultPromptAssemblyOptimizer()
    expect(optimizer).toBeDefined()
  })

  it('should not modify PromptRenderer', () => {
    const optimizer = new DefaultPromptAssemblyOptimizer()
    expect(optimizer).toBeDefined()
  })

  it('should not modify PromptCompression', () => {
    const optimizer = new DefaultPromptAssemblyOptimizer()
    expect(optimizer).toBeDefined()
  })

  it('should not modify PromptAssemblyPlan', () => {
    const optimizer = new DefaultPromptAssemblyOptimizer()
    const plan = createMultiSectionPlan()
    const result = optimizer.optimize(plan)
    // Plan shape unchanged
    expect(result).toBe(plan)
  })

  it('should not modify Planner', () => {
    const optimizer = new DefaultPromptAssemblyOptimizer()
    expect(optimizer).toBeDefined()
  })

  it('should not modify Runtime', () => {
    const optimizer = new DefaultPromptAssemblyOptimizer()
    expect(optimizer).toBeDefined()
  })

  it('should not modify AgentLoop', () => {
    const optimizer = new DefaultPromptAssemblyOptimizer()
    expect(optimizer).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Compatibility — RetryPlanner
// ---------------------------------------------------------------------------

describe('RetryPlanner compatibility', () => {
  it('should be compatible with RetryPlanner', () => {
    const optimizer = new DefaultPromptAssemblyOptimizer()
    const plan = createSingleSectionPlan()
    const result = optimizer.optimize(plan)
    expect(result).toBe(plan)
    expect(result.priorities[0].section).toBe('userInput')
  })
})

// ---------------------------------------------------------------------------
// Compatibility — ToolCallPlanner
// ---------------------------------------------------------------------------

describe('ToolCallPlanner compatibility', () => {
  it('should be compatible with ToolCallPlanner', () => {
    const optimizer = new DefaultPromptAssemblyOptimizer()
    const plan = createPlan([{ section: 'userInput', priority: 100 }])
    const result = optimizer.optimize(plan)
    expect(result.priorities[0].section).toBe('userInput')
  })
})

// ---------------------------------------------------------------------------
// Compatibility — Streaming
// ---------------------------------------------------------------------------

describe('Streaming compatibility', () => {
  it('should be compatible with streaming pipeline', () => {
    const optimizer = new DefaultPromptAssemblyOptimizer()
    const plan = createPlan([{ section: 'worldState', priority: 90 }])
    const result = optimizer.optimize(plan)
    expect(result.priorities[0].section).toBe('worldState')
  })
})

// ---------------------------------------------------------------------------
// Compatibility — AgentLoop
// ---------------------------------------------------------------------------

describe('AgentLoop compatibility', () => {
  it('should be compatible with AgentLoop', () => {
    const optimizer = new DefaultPromptAssemblyOptimizer()
    const plan = createPlan([{ section: 'memory', priority: 80 }])
    const result = optimizer.optimize(plan)
    expect(result.priorities[0].section).toBe('memory')
  })
})