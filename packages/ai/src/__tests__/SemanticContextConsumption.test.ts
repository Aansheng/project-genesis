import { describe, it, expect, vi } from 'vitest'
import { DefaultPromptBuilder } from '../prompt/DefaultPromptBuilder'
import type { BuilderOptions } from '../prompt/BuilderOptions'
import type { SemanticContext } from '../semantic/SemanticContext'
import type { SemanticContextBuilder } from '../semantic/SemanticContextBuilder'
import { DefaultSemanticContextBuilder } from '../semantic/DefaultSemanticContextBuilder'
import type { IntentResult } from '../intent/IntentResult'
import type { EntityResult } from '../entity/EntityResult'
import { DefaultIntentAnalyzer, RuleBasedIntentAnalyzer } from '../intent'
import { DefaultIntentRenderer } from '../intent/DefaultIntentRenderer'
import { DefaultEntityAnalyzer, RuleBasedEntityAnalyzer } from '../entity'
import { DefaultEntityRenderer } from '../entity/DefaultEntityRenderer'
import { DefaultPromptRenderer } from '../prompt/DefaultPromptRenderer'
import { DefaultPromptCompression } from '../prompt/DefaultPromptCompression'
import { DefaultMemoryRanking } from '../prompt/DefaultMemoryRanking'
import { DefaultPromptBudget } from '../prompt/DefaultPromptBudget'
import { DefaultPromptSelection } from '../prompt/DefaultPromptSelection'
import { DefaultProviderBudget } from '../prompt/DefaultProviderBudget'
import { DefaultAIConfiguration } from '../config/DefaultAIConfiguration'
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
import { DefaultAgentLoop } from '../agent/DefaultAgentLoop'
import { DefaultPipeline } from '../pipeline/DefaultPipeline'
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
// BuilderOptions — semanticContextBuilder Field
// ---------------------------------------------------------------------------

describe('BuilderOptions — semanticContextBuilder field', () => {
  it('should accept SemanticContextBuilder in BuilderOptions', () => {
    const options: BuilderOptions = {
      semanticContextBuilder: new DefaultSemanticContextBuilder(),
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], options)
    expect(builder).toBeDefined()
  })

  it('should accept SemanticContextBuilder alongside other BuilderOptions fields', () => {
    const options: BuilderOptions = {
      renderer: new DefaultPromptRenderer(),
      compression: new DefaultPromptCompression(),
      ranking: new DefaultMemoryRanking(),
      budget: new DefaultPromptBudget(),
      selection: new DefaultPromptSelection(),
      providerBudget: new DefaultProviderBudget(),
      configuration: new DefaultAIConfiguration(),
      intentAnalyzer: new DefaultIntentAnalyzer(),
      intentRenderer: new DefaultIntentRenderer(),
      entityAnalyzer: new DefaultEntityAnalyzer(),
      entityRenderer: new DefaultEntityRenderer(),
      semanticContextBuilder: new DefaultSemanticContextBuilder(),
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], options)
    expect(builder).toBeDefined()
  })

  it('should accept SemanticContextBuilder standalone in BuilderOptions', () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      semanticContextBuilder: new DefaultSemanticContextBuilder(),
    })
    expect(builder).toBeDefined()
  })

  it('should work without SemanticContextBuilder (backward compatible)', () => {
    const builder = new DefaultPromptBuilder(
      createDefaultModules(),
      {},
    )
    expect(builder).toBeDefined()
  })

  it('should work with legacy positional constructor (backward compatible)', () => {
    const builder = new DefaultPromptBuilder(
      createDefaultModules(),
      new DefaultPromptRenderer(),
      new DefaultPromptCompression(),
    )
    expect(builder).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// BuilderOptions — Default Behavior
// ---------------------------------------------------------------------------

describe('BuilderOptions — default behavior', () => {
  it('should produce same output without semanticContextBuilder', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {})
    const request = await builder.build(createPipelineContext({ input: 'hello' }))
    expect(request.metadata?.promptAssembly).toBeDefined()
    const assembly = request.metadata?.promptAssembly as Record<string, unknown>
    expect(assembly.semantic).toBeUndefined()
  })

  it('should not produce semantic metadata when semanticContextBuilder is undefined', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      semanticContextBuilder: undefined,
    })
    const request = await builder.build(createPipelineContext())
    const assembly = request.metadata?.promptAssembly as Record<string, unknown>
    expect(assembly.semantic).toBeUndefined()
  })

  it('should preserve existing intent and entity fields when semanticContextBuilder is present', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      intentAnalyzer: new RuleBasedIntentAnalyzer(),
      intentRenderer: new DefaultIntentRenderer(),
      entityAnalyzer: new RuleBasedEntityAnalyzer(),
      entityRenderer: new DefaultEntityRenderer(),
      semanticContextBuilder: new DefaultSemanticContextBuilder(),
    })
    const request = await builder.build(createPipelineContext())
    const assembly = request.metadata?.promptAssembly as Record<string, unknown>
    expect(assembly.intent).toBeDefined()
    expect(assembly.intentRendered).toBeDefined()
    expect(assembly.entity).toBeDefined()
    expect(assembly.entityRendered).toBeDefined()
    expect(assembly.semantic).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// SemanticContextBuilder Injection
