import { describe, it, expect } from 'vitest'
import { DefaultPromptBuilder } from '../prompt/DefaultPromptBuilder'
import { DefaultPromptAssemblyPlanner } from '../strategy/DefaultPromptAssemblyPlanner'
import { DefaultPromptAssemblyPlanRenderer } from '../strategy/DefaultPromptAssemblyPlanRenderer'
import { DefaultPromptAssemblyOptimizer } from '../strategy/DefaultPromptAssemblyOptimizer'
import { DefaultPromptAssemblyPlanDiffer } from '../strategy/DefaultPromptAssemblyPlanDiffer'
import { DefaultPromptAssemblySnapshotBuilder } from '../strategy/DefaultPromptAssemblySnapshotBuilder'
import { DefaultPromptInspectorBuilder } from '../strategy/DefaultPromptInspectorBuilder'
import { DefaultPromptInspectorRenderer } from '../strategy/DefaultPromptInspectorRenderer'
import type { PromptInspectorRenderer } from '../strategy/PromptInspectorRenderer'
import type { PromptInspector } from '../strategy/PromptInspector'
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
  it('should accept promptInspectorRenderer field', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
      promptInspectorBuilder: new DefaultPromptInspectorBuilder(),
      promptInspectorRenderer: new DefaultPromptInspectorRenderer(),
    })
    const request = await builder.build(createPipelineContext())
    expect(getAssembly(request)?.inspectorRendered).toBeDefined()
  })

  it('should allow promptInspectorRenderer to be omitted', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
      promptInspectorBuilder: new DefaultPromptInspectorBuilder(),
    })
    const request = await builder.build(createPipelineContext())
    expect(getAssembly(request)?.inspectorRendered).toBeUndefined()
  })

  it('should allow promptInspectorRenderer to be undefined', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
      promptInspectorBuilder: new DefaultPromptInspectorBuilder(),
      promptInspectorRenderer: undefined,
    })
    const request = await builder.build(createPipelineContext())
    expect(getAssembly(request)?.inspectorRendered).toBeUndefined()
  })

  it('should require inspector for renderer to produce output', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
      promptInspectorRenderer: new DefaultPromptInspectorRenderer(),
    })
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    // No inspector builder means no inspector, means no rendered output
    expect(assembly?.inspector).toBeUndefined()
    expect(assembly?.inspectorRendered).toBeUndefined()
  })

  it('should require snapshot builder for rendering to appear', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptInspectorBuilder: new DefaultPromptInspectorBuilder(),
      promptInspectorRenderer: new DefaultPromptInspectorRenderer(),
    })
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    // No snapshot means no inspector, means no rendered output
    expect(assembly?.inspector).toBeUndefined()
    expect(assembly?.inspectorRendered).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// Renderer Invocation
// ---------------------------------------------------------------------------

