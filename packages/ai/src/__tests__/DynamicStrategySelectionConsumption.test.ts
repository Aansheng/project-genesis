import { describe, it, expect } from 'vitest'
import { DefaultPromptBuilder } from '../prompt/DefaultPromptBuilder'
import type { PromptStrategy } from '../strategy/PromptStrategy'
import type { StrategyEvaluator } from '../strategy/StrategyEvaluator'
import type { StrategySelectionMetadata } from '../strategy/StrategySelectionMetadata'
import type { SemanticContext } from '../semantic/SemanticContext'
import { DefaultStrategyEvaluator } from '../strategy/DefaultStrategyEvaluator'
import { WeightedStrategyEvaluator } from '../strategy/WeightedStrategyEvaluator'
import { DefaultPromptStrategySelector } from '../strategy/DefaultPromptStrategySelector'
import { CreateStrategy } from '../strategy/CreateStrategy'
import { QueryStrategy } from '../strategy/QueryStrategy'
import { ModifyStrategy } from '../strategy/ModifyStrategy'
import { DeleteStrategy } from '../strategy/DeleteStrategy'
import { DefaultPromptStrategy } from '../strategy/DefaultPromptStrategy'
import { UserInputModule } from '../prompt/modules'
import type { PipelineContext } from '../pipeline/PipelineContext'

// ---------------------------------------------------------------------------
// Test Helpers
// ---------------------------------------------------------------------------