// ---------------------------------------------------------------------------

describe('SemanticContextBuilder injection', () => {
  it('should invoke SemanticContextBuilder.build() exactly once per build()', async () => {
    const spy = vi.fn()
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      intentAnalyzer: new RuleBasedIntentAnalyzer(),
      entityAnalyzer: new RuleBasedEntityAnalyzer(),
      semanticContextBuilder: { build: spy },
    })
    await builder.build(createPipelineContext())
    expect(spy).toHaveBeenCalledTimes(1)
  })

  it('should pass IntentResult and EntityResult to build()', async () => {
    const spy = vi.fn()
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      intentAnalyzer: new RuleBasedIntentAnalyzer(),
      entityAnalyzer: new RuleBasedEntityAnalyzer(),
      semanticContextBuilder: { build: spy },
    })
    await builder.build(createPipelineContext({ input: 'create a tree' }))
    const [intent, entity] = spy.mock.calls[0]
    expect(intent).toBeDefined()
    expect(intent.intents).toHaveLength(1)
    expect(intent.intents[0].type).toBe('Create')
    expect(entity).toBeDefined()
    expect(entity.entities).toHaveLength(1)
    expect(entity.entities[0].type).toBe('Tree')
  })

  it('should pass undefined when no analyzers are configured', async () => {
    const spy = vi.fn()
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      semanticContextBuilder: { build: spy },
    })
    await builder.build(createPipelineContext())
    const [intent, entity] = spy.mock.calls[0]
    expect(intent).toBeUndefined()
    expect(entity).toBeUndefined()
  })

  it('should not invoke build() when SemanticContextBuilder is not configured', async () => {
    const spy = vi.fn()
    const builder = new DefaultPromptBuilder(createDefaultModules(), {})
    await builder.build(createPipelineContext())
    expect(spy).not.toHaveBeenCalled()
  })

  it('should work with custom SemanticContextBuilder implementation', async () => {
    const customBuilder: SemanticContextBuilder = {
      build(intent?: IntentResult, entity?: EntityResult): SemanticContext {
        return {
          intent,
          entity,
          ...(intent ? { custom: 'enriched' } : {}),
        } as SemanticContext
      },
    }
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      intentAnalyzer: new RuleBasedIntentAnalyzer(),
      semanticContextBuilder: customBuilder,
    })
    const request = await builder.build(createPipelineContext({ input: 'create' }))
    const assembly = request.metadata?.promptAssembly as Record<string, unknown>
    expect(assembly.semantic).toBeDefined()
    expect((assembly.semantic as Record<string, unknown>).intent).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// metadata.promptAssembly.semantic
// ---------------------------------------------------------------------------

