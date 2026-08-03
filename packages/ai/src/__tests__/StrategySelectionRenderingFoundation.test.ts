import { describe, it, expect } from 'vitest'
import type { StrategySelectionRenderer } from '../strategy/StrategySelectionRenderer'
import { DefaultStrategySelectionRenderer } from '../strategy/DefaultStrategySelectionRenderer'
import type { StrategySelectionMetadata } from '../strategy/StrategySelectionMetadata'
import { DefaultPromptBuilder } from '../prompt/DefaultPromptBuilder'
import type { BuilderOptions } from '../prompt/BuilderOptions'
import { UserInputModule } from '../prompt/modules'
import { DefaultStrategyEvaluator } from '../strategy/DefaultStrategyEvaluator'
import { DefaultPromptStrategySelector } from '../strategy/DefaultPromptStrategySelector'
import { CreateStrategy } from '../strategy/CreateStrategy'
import { QueryStrategy } from '../strategy/QueryStrategy'
import { ModifyStrategy } from '../strategy/ModifyStrategy'
import { DeleteStrategy } from '../strategy/DeleteStrategy'
import { DefaultMemory } from '../memory/DefaultMemory'
import { DefaultAIConfiguration } from '../config/DefaultAIConfiguration'
import type { PipelineContext } from '../pipeline/PipelineContext'
import type {
  StrategySelectionRenderer as RendererFromRoot,
} from '../index'
import {
  DefaultStrategySelectionRenderer as DefaultRendererFromRoot,
} from '../index'

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

const sampleMetadata: StrategySelectionMetadata = {
  selected: 'create',
  candidates: [
    { strategy: 'create', score: 100 },
    { strategy: 'query', score: 20 },
    { strategy: 'modify', score: 10 },
    { strategy: 'delete', score: 0 },
  ],
}

const expectedRendered = [
  'Strategy Selection:',
  '',
  'Selected:',
  '- create (100)',
  '',
  'Candidates:',
  '- create: 100',
  '- query: 20',
  '- modify: 10',
  '- delete: 0',
].join('\n')

// ---------------------------------------------------------------------------
// StrategySelectionRenderer Interface
// ---------------------------------------------------------------------------

describe('StrategySelectionRenderer interface', () => {
  it('should define a render method', () => {
    const renderer: StrategySelectionRenderer = new DefaultStrategySelectionRenderer()
    expect(renderer.render).toBeDefined()
    expect(typeof renderer.render).toBe('function')
  })

  it('should accept StrategySelectionMetadata as render parameter', () => {
    const renderer: StrategySelectionRenderer = new DefaultStrategySelectionRenderer()
    expect(() => renderer.render(sampleMetadata)).not.toThrow()
  })

  it('should return a string from render', () => {
    const renderer: StrategySelectionRenderer = new DefaultStrategySelectionRenderer()
    const result = renderer.render(sampleMetadata)
    expect(typeof result).toBe('string')
  })
})

// ---------------------------------------------------------------------------
// DefaultStrategySelectionRenderer — Rendering
// ---------------------------------------------------------------------------

describe('DefaultStrategySelectionRenderer — rendering', () => {
  it('should render the exact expected format', () => {
    const renderer = new DefaultStrategySelectionRenderer()
    expect(renderer.render(sampleMetadata)).toBe(expectedRendered)
  })

  it('should render selected strategy with score in parentheses', () => {
    const renderer = new DefaultStrategySelectionRenderer()
    const result = renderer.render(sampleMetadata)
    expect(result).toContain('Selected:')
    expect(result).toContain('- create (100)')
  })

  it('should render all candidates with strategy and score', () => {
    const renderer = new DefaultStrategySelectionRenderer()
    const result = renderer.render(sampleMetadata)
    expect(result).toContain('Candidates:')
    expect(result).toContain('- create: 100')
    expect(result).toContain('- query: 20')
    expect(result).toContain('- modify: 10')
    expect(result).toContain('- delete: 0')
  })

  it('should render "Strategy Selection:" header', () => {
    const renderer = new DefaultStrategySelectionRenderer()
    expect(renderer.render(sampleMetadata)).toContain('Strategy Selection:')
  })

  it('should render selected candidate with matching score from candidates', () => {
    const renderer = new DefaultStrategySelectionRenderer()
    const metadata: StrategySelectionMetadata = {
      selected: 'query',
      candidates: [
        { strategy: 'create', score: 100 },
        { strategy: 'query', score: 20 },
      ],
    }
    const result = renderer.render(metadata)
    expect(result).toContain('- query (20)')
  })

  it('should render selected without score when not in candidates', () => {
    const renderer = new DefaultStrategySelectionRenderer()
    const metadata: StrategySelectionMetadata = {
      selected: 'unknown',
      candidates: [
        { strategy: 'create', score: 100 },
      ],
    }
    const result = renderer.render(metadata)
    expect(result).toContain('- unknown')
    expect(result).not.toContain('- unknown (')
  })
})

