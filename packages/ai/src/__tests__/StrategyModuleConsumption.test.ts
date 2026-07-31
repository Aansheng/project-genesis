import { describe, it, expect } from 'vitest'
import type { StrategyModule } from '../strategy/StrategyModule'
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

function createBuilderWithStrategyModules(_input: string): DefaultPromptBuilder {
  const intentAnalyzer = new RuleBasedIntentAnalyzer()
  const strategySelector = new DefaultPromptStrategySelector()
  const strategyRenderer = new DefaultPromptStrategyRenderer()
  const semanticBuilder = new DefaultSemanticContextBuilder()

  const strategies = [
    new CreateStrategy(),
    new QueryStrategy(),
    new ModifyStrategy(),
    new DeleteStrategy(),
    new DefaultPromptStrategy(),
  ]

  const strategyModules: readonly StrategyModule[] = [
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
    semanticContextBuilder: semanticBuilder,
  }

  return new DefaultPromptBuilder([new UserInputModule()], options)
}

// ---------------------------------------------------------------------------
// BuilderOptions — strategyModules
// ---------------------------------------------------------------------------

describe('BuilderOptions — strategyModules', () => {
  it('should be optional', () => {
    const options: BuilderOptions = {}
    expect(options.strategyModules).toBeUndefined()
  })

  it('should accept empty array', () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], { strategyModules: [] })
    expect(builder).toBeInstanceOf(DefaultPromptBuilder)
  })

  it('should accept single module', () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      strategyModules: [new CreateStrategyModule()],
    })
    expect(builder).toBeInstanceOf(DefaultPromptBuilder)
  })

  it('should accept multiple modules', () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      strategyModules: [
        new CreateStrategyModule(),
        new QueryStrategyModule(),
        new ModifyStrategyModule(),
        new DeleteStrategyModule(),
      ],
    })
    expect(builder).toBeInstanceOf(DefaultPromptBuilder)
  })

  it('should not break legacy positional constructor', () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()])
    expect(builder).toBeInstanceOf(DefaultPromptBuilder)
  })
})

// ---------------------------------------------------------------------------
// Create: CreateStrategy → CreateStrategyModule
// ---------------------------------------------------------------------------

describe('Create: CreateStrategy → CreateStrategyModule', () => {
  it('should resolve CreateStrategyModule for "create" strategy', async () => {
    const builder = createBuilderWithStrategyModules('创建一棵树')
    const result = await builder.build(createPipelineContext('创建一棵树'))
    const pa = getAssembly(result)
    expect((pa.strategy as { name: string }).name).toBe('create')
    expect(pa.strategyModule).toContain('Creation Guidelines:')
  })

  it('should contain creation-specific guidelines', async () => {
    const builder = createBuilderWithStrategyModules('创建一棵树')
    const result = await builder.build(createPipelineContext('创建一棵树'))
    const mod = getAssembly(result).strategyModule as string
    expect(mod).toContain('Prefer creating new entities')
    expect(mod).toContain('Avoid modifying existing entities')
  })

  it('should match module.name to strategy.name', () => {
    const module = new CreateStrategyModule()
    const strategy = new CreateStrategy()
    expect(module.name).toBe(strategy.name)
  })
})

// ---------------------------------------------------------------------------
// Query: QueryStrategy → QueryStrategyModule
// ---------------------------------------------------------------------------

describe('Query: QueryStrategy → QueryStrategyModule', () => {
  it('should resolve QueryStrategyModule for "query" strategy', async () => {
    const builder = createBuilderWithStrategyModules('列出所有树')
    const result = await builder.build(createPipelineContext('列出所有树'))
    const pa = getAssembly(result)
    expect((pa.strategy as { name: string }).name).toBe('query')
    expect(pa.strategyModule).toContain('Query Guidelines:')
  })

  it('should contain query-specific guidelines', async () => {
    const builder = createBuilderWithStrategyModules('列出所有树')
    const result = await builder.build(createPipelineContext('列出所有树'))
    const mod = getAssembly(result).strategyModule as string
    expect(mod).toContain('Focus on retrieving information')
    expect(mod).toContain('Avoid changing world state')
  })

  it('should match module.name to strategy.name', () => {
    const module = new QueryStrategyModule()
    const strategy = new QueryStrategy()
    expect(module.name).toBe(strategy.name)
  })
})