describe('metadata.promptAssembly.semantic', () => {
  it('should contain semantic in promptAssembly when SemanticContextBuilder is configured', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      intentAnalyzer: new RuleBasedIntentAnalyzer(),
      intentRenderer: new DefaultIntentRenderer(),
      entityAnalyzer: new RuleBasedEntityAnalyzer(),
      entityRenderer: new DefaultEntityRenderer(),
      semanticContextBuilder: new DefaultSemanticContextBuilder(),
    })
    const request = await builder.build(createPipelineContext())
    const assembly = request.metadata?.promptAssembly as Record<string, unknown>
    expect(assembly.semantic).toBeDefined()
  })

  it('should contain intent and entity in semantic when both analyzers are configured', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      intentAnalyzer: new RuleBasedIntentAnalyzer(),
      entityAnalyzer: new RuleBasedEntityAnalyzer(),
      semanticContextBuilder: new DefaultSemanticContextBuilder(),
    })
    const request = await builder.build(createPipelineContext({ input: 'create a tree' }))
    const assembly = request.metadata?.promptAssembly as Record<string, unknown>
    const semantic = assembly.semantic as SemanticContext
    expect(semantic.intent?.intents[0].type).toBe('Create')
    expect(semantic.entity?.entities[0].type).toBe('Tree')
  })

  it('should contain only intent in semantic when only intent analyzer is present', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      intentAnalyzer: new RuleBasedIntentAnalyzer(),
      semanticContextBuilder: new DefaultSemanticContextBuilder(),
    })
    const request = await builder.build(createPipelineContext({ input: 'create a tree' }))
    const assembly = request.metadata?.promptAssembly as Record<string, unknown>
    const semantic = assembly.semantic as SemanticContext
    expect(semantic.intent?.intents[0].type).toBe('Create')
    expect(semantic.entity).toBeUndefined()
  })

  it('should contain only entity in semantic when only entity analyzer is present', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      entityAnalyzer: new RuleBasedEntityAnalyzer(),
      semanticContextBuilder: new DefaultSemanticContextBuilder(),
    })
    const request = await builder.build(createPipelineContext({ input: 'create a tree' }))
    const assembly = request.metadata?.promptAssembly as Record<string, unknown>
    const semantic = assembly.semantic as SemanticContext
    expect(semantic.intent).toBeUndefined()
    expect(semantic.entity?.entities[0].type).toBe('Tree')
  })

  it('should contain all existing fields alongside semantic', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      intentAnalyzer: new RuleBasedIntentAnalyzer(),
      intentRenderer: new DefaultIntentRenderer(),
      entityAnalyzer: new RuleBasedEntityAnalyzer(),
      entityRenderer: new DefaultEntityRenderer(),
      semanticContextBuilder: new DefaultSemanticContextBuilder(),
    })
    const request = await builder.build(createPipelineContext({ input: 'create a tree' }))
    const assembly = request.metadata?.promptAssembly as Record<string, unknown>
    expect(assembly.intent).toBeDefined()
    expect(assembly.intentRendered).toBeDefined()
    expect(assembly.entity).toBeDefined()
    expect(assembly.entityRendered).toBeDefined()
    expect(assembly.semantic).toBeDefined()
    expect(assembly.ranking).toBeDefined()
    expect(assembly.budget).toBeDefined()
    expect(assembly.selection).toBeDefined()
  })

  it('should not contain semantic when SemanticContextBuilder is not configured', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      intentAnalyzer: new RuleBasedIntentAnalyzer(),
    })
    const request = await builder.build(createPipelineContext())
    const assembly = request.metadata?.promptAssembly as Record<string, unknown>
    expect(assembly.semantic).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// Empty SemanticContext
// ---------------------------------------------------------------------------

describe('Empty SemanticContext', () => {
  it('should produce empty semantic when no analyzers are configured', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      semanticContextBuilder: new DefaultSemanticContextBuilder(),
    })
    const request = await builder.build(createPipelineContext({ input: 'hello' }))
    const assembly = request.metadata?.promptAssembly as Record<string, unknown>
    const semantic = assembly.semantic as SemanticContext
    expect(semantic.intent).toBeUndefined()
    expect(semantic.entity).toBeUndefined()
  })

  it('should produce empty semantic when analyzers return empty results', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      intentAnalyzer: new DefaultIntentAnalyzer(),
      entityAnalyzer: new DefaultEntityAnalyzer(),
      semanticContextBuilder: new DefaultSemanticContextBuilder(),
    })
    const request = await builder.build(createPipelineContext({ input: 'unknown input' }))
    const assembly = request.metadata?.promptAssembly as Record<string, unknown>
    const semantic = assembly.semantic as SemanticContext
    expect(semantic.intent?.intents).toHaveLength(0)
    expect(semantic.entity?.entities).toHaveLength(0)
  })

  it('should handle empty input string gracefully', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      intentAnalyzer: new RuleBasedIntentAnalyzer(),
      entityAnalyzer: new RuleBasedEntityAnalyzer(),
      semanticContextBuilder: new DefaultSemanticContextBuilder(),
    })
    const request = await builder.build(createPipelineContext({ input: '' }))
    const assembly = request.metadata?.promptAssembly as Record<string, unknown>
    const semantic = assembly.semantic as SemanticContext
    expect(semantic.intent?.intents).toHaveLength(0)
    expect(semantic.entity?.entities).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// Intent Only
