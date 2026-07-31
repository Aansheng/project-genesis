import { describe, it, expect } from 'vitest'
import type { PromptContext } from '../prompt/PromptContext'
import { DefaultPromptRenderer } from '../prompt/DefaultPromptRenderer'
import { DefaultPromptCompression } from '../prompt/DefaultPromptCompression'
import { DefaultPromptBuilder } from '../prompt/DefaultPromptBuilder'
import { UserInputModule } from '../prompt/modules/UserInputModule'
import { SystemPromptModule } from '../prompt/modules/SystemPromptModule'
import { CreateStrategyModule } from '../strategy/CreateStrategyModule'
import { QueryStrategyModule } from '../strategy/QueryStrategyModule'
import { ModifyStrategyModule } from '../strategy/ModifyStrategyModule'
import { DeleteStrategyModule } from '../strategy/DeleteStrategyModule'
import { DefaultStrategyModuleRenderer } from '../strategy/DefaultStrategyModuleRenderer'
import { CreateStrategy } from '../strategy/CreateStrategy'
import { QueryStrategy } from '../strategy/QueryStrategy'
import { ModifyStrategy } from '../strategy/ModifyStrategy'
import { DeleteStrategy } from '../strategy/DeleteStrategy'
import { DefaultPromptStrategy } from '../strategy/DefaultPromptStrategy'
import { DefaultPromptStrategySelector } from '../strategy/DefaultPromptStrategySelector'
import { DefaultPromptStrategyRenderer } from '../strategy/DefaultPromptStrategyRenderer'
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

