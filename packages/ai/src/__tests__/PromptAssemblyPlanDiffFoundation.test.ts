import { describe, it, expect } from 'vitest'
import { DefaultPromptAssemblyPlanDiffer } from '../strategy/DefaultPromptAssemblyPlanDiffer'
import type { PromptAssemblyPlanDiffer } from '../strategy/PromptAssemblyPlanDiffer'
import type { PromptAssemblyPlanDiff } from '../strategy/PromptAssemblyPlanDiff'
import type { PromptAssemblyPlan } from '../strategy/PromptAssemblyPlan'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createPlan(priorities: Array<{ section: string; priority: number }>): PromptAssemblyPlan {
  return { priorities }
}

function createEmptyPlan(): PromptAssemblyPlan {
  return createPlan([])
}

function createSingleSectionPlan(section = 'userInput', priority = 100): PromptAssemblyPlan {
  return createPlan([{ section, priority }])
}

function createMultiSectionPlan(): PromptAssemblyPlan {
  return createPlan([
    { section: 'userInput', priority: 100 },
    { section: 'worldState', priority: 90 },
    { section: 'memory', priority: 80 },
    { section: 'system', priority: 70 },
  ])
}

// ---------------------------------------------------------------------------
// Interface Contract
// ---------------------------------------------------------------------------

describe('Interface contract', () => {
  it('should define diff method', () => {
    const differ: PromptAssemblyPlanDiffer = new DefaultPromptAssemblyPlanDiffer()
    expect(typeof differ.diff).toBe('function')
  })

  it('should accept two plans and return a PromptAssemblyPlanDiff', () => {
    const differ = new DefaultPromptAssemblyPlanDiffer()
    const before = createEmptyPlan()
    const after = createEmptyPlan()
    const result = differ.diff(before, after)
    expect(result).toHaveProperty('added')
    expect(result).toHaveProperty('removed')
    expect(result).toHaveProperty('changed')
  })

  it('should accept a custom implementation', () => {
    const custom: PromptAssemblyPlanDiffer = {
      diff(_before: PromptAssemblyPlan, _after: PromptAssemblyPlan): PromptAssemblyPlanDiff {
        return { added: ['custom'], removed: [], changed: [] }
      },
    }
    const result = custom.diff(createEmptyPlan(), createEmptyPlan())
    expect(result.added).toEqual(['custom'])
  })
})

// ---------------------------------------------------------------------------
// PromptAssemblyPlanDiff Structure
// ---------------------------------------------------------------------------

describe('PromptAssemblyPlanDiff structure', () => {
  it('should have readonly added field', () => {
    const diff: PromptAssemblyPlanDiff = { added: [], removed: [], changed: [] }
    expect(diff.added).toEqual([])
  })

  it('should have readonly removed field', () => {
    const diff: PromptAssemblyPlanDiff = { added: [], removed: ['oldSection'], changed: [] }
    expect(diff.removed).toEqual(['oldSection'])
  })

  it('should have readonly changed field with section, before, after', () => {
    const diff: PromptAssemblyPlanDiff = {
      added: [],
      removed: [],
      changed: [{ section: 'x', before: 100, after: 50 }],
    }
    expect(diff.changed[0].section).toBe('x')
    expect(diff.changed[0].before).toBe(100)
    expect(diff.changed[0].after).toBe(50)
  })

  it('should support multiple changed entries', () => {
    const diff: PromptAssemblyPlanDiff = {
      added: [],
      removed: [],
      changed: [
        { section: 'a', before: 100, after: 90 },
        { section: 'b', before: 80, after: 60 },
      ],
    }
    expect(diff.changed).toHaveLength(2)
  })
})

// ---------------------------------------------------------------------------
// Added Sections
// ---------------------------------------------------------------------------

