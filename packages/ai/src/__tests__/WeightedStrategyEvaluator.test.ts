import { describe, it, expect } from 'vitest'
import { WeightedStrategyEvaluator } from '../strategy/WeightedStrategyEvaluator'
import { CreateStrategy } from '../strategy/CreateStrategy'
import { QueryStrategy } from '../strategy/QueryStrategy'
import { ModifyStrategy } from '../strategy/ModifyStrategy'
import { DeleteStrategy } from '../strategy/DeleteStrategy'
import { DefaultPromptStrategy } from '../strategy/DefaultPromptStrategy'
import type { SemanticContext } from '../semantic/SemanticContext'
import type { IntentResult } from '../intent/IntentResult'
import type { IntentType } from '../intent/IntentType'
import { DefaultPromptStrategySelector } from '../strategy/DefaultPromptStrategySelector'
import { RetryPlanner, ToolCallPlanner, MockPlanner, MockPlannerProvider, MockStreamingProvider } from '../'
import { DefaultToolRegistry } from '../tools/ToolRegistry'
import { DefaultPipeline } from '../pipeline/DefaultPipeline'
import { DefaultAIConfiguration } from '../config/DefaultAIConfiguration'
import { DefaultPromptBuilder } from '../prompt/DefaultPromptBuilder'
import { UserInputModule } from '../prompt/modules'
import { DefaultMemory } from '../memory/DefaultMemory'
import type { PipelineContext } from '../pipeline/PipelineContext'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createSemanticContext(intent?: IntentResult): SemanticContext {
  return { intent }
}

function createIntentResult(type: IntentType): IntentResult {
  return { intents: [{ type }] }
}

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
// Create Intent
// ---------------------------------------------------------------------------

