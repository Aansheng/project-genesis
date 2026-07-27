import { describe, it, expect } from 'vitest'
import { RuleBasedEntityAnalyzer } from '../entity/RuleBasedEntityAnalyzer'
import type { EntityAnalyzer } from '../entity/EntityAnalyzer'
import type { EntityType } from '../entity/EntityType'
import { DefaultEntityAnalyzer } from '../entity/DefaultEntityAnalyzer'
import { RuleBasedEntityAnalyzer as RuleBasedFromRoot } from '../index'
import type { EntityAnalyzer as EntityAnalyzerFromRoot } from '../index'
import { DefaultPipeline } from '../pipeline/DefaultPipeline'
import { DefaultPromptBuilder } from '../prompt/DefaultPromptBuilder'
import type { PromptModule } from '../prompt/modules/PromptModule'
import {
  UserInputModule,
} from '../prompt/modules'
import { DefaultMemory } from '../memory/DefaultMemory'
import { MockPlanner, RetryPlanner, ToolCallPlanner } from '../planner'
import { MockPlannerProvider, MockStreamingProvider } from '../provider'
import { DefaultAIConfiguration } from '../config'
import { RetryPolicy } from '../retry/RetryPolicy'
import { DefaultToolRegistry } from '../tools/ToolRegistry'
import type { ToolRegistry } from '../tools'
import type { PipelineContext } from '../pipeline/PipelineContext'
import type { Planner } from '../planner/Planner'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createAnalyzer(): RuleBasedEntityAnalyzer {
  return new RuleBasedEntityAnalyzer()
}

function assertEntities(input: string, expected: EntityType[]): void {
  const analyzer = createAnalyzer()
  const result = analyzer.analyze(input)
  expect(result.entities.map(e => e.type)).toEqual(expected)
}

function assertEmpty(input: string): void {
  const analyzer = createAnalyzer()
  const result = analyzer.analyze(input)
  expect(result.entities).toEqual([])
}

function createPipelineContext(overrides?: Partial<PipelineContext>): PipelineContext {
  return {
    input: 'place a tree',
    memory: new DefaultMemory(),
    worldState: '',
    ...overrides,
  }
}

const mockConfig = new DefaultAIConfiguration()

// ---------------------------------------------------------------------------
// Entity Recognition — Tree
// ---------------------------------------------------------------------------

describe('RuleBasedEntityAnalyzer — Tree', () => {
  it('should detect Tree from Chinese: 树', () => {
    assertEntities('树', ['Tree'])
  })

  it('should detect Tree from Chinese: 树木', () => {
    assertEntities('树木', ['Tree'])
  })

  it('should detect Tree from Chinese: 大树', () => {
    assertEntities('大树', ['Tree'])
  })

  it('should detect Tree from Chinese: 小树', () => {
    assertEntities('小树', ['Tree'])
  })

  it('should detect Tree from English: tree', () => {
    assertEntities('tree', ['Tree'])
  })
})

// ---------------------------------------------------------------------------
// Entity Recognition — Flower
// ---------------------------------------------------------------------------

describe('RuleBasedEntityAnalyzer — Flower', () => {
  it('should detect Flower from Chinese: 花', () => {
    assertEntities('花', ['Flower'])
  })

  it('should detect Flower from Chinese: 鲜花', () => {
    assertEntities('鲜花', ['Flower'])
  })

  it('should detect Flower from Chinese: 花朵', () => {
    assertEntities('花朵', ['Flower'])
  })

  it('should detect Flower from English: flower', () => {
    assertEntities('flower', ['Flower'])
  })
})

// ---------------------------------------------------------------------------
// Entity Recognition — Grass
// ---------------------------------------------------------------------------

describe('RuleBasedEntityAnalyzer — Grass', () => {
  it('should detect Grass from Chinese: 草', () => {
    assertEntities('草', ['Grass'])
  })

  it('should detect Grass from Chinese: 草地', () => {
    assertEntities('草地', ['Grass'])
  })

  it('should detect Grass from English: grass', () => {
    assertEntities('grass', ['Grass'])
  })
})