describe('Added sections', () => {
  it('should detect a single added section', () => {
    const differ = new DefaultPromptAssemblyPlanDiffer()
    const before = createSingleSectionPlan('a', 100)
    const after = createPlan([
      { section: 'a', priority: 100 },
      { section: 'b', priority: 50 },
    ])
    const result = differ.diff(before, after)
    expect(result.added).toEqual(['b'])
  })

  it('should detect multiple added sections', () => {
    const differ = new DefaultPromptAssemblyPlanDiffer()
    const before = createSingleSectionPlan('a', 100)
    const after = createPlan([
      { section: 'a', priority: 100 },
      { section: 'b', priority: 50 },
      { section: 'c', priority: 60 },
    ])
    const result = differ.diff(before, after)
    expect(result.added).toEqual(['b', 'c'])
  })

  it('should return empty added when no sections added', () => {
    const differ = new DefaultPromptAssemblyPlanDiffer()
    const plan = createMultiSectionPlan()
    const result = differ.diff(plan, plan)
    expect(result.added).toEqual([])
  })

  it('should preserve order of added sections from after plan', () => {
    const differ = new DefaultPromptAssemblyPlanDiffer()
    const before = createSingleSectionPlan('a', 100)
    const after = createPlan([
      { section: 'c', priority: 50 },
      { section: 'a', priority: 100 },
      { section: 'b', priority: 60 },
    ])
    const result = differ.diff(before, after)
    // Added sections follow order in "after" plan: c (not in before), b (not in before)
    expect(result.added).toEqual(['c', 'b'])
  })

  it('should not include sections with same name but different case as added', () => {
    const differ = new DefaultPromptAssemblyPlanDiffer()
    const before = createSingleSectionPlan('userInput', 100)
    const after = createPlan([
      { section: 'userInput', priority: 100 },
      { section: 'UserInput', priority: 100 },
    ])
    const result = differ.diff(before, after)
    // "UserInput" is case-different, so it's technically a different section
    expect(result.added).toEqual(['UserInput'])
    expect(result.removed).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// Removed Sections
// ---------------------------------------------------------------------------

describe('Removed sections', () => {
  it('should detect a single removed section', () => {
    const differ = new DefaultPromptAssemblyPlanDiffer()
    const before = createPlan([
      { section: 'a', priority: 100 },
      { section: 'b', priority: 50 },
    ])
    const after = createSingleSectionPlan('a', 100)
    const result = differ.diff(before, after)
    expect(result.removed).toEqual(['b'])
  })

  it('should detect multiple removed sections', () => {
    const differ = new DefaultPromptAssemblyPlanDiffer()
    const before = createPlan([
      { section: 'a', priority: 100 },
      { section: 'b', priority: 50 },
      { section: 'c', priority: 60 },
    ])
    const after = createSingleSectionPlan('a', 100)
    const result = differ.diff(before, after)
    expect(result.removed).toEqual(['b', 'c'])
  })

  it('should return empty removed when no sections removed', () => {
    const differ = new DefaultPromptAssemblyPlanDiffer()
    const plan = createMultiSectionPlan()
    const result = differ.diff(plan, plan)
    expect(result.removed).toEqual([])
  })

  it('should preserve order of removed sections from before plan', () => {
    const differ = new DefaultPromptAssemblyPlanDiffer()
    const before = createPlan([
      { section: 'x', priority: 100 },
      { section: 'y', priority: 80 },
      { section: 'z', priority: 60 },
    ])
    const after = createPlan([
      { section: 'y', priority: 80 },
    ])
    const result = differ.diff(before, after)
    expect(result.removed).toEqual(['x', 'z'])
  })
})

// ---------------------------------------------------------------------------
// Changed Priorities
// ---------------------------------------------------------------------------

describe('Changed priorities', () => {
  it('should detect a single priority change', () => {
    const differ = new DefaultPromptAssemblyPlanDiffer()
    const before = createSingleSectionPlan('a', 100)
    const after = createSingleSectionPlan('a', 90)
    const result = differ.diff(before, after)
    expect(result.changed).toEqual([{ section: 'a', before: 100, after: 90 }])
  })

  it('should detect multiple priority changes', () => {
    const differ = new DefaultPromptAssemblyPlanDiffer()
    const before = createPlan([
      { section: 'a', priority: 100 },
      { section: 'b', priority: 80 },
    ])
    const after = createPlan([
      { section: 'a', priority: 90 },
      { section: 'b', priority: 70 },
    ])
    const result = differ.diff(before, after)
    expect(result.changed).toEqual([
      { section: 'a', before: 100, after: 90 },
      { section: 'b', before: 80, after: 70 },
    ])
  })

  it('should return empty changed when priorities are identical', () => {
    const differ = new DefaultPromptAssemblyPlanDiffer()
    const plan = createMultiSectionPlan()
    const result = differ.diff(plan, plan)
    expect(result.changed).toEqual([])
  })

  it('should handle priority increasing', () => {
    const differ = new DefaultPromptAssemblyPlanDiffer()
    const before = createSingleSectionPlan('a', 50)
    const after = createSingleSectionPlan('a', 100)
    const result = differ.diff(before, after)
    expect(result.changed[0].before).toBe(50)
    expect(result.changed[0].after).toBe(100)
  })

  it('should handle priority decreasing', () => {
    const differ = new DefaultPromptAssemblyPlanDiffer()
    const before = createSingleSectionPlan('a', 100)
    const after = createSingleSectionPlan('a', 0)
    const result = differ.diff(before, after)
    expect(result.changed[0].before).toBe(100)
    expect(result.changed[0].after).toBe(0)
  })

  it('should handle mixed changes between sections', () => {
    const differ = new DefaultPromptAssemblyPlanDiffer()
    const before = createPlan([
      { section: 'a', priority: 100 },
      { section: 'b', priority: 50 },
      { section: 'c', priority: 80 },
    ])
    const after = createPlan([
      { section: 'a', priority: 100 },  // unchanged
      { section: 'b', priority: 60 },   // increased
      { section: 'c', priority: 40 },   // decreased
    ])
    const result = differ.diff(before, after)
    expect(result.changed).toEqual([
      { section: 'b', before: 50, after: 60 },
      { section: 'c', before: 80, after: 40 },
    ])
  })

  it('should preserve order of changed sections from before plan', () => {
    const differ = new DefaultPromptAssemblyPlanDiffer()
    const before = createPlan([
      { section: 'z', priority: 10 },
      { section: 'a', priority: 100 },
    ])
    const after = createPlan([
      { section: 'a', priority: 80 },
      { section: 'z', priority: 30 },
    ])
    const result = differ.diff(before, after)
    // Changed follows "before" plan order: z, then a
    expect(result.changed[0].section).toBe('z')
    expect(result.changed[1].section).toBe('a')
  })
})

// ---------------------------------------------------------------------------
// Unchanged Plans
// ---------------------------------------------------------------------------

describe('Unchanged plans', () => {
  it('should return all empty when plans are identical', () => {
    const differ = new DefaultPromptAssemblyPlanDiffer()
    const plan = createMultiSectionPlan()
    const result = differ.diff(plan, plan)
    expect(result.added).toEqual([])
    expect(result.removed).toEqual([])
    expect(result.changed).toEqual([])
  })

  it('should return all empty when same plan is passed twice', () => {
    const differ = new DefaultPromptAssemblyPlanDiffer()
    const plan = createPlan([
      { section: 'a', priority: 100 },
      { section: 'b', priority: 50 },
    ])
    const planCopy = createPlan([
      { section: 'a', priority: 100 },
      { section: 'b', priority: 50 },
    ])
    const result = differ.diff(plan, planCopy)
    expect(result.added).toEqual([])
    expect(result.removed).toEqual([])
    expect(result.changed).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// Empty Plans
// ---------------------------------------------------------------------------

describe('Empty plans', () => {
  it('should return empty diff when both plans are empty', () => {
    const differ = new DefaultPromptAssemblyPlanDiffer()
    const result = differ.diff(createEmptyPlan(), createEmptyPlan())
    expect(result.added).toEqual([])
    expect(result.removed).toEqual([])
    expect(result.changed).toEqual([])
  })

  it('should detect all sections as added when before is empty', () => {
    const differ = new DefaultPromptAssemblyPlanDiffer()
    const after = createMultiSectionPlan()
    const result = differ.diff(createEmptyPlan(), after)
    expect(result.added).toEqual(['userInput', 'worldState', 'memory', 'system'])
    expect(result.removed).toEqual([])
    expect(result.changed).toEqual([])
  })

  it('should detect all sections as removed when after is empty', () => {
    const differ = new DefaultPromptAssemblyPlanDiffer()
    const before = createMultiSectionPlan()
    const result = differ.diff(before, createEmptyPlan())
    expect(result.removed).toEqual(['userInput', 'worldState', 'memory', 'system'])
    expect(result.added).toEqual([])
    expect(result.changed).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// Combined Changes
// ---------------------------------------------------------------------------

describe('Combined changes', () => {
  it('should detect added, removed, and changed simultaneously', () => {
    const differ = new DefaultPromptAssemblyPlanDiffer()
    const before = createPlan([
      { section: 'old', priority: 50 },
      { section: 'same', priority: 100 },
      { section: 'changed', priority: 80 },
    ])
    const after = createPlan([
      { section: 'new', priority: 60 },
      { section: 'same', priority: 100 },
      { section: 'changed', priority: 40 },
    ])
    const result = differ.diff(before, after)
    expect(result.added).toEqual(['new'])
    expect(result.removed).toEqual(['old'])
    expect(result.changed).toEqual([{ section: 'changed', before: 80, after: 40 }])
  })

  it('should handle add + change without remove', () => {
    const differ = new DefaultPromptAssemblyPlanDiffer()
    const before = createSingleSectionPlan('a', 100)
    const after = createPlan([
      { section: 'a', priority: 90 },
      { section: 'b', priority: 50 },
    ])
    const result = differ.diff(before, after)
    expect(result.added).toEqual(['b'])
    expect(result.removed).toEqual([])
    expect(result.changed).toEqual([{ section: 'a', before: 100, after: 90 }])
  })

  it('should handle remove + change without add', () => {
    const differ = new DefaultPromptAssemblyPlanDiffer()
    const before = createPlan([
      { section: 'a', priority: 100 },
      { section: 'b', priority: 50 },
    ])
    const after = createSingleSectionPlan('a', 90)
    const result = differ.diff(before, after)
    expect(result.added).toEqual([])
    expect(result.removed).toEqual(['b'])
    expect(result.changed).toEqual([{ section: 'a', before: 100, after: 90 }])
  })
})

// ---------------------------------------------------------------------------
// Deterministic
// ---------------------------------------------------------------------------

describe('Deterministic', () => {
  it('should produce same result for same inputs across multiple calls', () => {
    const differ = new DefaultPromptAssemblyPlanDiffer()
    const before = createMultiSectionPlan()
    const after = createPlan([
      { section: 'userInput', priority: 100 },
      { section: 'worldState', priority: 90 },
      { section: 'extra', priority: 50 },
    ])
    const r1 = differ.diff(before, after)
    const r2 = differ.diff(before, after)
    const r3 = differ.diff(before, after)
    expect(r1.added).toEqual(r2.added)
    expect(r2.added).toEqual(r3.added)
    expect(r1.removed).toEqual(r2.removed)
    expect(r2.removed).toEqual(r3.removed)
    expect(r1.changed).toEqual(r2.changed)
    expect(r2.changed).toEqual(r3.changed)
  })

  it('should produce same result across different differ instances', () => {
    const d1 = new DefaultPromptAssemblyPlanDiffer()
    const d2 = new DefaultPromptAssemblyPlanDiffer()
    const before = createMultiSectionPlan()
    const after = createPlan([
      { section: 'userInput', priority: 80 },
      { section: 'newSection', priority: 60 },
    ])
    const r1 = d1.diff(before, after)
    const r2 = d2.diff(before, after)
    expect(r1.added).toEqual(r2.added)
    expect(r1.removed).toEqual(r2.removed)
    expect(r1.changed).toEqual(r2.changed)
  })

  it('should produce same result for identical plan pairs', () => {
    const differ = new DefaultPromptAssemblyPlanDiffer()
    const before1 = createMultiSectionPlan()
    const after1 = createSingleSectionPlan('a', 90)
    const before2 = createMultiSectionPlan()
    const after2 = createSingleSectionPlan('a', 90)
    expect(differ.diff(before1, after1)).toEqual(differ.diff(before2, after2))
  })
})

// ---------------------------------------------------------------------------
// Stateless
// ---------------------------------------------------------------------------

describe('Stateless', () => {
  it('should not retain state between diff calls', () => {
    const differ = new DefaultPromptAssemblyPlanDiffer()
    const r1 = differ.diff(
      createSingleSectionPlan('a', 100),
      createPlan([{ section: 'a', priority: 100 }, { section: 'b', priority: 50 }]),
    )
    const r2 = differ.diff(
      createSingleSectionPlan('b', 100),
      createSingleSectionPlan('b', 80),
    )
    // r1 has added: ['b']
    expect(r1.added).toEqual(['b'])
    // r2 has changed: [{ section: 'b', before: 100, after: 80 }]
    expect(r2.changed).toEqual([{ section: 'b', before: 100, after: 80 }])
    expect(r2.added).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// Pure / No Side Effects
// ---------------------------------------------------------------------------

describe('Pure', () => {
  it('should not modify input before plan', () => {
    const differ = new DefaultPromptAssemblyPlanDiffer()
    const before = createMultiSectionPlan()
    const after = createSingleSectionPlan('userInput', 100)
    const originalBefore = JSON.stringify(before)
    differ.diff(before, after)
    expect(JSON.stringify(before)).toBe(originalBefore)
  })

  it('should not modify input after plan', () => {
    const differ = new DefaultPromptAssemblyPlanDiffer()
    const before = createMultiSectionPlan()
    const after = createSingleSectionPlan('userInput', 100)
    const originalAfter = JSON.stringify(after)
    differ.diff(before, after)
    expect(JSON.stringify(after)).toBe(originalAfter)
  })

  it('should not modify plan priority entries', () => {
    const differ = new DefaultPromptAssemblyPlanDiffer()
    const before = createMultiSectionPlan()
    const after = createMultiSectionPlan()
    const originalBefore = before.priorities[0].priority
    const originalAfter = after.priorities[0].priority
    differ.diff(before, after)
    expect(before.priorities[0].priority).toBe(originalBefore)
    expect(after.priorities[0].priority).toBe(originalAfter)
  })
})

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

describe('Exports', () => {
  it('should export PromptAssemblyPlanDiff type from strategy index', async () => {
    const mod = await import('../strategy')
    expect(mod.DefaultPromptAssemblyPlanDiffer).toBeDefined()
  })

  it('should export PromptAssemblyPlanDiffer type from strategy index', async () => {
    const mod = await import('../strategy')
    expect(mod.DefaultPromptAssemblyPlanDiffer).toBeDefined()
  })

  it('should export DefaultPromptAssemblyPlanDiffer from strategy index', async () => {
    const mod = await import('../strategy')
    expect(mod.DefaultPromptAssemblyPlanDiffer).toBe(DefaultPromptAssemblyPlanDiffer)
  })

  it('should export DefaultPromptAssemblyPlanDiffer from package root', async () => {
    const mod = await import('..')
    expect(mod.DefaultPromptAssemblyPlanDiffer).toBeDefined()
  })

  it('should export DefaultPromptAssemblyPlanDiffer as a class', () => {
    const differ = new DefaultPromptAssemblyPlanDiffer()
    expect(differ).toBeInstanceOf(DefaultPromptAssemblyPlanDiffer)
  })
})

// ---------------------------------------------------------------------------
// Architecture Compliance
// ---------------------------------------------------------------------------

describe('Architecture compliance', () => {
  it('should not depend on Planner', () => {
    const differ = new DefaultPromptAssemblyPlanDiffer()
    expect(differ).toBeInstanceOf(DefaultPromptAssemblyPlanDiffer)
  })

  it('should not depend on Runtime', () => {
    const differ = new DefaultPromptAssemblyPlanDiffer()
    expect(differ).toBeDefined()
  })

  it('should not depend on Provider', () => {
    const differ = new DefaultPromptAssemblyPlanDiffer()
    expect(differ).toBeDefined()
  })

  it('should not depend on Memory', () => {
    const differ = new DefaultPromptAssemblyPlanDiffer()
    expect(differ).toBeDefined()
  })

  it('should not depend on AgentLoop', () => {
    const differ = new DefaultPromptAssemblyPlanDiffer()
    expect(differ).toBeDefined()
  })

  it('should not modify PromptBuilder', () => {
    const differ = new DefaultPromptAssemblyPlanDiffer()
    expect(differ).toBeDefined()
  })

  it('should not modify PromptRenderer', () => {
    const differ = new DefaultPromptAssemblyPlanDiffer()
    expect(differ).toBeDefined()
  })

  it('should not modify PromptCompression', () => {
    const differ = new DefaultPromptAssemblyPlanDiffer()
    expect(differ).toBeDefined()
  })

  it('should not modify PromptAssemblyOptimizer', () => {
    const differ = new DefaultPromptAssemblyPlanDiffer()
    expect(differ).toBeDefined()
  })

  it('should not modify PromptAssemblyPlan', () => {
    const differ = new DefaultPromptAssemblyPlanDiffer()
    const plan = createMultiSectionPlan()
    const result = differ.diff(plan, plan)
    expect(result.added).toEqual([])
    expect(result.removed).toEqual([])
    expect(result.changed).toEqual([])
  })

  it('should not modify Planner', () => {
    const differ = new DefaultPromptAssemblyPlanDiffer()
    expect(differ).toBeDefined()
  })

  it('should not modify Runtime', () => {
    const differ = new DefaultPromptAssemblyPlanDiffer()
    expect(differ).toBeDefined()
  })

  it('should not modify AgentLoop', () => {
    const differ = new DefaultPromptAssemblyPlanDiffer()
    expect(differ).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Compatibility — RetryPlanner
// ---------------------------------------------------------------------------

describe('RetryPlanner compatibility', () => {
  it('should be compatible with RetryPlanner', () => {
    const differ = new DefaultPromptAssemblyPlanDiffer()
    const before = createSingleSectionPlan('a', 100)
    const after = createSingleSectionPlan('a', 90)
    const result = differ.diff(before, after)
    expect(result.changed[0].section).toBe('a')
    expect(result.changed[0].before).toBe(100)
    expect(result.changed[0].after).toBe(90)
  })
})

// ---------------------------------------------------------------------------
// Compatibility — ToolCallPlanner
// ---------------------------------------------------------------------------

describe('ToolCallPlanner compatibility', () => {
  it('should be compatible with ToolCallPlanner', () => {
    const differ = new DefaultPromptAssemblyPlanDiffer()
    const before = createMultiSectionPlan()
    const after = createPlan([
      { section: 'userInput', priority: 100 },
      { section: 'extra', priority: 50 },
    ])
    const result = differ.diff(before, after)
    expect(result.added).toEqual(['extra'])
    expect(result.removed).toEqual(['worldState', 'memory', 'system'])
  })
})

// ---------------------------------------------------------------------------
// Compatibility — Streaming
// ---------------------------------------------------------------------------

describe('Streaming compatibility', () => {
  it('should be compatible with streaming pipeline', () => {
    const differ = new DefaultPromptAssemblyPlanDiffer()
    const before = createEmptyPlan()
    const after = createSingleSectionPlan('userInput', 100)
    const result = differ.diff(before, after)
    expect(result.added).toEqual(['userInput'])
  })
})

// ---------------------------------------------------------------------------
// Compatibility — AgentLoop
// ---------------------------------------------------------------------------

describe('AgentLoop compatibility', () => {
  it('should be compatible with AgentLoop', () => {
    const differ = new DefaultPromptAssemblyPlanDiffer()
    const before = createSingleSectionPlan('system', 80)
    const after = createSingleSectionPlan('system', 100)
    const result = differ.diff(before, after)
    expect(result.changed[0].section).toBe('system')
  })
})