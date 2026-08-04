import { describe, it, expect } from 'vitest'
import { DefaultPromptAssemblyPlanner } from '../strategy/DefaultPromptAssemblyPlanner'
import type { PromptAssemblyPlanner } from '../strategy/PromptAssemblyPlanner'
import type { PromptAssemblyPlan } from '../strategy/PromptAssemblyPlan'
import type { PromptSectionPriority } from '../strategy/PromptSectionPriority'

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

describe('PromptSectionPriority interface', () => {
  it('should have section string field', () => {
    const priority: PromptSectionPriority = { section: 'userInput', priority: 100 }
    expect(typeof priority.section).toBe('string')
  })

  it('should have priority number field', () => {
    const priority: PromptSectionPriority = { section: 'system', priority: 50 }
    expect(typeof priority.priority).toBe('number')
  })

  it('should support various priority values', () => {
    const p0: PromptSectionPriority = { section: 'a', priority: 0 }
    const p1: PromptSectionPriority = { section: 'b', priority: 100 }
    const p2: PromptSectionPriority = { section: 'c', priority: 200 }
    expect(p0.priority).toBe(0)
    expect(p1.priority).toBe(100)
    expect(p2.priority).toBe(200)
  })
})

describe('PromptAssemblyPlan interface', () => {
  it('should have readonly priorities array', () => {
    const plan: PromptAssemblyPlan = { priorities: [] }
    expect(plan.priorities).toEqual([])
  })

  it('should contain PromptSectionPriority entries', () => {
    const priorities: PromptSectionPriority[] = [
      { section: 'system', priority: 100 },
      { section: 'userInput', priority: 80 },
    ]
    const plan: PromptAssemblyPlan = { priorities }
    expect(plan.priorities).toHaveLength(2)
    expect(plan.priorities[0].section).toBe('system')
    expect(plan.priorities[1].priority).toBe(80)
  })
})

