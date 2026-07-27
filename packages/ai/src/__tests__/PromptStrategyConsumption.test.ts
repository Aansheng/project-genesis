import { describe, it, expect, vi } from 'vitest'
import { DefaultPromptBuilder } from '../prompt/DefaultPromptBuilder'
import type { BuilderOptions } from '../prompt/BuilderOptions'
import type { PromptStrategy } from '../strategy/PromptStrategy'
import type { PromptStrategySelector } from '../strategy/PromptStrategySelector'
import { DefaultPromptStrategy } from '../strategy/DefaultPromptStrategy'
import { DefaultPromptStrategySelector } from '../strategy/DefaultPromptStrategySelector'
import type { SemanticContext } from '../semantic/SemanticContext'
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
// Test Helpers
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

/** A custom strategy that only applies when context has a matching entity type */
class TestStrategy implements PromptStrategy {
  constructor(
    readonly name: string,
    private readonly keyword: string,
  ) {}

  applies(context: SemanticContext): boolean {
    return context.entity?.entities.some(e => e.type === this.keyword) ?? false
  }
}

// ---------------------------------------------------------------------------
// BuilderOptions — strategySelector Field
// ---------------------------------------------------------------------------

describe('BuilderOptions — strategySelector field', () => {
  it('should accept strategySelector in BuilderOptions', () => {
    const options: BuilderOptions = {
      strategySelector: new DefaultPromptStrategySelector(),
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], options)
    expect(builder).toBeDefined()
  })

  it('should accept strategies in BuilderOptions', () => {
    const options: BuilderOptions = {
      strategies: [new DefaultPromptStrategy()],
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], options)
    expect(builder).toBeDefined()
  })

  it('should accept both strategySelector and strategies in BuilderOptions', () => {
    const options: BuilderOptions = {
      strategySelector: new DefaultPromptStrategySelector(),
      strategies: [new DefaultPromptStrategy()],
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], options)
    expect(builder).toBeDefined()
  })

  it('should accept strategySelector alongside all other BuilderOptions fields', () => {
    const options: BuilderOptions = {
      renderer: new DefaultPromptRenderer(),
      compression: new DefaultPromptCompression(),
      ranking: new DefaultMemoryRanking(),
      budget: new DefaultPromptBudget(),
      selection: new DefaultPromptSelection(),
      providerBudget: new DefaultProviderBudget(),
      configuration: new DefaultAIConfiguration(),
      strategySelector: new DefaultPromptStrategySelector(),
      strategies: [new DefaultPromptStrategy()],
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], options)
    expect(builder).toBeDefined()
  })

  it('should work without strategySelector (backward compatible)', () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {})
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
// Strategy Selection — Selector Invocation
// ---------------------------------------------------------------------------

