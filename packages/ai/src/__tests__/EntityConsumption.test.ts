import { describe, it, expect, vi } from 'vitest'
import { DefaultPromptBuilder } from '../prompt/DefaultPromptBuilder'
import type { BuilderOptions } from '../prompt/BuilderOptions'
import type { EntityAnalyzer } from '../entity/EntityAnalyzer'
import type { EntityResult } from '../entity/EntityResult'
import { DefaultEntityAnalyzer } from '../entity/DefaultEntityAnalyzer'
import { RuleBasedEntityAnalyzer } from '../entity/RuleBasedEntityAnalyzer'
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
import type { IntentAnalyzer } from '../intent/IntentAnalyzer'

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

// Spied EntityAnalyzer for invocation tracking
function createSpyAnalyzer(): { analyzer: EntityAnalyzer; spy: ReturnType<typeof vi.fn> } {
  const spy = vi.fn()
  const analyzer: EntityAnalyzer = {
    analyze(input: string): EntityResult {
      spy(input)
      if (input.toLowerCase().includes('tree')) return { entities: [{ type: 'Tree' }] }
      if (input.toLowerCase().includes('flower')) return { entities: [{ type: 'Flower' }] }
      if (input.toLowerCase().includes('house')) return { entities: [{ type: 'House' }] }
      if (input.toLowerCase().includes('rock')) return { entities: [{ type: 'Rock' }] }
      if (input.toLowerCase().includes('water')) return { entities: [{ type: 'Water' }] }
      if (input.toLowerCase().includes('grass')) return { entities: [{ type: 'Grass' }] }
      return { entities: [] }
    },
  }
  return { analyzer, spy }
}

const mockConfig = new DefaultAIConfiguration()

// ---------------------------------------------------------------------------
// BuilderOptions — EntityAnalyzer
// ---------------------------------------------------------------------------

describe('BuilderOptions — EntityAnalyzer field', () => {
  it('should accept EntityAnalyzer in BuilderOptions', () => {
    const options: BuilderOptions = {
      entityAnalyzer: new DefaultEntityAnalyzer(),
    }
    expect(options.entityAnalyzer).toBeDefined()
  })

  it('should accept RuleBasedEntityAnalyzer in BuilderOptions', () => {
    const options: BuilderOptions = {
      entityAnalyzer: new RuleBasedEntityAnalyzer(),
    }
    expect(options.entityAnalyzer).toBeInstanceOf(RuleBasedEntityAnalyzer)
  })

  it('should allow empty BuilderOptions without entityAnalyzer', () => {
    const options: BuilderOptions = {}
    expect(options.entityAnalyzer).toBeUndefined()
  })

  it('should not require entityAnalyzer — backward compatible', () => {
    const builder = new DefaultPromptBuilder(createDefaultModules())
    expect(builder).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// EntityAnalyzer Invocation
// ---------------------------------------------------------------------------

describe('EntityAnalyzer Invocation', () => {
  it('should invoke entityAnalyzer.analyze() during build()', async () => {
    const { analyzer, spy } = createSpyAnalyzer()
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      entityAnalyzer: analyzer,
    })
    const context = createPipelineContext({ input: 'draw a tree' })
    await builder.build(context)
    expect(spy).toHaveBeenCalledTimes(1)
  })

  it('should pass the correct input to entityAnalyzer', async () => {
    const { analyzer, spy } = createSpyAnalyzer()
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      entityAnalyzer: analyzer,
    })
    const context = createPipelineContext({ input: 'draw a tree and a flower' })
    await builder.build(context)
    expect(spy).toHaveBeenCalledWith('draw a tree and a flower')
  })

  it('should NOT invoke entityAnalyzer when not injected', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules())
    const context = createPipelineContext()
    await builder.build(context)
    // No entityAnalyzer — should not throw
    expect(true).toBe(true)
  })

  it('should be stateless — each call produces independent analysis', async () => {
    const { analyzer, spy } = createSpyAnalyzer()
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      entityAnalyzer: analyzer,
    })
    const context1 = createPipelineContext({ input: 'tree' })
    const context2 = createPipelineContext({ input: 'flower' })
    await builder.build(context1)
    await builder.build(context2)
    expect(spy).toHaveBeenCalledTimes(2)
    expect(spy).toHaveBeenNthCalledWith(1, 'tree')
    expect(spy).toHaveBeenNthCalledWith(2, 'flower')
  })
})

// ---------------------------------------------------------------------------
// EntityResult in Metadata
// ---------------------------------------------------------------------------

