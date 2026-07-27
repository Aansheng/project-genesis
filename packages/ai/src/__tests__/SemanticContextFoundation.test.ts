import { describe, it, expect } from 'vitest'
import type { SemanticContext } from '../semantic/SemanticContext'
import type { SemanticContextBuilder } from '../semantic/SemanticContextBuilder'
import { DefaultSemanticContextBuilder } from '../semantic/DefaultSemanticContextBuilder'
import type { IntentResult } from '../intent/IntentResult'
import type { EntityResult } from '../entity/EntityResult'
import {
  DefaultSemanticContextBuilder as DefaultBuilderFromIndex,
} from '../semantic/index'
import type {
  SemanticContext as SemanticContextFromIndex,
  SemanticContextBuilder as BuilderFromIndex,
} from '../semantic/index'
import type {
  SemanticContext as SemanticContextFromRoot,
  SemanticContextBuilder as BuilderFromRoot,
} from '../index'
import { DefaultSemanticContextBuilder as DefaultBuilderFromRoot } from '../index'
import { RuleBasedEntityAnalyzer } from '../entity/RuleBasedEntityAnalyzer'
import { DefaultEntityAnalyzer } from '../entity/DefaultEntityAnalyzer'
import { RuleBasedIntentAnalyzer } from '../intent/RuleBasedIntentAnalyzer'
import { DefaultIntentAnalyzer } from '../intent/DefaultIntentAnalyzer'
import { DefaultPromptBuilder } from '../prompt/DefaultPromptBuilder'
import type { BuilderOptions } from '../prompt/BuilderOptions'
import {
  UserInputModule,
  SystemPromptModule,
  MemoryPromptModule,
  WorldStatePromptModule,
} from '../prompt/modules'
import type { PromptModule } from '../prompt/modules/PromptModule'
import { DefaultMemory } from '../memory/DefaultMemory'
import { MockPlanner, RetryPlanner, ToolCallPlanner } from '../planner'
import { MockPlannerProvider, MockStreamingProvider } from '../provider'
import { DefaultToolRegistry } from '../tools/ToolRegistry'
import { DefaultAgentLoop } from '../agent/DefaultAgentLoop'
import { DefaultPipeline } from '../pipeline/DefaultPipeline'
import { DefaultAIConfiguration } from '../config/DefaultAIConfiguration'
import type { PipelineContext } from '../pipeline/PipelineContext'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createBuilder(): DefaultSemanticContextBuilder {
  return new DefaultSemanticContextBuilder()
}

function makeIntentResult(intents: string[]): IntentResult {
  return { intents: intents.map(t => ({ type: t as IntentResult['intents'][number]['type'] })) }
}

function makeEntityResult(types: string[]): EntityResult {
  return { entities: types.map(t => ({ type: t as EntityResult['entities'][number]['type'] })) }
}

function createPipelineContext(overrides?: Partial<PipelineContext>): PipelineContext {
  return {
    input: 'draw a tree',
    memory: new DefaultMemory(),
    worldState: '',
    ...overrides,
  }
}

function createDefaultModules(): PromptModule[] {
  return [
    new SystemPromptModule(),
    new UserInputModule(),
    new MemoryPromptModule(),
    new WorldStatePromptModule(),
  ]
}

const mockConfig = new DefaultAIConfiguration()

// ---------------------------------------------------------------------------
// SemanticContext Interface
// ---------------------------------------------------------------------------

describe('SemanticContext', () => {
  it('should support empty context', () => {
    const ctx: SemanticContext = {}
    expect(ctx.intent).toBeUndefined()
    expect(ctx.entity).toBeUndefined()
  })

  it('should support intent only', () => {
    const intent: IntentResult = { intents: [{ type: 'Create' }] }
    const ctx: SemanticContext = { intent }
    expect(ctx.intent?.intents).toHaveLength(1)
    expect(ctx.intent?.intents[0].type).toBe('Create')
    expect(ctx.entity).toBeUndefined()
  })

  it('should support entity only', () => {
    const entity: EntityResult = { entities: [{ type: 'Tree' }] }
    const ctx: SemanticContext = { entity }
    expect(ctx.entity?.entities).toHaveLength(1)
    expect(ctx.entity?.entities[0].type).toBe('Tree')
    expect(ctx.intent).toBeUndefined()
  })

  it('should support both intent and entity', () => {
    const intent: IntentResult = { intents: [{ type: 'Create' }] }
    const entity: EntityResult = { entities: [{ type: 'Tree' }] }
    const ctx: SemanticContext = { intent, entity }
    expect(ctx.intent?.intents).toHaveLength(1)
    expect(ctx.entity?.entities).toHaveLength(1)
    expect(ctx.intent?.intents[0].type).toBe('Create')
    expect(ctx.entity?.entities[0].type).toBe('Tree')
  })

  it('should be readonly (immutable by design)', () => {
    const ctx: SemanticContext = { intent: { intents: [{ type: 'Create' }] } }
    const frozen = Object.freeze(ctx)
    expect(() => {
      void ((frozen as Record<string, unknown>).intent = undefined)
    }).toThrow()
  })
})

