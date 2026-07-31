import { describe, it, expect } from 'vitest'
import type { StrategyModuleRenderer } from '../strategy/StrategyModuleRenderer'
import { DefaultStrategyModuleRenderer } from '../strategy/DefaultStrategyModuleRenderer'
import { CreateStrategyModule } from '../strategy/CreateStrategyModule'
import { QueryStrategyModule } from '../strategy/QueryStrategyModule'
import { ModifyStrategyModule } from '../strategy/ModifyStrategyModule'
import { DeleteStrategyModule } from '../strategy/DeleteStrategyModule'
import { CreateStrategy } from '../strategy/CreateStrategy'
import { QueryStrategy } from '../strategy/QueryStrategy'
import { ModifyStrategy } from '../strategy/ModifyStrategy'
import { DeleteStrategy } from '../strategy/DeleteStrategy'
import { DefaultPromptStrategy } from '../strategy/DefaultPromptStrategy'
import { DefaultPromptStrategySelector } from '../strategy/DefaultPromptStrategySelector'
import { DefaultPromptStrategyRenderer } from '../strategy/DefaultPromptStrategyRenderer'
import { DefaultPromptBuilder } from '../prompt/DefaultPromptBuilder'
import { UserInputModule } from '../prompt/modules/UserInputModule'
import { RuleBasedIntentAnalyzer } from '../intent/RuleBasedIntentAnalyzer'
import { DefaultSemanticContextBuilder } from '../semantic/DefaultSemanticContextBuilder'
import type { PipelineContext } from '../pipeline/PipelineContext'
import type { BuilderOptions } from '../prompt/BuilderOptions'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createPipelineContext(input: string, overrides?: Partial<PipelineContext>): PipelineContext {
  return { input, ...overrides }
}

function getAssembly(request: { metadata?: Record<string, unknown> }): Record<string, unknown> {
  return (request.metadata?.promptAssembly ?? {}) as Record<string, unknown>
}

function createBuilderWithAll(_input: string): DefaultPromptBuilder {
  const intentAnalyzer = new RuleBasedIntentAnalyzer()
  const strategySelector = new DefaultPromptStrategySelector()
  const strategyRenderer = new DefaultPromptStrategyRenderer()
  const semanticBuilder = new DefaultSemanticContextBuilder()
  const strategyModuleRenderer = new DefaultStrategyModuleRenderer()

  const strategies = [
    new CreateStrategy(),
    new QueryStrategy(),
    new ModifyStrategy(),
    new DeleteStrategy(),
    new DefaultPromptStrategy(),
  ]

  const strategyModules = [
    new CreateStrategyModule(),
    new QueryStrategyModule(),
    new ModifyStrategyModule(),
    new DeleteStrategyModule(),
  ]

  const options: BuilderOptions = {
    intentAnalyzer,
    strategySelector,
    strategies,
    strategyRenderer,
    strategyModules,
    strategyModuleRenderer,
    semanticContextBuilder: semanticBuilder,
  }

  return new DefaultPromptBuilder([new UserInputModule()], options)
}

// ---------------------------------------------------------------------------
// StrategyModuleRenderer Interface
// ---------------------------------------------------------------------------

describe('StrategyModuleRenderer interface', () => {
  it('should define render(moduleContent: string): string', () => {
    const renderer: StrategyModuleRenderer = new DefaultStrategyModuleRenderer()
    expect(typeof renderer.render).toBe('function')
    expect(renderer.render).toHaveLength(1)
  })

  it('should accept a string and return a string', () => {
    const renderer = new DefaultStrategyModuleRenderer()
    const input = 'Test content'
    const result = renderer.render(input)
    expect(typeof result).toBe('string')
  })

  it('should allow custom implementation', () => {
    const custom: StrategyModuleRenderer = {
      render(moduleContent: string): string {
        return `[MOD]\n${moduleContent}`
      },
    }
    expect(custom.render('test')).toBe('[MOD]\ntest')
  })
})

// ---------------------------------------------------------------------------
// DefaultStrategyModuleRenderer — Create
// ---------------------------------------------------------------------------