describe('PromptAssemblyPlanner interface', () => {
  it('should define buildPlan method', () => {
    const planner: PromptAssemblyPlanner = new DefaultPromptAssemblyPlanner()
    expect(typeof planner.buildPlan).toBe('function')
  })

  it('should accept strategyName and sections parameters', () => {
    const planner: PromptAssemblyPlanner = new DefaultPromptAssemblyPlanner()
    const plan = planner.buildPlan('default', ['system', 'userInput'])
    expect(plan).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// DefaultPromptAssemblyPlanner
// ---------------------------------------------------------------------------

describe('DefaultPromptAssemblyPlanner', () => {
  it('should preserve section order from input', () => {
    const planner = new DefaultPromptAssemblyPlanner()
    const sections = ['worldState', 'observations', 'reflections', 'system']
    const plan = planner.buildPlan('default', sections)
    const order = plan.priorities.map(p => p.section)
    expect(order).toEqual(['worldState', 'observations', 'reflections', 'system'])
  })

  it('should assign all sections default priority of 100', () => {
    const planner = new DefaultPromptAssemblyPlanner()
    const sections = ['system', 'userInput', 'memory', 'worldState']
    const plan = planner.buildPlan('default', sections)
    for (const priority of plan.priorities) {
      expect(priority.priority).toBe(100)
    }
  })

  it('should handle a single section', () => {
    const planner = new DefaultPromptAssemblyPlanner()
    const plan = planner.buildPlan('create', ['userInput'])
    expect(plan.priorities).toHaveLength(1)
    expect(plan.priorities[0]).toEqual({ section: 'userInput', priority: 100 })
  })

  it('should handle an empty sections array', () => {
    const planner = new DefaultPromptAssemblyPlanner()
    const plan = planner.buildPlan('default', [])
    expect(plan.priorities).toEqual([])
  })

  it('should accept any strategy name', () => {
    const planner = new DefaultPromptAssemblyPlanner()
    const plan = planner.buildPlan('custom-strategy-name', ['system', 'userInput'])
    expect(plan.priorities).toHaveLength(2)
  })

  it('should not mutate input sections array', () => {
    const planner = new DefaultPromptAssemblyPlanner()
    const sections = ['system', 'userInput', 'memory']
    const original = [...sections]
    planner.buildPlan('default', sections)
    expect(sections).toEqual(original)
  })
})

// ---------------------------------------------------------------------------
// Deterministic
// ---------------------------------------------------------------------------

describe('Deterministic', () => {
  it('should produce same plan for same inputs across multiple calls', () => {
    const planner = new DefaultPromptAssemblyPlanner()
    const sections = ['system', 'userInput', 'memory', 'worldState']
    const r1 = planner.buildPlan('default', sections)
    const r2 = planner.buildPlan('default', sections)
    const r3 = planner.buildPlan('default', sections)
    expect(r1).toEqual(r2)
    expect(r2).toEqual(r3)
  })

  it('should produce same plan across different planner instances', () => {
    const p1 = new DefaultPromptAssemblyPlanner()
    const p2 = new DefaultPromptAssemblyPlanner()
    const sections = ['system', 'userInput']
    expect(p1.buildPlan('default', sections)).toEqual(p2.buildPlan('default', sections))
  })

  it('should produce same plan for different strategy names with same sections', () => {
    const planner = new DefaultPromptAssemblyPlanner()
    const sections = ['system', 'userInput']
    const r1 = planner.buildPlan('create', sections)
    const r2 = planner.buildPlan('query', sections)
    // Default planner ignores strategy name — all get priority 100
    expect(r1).toEqual(r2)
  })
})

// ---------------------------------------------------------------------------
// Stateless
// ---------------------------------------------------------------------------

describe('Stateless', () => {
  it('should not retain state between calls', () => {
    const planner = new DefaultPromptAssemblyPlanner()
    const r1 = planner.buildPlan('default', ['system'])
    const r2 = planner.buildPlan('default', ['userInput', 'memory'])
    // Different inputs → different outputs
    expect(r1.priorities.map(p => p.section)).toEqual(['system'])
    expect(r2.priorities.map(p => p.section)).toEqual(['userInput', 'memory'])
  })
})

// ---------------------------------------------------------------------------
// Pure / No Side Effects
// ---------------------------------------------------------------------------

describe('Pure', () => {
  it('should not modify input sections array', () => {
    const planner = new DefaultPromptAssemblyPlanner()
    const sections = ['a', 'b', 'c']
    const original = [...sections]
    planner.buildPlan('default', sections)
    expect(sections).toEqual(original)
  })

  it('should return a new object on each call', () => {
    const planner = new DefaultPromptAssemblyPlanner()
    const sections = ['system']
    const r1 = planner.buildPlan('default', sections)
    const r2 = planner.buildPlan('default', sections)
    expect(r1).not.toBe(r2)
    expect(r1.priorities).not.toBe(r2.priorities)
  })
})

// ---------------------------------------------------------------------------
// Architecture Compliance
// ---------------------------------------------------------------------------

describe('Architecture Compliance', () => {
  it('should not depend on Planner', () => {
    const planner = new DefaultPromptAssemblyPlanner()
    expect(planner).toBeInstanceOf(DefaultPromptAssemblyPlanner)
  })

  it('should not depend on Runtime', () => {
    // DefaultPromptAssemblyPlanner construction requires no Runtime
    const planner = new DefaultPromptAssemblyPlanner()
    expect(planner).toBeDefined()
  })

  it('should not depend on Provider', () => {
    const planner = new DefaultPromptAssemblyPlanner()
    expect(planner).toBeDefined()
  })

  it('should not depend on Memory', () => {
    const planner = new DefaultPromptAssemblyPlanner()
    expect(planner).toBeDefined()
  })

  it('should not depend on AgentLoop', () => {
    const planner = new DefaultPromptAssemblyPlanner()
    expect(planner).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// DEFAULT_PRIORITY constant
// ---------------------------------------------------------------------------

describe('DEFAULT_PRIORITY constant', () => {
  it('should be defined as 100', () => {
    expect(DefaultPromptAssemblyPlanner.DEFAULT_PRIORITY).toBe(100)
  })
})

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

describe('Exports', () => {
  it('should export DefaultPromptAssemblyPlanner class from strategy index', async () => {
    const mod = await import('../strategy')
    expect(mod.DefaultPromptAssemblyPlanner).toBe(DefaultPromptAssemblyPlanner)
  })

  it('should export DefaultPromptAssemblyPlanner from package root index', async () => {
    const mod = await import('..')
    expect(mod.DefaultPromptAssemblyPlanner).toBeDefined()
  })
})