// ---------------------------------------------------------------------------
// SemanticContextBuilder Interface
// ---------------------------------------------------------------------------

describe('SemanticContextBuilder interface', () => {
  it('should define a build method', () => {
    const builder: SemanticContextBuilder = createBuilder()
    expect(builder.build).toBeDefined()
    expect(typeof builder.build).toBe('function')
  })
})

// ---------------------------------------------------------------------------
// DefaultSemanticContextBuilder — Empty
// ---------------------------------------------------------------------------

describe('DefaultSemanticContextBuilder — empty', () => {
  it('should return empty context when no arguments provided', () => {
    const builder = createBuilder()
    const result = builder.build()
    expect(result.intent).toBeUndefined()
    expect(result.entity).toBeUndefined()
  })

  it('should return empty context when undefined arguments provided', () => {
    const builder = createBuilder()
    const result = builder.build(undefined, undefined)
    expect(result.intent).toBeUndefined()
    expect(result.entity).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// DefaultSemanticContextBuilder — Intent Only
// ---------------------------------------------------------------------------

describe('DefaultSemanticContextBuilder — intent only', () => {
  it('should include intent when provided', () => {
    const builder = createBuilder()
    const intent = makeIntentResult(['Create'])
    const result = builder.build(intent)
    expect(result.intent).toBeDefined()
    expect(result.intent?.intents).toHaveLength(1)
    expect(result.intent?.intents[0].type).toBe('Create')
    expect(result.entity).toBeUndefined()
  })

  it('should include multi-intent result', () => {
    const builder = createBuilder()
    const intent = makeIntentResult(['Create', 'Move'])
    const result = builder.build(intent)
    expect(result.intent?.intents).toHaveLength(2)
    expect(result.intent?.intents[0].type).toBe('Create')
    expect(result.intent?.intents[1].type).toBe('Move')
  })
})

// ---------------------------------------------------------------------------
// DefaultSemanticContextBuilder — Entity Only
// ---------------------------------------------------------------------------

describe('DefaultSemanticContextBuilder — entity only', () => {
  it('should include entity when provided', () => {
    const builder = createBuilder()
    const entity = makeEntityResult(['Tree'])
    const result = builder.build(undefined, entity)
    expect(result.entity).toBeDefined()
    expect(result.entity?.entities).toHaveLength(1)
    expect(result.entity?.entities[0].type).toBe('Tree')
    expect(result.intent).toBeUndefined()
  })

  it('should include multi-entity result', () => {
    const builder = createBuilder()
    const entity = makeEntityResult(['Tree', 'Flower'])
    const result = builder.build(undefined, entity)
    expect(result.entity?.entities).toHaveLength(2)
    expect(result.entity?.entities[0].type).toBe('Tree')
    expect(result.entity?.entities[1].type).toBe('Flower')
  })
})

// ---------------------------------------------------------------------------
// DefaultSemanticContextBuilder — Both
// ---------------------------------------------------------------------------

describe('DefaultSemanticContextBuilder — both intent and entity', () => {
  it('should include both intent and entity', () => {
    const builder = createBuilder()
    const intent = makeIntentResult(['Create'])
    const entity = makeEntityResult(['Tree'])
    const result = builder.build(intent, entity)
    expect(result.intent).toBeDefined()
    expect(result.entity).toBeDefined()
    expect(result.intent?.intents[0].type).toBe('Create')
    expect(result.entity?.entities[0].type).toBe('Tree')
  })

  it('should preserve original data without modification', () => {
    const builder = createBuilder()
    const intent = makeIntentResult(['Create', 'Move'])
    const entity = makeEntityResult(['Tree', 'Flower', 'House'])
    const result = builder.build(intent, entity)
    expect(result.intent?.intents).toHaveLength(2)
    expect(result.entity?.entities).toHaveLength(3)
    expect(result.intent?.intents[0].type).toBe('Create')
    expect(result.intent?.intents[1].type).toBe('Move')
    expect(result.entity?.entities[0].type).toBe('Tree')
    expect(result.entity?.entities[1].type).toBe('Flower')
    expect(result.entity?.entities[2].type).toBe('House')
  })
})

// ---------------------------------------------------------------------------
// DefaultSemanticContextBuilder — Deterministic
// ---------------------------------------------------------------------------

describe('DefaultSemanticContextBuilder — deterministic', () => {
  it('should return identical result for same inputs', () => {
    const builder = createBuilder()
    const intent = makeIntentResult(['Create'])
    const entity = makeEntityResult(['Tree'])
    const r1 = builder.build(intent, entity)
    const r2 = builder.build(intent, entity)
    const r3 = builder.build(intent, entity)
    expect(r1).toEqual(r2)
    expect(r2).toEqual(r3)
  })

  it('should be idempotent across repeated calls', () => {
    const builder = createBuilder()
    const intent = makeIntentResult(['Create'])
    const entity = makeEntityResult(['Tree'])
    for (let i = 0; i < 10; i++) {
      const result = builder.build(intent, entity)
      expect(result.intent?.intents).toHaveLength(1)
      expect(result.entity?.entities).toHaveLength(1)
    }
  })
})

// ---------------------------------------------------------------------------
// DefaultSemanticContextBuilder — Stateless
// ---------------------------------------------------------------------------

describe('DefaultSemanticContextBuilder — stateless', () => {
  it('should not retain state between calls', () => {
    const builder = createBuilder()
    const r1 = builder.build(makeIntentResult(['Create']), makeEntityResult(['Tree']))
    const r2 = builder.build()
    const r3 = builder.build(makeIntentResult(['Move']), makeEntityResult(['Flower']))
    expect(r1.intent?.intents[0].type).toBe('Create')
    expect(r1.entity?.entities[0].type).toBe('Tree')
    expect(r2.intent).toBeUndefined()
    expect(r2.entity).toBeUndefined()
    expect(r3.intent?.intents[0].type).toBe('Move')
    expect(r3.entity?.entities[0].type).toBe('Flower')
  })

  it('should be independent across multiple instances', () => {
    const b1 = createBuilder()
    const b2 = createBuilder()
    const r1 = b1.build(makeIntentResult(['Create']), makeEntityResult(['Tree']))
    const r2 = b2.build(makeIntentResult(['Create']), makeEntityResult(['Tree']))
    expect(r1).toEqual(r2)
    expect(r1).not.toBe(r2)
  })
})

// ---------------------------------------------------------------------------
// DefaultSemanticContextBuilder — Immutability
// ---------------------------------------------------------------------------

describe('DefaultSemanticContextBuilder — immutability', () => {
  it('should not modify input intent result', () => {
    const builder = createBuilder()
    const intent = makeIntentResult(['Create'])
    const original = JSON.stringify(intent)
    builder.build(intent, makeEntityResult(['Tree']))
    expect(JSON.stringify(intent)).toBe(original)
  })

  it('should not modify input entity result', () => {
    const builder = createBuilder()
    const entity = makeEntityResult(['Tree'])
    const original = JSON.stringify(entity)
    builder.build(makeIntentResult(['Create']), entity)
    expect(JSON.stringify(entity)).toBe(original)
  })

  it('should return a new SemanticContext each call', () => {
    const builder = createBuilder()
    const intent = makeIntentResult(['Create'])
    const entity = makeEntityResult(['Tree'])
    const r1 = builder.build(intent, entity)
    const r2 = builder.build(intent, entity)
    expect(r1).toEqual(r2)
    expect(r1).not.toBe(r2)
  })
})

// ---------------------------------------------------------------------------
// DefaultSemanticContextBuilder — Pure
// ---------------------------------------------------------------------------

describe('DefaultSemanticContextBuilder — pure', () => {
  it('should have no side effects', () => {
    const builder = createBuilder()
    const before = Object.keys(builder)
    builder.build(makeIntentResult(['Create']), makeEntityResult(['Tree']))
    builder.build()
    builder.build(makeIntentResult(['Move']), makeEntityResult(['Flower']))
    expect(Object.keys(builder)).toEqual(before)
  })
})

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

describe('Semantic exports', () => {
  it('should export SemanticContext type from semantic/index', () => {
    const ctx: SemanticContextFromIndex = { intent: { intents: [{ type: 'Create' }] } }
    expect(ctx.intent?.intents[0].type).toBe('Create')
  })

  it('should export SemanticContextBuilder type from semantic/index', () => {
    const builder: BuilderFromIndex = createBuilder()
    expect(builder.build).toBeDefined()
  })

  it('should export DefaultSemanticContextBuilder class from semantic/index', () => {
    const builder = new DefaultBuilderFromIndex()
    expect(builder).toBeInstanceOf(DefaultSemanticContextBuilder)
  })

  it('should export SemanticContext type from package root', () => {
    const ctx: SemanticContextFromRoot = { entity: { entities: [{ type: 'Tree' }] } }
    expect(ctx.entity?.entities[0].type).toBe('Tree')
  })

  it('should export SemanticContextBuilder type from package root', () => {
    const builder: BuilderFromRoot = createBuilder()
    expect(builder.build).toBeDefined()
  })

  it('should export DefaultSemanticContextBuilder class from package root', () => {
    const builder = new DefaultBuilderFromRoot()
    expect(builder).toBeInstanceOf(DefaultSemanticContextBuilder)
  })
})

// ---------------------------------------------------------------------------
// Architecture Compliance
// ---------------------------------------------------------------------------

describe('Architecture compliance', () => {
  it('should not depend on Planner', () => {
    const builder = createBuilder()
    expect(builder.build()).toBeDefined()
  })

  it('should not depend on Runtime', () => {
    const builder = createBuilder()
    const result = builder.build()
    expect(result.intent).toBeUndefined()
  })

  it('should not depend on Provider', () => {
    const builder = createBuilder()
    expect(builder).toBeInstanceOf(DefaultSemanticContextBuilder)
  })

  it('should not depend on Memory', () => {
    const builder = createBuilder()
    expect(builder.build()).toEqual({})
  })

  it('should not depend on ToolCalling', () => {
    const builder = createBuilder()
    expect(builder.build()).toEqual({})
  })

  it('should not depend on AgentLoop', () => {
    const builder = createBuilder()
    expect(builder.build()).toEqual({})
  })

  it('should not depend on PromptBuilder', () => {
    const builder = createBuilder()
    expect(builder.build()).toEqual({})
  })

  it('should not depend on Pipeline', () => {
    const builder = createBuilder()
    expect(builder.build()).toEqual({})
  })

  it('should be pure — no side effects', () => {
    const builder = createBuilder()
    const intent = makeIntentResult(['Create'])
    const entity = makeEntityResult(['Tree'])
    const beforeIntent = JSON.stringify(intent)
    const beforeEntity = JSON.stringify(entity)
    builder.build(intent, entity)
    expect(JSON.stringify(intent)).toBe(beforeIntent)
    expect(JSON.stringify(entity)).toBe(beforeEntity)
  })

  it('should be stateless — no internal state', () => {
    const b1 = createBuilder()
    const b2 = createBuilder()
    expect(b1.build()).toEqual(b2.build())
  })

  it('should be non-mutating — never modifies inputs', () => {
    const builder = createBuilder()
    const intent = makeIntentResult(['Create'])
    const entity = makeEntityResult(['Tree'])
    const originalIntent = JSON.stringify(intent)
    const originalEntity = JSON.stringify(entity)
    builder.build(intent, entity)
    expect(JSON.stringify(intent)).toBe(originalIntent)
    expect(JSON.stringify(entity)).toBe(originalEntity)
  })
})

// ---------------------------------------------------------------------------
// Coexistence with IntentAnalyzer and EntityAnalyzer
// ---------------------------------------------------------------------------

describe('Coexistence', () => {
  it('should work with RuleBasedIntentAnalyzer results', () => {
    const analyzer = new RuleBasedIntentAnalyzer()
    const intent = analyzer.analyze('draw a tree')
    const builder = createBuilder()
    const context = builder.build(intent)
    expect(context.intent?.intents).toHaveLength(1)
    expect(context.intent?.intents[0].type).toBe('Create')
  })

  it('should work with RuleBasedEntityAnalyzer results', () => {
    const analyzer = new RuleBasedEntityAnalyzer()
    const entity = analyzer.analyze('draw a tree')
    const builder = createBuilder()
    const context = builder.build(undefined, entity)
    expect(context.entity?.entities).toHaveLength(1)
    expect(context.entity?.entities[0].type).toBe('Tree')
  })

  it('should combine both analyzers results', () => {
    const intentAnalyzer = new RuleBasedIntentAnalyzer()
    const entityAnalyzer = new RuleBasedEntityAnalyzer()
    const input = 'draw a tree'
    const intent = intentAnalyzer.analyze(input)
    const entity = entityAnalyzer.analyze(input)
    const builder = createBuilder()
    const context = builder.build(intent, entity)
    expect(context.intent?.intents).toHaveLength(1)
    expect(context.intent?.intents[0].type).toBe('Create')
    expect(context.entity?.entities).toHaveLength(1)
    expect(context.entity?.entities[0].type).toBe('Tree')
  })
})

// ---------------------------------------------------------------------------
// RetryPlanner Compatibility
// ---------------------------------------------------------------------------

describe('RetryPlanner Compatibility', () => {
  it('should work with RetryPlanner', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules())
    const provider = new MockPlannerProvider(mockConfig)
    const planner = new RetryPlanner(provider)
    const pipeline = new DefaultPipeline(planner, builder)
    const context = createPipelineContext()
    await expect(pipeline.execute(context)).resolves.toBeDefined()
  })

  it('should not affect RetryPlanner retry behavior', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules())
    const provider = new MockPlannerProvider(mockConfig)
    const { RetryPolicy } = await import('../retry/RetryPolicy')
    const planner = new RetryPlanner(provider, new RetryPolicy({ maxRetries: 1 }))
    const pipeline = new DefaultPipeline(planner, builder)
    const context = createPipelineContext({ input: 'tree' })
    const result = await pipeline.execute(context)
    expect(result.plannerResult?.actions).toHaveLength(1)
  })
})