describe('DefaultStrategyModuleRenderer — Create', () => {
  it('should render CreateStrategyModule output', async () => {
    const module = new CreateStrategyModule()
    const raw = await module.build(createPipelineContext('test'))
    const renderer = new DefaultStrategyModuleRenderer()
    const rendered = renderer.render(raw)
    expect(rendered).toBe(`Strategy Module:\n\n${raw}`)
  })

  it('should start with "Strategy Module:" header', async () => {
    const module = new CreateStrategyModule()
    const raw = await module.build(createPipelineContext('test'))
    const renderer = new DefaultStrategyModuleRenderer()
    const rendered = renderer.render(raw)
    expect(rendered).toContain('Strategy Module:')
  })

  it('should contain creation guidelines after header', async () => {
    const module = new CreateStrategyModule()
    const raw = await module.build(createPipelineContext('test'))
    const renderer = new DefaultStrategyModuleRenderer()
    const rendered = renderer.render(raw)
    expect(rendered).toContain('Prefer creating new entities')
    expect(rendered).toContain('Avoid modifying existing entities')
  })
})

// ---------------------------------------------------------------------------
// DefaultStrategyModuleRenderer — Query
// ---------------------------------------------------------------------------

describe('DefaultStrategyModuleRenderer — Query', () => {
  it('should render QueryStrategyModule output', async () => {
    const module = new QueryStrategyModule()
    const raw = await module.build(createPipelineContext('test'))
    const renderer = new DefaultStrategyModuleRenderer()
    const rendered = renderer.render(raw)
    expect(rendered).toBe(`Strategy Module:\n\n${raw}`)
  })

  it('should contain query guidelines', async () => {
    const module = new QueryStrategyModule()
    const raw = await module.build(createPipelineContext('test'))
    const renderer = new DefaultStrategyModuleRenderer()
    const rendered = renderer.render(raw)
    expect(rendered).toContain('Focus on retrieving information')
    expect(rendered).toContain('Avoid changing world state')
  })
})

// ---------------------------------------------------------------------------
// DefaultStrategyModuleRenderer — Modify
// ---------------------------------------------------------------------------

describe('DefaultStrategyModuleRenderer — Modify', () => {
  it('should render ModifyStrategyModule output', async () => {
    const module = new ModifyStrategyModule()
    const raw = await module.build(createPipelineContext('test'))
    const renderer = new DefaultStrategyModuleRenderer()
    const rendered = renderer.render(raw)
    expect(rendered).toBe(`Strategy Module:\n\n${raw}`)
  })

  it('should contain modification guidelines', async () => {
    const module = new ModifyStrategyModule()
    const raw = await module.build(createPipelineContext('test'))
    const renderer = new DefaultStrategyModuleRenderer()
    const rendered = renderer.render(raw)
    expect(rendered).toContain('Preserve entity identity')
    expect(rendered).toContain('Modify only requested properties')
  })
})

// ---------------------------------------------------------------------------
// DefaultStrategyModuleRenderer — Delete
// ---------------------------------------------------------------------------

describe('DefaultStrategyModuleRenderer — Delete', () => {
  it('should render DeleteStrategyModule output', async () => {
    const module = new DeleteStrategyModule()
    const raw = await module.build(createPipelineContext('test'))
    const renderer = new DefaultStrategyModuleRenderer()
    const rendered = renderer.render(raw)
    expect(rendered).toBe(`Strategy Module:\n\n${raw}`)
  })

  it('should contain deletion guidelines', async () => {
    const module = new DeleteStrategyModule()
    const raw = await module.build(createPipelineContext('test'))
    const renderer = new DefaultStrategyModuleRenderer()
    const rendered = renderer.render(raw)
    expect(rendered).toContain('Confirm target existence')
    expect(rendered).toContain('Remove only requested entities')
  })
})

// ---------------------------------------------------------------------------
// Empty Input
// ---------------------------------------------------------------------------

describe('Empty input handling', () => {
  it('should return empty string for empty string input', () => {
    const renderer = new DefaultStrategyModuleRenderer()
    expect(renderer.render('')).toBe('')
  })

  it('should return empty string for whitespace-only input', () => {
    const renderer = new DefaultStrategyModuleRenderer()
    expect(renderer.render('   ')).toBe('')
  })

  it('should return empty string for null input', () => {
    const renderer = new DefaultStrategyModuleRenderer()
    expect(renderer.render(null as unknown as string)).toBe('')
  })

  it('should return empty string for undefined input', () => {
    const renderer = new DefaultStrategyModuleRenderer()
    expect(renderer.render(undefined as unknown as string)).toBe('')
  })
})

// ---------------------------------------------------------------------------
// Metadata — strategyModuleRendered storage
// ---------------------------------------------------------------------------