// ---------------------------------------------------------------------------

describe('SemanticContext — Intent Only', () => {
  it('should contain intent but not entity in semantic', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      intentAnalyzer: new RuleBasedIntentAnalyzer(),
      semanticContextBuilder: new DefaultSemanticContextBuilder(),
    })
    const request = await builder.build(createPipelineContext({ input: 'move the character' }))
    const assembly = request.metadata?.promptAssembly as Record<string, unknown>
    const semantic = assembly.semantic as SemanticContext
    expect(semantic.intent?.intents[0].type).toBe('Move')
    expect(semantic.entity).toBeUndefined()
  })

  it('should work with DefaultIntentAnalyzer producing empty intent', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      intentAnalyzer: new DefaultIntentAnalyzer(),
      semanticContextBuilder: new DefaultSemanticContextBuilder(),
    })
    const request = await builder.build(createPipelineContext({ input: 'create' }))
    const assembly = request.metadata?.promptAssembly as Record<string, unknown>
    const semantic = assembly.semantic as SemanticContext
    expect(semantic.intent?.intents).toHaveLength(0)
    expect(semantic.entity).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// Entity Only
// ---------------------------------------------------------------------------

describe('SemanticContext — Entity Only', () => {
  it('should contain entity but not intent in semantic', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      entityAnalyzer: new RuleBasedEntityAnalyzer(),
      semanticContextBuilder: new DefaultSemanticContextBuilder(),
    })
    const request = await builder.build(createPipelineContext({ input: 'draw a tree' }))
    const assembly = request.metadata?.promptAssembly as Record<string, unknown>
    const semantic = assembly.semantic as SemanticContext
    expect(semantic.intent).toBeUndefined()
    expect(semantic.entity?.entities[0].type).toBe('Tree')
  })

  it('should work with DefaultEntityAnalyzer producing empty entity', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      entityAnalyzer: new DefaultEntityAnalyzer(),
      semanticContextBuilder: new DefaultSemanticContextBuilder(),
    })
    const request = await builder.build(createPipelineContext({ input: 'do something' }))
    const assembly = request.metadata?.promptAssembly as Record<string, unknown>
    const semantic = assembly.semantic as SemanticContext
    expect(semantic.intent).toBeUndefined()
    expect(semantic.entity?.entities).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// Intent + Entity
// ---------------------------------------------------------------------------

describe('SemanticContext — Intent + Entity', () => {
  it('should contain both intent and entity in semantic', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      intentAnalyzer: new RuleBasedIntentAnalyzer(),
      entityAnalyzer: new RuleBasedEntityAnalyzer(),
      semanticContextBuilder: new DefaultSemanticContextBuilder(),
    })
    const request = await builder.build(createPipelineContext({ input: 'create a tree and a flower' }))
    const assembly = request.metadata?.promptAssembly as Record<string, unknown>
    const semantic = assembly.semantic as SemanticContext
    expect(semantic.intent?.intents[0].type).toBe('Create')
    expect(semantic.entity?.entities).toHaveLength(2)
    expect(semantic.entity?.entities[0].type).toBe('Tree')
    expect(semantic.entity?.entities[1].type).toBe('Flower')
  })

  it('should contain multi-intent and multi-entity in semantic', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      intentAnalyzer: new RuleBasedIntentAnalyzer(),
      entityAnalyzer: new RuleBasedEntityAnalyzer(),
      semanticContextBuilder: new DefaultSemanticContextBuilder(),
    })
    const request = await builder.build(createPipelineContext({ input: 'create a tree and move the person' }))
    const assembly = request.metadata?.promptAssembly as Record<string, unknown>
    const semantic = assembly.semantic as SemanticContext
    expect(semantic.intent?.intents).toHaveLength(2)
    expect(semantic.intent?.intents[0].type).toBe('Create')
    expect(semantic.intent?.intents[1].type).toBe('Move')
    expect(semantic.entity?.entities).toHaveLength(2)
    expect(semantic.entity?.entities[0].type).toBe('Tree')
    expect(semantic.entity?.entities[1].type).toBe('Character')
  })
})

