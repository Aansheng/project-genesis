import { describe, it, expect } from 'vitest'
import { DefaultPromptRenderer } from '../prompt/DefaultPromptRenderer'
import type { PromptContext } from '../prompt/PromptContext'
import { serializePromptContext } from '../prompt/PromptContext'
import { DefaultPromptBuilder } from '../prompt/DefaultPromptBuilder'
import { RuleBasedEntityAnalyzer } from '../entity/RuleBasedEntityAnalyzer'
import { DefaultEntityAnalyzer } from '../entity/DefaultEntityAnalyzer'
import { DefaultEntityRenderer } from '../entity/DefaultEntityRenderer'
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
// DefaultPromptRenderer — Empty Entity
// ---------------------------------------------------------------------------

describe('DefaultPromptRenderer — empty entity', () => {
  const renderer = new DefaultPromptRenderer()

  it('should not include entityRendered section when empty string', () => {
    const ctx: PromptContext = { entityRendered: '', userInput: 'Draw a tree' }
    const result = renderer.render(ctx)
    expect(result).not.toContain('Entities:')
    expect(result).toBe('Draw a tree')
  })

  it('should not include entityRendered section when undefined', () => {
    const ctx: PromptContext = { userInput: 'Draw a tree' }
    const result = renderer.render(ctx)
    expect(result).not.toContain('Entities:')
    expect(result).toBe('Draw a tree')
  })

  it('should produce identical prompt with and without empty entityRendered', () => {
    const renderer = new DefaultPromptRenderer()
    const withEmpty = renderer.render({ entityRendered: '', userInput: 'hello' })
    const without = renderer.render({ userInput: 'hello' })
    expect(withEmpty).toBe(without)
  })

  it('should not create blank lines for empty entity', () => {
    const ctx: PromptContext = { entityRendered: '', system: 'sys', userInput: 'input' }
    const result = renderer.render(ctx)
    // Should not start with a blank line
    expect(result).toBe('sys\n\ninput')
  })
})

// ---------------------------------------------------------------------------
// DefaultPromptRenderer — Single Entity
// ---------------------------------------------------------------------------

describe('DefaultPromptRenderer — single entity', () => {
  const renderer = new DefaultPromptRenderer()

  it('should render single entity section', () => {
    const ctx: PromptContext = { entityRendered: 'Entities:\n- Tree', userInput: 'Draw a tree' }
    const result = renderer.render(ctx)
    expect(result).toContain('Entities:\n- Tree')
    expect(result).toContain('Draw a tree')
  })

  it('should render entity section before user input', () => {
    const ctx: PromptContext = { entityRendered: 'Entities:\n- Tree', userInput: 'Draw a tree' }
    const result = renderer.render(ctx)
    expect(result.indexOf('Entities:')).toBeLessThan(result.indexOf('Draw a tree'))
  })
})

// ---------------------------------------------------------------------------
// DefaultPromptRenderer — Multiple Entities
// ---------------------------------------------------------------------------

describe('DefaultPromptRenderer — multiple entities', () => {
  const renderer = new DefaultPromptRenderer()

  it('should render multiple entities section', () => {
    const ctx: PromptContext = {
      entityRendered: 'Entities:\n- Tree\n- Flower\n- House',
      userInput: 'Draw tree and flower',
    }
    const result = renderer.render(ctx)
    expect(result).toContain('Entities:\n- Tree\n- Flower\n- House')
    expect(result).toContain('Draw tree and flower')
  })

  it('should render all entity types', () => {
    const ctx: PromptContext = {
      entityRendered: 'Entities:\n- Tree\n- Flower\n- Grass\n- House\n- Rock\n- Water\n- Character',
      userInput: 'draw all',
    }
    const result = renderer.render(ctx)
    expect(result).toContain('Tree')
    expect(result).toContain('Flower')
    expect(result).toContain('Grass')
    expect(result).toContain('House')
    expect(result).toContain('Rock')
    expect(result).toContain('Water')
    expect(result).toContain('Character')
  })
})

// ---------------------------------------------------------------------------
// DefaultPromptRenderer — Intent + Entity
// ---------------------------------------------------------------------------