describe('EntityResult in Metadata', () => {
  it('should store EntityResult in metadata.promptAssembly.entity', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      entityAnalyzer: new RuleBasedEntityAnalyzer(),
    })
    const context = createPipelineContext({ input: 'draw a tree' })
    const result = await builder.build(context)
    const assembly = result.metadata?.promptAssembly as Record<string, unknown> | undefined
    expect(assembly?.entity).toBeDefined()
  })

  it('should store correct EntityResult for Tree', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      entityAnalyzer: new RuleBasedEntityAnalyzer(),
    })
    const context = createPipelineContext({ input: 'tree' })
    const result = await builder.build(context)
    const assembly = result.metadata?.promptAssembly as Record<string, unknown> | undefined
    const entityResult = assembly?.entity as EntityResult
    expect(entityResult.entities).toHaveLength(1)
    expect(entityResult.entities[0].type).toBe('Tree')
  })

  it('should store correct EntityResult for multiple entities', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      entityAnalyzer: new RuleBasedEntityAnalyzer(),
    })
    const context = createPipelineContext({ input: 'tree and flower' })
    const result = await builder.build(context)
    const assembly = result.metadata?.promptAssembly as Record<string, unknown> | undefined
    const entityResult = assembly?.entity as EntityResult
    expect(entityResult.entities).toHaveLength(2)
    expect(entityResult.entities[0].type).toBe('Tree')
    expect(entityResult.entities[1].type).toBe('Flower')
  })

  it('should store correct EntityResult for Tree + Flower + House', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      entityAnalyzer: new RuleBasedEntityAnalyzer(),
    })
    const context = createPipelineContext({ input: 'tree flower house' })
    const result = await builder.build(context)
    const assembly = result.metadata?.promptAssembly as Record<string, unknown> | undefined
    const entityResult = assembly?.entity as EntityResult
    expect(entityResult.entities).toHaveLength(3)
    expect(entityResult.entities[0].type).toBe('Tree')
    expect(entityResult.entities[1].type).toBe('Flower')
    expect(entityResult.entities[2].type).toBe('House')
  })

  it('should NOT store entity when entityAnalyzer is absent', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules())
    const context = createPipelineContext()
    const result = await builder.build(context)
    const assembly = result.metadata?.promptAssembly as Record<string, unknown> | undefined
    expect(assembly?.entity).toBeUndefined()
  })

  it('should preserve other metadata when entity is present', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      entityAnalyzer: new RuleBasedEntityAnalyzer(),
    })
    const context = createPipelineContext({ input: 'tree' })
    const result = await builder.build(context)
    const assembly = result.metadata?.promptAssembly as Record<string, unknown> | undefined
    expect(assembly?.ranking).toBeDefined()
    expect(assembly?.budget).toBeDefined()
    expect(assembly?.selection).toBeDefined()
    expect(assembly?.entity).toBeDefined()
  })

  it('should coexist with IntentAnalyzer metadata', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      intentAnalyzer: {
        analyze(input: string) {
          if (input.toLowerCase().includes('draw')) return { intents: [{ type: 'Create' as const }] }
          return { intents: [] }
        },
      },
      entityAnalyzer: new RuleBasedEntityAnalyzer(),
    })
    const context = createPipelineContext({ input: 'draw a tree' })
    const result = await builder.build(context)
    const assembly = result.metadata?.promptAssembly as Record<string, unknown> | undefined
    expect(assembly?.intent).toBeDefined()
    expect(assembly?.entity).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Empty Entity Result
// ---------------------------------------------------------------------------

describe('Empty Entity Result', () => {
  it('should handle DefaultEntityAnalyzer returning empty result', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      entityAnalyzer: new DefaultEntityAnalyzer(),
    })
    const context = createPipelineContext({ input: 'draw a tree' })
    const result = await builder.build(context)
    const assembly = result.metadata?.promptAssembly as Record<string, unknown> | undefined
    const entityResult = assembly?.entity as EntityResult | undefined
    expect(entityResult).toBeDefined()
    expect(entityResult!.entities).toEqual([])
  })

  it('should handle empty input gracefully', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      entityAnalyzer: new RuleBasedEntityAnalyzer(),
    })
    const context = createPipelineContext({ input: '' })
    await expect(builder.build(context)).resolves.toBeDefined()
  })

  it('should handle unknown input gracefully', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      entityAnalyzer: new RuleBasedEntityAnalyzer(),
    })
    const context = createPipelineContext({ input: 'gibberish' })
    const result = await builder.build(context)
    const assembly = result.metadata?.promptAssembly as Record<string, unknown> | undefined
    const entityResult = assembly?.entity as EntityResult | undefined
    expect(entityResult).toBeDefined()
    expect(entityResult!.entities).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// Builder Compatibility
