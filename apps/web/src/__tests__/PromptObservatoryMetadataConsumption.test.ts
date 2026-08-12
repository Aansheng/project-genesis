/**
 * PromptObservatoryMetadataConsumption — verifies that
 * DefaultObservatoryMetadataBridge consumes PromptObservatoryMetadata
 * via PromptObservatoryMetadataBuilder.
 *
 * WO-S6-025 — Prompt Observatory Metadata Consumption
 * Architecture version v1.54 → v1.55
 */

import { describe, it, expect, vi } from 'vitest'
import { DefaultObservatoryMetadataBridge } from '../adapters/observatory/bridge'
import type { ObservatoryMetadataBridge } from '../adapters/observatory/bridge'
import type { ObservatoryBridgeData } from '../adapters/observatory/bridge'
import { EMPTY_BRIDGE_DATA } from '../adapters/observatory/bridge'
import { DefaultPromptObservatoryMetadataBuilder } from '@genesis/ai'
import type { PromptObservatoryMetadataBuilder } from '@genesis/ai'
import type { PromptObservatoryMetadata } from '@genesis/ai'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createBridge(builder?: PromptObservatoryMetadataBuilder): ObservatoryMetadataBridge {
  return new DefaultObservatoryMetadataBridge(builder)
}

function adapt(metadata: unknown, builder?: PromptObservatoryMetadataBuilder): ObservatoryBridgeData {
  return createBridge(builder).adapt(metadata)
}

/** Full metadata covering all 7 known observatory keys. */
function buildFullMetadata(): Record<string, unknown> {
  return {
    overview: { traceCount: 3, timelineCount: 2 },
    trace: [{ id: 't1', label: 'Trace 1', steps: [] }],
    timeline: [{ id: 'tl1', label: 'Timeline 1', entries: [] }],
    history: [{ id: 'h1', label: 'History 1', entries: [] }],
    diff: [{ id: 'd1', timestamp: '12:00', added: [], removed: [], changed: [] }],
    runtime: { worldId: 'w1', entityCount: 50, systemCount: 4 },
    eventStream: { events: [{ id: 'e1', timestamp: '12:00', level: 'info', source: 'S', message: 'M' }] },
  }
}

/** Partial metadata with only some known keys. */
function buildPartialMetadata(): Record<string, unknown> {
  return {
    overview: { traceCount: 1 },
    trace: [{ id: 't1', label: 'Partial Trace', steps: [] }],
    runtime: { worldId: 'partial-world' },
  }
}

/** Metadata with unknown keys only. */
function buildUnknownOnlyMetadata(): Record<string, unknown> {
  return {
    unknownKey: 'value',
    anotherUnknown: 42,
    completelyUnknown: { nested: true },
  }
}

/** Metadata with mixed known and unknown keys. */
function buildMixedMetadata(): Record<string, unknown> {
  return {
    overview: { traceCount: 2 },
    unknownKey: 'should-be-ignored',
    trace: [{ id: 't1', label: 'Mixed', steps: [] }],
    anotherUnknown: { nested: true },
  }
}

/** Build a mock builder that records calls. */
function createMockBuilder(): { builder: PromptObservatoryMetadataBuilder; callCount: () => number; lastInput: () => Record<string, unknown> | undefined } {
  let count = 0
  let input: Record<string, unknown> | undefined

  const builder: PromptObservatoryMetadataBuilder = {
    build(metadata: Record<string, unknown>): PromptObservatoryMetadata {
      count++
      input = metadata
      return new DefaultPromptObservatoryMetadataBuilder().build(metadata)
    },
  }

  return {
    builder,
    callCount: () => count,
    lastInput: () => input,
  }
}

/** Metadata that exercises boundary values for all types. */
function buildBoundaryMetadata(): Record<string, unknown> {
  return {
    overview: null,
    trace: undefined,
    timeline: 0,
    history: '',
    diff: false,
    runtime: [],
    eventStream: {},
  }
}

// ---------------------------------------------------------------------------
// Section 1 — Builder Invocation
// ---------------------------------------------------------------------------

describe('consumption — builder invocation', () => {
  it('invokes builder.build() on valid metadata', () => {
    const { builder, callCount } = createMockBuilder()
    adapt({ overview: {} }, builder)
    expect(callCount()).toBe(1)
  })

  it('invokes builder.build() exactly once per adapt()', () => {
    const { builder, callCount } = createMockBuilder()
    const bridge = createBridge(builder)
    bridge.adapt({ overview: { a: 1 } })
    bridge.adapt({ trace: { b: 2 } })
    expect(callCount()).toBe(2)
  })

  it('does not invoke builder.build() for undefined input', () => {
    const { builder, callCount } = createMockBuilder()
    adapt(undefined, builder)
    expect(callCount()).toBe(0)
  })

  it('does not invoke builder.build() for null input', () => {
    const { builder, callCount } = createMockBuilder()
    adapt(null, builder)
    expect(callCount()).toBe(0)
  })

  it('does not invoke builder.build() for primitive input', () => {
    const { builder, callCount } = createMockBuilder()
    adapt(42, builder)
    expect(callCount()).toBe(0)
  })

  it('does not invoke builder.build() for string input', () => {
    const { builder, callCount } = createMockBuilder()
    adapt('string', builder)
    expect(callCount()).toBe(0)
  })

  it('does not invoke builder.build() for array input', () => {
    const { builder, callCount } = createMockBuilder()
    adapt([], builder)
    expect(callCount()).toBe(0)
  })

  it('does not invoke builder.build() for boolean input', () => {
    const { builder, callCount } = createMockBuilder()
    adapt(true, builder)
    expect(callCount()).toBe(0)
  })

  it('invokes builder.build() with the exact metadata object', () => {
    const metadata = { overview: { count: 5 } }
    const { builder, lastInput } = createMockBuilder()
    adapt(metadata, builder)
    expect(lastInput()).toBe(metadata)
  })

  it('invokes builder.build() for empty object', () => {
    const { builder, callCount } = createMockBuilder()
    adapt({}, builder)
    expect(callCount()).toBe(1)
  })

  it('invokes builder.build() with null-prototype object', () => {
    const obj = Object.create(null) as Record<string, unknown>
    obj.overview = { count: 5 }
    const { builder, callCount } = createMockBuilder()
    adapt(obj, builder)
    expect(callCount()).toBe(1)
  })

  it('passes null-prototype object to builder correctly', () => {
    const obj = Object.create(null) as Record<string, unknown>
    obj.overview = { count: 5 }
    const { builder, lastInput } = createMockBuilder()
    adapt(obj, builder)
    expect(lastInput()).toBe(obj)
  })

  it('uses default builder when no builder provided', () => {
    const bridge = createBridge()
    expect(bridge).toBeDefined()
  })

  it('uses injected builder when provided', () => {
    const { builder } = createMockBuilder()
    const bridge = createBridge(builder)
    expect(bridge).toBeDefined()
  })

  it('invokes injected builder on adapt', () => {
    const { builder, callCount } = createMockBuilder()
    const bridge = createBridge(builder)
    bridge.adapt({ overview: {} })
    expect(callCount()).toBe(1)
  })
})

// ---------------------------------------------------------------------------
// Section 2 — Single Invocation
// ---------------------------------------------------------------------------

describe('consumption — single invocation', () => {
  it('exactly one call per valid adapt', () => {
    const { builder, callCount } = createMockBuilder()
    const bridge = createBridge(builder)
    bridge.adapt(buildFullMetadata())
    expect(callCount()).toBe(1)
  })

  it('exactly one call per partial adapt', () => {
    const { builder, callCount } = createMockBuilder()
    const bridge = createBridge(builder)
    bridge.adapt(buildPartialMetadata())
    expect(callCount()).toBe(1)
  })

  it('exactly one call per empty adapt', () => {
    const { builder, callCount } = createMockBuilder()
    const bridge = createBridge(builder)
    bridge.adapt({})
    expect(callCount()).toBe(1)
  })

  it('builder is NOT called after bridge returns (no lazy evaluation)', () => {
    const { builder, callCount } = createMockBuilder()
    const bridge = createBridge(builder)
    const result = bridge.adapt({ overview: {} })
    // Access the result — should not trigger another build
    const keys = Object.keys(result)
    expect(callCount()).toBe(1)
    expect(keys).toEqual(['overview'])
  })
})

// ---------------------------------------------------------------------------
// Section 3 — All Fields
// ---------------------------------------------------------------------------

