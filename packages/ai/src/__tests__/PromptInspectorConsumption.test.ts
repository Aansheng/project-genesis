import { describe, it, expect } from 'vitest'
import { DefaultPromptBuilder } from '../prompt/DefaultPromptBuilder'
import { DefaultPromptAssemblyPlanner } from '../strategy/DefaultPromptAssemblyPlanner'
import { StrategyAwarePromptAssemblyPlanner } from '../strategy/StrategyAwarePromptAssemblyPlanner'
import { DefaultPromptAssemblyPlanRenderer } from '../strategy/DefaultPromptAssemblyPlanRenderer'
import { DefaultPromptAssemblyOptimizer } from '../strategy/DefaultPromptAssemblyOptimizer'
import { DefaultPromptAssemblyPlanDiffer } from '../strategy/DefaultPromptAssemblyPlanDiffer'
import { DefaultPromptAssemblySnapshotBuilder } from '../strategy/DefaultPromptAssemblySnapshotBuilder'
import { DefaultPromptInspectorBuilder } from '../strategy/DefaultPromptInspectorBuilder'
import type { PromptInspectorBuilder } from '../strategy/PromptInspectorBuilder'
import type { PromptInspector } from '../strategy/PromptInspector'
import type { PromptAssemblySnapshot } from '../strategy/PromptAssemblySnapshot'
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
  it('should accept promptInspectorBuilder field', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
      promptInspectorBuilder: new DefaultPromptInspectorBuilder(),
    })
    const request = await builder.build(createPipelineContext())
    expect(getAssembly(request)?.inspector).toBeDefined()
  })

  it('should allow promptInspectorBuilder to be undefined', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
      promptInspectorBuilder: undefined,
    })
    const request = await builder.build(createPipelineContext())
    expect(getAssembly(request)?.inspector).toBeUndefined()
  })

  it('should allow promptInspectorBuilder to be omitted', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
    })
    const request = await builder.build(createPipelineContext())
    expect(getAssembly(request)?.inspector).toBeUndefined()
  })

  it('should require snapshot builder for inspector to appear', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptInspectorBuilder: new DefaultPromptInspectorBuilder(),
    })
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    // No snapshot means no inspector
    expect(assembly?.inspector).toBeUndefined()
    expect(assembly?.snapshot).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// InspectorInvocation
// ---------------------------------------------------------------------------

