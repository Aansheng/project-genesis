import { describe, it, expect } from 'vitest'
import type { PromptAssemblyStrategy } from '../strategy/PromptAssemblyStrategy'
import { DeletePromptAssemblyStrategy } from '../strategy/DeletePromptAssemblyStrategy'
import { CreatePromptAssemblyStrategy } from '../strategy/CreatePromptAssemblyStrategy'
import { QueryPromptAssemblyStrategy } from '../strategy/QueryPromptAssemblyStrategy'
import { ModifyPromptAssemblyStrategy } from '../strategy/ModifyPromptAssemblyStrategy'
import { DefaultPromptAssemblyStrategy } from '../strategy/DefaultPromptAssemblyStrategy'
import { DefaultPromptAssemblyStrategyResolver } from '../strategy/DefaultPromptAssemblyStrategyResolver'
import type {
  PromptAssemblyStrategy as StrategyFromRoot,
} from '../index'
import {
  DeletePromptAssemblyStrategy as DeleteFromRoot,
  CreatePromptAssemblyStrategy as CreateFromRoot,
  QueryPromptAssemblyStrategy as QueryFromRoot,
  ModifyPromptAssemblyStrategy as ModifyFromRoot,
  DefaultPromptAssemblyStrategy as DefaultFromRoot,
  DefaultPromptAssemblyStrategyResolver as DefaultResolverFromRoot,
} from '../index'

// ---------------------------------------------------------------------------
// DeletePromptAssemblyStrategy — Interface Conformance
// ---------------------------------------------------------------------------

describe('DeletePromptAssemblyStrategy — interface', () => {
  it('should implement PromptAssemblyStrategy interface', () => {
    const strategy: PromptAssemblyStrategy = new DeletePromptAssemblyStrategy()
    expect(strategy).toBeInstanceOf(DeletePromptAssemblyStrategy)
  })

  it('should define a strategyName property', () => {
    const strategy: PromptAssemblyStrategy = new DeletePromptAssemblyStrategy()
    expect(strategy.strategyName).toBeDefined()
    expect(typeof strategy.strategyName).toBe('string')
  })

  it('should have strategyName "delete"', () => {
    const strategy = new DeletePromptAssemblyStrategy()
    expect(strategy.strategyName).toBe('delete')
  })

  it('should define an apply method', () => {
    const strategy: PromptAssemblyStrategy = new DeletePromptAssemblyStrategy()
    expect(strategy.apply).toBeDefined()
    expect(typeof strategy.apply).toBe('function')
  })

  it('should accept readonly string array as apply parameter', () => {
    const strategy = new DeletePromptAssemblyStrategy()
    const sections: readonly string[] = ['a', 'b', 'c']
    expect(() => strategy.apply(sections)).not.toThrow()
  })

  it('should return readonly string array from apply', () => {
    const strategy = new DeletePromptAssemblyStrategy()
    const result = strategy.apply(['a', 'b'])
    expect(Array.isArray(result)).toBe(true)
    for (const item of result) {
      expect(typeof item).toBe('string')
    }
  })
})

// ---------------------------------------------------------------------------
// DeletePromptAssemblyStrategy — Reordering Behavior
// ---------------------------------------------------------------------------