// ---------------------------------------------------------------------------
// Entity Recognition — House
// ---------------------------------------------------------------------------

describe('RuleBasedEntityAnalyzer — House', () => {
  it('should detect House from Chinese: 房子', () => {
    assertEntities('房子', ['House'])
  })

  it('should detect House from Chinese: 房屋', () => {
    assertEntities('房屋', ['House'])
  })

  it('should detect House from Chinese: 建筑', () => {
    assertEntities('建筑', ['House'])
  })

  it('should detect House from English: house', () => {
    assertEntities('house', ['House'])
  })
})

// ---------------------------------------------------------------------------
// Entity Recognition — Rock
// ---------------------------------------------------------------------------

describe('RuleBasedEntityAnalyzer — Rock', () => {
  it('should detect Rock from Chinese: 石头', () => {
    assertEntities('石头', ['Rock'])
  })

  it('should detect Rock from Chinese: 岩石', () => {
    assertEntities('岩石', ['Rock'])
  })

  it('should detect Rock from English: rock', () => {
    assertEntities('rock', ['Rock'])
  })
})

// ---------------------------------------------------------------------------
// Entity Recognition — Water
// ---------------------------------------------------------------------------

describe('RuleBasedEntityAnalyzer — Water', () => {
  it('should detect Water from Chinese: 河', () => {
    assertEntities('河', ['Water'])
  })

  it('should detect Water from Chinese: 河流', () => {
    assertEntities('河流', ['Water'])
  })

  it('should detect Water from Chinese: 水', () => {
    assertEntities('水', ['Water'])
  })

  it('should detect Water from Chinese: 湖', () => {
    assertEntities('湖', ['Water'])
  })

  it('should detect Water from Chinese: 海', () => {
    assertEntities('海', ['Water'])
  })

  it('should detect Water from English: river', () => {
    assertEntities('river', ['Water'])
  })

  it('should detect Water from English: water', () => {
    assertEntities('water', ['Water'])
  })

  it('should detect Water from English: lake', () => {
    assertEntities('lake', ['Water'])
  })

  it('should detect Water from English: sea', () => {
    assertEntities('sea', ['Water'])
  })
})

// ---------------------------------------------------------------------------
// Entity Recognition — Character
// ---------------------------------------------------------------------------

describe('RuleBasedEntityAnalyzer — Character', () => {
  it('should detect Character from Chinese: 人', () => {
    assertEntities('人', ['Character'])
  })

  it('should detect Character from Chinese: 人物', () => {
    assertEntities('人物', ['Character'])
  })

  it('should detect Character from Chinese: 女孩', () => {
    assertEntities('女孩', ['Character'])
  })

  it('should detect Character from Chinese: 男孩', () => {
    assertEntities('男孩', ['Character'])
  })

  it('should detect Character from Chinese: 动物', () => {
    assertEntities('动物', ['Character'])
  })

  it('should detect Character from English: person', () => {
    assertEntities('person', ['Character'])
  })

  it('should detect Character from English: girl', () => {
    assertEntities('girl', ['Character'])
  })

  it('should detect Character from English: boy', () => {
    assertEntities('boy', ['Character'])
  })

  it('should detect Character from English: animal', () => {
    assertEntities('animal', ['Character'])
  })
})

// ---------------------------------------------------------------------------
// Case Insensitivity
// ---------------------------------------------------------------------------

describe('Case Insensitivity', () => {
  it('should handle UPPERCASE TREE', () => {
    assertEntities('TREE', ['Tree'])
  })

  it('should handle Capitalized Tree', () => {
    assertEntities('Tree', ['Tree'])
  })

  it('should handle lowercase tree', () => {
    assertEntities('tree', ['Tree'])
  })

  it('should handle mixed case TrEe', () => {
    assertEntities('TrEe', ['Tree'])
  })

  it('should handle UPPERCASE FLOWER', () => {
    assertEntities('FLOWER', ['Flower'])
  })

  it('should handle UPPERCASE ROCK', () => {
    assertEntities('ROCK', ['Rock'])
  })

  it('should handle UPPERCASE WATER', () => {
    assertEntities('WATER', ['Water'])
  })

  it('should handle Capitalized Person', () => {
    assertEntities('Person', ['Character'])
  })
})