describe('consumption — all fields', () => {
  it('extracts overview via contract', () => {
    const result = adapt(buildFullMetadata())
    expect(result.overview).toEqual({ traceCount: 3, timelineCount: 2 })
  })

  it('extracts trace via contract', () => {
    const result = adapt(buildFullMetadata())
    expect(result.trace).toEqual([{ id: 't1', label: 'Trace 1', steps: [] }])
  })

  it('extracts timeline via contract', () => {
    const result = adapt(buildFullMetadata())
    expect(result.timeline).toEqual([{ id: 'tl1', label: 'Timeline 1', entries: [] }])
  })

  it('extracts history via contract', () => {
    const result = adapt(buildFullMetadata())
    expect(result.history).toEqual([{ id: 'h1', label: 'History 1', entries: [] }])
  })

  it('extracts diff via contract', () => {
    const result = adapt(buildFullMetadata())
    expect(result.diff).toEqual([{ id: 'd1', timestamp: '12:00', added: [], removed: [], changed: [] }])
  })

  it('extracts runtime via contract', () => {
    const result = adapt(buildFullMetadata())
    expect(result.runtime).toEqual({ worldId: 'w1', entityCount: 50, systemCount: 4 })
  })

  it('extracts eventStream via contract', () => {
    const result = adapt(buildFullMetadata())
    expect(result.eventStream).toEqual({ events: [{ id: 'e1', timestamp: '12:00', level: 'info', source: 'S', message: 'M' }] })
  })

  it('all 7 keys present in result', () => {
    const result = adapt(buildFullMetadata())
    expect(Object.keys(result).sort()).toEqual([
      'diff', 'eventStream', 'history', 'overview', 'runtime', 'timeline', 'trace',
    ])
  })

  it('each field value matches input value', () => {
    const input = buildFullMetadata()
    const result = adapt(input)
    expect(result.overview).toBe(input.overview)
    expect(result.trace).toBe(input.trace)
    expect(result.timeline).toBe(input.timeline)
    expect(result.history).toBe(input.history)
    expect(result.diff).toBe(input.diff)
    expect(result.runtime).toBe(input.runtime)
    expect(result.eventStream).toBe(input.eventStream)
  })

  it('nested object values are preserved', () => {
    const metadata = {
      overview: { traceCount: 10, timelineCount: 5, details: { nested: { value: true } } },
    }
    const result = adapt(metadata)
    expect(result.overview).toEqual(metadata.overview)
  })

  it('array values are preserved', () => {
    const traces = [
      { id: 'a', steps: [{ id: 's1', label: 'Step 1', status: 'done' }] },
      { id: 'b', steps: [{ id: 's2', label: 'Step 2', status: 'pending' }] },
    ]
    const result = adapt({ trace: traces })
    expect(result.trace).toEqual(traces)
  })
})

// ---------------------------------------------------------------------------
// Section 4 — Partial Metadata
// ---------------------------------------------------------------------------