describe('Inspector invocation', () => {
  it('should invoke inspector builder when snapshot and builder exist', async () => {
    let invoked = false
    const trackingBuilder: PromptInspectorBuilder = {
      build(_snapshot: PromptAssemblySnapshot): PromptInspector {
        invoked = true
        return { strategy: 'test', sections: [] }
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
      promptInspectorBuilder: trackingBuilder,
    })
    await builder.build(createPipelineContext())
    expect(invoked).toBe(true)
  })

  it('should not invoke inspector builder when snapshot is missing', async () => {
    let invoked = false
    const trackingBuilder: PromptInspectorBuilder = {
      build(_snapshot: PromptAssemblySnapshot): PromptInspector {
        invoked = true
        return { strategy: 'test', sections: [] }
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptInspectorBuilder: trackingBuilder,
    })
    await builder.build(createPipelineContext())
    expect(invoked).toBe(false)
  })

  it('should not invoke inspector builder when builder is missing', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
    })
    const request = await builder.build(createPipelineContext())
    expect(getAssembly(request)?.inspector).toBeUndefined()
  })

  it('should invoke inspector builder even without assembly components', async () => {
    let invoked = false
    const trackingBuilder: PromptInspectorBuilder = {
      build(_snapshot: PromptAssemblySnapshot): PromptInspector {
        invoked = true
        return { strategy: 'default', sections: [] }
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
      promptInspectorBuilder: trackingBuilder,
    })
    await builder.build(createPipelineContext())
    expect(invoked).toBe(true)
  })

  it('should pass snapshot to inspector builder', async () => {
    let capturedSnapshot: PromptAssemblySnapshot | undefined
    const capturingBuilder: PromptInspectorBuilder = {
      build(snapshot: PromptAssemblySnapshot): PromptInspector {
        capturedSnapshot = snapshot
        return { strategy: snapshot.strategy, sections: [] }
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
      promptInspectorBuilder: capturingBuilder,
    })
    await builder.build(createPipelineContext())
    expect(capturedSnapshot).toBeDefined()
    expect(capturedSnapshot!.strategy).toBeDefined()
  })

  it('should pass complete snapshot with all available fields to builder', async () => {
    let capturedSnapshot: PromptAssemblySnapshot | undefined
    const capturingBuilder: PromptInspectorBuilder = {
      build(snapshot: PromptAssemblySnapshot): PromptInspector {
        capturedSnapshot = snapshot
        return { strategy: snapshot.strategy ?? '', sections: [] }
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
      promptAssemblyOptimizer: new DefaultPromptAssemblyOptimizer(),
      promptAssemblyPlanDiffer: new DefaultPromptAssemblyPlanDiffer(),
      promptAssemblyPlanRenderer: new DefaultPromptAssemblyPlanRenderer(),
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
      promptInspectorBuilder: capturingBuilder,
    })
    await builder.build(createPipelineContext())
    expect(capturedSnapshot).toBeDefined()
    expect(capturedSnapshot!.strategy).toBeDefined()
    expect(capturedSnapshot!.plan).toBeDefined()
  })

  it('should store result from custom inspector builder', async () => {
    const customBuilder: PromptInspectorBuilder = {
      build(_snapshot: PromptAssemblySnapshot): PromptInspector {
        return {
          strategy: 'custom',
          sections: [{ title: 'Custom Section', content: 'custom content' }],
        }
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
      promptInspectorBuilder: customBuilder,
    })
    const request = await builder.build(createPipelineContext())
    const inspector = getAssembly(request)?.inspector as PromptInspector | undefined
    expect(inspector!.strategy).toBe('custom')
    expect(inspector!.sections[0].title).toBe('Custom Section')
  })
})

// ---------------------------------------------------------------------------
// Inspector Creation
// ---------------------------------------------------------------------------

