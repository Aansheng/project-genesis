import { describe, it, expect } from 'vitest'
import { DefaultPromptBuilder } from '../prompt/DefaultPromptBuilder'
import { DefaultPromptAssemblyPlanner } from '../strategy/DefaultPromptAssemblyPlanner'
import { DefaultPromptAssemblyPlanRenderer } from '../strategy/DefaultPromptAssemblyPlanRenderer'
import { DefaultPromptAssemblyOptimizer } from '../strategy/DefaultPromptAssemblyOptimizer'
import { DefaultPromptAssemblyPlanDiffer } from '../strategy/DefaultPromptAssemblyPlanDiffer'
import { DefaultPromptAssemblySnapshotBuilder } from '../strategy/DefaultPromptAssemblySnapshotBuilder'
import { DefaultPromptInspectorBuilder } from '../strategy/DefaultPromptInspectorBuilder'
import { DefaultPromptInspectorRenderer } from '../strategy/DefaultPromptInspectorRenderer'
import { DefaultPromptInspectorExporter } from '../strategy/DefaultPromptInspectorExporter'
import type { PromptInspectorExporter } from '../strategy/PromptInspectorExporter'
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
  it('should accept promptInspectorExporter field', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
      promptInspectorBuilder: new DefaultPromptInspectorBuilder(),
      promptInspectorExporter: new DefaultPromptInspectorExporter(),
    })
    const request = await builder.build(createPipelineContext())
    expect(getAssembly(request)?.inspectorExported).toBeDefined()
  })

  it('should allow promptInspectorExporter to be omitted', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
      promptInspectorBuilder: new DefaultPromptInspectorBuilder(),
    })
    const request = await builder.build(createPipelineContext())
    expect(getAssembly(request)?.inspectorExported).toBeUndefined()
  })

  it('should allow promptInspectorExporter to be undefined', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
      promptInspectorBuilder: new DefaultPromptInspectorBuilder(),
      promptInspectorExporter: undefined,
    })
    const request = await builder.build(createPipelineContext())
    expect(getAssembly(request)?.inspectorExported).toBeUndefined()
  })

  it('should require inspector for exporter to produce output', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
      promptInspectorExporter: new DefaultPromptInspectorExporter(),
    })
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)
    // No inspector builder means no inspector, means no exported output
    expect(assembly?.inspector).toBeUndefined()
    expect(assembly?.inspectorExported).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// Exporter Invocation
// ---------------------------------------------------------------------------

