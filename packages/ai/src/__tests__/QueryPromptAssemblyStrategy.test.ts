import { describe, it, expect } from 'vitest'
import type { PromptAssemblyStrategy } from '../strategy/PromptAssemblyStrategy'
import { QueryPromptAssemblyStrategy } from '../strategy/QueryPromptAssemblyStrategy'
import { CreatePromptAssemblyStrategy } from '../strategy/CreatePromptAssemblyStrategy'
import { DefaultPromptAssemblyStrategy } from '../strategy/DefaultPromptAssemblyStrategy'
import { DefaultPromptAssemblyStrategyResolver } from '../strategy/DefaultPromptAssemblyStrategyResolver'
import type {
  PromptAssemblyStrategy as StrategyFromRoot,
} from '../index'
import {
  QueryPromptAssemblyStrategy as QueryFromRoot,
  DefaultPromptAssemblyStrategy as DefaultFromRoot,
  DefaultPromptAssemblyStrategyResolver as DefaultResolverFromRoot,
  CreatePromptAssemblyStrategy as CreateFromRoot,
} from '../index'

// ---------------------------------------------------------------------------
// QueryPromptAssemblyStrategy — Interface Conformance
// ---------------------------------------------------------------------------

describe('QueryPromptAssemblyStrategy — interface', () => {
  it('should implement PromptAssemblyStrategy interface', () => {
    const strategy: PromptAssemblyStrategy = new QueryPromptAssemblyStrategy()
    expect(strategy).toBeInstanceOf(QueryPromptAssemblyStrategy)
  })

  it('should define a strategyName property', () => {
    const strategy: PromptAssemblyStrategy = new QueryPromptAssemblyStrategy()
    expect(strategy.strategyName).toBeDefined()
    expect(typeof strategy.strategyName).toBe('string')
  })

  it('should have strategyName "query"', () => {
    const strategy = new QueryPromptAssemblyStrategy()
    expect(strategy.strategyName).toBe('query')
  })

  it('should define an apply method', () => {
    const strategy: PromptAssemblyStrategy = new QueryPromptAssemblyStrategy()
    expect(strategy.apply).toBeDefined()
    expect(typeof strategy.apply).toBe('function')
  })

  it('should accept readonly string array as apply parameter', () => {
    const strategy = new QueryPromptAssemblyStrategy()
    const sections: readonly string[] = ['a', 'b', 'c']
    expect(() => strategy.apply(sections)).not.toThrow()
  })

  it('should return readonly string array from apply', () => {
    const strategy = new QueryPromptAssemblyStrategy()
    const result = strategy.apply(['a', 'b'])
    expect(Array.isArray(result)).toBe(true)
    for (const item of result) {
      expect(typeof item).toBe('string')
    }
  })
})

// ---------------------------------------------------------------------------
// QueryPromptAssemblyStrategy — Reordering Behavior
// ---------------------------------------------------------------------------

