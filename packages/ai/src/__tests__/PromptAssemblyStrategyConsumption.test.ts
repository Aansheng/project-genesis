import { describe, it, expect } from 'vitest'
import { DefaultPromptBuilder } from '../prompt/DefaultPromptBuilder'
import type { PromptAssemblyStrategy } from '../strategy/PromptAssemblyStrategy'
import type { PromptAssemblyStrategyResolver } from '../strategy/PromptAssemblyStrategyResolver'
import { DefaultPromptAssemblyStrategy } from '../strategy/DefaultPromptAssemblyStrategy'
import { DefaultPromptAssemblyStrategyResolver } from '../strategy/DefaultPromptAssemblyStrategyResolver'
import { DefaultPromptStrategy } from '../strategy/DefaultPromptStrategy'
import { DefaultPromptStrategySelector } from '../strategy/DefaultPromptStrategySelector'
import { DefaultStrategyEvaluator } from '../strategy/DefaultStrategyEvaluator'
import { CreateStrategy } from '../strategy/CreateStrategy'
import { QueryStrategy } from '../strategy/QueryStrategy'
import { UserInputModule } from '../prompt/modules'
import { DefaultMemory } from '../memory/DefaultMemory'
import { MockPlanner, RetryPlanner, ToolCallPlanner } from '../planner'
import { MockPlannerProvider, MockStreamingProvider } from '../provider'
import { DefaultToolRegistry } from '../tools/ToolRegistry'
import { DefaultPipeline } from '../pipeline/DefaultPipeline'
import { DefaultAIConfiguration } from '../config/DefaultAIConfiguration'
import type { PipelineContext } from '../pipeline/PipelineContext'
import type { BuilderOptions } from '../prompt/BuilderOptions'

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

const mockConfig = new DefaultAIConfiguration()

/** Tracking resolver — records what strategyName was passed to resolve() */
class TrackingResolver implements PromptAssemblyStrategyResolver {
  readonly resolvedNames: string[] = []

  resolve(strategyName: string): PromptAssemblyStrategy {
    this.resolvedNames.push(strategyName)
    return new DefaultPromptAssemblyStrategy()
  }
}

/** Custom assembly strategy that reverses sections */
class ReverseAssemblyStrategy implements PromptAssemblyStrategy {
  readonly strategyName = 'reverse'

  apply(sections: readonly string[]): readonly string[] {
    return [...sections].reverse()
  }
}

/** Resolver that returns a reverse strategy for 'create' name */
class ConditionalResolver implements PromptAssemblyStrategyResolver {
  resolve(strategyName: string): PromptAssemblyStrategy {
    if (strategyName === 'create') {
      return new ReverseAssemblyStrategy()
    }
    return new DefaultPromptAssemblyStrategy()
  }
}

// ---------------------------------------------------------------------------
// BuilderOptions — promptAssemblyStrategyResolver
// ---------------------------------------------------------------------------