describe('DeletePromptAssemblyStrategy — reordering', () => {
  it('should place priority items first in priority order', () => {
    const strategy = new DeletePromptAssemblyStrategy()
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
    expect(result[3]).toBe('observations')
    expect(result[4]).toBe('memory')
    expect(result[5]).toBe('strategyModuleRendered')
    expect(result[6]).toBe('strategyRendered')
  })

  it('should preserve relative order of remaining items', () => {
    const strategy = new DeletePromptAssemblyStrategy()
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
    const priority = ['userInput', 'worldState', 'entityRendered', 'observations', 'memory', 'strategyRendered']
    const remaining = result.filter(s => !priority.includes(s))
    expect(remaining).toEqual(['intentRendered', 'semanticRendered', 'reflections', 'system'])
  })

  it('should keep all sections — no removal', () => {
    const strategy = new DeletePromptAssemblyStrategy()
    const sections = ['a', 'userInput', 'b', 'worldState', 'entityRendered', 'c', 'observations', 'd', 'memory', 'e', 'strategyModuleRendered', 'strategyRendered', 'f']
    const result = strategy.apply(sections)
    expect(result.length).toBe(sections.length)
    expect([...result].sort()).toEqual([...sections].sort())
  })

  it('should handle sections with only priority items', () => {
    const strategy = new DeletePromptAssemblyStrategy()
    const sections = ['strategyRendered', 'observations', 'memory', 'entityRendered', 'userInput', 'worldState', 'strategyModuleRendered']
    const result = strategy.apply(sections)
    expect(result).toEqual(['userInput', 'worldState', 'entityRendered', 'observations', 'memory', 'strategyModuleRendered', 'strategyRendered'])
  })

  it('should handle sections with only non-priority items', () => {
    const strategy = new DeletePromptAssemblyStrategy()
    const sections = ['a', 'b', 'c']
    expect(strategy.apply(sections)).toEqual(['a', 'b', 'c'])
  })

  it('should handle empty sections array', () => {
    const strategy = new DeletePromptAssemblyStrategy()
    expect(strategy.apply([])).toEqual([])
  })

  it('should handle single item that is priority', () => {
    const strategy = new DeletePromptAssemblyStrategy()
    expect(strategy.apply(['userInput'])).toEqual(['userInput'])
  })

  it('should handle single item that is not priority', () => {
    const strategy = new DeletePromptAssemblyStrategy()
    expect(strategy.apply(['memory'])).toEqual(['memory'])
  })

  it('should preserve duplicates', () => {
    const strategy = new DeletePromptAssemblyStrategy()
    const sections = ['a', 'userInput', 'b', 'userInput', 'c']
    const result = strategy.apply(sections)
    expect(result[0]).toBe('userInput')
    expect(result[1]).toBe('userInput')
  })

  it('should reorder correctly with all canonical sections', () => {
    const strategy = new DeletePromptAssemblyStrategy()
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
    expect(result[0]).toBe('userInput')
    expect(result[1]).toBe('worldState')
    expect(result[2]).toBe('entityRendered')
    expect(result[3]).toBe('observations')
    expect(result[4]).toBe('memory')
    expect(result[5]).toBe('strategyModuleRendered')
    expect(result[6]).toBe('strategyRendered')
    expect(result.slice(7)).toEqual([
      'intentRendered',
      'semanticRendered',
      'system',
      'reflections',
    ])
  })
})

// ---------------------------------------------------------------------------
// DeletePromptAssemblyStrategy — Priority Verification
// ---------------------------------------------------------------------------

describe('DeletePromptAssemblyStrategy — priority verification', () => {
  it('userInput should come before worldState', () => {
    const strategy = new DeletePromptAssemblyStrategy()
    const result = strategy.apply(['worldState', 'userInput'])
    expect(result[0]).toBe('userInput')
    expect(result[1]).toBe('worldState')
  })

  it('worldState should come before entityRendered', () => {
    const strategy = new DeletePromptAssemblyStrategy()
    const result = strategy.apply(['entityRendered', 'worldState'])
    expect(result[0]).toBe('worldState')
    expect(result[1]).toBe('entityRendered')
  })

  it('entityRendered should come before observations', () => {
    const strategy = new DeletePromptAssemblyStrategy()
    const result = strategy.apply(['observations', 'entityRendered'])
    expect(result[0]).toBe('entityRendered')
    expect(result[1]).toBe('observations')
  })

  it('observations should come before memory', () => {
    const strategy = new DeletePromptAssemblyStrategy()
    const result = strategy.apply(['memory', 'observations'])
    expect(result[0]).toBe('observations')
    expect(result[1]).toBe('memory')
  })

  it('memory should come before strategyModuleRendered', () => {
    const strategy = new DeletePromptAssemblyStrategy()
    const result = strategy.apply(['strategyModuleRendered', 'memory'])
    expect(result[0]).toBe('memory')
    expect(result[1]).toBe('strategyModuleRendered')
  })

  it('strategyModuleRendered should come before strategyRendered', () => {
    const strategy = new DeletePromptAssemblyStrategy()
    const result = strategy.apply(['strategyRendered', 'strategyModuleRendered'])
    expect(result[0]).toBe('strategyModuleRendered')
    expect(result[1]).toBe('strategyRendered')
  })

  it('entityRendered should come before memory', () => {
    const strategy = new DeletePromptAssemblyStrategy()
    const result = strategy.apply(['memory', 'entityRendered'])
    expect(result[0]).toBe('entityRendered')
    expect(result[1]).toBe('memory')
  })
})