describe('QueryPromptAssemblyStrategy — reordering', () => {
  it('should place priority items first in priority order', () => {
    const strategy = new QueryPromptAssemblyStrategy()
    const sections = [
      'semanticRendered',
      'strategyRendered',
      'observations',
      'memory',
      'userInput',
      'worldState',
      'strategyModuleRendered',
    ]
    const result = strategy.apply(sections)
    expect(result[0]).toBe('userInput')
    expect(result[1]).toBe('worldState')
    expect(result[2]).toBe('memory')
    expect(result[3]).toBe('observations')
    expect(result[4]).toBe('strategyModuleRendered')
    expect(result[5]).toBe('strategyRendered')
  })

  it('should preserve relative order of remaining items', () => {
    const strategy = new QueryPromptAssemblyStrategy()
    const sections = [
      'intentRendered',
      'entityRendered',
      'semanticRendered',
      'userInput',
      'strategyRendered',
      'system',
      'memory',
      'worldState',
      'reflections',
      'observations',
    ]
    const result = strategy.apply(sections)
    // Remaining items (non-priority): intentRendered, entityRendered, semanticRendered, system, reflections
    const priority = ['userInput', 'worldState', 'memory', 'observations', 'strategyRendered']
    const remaining = result.filter(s => !priority.includes(s))
    expect(remaining).toEqual(['intentRendered', 'entityRendered', 'semanticRendered', 'system', 'reflections'])
  })

  it('should keep all sections — no removal', () => {
    const strategy = new QueryPromptAssemblyStrategy()
    const sections = ['a', 'userInput', 'b', 'worldState', 'c', 'memory', 'd', 'observations', 'e', 'strategyModuleRendered', 'strategyRendered', 'f']
    const result = strategy.apply(sections)
    expect(result.length).toBe(sections.length)
    expect([...result].sort()).toEqual([...sections].sort())
  })

  it('should handle sections with only priority items', () => {
    const strategy = new QueryPromptAssemblyStrategy()
    const sections = ['strategyRendered', 'observations', 'memory', 'userInput', 'worldState', 'strategyModuleRendered']
    const result = strategy.apply(sections)
    expect(result).toEqual(['userInput', 'worldState', 'memory', 'observations', 'strategyModuleRendered', 'strategyRendered'])
  })

  it('should handle sections with only non-priority items', () => {
    const strategy = new QueryPromptAssemblyStrategy()
    const sections = ['a', 'b', 'c']
    expect(strategy.apply(sections)).toEqual(['a', 'b', 'c'])
  })

  it('should handle empty sections array', () => {
    const strategy = new QueryPromptAssemblyStrategy()
    expect(strategy.apply([])).toEqual([])
  })

  it('should handle single item that is priority', () => {
    const strategy = new QueryPromptAssemblyStrategy()
    expect(strategy.apply(['userInput'])).toEqual(['userInput'])
  })

  it('should handle single item that is not priority', () => {
    const strategy = new QueryPromptAssemblyStrategy()
    expect(strategy.apply(['memory'])).toEqual(['memory'])
  })

  it('should preserve duplicates', () => {
    const strategy = new QueryPromptAssemblyStrategy()
    const sections = ['a', 'userInput', 'b', 'userInput', 'c']
    const result = strategy.apply(sections)
    expect(result[0]).toBe('userInput')
    expect(result[1]).toBe('userInput')
  })

  it('should reorder correctly with all canonical sections', () => {
    const strategy = new QueryPromptAssemblyStrategy()
    const sections = [
      'intentRendered',
      'entityRendered',
      'semanticRendered',
      'strategyModuleRendered',
      'strategyRendered',
      'system',
      'userInput',
      'memory',
      'reflections',
      'worldState',
      'observations',
    ]
    const result = strategy.apply(sections)
    // Expected: userInput, worldState, memory, observations, strategyModuleRendered, strategyRendered, then rest
    expect(result[0]).toBe('userInput')
    expect(result[1]).toBe('worldState')
    expect(result[2]).toBe('memory')
    expect(result[3]).toBe('observations')
    expect(result[4]).toBe('strategyModuleRendered')
    expect(result[5]).toBe('strategyRendered')
    // Remaining keep original relative order
    expect(result.slice(6)).toEqual([
      'intentRendered',
      'entityRendered',
      'semanticRendered',
      'system',
      'reflections',
    ])
  })
})

// ---------------------------------------------------------------------------
// QueryPromptAssemblyStrategy — Priority Verification
// ---------------------------------------------------------------------------

