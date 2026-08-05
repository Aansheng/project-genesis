# ADR-0116: Prompt Assembly Timeline Diff Consumption

**Status:** Accepted  
**Date:** Sprint 5  
**Work Order:** WO-S5-069  
**Architecture Version:** v1.03

---

## Context

The Prompt Assembly Timeline Diff Foundation (WO-S5-068, ADR-0115) introduced `PromptAssemblyTimelineDiff`, `PromptAssemblyTimelineDiffer`, and `DefaultPromptAssemblyTimelineDiffer` — but they were **not consumed** by `DefaultPromptBuilder`. The timeline differ existed, yet no production code produced a `timelineDiff` in metadata.

### Problem

1. **No timeline diff produced** — the timeline diff domain model existed but was never invoked
2. **No metadata field** — `metadata.promptAssembly.timelineDiff` did not exist
3. **Foundation not consumable** — the timeline differ was orphaned

---

## Decision

### BuilderOptions

Add an optional field:

```typescript
promptAssemblyTimelineDiffer?: PromptAssemblyTimelineDiffer
```

- Backward compatible — all existing fields unchanged
- Optional — omitting it produces no timeline diff

### DefaultPromptBuilder

Add a private field wired from `BuilderOptions`:

```typescript
private readonly promptAssemblyTimelineDiffer?: PromptAssemblyTimelineDiffer
```

Legacy constructor path wires it as `undefined`.

### New Phase — 0.95997

Inserted between Phase 0.95996 (PromptAssemblyTimelineBuilder) and Phase 0.96 (PromptAssemblyStrategyResolver):

```text
Phase 0.95996
PromptAssemblyTimelineBuilder
    ↓
timeline
    ↓
Phase 0.95997
PromptAssemblyTimelineDiffer.diff({ entries: [] }, timeline)
    ↓
timelineDiff
    ↓
Phase 0.96 (PromptAssemblyStrategyResolver)
```

The differ receives an empty timeline as baseline and the built timeline as comparison. This results in all entries being classified as "added" — matching the pattern already used by PromptAssemblyTraceDiffer consumption.

Executed only when:
- `timeline !== undefined` (timeline builder produced a timeline)
- `this.promptAssemblyTimelineDiffer` exists

### Metadata

Stored only when both timeline and differ are present:

```typescript
metadata.promptAssembly.timelineDiff  // PromptAssemblyTimelineDiff
```

### Coexistence

`timelineDiff` is **additive** — it coexists with all existing fields including `timeline`, `trace`, `traceDiff`, `traceRendered`, `traceExported`, `snapshot`, `inspector`, `inspectorRendered`, `inspectorExported`, `plan`, `optimizedPlan`, `planDiff`, `strategy`, and `strategySelection`.

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
- `PromptAssemblyTimelineDiffer` — unchanged
- `DefaultPromptAssemblyTimelineDiffer` — unchanged
- Prompt output — unchanged (metadata only, no prompt injection)

---

## Consequences

### Positive

1. **Timeline diff produced** — the timeline differ is now invoked by production code
2. **Additive** — all existing metadata fields preserved
3. **Backward compatible** — optional field, no breaking changes
4. **No prompt changes** — metadata only
5. **Complete trace-to-timeline pipeline** — trace → traceDiff → traceRendered → traceExported → timeline → timelineDiff all now consumed

### Negative

None.

### Neutral

1. Timeline diff is a single-build snapshot (no history yet)
2. Timeline diff is generated only when both the timeline builder and timeline differ are configured
3. Baseline is `{ entries: [] }` — all entries are reported as "added"

---

## Verification

- **TypeScript**: 0 errors
- **ESLint**: 0 errors
- **Existing tests**: All pass (zero modifications)
- **New tests**: `PromptAssemblyTimelineDiffConsumption.test.ts` with 60 test cases
  - BuilderOptions (5 tests)
  - Differ Invocation (7 tests)
  - Metadata Creation (6 tests)
  - Metadata Coexistence — timeline (1 test)
  - Metadata Coexistence — trace (1 test)
  - Metadata Coexistence — traceDiff (1 test)
  - Metadata Coexistence — traceRendered (1 test)
  - Metadata Coexistence — traceExported (1 test)
  - Metadata Coexistence — snapshot (1 test)
  - Metadata Coexistence — inspector (1 test)
  - Metadata Coexistence — inspectorRendered (1 test)
  - Metadata Coexistence — inspectorExported (1 test)
  - Metadata Coexistence — plan (1 test)
  - Metadata Coexistence — optimizedPlan (1 test)
  - Metadata Coexistence — planDiff (1 test)
  - Metadata Coexistence — strategy (1 test)
  - Metadata Coexistence — strategySelection (1 test)
  - Metadata Coexistence — all fields (1 test)
  - Deterministic (3 tests)
  - Stateless (3 tests)
  - Pure (3 tests)
  - Legacy Constructor (4 tests)
  - No Prompt Changes (4 tests)
  - Compatibility — RetryPlanner (1 test)
  - Compatibility — ToolCallPlanner (1 test)
  - Compatibility — Streaming (1 test)
  - Compatibility — AgentLoop (1 test)
  - Timeline Diff Validation (6 tests)
- **No breaking changes** to any Public API
- **`timelineDiff` stored** in `metadata.promptAssembly.timelineDiff`
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
- WO-S5-067 — Prompt Assembly Timeline Consumption (ADR-0114)
- WO-S5-068 — Prompt Assembly Timeline Diff Foundation (ADR-0115)
- WO-S5-069 — This Work Order
- `packages/ai/src/prompt/BuilderOptions.ts`
- `packages/ai/src/prompt/DefaultPromptBuilder.ts`
- `packages/ai/src/__tests__/PromptAssemblyTimelineDiffConsumption.test.ts`