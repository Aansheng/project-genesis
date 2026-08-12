/**
 * ObservatoryRealMetadataActivation — verifies that loadRealObservatory
 * is the primary data path for the observatoryDataStore.
 *
 * WO-S6-028 — Real Observatory Metadata Activation
 * Architecture version v1.58
 *
 * Design:
 * - loadRealObservatory is the PRIMARY path
 * - loadMockObservatory is the FALLBACK path
 * - No Hydrator introduced
 * - Bridge → Mapper → Adapter → Store pipeline preserved
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

function buildRealMetadata(): Record<string, unknown> {
  return {
    overview: { traceCount: 2, timelineCount: 3, historyCount: 1 },
    trace: [
      { id: 'rt-1', label: 'Real Trace', steps: [{ id: 'rs-1', label: 'Step 1', status: 'done' }] },
      { id: 'rt-2', label: 'Real Trace 2', steps: [{ id: 'rs-2', label: 'Step 2', status: 'running' }] },
    ],
    timeline: [
      { id: 'rtl-1', label: 'Real Timeline', entries: [{ id: 'rte-1', label: 'Entry 1', timestamp: '10:00' }] },
      { id: 'rtl-2', label: 'Real Timeline 2', entries: [] },
      { id: 'rtl-3', label: 'Real Timeline 3', entries: [] },
    ],
    history: [
      { id: 'rh-1', label: 'Real History', entries: [{ id: 'rhe-1', label: 'Entry', timestamp: '09:00' }] },
    ],
    diff: [
      { id: 'rd-1', timestamp: '12:00', added: ['A', 'B'], removed: ['C'], changed: ['D'] },
    ],
    runtime: {
      worldId: 'real-world',
      entityCount: 100,
      systemCount: 5,
      eventCount: 20,
      fps: 60,
      entities: [],
    },
    eventStream: {
      events: [
        { id: 're-001', timestamp: '12:00:01', level: 'info', source: 'Real', message: 'Real metadata loaded' },
      ],
    },
  }
}

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
// Section 1 — Real Metadata Activation (Primary Path)
// ---------------------------------------------------------------------------

describe('real metadata activation', () => {
  it('exposes loadRealObservatory as primary method', () => {
    const store = createStore()
    expect(typeof store.loadRealObservatory).toBe('function')
  })

  it('loads overview counts from real metadata', () => {
    const store = createStore()
    store.loadRealObservatory(buildRealMetadata())
    expect(store.viewModel.overview.traceCount).toBe(2)
    expect(store.viewModel.overview.timelineCount).toBe(3)
    expect(store.viewModel.overview.historyCount).toBe(1)
  })

  it('loads trace data from real metadata', () => {
    const store = createStore()
    store.loadRealObservatory(buildRealMetadata())
    expect(store.viewModel.trace.length).toBe(2)
    expect(store.viewModel.trace[0].label).toBe('Real Trace')
  })

  it('loads timeline data from real metadata', () => {
    const store = createStore()
    store.loadRealObservatory(buildRealMetadata())
    expect(store.viewModel.timeline.length).toBe(3)
    expect(store.viewModel.timeline[0].label).toBe('Real Timeline')
  })

  it('loads history data from real metadata', () => {
    const store = createStore()
    store.loadRealObservatory(buildRealMetadata())
    expect(store.viewModel.history.length).toBe(1)
    expect(store.viewModel.history[0].label).toBe('Real History')
  })

  it('loads diff data from real metadata (via mapper diff→diffView)', () => {
    const store = createStore()
    store.loadRealObservatory(buildRealMetadata())
    expect(store.viewModel.diffView.length).toBe(1)
    expect(store.viewModel.diffView[0].added).toContainEqual({ name: 'A' })
  })

  it('loads runtime data from real metadata (via mapper runtime→runtimeView)', () => {
    const store = createStore()
    store.loadRealObservatory(buildRealMetadata())
    expect(store.viewModel.runtimeView.worldId).toBe('real-world')
    expect(store.viewModel.runtimeView.entityCount).toBe(100)
  })

  it('loads eventStream data from real metadata (via mapper eventStream→eventStreamView)', () => {
    const store = createStore()
    store.loadRealObservatory(buildRealMetadata())
    expect(store.viewModel.eventStreamView.events.length).toBe(1)
    expect(store.viewModel.eventStreamView.events[0].source).toBe('Real')
  })
})

// ---------------------------------------------------------------------------
// Section 2 — Mock Fallback (Preserved)
// ---------------------------------------------------------------------------

describe('mock fallback', () => {
  it('loadMockObservatory is still available', () => {
    const store = createStore()
    expect(typeof store.loadMockObservatory).toBe('function')
  })

  it('loadMockObservatory produces mock trace data', () => {
    const store = createStore()
    store.loadMockObservatory()
    expect(store.viewModel.trace.length).toBeGreaterThan(0)
    expect(store.viewModel.overview.traceCount).toBeGreaterThan(0)
  })

  it('loadMockObservatory produces mock runtime data', () => {
    const store = createStore()
    store.loadMockObservatory()
    expect(store.viewModel.runtimeView.worldId).toBe('world-001')
  })

  it('loadMockObservatory produces mock event stream data', () => {
    const store = createStore()
    store.loadMockObservatory()
    expect(store.viewModel.eventStreamView.events.length).toBeGreaterThan(0)
  })

  it('loadMockObservatory produces mock diff data', () => {
    const store = createStore()
    store.loadMockObservatory()
    expect(store.viewModel.diffView.length).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// Section 3 — Replacement Behavior
// ---------------------------------------------------------------------------

describe('replacement behavior', () => {
  it('loadRealObservatory replaces mock data', () => {
    const store = createStore()
    store.loadMockObservatory()
    expect(store.viewModel.overview.traceCount).toBe(3) // mock has 3 traces
    store.loadRealObservatory(buildRealMetadata())
    expect(store.viewModel.overview.traceCount).toBe(2) // real has 2 traces
  })

  it('loadMockObservatory replaces real metadata', () => {
    const store = createStore()
    store.loadRealObservatory(buildRealMetadata())
    expect(store.viewModel.overview.traceCount).toBe(2)
    store.loadMockObservatory()
    expect(store.viewModel.overview.traceCount).toBe(3) // back to mock
  })

  it('loadRealObservatory can be called multiple times with latest data', () => {
    const store = createStore()
    store.loadRealObservatory({ trace: [{ id: 't1', label: 'First', steps: [] }] })
    expect(store.viewModel.trace[0].label).toBe('First')
    store.loadRealObservatory({ trace: [{ id: 't2', label: 'Second', steps: [] }] })
    expect(store.viewModel.trace[0].label).toBe('Second')
  })

  it('loadRealObservatory resets bridgeData on each call', () => {
    const store = createStore()
    store.loadRealObservatory({ trace: [{ id: 't1', label: 'T', steps: [] }] })
    const firstRef = store.bridgeData
    store.loadRealObservatory({ trace: [{ id: 't2', label: 'T2', steps: [] }] })
    expect(store.bridgeData).not.toBe(firstRef)
  })

  it('loadMockObservatory resets bridgeData to EMPTY_BRIDGE_DATA', () => {
    const store = createStore()
    store.loadRealObservatory(buildRealMetadata())
    expect(store.bridgeData).not.toBe(EMPTY_BRIDGE_DATA)
    store.loadMockObservatory()
    expect(store.bridgeData).toBe(EMPTY_BRIDGE_DATA)
  })

  it('real metadata after mock after real metadata works', () => {
    const store = createStore()
    store.loadRealObservatory({ trace: [{ id: 'a', label: 'A', steps: [] }] })
    store.loadMockObservatory()
    store.loadRealObservatory({ trace: [{ id: 'b', label: 'B', steps: [] }] })
    expect(store.viewModel.trace[0].label).toBe('B')
  })
})

// ---------------------------------------------------------------------------
// Section 4 — Invalid Metadata
// ---------------------------------------------------------------------------

describe('invalid metadata', () => {
  it('undefined produces empty viewModel', () => {
    const store = createStore()
    store.loadRealObservatory(undefined)
    expectEmptyViewModel(store)
  })

  it('null produces empty viewModel', () => {
    const store = createStore()
    store.loadRealObservatory(null)
    expectEmptyViewModel(store)
  })

  it('string produces empty viewModel', () => {
    const store = createStore()
    store.loadRealObservatory('invalid')
    expectEmptyViewModel(store)
  })

  it('number produces empty viewModel', () => {
    const store = createStore()
    store.loadRealObservatory(42)
    expectEmptyViewModel(store)
  })

  it('array produces empty viewModel', () => {
    const store = createStore()
    store.loadRealObservatory([1, 2, 3])
    expectEmptyViewModel(store)
  })

  it('does not throw for any input type', () => {
    const store = createStore()
    expect(() => store.loadRealObservatory(undefined)).not.toThrow()
    expect(() => store.loadRealObservatory(null)).not.toThrow()
    expect(() => store.loadRealObservatory('')).not.toThrow()
    expect(() => store.loadRealObservatory(42)).not.toThrow()
    expect(() => store.loadRealObservatory(true)).not.toThrow()
  })

  it('invalid metadata stores EMPTY_BRIDGE_DATA', () => {
    const store = createStore()
    store.loadRealObservatory(undefined)
    expect(store.bridgeData).toBe(EMPTY_BRIDGE_DATA)
  })
})

// ---------------------------------------------------------------------------
// Section 5 — Partial Metadata
// ---------------------------------------------------------------------------

describe('partial metadata', () => {
  it('only trace sets traceCount', () => {
    const store = createStore()
    store.loadRealObservatory({ trace: [{ id: 't1', label: 'Partial', steps: [] }] })
    expect(store.viewModel.overview.traceCount).toBe(1)
    expect(store.viewModel.overview.timelineCount).toBe(0)
    expect(store.viewModel.overview.historyCount).toBe(0)
  })

  it('only timeline sets timelineCount', () => {
    const store = createStore()
    store.loadRealObservatory({ timeline: [{ id: 'tl1', label: 'Partial', entries: [] }] })
    expect(store.viewModel.overview.timelineCount).toBe(1)
    expect(store.viewModel.overview.traceCount).toBe(0)
  })

  it('only runtime populates runtimeView', () => {
    const store = createStore()
    store.loadRealObservatory({ runtime: { worldId: 'pw', entityCount: 10, systemCount: 0, eventCount: 0, fps: 0, entities: [] } })
    expect(store.viewModel.runtimeView.worldId).toBe('pw')
    expect(store.viewModel.runtimeView.entityCount).toBe(10)
  })

  it('only diff populates diffView', () => {
    const store = createStore()
    store.loadRealObservatory({ diff: [{ id: 'pd-1', timestamp: '12:00', added: ['X'], removed: [], changed: [] }] })
    expect(store.viewModel.diffView.length).toBe(1)
  })

  it('only eventStream populates eventStreamView', () => {
    const store = createStore()
    store.loadRealObservatory({ eventStream: { events: [{ id: 'pe-1', timestamp: '', level: 'info', source: '', message: '' }] } })
    expect(store.viewModel.eventStreamView.events.length).toBe(1)
  })

  it('empty object produces empty viewModel', () => {
    const store = createStore()
    store.loadRealObservatory({})
    expectEmptyViewModel(store)
  })

  it('unknown keys are ignored', () => {
    const store = createStore()
    store.loadRealObservatory({ unknownKey: 'value', garbage: 42 })
    expectEmptyViewModel(store)
  })

  it('only stores known keys in bridgeData', () => {
    const store = createStore()
    store.loadRealObservatory({ trace: [{ id: 't1', label: 'T', steps: [] }], unknownKey: 'ignored' })
    expect('trace' in store.bridgeData).toBe(true)
    expect('unknownKey' in store.bridgeData).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Section 6 — Immutable Outputs
// ---------------------------------------------------------------------------

describe('immutable outputs', () => {
  it('bridgeData is frozen after real metadata load', () => {
    const store = createStore()
    store.loadRealObservatory(buildRealMetadata())
    expect(Object.isFrozen(store.bridgeData)).toBe(true)
  })

  it('bridgeData is frozen after empty load', () => {
    const store = createStore()
    store.loadRealObservatory({})
    expect(Object.isFrozen(store.bridgeData)).toBe(true)
  })

  it('viewModel trace array is frozen after real metadata load', () => {
    const store = createStore()
    store.loadRealObservatory(buildRealMetadata())
    expect(Object.isFrozen(store.viewModel.trace)).toBe(true)
  })

  it('loadRealObservatory does not mutate input', () => {
    const store = createStore()
    const metadata = { trace: [{ id: 't1', label: 'Original', steps: [] }] }
    const beforeKeys = Object.keys(metadata)
    store.loadRealObservatory(metadata)
    expect(Object.keys(metadata)).toEqual(beforeKeys)
  })

  it('loadRealObservatory accepts frozen input', () => {
    const store = createStore()
    const metadata = Object.freeze({ trace: [{ id: 't1', label: 'Frozen', steps: [] }] })
    expect(() => store.loadRealObservatory(metadata)).not.toThrow()
  })

  it('viewModel is deterministically produced from same input', () => {
    const store1 = createStore()
    const store2 = createStore()
    store1.loadRealObservatory(buildRealMetadata())
    store2.loadRealObservatory(buildRealMetadata())
    expect(store1.viewModel.overview.traceCount).toBe(store2.viewModel.overview.traceCount)
    expect(store1.viewModel.trace.length).toBe(store2.viewModel.trace.length)
    expect(store1.viewModel.diffView.length).toBe(store2.viewModel.diffView.length)
  })
})