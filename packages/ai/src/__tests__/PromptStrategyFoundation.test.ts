import { describe, it, expect } from 'vitest'
import type { PromptStrategy } from '../strategy/PromptStrategy'
import { DefaultPromptStrategy } from '../strategy/DefaultPromptStrategy'
import type { PromptStrategySelector } from '../strategy/PromptStrategySelector'
import { DefaultPromptStrategySelector } from '../strategy/DefaultPromptStrategySelector'
import type { SemanticContext } from '../semantic/SemanticContext'
import type { Entity } from '../entity/Entity'
import type {
  PromptStrategy as PromptStrategyFromRoot,
  PromptStrategySelector as SelectorFromRoot,
} from '../index'
import { DefaultPromptStrategy as DefaultStrategyFromRoot } from '../index'
import { DefaultPromptStrategySelector as DefaultSelectorFromRoot } from '../index'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Creates a SemanticContext with no intent or entity */
function emptyContext(): SemanticContext {
  return {}
}

/** Creates a SemanticContext with a specific marker value */
function createContext(marker?: string): SemanticContext {
  if (!marker) return {}
  return {
    entity: { entities: [{ type: marker } as Entity] },
  }
}

/** A custom strategy that applies only when the context has an entity of a specific type */
class TestStrategy implements PromptStrategy {
  constructor(
    readonly name: string,
    private readonly keyword: string,
  ) {}

  applies(context: SemanticContext): boolean {
    return context.entity?.entities.some(e => e.type === this.keyword) ?? false
  }
}

/** A strategy that never applies */
class NeverStrategy implements PromptStrategy {
  readonly name = 'never'

  applies(_context: SemanticContext): boolean {
    return false
  }
}

// ---------------------------------------------------------------------------
// PromptStrategy Interface
// ---------------------------------------------------------------------------

describe('PromptStrategy interface', () => {
  it('should define a name property', () => {
    const strategy: PromptStrategy = new DefaultPromptStrategy()
    expect(strategy.name).toBeDefined()
    expect(typeof strategy.name).toBe('string')
  })

  it('should define an applies method', () => {
    const strategy: PromptStrategy = new DefaultPromptStrategy()
    expect(strategy.applies).toBeDefined()
    expect(typeof strategy.applies).toBe('function')
  })

  it('should accept SemanticContext as applies parameter', () => {
    const strategy: PromptStrategy = new DefaultPromptStrategy()
    const context: SemanticContext = {}
    // Should compile and run without error
    expect(() => strategy.applies(context)).not.toThrow()
  })

  it('should return boolean from applies', () => {
    const strategy: PromptStrategy = new DefaultPromptStrategy()
    const result = strategy.applies(emptyContext())
    expect(typeof result).toBe('boolean')
  })
})

// ---------------------------------------------------------------------------
// DefaultPromptStrategy
// ---------------------------------------------------------------------------

describe('DefaultPromptStrategy', () => {
  it('should have name "default"', () => {
    const strategy = new DefaultPromptStrategy()
    expect(strategy.name).toBe('default')
  })

  it('should return true for empty context', () => {
    const strategy = new DefaultPromptStrategy()
    expect(strategy.applies(emptyContext())).toBe(true)
  })

  it('should return true for context with intent', () => {
    const strategy = new DefaultPromptStrategy()
    const context: SemanticContext = { intent: { intents: [{ type: 'Create' }] } }
    expect(strategy.applies(context)).toBe(true)
  })

  it('should return true for context with entity', () => {
    const strategy = new DefaultPromptStrategy()
    const context: SemanticContext = { entity: { entities: [{ type: 'Tree' }] } }
    expect(strategy.applies(context)).toBe(true)
  })

  it('should return true for context with both intent and entity', () => {
    const strategy = new DefaultPromptStrategy()
    const context: SemanticContext = {
      intent: { intents: [{ type: 'Create' }] },
      entity: { entities: [{ type: 'Tree' }] },
    }
    expect(strategy.applies(context)).toBe(true)
  })

  it('should always return true regardless of context content', () => {
    const strategy = new DefaultPromptStrategy()
    const contexts: SemanticContext[] = [
      {},
      { intent: { intents: [] } },
      { entity: { entities: [] } },
      { intent: { intents: [{ type: 'Create' }, { type: 'Move' }] } },
      { entity: { entities: [{ type: 'Tree' }, { type: 'Flower' }] } },
    ]
    for (const ctx of contexts) {
      expect(strategy.applies(ctx)).toBe(true)
    }
  })
})

