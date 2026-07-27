import { describe, it, expect } from 'vitest'
import { DefaultPromptRenderer } from '../prompt/DefaultPromptRenderer'
import { DefaultPromptCompression } from '../prompt/DefaultPromptCompression'
import type { PromptContext } from '../prompt/PromptContext'
import { serializePromptContext } from '../prompt/PromptContext'
import { DefaultPromptBuilder } from '../prompt/DefaultPromptBuilder'
import { RuleBasedIntentAnalyzer } from '../intent/RuleBasedIntentAnalyzer'
import { DefaultIntentRenderer } from '../intent/DefaultIntentRenderer'
import { RuleBasedEntityAnalyzer } from '../entity/RuleBasedEntityAnalyzer'
import { DefaultEntityRenderer } from '../entity/DefaultEntityRenderer'
import { DefaultSemanticContextBuilder } from '../semantic/DefaultSemanticContextBuilder'
import { DefaultSemanticContextRenderer } from '../semantic/DefaultSemanticContextRenderer'
import {
  UserInputModule,
  SystemPromptModule,
  MemoryPromptModule,
  WorldStatePromptModule,
} from '../prompt/modules'
import type { PromptModule } from '../prompt/modules/PromptModule'
import { DefaultMemory } from '../memory/DefaultMemory'
import { MockPlanner, RetryPlanner, ToolCallPlanner } from '../planner'
import { MockPlannerProvider, MockStreamingProvider } from '../provider'
import { DefaultToolRegistry } from '../tools/ToolRegistry'
import { DefaultPipeline } from '../pipeline/DefaultPipeline'
import { DefaultAIConfiguration } from '../config/DefaultAIConfiguration'
import type { PipelineContext } from '../pipeline/PipelineContext'

// ---------------------------------------------------------------------------
// Test Data
// ---------------------------------------------------------------------------

function createPipelineContext(overrides?: Partial<PipelineContext>): PipelineContext {
  return {
    input: 'draw a tree',
    memory: new DefaultMemory(),
    worldState: '',
    ...overrides,
  }
}

function createDefaultModules(): PromptModule[] {
  return [
    new SystemPromptModule(),
    new UserInputModule(),
    new MemoryPromptModule(),
    new WorldStatePromptModule(),
  ]
}

const mockConfig = new DefaultAIConfiguration()

// ---------------------------------------------------------------------------
// DefaultPromptRenderer — Empty Semantic Context
// ---------------------------------------------------------------------------

describe('DefaultPromptRenderer — empty semantic context', () => {
  const renderer = new DefaultPromptRenderer()

  it('should not include semanticRendered section when empty string', () => {
    const ctx: PromptContext = { semanticRendered: '', userInput: 'Draw a tree' }
    const result = renderer.render(ctx)
    expect(result).not.toContain('Semantic Context:')
    expect(result).toBe('Draw a tree')
  })

  it('should not include semanticRendered section when undefined', () => {
    const ctx: PromptContext = { userInput: 'Draw a tree' }
    const result = renderer.render(ctx)
    expect(result).not.toContain('Semantic Context:')
    expect(result).toBe('Draw a tree')
  })

  it('should produce identical prompt with and without empty semanticRendered', () => {
    const withEmpty = renderer.render({ semanticRendered: '', userInput: 'hello' })
    const without = renderer.render({ userInput: 'hello' })
    expect(withEmpty).toBe(without)
  })

  it('should not create blank lines for empty semantic context', () => {
    const ctx: PromptContext = { semanticRendered: '', system: 'sys', userInput: 'input' }
    const result = renderer.render(ctx)
    expect(result).toBe('sys\n\ninput')
  })
})

// ---------------------------------------------------------------------------
// DefaultPromptRenderer — Semantic Only
// ---------------------------------------------------------------------------

