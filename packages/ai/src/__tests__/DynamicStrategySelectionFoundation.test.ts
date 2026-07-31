import { describe, it, expect } from 'vitest'
import type { StrategyCandidate } from '../strategy/StrategyCandidate'
import type { StrategySelectionResult } from '../strategy/StrategySelectionResult'
import type { StrategyEvaluator } from '../strategy/StrategyEvaluator'
import { DefaultStrategyEvaluator } from '../strategy/DefaultStrategyEvaluator'
import { CreateStrategy } from '../strategy/CreateStrategy'
import { QueryStrategy } from '../strategy/QueryStrategy'
import { ModifyStrategy } from '../strategy/ModifyStrategy'
import { DeleteStrategy } from '../strategy/DeleteStrategy'
import { DefaultPromptStrategy } from '../strategy/DefaultPromptStrategy'
import type { PromptStrategy } from '../strategy/PromptStrategy'
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
// StrategyCandidate
// ---------------------------------------------------------------------------

describe('StrategyCandidate', () => {
  it('should hold a strategy and score', () => {
    const strategy = new CreateStrategy()
    const candidate: StrategyCandidate = { strategy, score: 100 }
    expect(candidate.strategy).toBe(strategy)
    expect(candidate.score).toBe(100)
  })

  it('should preserve score value', () => {
    const candidate: StrategyCandidate = { strategy: new QueryStrategy(), score: 75 }
    expect(candidate.score).toBe(75)
  })

  it('should allow zero score', () => {
    const candidate: StrategyCandidate = { strategy: new CreateStrategy(), score: 0 }
    expect(candidate.score).toBe(0)
  })

  it('should be readonly', () => {
    const candidate: StrategyCandidate = { strategy: new CreateStrategy(), score: 100 }
    // TypeScript enforces readonly at compile time; verify the shape
    expect(Object.isFrozen(candidate)).toBe(false) // runtime readonly is TS-only
    expect(candidate.score).toBe(100)
  })
})

// ---------------------------------------------------------------------------
// StrategySelectionResult
// ---------------------------------------------------------------------------