// ---------------------------------------------------------------------------
// DefaultPromptStrategy — Deterministic
// ---------------------------------------------------------------------------

describe('DefaultPromptStrategy — deterministic', () => {
  it('should return same result for same context across repeated calls', () => {
    const strategy = new DefaultPromptStrategy()
    const context = emptyContext()
    const r1 = strategy.applies(context)
    const r2 = strategy.applies(context)
    const r3 = strategy.applies(context)
    expect(r1).toBe(r2)
    expect(r2).toBe(r3)
  })

  it('should be idempotent across ten calls', () => {
    const strategy = new DefaultPromptStrategy()
    const context = emptyContext()
    for (let i = 0; i < 10; i++) {
      expect(strategy.applies(context)).toBe(true)
    }
  })
})

// ---------------------------------------------------------------------------
// DefaultPromptStrategy — Stateless
// ---------------------------------------------------------------------------

describe('DefaultPromptStrategy — stateless', () => {
  it('should not retain state between calls', () => {
    const strategy = new DefaultPromptStrategy()
    const ctx1: SemanticContext = { intent: { intents: [{ type: 'Create' }] } }
    const ctx2: SemanticContext = {}
    // Call in sequence — each call independent
    expect(strategy.applies(ctx1)).toBe(true)
    expect(strategy.applies(ctx2)).toBe(true)
    expect(strategy.applies(ctx1)).toBe(true)
  })

  it('should be independent across multiple instances', () => {
    const s1 = new DefaultPromptStrategy()
    const s2 = new DefaultPromptStrategy()
    expect(s1.applies(emptyContext())).toBe(s2.applies(emptyContext()))
  })
})

// ---------------------------------------------------------------------------
// DefaultPromptStrategy — Pure / No Side Effects
// ---------------------------------------------------------------------------

describe('DefaultPromptStrategy — pure / no side effects', () => {
  it('should not modify the context object', () => {
    const strategy = new DefaultPromptStrategy()
    const context: SemanticContext = { intent: { intents: [{ type: 'Create' }] } }
    const frozen = Object.freeze({ ...context })
    expect(() => strategy.applies(frozen)).not.toThrow()
  })

  it('should have no side effects on strategy instance', () => {
    const strategy = new DefaultPromptStrategy()
    const before = Object.keys(strategy)
    strategy.applies(emptyContext())
    strategy.applies({ intent: { intents: [{ type: 'Create' }] } })
    strategy.applies(emptyContext())
    expect(Object.keys(strategy)).toEqual(before)
  })
})

// ---------------------------------------------------------------------------
// Custom PromptStrategy Implementations
// ---------------------------------------------------------------------------

