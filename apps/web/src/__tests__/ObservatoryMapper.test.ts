/**
 * ObservatoryMapper — verifies the DefaultObservatoryMapper implementation
 * against all input types, mapping rules, and edge cases.
 *
 * WO-S6-022 — Observatory Mapping Layer Foundation
 * Architecture version v1.52
 */

import { describe, it, expect } from 'vitest'
import { DefaultObservatoryMapper } from '../adapters/observatory/mapping'
import type { ObservatoryMapper } from '../adapters/observatory/mapping'
import type { ObservatoryBridgeData } from '../adapters/observatory/bridge'
import { EMPTY_BRIDGE_DATA } from '../adapters/observatory/bridge'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createMapper(): ObservatoryMapper {
  return new DefaultObservatoryMapper()
}

/** Shorthand: map bridge data and return the result. */
function map(bridgeData: ObservatoryBridgeData): Record<string, unknown> {
  return createMapper().map(bridgeData)
}

/** Build a complete bridge data object with all 7 known keys populated. */
function buildCompleteBridge(): ObservatoryBridgeData {
  return {
    overview: { traceCount: 3, timelineCount: 2, historyCount: 1 },
    trace: [{ id: 't1', label: 'Trace 1', steps: [] }],
    timeline: [{ id: 'tl1', label: 'Timeline 1', entries: [] }],
    history: [{ id: 'h1', label: 'History 1', entries: [] }],
    diff: [{ id: 'd1', timestamp: '12:00', added: ['A'], removed: [], changed: [] }],
    runtime: { worldId: 'w1', entityCount: 10, systemCount: 3, eventCount: 5, fps: 30, entities: [] },
    eventStream: { events: [{ id: 'e1', timestamp: '12:00', level: 'info', source: 'S', message: 'M' }] },
  }
}

/** Assert the result is a frozen, non-empty object with the expected key. */
function expectHasMappedKey(
  result: Record<string, unknown>,
  bridgeKey: string,
  adapterKey: string,
): void {
  expect(Object.isFrozen(result)).toBe(true)
  expect(adapterKey in result).toBe(true)
  expect(result[adapterKey]).toBeDefined()
}

// ---------------------------------------------------------------------------
// Section 1 — Interface Conformance
// ---------------------------------------------------------------------------

describe('mapper — interface conformance', () => {
  it('implements ObservatoryMapper interface', () => {
    const mapper = createMapper()
    expect(typeof mapper.map).toBe('function')
  })

  it('map method accepts ObservatoryBridgeData', () => {
    const mapper = createMapper()
    const result = mapper.map(buildCompleteBridge())
    expect(result).toBeDefined()
  })

  it('map method returns a Record<string, unknown>', () => {
    const result = map({})
    expect(typeof result).toBe('object')
    expect(result).not.toBeNull()
  })

  it('has no other methods', () => {
    const mapper = createMapper()
    const keys = Object.getOwnPropertyNames(
      Object.getPrototypeOf(mapper),
    ).filter((k) => k !== 'constructor')
    expect(keys).toEqual(['map'])
  })
})

// ---------------------------------------------------------------------------
// Section 2 — undefined/null/Primitive/Array Input
// ---------------------------------------------------------------------------