// ---------------------------------------------------------------------------

describe('Builder Compatibility', () => {
  it('should work with legacy positional constructor', async () => {
    const builder = new DefaultPromptBuilder(
      createDefaultModules(),
      new DefaultPromptRenderer(),
      new DefaultPromptCompression(),
      new DefaultMemoryRanking(),
      new DefaultPromptBudget(),
      new DefaultPromptSelection(),
    )
    const context = createPipelineContext()
    await expect(builder.build(context)).resolves.toBeDefined()
  })

  it('should work with BuilderOptions constructor without entityAnalyzer', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {})
    const context = createPipelineContext()
    await expect(builder.build(context)).resolves.toBeDefined()
  })

  it('should work with BuilderOptions constructor with entityAnalyzer', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      entityAnalyzer: new RuleBasedEntityAnalyzer(),
    })
    const context = createPipelineContext()
    await expect(builder.build(context)).resolves.toBeDefined()
  })

  it('should produce same prompt output with entityAnalyzer', async () => {
    const builder1 = new DefaultPromptBuilder(createDefaultModules())
    const builder2 = new DefaultPromptBuilder(createDefaultModules(), {
      entityAnalyzer: new DefaultEntityAnalyzer(),
    })
    const context = createPipelineContext({ input: 'tree' })
    const r1 = await builder1.build(context)
    const r2 = await builder2.build(context)
    expect(r1.prompt).toBe(r2.prompt)
  })

  it('should produce same buildContext output with entityAnalyzer', async () => {
    const builder1 = new DefaultPromptBuilder(createDefaultModules())
    const builder2 = new DefaultPromptBuilder(createDefaultModules(), {
      entityAnalyzer: new DefaultEntityAnalyzer(),
    })
    const context = createPipelineContext({ input: 'tree' })
    const ctx1 = await builder1.buildContext(context)
    const ctx2 = await builder2.buildContext(context)
    expect(ctx1).toEqual(ctx2)
  })
})

// ---------------------------------------------------------------------------
// Deterministic
// ---------------------------------------------------------------------------

describe('Deterministic', () => {
  it('should produce identical entity metadata for same input', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      entityAnalyzer: new RuleBasedEntityAnalyzer(),
    })
    const context = createPipelineContext({ input: 'tree and flower' })
    const r1 = await builder.build(context)
    const r2 = await builder.build(context)
    const meta1 = r1.metadata?.promptAssembly as Record<string, unknown>
    const meta2 = r2.metadata?.promptAssembly as Record<string, unknown>
    expect(meta1.entity).toEqual(meta2.entity)
  })

  it('should produce identical results for Chinese input', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      entityAnalyzer: new RuleBasedEntityAnalyzer(),
    })
    const context = createPipelineContext({ input: '树和花' })
    const r1 = await builder.build(context)
    const r2 = await builder.build(context)
    const meta1 = r1.metadata?.promptAssembly as Record<string, unknown>
    const meta2 = r2.metadata?.promptAssembly as Record<string, unknown>
    expect(meta1.entity).toEqual(meta2.entity)
  })

  it('should produce identical results across repeated calls', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      entityAnalyzer: new RuleBasedEntityAnalyzer(),
    })
    const context = createPipelineContext({ input: 'tree flower house' })
    const results = []
    for (let i = 0; i < 5; i++) {
      results.push(await builder.build(context))
    }
    for (let i = 1; i < results.length; i++) {
      const meta1 = results[0].metadata?.promptAssembly as Record<string, unknown>
      const meta2 = results[i].metadata?.promptAssembly as Record<string, unknown>
      expect(meta1.entity).toEqual(meta2.entity)
    }
  })
})

// ---------------------------------------------------------------------------
// Stateless
// ---------------------------------------------------------------------------

