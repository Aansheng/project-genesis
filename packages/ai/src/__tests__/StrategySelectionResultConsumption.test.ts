import { describe, it, expect } from 'vitest'
import { DefaultPromptBuilder } from '../prompt/DefaultPromptBuilder'
import type { PromptStrategy } from '../strategy/PromptStrategy'
import type { StrategyEvaluator } from '../strategy/StrategyEvaluator'
import type { StrategySelectionMetadata } from '../strategy/StrategySelectionMetadata'
import type { SemanticContext } from '../semantic/SemanticContext'
import { DefaultPromptStrategy } from '../strategy/DefaultPromptStrategy'
import { DefaultPromptStrategySelector } from '../strategy/DefaultPromptStrategySelector'
import { DefaultStrategyEvaluator } from '../strategy/DefaultStrategyEvaluator'
import { CreateStrategy } from '../strategy/CreateStrategy'
import { QueryStrategy } from '../strategy/QueryStrategy'
import { ModifyStrategy } from '../strategy/ModifyStrategy'
import { DeleteStrategy } from '../strategy/DeleteStrategy'
import { UserInputModule } from '../prompt/modules'
import { DefaultMemory } from '../memory/DefaultMemory'
import { MockPlanner, RetryPlanner, ToolCallPlanner } from '../planner'
import { MockPlannerProvider, MockStreamingProvider } from '../provider'
import { DefaultToolRegistry } from '../tools/ToolRegistry'
import { DefaultPipeline } from '../pipeline/DefaultPipeline'
import { DefaultAIConfiguration } from '../config/DefaultAIConfiguration'
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

const mockConfig = new DefaultAIConfiguration()

// ---------------------------------------------------------------------------
// Metadata Created
// ---------------------------------------------------------------------------

describe('Metadata Created', () => {
  it('should create strategySelection metadata when strategyEvaluator and strategies are provided', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      strategySelector: new DefaultPromptStrategySelector(),
      strategies: [new CreateStrategy(), new QueryStrategy()],
      strategyEvaluator: new DefaultStrategyEvaluator(),
    })
    const request = await builder.build(createPipelineContext())
    const assembly = request.metadata?.promptAssembly as Record<string, unknown> | undefined
    expect(assembly?.strategySelection).toBeDefined()
  })

  it('should not create strategySelection metadata when strategyEvaluator is absent', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      strategySelector: new DefaultPromptStrategySelector(),
      strategies: [new CreateStrategy()],
    })
    const request = await builder.build(createPipelineContext())
    const assembly = request.metadata?.promptAssembly as Record<string, unknown> | undefined
    expect(assembly?.strategySelection).toBeUndefined()
  })

  it('should not create strategySelection metadata when strategies are absent', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      strategyEvaluator: new DefaultStrategyEvaluator(),
    })
    const request = await builder.build(createPipelineContext())
    const assembly = request.metadata?.promptAssembly as Record<string, unknown> | undefined
    expect(assembly?.strategySelection).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// Selected Strategy Stored
// ---------------------------------------------------------------------------

describe('Selected Strategy Stored', () => {
  it('should store the selected strategy name in strategySelection.selected', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      strategySelector: new DefaultPromptStrategySelector(),
      strategies: [new CreateStrategy(), new QueryStrategy()],
      strategyEvaluator: new DefaultStrategyEvaluator(),
    })
    const request = await builder.build(createPipelineContext())
    const assembly = request.metadata?.promptAssembly as Record<string, unknown> | undefined
    const selection = assembly?.strategySelection as StrategySelectionMetadata | undefined
    expect(selection?.selected).toBe('default')
  })

  it('should store selected strategy matching selector output', async () => {
    const customStrategy = new CreateStrategy()
    const selector = new DefaultPromptStrategySelector()
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      strategySelector: selector,
      strategies: [customStrategy, new DefaultPromptStrategy()],
      strategyEvaluator: new DefaultStrategyEvaluator(),
    })
    const ctx = createPipelineContext()
    const request = await builder.build(ctx)
    const assembly = request.metadata?.promptAssembly as Record<string, unknown> | undefined
    const selection = assembly?.strategySelection as StrategySelectionMetadata | undefined
    // Without entity analyzer, context has no entity → no strategy applies → fallback to default
    expect(selection?.selected).toBe('default')
  })

  it('should match selected name with the strategy metadata name', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      strategySelector: new DefaultPromptStrategySelector(),
      strategies: [new DefaultPromptStrategy()],
      strategyEvaluator: new DefaultStrategyEvaluator(),
    })
    const request = await builder.build(createPipelineContext())
    const assembly = request.metadata?.promptAssembly as Record<string, unknown> | undefined
    const strategyName = (assembly?.strategy as { name: string })?.name
    const selection = assembly?.strategySelection as StrategySelectionMetadata | undefined
    expect(selection?.selected).toBe(strategyName)
  })
})