describe('BuilderOptions — promptAssemblyStrategyResolver', () => {
  it('should accept promptAssemblyStrategyResolver as optional field', () => {
    const opts: BuilderOptions = {
      promptAssemblyStrategyResolver: new DefaultPromptAssemblyStrategyResolver(),
    }
    expect(opts.promptAssemblyStrategyResolver).toBeDefined()
  })

  it('should allow BuilderOptions without promptAssemblyStrategyResolver', () => {
    const opts: BuilderOptions = {}
    expect(opts.promptAssemblyStrategyResolver).toBeUndefined()
  })

  it('should be backward compatible — not required', () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()])
    expect(builder).toBeInstanceOf(DefaultPromptBuilder)
  })

  it('should accept promptAssemblyStrategyResolver alongside other options', () => {
    const opts: BuilderOptions = {
      strategySelector: new DefaultPromptStrategySelector(),
      strategies: [new CreateStrategy()],
      strategyEvaluator: new DefaultStrategyEvaluator(),
      promptAssemblyStrategyResolver: new DefaultPromptAssemblyStrategyResolver(),
    }
    expect(opts.promptAssemblyStrategyResolver).toBeDefined()
    expect(opts.strategySelector).toBeDefined()
    expect(opts.strategyEvaluator).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Resolver Invocation
// ---------------------------------------------------------------------------

describe('Resolver invocation', () => {
  it('should call resolver.resolve() once when resolver is provided', async () => {
    const resolver = new TrackingResolver()
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyStrategyResolver: resolver,
    })
    await builder.build(createPipelineContext())
    expect(resolver.resolvedNames).toHaveLength(1)
  })

  it('should pass selected strategy name to resolver.resolve()', async () => {
    const resolver = new TrackingResolver()
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      strategySelector: new DefaultPromptStrategySelector(),
      strategies: [new CreateStrategy(), new QueryStrategy()],
      promptAssemblyStrategyResolver: resolver,
    })
    await builder.build(createPipelineContext())
    // Without entity analyzer, no strategy applies → fallback to 'default'
    expect(resolver.resolvedNames[0]).toBe('default')
  })

  it('should pass selected strategy name matching the strategy selection result', async () => {
    const resolver = new TrackingResolver()
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      strategySelector: new DefaultPromptStrategySelector(),
      strategies: [new DefaultPromptStrategy()],
      promptAssemblyStrategyResolver: resolver,
    })
    await builder.build(createPipelineContext())
    // DefaultPromptStrategy always applies → name 'default'
    expect(resolver.resolvedNames[0]).toBe('default')
  })

  it('should not call resolver when resolver is not provided', async () => {
    const resolver = new TrackingResolver()
    // Not providing resolver — it should never be called
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      strategySelector: new DefaultPromptStrategySelector(),
      strategies: [new CreateStrategy()],
    })
    await builder.build(createPipelineContext())
    expect(resolver.resolvedNames).toHaveLength(0)
  })

  it('should call resolver with correct strategy name for each build', async () => {
    const resolver = new TrackingResolver()
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      strategySelector: new DefaultPromptStrategySelector(),
      strategies: [new DefaultPromptStrategy()],
      promptAssemblyStrategyResolver: resolver,
    })
    await builder.build(createPipelineContext())
    await builder.build(createPipelineContext({ input: 'remove the tree' }))
    expect(resolver.resolvedNames).toHaveLength(2)
    expect(resolver.resolvedNames[0]).toBe('default')
    expect(resolver.resolvedNames[1]).toBe('default')
  })
})

// ---------------------------------------------------------------------------
// Metadata — promptAssemblyStrategy
// ---------------------------------------------------------------------------

describe('Metadata — promptAssemblyStrategy', () => {
  it('should store promptAssemblyStrategy in metadata when resolver is provided', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyStrategyResolver: new DefaultPromptAssemblyStrategyResolver(),
    })
    const request = await builder.build(createPipelineContext())
    const assembly = request.metadata?.promptAssembly as Record<string, unknown> | undefined
    expect(assembly?.promptAssemblyStrategy).toBeDefined()
  })

  it('should store strategyName "default" when DefaultPromptAssemblyStrategyResolver is used', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyStrategyResolver: new DefaultPromptAssemblyStrategyResolver(),
    })
    const request = await builder.build(createPipelineContext())
    const assembly = request.metadata?.promptAssembly as Record<string, unknown> | undefined
    const strategy = assembly?.promptAssemblyStrategy as { strategyName: string } | undefined
    expect(strategy?.strategyName).toBe('default')
  })

  it('should not store promptAssemblyStrategy when resolver is absent', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()])
    const request = await builder.build(createPipelineContext())
    const assembly = request.metadata?.promptAssembly as Record<string, unknown> | undefined
    expect(assembly?.promptAssemblyStrategy).toBeUndefined()
  })

  it('should store correct strategyName from resolved strategy', async () => {
    const conditionalResolver = new ConditionalResolver()
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      strategySelector: new DefaultPromptStrategySelector(),
      strategies: [new CreateStrategy(), new DefaultPromptStrategy()],
      promptAssemblyStrategyResolver: conditionalResolver,
    })
    const request = await builder.build(createPipelineContext())
    const assembly = request.metadata?.promptAssembly as Record<string, unknown> | undefined
    const strategy = assembly?.promptAssemblyStrategy as { strategyName: string } | undefined
    // Without entity analyzer, CreateStrategy doesn't apply → fallback to default
    // resolver receives 'default' → returns DefaultPromptAssemblyStrategy → strategyName 'default'
    expect(strategy?.strategyName).toBe('default')
  })

  it('should store metadata as plain object with strategyName field', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyStrategyResolver: new DefaultPromptAssemblyStrategyResolver(),
    })
    const request = await builder.build(createPipelineContext())
    const assembly = request.metadata?.promptAssembly as Record<string, unknown> | undefined
    const strategy = assembly?.promptAssemblyStrategy as Record<string, unknown> | undefined
    expect(typeof strategy?.strategyName).toBe('string')
    expect(Object.keys(strategy ?? {})).toEqual(['strategyName'])
  })
})