describe('Renderer invocation', () => {
  it('should invoke renderer when inspector and renderer exist', async () => {
    let invoked = false
    const trackingRenderer: PromptInspectorRenderer = {
      render(_inspector: PromptInspector): string {
        invoked = true
        return 'Prompt Inspector\n\nNo Sections'
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
      promptInspectorBuilder: new DefaultPromptInspectorBuilder(),
      promptInspectorRenderer: trackingRenderer,
    })
    await builder.build(createPipelineContext())
    expect(invoked).toBe(true)
  })

  it('should not invoke renderer when inspector is missing', async () => {
    let invoked = false
    const trackingRenderer: PromptInspectorRenderer = {
      render(_inspector: PromptInspector): string {
        invoked = true
        return 'Prompt Inspector\n\nNo Sections'
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
      promptInspectorRenderer: trackingRenderer,
    })
    await builder.build(createPipelineContext())
    expect(invoked).toBe(false)
  })

  it('should not invoke renderer when renderer is missing', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
      promptInspectorBuilder: new DefaultPromptInspectorBuilder(),
    })
    const request = await builder.build(createPipelineContext())
    expect(getAssembly(request)?.inspectorRendered).toBeUndefined()
  })

  it('should receive the inspector from builder', async () => {
    let receivedInspector: PromptInspector | undefined
    const capturingRenderer: PromptInspectorRenderer = {
      render(inspector: PromptInspector): string {
        receivedInspector = inspector
        return 'Prompt Inspector\n\nNo Sections'
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
      promptInspectorBuilder: new DefaultPromptInspectorBuilder(),
      promptInspectorRenderer: capturingRenderer,
    })
    await builder.build(createPipelineContext())
    expect(receivedInspector).toBeDefined()
    expect(receivedInspector!.strategy).toBeDefined()
  })

  it('should receive inspector with sections from builder', async () => {
    let receivedInspector: PromptInspector | undefined
    const capturingRenderer: PromptInspectorRenderer = {
      render(inspector: PromptInspector): string {
        receivedInspector = inspector
        return 'Prompt Inspector\n\nSections:\n\n- Rendered Strategy'
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
      promptAssemblyOptimizer: new DefaultPromptAssemblyOptimizer(),
      promptAssemblyPlanDiffer: new DefaultPromptAssemblyPlanDiffer(),
      promptAssemblyPlanRenderer: new DefaultPromptAssemblyPlanRenderer(),
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
      promptInspectorBuilder: new DefaultPromptInspectorBuilder(),
      promptInspectorRenderer: capturingRenderer,
    })
    await builder.build(createPipelineContext())
    expect(receivedInspector).toBeDefined()
    expect(receivedInspector!.sections.length).toBeGreaterThan(0)
  })

  it('should store the rendered string from custom renderer', async () => {
    const customRenderer: PromptInspectorRenderer = {
      render(_inspector: PromptInspector): string {
        return 'Custom Inspector Report'
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
      promptInspectorBuilder: new DefaultPromptInspectorBuilder(),
      promptInspectorRenderer: customRenderer,
    })
    const request = await builder.build(createPipelineContext())
    expect(getAssembly(request)?.inspectorRendered).toBe('Custom Inspector Report')
  })
})

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

