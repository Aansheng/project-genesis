# ADR-0114: Prompt Assembly Timeline Consumption

**Status:** Accepted  
**Date:** Sprint 5  
**Work Order:** WO-S5-067  
**Architecture Version:** v1.01

---

## Context

The Prompt Assembly Timeline Foundation (WO-S5-066, ADR-0113) introduced `PromptAssemblyTimelineEntry`, `PromptAssemblyTimeline`, `PromptAssemblyTimelineBuilder`, and `DefaultPromptAssemblyTimelineBuilder` — but they were **not consumed** by `DefaultPromptBuilder`. The timeline builder existed, yet no production code produced a `timeline` in metadata.

### Problem

1. **No timeline produced** — the timeline domain model existed but was never invoked
2. **No metadata field** — `metadata.promptAssembly.timeline` did not exist
3. **Foundation not consumable** — the timeline builder was orphaned

---

## Decision

### BuilderOptions

Add an optional field:

```typescript
promptAssemblyTimelineBuilder?: PromptAssemblyTimelineBuilder
```

- Backward compatible — all existing fields unchanged
- Optional — omitting it produces no timeline

### DefaultPromptBuilder

Add a private field wired from `BuilderOptions`:

```typescript
private readonly promptAssemblyTimelineBuilder?: PromptAssemblyTimelineBuilder
```

Legacy constructor path wires it as `undefined`.

### New Phase — 0.95996

Inserted between Phase 0.95995 (PromptAssemblyTraceExporter) and Phase 0.96 (PromptAssemblyStrategyResolver):

```text
Phase 0.9598
PromptAssemblyTraceBuilder
    ↓
trace
    ↓
Phase 0.95985
PromptAssemblyTraceDiffer
    ↓
traceDiff
    ↓
Phase 0.9599
PromptAssemblyTraceRenderer
    ↓
traceRendered
    ↓
Phase 0.95995
PromptAssemblyTraceExporter
    ↓
traceExported
    ↓
Phase 0.95996
PromptAssemblyTimelineBuilder.build([trace])
    ↓
timeline
    ↓
Phase 0.96 (PromptAssemblyStrategyResolver)
```

The timeline builder receives the current trace wrapped in a single-element array.

Executed only when:
- `trace !== undefined` (trace builder produced a trace)
- `promptAssemblyTimelineBuilder` exists

### Metadata

Stored only when both trace and timeline builder are present:

```typescript
metadata.promptAssembly.timeline  // PromptAssemblyTimeline
```

### Coexistence

`timeline` is **additive** — it coexists with all existing fields including `trace`, `traceDiff`, `traceRendered`, `traceExported`, `snapshot`, `inspector`, `inspectorRendered`, `inspectorExported`, `plan`, `optimizedPlan`, `planDiff`, `strategy`, and `strategySelection`.

Nothing is removed or modified.

### NOT Modified

- `PromptRenderer` — unchanged
- `PromptCompression` — unchanged
- `Planner` — unchanged
- `Runtime` — unchanged
- `AgentLoop` — unchanged
- `Pipeline` — unchanged
- `PromptAssemblyTimeline` — unchanged
- `PromptAssemblyTimelineEntry` — unchanged
- `PromptAssemblyTimelineBuilder` — unchanged
- `DefaultPromptAssemblyTimelineBuilder` — unchanged
- Prompt output — unchanged (metadata only, no prompt injection)

---

## Consequences

### Positive

1. **Timeline produced** — the timeline builder is now invoked by production code
2. **Additive** — all existing metadata fields preserved
3. **Backward compatible** — optional field, no breaking changes
4. **No prompt changes** — metadata only
5. **Complete trace pipeline** — trace → traceDiff → traceRendered → traceExported → timeline all now consumed

### Negative

None.

### Neutral

1. Timeline is a single-build snapshot (no history yet)
2. Timeline is generated only when both the trace builder and timeline builder are configured
3. The timeline contains exactly one entry with index 0 and the current trace

---

## Verification

- **TypeScript**: 0 errors
- **ESLint**: 0 errors
- **Existing tests**: All pass (zero modifications)
- **New tests**: `PromptAssemblyTimelineConsumption.test.ts` with 60+ test cases
  - BuilderOptions (3 tests)
  - Timeline Invocation (5 tests)
  - Metadata Creation (5 tests)
  - Metadata Coexistence (12 tests)
  - Deterministic (3 tests)
  - Stateless (2 tests)
  - Pure (3 tests)
  - Legacy Constructor (3 tests)
  - No Prompt Changes (4 tests)
  - Compatibility (4 tests)
  - Timeline Validation (5 tests)
- **No breaking changes** to any Public API
- **`timeline` stored** in `metadata.promptAssembly.timeline`
- **No prompt output changes** — verified by tests

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
- WO-S5-066 — Prompt Assembly Timeline Foundation (ADR-0113)
- WO-S5-067 — This Work Order
- `packages/ai/src/prompt/BuilderOptions.ts`
- `packages/ai/src/prompt/DefaultPromptBuilder.ts`
- `packages/ai/src/__tests__/PromptAssemblyTimelineConsumption.test.ts`