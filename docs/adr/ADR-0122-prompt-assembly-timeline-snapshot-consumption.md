# ADR-0122: Prompt Assembly Timeline Snapshot Consumption

**Status:** Accepted  
**Date:** Sprint 5  
**Work Order:** WO-S5-075  
**Architecture Version:** v1.09

---

## Context

The Prompt Assembly Timeline Snapshot Foundation (WO-S5-074, ADR-0121) introduced `PromptAssemblyTimelineSnapshot`, `PromptAssemblyTimelineSnapshotBuilder`, and `DefaultPromptAssemblyTimelineSnapshotBuilder` — but they were **not consumed** by `DefaultPromptBuilder`. The snapshot builder existed, yet no production code produced a `timelineSnapshot` in metadata.

### Problem

1. **No timeline snapshot** — the snapshot builder domain model existed but was never invoked
2. **No metadata field** — `metadata.promptAssembly.timelineSnapshot` did not exist
3. **Foundation not consumable** — the snapshot builder was orphaned

---

## Decision

### BuilderOptions

Add an optional field:

```typescript
promptAssemblyTimelineSnapshotBuilder?: PromptAssemblyTimelineSnapshotBuilder
```

- Backward compatible — all existing fields unchanged
- Optional — omitting it produces no timeline snapshot

### DefaultPromptBuilder

Add a private field wired from `BuilderOptions`:

```typescript
private readonly promptAssemblyTimelineSnapshotBuilder?: PromptAssemblyTimelineSnapshotBuilder
```

Legacy constructor path wires it as `undefined`.

### New Phase — 0.9599765

Inserted between Phase 0.959976 (PromptAssemblyTimelineExporter) and Phase 0.96 (PromptAssemblyStrategyResolver):

```text
Phase 0.959976  TimelineExporter
Phase 0.9599765 TimelineSnapshotBuilder  ← NEW
Phase 0.96      PromptAssemblyStrategyResolver
```

### Logic

When both `timeline !== undefined` and `this.promptAssemblyTimelineSnapshotBuilder !== undefined`:

```typescript
timelineSnapshot = this.promptAssemblyTimelineSnapshotBuilder.build(
  timeline,
  { timelineRendered, timelineExported },
)
```

Stored at `metadata.promptAssembly.timelineSnapshot`.

### Metadata Rules

- `timelineSnapshot` is additive — never overwrites existing fields
- Coexists with all existing metadata: timeline, timelineDiff, timelineRendered, timelineExported, trace, traceDiff, traceRendered, traceExported, snapshot, inspector, inspectorRendered, inspectorExported, plan, optimizedPlan, planDiff, planRendered, strategy, strategySelection
- Not injected into prompt output — metadata only
- Metadata passed to builder includes both `timelineRendered` and `timelineExported` when available

### No Consumer Changes Beyond BuilderOptions

This work item is **consumption only**. No changes to:
- `PromptRenderer`
- `PromptCompression`
- `Runtime`
- `Planner`
- `Pipeline`
- `AgentLoop`
- `PromptAssemblyTimelineSnapshot`
- `PromptAssemblyTimelineSnapshotBuilder`
- `DefaultPromptAssemblyTimelineSnapshotBuilder`

---

## Consequences

### Positive

1. **Timeline snapshot generated** — `timelineSnapshot` is now stored in metadata during prompt building
2. **Backward compatible** — no breaking changes to any public API
3. **All metadata coexists** — `timelineSnapshot` is additive, never overwrites
4. **Metadata includes rendered/exported** — snapshot builder receives both for optional extraction
5. **No prompt changes** — timeline snapshot is metadata-only
6. **Tested** — 67 tests covering BuilderOptions, builder invocation, metadata creation, metadata coexistence, determinism, statelessness, purity, legacy constructor, no prompt changes, compatibility, and snapshot validation

### Negative

None.

### Risks

None.

---

## Compliance

- **TypeScript 0 errors** — verified
- **ESLint 0 errors** — verified
- **Existing tests all pass** — verified
- **67 new tests pass** — 67 tests in `PromptAssemblyTimelineSnapshotConsumption.test.ts`
- **No prompt changes** — metadata only
- **No API breaking changes** — consumption only
- **Architecture version** v1.08 → v1.09