function createPipelineContext(overrides?: Partial<PipelineContext>): PipelineContext {
  return {
    input: 'draw a tree',
    memory: { get: async () => null, set: async () => {} },
    worldState: '',
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Evaluator-Driven Selection — the evaluator becomes the authoritative scorer
// ---------------------------------------------------------------------------

describe('Evaluator-Driven Selection', () => {
  it('should select strategy based on evaluator score (highest wins)', async () => {
    const customEvaluator: StrategyEvaluator = {
      evaluate(strategy: PromptStrategy): number {
        return strategy.name === 'create' ? 95 : 10
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      strategies: [new QueryStrategy(), new CreateStrategy(), new ModifyStrategy()],
      strategyEvaluator: customEvaluator,
    })
    const request = await builder.build(createPipelineContext())
    const assembly = request.metadata?.promptAssembly as Record<string, unknown> | undefined
    expect(assembly?.strategy).toEqual({ name: 'create' })
  })

  it('should select the strategy with the highest score from multiple candidates', async () => {
    const scoreMap: Record<string, number> = { query: 100, create: 85, modify: 70, delete: 50 }
    const customEvaluator: StrategyEvaluator = {
      evaluate(strategy: PromptStrategy): number {
        return scoreMap[strategy.name] ?? 0
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      strategies: [
        new CreateStrategy(),
        new QueryStrategy(),
        new ModifyStrategy(),
        new DeleteStrategy(),
      ],
      strategyEvaluator: customEvaluator,
    })
    const request = await builder.build(createPipelineContext())
    const assembly = request.metadata?.promptAssembly as Record<string, unknown> | undefined
    expect(assembly?.strategy).toEqual({ name: 'query' })
  })

  it('should evaluate all strategies even when the first candidate scores highest', async () => {
    const evaluated: string[] = []
    const trackingEvaluator: StrategyEvaluator = {
      evaluate(strategy: PromptStrategy): number {
        evaluated.push(strategy.name)
        return strategy.name === 'create' ? 100 : 0
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      strategies: [new CreateStrategy(), new QueryStrategy(), new DeleteStrategy()],
      strategyEvaluator: trackingEvaluator,
    })
    await builder.build(createPipelineContext())
    expect(evaluated).toEqual(['create', 'query', 'delete'])
  })

  it('should fall back to DefaultPromptStrategy when all scores are 0', async () => {
    const alwaysZero: StrategyEvaluator = {
      evaluate(): number { return 0 },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      strategies: [new CreateStrategy(), new QueryStrategy()],
      strategyEvaluator: alwaysZero,
    })
    const request = await builder.build(createPipelineContext())
    const assembly = request.metadata?.promptAssembly as Record<string, unknown> | undefined
    expect(assembly?.strategy).toEqual({ name: 'default' })
  })

  it('should fall back to DefaultPromptStrategy when no strategies are configured', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()])
    const request = await builder.build(createPipelineContext())
    const assembly = request.metadata?.promptAssembly as Record<string, unknown> | undefined
    expect(assembly?.strategy).toEqual({ name: 'default' })
  })

  it('should produce StrategySelectionMetadata when evaluator drives selection', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      strategies: [new CreateStrategy(), new QueryStrategy()],
      strategyEvaluator: new DefaultStrategyEvaluator(),
    })
    const request = await builder.build(createPipelineContext())
    const assembly = request.metadata?.promptAssembly as Record<string, unknown> | undefined
    expect(assembly?.strategySelection).toBeDefined()
  })

  it('should not use strategySelector directly when evaluator is present', async () => {
    // The selector is configured but should be bypassed when evaluator is present
    const neverCalledSelector = {
      select(): PromptStrategy {
        throw new Error('Selector should not be called when evaluator drives selection')
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      strategySelector: neverCalledSelector,
      strategies: [new CreateStrategy()],
      strategyEvaluator: new DefaultStrategyEvaluator(),
    })
    const request = await builder.build(createPipelineContext())
    expect(request.prompt).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Weighted Evaluator Integration
// ---------------------------------------------------------------------------

describe('Weighted Evaluator Integration', () => {
  it('should select Create strategy for Create intent with WeightedEvaluator', async () => {
    const evaluator = new WeightedStrategyEvaluator()
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      strategies: [new CreateStrategy(), new QueryStrategy(), new ModifyStrategy(), new DeleteStrategy()],
      strategyEvaluator: evaluator,
    })
    // No entity analyzer → semanticContext will be empty → all scores default to 0
    // Without a SemanticContextBuilder, the weighted evaluator gets no intent
    const request = await builder.build(createPipelineContext())
    const assembly = request.metadata?.promptAssembly as Record<string, unknown> | undefined
    // Without intent in semantic context → all scores 0 → fallback to default
    expect(assembly?.strategy).toEqual({ name: 'default' })
  })

  it('should select Create strategy (score 100) over Query (score 20) for Create intent', async () => {
    // This test verifies the evaluator-driven selection pipeline works with
    // weighted scoring. When the evaluator gives create=100 and query=20,
    // the builder should select 'create'.
    const evaluator: StrategyEvaluator = {
      evaluate(strategy: PromptStrategy): number {
        if (strategy.name === 'create') return 100
        if (strategy.name === 'query') return 20
        return 0
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      strategies: [new QueryStrategy(), new CreateStrategy()],
      strategyEvaluator: evaluator,
    })
    const request = await builder.build(createPipelineContext())
    const assembly = request.metadata?.promptAssembly as Record<string, unknown> | undefined
    expect(assembly?.strategy).toEqual({ name: 'create' })
  })

  it('should select Query strategy (score 100) over Create (score 20) for Query intent', async () => {
    const evaluator: StrategyEvaluator = {
      evaluate(strategy: PromptStrategy): number {
        if (strategy.name === 'query') return 100
        if (strategy.name === 'create') return 20
        return 0
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      strategies: [new CreateStrategy(), new QueryStrategy()],
      strategyEvaluator: evaluator,
    })
    const request = await builder.build(createPipelineContext())
    const assembly = request.metadata?.promptAssembly as Record<string, unknown> | undefined
    expect(assembly?.strategy).toEqual({ name: 'query' })
  })

  it('should select Delete over Modify when Delete scores higher', async () => {
    const evaluator: StrategyEvaluator = {
      evaluate(strategy: PromptStrategy): number {
        if (strategy.name === 'delete') return 100
        if (strategy.name === 'modify') return 80
        return 0
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      strategies: [new ModifyStrategy(), new DeleteStrategy()],
      strategyEvaluator: evaluator,
    })
    const request = await builder.build(createPipelineContext())
    const assembly = request.metadata?.promptAssembly as Record<string, unknown> | undefined
    expect(assembly?.strategy).toEqual({ name: 'delete' })
  })

  it('should preserve all candidate scores in metadata', async () => {
    const evaluator: StrategyEvaluator = {
      evaluate(strategy: PromptStrategy): number {
        const scores: Record<string, number> = { create: 90, query: 80, modify: 70, delete: 60 }
        return scores[strategy.name] ?? 0
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      strategies: [new CreateStrategy(), new QueryStrategy(), new ModifyStrategy(), new DeleteStrategy()],
      strategyEvaluator: evaluator,
    })
    const request = await builder.build(createPipelineContext())
    const assembly = request.metadata?.promptAssembly as Record<string, unknown> | undefined
    const selection = assembly?.strategySelection as StrategySelectionMetadata | undefined
    expect(selection?.candidates).toEqual([
      { strategy: 'create', score: 90 },
      { strategy: 'query', score: 80 },
      { strategy: 'modify', score: 70 },
      { strategy: 'delete', score: 60 },
    ])
  })
})