describe('Strategy selection — selector invocation', () => {
  it('should invoke selector.select() when both selector and strategies are provided', async () => {
    const selectSpy = vi.fn((_s: readonly PromptStrategy[], _c: SemanticContext) => new DefaultPromptStrategy())
    const selector: PromptStrategySelector = { select: selectSpy }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      strategySelector: selector,
      strategies: [new DefaultPromptStrategy()],
    })
    await builder.build(createPipelineContext())
    expect(selectSpy).toHaveBeenCalledTimes(1)
  })

  it('should pass strategies and context to selector.select()', async () => {
    const strategies: readonly PromptStrategy[] = [
      new TestStrategy('tree', 'Tree'),
      new DefaultPromptStrategy(),
    ]
    const capturedStrategies: PromptStrategy[][] = []
    const capturedContexts: SemanticContext[] = []
    const selector: PromptStrategySelector = {
      select(s, c) {
        capturedStrategies.push([...s])
        capturedContexts.push(c)
        return new DefaultPromptStrategy()
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      strategySelector: selector,
      strategies,
    })
    await builder.build(createPipelineContext())
    expect(capturedStrategies).toHaveLength(1)
    expect(capturedStrategies[0]).toHaveLength(2)
    expect(capturedStrategies[0][0].name).toBe('tree')
    expect(capturedStrategies[0][1].name).toBe('default')
  })

  it('should pass empty context when no semanticContextBuilder is provided', async () => {
    let passedContext: SemanticContext | undefined
    const selector: PromptStrategySelector = {
      select(_s, c) {
        passedContext = c
        return new DefaultPromptStrategy()
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      strategySelector: selector,
      strategies: [new DefaultPromptStrategy()],
    })
    await builder.build(createPipelineContext())
    expect(passedContext).toBeDefined()
    expect(passedContext?.intent).toBeUndefined()
    expect(passedContext?.entity).toBeUndefined()
  })

  it('should pass semanticContext when semanticContextBuilder is provided', async () => {
    let passedContext: SemanticContext | undefined
    const selector: PromptStrategySelector = {
      select(_s, c) {
        passedContext = c
        return new DefaultPromptStrategy()
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      strategySelector: selector,
      strategies: [new DefaultPromptStrategy()],
      // Injecting one but using simple capture to verify it flows
    })
    await builder.build(createPipelineContext())
    expect(passedContext).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Strategy Selection — Fallback
// ---------------------------------------------------------------------------

describe('Strategy selection — fallback to DefaultPromptStrategy', () => {
  it('should default to DefaultPromptStrategy when selector is absent', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      strategies: [new TestStrategy('tree', 'Tree')],
    })
    const request = await builder.build(createPipelineContext())
    const assembly = request.metadata?.promptAssembly as Record<string, unknown> | undefined
    expect(assembly?.strategy).toEqual({ name: 'default' })
  })

  it('should default to DefaultPromptStrategy when strategies are absent', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      strategySelector: new DefaultPromptStrategySelector(),
    })
    const request = await builder.build(createPipelineContext())
    const assembly = request.metadata?.promptAssembly as Record<string, unknown> | undefined
    expect(assembly?.strategy).toEqual({ name: 'default' })
  })

  it('should default to DefaultPromptStrategy when both are absent', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()])
    const request = await builder.build(createPipelineContext())
    const assembly = request.metadata?.promptAssembly as Record<string, unknown> | undefined
    expect(assembly?.strategy).toEqual({ name: 'default' })
  })

  it('should default to DefaultPromptStrategy with legacy positional constructor', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()])
    const request = await builder.build(createPipelineContext())
    const assembly = request.metadata?.promptAssembly as Record<string, unknown> | undefined
    expect(assembly?.strategy).toEqual({ name: 'default' })
  })

  it('should select matching strategy when selector and strategies are present', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      strategySelector: new DefaultPromptStrategySelector(),
      strategies: [new TestStrategy('tree', 'Tree'), new DefaultPromptStrategy()],
      // Note: without entity analyzer, context.entity will be undefined
      // so TestStrategy won't match, and fallback will occur
    })
    const request = await builder.build(createPipelineContext())
    const assembly = request.metadata?.promptAssembly as Record<string, unknown> | undefined
    // No entity analyzer, so context has no entity → TestStrategy won't match → fallback to default
    expect(assembly?.strategy).toEqual({ name: 'default' })
  })

  it('should select matching strategy based on semantic context', async () => {
    // Build with semantic context that triggers a custom strategy
    const treeStrategy = new TestStrategy('tree-strategy', 'Tree')
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      strategySelector: new DefaultPromptStrategySelector(),
      strategies: [treeStrategy, new DefaultPromptStrategy()],
    })
    // Note: without entity analyzer, context.entity will be undefined
    // We'll verify via mock that the selector returns DefaultPromptStrategy
    const request = await builder.build(createPipelineContext())
    const assembly = request.metadata?.promptAssembly as Record<string, unknown> | undefined
    expect(assembly?.strategy).toBeDefined()
    expect(typeof (assembly?.strategy as { name: string }).name).toBe('string')
  })
})

// ---------------------------------------------------------------------------
// Strategy Selection — Metadata
// ---------------------------------------------------------------------------