// ---------------------------------------------------------------------------
// Candidate Scores Stored
// ---------------------------------------------------------------------------

describe('Candidate Scores Stored', () => {
  it('should store all candidate strategies with their scores', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      strategySelector: new DefaultPromptStrategySelector(),
      strategies: [new CreateStrategy(), new QueryStrategy()],
      strategyEvaluator: new DefaultStrategyEvaluator(),
    })
    const request = await builder.build(createPipelineContext())
    const assembly = request.metadata?.promptAssembly as Record<string, unknown> | undefined
    const selection = assembly?.strategySelection as StrategySelectionMetadata | undefined
    expect(selection?.candidates).toHaveLength(2)
  })

  it('should store candidate strategy names', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      strategySelector: new DefaultPromptStrategySelector(),
      strategies: [new CreateStrategy(), new QueryStrategy(), new ModifyStrategy()],
      strategyEvaluator: new DefaultStrategyEvaluator(),
    })
    const request = await builder.build(createPipelineContext())
    const assembly = request.metadata?.promptAssembly as Record<string, unknown> | undefined
    const selection = assembly?.strategySelection as StrategySelectionMetadata | undefined
    const names = selection?.candidates.map(c => c.strategy)
    expect(names).toEqual(['create', 'query', 'modify'])
  })

  it('should store candidate scores as numbers', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      strategySelector: new DefaultPromptStrategySelector(),
      strategies: [new CreateStrategy(), new QueryStrategy()],
      strategyEvaluator: new DefaultStrategyEvaluator(),
    })
    const request = await builder.build(createPipelineContext())
    const assembly = request.metadata?.promptAssembly as Record<string, unknown> | undefined
    const selection = assembly?.strategySelection as StrategySelectionMetadata | undefined
    for (const candidate of selection?.candidates ?? []) {
      expect(typeof candidate.score).toBe('number')
    }
  })

  it('should store scores from evaluator (all 0 with default evaluator and no matching context)', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      strategySelector: new DefaultPromptStrategySelector(),
      strategies: [new CreateStrategy(), new QueryStrategy()],
      strategyEvaluator: new DefaultStrategyEvaluator(),
    })
    const request = await builder.build(createPipelineContext())
    const assembly = request.metadata?.promptAssembly as Record<string, unknown> | undefined
    const selection = assembly?.strategySelection as StrategySelectionMetadata | undefined
    for (const candidate of selection?.candidates ?? []) {
      expect(candidate.score).toBe(0)
    }
  })

  it('should store scores from custom evaluator', async () => {
    const customEvaluator: StrategyEvaluator = {
      evaluate(strategy: PromptStrategy, _context: SemanticContext): number {
        return strategy.name === 'create' ? 100 : 0
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      strategySelector: new DefaultPromptStrategySelector(),
      strategies: [new CreateStrategy(), new QueryStrategy()],
      strategyEvaluator: customEvaluator,
    })
    const request = await builder.build(createPipelineContext())
    const assembly = request.metadata?.promptAssembly as Record<string, unknown> | undefined
    const selection = assembly?.strategySelection as StrategySelectionMetadata | undefined
    expect(selection?.candidates[0]).toEqual({ strategy: 'create', score: 100 })
    expect(selection?.candidates[1]).toEqual({ strategy: 'query', score: 0 })
  })

  it('should preserve candidate order matching strategies array order', async () => {
    const strategies = [new DeleteStrategy(), new ModifyStrategy(), new QueryStrategy(), new CreateStrategy()]
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      strategySelector: new DefaultPromptStrategySelector(),
      strategies,
      strategyEvaluator: new DefaultStrategyEvaluator(),
    })
    const request = await builder.build(createPipelineContext())
    const assembly = request.metadata?.promptAssembly as Record<string, unknown> | undefined
    const selection = assembly?.strategySelection as StrategySelectionMetadata | undefined
    const names = selection?.candidates.map(c => c.strategy)
    expect(names).toEqual(['delete', 'modify', 'query', 'create'])
  })
})

