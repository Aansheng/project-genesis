import { describe, it, expect } from 'vitest'
import { DefaultPromptStrategySelector } from '../strategy/DefaultPromptStrategySelector'
import { DefaultStrategyEvaluator } from '../strategy/DefaultStrategyEvaluator'
import { CreateStrategy } from '../strategy/CreateStrategy'
import { QueryStrategy } from '../strategy/QueryStrategy'
import { ModifyStrategy } from '../strategy/ModifyStrategy'
import { DeleteStrategy } from '../strategy/DeleteStrategy'
import { DefaultPromptStrategy } from '../strategy/DefaultPromptStrategy'
import type { PromptStrategy } from '../strategy/PromptStrategy'
import type { StrategyEvaluator } from '../strategy/StrategyEvaluator'
import type { SemanticContext } from '../semantic/SemanticContext'
import type { IntentResult } from '../intent/IntentResult'
import type { IntentType } from '../intent/IntentType'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createSemanticContext(intent?: IntentResult): SemanticContext {
  return { intent }
}

function createIntentResult(type: IntentType): IntentResult {
  return { intents: [{ type }] }
}

// ---------------------------------------------------------------------------
// Highest Score Wins
// ---------------------------------------------------------------------------

describe('Highest score wins', () => {
  it('Create=100 Query=0 → selects Create', () => {
    const selector = new DefaultPromptStrategySelector()
    const strategies = [new CreateStrategy(), new QueryStrategy()]
    const context = createSemanticContext(createIntentResult('Create'))
    const result = selector.select(strategies, context)
    expect(result.name).toBe('create')
  })

  it('Query=100 Create=0 → selects Query', () => {
    const selector = new DefaultPromptStrategySelector()
    const strategies = [new CreateStrategy(), new QueryStrategy()]
    const context = createSemanticContext(createIntentResult('Query'))
    const result = selector.select(strategies, context)
    expect(result.name).toBe('query')
  })

  it('Delete=100 others=0 → selects Delete', () => {
    const selector = new DefaultPromptStrategySelector()
    const strategies = [new CreateStrategy(), new QueryStrategy(), new ModifyStrategy(), new DeleteStrategy()]
    const context = createSemanticContext(createIntentResult('Delete'))
    const result = selector.select(strategies, context)
    expect(result.name).toBe('delete')
  })

  it('Modify=100 others=0 → selects Modify', () => {
    const selector = new DefaultPromptStrategySelector()
    const strategies = [new CreateStrategy(), new QueryStrategy(), new ModifyStrategy(), new DeleteStrategy()]
    const context = createSemanticContext(createIntentResult('Modify'))
    const result = selector.select(strategies, context)
    expect(result.name).toBe('modify')
  })
})

// ---------------------------------------------------------------------------
// Tie Breaking (array order)
// ---------------------------------------------------------------------------

describe('Tie breaking — first occurrence wins', () => {
  it('Create=100 Query=100 (Create first) → Create wins', () => {
    // Custom evaluator that always returns 100
    const alwaysHigh: StrategyEvaluator = {
      evaluate(_strategy: PromptStrategy, _context: SemanticContext): number {
        return 100
      },
    }
    const selector = new DefaultPromptStrategySelector(alwaysHigh)
    const strategies = [new CreateStrategy(), new QueryStrategy()]
    const context = createSemanticContext(createIntentResult('Create'))
    const result = selector.select(strategies, context)
    expect(result.name).toBe('create')
  })

  it('Query=100 Create=100 (Query first) → Query wins', () => {
    const alwaysHigh: StrategyEvaluator = {
      evaluate(): number { return 100 },
    }
    const selector = new DefaultPromptStrategySelector(alwaysHigh)
    const strategies = [new QueryStrategy(), new CreateStrategy()]
    const context = createSemanticContext(createIntentResult('Create'))
    const result = selector.select(strategies, context)
    expect(result.name).toBe('query')
  })

  it('All tied at 50 → first wins', () => {
    const alwaysFifty: StrategyEvaluator = {
      evaluate(): number { return 50 },
    }
    const selector = new DefaultPromptStrategySelector(alwaysFifty)
    const strategies = [new ModifyStrategy(), new DeleteStrategy(), new QueryStrategy()]
    const context = createSemanticContext()
    const result = selector.select(strategies, context)
    expect(result.name).toBe('modify')
  })
})

// ---------------------------------------------------------------------------
// All Zero
// ---------------------------------------------------------------------------

