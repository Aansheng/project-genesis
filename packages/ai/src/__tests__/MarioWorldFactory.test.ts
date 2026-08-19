/**
 * MarioWorldFactory.test.ts — tests for DefaultMarioWorldFactory.
 *
 * Coverage: construction, world type, entity count, entity properties,
 *           immutability, determinism, frozen output
 */
import { describe, it, expect } from 'vitest'
import { DefaultMarioWorldFactory } from '../game-world'

// ---------------------------------------------------------------------------
// Construction
// ---------------------------------------------------------------------------

describe('construction', () => {
  it('should create a DefaultMarioWorldFactory instance', () => {
    const factory = new DefaultMarioWorldFactory()
    expect(factory).toBeInstanceOf(DefaultMarioWorldFactory)
  })

  it('should have a create method', () => {
    const factory = new DefaultMarioWorldFactory()
    expect(typeof factory.create).toBe('function')
  })

  it('should return a GameWorldModel from create', () => {
    const factory = new DefaultMarioWorldFactory()
    const model = factory.create()
    expect(model).toHaveProperty('worldType')
    expect(model).toHaveProperty('entities')
  })
})

// ---------------------------------------------------------------------------
// World type
// ---------------------------------------------------------------------------

describe('world type', () => {
  it('should produce platformer world type', () => {
    const factory = new DefaultMarioWorldFactory()
    const model = factory.create()
    expect(model.worldType).toBe('platformer')
  })

  it('should always produce platformer', () => {
    const factory = new DefaultMarioWorldFactory()
    expect(factory.create().worldType).toBe('platformer')
    expect(factory.create().worldType).toBe('platformer')
    expect(factory.create().worldType).toBe('platformer')
  })
})

// ---------------------------------------------------------------------------
// Entity count
// ---------------------------------------------------------------------------

