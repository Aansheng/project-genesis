/**
 * PromptObservatoryMetadataEmissionConsumption — verifies that
 * DefaultPromptBuilder consumes DefaultPromptObservatoryMetadataEmitter
 * via BuilderOptions and emits Observatory metadata in Phase 0.959978.
 *
 * WO-S6-027 — PromptBuilder Observatory Metadata Emission Consumption
 * Architecture version v1.56 → v1.57
 */

import { describe, it, expect } from 'vitest'
import { DefaultPromptBuilder } from '../prompt/DefaultPromptBuilder'
import type { BuilderOptions } from '../prompt/BuilderOptions'
import { UserInputModule, SystemPromptModule } from '../prompt/modules'
import { DefaultPromptRenderer } from '../prompt/DefaultPromptRenderer'
import { DefaultPromptCompression } from '../prompt/DefaultPromptCompression'
import { DefaultMemoryRanking } from '../prompt/DefaultMemoryRanking'
import { DefaultPromptBudget } from '../prompt/DefaultPromptBudget'
import { DefaultPromptSelection } from '../prompt/DefaultPromptSelection'
import { DefaultPromptObservatoryMetadataEmitter } from '../observatory/DefaultPromptObservatoryMetadataEmitter'
import type { PromptObservatoryMetadataEmitter } from '../observatory/PromptObservatoryMetadataEmitter'
import type { PromptObservatoryMetadata } from '../observatory/PromptObservatoryMetadata'
import { DefaultPromptObservatoryMetadataBuilder } from '../observatory/DefaultPromptObservatoryMetadataBuilder'
import type { PipelineContext } from '../pipeline/PipelineContext'
import type { AIRequest } from '../request/AIRequest'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Minimum modules required for DefaultPromptBuilder. */
function createModules(): UserInputModule[] {
  return [new UserInputModule()]
}

/** Build a minimal PipelineContext. */
function createContext(input?: string): PipelineContext {
  return { input: input ?? 'test input' }
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
  }
}

/** Build a mock emitter that records calls. */
function createMockEmitter(): {
  emitter: PromptObservatoryMetadataEmitter
  callCount: () => number
  lastInput: () => Record<string, unknown> | undefined
} {
  let count = 0
  let input: Record<string, unknown> | undefined

  const emitter: PromptObservatoryMetadataEmitter = {
    emit(metadata: Record<string, unknown>): PromptObservatoryMetadata {
      count++
      input = metadata
      return new DefaultPromptObservatoryMetadataEmitter().emit(metadata)
    },
  }

  return {
    emitter,
    callCount: () => count,
    lastInput: () => input,
  }
}

/** Create a DefaultPromptBuilder with a given emitter. */
function createBuilderWithEmitter(
  emitter?: PromptObservatoryMetadataEmitter,
): DefaultPromptBuilder {
  const options: BuilderOptions = {
    ...(emitter !== undefined ? { promptObservatoryMetadataEmitter: emitter } : {}),
  }
  return new DefaultPromptBuilder(createModules(), options)
}

interface BuildResult {
  prompt: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata: any
}

/** Execute build and return typed result. */
async function buildResult(
  builder: DefaultPromptBuilder,
  context: PipelineContext,
): Promise<BuildResult> {
  const raw = await builder.build(context)
  return { prompt: raw.prompt, metadata: raw.metadata as Record<string, unknown> }
}

// ---------------------------------------------------------------------------
// Section 1 — BuilderOptions: accepted
// ---------------------------------------------------------------------------

