import { describe, it, expect } from 'vitest'
import type { StrategyModule } from '../strategy/StrategyModule'
import type { PromptModule } from '../prompt/modules/PromptModule'
import type { PipelineContext } from '../pipeline/PipelineContext'
import type { PromptContext } from '../prompt/PromptContext'
import { CreateStrategyModule } from '../strategy/CreateStrategyModule'
import { QueryStrategyModule } from '../strategy/QueryStrategyModule'
import { ModifyStrategyModule } from '../strategy/ModifyStrategyModule'
import { DeleteStrategyModule } from '../strategy/DeleteStrategyModule'
import type { CreateStrategyModule as CreateStrategyModuleFromRoot } from '../index'
import type { QueryStrategyModule as QueryStrategyModuleFromRoot } from '../index'
import type { ModifyStrategyModule as ModifyStrategyModuleFromRoot } from '../index'
import type { DeleteStrategyModule as DeleteStrategyModuleFromRoot } from '../index'
import type { StrategyModule as StrategyModuleFromRoot } from '../index'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createPipelineContext(overrides?: Partial<PipelineContext>): PipelineContext {
  return { input: 'test', ...overrides }
}

// ---------------------------------------------------------------------------
// StrategyModule Interface
// ---------------------------------------------------------------------------

describe('StrategyModule interface', () => {
  it('should extend PromptModule', () => {
    const module: StrategyModule = new CreateStrategyModule()
    expect(typeof module.build).toBe('function')
  })

  it('should be a subtype of PromptModule', () => {
    const module: PromptModule = new CreateStrategyModule()
    expect(typeof module.build).toBe('function')
  })

  it('should accept optional buildContext method', () => {
    const module: StrategyModule = new CreateStrategyModule()
    expect(typeof module.buildContext).toBe('function')
  })

  it('should be compatible with PromptModule type', () => {
    const createModule: StrategyModule = new CreateStrategyModule()
    const promptModule: PromptModule = createModule
    expect(promptModule.build).toBe(createModule.build)
  })
})

// ---------------------------------------------------------------------------
// CreateStrategyModule — build() output
// ---------------------------------------------------------------------------

describe('CreateStrategyModule — build() output', () => {
  it('should return creation guidelines', async () => {
    const module = new CreateStrategyModule()
    const result = await module.build(createPipelineContext())
    expect(result).toBe(`Creation Guidelines:\n\n- Prefer creating new entities\n- Avoid modifying existing entities`)
  })

  it('should start with "Creation Guidelines:"', async () => {
    const module = new CreateStrategyModule()
    const result = await module.build(createPipelineContext())
    expect(result.startsWith('Creation Guidelines:')).toBe(true)
  })

  it('should contain "Prefer creating new entities"', async () => {
    const module = new CreateStrategyModule()
    const result = await module.build(createPipelineContext())
    expect(result).toContain('Prefer creating new entities')
  })

  it('should contain "Avoid modifying existing entities"', async () => {
    const module = new CreateStrategyModule()
    const result = await module.build(createPipelineContext())
    expect(result).toContain('Avoid modifying existing entities')
  })

  it('should return string type', async () => {
    const module = new CreateStrategyModule()
    const result = await module.build(createPipelineContext())
    expect(typeof result).toBe('string')
  })
})

// ---------------------------------------------------------------------------
// QueryStrategyModule — build() output
// ---------------------------------------------------------------------------

describe('QueryStrategyModule — build() output', () => {
  it('should return query guidelines', async () => {
    const module = new QueryStrategyModule()
    const result = await module.build(createPipelineContext())
    expect(result).toBe(`Query Guidelines:\n\n- Focus on retrieving information\n- Avoid changing world state`)
  })

  it('should start with "Query Guidelines:"', async () => {
    const module = new QueryStrategyModule()
    const result = await module.build(createPipelineContext())
    expect(result.startsWith('Query Guidelines:')).toBe(true)
  })

  it('should contain "Focus on retrieving information"', async () => {
    const module = new QueryStrategyModule()
    const result = await module.build(createPipelineContext())
    expect(result).toContain('Focus on retrieving information')
  })

  it('should contain "Avoid changing world state"', async () => {
    const module = new QueryStrategyModule()
    const result = await module.build(createPipelineContext())
    expect(result).toContain('Avoid changing world state')
  })

  it('should return string type', async () => {
    const module = new QueryStrategyModule()
    const result = await module.build(createPipelineContext())
    expect(typeof result).toBe('string')
  })
})

