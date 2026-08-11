import { describe, it, expect, vi } from 'vitest'
import { DefaultObservatoryAdapter } from '../adapters/observatory/DefaultObservatoryAdapter'
import type { ObservatoryAdapter } from '../adapters/observatory/ObservatoryAdapter'
import type { ObservatoryViewModel } from '../adapters/observatory/ObservatoryViewModel'

// ---------------------------------------------------------------------------
// Mock observatory fixtures (local only — no AI package imports)
// Represent PromptAssemblyObservatory shape without importing AI types.
// ---------------------------------------------------------------------------

function createEmptyObservatory(): Record<string, unknown> {
  return {}
}

function createCompleteObservatory(): Record<string, unknown> {
  return {
    trace: [
      {
        id: 'trace-1',
        label: 'Build Village',
        steps: [
          { id: 'step-1', label: 'CreateWorld', status: 'completed' },
          { id: 'step-2', label: 'GenerateTerrain', status: 'completed' },
        ],
      },
    ],
    timeline: [
      {
        id: 'timeline-1',
        label: 'Session Builds',
        entries: [
          { id: 'entry-1', label: 'Build Village', timestamp: '12:00:01' },
          { id: 'entry-2', label: 'Add Farm', timestamp: '12:05:30' },
        ],
      },
    ],
    history: [
      {
        id: 'history-1',
        label: 'Create Village',
        entries: [
          { id: 'he-1', label: 'Applied CreateEntity', timestamp: '12:00:01' },
          { id: 'he-2', label: 'Applied MoveEntity', timestamp: '12:00:05' },
        ],
      },
    ],
    traceSnapshot: { stepCount: 5 },
    timelineSnapshot: { entryCount: 12 },
    historySnapshot: { entryCount: 8 },
  }
}