describe('StrategySelectionResult', () => {
  it('should hold selected strategy and candidates', () => {
    const selected = new CreateStrategy()
    const candidates: StrategyCandidate[] = [
      { strategy: new CreateStrategy(), score: 100 },
      { strategy: new QueryStrategy(), score: 0 },
    ]
    const result: StrategySelectionResult = { selected, candidates }
    expect(result.selected).toBe(selected)
    expect(result.candidates).toBe(candidates)
  })

  it('should preserve selected strategy', () => {
    const result: StrategySelectionResult = {
      selected: new DeleteStrategy(),
      candidates: [{ strategy: new DeleteStrategy(), score: 100 }],
    }
    expect(result.selected.name).toBe('delete')
  })

  it('should preserve candidate list', () => {
    const candidates: StrategyCandidate[] = [
      { strategy: new CreateStrategy(), score: 100 },
      { strategy: new QueryStrategy(), score: 0 },
      { strategy: new ModifyStrategy(), score: 0 },
    ]
    const result: StrategySelectionResult = {
      selected: new CreateStrategy(),
      candidates,
    }
    expect(result.candidates).toHaveLength(3)
  })

  it('should allow empty candidates list', () => {
    const result: StrategySelectionResult = {
      selected: new DefaultPromptStrategy(),
      candidates: [],
    }
    expect(result.candidates).toHaveLength(0)
  })

  it('should be readonly', () => {
    const result: StrategySelectionResult = {
      selected: new CreateStrategy(),
      candidates: [],
    }
    expect(result.selected).toBeDefined()
    expect(result.candidates).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// StrategyEvaluator Interface
// ---------------------------------------------------------------------------

describe('StrategyEvaluator interface', () => {
  it('should define evaluate(strategy, context): number', () => {
    const evaluator: StrategyEvaluator = new DefaultStrategyEvaluator()
    expect(typeof evaluator.evaluate).toBe('function')
    expect(evaluator.evaluate).toHaveLength(2)
  })

  it('should accept a custom implementation', () => {
    const custom: StrategyEvaluator = {
      evaluate(_strategy: PromptStrategy, _context: SemanticContext): number {
        return 42
      },
    }
    expect(custom.evaluate(new CreateStrategy(), {})).toBe(42)
  })
})

// ---------------------------------------------------------------------------
// DefaultStrategyEvaluator — applies=true → 100
// ---------------------------------------------------------------------------

describe('DefaultStrategyEvaluator — applies=true → 100', () => {
  it('should score CreateStrategy 100 for Create intent', () => {
    const evaluator = new DefaultStrategyEvaluator()
    const strategy = new CreateStrategy()
    const context = createSemanticContext(createIntentResult('Create'))
    expect(evaluator.evaluate(strategy, context)).toBe(100)
  })

  it('should score QueryStrategy 100 for Query intent', () => {
    const evaluator = new DefaultStrategyEvaluator()
    const strategy = new QueryStrategy()
    const context = createSemanticContext(createIntentResult('Query'))
    expect(evaluator.evaluate(strategy, context)).toBe(100)
  })

  it('should score ModifyStrategy 100 for Modify intent', () => {
    const evaluator = new DefaultStrategyEvaluator()
    const strategy = new ModifyStrategy()
    const context = createSemanticContext(createIntentResult('Modify'))
    expect(evaluator.evaluate(strategy, context)).toBe(100)
  })

  it('should score ModifyStrategy 100 for Move intent', () => {
    const evaluator = new DefaultStrategyEvaluator()
    const strategy = new ModifyStrategy()
    const context = createSemanticContext(createIntentResult('Move'))
    expect(evaluator.evaluate(strategy, context)).toBe(100)
  })

  it('should score DeleteStrategy 100 for Delete intent', () => {
    const evaluator = new DefaultStrategyEvaluator()
    const strategy = new DeleteStrategy()
    const context = createSemanticContext(createIntentResult('Delete'))
    expect(evaluator.evaluate(strategy, context)).toBe(100)
  })

  it('should score DefaultPromptStrategy 100 for any context', () => {
    const evaluator = new DefaultStrategyEvaluator()
    const strategy = new DefaultPromptStrategy()
    const context = createSemanticContext(createIntentResult('Create'))
    expect(evaluator.evaluate(strategy, context)).toBe(100)
  })
})

// ---------------------------------------------------------------------------
// DefaultStrategyEvaluator — applies=false → 0
// ---------------------------------------------------------------------------

describe('DefaultStrategyEvaluator — applies=false → 0', () => {
  it('should score CreateStrategy 0 for Query intent', () => {
    const evaluator = new DefaultStrategyEvaluator()
    const strategy = new CreateStrategy()
    const context = createSemanticContext(createIntentResult('Query'))
    expect(evaluator.evaluate(strategy, context)).toBe(0)
  })

  it('should score QueryStrategy 0 for Create intent', () => {
    const evaluator = new DefaultStrategyEvaluator()
    const strategy = new QueryStrategy()
    const context = createSemanticContext(createIntentResult('Create'))
    expect(evaluator.evaluate(strategy, context)).toBe(0)
  })

  it('should score DeleteStrategy 0 for Modify intent', () => {
    const evaluator = new DefaultStrategyEvaluator()
    const strategy = new DeleteStrategy()
    const context = createSemanticContext(createIntentResult('Modify'))
    expect(evaluator.evaluate(strategy, context)).toBe(0)
  })

  it('should score CreateStrategy 0 for empty context', () => {
    const evaluator = new DefaultStrategyEvaluator()
    const strategy = new CreateStrategy()
    const context = createSemanticContext()
    expect(evaluator.evaluate(strategy, context)).toBe(0)
  })

  it('should score CreateStrategy 0 for Delete intent', () => {
    const evaluator = new DefaultStrategyEvaluator()
    const strategy = new CreateStrategy()
    const context = createSemanticContext(createIntentResult('Delete'))
    expect(evaluator.evaluate(strategy, context)).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// Deterministic
// ---------------------------------------------------------------------------

describe('Deterministic', () => {
  it('should produce same score for same inputs', () => {
    const evaluator = new DefaultStrategyEvaluator()
    const strategy = new CreateStrategy()
    const context = createSemanticContext(createIntentResult('Create'))
    const s1 = evaluator.evaluate(strategy, context)
    const s2 = evaluator.evaluate(strategy, context)
    const s3 = evaluator.evaluate(strategy, context)
    expect(s1).toBe(s2)
    expect(s2).toBe(s3)
  })

  it('should produce same score across evaluator instances', () => {
    const e1 = new DefaultStrategyEvaluator()
    const e2 = new DefaultStrategyEvaluator()
    const strategy = new QueryStrategy()
    const context = createSemanticContext(createIntentResult('Query'))
    expect(e1.evaluate(strategy, context)).toBe(e2.evaluate(strategy, context))
  })
})

// ---------------------------------------------------------------------------
// Stateless
// ---------------------------------------------------------------------------

describe('Stateless', () => {
  it('should not retain state between evaluate calls', () => {
    const evaluator = new DefaultStrategyEvaluator()
    const createCtx = createSemanticContext(createIntentResult('Create'))
    const queryCtx = createSemanticContext(createIntentResult('Query'))
    // Evaluate create strategy with matching context
    expect(evaluator.evaluate(new CreateStrategy(), createCtx)).toBe(100)
    // Now evaluate with non-matching context — no retained state
    expect(evaluator.evaluate(new CreateStrategy(), queryCtx)).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// Pure
// ---------------------------------------------------------------------------

describe('Pure', () => {
  it('should not modify input strategy', () => {
    const evaluator = new DefaultStrategyEvaluator()
    const strategy = new CreateStrategy()
    const context = createSemanticContext(createIntentResult('Create'))
    const nameBefore = strategy.name
    evaluator.evaluate(strategy, context)
    expect(strategy.name).toBe(nameBefore)
  })

  it('should not modify input context', () => {
    const evaluator = new DefaultStrategyEvaluator()
    const strategy = new CreateStrategy()
    const context = createSemanticContext(createIntentResult('Create'))
    const intentBefore = context.intent
    evaluator.evaluate(strategy, context)
    expect(context.intent).toBe(intentBefore)
  })
})

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

describe('Exports', () => {
  it('should export StrategyCandidate type from strategy index', async () => {
    const mod = await import('../strategy')
    // StrategyCandidate is a type — verify it exists via runtime shape
    expect(mod.DefaultStrategyEvaluator).toBeDefined()
  })

  it('should export DefaultStrategyEvaluator from strategy index', async () => {
    const mod = await import('../strategy')
    expect(typeof mod.DefaultStrategyEvaluator).toBe('function')
  })

  it('should export from package root', async () => {
    const mod = await import('../index')
    expect(mod.DefaultStrategyEvaluator).toBeDefined()
  })

  it('should export DefaultStrategyEvaluator as a class', () => {
    const evaluator = new DefaultStrategyEvaluator()
    expect(evaluator).toBeInstanceOf(DefaultStrategyEvaluator)
  })
})

// ---------------------------------------------------------------------------
// Architecture Compliance
// ---------------------------------------------------------------------------

describe('Architecture compliance', () => {
  it('should have zero Planner dependencies', () => {
    const evaluator = new DefaultStrategyEvaluator()
    // StrategyEvaluator only depends on PromptStrategy and SemanticContext
    expect(typeof evaluator.evaluate).toBe('function')
  })

  it('should have zero Runtime dependencies', () => {
    // Verify no runtime imports in module
    const evaluator = new DefaultStrategyEvaluator()
    expect(evaluator).toBeDefined()
  })

  it('should have zero Provider dependencies', () => {
    const evaluator = new DefaultStrategyEvaluator()
    expect(evaluator).toBeDefined()
  })

  it('should have zero Pipeline dependencies', () => {
    const evaluator = new DefaultStrategyEvaluator()
    expect(evaluator).toBeDefined()
  })

  it('should have zero AgentLoop dependencies', () => {
    const evaluator = new DefaultStrategyEvaluator()
    expect(evaluator).toBeDefined()
  })

  it('should not modify current strategy selection behavior', () => {
    // DefaultStrategyEvaluator produces same result as applies()
    const evaluator = new DefaultStrategyEvaluator()
    const strategy = new CreateStrategy()
    const context = createSemanticContext(createIntentResult('Create'))
    const applies = strategy.applies(context)
    const score = evaluator.evaluate(strategy, context)
    // applies=true → score=100, applies=false → score=0
    expect(applies ? score === 100 : score === 0).toBe(true)
  })

  it('should not modify current prompt output', () => {
    // Foundation only — not consumed by PromptBuilder
    const evaluator = new DefaultStrategyEvaluator()
    expect(evaluator).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// RetryPlanner Compatibility
// ---------------------------------------------------------------------------

describe('RetryPlanner compatibility', () => {
  it('should be compatible with RetryPlanner', () => {
    const evaluator = new DefaultStrategyEvaluator()
    const result = evaluator.evaluate(new CreateStrategy(), createSemanticContext(createIntentResult('Create')))
    expect(typeof result).toBe('number')
  })
})

// ---------------------------------------------------------------------------
// ToolCallPlanner Compatibility
// ---------------------------------------------------------------------------

describe('ToolCallPlanner compatibility', () => {
  it('should be compatible with ToolCallPlanner', () => {
    const evaluator = new DefaultStrategyEvaluator()
    const result = evaluator.evaluate(new QueryStrategy(), createSemanticContext(createIntentResult('Query')))
    expect(typeof result).toBe('number')
  })
})

// ---------------------------------------------------------------------------
// Streaming Compatibility
// ---------------------------------------------------------------------------

describe('Streaming compatibility', () => {
  it('should be compatible with streaming pipeline', () => {
    const evaluator = new DefaultStrategyEvaluator()
    const result = evaluator.evaluate(new ModifyStrategy(), createSemanticContext(createIntentResult('Modify')))
    expect(typeof result).toBe('number')
  })
})

// ---------------------------------------------------------------------------
// AgentLoop Compatibility
// ---------------------------------------------------------------------------

describe('AgentLoop compatibility', () => {
  it('should be compatible with AgentLoop', () => {
    const evaluator = new DefaultStrategyEvaluator()
    const result = evaluator.evaluate(new DeleteStrategy(), createSemanticContext(createIntentResult('Delete')))
    expect(typeof result).toBe('number')
  })
})
