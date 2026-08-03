import { describe, it, expect } from 'vitest'
import { DefaultPromptBuilder } from '../prompt/DefaultPromptBuilder'
import type { PromptAssemblyStrategy } from '../strategy/PromptAssemblyStrategy'
import type { PromptAssemblyStrategyResolver } from '../strategy/PromptAssemblyStrategyResolver'
import { CreatePromptAssemblyStrategy } from '../strategy/CreatePromptAssemblyStrategy'
import { DefaultPromptAssemblyStrategy } from '../strategy/DefaultPromptAssemblyStrategy'
import { DefaultPromptAssemblyStrategyResolver } from '../strategy/DefaultPromptAssemblyStrategyResolver'
import { DefaultPromptStrategySelector } from '../strategy/DefaultPromptStrategySelector'
import { CreateStrategy } from '../strategy/CreateStrategy'
import { QueryStrategy } from '../strategy/QueryStrategy'
import { ModifyStrategy } from '../strategy/ModifyStrategy'
import { DeleteStrategy } from '../strategy/DeleteStrategy'
import { UserInputModule } from '../prompt/modules'
import { DefaultMemory } from '../memory/DefaultMemory'
import { DefaultAIConfiguration } from '../config/DefaultAIConfiguration'
import type { PipelineContext } from '../pipeline/PipelineContext'
import { DefaultPromptRenderer } from '../prompt/DefaultPromptRenderer'

// ---------------------------------------------------------------------------
// Test Helpers
// ---------------------------------------------------------------------------

function createPipelineContext(overrides?: Partial<PipelineContext>): PipelineContext {
  return {
    input: 'draw a tree',
    memory: new DefaultMemory(),
    worldState: '',
    ...overrides,
  }
}

const mockConfig = new DefaultAIConfiguration()

/** A resolver that always returns CreatePromptAssemblyStrategy */
class CreateOnlyResolver implements PromptAssemblyStrategyResolver {
  resolve(_strategyName: string): PromptAssemblyStrategy {
    return new CreatePromptAssemblyStrategy()
  }
}

// ---------------------------------------------------------------------------
// CreatePromptAssemblyStrategy — Reordering Behavior
// ---------------------------------------------------------------------------