describe('All zero → default fallback', () => {
  it('all strategies score 0 → returns DefaultPromptStrategy', () => {
    const selector = new DefaultPromptStrategySelector()
    const strategies = [new CreateStrategy(), new QueryStrategy(), new ModifyStrategy(), new DeleteStrategy()]
    const context = createSemanticContext() // no intent
    const result = selector.select(strategies, context)
    expect(result.name).toBe('default')
  })

  it('empty strategies array → returns DefaultPromptStrategy', () => {
    const selector = new DefaultPromptStrategySelector()
    const result = selector.select([], createSemanticContext(createIntentResult('Create')))
    expect(result.name).toBe('default')
  })

  it('custom evaluator returning all zeros → returns DefaultPromptStrategy', () => {
    const alwaysZero: StrategyEvaluator = {
      evaluate(): number { return 0 },
    }
    const selector = new DefaultPromptStrategySelector(alwaysZero)
    const strategies = [new CreateStrategy(), new QueryStrategy()]
    const result = selector.select(strategies, createSemanticContext(createIntentResult('Create')))
    expect(result.name).toBe('default')
  })
})

// ---------------------------------------------------------------------------
// Deterministic
// ---------------------------------------------------------------------------

describe('Deterministic', () => {
  it('should produce same result for same inputs', () => {
    const selector = new DefaultPromptStrategySelector()
    const strategies = [new CreateStrategy(), new QueryStrategy(), new ModifyStrategy(), new DeleteStrategy()]
    const context = createSemanticContext(createIntentResult('Create'))
    const r1 = selector.select(strategies, context)
    const r2 = selector.select(strategies, context)
    const r3 = selector.select(strategies, context)
    expect(r1.name).toBe(r2.name)
    expect(r2.name).toBe(r3.name)
  })

  it('should produce same result across selector instances', () => {
    const s1 = new DefaultPromptStrategySelector()
    const s2 = new DefaultPromptStrategySelector()
    const strategies = [new CreateStrategy(), new QueryStrategy()]
    const context = createSemanticContext(createIntentResult('Query'))
    expect(s1.select(strategies, context).name).toBe(s2.select(strategies, context).name)
  })
})

// ---------------------------------------------------------------------------
// Stateless
// ---------------------------------------------------------------------------

describe('Stateless', () => {
  it('should not retain selection state between calls', () => {
    const selector = new DefaultPromptStrategySelector()
    const strategies = [new CreateStrategy(), new QueryStrategy(), new DeleteStrategy()]
    const r1 = selector.select(strategies, createSemanticContext(createIntentResult('Create')))
    const r2 = selector.select(strategies, createSemanticContext(createIntentResult('Query')))
    const r3 = selector.select(strategies, createSemanticContext(createIntentResult('Delete')))
    expect(r1.name).toBe('create')
    expect(r2.name).toBe('query')
    expect(r3.name).toBe('delete')
  })
})

// ---------------------------------------------------------------------------
// Pure
// ---------------------------------------------------------------------------

describe('Pure', () => {
  it('should not modify input strategies array', () => {
    const selector = new DefaultPromptStrategySelector()
    const strategies: PromptStrategy[] = [new CreateStrategy(), new QueryStrategy()]
    const originalLength = strategies.length
    const context = createSemanticContext(createIntentResult('Create'))
    selector.select(strategies, context)
    expect(strategies.length).toBe(originalLength)
  })

  it('should not modify input context', () => {
    const selector = new DefaultPromptStrategySelector()
    const strategies = [new CreateStrategy()]
    const context = createSemanticContext(createIntentResult('Create'))
    const intentBefore = context.intent
    selector.select(strategies, context)
    expect(context.intent).toBe(intentBefore)
  })
})

// ---------------------------------------------------------------------------
// Candidate Generation — every strategy gets evaluated
// ---------------------------------------------------------------------------

describe('Candidate generation', () => {
  it('should evaluate every strategy in the list', () => {
    const evaluated: string[] = []
    const trackingEvaluator: StrategyEvaluator = {
      evaluate(strategy: PromptStrategy, _context: SemanticContext): number {
        evaluated.push(strategy.name)
        return 0
      },
    }
    const selector = new DefaultPromptStrategySelector(trackingEvaluator)
    const strategies = [new CreateStrategy(), new QueryStrategy(), new ModifyStrategy()]
    selector.select(strategies, createSemanticContext())
    expect(evaluated).toEqual(['create', 'query', 'modify'])
  })

  it('should evaluate all strategies even when first matches', () => {
    const evaluated: string[] = []
    const trackingEvaluator: StrategyEvaluator = {
      evaluate(strategy: PromptStrategy): number {
        evaluated.push(strategy.name)
        return strategy.name === 'create' ? 100 : 0
      },
    }
    const selector = new DefaultPromptStrategySelector(trackingEvaluator)
    const strategies = [new CreateStrategy(), new QueryStrategy(), new DeleteStrategy()]
    selector.select(strategies, createSemanticContext())
    expect(evaluated).toEqual(['create', 'query', 'delete'])
  })
})

// ---------------------------------------------------------------------------
// Backward Compatibility — same results as first-match-wins
// ---------------------------------------------------------------------------

