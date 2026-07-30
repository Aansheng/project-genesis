import { describe, it, expect } from 'vitest'
import type { PromptStrategy } from '../strategy/PromptStrategy'
import { CreateStrategy } from '../strategy/CreateStrategy'
import { DefaultPromptStrategy } from '../strategy/DefaultPromptStrategy'

import { DefaultPromptStrategySelector } from '../strategy/DefaultPromptStrategySelector'
import { DefaultPromptStrategyRenderer } from '../strategy/DefaultPromptStrategyRenderer'
import type { SemanticContext } from '../semantic/SemanticContext'

import type { EntityResult } from '../entity/EntityResult'
import { RuleBasedIntentAnalyzer } from '../intent/RuleBasedIntentAnalyzer'
import { DefaultSemanticContextBuilder } from '../semantic/DefaultSemanticContextBuilder'
import type {
  CreateStrategy as CreateStrategyFromRoot,
} from '../index'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Creates a SemanticContext with a specific intent type */
function createContextWithIntent(...types: string[]): SemanticContext {
  return {
    intent: { intents: types.map(t => ({ type: t as 'Create' })) },
  }
}

/** Creates a SemanticContext with no intent */
function emptyContext(): SemanticContext {
  return {}
}

/** Creates a SemanticContext with entity only (no intent) */
function entityOnlyContext(): SemanticContext {
  return { entity: { entities: [{ type: 'Tree' }] } as EntityResult }
}

/** Creates a SemanticContext via RuleBasedIntentAnalyzer + DefaultSemanticContextBuilder */
function createContextFromInput(input: string): SemanticContext {
  const analyzer = new RuleBasedIntentAnalyzer()
  const builder = new DefaultSemanticContextBuilder()
  const intentResult = analyzer.analyze(input)
  return builder.build(intentResult)
}

// ---------------------------------------------------------------------------
// CreateStrategy — Identity
// ---------------------------------------------------------------------------

describe('CreateStrategy — identity', () => {
  it('should have name "create"', () => {
    const strategy = new CreateStrategy()
    expect(strategy.name).toBe('create')
  })

  it('should implement PromptStrategy interface', () => {
    const strategy: PromptStrategy = new CreateStrategy()
    expect(strategy.name).toBeDefined()
    expect(typeof strategy.name).toBe('string')
    expect(typeof strategy.applies).toBe('function')
  })
})

// ---------------------------------------------------------------------------
// CreateStrategy — applies() with Create Intent
// ---------------------------------------------------------------------------

