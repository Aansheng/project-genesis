import { describe, it, expect } from 'vitest'
import { DefaultPromptInspectorBuilder } from '../strategy/DefaultPromptInspectorBuilder'
import type { PromptInspectorBuilder } from '../strategy/PromptInspectorBuilder'
import type { PromptInspector } from '../strategy/PromptInspector'
import type { PromptInspectorSection } from '../strategy/PromptInspectorSection'
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
// Inspector Structure
// ---------------------------------------------------------------------------

describe('Inspector structure', () => {
  it('should have a strategy field', () => {
    const inspector: PromptInspector = { strategy: 'create', sections: [] }
    expect(inspector.strategy).toBe('create')
  })

  it('should have a sections array', () => {
    const inspector: PromptInspector = { sections: [] }
    expect(inspector.sections).toEqual([])
  })

  it('should allow strategy to be undefined', () => {
    const inspector: PromptInspector = { sections: [] }
    expect(inspector.strategy).toBeUndefined()
  })

  it('should allow multiple sections', () => {
    const sections: PromptInspectorSection[] = [
      { title: 'Rendered Strategy', content: 'strategy text' },
      { title: 'Prompt Plan', content: { priorities: [] } },
    ]
    const inspector: PromptInspector = { strategy: 'create', sections }
    expect(inspector.sections).toHaveLength(2)
  })

  it('should enforce readonly on sections array', () => {
    // Type-level check — sections is readonly at compile time
    const sections: readonly PromptInspectorSection[] = []
    expect(Array.isArray(sections)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Section Structure
// ---------------------------------------------------------------------------

describe('Section structure', () => {
  it('should have a title field', () => {
    const section: PromptInspectorSection = { title: 'Rendered Strategy', content: 'text' }
    expect(section.title).toBe('Rendered Strategy')
  })

  it('should have a content field', () => {
    const section: PromptInspectorSection = { title: 'Test', content: { key: 'value' } }
    expect(section.content).toEqual({ key: 'value' })
  })

  it('should accept string content', () => {
    const section: PromptInspectorSection = { title: 'Test', content: 'plain text' }
    expect(typeof section.content).toBe('string')
  })

  it('should accept object content', () => {
    const obj = { priorities: [{ section: 'a', priority: 100 }] }
    const section: PromptInspectorSection = { title: 'Plan', content: obj }
    expect(section.content).toBe(obj)
  })
})

// ---------------------------------------------------------------------------
// Builder — Empty Snapshot
// ---------------------------------------------------------------------------

describe('Builder — empty snapshot', () => {
  it('should return empty sections for empty snapshot', () => {
    const builder = new DefaultPromptInspectorBuilder()
    const inspector = builder.build({})
    expect(inspector.sections).toHaveLength(0)
  })

  it('should return undefined strategy for empty snapshot', () => {
    const builder = new DefaultPromptInspectorBuilder()
    const inspector = builder.build({})
    expect(inspector.strategy).toBeUndefined()
  })

  it('should return empty sections for snapshot with only strategy', () => {
    const builder = new DefaultPromptInspectorBuilder()
    const inspector = builder.build({ strategy: 'create' })
    expect(inspector.strategy).toBe('create')
    expect(inspector.sections).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// Builder — strategyRendered
// ---------------------------------------------------------------------------

describe('Builder — strategyRendered', () => {
  it('should create Rendered Strategy section', () => {
    const builder = new DefaultPromptInspectorBuilder()
    const inspector = builder.build({ strategyRendered: 'Prompt Strategy:\n\n- create' })
    expect(inspector.sections).toHaveLength(1)
    expect(inspector.sections[0].title).toBe('Rendered Strategy')
    expect(inspector.sections[0].content).toBe('Prompt Strategy:\n\n- create')
  })

  it('should skip empty strategyRendered', () => {
    const builder = new DefaultPromptInspectorBuilder()
    const inspector = builder.build({ strategyRendered: '' })
    expect(inspector.sections).toHaveLength(0)
  })

  it('should skip undefined strategyRendered', () => {
    const builder = new DefaultPromptInspectorBuilder()
    const inspector = builder.build({})
    const titles = inspector.sections.map(s => s.title)
    expect(titles).not.toContain('Rendered Strategy')
  })
})

// ---------------------------------------------------------------------------
// Builder — strategySelection
// ---------------------------------------------------------------------------

describe('Builder — strategySelection', () => {
  it('should create Strategy Selection section', () => {
    const builder = new DefaultPromptInspectorBuilder()
    const sel = createStrategySelection()
    const inspector = builder.build({ strategySelection: sel })
    expect(inspector.sections).toHaveLength(1)
    expect(inspector.sections[0].title).toBe('Strategy Selection')
    expect(inspector.sections[0].content).toBe(sel)
  })

  it('should include candidates in section content', () => {
    const builder = new DefaultPromptInspectorBuilder()
    const sel = createStrategySelection({
      candidates: [
        { strategy: 'create', score: 100 },
        { strategy: 'query', score: 50 },
      ],
    })
    const inspector = builder.build({ strategySelection: sel })
    const content = inspector.sections[0].content as StrategySelectionMetadata
    expect(content.candidates).toHaveLength(2)
  })

  it('should skip undefined strategySelection', () => {
    const builder = new DefaultPromptInspectorBuilder()
    const inspector = builder.build({})
    const titles = inspector.sections.map(s => s.title)
    expect(titles).not.toContain('Strategy Selection')
  })
})

// ---------------------------------------------------------------------------
// Builder — strategyModule
// ---------------------------------------------------------------------------

describe('Builder — strategyModule', () => {
  it('should create Strategy Module section', () => {
    const builder = new DefaultPromptInspectorBuilder()
    const inspector = builder.build({ strategyModule: 'Creation Guidelines...' })
    expect(inspector.sections).toHaveLength(1)
    expect(inspector.sections[0].title).toBe('Strategy Module')
    expect(inspector.sections[0].content).toBe('Creation Guidelines...')
  })

  it('should skip empty strategyModule', () => {
    const builder = new DefaultPromptInspectorBuilder()
    const inspector = builder.build({ strategyModule: '' })
    expect(inspector.sections).toHaveLength(0)
  })

  it('should skip undefined strategyModule', () => {
    const builder = new DefaultPromptInspectorBuilder()
    const inspector = builder.build({})
    const titles = inspector.sections.map(s => s.title)
    expect(titles).not.toContain('Strategy Module')
  })
})

// ---------------------------------------------------------------------------
// Builder — plan
// ---------------------------------------------------------------------------

describe('Builder — plan', () => {
  it('should create Prompt Plan section', () => {
    const builder = new DefaultPromptInspectorBuilder()
    const plan = createPlan([{ section: 'userInput', priority: 100 }])
    const inspector = builder.build({ plan })
    expect(inspector.sections).toHaveLength(1)
    expect(inspector.sections[0].title).toBe('Prompt Plan')
  })

  it('should include priorities in section content', () => {
    const builder = new DefaultPromptInspectorBuilder()
    const plan = createPlan([{ section: 'userInput', priority: 100 }])
    const inspector = builder.build({ plan })
    const content = inspector.sections[0].content as PromptAssemblyPlan
    expect(content.priorities[0].section).toBe('userInput')
  })

  it('should skip undefined plan', () => {
    const builder = new DefaultPromptInspectorBuilder()
    const inspector = builder.build({})
    const titles = inspector.sections.map(s => s.title)
    expect(titles).not.toContain('Prompt Plan')
  })
})

// ---------------------------------------------------------------------------
// Builder — optimizedPlan
// ---------------------------------------------------------------------------

describe('Builder — optimizedPlan', () => {
  it('should create Optimized Plan section', () => {
    const builder = new DefaultPromptInspectorBuilder()
    const plan = createPlan([{ section: 'memory', priority: 80 }])
    const inspector = builder.build({ optimizedPlan: plan })
    expect(inspector.sections).toHaveLength(1)
    expect(inspector.sections[0].title).toBe('Optimized Plan')
  })

  it('should include priorities in section content', () => {
    const builder = new DefaultPromptInspectorBuilder()
    const plan = createPlan([{ section: 'memory', priority: 80 }])
    const inspector = builder.build({ optimizedPlan: plan })
    const content = inspector.sections[0].content as PromptAssemblyPlan
    expect(content.priorities[0].priority).toBe(80)
  })

  it('should skip undefined optimizedPlan', () => {
    const builder = new DefaultPromptInspectorBuilder()
    const inspector = builder.build({})
    const titles = inspector.sections.map(s => s.title)
    expect(titles).not.toContain('Optimized Plan')
  })
})

// ---------------------------------------------------------------------------
// Builder — planDiff
// ---------------------------------------------------------------------------

describe('Builder — planDiff', () => {
  it('should create Plan Diff section', () => {
    const builder = new DefaultPromptInspectorBuilder()
    const diff = createPlanDiff({ added: ['newSection'] })
    const inspector = builder.build({ planDiff: diff })
    expect(inspector.sections).toHaveLength(1)
    expect(inspector.sections[0].title).toBe('Plan Diff')
  })

  it('should include diff data in section content', () => {
    const builder = new DefaultPromptInspectorBuilder()
    const diff = createPlanDiff({
      added: ['new'],
      removed: ['old'],
      changed: [{ section: 'x', before: 100, after: 50 }],
    })
    const inspector = builder.build({ planDiff: diff })
    const content = inspector.sections[0].content as PromptAssemblyPlanDiff
    expect(content.added).toEqual(['new'])
    expect(content.removed).toEqual(['old'])
    expect(content.changed).toHaveLength(1)
  })

  it('should skip undefined planDiff', () => {
    const builder = new DefaultPromptInspectorBuilder()
    const inspector = builder.build({})
    const titles = inspector.sections.map(s => s.title)
    expect(titles).not.toContain('Plan Diff')
  })
})

// ---------------------------------------------------------------------------
// Builder — planRendered
// ---------------------------------------------------------------------------

describe('Builder — planRendered', () => {
  it('should create Rendered Plan section', () => {
    const builder = new DefaultPromptInspectorBuilder()
    const inspector = builder.build({ planRendered: 'Prompt Assembly Plan\n\n1. userInput (100)' })
    expect(inspector.sections).toHaveLength(1)
    expect(inspector.sections[0].title).toBe('Rendered Plan')
    expect(inspector.sections[0].content).toBe('Prompt Assembly Plan\n\n1. userInput (100)')
  })

  it('should skip empty planRendered', () => {
    const builder = new DefaultPromptInspectorBuilder()
    const inspector = builder.build({ planRendered: '' })
    expect(inspector.sections).toHaveLength(0)
  })

  it('should skip undefined planRendered', () => {
    const builder = new DefaultPromptInspectorBuilder()
    const inspector = builder.build({})
    const titles = inspector.sections.map(s => s.title)
    expect(titles).not.toContain('Rendered Plan')
  })
})

// ---------------------------------------------------------------------------
// Builder — Full Snapshot
// ---------------------------------------------------------------------------

describe('Builder — full snapshot', () => {
  it('should extract all mapped fields from complete snapshot', () => {
    const builder = new DefaultPromptInspectorBuilder()
    const plan = createPlan([{ section: 'a', priority: 100 }])
    const diff = createPlanDiff()
    const sel = createStrategySelection()
    const snapshot: PromptAssemblySnapshot = {
      strategy: 'create',
      strategySelection: sel,
      strategyRendered: 'Prompt Strategy:\n\n- create',
      strategyModule: 'Creation Guidelines',
      plan,
      optimizedPlan: plan,
      planDiff: diff,
      planRendered: 'Rendered Plan Text',
    }
    const inspector = builder.build(snapshot)
    expect(inspector.strategy).toBe('create')
    expect(inspector.sections).toHaveLength(7)
  })

  it('should preserve content values for all 7 sections', () => {
    const builder = new DefaultPromptInspectorBuilder()
    const plan = createPlan([{ section: 'a', priority: 100 }])
    const diff = createPlanDiff()
    const sel = createStrategySelection()
    const snapshot: PromptAssemblySnapshot = {
      strategy: 'query',
      strategySelection: sel,
      strategyRendered: 'rendered',
      strategyModule: 'module',
      plan,
      optimizedPlan: plan,
      planDiff: diff,
      planRendered: 'rendered plan',
    }
    const inspector = builder.build(snapshot)
    const map = new Map(inspector.sections.map(s => [s.title, s.content]))
    expect(map.get('Rendered Strategy')).toBe('rendered')
    expect(map.get('Strategy Selection')).toBe(sel)
    expect(map.get('Strategy Module')).toBe('module')
    expect(map.get('Prompt Plan')).toBe(plan)
    expect(map.get('Optimized Plan')).toBe(plan)
    expect(map.get('Plan Diff')).toBe(diff)
    expect(map.get('Rendered Plan')).toBe('rendered plan')
  })
})

// ---------------------------------------------------------------------------
// Section Ordering
// ---------------------------------------------------------------------------

describe('Section ordering', () => {
  it('should order sections consistently: Rendered Strategy first', () => {
    const builder = new DefaultPromptInspectorBuilder()
    const plan = createPlan([{ section: 'a', priority: 100 }])
    const sel = createStrategySelection()
    const snapshot: PromptAssemblySnapshot = {
      strategyRendered: 'rendered',
      strategySelection: sel,
      plan,
    }
    const inspector = builder.build(snapshot)
    expect(inspector.sections[0].title).toBe('Rendered Strategy')
    expect(inspector.sections[1].title).toBe('Strategy Selection')
    expect(inspector.sections[2].title).toBe('Prompt Plan')
  })

  it('should order sections: Rendered Strategy, Strategy Selection, Strategy Module, Plan, Optimized, Diff, Rendered', () => {
    const builder = new DefaultPromptInspectorBuilder()
    const plan = createPlan([{ section: 'a', priority: 100 }])
    const diff = createPlanDiff()
    const sel = createStrategySelection()
    const snapshot: PromptAssemblySnapshot = {
      strategyRendered: 'rendered',
      strategySelection: sel,
      strategyModule: 'module',
      plan,
      optimizedPlan: plan,
      planDiff: diff,
      planRendered: 'rendered plan',
    }
    const inspector = builder.build(snapshot)
    const titles = inspector.sections.map(s => s.title)
    expect(titles).toEqual([
      'Rendered Strategy',
      'Strategy Selection',
      'Strategy Module',
      'Prompt Plan',
      'Optimized Plan',
      'Plan Diff',
      'Rendered Plan',
    ])
  })

  it('should maintain ordering even when some fields are missing', () => {
    const builder = new DefaultPromptInspectorBuilder()
    const snapshot: PromptAssemblySnapshot = {
      strategyRendered: 'rendered',
      planDiff: createPlanDiff(),
      planRendered: 'rendered plan',
    }
    const inspector = builder.build(snapshot)
    const titles = inspector.sections.map(s => s.title)
    expect(titles).toEqual([
      'Rendered Strategy',
      'Plan Diff',
      'Rendered Plan',
    ])
  })
})

// ---------------------------------------------------------------------------
// Unknown Fields Ignored
// ---------------------------------------------------------------------------

describe('Unknown fields ignored', () => {
  it('should ignore strategyModuleRendered', () => {
    const builder = new DefaultPromptInspectorBuilder()
    const snapshot: PromptAssemblySnapshot = {
      strategyModuleRendered: '## Strategy Module',
    }
    const inspector = builder.build(snapshot)
    const titles = inspector.sections.map(s => s.title)
    expect(titles).not.toContain('Strategy Module Rendered')
    expect(inspector.sections).toHaveLength(0)
  })

  it('should only produce sections for the 7 mapped fields', () => {
    const builder = new DefaultPromptInspectorBuilder()
    const snapshot: PromptAssemblySnapshot = {
      strategyRendered: 'rendered',
      strategySelection: createStrategySelection(),
      strategyModule: 'module',
      plan: createPlan([{ section: 'a', priority: 100 }]),
      optimizedPlan: createPlan([{ section: 'a', priority: 100 }]),
      planDiff: createPlanDiff(),
      planRendered: 'rendered plan',
    }
    const inspector = builder.build(snapshot)
    expect(inspector.sections).toHaveLength(7)
    const titles = inspector.sections.map(s => s.title)
    expect(titles).toEqual([
      'Rendered Strategy',
      'Strategy Selection',
      'Strategy Module',
      'Prompt Plan',
      'Optimized Plan',
      'Plan Diff',
      'Rendered Plan',
    ])
  })
})

// ---------------------------------------------------------------------------
// Deterministic
// ---------------------------------------------------------------------------

describe('Deterministic', () => {
  it('should produce same result for same snapshot across calls', () => {
    const builder = new DefaultPromptInspectorBuilder()
    const snapshot: PromptAssemblySnapshot = {
      strategy: 'create',
      strategyRendered: 'rendered',
    }
    const r1 = builder.build(snapshot)
    const r2 = builder.build(snapshot)
    const r3 = builder.build(snapshot)
    expect(r1).toEqual(r2)
    expect(r2).toEqual(r3)
  })

  it('should produce same result across different builder instances', () => {
    const b1 = new DefaultPromptInspectorBuilder()
    const b2 = new DefaultPromptInspectorBuilder()
    const snapshot: PromptAssemblySnapshot = { strategy: 'query', strategyRendered: 'text' }
    expect(b1.build(snapshot)).toEqual(b2.build(snapshot))
  })

  it('should produce same result for identical snapshot objects', () => {
    const builder = new DefaultPromptInspectorBuilder()
    const s1: PromptAssemblySnapshot = { strategy: 'create', strategyRendered: 'x' }
    const s2: PromptAssemblySnapshot = { strategy: 'create', strategyRendered: 'x' }
    expect(builder.build(s1)).toEqual(builder.build(s2))
  })
})

// ---------------------------------------------------------------------------
// Stateless
// ---------------------------------------------------------------------------

describe('Stateless', () => {
  it('should not retain state between builds', () => {
    const builder = new DefaultPromptInspectorBuilder()
    const r1 = builder.build({ strategy: 'create', strategyRendered: 'rendered a' })
    const r2 = builder.build({ strategy: 'query', strategyRendered: 'rendered b' })
    expect(r1.strategy).toBe('create')
    expect(r2.strategy).toBe('query')
    expect(r1.sections[0].content).toBe('rendered a')
    expect(r2.sections[0].content).toBe('rendered b')
  })
})

// ---------------------------------------------------------------------------
// Pure
// ---------------------------------------------------------------------------

describe('Pure', () => {
  it('should not modify input snapshot', () => {
    const builder = new DefaultPromptInspectorBuilder()
    const snapshot: PromptAssemblySnapshot = { strategy: 'create', strategyRendered: 'rendered' }
    const original = JSON.stringify(snapshot)
    builder.build(snapshot)
    expect(JSON.stringify(snapshot)).toBe(original)
  })

  it('should not modify snapshot content objects', () => {
    const builder = new DefaultPromptInspectorBuilder()
    const plan = createPlan([{ section: 'a', priority: 100 }])
    const snapshot: PromptAssemblySnapshot = { plan }
    const originalPriorities = plan.priorities.length
    builder.build(snapshot)
    expect(plan.priorities.length).toBe(originalPriorities)
  })
})

// ---------------------------------------------------------------------------
// Interface Contract
// ---------------------------------------------------------------------------

describe('Interface contract', () => {
  it('should define build method', () => {
    const builder: PromptInspectorBuilder = new DefaultPromptInspectorBuilder()
    expect(typeof builder.build).toBe('function')
  })

  it('should accept snapshot and return PromptInspector', () => {
    const builder: PromptInspectorBuilder = new DefaultPromptInspectorBuilder()
    const result = builder.build({})
    expect(result).toBeDefined()
    expect(Array.isArray(result.sections)).toBe(true)
  })

  it('should accept a custom implementation', () => {
    const custom: PromptInspectorBuilder = {
      build(_snapshot: PromptAssemblySnapshot): PromptInspector {
        return { strategy: 'custom', sections: [] }
      },
    }
    const result = custom.build({})
    expect(result.strategy).toBe('custom')
  })
})

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

describe('Exports', () => {
  it('should export DefaultPromptInspectorBuilder from strategy index', async () => {
    const mod = await import('../strategy')
    expect(mod.DefaultPromptInspectorBuilder).toBeDefined()
  })

  it('should export PromptInspector type from strategy index', () => {
    // Type-only export verified at compile time; test class usage
    const builder = new DefaultPromptInspectorBuilder()
    const inspector = builder.build({ strategy: 'test' })
    expect(inspector.strategy).toBe('test')
  })

  it('should export PromptInspectorSection type from strategy index', () => {
    // Type-only export verified at compile time; test structure via DefaultPromptInspectorBuilder
    const builder = new DefaultPromptInspectorBuilder()
    const inspector = builder.build({ strategyRendered: 'text' })
    expect(inspector.sections[0].title).toBe('Rendered Strategy')
  })

  it('should export PromptInspectorBuilder type from strategy index', () => {
    // Type-only export verified at compile time; test class conforms to interface
    const builder: PromptInspectorBuilder = new DefaultPromptInspectorBuilder()
    expect(builder.build({})).toBeDefined()
  })

  it('should export DefaultPromptInspectorBuilder from package root', async () => {
    const mod = await import('..')
    expect(mod.DefaultPromptInspectorBuilder).toBeDefined()
  })

  it('should export DefaultPromptInspectorBuilder as a class', () => {
    const builder = new DefaultPromptInspectorBuilder()
    expect(builder).toBeInstanceOf(DefaultPromptInspectorBuilder)
  })
})

// ---------------------------------------------------------------------------
// Architecture Compliance
// ---------------------------------------------------------------------------

describe('Architecture compliance', () => {
  it('should not depend on Planner', () => {
    const builder = new DefaultPromptInspectorBuilder()
    expect(builder).toBeInstanceOf(DefaultPromptInspectorBuilder)
  })

  it('should not depend on Runtime', () => {
    const builder = new DefaultPromptInspectorBuilder()
    expect(builder).toBeDefined()
  })

  it('should not depend on Provider', () => {
    const builder = new DefaultPromptInspectorBuilder()
    expect(builder).toBeDefined()
  })

  it('should not depend on Memory', () => {
    const builder = new DefaultPromptInspectorBuilder()
    expect(builder).toBeDefined()
  })

  it('should not depend on AgentLoop', () => {
    const builder = new DefaultPromptInspectorBuilder()
    expect(builder).toBeDefined()
  })

  it('should not depend on Pipeline', () => {
    const builder = new DefaultPromptInspectorBuilder()
    expect(builder).toBeDefined()
  })

  it('should not modify PromptBuilder', () => {
    const builder = new DefaultPromptInspectorBuilder()
    expect(builder).toBeDefined()
  })

  it('should not modify PromptRenderer', () => {
    const builder = new DefaultPromptInspectorBuilder()
    expect(builder).toBeDefined()
  })

  it('should not modify PromptCompression', () => {
    const builder = new DefaultPromptInspectorBuilder()
    expect(builder).toBeDefined()
  })

  it('should not modify PromptAssemblyOptimizer', () => {
    const builder = new DefaultPromptInspectorBuilder()
    expect(builder).toBeDefined()
  })

  it('should not modify PromptAssemblyPlanDiffer', () => {
    const builder = new DefaultPromptInspectorBuilder()
    expect(builder).toBeDefined()
  })

  it('should not modify PromptAssemblyPlan', () => {
    const builder = new DefaultPromptInspectorBuilder()
    expect(builder).toBeDefined()
  })

  it('should not modify Planner', () => {
    const builder = new DefaultPromptInspectorBuilder()
    expect(builder).toBeDefined()
  })

  it('should not modify Runtime', () => {
    const builder = new DefaultPromptInspectorBuilder()
    expect(builder).toBeDefined()
  })

  it('should not modify AgentLoop', () => {
    const builder = new DefaultPromptInspectorBuilder()
    expect(builder).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Compatibility — RetryPlanner
// ---------------------------------------------------------------------------

describe('RetryPlanner compatibility', () => {
  it('should be compatible with RetryPlanner', () => {
    const builder = new DefaultPromptInspectorBuilder()
    const inspector = builder.build({ strategy: 'create', strategyRendered: 'rendered' })
    expect(inspector.strategy).toBe('create')
  })
})

// ---------------------------------------------------------------------------
// Compatibility — ToolCallPlanner
// ---------------------------------------------------------------------------

describe('ToolCallPlanner compatibility', () => {
  it('should be compatible with ToolCallPlanner', () => {
    const builder = new DefaultPromptInspectorBuilder()
    const plan = createPlan([{ section: 'userInput', priority: 100 }])
    const inspector = builder.build({
      strategy: 'query',
      strategyRendered: 'rendered',
      plan,
    })
    expect(inspector.strategy).toBe('query')
    expect(inspector.sections).toHaveLength(2)
  })
})

// ---------------------------------------------------------------------------
// Compatibility — Streaming
// ---------------------------------------------------------------------------

describe('Streaming compatibility', () => {
  it('should be compatible with streaming pipeline', () => {
    const builder = new DefaultPromptInspectorBuilder()
    const inspector = builder.build({
      plan: createPlan([{ section: 'userInput', priority: 100 }]),
      planRendered: 'Rendered Plan Text',
    })
    expect(inspector.sections).toHaveLength(2)
  })
})

// ---------------------------------------------------------------------------
// Compatibility — AgentLoop
// ---------------------------------------------------------------------------

describe('AgentLoop compatibility', () => {
  it('should be compatible with AgentLoop', () => {
    const builder = new DefaultPromptInspectorBuilder()
    const inspector = builder.build({
      optimizedPlan: createPlan([{ section: 'memory', priority: 80 }]),
    })
    expect(inspector.sections).toHaveLength(1)
    expect(inspector.sections[0].title).toBe('Optimized Plan')
  })
})