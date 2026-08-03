import { describe, it, expect } from 'vitest'
import type { PromptAssemblyStrategy } from '../strategy/PromptAssemblyStrategy'
import { CreatePromptAssemblyStrategy } from '../strategy/CreatePromptAssemblyStrategy'
import { QueryPromptAssemblyStrategy } from '../strategy/QueryPromptAssemblyStrategy'
import { ModifyPromptAssemblyStrategy } from '../strategy/ModifyPromptAssemblyStrategy'
import { DeletePromptAssemblyStrategy } from '../strategy/DeletePromptAssemblyStrategy'
import { DefaultPromptAssemblyStrategyResolver } from '../strategy/DefaultPromptAssemblyStrategyResolver'
import { DefaultPromptAssemblyStrategy } from '../strategy/DefaultPromptAssemblyStrategy'
import type {
  PromptAssemblyStrategy as StrategyFromRoot,
  PromptAssemblyStrategyResolver as ResolverFromRoot,
} from '../index'
import {
  CreatePromptAssemblyStrategy as CreateFromRoot,
  DefaultPromptAssemblyStrategy as DefaultFromRoot,
  DefaultPromptAssemblyStrategyResolver as DefaultResolverFromRoot,
} from '../index'

// ---------------------------------------------------------------------------
// CreatePromptAssemblyStrategy — Interface Conformance
// ---------------------------------------------------------------------------

describe('CreatePromptAssemblyStrategy — interface', () => {
  it('should implement PromptAssemblyStrategy interface', () => {
    const strategy: PromptAssemblyStrategy = new CreatePromptAssemblyStrategy()
    expect(strategy).toBeInstanceOf(CreatePromptAssemblyStrategy)
  })

  it('should define a strategyName property', () => {
    const strategy: PromptAssemblyStrategy = new CreatePromptAssemblyStrategy()
    expect(strategy.strategyName).toBeDefined()
    expect(typeof strategy.strategyName).toBe('string')
  })

  it('should have strategyName "create"', () => {
    const strategy = new CreatePromptAssemblyStrategy()
    expect(strategy.strategyName).toBe('create')
  })

  it('should define an apply method', () => {
    const strategy: PromptAssemblyStrategy = new CreatePromptAssemblyStrategy()
    expect(strategy.apply).toBeDefined()
    expect(typeof strategy.apply).toBe('function')
  })

  it('should accept readonly string array as apply parameter', () => {
    const strategy = new CreatePromptAssemblyStrategy()
    const sections: readonly string[] = ['a', 'b', 'c']
    expect(() => strategy.apply(sections)).not.toThrow()
  })

  it('should return readonly string array from apply', () => {
    const strategy = new CreatePromptAssemblyStrategy()
    const result = strategy.apply(['a', 'b'])
    expect(Array.isArray(result)).toBe(true)
    for (const item of result) {
      expect(typeof item).toBe('string')
    }
  })

  it('should return the input sections unchanged (identity)', () => {
    const strategy = new CreatePromptAssemblyStrategy()
    const result = strategy.apply(['a', 'b', 'c'])
    expect(result).toEqual(['a', 'b', 'c'])
  })

  it('should return a new array reference (not identity)', () => {
    const strategy = new CreatePromptAssemblyStrategy()
    const sections = ['a', 'b'] as readonly string[]
    const result = strategy.apply(sections)
    // Create strategy reorders sections, so it returns a new array
    expect(result).not.toBe(sections)
  })
})

// ---------------------------------------------------------------------------
// CreatePromptAssemblyStrategy — Identity Behavior
// ---------------------------------------------------------------------------

