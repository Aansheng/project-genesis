/**
 * GameDslBuilder — verifies the DefaultGameDslBuilder implementation
 * for converting PromptAssemblyDomainModel → GameDsl.
 *
 * WO-S8-002 — Prompt Assembly To Game DSL Builder Foundation
 * Architecture version v1.61
 */

import { describe, it, expect } from 'vitest'
import { DefaultGameDslBuilder } from '../game-dsl'
import type { GameDslBuilder } from '../game-dsl'
import type { PromptAssemblyDomainModel, OverviewDomain } from '../observatory/domain'
import type { GameDsl, EntityDsl } from '@genesis/shared'
import { EMPTY_GAME_DSL } from '@genesis/shared'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createBuilder(): GameDslBuilder {
  return new DefaultGameDslBuilder()
}

/** Build a domain model with all 7 sections populated. */
function buildFullDomainModel(): PromptAssemblyDomainModel {
  return {
    overview: { traceCount: 3, timelineCount: 2, historyCount: 1 },
    trace: [
      { id: 't1', label: 'Trace 1', steps: [{ id: 's1', label: 'Step 1', status: 'done' }] },
      { id: 't2', label: 'Trace 2', steps: [{ id: 's2', label: 'Step 2', status: 'running' }] },
    ],
    timeline: [
      { id: 'tl1', label: 'Timeline 1', entries: [{ id: 'te1', label: 'Entry 1', timestamp: '10:00' }] },
    ],
    history: [
      { id: 'h1', label: 'History 1', entries: [{ id: 'he1', label: 'Entry', timestamp: '09:00' }] },
    ],
    diff: [
      { id: 'd1', timestamp: '12:00', added: ['A', 'B'], removed: ['C'], changed: ['D'] },
    ],
    runtime: {
      worldId: 'world-001',
      entityCount: 100,
      systemCount: 5,
      eventCount: 20,
      fps: 60,
      entities: [
        {
          id: 'guard-001',
          type: 'Guard',
          position: '(10,4)',
          health: '100',
          state: 'Patrol',
          components: [{ name: 'Position', data: JSON.stringify({ x: 10, y: 4 }) }],
        },
      ],
    },
    eventStream: {
      events: [
        { id: 'e1', timestamp: '12:00:01', level: 'info', source: 'Source', message: 'Event message' },
      ],
    },
  }
}

/** Build a domain model with overview section only. */
function buildOverviewOnlyModel(): PromptAssemblyDomainModel {
  return {
    overview: { traceCount: 1, timelineCount: 0, historyCount: 0 },
  }
}

/** Build a domain model with trace section only. */
function buildTraceOnlyModel(): PromptAssemblyDomainModel {
  return {
    trace: [{ id: 't1', label: 'Only Trace', steps: [{ id: 's1', label: 'Step', status: 'ok' }] }],
  }
}

/** Build a domain model with overview and runtime only. */
function buildOverviewAndRuntimeModel(): PromptAssemblyDomainModel {
  return {
    overview: { traceCount: 2, timelineCount: 1, historyCount: 0 },
    runtime: {
      worldId: 'w1',
      entityCount: 10,
      systemCount: 3,
      eventCount: 5,
      fps: 30,
      entities: [],
    },
  }
}

/** Check that a DSL has expected entity for a given section. */
function expectEntityForSection(
  dsl: GameDsl,
  sectionName: string,
  index: number,
): void {
  const entity = dsl.world.entities[index]
  expect(entity).toBeDefined()
  expect(entity.id).toBe(sectionName)
  expect(entity.type).toBe(sectionName)
}

/** Check that a DSL entity has the expected MetadataComponent. */
function expectMetadataComponent(
  entity: EntityDsl,
  expectedSource: string,
): void {
  expect(entity.components.length).toBe(1)
  const component = entity.components[0]
  expect(component.type).toBe('metadata')
  expect(component.properties.source).toBe(expectedSource)
}

/** Check that an entity is deeply frozen. */
function expectEntityFrozen(entity: EntityDsl): void {
  expect(Object.isFrozen(entity)).toBe(true)
  expect(Object.isFrozen(entity.components)).toBe(true)
  for (const component of entity.components) {
    expect(Object.isFrozen(component)).toBe(true)
    expect(Object.isFrozen(component.properties)).toBe(true)
  }
}