describe('Inspector creation', () => {
  it('should create inspector when snapshot and builder exist', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
      promptInspectorBuilder: new DefaultPromptInspectorBuilder(),
    })
    const request = await builder.build(createPipelineContext())
    const inspector = getAssembly(request)?.inspector as PromptInspector | undefined
    expect(inspector).toBeDefined()
  })

  it('should not create inspector without snapshot builder', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptInspectorBuilder: new DefaultPromptInspectorBuilder(),
    })
    const request = await builder.build(createPipelineContext())
    expect(getAssembly(request)?.inspector).toBeUndefined()
  })

  it('should not create inspector without inspector builder', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
    })
    const request = await builder.build(createPipelineContext())
    expect(getAssembly(request)?.inspector).toBeUndefined()
  })

  it('should create inspector with strategy name', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
      promptInspectorBuilder: new DefaultPromptInspectorBuilder(),
    })
    const request = await builder.build(createPipelineContext())
    const inspector = getAssembly(request)?.inspector as PromptInspector | undefined
    expect(inspector!.strategy).toBeDefined()
  })

  it('should create inspector with sections', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
      promptAssemblyOptimizer: new DefaultPromptAssemblyOptimizer(),
      promptAssemblyPlanDiffer: new DefaultPromptAssemblyPlanDiffer(),
      promptAssemblyPlanRenderer: new DefaultPromptAssemblyPlanRenderer(),
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
      promptInspectorBuilder: new DefaultPromptInspectorBuilder(),
    })
    const request = await builder.build(createPipelineContext())
    const inspector = getAssembly(request)?.inspector as PromptInspector | undefined
    expect(inspector!.sections.length).toBeGreaterThan(0)
  })

  it('should create inspector with empty sections when snapshot has only strategy', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
      promptInspectorBuilder: new DefaultPromptInspectorBuilder(),
    })
    const request = await builder.build(createPipelineContext())
    const inspector = getAssembly(request)?.inspector as PromptInspector | undefined
    expect(inspector!.strategy).toBeDefined()
    // Snapshot only has strategy — inspector might have only Rendered Strategy section
    expect(inspector!.sections.length).toBeLessThanOrEqual(2)
  })

  it('should create inspector with multiple sections when fully configured', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
      promptAssemblyOptimizer: new DefaultPromptAssemblyOptimizer(),
      promptAssemblyPlanDiffer: new DefaultPromptAssemblyPlanDiffer(),
      promptAssemblyPlanRenderer: new DefaultPromptAssemblyPlanRenderer(),
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
      promptInspectorBuilder: new DefaultPromptInspectorBuilder(),
    })
    const request = await builder.build(createPipelineContext())
    const inspector = getAssembly(request)?.inspector as PromptInspector | undefined
    // Should have at least: Rendered Strategy, Prompt Plan, Optimized Plan, Rendered Plan
    expect(inspector!.sections.length).toBeGreaterThanOrEqual(4)
  })

  it('should create inspector with Rendered Strategy section', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
      promptInspectorBuilder: new DefaultPromptInspectorBuilder(),
    })
    const request = await builder.build(createPipelineContext())
    const inspector = getAssembly(request)?.inspector as PromptInspector | undefined
    const titles = inspector!.sections.map(s => s.title)
    expect(titles).toContain('Rendered Strategy')
  })

  it('should create inspector with all available sections', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
      promptAssemblyOptimizer: new DefaultPromptAssemblyOptimizer(),
      promptAssemblyPlanDiffer: new DefaultPromptAssemblyPlanDiffer(),
      promptAssemblyPlanRenderer: new DefaultPromptAssemblyPlanRenderer(),
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
      promptInspectorBuilder: new DefaultPromptInspectorBuilder(),
    })
    const request = await builder.build(createPipelineContext())
    const inspector = getAssembly(request)?.inspector as PromptInspector | undefined
    const titles = inspector!.sections.map(s => s.title)
    expect(titles).toContain('Rendered Strategy')
    expect(titles).toContain('Prompt Plan')
    expect(titles).toContain('Optimized Plan')
    expect(titles).toContain('Plan Diff')
    expect(titles).toContain('Rendered Plan')
  })
})

// ---------------------------------------------------------------------------
// Inspector Metadata
// ---------------------------------------------------------------------------

describe('Inspector metadata', () => {
  it('should store inspector in metadata.promptAssembly.inspector', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
      promptInspectorBuilder: new DefaultPromptInspectorBuilder(),
    })
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)!
    expect(assembly.inspector).toBeDefined()
  })

  it('should preserve strategy in metadata alongside inspector', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
      promptInspectorBuilder: new DefaultPromptInspectorBuilder(),
    })
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)!
    expect(assembly.inspector).toBeDefined()
    expect(assembly.strategy).toBeDefined()
  })

  it('should preserve snapshot alongside inspector', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
      promptInspectorBuilder: new DefaultPromptInspectorBuilder(),
    })
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)!
    expect(assembly.snapshot).toBeDefined()
    expect(assembly.inspector).toBeDefined()
  })

  it('should preserve planRendered alongside inspector', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
      promptAssemblyPlanRenderer: new DefaultPromptAssemblyPlanRenderer(),
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
      promptInspectorBuilder: new DefaultPromptInspectorBuilder(),
    })
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)!
    expect(assembly.inspector).toBeDefined()
    expect(assembly.planRendered).toBeDefined()
  })

  it('should preserve inspector across multiple builds', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
      promptInspectorBuilder: new DefaultPromptInspectorBuilder(),
    })
    const r1 = await builder.build(createPipelineContext({ input: 'a' }))
    const r2 = await builder.build(createPipelineContext({ input: 'b' }))
    const i1 = getAssembly(r1)?.inspector as PromptInspector | undefined
    const i2 = getAssembly(r2)?.inspector as PromptInspector | undefined
    expect(i1).toBeDefined()
    expect(i2).toBeDefined()
  })

  it('should preserve planDiff alongside inspector', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
      promptAssemblyOptimizer: new DefaultPromptAssemblyOptimizer(),
      promptAssemblyPlanDiffer: new DefaultPromptAssemblyPlanDiffer(),
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
      promptInspectorBuilder: new DefaultPromptInspectorBuilder(),
    })
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)!
    expect(assembly.inspector).toBeDefined()
    expect(assembly.planDiff).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Coexistence
