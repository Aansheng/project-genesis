import { describe, it, expect } from 'vitest'
import type { EntityRenderer } from '../entity/EntityRenderer'
import { DefaultEntityRenderer } from '../entity/DefaultEntityRenderer'
import type { EntityResult } from '../entity/EntityResult'
import { RuleBasedEntityAnalyzer } from '../entity/RuleBasedEntityAnalyzer'
import { DefaultEntityAnalyzer } from '../entity/DefaultEntityAnalyzer'
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
import type { EntityRenderer as EntityRendererFromIndex } from '../entity/index'
import { DefaultEntityRenderer as DefaultEntityRendererFromIndex } from '../entity/index'
import type { EntityRenderer as EntityRendererFromRoot } from '../index'
import { DefaultEntityRenderer as DefaultEntityRendererFromRoot } from '../index'

// ---------------------------------------------------------------------------
// Test Data
// ---------------------------------------------------------------------------

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
// EntityRenderer Interface
// ---------------------------------------------------------------------------

describe('EntityRenderer interface', () => {
  it('should define a render method that accepts EntityResult and returns string', () => {
    const renderer: EntityRenderer = new DefaultEntityRenderer()
    expect(renderer.render).toBeDefined()
    expect(typeof renderer.render).toBe('function')
  })
})

// ---------------------------------------------------------------------------
// DefaultEntityRenderer — Empty
// ---------------------------------------------------------------------------

