import { describe, it, expect } from 'vitest'
import { DefaultPriorityAwarePromptAssemblyStrategy } from '../strategy/DefaultPriorityAwarePromptAssemblyStrategy'
import type { PriorityAwarePromptAssemblyStrategy } from '../strategy/PriorityAwarePromptAssemblyStrategy'
import type { PromptAssemblyPlan } from '../strategy/PromptAssemblyPlan'
import type { PromptAssemblyStrategy } from '../strategy/PromptAssemblyStrategy'
import { DefaultPromptBuilder } from '../prompt/DefaultPromptBuilder'
import { UserInputModule } from '../prompt/modules'
import type { PipelineContext } from '../pipeline/PipelineContext'
import { DefaultPromptAssemblyPlanner } from '../strategy/DefaultPromptAssemblyPlanner'

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

function createPlan(priorities: Array<{ section: string; priority: number }>): PromptAssemblyPlan {
  return { priorities }
}

// ---------------------------------------------------------------------------
// Sorting
// ---------------------------------------------------------------------------

describe('Sorting', () => {
  it('should order sections by priority descending', () => {
    const strategy = new DefaultPriorityAwarePromptAssemblyStrategy()
    const sections = ['memory', 'userInput', 'worldState']
    const plan = createPlan([
      { section: 'memory', priority: 30 },
      { section: 'userInput', priority: 100 },
      { section: 'worldState', priority: 80 },
    ])
    const result = strategy.applyPlan(sections, plan)
    expect(result).toEqual(['userInput', 'worldState', 'memory'])
  })

  it('should place highest priority section first', () => {
    const strategy = new DefaultPriorityAwarePromptAssemblyStrategy()
    const sections = ['a', 'b', 'c', 'd']
    const plan = createPlan([
      { section: 'a', priority: 10 },
      { section: 'b', priority: 50 },
      { section: 'c', priority: 90 },
      { section: 'd', priority: 30 },
    ])
    const result = strategy.applyPlan(sections, plan)
    expect(result[0]).toBe('c') // priority 90
  })

  it('should place lowest priority section last', () => {
    const strategy = new DefaultPriorityAwarePromptAssemblyStrategy()
    const sections = ['a', 'b', 'c']
    const plan = createPlan([
      { section: 'a', priority: 100 },
      { section: 'b', priority: 50 },
      { section: 'c', priority: 10 },
    ])
    const result = strategy.applyPlan(sections, plan)
    expect(result[2]).toBe('c') // priority 10
  })

  it('should handle reverse order input', () => {
    const strategy = new DefaultPriorityAwarePromptAssemblyStrategy()
    const sections = ['low', 'medium', 'high']
    const plan = createPlan([
      { section: 'low', priority: 10 },
      { section: 'medium', priority: 50 },
      { section: 'high', priority: 100 },
    ])
    const result = strategy.applyPlan(sections, plan)
    expect(result).toEqual(['high', 'medium', 'low'])
  })
})

// ---------------------------------------------------------------------------
// Stable Sorting
// ---------------------------------------------------------------------------

describe('Stable sorting', () => {
  it('should preserve relative order when priorities tie', () => {
    const strategy = new DefaultPriorityAwarePromptAssemblyStrategy()
    const sections = ['a', 'b', 'c', 'd']
    const plan = createPlan([
      { section: 'a', priority: 100 },
      { section: 'b', priority: 50 },
      { section: 'c', priority: 50 },
      { section: 'd', priority: 10 },
    ])
    // 'b' and 'c' have same priority 50 — 'b' comes first in original order
    const result = strategy.applyPlan(sections, plan)
    expect(result.indexOf('b')).toBeLessThan(result.indexOf('c'))
  })

  it('should preserve order for all sections with same priority', () => {
    const strategy = new DefaultPriorityAwarePromptAssemblyStrategy()
    const sections = ['x', 'y', 'z']
    const plan = createPlan([
      { section: 'x', priority: 100 },
      { section: 'y', priority: 100 },
      { section: 'z', priority: 100 },
    ])
    const result = strategy.applyPlan(sections, plan)
    expect(result).toEqual(['x', 'y', 'z'])
  })

  it('should preserve order for sections with no priority change', () => {
    const strategy = new DefaultPriorityAwarePromptAssemblyStrategy()
    const sections = ['first', 'second', 'third', 'fourth']
    const plan = createPlan([
      { section: 'first', priority: 50 },
      { section: 'second', priority: 50 },
      { section: 'third', priority: 50 },
      { section: 'fourth', priority: 50 },
    ])
    const result = strategy.applyPlan(sections, plan)
    expect(result).toEqual(['first', 'second', 'third', 'fourth'])
  })
})

// ---------------------------------------------------------------------------
// Empty Plan
// ---------------------------------------------------------------------------