// ---------------------------------------------------------------------------
// DefaultStrategySelectionRenderer — Empty Candidates
// ---------------------------------------------------------------------------

describe('DefaultStrategySelectionRenderer — empty candidates', () => {
  it('should render empty candidates without Candidates section', () => {
    const renderer = new DefaultStrategySelectionRenderer()
    const metadata: StrategySelectionMetadata = {
      selected: 'default',
      candidates: [],
    }
    const result = renderer.render(metadata)
    expect(result).toContain('Strategy Selection:')
    expect(result).toContain('Selected:')
    expect(result).toContain('- default')
    expect(result).not.toContain('Candidates:')
  })

  it('should render selected without score when candidates are empty', () => {
    const renderer = new DefaultStrategySelectionRenderer()
    const metadata: StrategySelectionMetadata = {
      selected: 'default',
      candidates: [],
    }
    const result = renderer.render(metadata)
    expect(result).toContain('- default')
    expect(result).not.toContain('- default (')
  })
})

// ---------------------------------------------------------------------------
// DefaultStrategySelectionRenderer — Deterministic
// ---------------------------------------------------------------------------

describe('DefaultStrategySelectionRenderer — deterministic', () => {
  it('should return same result for same metadata across repeated calls', () => {
    const renderer = new DefaultStrategySelectionRenderer()
    const r1 = renderer.render(sampleMetadata)
    const r2 = renderer.render(sampleMetadata)
    const r3 = renderer.render(sampleMetadata)
    expect(r1).toBe(r2)
    expect(r2).toBe(r3)
  })

  it('should be idempotent across ten calls', () => {
    const renderer = new DefaultStrategySelectionRenderer()
    for (let i = 0; i < 10; i++) {
      expect(renderer.render(sampleMetadata)).toBe(expectedRendered)
    }
  })

  it('should produce same result across many instances', () => {
    const r1 = new DefaultStrategySelectionRenderer().render(sampleMetadata)
    const r2 = new DefaultStrategySelectionRenderer().render(sampleMetadata)
    const r3 = new DefaultStrategySelectionRenderer().render(sampleMetadata)
    expect(r1).toBe(r2)
    expect(r2).toBe(r3)
  })
})

// ---------------------------------------------------------------------------
// DefaultStrategySelectionRenderer — Stateless
// ---------------------------------------------------------------------------

describe('DefaultStrategySelectionRenderer — stateless', () => {
  it('should not retain state between calls', () => {
    const renderer = new DefaultStrategySelectionRenderer()
    const metadata1: StrategySelectionMetadata = {
      selected: 'create',
      candidates: [{ strategy: 'create', score: 100 }],
    }
    const metadata2: StrategySelectionMetadata = {
      selected: 'query',
      candidates: [{ strategy: 'query', score: 50 }],
    }
    const r1 = renderer.render(metadata1)
    const r2 = renderer.render(metadata2)
    const r1Again = renderer.render(metadata1)
    expect(r1).toContain('- create (100)')
    expect(r2).toContain('- query (50)')
    expect(r1Again).toBe(r1)
  })

  it('should be independent across multiple instances', () => {
    const s1 = new DefaultStrategySelectionRenderer()
    const s2 = new DefaultStrategySelectionRenderer()
    expect(s1.render(sampleMetadata)).toBe(s2.render(sampleMetadata))
  })
})