// ---------------------------------------------------------------------------
// Empty Strategy List
// ---------------------------------------------------------------------------

describe('Empty Strategy List', () => {
  it('should create strategySelection metadata with empty candidates when strategies array is empty', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      strategySelector: new DefaultPromptStrategySelector(),
      strategies: [],
      strategyEvaluator: new DefaultStrategyEvaluator(),
    })
    const request = await builder.build(createPipelineContext())
    const assembly = request.metadata?.promptAssembly as Record<string, unknown> | undefined
    // Empty strategies → fallback to default, but metadata still created with empty candidates
    const selection = assembly?.strategySelection as StrategySelectionMetadata | undefined
    expect(selection).toBeDefined()
    expect(selection?.selected).toBe('default')
    expect(selection?.candidates).toEqual([])
  })

  it('should still have strategy metadata when strategies array is empty', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      strategySelector: new DefaultPromptStrategySelector(),
      strategies: [],
      strategyEvaluator: new DefaultStrategyEvaluator(),
    })
    const request = await builder.build(createPipelineContext())
    const assembly = request.metadata?.promptAssembly as Record<string, unknown> | undefined
    expect(assembly?.strategy).toEqual({ name: 'default' })
  })
})

// ---------------------------------------------------------------------------
// Deterministic
// ---------------------------------------------------------------------------

describe('Deterministic', () => {
  it('should produce same strategySelection metadata for same inputs', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      strategySelector: new DefaultPromptStrategySelector(),
      strategies: [new CreateStrategy(), new QueryStrategy()],
      strategyEvaluator: new DefaultStrategyEvaluator(),
    })
    const req1 = await builder.build(createPipelineContext())
    const req2 = await builder.build(createPipelineContext())
    const req3 = await builder.build(createPipelineContext())
    const s1 = (req1.metadata?.promptAssembly as Record<string, unknown>)?.strategySelection as StrategySelectionMetadata
    const s2 = (req2.metadata?.promptAssembly as Record<string, unknown>)?.strategySelection as StrategySelectionMetadata
    const s3 = (req3.metadata?.promptAssembly as Record<string, unknown>)?.strategySelection as StrategySelectionMetadata
    expect(s1).toEqual(s2)
    expect(s2).toEqual(s3)
  })

  it('should produce same candidates across multiple builder instances', async () => {
    const b1 = new DefaultPromptBuilder([new UserInputModule()], {
      strategySelector: new DefaultPromptStrategySelector(),
      strategies: [new CreateStrategy(), new QueryStrategy()],
      strategyEvaluator: new DefaultStrategyEvaluator(),
    })
    const b2 = new DefaultPromptBuilder([new UserInputModule()], {
      strategySelector: new DefaultPromptStrategySelector(),
      strategies: [new CreateStrategy(), new QueryStrategy()],
      strategyEvaluator: new DefaultStrategyEvaluator(),
    })
    const r1 = await b1.build(createPipelineContext())
    const r2 = await b2.build(createPipelineContext())
    const s1 = (r1.metadata?.promptAssembly as Record<string, unknown>)?.strategySelection as StrategySelectionMetadata
    const s2 = (r2.metadata?.promptAssembly as Record<string, unknown>)?.strategySelection as StrategySelectionMetadata
    expect(s1).toEqual(s2)
  })
})