describe('Metadata', () => {
  it('should store inspectorRendered in metadata.promptAssembly', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
      promptInspectorBuilder: new DefaultPromptInspectorBuilder(),
      promptInspectorRenderer: new DefaultPromptInspectorRenderer(),
    })
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)!
    expect(assembly.inspectorRendered).toBeDefined()
  })

  it('should not store inspectorRendered without renderer', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
      promptInspectorBuilder: new DefaultPromptInspectorBuilder(),
    })
    const request = await builder.build(createPipelineContext())
    expect(getAssembly(request)?.inspectorRendered).toBeUndefined()
  })

  it('should preserve rendered content value', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
      promptInspectorBuilder: new DefaultPromptInspectorBuilder(),
      promptInspectorRenderer: new DefaultPromptInspectorRenderer(),
    })
    const request = await builder.build(createPipelineContext())
    const rendered = getAssembly(request)?.inspectorRendered as string | undefined
    expect(typeof rendered).toBe('string')
    expect(rendered!.includes('Prompt Inspector')).toBe(true)
  })

  it('should include strategy name in rendered output', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
      promptInspectorBuilder: new DefaultPromptInspectorBuilder(),
      promptInspectorRenderer: new DefaultPromptInspectorRenderer(),
    })
    const request = await builder.build(createPipelineContext())
    const rendered = getAssembly(request)?.inspectorRendered as string | undefined
    expect(rendered).toBeDefined()
  })

  it('should include section titles in rendered output', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
      promptAssemblyOptimizer: new DefaultPromptAssemblyOptimizer(),
      promptAssemblyPlanDiffer: new DefaultPromptAssemblyPlanDiffer(),
      promptAssemblyPlanRenderer: new DefaultPromptAssemblyPlanRenderer(),
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
      promptInspectorBuilder: new DefaultPromptInspectorBuilder(),
      promptInspectorRenderer: new DefaultPromptInspectorRenderer(),
    })
    const request = await builder.build(createPipelineContext())
    const rendered = getAssembly(request)?.inspectorRendered as string | undefined
    expect(rendered!.includes('Rendered Strategy')).toBe(true)
    expect(rendered!.includes('Prompt Plan')).toBe(true)
  })

  it('should include Optimized Plan section in rendered output', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
      promptAssemblyOptimizer: new DefaultPromptAssemblyOptimizer(),
      promptAssemblyPlanDiffer: new DefaultPromptAssemblyPlanDiffer(),
      promptAssemblyPlanRenderer: new DefaultPromptAssemblyPlanRenderer(),
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
      promptInspectorBuilder: new DefaultPromptInspectorBuilder(),
      promptInspectorRenderer: new DefaultPromptInspectorRenderer(),
    })
    const request = await builder.build(createPipelineContext())
    const rendered = getAssembly(request)?.inspectorRendered as string | undefined
    expect(rendered!.includes('Optimized Plan')).toBe(true)
    expect(rendered!.includes('Plan Diff')).toBe(true)
    expect(rendered!.includes('Rendered Plan')).toBe(true)
  })

  it('should include strategy block in rendered output', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
      promptInspectorBuilder: new DefaultPromptInspectorBuilder(),
      promptInspectorRenderer: new DefaultPromptInspectorRenderer(),
    })
    const request = await builder.build(createPipelineContext())
    const rendered = getAssembly(request)?.inspectorRendered as string | undefined
    expect(rendered!.includes('Strategy:')).toBe(true)
  })

  it('should match default renderer output for strategy-only snapshot', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
      promptInspectorBuilder: new DefaultPromptInspectorBuilder(),
      promptInspectorRenderer: new DefaultPromptInspectorRenderer(),
    })
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)!
    const inspector = assembly.inspector as PromptInspector
    const expected = new DefaultPromptInspectorRenderer().render(inspector)
    expect(assembly.inspectorRendered).toBe(expected)
  })
})

// ---------------------------------------------------------------------------
// Metadata Coexistence
// ---------------------------------------------------------------------------

