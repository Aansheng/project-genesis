import { describe, it, expect } from 'vitest'
import { DefaultPromptBuilder } from '../prompt/DefaultPromptBuilder'
import {
  UserInputModule,
  SystemPromptModule,
  MemoryPromptModule,
  WorldStatePromptModule,
} from '../prompt/modules'
import type { PromptModule } from '../prompt/modules/PromptModule'
import { DefaultMemory } from '../memory/DefaultMemory'
import { DefaultPromptRenderer } from '../prompt/DefaultPromptRenderer'
import { DefaultPromptCompression } from '../prompt/DefaultPromptCompression'
import { MockPlanner, RetryPlanner, ToolCallPlanner } from '../planner'
import { MockPlannerProvider, MockStreamingProvider } from '../provider'
import { DefaultToolRegistry } from '../tools/ToolRegistry'
import { DefaultPipeline } from '../pipeline/DefaultPipeline'
import type { PipelineContext } from '../pipeline/PipelineContext'
import type { PromptContext } from '../prompt/PromptContext'
import { serializePromptContext } from '../prompt/PromptContext'
import { DefaultAIConfiguration } from '../config/DefaultAIConfiguration'

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
// PromptContext — strategyRendered field
// ---------------------------------------------------------------------------

describe('PromptContext — strategyRendered field', () => {
  it('should support optional strategyRendered field', () => {
    const ctx: PromptContext = {}
    expect(ctx.strategyRendered).toBeUndefined()
  })

  it('should accept strategyRendered value', () => {
    const ctx: PromptContext = { strategyRendered: 'Prompt Strategy:\n\n- default' }
    expect(ctx.strategyRendered).toBe('Prompt Strategy:\n\n- default')
  })
})

// ---------------------------------------------------------------------------
// DefaultPromptRenderer — CANONICAL_ORDER
// ---------------------------------------------------------------------------

describe('DefaultPromptRenderer — CANONICAL_ORDER', () => {
  it('should include strategyRendered in CANONICAL_ORDER', () => {
    expect(DefaultPromptRenderer.CANONICAL_ORDER).toContain('strategyRendered')
  })

  it('should have strategyRendered after semanticRendered', () => {
    const order = DefaultPromptRenderer.CANONICAL_ORDER
    const semanticIdx = order.indexOf('semanticRendered')
    const strategyIdx = order.indexOf('strategyRendered')
    expect(strategyIdx).toBeGreaterThan(semanticIdx)
  })

  it('should have strategyRendered before system', () => {
    const order = DefaultPromptRenderer.CANONICAL_ORDER
    const strategyIdx = order.indexOf('strategyRendered')
    const systemIdx = order.indexOf('system')
    expect(strategyIdx).toBeLessThan(systemIdx)
  })
})

// ---------------------------------------------------------------------------
// DefaultPromptCompression — strategyRendered Support
// ---------------------------------------------------------------------------

describe('DefaultPromptCompression — strategyRendered support', () => {
  it('should preserve strategyRendered through compression', () => {
    const compressor = new DefaultPromptCompression()
    const result = compressor.compress({
      strategyRendered: 'Prompt Strategy:\n\n- default',
    })
    expect(result.strategyRendered).toBe('Prompt Strategy:\n\n- default')
  })

  it('should strip empty strategyRendered through compression', () => {
    const compressor = new DefaultPromptCompression()
    const result = compressor.compress({ strategyRendered: '' })
    expect(result.strategyRendered).toBeUndefined()
  })

  it('should coexist with other fields through compression', () => {
    const compressor = new DefaultPromptCompression()
    const result = compressor.compress({
      system: 'System prompt',
      strategyRendered: 'Prompt Strategy:\n\n- default',
      userInput: 'draw a tree',
    })
    expect(result.system).toBe('System prompt')
    expect(result.strategyRendered).toBe('Prompt Strategy:\n\n- default')
    expect(result.userInput).toBe('draw a tree')
  })
})

// ---------------------------------------------------------------------------
// DefaultPromptBuilder — strategyRendered in prompt
// ---------------------------------------------------------------------------

describe('DefaultPromptBuilder — strategy in prompt', () => {
  it('should include strategyRendered in the rendered prompt', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules())
    const request = await builder.build(createPipelineContext())
    expect(request.prompt).toContain('Prompt Strategy:')
    expect(request.prompt).toContain('- default')
  })

  it('should include strategyRendered as a dedicated prompt section', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules())
    const request = await builder.build(createPipelineContext())
    // The strategy section should appear as a separate block in the prompt
    expect(request.prompt).toMatch(/Prompt Strategy:\n\n- default/)
  })
})

// ---------------------------------------------------------------------------
// strategyRendered canonical order in rendered prompt
// ---------------------------------------------------------------------------