// ---------------------------------------------------------------------------
// Duplicate Removal
// ---------------------------------------------------------------------------

describe('Duplicate Removal', () => {
  it('should deduplicate Chinese Tree: 树树木', () => {
    assertEntities('树树木', ['Tree'])
  })

  it('should deduplicate Chinese Flower: 花鲜花', () => {
    assertEntities('花鲜花', ['Flower'])
  })

  it('should deduplicate English: tree tree', () => {
    assertEntities('tree tree', ['Tree'])
  })

  it('should deduplicate mixed: 树 tree', () => {
    assertEntities('树 tree', ['Tree'])
  })

  it('should deduplicate mixed: flower 花', () => {
    assertEntities('flower 花', ['Flower'])
  })

  it('should deduplicate multiple same entity: 树树木大树', () => {
    assertEntities('树树木大树', ['Tree'])
  })

  it('should remove duplicate across keyword variants', () => {
    assertEntities('tree 树 TREE', ['Tree'])
  })
})

// ---------------------------------------------------------------------------
// Multiple Entities
// ---------------------------------------------------------------------------

describe('Multiple Entities', () => {
  it('should detect Tree + Flower', () => {
    assertEntities('tree flower', ['Tree', 'Flower'])
  })

  it('should detect Tree + House', () => {
    assertEntities('tree house', ['Tree', 'House'])
  })

  it('should detect Flower + Water', () => {
    assertEntities('flower water', ['Flower', 'Water'])
  })

  it('should detect Grass + Rock', () => {
    assertEntities('grass rock', ['Grass', 'Rock'])
  })

  it('should detect House + Water + Tree', () => {
    assertEntities('house water tree', ['House', 'Water', 'Tree'])
  })

  it('should detect Chinese: 树花', () => {
    assertEntities('树花', ['Tree', 'Flower'])
  })

  it('should detect Chinese: 花房子', () => {
    assertEntities('花房子', ['Flower', 'House'])
  })

  it('should detect Chinese: 树花房子石头水', () => {
    assertEntities('树花房子石头水', ['Tree', 'Flower', 'House', 'Rock', 'Water'])
  })

  it('should detect Chinese with punctuation: 树、花、房子', () => {
    assertEntities('树、花、房子', ['Tree', 'Flower', 'House'])
  })

  it('should detect Chinese: 画树、花和房子', () => {
    assertEntities('画树、花和房子', ['Tree', 'Flower', 'House'])
  })
})

// ---------------------------------------------------------------------------
// Mixed Language
// ---------------------------------------------------------------------------

describe('Mixed Language', () => {
  it('should detect Draw tree 和 花', () => {
    assertEntities('Draw tree 和 花', ['Tree', 'Flower'])
  })

  it('should detect Chinese + English: 树 and flower', () => {
    assertEntities('树 and flower', ['Tree', 'Flower'])
  })

  it('should detect Chinese + English: house 和 水', () => {
    assertEntities('house 和 水', ['House', 'Water'])
  })

  it('should detect multi: tree 花 grass', () => {
    assertEntities('tree 花 grass', ['Tree', 'Flower', 'Grass'])
  })
})

// ---------------------------------------------------------------------------
// Unknown / Empty / Edge Inputs
// ---------------------------------------------------------------------------