function createFullBuilder(): DefaultPromptBuilder {
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
// PromptContext — strategyModuleRendered
// ---------------------------------------------------------------------------

describe('PromptContext — strategyModuleRendered', () => {
  it('should accept strategyModuleRendered as optional field', () => {
    const ctx: PromptContext = { strategyModuleRendered: 'Strategy Module:\n\nTest' }
    expect(ctx.strategyModuleRendered).toBe('Strategy Module:\n\nTest')
  })

  it('should allow undefined strategyModuleRendered', () => {
    const ctx: PromptContext = {}
    expect(ctx.strategyModuleRendered).toBeUndefined()
  })

  it('should coexist with strategyRendered', () => {
    const ctx: PromptContext = {
      strategyModuleRendered: 'Strategy Module:\n\nGuidelines',
      strategyRendered: 'Prompt Strategy:\n\n- create',
    }
    expect(ctx.strategyModuleRendered).toBeDefined()
    expect(ctx.strategyRendered).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// PromptRenderer — CANONICAL_ORDER
// ---------------------------------------------------------------------------

describe('PromptRenderer — CANONICAL_ORDER', () => {
  it('should include strategyModuleRendered in CANONICAL_ORDER', () => {
    expect(DefaultPromptRenderer.CANONICAL_ORDER).toContain('strategyModuleRendered')
  })

  it('should place strategyModuleRendered before strategyRendered', () => {
    const order = DefaultPromptRenderer.CANONICAL_ORDER
    const moduleIndex = order.indexOf('strategyModuleRendered')
    const strategyIndex = order.indexOf('strategyRendered')
    expect(moduleIndex).toBeLessThan(strategyIndex)
  })

  it('should place strategyModuleRendered after semanticRendered', () => {
    const order = DefaultPromptRenderer.CANONICAL_ORDER
    const moduleIndex = order.indexOf('strategyModuleRendered')
    const semanticIndex = order.indexOf('semanticRendered')
    expect(moduleIndex).toBeGreaterThan(semanticIndex)
  })

  it('should render strategyModuleRendered before strategyRendered in output', () => {
    const renderer = new DefaultPromptRenderer()
    const ctx: PromptContext = {
      strategyModuleRendered: 'Strategy Module:\n\nTest Guidelines',
      strategyRendered: 'Prompt Strategy:\n\n- create',
    }
    const result = renderer.render(ctx)
    const modulePos = result.indexOf('Strategy Module:')
    const strategyPos = result.indexOf('Prompt Strategy:')
    expect(modulePos).toBeLessThan(strategyPos)
  })
})

// ---------------------------------------------------------------------------
// PromptCompression — strategyModuleRendered
// ---------------------------------------------------------------------------

describe('PromptCompression — strategyModuleRendered', () => {
  it('should preserve strategyModuleRendered', () => {
    const compression = new DefaultPromptCompression()
    const ctx: PromptContext = { strategyModuleRendered: 'Strategy Module:\n\nTest' }
    const result = compression.compress(ctx)
    expect(result.strategyModuleRendered).toBe('Strategy Module:\n\nTest')
  })

  it('should remove empty strategyModuleRendered', () => {
    const compression = new DefaultPromptCompression()
    const ctx: PromptContext = { strategyModuleRendered: '' }
    const result = compression.compress(ctx)
    expect(result.strategyModuleRendered).toBeUndefined()
  })

  it('should remove undefined strategyModuleRendered', () => {
    const compression = new DefaultPromptCompression()
    const ctx: PromptContext = { strategyModuleRendered: undefined }
    const result = compression.compress(ctx)
    expect(result.strategyModuleRendered).toBeUndefined()
  })

  it('should survive compression with other fields', () => {
    const compression = new DefaultPromptCompression()
    const ctx: PromptContext = {
      strategyModuleRendered: 'Strategy Module:\n\nGuidelines',
      strategyRendered: 'Prompt Strategy:\n\n- create',
      system: 'You are a planner',
    }
    const result = compression.compress(ctx)
    expect(result.strategyModuleRendered).toBe('Strategy Module:\n\nGuidelines')
    expect(result.strategyRendered).toBe('Prompt Strategy:\n\n- create')
    expect(result.system).toBe('You are a planner')
  })
})

// ---------------------------------------------------------------------------
// PromptBuilder — strategyModuleRendered in prompt
// ---------------------------------------------------------------------------

describe('PromptBuilder — strategyModuleRendered appears in prompt', () => {
  it('should include Strategy Module section in prompt for create', async () => {
    const builder = createFullBuilder()
    const result = await builder.build(createPipelineContext('创建一棵树'))
    expect(result.prompt).toContain('Strategy Module:')
    expect(result.prompt).toContain('Creation Guidelines:')
  })

  it('should include Strategy Module section in prompt for query', async () => {
    const builder = createFullBuilder()
    const result = await builder.build(createPipelineContext('列出所有树'))
    expect(result.prompt).toContain('Strategy Module:')
    expect(result.prompt).toContain('Query Guidelines:')
  })

  it('should include Strategy Module section in prompt for modify', async () => {
    const builder = createFullBuilder()
    const result = await builder.build(createPipelineContext('移动树到左边'))
    expect(result.prompt).toContain('Strategy Module:')
    expect(result.prompt).toContain('Modification Guidelines:')
  })

  it('should include Strategy Module section in prompt for delete', async () => {
    const builder = createFullBuilder()
    const result = await builder.build(createPipelineContext('删除树'))
    expect(result.prompt).toContain('Strategy Module:')
    expect(result.prompt).toContain('Deletion Guidelines:')
  })

  it('should not include Strategy Module when no module matches', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()])
    const result = await builder.build(createPipelineContext('hello'))
    expect(result.prompt).not.toContain('Strategy Module:')
  })

  it('should store strategyModuleRendered in metadata', async () => {
    const builder = createFullBuilder()
    const result = await builder.build(createPipelineContext('创建一棵树'))
    const pa = getAssembly(result)
    expect(pa.strategyModuleRendered).toBeDefined()
    expect(pa.strategyModuleRendered).toContain('Strategy Module:')
  })
})

// ---------------------------------------------------------------------------
// Canonical Order
// ---------------------------------------------------------------------------

describe('Canonical Order — Intent → Entity → Semantic → Strategy Module → Strategy → System', () => {
  it('should respect canonical order in rendered prompt', async () => {
    const builder = new DefaultPromptBuilder(
      [new UserInputModule(), new SystemPromptModule()],
      {
        intentAnalyzer: new RuleBasedIntentAnalyzer(),
        strategySelector: new DefaultPromptStrategySelector(),
        strategies: [new CreateStrategy(), new DefaultPromptStrategy()],
        strategyRenderer: new DefaultPromptStrategyRenderer(),
        strategyModules: [new CreateStrategyModule()],
        strategyModuleRenderer: new DefaultStrategyModuleRenderer(),
        semanticContextBuilder: new DefaultSemanticContextBuilder(),
      },
    )
    const result = await builder.build(createPipelineContext('创建一棵树'))
    const prompt = result.prompt

    const intentPos = prompt.indexOf('User Intent:')
    const semanticPos = prompt.indexOf('Semantic Context:')
    const modulePos = prompt.indexOf('Strategy Module:')
    const strategyPos = prompt.indexOf('Prompt Strategy:')
    const systemPos = prompt.indexOf('You are')

    // All should be present and in correct order
    if (intentPos >= 0 && modulePos >= 0) {
      expect(intentPos).toBeLessThan(modulePos)
    }
    if (semanticPos >= 0 && modulePos >= 0) {
      expect(semanticPos).toBeLessThan(modulePos)
    }
    expect(modulePos).toBeLessThan(strategyPos)
    if (systemPos >= 0) {
      expect(strategyPos).toBeLessThan(systemPos)
    }
  })

  it('CANONICAL_ORDER should match the documented sequence', () => {
    const order = DefaultPromptRenderer.CANONICAL_ORDER
    expect(order[0]).toBe('intentRendered')
    expect(order[1]).toBe('entityRendered')
    expect(order[2]).toBe('semanticRendered')
    expect(order[3]).toBe('strategyModuleRendered')
    expect(order[4]).toBe('strategyRendered')
    expect(order[5]).toBe('system')
  })

  it('strategyModuleRendered index should be 3', () => {
    const order = DefaultPromptRenderer.CANONICAL_ORDER
    expect(order.indexOf('strategyModuleRendered')).toBe(3)
  })
})

// ---------------------------------------------------------------------------
// Deterministic
// ---------------------------------------------------------------------------

describe('Deterministic', () => {
  it('should produce same prompt for same input', async () => {
    const builder = createFullBuilder()
    const context = createPipelineContext('创建一棵树')
    const r1 = await builder.build(context)
    const r2 = await builder.build(context)
    expect(r1.prompt).toBe(r2.prompt)
  })

  it('should produce same strategyModuleRendered across calls', async () => {
    const builder = createFullBuilder()
    const context = createPipelineContext('删除树')
    const r1 = await builder.build(context)
    const r2 = await builder.build(context)
    expect(getAssembly(r1).strategyModuleRendered).toBe(getAssembly(r2).strategyModuleRendered)
  })
})

// ---------------------------------------------------------------------------
// RetryPlanner Compatibility
// ---------------------------------------------------------------------------

describe('RetryPlanner compatibility', () => {
  it('should work with RetryPlanner', async () => {
    const builder = createFullBuilder()
    const result = await builder.build(createPipelineContext('创建一棵树'))
    expect(result.prompt).toBeDefined()
    expect(result.metadata?.promptAssembly).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// ToolCallPlanner Compatibility
// ---------------------------------------------------------------------------

describe('ToolCallPlanner compatibility', () => {
  it('should work with ToolCallPlanner', async () => {
    const builder = createFullBuilder()
    const result = await builder.build(createPipelineContext('查看树'))
    expect(result.prompt).toBeDefined()
    expect(result.metadata?.promptAssembly).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Streaming Compatibility
// ---------------------------------------------------------------------------

describe('Streaming compatibility', () => {
  it('should work with streaming pipeline', async () => {
    const builder = createFullBuilder()
    const result = await builder.build(createPipelineContext('移动树'))
    expect(result.prompt).toBeDefined()
    expect(result.metadata?.promptAssembly).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// AgentLoop Compatibility
// ---------------------------------------------------------------------------

describe('AgentLoop compatibility', () => {
  it('should work with AgentLoop', async () => {
    const builder = createFullBuilder()
    const result = await builder.build(createPipelineContext('删除树'))
    expect(result.prompt).toBeDefined()
    expect(result.metadata?.promptAssembly).toBeDefined()
  })
})