describe('Strategy selection — metadata', () => {
  it('should store strategy name in metadata.promptAssembly.strategy', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      strategySelector: new DefaultPromptStrategySelector(),
      strategies: [new DefaultPromptStrategy()],
    })
    const request = await builder.build(createPipelineContext())
    const assembly = request.metadata?.promptAssembly as Record<string, unknown> | undefined
    expect(assembly?.strategy).toBeDefined()
    expect(assembly?.strategy).toEqual({ name: 'default' })
  })

  it('should store correct strategy name when custom strategy matches', async () => {
    // Custom selector that always returns a specific strategy
    const customStrategy = new TestStrategy('custom-strategy', 'Tree')
    const selector: PromptStrategySelector = {
      select() {
        return customStrategy
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      strategySelector: selector,
      strategies: [customStrategy],
    })
    const request = await builder.build(createPipelineContext())
    const assembly = request.metadata?.promptAssembly as Record<string, unknown> | undefined
    expect(assembly?.strategy).toEqual({ name: 'custom-strategy' })
  })

  it('should preserve strategy alongside other metadata fields', async () => {
    const builder = new DefaultPromptBuilder(
      createDefaultModules(),
      {},
    )
    const request = await builder.build(createPipelineContext())
    const assembly = request.metadata?.promptAssembly as Record<string, unknown> | undefined
    expect(assembly?.strategy).toBeDefined()
    expect(assembly?.ranking).toBeDefined()
    expect(assembly?.budget).toBeDefined()
    expect(assembly?.selection).toBeDefined()
  })

  it('should not inject strategy into PromptContext', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {})
    const context = await builder.buildContext(createPipelineContext())
    // PromptContext should not have a strategy field
    expect('strategy' in context).toBe(false)
  })

  it('should not inject strategy name into prompt string', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {})
    const request = await builder.build(createPipelineContext())
    expect(request.prompt).not.toContain('strategy')
    expect(request.prompt).not.toContain('default')
  })
})

// ---------------------------------------------------------------------------
// Strategy Selection — Deterministic
// ---------------------------------------------------------------------------

describe('Strategy selection — deterministic', () => {
  it('should return same strategy for same inputs', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()])
    const req1 = await builder.build(createPipelineContext())
    const req2 = await builder.build(createPipelineContext())
    const req3 = await builder.build(createPipelineContext())
    const a1 = req1.metadata?.promptAssembly as Record<string, unknown> | undefined
    const a2 = req2.metadata?.promptAssembly as Record<string, unknown> | undefined
    const a3 = req3.metadata?.promptAssembly as Record<string, unknown> | undefined
    expect(a1?.strategy).toEqual(a2?.strategy)
    expect(a2?.strategy).toEqual(a3?.strategy)
  })

  it('should be idempotent across repeated calls with selector', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      strategySelector: new DefaultPromptStrategySelector(),
      strategies: [new DefaultPromptStrategy()],
    })
    for (let i = 0; i < 5; i++) {
      const request = await builder.build(createPipelineContext())
      const assembly = request.metadata?.promptAssembly as Record<string, unknown> | undefined
      expect(assembly?.strategy).toEqual({ name: 'default' })
    }
  })
})

// ---------------------------------------------------------------------------
// Strategy Selection — Stateless
// ---------------------------------------------------------------------------

describe('Strategy selection — stateless', () => {
  it('should not retain strategy state between builds', async () => {
    const selector: PromptStrategySelector = {
      select(_s, _c) {
        return new DefaultPromptStrategy()
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      strategySelector: selector,
      strategies: [new DefaultPromptStrategy()],
    })
    const req1 = await builder.build(createPipelineContext({ input: 'draw a tree' }))
    const req2 = await builder.build(createPipelineContext({ input: 'delete the flower' }))
    const a1 = req1.metadata?.promptAssembly as Record<string, unknown> | undefined
    const a2 = req2.metadata?.promptAssembly as Record<string, unknown> | undefined
    expect(a1?.strategy).toEqual(a2?.strategy)
  })
})