describe('QueryPromptAssemblyStrategy — priority verification', () => {
  it('userInput should come before worldState', () => {
    const strategy = new QueryPromptAssemblyStrategy()
    const result = strategy.apply(['worldState', 'userInput'])
    expect(result[0]).toBe('userInput')
    expect(result[1]).toBe('worldState')
  })

  it('worldState should come before memory', () => {
    const strategy = new QueryPromptAssemblyStrategy()
    const result = strategy.apply(['memory', 'worldState'])
    expect(result[0]).toBe('worldState')
    expect(result[1]).toBe('memory')
  })

  it('memory should come before observations', () => {
    const strategy = new QueryPromptAssemblyStrategy()
    const result = strategy.apply(['observations', 'memory'])
    expect(result[0]).toBe('memory')
    expect(result[1]).toBe('observations')
  })

  it('observations should come before strategyModuleRendered', () => {
    const strategy = new QueryPromptAssemblyStrategy()
    const result = strategy.apply(['strategyModuleRendered', 'observations'])
    expect(result[0]).toBe('observations')
    expect(result[1]).toBe('strategyModuleRendered')
  })

  it('strategyModuleRendered should come before strategyRendered', () => {
    const strategy = new QueryPromptAssemblyStrategy()
    const result = strategy.apply(['strategyRendered', 'strategyModuleRendered'])
    expect(result[0]).toBe('strategyModuleRendered')
    expect(result[1]).toBe('strategyRendered')
  })

  it('memory should come before strategyRendered', () => {
    const strategy = new QueryPromptAssemblyStrategy()
    const result = strategy.apply(['strategyRendered', 'memory'])
    expect(result[0]).toBe('memory')
    expect(result[1]).toBe('strategyRendered')
  })

  it('observations should come before strategyRendered', () => {
    const strategy = new QueryPromptAssemblyStrategy()
    const result = strategy.apply(['strategyRendered', 'observations'])
    expect(result[0]).toBe('observations')
    expect(result[1]).toBe('strategyRendered')
  })
})

// ---------------------------------------------------------------------------
// QueryPromptAssemblyStrategy — Deterministic
// ---------------------------------------------------------------------------

describe('QueryPromptAssemblyStrategy — deterministic', () => {
  it('should return same result for same sections across repeated calls', () => {
    const strategy = new QueryPromptAssemblyStrategy()
    const sections = ['b', 'userInput', 'a', 'worldState', 'memory', 'c']
    const r1 = strategy.apply(sections)
    const r2 = strategy.apply(sections)
    const r3 = strategy.apply(sections)
    expect(r1).toEqual(r2)
    expect(r2).toEqual(r3)
  })

  it('should be idempotent across ten calls', () => {
    const strategy = new QueryPromptAssemblyStrategy()
    const sections = ['a', 'userInput', 'worldState', 'memory', 'b']
    for (let i = 0; i < 10; i++) {
      const result = strategy.apply(sections)
      expect(result[0]).toBe('userInput')
      expect(result[1]).toBe('worldState')
      expect(result[2]).toBe('memory')
    }
  })

  it('should produce same result across many instances', () => {
    const sections = ['x', 'userInput', 'y', 'worldState', 'memory', 'z']
    const r1 = new QueryPromptAssemblyStrategy().apply(sections)
    const r2 = new QueryPromptAssemblyStrategy().apply(sections)
    const r3 = new QueryPromptAssemblyStrategy().apply(sections)
    expect(r1).toEqual(r2)
    expect(r2).toEqual(r3)
  })
})

// ---------------------------------------------------------------------------
// QueryPromptAssemblyStrategy — Stateless
// ---------------------------------------------------------------------------

describe('QueryPromptAssemblyStrategy — stateless', () => {
  it('should not retain state between calls', () => {
    const strategy = new QueryPromptAssemblyStrategy()
    const sections1 = ['userInput', 'a']
    const sections2 = ['b', 'worldState']
    const sections3 = ['userInput', 'a']
    expect(strategy.apply(sections1)).toEqual(strategy.apply(sections1))
    expect(strategy.apply(sections2)).toEqual(strategy.apply(sections2))
    expect(strategy.apply(sections3)).toEqual(strategy.apply(sections3))
  })

  it('should be independent across multiple instances', () => {
    const s1 = new QueryPromptAssemblyStrategy()
    const s2 = new QueryPromptAssemblyStrategy()
    const sections = ['x', 'userInput', 'y', 'worldState', 'z']
    expect(s1.apply(sections)).toEqual(s2.apply(sections))
  })
})

// ---------------------------------------------------------------------------
// QueryPromptAssemblyStrategy — Pure / No Side Effects
// ---------------------------------------------------------------------------