describe('Backward compatibility with first-match-wins', () => {
  it('Create intent → CreateStrategy', () => {
    const selector = new DefaultPromptStrategySelector()
    const strategies = [new CreateStrategy(), new QueryStrategy(), new ModifyStrategy(), new DeleteStrategy(), new DefaultPromptStrategy()]
    const context = createSemanticContext(createIntentResult('Create'))
    expect(selector.select(strategies, context).name).toBe('create')
  })

  it('Query intent → QueryStrategy', () => {
    const selector = new DefaultPromptStrategySelector()
    const strategies = [new CreateStrategy(), new QueryStrategy(), new ModifyStrategy(), new DeleteStrategy(), new DefaultPromptStrategy()]
    const context = createSemanticContext(createIntentResult('Query'))
    expect(selector.select(strategies, context).name).toBe('query')
  })

  it('Modify intent → ModifyStrategy', () => {
    const selector = new DefaultPromptStrategySelector()
    const strategies = [new CreateStrategy(), new QueryStrategy(), new ModifyStrategy(), new DeleteStrategy(), new DefaultPromptStrategy()]
    const context = createSemanticContext(createIntentResult('Modify'))
    expect(selector.select(strategies, context).name).toBe('modify')
  })

  it('Move intent → ModifyStrategy', () => {
    const selector = new DefaultPromptStrategySelector()
    const strategies = [new CreateStrategy(), new QueryStrategy(), new ModifyStrategy(), new DeleteStrategy(), new DefaultPromptStrategy()]
    const context = createSemanticContext(createIntentResult('Move'))
    expect(selector.select(strategies, context).name).toBe('modify')
  })

  it('Delete intent → DeleteStrategy', () => {
    const selector = new DefaultPromptStrategySelector()
    const strategies = [new CreateStrategy(), new QueryStrategy(), new ModifyStrategy(), new DeleteStrategy(), new DefaultPromptStrategy()]
    const context = createSemanticContext(createIntentResult('Delete'))
    expect(selector.select(strategies, context).name).toBe('delete')
  })

  it('no intent → DefaultPromptStrategy', () => {
    const selector = new DefaultPromptStrategySelector()
    const strategies = [new CreateStrategy(), new QueryStrategy(), new ModifyStrategy(), new DeleteStrategy(), new DefaultPromptStrategy()]
    const context = createSemanticContext()
    expect(selector.select(strategies, context).name).toBe('default')
  })
})

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

describe('Exports', () => {
  it('should export DefaultPromptStrategySelector from strategy index', async () => {
    const mod = await import('../strategy')
    expect(mod.DefaultPromptStrategySelector).toBeDefined()
  })

  it('should accept evaluator in constructor', () => {
    const evaluator = new DefaultStrategyEvaluator()
    const selector = new DefaultPromptStrategySelector(evaluator)
    expect(selector).toBeInstanceOf(DefaultPromptStrategySelector)
  })

  it('should accept no constructor args (default evaluator)', () => {
    const selector = new DefaultPromptStrategySelector()
    expect(selector).toBeInstanceOf(DefaultPromptStrategySelector)
  })
})

// ---------------------------------------------------------------------------
// RetryPlanner Compatibility
// ---------------------------------------------------------------------------

describe('RetryPlanner compatibility', () => {
  it('should work with RetryPlanner', () => {
    const selector = new DefaultPromptStrategySelector()
    const result = selector.select([new CreateStrategy()], createSemanticContext(createIntentResult('Create')))
    expect(result.name).toBe('create')
  })
})

// ---------------------------------------------------------------------------
// ToolCallPlanner Compatibility
// ---------------------------------------------------------------------------

describe('ToolCallPlanner compatibility', () => {
  it('should work with ToolCallPlanner', () => {
    const selector = new DefaultPromptStrategySelector()
    const result = selector.select([new QueryStrategy()], createSemanticContext(createIntentResult('Query')))
    expect(result.name).toBe('query')
  })
})

// ---------------------------------------------------------------------------
// Streaming Compatibility
// ---------------------------------------------------------------------------

describe('Streaming compatibility', () => {
  it('should work with streaming pipeline', () => {
    const selector = new DefaultPromptStrategySelector()
    const result = selector.select([new ModifyStrategy()], createSemanticContext(createIntentResult('Modify')))
    expect(result.name).toBe('modify')
  })
})

// ---------------------------------------------------------------------------
// AgentLoop Compatibility
// ---------------------------------------------------------------------------

describe('AgentLoop compatibility', () => {
  it('should work with AgentLoop', () => {
    const selector = new DefaultPromptStrategySelector()
    const result = selector.select([new DeleteStrategy()], createSemanticContext(createIntentResult('Delete')))
    expect(result.name).toBe('delete')
  })
})