describe('entity count', () => {
  it('should produce exactly 3 entities', () => {
    const factory = new DefaultMarioWorldFactory()
    const model = factory.create()
    expect(model.entities).toHaveLength(3)
  })

  it('should contain player entity', () => {
    const factory = new DefaultMarioWorldFactory()
    const entities = factory.create().entities
    const player = entities.find((e) => e.category === 'player')
    expect(player).toBeDefined()
  })

  it('should contain ground entity', () => {
    const factory = new DefaultMarioWorldFactory()
    const entities = factory.create().entities
    const ground = entities.find((e) => e.category === 'terrain')
    expect(ground).toBeDefined()
  })

  it('should contain goal entity', () => {
    const factory = new DefaultMarioWorldFactory()
    const entities = factory.create().entities
    const goal = entities.find((e) => e.category === 'item')
    expect(goal).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Entity properties
// ---------------------------------------------------------------------------

describe('entity properties', () => {
  it('should have player with id "player"', () => {
    const factory = new DefaultMarioWorldFactory()
    const entities = factory.create().entities
    const player = entities.find((e) => e.category === 'player')
    expect(player?.id).toBe('player')
  })

  it('should have player with name "Mario"', () => {
    const factory = new DefaultMarioWorldFactory()
    const entities = factory.create().entities
    const player = entities.find((e) => e.category === 'player')
    expect(player?.name).toBe('Mario')
  })

  it('should have ground with id "ground"', () => {
    const factory = new DefaultMarioWorldFactory()
    const entities = factory.create().entities
    const ground = entities.find((e) => e.category === 'terrain')
    expect(ground?.id).toBe('ground')
  })

  it('should have ground with name "Ground"', () => {
    const factory = new DefaultMarioWorldFactory()
    const entities = factory.create().entities
    const ground = entities.find((e) => e.category === 'terrain')
    expect(ground?.name).toBe('Ground')
  })

  it('should have goal with id "goal"', () => {
    const factory = new DefaultMarioWorldFactory()
    const entities = factory.create().entities
    const goal = entities.find((e) => e.category === 'item')
    expect(goal?.id).toBe('goal')
  })

  it('should have goal with name "Flag"', () => {
    const factory = new DefaultMarioWorldFactory()
    const entities = factory.create().entities
    const goal = entities.find((e) => e.category === 'item')
    expect(goal?.name).toBe('Flag')
  })

  it('should have player as the first entity', () => {
    const factory = new DefaultMarioWorldFactory()
    const entities = factory.create().entities
    expect(entities[0].category).toBe('player')
  })

  it('should have ground as the second entity', () => {
    const factory = new DefaultMarioWorldFactory()
    const entities = factory.create().entities
    expect(entities[1].category).toBe('terrain')
  })

  it('should have goal as the third entity', () => {
    const factory = new DefaultMarioWorldFactory()
    const entities = factory.create().entities
    expect(entities[2].category).toBe('item')
  })
})

// ---------------------------------------------------------------------------
// Immutability / Frozen output
// ---------------------------------------------------------------------------

describe('immutability', () => {
  it('should return frozen GameWorldModel', () => {
    const factory = new DefaultMarioWorldFactory()
    const model = factory.create()
    expect(Object.isFrozen(model)).toBe(true)
  })

  it('should have frozen entities array', () => {
    const factory = new DefaultMarioWorldFactory()
    const model = factory.create()
    expect(Object.isFrozen(model.entities)).toBe(true)
  })

  it('should have frozen individual entities', () => {
    const factory = new DefaultMarioWorldFactory()
    const model = factory.create()
    for (const entity of model.entities) {
      expect(Object.isFrozen(entity)).toBe(true)
    }
  })

  it('should prevent world type modification', () => {
    const factory = new DefaultMarioWorldFactory()
    const model = factory.create()
    expect(() => {
      (model as unknown as Record<string, unknown>).worldType = 'farm'
    }).toThrow()
  })

  it('should prevent entity array modification', () => {
    const factory = new DefaultMarioWorldFactory()
    const model = factory.create()
    expect(() => {
      (model.entities as unknown as unknown[]).pop()
    }).toThrow()
  })
})

// ---------------------------------------------------------------------------
// Determinism
// ---------------------------------------------------------------------------

describe('determinism', () => {
  it('should produce identical output on multiple calls', () => {
    const factory = new DefaultMarioWorldFactory()
    const model1 = factory.create()
    const model2 = factory.create()
    expect(model1).toEqual(model2)
  })

  it('should produce identical output on many calls', () => {
    const factory = new DefaultMarioWorldFactory()
    const results = Array.from({ length: 10 }, () => factory.create())
    const first = results[0]
    for (const result of results) {
      expect(result).toEqual(first)
    }
  })

  it('should produce identical output across factories', () => {
    const factory1 = new DefaultMarioWorldFactory()
    const factory2 = new DefaultMarioWorldFactory()
    expect(factory1.create()).toEqual(factory2.create())
  })

  it('should preserve entity order across calls', () => {
    const factory = new DefaultMarioWorldFactory()
    for (let i = 0; i < 10; i++) {
      const entities = factory.create().entities
      expect(entities[0].id).toBe('player')
      expect(entities[1].id).toBe('ground')
      expect(entities[2].id).toBe('goal')
    }
  })

  it('should preserve entity properties across calls', () => {
    const factory = new DefaultMarioWorldFactory()
    for (let i = 0; i < 10; i++) {
      const entities = factory.create().entities
      expect(entities[0].name).toBe('Mario')
      expect(entities[1].name).toBe('Ground')
      expect(entities[2].name).toBe('Flag')
    }
  })
})

// ---------------------------------------------------------------------------
// Serialization
// ---------------------------------------------------------------------------

describe('serialization', () => {
  it('should be JSON-serializable', () => {
    const factory = new DefaultMarioWorldFactory()
    const model = factory.create()
    const json = JSON.stringify(model)
    const parsed = JSON.parse(json)
    expect(parsed.worldType).toBe('platformer')
    expect(parsed.entities).toHaveLength(3)
  })

  it('should preserve entity IDs through serialization', () => {
    const factory = new DefaultMarioWorldFactory()
    const model = factory.create()
    const json = JSON.stringify(model)
    const parsed = JSON.parse(json)
    expect(parsed.entities[0].id).toBe('player')
    expect(parsed.entities[1].id).toBe('ground')
    expect(parsed.entities[2].id).toBe('goal')
  })

  it('should preserve entity names through serialization', () => {
    const factory = new DefaultMarioWorldFactory()
    const model = factory.create()
    const json = JSON.stringify(model)
    const parsed = JSON.parse(json)
    expect(parsed.entities[0].name).toBe('Mario')
    expect(parsed.entities[1].name).toBe('Ground')
    expect(parsed.entities[2].name).toBe('Flag')
  })
})

// ---------------------------------------------------------------------------
// Stateless
// ---------------------------------------------------------------------------

describe('stateless', () => {
  it('should be stateless (no constructor parameters)', () => {
    const factory = new DefaultMarioWorldFactory()
    expect(Object.keys(factory)).toHaveLength(0)
  })

  it('should not have internal state between creates', () => {
    const factory = new DefaultMarioWorldFactory()
    const model1 = factory.create()
    const model2 = factory.create()
    // Models are completely independent references
    expect(model1).not.toBe(model2)
  })
})