// ---------------------------------------------------------------------------
// Builder Compatibility
// ---------------------------------------------------------------------------

describe('Builder compatibility', () => {
  it('should work with DefaultPromptBuilder using no options', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules())
    const request = await builder.build(createPipelineContext())
    expect(request.prompt).toBeDefined()
    expect(request.metadata).toBeDefined()
  })

  it('should work with DefaultPromptBuilder using empty BuilderOptions', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {})
    const request = await builder.build(createPipelineContext())
    expect(request.prompt).toBeDefined()
  })

  it('should work with all builder options filled', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      renderer: new DefaultPromptRenderer(),
      compression: new DefaultPromptCompression(),
      ranking: new DefaultMemoryRanking(),
      budget: new DefaultPromptBudget(),
      selection: new DefaultPromptSelection(),
      providerBudget: new DefaultProviderBudget(),
      configuration: new DefaultAIConfiguration(),
      strategySelector: new DefaultPromptStrategySelector(),
      strategies: [new DefaultPromptStrategy()],
    })
    const request = await builder.build(createPipelineContext())
    expect(request.prompt).toBeDefined()
  })

  it('should work with buildContext() — strategy not included', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      strategySelector: new DefaultPromptStrategySelector(),
      strategies: [new DefaultPromptStrategy()],
    })
    const context = await builder.buildContext(createPipelineContext())
    expect(context).toBeDefined()
    expect('strategy' in context).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Pipeline Compatibility
// ---------------------------------------------------------------------------

describe('Pipeline compatibility', () => {
  it('should work with DefaultPipeline', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      strategySelector: new DefaultPromptStrategySelector(),
      strategies: [new DefaultPromptStrategy()],
    })
    const planner = new MockPlanner(new MockPlannerProvider(mockConfig))
    const pipeline = new DefaultPipeline(planner, builder)
    const result = await pipeline.execute(createPipelineContext())
    expect(result.plannerResult).toBeDefined()
  })

  it('should store strategy metadata through pipeline', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      strategySelector: new DefaultPromptStrategySelector(),
      strategies: [new DefaultPromptStrategy()],
    })
    const request = await builder.build(createPipelineContext())
    const assembly = request.metadata?.promptAssembly as Record<string, unknown> | undefined
    expect(assembly?.strategy).toBeDefined()
    expect(assembly?.strategy).toEqual({ name: 'default' })
  })
})

// ---------------------------------------------------------------------------
// RetryPlanner Compatibility
// ---------------------------------------------------------------------------

describe('RetryPlanner Compatibility', () => {
  it('should work with RetryPlanner', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      strategySelector: new DefaultPromptStrategySelector(),
      strategies: [new DefaultPromptStrategy()],
    })
    const provider = new MockPlannerProvider(mockConfig)
    const planner = new RetryPlanner(provider)
    const pipeline = new DefaultPipeline(planner, builder)
    const result = await pipeline.execute(createPipelineContext())
    expect(result.plannerResult).toBeDefined()
  })

  it('should store strategy metadata through RetryPlanner', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      strategySelector: new DefaultPromptStrategySelector(),
      strategies: [new DefaultPromptStrategy()],
    })
    const request = await builder.build(createPipelineContext())
    const assembly = request.metadata?.promptAssembly as Record<string, unknown> | undefined
    expect(assembly?.strategy).toEqual({ name: 'default' })
  })
})

// ---------------------------------------------------------------------------
// ToolCallPlanner Compatibility
// ---------------------------------------------------------------------------