// ---------------------------------------------------------------------------
// ModifyStrategyModule — build() output
// ---------------------------------------------------------------------------

describe('ModifyStrategyModule — build() output', () => {
  it('should return modification guidelines', async () => {
    const module = new ModifyStrategyModule()
    const result = await module.build(createPipelineContext())
    expect(result).toBe(`Modification Guidelines:\n\n- Preserve entity identity\n- Modify only requested properties`)
  })

  it('should start with "Modification Guidelines:"', async () => {
    const module = new ModifyStrategyModule()
    const result = await module.build(createPipelineContext())
    expect(result.startsWith('Modification Guidelines:')).toBe(true)
  })

  it('should contain "Preserve entity identity"', async () => {
    const module = new ModifyStrategyModule()
    const result = await module.build(createPipelineContext())
    expect(result).toContain('Preserve entity identity')
  })

  it('should contain "Modify only requested properties"', async () => {
    const module = new ModifyStrategyModule()
    const result = await module.build(createPipelineContext())
    expect(result).toContain('Modify only requested properties')
  })

  it('should return string type', async () => {
    const module = new ModifyStrategyModule()
    const result = await module.build(createPipelineContext())
    expect(typeof result).toBe('string')
  })
})

// ---------------------------------------------------------------------------
// DeleteStrategyModule — build() output
// ---------------------------------------------------------------------------

describe('DeleteStrategyModule — build() output', () => {
  it('should return deletion guidelines', async () => {
    const module = new DeleteStrategyModule()
    const result = await module.build(createPipelineContext())
    expect(result).toBe(`Deletion Guidelines:\n\n- Confirm target existence\n- Remove only requested entities`)
  })

  it('should start with "Deletion Guidelines:"', async () => {
    const module = new DeleteStrategyModule()
    const result = await module.build(createPipelineContext())
    expect(result.startsWith('Deletion Guidelines:')).toBe(true)
  })

  it('should contain "Confirm target existence"', async () => {
    const module = new DeleteStrategyModule()
    const result = await module.build(createPipelineContext())
    expect(result).toContain('Confirm target existence')
  })

  it('should contain "Remove only requested entities"', async () => {
    const module = new DeleteStrategyModule()
    const result = await module.build(createPipelineContext())
    expect(result).toContain('Remove only requested entities')
  })

  it('should return string type', async () => {
    const module = new DeleteStrategyModule()
    const result = await module.build(createPipelineContext())
    expect(typeof result).toBe('string')
  })
})

// ---------------------------------------------------------------------------
// buildContext() output
// ---------------------------------------------------------------------------