// ---------------------------------------------------------------------------
// Modify: ModifyStrategy → ModifyStrategyModule
// ---------------------------------------------------------------------------

describe('Modify: ModifyStrategy → ModifyStrategyModule', () => {
  it('should resolve ModifyStrategyModule for "modify" strategy with Move intent', async () => {
    const builder = createBuilderWithStrategyModules('移动树到左边')
    const result = await builder.build(createPipelineContext('移动树到左边'))
    const pa = getAssembly(result)
    expect((pa.strategy as { name: string }).name).toBe('modify')
    expect(pa.strategyModule).toContain('Modification Guidelines:')
  })

  it('should resolve ModifyStrategyModule for "modify" strategy with Modify intent', async () => {
    const builder = createBuilderWithStrategyModules('修改房子颜色')
    const result = await builder.build(createPipelineContext('修改房子颜色'))
    const pa = getAssembly(result)
    expect((pa.strategy as { name: string }).name).toBe('modify')
    expect(pa.strategyModule).toContain('Modification Guidelines:')
  })

  it('should contain modification-specific guidelines', async () => {
    const builder = createBuilderWithStrategyModules('移动树到左边')
    const result = await builder.build(createPipelineContext('移动树到左边'))
    const mod = getAssembly(result).strategyModule as string
    expect(mod).toContain('Preserve entity identity')
    expect(mod).toContain('Modify only requested properties')
  })

  it('should match module.name to strategy.name', () => {
    const module = new ModifyStrategyModule()
    const strategy = new ModifyStrategy()
    expect(module.name).toBe(strategy.name)
  })
})

// ---------------------------------------------------------------------------
// Delete: DeleteStrategy → DeleteStrategyModule
// ---------------------------------------------------------------------------

describe('Delete: DeleteStrategy → DeleteStrategyModule', () => {
  it('should resolve DeleteStrategyModule for "delete" strategy', async () => {
    const builder = createBuilderWithStrategyModules('删除树')
    const result = await builder.build(createPipelineContext('删除树'))
    const pa = getAssembly(result)
    expect((pa.strategy as { name: string }).name).toBe('delete')
    expect(pa.strategyModule).toContain('Deletion Guidelines:')
  })

  it('should contain deletion-specific guidelines', async () => {
    const builder = createBuilderWithStrategyModules('删除树')
    const result = await builder.build(createPipelineContext('删除树'))
    const mod = getAssembly(result).strategyModule as string
    expect(mod).toContain('Confirm target existence')
    expect(mod).toContain('Remove only requested entities')
  })

  it('should match module.name to strategy.name', () => {
    const module = new DeleteStrategyModule()
    const strategy = new DeleteStrategy()
    expect(module.name).toBe(strategy.name)
  })
})

// ---------------------------------------------------------------------------
// No Match — strategyModule not in metadata
// ---------------------------------------------------------------------------

