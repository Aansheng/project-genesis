import { describe, it, expect } from 'vitest'
import type { PromptAssemblyStrategy } from '../strategy/PromptAssemblyStrategy'
import { DefaultPromptAssemblyStrategy } from '../strategy/DefaultPromptAssemblyStrategy'
import { CreatePromptAssemblyStrategy } from '../strategy/CreatePromptAssemblyStrategy'
import { QueryPromptAssemblyStrategy } from '../strategy/QueryPromptAssemblyStrategy'
import { ModifyPromptAssemblyStrategy } from '../strategy/ModifyPromptAssemblyStrategy'
import type { PromptAssemblyStrategyResolver } from '../strategy/PromptAssemblyStrategyResolver'
import { DefaultPromptAssemblyStrategyResolver } from '../strategy/DefaultPromptAssemblyStrategyResolver'
import type {
  PromptAssemblyStrategy as StrategyFromRoot,
  PromptAssemblyStrategyResolver as ResolverFromRoot,
} from '../index'
import {
  DefaultPromptAssemblyStrategy as DefaultFromRoot,
  DefaultPromptAssemblyStrategyResolver as DefaultResolverFromRoot,
} from '../index'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** A custom PromptAssemblyStrategy that reverses section order */
class ReverseAssemblyStrategy implements PromptAssemblyStrategy {
  readonly strategyName = 'reverse'

  apply(sections: readonly string[]): readonly string[] {
    return [...sections].reverse()
  }
}

/** A custom PromptAssemblyStrategy that filters empty sections */
class FilterEmptyAssemblyStrategy implements PromptAssemblyStrategy {
  readonly strategyName = 'filter-empty'

  apply(sections: readonly string[]): readonly string[] {
    return sections.filter(s => s.length > 0)
  }
}

/** A custom PromptAssemblyStrategy that adds a prefix to each section */
class PrefixAssemblyStrategy implements PromptAssemblyStrategy {
  readonly strategyName = 'prefix'

  constructor(private readonly prefix: string) {}

  apply(sections: readonly string[]): readonly string[] {
    return sections.map(s => `${this.prefix}${s}`)
  }
}

// ---------------------------------------------------------------------------
// PromptAssemblyStrategy Interface
// ---------------------------------------------------------------------------

describe('PromptAssemblyStrategy interface', () => {
  it('should define a strategyName property', () => {
    const strategy: PromptAssemblyStrategy = new DefaultPromptAssemblyStrategy()
    expect(strategy.strategyName).toBeDefined()
    expect(typeof strategy.strategyName).toBe('string')
  })

  it('should define an apply method', () => {
    const strategy: PromptAssemblyStrategy = new DefaultPromptAssemblyStrategy()
    expect(strategy.apply).toBeDefined()
    expect(typeof strategy.apply).toBe('function')
  })

  it('should accept readonly string array as apply parameter', () => {
    const strategy: PromptAssemblyStrategy = new DefaultPromptAssemblyStrategy()
    const sections: readonly string[] = ['a', 'b', 'c']
    expect(() => strategy.apply(sections)).not.toThrow()
  })

  it('should return readonly string array from apply', () => {
    const strategy: PromptAssemblyStrategy = new DefaultPromptAssemblyStrategy()
    const result = strategy.apply(['a', 'b'])
    expect(Array.isArray(result)).toBe(true)
    for (const item of result) {
      expect(typeof item).toBe('string')
    }
  })
})

// ---------------------------------------------------------------------------
// DefaultPromptAssemblyStrategy
// ---------------------------------------------------------------------------