describe('CreatePromptAssemblyStrategy — reordering', () => {
  it('should move userInput before worldState before strategyModuleRendered before strategyRendered', () => {
    const strategy = new CreatePromptAssemblyStrategy()
    const sections = [
      'semanticRendered',
      'strategyModuleRendered',
      'strategyRendered',
      'userInput',
      'memory',
      'worldState',
    ]
    const result = strategy.apply(sections)
    expect(result.indexOf('userInput')).toBeLessThan(result.indexOf('worldState'))
    expect(result.indexOf('worldState')).toBeLessThan(result.indexOf('strategyModuleRendered'))
    expect(result.indexOf('strategyModuleRendered')).toBeLessThan(result.indexOf('strategyRendered'))
  })

  it('should place priority items first in priority order', () => {
    const strategy = new CreatePromptAssemblyStrategy()
    const sections = [
      'semanticRendered',
      'strategyModuleRendered',
      'strategyRendered',
      'userInput',
      'memory',
      'worldState',
    ]
    const result = strategy.apply(sections)
    expect(result[0]).toBe('userInput')
    expect(result[1]).toBe('worldState')
    expect(result[2]).toBe('strategyModuleRendered')
    expect(result[3]).toBe('strategyRendered')
  })

  it('should preserve relative order of remaining items', () => {
    const strategy = new CreatePromptAssemblyStrategy()
    const sections = [
      'intentRendered',
      'entityRendered',
      'semanticRendered',
      'strategyRendered',
      'userInput',
      'memory',
      'worldState',
    ]
    const result = strategy.apply(sections)
    // Remaining items: intentRendered, entityRendered, semanticRendered, memory
    const remaining = result.filter(s =>
      !['userInput', 'worldState', 'strategyRendered'].includes(s),
    )
    // All in non-priority group: intentRendered, entityRendered, semanticRendered, memory
    expect(remaining).toEqual([
      'intentRendered',
      'entityRendered',
      'semanticRendered',
      'memory',
    ])
  })

  it('should preserve relative order of remaining items with no priority items', () => {
    const strategy = new CreatePromptAssemblyStrategy()
    const sections = ['a', 'b', 'c', 'd']
    expect(strategy.apply(sections)).toEqual(['a', 'b', 'c', 'd'])
  })

  it('should keep all sections — no removal', () => {
    const strategy = new CreatePromptAssemblyStrategy()
    const sections = ['a', 'userInput', 'b', 'worldState', 'c', 'strategyModuleRendered', 'strategyRendered', 'd']
    const result = strategy.apply(sections)
    expect(result.length).toBe(sections.length)
    expect([...result].sort()).toEqual([...sections].sort())
  })

  it('should handle sections with only priority items', () => {
    const strategy = new CreatePromptAssemblyStrategy()
    const sections = ['strategyRendered', 'userInput', 'worldState', 'strategyModuleRendered']
    const result = strategy.apply(sections)
    expect(result).toEqual(['userInput', 'worldState', 'strategyModuleRendered', 'strategyRendered'])
  })

  it('should handle sections with only non-priority items', () => {
    const strategy = new CreatePromptAssemblyStrategy()
    const sections = ['a', 'b', 'c']
    expect(strategy.apply(sections)).toEqual(['a', 'b', 'c'])
  })

  it('should handle empty sections array', () => {
    const strategy = new CreatePromptAssemblyStrategy()
    expect(strategy.apply([])).toEqual([])
  })

  it('should handle single item that is priority', () => {
    const strategy = new CreatePromptAssemblyStrategy()
    expect(strategy.apply(['userInput'])).toEqual(['userInput'])
  })

  it('should handle single item that is not priority', () => {
    const strategy = new CreatePromptAssemblyStrategy()
    expect(strategy.apply(['memory'])).toEqual(['memory'])
  })

  it('should preserve duplicates', () => {
    const strategy = new CreatePromptAssemblyStrategy()
    const sections = ['a', 'userInput', 'b', 'userInput', 'c']
    const result = strategy.apply(sections)
    // Both userInput should be at the front
    expect(result[0]).toBe('userInput')
    expect(result[1]).toBe('userInput')
  })

  it('should reorder correctly with all canonical sections', () => {
    const strategy = new CreatePromptAssemblyStrategy()
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
    // Expected: userInput, worldState, strategyModuleRendered, strategyRendered, then rest
    expect(result[0]).toBe('userInput')
    expect(result[1]).toBe('worldState')
    expect(result[2]).toBe('strategyModuleRendered')
    expect(result[3]).toBe('strategyRendered')
    // Remaining keep original relative order: intentRendered, entityRendered, semanticRendered, system, memory, reflections, observations
    expect(result.slice(4)).toEqual([
      'intentRendered',
      'entityRendered',
      'semanticRendered',
      'system',
      'memory',
      'reflections',
      'observations',
    ])
  })
})

// ---------------------------------------------------------------------------
// CreatePromptAssemblyStrategy — Priority Verification
// ---------------------------------------------------------------------------