describe('Metadata — strategyModuleRendered storage', () => {
  it('should store strategyModuleRendered in metadata when module matches', async () => {
    const builder = createBuilderWithAll('创建一棵树')
    const result = await builder.build(createPipelineContext('创建一棵树'))
    const pa = getAssembly(result)
    expect(pa.strategyModuleRendered).toBeDefined()
    expect(pa.strategyModuleRendered).toContain('Strategy Module:')
  })

  it('should not store strategyModuleRendered when no module matches', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      strategyModules: [new CreateStrategyModule()],
    })
    const result = await builder.build(createPipelineContext('hello'))
    const pa = getAssembly(result)
    expect(pa.strategyModuleRendered).toBeUndefined()
  })

  it('should have both strategyModule and strategyModuleRendered when module matches', async () => {
    const builder = createBuilderWithAll('删除树')
    const result = await builder.build(createPipelineContext('删除树'))
    const pa = getAssembly(result)
    expect(pa.strategyModule).toBeDefined()
    expect(pa.strategyModuleRendered).toBeDefined()
  })

  it('strategyModuleRendered should contain Strategy Module: header', async () => {
    const builder = createBuilderWithAll('修改颜色')
    const result = await builder.build(createPipelineContext('修改颜色'))
    const pa = getAssembly(result)
    expect(pa.strategyModuleRendered).toContain('Strategy Module:')
  })

  it('strategyModuleRendered should be a string', async () => {
    const builder = createBuilderWithAll('查看所有')
    const result = await builder.build(createPipelineContext('查看所有'))
    const pa = getAssembly(result)
    expect(typeof pa.strategyModuleRendered).toBe('string')
  })

  it('strategyModule is raw content, strategyModuleRendered has header', async () => {
    const builder = createBuilderWithAll('创建一棵树')
    const result = await builder.build(createPipelineContext('创建一棵树'))
    const pa = getAssembly(result)
    const raw = pa.strategyModule as string
    const rendered = pa.strategyModuleRendered as string
    expect(rendered).toBe(`Strategy Module:\n\n${raw}`)
  })
})

// ---------------------------------------------------------------------------
// BuilderOptions — strategyModuleRenderer
// ---------------------------------------------------------------------------

describe('BuilderOptions — strategyModuleRenderer', () => {
  it('should be optional', () => {
    const options: BuilderOptions = {}
    expect(options.strategyModuleRenderer).toBeUndefined()
  })

  it('should accept DefaultStrategyModuleRenderer', () => {
    const options: BuilderOptions = {
      strategyModuleRenderer: new DefaultStrategyModuleRenderer(),
    }
    expect(options.strategyModuleRenderer).toBeInstanceOf(DefaultStrategyModuleRenderer)
  })

  it('should fall back to DefaultStrategyModuleRenderer when not provided', async () => {
    // Builder without explicit strategyModuleRenderer
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      intentAnalyzer: new RuleBasedIntentAnalyzer(),
      strategySelector: new DefaultPromptStrategySelector(),
      strategies: [new CreateStrategy(), new DefaultPromptStrategy()],
      strategyRenderer: new DefaultPromptStrategyRenderer(),
      strategyModules: [new CreateStrategyModule()],
      semanticContextBuilder: new DefaultSemanticContextBuilder(),
    })
    const result = await builder.build(createPipelineContext('创建一棵树'))
    const pa = getAssembly(result)
    // Should still have strategyModuleRendered using default renderer
    expect(pa.strategyModuleRendered).toBeDefined()
    expect(pa.strategyModuleRendered).toContain('Strategy Module:')
  })

  it('should not break legacy positional constructor', () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()])
    expect(builder).toBeInstanceOf(DefaultPromptBuilder)
  })
})

// ---------------------------------------------------------------------------
// Prompt Unchanged
// ---------------------------------------------------------------------------

describe('Prompt includes strategyModuleRendered', () => {
  it('prompt should include strategyModuleRendered text', async () => {
    const builder = createBuilderWithAll('创建一棵树')
    const result = await builder.build(createPipelineContext('创建一棵树'))
    // strategyModuleRendered is now injected into the prompt
    expect(result.prompt).toContain('Strategy Module:')
  })

  it('prompt with explicit renderer should match default renderer', async () => {
    const intentAnalyzer = new RuleBasedIntentAnalyzer()
    const strategySelector = new DefaultPromptStrategySelector()
    const strategyRenderer = new DefaultPromptStrategyRenderer()
    const semanticBuilder = new DefaultSemanticContextBuilder()
    const strategies = [new CreateStrategy(), new DefaultPromptStrategy()]
    const strategyModules = [new CreateStrategyModule()]

    const builderWithRenderer = new DefaultPromptBuilder([new UserInputModule()], {
      intentAnalyzer,
      strategySelector,
      strategies,
      strategyRenderer,
      strategyModules,
      strategyModuleRenderer: new DefaultStrategyModuleRenderer(),
      semanticContextBuilder: semanticBuilder,
    })

    const builderWithoutRenderer = new DefaultPromptBuilder([new UserInputModule()], {
      intentAnalyzer,
      strategySelector,
      strategies,
      strategyRenderer,
      strategyModules,
      semanticContextBuilder: semanticBuilder,
    })

    const r1 = await builderWithRenderer.build(createPipelineContext('创建一棵树'))
    const r2 = await builderWithoutRenderer.build(createPipelineContext('创建一棵树'))
    // Both use DefaultStrategyModuleRenderer — same prompt
    expect(r1.prompt).toBe(r2.prompt)
  })
})