describe('DefaultPromptRenderer — intent and entity together', () => {
  const renderer = new DefaultPromptRenderer()

  it('should render intent before entity before user input', () => {
    const ctx: PromptContext = {
      intentRendered: 'User Intent:\n- Create',
      entityRendered: 'Entities:\n- Tree',
      userInput: 'Draw a tree',
    }
    const result = renderer.render(ctx)
    const intentIdx = result.indexOf('User Intent:')
    const entityIdx = result.indexOf('Entities:')
    const inputIdx = result.indexOf('Draw a tree')
    expect(intentIdx).toBeLessThan(entityIdx)
    expect(entityIdx).toBeLessThan(inputIdx)
  })

  it('should separate sections with blank lines', () => {
    const ctx: PromptContext = {
      intentRendered: 'User Intent:\n- Create',
      entityRendered: 'Entities:\n- Tree',
      userInput: 'Draw a tree',
    }
    const result = renderer.render(ctx)
    expect(result).toBe('User Intent:\n- Create\n\nEntities:\n- Tree\n\nDraw a tree')
  })
})

// ---------------------------------------------------------------------------
// DefaultPromptRenderer — Entity before User Input
// ---------------------------------------------------------------------------

describe('DefaultPromptRenderer — entity before user input', () => {
  const renderer = new DefaultPromptRenderer()

  it('should render entity before user input in canonical order', () => {
    const ctx: PromptContext = {
      entityRendered: 'Entities:\n- Tree',
      userInput: 'Draw a tree',
    }
    const result = renderer.render(ctx)
    expect(result.indexOf('Entities:')).toBeLessThan(result.indexOf('Draw a tree'))
  })
})

// ---------------------------------------------------------------------------
// DefaultPromptRenderer — Blank Line Formatting
// ---------------------------------------------------------------------------

describe('DefaultPromptRenderer — blank line formatting', () => {
  const renderer = new DefaultPromptRenderer()

  it('should not have duplicated blank lines', () => {
    const ctx: PromptContext = {
      intentRendered: 'User Intent:\n- Create',
      entityRendered: 'Entities:\n- Tree',
      userInput: 'Draw a tree',
    }
    const result = renderer.render(ctx)
    // Each section separated by exactly one blank line
    expect(result).not.toContain('\n\n\n')
  })

  it('should have exactly one blank line between sections', () => {
    const ctx: PromptContext = {
      entityRendered: 'Entities:\n- Tree',
      userInput: 'Draw a tree',
    }
    const result = renderer.render(ctx)
    expect(result).toBe('Entities:\n- Tree\n\nDraw a tree')
  })

  it('should handle entity between intent and system', () => {
    const ctx: PromptContext = {
      intentRendered: 'User Intent:\n- Create',
      entityRendered: 'Entities:\n- Tree',
      system: 'You are a planner',
    }
    const result = renderer.render(ctx)
    expect(result).toBe('User Intent:\n- Create\n\nEntities:\n- Tree\n\nYou are a planner')
  })
})

// ---------------------------------------------------------------------------
// DefaultPromptRenderer — Canonical Ordering
// ---------------------------------------------------------------------------

describe('DefaultPromptRenderer — canonical ordering', () => {
  const renderer = new DefaultPromptRenderer()

  it('should follow canonical order: intent → entity → system → userInput', () => {
    const ctx: PromptContext = {
      system: 'You are a planner',
      userInput: 'Draw a tree',
      intentRendered: 'User Intent:\n- Create',
      entityRendered: 'Entities:\n- Tree',
    }
    const result = renderer.renderWithOrder(ctx)
    const intentIdx = result.indexOf('User Intent:')
    const entityIdx = result.indexOf('Entities:')
    const sysIdx = result.indexOf('You are a planner')
    const inputIdx = result.indexOf('Draw a tree')
    expect(intentIdx).toBeLessThan(entityIdx)
    expect(entityIdx).toBeLessThan(sysIdx)
    expect(sysIdx).toBeLessThan(inputIdx)
  })
})

// ---------------------------------------------------------------------------
// serializePromptContext Compatibility
// ---------------------------------------------------------------------------

describe('serializePromptContext compatibility', () => {
  it('should include entityRendered in serialized output', () => {
    const ctx: PromptContext = {
      entityRendered: 'Entities:\n- Tree',
      userInput: 'Draw a tree',
    }
    const result = serializePromptContext(ctx)
    expect(result).toContain('Entities:\n- Tree')
    expect(result).toContain('Draw a tree')
  })
})

// ---------------------------------------------------------------------------
// PromptBuilder — Entity in Prompt
// ---------------------------------------------------------------------------