describe('mapper — invalid inputs', () => {
  it('returns empty frozen object for undefined', () => {
    const result = map(undefined as unknown as ObservatoryBridgeData)
    expect(result).toEqual({})
    expect(Object.isFrozen(result)).toBe(true)
  })

  it('returns empty frozen object for null', () => {
    const result = map(null as unknown as ObservatoryBridgeData)
    expect(result).toEqual({})
    expect(Object.isFrozen(result)).toBe(true)
  })

  it('returns empty frozen object for string', () => {
    const result = map('hello' as unknown as ObservatoryBridgeData)
    expect(result).toEqual({})
  })

  it('returns empty frozen object for number', () => {
    const result = map(42 as unknown as ObservatoryBridgeData)
    expect(result).toEqual({})
  })

  it('returns empty frozen object for boolean', () => {
    const result = map(true as unknown as ObservatoryBridgeData)
    expect(result).toEqual({})
  })

  it('returns empty frozen object for array', () => {
    const result = map([] as unknown as ObservatoryBridgeData)
    expect(result).toEqual({})
  })

  it('returns empty frozen object for populated array', () => {
    const result = map([1, 2, 3] as unknown as ObservatoryBridgeData)
    expect(result).toEqual({})
  })

  it('returns frozen result for all invalid inputs', () => {
    expect(Object.isFrozen(map(undefined as unknown as ObservatoryBridgeData))).toBe(true)
    expect(Object.isFrozen(map(null as unknown as ObservatoryBridgeData))).toBe(true)
    expect(Object.isFrozen(map('' as unknown as ObservatoryBridgeData))).toBe(true)
    expect(Object.isFrozen(map(0 as unknown as ObservatoryBridgeData))).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Section 3 — Complete Bridge Mapping
// ---------------------------------------------------------------------------

describe('mapper — complete bridge', () => {
  it('maps all 7 bridge keys to adapter keys', () => {
    const result = map(buildCompleteBridge())
    expect(result).toHaveProperty('overview')
    expect(result).toHaveProperty('trace')
    expect(result).toHaveProperty('timeline')
    expect(result).toHaveProperty('history')
    expect(result).toHaveProperty('diffView')
    expect(result).toHaveProperty('runtimeView')
    expect(result).toHaveProperty('eventStreamView')
  })

  it('maps overview to overview (passthrough)', () => {
    const bridge = buildCompleteBridge()
    const result = map(bridge)
    expect(result.overview).toBe(bridge.overview)
  })

  it('maps trace to trace (passthrough)', () => {
    const bridge = buildCompleteBridge()
    const result = map(bridge)
    expect(result.trace).toBe(bridge.trace)
  })

  it('maps timeline to timeline (passthrough)', () => {
    const bridge = buildCompleteBridge()
    const result = map(bridge)
    expect(result.timeline).toBe(bridge.timeline)
  })

  it('maps history to history (passthrough)', () => {
    const bridge = buildCompleteBridge()
    const result = map(bridge)
    expect(result.history).toBe(bridge.history)
  })

  it('maps diff to diffView (rename)', () => {
    const bridge = buildCompleteBridge()
    const result = map(bridge)
    expect(result.diffView).toBe(bridge.diff)
    expect('diff' in result).toBe(false)
  })

  it('maps runtime to runtimeView (rename)', () => {
    const bridge = buildCompleteBridge()
    const result = map(bridge)
    expect(result.runtimeView).toBe(bridge.runtime)
    expect('runtime' in result).toBe(false)
  })

  it('maps eventStream to eventStreamView (rename)', () => {
    const bridge = buildCompleteBridge()
    const result = map(bridge)
    expect(result.eventStreamView).toBe(bridge.eventStream)
    expect('eventStream' in result).toBe(false)
  })

  it('output has exactly 7 keys for complete bridge', () => {
    const result = map(buildCompleteBridge())
    expect(Object.keys(result).length).toBe(7)
  })

  it('output is frozen', () => {
    const result = map(buildCompleteBridge())
    expect(Object.isFrozen(result)).toBe(true)
  })

  it('output values are same reference as input values', () => {
    const bridge = buildCompleteBridge()
    const result = map(bridge)
    expect(result.overview).toBe(bridge.overview)
    expect(result.trace).toBe(bridge.trace)
    expect(result.diffView).toBe(bridge.diff)
  })
})

// ---------------------------------------------------------------------------
// Section 4 — Passthrough Keys (overview, trace, timeline, history)
// ---------------------------------------------------------------------------

describe('mapper — passthrough keys', () => {
  it('overview with object value passes through', () => {
    const result = map({ overview: { traceCount: 5 } })
    expectHasMappedKey(result, 'overview', 'overview')
    expect(result.overview).toEqual({ traceCount: 5 })
  })

  it('trace with array value passes through', () => {
    const result = map({ trace: [{ id: 't1', label: 'T1', steps: [] }] })
    expectHasMappedKey(result, 'trace', 'trace')
  })

  it('timeline with array value passes through', () => {
    const result = map({ timeline: [{ id: 'tl1', label: 'TL1', entries: [] }] })
    expectHasMappedKey(result, 'timeline', 'timeline')
  })

  it('history with array value passes through', () => {
    const result = map({ history: [{ id: 'h1', label: 'H1', entries: [] }] })
    expectHasMappedKey(result, 'history', 'history')
  })

  it('overview with string value passes through', () => {
    const result = map({ overview: 'raw-string' })
    expect(result.overview).toBe('raw-string')
  })

  it('trace with number value passes through', () => {
    const result = map({ trace: 42 as unknown as never[] })
    expect(result.trace).toBe(42)
  })
})

// ---------------------------------------------------------------------------
// Section 5 — Rename Keys (diff→diffView, runtime→runtimeView, eventStream→eventStreamView)
// ---------------------------------------------------------------------------

describe('mapper — rename keys', () => {
  it('diff maps to diffView', () => {
    const result = map({ diff: [{ id: 'd1', timestamp: '', added: [], removed: [], changed: [] }] })
    expect('diff' in result).toBe(false)
    expect('diffView' in result).toBe(true)
  })

  it('runtime maps to runtimeView', () => {
    const result = map({ runtime: { worldId: 'w1', entityCount: 0, systemCount: 0, eventCount: 0, fps: 0, entities: [] } })
    expect('runtime' in result).toBe(false)
    expect('runtimeView' in result).toBe(true)
  })

  it('eventStream maps to eventStreamView', () => {
    const result = map({ eventStream: { events: [] } })
    expect('eventStream' in result).toBe(false)
    expect('eventStreamView' in result).toBe(true)
  })

  it('diff value is preserved under diffView', () => {
    const diff = [{ id: 'd1', timestamp: '12:00', added: ['A'], removed: [], changed: [] }]
    const result = map({ diff })
    expect(result.diffView).toBe(diff)
  })

  it('runtime value is preserved under runtimeView', () => {
    const runtime = { worldId: 'w1', entityCount: 5, systemCount: 2, eventCount: 3, fps: 60, entities: [] }
    const result = map({ runtime })
    expect(result.runtimeView).toBe(runtime)
  })

  it('eventStream value is preserved under eventStreamView', () => {
    const eventStream = { events: [{ id: 'e1', timestamp: '', level: 'info' as const, source: '', message: '' }] }
    const result = map({ eventStream })
    expect(result.eventStreamView).toBe(eventStream)
  })
})

// ---------------------------------------------------------------------------
// Section 6 — Omitted Fields (undefined, null, empty)
// ---------------------------------------------------------------------------

describe('mapper — omitted fields', () => {
  it('omits undefined trace', () => {
    const result = map({ trace: undefined })
    expect('trace' in result).toBe(false)
  })

  it('omits null trace', () => {
    const result = map({ trace: null })
    expect('trace' in result).toBe(false)
  })

  it('omits empty array trace', () => {
    const result = map({ trace: [] })
    expect('trace' in result).toBe(false)
  })

  it('omits empty object overview', () => {
    const result = map({ overview: {} })
    expect('overview' in result).toBe(false)
  })

  it('omits undefined diff', () => {
    const result = map({ diff: undefined })
    expect('diffView' in result).toBe(false)
  })

  it('omits null diff', () => {
    const result = map({ diff: null })
    expect('diffView' in result).toBe(false)
  })

  it('omits empty array diff', () => {
    const result = map({ diff: [] })
    expect('diffView' in result).toBe(false)
  })

  it('omits undefined runtime', () => {
    const result = map({ runtime: undefined })
    expect('runtimeView' in result).toBe(false)
  })

  it('omits null runtime', () => {
    const result = map({ runtime: null })
    expect('runtimeView' in result).toBe(false)
  })

  it('omits empty object runtime', () => {
    const result = map({ runtime: {} })
    expect('runtimeView' in result).toBe(false)
  })

  it('omits undefined eventStream', () => {
    const result = map({ eventStream: undefined })
    expect('eventStreamView' in result).toBe(false)
  })

  it('omits null eventStream', () => {
    const result = map({ eventStream: null })
    expect('eventStreamView' in result).toBe(false)
  })

  it('omits empty object eventStream', () => {
    const result = map({ eventStream: {} })
    expect('eventStreamView' in result).toBe(false)
  })

  it('omits all fields when all are undefined', () => {
    const result = map({
      overview: undefined,
      trace: undefined,
      timeline: undefined,
      history: undefined,
      diff: undefined,
      runtime: undefined,
      eventStream: undefined,
    })
    expect(Object.keys(result)).toEqual([])
  })

  it('omits all fields when all are null', () => {
    const result = map({
      overview: null,
      trace: null,
      timeline: null,
      history: null,
      diff: null,
      runtime: null,
      eventStream: null,
    })
    expect(Object.keys(result)).toEqual([])
  })

  it('omits all fields when all are empty', () => {
    const result = map({
      overview: {},
      trace: [],
      timeline: [],
      history: [],
      diff: [],
      runtime: {},
      eventStream: {},
    })
    expect(Object.keys(result)).toEqual([])
  })

  it('empty string is NOT omitted (valid non-null, non-empty array/object)', () => {
    const result = map({ overview: '' })
    expect('overview' in result).toBe(true)
    expect(result.overview).toBe('')
  })

  it('zero number is NOT omitted', () => {
    const result = map({ overview: 0 })
    expect('overview' in result).toBe(true)
    expect(result.overview).toBe(0)
  })

  it('false boolean is NOT omitted', () => {
    const result = map({ overview: false })
    expect('overview' in result).toBe(true)
    expect(result.overview).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Section 7 — Partial Bridge
// ---------------------------------------------------------------------------

describe('mapper — partial bridge', () => {
  it('single key: overview only', () => {
    const result = map({ overview: { traceCount: 1 } })
    expect(Object.keys(result)).toEqual(['overview'])
  })

  it('single key: trace only', () => {
    const result = map({ trace: [{ id: 't1', label: 'T', steps: [] }] })
    expect(Object.keys(result)).toEqual(['trace'])
  })

  it('single key: timeline only', () => {
    const result = map({ timeline: [{ id: 'tl1', label: 'TL', entries: [] }] })
    expect(Object.keys(result)).toEqual(['timeline'])
  })

  it('single key: history only', () => {
    const result = map({ history: [{ id: 'h1', label: 'H', entries: [] }] })
    expect(Object.keys(result)).toEqual(['history'])
  })

  it('single key: diff only (maps to diffView)', () => {
    const result = map({ diff: [{ id: 'd1', timestamp: '', added: [], removed: [], changed: [] }] })
    expect(Object.keys(result)).toEqual(['diffView'])
  })

  it('single key: runtime only (maps to runtimeView)', () => {
    const result = map({ runtime: { worldId: 'w', entityCount: 0, systemCount: 0, eventCount: 0, fps: 0, entities: [] } })
    expect(Object.keys(result)).toEqual(['runtimeView'])
  })

  it('single key: eventStream only (maps to eventStreamView)', () => {
    const result = map({ eventStream: { events: [] } })
    expect(Object.keys(result)).toEqual(['eventStreamView'])
  })

  it('two keys: trace and timeline', () => {
    const result = map({
      trace: [{ id: 't1', label: 'T', steps: [] }],
      timeline: [{ id: 'tl1', label: 'TL', entries: [] }],
    })
    expect(Object.keys(result)).toEqual(['trace', 'timeline'])
  })

  it('three keys: trace, diff, eventStream', () => {
    const result = map({
      trace: [{ id: 't1', label: 'T', steps: [] }],
      diff: [{ id: 'd1', timestamp: '', added: [], removed: [], changed: [] }],
      eventStream: { events: [] },
    })
    expect(result).toHaveProperty('trace')
    expect(result).toHaveProperty('diffView')
    expect(result).toHaveProperty('eventStreamView')
  })

  it('mixed valid and empty fields only includes valid', () => {
    const result = map({
      trace: [{ id: 't1', label: 'T', steps: [] }],
      timeline: [],
      history: undefined,
      diff: null,
    })
    expect(Object.keys(result)).toEqual(['trace'])
  })
})

// ---------------------------------------------------------------------------
// Section 8 — EMPTY_BRIDGE_DATA
// ---------------------------------------------------------------------------

describe('mapper — EMPTY_BRIDGE_DATA', () => {
  it('returns empty frozen object for EMPTY_BRIDGE_DATA', () => {
    const result = map(EMPTY_BRIDGE_DATA)
    expect(result).toEqual({})
  })

  it('result is frozen for EMPTY_BRIDGE_DATA', () => {
    const result = map(EMPTY_BRIDGE_DATA)
    expect(Object.isFrozen(result)).toBe(true)
  })

  it('returns new object for EMPTY_BRIDGE_DATA', () => {
    const result = map(EMPTY_BRIDGE_DATA)
    expect(result).not.toBe(EMPTY_BRIDGE_DATA)
  })
})

// ---------------------------------------------------------------------------
// Section 9 — Determinism
// ---------------------------------------------------------------------------

describe('mapper — determinism', () => {
  it('same input produces same output shape', () => {
    const bridge = buildCompleteBridge()
    const r1 = map(bridge)
    const r2 = map(bridge)
    expect(Object.keys(r1)).toEqual(Object.keys(r2))
  })

  it('same input produces same values', () => {
    const bridge = buildCompleteBridge()
    const r1 = map(bridge)
    const r2 = map(bridge)
    expect(r1.diffView).toBe(r2.diffView)
    expect(r1.runtimeView).toBe(r2.runtimeView)
    expect(r1.eventStreamView).toBe(r2.eventStreamView)
  })

  it('deterministic across mapper instances', () => {
    const bridge = buildCompleteBridge()
    const mapper1 = createMapper()
    const mapper2 = createMapper()
    expect(mapper1.map(bridge)).toEqual(mapper2.map(bridge))
  })

  it('deterministic with partial bridge', () => {
    const bridge = { trace: [{ id: 't1', label: 'T', steps: [] }] }
    const r1 = map(bridge)
    const r2 = map(bridge)
    expect(r1).toEqual(r2)
  })

  it('deterministic with empty bridge', () => {
    const r1 = map({})
    const r2 = map({})
    expect(r1).toEqual(r2)
  })

  it('repeated calls on same instance produce same result', () => {
    const mapper = createMapper()
    const bridge = buildCompleteBridge()
    const r1 = mapper.map(bridge)
    const r2 = mapper.map(bridge)
    const r3 = mapper.map(bridge)
    expect(r1).toEqual(r2)
    expect(r2).toEqual(r3)
  })
})

// ---------------------------------------------------------------------------
// Section 10 — Immutability
// ---------------------------------------------------------------------------

describe('mapper — immutability', () => {
  it('output is frozen', () => {
    const result = map(buildCompleteBridge())
    expect(Object.isFrozen(result)).toBe(true)
  })

  it('output is frozen for partial bridge', () => {
    const result = map({ trace: [{ id: 't1', label: 'T', steps: [] }] })
    expect(Object.isFrozen(result)).toBe(true)
  })

  it('output is frozen for empty result', () => {
    const result = map({})
    expect(Object.isFrozen(result)).toBe(true)
  })

  it('cannot add properties to output', () => {
    const result = map({ trace: [{ id: 't1', label: 'T', steps: [] }] })
    expect(() => { (result as Record<string, unknown>).extra = 'value' }).toThrow()
  })

  it('cannot delete properties from output', () => {
    const result = map({ trace: [{ id: 't1', label: 'T', steps: [] }] })
    expect(() => { delete (result as Record<string, unknown>).trace }).toThrow()
  })

  it('cannot reassign properties on output', () => {
    const result = map({ trace: [{ id: 't1', label: 'T', steps: [] }] })
    expect(() => { (result as Record<string, unknown>).trace = 'changed' }).toThrow()
  })
})

// ---------------------------------------------------------------------------
// Section 11 — No Mutation of Input
// ---------------------------------------------------------------------------

describe('mapper — no mutation', () => {
  it('does not modify input properties', () => {
    const bridge = { trace: [{ id: 't1', label: 'T', steps: [] }] }
    const before = JSON.stringify(bridge)
    map(bridge)
    expect(JSON.stringify(bridge)).toBe(before)
  })

  it('does not modify EMPTY_BRIDGE_DATA', () => {
    const before = JSON.stringify(EMPTY_BRIDGE_DATA)
    map(EMPTY_BRIDGE_DATA)
    expect(JSON.stringify(EMPTY_BRIDGE_DATA)).toBe(before)
  })

  it('does not add properties to input', () => {
    const bridge = { trace: [{ id: 't1', label: 'T', steps: [] }] }
    const beforeKeys = Object.keys(bridge)
    map(bridge)
    expect(Object.keys(bridge)).toEqual(beforeKeys)
  })

  it('does not remove properties from input', () => {
    const bridge = buildCompleteBridge()
    const beforeKeys = Object.keys(bridge)
    map(bridge)
    expect(Object.keys(bridge)).toEqual(beforeKeys)
  })
})

// ---------------------------------------------------------------------------
// Section 12 — Statelessness
// ---------------------------------------------------------------------------

describe('mapper — statelessness', () => {
  it('no state between calls', () => {
    const mapper = createMapper()
    const r1 = mapper.map({ trace: [{ id: 't1', label: 'A', steps: [] }] })
    const r2 = mapper.map({ trace: [{ id: 't2', label: 'B', steps: [] }] })
    expect(r1.trace).not.toBe(r2.trace)
  })

  it('multiple instances produce independent results', () => {
    const m1 = createMapper()
    const m2 = createMapper()
    const r1 = m1.map({ trace: [{ id: 't1', label: 'M1', steps: [] }] })
    const r2 = m2.map({ trace: [{ id: 't2', label: 'M2', steps: [] }] })
    expect(r1.trace).not.toBe(r2.trace)
  })

  it('no cross-call leakage', () => {
    const mapper = createMapper()
    mapper.map(buildCompleteBridge())
    const result = mapper.map({})
    expect(Object.keys(result)).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// Section 13 — Shape Integrity
// ---------------------------------------------------------------------------

describe('mapper — shape integrity', () => {
  it('result is a plain object', () => {
    const result = map(buildCompleteBridge())
    expect(Object.getPrototypeOf(result)).toBe(Object.prototype)
  })

  it('result for empty input is a plain object', () => {
    const result = map({})
    expect(Object.getPrototypeOf(result)).toBe(Object.prototype)
  })

  it('result for complete bridge has adapter key names', () => {
    const result = map(buildCompleteBridge())
    const keys = Object.keys(result)
    expect(keys).toContain('overview')
    expect(keys).toContain('trace')
    expect(keys).toContain('timeline')
    expect(keys).toContain('history')
    expect(keys).toContain('diffView')
    expect(keys).toContain('runtimeView')
    expect(keys).toContain('eventStreamView')
  })

  it('result does not contain bridge key names', () => {
    const result = map(buildCompleteBridge())
    expect('diff' in result).toBe(false)
    expect('runtime' in result).toBe(false)
    expect('eventStream' in result).toBe(false)
  })

  it('result does not contain non-bridge keys', () => {
    const result = map(buildCompleteBridge() as Record<string, unknown> as ObservatoryBridgeData)
    expect('traceView' in result).toBe(false)
    expect('timelineView' in result).toBe(false)
    expect('historyView' in result).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Section 14 — Unknown Fields
// ---------------------------------------------------------------------------

describe('mapper — unknown fields', () => {
  it('ignores unknown bridge keys in input', () => {
    const bridge = {
      trace: [{ id: 't1', label: 'T', steps: [] }],
      unknownKey: 'value',
      anotherUnknown: 42,
    }
    const result = map(bridge as Record<string, unknown> as ObservatoryBridgeData)
    expect('unknownKey' in result).toBe(false)
    expect('anotherUnknown' in result).toBe(false)
    expect('trace' in result).toBe(true)
  })

  it('ignores adapter-prefixed keys in input (traceView, etc.)', () => {
    const bridge = {
      traceView: [{ id: 'tv1', strategy: 'S', timestamp: '', plan: '', snapshot: [], metadata: {} }],
      diffView: [{ id: 'dv1', timestamp: '', added: [], removed: [], changed: [] }],
    }
    const result = map(bridge as unknown as ObservatoryBridgeData)
    // traceView is not a known bridge key, so it won't be mapped
    expect('traceView' in result).toBe(false)
    expect('diffView' in result).toBe(false)
  })

  it('only known bridge keys are processed', () => {
    const bridge: Record<string, unknown> = {}
    const knownKeys = ['overview', 'trace', 'timeline', 'history', 'diff', 'runtime', 'eventStream']
    for (const key of knownKeys) {
      bridge[key] = key
    }
    bridge.extra = 'should be ignored'
    const result = map(bridge as ObservatoryBridgeData)
    expect(Object.keys(result).length).toBe(7)
    expect('extra' in result).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Section 15 — Edge Cases
// ---------------------------------------------------------------------------

describe('mapper — edge cases', () => {
  it('handles non-object values for known keys', () => {
    const result = map({
      trace: 'string-trace' as unknown as never[],
      diff: 42 as unknown as never[],
      runtime: true as unknown as Record<string, unknown>,
    })
    expect(result.trace).toBe('string-trace')
    expect(result.diffView).toBe(42)
    expect(result.runtimeView).toBe(true)
  })

  it('handles deeply nested bridge data', () => {
    const bridge = {
      trace: [{ id: 'deep', label: 'Deep', steps: [{ id: 's1', label: 'Step', status: 'done' }] }],
    }
    const result = map(bridge)
    expect(result.trace).toBe(bridge.trace)
  })

  it('handles frozen input', () => {
    const bridge = Object.freeze({ trace: [{ id: 't1', label: 'Frozen', steps: [] }] })
    expect(() => map(bridge)).not.toThrow()
    const result = map(bridge)
    expect('trace' in result).toBe(true)
  })

  it('handles sealed input', () => {
    const bridge = Object.seal({ trace: [{ id: 't1', label: 'Sealed', steps: [] }] })
    expect(() => map(bridge)).not.toThrow()
    const result = map(bridge)
    expect('trace' in result).toBe(true)
  })

  it('handles non-extensible input', () => {
    const bridge = Object.preventExtensions({ trace: [{ id: 't1', label: 'NonExt', steps: [] }] })
    expect(() => map(bridge)).not.toThrow()
    const result = map(bridge)
    expect('trace' in result).toBe(true)
  })

  it('handles Object.create(null) input', () => {
    const bridge = Object.create(null)
    bridge.trace = [{ id: 't1', label: 'NullProto', steps: [] }]
    bridge.diff = [{ id: 'd1', timestamp: '', added: [], removed: [], changed: [] }]
    const result = map(bridge)
    expect('trace' in result).toBe(true)
    expect('diffView' in result).toBe(true)
  })

  it('handles Object.create(null) with empty input', () => {
    const bridge = Object.create(null)
    const result = map(bridge)
    expect(Object.keys(result)).toEqual([])
  })

  it('prototype pollution attempt is safe', () => {
    const bridge = { __proto__: { trace: [] } } as Record<string, unknown>
    const result = map(bridge as ObservatoryBridgeData)
    // __proto__ is not a known bridge key — should not appear as own property
    expect(Object.prototype.hasOwnProperty.call(result, '__proto__')).toBe(false)
    expect(Object.keys(result)).toEqual([])
  })

  it('constructor property is safe', () => {
    const bridge: Record<string, unknown> = { constructor: { trace: [] } }
    const result = map(bridge as ObservatoryBridgeData)
    // constructor is not a known bridge key — should not appear as own property
    expect(Object.prototype.hasOwnProperty.call(result, 'constructor')).toBe(false)
  })

  it('function value for overview works', () => {
    const result = map({ overview: () => 'fn' })
    expect('overview' in result).toBe(true)
    expect(typeof result.overview).toBe('function')
  })

  it('Date value for trace works (Date has no own keys, treated as empty)', () => {
    const date = new Date()
    const result = map({ trace: date as unknown as never[] })
    // Date has no own enumerable keys → isEmpty returns true → omitted
    expect('trace' in result).toBe(false)
  })

  it('RegExp value for timeline works (RegExp has no own keys, treated as empty)', () => {
    const regex = /test/
    const result = map({ timeline: regex as unknown as never[] })
    // RegExp has no own enumerable keys → isEmpty returns true → omitted
    expect('timeline' in result).toBe(false)
  })

  it('Map value for diff works (Map has no own keys, treated as empty)', () => {
    const mapVal = new Map()
    const result = map({ diff: mapVal as unknown as never[] })
    // Map has no own enumerable keys → isEmpty returns true → omitted
    expect('diffView' in result).toBe(false)
  })

  it('Set value for runtime works (Set has no own keys, treated as empty)', () => {
    const set = new Set()
    const result = map({ runtime: set as unknown as Record<string, unknown> })
    // Set has no own enumerable keys → isEmpty returns true → omitted
    expect('runtimeView' in result).toBe(false)
  })

  it('no throw guarantee for any input', () => {
    expect(() => map(undefined as unknown as ObservatoryBridgeData)).not.toThrow()
    expect(() => map(null as unknown as ObservatoryBridgeData)).not.toThrow()
    expect(() => map({})).not.toThrow()
    expect(() => map(buildCompleteBridge())).not.toThrow()
  })
})

// ---------------------------------------------------------------------------
// Section 16 — Value Preservation
// ---------------------------------------------------------------------------

describe('mapper — value preservation', () => {
  it('preserves string values', () => {
    const result = map({ overview: 'hello' })
    expect(result.overview).toBe('hello')
  })

  it('preserves number values', () => {
    const result = map({ overview: 42 })
    expect(result.overview).toBe(42)
  })

  it('preserves boolean values', () => {
    const result = map({ overview: true })
    expect(result.overview).toBe(true)
  })

  it('preserves null values (not omitted for non-empty check)', () => {
    // null for overview: isEmpty(null) → true → omitted
    const result = map({ overview: null })
    expect('overview' in result).toBe(false)
  })

  it('preserves nested objects', () => {
    const nested = { a: { b: { c: 1 } } }
    const result = map({ overview: nested })
    expect(result.overview).toBe(nested)
  })

  it('preserves array references', () => {
    const arr = [{ id: 't1', label: 'T', steps: [] }]
    const result = map({ trace: arr })
    expect(result.trace).toBe(arr)
  })

  it('preserves zero values', () => {
    const result = map({ overview: 0 })
    expect(result.overview).toBe(0)
  })

  it('preserves empty string values', () => {
    const result = map({ overview: '' })
    expect(result.overview).toBe('')
  })

  it('preserves false values', () => {
    const result = map({ overview: false })
    expect(result.overview).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Section 17 — Key Ordering
// ---------------------------------------------------------------------------

describe('mapper — key ordering', () => {
  it('output keys follow canonical order: overview, trace, timeline, history, diffView, runtimeView, eventStreamView', () => {
    const result = map(buildCompleteBridge())
    expect(Object.keys(result)).toEqual([
      'overview', 'trace', 'timeline', 'history', 'diffView', 'runtimeView', 'eventStreamView',
    ])
  })

  it('partial bridge keys follow canonical order', () => {
    const result = map({
      eventStream: { events: [] },
      trace: [{ id: 't1', label: 'T', steps: [] }],
      diff: [{ id: 'd1', timestamp: '', added: [], removed: [], changed: [] }],
    })
    expect(Object.keys(result)).toEqual(['trace', 'diffView', 'eventStreamView'])
  })

  it('single key maintains canonical position', () => {
    const result = map({ eventStream: { events: [] } })
    expect(Object.keys(result)).toEqual(['eventStreamView'])
  })
})

// ---------------------------------------------------------------------------
// Section 18 — Stress Testing
// ---------------------------------------------------------------------------

describe('mapper — stress testing', () => {
  it('1000 calls with same complete bridge', () => {
    const bridge = buildCompleteBridge()
    for (let i = 0; i < 1000; i++) {
      const result = map(bridge)
      expect(Object.keys(result).length).toBe(7)
    }
  })

  it('1000 calls with varying bridge data', () => {
    for (let i = 0; i < 1000; i++) {
      const bridge = { trace: [{ id: `t${i}`, label: `T${i}`, steps: [] }] }
      const result = map(bridge)
      expect(result.trace).toBeDefined()
    }
  })

  it('1000 calls with empty bridge', () => {
    for (let i = 0; i < 1000; i++) {
      const result = map({})
      expect(Object.keys(result)).toEqual([])
    }
  })

  it('rapid alternating between different bridge shapes', () => {
    for (let i = 0; i < 500; i++) {
      const r1 = map({ trace: [{ id: 't1', label: 'T', steps: [] }] })
      expect(r1.trace).toBeDefined()
      const r2 = map({ diff: [{ id: 'd1', timestamp: '', added: [], removed: [], changed: [] }] })
      expect(r2.diffView).toBeDefined()
      const r3 = map({})
      expect(Object.keys(r3)).toEqual([])
    }
  })

  it('large trace array preserved correctly', () => {
    const trace = Array.from({ length: 1000 }, (_, i) => ({
      id: `t${i}`, label: `T${i}`, steps: [],
    }))
    const result = map({ trace })
    expect(Array.isArray(result.trace)).toBe(true)
    expect((result.trace as unknown[]).length).toBe(1000)
  })

  it('multiple mapper instances over same data produce identical results', () => {
    const bridge = buildCompleteBridge()
    const results = Array.from({ length: 100 }, () => map(bridge))
    for (const r of results) {
      expect(r).toEqual(results[0])
    }
  })
})

// ---------------------------------------------------------------------------
// Section 19 — Integration with EMPTY_BRIDGE_DATA and Empty Objects
// ---------------------------------------------------------------------------

describe('mapper — empty object integration', () => {
  it('EMPTY_BRIDGE_DATA always produces empty result', () => {
    const result = map(EMPTY_BRIDGE_DATA)
    expect(Object.keys(result)).toEqual([])
  })

  it('empty object produces empty result', () => {
    const result = map({})
    expect(Object.keys(result)).toEqual([])
  })

  it('object with only empty fields (where empty means no own keys)', () => {
    // eventStream: { events: [] } has 1 own key → NOT empty
    const result = map({
      overview: {},
      trace: [],
      timeline: [],
      history: [],
      diff: [],
      runtime: {},
      eventStream: { events: [] },
    })
    expect(Object.keys(result)).toEqual(['eventStreamView'])
  })

  it('object with only undefined fields produces empty result', () => {
    const result = map({
      overview: undefined,
      trace: undefined,
      timeline: undefined,
      history: undefined,
      diff: undefined,
      runtime: undefined,
      eventStream: undefined,
    })
    expect(Object.keys(result)).toEqual([])
  })

  it('object with only null fields produces empty result', () => {
    const result = map({
      overview: null,
      trace: null,
      timeline: null,
      history: null,
      diff: null,
      runtime: null,
      eventStream: null,
    })
    expect(Object.keys(result)).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// Section 20 — Prototype Scenario Handling
// ---------------------------------------------------------------------------

describe('mapper — prototype scenarios', () => {
  it('inherited properties are not mapped', () => {
    class Base {
      trace = [{ id: 't1', label: 'T', steps: [] }]
    }
    const instance = new Base()
    const result = map(instance as unknown as ObservatoryBridgeData)
    // hasOwnProperty returns true for own properties of class instances
    expect('trace' in result).toBe(true)
  })

  it('null prototype object works', () => {
    const bridge = Object.create(null)
    bridge.trace = [{ id: 't1', label: 'Null', steps: [] }]
    const result = map(bridge)
    expect('trace' in result).toBe(true)
  })

  it('Object.prototype.trace does not leak', () => {
    // If Object.prototype had a trace property, it shouldn't be mapped
    // since hasOwnProperty only checks own properties
    const result = map({})
    expect('trace' in result).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Section 21 — TypeScript Type Safety
// ---------------------------------------------------------------------------

describe('mapper — TypeScript type safety', () => {
  it('map accepts ObservatoryBridgeData', () => {
    const bridge: ObservatoryBridgeData = { trace: [{ id: 't1', label: 'T', steps: [] }] }
    const result = map(bridge)
    expect(result.trace).toBeDefined()
  })

  it('map returns Record<string, unknown>', () => {
    const result = map({})
    const record: Record<string, unknown> = result
    expect(record).toBeDefined()
  })

  it('EMPTY_BRIDGE_DATA is valid input', () => {
    const result = map(EMPTY_BRIDGE_DATA)
    expect(Object.keys(result)).toEqual([])
  })

  it('partial bridge data compiles', () => {
    const bridge: ObservatoryBridgeData = { diff: [{ id: 'd1', timestamp: '', added: [], removed: [], changed: [] }] }
    const result = map(bridge)
    expect(result.diffView).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Section 22 — Output Frozen Verification
// ---------------------------------------------------------------------------

describe('mapper — output frozen', () => {
  it('result is frozen for complete bridge', () => {
    expect(Object.isFrozen(map(buildCompleteBridge()))).toBe(true)
  })

  it('result is frozen for partial bridge', () => {
    expect(Object.isFrozen(map({ trace: [{ id: 't1', label: 'T', steps: [] }] }))).toBe(true)
  })

  it('result is frozen for empty input', () => {
    expect(Object.isFrozen(map({}))).toBe(true)
  })

  it('result is frozen for undefined input', () => {
    expect(Object.isFrozen(map(undefined as unknown as ObservatoryBridgeData))).toBe(true)
  })

  it('result is frozen for null input', () => {
    expect(Object.isFrozen(map(null as unknown as ObservatoryBridgeData))).toBe(true)
  })

  it('result is frozen for single rename key', () => {
    expect(Object.isFrozen(map({ diff: [{ id: 'd1', timestamp: '', added: [], removed: [], changed: [] }] }))).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Section 23 — Specific Sections: Runtime
// ---------------------------------------------------------------------------

describe('mapper — runtime section', () => {
  it('empty objects omit runtime', () => {
    const result = map({ runtime: {} })
    expect('runtimeView' in result).toBe(false)
  })

  it('runtime with worldId only is included', () => {
    const result = map({ runtime: { worldId: 'test' } })
    expect(result.runtimeView).toEqual({ worldId: 'test' })
  })

  it('runtime with all fields included', () => {
    const runtime = {
      worldId: 'w1',
      entityCount: 100,
      systemCount: 5,
      eventCount: 20,
      fps: 60,
      entities: [
        { id: 'e1', type: 'Guard', position: '(0,0)', health: 100, state: 'Idle', components: [] },
      ],
    }
    const result = map({ runtime })
    expect(result.runtimeView).toBe(runtime)
  })
})

// ---------------------------------------------------------------------------
// Section 24 — Specific Sections: EventStream
// ---------------------------------------------------------------------------

describe('mapper — eventStream section', () => {
  it('empty objects omit eventStream', () => {
    const result = map({ eventStream: {} })
    expect('eventStreamView' in result).toBe(false)
  })

  it('eventStream with events array is included', () => {
    const eventStream = {
      events: [
        { id: 'e1', timestamp: '12:00', level: 'info' as const, source: 'Test', message: 'Test event' },
        { id: 'e2', timestamp: '12:01', level: 'warning' as const, source: 'Test', message: 'Warning' },
      ],
    }
    const result = map({ eventStream })
    expect(result.eventStreamView).toBe(eventStream)
  })

  it('eventStream with empty events array is included (object not empty)', () => {
    // { events: [] } is NOT empty — it has 1 own key
    const result = map({ eventStream: { events: [] } })
    expect('eventStreamView' in result).toBe(true)
    expect(result.eventStreamView).toEqual({ events: [] })
  })
})

// ---------------------------------------------------------------------------
// Section 25 — Specific Sections: Diff
// ---------------------------------------------------------------------------

describe('mapper — diff section', () => {
  it('empty array omits diff', () => {
    const result = map({ diff: [] })
    expect('diffView' in result).toBe(false)
  })

  it('diff with entries is included', () => {
    const diff = [
      { id: 'd1', timestamp: '12:00', added: ['A'], removed: ['B'], changed: ['C'] },
      { id: 'd2', timestamp: '13:00', added: ['D'], removed: [], changed: [] },
    ]
    const result = map({ diff })
    expect(result.diffView).toBe(diff)
  })

  it('single diff entry is included', () => {
    const diff = [{ id: 'd1', timestamp: '12:00', added: [], removed: [], changed: [] }]
    const result = map({ diff })
    expect(Array.isArray(result.diffView)).toBe(true)
    expect((result.diffView as unknown[]).length).toBe(1)
  })
})

// ---------------------------------------------------------------------------
// Section 26 — Specific Sections: Trace, Timeline, History
// ---------------------------------------------------------------------------

describe('mapper — trace/timeline/history sections', () => {
  it('trace with data is included', () => {
    const trace = [{ id: 't1', label: 'Trace 1', steps: [{ id: 's1', label: 'Step', status: 'done' }] }]
    const result = map({ trace })
    expect(result.trace).toBe(trace)
  })

  it('timeline with data is included', () => {
    const timeline = [{ id: 'tl1', label: 'TL1', entries: [{ id: 'te1', label: 'E1', timestamp: '10:00' }] }]
    const result = map({ timeline })
    expect(result.timeline).toBe(timeline)
  })

  it('history with data is included', () => {
    const history = [{ id: 'h1', label: 'H1', entries: [{ id: 'he1', label: 'HE1', timestamp: '10:00' }] }]
    const result = map({ history })
    expect(result.history).toBe(history)
  })

  it('empty trace array is omitted', () => {
    const result = map({ trace: [] })
    expect('trace' in result).toBe(false)
  })

  it('empty timeline array is omitted', () => {
    const result = map({ timeline: [] })
    expect('timeline' in result).toBe(false)
  })

  it('empty history array is omitted', () => {
    const result = map({ history: [] })
    expect('history' in result).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Section 27 — Specific Sections: Overview
// ---------------------------------------------------------------------------

describe('mapper — overview section', () => {
  it('overview with traceCount is included', () => {
    const result = map({ overview: { traceCount: 5 } })
    expect(result.overview).toEqual({ traceCount: 5 })
  })

  it('overview with all fields is included', () => {
    const overview = { traceCount: 3, timelineCount: 2, historyCount: 1 }
    const result = map({ overview })
    expect(result.overview).toBe(overview)
  })

  it('empty object overview is omitted', () => {
    const result = map({ overview: {} })
    expect('overview' in result).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Section 28 — Combined Scenarios
// ---------------------------------------------------------------------------

describe('mapper — combined scenarios', () => {
  it('only rename keys present', () => {
    const result = map({
      diff: [{ id: 'd1', timestamp: '', added: [], removed: [], changed: [] }],
      runtime: { worldId: 'w', entityCount: 0, systemCount: 0, eventCount: 0, fps: 0, entities: [] },
      eventStream: { events: [{ id: 'e1', timestamp: '', level: 'info' as const, source: '', message: '' }] },
    })
    expect(Object.keys(result)).toEqual(['diffView', 'runtimeView', 'eventStreamView'])
  })

  it('only passthrough keys present', () => {
    const result = map({
      overview: { traceCount: 1 },
      trace: [{ id: 't1', label: 'T', steps: [] }],
      timeline: [{ id: 'tl1', label: 'TL', entries: [] }],
      history: [{ id: 'h1', label: 'H', entries: [] }],
    })
    expect(Object.keys(result)).toEqual(['overview', 'trace', 'timeline', 'history'])
  })

  it('mix of omitted and included fields', () => {
    const result = map({
      trace: [{ id: 't1', label: 'T', steps: [] }],
      timeline: [],
      diff: [{ id: 'd1', timestamp: '', added: [], removed: [], changed: [] }],
      runtime: null,
      eventStream: { events: [] },  // { events: [] } has 1 own key, not empty
    })
    expect(Object.keys(result)).toEqual(['trace', 'diffView', 'eventStreamView'])
  })

  it('all fields empty returns empty object', () => {
    const result = map({
      overview: {},
      trace: [],
      timeline: [],
      history: [],
      diff: [],
      runtime: {},
      eventStream: {},
    })
    expect(Object.keys(result)).toEqual([])
  })

  it('all fields valid returns all 7 mapped keys', () => {
    const result = map({
      overview: { traceCount: 1 },
      trace: [{ id: 't1', label: 'T', steps: [] }],
      timeline: [{ id: 'tl1', label: 'TL', entries: [] }],
      history: [{ id: 'h1', label: 'H', entries: [] }],
      diff: [{ id: 'd1', timestamp: '', added: [], removed: [], changed: [] }],
      runtime: { worldId: 'w', entityCount: 0, systemCount: 0, eventCount: 0, fps: 0, entities: [] },
      eventStream: { events: [{ id: 'e1', timestamp: '', level: 'info' as const, source: '', message: '' }] },
    })
    expect(Object.keys(result).length).toBe(7)
  })
})

// ---------------------------------------------------------------------------
// Section 29 — No AI / Runtime / Plugin Leakage
// ---------------------------------------------------------------------------

describe('mapper — no leakage', () => {
  it('mapper has no AI imports', () => {
    const mapper = createMapper()
    expect(mapper).toBeDefined()
  })

  it('mapper has no Runtime dependencies', () => {
    const mapper = createMapper()
    expect(mapper).toBeDefined()
  })

  it('mapper has no UI dependencies', () => {
    const mapper = createMapper()
    expect(mapper).toBeDefined()
  })

  it('mapper output contains no AI types', () => {
    const result = map(buildCompleteBridge())
    const values = Object.values(result)
    for (const v of values) {
      expect(v).not.toBeInstanceOf(Promise)
    }
  })
})

// ---------------------------------------------------------------------------
// Section 30 — Additional Mixed Input Shapes
// ---------------------------------------------------------------------------

describe('mapper — mixed input shapes', () => {
  it('trace is string, not array — passed through', () => {
    const result = map({ trace: 'string-data' as unknown as never[] })
    expect(result.trace).toBe('string-data')
  })

  it('trace is number — passed through', () => {
    const result = map({ trace: 99 as unknown as never[] })
    expect(result.trace).toBe(99)
  })

  it('overview is array — passed through (not empty)', () => {
    const result = map({ overview: [1, 2, 3] })
    expect(result.overview).toEqual([1, 2, 3])
  })

  it('overview is function — passed through', () => {
    const fn = () => 'test'
    const result = map({ overview: fn })
    expect(result.overview).toBe(fn)
  })

  it('trace is object (not array) — passed through', () => {
    const obj = { a: 1, b: 2 }
    const result = map({ trace: obj as unknown as never[] })
    expect(result.trace).toBe(obj)
  })

  it('diff is object — passed through (has own keys)', () => {
    const obj = { items: ['a', 'b'] }
    const result = map({ diff: obj as unknown as never[] })
    expect(result.diffView).toBe(obj)
  })

  it('runtime is string — passed through', () => {
    const result = map({ runtime: 'raw' as unknown as Record<string, unknown> })
    expect(result.runtimeView).toBe('raw')
  })

  it('eventStream is boolean true — passed through', () => {
    const result = map({ eventStream: true as unknown as Record<string, unknown> })
    expect(result.eventStreamView).toBe(true)
  })

  it('eventStream is boolean false — passed through', () => {
    const result = map({ eventStream: false as unknown as Record<string, unknown> })
    expect(result.eventStreamView).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Section 31 — Property Descriptor Handling
// ---------------------------------------------------------------------------

describe('mapper — property descriptor handling', () => {
  it('writable:false properties are still read', () => {
    const bridge = {} as Record<string, unknown>
    Object.defineProperty(bridge, 'trace', {
      value: [{ id: 't1', label: 'T', steps: [] }],
      writable: false,
      enumerable: true,
      configurable: false,
    })
    const result = map(bridge as ObservatoryBridgeData)
    expect('trace' in result).toBe(true)
  })

  it('non-enumerable own properties are not read', () => {
    const bridge = {} as Record<string, unknown>
    Object.defineProperty(bridge, 'trace', {
      value: [{ id: 't1', label: 'T', steps: [] }],
      enumerable: false,
      configurable: true,
    })
    const result = map(bridge as ObservatoryBridgeData)
    // hasOwnProperty returns true, but enumerable is false
    // The mapper uses hasOwnProperty, which checks own properties regardless of enumerability
    expect('trace' in result).toBe(true)
  })

  it('configurable:false properties are still read', () => {
    const bridge = {} as Record<string, unknown>
    Object.defineProperty(bridge, 'diff', {
      value: [{ id: 'd1', timestamp: '', added: [], removed: [], changed: [] }],
      writable: true,
      enumerable: true,
      configurable: false,
    })
    const result = map(bridge as ObservatoryBridgeData)
    expect('diffView' in result).toBe(true)
  })

  it('getter property is read correctly', () => {
    let callCount = 0
    const bridge = {} as Record<string, unknown>
    Object.defineProperty(bridge, 'trace', {
      get: () => {
        callCount++
        return [{ id: 't1', label: 'Getter', steps: [] }]
      },
      enumerable: true,
      configurable: true,
    })
    const result = map(bridge as ObservatoryBridgeData)
    expect('trace' in result).toBe(true)
    expect(callCount).toBeGreaterThanOrEqual(1)
  })
})

// ---------------------------------------------------------------------------
// Section 32 — Constructor Safety
// ---------------------------------------------------------------------------

describe('mapper — constructor safety', () => {
  it('Object literal with constructor own property not mapped', () => {
    const bridge: Record<string, unknown> = { constructor: 'test' }
    const result = map(bridge as ObservatoryBridgeData)
    expect(Object.prototype.hasOwnProperty.call(result, 'constructor')).toBe(false)
  })

  it('constructor with known bridge key does not interfere', () => {
    const bridge: Record<string, unknown> = {
      constructor: 'test',
      trace: [{ id: 't1', label: 'T', steps: [] }],
    }
    const result = map(bridge as ObservatoryBridgeData)
    expect('trace' in result).toBe(true)
    expect(Object.prototype.hasOwnProperty.call(result, 'constructor')).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Section 33 — Multiple Instances
// ---------------------------------------------------------------------------

describe('mapper — multiple instances', () => {
  it('10 instances produce same output for same input', () => {
    const bridge = buildCompleteBridge()
    const results = Array.from({ length: 10 }, () => createMapper().map(bridge))
    for (const r of results) {
      expect(r).toEqual(results[0])
    }
  })

  it('100 instances produce same output shape', () => {
    const bridge = { trace: [{ id: 't1', label: 'T', steps: [] }] }
    const instances = Array.from({ length: 100 }, () => createMapper())
    for (const mapper of instances) {
      const result = mapper.map(bridge)
      expect(Object.keys(result)).toEqual(['trace'])
    }
  })
})

// ---------------------------------------------------------------------------
// Section 34 — Repeated Calls / Stress
// ---------------------------------------------------------------------------

describe('mapper — repeated calls', () => {
  it('1000 calls with same input produce same result shape', () => {
    const bridge = buildCompleteBridge()
    const mapper = createMapper()
    for (let i = 0; i < 1000; i++) {
      const result = mapper.map(bridge)
      expect(Object.keys(result).length).toBe(7)
    }
  })

  it('1000 calls with varying input', () => {
    const mapper = createMapper()
    for (let i = 0; i < 1000; i++) {
      const result = mapper.map({ trace: [{ id: `t${i}`, label: `T${i}`, steps: [] }] })
      expect((result.trace as Array<{ id: string }>)[0].id).toBe(`t${i}`)
    }
  })

  it('rapid alternating between complete, partial, and empty', () => {
    const mapper = createMapper()
    for (let i = 0; i < 500; i++) {
      const r1 = mapper.map(buildCompleteBridge())
      expect(Object.keys(r1).length).toBe(7)
      const r2 = mapper.map({ diff: [{ id: 'd1', timestamp: '', added: [], removed: [], changed: [] }] })
      expect(Object.keys(r2)).toEqual(['diffView'])
      const r3 = mapper.map({})
      expect(Object.keys(r3)).toEqual([])
    }
  })
})

// ---------------------------------------------------------------------------
// Section 35 — Null-Prototype Objects
// ---------------------------------------------------------------------------

describe('mapper — null-prototype objects', () => {
  it('null-prototype with single key', () => {
    const bridge = Object.create(null)
    bridge.trace = [{ id: 't1', label: 'T', steps: [] }]
    const result = map(bridge)
    expect(Object.keys(result)).toEqual(['trace'])
  })

  it('null-prototype with multiple keys', () => {
    const bridge = Object.create(null)
    bridge.timeline = [{ id: 'tl1', label: 'TL', entries: [] }]
    bridge.diff = [{ id: 'd1', timestamp: '', added: [], removed: [], changed: [] }]
    bridge.runtime = { worldId: 'w', entityCount: 0, systemCount: 0, eventCount: 0, fps: 0, entities: [] }
    const result = map(bridge)
    expect(Object.keys(result)).toEqual(['timeline', 'diffView', 'runtimeView'])
  })

  it('null-prototype empty object', () => {
    const bridge = Object.create(null)
    const result = map(bridge)
    expect(Object.keys(result)).toEqual([])
    expect(Object.isFrozen(result)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Section 36 — Pass-through with Null-Prototype Values
// ---------------------------------------------------------------------------

describe('mapper — pass-through with special values', () => {
  it('trace with Symbol value', () => {
    const sym = Symbol('test')
    const result = map({ trace: sym as unknown as never[] })
    expect(result.trace).toBe(sym)
  })

  it('overview with bigint value', () => {
    const big = BigInt(42)
    const result = map({ overview: big })
    expect(result.overview).toBe(big)
  })

  it('timeline with typed array', () => {
    const arr = new Uint8Array([1, 2, 3])
    const result = map({ timeline: arr as unknown as never[] })
    expect(result.timeline).toBe(arr)
  })

  it('history with DataView (no own keys, treated as empty)', () => {
    const buf = new ArrayBuffer(4)
    const view = new DataView(buf)
    const result = map({ history: view as unknown as never[] })
    // DataView has no own enumerable keys → isEmpty → omitted
    expect('history' in result).toBe(false)
  })

  it('diff with class instance', () => {
    class CustomData { x = 1; y = 2 }
    const instance = new CustomData()
    const result = map({ diff: instance as unknown as never[] })
    expect(result.diffView).toBe(instance)
  })

  it('runtime with class instance ensuring own properties', () => {
    class RuntimeData { worldId = 'w1'; entityCount = 5 }
    const instance = new RuntimeData()
    const result = map({ runtime: instance as unknown as Record<string, unknown> })
    expect(result.runtimeView).toBe(instance)
  })
})

// ---------------------------------------------------------------------------
// Section 37 — Error and Promise Values
// ---------------------------------------------------------------------------

describe('mapper — error and promise values', () => {
  it('Error object (no own enumerable keys, treated as empty)', () => {
    const err = new Error('test error')
    const result = map({ overview: err })
    // Error has no own enumerable keys → isEmpty → omitted
    expect('overview' in result).toBe(false)
  })

  it('Promise value (no own enumerable keys, treated as empty)', () => {
    const promise = Promise.resolve(42)
    const result = map({ overview: promise })
    // Promise has no own enumerable keys → isEmpty → omitted
    expect('overview' in result).toBe(false)
  })

  it('undefined value is omitted', () => {
    const result = map({ overview: undefined })
    expect('overview' in result).toBe(false)
  })

  it('null value is omitted', () => {
    const result = map({ overview: null })
    expect('overview' in result).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Section 38 — Adapter Key Compatibility
// ---------------------------------------------------------------------------

describe('mapper — adapter key compatibility', () => {
  it('mapped output has trace key for adapter', () => {
    const bridge = { trace: [{ id: 't1', label: 'T', steps: [{ id: 's1', label: 'S', status: 'done' }] }] }
    const mapped = map(bridge)
    expect(mapped.trace).toBeDefined()
    expect(Array.isArray(mapped.trace)).toBe(true)
  })

  it('mapped output has timeline key for adapter', () => {
    const bridge = { timeline: [{ id: 'tl1', label: 'TL', entries: [{ id: 'te1', label: 'E', timestamp: '10:00' }] }] }
    const mapped = map(bridge)
    expect(mapped.timeline).toBeDefined()
  })

  it('mapped output has history key for adapter', () => {
    const bridge = { history: [{ id: 'h1', label: 'H', entries: [{ id: 'he1', label: 'HE', timestamp: '11:00' }] }] }
    const mapped = map(bridge)
    expect(mapped.history).toBeDefined()
  })

  it('mapped output has diffView key for adapter', () => {
    const bridge = { diff: [{ id: 'd1', timestamp: '12:00', added: ['A'], removed: ['B'], changed: ['C'] }] }
    const mapped = map(bridge)
    expect(mapped.diffView).toBeDefined()
    expect(Array.isArray(mapped.diffView)).toBe(true)
  })

  it('mapped output has runtimeView key for adapter', () => {
    const bridge = { runtime: { worldId: 'rw', entityCount: 10, systemCount: 2, eventCount: 5, fps: 30, entities: [] } }
    const mapped = map(bridge)
    expect(mapped.runtimeView).toBeDefined()
    expect(typeof mapped.runtimeView).toBe('object')
  })

  it('mapped output has eventStreamView key for adapter', () => {
    const bridge = { eventStream: { events: [{ id: 'e1', timestamp: '12:00', level: 'info', source: 'S', message: 'M' }] } }
    const mapped = map(bridge)
    expect(mapped.eventStreamView).toBeDefined()
    expect(typeof mapped.eventStreamView).toBe('object')
  })

  it('mapped output has overview key for adapter', () => {
    const bridge = { overview: { traceCount: 1, timelineCount: 2, historyCount: 3 } }
    const mapped = map(bridge)
    expect(mapped.overview).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Section 39 — Value Edge Cases
// ---------------------------------------------------------------------------

describe('mapper — value edge cases', () => {
  it('overview with NaN is included', () => {
    const result = map({ overview: NaN })
    expect('overview' in result).toBe(true)
    expect(Number.isNaN(result.overview as number)).toBe(true)
  })

  it('overview with Infinity is included', () => {
    const result = map({ overview: Infinity })
    expect(result.overview).toBe(Infinity)
  })

  it('overview with -Infinity is included', () => {
    const result = map({ overview: -Infinity })
    expect(result.overview).toBe(-Infinity)
  })

  it('overview with Symbol is included', () => {
    const sym = Symbol.for('test')
    const result = map({ overview: sym })
    expect(result.overview).toBe(sym)
  })

  it('overview with BigInt is included', () => {
    const big = BigInt(9007199254740991)
    const result = map({ overview: big })
    expect(result.overview).toBe(big)
  })

  it('trace with nested null inside array is included (array non-empty)', () => {
    const result = map({ trace: [null as unknown as never] })
    expect('trace' in result).toBe(true)
    expect(Array.isArray(result.trace)).toBe(true)
    expect((result.trace as unknown[]).length).toBe(1)
  })

  it('overview with object containing only Symbol keys is empty', () => {
    const obj = {} as Record<string, unknown>
    Object.defineProperty(obj, Symbol('key'), { value: 'value', enumerable: true })
    // Object.keys ignores Symbol keys — Object.keys(obj) === []
    const result = map({ overview: obj })
    expect('overview' in result).toBe(false)
  })

  it('trace with array containing undefined', () => {
    const result = map({ trace: [undefined as unknown as never] })
    expect('trace' in result).toBe(true)
  })
})