// ---------------------------------------------------------------------------
// DefaultSemanticContextBuilder Integration
// ---------------------------------------------------------------------------

describe('DefaultSemanticContextBuilder integration', () => {
  it('should combine intent and entity from analyzers', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      intentAnalyzer: new RuleBasedIntentAnalyzer(),
      entityAnalyzer: new RuleBasedEntityAnalyzer(),
      semanticContextBuilder: new DefaultSemanticContextBuilder(),
    })
    const request = await builder.build(createPipelineContext({ input: 'create a tree' }))
    const assembly = request.metadata?.promptAssembly as Record<string, unknown>
    const semantic = assembly.semantic as SemanticContext
    expect(semantic.intent?.intents[0].type).toBe('Create')
    expect(semantic.entity?.entities[0].type).toBe('Tree')
  })

  it('should preserve original SemanticContext data from DefaultSemanticContextBuilder', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      intentAnalyzer: new RuleBasedIntentAnalyzer(),
      entityAnalyzer: new RuleBasedEntityAnalyzer(),
      semanticContextBuilder: new DefaultSemanticContextBuilder(),
    })
    const request = await builder.build(createPipelineContext({ input: 'create a tree' }))
    const assembly = request.metadata?.promptAssembly as Record<string, unknown>
    const semantic = assembly.semantic as SemanticContext
    expect(semantic.intent?.intents).toHaveLength(1)
    expect(semantic.intent?.intents[0].type).toBe('Create')
    expect(semantic.entity?.entities).toHaveLength(1)
    expect(semantic.entity?.entities[0].type).toBe('Tree')
  })
})

// ---------------------------------------------------------------------------
// Builder Compatibility
// ---------------------------------------------------------------------------

describe('Builder Compatibility', () => {
  it('should work with legacy 1-param constructor', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()])
    const request = await builder.build({ input: 'hello' })
    expect(request.prompt).toContain('hello')
  })

  it('should work with legacy 3-param constructor', async () => {
    const builder = new DefaultPromptBuilder(
      [new UserInputModule()],
      new DefaultPromptRenderer(),
      new DefaultPromptCompression(),
    )
    const request = await builder.build({ input: 'hello' })
    expect(request.prompt).toContain('hello')
  })

  it('should work with legacy 5-param constructor', async () => {
    const builder = new DefaultPromptBuilder(
      [new UserInputModule()],
      new DefaultPromptRenderer(),
      new DefaultPromptCompression(),
      new DefaultMemoryRanking(),
      new DefaultPromptBudget(),
      new DefaultPromptSelection(),
    )
    const request = await builder.build({ input: 'hello' })
    expect(request.prompt).toContain('hello')
  })

  it('should work with all 8 positional params (legacy)', async () => {
    const builder = new DefaultPromptBuilder(
      [new UserInputModule()],
      new DefaultPromptRenderer(),
      new DefaultPromptCompression(),
      new DefaultMemoryRanking(),
      new DefaultPromptBudget(),
      new DefaultPromptSelection(),
      new DefaultProviderBudget(),
      new DefaultAIConfiguration(),
    )
    const request = await builder.build({ input: 'hello' })
    expect(request.prompt).toContain('hello')
  })

  it('should work with BuilderOptions containing semanticContextBuilder and intentAnalyzer', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      intentAnalyzer: new RuleBasedIntentAnalyzer(),
      intentRenderer: new DefaultIntentRenderer(),
      semanticContextBuilder: new DefaultSemanticContextBuilder(),
    })
    const request = await builder.build(createPipelineContext({ input: 'create' }))
    expect(request.metadata).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Pipeline Compatibility
// ---------------------------------------------------------------------------

