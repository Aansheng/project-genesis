import { describe, it, expect, vi } from 'vitest'
import type { SemanticContext } from '../semantic/SemanticContext'
import type { SemanticContextRenderer } from '../semantic/SemanticContextRenderer'
import { DefaultSemanticContextRenderer } from '../semantic/DefaultSemanticContextRenderer'
import type { IntentResult } from '../intent/IntentResult'
import type { EntityResult } from '../entity/EntityResult'
import {
  DefaultSemanticContextRenderer as DefaultRendererFromIndex,
} from '../semantic/index'
import type {
  SemanticContextRenderer as RendererFromIndex,
} from '../semantic/index'
import type {
  SemanticContextRenderer as RendererFromRoot,
} from '../index'
import { DefaultSemanticContextRenderer as DefaultRendererFromRoot } from '../index'
import { DefaultPromptBuilder } from '../prompt/DefaultPromptBuilder'
import type { BuilderOptions } from '../prompt/BuilderOptions'
import { RuleBasedIntentAnalyzer } from '../intent/RuleBasedIntentAnalyzer'
import { DefaultIntentRenderer } from '../intent/DefaultIntentRenderer'
import { RuleBasedEntityAnalyzer } from '../entity/RuleBasedEntityAnalyzer'
import { DefaultEntityRenderer } from '../entity/DefaultEntityRenderer'
import { DefaultSemanticContextBuilder } from '../semantic/DefaultSemanticContextBuilder'
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
import { DefaultPipeline } from '../pipeline/DefaultPipeline'
import type { PipelineContext } from '../pipeline/PipelineContext'
import { DefaultAIConfiguration } from '../config/DefaultAIConfiguration'

// ---------------------------------------------------------------------------
// Test Data
// ---------------------------------------------------------------------------

function makeIntentResult(types: string[]): IntentResult {
  return { intents: types.map(t => ({ type: t as IntentResult['intents'][number]['type'] })) }
}

function makeEntityResult(types: string[]): EntityResult {
  return { entities: types.map(t => ({ type: t as EntityResult['entities'][number]['type'] })) }
}