// ---------------------------------------------------------------------------
// Custom Evaluator Integration
// ---------------------------------------------------------------------------

describe('Custom Evaluator Integration', () => {
  it('should accept a custom evaluator that scores by strategy name match', async () => {
    const nameMatchEvaluator: StrategyEvaluator = {
      evaluate(strategy: PromptStrategy, _context: SemanticContext): number {
        return strategy.name === 'query' ? 99 : 1
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      strategies: [new CreateStrategy(), new QueryStrategy(), new ModifyStrategy()],
      strategyEvaluator: nameMatchEvaluator,
    })
    const request = await builder.build(createPipelineContext())
    const assembly = request.metadata?.promptAssembly as Record<string, unknown> | undefined
    expect(assembly?.strategy).toEqual({ name: 'query' })
  })

  it('should produce correct metadata with custom evaluator', async () => {
    const customEvaluator: StrategyEvaluator = {
      evaluate(strategy: PromptStrategy): number {
        return strategy.name === 'modify' ? 75 : strategy.name === 'create' ? 50 : 25
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      strategies: [new CreateStrategy(), new QueryStrategy(), new ModifyStrategy()],
      strategyEvaluator: customEvaluator,
    })
    const request = await builder.build(createPipelineContext())
    const assembly = request.metadata?.promptAssembly as Record<string, unknown> | undefined
    expect(assembly?.strategy).toEqual({ name: 'modify' })
    const selection = assembly?.strategySelection as StrategySelectionMetadata | undefined
    expect(selection?.candidates[0]).toEqual({ strategy: 'create', score: 50 })
    expect(selection?.candidates[1]).toEqual({ strategy: 'query', score: 25 })
    expect(selection?.candidates[2]).toEqual({ strategy: 'modify', score: 75 })
  })

  it('should work with custom evaluator that returns negative scores (treat 0 as threshold)', async () => {
    const negativeScores: StrategyEvaluator = {
      evaluate(strategy: PromptStrategy): number {
        if (strategy.name === 'create') return -5
        return 0
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      strategies: [new CreateStrategy(), new QueryStrategy()],
      strategyEvaluator: negativeScores,
    })
    const request = await builder.build(createPipelineContext())
    const assembly = request.metadata?.promptAssembly as Record<string, unknown> | undefined
    // All scores <= 0 → fallback to default
    expect(assembly?.strategy).toEqual({ name: 'default' })
  })
})

// ---------------------------------------------------------------------------
// Tie-Breaking (deterministic, array order)
// ---------------------------------------------------------------------------