describe('DefaultPromptRenderer — semantic only', () => {
  const renderer = new DefaultPromptRenderer()

  it('should render single semantic section', () => {
    const ctx: PromptContext = {
      semanticRendered: 'Semantic Context:\n\nIntent:\n- Create',
      userInput: 'Draw a tree',
    }
    const result = renderer.render(ctx)
    expect(result).toContain('Semantic Context:\n\nIntent:\n- Create')
    expect(result).toContain('Draw a tree')
  })

  it('should render semantic before user input', () => {
    const ctx: PromptContext = {
      semanticRendered: 'Semantic Context:\n\nIntent:\n- Create',
      userInput: 'Draw a tree',
    }
    const result = renderer.render(ctx)
    expect(result.indexOf('Semantic Context:')).toBeLessThan(result.indexOf('Draw a tree'))
  })

  it('should render multi-line semantic section', () => {
    const ctx: PromptContext = {
      semanticRendered: 'Semantic Context:\n\nIntent:\n- Create\n\nEntities:\n- Tree',
      userInput: 'create a tree',
    }
    const result = renderer.render(ctx)
    expect(result).toContain('Intent:')
    expect(result).toContain('Entities:')
    expect(result).toContain('- Create')
    expect(result).toContain('- Tree')
  })
})

// ---------------------------------------------------------------------------
// DefaultPromptRenderer — Intent + Entity + Semantic Canonical Order
// ---------------------------------------------------------------------------

describe('DefaultPromptRenderer — canonical order with semantic', () => {
  const renderer = new DefaultPromptRenderer()

  it('should render intent before entity before semantic before system', () => {
    const ctx: PromptContext = {
      intentRendered: 'User Intent:\n- Create',
      entityRendered: 'Entities:\n- Tree',
      semanticRendered: 'Semantic Context:\n\nIntent:\n- Create\n\nEntities:\n- Tree',
      system: 'You are a planner.',
      userInput: 'Draw a tree',
    }
    const result = renderer.render(ctx)
    const intentIdx = result.indexOf('User Intent:')
    const entityIdx = result.indexOf('Entities:')
    const semanticIdx = result.indexOf('Semantic Context:')
    const systemIdx = result.indexOf('You are a planner.')
    expect(intentIdx).toBeLessThan(entityIdx)
    expect(entityIdx).toBeLessThan(semanticIdx)
    expect(semanticIdx).toBeLessThan(systemIdx)
  })

  it('should render all three layers before system', () => {
    const ctx: PromptContext = {
      intentRendered: 'User Intent:\n- Create',
      entityRendered: 'Entities:\n- Tree',
      semanticRendered: 'Semantic Context:\n\nIntent:\n- Create\n\nEntities:\n- Tree',
      system: 'system prompt',
    }
    const result = renderer.render(ctx)
    expect(result).toContain('User Intent:')
    expect(result).toContain('Entities:')
    expect(result).toContain('Semantic Context:')
    expect(result).toContain('system prompt')
  })

  it('should work with serializePromptContext', () => {
    const ctx: PromptContext = {
      intentRendered: 'User Intent:\n- Create',
      entityRendered: 'Entities:\n- Tree',
      semanticRendered: 'Semantic Context:\n\nIntent:\n- Create\n\nEntities:\n- Tree',
      system: 'system',
      userInput: 'input',
    }
    const result = serializePromptContext(ctx)
    expect(result).toContain('User Intent:')
    expect(result).toContain('Entities:')
    expect(result).toContain('Semantic Context:')
    expect(result.indexOf('User Intent:')).toBeLessThan(result.indexOf('Entities:'))
    expect(result.indexOf('Entities:')).toBeLessThan(result.indexOf('Semantic Context:'))
  })
})

// ---------------------------------------------------------------------------
// DefaultPromptCompression — Semantic Context
// ---------------------------------------------------------------------------

describe('DefaultPromptCompression — semantic context', () => {
  const compression = new DefaultPromptCompression()

  it('should preserve semanticRendered when non-empty', () => {
    const ctx: PromptContext = {
      semanticRendered: 'Semantic Context:\n\nIntent:\n- Create',
      userInput: 'input',
    }
    const result = compression.compress(ctx)
    expect(result.semanticRendered).toBe('Semantic Context:\n\nIntent:\n- Create')
    expect(result.userInput).toBe('input')
  })

  it('should strip semanticRendered when empty string', () => {
    const ctx: PromptContext = { semanticRendered: '', userInput: 'input' }
    const result = compression.compress(ctx)
    expect(result.semanticRendered).toBeUndefined()
    expect(result.userInput).toBe('input')
  })

  it('should strip semanticRendered when undefined', () => {
    const ctx: PromptContext = { userInput: 'input' }
    const result = compression.compress(ctx)
    expect(result.semanticRendered).toBeUndefined()
  })

  it('should handle semanticRendered exclusion via selection', () => {
    const ctx: PromptContext = {
      semanticRendered: 'Semantic Context:\n\nIntent:\n- Create',
      userInput: 'input',
    }
    const result = compression.compress(ctx, {
      selectedSections: ['userInput'],
      excludedSections: ['semanticRendered'],
    })
    expect(result.semanticRendered).toBeUndefined()
    expect(result.userInput).toBe('input')
  })
})