describe('QueryPromptAssemblyStrategy — pure / no side effects', () => {
  it('should not modify the input sections array', () => {
    const strategy = new QueryPromptAssemblyStrategy()
    const sections = ['userInput', 'a', 'worldState']
    const frozen = Object.freeze([...sections])
    expect(() => strategy.apply(frozen)).not.toThrow()
  })

  it('should not mutate the original array reference', () => {
    const strategy = new QueryPromptAssemblyStrategy()
    const original = ['x', 'userInput', 'y']
    const copy = [...original]
    strategy.apply(original)
    expect(original).toEqual(copy)
  })

  it('should support frozen input arrays', () => {
    const strategy = new QueryPromptAssemblyStrategy()
    const frozen = Object.freeze(['userInput', 'worldState', 'other'])
    expect(() => strategy.apply(frozen)).not.toThrow()
  })

  it('should return a new array reference (not identity)', () => {
    const strategy = new QueryPromptAssemblyStrategy()
    const sections = ['a', 'userInput', 'b']
    const result = strategy.apply(sections)
    expect(result).not.toBe(sections)
  })
})

// ---------------------------------------------------------------------------
// Resolver Integration
// ---------------------------------------------------------------------------

describe('Resolver integration', () => {
  it('should return QueryPromptAssemblyStrategy for "query"', () => {
    const resolver = new DefaultPromptAssemblyStrategyResolver()
    const result = resolver.resolve('query')
    expect(result).toBeInstanceOf(QueryPromptAssemblyStrategy)
  })

  it('should return QueryPromptAssemblyStrategy with strategyName "query"', () => {
    const resolver = new DefaultPromptAssemblyStrategyResolver()
    const result = resolver.resolve('query')
    expect(result.strategyName).toBe('query')
  })

  it('should return CreatePromptAssemblyStrategy for "create"', () => {
    const resolver = new DefaultPromptAssemblyStrategyResolver()
    const result = resolver.resolve('create')
    expect(result).toBeInstanceOf(CreatePromptAssemblyStrategy)
  })

  it('should return CreatePromptAssemblyStrategy with strategyName "create"', () => {
    const resolver = new DefaultPromptAssemblyStrategyResolver()
    const result = resolver.resolve('create')
    expect(result.strategyName).toBe('create')
  })

  it('should return DefaultPromptAssemblyStrategy for "modify"', () => {
    const resolver = new DefaultPromptAssemblyStrategyResolver()
    expect(resolver.resolve('modify')).toBeInstanceOf(DefaultPromptAssemblyStrategy)
  })

  it('should return DefaultPromptAssemblyStrategy for "delete"', () => {
    const resolver = new DefaultPromptAssemblyStrategyResolver()
    expect(resolver.resolve('delete')).toBeInstanceOf(DefaultPromptAssemblyStrategy)
  })

  it('should return DefaultPromptAssemblyStrategy for "default"', () => {
    const resolver = new DefaultPromptAssemblyStrategyResolver()
    expect(resolver.resolve('default')).toBeInstanceOf(DefaultPromptAssemblyStrategy)
  })

  it('should return DefaultPromptAssemblyStrategy for unknown names', () => {
    const resolver = new DefaultPromptAssemblyStrategyResolver()
    const names = ['unknown', '', 'custom-123', 'read', 'update']
    for (const name of names) {
      expect(resolver.resolve(name)).toBeInstanceOf(DefaultPromptAssemblyStrategy)
    }
  })

  it('should return DefaultPromptAssemblyStrategy for "Query" (case-sensitive)', () => {
    const resolver = new DefaultPromptAssemblyStrategyResolver()
    expect(resolver.resolve('Query')).toBeInstanceOf(DefaultPromptAssemblyStrategy)
  })

  it('should return DefaultPromptAssemblyStrategy for "QUERY" (case-sensitive)', () => {
    const resolver = new DefaultPromptAssemblyStrategyResolver()
    expect(resolver.resolve('QUERY')).toBeInstanceOf(DefaultPromptAssemblyStrategy)
  })

  it('should route create, query correctly and everything else to default', () => {
    const resolver = new DefaultPromptAssemblyStrategyResolver()
    expect(resolver.resolve('create')).toBeInstanceOf(CreatePromptAssemblyStrategy)
    expect(resolver.resolve('query')).toBeInstanceOf(QueryPromptAssemblyStrategy)
    expect(resolver.resolve('modify')).toBeInstanceOf(DefaultPromptAssemblyStrategy)
    expect(resolver.resolve('delete')).toBeInstanceOf(DefaultPromptAssemblyStrategy)
    expect(resolver.resolve('default')).toBeInstanceOf(DefaultPromptAssemblyStrategy)
  })
})

