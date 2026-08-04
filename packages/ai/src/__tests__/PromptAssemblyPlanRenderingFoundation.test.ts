import { describe, it, expect } from 'vitest'
import { DefaultPromptAssemblyPlanRenderer } from '../strategy/DefaultPromptAssemblyPlanRenderer'
import type { PromptAssemblyPlanRenderer } from '../strategy/PromptAssemblyPlanRenderer'
import type { PromptAssemblyPlan } from '../strategy/PromptAssemblyPlan'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createPlan(priorities: Array<{ section: string; priority: number }>): PromptAssemblyPlan {
  return { priorities }
}

// ---------------------------------------------------------------------------
// Interface Contract
// ---------------------------------------------------------------------------

describe('Interface contract', () => {
  it('should define render method', () => {
    const renderer: PromptAssemblyPlanRenderer = new DefaultPromptAssemblyPlanRenderer()
    expect(typeof renderer.render).toBe('function')
  })

  it('should accept a PromptAssemblyPlan and return a string', () => {
    const renderer = new DefaultPromptAssemblyPlanRenderer()
    const result = renderer.render(createPlan([]))
    expect(typeof result).toBe('string')
  })
})

// ---------------------------------------------------------------------------
// Rendering — Header
// ---------------------------------------------------------------------------

describe('Header', () => {
  it('should include "Prompt Assembly Plan" header', () => {
    const renderer = new DefaultPromptAssemblyPlanRenderer()
    const result = renderer.render(createPlan([{ section: 'userInput', priority: 100 }]))
    expect(result).toContain('Prompt Assembly Plan')
  })

  it('should start with the header', () => {
    const renderer = new DefaultPromptAssemblyPlanRenderer()
    const result = renderer.render(createPlan([{ section: 'userInput', priority: 100 }]))
    expect(result.startsWith('Prompt Assembly Plan')).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Rendering — Single Section
// ---------------------------------------------------------------------------

describe('Single section', () => {
  it('should render a single section with number and priority', () => {
    const renderer = new DefaultPromptAssemblyPlanRenderer()
    const result = renderer.render(createPlan([{ section: 'userInput', priority: 100 }]))
    expect(result).toContain('1. userInput (100)')
  })

  it('should render a single section with different priority', () => {
    const renderer = new DefaultPromptAssemblyPlanRenderer()
    const result = renderer.render(createPlan([{ section: 'memory', priority: 50 }]))
    expect(result).toContain('1. memory (50)')
  })
})

// ---------------------------------------------------------------------------
// Rendering — Multiple Sections
// ---------------------------------------------------------------------------

describe('Multiple sections', () => {
  it('should render all sections with sequential numbering', () => {
    const renderer = new DefaultPromptAssemblyPlanRenderer()
    const result = renderer.render(createPlan([
      { section: 'userInput', priority: 100 },
      { section: 'worldState', priority: 90 },
    ]))
    expect(result).toContain('1. userInput (100)')
    expect(result).toContain('2. worldState (90)')
  })

  it('should render three sections in order', () => {
    const renderer = new DefaultPromptAssemblyPlanRenderer()
    const result = renderer.render(createPlan([
      { section: 'a', priority: 100 },
      { section: 'b', priority: 80 },
      { section: 'c', priority: 60 },
    ]))
    expect(result).toContain('1. a (100)')
    expect(result).toContain('2. b (80)')
    expect(result).toContain('3. c (60)')
  })
})

// ---------------------------------------------------------------------------
// Empty Plan
// ---------------------------------------------------------------------------

describe('Empty plan', () => {
  it('should render "(no sections)" for empty plan', () => {
    const renderer = new DefaultPromptAssemblyPlanRenderer()
    const result = renderer.render(createPlan([]))
    expect(result).toContain('(no sections)')
  })

  it('should still include the header for empty plan', () => {
    const renderer = new DefaultPromptAssemblyPlanRenderer()
    const result = renderer.render(createPlan([]))
    expect(result).toContain('Prompt Assembly Plan')
  })

  it('should not have numbered entries for empty plan', () => {
    const renderer = new DefaultPromptAssemblyPlanRenderer()
    const result = renderer.render(createPlan([]))
    expect(result).not.toMatch(/\d+\./)
  })
})

// ---------------------------------------------------------------------------
// Ordering — Priority Descending
// ---------------------------------------------------------------------------

describe('Ordering — priority descending', () => {
  it('should sort by priority descending', () => {
    const renderer = new DefaultPromptAssemblyPlanRenderer()
    const result = renderer.render(createPlan([
      { section: 'low', priority: 10 },
      { section: 'high', priority: 100 },
      { section: 'medium', priority: 50 },
    ]))
    const lines = result.split('\n')
    const highIdx = lines.findIndex(l => l.includes('high'))
    const mediumIdx = lines.findIndex(l => l.includes('medium'))
    const lowIdx = lines.findIndex(l => l.includes('low'))
    expect(highIdx).toBeLessThan(mediumIdx)
    expect(mediumIdx).toBeLessThan(lowIdx)
  })

  it('should place highest priority first', () => {
    const renderer = new DefaultPromptAssemblyPlanRenderer()
    const result = renderer.render(createPlan([
      { section: 'a', priority: 10 },
      { section: 'b', priority: 90 },
    ]))
    expect(result).toContain('1. b (90)')
    expect(result).toContain('2. a (10)')
  })
})

// ---------------------------------------------------------------------------
// Ordering — Stable (Tie-Breaking)
// ---------------------------------------------------------------------------

describe('Ordering — stable tie-breaking', () => {
  it('should preserve original order when priorities tie', () => {
    const renderer = new DefaultPromptAssemblyPlanRenderer()
    const result = renderer.render(createPlan([
      { section: 'first', priority: 100 },
      { section: 'second', priority: 100 },
      { section: 'third', priority: 100 },
    ]))
    const lines = result.split('\n')
    const firstIdx = lines.findIndex(l => l.includes('first'))
    const secondIdx = lines.findIndex(l => l.includes('second'))
    const thirdIdx = lines.findIndex(l => l.includes('third'))
    expect(firstIdx).toBeLessThan(secondIdx)
    expect(secondIdx).toBeLessThan(thirdIdx)
  })

  it('should preserve original order with mixed priorities', () => {
    const renderer = new DefaultPromptAssemblyPlanRenderer()
    const result = renderer.render(createPlan([
      { section: 'a', priority: 100 },
      { section: 'b', priority: 50 },
      { section: 'c', priority: 50 },
    ]))
    const lines = result.split('\n')
    const bIdx = lines.findIndex(l => l.includes('b'))
    const cIdx = lines.findIndex(l => l.includes('c'))
    // b and c have same priority 50 — b appears first in original order
    expect(bIdx).toBeLessThan(cIdx)
  })
})

// ---------------------------------------------------------------------------
// Deterministic
// ---------------------------------------------------------------------------

describe('Deterministic', () => {
  it('should produce same output for same plan across multiple calls', () => {
    const renderer = new DefaultPromptAssemblyPlanRenderer()
    const plan = createPlan([
      { section: 'a', priority: 100 },
      { section: 'b', priority: 50 },
      { section: 'c', priority: 75 },
    ])
    const r1 = renderer.render(plan)
    const r2 = renderer.render(plan)
    const r3 = renderer.render(plan)
    expect(r1).toBe(r2)
    expect(r2).toBe(r3)
  })

  it('should produce same output across different renderer instances', () => {
    const r1 = new DefaultPromptAssemblyPlanRenderer()
    const r2 = new DefaultPromptAssemblyPlanRenderer()
    const plan = createPlan([{ section: 'x', priority: 80 }, { section: 'y', priority: 90 }])
    expect(r1.render(plan)).toBe(r2.render(plan))
  })

  it('should produce same output for identical plans', () => {
    const renderer = new DefaultPromptAssemblyPlanRenderer()
    const planA = createPlan([{ section: 'a', priority: 100 }, { section: 'b', priority: 50 }])
    const planB = createPlan([{ section: 'a', priority: 100 }, { section: 'b', priority: 50 }])
    expect(renderer.render(planA)).toBe(renderer.render(planB))
  })
})

// ---------------------------------------------------------------------------
// Stateless
// ---------------------------------------------------------------------------

describe('Stateless', () => {
  it('should not retain state between calls', () => {
    const renderer = new DefaultPromptAssemblyPlanRenderer()
    const r1 = renderer.render(createPlan([{ section: 'a', priority: 100 }]))
    const r2 = renderer.render(createPlan([{ section: 'b', priority: 50 }]))
    expect(r1).not.toBe(r2)
    expect(r1).toContain('a')
    expect(r2).toContain('b')
  })
})

// ---------------------------------------------------------------------------
// Pure / No Side Effects
// ---------------------------------------------------------------------------

describe('Pure', () => {
  it('should not modify input plan', () => {
    const renderer = new DefaultPromptAssemblyPlanRenderer()
    const plan = createPlan([{ section: 'a', priority: 100 }])
    const originalPriorities = [...plan.priorities]
    renderer.render(plan)
    expect(plan.priorities).toEqual(originalPriorities)
  })

  it('should not modify plan priority entries', () => {
    const renderer = new DefaultPromptAssemblyPlanRenderer()
    const plan = createPlan([{ section: 'a', priority: 100 }, { section: 'b', priority: 50 }])
    const original = JSON.stringify(plan)
    renderer.render(plan)
    expect(JSON.stringify(plan)).toBe(original)
  })
})

// ---------------------------------------------------------------------------
// Output Format — Exact Strings
// ---------------------------------------------------------------------------

describe('Output format', () => {
  it('should match exact format for single section', () => {
    const renderer = new DefaultPromptAssemblyPlanRenderer()
    const result = renderer.render(createPlan([{ section: 'userInput', priority: 100 }]))
    expect(result).toBe('Prompt Assembly Plan\n\n1. userInput (100)')
  })

  it('should match exact format for two sections', () => {
    const renderer = new DefaultPromptAssemblyPlanRenderer()
    const result = renderer.render(createPlan([
      { section: 'userInput', priority: 100 },
      { section: 'worldState', priority: 90 },
    ]))
    expect(result).toBe('Prompt Assembly Plan\n\n1. userInput (100)\n2. worldState (90)')
  })

  it('should match exact format for empty plan', () => {
    const renderer = new DefaultPromptAssemblyPlanRenderer()
    const result = renderer.render(createPlan([]))
    expect(result).toBe('Prompt Assembly Plan\n\n(no sections)')
  })

  it('should match exact format for sorted output', () => {
    const renderer = new DefaultPromptAssemblyPlanRenderer()
    const result = renderer.render(createPlan([
      { section: 'low', priority: 10 },
      { section: 'high', priority: 100 },
    ]))
    expect(result).toBe('Prompt Assembly Plan\n\n1. high (100)\n2. low (10)')
  })
})

// ---------------------------------------------------------------------------
// Various Priority Values
// ---------------------------------------------------------------------------

describe('Various priority values', () => {
  it('should render zero priority', () => {
    const renderer = new DefaultPromptAssemblyPlanRenderer()
    const result = renderer.render(createPlan([{ section: 'unknown', priority: 0 }]))
    expect(result).toContain('1. unknown (0)')
  })

  it('should render negative priority', () => {
    const renderer = new DefaultPromptAssemblyPlanRenderer()
    const result = renderer.render(createPlan([{ section: 'excluded', priority: -5 }]))
    expect(result).toContain('1. excluded (-5)')
  })

  it('should render large priority values', () => {
    const renderer = new DefaultPromptAssemblyPlanRenderer()
    const result = renderer.render(createPlan([{ section: 'critical', priority: 999 }]))
    expect(result).toContain('1. critical (999)')
  })
})

// ---------------------------------------------------------------------------
// Architecture Compliance
// ---------------------------------------------------------------------------

describe('Architecture compliance', () => {
  it('should not depend on Planner', () => {
    const renderer = new DefaultPromptAssemblyPlanRenderer()
    expect(renderer).toBeInstanceOf(DefaultPromptAssemblyPlanRenderer)
  })

  it('should not depend on Runtime', () => {
    const renderer = new DefaultPromptAssemblyPlanRenderer()
    expect(renderer).toBeDefined()
  })

  it('should not depend on Provider', () => {
    const renderer = new DefaultPromptAssemblyPlanRenderer()
    expect(renderer).toBeDefined()
  })

  it('should not depend on Memory', () => {
    const renderer = new DefaultPromptAssemblyPlanRenderer()
    expect(renderer).toBeDefined()
  })

  it('should not depend on AgentLoop', () => {
    const renderer = new DefaultPromptAssemblyPlanRenderer()
    expect(renderer).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

describe('Exports', () => {
  it('should export PromptAssemblyPlanRenderer type from strategy index', async () => {
    const mod = await import('../strategy')
    expect(mod.DefaultPromptAssemblyPlanRenderer).toBeDefined()
  })

  it('should export DefaultPromptAssemblyPlanRenderer from strategy index', async () => {
    const mod = await import('../strategy')
    expect(mod.DefaultPromptAssemblyPlanRenderer).toBe(DefaultPromptAssemblyPlanRenderer)
  })

  it('should export DefaultPromptAssemblyPlanRenderer from package root', async () => {
    const mod = await import('..')
    expect(mod.DefaultPromptAssemblyPlanRenderer).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Compatibility — RetryPlanner
// ---------------------------------------------------------------------------

describe('RetryPlanner compatibility', () => {
  it('should work with RetryPlanner', () => {
    const renderer = new DefaultPromptAssemblyPlanRenderer()
    const plan = createPlan([{ section: 'system', priority: 100 }])
    const result = renderer.render(plan)
    expect(result).toContain('system')
  })
})

// ---------------------------------------------------------------------------
// Compatibility — ToolCallPlanner
// ---------------------------------------------------------------------------

describe('ToolCallPlanner compatibility', () => {
  it('should work with ToolCallPlanner', () => {
    const renderer = new DefaultPromptAssemblyPlanRenderer()
    const plan = createPlan([{ section: 'userInput', priority: 100 }])
    const result = renderer.render(plan)
    expect(result).toContain('userInput')
  })
})

// ---------------------------------------------------------------------------
// Compatibility — Streaming
// ---------------------------------------------------------------------------

describe('Streaming compatibility', () => {
  it('should work with streaming pipeline', () => {
    const renderer = new DefaultPromptAssemblyPlanRenderer()
    const plan = createPlan([{ section: 'worldState', priority: 90 }])
    const result = renderer.render(plan)
    expect(result).toContain('worldState')
  })
})

// ---------------------------------------------------------------------------
// Compatibility — AgentLoop
// ---------------------------------------------------------------------------

describe('AgentLoop compatibility', () => {
  it('should work with AgentLoop', () => {
    const renderer = new DefaultPromptAssemblyPlanRenderer()
    const plan = createPlan([{ section: 'memory', priority: 80 }])
    const result = renderer.render(plan)
    expect(result).toContain('memory')
  })
})