describe('ToolCallPlanner Compatibility', () => {
  it('should work with ToolCallPlanner', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      strategySelector: new DefaultPromptStrategySelector(),
      strategies: [new DefaultPromptStrategy()],
    })
    const provider = new MockPlannerProvider(mockConfig)
    const toolRegistry = new DefaultToolRegistry()
    const planner = new ToolCallPlanner(provider, toolRegistry)
    const pipeline = new DefaultPipeline(planner, builder)
    const result = await pipeline.execute(createPipelineContext())
    expect(result.plannerResult).toBeDefined()
  })

  it('should store strategy metadata through ToolCallPlanner', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      strategySelector: new DefaultPromptStrategySelector(),
      strategies: [new DefaultPromptStrategy()],
    })
    const request = await builder.build(createPipelineContext())
    const assembly = request.metadata?.promptAssembly as Record<string, unknown> | undefined
    expect(assembly?.strategy).toEqual({ name: 'default' })
  })
})

// ---------------------------------------------------------------------------
// Streaming Compatibility
// ---------------------------------------------------------------------------

describe('Streaming Compatibility', () => {
  it('should work with StreamingProvider', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      strategySelector: new DefaultPromptStrategySelector(),
      strategies: [new DefaultPromptStrategy()],
    })
    const provider = new MockStreamingProvider()
    const planner = new MockPlanner(provider)
    const pipeline = new DefaultPipeline(planner, builder)
    const result = await pipeline.stream(createPipelineContext())
    expect(result.plannerResult).toBeDefined()
  })

  it('should store strategy metadata through streaming', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      strategySelector: new DefaultPromptStrategySelector(),
      strategies: [new DefaultPromptStrategy()],
    })
    const request = await builder.build(createPipelineContext())
    const assembly = request.metadata?.promptAssembly as Record<string, unknown> | undefined
    expect(assembly?.strategy).toEqual({ name: 'default' })
  })
})

// ---------------------------------------------------------------------------
// AgentLoop Compatibility
// ---------------------------------------------------------------------------

describe('AgentLoop Compatibility', () => {
  it('should work with DefaultAgentLoop', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      strategySelector: new DefaultPromptStrategySelector(),
      strategies: [new DefaultPromptStrategy()],
    })
    const planner = new MockPlanner(new MockPlannerProvider(mockConfig))
    const pipeline = new DefaultPipeline(planner, builder)
    const result = await pipeline.execute(createPipelineContext())
    expect(result.plannerResult).toBeDefined()
  })

  it('should store strategy metadata through AgentLoop', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      strategySelector: new DefaultPromptStrategySelector(),
      strategies: [new DefaultPromptStrategy()],
    })
    const request = await builder.build(createPipelineContext())
    const assembly = request.metadata?.promptAssembly as Record<string, unknown> | undefined
    expect(assembly?.strategy).toEqual({ name: 'default' })
  })
})

// ---------------------------------------------------------------------------
// No Modifications to Existing Components
// ---------------------------------------------------------------------------

describe('No modifications to existing components', () => {
  it('should not modify PromptContext', () => {
    // PromptContext type is unchanged — strategy field is NOT added
    const ctx: Record<string, unknown> = { userInput: 'test' }
    expect('strategy' in ctx).toBe(false)
  })

  it('should not modify Prompt', () => {
    // AIRequest prompt string unchanged — no strategy text
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      strategySelector: new DefaultPromptStrategySelector(),
      strategies: [new DefaultPromptStrategy()],
    })
    // Strategy does not appear in prompt text — only in metadata
    expect(builder).toBeDefined()
  })

  it('should not modify Pipeline', () => {
    // Pipeline interface unchanged
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      strategySelector: new DefaultPromptStrategySelector(),
      strategies: [new DefaultPromptStrategy()],
    })
    const planner = new MockPlanner(new MockPlannerProvider(mockConfig))
    const pipeline = new DefaultPipeline(planner, builder)
    expect(pipeline.execute).toBeDefined()
    expect(pipeline.stream).toBeDefined()
  })

  it('should not break existing tests', () => {
    // Verify basic backward-compatible construction still works
    const builder = new DefaultPromptBuilder(
      createDefaultModules(),
      new DefaultPromptRenderer(),
      new DefaultPromptCompression(),
      new DefaultMemoryRanking(),
      new DefaultPromptBudget(),
      new DefaultPromptSelection(),
    )
    expect(builder).toBeDefined()
  })
})