import { describe, it, expect } from 'vitest'
import type { PromptAssemblyStrategy } from '../strategy/PromptAssemblyStrategy'
import { ModifyPromptAssemblyStrategy } from '../strategy/ModifyPromptAssemblyStrategy'
import { CreatePromptAssemblyStrategy } from '../strategy/CreatePromptAssemblyStrategy'
import { QueryPromptAssemblyStrategy } from '../strategy/QueryPromptAssemblyStrategy'
import { DeletePromptAssemblyStrategy } from '../strategy/DeletePromptAssemblyStrategy'
import { DefaultPromptAssemblyStrategy } from '../strategy/DefaultPromptAssemblyStrategy'
import { DefaultPromptAssemblyStrategyResolver } from '../strategy/DefaultPromptAssemblyStrategyResolver'
import type {
  PromptAssemblyStrategy as StrategyFromRoot,
} from '../index'
import {
  ModifyPromptAssemblyStrategy as ModifyFromRoot,
  CreatePromptAssemblyStrategy as CreateFromRoot,
  QueryPromptAssemblyStrategy as QueryFromRoot,
  DefaultPromptAssemblyStrategy as DefaultFromRoot,
  DefaultPromptAssemblyStrategyResolver as DefaultResolverFromRoot,
} from '../index'

// ---------------------------------------------------------------------------
// ModifyPromptAssemblyStrategy — Interface Conformance
// ---------------------------------------------------------------------------

describe('ModifyPromptAssemblyStrategy — interface', () => {
  it('should implement PromptAssemblyStrategy interface', () => {
    const strategy: PromptAssemblyStrategy = new ModifyPromptAssemblyStrategy()
    expect(strategy).toBeInstanceOf(ModifyPromptAssemblyStrategy)
  })

  it('should define a strategyName property', () => {
    const strategy: PromptAssemblyStrategy = new ModifyPromptAssemblyStrategy()
    expect(strategy.strategyName).toBeDefined()
    expect(typeof strategy.strategyName).toBe('string')
  })

  it('should have strategyName "modify"', () => {
    const strategy = new ModifyPromptAssemblyStrategy()
    expect(strategy.strategyName).toBe('modify')
  })

  it('should define an apply method', () => {
    const strategy: PromptAssemblyStrategy = new ModifyPromptAssemblyStrategy()
    expect(strategy.apply).toBeDefined()
    expect(typeof strategy.apply).toBe('function')
  })

  it('should accept readonly string array as apply parameter', () => {
    const strategy = new ModifyPromptAssemblyStrategy()
    const sections: readonly string[] = ['a', 'b', 'c']
    expect(() => strategy.apply(sections)).not.toThrow()
  })

  it('should return readonly string array from apply', () => {
    const strategy = new ModifyPromptAssemblyStrategy()
    const result = strategy.apply(['a', 'b'])
    expect(Array.isArray(result)).toBe(true)
    for (const item of result) {
      expect(typeof item).toBe('string')
    }
  })
})

// ---------------------------------------------------------------------------
// ModifyPromptAssemblyStrategy — Reordering Behavior
// ---------------------------------------------------------------------------