describe('Exporter invocation', () => {
  it('should invoke exporter when inspector and exporter exist', async () => {
    let invoked = false
    const trackingExporter: PromptInspectorExporter = {
      export(_inspector: PromptInspector): string {
        invoked = true
        return '{}'
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
      promptInspectorBuilder: new DefaultPromptInspectorBuilder(),
      promptInspectorExporter: trackingExporter,
    })
    await builder.build(createPipelineContext())
    expect(invoked).toBe(true)
  })

  it('should invoke exporter exactly once per build', async () => {
    let calls = 0
    const countingExporter: PromptInspectorExporter = {
      export(_inspector: PromptInspector): string {
        calls++
        return '{}'
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
      promptInspectorBuilder: new DefaultPromptInspectorBuilder(),
      promptInspectorExporter: countingExporter,
    })
    await builder.build(createPipelineContext())
    expect(calls).toBe(1)
  })

  it('should not invoke exporter when inspector is missing', async () => {
    let invoked = false
    const trackingExporter: PromptInspectorExporter = {
      export(_inspector: PromptInspector): string {
        invoked = true
        return '{}'
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
      promptInspectorExporter: trackingExporter,
    })
    await builder.build(createPipelineContext())
    expect(invoked).toBe(false)
  })

  it('should not invoke exporter when exporter is missing', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
      promptInspectorBuilder: new DefaultPromptInspectorBuilder(),
    })
    const request = await builder.build(createPipelineContext())
    expect(getAssembly(request)?.inspectorExported).toBeUndefined()
  })

  it('should receive the inspector from builder', async () => {
    let receivedInspector: PromptInspector | undefined
    const capturingExporter: PromptInspectorExporter = {
      export(inspector: PromptInspector): string {
        receivedInspector = inspector
        return JSON.stringify(inspector)
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
      promptInspectorBuilder: new DefaultPromptInspectorBuilder(),
      promptInspectorExporter: capturingExporter,
    })
    await builder.build(createPipelineContext())
    expect(receivedInspector).toBeDefined()
    expect(receivedInspector!.strategy).toBeDefined()
  })

  it('should receive inspector with sections from builder', async () => {
    let receivedInspector: PromptInspector | undefined
    const capturingExporter: PromptInspectorExporter = {
      export(inspector: PromptInspector): string {
        receivedInspector = inspector
        return JSON.stringify(inspector)
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
      promptAssemblyOptimizer: new DefaultPromptAssemblyOptimizer(),
      promptAssemblyPlanDiffer: new DefaultPromptAssemblyPlanDiffer(),
      promptAssemblyPlanRenderer: new DefaultPromptAssemblyPlanRenderer(),
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
      promptInspectorBuilder: new DefaultPromptInspectorBuilder(),
      promptInspectorExporter: capturingExporter,
    })
    await builder.build(createPipelineContext())
    expect(receivedInspector).toBeDefined()
    expect(receivedInspector!.sections.length).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// Metadata Creation
// ---------------------------------------------------------------------------

describe('Metadata creation', () => {
  it('should store inspectorExported in metadata.promptAssembly', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
      promptInspectorBuilder: new DefaultPromptInspectorBuilder(),
      promptInspectorExporter: new DefaultPromptInspectorExporter(),
    })
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)!
    expect(assembly.inspectorExported).toBeDefined()
  })

  it('should not store inspectorExported without exporter', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
      promptInspectorBuilder: new DefaultPromptInspectorBuilder(),
    })
    const request = await builder.build(createPipelineContext())
    expect(getAssembly(request)?.inspectorExported).toBeUndefined()
  })

  it('should not store inspectorExported without inspector', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
      promptInspectorExporter: new DefaultPromptInspectorExporter(),
    })
    const request = await builder.build(createPipelineContext())
    expect(getAssembly(request)?.inspectorExported).toBeUndefined()
  })

  it('should preserve exported content value from custom exporter', async () => {
    const customExporter: PromptInspectorExporter = {
      export(_inspector: PromptInspector): string {
        return 'Custom Inspector Export'
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
      promptInspectorBuilder: new DefaultPromptInspectorBuilder(),
      promptInspectorExporter: customExporter,
    })
    const request = await builder.build(createPipelineContext())
    expect(getAssembly(request)?.inspectorExported).toBe('Custom Inspector Export')
  })

  it('should store inspectorExported as a string', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
      promptInspectorBuilder: new DefaultPromptInspectorBuilder(),
      promptInspectorExporter: new DefaultPromptInspectorExporter(),
    })
    const request = await builder.build(createPipelineContext())
    const exported = getAssembly(request)?.inspectorExported as string | undefined
    expect(typeof exported).toBe('string')
  })

  it('should produce parseable JSON with strategy name using default exporter', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
      promptInspectorBuilder: new DefaultPromptInspectorBuilder(),
      promptInspectorExporter: new DefaultPromptInspectorExporter(),
    })
    const request = await builder.build(createPipelineContext())
    const exported = getAssembly(request)?.inspectorExported as string | undefined
    const parsed = JSON.parse(exported!) as { strategy?: string }
    expect(parsed.strategy).toBeDefined()
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
      promptInspectorExporter: new DefaultPromptInspectorExporter(),
    })
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)!
    expect(assembly.snapshot).toBeDefined()
    expect(assembly.inspectorExported).toBeDefined()
  })

  it('should coexist with inspector', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
      promptInspectorBuilder: new DefaultPromptInspectorBuilder(),
      promptInspectorExporter: new DefaultPromptInspectorExporter(),
    })
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)!
    expect(assembly.inspector).toBeDefined()
    expect(assembly.inspectorExported).toBeDefined()
  })

  it('should coexist with inspectorRendered', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
      promptInspectorBuilder: new DefaultPromptInspectorBuilder(),
      promptInspectorRenderer: new DefaultPromptInspectorRenderer(),
      promptInspectorExporter: new DefaultPromptInspectorExporter(),
    })
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)!
    expect(assembly.inspectorRendered).toBeDefined()
    expect(assembly.inspectorExported).toBeDefined()
  })

  it('should coexist with plan', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
      promptInspectorBuilder: new DefaultPromptInspectorBuilder(),
      promptInspectorExporter: new DefaultPromptInspectorExporter(),
    })
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)!
    expect(assembly.plan).toBeDefined()
    expect(assembly.inspectorExported).toBeDefined()
  })

  it('should coexist with optimizedPlan', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
      promptAssemblyOptimizer: new DefaultPromptAssemblyOptimizer(),
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
      promptInspectorBuilder: new DefaultPromptInspectorBuilder(),
      promptInspectorExporter: new DefaultPromptInspectorExporter(),
    })
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)!
    expect(assembly.optimizedPlan).toBeDefined()
    expect(assembly.inspectorExported).toBeDefined()
  })

  it('should coexist with planDiff', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyPlanner: new DefaultPromptAssemblyPlanner(),
      promptAssemblyOptimizer: new DefaultPromptAssemblyOptimizer(),
      promptAssemblyPlanDiffer: new DefaultPromptAssemblyPlanDiffer(),
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
      promptInspectorBuilder: new DefaultPromptInspectorBuilder(),
      promptInspectorExporter: new DefaultPromptInspectorExporter(),
    })
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)!
    expect(assembly.planDiff).toBeDefined()
    expect(assembly.inspectorExported).toBeDefined()
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
      promptInspectorExporter: new DefaultPromptInspectorExporter(),
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
    expect(assembly.inspectorExported).toBeDefined()
  })

  it('should coexist with strategy metadata and ranking/budget/selection', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
      promptInspectorBuilder: new DefaultPromptInspectorBuilder(),
      promptInspectorExporter: new DefaultPromptInspectorExporter(),
    })
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)!
    expect(assembly.strategy).toBeDefined()
    expect(assembly.strategyRendered).toBeDefined()
    expect(assembly.ranking).toBeDefined()
    expect(assembly.budget).toBeDefined()
    expect(assembly.selection).toBeDefined()
    expect(assembly.inspectorExported).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Deterministic