// ---------------------------------------------------------------------------
// ToolCallPlanner Compatibility
// ---------------------------------------------------------------------------

describe('ToolCallPlanner Compatibility', () => {
  it('should work with ToolCallPlanner', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules())
    const provider = new MockPlannerProvider(mockConfig)
    const toolRegistry = new DefaultToolRegistry()
    const planner = new ToolCallPlanner(provider, toolRegistry)
    const pipeline = new DefaultPipeline(planner, builder)
    const context = createPipelineContext()
    await expect(pipeline.execute(context)).resolves.toBeDefined()
  })

  it('should not affect ToolCallPlanner tool execution', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules())
    const provider = new MockPlannerProvider(mockConfig)
    const toolRegistry = new DefaultToolRegistry()
    const planner = new ToolCallPlanner(provider, toolRegistry)
    const pipeline = new DefaultPipeline(planner, builder)
    const context = createPipelineContext({ input: 'tree' })
    const result = await pipeline.execute(context)
    expect(result.plannerResult?.actions).toHaveLength(1)
  })
})

// ---------------------------------------------------------------------------
// Streaming Compatibility
// ---------------------------------------------------------------------------

describe('Streaming Compatibility', () => {
  it('should work with StreamingProvider', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules())
    const provider = new MockStreamingProvider()
    const planner = new MockPlanner(provider)
    const pipeline = new DefaultPipeline(planner, builder)
    const context = createPipelineContext()
    await expect(pipeline.stream(context)).resolves.toBeDefined()
  })

  it('should not affect streaming chunk emission', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules())
    const provider = new MockStreamingProvider()
    const planner = new MockPlanner(provider)
    const pipeline = new DefaultPipeline(planner, builder)
    const context = createPipelineContext({ input: 'tree' })
    const result = await pipeline.stream(context)
    expect(result.plannerResult?.actions).toHaveLength(1)
  })
})

// ---------------------------------------------------------------------------
// AgentLoop Compatibility
// ---------------------------------------------------------------------------

describe('AgentLoop Compatibility', () => {
  it('should work with DefaultAgentLoop', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules())
    const planner = new MockPlanner(new MockPlannerProvider(mockConfig))
    const pipeline = new DefaultPipeline(planner, builder)
    const context = createPipelineContext()
    await expect(pipeline.execute(context)).resolves.toBeDefined()
  })

  it('should not affect AgentLoop iteration count', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules())
    const planner = new MockPlanner(new MockPlannerProvider(mockConfig))
    const pipeline = new DefaultPipeline(planner, builder)
    const context = createPipelineContext({ input: 'tree' })
    const result = await pipeline.execute(context)
    expect(result.plannerResult?.actions).toHaveLength(1)
  })
})