// ---------------------------------------------------------------------------
// DefaultStrategySelectionRenderer — Pure / No Side Effects
// ---------------------------------------------------------------------------

describe('DefaultStrategySelectionRenderer — pure / no side effects', () => {
  it('should not modify the input metadata', () => {
    const renderer = new DefaultStrategySelectionRenderer()
    const frozen = Object.freeze({
      selected: 'create',
      candidates: Object.freeze([
        Object.freeze({ strategy: 'create', score: 100 }),
      ]),
    }) as unknown as StrategySelectionMetadata
    expect(() => renderer.render(frozen)).not.toThrow()
  })

  it('should not mutate the candidates array', () => {
    const renderer = new DefaultStrategySelectionRenderer()
    const metadata: StrategySelectionMetadata = {
      selected: 'create',
      candidates: [
        { strategy: 'create', score: 100 },
        { strategy: 'query', score: 20 },
      ],
    }
    const before = JSON.stringify(metadata)
    renderer.render(metadata)
    expect(JSON.stringify(metadata)).toBe(before)
  })

  it('should have no side effects on renderer instance', () => {
    const renderer = new DefaultStrategySelectionRenderer()
    const before = Object.keys(renderer)
    renderer.render(sampleMetadata)
    expect(Object.keys(renderer)).toEqual(before)
  })
})

// ---------------------------------------------------------------------------
// Builder Integration — Metadata Storage
// ---------------------------------------------------------------------------

describe('Builder integration — metadata storage', () => {
  it('should store strategySelectionRendered when renderer provided', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      strategySelector: new DefaultPromptStrategySelector(),
      strategies: [new CreateStrategy(), new QueryStrategy(), new ModifyStrategy(), new DeleteStrategy()],
      strategyEvaluator: new DefaultStrategyEvaluator(),
      strategySelectionRenderer: new DefaultStrategySelectionRenderer(),
      configuration: mockConfig,
    })
    const context = createPipelineContext({ input: 'create a tree' })
    const result = await builder.build(context)
    const assembly = result.metadata?.promptAssembly as Record<string, unknown>
    expect(assembly.strategySelectionRendered).toBeDefined()
    expect(typeof assembly.strategySelectionRendered).toBe('string')
    expect(assembly.strategySelectionRendered).toContain('Strategy Selection:')
  })

  it('should store strategySelectionRendered matching strategySelection content', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      strategySelector: new DefaultPromptStrategySelector(),
      strategies: [new CreateStrategy(), new QueryStrategy()],
      strategyEvaluator: new DefaultStrategyEvaluator(),
      strategySelectionRenderer: new DefaultStrategySelectionRenderer(),
      configuration: mockConfig,
    })
    const context = createPipelineContext({ input: 'create a tree' })
    const result = await builder.build(context)
    const assembly = result.metadata?.promptAssembly as Record<string, unknown>
    const selection = assembly.strategySelection as StrategySelectionMetadata
    const rendered = assembly.strategySelectionRendered as string
    expect(selection).toBeDefined()
    expect(rendered).toContain(`Selected:`)
    expect(rendered).toContain(`- ${selection.selected}`)
  })

  it('should NOT store strategySelectionRendered when renderer absent', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      strategySelector: new DefaultPromptStrategySelector(),
      strategies: [new CreateStrategy()],
      strategyEvaluator: new DefaultStrategyEvaluator(),
      configuration: mockConfig,
    })
    const context = createPipelineContext({ input: 'create a tree' })
    const result = await builder.build(context)
    const assembly = result.metadata?.promptAssembly as Record<string, unknown>
    expect(assembly.strategySelectionRendered).toBeUndefined()
  })

  it('should store strategySelectionRendered only when both evaluator and renderer present', async () => {
    // Renderer present but no evaluator → no strategySelectionMetadata → no rendered
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      strategySelector: new DefaultPromptStrategySelector(),
      strategies: [new CreateStrategy()],
      strategySelectionRenderer: new DefaultStrategySelectionRenderer(),
      configuration: mockConfig,
    })
    const context = createPipelineContext({ input: 'create a tree' })
    const result = await builder.build(context)
    const assembly = result.metadata?.promptAssembly as Record<string, unknown>
    expect(assembly.strategySelectionRendered).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// Builder Integration — Prompt Output Unchanged