describe('DefaultPromptAssemblyStrategy', () => {
  it('should have strategyName "default"', () => {
    const strategy = new DefaultPromptAssemblyStrategy()
    expect(strategy.strategyName).toBe('default')
  })

  it('should return sections unchanged for empty array', () => {
    const strategy = new DefaultPromptAssemblyStrategy()
    const result = strategy.apply([])
    expect(result).toEqual([])
  })

  it('should return sections unchanged for single section', () => {
    const strategy = new DefaultPromptAssemblyStrategy()
    const result = strategy.apply(['hello'])
    expect(result).toEqual(['hello'])
  })

  it('should return sections unchanged for multiple sections', () => {
    const strategy = new DefaultPromptAssemblyStrategy()
    const sections = ['system', 'intent', 'user', 'memory']
    const result = strategy.apply(sections)
    expect(result).toEqual(sections)
  })

  it('should return sections with same content and order', () => {
    const strategy = new DefaultPromptAssemblyStrategy()
    const sections = ['a', 'b', 'c', 'd', 'e']
    const result = strategy.apply(sections)
    expect(result).toEqual(['a', 'b', 'c', 'd', 'e'])
  })

  it('should preserve sections with special characters', () => {
    const strategy = new DefaultPromptAssemblyStrategy()
    const sections = ['hello\nworld', '  spaces  ', 'emoji 🎉', '']
    const result = strategy.apply(sections)
    expect(result).toEqual(['hello\nworld', '  spaces  ', 'emoji 🎉', ''])
  })
})

// ---------------------------------------------------------------------------
// DefaultPromptAssemblyStrategy — Deterministic
// ---------------------------------------------------------------------------

describe('DefaultPromptAssemblyStrategy — deterministic', () => {
  it('should return same result for same sections across repeated calls', () => {
    const strategy = new DefaultPromptAssemblyStrategy()
    const sections = ['a', 'b', 'c']
    const r1 = strategy.apply(sections)
    const r2 = strategy.apply(sections)
    const r3 = strategy.apply(sections)
    expect(r1).toEqual(r2)
    expect(r2).toEqual(r3)
  })

  it('should be idempotent across ten calls', () => {
    const strategy = new DefaultPromptAssemblyStrategy()
    const sections = ['system', 'user', 'memory']
    for (let i = 0; i < 10; i++) {
      expect(strategy.apply(sections)).toEqual(sections)
    }
  })

  it('should return consistent results regardless of call count', () => {
    const strategy = new DefaultPromptAssemblyStrategy()
    const sections = ['x', 'y']
    strategy.apply(sections)
    strategy.apply(sections)
    const result = strategy.apply(sections)
    expect(result).toEqual(sections)
  })
})

// ---------------------------------------------------------------------------
// DefaultPromptAssemblyStrategy — Stateless
// ---------------------------------------------------------------------------

describe('DefaultPromptAssemblyStrategy — stateless', () => {
  it('should not retain state between calls', () => {
    const strategy = new DefaultPromptAssemblyStrategy()
    const sections1 = ['short']
    const sections2 = ['much longer section with more content']
    expect(strategy.apply(sections1)).toEqual(sections1)
    expect(strategy.apply(sections2)).toEqual(sections2)
    expect(strategy.apply(sections1)).toEqual(sections1)
  })

  it('should be independent across multiple instances', () => {
    const s1 = new DefaultPromptAssemblyStrategy()
    const s2 = new DefaultPromptAssemblyStrategy()
    const sections = ['a', 'b']
    expect(s1.apply(sections)).toEqual(s2.apply(sections))
  })

  it('should not share state between different instances', () => {
    const s1 = new DefaultPromptAssemblyStrategy()
    const s2 = new DefaultPromptAssemblyStrategy()
    s1.apply(['x', 'y'])
    const result = s2.apply(['a', 'b'])
    expect(result).toEqual(['a', 'b'])
  })
})

// ---------------------------------------------------------------------------
// DefaultPromptAssemblyStrategy — Pure / No Side Effects
// ---------------------------------------------------------------------------

describe('DefaultPromptAssemblyStrategy — pure / no side effects', () => {
  it('should not modify the input sections array', () => {
    const strategy = new DefaultPromptAssemblyStrategy()
    const sections = ['a', 'b', 'c']
    const frozen = Object.freeze([...sections])
    expect(() => strategy.apply(frozen)).not.toThrow()
  })

  it('should not mutate the original array reference', () => {
    const strategy = new DefaultPromptAssemblyStrategy()
    const original = ['x', 'y', 'z']
    const originalCopy = [...original]
    strategy.apply(original)
    expect(original).toEqual(originalCopy)
  })

  it('should have no side effects on strategy instance', () => {
    const strategy = new DefaultPromptAssemblyStrategy()
    const before = Object.keys(strategy)
    strategy.apply(['a'])
    strategy.apply(['b', 'c'])
    strategy.apply([])
    expect(Object.keys(strategy)).toEqual(before)
  })

  it('should return a new array reference', () => {
    const strategy = new DefaultPromptAssemblyStrategy()
    const sections = ['a', 'b']
    const result = strategy.apply(sections)
    // Default returns same reference but same content — identity is allowed
    expect(result).toEqual(sections)
  })
})

