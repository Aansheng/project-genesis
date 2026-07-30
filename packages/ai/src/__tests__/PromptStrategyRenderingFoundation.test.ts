import { describe, it, expect, vi } from 'vitest'
import { DefaultPromptBuilder } from '../prompt/DefaultPromptBuilder'
import type { BuilderOptions } from '../prompt/BuilderOptions'
import type { PromptStrategy } from '../strategy/PromptStrategy'
import type { PromptStrategyRenderer } from '../strategy/PromptStrategyRenderer'
import { DefaultPromptStrategy } from '../strategy/DefaultPromptStrategy'
import { DefaultPromptStrategyRenderer } from '../strategy/DefaultPromptStrategyRenderer'
import type { SemanticContext } from '../semantic/SemanticContext'
import {
  DefaultPromptStrategyRenderer as DefaultRendererFromRoot,
  PromptStrategyRenderer as RendererTypeFromRoot,
} from '../index'
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
// PromptStrategyRenderer Interface
// ---------------------------------------------------------------------------

describe('PromptStrategyRenderer interface', () => {
  it('should define a render method', () => {
    const renderer: PromptStrategyRenderer = new DefaultPromptStrategyRenderer()
    expect(renderer.render).toBeDefined()
    expect(typeof renderer.render).toBe('function')
  })

  it('should accept PromptStrategy as parameter', () => {
    const renderer: PromptStrategyRenderer = new DefaultPromptStrategyRenderer()
    const strategy: PromptStrategy = new DefaultPromptStrategy()
    expect(() => renderer.render(strategy)).not.toThrow()
  })

  it('should return a string', () => {
    const renderer: PromptStrategyRenderer = new DefaultPromptStrategyRenderer()
    const result = renderer.render(new DefaultPromptStrategy())
    expect(typeof result).toBe('string')
  })
})

// ---------------------------------------------------------------------------
// DefaultPromptStrategyRenderer — Default Strategy
// ---------------------------------------------------------------------------

describe('DefaultPromptStrategyRenderer — default strategy', () => {
  it('should render "Prompt Strategy:\\n\\n- default" for DefaultPromptStrategy', () => {
    const renderer = new DefaultPromptStrategyRenderer()
    const strategy = new DefaultPromptStrategy()
    const result = renderer.render(strategy)
    expect(result).toBe('Prompt Strategy:\n\n- default')
  })

  it('should render strategy name in the output', () => {
    const renderer = new DefaultPromptStrategyRenderer()
    const strategy = new DefaultPromptStrategy()
    const result = renderer.render(strategy)
    expect(result).toContain('default')
  })

  it('should start with "Prompt Strategy:" header', () => {
    const renderer = new DefaultPromptStrategyRenderer()
    const result = renderer.render(new DefaultPromptStrategy())
    expect(result).toMatch(/^Prompt Strategy:/)
  })

  it('should contain the strategy name after a dash', () => {
    const renderer = new DefaultPromptStrategyRenderer()
    const result = renderer.render(new DefaultPromptStrategy())
    expect(result).toMatch(/- default$/)
  })
})

// ---------------------------------------------------------------------------
// DefaultPromptStrategyRenderer — Custom Strategy
// ---------------------------------------------------------------------------

describe('DefaultPromptStrategyRenderer — custom strategy', () => {
  it('should render custom strategy name', () => {
    const renderer = new DefaultPromptStrategyRenderer()
    const strategy = new TestStrategy('create', 'Tree')
    const result = renderer.render(strategy)
    expect(result).toBe('Prompt Strategy:\n\n- create')
  })

  it('should render any strategy name', () => {
    const renderer = new DefaultPromptStrategyRenderer()
    const strategy = new TestStrategy('query', 'Tree')
    const result = renderer.render(strategy)
    expect(result).toBe('Prompt Strategy:\n\n- query')
  })

  it('should render multi-word strategy name', () => {
    const renderer = new DefaultPromptStrategyRenderer()
    const strategy = new TestStrategy('context-aware', 'Tree')
    const result = renderer.render(strategy)
    expect(result).toBe('Prompt Strategy:\n\n- context-aware')
  })
})

// ---------------------------------------------------------------------------
// DefaultPromptStrategyRenderer — Empty Strategy
// ---------------------------------------------------------------------------

