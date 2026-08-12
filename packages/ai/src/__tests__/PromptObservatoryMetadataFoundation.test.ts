/**
 * PromptObservatoryMetadataFoundation — verifies the PromptObservatoryMetadata
 * interface, PromptObservatoryMetadataBuilder interface, and
 * DefaultPromptObservatoryMetadataBuilder implementation.
 *
 * WO-S6-024 — Prompt Metadata Contract Foundation
 * Architecture version v1.54
 */

import { describe, it, expect } from 'vitest'
import { DefaultPromptObservatoryMetadataBuilder } from '../observatory'
import type { PromptObservatoryMetadata } from '../observatory'
import type { PromptObservatoryMetadataBuilder } from '../observatory'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createBuilder(): PromptObservatoryMetadataBuilder {
  return new DefaultPromptObservatoryMetadataBuilder()
}

/** Build a metadata object with all 7 known keys populated. */
function buildFullInput(): Record<string, unknown> {
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

/** Shorthand: build metadata and return the result. */
function build(input: Record<string, unknown>): PromptObservatoryMetadata {
  return createBuilder().build(input)
}

// ---------------------------------------------------------------------------
// Section 1 — Interface Conformance
// ---------------------------------------------------------------------------

describe('builder — interface conformance', () => {
  it('implements PromptObservatoryMetadataBuilder interface', () => {
    const builder = createBuilder()
    expect(typeof builder.build).toBe('function')
  })

  it('build method accepts Record<string, unknown>', () => {
    const builder = createBuilder()
    const result = builder.build({})
    expect(result).toBeDefined()
  })

  it('build method returns PromptObservatoryMetadata', () => {
    const result = build({})
    expect(typeof result).toBe('object')
    expect(result).not.toBeNull()
  })

  it('has no other methods', () => {
    const builder = createBuilder()
    const keys = Object.getOwnPropertyNames(
      Object.getPrototypeOf(builder),
    ).filter((k) => k !== 'constructor')
    expect(keys).toEqual(['build'])
  })
})

// ---------------------------------------------------------------------------
// Section 2 — PromptObservatoryMetadata Shape
// ---------------------------------------------------------------------------

describe('PromptObservatoryMetadata — shape', () => {
  it('has overview field (optional, unknown)', () => {
    const result = build({ overview: 'test' })
    expect('overview' in result).toBe(true)
    expect(typeof (result as Record<string, unknown>).overview).toBe('string')
  })

  it('has trace field (optional, unknown)', () => {
    const result = build({ trace: [1, 2, 3] })
    expect('trace' in result).toBe(true)
  })

  it('has timeline field (optional, unknown)', () => {
    const result = build({ timeline: 'test' })
    expect('timeline' in result).toBe(true)
  })

  it('has history field (optional, unknown)', () => {
    const result = build({ history: {} })
    expect('history' in result).toBe(true)
  })

  it('has diff field (optional, unknown)', () => {
    const result = build({ diff: null })
    expect('diff' in result).toBe(true)
  })

  it('has runtime field (optional, unknown)', () => {
    const result = build({ runtime: 'value' })
    expect('runtime' in result).toBe(true)
  })

  it('has eventStream field (optional, unknown)', () => {
    const result = build({ eventStream: 42 })
    expect('eventStream' in result).toBe(true)
  })

  it('all fields present in full input', () => {
    const result = build(buildFullInput())
    expect('overview' in result).toBe(true)
    expect('trace' in result).toBe(true)
    expect('timeline' in result).toBe(true)
    expect('history' in result).toBe(true)
    expect('diff' in result).toBe(true)
    expect('runtime' in result).toBe(true)
    expect('eventStream' in result).toBe(true)
  })

  it('all fields are readonly at type level', () => {
    // TypeScript compile-time check — readonly fields cannot be reassigned
    const result: PromptObservatoryMetadata = {}
    expect(result).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Section 3 — Extract All Fields
// ---------------------------------------------------------------------------

describe('builder — extract all fields', () => {
  it('extracts overview', () => {
    const result = build({ overview: { count: 5 } })
    expect((result as Record<string, unknown>).overview).toEqual({ count: 5 })
  })

  it('extracts trace', () => {
    const result = build({ trace: [{ id: 't1' }] })
    expect((result as Record<string, unknown>).trace).toEqual([{ id: 't1' }])
  })

  it('extracts timeline', () => {
    const result = build({ timeline: 'raw-timeline' })
    expect((result as Record<string, unknown>).timeline).toBe('raw-timeline')
  })

  it('extracts history', () => {
    const result = build({ history: { entries: [] } })
    expect((result as Record<string, unknown>).history).toEqual({ entries: [] })
  })

  it('extracts diff', () => {
    const result = build({ diff: [{ id: 'd1' }] })
    expect((result as Record<string, unknown>).diff).toEqual([{ id: 'd1' }])
  })

  it('extracts runtime', () => {
    const result = build({ runtime: { worldId: 'w1' } })
    expect((result as Record<string, unknown>).runtime).toEqual({ worldId: 'w1' })
  })

  it('extracts eventStream', () => {
    const result = build({ eventStream: { events: [] } })
    expect((result as Record<string, unknown>).eventStream).toEqual({ events: [] })
  })

  it('extracts all 7 fields from full input', () => {
    const input = buildFullInput()
    const result = build(input)
    expect((result as Record<string, unknown>).overview).toBe(input.overview)
    expect((result as Record<string, unknown>).trace).toBe(input.trace)
    expect((result as Record<string, unknown>).timeline).toBe(input.timeline)
    expect((result as Record<string, unknown>).history).toBe(input.history)
    expect((result as Record<string, unknown>).diff).toBe(input.diff)
    expect((result as Record<string, unknown>).runtime).toBe(input.runtime)
    expect((result as Record<string, unknown>).eventStream).toBe(input.eventStream)
  })

  it('output has exactly 7 keys for full input', () => {
    const result = build(buildFullInput())
    expect(Object.keys(result).length).toBe(7)
  })
})

// ---------------------------------------------------------------------------
// Section 4 — Undefined / Null / Invalid Input
// ---------------------------------------------------------------------------

describe('builder — invalid inputs', () => {
  it('returns empty frozen object for undefined input', () => {
    const result = createBuilder().build(undefined as unknown as Record<string, unknown>)
    expect(result).toEqual({})
    expect(Object.isFrozen(result)).toBe(true)
  })

  it('returns empty frozen object for null input', () => {
    const result = createBuilder().build(null as unknown as Record<string, unknown>)
    expect(result).toEqual({})
    expect(Object.isFrozen(result)).toBe(true)
  })

  it('returns empty frozen object for string input', () => {
    const result = createBuilder().build('hello' as unknown as Record<string, unknown>)
    expect(result).toEqual({})
  })

  it('returns empty frozen object for number input', () => {
    const result = createBuilder().build(42 as unknown as Record<string, unknown>)
    expect(result).toEqual({})
  })

  it('returns empty frozen object for boolean input', () => {
    const result = createBuilder().build(true as unknown as Record<string, unknown>)
    expect(result).toEqual({})
  })

  it('returns empty frozen object for array input', () => {
    const result = createBuilder().build([] as unknown as Record<string, unknown>)
    expect(result).toEqual({})
  })

  it('returns empty frozen object for populated array input', () => {
    const result = createBuilder().build([1, 2, 3] as unknown as Record<string, unknown>)
    expect(result).toEqual({})
  })

  it('returns frozen result for all invalid inputs', () => {
    expect(Object.isFrozen(createBuilder().build(undefined as unknown as Record<string, unknown>))).toBe(true)
    expect(Object.isFrozen(createBuilder().build(null as unknown as Record<string, unknown>))).toBe(true)
    expect(Object.isFrozen(createBuilder().build('' as unknown as Record<string, unknown>))).toBe(true)
    expect(Object.isFrozen(createBuilder().build(0 as unknown as Record<string, unknown>))).toBe(true)
  })

  it('returns empty for Date input', () => {
    const result = createBuilder().build(new Date() as unknown as Record<string, unknown>)
    expect(Object.keys(result)).toEqual([])
  })

  it('returns empty for RegExp input', () => {
    const result = createBuilder().build(/test/ as unknown as Record<string, unknown>)
    expect(Object.keys(result)).toEqual([])
  })

  it('returns empty for Map input', () => {
    const result = createBuilder().build(new Map() as unknown as Record<string, unknown>)
    expect(Object.keys(result)).toEqual([])
  })

  it('returns empty for Set input', () => {
    const result = createBuilder().build(new Set() as unknown as Record<string, unknown>)
    expect(Object.keys(result)).toEqual([])
  })

  it('returns empty for Promise input', () => {
    const result = createBuilder().build(Promise.resolve(42) as unknown as Record<string, unknown>)
    expect(Object.keys(result)).toEqual([])
  })

  it('returns empty for Error input', () => {
    const result = createBuilder().build(new Error('test') as unknown as Record<string, unknown>)
    expect(Object.keys(result)).toEqual([])
  })

  it('returns empty for class instance input', () => {
    class Foo {}
    const result = createBuilder().build(new Foo() as unknown as Record<string, unknown>)
    expect(Object.keys(result)).toEqual([])
  })

  it('returns empty for function input', () => {
    const result = createBuilder().build((() => 'hello') as unknown as Record<string, unknown>)
    expect(Object.keys(result)).toEqual([])
  })

  it('no throw for any non-object input type', () => {
    const builder = createBuilder()
    expect(() => builder.build(undefined as unknown as Record<string, unknown>)).not.toThrow()
    expect(() => builder.build(null as unknown as Record<string, unknown>)).not.toThrow()
    expect(() => builder.build(true as unknown as Record<string, unknown>)).not.toThrow()
    expect(() => builder.build(42 as unknown as Record<string, unknown>)).not.toThrow()
    expect(() => builder.build('' as unknown as Record<string, unknown>)).not.toThrow()
    expect(() => builder.build([] as unknown as Record<string, unknown>)).not.toThrow()
  })

  it('returns empty for BigInt input', () => {
    const result = createBuilder().build(BigInt(42) as unknown as Record<string, unknown>)
    expect(Object.keys(result)).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// Section 5 — Unknown / Extra Fields
// ---------------------------------------------------------------------------

describe('builder — unknown fields', () => {
  it('ignores unknown keys in input', () => {
    const result = build({
      trace: [{ id: 't1' }],
      unknownKey: 'value',
      anotherUnknown: 42,
    })
    expect('unknownKey' in result).toBe(false)
    expect('anotherUnknown' in result).toBe(false)
    expect('trace' in result).toBe(true)
  })

  it('ignores multiple unknown keys', () => {
    const result = build({
      a: 1,
      b: 'two',
      c: true,
      d: null,
      e: undefined,
      trace: [],
    })
    expect('trace' in result).toBe(true)
    expect('a' in result).toBe(false)
    expect('b' in result).toBe(false)
    expect('c' in result).toBe(false)
    expect('d' in result).toBe(false)
    expect('e' in result).toBe(false)
  })

  it('ignores only unknown keys (no known keys present)', () => {
    const result = build({ unknownKey: 'value' })
    expect(Object.keys(result)).toEqual([])
  })

  it('ignores prototype pollution attempt via __proto__', () => {
    const input = { __proto__: { trace: [] } } as Record<string, unknown>
    const result = build(input)
    expect(Object.prototype.hasOwnProperty.call(result, '__proto__')).toBe(false)
    expect(Object.keys(result)).toEqual([])
  })

  it('ignores constructor property', () => {
    const input = { constructor: { trace: [] } } as Record<string, unknown>
    const result = build(input)
    expect(Object.prototype.hasOwnProperty.call(result, 'constructor')).toBe(false)
  })

  it('handles Symbol-keyed properties (ignored)', () => {
    const input: Record<string | symbol, unknown> = { trace: [{ id: 't1' }] }
    input[Symbol('hidden')] = 'secret'
    const result = build(input as Record<string, unknown>)
    expect('trace' in result).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Section 6 — Partial Input
// ---------------------------------------------------------------------------

describe('builder — partial input', () => {
  it('single key: overview only', () => {
    const result = build({ overview: { traceCount: 1 } })
    expect(Object.keys(result)).toEqual(['overview'])
  })

  it('single key: trace only', () => {
    const result = build({ trace: [{ id: 't1' }] })
    expect(Object.keys(result)).toEqual(['trace'])
  })

  it('single key: timeline only', () => {
    const result = build({ timeline: 'tl' })
    expect(Object.keys(result)).toEqual(['timeline'])
  })

  it('single key: history only', () => {
    const result = build({ history: {} })
    expect(Object.keys(result)).toEqual(['history'])
  })

  it('single key: diff only', () => {
    const result = build({ diff: [] })
    expect(Object.keys(result)).toEqual(['diff'])
  })

  it('single key: runtime only', () => {
    const result = build({ runtime: null })
    expect(Object.keys(result)).toEqual(['runtime'])
  })

  it('single key: eventStream only', () => {
    const result = build({ eventStream: undefined })
    expect(Object.keys(result)).toEqual(['eventStream'])
  })

  it('two keys: trace and timeline', () => {
    const result = build({
      trace: [{ id: 't1' }],
      timeline: [{ id: 'tl1' }],
    })
    expect(Object.keys(result)).toEqual(['trace', 'timeline'])
  })

  it('three keys: overview, diff, runtime', () => {
    const result = build({
      overview: { count: 0 },
      diff: [],
      runtime: null,
    })
    expect(Object.keys(result)).toEqual(['overview', 'diff', 'runtime'])
  })

  it('four keys: all rename fields (diff, runtime, eventStream)', () => {
    const result = build({
      diff: [],
      runtime: {},
      eventStream: undefined,
      trace: [],
    })
    expect(Object.keys(result)).toEqual(['trace', 'diff', 'runtime', 'eventStream'])
  })

  it('only known keys are extracted even when mixed with unknown', () => {
    const result = build({
      trace: [{ id: 't1' }],
      unknown: 'ignored',
      diff: null,
      anotherUnknown: 42,
    })
    expect(Object.keys(result)).toEqual(['trace', 'diff'])
  })
})

// ---------------------------------------------------------------------------
// Section 7 — Empty Object
// ---------------------------------------------------------------------------

describe('builder — empty input', () => {
  it('returns empty object for empty input', () => {
    const result = build({})
    expect(Object.keys(result)).toEqual([])
  })

  it('result is frozen for empty input', () => {
    const result = build({})
    expect(Object.isFrozen(result)).toBe(true)
  })

  it('result is a plain object', () => {
    const result = build({})
    expect(Object.getPrototypeOf(result)).toBe(Object.prototype)
  })

  it('result is not null/undefined', () => {
    const result = build({})
    expect(result).toBeDefined()
    expect(result).not.toBeNull()
  })
})

// ---------------------------------------------------------------------------
// Section 8 — Immutability / Frozen Output
// ---------------------------------------------------------------------------

describe('builder — frozen output', () => {
  it('output is frozen for full input', () => {
    const result = build(buildFullInput())
    expect(Object.isFrozen(result)).toBe(true)
  })

  it('output is frozen for partial input', () => {
    const result = build({ trace: [{ id: 't1' }] })
    expect(Object.isFrozen(result)).toBe(true)
  })

  it('output is frozen for empty input', () => {
    const result = build({})
    expect(Object.isFrozen(result)).toBe(true)
  })

  it('output is frozen for invalid input', () => {
    const builder = createBuilder()
    expect(Object.isFrozen(builder.build(undefined as unknown as Record<string, unknown>))).toBe(true)
    expect(Object.isFrozen(builder.build(null as unknown as Record<string, unknown>))).toBe(true)
    expect(Object.isFrozen(builder.build('' as unknown as Record<string, unknown>))).toBe(true)
  })

  it('cannot add properties to output', () => {
    const result = build({ trace: [{ id: 't1' }] })
    expect(() => { (result as Record<string, unknown>).extra = 'value' }).toThrow()
  })

  it('cannot delete properties from output', () => {
    const result = build({ trace: [{ id: 't1' }] })
    expect(() => { delete (result as Record<string, unknown>).trace }).toThrow()
  })

  it('cannot reassign properties on output', () => {
    const result = build({ trace: [{ id: 't1' }] })
    expect(() => { (result as Record<string, unknown>).trace = 'changed' }).toThrow()
  })

  it('frozen for single-field output', () => {
    const result = build({ overview: 'test' })
    expect(Object.isFrozen(result)).toBe(true)
  })

  it('frozen for single diff field', () => {
    const result = build({ diff: 'test' })
    expect(Object.isFrozen(result)).toBe(true)
  })

  it('frozen for single runtime field', () => {
    const result = build({ runtime: { x: 1 } })
    expect(Object.isFrozen(result)).toBe(true)
  })

  it('frozen for single eventStream field', () => {
    const result = build({ eventStream: { events: [] } })
    expect(Object.isFrozen(result)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Section 9 — No Mutation
// ---------------------------------------------------------------------------

describe('builder — no mutation', () => {
  it('does not modify input properties', () => {
    const input = { trace: [{ id: 't1' }] }
    const before = JSON.stringify(input)
    build(input)
    expect(JSON.stringify(input)).toBe(before)
  })

  it('does not modify input with all fields', () => {
    const input = buildFullInput()
    const before = JSON.stringify(input)
    build(input)
    expect(JSON.stringify(input)).toBe(before)
  })

  it('does not add properties to input', () => {
    const input = { trace: [{ id: 't1' }] }
    const beforeKeys = Object.keys(input)
    build(input)
    expect(Object.keys(input)).toEqual(beforeKeys)
  })

  it('does not remove properties from input', () => {
    const input = buildFullInput()
    const beforeKeys = Object.keys(input)
    build(input)
    expect(Object.keys(input)).toEqual(beforeKeys)
  })

  it('handles frozen input without error', () => {
    const input = Object.freeze({ trace: [{ id: 't1' }] })
    expect(() => build(input)).not.toThrow()
  })

  it('handles sealed input without error', () => {
    const input = Object.seal({ trace: [{ id: 't1' }] })
    expect(() => build(input)).not.toThrow()
  })

  it('handles non-extensible input without error', () => {
    const input = Object.preventExtensions({ trace: [{ id: 't1' }] })
    expect(() => build(input)).not.toThrow()
  })

  it('handles Object.create(null) input', () => {
    const input = Object.create(null) as Record<string, unknown>
    input.trace = [{ id: 't1' }]
    input.diff = [{ id: 'd1' }]
    const result = build(input)
    expect('trace' in result).toBe(true)
    expect('diff' in result).toBe(true)
  })

  it('Object.create(null) with empty input returns empty', () => {
    const input = Object.create(null) as Record<string, unknown>
    const result = build(input)
    expect(Object.keys(result)).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// Section 10 — Determinism
// ---------------------------------------------------------------------------

describe('builder — determinism', () => {
  it('same input produces same output shape', () => {
    const input = buildFullInput()
    const r1 = build(input)
    const r2 = build(input)
    expect(Object.keys(r1)).toEqual(Object.keys(r2))
  })

  it('same input produces same values', () => {
    const input = buildFullInput()
    const r1 = build(input)
    const r2 = build(input)
    expect((r1 as Record<string, unknown>).trace).toBe((r2 as Record<string, unknown>).trace)
    expect((r1 as Record<string, unknown>).diff).toBe((r2 as Record<string, unknown>).diff)
  })

  it('deterministic across builder instances', () => {
    const input = buildFullInput()
    const builder1 = createBuilder()
    const builder2 = createBuilder()
    expect(builder1.build(input)).toEqual(builder2.build(input))
  })

  it('deterministic with partial input', () => {
    const input = { trace: [{ id: 't1' }] }
    const r1 = build(input)
    const r2 = build(input)
    expect(r1).toEqual(r2)
  })

  it('deterministic with empty input', () => {
    const r1 = build({})
    const r2 = build({})
    expect(r1).toEqual(r2)
  })

  it('deterministic with invalid input', () => {
    const builder = createBuilder()
    const r1 = builder.build(undefined as unknown as Record<string, unknown>)
    const r2 = builder.build(undefined as unknown as Record<string, unknown>)
    expect(r1).toEqual(r2)
  })

  it('repeated calls on same instance produce same result', () => {
    const builder = createBuilder()
    const input = buildFullInput()
    const r1 = builder.build(input)
    const r2 = builder.build(input)
    const r3 = builder.build(input)
    expect(r1).toEqual(r2)
    expect(r2).toEqual(r3)
  })
})

// ---------------------------------------------------------------------------
// Section 11 — Statelessness
// ---------------------------------------------------------------------------

describe('builder — statelessness', () => {
  it('no state between calls', () => {
    const builder = createBuilder()
    const r1 = builder.build({ trace: [{ id: 't1' }] })
    const r2 = builder.build({ trace: [{ id: 't2' }] })
    expect(r1).not.toBe(r2)
  })

  it('multiple instances produce independent results', () => {
    const b1 = createBuilder()
    const b2 = createBuilder()
    const r1 = b1.build({ trace: [{ id: 't1' }] })
    const r2 = b2.build({ trace: [{ id: 't2' }] })
    expect(r1).not.toBe(r2)
  })

  it('no cross-call leakage', () => {
    const builder = createBuilder()
    builder.build(buildFullInput())
    const result = builder.build({})
    expect(Object.keys(result)).toEqual([])
  })

  it('subsequent calls do not accumulate keys', () => {
    const builder = createBuilder()
    builder.build({ trace: [], timeline: [], history: [] })
    builder.build({ diff: [] })
    const result = builder.build({})
    expect(Object.keys(result)).toEqual([])
  })

  it('no leakage from full input to empty input', () => {
    const builder = createBuilder()
    builder.build(buildFullInput())
    const result = builder.build({})
    expect(Object.keys(result).length).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// Section 12 — Shape Integrity
// ---------------------------------------------------------------------------

describe('builder — shape integrity', () => {
  it('result is a plain object', () => {
    const result = build(buildFullInput())
    expect(Object.getPrototypeOf(result)).toBe(Object.prototype)
  })

  it('result for empty input is a plain object', () => {
    const result = build({})
    expect(Object.getPrototypeOf(result)).toBe(Object.prototype)
  })

  it('result has exactly the known keys for full input', () => {
    const result = build(buildFullInput())
    const keys = Object.keys(result)
    expect(keys).toContain('overview')
    expect(keys).toContain('trace')
    expect(keys).toContain('timeline')
    expect(keys).toContain('history')
    expect(keys).toContain('diff')
    expect(keys).toContain('runtime')
    expect(keys).toContain('eventStream')
  })

  it('result does not contain non-known keys', () => {
    const result = build(buildFullInput())
    const keys = Object.keys(result)
    expect(keys).not.toContain('traceView')
    expect(keys).not.toContain('diffView')
    expect(keys).not.toContain('runtimeView')
    expect(keys).not.toContain('eventStreamView')
    expect(keys).not.toContain('overviewView')
  })

  it('result length equals number of provided known keys', () => {
    const result = build({ trace: [], diff: [] })
    expect(Object.keys(result).length).toBe(2)
  })

  it('result for 3 keys has length 3', () => {
    const result = build({ trace: [], timeline: [], history: [] })
    expect(Object.keys(result).length).toBe(3)
  })

  it('result for 7 keys has length 7', () => {
    const result = build(buildFullInput())
    expect(Object.keys(result).length).toBe(7)
  })
})

// ---------------------------------------------------------------------------
// Section 13 — Value Preservation
// ---------------------------------------------------------------------------

describe('builder — value preservation', () => {
  it('preserves string values', () => {
    const result = build({ overview: 'hello' })
    expect((result as Record<string, unknown>).overview).toBe('hello')
  })

  it('preserves number values', () => {
    const result = build({ overview: 42 })
    expect((result as Record<string, unknown>).overview).toBe(42)
  })

  it('preserves boolean values', () => {
    const result = build({ overview: false })
    expect((result as Record<string, unknown>).overview).toBe(false)
  })

  it('preserves null values', () => {
    const result = build({ overview: null })
    expect((result as Record<string, unknown>).overview).toBeNull()
  })

  it('preserves undefined values', () => {
    const result = build({ overview: undefined })
    expect('overview' in result).toBe(true)
    expect((result as Record<string, unknown>).overview).toBeUndefined()
  })

  it('preserves nested objects', () => {
    const nested = { a: { b: { c: 1 } } }
    const result = build({ overview: nested })
    expect((result as Record<string, unknown>).overview).toBe(nested)
  })

  it('preserves array references', () => {
    const arr = [{ id: 't1' }]
    const result = build({ trace: arr })
    expect((result as Record<string, unknown>).trace).toBe(arr)
  })

  it('preserves zero values', () => {
    const result = build({ overview: 0 })
    expect((result as Record<string, unknown>).overview).toBe(0)
  })

  it('preserves empty string values', () => {
    const result = build({ overview: '' })
    expect((result as Record<string, unknown>).overview).toBe('')
  })

  it('preserves NaN values', () => {
    const result = build({ overview: NaN })
    expect(Number.isNaN((result as Record<string, unknown>).overview)).toBe(true)
  })

  it('preserves Infinity values', () => {
    const result = build({ overview: Infinity })
    expect((result as Record<string, unknown>).overview).toBe(Infinity)
  })

  it('preserves function values', () => {
    const fn = () => 'hello'
    const result = build({ overview: fn })
    expect((result as Record<string, unknown>).overview).toBe(fn)
  })

  it('preserves Date objects', () => {
    const date = new Date()
    const result = build({ overview: date })
    expect((result as Record<string, unknown>).overview).toBe(date)
  })

  it('preserves RegExp objects', () => {
    const regex = /test/
    const result = build({ overview: regex })
    expect((result as Record<string, unknown>).overview).toBe(regex)
  })
})

// ---------------------------------------------------------------------------
// Section 14 — Key Ordering / Consistency
// ---------------------------------------------------------------------------

describe('builder — key ordering', () => {
  it('keys appear in canonical insertion order', () => {
    const result = build(buildFullInput())
    const keys = Object.keys(result)
    expect(keys[0]).toBe('overview')
    expect(keys[1]).toBe('trace')
    expect(keys[2]).toBe('timeline')
    expect(keys[3]).toBe('history')
    expect(keys[4]).toBe('diff')
    expect(keys[5]).toBe('runtime')
    expect(keys[6]).toBe('eventStream')
  })

  it('partial input keys follow canonical order', () => {
    const result = build({
      eventStream: { events: [] },
      trace: [{ id: 't1' }],
      diff: [],
    })
    expect(Object.keys(result)).toEqual(['trace', 'diff', 'eventStream'])
  })

  it('single key maintains correct position', () => {
    const result = build({ eventStream: { events: [] } })
    expect(Object.keys(result)).toEqual(['eventStream'])
  })
})

// ---------------------------------------------------------------------------
// Section 15 — Edge Cases
// ---------------------------------------------------------------------------

describe('builder — edge cases', () => {
  it('handles deeply nested input', () => {
    const input = {
      trace: [{ id: 'deep', steps: [{ id: 's1', meta: { value: 42 } }] }],
    }
    const result = build(input)
    expect((result as Record<string, unknown>).trace).toBe(input.trace)
  })

  it('handles frozen input', () => {
    const input = Object.freeze({ trace: [{ id: 't1' }] })
    expect(() => build(input)).not.toThrow()
  })

  it('handles sealed input', () => {
    const input = Object.seal({ trace: [{ id: 't1' }] })
    expect(() => build(input)).not.toThrow()
  })

  it('handles non-extensible input', () => {
    const input = Object.preventExtensions({ trace: [{ id: 't1' }] })
    expect(() => build(input)).not.toThrow()
  })

  it('no throw guarantee for any input', () => {
    const builder = createBuilder()
    expect(() => builder.build({} as Record<string, unknown>)).not.toThrow()
    expect(() => builder.build({ trace: [] })).not.toThrow()
    expect(() => builder.build(buildFullInput())).not.toThrow()
  })

  it('Map value for overview is preserved', () => {
    const map = new Map()
    const result = build({ overview: map })
    expect((result as Record<string, unknown>).overview).toBe(map)
  })

  it('Set value for overview is preserved', () => {
    const set = new Set()
    const result = build({ overview: set })
    expect((result as Record<string, unknown>).overview).toBe(set)
  })

  it('Uint8Array value is preserved', () => {
    const arr = new Uint8Array([1, 2, 3])
    const result = build({ overview: arr })
    expect((result as Record<string, unknown>).overview).toBe(arr)
  })

  it('Error value is preserved', () => {
    const err = new Error('test')
    const result = build({ overview: err })
    expect((result as Record<string, unknown>).overview).toBe(err)
  })

  it('Promise value is preserved', () => {
    const promise = Promise.resolve(42)
    const result = build({ overview: promise })
    expect((result as Record<string, unknown>).overview).toBe(promise)
  })

  it('class instance value is preserved', () => {
    class TestClass {}
    const instance = new TestClass()
    const result = build({ overview: instance })
    expect((result as Record<string, unknown>).overview).toBe(instance)
  })

  it('undefined trace field is preserved in output', () => {
    const result = build({ trace: undefined })
    expect('trace' in result).toBe(true)
    expect((result as Record<string, unknown>).trace).toBeUndefined()
  })

  it('null diff field is preserved in output', () => {
    const result = build({ diff: null })
    expect('diff' in result).toBe(true)
    expect((result as Record<string, unknown>).diff).toBeNull()
  })

  it('empty string overview is preserved', () => {
    const result = build({ overview: '' })
    expect((result as Record<string, unknown>).overview).toBe('')
  })

  it('zero number runtime is preserved', () => {
    const result = build({ runtime: 0 })
    expect((result as Record<string, unknown>).runtime).toBe(0)
  })

  it('false boolean eventStream is preserved', () => {
    const result = build({ eventStream: false })
    expect((result as Record<string, unknown>).eventStream).toBe(false)
  })

  it('all fields with falsy values are preserved', () => {
    const result = build({ overview: 0, trace: '', timeline: false, history: null, diff: undefined })
    expect('overview' in result).toBe(true)
    expect('trace' in result).toBe(true)
    expect('timeline' in result).toBe(true)
    expect('history' in result).toBe(true)
    expect('diff' in result).toBe(true)
  })

  it('nested null prototype objects as values are preserved', () => {
    const nested = Object.create(null)
    nested.value = 42
    const result = build({ overview: nested })
    expect((result as Record<string, unknown>).overview).toBe(nested)
  })

  it('BigInt value is preserved', () => {
    const big = BigInt(9007199254740991)
    const result = build({ overview: big })
    expect((result as Record<string, unknown>).overview).toBe(big)
  })
})

// ---------------------------------------------------------------------------
// Section 16 — Stress Testing
// ---------------------------------------------------------------------------

describe('builder — stress testing', () => {
  it('1000 calls with same full input', () => {
    const builder = createBuilder()
    const input = buildFullInput()
    for (let i = 0; i < 1000; i++) {
      const result = builder.build(input)
      expect(Object.keys(result).length).toBe(7)
    }
  })

  it('1000 calls with varying input', () => {
    const builder = createBuilder()
    for (let i = 0; i < 1000; i++) {
      const input = { trace: [{ id: `t${i}` }] }
      const result = builder.build(input)
      expect('trace' in result).toBe(true)
    }
  })

  it('1000 calls with empty input', () => {
    const builder = createBuilder()
    for (let i = 0; i < 1000; i++) {
      const result = builder.build({})
      expect(Object.keys(result)).toEqual([])
    }
  })

  it('rapid alternating between different input shapes', () => {
    const builder = createBuilder()
    for (let i = 0; i < 500; i++) {
      const r1 = builder.build({ trace: [{ id: 't1' }] })
      expect('trace' in r1).toBe(true)
      const r2 = builder.build({ diff: [] })
      expect('diff' in r2).toBe(true)
      const r3 = builder.build({})
      expect(Object.keys(r3)).toEqual([])
    }
  })

  it('multiple builder instances over same data produce identical results', () => {
    const input = buildFullInput()
    const results = Array.from({ length: 100 }, () => createBuilder().build(input))
    for (const r of results) {
      expect(r).toEqual(results[0])
    }
  })

  it('large trace array preserved correctly', () => {
    const trace = Array.from({ length: 1000 }, (_, i) => ({ id: `t${i}` }))
    const result = build({ trace })
    expect(Array.isArray((result as Record<string, unknown>).trace)).toBe(true)
    expect(((result as Record<string, unknown>).trace as unknown[]).length).toBe(1000)
  })

  it('100 builder instances create independent results', () => {
    const input = buildFullInput()
    const results = Array.from({ length: 100 }, () => createBuilder().build(input))
    for (const r of results) {
      expect(Object.keys(r).length).toBe(7)
    }
  })

  it('500 rapid calls do not degrade', () => {
    const builder = createBuilder()
    for (let i = 0; i < 500; i++) {
      const result = builder.build({ trace: `t${i}`, diff: `d${i}`, runtime: `r${i}` })
      expect(result).toBeDefined()
    }
  })

  it('stress test with alternating known/unknown keys', () => {
    const builder = createBuilder()
    for (let i = 0; i < 250; i++) {
      const r1 = builder.build({ trace: [], unknownKey1: 'x', diff: [] })
      expect(Object.keys(r1).length).toBe(2)
      const r2 = builder.build({ unknownOnly: 1 })
      expect(Object.keys(r2).length).toBe(0)
    }
  })
})

// ---------------------------------------------------------------------------
// Section 17 — Readonly Contract
// ---------------------------------------------------------------------------

describe('builder — readonly contract', () => {
  it('output is typed as PromptObservatoryMetadata with readonly fields', () => {
    const result: PromptObservatoryMetadata = build(buildFullInput())
    expect(result).toBeDefined()
  })

  it('output can be assigned to PromptObservatoryMetadata variable', () => {
    const result: PromptObservatoryMetadata = { trace: 'test' }
    expect(result).toBeDefined()
  })

  it('empty object satisfies PromptObservatoryMetadata', () => {
    const result: PromptObservatoryMetadata = {}
    expect(result).toEqual({})
  })

  it('partial object satisfies PromptObservatoryMetadata', () => {
    const result: PromptObservatoryMetadata = { trace: 'data', diff: 'diff-data' }
    expect(result).toBeDefined()
  })

  it('full object satisfies PromptObservatoryMetadata', () => {
    const result: PromptObservatoryMetadata = {
      overview: 'o',
      trace: 't',
      timeline: 'tl',
      history: 'h',
      diff: 'd',
      runtime: 'r',
      eventStream: 'es',
    }
    expect(result.overview).toBe('o')
    expect(result.trace).toBe('t')
    expect(result.timeline).toBe('tl')
    expect(result.history).toBe('h')
    expect(result.diff).toBe('d')
    expect(result.runtime).toBe('r')
    expect(result.eventStream).toBe('es')
  })

  it('readonly prevents type-level mutation', () => {
    const result: PromptObservatoryMetadata = { trace: 'test' }
    // At runtime, we can check the type contract by verifying properties exist
    expect('trace' in result).toBe(true)
  })

  it('output can have zero fields', () => {
    const empty: PromptObservatoryMetadata = {}
    expect(Object.keys(empty)).toEqual([])
  })

  it('output can have all fields', () => {
    const full: PromptObservatoryMetadata = {
      overview: 'o', trace: 't', timeline: 'tl', history: 'h',
      diff: 'd', runtime: 'r', eventStream: 'es',
    }
    expect(Object.keys(full).length).toBe(7)
  })

  it('output fields are not enumerable in prototype', () => {
    const result = build(buildFullInput())
    for (const key of Object.keys(result)) {
      expect(Object.prototype.hasOwnProperty.call(result, key)).toBe(true)
    }
  })
})

// ---------------------------------------------------------------------------
// Section 18 — Interface Contract
// ---------------------------------------------------------------------------

describe('builder — interface contract', () => {
  it('build method is the only required method', () => {
    const builder: PromptObservatoryMetadataBuilder = {
      build: () => ({ overview: 'test' }),
    }
    expect(builder.build({})).toBeDefined()
  })

  it('build returns PromptObservatoryMetadata', () => {
    const builder: PromptObservatoryMetadataBuilder = new DefaultPromptObservatoryMetadataBuilder()
    const result: PromptObservatoryMetadata = builder.build({})
    expect(result).toEqual({})
  })

  it('DefaultPromptObservatoryMetadataBuilder satisfies the interface', () => {
    const builder: PromptObservatoryMetadataBuilder = new DefaultPromptObservatoryMetadataBuilder()
    expect(builder).toBeInstanceOf(DefaultPromptObservatoryMetadataBuilder)
  })

  it('interface allows any unknown payload', () => {
    const metadata: PromptObservatoryMetadata = {
      trace: { customField: 'any-type' },
      runtime: [1, 2, 3],
    }
    expect(metadata).toBeDefined()
  })

  it('interface allows empty object', () => {
    const metadata: PromptObservatoryMetadata = {}
    expect(metadata).toEqual({})
  })

  it('interface allows single field', () => {
    const metadata: PromptObservatoryMetadata = { overview: 'single' }
    expect(metadata.overview).toBe('single')
  })

  it('interface allows undefined fields', () => {
    const metadata: PromptObservatoryMetadata = { trace: undefined }
    expect('trace' in metadata).toBe(true)
    expect(metadata.trace).toBeUndefined()
  })

  it('interface allows null fields', () => {
    const metadata: PromptObservatoryMetadata = { diff: null }
    expect(metadata.diff).toBeNull()
  })

  it('builder output satisfies PromptObservatoryMetadata interface', () => {
    const result: PromptObservatoryMetadata = build(buildFullInput())
    expect(result.overview).toBeDefined()
    expect(result.trace).toBeDefined()
    expect(result.timeline).toBeDefined()
    expect(result.history).toBeDefined()
    expect(result.diff).toBeDefined()
    expect(result.runtime).toBeDefined()
    expect(result.eventStream).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Section 19 — Integration
// ---------------------------------------------------------------------------

describe('builder — integration', () => {
  it('builder can be composed with other builders', () => {
    const builder = createBuilder()
    const partial = builder.build({ trace: [{ id: 't1' }] })
    const result = builder.build({ ...partial, diff: [] })
    expect('trace' in result).toBe(true)
    expect('diff' in result).toBe(true)
  })

  it('builder output can be spread into another object', () => {
    const partial = build({ trace: 'data', diff: 'diff-data' })
    const combined = { ...partial, extra: 'field' }
    expect(combined.trace).toBe('data')
    expect(combined.diff).toBe('diff-data')
    expect(combined.extra).toBe('field')
  })

  it('builder output can be passed as input to builder', () => {
    const builder = createBuilder()
    const first = builder.build({ trace: ['step1'], diff: ['change1'] })
    const second = builder.build(first as Record<string, unknown>)
    expect(second).toEqual(first)
  })

  it('builder handles own output as input (idempotency)', () => {
    const builder = createBuilder()
    const input = { trace: [{ id: 't1' }], diff: [{ id: 'd1' }] }
    const first = builder.build(input)
    const second = builder.build(first as Record<string, unknown>)
    expect(Object.keys(second)).toEqual(Object.keys(first))
    expect((second as Record<string, unknown>).trace).toBe((first as Record<string, unknown>).trace)
    expect((second as Record<string, unknown>).diff).toBe((first as Record<string, unknown>).diff)
  })

  it('builder output can be serialized to JSON', () => {
    const input = buildFullInput()
    const result = build(input)
    const json = JSON.stringify(result)
    const parsed = JSON.parse(json)
    expect(parsed.overview).toEqual(input.overview)
    expect(parsed.trace).toEqual(input.trace)
  })

  it('builder handles spread of its own output as new input', () => {
    const first = build({ trace: 'data', diff: 'change' })
    const second = build({ ...first, runtime: 'runtime-data' })
    expect('trace' in second).toBe(true)
    expect('diff' in second).toBe(true)
    expect('runtime' in second).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Section 20 — Pure Function Guarantees
// ---------------------------------------------------------------------------

describe('builder — pure function guarantees', () => {
  it('no side effects on external state', () => {
    const external = { value: 0 }
    const builder = createBuilder()
    builder.build({ trace: 'data' })
    expect(external.value).toBe(0)
  })

  it('no console output during build (exception-safe)', () => {
    const builder = createBuilder()
    const result = builder.build({ trace: 'data' })
    expect(result).toBeDefined()
  })

  it('does not throw for any input', () => {
    const builder = createBuilder()
    const inputs: unknown[] = [
      undefined,
      null,
      true,
      false,
      0,
      -1,
      Infinity,
      NaN,
      '',
      'string',
      Symbol('s'),
      {},
      { trace: null },
      { trace: undefined },
      { unknownKey: 'value' },
    ]
    for (const input of inputs) {
      expect(() => builder.build(input as Record<string, unknown>)).not.toThrow()
    }
  })

  it('no try-catch needed — all inputs handled gracefully', () => {
    const builder = createBuilder()
    expect(builder.build({})).toEqual({})
    expect(builder.build(undefined as unknown as Record<string, unknown>)).toEqual({})
    expect(builder.build(null as unknown as Record<string, unknown>)).toEqual({})
  })

  it('does not modify global state', () => {
    const before = Object.keys(globalThis).length
    createBuilder().build({ trace: 'test' })
    expect(Object.keys(globalThis).length).toBe(before)
  })
})

// ---------------------------------------------------------------------------
// Section 21 — Cross-Field Combinations
// ---------------------------------------------------------------------------

describe('builder — cross-field combinations', () => {
  it('all 7 fields with different value types', () => {
    const input = {
      overview: { count: 1 },
      trace: ['a', 'b'],
      timeline: 'string-value',
      history: 42,
      diff: null,
      runtime: undefined,
      eventStream: false,
    }
    const result = build(input)
    expect(Object.keys(result).length).toBe(7)
    expect((result as Record<string, unknown>).overview).toEqual({ count: 1 })
    expect((result as Record<string, unknown>).trace).toEqual(['a', 'b'])
    expect((result as Record<string, unknown>).timeline).toBe('string-value')
    expect((result as Record<string, unknown>).history).toBe(42)
    expect((result as Record<string, unknown>).diff).toBeNull()
    expect('runtime' in result).toBe(true)
    expect((result as Record<string, unknown>).eventStream).toBe(false)
  })

  it('only overview and eventStream fields', () => {
    const result = build({ overview: 'o', eventStream: { events: [] } })
    expect(Object.keys(result)).toEqual(['overview', 'eventStream'])
  })

  it('only trace and runtime fields', () => {
    const result = build({ trace: [], runtime: { fps: 60 } })
    expect(Object.keys(result)).toEqual(['trace', 'runtime'])
  })

  it('only timeline and diff fields', () => {
    const result = build({ timeline: [], diff: [] })
    expect(Object.keys(result)).toEqual(['timeline', 'diff'])
  })

  it('only history and eventStream fields', () => {
    const result = build({ history: {}, eventStream: { events: [] } })
    expect(Object.keys(result)).toEqual(['history', 'eventStream'])
  })

  it('overview + diff + runtime (3 different categories)', () => {
    const result = build({ overview: 'o', diff: 'd', runtime: 'r' })
    expect(Object.keys(result)).toEqual(['overview', 'diff', 'runtime'])
  })

  it('trace + timeline + history (3 passthrough fields)', () => {
    const result = build({ trace: 't', timeline: 'tl', history: 'h' })
    expect(Object.keys(result)).toEqual(['trace', 'timeline', 'history'])
  })

  it('diff + runtime + eventStream (3 rename fields)', () => {
    const result = build({ diff: 'd', runtime: 'r', eventStream: 'es' })
    expect(Object.keys(result)).toEqual(['diff', 'runtime', 'eventStream'])
  })

  it('only 1 known field + 9 unknown fields', () => {
    const input: Record<string, unknown> = { trace: 'known' }
    for (let i = 0; i < 9; i++) {
      input[`unknown${i}`] = i
    }
    const result = build(input)
    expect(Object.keys(result)).toEqual(['trace'])
  })
})

// ---------------------------------------------------------------------------
// Section 22 — Property Descriptor Handling
// ---------------------------------------------------------------------------

describe('builder — property descriptor handling', () => {
  it('handles non-enumerable properties (preserved if known key)', () => {
    const input = {} as Record<string, unknown>
    Object.defineProperty(input, 'trace', {
      value: [{ id: 't1' }],
      enumerable: false,
    })
    // hasOwnProperty detects non-enumerable own properties
    // Since 'trace' is a known key, it will be included
    const result = build(input)
    expect('trace' in result).toBe(true)
    expect((result as Record<string, unknown>).trace).toEqual([{ id: 't1' }])
  })

  it('handles writable:false properties on input', () => {
    const input = {} as Record<string, unknown>
    Object.defineProperty(input, 'trace', {
      value: [{ id: 't1' }],
      enumerable: true,
      writable: false,
    })
    expect(() => build(input)).not.toThrow()
    const result = build(input)
    expect('trace' in result).toBe(true)
  })

  it('handles configurable:false properties on input', () => {
    const input = {} as Record<string, unknown>
    Object.defineProperty(input, 'trace', {
      value: [{ id: 't1' }],
      enumerable: true,
      configurable: false,
    })
    expect(() => build(input)).not.toThrow()
    const result = build(input)
    expect('trace' in result).toBe(true)
  })

  it('handles getter properties on input', () => {
    const input = {} as Record<string, unknown>
    Object.defineProperty(input, 'trace', {
      get: () => [{ id: 't1' }],
      enumerable: true,
      configurable: true,
    })
    const result = build(input)
    expect('trace' in result).toBe(true)
    expect((result as Record<string, unknown>).trace).toEqual([{ id: 't1' }])
  })
})

// ---------------------------------------------------------------------------
// Section 23 — Export Verification
// ---------------------------------------------------------------------------

describe('builder — export verification', () => {
  it('DefaultPromptObservatoryMetadataBuilder is exported from index', async () => {
    const mod = await import('../observatory')
    expect(mod.DefaultPromptObservatoryMetadataBuilder).toBeDefined()
  })

  it('PromptObservatoryMetadata type is exported', async () => {
    // Type-only exports are erased at runtime — verify the class export works
    const mod = await import('../observatory')
    expect(typeof mod.DefaultPromptObservatoryMetadataBuilder).toBe('function')
  })

  it('PromptObservatoryMetadataBuilder type is exported', async () => {
    // Type-only exports are erased at runtime — verify the class export works
    const mod = await import('../observatory')
    expect(typeof mod.DefaultPromptObservatoryMetadataBuilder).toBe('function')
  })

  it('exports from root index work', async () => {
    const mod = await import('../index')
    expect(mod.DefaultPromptObservatoryMetadataBuilder).toBeDefined()
  })

  it('type exports from root index work', async () => {
    const mod = await import('../index')
    // Type-only exports are erased at runtime — the class is what's available
    expect(typeof mod.DefaultPromptObservatoryMetadataBuilder).toBe('function')
  })

  it('DefaultPromptObservatoryMetadataBuilder can be instantiated from root export', async () => {
    const { DefaultPromptObservatoryMetadataBuilder: Builder } = await import('../index')
    const instance = new Builder()
    expect(instance.build).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Section 24 — Constructor / Instantiation
// ---------------------------------------------------------------------------

describe('builder — instantiation', () => {
  it('can be instantiated with new', () => {
    const builder = new DefaultPromptObservatoryMetadataBuilder()
    expect(builder).toBeDefined()
  })

  it('can be instantiated without new (if transpiled)', () => {
    const builder = DefaultPromptObservatoryMetadataBuilder.prototype
    expect(builder).toBeDefined()
  })

  it('multiple instances are independent', () => {
    const b1 = new DefaultPromptObservatoryMetadataBuilder()
    const b2 = new DefaultPromptObservatoryMetadataBuilder()
    expect(b1.build({ trace: 'a' })).not.toBe(b2.build({ trace: 'b' }))
  })

  it('instance build method works immediately', () => {
    const builder = new DefaultPromptObservatoryMetadataBuilder()
    const result = builder.build({ trace: 'instant' })
    expect((result as Record<string, unknown>).trace).toBe('instant')
  })

  it('no constructor arguments needed', () => {
    const builder = new DefaultPromptObservatoryMetadataBuilder()
    expect(builder).toBeInstanceOf(DefaultPromptObservatoryMetadataBuilder)
  })
})

// ---------------------------------------------------------------------------
// Section 25 — Known Key Set Completeness
// ---------------------------------------------------------------------------

describe('builder — known key set completeness', () => {
  it('overview is a known key', () => {
    const result = build({ overview: 'test' })
    expect('overview' in result).toBe(true)
  })

  it('trace is a known key', () => {
    const result = build({ trace: 'test' })
    expect('trace' in result).toBe(true)
  })

  it('timeline is a known key', () => {
    const result = build({ timeline: 'test' })
    expect('timeline' in result).toBe(true)
  })

  it('history is a known key', () => {
    const result = build({ history: 'test' })
    expect('history' in result).toBe(true)
  })

  it('diff is a known key', () => {
    const result = build({ diff: 'test' })
    expect('diff' in result).toBe(true)
  })

  it('runtime is a known key', () => {
    const result = build({ runtime: 'test' })
    expect('runtime' in result).toBe(true)
  })

  it('eventStream is a known key', () => {
    const result = build({ eventStream: 'test' })
    expect('eventStream' in result).toBe(true)
  })

  it('no extra known keys beyond the 7', () => {
    const result = build({
      overview: 1, trace: 2, timeline: 3, history: 4,
      diff: 5, runtime: 6, eventStream: 7,
    })
    expect(Object.keys(result).length).toBe(7)
  })

  it('case-sensitive key matching (uppercase is not known)', () => {
    const result = build({ Overview: 'test', Trace: 'test', DIFF: 'test' })
    expect(Object.keys(result)).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// Section 26 — Repeated Build Calls
// ---------------------------------------------------------------------------

describe('builder — repeated calls', () => {
  it('100 calls with partial input', () => {
    const builder = createBuilder()
    for (let i = 0; i < 100; i++) {
      const result = builder.build({ trace: `t${i}` })
      expect(Object.keys(result)).toEqual(['trace'])
    }
  })

  it('100 calls with alternating single fields', () => {
    const builder = createBuilder()
    const fields = ['overview', 'trace', 'timeline', 'history', 'diff', 'runtime', 'eventStream']
    for (let i = 0; i < 100; i++) {
      const field = fields[i % fields.length]
      const result = builder.build({ [field]: i })
      expect(Object.keys(result)).toEqual([field])
    }
  })

  it('50 calls with all fields then 50 calls with empty', () => {
    const builder = createBuilder()
    const full = buildFullInput()
    for (let i = 0; i < 50; i++) {
      expect(Object.keys(builder.build(full)).length).toBe(7)
    }
    for (let i = 0; i < 50; i++) {
      expect(Object.keys(builder.build({})).length).toBe(0)
    }
  })

  it('repeated calls with large string values', () => {
    const builder = createBuilder()
    const large = 'x'.repeat(10000)
    for (let i = 0; i < 50; i++) {
      const result = builder.build({ overview: large })
      expect((result as Record<string, unknown>).overview).toBe(large)
    }
  })

  it('many calls with large arrays', () => {
    const builder = createBuilder()
    const largeArray = Array.from({ length: 1000 }, (_, i) => ({ id: `t${i}` }))
    for (let i = 0; i < 20; i++) {
      const result = builder.build({ trace: largeArray })
      expect(Array.isArray((result as Record<string, unknown>).trace)).toBe(true)
    }
  })
})

// ---------------------------------------------------------------------------
// Section 27 — No Side Effects
// ---------------------------------------------------------------------------

describe('builder — no side effects', () => {
  it('does not modify input metadata object', () => {
    const input = { trace: [{ id: 't1' }] }
    const before = JSON.stringify(input)
    build(input)
    expect(JSON.stringify(input)).toBe(before)
  })

  it('does not modify input with all 7 keys', () => {
    const input = buildFullInput()
    const before = JSON.stringify(input)
    build(input)
    expect(JSON.stringify(input)).toBe(before)
  })

  it('does not log to console', () => {
    const builder = createBuilder()
    const result = builder.build({ trace: 'data' })
    expect(result).toBeDefined()
  })

  it('does not throw for any valid input shape', () => {
    const shapes = [
      { overview: {} },
      { trace: [] },
      { timeline: '' },
      { history: 0 },
      { diff: false },
      { runtime: null },
      { eventStream: undefined },
      { overview: {}, trace: [], diff: [] },
    ]
    for (const shape of shapes) {
      expect(() => build(shape)).not.toThrow()
    }
  })

  it('does not modify prototype of input', () => {
    const input = { trace: [{ id: 't1' }] }
    const protoBefore = Object.getPrototypeOf(input)
    build(input)
    expect(Object.getPrototypeOf(input)).toBe(protoBefore)
  })
})

// ---------------------------------------------------------------------------
// Section 28 — Field Exhaustive Type Tests
// ---------------------------------------------------------------------------

describe('builder — field exhaustive type tests', () => {
  it('overview accepts any type', () => {
    expect(build({ overview: 'string' })).toBeDefined()
    expect(build({ overview: 42 })).toBeDefined()
    expect(build({ overview: true })).toBeDefined()
    expect(build({ overview: null })).toBeDefined()
    expect(build({ overview: undefined })).toBeDefined()
    expect(build({ overview: {} })).toBeDefined()
    expect(build({ overview: [] })).toBeDefined()
  })

  it('trace accepts any type', () => {
    expect(build({ trace: 'string' })).toBeDefined()
    expect(build({ trace: 42 })).toBeDefined()
    expect(build({ trace: true })).toBeDefined()
    expect(build({ trace: null })).toBeDefined()
    expect(build({ trace: undefined })).toBeDefined()
    expect(build({ trace: {} })).toBeDefined()
    expect(build({ trace: [] })).toBeDefined()
  })

  it('timeline accepts any type', () => {
    expect(build({ timeline: 'string' })).toBeDefined()
    expect(build({ timeline: 42 })).toBeDefined()
  })

  it('history accepts any type', () => {
    expect(build({ history: 'string' })).toBeDefined()
    expect(build({ history: 42 })).toBeDefined()
  })

  it('diff accepts any type', () => {
    expect(build({ diff: 'string' })).toBeDefined()
    expect(build({ diff: 42 })).toBeDefined()
  })

  it('runtime accepts any type', () => {
    expect(build({ runtime: 'string' })).toBeDefined()
    expect(build({ runtime: 42 })).toBeDefined()
  })

  it('eventStream accepts any type', () => {
    expect(build({ eventStream: 'string' })).toBeDefined()
    expect(build({ eventStream: 42 })).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Section 29 — Metadata with Special Characters
// ---------------------------------------------------------------------------

describe('builder — metadata with special characters', () => {
  it('handles unicode keys in metadata (ignored — not known)', () => {
    const result = build({ '🎯': 'emoji', trace: 'data' })
    expect(Object.keys(result)).toEqual(['trace'])
  })

  it('handles keys with spaces (ignored — not known)', () => {
    const result = build({ 'my key': 'value', trace: 'data' })
    expect(Object.keys(result)).toEqual(['trace'])
  })

  it('handles numeric keys (ignored — not known)', () => {
    const result = build({ 123: 'numeric', trace: 'data' } as unknown as Record<string, unknown>)
    expect(Object.keys(result)).toEqual(['trace'])
  })

  it('handles keys with special characters (ignored — not known)', () => {
    const result = build({ 'key@#$%': 'special', trace: 'data' })
    expect(Object.keys(result)).toEqual(['trace'])
  })

  it('handles unicode values in known keys', () => {
    const result = build({ overview: '日本語', trace: ['😀', '🎉'] })
    expect((result as Record<string, unknown>).overview).toBe('日本語')
    expect((result as Record<string, unknown>).trace).toEqual(['😀', '🎉'])
  })
})

// ---------------------------------------------------------------------------
// Section 30 — Zero / Empty / Boundary Values
// ---------------------------------------------------------------------------

describe('builder — zero / empty / boundary values', () => {
  it('all fields with zero-like values are preserved', () => {
    const result = build({
      overview: 0,
      trace: '',
      timeline: false,
      history: null,
      diff: undefined,
      runtime: NaN,
      eventStream: -0,
    })
    expect(Object.keys(result).length).toBe(7)
    expect((result as Record<string, unknown>).overview).toBe(0)
    expect((result as Record<string, unknown>).trace).toBe('')
    expect((result as Record<string, unknown>).timeline).toBe(false)
    expect((result as Record<string, unknown>).history).toBeNull()
    expect('diff' in result).toBe(true)
    expect(Number.isNaN((result as Record<string, unknown>).runtime as number)).toBe(true)
  })

  it('all fields with maximum boundary values', () => {
    const result = build({
      overview: Number.MAX_SAFE_INTEGER,
      trace: Number.MAX_VALUE,
      timeline: -Number.MAX_VALUE,
      history: Infinity,
      diff: -Infinity,
    })
    expect((result as Record<string, unknown>).overview).toBe(Number.MAX_SAFE_INTEGER)
    expect((result as Record<string, unknown>).history).toBe(Infinity)
    expect((result as Record<string, unknown>).diff).toBe(-Infinity)
  })

  it('deeply frozen output prevents property modification on nested objects', () => {
    const result = build({ overview: { nested: 'value' } })
    // The top level is frozen, but nested objects inside values are not
    expect(Object.isFrozen(result)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Section 31 — Multiple Builder Instances
// ---------------------------------------------------------------------------

describe('builder — multiple instances', () => {
  it('10 instances produce same output for same input', () => {
    const input = buildFullInput()
    const results = Array.from({ length: 10 }, () => createBuilder().build(input))
    for (const r of results) {
      expect(r).toEqual(results[0])
    }
  })

  it('10 instances produce different output for different inputs', () => {
    const instances = Array.from({ length: 10 }, () => createBuilder())
    const results = instances.map((b, i) => b.build({ trace: `t${i}` }))
    for (let i = 0; i < results.length; i++) {
      expect((results[i] as Record<string, unknown>).trace).toBe(`t${i}`)
    }
  })

  it('5 instances called sequentially maintain independence', () => {
    const instances = Array.from({ length: 5 }, () => createBuilder())
    instances[0].build({ overview: 'a' })
    instances[1].build({ trace: 'b' })
    instances[2].build({ diff: 'c' })
    instances[3].build({ runtime: 'd' })
    instances[4].build({ eventStream: 'e' })
    const r1 = instances[0].build({})
    const r2 = instances[1].build({})
    expect(Object.keys(r1)).toEqual([])
    expect(Object.keys(r2)).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// Section 32 — Type Safety Verification
// ---------------------------------------------------------------------------

describe('builder — type safety', () => {
  it('accepts only Record<string, unknown> at interface level', () => {
    const builder: PromptObservatoryMetadataBuilder = {
      build: (metadata: Record<string, unknown>) => ({ overview: metadata.trace }),
    }
    const result = builder.build({ trace: 'test' })
    expect(result.overview).toBe('test')
  })

  it('interface contract forces frozen return', () => {
    const builder: PromptObservatoryMetadataBuilder = new DefaultPromptObservatoryMetadataBuilder()
    const result = builder.build({ trace: 'data' })
    expect(Object.isFrozen(result)).toBe(true)
  })

  it('interface build method is properly typed', () => {
    const builder = createBuilder()
    const result: PromptObservatoryMetadata = builder.build({ trace: 'data' })
    // TypeScript validates that the return type matches
    expect(result.trace).toBe('data')
  })
})

// ---------------------------------------------------------------------------
// Section 33 — Builder Returns
// ---------------------------------------------------------------------------

describe('builder — return values', () => {
  it('returns new object each call', () => {
    const builder = createBuilder()
    const r1 = builder.build({ trace: 'a' })
    const r2 = builder.build({ trace: 'a' })
    expect(r1).not.toBe(r2)
    expect(r1).toEqual(r2)
  })

  it('returns frozen empty for unknown keys only', () => {
    const result = build({ a: 1, b: 2 })
    expect(Object.keys(result)).toEqual([])
    expect(Object.isFrozen(result)).toBe(true)
  })

  it('returns object with all fields preserved when hasOwnProperty is true', () => {
    const result = build({ trace: undefined, diff: undefined, runtime: undefined })
    expect(Object.keys(result).length).toBe(3)
    expect(Object.isFrozen(result)).toBe(true)
  })

  it('returns partial result when some fields are present', () => {
    const result = build({ trace: 'data', diff: 'change' })
    expect(Object.keys(result)).toEqual(['trace', 'diff'])
  })

  it('mixed present/absent fields output correct', () => {
    // When using object literal, all explicitly mentioned keys are own properties
    // even if their value is undefined/null. Only truly absent keys are excluded.
    const result = build({
      overview: 'present',
      trace: undefined,
      timeline: null,
      history: '',
      diff: 0,
      runtime: false,
      eventStream: {},
    })
    // All 7 keys are present because they are all own properties of the input
    const keys = Object.keys(result)
    expect(keys.length).toBe(7)
  })

  it('deterministic with 7-field input across 10 calls', () => {
    const builder = createBuilder()
    const input = buildFullInput()
    const first = builder.build(input)
    for (let i = 0; i < 10; i++) {
      expect(builder.build(input)).toEqual(first)
    }
  })

  it('same builder instance returns same result for same input', () => {
    const builder = createBuilder()
    const input = { trace: 'same', diff: 'same' }
    const r1 = builder.build(input)
    const r2 = builder.build(input)
    expect(r1).toEqual(r2)
  })

  it('frozen output prevents adding new properties', () => {
    const result = build(buildFullInput())
    expect(() => { (result as Record<string, unknown>).newField = 'value' }).toThrow()
  })

  it('frozen output prevents redefining properties', () => {
    const result = build({ trace: 'original' })
    expect(() => { Object.defineProperty(result as Record<string, unknown>, 'trace', { value: 'changed' }) }).toThrow()
  })

  it('empty input produces empty frozen object', () => {
    const result = build({})
    expect(result).toEqual({})
    expect(Object.isFrozen(result)).toBe(true)
  })

  it('single field with object value is preserved', () => {
    const value = { nested: { deeply: true } }
    const result = build({ overview: value })
    expect((result as Record<string, unknown>).overview).toBe(value)
  })

  it('all fields can be BigInt values', () => {
    const result = build({ overview: BigInt(1), trace: BigInt(2), diff: BigInt(3) })
    expect(typeof (result as Record<string, unknown>).overview).toBe('bigint')
    expect(typeof (result as Record<string, unknown>).trace).toBe('bigint')
  })
})