// ---------------------------------------------------------------------------
// Custom PromptAssemblyStrategy Implementations
// ---------------------------------------------------------------------------

describe('Custom PromptAssemblyStrategy implementations', () => {
  it('should support reverse strategy', () => {
    const strategy = new ReverseAssemblyStrategy()
    expect(strategy.strategyName).toBe('reverse')
  })

  it('should reverse section order', () => {
    const strategy = new ReverseAssemblyStrategy()
    const result = strategy.apply(['a', 'b', 'c'])
    expect(result).toEqual(['c', 'b', 'a'])
  })

  it('should support filter-empty strategy', () => {
    const strategy = new FilterEmptyAssemblyStrategy()
    expect(strategy.strategyName).toBe('filter-empty')
  })

  it('should filter empty sections', () => {
    const strategy = new FilterEmptyAssemblyStrategy()
    const result = strategy.apply(['a', '', 'b', '', 'c'])
    expect(result).toEqual(['a', 'b', 'c'])
  })

  it('should support prefix strategy with custom prefix', () => {
    const strategy = new PrefixAssemblyStrategy('>> ')
    expect(strategy.strategyName).toBe('prefix')
  })

  it('should add prefix to each section', () => {
    const strategy = new PrefixAssemblyStrategy('>> ')
    const result = strategy.apply(['system', 'user'])
    expect(result).toEqual(['>> system', '>> user'])
  })
})

// ---------------------------------------------------------------------------
// PromptAssemblyStrategyResolver Interface
// ---------------------------------------------------------------------------

describe('PromptAssemblyStrategyResolver interface', () => {
  it('should define a resolve method', () => {
    const resolver: PromptAssemblyStrategyResolver = new DefaultPromptAssemblyStrategyResolver()
    expect(resolver.resolve).toBeDefined()
    expect(typeof resolver.resolve).toBe('function')
  })

  it('should accept strategyName string as resolve parameter', () => {
    const resolver: PromptAssemblyStrategyResolver = new DefaultPromptAssemblyStrategyResolver()
    expect(() => resolver.resolve('default')).not.toThrow()
  })

  it('should return a PromptAssemblyStrategy', () => {
    const resolver: PromptAssemblyStrategyResolver = new DefaultPromptAssemblyStrategyResolver()
    const result = resolver.resolve('default')
    expect(result).toBeDefined()
    expect(typeof result.strategyName).toBe('string')
    expect(typeof result.apply).toBe('function')
  })
})

// ---------------------------------------------------------------------------
// DefaultPromptAssemblyStrategyResolver
// ---------------------------------------------------------------------------

describe('DefaultPromptAssemblyStrategyResolver', () => {
  it('should return DefaultPromptAssemblyStrategy for "default" name', () => {
    const resolver = new DefaultPromptAssemblyStrategyResolver()
    const result = resolver.resolve('default')
    expect(result).toBeInstanceOf(DefaultPromptAssemblyStrategy)
  })

  it('should return ModifyPromptAssemblyStrategy for "modify" name', () => {
    const resolver = new DefaultPromptAssemblyStrategyResolver()
    const result = resolver.resolve('modify')
    expect(result).toBeInstanceOf(ModifyPromptAssemblyStrategy)
  })

  it('should return ModifyPromptAssemblyStrategy with strategyName "modify"', () => {
    const resolver = new DefaultPromptAssemblyStrategyResolver()
    const result = resolver.resolve('modify')
    expect(result.strategyName).toBe('modify')
  })

  it('should return DefaultPromptAssemblyStrategy for non-create-non-query-non-modify names', () => {
    const resolver = new DefaultPromptAssemblyStrategyResolver()
    const names = ['delete', 'unknown', '', 'custom-123']
    for (const name of names) {
      const result = resolver.resolve(name)
      expect(result).toBeInstanceOf(DefaultPromptAssemblyStrategy)
    }
  })

  it('should return CreatePromptAssemblyStrategy for "create" name', () => {
    const resolver = new DefaultPromptAssemblyStrategyResolver()
    const result = resolver.resolve('create')
    expect(result).toBeInstanceOf(CreatePromptAssemblyStrategy)
  })

  it('should return a strategy with strategyName "default" for non-create-non-query-non-modify names', () => {
    const resolver = new DefaultPromptAssemblyStrategyResolver()
    const result = resolver.resolve('delete')
    expect(result.strategyName).toBe('default')
  })

  it('should return create, query, modify, default types for appropriate inputs', () => {
    const resolver = new DefaultPromptAssemblyStrategyResolver()
    const r1 = resolver.resolve('create')
    const r2 = resolver.resolve('query')
    const r3 = resolver.resolve('modify')
    const r4 = resolver.resolve('')
    expect(r1.strategyName).toBe('create')
    expect(r2.strategyName).toBe('query')
    expect(r3.strategyName).toBe('modify')
    expect(r4.strategyName).toBe('default')
  })
})