// ---------------------------------------------------------------------------
// DeletePromptAssemblyStrategy — Deterministic
// ---------------------------------------------------------------------------

describe('DeletePromptAssemblyStrategy — deterministic', () => {
  it('should return same result for same sections across repeated calls', () => {
    const strategy = new DeletePromptAssemblyStrategy()
    const sections = ['b', 'userInput', 'entityRendered', 'a', 'worldState', 'observations', 'c']
    const r1 = strategy.apply(sections)
    const r2 = strategy.apply(sections)
    const r3 = strategy.apply(sections)
    expect(r1).toEqual(r2)
    expect(r2).toEqual(r3)
  })

  it('should be idempotent across ten calls', () => {
    const strategy = new DeletePromptAssemblyStrategy()
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
    const r1 = new DeletePromptAssemblyStrategy().apply(sections)
    const r2 = new DeletePromptAssemblyStrategy().apply(sections)
    const r3 = new DeletePromptAssemblyStrategy().apply(sections)
    expect(r1).toEqual(r2)
    expect(r2).toEqual(r3)
  })
})

// ---------------------------------------------------------------------------
// DeletePromptAssemblyStrategy — Stateless
// ---------------------------------------------------------------------------

describe('DeletePromptAssemblyStrategy — stateless', () => {
  it('should not retain state between calls', () => {
    const strategy = new DeletePromptAssemblyStrategy()
    const sections1 = ['userInput', 'a']
    const sections2 = ['b', 'worldState']
    const sections3 = ['userInput', 'a']
    expect(strategy.apply(sections1)).toEqual(strategy.apply(sections1))
    expect(strategy.apply(sections2)).toEqual(strategy.apply(sections2))
    expect(strategy.apply(sections3)).toEqual(strategy.apply(sections3))
  })

  it('should be independent across multiple instances', () => {
    const s1 = new DeletePromptAssemblyStrategy()
    const s2 = new DeletePromptAssemblyStrategy()
    const sections = ['x', 'userInput', 'y', 'worldState', 'z']
    expect(s1.apply(sections)).toEqual(s2.apply(sections))
  })
})

// ---------------------------------------------------------------------------
// DeletePromptAssemblyStrategy — Pure / No Side Effects
// ---------------------------------------------------------------------------

describe('DeletePromptAssemblyStrategy — pure / no side effects', () => {
  it('should not modify the input sections array', () => {
    const strategy = new DeletePromptAssemblyStrategy()
    const sections = ['userInput', 'a', 'worldState']
    const frozen = Object.freeze([...sections])
    expect(() => strategy.apply(frozen)).not.toThrow()
  })

  it('should not mutate the original array reference', () => {
    const strategy = new DeletePromptAssemblyStrategy()
    const original = ['x', 'userInput', 'y']
    const copy = [...original]
    strategy.apply(original)
    expect(original).toEqual(copy)
  })

  it('should support frozen input arrays', () => {
    const strategy = new DeletePromptAssemblyStrategy()
    const frozen = Object.freeze(['userInput', 'worldState', 'other'])
    expect(() => strategy.apply(frozen)).not.toThrow()
  })

  it('should return a new array reference (not identity)', () => {
    const strategy = new DeletePromptAssemblyStrategy()
    const sections = ['a', 'userInput', 'b']
    const result = strategy.apply(sections)
    expect(result).not.toBe(sections)
  })
})

// ---------------------------------------------------------------------------
// Resolver Integration
// ---------------------------------------------------------------------------