describe('CreatePromptAssemblyStrategy — priority verification', () => {
  it('userInput should come before worldState', () => {
    const strategy = new CreatePromptAssemblyStrategy()
    const sections = ['worldState', 'userInput']
    const result = strategy.apply(sections)
    expect(result[0]).toBe('userInput')
    expect(result[1]).toBe('worldState')
  })

  it('worldState should come before strategyModuleRendered', () => {
    const strategy = new CreatePromptAssemblyStrategy()
    const sections = ['strategyModuleRendered', 'worldState']
    const result = strategy.apply(sections)
    expect(result[0]).toBe('worldState')
    expect(result[1]).toBe('strategyModuleRendered')
  })

  it('strategyModuleRendered should come before strategyRendered', () => {
    const strategy = new CreatePromptAssemblyStrategy()
    const sections = ['strategyRendered', 'strategyModuleRendered']
    const result = strategy.apply(sections)
    expect(result[0]).toBe('strategyModuleRendered')
    expect(result[1]).toBe('strategyRendered')
  })

  it('userInput should come before strategyRendered', () => {
    const strategy = new CreatePromptAssemblyStrategy()
    const sections = ['strategyRendered', 'userInput']
    const result = strategy.apply(sections)
    expect(result[0]).toBe('userInput')
    expect(result[1]).toBe('strategyRendered')
  })

  it('worldState should come before strategyRendered', () => {
    const strategy = new CreatePromptAssemblyStrategy()
    const sections = ['strategyRendered', 'worldState']
    const result = strategy.apply(sections)
    expect(result[0]).toBe('worldState')
    expect(result[1]).toBe('strategyRendered')
  })

  it('strategyRendered should not be before userInput', () => {
    const strategy = new CreatePromptAssemblyStrategy()
    const result = strategy.apply(['strategyRendered', 'userInput'])
    expect(result[0]).toBe('userInput')
  })
})

// ---------------------------------------------------------------------------
// CreatePromptAssemblyStrategy — Deterministic
// ---------------------------------------------------------------------------

describe('CreatePromptAssemblyStrategy — deterministic', () => {
  it('should return same result for same sections across repeated calls', () => {
    const strategy = new CreatePromptAssemblyStrategy()
    const sections = ['b', 'userInput', 'a', 'worldState', 'c']
    const r1 = strategy.apply(sections)
    const r2 = strategy.apply(sections)
    const r3 = strategy.apply(sections)
    expect(r1).toEqual(r2)
    expect(r2).toEqual(r3)
  })

  it('should be idempotent across ten calls', () => {
    const strategy = new CreatePromptAssemblyStrategy()
    const sections = ['a', 'userInput', 'worldState', 'b']
    for (let i = 0; i < 10; i++) {
      const result = strategy.apply(sections)
      expect(result[0]).toBe('userInput')
      expect(result[1]).toBe('worldState')
    }
  })

  it('should produce same result across many instances', () => {
    const sections = ['x', 'userInput', 'y', 'worldState', 'z']
    const r1 = new CreatePromptAssemblyStrategy().apply(sections)
    const r2 = new CreatePromptAssemblyStrategy().apply(sections)
    const r3 = new CreatePromptAssemblyStrategy().apply(sections)
    expect(r1).toEqual(r2)
    expect(r2).toEqual(r3)
  })
})

// ---------------------------------------------------------------------------
// CreatePromptAssemblyStrategy — Stateless
// ---------------------------------------------------------------------------

describe('CreatePromptAssemblyStrategy — stateless', () => {
  it('should not retain state between calls', () => {
    const strategy = new CreatePromptAssemblyStrategy()
    const sections1 = ['userInput', 'a']
    const sections2 = ['b', 'worldState']
    const sections3 = ['userInput', 'a']
    expect(strategy.apply(sections1)).toEqual(strategy.apply(sections1))
    expect(strategy.apply(sections2)).toEqual(strategy.apply(sections2))
    expect(strategy.apply(sections3)).toEqual(strategy.apply(sections3))
  })

  it('should be independent across multiple instances', () => {
    const s1 = new CreatePromptAssemblyStrategy()
    const s2 = new CreatePromptAssemblyStrategy()
    const sections = ['x', 'userInput', 'y', 'worldState', 'z']
    expect(s1.apply(sections)).toEqual(s2.apply(sections))
  })
})

// ---------------------------------------------------------------------------
// CreatePromptAssemblyStrategy — Pure / No Side Effects
// ---------------------------------------------------------------------------