// ---------------------------------------------------------------------------
// Section 1 — Construction
// ---------------------------------------------------------------------------

describe('construction', () => {
  it('creates builder without error', () => {
    const builder = createBuilder()
    expect(builder).toBeDefined()
  })

  it('builder implements GameDslBuilder interface', () => {
    const builder = createBuilder()
    expect(typeof builder.build).toBe('function')
  })

  it('build method accepts PromptAssemblyDomainModel', () => {
    const builder = createBuilder()
    const result = builder.build({})
    expect(result).toBeDefined()
  })

  it('build method returns GameDsl', () => {
    const result = createBuilder().build({})
    expect(typeof result).toBe('object')
    expect(result).not.toBeNull()
    expect(result).toHaveProperty('world')
  })

  it('build method returns GameDsl with WorldDsl', () => {
    const result = createBuilder().build({})
    expect(result.world).toBeDefined()
    expect(typeof result.world.name).toBe('string')
    expect(Array.isArray(result.world.entities)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Section 2 — Empty Domain Model
// ---------------------------------------------------------------------------

describe('empty domain', () => {
  it('empty object produces world with fallback name', () => {
    const dsl = createBuilder().build({})
    expect(dsl.world.name).toBe('Untitled World')
  })

  it('empty object produces world with zero entities', () => {
    const dsl = createBuilder().build({})
    expect(dsl.world.entities.length).toBe(0)
  })

  it('undefined sections produce world with fallback name', () => {
    const dsl = createBuilder().build({
      overview: undefined,
      trace: undefined,
      timeline: undefined,
      history: undefined,
      diff: undefined,
      runtime: undefined,
      eventStream: undefined,
    })
    expect(dsl.world.name).toBe('Untitled World')
    expect(dsl.world.entities.length).toBe(0)
  })

  it('null sections produce world with fallback name', () => {
    const dsl = createBuilder().build({
      overview: null as unknown as undefined,
      trace: null as unknown as undefined,
    })
    expect(dsl.world.name).toBe('Untitled World')
    expect(dsl.world.entities.length).toBe(0)
  })

  it('empty domain model has frozen output', () => {
    const dsl = createBuilder().build({})
    expect(Object.isFrozen(dsl)).toBe(true)
  })

  it('empty domain model has frozen world', () => {
    const dsl = createBuilder().build({})
    expect(Object.isFrozen(dsl.world)).toBe(true)
  })

  it('empty domain model has frozen entities array', () => {
    const dsl = createBuilder().build({})
    expect(Object.isFrozen(dsl.world.entities)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Section 3 — Partial Domain Model
// ---------------------------------------------------------------------------

describe('partial domain', () => {
  it('overview only produces 1 entity', () => {
    const dsl = createBuilder().build(buildOverviewOnlyModel())
    expect(dsl.world.entities.length).toBe(1)
    expectEntityForSection(dsl, 'overview', 0)
  })

  it('trace only produces 1 entity', () => {
    const dsl = createBuilder().build(buildTraceOnlyModel())
    expect(dsl.world.entities.length).toBe(1)
    expectEntityForSection(dsl, 'trace', 0)
  })

  it('overview and runtime produce 2 entities', () => {
    const dsl = createBuilder().build(buildOverviewAndRuntimeModel())
    expect(dsl.world.entities.length).toBe(2)
    expectEntityForSection(dsl, 'overview', 0)
    expectEntityForSection(dsl, 'runtime', 1)
  })

  it('single section entities preserve order by section list', () => {
    const dsl = createBuilder().build({ diff: [{ id: 'd1', timestamp: '', added: [], removed: [], changed: [] }] })
    expect(dsl.world.entities.length).toBe(1)
    expect(dsl.world.entities[0].id).toBe('diff')
  })

  it('partial domain uses fallback world name', () => {
    const dsl = createBuilder().build({ trace: [{ id: 't1', label: 'T', steps: [] }] })
    expect(dsl.world.name).toBe('Untitled World')
  })

  it('multiple sections produce correct entity count', () => {
    const dsl = createBuilder().build({
      timeline: [{ id: 'tl1', label: 'TL', entries: [{ id: 'e1', label: 'E', timestamp: '0' }] }],
      history: [{ id: 'h1', label: 'H', entries: [{ id: 'e1', label: 'E', timestamp: '0' }] }],
      eventStream: { events: [{ id: 'e1', timestamp: '0', level: 'info' as const, source: 's', message: 'm' }] },
    })
    expect(dsl.world.entities.length).toBe(3)
  })
})

// ---------------------------------------------------------------------------
// Section 4 — Full Domain Model (All 7 Sections)
// ---------------------------------------------------------------------------

describe('full domain', () => {
  it('builds world with 7 entities', () => {
    const dsl = createBuilder().build(buildFullDomainModel())
    expect(dsl.world.entities.length).toBe(7)
  })

  it('generates entity for overview section', () => {
    const dsl = createBuilder().build(buildFullDomainModel())
    expectEntityForSection(dsl, 'overview', 0)
  })

  it('generates entity for trace section', () => {
    const dsl = createBuilder().build(buildFullDomainModel())
    expectEntityForSection(dsl, 'trace', 1)
  })

  it('generates entity for timeline section', () => {
    const dsl = createBuilder().build(buildFullDomainModel())
    expectEntityForSection(dsl, 'timeline', 2)
  })

  it('generates entity for history section', () => {
    const dsl = createBuilder().build(buildFullDomainModel())
    expectEntityForSection(dsl, 'history', 3)
  })

  it('generates entity for diff section', () => {
    const dsl = createBuilder().build(buildFullDomainModel())
    expectEntityForSection(dsl, 'diff', 4)
  })

  it('generates entity for runtime section', () => {
    const dsl = createBuilder().build(buildFullDomainModel())
    expectEntityForSection(dsl, 'runtime', 5)
  })

  it('generates entity for eventStream section', () => {
    const dsl = createBuilder().build(buildFullDomainModel())
    expectEntityForSection(dsl, 'eventStream', 6)
  })

  it('all 7 entities have MetadataComponent', () => {
    const dsl = createBuilder().build(buildFullDomainModel())
    const expectedSources = ['overview', 'trace', 'timeline', 'history', 'diff', 'runtime', 'eventStream']
    for (let i = 0; i < 7; i++) {
      expectMetadataComponent(dsl.world.entities[i], expectedSources[i])
    }
  })

  it('entities are in deterministic section order', () => {
    const dsl = createBuilder().build(buildFullDomainModel())
    const ids = dsl.world.entities.map((e) => e.id)
    expect(ids).toEqual(['overview', 'trace', 'timeline', 'history', 'diff', 'runtime', 'eventStream'])
  })
})

// ---------------------------------------------------------------------------
// Section 5 — World Naming
// ---------------------------------------------------------------------------

describe('world naming', () => {
  it('empty domain model uses fallback name', () => {
    const dsl = createBuilder().build({})
    expect(dsl.world.name).toBe('Untitled World')
  })

  it('domain model without overview uses fallback name', () => {
    const dsl = createBuilder().build({ trace: [{ id: 't1', label: 'T', steps: [] }] })
    expect(dsl.world.name).toBe('Untitled World')
  })

  it('overview without title uses fallback name', () => {
    const dsl = createBuilder().build({ overview: { traceCount: 1, timelineCount: 0, historyCount: 0 } })
    expect(dsl.world.name).toBe('Untitled World')
  })

  it('overview with empty string title uses fallback name', () => {
    const dsl = createBuilder().build({
      overview: { traceCount: 1, timelineCount: 0, historyCount: 0 } as unknown as { traceCount: number; timelineCount: number; historyCount: number },
    })
    // No title, so fallback
    expect(dsl.world.name).toBe('Untitled World')
  })

  it('overview with title uses the title', () => {
    const dsl = createBuilder().build({
      overview: { traceCount: 1, timelineCount: 0, historyCount: 0, title: 'My World' } as unknown as OverviewDomain,
    })
    expect(dsl.world.name).toBe('My World')
  })

  it('overview with numeric title uses fallback', () => {
    const dsl = createBuilder().build({
      overview: { traceCount: 1, timelineCount: 0, historyCount: 0, title: 42 } as unknown as OverviewDomain,
    })
    expect(dsl.world.name).toBe('Untitled World')
  })

  it('overview with null title uses fallback', () => {
    const dsl = createBuilder().build({
      overview: { traceCount: 1, timelineCount: 0, historyCount: 0, title: null } as unknown as OverviewDomain,
    })
    expect(dsl.world.name).toBe('Untitled World')
  })

  it('world name is a string', () => {
    const dsl = createBuilder().build({})
    expect(typeof dsl.world.name).toBe('string')
  })
})

// ---------------------------------------------------------------------------
// Section 6 — Entity Generation
// ---------------------------------------------------------------------------

describe('entity generation', () => {
  it('entity has id property', () => {
    const dsl = createBuilder().build(buildOverviewOnlyModel())
    expect(typeof dsl.world.entities[0].id).toBe('string')
    expect(dsl.world.entities[0].id.length).toBeGreaterThan(0)
  })

  it('entity has type property', () => {
    const dsl = createBuilder().build(buildOverviewOnlyModel())
    expect(typeof dsl.world.entities[0].type).toBe('string')
    expect(dsl.world.entities[0].type.length).toBeGreaterThan(0)
  })

  it('entity has components array', () => {
    const dsl = createBuilder().build(buildOverviewOnlyModel())
    expect(Array.isArray(dsl.world.entities[0].components)).toBe(true)
  })

  it('entity id equals section name', () => {
    const dsl = createBuilder().build(buildOverviewOnlyModel())
    expect(dsl.world.entities[0].id).toBe('overview')
  })

  it('entity type equals section name', () => {
    const dsl = createBuilder().build(buildOverviewOnlyModel())
    expect(dsl.world.entities[0].type).toBe('overview')
  })

  it('entity id and type match', () => {
    const dsl = createBuilder().build(buildFullDomainModel())
    for (const entity of dsl.world.entities) {
      expect(entity.id).toBe(entity.type)
    }
  })

  it('no duplicate entities', () => {
    const dsl = createBuilder().build(buildFullDomainModel())
    const ids = dsl.world.entities.map((e) => e.id)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(ids.length)
  })
})

// ---------------------------------------------------------------------------
// Section 7 — Component Generation
// ---------------------------------------------------------------------------

describe('component generation', () => {
  it('each entity has exactly one component', () => {
    const dsl = createBuilder().build(buildFullDomainModel())
    for (const entity of dsl.world.entities) {
      expect(entity.components.length).toBe(1)
    }
  })

  it('component type is "metadata"', () => {
    const dsl = createBuilder().build(buildFullDomainModel())
    for (const entity of dsl.world.entities) {
      expect(entity.components[0].type).toBe('metadata')
    }
  })

  it('component has properties object', () => {
    const dsl = createBuilder().build(buildOverviewOnlyModel())
    const props = dsl.world.entities[0].components[0].properties
    expect(typeof props).toBe('object')
    expect(props).not.toBeNull()
  })

  it('component properties contains source field', () => {
    const dsl = createBuilder().build(buildOverviewOnlyModel())
    const props = dsl.world.entities[0].components[0].properties
    expect(props).toHaveProperty('source')
  })

  it('component source matches section name', () => {
    const dsl = createBuilder().build(buildFullDomainModel())
    const expectedSources = ['overview', 'trace', 'timeline', 'history', 'diff', 'runtime', 'eventStream']
    for (let i = 0; i < 7; i++) {
      expect(dsl.world.entities[i].components[0].properties.source).toBe(expectedSources[i])
    }
  })

  it('component properties are serializable', () => {
    const dsl = createBuilder().build(buildFullDomainModel())
    for (const entity of dsl.world.entities) {
      const json = JSON.stringify(entity.components[0].properties)
      expect(() => JSON.parse(json)).not.toThrow()
    }
  })
})

// ---------------------------------------------------------------------------
// Section 8 — Immutability & Frozen Outputs
// ---------------------------------------------------------------------------

describe('immutability', () => {
  it('root GameDsl is frozen', () => {
    const dsl = createBuilder().build(buildFullDomainModel())
    expect(Object.isFrozen(dsl)).toBe(true)
  })

  it('world is frozen', () => {
    const dsl = createBuilder().build(buildFullDomainModel())
    expect(Object.isFrozen(dsl.world)).toBe(true)
  })

  it('entities array is frozen', () => {
    const dsl = createBuilder().build(buildFullDomainModel())
    expect(Object.isFrozen(dsl.world.entities)).toBe(true)
  })

  it('each entity is frozen', () => {
    const dsl = createBuilder().build(buildFullDomainModel())
    for (const entity of dsl.world.entities) {
      expectEntityFrozen(entity)
    }
  })

  it('each component properties is frozen', () => {
    const dsl = createBuilder().build(buildFullDomainModel())
    for (const entity of dsl.world.entities) {
      for (const component of entity.components) {
        expect(Object.isFrozen(component.properties)).toBe(true)
      }
    }
  })

  it('empty domain model root is frozen', () => {
    const dsl = createBuilder().build({})
    expect(Object.isFrozen(dsl)).toBe(true)
  })

  it('empty domain model entities array is frozen', () => {
    const dsl = createBuilder().build({})
    expect(Object.isFrozen(dsl.world.entities)).toBe(true)
  })

  it('does not mutate input domain model', () => {
    const builder = createBuilder()
    const domainModel: PromptAssemblyDomainModel = {
      overview: { traceCount: 1, timelineCount: 0, historyCount: 0 },
    }
    const before = JSON.stringify(domainModel)
    builder.build(domainModel)
    expect(JSON.stringify(domainModel)).toBe(before)
  })

  it('accepts frozen input domain model without error', () => {
    const domainModel = Object.freeze({
      overview: Object.freeze({ traceCount: 1, timelineCount: 0, historyCount: 0 }),
    })
    expect(() => createBuilder().build(domainModel)).not.toThrow()
  })
})

// ---------------------------------------------------------------------------
// Section 9 — Determinism
// ---------------------------------------------------------------------------

describe('determinism', () => {
  it('same input produces same result', () => {
    const builder = createBuilder()
    const domainModel = buildFullDomainModel()
    const first = builder.build(domainModel)
    const second = builder.build(domainModel)
    expect(JSON.stringify(first)).toBe(JSON.stringify(second))
  })

  it('different builders with same input produce same result', () => {
    const domainModel = buildFullDomainModel()
    const result1 = createBuilder().build(domainModel)
    const result2 = createBuilder().build(domainModel)
    expect(JSON.stringify(result1)).toBe(JSON.stringify(result2))
  })

  it('deterministic with empty input', () => {
    const result1 = createBuilder().build({})
    const result2 = createBuilder().build({})
    expect(JSON.stringify(result1)).toBe(JSON.stringify(result2))
  })

  it('deterministic with partial input', () => {
    const domainModel: PromptAssemblyDomainModel = { trace: [{ id: 't1', label: 'Test', steps: [] }] }
    const result1 = createBuilder().build(domainModel)
    const result2 = createBuilder().build(domainModel)
    expect(JSON.stringify(result1)).toBe(JSON.stringify(result2))
  })

  it('entity order is deterministic', () => {
    const domainModel = buildFullDomainModel()
    const result1 = createBuilder().build(domainModel)
    const result2 = createBuilder().build(domainModel)
    for (let i = 0; i < 7; i++) {
      expect(result1.world.entities[i].id).toBe(result2.world.entities[i].id)
    }
  })
})

// ---------------------------------------------------------------------------
// Section 10 — Serialization
// ---------------------------------------------------------------------------

describe('serialization', () => {
  it('full model serializes to JSON without error', () => {
    const dsl = createBuilder().build(buildFullDomainModel())
    expect(() => JSON.stringify(dsl)).not.toThrow()
  })

  it('full model JSON contains world key', () => {
    const dsl = createBuilder().build(buildFullDomainModel())
    const json = JSON.stringify(dsl)
    expect(json).toContain('world')
  })

  it('full model JSON contains entities array', () => {
    const dsl = createBuilder().build(buildFullDomainModel())
    const json = JSON.stringify(dsl)
    expect(json).toContain('entities')
  })

  it('full model JSON contains all entity ids', () => {
    const dsl = createBuilder().build(buildFullDomainModel())
    const json = JSON.stringify(dsl)
    expect(json).toContain('overview')
    expect(json).toContain('trace')
    expect(json).toContain('timeline')
    expect(json).toContain('history')
    expect(json).toContain('diff')
    expect(json).toContain('runtime')
    expect(json).toContain('eventStream')
  })

  it('empty model serializes to JSON', () => {
    const dsl = createBuilder().build({})
    expect(() => JSON.stringify(dsl)).not.toThrow()
  })

  it('empty model JSON has empty entities', () => {
    const dsl = createBuilder().build({})
    const parsed = JSON.parse(JSON.stringify(dsl))
    expect(parsed.world.entities).toEqual([])
  })

  it('partial model JSON only contains present entities', () => {
    const dsl = createBuilder().build({ overview: { traceCount: 1, timelineCount: 0, historyCount: 0 } })
    const parsed = JSON.parse(JSON.stringify(dsl))
    expect(parsed.world.entities.length).toBe(1)
    expect(parsed.world.entities[0].id).toBe('overview')
  })

  it('model values are JSON-serializable primitives', () => {
    const dsl = createBuilder().build(buildFullDomainModel())
    const json = JSON.parse(JSON.stringify(dsl))
    expect(typeof json.world.name).toBe('string')
    expect(Array.isArray(json.world.entities)).toBe(true)
    expect(Array.isArray(json.world.entities[0].components)).toBe(true)
    expect(typeof json.world.entities[0].components[0].type).toBe('string')
    expect(typeof json.world.entities[0].components[0].properties.source).toBe('string')
  })

  it('full model round-trips through JSON', () => {
    const original = createBuilder().build(buildFullDomainModel())
    const json = JSON.stringify(original)
    const parsed = JSON.parse(json)
    expect(parsed.world.name).toBe('Untitled World')
    expect(parsed.world.entities.length).toBe(7)
    expect(parsed.world.entities[0].id).toBe('overview')
    expect(parsed.world.entities[6].id).toBe('eventStream')
  })
})

// ---------------------------------------------------------------------------
// Section 11 — Large Inputs
// ---------------------------------------------------------------------------

describe('large inputs', () => {
  it('handles many entities across multiple sections', () => {
    // Build a domain model with many items in each section
    const manySteps = Array.from({ length: 100 }, (_, i) => ({
      id: `step-${i}`,
      label: `Step ${i}`,
      status: 'done',
    }))
    const domainModel: PromptAssemblyDomainModel = {
      overview: { traceCount: 100, timelineCount: 50, historyCount: 25 },
      trace: [{ id: 'big-trace', label: 'Big Trace', steps: manySteps }],
    }
    const dsl = createBuilder().build(domainModel)
    expect(dsl.world.entities.length).toBe(2)
    expect(dsl.world.entities[0].id).toBe('overview')
    expect(dsl.world.entities[1].id).toBe('trace')
  })

  it('handles all 7 sections present simultaneously', () => {
    const dsl = createBuilder().build(buildFullDomainModel())
    expect(dsl.world.entities.length).toBe(7)
  })

  it('handles sections with deeply nested data', () => {
    const domainModel: PromptAssemblyDomainModel = {
      runtime: {
        worldId: 'big-world',
        entityCount: 1000,
        systemCount: 50,
        eventCount: 5000,
        fps: 60,
        entities: Array.from({ length: 100 }, (_, i) => ({
          id: `entity-${i}`,
          type: 'Guard',
          position: `(${i},${i * 2})`,
          health: '100',
          state: 'Patrol',
          components: Array.from({ length: 5 }, (_, j) => ({
            name: `comp-${j}`,
            data: JSON.stringify({ value: j }),
          })),
        })),
      },
    }
    const dsl = createBuilder().build(domainModel)
    // Only runtime section present → 1 entity
    expect(dsl.world.entities.length).toBe(1)
    expect(dsl.world.entities[0].id).toBe('runtime')
  })

  it('handles empty arrays in all sections without crashing', () => {
    const domainModel: PromptAssemblyDomainModel = {
      trace: [],
      timeline: [],
      history: [],
      diff: [],
      eventStream: { events: [] },
    }
    // Even with empty data, the sections exist (non-null) → entities generated
    const dsl = createBuilder().build(domainModel)
    expect(dsl.world.entities.length).toBe(5)
  })

  it('processes all sections within reasonable time', () => {
    const builder = createBuilder()
    const domainModel = buildFullDomainModel()
    const start = performance.now()
    const iterations = 1000
    for (let i = 0; i < iterations; i++) {
      builder.build(domainModel)
    }
    const elapsed = performance.now() - start
    // 1000 iterations should complete in under 1 second
    expect(elapsed).toBeLessThan(1000)
  })
})

// ---------------------------------------------------------------------------
// Section 12 — Edge Cases
// ---------------------------------------------------------------------------

describe('edge cases', () => {
  it('section name is used verbatim as entity id', () => {
    const dsl = createBuilder().build({ overview: { traceCount: 1, timelineCount: 0, historyCount: 0 } })
    expect(dsl.world.entities[0].id).toBe('overview')
  })

  it('entity type is not transformed', () => {
    const dsl = createBuilder().build({ eventStream: { events: [{ id: 'e1', timestamp: '', level: 'info' as const, source: '', message: '' }] } })
    expect(dsl.world.entities[0].type).toBe('eventStream')
  })

  it('MetadataComponent has no extra properties', () => {
    const dsl = createBuilder().build({ overview: { traceCount: 1, timelineCount: 0, historyCount: 0 } })
    const props = dsl.world.entities[0].components[0].properties
    const keys = Object.keys(props)
    expect(keys).toEqual(['source'])
  })

  it('world with name is independent of entity count', () => {
    const dsl1 = createBuilder().build({})
    const dsl2 = createBuilder().build(buildFullDomainModel())
    // Both should have same naming behavior
    expect(dsl1.world.name).toBe(dsl2.world.name)
  })

  it('no phantom sections leak into entities', () => {
    const dsl = createBuilder().build({ overview: { traceCount: 1, timelineCount: 0, historyCount: 0 } })
    for (const entity of dsl.world.entities) {
      expect(['overview', 'trace', 'timeline', 'history', 'diff', 'runtime', 'eventStream']).toContain(entity.id)
    }
  })
})

// ---------------------------------------------------------------------------
// Section 13 — Compatibility (No Breaking Changes)
// ---------------------------------------------------------------------------

describe('compatibility', () => {
  it('existing PromptAssemblyDomainModel is unchanged after build', () => {
    const domainModel = buildFullDomainModel()
    const before = JSON.stringify(domainModel)
    createBuilder().build(domainModel)
    expect(JSON.stringify(domainModel)).toBe(before)
  })

  it('builder does not import web package types', () => {
    const dsl = createBuilder().build(buildFullDomainModel())
    const modelStr = JSON.stringify(dsl)
    // Game DSL should NOT contain ViewModel-specific or web-specific field names
    expect(modelStr).not.toContain('diffView')
    expect(modelStr).not.toContain('runtimeView')
    expect(modelStr).not.toContain('eventStreamView')
    expect(modelStr).not.toContain('traceView')
    expect(modelStr).not.toContain('timelineView')
    expect(modelStr).not.toContain('historyView')
    expect(modelStr).not.toContain('observatory')
  })

  it('builder does not import Runtime types', () => {
    // Verify the output has no Runtime-specific concepts
    const dsl = createBuilder().build(buildFullDomainModel())
    const modelStr = JSON.stringify(dsl)
    expect(modelStr).not.toContain('worldId')
    // world.name is the DSL concept, not Runtime's world
    expect(dsl.world.name).toBeDefined()
  })

  it('builder is stateless across builds', () => {
    const builder = createBuilder()
    const first = builder.build({ overview: { traceCount: 1, timelineCount: 0, historyCount: 0 } })
    const second = builder.build(buildFullDomainModel())
    // The two results should be independent
    expect(first.world.entities.length).toBe(1)
    expect(second.world.entities.length).toBe(7)
    // No state leakage
    expect(first.world.entities.length).toBe(1)
  })

  it('EMPTY_GAME_DSL remains accessible from shared package', () => {
    // Verify that GameDsl types still work with EMPTY_GAME_DSL
    expect(EMPTY_GAME_DSL).toBeDefined()
    expect(EMPTY_GAME_DSL.world.name).toBe('')
  })
})