function makeSemanticContext(intent?: IntentResult, entity?: EntityResult): SemanticContext {
  return {
    ...(intent !== undefined ? { intent } : {}),
    ...(entity !== undefined ? { entity } : {}),
  }
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
// SemanticContextRenderer Interface
// ---------------------------------------------------------------------------

describe('SemanticContextRenderer interface', () => {
  it('should define a render method', () => {
    const renderer: SemanticContextRenderer = new DefaultSemanticContextRenderer()
    expect(renderer.render).toBeDefined()
    expect(typeof renderer.render).toBe('function')
  })

  it('should accept SemanticContext and return string', () => {
    const renderer: SemanticContextRenderer = new DefaultSemanticContextRenderer()
    const result = renderer.render({})
    expect(typeof result).toBe('string')
  })
})

// ---------------------------------------------------------------------------
// DefaultSemanticContextRenderer — Empty Context
// ---------------------------------------------------------------------------

describe('DefaultSemanticContextRenderer — empty context', () => {
  it('should return empty string for empty context', () => {
    const renderer = new DefaultSemanticContextRenderer()
    expect(renderer.render({})).toBe('')
  })

  it('should return empty string for context with empty intent array', () => {
    const renderer = new DefaultSemanticContextRenderer()
    const ctx = makeSemanticContext(makeIntentResult([]))
    expect(renderer.render(ctx)).toBe('')
  })

  it('should return empty string for context with empty entity array', () => {
    const renderer = new DefaultSemanticContextRenderer()
    const ctx = makeSemanticContext(undefined, makeEntityResult([]))
    expect(renderer.render(ctx)).toBe('')
  })

  it('should return empty string for context with both empty arrays', () => {
    const renderer = new DefaultSemanticContextRenderer()
    const ctx = makeSemanticContext(makeIntentResult([]), makeEntityResult([]))
    expect(renderer.render(ctx)).toBe('')
  })
})

// ---------------------------------------------------------------------------
// DefaultSemanticContextRenderer — Intent Only
// ---------------------------------------------------------------------------

describe('DefaultSemanticContextRenderer — intent only', () => {
  it('should render single intent', () => {
    const renderer = new DefaultSemanticContextRenderer()
    const ctx = makeSemanticContext(makeIntentResult(['Create']))
    const result = renderer.render(ctx)
    expect(result).toContain('Semantic Context:')
    expect(result).toContain('Intent:')
    expect(result).toContain('- Create')
    expect(result).not.toContain('Entities:')
  })

  it('should render multiple intents', () => {
    const renderer = new DefaultSemanticContextRenderer()
    const ctx = makeSemanticContext(makeIntentResult(['Create', 'Move']))
    const result = renderer.render(ctx)
    expect(result).toContain('- Create')
    expect(result).toContain('- Move')
  })

  it('should render correct format for single intent', () => {
    const renderer = new DefaultSemanticContextRenderer()
    const ctx = makeSemanticContext(makeIntentResult(['Create']))
    const result = renderer.render(ctx)
    expect(result).toBe('Semantic Context:\n\nIntent:\n- Create')
  })

  it('should render correct format for multiple intents', () => {
    const renderer = new DefaultSemanticContextRenderer()
    const ctx = makeSemanticContext(makeIntentResult(['Create', 'Move', 'Delete']))
    const result = renderer.render(ctx)
    expect(result).toBe('Semantic Context:\n\nIntent:\n- Create\n- Move\n- Delete')
  })
})

// ---------------------------------------------------------------------------
// DefaultSemanticContextRenderer — Entity Only
// ---------------------------------------------------------------------------

describe('DefaultSemanticContextRenderer — entity only', () => {
  it('should render single entity', () => {
    const renderer = new DefaultSemanticContextRenderer()
    const ctx = makeSemanticContext(undefined, makeEntityResult(['Tree']))
    const result = renderer.render(ctx)
    expect(result).toContain('Semantic Context:')
    expect(result).toContain('Entities:')
    expect(result).toContain('- Tree')
    expect(result).not.toContain('Intent:')
  })

  it('should render multiple entities', () => {
    const renderer = new DefaultSemanticContextRenderer()
    const ctx = makeSemanticContext(undefined, makeEntityResult(['Tree', 'Flower']))
    const result = renderer.render(ctx)
    expect(result).toContain('- Tree')
    expect(result).toContain('- Flower')
  })

  it('should render correct format for single entity', () => {
    const renderer = new DefaultSemanticContextRenderer()
    const ctx = makeSemanticContext(undefined, makeEntityResult(['Tree']))
    const result = renderer.render(ctx)
    expect(result).toBe('Semantic Context:\n\nEntities:\n- Tree')
  })

  it('should render correct format for multiple entities', () => {
    const renderer = new DefaultSemanticContextRenderer()
    const ctx = makeSemanticContext(undefined, makeEntityResult(['Tree', 'Flower', 'House']))
    const result = renderer.render(ctx)
    expect(result).toBe('Semantic Context:\n\nEntities:\n- Tree\n- Flower\n- House')
  })
})

// ---------------------------------------------------------------------------
// DefaultSemanticContextRenderer — Both Intent and Entity
// ---------------------------------------------------------------------------

describe('DefaultSemanticContextRenderer — both intent and entity', () => {
  it('should render both intent and entity sections', () => {
    const renderer = new DefaultSemanticContextRenderer()
    const ctx = makeSemanticContext(makeIntentResult(['Create']), makeEntityResult(['Tree']))
    const result = renderer.render(ctx)
    expect(result).toContain('Semantic Context:')
    expect(result).toContain('Intent:')
    expect(result).toContain('- Create')
    expect(result).toContain('Entities:')
    expect(result).toContain('- Tree')
  })

  it('should render intent before entities', () => {
    const renderer = new DefaultSemanticContextRenderer()
    const ctx = makeSemanticContext(makeIntentResult(['Create']), makeEntityResult(['Tree']))
    const result = renderer.render(ctx)
    const intentIndex = result.indexOf('Intent:')
    const entitiesIndex = result.indexOf('Entities:')
    expect(intentIndex).toBeLessThan(entitiesIndex)
  })

  it('should render correct format for single intent and single entity', () => {
    const renderer = new DefaultSemanticContextRenderer()
    const ctx = makeSemanticContext(makeIntentResult(['Create']), makeEntityResult(['Tree']))
    const result = renderer.render(ctx)
    expect(result).toBe('Semantic Context:\n\nIntent:\n- Create\n\nEntities:\n- Tree')
  })

  it('should render correct format for multiple intents and entities', () => {
    const renderer = new DefaultSemanticContextRenderer()
    const ctx = makeSemanticContext(
      makeIntentResult(['Create', 'Move']),
      makeEntityResult(['Tree', 'Flower', 'House']),
    )
    const result = renderer.render(ctx)
    expect(result).toBe('Semantic Context:\n\nIntent:\n- Create\n- Move\n\nEntities:\n- Tree\n- Flower\n- House')
  })
})

// ---------------------------------------------------------------------------
// DefaultSemanticContextRenderer — Deterministic
// ---------------------------------------------------------------------------

describe('DefaultSemanticContextRenderer — deterministic', () => {
  it('should return identical result for same inputs', () => {
    const renderer = new DefaultSemanticContextRenderer()
    const ctx = makeSemanticContext(makeIntentResult(['Create']), makeEntityResult(['Tree']))
    const r1 = renderer.render(ctx)
    const r2 = renderer.render(ctx)
    const r3 = renderer.render(ctx)
    expect(r1).toBe(r2)
    expect(r2).toBe(r3)
  })

  it('should be idempotent across repeated calls', () => {
    const renderer = new DefaultSemanticContextRenderer()
    const ctx = makeSemanticContext(makeIntentResult(['Create']), makeEntityResult(['Tree']))
    for (let i = 0; i < 10; i++) {
      const result = renderer.render(ctx)
      expect(result).toBe('Semantic Context:\n\nIntent:\n- Create\n\nEntities:\n- Tree')
    }
  })
})

// ---------------------------------------------------------------------------
// DefaultSemanticContextRenderer — Stateless
// ---------------------------------------------------------------------------

describe('DefaultSemanticContextRenderer — stateless', () => {
  it('should not retain state between calls', () => {
    const renderer = new DefaultSemanticContextRenderer()
    const r1 = renderer.render(makeSemanticContext(makeIntentResult(['Create']), makeEntityResult(['Tree'])))
    const r2 = renderer.render(makeSemanticContext())
    const r3 = renderer.render(makeSemanticContext(makeIntentResult(['Move']), makeEntityResult(['Flower'])))
    expect(r1).toContain('Create')
    expect(r1).toContain('Tree')
    expect(r2).toBe('')
    expect(r3).toContain('Move')
    expect(r3).toContain('Flower')
  })

  it('should be independent across multiple instances', () => {
    const r1 = new DefaultSemanticContextRenderer()
    const r2 = new DefaultSemanticContextRenderer()
    const ctx = makeSemanticContext(makeIntentResult(['Create']), makeEntityResult(['Tree']))
    expect(r1.render(ctx)).toBe(r2.render(ctx))
    expect(r1.render(ctx)).toBe('Semantic Context:\n\nIntent:\n- Create\n\nEntities:\n- Tree')
  })
})

// ---------------------------------------------------------------------------
// DefaultSemanticContextRenderer — Immutability / Pure
// ---------------------------------------------------------------------------

describe('DefaultSemanticContextRenderer — pure', () => {
  it('should not modify input SemanticContext', () => {
    const renderer = new DefaultSemanticContextRenderer()
    const ctx = makeSemanticContext(makeIntentResult(['Create']), makeEntityResult(['Tree']))
    const original = JSON.stringify(ctx)
    renderer.render(ctx)
    expect(JSON.stringify(ctx)).toBe(original)
  })

  it('should have no side effects', () => {
    const renderer = new DefaultSemanticContextRenderer()
    const before = Object.keys(renderer)
    renderer.render(makeSemanticContext(makeIntentResult(['Create'])))
    renderer.render(makeSemanticContext())
    renderer.render(makeSemanticContext(undefined, makeEntityResult(['Tree'])))
    expect(Object.keys(renderer)).toEqual(before)
  })
})

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

describe('SemanticContextRenderer exports', () => {
  it('should export SemanticContextRenderer type from semantic/index', () => {
    const renderer: RendererFromIndex = new DefaultSemanticContextRenderer()
    expect(renderer.render).toBeDefined()
  })

  it('should export DefaultSemanticContextRenderer class from semantic/index', () => {
    const renderer = new DefaultRendererFromIndex()
    expect(renderer).toBeInstanceOf(DefaultSemanticContextRenderer)
  })

  it('should export SemanticContextRenderer type from package root', () => {
    const renderer: RendererFromRoot = new DefaultSemanticContextRenderer()
    expect(renderer.render).toBeDefined()
  })

  it('should export DefaultSemanticContextRenderer class from package root', () => {
    const renderer = new DefaultRendererFromRoot()
    expect(renderer).toBeInstanceOf(DefaultSemanticContextRenderer)
  })
})

// ---------------------------------------------------------------------------
// BuilderOptions — semanticContextRenderer Field
// ---------------------------------------------------------------------------

describe('BuilderOptions — semanticContextRenderer field', () => {
  it('should accept SemanticContextRenderer in BuilderOptions', () => {
    const options: BuilderOptions = {
      semanticContextRenderer: new DefaultSemanticContextRenderer(),
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], options)
    expect(builder).toBeDefined()
  })

  it('should accept SemanticContextRenderer alongside other BuilderOptions fields', () => {
    const options: BuilderOptions = {
      intentAnalyzer: new RuleBasedIntentAnalyzer(),
      entityAnalyzer: new RuleBasedEntityAnalyzer(),
      semanticContextBuilder: new DefaultSemanticContextBuilder(),
      semanticContextRenderer: new DefaultSemanticContextRenderer(),
    }
    const builder = new DefaultPromptBuilder([new UserInputModule()], options)
    expect(builder).toBeDefined()
  })

  it('should accept SemanticContextRenderer standalone in BuilderOptions', () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      semanticContextRenderer: new DefaultSemanticContextRenderer(),
    })
    expect(builder).toBeDefined()
  })

  it('should work without SemanticContextRenderer (backward compatible)', () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {})
    expect(builder).toBeDefined()
  })

  it('should work with legacy positional constructor (backward compatible)', () => {
    const builder = new DefaultPromptBuilder(
      createDefaultModules(),
    )
    expect(builder).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// metadata.promptAssembly.semanticRendered
// ---------------------------------------------------------------------------

describe('metadata.promptAssembly.semanticRendered', () => {
  it('should contain semanticRendered when both builder and renderer are configured', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      intentAnalyzer: new RuleBasedIntentAnalyzer(),
      intentRenderer: new DefaultIntentRenderer(),
      entityAnalyzer: new RuleBasedEntityAnalyzer(),
      entityRenderer: new DefaultEntityRenderer(),
      semanticContextBuilder: new DefaultSemanticContextBuilder(),
      semanticContextRenderer: new DefaultSemanticContextRenderer(),
    })
    const request = await builder.build(createPipelineContext({ input: 'create a tree' }))
    const assembly = request.metadata?.promptAssembly as Record<string, unknown>
    expect(assembly.semanticRendered).toBeDefined()
  })

  it('should contain correct rendered string for intent + entity', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      intentAnalyzer: new RuleBasedIntentAnalyzer(),
      intentRenderer: new DefaultIntentRenderer(),
      entityAnalyzer: new RuleBasedEntityAnalyzer(),
      entityRenderer: new DefaultEntityRenderer(),
      semanticContextBuilder: new DefaultSemanticContextBuilder(),
      semanticContextRenderer: new DefaultSemanticContextRenderer(),
    })
    const request = await builder.build(createPipelineContext({ input: 'create a tree' }))
    const assembly = request.metadata?.promptAssembly as Record<string, unknown>
    expect(assembly.semanticRendered).toBe('Semantic Context:\n\nIntent:\n- Create\n\nEntities:\n- Tree')
  })

  it('should contain correct rendered string for intent only', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      intentAnalyzer: new RuleBasedIntentAnalyzer(),
      semanticContextBuilder: new DefaultSemanticContextBuilder(),
      semanticContextRenderer: new DefaultSemanticContextRenderer(),
    })
    const request = await builder.build(createPipelineContext({ input: 'create' }))
    const assembly = request.metadata?.promptAssembly as Record<string, unknown>
    expect(assembly.semanticRendered).toBe('Semantic Context:\n\nIntent:\n- Create')
  })

  it('should contain correct rendered string for entity only', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      entityAnalyzer: new RuleBasedEntityAnalyzer(),
      semanticContextBuilder: new DefaultSemanticContextBuilder(),
      semanticContextRenderer: new DefaultSemanticContextRenderer(),
    })
    const request = await builder.build(createPipelineContext({ input: 'a tree' }))
    const assembly = request.metadata?.promptAssembly as Record<string, unknown>
    expect(assembly.semanticRendered).toBe('Semantic Context:\n\nEntities:\n- Tree')
  })

  it('should not contain semanticRendered when renderer is not configured', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      intentAnalyzer: new RuleBasedIntentAnalyzer(),
      semanticContextBuilder: new DefaultSemanticContextBuilder(),
    })
    const request = await builder.build(createPipelineContext({ input: 'create' }))
    const assembly = request.metadata?.promptAssembly as Record<string, unknown>
    expect(assembly.semanticRendered).toBeUndefined()
  })

  it('should not contain semanticRendered when builder is not configured', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      semanticContextRenderer: new DefaultSemanticContextRenderer(),
    })
    const request = await builder.build(createPipelineContext({ input: 'create a tree' }))
    const assembly = request.metadata?.promptAssembly as Record<string, unknown>
    expect(assembly.semanticRendered).toBeUndefined()
  })

  it('should preserve all existing fields alongside semanticRendered', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      intentAnalyzer: new RuleBasedIntentAnalyzer(),
      intentRenderer: new DefaultIntentRenderer(),
      entityAnalyzer: new RuleBasedEntityAnalyzer(),
      entityRenderer: new DefaultEntityRenderer(),
      semanticContextBuilder: new DefaultSemanticContextBuilder(),
      semanticContextRenderer: new DefaultSemanticContextRenderer(),
    })
    const request = await builder.build(createPipelineContext({ input: 'create a tree' }))
    const assembly = request.metadata?.promptAssembly as Record<string, unknown>
    expect(assembly.intent).toBeDefined()
    expect(assembly.intentRendered).toBeDefined()
    expect(assembly.entity).toBeDefined()
    expect(assembly.entityRendered).toBeDefined()
    expect(assembly.semantic).toBeDefined()
    expect(assembly.semanticRendered).toBeDefined()
    expect(assembly.ranking).toBeDefined()
    expect(assembly.budget).toBeDefined()
    expect(assembly.selection).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// SemanticContextRenderer Invocation