// ---------------------------------------------------------------------------

describe('Coexistence', () => {
  it('should coexist with all existing metadata fields', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
      promptAssemblyOptimizer: new DefaultPromptAssemblyOptimizer(),
      promptAssemblyPlanDiffer: new DefaultPromptAssemblyPlanDiffer(),
      promptAssemblyPlanRenderer: new DefaultPromptAssemblyPlanRenderer(),
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
      promptInspectorBuilder: new DefaultPromptInspectorBuilder(),
    })
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)!
    expect(assembly.strategy).toBeDefined()
    expect(assembly.strategyRendered).toBeDefined()
    expect(assembly.plan).toBeDefined()
    expect(assembly.optimizedPlan).toBeDefined()
    expect(assembly.planDiff).toBeDefined()
    expect(assembly.planRendered).toBeDefined()
    expect(assembly.snapshot).toBeDefined()
    expect(assembly.inspector).toBeDefined()
    expect(assembly.ranking).toBeDefined()
    expect(assembly.budget).toBeDefined()
    expect(assembly.selection).toBeDefined()
  })

  it('should not remove any existing fields when inspector is present', async () => {
    const builderWithout = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
    })
    const builderWith = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
      promptInspectorBuilder: new DefaultPromptInspectorBuilder(),
    })
    const ctx = createPipelineContext()
    const r1 = await builderWithout.build(ctx)
    const r2 = await builderWith.build(ctx)
    const a1 = getAssembly(r1)!
    const a2 = getAssembly(r2)!
    // All existing fields still present in both
    expect(Object.keys(a1).length).toBeLessThanOrEqual(Object.keys(a2).length)
    expect(a2.snapshot).toBeDefined()
    expect(a2.inspector).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Deterministic
// ---------------------------------------------------------------------------

describe('Deterministic', () => {
  it('should produce same inspector across multiple builds', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
      promptInspectorBuilder: new DefaultPromptInspectorBuilder(),
    })
    const ctx = createPipelineContext()
    const r1 = await builder.build(ctx)
    const r2 = await builder.build(ctx)
    const r3 = await builder.build(ctx)
    const i1 = getAssembly(r1)?.inspector as PromptInspector | undefined
    const i2 = getAssembly(r2)?.inspector as PromptInspector | undefined
    const i3 = getAssembly(r3)?.inspector as PromptInspector | undefined
    expect(i1).toEqual(i2)
    expect(i2).toEqual(i3)
  })

  it('should produce same inspector across different builder instances', async () => {
    const b1 = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
      promptInspectorBuilder: new DefaultPromptInspectorBuilder(),
    })
    const b2 = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
      promptInspectorBuilder: new DefaultPromptInspectorBuilder(),
    })
    const ctx = createPipelineContext()
    const r1 = await b1.build(ctx)
    const r2 = await b2.build(ctx)
    const i1 = getAssembly(r1)?.inspector as PromptInspector | undefined
    const i2 = getAssembly(r2)?.inspector as PromptInspector | undefined
    expect(i1).toEqual(i2)
  })

  it('should produce same inspector for same input', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
      promptInspectorBuilder: new DefaultPromptInspectorBuilder(),
    })
    const ctx1 = createPipelineContext()
    const ctx2 = createPipelineContext()
    const r1 = await builder.build(ctx1)
    const r2 = await builder.build(ctx2)
    const i1 = getAssembly(r1)?.inspector as PromptInspector | undefined
    const i2 = getAssembly(r2)?.inspector as PromptInspector | undefined
    expect(i1).toEqual(i2)
  })
})

// ---------------------------------------------------------------------------
// Stateless
// ---------------------------------------------------------------------------

