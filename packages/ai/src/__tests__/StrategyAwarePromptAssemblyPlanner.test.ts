import { describe, it, expect } from 'vitest'
import { StrategyAwarePromptAssemblyPlanner } from '../strategy/StrategyAwarePromptAssemblyPlanner'
import type { PromptAssemblyPlan } from '../strategy/PromptAssemblyPlan'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function priorityFor(plan: PromptAssemblyPlan, section: string): number {
  const entry = plan.priorities.find(p => p.section === section)
  return entry?.priority ?? -1
}

// ---------------------------------------------------------------------------
// Create Priorities
// ---------------------------------------------------------------------------

describe('Create priorities', () => {
  const planner = new StrategyAwarePromptAssemblyPlanner()
  const sections = ['userInput', 'worldState', 'strategyModuleRendered', 'strategyRendered', 'memory', 'observations', 'entityRendered', 'system']
  const plan = planner.buildPlan('create', sections)

  it('should set userInput priority 100', () => {
    expect(priorityFor(plan, 'userInput')).toBe(100)
  })

  it('should set worldState priority 90', () => {
    expect(priorityFor(plan, 'worldState')).toBe(90)
  })

  it('should set strategyModuleRendered priority 80', () => {
    expect(priorityFor(plan, 'strategyModuleRendered')).toBe(80)
  })

  it('should set strategyRendered priority 70', () => {
    expect(priorityFor(plan, 'strategyRendered')).toBe(70)
  })

  it('should set memory priority 30', () => {
    expect(priorityFor(plan, 'memory')).toBe(30)
  })

  it('should set observations priority 20', () => {
    expect(priorityFor(plan, 'observations')).toBe(20)
  })

  it('should set entityRendered priority 0 (not in create table)', () => {
    expect(priorityFor(plan, 'entityRendered')).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// Query Priorities
// ---------------------------------------------------------------------------

describe('Query priorities', () => {
  const planner = new StrategyAwarePromptAssemblyPlanner()
  const sections = ['userInput', 'worldState', 'memory', 'observations', 'strategyModuleRendered', 'strategyRendered', 'entityRendered']
  const plan = planner.buildPlan('query', sections)

  it('should set userInput priority 100', () => {
    expect(priorityFor(plan, 'userInput')).toBe(100)
  })

  it('should set worldState priority 90', () => {
    expect(priorityFor(plan, 'worldState')).toBe(90)
  })

  it('should set memory priority 80', () => {
    expect(priorityFor(plan, 'memory')).toBe(80)
  })

  it('should set observations priority 70', () => {
    expect(priorityFor(plan, 'observations')).toBe(70)
  })

  it('should set strategyModuleRendered priority 60', () => {
    expect(priorityFor(plan, 'strategyModuleRendered')).toBe(60)
  })

  it('should set strategyRendered priority 50', () => {
    expect(priorityFor(plan, 'strategyRendered')).toBe(50)
  })

  it('should set entityRendered priority 0 (not in query table)', () => {
    expect(priorityFor(plan, 'entityRendered')).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// Modify Priorities
// ---------------------------------------------------------------------------

describe('Modify priorities', () => {
  const planner = new StrategyAwarePromptAssemblyPlanner()
  const sections = ['userInput', 'worldState', 'entityRendered', 'memory', 'observations', 'strategyModuleRendered', 'strategyRendered']
  const plan = planner.buildPlan('modify', sections)

  it('should set userInput priority 100', () => {
    expect(priorityFor(plan, 'userInput')).toBe(100)
  })

  it('should set worldState priority 90', () => {
    expect(priorityFor(plan, 'worldState')).toBe(90)
  })

  it('should set entityRendered priority 85', () => {
    expect(priorityFor(plan, 'entityRendered')).toBe(85)
  })

  it('should set memory priority 70', () => {
    expect(priorityFor(plan, 'memory')).toBe(70)
  })

  it('should set observations priority 60', () => {
    expect(priorityFor(plan, 'observations')).toBe(60)
  })

  it('should set strategyModuleRendered priority 50', () => {
    expect(priorityFor(plan, 'strategyModuleRendered')).toBe(50)
  })

  it('should set strategyRendered priority 40', () => {
    expect(priorityFor(plan, 'strategyRendered')).toBe(40)
  })
})

// ---------------------------------------------------------------------------
// Delete Priorities
// ---------------------------------------------------------------------------

describe('Delete priorities', () => {
  const planner = new StrategyAwarePromptAssemblyPlanner()
  const sections = ['userInput', 'worldState', 'entityRendered', 'observations', 'memory', 'strategyModuleRendered', 'strategyRendered']
  const plan = planner.buildPlan('delete', sections)

  it('should set userInput priority 100', () => {
    expect(priorityFor(plan, 'userInput')).toBe(100)
  })

  it('should set worldState priority 90', () => {
    expect(priorityFor(plan, 'worldState')).toBe(90)
  })

  it('should set entityRendered priority 85', () => {
    expect(priorityFor(plan, 'entityRendered')).toBe(85)
  })

  it('should set observations priority 80', () => {
    expect(priorityFor(plan, 'observations')).toBe(80)
  })

  it('should set memory priority 70', () => {
    expect(priorityFor(plan, 'memory')).toBe(70)
  })

  it('should set strategyModuleRendered priority 50', () => {
    expect(priorityFor(plan, 'strategyModuleRendered')).toBe(50)
  })

  it('should set strategyRendered priority 40', () => {
    expect(priorityFor(plan, 'strategyRendered')).toBe(40)
  })
})

// ---------------------------------------------------------------------------
// Default Priorities
// ---------------------------------------------------------------------------

describe('Default priorities', () => {
  const planner = new StrategyAwarePromptAssemblyPlanner()
  const sections = ['userInput', 'worldState', 'memory', 'observations', 'strategyRendered', 'unknown']
  const plan = planner.buildPlan('default', sections)

  it('should set all sections priority 100', () => {
    for (const p of plan.priorities) {
      expect(p.priority).toBe(100)
    }
  })

  it('should preserve section order', () => {
    const order = plan.priorities.map(p => p.section)
    expect(order).toEqual(['userInput', 'worldState', 'memory', 'observations', 'strategyRendered', 'unknown'])
  })
})

// ---------------------------------------------------------------------------
// Unknown Strategy
// ---------------------------------------------------------------------------

describe('Unknown strategy', () => {
  const planner = new StrategyAwarePromptAssemblyPlanner()
  const sections = ['userInput', 'worldState', 'memory']
  const plan = planner.buildPlan('nonexistent-strategy', sections)

  it('should fall back to default priority 100', () => {
    for (const p of plan.priorities) {
      expect(p.priority).toBe(100)
    }
  })
})

// ---------------------------------------------------------------------------
// Different Strategies Produce Different Plans
// ---------------------------------------------------------------------------

describe('Different strategies produce different plans', () => {
  const planner = new StrategyAwarePromptAssemblyPlanner()
  const sections = ['userInput', 'worldState', 'memory', 'observations', 'strategyModuleRendered', 'strategyRendered', 'entityRendered']

  it('create and query should differ for memory', () => {
    const createPlan = planner.buildPlan('create', sections)
    const queryPlan = planner.buildPlan('query', sections)
    expect(priorityFor(createPlan, 'memory')).not.toBe(priorityFor(queryPlan, 'memory'))
  })

  it('create and modify should differ for entityRendered', () => {
    const createPlan = planner.buildPlan('create', sections)
    const modifyPlan = planner.buildPlan('modify', sections)
    expect(priorityFor(createPlan, 'entityRendered')).not.toBe(priorityFor(modifyPlan, 'entityRendered'))
  })

  it('modify and delete should differ for observations', () => {
    const modifyPlan = planner.buildPlan('modify', sections)
    const deletePlan = planner.buildPlan('delete', sections)
    expect(priorityFor(modifyPlan, 'observations')).not.toBe(priorityFor(deletePlan, 'observations'))
  })

  it('query and delete should differ for observations', () => {
    const queryPlan = planner.buildPlan('query', sections)
    const deletePlan = planner.buildPlan('delete', sections)
    expect(priorityFor(queryPlan, 'observations')).not.toBe(priorityFor(deletePlan, 'observations'))
  })
})

// ---------------------------------------------------------------------------
// Deterministic
// ---------------------------------------------------------------------------

describe('Deterministic', () => {
  const planner = new StrategyAwarePromptAssemblyPlanner()
  const sections = ['userInput', 'worldState', 'memory', 'observations']

  it('should produce same plan for same inputs across multiple calls', () => {
    const r1 = planner.buildPlan('create', sections)
    const r2 = planner.buildPlan('create', sections)
    const r3 = planner.buildPlan('create', sections)
    expect(r1).toEqual(r2)
    expect(r2).toEqual(r3)
  })

  it('should produce same plan across different planner instances', () => {
    const p1 = new StrategyAwarePromptAssemblyPlanner()
    const p2 = new StrategyAwarePromptAssemblyPlanner()
    expect(p1.buildPlan('query', sections)).toEqual(p2.buildPlan('query', sections))
  })
})

// ---------------------------------------------------------------------------
// Stateless
// ---------------------------------------------------------------------------

describe('Stateless', () => {
  it('should not retain state between calls', () => {
    const planner = new StrategyAwarePromptAssemblyPlanner()
    const sections = ['userInput', 'worldState']
    const r1 = planner.buildPlan('create', sections)
    const r2 = planner.buildPlan('query', sections)
    // Different strategies produce different plans
    expect(r1.priorities[0].priority).toBe(100) // userInput in create
    expect(r2.priorities[0].priority).toBe(100) // userInput in query
    expect(r1.priorities[1].priority).toBe(90)  // worldState in create
    expect(r2.priorities[1].priority).toBe(90)  // worldState in query
  })
})

// ---------------------------------------------------------------------------
// Pure
// ---------------------------------------------------------------------------

describe('Pure', () => {
  it('should not modify input sections array', () => {
    const planner = new StrategyAwarePromptAssemblyPlanner()
    const sections = ['userInput', 'worldState']
    const original = [...sections]
    planner.buildPlan('create', sections)
    expect(sections).toEqual(original)
  })

  it('should return a new object on each call', () => {
    const planner = new StrategyAwarePromptAssemblyPlanner()
    const sections = ['userInput']
    const r1 = planner.buildPlan('create', sections)
    const r2 = planner.buildPlan('create', sections)
    expect(r1).not.toBe(r2)
    expect(r1.priorities).not.toBe(r2.priorities)
  })
})

// ---------------------------------------------------------------------------
// Missing Sections
// ---------------------------------------------------------------------------

describe('Missing sections', () => {
  const planner = new StrategyAwarePromptAssemblyPlanner()

  it('should handle empty sections array', () => {
    const plan = planner.buildPlan('create', [])
    expect(plan.priorities).toEqual([])
  })

  it('should handle empty sections for any strategy', () => {
    const queryPlan = planner.buildPlan('query', [])
    const modifyPlan = planner.buildPlan('modify', [])
    const deletePlan = planner.buildPlan('delete', [])
    expect(queryPlan.priorities).toEqual([])
    expect(modifyPlan.priorities).toEqual([])
    expect(deletePlan.priorities).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// Unknown Sections
// ---------------------------------------------------------------------------

describe('Unknown sections', () => {
  const planner = new StrategyAwarePromptAssemblyPlanner()

  it('should assign priority 0 for sections not in strategy table', () => {
    const plan = planner.buildPlan('create', ['unknownSection', 'anotherUnknown'])
    for (const p of plan.priorities) {
      expect(p.priority).toBe(0)
    }
  })

  it('should assign priority 100 for unknown sections under default strategy', () => {
    const plan = planner.buildPlan('default', ['unknownSection'])
    expect(plan.priorities[0].priority).toBe(100)
  })
})

// ---------------------------------------------------------------------------
// Integration with DefaultPromptBuilder
// ---------------------------------------------------------------------------

describe('Integration with DefaultPromptBuilder', () => {
  it('should produce correct plan when used as promptAssemblyPlanner', async () => {
    const { DefaultPromptBuilder } = await import('../prompt/DefaultPromptBuilder')
    const { UserInputModule } = await import('../prompt/modules')
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new StrategyAwarePromptAssemblyPlanner(),
    })
    const ctx = {
      input: 'create a tree',
      memory: { get: async () => null, set: async () => {} },
      worldState: '',
    }
    const req = await builder.build(ctx)
    const assembly = req.metadata?.promptAssembly as Record<string, unknown> | undefined
    const plan = assembly?.plan as PromptAssemblyPlan | undefined
    expect(plan).toBeDefined()
    expect(plan?.priorities.length).toBeGreaterThan(0)
    // userInput should have priority 100 (default strategy)
    const userInput = plan?.priorities.find(p => p.section === 'userInput')
    expect(userInput?.priority).toBe(100)
  })
})

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

describe('Exports', () => {
  it('should export StrategyAwarePromptAssemblyPlanner from strategy index', async () => {
    const mod = await import('../strategy')
    expect(mod.StrategyAwarePromptAssemblyPlanner).toBeDefined()
  })

  it('should export StrategyAwarePromptAssemblyPlanner from package root', async () => {
    const mod = await import('..')
    expect(mod.StrategyAwarePromptAssemblyPlanner).toBeDefined()
  })
})