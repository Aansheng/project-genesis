# ADR-0133: Prompt Assembly Observatory Foundation

**Status:** Accepted  
**Date:** Sprint 5  
**Work Order:** WO-S5-086  
**Architecture Version:** v1.19 → v1.20

---

## Context

The Prompt Assembly Observability Layer currently has three independent artifact families:

**Trace series:** `PromptAssemblyTrace`, `PromptAssemblyTraceDiff`, `PromptAssemblyTraceRenderer`, `PromptAssemblyTraceExporter`  
**Timeline series:** `PromptAssemblyTimeline`, `PromptAssemblyTimelineDiff`, `PromptAssemblyTimelineRenderer`, `PromptAssemblyTimelineExporter`, `PromptAssemblyTimelineSnapshot`  
**History series:** `PromptAssemblyHistory`, `PromptAssemblyHistoryDiff`, `PromptAssemblyHistoryRenderer`, `PromptAssemblyHistoryExporter`, `PromptAssemblyHistorySnapshot`

These capabilities exist independently — there is no unified container to aggregate all observability artifacts into a single structure.

### Problem

1. **No unified container** — downstream consumers must traverse multiple metadata paths to collect all observability data
2. **No aggregation contract** — no interface for combining trace, timeline, history, and snapshot artifacts into a single structure
3. **No default builder** — no canonical way to produce the unified container from individual artifacts

---

## Decision

### PromptAssemblyObservatory

A new interface in `packages/ai/src/strategy/PromptAssemblyObservatory.ts`:

```typescript
export interface PromptAssemblyObservatory {
  readonly trace?: PromptAssemblyTrace
  readonly timeline?: PromptAssemblyTimeline
  readonly history?: PromptAssemblyHistory
  readonly traceSnapshot?: PromptAssemblySnapshot
  readonly timelineSnapshot?: PromptAssemblyTimelineSnapshot
  readonly historySnapshot?: PromptAssemblyHistorySnapshot
}
```

All fields are readonly and optional. The interface is a pure data structure with no methods or behavior.

### PromptAssemblyObservatoryBuilder

A new interface in `packages/ai/src/strategy/PromptAssemblyObservatoryBuilder.ts`:

```typescript
export interface PromptAssemblyObservatoryBuilder {
  build(input: {
    trace?: PromptAssemblyTrace
    timeline?: PromptAssemblyTimeline
    history?: PromptAssemblyHistory
    traceSnapshot?: PromptAssemblySnapshot
    timelineSnapshot?: PromptAssemblyTimelineSnapshot
    historySnapshot?: PromptAssemblyHistorySnapshot
  }): PromptAssemblyObservatory
}
```

Single method contract — pure, stateless, deterministic.

### DefaultPromptAssemblyObservatoryBuilder

A default implementation in `packages/ai/src/strategy/DefaultPromptAssemblyObservatoryBuilder.ts`.

Behavior:
- Directly returns the provided input fields with no transformation
- Only includes fields that are explicitly provided (undefined fields are omitted)
- Preserves object references — no copying, no cloning
- Unknown fields are silently ignored

Properties:
- **Pure:** same input always produces same observatory
- **Stateless:** no internal state between calls
- **Deterministic:** no randomness or external factors
- **Immutable:** never modifies the input objects
- **Zero dependencies** on Planner, Runtime, Provider, Memory, AgentLoop, or Pipeline

### Naming Convention

The observatory uses `traceSnapshot` to refer to `PromptAssemblySnapshot` (which is the trace-level snapshot), distinguishing it from `timelineSnapshot` and `historySnapshot` which are their respective condensed summaries.

### No Consumer Changes

This work item is **foundation only**. No changes to:
- `DefaultPromptBuilder`
- `BuilderOptions`
- `PromptRenderer`
- `PromptCompression`
- `Planner`
- `Runtime`
- `Pipeline`
- `AgentLoop`

No metadata changes. No prompt changes.

---

## Consequences

### Positive

1. **Unified container** — `PromptAssemblyObservatory` provides a single structure for all observability data
2. **Builder contract** — `PromptAssemblyObservatoryBuilder` defines a clear interface for construction
3. **Default implementation** — `DefaultPromptAssemblyObservatoryBuilder` provides canonical aggregation behavior
4. **Reference-preserving** — input objects are not copied or cloned, preserving referential identity
5. **Foundation complete** — observatory infrastructure exists for future consumption
6. **Backward compatible** — no breaking changes to any public API
7. **Tested** — 100+ tests covering interface contract, empty observatory, trace/timeline/history/snapshot only, mixed, determinism, statelessness, purity, immutability, exports, architecture compliance, compatibility, and edge cases

### Negative

None.

### Risks

None.

---

## Compliance

- **TypeScript 0 errors** — verified
- **ESLint 0 errors** — verified
- **Existing tests all pass** — verified
- **100+ new tests pass** — in `PromptAssemblyObservatoryFoundation.test.ts`
- **No PromptBuilder changes** — foundation only
- **No BuilderOptions changes** — foundation only
- **No metadata changes** — foundation only
- **No prompt changes** — foundation only
- **No API breaking changes** — foundation only
- **Architecture version** v1.19 → v1.20