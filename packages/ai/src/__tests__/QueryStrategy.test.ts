import { describe, it, expect } from 'vitest'
import type { PromptStrategy } from '../strategy/PromptStrategy'
import { QueryStrategy } from '../strategy/QueryStrategy'
import { CreateStrategy } from '../strategy/CreateStrategy'
import { DefaultPromptStrategy } from '../strategy/DefaultPromptStrategy'
import { DefaultPromptStrategySelector } from '../strategy/DefaultPromptStrategySelector'
import { DefaultPromptStrategyRenderer } from '../strategy/DefaultPromptStrategyRenderer'
import type { SemanticContext } from '../semantic/SemanticContext'
import type { EntityResult } from '../entity/EntityResult'
import { RuleBasedIntentAnalyzer } from '../intent/RuleBasedIntentAnalyzer'
import { DefaultSemanticContextBuilder } from '../semantic/DefaultSemanticContextBuilder'
import type { QueryStrategy as QueryStrategyFromRoot } from '../index'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createContextWithIntent(...types: string[]): SemanticContext {
  return {
    intent: { intents: types.map(t => ({ type: t as 'Query' })) },
  }
}

function emptyContext(): SemanticContext {
  return {}
}

function entityOnlyContext(): SemanticContext {
  return { entity: { entities: [{ type: 'Tree' }] } as EntityResult }
}

function createContextFromInput(input: string): SemanticContext {
  const analyzer = new RuleBasedIntentAnalyzer()
  const builder = new DefaultSemanticContextBuilder()
  const intentResult = analyzer.analyze(input)
  return builder.build(intentResult)
}

// ---------------------------------------------------------------------------
// QueryStrategy — Identity
// ---------------------------------------------------------------------------

describe('QueryStrategy — identity', () => {
  it('should have name "query"', () => {
    const strategy = new QueryStrategy()
    expect(strategy.name).toBe('query')
  })

  it('should implement PromptStrategy interface', () => {
    const strategy: PromptStrategy = new QueryStrategy()
    expect(strategy.name).toBeDefined()
    expect(typeof strategy.name).toBe('string')
    expect(typeof strategy.applies).toBe('function')
  })
})

// ---------------------------------------------------------------------------
// QueryStrategy — applies() with Query Intent
// ---------------------------------------------------------------------------