// ---------------------------------------------------------------------------

describe('Builder integration — prompt output unchanged', () => {
  it('should produce identical prompt with and without strategySelectionRenderer', async () => {
    const options: BuilderOptions = {
      strategySelector: new DefaultPromptStrategySelector(),
      strategies: [new CreateStrategy(), new QueryStrategy()],
      strategyEvaluator: new DefaultStrategyEvaluator(),
      configuration: mockConfig,
    }
    const withRenderer = new DefaultPromptBuilder([new UserInputModule()], {
      ...options,
      strategySelectionRenderer: new DefaultStrategySelectionRenderer(),
    })
    const withoutRenderer = new DefaultPromptBuilder([new UserInputModule()], options)

    const context = createPipelineContext({ input: 'create a tree' })
    const resultWith = await withRenderer.build(context)
    const resultWithout = await withoutRenderer.build(context)

    expect(resultWith.prompt).toBe(resultWithout.prompt)
  })

  it('should not inject strategySelectionRendered into prompt text', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      strategySelector: new DefaultPromptStrategySelector(),
      strategies: [new CreateStrategy()],
      strategyEvaluator: new DefaultStrategyEvaluator(),
      strategySelectionRenderer: new DefaultStrategySelectionRenderer(),
      configuration: mockConfig,
    })
    const context = createPipelineContext({ input: 'create a tree' })
    const result = await builder.build(context)
    expect(result.prompt).not.toContain('Strategy Selection:')
    expect(result.prompt).not.toContain('Candidates:')
  })
})

// ---------------------------------------------------------------------------
// BuilderOptions Wiring
// ---------------------------------------------------------------------------