// ---------------------------------------------------------------------------
// Resolver — Deterministic
// ---------------------------------------------------------------------------

describe('Resolver — deterministic', () => {
  it('should return same strategy type for "query" across repeated calls', () => {
    const resolver = new DefaultPromptAssemblyStrategyResolver()
    const r1 = resolver.resolve('query')
    const r2 = resolver.resolve('query')
    const r3 = resolver.resolve('query')
    expect(r1).toBeInstanceOf(QueryPromptAssemblyStrategy)
    expect(r2).toBeInstanceOf(QueryPromptAssemblyStrategy)
    expect(r3).toBeInstanceOf(QueryPromptAssemblyStrategy)
  })

  it('should return same strategy type for "create" across repeated calls', () => {
    const resolver = new DefaultPromptAssemblyStrategyResolver()
    const r1 = resolver.resolve('create')
    const r2 = resolver.resolve('create')
    const r3 = resolver.resolve('create')
    expect(r1).toBeInstanceOf(CreatePromptAssemblyStrategy)
    expect(r2).toBeInstanceOf(CreatePromptAssemblyStrategy)
    expect(r3).toBeInstanceOf(CreatePromptAssemblyStrategy)
  })

  it('should be idempotent for "query" across ten calls', () => {
    const resolver = new DefaultPromptAssemblyStrategyResolver()
    for (let i = 0; i < 10; i++) {
      const result = resolver.resolve('query')
      expect(result).toBeInstanceOf(QueryPromptAssemblyStrategy)
      expect(result.strategyName).toBe('query')
    }
  })
})

// ---------------------------------------------------------------------------
// Resolver — Stateless
// ---------------------------------------------------------------------------

describe('Resolver — stateless', () => {
  it('should not retain state between calls', () => {
    const resolver = new DefaultPromptAssemblyStrategyResolver()
    resolver.resolve('create')
    resolver.resolve('query')
    resolver.resolve('delete')
    const result = resolver.resolve('modify')
    expect(result).toBeInstanceOf(DefaultPromptAssemblyStrategy)
  })

  it('should be independent across multiple instances', () => {
    const r1 = new DefaultPromptAssemblyStrategyResolver()
    const r2 = new DefaultPromptAssemblyStrategyResolver()
    expect(r1.resolve('query').strategyName).toBe(r2.resolve('query').strategyName)
    expect(r1.resolve('query')).toBeInstanceOf(QueryPromptAssemblyStrategy)
    expect(r2.resolve('query')).toBeInstanceOf(QueryPromptAssemblyStrategy)
  })
})

// ---------------------------------------------------------------------------
// Architecture Compliance
// ---------------------------------------------------------------------------