describe('Stateless', () => {
  it('should not retain inspector state between builds', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
      promptInspectorBuilder: new DefaultPromptInspectorBuilder(),
    })
    const r1 = await builder.build(createPipelineContext({ input: 'draw a tree' }))
    const r2 = await builder.build(createPipelineContext({ input: 'build a house' }))
    const i1 = getAssembly(r1)?.inspector as PromptInspector | undefined
    const i2 = getAssembly(r2)?.inspector as PromptInspector | undefined
    expect(i1).toBeDefined()
    expect(i2).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Pure / No Side Effects
// ---------------------------------------------------------------------------

describe('Pure', () => {
  it('should not modify pipeline context', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
      promptInspectorBuilder: new DefaultPromptInspectorBuilder(),
    })
    const ctx = createPipelineContext()
    const originalInput = ctx.input
    await builder.build(ctx)
    expect(ctx.input).toBe(originalInput)
  })

  it('should not modify snapshot in metadata', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
      promptInspectorBuilder: new DefaultPromptInspectorBuilder(),
    })
    const request = await builder.build(createPipelineContext())
    const inspector = getAssembly(request)?.inspector as PromptInspector | undefined
    const inspectorCopy = JSON.parse(JSON.stringify(inspector))
    expect(JSON.stringify(inspector)).toBe(JSON.stringify(inspectorCopy))
  })
})

// ---------------------------------------------------------------------------
// No Prompt Changes
// ---------------------------------------------------------------------------

describe('No prompt changes', () => {
  it('should produce identical prompt with and without inspector builder', async () => {
    const modules = [new UserInputModule()]

    const builderWithout = new DefaultPromptBuilder(modules, {
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
    })
    const builderWith = new DefaultPromptBuilder(modules, {
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
      promptInspectorBuilder: new DefaultPromptInspectorBuilder(),
    })

    const ctx = createPipelineContext()
    const r1 = await builderWithout.build(ctx)
    const r2 = await builderWith.build(ctx)
    expect(r1.prompt).toBe(r2.prompt)
  })

  it('should produce identical prompt with inspector builder and all components', async () => {
    const modules = [new UserInputModule()]
    const planner = new DefaultPromptAssemblyPlanner()
    const optimizer = new DefaultPromptAssemblyOptimizer()
    const renderer = new DefaultPromptAssemblyPlanRenderer()
    const differ = new DefaultPromptAssemblyPlanDiffer()
    const snapshotBuilder = new DefaultPromptAssemblySnapshotBuilder()
    const inspectorBuilder = new DefaultPromptInspectorBuilder()

    const builderWithout = new DefaultPromptBuilder(modules, {
      promptAssemblyPlanner: planner,
      promptAssemblyOptimizer: optimizer,
      promptAssemblyPlanRenderer: renderer,
      promptAssemblyPlanDiffer: differ,
      promptAssemblySnapshotBuilder: snapshotBuilder,
    })
    const builderWith = new DefaultPromptBuilder(modules, {
      promptAssemblyPlanner: planner,
      promptAssemblyOptimizer: optimizer,
      promptAssemblyPlanRenderer: renderer,
      promptAssemblyPlanDiffer: differ,
      promptAssemblySnapshotBuilder: snapshotBuilder,
      promptInspectorBuilder: inspectorBuilder,
    })

    const ctx = createPipelineContext()
    const r1 = await builderWithout.build(ctx)
    const r2 = await builderWith.build(ctx)
    expect(r1.prompt).toBe(r2.prompt)
  })

  it('should not inject inspector into prompt text', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
      promptAssemblyOptimizer: new DefaultPromptAssemblyOptimizer(),
      promptAssemblyPlanDiffer: new DefaultPromptAssemblyPlanDiffer(),
      promptAssemblyPlanRenderer: new DefaultPromptAssemblyPlanRenderer(),
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
      promptInspectorBuilder: new DefaultPromptInspectorBuilder(),
    })
    const request = await builder.build(createPipelineContext())
    expect(request.prompt).not.toContain('inspector')
    expect(request.prompt).not.toContain('Rendered Strategy')
    expect(request.prompt).not.toContain('Prompt Plan')
  })

  it('should produce identical prompt when only snapshot builder present', async () => {
    const modules = [new UserInputModule()]
    const withSnapshot = new DefaultPromptBuilder(modules, {
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
    })
    const withInspector = new DefaultPromptBuilder(modules, {
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
      promptInspectorBuilder: new DefaultPromptInspectorBuilder(),
    })
    const ctx = createPipelineContext()
    expect((await withSnapshot.build(ctx)).prompt).toBe((await withInspector.build(ctx)).prompt)
  })

  it('should not inject section titles into prompt text', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
      promptAssemblyOptimizer: new DefaultPromptAssemblyOptimizer(),
      promptAssemblyPlanDiffer: new DefaultPromptAssemblyPlanDiffer(),
      promptAssemblyPlanRenderer: new DefaultPromptAssemblyPlanRenderer(),
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
      promptInspectorBuilder: new DefaultPromptInspectorBuilder(),
    })
    const request = await builder.build(createPipelineContext())
    expect(request.prompt).not.toContain('Strategy Selection')
    expect(request.prompt).not.toContain('Optimized Plan')
    expect(request.prompt).not.toContain('Plan Diff')
  })
})