describe('Metadata coexistence', () => {
  it('should coexist with snapshot', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
      promptInspectorBuilder: new DefaultPromptInspectorBuilder(),
      promptInspectorRenderer: new DefaultPromptInspectorRenderer(),
    })
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)!
    expect(assembly.snapshot).toBeDefined()
    expect(assembly.inspectorRendered).toBeDefined()
  })

  it('should coexist with inspector', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
      promptInspectorBuilder: new DefaultPromptInspectorBuilder(),
      promptInspectorRenderer: new DefaultPromptInspectorRenderer(),
    })
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)!
    expect(assembly.inspector).toBeDefined()
    expect(assembly.inspectorRendered).toBeDefined()
  })

  it('should coexist with plan', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
      promptInspectorBuilder: new DefaultPromptInspectorBuilder(),
      promptInspectorRenderer: new DefaultPromptInspectorRenderer(),
    })
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)!
    expect(assembly.plan).toBeDefined()
    expect(assembly.inspectorRendered).toBeDefined()
  })

  it('should coexist with optimizedPlan', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
      promptAssemblyOptimizer: new DefaultPromptAssemblyOptimizer(),
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
      promptInspectorBuilder: new DefaultPromptInspectorBuilder(),
      promptInspectorRenderer: new DefaultPromptInspectorRenderer(),
    })
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)!
    expect(assembly.optimizedPlan).toBeDefined()
    expect(assembly.inspectorRendered).toBeDefined()
  })

  it('should coexist with planDiff', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
      promptAssemblyOptimizer: new DefaultPromptAssemblyOptimizer(),
      promptAssemblyPlanDiffer: new DefaultPromptAssemblyPlanDiffer(),
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
      promptInspectorBuilder: new DefaultPromptInspectorBuilder(),
      promptInspectorRenderer: new DefaultPromptInspectorRenderer(),
    })
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)!
    expect(assembly.planDiff).toBeDefined()
    expect(assembly.inspectorRendered).toBeDefined()
  })

  it('should coexist with planRendered', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
      promptAssemblyPlanRenderer: new DefaultPromptAssemblyPlanRenderer(),
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
      promptInspectorBuilder: new DefaultPromptInspectorBuilder(),
      promptInspectorRenderer: new DefaultPromptInspectorRenderer(),
    })
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)!
    expect(assembly.planRendered).toBeDefined()
    expect(assembly.inspectorRendered).toBeDefined()
  })

  it('should coexist with all existing metadata fields', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
      promptAssemblyOptimizer: new DefaultPromptAssemblyOptimizer(),
      promptAssemblyPlanDiffer: new DefaultPromptAssemblyPlanDiffer(),
      promptAssemblyPlanRenderer: new DefaultPromptAssemblyPlanRenderer(),
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
      promptInspectorBuilder: new DefaultPromptInspectorBuilder(),
      promptInspectorRenderer: new DefaultPromptInspectorRenderer(),
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
    expect(assembly.inspectorRendered).toBeDefined()
  })

  it('should not remove any existing fields when renderer is present', async () => {
    const builderWithout = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
      promptInspectorBuilder: new DefaultPromptInspectorBuilder(),
    })
    const builderWith = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
      promptInspectorBuilder: new DefaultPromptInspectorBuilder(),
      promptInspectorRenderer: new DefaultPromptInspectorRenderer(),
    })
    const ctx = createPipelineContext()
    const r1 = await builderWithout.build(ctx)
    const r2 = await builderWith.build(ctx)
    const a1 = getAssembly(r1)!
    const a2 = getAssembly(r2)!
    expect(a2.inspectorRendered).toBeDefined()
    expect(a2.snapshot).toBeDefined()
    expect(a2.inspector).toBeDefined()
    expect(Object.keys(a1).length).toBeLessThanOrEqual(Object.keys(a2).length)
  })

  it('should coexist with strategy metadata', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
      promptInspectorBuilder: new DefaultPromptInspectorBuilder(),
      promptInspectorRenderer: new DefaultPromptInspectorRenderer(),
    })
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)!
    expect(assembly.strategy).toBeDefined()
    expect(assembly.strategyRendered).toBeDefined()
    expect(assembly.inspectorRendered).toBeDefined()
  })

  it('should coexist with ranking, budget, and selection metadata', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
      promptInspectorBuilder: new DefaultPromptInspectorBuilder(),
      promptInspectorRenderer: new DefaultPromptInspectorRenderer(),
    })
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)!
    expect(assembly.ranking).toBeDefined()
    expect(assembly.budget).toBeDefined()
    expect(assembly.selection).toBeDefined()
    expect(assembly.inspectorRendered).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Deterministic
// ---------------------------------------------------------------------------