describe('Unknown Input', () => {
  it('should return empty for empty string', () => {
    assertEmpty('')
  })

  it('should return empty for whitespace only', () => {
    assertEmpty('   ')
  })

  it('should return empty for tabs', () => {
    assertEmpty('\t\t')
  })

  it('should return empty for newlines', () => {
    assertEmpty('\n\n')
  })

  it('should return empty for emoji', () => {
    assertEmpty('🌳🌺🏠')
  })

  it('should return empty for special characters', () => {
    assertEmpty('!@#$%^&*()')
  })

  it('should return empty for numbers', () => {
    assertEmpty('12345')
  })

  it('should return empty for gibberish', () => {
    assertEmpty('asdfghjkl')
  })

  it('should return empty for greeting', () => {
    assertEmpty('hello world')
  })

  it('should return empty for Chinese greeting', () => {
    assertEmpty('你好')
  })

  it('should return empty for weather comment', () => {
    assertEmpty('天气不错')
  })

  it('should not throw on null-like inputs', () => {
    const analyzer = createAnalyzer()
    expect(() => analyzer.analyze('undefined')).not.toThrow()
    expect(() => analyzer.analyze('null')).not.toThrow()
  })

  it('should not throw on very long strings', () => {
    const analyzer = createAnalyzer()
    const long = 'a'.repeat(10000)
    expect(() => analyzer.analyze(long)).not.toThrow()
  })

  it('should return empty for unknown Chinese words', () => {
    assertEmpty('不知道')
  })

  it('should return empty for punctuation-only', () => {
    assertEmpty('，。、！？')
  })
})

// ---------------------------------------------------------------------------
// Whitespace Handling
// ---------------------------------------------------------------------------

describe('Whitespace', () => {
  it('should handle leading whitespace', () => {
    assertEntities('   tree', ['Tree'])
  })

  it('should handle trailing whitespace', () => {
    assertEntities('tree   ', ['Tree'])
  })

  it('should handle multiple spaces between words', () => {
    assertEntities('tree    flower', ['Tree', 'Flower'])
  })

  it('should handle mixed whitespace and tabs', () => {
    assertEntities('\ttree\tflower\t', ['Tree', 'Flower'])
  })
})

// ---------------------------------------------------------------------------
// Punctuation Handling
// ---------------------------------------------------------------------------

describe('Punctuation', () => {
  it('should handle Chinese comma', () => {
    assertEntities('树，花', ['Tree', 'Flower'])
  })

  it('should handle Chinese period', () => {
    assertEntities('树。花', ['Tree', 'Flower'])
  })

  it('should handle English comma', () => {
    assertEntities('tree,flower', ['Tree', 'Flower'])
  })

  it('should handle English period', () => {
    assertEntities('tree.flower', ['Tree', 'Flower'])
  })

  it('should handle exclamation', () => {
    assertEntities('tree!', ['Tree'])
  })

  it('should handle question mark', () => {
    assertEntities('tree?', ['Tree'])
  })

  it('should handle parentheses', () => {
    assertEntities('(tree)', ['Tree'])
  })

  it('should handle quotation marks', () => {
    assertEntities('“tree”', ['Tree'])
  })
})

// ---------------------------------------------------------------------------
// Input Order Preservation
// ---------------------------------------------------------------------------

describe('Input Order', () => {
  it('should preserve order: Tree then Flower', () => {
    assertEntities('tree flower', ['Tree', 'Flower'])
  })

  it('should preserve order: Flower then Tree', () => {
    assertEntities('flower tree', ['Flower', 'Tree'])
  })

  it('should preserve order: Flower then House', () => {
    assertEntities('flower house', ['Flower', 'House'])
  })

  it('should preserve order: Tree then Water then Grass', () => {
    assertEntities('tree water grass', ['Tree', 'Water', 'Grass'])
  })

  it('should preserve order: 房子树花', () => {
    assertEntities('房子树花', ['House', 'Tree', 'Flower'])
  })
})

// ---------------------------------------------------------------------------
// Deterministic
// ---------------------------------------------------------------------------