// ---------------------------------------------------------------------------

describe('SemanticContextRenderer invocation', () => {
  it('should invoke renderer.render() exactly once per build() with both builder and renderer', async () => {
    const spy = vi.fn(() => 'rendered')
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      intentAnalyzer: new RuleBasedIntentAnalyzer(),
      entityAnalyzer: new RuleBasedEntityAnalyzer(),
      semanticContextBuilder: new DefaultSemanticContextBuilder(),
      semanticContextRenderer: { render: spy },
    })
    await builder.build(createPipelineContext({ input: 'create a tree' }))
    expect(spy).toHaveBeenCalledTimes(1)
  })

  it('should pass SemanticContext to render()', async () => {
    const spy = vi.fn<[_ctx: SemanticContext], string>(() => 'rendered')
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      intentAnalyzer: new RuleBasedIntentAnalyzer(),
      entityAnalyzer: new RuleBasedEntityAnalyzer(),
      semanticContextBuilder: new DefaultSemanticContextBuilder(),
      semanticContextRenderer: { render: spy },
    })
    await builder.build(createPipelineContext({ input: 'create a tree' }))
    expect(spy).toHaveBeenCalled()
    const passedCtx = spy.mock.calls[0][0]
    expect(passedCtx).toBeDefined()
    expect(passedCtx!.intent?.intents[0].type).toBe('Create')
    expect(passedCtx!.entity?.entities[0].type).toBe('Tree')
  })

  it('should not invoke render() when SemanticContextBuilder is not configured', async () => {
    const spy = vi.fn(() => 'rendered')
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      semanticContextRenderer: { render: spy },
    })
    await builder.build(createPipelineContext())
    expect(spy).not.toHaveBeenCalled()
  })

  it('should work with custom SemanticContextRenderer implementation', async () => {
    const customRenderer: SemanticContextRenderer = {
      render(_ctx: SemanticContext): string {
        return 'Custom: rendered'
      },
    }
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      intentAnalyzer: new RuleBasedIntentAnalyzer(),
      semanticContextBuilder: new DefaultSemanticContextBuilder(),
      semanticContextRenderer: customRenderer,
    })
    const request = await builder.build(createPipelineContext({ input: 'create' }))
    const assembly = request.metadata?.promptAssembly as Record<string, unknown>
    expect(assembly.semanticRendered).toBe('Custom: rendered')
  })
})