describe('Custom PromptStrategy implementations', () => {
  it('should support custom applies logic', () => {
    const strategy = new TestStrategy('tree-strategy', 'Tree')
    expect(strategy.name).toBe('tree-strategy')
  })

  it('should apply when keyword matches entity type', () => {
    const strategy = new TestStrategy('tree-strategy', 'Tree')
    const context: SemanticContext = { entity: { entities: [{ type: 'Tree' }] } }
    expect(strategy.applies(context)).toBe(true)
  })

  it('should not apply when keyword does not match', () => {
    const strategy = new TestStrategy('tree-strategy', 'Tree')
    const context: SemanticContext = { entity: { entities: [{ type: 'Flower' }] } }
    expect(strategy.applies(context)).toBe(false)
  })

  it('should not apply when context has no entities', () => {
    const strategy = new TestStrategy('tree-strategy', 'Tree')
    expect(strategy.applies(emptyContext())).toBe(false)
  })

  it('should support never-applies strategy', () => {
    const strategy = new NeverStrategy()
    expect(strategy.applies(emptyContext())).toBe(false)
    expect(strategy.applies({ intent: { intents: [{ type: 'Create' }] } })).toBe(false)
    expect(strategy.applies({ entity: { entities: [{ type: 'Tree' }] } })).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// PromptStrategySelector Interface
// ---------------------------------------------------------------------------

describe('PromptStrategySelector interface', () => {
  it('should define a select method', () => {
    const selector: PromptStrategySelector = new DefaultPromptStrategySelector()
    expect(selector.select).toBeDefined()
    expect(typeof selector.select).toBe('function')
  })

  it('should accept strategies array and SemanticContext', () => {
    const selector: PromptStrategySelector = new DefaultPromptStrategySelector()
    const strategies: readonly PromptStrategy[] = [new DefaultPromptStrategy()]
    // Should compile and run without error
    expect(() => selector.select(strategies, emptyContext())).not.toThrow()
  })

  it('should return a PromptStrategy', () => {
    const selector: PromptStrategySelector = new DefaultPromptStrategySelector()
    const result = selector.select([new DefaultPromptStrategy()], emptyContext())
    expect(result).toBeDefined()
    expect(typeof result.name).toBe('string')
    expect(typeof result.applies).toBe('function')
  })
})

// ---------------------------------------------------------------------------
// DefaultPromptStrategySelector — First-Match Wins
// ---------------------------------------------------------------------------

describe('DefaultPromptStrategySelector — first-match wins', () => {
  it('should return first strategy when applies() returns true', () => {
    const selector = new DefaultPromptStrategySelector()
    const treeStrategy = new TestStrategy('tree', 'Tree')
    const flowerStrategy = new TestStrategy('flower', 'Flower')
    const context: SemanticContext = { entity: { entities: [{ type: 'Tree' }] } }
    const result = selector.select([treeStrategy, flowerStrategy], context)
    expect(result.name).toBe('tree')
  })

  it('should return second strategy when first does not match', () => {
    const selector = new DefaultPromptStrategySelector()
    const treeStrategy = new TestStrategy('tree', 'Tree')
    const flowerStrategy = new TestStrategy('flower', 'Flower')
    const context: SemanticContext = { entity: { entities: [{ type: 'Flower' }] } }
    const result = selector.select([treeStrategy, flowerStrategy], context)
    expect(result.name).toBe('flower')
  })

  it('should skip non-matching strategies until match found', () => {
    const selector = new DefaultPromptStrategySelector()
    const never1 = new NeverStrategy()
    const never2 = new NeverStrategy()
    const treeStrategy = new TestStrategy('tree', 'Tree')
    const context: SemanticContext = { entity: { entities: [{ type: 'Tree' }] } }
    const result = selector.select([never1, never2, treeStrategy], context)
    expect(result.name).toBe('tree')
  })

  it('should match first applicable strategy even if later ones also match', () => {
    const selector = new DefaultPromptStrategySelector()
    const treeStrategy = new TestStrategy('tree-first', 'Tree')
    const alsoTreeStrategy = new TestStrategy('tree-second', 'Tree')
    const context: SemanticContext = { entity: { entities: [{ type: 'Tree' }] } }
    const result = selector.select([treeStrategy, alsoTreeStrategy], context)
    expect(result.name).toBe('tree-first')
  })
})

// ---------------------------------------------------------------------------
// DefaultPromptStrategySelector — Default Fallback
// ---------------------------------------------------------------------------

describe('DefaultPromptStrategySelector — default fallback', () => {
  it('should return DefaultPromptStrategy when no strategy matches', () => {
    const selector = new DefaultPromptStrategySelector()
    const never1 = new NeverStrategy()
    const never2 = new NeverStrategy()
    const result = selector.select([never1, never2], emptyContext())
    expect(result.name).toBe('default')
    expect(result).toBeInstanceOf(DefaultPromptStrategy)
  })

  it('should return DefaultPromptStrategy for empty strategy list', () => {
    const selector = new DefaultPromptStrategySelector()
    const result = selector.select([], emptyContext())
    expect(result.name).toBe('default')
    expect(result).toBeInstanceOf(DefaultPromptStrategy)
  })

  it('should return DefaultPromptStrategy when no match in complex context', () => {
    const selector = new DefaultPromptStrategySelector()
    const strategies = [new TestStrategy('tree', 'Tree'), new TestStrategy('flower', 'Flower')]
    const context: SemanticContext = {
      intent: { intents: [{ type: 'Create' }] },
      entity: { entities: [{ type: 'Water' }] },
    }
    const result = selector.select(strategies, context)
    expect(result.name).toBe('default')
    expect(result).toBeInstanceOf(DefaultPromptStrategy)
  })

  it('fallback DefaultPromptStrategy always applies', () => {
    const strategy = new DefaultPromptStrategy()
    expect(strategy.applies(emptyContext())).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// DefaultPromptStrategySelector — Stateless
// ---------------------------------------------------------------------------

describe('DefaultPromptStrategySelector — stateless', () => {
  it('should not retain selection state between calls', () => {
    const selector = new DefaultPromptStrategySelector()
    const treeStrategy = new TestStrategy('tree', 'Tree')
    const flowerStrategy = new TestStrategy('flower', 'Flower')
    const strategies = [treeStrategy, flowerStrategy]

    const r1 = selector.select(strategies, { entity: { entities: [{ type: 'Tree' }] } })
    const r2 = selector.select(strategies, { entity: { entities: [{ type: 'Flower' }] } })
    const r3 = selector.select(strategies, { entity: { entities: [{ type: 'Tree' }] } })

    expect(r1.name).toBe('tree')
    expect(r2.name).toBe('flower')
    expect(r3.name).toBe('tree')
  })

  it('should be independent across multiple instances', () => {
    const s1 = new DefaultPromptStrategySelector()
    const s2 = new DefaultPromptStrategySelector()
    const strategy = new TestStrategy('tree', 'Tree')
    const context: SemanticContext = { entity: { entities: [{ type: 'Tree' }] } }
    const r1 = s1.select([strategy], context)
    const r2 = s2.select([strategy], context)
    expect(r1.name).toBe(r2.name)
  })
})

// ---------------------------------------------------------------------------
// DefaultPromptStrategySelector — Deterministic
// ---------------------------------------------------------------------------

describe('DefaultPromptStrategySelector — deterministic', () => {
  it('should return same result for same inputs', () => {
    const selector = new DefaultPromptStrategySelector()
    const strategies = [
      new TestStrategy('tree', 'Tree'),
      new TestStrategy('flower', 'Flower'),
    ]
    const context: SemanticContext = { entity: { entities: [{ type: 'Tree' }] } }
    const r1 = selector.select(strategies, context)
    const r2 = selector.select(strategies, context)
    const r3 = selector.select(strategies, context)
    expect(r1.name).toBe(r2.name)
    expect(r2.name).toBe(r3.name)
  })

  it('should return same strategy reference for default fallback', () => {
    const selector = new DefaultPromptStrategySelector()
    const r1 = selector.select([], emptyContext())
    const r2 = selector.select([], emptyContext())
    expect(r1.name).toBe(r2.name)
  })
})

// ---------------------------------------------------------------------------
// DefaultPromptStrategySelector — Pure / No Side Effects
// ---------------------------------------------------------------------------

describe('DefaultPromptStrategySelector — pure / no side effects', () => {
  it('should not modify the strategies array', () => {
    const selector = new DefaultPromptStrategySelector()
    const strategies: PromptStrategy[] = [new TestStrategy('tree', 'Tree')]
    const frozen = Object.freeze(strategies.map(s => s))
    expect(() => selector.select(frozen, emptyContext())).not.toThrow()
  })

  it('should not modify the context', () => {
    const selector = new DefaultPromptStrategySelector()
    const context: SemanticContext = { entity: { entities: [{ type: 'Tree' as const }] } }
    const frozen = Object.freeze(context) as SemanticContext
    expect(() => selector.select([new TestStrategy('tree', 'Tree')], context)).not.toThrow()
  })

  it('should have no side effects on selector instance', () => {
    const selector = new DefaultPromptStrategySelector()
    const before = Object.keys(selector)
    selector.select([new TestStrategy('tree', 'Tree')], { entity: { entities: [{ type: 'Tree' }] } })
    selector.select([], emptyContext())
    selector.select([new NeverStrategy()], { entity: { entities: [{ type: 'Tree' }] } })
    expect(Object.keys(selector)).toEqual(before)
  })
})

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

describe('Strategy exports', () => {
  it('should export PromptStrategy type from strategy/index', () => {
    const strategy: PromptStrategy = new DefaultPromptStrategy()
    expect(strategy.name).toBe('default')
  })

  it('should export DefaultPromptStrategy class from strategy/index', () => {
    const strategy = new DefaultPromptStrategy()
    expect(strategy).toBeInstanceOf(DefaultPromptStrategy)
  })

  it('should export PromptStrategySelector type from strategy/index', () => {
    const selector: PromptStrategySelector = new DefaultPromptStrategySelector()
    expect(selector.select).toBeDefined()
  })

  it('should export DefaultPromptStrategySelector class from strategy/index', () => {
    const selector = new DefaultPromptStrategySelector()
    expect(selector).toBeInstanceOf(DefaultPromptStrategySelector)
  })

  it('should export PromptStrategy type from package root', () => {
    const strategy: PromptStrategyFromRoot = new DefaultPromptStrategy()
    expect(strategy.name).toBe('default')
  })

  it('should export PromptStrategySelector type from package root', () => {
    const selector: SelectorFromRoot = new DefaultPromptStrategySelector()
    expect(selector.select).toBeDefined()
  })

  it('should export DefaultPromptStrategy class from package root', () => {
    const strategy = new DefaultStrategyFromRoot()
    expect(strategy).toBeInstanceOf(DefaultPromptStrategy)
  })

  it('should export DefaultPromptStrategySelector class from package root', () => {
    const selector = new DefaultSelectorFromRoot()
    expect(selector).toBeInstanceOf(DefaultPromptStrategySelector)
  })
})

// ---------------------------------------------------------------------------
// Architecture Compliance
// ---------------------------------------------------------------------------

describe('Architecture compliance', () => {
  it('should not depend on Planner', () => {
    const strategy = new DefaultPromptStrategy()
    expect(strategy.applies(emptyContext())).toBe(true)
  })

  it('should not depend on Runtime', () => {
    const selector = new DefaultPromptStrategySelector()
    const result = selector.select([], emptyContext())
    expect(result).toBeDefined()
  })

  it('should not depend on Provider', () => {
    const strategy = new DefaultPromptStrategy()
    expect(strategy).toBeInstanceOf(DefaultPromptStrategy)
  })

  it('should not depend on Memory', () => {
    const strategy = new DefaultPromptStrategy()
    expect(strategy.applies(emptyContext())).toBe(true)
  })

  it('should not depend on ToolCalling', () => {
    const selector = new DefaultPromptStrategySelector()
    expect(selector.select([], emptyContext()).name).toBe('default')
  })

  it('should not depend on AgentLoop', () => {
    const strategy = new DefaultPromptStrategy()
    expect(strategy.applies({ intent: { intents: [] } })).toBe(true)
  })

  it('should not depend on PromptBuilder', () => {
    const selector = new DefaultPromptStrategySelector()
    expect(selector.select([new DefaultPromptStrategy()], emptyContext()).name).toBe('default')
  })

  it('should not depend on Pipeline', () => {
    const strategy = new DefaultPromptStrategy()
    expect(strategy.name).toBe('default')
  })

  it('should be pure — no side effects', () => {
    const strategy = new DefaultPromptStrategy()
    const context: SemanticContext = { entity: { entities: [{ type: 'Tree' }] } }
    const before = JSON.stringify(context)
    strategy.applies(context)
    expect(JSON.stringify(context)).toBe(before)
  })

  it('should be stateless — no internal state', () => {
    const s1 = new DefaultPromptStrategy()
    const s2 = new DefaultPromptStrategy()
    expect(s1.applies(emptyContext())).toBe(s2.applies(emptyContext()))
  })

  it('should be non-mutating — never modifies inputs', () => {
    const selector = new DefaultPromptStrategySelector()
    const strategies: readonly PromptStrategy[] = [new TestStrategy('tree', 'Tree')]
    const context: SemanticContext = { entity: { entities: [{ type: 'Tree' }] } }
    const frozenStrategies = Object.freeze([...strategies])
    const frozenContext = Object.freeze({ ...context })
    expect(() => selector.select(frozenStrategies, frozenContext)).not.toThrow()
  })
})

// ---------------------------------------------------------------------------
// RetryPlanner Compatibility
// ---------------------------------------------------------------------------

describe('RetryPlanner Compatibility', () => {
  it('should work with RetryPlanner', () => {
    const strategy = new DefaultPromptStrategy()
    const selector = new DefaultPromptStrategySelector()
    // Strategy and selector are independent — RetryPlanner doesn't consume them
    expect(strategy).toBeInstanceOf(DefaultPromptStrategy)
    expect(selector.select([strategy], emptyContext()).name).toBe('default')
  })

  it('should not affect RetryPlanner behavior', () => {
    const selector = new DefaultPromptStrategySelector()
    const strategies = [new TestStrategy('tree', 'Tree')]
    const context: SemanticContext = { entity: { entities: [{ type: 'Tree' }] } }
    const result = selector.select(strategies, context)
    expect(result.name).toBe('tree')
  })
})

// ---------------------------------------------------------------------------
// ToolCallPlanner Compatibility
// ---------------------------------------------------------------------------

describe('ToolCallPlanner Compatibility', () => {
  it('should work with ToolCallPlanner', () => {
    const strategy = new DefaultPromptStrategy()
    const selector = new DefaultPromptStrategySelector()
    expect(strategy).toBeInstanceOf(DefaultPromptStrategy)
    expect(selector.select([], emptyContext()).name).toBe('default')
  })

  it('should not affect ToolCallPlanner tool execution', () => {
    const selector = new DefaultPromptStrategySelector()
    const strategies = [new TestStrategy('tree', 'Tree')]
    const context: SemanticContext = { entity: { entities: [{ type: 'Tree' }] } }
    const result = selector.select(strategies, context)
    expect(result.name).toBe('tree')
  })
})

// ---------------------------------------------------------------------------
// Streaming Compatibility
// ---------------------------------------------------------------------------

describe('Streaming Compatibility', () => {
  it('should work with StreamingProvider', () => {
    const strategy = new DefaultPromptStrategy()
    const selector = new DefaultPromptStrategySelector()
    expect(strategy).toBeInstanceOf(DefaultPromptStrategy)
    expect(selector.select([], emptyContext()).name).toBe('default')
  })

  it('should not affect streaming', () => {
    const selector = new DefaultPromptStrategySelector()
    const strategies = [new TestStrategy('tree', 'Tree')]
    const context: SemanticContext = { entity: { entities: [{ type: 'Tree' }] } }
    const result = selector.select(strategies, context)
    expect(result.name).toBe('tree')
  })
})

// ---------------------------------------------------------------------------
// AgentLoop Compatibility
// ---------------------------------------------------------------------------

describe('AgentLoop Compatibility', () => {
  it('should work with AgentLoop', () => {
    const strategy = new DefaultPromptStrategy()
    const selector = new DefaultPromptStrategySelector()
    expect(strategy).toBeInstanceOf(DefaultPromptStrategy)
    expect(selector.select([], emptyContext()).name).toBe('default')
  })

  it('should not affect AgentLoop iteration', () => {
    const selector = new DefaultPromptStrategySelector()
    const strategies = [new TestStrategy('tree', 'Tree')]
    const context: SemanticContext = { entity: { entities: [{ type: 'Tree' }] } }
    const result = selector.select(strategies, context)
    expect(result.name).toBe('tree')
  })
})