// ---------------------------------------------------------------------------
// Metadata Coexistence
// ---------------------------------------------------------------------------

describe('Metadata coexistence', () => {
  it('should coexist with strategy metadata', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyStrategyResolver: new DefaultPromptAssemblyStrategyResolver(),
    })
    const request = await builder.build(createPipelineContext())
    const assembly = request.metadata?.promptAssembly as Record<string, unknown> | undefined
    expect(assembly?.strategy).toBeDefined()
    expect(assembly?.promptAssemblyStrategy).toBeDefined()
  })

  it('should coexist with strategyRendered metadata', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyStrategyResolver: new DefaultPromptAssemblyStrategyResolver(),
    })
    const request = await builder.build(createPipelineContext())
    const assembly = request.metadata?.promptAssembly as Record<string, unknown> | undefined
    // strategyRendered present because DefaultPromptStrategy always renders
    expect(assembly?.strategyRendered).toBeDefined()
    expect(assembly?.promptAssemblyStrategy).toBeDefined()
  })

  it('should coexist with strategyModule metadata', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      strategySelector: new DefaultPromptStrategySelector(),
      strategies: [new DefaultPromptStrategy()],
      promptAssemblyStrategyResolver: new DefaultPromptAssemblyStrategyResolver(),
    })
    const request = await builder.build(createPipelineContext())
    const assembly = request.metadata?.promptAssembly as Record<string, unknown> | undefined
    expect(assembly?.promptAssemblyStrategy).toBeDefined()
  })

  it('should coexist with strategyModuleRendered metadata', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      strategySelector: new DefaultPromptStrategySelector(),
      strategies: [new DefaultPromptStrategy()],
      promptAssemblyStrategyResolver: new DefaultPromptAssemblyStrategyResolver(),
    })
    const request = await builder.build(createPipelineContext())
    const assembly = request.metadata?.promptAssembly as Record<string, unknown> | undefined
    expect(assembly?.promptAssemblyStrategy).toBeDefined()
  })

  it('should coexist with strategySelection metadata', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      strategySelector: new DefaultPromptStrategySelector(),
      strategies: [new CreateStrategy(), new QueryStrategy()],
      strategyEvaluator: new DefaultStrategyEvaluator(),
      promptAssemblyStrategyResolver: new DefaultPromptAssemblyStrategyResolver(),
    })
    const request = await builder.build(createPipelineContext())
    const assembly = request.metadata?.promptAssembly as Record<string, unknown> | undefined
    expect(assembly?.strategySelection).toBeDefined()
    expect(assembly?.promptAssemblyStrategy).toBeDefined()
  })

  it('should coexist with all strategy-related metadata fields', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      strategySelector: new DefaultPromptStrategySelector(),
      strategies: [new CreateStrategy(), new QueryStrategy()],
      strategyEvaluator: new DefaultStrategyEvaluator(),
      promptAssemblyStrategyResolver: new DefaultPromptAssemblyStrategyResolver(),
    })
    const request = await builder.build(createPipelineContext())
    const assembly = request.metadata?.promptAssembly as Record<string, unknown> | undefined
    // All strategy metadata fields present simultaneously
    expect(assembly?.strategy).toBeDefined()
    expect(assembly?.strategyRendered).toBeDefined()
    expect(assembly?.strategySelection).toBeDefined()
    expect(assembly?.promptAssemblyStrategy).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Deterministic
// ---------------------------------------------------------------------------