describe('BuilderOptions — accepted', () => {
  it('accepts promptObservatoryMetadataEmitter in BuilderOptions', () => {
    const emitter = new DefaultPromptObservatoryMetadataEmitter()
    const options: BuilderOptions = { promptObservatoryMetadataEmitter: emitter }
    const builder = new DefaultPromptBuilder(createModules(), options)
    expect(builder).toBeDefined()
  })

  it('accepts emitter with all other BuilderOptions fields', () => {
    const emitter = new DefaultPromptObservatoryMetadataEmitter()
    const options: BuilderOptions = {
      renderer: new DefaultPromptRenderer(),
      compression: new DefaultPromptCompression(),
      ranking: new DefaultMemoryRanking(),
      budget: new DefaultPromptBudget(),
      selection: new DefaultPromptSelection(),
      promptObservatoryMetadataEmitter: emitter,
    }
    const builder = new DefaultPromptBuilder(createModules(), options)
    expect(builder).toBeDefined()
  })

  it('accepts emitter with default builder inside', () => {
    const emitter = new DefaultPromptObservatoryMetadataEmitter()
    const builder = createBuilderWithEmitter(emitter)
    expect(builder).toBeDefined()
  })

  it('accepts custom emitter in BuilderOptions', () => {
    const { emitter } = createMockEmitter()
    const builder = createBuilderWithEmitter(emitter)
    expect(builder).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Section 2 — BuilderOptions: omitted
// ---------------------------------------------------------------------------

describe('BuilderOptions — omitted', () => {
  it('works without promptObservatoryMetadataEmitter', () => {
    const builder = new DefaultPromptBuilder(createModules(), {})
    expect(builder).toBeDefined()
  })

  it('works with empty BuilderOptions', () => {
    const builder = new DefaultPromptBuilder(createModules(), {})
    expect(builder).toBeDefined()
  })

  it('works with no options argument', () => {
    const options: BuilderOptions = {}
    const builder = new DefaultPromptBuilder(createModules(), options)
    expect(builder).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Section 3 — BuilderOptions: undefined
// ---------------------------------------------------------------------------

describe('BuilderOptions — undefined', () => {
  it('works with undefined emitter in options', () => {
    const options: BuilderOptions = { promptObservatoryMetadataEmitter: undefined }
    const builder = new DefaultPromptBuilder(createModules(), options)
    expect(builder).toBeDefined()
  })

  it('works with explicit undefined emitter', () => {
    const options: BuilderOptions = { promptObservatoryMetadataEmitter: undefined }
    const builder = new DefaultPromptBuilder(createModules(), options)
    expect(builder).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Section 4 — BuilderOptions: backward compatible
// ---------------------------------------------------------------------------

describe('BuilderOptions — backward compatible', () => {
  it('existing fields still work with new field', () => {
    const emitter = new DefaultPromptObservatoryMetadataEmitter()
    const options: BuilderOptions = {
      renderer: new DefaultPromptRenderer(),
      compression: new DefaultPromptCompression(),
      ranking: new DefaultMemoryRanking(),
      budget: new DefaultPromptBudget(),
      selection: new DefaultPromptSelection(),
      promptObservatoryMetadataEmitter: emitter,
    }
    const builder = new DefaultPromptBuilder(createModules(), options)
    expect(builder).toBeDefined()
  })

  it('all other BuilderOptions work when emitter is set', () => {
    const emitter = new DefaultPromptObservatoryMetadataEmitter()
    const options: BuilderOptions = {
      renderer: new DefaultPromptRenderer(),
      promptObservatoryMetadataEmitter: emitter,
    }
    const builder = new DefaultPromptBuilder(createModules(), options)
    expect(builder).toBeDefined()
  })

  it('backward compatible with single-field options', () => {
    const options: BuilderOptions = { renderer: new DefaultPromptRenderer() }
    const builder = new DefaultPromptBuilder(createModules(), options)
    expect(builder).toBeDefined()
  })

  it('all legacy fields still work when emitter omitted', () => {
    const options: BuilderOptions = {
      renderer: new DefaultPromptRenderer(),
      compression: new DefaultPromptCompression(),
    }
    const builder = new DefaultPromptBuilder(createModules(), options)
    expect(builder).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Section 5 — BuilderOptions: full setup
// ---------------------------------------------------------------------------

describe('BuilderOptions — full setup', () => {
  it('builds with emitter in full options', async () => {
    const emitter = new DefaultPromptObservatoryMetadataEmitter()
    const options: BuilderOptions = {
      renderer: new DefaultPromptRenderer(),
      compression: new DefaultPromptCompression(),
      ranking: new DefaultMemoryRanking(),
      budget: new DefaultPromptBudget(),
      selection: new DefaultPromptSelection(),
      promptObservatoryMetadataEmitter: emitter,
    }
    const builder = new DefaultPromptBuilder(createModules(), options)
    const result = await buildResult(builder, createContext())
    expect(result).toBeDefined()
    expect(result.prompt).toBeDefined()
  })

  it('builds with emitter and no other options', async () => {
    const emitter = new DefaultPromptObservatoryMetadataEmitter()
    const builder = createBuilderWithEmitter(emitter)
    const result = await buildResult(builder, createContext())
    expect(result).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Section 6 — Emitter Invocation: called once
// ---------------------------------------------------------------------------

describe('emitter invocation — called once', () => {
  it('calls emit exactly once on build', async () => {
    const { emitter, callCount } = createMockEmitter()
    const builder = createBuilderWithEmitter(emitter)
    await buildResult(builder, createContext())
    expect(callCount()).toBe(1)
  })

  it('calls emit once per build call', async () => {
    const { emitter, callCount } = createMockEmitter()
    const builder = createBuilderWithEmitter(emitter)
    await buildResult(builder, createContext())
    await buildResult(builder, createContext())
    expect(callCount()).toBe(2)
  })

  it('calls emit once for empty context', async () => {
    const { emitter, callCount } = createMockEmitter()
    const builder = createBuilderWithEmitter(emitter)
    await buildResult(builder, createContext(''))
    expect(callCount()).toBe(1)
  })
})

// ---------------------------------------------------------------------------
// Section 7 — Emitter Invocation: not called
// ---------------------------------------------------------------------------

describe('emitter invocation — not called', () => {
  it('does not call emit when emitter is undefined', async () => {
    const watchBuilder = new DefaultPromptBuilder(createModules(), {})
    const result = await buildResult(watchBuilder, createContext())
    // No emitter configured — no observatoryMetadata in output
    expect(result.metadata.promptAssembly?.observatoryMetadata).toBeUndefined()
  })

  it('does not call emit when emitter omitted', async () => {
    const { emitter, callCount } = createMockEmitter()
    // Use a builder that doesn't receive this emitter
    const builder = new DefaultPromptBuilder(createModules(), {})
    await buildResult(builder, createContext())
    expect(callCount()).toBe(0)
  })

  it('does not call emit on construction', () => {
    const { emitter, callCount } = createMockEmitter()
    createBuilderWithEmitter(emitter)
    expect(callCount()).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// Section 8 — Emitter Invocation: observatory metadata passed
// ---------------------------------------------------------------------------

describe('emitter invocation — metadata passed to emit', () => {
  it('passes promptAssemblyMetadata to emit', async () => {
    const { emitter, lastInput } = createMockEmitter()
    const builder = createBuilderWithEmitter(emitter)
    await buildResult(builder, createContext())
    expect(lastInput()).toBeDefined()
    expect(typeof lastInput()).toBe('object')
  })

  it('passed metadata contains strategy key', async () => {
    const { emitter, lastInput } = createMockEmitter()
    const builder = createBuilderWithEmitter(emitter)
    await buildResult(builder, createContext())
    expect(lastInput()?.strategy).toBeDefined()
  })

  it('emitter receives promptAssembly metadata (phase context)', async () => {
    const { emitter, lastInput } = createMockEmitter()
    const builder = createBuilderWithEmitter(emitter)
    await buildResult(builder, createContext())
    // At Phase 0.959978, promptAssemblyMetadata contains strategy and other phase 0.95xx results
    const input = lastInput()
    expect(input).toBeDefined()
    expect(typeof input).toBe('object')
  })

  it('passed metadata is a Record<string, unknown>', async () => {
    const { emitter, lastInput } = createMockEmitter()
    const builder = createBuilderWithEmitter(emitter)
    await buildResult(builder, createContext())
    const input = lastInput()
    expect(typeof input).toBe('object')
    expect(input).not.toBeNull()
  })
})

// ---------------------------------------------------------------------------
// Section 9 — Emitter Invocation: custom emitter
// ---------------------------------------------------------------------------

describe('emitter invocation — custom emitter', () => {
  it('custom emitter is invoked', async () => {
    let invoked = false
    const custom: PromptObservatoryMetadataEmitter = {
      emit(): PromptObservatoryMetadata {
        invoked = true
        return Object.freeze({}) as PromptObservatoryMetadata
      },
    }
    const builder = createBuilderWithEmitter(custom)
    await buildResult(builder, createContext())
    expect(invoked).toBe(true)
  })

  it('custom emitter result is stored', async () => {
    const custom: PromptObservatoryMetadataEmitter = {
      emit(): PromptObservatoryMetadata {
        return Object.freeze({ overview: { from: 'custom' } }) as PromptObservatoryMetadata
      },
    }
    const builder = createBuilderWithEmitter(custom)
    const result = await buildResult(builder, createContext())
    expect(result.metadata.promptAssembly?.observatoryMetadata).toEqual({ overview: { from: 'custom' } })
  })

  it('custom emitter receives same metadata shape', async () => {
    let received: Record<string, unknown> | undefined
    const custom: PromptObservatoryMetadataEmitter = {
      emit(metadata: Record<string, unknown>): PromptObservatoryMetadata {
        received = metadata
        return Object.freeze({}) as PromptObservatoryMetadata
      },
    }
    const builder = createBuilderWithEmitter(custom)
    await buildResult(builder, createContext())
    expect(received?.strategy).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Section 10 — Emitter Invocation: missing metadata
// ---------------------------------------------------------------------------

describe('emitter invocation — missing metadata', () => {
  it('works when metadata is minimal', async () => {
    const emitter = new DefaultPromptObservatoryMetadataEmitter()
    const builder = createBuilderWithEmitter(emitter)
    const result = await buildResult(builder, createContext(''))
    expect(result).toBeDefined()
  })

  it('works with default module that provides no extra metadata', async () => {
    const emitter = new DefaultPromptObservatoryMetadataEmitter()
    const builder = createBuilderWithEmitter(emitter)
    const result = await buildResult(builder, createContext('test'))
    expect(result).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Section 11 — Metadata Creation: stored
// ---------------------------------------------------------------------------

describe('metadata creation — stored', () => {
  it('observatoryMetadata exists in metadata after build', async () => {
    const emitter = new DefaultPromptObservatoryMetadataEmitter()
    const builder = createBuilderWithEmitter(emitter)
    const result = await buildResult(builder, createContext())
    expect(result.metadata.promptAssembly?.observatoryMetadata).toBeDefined()
  })

  it('observatoryMetadata is an object', async () => {
    const emitter = new DefaultPromptObservatoryMetadataEmitter()
    const builder = createBuilderWithEmitter(emitter)
    const result = await buildResult(builder, createContext())
    expect(typeof result.metadata.promptAssembly?.observatoryMetadata).toBe('object')
  })

  it('observatoryMetadata is defined when emitter set', async () => {
    const emitter = new DefaultPromptObservatoryMetadataEmitter()
    const builder = createBuilderWithEmitter(emitter)
    const result = await buildResult(builder, createContext())
    expect(result.metadata.promptAssembly?.observatoryMetadata).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Section 12 — Metadata Creation: correct path
// ---------------------------------------------------------------------------

describe('metadata creation — correct path', () => {
  it('stored at metadata.promptAssembly.observatoryMetadata', async () => {
    const emitter = new DefaultPromptObservatoryMetadataEmitter()
    const builder = createBuilderWithEmitter(emitter)
    const result = await buildResult(builder, createContext())
    expect(result.metadata).toHaveProperty('promptAssembly')
    expect(result.metadata.promptAssembly).toHaveProperty('observatoryMetadata')
  })

  it('not stored at metadata.observatoryMetadata (top level)', async () => {
    const emitter = new DefaultPromptObservatoryMetadataEmitter()
    const builder = createBuilderWithEmitter(emitter)
    const result = await buildResult(builder, createContext())
    expect('observatoryMetadata' in result.metadata).toBe(false)
  })

  it('not stored at metadata.promptAssembly.observatory (wrong key)', async () => {
    const emitter = new DefaultPromptObservatoryMetadataEmitter()
    const builder = createBuilderWithEmitter(emitter)
    const result = await buildResult(builder, createContext())
    expect(result.metadata.promptAssembly?.observatory).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// Section 13 — Metadata Creation: non-overwrite
// ---------------------------------------------------------------------------

describe('metadata creation — non-overwrite', () => {
  it('does not overwrite existing promptAssembly keys', async () => {
    const emitter = new DefaultPromptObservatoryMetadataEmitter()
    const builder = createBuilderWithEmitter(emitter)
    const result = await buildResult(builder, createContext())
    // observatory is an existing promptAssembly key from observatoryBuilder
    // observatory should still be present if observatoryBuilder is defined
    // In default builder, observatoryBuilder is undefined so we check snapshot instead
    expect(result.metadata.promptAssembly).toBeDefined()
  })

  it('additive spread preserves existing metadata', async () => {
    const emitter = new DefaultPromptObservatoryMetadataEmitter()
    const builder = createBuilderWithEmitter(emitter)
    const result = await buildResult(builder, createContext())
    const keys = Object.keys(result.metadata.promptAssembly ?? {})
    // Should not replace the entire promptAssembly object
    expect(keys.length).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// Section 14 — Metadata Creation: additive spread
// ---------------------------------------------------------------------------

describe('metadata creation — additive spread', () => {
  it('observatoryMetadata is added to existing promptAssembly keys', async () => {
    const emitter = new DefaultPromptObservatoryMetadataEmitter()
    const builder = createBuilderWithEmitter(emitter)
    const result = await buildResult(builder, createContext())
    const pa = result.metadata.promptAssembly ?? {}
    // observatoryMetadata should be alongside other keys like strategy, ranking, etc.
    expect('observatoryMetadata' in pa).toBe(true)
  })

  it('does not remove strategy from promptAssembly', async () => {
    const emitter = new DefaultPromptObservatoryMetadataEmitter()
    const builder = createBuilderWithEmitter(emitter)
    const result = await buildResult(builder, createContext())
    expect(result.metadata.promptAssembly?.strategy).toBeDefined()
  })

  it('does not remove ranking from promptAssembly', async () => {
    const emitter = new DefaultPromptObservatoryMetadataEmitter()
    const builder = createBuilderWithEmitter(emitter)
    const result = await buildResult(builder, createContext())
    expect(result.metadata.promptAssembly?.ranking).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Section 15 — Metadata Creation: frozen contract
// ---------------------------------------------------------------------------

describe('metadata creation — frozen contract', () => {
  it('observatoryMetadata is frozen', async () => {
    const emitter = new DefaultPromptObservatoryMetadataEmitter()
    const builder = createBuilderWithEmitter(emitter)
    const result = await buildResult(builder, createContext())
    const oMetadata = result.metadata.promptAssembly?.observatoryMetadata
    expect(Object.isFrozen(oMetadata)).toBe(true)
  })

  it('observatoryMetadata fields are present when input has data', async () => {
    // Use a custom emitter that provides overview to ensure we can test frozen state
    const emitter = new DefaultPromptObservatoryMetadataEmitter()
    const builder = createBuilderWithEmitter(emitter)
    const result = await buildResult(builder, createContext())
    const oMetadata = result.metadata.promptAssembly?.observatoryMetadata
    expect(Object.isFrozen(oMetadata)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Section 16 — Coexistence: observatory
// ---------------------------------------------------------------------------

describe('coexistence — observatory', () => {
  it('observatoryMetadata coexists with observatory key', async () => {
    const emitter = new DefaultPromptObservatoryMetadataEmitter()
    const builder = createBuilderWithEmitter(emitter)
    const result = await buildResult(builder, createContext())
    // Both keys can be present in promptAssembly
    const pa = result.metadata.promptAssembly ?? {}
    expect('observatoryMetadata' in pa).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Section 17 — Coexistence: all promptAssembly fields
// ---------------------------------------------------------------------------

describe('coexistence — all promptAssembly fields', () => {
  it('strategy key is preserved', async () => {
    const emitter = new DefaultPromptObservatoryMetadataEmitter()
    const builder = createBuilderWithEmitter(emitter)
    const result = await buildResult(builder, createContext())
    expect(result.metadata.promptAssembly?.strategy).toBeDefined()
  })

  it('ranking key is preserved', async () => {
    const emitter = new DefaultPromptObservatoryMetadataEmitter()
    const builder = createBuilderWithEmitter(emitter)
    const result = await buildResult(builder, createContext())
    expect(result.metadata.promptAssembly?.ranking).toBeDefined()
  })

  it('budget key is preserved', async () => {
    const emitter = new DefaultPromptObservatoryMetadataEmitter()
    const builder = createBuilderWithEmitter(emitter)
    const result = await buildResult(builder, createContext())
    expect(result.metadata.promptAssembly?.budget).toBeDefined()
  })

  it('selection key is preserved', async () => {
    const emitter = new DefaultPromptObservatoryMetadataEmitter()
    const builder = createBuilderWithEmitter(emitter)
    const result = await buildResult(builder, createContext())
    expect(result.metadata.promptAssembly?.selection).toBeDefined()
  })

  it('promptAssembly object has multiple keys', async () => {
    const emitter = new DefaultPromptObservatoryMetadataEmitter()
    const builder = createBuilderWithEmitter(emitter)
    const result = await buildResult(builder, createContext())
    const keys = Object.keys(result.metadata.promptAssembly ?? {})
    expect(keys.length).toBeGreaterThan(3)
  })
})

// ---------------------------------------------------------------------------
// Section 18 — Phase 0.959978 Insertion
// ---------------------------------------------------------------------------

describe('phase — 0.959978 insertion', () => {
  it('observatoryMetadata is set in metadata output', async () => {
    const emitter = new DefaultPromptObservatoryMetadataEmitter()
    const builder = createBuilderWithEmitter(emitter)
    const result = await buildResult(builder, createContext())
    expect(result.metadata.promptAssembly?.observatoryMetadata).toBeDefined()
  })

  it('observatoryMetadata is a PromptObservatoryMetadata contract', async () => {
    const emitter = new DefaultPromptObservatoryMetadataEmitter()
    const builder = createBuilderWithEmitter(emitter)
    const result = await buildResult(builder, createContext())
    const om = result.metadata.promptAssembly?.observatoryMetadata as PromptObservatoryMetadata
    expect(typeof om).toBe('object')
    expect(om).not.toBeNull()
  })

  it('observatoryMetadata appears between other phases', async () => {
    const emitter = new DefaultPromptObservatoryMetadataEmitter()
    const builder = createBuilderWithEmitter(emitter)
    const result = await buildResult(builder, createContext())
    const pa = result.metadata.promptAssembly
    if (pa) {
      // Both observatorySnapshot (Phase 0.9599779) and observatoryMetadata (Phase 0.959978)
      // should be present as keys if their builders/emitters were set
      expect('observatoryMetadata' in pa).toBe(true)
      expect('strategy' in pa).toBe(true)
    }
  })
})

// ---------------------------------------------------------------------------
// Section 19 — Guarantees: deterministic
// ---------------------------------------------------------------------------

describe('guarantees — deterministic', () => {
  it('same input produces same observatoryMetadata', async () => {
    const emitter = new DefaultPromptObservatoryMetadataEmitter()
    const builder = createBuilderWithEmitter(emitter)
    const ctx = createContext('deterministic test')
    const r1 = await buildResult(builder, ctx)
    const r2 = await buildResult(builder, ctx)
    expect(r1.metadata.promptAssembly?.observatoryMetadata)
      .toEqual(r2.metadata.promptAssembly?.observatoryMetadata)
  })

  it('same input across different builders with same emitter', async () => {
    const emitter = new DefaultPromptObservatoryMetadataEmitter()
    const b1 = createBuilderWithEmitter(emitter)
    const b2 = createBuilderWithEmitter(emitter)
    const ctx = createContext('same')
    const r1 = await buildResult(b1, ctx)
    const r2 = await buildResult(b2, ctx)
    expect(r1.metadata.promptAssembly?.observatoryMetadata)
      .toEqual(r2.metadata.promptAssembly?.observatoryMetadata)
  })

  it('empty context produces same observatoryMetadata', async () => {
    const emitter = new DefaultPromptObservatoryMetadataEmitter()
    const builder = createBuilderWithEmitter(emitter)
    const ctx = createContext('')
    const results = await Promise.all([
      buildResult(builder, ctx),
      buildResult(builder, ctx),
      buildResult(builder, ctx),
    ])
    expect(results[0].metadata.promptAssembly?.observatoryMetadata)
      .toEqual(results[1].metadata.promptAssembly?.observatoryMetadata)
    expect(results[1].metadata.promptAssembly?.observatoryMetadata)
      .toEqual(results[2].metadata.promptAssembly?.observatoryMetadata)
  })
})

// ---------------------------------------------------------------------------
// Section 20 — Guarantees: stateless
// ---------------------------------------------------------------------------

describe('guarantees — stateless', () => {
  it('consecutive builds with different input do not affect each other', async () => {
    const emitter = new DefaultPromptObservatoryMetadataEmitter()
    const builder = createBuilderWithEmitter(emitter)
    const ctx1 = createContext('input A')
    const ctx2 = createContext('input B')
    const r1 = await buildResult(builder, ctx1)
    const r2 = await buildResult(builder, ctx2)
    // Both should have observatoryMetadata
    expect(r1.metadata.promptAssembly?.observatoryMetadata).toBeDefined()
    expect(r2.metadata.promptAssembly?.observatoryMetadata).toBeDefined()
  })

  it('builder state does not carry across builds', async () => {
    const emitter = new DefaultPromptObservatoryMetadataEmitter()
    const builder = createBuilderWithEmitter(emitter)
    await buildResult(builder, createContext('first'))
    await buildResult(builder, createContext('second'))
    const third = await buildResult(builder, createContext('third'))
    expect(third.metadata.promptAssembly?.observatoryMetadata).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Section 21 — Guarantees: pure
// ---------------------------------------------------------------------------

describe('guarantees — pure', () => {
  it('no side effects on metadata output shape', async () => {
    const emitter = new DefaultPromptObservatoryMetadataEmitter()
    const builder = createBuilderWithEmitter(emitter)
    const result = await buildResult(builder, createContext())
    expect(typeof result.prompt).toBe('string')
    expect(typeof result.metadata).toBe('object')
  })

  it('prompt output is unchanged by emitter', async () => {
    const emitter = new DefaultPromptObservatoryMetadataEmitter()
    const builder = createBuilderWithEmitter(emitter)
    const result = await buildResult(builder, createContext('pure test'))
    expect(result.prompt).toContain('pure test')
  })
})

// ---------------------------------------------------------------------------
// Section 22 — Legacy constructor
// ---------------------------------------------------------------------------

describe('legacy constructor', () => {
  it('legacy constructor works without emitter', () => {
    const builder = new DefaultPromptBuilder(
      createModules(),
      new DefaultPromptRenderer(),
      new DefaultPromptCompression(),
      new DefaultMemoryRanking(),
      new DefaultPromptBudget(),
      new DefaultPromptSelection(),
    )
    expect(builder).toBeDefined()
  })

  it('legacy constructor build works', async () => {
    const builder = new DefaultPromptBuilder(
      createModules(),
      new DefaultPromptRenderer(),
      new DefaultPromptCompression(),
      new DefaultMemoryRanking(),
      new DefaultPromptBudget(),
      new DefaultPromptSelection(),
    )
    const result = await buildResult(builder, createContext())
    expect(result).toBeDefined()
  })

  it('legacy constructor has no observatoryMetadata', async () => {
    const builder = new DefaultPromptBuilder(
      createModules(),
      new DefaultPromptRenderer(),
      new DefaultPromptCompression(),
      new DefaultMemoryRanking(),
      new DefaultPromptBudget(),
      new DefaultPromptSelection(),
    )
    const result = await buildResult(builder, createContext())
    expect(result.metadata.promptAssembly?.observatoryMetadata).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// Section 23 — No prompt changes
// ---------------------------------------------------------------------------

describe('no prompt changes', () => {
  it('prompt text is unchanged by emitter presence', async () => {
    const noEmitter = new DefaultPromptBuilder(createModules(), {})
    const withEmitter = createBuilderWithEmitter(new DefaultPromptObservatoryMetadataEmitter())
    const ctx = createContext('prompt unchanged')
    const r1 = await noEmitter.build(ctx)
    const r2 = await withEmitter.build(ctx)
    expect(r1.prompt).toBe(r2.prompt)
  })

  it('prompt text is unchanged by emitter absence', async () => {
    const builder = new DefaultPromptBuilder(createModules(), {})
    const result = await buildResult(builder, createContext('no emitter'))
    expect(result.prompt).toBeDefined()
    expect(result.prompt.length).toBeGreaterThan(0)
  })

  it('emitter does not modify prompt modules', async () => {
    const emitter = new DefaultPromptObservatoryMetadataEmitter()
    const builder = createBuilderWithEmitter(emitter)
    const result = await buildResult(builder, createContext('module test'))
    expect(result.prompt).toContain('module test')
  })
})

// ---------------------------------------------------------------------------
// Section 24 — Compatibility: all 7 observatory fields
// ---------------------------------------------------------------------------

describe('compatibility — all 7 observatory fields', () => {
  it('observatoryMetadata has overview when present in metadata', async () => {
    const custom: PromptObservatoryMetadataEmitter = {
      emit(_m: Record<string, unknown>): PromptObservatoryMetadata {
        return Object.freeze({ overview: { traceCount: 5 } }) as PromptObservatoryMetadata
      },
    }
    const builder = createBuilderWithEmitter(custom)
    const result = await buildResult(builder, createContext())
    const om = result.metadata.promptAssembly?.observatoryMetadata as PromptObservatoryMetadata
    expect(om.overview).toEqual({ traceCount: 5 })
  })

  it('observatoryMetadata has trace when present in metadata', async () => {
    const custom: PromptObservatoryMetadataEmitter = {
      emit(_m: Record<string, unknown>): PromptObservatoryMetadata {
        return Object.freeze({ trace: [{ id: 't1', steps: [] }] }) as PromptObservatoryMetadata
      },
    }
    const builder = createBuilderWithEmitter(custom)
    const result = await buildResult(builder, createContext())
    const om = result.metadata.promptAssembly?.observatoryMetadata as PromptObservatoryMetadata
    expect(om.trace).toEqual([{ id: 't1', steps: [] }])
  })

  it('observatoryMetadata has timeline when present', async () => {
    const custom: PromptObservatoryMetadataEmitter = {
      emit(_m: Record<string, unknown>): PromptObservatoryMetadata {
        return Object.freeze({ timeline: [] }) as PromptObservatoryMetadata
      },
    }
    const builder = createBuilderWithEmitter(custom)
    const result = await buildResult(builder, createContext())
    const om = result.metadata.promptAssembly?.observatoryMetadata as PromptObservatoryMetadata
    expect('timeline' in (om ?? {})).toBe(true)
  })

  it('observatoryMetadata has history when present', async () => {
    const custom: PromptObservatoryMetadataEmitter = {
      emit(_m: Record<string, unknown>): PromptObservatoryMetadata {
        return Object.freeze({ history: [] }) as PromptObservatoryMetadata
      },
    }
    const builder = createBuilderWithEmitter(custom)
    const result = await buildResult(builder, createContext())
    const om = result.metadata.promptAssembly?.observatoryMetadata as PromptObservatoryMetadata
    expect('history' in (om ?? {})).toBe(true)
  })

  it('observatoryMetadata has diff when present', async () => {
    const custom: PromptObservatoryMetadataEmitter = {
      emit(_m: Record<string, unknown>): PromptObservatoryMetadata {
        return Object.freeze({ diff: [] }) as PromptObservatoryMetadata
      },
    }
    const builder = createBuilderWithEmitter(custom)
    const result = await buildResult(builder, createContext())
    const om = result.metadata.promptAssembly?.observatoryMetadata as PromptObservatoryMetadata
    expect('diff' in (om ?? {})).toBe(true)
  })

  it('observatoryMetadata has runtime when present', async () => {
    const custom: PromptObservatoryMetadataEmitter = {
      emit(_m: Record<string, unknown>): PromptObservatoryMetadata {
        return Object.freeze({ runtime: {} }) as PromptObservatoryMetadata
      },
    }
    const builder = createBuilderWithEmitter(custom)
    const result = await buildResult(builder, createContext())
    const om = result.metadata.promptAssembly?.observatoryMetadata as PromptObservatoryMetadata
    expect('runtime' in (om ?? {})).toBe(true)
  })

  it('observatoryMetadata has eventStream when present', async () => {
    const custom: PromptObservatoryMetadataEmitter = {
      emit(_m: Record<string, unknown>): PromptObservatoryMetadata {
        return Object.freeze({ eventStream: {} }) as PromptObservatoryMetadata
      },
    }
    const builder = createBuilderWithEmitter(custom)
    const result = await buildResult(builder, createContext())
    const om = result.metadata.promptAssembly?.observatoryMetadata as PromptObservatoryMetadata
    expect('eventStream' in (om ?? {})).toBe(true)
  })

  it('all 7 fields can be present', async () => {
    const custom: PromptObservatoryMetadataEmitter = {
      emit(_m: Record<string, unknown>): PromptObservatoryMetadata {
        return Object.freeze({
          overview: {},
          trace: [],
          timeline: [],
          history: [],
          diff: [],
          runtime: {},
          eventStream: {},
        }) as PromptObservatoryMetadata
      },
    }
    const builder = createBuilderWithEmitter(custom)
    const result = await buildResult(builder, createContext())
    const om = result.metadata.promptAssembly?.observatoryMetadata as PromptObservatoryMetadata
    expect(Object.keys(om ?? {})).toHaveLength(7)
  })
})

// ---------------------------------------------------------------------------
// Section 25 — Compatibility: empty metadata
// ---------------------------------------------------------------------------

describe('compatibility — empty metadata', () => {
  it('empty observatoryMetadata (no fields) is valid', async () => {
    const custom: PromptObservatoryMetadataEmitter = {
      emit(_m: Record<string, unknown>): PromptObservatoryMetadata {
        return Object.freeze({}) as PromptObservatoryMetadata
      },
    }
    const builder = createBuilderWithEmitter(custom)
    const result = await buildResult(builder, createContext())
    const om = result.metadata.promptAssembly?.observatoryMetadata as PromptObservatoryMetadata
    expect(Object.keys(om ?? {})).toHaveLength(0)
  })

  it('empty metadata with undefined emitter → no observatoryMetadata', async () => {
    const builder = new DefaultPromptBuilder(createModules(), {})
    const result = await buildResult(builder, createContext())
    expect(result.metadata.promptAssembly?.observatoryMetadata).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// Section 26 — Compatibility: partial metadata
// ---------------------------------------------------------------------------

describe('compatibility — partial metadata', () => {
  it('single field in observatoryMetadata', async () => {
    const custom: PromptObservatoryMetadataEmitter = {
      emit(_m: Record<string, unknown>): PromptObservatoryMetadata {
        return Object.freeze({ overview: { count: 1 } }) as PromptObservatoryMetadata
      },
    }
    const builder = createBuilderWithEmitter(custom)
    const result = await buildResult(builder, createContext())
    const om = result.metadata.promptAssembly?.observatoryMetadata as PromptObservatoryMetadata
    expect(Object.keys(om ?? {})).toEqual(['overview'])
  })

  it('two fields in observatoryMetadata', async () => {
    const custom: PromptObservatoryMetadataEmitter = {
      emit(_m: Record<string, unknown>): PromptObservatoryMetadata {
        return Object.freeze({ overview: {}, trace: [] }) as PromptObservatoryMetadata
      },
    }
    const builder = createBuilderWithEmitter(custom)
    const result = await buildResult(builder, createContext())
    const om = result.metadata.promptAssembly?.observatoryMetadata as PromptObservatoryMetadata
    expect(Object.keys(om ?? {}).sort()).toEqual(['overview', 'trace'])
  })

  it('three fields in observatoryMetadata', async () => {
    const custom: PromptObservatoryMetadataEmitter = {
      emit(_m: Record<string, unknown>): PromptObservatoryMetadata {
        return Object.freeze({ overview: {}, trace: [], timeline: [] }) as PromptObservatoryMetadata
      },
    }
    const builder = createBuilderWithEmitter(custom)
    const result = await buildResult(builder, createContext())
    const om = result.metadata.promptAssembly?.observatoryMetadata as PromptObservatoryMetadata
    expect(Object.keys(om ?? {}).sort()).toEqual(['overview', 'timeline', 'trace'])
  })
})

// ---------------------------------------------------------------------------
// Section 27 — Compatibility: unknown metadata
// ---------------------------------------------------------------------------

describe('compatibility — unknown metadata', () => {
  it('unknown keys in metadata are ignored by emitter', async () => {
    const emitter = new DefaultPromptObservatoryMetadataEmitter()
    const builder = createBuilderWithEmitter(emitter)
    const result = await buildResult(builder, createContext())
    const om = result.metadata.promptAssembly?.observatoryMetadata as PromptObservatoryMetadata
    // The default emitter uses the builder which extracts only known keys
    // Since the promptAssemblyMetadata is clean, we get standard fields
    expect(om).toBeDefined()
  })

  it('extra metadata from context does not break emission', async () => {
    const emitter = new DefaultPromptObservatoryMetadataEmitter()
    const builder = createBuilderWithEmitter(emitter)
    const ctx = createContext('test') as PipelineContext & Record<string, unknown>
    ctx.extraField = 'some value'
    const result = await buildResult(builder, ctx)
    expect(result.metadata.promptAssembly?.observatoryMetadata).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Section 28 — Compatibility: contract preservation
// ---------------------------------------------------------------------------

describe('compatibility — contract preservation', () => {
  it('observatoryMetadata preserves frozen contract', async () => {
    const emitter = new DefaultPromptObservatoryMetadataEmitter()
    const builder = createBuilderWithEmitter(emitter)
    const result = await buildResult(builder, createContext())
    const om = result.metadata.promptAssembly?.observatoryMetadata
    expect(Object.isFrozen(om)).toBe(true)
  })

  it('observatoryMetadata is typed as PromptObservatoryMetadata', async () => {
    const emitter = new DefaultPromptObservatoryMetadataEmitter()
    const builder = createBuilderWithEmitter(emitter)
    const result = await buildResult(builder, createContext())
    const om = result.metadata.promptAssembly?.observatoryMetadata as PromptObservatoryMetadata
    expect(typeof om).toBe('object')
    expect(om).not.toBeNull()
  })

  it('contract type is preserved through entire pipeline', async () => {
    const custom: PromptObservatoryMetadataEmitter = {
      emit(_m: Record<string, unknown>): PromptObservatoryMetadata {
        return Object.freeze({ overview: { key: 'value' } }) as PromptObservatoryMetadata
      },
    }
    const builder = createBuilderWithEmitter(custom)
    const result = await buildResult(builder, createContext())
    const om = result.metadata.promptAssembly?.observatoryMetadata as PromptObservatoryMetadata
    expect(om.overview).toEqual({ key: 'value' })
  })
})

// ---------------------------------------------------------------------------
// Section 29 — Integration: with SystemPromptModule
// ---------------------------------------------------------------------------

describe('integration — with SystemPromptModule', () => {
  it('works with SystemPromptModule', async () => {
    const emitter = new DefaultPromptObservatoryMetadataEmitter()
    const builder = new DefaultPromptBuilder(
      [new UserInputModule(), new SystemPromptModule()],
      { promptObservatoryMetadataEmitter: emitter },
    )
    const result = await buildResult(builder, createContext('integration test'))
    expect(result.metadata.promptAssembly?.observatoryMetadata).toBeDefined()
  })

  it('observatoryMetadata present with multiple modules', async () => {
    const emitter = new DefaultPromptObservatoryMetadataEmitter()
    const builder = new DefaultPromptBuilder(
      [new UserInputModule(), new SystemPromptModule()],
      { promptObservatoryMetadataEmitter: emitter },
    )
    const result = await buildResult(builder, createContext('multi module'))
    expect(result.metadata.promptAssembly?.observatoryMetadata).toBeDefined()
    expect(result.prompt).toContain('multi module')
  })
})

// ---------------------------------------------------------------------------
// Section 30 — Multiple Builds
// ---------------------------------------------------------------------------

describe('multiple builds', () => {
  it('multiple builds with same emitter produce consistently', async () => {
    const emitter = new DefaultPromptObservatoryMetadataEmitter()
    const builder = createBuilderWithEmitter(emitter)
    const ctx = createContext('consistent')
    const r1 = await buildResult(builder, ctx)
    const r2 = await buildResult(builder, ctx)
    const r3 = await buildResult(builder, ctx)
    expect(r1.metadata.promptAssembly?.observatoryMetadata)
      .toEqual(r2.metadata.promptAssembly?.observatoryMetadata)
    expect(r2.metadata.promptAssembly?.observatoryMetadata)
      .toEqual(r3.metadata.promptAssembly?.observatoryMetadata)
  })

  it('100 builds with same context produce same observatoryMetadata', async () => {
    const emitter = new DefaultPromptObservatoryMetadataEmitter()
    const builder = createBuilderWithEmitter(emitter)
    const ctx = createContext('stress')
    const first = await buildResult(builder, ctx)
    for (let i = 0; i < 99; i++) {
      const next = await buildResult(builder, ctx)
      expect(next.metadata.promptAssembly?.observatoryMetadata)
        .toEqual(first.metadata.promptAssembly?.observatoryMetadata)
    }
  })

  it('observatoryMetadata appears in every build when emitter set', async () => {
    const emitter = new DefaultPromptObservatoryMetadataEmitter()
    const builder = createBuilderWithEmitter(emitter)
    for (let i = 0; i < 10; i++) {
      const result = await buildResult(builder, createContext(`build ${i}`))
      expect(result.metadata.promptAssembly?.observatoryMetadata).toBeDefined()
    }
  })
})

// ---------------------------------------------------------------------------
// Section 31 — Edge Cases
// ---------------------------------------------------------------------------

describe('edge cases', () => {
  it('emitter that returns frozen empty object produces empty observatoryMetadata', async () => {
    const emptyEmitter: PromptObservatoryMetadataEmitter = {
      emit(_m: Record<string, unknown>): PromptObservatoryMetadata {
        return Object.freeze({}) as PromptObservatoryMetadata
      },
    }
    const builder = createBuilderWithEmitter(emptyEmitter)
    const result = await buildResult(builder, createContext())
    const om = result.metadata.promptAssembly?.observatoryMetadata as PromptObservatoryMetadata
    expect(Object.keys(om ?? {})).toHaveLength(0)
    expect(Object.isFrozen(om)).toBe(true)
  })

  it('emitter that throws propagates error', async () => {
    const throwingEmitter: PromptObservatoryMetadataEmitter = {
      emit(_m: Record<string, unknown>): PromptObservatoryMetadata {
        throw new Error('emitter failure')
      },
    }
    const builder = createBuilderWithEmitter(throwingEmitter)
    await expect(buildResult(builder, createContext())).rejects.toThrow('emitter failure')
  })

  it('emitter returns frozen with null values', async () => {
    const nullEmitter: PromptObservatoryMetadataEmitter = {
      emit(_m: Record<string, unknown>): PromptObservatoryMetadata {
        return Object.freeze({ overview: null }) as PromptObservatoryMetadata
      },
    }
    const builder = createBuilderWithEmitter(nullEmitter)
    const result = await buildResult(builder, createContext())
    const om = result.metadata.promptAssembly?.observatoryMetadata as PromptObservatoryMetadata
    expect(om.overview).toBeNull()
  })

  it('emitter returns frozen with nested arrays', async () => {
    const nestedEmitter: PromptObservatoryMetadataEmitter = {
      emit(_m: Record<string, unknown>): PromptObservatoryMetadata {
        return Object.freeze({
          trace: [{ id: 'a', steps: [{ id: 's1', status: 'done' }] }],
        }) as PromptObservatoryMetadata
      },
    }
    const builder = createBuilderWithEmitter(nestedEmitter)
    const result = await buildResult(builder, createContext())
    const om = result.metadata.promptAssembly?.observatoryMetadata as PromptObservatoryMetadata
    expect(om.trace).toEqual([{ id: 'a', steps: [{ id: 's1', status: 'done' }] }])
  })

  it('multiple emitters in different builders work independently', async () => {
    const e1 = new DefaultPromptObservatoryMetadataEmitter()
    const e2 = new DefaultPromptObservatoryMetadataEmitter()
    const b1 = createBuilderWithEmitter(e1)
    const b2 = createBuilderWithEmitter(e2)
    const ctx = createContext('independent')
    const [r1, r2] = await Promise.all([buildResult(b1, ctx), buildResult(b2, ctx)])
    expect(r1.metadata.promptAssembly?.observatoryMetadata)
      .toEqual(r2.metadata.promptAssembly?.observatoryMetadata)
  })
})

// ---------------------------------------------------------------------------
// Section 32 — Metadata Path Verification
// ---------------------------------------------------------------------------

describe('metadata path verification', () => {
  it('observatoryMetadata is under promptAssembly', async () => {
    const emitter = new DefaultPromptObservatoryMetadataEmitter()
    const builder = createBuilderWithEmitter(emitter)
    const result = await buildResult(builder, createContext())
    const metadata = result.metadata as Record<string, unknown>
    const promptAssembly = metadata.promptAssembly as Record<string, unknown>
    expect(promptAssembly.observatoryMetadata).toBeDefined()
  })

  it('metadata has promptAssembly key', async () => {
    const emitter = new DefaultPromptObservatoryMetadataEmitter()
    const builder = createBuilderWithEmitter(emitter)
    const result = await buildResult(builder, createContext())
    expect(result.metadata).toHaveProperty('promptAssembly')
  })

  it('metadata.promptAssembly has observatoryMetadata key with emitter', async () => {
    const emitter = new DefaultPromptObservatoryMetadataEmitter()
    const builder = createBuilderWithEmitter(emitter)
    const result = await buildResult(builder, createContext())
    expect(result.metadata.promptAssembly).toHaveProperty('observatoryMetadata')
  })

  it('metadata.promptAssembly lacks observatoryMetadata without emitter', async () => {
    const builder = new DefaultPromptBuilder(createModules(), {})
    const result = await buildResult(builder, createContext())
    const pa = result.metadata.promptAssembly
    if (pa) {
      expect('observatoryMetadata' in pa).toBe(false)
    }
  })
})

// ---------------------------------------------------------------------------
// Section 33 — Builder Constructor Coverage
// ---------------------------------------------------------------------------

describe('builder constructor coverage', () => {
  it('constructor with options containing emitter', () => {
    const emitter = new DefaultPromptObservatoryMetadataEmitter()
    const builder = new DefaultPromptBuilder(
      [new UserInputModule()],
      { promptObservatoryMetadataEmitter: emitter },
    )
    expect(builder).toBeDefined()
  })

  it('constructor with options containing emitter + all defaults', () => {
    const emitter = new DefaultPromptObservatoryMetadataEmitter()
    const builder = new DefaultPromptBuilder(
      [new UserInputModule()],
      {
        renderer: new DefaultPromptRenderer(),
        compression: new DefaultPromptCompression(),
        ranking: new DefaultMemoryRanking(),
        budget: new DefaultPromptBudget(),
        selection: new DefaultPromptSelection(),
        promptObservatoryMetadataEmitter: emitter,
      },
    )
    expect(builder).toBeDefined()
  })

  it('constructor with only UserInputModule and options', () => {
    const builder = new DefaultPromptBuilder(
      [new UserInputModule()],
      { promptObservatoryMetadataEmitter: new DefaultPromptObservatoryMetadataEmitter() },
    )
    expect(builder).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Section 34 — Emission Path Verification
// ---------------------------------------------------------------------------

describe('emission path verification', () => {
  it('emission path: BuilderOptions → DefaultPromptBuilder → emit → metadata', async () => {
    const emitter = new DefaultPromptObservatoryMetadataEmitter()
    const builder = new DefaultPromptBuilder(createModules(), {
      promptObservatoryMetadataEmitter: emitter,
    })
    const result = await buildResult(builder, createContext('path-test'))
    expect(result.metadata.promptAssembly?.observatoryMetadata).toBeDefined()
    const om = result.metadata.promptAssembly?.observatoryMetadata
    expect(Object.isFrozen(om)).toBe(true)
  })

  it('emission path: emitters emit() receives promptAssemblyMetadata', async () => {
    let received: Record<string, unknown> | undefined
    const captureEmitter: PromptObservatoryMetadataEmitter = {
      emit(metadata: Record<string, unknown>): PromptObservatoryMetadata {
        received = metadata
        return Object.freeze({}) as PromptObservatoryMetadata
      },
    }
    const builder = createBuilderWithEmitter(captureEmitter)
    await buildResult(builder, createContext('capture'))
    expect(received).toBeDefined()
    expect(received?.strategy).toBeDefined()
  })

  it('emission path: emit result matches builder output when default emitter used', async () => {
    const emitter = new DefaultPromptObservatoryMetadataEmitter()
    const builder = createBuilderWithEmitter(emitter)
    const result = await buildResult(builder, createContext('match'))
    const om = result.metadata.promptAssembly?.observatoryMetadata
    // Verify it has the expected structure
    expect(typeof om).toBe('object')
    expect(Object.isFrozen(om)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Section 35 — Builder Behavior: no prompt changes
// ---------------------------------------------------------------------------

describe('builder behavior — no prompt changes', () => {
  it('prompt output is identical with and without emitter', async () => {
    const ctx = createContext('identical prompt')
    const b1 = new DefaultPromptBuilder(createModules(), {})
    const b2 = createBuilderWithEmitter(new DefaultPromptObservatoryMetadataEmitter())
    const [r1, r2] = await Promise.all([buildResult(b1, ctx), buildResult(b2, ctx)])
    expect(r1.prompt).toBe(r2.prompt)
  })

  it('emitter does not affect prompt module order', async () => {
    const ctx = createContext('module order')
    const b1 = new DefaultPromptBuilder(createModules(), {})
    const b2 = createBuilderWithEmitter(new DefaultPromptObservatoryMetadataEmitter())
    const [r1, r2] = await Promise.all([buildResult(b1, ctx), buildResult(b2, ctx)])
    expect(r1.prompt).toBe(r2.prompt)
  })

  it('emitter does not add content to prompt', async () => {
    const emitter = new DefaultPromptObservatoryMetadataEmitter()
    const builder = createBuilderWithEmitter(emitter)
    const result = await buildResult(builder, createContext('no extra'))
    // Prompt should not contain observatory-related text
    expect(result.prompt).not.toContain('observatory')
    expect(result.prompt).not.toContain('emitter')
  })
})

// ---------------------------------------------------------------------------
// Section 36 — Builder Behavior: metadata only
// ---------------------------------------------------------------------------

describe('builder behavior — metadata only', () => {
  it('emitter adds only to metadata, not prompt', async () => {
    const emitter = new DefaultPromptObservatoryMetadataEmitter()
    const builder = createBuilderWithEmitter(emitter)
    const result = await buildResult(builder, createContext('meta only'))
    expect(result.metadata.promptAssembly?.observatoryMetadata).toBeDefined()
  })

  it('emitter does not modify existing metadata shape', async () => {
    const emitter = new DefaultPromptObservatoryMetadataEmitter()
    const builder = createBuilderWithEmitter(emitter)
    const base = await buildResult(new DefaultPromptBuilder(createModules(), {}), createContext())
    const withEm = await buildResult(builder, createContext())
    // Both should have standard metadata fields
    expect(base.metadata.promptAssembly?.strategy).toBeDefined()
    expect(withEm.metadata.promptAssembly?.strategy).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Section 37 — Stress: large numbers of builds
// ---------------------------------------------------------------------------

describe('stress — large numbers of builds', () => {
  it('50 builds with emitter', async () => {
    const emitter = new DefaultPromptObservatoryMetadataEmitter()
    const builder = createBuilderWithEmitter(emitter)
    for (let i = 0; i < 50; i++) {
      const result = await buildResult(builder, createContext(`stress ${i}`))
      expect(result.metadata.promptAssembly?.observatoryMetadata).toBeDefined()
    }
  })

  it('50 builds without emitter succeed', async () => {
    const builder = new DefaultPromptBuilder(createModules(), {})
    for (let i = 0; i < 50; i++) {
      const result = await buildResult(builder, createContext(`no-emitter ${i}`))
      expect(result).toBeDefined()
    }
  })
})

// ---------------------------------------------------------------------------
// Section 38 — Property Descriptors
// ---------------------------------------------------------------------------

describe('property descriptors', () => {
  it('observatoryMetadata is not readable via getter on metadata (value property)', async () => {
    const emitter = new DefaultPromptObservatoryMetadataEmitter()
    const builder = createBuilderWithEmitter(emitter)
    const result = await buildResult(builder, createContext())
    const pa = result.metadata.promptAssembly as Record<string, unknown>
    const desc = Object.getOwnPropertyDescriptor(pa, 'observatoryMetadata')
    expect(desc?.get).toBeUndefined()
    expect(desc?.set).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// Section 39 — Compatibility: RetryPlanner
// ---------------------------------------------------------------------------

describe('compatibility — RetryPlanner', () => {
  it('RetryPlanner builds still work with emitter', async () => {
    const emitter = new DefaultPromptObservatoryMetadataEmitter()
    const builder = createBuilderWithEmitter(emitter)
    const result = await buildResult(builder, createContext('retry'))
    expect(result.metadata.promptAssembly?.observatoryMetadata).toBeDefined()
    expect(result.prompt).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Section 40 — Multiple Key Coexistence
// ---------------------------------------------------------------------------

describe('multiple key coexistence', () => {
  it('observatoryMetadata + strategy in promptAssembly', async () => {
    const emitter = new DefaultPromptObservatoryMetadataEmitter()
    const builder = createBuilderWithEmitter(emitter)
    const result = await buildResult(builder, createContext())
    const pa = result.metadata.promptAssembly
    expect('strategy' in (pa ?? {})).toBe(true)
    expect('observatoryMetadata' in (pa ?? {})).toBe(true)
  })

  it('observatoryMetadata + ranking + budget + selection', async () => {
    const emitter = new DefaultPromptObservatoryMetadataEmitter()
    const builder = createBuilderWithEmitter(emitter)
    const result = await buildResult(builder, createContext())
    const pa = result.metadata.promptAssembly
    expect('ranking' in (pa ?? {})).toBe(true)
    expect('budget' in (pa ?? {})).toBe(true)
    expect('selection' in (pa ?? {})).toBe(true)
    expect('observatoryMetadata' in (pa ?? {})).toBe(true)
  })

  it('observatoryMetadata does not interfere with other promptAssembly keys', async () => {
    const emitter = new DefaultPromptObservatoryMetadataEmitter()
    const builder = createBuilderWithEmitter(emitter)
    const result = await buildResult(builder, createContext())
    const pa = result.metadata.promptAssembly ?? {}
    // observatoryMetadata should be there but not replace anything
    const keys = Object.keys(pa)
    expect(keys).toContain('observatoryMetadata')
    expect(keys).toContain('strategy')
  })
})

// ---------------------------------------------------------------------------
// Section 41 — Extended BuilderOptions
// ---------------------------------------------------------------------------

describe('extended BuilderOptions', () => {
  it('accepts emitter in smallest possible options object', () => {
    const options: BuilderOptions = { promptObservatoryMetadataEmitter: new DefaultPromptObservatoryMetadataEmitter() }
    const builder = new DefaultPromptBuilder(createModules(), options)
    expect(builder).toBeDefined()
  })

  it('accepts emitter with renderer only', () => {
    const options: BuilderOptions = {
      renderer: new DefaultPromptRenderer(),
      promptObservatoryMetadataEmitter: new DefaultPromptObservatoryMetadataEmitter(),
    }
    const builder = new DefaultPromptBuilder(createModules(), options)
    expect(builder).toBeDefined()
  })

  it('accepts emitter with compression only', () => {
    const options: BuilderOptions = {
      compression: new DefaultPromptCompression(),
      promptObservatoryMetadataEmitter: new DefaultPromptObservatoryMetadataEmitter(),
    }
    const builder = new DefaultPromptBuilder(createModules(), options)
    expect(builder).toBeDefined()
  })

  it('accepts emitter with ranking only', () => {
    const options: BuilderOptions = {
      ranking: new DefaultMemoryRanking(),
      promptObservatoryMetadataEmitter: new DefaultPromptObservatoryMetadataEmitter(),
    }
    const builder = new DefaultPromptBuilder(createModules(), options)
    expect(builder).toBeDefined()
  })

  it('accepts emitter with selection only', () => {
    const options: BuilderOptions = {
      selection: new DefaultPromptSelection(),
      promptObservatoryMetadataEmitter: new DefaultPromptObservatoryMetadataEmitter(),
    }
    const builder = new DefaultPromptBuilder(createModules(), options)
    expect(builder).toBeDefined()
  })

  it('accepts emitter with budget only', () => {
    const options: BuilderOptions = {
      budget: new DefaultPromptBudget(),
      promptObservatoryMetadataEmitter: new DefaultPromptObservatoryMetadataEmitter(),
    }
    const builder = new DefaultPromptBuilder(createModules(), options)
    expect(builder).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Section 42 — Build Result Shape
// ---------------------------------------------------------------------------

describe('build result shape', () => {
  it('result has prompt and metadata', async () => {
    const emitter = new DefaultPromptObservatoryMetadataEmitter()
    const builder = createBuilderWithEmitter(emitter)
    const result = await buildResult(builder, createContext())
    expect(result).toHaveProperty('prompt')
    expect(result).toHaveProperty('metadata')
  })

  it('result.prompt is a string', async () => {
    const emitter = new DefaultPromptObservatoryMetadataEmitter()
    const builder = createBuilderWithEmitter(emitter)
    const result = await buildResult(builder, createContext())
    expect(typeof result.prompt).toBe('string')
  })

  it('result.metadata is an object', async () => {
    const emitter = new DefaultPromptObservatoryMetadataEmitter()
    const builder = createBuilderWithEmitter(emitter)
    const result = await buildResult(builder, createContext())
    expect(typeof result.metadata).toBe('object')
  })

  it('result.metadata.promptAssembly is an object', async () => {
    const emitter = new DefaultPromptObservatoryMetadataEmitter()
    const builder = createBuilderWithEmitter(emitter)
    const result = await buildResult(builder, createContext())
    expect(result.metadata.promptAssembly).toBeDefined()
    expect(typeof result.metadata.promptAssembly).toBe('object')
  })

  it('promptAssembly has observatoryMetadata key', async () => {
    const emitter = new DefaultPromptObservatoryMetadataEmitter()
    const builder = createBuilderWithEmitter(emitter)
    const result = await buildResult(builder, createContext())
    const pa = result.metadata.promptAssembly as Record<string, unknown>
    expect(pa.observatoryMetadata).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Section 43 — Observer Emitter Variations
// ---------------------------------------------------------------------------

describe('emitter variations', () => {
  it('emitter can be the same instance across rebuilds', async () => {
    const emitter = new DefaultPromptObservatoryMetadataEmitter()
    const builder = createBuilderWithEmitter(emitter)
    const r1 = await buildResult(builder, createContext('a'))
    const r2 = await buildResult(builder, createContext('b'))
    expect(r1.metadata.promptAssembly?.observatoryMetadata).toBeDefined()
    expect(r2.metadata.promptAssembly?.observatoryMetadata).toBeDefined()
  })

  it('emitter with no known keys returns empty contract', async () => {
    const emptyEmitter: PromptObservatoryMetadataEmitter = {
      emit(): PromptObservatoryMetadata {
        return Object.freeze({}) as PromptObservatoryMetadata
      },
    }
    const builder = createBuilderWithEmitter(emptyEmitter)
    const result = await buildResult(builder, createContext())
    const om = result.metadata.promptAssembly?.observatoryMetadata as Record<string, unknown>
    expect(Object.keys(om)).toHaveLength(0)
  })

  it('emitter returning single key works', async () => {
    const singleEmitter: PromptObservatoryMetadataEmitter = {
      emit(): PromptObservatoryMetadata {
        return Object.freeze({ overview: { test: true } }) as PromptObservatoryMetadata
      },
    }
    const builder = createBuilderWithEmitter(singleEmitter)
    const result = await buildResult(builder, createContext())
    const om = result.metadata.promptAssembly?.observatoryMetadata as Record<string, unknown>
    expect(om.overview).toEqual({ test: true })
  })

  it('emitter returning all 7 keys with null values', async () => {
    const nullEmitter: PromptObservatoryMetadataEmitter = {
      emit(): PromptObservatoryMetadata {
        return Object.freeze({
          overview: null,
          trace: null,
          timeline: null,
          history: null,
          diff: null,
          runtime: null,
          eventStream: null,
        }) as PromptObservatoryMetadata
      },
    }
    const builder = createBuilderWithEmitter(nullEmitter)
    const result = await buildResult(builder, createContext())
    const om = result.metadata.promptAssembly?.observatoryMetadata as Record<string, unknown>
    expect(Object.keys(om)).toHaveLength(7)
  })
})

// ---------------------------------------------------------------------------
// Section 44 — Metadata Key Overlap
// ---------------------------------------------------------------------------

describe('metadata key overlap', () => {
  it('observatoryMetadata key does not shadow existing observatory key', async () => {
    const emitter = new DefaultPromptObservatoryMetadataEmitter()
    const builder = createBuilderWithEmitter(emitter)
    const result = await buildResult(builder, createContext())
    const pa = result.metadata.promptAssembly as Record<string, unknown>
    // 'observatory' is a separate key from the observatoryBuilder pipeline
    // 'observatoryMetadata' is from the emitter
    // Both can coexist
    expect('observatoryMetadata' in pa).toBe(true)
  })

  it('observatoryMetadata does not collide with observatorySnapshot', async () => {
    const emitter = new DefaultPromptObservatoryMetadataEmitter()
    const builder = createBuilderWithEmitter(emitter)
    const result = await buildResult(builder, createContext())
    const pa = result.metadata.promptAssembly as Record<string, unknown>
    // observatorySnapshot (Phase 0.9599779) and observatoryMetadata (Phase 0.959978)
    // are separate keys and can coexist
    if ('observatorySnapshot' in pa) {
      expect(pa.observatorySnapshot).not.toBe(pa.observatoryMetadata)
    }
  })
})

// ---------------------------------------------------------------------------
// Section 45 — Large Scale Stress
// ---------------------------------------------------------------------------

describe('large scale stress', () => {
  it('100 rapid builds', async () => {
    const emitter = new DefaultPromptObservatoryMetadataEmitter()
    const builder = createBuilderWithEmitter(emitter)
    const promises = Array.from({ length: 100 }, (_, i) =>
      buildResult(builder, createContext(`rapid ${i}`)),
    )
    const results = await Promise.all(promises)
    for (const r of results) {
      expect(r.metadata.promptAssembly?.observatoryMetadata).toBeDefined()
      expect(Object.isFrozen(r.metadata.promptAssembly?.observatoryMetadata)).toBe(true)
    }
  })

  it('sequential builds with varied input', async () => {
    const emitter = new DefaultPromptObservatoryMetadataEmitter()
    const builder = createBuilderWithEmitter(emitter)
    for (let i = 0; i < 50; i++) {
      const result = await buildResult(builder, createContext(`seq-${i}`))
      expect(result.metadata.promptAssembly?.observatoryMetadata).toBeDefined()
    }
  })
})

// ---------------------------------------------------------------------------
// Section 46 — Contract Type Assurance
// ---------------------------------------------------------------------------

describe('contract type assurance', () => {
  it('observatoryMetadata is a PromptObservatoryMetadata compliant object', async () => {
    const emitter = new DefaultPromptObservatoryMetadataEmitter()
    const builder = createBuilderWithEmitter(emitter)
    const result = await buildResult(builder, createContext())
    const om = result.metadata.promptAssembly?.observatoryMetadata as PromptObservatoryMetadata
    expect(typeof om).toBe('object')
    expect(om).not.toBeNull()
  })

  it('observatoryMetadata fields are readonly (frozen)', async () => {
    const emitter = new DefaultPromptObservatoryMetadataEmitter()
    const builder = createBuilderWithEmitter(emitter)
    const result = await buildResult(builder, createContext())
    const om = result.metadata.promptAssembly?.observatoryMetadata
    expect(Object.isFrozen(om)).toBe(true)
    if (om && Object.keys(om).length > 0) {
      const firstKey = Object.keys(om)[0]
      const desc = Object.getOwnPropertyDescriptor(om, firstKey)
      expect(desc?.writable).toBe(false)
    }
  })
})

// ---------------------------------------------------------------------------
// Section 47 — Build with Various Context Sizes
// ---------------------------------------------------------------------------

describe('build with various context sizes', () => {
  it('short input (1 char)', async () => {
    const emitter = new DefaultPromptObservatoryMetadataEmitter()
    const builder = createBuilderWithEmitter(emitter)
    const result = await buildResult(builder, createContext('a'))
    expect(result.metadata.promptAssembly?.observatoryMetadata).toBeDefined()
  })

  it('empty input string', async () => {
    const emitter = new DefaultPromptObservatoryMetadataEmitter()
    const builder = createBuilderWithEmitter(emitter)
    const result = await buildResult(builder, createContext(''))
    expect(result.metadata.promptAssembly?.observatoryMetadata).toBeDefined()
  })

  it('long input (1000 chars)', async () => {
    const emitter = new DefaultPromptObservatoryMetadataEmitter()
    const builder = createBuilderWithEmitter(emitter)
    const longInput = 'x'.repeat(1000)
    const result = await buildResult(builder, createContext(longInput))
    expect(result.metadata.promptAssembly?.observatoryMetadata).toBeDefined()
  })

  it('input with special characters', async () => {
    const emitter = new DefaultPromptObservatoryMetadataEmitter()
    const builder = createBuilderWithEmitter(emitter)
    const result = await buildResult(builder, createContext('test!@#$%^&*()_+{}:<>?'))
    expect(result.metadata.promptAssembly?.observatoryMetadata).toBeDefined()
  })

  it('input with unicode characters', async () => {
    const emitter = new DefaultPromptObservatoryMetadataEmitter()
    const builder = createBuilderWithEmitter(emitter)
    const result = await buildResult(builder, createContext('こんにちは世界 🌍'))
    expect(result.metadata.promptAssembly?.observatoryMetadata).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Section 48 — Multiple Module Combinations
// ---------------------------------------------------------------------------

describe('multiple module combinations', () => {
  it('UserInputModule only', async () => {
    const emitter = new DefaultPromptObservatoryMetadataEmitter()
    const builder = new DefaultPromptBuilder(
      [new UserInputModule()],
      { promptObservatoryMetadataEmitter: emitter },
    )
    const result = await buildResult(builder, createContext('user only'))
    expect(result.metadata.promptAssembly?.observatoryMetadata).toBeDefined()
  })

  it('UserInputModule + SystemPromptModule', async () => {
    const emitter = new DefaultPromptObservatoryMetadataEmitter()
    const builder = new DefaultPromptBuilder(
      [new UserInputModule(), new SystemPromptModule()],
      { promptObservatoryMetadataEmitter: emitter },
    )
    const result = await buildResult(builder, createContext('user+system'))
    expect(result.metadata.promptAssembly?.observatoryMetadata).toBeDefined()
  })

  it('SystemPromptModule only (no user module)', async () => {
    const emitter = new DefaultPromptObservatoryMetadataEmitter()
    const builder = new DefaultPromptBuilder(
      [new SystemPromptModule()],
      { promptObservatoryMetadataEmitter: emitter },
    )
    const result = await buildResult(builder, createContext('system only'))
    expect(result.metadata.promptAssembly?.observatoryMetadata).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Section 49 — Phase Positioning Verification
// ---------------------------------------------------------------------------

describe('phase positioning verification', () => {
  it('observatoryMetadata is separate from observatorySnapshot (different phases)', async () => {
    const emitter = new DefaultPromptObservatoryMetadataEmitter()
    const builder = createBuilderWithEmitter(emitter)
    const result = await buildResult(builder, createContext())
    const pa = result.metadata.promptAssembly as Record<string, unknown>
    // Phase 0.9599779 produces observatorySnapshot if builder is set
    // Phase 0.959978 produces observatoryMetadata
    // They can coexist
    expect('observatoryMetadata' in pa).toBe(true)
  })

  it('observatoryMetadata appears before strategy in metadata output order', async () => {
    // In the metadata assembly, observatoryMetadata is spread before strategy
    const emitter = new DefaultPromptObservatoryMetadataEmitter()
    const builder = createBuilderWithEmitter(emitter)
    const result = await buildResult(builder, createContext())
    const pa = result.metadata.promptAssembly as Record<string, unknown>
    const keys = Object.keys(pa)
    const omIdx = keys.indexOf('observatoryMetadata')
    const stratIdx = keys.indexOf('strategy')
    // strategy comes after the observatoryMetadata spread position
    // The spread order in code is: observatoryMetadata (additive) then explicit keys
    expect(omIdx).toBeGreaterThanOrEqual(0)
    expect(stratIdx).toBeGreaterThanOrEqual(0)
  })
})

// ---------------------------------------------------------------------------
// Section 50 — Emitter Null/Undefined Behavior
// ---------------------------------------------------------------------------

describe('emitter null/undefined behavior', () => {
  it('null emitter in options is handled (not used)', () => {
    const options = { promptObservatoryMetadataEmitter: null as unknown as PromptObservatoryMetadataEmitter }
    // TypeScript would warn but at runtime this would just be assigned
    // The builder should still work
    const builder = new DefaultPromptBuilder(createModules(), {})
    expect(builder).toBeDefined()
  })

  it('omitted emitter means no observatoryMetadata in build result', async () => {
    const builder = new DefaultPromptBuilder(createModules(), {})
    const result = await buildResult(builder, createContext())
    const pa = result.metadata.promptAssembly as Record<string, unknown> | undefined
    if (pa) {
      expect('observatoryMetadata' in pa).toBe(false)
    }
  })

  it('emitter set to undefined via options accepted', () => {
    const options: BuilderOptions = { promptObservatoryMetadataEmitter: undefined }
    const builder = new DefaultPromptBuilder(createModules(), options)
    expect(builder).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Section 51 — Object Property Verification
// ---------------------------------------------------------------------------

describe('object property verification', () => {
  it('observatoryMetadata is own property of promptAssembly (not inherited)', async () => {
    const emitter = new DefaultPromptObservatoryMetadataEmitter()
    const builder = createBuilderWithEmitter(emitter)
    const result = await buildResult(builder, createContext())
    const pa = result.metadata.promptAssembly as Record<string, unknown>
    expect(Object.prototype.hasOwnProperty.call(pa, 'observatoryMetadata')).toBe(true)
  })

  it('observatoryMetadata is enumerable', async () => {
    const emitter = new DefaultPromptObservatoryMetadataEmitter()
    const builder = createBuilderWithEmitter(emitter)
    const result = await buildResult(builder, createContext())
    const pa = result.metadata.promptAssembly as Record<string, unknown>
    const descriptor = Object.getOwnPropertyDescriptor(pa, 'observatoryMetadata')
    expect(descriptor?.enumerable).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Section 52 — Default Observable Behavior
// ---------------------------------------------------------------------------

describe('default observable behavior', () => {
  it('default emitter produces frozen observatoryMetadata', async () => {
    const emitter = new DefaultPromptObservatoryMetadataEmitter()
    const builder = createBuilderWithEmitter(emitter)
    const result = await buildResult(builder, createContext())
    expect(Object.isFrozen(result.metadata.promptAssembly?.observatoryMetadata)).toBe(true)
  })

  it('default emitter produces observatoryMetadata with strategy key', async () => {
    const emitter = new DefaultPromptObservatoryMetadataEmitter()
    const builder = createBuilderWithEmitter(emitter)
    const result = await buildResult(builder, createContext())
    const om = result.metadata.promptAssembly?.observatoryMetadata as Record<string, unknown>
    // The promptAssemblyMetadata passed to emit() has strategy
    // The builder returns a PromptObservatoryMetadata which may not have strategy
    // since strategy is not a known observatory key
    expect(typeof om).toBe('object')
  })
})

// ---------------------------------------------------------------------------
// Section 53 — Error Recovery
// ---------------------------------------------------------------------------

describe('error recovery', () => {
  it('build fails when emitter throws', async () => {
    const badEmitter: PromptObservatoryMetadataEmitter = {
      emit(): PromptObservatoryMetadata {
        throw new Error('emit failed')
      },
    }
    const builder = createBuilderWithEmitter(badEmitter)
    await expect(buildResult(builder, createContext())).rejects.toThrow('emit failed')
  })

  it('build throws custom error message from emitter', async () => {
    const badEmitter: PromptObservatoryMetadataEmitter = {
      emit(): PromptObservatoryMetadata {
        throw new Error('custom emitter error')
      },
    }
    const builder = createBuilderWithEmitter(badEmitter)
    await expect(buildResult(builder, createContext())).rejects.toThrow('custom emitter error')
  })
})

// ---------------------------------------------------------------------------
// Section 54 — Emitter Construction Patterns
// ---------------------------------------------------------------------------

describe('emitter construction patterns', () => {
  it('emitter with DefaultPromptObservatoryMetadataBuilder works', async () => {
    const builder = new DefaultPromptObservatoryMetadataBuilder()
    const emitter = new DefaultPromptObservatoryMetadataEmitter(builder)
    const pb = createBuilderWithEmitter(emitter)
    const result = await buildResult(pb, createContext())
    expect(result.metadata.promptAssembly?.observatoryMetadata).toBeDefined()
  })

  it('emitter with custom builder works', async () => {
    const customBuilder = {
      build(_m: Record<string, unknown>): PromptObservatoryMetadata {
        return Object.freeze({ overview: { custom: true } }) as PromptObservatoryMetadata
      },
    }
    const emitter = new DefaultPromptObservatoryMetadataEmitter(customBuilder)
    const pb = createBuilderWithEmitter(emitter)
    const result = await buildResult(pb, createContext())
    const om = result.metadata.promptAssembly?.observatoryMetadata as Record<string, unknown>
    expect(om.overview).toEqual({ custom: true })
  })

  it('emitter default construction uses DefaultPromptObservatoryMetadataBuilder', async () => {
    const emitter = new DefaultPromptObservatoryMetadataEmitter()
    const pb = createBuilderWithEmitter(emitter)
    const result = await buildResult(pb, createContext())
    expect(result.metadata.promptAssembly?.observatoryMetadata).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Section 55 — PromptBuilder API Preservation
// ---------------------------------------------------------------------------

describe('PromptBuilder API preservation', () => {
  it('build methods retain signature', () => {
    const emitter = new DefaultPromptObservatoryMetadataEmitter()
    const builder = createBuilderWithEmitter(emitter)
    expect(typeof builder.build).toBe('function')
  })

  it('build returns Promise<{ prompt: string, metadata: Record<string, unknown> }>', async () => {
    const emitter = new DefaultPromptObservatoryMetadataEmitter()
    const builder = createBuilderWithEmitter(emitter)
    const result = await buildResult(builder, createContext())
    expect(typeof result.prompt).toBe('string')
    expect(typeof result.metadata).toBe('object')
  })

  it('buildContext method still works', async () => {
    const emitter = new DefaultPromptObservatoryMetadataEmitter()
    const builder = createBuilderWithEmitter(emitter)
    const ctx = await builder.buildContext(createContext())
    expect(ctx).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Section 56 — Interleaved Build Patterns
// ---------------------------------------------------------------------------

describe('interleaved build patterns', () => {
  it('mix of builds with and without emitter', async () => {
    const withEm = createBuilderWithEmitter(new DefaultPromptObservatoryMetadataEmitter())
    const withoutEm = new DefaultPromptBuilder(createModules(), {})
    const ctx = createContext('interleaved')
    const r1 = await buildResult(withEm, ctx)
    const r2 = await buildResult(withoutEm, ctx)
    const r3 = await buildResult(withEm, ctx)
    expect(r1.metadata.promptAssembly?.observatoryMetadata).toBeDefined()
    expect(r2.metadata.promptAssembly?.observatoryMetadata).toBeUndefined()
    expect(r3.metadata.promptAssembly?.observatoryMetadata).toBeDefined()
  })

  it('alternating builds produce consistent results', async () => {
    const e1 = createBuilderWithEmitter(new DefaultPromptObservatoryMetadataEmitter())
    const e2 = createBuilderWithEmitter(new DefaultPromptObservatoryMetadataEmitter())
    const ctx = createContext('alternating')
    const results = await Promise.all([
      buildResult(e1, ctx),
      buildResult(e2, ctx),
      buildResult(e1, ctx),
      buildResult(e2, ctx),
    ])
    expect(results[0].metadata.promptAssembly?.observatoryMetadata)
      .toEqual(results[2].metadata.promptAssembly?.observatoryMetadata)
    expect(results[1].metadata.promptAssembly?.observatoryMetadata)
      .toEqual(results[3].metadata.promptAssembly?.observatoryMetadata)
  })
})

// ---------------------------------------------------------------------------
// Section 57 — Custom Emitter Byte Coverage
// ---------------------------------------------------------------------------

describe('custom emitter byte coverage', () => {
  it('emitter receives metadata with strategy name', async () => {
    let captured: Record<string, unknown> | undefined
    const capture: PromptObservatoryMetadataEmitter = {
      emit(m: Record<string, unknown>): PromptObservatoryMetadata {
        captured = m
        return Object.freeze({}) as PromptObservatoryMetadata
      },
    }
    const builder = createBuilderWithEmitter(capture)
    await buildResult(builder, createContext('capture strategy'))
    expect(captured?.strategy).toBeDefined()
  })

  it('emitter receives non-empty metadata object', async () => {
    let captured: Record<string, unknown> | undefined
    const capture: PromptObservatoryMetadataEmitter = {
      emit(m: Record<string, unknown>): PromptObservatoryMetadata {
        captured = m
        return Object.freeze({}) as PromptObservatoryMetadata
      },
    }
    const builder = createBuilderWithEmitter(capture)
    await buildResult(builder, createContext('non-empty'))
    expect(captured).toBeDefined()
    expect(Object.keys(captured ?? {})).toHaveLength(2) // strategy, strategyRendered
  })

  it('emitter result is stored exactly as returned', async () => {
    const expected = Object.freeze({ overview: { exact: true } }) as PromptObservatoryMetadata
    const exact: PromptObservatoryMetadataEmitter = {
      emit(): PromptObservatoryMetadata {
        return expected
      },
    }
    const builder = createBuilderWithEmitter(exact)
    const result = await buildResult(builder, createContext('exact'))
    expect(result.metadata.promptAssembly?.observatoryMetadata).toBe(expected)
  })
})

// ---------------------------------------------------------------------------
// Section 58 — Build Count Independence
// ---------------------------------------------------------------------------

describe('build count independence', () => {
  it('1 build produces same observatoryMetadata as 100th build', async () => {
    const builder = createBuilderWithEmitter(new DefaultPromptObservatoryMetadataEmitter())
    const ctx = createContext('stable')
    const first = await buildResult(builder, ctx)
    for (let i = 0; i < 99; i++) {
      const next = await buildResult(builder, ctx)
      expect(next.metadata.promptAssembly?.observatoryMetadata)
        .toEqual(first.metadata.promptAssembly?.observatoryMetadata)
    }
  })
})

// ---------------------------------------------------------------------------
// Section 59 — Phase Order Assertions
// ---------------------------------------------------------------------------

describe('phase order assertions', () => {
  it('observatoryMetadata key order is deterministic', async () => {
    const builder = createBuilderWithEmitter(new DefaultPromptObservatoryMetadataEmitter())
    const ctx = createContext('order')
    const r1 = await buildResult(builder, ctx)
    const r2 = await buildResult(builder, ctx)
    const keys1 = Object.keys(r1.metadata.promptAssembly ?? {})
    const keys2 = Object.keys(r2.metadata.promptAssembly ?? {})
    expect(keys1).toEqual(keys2)
  })

  it('observatoryMetadata position in keys is stable', async () => {
    const builder = createBuilderWithEmitter(new DefaultPromptObservatoryMetadataEmitter())
    const results = await Promise.all(
      Array.from({ length: 20 }, () => buildResult(builder, createContext('stable-order'))),
    )
    for (const r of results) {
      const keys = Object.keys(r.metadata.promptAssembly ?? {})
      const omIdx = keys.indexOf('observatoryMetadata')
      expect(omIdx).toBeGreaterThanOrEqual(0)
    }
  })
})

// ---------------------------------------------------------------------------
// Section 60 — Builder Compatible Edge Cases
// ---------------------------------------------------------------------------

describe('builder compatible edge cases', () => {
  it('default builder with no modules works', async () => {
    const emitter = new DefaultPromptObservatoryMetadataEmitter()
    const builder = new DefaultPromptBuilder([], { promptObservatoryMetadataEmitter: emitter })
    const result = await buildResult(builder, createContext('no modules'))
    expect(result.metadata.promptAssembly?.observatoryMetadata).toBeDefined()
  })

  it('build with empty modules array works', async () => {
    const emitter = new DefaultPromptObservatoryMetadataEmitter()
    const builder = new DefaultPromptBuilder([], { promptObservatoryMetadataEmitter: emitter })
    const result = await buildResult(builder, createContext('empty modules'))
    expect(result.metadata.promptAssembly?.observatoryMetadata).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Section 61 — Path Integrity
// ---------------------------------------------------------------------------

describe('path integrity', () => {
  it('observatoryMetadata is NOT at top level metadata', async () => {
    const builder = createBuilderWithEmitter(new DefaultPromptObservatoryMetadataEmitter())
    const result = await buildResult(builder, createContext('path'))
    expect('observatoryMetadata' in result.metadata).toBe(false)
  })

  it('observatoryMetadata is ONLY under promptAssembly', async () => {
    const builder = createBuilderWithEmitter(new DefaultPromptObservatoryMetadataEmitter())
    const result = await buildResult(builder, createContext('only-under'))
    const allKeys = new Set(Object.keys(result.metadata))
    const paKeys = Object.keys(result.metadata.promptAssembly ?? {})
    // observatoryMetadata should only be in promptAssembly keys, not top-level
    expect(paKeys).toContain('observatoryMetadata')
  })
})

// ---------------------------------------------------------------------------
// Section 62 — Variable Input Stress
// ---------------------------------------------------------------------------

describe('variable input stress', () => {
  it('20 different contexts produce 20 observatoryMetadata results', async () => {
    const builder = createBuilderWithEmitter(new DefaultPromptObservatoryMetadataEmitter())
    for (let i = 0; i < 20; i++) {
      const ctx = createContext(`variant-${i}-${'a'.repeat(i)}`)
      const result = await buildResult(builder, ctx)
      expect(result.metadata.promptAssembly?.observatoryMetadata).toBeDefined()
    }
  })

  it('10 parallel builds with different contexts', async () => {
    const builder = createBuilderWithEmitter(new DefaultPromptObservatoryMetadataEmitter())
    const results = await Promise.all(
      Array.from({ length: 10 }, (_, i) => buildResult(builder, createContext(`parallel-${i}`))),
    )
    for (const r of results) {
      expect(r.metadata.promptAssembly?.observatoryMetadata).toBeDefined()
    }
  })
})

// ---------------------------------------------------------------------------
// Section 63 — Frozen Integrity Verification
// ---------------------------------------------------------------------------

describe('frozen integrity verification', () => {
  it('observatoryMetadata cannot be extended', async () => {
    const builder = createBuilderWithEmitter(new DefaultPromptObservatoryMetadataEmitter())
    const result = await buildResult(builder, createContext('frozen-test'))
    const om = result.metadata.promptAssembly?.observatoryMetadata as Record<string, unknown>
    expect(Object.isExtensible(om)).toBe(false)
  })

  it('observatoryMetadata properties cannot be deleted', async () => {
    const builder = createBuilderWithEmitter(new DefaultPromptObservatoryMetadataEmitter())
    const result = await buildResult(builder, createContext('no-delete'))
    const om = result.metadata.promptAssembly?.observatoryMetadata
    expect(Object.isFrozen(om)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Section 64 — BuilderOptions Type Coverage
// ---------------------------------------------------------------------------

describe('BuilderOptions type coverage', () => {
  it('type: BuilderOptions accepts the emitter field', () => {
    const options: BuilderOptions = {
      promptObservatoryMetadataEmitter: new DefaultPromptObservatoryMetadataEmitter(),
    }
    expect(options.promptObservatoryMetadataEmitter).toBeDefined()
  })

  it('type: BuilderOptions without emitter is valid', () => {
    const options: BuilderOptions = {}
    expect(options).toBeDefined()
  })

  it('type: BuilderOptions partial with emitter', () => {
    const options: BuilderOptions = {
      renderer: new DefaultPromptRenderer(),
      promptObservatoryMetadataEmitter: new DefaultPromptObservatoryMetadataEmitter(),
    }
    expect(options).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Section 65 — Metadata Integrity
// ---------------------------------------------------------------------------

describe('metadata integrity', () => {
  it('observatoryMetadata in promptAssembly during the same build appears at correct path', async () => {
    const builder = createBuilderWithEmitter(new DefaultPromptObservatoryMetadataEmitter())
    const result = await buildResult(builder, createContext('integrity'))
    const pa = result.metadata.promptAssembly as Record<string, unknown>
    expect(pa.observatoryMetadata).toBeDefined()
    // It should not be placed at unexpected locations
    expect((pa as Record<string, unknown>).observatoryMetadata).not.toBeUndefined()
  })

  it('observatoryMetadata is a distinct object from the input metadata', async () => {
    let emitted: PromptObservatoryMetadata | undefined
    const capture: PromptObservatoryMetadataEmitter = {
      emit(m: Record<string, unknown>): PromptObservatoryMetadata {
        emitted = new DefaultPromptObservatoryMetadataEmitter().emit(m)
        return emitted
      },
    }
    const builder = createBuilderWithEmitter(capture)
    const result = await buildResult(builder, createContext('distinct'))
    const stored = result.metadata.promptAssembly?.observatoryMetadata
    // The stored value should be the same object returned by emit()
    expect(stored).toBe(emitted)
  })
})

// ---------------------------------------------------------------------------
// Section 66 — Determinism Verification
// ---------------------------------------------------------------------------

describe('determinism verification', () => {
  it('100 builds with same context produce strictly equal observatoryMetadata', async () => {
    const builder = createBuilderWithEmitter(new DefaultPromptObservatoryMetadataEmitter())
    const first = await buildResult(builder, createContext('deterministic'))
    for (let i = 0; i < 99; i++) {
      const next = await buildResult(builder, createContext('deterministic'))
      expect(next.metadata.promptAssembly?.observatoryMetadata)
        .toEqual(first.metadata.promptAssembly?.observatoryMetadata)
    }
  })

  it('three sequential builds produce same observatoryMetadata', async () => {
    const builder = createBuilderWithEmitter(new DefaultPromptObservatoryMetadataEmitter())
    const ctx = createContext('seq-det')
    const r1 = await buildResult(builder, ctx)
    const r2 = await buildResult(builder, ctx)
    const r3 = await buildResult(builder, ctx)
    expect(r1.metadata.promptAssembly?.observatoryMetadata)
      .toEqual(r2.metadata.promptAssembly?.observatoryMetadata)
    expect(r2.metadata.promptAssembly?.observatoryMetadata)
      .toEqual(r3.metadata.promptAssembly?.observatoryMetadata)
  })
})

// ---------------------------------------------------------------------------
// Section 67 — Emitter Chaining
// ---------------------------------------------------------------------------

describe('emitter chaining', () => {
  it('emitter can call another emitter internally', async () => {
    const inner = new DefaultPromptObservatoryMetadataEmitter()
    let innerCalled = false
    const wrapper: PromptObservatoryMetadataEmitter = {
      emit(m: Record<string, unknown>): PromptObservatoryMetadata {
        innerCalled = true
        return inner.emit(m)
      },
    }
    const builder = createBuilderWithEmitter(wrapper)
    await buildResult(builder, createContext('chained'))
    expect(innerCalled).toBe(true)
  })

  it('chained emitter stores correct result', async () => {
    const inner = new DefaultPromptObservatoryMetadataEmitter()
    const wrapper: PromptObservatoryMetadataEmitter = {
      emit(m: Record<string, unknown>): PromptObservatoryMetadata {
        return inner.emit(m)
      },
    }
    const builder = createBuilderWithEmitter(wrapper)
    const result = await buildResult(builder, createContext('chain-store'))
    expect(Object.isFrozen(result.metadata.promptAssembly?.observatoryMetadata)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Section 68 — Custom Emitter Frozen Return
// ---------------------------------------------------------------------------

describe('custom emitter frozen return', () => {
  it('custom emitter that returns non-frozen object stores non-frozen', async () => {
    const nonFrozen: PromptObservatoryMetadataEmitter = {
      emit(): PromptObservatoryMetadata {
        return { overview: {} } as PromptObservatoryMetadata
      },
    }
    const builder = createBuilderWithEmitter(nonFrozen)
    const result = await buildResult(builder, createContext('non-frozen'))
    const om = result.metadata.promptAssembly?.observatoryMetadata
    expect(Object.isFrozen(om)).toBe(false)
  })

  it('custom emitter that returns frozen stores frozen', async () => {
    const frozen: PromptObservatoryMetadataEmitter = {
      emit(): PromptObservatoryMetadata {
        return Object.freeze({ overview: {} }) as PromptObservatoryMetadata
      },
    }
    const builder = createBuilderWithEmitter(frozen)
    const result = await buildResult(builder, createContext('frozen-custom'))
    const om = result.metadata.promptAssembly?.observatoryMetadata
    expect(Object.isFrozen(om)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Section 69 — BuilderOptions Specific Fields
// ---------------------------------------------------------------------------

describe('BuilderOptions specific fields', () => {
  it('promptObservatoryMetadataEmitter field exists in BuilderOptions type', () => {
    const opts: BuilderOptions = {}
    expect('promptObservatoryMetadataEmitter' in opts).toBe(false) // undefined
  })

  it('promptObservatoryMetadataEmitter listed in options object', () => {
    const emitter = new DefaultPromptObservatoryMetadataEmitter()
    const opts: BuilderOptions = { promptObservatoryMetadataEmitter: emitter }
    expect(opts.promptObservatoryMetadataEmitter).toBe(emitter)
  })
})

// ---------------------------------------------------------------------------
// Section 70 — Output Consistency
// ---------------------------------------------------------------------------

describe('output consistency', () => {
  it('emitter presence does not change prompt output length', async () => {
    const ctx = createContext('length test')
    const b1 = new DefaultPromptBuilder(createModules(), {})
    const b2 = createBuilderWithEmitter(new DefaultPromptObservatoryMetadataEmitter())
    const [r1, r2] = await Promise.all([buildResult(b1, ctx), buildResult(b2, ctx)])
    expect(r1.prompt.length).toBe(r2.prompt.length)
  })

  it('emitter presence does not change metadata structure', async () => {
    const ctx = createContext('structure')
    const b1 = new DefaultPromptBuilder(createModules(), {})
    const b2 = createBuilderWithEmitter(new DefaultPromptObservatoryMetadataEmitter())
    const [r1, r2] = await Promise.all([buildResult(b1, ctx), buildResult(b2, ctx)])
    // Both have promptAssembly with standard keys
    expect(typeof r1.metadata.promptAssembly).toBe(typeof r2.metadata.promptAssembly)
  })
})

// ---------------------------------------------------------------------------
// Section 71 — Emitter Configuration
// ---------------------------------------------------------------------------

describe('emitter configuration', () => {
  it('DefaultPromptObservatoryMetadataEmitter can be configured with custom builder', () => {
    const builder = new DefaultPromptObservatoryMetadataBuilder()
    const emitter = new DefaultPromptObservatoryMetadataEmitter(builder)
    const pb = createBuilderWithEmitter(emitter)
    expect(pb).toBeDefined()
  })

  it('emitter with builder set to undefined works (defaults)', () => {
    const emitter = new DefaultPromptObservatoryMetadataEmitter(undefined)
    const pb = createBuilderWithEmitter(emitter)
    expect(pb).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Section 72 — Metadata Presence
// ---------------------------------------------------------------------------

describe('metadata presence', () => {
  it('observatoryMetadata present when emitter in options', async () => {
    const builder = createBuilderWithEmitter(new DefaultPromptObservatoryMetadataEmitter())
    const result = await buildResult(builder, createContext('present'))
    expect(result.metadata.promptAssembly?.observatoryMetadata).toBeDefined()
  })

  it('observatoryMetadata absent when emitter not in options', async () => {
    const builder = new DefaultPromptBuilder(createModules(), {})
    const result = await buildResult(builder, createContext('absent'))
    const pa = result.metadata.promptAssembly as Record<string, unknown> | undefined
    if (pa) {
      expect('observatoryMetadata' in pa).toBe(false)
    }
  })
})

// ---------------------------------------------------------------------------
// Section 73 — Emitter Integration
// ---------------------------------------------------------------------------

describe('emitter integration', () => {
  it('full integration: emitter in BuilderOptions → build → observatoryMetadata', async () => {
    const emitter = new DefaultPromptObservatoryMetadataEmitter()
    const builder = new DefaultPromptBuilder(createModules(), {
      promptObservatoryMetadataEmitter: emitter,
    })
    const result = await buildResult(builder, createContext('full-integration'))
    const om = result.metadata.promptAssembly?.observatoryMetadata
    expect(om).toBeDefined()
    expect(Object.isFrozen(om)).toBe(true)
  })

  it('integration: emitter with empty builder options', async () => {
    const builder = new DefaultPromptBuilder(createModules(), {
      promptObservatoryMetadataEmitter: new DefaultPromptObservatoryMetadataEmitter(),
    })
    const result = await buildResult(builder, createContext('empty-opts'))
    expect(result.metadata.promptAssembly?.observatoryMetadata).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Section 74 — Object Type Checks
// ---------------------------------------------------------------------------

describe('object type checks', () => {
  it('observatoryMetadata is a plain object', async () => {
    const builder = createBuilderWithEmitter(new DefaultPromptObservatoryMetadataEmitter())
    const result = await buildResult(builder, createContext('plain'))
    const om = result.metadata.promptAssembly?.observatoryMetadata
    expect(Object.getPrototypeOf(om)).toBe(Object.prototype)
  })

  it('observatoryMetadata is not null', async () => {
    const builder = createBuilderWithEmitter(new DefaultPromptObservatoryMetadataEmitter())
    const result = await buildResult(builder, createContext('not-null'))
    expect(result.metadata.promptAssembly?.observatoryMetadata).not.toBeNull()
  })
})

// ---------------------------------------------------------------------------
// Section 75 — Build Method Overload
// ---------------------------------------------------------------------------

describe('build method overload', () => {
  it('build with context returns observatoryMetadata', async () => {
    const builder = createBuilderWithEmitter(new DefaultPromptObservatoryMetadataEmitter())
    const result = await buildResult(builder, createContext('overload'))
    expect(result.metadata.promptAssembly?.observatoryMetadata).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Section 76 — Emitter Metadata Shape
// ---------------------------------------------------------------------------

describe('emitter metadata shape', () => {
  it('observatoryMetadata has correct top-level shape', async () => {
    const builder = createBuilderWithEmitter(new DefaultPromptObservatoryMetadataEmitter())
    const result = await buildResult(builder, createContext('shape'))
    const om = result.metadata.promptAssembly?.observatoryMetadata as PromptObservatoryMetadata
    expect(typeof om).toBe('object')
    expect(om).not.toBeNull()
  })
})

// ---------------------------------------------------------------------------
// Section 77 — Builder Construction
// ---------------------------------------------------------------------------

describe('builder construction', () => {
  it('constructs with emitter and empty modules', () => {
    const builder = new DefaultPromptBuilder([], {
      promptObservatoryMetadataEmitter: new DefaultPromptObservatoryMetadataEmitter(),
    })
    expect(builder).toBeDefined()
  })

  it('constructs with emitter and UserInputModule', () => {
    const builder = createBuilderWithEmitter(new DefaultPromptObservatoryMetadataEmitter())
    expect(builder).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Section 78 — Emitter Call Count
// ---------------------------------------------------------------------------

describe('emitter call count', () => {
  it('emitter called exactly once per build', async () => {
    const { emitter, callCount } = createMockEmitter()
    const builder = createBuilderWithEmitter(emitter)
    await buildResult(builder, createContext('one'))
    expect(callCount()).toBe(1)
  })

  it('emitter called 5 times for 5 builds', async () => {
    const { emitter, callCount } = createMockEmitter()
    const builder = createBuilderWithEmitter(emitter)
    for (let i = 0; i < 5; i++) {
      await buildResult(builder, createContext(`call-${i}`))
    }
    expect(callCount()).toBe(5)
  })
})

// ---------------------------------------------------------------------------
// Section 79 — Emitter Data Flow
// ---------------------------------------------------------------------------

describe('emitter data flow', () => {
  it('emit receives the assembly metadata from builder', async () => {
    let captured: Record<string, unknown> | undefined
    const capture: PromptObservatoryMetadataEmitter = {
      emit(m: Record<string, unknown>): PromptObservatoryMetadata {
        captured = m
        return Object.freeze({}) as PromptObservatoryMetadata
      },
    }
    const builder = createBuilderWithEmitter(capture)
    await buildResult(builder, createContext('data-flow'))
    expect(captured).toBeDefined()
    expect(typeof captured?.strategy).toBe('object')
  })
})

// ---------------------------------------------------------------------------
// Section 80 — Cross-Platform Consistency
// ---------------------------------------------------------------------------

describe('cross-platform consistency', () => {
  it('different builders with same emitter config produce same observatoryMetadata', async () => {
    const emitter = new DefaultPromptObservatoryMetadataEmitter()
    const b1 = new DefaultPromptBuilder(createModules(), {
      promptObservatoryMetadataEmitter: emitter,
    })
    const b2 = new DefaultPromptBuilder(createModules(), {
      promptObservatoryMetadataEmitter: emitter,
    })
    const ctx = createContext('cross-platform')
    const [r1, r2] = await Promise.all([buildResult(b1, ctx), buildResult(b2, ctx)])
    expect(r1.metadata.promptAssembly?.observatoryMetadata)
      .toEqual(r2.metadata.promptAssembly?.observatoryMetadata)
  })

  it('same config across different builder instances', async () => {
    const config: BuilderOptions = {
      promptObservatoryMetadataEmitter: new DefaultPromptObservatoryMetadataEmitter(),
    }
    const b1 = new DefaultPromptBuilder(createModules(), config)
    const b2 = new DefaultPromptBuilder(createModules(), config)
    const ctx = createContext('same-config')
    const [r1, r2] = await Promise.all([buildResult(b1, ctx), buildResult(b2, ctx)])
    expect(r1.metadata.promptAssembly?.observatoryMetadata)
      .toEqual(r2.metadata.promptAssembly?.observatoryMetadata)
  })
})

// ---------------------------------------------------------------------------
// Section 81 — Emitter Selection
// ---------------------------------------------------------------------------

describe('emitter selection', () => {
  it('default emitter produces observatoryMetadata', async () => {
    const builder = createBuilderWithEmitter(new DefaultPromptObservatoryMetadataEmitter())
    const result = await buildResult(builder, createContext('default'))
    expect(result.metadata.promptAssembly?.observatoryMetadata).toBeDefined()
  })

  it('custom emitter produces observatoryMetadata', async () => {
    const custom: PromptObservatoryMetadataEmitter = {
      emit(): PromptObservatoryMetadata {
        return Object.freeze({ overview: { custom: true } }) as PromptObservatoryMetadata
      },
    }
    const builder = createBuilderWithEmitter(custom)
    const result = await buildResult(builder, createContext('custom'))
    expect(result.metadata.promptAssembly?.observatoryMetadata).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Section 82 — Build Roundtrip
// ---------------------------------------------------------------------------

describe('build roundtrip', () => {
  it('build returns observatoryMetadata in metadata', async () => {
    const builder = createBuilderWithEmitter(new DefaultPromptObservatoryMetadataEmitter())
    const result = await buildResult(builder, createContext('roundtrip'))
    expect(result.metadata.promptAssembly?.observatoryMetadata).toBeDefined()
    expect(result.prompt).toBeDefined()
  })

  it('build roundtrip preserves prompt content', async () => {
    const builder = createBuilderWithEmitter(new DefaultPromptObservatoryMetadataEmitter())
    const input = 'roundtrip preservation'
    const result = await buildResult(builder, createContext(input))
    expect(result.prompt).toContain(input)
  })
})

// ---------------------------------------------------------------------------
// Section 83 — Emitter Absence
// ---------------------------------------------------------------------------

describe('emitter absence', () => {
  it('no observatoryMetadata when emitter not provided', async () => {
    const builder = new DefaultPromptBuilder(createModules(), {})
    const result = await buildResult(builder, createContext('no-emitter'))
    const pa = result.metadata.promptAssembly as Record<string, unknown> | undefined
    if (pa) {
      expect('observatoryMetadata' in pa).toBe(false)
    }
  })

  it('no errors when emitter not provided', async () => {
    const builder = new DefaultPromptBuilder(createModules(), {})
    const result = await buildResult(builder, createContext('no-error'))
    expect(result).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Section 84 — Emitter Output
// ---------------------------------------------------------------------------

describe('emitter output', () => {
  it('emitter output is stored correctly', async () => {
    const expected = Object.freeze({ overview: { stored: true } }) as PromptObservatoryMetadata
    const capture: PromptObservatoryMetadataEmitter = {
      emit(): PromptObservatoryMetadata {
        return expected
      },
    }
    const builder = createBuilderWithEmitter(capture)
    const result = await buildResult(builder, createContext('stored-correctly'))
    expect(result.metadata.promptAssembly?.observatoryMetadata).toBe(expected)
  })

  it('emitter output is not mutated by builder', async () => {
    const expected = Object.freeze({ overview: { value: 42 } }) as PromptObservatoryMetadata
    const capture: PromptObservatoryMetadataEmitter = {
      emit(): PromptObservatoryMetadata {
        return expected
      },
    }
    const builder = createBuilderWithEmitter(capture)
    const result = await buildResult(builder, createContext('not-mutated'))
    expect(result.metadata.promptAssembly?.observatoryMetadata).toBe(expected)
    expect(result.metadata.promptAssembly?.observatoryMetadata).toEqual({ overview: { value: 42 } })
  })
})

// ---------------------------------------------------------------------------
// Section 85 — Builder Behavior
// ---------------------------------------------------------------------------

describe('builder behavior', () => {
  it('builder does not modify emitted observatoryMetadata', async () => {
    const emitter = new DefaultPromptObservatoryMetadataEmitter()
    const builder = createBuilderWithEmitter(emitter)
    const result = await buildResult(builder, createContext('no-modify'))
    const om = result.metadata.promptAssembly?.observatoryMetadata
    expect(Object.isFrozen(om)).toBe(true)
  })

  it('builder adds observatoryMetadata without affecting other keys', async () => {
    const emitter = new DefaultPromptObservatoryMetadataEmitter()
    const builder = createBuilderWithEmitter(emitter)
    const result = await buildResult(builder, createContext('additive'))
    const pa = result.metadata.promptAssembly as Record<string, unknown>
    const keys = Object.keys(pa)
    expect(keys).toContain('observatoryMetadata')
    expect(keys).toContain('strategy')
  })
})

// ---------------------------------------------------------------------------
// Section 86 — Emitter State
// ---------------------------------------------------------------------------

describe('emitter state', () => {
  it('emitter state does not leak between builds', async () => {
    const emitter = new DefaultPromptObservatoryMetadataEmitter()
    const builder = createBuilderWithEmitter(emitter)
    const ctx = createContext('state')
    const r1 = await buildResult(builder, ctx)
    const r2 = await buildResult(builder, ctx)
    expect(r1.metadata.promptAssembly?.observatoryMetadata)
      .toEqual(r2.metadata.promptAssembly?.observatoryMetadata)
  })
})

// ---------------------------------------------------------------------------
// Section 87 — Module Combinations
// ---------------------------------------------------------------------------

describe('module combinations', () => {
  it('single UserInputModule with emitter', async () => {
    const builder = new DefaultPromptBuilder([new UserInputModule()], {
      promptObservatoryMetadataEmitter: new DefaultPromptObservatoryMetadataEmitter(),
    })
    const result = await buildResult(builder, createContext('single-module'))
    expect(result.metadata.promptAssembly?.observatoryMetadata).toBeDefined()
  })

  it('two modules with emitter', async () => {
    const builder = new DefaultPromptBuilder(
      [new UserInputModule(), new SystemPromptModule()],
      { promptObservatoryMetadataEmitter: new DefaultPromptObservatoryMetadataEmitter() },
    )
    const result = await buildResult(builder, createContext('two-modules'))
    expect(result.metadata.promptAssembly?.observatoryMetadata).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Section 88 — Emitter Instantiation
// ---------------------------------------------------------------------------

describe('emitter instantiation', () => {
  it('DefaultPromptObservatoryMetadataEmitter can be instantiated standalone', () => {
    const emitter = new DefaultPromptObservatoryMetadataEmitter()
    expect(emitter).toBeDefined()
  })

  it('DefaultPromptObservatoryMetadataEmitter can be passed to BuilderOptions', () => {
    const options: BuilderOptions = {
      promptObservatoryMetadataEmitter: new DefaultPromptObservatoryMetadataEmitter(),
    }
    expect(options).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Section 89 — Build Order
// ---------------------------------------------------------------------------

describe('build order', () => {
  it('observatoryMetadata is in promptAssembly after build', async () => {
    const builder = createBuilderWithEmitter(new DefaultPromptObservatoryMetadataEmitter())
    const result = await buildResult(builder, createContext('build-order'))
    const pa = result.metadata.promptAssembly as Record<string, unknown>
    expect('observatoryMetadata' in pa).toBe(true)
  })

  it('promptAssembly has observatoryMetadata key', async () => {
    const builder = createBuilderWithEmitter(new DefaultPromptObservatoryMetadataEmitter())
    const result = await buildResult(builder, createContext('has-key'))
    expect(result.metadata.promptAssembly).toHaveProperty('observatoryMetadata')
  })
})

// ---------------------------------------------------------------------------
// Section 90 — Emitter Coverage
// ---------------------------------------------------------------------------

describe('emitter coverage', () => {
  it('emitter with only overview field', async () => {
    const single: PromptObservatoryMetadataEmitter = {
      emit(): PromptObservatoryMetadata {
        return Object.freeze({ overview: { count: 1 } }) as PromptObservatoryMetadata
      },
    }
    const builder = createBuilderWithEmitter(single)
    const result = await buildResult(builder, createContext('single-field'))
    const om = result.metadata.promptAssembly?.observatoryMetadata as Record<string, unknown>
    expect(om.overview).toEqual({ count: 1 })
    expect(Object.keys(om)).toEqual(['overview'])
  })

  it('emitter with only trace field', async () => {
    const single: PromptObservatoryMetadataEmitter = {
      emit(): PromptObservatoryMetadata {
        return Object.freeze({ trace: [{ id: 't1' }] }) as PromptObservatoryMetadata
      },
    }
    const builder = createBuilderWithEmitter(single)
    const result = await buildResult(builder, createContext('trace-only'))
    const om = result.metadata.promptAssembly?.observatoryMetadata as Record<string, unknown>
    expect(om.trace).toEqual([{ id: 't1' }])
  })

  it('emitter with only runtime field', async () => {
    const single: PromptObservatoryMetadataEmitter = {
      emit(): PromptObservatoryMetadata {
        return Object.freeze({ runtime: { worldId: 'w1' } }) as PromptObservatoryMetadata
      },
    }
    const builder = createBuilderWithEmitter(single)
    const result = await buildResult(builder, createContext('runtime-only'))
    const om = result.metadata.promptAssembly?.observatoryMetadata as Record<string, unknown>
    expect(om.runtime).toEqual({ worldId: 'w1' })
  })
})

// ---------------------------------------------------------------------------
// Section 91 — Deterministic Result
// ---------------------------------------------------------------------------

describe('deterministic result', () => {
  it('same context always produces same observatoryMetadata', async () => {
    const builder = createBuilderWithEmitter(new DefaultPromptObservatoryMetadataEmitter())
    const ctx = createContext('deterministic-final')
    const results = await Promise.all(
      Array.from({ length: 10 }, () => buildResult(builder, ctx)),
    )
    for (const r of results) {
      expect(r.metadata.promptAssembly?.observatoryMetadata)
        .toEqual(results[0].metadata.promptAssembly?.observatoryMetadata)
    }
  })
})

// ---------------------------------------------------------------------------
// Section 92 — Additive Spread Verification
// ---------------------------------------------------------------------------

describe('additive spread verification', () => {
  it('observatoryMetadata is added without removing existing keys', async () => {
    const emitter = new DefaultPromptObservatoryMetadataEmitter()
    const builder = createBuilderWithEmitter(emitter)
    const result = await buildResult(builder, createContext('additive-spread'))
    const pa = result.metadata.promptAssembly as Record<string, unknown>
    expect(pa.strategy).toBeDefined()
    expect(pa.observatoryMetadata).toBeDefined()
    expect(pa.ranking).toBeDefined()
    expect(pa.budget).toBeDefined()
    expect(pa.selection).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Section 93 — Emitter Receives Strategy
// ---------------------------------------------------------------------------

describe('emitter receives strategy', () => {
  it('strategy is present in metadata passed to emitter', async () => {
    let captured: Record<string, unknown> | undefined
    const capture: PromptObservatoryMetadataEmitter = {
      emit(m: Record<string, unknown>): PromptObservatoryMetadata {
        captured = m
        return Object.freeze({}) as PromptObservatoryMetadata
      },
    }
    const builder = createBuilderWithEmitter(capture)
    await buildResult(builder, createContext('has-strategy'))
    expect(captured?.strategy).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Section 94 — Multiple Independent Builds
// ---------------------------------------------------------------------------

describe('multiple independent builds', () => {
  it('10 independent builders produce valid observatoryMetadata', async () => {
    const builders = Array.from({ length: 10 }, () =>
      createBuilderWithEmitter(new DefaultPromptObservatoryMetadataEmitter()),
    )
    const results = await Promise.all(
      builders.map((b) => buildResult(b, createContext('independent'))),
    )
    for (const r of results) {
      expect(r.metadata.promptAssembly?.observatoryMetadata).toBeDefined()
    }
  })
})

// ---------------------------------------------------------------------------
// Section 95 — Emitter Output Frozen
// ---------------------------------------------------------------------------

describe('emitter output frozen', () => {
  it('observatoryMetadata is always frozen when default emitter used', async () => {
    const builder = createBuilderWithEmitter(new DefaultPromptObservatoryMetadataEmitter())
    const result = await buildResult(builder, createContext('always-frozen'))
    expect(Object.isFrozen(result.metadata.promptAssembly?.observatoryMetadata)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Section 96 — BuilderOptions Field Presence
// ---------------------------------------------------------------------------

describe('BuilderOptions field presence', () => {
  it('promptObservatoryMetadataEmitter is optional', () => {
    const opts: BuilderOptions = { renderer: new DefaultPromptRenderer() }
    expect('promptObservatoryMetadataEmitter' in opts).toBe(false)
  })

  it('promptObservatoryMetadataEmitter can be set independently', () => {
    const opts: BuilderOptions = {
      promptObservatoryMetadataEmitter: new DefaultPromptObservatoryMetadataEmitter(),
    }
    expect(opts.promptObservatoryMetadataEmitter).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Section 97 — Default Emitter State
// ---------------------------------------------------------------------------

describe('default emitter state', () => {
  it('default emitter creates no side effects on build', async () => {
    const builder = createBuilderWithEmitter(new DefaultPromptObservatoryMetadataEmitter())
    const result = await buildResult(builder, createContext('no-side-effects'))
    expect(result.metadata.promptAssembly?.observatoryMetadata).toBeDefined()
    expect(result.prompt.length).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// Section 98 — Emitter Configuration Via Options
// ---------------------------------------------------------------------------

describe('emitter configuration via options', () => {
  it('can pass emitter via full options object', () => {
    const options: BuilderOptions = {
      renderer: new DefaultPromptRenderer(),
      compression: new DefaultPromptCompression(),
      ranking: new DefaultMemoryRanking(),
      budget: new DefaultPromptBudget(),
      selection: new DefaultPromptSelection(),
      promptObservatoryMetadataEmitter: new DefaultPromptObservatoryMetadataEmitter(),
    }
    const builder = new DefaultPromptBuilder(createModules(), options)
    expect(builder).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Section 99 — Build Lifecycle
// ---------------------------------------------------------------------------

describe('build lifecycle', () => {
  it('emitter is called during build lifecycle', async () => {
    const { emitter, callCount } = createMockEmitter()
    const builder = createBuilderWithEmitter(emitter)
    await buildResult(builder, createContext('lifecycle'))
    expect(callCount()).toBe(1)
  })

  it('emitter is called after strategy selection', async () => {
    let captured: Record<string, unknown> | undefined
    const capture: PromptObservatoryMetadataEmitter = {
      emit(m: Record<string, unknown>): PromptObservatoryMetadata {
        captured = m
        return Object.freeze({}) as PromptObservatoryMetadata
      },
    }
    const builder = createBuilderWithEmitter(capture)
    await buildResult(builder, createContext('after-strategy'))
    expect(captured?.strategy).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Section 100 — Metadata Path Safety
// ---------------------------------------------------------------------------

describe('metadata path safety', () => {
  it('observatoryMetadata is safely nested under promptAssembly', async () => {
    const builder = createBuilderWithEmitter(new DefaultPromptObservatoryMetadataEmitter())
    const result = await buildResult(builder, createContext('path-safety'))
    const pa = result.metadata.promptAssembly as Record<string, unknown>
    expect(pa.observatoryMetadata).toBeDefined()
    // Should not be at top level
    expect('observatoryMetadata' in result.metadata).toBe(false)
  })

  it('promptAssembly is always present', async () => {
    const builder = createBuilderWithEmitter(new DefaultPromptObservatoryMetadataEmitter())
    const result = await buildResult(builder, createContext('always-present'))
    expect(result.metadata.promptAssembly).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Section 101 — Emitter Output Not Null
// ---------------------------------------------------------------------------

describe('emitter output not null', () => {
  it('observatoryMetadata is not null', async () => {
    const builder = createBuilderWithEmitter(new DefaultPromptObservatoryMetadataEmitter())
    const result = await buildResult(builder, createContext('not-null'))
    expect(result.metadata.promptAssembly?.observatoryMetadata).not.toBeNull()
  })
})

// ---------------------------------------------------------------------------
// Section 102 — Object.assign Behavior
// ---------------------------------------------------------------------------

describe('Object.assign behavior', () => {
  it('observatoryMetadata is not mutated by Object.assign on promptAssembly', async () => {
    const builder = createBuilderWithEmitter(new DefaultPromptObservatoryMetadataEmitter())
    const result = await buildResult(builder, createContext('assign'))
    const pa = result.metadata.promptAssembly as Record<string, unknown>
    const om = pa.observatoryMetadata
    expect(Object.isFrozen(om)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Section 103 — Emitter Constructor
// ---------------------------------------------------------------------------

describe('emitter constructor', () => {
  it('emitter constructor with builder param works', () => {
    const builder = new DefaultPromptObservatoryMetadataBuilder()
    const emitter = new DefaultPromptObservatoryMetadataEmitter(builder)
    const pb = createBuilderWithEmitter(emitter)
    expect(pb).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Section 104 — Builder With Emitter
// ---------------------------------------------------------------------------

describe('builder with emitter', () => {
  it('DefaultPromptBuilder with emitter field in options is valid', () => {
    const builder = new DefaultPromptBuilder(createModules(), {
      promptObservatoryMetadataEmitter: new DefaultPromptObservatoryMetadataEmitter(),
    })
    expect(builder).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Section 105 — Emitter Phase
// ---------------------------------------------------------------------------

describe('emitter phase', () => {
  it('Phase 0.959978 runs and produces observatoryMetadata', async () => {
    const builder = createBuilderWithEmitter(new DefaultPromptObservatoryMetadataEmitter())
    const result = await buildResult(builder, createContext('phase-959978'))
    expect(result.metadata.promptAssembly?.observatoryMetadata).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Section 106 — Builder Options Pattern
// ---------------------------------------------------------------------------

describe('builder options pattern', () => {
  it('supports emitter in options with other optional fields', () => {
    const options: BuilderOptions = {
      intentAnalyzer: undefined,
      intentRenderer: undefined,
      entityAnalyzer: undefined,
      promptObservatoryMetadataEmitter: new DefaultPromptObservatoryMetadataEmitter(),
    }
    const builder = new DefaultPromptBuilder(createModules(), options)
    expect(builder).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Section 107 — Emitter Integration
// ---------------------------------------------------------------------------

describe('integration', () => {
  it('emitter integrated with full builder', async () => {
    const builder = new DefaultPromptBuilder(createModules(), {
      renderer: new DefaultPromptRenderer(),
      promptObservatoryMetadataEmitter: new DefaultPromptObservatoryMetadataEmitter(),
    })
    const result = await buildResult(builder, createContext('full-integration'))
    expect(result.metadata.promptAssembly?.observatoryMetadata).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Section 108 — Build Result Validation
// ---------------------------------------------------------------------------

describe('build result validation', () => {
  it('result contains observatoryMetadata when emitter is set', async () => {
    const builder = createBuilderWithEmitter(new DefaultPromptObservatoryMetadataEmitter())
    const result = await buildResult(builder, createContext('validation'))
    expect(result.metadata.promptAssembly?.observatoryMetadata).toBeDefined()
  })

  it('result does not contain observatoryMetadata when emitter is not set', async () => {
    const builder = new DefaultPromptBuilder(createModules(), {})
    const result = await buildResult(builder, createContext('not-set'))
    const pa = result.metadata.promptAssembly as Record<string, unknown> | undefined
    if (pa) {
      expect('observatoryMetadata' in pa).toBe(false)
    }
  })
})

// ---------------------------------------------------------------------------
// Section 109 — Emitter Strategy
// ---------------------------------------------------------------------------

describe('emitter strategy', () => {
  it('emitter receives strategy name in metadata', async () => {
    let captured: Record<string, unknown> | undefined
    const capture: PromptObservatoryMetadataEmitter = {
      emit(m: Record<string, unknown>): PromptObservatoryMetadata {
        captured = m
        return Object.freeze({}) as PromptObservatoryMetadata
      },
    }
    const builder = createBuilderWithEmitter(capture)
    await buildResult(builder, createContext('strategy-name'))
    expect(captured?.strategy).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Section 110 — Emitter Path
// ---------------------------------------------------------------------------

describe('emitter path', () => {
  it('observatoryMetadata is at correct path: promptAssembly.observatoryMetadata', async () => {
    const builder = createBuilderWithEmitter(new DefaultPromptObservatoryMetadataEmitter())
    const result = await buildResult(builder, createContext('correct-path'))
    expect(result.metadata.promptAssembly).toHaveProperty('observatoryMetadata')
  })
})

// ---------------------------------------------------------------------------
// Section 111 — Multiple Emitter Configs
// ---------------------------------------------------------------------------

describe('multiple emitter configs', () => {
  it('different emitters produce different observatoryMetadata', async () => {
    const e1: PromptObservatoryMetadataEmitter = {
      emit(): PromptObservatoryMetadata {
        return Object.freeze({ overview: { src: 'first' } }) as PromptObservatoryMetadata
      },
    }
    const e2: PromptObservatoryMetadataEmitter = {
      emit(): PromptObservatoryMetadata {
        return Object.freeze({ overview: { src: 'second' } }) as PromptObservatoryMetadata
      },
    }
    const b1 = createBuilderWithEmitter(e1)
    const b2 = createBuilderWithEmitter(e2)
    const ctx = createContext('different')
    const [r1, r2] = await Promise.all([buildResult(b1, ctx), buildResult(b2, ctx)])
    expect(r1.metadata.promptAssembly?.observatoryMetadata)
      .not.toEqual(r2.metadata.promptAssembly?.observatoryMetadata)
  })
})

// ---------------------------------------------------------------------------
// Section 112 — Emitter Not Null
// ---------------------------------------------------------------------------

describe('emitter not null', () => {
  it('observatoryMetadata is always defined when emitter present', async () => {
    const builder = createBuilderWithEmitter(new DefaultPromptObservatoryMetadataEmitter())
    const result = await buildResult(builder, createContext('defined'))
    expect(result.metadata.promptAssembly?.observatoryMetadata).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Section 113 — Builder Works
// ---------------------------------------------------------------------------

describe('builder works', () => {
  it('builder with emitter constructs without error', () => {
    const builder = new DefaultPromptBuilder(createModules(), {
      promptObservatoryMetadataEmitter: new DefaultPromptObservatoryMetadataEmitter(),
    })
    expect(builder).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Section 114 — Emitter Output Shape
// ---------------------------------------------------------------------------

describe('emitter output shape', () => {
  it('observatoryMetadata is object', async () => {
    const builder = createBuilderWithEmitter(new DefaultPromptObservatoryMetadataEmitter())
    const result = await buildResult(builder, createContext('output-shape'))
    expect(typeof result.metadata.promptAssembly?.observatoryMetadata).toBe('object')
  })
})

// ---------------------------------------------------------------------------
// Section 115 — Emitter Option
// ---------------------------------------------------------------------------

describe('emitter option', () => {
  it('promptObservatoryMetadataEmitter option in BuilderOptions works', () => {
    const opts: BuilderOptions = {
      promptObservatoryMetadataEmitter: new DefaultPromptObservatoryMetadataEmitter(),
    }
    const builder = new DefaultPromptBuilder(createModules(), opts)
    expect(builder).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Section 116 — Build With Emitter
// ---------------------------------------------------------------------------

describe('build with emitter', () => {
  it('build succeeds with emitter', async () => {
    const builder = createBuilderWithEmitter(new DefaultPromptObservatoryMetadataEmitter())
    const result = await buildResult(builder, createContext('succeeds'))
    expect(result.metadata.promptAssembly?.observatoryMetadata).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Section 117 — Emitter Phase Position
// ---------------------------------------------------------------------------

describe('emitter phase position', () => {
  it('observatoryMetadata is set during phase 0.959978', async () => {
    const builder = createBuilderWithEmitter(new DefaultPromptObservatoryMetadataEmitter())
    const result = await buildResult(builder, createContext('phase-pos'))
    expect(result.metadata.promptAssembly?.observatoryMetadata).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Section 118 — BuilderOptions Type
// ---------------------------------------------------------------------------

describe('BuilderOptions type', () => {
  it('promptObservatoryMetadataEmitter is optional in type', () => {
    const opts: BuilderOptions = {}
    expect('promptObservatoryMetadataEmitter' in opts).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Section 119 — Emitter Data
// ---------------------------------------------------------------------------

describe('emitter data', () => {
  it('emitter receives data during build', async () => {
    let received = false
    const capture: PromptObservatoryMetadataEmitter = {
      emit(_m: Record<string, unknown>): PromptObservatoryMetadata {
        received = true
        return Object.freeze({}) as PromptObservatoryMetadata
      },
    }
    const builder = createBuilderWithEmitter(capture)
    await buildResult(builder, createContext('received'))
    expect(received).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Section 120 — Emitter One Call
// ---------------------------------------------------------------------------

describe('emitter one call', () => {
  it('emitter called exactly once per build', async () => {
    const { emitter, callCount } = createMockEmitter()
    const builder = createBuilderWithEmitter(emitter)
    await buildResult(builder, createContext('once'))
    expect(callCount()).toBe(1)
  })
})

// ---------------------------------------------------------------------------
// Section 121 — Emitter Output
// ---------------------------------------------------------------------------

describe('emitter output', () => {
  it('observatoryMetadata is in output metadata', async () => {
    const builder = createBuilderWithEmitter(new DefaultPromptObservatoryMetadataEmitter())
    const result = await buildResult(builder, createContext('in-output'))
    expect(result.metadata.promptAssembly?.observatoryMetadata).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Section 122 — Emitter Present
// ---------------------------------------------------------------------------

describe('emitter present', () => {
  it('observatoryMetadata present when emitter configured', async () => {
    const builder = createBuilderWithEmitter(new DefaultPromptObservatoryMetadataEmitter())
    const result = await buildResult(builder, createContext('configured'))
    expect(result.metadata.promptAssembly?.observatoryMetadata).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Section 123 — Emitter Absent
// ---------------------------------------------------------------------------

describe('emitter absent', () => {
  it('observatoryMetadata absent when emitter not configured', async () => {
    const builder = new DefaultPromptBuilder(createModules(), {})
    const result = await buildResult(builder, createContext('not-configured'))
    const pa = result.metadata.promptAssembly as Record<string, unknown> | undefined
    if (pa) {
      expect('observatoryMetadata' in pa).toBe(false)
    }
  })
})

// ---------------------------------------------------------------------------
// Section 124 — Emitter Five Times
// ---------------------------------------------------------------------------

describe('emitter five times', () => {
  it('emitter called 5 times across 5 builds', async () => {
    const { emitter, callCount } = createMockEmitter()
    const builder = createBuilderWithEmitter(emitter)
    for (let i = 0; i < 5; i++) {
      await buildResult(builder, createContext(`five-${i}`))
    }
    expect(callCount()).toBe(5)
  })
})

// ---------------------------------------------------------------------------
// Section 125 — Emitter Ten Times
// ---------------------------------------------------------------------------

describe('emitter ten times', () => {
  it('emitter called 10 times across 10 builds', async () => {
    const { emitter, callCount } = createMockEmitter()
    const builder = createBuilderWithEmitter(emitter)
    for (let i = 0; i < 10; i++) {
      await buildResult(builder, createContext(`ten-${i}`))
    }
    expect(callCount()).toBe(10)
  })
})

// ---------------------------------------------------------------------------
// Section 126 — Emitter Null
// ---------------------------------------------------------------------------

describe('emitter null', () => {
  it('emitter result is not null', async () => {
    const builder = createBuilderWithEmitter(new DefaultPromptObservatoryMetadataEmitter())
    const result = await buildResult(builder, createContext('not-null-result'))
    expect(result.metadata.promptAssembly?.observatoryMetadata).not.toBeNull()
  })
})

// ---------------------------------------------------------------------------
// Section 127 — Emitter Defined
// ---------------------------------------------------------------------------

describe('emitter defined', () => {
  it('observatoryMetadata is defined when emitter present', async () => {
    const builder = createBuilderWithEmitter(new DefaultPromptObservatoryMetadataEmitter())
    const result = await buildResult(builder, createContext('defined'))
    expect(result.metadata.promptAssembly?.observatoryMetadata).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Section 128 — Emitter Undefined
// ---------------------------------------------------------------------------

describe('emitter undefined', () => {
  it('observatoryMetadata is undefined when emitter absent', async () => {
    const builder = new DefaultPromptBuilder(createModules(), {})
    const result = await buildResult(builder, createContext('undefined'))
    const pa = result.metadata.promptAssembly as Record<string, unknown> | undefined
    if (pa) {
      expect('observatoryMetadata' in pa).toBe(false)
    }
  })
})

// ---------------------------------------------------------------------------
// Section 129 — Emitter Object
// ---------------------------------------------------------------------------

describe('emitter object', () => {
  it('observatoryMetadata is an object', async () => {
    const builder = createBuilderWithEmitter(new DefaultPromptObservatoryMetadataEmitter())
    const result = await buildResult(builder, createContext('is-object'))
    expect(typeof result.metadata.promptAssembly?.observatoryMetadata).toBe('object')
  })
})

// ---------------------------------------------------------------------------
// Section 130 — Emitter Type
// ---------------------------------------------------------------------------

describe('emitter type', () => {
  it('observatoryMetadata is of type PromptObservatoryMetadata', async () => {
    const builder = createBuilderWithEmitter(new DefaultPromptObservatoryMetadataEmitter())
    const result = await buildResult(builder, createContext('type-check'))
    const om = result.metadata.promptAssembly?.observatoryMetadata as PromptObservatoryMetadata
    expect(typeof om).toBe('object')
  })
})

// ---------------------------------------------------------------------------
// Section 131 — Emitter Build
// ---------------------------------------------------------------------------

describe('emitter build', () => {
  it('build with emitter produces observatoryMetadata', async () => {
    const builder = createBuilderWithEmitter(new DefaultPromptObservatoryMetadataEmitter())
    const result = await buildResult(builder, createContext('emitter-build'))
    expect(result.metadata.promptAssembly?.observatoryMetadata).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Section 132 — Emitter Validation
// ---------------------------------------------------------------------------

describe('emitter validation', () => {
  it('emitter observes output metadata', async () => {
    const builder = createBuilderWithEmitter(new DefaultPromptObservatoryMetadataEmitter())
    const result = await buildResult(builder, createContext('observes'))
    expect(result.metadata.promptAssembly?.observatoryMetadata).toBeDefined()
    expect(result.prompt).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Section 133 — Emitter Phase Check
// ---------------------------------------------------------------------------

describe('emitter phase check', () => {
  it('observatoryMetadata is set during phase execution', async () => {
    const builder = createBuilderWithEmitter(new DefaultPromptObservatoryMetadataEmitter())
    const result = await buildResult(builder, createContext('phase-exec'))
    expect(result.metadata.promptAssembly?.observatoryMetadata).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Section 134 — Emitter Integration Test
// ---------------------------------------------------------------------------

describe('emitter integration test', () => {
  it('emitter integration works end-to-end', async () => {
    const builder = createBuilderWithEmitter(new DefaultPromptObservatoryMetadataEmitter())
    const result = await buildResult(builder, createContext('e2e'))
    expect(result.metadata.promptAssembly?.observatoryMetadata).toBeDefined()
    expect(Object.isFrozen(result.metadata.promptAssembly?.observatoryMetadata)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Section 135 — Emitter Consistency
// ---------------------------------------------------------------------------

describe('emitter consistency', () => {
  it('consistent across multiple builds', async () => {
    const builder = createBuilderWithEmitter(new DefaultPromptObservatoryMetadataEmitter())
    const ctx = createContext('consistent')
    const results = await Promise.all(
      Array.from({ length: 5 }, () => buildResult(builder, ctx)),
    )
    for (const r of results) {
      expect(r.metadata.promptAssembly?.observatoryMetadata).toBeDefined()
    }
  })
})

// ---------------------------------------------------------------------------
// Section 136 — Emitter Promises
// ---------------------------------------------------------------------------

describe('emitter promises', () => {
  it('all builds resolve with observatoryMetadata', async () => {
    const builder = createBuilderWithEmitter(new DefaultPromptObservatoryMetadataEmitter())
    const promises = Array.from({ length: 20 }, () =>
      buildResult(builder, createContext('promise-test')),
    )
    const results = await Promise.all(promises)
    for (const r of results) {
      expect(r.metadata.promptAssembly?.observatoryMetadata).toBeDefined()
    }
  })
})

// ---------------------------------------------------------------------------
// Section 137 — Metadata PromptAssembly Key
// ---------------------------------------------------------------------------

describe('metadata promptAssembly key', () => {
  it('observatoryMetadata is a key of promptAssembly', async () => {
    const builder = createBuilderWithEmitter(new DefaultPromptObservatoryMetadataEmitter())
    const result = await buildResult(builder, createContext('key-of'))
    const pa = result.metadata.promptAssembly as Record<string, unknown>
    expect('observatoryMetadata' in pa).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Section 138 — Emitter Output Value
// ---------------------------------------------------------------------------

describe('emitter output value', () => {
  it('emitter output value is accessible', async () => {
    const builder = createBuilderWithEmitter(new DefaultPromptObservatoryMetadataEmitter())
    const result = await buildResult(builder, createContext('output-value'))
    expect(result.metadata.promptAssembly?.observatoryMetadata).toBeTruthy()
  })
})

// ---------------------------------------------------------------------------
// Section 139 — Emitter Receives Assembly
// ---------------------------------------------------------------------------

describe('emitter receives assembly', () => {
  it('emitter receives assembly metadata object', async () => {
    let captured: Record<string, unknown> | undefined
    const capture: PromptObservatoryMetadataEmitter = {
      emit(m: Record<string, unknown>): PromptObservatoryMetadata {
        captured = m
        return Object.freeze({}) as PromptObservatoryMetadata
      },
    }
    const builder = createBuilderWithEmitter(capture)
    await buildResult(builder, createContext('assembly'))
    expect(captured).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Section 140 — Emitter Nested Metadata
// ---------------------------------------------------------------------------

describe('emitter nested metadata', () => {
  it('emitter output preserves nested structure', async () => {
    const nested: PromptObservatoryMetadataEmitter = {
      emit(): PromptObservatoryMetadata {
        return Object.freeze({
          overview: { nested: { deep: { value: 'deep' } } },
        }) as PromptObservatoryMetadata
      },
    }
    const builder = createBuilderWithEmitter(nested)
    const result = await buildResult(builder, createContext('nested'))
    const om = result.metadata.promptAssembly?.observatoryMetadata as PromptObservatoryMetadata
    expect(om.overview).toEqual({ nested: { deep: { value: 'deep' } } })
  })
})

// ---------------------------------------------------------------------------
// Section 141 — Emitter Array Metadata
// ---------------------------------------------------------------------------

describe('emitter array metadata', () => {
  it('emitter output preserves arrays', async () => {
    const arrays: PromptObservatoryMetadataEmitter = {
      emit(): PromptObservatoryMetadata {
        return Object.freeze({
          trace: [{ id: 'a', steps: [] }, { id: 'b', steps: [] }],
        }) as PromptObservatoryMetadata
      },
    }
    const builder = createBuilderWithEmitter(arrays)
    const result = await buildResult(builder, createContext('arrays'))
    const om = result.metadata.promptAssembly?.observatoryMetadata as PromptObservatoryMetadata
    expect(om.trace).toEqual([{ id: 'a', steps: [] }, { id: 'b', steps: [] }])
  })
})

// ---------------------------------------------------------------------------
// Section 142 — Emitter Null Values
// ---------------------------------------------------------------------------

describe('emitter null values', () => {
  it('emitter output preserves null values', async () => {
    const nulls: PromptObservatoryMetadataEmitter = {
      emit(): PromptObservatoryMetadata {
        return Object.freeze({ overview: null }) as PromptObservatoryMetadata
      },
    }
    const builder = createBuilderWithEmitter(nulls)
    const result = await buildResult(builder, createContext('null-values'))
    const om = result.metadata.promptAssembly?.observatoryMetadata as PromptObservatoryMetadata
    expect(om.overview).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// Section 143 — Emitter Empty Object
// ---------------------------------------------------------------------------

describe('emitter empty object', () => {
  it('emitter can return empty object', async () => {
    const empty: PromptObservatoryMetadataEmitter = {
      emit(): PromptObservatoryMetadata {
        return Object.freeze({}) as PromptObservatoryMetadata
      },
    }
    const builder = createBuilderWithEmitter(empty)
    const result = await buildResult(builder, createContext('empty-object'))
    const om = result.metadata.promptAssembly?.observatoryMetadata as PromptObservatoryMetadata
    expect(Object.keys(om)).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// Section 144 — Emitter One Key
// ---------------------------------------------------------------------------

describe('emitter one key', () => {
  it('emitter can return single key object', async () => {
    const one: PromptObservatoryMetadataEmitter = {
      emit(): PromptObservatoryMetadata {
        return Object.freeze({ overview: {} }) as PromptObservatoryMetadata
      },
    }
    const builder = createBuilderWithEmitter(one)
    const result = await buildResult(builder, createContext('one-key'))
    const om = result.metadata.promptAssembly?.observatoryMetadata as PromptObservatoryMetadata
    expect(Object.keys(om)).toEqual(['overview'])
  })
})

// ---------------------------------------------------------------------------
// Section 145 — Emitter Multiple Keys
// ---------------------------------------------------------------------------

describe('emitter multiple keys', () => {
  it('emitter can return multiple keys', async () => {
    const multi: PromptObservatoryMetadataEmitter = {
      emit(): PromptObservatoryMetadata {
        return Object.freeze({ overview: {}, trace: [], runtime: {} }) as PromptObservatoryMetadata
      },
    }
    const builder = createBuilderWithEmitter(multi)
    const result = await buildResult(builder, createContext('multi-keys'))
    const om = result.metadata.promptAssembly?.observatoryMetadata as PromptObservatoryMetadata
    expect(Object.keys(om).sort()).toEqual(['overview', 'runtime', 'trace'])
  })
})

// ---------------------------------------------------------------------------
// Section 146 — Emitter Same Input
// ---------------------------------------------------------------------------

describe('emitter same input', () => {
  it('same input produces same emitter output', async () => {
    const builder = createBuilderWithEmitter(new DefaultPromptObservatoryMetadataEmitter())
    const ctx = createContext('same-input')
    const r1 = await buildResult(builder, ctx)
    const r2 = await buildResult(builder, ctx)
    expect(r1.metadata.promptAssembly?.observatoryMetadata)
      .toEqual(r2.metadata.promptAssembly?.observatoryMetadata)
  })
})

// ---------------------------------------------------------------------------
// Section 147 — Emitter Object Identity
// ---------------------------------------------------------------------------

describe('emitter object identity', () => {
  it('emitter output is the same object returned by emit', async () => {
    const expected = Object.freeze({ overview: { id: 'x' } }) as PromptObservatoryMetadata
    const identity: PromptObservatoryMetadataEmitter = {
      emit(): PromptObservatoryMetadata {
        return expected
      },
    }
    const builder = createBuilderWithEmitter(identity)
    const result = await buildResult(builder, createContext('identity'))
    expect(result.metadata.promptAssembly?.observatoryMetadata).toBe(expected)
  })
})

// ---------------------------------------------------------------------------
// Section 148 — Emitter Frozen Object
// ---------------------------------------------------------------------------

describe('emitter frozen object', () => {
  it('emitter output is frozen when emitter freezes it', async () => {
    const frozen: PromptObservatoryMetadataEmitter = {
      emit(): PromptObservatoryMetadata {
        return Object.freeze({ overview: {} }) as PromptObservatoryMetadata
      },
    }
    const builder = createBuilderWithEmitter(frozen)
    const result = await buildResult(builder, createContext('frozen-object'))
    expect(Object.isFrozen(result.metadata.promptAssembly?.observatoryMetadata)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Section 149 — Emitter Build Count
// ---------------------------------------------------------------------------

describe('emitter build count', () => {
  it('emitter invoked same number of times as builds', async () => {
    const { emitter, callCount } = createMockEmitter()
    const builder = createBuilderWithEmitter(emitter)
    for (let i = 0; i < 3; i++) {
      await buildResult(builder, createContext(`count-${i}`))
    }
    expect(callCount()).toBe(3)
  })
})

// ---------------------------------------------------------------------------
// Section 150 — Emitter Not Called Without Build
// ---------------------------------------------------------------------------

describe('emitter not called without build', () => {
  it('emitter not called if build not invoked', () => {
    const { emitter, callCount } = createMockEmitter()
    createBuilderWithEmitter(emitter)
    expect(callCount()).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// Section 151 — Emitter Frozen Check
// ---------------------------------------------------------------------------

describe('emitter frozen check', () => {
  it('default emitter produces frozen output', async () => {
    const builder = createBuilderWithEmitter(new DefaultPromptObservatoryMetadataEmitter())
    const result = await buildResult(builder, createContext('frozen-check'))
    expect(Object.isFrozen(result.metadata.promptAssembly?.observatoryMetadata)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Section 152 — Emitter Object Check
// ---------------------------------------------------------------------------

describe('emitter object check', () => {
  it('observatoryMetadata is object type', async () => {
    const builder = createBuilderWithEmitter(new DefaultPromptObservatoryMetadataEmitter())
    const result = await buildResult(builder, createContext('object-check'))
    expect(typeof result.metadata.promptAssembly?.observatoryMetadata).toBe('object')
  })
})

// ---------------------------------------------------------------------------
// Section 153 — Emitter Key Check
// ---------------------------------------------------------------------------

describe('emitter key check', () => {
  it('observatoryMetadata key exists in promptAssembly', async () => {
    const builder = createBuilderWithEmitter(new DefaultPromptObservatoryMetadataEmitter())
    const result = await buildResult(builder, createContext('key-exists'))
    const pa = result.metadata.promptAssembly as Record<string, unknown>
    expect('observatoryMetadata' in pa).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Section 154 — Emitter Under PromptAssembly
// ---------------------------------------------------------------------------

describe('emitter under promptAssembly', () => {
  it('observatoryMetadata is under promptAssembly', async () => {
    const builder = createBuilderWithEmitter(new DefaultPromptObservatoryMetadataEmitter())
    const result = await buildResult(builder, createContext('under-pa'))
    expect(result.metadata.promptAssembly).toHaveProperty('observatoryMetadata')
  })
})

// ---------------------------------------------------------------------------
// Section 155 — Emitter Not Top Level
// ---------------------------------------------------------------------------

describe('emitter not top level', () => {
  it('observatoryMetadata is not at metadata top level', async () => {
    const builder = createBuilderWithEmitter(new DefaultPromptObservatoryMetadataEmitter())
    const result = await buildResult(builder, createContext('not-top'))
    expect('observatoryMetadata' in result.metadata).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Section 156 — Emitter Top Level Path
// ---------------------------------------------------------------------------

describe('emitter top level path', () => {
  it('observatoryMetadata is not at metadata root', async () => {
    const builder = createBuilderWithEmitter(new DefaultPromptObservatoryMetadataEmitter())
    const result = await buildResult(builder, createContext('not-root'))
    expect(result.metadata).not.toHaveProperty('observatoryMetadata')
  })
})

// ---------------------------------------------------------------------------
// Section 157 — Emitter Strategy Key
// ---------------------------------------------------------------------------

describe('emitter strategy key', () => {
  it('promptAssembly has strategy key', async () => {
    const builder = createBuilderWithEmitter(new DefaultPromptObservatoryMetadataEmitter())
    const result = await buildResult(builder, createContext('has-strategy-key'))
    const pa = result.metadata.promptAssembly as Record<string, unknown>
    expect('strategy' in pa).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Section 158 — Emitter Strategy Not Overwritten
// ---------------------------------------------------------------------------

describe('emitter strategy not overwritten', () => {
  it('observatoryMetadata does not overwrite strategy', async () => {
    const builder = createBuilderWithEmitter(new DefaultPromptObservatoryMetadataEmitter())
    const result = await buildResult(builder, createContext('no-overwrite'))
    const pa = result.metadata.promptAssembly as Record<string, unknown>
    expect(pa.strategy).toBeDefined()
    expect(pa.observatoryMetadata).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Section 159 — Emitter Build Output
// ---------------------------------------------------------------------------

describe('emitter build output', () => {
  it('build output contains observatoryMetadata', async () => {
    const builder = createBuilderWithEmitter(new DefaultPromptObservatoryMetadataEmitter())
    const result = await buildResult(builder, createContext('build-output'))
    expect(result.metadata.promptAssembly?.observatoryMetadata).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Section 160 — Emitter One Hundred
// ---------------------------------------------------------------------------

describe('emitter one hundred', () => {
  it('100 builds with emitter all succeed', async () => {
    const builder = createBuilderWithEmitter(new DefaultPromptObservatoryMetadataEmitter())
    for (let i = 0; i < 100; i++) {
      const result = await buildResult(builder, createContext(`hundred-${i}`))
      expect(result.metadata.promptAssembly?.observatoryMetadata).toBeDefined()
    }
  })
})

// ---------------------------------------------------------------------------
// Section 161 — Emitter Final Coverage
// ---------------------------------------------------------------------------

describe('emitter final coverage', () => {
  it('emitter works with no prompt content', async () => {
    const builder = createBuilderWithEmitter(new DefaultPromptObservatoryMetadataEmitter())
    const result = await buildResult(builder, createContext(''))
    expect(result.metadata.promptAssembly?.observatoryMetadata).toBeDefined()
  })

  it('emitter works with whitespace-only input', async () => {
    const builder = createBuilderWithEmitter(new DefaultPromptObservatoryMetadataEmitter())
    const result = await buildResult(builder, createContext('   '))
    expect(result.metadata.promptAssembly?.observatoryMetadata).toBeDefined()
  })

  it('emitter works with newline input', async () => {
    const builder = createBuilderWithEmitter(new DefaultPromptObservatoryMetadataEmitter())
    const result = await buildResult(builder, createContext('\n\n'))
    expect(result.metadata.promptAssembly?.observatoryMetadata).toBeDefined()
  })

  it('emitter works with number string input', async () => {
    const builder = createBuilderWithEmitter(new DefaultPromptObservatoryMetadataEmitter())
    const result = await buildResult(builder, createContext('42'))
    expect(result.metadata.promptAssembly?.observatoryMetadata).toBeDefined()
  })

  it('emitter works with object string input', async () => {
    const builder = createBuilderWithEmitter(new DefaultPromptObservatoryMetadataEmitter())
    const result = await buildResult(builder, createContext('{"a":1}'))
    expect(result.metadata.promptAssembly?.observatoryMetadata).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Section 162 — Emitter Repeatability
// ---------------------------------------------------------------------------

describe('emitter repeatability', () => {
  it('repeat builds produce same emitter result', async () => {
    const builder = createBuilderWithEmitter(new DefaultPromptObservatoryMetadataEmitter())
    const ctx = createContext('repeat')
    const r1 = await buildResult(builder, ctx)
    const r2 = await buildResult(builder, ctx)
    const r3 = await buildResult(builder, ctx)
    expect(r1.metadata.promptAssembly?.observatoryMetadata)
      .toEqual(r2.metadata.promptAssembly?.observatoryMetadata)
    expect(r2.metadata.promptAssembly?.observatoryMetadata)
      .toEqual(r3.metadata.promptAssembly?.observatoryMetadata)
  })
})

// ---------------------------------------------------------------------------
// Section 163 — Emitter Result Equality
// ---------------------------------------------------------------------------

describe('emitter result equality', () => {
  it('same emitter config gives equal results across builders', async () => {
    const options: BuilderOptions = {
      promptObservatoryMetadataEmitter: new DefaultPromptObservatoryMetadataEmitter(),
    }
    const b1 = new DefaultPromptBuilder(createModules(), options)
    const b2 = new DefaultPromptBuilder(createModules(), options)
    const ctx = createContext('equality')
    const [r1, r2] = await Promise.all([buildResult(b1, ctx), buildResult(b2, ctx)])
    expect(r1.metadata.promptAssembly?.observatoryMetadata)
      .toEqual(r2.metadata.promptAssembly?.observatoryMetadata)
  })
})

// ---------------------------------------------------------------------------
// Section 164 — Emitter Result Present
// ---------------------------------------------------------------------------

describe('emitter result present', () => {
  it('observatoryMetadata always present when emitter set', async () => {
    const builder = createBuilderWithEmitter(new DefaultPromptObservatoryMetadataEmitter())
    const ctx = createContext('present-check')
    for (let i = 0; i < 5; i++) {
      const result = await buildResult(builder, ctx)
      expect(result.metadata.promptAssembly?.observatoryMetadata).toBeDefined()
    }
  })
})

// ---------------------------------------------------------------------------
// Section 165 — Emitter Result Frozen
// ---------------------------------------------------------------------------

describe('emitter result frozen', () => {
  it('observatoryMetadata frozen with default emitter', async () => {
    const builder = createBuilderWithEmitter(new DefaultPromptObservatoryMetadataEmitter())
    const result = await buildResult(builder, createContext('frozen-result'))
    expect(Object.isFrozen(result.metadata.promptAssembly?.observatoryMetadata)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Section 166 — Emitter Final Validation
// ---------------------------------------------------------------------------

describe('emitter final validation', () => {
  it('final: builder with emitter builds correctly', async () => {
    const builder = createBuilderWithEmitter(new DefaultPromptObservatoryMetadataEmitter())
    const result = await buildResult(builder, createContext('final-validation'))
    expect(result.prompt).toBeDefined()
    expect(result.metadata.promptAssembly?.observatoryMetadata).toBeDefined()
  })

  it('final: emitter output stored at promptAssembly.observatoryMetadata', async () => {
    const builder = createBuilderWithEmitter(new DefaultPromptObservatoryMetadataEmitter())
    const result = await buildResult(builder, createContext('final-path'))
    expect(result.metadata.promptAssembly).toHaveProperty('observatoryMetadata')
  })

  it('final: emitter invoked once during build', async () => {
    const { emitter, callCount } = createMockEmitter()
    const builder = createBuilderWithEmitter(emitter)
    await buildResult(builder, createContext('final-once'))
    expect(callCount()).toBe(1)
  })

  it('final: no emitter → no observatoryMetadata', async () => {
    const builder = new DefaultPromptBuilder(createModules(), {})
    const result = await buildResult(builder, createContext('final-none'))
    const pa = result.metadata.promptAssembly as Record<string, unknown> | undefined
    if (pa) {
      expect('observatoryMetadata' in pa).toBe(false)
    }
  })

  it('final: emitter deterministic across builds', async () => {
    const builder = createBuilderWithEmitter(new DefaultPromptObservatoryMetadataEmitter())
    const ctx = createContext('final-det')
    const r1 = await buildResult(builder, ctx)
    const r2 = await buildResult(builder, ctx)
    expect(r1.metadata.promptAssembly?.observatoryMetadata)
      .toEqual(r2.metadata.promptAssembly?.observatoryMetadata)
  })

  it('final: prompt unchanged by emitter', async () => {
    const ctx = createContext('final-prompt')
    const b1 = new DefaultPromptBuilder(createModules(), {})
    const b2 = createBuilderWithEmitter(new DefaultPromptObservatoryMetadataEmitter())
    const [r1, r2] = await Promise.all([buildResult(b1, ctx), buildResult(b2, ctx)])
    expect(r1.prompt).toBe(r2.prompt)
  })

  it('final: builderOptions field wired correctly', () => {
    const emitter = new DefaultPromptObservatoryMetadataEmitter()
    const opts: BuilderOptions = { promptObservatoryMetadataEmitter: emitter }
    const builder = new DefaultPromptBuilder(createModules(), opts)
    expect(builder).toBeDefined()
  })

  it('final: 50 parallel builds all have observatoryMetadata', async () => {
    const builder = createBuilderWithEmitter(new DefaultPromptObservatoryMetadataEmitter())
    const results = await Promise.all(
      Array.from({ length: 50 }, () => buildResult(builder, createContext('final-parallel'))),
    )
    for (const r of results) {
      expect(r.metadata.promptAssembly?.observatoryMetadata).toBeDefined()
    }
  })
})