describe('DefaultEntityRenderer — empty', () => {
  it('should return empty string for empty EntityResult', () => {
    const renderer = new DefaultEntityRenderer()
    const result: EntityResult = { entities: [] }
    expect(renderer.render(result)).toBe('')
  })

  it('should return empty string for result with no entities', () => {
    const renderer = new DefaultEntityRenderer()
    const result: EntityResult = { entities: [] }
    expect(renderer.render(result).length).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// DefaultEntityRenderer — Single Entity
// ---------------------------------------------------------------------------

describe('DefaultEntityRenderer — single entity', () => {
  it('should render Tree as "Entities:\\n- Tree"', () => {
    const renderer = new DefaultEntityRenderer()
    const result: EntityResult = { entities: [{ type: 'Tree' }] }
    expect(renderer.render(result)).toBe('Entities:\n- Tree')
  })

  it('should render Flower as "Entities:\\n- Flower"', () => {
    const renderer = new DefaultEntityRenderer()
    const result: EntityResult = { entities: [{ type: 'Flower' }] }
    expect(renderer.render(result)).toBe('Entities:\n- Flower')
  })

  it('should render Grass as "Entities:\\n- Grass"', () => {
    const renderer = new DefaultEntityRenderer()
    const result: EntityResult = { entities: [{ type: 'Grass' }] }
    expect(renderer.render(result)).toBe('Entities:\n- Grass')
  })

  it('should render House as "Entities:\\n- House"', () => {
    const renderer = new DefaultEntityRenderer()
    const result: EntityResult = { entities: [{ type: 'House' }] }
    expect(renderer.render(result)).toBe('Entities:\n- House')
  })

  it('should render Rock as "Entities:\\n- Rock"', () => {
    const renderer = new DefaultEntityRenderer()
    const result: EntityResult = { entities: [{ type: 'Rock' }] }
    expect(renderer.render(result)).toBe('Entities:\n- Rock')
  })

  it('should render Water as "Entities:\\n- Water"', () => {
    const renderer = new DefaultEntityRenderer()
    const result: EntityResult = { entities: [{ type: 'Water' }] }
    expect(renderer.render(result)).toBe('Entities:\n- Water')
  })

  it('should render Character as "Entities:\\n- Character"', () => {
    const renderer = new DefaultEntityRenderer()
    const result: EntityResult = { entities: [{ type: 'Character' }] }
    expect(renderer.render(result)).toBe('Entities:\n- Character')
  })
})

// ---------------------------------------------------------------------------
// DefaultEntityRenderer — Multiple Entities
// ---------------------------------------------------------------------------

describe('DefaultEntityRenderer — multiple entities', () => {
  it('should render two entities on separate lines', () => {
    const renderer = new DefaultEntityRenderer()
    const result: EntityResult = { entities: [{ type: 'Tree' }, { type: 'Flower' }] }
    expect(renderer.render(result)).toBe('Entities:\n- Tree\n- Flower')
  })

  it('should render three entities on separate lines', () => {
    const renderer = new DefaultEntityRenderer()
    const result: EntityResult = {
      entities: [{ type: 'Tree' }, { type: 'Flower' }, { type: 'House' }],
    }
    expect(renderer.render(result)).toBe('Entities:\n- Tree\n- Flower\n- House')
  })

  it('should render all seven entity types', () => {
    const renderer = new DefaultEntityRenderer()
    const result: EntityResult = {
      entities: [
        { type: 'Tree' },
        { type: 'Flower' },
        { type: 'Grass' },
        { type: 'House' },
        { type: 'Rock' },
        { type: 'Water' },
        { type: 'Character' },
      ],
    }
    expect(renderer.render(result)).toBe(
      'Entities:\n- Tree\n- Flower\n- Grass\n- House\n- Rock\n- Water\n- Character',
    )
  })
})

// ---------------------------------------------------------------------------
// DefaultEntityRenderer — Order Preservation
// ---------------------------------------------------------------------------

describe('DefaultEntityRenderer — order preservation', () => {
  it('should preserve input order: Flower before Tree', () => {
    const renderer = new DefaultEntityRenderer()
    const result: EntityResult = { entities: [{ type: 'Flower' }, { type: 'Tree' }] }
    expect(renderer.render(result)).toBe('Entities:\n- Flower\n- Tree')
  })

  it('should preserve input order: House before Water before Tree', () => {
    const renderer = new DefaultEntityRenderer()
    const result: EntityResult = {
      entities: [{ type: 'House' }, { type: 'Water' }, { type: 'Tree' }],
    }
    expect(renderer.render(result)).toBe('Entities:\n- House\n- Water\n- Tree')
  })
})

// ---------------------------------------------------------------------------
// DefaultEntityRenderer — Deterministic
// ---------------------------------------------------------------------------

describe('DefaultEntityRenderer — deterministic', () => {
  it('should return identical result for same input', () => {
    const renderer = new DefaultEntityRenderer()
    const result: EntityResult = { entities: [{ type: 'Tree' }, { type: 'Flower' }] }
    const r1 = renderer.render(result)
    const r2 = renderer.render(result)
    const r3 = renderer.render(result)
    expect(r1).toBe(r2)
    expect(r2).toBe(r3)
  })

  it('should be idempotent across repeated calls', () => {
    const renderer = new DefaultEntityRenderer()
    const result: EntityResult = { entities: [{ type: 'Tree' }] }
    for (let i = 0; i < 10; i++) {
      expect(renderer.render(result)).toBe('Entities:\n- Tree')
    }
  })
})

// ---------------------------------------------------------------------------
// DefaultEntityRenderer — Stateless
// ---------------------------------------------------------------------------

describe('DefaultEntityRenderer — stateless', () => {
  it('should not retain state between calls', () => {
    const renderer = new DefaultEntityRenderer()
    expect(renderer.render({ entities: [{ type: 'Tree' }] })).toBe('Entities:\n- Tree')
    expect(renderer.render({ entities: [] })).toBe('')
    expect(renderer.render({ entities: [{ type: 'Flower' }] })).toBe('Entities:\n- Flower')
  })

  it('should be independent across multiple instances', () => {
    const r1 = new DefaultEntityRenderer()
    const r2 = new DefaultEntityRenderer()
    expect(r1.render({ entities: [{ type: 'Tree' }] })).toBe(
      r2.render({ entities: [{ type: 'Tree' }] }),
    )
  })
})

// ---------------------------------------------------------------------------
// DefaultEntityRenderer — Pure
// ---------------------------------------------------------------------------

describe('DefaultEntityRenderer — pure', () => {
  it('should not modify the input EntityResult', () => {
    const renderer = new DefaultEntityRenderer()
    const result: EntityResult = { entities: [{ type: 'Tree' }, { type: 'Flower' }] }
    const original = JSON.stringify(result)
    renderer.render(result)
    expect(JSON.stringify(result)).toBe(original)
  })

  it('should have no side effects', () => {
    const renderer = new DefaultEntityRenderer()
    const before = Object.keys(renderer)
    renderer.render({ entities: [{ type: 'Tree' }] })
    renderer.render({ entities: [] })
    renderer.render({ entities: [{ type: 'Flower' }, { type: 'House' }] })
    expect(Object.keys(renderer)).toEqual(before)
  })
})

// ---------------------------------------------------------------------------
// BuilderOptions — EntityRenderer
// ---------------------------------------------------------------------------

describe('BuilderOptions — EntityRenderer field', () => {
  it('should accept EntityRenderer in BuilderOptions', () => {
    const options: BuilderOptions = {
      entityRenderer: new DefaultEntityRenderer(),
    }
    expect(options.entityRenderer).toBeDefined()
  })

  it('should accept EntityRenderer alongside EntityAnalyzer', () => {
    const options: BuilderOptions = {
      entityAnalyzer: new RuleBasedEntityAnalyzer(),
      entityRenderer: new DefaultEntityRenderer(),
    }
    expect(options.entityAnalyzer).toBeDefined()
    expect(options.entityRenderer).toBeDefined()
  })

  it('should allow BuilderOptions without EntityRenderer', () => {
    const options: BuilderOptions = {}
    expect(options.entityRenderer).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// Metadata — entityRendered
// ---------------------------------------------------------------------------

describe('Metadata — entityRendered', () => {
  it('should store entityRendered in metadata.promptAssembly', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      entityAnalyzer: new RuleBasedEntityAnalyzer(),
      entityRenderer: new DefaultEntityRenderer(),
    })
    const context = createPipelineContext({ input: 'tree' })
    const result = await builder.build(context)
    const assembly = result.metadata?.promptAssembly as Record<string, unknown> | undefined
    expect(assembly?.entityRendered).toBe('Entities:\n- Tree')
  })

  it('should store entityRendered for multiple entities', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      entityAnalyzer: new RuleBasedEntityAnalyzer(),
      entityRenderer: new DefaultEntityRenderer(),
    })
    const context = createPipelineContext({ input: 'tree and flower' })
    const result = await builder.build(context)
    const assembly = result.metadata?.promptAssembly as Record<string, unknown> | undefined
    expect(assembly?.entityRendered).toBe('Entities:\n- Tree\n- Flower')
  })

  it('should store empty string for empty entity result', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      entityAnalyzer: new RuleBasedEntityAnalyzer(),
      entityRenderer: new DefaultEntityRenderer(),
    })
    const context = createPipelineContext({ input: 'hello' })
    const result = await builder.build(context)
    const assembly = result.metadata?.promptAssembly as Record<string, unknown> | undefined
    expect(assembly?.entityRendered).toBe('')
  })

  it('should not store entityRendered when EntityRenderer is absent', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      entityAnalyzer: new RuleBasedEntityAnalyzer(),
    })
    const context = createPipelineContext({ input: 'tree' })
    const result = await builder.build(context)
    const assembly = result.metadata?.promptAssembly as Record<string, unknown> | undefined
    expect(assembly?.entityRendered).toBeUndefined()
  })

  it('should not store entityRendered when EntityAnalyzer is absent', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      entityRenderer: new DefaultEntityRenderer(),
    })
    const context = createPipelineContext({ input: 'tree' })
    const result = await builder.build(context)
    const assembly = result.metadata?.promptAssembly as Record<string, unknown> | undefined
    expect(assembly?.entityRendered).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// Metadata — entity and entityRendered coexist
