import { describe, it, expect } from 'vitest'
import type { PromptStrategy } from '../strategy/PromptStrategy'
import { DeleteStrategy } from '../strategy/DeleteStrategy'
import { CreateStrategy } from '../strategy/CreateStrategy'
import { QueryStrategy } from '../strategy/QueryStrategy'
import { ModifyStrategy } from '../strategy/ModifyStrategy'
import { DefaultPromptStrategy } from '../strategy/DefaultPromptStrategy'
import { DefaultPromptStrategySelector } from '../strategy/DefaultPromptStrategySelector'
import { DefaultPromptStrategyRenderer } from '../strategy/DefaultPromptStrategyRenderer'
import type { SemanticContext } from '../semantic/SemanticContext'
import type { EntityResult } from '../entity/EntityResult'
import { RuleBasedIntentAnalyzer } from '../intent/RuleBasedIntentAnalyzer'
import { DefaultSemanticContextBuilder } from '../semantic/DefaultSemanticContextBuilder'
import type { DeleteStrategy as DeleteStrategyFromRoot } from '../index'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createContextWithIntent(...types: string[]): SemanticContext {
  return {
    intent: { intents: types.map(t => ({ type: t as 'Delete' })) },
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
// DeleteStrategy — Identity
// ---------------------------------------------------------------------------

describe('DeleteStrategy — identity', () => {
  it('should have name "delete"', () => {
    const strategy = new DeleteStrategy()
    expect(strategy.name).toBe('delete')
  })

  it('should implement PromptStrategy interface', () => {
    const strategy: PromptStrategy = new DeleteStrategy()
    expect(strategy.name).toBeDefined()
    expect(typeof strategy.name).toBe('string')
    expect(typeof strategy.applies).toBe('function')
  })
})

// ---------------------------------------------------------------------------
// DeleteStrategy — applies() with Delete intent
// ---------------------------------------------------------------------------

describe('DeleteStrategy — applies() with Delete intent', () => {
  it('should return true when context has a Delete intent', () => {
    const strategy = new DeleteStrategy()
    expect(strategy.applies(createContextWithIntent('Delete'))).toBe(true)
  })

  it('should return true when context has multiple intents including Delete', () => {
    const strategy = new DeleteStrategy()
    expect(strategy.applies(createContextWithIntent('Delete', 'Create'))).toBe(true)
  })

  it('should return true when Delete is the second intent', () => {
    const strategy = new DeleteStrategy()
    expect(strategy.applies(createContextWithIntent('Create', 'Delete'))).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// DeleteStrategy — applies() without Delete intent
// ---------------------------------------------------------------------------

describe('DeleteStrategy — applies() without Delete intent', () => {
  it('should return false for empty context', () => {
    const strategy = new DeleteStrategy()
    expect(strategy.applies(emptyContext())).toBe(false)
  })

  it('should return false for entity-only context', () => {
    const strategy = new DeleteStrategy()
    expect(strategy.applies(entityOnlyContext())).toBe(false)
  })

  it('should return false for Create intent', () => {
    const strategy = new DeleteStrategy()
    expect(strategy.applies(createContextWithIntent('Create'))).toBe(false)
  })

  it('should return false for Move intent', () => {
    const strategy = new DeleteStrategy()
    expect(strategy.applies(createContextWithIntent('Move'))).toBe(false)
  })

  it('should return false for Modify intent', () => {
    const strategy = new DeleteStrategy()
    expect(strategy.applies(createContextWithIntent('Modify'))).toBe(false)
  })

  it('should return false for Query intent', () => {
    const strategy = new DeleteStrategy()
    expect(strategy.applies(createContextWithIntent('Query'))).toBe(false)
  })

  it('should return false for empty intents array', () => {
    const strategy = new DeleteStrategy()
    expect(strategy.applies({ intent: { intents: [] } })).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// DeleteStrategy — Chinese Keywords (via RuleBasedIntentAnalyzer)
// ---------------------------------------------------------------------------

describe('DeleteStrategy — Chinese keywords', () => {
  const strategy = new DeleteStrategy()

  it('should match "删除" (delete)', () => {
    expect(strategy.applies(createContextFromInput('删除树'))).toBe(true)
  })

  it('should match "移除" (remove)', () => {
    expect(strategy.applies(createContextFromInput('移除房子'))).toBe(true)
  })

  it('should match "销毁" (destroy)', () => {
    expect(strategy.applies(createContextFromInput('销毁这个实体'))).toBe(true)
  })

  it('should match "清除" (clear)', () => {
    expect(strategy.applies(createContextFromInput('清除所有东西'))).toBe(true)
  })

  it('should match "干掉" (get rid of)', () => {
    expect(strategy.applies(createContextFromInput('干掉那棵树'))).toBe(true)
  })

  it('should match "消灭" (eliminate)', () => {
    expect(strategy.applies(createContextFromInput('消灭敌人'))).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// DeleteStrategy — English Keywords (via RuleBasedIntentAnalyzer)
// ---------------------------------------------------------------------------

describe('DeleteStrategy — English keywords', () => {
  const strategy = new DeleteStrategy()

  it('should match "delete"', () => {
    expect(strategy.applies(createContextFromInput('delete the tree'))).toBe(true)
  })

  it('should match "remove"', () => {
    expect(strategy.applies(createContextFromInput('remove the house'))).toBe(true)
  })

  it('should match "destroy"', () => {
    expect(strategy.applies(createContextFromInput('destroy the entity'))).toBe(true)
  })

  it('should match "clear"', () => {
    expect(strategy.applies(createContextFromInput('clear all items'))).toBe(true)
  })

  it('should match "erase"', () => {
    expect(strategy.applies(createContextFromInput('erase the tree'))).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// DeleteStrategy — Case Insensitivity
// ---------------------------------------------------------------------------

describe('DeleteStrategy — case insensitivity', () => {
  const strategy = new DeleteStrategy()

  it('should match UPPERCASE "DELETE"', () => {
    expect(strategy.applies(createContextFromInput('DELETE the tree'))).toBe(true)
  })

  it('should match Capitalized "Delete"', () => {
    expect(strategy.applies(createContextFromInput('Delete the tree'))).toBe(true)
  })

  it('should match lowercase "delete"', () => {
    expect(strategy.applies(createContextFromInput('delete the tree'))).toBe(true)
  })

  it('should match mixed case "DeLeTe"', () => {
    expect(strategy.applies(createContextFromInput('DeLeTe the tree'))).toBe(true)
  })

  it('should match UPPERCASE "REMOVE"', () => {
    expect(strategy.applies(createContextFromInput('REMOVE the house'))).toBe(true)
  })

  it('should match UPPERCASE "DESTROY"', () => {
    expect(strategy.applies(createContextFromInput('DESTROY the entity'))).toBe(true)
  })

  it('should match UPPERCASE "CLEAR"', () => {
    expect(strategy.applies(createContextFromInput('CLEAR all items'))).toBe(true)
  })

  it('should match UPPERCASE "ERASE"', () => {
    expect(strategy.applies(createContextFromInput('ERASE the tree'))).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// DeleteStrategy — Punctuation
// ---------------------------------------------------------------------------

describe('DeleteStrategy — punctuation', () => {
  const strategy = new DeleteStrategy()

  it('should match with trailing period', () => {
    expect(strategy.applies(createContextFromInput('删除树。'))).toBe(true)
  })

  it('should match with trailing comma', () => {
    expect(strategy.applies(createContextFromInput('remove the house,'))).toBe(true)
  })

  it('should match with exclamation mark', () => {
    expect(strategy.applies(createContextFromInput('销毁它！'))).toBe(true)
  })

  it('should match with question mark', () => {
    expect(strategy.applies(createContextFromInput('delete the tree?'))).toBe(true)
  })

  it('should match with parentheses', () => {
    expect(strategy.applies(createContextFromInput('(remove the tree)'))).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// DeleteStrategy — Whitespace
// ---------------------------------------------------------------------------

describe('DeleteStrategy — whitespace', () => {
  const strategy = new DeleteStrategy()

  it('should match with leading spaces', () => {
    expect(strategy.applies(createContextFromInput('   删除树'))).toBe(true)
  })

  it('should match with trailing spaces', () => {
    expect(strategy.applies(createContextFromInput('delete the tree   '))).toBe(true)
  })

  it('should match with multiple spaces', () => {
    expect(strategy.applies(createContextFromInput('delete    the    tree'))).toBe(true)
  })

  it('should match with tabs', () => {
    expect(strategy.applies(createContextFromInput('delete\tthe\ttree'))).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// DeleteStrategy — Deterministic
// ---------------------------------------------------------------------------

describe('DeleteStrategy — deterministic', () => {
  it('should return same result for same context across repeated calls', () => {
    const strategy = new DeleteStrategy()
    const context = createContextWithIntent('Delete')
    const r1 = strategy.applies(context)
    const r2 = strategy.applies(context)
    const r3 = strategy.applies(context)
    expect(r1).toBe(r2)
    expect(r2).toBe(r3)
  })

  it('should be idempotent across ten calls', () => {
    const strategy = new DeleteStrategy()
    const context = createContextWithIntent('Delete')
    for (let i = 0; i < 10; i++) {
      expect(strategy.applies(context)).toBe(true)
    }
  })

  it('should consistently return false for non-Delete contexts', () => {
    const strategy = new DeleteStrategy()
    const context = createContextWithIntent('Create')
    for (let i = 0; i < 10; i++) {
      expect(strategy.applies(context)).toBe(false)
    }
  })
})

// ---------------------------------------------------------------------------
// DeleteStrategy — Stateless
// ---------------------------------------------------------------------------

describe('DeleteStrategy — stateless', () => {
  it('should not retain state between calls', () => {
    const strategy = new DeleteStrategy()
    const ctx1 = createContextWithIntent('Delete')
    const ctx2 = emptyContext()
    expect(strategy.applies(ctx1)).toBe(true)
    expect(strategy.applies(ctx2)).toBe(false)
    expect(strategy.applies(ctx1)).toBe(true)
  })

  it('should be independent across multiple instances', () => {
    const s1 = new DeleteStrategy()
    const s2 = new DeleteStrategy()
    const context = createContextWithIntent('Delete')
    expect(s1.applies(context)).toBe(s2.applies(context))
  })
})

// ---------------------------------------------------------------------------
// DeleteStrategy — Pure / No Side Effects
// ---------------------------------------------------------------------------

describe('DeleteStrategy — pure / no side effects', () => {
  it('should not modify the context object', () => {
    const strategy = new DeleteStrategy()
    const context: SemanticContext = { intent: { intents: [{ type: 'Delete' }] } }
    const frozen = Object.freeze({ ...context })
    expect(() => strategy.applies(frozen)).not.toThrow()
  })

  it('should have no side effects on strategy instance', () => {
    const strategy = new DeleteStrategy()
    const before = Object.keys(strategy)
    strategy.applies(createContextWithIntent('Delete'))
    strategy.applies(emptyContext())
    strategy.applies(createContextWithIntent('Delete'))
    expect(Object.keys(strategy)).toEqual(before)
  })
})

// ---------------------------------------------------------------------------
// Selector Integration
// ---------------------------------------------------------------------------

describe('Selector integration', () => {
  it('should be selected before DefaultPromptStrategy when DeleteStrategy matches', () => {
    const selector = new DefaultPromptStrategySelector()
    const deleteStrategy = new DeleteStrategy()
    const defaultStrategy = new DefaultPromptStrategy()
    const context = createContextWithIntent('Delete')
    const result = selector.select([deleteStrategy, defaultStrategy], context)
    expect(result.name).toBe('delete')
  })

  it('should fall back to DefaultPromptStrategy for non-Delete intent', () => {
    const selector = new DefaultPromptStrategySelector()
    const deleteStrategy = new DeleteStrategy()
    const defaultStrategy = new DefaultPromptStrategy()
    const context = createContextWithIntent('Create')
    const result = selector.select([deleteStrategy, defaultStrategy], context)
    expect(result.name).toBe('default')
  })

  it('should work with full end-to-end pipeline', () => {
    const selector = new DefaultPromptStrategySelector()
    const deleteStrategy = new DeleteStrategy()
    const defaultStrategy = new DefaultPromptStrategy()
    const strategies = [deleteStrategy, defaultStrategy]

    const deleteInputs = ['删除树', '移除房子', '销毁实体', 'destroy the house', 'remove the tree', 'erase it']
    for (const input of deleteInputs) {
      const context = createContextFromInput(input)
      const result = selector.select(strategies, context)
      expect(result.name).toBe('delete')
    }
  })
})

// ---------------------------------------------------------------------------
// Rendering Integration
// ---------------------------------------------------------------------------

describe('Rendering integration', () => {
  it('DefaultPromptStrategyRenderer should render DeleteStrategy as "Prompt Strategy:\\n\\n- delete"', () => {
    const renderer = new DefaultPromptStrategyRenderer()
    const strategy = new DeleteStrategy()
    expect(renderer.render(strategy)).toBe('Prompt Strategy:\n\n- delete')
  })

  it('should render differently from all other strategies', () => {
    const renderer = new DefaultPromptStrategyRenderer()
    expect(renderer.render(new DeleteStrategy())).toBe('Prompt Strategy:\n\n- delete')
    expect(renderer.render(new ModifyStrategy())).toBe('Prompt Strategy:\n\n- modify')
    expect(renderer.render(new QueryStrategy())).toBe('Prompt Strategy:\n\n- query')
    expect(renderer.render(new CreateStrategy())).toBe('Prompt Strategy:\n\n- create')
    expect(renderer.render(new DefaultPromptStrategy())).toBe('Prompt Strategy:\n\n- default')
  })
})

// ---------------------------------------------------------------------------
// Default Fallback
// ---------------------------------------------------------------------------

describe('Default fallback', () => {
  it('DefaultPromptStrategy remains fallback when DeleteStrategy does not match', () => {
    const selector = new DefaultPromptStrategySelector()
    const deleteStrategy = new DeleteStrategy()
    const result = selector.select([deleteStrategy], emptyContext())
    expect(result.name).toBe('default')
  })

  it('DefaultPromptStrategy always applies', () => {
    const defaultStrategy = new DefaultPromptStrategy()
    expect(defaultStrategy.applies(emptyContext())).toBe(true)
    expect(defaultStrategy.applies(createContextWithIntent('Delete'))).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Coexistence with CreateStrategy
// ---------------------------------------------------------------------------

describe('Coexistence with CreateStrategy', () => {
  it('CreateStrategy should still win for Create requests', () => {
    const selector = new DefaultPromptStrategySelector()
    const strategies = [new CreateStrategy(), new QueryStrategy(), new ModifyStrategy(), new DeleteStrategy(), new DefaultPromptStrategy()]
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
    const strategies = [new CreateStrategy(), new QueryStrategy(), new ModifyStrategy(), new DeleteStrategy(), new DefaultPromptStrategy()]
    const result = selector.select(strategies, createContextWithIntent('Query'))
    expect(result.name).toBe('query')
  })
})

// ---------------------------------------------------------------------------
// Coexistence with ModifyStrategy
// ---------------------------------------------------------------------------

describe('Coexistence with ModifyStrategy', () => {
  it('ModifyStrategy should still win for Move requests', () => {
    const selector = new DefaultPromptStrategySelector()
    const strategies = [new CreateStrategy(), new QueryStrategy(), new ModifyStrategy(), new DeleteStrategy(), new DefaultPromptStrategy()]
    const result = selector.select(strategies, createContextWithIntent('Move'))
    expect(result.name).toBe('modify')
  })

  it('ModifyStrategy should still win for Modify requests', () => {
    const selector = new DefaultPromptStrategySelector()
    const strategies = [new CreateStrategy(), new QueryStrategy(), new ModifyStrategy(), new DeleteStrategy(), new DefaultPromptStrategy()]
    const result = selector.select(strategies, createContextWithIntent('Modify'))
    expect(result.name).toBe('modify')
  })

  it('DeleteStrategy should win for Delete requests', () => {
    const selector = new DefaultPromptStrategySelector()
    const strategies = [new CreateStrategy(), new QueryStrategy(), new ModifyStrategy(), new DeleteStrategy(), new DefaultPromptStrategy()]
    const result = selector.select(strategies, createContextWithIntent('Delete'))
    expect(result.name).toBe('delete')
  })
})

// ---------------------------------------------------------------------------
// Full Routing — Create → Query → Modify → Delete → Default
// ---------------------------------------------------------------------------

describe('Full routing — Create → Query → Modify → Delete → Default', () => {
  const selector = new DefaultPromptStrategySelector()
  const strategies = [new CreateStrategy(), new QueryStrategy(), new ModifyStrategy(), new DeleteStrategy(), new DefaultPromptStrategy()]

  it('should route "创建一棵树" → create', () => {
    expect(selector.select(strategies, createContextFromInput('创建一棵树')).name).toBe('create')
  })

  it('should route "列出所有树" → query', () => {
    expect(selector.select(strategies, createContextFromInput('列出所有树')).name).toBe('query')
  })

  it('should route "移动树到左边" → modify', () => {
    expect(selector.select(strategies, createContextFromInput('移动树到左边')).name).toBe('modify')
  })

  it('should route "修改房子颜色" → modify', () => {
    expect(selector.select(strategies, createContextFromInput('修改房子颜色')).name).toBe('modify')
  })

  it('should route "删除树" → delete', () => {
    expect(selector.select(strategies, createContextFromInput('删除树')).name).toBe('delete')
  })

  it('should route "移除房子" → delete', () => {
    expect(selector.select(strategies, createContextFromInput('移除房子')).name).toBe('delete')
  })

  it('should route "销毁实体" → delete', () => {
    expect(selector.select(strategies, createContextFromInput('销毁实体')).name).toBe('delete')
  })

  it('should route "create a tree" → create', () => {
    expect(selector.select(strategies, createContextFromInput('create a tree')).name).toBe('create')
  })

  it('should route "list all trees" → query', () => {
    expect(selector.select(strategies, createContextFromInput('list all trees')).name).toBe('query')
  })

  it('should route "move the tree" → modify', () => {
    expect(selector.select(strategies, createContextFromInput('move the tree')).name).toBe('modify')
  })

  it('should route "delete the tree" → delete', () => {
    expect(selector.select(strategies, createContextFromInput('delete the tree')).name).toBe('delete')
  })

  it('should route "destroy the house" → delete', () => {
    expect(selector.select(strategies, createContextFromInput('destroy the house')).name).toBe('delete')
  })

  it('should route "remove the tree" → delete', () => {
    expect(selector.select(strategies, createContextFromInput('remove the tree')).name).toBe('delete')
  })
})

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

describe('Exports', () => {
  it('should export DeleteStrategy from strategy/index', () => {
    const strategy = new DeleteStrategy()
    expect(strategy.name).toBe('delete')
  })

  it('should export DeleteStrategy from package root', () => {
    const Strategy = DeleteStrategy as typeof DeleteStrategyFromRoot
    const strategy = new Strategy()
    expect(strategy.name).toBe('delete')
  })
})

// ---------------------------------------------------------------------------
// Architecture Compliance
// ---------------------------------------------------------------------------

describe('Architecture compliance', () => {
  it('should not depend on Planner', () => {
    const strategy = new DeleteStrategy()
    expect(strategy.applies(createContextWithIntent('Delete'))).toBe(true)
  })

  it('should not depend on Runtime', () => {
    const strategy = new DeleteStrategy()
    expect(strategy.applies(emptyContext())).toBe(false)
  })

  it('should not depend on Provider', () => {
    const strategy = new DeleteStrategy()
    expect(strategy).toBeInstanceOf(DeleteStrategy)
  })

  it('should not depend on Memory', () => {
    const strategy = new DeleteStrategy()
    expect(strategy.applies(createContextWithIntent('Delete'))).toBe(true)
  })

  it('should not depend on ToolCalling', () => {
    const strategy = new DeleteStrategy()
    expect(strategy.name).toBe('delete')
  })

  it('should not depend on AgentLoop', () => {
    const strategy = new DeleteStrategy()
    expect(strategy.applies({ intent: { intents: [] } })).toBe(false)
  })

  it('should not depend on PromptBuilder', () => {
    const selector = new DefaultPromptStrategySelector()
    expect(selector.select([new DeleteStrategy()], emptyContext()).name).toBe('default')
  })

  it('should not depend on Pipeline', () => {
    const strategy = new DeleteStrategy()
    expect(strategy.name).toBe('delete')
  })

  it('should be pure — no side effects', () => {
    const strategy = new DeleteStrategy()
    const context: SemanticContext = { intent: { intents: [{ type: 'Delete' }] } }
    const before = JSON.stringify(context)
    strategy.applies(context)
    expect(JSON.stringify(context)).toBe(before)
  })

  it('should be stateless — no internal state', () => {
    const s1 = new DeleteStrategy()
    const s2 = new DeleteStrategy()
    expect(s1.applies(createContextWithIntent('Delete'))).toBe(s2.applies(createContextWithIntent('Delete')))
  })

  it('should be non-mutating — never modifies inputs', () => {
    const selector = new DefaultPromptStrategySelector()
    const strategies: readonly PromptStrategy[] = [new DeleteStrategy()]
    const context: SemanticContext = createContextWithIntent('Delete')
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
    const strategy = new DeleteStrategy()
    expect(strategy).toBeInstanceOf(DeleteStrategy)
  })

  it('should not affect RetryPlanner behavior', () => {
    const selector = new DefaultPromptStrategySelector()
    const strategies = [new DeleteStrategy()]
    const result = selector.select(strategies, createContextWithIntent('Delete'))
    expect(result.name).toBe('delete')
  })
})

// ---------------------------------------------------------------------------
// ToolCallPlanner Compatibility
// ---------------------------------------------------------------------------

describe('ToolCallPlanner Compatibility', () => {
  it('should work with ToolCallPlanner', () => {
    const strategy = new DeleteStrategy()
    expect(strategy).toBeInstanceOf(DeleteStrategy)
  })

  it('should not affect ToolCallPlanner tool execution', () => {
    const selector = new DefaultPromptStrategySelector()
    const strategies = [new DeleteStrategy()]
    const result = selector.select(strategies, createContextWithIntent('Delete'))
    expect(result.name).toBe('delete')
  })
})

// ---------------------------------------------------------------------------
// Streaming Compatibility
// ---------------------------------------------------------------------------

describe('Streaming Compatibility', () => {
  it('should work with StreamingProvider', () => {
    const strategy = new DeleteStrategy()
    expect(strategy).toBeInstanceOf(DeleteStrategy)
  })

  it('should not affect streaming', () => {
    const selector = new DefaultPromptStrategySelector()
    const strategies = [new DeleteStrategy()]
    const result = selector.select(strategies, createContextWithIntent('Delete'))
    expect(result.name).toBe('delete')
  })
})

// ---------------------------------------------------------------------------
// AgentLoop Compatibility
// ---------------------------------------------------------------------------

describe('AgentLoop Compatibility', () => {
  it('should work with AgentLoop', () => {
    const strategy = new DeleteStrategy()
    expect(strategy).toBeInstanceOf(DeleteStrategy)
  })

  it('should not affect AgentLoop iteration', () => {
    const selector = new DefaultPromptStrategySelector()
    const strategies = [new DeleteStrategy()]
    const result = selector.select(strategies, createContextWithIntent('Delete'))
    expect(result.name).toBe('delete')
  })
})