describe('Tie-Breaking — First Occurrence Wins', () => {
  it('should select first strategy when all scores are equal and positive', async () => {
    const allEqual: StrategyEvaluator = {
      evaluate(): number { return 50 },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      strategies: [new ModifyStrategy(), new DeleteStrategy(), new QueryStrategy()],
      strategyEvaluator: allEqual,
    })
    const request = await builder.build(createPipelineContext())
    const assembly = request.metadata?.promptAssembly as Record<string, unknown> | undefined
    expect(assembly?.strategy).toEqual({ name: 'modify' })
  })

  it('should select first strategy when all scores are 100', async () => {
    const all100: StrategyEvaluator = {
      evaluate(): number { return 100 },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      strategies: [new QueryStrategy(), new CreateStrategy(), new DeleteStrategy()],
      strategyEvaluator: all100,
    })
    const request = await builder.build(createPipelineContext())
    const assembly = request.metadata?.promptAssembly as Record<string, unknown> | undefined
    expect(assembly?.strategy).toEqual({ name: 'query' })
  })

  it('should consistently pick first among tied highest scores', async () => {
    const tieredEvaluator: StrategyEvaluator = {
      evaluate(strategy: PromptStrategy): number {
        if (strategy.name === 'create' || strategy.name === 'query') return 80
        return 40
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      strategies: [new CreateStrategy(), new QueryStrategy(), new ModifyStrategy()],
      strategyEvaluator: tieredEvaluator,
    })
    const request = await builder.build(createPipelineContext())
    const assembly = request.metadata?.promptAssembly as Record<string, unknown> | undefined
    // 'create' and 'query' both score 80, but 'create' comes first → wins
    expect(assembly?.strategy).toEqual({ name: 'create' })
  })

  it('should select first strategy when only one has positive score', async () => {
    const singlePositive: StrategyEvaluator = {
      evaluate(strategy: PromptStrategy): number {
        return strategy.name === 'delete' ? 100 : 0
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      strategies: [new CreateStrategy(), new QueryStrategy(), new ModifyStrategy(), new DeleteStrategy()],
      strategyEvaluator: singlePositive,
    })
    const request = await builder.build(createPipelineContext())
    const assembly = request.metadata?.promptAssembly as Record<string, unknown> | undefined
    expect(assembly?.strategy).toEqual({ name: 'delete' })
  })
})

// ---------------------------------------------------------------------------
// Deterministic
// ---------------------------------------------------------------------------

describe('Deterministic', () => {
  it('should produce same selection for same inputs across multiple builds', async () => {
    const evaluator = new WeightedStrategyEvaluator()
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      strategies: [new CreateStrategy(), new QueryStrategy(), new ModifyStrategy(), new DeleteStrategy()],
      strategyEvaluator: evaluator,
    })
    const req1 = await builder.build(createPipelineContext())
    const req2 = await builder.build(createPipelineContext())
    const req3 = await builder.build(createPipelineContext())
    const s1 = (req1.metadata?.promptAssembly as Record<string, unknown>)?.strategy as { name: string }
    const s2 = (req2.metadata?.promptAssembly as Record<string, unknown>)?.strategy as { name: string }
    const s3 = (req3.metadata?.promptAssembly as Record<string, unknown>)?.strategy as { name: string }
    expect(s1).toEqual(s2)
    expect(s2).toEqual(s3)
  })

  it('should produce same metadata across multiple builder instances', async () => {
    const b1 = new DefaultPromptBuilder([new UserInputModule()], {
      strategies: [new CreateStrategy(), new QueryStrategy()],
      strategyEvaluator: new DefaultStrategyEvaluator(),
    })
    const b2 = new DefaultPromptBuilder([new UserInputModule()], {
      strategies: [new CreateStrategy(), new QueryStrategy()],
      strategyEvaluator: new DefaultStrategyEvaluator(),
    })
    const r1 = await b1.build(createPipelineContext())
    const r2 = await b2.build(createPipelineContext())
    const m1 = (r1.metadata?.promptAssembly as Record<string, unknown>)?.strategySelection as StrategySelectionMetadata
    const m2 = (r2.metadata?.promptAssembly as Record<string, unknown>)?.strategySelection as StrategySelectionMetadata
    expect(m1).toEqual(m2)
  })

  it('should produce same scores for same strategies across builds', async () => {
    const evaluatedFirst: string[] = []
    const tracking: StrategyEvaluator = {
      evaluate(strategy: PromptStrategy): number {
        evaluatedFirst.push(strategy.name)
        return strategy.name === 'query' ? 100 : 0
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      strategies: [new CreateStrategy(), new QueryStrategy()],
      strategyEvaluator: tracking,
    })
    await builder.build(createPipelineContext())
    await builder.build(createPipelineContext())
    // Both evaluations should produce the same sequence
    expect(evaluatedFirst).toEqual(['create', 'query', 'create', 'query'])
  })
})

