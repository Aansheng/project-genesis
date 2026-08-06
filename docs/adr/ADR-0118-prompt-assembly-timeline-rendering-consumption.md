# ADR-0118: Prompt Assembly Timeline Renderer Consumption

**Status:** Accepted  
**Date:** Sprint 5  
**Work Order:** WO-S5-071  
**Architecture Version:** v1.05

---

## Context

The Prompt Assembly Timeline Renderer Foundation (WO-S5-070, ADR-0117) introduced `PromptAssemblyTimelineRenderer` and `DefaultPromptAssemblyTimelineRenderer` — but they were **not consumed** by `DefaultPromptBuilder`. The timeline renderer existed, yet no production code produced a `timelineRendered` in metadata.

### Problem

1. **No timeline rendered** — the timeline renderer domain model existed but was never invoked
2. **No metadata field** — `metadata.promptAssembly.timelineRendered` did not exist
3. **Foundation not consumable** — the timeline renderer was orphaned

---

## Decision

### BuilderOptions

Add an optional field:

```typescript
promptAssemblyTimelineRenderer?: PromptAssemblyTimelineRenderer
```

- Backward compatible — all existing fields unchanged
- Optional — omitting it produces no timeline rendered

### DefaultPromptBuilder

Add a private field wired from `BuilderOptions`:

```typescript
private readonly promptAssemblyTimelineRenderer?: PromptAssemblyTimelineRenderer
```

Legacy constructor path wires it as `undefined`.

### New Phase — 0.959975

Inserted between Phase 0.95997 (PromptAssemblyTimelineDiffer) and Phase 0.96 (PromptAssemblyStrategyResolver):

```text
Phase 0.95997
PromptAssemblyTimelineDiffer
    ↓
timelineDiff
    ↓
Phase 0.959975
PromptAssemblyTimelineRenderer.render(timeline)
    ↓
timelineRendered
    ↓
Phase 0.96 (PromptAssemblyStrategyResolver)
```

Executed only when:
- `timeline !== undefined` (timeline builder produced a timeline)
- `this.promptAssemblyTimelineRenderer` exists

### Metadata

Stored only when both timeline and renderer are present:

```typescript
metadata.promptAssembly.timelineRendered  // string
```

### Coexistence

`timelineRendered` is **additive** — it coexists with all existing fields including `timeline`, `timelineDiff`, `trace`, `traceDiff`, `traceRendered`, `traceExported`, `snapshot`, `inspector`, `plan`, `optimizedPlan`, `planDiff`, `planRendered`, `strategy`, and `strategySelection`.

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
- `PromptAssemblyTimelineRenderer` — unchanged
- `DefaultPromptAssemblyTimelineRenderer` — unchanged
- `PromptAssemblyTimelineDiff` — unchanged
- `PromptAssemblyTimelineDiffer` — unchanged
- `DefaultPromptAssemblyTimelineDiffer` — unchanged
- Prompt output — unchanged (metadata only, no prompt injection)

---

## Consequences

### Positive

1. **Timeline rendered** — the timeline renderer is now invoked by production code
2. **Additive** — all existing metadata fields preserved
3. **Backward compatible** — optional field, no breaking changes
4. **No prompt changes** — metadata only
5. **Complete timeline pipeline** — timeline → timelineDiff → timelineRendered all now consumed

### Negative

None.

### Neutral

1. Timeline rendered is a single-build snapshot (no history yet)
2. Timeline rendered is generated only when both the timeline builder and timeline renderer are configured

---

## Verification

- **TypeScript**: 0 errors
- **ESLint**: 0 errors
- **Existing tests**: All pass (zero modifications)
- **New tests**: `PromptAssemblyTimelineRenderingConsumption.test.ts` with 60 test cases
  - BuilderOptions (5 tests)
  - Renderer Invocation (6 tests)
  - Metadata Creation (5 tests)
  - Metadata Coexistence — timeline (1 test)
  - Metadata Coexistence — timelineDiff (1 test)
  - Metadata Coexistence — trace (1 test)
  - Metadata Coexistence — traceDiff (1 test)
  - Metadata Coexistence — traceRendered (1 test)
  - Metadata Coexistence — traceExported (1 test)
  - Metadata Coexistence — snapshot (1 test)
  - Metadata Coexistence — inspector (1 test)
  - Metadata Coexistence — plan (1 test)
  - Metadata Coexistence — optimizedPlan (1 test)
  - Metadata Coexistence — planDiff (1 test)
  - Metadata Coexistence — planRendered (1 test)
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
  - Timeline Rendering Validation (8 tests)
- **No breaking changes** to any Public API
- **`timelineRendered` stored** in `metadata.promptAssembly.timelineRendered`
- **No prompt output changes** — verified by tests

---

## References

- WO-S5-066 — Prompt Assembly Timeline Foundation (ADR-0113)
- WO-S5-067 — Prompt Assembly Timeline Consumption (ADR-0114)
- WO-S5-068 — Prompt Assembly Timeline Diff Foundation (ADR-0115)
- WO-S5-069 — Prompt Assembly Timeline Diff Consumption (ADR-0116)
- WO-S5-070 — Prompt Assembly Timeline Renderer Foundation (ADR-0117)
- WO-S5-071 — This Work Order
- `packages/ai/src/prompt/BuilderOptions.ts`
- `packages/ai/src/prompt/DefaultPromptBuilder.ts`
- `packages/ai/src/__tests__/PromptAssemblyTimelineRenderingConsumption.test.ts`