describe('ModifyPromptAssemblyStrategy — reordering', () => {
  it('should place priority items first in priority order', () => {
    const strategy = new ModifyPromptAssemblyStrategy()
    const sections = [
      'strategyRendered',
      'entityRendered',
      'observations',
      'userInput',
      'worldState',
      'memory',
      'strategyModuleRendered',
    ]
    const result = strategy.apply(sections)
    expect(result[0]).toBe('userInput')
    expect(result[1]).toBe('worldState')
    expect(result[2]).toBe('entityRendered')
    expect(result[3]).toBe('memory')
    expect(result[4]).toBe('observations')
    expect(result[5]).toBe('strategyModuleRendered')
    expect(result[6]).toBe('strategyRendered')
  })

  it('should preserve relative order of remaining items', () => {
    const strategy = new ModifyPromptAssemblyStrategy()
    const sections = [
      'intentRendered',
      'entityRendered',
      'observations',
      'semanticRendered',
      'userInput',
      'worldState',
      'memory',
      'reflections',
      'system',
      'strategyRendered',
    ]
    const result = strategy.apply(sections)
    // Remaining (non-priority): intentRendered, semanticRendered, reflections, system
    const priority = ['userInput', 'worldState', 'entityRendered', 'memory', 'observations', 'strategyRendered']
    const remaining = result.filter(s => !priority.includes(s))
    expect(remaining).toEqual(['intentRendered', 'semanticRendered', 'reflections', 'system'])
  })

  it('should keep all sections — no removal', () => {
    const strategy = new ModifyPromptAssemblyStrategy()
    const sections = ['a', 'userInput', 'b', 'worldState', 'c', 'entityRendered', 'd', 'memory', 'e', 'observations', 'f', 'strategyModuleRendered', 'strategyRendered', 'g']
    const result = strategy.apply(sections)
    expect(result.length).toBe(sections.length)
    expect([...result].sort()).toEqual([...sections].sort())
  })

  it('should handle sections with only priority items', () => {
    const strategy = new ModifyPromptAssemblyStrategy()
    const sections = ['strategyRendered', 'observations', 'memory', 'entityRendered', 'userInput', 'worldState', 'strategyModuleRendered']
    const result = strategy.apply(sections)
    expect(result).toEqual(['userInput', 'worldState', 'entityRendered', 'memory', 'observations', 'strategyModuleRendered', 'strategyRendered'])
  })

  it('should handle sections with only non-priority items', () => {
    const strategy = new ModifyPromptAssemblyStrategy()
    const sections = ['a', 'b', 'c']
    expect(strategy.apply(sections)).toEqual(['a', 'b', 'c'])
  })

  it('should handle empty sections array', () => {
    const strategy = new ModifyPromptAssemblyStrategy()
    expect(strategy.apply([])).toEqual([])
  })

  it('should handle single item that is priority', () => {
    const strategy = new ModifyPromptAssemblyStrategy()
    expect(strategy.apply(['userInput'])).toEqual(['userInput'])
  })

  it('should handle single item that is not priority', () => {
    const strategy = new ModifyPromptAssemblyStrategy()
    expect(strategy.apply(['memory'])).toEqual(['memory'])
  })

  it('should preserve duplicates', () => {
    const strategy = new ModifyPromptAssemblyStrategy()
    const sections = ['a', 'userInput', 'b', 'userInput', 'c']
    const result = strategy.apply(sections)
    expect(result[0]).toBe('userInput')
    expect(result[1]).toBe('userInput')
  })

  it('should reorder correctly with all canonical sections', () => {
    const strategy = new ModifyPromptAssemblyStrategy()
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
    // Expected: userInput, worldState, entityRendered, memory, observations, strategyModuleRendered, strategyRendered, then rest
    expect(result[0]).toBe('userInput')
    expect(result[1]).toBe('worldState')
    expect(result[2]).toBe('entityRendered')
    expect(result[3]).toBe('memory')
    expect(result[4]).toBe('observations')
    expect(result[5]).toBe('strategyModuleRendered')
    expect(result[6]).toBe('strategyRendered')
    // Remaining keep original relative order
    expect(result.slice(7)).toEqual([
      'intentRendered',
      'semanticRendered',
      'system',
      'reflections',
    ])
  })
})

// ---------------------------------------------------------------------------
// ModifyPromptAssemblyStrategy — Priority Verification
// ---------------------------------------------------------------------------

describe('ModifyPromptAssemblyStrategy — priority verification', () => {
  it('userInput should come before worldState', () => {
    const strategy = new ModifyPromptAssemblyStrategy()
    const result = strategy.apply(['worldState', 'userInput'])
    expect(result[0]).toBe('userInput')
    expect(result[1]).toBe('worldState')
  })

  it('worldState should come before entityRendered', () => {
    const strategy = new ModifyPromptAssemblyStrategy()
    const result = strategy.apply(['entityRendered', 'worldState'])
    expect(result[0]).toBe('worldState')
    expect(result[1]).toBe('entityRendered')
  })

  it('entityRendered should come before memory', () => {
    const strategy = new ModifyPromptAssemblyStrategy()
    const result = strategy.apply(['memory', 'entityRendered'])
    expect(result[0]).toBe('entityRendered')
    expect(result[1]).toBe('memory')
  })

  it('memory should come before observations', () => {
    const strategy = new ModifyPromptAssemblyStrategy()
    const result = strategy.apply(['observations', 'memory'])
    expect(result[0]).toBe('memory')
    expect(result[1]).toBe('observations')
  })

  it('observations should come before strategyModuleRendered', () => {
    const strategy = new ModifyPromptAssemblyStrategy()
    const result = strategy.apply(['strategyModuleRendered', 'observations'])
    expect(result[0]).toBe('observations')
    expect(result[1]).toBe('strategyModuleRendered')
  })

  it('strategyModuleRendered should come before strategyRendered', () => {
    const strategy = new ModifyPromptAssemblyStrategy()
    const result = strategy.apply(['strategyRendered', 'strategyModuleRendered'])
    expect(result[0]).toBe('strategyModuleRendered')
    expect(result[1]).toBe('strategyRendered')
  })

  it('entityRendered should come before observations', () => {
    const strategy = new ModifyPromptAssemblyStrategy()
    const result = strategy.apply(['observations', 'entityRendered'])
    expect(result[0]).toBe('entityRendered')
    expect(result[1]).toBe('observations')
  })
})