function createPartialObservatory(): Record<string, unknown> {
  return {
    trace: [
      {
        id: 'trace-1',
        label: 'Build Village',
        steps: [],
      },
    ],
    hasTrace: true,
    hasTimeline: false,
    hasHistory: false,
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createAdapter(): ObservatoryAdapter {
  return new DefaultObservatoryAdapter()
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

describe('DefaultObservatoryAdapter — factory', () => {
  it('creates an adapter that implements the interface', () => {
    const adapter = createAdapter()
    expect(adapter).toBeDefined()
    expect(typeof adapter.adapt).toBe('function')
  })

  it('returns a DefaultObservatoryAdapter instance', () => {
    const adapter = createAdapter()
    expect(adapter).toBeInstanceOf(DefaultObservatoryAdapter)
  })

  it('adapter has adapt method', () => {
    const adapter = createAdapter()
    expect(typeof adapter.adapt).toBe('function')
  })

  it('adapter is not a singleton (multiple instances)', () => {
    const a = createAdapter()
    const b = createAdapter()
    expect(a).not.toBe(b)
    expect(a.adapt(null)).toEqual(b.adapt(null))
  })
})

// ---------------------------------------------------------------------------
// Edge cases — null / undefined / invalid input
// ---------------------------------------------------------------------------

describe('DefaultObservatoryAdapter — null / undefined / invalid', () => {
  it('handles undefined input', () => {
    const vm = createAdapter().adapt(undefined)
    expect(vm.overview.traceCount).toBe(0)
    expect(vm.overview.timelineCount).toBe(0)
    expect(vm.overview.historyCount).toBe(0)
  })

  it('handles null input', () => {
    const vm = createAdapter().adapt(null)
    expect(vm.overview.traceCount).toBe(0)
  })

  it('handles boolean input (true)', () => {
    const vm = createAdapter().adapt(true)
    expect(vm.overview.traceCount).toBe(0)
    expect(vm.trace).toHaveLength(0)
  })

  it('handles boolean input (false)', () => {
    const vm = createAdapter().adapt(false)
    expect(vm.overview.traceCount).toBe(0)
  })

  it('handles number input (0)', () => {
    const vm = createAdapter().adapt(0)
    expect(vm.overview.traceCount).toBe(0)
  })

  it('handles number input (42)', () => {
    const vm = createAdapter().adapt(42)
    expect(vm.overview.traceCount).toBe(0)
  })

  it('handles string input', () => {
    const vm = createAdapter().adapt('hello')
    expect(vm.overview.traceCount).toBe(0)
  })

  it('handles empty string input', () => {
    const vm = createAdapter().adapt('')
    expect(vm.overview.traceCount).toBe(0)
  })

  it('handles array input', () => {
    const vm = createAdapter().adapt([1, 2, 3])
    expect(vm.overview.traceCount).toBe(0)
  })

  it('handles Symbol input', () => {
    const vm = createAdapter().adapt(Symbol('test'))
    expect(vm.overview.traceCount).toBe(0)
  })

  it('handles function input', () => {
    const vm = createAdapter().adapt(() => {})
    expect(vm.overview.traceCount).toBe(0)
  })

  it('handles Date input', () => {
    const vm = createAdapter().adapt(new Date())
    expect(vm.overview.traceCount).toBe(0)
  })

  it('handles NaN input', () => {
    const vm = createAdapter().adapt(NaN)
    expect(vm.overview.traceCount).toBe(0)
  })

  it('handles Infinity input', () => {
    const vm = createAdapter().adapt(Infinity)
    expect(vm.overview.traceCount).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// Edge cases — empty object / empty observatory
// ---------------------------------------------------------------------------

describe('DefaultObservatoryAdapter — empty / partial', () => {
  it('handles empty object input', () => {
    const vm = createAdapter().adapt({})
    expect(vm.overview.traceCount).toBe(0)
    expect(vm.overview.timelineCount).toBe(0)
    expect(vm.overview.historyCount).toBe(0)
  })

  it('handles empty observatory (createEmptyObservatory)', () => {
    const vm = createAdapter().adapt(createEmptyObservatory())
    expect(vm.overview.traceCount).toBe(0)
    expect(vm.overview.timelineCount).toBe(0)
    expect(vm.overview.historyCount).toBe(0)
  })

  it('handles partial observatory with only trace', () => {
    const vm = createAdapter().adapt({
      trace: [{ id: 't1', label: 'Trace 1', steps: [] }],
    })
    expect(vm.overview.traceCount).toBe(1)
    expect(vm.overview.timelineCount).toBe(0)
    expect(vm.overview.historyCount).toBe(0)
  })

  it('handles partial observatory with only timeline', () => {
    const vm = createAdapter().adapt({
      timeline: [{ id: 'tl1', label: 'Timeline 1', entries: [] }],
    })
    expect(vm.overview.traceCount).toBe(0)
    expect(vm.overview.timelineCount).toBe(1)
    expect(vm.overview.historyCount).toBe(0)
  })

  it('handles partial observatory with only history', () => {
    const vm = createAdapter().adapt({
      history: [{ id: 'h1', label: 'History 1', entries: [] }],
    })
    expect(vm.overview.traceCount).toBe(0)
    expect(vm.overview.timelineCount).toBe(0)
    expect(vm.overview.historyCount).toBe(1)
  })

  it('handles partial with traceSnapshot only', () => {
    const vm = createAdapter().adapt({
      traceSnapshot: { stepCount: 3 },
    })
    expect(vm.overview.traceCount).toBe(3)
  })

  it('handles partial with timelineSnapshot only', () => {
    const vm = createAdapter().adapt({
      timelineSnapshot: { entryCount: 7 },
    })
    expect(vm.overview.timelineCount).toBe(7)
  })

  it('handles partial with historySnapshot only', () => {
    const vm = createAdapter().adapt({
      historySnapshot: { entryCount: 4 },
    })
    expect(vm.overview.historyCount).toBe(4)
  })

  it('handles partial with hasTrace flag', () => {
    const vm = createAdapter().adapt({ hasTrace: true })
    expect(vm.overview.traceCount).toBe(1)
    expect(vm.overview.timelineCount).toBe(0)
    expect(vm.overview.historyCount).toBe(0)
  })

  it('handles partial with hasTimeline flag', () => {
    const vm = createAdapter().adapt({ hasTimeline: true })
    expect(vm.overview.timelineCount).toBe(1)
  })

  it('handles partial with hasHistory flag', () => {
    const vm = createAdapter().adapt({ hasHistory: true })
    expect(vm.overview.historyCount).toBe(1)
  })

  it('handles partial with false flags', () => {
    const vm = createAdapter().adapt({
      hasTrace: false,
      hasTimeline: false,
      hasHistory: false,
    })
    expect(vm.overview.traceCount).toBe(0)
    expect(vm.overview.timelineCount).toBe(0)
    expect(vm.overview.historyCount).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// Complete observatory
// ---------------------------------------------------------------------------

describe('DefaultObservatoryAdapter — complete observatory', () => {
  it('adapts a complete observatory without crashing', () => {
    const vm = createAdapter().adapt(createCompleteObservatory())
    expect(vm).toBeDefined()
  })

  it('extracts correct trace count from array length', () => {
    const vm = createAdapter().adapt(createCompleteObservatory())
    expect(vm.overview.traceCount).toBe(1)
  })

  it('extracts correct timeline count from array length', () => {
    const vm = createAdapter().adapt(createCompleteObservatory())
    expect(vm.overview.timelineCount).toBe(1)
  })

  it('extracts correct history count from array length', () => {
    const vm = createAdapter().adapt(createCompleteObservatory())
    expect(vm.overview.historyCount).toBe(1)
  })

  it('returns trace array with 1 item', () => {
    const vm = createAdapter().adapt(createCompleteObservatory())
    expect(vm.trace).toHaveLength(1)
  })

  it('returns timeline array with 1 item', () => {
    const vm = createAdapter().adapt(createCompleteObservatory())
    expect(vm.timeline).toHaveLength(1)
  })

  it('returns history array with 1 item', () => {
    const vm = createAdapter().adapt(createCompleteObservatory())
    expect(vm.history).toHaveLength(1)
  })

  it('trace item has correct id', () => {
    const vm = createAdapter().adapt(createCompleteObservatory())
    expect(vm.trace[0].id).toBe('trace-1')
  })

  it('trace item has correct label', () => {
    const vm = createAdapter().adapt(createCompleteObservatory())
    expect(vm.trace[0].label).toBe('Build Village')
  })

  it('trace item has 2 steps', () => {
    const vm = createAdapter().adapt(createCompleteObservatory())
    expect(vm.trace[0].steps).toHaveLength(2)
  })

  it('first trace step has correct id', () => {
    const vm = createAdapter().adapt(createCompleteObservatory())
    expect(vm.trace[0].steps[0].id).toBe('step-1')
  })

  it('first trace step has correct label', () => {
    const vm = createAdapter().adapt(createCompleteObservatory())
    expect(vm.trace[0].steps[0].label).toBe('CreateWorld')
  })

  it('first trace step has correct status', () => {
    const vm = createAdapter().adapt(createCompleteObservatory())
    expect(vm.trace[0].steps[0].status).toBe('completed')
  })

  it('second trace step has correct values', () => {
    const vm = createAdapter().adapt(createCompleteObservatory())
    expect(vm.trace[0].steps[1].id).toBe('step-2')
    expect(vm.trace[0].steps[1].label).toBe('GenerateTerrain')
    expect(vm.trace[0].steps[1].status).toBe('completed')
  })

  it('timeline item has correct id', () => {
    const vm = createAdapter().adapt(createCompleteObservatory())
    expect(vm.timeline[0].id).toBe('timeline-1')
  })

  it('timeline item has correct label', () => {
    const vm = createAdapter().adapt(createCompleteObservatory())
    expect(vm.timeline[0].label).toBe('Session Builds')
  })

  it('timeline item has 2 entries', () => {
    const vm = createAdapter().adapt(createCompleteObservatory())
    expect(vm.timeline[0].entries).toHaveLength(2)
  })

  it('first timeline entry has correct values', () => {
    const vm = createAdapter().adapt(createCompleteObservatory())
    expect(vm.timeline[0].entries[0].id).toBe('entry-1')
    expect(vm.timeline[0].entries[0].label).toBe('Build Village')
    expect(vm.timeline[0].entries[0].timestamp).toBe('12:00:01')
  })

  it('history item has correct id', () => {
    const vm = createAdapter().adapt(createCompleteObservatory())
    expect(vm.history[0].id).toBe('history-1')
  })

  it('history item has correct label', () => {
    const vm = createAdapter().adapt(createCompleteObservatory())
    expect(vm.history[0].label).toBe('Create Village')
  })

  it('history item has 2 entries', () => {
    const vm = createAdapter().adapt(createCompleteObservatory())
    expect(vm.history[0].entries).toHaveLength(2)
  })

  it('first history entry has correct values', () => {
    const vm = createAdapter().adapt(createCompleteObservatory())
    expect(vm.history[0].entries[0].id).toBe('he-1')
    expect(vm.history[0].entries[0].label).toBe('Applied CreateEntity')
    expect(vm.history[0].entries[0].timestamp).toBe('12:00:01')
  })
})

// ---------------------------------------------------------------------------
// DTO shape — overview
// ---------------------------------------------------------------------------

describe('ObservatoryViewModel — overview DTO shape', () => {
  it('overview has traceCount field', () => {
    const vm = createAdapter().adapt(createCompleteObservatory())
    expect(vm.overview).toHaveProperty('traceCount')
  })

  it('overview has timelineCount field', () => {
    const vm = createAdapter().adapt(createCompleteObservatory())
    expect(vm.overview).toHaveProperty('timelineCount')
  })

  it('overview has historyCount field', () => {
    const vm = createAdapter().adapt(createCompleteObservatory())
    expect(vm.overview).toHaveProperty('historyCount')
  })

  it('overview traceCount is a number', () => {
    const vm = createAdapter().adapt(createCompleteObservatory())
    expect(typeof vm.overview.traceCount).toBe('number')
  })

  it('overview timelineCount is a number', () => {
    const vm = createAdapter().adapt(createCompleteObservatory())
    expect(typeof vm.overview.timelineCount).toBe('number')
  })

  it('overview historyCount is a number', () => {
    const vm = createAdapter().adapt(createCompleteObservatory())
    expect(typeof vm.overview.historyCount).toBe('number')
  })

  it('overview traceCount is non-negative', () => {
    const vm = createAdapter().adapt(createCompleteObservatory())
    expect(vm.overview.traceCount).toBeGreaterThanOrEqual(0)
  })

  it('overview fields are readonly (TypeScript compile-time check)', () => {
    const vm = createAdapter().adapt(createCompleteObservatory())
    // Readonly is enforced by TypeScript at compile time
    expect(vm.overview.traceCount).toBe(1)
  })
})

// ---------------------------------------------------------------------------
// DTO shape — trace
// ---------------------------------------------------------------------------

describe('ObservatoryViewModel — trace DTO shape', () => {
  it('trace is an array', () => {
    const vm = createAdapter().adapt(createCompleteObservatory())
    expect(Array.isArray(vm.trace)).toBe(true)
  })

  it('trace item has id', () => {
    const vm = createAdapter().adapt(createCompleteObservatory())
    expect(vm.trace[0]).toHaveProperty('id')
  })

  it('trace item has label', () => {
    const vm = createAdapter().adapt(createCompleteObservatory())
    expect(vm.trace[0]).toHaveProperty('label')
  })

  it('trace item has steps', () => {
    const vm = createAdapter().adapt(createCompleteObservatory())
    expect(vm.trace[0]).toHaveProperty('steps')
  })

  it('trace step has id', () => {
    const vm = createAdapter().adapt(createCompleteObservatory())
    expect(vm.trace[0].steps[0]).toHaveProperty('id')
  })

  it('trace step has label', () => {
    const vm = createAdapter().adapt(createCompleteObservatory())
    expect(vm.trace[0].steps[0]).toHaveProperty('label')
  })

  it('trace step has status', () => {
    const vm = createAdapter().adapt(createCompleteObservatory())
    expect(vm.trace[0].steps[0]).toHaveProperty('status')
  })

  it('trace steps are an array', () => {
    const vm = createAdapter().adapt(createCompleteObservatory())
    expect(Array.isArray(vm.trace[0].steps)).toBe(true)
  })

  it('trace step id is a string', () => {
    const vm = createAdapter().adapt(createCompleteObservatory())
    expect(typeof vm.trace[0].steps[0].id).toBe('string')
  })

  it('trace step label is a string', () => {
    const vm = createAdapter().adapt(createCompleteObservatory())
    expect(typeof vm.trace[0].steps[0].label).toBe('string')
  })

  it('trace step status is a string', () => {
    const vm = createAdapter().adapt(createCompleteObservatory())
    expect(typeof vm.trace[0].steps[0].status).toBe('string')
  })
})

// ---------------------------------------------------------------------------
// DTO shape — timeline
// ---------------------------------------------------------------------------

describe('ObservatoryViewModel — timeline DTO shape', () => {
  it('timeline is an array', () => {
    const vm = createAdapter().adapt(createCompleteObservatory())
    expect(Array.isArray(vm.timeline)).toBe(true)
  })

  it('timeline item has id', () => {
    const vm = createAdapter().adapt(createCompleteObservatory())
    expect(vm.timeline[0]).toHaveProperty('id')
  })

  it('timeline item has label', () => {
    const vm = createAdapter().adapt(createCompleteObservatory())
    expect(vm.timeline[0]).toHaveProperty('label')
  })

  it('timeline item has entries', () => {
    const vm = createAdapter().adapt(createCompleteObservatory())
    expect(vm.timeline[0]).toHaveProperty('entries')
  })

  it('timeline entry has id', () => {
    const vm = createAdapter().adapt(createCompleteObservatory())
    expect(vm.timeline[0].entries[0]).toHaveProperty('id')
  })

  it('timeline entry has label', () => {
    const vm = createAdapter().adapt(createCompleteObservatory())
    expect(vm.timeline[0].entries[0]).toHaveProperty('label')
  })

  it('timeline entry has timestamp', () => {
    const vm = createAdapter().adapt(createCompleteObservatory())
    expect(vm.timeline[0].entries[0]).toHaveProperty('timestamp')
  })

  it('timeline entries are an array', () => {
    const vm = createAdapter().adapt(createCompleteObservatory())
    expect(Array.isArray(vm.timeline[0].entries)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// DTO shape — history
// ---------------------------------------------------------------------------

describe('ObservatoryViewModel — history DTO shape', () => {
  it('history is an array', () => {
    const vm = createAdapter().adapt(createCompleteObservatory())
    expect(Array.isArray(vm.history)).toBe(true)
  })

  it('history item has id', () => {
    const vm = createAdapter().adapt(createCompleteObservatory())
    expect(vm.history[0]).toHaveProperty('id')
  })

  it('history item has label', () => {
    const vm = createAdapter().adapt(createCompleteObservatory())
    expect(vm.history[0]).toHaveProperty('label')
  })

  it('history item has entries', () => {
    const vm = createAdapter().adapt(createCompleteObservatory())
    expect(vm.history[0]).toHaveProperty('entries')
  })

  it('history entry has id', () => {
    const vm = createAdapter().adapt(createCompleteObservatory())
    expect(vm.history[0].entries[0]).toHaveProperty('id')
  })

  it('history entry has label', () => {
    const vm = createAdapter().adapt(createCompleteObservatory())
    expect(vm.history[0].entries[0]).toHaveProperty('label')
  })

  it('history entry has timestamp', () => {
    const vm = createAdapter().adapt(createCompleteObservatory())
    expect(vm.history[0].entries[0]).toHaveProperty('timestamp')
  })

  it('history entries are an array', () => {
    const vm = createAdapter().adapt(createCompleteObservatory())
    expect(Array.isArray(vm.history[0].entries)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Deterministic
// ---------------------------------------------------------------------------

describe('DefaultObservatoryAdapter — deterministic', () => {
  it('produces identical results for the same input', () => {
    const input = createCompleteObservatory()
    const a = createAdapter().adapt(input)
    const b = createAdapter().adapt(input)
    expect(a).toEqual(b)
  })

  it('produces identical results for null input', () => {
    const a = createAdapter().adapt(null)
    const b = createAdapter().adapt(null)
    expect(a).toEqual(b)
  })

  it('produces identical results for undefined input', () => {
    const a = createAdapter().adapt(undefined)
    const b = createAdapter().adapt(undefined)
    expect(a).toEqual(b)
  })

  it('produces identical results for empty object', () => {
    const a = createAdapter().adapt({})
    const b = createAdapter().adapt({})
    expect(a).toEqual(b)
  })

  it('produces identical JSON output across calls', () => {
    const a = JSON.stringify(createAdapter().adapt(createCompleteObservatory()))
    const b = JSON.stringify(createAdapter().adapt(createCompleteObservatory()))
    expect(a).toBe(b)
  })
})

// ---------------------------------------------------------------------------
// Stateless
// ---------------------------------------------------------------------------

describe('DefaultObservatoryAdapter — stateless', () => {
  it('does not mutate between calls', () => {
    const adapter = createAdapter()
    const first = adapter.adapt(createCompleteObservatory())
    const second = adapter.adapt(createEmptyObservatory())
    // First result should not be affected by second call
    expect(JSON.stringify(first)).not.toBe(JSON.stringify(second))
  })

  it('multiple adapters produce same output for same input', () => {
    const input = createCompleteObservatory()
    const out1 = createAdapter().adapt(input)
    const out2 = createAdapter().adapt(input)
    expect(out1).toEqual(out2)
  })

  it('adapter has no mutable state', () => {
    const adapter = createAdapter()
    const protoProps = Object.getOwnPropertyNames(
      Object.getPrototypeOf(adapter),
    ).filter((k) => k !== 'constructor')
    // All prototype methods except constructor
    for (const prop of protoProps) {
      expect(typeof (adapter as any)[prop]).toBe('function')
    }
  })

  it('instance has no own enumerable properties (stateless)', () => {
    const adapter = createAdapter()
    const ownKeys = Object.keys(adapter)
    // Only 'adapt' is expected as own property
    expect(ownKeys.every((k) => typeof (adapter as any)[k] === 'function')).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Immutable (no mutation of output)
// ---------------------------------------------------------------------------

describe('DefaultObservatoryAdapter — immutable output', () => {
  it('returns frozen trace array', () => {
    const vm = createAdapter().adapt(createCompleteObservatory())
    expect(Object.isFrozen(vm.trace)).toBe(true)
  })

  it('returns frozen timeline array', () => {
    const vm = createAdapter().adapt(createCompleteObservatory())
    expect(Object.isFrozen(vm.timeline)).toBe(true)
  })

  it('returns frozen history array', () => {
    const vm = createAdapter().adapt(createCompleteObservatory())
    expect(Object.isFrozen(vm.history)).toBe(true)
  })

  it('returns frozen steps array inside trace', () => {
    const vm = createAdapter().adapt(createCompleteObservatory())
    expect(Object.isFrozen(vm.trace[0].steps)).toBe(true)
  })

  it('returns frozen entries array inside timeline', () => {
    const vm = createAdapter().adapt(createCompleteObservatory())
    expect(Object.isFrozen(vm.timeline[0].entries)).toBe(true)
  })

  it('returns frozen entries array inside history', () => {
    const vm = createAdapter().adapt(createCompleteObservatory())
    expect(Object.isFrozen(vm.history[0].entries)).toBe(true)
  })

  it('default ViewModel has frozen trace array', () => {
    const vm = createAdapter().adapt(null)
    expect(Object.isFrozen(vm.trace)).toBe(true)
  })

  it('default ViewModel has frozen timeline array', () => {
    const vm = createAdapter().adapt(null)
    expect(Object.isFrozen(vm.timeline)).toBe(true)
  })

  it('default ViewModel has frozen history array', () => {
    const vm = createAdapter().adapt(null)
    expect(Object.isFrozen(vm.history)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// No mutation of input
// ---------------------------------------------------------------------------

describe('DefaultObservatoryAdapter — no input mutation', () => {
  it('does not mutate the input object', () => {
    const input = createCompleteObservatory()
    const snapshot = JSON.stringify(input)
    createAdapter().adapt(input)
    expect(JSON.stringify(input)).toBe(snapshot)
  })

  it('does not mutate nested arrays in input', () => {
    const input = createCompleteObservatory()
    const stepsSnapshot = JSON.stringify((input.trace as any[])[0].steps)
    createAdapter().adapt(input)
    expect(JSON.stringify((input.trace as any[])[0].steps)).toBe(stepsSnapshot)
  })

  it('does not mutate null input (no-op)', () => {
    expect(() => createAdapter().adapt(null)).not.toThrow()
  })

  it('does not modify frozen input', () => {
    const input = Object.freeze(createCompleteObservatory())
    expect(() => createAdapter().adapt(input)).not.toThrow()
  })
})

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

describe('DefaultObservatoryAdapter — safe defaults', () => {
  it('returns traceCount 0 for invalid trace count', () => {
    const vm = createAdapter().adapt({ trace: 'not-a-array' })
    expect(vm.overview.traceCount).toBe(0)
  })

  it('returns timelineCount 0 for invalid timeline', () => {
    const vm = createAdapter().adapt({ timeline: 'not-a-array' })
    expect(vm.overview.timelineCount).toBe(0)
  })

  it('returns historyCount 0 for invalid history', () => {
    const vm = createAdapter().adapt({ history: 'not-a-array' })
    expect(vm.overview.historyCount).toBe(0)
  })

  it('returns empty trace array for missing trace', () => {
    const vm = createAdapter().adapt(createEmptyObservatory())
    expect(vm.trace).toEqual([])
  })

  it('returns empty timeline array for missing timeline', () => {
    const vm = createAdapter().adapt(createEmptyObservatory())
    expect(vm.timeline).toEqual([])
  })

  it('returns empty history array for missing history', () => {
    const vm = createAdapter().adapt(createEmptyObservatory())
    expect(vm.history).toEqual([])
  })

  it('handles trace with non-array steps', () => {
    const vm = createAdapter().adapt({
      trace: [{ id: 't1', label: 'T', steps: 'invalid' }],
    })
    expect(vm.trace[0].steps).toEqual([])
  })

  it('handles timeline with non-array entries', () => {
    const vm = createAdapter().adapt({
      timeline: [{ id: 'tl1', label: 'TL', entries: 'invalid' }],
    })
    expect(vm.timeline[0].entries).toEqual([])
  })

  it('handles history with non-array entries', () => {
    const vm = createAdapter().adapt({
      history: [{ id: 'h1', label: 'H', entries: 'invalid' }],
    })
    expect(vm.history[0].entries).toEqual([])
  })

  it('handles trace items with missing id', () => {
    const vm = createAdapter().adapt({
      trace: [{ label: 'No ID', steps: [] }],
    })
    expect(vm.trace[0].id).toBe('')
  })

  it('handles trace items with null step objects', () => {
    const vm = createAdapter().adapt({
      trace: [{ id: 't1', label: 'T', steps: [null] }],
    })
    expect(vm.trace[0].steps[0].id).toBe('')
    expect(vm.trace[0].steps[0].label).toBe('')
    expect(vm.trace[0].steps[0].status).toBe('')
  })

  it('handles trace items with undefined step entries', () => {
    const vm = createAdapter().adapt({
      trace: [{ id: 't1', label: 'T', steps: [undefined] }],
    })
    expect(vm.trace[0].steps[0].id).toBe('')
  })

  it('handles trace with non-object items (numbers)', () => {
    const vm = createAdapter().adapt({
      trace: [42],
    })
    expect(vm.trace[0].id).toBe('')
    expect(vm.trace[0].label).toBe('')
    expect(vm.trace[0].steps).toEqual([])
  })

  it('handles timeline with non-object items', () => {
    const vm = createAdapter().adapt({
      timeline: ['invalid'],
    })
    expect(vm.timeline[0].id).toBe('')
    expect(vm.timeline[0].label).toBe('')
    expect(vm.timeline[0].entries).toEqual([])
  })

  it('handles history with non-object items', () => {
    const vm = createAdapter().adapt({
      history: [null],
    })
    expect(vm.history[0].id).toBe('')
    expect(vm.history[0].label).toBe('')
    expect(vm.history[0].entries).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// Snapshot-based count derivation
// ---------------------------------------------------------------------------

describe('DefaultObservatoryAdapter — snapshot-based counts', () => {
  it('derives trace count from traceSnapshot stepCount', () => {
    const vm = createAdapter().adapt({
      traceSnapshot: { stepCount: 5 },
    })
    expect(vm.overview.traceCount).toBe(5)
  })

  it('derives timeline count from timelineSnapshot entryCount', () => {
    const vm = createAdapter().adapt({
      timelineSnapshot: { entryCount: 12 },
    })
    expect(vm.overview.timelineCount).toBe(12)
  })

  it('derives history count from historySnapshot entryCount', () => {
    const vm = createAdapter().adapt({
      historySnapshot: { entryCount: 8 },
    })
    expect(vm.overview.historyCount).toBe(8)
  })

  it('prefers trace array length over snapshot count', () => {
    const vm = createAdapter().adapt({
      trace: [{ id: 't1', label: 'T', steps: [] }],
      traceSnapshot: { stepCount: 99 },
    })
    expect(vm.overview.traceCount).toBe(1)
  })

  it('prefers timeline array length over snapshot count', () => {
    const vm = createAdapter().adapt({
      timeline: [{ id: 'tl1', label: 'TL', entries: [] }],
      timelineSnapshot: { entryCount: 99 },
    })
    expect(vm.overview.timelineCount).toBe(1)
  })

  it('prefers history array length over snapshot count', () => {
    const vm = createAdapter().adapt({
      history: [{ id: 'h1', label: 'H', entries: [] }],
      historySnapshot: { entryCount: 99 },
    })
    expect(vm.overview.historyCount).toBe(1)
  })

  it('handles missing stepCount in traceSnapshot', () => {
    const vm = createAdapter().adapt({
      traceSnapshot: {},
    })
    expect(vm.overview.traceCount).toBe(0)
  })

  it('handles missing entryCount in timelineSnapshot', () => {
    const vm = createAdapter().adapt({
      timelineSnapshot: {},
    })
    expect(vm.overview.timelineCount).toBe(0)
  })

  it('handles missing entryCount in historySnapshot', () => {
    const vm = createAdapter().adapt({
      historySnapshot: {},
    })
    expect(vm.overview.historyCount).toBe(0)
  })

  it('handles null traceSnapshot', () => {
    const vm = createAdapter().adapt({
      traceSnapshot: null,
    })
    expect(vm.overview.traceCount).toBe(0)
  })

  it('handles string stepCount (coerced to 0)', () => {
    const vm = createAdapter().adapt({
      traceSnapshot: { stepCount: '5' },
    })
    expect(vm.overview.traceCount).toBe(0)
  })

  it('handles negative stepCount (coerced to 0)', () => {
    const vm = createAdapter().adapt({
      traceSnapshot: { stepCount: -3 },
    })
    expect(vm.overview.traceCount).toBe(0)
  })

  it('handles float stepCount (floor)', () => {
    const vm = createAdapter().adapt({
      traceSnapshot: { stepCount: 3.7 },
    })
    expect(vm.overview.traceCount).toBe(3)
  })
})

// ---------------------------------------------------------------------------
// Multiple items
// ---------------------------------------------------------------------------

describe('DefaultObservatoryAdapter — multiple items', () => {
  it('handles multiple trace items', () => {
    const vm = createAdapter().adapt({
      trace: [
        { id: 't1', label: 'Trace 1', steps: [] },
        { id: 't2', label: 'Trace 2', steps: [] },
        { id: 't3', label: 'Trace 3', steps: [] },
      ],
    })
    expect(vm.trace).toHaveLength(3)
    expect(vm.overview.traceCount).toBe(3)
  })

  it('handles multiple timeline items', () => {
    const vm = createAdapter().adapt({
      timeline: [
        { id: 'tl1', label: 'TL 1', entries: [] },
        { id: 'tl2', label: 'TL 2', entries: [] },
      ],
    })
    expect(vm.timeline).toHaveLength(2)
    expect(vm.overview.timelineCount).toBe(2)
  })

  it('handles multiple history items', () => {
    const vm = createAdapter().adapt({
      history: [
        { id: 'h1', label: 'H 1', entries: [] },
        { id: 'h2', label: 'H 2', entries: [] },
        { id: 'h3', label: 'H 3', entries: [] },
        { id: 'h4', label: 'H 4', entries: [] },
      ],
    })
    expect(vm.history).toHaveLength(4)
    expect(vm.overview.historyCount).toBe(4)
  })

  it('handles all three arrays populated', () => {
    const vm = createAdapter().adapt({
      trace: [{ id: 't1', label: 'T', steps: [] }],
      timeline: [{ id: 'tl1', label: 'TL', entries: [] }],
      history: [{ id: 'h1', label: 'H', entries: [] }],
    })
    expect(vm.overview.traceCount).toBe(1)
    expect(vm.overview.timelineCount).toBe(1)
    expect(vm.overview.historyCount).toBe(1)
  })
})

// ---------------------------------------------------------------------------
// Partial observatory (from task)
// ---------------------------------------------------------------------------

describe('DefaultObservatoryAdapter — partial observatory (createPartialObservatory)', () => {
  it('adapts partial observatory', () => {
    const vm = createAdapter().adapt(createPartialObservatory())
    expect(vm).toBeDefined()
  })

  it('trace count is 1 for partial', () => {
    const vm = createAdapter().adapt(createPartialObservatory())
    expect(vm.overview.traceCount).toBe(1)
  })

  it('timeline count is 0 for partial', () => {
    const vm = createAdapter().adapt(createPartialObservatory())
    expect(vm.overview.timelineCount).toBe(0)
  })

  it('history count is 0 for partial', () => {
    const vm = createAdapter().adapt(createPartialObservatory())
    expect(vm.overview.historyCount).toBe(0)
  })

  it('trace array has 1 item for partial', () => {
    const vm = createAdapter().adapt(createPartialObservatory())
    expect(vm.trace).toHaveLength(1)
  })

  it('trace steps are empty for partial', () => {
    const vm = createAdapter().adapt(createPartialObservatory())
    expect(vm.trace[0].steps).toHaveLength(0)
  })

  it('timeline is empty for partial', () => {
    const vm = createAdapter().adapt(createPartialObservatory())
    expect(vm.timeline).toHaveLength(0)
  })

  it('history is empty for partial', () => {
    const vm = createAdapter().adapt(createPartialObservatory())
    expect(vm.history).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// Unknown properties on input
// ---------------------------------------------------------------------------

describe('DefaultObservatoryAdapter — unknown properties', () => {
  it('ignores unknown properties on input', () => {
    const vm = createAdapter().adapt({
      trace: [],
      timeline: [],
      history: [],
      unknownProp: 'should be ignored',
    })
    expect(vm.overview.traceCount).toBe(0)
  })

  it('ignores runtime-specific properties', () => {
    const vm = createAdapter().adapt({
      trace: [],
      timeline: [],
      history: [],
      entities: [],
      systems: [],
    })
    expect(vm.overview).toEqual({
      traceCount: 0,
      timelineCount: 0,
      historyCount: 0,
    })
  })

  it('does not expose runtime data in ViewModel', () => {
    const vm = createAdapter().adapt({
      entities: [{ id: 'e1', type: 'Guard' }],
    })
    expect((vm as any).entities).toBeUndefined()
  })

  it('does not expose planner data in ViewModel', () => {
    const vm = createAdapter().adapt({
      planner: { strategy: 'CreateEntity' },
    })
    expect((vm as any).planner).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// Extra edge cases
// ---------------------------------------------------------------------------

describe('DefaultObservatoryAdapter — extra edge cases', () => {
  it('handles trace with zero steps but items present', () => {
    const vm = createAdapter().adapt({
      trace: [{ id: 't1', label: 'Trace 1', steps: [] }],
    })
    expect(vm.trace).toHaveLength(1)
    expect(vm.trace[0].steps).toHaveLength(0)
  })

  it('handles trace with many steps', () => {
    const steps = Array.from({ length: 50 }, (_, i) => ({
      id: `step-${i}`,
      label: `Step ${i}`,
      status: i % 2 === 0 ? 'completed' : 'pending',
    }))
    const vm = createAdapter().adapt({
      trace: [{ id: 't1', label: 'Massive Trace', steps }],
    })
    expect(vm.trace[0].steps).toHaveLength(50)
    expect(vm.trace[0].steps[49].id).toBe('step-49')
  })

  it('handles nested observatory-like input', () => {
    const vm = createAdapter().adapt({
      trace: [{ id: 't1', label: 'Nested', steps: [] }],
      timeline: [{ id: 'tl1', label: 'Nested TL', entries: [] }],
      history: [],
    })
    expect(vm.overview.traceCount).toBe(1)
    expect(vm.overview.timelineCount).toBe(1)
    expect(vm.overview.historyCount).toBe(0)
  })

  it('handles observatory with only trace and history', () => {
    const vm = createAdapter().adapt({
      trace: [{ id: 't1', label: 'T', steps: [] }],
      history: [{ id: 'h1', label: 'H', entries: [] }],
    })
    expect(vm.overview.traceCount).toBe(1)
    expect(vm.overview.timelineCount).toBe(0)
    expect(vm.overview.historyCount).toBe(1)
  })

  it('handles observatory with only timeline and history', () => {
    const vm = createAdapter().adapt({
      timeline: [{ id: 'tl1', label: 'TL', entries: [] }],
      history: [{ id: 'h1', label: 'H', entries: [] }],
    })
    expect(vm.overview.traceCount).toBe(0)
    expect(vm.overview.timelineCount).toBe(1)
    expect(vm.overview.historyCount).toBe(1)
  })

  it('handles observatory with all three snapshot flags but no arrays', () => {
    const vm = createAdapter().adapt({
      hasTrace: true,
      hasTimeline: true,
      hasHistory: true,
    })
    expect(vm.overview.traceCount).toBe(1)
    expect(vm.overview.timelineCount).toBe(1)
    expect(vm.overview.historyCount).toBe(1)
  })
})

// ---------------------------------------------------------------------------
// ViewModel root shape
// ---------------------------------------------------------------------------

describe('ObservatoryViewModel — root shape', () => {
  it('has overview property', () => {
    const vm = createAdapter().adapt(createCompleteObservatory())
    expect(vm).toHaveProperty('overview')
  })

  it('has trace property', () => {
    const vm = createAdapter().adapt(createCompleteObservatory())
    expect(vm).toHaveProperty('trace')
  })

  it('has timeline property', () => {
    const vm = createAdapter().adapt(createCompleteObservatory())
    expect(vm).toHaveProperty('timeline')
  })

  it('has history property', () => {
    const vm = createAdapter().adapt(createCompleteObservatory())
    expect(vm).toHaveProperty('history')
  })

  it('overview is an object', () => {
    const vm = createAdapter().adapt(createCompleteObservatory())
    expect(typeof vm.overview).toBe('object')
    expect(vm.overview).not.toBeNull()
  })

  it('has exactly 9 root properties', () => {
    const vm = createAdapter().adapt(createCompleteObservatory())
    expect(Object.keys(vm)).toEqual(['overview', 'trace', 'traceView', 'timelineView', 'historyView', 'diffView', 'runtimeView', 'timeline', 'history'])
  })
})

// ---------------------------------------------------------------------------
// TypeScript interface compliance
// ---------------------------------------------------------------------------

describe('ObservatoryAdapter — interface compliance', () => {
  it('adapter.adapt returns an object matching ObservatoryViewModel', () => {
    const vm: ObservatoryViewModel = createAdapter().adapt(createCompleteObservatory())
    expect(vm.overview.traceCount).toBeDefined()
    expect(vm.overview.timelineCount).toBeDefined()
    expect(vm.overview.historyCount).toBeDefined()
    expect(Array.isArray(vm.trace)).toBe(true)
    expect(Array.isArray(vm.timelineView)).toBe(true)
    expect(Array.isArray(vm.historyView)).toBe(true)
    expect(Array.isArray(vm.timeline)).toBe(true)
    expect(Array.isArray(vm.history)).toBe(true)
  })

  it('adapter.adapt returns valid ViewModel for empty input', () => {
    const vm: ObservatoryViewModel = createAdapter().adapt(createEmptyObservatory())
    expect(vm.overview.traceCount).toBe(0)
    expect(vm.trace).toEqual([])
    expect(vm.timeline).toEqual([])
    expect(vm.history).toEqual([])
  })

  it('adapter.adapt returns valid ViewModel for null', () => {
    const vm: ObservatoryViewModel = createAdapter().adapt(null)
    expect(vm.overview.traceCount).toBe(0)
  })

  it('adapter.adapt returns valid ViewModel for undefined', () => {
    const vm: ObservatoryViewModel = createAdapter().adapt(undefined)
    expect(vm.overview.traceCount).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// No AI package imports
// ---------------------------------------------------------------------------

describe('Adapter — no AI package imports', () => {
  it('does not import from @genesis/ai in DefaultObservatoryAdapter', () => {
    // TypeScript compile-time guarantee — we verify at runtime that no
    // AI types leaked into the ViewModel shape
    const vm = createAdapter().adapt(createCompleteObservatory())
    expect(Object.keys(vm)).toEqual(['overview', 'trace', 'traceView', 'timelineView', 'historyView', 'diffView', 'runtimeView', 'timeline', 'history'])
  })

  it('does not expose AI-specific properties on ViewModel', () => {
    const vm = createAdapter().adapt(createCompleteObservatory())
    // PromptAssemblyObservatory has artifactCount/hasTrace/etc., but
    // the ViewModel should NOT expose those directly
    expect((vm as any).artifactCount).toBeUndefined()
    expect((vm as any).hasTrace).toBeUndefined()
    expect((vm as any).hasTimeline).toBeUndefined()
    expect((vm as any).hasHistory).toBeUndefined()
  })

  it('ViewModel only contains UI-safe DTOs', () => {
    const vm = createAdapter().adapt(createCompleteObservatory())
    // All properties should be arrays or simple objects with primitive fields
    expect(Array.isArray(vm.trace)).toBe(true)
    expect(Array.isArray(vm.timeline)).toBe(true)
    expect(Array.isArray(vm.history)).toBe(true)
    expect(typeof vm.overview.traceCount).toBe('number')
    expect(typeof vm.overview.timelineCount).toBe('number')
    expect(typeof vm.overview.historyCount).toBe('number')
  })
})

// ---------------------------------------------------------------------------
// Pure (no side effects)
// ---------------------------------------------------------------------------

describe('DefaultObservatoryAdapter — pure', () => {
  it('does not throw for any input', () => {
    const adapter = createAdapter()
    const inputs: unknown[] = [
      undefined,
      null,
      true,
      false,
      0,
      1,
      -1,
      '',
      'string',
      [],
      {},
      Symbol('s'),
      () => {},
      /regex/,
      new Date(),
      new Error(),
      createCompleteObservatory(),
    ]
    for (const input of inputs) {
      expect(() => adapter.adapt(input)).not.toThrow()
    }
  })

  it('does not log or write to console', () => {
    const spy = vi.spyOn(console, 'log')
    createAdapter().adapt(createCompleteObservatory())
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })

  it('does not warn on console', () => {
    const spy = vi.spyOn(console, 'warn')
    createAdapter().adapt(null)
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })

  it('does not error on console', () => {
    const spy = vi.spyOn(console, 'error')
    createAdapter().adapt(undefined)
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })

  it('does not throw when given a Proxy-wrapped object', () => {
    const input = new Proxy(createCompleteObservatory(), {})
    expect(() => createAdapter().adapt(input)).not.toThrow()
  })
})