// ---------------------------------------------------------------------------

describe('Metadata — entity and entityRendered coexist', () => {
  it('should store both entity and entityRendered', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      entityAnalyzer: new RuleBasedEntityAnalyzer(),
      entityRenderer: new DefaultEntityRenderer(),
    })
    const context = createPipelineContext({ input: 'tree' })
    const result = await builder.build(context)
    const assembly = result.metadata?.promptAssembly as Record<string, unknown> | undefined
    expect(assembly?.entity).toBeDefined()
    expect(assembly?.entityRendered).toBeDefined()
  })

  it('should have correct entity type in entity result', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      entityAnalyzer: new RuleBasedEntityAnalyzer(),
      entityRenderer: new DefaultEntityRenderer(),
    })
    const context = createPipelineContext({ input: 'tree' })
    const result = await builder.build(context)
    const assembly = result.metadata?.promptAssembly as Record<string, unknown> | undefined
    const entityResult = assembly?.entity as EntityResult
    expect(entityResult.entities[0].type).toBe('Tree')
    expect(assembly?.entityRendered).toBe('Entities:\n- Tree')
  })
})

// ---------------------------------------------------------------------------
// Metadata — entity, intent, entityRendered all coexist
// ---------------------------------------------------------------------------

describe('Metadata — all fields coexist', () => {
  it('should store intent, entity, and entityRendered together', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      intentAnalyzer: {
        analyze(input: string) {
          if (input.toLowerCase().includes('draw')) return { intents: [{ type: 'Create' }] }
          return { intents: [] }
        },
      },
      intentRenderer: {
        render() { return 'User Intent:\n- Create' },
      },
      entityAnalyzer: new RuleBasedEntityAnalyzer(),
      entityRenderer: new DefaultEntityRenderer(),
    })
    const context = createPipelineContext({ input: 'draw a tree' })
    const result = await builder.build(context)
    const assembly = result.metadata?.promptAssembly as Record<string, unknown> | undefined
    expect(assembly?.intent).toBeDefined()
    expect(assembly?.intentRendered).toBeDefined()
    expect(assembly?.entity).toBeDefined()
    expect(assembly?.entityRendered).toBeDefined()
  })

  it('should have correct rendering values for all fields', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      intentAnalyzer: {
        analyze(input: string) {
          if (input.toLowerCase().includes('draw')) return { intents: [{ type: 'Create' }] }
          return { intents: [] }
        },
      },
      intentRenderer: {
        render() { return 'User Intent:\n- Create' },
      },
      entityAnalyzer: new RuleBasedEntityAnalyzer(),
      entityRenderer: new DefaultEntityRenderer(),
    })
    const context = createPipelineContext({ input: 'draw a tree and flower' })
    const result = await builder.build(context)
    const assembly = result.metadata?.promptAssembly as Record<string, unknown> | undefined
    expect(assembly?.intentRendered).toBe('User Intent:\n- Create')
    expect(assembly?.entityRendered).toBe('Entities:\n- Tree\n- Flower')
  })
})

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

