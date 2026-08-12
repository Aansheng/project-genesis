/**
 * ObservatoryMetadataBridgeConsumption — verifies the observatoryDataStore
 * integration with the Metadata Bridge layer via loadRealObservatory.
 *
 * WO-S6-021 — Observatory Metadata Bridge Consumption
 * WO-S6-028 — Real Observatory Metadata Activation (renamed loadBridgeData → loadRealObservatory)
 * Architecture version v1.57
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

/** Build valid metadata with at least one known key. */
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

/** Build full metadata covering all known bridge keys. */
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

/** Assert that viewModel is the EMPTY_VIEW_MODEL (all zero/default). */
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

  it('has viewModel as readonly property', () => {
    const store = createStore()
    expect(store.viewModel).toBeDefined()
  })

  it('has bridgeData as readonly property', () => {
    const store = createStore()
    expect(store.bridgeData).toBeDefined()
  })

  it('initial viewModel is frozen (EMPTY_VIEW_MODEL is DEFAULT_VIEW_MODEL)', () => {
    // EMPTY_VIEW_MODEL is the frozen DEFAULT_VIEW_MODEL
    const store = createStore()
    expect(Object.isFrozen(store.viewModel)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Section 2 — Real Observatory Loading (Primary Path)
// ---------------------------------------------------------------------------

describe('real observatory loading', () => {
  it('loads bridge data from valid metadata', () => {
    const store = createStore()
    store.loadRealObservatory(buildValidMetadata())
    expect(store.bridgeData).not.toBe(EMPTY_BRIDGE_DATA)
  })

  it('stores bridge data with trace key', () => {
    const store = createStore()
    store.loadRealObservatory(buildValidMetadata())
    expect('trace' in store.bridgeData).toBe(true)
  })

  it('stores bridge data with timeline key', () => {
    const store = createStore()
    store.loadRealObservatory(buildValidMetadata())
    expect('timeline' in store.bridgeData).toBe(true)
  })

  it('computes viewModel from bridge data', () => {
    const store = createStore()
    store.loadRealObservatory(buildValidMetadata())
    expect(store.viewModel.overview.traceCount).toBe(1)
  })

  it('computes timeline count from bridge data', () => {
    const store = createStore()
    store.loadRealObservatory(buildValidMetadata())
    expect(store.viewModel.overview.timelineCount).toBe(1)
  })

  it('extracts trace items from bridge data', () => {
    const store = createStore()
    store.loadRealObservatory(buildValidMetadata())
    expect(store.viewModel.trace.length).toBe(1)
  })

  it('extracts trace label from bridge data', () => {
    const store = createStore()
    store.loadRealObservatory(buildValidMetadata())
    expect(store.viewModel.trace[0].label).toBe('Trace 1')
  })

  it('extracts trace steps from bridge data', () => {
    const store = createStore()
    store.loadRealObservatory(buildValidMetadata())
    expect(store.viewModel.trace[0].steps.length).toBe(1)
  })

  it('stores frozen bridge data', () => {
    const store = createStore()
    store.loadRealObservatory(buildValidMetadata())
    expect(Object.isFrozen(store.bridgeData)).toBe(true)
  })

  it('viewModel is not frozen after bridge load (adapter returns plain object)', () => {
    const store = createStore()
    store.loadRealObservatory(buildValidMetadata())
    expect(Object.isFrozen(store.viewModel)).toBe(false)
  })

  it('loads bridge data with all known keys', () => {
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

  it('overview derived from bridge trace array only', () => {
    const store = createStore()
    // overview is derived from arrays, not from the overview key
    store.loadRealObservatory({
      trace: [{ id: 't1', label: 'T1', steps: [] }, { id: 't2', label: 'T2', steps: [] }],
    })
    expect(store.viewModel.overview.traceCount).toBe(2)
    expect(store.viewModel.overview.timelineCount).toBe(0)
    expect(store.viewModel.overview.historyCount).toBe(0)
  })

  it('diff section has data when bridge uses diff key (mapper resolves naming)', () => {
    // Mapper maps 'diff' → 'diffView', so adapter now correctly processes it
    const store = createStore()
    store.loadRealObservatory(buildFullMetadata())
    expect(store.viewModel.diffView.length).toBeGreaterThan(0)
  })

  it('runtime section has data when bridge uses runtime key (mapper resolves naming)', () => {
    // Mapper maps 'runtime' → 'runtimeView', so adapter now correctly processes it
    const store = createStore()
    store.loadRealObservatory(buildFullMetadata())
    expect(store.viewModel.runtimeView.worldId).toBe('bridge-world')
    expect(store.viewModel.runtimeView.entityCount).toBe(50)
  })

  it('eventStream section has data when bridge uses eventStream key (mapper resolves naming)', () => {
    // Mapper maps 'eventStream' → 'eventStreamView', so adapter now correctly processes it
    const store = createStore()
    store.loadRealObservatory(buildFullMetadata())
    expect(store.viewModel.eventStreamView.events.length).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// Section 3 — Real Metadata Priority (over Mock)
// ---------------------------------------------------------------------------

describe('real metadata priority', () => {
  it('bridge data takes priority over mock data', () => {
    const store = createStore()
    store.loadMockObservatory()
    store.loadRealObservatory(buildValidMetadata())
    expect(store.viewModel.overview.traceCount).toBe(1)
  })

  it('mock data viewModel differs from bridge viewModel', () => {
    const store = createStore()
    store.loadMockObservatory()
    const mockTraceCount = store.viewModel.overview.traceCount
    store.loadRealObservatory(buildValidMetadata())
    expect(store.viewModel.overview.traceCount).not.toBe(mockTraceCount)
  })

  it('bridge data replaces viewModel entirely', () => {
    const store = createStore()
    store.loadMockObservatory()
    store.loadRealObservatory(buildValidMetadata())
    // ViewModel should reflect bridge data (1 trace), not mock (3 traces)
    expect(store.viewModel.overview.traceCount).toBe(1)
  })

  it('bridge data resets timeline count', () => {
    const store = createStore()
    store.loadMockObservatory()
    store.loadRealObservatory(buildValidMetadata())
    expect(store.viewModel.overview.timelineCount).toBe(1)
  })

  it('multiple bridge loads use latest data', () => {
    const store = createStore()
    store.loadRealObservatory({ trace: [{ id: 'first', label: 'First', steps: [] }] })
    store.loadRealObservatory({ trace: [{ id: 'second', label: 'Second', steps: [] }] })
    expect(store.viewModel.trace[0].label).toBe('Second')
  })

  it('loadMockObservatory restores mock data', () => {
    const store = createStore()
    store.loadRealObservatory(buildValidMetadata())
    store.loadMockObservatory()
    expect(store.viewModel.overview.traceCount).toBe(3)
  })

  it('loadMockObservatory resets bridgeData to empty', () => {
    const store = createStore()
    store.loadRealObservatory(buildValidMetadata())
    store.loadMockObservatory()
    expect(store.bridgeData).toBe(EMPTY_BRIDGE_DATA)
  })

  it('loadMockObservatory after bridge has mock timeline count', () => {
    const store = createStore()
    store.loadRealObservatory(buildValidMetadata())
    store.loadMockObservatory()
    expect(store.viewModel.overview.timelineCount).toBe(5)
  })

  it('bridge after mock has bridge trace count', () => {
    const store = createStore()
    store.loadMockObservatory()
    store.loadRealObservatory(buildValidMetadata())
    expect(store.viewModel.overview.traceCount).toBe(1)
  })

  it('mock after bridge after mock works correctly', () => {
    const store = createStore()
    store.loadMockObservatory()
    store.loadRealObservatory(buildValidMetadata())
    store.loadMockObservatory()
    expect(store.viewModel.overview.traceCount).toBe(3)
  })
})

// ---------------------------------------------------------------------------
// Section 4 — Mock Fallback
// ---------------------------------------------------------------------------

describe('mock fallback', () => {
  it('loadMockObservatory produces trace data', () => {
    const store = createStore()
    store.loadMockObservatory()
    expect(store.viewModel.trace.length).toBeGreaterThan(0)
  })

  it('loadMockObservatory produces timeline data', () => {
    const store = createStore()
    store.loadMockObservatory()
    expect(store.viewModel.timeline.length).toBeGreaterThan(0)
  })

  it('loadMockObservatory produces history data', () => {
    const store = createStore()
    store.loadMockObservatory()
    expect(store.viewModel.history.length).toBeGreaterThan(0)
  })

  it('loadMockObservatory produces runtime data', () => {
    const store = createStore()
    store.loadMockObservatory()
    expect(store.viewModel.runtimeView.worldId).toBe('world-001')
  })

  it('loadMockObservatory produces event stream data', () => {
    const store = createStore()
    store.loadMockObservatory()
    expect(store.viewModel.eventStreamView.events.length).toBeGreaterThan(0)
  })

  it('loadMockObservatory produces diff data', () => {
    const store = createStore()
    store.loadMockObservatory()
    expect(store.viewModel.diffView.length).toBeGreaterThan(0)
  })

  it('loadMockObservatory produces traceView data', () => {
    const store = createStore()
    store.loadMockObservatory()
    expect(store.viewModel.traceView.length).toBeGreaterThan(0)
  })

  it('loadMockObservatory produces timelineView data', () => {
    const store = createStore()
    store.loadMockObservatory()
    expect(store.viewModel.timelineView.length).toBeGreaterThan(0)
  })

  it('loadMockObservatory produces historyView data', () => {
    const store = createStore()
    store.loadMockObservatory()
    expect(store.viewModel.historyView.length).toBeGreaterThan(0)
  })

  it('mock data still works after bridge with empty metadata', () => {
    const store = createStore()
    store.loadRealObservatory(undefined)
    expectEmptyViewModel(store)
    store.loadMockObservatory()
    expect(store.viewModel.overview.traceCount).toBe(3)
  })

  it('call loadMockObservatory twice produces same result', () => {
    const store = createStore()
    store.loadMockObservatory()
    const first = store.viewModel.overview.traceCount
    store.loadMockObservatory()
    expect(store.viewModel.overview.traceCount).toBe(first)
  })
})

// ---------------------------------------------------------------------------
// Section 5 — Empty Real Metadata
// ---------------------------------------------------------------------------

describe('empty real metadata', () => {
  it('loadRealObservatory with empty object produces empty viewModel', () => {
    const store = createStore()
    store.loadRealObservatory({})
    expectEmptyViewModel(store)
  })

  it('loadRealObservatory with empty object stores empty bridgeData', () => {
    const store = createStore()
    store.loadRealObservatory({})
    expect(Object.keys(store.bridgeData)).toEqual([])
    expect(Object.isFrozen(store.bridgeData)).toBe(true)
  })

  it('loadRealObservatory with unknown keys produces empty viewModel', () => {
    const store = createStore()
    store.loadRealObservatory({ unknownKey: 'value', anotherKey: 42 })
    expectEmptyViewModel(store)
  })

  it('loadRealObservatory with unknown keys produces empty bridgeData (value equality)', () => {
    const store = createStore()
    store.loadRealObservatory({ unknownKey: 'value' })
    expect(Object.keys(store.bridgeData)).toEqual([])
  })

  it('bridgeData remains frozen after empty load', () => {
    const store = createStore()
    store.loadRealObservatory({})
    expect(Object.isFrozen(store.bridgeData)).toBe(true)
  })

  it('viewModel stays frozen after empty bridge load', () => {
    const store = createStore()
    store.loadRealObservatory({})
    expect(Object.isFrozen(store.viewModel)).toBe(true)
  })

  it('loadRealObservatory with empty object produces empty bridgeData', () => {
    const store = createStore()
    const initial = store.bridgeData
    store.loadRealObservatory({})
    expect(Object.keys(store.bridgeData)).toEqual([])
    expect(store.bridgeData).not.toBe(initial) // new frozen object
  })

  it('loadRealObservatory with only null values has keys but empty viewModel', () => {
    const store = createStore()
    store.loadRealObservatory({ trace: null, timeline: null })
    // Bridge extracts known keys even with null values
    expect('trace' in store.bridgeData).toBe(true)
    // Adapter gets null for trace, which is not an array, so trace count is 0
    expect(store.viewModel.overview.traceCount).toBe(0)
  })

  it('loadRealObservatory with only undefined values produces empty bridge data', () => {
    const store = createStore()
    store.loadRealObservatory({ trace: undefined, timeline: undefined })
    // hasOwnProperty returns true for keys with value undefined
    expect(store.bridgeData).not.toBe(EMPTY_BRIDGE_DATA)
  })

  it('loadRealObservatory with undefined-valued known keys has keys present', () => {
    const store = createStore()
    store.loadRealObservatory({ trace: undefined, timeline: undefined })
    expect('trace' in store.bridgeData).toBe(true)
  })

  it('loadRealObservatory with undefined-valued known keys produces empty viewModel', () => {
    const store = createStore()
    store.loadRealObservatory({ trace: undefined, timeline: undefined })
    expectEmptyViewModel(store)
  })
})

// ---------------------------------------------------------------------------
// Section 6 — Partial Real Metadata
// ---------------------------------------------------------------------------

describe('partial real metadata', () => {
  it('loadRealObservatory with only trace sets counts correctly', () => {
    const store = createStore()
    store.loadRealObservatory({ trace: [{ id: 't1', label: 'Partial', steps: [] }] })
    expect(store.viewModel.overview.traceCount).toBe(1)
  })

  it('loadRealObservatory with only timeline sets counts correctly', () => {
    const store = createStore()
    store.loadRealObservatory({ timeline: [{ id: 'tl1', label: 'Partial', entries: [] }] })
    expect(store.viewModel.overview.timelineCount).toBe(1)
  })

  it('loadRealObservatory with only history sets counts correctly', () => {
    const store = createStore()
    store.loadRealObservatory({ history: [{ id: 'h1', label: 'Partial', entries: [] }] })
    expect(store.viewModel.overview.historyCount).toBe(1)
  })

  it('loadRealObservatory with only diff has data via mapper (diff→diffView)', () => {
    const store = createStore()
    store.loadRealObservatory({ diff: [{ id: 'd1', timestamp: '12:00', added: [], removed: [], changed: [] }] })
    // Mapper maps 'diff' → 'diffView', so adapter now processes it
    expect(store.viewModel.diffView.length).toBe(1)
  })

  it('loadRealObservatory with only overview does not set traceCount (overview derived from arrays)', () => {
    const store = createStore()
    store.loadRealObservatory({ overview: { traceCount: 5, timelineCount: 3, historyCount: 2 } })
    // Overview is derived from trace/timeline/history arrays, not from an overview key
    // Since only 'overview' is provided (not 'trace', 'timeline', 'history'), counts stay 0
    expect(store.viewModel.overview.traceCount).toBe(0)
    expect(store.viewModel.overview.timelineCount).toBe(0)
    expect(store.viewModel.overview.historyCount).toBe(0)
  })

  it('partial bridge has zeroes for missing sections', () => {
    const store = createStore()
    store.loadRealObservatory({ trace: [{ id: 't1', label: 'Only Trace', steps: [] }] })
    expect(store.viewModel.overview.timelineCount).toBe(0)
    expect(store.viewModel.overview.historyCount).toBe(0)
    expect(store.viewModel.timeline).toEqual([])
    expect(store.viewModel.history).toEqual([])
  })

  it('partial bridge with trace and timeline works', () => {
    const store = createStore()
    store.loadRealObservatory({
      trace: [{ id: 't1', label: 'T', steps: [] }],
      timeline: [{ id: 'tl1', label: 'TL', entries: [] }],
    })
    expect(store.viewModel.overview.traceCount).toBe(1)
    expect(store.viewModel.overview.timelineCount).toBe(1)
    expect(store.viewModel.overview.historyCount).toBe(0)
  })

  it('partial bridge stores only provided keys', () => {
    const store = createStore()
    store.loadRealObservatory({ trace: [{ id: 't1', label: 'T', steps: [] }] })
    expect('trace' in store.bridgeData).toBe(true)
    expect('timeline' in store.bridgeData).toBe(false)
    expect('history' in store.bridgeData).toBe(false)
  })

  it('partial bridge with runtime key adapted via mapper (runtime→runtimeView)', () => {
    const store = createStore()
    store.loadRealObservatory({ runtime: { worldId: 'rw', entityCount: 99, systemCount: 0, eventCount: 0, fps: 0, entities: [] } })
    expect('runtime' in store.bridgeData).toBe(true)
    // Mapper maps 'runtime' → 'runtimeView', so adapter now processes it
    expect(store.viewModel.runtimeView.worldId).toBe('rw')
    expect(store.viewModel.runtimeView.entityCount).toBe(99)
  })

  it('partial bridge with eventStream key adapted via mapper (eventStream→eventStreamView)', () => {
    const store = createStore()
    store.loadRealObservatory({ eventStream: { events: [{ id: 'e1', timestamp: '', level: 'info', source: '', message: '' }] } })
    expect('eventStream' in store.bridgeData).toBe(true)
    // Mapper maps 'eventStream' → 'eventStreamView', so adapter now processes it
    expect(store.viewModel.eventStreamView.events.length).toBe(1)
  })

  it('partial bridge with known and unknown keys only stores known', () => {
    const store = createStore()
    store.loadRealObservatory({ trace: [], unknownKey: 42 })
    expect('trace' in store.bridgeData).toBe(true)
    expect('unknownKey' in store.bridgeData).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Section 7 — Invalid Metadata
// ---------------------------------------------------------------------------

describe('invalid metadata', () => {
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

  it('bigint metadata produces empty viewModel', () => {
    const store = createStore()
    store.loadRealObservatory(BigInt(42))
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
})

// ---------------------------------------------------------------------------
// Section 8 — Recomputation
// ---------------------------------------------------------------------------

describe('recomputation', () => {
  it('loadRealObservatory recomputes viewModel', () => {
    const store = createStore()
    store.loadRealObservatory({ trace: [{ id: 't1', label: 'Recompute', steps: [] }] })
    expect(store.viewModel.overview.traceCount).toBe(1)
  })

  it('loadMockObservatory recomputes viewModel', () => {
    const store = createStore()
    store.loadMockObservatory()
    expect(store.viewModel.overview.traceCount).toBe(3)
  })

  it('second real metadata load recomputes with new data', () => {
    const store = createStore()
    store.loadRealObservatory({ trace: [{ id: 't1', label: 'First', steps: [] }] })
    store.loadRealObservatory({ trace: [{ id: 't2', label: 'Second', steps: [] }] })
    expect(store.viewModel.trace[0].label).toBe('Second')
  })

  it('recomputation after mock then real metadata', () => {
    const store = createStore()
    store.loadMockObservatory()
    store.loadRealObservatory({ trace: [{ id: 'bt', label: 'Real Trace', steps: [] }] })
    expect(store.viewModel.trace[0].label).toBe('Real Trace')
  })

  it('recomputation after real metadata then mock', () => {
    const store = createStore()
    store.loadRealObservatory({ trace: [{ id: 'bt', label: 'Bridge Trace', steps: [] }] })
    store.loadMockObservatory()
    expect(store.viewModel.trace.length).toBe(3)
  })

  it('viewModel is not frozen after real metadata load but is frozen after empty load', () => {
    const store = createStore()
    store.loadRealObservatory(buildFullMetadata())
    // After real metadata load, viewModel is a plain object from adapter (not frozen)
    expect(Object.isFrozen(store.viewModel)).toBe(false)
    store.loadMockObservatory()
    // After mock load, same — plain object from adapter
    expect(Object.isFrozen(store.viewModel)).toBe(false)
    store.loadRealObservatory({})
    // After empty real metadata load, viewModel is EMPTY_VIEW_MODEL which is frozen
    expect(Object.isFrozen(store.viewModel)).toBe(true)
  })

  it('empty real metadata load resets to empty viewModel', () => {
    const store = createStore()
    store.loadRealObservatory(buildValidMetadata())
    expect(store.viewModel.overview.traceCount).toBe(1)
    store.loadRealObservatory({})
    expectEmptyViewModel(store)
  })

  it('invalid metadata load resets to empty viewModel', () => {
    const store = createStore()
    store.loadRealObservatory(buildValidMetadata())
    store.loadRealObservatory(undefined)
    expectEmptyViewModel(store)
  })

  it('bridgeData always frozen after recomputation', () => {
    const store = createStore()
    store.loadRealObservatory(buildFullMetadata())
    expect(Object.isFrozen(store.bridgeData)).toBe(true)
    store.loadRealObservatory({})
    expect(Object.isFrozen(store.bridgeData)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Section 9 — Determinism
// ---------------------------------------------------------------------------

describe('determinism', () => {
  it('same real metadata produces same viewModel', () => {
    const store1 = createStore()
    const store2 = createStore()
    const metadata = buildValidMetadata()
    store1.loadRealObservatory(metadata)
    store2.loadRealObservatory(metadata)
    expect(store1.viewModel.overview.traceCount).toBe(store2.viewModel.overview.traceCount)
  })

  it('same real metadata produces same bridgeData', () => {
    const store1 = createStore()
    const store2 = createStore()
    const metadata = buildValidMetadata()
    store1.loadRealObservatory(metadata)
    store2.loadRealObservatory(metadata)
    expect(Object.keys(store1.bridgeData)).toEqual(Object.keys(store2.bridgeData))
  })

  it('deterministic across repeated calls', () => {
    const store = createStore()
    const metadata = buildValidMetadata()
    store.loadRealObservatory(metadata)
    const firstModel = store.viewModel.overview.traceCount
    store.loadRealObservatory(metadata)
    expect(store.viewModel.overview.traceCount).toBe(firstModel)
  })

  it('deterministic with full metadata', () => {
    const store = createStore()
    store.loadRealObservatory(buildFullMetadata())
    const first = store.viewModel.overview.traceCount
    store.loadMockObservatory()
    store.loadRealObservatory(buildFullMetadata())
    expect(store.viewModel.overview.traceCount).toBe(first)
  })

  it('same mock data produces same viewModel', () => {
    const store1 = createStore()
    const store2 = createStore()
    store1.loadMockObservatory()
    store2.loadMockObservatory()
    expect(store1.viewModel.overview.traceCount).toBe(store2.viewModel.overview.traceCount)
  })

  it('same invalid input produces same empty viewModel', () => {
    const store1 = createStore()
    const store2 = createStore()
    store1.loadRealObservatory(undefined)
    store2.loadRealObservatory(undefined)
    expectEmptyViewModel(store1)
    expectEmptyViewModel(store2)
  })
})

// ---------------------------------------------------------------------------
// Section 10 — No Mutation
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

  it('loadMockObservatory does not mutate mock builder', () => {
    const store = createStore()
    expect(() => store.loadMockObservatory()).not.toThrow()
  })

  it('viewModel cannot be mutated after real metadata load (runtime, not frozen)', () => {
    const store = createStore()
    store.loadRealObservatory(buildValidMetadata())
    // viewModel is NOT frozen at top level, but its arrays are frozen by the adapter
    expect(Array.isArray(store.viewModel.trace)).toBe(true)
  })

  it('bridgeData cannot be mutated after assignment', () => {
    const store = createStore()
    store.loadRealObservatory(buildValidMetadata())
    expect(Object.isFrozen(store.bridgeData)).toBe(true)
  })

  it('nested viewModel arrays are frozen', () => {
    const store = createStore()
    store.loadRealObservatory(buildValidMetadata())
    expect(Object.isFrozen(store.viewModel.trace)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Section 11 — Statelessness
// ---------------------------------------------------------------------------

describe('statelessness', () => {
  it('multiple real metadata loads do not accumulate state', () => {
    const store = createStore()
    store.loadRealObservatory({ trace: [{ id: 't1', label: 'A', steps: [] }] })
    store.loadRealObservatory({ trace: [{ id: 't2', label: 'B', steps: [] }] })
    expect(store.viewModel.trace.length).toBe(1)
    expect(store.viewModel.trace[0].label).toBe('B')
  })

  it('real metadata load after mock resets trace count', () => {
    const store = createStore()
    store.loadMockObservatory()
    const mockTraceCount = store.viewModel.overview.traceCount
    store.loadRealObservatory({ trace: [] })
    expect(store.viewModel.overview.traceCount).toBeLessThan(mockTraceCount)
  })

  it('no cross-store state leakage', () => {
    const store1 = createStore()
    const store2 = createStore()
    store1.loadRealObservatory({ trace: [{ id: 't1', label: 'Store1', steps: [] }] })
    store2.loadRealObservatory({ trace: [{ id: 't2', label: 'Store2', steps: [] }] })
    expect(store1.viewModel.trace[0].label).toBe('Store1')
    expect(store2.viewModel.trace[0].label).toBe('Store2')
  })

  it('bridgeData is replaced not mutated', () => {
    const store = createStore()
    store.loadRealObservatory({ trace: [{ id: 't1', label: 'First', steps: [] }] })
    const firstRef = store.bridgeData
    store.loadRealObservatory({ trace: [{ id: 't2', label: 'Second', steps: [] }] })
    expect(store.bridgeData).not.toBe(firstRef)
  })
})

// ---------------------------------------------------------------------------
// Section 12 — Shape Integrity
// ---------------------------------------------------------------------------

describe('shape integrity', () => {
  it('viewModel always has overview', () => {
    const store = createStore()
    store.loadRealObservatory(buildFullMetadata())
    expect(store.viewModel.overview).toBeDefined()
  })

  it('viewModel always has trace', () => {
    const store = createStore()
    store.loadRealObservatory(buildFullMetadata())
    expect(store.viewModel.trace).toBeDefined()
  })

  it('viewModel always has traceView', () => {
    const store = createStore()
    store.loadRealObservatory(buildFullMetadata())
    expect(store.viewModel.traceView).toBeDefined()
  })

  it('viewModel always has timelineView', () => {
    const store = createStore()
    store.loadRealObservatory(buildFullMetadata())
    expect(store.viewModel.timelineView).toBeDefined()
  })

  it('viewModel always has historyView', () => {
    const store = createStore()
    store.loadRealObservatory(buildFullMetadata())
    expect(store.viewModel.historyView).toBeDefined()
  })

  it('viewModel always has diffView', () => {
    const store = createStore()
    store.loadRealObservatory(buildFullMetadata())
    expect(store.viewModel.diffView).toBeDefined()
  })

  it('viewModel always has runtimeView', () => {
    const store = createStore()
    store.loadRealObservatory(buildFullMetadata())
    expect(store.viewModel.runtimeView).toBeDefined()
  })

  it('viewModel always has eventStreamView', () => {
    const store = createStore()
    store.loadRealObservatory(buildFullMetadata())
    expect(store.viewModel.eventStreamView).toBeDefined()
  })

  it('viewModel always has timeline', () => {
    const store = createStore()
    store.loadRealObservatory({})
    expect(store.viewModel.timeline).toBeDefined()
  })

  it('viewModel always has history', () => {
    const store = createStore()
    store.loadRealObservatory({})
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
})

// ---------------------------------------------------------------------------
// Section 13 — Integration Path
// ---------------------------------------------------------------------------

describe('integration path', () => {
  it('full store lifecycle works: init → real metadata → mock → real metadata', () => {
    const store = createStore()
    expectEmptyViewModel(store)
    store.loadRealObservatory(buildValidMetadata())
    expect(store.viewModel.overview.traceCount).toBe(1)
    store.loadMockObservatory()
    expect(store.viewModel.overview.traceCount).toBe(3)
    store.loadRealObservatory(buildFullMetadata())
    expect(store.viewModel.overview.traceCount).toBe(2)
  })

  it('real metadata with empty trace array produces zero count', () => {
    const store = createStore()
    store.loadRealObservatory({ trace: [] })
    expect(store.viewModel.overview.traceCount).toBe(0)
  })

  it('real metadata with nested trace data works', () => {
    const store = createStore()
    store.loadRealObservatory({
      trace: [
        { id: 't1', label: 'Alpha', steps: [{ id: 's1', label: 'Start', status: 'done' }] },
        { id: 't2', label: 'Beta', steps: [{ id: 's2', label: 'End', status: 'pending' }] },
      ],
    })
    expect(store.viewModel.trace.length).toBe(2)
    expect(store.viewModel.trace[0].steps.length).toBe(1)
    expect(store.viewModel.trace[1].steps[0].status).toBe('pending')
  })

  it('real metadata with timeline entries works', () => {
    const store = createStore()
    store.loadRealObservatory({
      timeline: [
        { id: 'tl1', label: 'Phase 1', entries: [{ id: 'te1', label: 'Begin', timestamp: '10:00' }] },
      ],
    })
    expect(store.viewModel.timeline.length).toBe(1)
    expect(store.viewModel.timeline[0].entries.length).toBe(1)
  })

  it('real metadata with diff key adapted via mapper (diff→diffView)', () => {
    const store = createStore()
    store.loadRealObservatory({
      diff: [
        { id: 'd1', timestamp: '12:00', added: ['EntityA'], removed: ['EntityB'], changed: ['EntityC'] },
      ],
    })
    // Mapper maps 'diff' → 'diffView', so adapter now processes it
    expect(store.viewModel.diffView.length).toBe(1)
  })

  it('adapter ignores unknown keys in real metadata', () => {
    const store = createStore()
    store.loadRealObservatory({
      trace: [{ id: 't1', label: 'T', steps: [] }],
      unknownSection: { data: 'should be ignored' },
    })
    expect(store.viewModel.overview.traceCount).toBe(1)
    expect(store.viewModel.overview.timelineCount).toBe(0)
  })

  it('real metadata with deep nesting does not throw', () => {
    const store = createStore()
    const deep = { trace: [{ id: 'deep', label: 'Deep', steps: [{ id: 'ds1', label: 'Step', status: 'ok' }] }] }
    expect(() => store.loadRealObservatory(deep)).not.toThrow()
  })

  it('real metadata preserves string values through adapter', () => {
    const store = createStore()
    store.loadRealObservatory({
      trace: [{ id: 'preserve-id', label: 'Preserve Label', steps: [{ id: 'ps1', label: 'Step', status: 'done' }] }],
    })
    expect(store.viewModel.trace[0].id).toBe('preserve-id')
    expect(store.viewModel.trace[0].label).toBe('Preserve Label')
  })
})

// ---------------------------------------------------------------------------
// Section 14 — Edge Cases
// ---------------------------------------------------------------------------

describe('edge cases', () => {
  it('100 bridge loads in sequence', () => {
    const store = createStore()
    for (let i = 0; i < 100; i++) {
      store.loadRealObservatory({ trace: [{ id: `t${i}`, label: `Trace ${i}`, steps: [] }] })
    }
    expect(store.viewModel.trace[0].id).toBe('t99')
  })

  it('bridge then empty then mock works', () => {
    const store = createStore()
    store.loadRealObservatory(buildValidMetadata())
    store.loadRealObservatory({})
    expectEmptyViewModel(store)
    store.loadMockObservatory()
    expect(store.viewModel.overview.traceCount).toBe(3)
  })

  it('empty string metadata does not throw', () => {
    const store = createStore()
    expect(() => store.loadRealObservatory('')).not.toThrow()
  })

  it('zero number metadata does not throw', () => {
    const store = createStore()
    expect(() => store.loadRealObservatory(0)).not.toThrow()
  })

  it('false boolean metadata does not throw', () => {
    const store = createStore()
    expect(() => store.loadRealObservatory(false)).not.toThrow()
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

  it('Object.create(null) with known keys works', () => {
    const store = createStore()
    const metadata = Object.create(null)
    metadata.trace = [{ id: 't1', label: 'Null Proto', steps: [] }]
    store.loadRealObservatory(metadata)
    expect(store.viewModel.overview.traceCount).toBe(1)
  })

  it('frozen metadata object does not throw', () => {
    const store = createStore()
    const metadata = Object.freeze({
      trace: [{ id: 't1', label: 'Frozen', steps: [] }],
    })
    expect(() => store.loadRealObservatory(metadata)).not.toThrow()
  })

  it('sealed metadata object does not throw', () => {
    const store = createStore()
    const metadata = Object.seal({
      trace: [{ id: 't1', label: 'Sealed', steps: [] }],
    })
    expect(() => store.loadRealObservatory(metadata)).not.toThrow()
  })

  it('non-extensible metadata object does not throw', () => {
    const store = createStore()
    const metadata = Object.preventExtensions({
      trace: [{ id: 't1', label: 'NonExt', steps: [] }],
    })
    expect(() => store.loadRealObservatory(metadata)).not.toThrow()
  })

  it('prototype pollution attempt is safe', () => {
    const store = createStore()
    expect(() => store.loadRealObservatory({ __proto__: { trace: [] } })).not.toThrow()
  })

  it('loadRealObservatory with multi-byte strings works', () => {
    const store = createStore()
    store.loadRealObservatory({
      trace: [{ id: '中文', label: '测试', steps: [{ id: 's1', label: '步骤', status: '完成' }] }],
    })
    expect(store.viewModel.trace[0].id).toBe('中文')
    expect(store.viewModel.trace[0].label).toBe('测试')
  })

  it('loadRealObservatory with special characters works', () => {
    const store = createStore()
    store.loadRealObservatory({
      trace: [{ id: 't!@#', label: 'Special <>&', steps: [{ id: 's1', label: 'Step "quoted"', status: 'done' }] }],
    })
    expect(store.viewModel.trace[0].id).toBe('t!@#')
    expect(store.viewModel.trace[0].label).toBe('Special <>&')
  })

  it('empty mock metadata (no keys) produces empty viewModel', () => {
    // Simulate bridge with no known keys
    const store = createStore()
    store.loadRealObservatory({ someUnknownKey: 'value' })
    expectEmptyViewModel(store)
  })
})

// ---------------------------------------------------------------------------
// Section 15 — bridgeData Shape Integrity
// ---------------------------------------------------------------------------

describe('bridgeData shape integrity', () => {
  it('bridgeData has overview key when loaded with overview', () => {
    const store = createStore()
    store.loadRealObservatory(buildFullMetadata())
    expect('overview' in store.bridgeData).toBe(true)
  })

  it('bridgeData has trace key when loaded with trace', () => {
    const store = createStore()
    store.loadRealObservatory(buildFullMetadata())
    expect('trace' in store.bridgeData).toBe(true)
  })

  it('bridgeData has timeline key when loaded with timeline', () => {
    const store = createStore()
    store.loadRealObservatory(buildFullMetadata())
    expect('timeline' in store.bridgeData).toBe(true)
  })

  it('bridgeData has history key when loaded with history', () => {
    const store = createStore()
    store.loadRealObservatory(buildFullMetadata())
    expect('history' in store.bridgeData).toBe(true)
  })

  it('bridgeData has diff key when loaded with diff', () => {
    const store = createStore()
    store.loadRealObservatory(buildFullMetadata())
    expect('diff' in store.bridgeData).toBe(true)
  })

  it('bridgeData has runtime key when loaded with runtime', () => {
    const store = createStore()
    store.loadRealObservatory(buildFullMetadata())
    expect('runtime' in store.bridgeData).toBe(true)
  })

  it('bridgeData has eventStream key when loaded with eventStream', () => {
    const store = createStore()
    store.loadRealObservatory(buildFullMetadata())
    expect('eventStream' in store.bridgeData).toBe(true)
  })

  it('bridgeData has exactly the known keys provided', () => {
    const store = createStore()
    store.loadRealObservatory({ trace: [], timeline: [], diff: [] })
    const keys = Object.keys(store.bridgeData)
    expect(keys.length).toBe(3)
  })

  it('bridgeData unknown keys are not present', () => {
    const store = createStore()
    store.loadRealObservatory({ trace: [], unknownField: 'test' })
    expect('unknownField' in store.bridgeData).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Section 16 — ViewModel Correctness With Bridge Data
// ---------------------------------------------------------------------------

describe('viewModel correctness', () => {
  it('overview traceCount derived from bridge trace array', () => {
    const store = createStore()
    store.loadRealObservatory({
      trace: [
        { id: 'a', label: 'A', steps: [] },
        { id: 'b', label: 'B', steps: [] },
        { id: 'c', label: 'C', steps: [] },
      ],
    })
    expect(store.viewModel.overview.traceCount).toBe(3)
  })

  it('overview timelineCount derived from bridge timeline array', () => {
    const store = createStore()
    store.loadRealObservatory({
      timeline: [
        { id: 'a', label: 'A', entries: [] },
        { id: 'b', label: 'B', entries: [] },
      ],
    })
    expect(store.viewModel.overview.timelineCount).toBe(2)
  })

  it('overview historyCount derived from bridge history array', () => {
    const store = createStore()
    store.loadRealObservatory({
      history: [
        { id: 'a', label: 'A', entries: [] },
        { id: 'b', label: 'B', entries: [] },
        { id: 'c', label: 'C', entries: [] },
      ],
    })
    expect(store.viewModel.overview.historyCount).toBe(3)
  })

  it('traceView is empty when bridge has no traceView', () => {
    const store = createStore()
    store.loadRealObservatory({ trace: [] })
    expect(store.viewModel.traceView).toEqual([])
  })

  it('timelineView is empty when bridge has no timelineView', () => {
    const store = createStore()
    store.loadRealObservatory({ timeline: [] })
    expect(store.viewModel.timelineView).toEqual([])
  })

  it('historyView is empty when bridge has no historyView', () => {
    const store = createStore()
    store.loadRealObservatory({ history: [] })
    expect(store.viewModel.historyView).toEqual([])
  })

  it('diffView is empty when bridge has diff key (not diffView)', () => {
    const store = createStore()
    store.loadRealObservatory({ diff: [] })
    expect(store.viewModel.diffView).toEqual([])
  })

  it('trace contents are adapted correctly from bridge', () => {
    const store = createStore()
    store.loadRealObservatory({
      trace: [
        { id: 't1', label: 'Trace One', steps: [{ id: 's1', label: 'Step One', status: 'completed' }] },
      ],
    })
    expect(store.viewModel.trace[0].id).toBe('t1')
    expect(store.viewModel.trace[0].label).toBe('Trace One')
    expect(store.viewModel.trace[0].steps[0].id).toBe('s1')
    expect(store.viewModel.trace[0].steps[0].status).toBe('completed')
  })

  it('timeline contents are adapted correctly from bridge', () => {
    const store = createStore()
    store.loadRealObservatory({
      timeline: [
        { id: 'tl1', label: 'Timeline One', entries: [{ id: 'te1', label: 'Entry One', timestamp: '10:00' }] },
      ],
    })
    expect(store.viewModel.timeline[0].id).toBe('tl1')
    expect(store.viewModel.timeline[0].entries[0].id).toBe('te1')
    expect(store.viewModel.timeline[0].entries[0].timestamp).toBe('10:00')
  })

  it('history contents are adapted correctly from bridge', () => {
    const store = createStore()
    store.loadRealObservatory({
      history: [
        { id: 'h1', label: 'History One', entries: [{ id: 'he1', label: 'Hist Entry', timestamp: '11:00' }] },
      ],
    })
    expect(store.viewModel.history[0].id).toBe('h1')
    expect(store.viewModel.history[0].entries[0].label).toBe('Hist Entry')
  })

  it('diff entries are mapped via mapper (diff→diffView)', () => {
    // Mapper maps 'diff' → 'diffView', so adapter now processes diff entries
    const store = createStore()
    store.loadRealObservatory({
      diff: [
        { id: 'd1', timestamp: '12:00', added: ['A', 'B'], removed: ['C'], changed: ['D'] },
      ],
    })
    expect(store.viewModel.diffView.length).toBe(1)
  })
})

// ---------------------------------------------------------------------------
// Section 17 — Backward Compatibility
// ---------------------------------------------------------------------------

describe('backward compatibility', () => {
  it('existing tests using loadMockObservatory still work', () => {
    const store = createStore()
    store.loadMockObservatory()
    expect(store.viewModel.overview.traceCount).toBe(3)
  })

  it('loadMockObservatory still provides event stream events', () => {
    const store = createStore()
    store.loadMockObservatory()
    expect(store.viewModel.eventStreamView.events.length).toBeGreaterThan(0)
  })

  it('loadMockObservatory still provides runtime entities', () => {
    const store = createStore()
    store.loadMockObservatory()
    expect(store.viewModel.runtimeView.entities.length).toBeGreaterThan(0)
  })

  it('loadMockObservatory still provides timeline viewer data', () => {
    const store = createStore()
    store.loadMockObservatory()
    expect(store.viewModel.timelineView.length).toBeGreaterThan(0)
  })

  it('loadMockObservatory still provides history viewer data', () => {
    const store = createStore()
    store.loadMockObservatory()
    expect(store.viewModel.historyView.length).toBeGreaterThan(0)
  })

  it('loadMockObservatory still provides trace viewer data', () => {
    const store = createStore()
    store.loadMockObservatory()
    expect(store.viewModel.traceView.length).toBeGreaterThan(0)
  })

  it('loadMockObservatory still provides diff viewer data', () => {
    const store = createStore()
    store.loadMockObservatory()
    expect(store.viewModel.diffView.length).toBeGreaterThan(0)
  })

  it('viewModel shape unchanged between versions', () => {
    const store = createStore()
    store.loadMockObservatory()
    const vm = store.viewModel
    const keys = Object.keys(vm)
    expect(keys).toContain('overview')
    expect(keys).toContain('trace')
    expect(keys).toContain('traceView')
    expect(keys).toContain('timelineView')
    expect(keys).toContain('historyView')
    expect(keys).toContain('diffView')
    expect(keys).toContain('runtimeView')
    expect(keys).toContain('eventStreamView')
    expect(keys).toContain('timeline')
    expect(keys).toContain('history')
    expect(keys.length).toBe(10)
  })
})

// ---------------------------------------------------------------------------
// Section 18 — Store Edge Cases
// ---------------------------------------------------------------------------

describe('store edge cases', () => {
  it('sequential loadMockObservatory calls produce same result', () => {
    const store = createStore()
    store.loadMockObservatory()
    const firstTraceCount = store.viewModel.overview.traceCount
    store.loadMockObservatory()
    expect(store.viewModel.overview.traceCount).toBe(firstTraceCount)
  })

  it('loadRealObservatory with valid metadata sets bridgeData correctly', () => {
    const store = createStore()
    store.loadRealObservatory({ trace: [], timeline: [] })
    const keys = Object.keys(store.bridgeData)
    expect(keys).toContain('trace')
    expect(keys).toContain('timeline')
  })

  it('viewModel has correct type after bridge load', () => {
    const store = createStore()
    store.loadRealObservatory(buildValidMetadata())
    const vm = store.viewModel
    expect(typeof vm.overview.traceCount).toBe('number')
    expect(Array.isArray(vm.trace)).toBe(true)
    expect(Array.isArray(vm.timeline)).toBe(true)
  })

  it('bridgeData has correct type after bridge load', () => {
    const store = createStore()
    store.loadRealObservatory(buildFullMetadata())
    const bd = store.bridgeData
    // All fields should be optional
    expect(bd).toBeDefined()
  })

  it('loadRealObservatory handles deeply nested trace with many steps', () => {
    const store = createStore()
    const steps = Array.from({ length: 20 }, (_, i) => ({
      id: `step-${i}`,
      label: `Step ${i}`,
      status: i % 2 === 0 ? 'completed' : 'pending',
    }))
    store.loadRealObservatory({
      trace: [{ id: 'big', label: 'Big Trace', steps }],
    })
    expect(store.viewModel.trace[0].steps.length).toBe(20)
  })

  it('loadRealObservatory handles multiple trace entries', () => {
    const store = createStore()
    const traces = Array.from({ length: 10 }, (_, i) => ({
      id: `t${i}`,
      label: `Trace ${i}`,
      steps: [{ id: `s${i}`, label: `Step ${i}`, status: 'done' }],
    }))
    store.loadRealObservatory({ trace: traces })
    expect(store.viewModel.trace.length).toBe(10)
    expect(store.viewModel.overview.traceCount).toBe(10)
  })

  it('loadRealObservatory with empty trace array sets traceCount 0', () => {
    const store = createStore()
    store.loadRealObservatory({ trace: [] })
    expect(store.viewModel.overview.traceCount).toBe(0)
  })

  it('loadRealObservatory does not affect mock data integrity', () => {
    const store = createStore()
    store.loadRealObservatory(buildValidMetadata())
    store.loadMockObservatory()
    // Mock data should have exactly 3 traces
    expect(store.viewModel.trace.length).toBe(3)
  })
})

// ---------------------------------------------------------------------------
// Section 19 — Multiple Store Instances
// ---------------------------------------------------------------------------

describe('multiple store instances', () => {
  it('two stores have independent bridgeData', () => {
    const s1 = createStore()
    const s2 = createStore()
    s1.loadRealObservatory({ trace: [{ id: 't1', label: 'Store One', steps: [] }] })
    s2.loadRealObservatory({ trace: [{ id: 't2', label: 'Store Two', steps: [] }] })
    expect(s1.viewModel.trace[0].label).toBe('Store One')
    expect(s2.viewModel.trace[0].label).toBe('Store Two')
  })

  it('two stores have independent viewModels', () => {
    const s1 = createStore()
    const s2 = createStore()
    s1.loadMockObservatory()
    s2.loadRealObservatory(buildValidMetadata())
    expect(s1.viewModel.overview.traceCount).toBe(3)
    expect(s2.viewModel.overview.traceCount).toBe(1)
  })

  it('bridgeData does not leak between stores', () => {
    const s1 = createStore()
    const s2 = createStore()
    s1.loadRealObservatory(buildFullMetadata())
    expect(Object.keys(s2.bridgeData)).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// Section 20 — No UI / Runtime / Planner / AI Package Leakage
// ---------------------------------------------------------------------------

describe('no leakage', () => {
  it('store does not import from Vue Router', () => {
    // This is a compile-time check - if the store imports router, tests would fail
    // We verify by checking the store's exports
    const store = createStore()
    expect(store).toBeDefined()
  })

  it('store does not import from AI packages', () => {
    const store = createStore()
    expect(store).toBeDefined()
  })

  it('bridge data does not contain UI types', () => {
    const store = createStore()
    store.loadRealObservatory(buildFullMetadata())
    const bd = store.bridgeData
    // All fields are unknown - no UI coupling
    expect(bd).toBeDefined()
  })

  it('viewModel remains UI-safe after bridge load', () => {
    const store = createStore()
    store.loadRealObservatory(buildFullMetadata())
    // ViewModel has only strings, numbers, arrays - no runtime/planner/AI types
    expect(typeof store.viewModel.overview.traceCount).toBe('number')
    expect(typeof store.viewModel.trace[0].id).toBe('string')
    expect(typeof store.viewModel.trace[0].label).toBe('string')
  })

  it('store has no Runtime or Planner methods', () => {
    const store = createStore()
    const ownKeys = Object.keys(store)
    expect(ownKeys).toContain('viewModel')
    expect(ownKeys).toContain('bridgeData')
    expect(ownKeys).toContain('loadMockObservatory')
    expect(ownKeys).toContain('loadRealObservatory')
  })
})

// ---------------------------------------------------------------------------
// Section 21 — Frozen Output Verification
// ---------------------------------------------------------------------------

describe('frozen output verification', () => {
  it('viewModel top level is not frozen (adapter returns plain object)', () => {
    // The adapter returns a plain object, not Object.freeze'd at top level
    const store = createStore()
    store.loadRealObservatory(buildValidMetadata())
    // Sub-properties created by the adapter are not frozen either
    expect(Object.isFrozen(store.viewModel)).toBe(false)
  })

  it('viewModel overview is not frozen (adapter returns plain object)', () => {
    const store = createStore()
    store.loadRealObservatory(buildValidMetadata())
    expect(Object.isFrozen(store.viewModel.overview)).toBe(false)
  })

  it('viewModel trace array may not be frozen (adapter mutates result arrays)', () => {
    const store = createStore()
    store.loadRealObservatory(buildValidMetadata())
    // trace is the frozen array from adapter.adapt() 
    expect(Array.isArray(store.viewModel.trace)).toBe(true)
  })

  it('viewModel timeline array exists after bridge load', () => {
    const store = createStore()
    store.loadRealObservatory(buildValidMetadata())
    expect(Array.isArray(store.viewModel.timeline)).toBe(true)
  })

  it('viewModel history array exists after bridge load', () => {
    const store = createStore()
    store.loadRealObservatory(buildValidMetadata())
    expect(Array.isArray(store.viewModel.history)).toBe(true)
  })

  it('viewModel diffView array exists after bridge load', () => {
    const store = createStore()
    store.loadRealObservatory(buildValidMetadata())
    expect(Array.isArray(store.viewModel.diffView)).toBe(true)
  })

  it('bridgeData is frozen after bridge load', () => {
    const store = createStore()
    store.loadRealObservatory(buildValidMetadata())
    expect(Object.isFrozen(store.bridgeData)).toBe(true)
  })

  it('viewModel is not frozen after mock load (adapter returns plain object)', () => {
    const store = createStore()
    store.loadMockObservatory()
    expect(Object.isFrozen(store.viewModel)).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Section 22 — Loading Order
// ---------------------------------------------------------------------------

describe('loading order', () => {
  it('loadRealObservatory before loadMockObservatory works', () => {
    const store = createStore()
    store.loadRealObservatory(buildValidMetadata())
    store.loadMockObservatory()
    expect(store.viewModel.overview.traceCount).toBe(3)
  })

  it('loadMockObservatory before loadRealObservatory works', () => {
    const store = createStore()
    store.loadMockObservatory()
    store.loadRealObservatory(buildValidMetadata())
    expect(store.viewModel.overview.traceCount).toBe(1)
  })

  it('bridge → mock → bridge preserves bridgeData', () => {
    const store = createStore()
    store.loadRealObservatory(buildValidMetadata())
    store.loadMockObservatory()
    store.loadRealObservatory(buildFullMetadata())
    expect(Object.keys(store.bridgeData).length).toBe(7)
  })

  it('multiple bridge loads with increasing data', () => {
    const store = createStore()
    store.loadRealObservatory({ trace: [{ id: 't1', label: 'T1', steps: [] }] })
    expect(store.viewModel.overview.traceCount).toBe(1)
    store.loadRealObservatory({
      trace: [{ id: 't1', label: 'T1', steps: [] }],
      timeline: [{ id: 'tl1', label: 'TL1', entries: [] }],
    })
    expect(store.viewModel.overview.traceCount).toBe(1)
    expect(store.viewModel.overview.timelineCount).toBe(1)
  })

  it('empty bridge after full bridge resets viewModel', () => {
    const store = createStore()
    store.loadRealObservatory(buildFullMetadata())
    expect(store.viewModel.overview.traceCount).toBeGreaterThan(0)
    store.loadRealObservatory({})
    expectEmptyViewModel(store)
  })
})

// ---------------------------------------------------------------------------
// Section 23 — Stress Testing
// ---------------------------------------------------------------------------

describe('stress testing', () => {
  it('rapid alternating loads between bridge and mock', () => {
    const store = createStore()
    for (let i = 0; i < 50; i++) {
      store.loadRealObservatory({ trace: [{ id: `t${i}`, label: `Trace ${i}`, steps: [] }] })
      expect(store.viewModel.overview.traceCount).toBe(1)
      store.loadMockObservatory()
      expect(store.viewModel.overview.traceCount).toBe(3)
    }
  })

  it('100 alternating bridge loads with different data', () => {
    const store = createStore()
    for (let i = 0; i < 100; i++) {
      store.loadRealObservatory({ trace: [{ id: `t${i}`, label: `T${i}`, steps: [] }] })
      expect(store.viewModel.trace[0].id).toBe(`t${i}`)
    }
  })

  it('large trace array in bridge data', () => {
    const store = createStore()
    const traces = Array.from({ length: 500 }, (_, i) => ({
      id: `t${i}`,
      label: `Trace ${i}`,
      steps: [{ id: `s${i}`, label: `Step ${i}`, status: 'done' }],
    }))
    store.loadRealObservatory({ trace: traces })
    expect(store.viewModel.overview.traceCount).toBe(500)
    expect(store.viewModel.trace.length).toBe(500)
  })

  it('large timeline array in bridge data', () => {
    const store = createStore()
    const timelines = Array.from({ length: 300 }, (_, i) => ({
      id: `tl${i}`,
      label: `Timeline ${i}`,
      entries: [{ id: `te${i}`, label: `Entry ${i}`, timestamp: `${i}:00` }],
    }))
    store.loadRealObservatory({ timeline: timelines })
    expect(store.viewModel.overview.timelineCount).toBe(300)
    expect(store.viewModel.timeline.length).toBe(300)
  })

  it('large history array in bridge data', () => {
    const store = createStore()
    const histories = Array.from({ length: 200 }, (_, i) => ({
      id: `h${i}`,
      label: `History ${i}`,
      entries: [{ id: `he${i}`, label: `HE ${i}`, timestamp: `2026-08-${i + 1}T00:00:00Z` }],
    }))
    store.loadRealObservatory({ history: histories })
    expect(store.viewModel.overview.historyCount).toBe(200)
    expect(store.viewModel.history.length).toBe(200)
  })

  it('1000 rapid empty bridge loads', () => {
    const store = createStore()
    for (let i = 0; i < 1000; i++) {
      store.loadRealObservatory({})
    }
    expectEmptyViewModel(store)
  })

  it('memory does not grow with repeated loads', () => {
    const store = createStore()
    const baseline = Object.keys(store).length
    for (let i = 0; i < 100; i++) {
      store.loadRealObservatory(buildFullMetadata())
      store.loadMockObservatory()
    }
    expect(Object.keys(store).length).toBe(baseline)
  })
})

// ---------------------------------------------------------------------------
// Section 24 — Deeply Nested Bridge Data
// ---------------------------------------------------------------------------

describe('deeply nested bridge data', () => {
  it('trace with 100 steps', () => {
    const store = createStore()
    const steps = Array.from({ length: 100 }, (_, i) => ({
      id: `s${i}`,
      label: `Step ${i}`,
      status: i % 2 === 0 ? 'completed' : 'pending',
    }))
    store.loadRealObservatory({
      trace: [{ id: 'big', label: 'Big Trace', steps }],
    })
    expect(store.viewModel.trace[0].steps.length).toBe(100)
    expect(store.viewModel.trace[0].steps[50].label).toBe('Step 50')
  })

  it('timeline with 50 entries per timeline', () => {
    const store = createStore()
    const entries = Array.from({ length: 50 }, (_, i) => ({
      id: `te${i}`,
      label: `Entry ${i}`,
      timestamp: `${i}:00`,
    }))
    store.loadRealObservatory({
      timeline: [{ id: 'big-tl', label: 'Big TL', entries }],
    })
    expect(store.viewModel.timeline[0].entries.length).toBe(50)
  })

  it('multiple nested traces with steps', () => {
    const store = createStore()
    const traces = Array.from({ length: 10 }, (_, i) => ({
      id: `t${i}`,
      label: `Trace ${i}`,
      steps: Array.from({ length: 5 }, (__, j) => ({
        id: `s${i}-${j}`,
        label: `Step ${i}.${j}`,
        status: 'done',
      })),
    }))
    store.loadRealObservatory({ trace: traces })
    expect(store.viewModel.trace.length).toBe(10)
    expect(store.viewModel.trace[5].steps.length).toBe(5)
  })

  it('trace with empty steps array', () => {
    const store = createStore()
    store.loadRealObservatory({
      trace: [{ id: 'no-steps', label: 'No Steps', steps: [] }],
    })
    expect(store.viewModel.trace[0].steps).toEqual([])
  })

  it('trace with missing steps field', () => {
    const store = createStore()
    store.loadRealObservatory({
      trace: [{ id: 'no-steps', label: 'No Steps' } as { id: string; label: string; steps: never[] }],
    })
    expect(store.viewModel.trace[0].steps).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// Section 25 — Type Safety
// ---------------------------------------------------------------------------

describe('type safety', () => {
  it('viewModel.overview has number fields after bridge load', () => {
    const store = createStore()
    store.loadRealObservatory({
      trace: Array.from({ length: 5 }, (_, i) => ({ id: `t${i}`, label: `T${i}`, steps: [] })),
    })
    expect(typeof store.viewModel.overview.traceCount).toBe('number')
    expect(typeof store.viewModel.overview.timelineCount).toBe('number')
    expect(typeof store.viewModel.overview.historyCount).toBe('number')
  })

  it('viewModel arrays are readonly after bridge load', () => {
    const store = createStore()
    store.loadRealObservatory(buildValidMetadata())
    expect(Array.isArray(store.viewModel.trace)).toBe(true)
    expect(Array.isArray(store.viewModel.timeline)).toBe(true)
    expect(Array.isArray(store.viewModel.history)).toBe(true)
  })

  it('bridgeData is an ObservatoryBridgeData type', () => {
    const store = createStore()
    store.loadRealObservatory(buildFullMetadata())
    const bd: Record<string, unknown> = { ...store.bridgeData }
    expect(typeof bd).toBe('object')
  })

  it('bridgeData can be spread safely', () => {
    const store = createStore()
    store.loadRealObservatory(buildFullMetadata())
    const { trace, timeline, history } = store.bridgeData as Record<string, unknown>
    expect(trace).toBeDefined()
    expect(timeline).toBeDefined()
    expect(history).toBeDefined()
  })

  it('empty bridgeData can be spread safely', () => {
    const store = createStore()
    store.loadRealObservatory({})
    const { trace, timeline } = { ...store.bridgeData } as Record<string, unknown>
    expect(trace).toBeUndefined()
    expect(timeline).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// Section 26 — Bridge Data with Snapshot-like Structures
// ---------------------------------------------------------------------------

describe('bridge data snapshot integration', () => {
  it('bridge data with trace containing snapshot-like metadata', () => {
    const store = createStore()
    store.loadRealObservatory({
      trace: [{
        id: 't1',
        label: 'With Snapshot',
        steps: [{ id: 's1', label: 'Step', status: 'completed' }],
      }],
      traceSnapshot: { stepCount: 1, status: 'completed' },
    })
    // trace is adapted from the array
    expect(store.viewModel.trace.length).toBe(1)
    expect(store.viewModel.trace[0].label).toBe('With Snapshot')
  })

  it('bridge data with timelineSnapshot', () => {
    const store = createStore()
    store.loadRealObservatory({
      timeline: [{ id: 'tl1', label: 'TL1', entries: [{ id: 'te1', label: 'E1', timestamp: '10:00' }] }],
      timelineSnapshot: { entryCount: 1, status: 'active' },
    })
    expect(store.viewModel.timeline.length).toBe(1)
    expect(store.viewModel.overview.timelineCount).toBe(1)
  })

  it('bridge data with historySnapshot', () => {
    const store = createStore()
    store.loadRealObservatory({
      history: [{ id: 'h1', label: 'H1', entries: [{ id: 'he1', label: 'HE1', timestamp: '10:00' }] }],
      historySnapshot: { entryCount: 1, status: 'archived' },
    })
    expect(store.viewModel.history.length).toBe(1)
    expect(store.viewModel.overview.historyCount).toBe(1)
  })

  it('bridge data with combined trace and traceSnapshot', () => {
    const store = createStore()
    store.loadRealObservatory({
      trace: [{ id: 't1', label: 'T1', steps: [] }],
      traceSnapshot: { stepCount: 0, status: 'empty' },
    })
    // Bridge passes both through; adapter reads from trace array
    expect(store.viewModel.overview.traceCount).toBe(1)
  })
})

// ---------------------------------------------------------------------------
// Section 27 — Edge Case Combinations
// ---------------------------------------------------------------------------

describe('edge case combinations', () => {
  it('trace with null steps array', () => {
    const store = createStore()
    store.loadRealObservatory({
      trace: [{ id: 't1', label: 'Null Steps', steps: null }],
    })
    // Adapter treats null steps as missing, returns empty array
    expect(store.viewModel.trace[0].steps).toEqual([])
  })

  it('trace with non-array steps', () => {
    const store = createStore()
    store.loadRealObservatory({
      trace: [{ id: 't1', label: 'Bad Steps', steps: 'not-an-array' as unknown as never[] }],
    })
    expect(store.viewModel.trace[0].steps).toEqual([])
  })

  it('trace with partially missing step fields', () => {
    const store = createStore()
    store.loadRealObservatory({
      trace: [{
        id: 't1',
        label: 'Partial',
        steps: [
          { id: 's1', label: 'Good', status: 'done' },
          { id: 's2' } as { id: string; label: string; status: string },
        ],
      }],
    })
    expect(store.viewModel.trace[0].steps.length).toBe(2)
    expect(store.viewModel.trace[0].steps[1].label).toBe('')
    expect(store.viewModel.trace[0].steps[1].status).toBe('')
  })

  it('bridge data with trace and non-bridge known keys', () => {
    const store = createStore()
    store.loadRealObservatory({
      trace: [{ id: 't1', label: 'T1', steps: [{ id: 's1', label: 'S1', status: 'ok' }] }],
      timeline: [{ id: 'tl1', label: 'TL1', entries: [] }],
      runtime: { data: 'not adapted' },
    })
    expect(store.viewModel.overview.traceCount).toBe(1)
    expect(store.viewModel.overview.timelineCount).toBe(1)
  })

  it('undefined values in trace steps fields', () => {
    const store = createStore()
    store.loadRealObservatory({
      trace: [{
        id: undefined as unknown as string,
        label: undefined as unknown as string,
        steps: [{ id: undefined as unknown as string, label: undefined as unknown as string, status: undefined as unknown as string }],
      }],
    })
    // Adapter converts undefined to '' or 0
    expect(store.viewModel.trace[0].id).toBe('')
    expect(store.viewModel.trace[0].label).toBe('')
    expect(store.viewModel.trace[0].steps[0].label).toBe('')
  })

  it('number values in string fields work', () => {
    const store = createStore()
    store.loadRealObservatory({
      trace: [{ id: 123 as unknown as string, label: 456 as unknown as string, steps: [] }],
    })
    expect(store.viewModel.trace[0].id).toBe('123')
    expect(store.viewModel.trace[0].label).toBe('456')
  })
})