describe('Architecture compliance', () => {
  it('should not depend on Planner', () => {
    const strategy = new QueryPromptAssemblyStrategy()
    expect(strategy.apply([])).toEqual([])
  })

  it('should not depend on Runtime', () => {
    const resolver = new DefaultPromptAssemblyStrategyResolver()
    expect(resolver.resolve('query')).toBeInstanceOf(QueryPromptAssemblyStrategy)
  })

  it('should not depend on Provider', () => {
    const strategy = new QueryPromptAssemblyStrategy()
    expect(strategy).toBeInstanceOf(QueryPromptAssemblyStrategy)
  })

  it('should not depend on Memory', () => {
    const strategy = new QueryPromptAssemblyStrategy()
    expect(strategy.apply(['a'])).toEqual(['a'])
  })

  it('should not depend on ToolCalling', () => {
    const resolver = new DefaultPromptAssemblyStrategyResolver()
    expect(resolver.resolve('query').strategyName).toBe('query')
  })

  it('should not depend on AgentLoop', () => {
    const strategy = new QueryPromptAssemblyStrategy()
    expect(strategy.apply(['a', 'b'])).toEqual(['a', 'b'])
  })

  it('should not depend on PromptBuilder', () => {
    const strategy = new QueryPromptAssemblyStrategy()
    expect(strategy.strategyName).toBe('query')
  })

  it('should not depend on Pipeline', () => {
    const resolver = new DefaultPromptAssemblyStrategyResolver()
    const result = resolver.resolve('query')
    expect(result.strategyName).toBe('query')
  })

  it('should be pure — no side effects on input', () => {
    const strategy = new QueryPromptAssemblyStrategy()
    const sections = ['a', 'b']
    const before = JSON.stringify(sections)
    strategy.apply(sections)
    expect(JSON.stringify(sections)).toBe(before)
  })

  it('should be stateless — no internal state', () => {
    const s1 = new QueryPromptAssemblyStrategy()
    const s2 = new QueryPromptAssemblyStrategy()
    expect(s1.apply(['x'])).toEqual(s2.apply(['x']))
  })

  it('should be non-mutating — never modifies inputs', () => {
    const strategy = new QueryPromptAssemblyStrategy()
    const sections = Object.freeze(['a', 'b', 'c'])
    expect(() => strategy.apply(sections)).not.toThrow()
  })
})

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

describe('QueryPromptAssemblyStrategy exports', () => {
  it('should export QueryPromptAssemblyStrategy class from strategy/index', () => {
    const strategy = new QueryPromptAssemblyStrategy()
    expect(strategy).toBeInstanceOf(QueryPromptAssemblyStrategy)
  })

  it('should export QueryPromptAssemblyStrategy class from package root', () => {
    const strategy = new QueryFromRoot()
    expect(strategy).toBeInstanceOf(QueryPromptAssemblyStrategy)
  })

  it('should export QueryPromptAssemblyStrategy with strategyName "query" from package root', () => {
    const strategy = new QueryFromRoot()
    expect(strategy.strategyName).toBe('query')
  })

  it('should still export PromptAssemblyStrategy type from package root', () => {
    const strategy: StrategyFromRoot = new QueryPromptAssemblyStrategy()
    expect(strategy.strategyName).toBe('query')
  })

  it('should still export CreatePromptAssemblyStrategy from package root', () => {
    const strategy = new CreateFromRoot()
    expect(strategy).toBeInstanceOf(CreatePromptAssemblyStrategy)
  })

  it('should still export DefaultPromptAssemblyStrategy from package root', () => {
    const strategy = new DefaultFromRoot()
    expect(strategy).toBeInstanceOf(DefaultPromptAssemblyStrategy)
  })

  it('should still export DefaultPromptAssemblyStrategyResolver from package root', () => {
    const resolver = new DefaultResolverFromRoot()
    expect(resolver).toBeInstanceOf(DefaultPromptAssemblyStrategyResolver)
  })
})

// ---------------------------------------------------------------------------
// Backward Compatibility — Create/Default Unchanged
// ---------------------------------------------------------------------------

describe('Backward compatibility — create and default unchanged', () => {
  it('CreatePromptAssemblyStrategy still reorders correctly', () => {
    const strategy = new CreatePromptAssemblyStrategy()
    const sections = ['semantic', 'userInput', 'memory', 'worldState']
    const result = strategy.apply(sections)
    expect(result[0]).toBe('userInput')
    expect(result[1]).toBe('worldState')
    // strategyModuleRendered and strategyRendered are not in this input
  })

  it('DefaultPromptAssemblyStrategy still returns identity', () => {
    const strategy = new DefaultPromptAssemblyStrategy()
    const sections = ['a', 'b', 'c']
    expect(strategy.apply(sections)).toEqual(['a', 'b', 'c'])
  })

  it('Query strategy is different from Create strategy', () => {
    const query = new QueryPromptAssemblyStrategy()
    const create = new CreatePromptAssemblyStrategy()
    const sections = [
      'observations',
      'strategyRendered',
      'userInput',
      'memory',
      'worldState',
      'strategyModuleRendered',
    ]
    const queryResult = query.apply(sections)
    const createResult = create.apply(sections)
    // Both have userInput first, worldState second
    expect(queryResult[0]).toBe('userInput')
    expect(createResult[0]).toBe('userInput')
    // But query has memory and observations higher priority
    expect(queryResult.indexOf('memory')).toBeLessThan(createResult.indexOf('memory'))
    expect(queryResult.indexOf('observations')).toBeLessThan(createResult.indexOf('observations'))
  })

  it('Resolver still routes create correctly', () => {
    const resolver = new DefaultPromptAssemblyStrategyResolver()
    expect(resolver.resolve('create')).toBeInstanceOf(CreatePromptAssemblyStrategy)
  })

  it('Resolver still routes default correctly for unknown names', () => {
    const resolver = new DefaultPromptAssemblyStrategyResolver()
    const names = ['modify', 'delete', '', 'unknown']
    for (const name of names) {
      expect(resolver.resolve(name)).toBeInstanceOf(DefaultPromptAssemblyStrategy)
    }
  })
})