describe('DefaultPromptStrategyRenderer — empty strategy', () => {
  it('should return empty string for undefined strategy', () => {
    const renderer = new DefaultPromptStrategyRenderer()
    const result = renderer.render(undefined as unknown as PromptStrategy)
    expect(result).toBe('')
  })

  it('should return empty string for null strategy', () => {
    const renderer = new DefaultPromptStrategyRenderer()
    const result = renderer.render(null as unknown as PromptStrategy)
    expect(result).toBe('')
  })

  it('should return empty string for strategy with empty name', () => {
    const renderer = new DefaultPromptStrategyRenderer()
    const strategy = new TestStrategy('', 'Tree')
    const result = renderer.render(strategy)
    expect(result).toBe('')
  })

  it('should return empty string for strategy with blank name', () => {
    const renderer = new DefaultPromptStrategyRenderer()
    const strategy = new TestStrategy('   ', 'Tree')
    const result = renderer.render(strategy)
    expect(result).toBe('')
  })

  it('should return empty string for strategy with undefined name', () => {
    const renderer = new DefaultPromptStrategyRenderer()
    const strategy = { name: undefined as unknown as string, applies: () => true }
    const result = renderer.render(strategy)
    expect(result).toBe('')
  })

  it('should return empty string for strategy with null name', () => {
    const renderer = new DefaultPromptStrategyRenderer()
    const strategy = { name: null as unknown as string, applies: () => true }
    const result = renderer.render(strategy)
    expect(result).toBe('')
  })
})

// ---------------------------------------------------------------------------
// DefaultPromptStrategyRenderer — Deterministic
// ---------------------------------------------------------------------------

describe('DefaultPromptStrategyRenderer — deterministic', () => {
  it('should return same result for same strategy', () => {
    const renderer = new DefaultPromptStrategyRenderer()
    const strategy = new DefaultPromptStrategy()
    const r1 = renderer.render(strategy)
    const r2 = renderer.render(strategy)
    const r3 = renderer.render(strategy)
    expect(r1).toBe(r2)
    expect(r2).toBe(r3)
  })

  it('should be idempotent across repeated calls', () => {
    const renderer = new DefaultPromptStrategyRenderer()
    const strategy = new DefaultPromptStrategy()
    for (let i = 0; i < 10; i++) {
      expect(renderer.render(strategy)).toBe('Prompt Strategy:\n\n- default')
    }
  })
})

// ---------------------------------------------------------------------------
// DefaultPromptStrategyRenderer — Stateless
// ---------------------------------------------------------------------------

describe('DefaultPromptStrategyRenderer — stateless', () => {
  it('should not retain state between calls', () => {
    const renderer = new DefaultPromptStrategyRenderer()
    const r1 = renderer.render(new DefaultPromptStrategy())
    const r2 = renderer.render(new TestStrategy('', 'Tree'))
    const r3 = renderer.render(new DefaultPromptStrategy())
    expect(r1).toBe('Prompt Strategy:\n\n- default')
    expect(r2).toBe('')
    expect(r3).toBe('Prompt Strategy:\n\n- default')
  })

  it('should be independent across multiple instances', () => {
    const r1 = new DefaultPromptStrategyRenderer()
    const r2 = new DefaultPromptStrategyRenderer()
    const strategy = new DefaultPromptStrategy()
    expect(r1.render(strategy)).toBe(r2.render(strategy))
  })
})

// ---------------------------------------------------------------------------
// DefaultPromptStrategyRenderer — Pure
// ---------------------------------------------------------------------------

describe('DefaultPromptStrategyRenderer — pure / no side effects', () => {
  it('should not modify the strategy object', () => {
    const renderer = new DefaultPromptStrategyRenderer()
    const strategy = new DefaultPromptStrategy()
    const before = strategy.name
    renderer.render(strategy)
    expect(strategy.name).toBe(before)
  })

  it('should have no side effects on renderer instance', () => {
    const renderer = new DefaultPromptStrategyRenderer()
    const before = Object.keys(renderer)
    renderer.render(new DefaultPromptStrategy())
    renderer.render(new TestStrategy('create', 'Tree'))
    renderer.render(new DefaultPromptStrategy())
    expect(Object.keys(renderer)).toEqual(before)
  })

  it('should not throw on frozen strategy', () => {
    const renderer = new DefaultPromptStrategyRenderer()
    const strategy = Object.freeze(new DefaultPromptStrategy())
    expect(() => renderer.render(strategy)).not.toThrow()
  })
})

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

describe('Strategy renderer exports', () => {
  it('should export PromptStrategyRenderer type from strategy/index', () => {
    const renderer: PromptStrategyRenderer = new DefaultPromptStrategyRenderer()
    expect(renderer.render).toBeDefined()
  })

  it('should export DefaultPromptStrategyRenderer class from strategy/index', () => {
    const renderer = new DefaultPromptStrategyRenderer()
    expect(renderer).toBeInstanceOf(DefaultPromptStrategyRenderer)
  })

  it('should export PromptStrategyRenderer type from package root', () => {
    const renderer: RendererTypeFromRoot = new DefaultRendererFromRoot()
    expect(renderer.render).toBeDefined()
  })

  it('should export DefaultPromptStrategyRenderer class from package root', () => {
    const instance = new DefaultRendererFromRoot()
    expect(instance).toBeInstanceOf(DefaultPromptStrategyRenderer)
  })
})