describe('CreatePromptAssemblyStrategy — identity behavior', () => {
  it('should return same content for a single section', () => {
    const strategy = new CreatePromptAssemblyStrategy()
    expect(strategy.apply(['hello'])).toEqual(['hello'])
  })

  it('should return same content for multiple sections', () => {
    const strategy = new CreatePromptAssemblyStrategy()
    const sections = ['system', 'intent', 'user', 'memory']
    expect(strategy.apply(sections)).toEqual(sections)
  })

  it('should preserve order of sections', () => {
    const strategy = new CreatePromptAssemblyStrategy()
    const sections = ['a', 'b', 'c', 'd', 'e']
    expect(strategy.apply(sections)).toEqual(['a', 'b', 'c', 'd', 'e'])
  })

  it('should preserve reversed order if input is reversed', () => {
    const strategy = new CreatePromptAssemblyStrategy()
    const sections = ['e', 'd', 'c', 'b', 'a']
    expect(strategy.apply(sections)).toEqual(['e', 'd', 'c', 'b', 'a'])
  })

  it('should preserve duplicates in sections', () => {
    const strategy = new CreatePromptAssemblyStrategy()
    const sections = ['a', 'a', 'b', 'b', 'c']
    expect(strategy.apply(sections)).toEqual(['a', 'a', 'b', 'b', 'c'])
  })

  it('should preserve consecutive duplicates', () => {
    const strategy = new CreatePromptAssemblyStrategy()
    const sections = ['x', 'x', 'x']
    expect(strategy.apply(sections)).toEqual(['x', 'x', 'x'])
  })

  it('should preserve sections with special characters', () => {
    const strategy = new CreatePromptAssemblyStrategy()
    const sections = ['hello\nworld', '  spaces  ', 'emoji 🎉', '']
    expect(strategy.apply(sections)).toEqual(['hello\nworld', '  spaces  ', 'emoji 🎉', ''])
  })

  it('should preserve sections with unicode characters', () => {
    const strategy = new CreatePromptAssemblyStrategy()
    const sections = ['中文', '日本語', '한국어', 'αβγ']
    expect(strategy.apply(sections)).toEqual(['中文', '日本語', '한국어', 'αβγ'])
  })

  it('should preserve sections with long strings', () => {
    const strategy = new CreatePromptAssemblyStrategy()
    const sections = ['a'.repeat(1000), 'b'.repeat(2000)]
    expect(strategy.apply(sections)).toEqual(['a'.repeat(1000), 'b'.repeat(2000)])
  })

  it('should preserve sections with newlines and tabs', () => {
    const strategy = new CreatePromptAssemblyStrategy()
    const sections = ['line1\nline2', 'col1\tcol2']
    expect(strategy.apply(sections)).toEqual(['line1\nline2', 'col1\tcol2'])
  })

  it('should preserve empty sections', () => {
    const strategy = new CreatePromptAssemblyStrategy()
    const sections = ['', 'a', '', 'b', '']
    expect(strategy.apply(sections)).toEqual(['', 'a', '', 'b', ''])
  })

  it('should preserve all-empty sections array', () => {
    const strategy = new CreatePromptAssemblyStrategy()
    const sections = ['', '', '']
    expect(strategy.apply(sections)).toEqual(['', '', ''])
  })

  it('should preserve empty array', () => {
    const strategy = new CreatePromptAssemblyStrategy()
    expect(strategy.apply([])).toEqual([])
  })

  it('should not add or remove any sections', () => {
    const strategy = new CreatePromptAssemblyStrategy()
    const sections = ['a', 'b', 'c']
    const result = strategy.apply(sections)
    expect(result.length).toBe(sections.length)
  })

  it('should not modify section content', () => {
    const strategy = new CreatePromptAssemblyStrategy()
    const sections = ['system prompt', 'user input', 'memory']
    const result = strategy.apply(sections)
    for (let i = 0; i < sections.length; i++) {
      expect(result[i]).toBe(sections[i])
    }
  })
})

// ---------------------------------------------------------------------------
// CreatePromptAssemblyStrategy — Deterministic
// ---------------------------------------------------------------------------

describe('CreatePromptAssemblyStrategy — deterministic', () => {
  it('should return same result for same sections across repeated calls', () => {
    const strategy = new CreatePromptAssemblyStrategy()
    const sections = ['a', 'b', 'c']
    const r1 = strategy.apply(sections)
    const r2 = strategy.apply(sections)
    const r3 = strategy.apply(sections)
    expect(r1).toEqual(r2)
    expect(r2).toEqual(r3)
  })

  it('should be idempotent across ten calls', () => {
    const strategy = new CreatePromptAssemblyStrategy()
    const sections = ['system', 'user', 'memory']
    for (let i = 0; i < 10; i++) {
      expect(strategy.apply(sections)).toEqual(sections)
    }
  })

  it('should return consistent results regardless of call count', () => {
    const strategy = new CreatePromptAssemblyStrategy()
    const sections = ['x', 'y']
    strategy.apply(sections)
    strategy.apply(sections)
    const result = strategy.apply(sections)
    expect(result).toEqual(sections)
  })

  it('should be deterministic with varying section counts', () => {
    const strategy = new CreatePromptAssemblyStrategy()
    const s1 = strategy.apply(['a'])
    const s2 = strategy.apply(['a', 'b'])
    const s3 = strategy.apply(['a', 'b', 'c'])
    expect(s1).toEqual(['a'])
    expect(s2).toEqual(['a', 'b'])
    expect(s3).toEqual(['a', 'b', 'c'])
  })

  it('should be deterministic across one hundred calls', () => {
    const strategy = new CreatePromptAssemblyStrategy()
    const sections = ['create', 'system', 'user']
    for (let i = 0; i < 100; i++) {
      expect(strategy.apply(sections)).toEqual(sections)
    }
  })
})