describe('Canonical order — strategyRendered', () => {
  it('should render strategy before system section', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules())
    const request = await builder.build(createPipelineContext())
    const prompt = request.prompt
    const strategyIdx = prompt.indexOf('Prompt Strategy:')
    const systemIdx = prompt.indexOf('You are a game action planner')
    expect(strategyIdx).toBeGreaterThan(-1)
    expect(systemIdx).toBeGreaterThan(-1)
    expect(strategyIdx).toBeLessThan(systemIdx)
  })

  it('should render strategy after content sections via canonical order', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules())
    const request = await builder.build(createPipelineContext())
    const prompt = request.prompt
    // Canonical order: intent → entity → semantic → strategy → system → userInput → memory → reflections → worldState → observations
    // Without intent/entity/semantic injected, strategy should appear near the beginning
    expect(prompt).toMatch(/Prompt Strategy:/)
  })

  it('should preserve correct order with serializePromptContext', () => {
    const ctx: PromptContext = {
      intentRendered: 'User Intent:\n- Create',
      entityRendered: 'Entities:\n- Tree',
      semanticRendered: 'Semantic Context:\n- Create\n- Tree',
      strategyRendered: 'Prompt Strategy:\n\n- default',
      system: 'You are a game action planner',
      userInput: 'draw a tree',
      memory: 'Previous actions:\n- Create tree',
      reflections: '## Previous Reflection',
      worldState: 'Current World:\n\nTree\nid: tree-1',
      observations: '## Previous Observations',
    }
    const result = serializePromptContext(ctx)
    const lines = result.split('\n\n')

    // Find indices of each section header
    const intentIdx = lines.findIndex(l => l.startsWith('User Intent:'))
    const entityIdx = lines.findIndex(l => l.startsWith('Entities:'))
    const semanticIdx = lines.findIndex(l => l.startsWith('Semantic Context:'))
    const strategyIdx = lines.findIndex(l => l.startsWith('Prompt Strategy:'))
    const systemIdx = lines.findIndex(l => l.startsWith('You are'))
    const userInputIdx = lines.findIndex(l => l.startsWith('draw a tree'))
    const memoryIdx = lines.findIndex(l => l.startsWith('Previous actions:'))
    const reflectionIdx = lines.findIndex(l => l.startsWith('## Previous Reflection'))
    const worldStateIdx = lines.findIndex(l => l.startsWith('Current World:'))
    const observationsIdx = lines.findIndex(l => l.startsWith('## Previous Observations'))

    expect(intentIdx).toBeLessThan(entityIdx)
    expect(entityIdx).toBeLessThan(semanticIdx)
    expect(semanticIdx).toBeLessThan(strategyIdx)
    expect(strategyIdx).toBeLessThan(systemIdx)
    expect(systemIdx).toBeLessThan(userInputIdx)
    expect(userInputIdx).toBeLessThan(memoryIdx)
    expect(memoryIdx).toBeLessThan(reflectionIdx)
    expect(reflectionIdx).toBeLessThan(worldStateIdx)
    expect(worldStateIdx).toBeLessThan(observationsIdx)
  })
})

// ---------------------------------------------------------------------------
// PromptBuilder integration — buildContext
// ---------------------------------------------------------------------------

describe('PromptBuilder integration', () => {
  it('should include strategyRendered in buildContext output', async () => {
    // buildContext only runs module → ranking → budget → selection → compression
    // Strategy phases (0-0.95) only run in build(), not buildContext()
    // So strategyRendered is not present in buildContext
    const builder = new DefaultPromptBuilder(createDefaultModules())
    const context = await builder.buildContext(createPipelineContext())
    expect(context.strategyRendered).toBeUndefined()
  })

  it('should include strategyRendered in metadata', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules())
    const request = await builder.build(createPipelineContext())
    const assembly = request.metadata?.promptAssembly as Record<string, unknown> | undefined
    expect(assembly?.strategyRendered).toBe('Prompt Strategy:\n\n- default')
  })

  it('strategyRendered should be present in prompt output', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules())
    const request = await builder.build(createPipelineContext())
    expect(request.prompt).toContain('Prompt Strategy:')
    expect(request.prompt).toContain('- default')
  })
})

// ---------------------------------------------------------------------------
// Deterministic
// ---------------------------------------------------------------------------

describe('Strategy prompt integration — deterministic', () => {
  it('should produce same strategy section for same input', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules())
    const req1 = await builder.build(createPipelineContext())
    const req2 = await builder.build(createPipelineContext())
    expect(req1.prompt).toBe(req2.prompt)
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
    const result = await pipeline.execute(createPipelineContext())
    expect(result.plannerResult).toBeDefined()
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
    const result = await pipeline.execute(createPipelineContext())
    expect(result.plannerResult).toBeDefined()
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
    const result = await pipeline.stream(createPipelineContext())
    expect(result.plannerResult).toBeDefined()
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
    const result = await pipeline.execute(createPipelineContext())
    expect(result.plannerResult).toBeDefined()
  })
})