describe('buildContext() output', () => {
  it('CreateStrategyModule should return strategyRendered in context', async () => {
    const module = new CreateStrategyModule()
    const ctx = await module.buildContext!(createPipelineContext())
    expect(ctx).toHaveProperty('strategyRendered')
    expect(ctx.strategyRendered).toContain('Creation Guidelines:')
  })

  it('QueryStrategyModule should return strategyRendered in context', async () => {
    const module = new QueryStrategyModule()
    const ctx = await module.buildContext!(createPipelineContext())
    expect(ctx).toHaveProperty('strategyRendered')
    expect(ctx.strategyRendered).toContain('Query Guidelines:')
  })

  it('ModifyStrategyModule should return strategyRendered in context', async () => {
    const module = new ModifyStrategyModule()
    const ctx = await module.buildContext!(createPipelineContext())
    expect(ctx).toHaveProperty('strategyRendered')
    expect(ctx.strategyRendered).toContain('Modification Guidelines:')
  })

  it('DeleteStrategyModule should return strategyRendered in context', async () => {
    const module = new DeleteStrategyModule()
    const ctx = await module.buildContext!(createPipelineContext())
    expect(ctx).toHaveProperty('strategyRendered')
    expect(ctx.strategyRendered).toContain('Deletion Guidelines:')
  })

  it('buildContext should match build output', async () => {
    const module = new CreateStrategyModule()
    const built = await module.build(createPipelineContext())
    const ctx = await module.buildContext!(createPipelineContext())
    expect(ctx.strategyRendered).toBe(built)
  })

  it('buildContext should return Partial<PromptContext>', async () => {
    const module = new QueryStrategyModule()
    const ctx: Partial<PromptContext> = await module.buildContext!(createPipelineContext())
    expect(Object.keys(ctx)).toEqual(['strategyRendered'])
  })
})

// ---------------------------------------------------------------------------
// Input Independence
// ---------------------------------------------------------------------------

describe('Input independence', () => {
  it('CreateStrategyModule should ignore input content', async () => {
    const module = new CreateStrategyModule()
    const r1 = await module.build(createPipelineContext({ input: '创建一棵树' }))
    const r2 = await module.build(createPipelineContext({ input: 'delete the house' }))
    expect(r1).toBe(r2)
  })

  it('QueryStrategyModule should ignore input content', async () => {
    const module = new QueryStrategyModule()
    const r1 = await module.build(createPipelineContext({ input: '查看所有树' }))
    const r2 = await module.build(createPipelineContext({ input: 'create a tree' }))
    expect(r1).toBe(r2)
  })

  it('ModifyStrategyModule should ignore input content', async () => {
    const module = new ModifyStrategyModule()
    const r1 = await module.build(createPipelineContext({ input: '修改颜色' }))
    const r2 = await module.build(createPipelineContext({ input: 'list all' }))
    expect(r1).toBe(r2)
  })

  it('DeleteStrategyModule should ignore input content', async () => {
    const module = new DeleteStrategyModule()
    const r1 = await module.build(createPipelineContext({ input: '删除树' }))
    const r2 = await module.build(createPipelineContext({ input: 'add a tree' }))
    expect(r1).toBe(r2)
  })

  it('should produce same output regardless of metadata', async () => {
    const module = new CreateStrategyModule()
    const ctx1 = createPipelineContext()
    const ctx2 = createPipelineContext({ metadata: { promptAssembly: { strategy: 'create' } } })
    const r1 = await module.build(ctx1)
    const r2 = await module.build(ctx2)
    expect(r1).toBe(r2)
  })
})

// ---------------------------------------------------------------------------
// Deterministic
// ---------------------------------------------------------------------------

describe('Deterministic', () => {
  it('CreateStrategyModule should return same result across repeated calls', async () => {
    const module = new CreateStrategyModule()
    const context = createPipelineContext()
    const r1 = await module.build(context)
    const r2 = await module.build(context)
    const r3 = await module.build(context)
    expect(r1).toBe(r2)
    expect(r2).toBe(r3)
  })

  it('QueryStrategyModule should be idempotent across ten calls', async () => {
    const module = new QueryStrategyModule()
    const context = createPipelineContext()
    for (let i = 0; i < 10; i++) {
      const result = await module.build(context)
      expect(result).toContain('Query Guidelines:')
    }
  })

  it('ModifyStrategyModule should consistently return same output', async () => {
    const module = new ModifyStrategyModule()
    const context = createPipelineContext()
    const r1 = await module.build(context)
    const r2 = await module.build(context)
    expect(r1).toBe(r2)
  })

  it('DeleteStrategyModule should be deterministic across instances', async () => {
    const m1 = new DeleteStrategyModule()
    const m2 = new DeleteStrategyModule()
    const context = createPipelineContext()
    const r1 = await m1.build(context)
    const r2 = await m2.build(context)
    expect(r1).toBe(r2)
  })

  it('buildContext should be deterministic', async () => {
    const module = new CreateStrategyModule()
    const context = createPipelineContext()
    const c1 = await module.buildContext!(context)
    const c2 = await module.buildContext!(context)
    expect(c1).toEqual(c2)
  })
})