describe('Exports', () => {
  it('should export EntityRenderer type from entity/index', () => {
    const renderer: EntityRendererFromIndex = new DefaultEntityRenderer()
    expect(renderer).toBeDefined()
  })

  it('should export DefaultEntityRenderer class from entity/index', () => {
    const renderer = new DefaultEntityRendererFromIndex()
    expect(renderer).toBeInstanceOf(DefaultEntityRenderer)
  })

  it('should export EntityRenderer type from package root', () => {
    const renderer: EntityRendererFromRoot = new DefaultEntityRenderer()
    expect(renderer).toBeDefined()
  })

  it('should export DefaultEntityRenderer class from package root', () => {
    const renderer = new DefaultEntityRendererFromRoot()
    expect(renderer).toBeInstanceOf(DefaultEntityRenderer)
  })
})

// ---------------------------------------------------------------------------
// RetryPlanner Compatibility
// ---------------------------------------------------------------------------

describe('RetryPlanner Compatibility', () => {
  it('should work with RetryPlanner', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      entityAnalyzer: new RuleBasedEntityAnalyzer(),
      entityRenderer: new DefaultEntityRenderer(),
    })
    const provider = new MockPlannerProvider(mockConfig)
    const planner = new RetryPlanner(provider)
    const pipeline = new DefaultPipeline(planner, builder)
    const context = createPipelineContext()
    await expect(pipeline.execute(context)).resolves.toBeDefined()
  })

  it('should not affect RetryPlanner retry behavior', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      entityAnalyzer: new RuleBasedEntityAnalyzer(),
      entityRenderer: new DefaultEntityRenderer(),
    })
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
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      entityAnalyzer: new RuleBasedEntityAnalyzer(),
      entityRenderer: new DefaultEntityRenderer(),
    })
    const provider = new MockPlannerProvider(mockConfig)
    const toolRegistry = new DefaultToolRegistry()
    const planner = new ToolCallPlanner(provider, toolRegistry)
    const pipeline = new DefaultPipeline(planner, builder)
    const context = createPipelineContext()
    await expect(pipeline.execute(context)).resolves.toBeDefined()
  })

  it('should not affect ToolCallPlanner tool execution', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      entityAnalyzer: new RuleBasedEntityAnalyzer(),
      entityRenderer: new DefaultEntityRenderer(),
    })
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
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      entityAnalyzer: new RuleBasedEntityAnalyzer(),
      entityRenderer: new DefaultEntityRenderer(),
    })
    const provider = new MockStreamingProvider()
    const planner = new MockPlanner(provider)
    const pipeline = new DefaultPipeline(planner, builder)
    const context = createPipelineContext()
    await expect(pipeline.stream(context)).resolves.toBeDefined()
  })

  it('should not affect streaming chunk emission', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      entityAnalyzer: new RuleBasedEntityAnalyzer(),
      entityRenderer: new DefaultEntityRenderer(),
    })
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
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      entityAnalyzer: new RuleBasedEntityAnalyzer(),
      entityRenderer: new DefaultEntityRenderer(),
    })
    const planner = new MockPlanner(new MockPlannerProvider(mockConfig))
    const pipeline = new DefaultPipeline(planner, builder)
    const context = createPipelineContext()
    await expect(pipeline.execute(context)).resolves.toBeDefined()
  })

  it('should not affect AgentLoop iteration count', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      entityAnalyzer: new RuleBasedEntityAnalyzer(),
      entityRenderer: new DefaultEntityRenderer(),
    })
    const planner = new MockPlanner(new MockPlannerProvider(mockConfig))
    const pipeline = new DefaultPipeline(planner, builder)
    const context = createPipelineContext({ input: 'tree' })
    const result = await pipeline.execute(context)
    expect(result.plannerResult?.actions).toHaveLength(1)
  })
})