// ---------------------------------------------------------------------------

describe('Deterministic', () => {
  it('should produce same inspectorExported across multiple builds', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
      promptInspectorBuilder: new DefaultPromptInspectorBuilder(),
      promptInspectorExporter: new DefaultPromptInspectorExporter(),
    })
    const ctx = createPipelineContext()
    const r1 = await builder.build(ctx)
    const r2 = await builder.build(ctx)
    const r3 = await builder.build(ctx)
    const e1 = getAssembly(r1)?.inspectorExported as string | undefined
    const e2 = getAssembly(r2)?.inspectorExported as string | undefined
    const e3 = getAssembly(r3)?.inspectorExported as string | undefined
    expect(e1).toBe(e2)
    expect(e2).toBe(e3)
  })

  it('should produce same inspectorExported across different builder instances', async () => {
    const b1 = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
      promptInspectorBuilder: new DefaultPromptInspectorBuilder(),
      promptInspectorExporter: new DefaultPromptInspectorExporter(),
    })
    const b2 = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
      promptInspectorBuilder: new DefaultPromptInspectorBuilder(),
      promptInspectorExporter: new DefaultPromptInspectorExporter(),
    })
    const ctx = createPipelineContext()
    const r1 = await b1.build(ctx)
    const r2 = await b2.build(ctx)
    expect(getAssembly(r1)?.inspectorExported).toBe(getAssembly(r2)?.inspectorExported)
  })

  it('should produce same inspectorExported for same input', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
      promptInspectorBuilder: new DefaultPromptInspectorBuilder(),
      promptInspectorExporter: new DefaultPromptInspectorExporter(),
    })
    const ctx1 = createPipelineContext()
    const ctx2 = createPipelineContext()
    const r1 = await builder.build(ctx1)
    const r2 = await builder.build(ctx2)
    expect(getAssembly(r1)?.inspectorExported).toBe(getAssembly(r2)?.inspectorExported)
  })
})