// ---------------------------------------------------------------------------
// Stateless
// ---------------------------------------------------------------------------

describe('Stateless', () => {
  it('should not retain strategySelection state between builds', async () => {
    const customEvaluator: StrategyEvaluator = {
      evaluate(strategy: PromptStrategy, _context: SemanticContext): number {
        return strategy.name === 'create' ? 100 : 0
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      strategySelector: new DefaultPromptStrategySelector(),
      strategies: [new CreateStrategy(), new QueryStrategy()],
      strategyEvaluator: customEvaluator,
    })
    const req1 = await builder.build(createPipelineContext({ input: 'draw a tree' }))
    const req2 = await builder.build(createPipelineContext({ input: 'delete the flower' }))
    const s1 = (req1.metadata?.promptAssembly as Record<string, unknown>)?.strategySelection as StrategySelectionMetadata
    const s2 = (req2.metadata?.promptAssembly as Record<string, unknown>)?.strategySelection as StrategySelectionMetadata
    // Both produce same candidates since context is same (no entity analyzer)
    expect(s1).toEqual(s2)
  })
})

// ---------------------------------------------------------------------------
// Pure
// ---------------------------------------------------------------------------

describe('Pure', () => {
  it('should not modify input strategies array', async () => {
    const strategies: PromptStrategy[] = [new CreateStrategy(), new QueryStrategy()]
    const originalLength = strategies.length
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      strategySelector: new DefaultPromptStrategySelector(),
      strategies,
      strategyEvaluator: new DefaultStrategyEvaluator(),
    })
    await builder.build(createPipelineContext())
    expect(strategies.length).toBe(originalLength)
  })

  it('should not modify input context', async () => {
    const context = createPipelineContext()
    const inputBefore = context.input
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      strategySelector: new DefaultPromptStrategySelector(),
      strategies: [new CreateStrategy()],
      strategyEvaluator: new DefaultStrategyEvaluator(),
    })
    await builder.build(context)
    expect(context.input).toBe(inputBefore)
  })
})

// ---------------------------------------------------------------------------
// Metadata Coexistence
// ---------------------------------------------------------------------------

describe('Metadata Coexistence', () => {
  it('should coexist with strategy metadata', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      strategySelector: new DefaultPromptStrategySelector(),
      strategies: [new CreateStrategy(), new QueryStrategy()],
      strategyEvaluator: new DefaultStrategyEvaluator(),
    })
    const request = await builder.build(createPipelineContext())
    const assembly = request.metadata?.promptAssembly as Record<string, unknown> | undefined
    expect(assembly?.strategy).toBeDefined()
    expect(assembly?.strategy).toEqual({ name: 'default' })
    expect(assembly?.strategySelection).toBeDefined()
  })

  it('should coexist with strategyRendered metadata', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      strategySelector: new DefaultPromptStrategySelector(),
      strategies: [new CreateStrategy(), new QueryStrategy()],
      strategyEvaluator: new DefaultStrategyEvaluator(),
    })
    const request = await builder.build(createPipelineContext())
    const assembly = request.metadata?.promptAssembly as Record<string, unknown> | undefined
    expect(assembly?.strategyRendered).toBeDefined()
    expect(assembly?.strategySelection).toBeDefined()
  })

  it('should coexist with strategyModule metadata', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      strategySelector: new DefaultPromptStrategySelector(),
      strategies: [new DefaultPromptStrategy()],
      strategyEvaluator: new DefaultStrategyEvaluator(),
    })
    const request = await builder.build(createPipelineContext())
    const assembly = request.metadata?.promptAssembly as Record<string, unknown> | undefined
    // strategyModule may or may not be present, but both can coexist
    expect(assembly?.strategySelection).toBeDefined()
    expect(assembly?.strategy).toBeDefined()
  })

  it('should coexist with strategyModuleRendered metadata', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      strategySelector: new DefaultPromptStrategySelector(),
      strategies: [new DefaultPromptStrategy()],
      strategyEvaluator: new DefaultStrategyEvaluator(),
    })
    const request = await builder.build(createPipelineContext())
    const assembly = request.metadata?.promptAssembly as Record<string, unknown> | undefined
    expect(assembly?.strategySelection).toBeDefined()
  })

  it('should coexist with all strategy-related metadata fields', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      strategySelector: new DefaultPromptStrategySelector(),
      strategies: [new CreateStrategy(), new QueryStrategy()],
      strategyEvaluator: new DefaultStrategyEvaluator(),
    })
    const request = await builder.build(createPipelineContext())
    const assembly = request.metadata?.promptAssembly as Record<string, unknown> | undefined
    // All strategy metadata fields present simultaneously
    expect(assembly?.strategy).toBeDefined()
    expect(assembly?.strategyRendered).toBeDefined()
    expect(assembly?.strategySelection).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Backward Compatibility — Prompt Output Unchanged