describe('No match — strategyModule not in metadata', () => {
  it('should not write strategyModule when no module matches default strategy', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      strategyModules: [
        new CreateStrategyModule(),
        new QueryStrategyModule(),
        new ModifyStrategyModule(),
        new DeleteStrategyModule(),
      ],
    })
    const result = await builder.build(createPipelineContext('hello world'))
    const pa = getAssembly(result)
    expect((pa.strategy as { name: string }).name).toBe('default')
    expect(pa.strategyModule).toBeUndefined()
  })

  it('should not write strategyModule when strategyModules is empty', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      strategyModules: [],
    })
    const result = await builder.build(createPipelineContext('创建一棵树'))
    expect(getAssembly(result).strategyModule).toBeUndefined()
  })

  it('should not write strategyModule when strategyModules is undefined', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()])
    const result = await builder.build(createPipelineContext('创建一棵树'))
    expect(getAssembly(result).strategyModule).toBeUndefined()
  })

  it('should not error when module does not match', async () => {
    const builder = createBuilderWithStrategyModules('你好世界')
    const result = await builder.build(createPipelineContext('你好世界'))
    expect(result).toBeDefined()
    expect(result.prompt).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Metadata — strategy, strategyRendered, strategyModule coexist
// ---------------------------------------------------------------------------

describe('Metadata — strategy, strategyRendered, strategyModule coexist', () => {
  it('should have all three metadata fields when module matches', async () => {
    const builder = createBuilderWithStrategyModules('创建一棵树')
    const result = await builder.build(createPipelineContext('创建一棵树'))
    const pa = getAssembly(result)
    expect(pa.strategy).toBeDefined()
    expect(pa.strategyRendered).toBeDefined()
    expect(pa.strategyModule).toBeDefined()
  })

  it('should have strategy and strategyRendered but not strategyModule when no match', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      strategyModules: [new CreateStrategyModule()],
    })
    const result = await builder.build(createPipelineContext('hello'))
    const pa = getAssembly(result)
    expect(pa.strategy).toBeDefined()
    expect(pa.strategyRendered).toBeDefined()
    expect(pa.strategyModule).toBeUndefined()
  })

  it('strategy.name should match strategyModule content type', async () => {
    const builder = createBuilderWithStrategyModules('查看所有树')
    const result = await builder.build(createPipelineContext('查看所有树'))
    const pa = getAssembly(result)
    expect((pa.strategy as { name: string }).name).toBe('query')
    expect(pa.strategyModule).toContain('Query Guidelines:')
  })

  it('strategyRendered should contain strategy name', async () => {
    const builder = createBuilderWithStrategyModules('删除树')
    const result = await builder.build(createPipelineContext('删除树'))
    const pa = getAssembly(result)
    expect(pa.strategyRendered).toContain('delete')
  })

  it('strategyModule should be a string', async () => {
    const builder = createBuilderWithStrategyModules('修改颜色')
    const result = await builder.build(createPipelineContext('修改颜色'))
    const pa = getAssembly(result)
    expect(typeof pa.strategyModule).toBe('string')
  })
})

// ---------------------------------------------------------------------------
// Prompt Unchanged
// ---------------------------------------------------------------------------

describe('Prompt unchanged by strategyModule', () => {
  it('prompt output should not include strategyModule text', async () => {
    const builder = createBuilderWithStrategyModules('创建一棵树')
    const result = await builder.build(createPipelineContext('创建一棵树'))
    // strategyModule goes to metadata only, not into prompt string
    expect(result.prompt).not.toContain('Creation Guidelines:')
  })

  it('prompt with strategyModules should match prompt without strategyModules', async () => {
    const builderWithModules = createBuilderWithStrategyModules('创建一棵树')
    const intentAnalyzer = new RuleBasedIntentAnalyzer()
    const strategySelector = new DefaultPromptStrategySelector()
    const strategyRenderer = new DefaultPromptStrategyRenderer()
    const semanticBuilder = new DefaultSemanticContextBuilder()
    const strategies = [
      new CreateStrategy(),
      new QueryStrategy(),
      new ModifyStrategy(),
      new DeleteStrategy(),
      new DefaultPromptStrategy(),
    ]
    const builderWithoutModules = new DefaultPromptBuilder([new UserInputModule()], {
      intentAnalyzer,
      strategySelector,
      strategies,
      strategyRenderer,
      semanticContextBuilder: semanticBuilder,
    })

    const r1 = await builderWithModules.build(createPipelineContext('创建一棵树'))
    const r2 = await builderWithoutModules.build(createPipelineContext('创建一棵树'))
    expect(r1.prompt).toBe(r2.prompt)
  })
})