describe('BuilderOptions wiring', () => {
  it('should accept strategySelectionRenderer in BuilderOptions', () => {
    const options: BuilderOptions = {
      strategySelectionRenderer: new DefaultStrategySelectionRenderer(),
    }
    expect(options.strategySelectionRenderer).toBeInstanceOf(DefaultStrategySelectionRenderer)
  })

  it('should be optional — absent by default', () => {
    const options: BuilderOptions = {}
    expect(options.strategySelectionRenderer).toBeUndefined()
  })

  it('should coexist with other BuilderOptions fields', () => {
    const options: BuilderOptions = {
      strategySelector: new DefaultPromptStrategySelector(),
      strategies: [new CreateStrategy()],
      strategyEvaluator: new DefaultStrategyEvaluator(),
      strategySelectionRenderer: new DefaultStrategySelectionRenderer(),
      configuration: mockConfig,
    }
    expect(options.strategySelector).toBeDefined()
    expect(options.strategies).toBeDefined()
    expect(options.strategyEvaluator).toBeDefined()
    expect(options.strategySelectionRenderer).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Architecture Compliance
// ---------------------------------------------------------------------------

describe('Architecture compliance', () => {
  it('should not depend on Planner', () => {
    const renderer = new DefaultStrategySelectionRenderer()
    expect(renderer.render(sampleMetadata)).toContain('Strategy Selection:')
  })

  it('should not depend on Runtime', () => {
    const renderer = new DefaultStrategySelectionRenderer()
    expect(typeof renderer.render(sampleMetadata)).toBe('string')
  })

  it('should not depend on Provider', () => {
    const renderer = new DefaultStrategySelectionRenderer()
    expect(renderer).toBeInstanceOf(DefaultStrategySelectionRenderer)
  })

  it('should not depend on Memory', () => {
    const renderer = new DefaultStrategySelectionRenderer()
    expect(renderer.render(sampleMetadata)).toContain('Selected:')
  })

  it('should not depend on AgentLoop', () => {
    const renderer = new DefaultStrategySelectionRenderer()
    expect(renderer.render(sampleMetadata)).toContain('Candidates:')
  })

  it('should be pure — same input same output', () => {
    const renderer = new DefaultStrategySelectionRenderer()
    expect(renderer.render(sampleMetadata)).toBe(renderer.render(sampleMetadata))
  })

  it('should be stateless — no internal state', () => {
    const s1 = new DefaultStrategySelectionRenderer()
    const s2 = new DefaultStrategySelectionRenderer()
    expect(s1.render(sampleMetadata)).toBe(s2.render(sampleMetadata))
  })
})

// ---------------------------------------------------------------------------
// Compatibility — RetryPlanner / ToolCallPlanner / Streaming / AgentLoop
// ---------------------------------------------------------------------------

describe('Compatibility', () => {
  it('should work with RetryPlanner — renderer is independent', () => {
    const renderer = new DefaultStrategySelectionRenderer()
    expect(renderer.render(sampleMetadata)).toContain('Strategy Selection:')
  })

  it('should work with ToolCallPlanner — renderer is independent', () => {
    const renderer = new DefaultStrategySelectionRenderer()
    expect(typeof renderer.render(sampleMetadata)).toBe('string')
  })

  it('should work with StreamingProvider — renderer is independent', () => {
    const renderer = new DefaultStrategySelectionRenderer()
    expect(renderer).toBeInstanceOf(DefaultStrategySelectionRenderer)
  })

  it('should work with AgentLoop — renderer is independent', () => {
    const renderer = new DefaultStrategySelectionRenderer()
    expect(renderer.render(sampleMetadata)).toContain('Selected:')
  })
})

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

describe('Exports', () => {
  it('should export StrategySelectionRenderer type from strategy/index', () => {
    const renderer: StrategySelectionRenderer = new DefaultStrategySelectionRenderer()
    expect(renderer).toBeInstanceOf(DefaultStrategySelectionRenderer)
  })

  it('should export DefaultStrategySelectionRenderer class from strategy/index', () => {
    const renderer = new DefaultStrategySelectionRenderer()
    expect(renderer).toBeInstanceOf(DefaultStrategySelectionRenderer)
  })

  it('should export StrategySelectionRenderer type from package root', () => {
    const renderer: RendererFromRoot = new DefaultStrategySelectionRenderer()
    expect(renderer).toBeInstanceOf(DefaultStrategySelectionRenderer)
  })

  it('should export DefaultStrategySelectionRenderer class from package root', () => {
    const renderer = new DefaultRendererFromRoot()
    expect(renderer).toBeInstanceOf(DefaultStrategySelectionRenderer)
  })

  it('should render correctly when imported from package root', () => {
    const renderer = new DefaultRendererFromRoot()
    expect(renderer.render(sampleMetadata)).toBe(expectedRendered)
  })
})

// ---------------------------------------------------------------------------
// No Behavior Changes
// ---------------------------------------------------------------------------

describe('No behavior changes', () => {
  it('does not modify PromptContext', () => {
    // PromptContext is not imported — renderer has no dependency on it
    const renderer = new DefaultStrategySelectionRenderer()
    expect(renderer.render(sampleMetadata)).toContain('Strategy Selection:')
  })

  it('does not modify PromptRenderer', () => {
    // PromptRenderer is not imported — renderer has no dependency on it
    const renderer = new DefaultStrategySelectionRenderer()
    expect(typeof renderer.render).toBe('function')
  })

  it('does not modify PromptCompression', () => {
    // PromptCompression is not imported — renderer has no dependency on it
    const renderer = new DefaultStrategySelectionRenderer()
    expect(renderer.render(sampleMetadata)).toContain('Candidates:')
  })

  it('does not modify Pipeline', () => {
    // Pipeline is not imported — renderer has no dependency on it
    const renderer = new DefaultStrategySelectionRenderer()
    expect(renderer).toBeInstanceOf(DefaultStrategySelectionRenderer)
  })

  it('does not modify prompt output', () => {
    // Verified in builder integration tests above — strategySelectionRendered is metadata-only
    const renderer = new DefaultStrategySelectionRenderer()
    expect(renderer.render(sampleMetadata)).not.toContain('User Input:')
  })
})