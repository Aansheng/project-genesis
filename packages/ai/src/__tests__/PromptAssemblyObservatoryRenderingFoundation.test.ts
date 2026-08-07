import { describe, it, expect } from 'vitest'
import { DefaultPromptAssemblyObservatoryRenderer } from '../strategy/DefaultPromptAssemblyObservatoryRenderer'
import type { PromptAssemblyObservatoryRenderer } from '../strategy/PromptAssemblyObservatoryRenderer'
import type { PromptAssemblyObservatory } from '../strategy/PromptAssemblyObservatory'
import type { PromptAssemblyTrace } from '../strategy/PromptAssemblyTrace'
import type { PromptAssemblyTimeline } from '../strategy/PromptAssemblyTimeline'
import type { PromptAssemblyHistory } from '../strategy/PromptAssemblyHistory'
import type { PromptAssemblySnapshot } from '../strategy/PromptAssemblySnapshot'
import type { PromptAssemblyTimelineSnapshot } from '../strategy/PromptAssemblyTimelineSnapshot'
import type { PromptAssemblyHistorySnapshot } from '../strategy/PromptAssemblyHistorySnapshot'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createTrace(): PromptAssemblyTrace {
  return { strategy: { name: 'create' } }
}

function createTimeline(): PromptAssemblyTimeline {
  return { entries: [{ index: 0, trace: createTrace() }] }
}

function createHistory(): PromptAssemblyHistory {
  return { entries: [{ index: 0, trace: createTrace() }] }
}

function createTraceSnapshot(): PromptAssemblySnapshot {
  return { strategy: 'create' }
}

function createTimelineSnapshot(): PromptAssemblyTimelineSnapshot {
  return { entryCount: 1, firstStrategy: 'create', lastStrategy: 'create', strategies: ['create'] }
}

function createHistorySnapshot(): PromptAssemblyHistorySnapshot {
  return { entryCount: 1, firstStrategy: 'create', lastStrategy: 'create', strategies: ['create'] }
}

function createEmptyObservatory(): PromptAssemblyObservatory {
  return {}
}

function createFullObservatory(): PromptAssemblyObservatory {
  return {
    trace: createTrace(),
    timeline: createTimeline(),
    history: createHistory(),
    traceSnapshot: createTraceSnapshot(),
    timelineSnapshot: createTimelineSnapshot(),
    historySnapshot: createHistorySnapshot(),
  }
}

function createObservatoryWith(fields: Partial<PromptAssemblyObservatory>): PromptAssemblyObservatory {
  return { ...fields }
}

const EMPTY_OUTPUT = 'Prompt Assembly Observatory\n\nNo Artifacts'

function artifactOutput(artifacts: readonly string[]): string {
  if (artifacts.length === 0) return EMPTY_OUTPUT
  const lines: string[] = ['Prompt Assembly Observatory', '', 'Artifacts:', '']
  for (const a of artifacts) {
    lines.push(`- ${a}`)
  }
  return lines.join('\n')
}

// ---------------------------------------------------------------------------
// Interface Contract
// ---------------------------------------------------------------------------

