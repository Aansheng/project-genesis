/**
 * PromptAssemblyDomainModelBuilder — verifies the DefaultPromptAssemblyDomainModelBuilder
 * implementation for converting PromptObservatoryMetadata → PromptAssemblyDomainModel.
 *
 * WO-S7-001 — Prompt Assembly Domain Model Foundation
 * Architecture version v1.59
 */

import { describe, it, expect } from 'vitest'
import { DefaultPromptAssemblyDomainModelBuilder } from '../observatory/domain'
import type { PromptAssemblyDomainModelBuilder } from '../observatory/domain'
import type { PromptAssemblyDomainModel } from '../observatory/domain'
import type { PromptObservatoryMetadata } from '../observatory'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createBuilder(): PromptAssemblyDomainModelBuilder {
  return new DefaultPromptAssemblyDomainModelBuilder()
}

/** Build metadata with all 7 sections populated with valid data. */
function buildFullMetadata(): PromptObservatoryMetadata {
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
          health: 100,
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

function expectEmptyModel(model: PromptAssemblyDomainModel): void {
  expect(model.overview).toBeUndefined()
  expect(model.trace).toBeUndefined()
  expect(model.timeline).toBeUndefined()
  expect(model.history).toBeUndefined()
  expect(model.diff).toBeUndefined()
  expect(model.runtime).toBeUndefined()
  expect(model.eventStream).toBeUndefined()
}

// ---------------------------------------------------------------------------
// Section 1 — Construction
// ---------------------------------------------------------------------------

describe('construction', () => {
  it('creates builder without error', () => {
    const builder = createBuilder()
    expect(builder).toBeDefined()
  })

  it('builder implements PromptAssemblyDomainModelBuilder interface', () => {
    const builder = createBuilder()
    expect(typeof builder.build).toBe('function')
  })

  it('build method accepts PromptObservatoryMetadata', () => {
    const builder = createBuilder()
    const result = builder.build({})
    expect(result).toBeDefined()
  })

  it('build method returns PromptAssemblyDomainModel', () => {
    const result = createBuilder().build({})
    expect(typeof result).toBe('object')
    expect(result).not.toBeNull()
  })
})

// ---------------------------------------------------------------------------
// Section 2 — Empty Metadata
// ---------------------------------------------------------------------------

describe('empty metadata', () => {
  it('undefined metadata returns empty model', () => {
    const model = createBuilder().build(undefined as unknown as PromptObservatoryMetadata)
    expectEmptyModel(model)
  })

  it('null metadata returns empty model', () => {
    const model = createBuilder().build(null as unknown as PromptObservatoryMetadata)
    expectEmptyModel(model)
  })

  it('empty object returns empty model', () => {
    const model = createBuilder().build({})
    expectEmptyModel(model)
  })

  it('empty object model is frozen', () => {
    const model = createBuilder().build({})
    expect(Object.isFrozen(model)).toBe(true)
  })

  it('non-object input returns empty model', () => {
    const model = createBuilder().build('invalid' as unknown as PromptObservatoryMetadata)
    expectEmptyModel(model)
  })

  it('array input returns empty model', () => {
    const model = createBuilder().build([] as unknown as PromptObservatoryMetadata)
    expectEmptyModel(model)
  })
})

// ---------------------------------------------------------------------------
// Section 3 — Full Metadata (All 7 Sections)
// ---------------------------------------------------------------------------

describe('full metadata', () => {
  it('builds overview section', () => {
    const model = createBuilder().build(buildFullMetadata())
    expect(model.overview).toBeDefined()
    expect(model.overview!.traceCount).toBe(3)
    expect(model.overview!.timelineCount).toBe(2)
    expect(model.overview!.historyCount).toBe(1)
  })

  it('builds trace section', () => {
    const model = createBuilder().build(buildFullMetadata())
    expect(model.trace).toBeDefined()
    expect(model.trace!.length).toBe(2)
    expect(model.trace![0].label).toBe('Trace 1')
    expect(model.trace![0].steps.length).toBe(1)
    expect(model.trace![0].steps[0].status).toBe('done')
  })

  it('builds timeline section', () => {
    const model = createBuilder().build(buildFullMetadata())
    expect(model.timeline).toBeDefined()
    expect(model.timeline!.length).toBe(1)
    expect(model.timeline![0].label).toBe('Timeline 1')
    expect(model.timeline![0].entries[0].timestamp).toBe('10:00')
  })

  it('builds history section', () => {
    const model = createBuilder().build(buildFullMetadata())
    expect(model.history).toBeDefined()
    expect(model.history!.length).toBe(1)
    expect(model.history![0].label).toBe('History 1')
  })

  it('builds diff section', () => {
    const model = createBuilder().build(buildFullMetadata())
    expect(model.diff).toBeDefined()
    expect(model.diff!.length).toBe(1)
    expect(model.diff![0].added).toContain('A')
    expect(model.diff![0].removed).toContain('C')
    expect(model.diff![0].changed).toContain('D')
  })

  it('builds runtime section', () => {
    const model = createBuilder().build(buildFullMetadata())
    expect(model.runtime).toBeDefined()
    expect(model.runtime!.worldId).toBe('world-001')
    expect(model.runtime!.entityCount).toBe(100)
    expect(model.runtime!.systemCount).toBe(5)
    expect(model.runtime!.eventCount).toBe(20)
    expect(model.runtime!.fps).toBe(60)
    expect(model.runtime!.entities.length).toBe(1)
    expect(model.runtime!.entities[0].type).toBe('Guard')
  })

  it('builds eventStream section', () => {
    const model = createBuilder().build(buildFullMetadata())
    expect(model.eventStream).toBeDefined()
    expect(model.eventStream!.events.length).toBe(1)
    expect(model.eventStream!.events[0].level).toBe('info')
    expect(model.eventStream!.events[0].message).toBe('Event message')
  })

  it('all 7 sections are present in full metadata', () => {
    const model = createBuilder().build(buildFullMetadata())
    expect(model.overview).toBeDefined()
    expect(model.trace).toBeDefined()
    expect(model.timeline).toBeDefined()
    expect(model.history).toBeDefined()
    expect(model.diff).toBeDefined()
    expect(model.runtime).toBeDefined()
    expect(model.eventStream).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Section 4 — Partial Metadata
// ---------------------------------------------------------------------------

describe('partial metadata', () => {
  it('only overview section', () => {
    const model = createBuilder().build({
      overview: { traceCount: 5, timelineCount: 3, historyCount: 2 },
    })
    expect(model.overview).toBeDefined()
    expect(model.overview!.traceCount).toBe(5)
    expect(model.trace).toBeUndefined()
    expect(model.timeline).toBeUndefined()
    expect(model.history).toBeUndefined()
    expect(model.diff).toBeUndefined()
    expect(model.runtime).toBeUndefined()
    expect(model.eventStream).toBeUndefined()
  })

  it('only trace section', () => {
    const model = createBuilder().build({
      trace: [{ id: 't1', label: 'Only Trace', steps: [{ id: 's1', label: 'Step', status: 'ok' }] }],
    })
    expect(model.trace).toBeDefined()
    expect(model.trace!.length).toBe(1)
    expect(model.overview).toBeUndefined()
  })

  it('only runtime section', () => {
    const model = createBuilder().build({
      runtime: { worldId: 'rw', entityCount: 50, systemCount: 3, eventCount: 10, fps: 30, entities: [] },
    })
    expect(model.runtime).toBeDefined()
    expect(model.runtime!.worldId).toBe('rw')
    expect(model.trace).toBeUndefined()
  })

  it('only eventStream section', () => {
    const model = createBuilder().build({
      eventStream: { events: [{ id: 'e1', timestamp: '', level: 'info', source: '', message: '' }] },
    })
    expect(model.eventStream).toBeDefined()
    expect(model.eventStream!.events.length).toBe(1)
    expect(model.trace).toBeUndefined()
  })

  it('overview with null fields produces defaults', () => {
    const model = createBuilder().build({
      overview: { traceCount: null, timelineCount: undefined, historyCount: 'invalid' },
    })
    expect(model.overview).toBeDefined()
    expect(model.overview!.traceCount).toBe(0)
    expect(model.overview!.timelineCount).toBe(0)
    expect(model.overview!.historyCount).toBe(0)
  })

  it('runtime with empty entities array produces empty entities', () => {
    const model = createBuilder().build({
      runtime: { worldId: 'w1', entityCount: 0, systemCount: 0, eventCount: 0, fps: 0, entities: [] },
    })
    expect(model.runtime).toBeDefined()
    expect(model.runtime!.entities).toEqual([])
  })

  it('empty arrays are omitted (trace with empty array)', () => {
    const model = createBuilder().build({ trace: [] })
    expect(model.trace).toBeUndefined()
  })

  it('null section values are omitted', () => {
    const model = createBuilder().build({
      overview: null,
      trace: null,
      timeline: null,
      history: null,
      diff: null,
      runtime: null,
      eventStream: null,
    } as unknown as PromptObservatoryMetadata)
    expectEmptyModel(model)
  })
})

// ---------------------------------------------------------------------------
// Section 5 — Immutability & Frozen Outputs
// ---------------------------------------------------------------------------

describe('immutability', () => {
  it('root model is frozen', () => {
    const model = createBuilder().build(buildFullMetadata())
    expect(Object.isFrozen(model)).toBe(true)
  })

  it('overview section is frozen', () => {
    const model = createBuilder().build(buildFullMetadata())
    expect(Object.isFrozen(model.overview)).toBe(true)
  })

  it('trace array is frozen', () => {
    const model = createBuilder().build(buildFullMetadata())
    expect(Object.isFrozen(model.trace)).toBe(true)
  })

  it('trace items are frozen', () => {
    const model = createBuilder().build(buildFullMetadata())
    expect(Object.isFrozen(model.trace![0])).toBe(true)
  })

  it('trace steps array is frozen', () => {
    const model = createBuilder().build(buildFullMetadata())
    expect(Object.isFrozen(model.trace![0].steps)).toBe(true)
  })

  it('timeline array is frozen', () => {
    const model = createBuilder().build(buildFullMetadata())
    expect(Object.isFrozen(model.timeline)).toBe(true)
  })

  it('history array is frozen', () => {
    const model = createBuilder().build(buildFullMetadata())
    expect(Object.isFrozen(model.history)).toBe(true)
  })

  it('diff array is frozen', () => {
    const model = createBuilder().build(buildFullMetadata())
    expect(Object.isFrozen(model.diff)).toBe(true)
  })

  it('runtime is frozen', () => {
    const model = createBuilder().build(buildFullMetadata())
    expect(Object.isFrozen(model.runtime)).toBe(true)
  })

  it('runtime entities array is frozen', () => {
    const model = createBuilder().build(buildFullMetadata())
    expect(Object.isFrozen(model.runtime!.entities)).toBe(true)
  })

  it('eventStream is frozen', () => {
    const model = createBuilder().build(buildFullMetadata())
    expect(Object.isFrozen(model.eventStream)).toBe(true)
  })

  it('eventStream events array is frozen', () => {
    const model = createBuilder().build(buildFullMetadata())
    expect(Object.isFrozen(model.eventStream!.events)).toBe(true)
  })

  it('does not mutate input metadata', () => {
    const builder = createBuilder()
    const metadata: PromptObservatoryMetadata = { overview: { traceCount: 1, timelineCount: 0, historyCount: 0 } }
    const before = JSON.stringify(metadata)
    builder.build(metadata)
    expect(JSON.stringify(metadata)).toBe(before)
  })

  it('accepts frozen input metadata', () => {
    const builder = createBuilder()
    const metadata = Object.freeze({ overview: Object.freeze({ traceCount: 1, timelineCount: 0, historyCount: 0 }) })
    expect(() => builder.build(metadata)).not.toThrow()
  })
})

// ---------------------------------------------------------------------------
// Section 6 — Determinism
// ---------------------------------------------------------------------------

describe('determinism', () => {
  it('same input produces same result', () => {
    const builder = createBuilder()
    const metadata = buildFullMetadata()
    const first = builder.build(metadata)
    const second = builder.build(metadata)
    expect(JSON.stringify(first)).toBe(JSON.stringify(second))
  })

  it('deterministic across multiple builders', () => {
    const metadata = buildFullMetadata()
    const result1 = createBuilder().build(metadata)
    const result2 = createBuilder().build(metadata)
    expect(JSON.stringify(result1)).toBe(JSON.stringify(result2))
  })

  it('deterministic with empty input', () => {
    const result1 = createBuilder().build({})
    const result2 = createBuilder().build({})
    expect(JSON.stringify(result1)).toBe(JSON.stringify(result2))
  })

  it('deterministic with partial input', () => {
    const metadata: PromptObservatoryMetadata = { trace: [{ id: 't1', label: 'Test', steps: [] }] }
    const result1 = createBuilder().build(metadata)
    const result2 = createBuilder().build(metadata)
    expect(JSON.stringify(result1)).toBe(JSON.stringify(result2))
  })
})

// ---------------------------------------------------------------------------
// Section 7 — Serialization
// ---------------------------------------------------------------------------

describe('serialization', () => {
  it('full model serializes to JSON without error', () => {
    const model = createBuilder().build(buildFullMetadata())
    expect(() => JSON.stringify(model)).not.toThrow()
  })

  it('full model JSON contains all section keys', () => {
    const model = createBuilder().build(buildFullMetadata())
    const json = JSON.stringify(model)
    expect(json).toContain('overview')
    expect(json).toContain('trace')
    expect(json).toContain('timeline')
    expect(json).toContain('history')
    expect(json).toContain('diff')
    expect(json).toContain('runtime')
    expect(json).toContain('eventStream')
  })

  it('empty model serializes to JSON', () => {
    const model = createBuilder().build({})
    expect(() => JSON.stringify(model)).not.toThrow()
  })

  it('empty model JSON is empty object', () => {
    const model = createBuilder().build({})
    expect(JSON.stringify(model)).toBe('{}')
  })

  it('partial model JSON only contains present sections', () => {
    const model = createBuilder().build({ overview: { traceCount: 1, timelineCount: 0, historyCount: 0 } })
    const parsed = JSON.parse(JSON.stringify(model))
    expect(parsed).toHaveProperty('overview')
    expect(parsed).not.toHaveProperty('trace')
    expect(parsed).not.toHaveProperty('timeline')
    expect(parsed).not.toHaveProperty('history')
    expect(parsed).not.toHaveProperty('diff')
    expect(parsed).not.toHaveProperty('runtime')
    expect(parsed).not.toHaveProperty('eventStream')
  })

  it('model values are JSON-serializable primitives', () => {
    const model = createBuilder().build(buildFullMetadata())
    const json = JSON.parse(JSON.stringify(model))
    expect(typeof json.overview.traceCount).toBe('number')
    expect(typeof json.trace[0].label).toBe('string')
    expect(Array.isArray(json.trace[0].steps)).toBe(true)
    expect(typeof json.diff[0].added[0]).toBe('string')
  })

  it('runtime entity health is always a string in JSON', () => {
    const model = createBuilder().build(buildFullMetadata())
    const json = JSON.parse(JSON.stringify(model))
    expect(typeof json.runtime.entities[0].health).toBe('string')
  })

  it('eventLevel is always a valid level string in JSON', () => {
    const model = createBuilder().build(buildFullMetadata())
    const json = JSON.parse(JSON.stringify(model))
    expect(['info', 'warning', 'error']).toContain(json.eventStream.events[0].level)
  })

  it('component data is serialized as string', () => {
    const model = createBuilder().build(buildFullMetadata())
    const json = JSON.parse(JSON.stringify(model))
    expect(typeof json.runtime.entities[0].components[0].data).toBe('string')
  })
})

// ---------------------------------------------------------------------------
// Section 8 — Edge Cases
// ---------------------------------------------------------------------------

describe('edge cases', () => {
  it('overview with extra unknown fields ignores them', () => {
    const model = createBuilder().build({
      overview: { traceCount: 3, timelineCount: 2, historyCount: 1, extraField: 'ignored' },
    })
    expect(model.overview!.traceCount).toBe(3)
    expect(model.overview!.timelineCount).toBe(2)
    expect(model.overview!.historyCount).toBe(1)
  })

  it('trace with invalid step items returns empty steps', () => {
    const model = createBuilder().build({
      trace: [{ id: 't1', label: 'Test', steps: [null, 'invalid', 42] }],
    })
    expect(model.trace![0].steps.length).toBe(3)
    // Invalid items are still included but with safe defaults
    expect(model.trace![0].steps[0].id).toBe('')
    expect(model.trace![0].steps[1].id).toBe('')
    expect(model.trace![0].steps[2].id).toBe('')
  })

  it('trace with non-object items filters them out', () => {
    const model = createBuilder().build({
      trace: ['invalid', null, 42],
    } as unknown as PromptObservatoryMetadata)
    // Non-object items are filtered out, remaining length is 0 → trace is omitted
    expect(model.trace).toBeUndefined()
  })

  it('runtime with non-array entities returns empty entities', () => {
    const model = createBuilder().build({
      runtime: { worldId: 'w1', entityCount: 5, systemCount: 0, eventCount: 0, fps: 0, entities: 'invalid' },
    })
    expect(model.runtime!.entities).toEqual([])
  })

  it('diff with non-array added/removed/changed returns empty arrays', () => {
    const model = createBuilder().build({
      diff: [{ id: 'd1', timestamp: '12:00', added: 'invalid', removed: null, changed: undefined }],
    })
    expect(model.diff![0].added).toEqual([])
    expect(model.diff![0].removed).toEqual([])
    expect(model.diff![0].changed).toEqual([])
  })

  it('eventStream with invalid level defaults to info', () => {
    const model = createBuilder().build({
      eventStream: { events: [{ id: 'e1', timestamp: '', level: 'critical', source: '', message: '' }] },
    })
    expect(model.eventStream!.events[0].level).toBe('info')
  })

  it('eventStream with empty events array is omitted', () => {
    const model = createBuilder().build({ eventStream: { events: [] } })
    expect(model.eventStream).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// Section 9 — Compatibility (No Breaking Changes)
// ---------------------------------------------------------------------------

describe('compatibility', () => {
  it('existing PromptObservatoryMetadata is unchanged after build', () => {
    const metadata = buildFullMetadata()
    const before = JSON.stringify(metadata)
    createBuilder().build(metadata)
    expect(JSON.stringify(metadata)).toBe(before)
  })

  it('existing metadata can still be consumed by Bridge', () => {
    // The domain model is parallel — existing metadata consumption is unaffected
    const metadata = buildFullMetadata()
    const model = createBuilder().build(metadata)
    // Both exist independently
    expect(metadata.overview).toBeDefined()
    expect(model.overview).toBeDefined()
  })

  it('builder does not import web package types', () => {
    // Verify no accidental coupling by checking build result has no UI types
    const model = createBuilder().build(buildFullMetadata())
    const modelStr = JSON.stringify(model)
    // Domain model should NOT contain ViewModel-specific field names
    expect(modelStr).not.toContain('diffView')
    expect(modelStr).not.toContain('runtimeView')
    expect(modelStr).not.toContain('eventStreamView')
    expect(modelStr).not.toContain('traceView')
    expect(modelStr).not.toContain('timelineView')
    expect(modelStr).not.toContain('historyView')
  })
})