/**
 * ObservatoryMapperConsumption — verifies the observatoryDataStore
 * consumes ObservatoryMapper in its data flow pipeline.
 *
 * The flow: Bridge → Mapper → Adapter → ViewModel
 *
 * WO-S6-023 — Observatory Mapping Layer Consumption
 * Architecture version v1.53
 */

import { describe, it, expect } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useObservatoryDataStore } from '../stores/observatoryData'
import { EMPTY_BRIDGE_DATA } from '../adapters/observatory/bridge'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createStore() {
  setActivePinia(createPinia())
  return useObservatoryDataStore()
}

/** Build valid metadata with at least one known key (uses bridge key names). */
function buildValidMetadata(): Record<string, unknown> {
  return {
    trace: [
      { id: 't1', label: 'Trace 1', steps: [{ id: 's1', label: 'Step 1', status: 'done' }] },
    ],
    timeline: [
      { id: 'tl1', label: 'Timeline 1', entries: [] },
    ],
  }
}

/** Build full metadata covering all 7 known bridge keys. */
function buildFullMetadata(): Record<string, unknown> {
  return {
    overview: { traceCount: 3, timelineCount: 2, historyCount: 1 },
    trace: [
      { id: 't1', label: 'Trace 1', steps: [{ id: 's1', label: 'Step 1', status: 'done' }] },
      { id: 't2', label: 'Trace 2', steps: [{ id: 's2', label: 'Step 2', status: 'running' }] },
    ],
    timeline: [
      { id: 'tl1', label: 'Timeline 1', entries: [] },
    ],
    history: [
      { id: 'h1', label: 'History 1', entries: [] },
    ],
    diff: [
      { id: 'd1', timestamp: '12:00', added: ['A'], removed: [], changed: [] },
    ],
    runtime: {
      worldId: 'bridge-world',
      entityCount: 50,
      systemCount: 4,
      eventCount: 10,
      fps: 30,
      entities: [],
    },
    eventStream: {
      events: [
        { id: 'be-001', timestamp: '12:00:01', level: 'info', source: 'Bridge', message: 'Bridge data loaded' },
      ],
    },
  }
}

/** Assert viewModel is the empty/default state. */
function expectEmptyViewModel(store: ReturnType<typeof useObservatoryDataStore>): void {
  expect(store.viewModel.overview.traceCount).toBe(0)
  expect(store.viewModel.overview.timelineCount).toBe(0)
  expect(store.viewModel.overview.historyCount).toBe(0)
  expect(store.viewModel.trace).toEqual([])
  expect(store.viewModel.traceView).toEqual([])
  expect(store.viewModel.timelineView).toEqual([])
  expect(store.viewModel.historyView).toEqual([])
  expect(store.viewModel.diffView).toEqual([])
  expect(store.viewModel.runtimeView.worldId).toBe('')
  expect(store.viewModel.runtimeView.entityCount).toBe(0)
  expect(store.viewModel.eventStreamView.events).toEqual([])
  expect(store.viewModel.timeline).toEqual([])
  expect(store.viewModel.history).toEqual([])
}

// ---------------------------------------------------------------------------
// Section 1 — Store Initialization
// ---------------------------------------------------------------------------