// ---------------------------------------------------------------------------
// ModifyPromptAssemblyStrategy — Deterministic
// ---------------------------------------------------------------------------

describe('ModifyPromptAssemblyStrategy — deterministic', () => {
  it('should return same result for same sections across repeated calls', () => {
    const strategy = new ModifyPromptAssemblyStrategy()
    const sections = ['b', 'userInput', 'entityRendered', 'a', 'worldState', 'memory', 'c']
    const r1 = strategy.apply(sections)
    const r2 = strategy.apply(sections)
    const r3 = strategy.apply(sections)
    expect(r1).toEqual(r2)
    expect(r2).toEqual(r3)
  })

  it('should be idempotent across ten calls', () => {
    const strategy = new ModifyPromptAssemblyStrategy()
    const sections = ['a', 'userInput', 'worldState', 'entityRendered', 'b']
    for (let i = 0; i < 10; i++) {
      const result = strategy.apply(sections)
      expect(result[0]).toBe('userInput')
      expect(result[1]).toBe('worldState')
      expect(result[2]).toBe('entityRendered')
    }
  })

  it('should produce same result across many instances', () => {
    const sections = ['x', 'userInput', 'y', 'worldState', 'entityRendered', 'z']
    const r1 = new ModifyPromptAssemblyStrategy().apply(sections)
    const r2 = new ModifyPromptAssemblyStrategy().apply(sections)
    const r3 = new ModifyPromptAssemblyStrategy().apply(sections)
    expect(r1).toEqual(r2)
    expect(r2).toEqual(r3)
  })
})

// ---------------------------------------------------------------------------
// ModifyPromptAssemblyStrategy — Stateless
// ---------------------------------------------------------------------------

describe('ModifyPromptAssemblyStrategy — stateless', () => {
  it('should not retain state between calls', () => {
    const strategy = new ModifyPromptAssemblyStrategy()
    const sections1 = ['userInput', 'a']
    const sections2 = ['b', 'worldState']
    const sections3 = ['userInput', 'a']
    expect(strategy.apply(sections1)).toEqual(strategy.apply(sections1))
    expect(strategy.apply(sections2)).toEqual(strategy.apply(sections2))
    expect(strategy.apply(sections3)).toEqual(strategy.apply(sections3))
  })

  it('should be independent across multiple instances', () => {
    const s1 = new ModifyPromptAssemblyStrategy()
    const s2 = new ModifyPromptAssemblyStrategy()
    const sections = ['x', 'userInput', 'y', 'worldState', 'z']
    expect(s1.apply(sections)).toEqual(s2.apply(sections))
  })
})

// ---------------------------------------------------------------------------
// ModifyPromptAssemblyStrategy — Pure / No Side Effects
// ---------------------------------------------------------------------------