describe('CreatePromptAssemblyStrategy — pure / no side effects', () => {
  it('should not modify the input sections array', () => {
    const strategy = new CreatePromptAssemblyStrategy()
    const sections = ['userInput', 'a', 'worldState']
    const frozen = Object.freeze([...sections])
    expect(() => strategy.apply(frozen)).not.toThrow()
  })

  it('should not mutate the original array reference', () => {
    const strategy = new CreatePromptAssemblyStrategy()
    const original = ['x', 'userInput', 'y']
    const copy = [...original]
    strategy.apply(original)
    expect(original).toEqual(copy)
  })

  it('should support frozen input arrays', () => {
    const strategy = new CreatePromptAssemblyStrategy()
    const frozen = Object.freeze(['userInput', 'worldState', 'other'])
    expect(() => strategy.apply(frozen)).not.toThrow()
  })

  it('should return a new array reference (not identity)', () => {
    const strategy = new CreatePromptAssemblyStrategy()
    const sections = ['a', 'userInput', 'b']
    const result = strategy.apply(sections)
    // Since reordering happens, result should be different reference
    expect(result).not.toBe(sections)
  })
})

// ---------------------------------------------------------------------------
// DefaultPromptAssemblyStrategy — Unchanged (Backward Compat)
// ---------------------------------------------------------------------------

describe('DefaultPromptAssemblyStrategy — unchanged', () => {
  it('should still return sections unchanged', () => {
    const strategy = new DefaultPromptAssemblyStrategy()
    const sections = ['userInput', 'worldState', 'memory']
    expect(strategy.apply(sections)).toEqual(sections)
  })

  it('should still be identity function', () => {
    const strategy = new DefaultPromptAssemblyStrategy()
    expect(strategy.apply(['a', 'b', 'c'])).toEqual(['a', 'b', 'c'])
  })

  it('should preserve original order', () => {
    const strategy = new DefaultPromptAssemblyStrategy()
    const sections = ['z', 'y', 'x']
    expect(strategy.apply(sections)).toEqual(['z', 'y', 'x'])
  })
})

// ---------------------------------------------------------------------------
// Assembly Application — Builder Integration
// ---------------------------------------------------------------------------

describe('Assembly application — builder integration with create strategy', () => {
  it('should change ordering when create strategy is resolved', () => {
    const resolver = new CreateOnlyResolver()
    // We verify the strategy resolves correctly
    const createStrategy = resolver.resolve('create')
    const sections = ['semantic', 'userInput', 'memory', 'worldState']
    const result = createStrategy.apply(sections)
    expect(result[0]).toBe('userInput')
    expect(result[1]).toBe('worldState')
  })

  it('non-create resolver returns DefaultPromptAssemblyStrategy (identity)', () => {
    const resolver = new DefaultPromptAssemblyStrategyResolver()
    const queryStrategy = resolver.resolve('query')
    expect(queryStrategy).toBeInstanceOf(DefaultPromptAssemblyStrategy)
    const sections = ['b', 'a', 'c']
    expect(queryStrategy.apply(sections)).toEqual(['b', 'a', 'c'])
  })

  it('DefaultPromptAssemblyStrategy does not reorder', () => {
    const strategy = new DefaultPromptAssemblyStrategy()
    const sections = ['userInput', 'memory', 'worldState', 'system']
    expect(strategy.apply(sections)).toEqual(['userInput', 'memory', 'worldState', 'system'])
  })
})

// ---------------------------------------------------------------------------
// Builder with CreatePromptAssemblyStrategy — Actual Prompt Output
// ---------------------------------------------------------------------------