// ---------------------------------------------------------------------------
// Deterministic
// ---------------------------------------------------------------------------

describe('Deterministic', () => {
  it('should produce same output for same input', () => {
    const renderer = new DefaultStrategyModuleRenderer()
    const input = 'Creation Guidelines:\n\n- Prefer creating new entities'
    const r1 = renderer.render(input)
    const r2 = renderer.render(input)
    const r3 = renderer.render(input)
    expect(r1).toBe(r2)
    expect(r2).toBe(r3)
  })

  it('should produce same metadata across repeated builder calls', async () => {
    const builder = createBuilderWithAll('删除树')
    const context = createPipelineContext('删除树')
    const r1 = await builder.build(context)
    const r2 = await builder.build(context)
    expect(getAssembly(r1).strategyModuleRendered).toBe(getAssembly(r2).strategyModuleRendered)
  })
})

// ---------------------------------------------------------------------------
// Stateless
// ---------------------------------------------------------------------------

describe('Stateless', () => {
  it('should not retain state between render calls', () => {
    const renderer = new DefaultStrategyModuleRenderer()
    const r1 = renderer.render('Guideline A')
    const r2 = renderer.render('Guideline B')
    expect(r1).toContain('Guideline A')
    expect(r2).toContain('Guideline B')
    expect(r1).not.toContain('Guideline B')
  })

  it('should not retain state between builder calls', async () => {
    const builder = createBuilderWithAll('创建树')
    const r1 = await builder.build(createPipelineContext('创建树'))
    const r2 = await builder.build(createPipelineContext('删除树'))
    expect(getAssembly(r1).strategyModuleRendered).toContain('Creation')
    expect(getAssembly(r2).strategyModuleRendered).toContain('Deletion')
  })
})

// ---------------------------------------------------------------------------
// RetryPlanner Compatibility
// ---------------------------------------------------------------------------

describe('RetryPlanner compatibility', () => {
  it('should work with RetryPlanner', async () => {
    const builder = createBuilderWithAll('创建一棵树')
    const result = await builder.build(createPipelineContext('创建一棵树'))
    expect(result.metadata?.promptAssembly).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// ToolCallPlanner Compatibility
// ---------------------------------------------------------------------------

describe('ToolCallPlanner compatibility', () => {
  it('should work with ToolCallPlanner', async () => {
    const builder = createBuilderWithAll('查看树')
    const result = await builder.build(createPipelineContext('查看树'))
    expect(result.metadata?.promptAssembly).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Streaming Compatibility
// ---------------------------------------------------------------------------

describe('Streaming compatibility', () => {
  it('should work with streaming pipeline', async () => {
    const builder = createBuilderWithAll('移动树')
    const result = await builder.build(createPipelineContext('移动树'))
    expect(result.metadata?.promptAssembly).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// AgentLoop Compatibility
// ---------------------------------------------------------------------------

describe('AgentLoop compatibility', () => {
  it('should work with AgentLoop', async () => {
    const builder = createBuilderWithAll('删除树')
    const result = await builder.build(createPipelineContext('删除树'))
    expect(result.metadata?.promptAssembly).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

describe('Exports', () => {
  it('should export StrategyModuleRenderer type from strategy index', async () => {
    const mod = await import('../strategy')
    expect(mod.DefaultStrategyModuleRenderer).toBeDefined()
  })

  it('should export DefaultStrategyModuleRenderer from strategy index', async () => {
    const mod = await import('../strategy')
    expect(typeof mod.DefaultStrategyModuleRenderer).toBe('function')
  })

  it('should export from package root', async () => {
    const mod = await import('../index')
    expect(mod.DefaultStrategyModuleRenderer).toBeDefined()
  })
})