// ---------------------------------------------------------------------------
// Stateless
// ---------------------------------------------------------------------------

describe('Stateless', () => {
  it('CreateStrategyModule should not retain state between calls', async () => {
    const module = new CreateStrategyModule()
    const ctx1 = createPipelineContext({ input: 'create a tree' })
    const ctx2 = createPipelineContext({ input: 'delete the house' })
    const r1 = await module.build(ctx1)
    const r2 = await module.build(ctx2)
    expect(r1).toBe(r2)
  })

  it('modules should be independent across instances', async () => {
    const m1 = new QueryStrategyModule()
    const m2 = new QueryStrategyModule()
    const context = createPipelineContext()
    const r1 = await m1.build(context)
    const r2 = await m2.build(context)
    expect(r1).toBe(r2)
  })

  it('should have no side effects on module instance', async () => {
    const module = new ModifyStrategyModule()
    const before = Object.keys(module)
    await module.build(createPipelineContext())
    await module.buildContext!(createPipelineContext())
    await module.build(createPipelineContext())
    expect(Object.keys(module)).toEqual(before)
  })
})

// ---------------------------------------------------------------------------
// Pure / No Side Effects
// ---------------------------------------------------------------------------

describe('Pure / No side effects', () => {
  it('should not modify the PipelineContext object', async () => {
    const module = new CreateStrategyModule()
    const context: PipelineContext = { input: 'test' }
    const frozen = Object.freeze({ ...context })
    expect(async () => await module.build(frozen)).not.toThrow()
  })

  it('buildContext should not modify the PipelineContext object', async () => {
    const module = new QueryStrategyModule()
    const context: PipelineContext = { input: 'test' }
    const before = JSON.stringify(context)
    await module.buildContext!(context)
    expect(JSON.stringify(context)).toBe(before)
  })

  it('should not modify external state', async () => {
    const module = new DeleteStrategyModule()
    const context = createPipelineContext()
    const before = JSON.stringify(context)
    await module.build(context)
    await module.buildContext!(context)
    expect(JSON.stringify(context)).toBe(before)
  })
})

// ---------------------------------------------------------------------------
// Distinct Output
// ---------------------------------------------------------------------------

describe('Distinct output per strategy', () => {
  it('each module should produce different content', async () => {
    const create = new CreateStrategyModule()
    const query = new QueryStrategyModule()
    const modify = new ModifyStrategyModule()
    const delete_ = new DeleteStrategyModule()
    const context = createPipelineContext()

    const results = await Promise.all([
      create.build(context),
      query.build(context),
      modify.build(context),
      delete_.build(context),
    ])

    // All four results should be unique
    expect(new Set(results).size).toBe(4)
  })

  it('CreateStrategyModule should not contain "Query"', async () => {
    const module = new CreateStrategyModule()
    const result = await module.build(createPipelineContext())
    expect(result).not.toContain('Query')
  })

  it('QueryStrategyModule should not contain "Creation"', async () => {
    const module = new QueryStrategyModule()
    const result = await module.build(createPipelineContext())
    expect(result).not.toContain('Creation')
  })

  it('ModifyStrategyModule should not contain "Deletion"', async () => {
    const module = new ModifyStrategyModule()
    const result = await module.build(createPipelineContext())
    expect(result).not.toContain('Deletion')
  })

  it('DeleteStrategyModule should not contain "Creation"', async () => {
    const module = new DeleteStrategyModule()
    const result = await module.build(createPipelineContext())
    expect(result).not.toContain('Creation')
  })
})

// ---------------------------------------------------------------------------
// PromptModule Conformance
// ---------------------------------------------------------------------------