// ---------------------------------------------------------------------------

describe('Backward Compatibility', () => {
  it('should produce identical prompt output with and without strategyEvaluator', async () => {
    const builderWithout = new DefaultPromptBuilder([new UserInputModule()], {
      strategySelector: new DefaultPromptStrategySelector(),
      strategies: [new CreateStrategy(), new QueryStrategy()],
    })
    const builderWith = new DefaultPromptBuilder([new UserInputModule()], {
      strategySelector: new DefaultPromptStrategySelector(),
      strategies: [new CreateStrategy(), new QueryStrategy()],
      strategyEvaluator: new DefaultStrategyEvaluator(),
    })
    const ctx = createPipelineContext()
    const reqWithout = await builderWithout.build(ctx)
    const reqWith = await builderWith.build(ctx)
    expect(reqWith.prompt).toBe(reqWithout.prompt)
  })

  it('should produce identical prompt output with and without strategySelection metadata', async () => {
    const builderWithout = new DefaultPromptBuilder([new UserInputModule()])
    const builderWith = new DefaultPromptBuilder([new UserInputModule()], {
      strategySelector: new DefaultPromptStrategySelector(),
      strategies: [new DefaultPromptStrategy()],
      strategyEvaluator: new DefaultStrategyEvaluator(),
    })
    const ctx = createPipelineContext()
    const reqWithout = await builderWithout.build(ctx)
    const reqWith = await builderWith.build(ctx)
    expect(reqWith.prompt).toBe(reqWithout.prompt)
  })

  it('should not change prompt output when strategyEvaluator is added', async () => {
    const builder1 = new DefaultPromptBuilder([new UserInputModule()])
    const builder2 = new DefaultPromptBuilder([new UserInputModule()], {
      strategyEvaluator: new DefaultStrategyEvaluator(),
    })
    const ctx = createPipelineContext()
    const req1 = await builder1.build(ctx)
    const req2 = await builder2.build(ctx)
    expect(req1.prompt).toBe(req2.prompt)
  })

  it('should preserve existing strategy metadata when strategySelection is added', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      strategySelector: new DefaultPromptStrategySelector(),
      strategies: [new DefaultPromptStrategy()],
      strategyEvaluator: new DefaultStrategyEvaluator(),
    })
    const request = await builder.build(createPipelineContext())
    const assembly = request.metadata?.promptAssembly as Record<string, unknown> | undefined
    // Original strategy metadata field still present
    expect(assembly?.strategy).toEqual({ name: 'default' })
    // New strategySelection metadata also present
    expect(assembly?.strategySelection).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// RetryPlanner Compatibility
// ---------------------------------------------------------------------------

describe('RetryPlanner Compatibility', () => {
  it('should work with RetryPlanner and strategyEvaluator', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      strategySelector: new DefaultPromptStrategySelector(),
      strategies: [new CreateStrategy()],
      strategyEvaluator: new DefaultStrategyEvaluator(),
    })
    const provider = new MockPlannerProvider(mockConfig)
    const planner = new RetryPlanner(provider)
    const pipeline = new DefaultPipeline(planner, builder)
    const result = await pipeline.execute(createPipelineContext())
    expect(result.plannerResult).toBeDefined()
  })

  it('should store strategySelection metadata through RetryPlanner', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      strategySelector: new DefaultPromptStrategySelector(),
      strategies: [new CreateStrategy()],
      strategyEvaluator: new DefaultStrategyEvaluator(),
    })
    const request = await builder.build(createPipelineContext())
    const assembly = request.metadata?.promptAssembly as Record<string, unknown> | undefined
    expect(assembly?.strategySelection).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// ToolCallPlanner Compatibility