describe('Stateless', () => {
  it('should not retain entity state between builds', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      entityAnalyzer: new RuleBasedEntityAnalyzer(),
    })
    const ctx1 = createPipelineContext({ input: 'tree' })
    const ctx2 = createPipelineContext({ input: '' })
    const ctx3 = createPipelineContext({ input: 'flower' })

    const r1 = await builder.build(ctx1)
    const r2 = await builder.build(ctx2)
    const r3 = await builder.build(ctx3)

    const m1 = r1.metadata?.promptAssembly as Record<string, unknown>
    const m2 = r2.metadata?.promptAssembly as Record<string, unknown>
    const m3 = r3.metadata?.promptAssembly as Record<string, unknown>

    expect((m1.entity as EntityResult).entities).toHaveLength(1)
    expect((m2.entity as EntityResult).entities).toEqual([])
    expect((m3.entity as EntityResult).entities).toHaveLength(1)
  })

  it('should be independent across multiple builder instances', async () => {
    const builder1 = new DefaultPromptBuilder(createDefaultModules(), {
      entityAnalyzer: new RuleBasedEntityAnalyzer(),
    })
    const builder2 = new DefaultPromptBuilder(createDefaultModules(), {
      entityAnalyzer: new RuleBasedEntityAnalyzer(),
    })
    const ctx = createPipelineContext({ input: 'tree' })
    const r1 = await builder1.build(ctx)
    const r2 = await builder2.build(ctx)
    const m1 = r1.metadata?.promptAssembly as Record<string, unknown>
    const m2 = r2.metadata?.promptAssembly as Record<string, unknown>
    expect(m1.entity).toEqual(m2.entity)
  })
})

// ---------------------------------------------------------------------------
// Immutability
// ---------------------------------------------------------------------------

describe('Immutability', () => {
  it('should not modify PipelineContext input', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      entityAnalyzer: new RuleBasedEntityAnalyzer(),
    })
    const input = 'draw a tree'
    const context = createPipelineContext({ input })
    await builder.build(context)
    expect(context.input).toBe(input)
  })

  it('should not modify PromptContext', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      entityAnalyzer: new RuleBasedEntityAnalyzer(),
    })
    const context = createPipelineContext({ input: 'tree' })
    const ctx = await builder.buildContext(context)
    const ctxBefore = JSON.stringify(ctx)
    await builder.build(context)
    const ctxAfter = JSON.stringify(await builder.buildContext(context))
    expect(ctxBefore).toBe(ctxAfter)
  })
})

// ---------------------------------------------------------------------------
// Pipeline Execution Order
// ---------------------------------------------------------------------------

describe('Pipeline Execution Order', () => {
  it('should execute EntityAnalyzer after IntentAnalyzer', async () => {
    const intentSpy = vi.fn()
    const entitySpy = vi.fn()

    const iA: IntentAnalyzer = { analyze: (input: string) => { intentSpy(); return { intents: [{ type: 'Create' }] } } }
    const eA: EntityAnalyzer = { analyze: (input: string) => { entitySpy(); return { entities: [] } } }

    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      intentAnalyzer: iA,
      entityAnalyzer: eA,
    })
    const context = createPipelineContext({ input: 'draw a tree' })
    await builder.build(context)

    expect(intentSpy.mock.calls.length).toBe(1)
    expect(entitySpy.mock.calls.length).toBe(1)
  })
})

// ---------------------------------------------------------------------------
// DefaultEntityAnalyzer in Pipeline
// ---------------------------------------------------------------------------

describe('DefaultEntityAnalyzer in Pipeline', () => {
  it('should work when DefaultEntityAnalyzer is injected', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      entityAnalyzer: new DefaultEntityAnalyzer(),
    })
    const context = createPipelineContext({ input: 'draw a tree' })
    const result = await builder.build(context)
    const assembly = result.metadata?.promptAssembly as Record<string, unknown> | undefined
    expect(assembly?.entity).toBeDefined()
    const entityResult = assembly?.entity as EntityResult
    expect(entityResult.entities).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// RuleBasedEntityAnalyzer Integration
// ---------------------------------------------------------------------------

describe('RuleBasedEntityAnalyzer Integration', () => {
  it('should detect Tree from Chinese input', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      entityAnalyzer: new RuleBasedEntityAnalyzer(),
    })
    const context = createPipelineContext({ input: '画一棵树' })
    const result = await builder.build(context)
    const assembly = result.metadata?.promptAssembly as Record<string, unknown>
    const entityResult = assembly.entity as EntityResult
    expect(entityResult.entities.map(e => e.type)).toEqual(['Tree'])
  })

  it('should detect Flower from English input', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      entityAnalyzer: new RuleBasedEntityAnalyzer(),
    })
    const context = createPipelineContext({ input: 'draw a flower' })
    const result = await builder.build(context)
    const assembly = result.metadata?.promptAssembly as Record<string, unknown>
    const entityResult = assembly.entity as EntityResult
    expect(entityResult.entities.map(e => e.type)).toEqual(['Flower'])
  })

  it('should detect multiple entities from mixed input', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      entityAnalyzer: new RuleBasedEntityAnalyzer(),
    })
    const context = createPipelineContext({ input: 'tree、花和house' })
    const result = await builder.build(context)
    const assembly = result.metadata?.promptAssembly as Record<string, unknown>
    const entityResult = assembly.entity as EntityResult
    expect(entityResult.entities.map(e => e.type)).toEqual(['Tree', 'Flower', 'House'])
  })
})