describe('Resolver integration', () => {
  it('should return DeletePromptAssemblyStrategy for "delete"', () => {
    const resolver = new DefaultPromptAssemblyStrategyResolver()
    expect(resolver.resolve('delete')).toBeInstanceOf(DeletePromptAssemblyStrategy)
  })

  it('should return DeletePromptAssemblyStrategy with strategyName "delete"', () => {
    const resolver = new DefaultPromptAssemblyStrategyResolver()
    expect(resolver.resolve('delete').strategyName).toBe('delete')
  })

  it('should return CreatePromptAssemblyStrategy for "create"', () => {
    const resolver = new DefaultPromptAssemblyStrategyResolver()
    expect(resolver.resolve('create')).toBeInstanceOf(CreatePromptAssemblyStrategy)
  })

  it('should return QueryPromptAssemblyStrategy for "query"', () => {
    const resolver = new DefaultPromptAssemblyStrategyResolver()
    expect(resolver.resolve('query')).toBeInstanceOf(QueryPromptAssemblyStrategy)
  })

  it('should return ModifyPromptAssemblyStrategy for "modify"', () => {
    const resolver = new DefaultPromptAssemblyStrategyResolver()
    expect(resolver.resolve('modify')).toBeInstanceOf(ModifyPromptAssemblyStrategy)
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

  it('should return DefaultPromptAssemblyStrategy for "Delete" (case-sensitive)', () => {
    const resolver = new DefaultPromptAssemblyStrategyResolver()
    expect(resolver.resolve('Delete')).toBeInstanceOf(DefaultPromptAssemblyStrategy)
  })

  it('should route all four strategies correctly', () => {
    const resolver = new DefaultPromptAssemblyStrategyResolver()
    expect(resolver.resolve('create')).toBeInstanceOf(CreatePromptAssemblyStrategy)
    expect(resolver.resolve('query')).toBeInstanceOf(QueryPromptAssemblyStrategy)
    expect(resolver.resolve('modify')).toBeInstanceOf(ModifyPromptAssemblyStrategy)
    expect(resolver.resolve('delete')).toBeInstanceOf(DeletePromptAssemblyStrategy)
    expect(resolver.resolve('default')).toBeInstanceOf(DefaultPromptAssemblyStrategy)
  })
})

// ---------------------------------------------------------------------------
// Resolver — Deterministic & Stateless
// ---------------------------------------------------------------------------

describe('Resolver — deterministic', () => {
  it('should return same strategy type for "delete" across repeated calls', () => {
    const resolver = new DefaultPromptAssemblyStrategyResolver()
    const r1 = resolver.resolve('delete')
    const r2 = resolver.resolve('delete')
    const r3 = resolver.resolve('delete')
    expect(r1).toBeInstanceOf(DeletePromptAssemblyStrategy)
    expect(r2).toBeInstanceOf(DeletePromptAssemblyStrategy)
    expect(r3).toBeInstanceOf(DeletePromptAssemblyStrategy)
  })

  it('should be idempotent for "delete" across ten calls', () => {
    const resolver = new DefaultPromptAssemblyStrategyResolver()
    for (let i = 0; i < 10; i++) {
      const result = resolver.resolve('delete')
      expect(result).toBeInstanceOf(DeletePromptAssemblyStrategy)
      expect(result.strategyName).toBe('delete')
    }
  })
})

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
    const strategy = new DeletePromptAssemblyStrategy()
    expect(strategy.apply([])).toEqual([])
  })

  it('should not depend on Runtime', () => {
    const resolver = new DefaultPromptAssemblyStrategyResolver()
    expect(resolver.resolve('delete')).toBeInstanceOf(DeletePromptAssemblyStrategy)
  })

  it('should not depend on Provider', () => {
    const strategy = new DeletePromptAssemblyStrategy()
    expect(strategy).toBeInstanceOf(DeletePromptAssemblyStrategy)
  })

  it('should not depend on Memory', () => {
    const strategy = new DeletePromptAssemblyStrategy()
    expect(strategy.apply(['a'])).toEqual(['a'])
  })

  it('should not depend on ToolCalling', () => {
    const resolver = new DefaultPromptAssemblyStrategyResolver()
    expect(resolver.resolve('delete').strategyName).toBe('delete')
  })

  it('should not depend on AgentLoop', () => {
    const strategy = new DeletePromptAssemblyStrategy()
    expect(strategy.apply(['a', 'b'])).toEqual(['a', 'b'])
  })

  it('should not depend on PromptBuilder', () => {
    const strategy = new DeletePromptAssemblyStrategy()
    expect(strategy.strategyName).toBe('delete')
  })

  it('should not depend on Pipeline', () => {
    const resolver = new DefaultPromptAssemblyStrategyResolver()
    const result = resolver.resolve('delete')
    expect(result.strategyName).toBe('delete')
  })

  it('should be pure — no side effects on input', () => {
    const strategy = new DeletePromptAssemblyStrategy()
    const sections = ['a', 'b']
    const before = JSON.stringify(sections)
    strategy.apply(sections)
    expect(JSON.stringify(sections)).toBe(before)
  })

  it('should be stateless — no internal state', () => {
    const s1 = new DeletePromptAssemblyStrategy()
    const s2 = new DeletePromptAssemblyStrategy()
    expect(s1.apply(['x'])).toEqual(s2.apply(['x']))
  })

  it('should be non-mutating — never modifies inputs', () => {
    const strategy = new DeletePromptAssemblyStrategy()
    const sections = Object.freeze(['a', 'b', 'c'])
    expect(() => strategy.apply(sections)).not.toThrow()
  })
})

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