describe('CreateStrategy — applies() with Create intent', () => {
  it('should return true when context has a Create intent', () => {
    const strategy = new CreateStrategy()
    expect(strategy.applies(createContextWithIntent('Create'))).toBe(true)
  })

  it('should return true when context has multiple intents including Create', () => {
    const strategy = new CreateStrategy()
    expect(strategy.applies(createContextWithIntent('Create', 'Move'))).toBe(true)
  })

  it('should return true when Create is the second intent', () => {
    const strategy = new CreateStrategy()
    expect(strategy.applies(createContextWithIntent('Move', 'Create'))).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// CreateStrategy — applies() without Create Intent
// ---------------------------------------------------------------------------

describe('CreateStrategy — applies() without Create intent', () => {
  it('should return false for empty context', () => {
    const strategy = new CreateStrategy()
    expect(strategy.applies(emptyContext())).toBe(false)
  })

  it('should return false for entity-only context', () => {
    const strategy = new CreateStrategy()
    expect(strategy.applies(entityOnlyContext())).toBe(false)
  })

  it('should return false for Delete intent', () => {
    const strategy = new CreateStrategy()
    expect(strategy.applies(createContextWithIntent('Delete'))).toBe(false)
  })

  it('should return false for Move intent', () => {
    const strategy = new CreateStrategy()
    expect(strategy.applies(createContextWithIntent('Move'))).toBe(false)
  })

  it('should return false for Modify intent', () => {
    const strategy = new CreateStrategy()
    expect(strategy.applies(createContextWithIntent('Modify'))).toBe(false)
  })

  it('should return false for Query intent', () => {
    const strategy = new CreateStrategy()
    expect(strategy.applies(createContextWithIntent('Query'))).toBe(false)
  })

  it('should return false for empty intents array', () => {
    const strategy = new CreateStrategy()
    expect(strategy.applies({ intent: { intents: [] } })).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// CreateStrategy — Chinese Keywords (via RuleBasedIntentAnalyzer)
// ---------------------------------------------------------------------------

describe('CreateStrategy — Chinese keywords', () => {
  const strategy = new CreateStrategy()

  it('should match "创建" (create)', () => {
    expect(strategy.applies(createContextFromInput('创建一棵树'))).toBe(true)
  })

  it('should match "生成" (generate)', () => {
    expect(strategy.applies(createContextFromInput('生成一个房子'))).toBe(true)
  })

  it('should match "画" (draw)', () => {
    expect(strategy.applies(createContextFromInput('画一朵花'))).toBe(true)
  })

  it('should match "添加" (add)', () => {
    expect(strategy.applies(createContextFromInput('添加一个角色'))).toBe(true)
  })

  it('should match "新建" (new/build)', () => {
    expect(strategy.applies(createContextFromInput('新建一棵树'))).toBe(true)
  })

  it('should match "制造" (manufacture)', () => {
    expect(strategy.applies(createContextFromInput('制造一个东西'))).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// CreateStrategy — English Keywords (via RuleBasedIntentAnalyzer)
// ---------------------------------------------------------------------------

describe('CreateStrategy — English keywords', () => {
  const strategy = new CreateStrategy()

  it('should match "create"', () => {
    expect(strategy.applies(createContextFromInput('create a tree'))).toBe(true)
  })

  it('should match "generate"', () => {
    expect(strategy.applies(createContextFromInput('generate a house'))).toBe(true)
  })

  it('should match "draw"', () => {
    expect(strategy.applies(createContextFromInput('draw a flower'))).toBe(true)
  })

  it('should match "add"', () => {
    expect(strategy.applies(createContextFromInput('add a character'))).toBe(true)
  })

  it('should match "spawn"', () => {
    expect(strategy.applies(createContextFromInput('spawn a tree'))).toBe(true)
  })

  it('should match "build"', () => {
    expect(strategy.applies(createContextFromInput('build a house'))).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// CreateStrategy — Case Insensitivity (via RuleBasedIntentAnalyzer)
// ---------------------------------------------------------------------------

describe('CreateStrategy — case insensitivity', () => {
  const strategy = new CreateStrategy()

  it('should match UPPERCASE "CREATE"', () => {
    expect(strategy.applies(createContextFromInput('CREATE a tree'))).toBe(true)
  })

  it('should match Capitalized "Create"', () => {
    expect(strategy.applies(createContextFromInput('Create a tree'))).toBe(true)
  })

  it('should match lowercase "create"', () => {
    expect(strategy.applies(createContextFromInput('create a tree'))).toBe(true)
  })

  it('should match mixed case "CrEaTe"', () => {
    expect(strategy.applies(createContextFromInput('CrEaTe a tree'))).toBe(true)
  })

  it('should match UPPERCASE "GENERATE"', () => {
    expect(strategy.applies(createContextFromInput('GENERATE a house'))).toBe(true)
  })

  it('should match UPPERCASE "DRAW"', () => {
    expect(strategy.applies(createContextFromInput('DRAW a flower'))).toBe(true)
  })

  it('should match UPPERCASE "SPAWN"', () => {
    expect(strategy.applies(createContextFromInput('SPAWN a tree'))).toBe(true)
  })

  it('should match UPPERCASE "BUILD"', () => {
    expect(strategy.applies(createContextFromInput('BUILD a house'))).toBe(true)
  })

  it('should match UPPERCASE "ADD"', () => {
    expect(strategy.applies(createContextFromInput('ADD a character'))).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// CreateStrategy — Punctuation (via RuleBasedIntentAnalyzer)
// ---------------------------------------------------------------------------

describe('CreateStrategy — punctuation', () => {
  const strategy = new CreateStrategy()

  it('should match with trailing period', () => {
    expect(strategy.applies(createContextFromInput('创建一棵树。'))).toBe(true)
  })

  it('should match with trailing comma', () => {
    expect(strategy.applies(createContextFromInput('create a tree,'))).toBe(true)
  })

  it('should match with exclamation mark', () => {
    expect(strategy.applies(createContextFromInput('画一朵花！'))).toBe(true)
  })

  it('should match with question mark', () => {
    expect(strategy.applies(createContextFromInput('draw a flower?'))).toBe(true)
  })

  it('should match with parentheses', () => {
    expect(strategy.applies(createContextFromInput('(create a tree)'))).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// CreateStrategy — Whitespace (via RuleBasedIntentAnalyzer)
// ---------------------------------------------------------------------------

describe('CreateStrategy — whitespace', () => {
  const strategy = new CreateStrategy()

  it('should match with leading spaces', () => {
    expect(strategy.applies(createContextFromInput('   创建一棵树'))).toBe(true)
  })

  it('should match with trailing spaces', () => {
    expect(strategy.applies(createContextFromInput('create a tree   '))).toBe(true)
  })

  it('should match with multiple spaces', () => {
    expect(strategy.applies(createContextFromInput('create    a    tree'))).toBe(true)
  })

  it('should match with tabs', () => {
    expect(strategy.applies(createContextFromInput('create\ta\ttree'))).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// CreateStrategy — Deterministic
// ---------------------------------------------------------------------------

describe('CreateStrategy — deterministic', () => {
  it('should return same result for same context across repeated calls', () => {
    const strategy = new CreateStrategy()
    const context = createContextWithIntent('Create')
    const r1 = strategy.applies(context)
    const r2 = strategy.applies(context)
    const r3 = strategy.applies(context)
    expect(r1).toBe(r2)
    expect(r2).toBe(r3)
  })

  it('should be idempotent across ten calls', () => {
    const strategy = new CreateStrategy()
    const context = createContextWithIntent('Create')
    for (let i = 0; i < 10; i++) {
      expect(strategy.applies(context)).toBe(true)
    }
  })

  it('should consistently return false for non-Create contexts', () => {
    const strategy = new CreateStrategy()
    const context = createContextWithIntent('Move')
    for (let i = 0; i < 10; i++) {
      expect(strategy.applies(context)).toBe(false)
    }
  })
})

// ---------------------------------------------------------------------------
// CreateStrategy — Stateless
// ---------------------------------------------------------------------------

describe('CreateStrategy — stateless', () => {
  it('should not retain state between calls', () => {
    const strategy = new CreateStrategy()
    const ctx1 = createContextWithIntent('Create')
    const ctx2 = emptyContext()
    // Call in sequence — each call independent
    expect(strategy.applies(ctx1)).toBe(true)
    expect(strategy.applies(ctx2)).toBe(false)
    expect(strategy.applies(ctx1)).toBe(true)
  })

  it('should be independent across multiple instances', () => {
    const s1 = new CreateStrategy()
    const s2 = new CreateStrategy()
    const context = createContextWithIntent('Create')
    expect(s1.applies(context)).toBe(s2.applies(context))
  })
})

// ---------------------------------------------------------------------------
// CreateStrategy — Pure / No Side Effects
// ---------------------------------------------------------------------------

describe('CreateStrategy — pure / no side effects', () => {
  it('should not modify the context object', () => {
    const strategy = new CreateStrategy()
    const context: SemanticContext = { intent: { intents: [{ type: 'Create' }] } }
    const frozen = Object.freeze({ ...context })
    expect(() => strategy.applies(frozen)).not.toThrow()
  })

  it('should have no side effects on strategy instance', () => {
    const strategy = new CreateStrategy()
    const before = Object.keys(strategy)
    strategy.applies(createContextWithIntent('Create'))
    strategy.applies(emptyContext())
    strategy.applies(createContextWithIntent('Create'))
    expect(Object.keys(strategy)).toEqual(before)
  })
})

// ---------------------------------------------------------------------------
// CreateStrategy — Ordering Precedence
// ---------------------------------------------------------------------------

describe('CreateStrategy — ordering precedence', () => {
  it('should be selected before DefaultPromptStrategy when CreateStrategy matches', () => {
    const selector = new DefaultPromptStrategySelector()
    const createStrategy = new CreateStrategy()
    const defaultStrategy = new DefaultPromptStrategy()
    const strategies = [createStrategy, defaultStrategy]
    const context = createContextWithIntent('Create')
    const result = selector.select(strategies, context)
    expect(result.name).toBe('create')
  })

  it('should be selected when placed first in strategy list', () => {
    const selector = new DefaultPromptStrategySelector()
    const createStrategy = new CreateStrategy()
    const context = createContextWithIntent('Create')
    const result = selector.select([createStrategy], context)
    expect(result.name).toBe('create')
  })

  it('should NOT be selected when context has no Create intent', () => {
    const selector = new DefaultPromptStrategySelector()
    const createStrategy = new CreateStrategy()
    const defaultStrategy = new DefaultPromptStrategy()
    const strategies = [createStrategy, defaultStrategy]
    const context = createContextWithIntent('Move')
    const result = selector.select(strategies, context)
    expect(result.name).toBe('default')
  })

  it('should NOT be selected for empty context', () => {
    const selector = new DefaultPromptStrategySelector()
    const createStrategy = new CreateStrategy()
    const defaultStrategy = new DefaultPromptStrategy()
    const strategies = [createStrategy, defaultStrategy]
    const result = selector.select(strategies, emptyContext())
    expect(result.name).toBe('default')
  })
})

// ---------------------------------------------------------------------------
// Selector Integration
// ---------------------------------------------------------------------------

describe('Selector integration', () => {
  it('DefaultPromptStrategySelector should select CreateStrategy for Create intent', () => {
    const selector = new DefaultPromptStrategySelector()
    const createStrategy = new CreateStrategy()
    const context = createContextWithIntent('Create')
    const result = selector.select([createStrategy], context)
    expect(result.name).toBe('create')
    expect(result).toBeInstanceOf(CreateStrategy)
  })

  it('DefaultPromptStrategySelector should fall back to DefaultPromptStrategy for non-Create intent', () => {
    const selector = new DefaultPromptStrategySelector()
    const createStrategy = new CreateStrategy()
    const context = createContextWithIntent('Delete')
    const result = selector.select([createStrategy], context)
    expect(result.name).toBe('default')
    expect(result).toBeInstanceOf(DefaultPromptStrategy)
  })

  it('DefaultPromptStrategySelector should select CreateStrategy when both strategies match (first-match wins)', () => {
    const selector = new DefaultPromptStrategySelector()
    const createStrategy = new CreateStrategy()
    const defaultStrategy = new DefaultPromptStrategy()
    const context = createContextWithIntent('Create')
    // Both strategies "match" (CreateStrategy returns true, DefaultPromptStrategy always true)
    // But CreateStrategy is first in the list, so it wins
    const result = selector.select([createStrategy, defaultStrategy], context)
    expect(result.name).toBe('create')
  })

  it('should work with full end-to-end pipeline: input → RuleBasedIntentAnalyzer → SemanticContext → CreateStrategy', () => {
    const selector = new DefaultPromptStrategySelector()
    const createStrategy = new CreateStrategy()
    const defaultStrategy = new DefaultPromptStrategy()
    const strategies = [createStrategy, defaultStrategy]

    // Chinese creation requests
    const chineseInputs = ['创建一棵树', '生成一个房子', '画一朵花', '添加一个角色']
    for (const input of chineseInputs) {
      const context = createContextFromInput(input)
      const result = selector.select(strategies, context)
      expect(result.name).toBe('create')
    }

    // English creation requests
    const englishInputs = ['create a tree', 'generate a house', 'draw a flower', 'add a character', 'spawn a rock', 'build a house']
    for (const input of englishInputs) {
      const context = createContextFromInput(input)
      const result = selector.select(strategies, context)
      expect(result.name).toBe('create')
    }
  })

  it('should fall back to default for non-creation inputs', () => {
    const selector = new DefaultPromptStrategySelector()
    const createStrategy = new CreateStrategy()
    const defaultStrategy = new DefaultPromptStrategy()
    const strategies = [createStrategy, defaultStrategy]

    const nonCreateInputs = ['move the tree', 'delete the flower', '修改房子', '查询世界']
    for (const input of nonCreateInputs) {
      const context = createContextFromInput(input)
      const result = selector.select(strategies, context)
      expect(result.name).toBe('default')
    }
  })
})

// ---------------------------------------------------------------------------
// Default Fallback
// ---------------------------------------------------------------------------

describe('Default fallback', () => {
  it('DefaultPromptStrategy remains fallback when CreateStrategy does not match', () => {
    const selector = new DefaultPromptStrategySelector()
    const createStrategy = new CreateStrategy()
    const context = emptyContext()
    const result = selector.select([createStrategy], context)
    expect(result.name).toBe('default')
  })

  it('DefaultPromptStrategy always applies', () => {
    const defaultStrategy = new DefaultPromptStrategy()
    expect(defaultStrategy.applies(emptyContext())).toBe(true)
    expect(defaultStrategy.applies(createContextWithIntent('Create'))).toBe(true)
    expect(defaultStrategy.applies(createContextWithIntent('Move'))).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('Rendering', () => {
  it('DefaultPromptStrategyRenderer should render CreateStrategy as "Prompt Strategy:\\n\\n- create"', () => {
    const renderer = new DefaultPromptStrategyRenderer()
    const strategy = new CreateStrategy()
    expect(renderer.render(strategy)).toBe('Prompt Strategy:\n\n- create')
  })

  it('should render differently from DefaultPromptStrategy', () => {
    const renderer = new DefaultPromptStrategyRenderer()
    const createStrategy = new CreateStrategy()
    const defaultStrategy = new DefaultPromptStrategy()
    expect(renderer.render(createStrategy)).not.toBe(renderer.render(defaultStrategy))
    expect(renderer.render(createStrategy)).toBe('Prompt Strategy:\n\n- create')
    expect(renderer.render(defaultStrategy)).toBe('Prompt Strategy:\n\n- default')
  })
})

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

describe('Exports', () => {
  it('should export CreateStrategy from strategy/index', () => {
    const strategy = new CreateStrategy()
    expect(strategy.name).toBe('create')
  })

  it('should export CreateStrategy from package root', () => {
    const Strategy = CreateStrategy as typeof CreateStrategyFromRoot
    const strategy = new Strategy()
    expect(strategy.name).toBe('create')
  })
})

// ---------------------------------------------------------------------------
// Architecture Compliance
// ---------------------------------------------------------------------------

describe('Architecture compliance', () => {
  it('should not depend on Planner', () => {
    const strategy = new CreateStrategy()
    expect(strategy.applies(createContextWithIntent('Create'))).toBe(true)
  })

  it('should not depend on Runtime', () => {
    const strategy = new CreateStrategy()
    expect(strategy.applies(emptyContext())).toBe(false)
  })

  it('should not depend on Provider', () => {
    const strategy = new CreateStrategy()
    expect(strategy).toBeInstanceOf(CreateStrategy)
  })

  it('should not depend on Memory', () => {
    const strategy = new CreateStrategy()
    expect(strategy.applies(createContextWithIntent('Create'))).toBe(true)
  })

  it('should not depend on ToolCalling', () => {
    const strategy = new CreateStrategy()
    expect(strategy.name).toBe('create')
  })

  it('should not depend on AgentLoop', () => {
    const strategy = new CreateStrategy()
    expect(strategy.applies({ intent: { intents: [] } })).toBe(false)
  })

  it('should not depend on PromptBuilder', () => {
    const selector = new DefaultPromptStrategySelector()
    expect(selector.select([new CreateStrategy()], emptyContext()).name).toBe('default')
  })

  it('should not depend on Pipeline', () => {
    const strategy = new CreateStrategy()
    expect(strategy.name).toBe('create')
  })

  it('should be pure — no side effects', () => {
    const strategy = new CreateStrategy()
    const context: SemanticContext = { intent: { intents: [{ type: 'Create' }] } }
    const before = JSON.stringify(context)
    strategy.applies(context)
    expect(JSON.stringify(context)).toBe(before)
  })

  it('should be stateless — no internal state', () => {
    const s1 = new CreateStrategy()
    const s2 = new CreateStrategy()
    expect(s1.applies(createContextWithIntent('Create'))).toBe(s2.applies(createContextWithIntent('Create')))
  })

  it('should be non-mutating — never modifies inputs', () => {
    const selector = new DefaultPromptStrategySelector()
    const strategies: readonly PromptStrategy[] = [new CreateStrategy()]
    const context: SemanticContext = createContextWithIntent('Create')
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
    const strategy = new CreateStrategy()
    const selector = new DefaultPromptStrategySelector()
    expect(strategy).toBeInstanceOf(CreateStrategy)
    expect(selector.select([strategy], createContextWithIntent('Create')).name).toBe('create')
  })

  it('should not affect RetryPlanner behavior', () => {
    const selector = new DefaultPromptStrategySelector()
    const strategies = [new CreateStrategy()]
    const context: SemanticContext = createContextWithIntent('Create')
    const result = selector.select(strategies, context)
    expect(result.name).toBe('create')
  })
})

// ---------------------------------------------------------------------------
// ToolCallPlanner Compatibility
// ---------------------------------------------------------------------------

describe('ToolCallPlanner Compatibility', () => {
  it('should work with ToolCallPlanner', () => {
    const strategy = new CreateStrategy()
    const selector = new DefaultPromptStrategySelector()
    expect(strategy).toBeInstanceOf(CreateStrategy)
    expect(selector.select([strategy], emptyContext()).name).toBe('default')
  })

  it('should not affect ToolCallPlanner tool execution', () => {
    const selector = new DefaultPromptStrategySelector()
    const strategies = [new CreateStrategy()]
    const context: SemanticContext = createContextWithIntent('Create')
    const result = selector.select(strategies, context)
    expect(result.name).toBe('create')
  })
})

// ---------------------------------------------------------------------------
// Streaming Compatibility
// ---------------------------------------------------------------------------

describe('Streaming Compatibility', () => {
  it('should work with StreamingProvider', () => {
    const strategy = new CreateStrategy()
    const selector = new DefaultPromptStrategySelector()
    expect(strategy).toBeInstanceOf(CreateStrategy)
    expect(selector.select([strategy], emptyContext()).name).toBe('default')
  })

  it('should not affect streaming', () => {
    const selector = new DefaultPromptStrategySelector()
    const strategies = [new CreateStrategy()]
    const context: SemanticContext = createContextWithIntent('Create')
    const result = selector.select(strategies, context)
    expect(result.name).toBe('create')
  })
})

// ---------------------------------------------------------------------------
// AgentLoop Compatibility
// ---------------------------------------------------------------------------

describe('AgentLoop Compatibility', () => {
  it('should work with AgentLoop', () => {
    const strategy = new CreateStrategy()
    const selector = new DefaultPromptStrategySelector()
    expect(strategy).toBeInstanceOf(CreateStrategy)
    expect(selector.select([strategy], emptyContext()).name).toBe('default')
  })

  it('should not affect AgentLoop iteration', () => {
    const selector = new DefaultPromptStrategySelector()
    const strategies = [new CreateStrategy()]
    const context: SemanticContext = createContextWithIntent('Create')
    const result = selector.select(strategies, context)
    expect(result.name).toBe('create')
  })
})