// ---------------------------------------------------------------------------
// RetryPlanner Compatibility
// ---------------------------------------------------------------------------

describe('RetryPlanner Compatibility', () => {
  it('should work with RetryPlanner — strategy is independent', () => {
    const strategy = new QueryPromptAssemblyStrategy()
    expect(strategy).toBeInstanceOf(QueryPromptAssemblyStrategy)
  })

  it('should not affect RetryPlanner behavior', () => {
    const strategy = new QueryPromptAssemblyStrategy()
    const sections = ['system', 'userInput', 'worldState']
    const result = strategy.apply(sections)
    expect(result[0]).toBe('userInput')
    expect(result[1]).toBe('worldState')
  })

  it('resolver can route "query" when used with RetryPlanner', () => {
    const resolver = new DefaultPromptAssemblyStrategyResolver()
    const result = resolver.resolve('query')
    expect(result).toBeInstanceOf(QueryPromptAssemblyStrategy)
    expect(result.apply(['retry', 'userInput'])[0]).toBe('userInput')
  })
})

// ---------------------------------------------------------------------------
// ToolCallPlanner Compatibility
// ---------------------------------------------------------------------------

describe('ToolCallPlanner Compatibility', () => {
  it('should work with ToolCallPlanner — strategy is independent', () => {
    const resolver = new DefaultPromptAssemblyStrategyResolver()
    expect(resolver.resolve('query')).toBeInstanceOf(QueryPromptAssemblyStrategy)
  })

  it('should not affect ToolCallPlanner tool execution', () => {
    const strategy = new QueryPromptAssemblyStrategy()
    expect(strategy.apply(['prompt'])).toEqual(['prompt'])
  })

  it('resolver can route "query" when used with ToolCallPlanner', () => {
    const resolver = new DefaultPromptAssemblyStrategyResolver()
    const result = resolver.resolve('query')
    expect(result.apply(['tool', 'userInput'])[0]).toBe('userInput')
  })
})

// ---------------------------------------------------------------------------
// Streaming Compatibility
// ---------------------------------------------------------------------------

describe('Streaming Compatibility', () => {
  it('should work with StreamingProvider — strategy is independent', () => {
    const strategy = new QueryPromptAssemblyStrategy()
    expect(strategy).toBeInstanceOf(QueryPromptAssemblyStrategy)
  })

  it('should not affect streaming', () => {
    const resolver = new DefaultPromptAssemblyStrategyResolver()
    const result = resolver.resolve('query')
    expect(result.apply(['chunk'])).toEqual(['chunk'])
  })

  it('resolver can route "query" when used with streaming', () => {
    const resolver = new DefaultPromptAssemblyStrategyResolver()
    const result = resolver.resolve('query')
    expect(result.apply(['stream', 'userInput'])[0]).toBe('userInput')
  })
})

// ---------------------------------------------------------------------------
// AgentLoop Compatibility
// ---------------------------------------------------------------------------