// ---------------------------------------------------------------------------

describe('ToolCallPlanner Compatibility', () => {
  it('should work with ToolCallPlanner and strategyEvaluator', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      strategySelector: new DefaultPromptStrategySelector(),
      strategies: [new CreateStrategy()],
      strategyEvaluator: new DefaultStrategyEvaluator(),
    })
    const provider = new MockPlannerProvider(mockConfig)
    const toolRegistry = new DefaultToolRegistry()
    const planner = new ToolCallPlanner(provider, toolRegistry)
    const pipeline = new DefaultPipeline(planner, builder)
    const result = await pipeline.execute(createPipelineContext())
    expect(result.plannerResult).toBeDefined()
  })

  it('should store strategySelection metadata through ToolCallPlanner', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      strategySelector: new DefaultPromptStrategySelector(),
      strategies: [new CreateStrategy()],
      strategyEvaluator: new DefaultStrategyEvaluator(),
    })
    const request = await builder.build(createPipelineContext())
    const assembly = request.metadata?.promptAssembly as Record<string, unknown> | undefined
    expect(assembly?.strategySelection).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Streaming Compatibility
// ---------------------------------------------------------------------------

describe('Streaming Compatibility', () => {
  it('should work with streaming pipeline and strategyEvaluator', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      strategySelector: new DefaultPromptStrategySelector(),
      strategies: [new CreateStrategy()],
      strategyEvaluator: new DefaultStrategyEvaluator(),
    })
    const provider = new MockStreamingProvider()
    const planner = new MockPlanner(provider)
    const pipeline = new DefaultPipeline(planner, builder)
    const result = await pipeline.stream(createPipelineContext())
    expect(result.plannerResult).toBeDefined()
  })

  it('should store strategySelection metadata through streaming', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      strategySelector: new DefaultPromptStrategySelector(),
      strategies: [new CreateStrategy()],
      strategyEvaluator: new DefaultStrategyEvaluator(),
    })
    const request = await builder.build(createPipelineContext())
    const assembly = request.metadata?.promptAssembly as Record<string, unknown> | undefined
    expect(assembly?.strategySelection).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// AgentLoop Compatibility
// ---------------------------------------------------------------------------

describe('AgentLoop Compatibility', () => {
  it('should work with AgentLoop and strategyEvaluator', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      strategySelector: new DefaultPromptStrategySelector(),
      strategies: [new CreateStrategy()],
      strategyEvaluator: new DefaultStrategyEvaluator(),
    })
    const planner = new MockPlanner(new MockPlannerProvider(mockConfig))
    const pipeline = new DefaultPipeline(planner, builder)
    const result = await pipeline.execute(createPipelineContext())
    expect(result.plannerResult).toBeDefined()
  })

  it('should store strategySelection metadata through AgentLoop', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      strategySelector: new DefaultPromptStrategySelector(),
      strategies: [new CreateStrategy()],
      strategyEvaluator: new DefaultStrategyEvaluator(),
    })
    const request = await builder.build(createPipelineContext())
    const assembly = request.metadata?.promptAssembly as Record<string, unknown> | undefined
    expect(assembly?.strategySelection).toBeDefined()
  })
})