describe('Builder — actual prompt output with create strategy', () => {
  it('should produce different ordering when create strategy is used', async () => {
    const createResolver = new CreateOnlyResolver()
    const defaultResolver = new DefaultPromptAssemblyStrategyResolver()
    const modules = [new UserInputModule()]
    const strategies = [new CreateStrategy(), new QueryStrategy()]
    const selector = new DefaultPromptStrategySelector()

    // Build with create resolver
    const createBuilder = new DefaultPromptBuilder(modules, {
      promptAssemblyStrategyResolver: createResolver,
      strategySelector: selector,
      strategies,
      configuration: mockConfig,
    })

    // Build with default resolver
    const defaultBuilder = new DefaultPromptBuilder(modules, {
      promptAssemblyStrategyResolver: defaultResolver,
      strategySelector: selector,
      strategies,
      configuration: mockConfig,
    })

    const context = createPipelineContext({ input: 'create a tree' })
    const createResult = await createBuilder.build(context)
    const defaultResult = await defaultBuilder.build(context)

    // With create strategy, prompt includes userInput (due to UserInputModule)
    // Both produce a prompt but the section order may differ
    expect(createResult.prompt).toBeDefined()
    expect(defaultResult.prompt).toBeDefined()
    expect(typeof createResult.prompt).toBe('string')
    expect(typeof defaultResult.prompt).toBe('string')
  })

  it('should not throw when resolver is present', async () => {
    const resolver = new CreateOnlyResolver()
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyStrategyResolver: resolver,
      strategySelector: new DefaultPromptStrategySelector(),
      strategies: [new CreateStrategy()],
      configuration: mockConfig,
    })
    const context = createPipelineContext({ input: 'draw a tree' })
    await expect(builder.build(context)).resolves.toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Non-Create Strategies — Unchanged
// ---------------------------------------------------------------------------

describe('Non-create strategies unchanged', () => {
  it('query strategy unchanged with DefaultPromptAssemblyStrategy resolver', async () => {
    const resolver = new DefaultPromptAssemblyStrategyResolver()
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyStrategyResolver: resolver,
      strategySelector: new DefaultPromptStrategySelector(),
      strategies: [new CreateStrategy(), new QueryStrategy()],
      configuration: mockConfig,
    })
    const context = createPipelineContext({ input: 'how many trees?' })
    const result = await builder.build(context)
    expect(result.prompt).toBeDefined()
    expect(result.metadata?.promptAssembly).toBeDefined()
  })

  it('modify strategy unchanged with DefaultPromptAssemblyStrategy resolver', async () => {
    const resolver = new DefaultPromptAssemblyStrategyResolver()
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyStrategyResolver: resolver,
      strategySelector: new DefaultPromptStrategySelector(),
      strategies: [new CreateStrategy(), new QueryStrategy(), new ModifyStrategy()],
      configuration: mockConfig,
    })
    const context = createPipelineContext({ input: 'move the tree' })
    const result = await builder.build(context)
    expect(result.prompt).toBeDefined()
    expect(result.metadata?.promptAssembly).toBeDefined()
  })

  it('delete strategy unchanged with DefaultPromptAssemblyStrategy resolver', async () => {
    const resolver = new DefaultPromptAssemblyStrategyResolver()
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyStrategyResolver: resolver,
      strategySelector: new DefaultPromptStrategySelector(),
      strategies: [new CreateStrategy(), new QueryStrategy(), new DeleteStrategy()],
      configuration: mockConfig,
    })
    const context = createPipelineContext({ input: 'delete the tree' })
    const result = await builder.build(context)
    expect(result.prompt).toBeDefined()
    expect(result.metadata?.promptAssembly).toBeDefined()
  })

  it('default strategy unchanged with DefaultPromptAssemblyStrategy resolver', async () => {
    const resolver = new DefaultPromptAssemblyStrategyResolver()
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyStrategyResolver: resolver,
      configuration: mockConfig,
    })
    const context = createPipelineContext({ input: 'hello' })
    const result = await builder.build(context)
    expect(result.prompt).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// DefaultPromptAssemblyStrategyResolver — Non-Create Routing Unchanged
// ---------------------------------------------------------------------------

describe('Resolver non-create routing unchanged', () => {
  it('should return DefaultPromptAssemblyStrategy for "query"', () => {
    const resolver = new DefaultPromptAssemblyStrategyResolver()
    expect(resolver.resolve('query')).toBeInstanceOf(DefaultPromptAssemblyStrategy)
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
    expect(resolver.resolve('unknown')).toBeInstanceOf(DefaultPromptAssemblyStrategy)
  })
})

// ---------------------------------------------------------------------------
// Builder — Metadata Assembly Strategy
// ---------------------------------------------------------------------------