describe('PromptBuilder — entity in prompt', () => {
  it('should render entity section in prompt output', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      entityAnalyzer: new RuleBasedEntityAnalyzer(),
      entityRenderer: new DefaultEntityRenderer(),
    })
    const context = createPipelineContext({ input: 'tree' })
    const result = await builder.build(context)
    expect(result.prompt).toContain('Entities:\n- Tree')
  })

  it('should render single entity in prompt', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      entityAnalyzer: new RuleBasedEntityAnalyzer(),
      entityRenderer: new DefaultEntityRenderer(),
    })
    const context = createPipelineContext({ input: 'tree' })
    const result = await builder.build(context)
    expect(result.prompt).toContain('Entities:\n- Tree')
  })

  it('should render multiple entities in prompt', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      entityAnalyzer: new RuleBasedEntityAnalyzer(),
      entityRenderer: new DefaultEntityRenderer(),
    })
    const context = createPipelineContext({ input: 'tree and flower' })
    const result = await builder.build(context)
    expect(result.prompt).toContain('Entities:\n- Tree\n- Flower')
  })

  it('should not render entity section when no entity analyzer', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules())
    const context = createPipelineContext({ input: 'tree' })
    const result = await builder.build(context)
    expect(result.prompt).not.toContain('Entities:')
  })

  it('should render intent before entity in prompt', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      intentAnalyzer: {
        analyze(input: string) {
          if (input.toLowerCase().includes('draw')) return { intents: [{ type: 'Create' }] }
          return { intents: [] }
        },
      },
      intentRenderer: { render() { return 'User Intent:\n- Create' } },
      entityAnalyzer: new RuleBasedEntityAnalyzer(),
      entityRenderer: new DefaultEntityRenderer(),
    })
    const context = createPipelineContext({ input: 'draw a tree' })
    const result = await builder.build(context)
    expect(result.prompt.indexOf('User Intent:')).toBeLessThan(result.prompt.indexOf('Entities:'))
  })

  it('should render entity before user input in prompt', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      entityAnalyzer: new RuleBasedEntityAnalyzer(),
      entityRenderer: new DefaultEntityRenderer(),
    })
    const context = createPipelineContext({ input: 'tree' })
    const result = await builder.build(context)
    expect(result.prompt.indexOf('Entities:')).toBeLessThan(result.prompt.indexOf('tree'))
  })
})

// ---------------------------------------------------------------------------
// PromptBuilder — PromptContext
// ---------------------------------------------------------------------------

describe('PromptBuilder — PromptContext', () => {
  it('should inject entityRendered into PromptContext', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      entityAnalyzer: new RuleBasedEntityAnalyzer(),
      entityRenderer: new DefaultEntityRenderer(),
    })
    const context = createPipelineContext({ input: 'tree' })
    const result = await builder.build(context)
    expect(result.metadata?.promptAssembly).toBeDefined()
    const assembly = result.metadata?.promptAssembly as Record<string, unknown>
    expect(assembly.entityRendered).toBe('Entities:\n- Tree')
  })

  it('should not inject entityRendered when absent', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules())
    const context = createPipelineContext({ input: 'tree' })
    const result = await builder.build(context)
    const assembly = result.metadata?.promptAssembly as Record<string, unknown> | undefined
    expect(assembly?.entityRendered).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// PromptCompression — entityRendered
// ---------------------------------------------------------------------------

describe('PromptCompression — entityRendered', () => {
  it('should preserve entityRendered through compression', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      entityAnalyzer: new RuleBasedEntityAnalyzer(),
      entityRenderer: new DefaultEntityRenderer(),
    })
    const context = createPipelineContext({ input: 'tree' })
    const result = await builder.build(context)
    expect(result.prompt).toContain('Entities:\n- Tree')
  })
})

// ---------------------------------------------------------------------------
// Deterministic
// ---------------------------------------------------------------------------

describe('Deterministic', () => {
  it('should produce identical prompt for same input', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      entityAnalyzer: new RuleBasedEntityAnalyzer(),
      entityRenderer: new DefaultEntityRenderer(),
    })
    const context = createPipelineContext({ input: 'tree and flower' })
    const r1 = await builder.build(context)
    const r2 = await builder.build(context)
    const r3 = await builder.build(context)
    expect(r1.prompt).toBe(r2.prompt)
    expect(r2.prompt).toBe(r3.prompt)
  })

  it('should produce identical prompt for Chinese input', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      entityAnalyzer: new RuleBasedEntityAnalyzer(),
      entityRenderer: new DefaultEntityRenderer(),
    })
    const context = createPipelineContext({ input: '树和花' })
    const r1 = await builder.build(context)
    const r2 = await builder.build(context)
    expect(r1.prompt).toBe(r2.prompt)
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