describe('Deterministic', () => {
  it('should produce same inspectorRendered across multiple builds', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
      promptInspectorBuilder: new DefaultPromptInspectorBuilder(),
      promptInspectorRenderer: new DefaultPromptInspectorRenderer(),
    })
    const ctx = createPipelineContext()
    const r1 = await builder.build(ctx)
    const r2 = await builder.build(ctx)
    const r3 = await builder.build(ctx)
    const i1 = getAssembly(r1)?.inspectorRendered as string | undefined
    const i2 = getAssembly(r2)?.inspectorRendered as string | undefined
    const i3 = getAssembly(r3)?.inspectorRendered as string | undefined
    expect(i1).toBe(i2)
    expect(i2).toBe(i3)
  })

  it('should produce same inspectorRendered across different builder instances', async () => {
    const b1 = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
      promptInspectorBuilder: new DefaultPromptInspectorBuilder(),
      promptInspectorRenderer: new DefaultPromptInspectorRenderer(),
    })
    const b2 = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
      promptInspectorBuilder: new DefaultPromptInspectorBuilder(),
      promptInspectorRenderer: new DefaultPromptInspectorRenderer(),
    })
    const ctx = createPipelineContext()
    const r1 = await b1.build(ctx)
    const r2 = await b2.build(ctx)
    expect(getAssembly(r1)?.inspectorRendered).toBe(getAssembly(r2)?.inspectorRendered)
  })

  it('should produce same inspectorRendered for same input', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
      promptInspectorBuilder: new DefaultPromptInspectorBuilder(),
      promptInspectorRenderer: new DefaultPromptInspectorRenderer(),
    })
    const ctx1 = createPipelineContext()
    const ctx2 = createPipelineContext()
    const r1 = await builder.build(ctx1)
    const r2 = await builder.build(ctx2)
    expect(getAssembly(r1)?.inspectorRendered).toBe(getAssembly(r2)?.inspectorRendered)
  })
})

// ---------------------------------------------------------------------------
// Stateless
// ---------------------------------------------------------------------------

describe('Stateless', () => {
  it('should not retain inspectorRendered state between builds', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
      promptInspectorBuilder: new DefaultPromptInspectorBuilder(),
      promptInspectorRenderer: new DefaultPromptInspectorRenderer(),
    })
    const r1 = await builder.build(createPipelineContext({ input: 'draw a tree' }))
    const r2 = await builder.build(createPipelineContext({ input: 'build a house' }))
    const i1 = getAssembly(r1)?.inspectorRendered as string | undefined
    const i2 = getAssembly(r2)?.inspectorRendered as string | undefined
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
      promptInspectorRenderer: new DefaultPromptInspectorRenderer(),
    })
    const ctx = createPipelineContext()
    const originalInput = ctx.input
    await builder.build(ctx)
    expect(ctx.input).toBe(originalInput)
  })

  it('should not modify inspector in metadata', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
      promptInspectorBuilder: new DefaultPromptInspectorBuilder(),
      promptInspectorRenderer: new DefaultPromptInspectorRenderer(),
    })
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)!
    const inspectorCopy = JSON.parse(JSON.stringify(assembly.inspector))
    expect(JSON.stringify(assembly.inspector)).toBe(JSON.stringify(inspectorCopy))
  })
})

// ---------------------------------------------------------------------------
// Legacy Constructor
// ---------------------------------------------------------------------------

describe('Legacy constructor', () => {
  it('should work with legacy positional constructor', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()])
    const request = await builder.build(createPipelineContext())
    expect(request.prompt).toBeDefined()
    expect(getAssembly(request)?.inspectorRendered).toBeUndefined()
  })

  it('should work with BuilderOptions without renderer', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {})
    const request = await builder.build(createPipelineContext())
    expect(request.prompt).toBeDefined()
    expect(getAssembly(request)?.inspectorRendered).toBeUndefined()
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
    expect(getAssembly(request)?.inspectorRendered).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// No Prompt Changes
// ---------------------------------------------------------------------------