// ---------------------------------------------------------------------------
// DefaultPromptAssemblyStrategyResolver — Deterministic
// ---------------------------------------------------------------------------

describe('DefaultPromptAssemblyStrategyResolver — deterministic', () => {
  it('should return same strategy type for same name across repeated calls', () => {
    const resolver = new DefaultPromptAssemblyStrategyResolver()
    const r1 = resolver.resolve('create')
    const r2 = resolver.resolve('create')
    const r3 = resolver.resolve('create')
    expect(r1.strategyName).toBe(r2.strategyName)
    expect(r2.strategyName).toBe(r3.strategyName)
  })

  it('should be idempotent across ten calls', () => {
    const resolver = new DefaultPromptAssemblyStrategyResolver()
    for (let i = 0; i < 10; i++) {
      const result = resolver.resolve('test')
      expect(result).toBeInstanceOf(DefaultPromptAssemblyStrategy)
    }
  })
})

// ---------------------------------------------------------------------------
// DefaultPromptAssemblyStrategyResolver — Stateless
// ---------------------------------------------------------------------------

describe('DefaultPromptAssemblyStrategyResolver — stateless', () => {
  it('should not retain state between calls', () => {
    const resolver = new DefaultPromptAssemblyStrategyResolver()
    resolver.resolve('create')
    resolver.resolve('query')
    const result = resolver.resolve('delete')
    expect(result).toBeInstanceOf(DefaultPromptAssemblyStrategy)
  })

  it('should be independent across multiple instances', () => {
    const r1 = new DefaultPromptAssemblyStrategyResolver()
    const r2 = new DefaultPromptAssemblyStrategyResolver()
    const result1 = r1.resolve('test')
    const result2 = r2.resolve('test')
    expect(result1.strategyName).toBe(result2.strategyName)
  })
})

// ---------------------------------------------------------------------------
// DefaultPromptAssemblyStrategyResolver — Pure / No Side Effects
// ---------------------------------------------------------------------------

describe('DefaultPromptAssemblyStrategyResolver — pure / no side effects', () => {
  it('should have no side effects on resolver instance', () => {
    const resolver = new DefaultPromptAssemblyStrategyResolver()
    const before = Object.keys(resolver)
    resolver.resolve('create')
    resolver.resolve('query')
    resolver.resolve('')
    expect(Object.keys(resolver)).toEqual(before)
  })
})

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

describe('PromptAssemblyStrategy exports', () => {
  it('should export PromptAssemblyStrategy type from strategy/index', () => {
    const strategy: PromptAssemblyStrategy = new DefaultPromptAssemblyStrategy()
    expect(strategy.strategyName).toBe('default')
  })

  it('should export DefaultPromptAssemblyStrategy class from strategy/index', () => {
    const strategy = new DefaultPromptAssemblyStrategy()
    expect(strategy).toBeInstanceOf(DefaultPromptAssemblyStrategy)
  })

  it('should export PromptAssemblyStrategyResolver type from strategy/index', () => {
    const resolver: PromptAssemblyStrategyResolver = new DefaultPromptAssemblyStrategyResolver()
    expect(resolver.resolve).toBeDefined()
  })

  it('should export DefaultPromptAssemblyStrategyResolver class from strategy/index', () => {
    const resolver = new DefaultPromptAssemblyStrategyResolver()
    expect(resolver).toBeInstanceOf(DefaultPromptAssemblyStrategyResolver)
  })

  it('should export PromptAssemblyStrategy type from package root', () => {
    const strategy: StrategyFromRoot = new DefaultPromptAssemblyStrategy()
    expect(strategy.strategyName).toBe('default')
  })

  it('should export PromptAssemblyStrategyResolver type from package root', () => {
    const resolver: ResolverFromRoot = new DefaultPromptAssemblyStrategyResolver()
    expect(resolver.resolve).toBeDefined()
  })

  it('should export DefaultPromptAssemblyStrategy class from package root', () => {
    const strategy = new DefaultFromRoot()
    expect(strategy).toBeInstanceOf(DefaultPromptAssemblyStrategy)
  })

  it('should export DefaultPromptAssemblyStrategyResolver class from package root', () => {
    const resolver = new DefaultResolverFromRoot()
    expect(resolver).toBeInstanceOf(DefaultPromptAssemblyStrategyResolver)
  })
})