describe('Deterministic', () => {
  it('should return identical result for same input', () => {
    const analyzer = createAnalyzer()
    const input = 'tree and flower'
    const r1 = analyzer.analyze(input)
    const r2 = analyzer.analyze(input)
    const r3 = analyzer.analyze(input)
    expect(r1).toEqual(r2)
    expect(r2).toEqual(r3)
  })

  it('should return identical result for each Chinese entity type', () => {
    const analyzer = createAnalyzer()
    const inputs = ['树', '花', '草', '房子', '石头', '水', '人']
    for (const input of inputs) {
      const r1 = analyzer.analyze(input)
      const r2 = analyzer.analyze(input)
      expect(r1).toEqual(r2)
    }
  })

  it('should be idempotent across repeated calls', () => {
    const analyzer = createAnalyzer()
    const input = 'tree and flower and house'
    for (let i = 0; i < 10; i++) {
      const result = analyzer.analyze(input)
      expect(result.entities.map(e => e.type)).toEqual(['Tree', 'Flower', 'House'])
    }
  })
})

// ---------------------------------------------------------------------------
// Stateless
// ---------------------------------------------------------------------------

describe('Stateless', () => {
  it('should not retain state between calls', () => {
    const analyzer = createAnalyzer()
    expect(analyzer.analyze('tree').entities.map(e => e.type)).toEqual(['Tree'])
    expect(analyzer.analyze('').entities).toEqual([])
    expect(analyzer.analyze('flower').entities.map(e => e.type)).toEqual(['Flower'])
  })

  it('should be independent across multiple analyzer instances', () => {
    const a1 = createAnalyzer()
    const a2 = createAnalyzer()
    const a3 = createAnalyzer()
    expect(a1.analyze('tree').entities.map(e => e.type)).toEqual(['Tree'])
    expect(a2.analyze('flower').entities.map(e => e.type)).toEqual(['Flower'])
    expect(a3.analyze('tree').entities.map(e => e.type)).toEqual(['Tree'])
  })

  it('should not share state between instances', () => {
    const a1 = createAnalyzer()
    const a2 = createAnalyzer()
    a1.analyze('tree flower')
    a2.analyze('rock')
    expect(a1.analyze('tree').entities.map(e => e.type)).toEqual(['Tree'])
    expect(a2.analyze('rock').entities.map(e => e.type)).toEqual(['Rock'])
  })
})

// ---------------------------------------------------------------------------
// Immutability (EntityAnalyzer contract)
// ---------------------------------------------------------------------------

describe('Immutability', () => {
  it('should not modify the input string', () => {
    const analyzer = createAnalyzer()
    const input = 'draw a tree'
    const original = input
    analyzer.analyze(input)
    expect(input).toBe(original)
  })

  it('should return new EntityResult on each call', () => {
    const analyzer = createAnalyzer()
    const r1 = analyzer.analyze('tree')
    const r2 = analyzer.analyze('tree')
    expect(r1).toEqual(r2)
    expect(r1).not.toBe(r2)
  })

  it('should return fresh result objects', () => {
    const analyzer = createAnalyzer()
    const r1 = analyzer.analyze('tree')
    const r2 = analyzer.analyze('tree')
    expect(r1.entities).not.toBe(r2.entities)
    expect(r1.entities[0]).not.toBe(r2.entities[0])
  })
})

// ---------------------------------------------------------------------------
// Architecture Compliance
// ---------------------------------------------------------------------------