describe('Empty plan', () => {
  it('should return sections in original order when plan is empty', () => {
    const strategy = new DefaultPriorityAwarePromptAssemblyStrategy()
    const sections = ['a', 'b', 'c']
    const plan = createPlan([])
    const result = strategy.applyPlan(sections, plan)
    expect(result).toEqual(['a', 'b', 'c'])
  })

  it('should handle empty sections and empty plan', () => {
    const strategy = new DefaultPriorityAwarePromptAssemblyStrategy()
    const result = strategy.applyPlan([], createPlan([]))
    expect(result).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// Missing Sections
// ---------------------------------------------------------------------------

describe('Missing sections', () => {
  it('should place sections not in plan at the end with priority 0', () => {
    const strategy = new DefaultPriorityAwarePromptAssemblyStrategy()
    const sections = ['a', 'b', 'c', 'd']
    const plan = createPlan([
      { section: 'b', priority: 100 },
      { section: 'a', priority: 50 },
    ])
    const result = strategy.applyPlan(sections, plan)
    // 'b' (100) first, then 'a' (50), then 'c' (0), 'd' (0) preserving original order
    expect(result[0]).toBe('b')
    expect(result[1]).toBe('a')
    expect(result.indexOf('c')).toBeLessThan(result.indexOf('d'))
  })

  it('should handle all sections missing from plan', () => {
    const strategy = new DefaultPriorityAwarePromptAssemblyStrategy()
    const sections = ['x', 'y', 'z']
    const plan = createPlan([{ section: 'other', priority: 100 }])
    const result = strategy.applyPlan(sections, plan)
    expect(result).toEqual(['x', 'y', 'z'])
  })
})

// ---------------------------------------------------------------------------
// Deterministic
// ---------------------------------------------------------------------------

describe('Deterministic', () => {
  it('should produce same result for same inputs across multiple calls', () => {
    const strategy = new DefaultPriorityAwarePromptAssemblyStrategy()
    const sections = ['memory', 'userInput', 'worldState', 'system']
    const plan = createPlan([
      { section: 'system', priority: 100 },
      { section: 'userInput', priority: 80 },
      { section: 'worldState', priority: 60 },
      { section: 'memory', priority: 40 },
    ])
    const r1 = strategy.applyPlan(sections, plan)
    const r2 = strategy.applyPlan(sections, plan)
    const r3 = strategy.applyPlan(sections, plan)
    expect(r1).toEqual(r2)
    expect(r2).toEqual(r3)
  })

  it('should produce same result across different strategy instances', () => {
    const s1 = new DefaultPriorityAwarePromptAssemblyStrategy()
    const s2 = new DefaultPriorityAwarePromptAssemblyStrategy()
    const sections = ['a', 'b', 'c']
    const plan = createPlan([
      { section: 'c', priority: 100 },
      { section: 'a', priority: 50 },
      { section: 'b', priority: 10 },
    ])
    expect(s1.applyPlan(sections, plan)).toEqual(s2.applyPlan(sections, plan))
  })
})

// ---------------------------------------------------------------------------
// Stateless
// ---------------------------------------------------------------------------

describe('Stateless', () => {
  it('should not retain state between calls', () => {
    const strategy = new DefaultPriorityAwarePromptAssemblyStrategy()
    const plan1 = createPlan([{ section: 'a', priority: 100 }, { section: 'b', priority: 50 }])
    const plan2 = createPlan([{ section: 'b', priority: 100 }, { section: 'a', priority: 50 }])
    const r1 = strategy.applyPlan(['a', 'b'], plan1)
    const r2 = strategy.applyPlan(['a', 'b'], plan2)
    expect(r1).toEqual(['a', 'b'])
    expect(r2).toEqual(['b', 'a'])
  })
})

// ---------------------------------------------------------------------------
// Pure
// ---------------------------------------------------------------------------

describe('Pure', () => {
  it('should not modify input sections array', () => {
    const strategy = new DefaultPriorityAwarePromptAssemblyStrategy()
    const sections = ['a', 'b', 'c']
    const original = [...sections]
    const plan = createPlan([{ section: 'c', priority: 100 }, { section: 'a', priority: 50 }])
    strategy.applyPlan(sections, plan)
    expect(sections).toEqual(original)
  })

  it('should not modify input plan', () => {
    const strategy = new DefaultPriorityAwarePromptAssemblyStrategy()
    const sections = ['a', 'b']
    const plan = createPlan([{ section: 'b', priority: 100 }])
    const originalPriorities = [...plan.priorities]
    strategy.applyPlan(sections, plan)
    expect(plan.priorities).toEqual(originalPriorities)
  })

  it('should return a new array', () => {
    const strategy = new DefaultPriorityAwarePromptAssemblyStrategy()
    const sections = ['a', 'b', 'c']
    const result = strategy.applyPlan(sections, createPlan([]))
    expect(result).not.toBe(sections)
  })
})

// ---------------------------------------------------------------------------
// apply() — Identity
// ---------------------------------------------------------------------------

describe('apply() — identity', () => {
  it('should return sections in original order', () => {
    const strategy = new DefaultPriorityAwarePromptAssemblyStrategy()
    const sections = ['c', 'a', 'b']
    const result = strategy.apply(sections)
    expect(result).toEqual(['c', 'a', 'b'])
  })

  it('should return a new array (not the same reference)', () => {
    const strategy = new DefaultPriorityAwarePromptAssemblyStrategy()
    const sections = ['a', 'b']
    const result = strategy.apply(sections)
    expect(result).not.toBe(sections)
  })
})

// ---------------------------------------------------------------------------
// Interface Conformance
// ---------------------------------------------------------------------------

describe('Interface conformance', () => {
  it('should implement PromptAssemblyStrategy', () => {
    const strategy: PromptAssemblyStrategy = new DefaultPriorityAwarePromptAssemblyStrategy()
    expect(strategy.apply).toBeDefined()
  })

  it('should implement PriorityAwarePromptAssemblyStrategy', () => {
    const strategy: PriorityAwarePromptAssemblyStrategy = new DefaultPriorityAwarePromptAssemblyStrategy()
    expect(strategy.applyPlan).toBeDefined()
  })

  it('should have correct strategyName', () => {
    const strategy = new DefaultPriorityAwarePromptAssemblyStrategy()
    expect(strategy.strategyName).toBe('priority-aware')
  })
})

// ---------------------------------------------------------------------------
// Builder Integration — Metadata
// ---------------------------------------------------------------------------

describe('Builder integration — metadata', () => {
  it('should set planApplied=true when plan and priority-aware strategy are used', async () => {
    const priorityStrategy = new DefaultPriorityAwarePromptAssemblyStrategy()
    const resolver = {
      resolve(_name: string): PromptAssemblyStrategy {
        return priorityStrategy
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyStrategyResolver: resolver,
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
    })
    const request = await builder.build(createPipelineContext())
    const assembly = request.metadata?.promptAssembly as Record<string, unknown> | undefined
    expect(assembly?.planApplied).toBe(true)
  })

  it('should set planApplied=false when plan is absent', async () => {
    const priorityStrategy = new DefaultPriorityAwarePromptAssemblyStrategy()
    const resolver = {
      resolve(_name: string): PromptAssemblyStrategy {
        return priorityStrategy
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyStrategyResolver: resolver,
      // No planner — no plan
    })
    const request = await builder.build(createPipelineContext())
    const assembly = request.metadata?.promptAssembly as Record<string, unknown> | undefined
    expect(assembly?.planApplied).toBe(false)
  })

  it('should set planApplied=false when strategy is not priority-aware', async () => {
    const nonPriorityStrategy: PromptAssemblyStrategy = {
      strategyName: 'basic',
      apply(sections: readonly string[]): readonly string[] {
        return [...sections]
      },
    }
    const resolver = {
      resolve(_name: string): PromptAssemblyStrategy {
        return nonPriorityStrategy
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyStrategyResolver: resolver,
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
    })
    const request = await builder.build(createPipelineContext())
    const assembly = request.metadata?.promptAssembly as Record<string, unknown> | undefined
    expect(assembly?.planApplied).toBe(false)
  })

  it('should set planApplied=false when no resolver is configured', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
    })
    const request = await builder.build(createPipelineContext())
    const assembly = request.metadata?.promptAssembly as Record<string, unknown> | undefined
    expect(assembly?.planApplied).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Builder Integration — Compatibility
// ---------------------------------------------------------------------------

describe('Builder integration — compatibility', () => {
  it('should produce identical prompt output with plan-aware ordering vs without', async () => {
    const priorityStrategy = new DefaultPriorityAwarePromptAssemblyStrategy()
    const resolver = {
      resolve(_name: string): PromptAssemblyStrategy {
        return priorityStrategy
      },
    }
    const builderWith = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyStrategyResolver: resolver,
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
    })
    const builderWithout = new DefaultPromptBuilder([new UserInputModule()])
    const ctx = createPipelineContext()
    const reqWith = await builderWith.build(ctx)
    const reqWithout = await builderWithout.build(ctx)
    // Default plan assigns all priorities 100 → stable sort → same order
    expect(reqWith.prompt).toBe(reqWithout.prompt)
  })

  it('should coexist with plan metadata', async () => {
    const priorityStrategy = new DefaultPriorityAwarePromptAssemblyStrategy()
    const resolver = {
      resolve(_name: string): PromptAssemblyStrategy {
        return priorityStrategy
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyStrategyResolver: resolver,
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
    })
    const request = await builder.build(createPipelineContext())
    const assembly = request.metadata?.promptAssembly as Record<string, unknown> | undefined
    expect(assembly?.plan).toBeDefined()
    expect(assembly?.planApplied).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

describe('Exports', () => {
  it('should export PriorityAwarePromptAssemblyStrategy from strategy index', async () => {
    const mod = await import('../strategy')
    expect(mod.DefaultPriorityAwarePromptAssemblyStrategy).toBeDefined()
  })

  it('should export DefaultPriorityAwarePromptAssemblyStrategy from package root', async () => {
    const mod = await import('..')
    expect(mod.DefaultPriorityAwarePromptAssemblyStrategy).toBeDefined()
  })
})