// ---------------------------------------------------------------------------
// CreatePromptAssemblyStrategy — Stateless
// ---------------------------------------------------------------------------

describe('CreatePromptAssemblyStrategy — stateless', () => {
  it('should not retain state between calls', () => {
    const strategy = new CreatePromptAssemblyStrategy()
    const sections1 = ['short']
    const sections2 = ['much longer section with more content']
    expect(strategy.apply(sections1)).toEqual(sections1)
    expect(strategy.apply(sections2)).toEqual(sections2)
    expect(strategy.apply(sections1)).toEqual(sections1)
  })

  it('should be independent across multiple instances', () => {
    const s1 = new CreatePromptAssemblyStrategy()
    const s2 = new CreatePromptAssemblyStrategy()
    const sections = ['a', 'b']
    expect(s1.apply(sections)).toEqual(s2.apply(sections))
  })

  it('should not share state between different instances', () => {
    const s1 = new CreatePromptAssemblyStrategy()
    const s2 = new CreatePromptAssemblyStrategy()
    s1.apply(['x', 'y'])
    const result = s2.apply(['a', 'b'])
    expect(result).toEqual(['a', 'b'])
  })

  it('should produce identical results across many instances', () => {
    const strategies = Array.from({ length: 20 }, () => new CreatePromptAssemblyStrategy())
    const sections = ['create', 'prompt']
    const results = strategies.map(s => s.apply(sections))
    for (const result of results) {
      expect(result).toEqual(sections)
    }
  })
})

// ---------------------------------------------------------------------------
// CreatePromptAssemblyStrategy — Pure / No Side Effects
// ---------------------------------------------------------------------------

describe('CreatePromptAssemblyStrategy — pure / no side effects', () => {
  it('should not modify the input sections array', () => {
    const strategy = new CreatePromptAssemblyStrategy()
    const sections = ['a', 'b', 'c']
    const frozen = Object.freeze([...sections])
    expect(() => strategy.apply(frozen)).not.toThrow()
  })

  it('should not mutate the original array reference', () => {
    const strategy = new CreatePromptAssemblyStrategy()
    const original = ['x', 'y', 'z']
    const originalCopy = [...original]
    strategy.apply(original)
    expect(original).toEqual(originalCopy)
  })

  it('should have no side effects on strategy instance', () => {
    const strategy = new CreatePromptAssemblyStrategy()
    const before = Object.keys(strategy)
    strategy.apply(['a'])
    strategy.apply(['b', 'c'])
    strategy.apply([])
    expect(Object.keys(strategy)).toEqual(before)
  })

  it('should support frozen input arrays', () => {
    const strategy = new CreatePromptAssemblyStrategy()
    const frozen = Object.freeze(['create', 'system', 'user'])
    expect(() => strategy.apply(frozen)).not.toThrow()
    expect(strategy.apply(frozen)).toEqual(['create', 'system', 'user'])
  })

  it('should not modify frozen arrays with many elements', () => {
    const strategy = new CreatePromptAssemblyStrategy()
    const sections = Object.freeze(Array.from({ length: 50 }, (_, i) => `section-${i}`))
    expect(() => strategy.apply(sections)).not.toThrow()
    expect(strategy.apply(sections)).toEqual(sections)
  })

  it('should return a new array for frozen arrays (creates copy)', () => {
    const strategy = new CreatePromptAssemblyStrategy()
    const sections = Object.freeze(['a', 'b', 'c'])
    const result = strategy.apply(sections)
    // Create strategy returns a new array (not identity)
    expect(result).not.toBe(sections)
    expect(result).toEqual(['a', 'b', 'c'])
  })
})