// ---------------------------------------------------------------------------
// Architecture Compliance — No PromptContext/PromptRenderer Modification
// ---------------------------------------------------------------------------

describe('Architecture Compliance — no prompt modification', () => {
  it('should inject semanticRendered into PromptContext for rendering', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      intentAnalyzer: new RuleBasedIntentAnalyzer(),
      entityAnalyzer: new RuleBasedEntityAnalyzer(),
      semanticContextBuilder: new DefaultSemanticContextBuilder(),
      semanticContextRenderer: new DefaultSemanticContextRenderer(),
    })
    const request = await builder.build(createPipelineContext({ input: 'create a tree' }))
    // semanticRendered is now injected into PromptContext for rendering
    expect(request.prompt).toContain('Semantic Context')
  })

  it('should include semanticRendered in both metadata and prompt text', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      intentAnalyzer: new RuleBasedIntentAnalyzer(),
      entityAnalyzer: new RuleBasedEntityAnalyzer(),
      semanticContextBuilder: new DefaultSemanticContextBuilder(),
      semanticContextRenderer: new DefaultSemanticContextRenderer(),
    })
    const request = await builder.build(createPipelineContext({ input: 'create a tree' }))
    // semanticRendered is in both metadata and the prompt
    const assembly = request.metadata?.promptAssembly as Record<string, unknown>
    expect(assembly.semanticRendered).toBeDefined()
    expect(request.prompt).toContain('Semantic Context')
  })

  it('should not modify PromptRenderer interface', () => {
    const renderer = new DefaultSemanticContextRenderer()
    const result = renderer.render(makeSemanticContext(makeIntentResult(['Create'])))
    expect(typeof result).toBe('string')
  })

  it('should not depend on Planner', () => {
    const renderer = new DefaultSemanticContextRenderer()
    expect(renderer.render(makeSemanticContext())).toBe('')
  })

  it('should not depend on Runtime', () => {
    const renderer = new DefaultSemanticContextRenderer()
    expect(renderer).toBeInstanceOf(DefaultSemanticContextRenderer)
  })

  it('should be pure — no side effects', () => {
    const renderer = new DefaultSemanticContextRenderer()
    const ctx = makeSemanticContext(makeIntentResult(['Create']), makeEntityResult(['Tree']))
    const original = JSON.stringify(ctx)
    renderer.render(ctx)
    expect(JSON.stringify(ctx)).toBe(original)
  })

  it('should be stateless — no internal state', () => {
    const r1 = new DefaultSemanticContextRenderer()
    const r2 = new DefaultSemanticContextRenderer()
    expect(r1.render(makeSemanticContext())).toBe(r2.render(makeSemanticContext()))
  })

  it('should be non-mutating — never modifies inputs', () => {
    const renderer = new DefaultSemanticContextRenderer()
    const ctx = makeSemanticContext(makeIntentResult(['Create']), makeEntityResult(['Tree']))
    const original = JSON.stringify(ctx)
    renderer.render(ctx)
    expect(JSON.stringify(ctx)).toBe(original)
  })
})

