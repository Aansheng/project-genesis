# ADR-0121: Prompt Assembly Timeline Snapshot Foundation

**Status:** Accepted  
**Date:** Sprint 5  
**Work Order:** WO-S5-074  
**Architecture Version:** v1.08

---

## Context

The Prompt Assembly Timeline system provides multi-build timeline support (WO-S5-066, ADR-0113) with builders, differ, renderer, and exporter — all fully consumed by `DefaultPromptBuilder`. However, there is currently **no condensed summary representation** of the timeline.

Downstream consumers (observers, loggers, debug UIs) that only need high-level timeline metadata — entry count, first/last strategy, strategy list, and optional rendered/exported text — must currently traverse the full entry structure.

### Problem

1. **No condensed snapshot** — timeline consumers must parse the full entry array
2. **No snapshot builder** — no abstraction for extracting summary metadata
3. **No default implementation** — no canonical strategy for snapshot creation

---

## Decision

### PromptAssemblyTimelineSnapshot

Introduce a condensed snapshot interface:

```typescript
export interface PromptAssemblyTimelineSnapshot {
  readonly entryCount?: number
  readonly firstStrategy?: string
  readonly lastStrategy?: string
  readonly strategies?: readonly string[]
  readonly rendered?: string
  readonly exported?: string
}
```

- All fields are optional (undefined when timeline is empty)
- Pure data — no methods, no behavior
- Immutable — all fields readonly

### PromptAssemblyTimelineSnapshotBuilder

Introduce a service interface:

```typescript
export interface PromptAssemblyTimelineSnapshotBuilder {
  build(
    timeline: PromptAssemblyTimeline,
    metadata?: Record<string, unknown>,
  ): PromptAssemblyTimelineSnapshot
}
```

- Pure: same timeline + metadata always produces same snapshot
- Stateless: no internal state between calls
- Deterministic: no randomness or external factors
- No side effects: does not modify the timeline or metadata

### DefaultPromptAssemblyTimelineSnapshotBuilder

Default implementation with the following extraction rules:

**From timeline entries:**
- `entryCount`: number of entries (undefined when empty)
- `firstStrategy`: strategy name of first entry (undefined when empty)
- `lastStrategy`: strategy name of last entry (undefined when empty)
- `strategies`: ordered list of all strategy names (undefined when empty)
- Strategy name extracted from `entry.trace.strategy?.name`
- When strategy or name is missing: `"unknown"` is used

**From optional metadata:**
- `timelineRendered` → `snapshot.rendered`
- `timelineExported` → `snapshot.exported`
- Unknown metadata keys silently ignored

### No Consumer Changes

This work item is **foundation only**. No changes to:
- `PromptBuilder`
- `BuilderOptions`
- `DefaultPromptBuilder`
- `Runtime`
- `Planner`
- `Pipeline`
- `AgentLoop`
- Any existing PromptAssemblyTimeline types or implementations

No metadata changes. No prompt changes.

---

## Consequences

### Positive

1. **Condensed snapshot** — lightweight timeline summary without full entry traversal
2. **Metadata extraction** — optional rendered/exported fields from metadata
3. **Foundation complete** — snapshot infrastructure exists for future consumption
4. **Backward compatible** — no breaking changes to any public API
5. **No dependency creep** — no external dependencies
6. **Tested** — 98 tests covering interface contract, empty timeline, single entry, multiple entries, metadata extraction, determinism, statelessness, purity, immutability, export validation, architecture compliance, compatibility, and edge cases

### Negative

None.

### Risks

None.

---

## Compliance

- **TypeScript 0 errors** — verified
- **ESLint 0 errors** — verified
- **Existing tests all pass** — verified
- **98 new tests pass** — 98 tests in `PromptAssemblyTimelineSnapshotFoundation.test.ts`
- **No prompt changes** — foundation only
- **No metadata changes** — foundation only
- **No API breaking changes** — foundation only
- **Architecture version** v1.07 → v1.08