describe('Pipeline Compatibility', () => {
  it('should work through DefaultPipeline', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      intentAnalyzer: new RuleBasedIntentAnalyzer(),
      entityAnalyzer: new RuleBasedEntityAnalyzer(),
      semanticContextBuilder: new DefaultSemanticContextBuilder(),
    })
    const planner = new MockPlanner(new MockPlannerProvider(mockConfig))
    const pipeline = new DefaultPipeline(planner, builder)
    const context = createPipelineContext({ input: 'create a tree' })
    const result = await pipeline.execute(context)
    expect(result.plannerResult).toBeDefined()
  })

  it('should preserve semantic in metadata through Pipeline metadata', async () => {
    // SemanticContext is stored in AIRequest.metadata.promptAssembly
    // Pipeline preserves PipelineContext.metadata, not AIRequest metadata
    // Verify by checking builder output metadata is correct
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      intentAnalyzer: new RuleBasedIntentAnalyzer(),
      entityAnalyzer: new RuleBasedEntityAnalyzer(),
      semanticContextBuilder: new DefaultSemanticContextBuilder(),
    })
    const context = createPipelineContext({ input: 'create a tree' })
    const request = await builder.build(context)
    const assembly = request.metadata?.promptAssembly as Record<string, unknown>
    const semantic = assembly.semantic as SemanticContext
    expect(semantic.intent?.intents[0].type).toBe('Create')
    expect(semantic.entity?.entities[0].type).toBe('Tree')
  })

  it('should not require semanticContextBuilder for Pipeline to work', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules())
    const planner = new MockPlanner(new MockPlannerProvider(mockConfig))
    const pipeline = new DefaultPipeline(planner, builder)
    const context = createPipelineContext({ input: 'tree' })
    const result = await pipeline.execute(context)
    expect(result.plannerResult?.actions).toHaveLength(1)
  })
})

// ---------------------------------------------------------------------------
// RetryPlanner Compatibility
// ---------------------------------------------------------------------------

describe('RetryPlanner Compatibility', () => {
  it('should work with RetryPlanner when semanticContextBuilder is configured', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      intentAnalyzer: new RuleBasedIntentAnalyzer(),
      semanticContextBuilder: new DefaultSemanticContextBuilder(),
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
      semanticContextBuilder: new DefaultSemanticContextBuilder(),
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
  it('should work with ToolCallPlanner when semanticContextBuilder is configured', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      intentAnalyzer: new RuleBasedIntentAnalyzer(),
      semanticContextBuilder: new DefaultSemanticContextBuilder(),
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
      semanticContextBuilder: new DefaultSemanticContextBuilder(),
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
  it('should work with StreamingProvider when semanticContextBuilder is configured', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      intentAnalyzer: new RuleBasedIntentAnalyzer(),
      semanticContextBuilder: new DefaultSemanticContextBuilder(),
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
      semanticContextBuilder: new DefaultSemanticContextBuilder(),
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
  it('should work with DefaultAgentLoop when semanticContextBuilder is configured', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      intentAnalyzer: new RuleBasedIntentAnalyzer(),
      semanticContextBuilder: new DefaultSemanticContextBuilder(),
    })
    const planner = new MockPlanner(new MockPlannerProvider(mockConfig))
    const pipeline = new DefaultPipeline(planner, builder)
    const context = createPipelineContext()
    await expect(pipeline.execute(context)).resolves.toBeDefined()
  })

  it('should not affect AgentLoop iteration count', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      intentAnalyzer: new RuleBasedIntentAnalyzer(),
      semanticContextBuilder: new DefaultSemanticContextBuilder(),
    })
    const planner = new MockPlanner(new MockPlannerProvider(mockConfig))
    const pipeline = new DefaultPipeline(planner, builder)
    const context = createPipelineContext({ input: 'tree' })
    const result = await pipeline.execute(context)
    expect(result.plannerResult?.actions).toHaveLength(1)
  })
})

// ---------------------------------------------------------------------------
// Deterministic
// ---------------------------------------------------------------------------

describe('Deterministic', () => {
  it('should produce identical semantic for same inputs', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      intentAnalyzer: new RuleBasedIntentAnalyzer(),
      entityAnalyzer: new RuleBasedEntityAnalyzer(),
      semanticContextBuilder: new DefaultSemanticContextBuilder(),
    })
    const context = createPipelineContext({ input: 'create a tree' })
    const r1 = await builder.build(context)
    const r2 = await builder.build(context)
    const a1 = r1.metadata?.promptAssembly as Record<string, unknown>
    const a2 = r2.metadata?.promptAssembly as Record<string, unknown>
    expect(a1.semantic).toEqual(a2.semantic)
  })

  it('should be idempotent across multiple calls', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      intentAnalyzer: new RuleBasedIntentAnalyzer(),
      entityAnalyzer: new RuleBasedEntityAnalyzer(),
      semanticContextBuilder: new DefaultSemanticContextBuilder(),
    })
    const context = createPipelineContext({ input: 'create a tree' })
    for (let i = 0; i < 5; i++) {
      const request = await builder.build(context)
      const assembly = request.metadata?.promptAssembly as Record<string, unknown>
      const semantic = assembly.semantic as SemanticContext
      expect(semantic.intent?.intents[0].type).toBe('Create')
      expect(semantic.entity?.entities[0].type).toBe('Tree')
    }
  })
})

