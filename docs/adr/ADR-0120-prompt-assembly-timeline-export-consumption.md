# ADR-0120: Prompt Assembly Timeline Export Consumption

**Status:** Accepted  
**Date:** Sprint 5  
**Work Order:** WO-S5-073  
**Architecture Version:** v1.07

---

## Context

The Prompt Assembly Timeline Export Foundation (WO-S5-072, ADR-0119) introduced `PromptAssemblyTimelineExporter` and `DefaultPromptAssemblyTimelineExporter` — but they were **not consumed** by `DefaultPromptBuilder`. The timeline exporter existed, yet no production code produced a `timelineExported` in metadata.

### Problem

1. **No timeline export** — the timeline exporter domain model existed but was never invoked
2. **No metadata field** — `metadata.promptAssembly.timelineExported` did not exist
3. **Foundation not consumable** — the timeline exporter was orphaned

---

## Decision

### BuilderOptions

Add an optional field:

```typescript
promptAssemblyTimelineExporter?: PromptAssemblyTimelineExporter
```

- Backward compatible — all existing fields unchanged
- Optional — omitting it produces no timeline export

### DefaultPromptBuilder

Add a private field wired from `BuilderOptions`:

```typescript
private readonly promptAssemblyTimelineExporter?: PromptAssemblyTimelineExporter
```

Legacy constructor path wires it as `undefined`.

### New Phase — 0.959976

Inserted between Phase 0.959975 (PromptAssemblyTimelineRenderer) and Phase 0.96 (PromptAssemblyStrategyResolver):

```text
Phase 0.959975 TimelineRenderer
Phase 0.959976 TimelineExporter    ← NEW
Phase 0.96     PromptAssemblyStrategyResolver
```

### Logic

When both `timeline !== undefined` and `this.promptAssemblyTimelineExporter !== undefined`:

```typescript
timelineExported = this.promptAssemblyTimelineExporter.export(timeline)
```

Stored at `metadata.promptAssembly.timelineExported`.

### Metadata Rules

- `timelineExported` is additive — never overwrites existing fields
- Coexists with all existing metadata: timeline, timelineDiff, timelineRendered, trace, traceDiff, traceRendered, traceExported, snapshot, inspector, inspectorRendered, inspectorExported, plan, optimizedPlan, planDiff, planRendered, strategy, strategySelection
- Not injected into prompt output — metadata only

### No Consumer Changes Beyond BuilderOptions

This work item is **consumption only**. No changes to:
- `PromptRenderer`
- `PromptCompression`
- `Runtime`
- `Planner`
- `Pipeline`
- `AgentLoop`
- `PromptAssemblyTimeline`
- `PromptAssemblyTimelineBuilder`
- `DefaultPromptAssemblyTimelineBuilder`
- `PromptAssemblyTimelineExporter`
- `DefaultPromptAssemblyTimelineExporter`

---

## Consequences

### Positive

1. **Timeline export generated** — `timelineExported` is now stored in metadata during prompt building
2. **Backward compatible** — no breaking changes to any public API
3. **All metadata coexists** — `timelineExported` is additive, never overwrites
4. **No prompt changes** — timeline export is metadata-only
5. **Tested** — 60+ tests covering BuilderOptions, exporter invocation, metadata creation, metadata coexistence, determinism, statelessness, purity, legacy constructor, no prompt changes, compatibility, and export validation

### Negative

None.

### Risks

None.

---

## Compliance

- **TypeScript 0 errors** — verified
- **ESLint 0 errors** — verified
- **Existing tests all pass** — verified
- **60+ new tests pass** — 60+ tests in `PromptAssemblyTimelineExportConsumption.test.ts`
- **No prompt changes** — metadata only
- **No API breaking changes** — consumption only
- **Architecture version** v1.06 → v1.07