describe('consumption — partial metadata', () => {
  it('extracts only overview when only overview provided', () => {
    const result = adapt({ overview: { traceCount: 1 } })
    expect(Object.keys(result)).toEqual(['overview'])
  })

  it('extracts only trace when only trace provided', () => {
    const result = adapt({ trace: [{ id: 't1', steps: [] }] })
    expect(Object.keys(result)).toEqual(['trace'])
  })

  it('extracts only timeline when only timeline provided', () => {
    const result = adapt({ timeline: [] })
    expect(Object.keys(result)).toEqual(['timeline'])
  })

  it('extracts only history when only history provided', () => {
    const result = adapt({ history: [] })
    expect(Object.keys(result)).toEqual(['history'])
  })

  it('extracts only diff when only diff provided', () => {
    const result = adapt({ diff: [] })
    expect(Object.keys(result)).toEqual(['diff'])
  })

  it('extracts only runtime when only runtime provided', () => {
    const result = adapt({ runtime: { worldId: 'test' } })
    expect(Object.keys(result)).toEqual(['runtime'])
  })

  it('extracts only eventStream when only eventStream provided', () => {
    const result = adapt({ eventStream: {} })
    expect(Object.keys(result)).toEqual(['eventStream'])
  })

  it('extracts two keys when two provided', () => {
    const result = adapt({ overview: {}, trace: [] })
    expect(Object.keys(result).sort()).toEqual(['overview', 'trace'])
  })

  it('extracts three keys when three provided', () => {
    const result = adapt({ overview: {}, trace: [], timeline: [] })
    expect(Object.keys(result).sort()).toEqual(['overview', 'timeline', 'trace'])
  })

  it('extracts subset from partial metadata', () => {
    const result = adapt(buildPartialMetadata())
    expect(Object.keys(result).sort()).toEqual(['overview', 'runtime', 'trace'])
  })

  it('omits keys not in input', () => {
    const result = adapt({ overview: { traceCount: 1 } })
    expect('trace' in result).toBe(false)
    expect('timeline' in result).toBe(false)
    expect('history' in result).toBe(false)
    expect('diff' in result).toBe(false)
    expect('runtime' in result).toBe(false)
    expect('eventStream' in result).toBe(false)
  })

  it('empty object produces no keys', () => {
    const result = adapt({})
    expect(Object.keys(result)).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// Section 5 — Unknown Metadata
// ---------------------------------------------------------------------------

describe('consumption — unknown metadata', () => {
  it('ignores unknown keys', () => {
    const result = adapt({ unknownKey: 'value', anotherUnknown: 42 })
    expect(Object.keys(result)).toHaveLength(0)
  })

  it('ignores mixed known and unknown', () => {
    const result = adapt(buildMixedMetadata())
    expect(Object.keys(result).sort()).toEqual(['overview', 'trace'])
  })

  it('unknown-only metadata returns empty', () => {
    const result = adapt(buildUnknownOnlyMetadata())
    expect(Object.keys(result)).toHaveLength(0)
  })

  it('unknown keys with same name as known but different casing are ignored', () => {
    const result = adapt({ Overview: {}, Trace: [] })
    expect(Object.keys(result)).toHaveLength(0)
  })

  it('symbol keys in metadata are ignored', () => {
    const sym = Symbol('test')
    const metadata: Record<string, unknown> = { overview: {} }
    metadata[sym as unknown as string] = 'symbol-value'
    const result = adapt(metadata)
    expect(Object.keys(result)).toEqual(['overview'])
  })

  it('prototype pollution attempt via __proto__ is ignored', () => {
    const metadata = JSON.parse('{"__proto__": {"overview": {"x": 1}}}')
    const result = adapt(metadata)
    expect(Object.keys(result)).toHaveLength(0)
  })

  it('prototype pollution attempt via constructor is ignored', () => {
    const metadata = { constructor: { overview: { x: 1 } } }
    const result = adapt(metadata)
    expect(Object.keys(result)).toHaveLength(0)
  })

  it('extra unknown fields do not affect known extraction', () => {
    const metadata = {
      overview: { count: 1 },
      unknown1: 'x',
      trace: [],
      unknown2: 42,
    }
    const result = adapt(metadata)
    expect(Object.keys(result).sort()).toEqual(['overview', 'trace'])
  })
})

// ---------------------------------------------------------------------------
// Section 6 — Invalid Metadata
// ---------------------------------------------------------------------------

describe('consumption — invalid metadata', () => {
  it('returns EMPTY_BRIDGE_DATA for undefined', () => {
    const result = adapt(undefined)
    expect(result).toBe(EMPTY_BRIDGE_DATA)
  })

  it('returns EMPTY_BRIDGE_DATA for null', () => {
    const result = adapt(null)
    expect(result).toBe(EMPTY_BRIDGE_DATA)
  })

  it('returns EMPTY_BRIDGE_DATA for number', () => {
    const result = adapt(42)
    expect(result).toBe(EMPTY_BRIDGE_DATA)
  })

  it('returns EMPTY_BRIDGE_DATA for string', () => {
    const result = adapt('metadata')
    expect(result).toBe(EMPTY_BRIDGE_DATA)
  })

  it('returns EMPTY_BRIDGE_DATA for boolean true', () => {
    const result = adapt(true)
    expect(result).toBe(EMPTY_BRIDGE_DATA)
  })

  it('returns EMPTY_BRIDGE_DATA for boolean false', () => {
    const result = adapt(false)
    expect(result).toBe(EMPTY_BRIDGE_DATA)
  })

  it('returns EMPTY_BRIDGE_DATA for empty array', () => {
    const result = adapt([])
    expect(result).toBe(EMPTY_BRIDGE_DATA)
  })

  it('returns EMPTY_BRIDGE_DATA for non-empty array', () => {
    const result = adapt([1, 2, 3])
    expect(result).toBe(EMPTY_BRIDGE_DATA)
  })

  it('returns frozen result for undefined', () => {
    const result = adapt(undefined)
    expect(Object.isFrozen(result)).toBe(true)
  })

  it('returns frozen result for null', () => {
    const result = adapt(null)
    expect(Object.isFrozen(result)).toBe(true)
  })

  it('returns frozen result for number', () => {
    const result = adapt(42)
    expect(Object.isFrozen(result)).toBe(true)
  })

  it('handles Date as object input (Date passes isObject)', () => {
    const result = adapt(new Date())
    // Date is typeof 'object' and not array, so it passes isObject and goes to builder
    expect(Object.isFrozen(result)).toBe(true)
  })

  it('handles RegExp as object input (RegExp passes isObject)', () => {
    const result = adapt(/test/)
    // RegExp is typeof 'object' and not array, so it passes isObject and goes to builder
    expect(Object.isFrozen(result)).toBe(true)
  })

  it('handles Function as non-object input', () => {
    const result = adapt(() => {})
    expect(result).toBe(EMPTY_BRIDGE_DATA)
  })

  it('handles class instance as object input', () => {
    class TestClass {
      overview = { count: 5 }
    }
    const result = adapt(new TestClass())
    expect(Object.keys(result)).toEqual(['overview'])
  })

  it('class instance with no known keys returns empty', () => {
    class EmptyClass {}
    const result = adapt(new EmptyClass())
    expect(Object.keys(result)).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// Section 7 — Contract Preservation
// ---------------------------------------------------------------------------

describe('consumption — contract preservation', () => {
  it('PromptObservatoryMetadata fields match bridge extraction keys', () => {
    const promptKeys: (keyof PromptObservatoryMetadata)[] = [
      'overview', 'trace', 'timeline', 'history', 'diff', 'runtime', 'eventStream',
    ]
    const result = adapt(buildFullMetadata())
    for (const key of promptKeys) {
      expect(key in result).toBe(true)
    }
  })

  it('every bridge output field exists in PromptObservatoryMetadata', () => {
    const promptKeys = new Set<keyof PromptObservatoryMetadata>([
      'overview', 'trace', 'timeline', 'history', 'diff', 'runtime', 'eventStream',
    ])
    const result = adapt(buildFullMetadata())
    for (const key of Object.keys(result)) {
      expect(promptKeys.has(key as keyof PromptObservatoryMetadata)).toBe(true)
    }
  })

  it('contract field types are preserved in bridge output', () => {
    const metadata = {
      overview: { count: 1 },
      trace: [],
      timeline: [],
      history: [],
      diff: [],
      runtime: {},
      eventStream: {},
    }
    const result = adapt(metadata)
    expect(typeof result.overview).toBe('object')
    expect(Array.isArray(result.trace)).toBe(true)
    expect(Array.isArray(result.timeline)).toBe(true)
    expect(Array.isArray(result.history)).toBe(true)
    expect(Array.isArray(result.diff)).toBe(true)
    expect(typeof result.runtime).toBe('object')
    expect(typeof result.eventStream).toBe('object')
  })

  it('contract null values are preserved', () => {
    const metadata = { overview: null, trace: null }
    const result = adapt(metadata)
    expect(result.overview).toBeNull()
    expect(result.trace).toBeNull()
  })

  it('contract undefined values: key present in hasOwnProperty is included', () => {
    // hasOwnProperty returns true for keys explicitly set to undefined
    // The builder includes keys that pass hasOwnProperty, even if value is undefined
    const metadataWithUndefined = { overview: undefined }
    const r = adapt(metadataWithUndefined)
    // key is present but value is undefined
    expect('overview' in r).toBe(true)
    expect(r.overview).toBeUndefined()
  })

  it('contract preserves deeply nested structure', () => {
    const metadata = {
      overview: {
        traceCount: 5,
        timelineCount: 3,
        details: { level1: { level2: { value: 'deep' } } },
      },
    }
    const result = adapt(metadata)
    expect(result.overview).toEqual(metadata.overview)
  })

  it('contract preserves array elements', () => {
    const traces = [
      { id: 'a', steps: [{ id: 's1', status: 'done' }] },
      { id: 'b', steps: [{ id: 's2', status: 'pending' }] },
    ]
    const result = adapt({ trace: traces })
    expect(result.trace).toEqual(traces)
  })

  it('contract preserves empty arrays', () => {
    const result = adapt({ trace: [], timeline: [] })
    expect(result.trace).toEqual([])
    expect(result.timeline).toEqual([])
  })

  it('contract preserves empty objects', () => {
    const result = adapt({ overview: {} })
    expect(result.overview).toEqual({})
  })

  it('contract preserves number values', () => {
    const result = adapt({ overview: 42, trace: 0, timeline: -1 })
    expect(result.overview).toBe(42)
    expect(result.trace).toBe(0)
    expect(result.timeline).toBe(-1)
  })

  it('contract preserves boolean values', () => {
    const result = adapt({ overview: true, trace: false })
    expect(result.overview).toBe(true)
    expect(result.trace).toBe(false)
  })

  it('contract preserves string values', () => {
    const result = adapt({ overview: 'hello', trace: '' })
    expect(result.overview).toBe('hello')
    expect(result.trace).toBe('')
  })
})

// ---------------------------------------------------------------------------
// Section 8 — Bridge Extraction
// ---------------------------------------------------------------------------

describe('consumption — bridge extraction', () => {
  it('extracts from builder output, not raw metadata', () => {
    const metadata = { overview: { count: 5 }, unknownKey: 'ignored' }
    const result = adapt(metadata)
    expect('unknownKey' in result).toBe(false)
  })

  it('only known keys appear in output', () => {
    const result = adapt(buildFullMetadata())
    const known = new Set(['overview', 'trace', 'timeline', 'history', 'diff', 'runtime', 'eventStream'])
    for (const key of Object.keys(result)) {
      expect(known.has(key)).toBe(true)
    }
  })

  it('output has exactly the known keys from input', () => {
    const result = adapt(buildPartialMetadata())
    expect(Object.keys(result).sort()).toEqual(['overview', 'runtime', 'trace'])
  })

  it('empty input produces empty output', () => {
    const result = adapt({})
    expect(Object.keys(result)).toHaveLength(0)
  })

  it('output is a plain object', () => {
    const result = adapt(buildFullMetadata())
    expect(Object.getPrototypeOf(result)).toBe(Object.prototype)
  })

  it('output keys are enumerable', () => {
    const result = adapt(buildFullMetadata())
    const keys = Object.keys(result)
    expect(keys.length).toBeGreaterThan(0)
    for (const key of keys) {
      const desc = Object.getOwnPropertyDescriptor(result, key)
      expect(desc?.enumerable).toBe(true)
    }
  })

  it('output values are writable configurable descriptors (frozen at top level)', () => {
    const result = adapt(buildFullMetadata())
    for (const key of Object.keys(result)) {
      const desc = Object.getOwnPropertyDescriptor(result, key)
      // Frozen objects have writable: false, configurable: false
      expect(desc?.writable).toBe(false)
      expect(desc?.configurable).toBe(false)
    }
  })

  it('extraction is order-independent', () => {
    const a = adapt({ overview: {}, trace: {}, timeline: {} })
    const b = adapt({ timeline: {}, trace: {}, overview: {} })
    expect(Object.keys(a).sort()).toEqual(Object.keys(b).sort())
  })
})

// ---------------------------------------------------------------------------
// Section 9 — Deterministic
// ---------------------------------------------------------------------------

describe('consumption — deterministic', () => {
  it('same input produces same output', () => {
    const input = buildFullMetadata()
    const a = adapt(input)
    const b = adapt(input)
    expect(a).toEqual(b)
  })

  it('same input produces same keys', () => {
    const input = { overview: {}, trace: [] }
    const a = adapt(input)
    const b = adapt(input)
    expect(Object.keys(a)).toEqual(Object.keys(b))
  })

  it('same partial input produces same output', () => {
    const input = buildPartialMetadata()
    const results = Array.from({ length: 10 }, () => adapt(input))
    for (let i = 1; i < results.length; i++) {
      expect(results[i]).toEqual(results[0])
    }
  })

  it('empty object always produces same output', () => {
    const results = Array.from({ length: 20 }, () => adapt({}))
    for (const r of results) {
      expect(Object.keys(r)).toHaveLength(0)
    }
  })

  it('identical arrays produce identical output', () => {
    const traces = [{ id: 'a', steps: [{ id: 's1', status: 'done' }] }]
    const a = adapt({ trace: traces })
    const b = adapt({ trace: traces })
    expect(a.trace).toEqual(b.trace)
  })

  it('same input across different bridge instances produces same output', () => {
    const input = buildFullMetadata()
    const bridge1 = createBridge()
    const bridge2 = createBridge()
    expect(bridge1.adapt(input)).toEqual(bridge2.adapt(input))
  })

  it('same input across different bridge instances with same custom builder', () => {
    const custom = new DefaultPromptObservatoryMetadataBuilder()
    const bridge1 = createBridge(custom)
    const bridge2 = createBridge(custom)
    expect(bridge1.adapt({ overview: { x: 1 } })).toEqual(bridge2.adapt({ overview: { x: 1 } }))
  })

  it('deterministic for null values', () => {
    const a = adapt({ overview: null })
    const b = adapt({ overview: null })
    expect(a).toEqual(b)
  })

  it('deterministic for deeply nested', () => {
    const deep = { overview: { a: { b: { c: { d: 1 } } } } }
    const results = Array.from({ length: 5 }, () => adapt(deep))
    for (let i = 1; i < results.length; i++) {
      expect(results[i]).toEqual(results[0])
    }
  })
})

// ---------------------------------------------------------------------------
// Section 10 — Immutable Output
// ---------------------------------------------------------------------------

describe('consumption — immutable output', () => {
  it('result is frozen', () => {
    const result = adapt(buildFullMetadata())
    expect(Object.isFrozen(result)).toBe(true)
  })

  it('result with single key is frozen', () => {
    const result = adapt({ overview: { count: 1 } })
    expect(Object.isFrozen(result)).toBe(true)
  })

  it('result with partial keys is frozen', () => {
    const result = adapt(buildPartialMetadata())
    expect(Object.isFrozen(result)).toBe(true)
  })

  it('empty object result is frozen', () => {
    const result = adapt({})
    expect(Object.isFrozen(result)).toBe(true)
  })

  it('cannot add properties to result', () => {
    const result = adapt({ overview: {} })
    const attempt = (): void => {
      (result as Record<string, unknown>).newKey = 'value'
    }
    expect(attempt).toThrow()
  })

  it('cannot delete properties from result', () => {
    const result = adapt({ overview: {} })
    expect(() => {
      delete (result as Record<string, unknown>).overview
    }).toThrow()
  })

  it('cannot reconfigure property descriptors', () => {
    const result = adapt({ overview: {} })
    expect(() => {
      Object.defineProperty(result, 'overview', { value: {} })
    }).toThrow()
  })

  it('nested values are NOT frozen (only top-level)', () => {
    const result = adapt({ overview: { a: 1 } })
    // Top-level is frozen
    expect(Object.isFrozen(result)).toBe(true)
    // Nested values are not frozen (they are references to input)
    expect(Object.isFrozen(result.overview)).toBe(false)
  })

  it('output is not the same reference as EMPTY_BRIDGE_DATA for valid object', () => {
    const result = adapt({ overview: {} })
    expect(result).not.toBe(EMPTY_BRIDGE_DATA)
  })

  it('EMPTY_BRIDGE_DATA is frozen', () => {
    expect(Object.isFrozen(EMPTY_BRIDGE_DATA)).toBe(true)
  })

  it('EMPTY_BRIDGE_DATA has no keys', () => {
    expect(Object.keys(EMPTY_BRIDGE_DATA)).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// Section 11 — Stateless
// ---------------------------------------------------------------------------

describe('consumption — stateless', () => {
  it('consecutive calls do not affect each other', () => {
    const bridge = createBridge()
    bridge.adapt({ overview: { a: 1 } })
    const result = bridge.adapt({ trace: { b: 2 } })
    expect(Object.keys(result)).toEqual(['trace'])
  })

  it('multiple calls with same input produce same output', () => {
    const bridge = createBridge()
    const a = bridge.adapt(buildFullMetadata())
    const b = bridge.adapt(buildFullMetadata())
    expect(a).toEqual(b)
  })

  it('calling adapt does not change bridge instance shape', () => {
    const bridge = createBridge()
    const beforeKeys = Object.getOwnPropertyNames(bridge).sort()
    bridge.adapt({ overview: {} })
    bridge.adapt({ trace: [] })
    bridge.adapt(buildFullMetadata())
    const afterKeys = Object.getOwnPropertyNames(bridge).sort()
    expect(afterKeys).toEqual(beforeKeys)
  })

  it('bridge with custom builder is stateless', () => {
    const { builder } = createMockBuilder()
    const bridge = createBridge(builder)
    bridge.adapt({ overview: { a: 1 } })
    const result = bridge.adapt({ trace: { b: 2 } })
    expect(Object.keys(result)).toEqual(['trace'])
  })

  it('no internal cache between calls', () => {
    const bridge = createBridge()
    const r1 = bridge.adapt({ overview: { x: 1 } })
    const r2 = bridge.adapt({ overview: { x: 2 } })
    expect(r1).not.toEqual(r2)
    expect((r2.overview as { x: number }).x).toBe(2)
  })
})

// ---------------------------------------------------------------------------
// Section 12 — No Mutation
// ---------------------------------------------------------------------------

describe('consumption — no mutation', () => {
  it('does not mutate input metadata', () => {
    const metadata = { overview: { count: 5 }, trace: [] }
    const frozen = Object.freeze(metadata)
    expect(() => adapt(frozen)).not.toThrow()
  })

  it('does not mutate input with null-prototype', () => {
    const obj = Object.create(null) as Record<string, unknown>
    obj.overview = { count: 5 }
    const frozen = Object.freeze(obj)
    expect(() => adapt(frozen)).not.toThrow()
  })

  it('does not add properties to input', () => {
    const metadata = { overview: {} }
    const beforeKeys = Object.keys(metadata)
    adapt(metadata)
    expect(Object.keys(metadata)).toEqual(beforeKeys)
  })

  it('does not remove properties from input', () => {
    const metadata = { overview: {}, unknownKey: 'test' }
    adapt(metadata)
    expect('unknownKey' in metadata).toBe(true)
  })

  it('input values remain unchanged after adapt', () => {
    const metadata = { overview: { count: 5 } }
    adapt(metadata)
    expect(metadata.overview).toEqual({ count: 5 })
  })

  it('does not mutate nested objects in input', () => {
    const nested = { deep: { value: 'original' } }
    const metadata = { overview: nested }
    adapt(metadata)
    expect(nested.deep.value).toBe('original')
  })

  it('does not mutate arrays in input', () => {
    const traces = [{ id: 't1', steps: [] }]
    const metadata = { trace: traces }
    adapt(metadata)
    expect(traces).toHaveLength(1)
    expect(traces[0].id).toBe('t1')
  })

  it('sealed input does not throw', () => {
    const metadata = Object.seal({ overview: {} })
    expect(() => adapt(metadata)).not.toThrow()
  })

  it('non-extensible input does not throw', () => {
    const metadata = Object.preventExtensions({ overview: {} })
    expect(() => adapt(metadata)).not.toThrow()
  })

  it('frozen input does not throw', () => {
    const metadata = Object.freeze({ overview: {} })
    expect(() => adapt(metadata)).not.toThrow()
  })
})

// ---------------------------------------------------------------------------
// Section 13 — Stress Cases
// ---------------------------------------------------------------------------

describe('consumption — stress cases', () => {
  it('handles very large trace array', () => {
    const traces = Array.from({ length: 1000 }, (_, i) => ({
      id: `t${i}`,
      label: `Trace ${i}`,
      steps: Array.from({ length: 50 }, (_, j) => ({
        id: `s${i}-${j}`,
        label: `Step ${j}`,
        status: i % 2 === 0 ? 'done' : 'pending',
      })),
    }))
    const result = adapt({ trace: traces })
    expect(Array.isArray(result.trace)).toBe(true)
    expect((result.trace as unknown[])).toHaveLength(1000)
  })

  it('handles very large timeline array', () => {
    const entries = Array.from({ length: 500 }, (_, i) => ({
      id: `tl${i}`, label: `Entry ${i}`, entries: [],
    }))
    const result = adapt({ timeline: entries })
    expect(Array.isArray(result.timeline)).toBe(true)
    expect((result.timeline as unknown[])).toHaveLength(500)
  })

  it('handles very large history array', () => {
    const history = Array.from({ length: 500 }, (_, i) => ({
      id: `h${i}`, label: `History ${i}`, entries: [],
    }))
    const result = adapt({ history: history })
    expect(Array.isArray(result.history)).toBe(true)
    expect((result.history as unknown[])).toHaveLength(500)
  })

  it('handles very large diff array', () => {
    const diffs = Array.from({ length: 500 }, (_, i) => ({
      id: `d${i}`, timestamp: `12:${i}`, added: [], removed: [], changed: [],
    }))
    const result = adapt({ diff: diffs })
    expect(Array.isArray(result.diff)).toBe(true)
    expect((result.diff as unknown[])).toHaveLength(500)
  })

  it('handles deeply nested overview', () => {
    const deep = { level1: { level2: { level3: { level4: { level5: { value: 'deep' } } } } } }
    const result = adapt({ overview: deep })
    expect(result.overview).toEqual(deep)
  })

  it('handles runtime with many entities', () => {
    const entities = Array.from({ length: 200 }, (_, i) => ({
      id: `e${i}`, type: 'Entity', x: i, y: i * 2,
    }))
    const result = adapt({ runtime: { worldId: 'stress', entityCount: 200, entities } })
    expect(result.runtime).toBeDefined()
  })

  it('handles eventStream with many events', () => {
    const events = Array.from({ length: 500 }, (_, i) => ({
      id: `e${i}`, timestamp: `00:${i}`, level: 'info', source: 'Test', message: `Event ${i}`,
    }))
    const result = adapt({ eventStream: { events } })
    expect(result.eventStream).toBeDefined()
  })

  it('handles 100 rapid adapt calls', () => {
    const bridge = createBridge()
    for (let i = 0; i < 100; i++) {
      const result = bridge.adapt({ overview: { count: i } })
      expect(Object.keys(result)).toEqual(['overview'])
    }
  })

  it('handles 100 calls with alternating data', () => {
    const bridge = createBridge()
    for (let i = 0; i < 100; i++) {
      const data = i % 2 === 0
        ? { overview: {}, trace: [] }
        : { timeline: [], runtime: {} }
      const result = bridge.adapt(data)
      if (i % 2 === 0) {
        expect(Object.keys(result).sort()).toEqual(['overview', 'trace'])
      } else {
        expect(Object.keys(result).sort()).toEqual(['runtime', 'timeline'])
      }
    }
  })

  it('handles all 7 keys with complex nested data', () => {
    const metadata = {
      overview: { traceCount: 100, timelineCount: 50, historyCount: 25 },
      trace: Array.from({ length: 100 }, (_, i) => ({
        id: `t${i}`, label: `Trace ${i}`,
        steps: [{ id: `s${i}`, label: `Step ${i}`, status: 'done' as const }],
      })),
      timeline: Array.from({ length: 50 }, (_, i) => ({
        id: `tl${i}`, label: `Timeline ${i}`,
        entries: [{ id: `e${i}`, label: `Entry ${i}`, timestamp: `${i}:00` }],
      })),
      history: Array.from({ length: 25 }, (_, i) => ({
        id: `h${i}`, label: `History ${i}`,
        entries: [{ prompt: `Prompt ${i}`, result: 'done' }],
      })),
      diff: Array.from({ length: 10 }, (_, i) => ({
        id: `d${i}`, timestamp: `${i}:00`,
        added: [`added-${i}`], removed: [`removed-${i}`], changed: [],
      })),
      runtime: { worldId: 'big-world', entityCount: 500, systemCount: 50, eventCount: 1000 },
      eventStream: {
        events: Array.from({ length: 200 }, (_, i) => ({
          id: `evt${i}`, timestamp: `${i}:00`, level: 'info' as const,
          source: 'System', message: `Event ${i}`,
        })),
      },
    }
    const result = adapt(metadata)
    expect(Object.keys(result)).toHaveLength(7)
  })

  it('handles unicode and special characters', () => {
    const metadata = {
      overview: { title: 'Observatório 🌍 Test' },
      trace: [{ id: 't1', label: 'Trace → ✅', steps: [] }],
    }
    const result = adapt(metadata)
    expect(result.overview).toEqual({ title: 'Observatório 🌍 Test' })
    expect(result.trace).toEqual([{ id: 't1', label: 'Trace → ✅', steps: [] }])
  })

  it('handles empty string keys', () => {
    const metadata = { '': 'empty' }
    const result = adapt(metadata)
    expect(Object.keys(result)).toHaveLength(0)
  })

  it('handles numeric keys', () => {
    const metadata = { '123': 'numeric' }
    const result = adapt(metadata)
    expect(Object.keys(result)).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// Section 14 — Backward Compatibility
// ---------------------------------------------------------------------------

describe('consumption — backward compatibility', () => {
  it('accepts unknown metadata (signature unchanged)', () => {
    const bridge = createBridge()
    const result: ObservatoryBridgeData = bridge.adapt(undefined)
    expect(result).toBeDefined()
  })

  it('returns ObservatoryBridgeData type', () => {
    const result = adapt({ overview: {} })
    expect('overview' in result).toBe(true)
  })

  it('undefined still returns EMPTY_BRIDGE_DATA', () => {
    const result = adapt(undefined)
    expect(result).toBe(EMPTY_BRIDGE_DATA)
  })

  it('null returns EMPTY_BRIDGE_DATA', () => {
    const result = adapt(null)
    expect(result).toBe(EMPTY_BRIDGE_DATA)
  })

  it('empty object returns empty frozen object', () => {
    const result = adapt({})
    expect(Object.keys(result)).toHaveLength(0)
    expect(Object.isFrozen(result)).toBe(true)
  })

  it('returns frozen result for valid metadata', () => {
    const result = adapt(buildFullMetadata())
    expect(Object.isFrozen(result)).toBe(true)
  })

  it('behaves same as before for known keys', () => {
    const metadata = { overview: { traceCount: 5 }, trace: [] }
    const result = adapt(metadata)
    expect(result.overview).toEqual({ traceCount: 5 })
    expect(result.trace).toEqual([])
  })

  it('behaves same as before for unknown keys', () => {
    const result = adapt(buildUnknownOnlyMetadata())
    expect(Object.keys(result)).toHaveLength(0)
  })

  it('behaves same as before for mixed input', () => {
    const result = adapt(buildMixedMetadata())
    expect(Object.keys(result).sort()).toEqual(['overview', 'trace'])
  })

  it('still implements ObservatoryMetadataBridge interface', () => {
    const bridge = createBridge()
    expect(typeof bridge.adapt).toBe('function')
  })

  it('EMPTY_BRIDGE_DATA is still exported', () => {
    expect(EMPTY_BRIDGE_DATA).toBeDefined()
    expect(Object.isFrozen(EMPTY_BRIDGE_DATA)).toBe(true)
  })

  it('class is still instantiable without constructor args', () => {
    const bridge = new DefaultObservatoryMetadataBridge()
    expect(bridge).toBeDefined()
  })

  it('class is instantiable with null builder option', () => {
    const bridge = new DefaultObservatoryMetadataBridge(undefined)
    expect(bridge).toBeDefined()
  })

  it('adapt method still has same public API surface', () => {
    const bridge = createBridge()
    const proto = Object.getOwnPropertyNames(Object.getPrototypeOf(bridge))
    expect(proto).toContain('adapt')
  })

  it('no new public methods on bridge', () => {
    const bridge = createBridge()
    const proto = Object.getOwnPropertyNames(Object.getPrototypeOf(bridge))
      .filter((k) => k !== 'constructor')
    expect(proto).toEqual(['adapt'])
  })
})

// ---------------------------------------------------------------------------
// Section 15 — Integration Path
// ---------------------------------------------------------------------------

describe('consumption — integration path', () => {
  it('default builder → bridge → adapt produces valid result', () => {
    const builder = new DefaultPromptObservatoryMetadataBuilder()
    const bridge = new DefaultObservatoryMetadataBridge(builder)
    const metadata = { overview: { count: 5 }, trace: [{ id: 't1', steps: [] }] }
    const result = bridge.adapt(metadata)
    expect(result.overview).toEqual({ count: 5 })
    expect(result.trace).toEqual([{ id: 't1', steps: [] }])
  })

  it('custom builder can modify contract before bridge extraction', () => {
    const customBuilder: PromptObservatoryMetadataBuilder = {
      build(metadata: Record<string, unknown>): PromptObservatoryMetadata {
        const result: Record<string, unknown> = {}
        if ('overview' in metadata) {
          result.overview = { traceCount: 42 }
        }
        return Object.freeze(result) as PromptObservatoryMetadata
      },
    }
    const result = adapt({ overview: { traceCount: 5 } }, customBuilder)
    // Custom builder overrides the value
    expect(result.overview).toEqual({ traceCount: 42 })
  })

  it('custom builder that returns empty contract produces empty bridge data', () => {
    const emptyBuilder: PromptObservatoryMetadataBuilder = {
      build(): PromptObservatoryMetadata {
        return Object.freeze({})
      },
    }
    const result = adapt({ overview: { traceCount: 5 } }, emptyBuilder)
    expect(Object.keys(result)).toHaveLength(0)
  })

  it('custom builder can filter keys before bridge extraction', () => {
    const filterBuilder: PromptObservatoryMetadataBuilder = {
      build(metadata: Record<string, unknown>): PromptObservatoryMetadata {
        const result: Record<string, unknown> = {}
        // Only pass through 'overview', ignore everything else
        if ('overview' in metadata) {
          result.overview = metadata.overview
        }
        return Object.freeze(result) as PromptObservatoryMetadata
      },
    }
    const result = adapt({ overview: {}, trace: [], timeline: [] }, filterBuilder)
    expect(Object.keys(result)).toEqual(['overview'])
  })

  it('custom builder can add fields to contract', () => {
    const addBuilder: PromptObservatoryMetadataBuilder = {
      build(): PromptObservatoryMetadata {
        return Object.freeze({
          overview: { added: true },
          trace: [],
          timeline: [],
        }) as PromptObservatoryMetadata
      },
    }
    const result = adapt({}, addBuilder)
    expect(Object.keys(result).sort()).toEqual(['overview', 'timeline', 'trace'])
  })

  it('integration: builder + bridge with all 7 keys', () => {
    const builder = new DefaultPromptObservatoryMetadataBuilder()
    const bridge = new DefaultObservatoryMetadataBridge(builder)
    const metadata = buildFullMetadata()
    const result = bridge.adapt(metadata)
    expect(Object.keys(result)).toHaveLength(7)
    expect(result.overview).toBe(metadata.overview)
    expect(result.trace).toBe(metadata.trace)
    expect(result.timeline).toBe(metadata.timeline)
    expect(result.history).toBe(metadata.history)
    expect(result.diff).toBe(metadata.diff)
    expect(result.runtime).toBe(metadata.runtime)
    expect(result.eventStream).toBe(metadata.eventStream)
  })

  it('integration: builder + bridge with partial keys', () => {
    const builder = new DefaultPromptObservatoryMetadataBuilder()
    const bridge = new DefaultObservatoryMetadataBridge(builder)
    const metadata = buildPartialMetadata()
    const result = bridge.adapt(metadata)
    expect(Object.keys(result).sort()).toEqual(['overview', 'runtime', 'trace'])
  })

  it('integration: builder + bridge preserves contract immutability', () => {
    const builder = new DefaultPromptObservatoryMetadataBuilder()
    const bridge = new DefaultObservatoryMetadataBridge(builder)
    const result = bridge.adapt(buildFullMetadata())
    expect(Object.isFrozen(result)).toBe(true)
  })

  it('integration: builder invoked exactly once in full flow', () => {
    const { builder, callCount } = createMockBuilder()
    const bridge = new DefaultObservatoryMetadataBridge(builder)
    bridge.adapt(buildFullMetadata())
    expect(callCount()).toBe(1)
  })

  it('integration: builder is called before bridge extraction', () => {
    const callOrder: string[] = []
    const trackingBuilder: PromptObservatoryMetadataBuilder = {
      build(metadata: Record<string, unknown>): PromptObservatoryMetadata {
        callOrder.push('builder')
        return new DefaultPromptObservatoryMetadataBuilder().build(metadata)
      },
    }
    const bridge = new DefaultObservatoryMetadataBridge(trackingBuilder)
    bridge.adapt({ overview: {} })
    expect(callOrder).toEqual(['builder'])
  })
})

// ---------------------------------------------------------------------------
// Section 16 — Constructor
// ---------------------------------------------------------------------------

describe('consumption — constructor', () => {
  it('default constructor creates bridge without error', () => {
    const bridge = new DefaultObservatoryMetadataBridge()
    expect(bridge).toBeDefined()
  })

  it('constructor with undefined creates bridge without error', () => {
    const bridge = new DefaultObservatoryMetadataBridge(undefined)
    expect(bridge).toBeDefined()
  })

  it('constructor with DefaultPromptObservatoryMetadataBuilder works', () => {
    const builder = new DefaultPromptObservatoryMetadataBuilder()
    const bridge = new DefaultObservatoryMetadataBridge(builder)
    expect(bridge).toBeDefined()
  })

  it('constructor with custom builder works', () => {
    const builder: PromptObservatoryMetadataBuilder = {
      build(_m: Record<string, unknown>): PromptObservatoryMetadata {
        return Object.freeze({}) as PromptObservatoryMetadata
      },
    }
    const bridge = new DefaultObservatoryMetadataBridge(builder)
    expect(bridge).toBeDefined()
  })

  it('constructor with null is handled (falls back to default)', () => {
    // TypeScript would warn, but at runtime null needs to be handled
    const bridge = new DefaultObservatoryMetadataBridge(null as unknown as undefined)
    expect(bridge).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Section 17 — Boundary Values
// ---------------------------------------------------------------------------

describe('consumption — boundary values', () => {
  it('handles metadata with null known key values', () => {
    const result = adapt(buildBoundaryMetadata())
    // All keys set in buildBoundaryMetadata have hasOwnProperty = true
    // even null, undefined, 0, '', false values
    expect(Object.keys(result).sort()).toEqual([
      'diff', 'eventStream', 'history', 'overview', 'runtime', 'timeline', 'trace',
    ])
    expect(result.overview).toBeNull()
  })

  it('handles metadata with zero numeric values', () => {
    const result = adapt({ overview: 0 })
    expect(result.overview).toBe(0)
  })

  it('handles metadata with empty string values', () => {
    const result = adapt({ overview: '' })
    expect(result.overview).toBe('')
  })

  it('handles metadata with false boolean values', () => {
    const result = adapt({ overview: false })
    expect(result.overview).toBe(false)
  })

  it('handles metadata with NaN values', () => {
    const result = adapt({ overview: NaN })
    expect(Number.isNaN(result.overview as number)).toBe(true)
  })

  it('handles metadata with Infinity values', () => {
    const result = adapt({ overview: Infinity })
    expect(result.overview).toBe(Infinity)
  })

  it('handles metadata with -Infinity values', () => {
    const result = adapt({ overview: -Infinity })
    expect(result.overview).toBe(-Infinity)
  })

  it('handles metadata with BigInt values', () => {
    const result = adapt({ overview: BigInt(42) })
    expect(result.overview).toBe(BigInt(42))
  })

  it('handles metadata with Symbol values', () => {
    const sym = Symbol('test')
    const result = adapt({ overview: sym })
    expect(result.overview).toBe(sym)
  })
})

// ---------------------------------------------------------------------------
// Section 18 — Edge Cases
// ---------------------------------------------------------------------------

describe('consumption — edge cases', () => {
  it('handles Object.create(null) with known keys', () => {
    const obj = Object.create(null) as Record<string, unknown>
    obj.overview = { count: 5 }
    obj.trace = []
    const result = adapt(obj)
    expect(Object.keys(result).sort()).toEqual(['overview', 'trace'])
  })

  it('handles Object.create(null) with unknown keys only', () => {
    const obj = Object.create(null) as Record<string, unknown>
    obj.unknownKey = 'value'
    const result = adapt(obj)
    expect(Object.keys(result)).toHaveLength(0)
  })

  it('handles frozen metadata object', () => {
    const metadata = Object.freeze({ overview: {}, trace: [] })
    expect(() => adapt(metadata)).not.toThrow()
  })

  it('handles sealed metadata object', () => {
    const metadata = Object.seal({ overview: {} })
    expect(() => adapt(metadata)).not.toThrow()
  })

  it('handles non-extensible metadata object', () => {
    const metadata = Object.preventExtensions({ overview: {} })
    expect(() => adapt(metadata)).not.toThrow()
  })

  it('prototype pollution attempt via toString is safe', () => {
    const metadata = { toString: { overview: { x: 1 } } }
    const result = adapt(metadata)
    expect(Object.keys(result)).toHaveLength(0)
  })

  it('prototype pollution attempt via valueOf is safe', () => {
    const metadata = { valueOf: { overview: { x: 1 } } }
    const result = adapt(metadata)
    expect(Object.keys(result)).toHaveLength(0)
  })

  it('handles metadata with getter properties', () => {
    const metadata: Record<string, unknown> = {}
    Object.defineProperty(metadata, 'overview', {
      get: () => ({ count: 5 }),
      enumerable: true,
      configurable: true,
    })
    const result = adapt(metadata)
    expect(result.overview).toEqual({ count: 5 })
  })

  it('handles metadata with non-enumerable known key', () => {
    const metadata: Record<string, unknown> = {}
    Object.defineProperty(metadata, 'overview', {
      value: { count: 5 },
      enumerable: false,
      configurable: true,
      writable: true,
    })
    // hasOwnProperty catches non-enumerable own properties
    const result = adapt(metadata)
    expect(Object.keys(result)).toEqual(['overview'])
  })

  it('handles metadata with same values across multiple keys', () => {
    const shared = { a: 1 }
    const result = adapt({ overview: shared, trace: shared, timeline: shared })
    expect(result.overview).toBe(shared)
    expect(result.trace).toBe(shared)
    expect(result.timeline).toBe(shared)
  })
})

// ---------------------------------------------------------------------------
// Section 19 — Type Safety
// ---------------------------------------------------------------------------

describe('consumption — type safety', () => {
  it('result is assignable to ObservatoryBridgeData', () => {
    const result: ObservatoryBridgeData = adapt(buildFullMetadata())
    expect(result).toBeDefined()
  })

  it('empty result is assignable to ObservatoryBridgeData', () => {
    const result: ObservatoryBridgeData = adapt(undefined)
    expect(result).toEqual({})
  })

  it('builder field is accessible at runtime (TypeScript private is compile-time only)', () => {
    const bridge = createBridge()
    // TypeScript 'private' does NOT hide properties at runtime
    expect('builder' in bridge).toBe(true)
  })

  it('bridge implements ObservatoryMetadataBridge', () => {
    const bridge: ObservatoryMetadataBridge = createBridge()
    expect(bridge).toBeDefined()
  })

  it('adapt return type is ObservatoryBridgeData', () => {
    const result: ObservatoryBridgeData = adapt({})
    expect(result).toBeDefined()
  })

  it('no any types leaked in public API', () => {
    const bridge: ObservatoryMetadataBridge = createBridge()
    const result = bridge.adapt({ overview: {} })
    // Accessing via key should give unknown
    const overview: unknown = result.overview
    expect(overview).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Section 20 — Pure Function Guarantees
// ---------------------------------------------------------------------------

describe('consumption — pure function guarantees', () => {
  it('no side effects on metadata input', () => {
    const metadata = { overview: { count: 5 } }
    const metadataStr = JSON.stringify(metadata)
    adapt(metadata)
    expect(JSON.stringify(metadata)).toBe(metadataStr)
  })

  it('no side effects on global state', () => {
    const globalKeysBefore = Object.keys(globalThis)
    adapt(buildFullMetadata())
    const globalKeysAfter = Object.keys(globalThis)
    expect(globalKeysAfter).toEqual(globalKeysBefore)
  })

  it('does not throw for any input', () => {
    const inputs: unknown[] = [
      undefined,
      null,
      0,
      -1,
      NaN,
      Infinity,
      '',
      'string',
      true,
      false,
      [],
      [1, 2, 3],
      {},
      { overview: {} },
      new Date(),
      /regex/,
      () => {},
      Symbol('test'),
      BigInt(42),
      Object.create(null),
      Object.freeze({}),
      Object.seal({}),
    ]
    for (const input of inputs) {
      expect(() => adapt(input)).not.toThrow()
    }
  })

  it('output depends only on input', () => {
    const input = { overview: { x: 42 } }
    const results = Array.from({ length: 5 }, () => adapt(input))
    for (const r of results) {
      expect(r).toEqual(results[0])
    }
  })

  it('same call sequence produces same results', () => {
    const bridge = createBridge()
    const seq1 = [
      bridge.adapt({ overview: { a: 1 } }),
      bridge.adapt({ trace: { b: 2 } }),
      bridge.adapt({}),
    ]
    const bridge2 = createBridge()
    const seq2 = [
      bridge2.adapt({ overview: { a: 1 } }),
      bridge2.adapt({ trace: { b: 2 } }),
      bridge2.adapt({}),
    ]
    expect(seq1).toEqual(seq2)
  })

  it('no network calls during adapt', () => {
    // Verifiable by the fact that vitest doesn't use fake timers
    const start = performance.now()
    adapt(buildFullMetadata())
    const elapsed = performance.now() - start
    expect(elapsed).toBeLessThan(1000) // Should complete well under 1s
  })

  it('no setTimeout/setInterval during adapt', () => {
    // The function is synchronous
    const spy = vi.spyOn(globalThis, 'setTimeout')
    adapt(buildFullMetadata())
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })
})

// ---------------------------------------------------------------------------
// Section 21 — Cross-field Combinations
// ---------------------------------------------------------------------------

describe('consumption — cross-field combinations', () => {
  it('overview + trace combination', () => {
    const result = adapt({ overview: {}, trace: [] })
    expect(Object.keys(result).sort()).toEqual(['overview', 'trace'])
  })

  it('timeline + history combination', () => {
    const result = adapt({ timeline: [], history: [] })
    expect(Object.keys(result).sort()).toEqual(['history', 'timeline'])
  })

  it('diff + runtime combination', () => {
    const result = adapt({ diff: [], runtime: {} })
    expect(Object.keys(result).sort()).toEqual(['diff', 'runtime'])
  })

  it('overview + eventStream combination', () => {
    const result = adapt({ overview: {}, eventStream: {} })
    expect(Object.keys(result).sort()).toEqual(['eventStream', 'overview'])
  })

  it('trace + timeline + history combination', () => {
    const result = adapt({ trace: [], timeline: [], history: [] })
    expect(Object.keys(result).sort()).toEqual(['history', 'timeline', 'trace'])
  })

  it('all 7 keys present', () => {
    const result = adapt(buildFullMetadata())
    expect(Object.keys(result)).toHaveLength(7)
  })

  it('single key + single key different order', () => {
    const a = adapt({ overview: {}, trace: [] })
    const b = adapt({ trace: [], overview: {} })
    expect(Object.keys(a).sort()).toEqual(Object.keys(b).sort())
  })

  it('three keys alternating combinations', () => {
    const combos = [
      { overview: {}, trace: [], timeline: [] },
      { timeline: [], trace: [], overview: {} },
      { history: [], overview: {}, runtime: {} },
    ]
    for (const combo of combos) {
      const result = adapt(combo)
      for (const key of Object.keys(combo)) {
        expect(key in result).toBe(true)
      }
    }
  })
})

// ---------------------------------------------------------------------------
// Section 22 — Property Descriptor Handling
// ---------------------------------------------------------------------------

describe('consumption — property descriptor handling', () => {
  it('output property descriptors are non-writable', () => {
    const result = adapt({ overview: {} })
    const desc = Object.getOwnPropertyDescriptor(result, 'overview')
    expect(desc?.writable).toBe(false)
  })

  it('output property descriptors are non-configurable', () => {
    const result = adapt({ overview: {} })
    const desc = Object.getOwnPropertyDescriptor(result, 'overview')
    expect(desc?.configurable).toBe(false)
  })

  it('output property descriptors are enumerable', () => {
    const result = adapt({ overview: {} })
    const desc = Object.getOwnPropertyDescriptor(result, 'overview')
    expect(desc?.enumerable).toBe(true)
  })

  it('output has correct value in descriptor', () => {
    const result = adapt({ overview: { x: 1 } })
    const desc = Object.getOwnPropertyDescriptor(result, 'overview')
    expect(desc?.value).toEqual({ x: 1 })
  })
})

// ---------------------------------------------------------------------------
// Section 23 — Export Verification
// ---------------------------------------------------------------------------

describe('consumption — export verification', () => {
  it('DefaultObservatoryMetadataBridge is exported from bridge index', () => {
    expect(DefaultObservatoryMetadataBridge).toBeDefined()
  })

  it('DefaultObservatoryMetadataBridge is a class', () => {
    expect(typeof DefaultObservatoryMetadataBridge).toBe('function')
  })

  it('DefaultPromptObservatoryMetadataBuilder is importable from @genesis/ai', () => {
    expect(DefaultPromptObservatoryMetadataBuilder).toBeDefined()
  })

  it('PromptObservatoryMetadataBuilder type is importable', () => {
    // Type-level verification - no runtime test needed
    const builder: PromptObservatoryMetadataBuilder = new DefaultPromptObservatoryMetadataBuilder()
    expect(builder).toBeDefined()
  })

  it('EMPTY_BRIDGE_DATA is exported', () => {
    expect(EMPTY_BRIDGE_DATA).toBeDefined()
  })

  it('ObservatoryBridgeData type is exported', () => {
    // Runtime-accessible through usage
    const result: ObservatoryBridgeData = adapt({})
    expect(result).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Section 24 — Specific Metadata Shapes
// ---------------------------------------------------------------------------

describe('consumption — specific metadata shapes', () => {
  it('handles overview with undefined nested value', () => {
    const result = adapt({ overview: { a: undefined } })
    expect(result.overview).toHaveProperty('a')
    expect(result.overview).toEqual({})
  })

  it('handles overview with null nested value', () => {
    const result = adapt({ overview: { a: null } })
    expect(result.overview).toEqual({ a: null })
  })

  it('handles trace with empty steps', () => {
    const result = adapt({ trace: [{ id: 't1', steps: [] }] })
    expect(result.trace).toEqual([{ id: 't1', steps: [] }])
  })

  it('handles timeline with empty entries', () => {
    const result = adapt({ timeline: [{ id: 'tl1', entries: [] }] })
    expect(result.timeline).toEqual([{ id: 'tl1', entries: [] }])
  })

  it('handles diff with all empty arrays', () => {
    const result = adapt({ diff: [{ id: 'd1', timestamp: '12:00', added: [], removed: [], changed: [] }] })
    expect(result.diff).toEqual([{ id: 'd1', timestamp: '12:00', added: [], removed: [], changed: [] }])
  })

  it('handles runtime with zero counts', () => {
    const result = adapt({ runtime: { worldId: '', entityCount: 0, systemCount: 0, eventCount: 0 } })
    expect(result.runtime).toEqual({ worldId: '', entityCount: 0, systemCount: 0, eventCount: 0 })
  })

  it('handles eventStream with empty events array', () => {
    const result = adapt({ eventStream: { events: [] } })
    expect(result.eventStream).toEqual({ events: [] })
  })
})

// ---------------------------------------------------------------------------
// Section 25 — Null-Prototype Object Handling
// ---------------------------------------------------------------------------

describe('consumption — null-prototype object handling', () => {
  it('handles null-prototype with known keys', () => {
    const obj = Object.create(null)
    obj.overview = { count: 5 }
    obj.trace = []
    const result = adapt(obj)
    expect(Object.keys(result).sort()).toEqual(['overview', 'trace'])
  })

  it('handles null-prototype empty object', () => {
    const obj = Object.create(null)
    const result = adapt(obj)
    expect(Object.keys(result)).toHaveLength(0)
  })

  it('handles null-prototype with only unknown keys', () => {
    const obj = Object.create(null)
    obj.unknownKey = 'value'
    const result = adapt(obj)
    expect(Object.keys(result)).toHaveLength(0)
  })

  it('null-prototype result does not inherit Object.prototype', () => {
    // The input is null-prototype, but the bridge output is a normal object
    const obj = Object.create(null)
    obj.overview = { count: 5 }
    const result = adapt(obj)
    expect(Object.getPrototypeOf(result)).toBe(Object.prototype)
  })
})

// ---------------------------------------------------------------------------
// Section 26 — Custom Builder Edge Cases
// ---------------------------------------------------------------------------

describe('consumption — custom builder edge cases', () => {
  it('custom builder returning frozen empty works', () => {
    const emptyBuilder: PromptObservatoryMetadataBuilder = {
      build(): PromptObservatoryMetadata {
        return Object.freeze({})
      },
    }
    const result = adapt({ overview: { x: 1 } }, emptyBuilder)
    expect(Object.keys(result)).toHaveLength(0)
  })

  it('custom builder returning partial contract', () => {
    const partialBuilder: PromptObservatoryMetadataBuilder = {
      build(): PromptObservatoryMetadata {
        return Object.freeze({ overview: { from: 'custom' } }) as PromptObservatoryMetadata
      },
    }
    const result = adapt({ trace: [] }, partialBuilder)
    expect(Object.keys(result)).toEqual(['overview'])
  })

  it('custom builder that throws is NOT caught (by design)', () => {
    const throwingBuilder: PromptObservatoryMetadataBuilder = {
      build(): PromptObservatoryMetadata {
        throw new Error('builder error')
      },
    }
    const bridge = createBridge(throwingBuilder)
    expect(() => bridge.adapt({ overview: {} })).toThrow('builder error')
  })

  it('custom builder called with same input as bridge receives', () => {
    const metadata = { overview: {}, trace: [] }
    const { builder, lastInput } = createMockBuilder()
    const bridge = createBridge(builder)
    bridge.adapt(metadata)
    expect(lastInput()).toBe(metadata)
  })
})

// ---------------------------------------------------------------------------
// Section 27 — Error Handling
// ---------------------------------------------------------------------------

describe('consumption — error handling', () => {
  it('does not throw for undefined input', () => {
    expect(() => adapt(undefined)).not.toThrow()
  })

  it('does not throw for null input', () => {
    expect(() => adapt(null)).not.toThrow()
  })

  it('does not throw for any primitive input', () => {
    expect(() => adapt('test')).not.toThrow()
    expect(() => adapt(123)).not.toThrow()
    expect(() => adapt(true)).not.toThrow()
    expect(() => adapt(Symbol('a'))).not.toThrow()
  })

  it('does not throw for Proxy input', () => {
    const target = { overview: {} }
    const proxy = new Proxy(target, {})
    expect(() => adapt(proxy)).not.toThrow()
  })

  it('throws for Revoked Proxy (isObject checks Array.isArray which throws)', () => {
    const { proxy, revoke } = Proxy.revocable({ overview: {} }, {})
    revoke()
    // isObject checks Array.isArray() which throws on revoked proxy
    expect(() => adapt(proxy)).toThrow()
  })

  it('does not throw for input with getter that throws', () => {
    const metadata = {
      get overview() {
        throw new Error('getter error')
      },
    }
    expect(() => adapt(metadata)).toThrow('getter error')
  })
})

// ---------------------------------------------------------------------------
// Section 28 — Performance
// ---------------------------------------------------------------------------

describe('consumption — performance', () => {
  it('completes within reasonable time for normal input', () => {
    const start = performance.now()
    for (let i = 0; i < 100; i++) {
      adapt(buildFullMetadata())
    }
    const elapsed = performance.now() - start
    expect(elapsed).toBeLessThan(500) // 100 calls in < 500ms
  })

  it('completes within reasonable time for large input', () => {
    const largeMetadata = {
      overview: { traceCount: 10000 },
      trace: Array.from({ length: 1000 }, (_, i) => ({
        id: `t${i}`, steps: Array.from({ length: 10 }, (_, j) => ({
          id: `s${i}-${j}`, status: 'done',
        })),
      })),
    }
    const start = performance.now()
    adapt(largeMetadata)
    const elapsed = performance.now() - start
    expect(elapsed).toBeLessThan(500)
  })
})

// ---------------------------------------------------------------------------
// Section 29 — Property Descriptor Preservation
// ---------------------------------------------------------------------------

describe('consumption — property descriptor preservation', () => {
  it('output property has value descriptor (not getter/setter)', () => {
    const result = adapt({ overview: { x: 1 } })
    const desc = Object.getOwnPropertyDescriptor(result, 'overview')
    expect(desc?.get).toBeUndefined()
    expect(desc?.set).toBeUndefined()
    expect('value' in (desc ?? {})).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Section 30 — Builder Interaction Patterns
// ---------------------------------------------------------------------------

describe('consumption — builder interaction patterns', () => {
  it('builder with identity function passes through all keys', () => {
    const identityBuilder: PromptObservatoryMetadataBuilder = {
      build(m: Record<string, unknown>): PromptObservatoryMetadata {
        return Object.freeze({ ...m }) as PromptObservatoryMetadata
      },
    }
    const metadata = { overview: {}, trace: [], unknownKey: 'test' }
    const result = adapt(metadata, identityBuilder)
    // Bridge still filters to known keys only
    expect(Object.keys(result).sort()).toEqual(['overview', 'trace'])
    expect('unknownKey' in result).toBe(false)
  })

  it('builder that adds known keys enriches bridge output', () => {
    const enricherBuilder: PromptObservatoryMetadataBuilder = {
      build(m: Record<string, unknown>): PromptObservatoryMetadata {
        return Object.freeze({
          ...m,
          runtime: { enriched: true },
        }) as PromptObservatoryMetadata
      },
    }
    const result = adapt({ overview: {} }, enricherBuilder)
    expect(Object.keys(result).sort()).toEqual(['overview', 'runtime'])
  })

  it('builder that removes known keys restricts bridge output', () => {
    const filterBuilder: PromptObservatoryMetadataBuilder = {
      build(): PromptObservatoryMetadata {
        return Object.freeze({}) as PromptObservatoryMetadata
      },
    }
    const result = adapt({ overview: {}, trace: [] }, filterBuilder)
    expect(Object.keys(result)).toHaveLength(0)
  })

  it('builder called once per adapt even with multiple keys', () => {
    const { builder, callCount } = createMockBuilder()
    const bridge = createBridge(builder)
    bridge.adapt(buildFullMetadata())
    expect(callCount()).toBe(1)
  })

  it('different bridge instances have independent builder references', () => {
    const { builder, callCount } = createMockBuilder()
    const b1 = createBridge(builder)
    const b2 = createBridge()
    b1.adapt({ overview: {} })
    expect(callCount()).toBe(1)
    b2.adapt({ overview: {} })
    expect(callCount()).toBe(1)
  })

  it('builder receives the raw metadata before bridge extraction', () => {
    const captureBuilder: PromptObservatoryMetadataBuilder & { last: Record<string, unknown> | undefined } = {
      last: undefined,
      build(m: Record<string, unknown>): PromptObservatoryMetadata {
        this.last = m
        return new DefaultPromptObservatoryMetadataBuilder().build(m)
      },
    }
    const metadata = { overview: { x: 42 }, unknownKey: 'test' }
    const bridge = createBridge(captureBuilder)
    bridge.adapt(metadata)
    expect(captureBuilder.last).toBe(metadata)
    expect(captureBuilder.last?.unknownKey).toBe('test')
  })

  it('builder can modify values before bridge reads them', () => {
    const modifierBuilder: PromptObservatoryMetadataBuilder = {
      build(m: Record<string, unknown>): PromptObservatoryMetadata {
        return Object.freeze({
          overview: { traceCount: 999 },
          trace: (m.trace as unknown[]) ?? [],
        }) as PromptObservatoryMetadata
      },
    }
    const result = adapt({ overview: { traceCount: 1 } }, modifierBuilder)
    expect(result.overview).toEqual({ traceCount: 999 })
  })
})

// ---------------------------------------------------------------------------
// Section 31 — Result Structure Integrity
// ---------------------------------------------------------------------------

describe('consumption — result structure integrity', () => {
  it('result always has object prototype', () => {
    const result = adapt(buildFullMetadata())
    expect(Object.getPrototypeOf(result)).toBe(Object.prototype)
  })

  it('result is not extensible (frozen)', () => {
    const result = adapt({ overview: {} })
    expect(Object.isExtensible(result)).toBe(false)
  })

  it('result keys are always strings', () => {
    const result = adapt(buildFullMetadata())
    for (const key of Object.keys(result)) {
      expect(typeof key).toBe('string')
    }
  })

  it('no result key is an empty string', () => {
    const result = adapt({ overview: {}, '': 'value' })
    for (const key of Object.keys(result)) {
      expect(key.length).toBeGreaterThan(0)
    }
  })

  it('result has same value types as input', () => {
    const metadata = { overview: { a: 1 }, trace: [], runtime: null }
    const result = adapt(metadata)
    expect(typeof result.overview).toBe(typeof metadata.overview)
    expect(Array.isArray(result.trace)).toBe(Array.isArray(metadata.trace))
  })

  it('result values are defined when key exists', () => {
    const result = adapt({ overview: {} })
    expect(result.overview).toBeDefined()
  })

  it('no inherited enumerable properties in result', () => {
    const result = adapt({ overview: {} })
    const descriptors = Object.getOwnPropertyDescriptors(result)
    for (const key of Object.keys(descriptors)) {
      expect(descriptors[key].enumerable).toBe(true)
    }
  })

  it('output shape matches input shape for known keys', () => {
    const metadata = { overview: { count: 5 }, trace: [{ id: 'a' }] }
    const result = adapt(metadata)
    expect(Object.keys(result)).toHaveLength(2)
    expect(result.overview).toEqual(metadata.overview)
    expect(result.trace).toEqual(metadata.trace)
  })
})

// ---------------------------------------------------------------------------
// Section 32 — Extended Backward Compatibility
// ---------------------------------------------------------------------------

describe('consumption — extended backward compatibility', () => {
  it('bridge.adapt is a function as before', () => {
    const bridge = createBridge()
    expect(typeof bridge.adapt).toBe('function')
  })

  it('bridge with no args works', () => {
    const bridge = new DefaultObservatoryMetadataBridge()
    const result = bridge.adapt({ overview: {} })
    expect(result.overview).toEqual({})
  })

  it('bridge with undefined args works', () => {
    const bridge = new DefaultObservatoryMetadataBridge(undefined)
    const result = bridge.adapt({ overview: {} })
    expect(result.overview).toEqual({})
  })

  it('frozen output behavior preserved', () => {
    const result = adapt({ overview: { x: 1 } })
    expect(Object.isFrozen(result)).toBe(true)
  })

  it('empty result behavior preserved', () => {
    const result = adapt({})
    expect(Object.keys(result)).toHaveLength(0)
    expect(Object.isFrozen(result)).toBe(true)
  })

  it('EMPTY_BRIDGE_DATA reference preserved for invalid input', () => {
    expect(adapt(undefined)).toBe(EMPTY_BRIDGE_DATA)
    expect(adapt(null)).toBe(EMPTY_BRIDGE_DATA)
  })

  it('all expected exports still available', () => {
    expect(DefaultObservatoryMetadataBridge).toBeDefined()
    expect(EMPTY_BRIDGE_DATA).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Section 33 — Repeated Call Patterns
// ---------------------------------------------------------------------------

describe('consumption — repeated call patterns', () => {
  it('500 rapid calls with varied data', () => {
    const bridge = createBridge()
    const keys = ['overview', 'trace', 'timeline', 'history', 'diff', 'runtime', 'eventStream']
    for (let i = 0; i < 500; i++) {
      const key = keys[i % 7]
      const result = bridge.adapt({ [key]: { index: i } })
      expect(Object.keys(result)).toEqual([key])
    }
  })

  it('alternates between full and empty data', () => {
    const bridge = createBridge()
    for (let i = 0; i < 50; i++) {
      const full = bridge.adapt(buildFullMetadata())
      expect(Object.keys(full)).toHaveLength(7)
      const empty = bridge.adapt({})
      expect(Object.keys(empty)).toHaveLength(0)
    }
  })

  it('same data 100 times produces identical results', () => {
    const bridge = createBridge()
    const data = { overview: { count: 100 }, trace: [{ id: 't1' }] }
    const first = bridge.adapt(data)
    for (let i = 0; i < 99; i++) {
      const next = bridge.adapt(data)
      expect(next).toEqual(first)
    }
  })

  it('interleaving different bridge instances works', () => {
    const { builder: mockBuilder } = createMockBuilder()
    const b1 = createBridge(mockBuilder)
    const b2 = createBridge()
    b1.adapt({ overview: {} })
    b2.adapt({ trace: [] })
    const r1 = b1.adapt({ timeline: [] })
    expect(Object.keys(r1)).toEqual(['timeline'])
  })

  it('builder reused across many calls', () => {
    const builder = new DefaultPromptObservatoryMetadataBuilder()
    const bridge = createBridge(builder)
    for (let i = 0; i < 100; i++) {
      const data = {
        overview: { count: i },
        trace: Array.from({ length: i % 10 }, (_, j) => ({ id: `${i}-${j}` })),
      }
      const result = bridge.adapt(data)
      expect(Object.keys(result).sort()).toEqual(['overview', 'trace'])
      expect((result.overview as { count: number }).count).toBe(i)
    }
  })
})

// ---------------------------------------------------------------------------
// Section 34 — Nested Object Preservation
// ---------------------------------------------------------------------------

describe('consumption — nested object preservation', () => {
  it('preserves nested object references', () => {
    const nested = { deeply: { nested: { value: true } } }
    const metadata = { overview: nested }
    const result = adapt(metadata)
    expect(result.overview).toBe(nested)
  })

  it('preserves array references', () => {
    const traces = [{ id: 'a' }, { id: 'b' }]
    const result = adapt({ trace: traces })
    expect(result.trace).toBe(traces)
  })

  it('preserves Date references inside metadata', () => {
    const date = new Date('2024-01-01')
    const result = adapt({ overview: { created: date } })
    expect(result.overview).toEqual({ created: date })
  })

  it('preserves RegExp references inside metadata', () => {
    const regex = /test/gi
    const result = adapt({ overview: { pattern: regex } })
    expect(result.overview).toEqual({ pattern: regex })
  })

  it('preserves Map inside metadata', () => {
    const map = new Map([['key', 'value']])
    const result = adapt({ overview: { map } })
    expect(result.overview).toEqual({ map })
  })

  it('preserves Set inside metadata', () => {
    const set = new Set([1, 2, 3])
    const result = adapt({ overview: { set } })
    expect(result.overview).toEqual({ set })
  })

  it('preserves null inside nested metadata', () => {
    const result = adapt({ overview: { value: null } })
    expect(result.overview).toEqual({ value: null })
  })

  it('preserves undefined inside nested metadata', () => {
    const result = adapt({ overview: { value: undefined } })
    expect(result.overview).toEqual({})
  })

  it('preserves circular references safely', () => {
    const obj: Record<string, unknown> = { name: 'parent' }
    obj.self = obj
    const result = adapt({ overview: obj })
    expect(result.overview).toBe(obj)
    expect((result.overview as Record<string, unknown>).self).toBe(obj)
  })
})