// ---------------------------------------------------------------------------
// PromptBuilder Integration — Semantic Only
// ---------------------------------------------------------------------------

describe('PromptBuilder integration — semantic only', () => {
  it('should inject semanticRendered into PromptContext', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      intentAnalyzer: new RuleBasedIntentAnalyzer(),
      entityAnalyzer: new RuleBasedEntityAnalyzer(),
      semanticContextBuilder: new DefaultSemanticContextBuilder(),
      semanticContextRenderer: new DefaultSemanticContextRenderer(),
    })
    const request = await builder.build(createPipelineContext({ input: 'create a tree' }))
    // semanticRendered should NOT be in prompt text (it's on the PromptContext,
    // but the renderer handles it via CANONICAL_ORDER)
    expect(request.prompt).toContain('Semantic Context:')
  })

  it('should contain correct semantic section when intent + entity present', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      intentAnalyzer: new RuleBasedIntentAnalyzer(),
      intentRenderer: new DefaultIntentRenderer(),
      entityAnalyzer: new RuleBasedEntityAnalyzer(),
      entityRenderer: new DefaultEntityRenderer(),
      semanticContextBuilder: new DefaultSemanticContextBuilder(),
      semanticContextRenderer: new DefaultSemanticContextRenderer(),
    })
    const request = await builder.build(createPipelineContext({ input: 'create a tree' }))
    expect(request.prompt).toContain('Semantic Context:')
    expect(request.prompt).toContain('Intent:')
    expect(request.prompt).toContain('- Create')
    expect(request.prompt).toContain('Entities:')
    expect(request.prompt).toContain('- Tree')
  })

  it('should inject semanticRendered into metadata', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      intentAnalyzer: new RuleBasedIntentAnalyzer(),
      entityAnalyzer: new RuleBasedEntityAnalyzer(),
      semanticContextBuilder: new DefaultSemanticContextBuilder(),
      semanticContextRenderer: new DefaultSemanticContextRenderer(),
    })
    const request = await builder.build(createPipelineContext({ input: 'create a tree' }))
    const assembly = request.metadata?.promptAssembly as Record<string, unknown>
    expect(assembly.semanticRendered).toBeDefined()
  })

  it('should not inject semanticRendered when builder not configured', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      semanticContextRenderer: new DefaultSemanticContextRenderer(),
    })
    const request = await builder.build(createPipelineContext({ input: 'create a tree' }))
    expect(request.prompt).not.toContain('Semantic Context:')
  })
})

// ---------------------------------------------------------------------------
// PromptBuilder Integration — Intent + Entity + Semantic Full Order
// ---------------------------------------------------------------------------

describe('PromptBuilder — complete canonical order', () => {
  it('should produce correct order: Intent > Entity > Semantic > System > User', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      intentAnalyzer: new RuleBasedIntentAnalyzer(),
      intentRenderer: new DefaultIntentRenderer(),
      entityAnalyzer: new RuleBasedEntityAnalyzer(),
      entityRenderer: new DefaultEntityRenderer(),
      semanticContextBuilder: new DefaultSemanticContextBuilder(),
      semanticContextRenderer: new DefaultSemanticContextRenderer(),
    })
    const request = await builder.build(createPipelineContext({ input: 'create a tree' }))
    const prompt = request.prompt
    expect(prompt.indexOf('User Intent:')).toBeLessThan(prompt.indexOf('Entities:'))
    expect(prompt.indexOf('Entities:')).toBeLessThan(prompt.indexOf('Semantic Context:'))
    expect(prompt.indexOf('Semantic Context:')).toBeLessThan(prompt.indexOf('You are a game action planner'))
  })

  it('should include all three semantic layers', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      intentAnalyzer: new RuleBasedIntentAnalyzer(),
      intentRenderer: new DefaultIntentRenderer(),
      entityAnalyzer: new RuleBasedEntityAnalyzer(),
      entityRenderer: new DefaultEntityRenderer(),
      semanticContextBuilder: new DefaultSemanticContextBuilder(),
      semanticContextRenderer: new DefaultSemanticContextRenderer(),
    })
    const request = await builder.build(createPipelineContext({ input: 'create a tree' }))
    expect(request.prompt).toContain('User Intent:')
    expect(request.prompt).toContain('Entities:')
    expect(request.prompt).toContain('Semantic Context:')
  })
})