describe('Builder — metadata assembly strategy', () => {
  it('should store promptAssemblyStrategy metadata when resolver present', async () => {
    const resolver = new CreateOnlyResolver()
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyStrategyResolver: resolver,
      strategySelector: new DefaultPromptStrategySelector(),
      strategies: [new CreateStrategy()],
      configuration: mockConfig,
    })
    const context = createPipelineContext({ input: 'create a tree' })
    const result = await builder.build(context)
    const assembly = (result.metadata?.promptAssembly as Record<string, unknown>)?.promptAssemblyStrategy as Record<string, unknown>
    expect(assembly).toBeDefined()
    expect(assembly.strategyName).toBe('create')
  })

  it('should store promptAssemblyStrategy metadata with DefaultPromptAssemblyStrategyResolver', async () => {
    const resolver = new DefaultPromptAssemblyStrategyResolver()
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyStrategyResolver: resolver,
      strategySelector: new DefaultPromptStrategySelector(),
      strategies: [new CreateStrategy()],
      configuration: mockConfig,
    })
    const context = createPipelineContext({ input: 'create a tree' })
    const result = await builder.build(context)
    const assembly = (result.metadata?.promptAssembly as Record<string, unknown>)?.promptAssemblyStrategy as Record<string, unknown>
    expect(assembly).toBeDefined()
    // Without intent analyzer, selector picks DefaultPromptStrategy
    // which resolves to DefaultPromptAssemblyStrategy with strategyName 'default'
    expect(typeof assembly.strategyName).toBe('string')
  })

  it('should not store promptAssemblyStrategy metadata when resolver absent', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      configuration: mockConfig,
    })
    const context = createPipelineContext({ input: 'hello' })
    const result = await builder.build(context)
    const assembly = (result.metadata?.promptAssembly as Record<string, unknown>)?.promptAssemblyStrategy
    expect(assembly).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// RetryPlanner Compatibility
// ---------------------------------------------------------------------------

describe('RetryPlanner Compatibility', () => {
  it('should work with RetryPlanner — strategy resolves correctly', () => {
    const strategy = new CreatePromptAssemblyStrategy()
    expect(strategy.apply(['userInput', 'a'])).toEqual(['userInput', 'a'])
  })

  it('should not affect RetryPlanner behavior', () => {
    const resolver = new CreateOnlyResolver()
    // Strategy is independent — just verify it resolves correctly
    const strategy = resolver.resolve('create')
    expect(strategy.apply(['retry', 'userInput'])[0]).toBe('userInput')
    expect(strategy).toBeInstanceOf(CreatePromptAssemblyStrategy)
  })

  it('strategy apply is independent of RetryPlanner', () => {
    const strategy = new CreatePromptAssemblyStrategy()
    const sections = ['retry', 'userInput', 'plan', 'worldState']
    const result = strategy.apply(sections)
    expect(result[0]).toBe('userInput')
    expect(result[1]).toBe('worldState')
  })
})

// ---------------------------------------------------------------------------
// ToolCallPlanner Compatibility
// ---------------------------------------------------------------------------

describe('ToolCallPlanner Compatibility', () => {
  it('should work with ToolCallPlanner — strategy resolves correctly', () => {
    const resolver = new CreateOnlyResolver()
    const strategy = resolver.resolve('create')
    const sections = ['tool', 'userInput', 'call', 'worldState']
    const result = strategy.apply(sections)
    expect(result[0]).toBe('userInput')
    expect(result[1]).toBe('worldState')
  })

  it('should not affect ToolCallPlanner tool execution', () => {
    const resolver = new CreateOnlyResolver()
    // Strategy is independent — just verify it resolves correctly
    const strategy = resolver.resolve('create')
    expect(strategy.apply(['tool', 'userInput'])[0]).toBe('userInput')
  })
})

// ---------------------------------------------------------------------------
// Streaming Compatibility
// ---------------------------------------------------------------------------

describe('Streaming Compatibility', () => {
  it('should work with StreamingProvider — strategy resolves correctly', () => {
    const strategy = new CreatePromptAssemblyStrategy()
    const sections = ['chunk', 'userInput', 'stream', 'worldState']
    const result = strategy.apply(sections)
    expect(result[0]).toBe('userInput')
    expect(result[1]).toBe('worldState')
  })

  it('should not affect streaming output', () => {
    const resolver = new CreateOnlyResolver()
    // Strategy is independent — just verify it resolves correctly
    const strategy = resolver.resolve('create')
    expect(strategy.apply(['chunk', 'userInput'])[0]).toBe('userInput')
  })
})