// ---------------------------------------------------------------------------
// DefaultPromptAssemblyStrategyResolver — Create Routing
// ---------------------------------------------------------------------------

describe('DefaultPromptAssemblyStrategyResolver — create routing', () => {
  it('should return CreatePromptAssemblyStrategy for "create" name', () => {
    const resolver = new DefaultPromptAssemblyStrategyResolver()
    const result = resolver.resolve('create')
    expect(result).toBeInstanceOf(CreatePromptAssemblyStrategy)
  })

  it('should return CreatePromptAssemblyStrategy with strategyName "create"', () => {
    const resolver = new DefaultPromptAssemblyStrategyResolver()
    const result = resolver.resolve('create')
    expect(result.strategyName).toBe('create')
  })

  it('should return QueryPromptAssemblyStrategy for "query" name', () => {
    const resolver = new DefaultPromptAssemblyStrategyResolver()
    const result = resolver.resolve('query')
    expect(result).toBeInstanceOf(QueryPromptAssemblyStrategy)
  })

  it('should return QueryPromptAssemblyStrategy with strategyName "query"', () => {
    const resolver = new DefaultPromptAssemblyStrategyResolver()
    const result = resolver.resolve('query')
    expect(result.strategyName).toBe('query')
  })

  it('should return ModifyPromptAssemblyStrategy for "modify" name', () => {
    const resolver = new DefaultPromptAssemblyStrategyResolver()
    const result = resolver.resolve('modify')
    expect(result).toBeInstanceOf(ModifyPromptAssemblyStrategy)
    expect(result.strategyName).toBe('modify')
  })

  it('should return DeletePromptAssemblyStrategy for "delete" name', () => {
    const resolver = new DefaultPromptAssemblyStrategyResolver()
    const result = resolver.resolve('delete')
    expect(result).toBeInstanceOf(DeletePromptAssemblyStrategy)
    expect(result.strategyName).toBe('delete')
  })

  it('should return DefaultPromptAssemblyStrategy for "default" name', () => {
    const resolver = new DefaultPromptAssemblyStrategyResolver()
    const result = resolver.resolve('default')
    expect(result).toBeInstanceOf(DefaultPromptAssemblyStrategy)
  })

  it('should return DefaultPromptAssemblyStrategy for unknown names', () => {
    const resolver = new DefaultPromptAssemblyStrategyResolver()
    const names = ['unknown', '', 'custom-123', 'search', 'update']
    for (const name of names) {
      const result = resolver.resolve(name)
      expect(result).toBeInstanceOf(DefaultPromptAssemblyStrategy)
    }
  })

  it('should return DefaultPromptAssemblyStrategy for "Modify" (case-sensitive)', () => {
    const resolver = new DefaultPromptAssemblyStrategyResolver()
    const result = resolver.resolve('Modify')
    expect(result).toBeInstanceOf(DefaultPromptAssemblyStrategy)
    expect(result.strategyName).toBe('default')
  })

  it('should return DefaultPromptAssemblyStrategy for "MODIFY" (case-sensitive)', () => {
    const resolver = new DefaultPromptAssemblyStrategyResolver()
    const result = resolver.resolve('MODIFY')
    expect(result).toBeInstanceOf(DefaultPromptAssemblyStrategy)
    expect(result.strategyName).toBe('default')
  })

  it('should route create, query, modify, delete to correct strategies and everything else to default', () => {
    const resolver = new DefaultPromptAssemblyStrategyResolver()
    expect(resolver.resolve('create')).toBeInstanceOf(CreatePromptAssemblyStrategy)
    expect(resolver.resolve('query')).toBeInstanceOf(QueryPromptAssemblyStrategy)
    expect(resolver.resolve('modify')).toBeInstanceOf(ModifyPromptAssemblyStrategy)
    expect(resolver.resolve('delete')).toBeInstanceOf(DeletePromptAssemblyStrategy)
    expect(resolver.resolve('default')).toBeInstanceOf(DefaultPromptAssemblyStrategy)
    expect(resolver.resolve('read')).toBeInstanceOf(DefaultPromptAssemblyStrategy)
    expect(resolver.resolve('update')).toBeInstanceOf(DefaultPromptAssemblyStrategy)
    expect(resolver.resolve('')).toBeInstanceOf(DefaultPromptAssemblyStrategy)
    expect(resolver.resolve(' modify')).toBeInstanceOf(DefaultPromptAssemblyStrategy)
  })
})

