# ADR-0113: Prompt Assembly Timeline Foundation

**Status:** Accepted  
**Date:** Sprint 5  
**Work Order:** WO-S5-066  
**Architecture Version:** v1.00

---

## Context

The Prompt Assembly Trace system (WO-S5-058 through WO-S5-065) introduced a comprehensive diagnostic model covering trace, diff, rendering, and export — but all of these operate on a **single build**. There is no way to represent the **sequence** of prompt assembly builds over time.

### Problem

1. **No multi-build representation** — each build produces an independent trace with no temporal context
2. **No timeline model** — downstream consumers (observers, loggers, debug UIs) cannot see how the assembly evolved
3. **No foundation for future timeline operations** — diffing across builds, rendering timelines, or exporting timelines has no domain model

---

## Decision

### New Domain Model

Introduce three interfaces and one default implementation:

#### PromptAssemblyTimelineEntry

A single entry pairing a zero-based index with a `PromptAssemblyTrace`:

```typescript
interface PromptAssemblyTimelineEntry {
  readonly index: number
  readonly trace: PromptAssemblyTrace
}
```

- `index` — zero-based build order (sequential, starting from 0)
- `trace` — the `PromptAssemblyTrace` captured at this build position
- Immutable — all fields are readonly
- Pure data — no methods, no behavior

#### PromptAssemblyTimeline

An ordered collection of timeline entries:

```typescript
interface PromptAssemblyTimeline {
  readonly entries: readonly PromptAssemblyTimelineEntry[]
}
```

- `entries` — ordered list of entries in build order
- Immutable — all fields are readonly
- Pure data — no methods, no behavior

#### PromptAssemblyTimelineBuilder

A pure builder contract for constructing timelines from trace arrays:

```typescript
interface PromptAssemblyTimelineBuilder {
  build(traces: readonly PromptAssemblyTrace[]): PromptAssemblyTimeline
}
```

- Pure — same traces always produce same timeline
- Stateless — no internal state between calls
- Deterministic — no randomness or external factors
- No side effects — does not modify the input traces

#### DefaultPromptAssemblyTimelineBuilder

Default implementation — maps each trace to an indexed entry:

```typescript
class DefaultPromptAssemblyTimelineBuilder
  implements PromptAssemblyTimelineBuilder
{
  build(traces) {
    const entries = traces.map((trace, index) =>
      Object.freeze({ index, trace })
    )
    return Object.freeze({ entries: Object.freeze(entries) })
  }
}
```

- Preserves insertion order — no sorting, no filtering, no deduplication
- Uses `Object.freeze()` for runtime immutability
- Pure, stateless, deterministic, immutable
- Foundation only — not consumed by PromptBuilder

### NOT Modified

- `PromptBuilder` — unchanged
- `BuilderOptions` — unchanged
- `PromptRenderer` — unchanged
- `PromptCompression` — unchanged
- `Planner` — unchanged
- `Runtime` — unchanged
- `AgentLoop` — unchanged
- `Pipeline` — unchanged
- `PromptAssemblyTrace` — unchanged
- `PromptAssemblyTraceBuilder` — unchanged
- `PromptAssemblyTraceDiffer` — unchanged
- `PromptAssemblyTraceRenderer` — unchanged
- `PromptAssemblyTraceExporter` — unchanged
- Prompt output — unchanged (foundation only, no consumption)
- Metadata — unchanged (foundation only)

---

## Consequences

### Positive

1. **Multi-build representation** — the timeline captures the sequence of prompt assembly builds
2. **Foundation for timeline operations** — future work orders can introduce diffing, rendering, or exporting of timelines
3. **Pure and immutable** — consistent with the trace domain model principles
4. **Independent** — no dependencies on Planner, Runtime, Provider, Pipeline, or any other existing component
5. **Extensible** — new fields can be added to Timeline or TimelineEntry without breaking changes

### Negative

None — foundation only, no consumption, no behavioral changes.

### Neutral

1. Timeline is empty when built with an empty trace array
2. Indexes always start from 0 and are sequential
3. Individual entries are frozen for runtime immutability

---

## Verification

- **TypeScript**: 0 errors
- **ESLint**: 0 errors
- **Existing tests**: All pass (zero modifications)
- **New tests**: `PromptAssemblyTimelineFoundation.test.ts` with 95 test cases
  - Timeline Entry (6 tests)
  - Timeline Interface (6 tests)
  - Builder Interface Contract (5 tests)
  - Default Builder — Empty Traces (4 tests)
  - Default Builder — Single Trace (6 tests)
  - Default Builder — Multiple Traces (6 tests)
  - Default Builder — Large Timeline (3 tests)
  - Order Preservation (5 tests)
  - Deterministic (5 tests)
  - Stateless (4 tests)
  - Pure (5 tests)
  - Immutable (6 tests)
  - Export Validation (10 tests)
  - Architecture Compliance (14 tests)
  - Compatibility (4 tests)
  - Edge Cases (6 tests)
- **No breaking changes** to any Public API
- **No metadata changes** — foundation only
- **No prompt output changes** — foundation only

---

## References

- WO-S5-058 — Prompt Assembly Trace Foundation (ADR-0105)
- WO-S5-059 — Prompt Assembly Trace Consumption (ADR-0106)
- WO-S5-060 — Prompt Assembly Trace Diff Foundation (ADR-0107)
- WO-S5-061 — Prompt Assembly Trace Diff Consumption (ADR-0108)
- WO-S5-062 — Prompt Assembly Trace Rendering Foundation (ADR-0109)
- WO-S5-063 — Prompt Assembly Trace Renderer Consumption (ADR-0110)
- WO-S5-064 — Prompt Assembly Trace Export Foundation (ADR-0111)
- WO-S5-065 — Prompt Assembly Trace Export Consumption (ADR-0112)
- WO-S5-066 — This Work Order
- `packages/ai/src/strategy/PromptAssemblyTimelineEntry.ts`
- `packages/ai/src/strategy/PromptAssemblyTimeline.ts`
- `packages/ai/src/strategy/PromptAssemblyTimelineBuilder.ts`
- `packages/ai/src/strategy/DefaultPromptAssemblyTimelineBuilder.ts`
- `packages/ai/src/__tests__/PromptAssemblyTimelineFoundation.test.ts`