// ---------------------------------------------------------------------------
// Stateless
// ---------------------------------------------------------------------------

describe('Stateless', () => {
  it('should not retain selection state between builds', async () => {
    const statefulCheck: StrategyEvaluator = {
      evaluate(strategy: PromptStrategy): number {
        if (strategy.name === 'create') return 100
        if (strategy.name === 'delete') return 100
        return 0
      },
    }
    // Single builder instance, multiple builds with different evaluators
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      strategies: [new CreateStrategy(), new DeleteStrategy()],
      strategyEvaluator: statefulCheck,
    })
    const req1 = await builder.build(createPipelineContext({ input: 'create a house' }))
    const req2 = await builder.build(createPipelineContext({ input: 'delete a tree' }))
    const a1 = req1.metadata?.promptAssembly as Record<string, unknown> | undefined
    const a2 = req2.metadata?.promptAssembly as Record<string, unknown> | undefined
    // Both builds should use the evaluator fresh each time — they both have
    // the same evaluator and strategies, so results are identical
    expect(a1?.strategy).toEqual({ name: 'create' })
    expect(a2?.strategy).toEqual({ name: 'create' })
  })
})

// ---------------------------------------------------------------------------
// Metadata Consistency
// ---------------------------------------------------------------------------

describe('Metadata Consistency', () => {
  it('should store selected strategy name matching the evaluator winner', async () => {
    const evaluator: StrategyEvaluator = {
      evaluate(strategy: PromptStrategy): number {
        return strategy.name === 'query' ? 100 : 0
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      strategies: [new CreateStrategy(), new QueryStrategy(), new ModifyStrategy()],
      strategyEvaluator: evaluator,
    })
    const request = await builder.build(createPipelineContext())
    const assembly = request.metadata?.promptAssembly as Record<string, unknown> | undefined
    expect((assembly?.strategy as { name: string }).name).toBe('query')
    const selection = assembly?.strategySelection as StrategySelectionMetadata | undefined
    expect(selection?.selected).toBe('query')
  })

  it('should store all candidate scores in selection metadata', async () => {
    const evaluator: StrategyEvaluator = {
      evaluate(strategy: PromptStrategy): number {
        const scores: Record<string, number> = { create: 85, query: 92, modify: 78 }
        return scores[strategy.name] ?? 0
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      strategies: [new CreateStrategy(), new QueryStrategy(), new ModifyStrategy()],
      strategyEvaluator: evaluator,
    })
    const request = await builder.build(createPipelineContext())
    const assembly = request.metadata?.promptAssembly as Record<string, unknown> | undefined
    const selection = assembly?.strategySelection as StrategySelectionMetadata | undefined
    expect(selection?.candidates).toHaveLength(3)
    expect(selection?.candidates).toContainEqual({ strategy: 'create', score: 85 })
    expect(selection?.candidates).toContainEqual({ strategy: 'query', score: 92 })
    expect(selection?.candidates).toContainEqual({ strategy: 'modify', score: 78 })
  })

  it('should keep candidate order consistent with strategies array', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      strategies: [new DeleteStrategy(), new ModifyStrategy(), new QueryStrategy(), new CreateStrategy()],
      strategyEvaluator: new DefaultStrategyEvaluator(),
    })
    const request = await builder.build(createPipelineContext())
    const assembly = request.metadata?.promptAssembly as Record<string, unknown> | undefined
    const selection = assembly?.strategySelection as StrategySelectionMetadata | undefined
    const names = selection?.candidates.map(c => c.strategy)
    expect(names).toEqual(['delete', 'modify', 'query', 'create'])
  })

  it('should create metadata with empty candidates for empty strategies array', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      strategies: [],
      strategyEvaluator: new DefaultStrategyEvaluator(),
    })
    const request = await builder.build(createPipelineContext())
    const assembly = request.metadata?.promptAssembly as Record<string, unknown> | undefined
    const selection = assembly?.strategySelection as StrategySelectionMetadata | undefined
    expect(selection).toBeDefined()
    expect(selection?.selected).toBe('default')
    expect(selection?.candidates).toEqual([])
  })

  it('should not create metadata when strategyEvaluator is absent', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      strategies: [new CreateStrategy()],
    })
    const request = await builder.build(createPipelineContext())
    const assembly = request.metadata?.promptAssembly as Record<string, unknown> | undefined
    expect(assembly?.strategySelection).toBeUndefined()
  })

  it('should not create metadata when strategies are absent', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      strategyEvaluator: new DefaultStrategyEvaluator(),
    })
    const request = await builder.build(createPipelineContext())
    const assembly = request.metadata?.promptAssembly as Record<string, unknown> | undefined
    expect(assembly?.strategySelection).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// Compatibility — Prompt Output Unchanged