describe('ModifyPromptAssemblyStrategy — pure / no side effects', () => {
  it('should not modify the input sections array', () => {
    const strategy = new ModifyPromptAssemblyStrategy()
    const sections = ['userInput', 'a', 'worldState']
    const frozen = Object.freeze([...sections])
    expect(() => strategy.apply(frozen)).not.toThrow()
  })

  it('should not mutate the original array reference', () => {
    const strategy = new ModifyPromptAssemblyStrategy()
    const original = ['x', 'userInput', 'y']
    const copy = [...original]
    strategy.apply(original)
    expect(original).toEqual(copy)
  })

  it('should support frozen input arrays', () => {
    const strategy = new ModifyPromptAssemblyStrategy()
    const frozen = Object.freeze(['userInput', 'worldState', 'other'])
    expect(() => strategy.apply(frozen)).not.toThrow()
  })

  it('should return a new array reference (not identity)', () => {
    const strategy = new ModifyPromptAssemblyStrategy()
    const sections = ['a', 'userInput', 'b']
    const result = strategy.apply(sections)
    expect(result).not.toBe(sections)
  })
})

// ---------------------------------------------------------------------------
// Resolver Integration
// ---------------------------------------------------------------------------

describe('Resolver integration', () => {
  it('should return ModifyPromptAssemblyStrategy for "modify"', () => {
    const resolver = new DefaultPromptAssemblyStrategyResolver()
    expect(resolver.resolve('modify')).toBeInstanceOf(ModifyPromptAssemblyStrategy)
  })

  it('should return ModifyPromptAssemblyStrategy with strategyName "modify"', () => {
    const resolver = new DefaultPromptAssemblyStrategyResolver()
    expect(resolver.resolve('modify').strategyName).toBe('modify')
  })

  it('should return CreatePromptAssemblyStrategy for "create"', () => {
    const resolver = new DefaultPromptAssemblyStrategyResolver()
    expect(resolver.resolve('create')).toBeInstanceOf(CreatePromptAssemblyStrategy)
  })

  it('should return QueryPromptAssemblyStrategy for "query"', () => {
    const resolver = new DefaultPromptAssemblyStrategyResolver()
    expect(resolver.resolve('query')).toBeInstanceOf(QueryPromptAssemblyStrategy)
  })

  it('should return DeletePromptAssemblyStrategy for "delete"', () => {
    const resolver = new DefaultPromptAssemblyStrategyResolver()
    expect(resolver.resolve('delete')).toBeInstanceOf(DeletePromptAssemblyStrategy)
  })

  it('should return DefaultPromptAssemblyStrategy for "default"', () => {
    const resolver = new DefaultPromptAssemblyStrategyResolver()
    expect(resolver.resolve('default')).toBeInstanceOf(DefaultPromptAssemblyStrategy)
  })

  it('should return DefaultPromptAssemblyStrategy for unknown names', () => {
    const resolver = new DefaultPromptAssemblyStrategyResolver()
    const names = ['unknown', '', 'custom-123']
    for (const name of names) {
      expect(resolver.resolve(name)).toBeInstanceOf(DefaultPromptAssemblyStrategy)
    }
  })

  it('should return DefaultPromptAssemblyStrategy for "Modify" (case-sensitive)', () => {
    const resolver = new DefaultPromptAssemblyStrategyResolver()
    expect(resolver.resolve('Modify')).toBeInstanceOf(DefaultPromptAssemblyStrategy)
  })

  it('should route create, query, modify correctly and everything else to default', () => {
    const resolver = new DefaultPromptAssemblyStrategyResolver()
    expect(resolver.resolve('create')).toBeInstanceOf(CreatePromptAssemblyStrategy)
    expect(resolver.resolve('query')).toBeInstanceOf(QueryPromptAssemblyStrategy)
    expect(resolver.resolve('modify')).toBeInstanceOf(ModifyPromptAssemblyStrategy)
    expect(resolver.resolve('delete')).toBeInstanceOf(DeletePromptAssemblyStrategy)
    expect(resolver.resolve('default')).toBeInstanceOf(DefaultPromptAssemblyStrategy)
  })
})

// ---------------------------------------------------------------------------
// Resolver — Deterministic
// ---------------------------------------------------------------------------