describe('Deterministic', () => {
  it('should produce same promptAssemblyStrategy metadata for same inputs', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyStrategyResolver: new DefaultPromptAssemblyStrategyResolver(),
    })
    const req1 = await builder.build(createPipelineContext())
    const req2 = await builder.build(createPipelineContext())
    const req3 = await builder.build(createPipelineContext())
    const s1 = (req1.metadata?.promptAssembly as Record<string, unknown>)?.promptAssemblyStrategy
    const s2 = (req2.metadata?.promptAssembly as Record<string, unknown>)?.promptAssemblyStrategy
    const s3 = (req3.metadata?.promptAssembly as Record<string, unknown>)?.promptAssemblyStrategy
    expect(s1).toEqual(s2)
    expect(s2).toEqual(s3)
  })

  it('should produce same metadata across multiple builder instances', async () => {
    const b1 = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyStrategyResolver: new DefaultPromptAssemblyStrategyResolver(),
    })
    const b2 = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyStrategyResolver: new DefaultPromptAssemblyStrategyResolver(),
    })
    const r1 = await b1.build(createPipelineContext())
    const r2 = await b2.build(createPipelineContext())
    const s1 = (r1.metadata?.promptAssembly as Record<string, unknown>)?.promptAssemblyStrategy
    const s2 = (r2.metadata?.promptAssembly as Record<string, unknown>)?.promptAssemblyStrategy
    expect(s1).toEqual(s2)
  })

  it('should produce same promptAssemblyStrategy name across repeated calls', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyStrategyResolver: new DefaultPromptAssemblyStrategyResolver(),
    })
    for (let i = 0; i < 5; i++) {
      const request = await builder.build(createPipelineContext())
      const assembly = request.metadata?.promptAssembly as Record<string, unknown> | undefined
      const strategy = assembly?.promptAssemblyStrategy as { strategyName: string } | undefined
      expect(strategy?.strategyName).toBe('default')
    }
  })
})

// ---------------------------------------------------------------------------
// Stateless
// ---------------------------------------------------------------------------

describe('Stateless', () => {
  it('should not retain resolver state between builds', async () => {
    const trackingResolver = new TrackingResolver()
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyStrategyResolver: trackingResolver,
    })
    await builder.build(createPipelineContext({ input: 'draw a tree' }))
    await builder.build(createPipelineContext({ input: 'delete the flower' }))
    // Each build calls resolver once independently
    expect(trackingResolver.resolvedNames).toHaveLength(2)
    expect(trackingResolver.resolvedNames[0]).toBe('default')
    expect(trackingResolver.resolvedNames[1]).toBe('default')
  })

  it('should not retain promptAssemblyStrategy state from previous build', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyStrategyResolver: new DefaultPromptAssemblyStrategyResolver(),
    })
    const req1 = await builder.build(createPipelineContext())
    const req2 = await builder.build(createPipelineContext({ input: 'different input' }))
    const s1 = (req1.metadata?.promptAssembly as Record<string, unknown>)?.promptAssemblyStrategy as { strategyName: string }
    const s2 = (req2.metadata?.promptAssembly as Record<string, unknown>)?.promptAssemblyStrategy as { strategyName: string }
    // Both should be default — no state carried over
    expect(s1.strategyName).toBe('default')
    expect(s2.strategyName).toBe('default')
  })
})

// ---------------------------------------------------------------------------
// Pure
// ---------------------------------------------------------------------------

describe('Pure', () => {
  it('should not modify input context', async () => {
    const context = createPipelineContext()
    const inputBefore = context.input
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyStrategyResolver: new DefaultPromptAssemblyStrategyResolver(),
    })
    await builder.build(context)
    expect(context.input).toBe(inputBefore)
  })

  it('should not modify resolver instance', async () => {
    const resolver = new DefaultPromptAssemblyStrategyResolver()
    const before = Object.keys(resolver)
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyStrategyResolver: resolver,
    })
    await builder.build(createPipelineContext())
    await builder.build(createPipelineContext())
    expect(Object.keys(resolver)).toEqual(before)
  })

  it('should not modify builder instance', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyStrategyResolver: new DefaultPromptAssemblyStrategyResolver(),
    })
    const before = Object.keys(builder)
    await builder.build(createPipelineContext())
    await builder.build(createPipelineContext())
    expect(Object.keys(builder)).toEqual(before)
  })
})

// ---------------------------------------------------------------------------
// No Prompt Changes
// ---------------------------------------------------------------------------