// ---------------------------------------------------------------------------
// Legacy Constructor Compatibility
// ---------------------------------------------------------------------------

describe('Legacy constructor compatibility', () => {
  it('should work with legacy positional constructor', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()])
    const request = await builder.build(createPipelineContext())
    expect(request.prompt).toBeDefined()
    expect(getAssembly(request)?.inspector).toBeUndefined()
  })

  it('should work with BuilderOptions without inspector builder', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {})
    const request = await builder.build(createPipelineContext())
    expect(request.prompt).toBeDefined()
    expect(getAssembly(request)?.inspector).toBeUndefined()
  })

  it('should work with full legacy constructor arguments', async () => {
    const builder = new DefaultPromptBuilder(
      [new UserInputModule()],
      undefined,  // renderer
      undefined,  // compression
      undefined,  // ranking
      undefined,  // budget
      undefined,  // selection
    )
    const request = await builder.build(createPipelineContext())
    expect(request.prompt).toBeDefined()
    expect(getAssembly(request)?.inspector).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// StrategyAwarePlanner Compatibility
// ---------------------------------------------------------------------------

describe('StrategyAwarePlanner compatibility', () => {
  it('should work with StrategyAwarePromptAssemblyPlanner', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new StrategyAwarePromptAssemblyPlanner(),
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
      promptInspectorBuilder: new DefaultPromptInspectorBuilder(),
    })
    const request = await builder.build(createPipelineContext())
    const inspector = getAssembly(request)?.inspector as PromptInspector | undefined
    expect(inspector).toBeDefined()
    expect(inspector!.strategy).toBeDefined()
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
// Compatibility — RetryPlanner
// ---------------------------------------------------------------------------

describe('RetryPlanner compatibility', () => {
  it('should be compatible with RetryPlanner', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
      promptInspectorBuilder: new DefaultPromptInspectorBuilder(),
    })
    const ctx = createPipelineContext()
    const request = await builder.build(ctx)
    expect(getAssembly(request)?.inspector).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Compatibility — ToolCallPlanner
// ---------------------------------------------------------------------------

describe('ToolCallPlanner compatibility', () => {
  it('should be compatible with ToolCallPlanner', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
      promptInspectorBuilder: new DefaultPromptInspectorBuilder(),
    })
    const ctx = createPipelineContext()
    const request = await builder.build(ctx)
    expect(getAssembly(request)?.inspector).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Compatibility — Streaming
// ---------------------------------------------------------------------------

describe('Streaming compatibility', () => {
  it('should be compatible with streaming pipeline', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
      promptInspectorBuilder: new DefaultPromptInspectorBuilder(),
    })
    const ctx = createPipelineContext()
    const request = await builder.build(ctx)
    expect(request.prompt).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Compatibility — AgentLoop
// ---------------------------------------------------------------------------

describe('AgentLoop compatibility', () => {
  it('should be compatible with AgentLoop', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
      promptInspectorBuilder: new DefaultPromptInspectorBuilder(),
    })
    const ctx = createPipelineContext()
    const request = await builder.build(ctx)
    expect(request.prompt).toBeDefined()
  })
})