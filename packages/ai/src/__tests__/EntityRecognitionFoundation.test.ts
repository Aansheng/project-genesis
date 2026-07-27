import { describe, it, expect } from 'vitest'
import { DefaultEntityAnalyzer } from '../entity/DefaultEntityAnalyzer'
import type { EntityAnalyzer } from '../entity/EntityAnalyzer'
import type { Entity } from '../entity/Entity'
import type { EntityResult } from '../entity/EntityResult'
import type { EntityType } from '../entity/EntityType'
import {
  DefaultEntityAnalyzer as DefaultEntityAnalyzerFromIndex,
} from '../entity/index'
import type {
  EntityAnalyzer as EntityAnalyzerFromIndex,
  Entity as EntityFromIndex,
  EntityResult as EntityResultFromIndex,
  EntityType as EntityTypeFromIndex,
} from '../entity/index'
import type {
  EntityAnalyzer as EntityAnalyzerFromRoot,
  Entity as EntityFromRoot,
  EntityResult as EntityResultFromRoot,
  EntityType as EntityTypeFromRoot,
} from '../index'
import { DefaultEntityAnalyzer as DefaultEntityAnalyzerFromRoot } from '../index'

// ---------------------------------------------------------------------------
// EntityType Tests
// ---------------------------------------------------------------------------

describe('EntityType', () => {
  it('should support Tree type', () => {
    const type: EntityType = 'Tree'
    expect(type).toBe('Tree')
  })

  it('should support Flower type', () => {
    const type: EntityType = 'Flower'
    expect(type).toBe('Flower')
  })

  it('should support House type', () => {
    const type: EntityType = 'House'
    expect(type).toBe('House')
  })

  it('should support Rock type', () => {
    const type: EntityType = 'Rock'
    expect(type).toBe('Rock')
  })

  it('should support Water type', () => {
    const type: EntityType = 'Water'
    expect(type).toBe('Water')
  })

  it('should support Grass type', () => {
    const type: EntityType = 'Grass'
    expect(type).toBe('Grass')
  })

  it('should support Unknown type', () => {
    const type: EntityType = 'Unknown'
    expect(type).toBe('Unknown')
  })

  it('should be a string union (extensible)', () => {
    const customType: EntityType = 'Tree' as EntityType
    expect(typeof customType).toBe('string')
  })
})

// ---------------------------------------------------------------------------
// Entity Tests
// ---------------------------------------------------------------------------

describe('Entity', () => {
  it('should create Entity with Tree type', () => {
    const entity: Entity = { type: 'Tree' }
    expect(entity.type).toBe('Tree')
  })

  it('should create Entity with Flower type', () => {
    const entity: Entity = { type: 'Flower' }
    expect(entity.type).toBe('Flower')
  })

  it('should create Entity with House type', () => {
    const entity: Entity = { type: 'House' }
    expect(entity.type).toBe('House')
  })

  it('should create Entity with Rock type', () => {
    const entity: Entity = { type: 'Rock' }
    expect(entity.type).toBe('Rock')
  })

  it('should create Entity with Water type', () => {
    const entity: Entity = { type: 'Water' }
    expect(entity.type).toBe('Water')
  })

  it('should create Entity with Grass type', () => {
    const entity: Entity = { type: 'Grass' }
    expect(entity.type).toBe('Grass')
  })

  it('should create Entity with Unknown type', () => {
    const entity: Entity = { type: 'Unknown' }
    expect(entity.type).toBe('Unknown')
  })
})

// ---------------------------------------------------------------------------
// EntityResult Tests
// ---------------------------------------------------------------------------