describe('Architecture Compliance', () => {
  it('should implement EntityAnalyzer interface', () => {
    const analyzer: EntityAnalyzer = createAnalyzer()
    expect(analyzer).toBeInstanceOf(RuleBasedEntityAnalyzer)
  })

  it('should have analyze method', () => {
    const analyzer = createAnalyzer()
    expect(typeof analyzer.analyze).toBe('function')
  })

  it('should return EntityResult type', () => {
    const analyzer = createAnalyzer()
    const result = analyzer.analyze('tree')
    expect(result).toHaveProperty('entities')
    expect(Array.isArray(result.entities)).toBe(true)
  })

  it('should be pure — no side effects', () => {
    const analyzer = createAnalyzer()
    const before = Object.keys(analyzer)
    analyzer.analyze('tree')
    analyzer.analyze('flower')
    analyzer.analyze('')
    const after = Object.keys(analyzer)
    expect(before).toEqual(after)
  })

  it('should be stateless — no internal mutation', () => {
    const analyzer = createAnalyzer()
    const state1 = JSON.stringify(analyzer.analyze('tree'))
    const state2 = JSON.stringify(analyzer.analyze('flower'))
    const state3 = JSON.stringify(analyzer.analyze(''))
    // Each call returns a new result independent of previous calls
    expect(JSON.stringify(analyzer.analyze('tree'))).toBe(state1)
    expect(JSON.stringify(analyzer.analyze('flower'))).toBe(state2)
    expect(JSON.stringify(analyzer.analyze(''))).toBe(state3)
  })

  it('should export from package root', () => {
    expect(RuleBasedFromRoot).toBe(RuleBasedEntityAnalyzer)
  })

  it('should maintain EntityAnalyzer type from root exports', () => {
    const analyzer: EntityAnalyzerFromRoot = createAnalyzer()
    expect(analyzer.analyze('test')).toBeDefined()
  })

  it('should have no dependencies on Planner', () => {
    const analyzer = createAnalyzer()
    expect(analyzer).toBeDefined()
  })

  it('should have no dependencies on Runtime', () => {
    const analyzer = createAnalyzer()
    const result = analyzer.analyze('test')
    expect(result.entities).toEqual([])
  })

  it('should have no dependencies on Provider', () => {
    const analyzer = createAnalyzer()
    expect(analyzer).toBeInstanceOf(RuleBasedEntityAnalyzer)
  })

  it('should have no dependencies on Memory', () => {
    const analyzer = createAnalyzer()
    expect(analyzer.analyze('test')).toEqual({ entities: [] })
  })

  it('should have no dependencies on ToolCalling', () => {
    const analyzer = createAnalyzer()
    expect(analyzer.analyze('test')).toEqual({ entities: [] })
  })

  it('should have no dependencies on AgentLoop', () => {
    const analyzer = createAnalyzer()
    expect(analyzer.analyze('test')).toEqual({ entities: [] })
  })

  it('should have no dependencies on PromptBuilder', () => {
    const analyzer = createAnalyzer()
    expect(analyzer.analyze('test')).toEqual({ entities: [] })
  })

  it('should have no dependencies on Pipeline', () => {
    const analyzer = createAnalyzer()
    expect(analyzer.analyze('test')).toEqual({ entities: [] })
  })

  it('should have no dependencies on Intent', () => {
    const analyzer = createAnalyzer()
    expect(analyzer.analyze('test')).toEqual({ entities: [] })
  })
})

// ---------------------------------------------------------------------------
// DefaultEntityAnalyzer Still Works
// ---------------------------------------------------------------------------

describe('DefaultEntityAnalyzer unaffected', () => {
  it('should still return empty for any input', () => {
    const analyzer = new DefaultEntityAnalyzer()
    expect(analyzer.analyze('tree')).toEqual({ entities: [] })
    expect(analyzer.analyze('flower')).toEqual({ entities: [] })
  })
})

// ---------------------------------------------------------------------------
// Contextual Input
// ---------------------------------------------------------------------------

describe('Contextual Input', () => {
  it('should detect entities in full sentence', () => {
    assertEntities('draw a tree and a flower', ['Tree', 'Flower'])
  })

  it('should detect entities in Chinese sentence', () => {
    assertEntities('画一棵树和一朵花', ['Tree', 'Flower'])
  })

  it('should detect entities in complex Chinese sentence', () => {
    assertEntities('在房子旁边种一棵树', ['House', 'Tree'])
  })

  it('should detect Rock in sentence', () => {
    assertEntities('there is a big rock', ['Rock'])
  })

  it('should detect Water in sentence', () => {
    assertEntities('the river flows to the sea', ['Water'])
  })

  it('should detect Grass in sentence', () => {
    assertEntities('the grass is green', ['Grass'])
  })

  it('should detect Character in sentence', () => {
    assertEntities('a person walks to the house', ['Character', 'House'])
  })
})