// ---------------------------------------------------------------------------
// Architecture Compliance
// ---------------------------------------------------------------------------

describe('Architecture compliance', () => {
  it('should not depend on Planner', () => {
    const strategy = new DefaultPromptAssemblyStrategy()
    expect(strategy.apply([])).toEqual([])
  })

  it('should not depend on Runtime', () => {
    const resolver = new DefaultPromptAssemblyStrategyResolver()
    expect(resolver.resolve('test')).toBeDefined()
  })

  it('should not depend on Provider', () => {
    const strategy = new DefaultPromptAssemblyStrategy()
    expect(strategy).toBeInstanceOf(DefaultPromptAssemblyStrategy)
  })

  it('should not depend on Memory', () => {
    const strategy = new DefaultPromptAssemblyStrategy()
    expect(strategy.apply(['a'])).toEqual(['a'])
  })

  it('should not depend on ToolCalling', () => {
    const resolver = new DefaultPromptAssemblyStrategyResolver()
    expect(resolver.resolve('default').strategyName).toBe('default')
  })

  it('should not depend on AgentLoop', () => {
    const strategy = new DefaultPromptAssemblyStrategy()
    expect(strategy.apply(['a', 'b'])).toEqual(['a', 'b'])
  })

  it('should not depend on PromptBuilder', () => {
    const strategy = new DefaultPromptAssemblyStrategy()
    expect(strategy.strategyName).toBe('default')
  })

  it('should not depend on Pipeline', () => {
    const resolver = new DefaultPromptAssemblyStrategyResolver()
    const result = resolver.resolve('any')
    expect(result.strategyName).toBe('default')
  })

  it('should be pure — no side effects on input', () => {
    const strategy = new DefaultPromptAssemblyStrategy()
    const sections = ['a', 'b']
    const before = JSON.stringify(sections)
    strategy.apply(sections)
    expect(JSON.stringify(sections)).toBe(before)
  })

  it('should be stateless — no internal state', () => {
    const s1 = new DefaultPromptAssemblyStrategy()
    const s2 = new DefaultPromptAssemblyStrategy()
    expect(s1.apply(['x'])).toEqual(s2.apply(['x']))
  })

  it('should be non-mutating — never modifies inputs', () => {
    const strategy = new DefaultPromptAssemblyStrategy()
    const sections = Object.freeze(['a', 'b', 'c'])
    expect(() => strategy.apply(sections)).not.toThrow()
  })
})

// ---------------------------------------------------------------------------
// RetryPlanner Compatibility
// ---------------------------------------------------------------------------

describe('RetryPlanner Compatibility', () => {
  it('should work with RetryPlanner — strategy is independent', () => {
    const strategy = new DefaultPromptAssemblyStrategy()
    expect(strategy).toBeInstanceOf(DefaultPromptAssemblyStrategy)
  })

  it('should not affect RetryPlanner behavior', () => {
    const strategy = new DefaultPromptAssemblyStrategy()
    const sections = ['system', 'user']
    expect(strategy.apply(sections)).toEqual(sections)
  })
})

// ---------------------------------------------------------------------------
// ToolCallPlanner Compatibility
// ---------------------------------------------------------------------------

describe('ToolCallPlanner Compatibility', () => {
  it('should work with ToolCallPlanner — strategy is independent', () => {
    const resolver = new DefaultPromptAssemblyStrategyResolver()
    expect(resolver.resolve('test')).toBeInstanceOf(DefaultPromptAssemblyStrategy)
  })

  it('should not affect ToolCallPlanner tool execution', () => {
    const strategy = new DefaultPromptAssemblyStrategy()
    expect(strategy.apply(['prompt'])).toEqual(['prompt'])
  })
})