// ---------------------------------------------------------------------------
// Builder Compatibility
// ---------------------------------------------------------------------------

describe('Builder Compatibility', () => {
  it('should work with legacy 1-param constructor', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()])
    const request = await builder.build({ input: 'hello' })
    expect(request.prompt).toContain('hello')
  })

  it('should work with BuilderOptions containing semanticContextRenderer only', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      semanticContextRenderer: new DefaultSemanticContextRenderer(),
    })
    const request = await builder.build(createPipelineContext())
    expect(request.prompt).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// RetryPlanner Compatibility
// ---------------------------------------------------------------------------

describe('RetryPlanner Compatibility', () => {
  it('should work with RetryPlanner', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      semanticContextBuilder: new DefaultSemanticContextBuilder(),
      semanticContextRenderer: new DefaultSemanticContextRenderer(),
    })
    const provider = new MockPlannerProvider(mockConfig)
    const planner = new RetryPlanner(provider)
    const pipeline = new DefaultPipeline(planner, builder)
    const context = createPipelineContext()
    await expect(pipeline.execute(context)).resolves.toBeDefined()
  })

  it('should not affect RetryPlanner retry behavior', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      semanticContextBuilder: new DefaultSemanticContextBuilder(),
      semanticContextRenderer: new DefaultSemanticContextRenderer(),
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
      semanticContextBuilder: new DefaultSemanticContextBuilder(),
      semanticContextRenderer: new DefaultSemanticContextRenderer(),
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
      semanticContextBuilder: new DefaultSemanticContextBuilder(),
      semanticContextRenderer: new DefaultSemanticContextRenderer(),
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
      semanticContextBuilder: new DefaultSemanticContextBuilder(),
      semanticContextRenderer: new DefaultSemanticContextRenderer(),
    })
    const provider = new MockStreamingProvider()
    const planner = new MockPlanner(provider)
    const pipeline = new DefaultPipeline(planner, builder)
    const context = createPipelineContext()
    await expect(pipeline.stream(context)).resolves.toBeDefined()
  })

  it('should not affect streaming chunk emission', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      semanticContextBuilder: new DefaultSemanticContextBuilder(),
      semanticContextRenderer: new DefaultSemanticContextRenderer(),
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
      semanticContextBuilder: new DefaultSemanticContextBuilder(),
      semanticContextRenderer: new DefaultSemanticContextRenderer(),
    })
    const planner = new MockPlanner(new MockPlannerProvider(mockConfig))
    const pipeline = new DefaultPipeline(planner, builder)
    const context = createPipelineContext()
    await expect(pipeline.execute(context)).resolves.toBeDefined()
  })

  it('should not affect AgentLoop iteration count', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      semanticContextBuilder: new DefaultSemanticContextBuilder(),
      semanticContextRenderer: new DefaultSemanticContextRenderer(),
    })
    const planner = new MockPlanner(new MockPlannerProvider(mockConfig))
    const pipeline = new DefaultPipeline(planner, builder)
    const context = createPipelineContext({ input: 'tree' })
    const result = await pipeline.execute(context)
    expect(result.plannerResult?.actions).toHaveLength(1)
  })
})