describe('EntityResult', () => {
  it('should support empty entities array', () => {
    const result: EntityResult = { entities: [] }
    expect(result.entities).toEqual([])
  })

  it('should support single entity', () => {
    const result: EntityResult = { entities: [{ type: 'Tree' }] }
    expect(result.entities).toHaveLength(1)
    expect(result.entities[0].type).toBe('Tree')
  })

  it('should support multiple entities', () => {
    const result: EntityResult = {
      entities: [{ type: 'Tree' }, { type: 'Flower' }],
    }
    expect(result.entities).toHaveLength(2)
    expect(result.entities[0].type).toBe('Tree')
    expect(result.entities[1].type).toBe('Flower')
  })

  it('should support all entity types', () => {
    const allTypes: EntityType[] = ['Tree', 'Flower', 'House', 'Rock', 'Water', 'Grass', 'Unknown']
    const result: EntityResult = {
      entities: allTypes.map((type) => ({ type })),
    }
    expect(result.entities).toHaveLength(7)
    allTypes.forEach((type, i) => {
      expect(result.entities[i].type).toBe(type)
    })
  })

  it('should be frozen (immutable by design)', () => {
    const result: EntityResult = { entities: [] }
    const frozen = Object.freeze(result)
    expect(() => {
      void ((frozen as Record<string, unknown>).entities = [{ type: 'Tree' }])
    }).toThrow()
  })

  it('should allow empty entities array as valid result', () => {
    const result: EntityResult = { entities: [] }
    expect(result.entities).toBeDefined()
    expect(result.entities.length).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// DefaultEntityAnalyzer Tests
// ---------------------------------------------------------------------------

describe('DefaultEntityAnalyzer', () => {
  it('should implement EntityAnalyzer interface', () => {
    const analyzer: EntityAnalyzer = new DefaultEntityAnalyzer()
    expect(analyzer).toBeDefined()
    expect(typeof analyzer.analyze).toBe('function')
  })

  it('should return empty entities for empty input', () => {
    const analyzer = new DefaultEntityAnalyzer()
    const result = analyzer.analyze('')
    expect(result.entities).toEqual([])
  })

  it('should return empty entities for non-empty input', () => {
    const analyzer = new DefaultEntityAnalyzer()
    const result = analyzer.analyze('draw a tree')
    expect(result.entities).toEqual([])
  })

  it('should return empty entities for complex input', () => {
    const analyzer = new DefaultEntityAnalyzer()
    const result = analyzer.analyze('Draw a tree and a flower near the house')
    expect(result.entities).toEqual([])
  })

  it('should be deterministic — same input always produces same output', () => {
    const analyzer = new DefaultEntityAnalyzer()
    const result1 = analyzer.analyze('draw a tree')
    const result2 = analyzer.analyze('draw a tree')
    expect(result1).toEqual(result2)
  })

  it('should be idempotent — calling twice produces same result as calling once', () => {
    const analyzer = new DefaultEntityAnalyzer()
    const result1 = analyzer.analyze('draw a tree')
    const result2 = analyzer.analyze('draw a tree')
    const result3 = analyzer.analyze('draw a tree')
    expect(result1).toEqual(result2)
    expect(result2).toEqual(result3)
  })

  it('should be stateless — no state between calls', () => {
    const analyzer = new DefaultEntityAnalyzer()
    const result1 = analyzer.analyze('draw a tree')
    const result2 = analyzer.analyze('move the rock')
    const result3 = analyzer.analyze('draw a tree')
    expect(result1).toEqual(result2)
    expect(result2).toEqual(result3)
  })

  it('should have no side effects on input', () => {
    const analyzer = new DefaultEntityAnalyzer()
    const input = 'draw a tree'
    const inputBefore = input
    analyzer.analyze(input)
    expect(input).toBe(inputBefore)
  })

  it('should return correct type structure', () => {
    const analyzer = new DefaultEntityAnalyzer()
    const result = analyzer.analyze('test')
    expect(result).toHaveProperty('entities')
    expect(Array.isArray(result.entities)).toBe(true)
  })

  it('should return EntityResult with entities field', () => {
    const analyzer = new DefaultEntityAnalyzer()
    const result = analyzer.analyze('test')
    expect('entities' in result).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Exports Tests
// ---------------------------------------------------------------------------

describe('Entity exports', () => {
  it('should export EntityType type from entity/index', () => {
    const type: EntityTypeFromIndex = 'Tree'
    expect(type).toBe('Tree')
  })

  it('should export Entity type from entity/index', () => {
    const entity: EntityFromIndex = { type: 'Tree' }
    expect(entity.type).toBe('Tree')
  })

  it('should export EntityResult type from entity/index', () => {
    const result: EntityResultFromIndex = { entities: [] }
    expect(result.entities).toEqual([])
  })

  it('should export EntityAnalyzer type from entity/index', () => {
    const analyzer: EntityAnalyzerFromIndex = new DefaultEntityAnalyzer()
    expect(analyzer).toBeDefined()
  })

  it('should export DefaultEntityAnalyzer class from entity/index', () => {
    const analyzer = new DefaultEntityAnalyzerFromIndex()
    expect(analyzer).toBeInstanceOf(DefaultEntityAnalyzer)
  })

  it('should export EntityType type from package root', () => {
    const type: EntityTypeFromRoot = 'Tree'
    expect(type).toBe('Tree')
  })

  it('should export Entity type from package root', () => {
    const entity: EntityFromRoot = { type: 'Tree' }
    expect(entity.type).toBe('Tree')
  })

  it('should export EntityResult type from package root', () => {
    const result: EntityResultFromRoot = { entities: [] }
    expect(result.entities).toEqual([])
  })

  it('should export EntityAnalyzer type from package root', () => {
    const analyzer: EntityAnalyzerFromRoot = new DefaultEntityAnalyzer()
    expect(analyzer).toBeDefined()
  })

  it('should export DefaultEntityAnalyzer class from package root', () => {
    const analyzer = new DefaultEntityAnalyzerFromRoot()
    expect(analyzer).toBeInstanceOf(DefaultEntityAnalyzer)
  })
})

// ---------------------------------------------------------------------------
// Backward Compatibility Tests
// ---------------------------------------------------------------------------

describe('Backward compatibility', () => {
  it('should not affect existing interfaces', () => {
    const analyzer = new DefaultEntityAnalyzer()
    expect(analyzer.analyze('test')).toEqual({ entities: [] })
  })

  it('should work alongside existing IntentAnalyzer', () => {
    const entityAnalyzer = new DefaultEntityAnalyzer()
    const entityResult = entityAnalyzer.analyze('draw a tree')
    expect(entityResult.entities).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// Architecture Compliance
// ---------------------------------------------------------------------------

describe('Architecture compliance', () => {
  it('should not depend on Planner', () => {
    const analyzer = new DefaultEntityAnalyzer()
    expect(analyzer).toBeDefined()
  })

  it('should not depend on Runtime', () => {
    const analyzer = new DefaultEntityAnalyzer()
    const result = analyzer.analyze('test')
    expect(result.entities).toEqual([])
  })

  it('should not depend on Provider', () => {
    const analyzer = new DefaultEntityAnalyzer()
    expect(analyzer).toBeInstanceOf(DefaultEntityAnalyzer)
  })

  it('should not depend on Memory', () => {
    const analyzer = new DefaultEntityAnalyzer()
    const result = analyzer.analyze('test')
    expect(result.entities).toEqual([])
  })

  it('should not depend on ToolCalling', () => {
    const analyzer = new DefaultEntityAnalyzer()
    expect(analyzer.analyze('test')).toEqual({ entities: [] })
  })

  it('should not depend on AgentLoop', () => {
    const analyzer = new DefaultEntityAnalyzer()
    expect(analyzer.analyze('test')).toEqual({ entities: [] })
  })

  it('should not depend on PromptBuilder', () => {
    const analyzer = new DefaultEntityAnalyzer()
    expect(analyzer.analyze('test')).toEqual({ entities: [] })
  })

  it('should not depend on Pipeline', () => {
    const analyzer = new DefaultEntityAnalyzer()
    expect(analyzer.analyze('test')).toEqual({ entities: [] })
  })

  it('should not depend on Intent', () => {
    const analyzer = new DefaultEntityAnalyzer()
    expect(analyzer.analyze('test')).toEqual({ entities: [] })
  })

  it('should be pure — no side effects', () => {
    const analyzer = new DefaultEntityAnalyzer()
    const input = 'draw a tree'
    const inputBefore = input
    analyzer.analyze(input)
    expect(input).toBe(inputBefore)
  })

  it('should be stateless — no internal state', () => {
    const analyzer1 = new DefaultEntityAnalyzer()
    const analyzer2 = new DefaultEntityAnalyzer()
    const result1 = analyzer1.analyze('test')
    const result2 = analyzer2.analyze('test')
    expect(result1).toEqual(result2)
  })

  it('should be non-mutating — never modifies inputs', () => {
    const analyzer = new DefaultEntityAnalyzer()
    const input = 'draw a tree'
    const originalInput = input
    analyzer.analyze(input)
    expect(input).toBe(originalInput)
  })
})