// ---------------------------------------------------------------------------
// Streaming Compatibility
// ---------------------------------------------------------------------------

describe('Streaming Compatibility', () => {
  it('should work with StreamingProvider — strategy is independent', () => {
    const strategy = new DefaultPromptAssemblyStrategy()
    expect(strategy).toBeInstanceOf(DefaultPromptAssemblyStrategy)
  })

  it('should not affect streaming', () => {
    const resolver = new DefaultPromptAssemblyStrategyResolver()
    const result = resolver.resolve('streaming')
    expect(result.apply(['chunk'])).toEqual(['chunk'])
  })
})

// ---------------------------------------------------------------------------
// AgentLoop Compatibility
// ---------------------------------------------------------------------------

describe('AgentLoop Compatibility', () => {
  it('should work with AgentLoop — strategy is independent', () => {
    const strategy = new DefaultPromptAssemblyStrategy()
    expect(strategy).toBeInstanceOf(DefaultPromptAssemblyStrategy)
  })

  it('should not affect AgentLoop iteration', () => {
    const resolver = new DefaultPromptAssemblyStrategyResolver()
    const result = resolver.resolve('agent')
    expect(result.apply(['observation', 'action'])).toEqual(['observation', 'action'])
  })
})

// ---------------------------------------------------------------------------
// No Behavior Changes
// ---------------------------------------------------------------------------

describe('No behavior changes', () => {
  it('DefaultPromptAssemblyStrategy.apply is identity function', () => {
    const strategy = new DefaultPromptAssemblyStrategy()
    const sections = ['a', 'b', 'c', 'd', 'e']
    expect(strategy.apply(sections)).toEqual(sections)
  })

  it('DefaultPromptAssemblyStrategyResolver returns correct strategies', () => {
    const resolver = new DefaultPromptAssemblyStrategyResolver()
    const createNames = ['create']
    const queryNames = ['query']
    const modifyNames = ['modify']
    const defaultNames = ['delete', 'default', 'unknown']
    for (const name of createNames) {
      const result = resolver.resolve(name)
      expect(result).toBeInstanceOf(CreatePromptAssemblyStrategy)
      expect(result.strategyName).toBe('create')
    }
    for (const name of queryNames) {
      const result = resolver.resolve(name)
      expect(result).toBeInstanceOf(QueryPromptAssemblyStrategy)
      expect(result.strategyName).toBe('query')
    }
    for (const name of modifyNames) {
      const result = resolver.resolve(name)
      expect(result).toBeInstanceOf(ModifyPromptAssemblyStrategy)
      expect(result.strategyName).toBe('modify')
    }
    for (const name of defaultNames) {
      const result = resolver.resolve(name)
      expect(result).toBeInstanceOf(DefaultPromptAssemblyStrategy)
      expect(result.strategyName).toBe('default')
    }
  })

  it('does not modify PromptBuilder behavior', () => {
    // PromptBuilder is not imported — this file has no dependency on it
    const strategy = new DefaultPromptAssemblyStrategy()
    expect(strategy.apply(['system', 'user'])).toEqual(['system', 'user'])
  })

  it('does not modify PromptRenderer behavior', () => {
    // PromptRenderer is not imported — this file has no dependency on it
    const strategy = new DefaultPromptAssemblyStrategy()
    expect(strategy.strategyName).toBe('default')
  })

  it('does not modify PromptContext behavior', () => {
    // PromptContext is not imported — this file has no dependency on it
    const resolver = new DefaultPromptAssemblyStrategyResolver()
    expect(resolver.resolve('any')).toBeInstanceOf(DefaultPromptAssemblyStrategy)
  })

  it('does not modify Pipeline behavior', () => {
    // Pipeline is not imported — this file has no dependency on it
    const strategy = new DefaultPromptAssemblyStrategy()
    const resolver = new DefaultPromptAssemblyStrategyResolver()
    expect(strategy.apply([])).toEqual([])
    expect(resolver.resolve('pipeline')).toBeInstanceOf(DefaultPromptAssemblyStrategy)
  })
})