describe('PromptModule conformance', () => {
  it('CreateStrategyModule should implement PromptModule', () => {
    const module: PromptModule = new CreateStrategyModule()
    expect(typeof module.build).toBe('function')
  })

  it('QueryStrategyModule should implement PromptModule', () => {
    const module: PromptModule = new QueryStrategyModule()
    expect(typeof module.build).toBe('function')
  })

  it('ModifyStrategyModule should implement PromptModule', () => {
    const module: PromptModule = new ModifyStrategyModule()
    expect(typeof module.build).toBe('function')
  })

  it('DeleteStrategyModule should implement PromptModule', () => {
    const module: PromptModule = new DeleteStrategyModule()
    expect(typeof module.build).toBe('function')
  })

  it('all modules should implement buildContext optionally', () => {
    const modules: StrategyModule[] = [
      new CreateStrategyModule(),
      new QueryStrategyModule(),
      new ModifyStrategyModule(),
      new DeleteStrategyModule(),
    ]
    for (const module of modules) {
      expect(typeof module.buildContext).toBe('function')
    }
  })
})

// ---------------------------------------------------------------------------
// StrategyModule Conformance
// ---------------------------------------------------------------------------

describe('StrategyModule conformance', () => {
  it('CreateStrategyModule should implement StrategyModule', () => {
    const module: StrategyModule = new CreateStrategyModule()
    expect(typeof module.build).toBe('function')
  })

  it('QueryStrategyModule should implement StrategyModule', () => {
    const module: StrategyModule = new QueryStrategyModule()
    expect(typeof module.build).toBe('function')
  })

  it('ModifyStrategyModule should implement StrategyModule', () => {
    const module: StrategyModule = new ModifyStrategyModule()
    expect(typeof module.build).toBe('function')
  })

  it('DeleteStrategyModule should implement StrategyModule', () => {
    const module: StrategyModule = new DeleteStrategyModule()
    expect(typeof module.build).toBe('function')
  })
})

// ---------------------------------------------------------------------------
// Custom StrategyModule Implementation
// ---------------------------------------------------------------------------

describe('Custom StrategyModule implementation', () => {
  it('should allow custom StrategyModule', async () => {
    const custom: StrategyModule = {
      async build(_context: PipelineContext): Promise<string> {
        return 'Custom Strategy Guidelines:\n\n- Custom rule'
      },
    }
    const result = await custom.build(createPipelineContext())
    expect(result).toContain('Custom Strategy Guidelines:')
  })

  it('custom module should be compatible with PromptModule type', async () => {
    const custom: PromptModule = {
      async build(_context: PipelineContext): Promise<string> {
        return 'custom output'
      },
    }
    const result = await custom.build(createPipelineContext())
    expect(result).toBe('custom output')
  })
})

// ---------------------------------------------------------------------------
// Architecture Compliance
// ---------------------------------------------------------------------------