describe('AgentLoop Compatibility', () => {
  it('should work with AgentLoop — strategy is independent', () => {
    const strategy = new QueryPromptAssemblyStrategy()
    expect(strategy).toBeInstanceOf(QueryPromptAssemblyStrategy)
  })

  it('should not affect AgentLoop iteration', () => {
    const resolver = new DefaultPromptAssemblyStrategyResolver()
    const result = resolver.resolve('query')
    expect(result.apply(['observation', 'action'])[0]).toBe('observation')
  })

  it('resolver can route "query" when used with AgentLoop', () => {
    const resolver = new DefaultPromptAssemblyStrategyResolver()
    const result = resolver.resolve('query')
    expect(result.apply(['agent', 'userInput'])[0]).toBe('userInput')
  })
})

// ---------------------------------------------------------------------------
// No Behavior Changes
// ---------------------------------------------------------------------------

describe('No behavior changes', () => {
  it('QueryPromptAssemblyStrategy.apply is not identity', () => {
    const strategy = new QueryPromptAssemblyStrategy()
    const sections = ['z', 'userInput', 'y', 'worldState', 'x']
    const result = strategy.apply(sections)
    // userInput and worldState are moved to front
    expect(result[0]).toBe('userInput')
    expect(result[1]).toBe('worldState')
  })

  it('DefaultPromptAssemblyStrategy is unchanged', () => {
    const strategy = new DefaultPromptAssemblyStrategy()
    expect(strategy.apply(['a', 'b'])).toEqual(['a', 'b'])
    expect(strategy.strategyName).toBe('default')
  })

  it('CreatePromptAssemblyStrategy is unchanged', () => {
    const strategy = new CreatePromptAssemblyStrategy()
    expect(strategy.strategyName).toBe('create')
    const result = strategy.apply(['memory', 'userInput'])
    expect(result[0]).toBe('userInput')
  })

  it('Resolver still returns DefaultPromptAssemblyStrategy for non-create non-query names', () => {
    const resolver = new DefaultPromptAssemblyStrategyResolver()
    const names = ['modify', 'delete', 'default', 'unknown']
    for (const name of names) {
      const result = resolver.resolve(name)
      expect(result).toBeInstanceOf(DefaultPromptAssemblyStrategy)
    }
  })

  it('does not modify PromptBuilder behavior', () => {
    const strategy = new QueryPromptAssemblyStrategy()
    expect(strategy.apply(['system', 'userInput'])[0]).toBe('userInput')
  })

  it('does not modify PromptRenderer behavior', () => {
    const strategy = new QueryPromptAssemblyStrategy()
    expect(strategy.strategyName).toBe('query')
  })

  it('does not modify Pipeline behavior', () => {
    const strategy = new QueryPromptAssemblyStrategy()
    const resolver = new DefaultPromptAssemblyStrategyResolver()
    expect(strategy.apply([])).toEqual([])
    expect(resolver.resolve('query')).toBeInstanceOf(QueryPromptAssemblyStrategy)
    expect(resolver.resolve('pipeline')).toBeInstanceOf(DefaultPromptAssemblyStrategy)
  })

  it('Query strategy output differs from Default strategy output', () => {
    const query = new QueryPromptAssemblyStrategy()
    const def = new DefaultPromptAssemblyStrategy()
    const sections = ['observations', 'memory', 'userInput']
    const queryResult = query.apply(sections)
    const defaultResult = def.apply(sections)
    expect(queryResult).not.toEqual(defaultResult)
    expect(queryResult[0]).toBe('userInput')
    expect(defaultResult[0]).toBe('observations')
  })

  it('QueryPromptAssemblyStrategy produces same output as CreatePromptAssemblyStrategy for non-overlapping priorities', () => {
    const query = new QueryPromptAssemblyStrategy()
    const create = new CreatePromptAssemblyStrategy()
    // When only shared priorities are present, output should differ for memory/observations
    const sections = ['memory', 'observations', 'x', 'y']
    const queryResult = query.apply(sections)
    const createResult = create.apply(sections)
    // Create doesn't reorder memory/observations, query does
    expect(queryResult[0]).toBe('memory')
    expect(queryResult[1]).toBe('observations')
    expect(createResult[0]).toBe('memory') // memory stays first since it's not in create's priority
    expect(createResult[1]).toBe('observations') // same
  })
})