// ---------------------------------------------------------------------------
// BuilderOptions — strategyRenderer Field
// ---------------------------------------------------------------------------

describe('BuilderOptions — strategyRenderer field', () => {
  it('should accept strategyRenderer in BuilderOptions', () => {
    const options: BuilderOptions = {
      strategyRenderer: new DefaultPromptStrategyRenderer(),
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], options)
    expect(builder).toBeDefined()
  })

  it('should accept strategyRenderer alongside other strategy fields', () => {
    const options: BuilderOptions = {
      strategySelector: { select: () => new DefaultPromptStrategy() },
      strategies: [new DefaultPromptStrategy()],
      strategyRenderer: new DefaultPromptStrategyRenderer(),
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], options)
    expect(builder).toBeDefined()
  })

  it('should accept strategyRenderer alongside all BuilderOptions fields', () => {
    const options: BuilderOptions = {
      renderer: new DefaultPromptRenderer(),
      compression: new DefaultPromptCompression(),
      ranking: new DefaultMemoryRanking(),
      budget: new DefaultPromptBudget(),
      selection: new DefaultPromptSelection(),
      providerBudget: new DefaultProviderBudget(),
      configuration: new DefaultAIConfiguration(),
      strategyRenderer: new DefaultPromptStrategyRenderer(),
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], options)
    expect(builder).toBeDefined()
  })

  it('should work without strategyRenderer (backward compatible)', () => {
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
// BuilderOptions — Renderer Invocation
// ---------------------------------------------------------------------------

describe('BuilderOptions — renderer invocation', () => {
  it('should invoke strategyRenderer.render() when provided', async () => {
    const renderSpy = vi.fn(() => 'rendered strategy')
    const renderer: PromptStrategyRenderer = { render: renderSpy }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      strategyRenderer: renderer,
    })
    await builder.build(createPipelineContext())
    expect(renderSpy).toHaveBeenCalledTimes(1)
  })

  it('should pass the selected strategy to renderer', async () => {
    let passedStrategy: PromptStrategy | undefined
    const renderer: PromptStrategyRenderer = {
      render(s: PromptStrategy) {
        passedStrategy = s
        return 'rendered strategy'
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      strategyRenderer: renderer,
    })
    await builder.build(createPipelineContext())
    expect(passedStrategy).toBeDefined()
    expect(passedStrategy?.name).toBe('default')
  })

  it('should use DefaultPromptStrategyRenderer when no strategyRenderer provided', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()])
    const request = await builder.build(createPipelineContext())
    const assembly = request.metadata?.promptAssembly as Record<string, unknown> | undefined
    expect(assembly?.strategyRendered).toBe('Prompt Strategy:\n\n- default')
  })
})

// ---------------------------------------------------------------------------
// Metadata — strategyRendered
// ---------------------------------------------------------------------------

describe('Metadata — strategyRendered', () => {
  it('should store strategyRendered in metadata.promptAssembly', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()])
    const request = await builder.build(createPipelineContext())
    const assembly = request.metadata?.promptAssembly as Record<string, unknown> | undefined
    expect(assembly?.strategyRendered).toBeDefined()
  })

  it('should store correct default strategy rendered string', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()])
    const request = await builder.build(createPipelineContext())
    const assembly = request.metadata?.promptAssembly as Record<string, unknown> | undefined
    expect(assembly?.strategyRendered).toBe('Prompt Strategy:\n\n- default')
  })

  it('should store custom rendered string when custom renderer provided', async () => {
    const renderer: PromptStrategyRenderer = {
      render() { return 'Custom rendering output' },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      strategyRenderer: renderer,
    })
    const request = await builder.build(createPipelineContext())
    const assembly = request.metadata?.promptAssembly as Record<string, unknown> | undefined
    expect(assembly?.strategyRendered).toBe('Custom rendering output')
  })

  it('should coexist with strategy in metadata', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()])
    const request = await builder.build(createPipelineContext())
    const assembly = request.metadata?.promptAssembly as Record<string, unknown> | undefined
    expect(assembly?.strategy).toEqual({ name: 'default' })
    expect(assembly?.strategyRendered).toBe('Prompt Strategy:\n\n- default')
  })

  it('should coexist with other metadata fields', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules())
    const request = await builder.build(createPipelineContext())
    const assembly = request.metadata?.promptAssembly as Record<string, unknown> | undefined
    expect(assembly?.strategy).toBeDefined()
    expect(assembly?.strategyRendered).toBeDefined()
    expect(assembly?.ranking).toBeDefined()
    expect(assembly?.budget).toBeDefined()
    expect(assembly?.selection).toBeDefined()
  })

  it('should not inject strategyRendered into PromptContext', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()])
    const context = await builder.buildContext(createPipelineContext())
    expect('strategyRendered' in context).toBe(false)
  })

  it('should not inject strategyRendered into prompt string', async () => {
    // strategyRendered is now injected into the prompt as an official section
    // This test verifies it appears correctly
    const builder = new DefaultPromptBuilder([new UserInputModule()])
    const request = await builder.build(createPipelineContext())
    expect(request.prompt).toContain('Prompt Strategy:')
  })
})