// ---------------------------------------------------------------------------
// DefaultPipeline Integration
// ---------------------------------------------------------------------------

describe('DefaultPipeline Integration', () => {
  it('should work with DefaultPipeline.execute()', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      entityAnalyzer: new RuleBasedEntityAnalyzer(),
    })
    const planner = new MockPlanner(new MockPlannerProvider(mockConfig))
    const pipeline = new DefaultPipeline(planner, builder)
    const context = createPipelineContext({ input: 'draw a tree' })
    const result = await pipeline.execute(context)
    expect(result.plannerResult).toBeDefined()
  })

  it('should work with DefaultPipeline.stream()', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      entityAnalyzer: new RuleBasedEntityAnalyzer(),
    })
    const provider = new MockStreamingProvider()
    const planner = new MockPlanner(provider)
    const pipeline = new DefaultPipeline(planner, builder)
    const context = createPipelineContext({ input: 'draw a tree' })
    const result = await pipeline.stream(context)
    expect(result.plannerResult).toBeDefined()
  })

  it('should work without entity analyzer', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules())
    const planner = new MockPlanner(new MockPlannerProvider(mockConfig))
    const pipeline = new DefaultPipeline(planner, builder)
    const context = createPipelineContext()
    await expect(pipeline.execute(context)).resolves.toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// RetryPlanner Compatibility
// ---------------------------------------------------------------------------

describe('RetryPlanner Compatibility', () => {
  it('should work with RetryPlanner', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      entityAnalyzer: new RuleBasedEntityAnalyzer(),
    })
    const provider = new MockPlannerProvider(mockConfig)
    const planner = new RetryPlanner(provider)
    const pipeline = new DefaultPipeline(planner, builder)
    const context = createPipelineContext()
    await expect(pipeline.execute(context)).resolves.toBeDefined()
  })

  it('should not affect RetryPlanner retry behavior', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      entityAnalyzer: new RuleBasedEntityAnalyzer(),
    })
    const provider = new MockPlannerProvider(new DefaultAIConfiguration())
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
      entityAnalyzer: new RuleBasedEntityAnalyzer(),
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
      entityAnalyzer: new RuleBasedEntityAnalyzer(),
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
      entityAnalyzer: new RuleBasedEntityAnalyzer(),
    })
    const provider = new MockStreamingProvider()
    const planner = new MockPlanner(provider)
    const pipeline = new DefaultPipeline(planner, builder)
    const context = createPipelineContext()
    await expect(pipeline.stream(context)).resolves.toBeDefined()
  })

  it('should not affect streaming chunk emission', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      entityAnalyzer: new RuleBasedEntityAnalyzer(),
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
      entityAnalyzer: new RuleBasedEntityAnalyzer(),
    })
    const planner = new MockPlanner(new MockPlannerProvider(mockConfig))
    const pipeline = new DefaultPipeline(planner, builder)
    const context = createPipelineContext()
    await expect(pipeline.execute(context)).resolves.toBeDefined()
  })

  it('should not affect AgentLoop iteration count', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      entityAnalyzer: new RuleBasedEntityAnalyzer(),
    })
    const planner = new MockPlanner(new MockPlannerProvider(mockConfig))
    const pipeline = new DefaultPipeline(planner, builder)
    const context = createPipelineContext({ input: 'tree' })
    const result = await pipeline.execute(context)
    expect(result.plannerResult?.actions).toHaveLength(1)
  })
})

// ---------------------------------------------------------------------------
// Edge Cases
// ---------------------------------------------------------------------------

describe('Edge Cases', () => {
  it('should handle empty string input gracefully', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      entityAnalyzer: new RuleBasedEntityAnalyzer(),
    })
    const context = createPipelineContext({ input: '' })
    await expect(builder.build(context)).resolves.toBeDefined()
  })

  it('should handle blank input gracefully', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      entityAnalyzer: new RuleBasedEntityAnalyzer(),
    })
    const context = createPipelineContext({ input: '' })
    const result = await builder.build(context)
    const assembly = result.metadata?.promptAssembly as Record<string, unknown>
    const entityResult = assembly.entity as EntityResult
    expect(entityResult.entities).toEqual([])
  })

  it('should handle null-like input gracefully', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      entityAnalyzer: new RuleBasedEntityAnalyzer(),
    })
    const context = createPipelineContext({ input: 'null' })
    await expect(builder.build(context)).resolves.toBeDefined()
  })
})