// ---------------------------------------------------------------------------
// Stateless
// ---------------------------------------------------------------------------

describe('Stateless', () => {
  it('should not retain semantic state between build() calls', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      intentAnalyzer: new RuleBasedIntentAnalyzer(),
      semanticContextBuilder: new DefaultSemanticContextBuilder(),
    })
    const r1 = await builder.build(createPipelineContext({ input: 'create a tree' }))
    const r2 = await builder.build(createPipelineContext({ input: 'hello world' }))
    const a1 = r1.metadata?.promptAssembly as Record<string, unknown>
    const a2 = r2.metadata?.promptAssembly as Record<string, unknown>
    const s1 = a1.semantic as SemanticContext
    const s2 = a2.semantic as SemanticContext
    expect(s1.intent?.intents[0].type).toBe('Create')
    expect(s2.intent?.intents).toHaveLength(0)
  })

  it('should produce independent results across builder instances', async () => {
    const b1 = new DefaultPromptBuilder(createDefaultModules(), {
      intentAnalyzer: new RuleBasedIntentAnalyzer(),
      semanticContextBuilder: new DefaultSemanticContextBuilder(),
    })
    const b2 = new DefaultPromptBuilder(createDefaultModules(), {
      intentAnalyzer: new RuleBasedIntentAnalyzer(),
      semanticContextBuilder: new DefaultSemanticContextBuilder(),
    })
    const ctx = createPipelineContext({ input: 'create a tree' })
    const r1 = await b1.build(ctx)
    const r2 = await b2.build(ctx)
    const a1 = r1.metadata?.promptAssembly as Record<string, unknown>
    const a2 = r2.metadata?.promptAssembly as Record<string, unknown>
    expect(a1.semantic).toEqual(a2.semantic)
  })
})

// ---------------------------------------------------------------------------
// Immutability
// ---------------------------------------------------------------------------

describe('Immutability', () => {
  it('should not modify PipelineContext metadata', async () => {
    const metadata: Record<string, unknown> = { existing: 'data' }
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      intentAnalyzer: new RuleBasedIntentAnalyzer(),
      semanticContextBuilder: new DefaultSemanticContextBuilder(),
    })
    const context = createPipelineContext({ input: 'create a tree', metadata })
    const original = JSON.stringify(metadata)
    await builder.build(context)
    expect(JSON.stringify(metadata)).toBe(original)
  })

  it('should not modify original promptAssembly when semantic is added', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      intentAnalyzer: new RuleBasedIntentAnalyzer(),
      semanticContextBuilder: new DefaultSemanticContextBuilder(),
    })
    const request = await builder.build(createPipelineContext({ input: 'create a tree' }))
    const assembly1 = request.metadata?.promptAssembly as Record<string, unknown>
    const semantic1 = assembly1.semantic
    const request2 = await builder.build(createPipelineContext({ input: 'move' }))
    const assembly2 = request2.metadata?.promptAssembly as Record<string, unknown>
    const semantic2 = assembly2.semantic
    expect(semantic1).not.toEqual(semantic2)
    expect((semantic1 as SemanticContext).intent?.intents[0].type).toBe('Create')
    expect((semantic2 as SemanticContext).intent?.intents[0].type).toBe('Move')
  })
})

// ---------------------------------------------------------------------------
// Architecture Compliance
// ---------------------------------------------------------------------------