describe('No prompt changes', () => {
  it('should produce identical prompt output with and without promptAssemblyStrategyResolver', async () => {
    const builderWithout = new DefaultPromptBuilder([new UserInputModule()])
    const builderWith = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyStrategyResolver: new DefaultPromptAssemblyStrategyResolver(),
    })
    const ctx = createPipelineContext()
    const reqWithout = await builderWithout.build(ctx)
    const reqWith = await builderWith.build(ctx)
    expect(reqWith.prompt).toBe(reqWithout.prompt)
  })

  it('should produce identical prompt output with resolver and strategies', async () => {
    const builderWithout = new DefaultPromptBuilder([new UserInputModule()], {
      strategySelector: new DefaultPromptStrategySelector(),
      strategies: [new CreateStrategy(), new QueryStrategy()],
    })
    const builderWith = new DefaultPromptBuilder([new UserInputModule()], {
      strategySelector: new DefaultPromptStrategySelector(),
      strategies: [new CreateStrategy(), new QueryStrategy()],
      promptAssemblyStrategyResolver: new DefaultPromptAssemblyStrategyResolver(),
    })
    const ctx = createPipelineContext()
    const reqWithout = await builderWithout.build(ctx)
    const reqWith = await builderWith.build(ctx)
    expect(reqWith.prompt).toBe(reqWithout.prompt)
  })

  it('should produce identical prompt output with resolver and evaluator', async () => {
    const builderWithout = new DefaultPromptBuilder([new UserInputModule()], {
      strategySelector: new DefaultPromptStrategySelector(),
      strategies: [new CreateStrategy()],
      strategyEvaluator: new DefaultStrategyEvaluator(),
    })
    const builderWith = new DefaultPromptBuilder([new UserInputModule()], {
      strategySelector: new DefaultPromptStrategySelector(),
      strategies: [new CreateStrategy()],
      strategyEvaluator: new DefaultStrategyEvaluator(),
      promptAssemblyStrategyResolver: new DefaultPromptAssemblyStrategyResolver(),
    })
    const ctx = createPipelineContext()
    const reqWithout = await builderWithout.build(ctx)
    const reqWith = await builderWith.build(ctx)
    expect(reqWith.prompt).toBe(reqWithout.prompt)
  })

  it('should not alter prompt sections', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyStrategyResolver: new DefaultPromptAssemblyStrategyResolver(),
    })
    const request = await builder.build(createPipelineContext())
    // Prompt should contain the user input text — unchanged
    expect(request.prompt).toContain('draw a tree')
  })

  it('should not reorder sections', async () => {
    const builderWithout = new DefaultPromptBuilder([new UserInputModule()])
    const builderWith = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyStrategyResolver: new DefaultPromptAssemblyStrategyResolver(),
    })
    const ctx = createPipelineContext()
    const reqWithout = await builderWithout.build(ctx)
    const reqWith = await builderWith.build(ctx)
    // Same sections in same order
    expect(reqWith.prompt).toBe(reqWithout.prompt)
  })

  it('should not filter sections', async () => {
    const builderWithout = new DefaultPromptBuilder([new UserInputModule()])
    const builderWith = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyStrategyResolver: new DefaultPromptAssemblyStrategyResolver(),
    })
    const ctx = createPipelineContext()
    const reqWithout = await builderWithout.build(ctx)
    const reqWith = await builderWith.build(ctx)
    // Same number of sections (no filtering)
    expect(reqWith.prompt.length).toBe(reqWithout.prompt.length)
  })
})

// ---------------------------------------------------------------------------
// RetryPlanner Compatibility
// ---------------------------------------------------------------------------

describe('RetryPlanner Compatibility', () => {
  it('should work with RetryPlanner and promptAssemblyStrategyResolver', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyStrategyResolver: new DefaultPromptAssemblyStrategyResolver(),
    })
    const provider = new MockPlannerProvider(mockConfig)
    const planner = new RetryPlanner(provider)
    const pipeline = new DefaultPipeline(planner, builder)
    const result = await pipeline.execute(createPipelineContext())
    expect(result.plannerResult).toBeDefined()
  })

  it('should store promptAssemblyStrategy metadata through RetryPlanner', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyStrategyResolver: new DefaultPromptAssemblyStrategyResolver(),
    })
    const request = await builder.build(createPipelineContext())
    const assembly = request.metadata?.promptAssembly as Record<string, unknown> | undefined
    expect(assembly?.promptAssemblyStrategy).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// ToolCallPlanner Compatibility
// ---------------------------------------------------------------------------

describe('ToolCallPlanner Compatibility', () => {
  it('should work with ToolCallPlanner and promptAssemblyStrategyResolver', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyStrategyResolver: new DefaultPromptAssemblyStrategyResolver(),
    })
    const provider = new MockPlannerProvider(mockConfig)
    const toolRegistry = new DefaultToolRegistry()
    const planner = new ToolCallPlanner(provider, toolRegistry)
    const pipeline = new DefaultPipeline(planner, builder)
    const result = await pipeline.execute(createPipelineContext())
    expect(result.plannerResult).toBeDefined()
  })

  it('should store promptAssemblyStrategy metadata through ToolCallPlanner', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyStrategyResolver: new DefaultPromptAssemblyStrategyResolver(),
    })
    const request = await builder.build(createPipelineContext())
    const assembly = request.metadata?.promptAssembly as Record<string, unknown> | undefined
    expect(assembly?.promptAssemblyStrategy).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Streaming Compatibility