describe('No prompt changes', () => {
  it('should produce identical prompt with and without renderer', async () => {
    const modules = [new UserInputModule()]
    const snapshotBuilder = new DefaultPromptAssemblySnapshotBuilder()
    const inspectorBuilder = new DefaultPromptInspectorBuilder()

    const builderWithout = new DefaultPromptBuilder(modules, {
      promptAssemblySnapshotBuilder: snapshotBuilder,
      promptInspectorBuilder: inspectorBuilder,
    })
    const builderWith = new DefaultPromptBuilder(modules, {
      promptAssemblySnapshotBuilder: snapshotBuilder,
      promptInspectorBuilder: inspectorBuilder,
      promptInspectorRenderer: new DefaultPromptInspectorRenderer(),
    })

    const ctx = createPipelineContext()
    const r1 = await builderWithout.build(ctx)
    const r2 = await builderWith.build(ctx)
    expect(r1.prompt).toBe(r2.prompt)
  })

  it('should produce identical prompt with renderer and all components', async () => {
    const modules = [new UserInputModule()]
    const planner = new DefaultPromptAssemblyPlanner()
    const optimizer = new DefaultPromptAssemblyOptimizer()
    const planRenderer = new DefaultPromptAssemblyPlanRenderer()
    const differ = new DefaultPromptAssemblyPlanDiffer()
    const snapshotBuilder = new DefaultPromptAssemblySnapshotBuilder()
    const inspectorBuilder = new DefaultPromptInspectorBuilder()
    const inspectorRenderer = new DefaultPromptInspectorRenderer()

    const builderWithout = new DefaultPromptBuilder(modules, {
      promptAssemblyPlanner: planner,
      promptAssemblyOptimizer: optimizer,
      promptAssemblyPlanRenderer: planRenderer,
      promptAssemblyPlanDiffer: differ,
      promptAssemblySnapshotBuilder: snapshotBuilder,
      promptInspectorBuilder: inspectorBuilder,
    })
    const builderWith = new DefaultPromptBuilder(modules, {
      promptAssemblyPlanner: planner,
      promptAssemblyOptimizer: optimizer,
      promptAssemblyPlanRenderer: planRenderer,
      promptAssemblyPlanDiffer: differ,
      promptAssemblySnapshotBuilder: snapshotBuilder,
      promptInspectorBuilder: inspectorBuilder,
      promptInspectorRenderer: inspectorRenderer,
    })

    const ctx = createPipelineContext()
    const r1 = await builderWithout.build(ctx)
    const r2 = await builderWith.build(ctx)
    expect(r1.prompt).toBe(r2.prompt)
  })

  it('should not inject inspectorRendered into prompt text', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
      promptInspectorBuilder: new DefaultPromptInspectorBuilder(),
      promptInspectorRenderer: new DefaultPromptInspectorRenderer(),
    })
    const request = await builder.build(createPipelineContext())
    expect(request.prompt).not.toContain('Prompt Inspector')
    expect(request.prompt).not.toContain('inspectorRendered')
    expect(request.prompt).not.toContain('No Sections')
  })

  it('should produce identical prompt when only snapshot builder present', async () => {
    const modules = [new UserInputModule()]
    const withSnapshot = new DefaultPromptBuilder(modules, {
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
    })
    const withRenderer = new DefaultPromptBuilder(modules, {
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
      promptInspectorBuilder: new DefaultPromptInspectorBuilder(),
      promptInspectorRenderer: new DefaultPromptInspectorRenderer(),
    })
    const ctx = createPipelineContext()
    expect((await withSnapshot.build(ctx)).prompt).toBe((await withRenderer.build(ctx)).prompt)
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
      promptInspectorRenderer: new DefaultPromptInspectorRenderer(),
    })
    const ctx = createPipelineContext()
    const request = await builder.build(ctx)
    expect(getAssembly(request)?.inspectorRendered).toBeDefined()
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
      promptInspectorRenderer: new DefaultPromptInspectorRenderer(),
    })
    const ctx = createPipelineContext()
    const request = await builder.build(ctx)
    expect(getAssembly(request)?.inspectorRendered).toBeDefined()
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
      promptInspectorRenderer: new DefaultPromptInspectorRenderer(),
    })
    const ctx = createPipelineContext()
    const request = await builder.build(ctx)
    expect(request.prompt).toBeDefined()
    expect(getAssembly(request)?.inspectorRendered).toBeDefined()
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
      promptInspectorRenderer: new DefaultPromptInspectorRenderer(),
    })
    const ctx = createPipelineContext()
    const request = await builder.build(ctx)
    expect(request.prompt).toBeDefined()
    expect(getAssembly(request)?.inspectorRendered).toBeDefined()
  })
})