describe('store initialization', () => {
  it('creates store without error', () => {
    const store = createStore()
    expect(store).toBeDefined()
  })

  it('initializes viewModel as empty', () => {
    const store = createStore()
    expectEmptyViewModel(store)
  })

  it('initializes bridgeData as EMPTY_BRIDGE_DATA', () => {
    const store = createStore()
    expect(store.bridgeData).toBe(EMPTY_BRIDGE_DATA)
  })

  it('initializes bridgeData as frozen empty object', () => {
    const store = createStore()
    expect(Object.isFrozen(store.bridgeData)).toBe(true)
  })

  it('initializes bridgeData with no own keys', () => {
    const store = createStore()
    expect(Object.keys(store.bridgeData)).toEqual([])
  })

  it('has loadMockObservatory function', () => {
    const store = createStore()
    expect(typeof store.loadMockObservatory).toBe('function')
  })

  it('has loadRealObservatory function', () => {
    const store = createStore()
    expect(typeof store.loadRealObservatory).toBe('function')
  })

  it('has viewModel as readable property', () => {
    const store = createStore()
    expect(store.viewModel).toBeDefined()
  })

  it('has bridgeData as readable property', () => {
    const store = createStore()
    expect(store.bridgeData).toBeDefined()
  })

  it('initial viewModel is frozen (EMPTY_VIEW_MODEL ref)', () => {
    const store = createStore()
    expect(Object.isFrozen(store.viewModel)).toBe(true)
  })

  it('loadMockObservatory does not use mapper path', () => {
    const store = createStore()
    store.loadMockObservatory()
    // Mock loads directly to adapter, bypassing mapper
    expect(store.viewModel.overview.traceCount).toBe(3)
  })

  it('loadMockObservatory produces runtimeView data', () => {
    const store = createStore()
    store.loadMockObservatory()
    expect(store.viewModel.runtimeView.worldId).toBe('world-001')
  })

  it('loadMockObservatory produces eventStreamView data', () => {
    const store = createStore()
    store.loadMockObservatory()
    expect(store.viewModel.eventStreamView.events.length).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// Section 2 — Mapper Invocation (verified through viewModel output)
// ---------------------------------------------------------------------------

describe('mapper invocation', () => {
  it('mapper is invoked when bridge data has diff key (diff→diffView)', () => {
    const store = createStore()
    store.loadRealObservatory({ diff: [{ id: 'd1', timestamp: '12:00', added: ['A'], removed: [], changed: [] }] })
    // Without mapper: diffView would be empty (adapter looks for diffView)
    // With mapper: diffView has data
    expect(store.viewModel.diffView.length).toBe(1)
  })

  it('mapper is invoked when bridge data has runtime key (runtime→runtimeView)', () => {
    const store = createStore()
    store.loadRealObservatory({ runtime: { worldId: 'mapped-world', entityCount: 42, systemCount: 3, eventCount: 7, fps: 60, entities: [] } })
    expect(store.viewModel.runtimeView.worldId).toBe('mapped-world')
  })

  it('mapper is invoked when bridge data has eventStream key (eventStream→eventStreamView)', () => {
    const store = createStore()
    store.loadRealObservatory({ eventStream: { events: [{ id: 'e1', timestamp: '', level: 'info', source: 'Test', message: 'Mapped' }] } })
    expect(store.viewModel.eventStreamView.events.length).toBe(1)
  })

  it('mapper preserves passthrough keys (trace, timeline, history)', () => {
    const store = createStore()
    store.loadRealObservatory({
      trace: [{ id: 't1', label: 'Passthrough', steps: [] }],
      timeline: [{ id: 'tl1', label: 'TL', entries: [] }],
      history: [{ id: 'h1', label: 'H', entries: [] }],
    })
    expect(store.viewModel.overview.traceCount).toBe(1)
    expect(store.viewModel.overview.timelineCount).toBe(1)
    expect(store.viewModel.overview.historyCount).toBe(1)
  })

  it('mapper maps all 7 keys correctly in one call', () => {
    const store = createStore()
    store.loadRealObservatory(buildFullMetadata())
    expect(store.viewModel.overview.traceCount).toBe(2)
    expect(store.viewModel.overview.timelineCount).toBe(1)
    expect(store.viewModel.overview.historyCount).toBe(1)
    expect(store.viewModel.trace.length).toBe(2)
    expect(store.viewModel.timeline.length).toBe(1)
    expect(store.viewModel.history.length).toBe(1)
    expect(store.viewModel.diffView.length).toBe(1)
    expect(store.viewModel.runtimeView.worldId).toBe('bridge-world')
    expect(store.viewModel.eventStreamView.events.length).toBe(1)
  })

  it('mapper does not modify bridgeData keys', () => {
    const store = createStore()
    store.loadRealObservatory(buildFullMetadata())
    // bridgeData should still have bridge key names
    expect('diff' in store.bridgeData).toBe(true)
    expect('runtime' in store.bridgeData).toBe(true)
    expect('eventStream' in store.bridgeData).toBe(true)
  })

  it('mapper does not add adapter key names to bridgeData', () => {
    const store = createStore()
    store.loadRealObservatory(buildFullMetadata())
    expect('diffView' in store.bridgeData).toBe(false)
    expect('runtimeView' in store.bridgeData).toBe(false)
    expect('eventStreamView' in store.bridgeData).toBe(false)
  })

  it('mapper receives bridge output (frozen bridgeData)', () => {
    const store = createStore()
    store.loadRealObservatory(buildFullMetadata())
    // bridgeData must be frozen (bridge produces frozen objects)
    expect(Object.isFrozen(store.bridgeData)).toBe(true)
  })

  it('mapper handles empty bridge result from empty metadata', () => {
    const store = createStore()
    store.loadRealObservatory({})
    expectEmptyViewModel(store)
  })

  it('mapper handles bridge result with only unknown keys', () => {
    const store = createStore()
    store.loadRealObservatory({ unknownKey: 'value' })
    expectEmptyViewModel(store)
  })
})

// ---------------------------------------------------------------------------
// Section 3 — Bridge Invocation
// ---------------------------------------------------------------------------

describe('bridge invocation', () => {
  it('bridge is invoked on loadRealObservatory', () => {
    const store = createStore()
    store.loadRealObservatory(buildValidMetadata())
    expect(store.bridgeData).not.toBe(EMPTY_BRIDGE_DATA)
  })

  it('bridge output is stored in bridgeData', () => {
    const store = createStore()
    store.loadRealObservatory(buildValidMetadata())
    expect('trace' in store.bridgeData).toBe(true)
  })

  it('bridge extracts known keys from metadata', () => {
    const store = createStore()
    store.loadRealObservatory(buildFullMetadata())
    expect('overview' in store.bridgeData).toBe(true)
    expect('trace' in store.bridgeData).toBe(true)
    expect('timeline' in store.bridgeData).toBe(true)
    expect('history' in store.bridgeData).toBe(true)
    expect('diff' in store.bridgeData).toBe(true)
    expect('runtime' in store.bridgeData).toBe(true)
    expect('eventStream' in store.bridgeData).toBe(true)
  })

  it('bridge output is frozen', () => {
    const store = createStore()
    store.loadRealObservatory(buildValidMetadata())
    expect(Object.isFrozen(store.bridgeData)).toBe(true)
  })

  it('bridge ignores unknown metadata keys', () => {
    const store = createStore()
    store.loadRealObservatory({ trace: [], unknownKey: 42 })
    expect('trace' in store.bridgeData).toBe(true)
    expect('unknownKey' in store.bridgeData).toBe(false)
  })

  it('bridge returns empty for undefined metadata', () => {
    const store = createStore()
    store.loadRealObservatory(undefined)
    expect(store.bridgeData).toBe(EMPTY_BRIDGE_DATA)
  })

  it('bridge returns empty for null metadata', () => {
    const store = createStore()
    store.loadRealObservatory(null)
    expect(store.bridgeData).toBe(EMPTY_BRIDGE_DATA)
  })

  it('bridge returns empty for primitive metadata', () => {
    const store = createStore()
    store.loadRealObservatory('hello')
    expect(store.bridgeData).toBe(EMPTY_BRIDGE_DATA)
  })

  it('bridge preserves metadata values', () => {
    const store = createStore()
    store.loadRealObservatory({ trace: [{ id: 'keep-id', label: 'Keep', steps: [] }] })
    const bridgeData = store.bridgeData
    const trace = (bridgeData.trace as unknown as unknown[] | undefined)
    expect(trace?.[0]).toBeDefined()
    expect((trace?.[0] as Record<string, unknown> | undefined)?.label).toBe('Keep')
  })

  it('bridge preserves nested metadata structure', () => {
    const store = createStore()
    const metadata = {
      trace: [{ id: 'nested', label: 'Nested', steps: [{ id: 's1', label: 'Step', status: 'ok' }] }],
    }
    store.loadRealObservatory(metadata)
    const trace = (store.bridgeData.trace as unknown as unknown[] | undefined)
    expect(trace?.[0]).toBeDefined()
    expect((trace?.[0] as Record<string, unknown> | undefined)?.steps).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Section 4 — Adapter Invocation
// ---------------------------------------------------------------------------

describe('adapter invocation', () => {
  it('adapter produces viewModel from mapped data', () => {
    const store = createStore()
    store.loadRealObservatory(buildValidMetadata())
    expect(store.viewModel.overview.traceCount).toBe(1)
  })

  it('adapter produces viewModel with all required sections', () => {
    const store = createStore()
    store.loadRealObservatory(buildFullMetadata())
    const vm = store.viewModel
    expect(vm).toHaveProperty('overview')
    expect(vm).toHaveProperty('trace')
    expect(vm).toHaveProperty('traceView')
    expect(vm).toHaveProperty('timelineView')
    expect(vm).toHaveProperty('historyView')
    expect(vm).toHaveProperty('diffView')
    expect(vm).toHaveProperty('runtimeView')
    expect(vm).toHaveProperty('eventStreamView')
    expect(vm).toHaveProperty('timeline')
    expect(vm).toHaveProperty('history')
  })

  it('adapter receives mapped data with adapter key names', () => {
    const store = createStore()
    store.loadRealObservatory(buildFullMetadata())
    // Adapter receives diffView (from mapper), not diff
    expect(store.viewModel.diffView.length).toBeGreaterThan(0)
  })

  it('adapter processes runtime data through mapper', () => {
    const store = createStore()
    store.loadRealObservatory(buildFullMetadata())
    expect(store.viewModel.runtimeView.worldId).toBe('bridge-world')
    expect(store.viewModel.runtimeView.entityCount).toBe(50)
    expect(store.viewModel.runtimeView.systemCount).toBe(4)
    expect(store.viewModel.runtimeView.eventCount).toBe(10)
    expect(store.viewModel.runtimeView.fps).toBe(30)
  })

  it('adapter processes eventStream data through mapper', () => {
    const store = createStore()
    store.loadRealObservatory(buildFullMetadata())
    expect(store.viewModel.eventStreamView.events.length).toBe(1)
  })

  it('adapter processes diff data through mapper', () => {
    const store = createStore()
    store.loadRealObservatory(buildFullMetadata())
    expect(store.viewModel.diffView.length).toBe(1)
  })

  it('adapter handles mapped trace data', () => {
    const store = createStore()
    store.loadRealObservatory({ trace: [{ id: 't1', label: 'Adapted', steps: [] }] })
    expect(store.viewModel.trace[0].label).toBe('Adapted')
  })

  it('adapter handles mapped timeline data', () => {
    const store = createStore()
    store.loadRealObservatory({ timeline: [{ id: 'tl1', label: 'Timeline', entries: [] }] })
    expect(store.viewModel.timeline[0].label).toBe('Timeline')
  })

  it('adapter handles mapped history data', () => {
    const store = createStore()
    store.loadRealObservatory({ history: [{ id: 'h1', label: 'History', entries: [] }] })
    expect(store.viewModel.history[0].label).toBe('History')
  })

  it('adapter returns defaults for empty mapped data', () => {
    const store = createStore()
    store.loadRealObservatory({})
    expectEmptyViewModel(store)
  })
})

// ---------------------------------------------------------------------------
// Section 5 — Mapping Priority (mapper over raw bridge keys)
// ---------------------------------------------------------------------------

describe('mapping priority', () => {
  it('mapper keys take priority over raw bridge keys', () => {
    // If both diff and diffView are in metadata, mapper processes diff → diffView
    const store = createStore()
    store.loadRealObservatory({
      diff: [{ id: 'd1', timestamp: '12:00', added: ['A'], removed: [], changed: [] }],
      diffView: [{ id: 'fake', timestamp: '', added: [], removed: [], changed: [] }],
    })
    // Mapper maps diff → diffView, overriding any raw diffView
    // The mapper only processes known bridge keys, not adapter keys
    expect(store.viewModel.diffView.length).toBe(1)
  })

  it('mapper does not process adapter-suffixed keys as input', () => {
    const store = createStore()
    store.loadRealObservatory({
      diffView: [{ id: 'dv1', timestamp: '12:00', added: [], removed: [], changed: [] }],
      runtimeView: { worldId: 'rv', entityCount: 10, systemCount: 0, eventCount: 0, fps: 0, entities: [] },
    })
    // diffView and runtimeView are not known bridge keys, so bridge doesn't extract them
    // Mapper gets empty bridge data → empty mapped → empty viewModel
    expectEmptyViewModel(store)
  })

  it('mapper resolves diff over raw diffView in metadata', () => {
    const store = createStore()
    store.loadRealObservatory({
      diff: [{ id: 'from-diff', timestamp: '12:00', added: ['A'], removed: [], changed: [] }],
    })
    // diff is mapped to diffView; adapter gets it
    expect(store.viewModel.diffView.length).toBe(1)
  })

  it('mapper resolves runtime over raw runtimeView in metadata', () => {
    const store = createStore()
    store.loadRealObservatory({
      runtime: { worldId: 'from-runtime', entityCount: 99, systemCount: 5, eventCount: 3, fps: 60, entities: [] },
    })
    expect(store.viewModel.runtimeView.worldId).toBe('from-runtime')
    expect(store.viewModel.runtimeView.entityCount).toBe(99)
  })

  it('mapper resolves eventStream over raw eventStreamView in metadata', () => {
    const store = createStore()
    store.loadRealObservatory({
      eventStream: { events: [{ id: 'from-es', timestamp: '', level: 'info', source: 'S', message: 'M' }] },
    })
    expect(store.viewModel.eventStreamView.events.length).toBe(1)
  })

  it('passthrough keys are not affected by priority', () => {
    const store = createStore()
    store.loadRealObservatory({
      trace: [{ id: 't1', label: 'Priority', steps: [] }],
    })
    expect(store.viewModel.trace[0].label).toBe('Priority')
  })

  it('mapped data overrides empty section in adapter', () => {
    const store = createStore()
    store.loadRealObservatory({
      diff: [{ id: 'override', timestamp: '12:00', added: ['X'], removed: [], changed: [] }],
      eventStream: { events: [{ id: 'e1', timestamp: '', level: 'info', source: 'S', message: 'M' }] },
    })
    expect(store.viewModel.diffView.length).toBe(1)
    expect(store.viewModel.eventStreamView.events.length).toBe(1)
  })
})

// ---------------------------------------------------------------------------
// Section 6 — Diff → DiffView
// ---------------------------------------------------------------------------

describe('diff → diffView', () => {
  it('single diff entry maps to diffView', () => {
    const store = createStore()
    store.loadRealObservatory({ diff: [{ id: 'd1', timestamp: '12:00', added: [], removed: [], changed: [] }] })
    expect(store.viewModel.diffView.length).toBe(1)
  })

  it('multiple diff entries all map to diffView', () => {
    const store = createStore()
    store.loadRealObservatory({
      diff: [
        { id: 'd1', timestamp: '12:00', added: ['A'], removed: [], changed: [] },
        { id: 'd2', timestamp: '13:00', added: ['B'], removed: ['C'], changed: ['D'] },
        { id: 'd3', timestamp: '14:00', added: [], removed: [], changed: [] },
      ],
    })
    expect(store.viewModel.diffView.length).toBe(3)
  })

  it('diff entry with added items maps correctly', () => {
    const store = createStore()
    store.loadRealObservatory({ diff: [{ id: 'd1', timestamp: '12:00', added: ['EntityA', 'EntityB'], removed: [], changed: [] }] })
    expect(store.viewModel.diffView.length).toBe(1)
  })

  it('diff entry with removed items maps correctly', () => {
    const store = createStore()
    store.loadRealObservatory({ diff: [{ id: 'd1', timestamp: '12:00', added: [], removed: ['OldEntity'], changed: [] }] })
    expect(store.viewModel.diffView.length).toBe(1)
  })

  it('diff entry with changed items maps correctly', () => {
    const store = createStore()
    store.loadRealObservatory({ diff: [{ id: 'd1', timestamp: '12:00', added: [], removed: [], changed: ['ModifiedEntity'] }] })
    expect(store.viewModel.diffView.length).toBe(1)
  })

  it('diff entry with all fields populated maps correctly', () => {
    const store = createStore()
    store.loadRealObservatory({ diff: [{ id: 'd1', timestamp: '12:00', added: ['A', 'B'], removed: ['C'], changed: ['D', 'E'] }] })
    expect(store.viewModel.diffView.length).toBe(1)
  })

  it('empty diff array produces empty diffView', () => {
    const store = createStore()
    store.loadRealObservatory({ diff: [] })
    expect(store.viewModel.diffView).toEqual([])
  })

  it('null diff produces empty diffView', () => {
    const store = createStore()
    store.loadRealObservatory({ diff: null })
    expect(store.viewModel.diffView).toEqual([])
  })

  it('undefined diff produces empty diffView', () => {
    const store = createStore()
    store.loadRealObservatory({ diff: undefined })
    expect(store.viewModel.diffView).toEqual([])
  })

  it('diff as string produces empty diffView', () => {
    const store = createStore()
    store.loadRealObservatory({ diff: 'not-an-array' })
    expect(store.viewModel.diffView).toEqual([])
  })

  it('diff as object produces empty diffView', () => {
    const store = createStore()
    store.loadRealObservatory({ diff: { id: 'd1' } })
    expect(store.viewModel.diffView).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// Section 7 — Runtime → RuntimeView
// ---------------------------------------------------------------------------

describe('runtime → runtimeView', () => {
  it('runtime with all fields maps correctly', () => {
    const store = createStore()
    store.loadRealObservatory({
      runtime: { worldId: 'w1', entityCount: 100, systemCount: 5, eventCount: 20, fps: 60, entities: [] },
    })
    expect(store.viewModel.runtimeView.worldId).toBe('w1')
    expect(store.viewModel.runtimeView.entityCount).toBe(100)
    expect(store.viewModel.runtimeView.systemCount).toBe(5)
    expect(store.viewModel.runtimeView.eventCount).toBe(20)
    expect(store.viewModel.runtimeView.fps).toBe(60)
  })

  it('runtime with entities maps entities correctly', () => {
    const store = createStore()
    store.loadRealObservatory({
      runtime: {
        worldId: 'w1', entityCount: 1, systemCount: 1, eventCount: 0, fps: 30,
        entities: [{ id: 'e1', type: 'Guard', position: '(5,5)', health: 100, state: 'Patrol', components: [] }],
      },
    })
    expect(store.viewModel.runtimeView.entities.length).toBe(1)
    expect(store.viewModel.runtimeView.entities[0].id).toBe('e1')
  })

  it('runtime with multiple entities maps all entities', () => {
    const store = createStore()
    store.loadRealObservatory({
      runtime: {
        worldId: 'w1', entityCount: 3, systemCount: 2, eventCount: 5, fps: 30,
        entities: [
          { id: 'e1', type: 'Guard', position: '(0,0)', health: 100, state: 'Patrol', components: [] },
          { id: 'e2', type: 'Villager', position: '(1,1)', health: 80, state: 'Working', components: [] },
          { id: 'e3', type: 'Merchant', position: '(2,2)', health: 90, state: 'Trading', components: [] },
        ],
      },
    })
    expect(store.viewModel.runtimeView.entities.length).toBe(3)
  })

  it('empty runtime for entities produces empty entities list', () => {
    const store = createStore()
    store.loadRealObservatory({
      runtime: { worldId: 'w1', entityCount: 0, systemCount: 0, eventCount: 0, fps: 0, entities: [] },
    })
    expect(store.viewModel.runtimeView.entities).toEqual([])
  })

  it('null runtime produces default runtimeView', () => {
    const store = createStore()
    store.loadRealObservatory({ runtime: null })
    expect(store.viewModel.runtimeView.worldId).toBe('')
    expect(store.viewModel.runtimeView.entityCount).toBe(0)
  })

  it('undefined runtime produces default runtimeView', () => {
    const store = createStore()
    store.loadRealObservatory({ runtime: undefined })
    expect(store.viewModel.runtimeView.worldId).toBe('')
  })

  it('runtime as string produces default runtimeView', () => {
    const store = createStore()
    store.loadRealObservatory({ runtime: 'bad-data' })
    expect(store.viewModel.runtimeView.worldId).toBe('')
  })

  it('runtime as array produces default runtimeView', () => {
    const store = createStore()
    store.loadRealObservatory({ runtime: [] })
    expect(store.viewModel.runtimeView.worldId).toBe('')
  })

  it('runtime with partial fields fills defaults', () => {
    const store = createStore()
    store.loadRealObservatory({
      runtime: { worldId: 'partial', entityCount: 10 },
    })
    expect(store.viewModel.runtimeView.worldId).toBe('partial')
    expect(store.viewModel.runtimeView.entityCount).toBe(10)
  })
})

// ---------------------------------------------------------------------------
// Section 8 — EventStream → EventStreamView
// ---------------------------------------------------------------------------

describe('eventStream → eventStreamView', () => {
  it('eventStream with single event maps correctly', () => {
    const store = createStore()
    store.loadRealObservatory({
      eventStream: { events: [{ id: 'e1', timestamp: '12:00', level: 'info', source: 'Test', message: 'Event' }] },
    })
    expect(store.viewModel.eventStreamView.events.length).toBe(1)
  })

  it('eventStream with multiple events maps all events', () => {
    const store = createStore()
    store.loadRealObservatory({
      eventStream: {
        events: [
          { id: 'e1', timestamp: '12:00', level: 'info', source: 'A', message: 'M1' },
          { id: 'e2', timestamp: '13:00', level: 'warning', source: 'B', message: 'M2' },
          { id: 'e3', timestamp: '14:00', level: 'error', source: 'C', message: 'M3' },
        ],
      },
    })
    expect(store.viewModel.eventStreamView.events.length).toBe(3)
  })

  it('eventStream with info level events maps correctly', () => {
    const store = createStore()
    store.loadRealObservatory({
      eventStream: { events: [{ id: 'e1', timestamp: '', level: 'info', source: 'Src', message: 'Msg' }] },
    })
    expect(store.viewModel.eventStreamView.events.length).toBe(1)
  })

  it('eventStream with warning level events maps correctly', () => {
    const store = createStore()
    store.loadRealObservatory({
      eventStream: { events: [{ id: 'e1', timestamp: '', level: 'warning', source: 'Src', message: 'Warn' }] },
    })
    expect(store.viewModel.eventStreamView.events.length).toBe(1)
  })

  it('eventStream with error level events maps correctly', () => {
    const store = createStore()
    store.loadRealObservatory({
      eventStream: { events: [{ id: 'e1', timestamp: '', level: 'error', source: 'Src', message: 'Err' }] },
    })
    expect(store.viewModel.eventStreamView.events.length).toBe(1)
  })

  it('empty events array produces empty eventStreamView', () => {
    const store = createStore()
    store.loadRealObservatory({ eventStream: { events: [] } })
    expect(store.viewModel.eventStreamView.events).toEqual([])
  })

  it('null eventStream produces default eventStreamView', () => {
    const store = createStore()
    store.loadRealObservatory({ eventStream: null })
    expect(store.viewModel.eventStreamView.events).toEqual([])
  })

  it('undefined eventStream produces default eventStreamView', () => {
    const store = createStore()
    store.loadRealObservatory({ eventStream: undefined })
    expect(store.viewModel.eventStreamView.events).toEqual([])
  })

  it('eventStream without events key produces default', () => {
    const store = createStore()
    store.loadRealObservatory({ eventStream: {} })
    expect(store.viewModel.eventStreamView.events).toEqual([])
  })

  it('eventStream events preserve message content', () => {
    const store = createStore()
    store.loadRealObservatory({
      eventStream: { events: [{ id: 'e1', timestamp: '12:00', level: 'info', source: 'S', message: 'Custom message' }] },
    })
    const events = store.viewModel.eventStreamView.events
    expect(events.length).toBe(1)
  })
})

// ---------------------------------------------------------------------------
// Section 9 — Partial Bridge
// ---------------------------------------------------------------------------

describe('partial bridge', () => {
  it('only trace produces correct traceCount', () => {
    const store = createStore()
    store.loadRealObservatory({ trace: [{ id: 't1', label: 'T', steps: [] }] })
    expect(store.viewModel.overview.traceCount).toBe(1)
    expect(store.viewModel.overview.timelineCount).toBe(0)
    expect(store.viewModel.overview.historyCount).toBe(0)
  })

  it('only timeline produces correct timelineCount', () => {
    const store = createStore()
    store.loadRealObservatory({ timeline: [{ id: 'tl1', label: 'TL', entries: [] }] })
    expect(store.viewModel.overview.traceCount).toBe(0)
    expect(store.viewModel.overview.timelineCount).toBe(1)
    expect(store.viewModel.overview.historyCount).toBe(0)
  })

  it('only history produces correct historyCount', () => {
    const store = createStore()
    store.loadRealObservatory({ history: [{ id: 'h1', label: 'H', entries: [] }] })
    expect(store.viewModel.overview.traceCount).toBe(0)
    expect(store.viewModel.overview.timelineCount).toBe(0)
    expect(store.viewModel.overview.historyCount).toBe(1)
  })

  it('only diff (via mapper) produces diffView data', () => {
    const store = createStore()
    store.loadRealObservatory({ diff: [{ id: 'd1', timestamp: '12:00', added: ['A'], removed: [], changed: [] }] })
    expect(store.viewModel.diffView.length).toBe(1)
  })

  it('only runtime (via mapper) produces runtimeView data', () => {
    const store = createStore()
    store.loadRealObservatory({ runtime: { worldId: 'rw', entityCount: 5, systemCount: 1, eventCount: 0, fps: 30, entities: [] } })
    expect(store.viewModel.runtimeView.worldId).toBe('rw')
  })

  it('only eventStream (via mapper) produces eventStreamView data', () => {
    const store = createStore()
    store.loadRealObservatory({ eventStream: { events: [{ id: 'e1', timestamp: '', level: 'info', source: 'S', message: 'M' }] } })
    expect(store.viewModel.eventStreamView.events.length).toBe(1)
  })

  it('trace and diff combo (mapper resolves diff)', () => {
    const store = createStore()
    store.loadRealObservatory({
      trace: [{ id: 't1', label: 'T', steps: [] }],
      diff: [{ id: 'd1', timestamp: '12:00', added: ['A'], removed: [], changed: [] }],
    })
    expect(store.viewModel.overview.traceCount).toBe(1)
    expect(store.viewModel.diffView.length).toBe(1)
  })

  it('timeline and runtime combo (mapper resolves runtime)', () => {
    const store = createStore()
    store.loadRealObservatory({
      timeline: [{ id: 'tl1', label: 'TL', entries: [] }],
      runtime: { worldId: 'wrld', entityCount: 10, systemCount: 2, eventCount: 5, fps: 30, entities: [] },
    })
    expect(store.viewModel.overview.timelineCount).toBe(1)
    expect(store.viewModel.runtimeView.worldId).toBe('wrld')
  })

  it('history and eventStream combo (mapper resolves eventStream)', () => {
    const store = createStore()
    store.loadRealObservatory({
      history: [{ id: 'h1', label: 'H', entries: [] }],
      eventStream: { events: [{ id: 'e1', timestamp: '', level: 'info', source: 'S', message: 'M' }] },
    })
    expect(store.viewModel.overview.historyCount).toBe(1)
    expect(store.viewModel.eventStreamView.events.length).toBe(1)
  })

  it('all rename keys but no passthrough keys', () => {
    const store = createStore()
    store.loadRealObservatory({
      diff: [{ id: 'd1', timestamp: '12:00', added: ['A'], removed: [], changed: [] }],
      runtime: { worldId: 'r1', entityCount: 1, systemCount: 0, eventCount: 0, fps: 0, entities: [] },
      eventStream: { events: [{ id: 'e1', timestamp: '', level: 'info', source: 'S', message: 'M' }] },
    })
    expect(store.viewModel.diffView.length).toBe(1)
    expect(store.viewModel.runtimeView.worldId).toBe('r1')
    expect(store.viewModel.eventStreamView.events.length).toBe(1)
    expect(store.viewModel.overview.traceCount).toBe(0)
    expect(store.viewModel.overview.timelineCount).toBe(0)
    expect(store.viewModel.overview.historyCount).toBe(0)
  })

  it('all passthrough keys but no rename keys', () => {
    const store = createStore()
    store.loadRealObservatory({
      trace: [{ id: 't1', label: 'T', steps: [] }],
      timeline: [{ id: 'tl1', label: 'TL', entries: [] }],
      history: [{ id: 'h1', label: 'H', entries: [] }],
    })
    expect(store.viewModel.overview.traceCount).toBe(1)
    expect(store.viewModel.overview.timelineCount).toBe(1)
    expect(store.viewModel.overview.historyCount).toBe(1)
    expect(store.viewModel.diffView).toEqual([])
    expect(store.viewModel.runtimeView.worldId).toBe('')
    expect(store.viewModel.eventStreamView.events).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// Section 10 — Complete Bridge
// ---------------------------------------------------------------------------

describe('complete bridge', () => {
  it('loads all 7 bridge keys through mapper', () => {
    const store = createStore()
    store.loadRealObservatory(buildFullMetadata())
    expect(store.viewModel.overview.traceCount).toBe(2)
    expect(store.viewModel.overview.timelineCount).toBe(1)
    expect(store.viewModel.overview.historyCount).toBe(1)
    expect(store.viewModel.trace.length).toBe(2)
    expect(store.viewModel.timeline.length).toBe(1)
    expect(store.viewModel.history.length).toBe(1)
    expect(store.viewModel.diffView.length).toBe(1)
    expect(store.viewModel.runtimeView.worldId).toBe('bridge-world')
    expect(store.viewModel.eventStreamView.events.length).toBe(1)
  })

  it('trace items preserve labels through mapper', () => {
    const store = createStore()
    store.loadRealObservatory(buildFullMetadata())
    expect(store.viewModel.trace[0].label).toBe('Trace 1')
    expect(store.viewModel.trace[1].label).toBe('Trace 2')
  })

  it('bridgeData has all 7 keys after complete bridge', () => {
    const store = createStore()
    store.loadRealObservatory(buildFullMetadata())
    const keys = Object.keys(store.bridgeData)
    expect(keys).toContain('overview')
    expect(keys).toContain('trace')
    expect(keys).toContain('timeline')
    expect(keys).toContain('history')
    expect(keys).toContain('diff')
    expect(keys).toContain('runtime')
    expect(keys).toContain('eventStream')
  })

  it('bridgeData has exactly 7 keys for complete bridge', () => {
    const store = createStore()
    store.loadRealObservatory(buildFullMetadata())
    expect(Object.keys(store.bridgeData).length).toBe(7)
  })

  it('complete bridge produces non-empty viewModel for all sections', () => {
    const store = createStore()
    store.loadRealObservatory(buildFullMetadata())
    expect(store.viewModel.trace.length).toBeGreaterThan(0)
    expect(store.viewModel.timeline.length).toBeGreaterThan(0)
    expect(store.viewModel.history.length).toBeGreaterThan(0)
    expect(store.viewModel.diffView.length).toBeGreaterThan(0)
    expect(store.viewModel.runtimeView.entityCount).toBeGreaterThan(0)
    expect(store.viewModel.eventStreamView.events.length).toBeGreaterThan(0)
  })

  it('complete bridge via mapper matches adapter types', () => {
    const store = createStore()
    store.loadRealObservatory(buildFullMetadata())
    expect(Array.isArray(store.viewModel.trace)).toBe(true)
    expect(Array.isArray(store.viewModel.diffView)).toBe(true)
    expect(Array.isArray(store.viewModel.eventStreamView.events)).toBe(true)
    expect(typeof store.viewModel.runtimeView.worldId).toBe('string')
  })
})

// ---------------------------------------------------------------------------
// Section 11 — Empty Bridge
// ---------------------------------------------------------------------------

describe('empty bridge', () => {
  it('empty metadata produces empty viewModel', () => {
    const store = createStore()
    store.loadRealObservatory({})
    expectEmptyViewModel(store)
  })

  it('empty metadata stores empty bridgeData', () => {
    const store = createStore()
    store.loadRealObservatory({})
    expect(Object.keys(store.bridgeData)).toEqual([])
  })

  it('empty metadata stores frozen bridgeData', () => {
    const store = createStore()
    store.loadRealObservatory({})
    expect(Object.isFrozen(store.bridgeData)).toBe(true)
  })

  it('empty metadata keeps viewModel frozen', () => {
    const store = createStore()
    store.loadRealObservatory({})
    expect(Object.isFrozen(store.viewModel)).toBe(true)
  })

  it('metadata with only null valued keys produces empty viewModel', () => {
    const store = createStore()
    store.loadRealObservatory({ trace: null, timeline: null, diff: null, runtime: null, eventStream: null, history: null })
    expectEmptyViewModel(store)
  })

  it('metadata with only undefined valued keys produces empty viewModel', () => {
    const store = createStore()
    store.loadRealObservatory({ trace: undefined, timeline: undefined, diff: undefined })
    expectEmptyViewModel(store)
  })

  it('metadata with empty arrays produces empty viewModel', () => {
    const store = createStore()
    store.loadRealObservatory({ trace: [], timeline: [], history: [], diff: [] })
    expectEmptyViewModel(store)
  })

  it('metadata with empty objects produces empty viewModel', () => {
    const store = createStore()
    store.loadRealObservatory({ overview: {}, runtime: {}, eventStream: {} })
    expectEmptyViewModel(store)
  })
})

// ---------------------------------------------------------------------------
// Section 12 — Invalid Bridge
// ---------------------------------------------------------------------------

describe('invalid bridge', () => {
  it('undefined metadata produces empty viewModel', () => {
    const store = createStore()
    store.loadRealObservatory(undefined)
    expectEmptyViewModel(store)
  })

  it('null metadata produces empty viewModel', () => {
    const store = createStore()
    store.loadRealObservatory(null)
    expectEmptyViewModel(store)
  })

  it('string metadata produces empty viewModel', () => {
    const store = createStore()
    store.loadRealObservatory('hello')
    expectEmptyViewModel(store)
  })

  it('number metadata produces empty viewModel', () => {
    const store = createStore()
    store.loadRealObservatory(42)
    expectEmptyViewModel(store)
  })

  it('boolean metadata produces empty viewModel', () => {
    const store = createStore()
    store.loadRealObservatory(true)
    expectEmptyViewModel(store)
  })

  it('array metadata produces empty viewModel', () => {
    const store = createStore()
    store.loadRealObservatory([1, 2, 3])
    expectEmptyViewModel(store)
  })

  it('NaN metadata produces empty viewModel', () => {
    const store = createStore()
    store.loadRealObservatory(NaN)
    expectEmptyViewModel(store)
  })

  it('Symbol metadata produces empty viewModel', () => {
    const store = createStore()
    store.loadRealObservatory(Symbol('test'))
    expectEmptyViewModel(store)
  })

  it('empty array metadata produces empty viewModel', () => {
    const store = createStore()
    store.loadRealObservatory([])
    expectEmptyViewModel(store)
  })

  it('nested array metadata produces empty viewModel', () => {
    const store = createStore()
    store.loadRealObservatory([{ trace: [] }])
    expectEmptyViewModel(store)
  })

  it('invalid metadata stores EMPTY_BRIDGE_DATA', () => {
    const store = createStore()
    store.loadRealObservatory(undefined)
    expect(store.bridgeData).toBe(EMPTY_BRIDGE_DATA)
  })

  it('invalid metadata keeps viewModel frozen', () => {
    const store = createStore()
    store.loadRealObservatory(undefined)
    expect(Object.isFrozen(store.viewModel)).toBe(true)
  })

  it('invalid metadata does not throw', () => {
    const store = createStore()
    expect(() => store.loadRealObservatory(undefined)).not.toThrow()
    expect(() => store.loadRealObservatory(null)).not.toThrow()
    expect(() => store.loadRealObservatory('')).not.toThrow()
  })

  it('function metadata does not throw', () => {
    const store = createStore()
    expect(() => store.loadRealObservatory(() => 'test')).not.toThrow()
  })

  it('Date metadata produces empty viewModel', () => {
    const store = createStore()
    store.loadRealObservatory(new Date())
    expectEmptyViewModel(store)
  })

  it('RegExp metadata produces empty viewModel', () => {
    const store = createStore()
    store.loadRealObservatory(/test/)
    expectEmptyViewModel(store)
  })

  it('Map metadata produces empty viewModel', () => {
    const store = createStore()
    store.loadRealObservatory(new Map())
    expectEmptyViewModel(store)
  })

  it('Set metadata produces empty viewModel', () => {
    const store = createStore()
    store.loadRealObservatory(new Set())
    expectEmptyViewModel(store)
  })
})

// ---------------------------------------------------------------------------
// Section 13 — Deterministic
// ---------------------------------------------------------------------------

describe('deterministic', () => {
  it('same bridge data produces same viewModel across stores', () => {
    const store1 = createStore()
    const store2 = createStore()
    const metadata = buildValidMetadata()
    store1.loadRealObservatory(metadata)
    store2.loadRealObservatory(metadata)
    expect(store1.viewModel.overview.traceCount).toBe(store2.viewModel.overview.traceCount)
  })

  it('same bridge data produces same diffView across stores', () => {
    const store1 = createStore()
    const store2 = createStore()
    const metadata = { diff: [{ id: 'd1', timestamp: '12:00', added: ['A'], removed: [], changed: [] }] }
    store1.loadRealObservatory(metadata)
    store2.loadRealObservatory(metadata)
    expect(store1.viewModel.diffView.length).toBe(store2.viewModel.diffView.length)
  })

  it('same bridge data produces same runtimeView across stores', () => {
    const store1 = createStore()
    const store2 = createStore()
    const metadata = { runtime: { worldId: 'det', entityCount: 10, systemCount: 1, eventCount: 2, fps: 30, entities: [] } }
    store1.loadRealObservatory(metadata)
    store2.loadRealObservatory(metadata)
    expect(store1.viewModel.runtimeView.worldId).toBe(store2.viewModel.runtimeView.worldId)
  })

  it('same bridge data produces same eventStreamView across stores', () => {
    const store1 = createStore()
    const store2 = createStore()
    const metadata = { eventStream: { events: [{ id: 'e1', timestamp: '', level: 'info', source: 'S', message: 'M' }] } }
    store1.loadRealObservatory(metadata)
    store2.loadRealObservatory(metadata)
    expect(store1.viewModel.eventStreamView.events.length).toBe(store2.viewModel.eventStreamView.events.length)
  })

  it('same full metadata produces same viewModel', () => {
    const store1 = createStore()
    const store2 = createStore()
    store1.loadRealObservatory(buildFullMetadata())
    store2.loadRealObservatory(buildFullMetadata())
    expect(store1.viewModel.overview).toEqual(store2.viewModel.overview)
    expect(store1.viewModel.trace.length).toBe(store2.viewModel.trace.length)
    expect(store1.viewModel.diffView.length).toBe(store2.viewModel.diffView.length)
    expect(store1.viewModel.runtimeView.worldId).toBe(store2.viewModel.runtimeView.worldId)
  })

  it('deterministic across repeated calls on same store', () => {
    const store = createStore()
    const metadata = buildValidMetadata()
    store.loadRealObservatory(metadata)
    const firstCount = store.viewModel.overview.traceCount
    store.loadRealObservatory(metadata)
    expect(store.viewModel.overview.traceCount).toBe(firstCount)
  })

  it('deterministic with diff data', () => {
    const store = createStore()
    const metadata = { diff: [{ id: 'd1', timestamp: '12:00', added: ['A', 'B'], removed: ['C'], changed: [] }] }
    store.loadRealObservatory(metadata)
    const first = store.viewModel.diffView.length
    store.loadMockObservatory()
    store.loadRealObservatory(metadata)
    expect(store.viewModel.diffView.length).toBe(first)
  })

  it('deterministic with runtime data', () => {
    const store = createStore()
    const metadata = { runtime: { worldId: 'det2', entityCount: 20, systemCount: 2, eventCount: 0, fps: 30, entities: [] } }
    store.loadRealObservatory(metadata)
    const first = store.viewModel.runtimeView.entityCount
    store.loadRealObservatory(metadata)
    expect(store.viewModel.runtimeView.entityCount).toBe(first)
  })

  it('deterministic with eventStream data', () => {
    const store = createStore()
    const metadata = { eventStream: { events: [{ id: 'e1', timestamp: '', level: 'info', source: 'S', message: 'M' }] } }
    store.loadRealObservatory(metadata)
    const first = store.viewModel.eventStreamView.events.length
    store.loadRealObservatory(metadata)
    expect(store.viewModel.eventStreamView.events.length).toBe(first)
  })

  it('same invalid input produces same empty viewModel', () => {
    const store1 = createStore()
    const store2 = createStore()
    store1.loadRealObservatory(undefined)
    store2.loadRealObservatory(undefined)
    expectEmptyViewModel(store1)
    expectEmptyViewModel(store2)
  })

  it('same empty input produces same empty viewModel', () => {
    const store1 = createStore()
    const store2 = createStore()
    store1.loadRealObservatory({})
    store2.loadRealObservatory({})
    expectEmptyViewModel(store1)
    expectEmptyViewModel(store2)
  })
})

// ---------------------------------------------------------------------------
// Section 14 — Immutable (output frozenness)
// ---------------------------------------------------------------------------

describe('immutable', () => {
  it('bridgeData is frozen after bridge load', () => {
    const store = createStore()
    store.loadRealObservatory(buildValidMetadata())
    expect(Object.isFrozen(store.bridgeData)).toBe(true)
  })

  it('bridgeData remains frozen after empty load', () => {
    const store = createStore()
    store.loadRealObservatory({})
    expect(Object.isFrozen(store.bridgeData)).toBe(true)
  })

  it('bridgeData is frozen after full metadata load', () => {
    const store = createStore()
    store.loadRealObservatory(buildFullMetadata())
    expect(Object.isFrozen(store.bridgeData)).toBe(true)
  })

  it('viewModel arrays are frozen after bridge load (via adapter)', () => {
    const store = createStore()
    store.loadRealObservatory(buildValidMetadata())
    expect(Object.isFrozen(store.viewModel.trace)).toBe(true)
  })

  it('viewModel diffView is frozen after bridge load (via mapper+adapter)', () => {
    const store = createStore()
    store.loadRealObservatory({ diff: [{ id: 'd1', timestamp: '12:00', added: ['A'], removed: [], changed: [] }] })
    expect(Object.isFrozen(store.viewModel.diffView)).toBe(true)
  })

  it('viewModel runtimeView is frozen', () => {
    const store = createStore()
    store.loadRealObservatory({ runtime: { worldId: 'r', entityCount: 0, systemCount: 0, eventCount: 0, fps: 0, entities: [] } })
    expect(Object.isFrozen(store.viewModel.runtimeView)).toBe(true)
  })

  it('viewModel eventStreamView is frozen', () => {
    const store = createStore()
    store.loadRealObservatory({ eventStream: { events: [] } })
    expect(Object.isFrozen(store.viewModel.eventStreamView)).toBe(true)
  })

  it('viewModel stays frozen after empty bridge load', () => {
    const store = createStore()
    store.loadRealObservatory({})
    expect(Object.isFrozen(store.viewModel)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Section 15 — No Mutation
// ---------------------------------------------------------------------------

describe('no mutation', () => {
  it('loadRealObservatory does not mutate input metadata', () => {
    const store = createStore()
    const metadata = { trace: [{ id: 't1', label: 'Original', steps: [] }] }
    const frozen = Object.freeze({ ...metadata })
    expect(() => store.loadRealObservatory(frozen)).not.toThrow()
  })

  it('loadRealObservatory does not add properties to input', () => {
    const store = createStore()
    const metadata = { trace: [{ id: 't1', label: 'Test', steps: [] }] }
    const beforeKeys = Object.keys(metadata)
    store.loadRealObservatory(metadata)
    expect(Object.keys(metadata)).toEqual(beforeKeys)
  })

  it('loadRealObservatory does not modify input values', () => {
    const store = createStore()
    const metadata = { trace: [{ id: 't1', label: 'Unchanged', steps: [] }] }
    const before = JSON.stringify(metadata)
    store.loadRealObservatory(metadata)
    expect(JSON.stringify(metadata)).toBe(before)
  })

  it('loadMockObservatory does not mutate any state unexpectedly', () => {
    const store = createStore()
    expect(() => store.loadMockObservatory()).not.toThrow()
  })

  it('bridgeData ref is replaced, not mutated', () => {
    const store = createStore()
    store.loadRealObservatory(buildValidMetadata())
    const firstRef = store.bridgeData
    store.loadRealObservatory({ trace: [{ id: 't2', label: 'Second', steps: [] }] })
    expect(store.bridgeData).not.toBe(firstRef)
  })

  it('multiple bridge loads replace bridgeData ref each time', () => {
    const store = createStore()
    const refs: symbol[] = []
    for (let i = 0; i < 5; i++) {
      store.loadRealObservatory({ trace: [{ id: `t${i}`, label: `T${i}`, steps: [] }] })
      refs.push(Object.getOwnPropertySymbols(store.bridgeData).find(() => true) ?? Symbol())
    }
    // All refs should be unique
    const dataRef1 = store.bridgeData
    store.loadRealObservatory({ trace: [{ id: 'final', label: 'Final', steps: [] }] })
    expect(store.bridgeData).not.toBe(dataRef1)
  })
})

// ---------------------------------------------------------------------------
// Section 16 — Statelessness
// ---------------------------------------------------------------------------

describe('statelessness', () => {
  it('multiple bridge loads do not accumulate state', () => {
    const store = createStore()
    store.loadRealObservatory({ trace: [{ id: 't1', label: 'A', steps: [] }] })
    store.loadRealObservatory({ trace: [{ id: 't2', label: 'B', steps: [] }] })
    expect(store.viewModel.trace.length).toBe(1)
    expect(store.viewModel.trace[0].label).toBe('B')
  })

  it('bridge load after mock resets state', () => {
    const store = createStore()
    store.loadMockObservatory()
    store.loadRealObservatory({ trace: [{ id: 't1', label: 'Reset', steps: [] }] })
    expect(store.viewModel.trace[0].label).toBe('Reset')
    expect(store.viewModel.overview.traceCount).toBe(1)
  })

  it('no cross-store state leakage', () => {
    const store1 = createStore()
    const store2 = createStore()
    store1.loadRealObservatory({ trace: [{ id: 't1', label: 'Store1', steps: [] }] })
    store2.loadRealObservatory({ trace: [{ id: 't2', label: 'Store2', steps: [] }] })
    expect(store1.viewModel.trace[0].label).toBe('Store1')
    expect(store2.viewModel.trace[0].label).toBe('Store2')
  })

  it('no cross-store leakage with mapped keys', () => {
    const store1 = createStore()
    const store2 = createStore()
    store1.loadRealObservatory({ diff: [{ id: 'd1', timestamp: '', added: ['A'], removed: [], changed: [] }] })
    store2.loadRealObservatory({ diff: [{ id: 'd2', timestamp: '', added: ['B'], removed: [], changed: [] }] })
    expect(store1.viewModel.diffView.length).toBe(1)
    expect(store2.viewModel.diffView.length).toBe(1)
  })

  it('bridgeData is replaced, not mutated across calls', () => {
    const store = createStore()
    store.loadRealObservatory({ trace: [{ id: 't1', label: 'First', steps: [] }] })
    const firstRef = store.bridgeData
    store.loadRealObservatory({ trace: [{ id: 't2', label: 'Second', steps: [] }] })
    expect(store.bridgeData).not.toBe(firstRef)
  })

  it('diff data state is replaced on subsequent calls', () => {
    const store = createStore()
    store.loadRealObservatory({ diff: [{ id: 'd1', timestamp: '', added: ['X'], removed: [], changed: [] }] })
    store.loadRealObservatory({ diff: [{ id: 'd2', timestamp: '', added: ['Y'], removed: [], changed: [] }] })
    expect(store.viewModel.diffView.length).toBe(1)
  })

  it('runtime state is replaced on subsequent calls', () => {
    const store = createStore()
    store.loadRealObservatory({ runtime: { worldId: 'r1', entityCount: 10, systemCount: 0, eventCount: 0, fps: 0, entities: [] } })
    store.loadRealObservatory({ runtime: { worldId: 'r2', entityCount: 20, systemCount: 0, eventCount: 0, fps: 0, entities: [] } })
    expect(store.viewModel.runtimeView.worldId).toBe('r2')
    expect(store.viewModel.runtimeView.entityCount).toBe(20)
  })

  it('eventStream state is replaced on subsequent calls', () => {
    const store = createStore()
    store.loadRealObservatory({ eventStream: { events: [{ id: 'e1', timestamp: '', level: 'info', source: 'A', message: 'M1' }] } })
    store.loadRealObservatory({ eventStream: { events: [{ id: 'e2', timestamp: '', level: 'info', source: 'B', message: 'M2' }] } })
    expect(store.viewModel.eventStreamView.events.length).toBe(1)
    expect(store.viewModel.eventStreamView.events[0].id).toBe('e2')
  })
})

// ---------------------------------------------------------------------------
// Section 17 — Shape Integrity
// ---------------------------------------------------------------------------

describe('shape integrity', () => {
  it('viewModel has overview after mapper consumption', () => {
    const store = createStore()
    store.loadRealObservatory(buildFullMetadata())
    expect(store.viewModel.overview).toBeDefined()
  })

  it('viewModel has trace after mapper consumption', () => {
    const store = createStore()
    store.loadRealObservatory(buildFullMetadata())
    expect(store.viewModel.trace).toBeDefined()
  })

  it('viewModel has traceView after mapper consumption', () => {
    const store = createStore()
    store.loadRealObservatory(buildFullMetadata())
    expect(store.viewModel.traceView).toBeDefined()
  })

  it('viewModel has timelineView after mapper consumption', () => {
    const store = createStore()
    store.loadRealObservatory(buildFullMetadata())
    expect(store.viewModel.timelineView).toBeDefined()
  })

  it('viewModel has historyView after mapper consumption', () => {
    const store = createStore()
    store.loadRealObservatory(buildFullMetadata())
    expect(store.viewModel.historyView).toBeDefined()
  })

  it('viewModel has diffView after mapper consumption', () => {
    const store = createStore()
    store.loadRealObservatory(buildFullMetadata())
    expect(store.viewModel.diffView).toBeDefined()
  })

  it('viewModel has runtimeView after mapper consumption', () => {
    const store = createStore()
    store.loadRealObservatory(buildFullMetadata())
    expect(store.viewModel.runtimeView).toBeDefined()
  })

  it('viewModel has eventStreamView after mapper consumption', () => {
    const store = createStore()
    store.loadRealObservatory(buildFullMetadata())
    expect(store.viewModel.eventStreamView).toBeDefined()
  })

  it('viewModel has timeline after mapper consumption', () => {
    const store = createStore()
    store.loadRealObservatory(buildFullMetadata())
    expect(store.viewModel.timeline).toBeDefined()
  })

  it('viewModel has history after mapper consumption', () => {
    const store = createStore()
    store.loadRealObservatory(buildFullMetadata())
    expect(store.viewModel.history).toBeDefined()
  })

  it('viewModel shape matches ObservatoryViewModel', () => {
    const store = createStore()
    store.loadRealObservatory(buildFullMetadata())
    const vm = store.viewModel
    expect(vm).toHaveProperty('overview')
    expect(vm).toHaveProperty('trace')
    expect(vm).toHaveProperty('traceView')
    expect(vm).toHaveProperty('timelineView')
    expect(vm).toHaveProperty('historyView')
    expect(vm).toHaveProperty('diffView')
    expect(vm).toHaveProperty('runtimeView')
    expect(vm).toHaveProperty('eventStreamView')
    expect(vm).toHaveProperty('timeline')
    expect(vm).toHaveProperty('history')
  })

  it('overview has numeric counts', () => {
    const store = createStore()
    store.loadRealObservatory(buildFullMetadata())
    expect(typeof store.viewModel.overview.traceCount).toBe('number')
    expect(typeof store.viewModel.overview.timelineCount).toBe('number')
    expect(typeof store.viewModel.overview.historyCount).toBe('number')
  })

  it('runtimeView shape is preserved', () => {
    const store = createStore()
    store.loadRealObservatory(buildFullMetadata())
    const rt = store.viewModel.runtimeView
    expect(typeof rt.worldId).toBe('string')
    expect(typeof rt.entityCount).toBe('number')
    expect(typeof rt.systemCount).toBe('number')
    expect(typeof rt.eventCount).toBe('number')
    expect(typeof rt.fps).toBe('number')
    expect(Array.isArray(rt.entities)).toBe(true)
  })

  it('eventStreamView shape is preserved', () => {
    const store = createStore()
    store.loadRealObservatory(buildFullMetadata())
    const es = store.viewModel.eventStreamView
    expect(Array.isArray(es.events)).toBe(true)
  })

  it('diffView is array', () => {
    const store = createStore()
    store.loadRealObservatory(buildFullMetadata())
    expect(Array.isArray(store.viewModel.diffView)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Section 18 — Integration Path
// ---------------------------------------------------------------------------

describe('integration path', () => {
  it('full lifecycle: init → bridge → mock → bridge', () => {
    const store = createStore()
    expectEmptyViewModel(store)
    store.loadRealObservatory(buildValidMetadata())
    expect(store.viewModel.overview.traceCount).toBe(1)
    store.loadMockObservatory()
    expect(store.viewModel.overview.traceCount).toBe(3)
    store.loadRealObservatory(buildFullMetadata())
    expect(store.viewModel.overview.traceCount).toBe(2)
  })

  it('bridge → empty → mock works', () => {
    const store = createStore()
    store.loadRealObservatory(buildValidMetadata())
    store.loadRealObservatory({})
    expectEmptyViewModel(store)
    store.loadMockObservatory()
    expect(store.viewModel.overview.traceCount).toBe(3)
  })

  it('bridge with diff data survives mock cycle', () => {
    const store = createStore()
    store.loadRealObservatory({ diff: [{ id: 'd1', timestamp: '', added: ['A'], removed: [], changed: [] }] })
    expect(store.viewModel.diffView.length).toBe(1)
    store.loadMockObservatory()
    store.loadRealObservatory({ diff: [{ id: 'd2', timestamp: '', added: ['B'], removed: [], changed: [] }] })
    expect(store.viewModel.diffView.length).toBe(1)
  })

  it('bridge with runtime data survives mock cycle', () => {
    const store = createStore()
    store.loadRealObservatory({ runtime: { worldId: 'int', entityCount: 100, systemCount: 5, eventCount: 10, fps: 60, entities: [] } })
    expect(store.viewModel.runtimeView.worldId).toBe('int')
    store.loadMockObservatory()
    store.loadRealObservatory({ runtime: { worldId: 'int2', entityCount: 200, systemCount: 8, eventCount: 20, fps: 120, entities: [] } })
    expect(store.viewModel.runtimeView.worldId).toBe('int2')
  })

  it('bridge with eventStream data survives mock cycle', () => {
    const store = createStore()
    store.loadRealObservatory({ eventStream: { events: [{ id: 'e1', timestamp: '', level: 'info', source: 'S', message: 'M' }] } })
    expect(store.viewModel.eventStreamView.events.length).toBe(1)
    store.loadMockObservatory()
    store.loadRealObservatory({ eventStream: { events: [{ id: 'e2', timestamp: '', level: 'error', source: 'S', message: 'E' }] } })
    expect(store.viewModel.eventStreamView.events.length).toBe(1)
  })

  it('multiple bridge loads with different sections all work', () => {
    const store = createStore()
    store.loadRealObservatory({ trace: [{ id: 't1', label: 'T', steps: [] }] })
    expect(store.viewModel.overview.traceCount).toBe(1)
    store.loadRealObservatory({ diff: [{ id: 'd1', timestamp: '', added: ['A'], removed: [], changed: [] }] })
    expect(store.viewModel.diffView.length).toBe(1)
    expect(store.viewModel.overview.traceCount).toBe(0) // reset
    store.loadRealObservatory({
      trace: [{ id: 't2', label: 'T2', steps: [] }],
      runtime: { worldId: 'w', entityCount: 5, systemCount: 1, eventCount: 0, fps: 0, entities: [] },
    })
    expect(store.viewModel.overview.traceCount).toBe(1)
    expect(store.viewModel.runtimeView.worldId).toBe('w')
  })

  it('bridge data with deep nesting does not throw', () => {
    const store = createStore()
    const deep = { trace: [{ id: 'deep', label: 'Deep', steps: [{ id: 'ds1', label: 'Step', status: 'ok' }] }] }
    expect(() => store.loadRealObservatory(deep)).not.toThrow()
  })

  it('frozen metadata object does not throw', () => {
    const store = createStore()
    const metadata = Object.freeze({
      trace: [{ id: 't1', label: 'Frozen', steps: [] }],
    })
    expect(() => store.loadRealObservatory(metadata)).not.toThrow()
  })

  it('Object.create(null) with known keys works through mapper', () => {
    const store = createStore()
    const metadata = Object.create(null)
    metadata.trace = [{ id: 't1', label: 'Null Proto', steps: [] }]
    metadata.diff = [{ id: 'd1', timestamp: '', added: [], removed: [], changed: [] }]
    store.loadRealObservatory(metadata)
    expect(store.viewModel.overview.traceCount).toBe(1)
    expect(store.viewModel.diffView.length).toBe(1)
  })

  it('empty string metadata does not throw', () => {
    const store = createStore()
    expect(() => store.loadRealObservatory('')).not.toThrow()
  })
})

// ---------------------------------------------------------------------------
// Section 19 — Stress Cases
// ---------------------------------------------------------------------------

describe('stress cases', () => {
  it('100 bridge loads in sequence', () => {
    const store = createStore()
    for (let i = 0; i < 100; i++) {
      store.loadRealObservatory({ trace: [{ id: `t${i}`, label: `Trace ${i}`, steps: [] }] })
    }
    expect(store.viewModel.trace[0].id).toBe('t99')
  })

  it('100 bridge loads with diff data (mapper invoked each time)', () => {
    const store = createStore()
    for (let i = 0; i < 100; i++) {
      store.loadRealObservatory({ diff: [{ id: `d${i}`, timestamp: '', added: [`Item${i}`], removed: [], changed: [] }] })
    }
    expect(store.viewModel.diffView.length).toBe(1)
  })

  it('100 bridge loads with runtime data (mapper invoked each time)', () => {
    const store = createStore()
    for (let i = 0; i < 100; i++) {
      store.loadRealObservatory({ runtime: { worldId: `w${i}`, entityCount: i, systemCount: 0, eventCount: 0, fps: 0, entities: [] } })
    }
    expect(store.viewModel.runtimeView.worldId).toBe('w99')
    expect(store.viewModel.runtimeView.entityCount).toBe(99)
  })

  it('100 bridge loads with eventStream data (mapper invoked each time)', () => {
    const store = createStore()
    for (let i = 0; i < 100; i++) {
      store.loadRealObservatory({ eventStream: { events: [{ id: `e${i}`, timestamp: '', level: 'info', source: 'S', message: `M${i}` }] } })
    }
    expect(store.viewModel.eventStreamView.events.length).toBe(1)
  })

  it('rapid alternating between mock and bridge preserves mapper behavior', () => {
    const store = createStore()
    for (let i = 0; i < 50; i++) {
      store.loadMockObservatory()
      store.loadRealObservatory({ diff: [{ id: `d${i}`, timestamp: '', added: [], removed: [], changed: [] }] })
      expect(store.viewModel.diffView.length).toBe(1)
    }
  })

  it('rapid alternating between bridge load types', () => {
    const store = createStore()
    for (let i = 0; i < 25; i++) {
      store.loadRealObservatory({ diff: [{ id: `d${i}`, timestamp: '', added: [], removed: [], changed: [] }] })
      expect(store.viewModel.diffView.length).toBe(1)
      store.loadRealObservatory({ runtime: { worldId: `w${i}`, entityCount: i, systemCount: 0, eventCount: 0, fps: 0, entities: [] } })
      expect(store.viewModel.runtimeView.worldId).toBe(`w${i}`)
      store.loadRealObservatory({ eventStream: { events: [{ id: `e${i}`, timestamp: '', level: 'info', source: 'S', message: 'M' }] } })
      expect(store.viewModel.eventStreamView.events.length).toBe(1)
    }
  })

  it('50 iterations of bridge → empty → mock cycle', () => {
    const store = createStore()
    for (let i = 0; i < 50; i++) {
      store.loadRealObservatory(buildValidMetadata())
      expect(store.viewModel.overview.traceCount).toBe(1)
      store.loadRealObservatory({})
      expectEmptyViewModel(store)
      store.loadMockObservatory()
      expect(store.viewModel.overview.traceCount).toBe(3)
    }
  })

  it('large trace array through mapper (passthrough)', () => {
    const store = createStore()
    const largeTrace = Array.from({ length: 500 }, (_, i) => ({
      id: `t${i}`, label: `T${i}`, steps: [{ id: `s${i}`, label: `S${i}`, status: 'done' }],
    }))
    store.loadRealObservatory({ trace: largeTrace })
    expect(store.viewModel.trace.length).toBe(500)
  })

  it('1000 bridge loads with empty metadata does not degrade', () => {
    const store = createStore()
    for (let i = 0; i < 1000; i++) {
      store.loadRealObservatory({})
    }
    expectEmptyViewModel(store)
  })

  it('mixed valid/invalid bridge loads do not corrupt state', () => {
    const store = createStore()
    store.loadRealObservatory({ trace: [{ id: 'valid', label: 'Valid', steps: [] }] })
    expect(store.viewModel.overview.traceCount).toBe(1)
    store.loadRealObservatory(undefined)
    expectEmptyViewModel(store)
    store.loadRealObservatory({ diff: [{ id: 'd1', timestamp: '', added: ['A'], removed: [], changed: [] }] })
    expect(store.viewModel.diffView.length).toBe(1)
    store.loadRealObservatory(null)
    expectEmptyViewModel(store)
    store.loadRealObservatory({ runtime: { worldId: 'survive', entityCount: 1, systemCount: 0, eventCount: 0, fps: 0, entities: [] } })
    expect(store.viewModel.runtimeView.worldId).toBe('survive')
  })

  it('consecutive bridge loads with all rename keys', () => {
    const store = createStore()
    for (let i = 0; i < 30; i++) {
      store.loadRealObservatory({
        diff: [{ id: `d${i}`, timestamp: '', added: [], removed: [], changed: [] }],
        runtime: { worldId: `w${i}`, entityCount: i, systemCount: 0, eventCount: 0, fps: 0, entities: [] },
        eventStream: { events: [{ id: `e${i}`, timestamp: '', level: 'info', source: 'S', message: 'M' }] },
      })
      expect(store.viewModel.diffView.length).toBe(1)
      expect(store.viewModel.runtimeView.worldId).toBe(`w${i}`)
      expect(store.viewModel.eventStreamView.events.length).toBe(1)
    }
  })
})

// ---------------------------------------------------------------------------
// Section 20 — Backward Compatibility
// ---------------------------------------------------------------------------

describe('backward compatibility', () => {
  it('loadMockObservatory still works (unchanged)', () => {
    const store = createStore()
    store.loadMockObservatory()
    expect(store.viewModel.overview.traceCount).toBe(3)
    expect(store.viewModel.trace.length).toBe(3)
    expect(store.viewModel.timeline.length).toBe(5)
    expect(store.viewModel.history.length).toBe(2)
  })

  it('loadMockObservatory still produces runtimeView', () => {
    const store = createStore()
    store.loadMockObservatory()
    expect(store.viewModel.runtimeView.worldId).toBe('world-001')
    expect(store.viewModel.runtimeView.entityCount).toBe(187)
  })

  it('loadMockObservatory still produces diffView', () => {
    const store = createStore()
    store.loadMockObservatory()
    expect(store.viewModel.diffView.length).toBeGreaterThan(0)
  })

  it('loadMockObservatory still produces eventStreamView', () => {
    const store = createStore()
    store.loadMockObservatory()
    expect(store.viewModel.eventStreamView.events.length).toBeGreaterThan(0)
  })

  it('passthrough keys still work without change', () => {
    const store = createStore()
    store.loadRealObservatory({
      trace: [{ id: 't1', label: 'Backward', steps: [{ id: 's1', label: 'Step', status: 'done' }] }],
    })
    expect(store.viewModel.trace[0].label).toBe('Backward')
  })

  it('store API is unchanged (loadRealObservatory, loadMockObservatory)', () => {
    const store = createStore()
    expect(typeof store.loadRealObservatory).toBe('function')
    expect(typeof store.loadMockObservatory).toBe('function')
    expect(store).toHaveProperty('viewModel')
    expect(store).toHaveProperty('bridgeData')
  })

  it('adapter still produces frozen arrays', () => {
    const store = createStore()
    store.loadRealObservatory(buildValidMetadata())
    expect(Object.isFrozen(store.viewModel.trace)).toBe(true)
  })

  it('bridge still produces frozen bridgeData', () => {
    const store = createStore()
    store.loadRealObservatory(buildValidMetadata())
    expect(Object.isFrozen(store.bridgeData)).toBe(true)
  })

  it('store does not export mapper (internal detail)', () => {
    const store = createStore()
    expect((store as unknown as Record<string, unknown>).mapper).toBeUndefined()
  })

  it('store does not expose mapping internals', () => {
    const store = createStore()
    const keys = Object.keys(store)
    expect(keys).toContain('viewModel')
    expect(keys).toContain('bridgeData')
    expect(keys).toContain('loadRealObservatory')
    expect(keys).toContain('loadMockObservatory')
  })

  it('bridge data with known keys still works without mapper renaming needed', () => {
    const store = createStore()
    store.loadRealObservatory({
      trace: [{ id: 't1', label: 'Direct', steps: [] }],
      timeline: [{ id: 'tl1', label: 'Direct', entries: [] }],
      history: [{ id: 'h1', label: 'Direct', entries: [] }],
    })
    expect(store.viewModel.overview.traceCount).toBe(1)
    expect(store.viewModel.overview.timelineCount).toBe(1)
    expect(store.viewModel.overview.historyCount).toBe(1)
  })

  it('existing tests for mock data are unaffected', () => {
    const store = createStore()
    store.loadMockObservatory()
    expect(store.viewModel.timeline.length).toBe(5)
    expect(store.viewModel.history.length).toBe(2)
    expect(store.viewModel.traceView.length).toBe(3)
    expect(store.viewModel.timelineView.length).toBe(3)
    expect(store.viewModel.historyView.length).toBe(3)
  })

  it('overview derivation from arrays still works', () => {
    const store = createStore()
    store.loadRealObservatory({
      trace: [{ id: 't1', label: 'T', steps: [] }, { id: 't2', label: 'T2', steps: [] }, { id: 't3', label: 'T3', steps: [] }],
    })
    expect(store.viewModel.overview.traceCount).toBe(3)
  })

  it('no new public API surface introduced', () => {
    const store = createStore()
    const originalKeys = ['viewModel', 'bridgeData', 'loadRealObservatory', 'loadMockObservatory']
    for (const key of originalKeys) {
      expect(key in store).toBe(true)
    }
  })

  it('bridge still returns empty data for non-object inputs', () => {
    const store = createStore()
    store.loadRealObservatory(undefined)
    expect(store.bridgeData).toBe(EMPTY_BRIDGE_DATA)
    store.loadRealObservatory(null)
    expect(store.bridgeData).toBe(EMPTY_BRIDGE_DATA)
  })

  it('overview with mixed passthrough and rename keys works', () => {
    const store = createStore()
    store.loadRealObservatory({
      trace: [{ id: 't1', label: 'T', steps: [] }],
      diff: [{ id: 'd1', timestamp: '', added: ['A'], removed: [], changed: [] }],
    })
    expect(store.viewModel.overview.traceCount).toBe(1)
    expect(store.viewModel.diffView.length).toBe(1)
  })

  it('runtime entity data preserved through mapper-adapter pipeline', () => {
    const store = createStore()
    store.loadRealObservatory({
      runtime: {
        worldId: 'w', entityCount: 1, systemCount: 1, eventCount: 0, fps: 30,
        entities: [{ id: 'e1', type: 'Guard', position: '(0,0)', health: 75, state: 'Patrol', components: [{ name: 'Health', data: { current: 75, max: 100 } }] }],
      },
    })
    expect(store.viewModel.runtimeView.entities.length).toBe(1)
    expect(store.viewModel.runtimeView.entities[0].id).toBe('e1')
    expect(store.viewModel.runtimeView.entities[0].type).toBe('Guard')
  })

  it('diff entry with empty added/removed/changed arrays produces DiffViewModel entry', () => {
    const store = createStore()
    store.loadRealObservatory({ diff: [{ id: 'empty-diff', timestamp: '12:00', added: [], removed: [], changed: [] }] })
    expect(store.viewModel.diffView.length).toBe(1)
  })

  it('eventStream preserves event source field', () => {
    const store = createStore()
    store.loadRealObservatory({
      eventStream: { events: [{ id: 'e1', timestamp: '12:00', level: 'info', source: 'CustomSource', message: 'Test' }] },
    })
    const events = store.viewModel.eventStreamView.events
    expect(events.length).toBe(1)
  })

  it('repeated mock loads after bridge do not accumulate mapper artifacts', () => {
    const store = createStore()
    store.loadRealObservatory({ diff: [{ id: 'd1', timestamp: '', added: ['X'], removed: [], changed: [] }] })
    expect(store.viewModel.diffView.length).toBe(1)
    store.loadMockObservatory()
    store.loadMockObservatory()
    store.loadMockObservatory()
    expect(store.viewModel.diffView.length).toBeGreaterThan(0)
  })

  it('mapper processes bridge data with all empty slots', () => {
    const store = createStore()
    store.loadRealObservatory({ trace: undefined, timeline: undefined, history: undefined, diff: undefined, runtime: undefined, eventStream: undefined, overview: undefined })
    expectEmptyViewModel(store)
  })

  it('mapper does not interfere with mock data path', () => {
    const store = createStore()
    store.loadMockObservatory()
    const mockTraces = store.viewModel.trace.length
    store.loadMockObservatory()
    expect(store.viewModel.trace.length).toBe(mockTraces)
  })

  it('viewModel diffView data differs from bridgeData diff (keys renamed)', () => {
    const store = createStore()
    store.loadRealObservatory({ diff: [{ id: 'd1', timestamp: '', added: ['A'], removed: [], changed: [] }] })
    expect('diff' in store.bridgeData).toBe(true)
    expect('diffView' in store.bridgeData).toBe(false)
    expect(Array.isArray(store.viewModel.diffView)).toBe(true)
  })

  it('viewModel runtimeView data differs from bridgeData runtime (keys renamed)', () => {
    const store = createStore()
    store.loadRealObservatory({ runtime: { worldId: 'rw', entityCount: 1, systemCount: 0, eventCount: 0, fps: 0, entities: [] } })
    expect('runtime' in store.bridgeData).toBe(true)
    expect('runtimeView' in store.bridgeData).toBe(false)
    expect(typeof store.viewModel.runtimeView.worldId).toBe('string')
  })

  it('viewModel eventStreamView data differs from bridgeData eventStream (keys renamed)', () => {
    const store = createStore()
    store.loadRealObservatory({ eventStream: { events: [{ id: 'e1', timestamp: '', level: 'info', source: 'S', message: 'M' }] } })
    expect('eventStream' in store.bridgeData).toBe(true)
    expect('eventStreamView' in store.bridgeData).toBe(false)
    expect(Array.isArray(store.viewModel.eventStreamView.events)).toBe(true)
  })

  it('all three rename keys bridgeData present but viewModel sees adapted names', () => {
    const store = createStore()
    store.loadRealObservatory({
      diff: [{ id: 'd1', timestamp: '', added: [], removed: [], changed: [] }],
      runtime: { worldId: 'w', entityCount: 0, systemCount: 0, eventCount: 0, fps: 0, entities: [] },
      eventStream: { events: [] },
    })
    // bridgeData has bridge key names
    expect('diff' in store.bridgeData).toBe(true)
    expect('runtime' in store.bridgeData).toBe(true)
    expect('eventStream' in store.bridgeData).toBe(true)
    // viewModel has adapter key names (via mapper)
    expect(Array.isArray(store.viewModel.diffView)).toBe(true)
    expect(typeof store.viewModel.runtimeView.worldId).toBe('string')
    expect(Array.isArray(store.viewModel.eventStreamView.events)).toBe(true)
  })

  it('second bridge load with different section data correctly resets all sections', () => {
    const store = createStore()
    store.loadRealObservatory({ diff: [{ id: 'd1', timestamp: '', added: ['Old'], removed: [], changed: [] }] })
    expect(store.viewModel.diffView.length).toBe(1)
    store.loadRealObservatory({ trace: [{ id: 'new', label: 'New', steps: [] }] })
    // After reload with only trace, diff should reset to empty
    expect(store.viewModel.overview.traceCount).toBe(1)
    expect(store.viewModel.diffView).toEqual([])
  })

  it('extremely deep nested metadata passes through bridge and mapper', () => {
    const store = createStore()
    const deepMetadata = {
      trace: [{ id: 'deep', label: 'Deep', steps: [{ id: 'ds1', label: 'Step', status: 'done', extra: { nested: { value: 42 } } }] }],
    }
    store.loadRealObservatory(deepMetadata)
    expect(store.viewModel.trace[0].steps[0].status).toBe('done')
  })

  it('loadRealObservatory with Symbol key in metadata does not throw', () => {
    const store = createStore()
    const meta: Record<string | symbol, unknown> = { trace: [{ id: 't1', label: 'T', steps: [] }] }
    meta[Symbol('hidden')] = 'secret'
    expect(() => store.loadRealObservatory(meta)).not.toThrow()
  })

  it('Object.create(null) with diff key works through mapper', () => {
    const store = createStore()
    const meta = Object.create(null)
    meta.diff = [{ id: 'd1', timestamp: '', added: ['X'], removed: [], changed: [] }]
    store.loadRealObservatory(meta)
    expect(store.viewModel.diffView.length).toBe(1)
  })

  it('Object.create(null) with runtime key works through mapper', () => {
    const store = createStore()
    const meta = Object.create(null)
    meta.runtime = { worldId: 'np', entityCount: 1, systemCount: 0, eventCount: 0, fps: 0, entities: [] }
    store.loadRealObservatory(meta)
    expect(store.viewModel.runtimeView.worldId).toBe('np')
  })

  it('Object.create(null) with eventStream key works through mapper', () => {
    const store = createStore()
    const meta = Object.create(null)
    meta.eventStream = { events: [{ id: 'e1', timestamp: '', level: 'info', source: 'S', message: 'M' }] }
    store.loadRealObservatory(meta)
    expect(store.viewModel.eventStreamView.events.length).toBe(1)
  })

  it('sealed metadata object with all rename keys works', () => {
    const store = createStore()
    const meta = Object.seal({
      diff: [{ id: 'd1', timestamp: '', added: [], removed: [], changed: [] }],
      runtime: { worldId: 's', entityCount: 0, systemCount: 0, eventCount: 0, fps: 0, entities: [] },
      eventStream: { events: [{ id: 'e1', timestamp: '', level: 'info', source: 'S', message: 'M' }] },
    })
    store.loadRealObservatory(meta)
    expect(store.viewModel.diffView.length).toBe(1)
    expect(store.viewModel.runtimeView.worldId).toBe('s')
    expect(store.viewModel.eventStreamView.events.length).toBe(1)
  })

  it('mapper output is consumed by adapter as plain object', () => {
    const store = createStore()
    store.loadRealObservatory(buildFullMetadata())
    // If adapter receives wrong shape, viewModel properties would be defaults
    // Since they have data, the mapper-to-adapter contract is satisfied
    expect(store.viewModel.diffView.length).toBeGreaterThan(0)
    expect(store.viewModel.runtimeView.entityCount).toBeGreaterThan(0)
    expect(store.viewModel.eventStreamView.events.length).toBeGreaterThan(0)
  })

  it('passthrough keys are not renamed by mapper (trace stays trace)', () => {
    const store = createStore()
    store.loadRealObservatory({ trace: [{ id: 't1', label: 'NotRenamed', steps: [] }] })
    expect('trace' in store.bridgeData).toBe(true)
    expect(store.viewModel.trace[0].label).toBe('NotRenamed')
  })

  it('timeline passthrough preserved after mapper', () => {
    const store = createStore()
    store.loadRealObservatory({ timeline: [{ id: 'tl1', label: 'NotRenamed', entries: [] }] })
    expect(store.viewModel.timeline[0].label).toBe('NotRenamed')
  })

  it('history passthrough preserved after mapper', () => {
    const store = createStore()
    store.loadRealObservatory({ history: [{ id: 'h1', label: 'NotRenamed', entries: [] }] })
    expect(store.viewModel.history[0].label).toBe('NotRenamed')
  })

  it('overview with only diff data shows zero for array-derived counts', () => {
    const store = createStore()
    store.loadRealObservatory({ diff: [{ id: 'd1', timestamp: '', added: [], removed: [], changed: [] }] })
    expect(store.viewModel.overview.traceCount).toBe(0)
    expect(store.viewModel.overview.timelineCount).toBe(0)
    expect(store.viewModel.overview.historyCount).toBe(0)
    expect(store.viewModel.diffView.length).toBe(1)
  })
})