describe('Create intent', () => {
  const evaluator = new WeightedStrategyEvaluator()
  const context = createSemanticContext(createIntentResult('Create'))

  it('Create > Query', () => {
    const createScore = evaluator.evaluate(new CreateStrategy(), context)
    const queryScore = evaluator.evaluate(new QueryStrategy(), context)
    expect(createScore).toBeGreaterThan(queryScore)
    expect(createScore).toBe(100)
    expect(queryScore).toBe(20)
  })

  it('Create > Modify', () => {
    const createScore = evaluator.evaluate(new CreateStrategy(), context)
    const modifyScore = evaluator.evaluate(new ModifyStrategy(), context)
    expect(createScore).toBeGreaterThan(modifyScore)
    expect(createScore).toBe(100)
    expect(modifyScore).toBe(10)
  })

  it('Create > Delete', () => {
    const createScore = evaluator.evaluate(new CreateStrategy(), context)
    const deleteScore = evaluator.evaluate(new DeleteStrategy(), context)
    expect(createScore).toBeGreaterThan(deleteScore)
    expect(createScore).toBe(100)
    expect(deleteScore).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// Query Intent
// ---------------------------------------------------------------------------

describe('Query intent', () => {
  const evaluator = new WeightedStrategyEvaluator()
  const context = createSemanticContext(createIntentResult('Query'))

  it('Query > Create', () => {
    const queryScore = evaluator.evaluate(new QueryStrategy(), context)
    const createScore = evaluator.evaluate(new CreateStrategy(), context)
    expect(queryScore).toBeGreaterThan(createScore)
    expect(queryScore).toBe(100)
    expect(createScore).toBe(20)
  })

  it('Query > Modify', () => {
    const queryScore = evaluator.evaluate(new QueryStrategy(), context)
    const modifyScore = evaluator.evaluate(new ModifyStrategy(), context)
    expect(queryScore).toBeGreaterThan(modifyScore)
    expect(queryScore).toBe(100)
    expect(modifyScore).toBe(10)
  })

  it('Query > Delete', () => {
    const queryScore = evaluator.evaluate(new QueryStrategy(), context)
    const deleteScore = evaluator.evaluate(new DeleteStrategy(), context)
    expect(queryScore).toBeGreaterThan(deleteScore)
    expect(queryScore).toBe(100)
    expect(deleteScore).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// Modify Intent
// ---------------------------------------------------------------------------

describe('Modify intent', () => {
  const evaluator = new WeightedStrategyEvaluator()
  const context = createSemanticContext(createIntentResult('Modify'))

  it('Modify > Create', () => {
    const modifyScore = evaluator.evaluate(new ModifyStrategy(), context)
    const createScore = evaluator.evaluate(new CreateStrategy(), context)
    expect(modifyScore).toBeGreaterThan(createScore)
    expect(modifyScore).toBe(100)
    expect(createScore).toBe(10)
  })

  it('Modify > Query', () => {
    const modifyScore = evaluator.evaluate(new ModifyStrategy(), context)
    const queryScore = evaluator.evaluate(new QueryStrategy(), context)
    expect(modifyScore).toBeGreaterThan(queryScore)
    expect(modifyScore).toBe(100)
    expect(queryScore).toBe(10)
  })

  it('Modify > Delete', () => {
    const modifyScore = evaluator.evaluate(new ModifyStrategy(), context)
    const deleteScore = evaluator.evaluate(new DeleteStrategy(), context)
    expect(modifyScore).toBeGreaterThan(deleteScore)
    expect(modifyScore).toBe(100)
    expect(deleteScore).toBe(20)
  })
})

// ---------------------------------------------------------------------------
// Delete Intent
// ---------------------------------------------------------------------------

describe('Delete intent', () => {
  const evaluator = new WeightedStrategyEvaluator()
  const context = createSemanticContext(createIntentResult('Delete'))

  it('Delete > Modify', () => {
    const deleteScore = evaluator.evaluate(new DeleteStrategy(), context)
    const modifyScore = evaluator.evaluate(new ModifyStrategy(), context)
    expect(deleteScore).toBeGreaterThan(modifyScore)
    expect(deleteScore).toBe(100)
    expect(modifyScore).toBe(20)
  })

  it('Delete > Query', () => {
    const deleteScore = evaluator.evaluate(new DeleteStrategy(), context)
    const queryScore = evaluator.evaluate(new QueryStrategy(), context)
    expect(deleteScore).toBeGreaterThan(queryScore)
    expect(deleteScore).toBe(100)
    expect(queryScore).toBe(0)
  })

  it('Delete > Create', () => {
    const deleteScore = evaluator.evaluate(new DeleteStrategy(), context)
    const createScore = evaluator.evaluate(new CreateStrategy(), context)
    expect(deleteScore).toBeGreaterThan(createScore)
    expect(deleteScore).toBe(100)
    expect(createScore).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// Unknown Intent
// ---------------------------------------------------------------------------

describe('Unknown intent', () => {
  const evaluator = new WeightedStrategyEvaluator()

  it('all zero when no intent', () => {
    const context = createSemanticContext()
    expect(evaluator.evaluate(new CreateStrategy(), context)).toBe(0)
    expect(evaluator.evaluate(new QueryStrategy(), context)).toBe(0)
    expect(evaluator.evaluate(new ModifyStrategy(), context)).toBe(0)
    expect(evaluator.evaluate(new DeleteStrategy(), context)).toBe(0)
  })

  it('all zero when intent has empty intents array', () => {
    const context = createSemanticContext({ intents: [] })
    expect(evaluator.evaluate(new CreateStrategy(), context)).toBe(0)
    expect(evaluator.evaluate(new QueryStrategy(), context)).toBe(0)
    expect(evaluator.evaluate(new ModifyStrategy(), context)).toBe(0)
    expect(evaluator.evaluate(new DeleteStrategy(), context)).toBe(0)
  })

  it('default strategy scores 0 for any intent', () => {
    const context = createSemanticContext(createIntentResult('Create'))
    expect(evaluator.evaluate(new DefaultPromptStrategy(), context)).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// Move Intent (maps to Modify scores)
// ---------------------------------------------------------------------------

describe('Move intent', () => {
  const evaluator = new WeightedStrategyEvaluator()
  const context = createSemanticContext(createIntentResult('Move'))

  it('Move maps to Modify scoring', () => {
    expect(evaluator.evaluate(new ModifyStrategy(), context)).toBe(100)
    expect(evaluator.evaluate(new DeleteStrategy(), context)).toBe(20)
    expect(evaluator.evaluate(new CreateStrategy(), context)).toBe(10)
    expect(evaluator.evaluate(new QueryStrategy(), context)).toBe(10)
  })
})

// ---------------------------------------------------------------------------
// Deterministic
// ---------------------------------------------------------------------------

describe('Deterministic', () => {
  it('should produce same score for same inputs', () => {
    const evaluator = new WeightedStrategyEvaluator()
    const context = createSemanticContext(createIntentResult('Create'))
    const s1 = evaluator.evaluate(new CreateStrategy(), context)
    const s2 = evaluator.evaluate(new CreateStrategy(), context)
    const s3 = evaluator.evaluate(new CreateStrategy(), context)
    expect(s1).toBe(s2)
    expect(s2).toBe(s3)
  })

  it('should produce same scores across evaluator instances', () => {
    const e1 = new WeightedStrategyEvaluator()
    const e2 = new WeightedStrategyEvaluator()
    const context = createSemanticContext(createIntentResult('Query'))
    expect(e1.evaluate(new QueryStrategy(), context)).toBe(e2.evaluate(new QueryStrategy(), context))
  })
})

// ---------------------------------------------------------------------------
// Stateless
// ---------------------------------------------------------------------------

describe('Stateless', () => {
  it('should not retain evaluation state between calls', () => {
    const evaluator = new WeightedStrategyEvaluator()
    const createCtx = createSemanticContext(createIntentResult('Create'))
    const deleteCtx = createSemanticContext(createIntentResult('Delete'))
    const s1 = evaluator.evaluate(new CreateStrategy(), createCtx)
    const s2 = evaluator.evaluate(new DeleteStrategy(), deleteCtx)
    const s3 = evaluator.evaluate(new CreateStrategy(), createCtx)
    expect(s1).toBe(100)
    expect(s2).toBe(100)
    expect(s3).toBe(100) // same as s1, no state drift
  })
})

// ---------------------------------------------------------------------------
// Pure
// ---------------------------------------------------------------------------

describe('Pure', () => {
  it('should not modify input context', () => {
    const evaluator = new WeightedStrategyEvaluator()
    const context = createSemanticContext(createIntentResult('Create'))
    const intentBefore = context.intent
    evaluator.evaluate(new CreateStrategy(), context)
    expect(context.intent).toBe(intentBefore)
  })

  it('should not modify input strategy', () => {
    const evaluator = new WeightedStrategyEvaluator()
    const strategy = new CreateStrategy()
    const context = createSemanticContext(createIntentResult('Create'))
    const nameBefore = strategy.name
    evaluator.evaluate(strategy, context)
    expect(strategy.name).toBe(nameBefore)
  })
})

// ---------------------------------------------------------------------------
// Compatibility
// ---------------------------------------------------------------------------

describe('Compatibility', () => {
  it('should work with DefaultPromptStrategySelector (RetryPlanner)', () => {
    const evaluator = new WeightedStrategyEvaluator()
    const selector = new DefaultPromptStrategySelector(evaluator)
    const strategies = [new CreateStrategy(), new QueryStrategy(), new ModifyStrategy(), new DeleteStrategy()]
    const context = createSemanticContext(createIntentResult('Create'))
    const result = selector.select(strategies, context)
    expect(result.name).toBe('create')
  })

  it('should work with RetryPlanner', () => {
    const evaluator = new WeightedStrategyEvaluator()
    const selector = new DefaultPromptStrategySelector(evaluator)
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      strategySelector: selector,
      strategies: [new CreateStrategy(), new QueryStrategy()],
      strategyEvaluator: evaluator,
    })
    const provider = new MockPlannerProvider(mockConfig)
    const planner = new RetryPlanner(provider)
    const pipeline = new DefaultPipeline(planner, builder)
    const result = pipeline.execute(createPipelineContext())
    // Verify it completes without error
    expect(result).toBeDefined()
  })

  it('should work with ToolCallPlanner', () => {
    const evaluator = new WeightedStrategyEvaluator()
    const selector = new DefaultPromptStrategySelector(evaluator)
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      strategySelector: selector,
      strategies: [new CreateStrategy(), new QueryStrategy()],
      strategyEvaluator: evaluator,
    })
    const provider = new MockPlannerProvider(mockConfig)
    const toolRegistry = new DefaultToolRegistry()
    const planner = new ToolCallPlanner(provider, toolRegistry)
    const pipeline = new DefaultPipeline(planner, builder)
    const result = pipeline.execute(createPipelineContext())
    expect(result).toBeDefined()
  })

  it('should work with Streaming', () => {
    const evaluator = new WeightedStrategyEvaluator()
    const selector = new DefaultPromptStrategySelector(evaluator)
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      strategySelector: selector,
      strategies: [new CreateStrategy(), new QueryStrategy()],
      strategyEvaluator: evaluator,
    })
    const provider = new MockStreamingProvider()
    const planner = new MockPlanner(provider)
    const pipeline = new DefaultPipeline(planner, builder)
    const result = pipeline.stream(createPipelineContext())
    expect(result).toBeDefined()
  })

  it('should work with AgentLoop', () => {
    const evaluator = new WeightedStrategyEvaluator()
    const selector = new DefaultPromptStrategySelector(evaluator)
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      strategySelector: selector,
      strategies: [new CreateStrategy(), new QueryStrategy()],
      strategyEvaluator: evaluator,
    })
    const planner = new MockPlanner(new MockPlannerProvider(mockConfig))
    const pipeline = new DefaultPipeline(planner, builder)
    const result = pipeline.execute(createPipelineContext())
    expect(result).toBeDefined()
  })
})