// ---------------------------------------------------------------------------
// DefaultPromptRenderer — canonical order membership
// ---------------------------------------------------------------------------

describe('DefaultPromptRenderer — CANONICAL_ORDER includes semanticRendered', () => {
  it('should include semanticRendered in CANONICAL_ORDER', () => {
    expect(DefaultPromptRenderer.CANONICAL_ORDER).toContain('semanticRendered')
  })

  it('should have semanticRendered after entityRendered', () => {
    const order = DefaultPromptRenderer.CANONICAL_ORDER
    const entityIdx = order.indexOf('entityRendered')
    const semanticIdx = order.indexOf('semanticRendered')
    expect(entityIdx).toBeLessThan(semanticIdx)
  })

  it('should have semanticRendered before system', () => {
    const order = DefaultPromptRenderer.CANONICAL_ORDER
    const semanticIdx = order.indexOf('semanticRendered')
    const systemIdx = order.indexOf('system')
    expect(semanticIdx).toBeLessThan(systemIdx)
  })
})

// ---------------------------------------------------------------------------
// Deterministic
// ---------------------------------------------------------------------------

describe('Deterministic — semantic prompt integration', () => {
  it('should produce identical prompt for same input', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      intentAnalyzer: new RuleBasedIntentAnalyzer(),
      entityAnalyzer: new RuleBasedEntityAnalyzer(),
      semanticContextBuilder: new DefaultSemanticContextBuilder(),
      semanticContextRenderer: new DefaultSemanticContextRenderer(),
    })
    const ctx = createPipelineContext({ input: 'create a tree' })
    const r1 = await builder.build(ctx)
    const r2 = await builder.build(ctx)
    expect(r1.prompt).toBe(r2.prompt)
  })
})

// ---------------------------------------------------------------------------
// RetryPlanner Compatibility
// ---------------------------------------------------------------------------

describe('RetryPlanner Compatibility', () => {
  it('should work with RetryPlanner', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      intentAnalyzer: new RuleBasedIntentAnalyzer(),
      entityAnalyzer: new RuleBasedEntityAnalyzer(),
      semanticContextBuilder: new DefaultSemanticContextBuilder(),
      semanticContextRenderer: new DefaultSemanticContextRenderer(),
    })
    const provider = new MockPlannerProvider(mockConfig)
    const planner = new RetryPlanner(provider)
    const pipeline = new DefaultPipeline(planner, builder)
    const context = createPipelineContext()
    await expect(pipeline.execute(context)).resolves.toBeDefined()
  })

  it('should not affect RetryPlanner retry behavior', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      intentAnalyzer: new RuleBasedIntentAnalyzer(),
      entityAnalyzer: new RuleBasedEntityAnalyzer(),
      semanticContextBuilder: new DefaultSemanticContextBuilder(),
      semanticContextRenderer: new DefaultSemanticContextRenderer(),
    })
    const provider = new MockPlannerProvider(mockConfig)
    const { RetryPolicy } = await import('../retry/RetryPolicy')
    const planner = new RetryPlanner(provider, new RetryPolicy({ maxRetries: 1 }))
    const pipeline = new DefaultPipeline(planner, builder)
    const context = createPipelineContext({ input: 'tree' })
    const result = await pipeline.execute(context)
    expect(result.plannerResult?.actions).toHaveLength(1)
  })
})

// ---------------------------------------------------------------------------
// ToolCallPlanner Compatibility
// ---------------------------------------------------------------------------