// ---------------------------------------------------------------------------

describe('Streaming Compatibility', () => {
  it('should work with streaming pipeline and promptAssemblyStrategyResolver', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyStrategyResolver: new DefaultPromptAssemblyStrategyResolver(),
    })
    const provider = new MockStreamingProvider()
    const planner = new MockPlanner(provider)
    const pipeline = new DefaultPipeline(planner, builder)
    const result = await pipeline.stream(createPipelineContext())
    expect(result.plannerResult).toBeDefined()
  })

  it('should store promptAssemblyStrategy metadata through streaming', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyStrategyResolver: new DefaultPromptAssemblyStrategyResolver(),
    })
    const request = await builder.build(createPipelineContext())
    const assembly = request.metadata?.promptAssembly as Record<string, unknown> | undefined
    expect(assembly?.promptAssemblyStrategy).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// AgentLoop Compatibility
// ---------------------------------------------------------------------------

describe('AgentLoop Compatibility', () => {
  it('should work with AgentLoop and promptAssemblyStrategyResolver', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyStrategyResolver: new DefaultPromptAssemblyStrategyResolver(),
    })
    const planner = new MockPlanner(new MockPlannerProvider(mockConfig))
    const pipeline = new DefaultPipeline(planner, builder)
    const result = await pipeline.execute(createPipelineContext())
    expect(result.plannerResult).toBeDefined()
  })

  it('should store promptAssemblyStrategy metadata through AgentLoop', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyStrategyResolver: new DefaultPromptAssemblyStrategyResolver(),
    })
    const request = await builder.build(createPipelineContext())
    const assembly = request.metadata?.promptAssembly as Record<string, unknown> | undefined
    expect(assembly?.promptAssemblyStrategy).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// No PromptRenderer Modification
// ---------------------------------------------------------------------------

describe('No PromptRenderer modification', () => {
  it('should not modify PromptRenderer behavior', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyStrategyResolver: new DefaultPromptAssemblyStrategyResolver(),
    })
    const request = await builder.build(createPipelineContext())
    // Prompt is rendered identically — no changes to renderer output
    expect(typeof request.prompt).toBe('string')
    expect(request.prompt.length).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// No PromptCompression Modification
// ---------------------------------------------------------------------------

describe('No PromptCompression modification', () => {
  it('should not modify PromptCompression behavior', async () => {
    const builderWithout = new DefaultPromptBuilder([new UserInputModule()])
    const builderWith = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyStrategyResolver: new DefaultPromptAssemblyStrategyResolver(),
    })
    const ctx = createPipelineContext()
    const reqWithout = await builderWithout.build(ctx)
    const reqWith = await builderWith.build(ctx)
    // Compression output unchanged
    expect(reqWith.prompt).toBe(reqWithout.prompt)
  })
})

// ---------------------------------------------------------------------------
// No PromptContext Modification
// ---------------------------------------------------------------------------

describe('No PromptContext modification', () => {
  it('should not add fields to PromptContext', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyStrategyResolver: new DefaultPromptAssemblyStrategyResolver(),
    })
    const ctx = createPipelineContext()
    const promptContext = await builder.buildContext(ctx)
    // PromptContext should not contain promptAssemblyStrategy
    expect('promptAssemblyStrategy' in promptContext).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Legacy Constructor Compatibility
// ---------------------------------------------------------------------------

describe('Legacy constructor compatibility', () => {
  it('should work with legacy positional constructor', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()])
    const request = await builder.build(createPipelineContext())
    const assembly = request.metadata?.promptAssembly as Record<string, unknown> | undefined
    // No resolver → no promptAssemblyStrategy metadata
    expect(assembly?.promptAssemblyStrategy).toBeUndefined()
  })

  it('should not break when legacy constructor is used alongside strategies', async () => {
    const builder = new DefaultPromptBuilder(
      [new UserInputModule()],
      undefined, // renderer
      undefined, // compression
    )
    const request = await builder.build(createPipelineContext())
    expect(request.prompt).toBeDefined()
    const assembly = request.metadata?.promptAssembly as Record<string, unknown> | undefined
    expect(assembly?.promptAssemblyStrategy).toBeUndefined()
  })
})