// ---------------------------------------------------------------------------
// Compatibilities
// ---------------------------------------------------------------------------

describe('Compatibility', () => {
  it('should work alongside existing IntentAnalyzer', () => {
    const entityAnalyzer = createAnalyzer()
    const entityResult = entityAnalyzer.analyze('draw a tree')
    expect(entityResult.entities.map(e => e.type)).toEqual(['Tree'])
  })

  it('should work with RuleBasedIntentAnalyzer simultaneously', () => {
    const entityAnalyzer = createAnalyzer()
    const entityResult = entityAnalyzer.analyze('draw a tree and a flower')
    expect(entityResult.entities.map(e => e.type)).toEqual(['Tree', 'Flower'])
  })

  it('should handle all entity types at once', () => {
    assertEntities('tree flower grass house rock water person', [
      'Tree', 'Flower', 'Grass', 'House', 'Rock', 'Water', 'Character',
    ])
  })
})

// ---------------------------------------------------------------------------
// RetryPlanner Compatibility
// ---------------------------------------------------------------------------

describe('RetryPlanner Compatibility', () => {
  it('should work with RetryPlanner', async () => {
    const modules: PromptModule[] = [new UserInputModule()]
    const builder = new DefaultPromptBuilder(modules)
    const provider = new MockPlannerProvider(mockConfig)
    const planner: Planner = new RetryPlanner(provider)
    const pipeline = new DefaultPipeline(planner, builder)
    const context = createPipelineContext()
    await expect(pipeline.execute(context)).resolves.toBeDefined()
  })

  it('should not affect RetryPlanner retry behavior', async () => {
    const modules: PromptModule[] = [new UserInputModule()]
    const builder = new DefaultPromptBuilder(modules)
    const provider = new MockPlannerProvider(mockConfig)
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
    const modules: PromptModule[] = [new UserInputModule()]
    const builder = new DefaultPromptBuilder(modules)
    const provider = new MockPlannerProvider(mockConfig)
    const toolRegistry: ToolRegistry = new DefaultToolRegistry()
    const planner: Planner = new ToolCallPlanner(provider, toolRegistry)
    const pipeline = new DefaultPipeline(planner, builder)
    const context = createPipelineContext()
    await expect(pipeline.execute(context)).resolves.toBeDefined()
  })

  it('should not affect ToolCallPlanner tool execution', async () => {
    const modules: PromptModule[] = [new UserInputModule()]
    const builder = new DefaultPromptBuilder(modules)
    const provider = new MockPlannerProvider(mockConfig)
    const toolRegistry: ToolRegistry = new DefaultToolRegistry()
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
    const modules: PromptModule[] = [new UserInputModule()]
    const builder = new DefaultPromptBuilder(modules)
    const provider = new MockStreamingProvider()
    const planner = new MockPlanner(provider)
    const pipeline = new DefaultPipeline(planner, builder)
    const context = createPipelineContext()
    await expect(pipeline.stream(context)).resolves.toBeDefined()
  })

  it('should not affect streaming chunk emission', async () => {
    const modules: PromptModule[] = [new UserInputModule()]
    const builder = new DefaultPromptBuilder(modules)
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
    const modules: PromptModule[] = [new UserInputModule()]
    const builder = new DefaultPromptBuilder(modules)
    const planner = new MockPlanner(new MockPlannerProvider(mockConfig))
    const pipeline = new DefaultPipeline(planner, builder)
    const context = createPipelineContext()
    await expect(pipeline.execute(context)).resolves.toBeDefined()
  })

  it('should not affect AgentLoop iteration count', async () => {
    const modules: PromptModule[] = [new UserInputModule()]
    const builder = new DefaultPromptBuilder(modules)
    const planner = new MockPlanner(new MockPlannerProvider(mockConfig))
    const pipeline = new DefaultPipeline(planner, builder)
    const context = createPipelineContext({ input: 'tree' })
    const result = await pipeline.execute(context)
    expect(result.plannerResult?.actions).toHaveLength(1)
  })
})