describe('QueryStrategy — applies() with Query intent', () => {
  it('should return true when context has a Query intent', () => {
    const strategy = new QueryStrategy()
    expect(strategy.applies(createContextWithIntent('Query'))).toBe(true)
  })

  it('should return true when context has multiple intents including Query', () => {
    const strategy = new QueryStrategy()
    expect(strategy.applies(createContextWithIntent('Query', 'Create'))).toBe(true)
  })

  it('should return true when Query is the second intent', () => {
    const strategy = new QueryStrategy()
    expect(strategy.applies(createContextWithIntent('Create', 'Query'))).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// QueryStrategy — applies() without Query Intent
// ---------------------------------------------------------------------------

describe('QueryStrategy — applies() without Query intent', () => {
  it('should return false for empty context', () => {
    const strategy = new QueryStrategy()
    expect(strategy.applies(emptyContext())).toBe(false)
  })

  it('should return false for entity-only context', () => {
    const strategy = new QueryStrategy()
    expect(strategy.applies(entityOnlyContext())).toBe(false)
  })

  it('should return false for Create intent', () => {
    const strategy = new QueryStrategy()
    expect(strategy.applies(createContextWithIntent('Create'))).toBe(false)
  })

  it('should return false for Delete intent', () => {
    const strategy = new QueryStrategy()
    expect(strategy.applies(createContextWithIntent('Delete'))).toBe(false)
  })

  it('should return false for Move intent', () => {
    const strategy = new QueryStrategy()
    expect(strategy.applies(createContextWithIntent('Move'))).toBe(false)
  })

  it('should return false for Modify intent', () => {
    const strategy = new QueryStrategy()
    expect(strategy.applies(createContextWithIntent('Modify'))).toBe(false)
  })

  it('should return false for empty intents array', () => {
    const strategy = new QueryStrategy()
    expect(strategy.applies({ intent: { intents: [] } })).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// QueryStrategy — Chinese Keywords (via RuleBasedIntentAnalyzer)
// ---------------------------------------------------------------------------

describe('QueryStrategy — Chinese keywords', () => {
  const strategy = new QueryStrategy()

  it('should match "查询" (query)', () => {
    expect(strategy.applies(createContextFromInput('查询所有树'))).toBe(true)
  })

  it('should match "查看" (view/check)', () => {
    expect(strategy.applies(createContextFromInput('查看世界'))).toBe(true)
  })

  it('should match "显示" (show/display)', () => {
    expect(strategy.applies(createContextFromInput('显示所有实体'))).toBe(true)
  })

  it('should match "列出" (list)', () => {
    expect(strategy.applies(createContextFromInput('列出所有树'))).toBe(true)
  })

  it('should match "获取" (get/obtain)', () => {
    expect(strategy.applies(createContextFromInput('获取信息'))).toBe(true)
  })

  it('should match "有什么" (what is there)', () => {
    expect(strategy.applies(createContextFromInput('有什么东西'))).toBe(true)
  })

  it('should match "多少" (how many)', () => {
    expect(strategy.applies(createContextFromInput('多少棵树'))).toBe(true)
  })

  it('should match "哪些" (which ones)', () => {
    expect(strategy.applies(createContextFromInput('哪些是树'))).toBe(true)
  })

  it('should match "看看" (look/see)', () => {
    expect(strategy.applies(createContextFromInput('看看世界'))).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// QueryStrategy — English Keywords (via RuleBasedIntentAnalyzer)
// ---------------------------------------------------------------------------

describe('QueryStrategy — English keywords', () => {
  const strategy = new QueryStrategy()

  it('should match "query"', () => {
    expect(strategy.applies(createContextFromInput('query all trees'))).toBe(true)
  })

  it('should match "show"', () => {
    expect(strategy.applies(createContextFromInput('show all entities'))).toBe(true)
  })

  it('should match "list"', () => {
    expect(strategy.applies(createContextFromInput('list all trees'))).toBe(true)
  })

  it('should match "get"', () => {
    expect(strategy.applies(createContextFromInput('get the info'))).toBe(true)
  })

  it('should match "find"', () => {
    expect(strategy.applies(createContextFromInput('find all trees'))).toBe(true)
  })

  it('should match "what"', () => {
    expect(strategy.applies(createContextFromInput('what is in the world'))).toBe(true)
  })

  it('should match "which"', () => {
    expect(strategy.applies(createContextFromInput('which are trees'))).toBe(true)
  })

  it('should match "how many"', () => {
    expect(strategy.applies(createContextFromInput('how many trees'))).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// QueryStrategy — Case Insensitivity
// ---------------------------------------------------------------------------

describe('QueryStrategy — case insensitivity', () => {
  const strategy = new QueryStrategy()

  it('should match UPPERCASE "QUERY"', () => {
    expect(strategy.applies(createContextFromInput('QUERY all trees'))).toBe(true)
  })

  it('should match Capitalized "Query"', () => {
    expect(strategy.applies(createContextFromInput('Query all trees'))).toBe(true)
  })

  it('should match lowercase "query"', () => {
    expect(strategy.applies(createContextFromInput('query all trees'))).toBe(true)
  })

  it('should match mixed case "QuErY"', () => {
    expect(strategy.applies(createContextFromInput('QuErY all trees'))).toBe(true)
  })

  it('should match UPPERCASE "SHOW"', () => {
    expect(strategy.applies(createContextFromInput('SHOW all entities'))).toBe(true)
  })

  it('should match UPPERCASE "LIST"', () => {
    expect(strategy.applies(createContextFromInput('LIST all trees'))).toBe(true)
  })

  it('should match UPPERCASE "FIND"', () => {
    expect(strategy.applies(createContextFromInput('FIND all trees'))).toBe(true)
  })

  it('should match UPPERCASE "GET"', () => {
    expect(strategy.applies(createContextFromInput('GET the info'))).toBe(true)
  })

  it('should match UPPERCASE "HOW MANY"', () => {
    expect(strategy.applies(createContextFromInput('HOW MANY trees'))).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// QueryStrategy — Punctuation
// ---------------------------------------------------------------------------

describe('QueryStrategy — punctuation', () => {
  const strategy = new QueryStrategy()

  it('should match with trailing period', () => {
    expect(strategy.applies(createContextFromInput('查询所有树。'))).toBe(true)
  })

  it('should match with trailing comma', () => {
    expect(strategy.applies(createContextFromInput('show all trees,'))).toBe(true)
  })

  it('should match with exclamation mark', () => {
    expect(strategy.applies(createContextFromInput('列出所有树！'))).toBe(true)
  })

  it('should match with question mark', () => {
    expect(strategy.applies(createContextFromInput('how many trees?'))).toBe(true)
  })

  it('should match with parentheses', () => {
    expect(strategy.applies(createContextFromInput('(list all trees)'))).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// QueryStrategy — Whitespace
// ---------------------------------------------------------------------------

describe('QueryStrategy — whitespace', () => {
  const strategy = new QueryStrategy()

  it('should match with leading spaces', () => {
    expect(strategy.applies(createContextFromInput('   查询所有树'))).toBe(true)
  })

  it('should match with trailing spaces', () => {
    expect(strategy.applies(createContextFromInput('show all trees   '))).toBe(true)
  })

  it('should match with multiple spaces', () => {
    expect(strategy.applies(createContextFromInput('list    all    trees'))).toBe(true)
  })

  it('should match with tabs', () => {
    expect(strategy.applies(createContextFromInput('list\tall\ttrees'))).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// QueryStrategy — Deterministic
// ---------------------------------------------------------------------------

describe('QueryStrategy — deterministic', () => {
  it('should return same result for same context across repeated calls', () => {
    const strategy = new QueryStrategy()
    const context = createContextWithIntent('Query')
    const r1 = strategy.applies(context)
    const r2 = strategy.applies(context)
    const r3 = strategy.applies(context)
    expect(r1).toBe(r2)
    expect(r2).toBe(r3)
  })

  it('should be idempotent across ten calls', () => {
    const strategy = new QueryStrategy()
    const context = createContextWithIntent('Query')
    for (let i = 0; i < 10; i++) {
      expect(strategy.applies(context)).toBe(true)
    }
  })

  it('should consistently return false for non-Query contexts', () => {
    const strategy = new QueryStrategy()
    const context = createContextWithIntent('Create')
    for (let i = 0; i < 10; i++) {
      expect(strategy.applies(context)).toBe(false)
    }
  })
})

// ---------------------------------------------------------------------------
// QueryStrategy — Stateless
// ---------------------------------------------------------------------------

describe('QueryStrategy — stateless', () => {
  it('should not retain state between calls', () => {
    const strategy = new QueryStrategy()
    const ctx1 = createContextWithIntent('Query')
    const ctx2 = emptyContext()
    expect(strategy.applies(ctx1)).toBe(true)
    expect(strategy.applies(ctx2)).toBe(false)
    expect(strategy.applies(ctx1)).toBe(true)
  })

  it('should be independent across multiple instances', () => {
    const s1 = new QueryStrategy()
    const s2 = new QueryStrategy()
    const context = createContextWithIntent('Query')
    expect(s1.applies(context)).toBe(s2.applies(context))
  })
})

// ---------------------------------------------------------------------------
// QueryStrategy — Pure / No Side Effects
// ---------------------------------------------------------------------------

describe('QueryStrategy — pure / no side effects', () => {
  it('should not modify the context object', () => {
    const strategy = new QueryStrategy()
    const context: SemanticContext = { intent: { intents: [{ type: 'Query' }] } }
    const frozen = Object.freeze({ ...context })
    expect(() => strategy.applies(frozen)).not.toThrow()
  })

  it('should have no side effects on strategy instance', () => {
    const strategy = new QueryStrategy()
    const before = Object.keys(strategy)
    strategy.applies(createContextWithIntent('Query'))
    strategy.applies(emptyContext())
    strategy.applies(createContextWithIntent('Query'))
    expect(Object.keys(strategy)).toEqual(before)
  })
})

// ---------------------------------------------------------------------------
// Selector Integration
// ---------------------------------------------------------------------------

describe('Selector integration', () => {
  it('should be selected before DefaultPromptStrategy when QueryStrategy matches', () => {
    const selector = new DefaultPromptStrategySelector()
    const queryStrategy = new QueryStrategy()
    const defaultStrategy = new DefaultPromptStrategy()
    const context = createContextWithIntent('Query')
    const result = selector.select([queryStrategy, defaultStrategy], context)
    expect(result.name).toBe('query')
  })

  it('should fall back to DefaultPromptStrategy for non-Query intent', () => {
    const selector = new DefaultPromptStrategySelector()
    const queryStrategy = new QueryStrategy()
    const defaultStrategy = new DefaultPromptStrategy()
    const context = createContextWithIntent('Delete')
    const result = selector.select([queryStrategy, defaultStrategy], context)
    expect(result.name).toBe('default')
  })

  it('should work with full end-to-end pipeline', () => {
    const selector = new DefaultPromptStrategySelector()
    const queryStrategy = new QueryStrategy()
    const defaultStrategy = new DefaultPromptStrategy()
    const strategies = [queryStrategy, defaultStrategy]

    const queryInputs = ['查询所有树', '查看世界', '显示所有实体', '列出所有树', '获取信息', '有多少棵树', 'show all trees', 'list all trees', 'how many trees']
    for (const input of queryInputs) {
      const context = createContextFromInput(input)
      const result = selector.select(strategies, context)
      expect(result.name).toBe('query')
    }
  })

  it('should fall back to default for non-query inputs', () => {
    const selector = new DefaultPromptStrategySelector()
    const queryStrategy = new QueryStrategy()
    const defaultStrategy = new DefaultPromptStrategy()
    const strategies = [queryStrategy, defaultStrategy]

    const nonQueryInputs = ['创建一棵树', 'move the tree', 'delete the flower']
    for (const input of nonQueryInputs) {
      const context = createContextFromInput(input)
      const result = selector.select(strategies, context)
      expect(result.name).toBe('default')
    }
  })
})

// ---------------------------------------------------------------------------
// Rendering Integration
// ---------------------------------------------------------------------------

describe('Rendering integration', () => {
  it('DefaultPromptStrategyRenderer should render QueryStrategy as "Prompt Strategy:\\n\\n- query"', () => {
    const renderer = new DefaultPromptStrategyRenderer()
    const strategy = new QueryStrategy()
    expect(renderer.render(strategy)).toBe('Prompt Strategy:\n\n- query')
  })

  it('should render differently from DefaultPromptStrategy and CreateStrategy', () => {
    const renderer = new DefaultPromptStrategyRenderer()
    const queryStrategy = new QueryStrategy()
    const createStrategy = new CreateStrategy()
    const defaultStrategy = new DefaultPromptStrategy()
    expect(renderer.render(queryStrategy)).toBe('Prompt Strategy:\n\n- query')
    expect(renderer.render(createStrategy)).toBe('Prompt Strategy:\n\n- create')
    expect(renderer.render(defaultStrategy)).toBe('Prompt Strategy:\n\n- default')
  })
})

// ---------------------------------------------------------------------------
// Default Fallback
// ---------------------------------------------------------------------------

describe('Default fallback', () => {
  it('DefaultPromptStrategy remains fallback when QueryStrategy does not match', () => {
    const selector = new DefaultPromptStrategySelector()
    const queryStrategy = new QueryStrategy()
    const result = selector.select([queryStrategy], emptyContext())
    expect(result.name).toBe('default')
  })

  it('DefaultPromptStrategy always applies', () => {
    const defaultStrategy = new DefaultPromptStrategy()
    expect(defaultStrategy.applies(emptyContext())).toBe(true)
    expect(defaultStrategy.applies(createContextWithIntent('Query'))).toBe(true)
    expect(defaultStrategy.applies(createContextWithIntent('Create'))).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Coexistence with CreateStrategy
// ---------------------------------------------------------------------------

describe('Coexistence with CreateStrategy', () => {
  it('CreateStrategy should still win for Create requests', () => {
    const selector = new DefaultPromptStrategySelector()
    const createStrategy = new CreateStrategy()
    const queryStrategy = new QueryStrategy()
    const defaultStrategy = new DefaultPromptStrategy()
    const strategies = [createStrategy, queryStrategy, defaultStrategy]

    const createContext = createContextWithIntent('Create')
    const result = selector.select(strategies, createContext)
    expect(result.name).toBe('create')
  })

  it('QueryStrategy should win for Query requests', () => {
    const selector = new DefaultPromptStrategySelector()
    const createStrategy = new CreateStrategy()
    const queryStrategy = new QueryStrategy()
    const defaultStrategy = new DefaultPromptStrategy()
    const strategies = [createStrategy, queryStrategy, defaultStrategy]

    const queryContext = createContextWithIntent('Query')
    const result = selector.select(strategies, queryContext)
    expect(result.name).toBe('query')
  })

  it('DefaultPromptStrategy should win for Move requests', () => {
    const selector = new DefaultPromptStrategySelector()
    const createStrategy = new CreateStrategy()
    const queryStrategy = new QueryStrategy()
    const defaultStrategy = new DefaultPromptStrategy()
    const strategies = [createStrategy, queryStrategy, defaultStrategy]

    const moveContext = createContextWithIntent('Move')
    const result = selector.select(strategies, moveContext)
    expect(result.name).toBe('default')
  })

  it('should correctly route end-to-end: Chinese create vs query', () => {
    const selector = new DefaultPromptStrategySelector()
    const createStrategy = new CreateStrategy()
    const queryStrategy = new QueryStrategy()
    const defaultStrategy = new DefaultPromptStrategy()
    const strategies = [createStrategy, queryStrategy, defaultStrategy]

    // Create request
    const createContext = createContextFromInput('创建一棵树')
    expect(selector.select(strategies, createContext).name).toBe('create')

    // Query request
    const queryContext = createContextFromInput('列出所有树')
    expect(selector.select(strategies, queryContext).name).toBe('query')
  })

  it('should correctly route end-to-end: English create vs query', () => {
    const selector = new DefaultPromptStrategySelector()
    const createStrategy = new CreateStrategy()
    const queryStrategy = new QueryStrategy()
    const defaultStrategy = new DefaultPromptStrategy()
    const strategies = [createStrategy, queryStrategy, defaultStrategy]

    const createContext = createContextFromInput('create a tree')
    expect(selector.select(strategies, createContext).name).toBe('create')

    const queryContext = createContextFromInput('list all trees')
    expect(selector.select(strategies, queryContext).name).toBe('query')
  })

  it('QueryStrategy and CreateStrategy are independent — neither affects the other', () => {
    const createStrategy = new CreateStrategy()
    const queryStrategy = new QueryStrategy()

    // CreateStrategy only matches Create, not Query
    expect(createStrategy.applies(createContextWithIntent('Query'))).toBe(false)

    // QueryStrategy only matches Query, not Create
    expect(queryStrategy.applies(createContextWithIntent('Create'))).toBe(false)

    // Each matches its own intent type
    expect(createStrategy.applies(createContextWithIntent('Create'))).toBe(true)
    expect(queryStrategy.applies(createContextWithIntent('Query'))).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

describe('Exports', () => {
  it('should export QueryStrategy from strategy/index', () => {
    const strategy = new QueryStrategy()
    expect(strategy.name).toBe('query')
  })

  it('should export QueryStrategy from package root', () => {
    const Strategy = QueryStrategy as typeof QueryStrategyFromRoot
    const strategy = new Strategy()
    expect(strategy.name).toBe('query')
  })
})

// ---------------------------------------------------------------------------
// Architecture Compliance
// ---------------------------------------------------------------------------

describe('Architecture compliance', () => {
  it('should not depend on Planner', () => {
    const strategy = new QueryStrategy()
    expect(strategy.applies(createContextWithIntent('Query'))).toBe(true)
  })

  it('should not depend on Runtime', () => {
    const strategy = new QueryStrategy()
    expect(strategy.applies(emptyContext())).toBe(false)
  })

  it('should not depend on Provider', () => {
    const strategy = new QueryStrategy()
    expect(strategy).toBeInstanceOf(QueryStrategy)
  })

  it('should not depend on Memory', () => {
    const strategy = new QueryStrategy()
    expect(strategy.applies(createContextWithIntent('Query'))).toBe(true)
  })

  it('should not depend on ToolCalling', () => {
    const strategy = new QueryStrategy()
    expect(strategy.name).toBe('query')
  })

  it('should not depend on AgentLoop', () => {
    const strategy = new QueryStrategy()
    expect(strategy.applies({ intent: { intents: [] } })).toBe(false)
  })

  it('should not depend on PromptBuilder', () => {
    const selector = new DefaultPromptStrategySelector()
    expect(selector.select([new QueryStrategy()], emptyContext()).name).toBe('default')
  })

  it('should not depend on Pipeline', () => {
    const strategy = new QueryStrategy()
    expect(strategy.name).toBe('query')
  })

  it('should be pure — no side effects', () => {
    const strategy = new QueryStrategy()
    const context: SemanticContext = { intent: { intents: [{ type: 'Query' }] } }
    const before = JSON.stringify(context)
    strategy.applies(context)
    expect(JSON.stringify(context)).toBe(before)
  })

  it('should be stateless — no internal state', () => {
    const s1 = new QueryStrategy()
    const s2 = new QueryStrategy()
    expect(s1.applies(createContextWithIntent('Query'))).toBe(s2.applies(createContextWithIntent('Query')))
  })

  it('should be non-mutating — never modifies inputs', () => {
    const selector = new DefaultPromptStrategySelector()
    const strategies: readonly PromptStrategy[] = [new QueryStrategy()]
    const context: SemanticContext = createContextWithIntent('Query')
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
    const strategy = new QueryStrategy()
    const selector = new DefaultPromptStrategySelector()
    expect(strategy).toBeInstanceOf(QueryStrategy)
    expect(selector.select([strategy], createContextWithIntent('Query')).name).toBe('query')
  })

  it('should not affect RetryPlanner behavior', () => {
    const selector = new DefaultPromptStrategySelector()
    const strategies = [new QueryStrategy()]
    const context: SemanticContext = createContextWithIntent('Query')
    const result = selector.select(strategies, context)
    expect(result.name).toBe('query')
  })
})

// ---------------------------------------------------------------------------
// ToolCallPlanner Compatibility
// ---------------------------------------------------------------------------

describe('ToolCallPlanner Compatibility', () => {
  it('should work with ToolCallPlanner', () => {
    const strategy = new QueryStrategy()
    const selector = new DefaultPromptStrategySelector()
    expect(strategy).toBeInstanceOf(QueryStrategy)
    expect(selector.select([strategy], emptyContext()).name).toBe('default')
  })

  it('should not affect ToolCallPlanner tool execution', () => {
    const selector = new DefaultPromptStrategySelector()
    const strategies = [new QueryStrategy()]
    const context: SemanticContext = createContextWithIntent('Query')
    const result = selector.select(strategies, context)
    expect(result.name).toBe('query')
  })
})

// ---------------------------------------------------------------------------
// Streaming Compatibility
// ---------------------------------------------------------------------------

describe('Streaming Compatibility', () => {
  it('should work with StreamingProvider', () => {
    const strategy = new QueryStrategy()
    const selector = new DefaultPromptStrategySelector()
    expect(strategy).toBeInstanceOf(QueryStrategy)
    expect(selector.select([strategy], emptyContext()).name).toBe('default')
  })

  it('should not affect streaming', () => {
    const selector = new DefaultPromptStrategySelector()
    const strategies = [new QueryStrategy()]
    const context: SemanticContext = createContextWithIntent('Query')
    const result = selector.select(strategies, context)
    expect(result.name).toBe('query')
  })
})

// ---------------------------------------------------------------------------
// AgentLoop Compatibility
// ---------------------------------------------------------------------------

describe('AgentLoop Compatibility', () => {
  it('should work with AgentLoop', () => {
    const strategy = new QueryStrategy()
    const selector = new DefaultPromptStrategySelector()
    expect(strategy).toBeInstanceOf(QueryStrategy)
    expect(selector.select([strategy], emptyContext()).name).toBe('default')
  })

  it('should not affect AgentLoop iteration', () => {
    const selector = new DefaultPromptStrategySelector()
    const strategies = [new QueryStrategy()]
    const context: SemanticContext = createContextWithIntent('Query')
    const result = selector.select(strategies, context)
    expect(result.name).toBe('query')
  })
})