// ---------------------------------------------------------------------------
// Deterministic
// ---------------------------------------------------------------------------

describe('Deterministic', () => {
  it('should produce same metadata across repeated calls', async () => {
    const builder = createBuilderWithStrategyModules('创建一棵树')
    const context = createPipelineContext('创建一棵树')
    const r1 = await builder.build(context)
    const r2 = await builder.build(context)
    const r3 = await builder.build(context)
    expect(getAssembly(r1).strategyModule).toBe(getAssembly(r2).strategyModule)
    expect(getAssembly(r2).strategyModule).toBe(getAssembly(r3).strategyModule)
  })

  it('should be deterministic across builder instances', async () => {
    const b1 = createBuilderWithStrategyModules('查看树')
    const b2 = createBuilderWithStrategyModules('查看树')
    const context = createPipelineContext('查看树')
    const r1 = await b1.build(context)
    const r2 = await b2.build(context)
    expect(getAssembly(r1).strategyModule).toBe(getAssembly(r2).strategyModule)
  })
})

// ---------------------------------------------------------------------------
// Stateless
// ---------------------------------------------------------------------------

describe('Stateless', () => {
  it('should not retain state between calls', async () => {
    const builder = createBuilderWithStrategyModules('创建一棵树')
    const r1 = await builder.build(createPipelineContext('创建一棵树'))
    const r2 = await builder.build(createPipelineContext('删除树'))
    expect(getAssembly(r1).strategyModule).toContain('Creation')
    expect(getAssembly(r2).strategyModule).toContain('Deletion')
  })
})

// ---------------------------------------------------------------------------
// RetryPlanner Compatibility
// ---------------------------------------------------------------------------

describe('RetryPlanner compatibility', () => {
  it('should work with RetryPlanner', async () => {
    const builder = createBuilderWithStrategyModules('创建一棵树')
    const result = await builder.build(createPipelineContext('创建一棵树'))
    expect(getAssembly(result).strategyModule).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// ToolCallPlanner Compatibility
// ---------------------------------------------------------------------------

describe('ToolCallPlanner compatibility', () => {
  it('should work with ToolCallPlanner', async () => {
    const builder = createBuilderWithStrategyModules('查看树')
    const result = await builder.build(createPipelineContext('查看树'))
    expect(getAssembly(result).strategyModule).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Streaming Compatibility
// ---------------------------------------------------------------------------

describe('Streaming compatibility', () => {
  it('should work with streaming pipeline', async () => {
    const builder = createBuilderWithStrategyModules('移动树')
    const result = await builder.build(createPipelineContext('移动树'))
    expect(getAssembly(result).strategyModule).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// AgentLoop Compatibility
// ---------------------------------------------------------------------------

describe('AgentLoop compatibility', () => {
  it('should work with AgentLoop', async () => {
    const builder = createBuilderWithStrategyModules('删除树')
    const result = await builder.build(createPipelineContext('删除树'))
    expect(getAssembly(result).strategyModule).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Module Name Property
// ---------------------------------------------------------------------------

describe('Module name property', () => {
  it('CreateStrategyModule.name should be "create"', () => {
    expect(new CreateStrategyModule().name).toBe('create')
  })

  it('QueryStrategyModule.name should be "query"', () => {
    expect(new QueryStrategyModule().name).toBe('query')
  })

  it('ModifyStrategyModule.name should be "modify"', () => {
    expect(new ModifyStrategyModule().name).toBe('modify')
  })

  it('DeleteStrategyModule.name should be "delete"', () => {
    expect(new DeleteStrategyModule().name).toBe('delete')
  })

  it('names should match corresponding PromptStrategy names', () => {
    expect(new CreateStrategyModule().name).toBe(new CreateStrategy().name)
    expect(new QueryStrategyModule().name).toBe(new QueryStrategy().name)
    expect(new ModifyStrategyModule().name).toBe(new ModifyStrategy().name)
    expect(new DeleteStrategyModule().name).toBe(new DeleteStrategy().name)
  })
})