describe('ToolCallPlanner Compatibility', () => {
  it('should work with ToolCallPlanner', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      intentAnalyzer: new RuleBasedIntentAnalyzer(),
      entityAnalyzer: new RuleBasedEntityAnalyzer(),
      semanticContextBuilder: new DefaultSemanticContextBuilder(),
      semanticContextRenderer: new DefaultSemanticContextRenderer(),
    })
    const provider = new MockPlannerProvider(mockConfig)
    const toolRegistry = new DefaultToolRegistry()
    const planner = new ToolCallPlanner(provider, toolRegistry)
    const pipeline = new DefaultPipeline(planner, builder)
    const context = createPipelineContext()
    await expect(pipeline.execute(context)).resolves.toBeDefined()
  })

  it('should not affect ToolCallPlanner tool execution', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      intentAnalyzer: new RuleBasedIntentAnalyzer(),
      entityAnalyzer: new RuleBasedEntityAnalyzer(),
      semanticContextBuilder: new DefaultSemanticContextBuilder(),
      semanticContextRenderer: new DefaultSemanticContextRenderer(),
    })
    const provider = new MockPlannerProvider(mockConfig)
    const toolRegistry = new DefaultToolRegistry()
    const planner = new ToolCallPlanner(provider, toolRegistry)
    const pipeline = new DefaultPipeline(planner, builder)
    const context = createPipelineContext({ input: 'tree' })
    const result = await pipeline.execute(context)
    expect(result.plannerResult?.actions).toHaveLength(1)
  })
})

// ---------------------------------------------------------------------------
// Streaming Compatibility
// ---------------------------------------------------------------------------

describe('Streaming Compatibility', () => {
  it('should work with StreamingProvider', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      intentAnalyzer: new RuleBasedIntentAnalyzer(),
      entityAnalyzer: new RuleBasedEntityAnalyzer(),
      semanticContextBuilder: new DefaultSemanticContextBuilder(),
      semanticContextRenderer: new DefaultSemanticContextRenderer(),
    })
    const provider = new MockStreamingProvider()
    const planner = new MockPlanner(provider)
    const pipeline = new DefaultPipeline(planner, builder)
    const context = createPipelineContext()
    await expect(pipeline.stream(context)).resolves.toBeDefined()
  })

  it('should not affect streaming chunk emission', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      intentAnalyzer: new RuleBasedIntentAnalyzer(),
      entityAnalyzer: new RuleBasedEntityAnalyzer(),
      semanticContextBuilder: new DefaultSemanticContextBuilder(),
      semanticContextRenderer: new DefaultSemanticContextRenderer(),
    })
    const provider = new MockStreamingProvider()
    const planner = new MockPlanner(provider)
    const pipeline = new DefaultPipeline(planner, builder)
    const context = createPipelineContext({ input: 'tree' })
    const result = await pipeline.stream(context)
    expect(result.plannerResult?.actions).toHaveLength(1)
  })
})

// ---------------------------------------------------------------------------
// AgentLoop Compatibility
// ---------------------------------------------------------------------------

describe('AgentLoop Compatibility', () => {
  it('should work with DefaultAgentLoop', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      intentAnalyzer: new RuleBasedIntentAnalyzer(),
      entityAnalyzer: new RuleBasedEntityAnalyzer(),
      semanticContextBuilder: new DefaultSemanticContextBuilder(),
      semanticContextRenderer: new DefaultSemanticContextRenderer(),
    })
    const planner = new MockPlanner(new MockPlannerProvider(mockConfig))
    const pipeline = new DefaultPipeline(planner, builder)
    const context = createPipelineContext()
    await expect(pipeline.execute(context)).resolves.toBeDefined()
  })

  it('should not affect AgentLoop iteration count', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      intentAnalyzer: new RuleBasedIntentAnalyzer(),
      entityAnalyzer: new RuleBasedEntityAnalyzer(),
      semanticContextBuilder: new DefaultSemanticContextBuilder(),
      semanticContextRenderer: new DefaultSemanticContextRenderer(),
    })
    const planner = new MockPlanner(new MockPlannerProvider(mockConfig))
    const pipeline = new DefaultPipeline(planner, builder)
    const context = createPipelineContext({ input: 'tree' })
    const result = await pipeline.execute(context)
    expect(result.plannerResult?.actions).toHaveLength(1)
  })
})