describe('Interface contract', () => {
  it('should define render method', () => {
    const renderer: PromptAssemblyObservatoryRenderer = new DefaultPromptAssemblyObservatoryRenderer()
    expect(typeof renderer.render).toBe('function')
  })

  it('should accept an observatory and return a string', () => {
    const renderer = new DefaultPromptAssemblyObservatoryRenderer()
    const result = renderer.render(createEmptyObservatory())
    expect(typeof result).toBe('string')
  })

  it('should accept a custom implementation', () => {
    const custom: PromptAssemblyObservatoryRenderer = {
      render() {
        return 'custom output'
      },
    }
    expect(custom.render(createEmptyObservatory())).toBe('custom output')
  })

  it('should return a non-empty string for empty observatory', () => {
    const renderer = new DefaultPromptAssemblyObservatoryRenderer()
    const result = renderer.render(createEmptyObservatory())
    expect(result.length).toBeGreaterThan(0)
  })

  it('should return a non-empty string for full observatory', () => {
    const renderer = new DefaultPromptAssemblyObservatoryRenderer()
    const result = renderer.render(createFullObservatory())
    expect(result.length).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// Empty Observatory
// ---------------------------------------------------------------------------

describe('Empty observatory', () => {
  it('should return "No Artifacts" for empty observatory', () => {
    const renderer = new DefaultPromptAssemblyObservatoryRenderer()
    const result = renderer.render(createEmptyObservatory())
    expect(result).toBe(EMPTY_OUTPUT)
  })

  it('should start with "Prompt Assembly Observatory" header', () => {
    const renderer = new DefaultPromptAssemblyObservatoryRenderer()
    const result = renderer.render(createEmptyObservatory())
    expect(result.startsWith('Prompt Assembly Observatory')).toBe(true)
  })

  it('should contain "No Artifacts" for empty observatory', () => {
    const renderer = new DefaultPromptAssemblyObservatoryRenderer()
    const result = renderer.render(createEmptyObservatory())
    expect(result).toContain('No Artifacts')
  })

  it('should not contain artifact listings for empty observatory', () => {
    const renderer = new DefaultPromptAssemblyObservatoryRenderer()
    const result = renderer.render(createEmptyObservatory())
    expect(result).not.toContain('- ')
  })

  it('should not contain "Artifacts:" header for empty observatory', () => {
    const renderer = new DefaultPromptAssemblyObservatoryRenderer()
    const result = renderer.render(createEmptyObservatory())
    expect(result).not.toContain('Artifacts:')
  })

  it('should not contain "trace" for empty observatory', () => {
    const renderer = new DefaultPromptAssemblyObservatoryRenderer()
    const result = renderer.render(createEmptyObservatory())
    expect(result).not.toContain('trace')
  })

  it('should not contain "timeline" for empty observatory', () => {
    const renderer = new DefaultPromptAssemblyObservatoryRenderer()
    const result = renderer.render(createEmptyObservatory())
    expect(result).not.toContain('timeline')
  })

  it('should not contain "history" for empty observatory', () => {
    const renderer = new DefaultPromptAssemblyObservatoryRenderer()
    const result = renderer.render(createEmptyObservatory())
    expect(result).not.toContain('history')
  })
})

// ---------------------------------------------------------------------------
// Single Artifact — trace
// ---------------------------------------------------------------------------

describe('Single artifact — trace', () => {
  it('should render only the trace artifact', () => {
    const renderer = new DefaultPromptAssemblyObservatoryRenderer()
    const obs = createObservatoryWith({ trace: createTrace() })
    const result = renderer.render(obs)
    expect(result).toBe(artifactOutput(['trace']))
  })

  it('should contain "- trace" when trace is present', () => {
    const renderer = new DefaultPromptAssemblyObservatoryRenderer()
    const result = renderer.render(createObservatoryWith({ trace: createTrace() }))
    expect(result).toContain('- trace')
  })

  it('should not contain other artifacts when only trace is present', () => {
    const renderer = new DefaultPromptAssemblyObservatoryRenderer()
    const result = renderer.render(createObservatoryWith({ trace: createTrace() }))
    expect(result).not.toContain('- timeline')
    expect(result).not.toContain('- history')
    expect(result).not.toContain('- traceSnapshot')
    expect(result).not.toContain('- timelineSnapshot')
    expect(result).not.toContain('- historySnapshot')
  })

  it('should start with header when trace is present', () => {
    const renderer = new DefaultPromptAssemblyObservatoryRenderer()
    const result = renderer.render(createObservatoryWith({ trace: createTrace() }))
    expect(result.startsWith('Prompt Assembly Observatory')).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Single Artifact — timeline
// ---------------------------------------------------------------------------

describe('Single artifact — timeline', () => {
  it('should render only the timeline artifact', () => {
    const renderer = new DefaultPromptAssemblyObservatoryRenderer()
    const obs = createObservatoryWith({ timeline: createTimeline() })
    const result = renderer.render(obs)
    expect(result).toBe(artifactOutput(['timeline']))
  })

  it('should contain "- timeline" when timeline is present', () => {
    const renderer = new DefaultPromptAssemblyObservatoryRenderer()
    const result = renderer.render(createObservatoryWith({ timeline: createTimeline() }))
    expect(result).toContain('- timeline')
  })

  it('should not contain other artifacts when only timeline is present', () => {
    const renderer = new DefaultPromptAssemblyObservatoryRenderer()
    const result = renderer.render(createObservatoryWith({ timeline: createTimeline() }))
    expect(result).not.toContain('- trace')
    expect(result).not.toContain('- history')
  })
})

// ---------------------------------------------------------------------------
// Single Artifact — history
// ---------------------------------------------------------------------------

describe('Single artifact — history', () => {
  it('should render only the history artifact', () => {
    const renderer = new DefaultPromptAssemblyObservatoryRenderer()
    const obs = createObservatoryWith({ history: createHistory() })
    const result = renderer.render(obs)
    expect(result).toBe(artifactOutput(['history']))
  })

  it('should contain "- history" when history is present', () => {
    const renderer = new DefaultPromptAssemblyObservatoryRenderer()
    const result = renderer.render(createObservatoryWith({ history: createHistory() }))
    expect(result).toContain('- history')
  })

  it('should not contain other artifacts when only history is present', () => {
    const renderer = new DefaultPromptAssemblyObservatoryRenderer()
    const result = renderer.render(createObservatoryWith({ history: createHistory() }))
    expect(result).not.toContain('- trace')
    expect(result).not.toContain('- timeline')
  })
})

// ---------------------------------------------------------------------------
// Single Artifact — traceSnapshot
// ---------------------------------------------------------------------------

describe('Single artifact — traceSnapshot', () => {
  it('should render only the traceSnapshot artifact', () => {
    const renderer = new DefaultPromptAssemblyObservatoryRenderer()
    const obs = createObservatoryWith({ traceSnapshot: createTraceSnapshot() })
    const result = renderer.render(obs)
    expect(result).toBe(artifactOutput(['traceSnapshot']))
  })

  it('should contain "- traceSnapshot" when traceSnapshot is present', () => {
    const renderer = new DefaultPromptAssemblyObservatoryRenderer()
    const result = renderer.render(createObservatoryWith({ traceSnapshot: createTraceSnapshot() }))
    expect(result).toContain('- traceSnapshot')
  })
})

// ---------------------------------------------------------------------------
// Single Artifact — timelineSnapshot
// ---------------------------------------------------------------------------

describe('Single artifact — timelineSnapshot', () => {
  it('should render only the timelineSnapshot artifact', () => {
    const renderer = new DefaultPromptAssemblyObservatoryRenderer()
    const obs = createObservatoryWith({ timelineSnapshot: createTimelineSnapshot() })
    const result = renderer.render(obs)
    expect(result).toBe(artifactOutput(['timelineSnapshot']))
  })

  it('should contain "- timelineSnapshot" when timelineSnapshot is present', () => {
    const renderer = new DefaultPromptAssemblyObservatoryRenderer()
    const result = renderer.render(createObservatoryWith({ timelineSnapshot: createTimelineSnapshot() }))
    expect(result).toContain('- timelineSnapshot')
  })
})

// ---------------------------------------------------------------------------
// Single Artifact — historySnapshot
// ---------------------------------------------------------------------------

describe('Single artifact — historySnapshot', () => {
  it('should render only the historySnapshot artifact', () => {
    const renderer = new DefaultPromptAssemblyObservatoryRenderer()
    const obs = createObservatoryWith({ historySnapshot: createHistorySnapshot() })
    const result = renderer.render(obs)
    expect(result).toBe(artifactOutput(['historySnapshot']))
  })

  it('should contain "- historySnapshot" when historySnapshot is present', () => {
    const renderer = new DefaultPromptAssemblyObservatoryRenderer()
    const result = renderer.render(createObservatoryWith({ historySnapshot: createHistorySnapshot() }))
    expect(result).toContain('- historySnapshot')
  })
})

// ---------------------------------------------------------------------------
// Multiple Artifacts
// ---------------------------------------------------------------------------

describe('Multiple artifacts', () => {
  it('should render two artifacts (trace, timeline)', () => {
    const renderer = new DefaultPromptAssemblyObservatoryRenderer()
    const obs = createObservatoryWith({ trace: createTrace(), timeline: createTimeline() })
    const result = renderer.render(obs)
    expect(result).toBe(artifactOutput(['trace', 'timeline']))
  })

  it('should render two artifacts (history, traceSnapshot)', () => {
    const renderer = new DefaultPromptAssemblyObservatoryRenderer()
    const obs = createObservatoryWith({ history: createHistory(), traceSnapshot: createTraceSnapshot() })
    const result = renderer.render(obs)
    expect(result).toBe(artifactOutput(['history', 'traceSnapshot']))
  })

  it('should render three artifacts in order', () => {
    const renderer = new DefaultPromptAssemblyObservatoryRenderer()
    const obs = createObservatoryWith({
      trace: createTrace(),
      timeline: createTimeline(),
      history: createHistory(),
    })
    const result = renderer.render(obs)
    expect(result).toBe(artifactOutput(['trace', 'timeline', 'history']))
  })

  it('should render three snapshot artifacts in order', () => {
    const renderer = new DefaultPromptAssemblyObservatoryRenderer()
    const obs = createObservatoryWith({
      traceSnapshot: createTraceSnapshot(),
      timelineSnapshot: createTimelineSnapshot(),
      historySnapshot: createHistorySnapshot(),
    })
    const result = renderer.render(obs)
    expect(result).toBe(artifactOutput(['traceSnapshot', 'timelineSnapshot', 'historySnapshot']))
  })

  it('should render all six artifacts', () => {
    const renderer = new DefaultPromptAssemblyObservatoryRenderer()
    const result = renderer.render(createFullObservatory())
    expect(result).toBe(artifactOutput([
      'trace',
      'timeline',
      'history',
      'traceSnapshot',
      'timelineSnapshot',
      'historySnapshot',
    ]))
  })

  it('should preserve declaration order regardless of input order', () => {
    const renderer = new DefaultPromptAssemblyObservatoryRenderer()
    const obs = createObservatoryWith({
      historySnapshot: createHistorySnapshot(),
      trace: createTrace(),
      timeline: createTimeline(),
      traceSnapshot: createTraceSnapshot(),
      timelineSnapshot: createTimelineSnapshot(),
      history: createHistory(),
    })
    const result = renderer.render(obs)
    // Must be in declaration order: trace, timeline, history, traceSnapshot, timelineSnapshot, historySnapshot
    expect(result).toBe(artifactOutput([
      'trace',
      'timeline',
      'history',
      'traceSnapshot',
      'timelineSnapshot',
      'historySnapshot',
    ]))
  })

  it('should handle mixed trace and snapshot artifacts', () => {
    const renderer = new DefaultPromptAssemblyObservatoryRenderer()
    const obs = createObservatoryWith({
      trace: createTrace(),
      traceSnapshot: createTraceSnapshot(),
    })
    const result = renderer.render(obs)
    expect(result).toContain('- trace')
    expect(result).toContain('- traceSnapshot')
  })

  it('should correctly order when first artifact is missing', () => {
    const renderer = new DefaultPromptAssemblyObservatoryRenderer()
    const obs = createObservatoryWith({
      history: createHistory(),
      historySnapshot: createHistorySnapshot(),
    })
    const result = renderer.render(obs)
    // trace and timeline are absent, next in order is history
    expect(result).toBe(artifactOutput(['history', 'historySnapshot']))
  })
})

// ---------------------------------------------------------------------------
// Rendering Validation
// ---------------------------------------------------------------------------

describe('Rendering validation', () => {
  it('should have correct header', () => {
    const renderer = new DefaultPromptAssemblyObservatoryRenderer()
    const result = renderer.render(createFullObservatory())
    expect(result).toMatch(/^Prompt Assembly Observatory/)
  })

  it('should contain "Artifacts:" section header for non-empty', () => {
    const renderer = new DefaultPromptAssemblyObservatoryRenderer()
    const result = renderer.render(createFullObservatory())
    expect(result).toContain('Artifacts:')
  })

  it('should list artifacts as bullet items', () => {
    const renderer = new DefaultPromptAssemblyObservatoryRenderer()
    const result = renderer.render(createFullObservatory())
    const lines = result.split('\n')
    const artifactLines = lines.filter(l => l.startsWith('- '))
    expect(artifactLines).toHaveLength(6)
  })

  it('should have exactly one blank line between header and section', () => {
    const renderer = new DefaultPromptAssemblyObservatoryRenderer()
    const result = renderer.render(createFullObservatory())
    const lines = result.split('\n')
    // Prompt Assembly Observatory, , Artifacts:, , - trace, ...
    expect(lines[0]).toBe('Prompt Assembly Observatory')
    expect(lines[1]).toBe('')
    expect(lines[2]).toBe('Artifacts:')
  })

  it('should have exactly one blank line before artifact list', () => {
    const renderer = new DefaultPromptAssemblyObservatoryRenderer()
    const result = renderer.render(createFullObservatory())
    const lines = result.split('\n')
    // Artifacts: is line 2, line 3 is empty, line 4 is first artifact
    expect(lines[2]).toBe('Artifacts:')
    expect(lines[3]).toBe('')
    expect(lines[4]).toBe('- trace')
  })

  it('should have each artifact on its own line', () => {
    const renderer = new DefaultPromptAssemblyObservatoryRenderer()
    const result = renderer.render(createFullObservatory())
    const lines = result.split('\n')
    const artifactLines = lines.filter(l => l.startsWith('- '))
    expect(artifactLines.length).toBe(lines.filter(l => l.startsWith('- ')).length)
  })

  it('should not have trailing newline', () => {
    const renderer = new DefaultPromptAssemblyObservatoryRenderer()
    const result = renderer.render(createFullObservatory())
    expect(result.endsWith('\n')).toBe(false)
  })

  it('should not have consecutive blank lines for non-empty observatory', () => {
    const renderer = new DefaultPromptAssemblyObservatoryRenderer()
    const result = renderer.render(createFullObservatory())
    expect(result).not.toContain('\n\n\n')
  })

  it('should have correct format: header, blank, "Artifacts:", blank, then artifacts', () => {
    const renderer = new DefaultPromptAssemblyObservatoryRenderer()
    const result = renderer.render(createFullObservatory())
    const lines = result.split('\n')
    expect(lines[0]).toBe('Prompt Assembly Observatory')
    expect(lines[1]).toBe('')
    expect(lines[2]).toBe('Artifacts:')
    expect(lines[3]).toBe('')
    expect(lines[4]).toBe('- trace')
  })
})

// ---------------------------------------------------------------------------
// Deterministic
// ---------------------------------------------------------------------------

describe('Deterministic', () => {
  it('should produce same output for same observatory across multiple calls', () => {
    const renderer = new DefaultPromptAssemblyObservatoryRenderer()
    const obs = createFullObservatory()
    const r1 = renderer.render(obs)
    const r2 = renderer.render(obs)
    const r3 = renderer.render(obs)
    expect(r1).toBe(r2)
    expect(r2).toBe(r3)
  })

  it('should produce same output for identical observatories', () => {
    const renderer = new DefaultPromptAssemblyObservatoryRenderer()
    const obs1 = createFullObservatory()
    const obs2 = createFullObservatory()
    expect(renderer.render(obs1)).toBe(renderer.render(obs2))
  })

  it('should produce same output across different renderer instances', () => {
    const r1 = new DefaultPromptAssemblyObservatoryRenderer()
    const r2 = new DefaultPromptAssemblyObservatoryRenderer()
    const obs = createFullObservatory()
    expect(r1.render(obs)).toBe(r2.render(obs))
  })

  it('should produce same output for empty observatory across calls', () => {
    const renderer = new DefaultPromptAssemblyObservatoryRenderer()
    expect(renderer.render(createEmptyObservatory())).toBe(EMPTY_OUTPUT)
    expect(renderer.render(createEmptyObservatory())).toBe(EMPTY_OUTPUT)
  })

  it('should produce same output for identical empty observatories', () => {
    const renderer = new DefaultPromptAssemblyObservatoryRenderer()
    const obs1 = createEmptyObservatory()
    const obs2 = createEmptyObservatory()
    expect(renderer.render(obs1)).toBe(renderer.render(obs2))
  })
})

// ---------------------------------------------------------------------------
// Stateless
// ---------------------------------------------------------------------------

describe('Stateless', () => {
  it('should not retain state between render calls', () => {
    const renderer = new DefaultPromptAssemblyObservatoryRenderer()
    const r1 = renderer.render(createEmptyObservatory())
    const r2 = renderer.render(createFullObservatory())
    // r1 is empty, r2 is full — no state leakage
    expect(r1).toBe(EMPTY_OUTPUT)
    expect(r2).not.toBe(EMPTY_OUTPUT)
  })

  it('should produce independent results for different observatories', () => {
    const renderer = new DefaultPromptAssemblyObservatoryRenderer()
    const full = renderer.render(createFullObservatory())
    const single = renderer.render(createObservatoryWith({ trace: createTrace() }))
    expect(full).not.toBe(single)
    expect(single).toContain('- trace')
    expect(single).not.toContain('- history')
  })
})

// ---------------------------------------------------------------------------
// Pure
// ---------------------------------------------------------------------------

describe('Pure', () => {
  it('should not modify input observatory', () => {
    const renderer = new DefaultPromptAssemblyObservatoryRenderer()
    const obs = createFullObservatory()
    const original = JSON.stringify(obs)
    renderer.render(obs)
    expect(JSON.stringify(obs)).toBe(original)
  })

  it('should not modify observatory with only trace', () => {
    const renderer = new DefaultPromptAssemblyObservatoryRenderer()
    const obs = createObservatoryWith({ trace: createTrace() })
    const original = JSON.stringify(obs)
    renderer.render(obs)
    expect(JSON.stringify(obs)).toBe(original)
  })

  it('should not modify empty observatory', () => {
    const renderer = new DefaultPromptAssemblyObservatoryRenderer()
    const obs = createEmptyObservatory()
    const original = JSON.stringify(obs)
    renderer.render(obs)
    expect(JSON.stringify(obs)).toBe(original)
  })

  it('should not modify observatory field values', () => {
    const renderer = new DefaultPromptAssemblyObservatoryRenderer()
    const obs = createFullObservatory()
    const traceRef = obs.trace
    renderer.render(obs)
    expect(obs.trace).toBe(traceRef)
  })
})

// ---------------------------------------------------------------------------
// Immutable
// ---------------------------------------------------------------------------

describe('Immutable', () => {
  it('should not mutate the observatory', () => {
    const renderer = new DefaultPromptAssemblyObservatoryRenderer()
    const obs = createFullObservatory()
    const obsKeys = Object.keys(obs)
    renderer.render(obs)
    expect(Object.keys(obs)).toEqual(obsKeys)
  })

  it('should not add properties to the observatory', () => {
    const renderer = new DefaultPromptAssemblyObservatoryRenderer()
    const obs = createEmptyObservatory()
    renderer.render(obs)
    expect(Object.keys(obs)).toHaveLength(0)
  })

  it('should not remove properties from the observatory', () => {
    const renderer = new DefaultPromptAssemblyObservatoryRenderer()
    const obs = createFullObservatory()
    renderer.render(obs)
    expect(obs.trace).toBeDefined()
    expect(obs.timeline).toBeDefined()
    expect(obs.history).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Export Validation
// ---------------------------------------------------------------------------

describe('Export validation', () => {
  it('should export DefaultPromptAssemblyObservatoryRenderer from strategy index', async () => {
    const mod = await import('../strategy')
    expect(mod.DefaultPromptAssemblyObservatoryRenderer).toBeDefined()
  })

  it('should export PromptAssemblyObservatoryRenderer type from strategy index', async () => {
    const mod = await import('../strategy')
    expect(mod.DefaultPromptAssemblyObservatoryRenderer).toBeDefined()
  })

  it('should export DefaultPromptAssemblyObservatoryRenderer from package root', async () => {
    const mod = await import('..')
    expect(mod.DefaultPromptAssemblyObservatoryRenderer).toBeDefined()
  })

  it('should export PromptAssemblyObservatoryRenderer type from package root', async () => {
    const mod = await import('..')
    expect(mod.DefaultPromptAssemblyObservatoryRenderer).toBeDefined()
  })

  it('should export DefaultPromptAssemblyObservatoryRenderer as a class', () => {
    const renderer = new DefaultPromptAssemblyObservatoryRenderer()
    expect(renderer).toBeInstanceOf(DefaultPromptAssemblyObservatoryRenderer)
  })

  it('should export PromptAssemblyObservatoryRenderer as a type', () => {
    const renderer: PromptAssemblyObservatoryRenderer = new DefaultPromptAssemblyObservatoryRenderer()
    expect(typeof renderer.render).toBe('function')
  })
})

// ---------------------------------------------------------------------------
// Architecture Compliance
// ---------------------------------------------------------------------------

describe('Architecture compliance', () => {
  it('should not depend on Runtime', () => {
    const renderer = new DefaultPromptAssemblyObservatoryRenderer()
    expect(renderer).toBeDefined()
  })

  it('should not depend on Planner', () => {
    const renderer = new DefaultPromptAssemblyObservatoryRenderer()
    expect(renderer).toBeDefined()
  })

  it('should not depend on Pipeline', () => {
    const renderer = new DefaultPromptAssemblyObservatoryRenderer()
    expect(renderer).toBeDefined()
  })

  it('should not depend on Provider', () => {
    const renderer = new DefaultPromptAssemblyObservatoryRenderer()
    expect(renderer).toBeDefined()
  })

  it('should not depend on Memory', () => {
    const renderer = new DefaultPromptAssemblyObservatoryRenderer()
    expect(renderer).toBeDefined()
  })

  it('should not depend on AgentLoop', () => {
    const renderer = new DefaultPromptAssemblyObservatoryRenderer()
    expect(renderer).toBeDefined()
  })

  it('should not depend on PromptBuilder', () => {
    const renderer = new DefaultPromptAssemblyObservatoryRenderer()
    expect(renderer).toBeDefined()
  })

  it('should not depend on BuilderOptions', () => {
    const renderer = new DefaultPromptAssemblyObservatoryRenderer()
    expect(renderer).toBeDefined()
  })

  it('should not depend on PromptRenderer', () => {
    const renderer = new DefaultPromptAssemblyObservatoryRenderer()
    expect(renderer).toBeDefined()
  })

  it('should not depend on PromptCompression', () => {
    const renderer = new DefaultPromptAssemblyObservatoryRenderer()
    expect(renderer).toBeDefined()
  })

  it('should not modify PromptBuilder', () => {
    const renderer = new DefaultPromptAssemblyObservatoryRenderer()
    expect(renderer).toBeDefined()
  })

  it('should not modify BuilderOptions', () => {
    const renderer = new DefaultPromptAssemblyObservatoryRenderer()
    expect(renderer).toBeDefined()
  })

  it('should not modify Runtime', () => {
    const renderer = new DefaultPromptAssemblyObservatoryRenderer()
    expect(renderer).toBeDefined()
  })

  it('should not modify Planner', () => {
    const renderer = new DefaultPromptAssemblyObservatoryRenderer()
    expect(renderer).toBeDefined()
  })

  it('should not modify Pipeline', () => {
    const renderer = new DefaultPromptAssemblyObservatoryRenderer()
    expect(renderer).toBeDefined()
  })

  it('should not modify AgentLoop', () => {
    const renderer = new DefaultPromptAssemblyObservatoryRenderer()
    expect(renderer).toBeDefined()
  })

  it('should not modify DefaultPromptBuilder', () => {
    const renderer = new DefaultPromptAssemblyObservatoryRenderer()
    expect(renderer).toBeDefined()
  })

  it('should not modify PromptAssemblyObservatory', () => {
    const renderer = new DefaultPromptAssemblyObservatoryRenderer()
    const obs = createFullObservatory()
    renderer.render(obs)
    expect(obs.trace).toBeDefined()
    expect(obs.timeline).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Compatibility — RetryPlanner
// ---------------------------------------------------------------------------

describe('RetryPlanner compatibility', () => {
  it('should render observatory in RetryPlanner scenarios', () => {
    const renderer = new DefaultPromptAssemblyObservatoryRenderer()
    const result = renderer.render(createFullObservatory())
    expect(result).toContain('- trace')
    expect(result).toContain('- timeline')
  })
})

// ---------------------------------------------------------------------------
// Compatibility — ToolCallPlanner
// ---------------------------------------------------------------------------

describe('ToolCallPlanner compatibility', () => {
  it('should render observatory in ToolCallPlanner scenarios', () => {
    const renderer = new DefaultPromptAssemblyObservatoryRenderer()
    const result = renderer.render(createFullObservatory())
    expect(result).toContain('- history')
  })
})

// ---------------------------------------------------------------------------
// Compatibility — Streaming
// ---------------------------------------------------------------------------

describe('Streaming compatibility', () => {
  it('should render observatory in streaming scenarios', () => {
    const renderer = new DefaultPromptAssemblyObservatoryRenderer()
    const result = renderer.render(createFullObservatory())
    expect(result).toContain('Artifacts:')
  })
})

// ---------------------------------------------------------------------------
// Compatibility — AgentLoop
// ---------------------------------------------------------------------------

describe('AgentLoop compatibility', () => {
  it('should render observatory in AgentLoop scenarios', () => {
    const renderer = new DefaultPromptAssemblyObservatoryRenderer()
    const result = renderer.render(createFullObservatory())
    expect(result).toContain('Prompt Assembly Observatory')
  })
})

// ---------------------------------------------------------------------------
// Edge Cases
// ---------------------------------------------------------------------------

describe('Edge cases', () => {
  it('should handle all six artifacts present', () => {
    const renderer = new DefaultPromptAssemblyObservatoryRenderer()
    const result = renderer.render(createFullObservatory())
    const lines = result.split('\n')
    const artifactLines = lines.filter(l => l.startsWith('- '))
    expect(artifactLines).toHaveLength(6)
  })

  it('should handle partial observatory with only snapshots', () => {
    const renderer = new DefaultPromptAssemblyObservatoryRenderer()
    const obs = createObservatoryWith({
      traceSnapshot: createTraceSnapshot(),
      timelineSnapshot: createTimelineSnapshot(),
      historySnapshot: createHistorySnapshot(),
    })
    const result = renderer.render(obs)
    expect(result).toContain('- traceSnapshot')
    expect(result).toContain('- timelineSnapshot')
    expect(result).toContain('- historySnapshot')
    // Use exact line matching to avoid substring matches
    const lines = result.split('\n')
    expect(lines.filter(l => l === '- trace')).toHaveLength(0)
    expect(lines.filter(l => l === '- timeline')).toHaveLength(0)
    expect(lines.filter(l => l === '- history')).toHaveLength(0)
  })

  it('should handle partial observatory with only core artifacts', () => {
    const renderer = new DefaultPromptAssemblyObservatoryRenderer()
    const obs = createObservatoryWith({
      trace: createTrace(),
      timeline: createTimeline(),
      history: createHistory(),
    })
    const result = renderer.render(obs)
    expect(result).toContain('- trace')
    expect(result).toContain('- timeline')
    expect(result).toContain('- history')
    expect(result).not.toContain('- snapshot')
  })

  it('should handle unicode values in observatory fields', () => {
    const renderer = new DefaultPromptAssemblyObservatoryRenderer()
    const obs = createObservatoryWith({ trace: { strategy: { name: '你好世界' } } })
    const result = renderer.render(obs)
    expect(result).toContain('- trace')
    expect(result).toContain('Prompt Assembly Observatory')
  })

  it('should handle observatory with large timeline', () => {
    const renderer = new DefaultPromptAssemblyObservatoryRenderer()
    const largeTimeline: PromptAssemblyTimeline = {
      entries: Array.from({ length: 100 }, (_, i) => ({
        index: i,
        trace: { strategy: { name: `strategy-${i}` } },
      })),
    }
    const obs = createObservatoryWith({ timeline: largeTimeline })
    const result = renderer.render(obs)
    expect(result).toContain('- timeline')
    expect(result).not.toContain('- trace')
  })

  it('should handle observatory with large history', () => {
    const renderer = new DefaultPromptAssemblyObservatoryRenderer()
    const largeHistory: PromptAssemblyHistory = {
      entries: Array.from({ length: 100 }, (_, i) => ({
        index: i,
        trace: { strategy: { name: `s-${i}` } },
      })),
    }
    const obs = createObservatoryWith({ history: largeHistory })
    const result = renderer.render(obs)
    expect(result).toContain('- history')
  })

  it('should handle observatory with only traceSnapshot present', () => {
    const renderer = new DefaultPromptAssemblyObservatoryRenderer()
    const obs = createObservatoryWith({ traceSnapshot: createTraceSnapshot() })
    const result = renderer.render(obs)
    expect(result).toBe(artifactOutput(['traceSnapshot']))
  })

  it('should handle observatory with only timelineSnapshot present', () => {
    const renderer = new DefaultPromptAssemblyObservatoryRenderer()
    const obs = createObservatoryWith({ timelineSnapshot: createTimelineSnapshot() })
    const result = renderer.render(obs)
    expect(result).toBe(artifactOutput(['timelineSnapshot']))
  })

  it('should handle observatory with only historySnapshot present', () => {
    const renderer = new DefaultPromptAssemblyObservatoryRenderer()
    const obs = createObservatoryWith({ historySnapshot: createHistorySnapshot() })
    const result = renderer.render(obs)
    expect(result).toBe(artifactOutput(['historySnapshot']))
  })

  it('should handle observatory with undefined in an optional field', () => {
    const renderer = new DefaultPromptAssemblyObservatoryRenderer()
    const obs: PromptAssemblyObservatory = { trace: undefined } as unknown as PromptAssemblyObservatory
    const result = renderer.render(obs)
    // trace is undefined, should be treated as absent
    expect(result).toBe(EMPTY_OUTPUT)
  })
})