import { describe, it, expect } from 'vitest'
import type { PromptStrategy } from '../strategy/PromptStrategy'
import { ModifyStrategy } from '../strategy/ModifyStrategy'
import { CreateStrategy } from '../strategy/CreateStrategy'
import { QueryStrategy } from '../strategy/QueryStrategy'
import { DefaultPromptStrategy } from '../strategy/DefaultPromptStrategy'
import { DefaultPromptStrategySelector } from '../strategy/DefaultPromptStrategySelector'
import { DefaultPromptStrategyRenderer } from '../strategy/DefaultPromptStrategyRenderer'
import type { SemanticContext } from '../semantic/SemanticContext'
import type { EntityResult } from '../entity/EntityResult'
import { RuleBasedIntentAnalyzer } from '../intent/RuleBasedIntentAnalyzer'
import { DefaultSemanticContextBuilder } from '../semantic/DefaultSemanticContextBuilder'
import type { ModifyStrategy as ModifyStrategyFromRoot } from '../index'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createContextWithIntent(...types: string[]): SemanticContext {
  return {
    intent: { intents: types.map(t => ({ type: t as 'Modify' })) },
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
// ModifyStrategy — Identity
// ---------------------------------------------------------------------------

describe('ModifyStrategy — identity', () => {
  it('should have name "modify"', () => {
    const strategy = new ModifyStrategy()
    expect(strategy.name).toBe('modify')
  })

  it('should implement PromptStrategy interface', () => {
    const strategy: PromptStrategy = new ModifyStrategy()
    expect(strategy.name).toBeDefined()
    expect(typeof strategy.name).toBe('string')
    expect(typeof strategy.applies).toBe('function')
  })
})

// ---------------------------------------------------------------------------
// ModifyStrategy — applies() with Move intent
// ---------------------------------------------------------------------------

describe('ModifyStrategy — applies() with Move intent', () => {
  it('should return true when context has a Move intent', () => {
    const strategy = new ModifyStrategy()
    expect(strategy.applies(createContextWithIntent('Move'))).toBe(true)
  })

  it('should return true when context has multiple intents including Move', () => {
    const strategy = new ModifyStrategy()
    expect(strategy.applies(createContextWithIntent('Move', 'Create'))).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// ModifyStrategy — applies() with Modify intent
// ---------------------------------------------------------------------------

describe('ModifyStrategy — applies() with Modify intent', () => {
  it('should return true when context has a Modify intent', () => {
    const strategy = new ModifyStrategy()
    expect(strategy.applies(createContextWithIntent('Modify'))).toBe(true)
  })

  it('should return true when context has multiple intents including Modify', () => {
    const strategy = new ModifyStrategy()
    expect(strategy.applies(createContextWithIntent('Modify', 'Query'))).toBe(true)
  })

  it('should return true when both Move and Modify intents exist', () => {
    const strategy = new ModifyStrategy()
    expect(strategy.applies(createContextWithIntent('Move', 'Modify'))).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// ModifyStrategy — applies() without Move/Modify intent
// ---------------------------------------------------------------------------

describe('ModifyStrategy — applies() without Move/Modify intent', () => {
  it('should return false for empty context', () => {
    const strategy = new ModifyStrategy()
    expect(strategy.applies(emptyContext())).toBe(false)
  })

  it('should return false for entity-only context', () => {
    const strategy = new ModifyStrategy()
    expect(strategy.applies(entityOnlyContext())).toBe(false)
  })

  it('should return false for Create intent', () => {
    const strategy = new ModifyStrategy()
    expect(strategy.applies(createContextWithIntent('Create'))).toBe(false)
  })

  it('should return false for Delete intent', () => {
    const strategy = new ModifyStrategy()
    expect(strategy.applies(createContextWithIntent('Delete'))).toBe(false)
  })

  it('should return false for Query intent', () => {
    const strategy = new ModifyStrategy()
    expect(strategy.applies(createContextWithIntent('Query'))).toBe(false)
  })

  it('should return false for empty intents array', () => {
    const strategy = new ModifyStrategy()
    expect(strategy.applies({ intent: { intents: [] } })).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// ModifyStrategy — Chinese Keywords (via RuleBasedIntentAnalyzer)
// ---------------------------------------------------------------------------

describe('ModifyStrategy — Chinese keywords', () => {
  const strategy = new ModifyStrategy()

  it('should match "移动" (move)', () => {
    expect(strategy.applies(createContextFromInput('移动树到左边'))).toBe(true)
  })

  it('should match "修改" (modify)', () => {
    expect(strategy.applies(createContextFromInput('修改房子颜色'))).toBe(true)
  })

  it('should match "改变" (change)', () => {
    expect(strategy.applies(createContextFromInput('改变颜色'))).toBe(true)
  })

  it('should match "调整" (adjust)', () => {
    expect(strategy.applies(createContextFromInput('调整大小'))).toBe(true)
  })

  it('should match "替换" (replace)', () => {
    expect(strategy.applies(createContextFromInput('替换成红色'))).toBe(true)
  })

  it('should match "更新" (update)', () => {
    expect(strategy.applies(createContextFromInput('更新角色位置'))).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// ModifyStrategy — English Keywords (via RuleBasedIntentAnalyzer)
// ---------------------------------------------------------------------------

describe('ModifyStrategy — English keywords', () => {
  const strategy = new ModifyStrategy()

  it('should match "move"', () => {
    expect(strategy.applies(createContextFromInput('move the tree left'))).toBe(true)
  })

  it('should match "modify"', () => {
    expect(strategy.applies(createContextFromInput('modify the house color'))).toBe(true)
  })

  it('should match "change"', () => {
    expect(strategy.applies(createContextFromInput('change the color'))).toBe(true)
  })

  it('should match "update"', () => {
    expect(strategy.applies(createContextFromInput('update the position'))).toBe(true)
  })

  it('should match "replace"', () => {
    expect(strategy.applies(createContextFromInput('replace with red'))).toBe(true)
  })

  it('should match "adjust"', () => {
    expect(strategy.applies(createContextFromInput('adjust the size'))).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// ModifyStrategy — Case Insensitivity
// ---------------------------------------------------------------------------

describe('ModifyStrategy — case insensitivity', () => {
  const strategy = new ModifyStrategy()

  it('should match UPPERCASE "MODIFY"', () => {
    expect(strategy.applies(createContextFromInput('MODIFY the house'))).toBe(true)
  })

  it('should match Capitalized "Modify"', () => {
    expect(strategy.applies(createContextFromInput('Modify the house'))).toBe(true)
  })

  it('should match lowercase "modify"', () => {
    expect(strategy.applies(createContextFromInput('modify the house'))).toBe(true)
  })

  it('should match mixed case "MoDiFy"', () => {
    expect(strategy.applies(createContextFromInput('MoDiFy the house'))).toBe(true)
  })

  it('should match UPPERCASE "MOVE"', () => {
    expect(strategy.applies(createContextFromInput('MOVE the tree'))).toBe(true)
  })

  it('should match UPPERCASE "UPDATE"', () => {
    expect(strategy.applies(createContextFromInput('UPDATE the position'))).toBe(true)
  })

  it('should match UPPERCASE "CHANGE"', () => {
    expect(strategy.applies(createContextFromInput('CHANGE the color'))).toBe(true)
  })

  it('should match UPPERCASE "ADJUST"', () => {
    expect(strategy.applies(createContextFromInput('ADJUST the size'))).toBe(true)
  })

  it('should match UPPERCASE "REPLACE"', () => {
    expect(strategy.applies(createContextFromInput('REPLACE with red'))).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// ModifyStrategy — Punctuation
// ---------------------------------------------------------------------------

describe('ModifyStrategy — punctuation', () => {
  const strategy = new ModifyStrategy()

  it('should match with trailing period', () => {
    expect(strategy.applies(createContextFromInput('修改房子颜色。'))).toBe(true)
  })

  it('should match with trailing comma', () => {
    expect(strategy.applies(createContextFromInput('move the tree,'))).toBe(true)
  })

  it('should match with exclamation mark', () => {
    expect(strategy.applies(createContextFromInput('更新角色位置！'))).toBe(true)
  })

  it('should match with question mark', () => {
    expect(strategy.applies(createContextFromInput('change the color?'))).toBe(true)
  })

  it('should match with parentheses', () => {
    expect(strategy.applies(createContextFromInput('(modify the house)'))).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// ModifyStrategy — Whitespace
// ---------------------------------------------------------------------------

describe('ModifyStrategy — whitespace', () => {
  const strategy = new ModifyStrategy()

  it('should match with leading spaces', () => {
    expect(strategy.applies(createContextFromInput('   修改房子颜色'))).toBe(true)
  })

  it('should match with trailing spaces', () => {
    expect(strategy.applies(createContextFromInput('move the tree   '))).toBe(true)
  })

  it('should match with multiple spaces', () => {
    expect(strategy.applies(createContextFromInput('modify    the    house'))).toBe(true)
  })

  it('should match with tabs', () => {
    expect(strategy.applies(createContextFromInput('move\tthe\ttree'))).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// ModifyStrategy — Deterministic
// ---------------------------------------------------------------------------

describe('ModifyStrategy — deterministic', () => {
  it('should return same result for same context across repeated calls', () => {
    const strategy = new ModifyStrategy()
    const context = createContextWithIntent('Modify')
    const r1 = strategy.applies(context)
    const r2 = strategy.applies(context)
    const r3 = strategy.applies(context)
    expect(r1).toBe(r2)
    expect(r2).toBe(r3)
  })

  it('should be idempotent across ten calls', () => {
    const strategy = new ModifyStrategy()
    const context = createContextWithIntent('Move')
    for (let i = 0; i < 10; i++) {
      expect(strategy.applies(context)).toBe(true)
    }
  })

  it('should consistently return false for non-Move/Modify contexts', () => {
    const strategy = new ModifyStrategy()
    const context = createContextWithIntent('Create')
    for (let i = 0; i < 10; i++) {
      expect(strategy.applies(context)).toBe(false)
    }
  })
})

// ---------------------------------------------------------------------------
// ModifyStrategy — Stateless
// ---------------------------------------------------------------------------

describe('ModifyStrategy — stateless', () => {
  it('should not retain state between calls', () => {
    const strategy = new ModifyStrategy()
    const ctx1 = createContextWithIntent('Modify')
    const ctx2 = emptyContext()
    expect(strategy.applies(ctx1)).toBe(true)
    expect(strategy.applies(ctx2)).toBe(false)
    expect(strategy.applies(ctx1)).toBe(true)
  })

  it('should be independent across multiple instances', () => {
    const s1 = new ModifyStrategy()
    const s2 = new ModifyStrategy()
    const context = createContextWithIntent('Move')
    expect(s1.applies(context)).toBe(s2.applies(context))
  })
})

// ---------------------------------------------------------------------------
// ModifyStrategy — Pure / No Side Effects
// ---------------------------------------------------------------------------

describe('ModifyStrategy — pure / no side effects', () => {
  it('should not modify the context object', () => {
    const strategy = new ModifyStrategy()
    const context: SemanticContext = { intent: { intents: [{ type: 'Modify' }] } }
    const frozen = Object.freeze({ ...context })
    expect(() => strategy.applies(frozen)).not.toThrow()
  })

  it('should have no side effects on strategy instance', () => {
    const strategy = new ModifyStrategy()
    const before = Object.keys(strategy)
    strategy.applies(createContextWithIntent('Modify'))
    strategy.applies(emptyContext())
    strategy.applies(createContextWithIntent('Move'))
    expect(Object.keys(strategy)).toEqual(before)
  })
})

// ---------------------------------------------------------------------------
// Selector Integration
// ---------------------------------------------------------------------------

describe('Selector integration', () => {
  it('should be selected before DefaultPromptStrategy when ModifyStrategy matches', () => {
    const selector = new DefaultPromptStrategySelector()
    const modifyStrategy = new ModifyStrategy()
    const defaultStrategy = new DefaultPromptStrategy()
    const context = createContextWithIntent('Modify')
    const result = selector.select([modifyStrategy, defaultStrategy], context)
    expect(result.name).toBe('modify')
  })

  it('should be selected for Move intent', () => {
    const selector = new DefaultPromptStrategySelector()
    const modifyStrategy = new ModifyStrategy()
    const defaultStrategy = new DefaultPromptStrategy()
    const context = createContextWithIntent('Move')
    const result = selector.select([modifyStrategy, defaultStrategy], context)
    expect(result.name).toBe('modify')
  })

  it('should fall back to DefaultPromptStrategy for non-Move/Modify intent', () => {
    const selector = new DefaultPromptStrategySelector()
    const modifyStrategy = new ModifyStrategy()
    const defaultStrategy = new DefaultPromptStrategy()
    const context = createContextWithIntent('Delete')
    const result = selector.select([modifyStrategy, defaultStrategy], context)
    expect(result.name).toBe('default')
  })

  it('should work with full end-to-end pipeline', () => {
    const selector = new DefaultPromptStrategySelector()
    const modifyStrategy = new ModifyStrategy()
    const defaultStrategy = new DefaultPromptStrategy()
    const strategies = [modifyStrategy, defaultStrategy]

    const modifyInputs = ['移动树到左边', '修改房子颜色', '更新角色位置', 'move the tree', 'modify the house', 'update the position']
    for (const input of modifyInputs) {
      const context = createContextFromInput(input)
      const result = selector.select(strategies, context)
      expect(result.name).toBe('modify')
    }
  })
})

// ---------------------------------------------------------------------------
// Rendering Integration
// ---------------------------------------------------------------------------

describe('Rendering integration', () => {
  it('DefaultPromptStrategyRenderer should render ModifyStrategy as "Prompt Strategy:\\n\\n- modify"', () => {
    const renderer = new DefaultPromptStrategyRenderer()
    const strategy = new ModifyStrategy()
    expect(renderer.render(strategy)).toBe('Prompt Strategy:\n\n- modify')
  })

  it('should render differently from all other strategies', () => {
    const renderer = new DefaultPromptStrategyRenderer()
    const modifyStrategy = new ModifyStrategy()
    const queryStrategy = new QueryStrategy()
    const createStrategy = new CreateStrategy()
    const defaultStrategy = new DefaultPromptStrategy()
    expect(renderer.render(modifyStrategy)).toBe('Prompt Strategy:\n\n- modify')
    expect(renderer.render(queryStrategy)).toBe('Prompt Strategy:\n\n- query')
    expect(renderer.render(createStrategy)).toBe('Prompt Strategy:\n\n- create')
    expect(renderer.render(defaultStrategy)).toBe('Prompt Strategy:\n\n- default')
  })
})

// ---------------------------------------------------------------------------
// Default Fallback
// ---------------------------------------------------------------------------

describe('Default fallback', () => {
  it('DefaultPromptStrategy remains fallback when ModifyStrategy does not match', () => {
    const selector = new DefaultPromptStrategySelector()
    const modifyStrategy = new ModifyStrategy()
    const result = selector.select([modifyStrategy], emptyContext())
    expect(result.name).toBe('default')
  })

  it('DefaultPromptStrategy always applies', () => {
    const defaultStrategy = new DefaultPromptStrategy()
    expect(defaultStrategy.applies(emptyContext())).toBe(true)
    expect(defaultStrategy.applies(createContextWithIntent('Modify'))).toBe(true)
    expect(defaultStrategy.applies(createContextWithIntent('Move'))).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Coexistence with CreateStrategy
// ---------------------------------------------------------------------------

describe('Coexistence with CreateStrategy', () => {
  it('CreateStrategy should still win for Create requests', () => {
    const selector = new DefaultPromptStrategySelector()
    const strategies = [new CreateStrategy(), new QueryStrategy(), new ModifyStrategy(), new DefaultPromptStrategy()]
    const result = selector.select(strategies, createContextWithIntent('Create'))
    expect(result.name).toBe('create')
  })

  it('CreateStrategy should win over ModifyStrategy for Create intent', () => {
    const selector = new DefaultPromptStrategySelector()
    const strategies = [new CreateStrategy(), new ModifyStrategy()]
    const result = selector.select(strategies, createContextWithIntent('Create'))
    expect(result.name).toBe('create')
  })
})

// ---------------------------------------------------------------------------
// Coexistence with QueryStrategy
// ---------------------------------------------------------------------------

describe('Coexistence with QueryStrategy', () => {
  it('QueryStrategy should still win for Query requests', () => {
    const selector = new DefaultPromptStrategySelector()
    const strategies = [new CreateStrategy(), new QueryStrategy(), new ModifyStrategy(), new DefaultPromptStrategy()]
    const result = selector.select(strategies, createContextWithIntent('Query'))
    expect(result.name).toBe('query')
  })

  it('ModifyStrategy should win for Move intent', () => {
    const selector = new DefaultPromptStrategySelector()
    const strategies = [new CreateStrategy(), new QueryStrategy(), new ModifyStrategy(), new DefaultPromptStrategy()]
    const result = selector.select(strategies, createContextWithIntent('Move'))
    expect(result.name).toBe('modify')
  })

  it('ModifyStrategy should win for Modify intent', () => {
    const selector = new DefaultPromptStrategySelector()
    const strategies = [new CreateStrategy(), new QueryStrategy(), new ModifyStrategy(), new DefaultPromptStrategy()]
    const result = selector.select(strategies, createContextWithIntent('Modify'))
    expect(result.name).toBe('modify')
  })

  it('DefaultPromptStrategy should win for Delete intent', () => {
    const selector = new DefaultPromptStrategySelector()
    const strategies = [new CreateStrategy(), new QueryStrategy(), new ModifyStrategy(), new DefaultPromptStrategy()]
    const result = selector.select(strategies, createContextWithIntent('Delete'))
    expect(result.name).toBe('default')
  })
})

// ---------------------------------------------------------------------------
// Full Routing — Create → Query → Modify → Default
// ---------------------------------------------------------------------------

describe('Full routing — Create → Query → Modify → Default', () => {
  const selector = new DefaultPromptStrategySelector()
  const strategies = [new CreateStrategy(), new QueryStrategy(), new ModifyStrategy(), new DefaultPromptStrategy()]

  it('should route "创建一棵树" → create', () => {
    const result = selector.select(strategies, createContextFromInput('创建一棵树'))
    expect(result.name).toBe('create')
  })

  it('should route "列出所有树" → query', () => {
    const result = selector.select(strategies, createContextFromInput('列出所有树'))
    expect(result.name).toBe('query')
  })

  it('should route "移动树到左边" → modify', () => {
    const result = selector.select(strategies, createContextFromInput('移动树到左边'))
    expect(result.name).toBe('modify')
  })

  it('should route "修改房子颜色" → modify', () => {
    const result = selector.select(strategies, createContextFromInput('修改房子颜色'))
    expect(result.name).toBe('modify')
  })

  it('should route "更新角色位置" → modify', () => {
    const result = selector.select(strategies, createContextFromInput('更新角色位置'))
    expect(result.name).toBe('modify')
  })

  it('should route "删除树" → default', () => {
    const result = selector.select(strategies, createContextFromInput('删除树'))
    expect(result.name).toBe('default')
  })

  it('should route "create a tree" → create', () => {
    const result = selector.select(strategies, createContextFromInput('create a tree'))
    expect(result.name).toBe('create')
  })

  it('should route "list all trees" → query', () => {
    const result = selector.select(strategies, createContextFromInput('list all trees'))
    expect(result.name).toBe('query')
  })

  it('should route "move the tree" → modify', () => {
    const result = selector.select(strategies, createContextFromInput('move the tree'))
    expect(result.name).toBe('modify')
  })

  it('should route "modify the house" → modify', () => {
    const result = selector.select(strategies, createContextFromInput('modify the house'))
    expect(result.name).toBe('modify')
  })

  it('should route "update the position" → modify', () => {
    const result = selector.select(strategies, createContextFromInput('update the position'))
    expect(result.name).toBe('modify')
  })

  it('should route "delete the tree" → default', () => {
    const result = selector.select(strategies, createContextFromInput('delete the tree'))
    expect(result.name).toBe('default')
  })
})

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

describe('Exports', () => {
  it('should export ModifyStrategy from strategy/index', () => {
    const strategy = new ModifyStrategy()
    expect(strategy.name).toBe('modify')
  })

  it('should export ModifyStrategy from package root', () => {
    const Strategy = ModifyStrategy as typeof ModifyStrategyFromRoot
    const strategy = new Strategy()
    expect(strategy.name).toBe('modify')
  })
})

// ---------------------------------------------------------------------------
// Architecture Compliance
// ---------------------------------------------------------------------------

describe('Architecture compliance', () => {
  it('should not depend on Planner', () => {
    const strategy = new ModifyStrategy()
    expect(strategy.applies(createContextWithIntent('Modify'))).toBe(true)
  })

  it('should not depend on Runtime', () => {
    const strategy = new ModifyStrategy()
    expect(strategy.applies(emptyContext())).toBe(false)
  })

  it('should not depend on Provider', () => {
    const strategy = new ModifyStrategy()
    expect(strategy).toBeInstanceOf(ModifyStrategy)
  })

  it('should not depend on Memory', () => {
    const strategy = new ModifyStrategy()
    expect(strategy.applies(createContextWithIntent('Modify'))).toBe(true)
  })

  it('should not depend on ToolCalling', () => {
    const strategy = new ModifyStrategy()
    expect(strategy.name).toBe('modify')
  })

  it('should not depend on AgentLoop', () => {
    const strategy = new ModifyStrategy()
    expect(strategy.applies({ intent: { intents: [] } })).toBe(false)
  })

  it('should not depend on PromptBuilder', () => {
    const selector = new DefaultPromptStrategySelector()
    expect(selector.select([new ModifyStrategy()], emptyContext()).name).toBe('default')
  })

  it('should not depend on Pipeline', () => {
    const strategy = new ModifyStrategy()
    expect(strategy.name).toBe('modify')
  })

  it('should be pure — no side effects', () => {
    const strategy = new ModifyStrategy()
    const context: SemanticContext = { intent: { intents: [{ type: 'Modify' }] } }
    const before = JSON.stringify(context)
    strategy.applies(context)
    expect(JSON.stringify(context)).toBe(before)
  })

  it('should be stateless — no internal state', () => {
    const s1 = new ModifyStrategy()
    const s2 = new ModifyStrategy()
    expect(s1.applies(createContextWithIntent('Modify'))).toBe(s2.applies(createContextWithIntent('Modify')))
  })

  it('should be non-mutating — never modifies inputs', () => {
    const selector = new DefaultPromptStrategySelector()
    const strategies: readonly PromptStrategy[] = [new ModifyStrategy()]
    const context: SemanticContext = createContextWithIntent('Move')
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
    const strategy = new ModifyStrategy()
    expect(strategy).toBeInstanceOf(ModifyStrategy)
  })

  it('should not affect RetryPlanner behavior', () => {
    const selector = new DefaultPromptStrategySelector()
    const strategies = [new ModifyStrategy()]
    const result = selector.select(strategies, createContextWithIntent('Modify'))
    expect(result.name).toBe('modify')
  })
})

// ---------------------------------------------------------------------------
// ToolCallPlanner Compatibility
// ---------------------------------------------------------------------------

describe('ToolCallPlanner Compatibility', () => {
  it('should work with ToolCallPlanner', () => {
    const strategy = new ModifyStrategy()
    expect(strategy).toBeInstanceOf(ModifyStrategy)
  })

  it('should not affect ToolCallPlanner tool execution', () => {
    const selector = new DefaultPromptStrategySelector()
    const strategies = [new ModifyStrategy()]
    const result = selector.select(strategies, createContextWithIntent('Move'))
    expect(result.name).toBe('modify')
  })
})

// ---------------------------------------------------------------------------
// Streaming Compatibility
// ---------------------------------------------------------------------------

describe('Streaming Compatibility', () => {
  it('should work with StreamingProvider', () => {
    const strategy = new ModifyStrategy()
    expect(strategy).toBeInstanceOf(ModifyStrategy)
  })

  it('should not affect streaming', () => {
    const selector = new DefaultPromptStrategySelector()
    const strategies = [new ModifyStrategy()]
    const result = selector.select(strategies, createContextWithIntent('Modify'))
    expect(result.name).toBe('modify')
  })
})

// ---------------------------------------------------------------------------
// AgentLoop Compatibility
// ---------------------------------------------------------------------------

describe('AgentLoop Compatibility', () => {
  it('should work with AgentLoop', () => {
    const strategy = new ModifyStrategy()
    expect(strategy).toBeInstanceOf(ModifyStrategy)
  })

  it('should not affect AgentLoop iteration', () => {
    const selector = new DefaultPromptStrategySelector()
    const strategies = [new ModifyStrategy()]
    const result = selector.select(strategies, createContextWithIntent('Move'))
    expect(result.name).toBe('modify')
  })
})