// ---------------------------------------------------------------------------
// Stateless
// ---------------------------------------------------------------------------

describe('Stateless', () => {
  it('should not retain inspectorExported state between builds', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
      promptInspectorBuilder: new DefaultPromptInspectorBuilder(),
      promptInspectorExporter: new DefaultPromptInspectorExporter(),
    })
    const r1 = await builder.build(createPipelineContext({ input: 'draw a tree' }))
    const r2 = await builder.build(createPipelineContext({ input: 'build a house' }))
    const e1 = getAssembly(r1)?.inspectorExported as string | undefined
    const e2 = getAssembly(r2)?.inspectorExported as string | undefined
    expect(e1).toBeDefined()
    expect(e2).toBeDefined()
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
      promptInspectorExporter: new DefaultPromptInspectorExporter(),
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
      promptInspectorExporter: new DefaultPromptInspectorExporter(),
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
    expect(getAssembly(request)?.inspectorExported).toBeUndefined()
  })

  it('should work with BuilderOptions without exporter', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {})
    const request = await builder.build(createPipelineContext())
    expect(request.prompt).toBeDefined()
    expect(getAssembly(request)?.inspectorExported).toBeUndefined()
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
    expect(getAssembly(request)?.inspectorExported).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// No Prompt Changes
// ---------------------------------------------------------------------------

describe('No prompt changes', () => {
  it('should produce identical prompt with and without exporter', async () => {
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
      promptInspectorExporter: new DefaultPromptInspectorExporter(),
    })

    const ctx = createPipelineContext()
    const r1 = await builderWithout.build(ctx)
    const r2 = await builderWith.build(ctx)
    expect(r1.prompt).toBe(r2.prompt)
  })

  it('should produce identical prompt with exporter and all components', async () => {
    const modules = [new UserInputModule()]
    const planner = new DefaultPromptAssemblyPlanner()
    const optimizer = new DefaultPromptAssemblyOptimizer()
    const planRenderer = new DefaultPromptAssemblyPlanRenderer()
    const differ = new DefaultPromptAssemblyPlanDiffer()
    const snapshotBuilder = new DefaultPromptAssemblySnapshotBuilder()
    const inspectorBuilder = new DefaultPromptInspectorBuilder()
    const inspectorRenderer = new DefaultPromptInspectorRenderer()
    const inspectorExporter = new DefaultPromptInspectorExporter()

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
      promptInspectorExporter: inspectorExporter,
    })

    const ctx = createPipelineContext()
    const r1 = await builderWithout.build(ctx)
    const r2 = await builderWith.build(ctx)
    expect(r1.prompt).toBe(r2.prompt)
  })

  it('should not inject inspectorExported into prompt text', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
      promptInspectorBuilder: new DefaultPromptInspectorBuilder(),
      promptInspectorExporter: new DefaultPromptInspectorExporter(),
    })
    const request = await builder.build(createPipelineContext())
    expect(request.prompt).not.toContain('inspectorExported')
    expect(request.prompt).not.toContain('"strategy"')
    expect(request.prompt).not.toContain('Prompt Inspector')
  })

  it('should produce identical prompt when only snapshot builder present', async () => {
    const modules = [new UserInputModule()]
    const withSnapshot = new DefaultPromptBuilder(modules, {
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
    })
    const withExporter = new DefaultPromptBuilder(modules, {
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
      promptInspectorBuilder: new DefaultPromptInspectorBuilder(),
      promptInspectorExporter: new DefaultPromptInspectorExporter(),
    })
    const ctx = createPipelineContext()
    expect((await withSnapshot.build(ctx)).prompt).toBe((await withExporter.build(ctx)).prompt)
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
      promptInspectorExporter: new DefaultPromptInspectorExporter(),
    })
    const ctx = createPipelineContext()
    const request = await builder.build(ctx)
    expect(getAssembly(request)?.inspectorExported).toBeDefined()
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
      promptInspectorExporter: new DefaultPromptInspectorExporter(),
    })
    const ctx = createPipelineContext()
    const request = await builder.build(ctx)
    expect(getAssembly(request)?.inspectorExported).toBeDefined()
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
      promptInspectorExporter: new DefaultPromptInspectorExporter(),
    })
    const ctx = createPipelineContext()
    const request = await builder.build(ctx)
    expect(request.prompt).toBeDefined()
    expect(getAssembly(request)?.inspectorExported).toBeDefined()
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
      promptInspectorExporter: new DefaultPromptInspectorExporter(),
    })
    const ctx = createPipelineContext()
    const request = await builder.build(ctx)
    expect(request.prompt).toBeDefined()
    expect(getAssembly(request)?.inspectorExported).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