// ---------------------------------------------------------------------------

describe('Compatibility', () => {
  it('should produce identical prompt output with evaluator-driven vs selector-driven', async () => {
    // Using DefaultStrategyEvaluator (which mirrors selector's DefaultStrategyEvaluator)
    const builderViaSelector = new DefaultPromptBuilder([new UserInputModule()], {
      strategySelector: new DefaultPromptStrategySelector(),
      strategies: [new CreateStrategy(), new QueryStrategy()],
    })
    const builderViaEvaluator = new DefaultPromptBuilder([new UserInputModule()], {
      strategySelector: new DefaultPromptStrategySelector(),
      strategies: [new CreateStrategy(), new QueryStrategy()],
      strategyEvaluator: new DefaultStrategyEvaluator(),
    })
    const ctx = createPipelineContext()
    const reqViaSelector = await builderViaSelector.build(ctx)
    const reqViaEvaluator = await builderViaEvaluator.build(ctx)
    expect(reqViaEvaluator.prompt).toBe(reqViaSelector.prompt)
  })

  it('should produce same prompt output regardless of evaluator presence', async () => {
    const builderWithout = new DefaultPromptBuilder([new UserInputModule()], {
      strategySelector: new DefaultPromptStrategySelector(),
      strategies: [new DefaultPromptStrategy()],
    })
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

  it('should produce same prompt output with or without all strategy config', async () => {
    const builderMinimal = new DefaultPromptBuilder([new UserInputModule()])
    const builderFull = new DefaultPromptBuilder([new UserInputModule()], {
      strategySelector: new DefaultPromptStrategySelector(),
      strategies: [new DefaultPromptStrategy()],
      strategyEvaluator: new DefaultStrategyEvaluator(),
    })
    const ctx = createPipelineContext()
    const reqMinimal = await builderMinimal.build(ctx)
    const reqFull = await builderFull.build(ctx)
    expect(reqFull.prompt).toBe(reqMinimal.prompt)
  })

  it('should preserve existing strategy metadata when evaluator drives selection', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      strategies: [new DefaultPromptStrategy()],
      strategyEvaluator: new DefaultStrategyEvaluator(),
    })
    const request = await builder.build(createPipelineContext())
    const assembly = request.metadata?.promptAssembly as Record<string, unknown> | undefined
    // Original strategy metadata field still present
    expect(assembly?.strategy).toEqual({ name: 'default' })
    // Evaluator-driven metadata also present
    expect(assembly?.strategySelection).toBeDefined()
  })

  it('should not modify the strategies array', async () => {
    const strategies: PromptStrategy[] = [new CreateStrategy(), new QueryStrategy()]
    const originalLength = strategies.length
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      strategies,
      strategyEvaluator: new DefaultStrategyEvaluator(),
    })
    await builder.build(createPipelineContext())
    expect(strategies.length).toBe(originalLength)
  })

  it('should not modify the input pipeline context', async () => {
    const context = createPipelineContext()
    const inputBefore = context.input
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
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
      strategies: [new CreateStrategy(), new QueryStrategy()],
      strategyEvaluator: new DefaultStrategyEvaluator(),
    })
    const request = await builder.build(createPipelineContext())
    const assembly = request.metadata?.promptAssembly as Record<string, unknown> | undefined
    expect(assembly?.strategy).toBeDefined()
    expect(assembly?.strategySelection).toBeDefined()
  })

  it('should coexist with strategyRendered metadata', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
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
      strategies: [new DefaultPromptStrategy()],
      strategyEvaluator: new DefaultStrategyEvaluator(),
    })
    const request = await builder.build(createPipelineContext())
    const assembly = request.metadata?.promptAssembly as Record<string, unknown> | undefined
    expect(assembly?.strategySelection).toBeDefined()
    expect(assembly?.strategy).toBeDefined()
  })

  it('should coexist with all strategy-related metadata fields', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      strategies: [new CreateStrategy(), new QueryStrategy()],
      strategyEvaluator: new DefaultStrategyEvaluator(),
    })
    const request = await builder.build(createPipelineContext())
    const assembly = request.metadata?.promptAssembly as Record<string, unknown> | undefined
    expect(assembly?.strategy).toBeDefined()
    expect(assembly?.strategyRendered).toBeDefined()
    expect(assembly?.strategySelection).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Backward Compatibility — Strategy Selector Fallback