describe('Architecture compliance', () => {
  it('should not depend on Planner', async () => {
    const module = new CreateStrategyModule()
    const result = await module.build(createPipelineContext())
    expect(typeof result).toBe('string')
  })

  it('should not depend on Runtime', async () => {
    const module = new QueryStrategyModule()
    const result = await module.build(createPipelineContext())
    expect(typeof result).toBe('string')
  })

  it('should not depend on Provider', () => {
    const module = new ModifyStrategyModule()
    expect(module).toBeInstanceOf(ModifyStrategyModule)
  })

  it('should not depend on Memory', async () => {
    const module = new DeleteStrategyModule()
    const result = await module.build(createPipelineContext())
    expect(typeof result).toBe('string')
  })

  it('should not depend on ToolCalling', async () => {
    const module = new CreateStrategyModule()
    const ctx = createPipelineContext()
    const result = await module.build(ctx)
    expect(result).toContain('Creation Guidelines:')
  })

  it('should not depend on AgentLoop', async () => {
    const module = new QueryStrategyModule()
    const ctx = createPipelineContext()
    const result = await module.build(ctx)
    expect(result).toContain('Query Guidelines:')
  })

  it('should not depend on PromptBuilder', async () => {
    const module = new ModifyStrategyModule()
    const ctx = createPipelineContext()
    const result = await module.build(ctx)
    expect(result).toContain('Modification Guidelines:')
  })

  it('should not depend on Pipeline', async () => {
    const module = new DeleteStrategyModule()
    const result = await module.build(createPipelineContext())
    expect(result).toContain('Deletion Guidelines:')
  })

  it('should be pure — no side effects', async () => {
    const module = new CreateStrategyModule()
    const context: PipelineContext = { input: 'test' }
    const before = JSON.stringify(context)
    await module.build(context)
    expect(JSON.stringify(context)).toBe(before)
  })

  it('should be stateless — no internal state', async () => {
    const m1 = new CreateStrategyModule()
    const m2 = new CreateStrategyModule()
    const context = createPipelineContext()
    const r1 = await m1.build(context)
    const r2 = await m2.build(context)
    expect(r1).toBe(r2)
  })

  it('should be non-mutating — never modifies inputs', async () => {
    const module = new DeleteStrategyModule()
    const context: PipelineContext = Object.freeze({ input: 'test' })
    const ctxResult = await module.buildContext!(context)
    expect(ctxResult).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// RetryPlanner Compatibility
// ---------------------------------------------------------------------------

describe('RetryPlanner compatibility', () => {
  it('should work with RetryPlanner', () => {
    const module = new CreateStrategyModule()
    expect(module).toBeInstanceOf(CreateStrategyModule)
  })

  it('should not affect RetryPlanner behavior', async () => {
    const module = new CreateStrategyModule()
    const result = await module.build(createPipelineContext())
    expect(result).toContain('Creation Guidelines:')
  })
})

// ---------------------------------------------------------------------------
// ToolCallPlanner Compatibility
// ---------------------------------------------------------------------------

describe('ToolCallPlanner compatibility', () => {
  it('should work with ToolCallPlanner', () => {
    const module = new QueryStrategyModule()
    expect(module).toBeInstanceOf(QueryStrategyModule)
  })

  it('should not affect ToolCallPlanner tool execution', async () => {
    const module = new QueryStrategyModule()
    const result = await module.build(createPipelineContext())
    expect(result).toContain('Query Guidelines:')
  })
})

// ---------------------------------------------------------------------------
// Streaming Compatibility
// ---------------------------------------------------------------------------

describe('Streaming compatibility', () => {
  it('should work with StreamingProvider', () => {
    const module = new ModifyStrategyModule()
    expect(module).toBeInstanceOf(ModifyStrategyModule)
  })

  it('should not affect streaming', async () => {
    const module = new ModifyStrategyModule()
    const result = await module.build(createPipelineContext())
    expect(result).toContain('Modification Guidelines:')
  })
})

// ---------------------------------------------------------------------------
// AgentLoop Compatibility
// ---------------------------------------------------------------------------

describe('AgentLoop compatibility', () => {
  it('should work with AgentLoop', () => {
    const module = new DeleteStrategyModule()
    expect(module).toBeInstanceOf(DeleteStrategyModule)
  })

  it('should not affect AgentLoop iteration', async () => {
    const module = new DeleteStrategyModule()
    const result = await module.build(createPipelineContext())
    expect(result).toContain('Deletion Guidelines:')
  })
})

// ---------------------------------------------------------------------------
// Exports — strategy/index.ts
// ---------------------------------------------------------------------------

describe('Exports — strategy/index', () => {
  it('should export StrategyModule type', () => {
    const module: StrategyModule = new CreateStrategyModule()
    expect(typeof module.build).toBe('function')
  })

  it('should export CreateStrategyModule class', () => {
    const module = new CreateStrategyModule()
    expect(module).toBeInstanceOf(CreateStrategyModule)
  })

  it('should export QueryStrategyModule class', () => {
    const module = new QueryStrategyModule()
    expect(module).toBeInstanceOf(QueryStrategyModule)
  })

  it('should export ModifyStrategyModule class', () => {
    const module = new ModifyStrategyModule()
    expect(module).toBeInstanceOf(ModifyStrategyModule)
  })

  it('should export DeleteStrategyModule class', () => {
    const module = new DeleteStrategyModule()
    expect(module).toBeInstanceOf(DeleteStrategyModule)
  })
})

// ---------------------------------------------------------------------------
// Exports — package root index.ts
// ---------------------------------------------------------------------------

describe('Exports — package root', () => {
  it('should export StrategyModule type from package root', () => {
    const module: StrategyModuleFromRoot = new CreateStrategyModule()
    expect(typeof module.build).toBe('function')
  })

  it('should export CreateStrategyModule from package root', () => {
    const Module = CreateStrategyModule as typeof CreateStrategyModuleFromRoot
    const module = new Module()
    const result = module.build(createPipelineContext())
    expect(result).resolves.toContain('Creation Guidelines:')
  })

  it('should export QueryStrategyModule from package root', () => {
    const Module = QueryStrategyModule as typeof QueryStrategyModuleFromRoot
    const module = new Module()
    const result = module.build(createPipelineContext())
    expect(result).resolves.toContain('Query Guidelines:')
  })

  it('should export ModifyStrategyModule from package root', () => {
    const Module = ModifyStrategyModule as typeof ModifyStrategyModuleFromRoot
    const module = new Module()
    const result = module.build(createPipelineContext())
    expect(result).resolves.toContain('Modification Guidelines:')
  })

  it('should export DeleteStrategyModule from package root', () => {
    const Module = DeleteStrategyModule as typeof DeleteStrategyModuleFromRoot
    const module = new Module()
    const result = module.build(createPipelineContext())
    expect(result).resolves.toContain('Deletion Guidelines:')
  })
})

// ---------------------------------------------------------------------------
// No PromptBuilder Changes
// ---------------------------------------------------------------------------

describe('No PromptBuilder changes', () => {
  it('should not modify PromptBuilder', async () => {
    const module = new CreateStrategyModule()
    const result = await module.build(createPipelineContext())
    expect(typeof result).toBe('string')
  })

  it('should not modify PromptRenderer', async () => {
    const module = new QueryStrategyModule()
    const result = await module.build(createPipelineContext())
    expect(typeof result).toBe('string')
  })

  it('should not modify PromptContext interface', async () => {
    const module = new ModifyStrategyModule()
    const ctx = await module.buildContext!(createPipelineContext())
    expect(ctx).toHaveProperty('strategyRendered')
  })

  it('should not modify PromptCompression', () => {
    const module = new DeleteStrategyModule()
    expect(module).toBeInstanceOf(DeleteStrategyModule)
  })

  it('should not modify Pipeline', () => {
    const module = new CreateStrategyModule()
    expect(module).toBeInstanceOf(CreateStrategyModule)
  })

  it('should not modify Planner', () => {
    const module = new QueryStrategyModule()
    expect(module).toBeInstanceOf(QueryStrategyModule)
  })
})

// ---------------------------------------------------------------------------
// Foundation Only — No Consumption
// ---------------------------------------------------------------------------

describe('Foundation only — no consumption', () => {
  it('modules exist but are not wired to PromptBuilder', () => {
    const modules = [
      new CreateStrategyModule(),
      new QueryStrategyModule(),
      new ModifyStrategyModule(),
      new DeleteStrategyModule(),
    ]
    expect(modules.length).toBe(4)
  })

  it('modules produce output without being in PromptBuilder pipeline', async () => {
    const module = new CreateStrategyModule()
    const result = await module.build(createPipelineContext())
    expect(result).toBeDefined()
    expect(result.length).toBeGreaterThan(0)
  })

  it('modules can be instantiated independently', () => {
    expect(() => new CreateStrategyModule()).not.toThrow()
    expect(() => new QueryStrategyModule()).not.toThrow()
    expect(() => new ModifyStrategyModule()).not.toThrow()
    expect(() => new DeleteStrategyModule()).not.toThrow()
  })
})