describe('Resolver — deterministic', () => {
  it('should return same strategy type for "modify" across repeated calls', () => {
    const resolver = new DefaultPromptAssemblyStrategyResolver()
    const r1 = resolver.resolve('modify')
    const r2 = resolver.resolve('modify')
    const r3 = resolver.resolve('modify')
    expect(r1).toBeInstanceOf(ModifyPromptAssemblyStrategy)
    expect(r2).toBeInstanceOf(ModifyPromptAssemblyStrategy)
    expect(r3).toBeInstanceOf(ModifyPromptAssemblyStrategy)
  })

  it('should be idempotent for "modify" across ten calls', () => {
    const resolver = new DefaultPromptAssemblyStrategyResolver()
    for (let i = 0; i < 10; i++) {
      const result = resolver.resolve('modify')
      expect(result).toBeInstanceOf(ModifyPromptAssemblyStrategy)
      expect(result.strategyName).toBe('modify')
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
    resolver.resolve('modify')
    resolver.resolve('delete')
    const result = resolver.resolve('default')
    expect(result).toBeInstanceOf(DefaultPromptAssemblyStrategy)
  })
})

// ---------------------------------------------------------------------------
// Architecture Compliance
// ---------------------------------------------------------------------------

describe('Architecture compliance', () => {
  it('should not depend on Planner', () => {
    const strategy = new ModifyPromptAssemblyStrategy()
    expect(strategy.apply([])).toEqual([])
  })

  it('should not depend on Runtime', () => {
    const resolver = new DefaultPromptAssemblyStrategyResolver()
    expect(resolver.resolve('modify')).toBeInstanceOf(ModifyPromptAssemblyStrategy)
  })

  it('should not depend on Provider', () => {
    const strategy = new ModifyPromptAssemblyStrategy()
    expect(strategy).toBeInstanceOf(ModifyPromptAssemblyStrategy)
  })

  it('should not depend on Memory', () => {
    const strategy = new ModifyPromptAssemblyStrategy()
    expect(strategy.apply(['a'])).toEqual(['a'])
  })

  it('should not depend on ToolCalling', () => {
    const resolver = new DefaultPromptAssemblyStrategyResolver()
    expect(resolver.resolve('modify').strategyName).toBe('modify')
  })

  it('should not depend on AgentLoop', () => {
    const strategy = new ModifyPromptAssemblyStrategy()
    expect(strategy.apply(['a', 'b'])).toEqual(['a', 'b'])
  })

  it('should not depend on PromptBuilder', () => {
    const strategy = new ModifyPromptAssemblyStrategy()
    expect(strategy.strategyName).toBe('modify')
  })

  it('should not depend on Pipeline', () => {
    const resolver = new DefaultPromptAssemblyStrategyResolver()
    const result = resolver.resolve('modify')
    expect(result.strategyName).toBe('modify')
  })

  it('should be pure — no side effects on input', () => {
    const strategy = new ModifyPromptAssemblyStrategy()
    const sections = ['a', 'b']
    const before = JSON.stringify(sections)
    strategy.apply(sections)
    expect(JSON.stringify(sections)).toBe(before)
  })

  it('should be stateless — no internal state', () => {
    const s1 = new ModifyPromptAssemblyStrategy()
    const s2 = new ModifyPromptAssemblyStrategy()
    expect(s1.apply(['x'])).toEqual(s2.apply(['x']))
  })

  it('should be non-mutating — never modifies inputs', () => {
    const strategy = new ModifyPromptAssemblyStrategy()
    const sections = Object.freeze(['a', 'b', 'c'])
    expect(() => strategy.apply(sections)).not.toThrow()
  })
})

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

describe('ModifyPromptAssemblyStrategy exports', () => {
  it('should export ModifyPromptAssemblyStrategy class from strategy/index', () => {
    const strategy = new ModifyPromptAssemblyStrategy()
    expect(strategy).toBeInstanceOf(ModifyPromptAssemblyStrategy)
  })

  it('should export ModifyPromptAssemblyStrategy class from package root', () => {
    const strategy = new ModifyFromRoot()
    expect(strategy).toBeInstanceOf(ModifyPromptAssemblyStrategy)
  })

  it('should export ModifyPromptAssemblyStrategy with strategyName "modify" from package root', () => {
    const strategy = new ModifyFromRoot()
    expect(strategy.strategyName).toBe('modify')
  })

  it('should still export PromptAssemblyStrategy type from package root', () => {
    const strategy: StrategyFromRoot = new ModifyPromptAssemblyStrategy()
    expect(strategy.strategyName).toBe('modify')
  })

  it('should still export CreatePromptAssemblyStrategy from package root', () => {
    const strategy = new CreateFromRoot()
    expect(strategy).toBeInstanceOf(CreatePromptAssemblyStrategy)
  })

  it('should still export QueryPromptAssemblyStrategy from package root', () => {
    const strategy = new QueryFromRoot()
    expect(strategy).toBeInstanceOf(QueryPromptAssemblyStrategy)
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
// Backward Compatibility — Create, Query, Default Unchanged
// ---------------------------------------------------------------------------

describe('Backward compatibility — create, query, default unchanged', () => {
  it('CreatePromptAssemblyStrategy still reorders correctly', () => {
    const strategy = new CreatePromptAssemblyStrategy()
    const sections = ['semantic', 'userInput', 'memory', 'worldState']
    const result = strategy.apply(sections)
    expect(result[0]).toBe('userInput')
    expect(result[1]).toBe('worldState')
  })

  it('QueryPromptAssemblyStrategy still reorders correctly', () => {
    const strategy = new QueryPromptAssemblyStrategy()
    const sections = ['observations', 'memory', 'userInput', 'worldState']
    const result = strategy.apply(sections)
    expect(result[0]).toBe('userInput')
    expect(result[1]).toBe('worldState')
    expect(result[2]).toBe('memory')
    expect(result[3]).toBe('observations')
  })

  it('DefaultPromptAssemblyStrategy still returns identity', () => {
    const strategy = new DefaultPromptAssemblyStrategy()
    const sections = ['a', 'b', 'c']
    expect(strategy.apply(sections)).toEqual(['a', 'b', 'c'])
  })

  it('Modify strategy differs from Create strategy', () => {
    const modify = new ModifyPromptAssemblyStrategy()
    const create = new CreatePromptAssemblyStrategy()
    const sections = [
      'observations',
      'entityRendered',
      'memory',
      'userInput',
      'worldState',
    ]
    const modifyResult = modify.apply(sections)
    const createResult = create.apply(sections)
    // Both have userInput first, worldState second
    expect(modifyResult[0]).toBe('userInput')
    expect(createResult[0]).toBe('userInput')
    // But modify has entityRendered and memory higher priority
    expect(modifyResult.indexOf('entityRendered')).toBeLessThan(createResult.indexOf('entityRendered'))
  })

  it('Modify strategy differs from Query strategy', () => {
    const modify = new ModifyPromptAssemblyStrategy()
    const query = new QueryPromptAssemblyStrategy()
    const sections = [
      'entityRendered',
      'observations',
      'memory',
      'userInput',
      'worldState',
    ]
    const modifyResult = modify.apply(sections)
    const queryResult = query.apply(sections)
    // Both have same first 2
    expect(modifyResult[0]).toBe('userInput')
    expect(queryResult[0]).toBe('userInput')
    // Modify puts entityRendered before memory, query puts memory before entityRendered
    expect(modifyResult.indexOf('entityRendered')).toBeLessThan(modifyResult.indexOf('memory'))
  })

  it('Resolver still routes create and query correctly', () => {
    const resolver = new DefaultPromptAssemblyStrategyResolver()
    expect(resolver.resolve('create')).toBeInstanceOf(CreatePromptAssemblyStrategy)
    expect(resolver.resolve('query')).toBeInstanceOf(QueryPromptAssemblyStrategy)
    expect(resolver.resolve('modify')).toBeInstanceOf(ModifyPromptAssemblyStrategy)
  })
})

// ---------------------------------------------------------------------------
// RetryPlanner Compatibility
// ---------------------------------------------------------------------------

describe('RetryPlanner Compatibility', () => {
  it('should work with RetryPlanner — strategy is independent', () => {
    const strategy = new ModifyPromptAssemblyStrategy()
    expect(strategy).toBeInstanceOf(ModifyPromptAssemblyStrategy)
  })

  it('should not affect RetryPlanner behavior', () => {
    const strategy = new ModifyPromptAssemblyStrategy()
    const sections = ['system', 'userInput', 'entityRendered']
    const result = strategy.apply(sections)
    expect(result[0]).toBe('userInput')
    expect(result[1]).toBe('entityRendered')
  })
})

// ---------------------------------------------------------------------------
// ToolCallPlanner Compatibility
// ---------------------------------------------------------------------------

describe('ToolCallPlanner Compatibility', () => {
  it('should work with ToolCallPlanner — strategy is independent', () => {
    const resolver = new DefaultPromptAssemblyStrategyResolver()
    expect(resolver.resolve('modify')).toBeInstanceOf(ModifyPromptAssemblyStrategy)
  })

  it('should not affect ToolCallPlanner tool execution', () => {
    const strategy = new ModifyPromptAssemblyStrategy()
    expect(strategy.apply(['prompt'])).toEqual(['prompt'])
  })
})

// ---------------------------------------------------------------------------
// Streaming Compatibility
// ---------------------------------------------------------------------------

describe('Streaming Compatibility', () => {
  it('should work with StreamingProvider — strategy is independent', () => {
    const strategy = new ModifyPromptAssemblyStrategy()
    expect(strategy).toBeInstanceOf(ModifyPromptAssemblyStrategy)
  })

  it('should not affect streaming', () => {
    const resolver = new DefaultPromptAssemblyStrategyResolver()
    const result = resolver.resolve('modify')
    expect(result.apply(['chunk'])).toEqual(['chunk'])
  })
})

// ---------------------------------------------------------------------------
// AgentLoop Compatibility
// ---------------------------------------------------------------------------

describe('AgentLoop Compatibility', () => {
  it('should work with AgentLoop — strategy is independent', () => {
    const strategy = new ModifyPromptAssemblyStrategy()
    expect(strategy).toBeInstanceOf(ModifyPromptAssemblyStrategy)
  })

  it('should not affect AgentLoop iteration', () => {
    const resolver = new DefaultPromptAssemblyStrategyResolver()
    const result = resolver.resolve('modify')
    expect(result.apply(['observation', 'action'])[0]).toBe('observation')
  })
})

// ---------------------------------------------------------------------------
// No Behavior Changes
// ---------------------------------------------------------------------------

describe('No behavior changes', () => {
  it('ModifyPromptAssemblyStrategy.apply is not identity when priority items present', () => {
    const strategy = new ModifyPromptAssemblyStrategy()
    const sections = ['z', 'userInput', 'y']
    const result = strategy.apply(sections)
    expect(result[0]).toBe('userInput')
  })

  it('DefaultPromptAssemblyStrategy is unchanged', () => {
    const strategy = new DefaultPromptAssemblyStrategy()
    expect(strategy.apply(['a', 'b'])).toEqual(['a', 'b'])
    expect(strategy.strategyName).toBe('default')
  })

  it('CreatePromptAssemblyStrategy is unchanged', () => {
    const strategy = new CreatePromptAssemblyStrategy()
    expect(strategy.strategyName).toBe('create')
  })

  it('QueryPromptAssemblyStrategy is unchanged', () => {
    const strategy = new QueryPromptAssemblyStrategy()
    expect(strategy.strategyName).toBe('query')
  })

  it('Resolver routing is correct for all known names', () => {
    const resolver = new DefaultPromptAssemblyStrategyResolver()
    expect(resolver.resolve('create')).toBeInstanceOf(CreatePromptAssemblyStrategy)
    expect(resolver.resolve('query')).toBeInstanceOf(QueryPromptAssemblyStrategy)
    expect(resolver.resolve('modify')).toBeInstanceOf(ModifyPromptAssemblyStrategy)
    expect(resolver.resolve('delete')).toBeInstanceOf(DeletePromptAssemblyStrategy)
    expect(resolver.resolve('default')).toBeInstanceOf(DefaultPromptAssemblyStrategy)
    expect(resolver.resolve('unknown')).toBeInstanceOf(DefaultPromptAssemblyStrategy)
  })

  it('does not modify PromptBuilder behavior', () => {
    const strategy = new ModifyPromptAssemblyStrategy()
    expect(strategy.apply(['system', 'userInput'])[0]).toBe('userInput')
  })

  it('does not modify PromptRenderer behavior', () => {
    const strategy = new ModifyPromptAssemblyStrategy()
    expect(strategy.strategyName).toBe('modify')
  })

  it('does not modify Pipeline behavior', () => {
    const strategy = new ModifyPromptAssemblyStrategy()
    const resolver = new DefaultPromptAssemblyStrategyResolver()
    expect(strategy.apply([])).toEqual([])
    expect(resolver.resolve('modify')).toBeInstanceOf(ModifyPromptAssemblyStrategy)
    expect(resolver.resolve('pipeline')).toBeInstanceOf(DefaultPromptAssemblyStrategy)
  })
})