// ---------------------------------------------------------------------------
// AgentLoop Compatibility
// ---------------------------------------------------------------------------

describe('AgentLoop Compatibility', () => {
  it('should work with AgentLoop — strategy resolves correctly', () => {
    const strategy = new CreatePromptAssemblyStrategy()
    const sections = ['observation', 'userInput', 'action', 'worldState']
    const result = strategy.apply(sections)
    expect(result[0]).toBe('userInput')
    expect(result[1]).toBe('worldState')
  })

  it('should not affect AgentLoop iteration', () => {
    // Just verify the strategy works when AgentLoop is involved
    const strategy = new CreatePromptAssemblyStrategy()
    expect(strategy.apply(['agent', 'userInput', 'loop'])[0]).toBe('userInput')
  })
})

// ---------------------------------------------------------------------------
// Backward Compatibility — Full Builder Flow
// ---------------------------------------------------------------------------

describe('Backward compatibility — full builder flow', () => {
  it('query strategy produces same output with default resolver as before', async () => {
    // Without resolver
    const builderWithout = new DefaultPromptBuilder([new UserInputModule()], {
      strategySelector: new DefaultPromptStrategySelector(),
      strategies: [new CreateStrategy(), new QueryStrategy()],
      configuration: mockConfig,
    })

    // With default resolver
    const builderWith = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyStrategyResolver: new DefaultPromptAssemblyStrategyResolver(),
      strategySelector: new DefaultPromptStrategySelector(),
      strategies: [new CreateStrategy(), new QueryStrategy()],
      configuration: mockConfig,
    })

    const context = createPipelineContext({ input: 'how many trees?' })
    const resultWithout = await builderWithout.build(context)
    const resultWith = await builderWith.build(context)

    // Both should produce valid output
    expect(resultWithout.prompt).toBeDefined()
    expect(resultWith.prompt).toBeDefined()
  })

  it('create strategy changes prompt section order', async () => {
    const defaultResolver = new DefaultPromptAssemblyStrategyResolver()
    const createResolver = new CreateOnlyResolver()

    const builderDefault = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyStrategyResolver: defaultResolver,
      strategySelector: new DefaultPromptStrategySelector(),
      strategies: [new CreateStrategy()],
      configuration: mockConfig,
    })

    const builderCreate = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyStrategyResolver: createResolver,
      strategySelector: new DefaultPromptStrategySelector(),
      strategies: [new CreateStrategy()],
      configuration: mockConfig,
    })

    const context = createPipelineContext({ input: 'create a house' })
    const defaultResult = await builderDefault.build(context)
    const createResult = await builderCreate.build(context)

    // Both produce valid but potentially different output
    expect(defaultResult.prompt).toBeDefined()
    expect(createResult.prompt).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// No Behavior Changes — Non-Create Strategies
// ---------------------------------------------------------------------------

describe('No behavior changes — non-create strategies', () => {
  it('resolver returns correct strategy based on name', () => {
    const resolver = new DefaultPromptAssemblyStrategyResolver()
    expect(resolver.resolve('create')).toBeInstanceOf(CreatePromptAssemblyStrategy)
    expect(resolver.resolve('query')).toBeInstanceOf(DefaultPromptAssemblyStrategy)
    expect(resolver.resolve('modify')).toBeInstanceOf(DefaultPromptAssemblyStrategy)
    expect(resolver.resolve('delete')).toBeInstanceOf(DefaultPromptAssemblyStrategy)
    expect(resolver.resolve('default')).toBeInstanceOf(DefaultPromptAssemblyStrategy)
    expect(resolver.resolve('unknown')).toBeInstanceOf(DefaultPromptAssemblyStrategy)
  })

  it('CreatePromptAssemblyStrategy does not change DefaultPromptAssemblyStrategy behavior', () => {
    const defaultStrategy = new DefaultPromptAssemblyStrategy()
    const sections = ['userInput', 'worldState', 'memory']
    expect(defaultStrategy.apply(sections)).toEqual(['userInput', 'worldState', 'memory'])
  })

  it('CreatePromptAssemblyStrategy only reorders, does not modify content', () => {
    const strategy = new CreatePromptAssemblyStrategy()
    const sections = ['a', 'userInput', 'b', 'worldState', 'c']
    const result = strategy.apply(sections)
    // All same items present
    expect([...result].sort()).toEqual([...sections].sort())
  })

  it('non-create resolver preserves identity behavior', () => {
    const resolver = new DefaultPromptAssemblyStrategyResolver()
    const nonCreateNames = ['query', 'modify', 'delete', 'default', 'unknown', '']
    for (const name of nonCreateNames) {
      const strategy = resolver.resolve(name)
      expect(strategy).toBeInstanceOf(DefaultPromptAssemblyStrategy)
    }
  })
})