describe('DeletePromptAssemblyStrategy exports', () => {
  it('should export DeletePromptAssemblyStrategy class from strategy/index', () => {
    const strategy = new DeletePromptAssemblyStrategy()
    expect(strategy).toBeInstanceOf(DeletePromptAssemblyStrategy)
  })

  it('should export DeletePromptAssemblyStrategy class from package root', () => {
    const strategy = new DeleteFromRoot()
    expect(strategy).toBeInstanceOf(DeletePromptAssemblyStrategy)
  })

  it('should export DeletePromptAssemblyStrategy with strategyName "delete" from package root', () => {
    const strategy = new DeleteFromRoot()
    expect(strategy.strategyName).toBe('delete')
  })

  it('should still export PromptAssemblyStrategy type from package root', () => {
    const strategy: StrategyFromRoot = new DeletePromptAssemblyStrategy()
    expect(strategy.strategyName).toBe('delete')
  })

  it('should still export CreatePromptAssemblyStrategy from package root', () => {
    const strategy = new CreateFromRoot()
    expect(strategy).toBeInstanceOf(CreatePromptAssemblyStrategy)
  })

  it('should still export QueryPromptAssemblyStrategy from package root', () => {
    const strategy = new QueryFromRoot()
    expect(strategy).toBeInstanceOf(QueryPromptAssemblyStrategy)
  })

  it('should still export ModifyPromptAssemblyStrategy from package root', () => {
    const strategy = new ModifyFromRoot()
    expect(strategy).toBeInstanceOf(ModifyPromptAssemblyStrategy)
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
// Backward Compatibility — Create, Query, Modify, Default Unchanged
// ---------------------------------------------------------------------------

describe('Backward compatibility — all strategies unchanged', () => {
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

  it('ModifyPromptAssemblyStrategy still reorders correctly', () => {
    const strategy = new ModifyPromptAssemblyStrategy()
    const sections = ['entityRendered', 'userInput', 'worldState']
    const result = strategy.apply(sections)
    expect(result[0]).toBe('userInput')
    expect(result[1]).toBe('worldState')
    expect(result[2]).toBe('entityRendered')
  })

  it('DefaultPromptAssemblyStrategy still returns identity', () => {
    const strategy = new DefaultPromptAssemblyStrategy()
    const sections = ['a', 'b', 'c']
    expect(strategy.apply(sections)).toEqual(['a', 'b', 'c'])
  })

  it('Delete strategy differs from Modify strategy', () => {
    const del = new DeletePromptAssemblyStrategy()
    const modify = new ModifyPromptAssemblyStrategy()
    const sections = ['observations', 'memory', 'entityRendered', 'userInput', 'worldState']
    const delResult = del.apply(sections)
    const modifyResult = modify.apply(sections)
    // Both have userInput first, worldState second, entityRendered third
    expect(delResult[0]).toBe('userInput')
    expect(modifyResult[0]).toBe('userInput')
    // Delete has observations before memory, modify has memory before observations
    expect(delResult.indexOf('observations')).toBeLessThan(delResult.indexOf('memory'))
    expect(modifyResult.indexOf('memory')).toBeLessThan(modifyResult.indexOf('observations'))
  })

  it('Resolver routes all four strategies correctly', () => {
    const resolver = new DefaultPromptAssemblyStrategyResolver()
    expect(resolver.resolve('create')).toBeInstanceOf(CreatePromptAssemblyStrategy)
    expect(resolver.resolve('query')).toBeInstanceOf(QueryPromptAssemblyStrategy)
    expect(resolver.resolve('modify')).toBeInstanceOf(ModifyPromptAssemblyStrategy)
    expect(resolver.resolve('delete')).toBeInstanceOf(DeletePromptAssemblyStrategy)
    expect(resolver.resolve('default')).toBeInstanceOf(DefaultPromptAssemblyStrategy)
  })
})

// ---------------------------------------------------------------------------
// RetryPlanner Compatibility
// ---------------------------------------------------------------------------

describe('RetryPlanner Compatibility', () => {
  it('should work with RetryPlanner — strategy is independent', () => {
    const strategy = new DeletePromptAssemblyStrategy()
    expect(strategy).toBeInstanceOf(DeletePromptAssemblyStrategy)
  })

  it('should not affect RetryPlanner behavior', () => {
    const strategy = new DeletePromptAssemblyStrategy()
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
    expect(resolver.resolve('delete')).toBeInstanceOf(DeletePromptAssemblyStrategy)
  })

  it('should not affect ToolCallPlanner tool execution', () => {
    const strategy = new DeletePromptAssemblyStrategy()
    expect(strategy.apply(['prompt'])).toEqual(['prompt'])
  })
})

// ---------------------------------------------------------------------------
// Streaming Compatibility
// ---------------------------------------------------------------------------

describe('Streaming Compatibility', () => {
  it('should work with StreamingProvider — strategy is independent', () => {
    const strategy = new DeletePromptAssemblyStrategy()
    expect(strategy).toBeInstanceOf(DeletePromptAssemblyStrategy)
  })

  it('should not affect streaming', () => {
    const resolver = new DefaultPromptAssemblyStrategyResolver()
    const result = resolver.resolve('delete')
    expect(result.apply(['chunk'])).toEqual(['chunk'])
  })
})

// ---------------------------------------------------------------------------
// AgentLoop Compatibility
// ---------------------------------------------------------------------------

describe('AgentLoop Compatibility', () => {
  it('should work with AgentLoop — strategy is independent', () => {
    const strategy = new DeletePromptAssemblyStrategy()
    expect(strategy).toBeInstanceOf(DeletePromptAssemblyStrategy)
  })

  it('should not affect AgentLoop iteration', () => {
    const resolver = new DefaultPromptAssemblyStrategyResolver()
    const result = resolver.resolve('delete')
    expect(result.apply(['observation', 'action'])[0]).toBe('observation')
  })
})

// ---------------------------------------------------------------------------
// No Behavior Changes
// ---------------------------------------------------------------------------

describe('No behavior changes', () => {
  it('DeletePromptAssemblyStrategy.apply is not identity when priority items present', () => {
    const strategy = new DeletePromptAssemblyStrategy()
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

  it('ModifyPromptAssemblyStrategy is unchanged', () => {
    const strategy = new ModifyPromptAssemblyStrategy()
    expect(strategy.strategyName).toBe('modify')
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
    const strategy = new DeletePromptAssemblyStrategy()
    expect(strategy.apply(['system', 'userInput'])[0]).toBe('userInput')
  })

  it('does not modify PromptRenderer behavior', () => {
    const strategy = new DeletePromptAssemblyStrategy()
    expect(strategy.strategyName).toBe('delete')
  })

  it('does not modify Pipeline behavior', () => {
    const strategy = new DeletePromptAssemblyStrategy()
    const resolver = new DefaultPromptAssemblyStrategyResolver()
    expect(strategy.apply([])).toEqual([])
    expect(resolver.resolve('delete')).toBeInstanceOf(DeletePromptAssemblyStrategy)
    expect(resolver.resolve('pipeline')).toBeInstanceOf(DefaultPromptAssemblyStrategy)
  })
})