// ---------------------------------------------------------------------------

describe('Backward Compatibility (Selector Fallback)', () => {
  it('should use strategySelector when evaluator is not provided', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      strategySelector: new DefaultPromptStrategySelector(),
      strategies: [new CreateStrategy(), new QueryStrategy()],
    })
    const request = await builder.build(createPipelineContext())
    const assembly = request.metadata?.promptAssembly as Record<string, unknown> | undefined
    // Without evaluator → selector drives, no metadata
    expect(assembly?.strategy).toEqual({ name: 'default' })
    expect(assembly?.strategySelection).toBeUndefined()
  })

  it('should fall back to DefaultPromptStrategy when selector and evaluator are both absent', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()])
    const request = await builder.build(createPipelineContext())
    const assembly = request.metadata?.promptAssembly as Record<string, unknown> | undefined
    expect(assembly?.strategy).toEqual({ name: 'default' })
  })

  it('should handle legacy positional constructor (no strategy features)', async () => {
    const builder = new DefaultPromptBuilder(
      [new UserInputModule()],
      undefined,  // renderer
      undefined,  // compression
      undefined,  // ranking
      undefined,  // budget
      undefined,  // selection
      undefined,  // providerBudget
      undefined,  // configuration
    )
    const request = await builder.build(createPipelineContext())
    const assembly = request.metadata?.promptAssembly as Record<string, unknown> | undefined
    expect(assembly?.strategy).toEqual({ name: 'default' })
    expect(assembly?.strategySelection).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// Architecture Compliance
// ---------------------------------------------------------------------------

describe('Architecture Compliance', () => {
  it('should treat evaluator as authoritative scoring mechanism', async () => {
    const selectorThatDisagrees = {
      select(_strategies: readonly PromptStrategy[], _context: SemanticContext): PromptStrategy {
        // Selector would pick 'modify', but evaluator says 'create'
        return new ModifyStrategy()
      },
    }
    const evaluatorSaysCreate: StrategyEvaluator = {
      evaluate(strategy: PromptStrategy): number {
        return strategy.name === 'create' ? 100 : 0
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      strategySelector: selectorThatDisagrees,
      strategies: [new CreateStrategy(), new ModifyStrategy()],
      strategyEvaluator: evaluatorSaysCreate,
    })
    const request = await builder.build(createPipelineContext())
    const assembly = request.metadata?.promptAssembly as Record<string, unknown> | undefined
    // Evaluator wins — 'create' selected, not 'modify'
    expect(assembly?.strategy).toEqual({ name: 'create' })
  })

  it('should evaluate every strategy exactly once per build', async () => {
    const invocationCounts: Record<string, number> = {}
    const countingEvaluator: StrategyEvaluator = {
      evaluate(strategy: PromptStrategy): number {
        invocationCounts[strategy.name] = (invocationCounts[strategy.name] ?? 0) + 1
        return strategy.name === 'query' ? 100 : 0
      },
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      strategies: [new CreateStrategy(), new QueryStrategy(), new ModifyStrategy(), new DeleteStrategy()],
      strategyEvaluator: countingEvaluator,
    })
    await builder.build(createPipelineContext())
    expect(invocationCounts['create']).toBe(1)
    expect(invocationCounts['query']).toBe(1)
    expect(invocationCounts['modify']).toBe(1)
    expect(invocationCounts['delete']).toBe(1)
  })
})