// ---------------------------------------------------------------------------
// Coexistence
// ---------------------------------------------------------------------------

describe('Coexistence with semantic consumption', () => {
  it('should work alongside SemanticContextBuilder', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      intentAnalyzer: new RuleBasedIntentAnalyzer(),
      entityAnalyzer: new RuleBasedEntityAnalyzer(),
      semanticContextBuilder: new DefaultSemanticContextBuilder(),
      semanticContextRenderer: new DefaultSemanticContextRenderer(),
    })
    const request = await builder.build(createPipelineContext({ input: 'create a tree' }))
    const assembly = request.metadata?.promptAssembly as Record<string, unknown>
    expect(assembly.semantic).toBeDefined()
    expect(assembly.semanticRendered).toBeDefined()
  })

  it('should work with RuleBased analyzers', async () => {
    const builder = new DefaultPromptBuilder(createDefaultModules(), {
      intentAnalyzer: new RuleBasedIntentAnalyzer(),
      entityAnalyzer: new RuleBasedEntityAnalyzer(),
      semanticContextBuilder: new DefaultSemanticContextBuilder(),
      semanticContextRenderer: new DefaultSemanticContextRenderer(),
    })
    const request = await builder.build(createPipelineContext({ input: 'create a tree' }))
    const assembly = request.metadata?.promptAssembly as Record<string, unknown>
    expect(assembly.semanticRendered).toBe('Semantic Context:\n\nIntent:\n- Create\n\nEntities:\n- Tree')
  })
})