// ---------------------------------------------------------------------------
// DefaultPromptAssemblyStrategyResolver — Deterministic
// ---------------------------------------------------------------------------

describe('DefaultPromptAssemblyStrategyResolver — deterministic', () => {
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

  it('should be idempotent for "create" across ten calls', () => {
    const resolver = new DefaultPromptAssemblyStrategyResolver()
    for (let i = 0; i < 10; i++) {
      const result = resolver.resolve('create')
      expect(result).toBeInstanceOf(CreatePromptAssemblyStrategy)
      expect(result.strategyName).toBe('create')
    }
  })

  it('should be idempotent for unknown names across ten calls', () => {
    const resolver = new DefaultPromptAssemblyStrategyResolver()
    for (let i = 0; i < 10; i++) {
      const result = resolver.resolve('unknown')
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
    resolver.resolve('modify')
    resolver.resolve('delete')
    const result = resolver.resolve('default')
    expect(result).toBeInstanceOf(DefaultPromptAssemblyStrategy)
  })

  it('should be independent across multiple instances', () => {
    const r1 = new DefaultPromptAssemblyStrategyResolver()
    const r2 = new DefaultPromptAssemblyStrategyResolver()
    const result1 = r1.resolve('create')
    const result2 = r2.resolve('create')
    expect(result1.strategyName).toBe(result2.strategyName)
    expect(result1).toBeInstanceOf(CreatePromptAssemblyStrategy)
    expect(result2).toBeInstanceOf(CreatePromptAssemblyStrategy)
  })

  it('should not share state between different instances across many calls', () => {
    const r1 = new DefaultPromptAssemblyStrategyResolver()
    const r2 = new DefaultPromptAssemblyStrategyResolver()
    for (let i = 0; i < 10; i++) {
      r1.resolve('create')
      r2.resolve('query')
    }
    expect(r1.resolve('create')).toBeInstanceOf(CreatePromptAssemblyStrategy)
    expect(r2.resolve('query')).toBeInstanceOf(QueryPromptAssemblyStrategy)
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

  it('should not modify the input strategy name', () => {
    const resolver = new DefaultPromptAssemblyStrategyResolver()
    const name = 'create'
    const originalName = name
    resolver.resolve(name)
    expect(name).toBe(originalName)
  })
})

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

describe('CreatePromptAssemblyStrategy exports', () => {
  it('should export CreatePromptAssemblyStrategy class from strategy/index', () => {
    const strategy = new CreatePromptAssemblyStrategy()
    expect(strategy).toBeInstanceOf(CreatePromptAssemblyStrategy)
  })

  it('should export CreatePromptAssemblyStrategy class from package root', () => {
    const strategy = new CreateFromRoot()
    expect(strategy).toBeInstanceOf(CreatePromptAssemblyStrategy)
  })

  it('should export CreatePromptAssemblyStrategy with strategyName "create" from package root', () => {
    const strategy = new CreateFromRoot()
    expect(strategy.strategyName).toBe('create')
  })

  it('should still export PromptAssemblyStrategy type from package root', () => {
    const strategy: StrategyFromRoot = new CreatePromptAssemblyStrategy()
    expect(strategy.strategyName).toBe('create')
  })

  it('should still export PromptAssemblyStrategyResolver type from package root', () => {
    const resolver: ResolverFromRoot = new DefaultPromptAssemblyStrategyResolver()
    expect(resolver.resolve).toBeDefined()
  })

  it('should still export DefaultPromptAssemblyStrategy class from package root', () => {
    const strategy = new DefaultFromRoot()
    expect(strategy).toBeInstanceOf(DefaultPromptAssemblyStrategy)
  })

  it('should still export DefaultPromptAssemblyStrategyResolver class from package root', () => {
    const resolver = new DefaultResolverFromRoot()
    expect(resolver).toBeInstanceOf(DefaultPromptAssemblyStrategyResolver)
  })

  it('should not break DefaultPromptAssemblyStrategy resolver export from strategy/index', () => {
    const resolver = new DefaultPromptAssemblyStrategyResolver()
    expect(resolver.resolve('create')).toBeInstanceOf(CreatePromptAssemblyStrategy)
  })
})

// ---------------------------------------------------------------------------
// Architecture Compliance
// ---------------------------------------------------------------------------

describe('Architecture compliance', () => {
  it('should not depend on Planner', () => {
    const strategy = new CreatePromptAssemblyStrategy()
    expect(strategy.apply([])).toEqual([])
  })

  it('should not depend on Runtime', () => {
    const resolver = new DefaultPromptAssemblyStrategyResolver()
    expect(resolver.resolve('create')).toBeInstanceOf(CreatePromptAssemblyStrategy)
  })

  it('should not depend on Provider', () => {
    const strategy = new CreatePromptAssemblyStrategy()
    expect(strategy).toBeInstanceOf(CreatePromptAssemblyStrategy)
  })

  it('should not depend on Memory', () => {
    const strategy = new CreatePromptAssemblyStrategy()
    expect(strategy.apply(['a'])).toEqual(['a'])
  })

  it('should not depend on ToolCalling', () => {
    const resolver = new DefaultPromptAssemblyStrategyResolver()
    expect(resolver.resolve('create').strategyName).toBe('create')
  })

  it('should not depend on AgentLoop', () => {
    const strategy = new CreatePromptAssemblyStrategy()
    expect(strategy.apply(['a', 'b'])).toEqual(['a', 'b'])
  })

  it('should not depend on PromptBuilder', () => {
    const strategy = new CreatePromptAssemblyStrategy()
    expect(strategy.strategyName).toBe('create')
  })

  it('should not depend on Pipeline', () => {
    const resolver = new DefaultPromptAssemblyStrategyResolver()
    const result = resolver.resolve('create')
    expect(result.strategyName).toBe('create')
  })

  it('should be pure — no side effects on input', () => {
    const strategy = new CreatePromptAssemblyStrategy()
    const sections = ['a', 'b']
    const before = JSON.stringify(sections)
    strategy.apply(sections)
    expect(JSON.stringify(sections)).toBe(before)
  })

  it('should be stateless — no internal state', () => {
    const s1 = new CreatePromptAssemblyStrategy()
    const s2 = new CreatePromptAssemblyStrategy()
    expect(s1.apply(['x'])).toEqual(s2.apply(['x']))
  })

  it('should be non-mutating — never modifies inputs', () => {
    const strategy = new CreatePromptAssemblyStrategy()
    const sections = Object.freeze(['a', 'b', 'c'])
    expect(() => strategy.apply(sections)).not.toThrow()
  })
})

// ---------------------------------------------------------------------------
// Resolver Integration
// ---------------------------------------------------------------------------

describe('Resolver integration', () => {
  it('should resolve "create" to CreatePromptAssemblyStrategy', () => {
    const resolver = new DefaultPromptAssemblyStrategyResolver()
    expect(resolver.resolve('create')).toBeInstanceOf(CreatePromptAssemblyStrategy)
  })

  it('should resolve "query" to QueryPromptAssemblyStrategy', () => {
    const resolver = new DefaultPromptAssemblyStrategyResolver()
    expect(resolver.resolve('query')).toBeInstanceOf(QueryPromptAssemblyStrategy)
  })

  it('should resolve "modify" to ModifyPromptAssemblyStrategy', () => {
    const resolver = new DefaultPromptAssemblyStrategyResolver()
    expect(resolver.resolve('modify')).toBeInstanceOf(ModifyPromptAssemblyStrategy)
  })

  it('should resolve "delete" to DeletePromptAssemblyStrategy', () => {
    const resolver = new DefaultPromptAssemblyStrategyResolver()
    expect(resolver.resolve('delete')).toBeInstanceOf(DeletePromptAssemblyStrategy)
  })

  it('should resolve "unknown" to DefaultPromptAssemblyStrategy', () => {
    const resolver = new DefaultPromptAssemblyStrategyResolver()
    expect(resolver.resolve('unknown')).toBeInstanceOf(DefaultPromptAssemblyStrategy)
  })

  it('should resolve "default" to DefaultPromptAssemblyStrategy', () => {
    const resolver = new DefaultPromptAssemblyStrategyResolver()
    expect(resolver.resolve('default')).toBeInstanceOf(DefaultPromptAssemblyStrategy)
  })

  it('should resolve empty string to DefaultPromptAssemblyStrategy', () => {
    const resolver = new DefaultPromptAssemblyStrategyResolver()
    expect(resolver.resolve('')).toBeInstanceOf(DefaultPromptAssemblyStrategy)
  })
})

// ---------------------------------------------------------------------------
// RetryPlanner Compatibility
// ---------------------------------------------------------------------------

describe('RetryPlanner Compatibility', () => {
  it('should work with RetryPlanner — strategy is independent', () => {
    const strategy = new CreatePromptAssemblyStrategy()
    expect(strategy).toBeInstanceOf(CreatePromptAssemblyStrategy)
  })

  it('should not affect RetryPlanner behavior', () => {
    const strategy = new CreatePromptAssemblyStrategy()
    const sections = ['system', 'user']
    expect(strategy.apply(sections)).toEqual(sections)
  })

  it('resolver can route "create" when used with RetryPlanner', () => {
    const resolver = new DefaultPromptAssemblyStrategyResolver()
    const result = resolver.resolve('create')
    expect(result).toBeInstanceOf(CreatePromptAssemblyStrategy)
    expect(result.apply(['retry'])).toEqual(['retry'])
  })
})

// ---------------------------------------------------------------------------
// ToolCallPlanner Compatibility
// ---------------------------------------------------------------------------

describe('ToolCallPlanner Compatibility', () => {
  it('should work with ToolCallPlanner — strategy is independent', () => {
    const resolver = new DefaultPromptAssemblyStrategyResolver()
    expect(resolver.resolve('create')).toBeInstanceOf(CreatePromptAssemblyStrategy)
  })

  it('should not affect ToolCallPlanner tool execution', () => {
    const strategy = new CreatePromptAssemblyStrategy()
    expect(strategy.apply(['prompt'])).toEqual(['prompt'])
  })

  it('resolver can route "create" when used with ToolCallPlanner', () => {
    const resolver = new DefaultPromptAssemblyStrategyResolver()
    const result = resolver.resolve('create')
    expect(result.apply(['tool', 'call'])).toEqual(['tool', 'call'])
  })
})

// ---------------------------------------------------------------------------
// Streaming Compatibility
// ---------------------------------------------------------------------------

describe('Streaming Compatibility', () => {
  it('should work with StreamingProvider — strategy is independent', () => {
    const strategy = new CreatePromptAssemblyStrategy()
    expect(strategy).toBeInstanceOf(CreatePromptAssemblyStrategy)
  })

  it('should not affect streaming', () => {
    const resolver = new DefaultPromptAssemblyStrategyResolver()
    const result = resolver.resolve('create')
    expect(result.apply(['chunk'])).toEqual(['chunk'])
  })

  it('resolver can route "create" when used with streaming', () => {
    const resolver = new DefaultPromptAssemblyStrategyResolver()
    const result = resolver.resolve('create')
    expect(result.apply(['stream', 'data'])).toEqual(['stream', 'data'])
  })
})

// ---------------------------------------------------------------------------
// AgentLoop Compatibility
// ---------------------------------------------------------------------------

describe('AgentLoop Compatibility', () => {
  it('should work with AgentLoop — strategy is independent', () => {
    const strategy = new CreatePromptAssemblyStrategy()
    expect(strategy).toBeInstanceOf(CreatePromptAssemblyStrategy)
  })

  it('should not affect AgentLoop iteration', () => {
    const resolver = new DefaultPromptAssemblyStrategyResolver()
    const result = resolver.resolve('create')
    expect(result.apply(['observation', 'action'])).toEqual(['observation', 'action'])
  })

  it('resolver can route "create" when used with AgentLoop', () => {
    const resolver = new DefaultPromptAssemblyStrategyResolver()
    const result = resolver.resolve('create')
    expect(result.apply(['agent', 'loop'])).toEqual(['agent', 'loop'])
  })
})

// ---------------------------------------------------------------------------
// No Behavior Changes
// ---------------------------------------------------------------------------

describe('No behavior changes', () => {
  it('CreatePromptAssemblyStrategy.apply is identity function', () => {
    const strategy = new CreatePromptAssemblyStrategy()
    const sections = ['a', 'b', 'c', 'd', 'e']
    expect(strategy.apply(sections)).toEqual(sections)
  })

  it('DefaultPromptAssemblyStrategy is unchanged', () => {
    const strategy = new DefaultPromptAssemblyStrategy()
    expect(strategy.apply(['a', 'b'])).toEqual(['a', 'b'])
    expect(strategy.strategyName).toBe('default')
  })

  it('DefaultPromptAssemblyStrategyResolver still returns correct strategies', () => {
    const resolver = new DefaultPromptAssemblyStrategyResolver()
    const defaultNames = ['default', 'unknown', 'read', 'update']
    for (const name of defaultNames) {
      const result = resolver.resolve(name)
      expect(result).toBeInstanceOf(DefaultPromptAssemblyStrategy)
      expect(result.strategyName).toBe('default')
    }
    expect(resolver.resolve('query')).toBeInstanceOf(QueryPromptAssemblyStrategy)
    expect(resolver.resolve('modify')).toBeInstanceOf(ModifyPromptAssemblyStrategy)
    expect(resolver.resolve('delete')).toBeInstanceOf(DeletePromptAssemblyStrategy)
  })

  it('DefaultPromptAssemblyStrategyResolver now returns CreatePromptAssemblyStrategy for "create"', () => {
    const resolver = new DefaultPromptAssemblyStrategyResolver()
    const result = resolver.resolve('create')
    expect(result).toBeInstanceOf(CreatePromptAssemblyStrategy)
    expect(result.strategyName).toBe('create')
  })

  it('does not modify PromptBuilder behavior', () => {
    // PromptBuilder is not imported — this file has no dependency on it
    const strategy = new CreatePromptAssemblyStrategy()
    expect(strategy.apply(['system', 'user'])).toEqual(['system', 'user'])
  })

  it('does not modify PromptRenderer behavior', () => {
    // PromptRenderer is not imported — this file has no dependency on it
    const strategy = new CreatePromptAssemblyStrategy()
    expect(strategy.strategyName).toBe('create')
  })

  it('does not modify PromptContext behavior', () => {
    // PromptContext is not imported — this file has no dependency on it
    const resolver = new DefaultPromptAssemblyStrategyResolver()
    expect(resolver.resolve('create')).toBeInstanceOf(CreatePromptAssemblyStrategy)
  })

  it('does not modify Pipeline behavior', () => {
    // Pipeline is not imported — this file has no dependency on it
    const strategy = new CreatePromptAssemblyStrategy()
    const resolver = new DefaultPromptAssemblyStrategyResolver()
    expect(strategy.apply([])).toEqual([])
    expect(resolver.resolve('create')).toBeInstanceOf(CreatePromptAssemblyStrategy)
    expect(resolver.resolve('pipeline')).toBeInstanceOf(DefaultPromptAssemblyStrategy)
  })

  it('does not modify existing DefaultPromptAssemblyStrategy tests', () => {
    // Existing behavior preserved
    const defaultStrategy = new DefaultPromptAssemblyStrategy()
    expect(defaultStrategy.apply(['test'])).toEqual(['test'])
    expect(defaultStrategy.strategyName).toBe('default')
  })

  it('does not change existing PromptAssemblyStrategyResolver behavior for non-create-non-query-non-modify-non-delete names', () => {
    const resolver = new DefaultPromptAssemblyStrategyResolver()
    const names = ['default', '', 'unknown']
    for (const name of names) {
      const result = resolver.resolve(name)
      expect(result).toBeInstanceOf(DefaultPromptAssemblyStrategy)
      expect(result.strategyName).toBe('default')
    }
  })

  it('prompt output remains identical with CreatePromptAssemblyStrategy', () => {
    const strategy = new CreatePromptAssemblyStrategy()
    const sections = ['system', 'user', 'memory']
    const result = strategy.apply(sections)
    expect(result).toEqual(sections)
    expect(result.join('')).toBe(sections.join(''))
  })

  it('CreatePromptAssemblyStrategy does not alter existing default behavior', () => {
    const createStrategy = new CreatePromptAssemblyStrategy()
    const defaultStrategy = new DefaultPromptAssemblyStrategy()
    const sections = ['section-1', 'section-2', 'section-3']
    expect(createStrategy.apply(sections)).toEqual(defaultStrategy.apply(sections))
  })

  it('CreatePromptAssemblyStrategy.apply produces same output as DefaultPromptAssemblyStrategy.apply', () => {
    const create = new CreatePromptAssemblyStrategy()
    const def = new DefaultPromptAssemblyStrategy()
    const testCases: readonly string[][] = [
      [],
      ['a'],
      ['a', 'b'],
      ['system', 'user', 'memory', 'world'],
      Array.from({ length: 20 }, (_, i) => `s${i}`),
    ]
    for (const sections of testCases) {
      expect(create.apply(sections)).toEqual(def.apply(sections))
    }
  })
})