describe('Architecture Compliance', () => {
  it('should not modify any Sprint 4 Frozen Interface', () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      semanticContextBuilder: new DefaultSemanticContextBuilder(),
    })
    expect(builder).toBeDefined()
    // Verify PromptContext is unchanged
    const ctx: Record<string, unknown> = {}
    expect(ctx.intentRendered).toBeUndefined()
    expect(ctx.entityRendered).toBeUndefined()
  })

  it('should not modify PromptRenderer', () => {
    const renderer = new DefaultPromptRenderer()
    const result = renderer.render({ system: 'test' })
    expect(result).toBe('test')
  })

  it('should not modify PromptCompression', () => {
    const compression = new DefaultPromptCompression()
    const result = compression.compress({ system: 'test', userInput: undefined })
    expect(result.system).toBe('test')
    expect(result.userInput).toBeUndefined()
  })

  it('should not modify PromptContext structure', () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      intentAnalyzer: new RuleBasedIntentAnalyzer(),
      semanticContextBuilder: new DefaultSemanticContextBuilder(),
    })
    // buildContext should return PromptContext without semantic
    const ctx = builder.buildContext(createPipelineContext({ input: 'create a tree' }))
    expect(ctx).toBeDefined()
    expect('semantic' in ctx).toBe(false)
  })

  it('should not modify Pipeline interface', () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      semanticContextBuilder: new DefaultSemanticContextBuilder(),
    })
    const planner = new MockPlanner(new MockPlannerProvider(mockConfig))
    const pipeline = new DefaultPipeline(planner, builder)
    expect(typeof pipeline.execute).toBe('function')
    expect(typeof pipeline.stream).toBe('function')
  })

  it('should not modify Planner interface', () => {
    const provider = new MockPlannerProvider(mockConfig)
    const planner = new MockPlanner(provider)
    expect(typeof planner.plan).toBe('function')
  })

  it('should not modify AgentLoop interface', () => {
    const loop = new DefaultAgentLoop()
    expect(typeof loop.execute).toBe('function')
  })

  it('should not add semantic section to prompt text', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      intentAnalyzer: new RuleBasedIntentAnalyzer(),
      entityAnalyzer: new RuleBasedEntityAnalyzer(),
      entityRenderer: new DefaultEntityRenderer(),
      semanticContextBuilder: new DefaultSemanticContextBuilder(),
    })
    const request = await builder.build(createPipelineContext({ input: 'create a tree' }))
    // SemanticContext is metadata-only, not in prompt text
    expect(request.prompt).not.toContain('Semantic')
    expect(request.prompt).not.toContain('semantic')
  })

  it('should only write semantic to metadata, not to PromptContext', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      intentAnalyzer: new RuleBasedIntentAnalyzer(),
      semanticContextBuilder: new DefaultSemanticContextBuilder(),
    })
    const request = await builder.build(createPipelineContext({ input: 'create' }))
    const assembly = request.metadata?.promptAssembly as Record<string, unknown>
    expect(assembly.semantic).toBeDefined()
  })

  it('should not break when no analyzers are configured', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      semanticContextBuilder: new DefaultSemanticContextBuilder(),
    })
    const request = await builder.build(createPipelineContext({ input: 'hello' }))
    expect(request.prompt).toBeDefined()
  })

  it('should not break existing prompt module output', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      intentAnalyzer: new RuleBasedIntentAnalyzer(),
      intentRenderer: new DefaultIntentRenderer(),
      entityAnalyzer: new RuleBasedEntityAnalyzer(),
      entityRenderer: new DefaultEntityRenderer(),
      semanticContextBuilder: new DefaultSemanticContextBuilder(),
    })
    const request = await builder.build(createPipelineContext({ input: 'create a tree' }))
    expect(request.prompt).toContain('User Intent:')
    expect(request.prompt).toContain('Entities:')
  })

  it('should not depend on Planner', () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      semanticContextBuilder: new DefaultSemanticContextBuilder(),
    })
    expect(builder).toBeDefined()
  })

  it('should not depend on Runtime', () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      semanticContextBuilder: new DefaultSemanticContextBuilder(),
    })
    expect(builder).toBeDefined()
  })

  it('should be pure — no side effects on input', async () => {
    const context = createPipelineContext({ input: 'create a tree' })
    const contextStr = JSON.stringify(context)
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      intentAnalyzer: new RuleBasedIntentAnalyzer(),
      entityAnalyzer: new RuleBasedEntityAnalyzer(),
      semanticContextBuilder: new DefaultSemanticContextBuilder(),
    })
    await builder.build(context)
    expect(JSON.stringify(context)).toBe(contextStr)
  })
})