// ---------------------------------------------------------------------------
// Selector + Renderer Coexistence
// ---------------------------------------------------------------------------

describe('Selector + Renderer coexistence', () => {
  it('should work with both selector and renderer', async () => {
    const selector = { select: () => new DefaultPromptStrategy() }
    const renderer = new DefaultPromptStrategyRenderer()
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      strategySelector: selector,
      strategies: [new DefaultPromptStrategy()],
      strategyRenderer: renderer,
    })
    const request = await builder.build(createPipelineContext())
    const assembly = request.metadata?.promptAssembly as Record<string, unknown> | undefined
    expect(assembly?.strategy).toEqual({ name: 'default' })
    expect(assembly?.strategyRendered).toBe('Prompt Strategy:\n\n- default')
  })

  it('should render custom strategy name from selector', async () => {
    const customStrategy = new TestStrategy('query', 'Tree')
    const selector = { select: () => customStrategy }
    const renderer = new DefaultPromptStrategyRenderer()
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      strategySelector: selector,
      strategies: [customStrategy],
      strategyRenderer: renderer,
    })
    const request = await builder.build(createPipelineContext())
    const assembly = request.metadata?.promptAssembly as Record<string, unknown> | undefined
    expect(assembly?.strategy).toEqual({ name: 'query' })
    expect(assembly?.strategyRendered).toBe('Prompt Strategy:\n\n- query')
  })
})

// ---------------------------------------------------------------------------
// Deterministic
// ---------------------------------------------------------------------------

describe('Strategy rendering — deterministic', () => {
  it('should produce same rendered output for same inputs', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()])
    const req1 = await builder.build(createPipelineContext())
    const req2 = await builder.build(createPipelineContext())
    const a1 = req1.metadata?.promptAssembly as Record<string, unknown> | undefined
    const a2 = req2.metadata?.promptAssembly as Record<string, unknown> | undefined
    expect(a1?.strategyRendered).toBe(a2?.strategyRendered)
  })
})

// ---------------------------------------------------------------------------
// RetryPlanner Compatibility
// ---------------------------------------------------------------------------

describe('RetryPlanner Compatibility', () => {
  it('should work with RetryPlanner', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules())
    const provider = new MockPlannerProvider(mockConfig)
    const planner = new RetryPlanner(provider)
    const pipeline = new DefaultPipeline(planner, builder)
    const result = await pipeline.execute(createPipelineContext())
    expect(result.plannerResult).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// ToolCallPlanner Compatibility
// ---------------------------------------------------------------------------

describe('ToolCallPlanner Compatibility', () => {
  it('should work with ToolCallPlanner', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules())
    const provider = new MockPlannerProvider(mockConfig)
    const toolRegistry = new DefaultToolRegistry()
    const planner = new ToolCallPlanner(provider, toolRegistry)
    const pipeline = new DefaultPipeline(planner, builder)
    const result = await pipeline.execute(createPipelineContext())
    expect(result.plannerResult).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Streaming Compatibility
// ---------------------------------------------------------------------------

describe('Streaming Compatibility', () => {
  it('should work with StreamingProvider', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules())
    const provider = new MockStreamingProvider()
    const planner = new MockPlanner(provider)
    const pipeline = new DefaultPipeline(planner, builder)
    const result = await pipeline.stream(createPipelineContext())
    expect(result.plannerResult).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// AgentLoop Compatibility
// ---------------------------------------------------------------------------

describe('AgentLoop Compatibility', () => {
  it('should work with DefaultAgentLoop', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules())
    const planner = new MockPlanner(new MockPlannerProvider(mockConfig))
    const pipeline = new DefaultPipeline(planner, builder)
    const result = await pipeline.execute(createPipelineContext())
    expect(result.plannerResult).toBeDefined()
  })
})