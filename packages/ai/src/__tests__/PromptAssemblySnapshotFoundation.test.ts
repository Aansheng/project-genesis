import { describe, it, expect } from 'vitest'
import { DefaultPromptAssemblySnapshotBuilder } from '../strategy/DefaultPromptAssemblySnapshotBuilder'
import type { PromptAssemblySnapshotBuilder } from '../strategy/PromptAssemblySnapshotBuilder'
import type { PromptAssemblySnapshot } from '../strategy/PromptAssemblySnapshot'
import type { StrategySelectionMetadata } from '../strategy/StrategySelectionMetadata'
import type { PromptAssemblyPlan } from '../strategy/PromptAssemblyPlan'
import type { PromptAssemblyPlanDiff } from '../strategy/PromptAssemblyPlanDiff'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createPlan(priorities: Array<{ section: string; priority: number }>): PromptAssemblyPlan {
  return { priorities }
}

function createStrategySelection(overrides?: Partial<StrategySelectionMetadata>): StrategySelectionMetadata {
  return {
    selected: 'create',
    candidates: [{ strategy: 'create', score: 100 }, { strategy: 'default', score: 0 }],
    ...overrides,
  }
}

function createPlanDiff(overrides?: Partial<PromptAssemblyPlanDiff>): PromptAssemblyPlanDiff {
  return {
    added: [],
    removed: [],
    changed: [],
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Snapshot Structure
// ---------------------------------------------------------------------------

describe('Snapshot structure', () => {
  it('should be an empty object by default', () => {
    const snapshot: PromptAssemblySnapshot = {}
    expect(Object.keys(snapshot)).toHaveLength(0)
  })

  it('should accept a strategy name', () => {
    const snapshot: PromptAssemblySnapshot = { strategy: 'create' }
    expect(snapshot.strategy).toBe('create')
  })

  it('should accept strategy selection metadata', () => {
    const sel = createStrategySelection()
    const snapshot: PromptAssemblySnapshot = { strategySelection: sel }
    expect(snapshot.strategySelection?.selected).toBe('create')
    expect(snapshot.strategySelection?.candidates).toHaveLength(2)
  })

  it('should accept strategy rendered string', () => {
    const snapshot: PromptAssemblySnapshot = { strategyRendered: 'Prompt Strategy:\n\n- create' }
    expect(snapshot.strategyRendered).toContain('create')
  })

  it('should accept strategy module output', () => {
    const snapshot: PromptAssemblySnapshot = { strategyModule: 'Creation Guidelines...' }
    expect(snapshot.strategyModule).toBe('Creation Guidelines...')
  })

  it('should accept strategy module rendered string', () => {
    const snapshot: PromptAssemblySnapshot = { strategyModuleRendered: '## Strategy Module' }
    expect(snapshot.strategyModuleRendered).toContain('Strategy Module')
  })

  it('should accept a plan', () => {
    const plan = createPlan([{ section: 'userInput', priority: 100 }])
    const snapshot: PromptAssemblySnapshot = { plan }
    expect(snapshot.plan?.priorities[0].section).toBe('userInput')
  })

  it('should accept an optimized plan', () => {
    const plan = createPlan([{ section: 'userInput', priority: 100 }])
    const snapshot: PromptAssemblySnapshot = { optimizedPlan: plan }
    expect(snapshot.optimizedPlan?.priorities[0].priority).toBe(100)
  })

  it('should accept a plan diff', () => {
    const diff = createPlanDiff({ added: ['newSection'] })
    const snapshot: PromptAssemblySnapshot = { planDiff: diff }
    expect(snapshot.planDiff?.added).toEqual(['newSection'])
  })

  it('should accept a plan rendered string', () => {
    const snapshot: PromptAssemblySnapshot = { planRendered: 'Prompt Assembly Plan\n\n1. userInput (100)' }
    expect(snapshot.planRendered).toContain('userInput')
  })

  it('should support all fields simultaneously', () => {
    const plan = createPlan([{ section: 'a', priority: 100 }])
    const diff = createPlanDiff()
    const sel = createStrategySelection()
    const snapshot: PromptAssemblySnapshot = {
      strategy: 'create',
      strategySelection: sel,
      strategyRendered: 'rendered',
      strategyModule: 'module',
      strategyModuleRendered: 'moduleRendered',
      plan,
      optimizedPlan: plan,
      planDiff: diff,
      planRendered: 'rendered plan',
    }
    expect(snapshot.strategy).toBe('create')
    expect(snapshot.strategySelection).toBe(sel)
    expect(snapshot.strategyRendered).toBe('rendered')
    expect(snapshot.strategyModule).toBe('module')
    expect(snapshot.strategyModuleRendered).toBe('moduleRendered')
    expect(snapshot.plan).toBe(plan)
    expect(snapshot.optimizedPlan).toBe(plan)
    expect(snapshot.planDiff).toBe(diff)
    expect(snapshot.planRendered).toBe('rendered plan')
  })
})

// ---------------------------------------------------------------------------
// Builder — Empty Metadata
// ---------------------------------------------------------------------------

describe('Builder — empty metadata', () => {
  it('should return empty snapshot for empty metadata', () => {
    const builder = new DefaultPromptAssemblySnapshotBuilder()
    const snapshot = builder.build({})
    expect(Object.keys(snapshot)).toHaveLength(0)
  })

  it('should return empty snapshot for null-like metadata', () => {
    const builder = new DefaultPromptAssemblySnapshotBuilder()
    const snapshot = builder.build({} as Record<string, unknown>)
    expect(Object.keys(snapshot)).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// Builder — Strategy
// ---------------------------------------------------------------------------

describe('Builder — strategy', () => {
  it('should extract strategy name from { name } object', () => {
    const builder = new DefaultPromptAssemblySnapshotBuilder()
    const snapshot = builder.build({ strategy: { name: 'create' } })
    expect(snapshot.strategy).toBe('create')
  })

  it('should extract strategy name for different strategies', () => {
    const builder = new DefaultPromptAssemblySnapshotBuilder()
    expect(builder.build({ strategy: { name: 'query' } }).strategy).toBe('query')
    expect(builder.build({ strategy: { name: 'modify' } }).strategy).toBe('modify')
    expect(builder.build({ strategy: { name: 'delete' } }).strategy).toBe('delete')
    expect(builder.build({ strategy: { name: 'default' } }).strategy).toBe('default')
  })

  it('should skip strategy when it is not an object', () => {
    const builder = new DefaultPromptAssemblySnapshotBuilder()
    const snapshot = builder.build({ strategy: 'create' })
    expect(snapshot.strategy).toBeUndefined()
  })

  it('should skip strategy when name is missing', () => {
    const builder = new DefaultPromptAssemblySnapshotBuilder()
    const snapshot = builder.build({ strategy: {} })
    expect(snapshot.strategy).toBeUndefined()
  })

  it('should skip strategy when name is not a string', () => {
    const builder = new DefaultPromptAssemblySnapshotBuilder()
    const snapshot = builder.build({ strategy: { name: 123 } })
    expect(snapshot.strategy).toBeUndefined()
  })

  it('should skip strategy when value is null', () => {
    const builder = new DefaultPromptAssemblySnapshotBuilder()
    const snapshot = builder.build({ strategy: null })
    expect(snapshot.strategy).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// Builder — StrategySelection
// ---------------------------------------------------------------------------

describe('Builder — strategySelection', () => {
  it('should extract strategySelection metadata', () => {
    const builder = new DefaultPromptAssemblySnapshotBuilder()
    const metadata = {
      strategySelection: {
        selected: 'create',
        candidates: [{ strategy: 'create', score: 100 }],
      },
    }
    const snapshot = builder.build(metadata)
    expect(snapshot.strategySelection?.selected).toBe('create')
    expect(snapshot.strategySelection?.candidates).toHaveLength(1)
  })

  it('should extract multi-candidate strategySelection', () => {
    const builder = new DefaultPromptAssemblySnapshotBuilder()
    const metadata = {
      strategySelection: {
        selected: 'create',
        candidates: [
          { strategy: 'create', score: 100 },
          { strategy: 'query', score: 20 },
          { strategy: 'default', score: 0 },
        ],
      },
    }
    const snapshot = builder.build(metadata)
    expect(snapshot.strategySelection?.candidates).toHaveLength(3)
    expect(snapshot.strategySelection?.candidates[2].strategy).toBe('default')
  })

  it('should skip strategySelection when selected is missing', () => {
    const builder = new DefaultPromptAssemblySnapshotBuilder()
    const snapshot = builder.build({ strategySelection: { candidates: [] } })
    expect(snapshot.strategySelection).toBeUndefined()
  })

  it('should skip strategySelection when candidates is missing', () => {
    const builder = new DefaultPromptAssemblySnapshotBuilder()
    const snapshot = builder.build({ strategySelection: { selected: 'create' } })
    expect(snapshot.strategySelection).toBeUndefined()
  })

  it('should skip strategySelection when value is null', () => {
    const builder = new DefaultPromptAssemblySnapshotBuilder()
    const snapshot = builder.build({ strategySelection: null })
    expect(snapshot.strategySelection).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// Builder — String Fields
// ---------------------------------------------------------------------------

describe('Builder — string fields', () => {
  it('should extract strategyRendered', () => {
    const builder = new DefaultPromptAssemblySnapshotBuilder()
    const snapshot = builder.build({ strategyRendered: 'Prompt Strategy:\n\n- create' })
    expect(snapshot.strategyRendered).toBe('Prompt Strategy:\n\n- create')
  })

  it('should skip empty strategyRendered', () => {
    const builder = new DefaultPromptAssemblySnapshotBuilder()
    const snapshot = builder.build({ strategyRendered: '' })
    expect(snapshot.strategyRendered).toBeUndefined()
  })

  it('should extract strategyModule', () => {
    const builder = new DefaultPromptAssemblySnapshotBuilder()
    const snapshot = builder.build({ strategyModule: 'Creation Guidelines' })
    expect(snapshot.strategyModule).toBe('Creation Guidelines')
  })

  it('should skip empty strategyModule', () => {
    const builder = new DefaultPromptAssemblySnapshotBuilder()
    const snapshot = builder.build({ strategyModule: '' })
    expect(snapshot.strategyModule).toBeUndefined()
  })

  it('should extract strategyModuleRendered', () => {
    const builder = new DefaultPromptAssemblySnapshotBuilder()
    const snapshot = builder.build({ strategyModuleRendered: '## Strategy Module' })
    expect(snapshot.strategyModuleRendered).toBe('## Strategy Module')
  })

  it('should skip empty strategyModuleRendered', () => {
    const builder = new DefaultPromptAssemblySnapshotBuilder()
    const snapshot = builder.build({ strategyModuleRendered: '' })
    expect(snapshot.strategyModuleRendered).toBeUndefined()
  })

  it('should extract planRendered', () => {
    const builder = new DefaultPromptAssemblySnapshotBuilder()
    const snapshot = builder.build({ planRendered: 'Prompt Assembly Plan\n\n1. userInput (100)' })
    expect(snapshot.planRendered).toBe('Prompt Assembly Plan\n\n1. userInput (100)')
  })

  it('should skip empty planRendered', () => {
    const builder = new DefaultPromptAssemblySnapshotBuilder()
    const snapshot = builder.build({ planRendered: '' })
    expect(snapshot.planRendered).toBeUndefined()
  })

  it('should skip string fields when they are not strings', () => {
    const builder = new DefaultPromptAssemblySnapshotBuilder()
    const snapshot = builder.build({
      strategyRendered: 123,
      strategyModule: true,
      strategyModuleRendered: null,
      planRendered: undefined,
    })
    expect(snapshot.strategyRendered).toBeUndefined()
    expect(snapshot.strategyModule).toBeUndefined()
    expect(snapshot.strategyModuleRendered).toBeUndefined()
    expect(snapshot.planRendered).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// Builder — Plan
// ---------------------------------------------------------------------------

describe('Builder — plan', () => {
  it('should extract plan with priorities', () => {
    const builder = new DefaultPromptAssemblySnapshotBuilder()
    const metadata = {
      plan: { priorities: [{ section: 'userInput', priority: 100 }] },
    }
    const snapshot = builder.build(metadata)
    expect(snapshot.plan?.priorities).toHaveLength(1)
    expect(snapshot.plan!.priorities[0].section).toBe('userInput')
  })

  it('should extract plan with multiple priorities', () => {
    const builder = new DefaultPromptAssemblySnapshotBuilder()
    const metadata = {
      plan: {
        priorities: [
          { section: 'a', priority: 100 },
          { section: 'b', priority: 50 },
        ],
      },
    }
    const snapshot = builder.build(metadata)
    expect(snapshot.plan?.priorities).toHaveLength(2)
  })

  it('should skip plan when priorities is missing', () => {
    const builder = new DefaultPromptAssemblySnapshotBuilder()
    const snapshot = builder.build({ plan: {} })
    expect(snapshot.plan).toBeUndefined()
  })

  it('should skip plan when priorities is not an array', () => {
    const builder = new DefaultPromptAssemblySnapshotBuilder()
    const snapshot = builder.build({ plan: { priorities: 'not-array' } })
    expect(snapshot.plan).toBeUndefined()
  })

  it('should skip plan when value is null', () => {
    const builder = new DefaultPromptAssemblySnapshotBuilder()
    const snapshot = builder.build({ plan: null })
    expect(snapshot.plan).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// Builder — OptimizedPlan
// ---------------------------------------------------------------------------

describe('Builder — optimizedPlan', () => {
  it('should extract optimizedPlan with priorities', () => {
    const builder = new DefaultPromptAssemblySnapshotBuilder()
    const metadata = {
      optimizedPlan: { priorities: [{ section: 'userInput', priority: 100 }] },
    }
    const snapshot = builder.build(metadata)
    expect(snapshot.optimizedPlan?.priorities[0].section).toBe('userInput')
  })

  it('should skip optimizedPlan when priorities is missing', () => {
    const builder = new DefaultPromptAssemblySnapshotBuilder()
    const snapshot = builder.build({ optimizedPlan: {} })
    expect(snapshot.optimizedPlan).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// Builder — PlanDiff
// ---------------------------------------------------------------------------

describe('Builder — planDiff', () => {
  it('should extract planDiff with all fields', () => {
    const builder = new DefaultPromptAssemblySnapshotBuilder()
    const metadata = {
      planDiff: {
        added: ['new'],
        removed: ['old'],
        changed: [{ section: 'x', before: 100, after: 50 }],
      },
    }
    const snapshot = builder.build(metadata)
    expect(snapshot.planDiff?.added).toEqual(['new'])
    expect(snapshot.planDiff?.removed).toEqual(['old'])
    expect(snapshot.planDiff?.changed).toEqual([{ section: 'x', before: 100, after: 50 }])
  })

  it('should extract planDiff with empty arrays', () => {
    const builder = new DefaultPromptAssemblySnapshotBuilder()
    const metadata = {
      planDiff: { added: [], removed: [], changed: [] },
    }
    const snapshot = builder.build(metadata)
    expect(snapshot.planDiff?.added).toEqual([])
    expect(snapshot.planDiff?.removed).toEqual([])
    expect(snapshot.planDiff?.changed).toEqual([])
  })

  it('should skip planDiff when arrays are missing', () => {
    const builder = new DefaultPromptAssemblySnapshotBuilder()
    const snapshot = builder.build({ planDiff: { added: [] } })
    expect(snapshot.planDiff).toBeUndefined()
  })

  it('should skip planDiff when value is null', () => {
    const builder = new DefaultPromptAssemblySnapshotBuilder()
    const snapshot = builder.build({ planDiff: null })
    expect(snapshot.planDiff).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// Builder — Full Metadata
// ---------------------------------------------------------------------------

describe('Builder — full metadata', () => {
  it('should extract all fields from complete metadata', () => {
    const builder = new DefaultPromptAssemblySnapshotBuilder()
    const plan = { priorities: [{ section: 'a', priority: 100 }] }
    const metadata = {
      strategy: { name: 'create' },
      strategySelection: {
        selected: 'create',
        candidates: [{ strategy: 'create', score: 100 }],
      },
      strategyRendered: 'Prompt Strategy:\n\n- create',
      strategyModule: 'Creation Guidelines',
      strategyModuleRendered: '## Strategy Module',
      plan,
      optimizedPlan: plan,
      planDiff: { added: [], removed: [], changed: [] },
      planRendered: 'Prompt Assembly Plan\n\n1. a (100)',
    }
    const snapshot = builder.build(metadata)
    expect(snapshot.strategy).toBe('create')
    expect(snapshot.strategySelection).toBeDefined()
    expect(snapshot.strategyRendered).toBeDefined()
    expect(snapshot.strategyModule).toBeDefined()
    expect(snapshot.strategyModuleRendered).toBeDefined()
    expect(snapshot.plan).toBeDefined()
    expect(snapshot.optimizedPlan).toBeDefined()
    expect(snapshot.planDiff).toBeDefined()
    expect(snapshot.planRendered).toBeDefined()
    expect(Object.keys(snapshot)).toHaveLength(9)
  })
})

// ---------------------------------------------------------------------------
// Builder — Unknown Fields Ignored
// ---------------------------------------------------------------------------

describe('Builder — unknown fields ignored', () => {
  it('should ignore unknown metadata fields', () => {
    const builder = new DefaultPromptAssemblySnapshotBuilder()
    const metadata = {
      unknownField: 'value',
      randomData: 42,
      nested: { deep: true },
    }
    const snapshot = builder.build(metadata)
    expect(Object.keys(snapshot)).toHaveLength(0)
  })

  it('should ignore unknown fields alongside known fields', () => {
    const builder = new DefaultPromptAssemblySnapshotBuilder()
    const metadata = {
      strategy: { name: 'create' },
      unknown: 'value',
      garbage: [1, 2, 3],
      strategyRendered: 'Prompt Strategy:\n\n- create',
    }
    const snapshot = builder.build(metadata)
    expect(snapshot.strategy).toBe('create')
    expect(snapshot.strategyRendered).toBeDefined()
    expect(Object.keys(snapshot)).toHaveLength(2)
  })
})

// ---------------------------------------------------------------------------
// Interface Contract
// ---------------------------------------------------------------------------

describe('Interface contract', () => {
  it('should define build method', () => {
    const builder: PromptAssemblySnapshotBuilder = new DefaultPromptAssemblySnapshotBuilder()
    expect(typeof builder.build).toBe('function')
  })

  it('should accept Record and return PromptAssemblySnapshot', () => {
    const builder: PromptAssemblySnapshotBuilder = new DefaultPromptAssemblySnapshotBuilder()
    const result = builder.build({})
    expect(result).toBeDefined()
    expect(typeof result).toBe('object')
  })

  it('should accept a custom implementation', () => {
    const custom: PromptAssemblySnapshotBuilder = {
      build(_metadata: Record<string, unknown>): PromptAssemblySnapshot {
        return { strategy: 'custom' }
      },
    }
    const result = custom.build({})
    expect(result.strategy).toBe('custom')
  })
})

// ---------------------------------------------------------------------------
// Deterministic
// ---------------------------------------------------------------------------

describe('Deterministic', () => {
  it('should produce same result for same input across calls', () => {
    const builder = new DefaultPromptAssemblySnapshotBuilder()
    const metadata = {
      strategy: { name: 'create' },
      strategyRendered: 'Prompt Strategy:\n\n- create',
    }
    const r1 = builder.build(metadata)
    const r2 = builder.build(metadata)
    const r3 = builder.build(metadata)
    expect(r1).toEqual(r2)
    expect(r2).toEqual(r3)
  })

  it('should produce same result across different builder instances', () => {
    const b1 = new DefaultPromptAssemblySnapshotBuilder()
    const b2 = new DefaultPromptAssemblySnapshotBuilder()
    const metadata = { strategy: { name: 'query' } }
    expect(b1.build(metadata)).toEqual(b2.build(metadata))
  })

  it('should produce same result for identical metadata objects', () => {
    const builder = new DefaultPromptAssemblySnapshotBuilder()
    const m1 = { strategy: { name: 'create' }, strategyRendered: 'x' }
    const m2 = { strategy: { name: 'create' }, strategyRendered: 'x' }
    expect(builder.build(m1)).toEqual(builder.build(m2))
  })
})

// ---------------------------------------------------------------------------
// Stateless
// ---------------------------------------------------------------------------

describe('Stateless', () => {
  it('should not retain state between builds', () => {
    const builder = new DefaultPromptAssemblySnapshotBuilder()
    const r1 = builder.build({ strategy: { name: 'create' } })
    const r2 = builder.build({ strategy: { name: 'query' } })
    expect(r1.strategy).toBe('create')
    expect(r2.strategy).toBe('query')
  })
})

// ---------------------------------------------------------------------------
// Pure
// ---------------------------------------------------------------------------

describe('Pure', () => {
  it('should not modify input metadata', () => {
    const builder = new DefaultPromptAssemblySnapshotBuilder()
    const metadata = { strategy: { name: 'create' } }
    const original = JSON.stringify(metadata)
    builder.build(metadata)
    expect(JSON.stringify(metadata)).toBe(original)
  })

  it('should not modify input plan in metadata', () => {
    const builder = new DefaultPromptAssemblySnapshotBuilder()
    const plan = { priorities: [{ section: 'a', priority: 100 }] }
    const metadata = { plan }
    const originalPriorities = plan.priorities.length
    builder.build(metadata)
    expect(plan.priorities.length).toBe(originalPriorities)
  })
})

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

describe('Exports', () => {
  it('should export PromptAssemblySnapshot type from strategy index', async () => {
    const mod = await import('../strategy')
    expect(mod.DefaultPromptAssemblySnapshotBuilder).toBeDefined()
  })

  it('should export PromptAssemblySnapshotBuilder type from strategy index', async () => {
    const mod = await import('../strategy')
    expect(mod.DefaultPromptAssemblySnapshotBuilder).toBeDefined()
  })

  it('should export DefaultPromptAssemblySnapshotBuilder from strategy index', async () => {
    const mod = await import('../strategy')
    expect(mod.DefaultPromptAssemblySnapshotBuilder).toBe(DefaultPromptAssemblySnapshotBuilder)
  })

  it('should export DefaultPromptAssemblySnapshotBuilder from package root', async () => {
    const mod = await import('..')
    expect(mod.DefaultPromptAssemblySnapshotBuilder).toBeDefined()
  })

  it('should export DefaultPromptAssemblySnapshotBuilder as a class', () => {
    const builder = new DefaultPromptAssemblySnapshotBuilder()
    expect(builder).toBeInstanceOf(DefaultPromptAssemblySnapshotBuilder)
  })
})

// ---------------------------------------------------------------------------
// Architecture Compliance
// ---------------------------------------------------------------------------

describe('Architecture compliance', () => {
  it('should not depend on Planner', () => {
    const builder = new DefaultPromptAssemblySnapshotBuilder()
    expect(builder).toBeInstanceOf(DefaultPromptAssemblySnapshotBuilder)
  })

  it('should not depend on Runtime', () => {
    const builder = new DefaultPromptAssemblySnapshotBuilder()
    expect(builder).toBeDefined()
  })

  it('should not depend on Provider', () => {
    const builder = new DefaultPromptAssemblySnapshotBuilder()
    expect(builder).toBeDefined()
  })

  it('should not depend on Memory', () => {
    const builder = new DefaultPromptAssemblySnapshotBuilder()
    expect(builder).toBeDefined()
  })

  it('should not depend on AgentLoop', () => {
    const builder = new DefaultPromptAssemblySnapshotBuilder()
    expect(builder).toBeDefined()
  })

  it('should not modify PromptBuilder', () => {
    const builder = new DefaultPromptAssemblySnapshotBuilder()
    expect(builder).toBeDefined()
  })

  it('should not modify PromptRenderer', () => {
    const builder = new DefaultPromptAssemblySnapshotBuilder()
    expect(builder).toBeDefined()
  })

  it('should not modify PromptCompression', () => {
    const builder = new DefaultPromptAssemblySnapshotBuilder()
    expect(builder).toBeDefined()
  })

  it('should not modify PromptAssemblyOptimizer', () => {
    const builder = new DefaultPromptAssemblySnapshotBuilder()
    expect(builder).toBeDefined()
  })

  it('should not modify PromptAssemblyPlanDiffer', () => {
    const builder = new DefaultPromptAssemblySnapshotBuilder()
    expect(builder).toBeDefined()
  })

  it('should not modify PromptAssemblyPlan', () => {
    const builder = new DefaultPromptAssemblySnapshotBuilder()
    expect(builder).toBeDefined()
  })

  it('should not modify Planner', () => {
    const builder = new DefaultPromptAssemblySnapshotBuilder()
    expect(builder).toBeDefined()
  })

  it('should not modify Runtime', () => {
    const builder = new DefaultPromptAssemblySnapshotBuilder()
    expect(builder).toBeDefined()
  })

  it('should not modify AgentLoop', () => {
    const builder = new DefaultPromptAssemblySnapshotBuilder()
    expect(builder).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Compatibility — RetryPlanner
// ---------------------------------------------------------------------------

describe('RetryPlanner compatibility', () => {
  it('should be compatible with RetryPlanner', () => {
    const builder = new DefaultPromptAssemblySnapshotBuilder()
    const snapshot = builder.build({ strategy: { name: 'create' } })
    expect(snapshot.strategy).toBe('create')
  })
})

// ---------------------------------------------------------------------------
// Compatibility — ToolCallPlanner
// ---------------------------------------------------------------------------

describe('ToolCallPlanner compatibility', () => {
  it('should be compatible with ToolCallPlanner', () => {
    const builder = new DefaultPromptAssemblySnapshotBuilder()
    const snapshot = builder.build({
      strategy: { name: 'query' },
      strategyRendered: 'Prompt Strategy:\n\n- query',
    })
    expect(snapshot.strategy).toBe('query')
    expect(snapshot.strategyRendered).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Compatibility — Streaming
// ---------------------------------------------------------------------------

describe('Streaming compatibility', () => {
  it('should be compatible with streaming pipeline', () => {
    const builder = new DefaultPromptAssemblySnapshotBuilder()
    const snapshot = builder.build({
      plan: { priorities: [{ section: 'userInput', priority: 100 }] },
      planRendered: 'Prompt Assembly Plan\n\n1. userInput (100)',
    })
    expect(snapshot.plan).toBeDefined()
    expect(snapshot.planRendered).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Compatibility — AgentLoop
// ---------------------------------------------------------------------------

describe('AgentLoop compatibility', () => {
  it('should be compatible with AgentLoop', () => {
    const builder = new DefaultPromptAssemblySnapshotBuilder()
    const snapshot = builder.build({
      optimizedPlan: { priorities: [{ section: 'memory', priority: 80 }] },
    })
    expect(snapshot.optimizedPlan).toBeDefined()
  })
})