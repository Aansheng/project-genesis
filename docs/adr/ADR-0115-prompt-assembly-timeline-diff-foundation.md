# ADR-0115: Prompt Assembly Timeline Diff Foundation

**Status:** Accepted  
**Date:** Sprint 5  
**Work Order:** WO-S5-068  
**Architecture Version:** v1.02

---

## Context

The Prompt Assembly Timeline system (WO-S5-066, ADR-0113) introduced `PromptAssemblyTimelineEntry`, `PromptAssemblyTimeline`, `PromptAssemblyTimelineBuilder`, and `DefaultPromptAssemblyTimelineBuilder`. Timeline consumption (WO-S5-067, ADR-0114) wired the timeline builder into `DefaultPromptBuilder`, producing a timeline at `metadata.promptAssembly.timeline`.

However, there is currently **no way to compare two timelines**. Without a timeline diff model, consumers cannot determine what changed between a "before" timeline and an "after" timeline — for example, when comparing timelines from different builds, debugging sessions, or pipeline executions.

### Problem

1. **No timeline comparison** — two `PromptAssemblyTimeline` instances cannot be compared
2. **No diff model** — no `PromptAssemblyTimelineDiff` type exists
3. **No differ interface** — no abstraction for computing diffs between timelines
4. **No default implementation** — no canonical strategy for classifying timeline entry changes

---

## Decision

### PromptAssemblyTimelineDiff

Introduce a pure data interface representing the result of comparing two timelines:

```typescript
export interface PromptAssemblyTimelineDiff {
  readonly added: readonly number[]
  readonly removed: readonly number[]
  readonly changed: readonly number[]
}
```

- `added` — entry indexes present only in the "after" timeline
- `removed` — entry indexes present only in the "before" timeline
- `changed` — entry indexes present in both timelines but with different trace references
- All fields are `readonly` arrays of numbers (entry indexes)
- Immutable by convention — all properties are `readonly`

### PromptAssemblyTimelineDiffer

Introduce a service interface for computing a diff between two timelines:

```typescript
export interface PromptAssemblyTimelineDiffer {
  diff(
    before: PromptAssemblyTimeline,
    after: PromptAssemblyTimeline,
  ): PromptAssemblyTimelineDiff
}
```

- Pure: same before/after always produces same diff
- Stateless: no internal state between calls
- Deterministic: no randomness or external factors
- No side effects: does not modify either timeline

### DefaultPromptAssemblyTimelineDiffer

Default implementation with the following algorithm:

1. Build a `Set` of entry indexes from each timeline for O(1) membership tests
2. Build a `Map` of index → entry for the "after" timeline for O(1) retrieval
3. **Added**: iterate "after" entries, check if index is missing in "before"
4. **Removed**: iterate "before" entries, check if index is missing in "after"
5. **Changed**: iterate "before" entries, check if matching index in "after" has a different trace reference (using `!==`)
6. Results preserve encounter order from their respective source timelines — no sorting

Properties:
- Pure — same inputs always produce same output
- Stateless — no internal state between calls
- Deterministic — no randomness or external factors
- Immutable — never modifies either input; result object and all arrays are `Object.frozen`
- No sorting — results preserve encounter order from source timelines
- Zero dependencies on Planner, Runtime, Provider, Memory, AgentLoop, or Pipeline

### No Consumer Changes

This work item is **foundation only**. No changes to:
- `PromptBuilder`
- `BuilderOptions`
- `DefaultPromptBuilder`
- `Runtime`
- `Planner`
- `Pipeline`
- `AgentLoop`
- `PromptAssemblyTimeline`
- `PromptAssemblyTimelineEntry`
- `PromptAssemblyTimelineBuilder`
- `DefaultPromptAssemblyTimelineBuilder`

No metadata changes. No prompt changes.

---

## Consequences

### Positive

1. **Timeline comparison** — two timelines can now be compared structurally
2. **Foundation complete** — timeline diff infrastructure exists for future consumption
3. **Additive** — no existing code modified
4. **Backward compatible** — no breaking changes to any Public API
5. **Zero new dependencies** — only depends on existing timeline types

### Negative

None.

### Neutral

1. Foundation only — no consumption in `DefaultPromptBuilder` yet
2. Trace reference comparison uses `!==` (reference identity), not deep equality
3. Changed entries require the same index in both timelines with different trace objects

---

## Verification

- **TypeScript**: 0 errors
- **ESLint**: 0 errors
- **Existing tests**: All pass (zero modifications)
- **New tests**: `PromptAssemblyTimelineDiffFoundation.test.ts` with 90+ test cases
  - Interface Contract — TimelineDiff (5 tests)
  - Interface Contract — TimelineDiffer (5 tests)
  - Added — single (2 tests)
  - Added — multiple (2 tests)
  - Added — order preserved (2 tests)
  - Removed — single (2 tests)
  - Removed — multiple (2 tests)
  - Removed — order preserved (2 tests)
  - Changed — single (2 tests)
  - Changed — multiple (2 tests)
  - Changed — mixed (2 tests)
  - Unchanged (3 tests)
  - Empty Timelines (4 tests)
  - Combined Changes (4 tests)
  - Deterministic (4 tests)
  - Stateless (4 tests)
  - Pure (5 tests)
  - Immutable (6 tests)
  - Export Validation (8 tests)
  - Architecture Compliance (10 tests)
  - Compatibility — RetryPlanner (1 test)
  - Compatibility — ToolCallPlanner (1 test)
  - Compatibility — Streaming (1 test)
  - Compatibility — AgentLoop (1 test)
  - Edge Cases (6 tests)
- **No breaking changes** to any Public API
- **No metadata changes**
- **No prompt changes**

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
- WO-S5-068 — This Work Order
- `packages/ai/src/strategy/PromptAssemblyTimelineDiff.ts`
- `packages/ai/src/strategy/PromptAssemblyTimelineDiffer.ts`
- `packages/ai/src/strategy/DefaultPromptAssemblyTimelineDiffer.ts`