describe('Exports', () => {
  it('should export DefaultPromptInspectorExporter from strategy index', async () => {
    const mod = await import('../strategy')
    expect(mod.DefaultPromptInspectorExporter).toBeDefined()
  })

  it('should export DefaultPromptInspectorExporter from package root', async () => {
    const mod = await import('..')
    expect(mod.DefaultPromptInspectorExporter).toBeDefined()
  })

  it('should export DefaultPromptInspectorExporter as a class', () => {
    const exporter = new DefaultPromptInspectorExporter()
    expect(exporter).toBeInstanceOf(DefaultPromptInspectorExporter)
  })
})

// ---------------------------------------------------------------------------
// Snapshot Dependency
// ---------------------------------------------------------------------------

describe('Snapshot dependency', () => {
  it('should not invoke exporter when snapshot is missing', async () => {
    let invoked = false
    const trackingExporter: PromptInspectorExporter = {
      export(_inspector: PromptInspector): string {
        invoked = true
        return '{}'
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptInspectorBuilder: new DefaultPromptInspectorBuilder(),
      promptInspectorExporter: trackingExporter,
    })
    await builder.build(createPipelineContext())
    expect(invoked).toBe(false)
  })

  it('should not store inspectorExported when only snapshot builder is present', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
      promptInspectorExporter: new DefaultPromptInspectorExporter(),
    })
    const request = await builder.build(createPipelineContext())
    expect(getAssembly(request)?.inspectorExported).toBeUndefined()
  })

  it('should require full snapshot → inspector → export chain', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
      promptInspectorBuilder: new DefaultPromptInspectorBuilder(),
      promptInspectorExporter: new DefaultPromptInspectorExporter(),
    })
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)!
    expect(assembly.snapshot).toBeDefined()
    expect(assembly.inspector).toBeDefined()
    expect(assembly.inspectorExported).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Inspector Dependency
// ---------------------------------------------------------------------------

describe('Inspector dependency', () => {
  it('should not invoke exporter when inspector builder is missing', async () => {
    let invoked = false
    const trackingExporter: PromptInspectorExporter = {
      export(_inspector: PromptInspector): string {
        invoked = true
        return '{}'
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
      promptInspectorExporter: trackingExporter,
    })
    await builder.build(createPipelineContext())
    expect(invoked).toBe(false)
  })

  it('should export the same inspector that is stored in metadata', async () => {
    let receivedInspector: PromptInspector | undefined
    const capturingExporter: PromptInspectorExporter = {
      export(inspector: PromptInspector): string {
        receivedInspector = inspector
        return JSON.stringify(inspector)
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
      promptInspectorBuilder: new DefaultPromptInspectorBuilder(),
      promptInspectorExporter: capturingExporter,
    })
    const request = await builder.build(createPipelineContext())
    const assembly = getAssembly(request)!
    expect(receivedInspector).toBeDefined()
    expect(JSON.stringify(receivedInspector)).toBe(JSON.stringify(assembly.inspector))
  })

  it('should produce output only when inspector exists', async () => {
    const builderWith = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
      promptInspectorBuilder: new DefaultPromptInspectorBuilder(),
      promptInspectorExporter: new DefaultPromptInspectorExporter(),
    })
    const builderWithout = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblySnapshotBuilder: new DefaultPromptAssemblySnapshotBuilder(),
      promptInspectorExporter: new DefaultPromptInspectorExporter(),
    })
    const withRequest = await builderWith.build(createPipelineContext())
    const withoutRequest = await builderWithout.build(createPipelineContext())
    expect(getAssembly(withRequest)?.inspectorExported).toBeDefined()
    expect(getAssembly(withoutRequest)?.inspectorExported).toBeUndefined()
  })
})