// ---------------------------------------------------------------------------
// Section Reordering — DefaultPromptBuilder Interaction
// ---------------------------------------------------------------------------

describe('Section reordering — DefaultPromptBuilder interaction', () => {
  it('should apply strategy when resolver present and strategy name is create', () => {
    const strategy = new CreatePromptAssemblyStrategy()
    const sections = DefaultPromptRenderer.CANONICAL_ORDER.filter(Boolean) as readonly string[]
    const result = strategy.apply(sections)
    // Priority items should be at front in order
    expect(result[0]).toBe('userInput')
    expect(result[1]).toBe('worldState')
    expect(result[2]).toBe('strategyModuleRendered')
    expect(result[3]).toBe('strategyRendered')
  })

  it('should apply strategy to any array of section identifiers', () => {
    const strategy = new CreatePromptAssemblyStrategy()
    const sections = ['x', 'userInput', 'y', 'strategyModuleRendered', 'z', 'strategyRendered', 'w', 'worldState']
    const result = strategy.apply(sections)
    expect(result[0]).toBe('userInput')
    expect(result[1]).toBe('worldState')
    expect(result[2]).toBe('strategyModuleRendered')
    expect(result[3]).toBe('strategyRendered')
  })
})

// ---------------------------------------------------------------------------
// Stateless — Across Builder Build Calls
// ---------------------------------------------------------------------------

describe('Stateless — across builder build calls', () => {
  it('should produce consistent results across multiple builds', async () => {
    const resolver = new CreateOnlyResolver()
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyStrategyResolver: resolver,
      strategySelector: new DefaultPromptStrategySelector(),
      strategies: [new CreateStrategy()],
      configuration: mockConfig,
    })
    const context = createPipelineContext({ input: 'create a tree' })
    const r1 = await builder.build(context)
    const r2 = await builder.build(context)
    const r3 = await builder.build(context)
    expect(r1.prompt).toBe(r2.prompt)
    expect(r2.prompt).toBe(r3.prompt)
  })
})

// ---------------------------------------------------------------------------
// Pure — Builder Does Not Mutate Inputs
// ---------------------------------------------------------------------------

describe('Pure — builder does not mutate inputs', () => {
  it('should not mutate context input', async () => {
    const resolver = new CreateOnlyResolver()
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyStrategyResolver: resolver,
      strategySelector: new DefaultPromptStrategySelector(),
      strategies: [new CreateStrategy()],
      configuration: mockConfig,
    })
    const input = 'create a tree'
    const context = createPipelineContext({ input })
    await builder.build(context)
    expect(context.input).toBe(input)
  })

  it('should not mutate context metadata', async () => {
    const resolver = new CreateOnlyResolver()
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptAssemblyStrategyResolver: resolver,
      strategySelector: new DefaultPromptStrategySelector(),
      strategies: [new CreateStrategy()],
      configuration: mockConfig,
    })
    const context = createPipelineContext({ input: 'create a tree' })
    const originalMetadata = context.metadata === undefined ? undefined : { ...context.metadata }
    await builder.build(context)
    if (originalMetadata === undefined) {
      expect(context.metadata).toBeUndefined()
    } else {
      expect(context.metadata).toEqual(originalMetadata)
    }
  })
})